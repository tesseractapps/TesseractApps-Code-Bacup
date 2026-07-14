import { LightningElement, track, wire, api } from "lwc";
import fetchFacilitiess from "@salesforce/apex/ClientDataController.fetchFacilitiess";
import statusClient from "@salesforce/apex/ClientDataController.statusClient";
import checkFutureServices from '@salesforce/apex/ClientDataController.checkFutureServices';
import { NavigationMixin } from "lightning/navigation";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import FORM_FACTOR from "@salesforce/client/formFactor";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile";
import { subscribe, unsubscribe, onError } from "lightning/empApi";
import My_Resource from "@salesforce/resourceUrl/myResource";
import { RefreshEvent } from "lightning/refresh";
import getEmployeeData from "@salesforce/apex/issueRegisterSearch.getEmployeeData";
import insertStaffRecords from "@salesforce/apex/ClientDataController.insertStaffRecords";
import getStaffData from "@salesforce/apex/ClientDataController.getStaffData";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import updateStaffAssignments from "@salesforce/apex/ClientDataController.updateStaffAssignments";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import getStaffMembers from "@salesforce/apex/PreferredStaffController.getStaffMembers";
import getRoles from "@salesforce/apex/PreferredStaffController.getRoles";
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
import updateParticipantContacts from "@salesforce/apex/ClientDataController.updateParticipantContacts";
import upsertParticipantFacilities from '@salesforce/apex/staffFacilityHandler.upsertParticipantFacilities';
import fetchParticipantWithPagination from '@salesforce/apex/ClientSearchController.fetchParticipantWithPagination';
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import isParticipantLimitReached from '@salesforce/apex/LimitCheckService.isParticipantLimitReached';
import deleteContactAttachment from '@salesforce/apex/ClientAttachmentHandler.deleteContactAttachment';
import getContactAttachmentCounts from '@salesforce/apex/ClientAttachmentHandler.getContactAttachmentCounts';
import getContactAttachments from '@salesforce/apex/ClientAttachmentHandler.getContactAttachments';

const DEFAULT_ICON = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};

const DEFAULT_ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};


export default class ClientDataWithPagination extends NavigationMixin(
  LightningElement
) {
  Search = My_Resource + "/myResource/images/Participants.svg";
  // JS Properties
  recordId;
  subscription = {};
  CHANNEL_NAME = "/event/RefreshDataTable__e";
  records = []; //All records available in the data table
  columns = []; //columns information available in the data table
  totalRecords = 0; //Total no.of records
  pageSize=12; //No.of records to be displayed per page
  totalPages; //Total no.of pages
  pageNumber = 1; //Page number
  recordsToDisplay = []; //Records to be displayed on the page
   refreshTable ;
  @track recordsToDisplay = [];
  @api selectedName = "";
  @api facilityButton;
  @track orgNam = "";
  selectedfields = [];
  @track visible = true;
  @track firstname = "";
  @track lastname = "";
  @track ParticpantRecordForm;
  @track participantJson = {};
  @track headerName;
  @track buttonLabel;
  @track noRecordsFlag = false;
  @track showSpinner = false;
  @track status;
  @track fullName;
  @track showSpinner = false;
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
  @track cardview = true;
  @track lastName = "";
  @track firstName = "";
  @track OrgNisationRoles = [];
  @track facilityId = "";
  @track staffOptions = [];
  @track selectedRoles = []; // For selected staff
  @track role = "";
  @track roleStaffFlag = false;
  @track headeringName;
  @track addStaffDisable = true;
  @track participantlabel = "All";
  @track toggleValue = false;
  @track staffName = [];
  wiredStaffResult;
  @track savedSelectedRoles = [];
  @track orginalData = [];
  @track facilityOptions = [];
  @track selectedFacilities = [];
  @track userFacilities = [];
  @track finalListFacilities = [];
  @track fieldErrorMap = {};
  @track serializedPayload;
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;
  @track ndisFlag;
  @track ndisCreateFlag = false;
  @track nonndisFlag = false;
  @track individualFlag = false;
  @track CompanyFlag = false;
  @track ParticipantType;
  @track Company;
  alreadyRestoredClient = false;
  @track isMultiClientUpload= false;
  @track Languages = [];
  @track showUpgradeModal = false;

  @track showContactTypeModal = false;
  @track newContactTypeName = '';
  @track customContactTypes = [];
  @track stagedDeleteTypes = [];          // ✅ ARRAY (not Set)
  @track activeContactRowIndex;
  @track previousContactType;             // ✅ STORE OLD VALUE
  @track showClientCreationTemplate=false;
  @track clientCreationTypeName;
  @track clientWithUser;

  @track shiftDatesMessage = '';
  @track hasFutureShifts = false;

  get bDisableFirst() {
    return this.pageNumber == 1;
  }
  get bDisableLast() {
    return this.pageNumber == this.totalPages;
  }
  @track sectionFlags = {
    PartcipantDetails: true,
    Addressdetails: false,
    IdentificationDetails: false,
    ParticipantIdentifiers: false,
    MedicalCardDetails: false,
    InsuranceDetails: false,
    PrimaryContactDetails: false,
    SecondaryContactDetails: false,
    OtherPreferences: false,   
  };

    @track currentContactId;
    @track showContactAttachmentModal = false;
    @track uploadedFiles = [];
    @track totalfiles = [];
    @track isFileExpand = false;
    @track allowMultiple = true;
    @track documentedit = false;
    @track isFileAttached = false;
    @track recordIdForFileUpload = '';
    @track fileName = '';
    @track contactAttachments = [];
    @track showAttachmentListModal = false;
    @track selectedContactForFiles;
    @track selectedContactId;
    @track isModalOpen = false;
    @track currentUrl;
    @track isViewDoc = false;


  @track sectionIcons = {
    PartcipantDetails: { ...DEFAULT_ICON_DOWN }, // was \u2B9F
    Addressdetails: { ...DEFAULT_ICON },
    IdentificationDetails: { ...DEFAULT_ICON },
    ParticipantIdentifiers: { ...DEFAULT_ICON },
    MedicalCardDetails: { ...DEFAULT_ICON },
    InsuranceDetails: { ...DEFAULT_ICON },
    PrimaryContactDetails: { ...DEFAULT_ICON },
    SecondaryContactDetails: { ...DEFAULT_ICON },
    OtherPreferences: { ...DEFAULT_ICON }
  };



    facilityTypeOptions = [
        { label: 'Individual', value: 'Individual' },
        { label: 'Company', value: 'Company' }
    ];

  @track LANGUAGE_OPTIONS = [
    'Arabic', 'Armenian', 'Azerbaijani', 'Bengali', 'Burmese', 'Dhivehi', 'Dzongkha',
    'English', 'Filipino', 'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Indonesian',
    'Italian', 'Japanese', 'Kazakh', 'Khmer', 'Korean', 'Kyrgyz', 'Lao', 'Malay', 'Mandarin',
    'Mongolian', 'Nepali', 'Persian', 'Portuguese', 'Russian', 'Samoan', 'Sinhala', 'Swahili',
    'Thai', 'Tongan', 'Turkish', 'Urdu', 'Uzbek', 'Vietnamese'
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
  @track Nationality = '';
  @track contactList1 = [];
  @track contactList = [
      {
          id: 1,
          firstName: '',
          lastName: '',
          contactNumber: '',
          email: '',
          contactType: '', // NEW FIELD
          notify:false,
          firstNamePlaceholder: 'Enter Name',
          lastNamePlaceholder: 'Enter Name',
          phonePlaceholder: 'Enter Number',
          emailPlaceholder: 'Enter Email',
          showAdd: true,
          addButtonClass: 'add-visible'
      }
  ];

  @track contactTypeOptions = [
      { label: 'Primary', value: 'Primary' },
      { label: 'Secondary', value: 'Secondary' },
      { label: 'Guardian', value: 'Guardian' },
      { label: 'Emergency', value: 'Emergency' },
      { label: 'Nominee', value: 'Nominee' },
      { label: 'Informal Supports', value: 'Informal Supports' },
      { label: 'NDIA Planner', value: 'NDIA Planner' },
      { label: 'Local Area Coordinator', value: 'Local Area Coordinator' },
      { label: 'Support Coordinator', value: 'Support Coordinator' },
      { label: 'Specialist Support Coordinator', value: 'Specialist Support Coordinator' },
      { label: 'NDIS Provider', value: 'NDIS Provider' },
      { label: 'Support Worker', value: 'Support Worker' },
      { label: 'Key Worker', value: 'Key Worker' },
      { label: 'Allied Health Professionals', value: 'Allied Health Professionals' },
      { label: 'Psychologist', value: 'Psychologist' },
      { label: 'Occupational Therapist', value: 'Occupational Therapist' },
      { label: 'Speech Therapist', value: 'Speech Therapist' },
      { label: 'Physiotherapist', value: 'Physiotherapist' },
      { label: 'Behaviour Support Practitioner', value: 'Behaviour Support Practitioner' },
      { label: 'Mental Health Clinicians', value: 'Mental Health Clinicians' },
      { label: 'GP / Medical Specialists', value: 'GP / Medical Specialists' },
      { label: 'SIL Provider', value: 'SIL Provider' },
      { label: 'SDA Provider', value: 'SDA Provider' },
      { label: 'ILO Provider', value: 'ILO Provider' },
      { label: 'Tenancy / Housing Provider', value: 'Tenancy / Housing Provider' },
      { label: 'Advocates', value: 'Advocates' },
      { label: 'Plan Manager', value: 'Plan Manager' },
      { label: 'NDIA', value: 'NDIA' },
      { label: 'Self-Managed Participant', value: 'Self-Managed Participant' },
      { label: 'Corrective Services / Justice System', value: 'Corrective Services / Justice System' },
      { label: 'Child Protection', value: 'Child Protection' },
      { label: 'Housing NSW', value: 'Housing NSW' },
      { label: 'Hospitals & Emergency Services', value: 'Hospitals & Emergency Services' },
      { label: 'Add New', value: 'Add New Contact Type' }
  ];
  @track typeOfIndustry=[{ label: 'NDIS', value: 'NDIS' },
                           { label: 'Non-NDIS', value: 'Non-NDIS' },
                           { label: 'Aged Care', value: 'Aged Care' }
      ];

  clientCreationTypes = [
      { label: 'Create a user account for the participant', value: 'Create a user account for the participant' },
      { label: 'Managed by admin only', value: 'Managed by admin only' }
  ];
  @track multiFacilityDroDownList=[];
  @track selctedMultipleFcailityValues=[];
  @track facilityDropDownOpen=false;
  @track activeFaciltyDisplay='';
  @track selectedTypeOfIndustry='NDIS';
  @track  orginalSelectedFacilities=[];
  @track isMedicareEntered = false;
  @track facilityIds =[];
  @track searchText = '';
  @track refreshKey = 0;
  @track isActive = true;
  @track isShowSpinner=false;

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
    return this.getFieldClass("Email__c");
  }
  get DateOfBirthClass() {
    return this.getFieldClass("Date_Of_Birth__c");
  }
   get ContactNumberClass() {
        return this.getFieldClass('Contact_Number__c');
    }
  tLogoUrl = `${Loading_Logo}/TLogo.png`;
   tImageUrl = `${Loading_Logo}/T.png`;
  get logoUrl() {
            return this.tLogoUrl;
    }
    
   get imageUrl() {
            return this.tImageUrl;
    }

@track createCurrentStep = 'createstep1';

// ═══════════════════════════════════════════════
// STEP WIZARD GETTERS
// ═══════════════════════════════════════════════
get step1Class() { return this.createCurrentStep === 'createstep1' ? '' : 'slds-hide'; }
get step2Class() { return this.createCurrentStep === 'createstep2' ? '' : 'slds-hide'; }
get step3Class() { return this.createCurrentStep === 'createstep3' ? '' : 'slds-hide'; }
get step4Class() { return this.createCurrentStep === 'createstep4' ? '' : 'slds-hide'; }
get step5Class() { return this.createCurrentStep === 'createstep5' ? '' : 'slds-hide'; }

get totalSteps() { return this.CompanyFlag ? 3 : 5; }
get currentStepNumber() { return Number(this.createCurrentStep.replace('createstep', '')); }
get showPrevious()  { return this.currentStepNumber > 1; }
get showNext()      { return this.currentStepNumber < this.totalSteps; }
get showSave()      { return this.currentStepNumber === this.totalSteps; }
get showSkip()      { return !this.CompanyFlag && this.createCurrentStep === 'createstep4'; }

// handleCreateNext() {
//     const errors = this.validateStepFields(this.createCurrentStep);
//     if (errors.length) {
//         this.dispatchEvent(new ShowToastEvent({
//             title: 'Error',
//             message: 'Please fill required fields: ' + errors.join(', '),
//             variant: 'error'
//         }));
//         return;
//     }
//     if (this.currentStepNumber < this.totalSteps) {
//         this.createCurrentStep = 'createstep' + (this.currentStepNumber + 1);
//     }
// }

handleCreatePrevious() {
    if (this.currentStepNumber > 1) {
        this.createCurrentStep = 'createstep' + (this.currentStepNumber - 1);
    }
}

handleSkipStep() {
    this.createCurrentStep = 'createstep5';
}

// handleCreateStepClick(event) {
//     const targetStep = event.target.value;
//     const target = Number(targetStep.replace('createstep', ''));
//     const current = this.currentStepNumber;
//     if (target > this.totalSteps) return;
//     if (target > current) {
//         const missing = this.validateStepFields(this.createCurrentStep);
//         if (missing.length > 0) {
//             this.dispatchEvent(new ShowToastEvent({
//                 title: 'Error',
//                 message: 'Please fill required fields: ' + missing.join(', '),
//                 variant: 'error'
//             }));
//             return;
//         }
//     }
//     this.createCurrentStep = targetStep;
// }

// validateStepFields(stepName) {
//     const missing = [];

//     if (stepName === 'createstep1') {
//         if (!this.clientCreationTypeName) missing.push('Login & Access type');
//         return missing;
//     }

//     if (stepName === 'createstep2') {
//         if (!this.selectedTypeOfIndustry)   missing.push('Type of Industry');
//         if (!this.selctedMultipleFcailityValues ||
//             this.selctedMultipleFcailityValues.length === 0) missing.push('Facility');
//         if (this.nonndisFlag && !this.ParticipantType) missing.push('Participant Type');
//         if (this.ndisCreateFlag || this.individualFlag) {
//             if (!this.firstName || !this.firstName.trim()) missing.push('First Name');
//             if (!this.lastName  || !this.lastName.trim())  missing.push('Last Name');
//             if (!this.street || !this.city || !this.province ||
//                 !this.postalcode || !this.country)
//                 missing.push('Address');
//         }
//         if (this.CompanyFlag && (!this.Company || !this.Company.trim()))
//             missing.push('Company Name');
//         if (this.clientWithUser) {
//             const ef = this.template.querySelector(
//                 '[data-step="createstep2"] lightning-input-field[field-name="Email__c"]'
//             );
//             if (ef && !ef.value) missing.push('Email ID');
//         }
//         return missing;
//     }

//     if (stepName === 'createstep3') {
//         if (this.CompanyFlag) {
//             missing.push(...this._validateContacts());
//         } else {
//             // Medicare cross-validation
//             const step = this.template.querySelector('[data-step="createstep3"]');
//             if (step) {
//                 const mv = step.querySelector('[field-name="MedicareCardID__c"]')?.value;
//                 const iv = step.querySelector('[field-name="IRN__c"]')?.value;
//                 const ev = step.querySelector('[field-name="ExpiryDate__c"]')?.value;
//                 if (mv) {
//                     if (!iv) missing.push('IRN (required with Medicare)');
//                     if (!ev) missing.push('Expiry Date (required with Medicare)');
//                 }
//                 if (iv && !mv) missing.push('Medicare Card ID (required with IRN)');
//             }
//         }
//         return missing;
//     }

//     if (stepName === 'createstep4') {
//         missing.push(...this._validateContacts());
//         return missing;
//     }

//     return missing; // step5 has no required fields
// }

// _validateContacts() {
//     const errors = [];
//     const primary = this.contactList.filter(c => c.contactType === 'Primary');
//     for (const c of primary) {
//         if (!c.firstName || !c.lastName || !c.contactNumber || !c.email) {
//             errors.push('All fields required for Primary contact');
//             break;
//         }
//     }
//     this.contactList.forEach((c, i) => {
//         if (c.notify && !c.email)
//             errors.push(`Email required for Notify row ${i + 1}`);
//         if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))
//             errors.push(`Invalid email in contact row ${i + 1}`);
//     });
//     return errors;
// }
// handleCreateNext() {
//     const errors = this.validateStepFields(this.createCurrentStep) || []; // ← add || []
//     if (errors.length) {
//         this._triggerStepValidation(this.createCurrentStep);
//         this.dispatchEvent(new ShowToastEvent({
//             title: 'Validation Error',
//             message: 'Please fill required fields: ' + errors.join(', '),
//             variant: 'error'
//         }));
//         return;
//     }
//     if (this.currentStepNumber < this.totalSteps) {
//         this.createCurrentStep = `createstep${this.currentStepNumber + 1}`;
//     }
// }

// FIXED — handleCreateNext
handleCreateNext() {
    const errors = this.validateStepFields(this.createCurrentStep);

    const isContactsStep = (this.CompanyFlag && this.createCurrentStep === 'createstep3') ||
                           (!this.CompanyFlag && this.createCurrentStep === 'createstep4');

    if (errors.length > 0) {
        this.triggerStepValidation(this.createCurrentStep);

        if (isContactsStep) {
            // For contacts step: ONLY show toast if Primary contact type is selected AND fields missing
            const hasPrimarySelected = this.contactList.some(c => c.contactType === 'Primary');
            if (hasPrimarySelected) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Validation Error',
                    message: `Please fill required fields: ${errors.join(', ')}`,
                    variant: 'error'
                }));
            }
            // If no row has contactType='Primary' → silently allow navigation
        } else {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Validation Error',
                message: `Please fill required fields: ${errors.join(', ')}`,
                variant: 'error'
            }));
        }
        // Block navigation only if: non-contacts step OR (contacts step AND primary selected with errors)
        const isContactsStepWithPrimary = isContactsStep && this.contactList.some(c => c.contactType === 'Primary');
        if (!isContactsStep || isContactsStepWithPrimary) {
            return;
        }
    }

    if (this.currentStepNumber < this.totalSteps) {
        this.createCurrentStep = `createstep${this.currentStepNumber + 1}`;
    }
}

