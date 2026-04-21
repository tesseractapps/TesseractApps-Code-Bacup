import { LightningElement, wire, api, track } from 'lwc';
import fetchStaff from '@salesforce/apex/StaffController.fetchStaff';
import getStaffById from '@salesforce/apex/StaffController.getStaffById1';
import { CurrentPageReference } from "lightning/navigation";
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import insertPreTax from '@salesforce/apex/StaffController.insertPreTax';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import getShadAwards from '@salesforce/apex/StaffController.getShadAwards';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key';
import getStaffAssignmentsbyId from '@salesforce/apex/HRTraining.getStaffAssignmentsbyId';
import getStaffHistory from '@salesforce/apex/StaffController.getStaffHistory';
import getstaffId2 from '@salesforce/apex/UserAccessController.getstaffId2';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import userId from '@salesforce/user/Id';
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';
import getNursingAwrds from '@salesforce/apex/StaffController.getNursingAwrds';
import getRoleOptions from '@salesforce/apex/StaffController.getRoleOptions';
import createStaffRoles from '@salesforce/apex/StaffRoleController.createStaffRoles';
import getStaffRoles from '@salesforce/apex/StaffRoleController.getStaffRoles';
import getStaffRoleWithRates from '@salesforce/apex/StaffRoleController.getStaffRoleWithRates';
import getSelectedRole from '@salesforce/apex/StaffRoleController.getSelectedRole';
import getActiveStaffRoles from '@salesforce/apex/StaffRoleController.getActiveStaffRoles';
import getChildcareAwrds from '@salesforce/apex/StaffController.getChildcareAwrds';
import updateDocumentStatus from '@salesforce/apex/StaffController.updateDocumentStatus';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import upsertStaffFacilities from '@salesforce/apex/staffFacilityHandler.upsertStaffFacilities';
import getFacilityIdentityDocuments from '@salesforce/apex/FacilityDocumentController.getFacilityIdentityDocuments';
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
// Fixed values
import FIXED_ONE from '@salesforce/label/c.SCHADS_BrokenShift_1_Break_Fixed';
import FIXED_TWO from '@salesforce/label/c.SCHADS_BrokenShift_2_Break_Fixed';

// Percentages
import PERCENT_ONE from '@salesforce/label/c.SCHADS_BrokenShift_1_Break_Percent';
import PERCENT_TWO from '@salesforce/label/c.SCHADS_BrokenShift_2_Break_Percent';

const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};


const actions = [
    { label: 'View Document', name: 'view_details' },   
    { label: 'Edit', name: 'edit' }   ,
    { label: 'Delete', name: 'delete' } ,]

    const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
    const ENDPOINTS = {
        delete: `${AWS_BASE}/delete-file`
    };

export default class CreateEditStaffLwc extends NavigationMixin(LightningElement){
    primary = My_Resource + '/myResource/images/Primary.svg';
    secondary = My_Resource + '/myResource/images/Secondary.svg';
    admin = My_Resource + '/myResource/images/admin.svg';
    infoicon = My_Resource + '/myResource/images/Info_Icon.png';
    infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';
   
    @api staffId;
     @track ictUserType=false;
    @track employeeflag=true;
    @track invoiceFlag=false;
    @track taxationFlag=false;
    @track emergencyFlag=false;
    @track bankFlag=false;
    @track voluntaryFlag=false;
    @track historyFlag=false;
    @track employeeeditflag = false;
    @track invoiceeditFlag = false;
    @track taxationeditFlag=false;
    @track emergencyeditFlag = false;
    @track bankeditFlag = false;
    @track voluntaryeditFlag=false;  
    @track clientData=[];
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
    @track totalPretaxvalue="Pre Tax Deduction - Total ";
    @track preTaxForSubmit;
    @track postTaxlabel='Post Tax Deduction - Total '
    @track postTaxLabelvalue=0;
    @track pretaxOne=0;
    @track  pretaxtwo=0;
    @track  pretaxThree=0;
    @track  pretaxFour=0;
    @track  pretaxFive=0;
    @track ShowPretaxModal;
    @track parentStaffId;
    @track preTaxRecId='';
    @track accountRecList = [];
    @track image;
    @track isHome=true;
    @track individualstaffassigments=[];
    @track fieldErrorMap = {};
    @track points;
    @track totalPoints;
    @track key;
    @track uploadedFiles1;
    @track documentedit=false;
    @track roleoptions = [];
    @track selectedRoleValues = [];
    @track selectedRoleEmploymentValues = [];
    @track selectedEmploymentRole = '';//manendra

    
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
    @track isFixedcategory=true; //praveen chnages
    @track standardWeeklyRate=0;
    @track setHoursAccess =false;
    @track allowanceMethod = 'Fixed';
    @track oneBreakAllowance = 0;
    @track twoBreakAllowance = 0;



    staffRoleComboboxValueSet = [];
    @track activeRoles = [];
    @track SelectedRole;
    @track isOpen = false;//manendra for custombox
    @track options = [];
    @track DisplayRole;
    @track DisplayLanguages;
    
    @track showPreTaxRecordEditForm=false;

    @track showStaffDocumentSection=false;
    activeSections = ['StaffDetails', 'EmploymentDetails', 'staffDocumentation', 'Address', 'ApproversDetails', 'Leaves'];
    activeSections1 = ['TaxationDetails', 'PreTaxDetails', 'PostTax'];
    @track staffDocumentMap={};
    @track showDocumentTable;
    @track  DocumentTableData=[];
    @track AddDocButtonDisable= false;
    @track selected = [];
    @track OrgNisationRoles=[{}];
    //@track createdShiftRole;
    @track paidBreak=true;
    @track editstaffflag = false;
    @track showDescription2 = false;
    @track showDescription3 = false;
    @track showDescription4 = false;
    @track showDescription5 = false;
    @track delete2 = false;
    @track delete3 = false;
    @track delete4 = false;
    @track descriptionone;
    @track descriptiontwo;
    @track descriptionthree;
    @track descriptionfour;
    @track descriptionfive;
    @track trainingFlag = false;
    @track orgId;
    @track StaffFacility='';
    @track noRecordsFlag=false;
    @track toggleValue;
    @track previousToggleValue;
    @track toggleValueGeolocation;
    @track previousToggleValueGeolocation;
    @track showLoadingSpinner=false;
    @track successmessage;
    @track facilityPreferredName;
    @track participantPreferredName;
    @track staffPreferredName;
    @track Nationality;
    @track Languages = [];
    @track multiFacilityDroDownList=[];
    @track selctedMultipleFcailityValues=[];
    @track facilityDropDownOpen=false;
    @track activeFaciltyDisplay='';
    @track selectedDropDownFacilityValue='';
    @track selectedEmploymentRoleDisplayVlaue='';

     /*  praveen changes for nursing awards start*/
    @track typeOfService;
    @track isSchadsAwards=false;
    @track isNursingAwards=false;
     /*  praveen changes for nursing awards end*/

    //Maheswari changes for child care awards
    @track isChildCareAwards=false;
    @track latestSelctedRoleAndFacility=''
    @track isFirstNameEntered = false;

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
    
    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }
    @track DocumentColumns = [
        {
            label: 'Doc No',
            fieldName: 'Name',
            initialWidth: 150
            
        },
        {
            label: 'Type of Document',
            fieldName: 'Document_Type__c',
            initialWidth: 200
            
          },{
          label: 'Comments',
          fieldName: 'Comments__c',
          initialWidth: 200
        },{
            label: 'Expiry Date',
            fieldName: 'Expiry_Date__c',
            type: 'date',
            typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"}, initialWidth: 150
            
          },/* {
            label: 'View File',
            fieldName: 'View_File__c',
            type: 'url',
            initialWidth: 150
            
          }, */
           {
            label: 'Status',
            fieldName: 'Status__c',
            cellAttributes: { class: { fieldName: 'statusClass' } },
            initialWidth: 120
        },

        {
            type: 'button',
            label: 'Approve',
            initialWidth: 100,
            typeAttributes: {
                label: 'Approve',
                name: 'approve',
                variant: 'success',
                disabled: { fieldName: 'disableApprove' }
            }
        },

        {
            type: 'button',
            label: 'Reject',
            initialWidth: 100,
            typeAttributes: {
                label: 'Reject',
                name: 'reject',
                variant: 'destructive',
                disabled: { fieldName: 'disableReject' }
            }
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

        @track sectionFlags = {
            staffDetails: true,
            Addressdetails: false,
            EmploymentDetails: false,
            InvoiceDetails: false,
            TaxationDetails: true,
            PreTaxDeduction: false,
            PostTaxDeduction: false,
            EmergencyDetails: false,
            BankDetails: false,
            SuperannuationDetails: false,
            Leaves: false,
            ApproversDetails: false,
            staffDocumentation: false,
            staffDetails1: true,
            Addressdetails1: false,
            EmploymentDetails1: false,
            InvoiceDetails1: false,
            TaxationDetails1: true,
            PreTaxDeduction1: false,
            PostTaxDeduction1: false,
            EmergencyDetails1: false,
            BankDetails1: false,
            SuperannuationDetails1: false,
            Leaves1: false,
            ApproversDetails1: false,
            staffDocumentation1: false,
            StaffTrainingStatus: false,
            staffhistory: true,
        };
        
        // Icons for the toggle buttons
        // @track sectionIcons = {
        //     staffDetails: '\u2B9F', 
        //     Addressdetails: '\u2B9C',
        //     EmploymentDetails: '\u2B9C',
        //     InvoiceDetails: '\u2B9C',
        //     TaxationDetails: '\u2B9F',
        //     PreTaxDeduction: '\u2B9C',
        //     PostTaxDeduction: '\u2B9C',
        //     EmergencyDetails: '\u2B9C',
        //     BankDetails: '\u2B9C',
        //     SuperannuationDetails: '\u2B9C', 
        //     Leaves: '\u2B9C',
        //     ApproversDetails: '\u2B9C',
        //     staffDocumentation: '\u2B9C', 
        //     staffDetails1: '\u2B9F', 
        //     Addressdetails1: '\u2B9C',
        //     EmploymentDetails1: '\u2B9C',
        //     InvoiceDetails1: '\u2B9C',
        //     TaxationDetails1: '\u2B9F',
        //     PreTaxDeduction1: '\u2B9C',
        //     PostTaxDeduction1: '\u2B9C',
        //     EmergencyDetails1: '\u2B9C',
        //     BankDetails1: '\u2B9C',
        //     SuperannuationDetails1: '\u2B9C', 
        //     Leaves1: '\u2B9C',
        //     ApproversDetails1: '\u2B9C',
        //     staffDocumentation1: '\u2B9C', 
        //     StaffTrainingStatus: '\u2B9C',
        //     staffhistory: '\u2B9F',
            
        // };

        @track sectionIcons = {
        staffDetails: { ...ICON_DOWN },
        Addressdetails: { ...ICON_LEFT },
        EmploymentDetails: { ...ICON_LEFT },
        InvoiceDetails: { ...ICON_LEFT },

        TaxationDetails: { ...ICON_DOWN },
        PreTaxDeduction: { ...ICON_LEFT },
        PostTaxDeduction: { ...ICON_LEFT },

        EmergencyDetails: { ...ICON_LEFT },
        BankDetails: { ...ICON_LEFT },
        SuperannuationDetails: { ...ICON_LEFT },
        Leaves: { ...ICON_LEFT },
        ApproversDetails: { ...ICON_LEFT },
        staffDocumentation: { ...ICON_LEFT },

        // SECOND PANEL
        staffDetails1: { ...ICON_DOWN },
        Addressdetails1: { ...ICON_LEFT },
        EmploymentDetails1: { ...ICON_LEFT },
        InvoiceDetails1: { ...ICON_LEFT },

        TaxationDetails1: { ...ICON_DOWN },
        PreTaxDeduction1: { ...ICON_LEFT },
        PostTaxDeduction1: { ...ICON_LEFT },
        EmergencyDetails1: { ...ICON_LEFT },
        BankDetails1: { ...ICON_LEFT },
        Leaves1: { ...ICON_LEFT },
        SuperannuationDetails1: { ...ICON_LEFT },
        ApproversDetails1: { ...ICON_LEFT },
        staffDocumentation1: { ...ICON_LEFT },

        StaffTrainingStatus: { ...ICON_LEFT },
        staffhistory: { ...ICON_DOWN }
        };



        @track showDropdown = false;
        @track filteredOptions = [];
        @track noResults = false;

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
    @track selectedLangs = [];
    @track isExpanded = false;
       
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
    @track showRejectModal = false;
    @track comments = '';
    @track currentDocumentId = '';
    @api faclist=[];
    @track isExpiryRequired = false;
    @track LeaveEnable;
    @api
    showStaffForm(staffId) {
        this.staffId = staffId;
        this.isModalOpen = true; // ✅ Open modal or section
        console.log('CreateEditStaff: Form opened for Staff ID', staffId);
    }

    @wire(CurrentPageReference)
    currentPageRef;
  
    @api propertyValue;
    get propertyValue() {
      return this.currentPageRef.state.c__propertyValue;
    }
  
    @api orgnisationId;
    get orgnisationId() {
      return this.currentPageRef.state.c__orgID;
    }
    @api pagename;
    get pagename() {
      return this.currentPageRef.state.c__page;
    }
    /* @api typeOfUser; */
    @track Typeofuser;
    @track typeOfDocument;
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    @track pageSizeOptions = [5, 10, 25, 50];
    @track pageSize;
    @track totalPages;
    @track pageNumber = 1;
    @track records = [];
     @track roleDropDownForEmployment=false;
        allowanceMethodOptions = [
        { label: 'Use Pay Guide Rate', value: 'Fixed' },
        { label: 'Use Percentage Rule', value: 'Percentage' }
    ];

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
  
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

    
    toggleDropdown(event) {
        event.stopPropagation(); // prevent bubbling from the button
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            // Bind ensures 'this' refers to the component
            this._boundHandleClickOutside = this.handleClickOutside.bind(this);
            window.addEventListener('click', this._boundHandleClickOutside);
        } else {
            window.removeEventListener('click', this._boundHandleClickOutside);
        }
    }
    //manendra fr customcombobox
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
        .filter(role =>
            this.selctedMultipleFcailityValues.includes(role.facilityValue)
        )
        .map(role => role.displaylabel)
        .filter(label => label); // safety guard

    const result = displayLabels.join(', ');

    console.log('displayText ==> ', result);

    return result;
 }
  
    
