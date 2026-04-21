import { LightningElement, track, wire, api } from 'lwc';
//Import apex method 
import USER_ID from '@salesforce/user/Id';
import fetchFacilitiess from '@salesforce/apex/StaffController.fetchStaffs';
import fetchStaff from '@salesforce/apex/StaffController.fetchStaff';
import createUser from '@salesforce/apex/PortalUserController.createPortalUserStaff';
import updatestaff from '@salesforce/apex/PortalUserController.createstafffromstaffDataCommunity';
//import updateStaff from '@salesforce/apex/StaffController.updateStaff';
//import fetchStaffList from '@salesforce/apex/StaffController.fetchStaffList';
import statusStaff from '@salesforce/apex/StaffController.statusStaff';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import My_Resource from "@salesforce/resourceUrl/myResource";
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import insertPreTax from '@salesforce/apex/StaffController.insertPreTax';
import { deleteRecord } from 'lightning/uiRecordApi';
import getShadAwards from '@salesforce/apex/StaffController.getShadAwards';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';
import CURRENT_USER_ID from '@salesforce/user/Id';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';
import getNursingAwrds from '@salesforce/apex/StaffController.getNursingAwrds';
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
import createStaffRoles from '@salesforce/apex/StaffRoleController.createStaffRoles';
import getChildcareAwrds from '@salesforce/apex/StaffController.getChildcareAwrds';
import upsertStaffFacilities from '@salesforce/apex/staffFacilityHandler.upsertStaffFacilities';
import FIXED_ONE from '@salesforce/label/c.SCHADS_BrokenShift_1_Break_Fixed';
import FIXED_TWO from '@salesforce/label/c.SCHADS_BrokenShift_2_Break_Fixed';

// Percentages
import PERCENT_ONE from '@salesforce/label/c.SCHADS_BrokenShift_1_Break_Percent';
import PERCENT_TWO from '@salesforce/label/c.SCHADS_BrokenShift_2_Break_Percent';

//import { RefreshEvent } from 'lightning/refresh'; 

const actions = [ 
    { label: 'View Document', name: 'view_details' },    
    { label: 'Edit', name: 'edit' }   ,
    { label: 'Delete', name: 'delete' }]


const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};


export default class StaffDataCommunity extends NavigationMixin(LightningElement) {
    employee = My_Resource + '/myResource/images/employee.svg';
    // JS Properties
    @track selectedEmploymentRole;
    @track address;
    @track cardFlag=true;
    @track portalStaffId = '';
    recordId;
    subscription = {};
    CHANNEL_NAME = '/event/RefreshDataTable__e';
    records = []; //All records available in the data table
    records2 = [];
    totalRecords = 0; //Total no.of records
    pageSize; //No.of records to be displayed per page
    totalPages; //Total no.of pages
    pageNumber = 1; //Page number       
    @track refreshTable = [];
    @track recordsToDisplay = [];
    @api selectedName;
    @api facilityButton;
    @api xeroStaffFirstName;
    @api xeroStaffLastName;
    @api xeroStaffEmail;
    @api xeroId;
    @api createStaffForXeroOnly;
    @api createStaffForXeroAll;
    @track orgNam = '';
    @track visible = false;
    @track fname = '';
    @track lname = '';
    @track firstname='';
    @track lastname ='';
    @track blurflag=false;
    @track staffEditFlag=false;
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalcode;
    @track name;
    @track status;
    @track lastname1;
    @track state;
    @track satffDataJasonformat={};
    @track heading;
    @track isattachError=false;
    @track isFileAttached=false
    @track selectedFilesToUpload = []; //store selected files
    @track showSpinner = false; //used for when to show spinner
    @track fileName;
    @track doc;
    @track fileSize;
    @track file; //holding file instance
    @track myFile;    
    @track fileType;//holding file type
    @track fileReaderObj;
    @track base64FileData; 
    @track ShowPretaxModal;
    @track parentStaffId;
    @track preTaxRecId='';
    @track accountRecList = [];
    activeSections = ['StaffDetails', 'Address', 'EmploymentDetails', 'staffDocumentation', 'InvoiceDetails', 'PreTaxDetails','PostTax','ApproversDetails','BankDetails','SuperannuationDetails','Leaves','TaxationDetails','EmergencyDetails'];
    @track showPreTaxRecordEditForm=false;
    @track totalPretaxvalue="Pre Tax Deduction - Total ";
    @track preTaxForSubmit;
    @track postTaxlabel='Post Tax Deduction - Total '
    @track postTaxLabelvalue=0;
    @track pretaxOne=0;
    @track  pretaxtwo=0;
    @track  pretaxThree=0;
    @track  pretaxFour=0;
    @track  pretaxFive=0;
    @track noRecordsFlag=false;
    @track submitButtonlabel;
    @api pageName;
    @track OrgNisationRoles;
    @track stafflabel='All';
    @track CreateUserflag = false;
    @track userCrearedflag = false;
    UserTypeValues = [];
    userId = USER_ID;
    @track selectedRole = '';
    @track selectedUserType = '';
    wiredresult;
    @track geoLocationStatus=false;
    @track fieldErrorMap = {};
    @track isOpen = false;//manendra for custom combo
    @track sectionFlags = {
        staffDetails: true,
        Addressdetails: false,
        EmploymentDetails: false,
        InvoiceDetails: false,
        TaxationDetails: false,
        PreTaxDeduction: false,
        PostTaxDeduction: false,
        EmergencyDetails: false,
        BankDetails: false,
        SuperannuationDetails: false,
        Leaves: false,
        ApproversDetails: false,
    };
    /*  praveen changes for nursing awards start*/
    @track typeOfService;
    @track isSchadsAwards=false;
    @track isNursingAwards=false;
    /*  praveen changes for nursing awards end*/
    @track facilityPreferredName;
    @track participantPreferredName;
    @track emailId;

    //Maheswari changes for child care awards
    @track isChildCareAwards=false;
    @track multiFacilityDroDownList=[];
    @track selctedMultipleFcailityValues=[];
    @track facilityDropDownOpen=false;
    @track roleDropDownForEmployment=false;
    @track selectedEmploymentRoleDisplayVlaue='';
    
    // // Icons for the toggle buttons
    // @track sectionIcons = {
    //     staffDetails: '\u2B9F', 
    //     Addressdetails: '\u2B9C',
    //     EmploymentDetails: '\u2B9C',
    //     InvoiceDetails: '\u2B9C',
    //     TaxationDetails: '\u2B9C',
    //     PreTaxDeduction: '\u2B9C',
    //     PostTaxDeduction: '\u2B9C',
    //     EmergencyDetails: '\u2B9C',
    //     BankDetails: '\u2B9C',
    //     SuperannuationDetails: '\u2B9C', 
    //     Leaves: '\u2B9C',
    //     ApproversDetails: '\u2B9C',
    // };




@track sectionIcons = {
  staffDetails: { ...ICON_DOWN },          // expanded by default

  Addressdetails: { ...ICON_LEFT },
  EmploymentDetails: { ...ICON_LEFT },
  InvoiceDetails: { ...ICON_LEFT },
  TaxationDetails: { ...ICON_LEFT },
  PreTaxDeduction: { ...ICON_LEFT },
  PostTaxDeduction: { ...ICON_LEFT },
  EmergencyDetails: { ...ICON_LEFT },
  BankDetails: { ...ICON_LEFT },
  SuperannuationDetails: { ...ICON_LEFT },
  Leaves: { ...ICON_LEFT },
  ApproversDetails: { ...ICON_LEFT },
};




    @track showDropdown = false;
    @track filteredOptions = [];
    @track noResults = false;
    @track Nationality = '';
    @track selectedLangs = [];
    @track selectedDropDownFacilityValue='';
    allNationalities = [
        'Afghan', 'American', 'Argentinian', 'Armenian', 'Australian', 'Azerbaijani', 'Bahraini', 'Bangladeshi', 
        'Bhutanese', 'Brazilian', 'British', 'Bruneian', 'Burmese', 'Cambodian', 'Canadian', 'Chilean', 'Chinese', 
        'Colombian', 'Cuban', 'Egyptian', 'Emirati', 'Fijian', 'Filipino', 'French', 'German', 'Ghanaian', 'Greek', 
        'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Israeli', 'Italian', 'Jamaican', 'Japanese', 'Jordanian', 'Kazakhstani', 
        'Kenyan', 'Kuwaiti', 'Kyrgyzstani', 'Laotian', 'Lebanese', 'Malaysian', 'Maldivian', 'Mexican', 'Mongolian', 'Moroccan', 
        'Nepali', 'New Zealander', 'Nigerian', 'North Korean', 'Norwegian', 'Omani', 'Pakistani', 'Peruvian', 'Portuguese', 'Qatari', 
        'Russian', 'Samoan', 'Saudi', 'Singaporean', 'South African', 'South Korean', 'Spanish', 'Sri Lankan', 'Swedish', 'Syrian', 
        'Taiwanese', 'Tajikistani', 'Thai', 'Tongan', 'Turkish', 'Uzbekistani', 'Vietnamese', 'Yemeni'
        ];

    @track LANGUAGE_OPTIONS = [
    'Arabic', 'Armenian', 'Azerbaijani', 'Bengali', 'Burmese', 'Dhivehi', 'Dzongkha',
    'English', 'Filipino', 'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Indonesian',
    'Italian', 'Japanese', 'Kazakh', 'Khmer', 'Korean', 'Kyrgyz', 'Lao', 'Malay', 'Mandarin',
    'Mongolian', 'Nepali', 'Persian', 'Portuguese', 'Russian', 'Samoan', 'Sinhala', 'Swahili',
    'Thai', 'Tongan', 'Turkish', 'Urdu', 'Uzbek', 'Vietnamese'
    ];

    @track selectedLangs = [];
    @track isExpanded = false;
    @track isMultiStaffUpload= false;
    @track LeaveEnable;
    @track isFirstNameEntered = false;


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
        // this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
        this.sectionIcons[sectionId] =
        sectionElement.classList.contains('hidden-section')
            ? { ...ICON_LEFT }
            : { ...ICON_DOWN };
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
        if (this.userTypeRole === 'NDIS Org Admin') {
            return this.roleOptions;
        } else {
            return this.roleOptions.filter(role => 
                role.value === 'Portal Account Partner Manager' || 
                role.value === 'Portal Account Partner User'
            );
        }
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

    handleErrorCss(event) {
        const field = event.target.fieldName;
        const isValid = event.target.reportValidity();
        console.log('isValid',isValid);
        const value = event.target.value;

        this.fieldErrorMap[field] = !isValid;
        if (field === 'Email_Address__c') {
            this.emailId = value; 
        }
    }

    getFieldClass(fieldName) {
        return this.fieldErrorMap[fieldName] ? 'floating-label1' : 'floating-label';
    }
    get emailClass() {
        return this.getFieldClass('Email_Address__c');
    }
     get DateOfBirthClass() {
        return this.getFieldClass('Date_Of_Birth__c');
    }

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    //manendra
    handleHourlyRateChange(event) {
    const fieldName = event.target.name;
    const value = event.target.value;
    console.log(`Raw value from input ${fieldName}:`, value, typeof value);

    // Convert to decimal
    const decimalValue = value !== undefined && value !== null && value !== '' ? parseFloat(value) : null;
    console.log(`Converted decimal ${fieldName}:`, decimalValue, typeof decimalValue);

    switch(fieldName) {
        case 'genralHourlyRate':
            this.genralHourlyRate = decimalValue;
            break;
        case 'sturdayHourlyRate':
            this.sturdayHourlyRate = decimalValue;
            break;
        case 'sundayhourlyRate':
            this.sundayhourlyRate = decimalValue;
            break;
        case 'publicHolidayRate':
            this.publicHolidayRate = decimalValue;
            break;
        case 'afterNoonShiftRate':
            this.afterNoonShiftRate = decimalValue;
            break;
        case 'nightShiftRate':
            this.nightShiftRate = decimalValue;
            break;
        case 'sleepoverAllowance':
            this.sleepoverAllowance = decimalValue;
            break;
    }
}
    get options() {
        return [
            { label: 'Visa Status', value: 'Visa Status' },
            { label: 'Drivers Licence', value: 'Drivers Licence' },
            { label: 'Working With Vulnerable People', value: 'Working With Vulnerable People' }, 
            { label: 'Covid Immunisation', value: 'Covid Immunisation' },
            { label: 'Registration', value: 'Registration' },
            { label: 'Certificate', value: 'Certificate' },
            { label: 'Other', value: 'Other' },
        ];
    }

@track showStaffDocumentSection;
@api whatId;

@track staffDocumentMap={};
@track showDocumentTable;
@track  DocumentTableData=[];
@track AddDocButtonDisable= false;
@track typeOfUser;
@track facilityOptions=[];
@track selectedFacilities=[];
@track userFacilities=[];
@track finalListFacilities=[];
@track orginalData=[];
@track isModalOpen = false;
@track currentUrl;    
@track ictUserType=false;
@track categoryType;
@track jobType;
@track classificationLevel;
@track classificationPayType;
@track genralHourlyRate=0;
@track sturdayHourlyRat=0;
@track sundayhourlyRate=0;
@track publicHolidayRate=0;
@track afterNoonShiftRate=0;
@track nightShiftRate=0;
@track sleepoverAllowance=0;  
@track isFixedcategory=false;
@track createdShiftRole;
@track includeSuperannuation = false;
@track superannuationValue;
@track paidBreak=true;
@track standardWeeklyRate=0;
@track setHoursAccess =false;
@track allowanceMethod = 'Fixed';
@track oneBreakAllowance = 0;
@track twoBreakAllowance = 0;
  @api
    openCreateEditStaff(staffId) {
        console.log('Participant: Opening  with ID', staffId);

        // ✅ Call the method on the super-child
        const createEdit = this.template.querySelector('c-create-edit-staff');
        if (createEdit) {
            createEdit.showStaffForm(staffId);
        }
    }
    

@track DocumentColumns = [
    {
        label: 'Doc No',
        fieldName: 'Name',
        initialWidth: 150                
    },
    {
        label: 'Type of Document',
        fieldName: 'Type__c',
        initialWidth: 200
        
        },{
        label: 'Comments',
        fieldName: 'Comments__c',
        initialWidth: 200
    },{
        label: 'Expiry Date',
        fieldName: 'Expiry_Date__c',
        type: 'date',
        typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"}, initialWidth: 200
        
        },
        {            
            type: 'action',
            label: 'Action',  
            initialWidth: 100,          
            typeAttributes: {
                rowActions: actions,
            }
        }
    ];
    // connectedCallback method called when the element is inserted into a document
    connectedCallback() {    
        this._handleOutsideClick = this.handleClickOutside.bind(this);
        window.addEventListener('click', this._handleOutsideClick);
        console.log('whatid from task'+this.whatId);
        this.StaffFacility = localStorage.getItem("defaultFacilityId") || "";
        this.fetchFacility(this.StaffFacility);


        console.log('Staff Facility ===>', this.StaffFacility);
        this.fetchRoleOptions();
     //   this.fetchMultiFaciltyOptions();
        refreshApex(this.wiredresult);
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        // Add responsive listener
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('keydown', this.handleKeyShortcut.bind(this));

        if(this.whatId){
            this.editstaffflag=true;
            this.adminFlag =false;
            this.cardFlag =false;
            this.listFlag = false;
            
            this.recordId=this.whatId;
            this.dispatchEvent(new CustomEvent('clearstaffid', {
                bubbles: true,
                composed: true
            }));
        
        }else{
            this.blurflag = true;
            this.recordId='';
            //Platform Event 
            subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
                console.log('Successfully subscribed to channel');
                this.subscription = response;
            });