// FIXED — handleCreateStepClick
handleCreateStepClick(event) {
    const targetStep = event.target.value;
    const target = Number(targetStep.replace('createstep', ''));
    const current = this.currentStepNumber;
    if (target > this.totalSteps) return;

    if (target > current) {
        const missing = this.validateStepFields(this.createCurrentStep);

        if (missing.length > 0) {
            this.triggerStepValidation(this.createCurrentStep);

            const isContactsStep = (this.CompanyFlag && this.createCurrentStep === 'createstep3') ||
                                   (!this.CompanyFlag && this.createCurrentStep === 'createstep4');

            if (isContactsStep) {
                // Only show toast + block if a Primary row exists with missing fields
                const hasPrimarySelected = this.contactList.some(c => c.contactType === 'Primary');
                if (hasPrimarySelected) {
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Validation Error',
                        message: `Please fill required fields: ${missing.join(', ')}`,
                        variant: 'error'
                    }));
                    return; // Block navigation only for Primary errors
                }
                // Non-Primary or empty contactType → fall through and allow navigation
            } else {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Validation Error',
                    message: `Please fill required fields: ${missing.join(', ')}`,
                    variant: 'error'
                }));
                return;
            }
        }
    }
    this.createCurrentStep = targetStep;
}

_triggerStepValidation(stepName) {
    const stepContainer = this.template.querySelector(`[data-step="${stepName}"]`);
    if (!stepContainer) return;

    // Trigger reportValidity on all lightning-input-field elements
    stepContainer.querySelectorAll('lightning-input-field').forEach(field => {
        field.reportValidity();
    });

    // Trigger reportValidity on all lightning-input elements (e.g. contact table)
    stepContainer.querySelectorAll('lightning-input').forEach(input => {
        input.reportValidity();
    });

    // Trigger reportValidity on all lightning-combobox elements
    stepContainer.querySelectorAll('lightning-combobox').forEach(combo => {
        combo.reportValidity();
    });
}

getField(label) {
    return this.template.querySelector(`[data-label="${label}"]`);
}

// FIXED — validateContacts
validateContacts() {
    const errors = [];
    const primaryContacts = this.contactList.filter(c => c.contactType === 'Primary');

    // Only validate fields/toast when user has explicitly chosen 'Primary' contact type
    for (const c of primaryContacts) {
        if (!c.firstName || !c.lastName || !c.contactNumber || !c.email) {
            errors.push('All fields are required for Primary contact');
            break;
        }
    }

    // Notify & email-format checks apply to all rows (no blocking for non-Primary types)
    for (let i = 0; i < this.contactList.length; i++) {
        const c = this.contactList[i];
        if (c.notify && !c.email) {
            errors.push(`Email required for Notify row ${i + 1}`);
        }
        if (c.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(c.email)) {
                errors.push(`Invalid email in contact row ${i + 1}`);
            }
        }
    }
    return errors;
}

triggerStepValidation(stepName) {
    const stepContainer = this.template.querySelector(`[data-step="${stepName}"]`);
    if (!stepContainer) return;
    stepContainer.querySelectorAll('lightning-input-field').forEach(f => f.reportValidity());
    stepContainer.querySelectorAll('lightning-input').forEach(f => f.reportValidity());
    stepContainer.querySelectorAll('lightning-combobox').forEach(f => f.reportValidity());
}



validateStepFields(stepName) {
    const missing = [];

    const phoneRegex = /^[0-9]{10,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ─── STEP 1 — Login & Access ───────────────────────────────────────────
    if (stepName === 'createstep1') {
        if (!this.clientCreationTypeName) missing.push('Login & Access type');
        return missing;
    }

    // ─── STEP 2 — Personal / Company Details ──────────────────────────────
    if (stepName === 'createstep2') {
        if (!this.selectedTypeOfIndustry) missing.push('Type of Industry');
        if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
            missing.push('Facility');
        }
        if (this.nonndisFlag && !this.ParticipantType) missing.push('Participant Type');

        // ── NDIS / Individual ──────────────────────────────────────────────
        if (this.ndisCreateFlag || this.individualFlag) {
            if (!this.firstName?.trim()) missing.push('First Name');
            if (!this.lastName?.trim())  missing.push('Last Name');

            const genderField  = this.getField('gender');
            const dobField     = this.getField('dob');
            const crnField     = this.getField('crn');
            const contactField = this.getField('contact');
            const emailField   = this.getField('email');

            if (genderField && !genderField.value) {
                genderField.reportValidity();
                missing.push('Gender');
            }
            if (dobField && !dobField.value) {
                dobField.reportValidity();
                missing.push('Date Of Birth');
            }
            if (crnField?.value) {
                if (!/^[0-9]{9}[A-Za-z]{1}$/.test(crnField.value)) {
                    missing.push('Invalid CRN');
                }
            }

            // Contact Number — required + regex
            if (!contactField?.value) {
                contactField?.reportValidity();
                missing.push('Contact Number');
            } else if (!phoneRegex.test(contactField.value)) {
                contactField.reportValidity();
                missing.push('Invalid Contact Number');
            }

            // Email — required if clientWithUser, format-only if optional
            if (this.clientWithUser) {
                if (!emailField?.value) {
                    emailField?.reportValidity();
                    missing.push('Email is required for user account');
                } else if (!emailRegex.test(emailField.value)) {
                    emailField.reportValidity();
                    missing.push('Invalid Email');
                }
            } else if (emailField?.value && !emailRegex.test(emailField.value)) {
                emailField.reportValidity();
                missing.push('Invalid Email');
            }

            if (!this.street || !this.city || !this.province || !this.postalcode || !this.country) {
                missing.push('Address');
            }
        }

        // ── Company ────────────────────────────────────────────────────────
// FIXED — Company block in validateStepFields (createstep2)
if (this.CompanyFlag) {
    const stepEl = this.template.querySelector('[data-step="createstep2"]');
    const companyEl = stepEl?.querySelector('[data-id="companyName"]');
    const startDateEl = stepEl?.querySelector('[data-id="startDate"]');
    const contactEl = stepEl?.querySelector('[data-id="contact"]');
    const emailEl = stepEl?.querySelector('[data-id="email"]');

    // Company Name
    if (!companyEl?.value?.trim()) missing.push('Company Name');

    // Start Date required
    if (!startDateEl?.value) {
        startDateEl?.reportValidity?.();
        missing.push('Start Date');
    }

    // Contact Number — scope to step to avoid picking up NDIS individual's field
    const contactVal = (contactEl?.value || '').trim();
    if (!contactVal) {
        contactEl?.reportValidity?.();
        missing.push('Contact Number');
    } else if (!phoneRegex.test(contactVal)) {
        contactEl?.reportValidity?.();
        missing.push('Invalid Contact Number');
    }

    // Email validation
    if (this.clientWithUser) {
        if (!emailEl?.value) { emailEl?.reportValidity?.(); missing.push('Email is required for user account'); }
        else if (!emailRegex.test(emailEl.value)) { emailEl?.reportValidity?.(); missing.push('Invalid Email'); }
    } else if (emailEl?.value && !emailRegex.test(emailEl.value)) {
        emailEl?.reportValidity?.();
        missing.push('Invalid Email');
    }

    if (!this.street || !this.city || !this.province || !this.postalcode || !this.country) {
        missing.push('Address');
    }
}

        // ── Preferred Nickname — applies to ALL participant types ──────────
        const currentStepEl  = this.template.querySelector(`[data-step="${stepName}"]`);
        const preferNickname = currentStepEl?.querySelector('[data-id="preferNickname"]');
        const nicknameField  = currentStepEl?.querySelector('[data-id="nicknameField"]');
        if (preferNickname?.value === true) {
            if (!nicknameField?.value || !nicknameField.value.trim()) {
                missing.push('Preferred Name');
                nicknameField?.reportValidity();
                // nicknameField?.classList.add('slds-has-error');
            } else {
                // nicknameField?.classList.remove('slds-has-error');
                setTimeout(() => nicknameField?.reportValidity(), 0);
            }
        }

        // ── Email required for user account (clientWithUser block already
        //    handles this above — this duplicate block is intentionally removed)

        return [...new Set(missing)];
    }

    // ─── STEP 3 — Identification (NDIS/Individual) OR Contacts (Company) ──
    if (stepName === 'createstep3') {
        if (!this.CompanyFlag) {
            const step = this.template.querySelector('[data-step="createstep3"]');
           if (step) {
                const medicare = step.querySelector('[data-id="medicare"]');
                const irn      = step.querySelector('[data-id="irn"]');
                const expiry   = step.querySelector('[data-id="expiryDate"]');
                const medicareVal = medicare?.value ?? null;
                const irnVal      = irn?.value      ?? null;
                const expiryVal   = expiry?.value   ?? null;
                if (medicareVal) {
             if (!irnVal && !expiryVal) {
                    missing.push('IRN and Expiry Date (required when Medicare Card ID is entered)');
              } else {
                    if (!irnVal)    missing.push('IRN (required when Medicare Card ID is entered)');
                    if (irnVal && (Number(irnVal) < 0 || Number(irnVal) > 9))  missing.push('IRN must be a single digit between 0 and 9');
                    if (!expiryVal) missing.push('Expiry Date (required when Medicare Card ID is entered)');
                }
                }
                if (irnVal && !medicareVal) missing.push('Medicare Card ID (required when IRN is entered)');
            }
        }
        if (this.CompanyFlag) {
            missing.push(...this.validateContacts());
        }
        return missing;
    }

    // ─── STEP 4 — Contacts (NDIS/Individual) ──────────────────────────────
    if (stepName === 'createstep4') {
        missing.push(...this.validateContacts());
        return missing;
    }

    // ─── STEP 5 — Support Preferences (optional, always passes) ───────────
    return missing;
}
// validateStepFields(stepName) {
//     const missing = [];

//     if (stepName === 'createstep1') {
//         if (!this.clientCreationTypeName) missing.push('Login & Access type');
//         return missing;
//     }

// if (stepName === 'createstep2') {
//     const currentStepEl = this.template.querySelector(`[data-step="${stepName}"]`);

//     if (!this.selectedTypeOfIndustry)
//         missing.push('Type of Industry');