async fetchOptions() {
    console.log("[fetchOptions] START");
    console.log("staffId received:", this.staffId);

    if (!this.staffId) {
        console.warn("[fetchOptions] No staffId provided — aborting fetch");
        return;
    }

    try {
        // Step 1: Fetch available Role options
        console.log("Step 1: Fetching all available Role options from Facility...");
        const allRoles = await getRoleOptions({ staffId: this.staffId });
        console.log("[getRoleOptions] Response received:", JSON.stringify(allRoles, null, 2));

        if (!allRoles || allRoles.length === 0) {
            console.warn("[getRoleOptions] Returned empty or null data");
        }

        // Step 2: Fetch already assigned Staff Roles
        console.log("Step 2: Fetching already assigned (Active) Staff Roles...");
        const activeRoles = await getStaffRoles({ staffId: this.staffId });
        console.log("[getStaffRoles] Response received:", JSON.stringify(activeRoles, null, 2));

      const activeRoleMap = new Map(
            (activeRoles || []).map(ar => [
                `${ar.RoleName__c}__${ar.Facility__c}`,
                ar.Id
            ])
      );
      const primaryRoleMap = new Map(
            (activeRoles || []).map(ar => [
                `${ar.RoleName__c}__${ar.Facility__c}`,
                ar.Primary__c === true
            ])
        );

     console.log('[ActiveRoleMap]', Array.from(activeRoleMap.entries()));
      //  this.selectedRoleValues = activeRoles || [];
      //  console.log("[selectedRoleValues] Active roles:", JSON.stringify(this.selectedRoleValues, null, 2));
        console.log("Step 3: Mapping role options and setting checked status...");
        this.roleoptionsforFacility = allRoles.map((role, index) => {

            const roleKey = `${role.Role_Name__c}__${role.Facility__c}`;
            const matchedStaffRoleId = activeRoleMap.get(roleKey);

            const isActive = Boolean(matchedStaffRoleId);
            const isPrimary = primaryRoleMap.get(roleKey) === true;

            return {
                id: role.Id,
                roleId: matchedStaffRoleId || null, // StaffRole__c Id
                label: role.Role_Name__c,
                value: role.Role_Name__c,
                facilityValue: role.Facility__c,
                facilityName: role.Facility__r?.Name,
                displaylabel: `${role.Role_Name__c} - ${role.Facility__r?.Name}`,

                checked: isActive,
                isActive: isActive,
                isPrimary: isPrimary,

                statusText: isActive ? 'Active' : 'Inactive',
                buttonClassRoles: this.getOptionButtonClassRoles(isActive),
                badgeClass: this.getBadgeClass(isActive),
                toggleTrackClass: this.getToggleTrackClass({ checked: isActive }),
                isDisabled: false,
                typeOfService: role.Facility__r.Type_of_Service__c
            };
        });

     /*    console.log("[options] Final mapped options:", JSON.stringify(this.roleoptionsforFacility, null, 2)); */


        this.selectedRoleEmploymentValues = this.roleoptionsforFacility
        .filter(option => option.checked);
          this.selectedRoleValues = this.roleoptionsforFacility
                .filter(option => option.checked);
     /*    console.log(" [selectedRoleEmploymentValues] Populated:", JSON.stringify(this.selectedRoleEmploymentValues, null, 2)); */

        console.log("[selectedRoleValues] :", JSON.stringify(this.selectedRoleValues, null, 2));
          console.log(" latestSelctedRoleAndFacility:", this.latestSelctedRoleAndFacility);
        // Step 5: Fetch rates if selected role exists
        if (this.latestSelctedRoleAndFacility) {
            console.log("Step 5: Fetching rates for selectedEmploymentRole:", this.selectedEmploymentRole);
            console.log("Waiting 1.5s before fetching rates...");
            await new Promise(resolve => setTimeout(async () => {
                console.log("Calling fetchDropdownRoleWithRates() now...");
                await this.fetchDropdownRoleWithRates();
                console.log("[fetchDropdownRoleWithRates] Completed");
                resolve();
            }/* , 1500 */));
        } else {
            console.warn("[fetchOptions] No selectedEmploymentRole found, skipping rate fetch");
        }

    } catch (error) {
        console.error("[fetchOptions] Error occurred:", error);
        console.error("Stack trace:", error?.stack);
    } finally {
        console.log("[fetchOptions] END");
    }
}

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
                buttonClass: this.getOptionButtonClass(isChecked),
                badgeClass: this.getBadgeClass(isChecked),
                statusText: isChecked ? "Active" : "Inactive",
                isDisabled: !isChecked,
                isPrimary: isChecked ? option.isPrimary : false, // ✅ NEW
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



    handleSelectOption(e) {
        const optionId = e.target.dataset.optionId;
        const option = this.roleoptionsforFacility.find(opt => opt.id === optionId);
        if (!option) return;

        this.updateSelectedRoles();
    }

    //manendra fr custom combo
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

    async fetchActiveRoles() {
    console.log(" [fetchActiveRoles] START");
    try {
        if (!this.staffId) {
            console.warn(" [fetchActiveRoles] No staffId provided.");
            return;
        }
        const result = await getActiveStaffRoles({ staffId: this.staffId });
        console.log(" Active Roles fetched:", JSON.stringify(result, null, 2));
          this.activeRoles = result.map(role => {
            return {
                RoleName: role.RoleName ? String(role.RoleName) : '--',
                CategoryType: role.CategoryType ? String(role.CategoryType) : '--',
                ClassificationLevel: role.ClassificationLevel ? String(role.ClassificationLevel) : '--',
                ClassificationPayType: role.ClassificationPayType ? String(role.ClassificationPayType) : '--',
                JobType: role.JobType ? String(role.JobType) : '--',
                HourlyRate: role.HourlyRate != null ? Number(role.HourlyRate).toFixed(2) : '--',
                SaturdayRate: role.SaturdayRate != null ? Number(role.SaturdayRate).toFixed(2) : '--',
                SundayRate: role.SundayRate != null ? Number(role.SundayRate).toFixed(2) : '--',
                PublicHolidayRate: role.PublicHolidayRate != null ? Number(role.PublicHolidayRate).toFixed(2) : '--',
                AfternoonShiftRate: role.AfternoonShiftRate != null ? Number(role.AfternoonShiftRate).toFixed(2) : '--',
                NightShiftRate: role.NightShiftRate != null ? Number(role.NightShiftRate).toFixed(2) : '--',
                SleepoverAllowance: role.SleepoverAllowance != null ? Number(role.SleepoverAllowance).toFixed(2) : '--'
            };
        });
    } catch (error) {
        console.error("[fetchActiveRoles] Error fetching active roles:", error);
    } finally {
        console.log(" [fetchActiveRoles] END");
    }
}
    async fetchDropdownRoleWithRates() {
        console.log(" [fetchDropdownRoleWithRates] START");
        console.log("staffId received:", this.staffId);
    

        if (!this.staffId) {
            console.warn("⚠️ [fetchDropdownRoleWithRates] No staffId provided, aborting fetch");
            return;
        }
        let roleAndFacility=this.latestSelctedRoleAndFacility.split('-');
        try {
            console.log(" Step 1: Fetching Staff Role with Rates...");
            const result = await getStaffRoleWithRates({
                staffId: this.staffId,
                roleName: roleAndFacility[0],
                facility:roleAndFacility[1]
            });
            console.log("[getStaffRoleWithRates] Response received:", JSON.stringify(result, null, 2));
            console.log('result.facilityName ', result.facilityName);
            this.selectedDropDownFacilityValue=roleAndFacility[1];
            this.selectedEmploymentRole=roleAndFacility[0];
            this.selectedEmploymentRoleDisplayVlaue=roleAndFacility[0]+'-'+result.facilityName;
            if (result && result.RoleName === roleAndFacility[0]) {
                console.log(" Matching Role Found:", result.RoleName);
                this.selectedEmploymentRole = result.RoleName;
                this.genralHourlyRate = result.HourlyRate || 0;
                this.sturdayHourlyRate = result.SaturdayRate || 0;
                this.sundayhourlyRate = result.SundayRate || 0;
                this.publicHolidayRate = result.PublicHolidayRate || 0;
                this.afterNoonShiftRate = result.AfternoonShiftRate || 0;
                this.nightShiftRate = result.NightShiftRate || 0;
                this.sleepoverAllowance = result.SleepoverAllowance || 0;
                this.oneBreakAllowance=result.alloawanceOnepaidbrerak ||0;
                this.twoBreakAllowance=result.allowanceTwoUnpaidbreak ||0;
                this.allowanceMethod=result.brokenShiftAllowance;
                this.standardWeeklyRate=result.standardWeeklyRate ||0
                this.jobType = result.jobType;
                this.categoryType = result.categoryType;
                this.classificationLevel = result.classificationLevel;
                this.classificationPayType = result.classificationPayType;


                console.log("[Rates Updated]");
                console.log("HourlyRate:", this.genralHourlyRate);
                console.log("SaturdayRate:", this.sturdayHourlyRate);
                console.log("SundayRate:", this.sundayhourlyRate);
                console.log("PublicHolidayRate:", this.publicHolidayRate);
                console.log("AfternoonShiftRate:", this.afterNoonShiftRate);
                console.log("NightShiftRate:", this.nightShiftRate);
                console.log("SleepoverAllowance:", this.sleepoverAllowance);
                 console.log("classificationPayType:", this.classificationPayType);
                console.log("oneBreakAllowance:", this.oneBreakAllowance);
                console.log("twoBreakAllowance:",  this.twoBreakAllowance);
                console.log("allowanceMethod:", this.allowanceMethod);
                console.log("standardWeeklyRate:", this.standardWeeklyRate);
                 console.log("this.jobType:",this.jobType);
                this.fetchFacility(roleAndFacility[1]);

                console.log(" [Combobox Values] Rebuilt for all selected roles:", JSON.stringify(this.selectedRoleEmploymentValues, null, 2));
            } else {
                console.warn(" [fetchDropdownRoleWithRates] No matching role found or rates unavailable");
                console.log("  Expected Role:", this.selectedEmploymentRole);
                console.log("  Returned Role:", result ? result.RoleName : " None");
            }

        } catch (error) {
            console.error(" [fetchDropdownRoleWithRates] Error occurred:", error);
        } finally {
            console.log(" [fetchDropdownRoleWithRates] END");
        }
    }//manendra

   /*  handleHourlyRateChange(event) {
    const value = event.target.value;
    this.genralHourlyRate = value ? parseFloat(value) : 0;
    console.log('Hourly Rate entered:', this.genralHourlyRate);
}*///manendra
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
    console.log('Hourly Rate entered:', this.genralHourlyRate );
}


//manendra
    @track documentPointsMap = {};
    documentMetaMap = {}; 
   get options() {
        return [
        { label: 'Visa Status', value: 'Visa Status' },
        { label: 'Drivers Licence', value: 'Drivers Licence' },
        { label: 'Working With Vulnerable People', value: 'Working With Vulnerable People' },
        { label: 'Covid Immunisation', value: 'Covid Immunisation' },
        { label: 'Registration', value: 'Registration' },
        { label: 'Certificate', value: 'Certificate' },
      
        { label: 'Working With Children Check (WWCC)', value: 'Working With Children Check (WWCC)' },
        { label: 'NDIS Worker Screening', value: 'NDIS Worker Screening' },
        { label: 'NDIS Worker Orientation Certificate', value: 'NDIS Worker Orientation Certificate' },
        { label: 'Signed Code of Conduct', value: 'Signed Code of Conduct' },
        { label: 'Infection Control Training', value: 'Infection Control Training' },
        { label: 'First Aid Certificate', value: 'First Aid Certificate' },
        { label: 'Qualifications', value: 'Qualifications' },
        { label: 'Police Check', value: 'Police Check' },
        { label: 'Australian Passport', value: 'Australian Passport' },
        { label: 'Foreign Passport', value: 'Foreign Passport' },
        { label: 'Medicare Card', value: 'Medicare Card' },
        { label: 'Birth Certificate', value: 'Birth Certificate' },
        { label: 'Certificate of Identity', value: 'Certificate of Identity' },
        { label: 'Photo ID', value: 'Photo ID' },
        { label: 'Proof of Age Card', value: 'Proof of Age Card' },
        { label: 'Rating Authority', value: 'Rating Authority' },
        { label: 'Citizenship Certificate', value: 'Citizenship Certificate' },
        { label: 'Change of Name Certificate', value: 'Change of Name Certificate' },
        { label: 'Bank Statement 1', value: 'Bank Statement 1' },
        { label: 'Bank Statement 2', value: 'Bank Statement 2' },
        { label: 'Centrelink Card', value: 'Centrelink Card' },
        { label: 'DVA Card', value: 'DVA Card' },
        { label: 'Lease Agreement', value: 'Lease Agreement' },
        { label: 'Marriage Certificate', value: 'Marriage Certificate' },
        { label: 'Utility Bill 1', value: 'Utility Bill 1' },
        { label: 'Utility Bill 2', value: 'Utility Bill 2' },
        { label: 'Foreign Birth Certificate', value: 'Foreign Birth Certificate' },
        { label: 'Indigenous Reference', value: 'Indigenous Reference' },
        { label: 'Other', value: 'Other' },
    ];
    }
        @track dynamicDocumentTypes = [];



    handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid',isValid);

    this.fieldErrorMap[field] = !isValid;
}

    getFieldClass(fieldName) {
        return this.fieldErrorMap[fieldName] ? 'floating-label1' : 'floating-label';
    }
    get emailClass() {
        return this.getFieldClass('Email__c');
    }
     get DateOfBirthClass() {
        return this.getFieldClass('Date_Of_Birth__c');
    }

    handleMouseOver(event) {
        const img = event.target;
        img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
        img.style.opacity = '0'; // Start fade-out for the current image
    
        setTimeout(() => {
            img.src = this.infoiconhover; // Change the image
            img.style.opacity = '1'; // Fade-in the new image
        }, 150); // Wait for the fade-out to complete
    }
    
    handleMouseOut(event) {
        const img = event.target;
        img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
        img.style.opacity = '0'; // Start fade-out for the current image
    
        setTimeout(() => {
            img.src = this.infoicon; // Change back to the default image
            img.style.opacity = '1'; // Fade-in the default image
        }, 150); // Wait for the fade-out to complete
    }
    

    backTostaff(event){
         localStorage.removeItem('activeAdminStaffTab');
        const customEvent = new CustomEvent('staffevent', {
            detail: { message: 'Hello from Child!' }
        });
        this.dispatchEvent(customEvent);
    
      }
    @track disableedit = true;
   
    handleEmployee(event){
    this.employeeflag=true;
    this.invoiceFlag=false;
    this.taxationFlag=false;
    this.emergencyFlag=false;
    this.bankFlag=false;
    this.voluntaryFlag=false;
    this.employeeeditflag=false;
    this.invoiceeditFlag=false;
    this.taxationeditFlag=false;
    this.emergencyeditFlag=false;
    this.bankeditFlag=false;
    this.voluntaryeditFlag=false;
     this.trainingFlag = false;
     this.disableedit = true;
     this.historyFlag = false;
    localStorage.setItem('activeAdminStaffTab', 'staffEmployee');
    }
    handleInvoice(event){
        this.employeeflag=false;
        this.invoiceFlag=true;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
         this.trainingFlag = false;
         this.disableedit = true;
         this.historyFlag = false;
    }
    handleTax(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=true;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
        this.trainingFlag = false;
        this.disableedit = true;
        this.historyFlag = false;
       
        localStorage.setItem('activeAdminStaffTab', 'staffTax');
         this.voluntaryMethod();
    }
    handleVoluntary(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=true;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
         this.trainingFlag = false;
         this.disableedit = true;
         this.historyFlag = false;
        this.voluntaryMethod();
    }
    handleEmergency(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=true;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
         this.trainingFlag = false;
         this.disableedit = true;
         this.historyFlag = false;
    }
    handleBank(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=true;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
         this.trainingFlag = false;
         this.disableedit = true;
         this.historyFlag = false;
    }
    handletraining(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
        this.trainingFlag = true;
        this.disableedit = false;
        this.historyFlag = false;
    }
     handleHistory(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
        this.trainingFlag = false;
        this.historyFlag = true;
        this.disableedit = false
        localStorage.setItem('activeAdminStaffTab', 'staffHistory');
    }

