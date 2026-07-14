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
import checkFutureShifts from '@salesforce/apex/StaffController.checkFutureShifts';
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
import isStaffLimitReached from '@salesforce/apex/LimitCheckService.isStaffLimitReached';

// Percentages
import PERCENT_ONE from '@salesforce/label/c.SCHADS_BrokenShift_1_Break_Percent';
import PERCENT_TWO from '@salesforce/label/c.SCHADS_BrokenShift_2_Break_Percent';
import fetchStaffPaginatedData from '@salesforce/apex/AdminPaginationController.fetchStaffPaginatedData';
import saveStaffContacts from '@salesforce/apex/StaffContactController.saveStaffContacts';
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";

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
    pageSize=12; //No.of records to be displayed per page
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

    @track selectedRoleValues = [];
    @track selectedPrimaryRole = '';
    @track selectedRoleEmploymentValues = [];
    @track selectedRoleValueLabels = [];

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

    @track shiftDatesMessage = '';
    @track hasFutureShifts = false;
    @track showUpgradeModal = false;


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

    @track toggleValue = false;

    @track contactList = [
        {
            id: Date.now(),
            recordId: null,

            firstName: '',
            lastName: '',
            relationship: '',   // ✅ NEW
            contactNumber: '',
            email: '',
            contactType: '',
            notify: false,

            // ✅ Placeholders
            firstNamePlaceholder: 'Enter First Name',
            lastNamePlaceholder: 'Enter Last Name',
            relationshipPlaceholder: 'Enter Relationship', // ✅ NEW
            phonePlaceholder: 'Enter Contact Number',
            emailPlaceholder: 'Enter Email Address',

            showAdd: true,
            addButtonClass: 'add-visible'
        }
    ];

    @track contactTypeOptions = [
        { label: 'Emergency', value: 'Emergency' },
        { label: 'Add New', value: 'Add New Contact Type' }
    ];

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
    @api staffWyzedId

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

@track createCurrentStep = 'createstep1';

get step1Class() {
    return this.createCurrentStep === 'createstep1' ? '' : 'slds-hide';
}
get step2Class() {
    return this.createCurrentStep === 'createstep2' ? '' : 'slds-hide';
}
get step3Class() {
    return this.createCurrentStep === 'createstep3' ? '' : 'slds-hide';
}
get step4Class() {
    return this.createCurrentStep === 'createstep4' ? '' : 'slds-hide';
}

// BUTTON CONTROL
get showPrevious() {
    return this.createCurrentStep !== 'createstep1';
}
get showNext() {
    return this.createCurrentStep !== 'createstep4';
}
get showSave() {
    return this.createCurrentStep === 'createstep4';
}
// get showSkip() {
//     return this.createCurrentStep === 'createstep3';
// }

// NAVIGATION
handleCreateNext() {

    const missingFields = this.validateAndGetMissingFields();

    if (missingFields.length > 0) {

        const uniqueFields = [...new Set(missingFields)];

        this.showError(`Please fill required fields: ${uniqueFields.join(', ')}`);
        return;
    }

    // ✅ move next
    if (this.createCurrentStep === 'createstep1') {
        this.createCurrentStep = 'createstep2';
    } else if (this.createCurrentStep === 'createstep2') {
        this.createCurrentStep = 'createstep3';
    } else if (this.createCurrentStep === 'createstep3') {
        this.createCurrentStep = 'createstep4';
    }
}

handleCreatePrevious() {
    if (this.createCurrentStep === 'createstep4') this.createCurrentStep = 'createstep3';
    else if (this.createCurrentStep === 'createstep3') this.createCurrentStep = 'createstep2';
    else if (this.createCurrentStep === 'createstep2') this.createCurrentStep = 'createstep1';
}

// ⭐ SKIP STEP 3
handleSkipStep3() {
    this.createCurrentStep = 'createstep4';
}  

    // ✅ ADD HERE (anywhere inside class, best near top or near other helpers)
    showError(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );
    }


/* handleCreateStepClick(event) {
    const targetStep = event.target.value;

    const stepOrder = {
        createstep1: 1,
        createstep2: 2,
        createstep3: 3,
        createstep4: 4
    };

    const current = stepOrder[this.createCurrentStep];
    const target = stepOrder[targetStep];

    // Prevent skipping ahead
    if (target > current + 1) {
        const missingFields = this.validateAndGetMissingFields();

        if (missingFields.length > 0) {
            const uniqueFields = [...new Set(missingFields)];

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: `Please fill required fields: ${uniqueFields.join(', ')}`,
                    variant: 'error'
                })
            );
        }
        return;
    }

    // Validate current step before moving forward
    if (target > current) {
        const missingFields = this.validateAndGetMissingFields();

        if (missingFields.length > 0) {
            const uniqueFields = [...new Set(missingFields)];

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: `Please fill required fields: ${uniqueFields.join(', ')}`,
                    variant: 'error'
                })
            );
            return;
        }
    }

    // allow backward / valid forward
    this.createCurrentStep = targetStep;
}  */ 

handleCreateStepClick(event) {
    const targetStep = event.target.value;
 
    const stepOrder = {
        createstep1: 1,
        createstep2: 2,
        createstep3: 3,
        createstep4: 4,
        createstep5: 5
    };
 
    const current = stepOrder[this.createCurrentStep];
    const target = stepOrder[targetStep];
 
    // ✅ Allow free backward navigation
    if (target <= current) {
        this.createCurrentStep = targetStep;
        return;
    }
 
    // ✅ Moving FORWARD: validate ALL steps between current and target
    const stepKeys = Object.keys(stepOrder); // ['createstep1','createstep2',...]
 
    for (let i = current; i < target; i++) {
        const stepToValidate = stepKeys[i - 1]; // stepOrder is 1-indexed, array is 0-indexed
        const missingFields = this.validateAndGetMissingFields(stepToValidate);
 
        if (missingFields && missingFields.length > 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: `Step ${i} - Missing Required Fields`,
                    message: `Please fill required fields: ${missingFields.join(', ')}`,
                    variant: 'error'
                })
            );
            // Navigate user to the failing step
            this.createCurrentStep = stepToValidate;
            return;
        }
    }
 
    // ✅ All intermediate steps passed → allow the jump
    this.createCurrentStep = targetStep;
}

// handleEscKey(event) {
//     if (event.key === 'Escape') {
//         this.handleeditClose();
//     }
// }

    

    closeUpgradeModal() {
    this.showUpgradeModal = false;
}