            onError(error => {
                console.error('Received error from server: ', error);
            });
            // this.noRecordsFlag=true;
            console.log('Before Connected Callback>>'+this.selectedName);  
            organizationDetails().then(response => {          
                this.typeOfUser = response.listofPriceBook.Type_of_User__c;
                console.log('UseerCheckTYpe', this.typeOfUser);
                if(this.typeOfUser=='ICT User'){
                    this.ictUserType=true;
                    this.LeaveEnable=false;
                    console.log('Checkusertypee',this.typeOfUser);
                }else{
                    this.ictUserType=false;
                     this.LeaveEnable=true;
                    console.log('Checkusertypee2',this.typeOfUser);
                }
            });
 
        }
          if(this.createStaffForXeroOnly || this.createStaffForXeroAll){
            console.log('xeroStaffFirstName:', this.xeroStaffFirstName);
            console.log('xeroStaffLastName:', this.xeroStaffLastName);
            console.log('xeroStaffEmail:', this.xeroStaffEmail);
            console.log('StaffXeroId:', this.xeroId);
            console.log('createStaffForXeroOnly:', this.createStaffForXeroOnly);
            console.log('createStaffForXeroAll:', this.createStaffForXeroAll);
            this.handleCreateNewStaff();
            this.lastname1 =this.xeroStaffLastName || '';
            this.name =this.xeroStaffFirstName || '';
            this.emailId= this.xeroStaffEmail || '';
            this.cardFlag = false;
            this.listFlag = false;
            this.adminFlag =false;
            this.visible = false;
            console.log('finalListFacilities wired Called');
            refreshApex(this.wiredresult);
            console.log('finalListFacilities wired Ended');
            console.log('finalListFacilities: ', JSON.stringify(this.finalListFacilities));
        }

        this.filteredOptions = this.allNationalities.map(n => ({
            label: n,
            value: n
        }));

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
      get chevronIcon1() {
        return this.isOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }
     get chevronIcon() {
        return this.facilityDropDownOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }
     get chevronIcon2() {
        return this.isExpanded ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get selectedOptionClass() {
        return this.selectedRoleValues.length > 0 ? 'selected-text slds-truncate' : 'placeholder-text slds-truncate';
    }

    get displayText() {
    const roles = this.selectedRoleValues;

    console.log('selectedRoleValues ==> ', JSON.stringify(roles));

    if (!roles || roles.length === 0) {
        return 'Select Roles';
    }

    const displayLabels = roles
        .map(role => role.displaylabel)
        .filter(label => label); // safety guard

    const result = displayLabels.join(', ');

    console.log('displayText ==> ', result);

    return result;
 }
//manendra fr customcombobox
    get displayFaciltyDropDowntext() {
           console.log('--- displayFacilityDropDownText invoked ---');
      const selectedValues = this.selctedMultipleFcailityValues;

            if (!selectedValues || selectedValues.length === 0) {
                return 'Select Facilities';
            }

              /*   const firstSelectedValue = selectedValues[0];

                const selectedFacility = this.multiFacilityDroDownList.find(
                    fac => fac.value === firstSelectedValue
                );

                return selectedFacility ? selectedFacility.label : 'Select Facilities'; */
                 const selectedLabels = selectedValues
                    .map(value => {
                        console.log('Processing value:', value);

                        const facility = this.multiFacilityDroDownList?.find(
                            fac => fac.value === value
                        );

                        console.log('Matched facility:', facility);

                        return facility ? facility.label : null;
                    })
                    .filter(label => {
                        const keep = Boolean(label);
                        console.log('Filter label:', label, 'Keep:', keep);
                        return keep;
                    });

                console.log('Resolved Labels:', selectedLabels);
                const result =
                    selectedLabels.length > 0
                        ? selectedLabels.join(', ')
                        : 'Select Facilities';

                console.log('Final Display Text:', result);
                console.log('----------------------------------------');

                return result;
     }


    @track roleoptionsforFacility = [];
  fetchMultiFaciltyOptions(){
      getFacilityData().then(facResponse => {
           
          this.selctedMultipleFcailityValues = this.selctedMultipleFcailityValues || [];         
            //this.selectedRoleValues = result.slice(); 
            // Build enhanced option objects (with toggle + badge)
            this.multiFacilityDroDownList = facResponse.map((fac, index) => {
                const isActive = this.selctedMultipleFcailityValues.includes(fac.Id);
                //const isActive = true;
                return {
                    id: index.toString(),
                    label: fac.Name,
                    value: fac.Id,
                    checked: isActive,
                    isActive: isActive, //  Added to match new structure
                    statusText: isActive ? 'Active' : 'Inactive',     
                    badgeClass: this.getBadgeClass(isActive), // Updated to use method
                    buttonClass: this.getOptionButtonClass(isActive), // Updated to use method
                    isDisabled: !isActive // Updated logic to match new structure
                };
            });
                 console.log('all fac response ==>'+JSON.stringify(this.multiFacilityDroDownList));
     })
}

fetchRoleOptions() {
    getRoleOptionsByFacility({ facilityIdList: this.selctedMultipleFcailityValues })
        .then(result => {
            console.log('Role options received:', JSON.stringify(result));
            this.selectedRoleValues = this.selectedRoleValues || [];         
            //this.selectedRoleValues = result.slice(); 
            // Build enhanced option objects (with toggle + badge)
            this.roleoptionsforFacility = result.map((role, index) => {
                const isActive = this.selectedRoleValues.includes(role);
                //const isActive = true;
                return {
                    id: index.toString(),
                    label: role.Role_Name__c,
                    value: role.Role_Name__c,
                    facilityValue:role.Facility__c,
                    facilityName:role.Facility__r.Name,
                    displaylabel:role.Role_Name__c+'-'+role.Facility__r.Name,
                    checked: isActive,
                    isActive: isActive, //  Added to match new structure
                    statusText: isActive ? 'Active' : 'Inactive',     
                    badgeClass: this.getBadgeClass(isActive), // Updated to use method
                    buttonClassRoles: this.getOptionButtonClassRoles(isActive), // Updated to use method
                    isDisabled: !isActive, // Updated logic to match new structure,
                    typeOfService:role.Facility__r.Type_of_Service__c,
                    isPrimary: false,
                };
            });

            console.log('roleoptionsforFacility (enhanced):', JSON.stringify(this.roleoptionsforFacility));
        })
        .catch(error => {
            console.error('Error fetching role options:', error);
        });
}

// -----------------------------------------
// Handle button click (label select)
// -----------------------------------------
handleSelectOption(e) {
    const optionId = e.target.dataset.optionId;
    const option = this.roleoptionsforFacility.find(opt => opt.id === optionId);
    
    if (option && option.isActive) {
        // Update the selected option state
        this.selectedOption = option;
        
        // Update all options to reflect selection state
        this.roleoptionsforFacility = this.roleoptionsforFacility.map(opt => ({
            ...opt,
            buttonClass: this.getOptionButtonClass(opt.isActive, opt.id === optionId)
        }));

        // Dispatch selection change event
        this.dispatchEvent(new CustomEvent('selectionchange', {
            detail: { selectedOption: option }
        }));
        
        this.updateSelectedRoles();
    }
}

// -----------------------------------------
// Handle toggle active/inactive
// -----------------------------------------
handleToggleActive(e) {
    const optionId = e.target.dataset.optionId;
    const isChecked = e.target.checked; // true/false from UI
    

    console.log("🔀 Toggle changed:", { optionId, isChecked });

    this.roleoptionsforFacility = this.roleoptionsforFacility.map(option => {
        if (option.id === optionId) {
            return {
                ...option,
                checked: isChecked,     // 👈 update checked so UI reflects toggle
                isActive: isChecked,    // 👈 keep isActive in sync
                isPrimary: isChecked ? option.isPrimary : false, // ✅ NEW
                buttonClass: this.getOptionButtonClass(isChecked),
                badgeClass: this.getBadgeClass(isChecked),
                statusText: isChecked ? "Active" : "Inactive",
                isDisabled: !isChecked
            };
        }
        return option;
    });

    // If currently selected option becomes inactive → clear selection
    if (this.selectedOption && this.selectedOption.id === optionId && !isChecked) {
        this.selectedOption = null;
        this.dispatchEvent(new CustomEvent("selectionchange", {
            detail: { selectedOption: null }
        }));
    }

    // Dispatch toggle event for parent
    this.dispatchEvent(new CustomEvent("optiontoggled", {
        detail: { optionId, isChecked }
    }));

    this.updateSelectedRoles();
}

handlePrimaryToggle(event) {

    const optionId = event.target.dataset.optionId;
    const isChecked = event.target.checked;

    // 🔎 Get clicked option
    const clickedOption = this.roleoptionsforFacility.find(
        opt => opt.id === optionId
    );

    /* =====================================================
       ✅ NEW VALIDATION — Primary allowed only if Active
    ====================================================== */
    if (isChecked && !clickedOption.isActive) {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Warning',
                message: 'Primary Role can only be selected for an Active role.',
                variant: 'Warning'
            })
        );

        // revert UI toggle
        event.target.checked = false;
        return;
    }

    // count existing primary
    const alreadyPrimary = this.roleoptionsforFacility.find(
        opt => opt.isPrimary === true
    );

    // ❌ Prevent multiple primary roles
    if (isChecked && alreadyPrimary && alreadyPrimary.id !== optionId) {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Warning',
                message: 'Only one Primary Role can be selected.',
                variant: 'warning'
            })
        );

        event.target.checked = false;
        return;
    }

    // ✅ Apply selection
    this.roleoptionsforFacility =
        this.roleoptionsforFacility.map(opt => {

            if (opt.id === optionId) {
                return { ...opt, isPrimary: isChecked };
            }

            // auto-remove primary from others
            if (isChecked) {
                return { ...opt, isPrimary: false };
            }

            return opt;
        });

    this.updateSelectedRoles();
}
// -----------------------------------------
// Utility methods
// -----------------------------------------
getOptionButtonClass(isActive, isSelected = false) {
    if (isSelected) {
        return 'option-button option-button-selected';
    }
    return isActive 
        ? 'option-button option-button-active' 
        : 'option-button option-button-inactive';
}

getOptionButtonClassRoles(isActive, isSelected = false) {
    if (isSelected) {
        return 'option-button option-button-selected';
    }
    return isActive 
        ? 'option-button-roles option-button-active-roles' 
        : 'option-button-roles option-button-inactive-roles';
}

getBadgeClass(isActive) {
    return isActive 
        ? 'badge-active status-badge1 status-badge-active1' 
        : 'badge-inactive status-badge1 status-badge-inactive1';
}

getToggleTrackClass(option) {
    return option.checked ? 'custom-toggle-track active' : 'custom-toggle-track';
}

updateSelectedRoles() {
    // Preserve original objects
     this.selectedRoleValues = this.roleoptionsforFacility
        .filter(option => option.checked);
 
 this.selectedRoleEmploymentValues = this.roleoptionsforFacility
        .filter(option => option.checked);
    // Preserve original objects here as wel

    // Reset selection if nothing active
    if (this.selectedRoleValues.length === 0) {
        this.selectedEmploymentRole = '';
    }

    console.log(
        '🔄 Active Role Objects:',
        JSON.stringify(this.selectedRoleValues)
    );
}



setPageSizeByZoomAndScreen() {
    let zoomLevel = Math.round(window.devicePixelRatio * 100);
    const userAgent = navigator.userAgent;
    const isMac = /Mac|Macintosh/i.test(userAgent);
    const isWindows = /Windows/i.test(userAgent);
    const screenHeight = window.innerHeight;

    // ✅ Normalize Mac Retina 2x baseline (so 200% reads as 100%)
    if (isMac && zoomLevel >= 190 && zoomLevel <= 210) {
        zoomLevel = 100;
    }

    console.log('OS:', isMac ? 'Mac' : isWindows ? 'Windows' : 'Other');
    console.log('Height:', screenHeight, 'Zoom (normalized):', zoomLevel);

    // Mac logic
    if (isMac) {
        if (zoomLevel <= 180) {
            this.pageSize = 16;
        } else if (zoomLevel <= 250) {
            this.pageSize = 12;
        } else {
            this.pageSize = 8;
        }
        // Adjusted safety check:
        // Only reduce to 8 if BOTH height is small AND zoom is extreme
        if (screenHeight < 700 && zoomLevel > 250) {
            this.pageSize = 8;
        }
        console.log(`💻 Mac zoom ${zoomLevel}% → showing ${this.pageSize} cards`);
        this.visible = true;
        return;
    }

    // 🖥️ --- Windows logic ---
    if (isWindows) {
        if (zoomLevel <= 100) {
            this.pageSize = 16;
        } else if (zoomLevel <= 125) {
            this.pageSize = 12;
        } else {
            this.pageSize = 8;
        }

        if (screenHeight < 800 && this.pageSize > 12) {
            this.pageSize = 12;
        }

        console.log(`🖥️ Windows zoom ${zoomLevel}% → showing ${this.pageSize} cards`);
        this.visible = true;
        return;
    }

    // 🌍 --- Default fallback ---
    if (zoomLevel <= 110) {
        this.pageSize = 16;
    } else if (zoomLevel <= 250) {
        this.pageSize = 12;
    } else {
        this.pageSize = 8;
    }

    console.log(`🌍 Other OS zoom ${zoomLevel}% → showing ${this.pageSize} cards`);
    this.visible = true;
}