//     if (!this.selctedMultipleFcailityValues ||
//         this.selctedMultipleFcailityValues.length === 0)
//         missing.push('Facility');

//     if (this.nonndisFlag && !this.ParticipantType)
//         missing.push('Participant Type');

//     if (this.ndisCreateFlag || this.individualFlag) {
//         if (!this.firstName?.trim()) missing.push('First Name');
//         if (!this.lastName?.trim())  missing.push('Last Name');

//         const genderField   = this.getField('gender');
//         const dobField      = this.getField('dob');
//         const crnField      = this.getField('crn');
//         const contactField  = this.getField('contact');
//         const emailField    = this.getField('email');

//         if (genderField && !genderField.value) {
//             genderField.reportValidity();
//             missing.push('Gender');
//         }
//         if (dobField && !dobField.value) {
//             dobField.reportValidity();
//             missing.push('Date Of Birth');
//         }

//         // ✅ staffDataCommunity pattern — no onchange needed
//         const preferNickname = currentStepEl?.querySelector('[data-id="preferNickname"]');
//         const nicknameField  = currentStepEl?.querySelector('[data-id="nicknameField"]');

//         if (preferNickname?.value === true) {
//             if (!nicknameField?.value || !nicknameField.value.trim()) {
//                 missing.push('Preferred Name');
//                 nicknameField.reportValidity();
//                 // nicknameField.classList.add('slds-has-error');
//             } else {
//                 // nicknameField.classList.remove('slds-has-error');
//                 setTimeout(() => { nicknameField.reportValidity(); }, 0);
//             }
//         }

//         if (crnField && crnField.value) {
//             const crnRegex = /^[0-9]{9}[A-Za-z]{1}$/;
//             if (!crnRegex.test(crnField.value)) missing.push('Invalid CRN');
//         }
//         if (contactField && contactField.value) {
//             const phoneRegex = /^[0-9]{10,15}$/;
//             if (!phoneRegex.test(contactField.value)) missing.push('Invalid Contact Number');
//         }
//         if (emailField && emailField.value) {
//             const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//             if (!emailRegex.test(emailField.value)) missing.push('Invalid Email');
//         }
//         if (!this.street || !this.city || !this.province ||
//             !this.postalcode || !this.country)
//             missing.push('Address');
//     }

//     if (this.CompanyFlag) {
//         if (!this.Company?.trim()) missing.push('Company Name');
//     }

//     if (this.clientWithUser) {
//         const emailField = this.getField('email');
//         if (emailField && !emailField.value)
//             missing.push('Email ID (required for user account)');
//     }

//     return [...new Set(missing)];
// }

//     // Step 3 — Identification / Company contacts
//     if (stepName === 'createstep3') {
//         if (!this.CompanyFlag) {
//             const step = this.template.querySelector('[data-step="createstep3"]');
//             if (step) {
//                 const medicare = step.querySelector('lightning-input-field[field-name="MedicareCardIDc"]');
//                 const irn = step.querySelector('lightning-input-field[field-name="IRNc"]');
//                 const expiry = step.querySelector('lightning-input-field[field-name="ExpiryDatec"]');
//                 const medicareVal = medicare?.value || null;
//                 const irnVal = irn?.value || null;
//                 const expiryVal = expiry?.value || null;
//                 if (medicareVal) {
//                     if (!irnVal) missing.push('IRN (required with Medicare)');
//                     if (!expiryVal) missing.push('Expiry Date (required with Medicare)');
//                 }
//                 if (irnVal && !medicareVal) missing.push('Medicare Card ID (required with IRN)');
//             }
//         }
//         // if (this.CompanyFlag) {
//         //     missing.push(...this.validateContacts());
//         // }
//         return missing;
//     }

//     // Step 4 — Contacts (Individual/NDIS)
//     // if (stepName === 'createstep4') {
//     //     missing.push(...this.validateContacts());
//     //     return missing;
//     // }

//     // Step 5 — Support Preferences (optional, no required fields)
//     return missing; // ← THIS is the critical safety return
// }     

  @wire(getStaffData, {
    clientId: "$clientId",
    facilityId: "$facilityId",
    role: "$role"
  })
  wiredStaffData(result) {
    this.selectedRoles = [];
    this.wiredStaffResult = result; // Store the result for later use in refreshApex
    console.log("result in wire method " + JSON.stringify(result));
    const { error, data } = result;
    if (data) {
      // Process the data
      this.staffOptions = data.map((record) => ({
        value: record.Id,
        label: record.Name
      }));

      console.log("Staff options: " + JSON.stringify(this.staffOptions));

      // Assign the first staff's label to staffVal if available
      if (this.staffOptions.length > 0) {
        this.staffVal = this.staffOptions[0].label;
      }

      // Default to pre-assigned staff if no roles selected
      if (!this.selectedRoles || this.selectedRoles.length === 0) {
        this.selectedRoles = data
          .filter((record) => record.isAssigned == true) // Assuming 'isAssigned' indicates if the staff is already assigned
          .map((record) => record.Id);
      }
      console.log("Selected staff: " + JSON.stringify(this.selectedRoles));
    } else if (error) {
      console.error("Error fetching staff values: ", error);
    }
  }

  fetchStaffData() {
    getStaffData({
      clientId: this.clientid,
      facilityId: this.facilityId,
      role: this.role
    })
      .then((data) => {
        console.log("result in imperative method: ", JSON.stringify(data));

        this.staffOptions = data.map((record) => ({
          value: record.Id,
          label: record.Name
        }));

        if (this.staffOptions.length > 0) {
          this.staffVal = this.staffOptions[0].label;
        }

        if (!this.selectedRoles || this.selectedRoles.length === 0) {
          this.selectedRoles = data
            .filter((record) => record.isAssigned)
            .map((record) => record.Id);
        }

        console.log("Selected staff: ", JSON.stringify(this.selectedRoles));
      })
      .catch((error) => {
        console.error("Error fetching staff values: ", error);
      });
  }

  @track isStatusTrue =false;
   
   @wire(fetchParticipantWithPagination, {
    searchText: '$searchText',
    facilityIds: '$facilityIds',
    isTrue: '$isStatusTrue',
    pageSize: '$pageSize',
    pageNumber: '$pageNumber',
      isActive: '$isActive'
    })
     wiredClients(result) {
        console.log('WIRE PARAMS', {
        searchText: this.searchText,
        facilityIds: this.facilityIds,
        pageSize: this.pageSize,
        pageNumber: this.pageNumber,
        refreshKey: this.refreshKey,
        isActive :this.isActive
        

    });

    this.refreshTable = result;
    console.log(' data from wire '+JSON.stringify(result));

    if (result.data) {

        this.isShowSpinner=true;

        const data = result.data.records || [];

        // 🔥 reset JSON map
        this.participantJson = {};

        // ✅ SINGLE LOOP (transform + json map)
        const finalData = data.map(rec => {

            const firstName = rec.First_Name__c || '';
            const lastName = rec.Last_Name__c || '';
            console.log('Record Id:', rec.Id, 'Status:', rec.Status__c);
            // 🔥 Build participantJson
            this.participantJson[rec.Id] = {
                street: rec.Address__Street__s,
                city: rec.Address__City__s,
                stateCode: rec.Address__StateCode__s,
                countryCode: rec.Address__CountryCode__s,
                postalCode: rec.Address__PostalCode__s,
                status: rec.Status__c,

                orgId: rec.Facility__r?.Organisation__c,

                firstName: firstName,
                lastName: lastName,
                name: (`${firstName} ${lastName}`.trim()) || rec.Company__c,

                typeofservice: rec.Facility__r?.Type_of_Service__c,
                participanttype: rec.ParticipantType__c,
                languages: rec.Preferred_Languages__c || "",
                nationality: rec.Preferred_Nationality__c || ""
            };

            // 🔥 Return UI record
            return {
                ...rec,
               typeOfServiceInUI: rec.Facility__r?.Type_of_Service__c ?rec.Facility__r.Type_of_Service__c :'',
                activeFaciltyDisplay: rec.Participant_Facilities__r?.length
                    ? rec.Participant_Facilities__r
                        .map(f => f.Facility__r?.Name)
                        .filter(Boolean)
                        .join(', ')
                    : '',

                fullName: (`${firstName} ${lastName}`).trim(),
                    // ✅ ADD THIS
                  statusClass:
                      rec.Participant_Status__c === 'Active'
                          ? 'status-pill status-active'
                          : 'status-pill status-inactive'
            };
        });

        // ✅ Assign
        this.records = finalData;
        this.recordsToDisplay = finalData;

        this.totalRecords = result.data.totalRecords;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

        this.noRecordsFlag = this.totalRecords === 0;
       // this.visible = this.totalRecords > this.pageSize;
         const storedClientId = localStorage.getItem('adminClientRecordId');
         console.log("storedClientId IN connectedCallback :", storedClientId);
         if (storedClientId && this.participantJson?.[storedClientId]) {
           console.log(' adminClientRecordId AND this.participantJson found in localStorage INSIDE connectedCallback.');
          const json = this.participantJson[storedClientId];
          this.loadClientData(
            storedClientId,
            json.typeofservice,
            json.participanttype
          );
        } else {
          if (!storedClientId) {
            console.log('No adminClientRecordId found in localStorage.');
          } else {
            console.log(`No participantJson found for adminClientRecordId: ${storedClientId}`);
          }
        } 

      
          setTimeout(() => {
             this.isShowSpinner=false;
        }, 500); 

    } else if (result.error) {

        this.isShowSpinner = false;

        console.error('Error in fetchFacilitiess:', result.error);
    }
}    

    handleSectionToggle(event) {
      const sectionId = event.currentTarget.dataset.id;
      const sectionElement = this.template.querySelector(
        `[data-section="${sectionId}"]`
      );

      if (!this.sectionFlags[sectionId]) {
        // First click: load section and show it
        this.sectionFlags[sectionId] = true;

        // ▼ Expanded → DOWN
        this.sectionIcons[sectionId] = { ...DEFAULT_ICON_DOWN };

      } else {
        // Toggle visibility after first render
        sectionElement.classList.toggle('hidden-section');

        const isCollapsed = sectionElement.classList.contains('hidden-section');

        // ◀ Collapsed → LEFT | ▼ Expanded → DOWN
        this.sectionIcons[sectionId] = isCollapsed
          ? { ...DEFAULT_ICON }
          : { ...DEFAULT_ICON_DOWN };
      }
    }



  // connectedCallback method called when the element is inserted into a document
  connectedCallback() {
     try {
    this.setPageSizeByZoomAndScreen(); // Initial setup
    this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
    this._handleOutsideClick = this.handleClickOutside.bind(this);
    // Add responsive listener
    window.addEventListener("resize", this.handleResize.bind(this));
    window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
    this.wiredStaffResult = [];
    //Platform Event
    subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then((response) => {
      this.subscription = response;
    });
    onError((error) => {});
    organizationDetails().then((response) => {
      let orgRoles = response.listofPriceBook.Roles__c;
      this.role = this.OrgNisationRoles[0].value;
      //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
      //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;
    });

        const storedFacilityId = localStorage.getItem('defaultFacilityId');
        const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
        console.log('📦 storedFacilityId:', storedFacilityId);
        console.log('📦 storedFacilityLabel:', storedFacilityLabel);

      /*    getFacilityData().then(facresponse => {
    
                this.finalListFacilities = [];
                this.selectedFacilities = [];
    
                this.facilityOptions = facresponse.map(record => ({
                    label: record.Name,
                    value: record.Id
                }));
  
                    this.finalListFacilities = this.facilityOptions;
    
                    this.selectedFacilities = [{
                        label: storedFacilityLabel,
                        value: storedFacilityId
                    }];
                    this.facilityIds = [storedFacilityId];
    
                    console.log('✅ selectedFacilities SET:', JSON.stringify(this.facilityIds));
    
                    // 🔥 FORCE WIRE
                    this.refreshKey++;
    
                    console.log('🔁 refreshKey incremented:', this.refreshKey);
             
            });
       */
       getCurrentLoggedUserInfo().then(userData => {
      
              let userType = userData.User_Type__c;
              const userEmail = userData.Email;
              console.log('👤 userType:', userType);
              console.log('📧 userEmail:', userEmail);
      
              getFacilityData().then(facresponse => {
                this.finalListFacilities = [];
                this.selectedFacilities = [];
    
              this.facilityOptions = facresponse.map(record => ({
                    label: record.Name,
                    value: record.Id,
                    Type_of_Service__c:record.Type_of_Service__c
                }));
                    // ✅ ORG ADMIN / ICT ADMIN
            if (userType === 'NDIS Org Admin' || userType === 'ICT Admin') {

              this.finalListFacilities=this.facilityOptions;
              this.multiFacilityDroDownList= this.finalListFacilities;
              this.orginalSelectedFacilities =  this.multiFacilityDroDownList;
                this.selectedFacilities = [{
                        label: storedFacilityLabel,
                        value: storedFacilityId
                    }];
                    this.facilityIds = [storedFacilityId];
    
                    console.log('✅ selectedFacilities SET:', JSON.stringify(this.facilityIds));
    
                    // 🔥 FORCE WIRE
                    this.refreshKey++;

            }  else if (userType === 'Facility Admin' || userType === 'HR Admin' || userType === 'Roster Manager') {
            
                            getFacilityCurrentUser().then(result => {
                                this.finalListFacilities = result.map(record => ({
                                  label: record.Facility__r.Name,
                                  value: record.Facility__r.Id,
                                  Type_of_Service__c:record.Facility__r.Type_of_Service__c
                              }));

                            this.multiFacilityDroDownList= this.finalListFacilities;
                            this.orginalSelectedFacilities =  this.multiFacilityDroDownList;
                                this.selectedFacilities = [{
                                label: storedFacilityLabel,
                                value: storedFacilityId
                            }];
                            this.facilityIds = [storedFacilityId];
            
                            console.log('✅ selectedFacilities SET:', JSON.stringify(this.facilityIds));
            
                            // 🔥 FORCE WIRE
                            this.refreshKey++;

            
                 });
             }

         });
    });



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


    this.contactList = [
        {
            id: 1,
            firstName: '',
            lastName: '',
            contactNumber: '',
            email: '',
            contactType: '', // NEW FIELD,
            notify:false,
            firstNamePlaceholder: 'Enter Name',
            lastNamePlaceholder: 'Enter Name',
            phonePlaceholder: 'Enter Number',
            emailPlaceholder: 'Enter Email',
            showAdd: true,
            addButtonClass: 'add-visible'
        }
    ];
    // this.fetchMultiFaciltyOptions();
     } catch (error) {
        console.error('🔥 ERROR in connectedCallback:', error);
        console.error('🔥 STACK:', error?.stack);
    }
       
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
      this.paginationHelper(); // Recalculate pages if size changed
    }
  }
  handleStatus(event) {
    this.toggleValue = event.target.checked;
    console.log("Toggle status:", this.toggleValue);
  }

  handleFacilityChange(event) {
    //  console.log('facility onchange '+(event.target)) ;
    this.ParticipantType=''; 
    this.facilityId = event.target.value; // Capture Facility ID
     if (this.facilityId) {
            // Call Apex to get facility details
            getfacilityById({ facId: this.facilityId })
                .then(result => {
                    console.log('Facility Record:', result);
                   if (result.Type_of_Service__c === 'NDIS') {
                    this.ndisCreateFlag = true;
                    this.nonndisFlag = false;
                    this.CompanyFlag = false;
                    this.individualFlag = false;
                } else {
                    this.ndisCreateFlag = false;
                    this.nonndisFlag = true;
                    this.CompanyFlag = false;
                    this.individualFlag = false;
                }

                console.log('NDIS Flag:', this.ndisCreateFlag);
                console.log('Non-NDIS Flag:', this.nonndisFlag);

                   
                })
                .catch(error => {
                    console.error('Error fetching facility:', error);
                });
        }
    //refreshApex(this.wiredStaffResult);
    this.fetchStaffData();
    console.log("Selected facility >> " + this.facilityId);
    this.addStaffDisable = !this.facilityId;
  }

   handleParticipantType(event) {
        const facilityType = event.target.value;
        this.ParticipantType=facilityType;

        if (facilityType === 'Individual') {
            this.individualFlag = true;
            this.CompanyFlag = false;
            this.ndisCreateFlag= false;
        } else {
            this.CompanyFlag = true;
            this.individualFlag = false;
            this.ndisCreateFlag= false;
           
        }

        console.log('Individual Flag:', this.individualFlag);
        console.log('ParticipantType:', this.ParticipantType);
       
    }

     handleCompanyChange(event){
       this.Company = event.detail.value;
       console.log('Company>>'+this.Company);
       this.fullName = this.Company;
   }

  handleChangeRole(event) {
    console.log("onchange " + JSON.stringify(event.detail));
    this.role = event.detail.value; // Handle combobox value change
    console.log("Selected Role >> " + this.role);
    this.getStaffValues();
  }
  getStaffValues() {
    console.log("Selected facility >> " + this.facilityId);
    console.log("Selected Role >> " + this.role);
    // Call Apex method to get staff data, including which staff are already assigned to the participant
    getStaffData({
      clientId: this.clientId,
      facilityId: this.facilityId,
      role: this.role
    })
      .then((response) => {
        this.staffOptions = response.map((record) => ({
          value: record.Id,
          label: record.Name
        }));
        console.log("Staff options: " + JSON.stringify(this.staffOptions));


        if (this.savedSelectedRoles && this.savedSelectedRoles.length > 0) {
          this.selectedRoles = [...this.savedSelectedRoles];
        } else {
          this.selectedRoles = response
            .filter((record) => record.isAssigned)
            .map((record) => record.Id);
        }

        console.log("Selected staff: " + JSON.stringify(this.selectedRoles));
      })
      .catch((err) => {
        console.error("Error fetching staff values: ", err);
      });
  }

 

  handleError(event) {
    event.preventDefault(); // Prevent default UI (red errors under fields)
    this.removeRadius = true;
    this.fieldErrorMap = {};
    let message = "An unknown error occurred.";
    const detail = event.detail;
    const errorMessages = [];

    // 1. Record-level errors (e.g. from Apex)
    const recordErrors = detail?.output?.errors;
    if (recordErrors && recordErrors.length > 0) {
      recordErrors.forEach((err) => {
        if (err.message) {
          errorMessages.push(err.message);
        }
      });
    }

    // 2. Field-level errors (e.g. validation errors on fields)
    const fieldErrors = detail?.output?.fieldErrors;
    if (fieldErrors) {
      Object.keys(fieldErrors).forEach((fieldName) => {
        fieldErrors[fieldName].forEach((error) => {
          errorMessages.push(`${error.message}`);
        });
        this.fieldErrorMap[fieldName] = true;
      });
    }

    // 3. Top-level message fallback
    if (errorMessages.length === 0 && detail?.message) {
      errorMessages.push(detail.message);
    }

    // Final combined message
    message = errorMessages.join("\n");

    // 4. Show all errors as a toast
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Save Failed",
        message: message,
        variant: "error"
      })
    );
  }

  handleEvent = (event) => {
    const refreshRecordEvent = event.data.payload;
    if (refreshRecordEvent.RecordId__c === this.recordId) {
      this.recordId = "";
      return refreshApex(this.refreshTable);
    }
  };

  disconnectedCallback() {
    unsubscribe(this.subscription, () => {});
    window.removeEventListener('click', this._handleOutsideClick);
    window.removeEventListener("resize", this.handleResize.bind(this));
    window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
  }
  filterState = "All";
  @track filteredRecords = [];
  
  handleRecordsPerPage(event) {
    this.pageSize = event.target.value;
    this.paginationHelper();
  }
    nextPage() {
    if (this.pageNumber < this.totalPages) {
        this.pageNumber++;
    }
}