handleRoleinEmploymentChange(event) {
    this.selectedEmploymentRole = event.detail.value; //manendra
    console.log('selected staff role 3 ==>'+this.selectedEmploymentRole);
    console.log('Role picked for hourly rate:', this.selectedEmploymentRole);
    this.fetchDropdownRoleWithRates();

}
    
    handleEditEmployee() {
        this.fieldErrorMap = {};
        if (this.employeeflag) {
            this.employeeeditflag = true;
            this.successmessage='Employee Details updated successfully.';
            //this.ShowDocumentSection();
            this.totalfiles=[];
            this.parentStaffId=this.staffId; 
            this.disableedit = true;
            this.primaryApproverValue=this.clientData[0].Make_Primary_as_Approver__c;
            this.secondaryApproverValue=this.clientData[0].Make_Secondary_as_Approver__c; 
            this.Nationality=this.clientData[0].Nationality__c;
            const savedLangs = this.clientData[0].Languages__c;
            if (savedLangs) {
                // Handle both comma and semicolon separated values
                this.selectedLangs = savedLangs.split(/[;,]+/)
                    .map(lang => lang.trim())
                    .filter(Boolean);
            } else {
                this.selectedLangs = [];
            }

            this.Languages = this.LANGUAGE_OPTIONS.map(lang => {
                const isSelected = this.selectedLangs.includes(lang);
                return {
                    id: lang,
                    label: lang,
                    checked: isSelected,
                    buttonClass: 'option-button',
                    badgeClass: isSelected ? 'status-badge active' : 'status-badge inactive',
                    statusText: isSelected ? 'Active' : 'Inactive'
                };
            });

            console.log('📋 Selected Languages:', JSON.stringify(this.selectedLangs));
            console.log('✅ Updated Languages State:', JSON.stringify(this.Languages));
            console.log('✅ Parsed Selected Languages:', this.selectedLangs);
            console.log('Nationality123456:', this.clientData[0].Nationality__c);
            console.log('Languages:', this.clientData[0].Languages__c);
            this.hasRecords = this.DocumentTableData.length > 0;
            console.log('hasRecords:', this.hasRecords);
            console.log('📋 DocumentTableData:', JSON.stringify(this.DocumentTableData));
            


            this.fetchOptions();
            // this.voluntaryMethod();
             console.log(' this.secondaryApproverValue,this.primaryApproverValue',this.secondaryApproverValue+this.primaryApproverValue)

        } else if (this.invoiceFlag) {
            this.invoiceeditFlag = true;
        } else if (this.taxationFlag) {
            console.log('taxtype',this.taxationFlag);
            console.log('sathourrate', this.saturdayHourlyRate);
             console.log('employeetype', this.classificationPayType);
            console.log('HourlyRate', this.genralHourlyRate);
            this.successmessage='Tax updated successfully.';
            this.taxationeditFlag = true;
            this.pretaxOne=this.clientData[0].Pre_Tax_One_Value__c;
        this.pretaxtwo=this.clientData[0].Pre_Tax_Two_Value__c;
        this.pretaxThree=this.clientData[0].Pre_Tax_Three_Value__c;
        this.pretaxFour=this.clientData[0].Pre_Tax_Four_Value__c;
        this.pretaxFive=this.clientData[0].Pre_Tax_Five_Value__c;
        this.preTaxForSubmit=this.clientData[0].Pre_Tax_Calculator__c;
        this.postTaxLabelvalue=this.clientData[0].Post_Tax__c;
        } else if (this.emergencyFlag) {
            this.emergencyeditFlag = true;
        } else if (this.bankFlag) {
            this.bankeditFlag = true;
        } else if (this.voluntaryFlag) {
            this.voluntaryeditFlag = true;
            this.voluntaryMethod();
        } 
        this.fileName = '';
    }
    handleback() {
        this.isHome=true;
        this.isModalOpen=false;
        this.currentUrl='';
        this.employeeflag=true;
    }
     loadStaffAssignment() {
                getStaffAssignmentsbyId({ staffId: this.staffId })
                    .then(result => {
                        this.individualstaffassigments = result.map(assign => ({
                            ...assign,
                            modulename: this.capitalizeFirstLetter(assign.Module_Name__r?.Name ?? ''),
                            fullName: `${assign.Staff__r?.Name ?? 'N/A'} ${assign.Staff__r?.Last_Name__c ?? ''}`,
                            description: this.capitalizeFirstLetter(assign.Module_Name__r?.description__c ?? ''),
                            Dueby: assign.Due_Date__c ? new Date(assign.Due_Date__c).toLocaleDateString('en-GB') : '',
                            completeddate:assign.Completed_Date__c ? new Date(assign.Completed_Date__c).toLocaleDateString('en-GB') : '',
                            uiStatus: assign.Status__c=="Inprogress" ?"In Progress":assign.Status__c
                        }));
                        console.log('Assign records', JSON.stringify(this.staffassigments));
                        console.log('individual records', JSON.stringify(this.individualstaffassigments));
                    })
                    .catch(error => {
                        console.error('Error fetching modules:', error);
                    });
            }

            capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    preTaxCalMethod(){
        if(this.clientData[0].Pre_Tax_One_Value__c){
            this.pretaxOne=this.clientData[0].Pre_Tax_One_Value__c;
        }else{
            this.pretaxOne=0;
        }

        if(this.clientData[0].Pre_Tax_Two_Value__c){
            this.pretaxtwo=this.clientData[0].Pre_Tax_Two_Value__c;
        }else{
            this.pretaxtwo=0;
        }
       
        if(this.clientData[0].Pre_Tax_Three_Value__c){
            this.pretaxThree=this.clientData[0].Pre_Tax_Three_Value__c;
        }else{
            this.pretaxThree=0;
        }
       
        if(this.clientData[0].Pre_Tax_Four_Value__c){
            this.pretaxFour=this.clientData[0].Pre_Tax_Four_Value__c;
        }else{
            this.pretaxFour=0;
        }
       
        if(this.clientData[0].Pre_Tax_Five_Value__c){
            this.pretaxFive=this.clientData[0].Pre_Tax_Five_Value__c;
        }else{
            this.pretaxFive=0;
        }
       
        if(this.clientData[0].Pre_Tax_Calculator__c){
            this.preTaxForSubmit=this.clientData[0].Pre_Tax_Calculator__c;
        }else{
            this.preTaxForSubmit=0;
        }
       

    }
   
    voluntaryMethod() {
        if (!this.clientData || !Array.isArray(this.clientData) || this.clientData.length === 0) {
            console.warn('⚠️ voluntaryMethod skipped: clientData not ready', this.clientData);
            return;
        }

        const client = this.clientData[0];

        const voluntaryContribution =
            client.Voluntary_Contribution__c ?? null;

        this.voluntaryContributionCureencyVal =
            client.Voluntary_Contribution_Fixed__c ?? null;

        this.voluntaryContributionPercentVal =
            client.Voluntary_Contribution_Percent__c ?? null;

        console.log(
            '💰 Voluntary Contribution (JSON):',
            JSON.stringify(
                {
                    voluntaryContribution,
                    currency: this.voluntaryContributionCureencyVal,
                    percent: this.voluntaryContributionPercentVal
                },
                null,
                2
            )
        );
    }

   

    @wire (organizationDetails)
    wiredOrDetails(result){
        const { data, error } = result;
        if(data){
        this.orgId = data.listofPriceBook.Id;
        this.Typeofuser = data.listofPriceBook.Type_of_User__c;
                console.log('UseerCheckTYpe', this.Typeofuser);
                if(this.Typeofuser=='ICT User'){
                    this.ictUserType=true;
                    this.LeaveEnable=false;
                    console.log('Checkusertypee',this.Typeofuser);
                }else{
                    this.ictUserType=false;
                     this.LeaveEnable=true;
                    console.log('Checkusertypee2',this.Typeofuser);
                }

        this.loadStaffAssignment();
       // console.log('orgdata roles '+JSON.stringify(this.OrgNisationRoles));
      
        } else if (error) {
           
        }
    }
    @track noimage;
    historyData = [];
    wiredHistoryResult;
   // @track isICtUserInViewForm=true;
    @track isFixedcategoryInViewForm=false;

    async fetchStaffImperatively() {
        try {
            console.log("🔥 IMPERATIVE CALL → getStaffById");

            const data = await getStaffById({ recordId: this.staffId });

            console.log("✔ Imperative result:", JSON.parse(JSON.stringify(data)));
           this.clientData = data.map(rec => {
             const facilities = rec.Staff_Facilities__r || [];

                return {
                    ...rec,

                    activeRoles: rec.StaffRoles__r
                        ? rec.StaffRoles__r.map(r => r.RoleName__c)
                        : [],

                    activeRolesDisplay:
                        rec.StaffRoles__r && rec.StaffRoles__r.length
                            ? rec.StaffRoles__r.map(r => r.RoleName__c).join(', ')
                            : '',

                    activeFaciltyDisplay: facilities
                        .map(f => f.Facility__r?.Name)
                        .filter(Boolean)
                        .join(', '),

                    selectedFacilityIds: facilities
                        .map(f => f.Facility__c)
                        .filter(Boolean)
                };
            });

            // Image
            this.image = this.clientData[0].picture__c;
            this.noimage = !this.image;

            // Basic fields
            this.latestSelctedRoleAndFacility = this.clientData[0].SelectedRole__c;
            this.Nationality = this.clientData[0].Nationality__c;
            this.genralHourlyRate=this.clientData[0].Hourly_Rate__c;//bug fix 05-12
            this.toggleValue = this.clientData[0].Status__c;
            // Address
            this.city = this.clientData[0].Address__City__s;
            this.country = this.clientData[0].Address__CountryCode__s;
            this.province = this.clientData[0].Address__StateCode__s;
            this.postalcode = this.clientData[0].Address__PostalCode__s;
            this.street = this.clientData[0].Address__Street__s;

            this.lastName = this.clientData[0].Last_Name__c;
            this.firstName = this.clientData[0].First_Name__c;
            this.Typeofuser = this.clientData[0].Type_of_User__c;
            console.log('Usertypechecking',this.Typeofuser);
            //this.StaffFacility = this.clientData[0].Facility__c;
            this.StaffFacility = this.clientData[0].Staff_Facilities__r
                ? this.clientData[0].Staff_Facilities__r
                    .map(f => f.Facility__c)
                    .filter(Boolean)
                : [];
            this.DisplayRole = this.clientData[0].activeRolesDisplay;
            this.activeFaciltyDisplay=this.clientData[0].activeFaciltyDisplay
          //  this.selectedRoleValues = this.clientData[0].activeRoles || [];//bug fix 05-12

            this.DisplayLanguages = this.clientData[0].Languages__c;
this.selectedLangs = this.clientData[0].Languages__c
    ? this.clientData[0].Languages__c.split(";")
    : [];//bug fix 05-12
            this.loadDocumentTypes();
            this.fetchFacility(this.StaffFacility);

            // 🔥 Child Docs Processing (same as wire)
            const childRec = this.clientData[0].Child_Staffs__r || [];
            let processedDocs = [];
            let totalPoints = 0;

            childRec.forEach(rec => {
                const status = rec.Status__c || 'Pending';
                totalPoints += Number(rec.Points__c) || 0;

                let row = {
                    ...rec,
                    Status__c: status,
                    statusClass:
                        status === 'Approved'
                            ? 'status-approved'
                            : status === 'Rejected'
                            ? 'status-rejected'
                            : 'status-pending',

                    isPending: status === 'Pending',
                    isApproved: status === 'Approved',
                    isRejected: status === 'Rejected',

                    disableApprove: status !== 'Pending',
                    disableReject: status !== 'Pending',

                    FormattedDate: rec.Expiry_Date__c
                        ? new Date(rec.Expiry_Date__c).toLocaleDateString('en-GB')
                        : '',

                    //ComplianceFormatted: rec.Compliance__c,

                    ComplianceFormatted:
                        rec.Compliance__c === true ? 'TRUE' :
                        rec.Compliance__c === false ? 'FALSE' :
                        rec.Compliance__c ? String(rec.Compliance__c) : '',

                    KeyVal: rec.key__c || ''
                };

                processedDocs = [...processedDocs, row];
            });

            this.totalPoints = totalPoints;

            console.log("📄 Imperative processed docs:", processedDocs);

              this.fetchMultiFaciltyOptions();

            // 🔥 Pagination same as wire
            this.initializePagination(processedDocs);
            
             if(this.Typeofuser== 'ICT User'){
                this.ictUserType=true;
                console.log('checkUsertype1',this.ictUserType);
                }else{
                this.ictUserType=false;
                console.log('checkUsertype2',this.ictUserType);
                }
        } catch (error) {
            console.error("❌ Imperative error:", error);
            this.handleError(error);
        }
        
    }

    initializePagination(docList) {
        console.log("🟦 INITIALIZING PAGINATION");

        // Store full list
        this.records = [...docList];
        this.totalRecords = this.records.length;

        // Set default page size if not set
        if (!this.pageSize) {
            this.pageSize = 5;
        }

        console.log("📘 Total Records:", this.totalRecords);
        console.log("📏 Page Size:", this.pageSize);

        // Reset to first page
        this.pageNumber = 1;

        // Set flags for UI
        this.hasRecords = this.totalRecords > 0;
        this.noRecordsFlag = this.totalRecords === 0;
        
        console.log("✅ hasRecords:", this.hasRecords);
        console.log("✅ noRecordsFlag:", this.noRecordsFlag);

        // Run pagination
        this.paginationHelper();
    }

   @wire(getStaffHistory, { staffId: '$staffId' })
    wiredHistory(result) {
        this.wiredHistoryResult = result; // 🔁 Save wire result to use for refresh

        const { data, error } = result;
        console.log('STAFFID-------------------->' + this.staffId);
        console.log('HISTORY DATA-------------------->', JSON.stringify(result));

        if (data) {

            const filtered = data.filter(item => {
                    const isIdValue = (val) =>
                        val && typeof val === 'string' && /^[a-zA-Z0-9]{15,18}$/.test(val);

                    // If both old and new values are IDs => skip this record
                    if (isIdValue(item.OldValue) && isIdValue(item.NewValue)) {
                        return false;
                    }
                    return true;
                });
            this.historyData = filtered.map(item => {
                const fieldName = item.Field === 'Facility__c'
                    ? 'Facility'
                    : (item.Field === 'created' ? 'Created' : item.Field);

                return {
                    id: item.Id,
                    field: fieldName,
                    field1: fieldName === 'Facility' ? this.facilityPreferredName : '', // ✅ set field1
                    oldValue: item.OldValue,
                    newValue: item.NewValue,
                    changedBy: item.CreatedBy.Name,
                    date: this.formatDate(item.CreatedDate)
                };
            });
        } else if (error) {
            this.error = error;
        }
    }


    formatDate(dateStr) {
    const dateObj = new Date(dateStr);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return new Intl.DateTimeFormat('en-GB', options).format(dateObj);
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


    handleSubmit(event) {
        console.log("🚀 SUBMIT STARTED");

        event.preventDefault(); // stop default submit
        console.log('taxflag',this.taxationFlag);
        console.log('taxflag',this.taxationeditFlag);
        console.log(' Roles to sync:', JSON.stringify(this.selectedRoleValues));
        console.log(' Dropdown Selected Role:', this.selectedEmploymentRole);
        console.log('Hourly Rate entered IN SUBMIT:', this.genralHourlyRate );
        const fields = event.detail.fields;
        // -----------------------------------
        // 1️⃣ VALIDATION BEFORE FIELDS CREATION
        // -----------------------------------

        /*   if (!this.StaffFacility) {
            this.showToast("Error", "Please select a Facility before submitting.", "error");
            return;
        } */
        if(this.selctedMultipleFcailityValues.length===0){
            this.dispatchEvent(
                new ShowToastEvent({
                     title: 'Error',
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

        if (this.ictUserType==false && this.taxationeditFlag == false) {
            //if (this.ictUserType==false ) {
            if (this.genralHourlyRate === null || this.genralHourlyRate === undefined || Number.isNaN(this.genralHourlyRate)) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Hourly Rate is required in Employment Section.',
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
        // -----------------------------------
        // 4️⃣ POPULATE FIELDS
        // -----------------------------------

        fields.Address__Street__s = this.street;
        fields.Address__City__s = this.city;
        fields.Address__StateCode__s = this.province;
        fields.Address__CountryCode__s = "AU";
        fields.Address__PostalCode__s = this.postalcode;

       fields.SelectedRole__c = this.selectedEmploymentRole+'-'+this.selectedDropDownFacilityValue;
       fields.Facility__c=this.selctedMultipleFcailityValues[0];

        // Pre-tax
        fields.Pre_Tax_One_Value__c = this.pretaxOne;
        fields.Pre_Tax_Two_Value__c = this.pretaxtwo;
        fields.Pre_Tax_Three_Value__c = this.pretaxThree;
        fields.Pre_Tax_Four_Value__c = this.pretaxFour;
        fields.Pre_Tax_Five_Value__c = this.pretaxFive;

        fields.Pre_Tax_Two_Description__c = this.descriptiontwo;
        fields.Pre_Tax_Three_Description__c = this.descriptionthree;
        fields.Pre_Tax_Four_Description__c = this.descriptionfour;
        fields.Pre_Tax_Five_Description__c = this.descriptionfive;

        // Toggles
        fields.Status__c = this.toggleValue;
        fields.Enable_Geolocation__c = this.toggleValueGeolocation;

        // User fields
        fields.Nationality__c = this.Nationality;
        fields.Languages__c = this.selectedLangs.join(";");

        // Nursing award conditions
        if (this.isNursingAwards) {
            fields.Fixed_Rate_or_Not__c = false;
            fields.Category_Type__c = null;
            fields.Classification_Level__c = null;
            fields.Classification_Pay_Point__c = null;
        }

        if (this.isSchadsAwards) {
            fields.Nursning_Awards__c = false;
            fields.Nursing_Category_Type__c = null;
            fields.Nursing_Classification_Level__c = null;
            fields.Nursing_Classification_Pay_Point__c = null;
        }

        // Voluntary contributions
        fields.Voluntary_Contribution_Fixed__c = this.voluntaryContributionCureencyVal || 0;
        fields.Voluntary_Contribution_Percent__c = this.voluntaryContributionPercentVal || 0;

        fields.Type_of_User__c = this.Typeofuser;

        console.log("📌 FINAL FIELDS BEFORE SUBMIT:", JSON.stringify(fields));

        // -----------------------------------
        // 5️⃣ GOOGLE GEO-CODING BEFORE SUBMIT
        // -----------------------------------

        const fullAddress = `${this.street}, ${this.city} ${this.postalcode}, AU`;
        const apiKey = GOOGLE_API_KEY;
        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

        console.log("🌍 Calling Geocode:", endpoint);

        fetch(endpoint)
            .then((response) => response.json())
            .then((data) => {
                console.log("📍 Geocode Response:", data);

                if (data.status === "OK" && data.results.length > 0) {
                    const loc = data.results[0].geometry.location;
                    fields.Location__Latitude__s = loc.lat;
                    fields.Location__Longitude__s = loc.lng;
                    console.log("✔ Coordinates:", loc.lat, loc.lng);
                } else {
                    console.warn("⚠ No geocode results found");
                }
                
                if (!this.ictUserType) {
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
                        if (fields.Emergency_Phone_Number__c && !/^\d{1,10}$/.test(fields.Emergency_Phone_Number__c)) {
                            this.showToast(
                                'Error',
                                'Emergency: Contact Number must contain only digits and not exceed 10 digits.',
                                'error'
                            );
                            return;
                        }                        
                    }

                    if (fields.Emergency_Phone_Number__c && fields.Emergency_Phone_Number__c.replace(/\D/g, '').length > 10) {
                        this.showToast(
                            'Error',
                            'Emergency: Contact Number should not exceed 10 digits.',
                            'error'
                        );
                        return;
                    }
                }
                
                // FINAL SUBMIT AFTER API
                this.template.querySelector("lightning-record-edit-form").submit(fields);
            })
            .catch((error) => {
                console.error("❌ Geocode Error:", error);

                // Submit anyway if API failed
                this.template.querySelector("lightning-record-edit-form").submit(fields);
            });

        // Refresh staff data after save
    }


    handleSuccess(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: this.successmessage,
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        this.staffEditFlag=false;
        this.toggleflag = false;
        this.toggleflagGeolocation = false;
        let staffRecID=event.detail.id;
        console.log(' Staff saved, Id:', staffRecID);
        console.log(' Roles to sync:', JSON.stringify(this.selectedRoleValues));
        console.log(' Dropdown Selected Role:', this.selectedEmploymentRole);
        console.log('selected staff role 4 ==>'+this.selectedEmploymentRole);
       // console.log(' Hourly Rate to save BEFORE Apex call:', this.hourlyRate); 
        console.log(' Hourly Rate to save BEFORE Apex call:', this.genralHourlyRate);  
        console.log(' Hourly Rate to save BEFORE Apex call:', this.saturdayHourlyRate);
        console.log(' checkclassificationpay before:', this.classificationPayType);
        console.log('Usertypee',this.ictUserType);
         console.log('Tagflag',this.taxationeditFlag);
                 // 🔗 Call Apex to sync StaffRoles
       if (this.ictUserType==false && this.taxationeditFlag == false) {
                console.log('UsertypeeinIF',this.ictUserType);
                    console.log('this.selectedRoleValues brfore update==>', JSON.stringify(this.selectedRoleValues));
       
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
               })
               .catch(error => {
                   console.error(' Error updating StaffRoles:', error);
               });

    }

    const payload = {
        staffId: staffRecID,
        selectedFacilityIds: this.selctedMultipleFcailityValues
         }
        upsertStaffFacilities({
            wrapperJson: JSON.stringify(payload)
        }).then(reult=>{
            console.log('reult in multi facility ==>'+JSON.stringify(reult));
     })
    this.handleflag();
        this.confirmEmailError='';
        this.primaryEmailError=false;
        this.secondaryEmailError=false;
        console.log('file base64 in success=>'+JSON.stringify(this.base64FileData));
        console.log('Record in success=>'+this.preTaxRecId);
        console.log('File in success=>'+this.fileName);
       // Refresh the data after success
       //refreshApex(this.wiredClientResult);
       this.fetchStaffImperatively();
        refreshApex(this.wiredHistoryResult); 
        console.log('after success +')
       
            
             // console.log('file length'+this.fileName.length);
             // console.log('base64Data>>', JSON.stringify(this.base64FileData ));
             if(this.fileName.length>0){
                uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:staffRecID,obj:'staff'}).then(result => {
                    console.log('Upload result = ' +result);
                    //this.fileName = this.fileName + ' - Uploaded Successfully';       
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success!!',
                            message: this.file.name + ' - Uploaded Successfully!!!',
                            variant: 'success',
                        }),
                    );
                    refreshApex(this.refreshTable);
                   
                }).catch(error => {
                    console.log('ERROR'+JSON.stringify(error));
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
                //refreshApex(this.wiredClientResult);
                this.fetchStaffImperatively();
                this.fetchActiveRoles();
            }, 2000);
             
            
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }
    handleflag(){
        if (this.employeeeditflag) {
          this.employeeeditflag = false; 
          this.employeeflag = true; 
          
      } else if (this.taxationeditFlag) {
          this.taxationeditFlag = false; 
          this.taxationFlag = true; 
      } else if (this.invoiceeditFlag) {
          this.invoiceeditFlag = false; 
          this.invoiceFlag = true; 
      } else if (this.emergencyeditFlag) {
          this.emergencyeditFlag = false; 
          this.emergencyFlag= true; 
      } else if (this.bankeditFlag) {
          this.bankeditFlag = false; 
          this.bankFlag= true; 
      } else if (this.voluntaryeditFlag) {
          this.voluntaryeditFlag = false; 
          this.voluntaryFlag = true; 
      }
      
  }

  handleChange1(event){
    let inputValue = event.target.value;
    inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
    event.target.value = inputValue;
}

  handleeditClose(event){
      if(this.toggleflag){
          this.toggleValue = this.previousToggleValue;
          console.log('toggleflag'+this.toggleflag);
          console.log('Toggle status INSIDE IF:', this.toggleValue);
       }
       console.log('Toggle status OUTSIDE IF:', this.toggleValue);
       this.toggleflag = false;
       if(this.toggleflagGeolocation){
            this.toggleValueGeolocation = this.previousToggleValueGeolocation;
            console.log('toggleflagGeolocation'+this.toggleflagGeolocation);
            console.log('Toggle Geolocation status INSIDE IF:', this.toggleValueGeolocation);
       }
       console.log('Toggle Geolocation status OUTSIDE IF:', this.toggleValueGeolocation);
       this.toggleflagGeolocation = false;
       this.handleflag();
  }
  get employeeClass(){
    return (this.employeeflag || this.employeeeditflag) ? 'menu-item1' : 'menu-item'; 

}
get taxClass(){
  return (this.taxationFlag || this.taxationeditFlag) ? 'menu-item1' : 'menu-item'; 

}
get invoiceClass(){
  return this.invoiceFlag ? 'menu-item1' : 'menu-item'; 

}
get emergencyClass(){
  return (this.emergencyFlag || this.emergencyeditFlag) ? 'menu-item1' : 'menu-item'; 

}
get bankClass(){
  return (this.bankFlag || this.bankeditFlag) ? 'menu-item1' : 'menu-item'; 

}
get TrainingClass(){
  return (this.trainingFlag) ? 'menu-item1' : 'menu-item'; 

}
get HistoryClass(){
  return (this.historyFlag) ? 'menu-item1' : 'menu-item'; 

}
get voluntaryClass(){
    return (this.voluntaryFlag || this.voluntaryeditFlag) ? 'menu-item1' : 'menu-item'; 
  
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
        this.descriptiontwo = '';
        
    } else if (index === "3") {
        this.showDescription3 = false;
        this.delete2 = true;
        this.pretaxThree = 0;
        this.descriptionthree = '';
        
    } else if (index === "4") {
        this.showDescription4 = false;
        this.delete3 = true;
        this.pretaxFour = 0;
        this.descriptionfour = '';
        
    } else if (index === "5") {
        this.showDescription5 = false;
        this.delete4 = true;
        this.pretaxFive = 0;
        this.descriptionfive = '';
        
        
    }
    this.handlePreTaxChange({ target: { name: '' } });
}