handleResize() {
    const oldSize = this.pageSize;
    this.setPageSizeByZoomAndScreen();

    if (this.pageSize !== oldSize) {
        this.paginationHelper(); 
    }
}
    handleStaffIdChange(event) {
        this.recordId = event.detail.staffId;        
        console.log('Child received staffId:', this.recordId);
    }

   

    handleSearchKeyPress(event) {
        if (event.key === 'Enter') {
            this.searchName = event.target.value;
            this.applyFilters(); // Or whatever method you use to search
        }
    }


    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }

    handleEvent = event => {
        const refreshRecordEvent = event.data.payload;
        if (refreshRecordEvent.RecordId__c === this.recordId) {
            this.recordId = '';
            return refreshApex(this.refreshTable);
        }
    }

    disconnectedCallback() {
        unsubscribe(this.subscription, () => {
            console.log('Successfully unsubscribed');
        });
         window.removeEventListener('resize', this.handleResize.bind(this));
         window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));

    }

    @wire(getUserTypeValuesfromOrg, { selectedroleValue: '$selectedRole', userId: '$userId' })
      wiredMultiPicklistValues({ error, data }) {
        console.log('Selected Role:', this.selectedRole);
        console.log('User ID:', this.userId);
        console.log('User Type Values received:', data);
        if (data) {
            console.log('User Type Values received:', data);
            this.UserTypeValues = data.map(item => ({ label: item, value: item }));
        } else if (error) {
            console.error('Error fetching User Type values', error);
        }
    }

    handleUserTypeChange(event){
        this.selectedUserType = event.target.value;
    }

    @wire(fetchFacilitiess, { recordId: '$selectedName', firstname: '$firstname', lastname: '$lastname' }) recordsToDisplay(result) {
        this.wiredresult = result;
        // this.refreshTable = result;
        console.log('result in out>>>>>', result);
        if (result.data) {
            console.log('result.data in If>>>>>', result.data);
            this.refreshTable = result.data;
           
              let finalData=[];
              this.records=[];
              this.records2=[];
                finalData=  result.data.map(rec => {
                    return {
                        ...rec, // keep all existing fields
                        activeRoles: rec.StaffRoles__r ? rec.StaffRoles__r.map(r => r.RoleName__c) : [],
                        activeRolesDisplay: rec.StaffRoles__r && rec.StaffRoles__r.length > 0
                            ? rec.StaffRoles__r.map(r => r.RoleName__c).join(', ')
                            : '',
                             activeFaciltyDisplay:  rec.Staff_Facilities__r&&  rec.Staff_Facilities__r.length>0 ? rec.Staff_Facilities__r
                                .map(f => f.Facility__r?.Name)
                                .filter(Boolean)
                                .join(', '):''
                    
                    };
                });
            console.log('RESULT--> ' + JSON.stringify(finalData));
            result.data.forEach(rec=>{
                this.satffDataJasonformat[rec.Id]={"street":rec.Address__Street__s,"city":rec.Address__City__s,"stateCode":rec.Address__StateCode__s,"countryCode":rec.Address__CountryCode__s,"postalCode":rec.Address__PostalCode__s,"childRecords":rec.Child_Staffs__r,
                "preTaxvalue":rec.Pre_Tax_Calculator__c,"pretaxone":rec.Pre_Tax_One_Value__c,"pretaxtwo":rec.Pre_Tax_Two_Value__c,"pretaxThree":rec.Pre_Tax_Three_Value__c,"pretaxFour":rec.Pre_Tax_Four_Value__c,"pretaxFive":rec.Pre_Tax_Five_Value__c,
                "postTax":rec.Post_Tax__c,"primaryVal":rec.Make_Primary_as_Approver__c,"secondaryVal":rec.Make_Secondary_as_Approver__c,"voluntaryContribution":rec.Voluntary_Contribution__c,"ContributionCurrency":rec.Voluntary_Contribution_Fixed__c,"ContributionPercent":rec.Voluntary_Contribution_Percent__c,"ContributionNone":rec.Voluntary_Contribution_None__c,
                "status":rec.Status__c,"Nickname":rec.Display_Nickname__c,};});

            console.log('Staff data Json format'+JSON.stringify(this.satffDataJasonformat));
            const storedFacilityId = localStorage.getItem('defaultFacilityId');
            const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
            console.log('storedFacilityId'+storedFacilityId);
            console.log('storedFacilityLabel'+storedFacilityLabel);
            
            getCurrentLoggedUserInfo().then(userData=>{
                    console.log('user data ==>'+JSON.stringify(userData));
                    let userType=userData.User_Type__c;
                         getFacilityData().then(response => {
                                        console.log('Facility data fetched successfully:', response);
                                        this.finalListFacilities=[];
                                        this.selectedFacilities=[];
                                      
                                        this.facilityOptions = response.map(record => ({
                                            label: record.Name,
                                            value: record.Id,
                                            preferredName: record.Facility_Preferred_Name_Formula__c
                                        }));
                                        if( userType =='NDIS Org Admin' || userType == 'ICT Admin'){
                                            this.finalListFacilities=this.facilityOptions  ;
                                               console.log('Mapped facility options: FOR ORG ADMIN', JSON.stringify(this.finalListFacilities));
                                                 let facilityIds = [];
                                                 facilityIds.push(storedFacilityId); 
                                               /*  const filteredData = finalData.filter(rec =>
                                                    facilityIds.includes(rec.Facility__c)
                                                );  */ 
                                             const filteredData = finalData.filter(rec => {
                                                        const facilities = rec.Staff_Facilities__r || [];
                                                        return facilities.some(sf =>
                                                            facilityIds.includes(sf.Facility__c)
                                                        );
                                             });
                                                                                                                                          
                                                this.records = filteredData;
                                               console.log('manendracheckresult'+JSON.stringify( this.records));
                                                this.records2 = filteredData;
                                                 this.orginalData=filteredData;
                                                this.totalRecords =filteredData.length;  
                                                  if(this.totalRecords>0) {
                                                        this.noRecordsFlag=false;
                                                    }else{
                                                        this.noRecordsFlag=true;
                                                    }   
                                                this.setPageSizeByZoomAndScreen();
                                                if (this.totalRecords > 9) {
                                                this.visible = true;
                                                }            
                                                this.paginationHelper(); 
                                                this.applyFilters();
                                               // this.noRecordsFlag=true;
                                                
                                        }else if(userType =='Facility Admin' || userType =='HR Admin' || userType =='NDIS Lead'){
                                        
                                                        getFacilityCurrentUser().then(result => {
                                                            console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                                                 this.finalListFacilities =  result.map(record => ({
                                                                                            label: record.Facility__r.Name,
                                                                                            value: record.Facility__r.Id
                                                                                   })); 
                                                                  
                                                               /*   const facilityIds = this.finalListFacilities.map(f => f.value); */
                                                                    let facilityIds = [];
                                                                    facilityIds.push(storedFacilityId); 
                                                                  /*   const filteredData = finalData.filter(rec =>
                                                                        facilityIds.includes(rec.Facility__c)
                                                                    );  */

                                                                  const filteredData = finalData.filter(rec => {
                                                                        const facilities = rec.Staff_Facilities__r || [];
                                                                        return facilities.some(sf =>
                                                                            facilityIds.includes(sf.Facility__c)
                                                                        );
                                                                     }); 
                                                                      console.log('facilityIds--> ' + JSON.stringify(facilityIds));
                                                                      console.log('filteredData--> ' + JSON.stringify(filteredData));
                                                                         console.log('filteredData LENGTH--> ' +filteredData.length);
                                                                  
                                                                    this.records = filteredData;
                                                                    this.records2 = filteredData;
                                                                      this.orginalData=filteredData;
                                                                     console.log('filteredData--> ' + JSON.stringify(this.records));
                                                                         console.log('filteredData LENGTH--> ' +this.records.length);
                                                                           console.log('filteredData--> ' + JSON.stringify( this.records2));
                                                                         console.log('filteredData LENGTH--> ' + this.records2.length);
                                                                    this.totalRecords = filteredData.length; 
                                                                     if(this.totalRecords>0) {
                                                                            this.noRecordsFlag=false;
                                                                        }else{
                                                                            this.noRecordsFlag=true;
                                                                        }   
                                                                    this.setPageSizeByZoomAndScreen();           
                                                                    this.paginationHelper(); 
                                                                    this.applyFilters();
                                                                   // this.noRecordsFlag=true;

                                                                console.log('Mapped facility options: Facility Admin', JSON.stringify(this.finalListFacilities));
                                                            }).catch(error => {
                                                                this.error = error;
                                                                console.error('Error fetching facilities:', error);
                                                    
                                                            });
                                                                
                                        }

                                        console.log('{adminFlag} ?>>', this.adminFlag);
                                        console.log('{totalRecords} ?>>', this.totalRecords);
                                        console.log('{isDesktop} ?>>', this.isDesktop);
                                        console.log('{visible} ?>>', this.visible);
                                                        
                                     
                                    })
                                    .catch(err => {
                                        console.error('Error fetching facility data:', err);
                                    });
            });
          /*  this.records = result.data;
           this.records2 = result.data;
           this.totalRecords = result.data.length;          
           this.setPageSizeByZoomAndScreen();
            if (this.totalRecords > 9) {
                this.visible = true;
            }            
            this.paginationHelper(); 
            this.applyFilters();
            this.noRecordsFlag=true; */
        }else{
            this.noRecordsFlag=false; 
        }
        const storedStaffId = localStorage.getItem('adminStaffRecordId');
        if (storedStaffId && this.satffDataJasonformat[storedStaffId]) {
            console.log('Loading staff data for storedStaffId:', storedStaffId);
           // const json = this.satffDataJasonformat[storedclientId];
           // console.log('participantJson found for storedclientId:', json);
            this.loadStaffData(storedStaffId);
        } else {
            console.log('No stored staff ID or data found in satffDataJasonformat');
        }

    }

    filterState = 'All';
    @track filteredRecords = [];
    handleTogglestaff() {        
        // Cycle through the filter states
        if (this.filterState === 'All') {
            this.filterState = 'Active';
        } else if (this.filterState === 'Active') {
            this.filterState = 'Inactive';
        } else {
            this.filterState = 'All';
        }       
        if (this.filterState === 'Active') {
            this.stafflabel='Active';
            this.filteredRecords = this.records2.filter(record => record.Status__c === true );
            
        } else if (this.filterState === 'Inactive') {
             this.stafflabel='Inactive';
            this.filteredRecords = this.records2.filter(record => record.Status__c === false );
        } else {
            this.stafflabel='All'
            this.filteredRecords = [...this.records2]; // Show all users
        }
        // Update total records and handle pagination
        this.records = this.filteredRecords;
        this.totalRecords = this.filteredRecords.length;
        console.log('total records'+this.totalRecords);
        //this.noRecordsFlag = this.totalRecords === 0;
        this.paginationHelper();
    } 

    handleFacilityChange(event) {
    const selectedFacilityId = event.detail.value;
    this.selectedFacility = selectedFacilityId;

    // Get preferred name from the facilityMap
    const facility = this.facilityMap.get(selectedFacilityId);
    this.facilityPreferredName = facility?.preferredName || facility?.name || 'Facility';

    // Proceed with filtering records or updating UI as needed
    console.log('Selected facility:', facility);
    console.log('Preferred name:', facility?.preferredName);
    console.log('Assigned facilityPreferredName:', this.facilityPreferredName);

    this.updateRecordsForSelectedFacility(selectedFacilityId);
}
    handleRecordsPerPage(event) {
        this.pageSize = event.target.value;
        this.paginationHelper();
    }
    previousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
    }
    nextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
    }
    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
    }
    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
    }
    // JS function to handel pagination logic 
    paginationHelper() {
        this.recordsToDisplay = [];
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.recordsToDisplay.push(this.records[i]);
            console.log()
        }
        refreshApex(this.refreshTable);
    }
    
   
    handleClear() {
        let listOfsearchString = [];
        this.fname = '';
        this.lname = '';
        refreshApex(this.refreshTable)
      //  this.fetchStaff();
    }   
   
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            const inp = this.template.querySelectorAll('lightning-input');
            let listOfsearchString = [];

            inp.forEach((element) => {
                if (element.name === 'fname') {
                    this.fname = element.value;
                    listOfsearchString.push(element.value);
                } else if (element.name === 'lname') {
                    this.lname = element.value;
                    listOfsearchString.push(element.value);
                }
            });

            console.log(JSON.stringify(listOfsearchString));
           // this.fetchStaff(); // Call your method to fetch staff
            refreshApex(this.refreshTable)
        }
    }
    
    handleSearch(event) {
        console.log(event.target.label);
        var inp = this.template.querySelectorAll("lightning-input");
        let listOfsearchString = [];
        inp.forEach(function (element) {

            if (element.name == "fname") {
                this.fname = element.value;
                listOfsearchString.push(element.value);
            }

            else if (element.name == "lname") {
                this.lname = element.value;
                listOfsearchString.push(element.value);
            }
        }, this);
        console.log(JSON.stringify(listOfsearchString));
      //  this.fetchStaff();
      refreshApex(this.refreshTable)
    }

    @track adminFlag = true;
    handleCreateNewStaff() {
        this.StaffFacility = localStorage.getItem("defaultFacilityId") || "";
        console.log('Staff Facility ===>', this.StaffFacility);
       // this.fetchRoleOptions();
        this.fieldErrorMap = {};
        this.recordId ='';
        this.street ='';
        this.city ='';
        this.country ='';
        this.province ='';
        this.postalcode ='';
        /* this.StaffFacility=''; */
        this.preTaxForSubmit=0;
        this.postTaxLabelvalue=0;
        this.staffEditFlag=true;
        this.blurflag=true;
        this.heading=false; 
        this.AddDocButtonDisable= true;
        this.primaryApproverValue=false;
        this.secondaryApproverValue=false;
        this.submitButtonlabel='Save';
        this.confirmEmailError='';
        this.primaryEmailError=false;
        this.secondaryEmailError=false;
        this.errorMessage = '';
        this.saveButtonDisable = false;
        this.fileName='';
        this.cardFlag = true;
        this.listFlag = false;
        this.adminFlag =true;
        this.visible = false;
        this.pretaxOne = 0;
        this.pretaxtwo = 0;
        this.pretaxThree = 0;
        this.pretaxFour = 0;
        this.pretaxFive = 0;
       
        this.categoryType='';
        this.jobType='';
        this.classificationLevel='';
        this.classificationPayType='';
        this.createdShiftRole='';
        this.genralHourlyRate=0;
        this.sturdayHourlyRate=0;
        this.sundayhourlyRate=0;
        this.publicHolidayRate=0;
        this.afterNoonShiftRate=0;
        this.nightShiftRate=0;
        this.standardWeeklyRate=0;
        this.setHoursAccess =false;
        this.allowanceMethod = 'Fixed';
        this.oneBreakAllowance = 0;
        this.twoBreakAllowance = 0;
        this.sleepoverAllowance=0;
         this.applyAllowanceLogic();
        this.paidBreak=true;
        if(this.typeOfUser=='ICT User'){
        this.ictUserType=true;
        console.log('Checkusertypee',this.typeOfUser);
        }else{
        this.ictUserType=false;
        console.log('Checkusertypee2',this.typeOfUser);
        }
        this.geoLocationStatus=false;
        // Reset Nationality dropdown
        this.Nationality = ''; // or whatever property is bound to lightning-input
        this.filteredOptions = this.allNationalities.map(n => ({ label: n, value: n }));
        this.noResults = false;
        // Reset Languages selection
        this.selectedLangs = [];
        this.Languages = this.LANGUAGE_OPTIONS.map(lang => ({
            id: lang,
            label: lang,
            checked: false,
            buttonClass: 'option-button',
            badgeClass: 'status-badge inactive',
            statusText: 'Inactive'
        }));
        this.selectedRole = '';
         this.selectedEmploymentRole='';
        this.selectedRoleValues = [];
        this.roleoptionsforFacility = [];
       // this.multiFacilityDroDownList=[];
        this.selctedMultipleFcailityValues=[];
        this.selectedDropDownFacilityValue='';
         this.selectedEmploymentRoleDisplayVlaue='';
        this.fetchRoleOptions();
        this.fetchMultiFaciltyOptions();

        this.emailId = '';
    }

    get isDesktop() {        
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    get animationclass() {
        return this.template ? 'right-align' : 'right-align-reverse';
    }

    @track editstaffflag = false;
    @track showDescription2 = false;
    @track showDescription3 = false;
    @track showDescription4 = false;
    @track showDescription5 = false;
    @track delete2 = false;
    @track delete3 = false;
    @track delete4 = false;
    @track delete5 = false;
     allowanceMethodOptions = [
        { label: 'Use Pay Guide Rate', value: 'Fixed' },
        { label: 'Use Percentage Rule', value: 'Percentage' }
    ];


    handleAddDescription() {
        this.delete2 = false;
        this.delete3 = false;
        this.delete4 = false;
        if (!this.showDescription2) {
            this.showDescription2 = true;
            this.delete2 = true;
        } else if (!this.showDescription3) {
            this.showDescription3 = true;
            this.delete3 = true;
        } else if (!this.showDescription4) {
            this.showDescription4 = true;
            this.delete4 = true;
        } else if (!this.showDescription5) {
            this.showDescription5 = true;
            this.delete5 = true;
        }
    }

    handleDeleteDescription(event) {
        this.delete2 = false;
        this.delete3 = false;
        this.delete4 = false;
        this.delete5 = false;
        const index = event.target.dataset.index;

        if (index === "2") {
            this.showDescription2 = false;
            this.pretaxtwo = 0;
        } else if (index === "3") {
            this.showDescription3 = false;
            this.delete2 = true;
            this.pretaxThree = 0;
        } else if (index === "4") {
            this.showDescription4 = false;
            this.delete3 = true;
            this.pretaxFour = 0;
        } else if (index === "5") {
            this.showDescription5 = false;
            this.delete4 = true;
            this.pretaxFive = 0;            
        }
        this.handlePreTaxChange({ target: { name: '' } });
    }

    handleEditStaff(event) {
        // this.fetchStaff();
        let facId = event.currentTarget.dataset.id;
         console.log('Staff Id', facId);
        this.loadStaffData(facId);
    }

    loadStaffData(facId) {
        console.log('loadStaffData  calling');
        this.recordId = facId;
        console.log('Staff Id in loadStaffData', this.recordId);
        this.editstaffflag = true;
        this.adminFlag =false;
        this.listFlag = false;
        this.cardFlag =false;
        this.totalRecords = 0;
        this.parentStaffId=facId;
        this.staffEditFlag=false;
        this.submitButtonlabel='Update';
        this.heading=true; 
        this.AddDocButtonDisable= false;
        this.confirmEmailError='';
        this.primaryEmailError=false;
        this.secondaryEmailError=false;
        this.errorMessage = '';
        this.saveButtonDisable = false;
        this.fileName='';
        this.addingPreTax();
      
        console.log('Staff Id'+facId);
        if (!this.satffDataJasonformat || !this.satffDataJasonformat[facId]) {
            console.error('Staff data not found for:', facId);
            return;
        }
        this.street = this.satffDataJasonformat[facId]["street"];
        this.city = this.satffDataJasonformat[facId]["city"];
        this.country = this.satffDataJasonformat[facId]["countryCode"];
        this.province = this.satffDataJasonformat[facId]["stateCode"];
        this.postalcode = this.satffDataJasonformat[facId]["postalCode"];
        this.pretaxOne=this.satffDataJasonformat[facId]["pretaxone"];
        this.pretaxtwo=this.satffDataJasonformat[facId]["pretaxtwo"];
        this.pretaxThree=this.satffDataJasonformat[facId]["pretaxThree"];
        this.pretaxFour=this.satffDataJasonformat[facId]["pretaxFour"];
        this.pretaxFive=this.satffDataJasonformat[facId]["pretaxFive"];
        this.primaryApproverValue=this.satffDataJasonformat[facId]["primaryVal"];
        this.secondaryApproverValue=this.satffDataJasonformat[facId]["secondaryVal"];

        /* this.status = this.satffDataJasonformat[facId]["status"]; */
        let voluntaryContribution =this.satffDataJasonformat[facId]["voluntaryContribution"];
        this.voluntaryContributionCureencyVal=this.satffDataJasonformat[facId]["ContributionCurrency"];
        this.voluntaryContributionPercentVal=this.satffDataJasonformat[facId]["ContributionPercent"];
        if(voluntaryContribution =='Fixed'){
            this.VoluntaryContributionCurrency=true;
            this.VoluntaryContributionPercent=false;
            this.VoluntaryContributionNone = false;
            
        } else if(voluntaryContribution =='Percentage'){
            this.VoluntaryContributionPercent=true;
            this.VoluntaryContributionCurrency=false;
            this.VoluntaryContributionNone = false;
            
        } 
        console.log('contribution in fixed'+ this.voluntaryContributionCureencyVal);
        console.log('contribution in %'+ this.voluntaryContributionPercentVal);
        this.preTaxForSubmit=this.satffDataJasonformat[facId]["preTaxvalue"];
        if(this.satffDataJasonformat[facId]["preTaxvalue"]){
        this.totalPretaxvalue ='Pre Tax Deduction - Total '+ this.satffDataJasonformat[facId]["preTaxvalue"];
        }else{
            this.totalPretaxvalue ='Pre Tax Deduction - Total '+ 0;  
        }
        if(this.satffDataJasonformat[facId]["postTax"]){
        this.postTaxlabel='Post Tax Deduction - Total '+ this.satffDataJasonformat[facId]["postTax"];
        }else{
            this.postTaxlabel='Post Tax Deduction - Total '+ 0;  
        }
        console.log('pagename'+this.pageName);
        // this.addingPreTax();      

        localStorage.setItem('adminStaffRecordId', this.recordId);
        console.log('adminStaffRecordId Stored in localStorage:', this.recordId);  
    }

    childevent(event){
        localStorage.removeItem('adminStaffRecordId');
        this.editstaffflag = false;
        this.adminFlag =true;
        this.cardFlag =true;
        this.listFlag = false;
        this.visible = true;
        // Optional force refresh trigger
        this.selectedName = this.selectedName + '';
        console.log('this.selectedName >>', this.selectedName);
        console.log('this.firstname >>', this.firstname);
        console.log('this.lastname >>', this.lastname);
        refreshApex(this.wiredresult);
        this.isMultiStaffUpload = false;
        refreshApex(this.refreshTable);
        //refreshApex(this.refreshTable)
        //this.fetchStaff();       
    }   

    handlePreTaxChange(event){        
        // if (event.target.name == 'name') {
        //     this.name = event.detail.value;
        // }
        // if (event.target.name == 'lastname1') {
        //     this.lastname1 = event.detail.value;
        // }
        if(event.target.name == 'PreTaxonevalue'){
            this.pretaxOne=event.target.value;           
        }
        if(event.target.name == 'PreTaxTwovalue'){
            this.pretaxtwo=event.target.value;         
        }
        if(event.target.name == 'pretaxthreevalue'){
            this.pretaxThree=event.target.value;           
        }
        if(event.target.name == 'pretaxFourvalue'){
            this.pretaxFour=event.target.value;            
        }
        if(event.target.name == 'pretaxFivevalue'){
            this.pretaxFive=event.target.value;           
        }
        if(this.pretaxOne==''|| this.pretaxOne== undefined  || this.pretaxOne== null){
            this.pretaxOne=0; 
        }
        if(this.pretaxtwo==''|| this.pretaxtwo== undefined  || this.pretaxtwo== null){
            this.pretaxtwo=0; 
        }
        if(this.pretaxThree==''|| this.pretaxThree== undefined  || this.pretaxThree== null){
            this.pretaxThree=0; 
        }
        if(this.pretaxFour==''|| this.pretaxFour== undefined  || this.pretaxFour== null){
            this.pretaxFour=0; 
        }
        if(this.pretaxFive==''|| this.pretaxFive== undefined  || this.pretaxFive== null){
            this.pretaxFive=0; 
        }

        this.preTaxForSubmit=parseFloat(this.pretaxOne)+parseFloat(this.pretaxtwo)+parseFloat(this.pretaxThree)+parseFloat(this.pretaxFour)+parseFloat(this.pretaxFive);
        this.totalPretaxvalue= "Pre Tax Deduction - Total " +this.preTaxForSubmit;

        if(event.target.name == 'totalPreTax'){
            this.preTaxForSubmit=event.target.value;           
        }
        if(this.preTaxForSubmit==''|| this.preTaxForSubmit== undefined  || this.preTaxForSubmit== null){
            this.preTaxForSubmit=0;
        }
    } 

    handlePosttaxChange(event){       
        if(event.target.name == 'posttax'){
            this.postTaxLabelvalue=event.target.value;
        }
        if(this.postTaxLabelvalue ==''||this.postTaxLabelvalue ==undefined||this.postTaxLabelvalue ==null ){
            this.postTaxLabelvalue=0;
        }
        this.postTaxlabel='Post Tax Deduction - Total '+parseFloat(this.postTaxLabelvalue);    
    }
    
    addressInputChange(event) {
        const address = event.detail;
        if (!address.street || !address.city || !address.postalCode || !address.province) {
            this.errorMessage = 'Please provide complete address information.';
            this.saveButtonDisable = true;
        }
        else{
            this.errorMessage = '';
            this.saveButtonDisable = false;
            console.log('event detail'+JSON.stringify(event.detail)); 
            this.street=event.detail.street;
            this.city=event.detail.city;
            this.postalcode=event.detail.postalCode;
            this.province=event.detail.province;
            this.country=event.detail.country;
            console.log('poscid', this.province);
            console.log('poscid2', this.postalcode);
            console.log('poscid3', this.city);
        }
    }

    @track selectedRoleValues = [];
    @track selectedRoleEmploymentValues = [];

   
        jobTypeOptions = [
        { label: 'Full-time and part-time', value: 'Full-time and part-time' },
        { label: 'Casual', value: 'Casual' },
      { label: 'Full-time', value: 'Full-time' },
        { label: 'Part-time', value: 'Part-time' }
    ];
    schadsCategoryOptions = [
        { label: 'Social and community services employee', value: 'Social and community services employee' },
        { label: 'Crisis accommodation employee', value: 'Crisis accommodation employee' },
        { label: 'Family day care employee', value: 'Family day care employee' },
        { label: 'Home care employee', value: 'Home care employee' }
    ];
    schadsLevelOptions = [
        { label: 'Level 1', value: 'Level 1' },
        { label: 'Level 2', value: 'Level 2' },
        { label: 'Level 3', value: 'Level 3' },
        { label: 'Level 4', value: 'Level 4' },
        { label: 'Level 5', value: 'Level 5' },
        { label: 'Level 6', value: 'Level 6' },
        { label: 'Level 7', value: 'Level 7' },
        { label: 'Level 8', value: 'Level 8' }
    ];

    schadsPayPointOptions = [
        { label: 'Pay Point 1', value: 'Pay Point 1' },
        { label: 'Pay Point 2', value: 'Pay Point 2' },
        { label: 'Pay Point 3', value: 'Pay Point 3' },
        { label: 'Pay Point 4', value: 'Pay Point 4' }
    ];
    //Child Care
    childCareCategoryOptions = [
        { label: 'Adult', value: 'Adult' }        
    ];
    childCareLevelOptions = [
        { label: 'Level 1', value: 'Level 1' },
        { label: 'Level 2', value: 'Level 2' },
        { label: 'Level 3', value: 'Level 3' },
        { label: 'Level 4', value: 'Level 4' },
        { label: 'Level 5', value: 'Level 5' },
        { label: 'Level 6', value: 'Level 6' },
        { label: 'Level 7', value: 'Level 7' },
        { label: 'Level 8', value: 'Level 8' }
    ];

    childCarePayPointOptions = [
        { label: 'Pay Point 1', value: 'Pay Point 1' },
        { label: 'Pay Point 2', value: 'Pay Point 2' },
        { label: 'Pay Point 3', value: 'Pay Point 3' }
    ];
    // Nursing Picklist Options
    nursingCategoryOptions = [
        { label: 'Nursing Care', value: 'Nursing Care' }
    ];

    nursingLevelOptions = [
{ label: 'Nursing Assistant', value: 'Nursing Assistant' },
{ label: 'Student Enroller Nurse', value: 'Student Enroller Nurse' },
{ label: 'Enrolled Nurse', value: 'Enrolled Nurse' },
{ label: 'Registered Nurse with 4 year degree', value: 'Registered Nurse with 4 year degree' },
{ label: 'Registered Nurse with a master degree', value: 'Registered Nurse with a master degree' },
{ label: 'Register Nurse - level 1', value: 'Register Nurse - level 1' },
{ label: 'Register Nurse - level 2', value: 'Register Nurse - level 2' },
{ label: 'Register Nurse - level 3', value: 'Register Nurse - level 3' },
{ label: 'Register Nurse - level 4', value: 'Register Nurse - level 4' },
{ label: 'Register Nurse - level 5', value: 'Register Nurse - level 5' },
{ label: 'Nurse Practitioner', value: 'Nurse Practitioner' },
{ label: 'Occupational Health Nurse - level 1', value: 'Occupational Health Nurse - level 1' },
{ label: 'Occupational Health Nurse - level 2', value: 'Occupational Health Nurse - level 2' },
{ label: 'Senior Occupational Health Clinical Nurse', value: 'Senior Occupational Health Clinical Nurse' },
{ label: 'Occupational Health Nurse - level 3', value: 'Occupational Health Nurse - level 3' }

    ];

    nursingPayPointOptions = [
    { label: '1st Year', value: '1st Year' },
    { label: '2nd Year', value: '2nd Year' },
    { label: '3rd Year', value: '3rd Year' },
    { label: 'Experienced', value: 'Experienced' },
    { label: 'Less than 21 years age', value: 'Less than 21 years age' },
    { label: '21 years of age and over', value: '21 years of age and over' },
    { label: 'Pay Point 1', value: 'Pay Point 1' },
    { label: 'Pay Point 2', value: 'Pay Point 2' },
    { label: 'Pay Point 3', value: 'Pay Point 3' },
    { label: 'Pay Point 4', value: 'Pay Point 4' },
    { label: 'Pay Point 5', value: 'Pay Point 5' },
    { label: 'Entry Rate', value: 'Entry Rate' },
    { label: 'Pay Point 6', value: 'Pay Point 6' },
    { label: 'Pay Point 7', value: 'Pay Point 7' },
    { label: 'Pay Point 8', value: 'Pay Point 8' },
    { label: 'Grade 1', value: 'Grade 1' },
    { label: 'Grade 2', value: 'Grade 2' },
    { label: 'Grade 3', value: 'Grade 3' },
    { label: 'Grade 4', value: 'Grade 4' },
    { label: 'Grade 5', value: 'Grade 5' },
    { label: 'Grade 6', value: 'Grade 6' }
    ];
    handleRoleinEmploymentChange(event) {
        // Combobox returns a single value (string)
        //this.selectedRole = event.detail.value;
       this.selectedRole = event.detail.value; 

        console.log('🔄 [handleRoleinEmploymentChange] Fired');
        console.log('📥 Selected Value:', this.selectedRole);

        if (this.selectedRole) {
            console.log('✅ A role is selected:', this.selectedRole);
        } else {
            console.log('⚠️ No role selected');
        }
    }

    onFileUpload(event) {
        this.isattachError=false;
        if (event.target.files.length > 0) {
            this.selectedFilesToUpload = event.target.files;      
            this.file = this.selectedFilesToUpload[0];
            this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
            this.fileType = this.selectedFilesToUpload[0].type;
            this.fileSize = this.selectedFilesToUpload[0].size;     
            
            if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {  
                this.isattachError=true;
            }
            //create an intance of File
            this.fileReaderObj = new FileReader();

            //this callback function in for fileReaderObj.readAsDataURL
            this.fileReaderObj.onloadend = (() => {        
                //get the uploaded file in base64 format
                let fileContents = this.fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',')+1);
                
                //read the file chunkwise
                let sliceSize = 1024;           
                let byteCharacters = atob(fileContents);
                let bytesLength = byteCharacters.length;
                let slicesCount = Math.ceil(bytesLength / sliceSize);                
                let byteArrays = new Array(slicesCount);
                for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                    let begin = sliceIndex * sliceSize;
                    let end = Math.min(begin + sliceSize, bytesLength);                    
                    let bytes = new Array(end - begin);
                    for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);         
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }
                
                //from arraybuffer create a File instance
                this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
                
                //callback for final base64 String format
                let reader = new FileReader();
                reader.onloadend = (() => {
                    let base64data = reader.result;
                    this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
                });
                reader.readAsDataURL(this.myFile);                                 
            });
            this.fileReaderObj.readAsDataURL(this.file);
        }
        this.showSpinner = false;
        console.log('fileName>>',this.fileName);
        console.log('file prepared');
    }  

    handleSubmit(event){
        console.log('in submit');
        event.preventDefault();// stop the form from submitting
            
    // Validate selected role
        console.log('CheckNationality',this.Nationality);
        console.log('hourlyrate',this.genralHourlyRate);
        console.log('manendra check',JSON.stringify(this.selectedRoleValues));
        console.log('manendracheck2', this.selectedEmploymentRole);
        const fields = event.detail.fields;
        console.log('manendra check',JSON.stringify(this.selectedRoleValues));
   
    if(this.selctedMultipleFcailityValues.length==0){
            this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                //message: 'Please choose at least one facility to save your changes.',
                 message: 'Please select at least one Facility.',
                variant: 'error',
            })
        );
        return;  
    }
    if (!this.ictUserType){
        // console.log('  this.selectedRoleValues  in submit : ',JSON.stringify(this.selectedRoleValues));
        //console.log('  this.selectedRoleValues length in submit : ',this.selectedRoleValues.length);
        if(!this.selectedRoleValues || this.selectedRoleValues.length === 0){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select at least one Role.',
                    variant: 'error',
                })
            );
            return;  
        }
    
        if ( !this.selectedEmploymentRole) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select a Role in Employment section.',
                    variant: 'error',
                })
            );
            return;  
        }

    }

    if(!this.ictUserType){
        if (this.genralHourlyRate === null || this.genralHourlyRate === undefined || Number.isNaN(this.genralHourlyRate)) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Hourly Rate is required in Employment section.',
                    variant: 'error',
                })
            );
            return; 
        } 
    }
    if (fields.Prefer_Nickname__c === true &&(!fields.Nickname__c || fields.Nickname__c.trim() === '')) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Please enter a Nickname when Prefer Nickname is selected.',
                variant: 'error'
            })
        );
        return; 
    }
    if (!fields.Emp_Start_Date__c) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: ' Employement Section: Start Date is required.',
                variant: 'error',
            })
        );
        return; 
    }
    if (!fields.Contact_Number__c) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: ' Contact Number is required.',
                variant: 'error',
            })
        );
        return; 
    }