previousPage() {
    if (this.pageNumber > 1) {
        this.pageNumber--;
    }
}

firstPage() {
    this.pageNumber = 1;
}

lastPage() {
    this.pageNumber = this.totalPages;
   
}
get bDisableFirst() {
    return this.pageNumber <= 1;
}

get bDisableLast() {
    return this.pageNumber >= this.totalPages;
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
  triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
  }
//   handleCreateNewParticipant() {
//     this.showClientCreationTemplate=true;
//     this.clientCreationTypeName='';
//     this.toggleValue=true;
//   }


handleCreateNewParticipant() {
    this.clientCreationTypeName = '';
    this.clientWithUser = undefined;
    this.createCurrentStep = 'createstep1';
    this.toggleValue = true;
    this.showClientCreationTemplate = false;
    // Run limit check then open wizard
    this.checkLimitAndOpen();
}
async checkLimitAndOpen() {
    try {
        const limitReached = await isParticipantLimitReached();
        if (limitReached === true) {
            this.showUpgradeModal = true;
            return;
        }
    } catch (error) {
        console.error('Error checking participant limit:', error);
    }
    this.ParticpantRecordForm = true;
    this.fieldErrorMap = {};
    this.ndisCreateFlag = false;
    this.nonndisFlag = false;
    this.individualFlag = false;
    this.CompanyFlag = false;
    this.ParticipantType = '';
    this.recordId = '';
    this.street = ''; this.city = ''; this.country = '';
    this.province = ''; this.postalcode = '';
    this.headerName = 'Create New ' + this.participantPreferredName;
    this.buttonLabel = 'Save';
    this.errorMessage = '';
    this.saveButtonDisable = false;
    this.isHome = true;
   // this.cardFlag = false;
   // this.listFlag = false;
    this.visible = false;
    this.firstName = ''; this.lastName = '';
    this.facilityId = ''; this.fileName = '';
    this.addStaffDisable = true;
    this.Nationality = '';
    this.selectedLangs = [];
    this.selectedTypeOfIndustry = '';
    this.multiFacilityDroDownList = [];
    this.selctedMultipleFcailityValues = [];
    this.contactList = [{ id: 1, firstName: '', lastName: '', contactNumber: '', email: '', contactType: '', notify: false, firstNamePlaceholder: 'Enter Name', lastNamePlaceholder: 'Enter Name', phonePlaceholder: 'Enter Number', emailPlaceholder: 'Enter Email', showAdd: true, addButtonClass: 'add-visible' }];
    this.Languages = this.LANGUAGE_OPTIONS.map(lang => ({
        id: lang, label: lang, checked: false,
        buttonClass: 'option-button', badgeClass: 'status-badge inactive', statusText: 'Inactive'
    }));
}
  handleClientCreationChange(event) {
      const value = event.detail.value;

      this.clientCreationTypeName = value;

      if (value === 'Create a user account for the participant') {     //  Participant with User   //'Participant can access to login'
          this.clientWithUser=true;
      } else if (value === 'Managed by admin only') {      //  Participant without User
          this.clientWithUser=false; 
      }
      this.showClientCreationTemplate=false;
        this.handleCreateNewClient();
  }
  closeClientCreation(){
    this.showClientCreationTemplate=false;
  }


closeUpgradeModal() {
    this.showUpgradeModal = false;
}

  // create a new facility
  //handleCreateNewParticipant() {
 async handleCreateNewClient() {

    console.log('Checking participant limit...');

    // try {
    //     const limitReached = await isParticipantLimitReached();
    //     console.log('Participant limit reached:', limitReached);

    //     // 🔴 IF TRUE → SHOW TOAST + STOP
    //     if (limitReached === true) {
    //         this.showUpgradeModal = true;
    //         return; // ⛔ STOP execution
    //     }

    // } catch (error) {
    //     console.error('Error checking participant limit:', error);
    //     return; // safety stop
    // }

    // ✅ IF FALSE → CONTINUE YOUR EXISTING CODE

    this.fieldErrorMap = {};
    this.ParticpantRecordForm = true;
    this.ndisCreateFlag=false;
    this.nonndisFlag=false;
    this.individualFlag=false;
    this.CompanyFlag=false;
    this.Company='';
    this.ParticipantType='';
    this.cardview = true;
    this.recordId = "";
    this.street = "" ;
    this.city = "";
    this.country = "";
    this.province = "";
    this.postalcode = "";
    this.headerName = "Create New " + this.participantPreferredName;
    this.buttonLabel = "Save";
    this.errorMessage = "";
    this.saveButtonDisable = false;
    this.fileName = "";
    this.visible = false;
    this.cardFlag = true;
    this.listFlag = false;
    this.staffName = [];
    this.firstName = "";
    this.lastName = "";
    this.facilityId = "";
    this.selectedTypeOfIndustry='';
    this.addStaffDisable = true;
    this.selectedRoles = [];
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

    this.multiFacilityDroDownList=[];
    this.selctedMultipleFcailityValues=[];
}