handlePreTaxChange(event){
        
    if (event.target.name == 'name') {
        this.name = event.detail.value;
    }
    if (event.target.name == 'lastname1') {
        this.lastname1 = event.detail.value;
    }
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
    if(event.target.name == 'descriptionone'){
        this.descriptionone=event.target.value;
        console.log('this.descriptionone'+this.descriptionone);
       
    }
    if(event.target.name == 'descriptiontwo'){
        this.descriptiontwo=event.target.value;
        console.log('this.descriptiontwo'+this.descriptiontwo);
       
    }
    if(event.target.name == 'descriptionthree'){
        this.descriptionthree=event.target.value;
        console.log('this.descriptionthree'+this.descriptionthree);
    }
    if(event.target.name == 'descriptionfour'){
        this.descriptionfour=event.target.value;
        console.log('this.descriptionthree'+this.descriptionfour);
       
    }
    if(event.target.name == 'descriptionfive'){
        this.descriptionfive=event.target.value;
        console.log('this.descriptionthree'+this.descriptionfive);
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
        console.log('Contribution fixed : '+ event.target.value);
        }
        if(event.target.value=='Percentage'){
            this.VoluntaryContributionPercent=true;
            this.VoluntaryContributionCurrency=false;
        console.log('Contribution Percentage : '+ event.target.value);

        }
        else {
            // '--None--' or any unexpected value
           // this.VoluntaryContributionCurrency = false;
           // this.VoluntaryContributionPercent = false;
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

    ShowDocumentSection(event){
        this.showStaffDocumentSection= true;
        this.ShowDataTable=false;
        this.parentStaffId=event.currentTarget.dataset.id; 
        console.log('parent Id=>'+this.parentStaffId);

    }
    closeDocumentSection(){
        this.showStaffDocumentSection= false;
        this.ShowDataTable=true;
        this.accountRecList=[];
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
                        console.log('file data 11=>' + JSON.stringify(this.accountRecList));
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

    let hasError = false;

    this.uploadedFiles = this.uploadedFiles.map(file => {
        if (!file.typeOfDocument) {
            hasError = true;
             console.log('validation fired');
            
            return { ...file, errorMessage: 'Complete this field' };
           
        }
        return { ...file, errorMessage: '' };
    });

     console.log('ERROR :', JSON.stringify(this.uploadedFiles));

    if (!this.validateExpiryDate()) {
        return; // ⛔ STOP
    }

    if (hasError) {
         this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Document Type is Mandatory',
                    message: 'Please select Document Type for all uploaded files.',
                    variant: 'error'
                })
            );
        return; // ❌ Stop submission
    }
    let expiryError = false;

    if (expiryError) {
        return; // ❌ Stop submission
    }
    // ✅ Proceed with submission
    console.log('🚀 Submitting files:', JSON.stringify(this.uploadedFiles));

        this.accountRecList = this.uploadedFiles;
        this.showLoadingSpinner = true;
         this.accountRecList.forEach(item => {
            this.staffDocumentMap[item.fileName] = item.base64Data;
        }); 
        console.log('staffMap=>' + JSON.stringify(this.staffDocumentMap));
        console.log('staffMap accountRecList =>' + JSON.stringify(this.accountRecList));
        insertPreTax({JsonString: JSON.stringify(this.accountRecList),staffID: this.staffId,isPretax: false
        }).then(result => {
            console.log('document result' + JSON.stringify(result));
           this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Documents submitted successfully!',
                variant: 'success',
            })
        );

            this.accountRecList=[];
            this.uploadedFiles=[];
            this.showStaffDocumentSection=false;
            this.showPreTaxRecordEditForm=false;
            this.ShowDataTable=true;
          
            setTimeout(() => {
                //this.showSpinner = false;
                 this.showLoadingSpinner = false;
                this.addingPreTax();  
            }, 3000);
        }).catch(error => {
           
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error in uploading File. Please Provide All Details',
                    message: error.message,
                    variant: 'error',
                }),
            );
            console.error('error' + JSON.stringify(error));
            //this.showSpinner = false;
            this.showLoadingSpinner = false;
            this.showStaffDocumentSection=false;
            this.showPreTaxRecordEditForm=false;
            this.ShowDataTable=true;
            
        });  
        
        
    }

    reloadPage() {
        // Use NavigationMixin to navigate to the current page
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: window.location.href
            }
        });
    }
    handleRowActions(event){ 
       // const row = event.detail.row
        this.preTaxRecId= event.currentTarget.dataset.id;
        this.parentStaffId=event.currentTarget.dataset.staff;
        this.typeOfDocument=event.currentTarget.dataset.type;
        let isExpiryRequired = event.currentTarget.dataset.expiryrequired === 'true';
        const actionName = event.currentTarget.name;
        const url = event.currentTarget.dataset.url;
        this.key = event.currentTarget.dataset.key;
        console.log(' this.key'+ this.key);
        console.log(' ID'+this.preTaxRecId);
        console.log(' STAFF ID'+this.parentStaffId);
        console.log(' NAME'+actionName);
        this.totalfiles=[];
        console.log('totalfiles',JSON.stringify(this.totalfiles));
        switch (actionName) {
            case 'delete':
              deleteRecord(this.preTaxRecId).then(() => {
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: 'Success',
                    message: 'Staff Document has been deleted',
                    variant: 'success'
                  })
                );
                this.ShowDataTable=true;
                
              //  return refreshApex(this.recordsToDisplay)
              //this.loadStaffData()
              this.deleteFile(this.key);
              this.addingPreTax();  
              }).catch(error => {
                console.log('error=>'+JSON.stringify(error));
             });
            break;

        case 'edit':
            this.showPreTaxRecordEditForm=true;
            this.employeeeditflag=false;
            this.fileName='';
            this.documentedit=true;
            
        break;
        case 'view_details':
              event.preventDefault(); 
              this.isHome=false;
              this.currentUrl = url;
             console.log('file url  '+ this.currentUrl);  
              this.isModalOpen = true;

               const fileType = this.getFileType(this.currentUrl); 
        
              //console.log('file type: ' + fileType);
              // Check if the file type is not PNG or PDF
               if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'jpg' && fileType !== 'csv' && fileType !== 'svg') {
                  setTimeout(() => {
                      this.closeModal();
                  }, 1700);
                  
              } 
        break;
     } 
      
    }

    handlePreTaxRecordFormSubmit(event) {
        event.preventDefault();

        console.log('📝 record edit form submit');
        console.log('📄 Selected Document Type:', this.typeOfDocument);

        const fields = event.detail.fields;

        // ----------------------------------------------------
        // 🔍 Determine expiry requirement dynamically
        // ----------------------------------------------------
        const docMeta = this.documentMetaMap?.[this.typeOfDocument];

        const isExpiryRequired =
            docMeta && docMeta.expiryRequired === true;

        console.log('⏰ Expiry required:', isExpiryRequired);
        console.log('📅 Expiry Date value:', fields.Expiry_Date__c);

        // ----------------------------------------------------
        // ❌ BLOCK SAVE if expiry is required but missing
        // ----------------------------------------------------
        if (isExpiryRequired && !fields.Expiry_Date__c) {
            console.warn('❌ Expiry Date is required but missing');

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Missing Expiry Date',
                    message: 'Expiry Date is required for this document.',
                    variant: 'error'
                })
            );
            return; // ⛔ STOP SUBMIT
        }

        // ----------------------------------------------------
        // ✅ Business logic
        // ----------------------------------------------------
        fields.Status__c = 'Approved';
        fields.Document_Type__c = this.typeOfDocument;

        // ----------------------------------------------------
        // 📎 File handling
        // ----------------------------------------------------
        if (this.uploadedFiles1?.length) {
            this.deleteFile(this.key);

            fields.View_File__c = this.uploadedFiles1[0].url;
            fields.Awsjson__c = JSON.stringify(this.uploadedFiles1[0]);
            fields.File_Name__c = this.uploadedFiles1[0].originalName;
            fields.key__c = this.uploadedFiles1[0].key;
        }

        console.log('🚀 Submitting fields:', JSON.stringify(fields, null, 2));

        this.template
            .querySelector('lightning-record-edit-form[data-recid="PreTaxForm"]')
            .submit(fields);
    }

    closePreTaxRecordEditForm(event){
        this.showPreTaxRecordEditForm=false;
        this.uploadedFiles1 =[];
         this.key='';
         this.employeeeditflag=true;
         this.preTaxRecId='';
         this.totalfiles=[];
         this.documentedit=false;
         console.log('TOTALFILES',JSON.stringify( this.totalfiles));
    }

    handlePreTaxSuccess(event){
        this.preTaxRecId=event.detail.id;
        
       
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Changes Saved Successfully !!',
                variant: 'success',
            }),
        );
        this.showPreTaxRecordEditForm=false;
        this.employeeeditflag=true;
       //this.employeeeditflag=true;
        setTimeout(() => {
            this.showSpinner = false;
            this.addingPreTax();  
        }, 2000);
       
            this.accountRecList=[];
            this.uploadedFiles1 =[];
            this.key='';
            this.documentedit=false;
           // this.addingPreTax();  

          /*   setTimeout(() => {
                
                this.addingPreTax(); 
                this.showSpinner = false; 
            }, 3000); */
            console.log('last line ')              
    }

    
    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileType(url) {
       const fileName = url.substring(url.lastIndexOf('/') + 1);
       return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
   }
    @track hasRecords;
    addingPreTax(){
         console.log('Parent record Id  in addingPreTax'+this.parentStaffId );
        return fetchStaff({recordId :this.parentStaffId }).then(response => {
            console.log('satff list after save'+JSON.stringify(response));
            console.log('response.length :  '+(Object.keys(response).length));
        // this.noRecordsFlag = !(response && response.length > 0);
        //   this.noRecordsFlag = !response || Object.keys(response).length === 0;
        //     console.log('noRecordsFlag:  '+this.noRecordsFlag);
        let childRec = response && response.Child_Staffs__r ? response.Child_Staffs__r : [];
        console.log('childRec :  '+JSON.stringify(childRec));
        this.DocumentTableData=[];
        let totalPoints = 0;
        childRec.forEach(rec=>{
            if(rec.Document_Type__c ){
                // ADD STATUS PROCESSING HERE
                const status = rec.Status__c || 'Pending';
                totalPoints += Number(rec.Points__c) || 0;
                
                this.DocumentTableData.push({
                    ...rec, // Spread existing record properties
                    // ADD STATUS-RELATED FIELDS
                    statusClass: status === 'Approved' ? 'status-approved' : 
                                status === 'Rejected' ? 'status-rejected' : 'status-pending',
                    Status__c: status,
                    isPending: status === 'Pending',
                    isApproved: status === 'Approved', 
                    isRejected: status === 'Rejected',
                    Status_Display: status === 'Pending' ? '' : status,
                    disableApprove: status !== 'Pending',
                    disableReject: status !== 'Pending',
                    FormattedDate: rec.Expiry_Date__c 
                        ? new Date(rec.Expiry_Date__c).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                        }) 
                        : '',
                    ComplianceFormatted: rec.Compliance__c !== null && rec.Compliance__c !== undefined
                        ? String(rec.Compliance__c).charAt(0).toUpperCase() +
                        String(rec.Compliance__c).slice(1).toLowerCase()
                        : '',
                    KeyVal: rec && rec.key__c ? rec.key__c : ''
                });
            }
        });
            console.log('this.DocumentTableData :  '+JSON.stringify(this.DocumentTableData));
            this.hasRecords = this.DocumentTableData.length > 0;

            this.totalPoints = totalPoints;
            
            // Update records for pagination
            this.records = [...this.DocumentTableData];
            this.totalRecords = this.records.length;
            this.paginationHelper();
        }); 
 
    }

   
    