//  if(!this.ictUserType){
//     if (!this.genralHourlyRate || !this.genralHourlyRate) {
//         this.dispatchEvent(
//             new ShowToastEvent({
//                 title: 'Error',
//                 message: 'Please enter Hourly Rate before saving.',
//                 variant: 'error'
//             })
//         );
//         return; 
//     }
// }
   
     /*   const facilityInput = this.template.querySelector('[data-id="facility"]');
        if (!this.StaffFacility) {
        facilityInput.reportValidity(); // shows “Complete this field”
        return;
    } */

          // alert(JSON.stringify(fields));
            fields.Address__Street__s = this.street;
            fields.Address__City__s =  this.city;
            fields.Address__StateCode__s = this.province;
            fields.Address__CountryCode__s = 'AU';
            fields.Address__PostalCode__s = this.postalcode;
             fields.SelectedRole__c = this.selectedEmploymentRole+'-'+this.selectedDropDownFacilityValue;
            fields.Nationality__c = this.Nationality;
            fields.Languages__c = this.selectedLangs.length > 0 ? this.selectedLangs.join(';') : null;
           // fields.Role__c=this.createdShiftRole;Manendra
            fields.Facility__c=this.selctedMultipleFcailityValues[0];
          /* praveen changes for nursing awards start */
            if(this.isNursingAwards == true){
                fields.Fixed_Rate_or_Not__c=false;
                fields.Category_Type__c=null;
                fields.Classification_Level__c=null;
                fields.Classification_Pay_Point__c=null;
            }
             if(this.isSchadsAwards == true){
                fields.Nursning_Awards__c=false;
                fields.Nursing_Category_Type__c=null;
                fields.Nursing_Classification_Level__c=null;
                fields.Nursing_Classification_Pay_Point__c=null;
            }
            
        /* praveen changes for nursing awards  end*/
            fields.Enable_Geolocation__c=this.geoLocationStatus;
           // fields.Pre_Tax_Calculator__c = this.preTaxForSubmit;
           if(this.voluntaryContributionCureencyVal==undefined){
            this.voluntaryContributionCureencyVal=0;
           }
           if(this.voluntaryContributionPercentVal==undefined){
            this.voluntaryContributionPercentVal=0;
           }
           fields.Voluntary_Contribution_Fixed__c=this.voluntaryContributionCureencyVal;
           fields.Voluntary_Contribution_Percent__c= this.voluntaryContributionPercentVal;
           fields.Type_of_User__c=this.typeOfUser;
           if(this.createStaffForXeroOnly || this.createStaffForXeroAll){
                
                console.log('this.name : ', this.name);
                fields.Name = this.name;
                fields.Last_Name__c= this.lastname1;
                fields.Email_Address__c= this.emailId;
                fields.Xero_Employee_ID__c = this.xeroId;
                console.log('fields name : ', fields.Name);
               
           }
           console.log('fields.Tax_free_threshold__c : ',fields.Tax_free_threshold__c);
            if (!fields.Tax_free_threshold__c || fields.Tax_free_threshold__c ==undefined) {
                this.showToast('Error', 'Please Enter TFT in Taxation section.', 'error');
                return;
           }
          console.log('After fields>>'+JSON.stringify(fields));
          if(!this.ictUserType) {
            if (fields.Name__c && fields.Name__c.trim()) {

                if (!fields.Emergency_Phone_Number__c) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Validation Error',
                            message: 'Emergency: Contact Number is required when First Name is entered.',
                            variant: 'error'
                        })
                    );
                    return;
                }
            }

            if (fields.Emergency_Phone_Number__c && !/^\d{1,10}$/.test(fields.Emergency_Phone_Number__c)) {
                this.showToast(
                    'Error',
                    'Emergency: Contact Number must contain only digits and not exceed 10 digits.',
                    'error'
                );
                return;
            }
        }
          this.template.querySelector('lightning-record-edit-form').submit(fields);  
      }
      handleSuccess(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        this.staffEditFlag=false;
        let staffRecID=event.detail.id;
        console.log(' Staff saved, Id:', staffRecID);
        console.log(' Roles to sync:', JSON.stringify(this.selectedRoleValues));
        console.log(' Hourly Rate to save BEFORE Apex call:', this.genralHourlyRate); 
        console.log(' Afternoon Rate to save BEFORE Apex call:', this.afterNoonShiftRate); 
        console.log(' classificationLevel:', this.classificationLevel); 
        console.log(' classificationPayType:', this.classificationPayType); 
        console.log(' categoryType:', this.categoryType); 
        console.log(' AjobType:', this.jobType); 
        console.log(' publicHolidayRate:', this.publicHolidayRate); 
        console.log(' sundayhourlyRate:', this.sundayhourlyRate); 
         // 🔗 Call Apex to sync StaffRoles
    createStaffRoles({ 
        staffId: staffRecID, 
        selectedRoles: JSON.stringify(this.selectedRoleValues),
        hourlyRate: this.genralHourlyRate,
        saturdayHourlyRate:this.sturdayHourlyRate,
        sundayHourlyRate:this.sundayhourlyRate,
        publicHolidayHourlyRate:this.publicHolidayRate,
        afternoonShiftRate:this.afterNoonShiftRate,
        nightShiftRate:this.nightShiftRate,
        sleepoverAllowance:this.sleepoverAllowance,
        dropdownSelectedRole: this.selectedEmploymentRole || '',
        categoryType: this.categoryType || '',
        classificationLevel: this.classificationLevel || '',
        classificationPayType: this.classificationPayType || '',
        jobType: this.jobType || '',
        selectedDropDownFacilityValue :  this.selectedDropDownFacilityValue,
        allowanceMethod:this.allowanceMethod,
        twoBreakAllowance:this.twoBreakAllowance,
        oneBreakAllowance:this.oneBreakAllowance,
        standardWeeklyRate:this.standardWeeklyRate
    })
    .then(() => {
        console.log(' StaffRoles updated successfully in Apex');
         console.log(' genralHourlyRate',this.genralHourlyRate);
         console.log(' Afternoonrate',this.afterNoonShiftRate);
         console.log(' sleepover',this.sleepoverAllowance);
          console.log(' Roles to sync1:', JSON.stringify(this.selectedRoleValues));
    })
    .catch(error => {
        console.error(' Error updating StaffRoles:', error);
    });

   const payload = {
    staffId: staffRecID,
    selectedFacilityIds: this.selctedMultipleFcailityValues
     }
    upsertStaffFacilities({
        wrapperJson: JSON.stringify(payload)
    }).then(reult=>{
        console.log('reult in multi facility ==>'+JSON.stringify(reult));
    })
        this.portalStaffId = event.detail.id;
        this.confirmEmailError='';
        this.primaryEmailError=false;
        this.secondaryEmailError=false;
        this.cardFlag = true;
        this.adminFlag = true;
        this.visible = true;
        
        console.log('file base64 in success=>'+JSON.stringify(this.base64FileData));
        console.log('Record in success=>'+this.preTaxRecId);
        console.log('File in success=>'+this.fileName);
       
        if (this.createStaffForXeroOnly || this.createStaffForXeroAll) {
            this.cardFlag = false;
            this.adminFlag = false;
            this.visible = false;
        }

        this.CreateUserflag = true;
       
        console.log('staff create user falg '+this.CreateUserflag)
       
       // Refresh the data after success
       refreshApex(this.refreshTable);
       refreshApex(this.wiredresult);
        //this.fetchStaff();
        console.log('after success +')
        setTimeout(() => {
            this.showSpinner = false;
            //refreshApex(this.recordsToDisplay);
            this.addingPreTax();  
        }, 2000);           
             
        if(this.fileName.length>0){
            uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:staffRecID,obj:'staff'}).then(result => {
                console.log('Upload result = ' +result);
                //this.fileName = this.fileName + ' - Uploaded Successfully';                 
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: this.file.name + ' - Uploaded Successfully',
                        variant: 'Success',
                    }),
                );
                refreshApex(this.refreshTable);
                 refreshApex(this.wiredresult);
               // this.CreateUserflag = true;
              if (this.createStaffForXeroOnly || this.createStaffForXeroAll) {
                    // const cancelEvent = new CustomEvent('backtoxero', {
                    //     bubbles: true,
                    //     composed: true
                    // });
                    // this.dispatchEvent(cancelEvent);
                    this.cardFlag = false;
                    this.adminFlag = false;
                    this.visible = false;
                }

                this.CreateUserflag = true;
                 console.log('staff create user falg1 '+this.CreateUserflag)
               
            }).catch(error => {
                  window.console.log(error);
                  this.dispatchEvent(
                      new ShowToastEvent({
                          title: 'Error in uploading File',
                          message: error.message,
                          variant: 'error',
                      }),
                  );
                  this.showSpinner = false;
              });
        }
        // this.fetchStaff();
        setTimeout(() => {
            this.showSpinner = false;
            refreshApex(this.refreshTable);
             refreshApex(this.wiredresult);
            this.addingPreTax();  
            
        }, 2000);
         console.log('staff create user falg2 '+this.CreateUserflag)
      }

      handleConfirmReset(event){
        this.userCrearedflag = true;
        this.CreateUserflag = false;        
      }

      handlecreateuser(event) {
        this.CreateUserflag = false;
        createUser({
            StaffId: this.portalStaffId,
            selectedRole: this.selectedRole,
            selectedUserType: this.selectedUserType
        })
        .then(result => {
            console.log('Success: ' + JSON.stringify(result));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Account created. Please check your mail.',
                    variant: 'Success',
                })
            );
        })
        .catch(err => {
            console.error('Error: ' + JSON.stringify(err));
        });
        this.userCrearedflag = false;
        this.selectedUserType = '';
        this.selectedRole = '';
         if (this.createStaffForXeroOnly || this.createStaffForXeroAll) {
            const cancelEvent = new CustomEvent('backtoxero', {
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(cancelEvent);
           
        }
    }   
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }
    handleCloseModal(event){
        if (!this.portalStaffId) {
            console.error('Error: StaffId is missing!');
            return;
        }
        updatestaff({
            StaffId: this.portalStaffId,
        })
        .then(result => {
            console.log('Success: ' + JSON.stringify(result));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Staff Created Successfully',
                    variant: 'success',
                })
            );
        })
        .catch(err => {
            console.error('Error: ' + JSON.stringify(err));
        });

        this.selectedUserType = '';
        this.selectedRole = '';
        this.CreateUserflag = false;
        this.userCrearedflag = false;
        if (this.createStaffForXeroOnly || this.createStaffForXeroAll) {
            const cancelEvent = new CustomEvent('backtoxero', {
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(cancelEvent);
           
        }

    }
    
    handleeditClose(){        
        this.staffEditFlag=false;
        this.cardFlag = true;
        this.adminFlag = true;
        this.visible = true;
        this.roleoptionsforFacility = [];
        this.selectedRoleValues = [];
       if(this.createStaffForXeroOnly || this.createStaffForXeroAll){
            const cancelEvent = new CustomEvent('backtoxero', {
                bubbles: true,  
                composed: true  
            });
            this.dispatchEvent(cancelEvent);
        }
        this.Nationality = '';
    }  

   

    handleError(event) {
    event.preventDefault(); // Prevent default UI (red errors under fields)
    this.removeRadius = true;
    this.fieldErrorMap = {};
    let message = 'An unknown error occurred.';
    const detail = event.detail;
    const errorMessages = [];
    
    // 1. Record-level errors (e.g. from Apex)
    const recordErrors = detail?.output?.errors;
    if (recordErrors && recordErrors.length > 0) {
        recordErrors.forEach(err => {
            if (err.message) {
                errorMessages.push(err.message);
            }
        });
    }

    // 2. Field-level errors (e.g. validation errors on fields)
    const fieldErrors = detail?.output?.fieldErrors;
    if (fieldErrors) {
        Object.keys(fieldErrors).forEach(fieldName => {
            fieldErrors[fieldName].forEach(error => {
                errorMessages.push(`${fieldName}: ${error.message}`);
            });
            this.fieldErrorMap[fieldName] = true;
        });
    }

    // 3. Top-level message fallback
    if (errorMessages.length === 0 && detail?.message) {
        errorMessages.push(detail.message);
    }

    // Final combined message
    message = errorMessages.join('\n');
       

    // Show toast
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Save Failed',
            message: message,
            variant: 'error',
            
        })
    );
}

    @track handleStatusFlag=false;
    @track facId;
    @track facstatus;
    @track message;
    @track originalToggleState;
    @track toggleElement; 
    @track finalstatus;
    @track staffname;
    handlefacStatus(event){   
    this.toggleElement = event.target;
    this.handleStatusFlag=true;  
        this.facId=event.currentTarget.dataset.id;
        this.facstatus=event.target.dataset.name;
        this.staffname=event.target.dataset.staffname;
        this.originalToggleState = this.facstatus;
        
        if(this.facstatus == 'true'){
        this.finalStatus='false';
            this.message= 'Staff is Inactive'
        }
        else if(this.facstatus == 'false'){
        this.finalStatus='true';
        this.message= 'Staff is Active'
        }
        
    }
        
 handlestatuschange() {

    statusStaff({ IdValue: this.facId, status: this.finalStatus })
        .then(response => {


            this.dispatchEvent(
                new ShowToastEvent({
                    title: '',
                    message: this.message,
                    variant: 'success'
                })
            );

            this.handleStatusFlag = false;

            refreshApex(this.wiredresult).then(() => {
                this.applyFilters(); 
            });
        })
        .catch(error => {
            this.showSpinner = false;
            console.error('Error updating status:', error);
        });
}


    handlestatusclose(){
        const element = this.template.querySelector('[data-id='+this.facId+']'); 
        console.log('original state',this.originalToggleState);
        console.log('if1 condition');
        console.log('element',JSON.stringify(element.checked));   
        if(this.originalToggleState == "true"){
            element.checked=this.originalToggleState;
            console.log('if condition');
            // this.recordsToDisplay = [];

            // this.handlesave();
        }else{
            console.log('else condition');
            element.checked=!(this.originalToggleState);
        }
        console.log('element',JSON.stringify(element.checked));
        this.handleStatusFlag=false;  
    }

    @track listFlag=false;
    
    get cardViewClass(){
        return this.cardFlag ? 'slds-box slds-size_1-of-6 slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-6  slds-align_absolute-center'; // you can use your custom class here.
        //'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse' : 'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse'
    }

    get listViewClass(){
        return this.listFlag ? 'slds-box slds-size_1-of-6  slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-6 slds-align_absolute-center'; // you can use your custom class here.
    }

    handleChange(event) {
        this.value = event.target.dataset.name;
        if(this.value=='cardview'){
            this.cardFlag=true;
            this.listFlag=false;
        }else  if(this.value=='listview'){
            this.cardFlag=false;
            this.listFlag=true;
        }
    }

    handleChange1(event){
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        event.target.value = inputValue;
        if (fieldName === 'name') {
            this.name = inputValue;
        } else if (fieldName === 'lastname1') {
            this.lastname1 = inputValue;
        }
    }
  
    handleInputChange(event) {
        let index = event.target.dataset.id;
        let fieldName = event.target.name;
        let value = event.target.value;
        for(let i = 0; i < this.accountRecList.length; i++) {
            if(this.accountRecList[i].index === parseInt(index)) {
                this.accountRecList[i][fieldName] = value;
            }
        }
    }
    createRow(accountRecList) {
        let accountObject = {};
        if(accountRecList.length > 0) {
            accountObject.index = accountRecList[accountRecList.length - 1].index + 1;
        } else {
            accountObject.index = 1;
        }
        accountObject.Description = null;
        accountObject.Quantity = null;
        accountObject.preTaxDate = null;
        accountObject.comment = null;
        accountRecList.push(accountObject);       
    }
   
    addDocumentRow(){
        this.createRow(this.accountRecList);
    }
    removeRow(event) {
        let toBeDeletedRowIndex = event.target.name;
        console.log(toBeDeletedRowIndex);
        let accountRecList = [];
        for(let i = 0; i < this.accountRecList.length; i++) {
            let tempRecord = Object.assign({}, this.accountRecList[i]); //cloning object
            console.log(tempRecord);
            if(tempRecord.index !== toBeDeletedRowIndex) {
                accountRecList.push(tempRecord);
            }
        }
        for(let i = 0; i < accountRecList.length; i++) {
            accountRecList[i].index = i + 1;
        }
        this.accountRecList = accountRecList;
    }

    handleRowActions(event){ 
        const row = event.detail.row
        this.preTaxRecId= row.Id;
        this.parentStaffId=row.Staff__c;
        const actionName = event.detail.action.name;
        switch (actionName) {
            case 'delete':
              deleteRecord(row.Id).then(() => {
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: 'Success',
                    message: 'Staff Document has been deleted',
                    variant: 'success'
                  })
                );
               // refreshApex(this.invoiceTable);
               refreshApex(this.refreshTable);
             //  this.fetchStaff()
               this.addingPreTax();
              }).catch(error => {
                console.log('error=>'+JSON.stringify(error));
             });
            break;

        case 'edit':
            this.showPreTaxRecordEditForm=true;
        break;
        case 'view_details':
              event.preventDefault(); 
              const url = row.View_File__c;
              this.currentUrl = url;
             // console.log('file url  '+ this.currentUrl);  
              this.isModalOpen = true;
              const fileType = this.getFileType(this.currentUrl);
        
            //console.log('file type: ' + fileType);
            // Check if the file type is not PNG or PDF
            if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg') {
                setTimeout(() => {
                    this.closeModal();
                }, 1700);
                
            }  
        break;
        }      
    }
    
    closePreTaxRecordEditForm(event){
       this.showPreTaxRecordEditForm=false;
    }

    handlePreTaxSuccess(event){
        this.preTaxRecId=event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Changes saved successfully.',
                variant: 'success',
            }),
        );
        this.showPreTaxRecordEditForm=false;
        setTimeout(() => {
            this.showSpinner = false;
            this.addingPreTax();  
        }, 2000);
            if(this.fileName.length  > 0){
                this.showSpinner = true;
            console.log('file base64 in success=>'+JSON.stringify(this.base64FileData));
            console.log('Record in success=>'+this.preTaxRecId);
            console.log('File in success=>'+this.fileName);
            
              console.log('file length'+this.fileName.length);
             // console.log('base64Data>>', JSON.stringify(this.base64FileData ));
              uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:this.preTaxRecId,obj:'ChildStaff'}).then(result => {
                  console.log('Upload result = ' +result);
                  //this.fileName = this.fileName + ' - Uploaded Successfully';                 
                  this.dispatchEvent(
                      new ShowToastEvent({
                          title: 'Success',
                          message: this.file.name + ' - Uploaded Successfully',
                          variant: 'success',
                      }),
                  );
                
              }).catch(error => {
                    window.console.log(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error in uploading File',
                            message: error.message,
                            variant: 'error',
                        }),
                    );
                    this.showSpinner = false;
                });
             }           
             setTimeout(() => {
                
                this.addingPreTax(); 
                this.showSpinner = false; 
            }, 3000);
            this.accountRecList=[];        
    }

    handlePreTaxRecordFormSubmit(){
        this.template.querySelector('lightning-record-edit-form[data-recid="PreTaxForm"]').submit(fields);
    }

    addingPreTax(){
        console.log('Parent record Id '+this.parentStaffId );
        
        fetchStaff({recordId :this.parentStaffId }).then(response => {
            console.log('satff list after save'+JSON.stringify(response));
            this.satffDataJasonformat[response.Id]={"street":response.Address__Street__s,"city":response.Address__City__s,"stateCode":response.Address__StateCode__s,"countryCode":response.Address__CountryCode__s,"postalCode":response.Address__PostalCode__s,"childRecords":response.Child_Staffs__r,
                "preTaxvalue":response.Pre_Tax_Calculator__c,"pretaxone":response.Pre_Tax_One_Value__c,"pretaxtwo":response.Pre_Tax_Two_Value__c,"pretaxThree":response.Pre_Tax_Three_Value__c,"pretaxFour":response.Pre_Tax_Four_Value__c,"pretaxFive":response.Pre_Tax_Five_Value__c,
                "postTax":response.Post_Tax__c,"primaryVal":response.Make_Primary_as_Approver__c,"secondaryVal":response.Make_Secondary_as_Approver__c,"voluntaryContribution":response.Voluntary_Contribution__c,"ContributionCurrency":response.Voluntary_Contribution_Fixed__c,"ContributionPercent":response.Voluntary_Contribution_Percent__c,"ContributionNone":response.Voluntary_Contribution_None__c,
                 "status":response.Status__c};
           let childRec= response.Child_Staffs__r;
           this.DocumentTableData=[];
           childRec.forEach(rec=>{
            if(rec.Type__c ){
                this.DocumentTableData.push(rec)
            }
           });
        }); 
    }
   
    ShowDocumentSection(event){
        this.showStaffDocumentSection= true;
        this.parentStaffId=event.currentTarget.dataset.id; 
        console.log('parent Id=>'+this.parentStaffId);

    }
    closeDocumentSection(){
        this.showStaffDocumentSection= false;
    }

    handleDocumentchange(event) {
        let index = event.target.dataset.id;
        let fieldName = event.target.name;
        let value = event.target.value;
        if(fieldName=='file'){
            this.onDocumentUpload(event).then(filedata => {
                 for (let i = 0; i < this.accountRecList.length; i++) {
                        if (this.accountRecList[i].index === parseInt(index)) {
                            this.accountRecList[i]['fileName'] = filedata.fileName;
                            this.accountRecList[i]['base64Data'] = JSON.stringify(filedata.base64Data);
                            }
                        }
                        console.log('file data=>' + JSON.stringify(this.accountRecList));
                    }).catch(error => {
                        console.error('Error:', error);
                    });
                }else{
                    for (let i = 0; i < this.accountRecList.length; i++) {
                        if (this.accountRecList[i].index === parseInt(index)) {
                            this.accountRecList[i][fieldName] = value;
                        }
                    }  
            }
        console.log('file data=>'+JSON.stringify(this.accountRecList));
    }
          
    onDocumentUpload(event) {
        return new Promise((resolve, reject) => {
            this.isattachError = false;
            this.showSpinner = true;
            let selectedFilesToUpload = event.target.files;
            let file = selectedFilesToUpload[0];
            let fileName = selectedFilesToUpload[0].name.split(" ").join("");
            let fileType = selectedFilesToUpload[0].type;
            let fileSize = selectedFilesToUpload[0].size;
    
            if (file.size > this.MAX_FILE_SIZE || file.size < this.MIN_FILE_SIZE) {
                this.isattachError = true;
                reject('File size out of range');
                return;
            }
    
            let fileReaderObj = new FileReader();
            fileReaderObj.onloadend = () => {
                let fileContents = fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',') + 1);
    
                let sliceSize = 1024;
                let byteCharacters = atob(fileContents);
                let bytesLength = byteCharacters.length;
                let slicesCount = Math.ceil(bytesLength / sliceSize);
                let byteArrays = new Array(slicesCount);
                for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                    let begin = sliceIndex * sliceSize;
                    let end = Math.min(begin + sliceSize, bytesLength);
                    let bytes = new Array(end - begin);
                    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }
    
                let myFile = new File(byteArrays, fileName, { type: fileType });
    
                let reader = new FileReader();
                reader.onloadend = () => {
                    let base64data = reader.result;
                    let base64FileData = base64data.substr(base64data.indexOf(',') + 1);
                    resolve({ "fileName": fileName, "base64Data": base64FileData });
                };
                reader.readAsDataURL(myFile);
            };
            fileReaderObj.readAsDataURL(file);
    
            this.showSpinner = false;
            console.log('file prepared');
        });
    }

    handleSubmitDocuments() {
        this.showSpinner = true;
        this.accountRecList.forEach(item => {
            this.staffDocumentMap[item.fileName] = item.base64Data;
        });
        console.log('staffMap=>' + JSON.stringify(this.staffDocumentMap));
        insertPreTax({JsonString: JSON.stringify(this.accountRecList),staffID: this.parentStaffId,isPretax: false
        }).then(result => {
            console.log('document result' + JSON.stringify(result));
            result.forEach(item => {
                let base64Data = this.staffDocumentMap[item.File_Name__c]; 
                console.log('base64' + base64Data)
                uploadFile({base64:base64Data,filename: item.File_Name__c,recordId: item.Id,obj: 'ChildStaff'}).then(result => {
                    console.log('Upload result = ' + result);
                    //this.fileName = this.fileName + ' - Uploaded Successfully';
                    
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: item.File_Name__c + ' - Uploaded Successfully',
                            variant: 'success',
                        }),
                    );
                    this.showSpinner = false;
                    this.accountRecList=[];
                    this.staffEditFlag=false;
                    
                    refreshApex(this.refreshTable)
                   // this.fetchStaff();                   
                }).catch(error => {
                    //console.error(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error in uploading File. Please Provide All Details',
                            message: error.message,
                            variant: 'error',
                        }),
                    );
                    this.showSpinner = false;
                });
               
            })
            this.showStaffDocumentSection=false;
            this.showPreTaxRecordEditForm=false;
            this.staffEditFlag=true;
        }).catch(error => {
           
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error in uploading File. Please Provide All Details',
                    message: error.message,
                    variant: 'error',
                }),
            );
            console.error('error' + JSON.stringify(error));
            this.showSpinner = false;
            this.showStaffDocumentSection=false;
            this.showPreTaxRecordEditForm=false;
            this.staffEditFlag=false;
        });      
    }
    
    @track primaryApproverValue=false;
    @track secondaryApproverValue=false;
    @track VoluntaryContributionCurrency=false;
    @track VoluntaryContributionPercent=false;
    @track voluntaryContributionCureencyVal=0;
    @track voluntaryContributionPercentVal=0;
    @track confirmEmailError;
    @track saveButtonDisable=false;
    @track secondaryEmailError=false;
    @track primaryEmailError=false;

    primaryHandleApprover(event){
        this.primaryApproverValue = event.target.value; 
        if( this.primaryApproverValue==true){
                this.secondaryApproverValue=false;
        }
        if(this.primaryApproverValue==false){
                this.secondaryApproverValue=true;
        }
    }

    secondaryHandleApprover(event){
        this.secondaryApproverValue = event.target.value; 
        if(this.secondaryApproverValue==true){
                this.primaryApproverValue=false;
            } 
        if(this.secondaryApproverValue==false){
                this.primaryApproverValue=true ;
        }     
    }

    EmailChangeHandler(event){

      this.ValidateEmail(event) ;
    }

    ValidateEmail(event) {
       if(event.target.name=='primary'){
            this.emailCheckFunction(event);
            this.primaryEmailError=true;
            this.secondaryEmailError=false;
       
       }else{
            this.emailCheckFunction(event);
            this.primaryEmailError=false;
            this.secondaryEmailError=true;
       }       
    }

    emailCheckFunction(event){
    // var validRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    var validRegex = /^\w+([\.-]?\w+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,3})+(\.(gov|com|org|co)(\.au)?)?$/;

    if (!event.target.value) {
        // If it's empty, reset error message and enable the save button
        this.confirmEmailError = '';
        this.saveButtonDisable = false;
        return; // Exit the function
    }
        if (event.target.value.match(validRegex)) {
            this.confirmEmailError='';
            this.saveButtonDisable=false;
        console.log('valid email')
        } else {
    
            console.log(' in valid  email');
            this.confirmEmailError='Please Enter valid Email';
            this.saveButtonDisable=true;    
        }
    }
    
    VoluntaryChange(event){
        if(event.target.value=='Fixed'){
            this.VoluntaryContributionCurrency=true;
            this.VoluntaryContributionPercent=false;
            this.VoluntaryContributionNone = false;
        }
        if(event.target.value=='Percentage'){
            this.VoluntaryContributionPercent=true;
            this.VoluntaryContributionCurrency=false;
            this.VoluntaryContributionNone = false;
        }
        else {            
            this.voluntaryContributionCureencyVal = 0;
            this.voluntaryContributionPercentVal = 0;
        }
        if(event.target.name=='contributionFixed'){
            this.voluntaryContributionCureencyVal=event.target.value;
        }
        if(event.target.name=='contributionPercent'){
            this.voluntaryContributionPercentVal=event.target.value;
        }       
        console.log( this.voluntaryContributionPercentVal);
    }

   
    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

  
    typeOfUserChnage(event){
        if(event.detail.value=='ICT User'){
            this.ictUserType=true;
        }else{
            this.ictUserType=false;
        }
    }
   


    /*  praveen changes for nursing awards start*/
    employmentTypeChange(event){ 
       if(event.target.name=='fixedcategoryType'){
           if(event.target.value==true){
                this.isFixedcategory=false;
                this.includeSuperannuation = false;
                this.superannuationValue = 'Include Superannuation';
                this.paidBreak=true;
                console.log('onchange event : '+this.superannuationValue);
           }else{
                this.isFixedcategory=true;
                this.paidBreak=false;
                this.includeSuperannuation = true;
                this.superannuationValue = 'Exclude Superannuation';
                console.log('onchange event : '+this.superannuationValue);
           }
        }

        if(event.target.name=='categoryType'){
            this.categoryType=event.target.value;  
        }
        if(event.target.name=='jobType'){
            this.jobType=event.target.value;  
        }
        if(event.target.name=='classificationType'){
            this.classificationLevel=event.target.value;  
        }
        if(event.target.name=='classificationPayType'){
            this.classificationPayType=event.target.value;    
        }
          let jobTypeValue=(this.jobType =='Full-time' ||this.jobType =='Part-time'  ) ?'Full-time and part-time' :this.jobType;
              console.log(' jobTypeValue ' +jobTypeValue);

        if( this.categoryType !=null &&  this.jobType !=null &&  this.classificationLevel !=null &&  this.classificationPayType !=null){ 
            console.log(' categoryType ' + this.categoryType);
            console.log(' jobType ' + this.jobType);
            console.log(' classificationType ' + this.classificationLevel);
            console.log(' classificationPayType ' + this.classificationPayType);
            if(this.isSchadsAwards == true){
                 getShadAwards({categoryType:this.categoryType,jobType:jobTypeValue,classificationType :this.classificationLevel,classificationPayType:this.classificationPayType }).then(result=>{

                console.log('Shad awards list '+JSON.stringify(result));
                if(result.length>0){
                    this.genralHourlyRate=result[0].General_Hourly_pay_rate__c;
                    this.nightShiftRate=result[0].Night_shift_Hourly_Rate__c;
                    this.publicHolidayRate=result[0].Public_holiday_Hourly_Rate__c;
                    this.sturdayHourlyRate=result[0].Saturday_Hourly_Rate__c;
                    this.afterNoonShiftRate=result[0].Afternoon_shift_Hourly_Rate__c;
                    this.sundayhourlyRate=result[0].Sunday_Hourly_Rate__c;
                    this.sleepoverAllowance=result[0].Sleepover_Allowance__c;
                    this.standardWeeklyRate=result[0].Weekly_Pay_Rate__c;
                }else{
                    this.genralHourlyRate=0;
                    this.nightShiftRate=0;
                    this.publicHolidayRate=0;
                    this.sturdayHourlyRate=0;
                    this.afterNoonShiftRate=0;
                    this.sundayhourlyRate=0;
                     this.sleepoverAllowance=0;
                     this.standardWeeklyRate=0;
                }
               
             });
            }

             if(this.isNursingAwards == true){
                 getNursingAwrds({categoryType:this.categoryType,jobType:jobTypeValue,classificationType :this.classificationLevel,classificationPayType:this.classificationPayType }).then(result=>{

                console.log('Nursing awards list '+JSON.stringify(result));
                if(result.length>0){
                    this.genralHourlyRate=result[0].General_Hourly_Pay_Rate__c;
                    this.nightShiftRate=result[0].Night_Shift_Hourly_Rate__c;
                    this.publicHolidayRate=result[0].Public_Holiday_Hourly_Rate__c;
                    this.sturdayHourlyRate=result[0].Saturday_Hourly_Rate__c;
                    this.afterNoonShiftRate=result[0].Afternoon_Shift_Hourly_Rate__c;
                    this.sundayhourlyRate=result[0].Sunday_Hourly_Rate__c;
                    this.sleepoverAllowance=0;
                }else{
                    this.genralHourlyRate=0;
                    this.nightShiftRate=0;
                    this.publicHolidayRate=0;
                    this.sturdayHourlyRate=0;
                    this.afterNoonShiftRate=0;
                    this.sundayhourlyRate=0;
                     this.sleepoverAllowance=0;
                }
               
             });
            }

            if(this.isChildCareAwards == true){
                 getChildcareAwrds({categoryType:this.categoryType,jobType:jobTypeValue,classificationType :this.classificationLevel,classificationPayType:this.classificationPayType }).then(result=>{

                console.log('Child Care awards list '+JSON.stringify(result));
                if(result.length>0){
                    this.genralHourlyRate=result[0].General_Hourly_Pay_Rate__c;
                    this.nightShiftRate=result[0].Night_Shift_Hourly_Rate__c;
                    this.publicHolidayRate=result[0].Public_Holiday_Hourly_Rate__c;
                    this.sturdayHourlyRate=result[0].Saturday_Hourly_Rate__c;
                    this.afterNoonShiftRate=result[0].Afternoon_Shift_Hourly_Rate__c;
                    this.sundayhourlyRate=result[0].Sunday_Hourly_Rate__c;
                    this.sleepoverAllowance=0;
                }else{
                    this.genralHourlyRate=0;
                    this.nightShiftRate=0;
                    this.publicHolidayRate=0;
                    this.sturdayHourlyRate=0;
                    this.afterNoonShiftRate=0;
                    this.sundayhourlyRate=0;
                     this.sleepoverAllowance=0;
                }
               
             });
            }


           
        }  

    }
    /*  praveen changes for nursing awards start*/
    handleRoleChange(event){
        this.createdShiftRole = '';

        event.target.value.forEach(rec => {
            this.createdShiftRole += rec + ';';
        });
        // Remove the trailing semicolon
        if (this.createdShiftRole.endsWith(';')) {
            this.createdShiftRole = this.createdShiftRole.slice(0, -1);
        }

        console.log('staff roles ' + this.createdShiftRole);

    }
    handleGeoLocationStatus(event){
        this.geoLocationStatus=event.target.checked;
        console.log('geo location '+this.geoLocationStatus);
    }