handleeditClose() {

    console.log('🔴 handleeditClose START');

    this.ParticpantRecordForm = false;
    this.staffDetailsTemplate = false;

    this.resetWizard();

    console.log(
        '📋 contactList BEFORE:',
        JSON.stringify(this.contactList)
    );

    // =====================================
    // CLEAR ONLY TEMP CONTACT FILES
    // =====================================

    this.contactList = this.contactList.map(contact => {

        console.log(
            '👤 Checking Contact:',
            contact.id || contact.Id
        );

        // No uploaded files
        if (!contact.uploadedFiles) {

            console.log('📂 No uploadedFiles');

            return contact;
        }

        // Keep ONLY backend saved files
        const savedFiles = contact.uploadedFiles.filter(file => {

            const isSaved = !!file.attachmentId;

            console.log(
                '📄 File:',
                file.originalName,
                '| attachmentId:',
                file.attachmentId,
                '| Saved:',
                isSaved
            );

            return isSaved;
        });

        console.log(
            '✅ Saved Files Count:',
            savedFiles.length
        );

        return {

            ...contact,

            uploadedFiles: savedFiles,

            attachmentCount: savedFiles.length,

            isPlural: savedFiles.length !== 1
        };
    });

    console.log(
        '📋 contactList AFTER:',
        JSON.stringify(this.contactList)
    );

    // CLEAR MODAL FILES
    this.contactAttachments = [];

    console.log('🧹 contactAttachments cleared');

    // CLEAR TEMP UPLOADS
    this.uploadedFiles = [];

    console.log('🧹 uploadedFiles cleared');

    console.log('🟢 handleeditClose END');
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
  @track editclientflag = false;
  @track clientid;
  @track fName = "";
  @track lName = "";
    handleEditFacility(event) {
      // this.ParticpantRecordForm=true;
    
      let facId = event.currentTarget.dataset.id;
      const typeofservice = event.currentTarget.dataset.typeofservice;
      const ParticipantType = event.currentTarget.dataset.participanttype;

      console.log('handleEditFacility -> facId:', facId);
      //console.log('participant:', this.participant);
      console.log('typeofservice:', typeofservice);
      console.log('ParticipantType:', ParticipantType);
      //console.log('participantJson:', JSON.stringify(this.participantJson));
      
      this.loadClientData(facId, typeofservice, ParticipantType);
    //   setTimeout(() => {
    //      this.loadClientData(facId, typeofservice, ParticipantType);
    //   }, 2000); 
    }
//    loadClientData(facId, typeofservice, ParticipantType){
//       console.log('handleEditFacility -> facId in loadFacilityClientData:', facId);
//       //console.log('participant  in loadFacilityClientData :', participant);
//       console.log('typeofservice  in loadFacilityClientData:', typeofservice);
//       console.log('ParticipantType  in loadFacilityClientData:', ParticipantType);
//       // if (!this.participantJson || !this.participantJson[facId]) {
//       //     console.error('Participant data not found for:', facId);
//       //     return;
//       // }

//     this.headerName = "Update " + this.participantPreferredName;
//     this.buttonLabel = "Update";
//     this.clientid = facId;
//     console.log("client id" + this.clientid);
//     this.recordId = facId;
//        if (!typeofservice) {
//         this.dispatchEvent(
//             new ShowToastEvent({
//                 title: 'Error',
//                 message: 'Type of Service is missing. Please update in facility.',
//                 variant: 'error',
                
//             })
//         );
//             return;
//         }
//         this.ndisFlag = (typeofservice === 'NDIS');
        
//             if (!this.ndisFlag) {
//             // Only check ParticipantType when NDIS is false
//             if (!ParticipantType) {
//                 this.dispatchEvent(
//                     new ShowToastEvent({
//                         title: 'Error',
//                         message: this.participantPreferredName + ' type is required.',
//                         variant: 'error',
//                     })
//                 );
//                 return; // stop execution
//             }

//             // Set flags based on participant type
//             this.individualFlag = (ParticipantType === 'Individual');
//             this.companyFlag = (ParticipantType === 'Company');
//              this.ndisCreateFlag=false;
//         } else {
//             // If NDIS is true, all others false
//             this.individualFlag = false;
//             this.companyFlag = false;
//             this.ndisCreateFlag=true;
//         }
//         console.log( 'this.individualFlag,this.companyFlag,this.ndisCreateFlag'+this.individualFlag+ this.companyFlag + this.ndisCreateFlag)
//         console.log(' typeofservice', typeofservice);
//        console.log(' this.participant', this.participant);
//     console.log("record id" + this.recordId);
//     this.name = this.participantJson[facId]["name"];
//     this.street = this.participantJson[facId]["street"];
//     this.city = this.participantJson[facId]["city"];
//     this.country = this.participantJson[facId]["countryCode"];
//     this.province = this.participantJson[facId]["stateCode"];
//     this.postalcode = this.participantJson[facId]["postalCode"];
//     //this.status = this.participantJson[facId]["status"];
//     this.lName = this.participantJson[this.recordId]["lastname"];
//     this.fName = this.participantJson[this.recordId]["firstname"];
//     this.errorMessage = "";
//     this.saveButtonDisable = false;
//     this.cardview = false;
//     this.fileName = "";
//     this.cardFlag = true;
//     this.editclientflag = true;
//     /*  this[NavigationMixin.Navigate]({
//             // Pass in pageReference
//             type: 'comm__namedPage',
//             attributes: {
//                pageName: 'partcipantnewmodule',
//             },
//             state: {
//               c__propertyValue:this.recordId,
//               c__orgID:this.selectedName
//             },
//           }); */
//     // console.log('Participant Data ',JSON.stringify(this.participantJson));
//     localStorage.setItem('adminClientRecordId', this.clientid);
//     console.log('adminClientRecordId Stored in localStorage:', this.clientid);
//   }

loadClientData(facId, typeofservice, ParticipantType) {

    console.log('handleEditFacility -> facId in loadFacilityClientData:', facId);
    console.log('typeofservice in loadFacilityClientData:', typeofservice);
    console.log('ParticipantType in loadFacilityClientData:', ParticipantType);

    this.headerName = "Update " + this.participantPreferredName;
    this.buttonLabel = "Update";
    this.clientid = facId;
    this.recordId = facId;

    console.log("client id " + this.clientid);

    // Validate Type Of Service
    if (!typeofservice) {

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Type of Service is missing. Please update in facility.',
                variant: 'error',
            })
        );

        return;
    }

    // Flags
    this.ndisFlag = (typeofservice === 'NDIS');
    this.agedCareFlag = (typeofservice === 'Aged Care');

    // Reset all
    this.individualFlag = false;
    this.companyFlag = false;
    this.ndisCreateFlag = false;

    // NDIS OR Aged Care
    if (this.ndisFlag || this.agedCareFlag) {

        this.ndisCreateFlag = true;

    } else {

        // Non-NDIS only
        if (!ParticipantType) {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: this.participantPreferredName + ' type is required.',
                    variant: 'error',
                })
            );

            return;
        }

        // Participant Type flags
        this.individualFlag = (ParticipantType === 'Individual');
        this.companyFlag = (ParticipantType === 'Company');
    }

    console.log(
        'Flags -> ',
        'individualFlag:', this.individualFlag,
        'companyFlag:', this.companyFlag,
        'ndisCreateFlag:', this.ndisCreateFlag
    );

    console.log('typeofservice', typeofservice);

    // Load participant data
    this.name = this.participantJson[facId]["name"];
    this.street = this.participantJson[facId]["street"];
    this.city = this.participantJson[facId]["city"];
    this.country = this.participantJson[facId]["countryCode"];
    this.province = this.participantJson[facId]["stateCode"];
    this.postalcode = this.participantJson[facId]["postalCode"];

    this.lName = this.participantJson[this.recordId]["lastname"];
    this.fName = this.participantJson[this.recordId]["firstname"];

    // UI states
    this.errorMessage = "";
    this.saveButtonDisable = false;
    this.cardview = false;
    this.fileName = "";
    this.cardFlag = true;
    this.editclientflag = true;

    // Store local storage
    localStorage.setItem('adminClientRecordId', this.clientid);

    console.log(
        'adminClientRecordId Stored in localStorage:',
        this.clientid
    );
}
  handleChildEvent() {
    localStorage.removeItem('adminClientRecordId');
    console.log('LocalStorage cleared in parent.');
    this.cardview = true;
    this.listFlag = false;
    this.editclientflag = false;
    refreshApex(this.refreshTable);
  }

  handleSubmit(event) {
      event.preventDefault(); // 🚫 Stop form from submitting immediately
      // 3️⃣ BUILD FIELDS ONLY AFTER ALL VALIDATIONS PASSED
      const fields = event.detail.fields;

      console.log("contactList>>", JSON.stringify(this.contactList));
      console.log("nonndisFlag>>", this.nonndisFlag);
      console.log("ndisFlag>>", this.ndisFlag);
      if (!this.selectedTypeOfIndustry) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select Type of Industry.',
                    variant: 'error'
                })
            );
            return;
        }

        // 2️⃣ ParticipantType is required ONLY if industry is NOT ndis
        // if (
        //     this.selectedTypeOfIndustry !== 'NDIS' && 
        //     !this.ParticipantType
        // ) {
        //     this.dispatchEvent(
        //         new ShowToastEvent({
        //             title: 'Error',
        //             message: 'Please select Participant Type.',
        //             variant: 'error'
        //         })
        //     );
        //     return;
        // }

        if (
            this.selectedTypeOfIndustry !== 'NDIS' &&
            this.selectedTypeOfIndustry !== 'Aged Care' &&
            !this.ParticipantType
        ) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select Participant Type.',
                    variant: 'error'
                })
            );
            return;
        }        
        console.log( 'contactList after trimming empty rows >>', JSON.stringify(this.contactList) );
     for (let i = 0; i < this.contactList.length; i++) {
                const c = this.contactList[i];

                if (c.notify === true && !c.email) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Email Required',
                            message: `Email is required when Notify is selected (Row ${i + 1}).`,
                            variant: 'error'
                        })
                    );
                    return;
                }
            }
      // 1️⃣ VALIDATION (NDIS contact logic)
     
          const primaryContacts = this.contactList.filter(
              (con) => con.contactType === "Primary"
          );

          for (let c of primaryContacts) {
              if (!c.firstName || !c.lastName || !c.contactNumber || !c.email) {
                  this.dispatchEvent(
                      new ShowToastEvent({
                          title: "Missing Required Fields",
                          message: "All fields are required for the Primary contact.",
                          variant: "error"
                      })
                  );
                  return;  // ⛔ STOP execution completely
              }
          }
         //if (this.nonndisFlag === false) {
          
          /* if (primaryContacts.length === 0) {
              this.dispatchEvent(
                  new ShowToastEvent({
                      title: "Primary Contact Required",
                      message: "Please select at least one Primary contact.",
                      variant: "error"
                  })
              );
              return;  // ⛔ STOP execution completely
          } */
          this.contactList = this.contactList.filter(c => {
            const hasAnyValue =
                (c.firstName && c.firstName.trim()) ||
                (c.lastName && c.lastName.trim()) ||
                (c.contactNumber && c.contactNumber.trim()) ||
                (c.email && c.email.trim());

            return Boolean(hasAnyValue);
        });
        this.updateAddButtonVisibility();
          // for (let i = 0; i < this.contactList.length; i++) {
          //       let c = this.contactList[i];

          //       if (
          //           !c.firstName ||
          //           !c.lastName ||
          //           !c.contactNumber ||
          //           !c.email ||
          //           !c.contactType 
                  
          //       ) {
          //           this.dispatchEvent(
          //               new ShowToastEvent({
          //                   title: 'Missing Required Fields',
          //                   message: `All fields are required for Contact Row ${i + 1}.`,
          //                   variant: 'error'
          //               })
          //           );
          //           return; // ❗ Stop execution immediately
          //       }
          //   }
     // } 
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
    if (fields.CRN__c) {
        fields.CRN__c = fields.CRN__c.toUpperCase();
    }

    if (fields.CRN__c) {
        const crnRegex = /^\d{9}[A-Za-z]$/;

        if (!crnRegex.test(fields.CRN__c)) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid CRN',
                    message: 'CRN must contain 9 digits followed by 1 letter (e.g. 123456789A).',
                    variant: 'error'
                })
            );
            return; // ⛔ Stop submission
        }
    }  

    if (fields.My_Aged_Care_ID__c) {
        const agedCareIdRegex = /^AC\d{8}$/;

        if (!agedCareIdRegex.test(fields.My_Aged_Care_ID__c)) {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Invalid My Aged Care ID',
                    message: 'My Aged Care ID must begin with AC followed by 8 digits (e.g. AC12345678).',
                    variant: 'error'
                })
            );

            return; // ⛔ Stop submission
        }
    }

    if (fields.Medicare_Card_ID__c && fields.Medicare_Card_ID__c.trim()) {

        if (!fields.IRN__c) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Validation Error',
                    message: 'IRN is required when Medicare Card ID is provided.',
                    variant: 'error'
                })
            );
            return;
        }

        if (!fields.Expiry_Date__c) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Validation Error',
                    message: 'Expiry Date is required when Medicare Card ID is provided.',
                    variant: 'error'
                })
            );
            return;
        }
    }

    if (fields.IRN__c === '0') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Validation Error',
                message: 'IRN cannot be 0.',
                variant: 'error'
            })
        );
        return;
    }

    if (fields.IRN__c) {
    
        if (!fields.Medicare_Card_ID__c || !fields.Medicare_Card_ID__c.trim()) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Validation Error',
                    message: 'Medicare Card ID is required when IRN is provided.',
                    variant: 'error'
                })
            );
            return;
        }
    }
        
    if(this.selctedMultipleFcailityValues.length==0){
                this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please choose at least one facility to save your changes.',
                    variant: 'error',
                })
            );
            return;  
    }
    const emailInputs = this.template.querySelectorAll('.contact-email');

     for (let i = 0; i < emailInputs.length; i++) {
          const input = emailInputs[i];
          if (!input.checkValidity()) {
              input.reportValidity();
              this.dispatchEvent(
                  new ShowToastEvent({
                      title: 'Invalid Email',
                      message: `Invalid email in Contact Row ${i + 1}.`,
                      variant: 'error'
                  })
              );
              return;
          }
      }
      fields.Address__Street__s = this.street;
      fields.Address__City__s = this.city;
      fields.Address__StateCode__s = this.province;
      fields.Address__CountryCode__s = "AU";
      fields.Address__PostalCode__s = this.postalcode;
      fields.Name = this.fullName;
      fields.Status__c = this.toggleValue;
      fields.Facility__c = this.selctedMultipleFcailityValues[0];
      fields.ParticipantType__c = this.ParticipantType;
      fields.Preferred_Nationality__c = this.Nationality || '';
    //   fields.Type_of_Participant__c =this.selectedTypeOfIndustry =='NDIS' ?'NDIS' :'Nursing';
    // AFTER (fixed)
              fields.Type_of_Participant__c =
    this.selectedTypeOfIndustry === 'NDIS'
        ? 'NDIS'
        : this.selectedTypeOfIndustry === 'Aged Care'
            ? 'Aged Care'
            : 'Nursing';

      fields.Preferred_Languages__c =
          Array.isArray(this.selectedLangs) && this.selectedLangs.length > 0
              ? this.selectedLangs.join(";")
              : "";

      // 4️⃣ NOW SUBMIT (only if no validation returned early)
      this.template.querySelector("lightning-record-edit-form").submit(fields);
  }


  async handleSuccess(event) {
      // Success Toast
      this.dispatchEvent(
          new ShowToastEvent({
              title: "Success",
              message: `${this.participantPreferredName} created successfully.`,
              variant: "success"
          })
      );

      this.roleStaffFlag = false;
      this.ParticpantRecordForm = false;
      this.cardFlag = true;

      const staffRecID = event.detail.id;
      console.log("StaffRecId :", staffRecID);
      console.log("SelectedStaff :", this.staffName);

      if (staffRecID) {
          /* -------------------------------
            1️⃣ FILE UPLOAD
          -------------------------------- */
          try {
              await uploadFile({
                  base64: JSON.stringify(this.base64FileData),
                  filename: this.fileName,
                  recordId: staffRecID,
                  obj: "client"
              });

              /* this.dispatchEvent(
                  new ShowToastEvent({
                      title: "Success",
                      message: `${this.fileName} - Uploaded Successfully.`,
                      variant: "success"
                  })
              ); */
          } catch (fileError) {
              console.error("❌ File Upload Error:", fileError);
          }


            const payload = {
                      participantId: staffRecID,
                      selectedFacilityIds: this.selctedMultipleFcailityValues
                       }
                   const participantFacilityResult=await upsertParticipantFacilities({
                          wrapperJson: JSON.stringify(payload)
                      })
                   console.log("✅ participantFacilityResult updated."+JSON.stringify(participantFacilityResult));
                     refreshApex(this.refreshTable);
          /* -------------------------------
            2️⃣ STAFF ROLE ASSIGNMENT
          -------------------------------- */
          try {
              await updateStaffAssignments({
                  clientId: staffRecID,
                  assignmentsJSON: this.serializedPayload
              });

              console.log("✅ Staff assignments updated.");

              this.participanteditflag = false;
              this.participantflag = true;

              // Save selected roles
              this.selectedRoles = this.staffName;

              // Clear modified staff map
              this.modifiedStaffMap = {};

             

              setTimeout(() => {
                  refreshApex(this.wiredStaffResult);
              }, 1000);
          } catch (assignError) {
              console.error("❌ Staff assignment update error:", assignError);
          }

          /* -------------------------------
            3️⃣ CONTACT DETAILS UPDATE
          -------------------------------- */
          const safeContactPayload =
              Array.isArray(this.contactList) && this.contactList.length > 0
                  ? JSON.stringify(this.contactList)
                  : null;

          if (safeContactPayload) {
              try {
                  await updateParticipantContacts({
                      clientId: staffRecID,
                      contactData: safeContactPayload
                  });

                  console.log("✅ Contacts updated.");
              } catch (contactError) {
                  console.error("❌ Contact update error:", contactError);
              }
          } else {
              console.warn("⚠️ No contact records to update.");
          }
      }

  
      

      this.fullName = "";
      this.cardview = true;
     // this.contactList = [];
      this.contactList1 = [];
      this.contactList = [
        {
            id: Date.now(),
            firstName: '',
            lastName: '',
            contactNumber: '',
            email: '',
            contactType: '', // NEW FIELD
            notify:false,
            firstNamePlaceholder: 'Enter Name',
            lastNamePlaceholder: 'Enter Name',
            phonePlaceholder: 'Enter Number',
            emailPlaceholder: 'Enter Email',
            showAdd: true,
            addButtonClass: 'add-visible'
        }
       ];
  }

  
  @track handleStatusFlag = false;
  @track facId;
  @track facstatus;
  @track message;
  @track originalToggleState;
  @track toggleElement;
  @track finalStatus;
  @track clientname;
 