/*     typeOfUserChnage(event){
        if(event.detail.value=='ICT User'){
            this.ictUserType=true;
            console.log('Usertypechecking',this.ictUserType );
        }else{
            this.ictUserType=false;
           console.log('Usertypechecking2',this.ictUserType );
        }

    } */

    @track includeSuperannuation = false;
    @track superannuationValue;
    @track containerStyle;
    @track LANGUAGE_OPTIONS = [
        'Arabic', 'Armenian', 'Azerbaijani', 'Bengali', 'Burmese', 'Dhivehi', 'Dzongkha',
        'English', 'Filipino', 'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Indonesian',
        'Italian', 'Japanese', 'Kazakh', 'Khmer', 'Korean', 'Kyrgyz', 'Lao', 'Malay', 'Mandarin',
        'Mongolian', 'Nepali', 'Persian', 'Portuguese', 'Russian', 'Samoan', 'Sinhala', 'Swahili',
        'Thai', 'Tongan', 'Turkish', 'Urdu', 'Uzbek', 'Vietnamese'
    ];


    connectedCallback() {
        this._handleOutsideClick = this.handleClickOutside.bind(this);
        this._updateHeight = this.updateHeight.bind(this);
        window.addEventListener('click', this._handleOutsideClick);
        window.addEventListener('resize', this._updateHeight);
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
        this.fetchStaffInfo();
        this.fetchStaffImperatively();
         this.fetchActiveRoles();
        this.dynamicDocumentTypes = this.hierarchicalOptions || [];
        //this.fetchDropdownRoleWithRates();//manendra
        const activeTab = localStorage.getItem('activeAdminStaffTab');
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
        this.trainingFlag = false;
        this.disableedit = true;
        this.historyFlag = false;

         switch (activeTab) {
            case 'staffEmployee':
                this.employeeflag = true;
                break;
            case 'staffTax':
                this.taxationFlag = true;
                this.voluntaryMethod();
                break;
            case 'staffHistory':
                this.historyFlag = true;
                this.disableedit = false
                break;
            
            default:
                this.employeeflag = true;
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
      fetchMultiFaciltyOptions(){
          getFacilityData().then(facResponse => {
               
              this.selctedMultipleFcailityValues = this.clientData[0].selectedFacilityIds || [];   
              console.log('this.selctedMultipleFcailityValues  '+this.selctedMultipleFcailityValues)    
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
    
    disconnectedCallback() {
        window.removeEventListener('click', this._handleOutsideClick);
        window.removeEventListener('resize', this._updateHeight);
    }
    renderedCallback() {
        setTimeout(() => {
            this.updateHeight();
        }, 50);
        const cells = this.template.querySelectorAll('.fixed-table td, .fixed-table th');
        cells.forEach(cell => {
            // Remove previous title to avoid duplicates
            cell.removeAttribute('title');

            // Check if text is truncated (scrollWidth > clientWidth)
            if (cell.scrollWidth > cell.clientWidth) {
                cell.setAttribute('title', cell.textContent.trim());
            }
        });
      }

    fetchStaffInfo() {
        getstaffId2({ userId: userId })
            .then(result => {
                console.log('Staff Wrapper Result:', result);
                this.setHoursAccess = result.setHoursAccess;
            })
            .catch(error => {
                console.error('Error fetching staff info:', error);
                this.showToast('Error', 'Failed to fetch staff information', 'error');
            });
    }


      updateHeight() {
        const footer = document.querySelector('c-footerlwc_footerlwc'); // default class
        const header = document.querySelector('header'); // adjust this as needed
        const footerHeight = footer ? footer.offsetHeight : 0;
        const headerHeight = header ? header.offsetHeight : 0;
        const height = window.innerHeight - footerHeight - headerHeight;
    
        this.containerStyle = `height: ${height}px; overflow-y: auto; overflow-x: hidden;`;
        console.log('height '+this.containerStyle);
        console.log('FOOTER '+footer);
        console.log('FOOTER '+header);
      }
    employmentTypeChange(event){    
        if(event.target.name=='fixedcategoryType'){
            if(event.target.value==true){
                this.isFixedcategory=false;
                this.includeSuperannuation = false;
                this.superannuationValue = 'Include Superannuation';
                console.log('onchange event : '+this.superannuationValue);
                this.paidBreak=true;
            }else{
                this.isFixedcategory=true;
                this.includeSuperannuation = true;
                this.superannuationValue = 'Exclude Superannuation';
                console.log('onchange event : '+this.superannuationValue);
                this.paidBreak=false;
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
          console.log(' categoryType ' + this.categoryType);
            console.log(' jobType ' + this.jobType);
            console.log(' classificationType ' + this.classificationLevel);
            console.log(' classificationPayType ' + this.classificationPayType);
             let jobTypeValue=(this.jobType =='Full-time' ||this.jobType =='Part-time'  ) ?'Full-time and part-time' :this.jobType;
              console.log(' jobTypeValue ' +jobTypeValue);

        if( this.categoryType !=null &&  this.jobType !=null &&  this.classificationLevel !=null &&  this.classificationPayType !=null){          
            if(this.isSchadsAwards == true){
              //  let categoryTypeValue=(this.categoryType =='Full-time' ||this.categoryType =='Part-time'  ) ?'Full-time and part-time' :this.categoryType;
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
 
      
    //Slide-In-Out-Animation
    @track header = true; // Always true
    @track animationClass = ''; // Tracks the animation class
    
    toggleHeader(event) {
        event.stopPropagation(); // Prevent triggering the outside click listener when clicking the icon
        const gridElement = this.template.querySelector('.grid');
    
        if (gridElement.classList.contains('slide-in')) {
            // Slide out the header
            gridElement.classList.remove('slide-in');
            gridElement.classList.add('slide-out');
    
            // Hide the header after the animation completes
            setTimeout(() => {
                gridElement.style.visibility = 'none';
                console.log('Header is now hidden after sliding out.');
            }, 500); // Match the animation duration
        } else {
            // Slide in the header
            gridElement.style.visibility = 'visible'; // Ensure it is visible before sliding in
            gridElement.classList.remove('slide-out');
            gridElement.classList.add('slide-in');
    
            console.log('Header is now visible after sliding in.');
        }
    }
    

  handleClickOutside(event) {
    const dropdown = this.template.querySelector('.dropdown-container'); 
    const gridElement = this.template.querySelector('.grid');
    const nationalityDropdown = this.template.querySelector('.custom-dropdown');
    const languageDropdown = this.refs.languageDropdown;
    const facilityBox = this.template.querySelector('.facility-dropdown');
    const employmentBox = this.template.querySelector('.employment-role-dropdown');

    const path = typeof event.composedPath === 'function'
        ? event.composedPath()
        : [event.target];

    let clickedInsideDropdown = false;
    let clickedInsideGrid = false;
    let clickedInsideNationality = false;
    let clickedInsideFacility = false;
    let clcikedInsideEmploymentBox = false;

    // ✅ BEST: compute language click once
    const clickedInsideLanguage = languageDropdown ? path.includes(languageDropdown) : false;

    for (const node of path) {
        if (!node) continue;

        if (node === dropdown || (node.classList && node.classList.contains('dropdown-container'))) {
            clickedInsideDropdown = true;
        }

        if (node === nationalityDropdown || (node.classList && node.classList.contains('custom-dropdown'))) {
            clickedInsideNationality = true;
        }

        if (node === facilityBox || (node.classList && node.classList.contains('dropdown-container'))) {
            clickedInsideFacility = true;
        }

        if (node === employmentBox || (node.classList && node.classList.contains('dropdown-container'))) {
            clcikedInsideEmploymentBox = true;
        }

        if (node === gridElement || (node.classList && node.classList.contains('grid'))) {
            clickedInsideGrid = true;
        }

        // keep this if it’s only for roles toggle behavior
        if (
            node.classList &&
            (node.classList.contains('toggle-input') ||
             node.classList.contains('toggle-switch-container'))
        ) {
            clickedInsideDropdown = true;
        }
    }

    if (this.isOpen && !clickedInsideDropdown) {
        this.isOpen = false;
        this.removeOutsideListenerIfNeeded();
    }

    if (this.showDropdown && !clickedInsideNationality) {
        this.showDropdown = false;
        this.removeOutsideListenerIfNeeded();
    }

    if (this.isExpanded && !clickedInsideLanguage) {
        this.isExpanded = false;
        this.removeOutsideListenerIfNeeded();
    }

    if (this.facilityDropDownOpen && !clickedInsideFacility) {
        this.facilityDropDownOpen = false;
        this.removeOutsideListenerIfNeeded();
    }

    if (this.roleDropDownForEmployment && !clcikedInsideEmploymentBox) {
        this.roleDropDownForEmployment = false;
        this.removeOutsideListenerIfNeeded();
    }

    if (gridElement && !clickedInsideGrid && !path.some(node => node.tagName === 'IMG')) {
        if (gridElement.classList.contains('slide-in')) {
            gridElement.classList.remove('slide-in');
            gridElement.classList.add('slide-out');
        }
    }
}

/* handleClickOutside(event) {
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
    } */
    
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
                title: 'Update Failed',
                message: message,
                variant: 'error',
                
            })
        );
    }

    preventClose(event) {
        event.stopPropagation(); // Prevent triggering the outside click listener when clicking inside the grid
    }

   /*  triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    } */
     triggerFileInput() {
        
        console.log('triggerFileInput called ');
        const inputEl = this.template.querySelector('input[type="file"]');
        if (inputEl) {
            inputEl.value = '';
            inputEl.click();
            console.log('triggerFileInput called111 ');
        } else {
            console.warn("⚠️ File input not found.");
        }
    }

    @track isFileExpand = false;
    handleAwsUploadComplete(evt) {
        try {
            console.group('[AWS Upload Complete]');
            console.log('Raw event detail:', evt?.detail);

            //const { recordId, files = [], ctx } = evt.detail || {};
            const { recordId, files = [] } = evt.detail || {};
            console.log('recordId:', recordId);
            console.log('files count:', files.length, 'files:', files);
            //console.log('ctx (cellId):', ctx);

            if (!files.length) {
                console.warn('No uploaded files in payload; aborting.');
                console.groupEnd();
                return;
            }

            // Build arrays from the full payload
            const urls       = files.map(f => f?.url).filter(Boolean);
            const names      = files.map(f => f?.originalName).filter(Boolean);
            const types      = files.map(f => f?.type).filter(Boolean);
            const s3Keys     = files.map(f => f?.key).filter(Boolean);
            const modulePath = files[0]?.modulePath ?? undefined;
            const sizes      = files.map(f => f?.size).filter(Boolean);
            const totalBytes  = files.map(f => f?.totalBytes).filter(Boolean);

            console.log('All URLs:', urls);
            console.log('All names:', names);
            console.log('All types:', types);
            console.log('All s3 keys:', s3Keys);
            console.log('All sizes:', sizes);

            // If your field.value must be a string, use:
            // const valueForField = urls.join(',');
            const valueForField = urls; // ✅ save all URLs as an array

            const metaPayload = {
                modulePath,
                recordId,
                uploadedAt: new Date().toISOString(),
                uploadedFiles: files,     // ✅ include ALL returned file objects
                rawEventDetail: evt.detail
            };

           
            if(this.documentedit){
                 this.uploadedFiles1=files;
                 this.isFileExpand = true;
                 console.log(' this.uploadedFiles1 : ',  JSON.stringify(this.uploadedFiles1));
            }else{
                 this.processSelectedFiles(files);
                 this.isFileExpand = false;
                 console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles));
            }
           
           
            this.fileSizeInBytes = totalBytes;
            console.log(' Files in last  : ',  files);
            
           
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }
   /*  handleFileUploadInputChange(event) {
        const files = Array.from(event.target.files || []);
        this.processFiles(files); 
        event.target.value = ''; 
        
    } */
   @track totalfiles=[];
   handleFileUploadInputChange(event) {
    let files = Array.from(event.target.files || []);
   
     const invalidFile = files.find(f => !this.isAllowedFile(f));
    if (invalidFile) {
        this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
        event.target.value = ''; // reset
        return;
    }
     const longNameFile = files.find(f => f.name.length > 100);
        if (longNameFile) {
            this.showToast(
                'Error',
                `Filename too long: "${longNameFile.name}". Maximum allowed is 100 characters.`,
                'error'
            );
            event.target.value = '';
            return;
        }

    if (this.documentedit) {
        // Allow only one file in edit mode
         if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            event.target.value = ''; // reset input
            return;
        }
        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }
        // Take only the first file
        files = [files[0]];
    }
     this.totalfiles.push(...files);

    this.processFiles(files);

    // Reset file input so same file can be re-uploaded if needed
    event.target.value = '';
}
    processFiles(files) {
    if (!files || !files.length) return;

    setTimeout(() => {
        this.isFileExpand = true;

        setTimeout(() => {
            const svc = this.template.querySelector('c-document-office-service');
            if (!svc) {
                console.warn('⚠️ No <c-document-office-service> component found.');
                return;
            }

            svc.incomingFiles = files;
        }, 1000);
    }, 0);
  }



    handleFaciltyChange(event){
      /*   praveen changes for nursing  start*/
        console.log('facilty change '+event.detail.value)
        this.StaffFacility=event.detail.value;
        console.log('StaffFacility ' +this.StaffFacility); 
         this.fetchFacility(this.StaffFacility);
         this.categoryType='';
        this.jobType='';
        this.classificationLevel='';
        this.classificationPayType='';
          /*   praveen changes for nursing  end*/
         
    }
    @track toggleflag = false;
    handleStatus(event) {
        this.previousToggleValue = this.toggleValue;
        console.log('previousToggleValue'+this.previousToggleValue);
        this.toggleflag = true;
                
        this.toggleValue = event.target.checked; 
        
        console.log('Toggle status:', this.toggleValue);

    }
    @track toggleflagGeolocation = false;
    handleGeolocation(event) {
        this.previousToggleValueGeolocation = this.toggleValueGeolocation;
        console.log('previousToggleValueGeolocation'+this.previousToggleValueGeolocation);
        this.toggleflagGeolocation = true;
                
        this.toggleValueGeolocation = event.target.checked; 
        
        console.log('Toggle status in Geolocation:', this.toggleValueGeolocation);

    }

     @track uploadedFiles = [];

      get hasFiles() {
        return this.uploadedFiles.length > 0;
    }

    //staff documentation new implementation
     triggerFileDialog() {
        const input = this.template.querySelector('.file-input');
        if (input) {
            input.click();
        }
    }

     handlemultipleFileUpload(event) {
        this.processSelectedFiles(Array.from(event.target.files));
    }

    // Drag & drop
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }

    ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

    isAllowedFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return this.ALLOWED_FILE_EXTENSIONS.includes(ext);
    }

    handleDrop(event) {
     event.preventDefault();
     event.stopPropagation();
    let files = Array.from(event.dataTransfer.files || []);
     const invalidFile = files.find(f => !this.isAllowedFile(f));
    if (invalidFile) {
        this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
        event.target.value = ''; // reset
        return;
    }
    if (this.documentedit) {
        // 🚫 Allow only one file in edit mode
        if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            return;
        }

        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }

        files = [files[0]]; // take only the first file
    }

    // Push to tracking array
    this.totalfiles.push(...files);

    // Process files as usual
    this.processFiles(files);
    }

 processSelectedFiles(responseJson) {
    // Ensure it's always an array
    const files = Array.isArray(responseJson) ? responseJson : [responseJson];

    files.forEach(file => {
        const newFile = {
           index: this.uploadedFiles.length,
           Description: null,
           Quantity: null,
           preTaxDate: null, 
           comment: '',
           typeOfDocument: '',
           fileName: file.originalName,
           staffExpirydate: '',
           compliance: false,
           points: 0,
           errorMessage: '',
           awsjson:file, 
           status:'Approved',
           admin:true
           
                
        };

        this.uploadedFiles = [...this.uploadedFiles, newFile];
    });

    console.log('✅ Uploaded files pushed:', this.uploadedFiles);
}