@track searchName = '';
@track activeFilterOn = true;
@track inactiveFilterOn = false;
@track StaffFacility='';
@track roleoptions = [];
@track selectedValues = [];
handleFaciltyChange(event){
     /*   praveen changes for nursing start*/
        console.log('facilty change '+event.detail.value)
        this.StaffFacility=event.detail.value;
        console.log('StaffFacility ' +this.StaffFacility);
        this.fetchFacility(this.StaffFacility);
        this.fetchRoleOptions();
        this.categoryType='';
        this.jobType='';
        this.classificationLevel='';
        this.classificationPayType='';
        /*  praveen changes for nursing awards end*/
} 

handleSearchInput(event) {
    this.searchName = event.target.value;
    this.applyFilters();
}

handleActiveToggle() {
    this.activeFilterOn = !this.activeFilterOn;
    if (this.activeFilterOn) this.inactiveFilterOn = false;
    this.applyFilters();
}

handleInactiveToggle() {
    this.inactiveFilterOn = !this.inactiveFilterOn;
    if (this.inactiveFilterOn) this.activeFilterOn = false;
    this.applyFilters();
}



applyFilters() {
    console.log('applyfilter triggered');
    console.log('this.orginalData: ' + JSON.stringify(this.orginalData));

    let result = [...this.orginalData];

    // Convert search input to lowercase for case-insensitive matching
    const searchLower = this.searchName ? this.searchName.toLowerCase() : '';

    if (searchLower !== '') {
        result = result.filter(staff => {
            const nameField = staff.Display_Nickname__c || '';
            const roleField = staff.Role__c || '';
            const contactField = staff.Contact_Number__c || '';

            return (
                nameField.toLowerCase().includes(searchLower) ||
                roleField.toLowerCase().includes(searchLower) ||
                contactField.toLowerCase().includes(searchLower)
            );
        });
    }

    // Status filter
    if (this.activeFilterOn && !this.inactiveFilterOn) {
        result = result.filter(staff => staff.Status__c === true || staff.Status__c === 'true');
    } else if (this.inactiveFilterOn && !this.activeFilterOn) {
        result = result.filter(staff => staff.Status__c === false || staff.Status__c === 'false');
    }

    this.records = result;
    this.filteredRecords = [...result];
    this.pageNumber = 1; // Reset to page 1 on new filter
    this.totalRecords = result.length;

    this.noRecordsFlag = this.totalRecords === 0;

    this.paginationHelper();
}


    toggleDropdown(event) {
        event.stopPropagation(); // prevent bubbling from the button

        // Close other dropdowns
        this.showDropdown = false;   // close Nationality
        this.isExpanded = false;     // close Languages

        // Toggle Roles dropdown
        this.isOpen = !this.isOpen;

        if (this.isOpen) {

            // delay adding listener to prevent instant close
            setTimeout(() => {
                this._boundHandleClickOutside = this.handleClickOutside.bind(this);
                window.addEventListener('click', this._boundHandleClickOutside);
            }, 0);

        } else {
            window.removeEventListener('click', this._boundHandleClickOutside);
        }
    }


    handleClickOutside(event) {
        const path = event.composedPath();

        const roleBox = this.template.querySelector('.role-dropdown');
        const nationalityBox = this.template.querySelector('.nationality-dropdown');
        const languageBox = this.template.querySelector('.language-dropdown');
        const gridElement = this.template.querySelector('.grid');
        const facilityBox = this.template.querySelector('.facility-dropdown');
           const employmentBox = this.template.querySelector('.employment-role-dropdown');

        const clickedInsideRole = roleBox && path.includes(roleBox);
        const clickedInsideNationality = nationalityBox && path.includes(nationalityBox);
        const clickedInsideLanguage = languageBox && path.includes(languageBox);
        const clickedInsideGrid = gridElement && path.includes(gridElement);
        const clickedInsideFaciltiy = facilityBox && path.includes(facilityBox);
          const clickedInsideEmployment = employmentBox && path.includes(employmentBox);

        // Close Roles dropdown
        if (this.isOpen && !clickedInsideRole) {
            this.isOpen = false;
        }

        // Close Nationality dropdown
        if (this.showDropdown && !clickedInsideNationality) {
            this.showDropdown = false;
        }

        // Close Languages dropdown
        if (this.isExpanded && !clickedInsideLanguage) {
            this.isExpanded = false;
        }
         if (this.facilityDropDownOpen && !clickedInsideFaciltiy) {
            this.facilityDropDownOpen = false;
        }
        if (this.roleDropDownForEmployment && !clickedInsideEmployment) {
            this.roleDropDownForEmployment = false;
        }

        // Grid animation
        if (
            gridElement &&
            !clickedInsideGrid &&
            !path.some(node => node.tagName === 'IMG')
        ) {
            if (gridElement.classList.contains('slide-in')) {
                gridElement.classList.remove('slide-in');
                gridElement.classList.add('slide-out');
            }
        }

        // Remove listener when all dropdowns are closed
        if (!this.isOpen && !this.showDropdown && !this.isExpanded && !this.facilityDropDownOpen && !this.roleDropDownForEmployment) {
            window.removeEventListener('click', this._boundHandleClickOutside);
        }
    }