//   handlefacStatus(event) {
//     this.handleStatusFlag = true;

//     const dataset = event.currentTarget.dataset;

//     this.toggleElement = event.currentTarget;
//     this.facId = dataset.id;
//     this.facstatus = dataset.name;
//     this.clientname = dataset.client;
//     this.originalToggleState = this.facstatus;

//     if (this.facstatus === "true") {
//       this.finalStatus = "false";
//       this.message = this.participantPreferredName + " is Inactive.";
//     } else if (this.facstatus === "false") {
//       this.finalStatus = "true";
//       this.message = this.participantPreferredName + " is Active.";
//     }
//   }

   async handlefacStatus(event){  
        const dataset = event.currentTarget.dataset;

        this.toggleElement = event.currentTarget;
        this.facId = dataset.id;
        this.facstatus = dataset.name;
        this.clientname = dataset.client;
        this.originalToggleState = this.facstatus;

        if (this.facstatus === "false") {

        try {
            const limitReached = await isParticipantLimitReached();

            if (limitReached) {

                //  BLOCK ACTIVATION
                this.showToast(
                    'Limit reached',
                    'Participant limit reached. Please upgrade your plan.',
                    'error'
                );

                return; // ❗ STOP HERE
            }

        } catch (error) {
            console.error('Limit check error:', error);
            return;
        }
    }

        if (this.facstatus === "true") {
        this.finalStatus = "false";
        this.message = this.participantPreferredName + " is Inactive.";
        } else if (this.facstatus === "false") {
        this.finalStatus = "true";
        this.message = this.participantPreferredName + " is Active.";
        }

        try {
            const services = await checkFutureServices({ clientId: this.facId });
            console.log('services : ',JSON.stringify(services));
            console.log("services.length ", services.length);
            if (services && services.length > 0) {

                let dates = services.map(service => {
                    const rawDate = new Date(service.Date_of_Service__c);
                    console.log("rawDate ", rawDate);

                    const formattedDate = `${String(rawDate.getDate()).padStart(2, "0")}/${
                        String(rawDate.getMonth() + 1).padStart(2, "0")
                    }/${rawDate.getFullYear()}`;
                    console.log("formattedDate ", formattedDate);
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

  async handlestatuschange() {
    try {
         if (this.finalStatus === 'true') {

            const limitReached = await isParticipantLimitReached();

            if (limitReached) {

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Limit reached",
                        message: "Participant limit reached. Please upgrade your plan.",
                        variant: "error"
                    })
                );

                return; //  STOP HERE
            }
        }
        await statusClient({ IdValue: this.facId, status: this.finalStatus });

        this.dispatchEvent(
            new ShowToastEvent({
                title: "",
                message: this.message,
                variant: "success"
            })
        );

        this.handleStatusFlag = false;

        // 🔥 WAIT for fresh data
        return refreshApex(this.refreshTable);
        console.log('✅ Data refreshed after status update');

    } catch (error) {
        console.error('❌ Error updating status:', error);
    }
}
    handleFutureShiftClose(){
            
        this.hasFutureShifts=false;  
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
      //  console.log('event detail'+JSON.stringify(event.detail));
      this.street = event.detail.street;
      this.city = event.detail.city;
      this.postalcode = event.detail.postalCode;
      this.province = event.detail.province;
      this.country = event.detail.country;
    }
  }



  addContactRow() {
      this.contactList = [
          ...this.contactList,
          {
              id: Date.now(),
              firstName: '',
              lastName: '',
              contactNumber: '',
              email: '',
              contactType: '',
              notify:false,
              firstNamePlaceholder: 'Enter Name',
              lastNamePlaceholder: 'Enter Name',
              phonePlaceholder: 'Enter Number',
              emailPlaceholder: 'Enter Email',
              showAdd: true,
              addButtonClass: 'add-visible'
          }
      ];
       this.updateAddButtonVisibility();
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
  removeContactRow(event) {
      // if (this.nonndisFlag === false && this.contactList.length === 1) {
      if (this.contactList.length === 1) {
         this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'At least one row is required.',
                variant: 'error'
            })
         );
         return;
      }
      const index = event.target.dataset.index;
      this.contactList.splice(index, 1);
      this.contactList = [...this.contactList];
      this.updateAddButtonVisibility();
      console.log( "this.contactList in delete row : " + JSON.stringify(this.contactList));
     
  }

  handleContactsChange(event) {
      const index = event.target.dataset.index;
      const field = event.target.name;
     // let value = event.target.value;
     let value;
     if (event.target.type === "checkbox") {
        value = event.target.checked;
     } else {
        value = event.target.value;
     }
    
    if (field === 'contactType' && value === 'Add New Contact Type') {

        this.activeContactRowIndex = index;
        this.previousContactType = this.contactList[index].contactType;

       // this.contactList[index].contactType = this.previousContactType || '';
        this.contactList[index].contactType = '';

        this.contactList = [...this.contactList]; // force UI sync
        console.log( "this.contactList in handleContactsChange : " + JSON.stringify(this.contactList));

        this.showContactTypeModal = true;
        return;
    }
    this.contactList[index][field] = value;
    if (field === 'notify' && value === true && !this.contactList[index].email) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Email Required',
                message: `Email is required when Notify is selected ( Contact Row ${index + 1}).`,
                variant: 'error'
            })
        );

        // ⛔ Revert checkbox to false
       // this.contactList[index].notify = false;
    }

    const isMandatory =
        this.contactList[index].contactType === 'Primary';

        this.contactList[index].firstNamePlaceholder =
            isMandatory  ? '* Enter Name' : 'Enter Name';

        this.contactList[index].lastNamePlaceholder =
            isMandatory  ? '* Enter Name' : 'Enter Name';

        this.contactList[index].phonePlaceholder =
            isMandatory  ? '* Enter Number' : 'Enter Number';

        this.contactList[index].emailPlaceholder =
            isMandatory  ? '* Enter Email' : 'Enter Email';
       this.contactList = [...this.contactList];
       console.log( "this.contactList : " + JSON.stringify(this.contactList));
  }
  
  handleNewContactTypeInput(event) {
      this.newContactTypeName = event.target.value;
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
          //this.contactList = [...this.contactList];
          
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
      //this.showContactTypeModal = false;
      //this.newContactTypeName = '';
       console.log('this.contactList in save : ',JSON.stringify(this.contactList));
  }
  
  deleteCustomContactType(event) {
      const value = event.currentTarget.dataset.value;

      this.customContactTypes =
          this.customContactTypes.filter(t => t.value !== value);

      this.contactTypeOptions =
          this.contactTypeOptions.filter(o => o.value !== value);
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
  createEmptyContactRow() {
      return {
          id: Date.now(),
          firstName: '',
          lastName: '',
          contactNumber: '',
          email: '',
          contactType: '',
          notify: false,
          firstNamePlaceholder: 'Enter Name',
          lastNamePlaceholder: 'Enter Name',
          phonePlaceholder: 'Enter Number',
          emailPlaceholder: 'Enter Email',
          showAdd: false,
          addButtonClass: 'add-hidden'
      };
  }
  
  isContactTypeUsed(value) {
      return this.contactList.some(row => row.contactType === value);
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

  resetContactTypeModal() {
      this.showContactTypeModal = false;
      this.newContactTypeName = '';
      // this.activeContactRowIndex = undefined;
      // this.previousContactType = undefined;
      this.activeContactRowIndex = null;
      this.previousContactType = null;
     
      this.stagedDeleteTypes = [];
       console.log('this.contactList in reset 11: ',JSON.stringify(this.contactList));
       this.contactList = [...this.contactList];
      console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
  }
 


  @track errorMessage = "";
  @track saveButtonDisable = false;

  
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
    /*  console.log('fileName>>',this.fileName);
            console.log('file prepared');
           */
  }

  handleNameChange(event) {
    if (event.target.name == "fname") {
      this.firstName = "";
      let inputValue = event.target.value;
      inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
      this.firstName = inputValue;
    }
    if (event.target.name == "lname") {
      this.lastName = "";
      let inputValue = event.target.value;
      inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
      this.lastName = inputValue;
    }
    if (
      this.firstName != undefined ||
      this.firstName != NULL ||
      this.lastName != undefined ||
      this.lastName != NULL
    ) {
      this.fullName = this.firstName + " " + this.lastName;
    }
  }
  handleChange(event) {
    let inputValue = event.target.value;
    inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
    event.target.value = inputValue;
  }
  @track cardFlag = true;
  @track listFlag = false;

  get cardViewClass() {
    return this.cardFlag
      ? "slds-box slds-size_1-of-6 slds-align_absolute-center slds-theme_inverse"
      : "slds-box slds-size_1-of-6 slds-align_absolute-center"; // you can use your custom class here.
    //'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse' : 'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse'
  }

  get listViewClass() {
    return this.listFlag
      ? "slds-box slds-size_1-of-6 slds-align_absolute-center slds-theme_inverse"
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

  handleStaffChange(event) {
    // this.staffName = event.target.value;
    // console.log('Staff Name >> '+ this.staffName);
    this.selectedRoles = event.detail.value;
    console.log(
      "Updated selected roles: " + JSON.stringify(this.selectedRoles)
    );
  }
  handleSave(event) {
    if (this.selectedRoles && this.selectedRoles.length > 0) {
      this.roleStaffFlag = false;
      this.errorMessage = "";
      this.savedSelectedRoles = [...this.selectedRoles];
    } else {
      this.errorMessage = "please select staff";
    }
  }

  async handleAddMultiUsers() {
    this.headeringName = "Preferred Staff";
    await this.fetchStaffMembers();
  }

  handleEditStaffClose() {
    this.roleStaffFlag = false;
    this.staffName = "";
    this.selectedRoles = [...this.savedSelectedRoles];
  }

  @track fullName = "";
  @track  activeFilterOn = true;
  @track inactiveFilterOn = false;

  searchTimeout;

handleSearch(event) {
    clearTimeout(this.searchTimeout);

    const value = event.target.value;

    this.searchTimeout = setTimeout(() => {
        this.inputValue = value;
        this.searchText = value;

        this.pageNumber = 1;
        this.isShowSpinner = true;
        this.refreshKey++;
    }, 300);
}

handleActiveToggle() {
    this.activeFilterOn = true;
    this.inactiveFilterOn = false;

    this.isActive = true;
     this.pageNumber = 1;
  //  this.isStatusTrue =false
  //  this.refreshKey++;
  setTimeout(() => {
             refreshApex(this.refreshTable); 
       }, 300);


    // ❌ REMOVE refreshApex
}

handleInactiveToggle() {
    this.inactiveFilterOn = true;
    this.activeFilterOn = false;

    this.isActive = false;
    this.pageNumber = 1;
   // this.refreshKey++;
  //  this.isStatusTrue =false
  setTimeout(() => {
             refreshApex(this.refreshTable); 
       }, 300);
    // ❌ REMOVE refreshApex
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

  async fetchStaffMembers() {
    console.log("this.facilityId >>", this.facilityId);
    try {
      const result = await getStaffMembers({ facilityId: this.selctedMultipleFcailityValues });
      console.log("Staff data >>", result);
      this.processStaffData(result);
      this.fetchRoles();
    } catch (error) {
      throw error;
    }
  }

 /*  processStaffData(staffData) {
    this.staffMembers = staffData.map((staff, index) => {
      const staffMember = {
        Id: staff.Id,
        Name: staff.Display_Nickname__c,
        Email: staff.Email,
        Role__c: staff.Role__c,
        roleAssignments: {},
        rowClass:
          index % 2 === 0
            ? "slds-hint-parent"
            : "slds-hint-parent slds-theme_shade"
      };
      return staffMember;
    });
  } */
 processStaffData(staffData) {
      this.staffMembers = staffData.map((staff, index) => {

          const profileUrl = staff.picture__c ? staff.picture__c : '';

          console.log(
              'Profile URL mapping:',
              staff.Id,
              profileUrl
          );
          // Extract roles from StaffRoles__r
          const roles = staff.StaffRoles__r
              ? staff.StaffRoles__r.map((r) => r.RoleName__c)
              : [];

          return {
              Id: staff.Id,
              Name: staff.Display_Nickname__c || staff.Name || "Unnamed",
              Email: staff.Email,
              profileUrl: profileUrl,
              Role__c: roles.join("; "), // Join roles with semicolon
              roleAssignments: {},
              rowClass:
                  index % 2 === 0
                      ? "slds-hint-parent"
                      : "slds-hint-parent slds-theme_shade"
          };
      });

      this.filteredStaffMembers = [...this.staffMembers]; // ✅ Important
  }

    async fetchRoles() {
     console.log(" [fetchRoles] START");
 
     if (!this.selctedMultipleFcailityValues) {
         console.warn("No facilityId found, cannot fetch Facility Roles.");
         return;
     }
 
     try {
         const result = await getRoleOptionsByFacility({ facilityIdList: this.selctedMultipleFcailityValues });
         console.log(" Facility Roles fetched:", JSON.stringify(result));
 
           this.roles = (result || []).map(role => role.Role_Name__c);
 
         // Optional: reuse your existing assignment loader if needed
         this.loadAssignments?.();
         this.roleStaffFlag = true;
 
     } catch (error) {
         console.error(" Error fetching Facility Roles:", error);
     }
 
     console.log(" [fetchRoles] END");
 }//manendra  */

  loadAssignments() {
   console.log("this.staffMembers >> ", JSON.stringify(this.staffMembers));
   console.log("this.roles >> ", JSON.stringify(this.roles));
    if (this.staffMembers.length > 0 && this.roles.length > 0) {
      this.staffMembers = this.staffMembers.map((staff) => {
        const updatedStaff = { ...staff };
        updatedStaff.roleAssignments = {};
        this.roles.forEach((role) => {
          updatedStaff.roleAssignments[role] = false;
        });
        return updatedStaff;
      });
    }
     
     
  }

  processAssignments(assignmentData) {
    // Process the assignment data and update staff role assignments
    const assignmentMap = {};

    assignmentData.forEach((assignment) => {
      if (!assignmentMap[assignment.AssigneeId]) {
        assignmentMap[assignment.AssigneeId] = {};
      }
      assignmentMap[assignment.AssigneeId][assignment.PermissionSetId] = true;
    });

    // Update staff members with their role assignments
    this.staffMembers = this.staffMembers.map((staff) => {
      const updatedStaff = { ...staff };
      const staffAssignments = assignmentMap[staff.Id] || {};

      // Update role assignments
      Object.keys(updatedStaff.roleAssignments).forEach((roleId) => {
        updatedStaff.roleAssignments[roleId] = !!staffAssignments[roleId];
      });

      return updatedStaff;
    });

    this.isLoading = false;
  }

  // Create flattened data structure for template iteration
  get staffRoleData() {
    const flatData = [];

    this.staffMembers.forEach((staff) => {
      this.roles.forEach((role) => {
        flatData.push({
          staffId: staff.Id,
          staffName: staff.Name,
          roleId: role.Id,
          roleName: role.Name,
          hasRole: staff.roleAssignments && staff.roleAssignments[role.Id],
          rowClass: staff.rowClass
        });
      });
    });

    return flatData;
  }

  @track searchStaff = "";
  @track filteredStaffMembers = [];
  @track staffMembers = [];
  @track roles = [];

  // Group the flat data by staff for template iteration
  get groupedStaffRoleData() {
    console.log("groupedStaffRoleData >>");
    console.log("this.staffMembers >>", JSON.stringify(this.staffMembers));
   

    const staffList =
      Array.isArray(this.filteredStaffMembers) && this.searchStaff
        ? this.filteredStaffMembers
        : this.staffMembers;

    if (!staffList || !this.roles || this.roles.length === 0) {
      console.log("Missing staffMembers or roles.");
      return [];
    }

    const grouped = [];

    staffList.forEach((originalStaff) => {
      const staff = this.modifiedStaffMap[originalStaff.Id] || originalStaff;

      const roleList = staff.Role__c
        ? staff.Role__c.split(";").map((r) => r.trim())
        : [];

      const assignedRoles = new Set(roleList);

      const staffData = {
        Id: staff.Id,
        Name: staff.Name,
        Email: staff.Email,
        rowClass: staff.rowClass,
        profileUrl: staff.profileUrl,
        roleData: []
      };

      this.roles.forEach((roleName) => {
        const hasRoleInStaff = assignedRoles.has(roleName);
        const isChecked = staff.roleAssignments && staff.roleAssignments.hasOwnProperty(roleName)
          ? staff.roleAssignments[roleName]
          : hasRoleInStaff; 

        staffData.roleData.push({
          roleId: roleName,
          roleName,
          hasRole: isChecked,
          hasRoleinstaff: hasRoleInStaff // same value now, since activeRoles is removed
        });
      });

     // console.log("Final staffData:", JSON.stringify(staffData, null, 2));
      grouped.push(staffData);
    });

    console.log(JSON.stringify(grouped, null, 2));
    return grouped;
  }

  handleSearchStaffInput(event) {
    this.searchStaff = event.target.value.toLowerCase();

    if (!this.searchStaff) {
      this.filteredStaffMembers = [...this.staffMembers];
    } else {
      this.filteredStaffMembers = this.staffMembers.filter(
        (staff) =>
          staff.Name && staff.Name.toLowerCase().includes(this.searchStaff)
      );
    }
  }

  modifiedStaffMap = {};

  handleRoleToggle(event) {
    const staffId = event.target.dataset.staffId;
    const roleId = event.target.dataset.roleId;
    const isChecked = event.target.checked;

    // 🔁 Get the latest version: from modified map if exists, otherwise from original list
    const originalStaff = this.modifiedStaffMap[staffId] || this.staffMembers.find(s => s.Id === staffId);

    if (!originalStaff) return;

    // 🛠 Clone the staff and their roleAssignments
    const updatedStaff = { ...originalStaff };
    updatedStaff.roleAssignments = { ...(originalStaff.roleAssignments || {}) };
    updatedStaff.roleAssignments[roleId] = isChecked;

    // ✅ Save back into modified map
    this.modifiedStaffMap = {
      ...this.modifiedStaffMap,
      [staffId]: updatedStaff
    };

    console.log("🗂️ Modified Staff Map:", JSON.stringify(this.modifiedStaffMap));
  }

  handleeditClose1() {
    this.searchStaff = '';
    this.roleStaffFlag = false;
    this.modifiedStaffMap = {};
    // this.loadAssignments();
    // this.filteredStaffMembers = [...this.staffMembers]
  }

 handleUpdateStaff() {
      console.log('Client Id >> ', this.clientId);
      //console.log('Modified Staff Map >> ', JSON.stringify(this.modifiedStaffMap));

      const modifiedStaffList = Object.values(this.modifiedStaffMap);

      // Prepare payload (only modified records)
      const assignmentPayload = modifiedStaffList.map(staff => ({
          Id: staff.Id,
          Name: staff.Name,
          roleAssignments: staff.roleAssignments,
          rowClass: staff.rowClass
      }));

      this.serializedPayload = JSON.stringify(assignmentPayload);
       console.log('assignmentPayload >> ', this.serializedPayload);
      this.roleStaffFlag = false;
      this.searchStaff = '';
  }

  get showParticipantFormClass() {
    return this.roleStaffFlag ? "slds-hide" : "";
  }

  get showPreferredStaffClass() {
    return this.roleStaffFlag ? "" : "slds-hide";
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
        if (!this.isMultiClientUpload && event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
            event.preventDefault();
            this.handleCreateNewParticipant();
            }
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyU') {
            event.preventDefault();
            this.handleSwitchToMultiClientUpload();
            }
  }
  handleSwitchToMultiClientUpload() {
      this.isMultiClientUpload = true;
      this.cardview = false;
   
      this.cardFlag = false;
      this.listFlag = false;
  }
  childevent(){

      this.isMultiClientUpload = false;
      this.cardview = true;
      this.cardFlag = true;
      refreshApex(this.refreshTable);
  }

    handleSearchChange(event) {
        const searchKey = event.target.value;
        
        // 🔥 CRITICAL: Always sync the input value with Nationality
        this.Nationality = searchKey; // This ensures clearing sets it to empty string
        
        if (searchKey) {
            const filtered = this.allNationalities
                .filter(nation => nation.toLowerCase().includes(searchKey.toLowerCase()))
                .map(n => ({
                    label: n,
                    value: n
                }));

            this.filteredOptions = filtered;
            this.noResults = filtered.length === 0;
        } else {
            // When cleared, show all options
            this.filteredOptions = this.allNationalities.map(n => ({
                label: n,
                value: n
            }));
            this.noResults = false;
            this.Nationality = ''; // 🔥 Explicitly set to empty string
        }
        
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
        const target = event.currentTarget;
        const selectedValue = target.dataset.value;

        console.log('📌 Selected Nationality:', selectedValue);
        
        // 🔥 Update both the display and stored value
        this.Nationality = selectedValue || '';
        this.showDropdown = false;

        console.log('🌀 Nationality after selection:', this.Nationality);
    }

    get displayTextLang() {
        return this.selectedLangs.length
            ? this.selectedLangs.join(', ')
            : 'Select Languages';
    }

    handleDropdownToggle(event) {
      event.stopPropagation();
      this.isExpanded = !this.isExpanded;

      if (this.isExpanded) {
          // ✅ Bind and attach outside click listener
          this._boundHandleClickOutside = this.handleClickOutside.bind(this);
          window.addEventListener('click', this._boundHandleClickOutside);
          // wait for dropdown DOM to actually render
      } else {
          // ✅ Remove listener when closed
          window.removeEventListener('click', this._boundHandleClickOutside);
      }
  }


    handleLanguageToggle(event) {
        const optionId = event.target.dataset.optionId;
        const isChecked = event.target.checked;

        console.log('🌀 [handleLanguageToggle] START');
        console.log('👉 Toggled Language:', optionId);
        console.log('✅ Checked:', isChecked);

        // 🧩 Ensure selectedLangs is defined as an array
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

        // 🧩 Ensure empty array stays empty (not null/undefined)
        if (this.selectedLangs.length === 0) {
            this.selectedLangs = [];
        }

        console.log('📋 Updated Selected Languages:', JSON.stringify(this.selectedLangs));

        this.refreshValues();
        console.log('🌀 [handleLanguageToggle] END');
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

    handleClickOutside(event) {
        const gridElement = this.template.querySelector('.grid');
        const nationalityDropdown = this.template.querySelector('.custom-dropdown'); // nationality
        const languageDropdown = this.template.querySelector('.dropdown-container'); // language dropdown container (same class)
          const facilityBox = this.template.querySelector('.facility-dropdown');

        const path = typeof event.composedPath === 'function'
            ? event.composedPath()
            : [event.target];
        let clickedInsideGrid = false;
        let clickedInsideNationality = false;
        let clickedInsideLanguage = false;
         let clickedInsideFacility = false; 

        for (const node of path) {
            if (!node) continue;

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
        }

        if (this.isExpanded && !clickedInsideLanguage) {
            this.isExpanded = false;
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

    get chevronIcon() {
        return this.isOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get selectedOptionClass() {
        return this.selctedMultipleFcailityValues.length > 0 ? 'selected-text slds-truncate' : 'placeholder-text slds-truncate';
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

     fetchMultiFaciltyOptions(){
               getFacilityData().then(facResponse => {
              
               
                     // Build enhanced option objects (with toggle + badge)
                     this.multiFacilityDroDownList = facResponse.map((fac, index) => {

                          const isActive = true;   // keep always true if you want

                          return {
                              id: index.toString(),
                              label: fac.Name,
                              value: fac.Id,
                              checked: true,
                              isActive: true,
                              statusText: 'Active',
                              badgeClass: this.getBadgeClass(true),
                              buttonClass: this.getOptionButtonClass(true),
                              isDisabled: false,
                              Type_of_Service__c: fac.Type_of_Service__c
                          };

                     });
                      this.orginalSelectedFacilities =  this.multiFacilityDroDownList;
                          console.log('all fac response ==>'+JSON.stringify(this.multiFacilityDroDownList));
              })
         }

    toggleFacilityDropdown(event) {
        event.stopPropagation(); // prevent bubbling from the button

        // Close other dropdowns
        this.showDropdown = false;   // close Nationality
        this.isExpanded = false;     // close Languages
         this.isOpen = false;   

       
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
     this.addStaffDisable = this.selctedMultipleFcailityValues.length > 0 ? false : true;
}

//   handleTypeOfIndustry(event) {
//     console.log('handleTypeOfIndustry invoked');

//     // Log raw event
//     console.log('Event received:', event);

//     // Capture selected value
//     this.selectedTypeOfIndustry = event.target.value;
//     console.log('Selected Type Of Industry:', this.selectedTypeOfIndustry);
//     if (this.selectedTypeOfIndustry === 'NDIS') {
//         this.ndisCreateFlag = true;
//         this.nonndisFlag = false;
//         this.CompanyFlag = false;
//         this.individualFlag = false;

//         console.log('NDIS selected → NDIS flags enabled');
//     } else {
//         this.ndisCreateFlag = false;
//         this.nonndisFlag = true;
//         this.CompanyFlag = false;
//         this.individualFlag = false;
//         this.ParticipantType='';

//         console.log('Non-NDIS selected → Non-NDIS flags enabled');
//     }
//    let orginalFacValues=  this.orginalSelectedFacilities;
//     if (this.selectedTypeOfIndustry === 'NDIS') {
             
//                 this.multiFacilityDroDownList = orginalFacValues.filter(
//                     fac => fac.Type_of_Service__c === 'NDIS'
//                 );
//                 } else if (this.selectedTypeOfIndustry === 'Non-NDIS') {
//                    this.multiFacilityDroDownList = orginalFacValues.filter(
//                         fac => fac.Type_of_Service__c !== 'NDIS'
//                     );
//                 }else{
//                     this.multiFacilityDroDownList = orginalFacValues
//        }
//        this.fetchStaffData();
//     console.log("Selected facility >> " + this.facilityId);
   
    
// }

handleTypeOfIndustry(event) {
    console.log('handleTypeOfIndustry invoked');

    // Selected value
    this.selectedTypeOfIndustry = event.target.value;
    console.log('Selected Type Of Industry:', this.selectedTypeOfIndustry);

    // Reset flags
    this.ndisCreateFlag = false;
    this.nonndisFlag = false;
    this.CompanyFlag = false;
    this.individualFlag = false;

    // Reset participant type
    this.ParticipantType = '';

    // New flag for Aged Care
    this.isAgedCare = false;

    // Handle Industry Type
    if (this.selectedTypeOfIndustry === 'NDIS') {

        this.ndisCreateFlag = true;
        this.nonndisFlag = false;

        console.log('NDIS selected → NDIS flags enabled');

    } else {

        this.ndisCreateFlag = false;
        this.nonndisFlag = true;

        console.log('Non-NDIS selected → Non-NDIS flags enabled');
    }

    // Aged Care flag
    if (this.selectedTypeOfIndustry === 'Aged Care') {
        this.isAgedCare = true;
        this.ndisCreateFlag = true;
        this.nonndisFlag = false;
        console.log('Aged Care selected → My Aged Care ID visible');
    }

    // Facility filtering
    let orginalFacValues = this.orginalSelectedFacilities || [];

    if (this.selectedTypeOfIndustry === 'NDIS') {

        this.multiFacilityDroDownList = orginalFacValues.filter(
            fac => fac.Type_of_Service__c === 'NDIS'
        );

    } else if (this.selectedTypeOfIndustry === 'Non-NDIS') {

        this.multiFacilityDroDownList = orginalFacValues.filter(
            fac => fac.Type_of_Service__c !== 'NDIS'
        );

    } else if (this.selectedTypeOfIndustry === 'Aged Care') {

        this.multiFacilityDroDownList = orginalFacValues.filter(
            fac => fac.Type_of_Service__c === 'Aged Care'
        );

    } else {

        this.multiFacilityDroDownList = orginalFacValues;
    }

    // Refresh Staff
    this.fetchStaffData();

    console.log('Selected facility >> ', this.facilityId);
    console.log('isAgedCare >> ', this.isAgedCare);
}


handleMedicareChange(event) {
    const value = event.target.value;
    this.isMedicareEntered = value && value.trim() !== '';
}

// handleFacilitySelection(event) {

//     const selected = event.detail.value || [];

//         // prevent search input from triggering selection
//     if (!Array.isArray(selected)) {
//         return;
//     }

//     console.log('Selected Facilities:', JSON.stringify(selected));

//     this.selctedMultipleFcailityValues = [...selected];

//     // Only update display text
//     this.activeFaciltyDisplay = this.multiFacilityDroDownList
//         .filter(f => this.selctedMultipleFcailityValues.includes(f.value))
//         .map(f => f.label)
//         .join(', ');

// }



handleFacilitySelection(event) {

    console.log('Facility event:', JSON.stringify(event.detail));

    const value = event?.detail?.value;

    // // ✅ CASE 1: CLEAR (when user clicks ❌)
    // if (value === '') {
    //     console.log('🧹 Clear action detected');

    //     this.selctedMultipleFcailityValues = [];

    //     // optional: reset roles also
    //     this.roleoptionsforFacility = [];
    //     this.selectedRoleValues = [];

    //     return;
    // }

    // ✅ CASE 2: IGNORE SEARCH TYPING
    if (!Array.isArray(value)) {
        console.log('🚫 Ignored search typing event');
        return;
    }

    // ✅ CASE 3: REAL SELECTION
    const newValues = JSON.stringify(value);

    if (newValues === JSON.stringify(this.selctedMultipleFcailityValues)) {
        console.log('⚡ No change in selection');
        return;
    }

    this.selctedMultipleFcailityValues = [...value];

    console.log('✅ Selected Facilities:', this.selctedMultipleFcailityValues);

    // 🔥 call only on real selection
    // this.fetchRoleOptions();
}

get facilityDropdownOptions() {

    if (!Array.isArray(this.multiFacilityDroDownList)) {
        return [];
    }

    return this.multiFacilityDroDownList.map(item => ({
        label: item.label,
        value: item.value,
        Type_of_Service__c :item.Type_of_Service__c
    }));

}



handleAttachmentClick(event) {

    console.log('🔥 handleAttachmentClick fired');

    const index = event.currentTarget.dataset.index;

    console.log('📌 Clicked Index:', index);

    console.log(
        '📂 contactList:',
        JSON.stringify(this.contactList)
    );

    const selectedContact = this.contactList[index];

    console.log(
        '👤 selectedContact:',
        JSON.stringify(selectedContact)
    );

    if (!selectedContact) {

        console.error('❌ Contact not found');

        return;
    }

    // IMPORTANT
    this.currentContactId =
        selectedContact.id || selectedContact.Id;

    console.log(
        '✅ currentContactId:',
        this.currentContactId
    );

    this.showContactAttachmentModal = true;

    this.uploadedFiles = [];
    this.totalfiles = [];
    this.isFileExpand = false;
    this.fileName = '';
}

handleSaveContactAttachment() {

    console.log('🔥 Save Attachment Clicked');

    console.log('👤 currentContactId:', this.currentContactId);

    console.log(
        '📂 uploadedFiles:',
        JSON.stringify(this.uploadedFiles)
    );

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!this.currentContactId) {

        console.error('❌ No contact selected');

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Error",
                message: "No contact selected",
                variant: "error"
            })
        );

        return;
    }

    if (!this.uploadedFiles || this.uploadedFiles.length === 0) {

        console.error('❌ No uploaded files found');

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Error",
                message: "Please upload at least one file",
                variant: "error"
            })
        );

        return;
    }

    // =====================================================
    // FIND CONTACT
    // =====================================================

    const contactIndex = this.contactList.findIndex(
        row =>
            row.id === this.currentContactId ||
            row.Id === this.currentContactId
    );

    console.log('📌 contactIndex:', contactIndex);

    if (contactIndex === -1) {

        console.error('❌ Contact row not found');

        return;
    }

    // =====================================================
    // INIT uploadedFiles
    // =====================================================

    if (!this.contactList[contactIndex].uploadedFiles) {

        this.contactList[contactIndex].uploadedFiles = [];
    }

    // =====================================================
    // NORMALIZE NEW FILES
    // =====================================================

    const newFiles = this.uploadedFiles.map(file => {

        return {

            // existing attachments later will have value
            attachmentId: null,

            originalName:
                file.originalName ||
                file.name ||
                file.fileName,

            url:
                file.url,

            key:
                file.key,

            size:
                file.size
        };
    });

    console.log(
        '🟢 normalized newFiles:',
        JSON.stringify(newFiles)
    );

    // =====================================================
    // MERGE FILES
    // =====================================================

    this.contactList[contactIndex].uploadedFiles = [

        ...this.contactList[contactIndex].uploadedFiles,

        ...newFiles
    ];

    // =====================================================
    // UPDATE ATTACHMENT COUNT
    // =====================================================

    this.contactList[contactIndex].attachmentCount =
        this.contactList[contactIndex].uploadedFiles.length;

    console.log(
        '📎 attachmentCount:',
        this.contactList[contactIndex].attachmentCount
    );

        // =====================================================
        // FORCE REACTIVITY
        // =====================================================

        this.contactList = [...this.contactList];

        console.log(
            '✅ Updated contact row:',
            JSON.stringify(this.contactList[contactIndex])
        );

        this.showContactAttachmentModal = false;

}