handlefilecancel(event){
    console.log('child called');
     console.log('Cancel event received:', event.detail.message);
    this.totalfiles=[];
}

 handleFileDeleted(event) {
        console.group('handleFileDeleted called ');
        const { key, fileId ,files} = event.detail;
        console.log('File deleted in child. Key:', key, 'FileId:', fileId, 'files:',JSON.stringify(files) );

        // Example: remove it from parent's tracking
        this.uploadedFiles1 = this.uploadedFiles1.filter(f => f.fileId !== fileId);
        console.log(' this.uploadedFiles in handleFileDeleted: ',  JSON.stringify(this.uploadedFiles1));
        // if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
        //    this.isFileExpand = false;
        // }
        if (!files || files.length === 0) {
           this.isFileExpand = false;
           
        }
    }



   /*  handleDocTypeChange(event) {
            const index = event.target.dataset.index;
            this.uploadedFiles[index].typeOfDocument = event.detail.value;
            this.uploadedFiles = [...this.uploadedFiles];
             console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
        } */

    // handleDocTypeChange1(event){
    //     this.typeOfDocument = event.detail.value;
    //     console.log('type of document',this.typeOfDocument);
    //      const docPointsMap = {
    //     'Australian Passport': 60,
    //     'Foreign Passport': 60,
    //     'Drivers Licence': 40,
    //     'Medicare Card': 25,
    //     'Birth Certificate': 40,
    //     'Certificate of Identity': 40,
    //     'Photo ID': 40,
    //     'Proof of Age Card': 40,
    //     'Rating Authority': 25,
    //     'Citizenship Certificate': 25,
    //     'Change of Name Certificate': 25,
    //     'Bank Statement 1': 20,
    //     'Bank Statement 2': 20,
    //     'Centrelink Card': 20,
    //     'DVA Card': 20,
    //     'Lease Agreement': 20,
    //     'Marriage Certificate': 20,
    //     'Utility Bill 1': 20,
    //     'Utility Bill 2': 20,
    //     'Foreign Birth Certificate': 15,
    //     'Indigenous Reference': 15
    // };
    // this.points =  docPointsMap[ this.typeOfDocument] || 0;

    // }

//      handleDocTypeChange(event) {
//     const index = event.target.dataset.index;
//     const selectedType = event.detail.value;

//     // Update the selected document type
//     this.uploadedFiles[index].typeOfDocument = selectedType;
//     this.uploadedFiles[index].errorMessage = '';

//     this.uploadedFiles[index] = {
//             ...this.uploadedFiles[index],
//             typeOfDocument: value,
//             points: this.documentPointsMap[value] || 0,
//             isExpiryRequired: meta?.expiryRequired === true
//         };

//     // Trigger reactivity
//     this.uploadedFiles = [...this.uploadedFiles];

