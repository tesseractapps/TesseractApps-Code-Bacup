import { LightningElement, track, wire, api } from "lwc";
//Import apex method
import USER_ID from "@salesforce/user/Id";
import fetchFacilitiess from "@salesforce/apex/StaffController.fetchStaffs";
import fetchStaff from "@salesforce/apex/StaffController.fetchStaff";
import createUser from "@salesforce/apex/PortalUserController.createPortalUserStaff";
import updatestaff from "@salesforce/apex/PortalUserController.createstafffromstaffDataCommunity";
import statusStaff from "@salesforce/apex/StaffController.statusStaff";
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import FORM_FACTOR from "@salesforce/client/formFactor";
import { subscribe, unsubscribe, onError } from "lightning/empApi";
import My_Resource from "@salesforce/resourceUrl/myResource";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile";
import insertPreTax from "@salesforce/apex/StaffController.insertPreTax";
import { deleteRecord } from "lightning/uiRecordApi";
import getShadAwards from "@salesforce/apex/StaffController.getShadAwards";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import getUserTypeValuesfromOrg from "@salesforce/apex/PortalUserController.getUserTypeValues";
import getUserRole from "@salesforce/apex/PortalUserController.getUserRole";
import getModules from "@salesforce/apex/HRTraining.getModules";
import insertAssignRecords from "@salesforce/apex/HRTraining.insertAssignRecords";
import createTraining from "@salesforce/apex/HRTraining.createTraining";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import { publish, MessageContext } from "lightning/messageService";
import BOT_ACTION from "@salesforce/messageChannel/BotActionMessageChannel__c";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';
import getNursingAwrds from '@salesforce/apex/StaffController.getNursingAwrds';
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
import createStaffRoles from '@salesforce/apex/StaffRoleController.createStaffRoles';
//import { RefreshEvent } from 'lightning/refresh';
import getChildcareAwrds from '@salesforce/apex/StaffController.getChildcareAwrds';
import getFacilityIdentityDocuments from '@salesforce/apex/FacilityDocumentController.getFacilityIdentityDocuments';
import upsertStaffFacilities from '@salesforce/apex/staffFacilityHandler.upsertStaffFacilities';
import updateLeaveApprover from '@salesforce/apex/StaffController.updateLeaveApprover';
import FIXED_ONE from '@salesforce/label/c.SCHADS_BrokenShift_1_Break_Fixed';
import FIXED_TWO from '@salesforce/label/c.SCHADS_BrokenShift_2_Break_Fixed';
import isStaffLimitReached from '@salesforce/apex/LimitCheckService.isStaffLimitReached';

// Percentages
import PERCENT_ONE from '@salesforce/label/c.SCHADS_BrokenShift_1_Break_Percent';
import PERCENT_TWO from '@salesforce/label/c.SCHADS_BrokenShift_2_Break_Percent';
import fetchStaffPaginatedData from '@salesforce/apex/AdminPaginationController.fetchStaffPaginatedData';
import fetchStaffForDropdown from '@salesforce/apex/AdminPaginationController.fetchStaffForDropdown';
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import saveStaffContacts from '@salesforce/apex/StaffContactController.saveStaffContacts';
import getUserTypeValuesBasedOnUser from '@salesforce/apex/PortalUserController.getUserTypeValuesBasedOnUser';

const actions = [
  { label: "View Document", name: "view_details" },
  { label: "Edit", name: "edit" },
  { label: "Delete", name: "delete" }
];

   const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
    const ENDPOINTS = {
        delete: `${AWS_BASE}/delete-file`
    };

 const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};
   

export default class TesseractAppsCreateEmployee extends NavigationMixin(
  LightningElement
) {
  employee = My_Resource + "/myResource/images/employee.svg";
  // JS Properties
  @track address;
  @track cardFlag = false;
  @track portalStaffId = "";
  recordId;
  subscription = {};
  CHANNEL_NAME = "/event/RefreshDataTable__e";
  records = []; //All records available in the data table
  records2 = [];
  totalRecords = 0; //Total no.of records
  pageSize=12; //No.of records to be displayed per page
  totalPages; //Total no.of pages
  pageNumber = 1; //Page number
  // recordsToDisplay = []; //Records to be displayed on the page
  @track refreshTable = [];
  @track recordsToDisplay = [];

  @track isPageSizeManuallySet = false;
  hasCalculatedPageSize = false;

  get pageSizeOptions() {
      return [
          { label: 'Auto', value: 'Auto', selected: !this.isPageSizeManuallySet },
          { label: '10', value: '10', selected: this.isPageSizeManuallySet && this.pageSize === 10 },
          { label: '20', value: '20', selected: this.isPageSizeManuallySet && this.pageSize === 20 },
          { label: '50', value: '50', selected: this.isPageSizeManuallySet && this.pageSize === 50 }
      ];
  }
  @api selectedName;
  @api facilityButton;
  @track orgNam = "";
  @track visible = false;
  @track fname = "";
  @track lname = "";
  @track firstname = "";
  @track lastname = "";
  @track blurflag = false;
  // @track staffEditFlag = false;
  _staffEditFlag = false;
  @track street;
  @track city;
  @track country;
  @track province;
  @track postalcode;
  @track name;
  @track status;
  @track lastname1;
  @track state;
  @track satffDataJasonformat = {};
  @track heading;
  @track isattachError = false;
  @track isFileAttached = false;
  @track selectedFilesToUpload = []; //store selected files
  @track showSpinner = false; //used for when to show spinner
  @track fileName;
  @track doc;
  @track fileSize;
  @track file; //holding file instance
  @track myFile;
  @track fileType; //holding file type
  @track fileReaderObj;
  @track base64FileData;
  @track ShowPretaxModal;
  @track parentStaffId;
  @track preTaxRecId = "";
  @track accountRecList = [];
  @track DisplayRole;
  @track isOpen = false;//manendra for custom combo
   @track roleoptionsforFacility = [];//manendra for custom combo
  activeSections = [
    "StaffDetails",
    "Address",
    "EmploymentDetails",
    "staffDocumentation",
    "InvoiceDetails",
    "PreTaxDetails",
    "PostTax",
    "ApproversDetails",
    "BankDetails",
    "SuperannuationDetails",
    "Leaves",
    "TaxationDetails",
    "EmergencyDetails"
  ];
  @track showPreTaxRecordEditForm = false;
  @track totalPretaxvalue = "Pre Tax Deduction - Total ";
  @track preTaxForSubmit;
  @track postTaxlabel = "Post Tax Deduction - Total ";
  @track postTaxLabelvalue = 0;
  @track pretaxOne = 0;
  @track pretaxtwo = 0;
  @track pretaxThree = 0;
  @track pretaxFour = 0;
  @track pretaxFive = 0;
  @track submitButtonlabel;
  @api pageName;
  @track OrgNisationRoles;
  @track stafflabel = "All";
  @track CreateUserflag = false;
  @track userCrearedflag = false;
  UserTypeValues = [];
  userId = USER_ID;
  @track selectedRole = "";
  @track selectedUserType = "";
  @track noRecordsFlag = false;
  @track fieldErrorMap = {};
  wiredresult;
  @track geoLocationStatus = false;
  @track currentStep = "step1";
  @track showUpgradeModal = false;
  @track sortField = '';
  @track sortDirection = 'asc';
  @track sortIcons = {
    Display_Nickname__c: '',
    Contact_Number__c: '',
    activeRolesDisplay: '',
    activeFaciltyDisplay: '',
    Staff_Status__c: '',
    reportsTo: ''
  };
  courseOptions = [
    { label: "Disability Awareness", value: "Disability Awareness" },
    { label: "Employee Onboarding", value: "Employee Onboarding" },
    { label: "Hand Hygiene", value: "Hand Hygiene" },
    { label: "NDIS Code of Conduct", value: "NDIS Code of Conduct" },
    { label: "Policies and Procedures", value: "Policies and Procedures" },
    {
      label: "Safe Meals and Oral Hygiene",
      value: "Safe Meals and Oral Hygiene"
    },
    {
      label: "Supporting Effective Communication",
      value: "Supporting Effective Communication"
    },
    {
      label: "Managing Challenging Situations",
      value: "Managing Challenging Situations"
    },
    { label: "Risk Management", value: "Risk Management" },
    { label: "Safe Workplaces (WHS)", value: "Safe Workplaces (WHS)" },
    {
      label: "Workplace Bullying and Harassment",
      value: "Workplace Bullying and Harassment"
    },
    { label: "Incident Reporting", value: "Incident Reporting" },
    {
      label: "Privacy and Confidentiality",
      value: "Privacy and Confidentiality"
    },
    {
      label: "Introduction to Restrictive Practices for NDIS Workers",
      value: "Introduction to Restrictive Practices for NDIS Workers"
    },
    {
      label: "Understanding Psychosocial Disability Under The NDIS",
      value: "Understanding Psychosocial Disability Under The NDIS"
    },
    {
      label: "Medication Management for NDIS Workers",
      value: "Medication Management for NDIS Workers"
    },
    {
      label: "Introduction to Eating Disorders",
      value: "Introduction to Eating Disorders"
    },
    { label: "Diabetes Management", value: "Diabetes Management" },
    { label: "Introduction to Autism", value: "Introduction to Autism" },
    {
      label: "Receiving Feedback With a Growth Mindset",
      value: "Receiving Feedback With a Growth Mindset"
    },
    {
      label: "Diversity, Equity and Inclusivity in the Workplace",
      value: "Diversity, Equity and Inclusivity in the Workplace"
    },
    {
      label: "First Aid and CPR Refresher Course",
      value: "First Aid and CPR Refresher Course"
    },
    {
      label: "Introduction to Positive Behaviour Support (NDIS)",
      value: "Introduction to Positive Behaviour Support (NDIS)"
    },
    { label: "Trauma Informed Support", value: "Trauma Informed Support" },
    {
      label: "Mental Health Awareness and Support",
      value: "Mental Health Awareness and Support"
    },
    {
      label: "Effective Complaint Handling for NDIS Providers",
      value: "Effective Complaint Handling for NDIS Providers"
    },
    {
      label: "Suicide Awareness and Prevention",
      value: "Suicide Awareness and Prevention"
    },
    { label: "Insulin and Diabetes", value: "Insulin and Diabetes" },
    { label: "Waste Management for NDIS", value: "Waste Management for NDIS" }
  ];

  @track sectionFlags = {
    staffDetails: true,
    Addressdetails: true,
    EmploymentDetails: true,
    InvoiceDetails: true,
    TaxationDetails: true,
    PreTaxDeduction: true,
    PostTaxDeduction: true,
    EmergencyDetails: true,
    BankDetails: true,
    SuperannuationDetails: true,
    Leaves: true,
    ApproversDetails: true,
    Training: true,
    staffDocumentation1: true
  };

  /*  praveen changes for nursing awards start*/
  @track typeOfService;
  @track isSchadsAwards=false;
  @track isNursingAwards=false;
  /*  praveen changes for nursing awards end*/

  //Maheswari changes for child care awards
  @track isChildCareAwards=false;

@track sectionIcons = {
  staffDetails: { ...ICON_DOWN },
  Addressdetails: { ...ICON_DOWN },
  EmploymentDetails: { ...ICON_DOWN },
  InvoiceDetails: { ...ICON_DOWN },
  TaxationDetails: { ...ICON_DOWN },
  PreTaxDeduction: { ...ICON_DOWN },
  PostTaxDeduction: { ...ICON_DOWN },
  EmergencyDetails: { ...ICON_DOWN },
  BankDetails: { ...ICON_DOWN },
  SuperannuationDetails: { ...ICON_DOWN },
  Leaves: { ...ICON_DOWN },
  ApproversDetails: { ...ICON_DOWN },
  Training: { ...ICON_DOWN },
  staffDocumentation1: { ...ICON_DOWN }
};


  @track training = {
    name: "",
    startDate: "",
    endDate: "",
    description: "",
    courses: ""
  };

  @track trainingId;
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;
  @track Nationality = '';
  @track Languages = [];
  @track LANGUAGE_OPTIONS = [
        'Arabic', 'Armenian', 'Azerbaijani', 'Bengali', 'Burmese', 'Dhivehi', 'Dzongkha',
        'English', 'Filipino', 'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Indonesian',
        'Italian', 'Japanese', 'Kazakh', 'Khmer', 'Korean', 'Kyrgyz', 'Lao', 'Malay', 'Mandarin',
        'Mongolian', 'Nepali', 'Persian', 'Portuguese', 'Russian', 'Samoan', 'Sinhala', 'Swahili',
        'Thai', 'Tongan', 'Turkish', 'Urdu', 'Uzbek', 'Vietnamese'
    ];

  @track dynamicDocumentTypes = [];
  documentPointsMap = {};
  documentMetaMap = {};
  @track multiFacilityDroDownList=[];
  @track selctedMultipleFcailityValues=[];
  @track facilityDropDownOpen=false;
  @track roleDropDownForEmployment=false;
  @track selectedEmploymentRoleDisplayVlaue='';
  @track isFirstNameEntered = false;
  @track selectedRoleValues = [];//manendra
  @track selectedRoleEmploymentValues = [];
    @track selectedRoleValueLabels = [];
  @track standardWeeklyRate=0;
  @track allowanceMethod = 'Fixed';
  @track oneBreakAllowance = 0;
  @track twoBreakAllowance = 0;
  @track isActive = true;
   allowanceMethodOptions = [
        { label: 'Use Pay Guide Rate', value: 'Fixed' },
        { label: 'Use Percentage Rule', value: 'Percentage' }
    ];
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }
// @track createCurrentStep = 'createstep1';
_createCurrentStep = 'createstep1';

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


// handleCreateStepClick(event) {
//     const targetStep = event.target.value;

//     const stepOrder = {
//         createstep1: 1,
//         createstep2: 2,
//         createstep3: 3,
//         createstep4: 4
//     };

//     const current = stepOrder[this.createCurrentStep];
//     const target = stepOrder[targetStep];

//     // Prevent skipping ahead
//     if (target > current + 1) {
//         const missingFields = this.validateAndGetMissingFields();

//         if (missingFields.length > 0) {
//             const uniqueFields = [...new Set(missingFields)];

//             this.dispatchEvent(
//                 new ShowToastEvent({
//                     title: 'Error',
//                     message: `Please fill required fields: ${uniqueFields.join(', ')}`,
//                     variant: 'error'
//                 })
//             );
//         }
//         return;
//     }

//     // Validate current step before moving forward
//     if (target > current) {
//         const missingFields = this.validateAndGetMissingFields();

//         if (missingFields.length > 0) {
//             const uniqueFields = [...new Set(missingFields)];

//             this.dispatchEvent(
//                 new ShowToastEvent({
//                     title: 'Error',
//                     message: `Please fill required fields: ${uniqueFields.join(', ')}`,
//                     variant: 'error'
//                 })
//             );
//             return;
//         }
//     }

//     // allow backward / valid forward
//     this.createCurrentStep = targetStep;
// }    

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
  get staffOptions() {
    console.log('this.records1',this.records1.length);
    return (this.records1 || [])
        .filter(r => {
            const t = r.User_Type__c;   // use actual field from records
            return t === 'NDIS Org Admin' ||
                   t === 'Roster Manager' ||
                   t === 'ICT Admin' ||
                   t === 'HR Admin' ||
                   t === 'Facility Admin';
        })
        .map(r => ({
            label: r.Display_Nickname__c,
            value: r.Id
        }));
}
@track records1=[];

/* loadStaffDropdown() {
    fetchStaffForDropdown({ facilityId: this.StaffFacility })
        .then(data => {
            console.log('RAW DATA:', JSON.stringify(data));

            this.records1 = data;
             return refreshApex(this.refreshTable);

            console.log('records1:', this.records1.length);
        })
        .catch(error => {
            console.error('ERROR fetching staff:', error);
        });
} */