handleCloseContactAttachmentModal() {
    this.showContactAttachmentModal = false;

    this.uploadedFiles = [];
    this.totalfiles = [];
    this.isFileExpand = false;
    this.fileName = '';
}

handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
}

handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    let files = Array.from(event.dataTransfer.files || []);

    if (!this._validateFiles(files)) return;

    this.totalfiles.push(...files);

    this.processFiles(files);
}

handleFileUploadInputChange(event) {

    console.log('🔥 handleFileUploadInputChange triggered');

    let files = Array.from(event.target.files || []);

    console.log('📂 Selected Files:', files);

    console.log('📂 File Count:', files.length);

    if (!this._validateFiles(files)) {

        console.log('❌ File validation failed');

        event.target.value = '';

        return;
    }

    console.log('✅ File validation passed');

    this.totalfiles.push(...files);

    console.log('📦 totalfiles:', this.totalfiles);

    this.processFiles(files);

    event.target.value = '';
}

_validateFiles(files) {

    const longName = files.find(f => f.name.length > 180);

    if (longName) {

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Error",
                message: `Filename too long: "${longName.name}"`,
                variant: "error"
            })
        );
        return false;
    }

    const MAX = 50 * 1024 * 1024;

    const existing = this.totalfiles.reduce(
        (s, f) => s + f.size,
        0
    );

    const incoming = files.reduce(
        (s, f) => s + f.size,
        0
    );

    if (existing + incoming > MAX) {

        this.showToast(
            'Error',
            'Total file size cannot exceed 50 MB.',
            'error'
        );

        return false;
    }

    return true;
}