handleUpgradeClick() {
    window.location.href = 'mailto:sales@yourcompany.com?subject=Upgrade%20Request';
    this.closeUpgradeModal();
}

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
@track refreshKey = 0;
@track isShowSpinner=false;
hasSuperFund = false;
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
         this.setPageSizeByZoomAndScreen(); 
        this._handleOutsideClick = this.handleClickOutside.bind(this);
        window.addEventListener('click', this._handleOutsideClick);
        console.log('whatid from task'+this.whatId);
        this.StaffFacility = localStorage.getItem("defaultFacilityId") || "";
        this.fetchFacility(this.StaffFacility);


        console.log('Staff Facility ===>', this.StaffFacility);
        this.fetchRoleOptions();
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

             console.log('xeroStaffEmail after :', this.xeroStaffEmail);
            this.cardFlag = false;
            this.listFlag = false;
            this.adminFlag =false;
            this.visible = false;
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
       console.log('Languages>>', this.Languages);

            getCurrentLoggedUserInfo()
                .then(userData => {
                    console.log('user data ==>' + JSON.stringify(userData));

                    let userType = userData.User_Type__c;

                    if (userType == 'NDIS Org Admin' || userType == 'ICT Admin') {

                        return getFacilityData().then(response => {
                            console.log('Facility data fetched successfully:', response);

                            this.finalListFacilities = [];
                            this.selectedFacilities = [];

                            this.facilityOptions = response.map(record => ({
                                label: record.Name,
                                value: record.Id,
                                preferredName: record.Facility_Preferred_Name_Formula__c
                            }));

                            this.finalListFacilities = this.facilityOptions;
                        });

                    } else if (userType == 'Facility Admin' || userType == 'HR Admin' || userType == 'NDIS Lead') {

                        return getFacilityCurrentUser().then(result => {
                            console.log('getFacilityCurrentUser facility ' + JSON.stringify(result));

                            this.finalListFacilities = result.map(record => ({
                                label: record.Facility__r.Name,
                                value: record.Facility__r.Id
                            }));
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
    // this.handleEscKey = this.handleEscKey.bind(this);
    // window.addEventListener('keydown', this.handleEscKey);                 
                                                                  
         
    }

    @wire(fetchStaffPaginatedData, {
        searchText: '$searchName',
        facilityId: '$StaffFacility',
        pageSize: '$pageSize',
        pageNumber: '$pageNumber',
        isActive: '$isActive',
        refreshKey: '$refreshKey'
    })
    wiredStaff(result) {
        this.refreshTable = result;

        if (result.data) {

            this.isShowSpinner = true;

            // 🔥 reset JSON map
            this.satffDataJasonformat = {};

            // ✅ SINGLE LOOP (map + JSON build)
            const finalData = (result.data.records || []).map(rec => {

                const status = rec.Staff_Status__c;

                // 🔥 build JSON map (moved from forEach)
                this.satffDataJasonformat[rec.Id] = {
                    street: rec.Address__Street__s,
                    city: rec.Address__City__s,
                    stateCode: rec.Address__StateCode__s,
                    countryCode: rec.Address__CountryCode__s,
                    postalCode: rec.Address__PostalCode__s,
                    childRecords: rec.Child_Staffs__r,

                    preTaxvalue: rec.Pre_Tax_Calculator__c,
                    pretaxone: rec.Pre_Tax_One_Value__c,
                    pretaxtwo: rec.Pre_Tax_Two_Value__c,
                    pretaxThree: rec.Pre_Tax_Three_Value__c,
                    pretaxFour: rec.Pre_Tax_Four_Value__c,
                    pretaxFive: rec.Pre_Tax_Five_Value__c,

                    postTax: rec.Post_Tax__c,
                    primaryVal: rec.Make_Primary_as_Approver__c,
                    secondaryVal: rec.Make_Secondary_as_Approver__c,

                    voluntaryContribution: rec.Voluntary_Contribution__c,
                    ContributionCurrency: rec.Voluntary_Contribution_Fixed__c,
                    ContributionPercent: rec.Voluntary_Contribution_Percent__c,
                    ContributionNone: rec.Voluntary_Contribution_None__c,

                    status: rec.Status__c,
                    Nickname: rec.Display_Nickname__c
                };

                // 🔥 return UI record (existing logic unchanged)
                return {
                    ...rec,

                    activeRoles: rec.StaffRoles__r
                        ? rec.StaffRoles__r.map(r => r.RoleName__c)
                        : [],

                    activeRolesDisplay:
                        rec.StaffRoles__r && rec.StaffRoles__r.length > 0
                            ? rec.StaffRoles__r.map(r => r.RoleName__c).join(', ')
                            : '',

                    activeFaciltyDisplay:
                        rec.Staff_Facilities__r && rec.Staff_Facilities__r.length > 0
                            ? rec.Staff_Facilities__r
                                .map(f => f.Facility__r?.Name)
                                .filter(Boolean)
                                .join(', ')
                            : '',

                    statusClass:
                        status === 'Active'
                            ? 'status-pill staff-active'
                            : status === 'Inactive'
                                ? 'status-pill staff-inactive'
                                : 'status-pill',

    initials: this.getInitials(rec.DisplayNicknamec || rec.Name || rec.NameToDisplayc),
    avatarColor: this.getAvatarClass(rec.DisplayNicknamec || rec.Name || rec.NameToDisplayc)
                };
            });

            console.log('RESULT--> ' + JSON.stringify(finalData));

            // ✅ Assign
            this.records = finalData;
            this.recordsToDisplay = finalData;

            this.totalRecords = result.data.totalRecords;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

            this.noRecordsFlag = this.totalRecords === 0;
            this.visible = this.totalRecords > 9;

            const storedStaffId = localStorage.getItem('adminStaffRecordId');

            if (storedStaffId && this.satffDataJasonformat[storedStaffId]) {
                console.log('Loading staff data for storedStaffId:', storedStaffId);
                this.loadStaffData(storedStaffId);
            } else {
                console.log('No stored staff ID or data found in satffDataJasonformat');
            }

            setTimeout(() => {
                this.isShowSpinner = false;
            }, 500);

        } else if (result.error) {

            this.isShowSpinner = false;
            console.error(result.error);
        }
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

    const result = roles
        .map(role => role.displaylabel)
        .join(', ');

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
            // this.selectedRoleValues = this.selectedRoleValues || [];         
            this.selectedRoleValues = [...this.selectedRoleValues];     

            //this.selectedRoleValues = result.slice(); 
            // Build enhanced option objects (with toggle + badge)
            this.roleoptionsforFacility = result.map((role, index) => {
                // const isActive = this.selectedRoleValues.includes(role);
                    // const isActive = this.selectedRoleValues?.includes(
                    //     role.Role_Name__c + '-' + role.Facility__r.Name
                    // );

                const key = role.Role_Name__c + '-' + role.Facility__r.Name;

                const isActive = (this.selectedRoleValues || []).some(
                    r => r.displaylabel === key
                );                    
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

    this.updateEmploymentRoles();
}





setPageSizeByZoomAndScreen() {
    let zoomLevel = Math.round(window.devicePixelRatio * 100);
    const userAgent = navigator.userAgent;
    const isMac = /Mac|Macintosh/i.test(userAgent);
    const isWindows = /Windows/i.test(userAgent);
    const screenHeight = window.innerHeight;

    if (isMac && zoomLevel >= 190 && zoomLevel <= 210) {
        zoomLevel = 100;
    }

    let newPageSize;

    if (isMac) {
        if (zoomLevel <= 180) {
            newPageSize = 16;
        } else if (zoomLevel <= 250) {
            newPageSize = 12;
        } else {
            newPageSize = 8;
        }

        if (screenHeight < 700 && zoomLevel > 250) {
            newPageSize = 8;
        }

    } else if (isWindows) {
        if (zoomLevel <= 100) {
            newPageSize = 16;
        } else if (zoomLevel <= 125) {
            newPageSize = 12;
        } else {
            newPageSize = 8;
        }

        if (screenHeight < 800 && newPageSize > 12) {
            newPageSize = 12;
        }

    } else {
        if (zoomLevel <= 110) {
            newPageSize = 16;
        } else if (zoomLevel <= 250) {
            newPageSize = 12;
        } else {
            newPageSize = 8;
        }
    }

    // 🔥 IMPORTANT: Only update if changed
    if (this.pageSize !== newPageSize) {
        this.pageSize = newPageSize; // triggers wire only once
    }

    this.visible = true;
}

    handleResize() {
        const oldSize = this.pageSize;

        this.setPageSizeByZoomAndScreen();

        if (this.pageSize !== oldSize) {
            this.pageNumber = 1; // 🔥 IMPORTANT (reset page)

            this.isShowSpinner = true; // optional UX

            this.refreshKey++; // 🔥 FORCE WIRE RE-RUN
        }
    }
    handleStaffIdChange(event) {
        this.recordId = event.detail.staffId;        
        console.log('Child received staffId:', this.recordId);
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
        // window.removeEventListener('keydown', this.handleEscKey);

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

    filterState = 'All';
    @track filteredRecords = [];
   
      nextPage() {
            this.pageNumber++;
        }

        previousPage() {
            this.pageNumber--;
        }

        firstPage() {
            this.pageNumber = 1;
        }

        lastPage() {
            this.pageNumber = this.totalPages;
        }

        handleRecordsPerPage(event) {
            this.pageSize = parseInt(event.target.value, 10);
            this.pageNumber = 1;
        }
        updateButtons() {
            this.bDisableFirst = this.pageNumber <= 1;
            this.bDisableLast = this.pageNumber >= this.totalPages;
        }
        get bDisableFirst() {
        return this.pageNumber <= 1;
        }

        get bDisableLast() {
        return this.pageNumber >= this.totalPages;
        }
    
   
    @track adminFlag = true;
    async handleCreateNewStaff() {
        this.createCurrentStep = 'createstep1';
        

    console.log('Checking staff limit...');

    try {
        const limitReached = await isStaffLimitReached();
        console.log('Limit reached:', limitReached);

        // 🔴 STOP if limit reached
        if (limitReached) {
            console.log('Limit reached:', limitReached);
            this.showUpgradeModal = true;
            console.log('Limit showUpgradeModal:', this.showUpgradeModal );
            return;
        }

        // ✅ CONTINUE NORMAL FLOW (NO ELSE)
        this.StaffFacility = localStorage.getItem("defaultFacilityId") || "";
        console.log('Staff Facility ===>', this.StaffFacility);

        this.fieldErrorMap = {};
        this.recordId ='';
        this.street ='';
        this.city ='';
        this.country ='';
        this.province ='';
        this.postalcode ='';
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
        this.isSchadsAwards=false;
        this.isNursingAwards=false;
        this.isChildCareAwards=false;
        this.superannuationValue = 'Exclude Superannuation';
        this.applyAllowanceLogic();

        this.paidBreak=true;

        this.ictUserType = (this.typeOfUser === 'ICT User');

        this.geoLocationStatus=false;

        this.Nationality = '';
        this.filteredOptions = this.allNationalities.map(n => ({ label: n, value: n }));
        this.noResults = false;

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
        this.selctedMultipleFcailityValues=[];
        this.selectedDropDownFacilityValue='';
        this.selectedEmploymentRoleDisplayVlaue='';
        this.toggleValue=true;
        this.fetchRoleOptions();
        this.fetchMultiFaciltyOptions();

        if (this.createStaffForXeroOnly || this.createStaffForXeroAll) {
            this.emailId = this.xeroStaffEmail || '';
        } else {
            this.emailId = '';
        }

    } catch (error) {
        console.error('Error calling Apex:', error);

        this.showToast(
            'Error',
            'Something went wrong while checking limit.',
            'error'
        );

        if (this.createStaffForXeroOnly || this.createStaffForXeroAll) {
            this.dispatchEvent(new CustomEvent('backtoxero', {
                bubbles: true,
                composed: true
            }));
        }
    }
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
        this.isMultiStaffUpload = false;
      //  refreshApex(this.refreshTable);    
         this.refreshKey++; 
    }   

    handlePreTaxChange(event){        
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


   
        jobTypeOptions = [
       /*  { label: 'Full-time and part-time', value: 'Full-time and part-time' }, */
      
        { label: 'Full-time', value: 'Full-time' },
        { label: 'Part-time', value: 'Part-time' },
        { label: 'Casual', value: 'Casual' },
        { label: 'Contract', value: 'Contract' },
    ];
    schadsCategoryOptions = [
        { label: 'Social and community services employee', value: 'Social and community services employee' },
        { label: 'Crisis accommodation employee', value: 'Crisis accommodation employee' },
        { label: 'Family day care employee', value: 'Family day care employee' },
        { label: 'Home care employee-Disability care', value: 'Home care employee' }
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
        { label: 'Occupational Health Nurse - level 3', value: 'Occupational Health Nurse - level 3' },//Chef
        { label: 'AIN Level 2', value: 'AIN Level 2' },
        { label: 'AIN Level 3', value: 'AIN Level 3' },
        { label: 'Chef Level 5', value: 'Chef Level 5' },
        { label: 'Chef', value: 'Chef' },
        { label: 'Ajit Level 1', value: 'Ajit Level 1' },
        { label: 'Catering Assistant Level 3', value: 'Catering Assistant Level 3' },
        { label: 'Cleaner Level 3', value: 'Cleaner Level 3' },
        { label: 'Enrolled Nurse 1', value: 'Enrolled Nurse 1' },
        { label: 'Enrolled Nurse 2', value: 'Enrolled Nurse 2' },
        { label: 'Enrolled Nurse 3', value: 'Enrolled Nurse 3' },
        { label: 'Registered Nurse 1 to 3 years', value: 'Registered Nurse 1 to 3 years' },
        { label: 'Registered Nurse 2', value: 'Registered Nurse 2' },
        { label: 'Registered Nurse 4 to 7 years', value: 'Registered Nurse 4 to 7 years' },
        { label: 'Registered Nurse 8 years', value: 'Registered Nurse 8 years' },
        { label: 'ICU - Calvery Rate', value: 'ICU - Calvery Rate' }        
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
        { label: 'Grade 6', value: 'Grade 6' },
        { label: 'No Cert / pay point 1', value: 'No Cert / pay point 1' },
        { label: 'Cert III', value: 'Cert III' }
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

    for (let i = 0; i < this.contactList.length; i++) {

            const row = this.contactList[i];

            const firstName = row.firstName ? row.firstName.trim() : '';
            const phoneRaw = row.contactNumber ? row.contactNumber.toString() : '';
            const email = row.email ? row.email.trim() : '';

            // 🔹 Clean phone
            const phone = phoneRaw.replace(/\D/g, '');

            // 🔥 Rule 1: FirstName entered but phone empty
            if (firstName && !phone) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: `Row ${i + 1}: Contact Number is required when First Name is entered.`,
                        variant: 'error'
                    })
                );
                return;
            }

            // 🔥 Rule 2: Phone must be exactly 10 digits
            if (phone && phone.length !== 10) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: `Row ${i + 1}: Contact Number must be exactly 10 digits.`,
                        variant: 'error'
                    })
                );
                return;
            }

            // 🔥 Rule 3: Email format validation
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: `Row ${i + 1}: Please enter a valid Email address.`,
                        variant: 'error'
                    })
                );
                return;
            }
        }

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
            fields.Superannuation_Inc_or_Exc__c=this.superannuationValue;
             fields.Paid_Break__c=this.paidBreak;
             const stateMapAU = {
                NSW: 'New South Wales',
                VIC: 'Victoria',
                QLD: 'Queensland',
                WA: 'Western Australia',
                SA: 'South Australia',
                TAS: 'Tasmania',
                ACT: 'Australian Capital Territory',
                NT: 'Northern Territory'
            };
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
                fields.Wyzed_User_Id__c = this.staffWyzedId;
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

        if(this.hasSuperFund){
            const superId = fields.Super_ID__c;
            const fundName = fields.Super_Fund_Name__c;

            if(!superId || !fundName){
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Please enter Super ID and Super Fund Name.',
                        variant: 'error'
                    })
                );
                return;
            }
        }
          this.template.querySelector('lightning-record-edit-form').submit(fields);  
      }

    handleSuperFundChange(event) {
        this.hasSuperFund = event.target.checked;
    }

    saveContacts(staffRecID) {

        console.log('📤 Saving contacts for:', staffRecID);
        console.log('📤 Contact List:', JSON.stringify(this.contactList));

        return saveStaffContacts({
            staffId: staffRecID,
            contactsJson: JSON.stringify(this.contactList)
        })
        .then(result => {

            console.log('✅ Contacts saved:', result);

            let updatedList = [...this.contactList];

            result.forEach((rec, index) => {
                if (rec.Id) {
                    updatedList[index].recordId = rec.Id;
                }
            });

            this.contactList = updatedList;

        })
        .catch(error => {
            console.error('❌ Error saving contacts:', error);
        });
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

        this.staffId = staffRecID;

        console.log('Staff saved, Id:', staffRecID);

        // this.saveRoles();
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

    this.saveContacts(staffRecID);

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

   handlePaidbreakChange(event){
    this.paidBreak=event.target.value;
}

 /*    handleError(event) {
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
} */

handleError(event) {

    event.preventDefault(); // Prevent default Salesforce error UI

    this.removeRadius = true;
    this.fieldErrorMap = {};

    let message = 'An unknown error occurred.';

    const detail = event.detail;

    const errorMessages = [];

    console.log('FULL ERROR => ', JSON.stringify(detail));

    // =====================================================
    // 1. RECORD LEVEL ERRORS
    // =====================================================

    const recordErrors = detail?.output?.errors;

    if (recordErrors && recordErrors.length > 0) {

        recordErrors.forEach(err => {

            let errorMsg = err.message || '';

            console.log('Original Record Error => ', errorMsg);

            // -------------------------------------------------
            // CUSTOM DUPLICATE EMAIL MESSAGE ONLY
            // -------------------------------------------------

            if (
                errorMsg.includes('duplicate value found') &&
                errorMsg.includes('Email_Address__c')
            ) {

                errorMsg =
                    'An account with this email address already exists. Please try another email address to create a new account.';
            }

            // push final message
            errorMessages.push(errorMsg);
        });
    }

    // =====================================================
    // 2. FIELD LEVEL ERRORS
    // =====================================================

    const fieldErrors = detail?.output?.fieldErrors;

    if (fieldErrors) {

        Object.keys(fieldErrors).forEach(fieldName => {

            fieldErrors[fieldName].forEach(error => {

                let errorMsg = error.message || '';

                console.log('Original Field Error => ', errorMsg);

                // -------------------------------------------------
                // CUSTOM DUPLICATE EMAIL MESSAGE ONLY
                // -------------------------------------------------

                if (
                    errorMsg.includes('duplicate value found') &&
                    errorMsg.includes('Email_Address__c')
                ) {

                    errorMsg =
                        'An account with this email address already exists. Please try another email address to create a new account.';
                }

                errorMessages.push(errorMsg);
            });

            // highlight fields if needed
            this.fieldErrorMap[fieldName] = true;
        });
    }

    // =====================================================
    // 3. FALLBACK ERROR MESSAGE
    // =====================================================

    if (errorMessages.length === 0 && detail?.message) {

        errorMessages.push(detail.message);
    }

    // =====================================================
    // 4. FINAL MESSAGE
    // =====================================================

    message = errorMessages.join('\n');

    console.log('FINAL ERROR MESSAGE => ', message);

    // =====================================================
    // 5. SHOW TOAST
    // =====================================================

    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Save Failed',
            message: message,
            variant: 'error'
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
    // handlefacStatus(event){   
    // this.toggleElement = event.target;
    // this.handleStatusFlag=true;  
    //     this.facId=event.currentTarget.dataset.id;
    //     this.facstatus=event.target.dataset.name;
    //     this.staffname=event.target.dataset.staffname;
    //     this.originalToggleState = this.facstatus;
        
    //     if(this.facstatus == 'true'){
    //     this.finalStatus='false';
    //         this.message= 'Staff is Inactive'
    //     }
    //     else if(this.facstatus == 'false'){
    //     this.finalStatus='true';
    //     this.message= 'Staff is Active'
    //     }
        
    // }
    async handlefacStatus(event){   
        this.toggleElement = event.target; 
        this.facId=event.currentTarget.dataset.id;
        this.facstatus=event.target.dataset.name;
        this.staffname=event.target.dataset.staffname;
        this.originalToggleState = this.facstatus;
        if (this.facstatus === "false") {
 
        try {
            const limitReached = await isStaffLimitReached(); 
                if (limitReached) { 
                    //  BLOCK ACTIVATION
                    this.showToast(
                        'Limit reached',
                        'Staff limit reached. Please upgrade your plan.',
                        'error'
                    ); 
                    return; // ❗ STOP HERE
                } 
            } catch (error) {
                console.error('Limit check error:', error);
                return;
            }
        }
        
        if(this.facstatus == 'true'){
            this.finalStatus='false';
            this.message= 'Staff is Inactive'
        }
        else if(this.facstatus == 'false'){
            this.finalStatus='true';
            this.message= 'Staff is Active'
        }

        try {
            const shifts = await checkFutureShifts({ staffId: this.facId });
            if (shifts && shifts.length > 0) {

                let dates = shifts.map(shift => {
                    const rawDate = new Date(shift.Date__c);

                    const formattedDate = `${String(rawDate.getDate()).padStart(2, "0")}/${
                        String(rawDate.getMonth() + 1).padStart(2, "0")
                    }/${rawDate.getFullYear()}`;

                    return formattedDate;
                });

                this.shiftDatesMessage = dates.join(', ');
                this.handleStatusFlag = false;
                this.hasFutureShifts = true;
            } else {
                this.handleStatusFlag = true;
                this.hasFutureShifts = false;
            }

        } catch (error) {
            console.error('Error:', error);
        }
    }
        
 handlestatuschange() {

    this.showSpinner = true;

    statusStaff({ IdValue: this.facId, status: this.finalStatus })
        .then(response => {

            console.log('response : ', JSON.stringify(response));

            // ✅ SUCCESS TOAST
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: this.message || 'Status updated successfully',
                    variant: 'success'
                })
            );

            this.handleStatusFlag = false;

            return refreshApex(this.refreshTable);
        })
        .catch(error => {

            console.error('Error updating status:', error);

            // 🔥 EXTRACT APEX ERROR MESSAGE
            let errorMessage = 'Something went wrong';

            if (error && error.body && error.body.message) {
                errorMessage = error.body.message;
            }

            // ❌ ERROR TOAST (THIS WAS MISSING)
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: errorMessage,
                    variant: 'error'
                })
            );
        })
        .finally(() => {
            this.showSpinner = false;
        });
}
    // async handlestatuschange() {

    //     try {
    //         //this.showSpinner = true;

    //         const shifts = await checkFutureShifts({ staffId: this.facId });

    //         if (shifts && shifts.length > 0) {

    //             let dates = shifts.map(shift => {
    //                 const rawDate = new Date(shift.Date__c);

    //                 const formattedDate = `${String(rawDate.getDate()).padStart(2, "0")}/${
    //                     String(rawDate.getMonth() + 1).padStart(2, "0")
    //                 }/${rawDate.getFullYear()}`;

    //                 return formattedDate;
    //             });

    //             this.shiftDatesMessage = dates.join(', ');
    //             this.handleStatusFlag = false;
    //             this.hasFutureShifts = true;

    //             //this.showSpinner = false;
    //             return;
    //         }

    //         // ✅ Call without chaining confusion
    //         await statusStaff({ 
    //             IdValue: this.facId, 
    //             status: this.finalStatus 
    //         });

    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 message: this.message,
    //                 variant: 'success'
    //             })
    //         );

    //         this.handleStatusFlag = false;

    //         await refreshApex(this.refreshTable);

    //     } catch (error) {
    //         //this.showSpinner = false;
    //         console.error('Error:', error);
    //     }
    // }

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
    handleFutureShiftClose(){
        
        this.hasFutureShifts=false;  
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
                this.superannuationValue = 'Exclude Superannuation';
                this.paidBreak=true;
                console.log('onchange event : '+this.superannuationValue);
           }else{
                this.isFixedcategory=true;
                this.paidBreak=false;
                this.includeSuperannuation = true;
                this.superannuationValue = 'Include Superannuation';
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

    handleSuperChange(event) {

        this.superannuationValue =
            event.target.value;

        console.log(
            'superannuationValue => ',
            this.superannuationValue
        );
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
@track isActive = true;

searchTimeout;

handleSearchInput(event) {
    clearTimeout(this.searchTimeout);

    const value = event.target.value;

    this.searchTimeout = setTimeout(() => {
        this.searchName = value;
        this.pageNumber = 1;
    }, 300);
}

handleActiveToggle() {
    this.activeFilterOn = true;
    this.inactiveFilterOn = false;

    this.isActive = true;
    this.pageNumber = 1;
      this.refreshKey++;

    // ❌ REMOVE refreshApex
}

handleInactiveToggle() {
    this.inactiveFilterOn = true;
    this.activeFilterOn = false;

    this.isActive = false;
    this.pageNumber = 1;
    this.refreshKey++;

    // ❌ REMOVE refreshApex
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
        //manendra added to reset the values on every selection of employment role  
        this.jobType = '';
        this.categoryType = '';
        this.classificationLevel = '';
        this.classificationPayType = '';

        /* // reset awards
       // this.isSchadsAwards = false;
        this.isNursingAwards = false;
        this.isChildCareAwards = false; */

        // reset rates
        this.genralHourlyRate = 0;
        this.sturdayHourlyRate = 0;
        this.sundayhourlyRate = 0;
        this.publicHolidayRate = 0;
        this.afterNoonShiftRate = 0;
        this.nightShiftRate = 0;
        this.sleepoverAllowance = 0;
        this.standardWeeklyRate = 0;
        this.oneBreakAllowance = 0;
        this.twoBreakAllowance = 0;

       

        //end
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

get facilityOptions() {
    if (!this.finalListFacilities) {
        return [];
    }

    return this.finalListFacilities.map(fac => ({
        label: fac.Name,
        value: fac.Id
    }));
}


updateEmploymentRoles() {

    const selectedLabels = this.selectedRoleValues.map(r => r.displaylabel);

    this.selectedRoleEmploymentValues = this.roleoptionsforFacility
        .filter(role => selectedLabels.includes(role.displaylabel))
        .map(role => ({
            label: role.label,
            value: role.value,
            facilityValue: role.facilityValue,
            displaylabel: role.displaylabel
        }));

    console.log(
        'Employment Roles ==> ',
        JSON.stringify(this.selectedRoleEmploymentValues)
    );
}


// handleRolesChange(event) {

//     console.log('Roles event:', JSON.stringify(event.detail));

//     const selectedValuesFromChild = event.detail.values || [];
//     this.selectedPrimaryRole = event.detail.primary;

//     // 🔹 map selected roles from available options
//     this.selectedRoleValues = this.roleoptionsforFacility
//         .filter(role => selectedValuesFromChild.includes(role.displaylabel))
//         .map(role => {
//             return {
//                 label: role.label,
//                 value: role.value,
//                 facilityValue: role.facilityValue,
//                 facilityName: role.facilityName,
//                 displaylabel: role.displaylabel,
//                 checked: true,
//                 isActive: true,
//                 isDisabled: false,
//                 typeOfService: role.typeOfService,
//                 isPrimary: role.displaylabel === this.selectedPrimaryRole,
//             };
//         });

//     console.log('selectedRoleValues objects:', JSON.stringify(this.selectedRoleValues));

//     // 🔹 Update Employment Roles
//     this.updateEmploymentRoles();
// }

    // saveRoles() {

    //     if (!this.staffId) {
    //         console.warn('No staffId available for saving roles');
    //         return;
    //     }

    //     if (!this.roleoptionsforFacility || !this.selectedRoleValues) {
    //         console.warn('No roles selected');
    //         return;
    //     }

    //     const rolesPayload = this.roleoptionsforFacility
    //         .filter(role => this.selectedRoleValues.includes(role.displaylabel))
    //         .map(role => ({
    //             roleName: role.value,
    //             facilityId: role.facilityValue,
    //             isPrimary: role.isPrimary
    //         }));

    //     console.log('Roles Payload ==> ', JSON.stringify(rolesPayload));

    //     createStaffRoles({
    //         staffId: this.staffId,
    //         roles: JSON.stringify(rolesPayload)
    //     })
    //     .then(() => {
    //         console.log('Roles saved successfully');
    //     })
    //     .catch(error => {
    //         console.error('Error saving roles', error);
    //     });
    // }

    // handleFacilityChange(event) {

    //     // Multi-combobox returns ARRAY
    //     const selectedFacilityIds = event.detail.value || [];

    //     this.selctedMultipleFcailityValues = selectedFacilityIds;

    //     console.log('Selected Facilities:', selectedFacilityIds);

    //     // // 🔹 Reset if none selected
    //     // if (selectedFacilityIds.length === 0) {
    //     //     this.facilityPreferredName = 'Facility';
    //     //     this.updateRecordsForSelectedFacility([]);
    //     //     this.fetchRoleOptions();
    //     //     return;
    //     // }

    //     // // 🔹 If one facility selected
    //     // if (selectedFacilityIds.length === 1) {

    //     //     const facility = this.facilityMap?.get(selectedFacilityIds[0]);

    //     //     this.facilityPreferredName =
    //     //         facility?.preferredName ||
    //     //         facility?.name ||
    //     //         'Facility';
    //     // }
    //     // // 🔹 If multiple selected
    //     // else {
    //     //     this.facilityPreferredName =
    //     //         `${selectedFacilityIds.length} Facilities Selected`;
    //     // }

    //     // 🔥 Refresh Roles Immediately
    //     this.fetchRoleOptions();

    //     // 🔥 Update Records
    //     // this.updateRecordsForSelectedFacility(selectedFacilityIds);
    // }



    handleFacilityChange(event) {

        // ✅ Ignore search typing events
        if (!Array.isArray(event.detail.value)) {
            console.log('Ignored search event:', event.detail);
            return;
        }

        const selectedFacilityIds = event.detail.value || [];

        console.log('Selected Facilities:', selectedFacilityIds);

        // ✅ Direct binding (same as CreateEmployee)
        this.selctedMultipleFcailityValues = [...selectedFacilityIds];

        //manendra added 27-5
           this.selectedEmploymentRole = '';
    this.selectedEmploymentRoleDisplayVlaue = '';
    this.latestSelctedRoleAndFacility = '';

    // Clear role state
    this.selectedRoleValues = [];
    this.selectedRoleEmploymentValues = [];

    // ADD THESE TWO
    this.selectedRoleValueLabels = [];
    this.selectedPrimaryRole = null;

    // Clear options
    this.roleoptionsforFacility = [];

        console.log('✅ Cleared stale role state');
        //end manendra added

        // ✅ Refresh roles (important)
        this.fetchRoleOptions();
    }



handleRolesChange(event) {

    console.log('Roles event:', JSON.stringify(event.detail));

    // ✅ Ignore search typing events
    if (!event.detail.values) {
        console.log('Ignored search event:', event.detail);
        return;
    }

    const selectedValues = event.detail.values || [];
    const primary = event.detail.primary;

    this.selectedPrimaryRole = primary;

    // ✅ UI binding
    this.selectedRoleValueLabels = [...selectedValues];

    // ✅ 🔥 SAME LOGIC AS CREATEEMPLOYEE (merge, don’t rebuild)
    const existingMap = new Map(
        (this.selectedRoleValues || []).map(r => [r.displaylabel, r])
    );

    this.selectedRoleValues = selectedValues.map(val => {

        const existing = existingMap.get(val);

        const role = this.roleoptionsforFacility.find(
            r => r.displaylabel === val
        );

        return {
            label: role?.label || existing?.label,
            value: role?.value || existing?.value,
            facilityValue: role?.facilityValue || existing?.facilityValue,
            facilityName: role?.facilityName || existing?.facilityName,
            displaylabel: val,
            checked: true,
            isActive: true,
            isDisabled: false,
            typeOfService: role?.typeOfService || existing?.typeOfService,
            isPrimary: val === primary
        };
    });

    this.updateEmploymentRoles();

    console.log('✅ Stable Roles ==> ', JSON.stringify(this.selectedRoleValues));
}

get tableClass() {
    return this.ictUserType
        ? 'table-container staffListTable noRole'
        : 'table-container staffListTable withRole';
}

handleStatus(event) {
    this.toggleValue = event.target.checked; 
    
    console.log('Toggle status:', this.toggleValue);

}

// validateAndGetMissingFields() {
//     let missingFields = [];

//     const currentStepEl = this.template.querySelector(
//         `[data-step="${this.createCurrentStep}"]`
//     );

//     if (!currentStepEl) return missingFields;

//     // 🔹 STANDARD FIELDS
//     const fields = currentStepEl.querySelectorAll(
//         'lightning-input, lightning-input-field, lightning-combobox, lightning-textarea'
//     );

//     fields.forEach(field => {
//         if (field.required) {
//             const isValid = field.reportValidity();

//             if (!isValid) {
//                 let label = field.dataset.label || field.label || field.fieldName || 'Field';
//                 label = label.replace(/__c/g, '').replace(/_/g, ' ');
//                 missingFields.push(label);
//             }
//         }
//     });

//     // 🔹 CUSTOM MULTI COMBOBOX (Facility)
//     const customFields = currentStepEl.querySelectorAll('[data-id="mandatory"]');

//     customFields.forEach(field => {
//         if (field.tagName.includes('C-TESSERACT-APPS-MULTI-COMBOBOX')) {

//             if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {

//                 let label = field.dataset.label || 'Facility';
//                 missingFields.push(label);

//                 field.classList.add('error-border');
//             } else {
//                 field.classList.remove('error-border');
//             }
//         }
//     });

//     // 🔥 ADDRESS VALIDATION (ADDED)
//     const addressCmp = currentStepEl.querySelector('[data-id="mandatory-address"]');

//     if (addressCmp) {
//         if (!this.street) missingFields.push('Street');
//         if (!this.city) missingFields.push('Suburb');
//         if (!this.province) missingFields.push('State');
//         if (!this.postalcode) missingFields.push('Post Code');
//         if (!this.country) missingFields.push('Country');
//     }
//     // 🔥 CONDITIONAL NICKNAME VALIDATION
//     const preferNickname = currentStepEl.querySelector('[data-id="preferNickname"]');
//     const nicknameField = currentStepEl.querySelector('[data-id="nicknameField"]');

//     if (preferNickname?.value === true) {
//         if (!nicknameField?.value || !nicknameField.value.trim()) {
//             missingFields.push('Preferred Name');

//             // force UI error
//             nicknameField.reportValidity();

//             // optional border
//             // nicknameField.classList.add('slds-has-error');
//         } else {
// // clear UI error
//     // nicknameField.classList.remove('slds-has-error');

//         // force refresh validity UI
//         setTimeout(() => {
//             nicknameField.reportValidity();
//         }, 0);        }
//         }


//     // ✅ REMOVE DUPLICATES
//     return [...new Set(missingFields)];
// }

validateAndGetMissingFields() {
    let missingFields = [];

    const currentStepEl = this.template.querySelector(
        `[data-step="${this.createCurrentStep}"]`
    );

    if (!currentStepEl) return missingFields;

    // 🔹 STANDARD FIELDS
    const fields = currentStepEl.querySelectorAll(
        'lightning-input, lightning-input-field, lightning-combobox, lightning-textarea'
    );

    fields.forEach(field => {
        if (field.required) {
            const isValid = field.reportValidity();

            if (!isValid) {
                let label = field.dataset.label || field.label || field.fieldName || 'Field';
                label = label.replace(/__c/g, '').replace(/_/g, ' ');
                missingFields.push(label);
            }
        }
    });

    // 🔹 CUSTOM MULTI COMBOBOX (Facility)
    const customFields = currentStepEl.querySelectorAll('[data-id="mandatory"]');

    customFields.forEach(field => {
        if (field.tagName.includes('C-TESSERACT-APPS-MULTI-COMBOBOX')) {

            if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {

                let label = field.dataset.label || 'Facility';
                missingFields.push(label);

                field.classList.add('error-border');
            } else {
                field.classList.remove('error-border');
            }
        }
    });

    // 🔹 ROLE VALIDATION (Step 1) — custom dropdown, not caught by querySelectorAll
    // Prevents user from navigating to next page without selecting a Role
    if (this.createCurrentStep === 'createstep1' && !this.ictUserType) {
        if (!this.selectedRoleValues || this.selectedRoleValues.length === 0) {
            missingFields.push('Role');
        }
    }

    // 🔹 EMPLOYMENT ROLE VALIDATION (Step 2) — custom dropdown in Employment section
    // Fixes: "Employment Type error throwing instead of Frequency"
    if (this.createCurrentStep === 'createstep2' && !this.ictUserType) {
        if (!this.selectedEmploymentRole) {
            missingFields.push('Roles');
        }
        if (
            this.genralHourlyRate === null ||
            this.genralHourlyRate === undefined ||
            Number.isNaN(this.genralHourlyRate)
        ) {
            missingFields.push('Hourly Rate');
        }
    }

// ABN / TFN validation — runs on createstep3 (Tax & Bank step)
// if (this.createCurrentStep === 'createstep3') {
//     const abnField = currentStepEl.querySelector('[data-id="ABN"]');
//     const tfnField = currentStepEl.querySelector('[data-id="TFN"]');

//     const abnVal = abnField?.value ? String(abnField.value).trim() : '';
//     const tfnVal = tfnField?.value ? String(tfnField.value).trim() : '';

//     if (!abnVal && !tfnVal) {
//         // Visually highlight both fields
//         if (abnField) abnField.classList.add('slds-has-error');
//         if (tfnField) tfnField.classList.add('slds-has-error');
//         missingFields.push('ABN or TFN (at least one required)');
//     } else {
//         if (abnField) abnField.classList.remove('slds-has-error');
//         if (tfnField) tfnField.classList.remove('slds-has-error');
//     }
// }

if (this.createCurrentStep === 'createstep3') {
    const abnField = currentStepEl.querySelector('[data-id="ABN"]');
    const tfnField = currentStepEl.querySelector('[data-id="TFN"]');

    const abnVal = abnField?.value ? String(abnField.value).trim() : '';
    const tfnVal = tfnField?.value ? String(tfnField.value).trim() : '';

    const abnDigits = abnVal.replace(/\D/g, '');
    const tfnDigits = tfnVal.replace(/\D/g, '');

    if (abnField) abnField.classList.remove('slds-has-error');
    if (tfnField) tfnField.classList.remove('slds-has-error');

    if (!abnVal && !tfnVal) {
        if (abnField) abnField.classList.add('slds-has-error');
        if (tfnField) tfnField.classList.add('slds-has-error');
        missingFields.push('ABN or TFN');
    } else {
        if (abnVal && abnDigits.length !== 11) {
            if (abnField) abnField.classList.add('slds-has-error');
            missingFields.push('Valid ABN (11 digits)');
        }

        if (tfnVal && tfnDigits.length !== 9) {
            if (tfnField) tfnField.classList.add('slds-has-error');
            missingFields.push('Valid TFN (9 digits)');
        }
    }
}
    // 🔥 ADDRESS VALIDATION — reads from lightning-input-address DOM if present,
    // otherwise falls back to tracked JS properties.
    // Runs unconditionally on createstep1 — no longer silently skipped.
    if (this.createCurrentStep === 'createstep1') {
        const addressField = currentStepEl.querySelector('lightning-input-address')
                          || currentStepEl.querySelector('[data-id="mandatory-address"]')
                          || currentStepEl.querySelector('[data-id*="address"]');

        const street   = addressField ? addressField.street?.trim()    : this.street?.trim();
        const city     = addressField ? addressField.city?.trim()       : this.city?.trim();
        const province = addressField ? addressField.province?.trim()   : this.province?.trim();
        const postal   = addressField ? addressField.postalCode?.trim() : this.postalcode?.trim();
        const country  = addressField ? addressField.country?.trim()    : this.country?.trim();

        if (!street)    missingFields.push('Street');
        if (!city)      missingFields.push('Suburb');
        if (!province)  missingFields.push('State');
        if (!postal)    missingFields.push('Post Code');
        if (!country)   missingFields.push('Country');
    }

    // 🔥 CONDITIONAL NICKNAME VALIDATION
    const preferNickname = currentStepEl.querySelector('[data-id="preferNickname"]');
    const nicknameField  = currentStepEl.querySelector('[data-id="nicknameField"]');

    if (preferNickname?.value === true) {
        if (!nicknameField?.value || !nicknameField.value.trim()) {
            missingFields.push('Preferred Name');

            // force UI error
            nicknameField.reportValidity();
        } else {
            // force refresh validity UI
            setTimeout(() => {
                nicknameField.reportValidity();
            }, 0);
        }
    }

    // ✅ REMOVE DUPLICATES
    return [...new Set(missingFields)];
}

@track showContactTypeModal = false;
    @track newContactTypeName = '';
    @track customContactTypes = [];
    @track activeContactRowIndex = null;
    @track previousContactType = '';
    @track contactTypeToDelete = null;
    @track stagedDeleteTypes = [];

    handleContactsChange(event) {
        try {
            const index = parseInt(event.currentTarget.dataset.index, 10);
            const fieldName = event.target.name;
            const value = event.target.value;

            let updatedList = [...this.contactList];

            if (!updatedList[index]) return;

            // ✅ Update field value
            updatedList[index] = {
                ...updatedList[index],
                [fieldName]: value
            };

            const row = updatedList[index];

            // ✅ Placeholder logic
            if (!this.ictUserType && row.firstName && row.firstName.trim() !== '') {
                row.phonePlaceholder = '* Enter Contact Number';
            } else {
                row.phonePlaceholder = 'Enter Contact Number';
            }

            // ✅ FIXED HERE 👇
            if (fieldName === 'contactType' && value === 'Add New Contact Type') {

                this.activeContactRowIndex = index;
                this.previousContactType = this.contactList[index].contactType;

                updatedList[index].contactType = '';

                this.contactList = updatedList;
                this.showContactTypeModal = true;
                return;
            }

            this.contactList = updatedList;

        } catch (error) {
            console.error('Error:', error);
        }
    }

    // 🔹 Add row
    addContactRow(event) {
        try {
            const index = event.currentTarget.dataset.index; // ✅ FIX

            console.log('Add clicked index:', index);

            let updatedList = [...this.contactList];

            updatedList.push({
                id: Date.now(),
                recordId: null,
                contactType: '',
                showNewTypeInput: false,
                newContactTypeValue: '',
                firstName: '',
                lastName: '',
                relationship: '',
                contactNumber: '',
                email: '',
                isDisabled: false,
                addButtonClass: 'slds-show',

                firstNamePlaceholder: 'Enter First Name',
                lastNamePlaceholder: 'Enter Last Name',
                relationshipPlaceholder: 'Enter Relationship', // ✅ NEW
                phonePlaceholder: 'Enter Contact Number',
                emailPlaceholder: 'Enter Email Address',
            });

            this.contactList = updatedList;

        } catch (error) {
            console.error('Error in addContactRow:', error);
        }
    }

    // 🔹 Remove row
    removeContactRow(event) {
        try {
            const index = event.currentTarget.dataset.index; // ✅ FIX

            console.log('Delete clicked index:', index);

            let updatedList = [...this.contactList];

            if (updatedList.length === 1) {
                console.warn('Cannot delete last row');
                return;
            }

            updatedList.splice(index, 1);

            this.contactList = updatedList;

        } catch (error) {
            console.error('Error in removeContactRow:', error);
        }
    }

    closeContactTypeModal() {
        const index = this.activeContactRowIndex;

        if (index === null || index === undefined) {
            this.resetContactTypeModal();
            return;
        }

        // Remove the problematic row
        this.contactList.splice(index, 1);

        // Insert a brand-new row at the same position
        this.contactList.splice(index, 0, this.createEmptyContactRow());

        // Commit reactivity
        this.contactList = [...this.contactList];

        // Fix Add button visibility
        this.updateAddButtonVisibility();

        // Reset modal state
        this.resetContactTypeModal();
    }

    saveContactType() {
        const newValue = this.newContactTypeName?.trim();
        console.log('newValue : ',newValue);
        if (!newValue) {
            console.error('Contact Type Name is required.');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Contact Type Name is required',
                    variant: 'error',
                })
            );
            return;
        }
       
        /* ===============================
        COMMIT DELETES (SAFE ORDER)
        =============================== */
        if (this.stagedDeleteTypes.length > 0) {
            console.log('this.stagedDeleteTypes.length ', this.stagedDeleteTypes.length);

            // 1️⃣ Clear from rows
            this.contactList = this.contactList.map(row => {
                if (this.stagedDeleteTypes.includes(row.contactType)) {
                    return { ...row, contactType: '' };
                }
                return row;
            });

            // 2️⃣ Remove from custom types
            this.customContactTypes =
                this.customContactTypes.filter(
                    t => !this.stagedDeleteTypes.includes(t.value)
                );

            // 3️⃣ Remove from dropdown
            this.contactTypeOptions =
                this.contactTypeOptions.filter(
                    o => !this.stagedDeleteTypes.includes(o.value)
                );
            //  this.contactList[this.activeContactRowIndex].contactType = '';
            // this.contactList = [...this.contactList];
        }
         /* ===============================
        ADD NEW CONTACT TYPE
        =============================== */
        if (newValue) {
            if (!this.contactTypeOptions.some(o => o.value === newValue)) {
                const newOption = { label: newValue, value: newValue };

                this.customContactTypes = [...this.customContactTypes, newOption];

                this.contactTypeOptions = [
                    ...this.contactTypeOptions.filter(o => o.value !== 'Add New Contact Type'),
                    newOption,
                    { label: 'Add New', value: 'Add New Contact Type' }
                ];
            }

            // ✅ select new value
            this.contactList[this.activeContactRowIndex].contactType = newValue;
             this.contactList = [...this.contactList];
        }

        this.resetContactTypeModal();
    }

    handleNewContactTypeInput(event) {
        this.newContactTypeName = event.target.value;
    }

    stageDeleteContactType(event) {
        console.log('--- stageDeleteContactType  ---');
        console.log( "this.contactList in stageDeleteContactType : " + JSON.stringify(this.contactList));
        const value = event.currentTarget.dataset.value;
        console.log('Clicked value:', value);
        if (!value) {
            console.warn('No value found in dataset');
            return;
        }


        // ❌ do NOT stage delete if used
        if (this.isContactTypeUsed(value)) {
            
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Cannot Delete',
                    message: `"${value}" is currently used in contact rows.`,
                    variant: 'warning'
                })
            );
            return;
        }
        console.log('Contact type is NOT used, proceeding to delete');

        if (!this.stagedDeleteTypes.includes(value)) {
            this.stagedDeleteTypes = [...this.stagedDeleteTypes, value];
            console.log('Updated stagedDeleteTypes:', this.stagedDeleteTypes);
        }
        console.log('before  stagedDeleteTypes:', this.stagedDeleteTypes);
        console.log('Before removal contactTypeOptions:', this.contactTypeOptions);
        console.log( "this.contactList before : " + JSON.stringify(this.contactList));

        this.customContactTypes = this.customContactTypes.filter(
            t => t.value !== value
        );

        console.log('After removal customContactTypes:', this.customContactTypes);

        this.contactTypeOptions = this.contactTypeOptions.filter(
            item => item.value !== value
        );

        console.log('After removal contactTypeOptions:', this.contactTypeOptions);
        console.log( "this.contactList after : " + JSON.stringify(this.contactList));

    }

    updateAddButtonVisibility() {
            const lastIndex = this.contactList.length - 1;

            this.contactList = this.contactList.map((row, index) => {
                const isLast = index === lastIndex;

                return {
                    ...row,
                    showAdd: isLast,
                    addButtonClass: isLast ? 'add-visible' : 'add-hidden'
                };
            });
    }

    resetContactTypeModal() {
        this.showContactTypeModal = false;
        this.newContactTypeName = '';
        this.activeContactRowIndex = undefined;
        this.previousContactType = undefined;
        this.stagedDeleteTypes = [];
        console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
        this.contactList = [...this.contactList];
        console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
    }

    createEmptyContactRow() {
        return {
            id: Date.now(),
            recordId: null,
            contactType: '',
            showNewTypeInput: false,
            newContactTypeValue: '',
            firstName: '',
            lastName: '',
            relationship: '',
            contactNumber: '',
            email: '',
            isDisabled: false,
            addButtonClass: 'slds-show',
            firstNamePlaceholder: 'Enter First Name',
            lastNamePlaceholder: 'Enter Last Name',
            relationshipPlaceholder: 'Enter Relationship', // ✅ NEW
            phonePlaceholder: 'Enter Contact Number',
            emailPlaceholder: 'Enter Email Address',
        };
    }

    isContactTypeUsed(value) {
        return this.contactList.some(row => row.contactType === value);
    }


getInitials(name) {
    if (!name) return '';

    return name
        .trim()
        .split(/\s+/)
        .filter(word => word)
        .map(word => word.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

getAvatarClass(name) {
    const colors = [
        'avatar-slate',
        'avatar-teal',
        'avatar-indigo',
        'avatar-rose'
    ];
    const safeName = (name || '').trim();
    return colors[safeName.length % colors.length];
}  


}