loadStaffDropdown() {

    fetchStaffForDropdown({ facilityId: this.StaffFacility })
        .then(data => {

            console.log('RAW DATA:', JSON.stringify(data));

            this.records1 = data;

            console.log('records1:', this.records1.length);

            // 🔥 rebuild reportsTo values
            const staffNameMap = {};

            this.records1.forEach(rec => {
                staffNameMap[rec.Id] = rec.Display_Nickname__c;
            });

            this.recordsToDisplay = this.recordsToDisplay.map(row => {

                return {
                    ...row,
                    reportsTo: row.Manager__c
                        ? staffNameMap[row.Manager__c] || '—'
                        : '—'
                };
            });

            this.records = [...this.recordsToDisplay];

            console.log(
                'Updated recordsToDisplay',
                JSON.stringify(this.recordsToDisplay)
            );
        })
        .catch(error => {
            console.error('ERROR fetching staff:', error);
        });
}


  handleTraining(event) {
    const field = event.target.name;
    this.training[field] = event.target.value;
    console.log("TRAINING" + JSON.stringify(this.training));
  }
  handleCreateTraining() {
    const { name, startDate, endDate, description, courses } = this.training;

    createTraining({
      name: name,
      startDate: startDate,
      endDate: endDate,
      description: description,
      CurrentOrgId: this.orgId,
      courses: courses.join(";") // If courses is an array, convert to semicolon-separated string
    })
      .then((result) => {
        console.log("Training Created with Id--------->", result);
        this.selectedmoduleId = result;
        // Optionally show success toast
        this.handleassignmentinsert();
      })
      .catch((error) => {
        console.error("Error creating training:", error);
        // Optionally show error toast
      });
  }

  handleSectionToggle(event) {
    const sectionId = event.currentTarget.dataset.id;
    const sectionElement = this.template.querySelector(
      `[data-section="${sectionId}"]`
    );

    if (!this.sectionFlags[sectionId]) {
      // First click: Set the section to true so it loads in the DOM
      this.sectionFlags[sectionId] = true;
    } else {
      // From second click onwards: Just toggle the hidden-section class
      sectionElement.classList.toggle("hidden-section");
    }

    // Toggle the icon dynamically
    // this.sectionIcons[sectionId] = sectionElement.classList.contains(
    //   "hidden-section"
    // )
    //   ? "\u2B9C"
    //   : "\u2B9F";
    this.sectionIcons[sectionId] =
      sectionElement.classList.contains("hidden-section")
        ? { ...ICON_LEFT }
        : { ...ICON_DOWN };


  }

  handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log("isValid", isValid);

    this.fieldErrorMap[field] = !isValid;
  }

  getFieldClass(fieldName) {
    return this.fieldErrorMap[fieldName] ? "floating-label1" : "floating-label";
  }
  get emailClass() {
    return this.getFieldClass("Email_Address__c");
  }
  get DateOfBirthClass() {
    return this.getFieldClass("Date_Of_Birth__c");
  }

  get step1Style() {
    return this.currentStep === "step1" ? "display: block;" : "display: none;";
  }
  get step2Style() {
    return this.currentStep === "step2" ? "display: block;" : "display: none;";
  }
  get step3Style() {
    return this.currentStep === "step3" ? "display: block;" : "display: none;";
  }
  get step4Style() {
    return this.currentStep === "step4" ? "display: block;" : "display: none;";
  }
  nicknameValue = '';
  preferNicknameValue = false;

  handleNicknameChange(e) {
      this.nicknameValue = e.detail.value;
  }

  handlePreferNicknameChange(e) {
      this.preferNicknameValue = e.detail.value;
  }

  handleNext1() {
    const mandatoryFields = this.template.querySelectorAll(
      '[data-id="mandatory"]'
    );
    let isValid = true;

    mandatoryFields.forEach((field) => {
      if (field.reportValidity) {
      if (!field.reportValidity()) {
        isValid = false;
      }
    }
    });

    const firstNameField = this.template.querySelector(
        'lightning-input-field[data-id="firstName"]'
    );
    const emergencyPhoneField = this.template.querySelector(
        'lightning-input-field[data-id="emergencyPhone"]'
    );

    const firstName = firstNameField?.value;
    const emergencyPhone = emergencyPhoneField?.value;
    if (!this.ictUserType) {
    // 🔴 Validation rule
      if (firstName && !emergencyPhone) {
          this.showToast(
              'Error',
              'Emergency Contact Number is required when First Name is entered.',
              'error'
          );
          return;
      } 

    if (emergencyPhone) {

        // 1️⃣ Allow only digits
        if (!/^\d+$/.test(emergencyPhone)) {
            this.showToast(
                'Error',
                'Emergency Contact Number must contain digits only.',
                'error'
            );
            return;
        }

        // 2️⃣ Must not exceed 10 digits
        if (emergencyPhone.length > 10) {
            this.showToast(
                'Error',
                'Emergency Contact Number must not exceed 10 digits.',
                'error'
            );
            return;
        }
    }

    console.log('userRole', this.userTypeRole);
    
      if (this.selctedMultipleFcailityValues.length==0) {
          isValid = false;
          this.showToast('Error', 'Please select at least one Facility', 'error');
          return;
      }  

    
      if (this.selectedRoleValues.length==0) {
          isValid = false;
          this.showToast('Error', 'Please select at least one Role', 'error');
          return;
      }  
        
      if (this.preferNicknameValue === true &&(!this.nicknameValue || this.nicknameValue.trim() === '') ) {
          this.showToast(
              'Error',
              'Please enter a Nickname when Prefer Nickname is selected.',
              'error'
          );
          return;
      }
     
    }
    if (isValid) {
      this.currentStep = "step2"; // move to next step
    }
  }

  handleprevious1() {
    this.currentStep = "step1";
  }
  handleNext2() {
    const mandatoryFields = this.template.querySelectorAll(
      '[data-id="mandatory1"]'
    );
    let isValid = true;

    mandatoryFields.forEach((field) => {
      if (!field.reportValidity()) {
        isValid = false;
      }
    });

    if (isValid) {
      this.currentStep = "step3"; // move to next step
    }
  }
  handleprevious2() {
    this.currentStep = "step2";
  }
  handleNext3() {

     if ( !this.selectedEmploymentRoleDisplayVlaue) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select a role in Employment Section before saving.',
                    variant: 'error'
                })
            );
            return; 
        }
      if(!this.ictUserType){
        if (this.genralHourlyRate === null || this.genralHourlyRate === undefined || Number.isNaN(this.genralHourlyRate)) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Hourly Rate is required.',
                    variant: 'error',
                })
            );
            return; 
        } 
      } 
    const mandatoryFields = this.template.querySelectorAll(
      '[data-id="mandatory2"]'
    );
    let isValid = true;

    mandatoryFields.forEach((field) => {
      if (!field.reportValidity()) {
        isValid = false;
      }
    });
     let hasError = false;
    if (this.uploadedFiles && this.uploadedFiles.length > 0) {
       

        this.uploadedFiles = this.uploadedFiles.map(file => {
            if (!file.typeOfDocument || file.typeOfDocument.trim() === '') {
                hasError = true;
                return { ...file, errorMessage: 'Complete this field' };
            }
            return { ...file, errorMessage: '' };
        });
      

        if (hasError) {
            return; // stop if any file is missing typeOfDocument
        }
    }

    if (isValid) {
      this.currentStep = "step4"; // move to next step
    }
  }
  handleprevious3() {
    this.currentStep = "step3";
  }

  ShowDocumentSection(event) {
    this.showStaffDocumentSection = true;
    this.ShowDataTable = false;
    this.parentStaffId = event.currentTarget.dataset.id;
    console.log("parent Id=>" + this.parentStaffId);
  }

  roleOptions = [
    { label: "Org Admin", value: "Portal Account Partner Executive" },
    { label: "Roster Admin", value: "Portal Account Partner Manager" },
    { label: "Staff", value: "Portal Account Partner User" }
  ];

  @wire(getUserRole)
  wiredUserRole({ error, data }) {
    if (data) {
      this.userTypeRole = data;
      console.log("User Type:", this.userTypeRole);
    } else if (error) {
      console.error("Error fetching user role:", error);
    }
  }

  get filteredRoleOptions() {
    console.log("this.userTypeRole===>" + this.userTypeRole);
    if (this.userTypeRole === "NDIS Org Admin") {
      return this.roleOptions;
    } else {
      return this.roleOptions.filter(
        (role) =>
          role.value === "Portal Account Partner Manager" ||
          role.value === "Portal Account Partner User"
      );
    }
  }

  handlerolechange(event) {
    this.selectedRole = event.target.value;
    // Enable the User Type combobox when a role is selected
    if (this.selectedRole) {
      this.isUserTypeDisabled = false;
    } else {
      this.isUserTypeDisabled = true;
    }
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
    /*  return [
            { label: 'Visa Status', value: 'Visa Status' },
            { label: 'Drivers Licence', value: 'Drivers Licence' },
            { label: 'Working With Vulnerable People', value: 'Working With Vulnerable People' }, 
            { label: 'Covid Immunisation', value: 'Covid Immunisation' },
            { label: 'Registration', value: 'Registration' },
            { label: 'Certificate', value: 'Certificate' },
            { label: 'Other', value: 'Other' },
        ]; */
    return [
      { label: "Visa Status", value: "Visa Status" },
      { label: "Drivers Licence", value: "Drivers Licence" },
      {
        label: "Working With Vulnerable People",
        value: "Working With Vulnerable People"
      },
      { label: "Covid Immunisation", value: "Covid Immunisation" },
      { label: "Registration", value: "Registration" },
      { label: "Certificate", value: "Certificate" },

      {
        label: "Working With Children Check (WWCC)",
        value: "Working With Children Check (WWCC)"
      },
      { label: "NDIS Worker Screening", value: "NDIS Worker Screening" },
      {
        label: "NDIS Worker Orientation Certificate",
        value: "NDIS Worker Orientation Certificate"
      },
      { label: "Signed Code of Conduct", value: "Signed Code of Conduct" },
      {
        label: "Infection Control Training",
        value: "Infection Control Training"
      },
      { label: "First Aid Certificate", value: "First Aid Certificate" },
      { label: "Qualifications", value: "Qualifications" },
      { label: "Police Check", value: "Police Check" },
      { label: "Australian Passport", value: "Australian Passport" },
      { label: "Foreign Passport", value: "Foreign Passport" },
      { label: "Medicare Card", value: "Medicare Card" },
      { label: "Birth Certificate", value: "Birth Certificate" },
      { label: "Certificate of Identity", value: "Certificate of Identity" },
      { label: "Photo ID", value: "Photo ID" },
      { label: "Proof of Age Card", value: "Proof of Age Card" },
      { label: "Rating Authority", value: "Rating Authority" },
      { label: "Citizenship Certificate", value: "Citizenship Certificate" },
      {
        label: "Change of Name Certificate",
        value: "Change of Name Certificate"
      },
      { label: "Bank Statement 1", value: "Bank Statement 1" },
      { label: "Bank Statement 2", value: "Bank Statement 2" },
      { label: "Centrelink Card", value: "Centrelink Card" },
      { label: "DVA Card", value: "DVA Card" },
      { label: "Lease Agreement", value: "Lease Agreement" },
      { label: "Marriage Certificate", value: "Marriage Certificate" },
      { label: "Utility Bill 1", value: "Utility Bill 1" },
      { label: "Utility Bill 2", value: "Utility Bill 2" },
      {
        label: "Foreign Birth Certificate",
        value: "Foreign Birth Certificate"
      },
      { label: "Indigenous Reference", value: "Indigenous Reference" },
      { label: "Other", value: "Other" }
    ];
  }

  @track showStaffDocumentSection = false;
  @api whatId;

  @track staffDocumentMap = {};
  @track showDocumentTable;
  @track DocumentTableData = [];
  @track AddDocButtonDisable = false;
  @track typeOfUser;
  @track orgId;
  @track trainingOptions = [];
  @track modules = [];
  @track selectedmoduleId;
  @track orgname;
  @track CoursesFlag = true;
  @track Courses = [];
  @track refreshKey = 0;
  @track isShowSpinner=false;

  @track DocumentColumns = [
    {
      label: "Doc No",
      fieldName: "Name",
      initialWidth: 150
    },
    {
      label: "Type of Document",
      fieldName: "Document_Type__c",
      initialWidth: 200
    },
    {
      label: "Comments",
      fieldName: "Comments__c",
      initialWidth: 200
    },
    {
      label: "Expiry Date",
      fieldName: "Expiry_Date__c",
      type: "date",
      typeAttributes: { month: "2-digit", day: "2-digit", year: "numeric" },
      initialWidth: 200
    } /* {
                label: 'View File',
                fieldName: 'View_File__c',
                type: 'url',
                initialWidth: 150
                
              }, */,
    {
      type: "action",
      label: "Action",
      initialWidth: 100,
      typeAttributes: {
        rowActions: actions
      }
    }
  ];
  
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
    @track filteredUserTypeValues = [];
        
  // connectedCallback method called when the element is inserted into a document
  connectedCallback() {

    this._handleOutsideClick = this.handleClickOutside.bind(this);
    this._handleKeyShortcut = this.handleKeyShortcut.bind(this);
    this._handleResize = this.handleResize.bind(this);
    
    this.StaffFacility = localStorage.getItem("defaultFacilityId") || "";
    window.addEventListener('click', this._handleOutsideClick);
    this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
    console.log("Staff Preferred Name:" + this.staffPreferredName)
    console.log("whatid from task" + this.whatId);
   // this.fetchMultiFaciltyOptions();
    window.addEventListener('keydown', this._handleKeyShortcut);
    window.addEventListener('resize', this._handleResize);
    this.setPageSizeByZoomAndScreen(); 
      if (this.StaffFacility) {
        this.loadStaffDropdown();
    }
     if (this.whatId) {
      this.editstaffflag = true;
      this.adminFlag = false;
      this.cardFlag = false;
      this.listFlag = false;

      this.recordId = this.whatId;
      this.dispatchEvent(
        new CustomEvent("clearstaffid", {
          bubbles: true,
          composed: true
        })
      );
    }   
 else {
      this.blurflag = true;
      this.recordId = "";
      //Platform Event
      subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then((response) => {
        console.log("Successfully subscribed to channel");
        this.subscription = response;
      });
      //this.fetchOrgDetails();
      onError((error) => {
        console.error("Received error from server: ", error);
      });
      //this.noRecordsFlag=true;
      console.log("Before Connected Callback>>" + this.selectedName);
      organizationDetails().then((response) => {
        console.log("org details" + JSON.stringify(response));
        this.orgId = response.listofPriceBook.Id;
        this.orgname = response.listofPriceBook.Name;
        this.typeOfUser = response.listofPriceBook.Type_of_User__c;
        if (this.typeOfUser == "ICT User") {
          this.ictUserType = true;
          console.log('checkingUsertype',this.ictUserType );
        } else {
          this.ictUserType = false;
          console.log('checkingUsertype2',this.ictUserType );
        }
        
            console.log("org roles  " + JSON.stringify(this.orgId));
            this.fetchTrainingModules();
          });
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

        // ✅ Load user type values
      this.loadUserTypeValues();
  }


  // ✅ Load user type values based on current user
  loadUserTypeValues() {
      console.log('=== START: loadUserTypeValues ===');
      console.log('Loading user type values for current user');
      
      getUserTypeValuesBasedOnUser()
          .then(result => {
              console.log('=== APEX CALL SUCCESS ===');
              console.log('Result received:', result);
              
              this.filteredUserTypeValues = (result || []).map(item => ({ 
                  label: item, 
                  value: item 
              }));
              
              console.log('filteredUserTypeValues set to:', this.filteredUserTypeValues);
              console.log('filteredUserTypeValues length: ' + this.filteredUserTypeValues.length);
              
              console.log('=== END: loadUserTypeValues (SUCCESS) ===');
          })
          .catch(error => {
              console.error('Error loading user type values:', error);
              this.filteredUserTypeValues = [];
              console.log('=== END: loadUserTypeValues (FAILED) ===');
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

        closeUpgradeModal() {
            this.showUpgradeModal = false;
        }

    setPageSizeByZoomAndScreen() {
        if (this.isPageSizeManuallySet) {
            return;
        }

        const width = window.innerWidth;
        let columns = 4;
        if (width < 768) {
            columns = 1;
        } else if (width < 1024) {
            columns = 2;
        } else {
            columns = 4;
        }

        // Measure heights dynamically with sensible fallbacks
        let headerHeight = 60;
        let paginationHeight = 60;
        let topOffset = 160;

        const headerEl = this.template.querySelector('.header');
        if (headerEl) {
            headerHeight = headerEl.getBoundingClientRect().height || headerEl.offsetHeight || 60;
        }
        const paginationEl = this.template.querySelector('.pagination-container');
        if (paginationEl) {
            paginationHeight = paginationEl.getBoundingClientRect().height || paginationEl.offsetHeight || 60;
        }
        const container = this.template.querySelector('.main-container');
        if (container) {
            const rect = container.getBoundingClientRect();
            if (rect.top > 0) {
                topOffset = rect.top;
            }
        }

        const screenHeight = window.innerHeight;
        // Available vertical height inside the viewport for the cards grid/table
        const availableHeight = screenHeight - topOffset - headerHeight - paginationHeight - 40; // 40px margin safety buffer

        // Approximate height of one card including spacing/padding
        const cardHeight = 175;
        let rows = Math.floor(availableHeight / cardHeight);
        if (rows < 1) {
            rows = 1;
        }

        const oldSize = this.pageSize;
        this.pageSize = rows * columns;

        console.log('--- Dynamic OS-Independent Page Size Calculation ---');
        console.log(`Viewport: ${width}x${screenHeight}, topOffset: ${topOffset}px`);
        console.log(`Header: ${headerHeight}px, Pagination: ${paginationHeight}px`);
        console.log(`Available height: ${availableHeight}px, Card height: ${cardHeight}px`);
        console.log(`Columns: ${columns}, Rows: ${rows} -> calculated pageSize: ${this.pageSize}`);

        if (this.pageSize !== oldSize) {
            this.pageNumber = 1;
            this.refreshKey++; // force wire refresh
        }
    }

    renderedCallback() {
        this._syncRecordRoute();
        if (!this._resizeObserverInit) {
            this._resizeObserverInit = true;
            const container = this.template.querySelector('.main-container');
            if (container) {
                this._resizeObserver = new ResizeObserver(() => {
                    window.requestAnimationFrame(() => {
                        this.setPageSizeByZoomAndScreen();
                    });
                });
                this._resizeObserver.observe(container);
            }
        }
    }

    handlePageSizeChange(event) {
        const selectedValue = event.target.value;
        if (selectedValue === 'Auto') {
            this.isPageSizeManuallySet = false;
            this.setPageSizeByZoomAndScreen();
        } else {
            this.isPageSizeManuallySet = true;
            this.pageSize = parseInt(selectedValue, 10);
        }
        this.pageNumber = 1; // Reset to page 1
    }

    handleResize() {
        this.setPageSizeByZoomAndScreen();
    }
  handleStaffIdChange(event) {
    this.recordId = event.detail.staffId;
    console.log("Child received staffId:", this.recordId);
  }


  fetchTrainingModules() {
    console.log("Calling getModules with orgId:", this.orgId);

    getModules({ CurrentOrgId: this.orgId })
      .then((result) => {
        console.log("Training result:", JSON.stringify(result));
        this.modules = result;
        console.log("Training result:", JSON.stringify(this.modules));
        // ✅ Ensures a new array is assigned
        this.trainingOptions = [
          ...result.map((item) => ({
            label: item.Name,
            value: item.Id
          }))
        ];

        console.log("Dropdown options:", JSON.stringify(this.trainingOptions));
      })
      .catch((error) => {
        this.error = error;
        console.error("Error fetching modules:", error);
      });
  }
  handleModuleChange(event) {
    this.selectedmoduleId = event.detail.value;
    console.log("Selected Training Module Id:", this.selectedmoduleId);
    const selectedModule = this.modules.find(
      (module) => module.Id === this.selectedmoduleId
    );
    if (selectedModule && selectedModule.Courses__c) {
      this.CoursesFlag = true;
      const CoursesArray = selectedModule.Courses__c.split(";");
      this.Courses = CoursesArray.join("\n");
    } else {
      this.Courses = [];
    }
    console.log("selected courses" + JSON.stringify(this.Courses));
  }
  handleassignmentinsert() {
    // console.log('organisation name insert :'+this.userOrgName);
    let staffid = [this.parentStaffId];

    console.log("selectedmoduleId----->" + this.selectedmoduleId);
    console.log("staffid----->" + JSON.stringify(staffid));
    console.log("orgname----->" + this.orgname);

    insertAssignRecords({
      moduleID: this.selectedmoduleId,
      selectedStaff: staffid,
      OrganizationName: this.orgname
    })
      .then(() => {
        /*   this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records inserted successfully',
                    variant: 'success'
                })
            ); */
      })
      .catch((error) => {
        // Handle error
        console.error("Error inserting record:", error);
      });
  }

  handleStaffIdChange(event) {
    this.recordId = event.detail.staffId;

    console.log("Child received staffId:", this.recordId);
  }
  triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
  }

  handleEvent = (event) => {
    const refreshRecordEvent = event.data.payload;
    if (refreshRecordEvent.RecordId__c === this.recordId) {
      this.recordId = "";
      return refreshApex(this.refreshTable);
    }
  };

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    unsubscribe(this.subscription, () => {
      console.log("Successfully unsubscribed");
    });
    window.removeEventListener('click', this._handleOutsideClick);
    window.removeEventListener('keydown', this._handleKeyShortcut);
    window.removeEventListener('resize', this._handleResize);
  }

  @wire(getUserTypeValuesfromOrg, {
    selectedroleValue: "$selectedRole",
    userId: "$userId"
  })
  wiredMultiPicklistValues({ error, data }) {
    console.log("Selected Role:", this.selectedRole);
    console.log("User ID:", this.userId);
    console.log("User Type Values received:", data);
    if (data) {
      console.log("User Type Values received:", data);
      this.UserTypeValues = data.map((item) => ({ label: item, value: item }));
    } else if (error) {
      console.error("Error fetching User Type values", error);
    }
  }

  handleUserTypeChange(event) {
      this.selectedUserType = event.target.value;
      
      // ✅ Auto-map role when user type changes
      const mapUserTypeToRole = (userType) => {
          const roleMap = {
              'NDIS Org Admin': 'Portal Account Partner Executive',
              'ICT Admin': 'Portal Account Partner Executive',
              'Facility Admin': 'Portal Account Partner Executive',
              'SC with NDIS Org Admin': 'Portal Account Partner Executive',
              'Roster Manager': 'Portal Account Partner Manager',
              'HR Admin': 'Portal Account Partner Manager',
              'Payroll Admin': 'Portal Account Partner Manager',
              'NDIS Participant': 'Portal Account Partner Manager',
              'NDIS Participants': 'Portal Account Partner Manager',
              'Payroll Accountant for Multiple': 'Portal Account Partner Manager',
              'Accountant for Organisation': 'Portal Account Partner Manager',
              'SC with Roster Manager': 'Portal Account Partner Manager',
              'NDIS Staff': 'Portal Account Partner User',
              'ICT Staff': 'Portal Account Partner User'
          };
          return roleMap[userType] || null;
      };
      
      const mappedRole = mapUserTypeToRole(this.selectedUserType);
      if (mappedRole) {
          this.selectedRole = mappedRole;
          console.log('✅ Role auto-mapped from User Type:', mappedRole);
      }
  }

 @wire(fetchStaffPaginatedData, {
    searchText: '$searchName',
    facilityId: '$StaffFacility',
    pageSize: '$pageSize',
    pageNumber: '$pageNumber',
    isActive: '$isActive',
    sortField: '$sortField',
    sortDirection: '$sortDirection',
    refreshKey: '$refreshKey'
})
wiredStaff(result) {

    this.refreshTable = result;

    if (result.data) {

        this.isShowSpinner = true;

        const records = result.data.records || [];

        // 🔹 STEP 1: Build staffNameMap (required for manager lookup)
        const staffNameMap = {};
       this.records1.forEach(rec => {
            staffNameMap[rec.Id] = rec.Display_Nickname__c;
        });
       console.log('staffNameMap',JSON.stringify(staffNameMap));
        // 🔹 RESET JSON MAP
        this.satffDataJasonformat = {};

        // 🔥 STEP 2: SINGLE MAIN LOOP
        const finalData = records.map(rec => {

            const status = rec.Staff_Status__c;

            const managerId = rec.Manager__c || '';
            const managerName = managerId ? staffNameMap[managerId] : '—';

            // 🔥 JSON MAP BUILD (moved here)
            this.satffDataJasonformat[rec.Id] = {
                uid: rec.Staff_UID__c,
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

            // 🔥 RETURN TRANSFORMED RECORD
            return {
                ...rec,

                // ✅ STATUS CLASS
                statusClass:
                    status === 'Active'
                        ? 'status-pill facility-active'
                        : status === 'Inactive'
                            ? 'status-pill facility-inactive'
                            : 'status-pill',

                // ✅ ROLES
                activeRoles: rec.StaffRoles__r
                    ? rec.StaffRoles__r.map(r => r.RoleName__c)
                    : [],

                activeRolesDisplay:
                    rec.StaffRoles__r && rec.StaffRoles__r.length > 0
                        ? rec.StaffRoles__r.map(r => r.RoleName__c).join(', ')
                        : '',

                // ✅ FACILITIES
                activeFaciltyDisplay:
                    rec.Staff_Facilities__r && rec.Staff_Facilities__r.length > 0
                        ? rec.Staff_Facilities__r
                            .map(f => f.Facility__r?.Name)
                            .filter(Boolean)
                            .join(', ')
                        : '',

                // ✅ EDITING
                isEditing: false,
                selectedStaffId: rec.Manager__c || '',
                reportsTo: managerName
            };
        });

        console.log('RESULT--> ' + JSON.stringify(finalData));

        // 🔹 ASSIGN
        this.records = finalData;
        this.recordsToDisplay = finalData;

        this.totalRecords = result.data.totalRecords;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

        this.noRecordsFlag = this.totalRecords === 0;
        this.visible = this.totalRecords > 9;


        setTimeout(() => {
            this.isShowSpinner = false;
        }, 500);

    } else if (result.error) {

        this.isShowSpinner = false;
        console.error(result.error);
    }
}

  @track assignflag=false;
  @track currentStaffId;
  @track ManagerStaffId;

  handleEditClick(event) {
    this.assignflag=true;
     this.currentStaffId = event.currentTarget.dataset.id;
      this.ManagerStaffId = event.currentTarget.dataset.manageid;
     console.log(' this.ManagerStaffId',this.ManagerStaffId);
    
}
handleAssignClose(){
  this.assignflag=false;
}

handleStaffChange(event) {
    this.ManagerStaffId = event.detail.value;
    console.log(' this.ManagerStaffId', this.ManagerStaffId);
}

/*

handleSave(event) {
  
    if (!this.ManagerStaffId) {
        this.showToast('Error', 'Please select Reporting Manager', 'error');
        return;
    }

    updateLeaveApprover({
        staffId:  this.currentStaffId,
        approverId:  this.ManagerStaffId
    })
    .then(() => {

        this.showToast('Success', 'Manager updated successfully', 'success');
        this.assignflag=false; 
    })
    .catch(error => {
        console.error(error);
        this.showToast('Error', 'Failed to update Manager', 'error');
    });
}

*/

handleSave(event) {

    if (!this.ManagerStaffId) {
        this.showToast('Error', 'Please select Reporting Manager', 'error');
        return;
    }

    updateLeaveApprover({
        staffId: this.currentStaffId,
        approverId: this.ManagerStaffId
    })
    .then(() => {

        // ✅ Update UI instantly
        const selectedManager = this.staffOptions.find(
            opt => opt.value === this.ManagerStaffId
        );

        this.recordsToDisplay = this.recordsToDisplay.map(row => {
            if (row.Id === this.currentStaffId) {
                return {
                    ...row,
                    reportsTo: selectedManager ? selectedManager.label : ''
                };
            }
            return row;
        });

        this.showToast('Success', 'Manager updated successfully', 'success');
        this.assignflag = false;
        return refreshApex(this.refreshTable);
    })
    .catch(error => {
        console.error(error);
        this.showToast('Error', 'Failed to update Manager', 'error');
    });
}

  filterState = "All";
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

        get bDisableFirst() {
            return this.pageNumber <= 1;
        }

        get bDisableLast() {
            return this.pageNumber >= this.totalPages;
        }

 
 
  @track StaffFacility = "";
 
    toggleDropdown(event) {
        event.stopPropagation(); // prevent bubbling from the button
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            // ✅ bind ensures 'this' refers to the component
            this._boundHandleClickOutside = this.handleClickOutside.bind(this);
            window.addEventListener('click', this._boundHandleClickOutside);
        } else {
            window.removeEventListener('click', this._boundHandleClickOutside);
        }
    }

    handleClickOutside(event) {
        const dropdown = this.template.querySelector('.dropdown-container'); 
        const gridElement = this.template.querySelector('.grid');
        const nationalityDropdown = this.template.querySelector('.custom-dropdown'); // nationality
        const languageDropdown = this.template.querySelector('.dropdown-container'); // language dropdown container (same class)
        const facilityBox = this.template.querySelector('.facility-dropdown');
        const path = typeof event.composedPath === 'function'
            ? event.composedPath()
            : [event.target];

        let clickedInsideDropdown = false;
        let clickedInsideGrid = false;
        let clickedInsideNationality = false;
        let clickedInsideLanguage = false;
         let clickedInsideFacility = false; 

        for (const node of path) {
            if (!node) continue;

            // Click inside role dropdown → ignore
            if (node === dropdown || (node.classList && node.classList.contains('dropdown-container'))) {
                clickedInsideDropdown = true;
            }

            // Click inside nationality dropdown → ignore
            if (node === nationalityDropdown || (node.classList && node.classList.contains('custom-dropdown'))) {
                clickedInsideNationality = true;
            }

            // Click inside language dropdown → ignore
            if (node === languageDropdown || (node.classList && node.classList.contains('dropdown-container'))) {
                clickedInsideLanguage = true;
            }

            // Click inside grid → ignore for animation
            if (node === gridElement || (node.classList && node.classList.contains('grid'))) {
                clickedInsideGrid = true;
            }
             if (node === facilityBox || (node.classList && node.classList.contains('dropdown-container'))) {
                clickedInsideFacility = true;
            }
            

            // Click inside toggle → ignore
            if (
                node.classList &&
                (node.classList.contains('toggle-input') ||
                node.classList.contains('toggle-switch-container'))
            ) {
                clickedInsideDropdown = true;
            }
        }

        // ✅ Close Roles dropdown
        if (this.isOpen && !clickedInsideDropdown) {
            this.isOpen = false;
            window.removeEventListener('click', this._boundHandleClickOutside);
        }

        // ✅ Close Nationality dropdown
        if (this.showDropdown && !clickedInsideNationality) {
            this.showDropdown = false;
            window.removeEventListener('click', this._boundHandleClickOutside);
        }

        // ✅ Close Language dropdown
        if (this.isExpanded && !clickedInsideLanguage) {
            this.isExpanded = false;
            window.removeEventListener('click', this._boundHandleClickOutside);
        }
        if (this.facilityDropDownOpen && !clickedInsideFacility) {
            this.facilityDropDownOpen = false;
            window.removeEventListener('click', this._boundHandleClickOutside);
        }

        // ✅ Handle Grid animation
        if (gridElement && !clickedInsideGrid && !path.some(node => node.tagName === 'IMG')) {
            if (gridElement.classList.contains('slide-in')) {
                gridElement.classList.remove('slide-in');
                gridElement.classList.add('slide-out');
            }
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

      const selectedValues = this.selectedRoleValues;

      console.log('selectedRoleValues ==> ', JSON.stringify(selectedValues));

      if (!selectedValues || selectedValues.length === 0) {
          return 'Select Roles';
      }

      const displayLabels = (this.roleoptionsforFacility || [])
          .filter(option => selectedValues.includes(option.displaylabel))
          .map(option => option.displaylabel);

      const result = displayLabels.join(', ');

      console.log('displayText ==> ', result);

      return result;
  }
  
    
fetchRoleOptions() {
    getRoleOptionsByFacility({ facilityIdList: this.selctedMultipleFcailityValues })
        .then(result => {
            console.log('Role options received:', JSON.stringify(result));
                        // ✅ keep previous selections
            this.selectedRoleValues = [...this.selectedRoleValues];     
            //this.selectedRoleValues = result.slice(); 
            // Build enhanced option objects (with toggle + badge)
            this.roleoptionsforFacility = result.map((role, index) => {
               // const isActive = this.selectedRoleValues.includes(role);
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



    handleToggleActive(event) {
    const optionId = event.target.dataset.optionId;
    const isChecked = event.target.checked;

    console.log("🔀 Toggle changed:", { optionId, isChecked });

    this.roleoptionsforFacility = this.roleoptionsforFacility.map(opt => {
        if (opt.id == optionId) {
            return {
                ...opt,
                checked: isChecked,
                isActive: isChecked,
                buttonClass: this.getOptionButtonClass(isChecked),
                badgeClass: this.getBadgeClass(isChecked),
                statusText: isChecked ? 'Active' : 'Inactive',
                isDisabled: !isChecked
            };
        }
        return opt;
    });

    console.log('🔄 Updated role list:', JSON.stringify(this.roleoptionsforFacility, null, 2));

    // Clear selection if the toggled role was active and is now deactivated
    const toggledOption = this.roleoptionsforFacility.find(opt => opt.id == optionId);
    if (this.selectedOption && this.selectedOption.id === optionId && !isChecked) {
        this.selectedOption = null;
        this.dispatchEvent(new CustomEvent("selectionchange", {
            detail: { selectedOption: null }
        }));
    }

    // Update selected roles (your existing method)
    this.updateSelectedRoles();
        // 🔥 update employment dropdown
    this.updateEmploymentRoles();
    window.removeEventListener('click', this.handleOutsideClick);

    // Notify parent if needed
    this.dispatchEvent(new CustomEvent("optiontoggled", {
        detail: { optionId, isChecked }
    }));
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


    handleSelectOption(event) {
        const optionId = event.target.dataset.optionId;
        const option = this.roleoptionsforFacility.find(opt => opt.id == optionId);
        if (!option) return;

        option.checked = !option.checked;
        option.statusText = option.checked ? 'Active' : 'Inactive';
        option.badgeClass = option.checked ? 'status-badge active' : 'status-badge inactive';
        console.log('🔄 Updated role list after selection:', JSON.stringify(this.roleoptionsforFacility));
        this.updateSelectedRoles();
        window.removeEventListener('click', this.handleOutsideClick);
    }//manendra for combo
  
  
  @track searchName = ""; // search input


  @track adminFlag = true;
  // async handleCreateNewStaff() {

  async handleCreateNewStaff(step) {

    console.log('Checking staff limit (HR module)...');

    try {
        const limitReached = await isStaffLimitReached();
        console.log('Staff limit reached:', limitReached);

        // 🔴 IF TRUE → SHOW MODAL & STOP
        if (limitReached) {
            this.showUpgradeModal = true;
            return; // ❗ VERY IMPORTANT
        }

    } catch (error) {
        console.error('Error checking staff limit:', error);
        this.showToast('Error', 'Something went wrong while checking limit.', 'error');
        return; // safety stop
    }

    // ✅ ONLY IF FALSE → CONTINUE YOUR EXISTING LOGIC

    this.StaffFacility = localStorage.getItem("defaultFacilityId") || "";
    this.fieldErrorMap = {};
    this.recordId = "";
    this.street = "";
    this.city = "";
    this.country = "";
    this.province = "";
    this.postalcode = "";
    this.preTaxForSubmit = 0;
    this.postTaxLabelvalue = 0;
    this.staffEditFlag = true;
    // this.currentStep = "step1";

    let stepVal = (typeof step === 'string') ? step : 'createstep1';
    if (stepVal && !stepVal.startsWith('create')) {
        stepVal = 'create' + stepVal;
    }
    this.createCurrentStep = stepVal;
    this.currentStep = stepVal.replace('create', '');    
    this.blurflag = true;
    this.heading = false;
    this.AddDocButtonDisable = true;
    this.primaryApproverValue = false;
    this.secondaryApproverValue = false;
    this.submitButtonlabel = "Save";
    this.confirmEmailError = "";
    this.primaryEmailError = false;
    this.secondaryEmailError = false;
    this.errorMessage = "";
    this.saveButtonDisable = false;
    this.fileName = "";
    this.cardFlag = false;
    this.listFlag = true;
    this.adminFlag = true;
    this.visible = false;
    this.pretaxOne = 0;
    this.pretaxtwo = 0;
    this.pretaxThree = 0;
    this.pretaxFour = 0;
    this.pretaxFive = 0;
     this.superannuationValue = 'Exclude Superannuation';

    this.training = {
        name: "",
        startDate: "",
        endDate: "",
        description: "",
        courses: []
    };

    this.CoursesFlag = true;
    this.selectedmoduleId = "";

    this.categoryType = "";
    this.jobType = "";
    this.classificationLevel = "";
    this.classificationPayType = "";
    this.createdShiftRole = "";
    this.genralHourlyRate = 0;
    this.sturdayHourlyRat = 0;
    this.sundayhourlyRate = 0;
    this.publicHolidayRate = 0;
    this.afterNoonShiftRate = 0;
    this.nightShiftRate = 0;
    this.standardWeeklyRate = 0;

    this.allowanceMethod = 'Fixed';
    this.oneBreakAllowance = 0;
    this.twoBreakAllowance = 0;
    this.sleepoverAllowance = 0;

    this.applyAllowanceLogic();

    this.paidBreak = true;

    if (this.typeOfUser == "ICT User") {
        this.ictUserType = true;
    } else {
        this.ictUserType = false;
    }

    this.geoLocationStatus = false;

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
    this.selectedRoleValues = [];
    this.roleoptionsforFacility = [];
    this.selctedMultipleFcailityValues = [];

    this.fetchMultiFaciltyOptions();
    this.toggleValue = true;

    this.emailId = '';
}

showToast(title, message, variant) {
    this.dispatchEvent(
        new ShowToastEvent({
            title,
            message,
            variant
        })
    );
}

  get isDesktop() {
    //alert(FORM_FACTOR);
    return FORM_FACTOR === "Large";
  }

  get isMobile() {
    return FORM_FACTOR === "Small";
  }
  get animationclass() {
    return this.template ? "right-align" : "right-align-reverse";
  }

  // @track editstaffflag = false;
  _editstaffflag = false;
  
  @track showDescription2 = false;
  @track showDescription3 = false;
  @track showDescription4 = false;
  @track showDescription5 = false;
  @track delete2 = false;
  @track delete3 = false;
  @track delete4 = false;
  @track delete5 = false;

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
    this.handlePreTaxChange({ target: { name: "" } });
  }
  handleEditStaff(event) {
    let facId = event.currentTarget.dataset.id;
     console.log('Staff Id in HR staff ', facId);
        this.loadStaffData(facId);
  }

  loadStaffData(facId) {
    console.log('loadStaffData in HR staff calling');
    this.recordId = facId;
    console.log('Staff Id in loadStaffData', this.recordId);
    this.editstaffflag = true;
    this.adminFlag = false;
    this.listFlag = false;
    this.cardFlag = false;
    this.totalRecords = 0;
    this.parentStaffId = facId;
    this.staffEditFlag = false;
    this.submitButtonlabel = "Update";
    this.heading = true;
    this.AddDocButtonDisable = false;
    this.confirmEmailError = "";
    this.primaryEmailError = false;
    this.secondaryEmailError = false;
    this.errorMessage = "";
    this.saveButtonDisable = false;
    this.fileName = "";
    this.addingPreTax();

    console.log("Staff Id" + facId);
    this.street = this.satffDataJasonformat[facId]["street"];
    this.city = this.satffDataJasonformat[facId]["city"];
    this.country = this.satffDataJasonformat[facId]["countryCode"];
    this.province = this.satffDataJasonformat[facId]["stateCode"];
    this.postalcode = this.satffDataJasonformat[facId]["postalCode"];
    this.pretaxOne = this.satffDataJasonformat[facId]["pretaxone"];
    this.pretaxtwo = this.satffDataJasonformat[facId]["pretaxtwo"];
    this.pretaxThree = this.satffDataJasonformat[facId]["pretaxThree"];
    this.pretaxFour = this.satffDataJasonformat[facId]["pretaxFour"];
    this.pretaxFive = this.satffDataJasonformat[facId]["pretaxFive"];
    this.primaryApproverValue = this.satffDataJasonformat[facId]["primaryVal"];
    this.secondaryApproverValue =
      this.satffDataJasonformat[facId]["secondaryVal"];

    /* this.status = this.satffDataJasonformat[facId]["status"]; */
    let voluntaryContribution =
      this.satffDataJasonformat[facId]["voluntaryContribution"];
    this.voluntaryContributionCureencyVal =
      this.satffDataJasonformat[facId]["ContributionCurrency"];
    this.voluntaryContributionPercentVal =
      this.satffDataJasonformat[facId]["ContributionPercent"];
    if (voluntaryContribution == "Fixed") {
      this.VoluntaryContributionCurrency = true;
      this.VoluntaryContributionPercent = false;
    } else {
      this.VoluntaryContributionPercent = true;
      this.VoluntaryContributionCurrency = false;
    }
    console.log(
      "contribution in fixed" + this.voluntaryContributionCureencyVal
    );
    console.log("contribution in %" + this.voluntaryContributionPercentVal);
    this.preTaxForSubmit = this.satffDataJasonformat[facId]["preTaxvalue"];
    if (this.satffDataJasonformat[facId]["preTaxvalue"]) {
      this.totalPretaxvalue =
        "Pre Tax Deduction - Total " +
        this.satffDataJasonformat[facId]["preTaxvalue"];
    } else {
      this.totalPretaxvalue = "Pre Tax Deduction - Total " + 0;
    }
    if (this.satffDataJasonformat[facId]["postTax"]) {
      this.postTaxlabel =
        "Post Tax Deduction - Total " +
        this.satffDataJasonformat[facId]["postTax"];
    } else {
      this.postTaxlabel = "Post Tax Deduction - Total " + 0;
    }
    console.log("pagename" + this.pageName);
   
        localStorage.setItem('hrStaffRecordId', this.recordId);
        console.log('hrStaffRecordId Stored in localStorage:', this.recordId);  
  }
  childevent(event) {
   // localStorage.removeItem('hrStaffRecordId');
    localStorage.removeItem('adminStaffRecordId'); //manendra
    console.log("this.selectedName >>", this.selectedName);
    console.log("this.firstname >>", this.firstname);
    console.log("this.lastname >>", this.lastname);
    this.editstaffflag = false;
    this.adminFlag = true;
    this.cardFlag = false;
    this.listFlag = true;
 this.recordId = null; //manendra
    this.selectedName = this.selectedName + "";
    console.log("this.selectedName >>", this.selectedName);
    console.log("this.firstname >>", this.firstname);
    console.log("this.lastname >>", this.lastname);
 //   refreshApex(this.refreshTable);
    this.refreshKey++; 
    
  }

  handlePreTaxChange(event) {
    if (event.target.name == "name") {
      this.name = event.detail.value;
    }
    if (event.target.name == "lastname1") {
      this.lastname1 = event.detail.value;
    }
    if (event.target.name == "PreTaxonevalue") {
      this.pretaxOne = event.target.value;
    }
    if (event.target.name == "PreTaxTwovalue") {
      this.pretaxtwo = event.target.value;
    }
    if (event.target.name == "pretaxthreevalue") {
      this.pretaxThree = event.target.value;
    }
    if (event.target.name == "pretaxFourvalue") {
      this.pretaxFour = event.target.value;
    }
    if (event.target.name == "pretaxFivevalue") {
      this.pretaxFive = event.target.value;
    }
    if (
      this.pretaxOne == "" ||
      this.pretaxOne == undefined ||
      this.pretaxOne == null
    ) {
      this.pretaxOne = 0;
    }
    if (
      this.pretaxtwo == "" ||
      this.pretaxtwo == undefined ||
      this.pretaxtwo == null
    ) {
      this.pretaxtwo = 0;
    }
    if (
      this.pretaxThree == "" ||
      this.pretaxThree == undefined ||
      this.pretaxThree == null
    ) {
      this.pretaxThree = 0;
    }
    if (
      this.pretaxFour == "" ||
      this.pretaxFour == undefined ||
      this.pretaxFour == null
    ) {
      this.pretaxFour = 0;
    }
    if (
      this.pretaxFive == "" ||
      this.pretaxFive == undefined ||
      this.pretaxFive == null
    ) {
      this.pretaxFive = 0;
    }

    this.preTaxForSubmit =
      parseFloat(this.pretaxOne) +
      parseFloat(this.pretaxtwo) +
      parseFloat(this.pretaxThree) +
      parseFloat(this.pretaxFour) +
      parseFloat(this.pretaxFive);

    this.totalPretaxvalue = "Pre Tax Deduction - Total " + this.preTaxForSubmit;

    if (event.target.name == "totalPreTax") {
      this.preTaxForSubmit = event.target.value;
    }
    if (
      this.preTaxForSubmit == "" ||
      this.preTaxForSubmit == undefined ||
      this.preTaxForSubmit == null
    ) {
      this.preTaxForSubmit = 0;
    }
  }
  handlePosttaxChange(event) {
    if (event.target.name == "posttax") {
      this.postTaxLabelvalue = event.target.value;
    }
    if (
      this.postTaxLabelvalue == "" ||
      this.postTaxLabelvalue == undefined ||
      this.postTaxLabelvalue == null
    ) {
      this.postTaxLabelvalue = 0;
    }
    this.postTaxlabel =
      "Post Tax Deduction - Total " + parseFloat(this.postTaxLabelvalue);
  }

  addressInputChange(event) {
    const address = event.detail;
    if (
      !address.street ||
      !address.city ||
      !address.postalCode ||
      !address.province
    ) {
      this.errorMessage = "Please provide complete address information.";
      this.saveButtonDisable = true;
    } else {
      this.errorMessage = "";
      this.saveButtonDisable = false;
      console.log("event detail" + JSON.stringify(event.detail));
      this.street = event.detail.street;
      this.city = event.detail.city;
      this.postalcode = event.detail.postalCode;
      this.province = event.detail.province;
      this.country = event.detail.country;
      console.log("poscid", this.province);
      console.log("poscid2", this.postalcode);
      console.log("poscid3", this.city);
    }
  }


    handleRoleOptionsChange(event) {
        // For combobox / dual-listbox, event.detail.value gives selected value(s)
        this.selectedRoleValues = event.detail.value;

        console.log('🔄 [handleRoleOptionsChange] Fired');
        console.log('📥 Raw event.detail.value:', JSON.stringify(event.detail.value));
        console.log('📦 this.selectedRoleValues (after assign):', JSON.stringify(this.selectedRoleValues));

        if (this.selectedRoleValues && this.selectedRoleValues.length > 0) {
            console.log('✅ At least one value selected');

            // Convert plain values into combobox option objects
            this.selectedRoleEmploymentValues = this.selectedRoleValues.map(val => ({
                label: val,
                value: val
            }));

            console.log('🎯 Built role options for combobox:', JSON.stringify(this.selectedRoleEmploymentValues));
        } else {
            console.log('⚠️ No values selected, clearing selectedRoleEmploymentValues');
            this.selectedRoleEmploymentValues = [];
        }

        console.log('🏁 [handleRoleOptionsChange] END');
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
      { label: 'Occupational Health Nurse - level 3', value: 'Occupational Health Nurse - level 3' },
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
    this.isattachError = false;
    if (event.target.files.length > 0) {
      this.selectedFilesToUpload = event.target.files;
      this.file = this.selectedFilesToUpload[0];
      this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
      this.fileType = this.selectedFilesToUpload[0].type;
      this.fileSize = this.selectedFilesToUpload[0].size;

      if (
        this.file.size > this.MAX_FILE_SIZE ||
        this.file.size < this.MIN_FILE_SIZE
      ) {
        this.isattachError = true;
      }
      //create an intance of File
      this.fileReaderObj = new FileReader();

      //this callback function in for fileReaderObj.readAsDataURL
      this.fileReaderObj.onloadend = () => {
        //get the uploaded file in base64 format
        let fileContents = this.fileReaderObj.result;
        fileContents = fileContents.substr(fileContents.indexOf(",") + 1);

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
          for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
          }
          byteArrays[sliceIndex] = new Uint8Array(bytes);
        }

        //from arraybuffer create a File instance
        this.myFile = new File(byteArrays, this.fileName, {
          type: this.fileType
        });

        //callback for final base64 String format
        let reader = new FileReader();
        reader.onloadend = () => {
          let base64data = reader.result;
          this.base64FileData = base64data.substr(base64data.indexOf(",") + 1);
        };
        reader.readAsDataURL(this.myFile);
      };
      this.fileReaderObj.readAsDataURL(this.file);
    }
    this.showSpinner = false;
    console.log("fileName>>", this.fileName);
    console.log("file prepared");
  }

  handleSubmit(event) {
      console.log("in submit");
      event.preventDefault(); // stop the form from submitting
      
      console.log('this.selctedMultipleFcailityValues', this.selctedMultipleFcailityValues);

      // Validate Contacts
      for (let i = 0; i < this.contactList.length; i++) {
          const row = this.contactList[i];
          const firstName = row.firstName ? row.firstName.trim() : '';
          const phoneRaw = row.contactNumber ? row.contactNumber.toString() : '';
          const email = row.email ? row.email.trim() : '';
          const phone = phoneRaw.replace(/\D/g, '');

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

      const fields = event.detail.fields;
      
      // ✅ Address fields
      fields.Address__Street__s = this.street;
      fields.Address__City__s = this.city;
      fields.Address__StateCode__s = this.province;
      fields.Address__CountryCode__s = "AU";
      fields.Address__PostalCode__s = this.postalcode;
      
      // ✅ Role fields
      fields.SelectedRole__c = this.selectedRole;
      fields.Nationality__c = this.Nationality;
      fields.SelectedRole__c = this.selectedEmploymentRole + '-' + this.selectedDropDownFacilityValue;
      fields.Languages__c = this.selectedLangs ? this.selectedLangs.join('; ') : '';
      fields.Status__c = this.toggleValue;
      
      // ✅ Facility - Handle multiple facilities
      // If you need to store multiple facilities, you might need a separate junction object
      // For now, take the first facility as primary
      if (this.selctedMultipleFcailityValues && this.selctedMultipleFcailityValues.length > 0) {
          // ✅ Only set the first facility ID (or handle accordingly)
          fields.Facility__c = this.selctedMultipleFcailityValues[0];
          console.log('✅ Primary Facility ID:', fields.Facility__c);
          console.log('✅ All Facility IDs:', this.selctedMultipleFcailityValues);
      } else {
          // If no facility selected, show error
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Error',
                  message: 'Please select at least one facility.',
                  variant: 'error'
              })
          );
          return;
      }
      
      // ✅ Superannuation
      fields.Superannuation_Inc_or_Exc__c = this.superannuationValue;
      
      // ✅ State mapping
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
      fields.State__c = stateMapAU[this.province];
      
      // ✅ Awards handling
      if (this.isNursingAwards == true) {
          fields.Fixed_Rate_or_Not__c = false;
          fields.Category_Type__c = null;
          fields.Classification_Level__c = null;
          fields.Classification_Pay_Point__c = null;
      }
      if (this.isSchadsAwards == true) {
          fields.Nursning_Awards__c = false;
          fields.Nursing_Category_Type__c = null;
          fields.Nursing_Classification_Level__c = null;
          fields.Nursing_Classification_Pay_Point__c = null;
      }
      
      // ✅ Geolocation
      fields.Enable_Geolocation__c = this.geoLocationStatus;
      
      // ✅ Voluntary Contribution
      if (this.voluntaryContributionCureencyVal == undefined) {
          this.voluntaryContributionCureencyVal = 0;
      }
      if (this.voluntaryContributionPercentVal == undefined) {
          this.voluntaryContributionPercentVal = 0;
      }
      fields.Voluntary_Contribution_Fixed__c = this.voluntaryContributionCureencyVal;
      fields.Voluntary_Contribution_Percent__c = this.voluntaryContributionPercentVal;
      fields.Type_of_User__c = this.typeOfUser;
      
      console.log("After fields>>" + JSON.stringify(fields));
      
      // ✅ Submit the form
      this.template.querySelector("lightning-record-edit-form").submit(fields);
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
      message: "Employee created successfully.",
      variant: "success"
    });
    this.dispatchEvent(toastEvent);
    this.staffEditFlag = false;
    let staffRecID = event.detail.id;
    this.portalStaffId = event.detail.id;
    this.parentStaffId = event.detail.id;
    this.confirmEmailError = "";
    this.primaryEmailError = false;
    this.secondaryEmailError = false;
    this.cardFlag = false;
    this.adminFlag = true;
    this.visible = true;
    this.currentStep = "step1";
    console.log(
      "file base64 in success=>" + JSON.stringify(this.base64FileData)
    );
    console.log("Record in success=>" + this.parentStaffId);
    console.log("File in success=>" + this.fileName);
    this.CreateUserflag = true;
    console.log("staff create user falg " + this.CreateUserflag);
     console.log(' Roles to sync:', JSON.stringify(this.selectedRoleValues));
     refreshApex(this.refreshTable);

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
   
    
    console.log("after success +");
    setTimeout(() => {
      this.showSpinner = false;
      this.addingPreTax();
    }, 2000);
     this.accountRecList = this.uploadedFiles;
    if (this.accountRecList.length > 0) {
      this.handleSubmitDocuments();
    }
    if (this.selectedmoduleId) {
      this.handleassignmentinsert();
    } else if (this.training) {
      console.log("MODULE------------------------------------");
      this.handleCreateTraining();
    }
    // console.log('file length'+this.fileName.length);
    // console.log('base64Data>>', JSON.stringify(this.base64FileData ));
    if (this.fileName.length > 0) {
      uploadFile({
        base64: JSON.stringify(this.base64FileData),
        filename: this.fileName,
        recordId: staffRecID,
        obj: "staff"
      })
        .then((result) => {
          console.log("Upload result = " + result);
          //this.fileName = this.fileName + ' - Uploaded Successfully';
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success!!",
              message: this.file.name + " - Uploaded Successfully!!!",
              variant: "Success"
            })
          );
          refreshApex(this.refreshTable);
          this.CreateUserflag = true;
        })
        .catch((error) => {
          window.console.log(error);
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Error in uploading File",
              message: error.message,
              variant: "error"
            })
          );
          this.showSpinner = false;
        });
    }

    setTimeout(() => {
      this.showSpinner = false;
      this.addingPreTax();
    }, 2000);
  }
  handleConfirmReset(event) {
    this.userCrearedflag = true;
    this.CreateUserflag = false;
  }

  handlecreateuser(event) {
    // ⭐ ROLE MAPPING FUNCTION
    const mapUserTypeToRole = (userType) => {
        const roleMap = {
            'NDIS Org Admin': 'Portal Account Partner Executive',
            'ICT Admin': 'Portal Account Partner Executive',
            'Facility Admin': 'Portal Account Partner Executive',
            'SC with NDIS Org Admin': 'Portal Account Partner Executive',
            'Roster Manager': 'Portal Account Partner Manager',
            'HR Admin': 'Portal Account Partner Manager',
            'Payroll Admin': 'Portal Account Partner Manager',
            'NDIS Participant': 'Portal Account Partner Manager',
            'NDIS Participants': 'Portal Account Partner Manager',
            'Payroll Accountant for Multiple': 'Portal Account Partner Manager',
            'Accountant for Organisation': 'Portal Account Partner Manager',
            'SC with Roster Manager': 'Portal Account Partner Manager',
            'NDIS Staff': 'Portal Account Partner User',
            'ICT Staff': 'Portal Account Partner User'
        };
        return roleMap[userType] || null;
    };

    console.log('=== handlecreateuser START ===');
    console.log('Selected User Type:', this.selectedUserType);
    console.log('Selected Role before mapping:', this.selectedRole);

    // ✅ Map User Type to Role if role is not already set
    let mappedRole = this.selectedRole;
    if (!mappedRole || mappedRole === '') {
        mappedRole = mapUserTypeToRole(this.selectedUserType);
        this.selectedRole = mappedRole;
        console.log('✅ Role mapped from User Type:', mappedRole);
    }

    // ✅ Validate that we have a role
    if (!mappedRole || mappedRole === '') {
        console.error('❌ No role found for User Type:', this.selectedUserType);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: `No role found for User Type: ${this.selectedUserType}`,
                variant: 'error',
            })
        );
        return;
    }

    console.log('📤 Calling createUser with:');
    console.log('  - StaffId:', this.portalStaffId);
    console.log('  - selectedRole:', mappedRole);
    console.log('  - selectedUserType:', this.selectedUserType);

    this.CreateUserflag = false;

    createUser({
        StaffId: this.portalStaffId,
        selectedRole: mappedRole,
        selectedUserType: this.selectedUserType
    })
    .then(result => {
        console.log('✅ Success: ' + JSON.stringify(result));
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Account created. Please check your mail.',
                variant: 'success',
            })
        );
        
        // Reset fields on success
        this.userCrearedflag = false;
        this.selectedUserType = '';
        this.selectedRole = '';
        
        // Navigate back if needed
        if (this.createStaffForXeroOnly || this.createStaffForXeroAll) {
            const cancelEvent = new CustomEvent('backtoxero', {
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(cancelEvent);
        }
    })
    .catch(err => {
        console.error('❌ Error: ' + JSON.stringify(err));
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: err.body ? err.body.message : 'Failed to create user.',
                variant: 'error',
            })
        );
        this.CreateUserflag = true; // Re-enable button on error
    })
    .finally(() => {
        console.log('=== handlecreateuser END ===');
    });
}

  handleCloseModal(event) {
    if (!this.portalStaffId) {
      console.error("Error: StaffId is missing!");
      return;
    }
    updatestaff({
      StaffId: this.portalStaffId
    })
      .then((result) => {
        console.log("Success: " + JSON.stringify(result));
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success!!",
            message: "Employee created successfully.",
            variant: "success"
          })
        );
      })
      .catch((err) => {
        console.error("Error: " + JSON.stringify(err));
      });

    this.selectedUserType = "";
    this.selectedRole = "";
    this.CreateUserflag = false;
    this.userCrearedflag = false;
  }

  handleeditClose() {
    this.staffEditFlag = false;
    this.cardFlag = false;
    this.adminFlag = true;
    this.visible = true;
    this.listFlag = true;
    this.Nationality = '';
  }
  
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
 

  @track handleStatusFlag = false;
  @track facId;
  @track facstatus;
  @track message;
  @track originalToggleState;
  @track toggleElement;
  @track finalstatus;
  @track staffname;
  @track toggleValue = false;
    handleStatus(event) {
        this.toggleValue = event.target.checked; 
        
        console.log('Toggle status:', this.toggleValue);

    }
  handlefacStatus(event) {
    this.toggleElement = event.target;
    this.handleStatusFlag = true;
    this.facId = event.currentTarget.dataset.id;
    this.facstatus = event.target.dataset.name;
    this.staffname = event.target.dataset.staffname;
    this.originalToggleState = this.facstatus;

    if (this.facstatus == "true") {
      this.finalStatus = "false";
      this.message = "Staff is Inactive";
    } else if (this.facstatus == "false") {
      this.finalStatus = "true";
      this.message = "Staff is Active";
    }
  }

  handlestatuschange() {
    statusStaff({ IdValue: this.facId, status: this.finalStatus })
      .then((response) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "",
            message: this.message,
            variant: "success"
          })
        );

        this.handleStatusFlag = false;

        return refreshApex(this.refreshTable);
      })
      .catch((error) => {
        this.showSpinner = false;
        console.error("Error updating status:", error);
      });
  }
  handlestatusclose() {
    const element = this.template.querySelector("[data-id=" + this.facId + "]");
    console.log("original state", this.originalToggleState);
    console.log("if1 condition");
    console.log("element", JSON.stringify(element.checked));
    if (this.originalToggleState == "true") {
      element.checked = this.originalToggleState;
      console.log("if condition");
      // this.recordsToDisplay = [];

      // this.handlesave();
    } else {
      console.log("else condition");
      element.checked = !this.originalToggleState;
    }
    console.log("element", JSON.stringify(element.checked));

    this.handleStatusFlag = false;
  }

  @track listFlag = true;

  get cardViewClass() {
    return this.cardFlag
      ? "slds-box slds-size_1-of-6 slds-align_absolute-center slds-theme_inverse"
      : "slds-box slds-size_1-of-6  slds-align_absolute-center"; // you can use your custom class here.
    //'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse' : 'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse'
  }

  get listViewClass() {
    return this.listFlag
      ? "slds-box slds-size_1-of-6  slds-align_absolute-center slds-theme_inverse"
      : "slds-box slds-size_1-of-6 slds-align_absolute-center"; // you can use your custom class here.
  }

  handleChange(event) {
    this.value = event.target.dataset.name;
    if (this.value == "cardview") {
      this.cardFlag = true;
      this.listFlag = false;
    } else if (this.value == "listview") {
      this.cardFlag = false;
      this.listFlag = true;
    }
  }

  handleChange1(event) {
    let inputValue = event.target.value;
    inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
    event.target.value = inputValue;
  }

  handleInputChange(event) {
    let index = event.target.dataset.id;
    let fieldName = event.target.name;
    let value = event.target.value;
    for (let i = 0; i < this.accountRecList.length; i++) {
      if (this.accountRecList[i].index === parseInt(index)) {
        this.accountRecList[i][fieldName] = value;
      }
    }
  }
  createRow(accountRecList) {
    let accountObject = {};
    if (accountRecList.length > 0) {
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

  addDocumentRow() {
    this.createRow(this.accountRecList);
  }
  removeRow(event) {
    let toBeDeletedRowIndex = event.target.name;
    console.log(toBeDeletedRowIndex);
    let accountRecList = [];
    for (let i = 0; i < this.accountRecList.length; i++) {
      let tempRecord = Object.assign({}, this.accountRecList[i]); //cloning object
      console.log(tempRecord);
      if (tempRecord.index !== toBeDeletedRowIndex) {
        accountRecList.push(tempRecord);
      }
    }
    for (let i = 0; i < accountRecList.length; i++) {
      accountRecList[i].index = i + 1;
    }
    this.accountRecList = accountRecList;
  }

  handleRowActions(event) {
    const row = event.detail.row;
    this.preTaxRecId = row.Id;
    this.parentStaffId = row.Staff__c;
    const actionName = event.detail.action.name;
    switch (actionName) {
      case "delete":
        deleteRecord(row.Id)
          .then(() => {
            this.dispatchEvent(
              new ShowToastEvent({
                title: "Success",
                message: "Staff Document has been deleted",
                variant: "success"
              })
            );
            refreshApex(this.refreshTable);
            this.addingPreTax();
          })
          .catch((error) => {
            console.log("error=>" + JSON.stringify(error));
          });
        break;

      case "edit":
        this.showPreTaxRecordEditForm = true;
        break;
      case "view_details":
        event.preventDefault();
        const url = row.View_File__c;
        this.currentUrl = url;
        // console.log('file url  '+ this.currentUrl);
        this.isModalOpen = true;
        const fileType = this.getFileType(this.currentUrl);

        //console.log('file type: ' + fileType);
        // Check if the file type is not PNG or PDF
        if (
          fileType !== "png" &&
          fileType !== "pdf" &&
          fileType !== "jpeg" &&
          fileType !== "csv" &&
          fileType !== "svg"
        ) {
          setTimeout(() => {
            this.closeModal();
          }, 1700);
        }
        break;
    }
  }

  closePreTaxRecordEditForm(event) {
    this.showPreTaxRecordEditForm = false;
  }
  handlePreTaxSuccess(event) {
    this.preTaxRecId = event.detail.id;
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Success!!",
        message: "Changes Saved Successfully !!",
        variant: "success"
      })
    );
    this.showPreTaxRecordEditForm = false;
    setTimeout(() => {
      this.showSpinner = false;
      this.addingPreTax();
    }, 2000);
    if (this.fileName.length > 0) {
      this.showSpinner = true;
      console.log(
        "file base64 in success=>" + JSON.stringify(this.base64FileData)
      );
      console.log("Record in success=>" + this.preTaxRecId);
      console.log("File in success=>" + this.fileName);

      console.log("file length" + this.fileName.length);
      // console.log('base64Data>>', JSON.stringify(this.base64FileData ));
      uploadFile({
        base64: JSON.stringify(this.base64FileData),
        filename: this.fileName,
        recordId: this.preTaxRecId,
        obj: "ChildStaff"
      })
        .then((result) => {
          console.log("Upload result = " + result);
          //this.fileName = this.fileName + ' - Uploaded Successfully';
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Success!!",
              message: this.file.name + " - Uploaded Successfully!!!",
              variant: "success"
            })
          );
        })
        .catch((error) => {
          window.console.log(error);
          this.dispatchEvent(
            new ShowToastEvent({
              title: "Error in uploading File",
              message: error.message,
              variant: "error"
            })
          );
          this.showSpinner = false;
        });
    }

    setTimeout(() => {
      this.addingPreTax();
      this.showSpinner = false;
    }, 3000);
    this.accountRecList = [];
  }

  handlePreTaxRecordFormSubmit() {
    this.template
      .querySelector('lightning-record-edit-form[data-recid="PreTaxForm"]')
      .submit(fields);
  }

  addingPreTax() {
    console.log("Parent record Id " + this.parentStaffId);

    fetchStaff({ recordId: this.parentStaffId }).then((response) => {
      console.log("satff list after save" + JSON.stringify(response));
      this.satffDataJasonformat[response.Id] = {
        uid: response.Staff_UID__c,
        street: response.Address__Street__s,
        city: response.Address__City__s,
        stateCode: response.Address__StateCode__s,
        countryCode: response.Address__CountryCode__s,
        postalCode: response.Address__PostalCode__s,
        childRecords: response.Child_Staffs__r,
        preTaxvalue: response.Pre_Tax_Calculator__c,
        pretaxone: response.Pre_Tax_One_Value__c,
        pretaxtwo: response.Pre_Tax_Two_Value__c,
        pretaxThree: response.Pre_Tax_Three_Value__c,
        pretaxFour: response.Pre_Tax_Four_Value__c,
        pretaxFive: response.Pre_Tax_Five_Value__c,
        postTax: response.Post_Tax__c,
        primaryVal: response.Make_Primary_as_Approver__c,
        secondaryVal: response.Make_Secondary_as_Approver__c,
        voluntaryContribution: response.Voluntary_Contribution__c,
        ContributionCurrency: response.Voluntary_Contribution_Fixed__c,
        ContributionPercent: response.Voluntary_Contribution_Percent__c,
        status: response.Status__c
      };
      let childRec = response.Child_Staffs__r || []; // ✅ fallback to empty array

      this.DocumentTableData = [];

      childRec.forEach(rec => {
          if (rec.Document_Type__c) {
              this.DocumentTableData.push(rec);
          }
      });
    });
  }

  ShowDocumentSection(event) {
    this.showStaffDocumentSection = true;
    this.parentStaffId = event.currentTarget.dataset.id;
    console.log("parent Id=>" + this.parentStaffId);
  }
  closeDocumentSection() {
    this.showStaffDocumentSection = false;
  }

  handleDocumentchange(event) {
    let index = event.target.dataset.id;
    let fieldName = event.target.name;
    let value = event.target.value;
    if (fieldName == "file") {
      this.onDocumentUpload(event)
        .then((filedata) => {
          for (let i = 0; i < this.accountRecList.length; i++) {
            if (this.accountRecList[i].index === parseInt(index)) {
              this.accountRecList[i]["fileName"] = filedata.fileName;
              this.accountRecList[i]["base64Data"] = JSON.stringify(
                filedata.base64Data
              );
            }
          }
          console.log("file data=>" + JSON.stringify(this.accountRecList));
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } else {
      for (let i = 0; i < this.accountRecList.length; i++) {
        if (this.accountRecList[i].index === parseInt(index)) {
          this.accountRecList[i][fieldName] = value;
        }
      }
    }
    console.log("file data=>" + JSON.stringify(this.accountRecList));
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
        reject("File size out of range");
        return;
      }

      let fileReaderObj = new FileReader();
      fileReaderObj.onloadend = () => {
        let fileContents = fileReaderObj.result;
        fileContents = fileContents.substr(fileContents.indexOf(",") + 1);

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
          let base64FileData = base64data.substr(base64data.indexOf(",") + 1);
          resolve({ fileName: fileName, base64Data: base64FileData });
        };
        reader.readAsDataURL(myFile);
      };
      fileReaderObj.readAsDataURL(file);

      this.showSpinner = false;
      console.log("file prepared");
    });
  }

  handleSubmitDocuments() {
    this.showSpinner = true;
     let hasError = false;

    this.uploadedFiles = this.uploadedFiles.map(file => {
        if (!file.typeOfDocument) {
            hasError = true;
            return { ...file, errorMessage: 'Complete this field' };
        }
        return { ...file, errorMessage: '' };
    });

    if (hasError) {
        return; // ❌ Stop submission
    }
  this.accountRecList = this.uploadedFiles;

  /*   this.accountRecList.forEach((item) => {
      this.staffDocumentMap[item.fileName] = item.base64Data;
    }); */
    console.log("staffMap=>" + JSON.stringify(this.uploadedFiles));
    insertPreTax({
        JsonString: JSON.stringify(this.accountRecList),
        staffID: this.parentStaffId,
        isPretax: false
    })
    .then((result) => {
        console.log("Insert result => " + JSON.stringify(result));

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Success!!",
                message: "Documents inserted successfully",
                variant: "success"
            })
        );

        this.showSpinner = false;
        this.accountRecList = [];
        this.staffEditFlag = false;
        this.showStaffDocumentSection = false;
        this.showPreTaxRecordEditForm = false;

        refreshApex(this.refreshTable);
    })
    .catch((error) => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: "Error in inserting documents",
                message: error.message,
                variant: "error"
            })
        );
        console.error("Insert error => " + JSON.stringify(error));
        this.showSpinner = false;
        this.showStaffDocumentSection = false;
        this.showPreTaxRecordEditForm = false;
        this.staffEditFlag = false;
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

  @track primaryApproverValue = false;
  @track secondaryApproverValue = false;
  @track VoluntaryContributionCurrency = false;
  @track VoluntaryContributionPercent = false;
  @track voluntaryContributionCureencyVal = 0;
  @track voluntaryContributionPercentVal = 0;
  @track confirmEmailError;
  @track saveButtonDisable = false;
  @track secondaryEmailError = false;
  @track primaryEmailError = false;

  primaryHandleApprover(event) {
    this.primaryApproverValue = event.target.value;
    if (this.primaryApproverValue == true) {
      this.secondaryApproverValue = false;
    }
    if (this.primaryApproverValue == false) {
      this.secondaryApproverValue = true;
    }
  }
  secondaryHandleApprover(event) {
    this.secondaryApproverValue = event.target.value;
    if (this.secondaryApproverValue == true) {
      this.primaryApproverValue = false;
    }
    if (this.secondaryApproverValue == false) {
      this.primaryApproverValue = true;
    }
  }
  EmailChangeHandler(event) {
    this.ValidateEmail(event);
  }

  ValidateEmail(event) {
    if (event.target.name == "primary") {
      this.emailCheckFunction(event);
      this.primaryEmailError = true;
      this.secondaryEmailError = false;
    } else {
      this.emailCheckFunction(event);
      this.primaryEmailError = false;
      this.secondaryEmailError = true;
    }
  }

  emailCheckFunction(event) {
    // var validRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    var validRegex =
      /^\w+([\.-]?\w+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,3})+(\.(gov|com|org|co)(\.au)?)?$/;

    if (!event.target.value) {
      // If it's empty, reset error message and enable the save button
      this.confirmEmailError = "";
      this.saveButtonDisable = false;
      return; // Exit the function
    }
    if (event.target.value.match(validRegex)) {
      this.confirmEmailError = "";
      this.saveButtonDisable = false;
      console.log("valid email");
    } else {
      console.log(" in valid  email");
      this.confirmEmailError = "Please Enter valid Email";
      this.saveButtonDisable = true;
    }
  }

  VoluntaryChange(event) {
    if (event.target.value == "Fixed") {
      this.VoluntaryContributionCurrency = true;
      this.VoluntaryContributionPercent = false;
    }
    if (event.target.value == "Percentage") {
      this.VoluntaryContributionPercent = true;
      this.VoluntaryContributionCurrency = false;
    }
    if (event.target.name == "contributionFixed") {
      this.voluntaryContributionCureencyVal = event.target.value;
    }
    if (event.target.name == "contributionPercent") {
      this.voluntaryContributionPercentVal = event.target.value;
    }
    console.log(this.voluntaryContributionPercentVal);
  }

  @track isModalOpen = false;
  @track currentUrl;

  closeModal() {
    this.isModalOpen = false;
    this.currentUrl = null;
  }

  getFileType(url) {
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
  }
  @track ictUserType = false;
  typeOfUserChnage(event) {
    if (event.detail.value == "ICT User") {
      this.ictUserType = true;
    } else {
      this.ictUserType = false;
    }
  }
  @track categoryType;
  @track jobType;
  @track classificationLevel;
  @track classificationPayType;
  @track genralHourlyRate = 0;
  @track sturdayHourlyRat = 0;
  @track sundayhourlyRate = 0;
  @track publicHolidayRate = 0;
  @track afterNoonShiftRate = 0;
  @track nightShiftRate = 0;
  @track isFixedcategory = false;
  @track createdShiftRole;
  @track includeSuperannuation = false;
  @track superannuationValue;
  @track paidBreak = true;
  @track orginalData = [];

  employmentTypeChange(event) {
  
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

    if (
      this.categoryType != null &&
      this.jobType != null &&
      this.classificationLevel != null &&
      this.classificationPayType != null
    ) {
      console.log(" categoryType " + this.categoryType);
      console.log(" jobType " + this.jobType);
      console.log(" classificationType " + this.classificationLevel);
      console.log(" classificationPayType " + this.classificationPayType);
 
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
 
  handleRoleChange(event) {
    this.createdShiftRole = "";

    event.target.value.forEach((rec) => {
      this.createdShiftRole += rec + ";";
    });
    // Remove the trailing semicolon
    if (this.createdShiftRole.endsWith(";")) {
      this.createdShiftRole = this.createdShiftRole.slice(0, -1);
    }

    console.log("staff roles " + this.createdShiftRole);
  }
  handleGeoLocationStatus(event) {
    this.geoLocationStatus = event.target.checked;
    console.log("geo location " + this.geoLocationStatus);
  }
  /*  @track currentStep = 'step1';  */
  handleCreateIssue(event) {
    // this.headeringName = 'New Issue';
    this.staffEditFlag = true;
    this.recordId = "";
    this.fileName = "";
    this.buttonName = "Save";
    this.issueparent = false;
    this.currentStep = "step1";
    this.parentStaffId = "";
    this.selectedmoduleId = "";
  }
  get isStep1() {
    return this.currentStep === "step1";
  }

  get isStep2() {
    return this.currentStep === "step2";
  }

  get isStep3() {
    return this.currentStep === "step3";
  }

  get isStep4() {
    return this.currentStep === "step4";
  }
  handlecreatetraining() {
    this.CoursesFlag = false;
    this.selectedmoduleId = "";
  }

  @track searchName = "";
  @track activeFilterOn = true;
  @track inactiveFilterOn = false;

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

}

handleInactiveToggle() {
    this.inactiveFilterOn = true;
    this.activeFilterOn = false;

    this.isActive = false;
    this.pageNumber = 1;
    this.refreshKey++;
}
  

  get activeButtonClass() {
    return this.activeFilterOn ? "active-button" : "";
  }

  get inactiveButtonClass() {
    return this.inactiveFilterOn ? "active-button" : "";
  }

  get viewToggleIcon() {
    return this.cardFlag ? "list" : "cards";
  }

  get viewToggleTitle() {
    return this.cardFlag ? "Switch to List View" : "Switch to Card View";
  }

  // Used for data-name on the button to inform handleChange()
  get viewToggleTarget() {
    return this.cardFlag ? "listview" : "cardview";
  }

  get recordsWithToggleStyle() {
    return this.recordsToDisplay.map((fac) => {
      const isActive = fac.Status__c === true || fac.Status__c === "true";
      return {
        ...fac,
        toggleTrackClass: isActive ? "toggle-track active" : "toggle-track",
        toggleKnobClass: isActive ? "toggle-knob active" : "toggle-knob",
        toggleLabelClass: isActive
          ? "toggle-label active"
          : "toggle-label inactive",
        toggleLabel: isActive ? "Active" : "Inactive"
      };
    });
    
  }

  @api async changeStatusByName(fullName, targetStatus) {
    console.log(
      "[Bot→Staff] changeStatusByName() called with:",
      fullName,
      targetStatus ? "Activate" : "Deactivate"
    );
    this.notifyOverlayStart();

    try {
      const name = (fullName || "").trim();
      console.log("[Bot→Staff] Normalized name:", name);
      if (!name) {
        this.showBotToast("No name provided.", "error");
        return;
      }

      // 1) Switch to Card view (skip if already in card view)
      if (!this.isCardView) {
        // assuming you have a flag for current view
        if (typeof this.handleChange === "function") {
          console.log("[Bot→Staff] Switching to card view...");
          this.handleChange({ target: { dataset: { name: "cardview" } } });
          await this.microWait(500);
        }
      } else {
        console.log("[Bot→Staff] Already in card view, skipping step 1.");
      }

      // 2) Apply filter by name (skip if already filtered)
      if (this.searchName !== name) {
        this.searchName = name;
        if (typeof this.handleSearchInput === "function") {
          console.log("[Bot→Staff] Filtering list by name…");
          this.handleSearchInput({ target: { value: name } });
          await this.microWait(500);
        }
      } else {
        console.log(
          "[Bot→Staff] Filter already set to this name, skipping step 2."
        );
      }

      // 3) Wait for results (skip if candidates already loaded)
      let candidates =
        (this.recordsToDisplay?.length
          ? this.recordsToDisplay
          : this.recordsWithToggleStyle) || [];
      if (!candidates.length) {
        console.log("[Bot→Staff] Waiting for search results to populate...");
        for (let i = 0; i < 20; i++) {
          candidates =
            (this.recordsToDisplay?.length
              ? this.recordsToDisplay
              : this.recordsWithToggleStyle) || [];
          if (candidates.length > 0) break;
          await this.microWait(100);
        }
        await this.microWait(500);
      } else {
        console.log(
          "[Bot→Staff] Search results already loaded, skipping wait."
        );
      }
      console.log("[Bot→Staff] Candidate records count:", candidates.length);

      // 4) Find match
      const match = candidates.find((r) => {
        const display = (
          r.Display_Nickname__c ||
          r.NameToDisplay__c ||
          ""
        ).toLowerCase();
        return (
          display === name.toLowerCase() || display.includes(name.toLowerCase())
        );
      });
      console.log("[Bot→Staff] Matching record found:", match);

      if (!match) {
        this.showBotToast(`No staff found for "${name}".`, "warning");
        return;
      }
      await this.microWait(500);

      const staffId = match.Id;
      const staffName =
        match.NameToDisplay__c || match.Display_Nickname__c || name;
      const isActive =
        match.Status__c === true || match.Staff_Status__c === "Active";
      console.log("[Bot→Staff] staffId:", staffId, "isActive:", isActive);

      if (isActive === targetStatus) {
        this.showBotToast(
          `${staffName} is already ${targetStatus ? "Active" : "Inactive"}.`,
          "info"
        );
        return;
      }
      await this.microWait(500);

      // 5) Open status modal (skip if already open for the same staff)
      if (!(this.handleStatusFlag && this.facId === staffId)) {
        const fakeEvt = {
          target: {
            dataset: {
              id: staffId,
              name: String(match.Status__c),
              staffname: staffName
            }
          },
          currentTarget: {
            dataset: {
              id: staffId,
              name: String(match.Status__c),
              staffname: staffName
            }
          },
          preventDefault() {},
          stopPropagation() {}
        };

        if (typeof this.handlefacStatus === "function") {
          console.log(
            "[Bot→Staff] Invoking handlefacStatus() with synthetic event…"
          );
          await this.handlefacStatus(fakeEvt);
          await this.microWait(500);
        } else {
          console.warn("[Bot→Staff] handlefacStatus() not found. Aborting.");
          this.showBotToast("Toggle handler not found.", "error");
          return;
        }
      } else {
        console.log(
          "[Bot→Staff] Status modal already open for this staff, skipping step 5."
        );
      }

      // 6) Wait for modal (skip if already ready)
      if (!(this.handleStatusFlag && this.finalStatus !== undefined)) {
        console.log("[Bot→Staff] Waiting for confirmation modal to open…");
        for (let i = 0; i < 40; i++) {
          if (
            this.handleStatusFlag &&
            this.facId &&
            this.finalStatus !== undefined
          )
            break;
          await this.microWait(50);
        }
        await this.microWait(500);
      } else {
        console.log("[Bot→Staff] Modal already ready, skipping wait.");
      }

      // 7) Confirm status change
      if (typeof this.handlestatuschange === "function") {
        console.log("[Bot→Staff] Auto-confirming via handlestatuschange()…");
        await this.handlestatuschange();
      } else {
        console.warn(
          "[Bot→Staff] handlestatuschange() not found, trying click fallback…"
        );
        const btn = this.template.querySelector('[data-role="confirm-status"]');
        if (btn && typeof btn.click === "function") {
          btn.click();
        } else {
          this.showBotToast(
            "Could not confirm status change automatically.",
            "error"
          );
          return;
        }
      }
      await this.microWait(500);

      // 8) Refresh data (skip if we already just refreshed)
      if (!this._justRefreshed) {
        console.log("[Bot→Staff] Refreshing wire data…");
      
        this._justRefreshed = true;
        await this.microWait(500);
      } else {
        console.log("[Bot→Staff] Already refreshed, skipping.");
      }

      this.showBotToast(
        `${targetStatus ? "Activated" : "Deactivated"} ${staffName}.`,
        "success"
      );

      if (targetStatus && typeof this.handleActiveToggle === "function") {
        console.log("[Bot→Staff] Switching to Active filter…");
        this.handleActiveToggle();
      } else if (
        !targetStatus &&
        typeof this.handleInactiveToggle === "function"
      ) {
        console.log("[Bot→Staff] Switching to Inactive filter…");
        this.handleInactiveToggle();
      }
      await this.microWait(500);
    } catch (e) {
      console.error("[Bot→Staff] changeStatusByName() error:", e);
      this.showBotToast(
        "Failed to change staff status. Contact admin.",
        "error"
      );
    } finally {
      this.notifyOverlayEnd();
      publish(this.messageContext, BOT_ACTION, {
        action: "reset_to_sidebar"
      });
    }
  }

  @wire(MessageContext) messageContext;
  notifyOverlayStart() {
    publish(this.messageContext, BOT_ACTION, {
      action: "overlay_start"
    });
  }

  notifyOverlayEnd() {
    publish(this.messageContext, BOT_ACTION, {
      action: "overlay_end"
    });
  }

  microWait(ms = 0) {
    return new Promise((res) => setTimeout(res, ms));
  }

  showBotToast(message, variant = "info", title = "HR") {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
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

     @track totalfiles=[];
     @track documentedit=false;
     @track isFileExpand = false;

    /*  handlemultipleFileUpload(event) {
        this.processSelectedFiles(Array.from(event.target.files));
         event.target.value = null;
    } */

    // Drag & drop
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }
     
   handleFileUploadInputChange(event) {
    let files = Array.from(event.target.files || []);
   
     const invalidFile = files.find(f => !this.isAllowedFile(f));
    if (invalidFile) {
        this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg, .doc, .docx, .heic, .jpe, .odt, .rtf, .svg, .txt) are allowed.`, 'error');
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

     const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
    const existingSize = this.totalfiles.reduce((sum, file) => sum + file.size, 0);
    const newFilesSize = files.reduce((sum, file) => sum + file.size, 0);
    if (existingSize + newFilesSize > MAX_TOTAL_SIZE) {
        this.showToast(
            'Error',
            'Total file size cannot exceed 50MB.',
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

     ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg','docx','doc','heic', 'jpe', 'odt', 'rtf', 'svg', 'txt']; 

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
        this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg, .doc, .docx, .heic, .jpe, .odt, .rtf, .svg, .txt) are allowed.`, 'error');
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

    const MAX_TOTAL_SIZE = 50 * 1024 * 1024;
    const existingSize = this.totalfiles.reduce((sum, file) => sum + file.size, 0);
    const newFilesSize = files.reduce((sum, file) => sum + file.size, 0);
    if (existingSize + newFilesSize > MAX_TOTAL_SIZE) {
        this.showToast(
            'Error',
            'Total file size cannot exceed 50MB.',
            'error'
        );
        event.target.value = '';
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

          
           
                 this.processSelectedFiles(files);
                 this.isFileExpand = false;
            
           
         
            this.fileSizeInBytes = totalBytes;
            console.log(' Files in last  : ',  files);
            console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles1));
           
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
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
           awsjson:file, 
           status:'Approved',
           admin:true
           
                
        };

        this.uploadedFiles = [...this.uploadedFiles, newFile];
    });

    console.log('✅ Uploaded files pushed:', this.uploadedFiles);
}

    handleFileDeleted(event) {
        console.group('handleFileDeleted called ');
        const { key, fileId ,files} = event.detail;
        console.log('File deleted in child. Key:', key, 'FileId:', fileId, 'files:',JSON.stringify(files) );

        // Example: remove it from parent's tracking
        this.uploadedFiles = this.uploadedFiles.filter(f => f.fileId !== fileId);
        console.log(' this.uploadedFiles in handleFileDeleted: ',  JSON.stringify(this.uploadedFiles1));
        // if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
        //    this.isFileExpand = false;
        // }
        if (!files || files.length === 0) {
           this.isFileExpand = false;
           
        }
    }


  hierarchicalOptions = [
    {
        id: '100-points-id',
        label: '100 Points of ID',
        value: '100-points-id',
        children: [
            {
                id: 'primary-id',
                label: 'Primary Identity Document',
                value: 'primary-id',
                children: [
                    { id: 'aus-passport', label: 'Australian passport (60pts)', value: 'Australian Passport', parent: 'primary-id' },
                    { id: 'foreign-passport', label: 'Foreign passport (60pts)', value: 'Foreign Passport', parent: 'primary-id' },
                    { id: 'drivers-license', label: 'Driver’s License/permit (40pts)', value: 'Drivers Licence', parent: 'primary-id' },
                    { id: 'medicare-card', label: 'Medicare card (25pts)', value: 'Medicare Card', parent: 'primary-id' }
                ]
            },
            {
                id: 'secondary-id',
                label: 'Secondary Identity Document',
                value: 'secondary-id',
                children: [
                    { id: 'birth-cert', label: 'Birth certificate (40pts)', value: 'Birth Certificate', parent: 'secondary-id' },
                    { id: 'identity-cert', label: 'Certificate of identity (40pts)', value: 'Certificate of Identity', parent: 'secondary-id' },
                    { id: 'photo-id', label: 'Photo ID (40pts)', value: 'Photo ID', parent: 'secondary-id' },
                    { id: 'proof-age', label: 'Proof of age card (40pts)', value: 'Proof of Age Card', parent: 'secondary-id' },
                    { id: 'rating-authority', label: 'Rating authority (25pts)', value: 'Rating Authority', parent: 'secondary-id' },
                    { id: 'citizenship-cert', label: 'Citizenship certificate (25pts)', value: 'Citizenship Certificate', parent: 'secondary-id' },
                    { id: 'name-change-cert', label: 'Change of name certificate (25pts)', value: 'Change of Name Certificate', parent: 'secondary-id' },
                    { id: 'bank-statement-1', label: 'Bank statement 1 (20pts)', value: 'Bank Statement 1', parent: 'secondary-id' },
                    { id: 'bank-statement-2', label: 'Bank statement 2 (20pts)', value: 'Bank Statement 2', parent: 'secondary-id' },
                    { id: 'centrelink-card', label: 'Centrelink card (20pts)', value: 'Centrelink Card', parent: 'secondary-id' },
                    { id: 'dva-card', label: 'DVA card (20pts)', value: 'DVA Card', parent: 'secondary-id' },
                    { id: 'lease-agreement', label: 'Lease agreement (20pts)', value: 'Lease Agreement', parent: 'secondary-id' },
                    { id: 'marriage-cert', label: 'Marriage certificate (20pts)', value: 'Marriage Certificate', parent: 'secondary-id' },
                    { id: 'utility-bill-1', label: 'Utility bill 1 (20pts)', value: 'Utility Bill 1', parent: 'secondary-id' },
                    { id: 'utility-bill-2', label: 'Utility bill 2 (20pts)', value: 'Utility Bill 2', parent: 'secondary-id' },
                    { id: 'foreign-birth-cert', label: 'Birth certificate (foreign) (15pts)', value: 'Foreign Birth Certificate', parent: 'secondary-id' },
                    { id: 'indigenous-ref', label: 'Indigenous reference (15pts)', value: 'Indigenous Reference', parent: 'secondary-id' }
                ]
            }
        ]
    },
    {
        id: 'other-docs',
        label: 'Other Documents',
        value: 'other-docs',
        children: [
            { id: 'wwcc', label: 'Working With Children Check (WWCC)', value: 'Working With Children Check (WWCC)', parent: 'other-docs' },
            { id: 'ndis-screening', label: 'NDIS Worker Screening', value: 'NDIS Worker Screening', parent: 'other-docs' },
            { id: 'ndis-orientation', label: 'NDIS Worker Orientation Certificate', value: 'NDIS Worker Orientation Certificate', parent: 'other-docs' },
            { id: 'code-of-conduct', label: 'Signed Code of Conduct', value: 'Signed Code of Conduct', parent: 'other-docs' },
            { id: 'infection-training', label: 'Infection Control Training', value: 'Infection Control Training', parent: 'other-docs' },
            { id: 'first-aid', label: 'First Aid Certificate', value: 'First Aid Certificate', parent: 'other-docs' }
        ]
    }
];

   /*  handleDocTypeChange(event) {
            const index = event.target.dataset.index;
            this.uploadedFiles[index].typeOfDocument = event.detail.value;
            this.uploadedFiles = [...this.uploadedFiles];
             console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
        } */

    handleDocTypeChange1(event){
        this.typeOfDocument = event.detail.value;
        console.log('type of document',this.typeOfDocument);
         const docPointsMap = {
        'Australian Passport': 60,
        'Foreign Passport': 60,
        'Drivers Licence': 40,
        'Medicare Card': 25,
        'Birth Certificate': 40,
        'Certificate of Identity': 40,
        'Photo ID': 40,
        'Proof of Age Card': 40,
        'Rating Authority': 25,
        'Citizenship Certificate': 25,
        'Change of Name Certificate': 25,
        'Bank Statement 1': 20,
        'Bank Statement 2': 20,
        'Centrelink Card': 20,
        'DVA Card': 20,
        'Lease Agreement': 20,
        'Marriage Certificate': 20,
        'Utility Bill 1': 20,
        'Utility Bill 2': 20,
        'Foreign Birth Certificate': 15,
        'Indigenous Reference': 15
    };
    this.points =  docPointsMap[ this.typeOfDocument] || 0;

    }

     handleDocTypeChange(event) {
    const index = event.target.dataset.index;
    const selectedType = event.detail.value;
    this.uploadedFiles[index].errorMessage = '';
    // Update the selected document type
    this.uploadedFiles[index].typeOfDocument = selectedType;

    // Assign points based on document type
    const docPointsMap = {
        'Australian Passport': 60,
        'Foreign Passport': 60,
        'Drivers Licence': 40,
        'Medicare Card': 25,
        'Birth Certificate': 40,
        'Certificate of Identity': 40,
        'Photo ID': 40,
        'Proof of Age Card': 40,
        'Rating Authority': 25,
        'Citizenship Certificate': 25,
        'Change of Name Certificate': 25,
        'Bank Statement 1': 20,
        'Bank Statement 2': 20,
        'Centrelink Card': 20,
        'DVA Card': 20,
        'Lease Agreement': 20,
        'Marriage Certificate': 20,
        'Utility Bill 1': 20,
        'Utility Bill 2': 20,
        'Foreign Birth Certificate': 15,
        'Indigenous Reference': 15
    };

    // Assign points or default to 0 if not found
    this.uploadedFiles[index].points = docPointsMap[selectedType] || 0;

    // Trigger reactivity
    this.uploadedFiles = [...this.uploadedFiles];

    console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
}
   

    handleCommentsChange(event) {
        const index = event.target.dataset.index;
        this.uploadedFiles[index].comment = event.target.value;
        this.uploadedFiles = [...this.uploadedFiles];
         console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
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
    const index = event.currentTarget.dataset.index;
    const fileToDelete = this.uploadedFiles[index];

    if (fileToDelete) {
        const key = fileToDelete.awsjson.key; // ✅ correct key
        console.log('Deleting key:', key);

        // Remove from array
        this.uploadedFiles = this.uploadedFiles.filter((_, i) => i !== parseInt(index, 10));

        console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));

        this.deleteFile(key);
    }
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

        

           

            this.isDisabled=false;
            this.key='';
            this.isEdit=false;
           
            
        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }


    handleCancel(event){       
      this.uploadedFiles = [];
    }
    
    fetchFacility(facId) {        
      getfacilityById({ facId: facId }).then(result => {
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

    getOptionButtonClass(isActive) {
    return isActive 
        ? 'option-button option-button-active' 
        : 'option-button option-button-inactive';
}

getBadgeClass(isActive) {
    return isActive 
        ? 'status-badge1 status-badge-active1' 
        : 'status-badge1 status-badge-inactive1';
}

getToggleTrackClass(option) {
    return option.checked ? 'custom-toggle-track active' : 'custom-toggle-track';
}
    
    handleKeyShortcut(event) {
        if (event.shiftKey && event.ctrlKey && event.code === 'KeyC') {
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

    handleDropdownToggle() {
        this.isExpanded = !this.isExpanded;
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
            console.log('🌀 [refreshValues] END');
        }

    loadDocumentTypesForFacility(facilityId) {
        if (!facilityId || !this.staffId) {
            this.dynamicDocumentTypes = [];
            return;
        }

        getFacilityIdentityDocuments({ facilityId: facilityId,
        staffId: this.staffId })
            .then(result => {
                this.documentPointsMap = {};
                this.documentMetaMap = {};

                if (!Array.isArray(result) || result.length === 0) {
                    this.dynamicDocumentTypes = this.buildHierarchicalFromFacility([]);
                    return;
                }

                this.dynamicDocumentTypes =
                    this.buildHierarchicalFromFacility(result);
            })
            .catch(error => {
                console.error('Error loading facility documents', error);
                this.dynamicDocumentTypes =
                    this.buildHierarchicalFromFacility([]);
            });
    }

    buildHierarchicalFromFacility(result = []) {

        const identityDocs  = result.filter(d => d.complianceCategory === 'Identity');
        const documentDocs  = result.filter(d => d.complianceCategory === 'Documents');
        const trainingDocs  = result.filter(d => d.complianceCategory === 'Trainings');

        const groupedIdentity = { Primary: [], Secondary: [] };

        identityDocs.forEach(doc => {
            const cat = doc.category || 'Secondary';
            groupedIdentity[cat]?.push(doc);

            this.documentPointsMap[doc.name] = Number(doc.points) || 0;
            this.documentMetaMap[doc.name] = doc;
        });

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

        // ---------- PRIMARY ----------
        hierarchy[0].children.push({
            id: 'primary-id',
            label: 'Primary Identity Documents',
            value: 'primary-id',
            children: groupedIdentity.Primary.length
                ? groupedIdentity.Primary.map(doc => ({
                    id: `id-${doc.name}`,
                    label: `${doc.name} (${doc.points || 0} points)`,
                    value: doc.name,
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
        hierarchy[0].children.push({
            id: 'secondary-id',
            label: 'Secondary Identity Documents',
            value: 'secondary-id',
            children: groupedIdentity.Secondary.length
                ? groupedIdentity.Secondary.map(doc => ({
                    id: `id-${doc.name}`,
                    label: `${doc.name} (${doc.points || 0} points)`,
                    value: doc.name,
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

        // ---------- DOCUMENTS ----------
        hierarchy[1].children = documentDocs.length
            ? documentDocs.map(doc => ({
                id: `doc-${doc.name}`,
                label: doc.name,
                value: doc.name,
                children: []
            }))
            : [{
                id: 'no-docs',
                label: 'No Documents Available',
                value: 'no-docs',
                disabled: true,
                children: []
            }];

        // ---------- TRAININGS ----------
        hierarchy[2].children = trainingDocs.length
            ? trainingDocs.map(doc => ({
                id: `training-${doc.name}`,
                label: doc.name,
                value: doc.name,
                children: []
            }))
            : [{
                id: 'no-trainings',
                label: 'No Training Documents Available',
                value: 'no-trainings',
                disabled: true,
                children: []
            }];

        return hierarchy;
    }

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

  handleFacilityToggleActive(event) {
      console.group('handleFacilityToggleActive');
    const optionId = event.target.dataset.optionId; // UI id (index or key)
    const isChecked = event.target.checked;
     console.log('Extracted values:', {
        optionId,
        isChecked
    });

    // Find the selected option from the original list
    const selectedOption = this.multiFacilityDroDownList.find(
        option => option.id === optionId
    );
   console.warn('Selected option not found for optionId:', optionId);
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
       //  this.fetchRolesForFacility(this.selctedMultipleFcailityValues);
    }, 1000);
}
getOptionButtonClassRoles(isActive, isSelected = false) {
    if (isSelected) {
        return 'option-button option-button-selected';
    }
    return isActive 
        ? 'option-button-roles option-button-active-roles' 
        : 'option-button-roles option-button-inactive-roles';
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
      console.log('🔹 selectedRoleEmploymentValues:', JSON.stringify(this.selectedRoleEmploymentValues));

      /* safety check */
      if (index === undefined || !this.selectedRoleEmploymentValues) {
          console.error('❌ dataset.index undefined OR selectedRoleEmploymentValues missing');
          return;
      }

      const selectedOption = this.selectedRoleEmploymentValues[Number(index)];

      console.log('🔹 selectedOption:', JSON.stringify(selectedOption));

      if (!selectedOption) {
          console.error('❌ No option found at index:', index);
          return;
      }

      /* store selected role */
      this.selectedEmploymentRole = selectedOption.value;

      /* store facility */
      this.selectedDropDownFacilityValue = selectedFacilityValue;

      /* 🔹 display selected role in button */
      this.selectedEmploymentRoleDisplayVlaue = selectedOption.displaylabel;

      console.log('✅ selectedEmploymentRoleDisplayVlaue:', this.selectedEmploymentRoleDisplayVlaue);

      //manendra sai added for role bugs 27-5-26
// =========================
// RESET DEPENDENT FIELDS
// =========================

this.jobType = '';
this.categoryType = '';
this.classificationLevel = '';
this.classificationPayType = '';

// reset awards
this.isSchadsAwards = false;
this.isNursingAwards = false;
this.isChildCareAwards = false;

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

// optional safer resets
this.allowanceMethod = 'Fixed';
this.paidBreak = true;

      //end

      /* fetch facility service type */
      this.fetchFacility(selectedFacilityValue);

      console.log('✅ selectedEmploymentRole set to:', this.selectedEmploymentRole);

      /* close dropdown */
      this.roleDropDownForEmployment = false;
      console.log('✅ Dropdown closed');

      /* remove outside click listener */
      if (this._boundHandleClickOutside) {
          window.removeEventListener('click', this._boundHandleClickOutside);
          console.log('✅ Outside click listener removed');
      } else {
          console.warn('⚠️ _boundHandleClickOutside was not set');
      }
      this.updateEmploymentRoles();
  }

        handleFirstNameChange(event) {
            const value = event.target.value;
            this.isFirstNameEntered = value && value.trim() !== '';
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
 
    get showfacilityOptions() {
        return this.multiFacilityDroDownList.map(item => {
            return {
                label: item.label,
                value: item.value
            };
        });
    } 

 
handleFacilityChange(event) {

    const selectedFacilityIds = event.detail.value;

    // 🔥 IMPORTANT: ignore search typing
    if (!Array.isArray(selectedFacilityIds)) {
        console.log('Ignored invalid facility input:', selectedFacilityIds);
        return;
    }

    this.selctedMultipleFcailityValues = [...selectedFacilityIds];

    console.log('Selected Facilities:', selectedFacilityIds);
    //manendra added 27-5
        this.selectedRoleValues = [];
this.selectedRoleEmploymentValues = [];
this.selectedRoleValueLabels = [];
this.selectedPrimaryRole = null;

        console.log(
    '🔥 selectedRoleValues after reset:',
    JSON.stringify(this.selectedRoleValues)
);
       // this.selectedRoleEmploymentValues = [];

        // ✅ Optional but recommended
        this.roleoptionsforFacility = [];

        console.log('✅ Cleared stale role state');
        //end manendra added


    this.fetchRoleOptions();
}
 
handleRolesChange(event) {

    console.log('Roles event:', JSON.stringify(event.detail));

    // 🔥 IMPORTANT: ignore search typing events
    if (!event.detail.values) {
        console.log('Ignored search event:', event.detail);
        return;
    }

    const selectedValues = event.detail.values || [];
    const primary = event.detail.primary;

    this.selectedPrimaryRole = primary;

    this.selectedRoleValueLabels = [...selectedValues];

    const existingMap = new Map(
        (this.selectedRoleValues || []).map(r => [`${r.value}__${r.facilityValue}`, r])
    );

    const updatedRoles = [];

    selectedValues.forEach(val => {

        const matchedRoles = (this.roleoptionsforFacility || [])
            .filter(r => r.displaylabel === val); // 🔥 IMPORTANT FIX

        if (matchedRoles.length > 0) {

            matchedRoles.forEach(role => {

                const key = `${role.value}__${role.facilityValue}`;
                const existing = existingMap.get(key);

                updatedRoles.push({
                    label: role.label || existing?.label,
                    value: role.value,
                    facilityValue: role.facilityValue,
                    facilityName: role.facilityName,
                    displaylabel: role.displaylabel,
                    checked: true,
                    isActive: true,
                    isDisabled: false,
                    typeOfService: role.typeOfService,
                    isPrimary: role.displaylabel === primary
                });

            });

        } else {
            // fallback (search case)
            (this.selectedRoleValues || [])
                .filter(r => r.displaylabel === val)
                .forEach(existing => {
                    updatedRoles.push({
                        ...existing,
                        isPrimary: existing.displaylabel === primary
                    });
                });
        }

    });

    this.selectedRoleValues = updatedRoles;

    this.updateEmploymentRoles();

    console.log('Employment Roles ==> ', JSON.stringify(this.selectedRoleValues));
}

get tableClass() {
    return this.ictUserType
        ? 'table-container staffListTable noRole slds-grid slds-grid_vertical slds-grow slds-scrollable_none'
        : 'table-container staffListTable withRole slds-grid slds-grid_vertical slds-grow slds-scrollable_none';
}


    updateEmploymentRoles() {

     /*    if (!this.roleoptionsforFacility || !this.selectedRoleValues) {
            this.selectedRoleEmploymentValues = [];
            return;
        } */

        /* 🔹 filter roles based on selectedRoleValues */
       let selectedDisplayLabels = this.selectedRoleValues.map(r => r.displaylabel);

         this.selectedRoleEmploymentValues = this.roleoptionsforFacility
        .filter(role => selectedDisplayLabels.includes(role.displaylabel))
        .map(role => {
            return {
                label: role.label,
                value: role.value,
                facilityValue: role.facilityValue,
                displaylabel: role.displaylabel
            };
        });

    console.log(
        'Employment Roles ==> ',
        JSON.stringify(this.selectedRoleEmploymentValues)
    );
    }  
    
 
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

           const contactField = currentStepEl.querySelector('[data-id="contact"]');
         console.log('Contact Field:', contactField);

        if (contactField) {
            console.log('Contact Value:', contactField.value);
            const contact = (contactField.value || '').trim();

            // Validate only if user entered a value.
            // Required validation is already handled above.
            if (contact && !/^\d{10}$/.test(contact)) {
                missingFields.push('Contact Number must be exactly 10 digits');
            }
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

        // 🔹 ABN / TFN / SUPER FUND / ESA / USI VALIDATION (Step 3)
    if (this.createCurrentStep === 'createstep3' && !this.supportCoordintionflag) {
        const abnField = currentStepEl.querySelector('[data-id="ABN"]');
        const tfnField = currentStepEl.querySelector('[data-id="TFN"]');
        const superabnField = currentStepEl.querySelector('[data-id="Super_ABN"]');

        const abnVal = abnField?.value ? String(abnField.value).trim() : '';
        const tfnVal = tfnField?.value ? String(tfnField.value).trim() : '';
        const superabnVal = superabnField?.value ? String(superabnField.value).trim() : '';

        const abnDigits = abnVal.replace(/\D/g, '');
        const tfnDigits = tfnVal.replace(/\D/g, '');
        const superabnDigits = superabnVal.replace(/\D/g, '');

        if (abnField) abnField.classList.remove('slds-has-error');
        if (tfnField) tfnField.classList.remove('slds-has-error');
        if (superabnField) superabnField.classList.remove('slds-has-error');

        // ✅ ESA and USI Validation
        const esaField = currentStepEl.querySelector('[data-id="ESA"]');
        const usiField = currentStepEl.querySelector('[data-id="USI"]');

        const esaVal = esaField?.value ? String(esaField.value).trim() : '';
        const usiVal = usiField?.value ? String(usiField.value).trim() : '';

        if (esaField) esaField.classList.remove('slds-has-error');
        if (usiField) usiField.classList.remove('slds-has-error');

        // Check if both ESA and USI are filled
        if (esaVal && usiVal) {
            if (esaField) esaField.classList.add('slds-has-error');
            if (usiField) usiField.classList.add('slds-has-error');
            missingFields.push('ESA and USI cannot both be filled. Please enter only one.');
        }

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

            if (superabnVal && superabnDigits.length !== 11) {
                if (superabnField) superabnField.classList.add('slds-has-error');
                missingFields.push('Valid Super Fund ABN (11 digits)');
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

// ABN / TFN Validation
if (this.createCurrentStep === 'createstep3') {

    const abnField = currentStepEl.querySelector('[data-id="ABN"]');
    const tfnField = currentStepEl.querySelector('[data-id="TFN"]');

    const abnVal = abnField?.value ? String(abnField.value).trim() : '';
    const tfnVal = tfnField?.value ? String(tfnField.value).trim() : '';

    const abnDigits = abnVal.replace(/\D/g, '');
    const tfnDigits = tfnVal.replace(/\D/g, '');

    // Clear previous errors
    abnField?.classList.remove('slds-has-error');
    tfnField?.classList.remove('slds-has-error');

    // At least one required
    if (!abnVal && !tfnVal) {
        abnField?.classList.add('slds-has-error');
        tfnField?.classList.add('slds-has-error');

        missingFields.push('ABN or TFN');
    } else {

        // ABN = 11 digits
        if (abnVal && abnDigits.length !== 11) {
            abnField?.classList.add('slds-has-error');
            missingFields.push('Valid ABN (11 digits)');
        }

        // TFN = 8 or 9 digits
        if (
            tfnVal &&
            tfnDigits.length !== 8 &&
            tfnDigits.length !== 9
        ) {
            tfnField?.classList.add('slds-has-error');
            missingFields.push('Valid TFN (9 digits)');
        }
    }
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


    // manendra added for sorting the data in table
    handleSort(event) {

        const field = event.currentTarget.dataset.field;

        if (!field) return;

        if (this.sortField === field) {
            this.sortDirection =
                this.sortDirection === 'asc'
                    ? 'desc'
                    : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        Object.keys(this.sortIcons).forEach(k => {
            this.sortIcons[k] = '';
        });

        this.sortIcons[field] =
            this.sortDirection === 'asc'
                ? 'arrow_upward'
                : 'arrow_downward';

        this.sortIcons = { ...this.sortIcons };

        this.pageNumber = 1;
    }
    sortData(data) {

        if (!this.sortField) {
            return [...data];
        }
        const direction = this.sortDirection === 'asc' ? 1 : -1;
        return [...data].sort((a, b) => {
            const valueA = a[this.sortField];
            const valueB = b[this.sortField];
            const emptyA =
                valueA === null ||
                valueA === undefined ||
                valueA === '' ||
                valueA === 'N/A';
            const emptyB =
                valueB === null ||
                valueB === undefined ||
                valueB === '' ||
                valueB === 'N/A';
            if (emptyA && emptyB) return 0;
            if (emptyA) return 1;
            if (emptyB) return -1;
            return (
                String(valueA).localeCompare(
                    String(valueB),
                    undefined,
                    {
                        numeric: true,
                        sensitivity: 'base'
                    }
                ) * direction
            );
        });
    }
//end


  // =====================================================================
  // HASH ROUTER API
  // =====================================================================
  _suppressEmit = false;
  _lastSubRoute = '';
  _childPopup = '';
  _lastTabSlug = '';
  _lastIsEdit = false;

  get createCurrentStep() { return this._createCurrentStep; }
  set createCurrentStep(val) {
      this._createCurrentStep = val;
      this._syncRecordRoute();
  }

  get staffEditFlag() { return this._staffEditFlag; }
  set staffEditFlag(val) {
      this._staffEditFlag = val;
      this._syncRecordRoute();
  }

  get editstaffflag() { return this._editstaffflag; }
  set editstaffflag(val) {
      this._editstaffflag = val;
      this._syncRecordRoute();
  }

  // Handle subpopup event bubbled from children or grandchildren
  handleSubPopup(e) {
      this._childPopup = e.detail.slug || '';
      this._syncRecordRoute();
  }

  get _recordUid() {
      return (this.satffDataJasonformat && this.recordId && this.satffDataJasonformat[this.recordId]
          && this.satffDataJasonformat[this.recordId].uid) || '';
  }

  get _tabHandlerBySlug() {
      return {
          'employee': 'handleEmployeeTab',
          'details': 'handleEmployeeTab',
          'tax': 'handleTaxTab',
          'superannuation': 'handleSuperTab',
          'history': 'handleHistoryTab',
          'compliance': 'handleComplianceTab',
          'training': 'handleTrainingTab',
          'internalnotes': 'handleInternalNotes'
      };
  }

  _currentTabSlug() {
      const child = this.template.querySelector('c-create-edit-staff-lwc');
      if (child) {
          return child.currentTabSlug();
      }
      return 'employee';
  }

  _selectTab(slug) {
      const child = this.template.querySelector('c-create-edit-staff-lwc');
      if (child) {
          child.selectTab(slug);
      }
  }

  notifySubRoute(subView, replace) {
      if (this._suppressEmit) return;
      if (!this._recordUid && !this.staffEditFlag) return;
      this.dispatchEvent(new CustomEvent('subrouteupdate', {
          detail: { subView, recordId: this.recordId, replace: !!replace },
          bubbles: true,
          composed: true
      }));
  }

  notifyModuleRoot() {
      this._lastSubRoute = '';
      if (this._suppressEmit) return;
      this.dispatchEvent(new CustomEvent('subrouteupdate', {
          detail: { subView: '', recordId: null, replace: true },
          bubbles: true,
          composed: true
      }));
  }

  _activePopupSlug() {
      if (this.showStaffDocumentSection) return 'staff-document';
      if (this.isModalOpen) return 'view-attachment';
      if (this.handleStatusFlag) return 'confirm-status';
      if (this._childPopup) return this._childPopup;
      return '';
  }

  _composeSubRoute() {
      if (this.staffEditFlag) {
          const step = (this.createCurrentStep || 'createstep1').replace('create', '');
          const pop = this._activePopupSlug();
          return pop ? `create/${step}/${pop}` : `create/${step}`;
      }
      const uid = this._recordUid;
      if (!uid) return '';
      const tab = this._currentTabSlug();
      const child = this.template.querySelector('c-create-edit-staff-lwc');
      const isEdit = child ? child.isEdit : false;
      const pop = this._activePopupSlug();

      let path = `${uid}/${tab}`;
      if (isEdit) {
          const step = child ? child.currentStep : 'step1';
          path += `/edit/${step}`;
      }
      if (pop) path += `/${pop}`;
      return path;
  }

  _syncRecordRoute() {
      if (this._suppressEmit) return;
      if (this._syncRouteTimeout) {
          clearTimeout(this._syncRouteTimeout);
      }
      this._syncRouteTimeout = setTimeout(() => {
          this._syncRecordRouteActual();
      }, 0);
  }

  _syncRecordRouteActual() {
      if (this._suppressEmit) return;
      
      if (!this.editstaffflag && !this.staffEditFlag) {
          this.notifyModuleRoot();
          return;
      }

      if (this.staffEditFlag) {
          const route = this._composeSubRoute();
          if (route === this._lastSubRoute) return;
          this._lastSubRoute = route;
          this.notifySubRoute(route, true); // replace!
          return;
      }

      if (!this._recordUid) return;

      const currentTab = this._currentTabSlug();
      if (this._lastTabSlug && currentTab !== this._lastTabSlug) {
          this._lastTabSlug = currentTab;
          const route = this._composeSubRoute();
          this._lastSubRoute = route;
          this.notifySubRoute(route, false); // push!
          return;
      }
      this._lastTabSlug = currentTab;

      const child = this.template.querySelector('c-create-edit-staff-lwc');
      const currentIsEdit = child ? child.isEdit : false;
      if (currentIsEdit && !this._lastIsEdit) {
          this._lastIsEdit = currentIsEdit;
          const route = this._composeSubRoute();
          this._lastSubRoute = route;
          this.notifySubRoute(route, false); // push!
          return;
      }
      this._lastIsEdit = currentIsEdit;

      const route = this._composeSubRoute();
      if (route === this._lastSubRoute) return;
      this._lastSubRoute = route;
      this.notifySubRoute(route, true); // replace!
  }

  _staffIdForUid(uid) {
      if (!uid || !this.satffDataJasonformat) return '';
      const ids = Object.keys(this.satffDataJasonformat);
      const lowerUid = uid.toLowerCase();
      for (let i = 0; i < ids.length; i++) {
          if (this.satffDataJasonformat[ids[i]] && 
              this.satffDataJasonformat[ids[i]].uid && 
              this.satffDataJasonformat[ids[i]].uid.toLowerCase() === lowerUid) {
              return ids[i];
          }
      }
      return '';
  }

  // @api async openByUID(uid, tab, isEdit) {
  _openPopupBySlug(slug) {
      if (slug === 'staff-document') {
          this.showStaffDocumentSection = true;
      } else if (slug === 'view-attachment') {
          this.isModalOpen = true;
      } else if (slug === 'confirm-status') {
          this.handleStatusFlag = true;
      } else {
          // Forward to nested child LWC
          setTimeout(() => {
              const child = this.template.querySelector('c-create-edit-staff-lwc');
              if (child) child.openPopup(slug);
          }, 300);
      }
  }

  @api async openByUID(uid, tabParam, isEdit) {  
      this._suppressEmit = true;
      try {
          const parts = (tabParam || '').split('/');
          const realTab = parts[0] || 'employee';
          const step = parts.find((p) => /^step[1-5]$/.test(p));
          const popup = parts.find((p) => p !== 'edit' && !/^step[1-5]$/.test(p) && p !== parts[0]);
        
          let staffId = this._staffIdForUid(uid);
          if (!staffId) {
              const response = await fetchStaff({ recordId: uid });
              if (response && response.Id) {
                  if (!this.satffDataJasonformat) {
                      this.satffDataJasonformat = {};
                  }
                  this.satffDataJasonformat[response.Id] = {
                      "uid": response.Staff_UID__c || '',
                      "street": response.Address__Street__s,
                      "city": response.Address__City__s,
                      "stateCode": response.Address__StateCode__s,
                      "countryCode": response.Address__CountryCode__s,
                      "postalCode": response.Address__PostalCode__s,
                      "childRecords": response.Child_Staffs__r,
                      "preTaxvalue": response.Pre_Tax_Calculator__c,
                      "pretaxone": response.Pre_Tax_One_Value__c,
                      "pretaxtwo": response.Pre_Tax_Two_Value__c,
                      "pretaxThree": response.Pre_Tax_Three_Value__c,
                      "pretaxFour": response.Pre_Tax_Four_Value__c,
                      "pretaxFive": response.Pre_Tax_Five_Value__c,
                      "postTax": response.Post_Tax__c,
                      "primaryVal": response.Make_Primary_as_Approver__c,
                      "secondaryVal": response.Make_Secondary_as_Approver__c,
                      "voluntaryContribution": response.Voluntary_Contribution__c,
                      "ContributionCurrency": response.Voluntary_Contribution_Fixed__c,
                      "ContributionPercent": response.Voluntary_Contribution_Percent__c,
                      "ContributionNone": response.Voluntary_Contribution_None__c,
                      "status": response.Status__c
                  };
                  staffId = response.Id;
              }
          }
          if (staffId) {
              this.loadStaffData(staffId);
              setTimeout(() => {
                  // this._selectTab(tab || 'employee');
                  // if (isEdit) {

                  this._selectTab(realTab);
                      const child = this.template.querySelector('c-create-edit-staff-lwc');
                      // if (child) child.startEdit();
                  if (isEdit && child) {
                      child.startEdit();
                      if (step) {
                          child.setStep(step);
                      }
                  }
                  if (popup) {
                      this._openPopupBySlug(popup);                      
                  }
              }, 300);
          }
      } catch (e) {
          console.error('openByUID error:', e);
      } finally {
          this._suppressEmit = false;
      }
      this._lastSubRoute = this._composeSubRoute();
      
  }

  @api openCreate(step) {
      this.handleCreateNewStaff(step);
  }

}