processFiles(files) {

    console.log('🚀 processFiles called');

    console.log('📂 Incoming Files:', files);

    if (!files || !files.length) {

        console.log('❌ No files found');

        return;
    }

    this.isFileExpand = true;

    console.log('✅ isFileExpand set to TRUE');

    requestAnimationFrame(() => {

        console.log('🎯 First RAF triggered');

        requestAnimationFrame(() => {

            console.log('🎯 Second RAF triggered');

            const svc = this.template.querySelector(
                'c-document-office-service'
            );

            console.log('🧩 Upload Component:', svc);

            if (!svc) {

                console.warn(
                    '❌ c-document-office-service NOT FOUND'
                );

                return;
            }

            console.log('✅ Upload component found');

            svc.incomingFiles = files;

            console.log(
                '📤 Files passed to child component:',
                files
            );

        });

    });
}

triggerAttachInput() {

    console.log('🔥 triggerAttachInput called');

    const input = this.template.querySelector(
        '.contact-upload-input'
    );

    console.log('📂 File Input Element:', input);

    if (!input) {

        console.error('❌ File input NOT FOUND');

        return;
    }

    console.log('✅ File input found');

    input.value = '';

    console.log('🟢 Opening file picker');

    input.click();

    console.log('📤 input.click() executed');
}

handleAwsUploadComplete(evt) {

    console.log('🔥 handleAwsUploadComplete fired');

    console.log('📦 Event Detail:', JSON.stringify(evt.detail));

    try {

        const { files = [] } = evt.detail || {};

        console.log('📂 Uploaded AWS Files:', files);

        if (!files.length) {

            console.warn('❌ No uploaded files returned');

            return;
        }

        this.uploadedFiles = files;

        console.log(
            '✅ uploadedFiles updated:',
            JSON.stringify(this.uploadedFiles)
        );

        this.fileName =
            files.map(f => f?.originalName)
                 .filter(Boolean)
                 .join(', ');

        this.isFileAttached = true;

        console.log('✅ File upload success');

    } catch (e) {

        console.error(
            '❌ handleAwsUploadComplete ERROR:',
            e
        );
    }
}

handleFileDeleted(event) {

    const { fileId, files } = event.detail;

    this.uploadedFiles =
        this.uploadedFiles.filter(
            f => f.fileId !== fileId
        );

    this.totalfiles = [];

    if (!files || files.length === 0) {

        this.isFileExpand = false;

        this.fileName = '';
    }
}

handlefilecancel() {
    this.totalfiles = [];
}

handleDeleteAttachment(event) {

    const attachmentId =
        event.currentTarget.dataset.id;

    console.log(
        'Deleting Attachment:',
        attachmentId
    );

    this.showSpinner = true;

    deleteContactAttachment({
        attachmentId: attachmentId
    })
    .then(() => {

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Success",
                message: "Attachment deleted successfully",
                variant: "success"
            })
        );

        // Refresh file list
        this.loadContactAttachments();

        this.loadContactAttachmentCounts();

        // Refresh contact counts
        return refreshApex(this.wiredClientResult);
    })
    .catch(error => {

        console.error(error);

        this.showToast(
            'Error',
            error?.body?.message || 'Delete failed',
            'error'
        );
    })
    .finally(() => {
        this.showSpinner = false;
    });
}

closeAttachmentListModal() {

    this.showAttachmentListModal = false;
    this.contactAttachments = [];
    this.selectedContactForFiles = null;
    this.ParticpantRecordForm = true;
}

loadContactAttachmentCounts() {

    const contactIds = this.contactList
        .filter(con => con.id)
        .map(con => con.id);

    if (!contactIds.length) {
        return;
    }

    getContactAttachmentCounts({
        contactIds: contactIds
    })
    .then(result => {

        this.contactList = this.contactList.map(con => {

            const count = result[con.id] || 0;

            return {
                ...con,
                attachmentCount: count,
                isPlural: count > 0,
                attachmentLabel:
                    count === 1
                        ? '1 File'
                        : `${count} Files`
            };
        });

        console.log(
            'Attachment Counts:',
            JSON.stringify(this.contactList)
        );
    })
    .catch(error => {
        console.error(
            'Error loading attachment counts',
            error
        );
    });
}

handleOpenAttachmentList(event) {

    const index = event.currentTarget.dataset.index;
    const contact = this.contactList[index];
    if (!contact || !contact.id) {
        return;
    }
    this.selectedContactId = contact.id;
    // OPEN MODAL
    this.showAttachmentListModal = true;
    // LOAD FILES
    this.loadContactAttachments();
}

loadContactAttachments() {

    getContactAttachments({
        contactId: this.selectedContactId
    })
    .then(result => {

        // ============================================
        // MODAL ATTACHMENT LIST
        // ============================================

        this.contactAttachments = result.map(file => {

            return {
                ...file,
                viewUrl: file.Amazon_file_URL__c
            };
        });

        // ============================================
        // 🔥 IMPORTANT FIX
        // SYNC uploadedFiles FOR CONTACT
        // ============================================

        const contactIndex = this.contactList.findIndex(
            row =>
                row.id === this.selectedContactId ||
                row.Id === this.selectedContactId
        );

        if (contactIndex !== -1) {

            this.contactList[contactIndex].uploadedFiles =
                result.map(file => {

                    return {

                        // 🔥 CRITICAL
                        attachmentId: file.Id,

                        originalName:
                            file.File_Name__c || file.Name,

                        url:
                            file.Amazon_file_URL__c,

                        key:
                            file.Key__c,

                        size:
                            file.Size__c
                    };
                });

            // 🔥 FORCE REACTIVITY
            this.contactList = [...this.contactList];
        }

        console.log(
            '✅ Attachments synced:',
            JSON.stringify(this.contactList[contactIndex])
        );
    })
    .catch(error => {

        console.error(
            'Error loading attachments',
            error
        );
    });
}

handlereturn() {

    this.isViewDoc = false;

    // ONLY OPEN FILES MODAL
    this.showAttachmentListModal = true;

    this.participantModule = true;

    // KEEP EDIT SCREEN CLOSED
    this.ParticpantRecordForm = false;
}

@track currentUrl = '';

getFileType(url) {

    if (!url) {
        return '';
    }

    return url
        .split('.')
        .pop()
        .split('?')[0]
        .toLowerCase();
}

handleViewAttachment(event) {

    event.preventDefault();

    const url = event.currentTarget.dataset.url;

    this.currentUrl = url;

    console.log('Viewing URL:', this.currentUrl);

    // CLOSE ATTACHMENT MODAL
    this.showAttachmentListModal = false;

    // CLOSE PARTICIPANT EDIT SCREEN
    this.ParticpantRecordForm = false;

    // OPEN VIEW
    this.isViewDoc = true;

    this.showAttachmentListModal = false;

    this.participantModule = false;


    const fileType = this.getFileType(this.currentUrl);

    console.log('File Type:', fileType);

    // 🔥 SUPPORTED PREVIEW TYPES
    if (
        fileType !== 'png' &&
        fileType !== 'pdf' &&
        fileType !== 'jpeg' &&
        fileType !== 'jpg' &&
        fileType !== 'csv' &&
        fileType !== 'svg'
    ) {

        console.log(
            'Unsupported preview type'
        );

        // 🔥 FALLBACK
        setTimeout(() => {

            this.handlereturn();

        }, 1700);

        return;
    }
}

}