get activeButtonClass() {
    return this.activeFilterOn ? 'active-button' : '';
}

get inactiveButtonClass() {
    return this.inactiveFilterOn ? 'active-button' : '';
}

get viewToggleIcon() {
    return this.cardFlag ? 'list' : 'cards';
}

get viewToggleTitle() {
    return this.cardFlag ? 'Switch to List View' : 'Switch to Card View';
}

// Used for data-name on the button to inform handleChange()
get viewToggleTarget() {
    return this.cardFlag ? 'listview' : 'cardview';
}

    get recordsWithToggleStyle() {
    return this.recordsToDisplay.map((fac) => {
        const isActive = fac.Status__c === true || fac.Status__c === 'true';
        return {
            ...fac,
            toggleTrackClass: isActive ? 'toggle-track active' : 'toggle-track',
            toggleKnobClass: isActive ? 'toggle-knob active' : 'toggle-knob',
            toggleLabelClass: isActive ? 'toggle-label active' : 'toggle-label inactive',
            toggleLabel: isActive ? 'Active' : 'Inactive'
        };
    });
 }
 /*  praveen changes for nursing awards start*/
 fetchFacility(facId) {
        
        getfacilityById({ facId: facId })
            .then(result => {
                if (result) {
                    this.typeOfService = result.Type_of_Service__c;
                    console.log('Type of Service:', this.typeOfService);

                    if(this.typeOfService == 'NDIS'){
                        this.isSchadsAwards = true;
                        this.isNursingAwards = false;
                        this.isFixedcategory =false;
                        this.isChildCareAwards = false;
                    }else if(this.typeOfService == 'Nursing'){
                        this.isSchadsAwards = false;
                        this.isNursingAwards = true;
                        this.isFixedcategory =false;
                        this.isChildCareAwards = false;
                    }else if(this.typeOfService == 'Child Care'){ 
                        this.isSchadsAwards = false;
                        this.isNursingAwards = false;
                        this.isFixedcategory =false;
                        this.isChildCareAwards = true;
                    }else if(this.typeOfService ==undefined || this.typeOfService == null || this.typeOfService ==''){
                        this.isSchadsAwards = false;
                        this.isNursingAwards = false;
                        this.isFixedcategory =true;
                        this.isChildCareAwards = false;
                    }else{
                        this.isSchadsAwards = false;
                        this.isNursingAwards = false;
                        this.isFixedcategory =true;
                        this.isChildCareAwards = false;
                    }

                }
            })
            .catch(error => {
                console.error('Error fetching facility:', error);
            });
    }
    /*  praveen changes for nursing awards end*/
    
    handleKeyShortcut(event) {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
        event.preventDefault();
        this.handleCreateNewStaff();
        }
    }

    handleSearchChange(event) {
        const value = event.target.value;
        this.Nationality = value;   // ⭐ VERY IMPORTANT — updates even when cleared

        const searchKey = value.toLowerCase();

        if (searchKey) {
            const filtered = this.allNationalities
                .filter(nation => nation.toLowerCase().includes(searchKey))
                .map(n => ({
                    label: n,
                    value: n
                }));

            this.filteredOptions = filtered;
            this.noResults = filtered.length === 0;
        } else {
            // reset dropdown when input is cleared
            this.filteredOptions = this.allNationalities.map(n => ({
                label: n,
                value: n
            }));
            this.noResults = false;
        }

        // Always show dropdown when typing or clearing
        this.showDropdown = true;
    }


    toggleDrop(event) {
        event.stopPropagation(); // prevent bubbling

        // Close other dropdowns
        this.isOpen = false;        // close Roles
        this.isExpanded = false;    // close Languages

        this.showDropdown = !this.showDropdown;

        if (this.showDropdown) {
            // Populate dropdown options
            this.filteredOptions = this.allNationalities.map(n => ({
                label: n,
                value: n
            }));
            this.noResults = false;

            // Attach listener AFTER event completes
            setTimeout(() => {
                this._boundHandleClickOutside = this.handleClickOutside.bind(this);
                window.addEventListener('click', this._boundHandleClickOutside);
            }, 0);

        } else {
            // Remove listener when dropdown closes
            window.removeEventListener('click', this._boundHandleClickOutside);
        }
    }
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
    




    filterOptions() {
        const term = this.searchKey.toLowerCase();
        const filtered = this.allNationalities
        .filter(n => n.toLowerCase().includes(term))
        .map(n => ({ label: n, value: n }));

        this.filteredOptions = filtered;
        this.noResults = filtered.length === 0;
    }

    handleSelect(event) {
        // Get the selected value from the clicked li
        const selectedValue = event.currentTarget.dataset.value;
        console.log('📌 Selected Nationality via onclick:', selectedValue);

        // Update local search key
        this.searchKey = selectedValue;

        // Hide the dropdown
        this.showDropdown = false;

        // Update bound variable
        this.Nationality = selectedValue;

        // Dispatch custom event for lightning-record-edit-form
        this.dispatchEvent(new CustomEvent('change', {
            detail: { Nationality: selectedValue }
        }));

        console.log('🌀 handleSelect complete. Nationality:', this.Nationality);
    }

    get displayTextLang() {
        return this.selectedLangs.length
            ? this.selectedLangs.join(', ')
            : 'Select Languages';
    }

    handleDropdownToggle(event) {
        event.stopPropagation();

        // Close others
        this.isOpen = false;        // close Roles
        this.showDropdown = false;  // close Nationality

        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {
            setTimeout(() => {
                this._boundHandleClickOutside = this.handleClickOutside.bind(this);
                window.addEventListener('click', this._boundHandleClickOutside);
            }, 0);
        }
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
 handleFacilityToggleActive(event) {
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
    setTimeout(() => {
        this.fetchRoleOptions();
    }, 1000);
}

handleSwitchToMultiStaffUpload() {
        this.isMultiStaffUpload = true;
        this.adminFlag = false;
    }

toggleDropdownForEmployement(event) {
    event.preventDefault();    // prevents default browser action
    event.stopPropagation();   // stops bubbling

    this.roleDropDownForEmployment = !this.roleDropDownForEmployment;

    if (this.roleDropDownForEmployment) {
        setTimeout(() => {
            this._boundHandleClickOutside = this.handleClickOutside.bind(this);
            window.addEventListener('click', this._boundHandleClickOutside);
        }, 0);
    } else {
        window.removeEventListener('click', this._boundHandleClickOutside);
    }
}

handleEmploymentRoleSelect(event) {
      event.stopPropagation();
    console.log('🟡 handleEmploymentRoleSelect fired');

    console.log('🔹 event.target:', event.target);
    console.log('🔹 event.currentTarget:', event.currentTarget);
    console.log('🔹 dataset:', event.currentTarget.dataset);

    const index = event.currentTarget.dataset.index;
    const selectedFacilityValue = event.currentTarget.dataset.facilityvalue;

    console.log('🔹 extracted index:', index);
    console.log('🔹 selectedRoleValues:', JSON.stringify(this.selectedRoleValues));

    if (index === undefined) {
        console.error('❌ dataset.index is undefined – check for:index in template');
        return;
    }

    const selectedOption = this.selectedRoleEmploymentValues[Number(index)];

    console.log('🔹 selectedOption:', JSON.stringify(selectedOption));

    if (!selectedOption) {
        console.error('❌ No option found at index:', index);
        return;
    }

   

    // Display label
    this.selectedEmploymentRole = selectedOption.value;
    this.selectedDropDownFacilityValue=selectedFacilityValue;
    this.selectedEmploymentRoleDisplayVlaue=selectedOption.displaylabel ;
       this.fetchFacility(selectedFacilityValue);
    console.log('✅ selectedEmploymentRole set to:', this.selectedEmploymentRole);

    // Close dropdown
    this.roleDropDownForEmployment = false;
    console.log('✅ Dropdown closed');

    // Remove outside click listener safely
    if (this._boundHandleClickOutside) {
        window.removeEventListener('click', this._boundHandleClickOutside);
        console.log('✅ Outside click listener removed');
    } else {
        console.warn('⚠️ _boundHandleClickOutside was not set');
    }
}

    applyAllowanceLogic() {

            if (this.allowanceMethod === 'Fixed') {
                this.oneBreakAllowance = Number(FIXED_ONE);
                this.twoBreakAllowance = Number(FIXED_TWO);
            }

            if (this.allowanceMethod === 'Percentage') {
                this.oneBreakAllowance =
                    (Number(this.standardWeeklyRate) * Number(PERCENT_ONE)).toFixed(2);

                this.twoBreakAllowance =
                    (Number(this.standardWeeklyRate) * Number(PERCENT_TWO)).toFixed(2);
            }
        }
        standardweeklyChange(event){
            this.standardWeeklyRate=event.target.value;
            console.log("standardweeklyChange==>"+this.standardWeeklyRate)
            this.applyAllowanceLogic();
        }

        get isFixedMethod() {
            return this.allowanceMethod === 'Fixed';
        }

        get isPercentageMethod() {
            return this.allowanceMethod === 'Percentage';
        }

        handleMethodChange(event) {
                    this.allowanceMethod = event.detail.value;
             this.applyAllowanceLogic();
        }

        handleFirstNameChange(event) {
            const value = event.target.value;
            this.isFirstNameEntered = value && value.trim() !== '';
        }
    
}