//     console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
// }

    handleDocTypeChange1(event) {
        const selectedType = event.detail.value;

        this.typeOfDocument = selectedType;
        this.points = this.documentPointsMap[selectedType] || 0;
        const meta = this.documentMetaMap[selectedType];
        this.isExpiryRequired = meta?.expiryRequired === true;
        console.log('Edit Mode → Type:', selectedType, 'Points:', this.points);
    }

    handleDocTypeChange(event) {
        console.log('DOC CHANGE EVENT:', JSON.stringify(event.detail));
        
        // Get index from the component's data attribute
        const index = event.currentTarget.dataset.index;
        const value = event.detail.value;
        
        if (index === undefined || !this.uploadedFiles[index]) {
            console.error('Invalid index received:', index);
            return;
        }

        const meta = this.documentMetaMap[value];

        this.uploadedFiles[index] = {
            ...this.uploadedFiles[index],
            typeOfDocument: value,
            points: this.documentPointsMap[value] || 0,
            isExpiryRequired: meta?.expiryRequired === true
        };

        this.uploadedFiles = [...this.uploadedFiles];
    }
   

    /* handleCommentsChange(event) {
        const index = parseInt(event.target.dataset.index);
        const comment = event.target.value;
        
        console.log('📝 Updating comment for index:', index, 'Comment:', comment);
        
        // Create a new array to ensure reactivity
        const updatedFiles = [...this.uploadedFiles];
        
        if (updatedFiles[index]) {
            updatedFiles[index].comment = comment;
            this.uploadedFiles = updatedFiles;
            
            console.log('✅ Comments updated:', JSON.stringify(this.uploadedFiles));
        } else {
            console.error('❌ Invalid index for comments update:', index);
        }
    } */

    handleCommentsChangeDoc(event) {
        const index = Number(event.target.dataset.index);
        const newValue = event.target.value;

        console.log("✏ Comment Change → index:", index, "value:", newValue);

        // 🔥 Deep clone array + objects (fixes non-reactive nested values)
        const updatedFiles = this.uploadedFiles.map((f, i) =>
            i === index ? { ...f, comment: newValue } : { ...f }
        );

        this.uploadedFiles = updatedFiles;

        console.log("📌 Updated uploadedFiles:", JSON.stringify(this.uploadedFiles));
    }


    handleExpiryDateChange(event) {
        const index = event.target.dataset.index;
        this.uploadedFiles[index].staffExpirydate = event.target.value;
        this.uploadedFiles = [...this.uploadedFiles];
         console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
         
    }

    handleComplianceChange(event) {
        const index = event.target.dataset.index;
        this.uploadedFiles[index].compliance = event.target.checked;
        this.uploadedFiles = [...this.uploadedFiles];
        /*  console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
         this.updateCompliantFiles(); */
    }
    updateCompliantFiles() {
        this.accountRecList = this.uploadedFiles.filter(file => file.compliance);
        console.log(' ACCOUNTLIST', JSON.stringify(this.accountRecList));
    }

    handleDelete(event) {
         console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
        const index = event.currentTarget.dataset.index;
        const key = event.currentTarget.dataset.key;
         console.log('key:',key );
          console.log('index:',index );
        this.uploadedFiles.splice(index, 1);
        this.uploadedFiles = [...this.uploadedFiles];
         console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
          this.deleteFile(key);
    }

    handleCancel(event){
       
        this.uploadedFiles = [];
        this.totalfiles=[];
        console.log('executed');
    }
     fetchFacility(facId) {
            console.log('fetchFacility by service '+facId);
            getfacilityById({ facId: facId })
                .then(result => {
                      console.log('fetchFacility')
                    if (result) {
                        this.typeOfService = result.Type_of_Service__c;
                        console.log('Type of Service:', this.typeOfService);
                         
                        if(this.typeOfService == 'NDIS'){
                            this.isSchadsAwards = true;
                             this.isNursingAwards = false;
                             this.isChildCareAwards = false;
                             this.isFixedcategory =false;
                        
                        }else if(this.typeOfService == 'Nursing'){
                             this.isSchadsAwards = false;
                            this.isNursingAwards = true;
                            this.isChildCareAwards = false;
                            this.isFixedcategory =false;
                        }else if(this.typeOfService == 'Child Care'){
                            this.isSchadsAwards = false;
                            this.isNursingAwards = false;
                            this.isChildCareAwards = true;
                             this.isFixedcategory =false;
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

         async deleteFile(key) {
        if (!key) {
            console.error('[DELETE] key is required');
            return;
        }

        try {
            const resp = await fetch(ENDPOINTS.delete, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });

            const text = await resp.text();
            let json;
            try { json = JSON.parse(text); } catch { json = null; }

            if (!resp.ok) throw new Error(json?.error || `Delete failed ${resp.status}: ${text}`);

            console.log('[DELETE] success', json);

            // Optionally, dispatch an event if some other part of the app needs to know
          /*   this.dispatchEvent(new CustomEvent('filedeleted', {
                detail: { key },
                bubbles: true,
                composed: true
            }));

 */

           

            this.isDisabled=false;
            this.key='';
            this.isEdit=false;
           
            
        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }

    getOptionButtonClass(isActive) {
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
            ? 'status-badge1 status-badge-active1' 
            : 'status-badge1 status-badge-inactive1';
    }

    getToggleTrackClass(option) {
        return option.checked ? 'custom-toggle-track active' : 'custom-toggle-track';
    }
    
    
    handleSearchChange(event) {
        const searchKey = event.target.value.toLowerCase();

        if (searchKey) {
            const filtered = this.allNationalities
                .filter(nation => nation.toLowerCase().includes(searchKey))
                .map(n => ({
                    label: n,
                    value: n
                }));

            this.filteredOptions = filtered;
            this.noResults = filtered.length === 0;
             console.log(' No Results Found:', this.noResults);
        } else {
            // reset dropdown when input is cleared
            this.filteredOptions = this.allNationalities.map(n => ({
                label: n,
                value: n
            }));
            this.noResults = false;
            this.Nationality = null;
        }
        // ✅ Always show dropdown when typing or clearing
        this.showDropdown = true;
    }


    toggleDrop(event) {
        event.stopPropagation(); // prevent bubbling

        this.showDropdown = !this.showDropdown;

            if (this.showDropdown) {
                // ✅ Populate dropdown options
                this.filteredOptions = this.allNationalities.map(n => ({
                    label: n,
                    value: n
                }));
                this.noResults = false;

                // ✅ Bind & attach outside click listener
                this._boundHandleClickOutside = this.handleClickOutside.bind(this);
                window.addEventListener('click', this._boundHandleClickOutside);
            } else {
                // ✅ Remove listener when closed
                this.showDropdown = false;
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
handleDropdownToggle(event) {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
        if (!this._boundHandleClickOutside) {
            this._boundHandleClickOutside = this.handleClickOutside.bind(this);
        }
        setTimeout(() => window.addEventListener('click', this._boundHandleClickOutside), 0);
    } else {
        this.removeOutsideListenerIfNeeded();
    }
}


removeOutsideListenerIfNeeded() {
  if (
    !this.isOpen &&
    !this.showDropdown &&
    !this.isExpanded &&
    !this.facilityDropDownOpen &&
    !this.roleDropDownForEmployment
  ) {
    window.removeEventListener('click', this._boundHandleClickOutside);
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
    
    async handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === "approve") {
            await updateDocumentStatus({ 
                recordId: row.Id, 
                newStatus: 'Approved' 
            });
            this.refreshDocumentTable();
        }
        else if (actionName === "reject") {
            this.currentDocumentId = row.Id;  // store doc ID
            this.showRejectModal = true; 
        }
    }

    updateDocumentStatus(docId, newStatus, comments = '') {
        updateDocumentStatus({
            documentId: docId,
            status: newStatus,
            comments: comments   // ⭐ pass comments only when rejecting
        })
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: `Document marked as ${newStatus}`,
                    variant: 'success'
                })
            );

            //return refreshApex(this.wiredClientResult);
            return this.fetchStaffImperatively();
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }

    getStatusClass(status) {
        const baseClass = "status-badge";
        switch (status) {
            case "Pending":
                return `${baseClass} pending`;
            case "Approved":
                return `${baseClass} approved`;
            case "Rejected":
                return `${baseClass} rejected`;
            default:
                return baseClass;
        }
    }

    handleApprove(event) {
        const docId = event.currentTarget.dataset.id;
        this.updateDocumentStatus(docId, 'Approved');
    }

    handleReject(event) {
        this.currentDocumentId = event.currentTarget.dataset.id;
        this.showRejectModal = true;   // OPEN MODAL
    }

    refreshDocumentTable() {
        //return refreshApex(this.wiredClientResult);
        return this.fetchStaffImperatively();
    }

    handleCommentsChange(event) {
        this.comments = event.target.value;
    }

    handleRejectedClose() {
        this.showRejectModal = false;
        this.comments = '';
        this.currentDocumentId = '';
    }

    handleRejectSubmit() {
        if (!this.comments || this.comments.trim() === '') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please enter comments before submitting.',
                    variant: 'error'
                })
            );
            return;
        }

        // Update the document with rejected status + comments
        this.updateDocumentStatus(this.currentDocumentId, 'Rejected', this.comments);

        // Close modal and reset
        this.showRejectModal = false;
        this.comments = '';
    }

    handleRecordsPerPage(event) {
        this.pageSize = event.target.value;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    previousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    nextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    // JS function to handel pagination logic
    paginationHelper() {
        console.log("🟦================ PAGINATION HELPER START ================🟦");
        console.log("📊 Total Records:", this.totalRecords);
        console.log("📏 Page Size:", this.pageSize);
        console.log("🔢 Current Page Number:", this.pageNumber);

        // Calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        console.log("📘 Total Pages:", this.totalPages);

        // Validate page number
        if (this.pageNumber < 1) this.pageNumber = 1;
        if (this.pageNumber > this.totalPages) this.pageNumber = this.totalPages;

        // Calculate slice indexes
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = this.pageNumber * this.pageSize;

        console.log(`📌 Slice Range: start = ${start}, end = ${end}`);

        // Apply slice - this is what the table actually displays
        this.DocumentTableData = this.records.slice(start, end);

        console.log("📄 Records shown on UI:", this.DocumentTableData.length);
        console.log("📄 DocumentTableData:", JSON.parse(JSON.stringify(this.DocumentTableData)));
        console.log("🟩================ PAGINATION HELPER END =================🟩");
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

    normalizeTree(nodes) {
        if (!Array.isArray(nodes)) {
            return []; // Prevent crashes
        }

        return nodes.map(node => {
            const safeChildren = Array.isArray(node.children)
                ? this.normalizeTree(node.children)
                : [];

            return {
                ...node,
                children: safeChildren
            };
        });
    }

    // loadDocumentTypes() {
    //     getFacilityIdentityDocuments({
    //         facilityId: this.StaffFacility,
    //         staffId: this.staffId
    //     })
    //     .then(result => {
    //         console.log('DOCUMENTS FROM APEX:', result);
    //         // 🧑‍💼 STEP 1: Normalize staff roles
    //         const staffRolesNormalized = new Set(
    //             (this.clientData?.[0]?.activeRoles || [])
    //                 .map(r => r.trim().toLowerCase())
    //         );

    //         console.log(
    //             '🧑‍💼 Staff Roles (normalized):',
    //             [...staffRolesNormalized]
    //         );

    //         // 📄 STEP 2: Filter documents by role match
    //         const filteredDocuments = result.filter(doc => {
    //             if (!doc.roles) {
    //                 console.log(`🚫 Hiding "${doc.name}" — no roles defined`);
    //                 return false;
    //             }

    //             const docRolesNormalized = doc.roles
    //                 .split(';')
    //                 .map(r => r.trim().toLowerCase());

    //             console.group(`📄 Checking Document: ${doc.name}`);
    //             console.log('Document Roles:', docRolesNormalized);

    //             const hasMatch = docRolesNormalized.some(role =>
    //                 staffRolesNormalized.has(role)
    //             );

    //             console.log('✅ Display Document?', hasMatch);
    //             console.groupEnd();

    //             return hasMatch;
    //         });
    //         // Reset maps FIRST
    //         this.documentPointsMap = {};
    //         this.documentMetaMap = {};

    //         if (!Array.isArray(result) || result.length === 0) {
    //             console.log('No facility documents found.');
    //             this.dynamicDocumentTypes =
    //                 this.normalizeTree(this.getDefaultHierarchicalStructure());
    //             return;
    //         }

    //         // Build lookup maps from RESULT (single source of truth)
    //         filteredDocuments.forEach(d => {
    //             this.documentPointsMap[d.name] = Number(d.points) || 0;
    //             this.documentMetaMap[d.name] = d;
    //         });

    //         // SPLIT INTO COMPLIANCE CATEGORIES
    //         const identityDocs  = filteredDocuments.filter(d => d.complianceCategory === 'Identity');
    //         const documentDocs  = filteredDocuments.filter(d => d.complianceCategory === 'Documents');
    //         const trainingDocs  = filteredDocuments.filter(d => d.complianceCategory === 'Trainings');

    //         // GROUP IDENTITY (PRIMARY / SECONDARY / OTHER)
    //         const groupedIdentity = { Primary: [], Secondary: [], Other: [] };

    //         identityDocs.forEach(doc => {
    //             const category = doc.category || 'Other';
    //             groupedIdentity[category].push(doc);
    //         });

    //         // ROOT NODES
    //         const hierarchicalOptions = [
    //             {
    //                 id: '100-points-id',
    //                 label: '100 Points of ID',
    //                 value: '100-points-id',
    //                 children: []
    //             },
    //             {
    //                 id: 'facility-documents',
    //                 label: 'Documents',
    //                 value: 'facility-documents',
    //                 children: []
    //             },
    //             {
    //                 id: 'training-docs',
    //                 label: 'Training Documents',
    //                 value: 'training-docs',
    //                 children: []
    //             }
    //         ];

    //         // PRIMARY IDENTITY
    //         hierarchicalOptions[0].children.push({
    //             id: 'primary-identity',
    //             label: 'Primary Identity Documents',
    //             value: 'primary-identity',
    //             children: groupedIdentity.Primary.length
    //                 ? groupedIdentity.Primary.map(doc => ({
    //                     id: `id-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    //                     label: `${doc.name} (${doc.points} points)`,
    //                     value: doc.name,
    //                     points: doc.points,
    //                     children: []
    //                 }))
    //                 : [{
    //                     id: 'no-primary',
    //                     label: 'No Documents Available',
    //                     value: 'no-primary',
    //                     disabled: true,
    //                     children: []
    //                 }]
    //         });

    //         // SECONDARY IDENTITY
    //         hierarchicalOptions[0].children.push({
    //             id: 'secondary-identity',
    //             label: 'Secondary Identity Documents',
    //             value: 'secondary-identity',
    //             children: groupedIdentity.Secondary.length
    //                 ? groupedIdentity.Secondary.map(doc => ({
    //                     id: `id-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    //                     label: `${doc.name} (${doc.points} points)`,
    //                     value: doc.name,
    //                     points: doc.points,
    //                     children: []
    //                 }))
    //                 : [{
    //                     id: 'no-secondary',
    //                     label: 'No Documents Available',
    //                     value: 'no-secondary',
    //                     disabled: true,
    //                     children: []
    //                 }]
    //         });

    //         // DOCUMENTS
    //         hierarchicalOptions[1].children = documentDocs.length
    //             ? documentDocs.map(doc => ({
    //                 id: `doc-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    //                 label: doc.name,
    //                 value: doc.name,
    //                 children: []
    //             }))
    //             : [{
    //                 id: 'no-docs',
    //                 label: 'No Documents Available',
    //                 value: 'no-docs',
    //                 disabled: true,
    //                 children: []
    //             }];

    //         // TRAININGS
    //         hierarchicalOptions[2].children = trainingDocs.length
    //             ? trainingDocs.map(doc => ({
    //                 id: `training-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    //                 label: doc.name,
    //                 value: doc.name,
    //                 children: []
    //             }))
    //             : [{
    //                 id: 'no-trainings',
    //                 label: 'No Training Documents Available',
    //                 value: 'no-trainings',
    //                 disabled: true,
    //                 children: []
    //             }];

    //         this.dynamicDocumentTypes =
    //             this.normalizeTree(hierarchicalOptions);

    //         console.log(
    //             'FINAL STRUCTURE:',
    //             JSON.stringify(this.dynamicDocumentTypes, null, 2)
    //         );
    //     })
    //     .catch(error => {
    //         console.error('Error loading facility documents:', error);
    //         this.dynamicDocumentTypes =
    //             this.normalizeTree(this.getDefaultHierarchicalStructure());
    //     });
    // }

    loadDocumentTypes() {
       console.log('🚀 loadDocumentTypesForFacility CALLED');
        const facilityIds = Array.isArray(this.StaffFacility)
            ? this.StaffFacility
                .map(f => (typeof f === 'string' ? f : f.value))
                .filter(Boolean)
            : [this.StaffFacility];

        console.log('✅ Facility IDs sent to Apex:', facilityIds);
        console.log('👤 staffId:', this.staffId);

        if (!facilityIds.length || !this.staffId) {
            console.warn('❌ Missing facilityIds or staffId');
            return;
        }

        getFacilityIdentityDocuments({
            facilityId: facilityIds,
            staffId: this.staffId
        })
            .then(result => {
                console.log('📦 Apex returned:', result);
                console.log('📦 Result type:', typeof result);
                console.log('📦 Result length:', result?.length);

                if (!Array.isArray(result) || result.length === 0) {
                    console.warn('⚠️ Apex returned EMPTY document list');
                    this.dynamicDocumentTypes =
                        this.buildHierarchicalFromFacility([]);
                    return;
                }

                this.documentPointsMap = {};
                this.documentMetaMap = {};

                this.dynamicDocumentTypes =
                    this.buildHierarchicalFromFacility(result);

                console.log(
                    '🌳 Final hierarchy:',
                    JSON.stringify(this.dynamicDocumentTypes, null, 2)
                );
            })
            .catch(error => {
                console.error('🔥 Apex call failed:', error);
                this.dynamicDocumentTypes =
                    this.buildHierarchicalFromFacility([]);
            });
    }

    buildHierarchicalFromFacility(result) {
        const withMandatoryMark = (doc, baseLabel) =>
        doc.mandatory === true ? `${baseLabel} *` : baseLabel;
        if (!Array.isArray(result)) return [];

        // ---------------------------------------
        // SPLIT BY COMPLIANCE CATEGORY
        // ---------------------------------------
        const identityDocs = result.filter(d => d.complianceCategory === 'Identity');
        const documentDocs = result.filter(d => d.complianceCategory === 'Documents');
        const trainingDocs = result.filter(d => d.complianceCategory === 'Trainings');

        // ---------------------------------------
        // GROUP IDENTITY (PRIMARY / SECONDARY / OTHER)
        // ---------------------------------------
        const groupedIdentity = {
            Primary: [],
            Secondary: [],
            Other: []
        };

        identityDocs.forEach(doc => {
            const category =
                doc.category && (doc.category === 'Primary' || doc.category === 'Secondary')
                    ? doc.category
                    : 'Other';

            groupedIdentity[category].push(doc);

            // Build lookup maps
            this.documentPointsMap[doc.name] = Number(doc.points) || 0;
            this.documentMetaMap[doc.name] = doc;
        });

        // ---------------------------------------
        // ROOT NODES
        // ---------------------------------------
        const hierarchy = [
            {
                id: '100-points-id',
                label: '100 Points of ID',
                value: '100-points-id',
                children: []
            },
            {
                id: 'facility-documents',
                label: 'Documents',
                value: 'facility-documents',
                children: []
            },
            {
                id: 'training-docs',
                label: 'Training Documents',
                value: 'training-docs',
                children: []
            }
        ];

        // ---------------------------------------
        // IDENTITY SECTIONS
        // ---------------------------------------
        const identitySections = [];

        // ---------- PRIMARY ----------
        identitySections.push({
            id: 'primary-identity',
            label: 'Primary Identity Documents',
            value: 'primary-identity',
            children: groupedIdentity.Primary.length
                ? groupedIdentity.Primary.map(doc => ({
                    id: `id-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    points: doc.points || 0,
                    children: []
                }))
                : [{
                    id: 'no-primary',
                    label: 'No Documents Available',
                    value: 'no-primary',
                    disabled: true,
                    children: []
                }]
        });

        // ---------- SECONDARY ----------
        identitySections.push({
            id: 'secondary-identity',
            label: 'Secondary Identity Documents',
            value: 'secondary-identity',
            children: groupedIdentity.Secondary.length
                ? groupedIdentity.Secondary.map(doc => ({
                    id: `id-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    points: doc.points || 0,
                    children: []
                }))
                : [{
                    id: 'no-secondary',
                    label: 'No Documents Available',
                    value: 'no-secondary',
                    disabled: true,
                    children: []
                }]
        });

        // ---------- 🔥 OTHER (FIXED & ADDED) ----------
        identitySections.push({
            id: 'other-identity',
            label: 'Other Identity Documents',
            value: 'other-identity',
            children: groupedIdentity.Other.length
                ? groupedIdentity.Other.map(doc => ({
                    id: `id-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    points: doc.points || 0,
                    children: []
                }))
                : [{
                    id: 'no-other',
                    label: 'No Documents Available',
                    value: 'no-other',
                    disabled: true,
                    children: []
                }]
        });

        hierarchy[0].children = identitySections;

        // ---------------------------------------
        // DOCUMENTS SECTION
        // ---------------------------------------
        hierarchy[1].children = documentDocs.length
            ? documentDocs.map(doc => {
                this.documentPointsMap[doc.name] = Number(doc.points) || 0;
                this.documentMetaMap[doc.name] = doc;

                return {
                    id: `doc-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    //label: doc.name,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    children: []
                };
            })
            : [{
                id: 'no-docs',
                label: 'No Documents Available',
                value: 'no-docs',
                disabled: true,
                children: []
            }];

        // ---------------------------------------
        // TRAINING SECTION
        // ---------------------------------------
        hierarchy[2].children = trainingDocs.length
            ? trainingDocs.map(doc => {
                this.documentPointsMap[doc.name] = Number(doc.points) || 0;
                this.documentMetaMap[doc.name] = doc;

                return {
                    id: `training-${doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                    //label: doc.name,
                    label: withMandatoryMark(doc, doc.name) + (doc.points ? ` (${doc.points} points)` : ''),
                    value: doc.name,
                    children: []
                };
            })
            : [{
                id: 'no-trainings',
                label: 'No Training Documents Available',
                value: 'no-trainings',
                disabled: true,
                children: []
            }];

        return hierarchy;
    }

    normalizeTree(nodes) {
        if (!Array.isArray(nodes)) {
            return []; // Prevent crashes
        }

        return nodes.map(node => {
            const safeChildren = Array.isArray(node.children)
                ? this.normalizeTree(node.children)
                : [];

            return {
                ...node,
                children: safeChildren
            };
        });
    }

    // Helper method to sanitize IDs
    sanitizeId(text) {
        if (!text) return 'undefined';
        return text.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // getDefaultHierarchicalStructure() {
    //     return [
    //         {
    //             id: '100-points-id',
    //             label: '100 Points of ID',
    //             value: '100-points-id',
    //             children: [
    //                 {
    //                     id: 'primary-identity-default',
    //                     label: 'Primary Identity Documents',
    //                     value: 'primary-identity-default',
    //                     parent: '100-points-id',
    //                     children: [
    //                         { id: 'passport', label: 'Passport (70 points)', value: 'Passport', parent: 'primary-identity-default', children: [] },
    //                         { id: 'drivers-license', label: 'Drivers License (40 points)', value: 'Drivers License', parent: 'primary-identity-default', children: [] }
    //                     ]
    //                 },
    //                 {
    //                     id: 'secondary-identity-default',
    //                     label: 'Secondary Identity Documents',
    //                     value: 'secondary-identity-default',
    //                     parent: '100-points-id',
    //                     children: [
    //                         { id: 'medicare', label: 'Medicare Card (25 points)', value: 'Medicare Card', parent: 'secondary-identity-default', children: [] },
    //                         { id: 'bank-card', label: 'Bank Card (25 points)', value: 'Bank Card', parent: 'secondary-identity-default', children: [] }
    //                     ]
    //                 }
    //             ]
    //         },
    //         {
    //             id: 'other-docs',
    //             label: 'Other Documents',
    //             value: 'other-docs',
    //             children: [
    //                 { id: 'wwcc', label: 'Working With Children Check (WWCC)', value: 'Working With Children Check (WWCC)', parent: 'other-docs', children: [] },
    //                 { id: 'ndis-screening', label: 'NDIS Worker Screening', value: 'NDIS Worker Screening', parent: 'other-docs', children: [] },
    //                 { id: 'ndis-orientation', label: 'NDIS Worker Orientation Certificate', value: 'NDIS Worker Orientation Certificate', parent: 'other-docs', children: [] },
    //                 { id: 'code-of-conduct', label: 'Signed Code of Conduct', value: 'Signed Code of Conduct', parent: 'other-docs', children: [] },
    //                 { id: 'infection-training', label: 'Infection Control Training', value: 'Infection Control Training', parent: 'other-docs', children: [] },
    //                 { id: 'first-aid', label: 'First Aid Certificate', value: 'First Aid Certificate', parent: 'other-docs', children: [] },
    //                 { id: 'police-check', label: 'Police Check', value: 'Police Check', parent: 'other-docs', children: [] },
    //                 { id: 'Qualifications', label: 'Qualifications', value: 'Qualifications', parent: 'other-docs', children: [] }
    //             ]
    //         }
    //     ];
    // }

    handleDocumentSelect(event) {
        const docName = event.detail.value;
        const points = this.documentPointsMap[docName] || 0;

        this.selectedDocument = docName;
        this.points = points; // ✅ NOW POPULATES CORRECTLY
    }

    buildDocumentMaps(options = []) {
        const walk = (nodes) => {
            nodes.forEach(n => {
                if (n.value) {
                    this.documentPointsMap[n.value] = Number(n.points) || 0;
                    this.documentMetaMap[n.value] = n;
                }
                if (n.children && n.children.length) {
                    walk(n.children);
                }
            });
        };
        walk(options);
    }

    handleOptionSelect(event) {
        const selectedValue = event.currentTarget.dataset.value;

        this.dispatchEvent(
            new CustomEvent('change', {
                detail: {
                    value: selectedValue,
                    index: this.dataset.index
                },
                bubbles: true,
                composed: true
            })
        );
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
    this.selectedEmploymentRoleDisplayVlaue=selectedOption.displaylabel;
    this.latestSelctedRoleAndFacility=this.selectedEmploymentRole+'-'+this.selectedDropDownFacilityValue;
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
     this.fetchDropdownRoleWithRates();
}

    debugRoleMatching(docRoles = []) {
        if (!this.clientData || !this.clientData.length) {
            console.warn(
                '⚠️ debugRoleMatching skipped — clientData not ready yet'
            );
            return false;
        }

        const staffRoles = this.clientData[0].activeRoles || [];
        const normalizedDocRoles = docRoles.map(r => r.trim().toLowerCase());

        console.group('🔍 ROLE MATCH DEBUG (LWC)');
        console.log('Staff Active Roles:', staffRoles);
        console.log('Document Roles:', docRoles);

        let hasMatch = false;
        let matchedRole = null;

        staffRoles.forEach(staffRole => {
            const normalizedStaffRole = staffRole.trim().toLowerCase();

            console.log(
                '➡️ Checking staff role:',
                staffRole,
                '→ normalized:',
                normalizedStaffRole
            );

            if (normalizedDocRoles.includes(normalizedStaffRole)) {
                console.log('✅ MATCH FOUND:', staffRole);
                hasMatch = true;
                matchedRole = staffRole;
            } else {
                console.log('❌ No match for:', staffRole);
            }
        });

        console.log('🏁 Final hasMatch:', hasMatch);
        console.log('🎯 Matched Role:', matchedRole);
        console.groupEnd();

        return hasMatch;
    }
    
    validateExpiryDate() {
        let isValid = true;

        console.log('uploadedfiles', this.uploadedFiles);

        this.uploadedFiles = this.uploadedFiles.map(file => {
            if (file.isExpiryRequired && !file.staffExpirydate) {
                isValid = false;
                return {
                    ...file,
                    errorMessage: 'Expiry Date is required for this document.'
                };
            }
            return {
                ...file,
                errorMessage: ''
            };
        });

        return isValid;
    }

    fetchRoleOptions() {
            getRoleOptionsByFacility({
                facilityIdList: this.selctedMultipleFcailityValues
            })
                .then(result => {
                    console.log('Role options received:', JSON.stringify(result));

                    // Ensure existing array is preserved
                 this.roleoptionsforFacility = (this.roleoptionsforFacility || []).filter( role =>this.selctedMultipleFcailityValues.includes(role.facilityValue));


                    // Build lookup of existing role+facility combinations
                    const existingKeySet = new Set(
                        this.roleoptionsforFacility.map(
                            r => `${r.value}-${r.facilityValue}`
                        )
                    );

                    // Prepare only NEW role records
                    const newRoleOptions = result
                        .filter(role => {
                            const key = `${role.Role_Name__c}-${role.Facility__c}`;
                            return !existingKeySet.has(key);
                        })
                        .map((role, index) => {
                            const isActive =
                                this.selectedRoleValues?.includes(role.Role_Name__c) || false;

                            return {
                                id: index.toString(), // stable id
                                label: role.Role_Name__c,
                                value: role.Role_Name__c,
                                facilityValue: role.Facility__c,
                                facilityName: role.Facility__r.Name,
                                displaylabel:
                                    role.Role_Name__c + '-' + role.Facility__r.Name,
                                checked: isActive,
                                isActive: isActive,
                                statusText: isActive ? 'Active' : 'Inactive',
                                badgeClass: this.getBadgeClass(isActive),
                                buttonClassRoles: this.getOptionButtonClassRoles(isActive),
                                isDisabled: !isActive,
                                typeOfService: role.Facility__r.Type_of_Service__c,
                                isPrimary: false,
                            };
                        });

                    // 🔹 Append to existing data (DO NOT overwrite)
                    this.roleoptionsforFacility = [
                        ...this.roleoptionsforFacility,
                        ...newRoleOptions
                    ];

                    console.log(
                        'roleoptionsforFacility (merged):',
                        JSON.stringify(this.roleoptionsforFacility)
                    );
                })
                .catch(error => {
                    console.error('Error fetching role options:', error);
                });
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

        handleLoad(event) {
            const record = event.detail.records;
            const recordId = Object.keys(record)[0];
            const fields = record[recordId].fields;

            const firstName = fields.Name__c ? fields.Name__c.value : null;

            this.isFirstNameEntered = !!(firstName && firstName.trim());
        }

}