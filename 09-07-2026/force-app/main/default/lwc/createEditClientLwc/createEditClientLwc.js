import { LightningElement, wire, api, track } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getClientById from '@salesforce/apex/ClientDataController.getClientById';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import My_Resource from "@salesforce/resourceUrl/myResource";
import getEmployeeData from '@salesforce/apex/issueRegisterSearch.getEmployeeData';
import insertStaffRecords from '@salesforce/apex/ClientDataController.insertStaffRecords';
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import fetchFacilitiess from "@salesforce/apex/ClientSearchController.fetchFacilitiess";
import getStaffData from '@salesforce/apex/ClientDataController.getStaffData';
import updateStaffAssignments from '@salesforce/apex/ClientDataController.updateStaffAssignments'; 
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getStaffMembers from '@salesforce/apex/PreferredStaffController.getStaffMembers';
import getStaffRoleAssignment from '@salesforce/apex/PreferredStaffController.getStaffRoleAssignment';
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key';
import getRoles from '@salesforce/apex/PreferredStaffController.getRoles';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo'; 
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
import updateParticipantContacts from "@salesforce/apex/ClientDataController.updateParticipantContacts";
import upsertParticipantFacilities from '@salesforce/apex/staffFacilityHandler.upsertParticipantFacilities';
import deleteContacts from "@salesforce/apex/ClientDataController.deleteContacts";
import checkUserExists from '@salesforce/apex/UserAccessController.checkUserExists';
import isGuardianUserActive from '@salesforce/apex/UserAccessController.isGuardianUserActive';
import checkFutureServices from '@salesforce/apex/ClientDataController.checkFutureServices';
import deleteContactAttachment from '@salesforce/apex/ClientAttachmentHandler.deleteContactAttachment';
import getContactAttachmentCounts from '@salesforce/apex/ClientAttachmentHandler.getContactAttachmentCounts';
import getContactAttachments from '@salesforce/apex/ClientAttachmentHandler.getContactAttachments';

const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};


export default class CreateEditClientLwc extends NavigationMixin(LightningElement) {
  primary = My_Resource + '/myResource/images/Primary.svg';
  secondary = My_Resource + '/myResource/images/Secondary.svg';
  Search = My_Resource + '/myResource/images/Participants.svg';
  infoicon = My_Resource + '/myResource/images/Info_Icon.png';
  infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';
  @api facilityOptionsFromParent=[];
  @api individualflag;
  @api companyflag; //vamshi
  @api ndisflag; //vamshi
  @track agedCareFlag = false;
  @api ndiscreateflag;
  @track detailsflag=true;
  @track addressflag=false;
  @track identificationflag;
  @track insuranceflag;
  @track participantflag;
  @track primaryflag;
  @track secondaryflag;
  @track detailseditflag=false;
  @track addresseditflag;
  @track identificationeditflag;
  @track insuranceeditflag;
  @track primaryeditflag;
  @track participanteditflag;
  @track editButtom = true;
  @track secondaryeditflag;
  @track clientData=[];
  @track facilityOptions=[];
  @track finalListFacilities=[];
  @track industryWiseFacility=[]; //vamshi
  wiredClientResult;
  @track imageerror;
  @track fileName;
  @track street1;
  @track city;
  @track country;
  @track province;
  @track postalcode;
  @track fullName;
  @track firstName='';
  @track lastName='';
  @track clientId;
  @track clientName;
  @track assignParticipant = false;
  @track staffOptions = [];    
  @track staffVal;  
  @track staffName=[];
  @track orgId;
  @track selectedRoles=[];
  @track OrgNisationRoles=[]; 
  @track facilityId = ''; 
  @track role = '';
  @track staffRecID;
  @api participantId;
  @track image;
  @track toggleValue;
  wiredStaffResult;
  @api faclist=[];
  @track editandBackButton = true;
  @track staffMembers = [];
  @track roles = [];
  @track fieldErrorMap = {};
  @track activeRoles = {};
  @track searchStaff = '';
  @track filteredStaffMembers = [];
  @track paginatedData = [];
  @track facilityPreferredName;
  @track participantPreferredName;
  @track staffPreferredName;
  @track showSpinner = false;
  originalStaffMembers = [];
  originalModifiedStaffMap = {};
  @track deletedContactIds = [];
  @track dashboardstoredFacilityId = [];

  @track showContactTypeModal = false;
  @track newContactTypeName = '';
  @track customContactTypes = [];
  @track stagedDeleteTypes = [];
  @track activeContactRowIndex;
  @track previousContactType;
  @track createUserflag = false;
  @track participantModule = true;
  @track contactData;

  @track shiftDatesMessage = '';
  @track hasFutureShifts = false;

  @track sectionFlags = {
    PartcipantDetails: true,
    Addressdetails: true,
    IdentificationDetails: true,
    ParticipantIdentifiers: true,
    MedicalCardDetails: true,
    InsuranceDetails: true,
    PrimaryContactDetails: true,
    SecondaryContactDetails: true, 
    Assignstaff: true, 
    OtherPreferences: true,     
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

//  @track sectionIcons = {
//     PartcipantDetails: '\u2B9F', 
//     Addressdetails: '\u2B9F',
//     IdentificationDetails: '\u2B9F',
//     ParticipantIdentifiers: '\u2B9F',
//     MedicalCardDetails: '\u2B9F',
//     InsuranceDetails: '\u2B9F',
//     PrimaryContactDetails: '\u2B9F',
//     SecondaryContactDetails: '\u2B9F', 
//     Assignstaff: '\u2B9F',  
//     OtherPreferences: '\u2B9F',
// };

@track sectionIcons = {
  PartcipantDetails: { ...ICON_DOWN },
  Addressdetails: { ...ICON_DOWN },
  IdentificationDetails: { ...ICON_DOWN },
  ParticipantIdentifiers: { ...ICON_DOWN },
  MedicalCardDetails: { ...ICON_DOWN },
  InsuranceDetails: { ...ICON_DOWN },
  PrimaryContactDetails: { ...ICON_DOWN },
  SecondaryContactDetails: { ...ICON_DOWN },
  Assignstaff: { ...ICON_DOWN },
  OtherPreferences: { ...ICON_DOWN },
};


  @track sectionFlags1 = {
    PartcipantDetails1: true,
    Addressdetails1: true,
    IdentificationDetails1: true,
    InsuranceDetails1: true,
    PrimaryContactDetails1: true,
    SecondaryContactDetails1: true, 
    Assignstaff1: true, 
    OtherPreferences1: true,
    ParticipantIdentifiers1: true,
    MedicalCardDetails1: true,
     OtherPreferences: true,
};
//  @track sectionIcons1 = {
//     PartcipantDetails1: '\u2B9F', 
//     Addressdetails1: '\u2B9F',
//     IdentificationDetails1: '\u2B9F',
//     ParticipantIdentifiers1: '\u2B9F',
//     MedicalCardDetails1: '\u2B9F',
//     InsuranceDetails1: '\u2B9F',
//     PrimaryContactDetails1: '\u2B9F',
//     SecondaryContactDetails1: '\u2B9F', 
//     Assignstaff1: '\u2B9F', 
//     OtherPreferences1: '\u2B9F', 

// };

@track sectionIcons1 = {
  PartcipantDetails1: { ...ICON_DOWN },
  Addressdetails1: { ...ICON_DOWN },
  IdentificationDetails1: { ...ICON_DOWN },
  ParticipantIdentifiers1: { ...ICON_DOWN },
  MedicalCardDetails1: { ...ICON_DOWN },
  InsuranceDetails1: { ...ICON_DOWN },
  PrimaryContactDetails1: { ...ICON_DOWN },
  SecondaryContactDetails1: { ...ICON_DOWN },
  Assignstaff1: { ...ICON_DOWN },
  OtherPreferences1: { ...ICON_DOWN },
    OtherPreferences: { ...ICON_DOWN },

};


@track facilityId;
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
@track Nationality = '';
@track isExpanded = false;
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
        uploadedFiles: [],
        firstNamePlaceholder: 'Enter Name',
        lastNamePlaceholder: 'Enter Name',
        phonePlaceholder: 'Enter Number',
        emailPlaceholder: 'Enter Email',
        showAdd: true,
        addButtonClass: 'add-visible'
    }
];
 @track multiFacilityDroDownList=[];
  @track selctedMultipleFcailityValues=[];
  @track facilityDropDownOpen=false;
  @track activeFaciltyDisplay='';

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
@track isMedicareEntered = false;
@track createCurrentStep = 'createstep1';

@track showOtherField = false;
@track attachmentType;
@track attachmentTypeOptions = [
    { label: 'Certificate', value: 'Certificate' },
    { label: 'Compliance', value: 'Compliance' },
    { label: 'Legal Documentation', value: 'Legal Documentation' },
    { label: 'Training', value: 'Training' },
    { label: 'Inventory', value: 'Inventory' },
    { label: 'Invoice', value: 'Invoice' },
    { label: 'Other', value: 'Other' },
    { label: 'Functional Capacity Assessment', value: 'Functional Capacity Assessment' },
    { label: 'AT Assessment', value: 'AT Assessment' },
    { label: 'Home and Living Assessment', value: 'Home and Living Assessment' },
    { label: 'Sensory Profile Assessment', value: 'Sensory Profile Assessment' },
    { label: 'SDAAssessment', value: 'SDAAssessment' },
    { label: 'Cognitive Assessment', value: 'Cognitive Assessment' },
    { label: 'Mental Health Assessment', value: 'Mental Health Assessment' },
    { label: 'WHODAS/Vineland - Behaviour Assessment', value: 'WHODAS/Vineland - Behaviour Assessment' },
    { label: 'Behaviour Logs', value: 'Behaviour Logs' },
    { label: 'Communication Assessment', value: 'Communication Assessment' },
    { label: 'Speech and Language Assessment', value: 'Speech and Language Assessment' },
    { label: 'SIL Roster of Care', value: 'SIL Roster of Care' },
    { label: 'Nutrition and Swallowing Assessment', value: 'Nutrition and Swallowing Assessment' },
    { label: 'Mobility Assessment', value: 'Mobility Assessment' },
    { label: 'Falls Risk Assessment', value: 'Falls Risk Assessment' },
    { label: 'Psychological Assessment', value: 'Psychological Assessment' },
    { label: 'Equipment/Mobility Aid Assessment', value: 'Equipment/Mobility Aid Assessment' },
    { label: 'Neuropsychological Assessment', value: 'Neuropsychological Assessment' },
    { label: 'Hospital Discharge Summary', value: 'Hospital Discharge Summary' },
    { label: 'Psychiatric Assessment Report', value: 'Psychiatric Assessment Report' },
    { label: 'OT Report', value: 'OT Report' },
    { label: 'Medical Report', value: 'Medical Report' },
    { label: 'Risk and Emergency Plan', value: 'Risk and Emergency Plan' },
    { label: 'Restrictive Practice', value: 'Restrictive Practice' },
    { label: 'Mealtime Management Plan', value: 'Mealtime Management Plan' },
    { label: 'Medication Report', value: 'Medication Report' },
    { label: 'Care Plan', value: 'Care Plan' },
    { label: 'Support Plan', value: 'Support Plan' },
    { label: 'Disaster Management Plan', value: 'Disaster Management Plan' },
    { label: 'Health Care Notes', value: 'Health Care Notes' },
    { label: 'Epilepsy Management Plan', value: 'Epilepsy Management Plan' },
    { label: 'Dietician Plan', value: 'Dietician Plan' },
    { label: 'Enteral Feeding Support Plan', value: 'Enteral Feeding Support Plan' },
    { label: 'Complex Bowel Care Plan', value: 'Complex Bowel Care Plan' }
];

// STEP CLASSES
get step1Class() { return this.createCurrentStep === 'createstep1' ? '' : 'slds-hide'; }
get step2Class() { return this.createCurrentStep === 'createstep2' ? '' : 'slds-hide'; }
get step3Class() { return this.createCurrentStep === 'createstep3' ? '' : 'slds-hide'; }
get step4Class() { return this.createCurrentStep === 'createstep4' ? '' : 'slds-hide'; }
get step5Class() { return this.createCurrentStep === 'createstep5' ? '' : 'slds-hide'; }

// TOTAL STEPS
get totalSteps() {
    return this.companyflag ? 2 : 4;
}

// CURRENT STEP NUMBER
get currentStepNumber() {
    return Number(this.createCurrentStep.replace('createstep', ''));
}

// BUTTONS
get showPrevious() {
    return this.currentStepNumber > 1;
}

get showNext() {
    return this.currentStepNumber < this.totalSteps;
}

get showSave() {
    return this.currentStepNumber === this.totalSteps;
}

get showSkip() {
    return !this.companyflag && this.createCurrentStep === 'createstep3';
}

// // NAVIGATION
// handleCreateNext() {
//     const errors = this.validateStepFields(this.createCurrentStep);

//     if (errors.length) {
//         this.showError(`Please fill required fields: ${errors.join(', ')}`);
//         return;
//     }

//     if (this.currentStepNumber < this.totalSteps) {
//         this.createCurrentStep = 'createstep' + (this.currentStepNumber + 1);
//     }
// }

handleCreateNext() {
    const errors = this.validateStepFields(this.createCurrentStep);
    if (errors.length > 0) {
        // Step 3 already fires its own toast — skip showError for it
        if (this.createCurrentStep !== 'createstep3') {
            this.showError(`Please fill required fields: ${errors.join(', ')}`);
        }
        return;
    }
    if (this.currentStepNumber < this.totalSteps) {
        this.createCurrentStep = `createstep${this.currentStepNumber + 1}`;
    }
}


handleCreatePrevious() {
    if (this.currentStepNumber > 1) {
        this.createCurrentStep = 'createstep' + (this.currentStepNumber - 1);
    }
}

handleSkipStep3() {
    if (!this.companyflag) {
        this.createCurrentStep = 'createstep4';
    }
}

handleCancel() {
    this.createCurrentStep = 'createstep1';
}

// VALIDATION
// validateStepFields(stepName) {
//     let missing = [];

//     const step = this.template.querySelector(`[data-step="${stepName}"]`);
//     if (!step) return missing;

//     const fields = step.querySelectorAll(
//         'lightning-input, lightning-input-field, lightning-combobox'
//     );

//     fields.forEach(f => {
//         if (f.required && !f.reportValidity()) {
//             let label = f.dataset.label || f.label || f.fieldName || 'Field';
//             missing.push(label);
//         }
//     });

//     const addr = step.querySelector('[data-id="mandatory-address"]');
//     if (addr) {
//         if (!this.street || !this.city || !this.province || !this.postalcode || !this.country) {
//             missing.push('Address');
//         }
//     }

//     return [...new Set(missing)];
// }
// validateStepFields(stepName) {
//     const missing = [];
//     const stepEl = this.template.querySelector(`[data-step="${stepName}"]`);

//     // ─── STEP 1: Personal Details ──────────────────────────────────────────
//     if (stepName === 'createstep1') {

//         if (this.companyflag) {

//             // ── Company Name ──
//             const companyField = stepEl?.querySelector('[data-id="companyName"]');
//             const companyValue = this.Company?.trim() || companyField?.value?.trim();
//             if (!companyValue) {
//                 companyField?.reportValidity();
//                 missing.push('Company Name');
//             }

//             // ── Start Date ──
//             const startDateField = stepEl?.querySelector('[data-id="startDate"]');
//             if (startDateField) {
//                 if (!startDateField.value?.trim()) {
//                     startDateField.reportValidity();
//                     missing.push('Start Date');
//                 }
//             } else if (!this.lastName?.trim()) {
//                 missing.push('Start Date');
//             }

//             // ── Facility ──
//             if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
//                 missing.push('Facility');
//             }

//             // ── Address — read live from DOM, fallback to tracked props ──
//             const addressField = stepEl?.querySelector('lightning-input-address');
//             const street   = addressField ? addressField.street?.trim()    : this.street1?.trim();
//             const city     = addressField ? addressField.city?.trim()       : this.city?.trim();
//             const province = addressField ? addressField.province?.trim()   : this.province?.trim();
//             const postal   = addressField ? addressField.postalCode?.trim() : this.postalcode?.trim();
//             const country  = addressField ? addressField.country?.trim()    : this.country?.trim();
//             if (!street || !city || !province || !postal || !country) {
//                 missing.push('Address');
//             }

//             // ── Contact Number ──
//             const contactField = stepEl?.querySelector('[data-id="contact"]');
//             if (contactField && !contactField.value) {
//                 contactField.reportValidity();
//                 missing.push('Contact Number');
//             }

//             // ── Email ID ──
//             const emailField = stepEl?.querySelector('[data-id="email"]');
//             if (emailField && !emailField.value) {
//                 emailField.reportValidity();
//                 missing.push('Email ID');
//             }

//         } else {

//             // ── NDIS / Individual ──

//             // ── First Name ──
//             const firstNameField = stepEl?.querySelector('[name="fname"]');
//             if (firstNameField && !firstNameField.value?.trim()) {
//                 firstNameField.reportValidity();
//                 missing.push('First Name');
//             }

//             // ── Last Name ──
//             const lastNameField = stepEl?.querySelector('[name="lname"]');
//             if (lastNameField && !lastNameField.value?.trim()) {
//                 lastNameField.reportValidity();
//                 missing.push('Last Name');
//             }

//             // ── Gender ──
//             const genderField = stepEl?.querySelector('[data-id="gender"]');
//             if (genderField && !genderField.value?.trim()) {
//                 genderField.reportValidity();
//                 missing.push('Gender');
//             }

//             // ── Date of Birth ──
//             const dobField = stepEl?.querySelector('[data-id="dob"]');
//             if (dobField && !dobField.value) {
//                 dobField.reportValidity();
//                 missing.push('Date of Birth');
//             }

//             // ── Contact Number ──
//             const contactField = stepEl?.querySelector('[data-id="contact"]');
//             if (contactField && !contactField.value) {
//                 contactField.reportValidity();
//                 missing.push('Contact Number');
//             }

//             // ── Email ID ──
//             const emailField = stepEl?.querySelector('[data-id="email"]');
//             if (emailField && !emailField.value) {
//                 emailField.reportValidity();
//                 missing.push('Email ID');
//             }

//             // ── Facility ──
//             if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
//                 missing.push('Facility');
//             }

//             // ── Address — read live from DOM, fallback to tracked props ──
//             const addressField = stepEl?.querySelector('lightning-input-address');
//             const street   = addressField ? addressField.street?.trim()    : this.street1?.trim();
//             const city     = addressField ? addressField.city?.trim()       : this.city?.trim();
//             const province = addressField ? addressField.province?.trim()   : this.province?.trim();
//             const postal   = addressField ? addressField.postalCode?.trim() : this.postalcode?.trim();
//             const country  = addressField ? addressField.country?.trim()    : this.country?.trim();
//             if (!street || !city || !province || !postal || !country) {
//                 missing.push('Address');
//             }
//         }

//         // ── Preferred Name — applies to ALL participant types ──
//         const preferNicknameField = stepEl?.querySelector('[data-id="preferNickname"]');
//         const nicknameField       = stepEl?.querySelector('[data-id="nicknameField"]');
//         const isPreferChecked     = preferNicknameField?.value === true
//                                  || preferNicknameField?.checked === true;
//         if (isPreferChecked) {
//             const nicknameValue = nicknameField?.value?.trim();
//             if (!nicknameValue) {
//                 nicknameField?.reportValidity();
//                 missing.push('Preferred Name (required when Prefer Nickname is checked)');
//             }
//         }

//         // ── ONE toast for everything missing ──
//         if (missing.length > 0) {
//             this.dispatchEvent(new ShowToastEvent({
//                 title: 'Required Fields Missing',
//                 message: `Please fill in: ${[...new Set(missing)].join(', ')}.`,
//                 variant: 'error'
//             }));
//         }

//         return [...new Set(missing)];
//     }

//     // ─── STEP 2: Identification (NDIS/Individual) or Contacts (Company) ────
//     if (stepName === 'createstep2') {

//         const medicareField = stepEl?.querySelector('[data-id="medicare"]');
//         const irnField      = stepEl?.querySelector('[data-id="irn"]');
//         const expiryField   = stepEl?.querySelector('[data-id="expiryDate"]');

//         const medicareVal = medicareField?.value?.trim() || null;
//         const irnVal      = irnField?.value || null;
//         const expiryVal   = expiryField?.value || null;

//         if (medicareVal) {
//             if (!irnVal) {
//                 irnField?.reportValidity();
//                 missing.push('IRN (required when Medicare Card ID is entered)');
//             }
//             if (!expiryVal) {
//                 expiryField?.reportValidity();
//                 missing.push('Expiry Date (required when Medicare Card ID is entered)');
//             }
//         }
//         if (irnVal && !medicareVal) {
//             medicareField?.reportValidity();
//             missing.push('Medicare Card ID (required when IRN is entered)');
//         }

//         if (missing.length > 0) {
//             this.dispatchEvent(new ShowToastEvent({
//                 title: 'Required Fields Missing',
//                 message: `Please fill in: ${[...new Set(missing)].join(', ')}.`,
//                 variant: 'error'
//             }));
//         }

//         return [...new Set(missing)];
//     }

//     // ─── STEP 3: Contacts ──────────────────────────────────────────────────
//     if (stepName === 'createstep3') {

//         const primaryContacts  = this.contactList.filter(con => con.contactType === 'Primary');
//         const guardianContacts = this.contactList.filter(con => con.contactType === 'Guardian');

//         // ── Primary ──
//         for (let i = 0; i < primaryContacts.length; i++) {
//             const c = primaryContacts[i];
//             if (!c.firstName?.trim() || !c.lastName?.trim() || !c.contactNumber?.trim() || !c.email?.trim()) {
//                 this.dispatchEvent(new ShowToastEvent({
//                     title: 'Primary Contact Incomplete',
//                     message: `Primary contact (Row ${i + 1}): First Name, Last Name, Contact Number and Email are all required.`,
//                     variant: 'error'
//                 }));
//                 return ['Primary Contact Details'];
//             }
//         }

//         // ── Guardian ──
//         for (let i = 0; i < guardianContacts.length; i++) {
//             const c = guardianContacts[i];
//             if (!c.firstName?.trim() || !c.lastName?.trim() || !c.contactNumber?.trim() || !c.email?.trim()) {
//                 this.dispatchEvent(new ShowToastEvent({
//                     title: 'Guardian Contact Incomplete',
//                     message: `Guardian contact (Row ${i + 1}): First Name, Last Name, Contact Number and Email are all required.`,
//                     variant: 'error'
//                 }));
//                 return ['Guardian Contact Details'];
//             }
//         }

//         return [];
//     }

//     // ─── STEP 4: Support Preferences — optional ────────────────────────────
//     if (stepName === 'createstep4') {
//         return missing;
//     }

//     return missing;
// }

// validateStepFields(stepName) {
//     const missing = [];
//     const stepEl = this.template.querySelector(`[data-step="${stepName}"]`);

//     // ─── STEP 1 ───────────────────────────────────────────────────────────
//     if (stepName === 'createstep1') {

//         if (this.companyflag) {

//             // Company Name
//             const companyField = stepEl?.querySelector('[data-id="companyName"]');
//             const companyValue = this.Company?.trim() || companyField?.value?.trim();
//             if (!companyValue) {
//                 companyField?.reportValidity();
//                 missing.push('Company Name');
//             }

//             // Start Date
//             const startDateField = stepEl?.querySelector('[data-id="startDate"]');
//             if (startDateField) {
//                 if (!startDateField.value?.trim()) {
//                     startDateField.reportValidity();
//                     missing.push('Start Date');
//                 }
//             } else if (!this.lastName?.trim()) {
//                 missing.push('Start Date');
//             }

//             // Facility
//             if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
//                 missing.push('Facility');
//             }

//             // Address
//             const addressFieldC = stepEl?.querySelector('lightning-input-address');
//             const streetC   = addressFieldC ? addressFieldC.street?.trim()    : this.street1?.trim();
//             const cityC     = addressFieldC ? addressFieldC.city?.trim()       : this.city?.trim();
//             const provinceC = addressFieldC ? addressFieldC.province?.trim()   : this.province?.trim();
//             const postalC   = addressFieldC ? addressFieldC.postalCode?.trim() : this.postalcode?.trim();
//             const countryC  = addressFieldC ? addressFieldC.country?.trim()    : this.country?.trim();
//             if (!streetC || !cityC || !provinceC || !postalC || !countryC) {
//                 missing.push('Address');
//             }

//             // Contact Number
//             const contactFieldC = stepEl?.querySelector('[data-id="contact"]');
//             if (contactFieldC && !contactFieldC.value) {
//                 contactFieldC.reportValidity();
//                 missing.push('Contact Number');
//             }

//             // Email ID
//             const emailFieldC = stepEl?.querySelector('[data-id="email"]');
//             if (emailFieldC && !emailFieldC.value) {
//                 emailFieldC.reportValidity();
//                 missing.push('Email ID');
//             }

//         } else {

//             // NDIS / Individual

//             // First Name
//             const firstNameField = stepEl?.querySelector('[name="fname"]');
//             if (firstNameField && !firstNameField.value?.trim()) {
//                 firstNameField.reportValidity();
//                 missing.push('First Name');
//             }

//             // Last Name
//             const lastNameField = stepEl?.querySelector('[name="lname"]');
//             if (lastNameField && !lastNameField.value?.trim()) {
//                 lastNameField.reportValidity();
//                 missing.push('Last Name');
//             }

//             // Gender
//             const genderField = stepEl?.querySelector('[data-id="gender"]');
//             if (genderField && !genderField.value?.trim()) {
//                 genderField.reportValidity();
//                 missing.push('Gender');
//             }

//             // Date of Birth
//             const dobField = stepEl?.querySelector('[data-id="dob"]');
//             if (dobField && !dobField.value) {
//                 dobField.reportValidity();
//                 missing.push('Date of Birth');
//             }

//             // Contact Number
//             const contactField = stepEl?.querySelector('[data-id="contact"]');
//             if (contactField && !contactField.value) {
//                 contactField.reportValidity();
//                 missing.push('Contact Number');
//             }

//             // Email ID
//             const emailField = stepEl?.querySelector('[data-id="email"]');
//             if (emailField && !emailField.value) {
//                 emailField.reportValidity();
//                 missing.push('Email ID');
//             }

//             // Facility
//             if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
//                 missing.push('Facility');
//             }

//             // Address
//             const addressField = stepEl?.querySelector('lightning-input-address');
//             const street   = addressField ? addressField.street?.trim()    : this.street1?.trim();
//             const city     = addressField ? addressField.city?.trim()       : this.city?.trim();
//             const province = addressField ? addressField.province?.trim()   : this.province?.trim();
//             const postal   = addressField ? addressField.postalCode?.trim() : this.postalcode?.trim();
//             const country  = addressField ? addressField.country?.trim()    : this.country?.trim();
//             if (!street || !city || !province || !postal || !country) {
//                 missing.push('Address');
//             }
//         }

//         // ── Preferred Name — runs for ALL types AFTER if/else ──
//         const preferNicknameField = stepEl?.querySelector('[data-id="preferNickname"]');
//         const nicknameField       = stepEl?.querySelector('[data-id="nicknameField"]');
//         const isPreferChecked     = preferNicknameField?.value === true
//                                  || preferNicknameField?.checked === true;
//         if (isPreferChecked) {
//             const nicknameValue = nicknameField?.value?.trim();
//             if (!nicknameValue) {
//                 nicknameField?.reportValidity();
//                 missing.push('Preferred Name (required when Prefer Nickname is checked)');
//             }
//         }

//         // NO toast here — handleCreateNext fires showError
//         return [...new Set(missing)];
//     }

//     // ─── STEP 2 ───────────────────────────────────────────────────────────
//     if (stepName === 'createstep2') {

//         const medicareField = stepEl?.querySelector('[data-id="medicare"]');
//         const irnField      = stepEl?.querySelector('[data-id="irn"]');
//         const expiryField   = stepEl?.querySelector('[data-id="expiryDate"]');

//         const medicareVal = medicareField?.value?.trim() || null;
//         const irnVal      = irnField?.value || null;
//         const expiryVal   = expiryField?.value || null;

//         if (medicareVal) {
//             if (!irnVal) {
//                 irnField?.reportValidity();
//                 missing.push('IRN (required when Medicare Card ID is entered)');
//             }
//             if (!expiryVal) {
//                 expiryField?.reportValidity();
//                 missing.push('Expiry Date (required when Medicare Card ID is entered)');
//             }
//         }
//         if (irnVal && !medicareVal) {
//             medicareField?.reportValidity();
//             missing.push('Medicare Card ID (required when IRN is entered)');
//         }

//         // NO toast here — handleCreateNext fires showError
//         return [...new Set(missing)];
//     }

//     // ─── STEP 3 ───────────────────────────────────────────────────────────
//     if (stepName === 'createstep3') {

//         const primaryContacts  = this.contactList.filter(con => con.contactType === 'Primary');
//         const guardianContacts = this.contactList.filter(con => con.contactType === 'Guardian');

//         for (let i = 0; i < primaryContacts.length; i++) {
//             const c = primaryContacts[i];
//             if (!c.firstName?.trim() || !c.lastName?.trim() || !c.contactNumber?.trim() || !c.email?.trim()) {
//                 this.dispatchEvent(new ShowToastEvent({
//                     title: 'Primary Contact Incomplete',
//                     message: `Primary contact (Row ${i + 1}): First Name, Last Name, Contact Number and Email are all required.`,
//                     variant: 'error'
//                 }));
//                 return ['Primary Contact Details'];
//             }
//         }

//         for (let i = 0; i < guardianContacts.length; i++) {
//             const c = guardianContacts[i];
//             if (!c.firstName?.trim() || !c.lastName?.trim() || !c.contactNumber?.trim() || !c.email?.trim()) {
//                 this.dispatchEvent(new ShowToastEvent({
//                     title: 'Guardian Contact Incomplete',
//                     message: `Guardian contact (Row ${i + 1}): First Name, Last Name, Contact Number and Email are all required.`,
//                     variant: 'error'
//                 }));
//                 return ['Guardian Contact Details'];
//             }
//         }

//         return [];
//     }

//     // ─── STEP 4 ───────────────────────────────────────────────────────────
//     if (stepName === 'createstep4') {
//         return missing;
//     }

//     return missing;
// }


validateStepFields(stepName) {
    const missing = [];
    const stepEl = this.template.querySelector(`[data-step="${stepName}"]`);

    // ─── STEP 1 ───────────────────────────────────────────────────────────
    if (stepName === 'createstep1') {

        if (this.companyflag) {

            // Company Name
            const companyField = stepEl?.querySelector('[data-id="companyName"]');
            const companyValue = this.Company?.trim() || companyField?.value?.trim();
            if (!companyValue) {
                companyField?.reportValidity();
                companyField?.closest('.floating-label')?.classList.add('has-error');
                missing.push('Company Name');
            }

            // Start Date
            const startDateField = stepEl?.querySelector('[data-id="startDate"]');
            if (startDateField) {
                if (!startDateField.value?.trim()) {
                    startDateField.reportValidity();
                    startDateField?.closest('.floating-label')?.classList.add('has-error');
                    missing.push('Start Date');
                }
            } else if (!this.lastName?.trim()) {
                missing.push('Start Date');
            }

            // Facility
            if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
                missing.push('Facility');
            }

            // Address
            const addressFieldC = stepEl?.querySelector('lightning-input-address');
            const streetC   = addressFieldC ? addressFieldC.street?.trim()    : this.street1?.trim();
            const cityC     = addressFieldC ? addressFieldC.city?.trim()       : this.city?.trim();
            const provinceC = addressFieldC ? addressFieldC.province?.trim()   : this.province?.trim();
            const postalC   = addressFieldC ? addressFieldC.postalCode?.trim() : this.postalcode?.trim();
            const countryC  = addressFieldC ? addressFieldC.country?.trim()    : this.country?.trim();
            if (!streetC || !cityC || !provinceC || !postalC || !countryC) {
                missing.push('Address');
            }

            // Contact Number
            const contactFieldC = stepEl?.querySelector('[data-id="contact"]');
            if (contactFieldC && !contactFieldC.value) {
                contactFieldC.reportValidity();
                contactFieldC?.closest('.floating-label, .ContactNumberClass')?.classList.add('has-error');
                missing.push('Contact Number');
            }

            // Email ID
            const emailFieldC = stepEl?.querySelector('[data-id="email"]');
            if (emailFieldC && !emailFieldC.value) {
                emailFieldC.reportValidity();
                emailFieldC?.closest('.floating-label, .emailClass')?.classList.add('has-error');
                missing.push('Email ID');
            }

        } else {

            // ── NDIS / Individual ──────────────────────────────────────────

            // First Name — use tracked JS property
            if (!this.firstName?.trim()) {
                const firstNameField = stepEl?.querySelector('[name="fname"]');
                if (firstNameField) {
                    firstNameField.reportValidity();
                    firstNameField.closest('.floating-label')?.classList.add('has-error');
                }
                missing.push('First Name');
            }

            // Last Name — use tracked JS property
            if (!this.lastName?.trim()) {
                const lastNameField = stepEl?.querySelector('[name="lname"]');
                if (lastNameField) {
                    lastNameField.reportValidity();
                    lastNameField.closest('.floating-label')?.classList.add('has-error');
                }
                missing.push('Last Name');
            }

            // Gender
            const genderField = stepEl?.querySelector('[data-id="gender"]');
            if (genderField && !genderField.value?.trim()) {
                genderField.reportValidity();
                genderField?.closest('.floating-label')?.classList.add('has-error');
                missing.push('Gender');
            }

            // Date of Birth
            const dobField = stepEl?.querySelector('[data-id="dob"]');
            if (dobField && !dobField.value) {
                dobField.reportValidity();
                dobField?.closest('.DateOfBirthClass')?.classList.add('has-error');
                missing.push('Date of Birth');
            }

            // Contact Number
            const contactField = stepEl?.querySelector('[data-id="contact"]');
            if (contactField && !contactField.value) {
                contactField.reportValidity();
                contactField?.closest('.floating-label, .ContactNumberClass')?.classList.add('has-error');
                missing.push('Contact Number');
            }

            // Email ID
            const emailField = stepEl?.querySelector('[data-id="email"]');
            if (emailField && !emailField.value) {
                emailField.reportValidity();
                emailField?.closest('.floating-label, .emailClass')?.classList.add('has-error');
                missing.push('Email ID');
            }

            // Facility
            if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
                missing.push('Facility');
            }

            // Address
            const addressField = stepEl?.querySelector('lightning-input-address');
            const street   = addressField ? addressField.street?.trim()    : this.street1?.trim();
            const city     = addressField ? addressField.city?.trim()       : this.city?.trim();
            const province = addressField ? addressField.province?.trim()   : this.province?.trim();
            const postal   = addressField ? addressField.postalCode?.trim() : this.postalcode?.trim();
            const country  = addressField ? addressField.country?.trim()    : this.country?.trim();
            if (!street || !city || !province || !postal || !country) {
                missing.push('Address');
            }
        }

        // ── Preferred Name — runs for ALL types AFTER if/else ──────────────
        const preferNicknameField = stepEl?.querySelector('[data-id="preferNickname"]');
        const nicknameField       = stepEl?.querySelector('[data-id="nicknameField"]');
        const isPreferChecked     = preferNicknameField?.value === true
                                 || preferNicknameField?.checked === true;
        if (isPreferChecked) {
            const nicknameValue = nicknameField?.value?.trim();
            if (!nicknameValue) {
                nicknameField?.reportValidity();
                nicknameField?.closest('.floating-label')?.classList.add('has-error');
                missing.push('Preferred Name (required when Prefer Nickname is checked)');
            }
        }

        // ✅ NO toast here — handleCreateNext fires the single toast
        return [...new Set(missing)];
    }

    // ─── STEP 2 ───────────────────────────────────────────────────────────
    if (stepName === 'createstep2') {

        const medicareField = stepEl?.querySelector('[data-id="medicare"]');
        const irnField      = stepEl?.querySelector('[data-id="irn"]');
        const expiryField   = stepEl?.querySelector('[data-id="expiryDate"]');

        const medicareVal = medicareField?.value?.trim() || null;
        const irnVal      = irnField?.value || null;
        const expiryVal   = expiryField?.value || null;

        if (medicareVal) {

            if (!irnVal && !expiryVal) {

            irnField?.reportValidity();
            expiryField?.reportValidity();

            irnField?.closest('.floating-label')?.classList.add('has-error');
            expiryField?.closest('.floating-label')?.classList.add('has-error');

            missing.push('IRN and Expiry Date (required when Medicare Card ID is entered)');

    } else {
            if (!irnVal) {
                irnField?.reportValidity();
                irnField?.closest('.floating-label')?.classList.add('has-error');
                missing.push('IRN (required when Medicare Card ID is entered)');
            }
            
             if (Number(irnVal) < 0 || Number(irnVal) > 9) {
                irnField?.reportValidity();
                irnField?.closest('.floating-label')?.classList.add('has-error');
                missing.push('IRN must be a single digit between 0 and 9');
            } 

            if (!expiryVal) {
                expiryField?.reportValidity();
                expiryField?.closest('.floating-label')?.classList.add('has-error');
                missing.push('Expiry Date (required when Medicare Card ID is entered)');
            }
       }
        }
        if (irnVal && !medicareVal) {
            medicareField?.reportValidity();
            medicareField?.closest('.floating-label')?.classList.add('has-error');
            missing.push('Medicare Card ID (required when IRN is entered)');
        }

        // ✅ NO toast here — handleCreateNext fires the single toast
        return [...new Set(missing)];
    }

    // ─── STEP 3 ───────────────────────────────────────────────────────────
    if (stepName === 'createstep3') {

        const primaryContacts  = this.contactList.filter(con => con.contactType === 'Primary');
        const guardianContacts = this.contactList.filter(con => con.contactType === 'Guardian');

        for (let i = 0; i < primaryContacts.length; i++) {
            const c = primaryContacts[i];
            if (!c.firstName?.trim() || !c.lastName?.trim() || !c.contactNumber?.trim() || !c.email?.trim()) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Primary Contact Incomplete',
                    message: `Primary contact (Row ${i + 1}): First Name, Last Name, Contact Number and Email are all required.`,
                    variant: 'error'
                }));
                return ['Primary Contact Details'];
            }
        }

        for (let i = 0; i < guardianContacts.length; i++) {
            const c = guardianContacts[i];
            if (!c.firstName?.trim() || !c.lastName?.trim() || !c.contactNumber?.trim() || !c.email?.trim()) {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Guardian Contact Incomplete',
                    message: `Guardian contact (Row ${i + 1}): First Name, Last Name, Contact Number and Email are all required.`,
                    variant: 'error'
                }));
                return ['Guardian Contact Details'];
            }
        }

        return [];
    }

    // ─── STEP 4 ───────────────────────────────────────────────────────────
    if (stepName === 'createstep4') {
        return missing;
    }

    return missing;
}

// TOAST
showError(msg) {
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Error',
            message: msg,
            variant: 'error'
        })
    );
}

resetWizard() {
    this.createCurrentStep = 'createstep1';
}

// handleCreateStepClick(event) {
//     const targetStep = event.target.value;
//     const target = Number(targetStep.replace('createstep', ''));
//     const current = this.currentStepNumber;

//     if (target > this.totalSteps) return;

//     if (target > current + 1) {
//         const missingFields = this.validateStepFields(this.createCurrentStep);

//         if (missingFields.length > 0) {
//             this.showError(`Please fill required fields: ${missingFields.join(', ')}`);
//         }
//         return;
//     }

//     if (target > current) {
//         const missingFields = this.validateStepFields(this.createCurrentStep);

//         if (missingFields.length > 0) {
//             this.showError(`Please fill required fields: ${missingFields.join(', ')}`);
//             return;
//         }
//     }

//     this.createCurrentStep = targetStep;
// }

// handleCreateStepClick(event) {
//     const targetStep = event.target.value;
//     const target = Number(targetStep.replace('createstep', ''));
//     const current = this.currentStepNumber;

//     if (target > this.totalSteps) return;

//     // Allow going BACKWARDS freely — no validation needed
//     if (target < current) {
//         this.createCurrentStep = targetStep;
//         return;
//     }

//     // Allow clicking the SAME step — do nothing
//     if (target === current) return;

//     // Going FORWARD — validate all steps from current up to target - 1
//     for (let step = current; step < target; step++) {
//         const stepName = `createstep${step}`;
//         const missingFields = this.validateStepFields(stepName);
//         if (missingFields.length > 0) {
//             // For step3, toast is already fired inside validateStepFields
//             if (stepName !== 'createstep3') {
//                 this.showError(`Please fill required fields: ${missingFields.join(', ')}`);
//             }
//             return; // Block navigation
//         }
//     }

//     // All validations passed — allow jump
//     this.createCurrentStep = targetStep;
// }

handleCreateStepClick(event) {
    const targetStep = event.target.value;
    const target = Number(targetStep.replace('createstep', ''));
    const current = this.currentStepNumber;

    if (target > this.totalSteps) return;

    // Backward — free navigation
    if (target < current) {
        this.createCurrentStep = targetStep;
        return;
    }

    // Same step — do nothing
    if (target === current) return;

    // Forward — validate each step from current up to target - 1
    for (let step = current; step < target; step++) {
        const stepName = `createstep${step}`;
        const missingFields = this.validateStepFields(stepName);
        if (missingFields.length > 0) {
            if (stepName !== 'createstep3') {
                this.showError(`Please fill required fields: ${missingFields.join(', ')}`);
            }
            return;
        }
    }

    this.createCurrentStep = targetStep;
}

    wiredStaffResult;
    wiredRolesResult;
    wiredAssignmentsResult;
    
    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;

    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }

    async fetchRolesForStaff() {
        try {
            const result = await getStaffRoleAssignment({
                clientId: this.clientId
            });

            this.activeRoles = result;
            console.log('✅ Active roles (await):', JSON.stringify(this.activeRoles));
           

            // Transform to match LWC template expectations
            this.paginatedData = result.map((item) => {
                return {
                    userId: item.staffId,
                    nickName: item.staffName,
                    roles: item.roles ? item.roles.join(', ') : '',
                    profileUrl: item.profileUrl
                };
            });

            console.log('🔎 paginatedData after mapping:', JSON.stringify(this.paginatedData));
            console.log('this.participanteditflag >>', this.participanteditflag);
            if (this.participanteditflag != false) {
                await this.fetchStaffMembers(); // 🔁 Ensure this populates paginatedData
                this.showSpinner = false;
            }

        } catch (error) {
            console.error('❌ Error fetching staff roles:', error);
            this.showSpinner = false;
        }
    }

    async fetchStaffMembers() {
        try {
             const result = await getStaffMembers({ facilityId: this.dashboardstoredFacilityId });
            console.log('Staff data >>', result);
            this.processStaffData(result);
        } catch (error) {
            throw error;
        }
    }

processStaffData(staffData) {
      this.staffMembers = staffData.map((staff, index) => {
          // Extract roles from StaffRoles__r
           const profileUrl = staff.picture__c ? staff.picture__c : '';
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
     
         if (!this.facilityId) {
             console.warn("⚠️ No facilityId found, cannot fetch Facility Roles.");
             return;
         }
     
         try {
            const result = await getRoleOptionsByFacility({ facilityIdList: this.dashboardstoredFacilityId });
        console.log(" Facility Roles fetched:", JSON.stringify(result));

            this.roles = (result || []).map(role => role.Role_Name__c);
     
             // Optional: reuse your existing assignment loader if needed
             this.loadAssignments?.();
     
         } catch (error) {
             console.error(" Error fetching Facility Roles:", error);
         }
     
         console.log(" [fetchRoles] END");
     }//manendra 
     get showInsurance() {
        // Example logic: NDIS = show all, Individual = hide insurance?, Company = hide insurance?
        return this.ndiscreateflag || this.individualflag;
    }

    get showIdentification() {
        return this.ndiscreateflag || this.individualflag;
    }

    get showPreferredStaff() {
        return this.ndiscreateflag; // Only for NDIS
    }


    loadAssignments() {
        if (this.staffMembers.length > 0 && this.roles.length > 0) {
            this.staffMembers = this.staffMembers.map(staff => {
            const matching = this.activeRoles.find(ar => ar.staffId === staff.Id);
            const roleAssignments = {};

            if (matching && Array.isArray(matching.roles)) {
                matching.roles.forEach(role => {
                    roleAssignments[role] = true;
                });
            }

            return {
                ...staff,
                roleAssignments // This now contains the original roles
            };
        });

        this.filteredStaffMembers = [...this.staffMembers];
        }
    }


    processAssignments(assignmentData) {
        // Process the assignment data and update staff role assignments
        const assignmentMap = {};
        
        assignmentData.forEach(assignment => {
            if (!assignmentMap[assignment.AssigneeId]) {
                assignmentMap[assignment.AssigneeId] = {};
            }
            assignmentMap[assignment.AssigneeId][assignment.PermissionSetId] = true;
        });

        // Update staff members with their role assignments
        this.staffMembers = this.staffMembers.map(staff => {
            const updatedStaff = { ...staff };
            const staffAssignments = assignmentMap[staff.Id] || {};
            
            // Update role assignments
            Object.keys(updatedStaff.roleAssignments).forEach(roleId => {
                updatedStaff.roleAssignments[roleId] = !!staffAssignments[roleId];
            });
            
            return updatedStaff;
        });

        this.isLoading = false;
    }

    // Create flattened data structure for template iteration
    get staffRoleData() {
        const flatData = [];
        
        this.staffMembers.forEach(staff => {
            this.roles.forEach(role => {
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

  
     get groupedStaffRoleData() {
        const staffList = this.filteredStaffMembers || [];

        if (!staffList || !this.roles || this.roles.length === 0 || !this.activeRoles) {
            console.log('Missing staffMembers, roles, or activeRoles.');
            return [];
        }

        const grouped = [];
        const activeRoleMap = {};
        const debugLogs = [];

        // Build map: staffId → Set of active roles
        if (Array.isArray(this.activeRoles)) {
            this.activeRoles.forEach(item => {
                activeRoleMap[item.staffId] = new Set(item.roles);
            });
        } else if (this.activeRoles?.staffId && Array.isArray(this.activeRoles.roles)) {
            activeRoleMap[this.activeRoles.staffId] = new Set(this.activeRoles.roles);
        }

        staffList.forEach((originalStaff) => {
            const activeRolesForStaff = activeRoleMap[originalStaff.Id] || new Set();

            const modified = this.modifiedStaffMap[originalStaff.Id];
           
            const staff = modified ? {...originalStaff, ...modified } : originalStaff;

            const roleList = originalStaff.Role__c
                ? originalStaff.Role__c.split(';').map(r => r.trim())
                : [];
            const assignedRoles = new Set(roleList);

            // 🟡 Log debug info per staff
            debugLogs.push({
                staffId: staff.Id,
                name: staff.Name,
                activeRoles: Array.from(activeRolesForStaff),
                modifiedRoles: staff.roleAssignments ? Object.entries(staff.roleAssignments).filter(([_, v]) => v).map(([k]) => k) : [],
                roleAssignments: staff.roleAssignments || {}
            });

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

                // ✅ Prioritize modified value if present
                let isChecked;
                if (staff.roleAssignments && staff.roleAssignments.hasOwnProperty(roleName)) {
                    isChecked = staff.roleAssignments[roleName];
                } else {
                    isChecked = activeRolesForStaff.has(roleName);
                }

                staffData.roleData.push({
                    roleId: roleName,
                    roleName,
                    hasRole: isChecked,
                    hasRoleinstaff: hasRoleInStaff
                });
            });

            grouped.push(staffData);
        });

        // ✅ Log full role comparison
    
       // console.log('✅ Final Grouped Data:', JSON.stringify(grouped, null, 2));
         console.log('📊 groupedStaffRoleData result length:', grouped.length);
         
        return grouped;
    } 

 
    handleSearchStaffInput(event) {
        this.searchStaff = event.target.value.toLowerCase();

        if (!this.searchStaff) {
            this.filteredStaffMembers = [...this.staffMembers];
        } else {
            this.filteredStaffMembers = this.staffMembers.filter(staff =>
                staff.Name.toLowerCase().includes(this.searchStaff)
            );
        }
    }

    modifiedStaffMap = {};

    handleRoleToggle(event) {
        const staffId = event.target.dataset.staffId;
        const roleId = event.target.dataset.roleId;
        const isChecked = event.target.checked;

        let changedStaff = null;

        this.staffMembers = this.staffMembers.map(staff => {
            if (staff.Id === staffId) {
                const updatedStaff = { ...staff };
                updatedStaff.roleAssignments = { ...staff.roleAssignments };
                updatedStaff.roleAssignments[roleId] = isChecked;
                changedStaff = updatedStaff;
                return updatedStaff;
            }
            return staff;
        });

        // ✅ Store multiple modified staff entries
        if (changedStaff) {
            this.modifiedStaffMap[staffId] = changedStaff;
        }

        console.log('🗂️ Modified Staff Map:', JSON.stringify(this.modifiedStaffMap));
    }


handleSectionToggle1(event) {
  const sectionId = event.currentTarget.dataset.id;
  const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);

  if (!this.sectionFlags1[sectionId]) {
      // First click: Set the section to true so it loads in the DOM
      this.sectionFlags1[sectionId] = true;
  } else {
      // From second click onwards: Just toggle the hidden-section class
      sectionElement.classList.toggle('hidden-section');
  }

  // Toggle the icon dynamically
//   this.sectionIcons1[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
  this.sectionIcons1[sectionId] =
    sectionElement.classList.contains('hidden-section')
      ? { ...ICON_LEFT }
      : { ...ICON_DOWN };
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
//   this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';

  this.sectionIcons[sectionId] =
    sectionElement.classList.contains('hidden-section')
      ? { ...ICON_LEFT }
      : { ...ICON_DOWN };
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

  backtoparticipant(event){
      localStorage.removeItem('activeAdminClientTab');
      console.log('LocalStorage cleared in CHILD.');
      const customEvent = new CustomEvent('myevent', {
            detail: { message: 'Hello from Child!' }
        });
        this.dispatchEvent(customEvent);
  }

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
              gridElement.style.visibility = 'hidden';
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
  handleOutsideClick(event) {
    const gridElement = this.template.querySelector('.grid');
    if (
        gridElement &&
        !gridElement.contains(event.target) && // Ensure click is outside the grid
        !event.target.closest('img') // Ensure click is not on the icon
    ) {
        if (gridElement.classList.contains('slide-in')) {
            // Slide out the header
            gridElement.classList.remove('slide-in');
            gridElement.classList.add('slide-out');
        }
    }
}

preventClose(event) {
    event.stopPropagation(); // Prevent triggering the outside click listener when clicking inside the grid
}

connectedCallback() {
    console.log('company flag',this.companyflag);
    console.log('company flag',this.individualflag);
    console.log('company flag',this.ndiscreateflag);
    console.log('recordId ', this.propertyValue);
    const storedFacilityId = localStorage.getItem('defaultFacilityId');
    this.dashboardstoredFacilityId = storedFacilityId;
    this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
    
    this.handleFacilityWise();

    this._handleOutsideClick = this.handleClickOutside.bind(this);
    //Manimala added 95-104
    organizationDetails().then(response => {    
        let orgRoles= response.listofPriceBook.Roles__c;
        //console.log('listofPriceBook:', response.listofPriceBook);
        //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
        //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;
        this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
        return {
        value: rec,
        label: rec
        };
        });
    }) 
    console.log(" participantId in connectedCallback:", this.participantId);
    this.clientId=this.participantId;
    // this.participantId = '';
    // setTimeout(() => {
    //     this.participantId=this.clientId;
    // }, 2000); 
   
    console.log(" clientId in connectedCallback:", this.clientId);
    console.log(" participantId after in connectedCallback:", this.participantId);
    //this.getStaffValues();    
    // This will trigger a refresh of the wired data.
    console.log('role 1 >>'+this.role);
    refreshApex(this.wiredStaffResult);
    document.addEventListener('click', this.handleOutsideClick.bind(this));
    document.body.style.overflowX = 'hidden';

    const activeTab = localStorage.getItem('activeAdminClientTab');
        this.detailsflag=false;
        this.addressflag=false;
        this.identificationflag=false;
        this.insuranceflag=false;
        this.primaryflag=false;
        this.secondaryflag=false;
        this.detailseditflag=false;
        this.addresseditflag=false;
        this.identificationeditflag=false;
        this.insuranceeditflag=false;
        this.primaryeditflag=false;
        this.secondaryeditflag=false;
        this.participantflag = false;
        this.participanteditflag=false;
        this.editButtom = true;
        this.editandBackButton = true;
    switch (activeTab) {
        case 'clientDetails':
        this.detailsflag = true;
        break;
        case 'clientAddress':
        this.addressflag = true;
        break;
        case 'clientIdentification':
        this.identificationflag = true;
        break;
        case 'clientInsurance':
        this.insuranceflag = true;
        break;
        case 'clientPrimary':
        this.primaryflag = true;
        break;
        case 'clientParticipant':
        this.participantflag = true;
        this.fetchRolesForStaff();
        break;
        case 'clientSecondary':
        this.secondaryflag = true;
        break;
        default:
        this.detailsflag = true;
    }

        // Add a placeholder option and reset initial Nationality
        this.filteredOptions = [
            { label: '-- Select Nationality --', value: '' },
            ...this.allNationalities.map(n => ({ label: n, value: n }))
        ];
        this.Nationality = ''; // ✅ ensures no default value

        this.Languages = this.LANGUAGE_OPTIONS.map(lang => ({
            id: lang,
            label: lang,
            checked: false,
            buttonClass: 'option-button',
            badgeClass: 'status-badge inactive',
            statusText: 'Inactive'
        }));

        console.log('Languages>>', this.Languages);
      setTimeout(() => {
        refreshApex(this.wiredClientResult);
    }, 0);
}

handleFacilityWise(){
    console.log('inside facility filter');
    getCurrentLoggedUserInfo().then((userData) => {
    let userTpe = userData.User_Type__c;
    console.log("user data ==>" + JSON.stringify(userData));

    getFacilityData().then((facresponse) => {
        console.log("Facility data fetched successfully:", facresponse);

        this.finalListFacilities = [];
        this.selectedFacilities = [];

        this.facilityOptions = facresponse.map((record) => ({
            label: record.Name,
            value: record.Id
        }));

        if (userTpe == "NDIS Org Admin" || userTpe == "ICT Admin") {
            this.finalListFacilities = this.facilityOptions;

            console.log('ndiscreateflag...', this.ndiscreateflag);
            console.log('companyflag...', this.companyflag);
            console.log('individualflag...', this.individualflag);

            if (this.ndiscreateflag) {
                this.industryWiseFacility = facresponse
                    .filter(record => record.Type_of_Service__c === 'NDIS')
                    .map(record => ({
                        label: record.Name,
                        value: record.Id
                    }));
            } else {
                this.industryWiseFacility = facresponse
                    .filter(record => record.Type_of_Service__c === 'Nursing')
                    .map(record => ({
                        label: record.Name,
                        value: record.Id
                    }));
            }
        }
    });
});

}

  handleFacilityChange(event) {
    //  console.log('facility onchange '+(event.target)) ;
    this.facilityId = event.target.value; // Capture Facility ID
    //this.getStaffValues(); // Fetch staff based on the new facility
    refreshApex(this.wiredStaffResult);
    console.log("Selected facility >> " + this.facilityId);
  }

disconnectedCallback() {
        window.removeEventListener('click', this._handleOutsideClick);
    }

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
    get ContactNumberClass() {
        return this.getFieldClass('Contact_Number__c');
    }


@track noimage;
@wire(getClientById, { recordId: '$participantId' })
wiredClient(result) {
    console.log("🔵 [wiredClient] Fired");
    console.log(" participantId in wire:", this.participantId);
    this.wiredClientResult = result;

    const { data, error } = result;

    if (data) {
        console.log("🟢 [wiredClient] Data received:");
        console.log(JSON.stringify(data));

        this.clientData = data;

        // ------------------------------------
        // CLIENT BASIC FIELDS
        // ------------------------------------
        console.log("📌 Extracting client fields...");
        const client = this.clientData[0];
        const typeofservice = client.Facility__r?.Type_of_Service__c;

        this.agedCareFlag = (typeofservice === 'Aged Care');

        this.image = client.Picture__c;
        this.noimage = !client.Picture__c;

        this.city = client.Address__City__s;
        this.country = client.Address__CountryCode__s;
        this.province = client.Address__StateCode__s;
        this.postalcode = client.Address__PostalCode__s;
        this.street1 = client.Address__Street__s;

        this.lastName = client.Last_Name__c;
        this.firstName = client.First_Name__c;
        this.clientId = client.Id;
        this.clientName = client.Name;
        this.orgId = client.Organization_Name__c;
        this.facilityId = client.Facility__c;
        this.preferredGender=client.Preferred_Gender__c;

        this.toggleValue = client.Status__c;
        this.Nationality = client.Preferred_Nationality__c;
        this.selectedLangs = client.Preferred_Languages__c;
        this.isMedicareEntered = !!client.Medicare_Card_ID__c && client.Medicare_Card_ID__c.trim() !== '';
        
        console.log("🏷 First Name:", this.firstName);
        console.log("🏷 Last Name:", this.lastName);
        console.log("📍 Address:", this.street1, this.city, this.province, this.postalcode);
        console.log("🌍 Nationality:", this.Nationality);
        console.log("🗣 Languages:", this.selectedLangs);
        console.log("🏢 Organization:", this.orgId);
        console.log("🏫 Facility:", this.facilityId);
        console.log(" toggleValue:", this.toggleValue);

        this.refreshValues();

        // ------------------------------------
        // STAFF ROLE
        // ------------------------------------
        if (client.Participant_Staff_Associations__r && client.Participant_Staff_Associations__r.length > 0) {
            this.role = client.Participant_Staff_Associations__r[0].Role__c;
            console.log("🧑‍💼 Role from associations:", this.role);
        } else {
            this.role = '';
            console.log("⚠️ No staff role assigned.");
        }

        // ------------------------------------
        // CONTACT LIST
        // ------------------------------------
        console.log("📞 Mapping Contact List...");

        if (client.Participant_Contacts__r) {
            this.contactList1 = client.Participant_Contacts__r.map(c => ({
                id: c.Id,
                firstName: c.First_Name__c || '',
                lastName: c.Last_Name__c || '',
                contactNumber: c.Contact_Number__c || '',
                email: c.Email__c || '',
                contactType: c.Contact_Type__c || '',
                notify: c.Notify__c || false
            }));
        } else {
            this.contactList1 = [];
            console.warn("⚠️ No Participant Contacts found.");
        }
        
        //   if (client.Participant_Facilities__r) {
        //     this.selctedMultipleFcailityValues = client.Participant_Facilities__r.map(f => f.Facility__c)
        //                 .filter(Boolean);
        //         this.fetchMultiFaciltyOptions();  
                
        //          this.activeFaciltyDisplay= client.Participant_Facilities__r.map(f => f.Facility__r?.Name)
        //                 .filter(Boolean)
        //                 .join(', ')

        // } else {
        //      this.selctedMultipleFcailityValues = [];
           
        // }

        if (client.Participant_Facilities__r && client.Participant_Facilities__r.length > 0) {
            this.selctedMultipleFcailityValues = client.Participant_Facilities__r
                .map(f => f.Facility__c)
                .filter(Boolean);

            this.activeFaciltyDisplay = client.Participant_Facilities__r
                .map(f => f.Facility__r?.Name)
                .filter(Boolean)
                .join(', ');

            console.log('🏫 Selected Facility Ids:', JSON.stringify(this.selctedMultipleFcailityValues));
            console.log('🏫 Display Facility Names:', this.activeFaciltyDisplay);

            this.fetchMultiFaciltyOptions();
        } else {
            this.selctedMultipleFcailityValues = [];
            this.activeFaciltyDisplay = '';
            this.multiFacilityDroDownList = [];
        }

    

        console.log("📞 Final Contact List:", JSON.stringify(this.contactList1));

        // ------------------------------------
        // CONTACT TYPE OPTIONS
        // ------------------------------------
        console.log("⚙️ Building Contact Type Options...");

       let baseOptions = [
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
           // { label: 'Add New', value: 'Add New Contact Type' }
        ];

        const addNewOption = { label: 'Add New', value: 'Add New Contact Type' };

        let backendTypes = new Set(
            this.contactList1.filter(c => c.contactType).map(c => c.contactType)
        );

        console.log("📦 Backend Types:", [...backendTypes]);

        backendTypes.forEach(type => {
            if (!baseOptions.some(opt => opt.value === type)) {
                baseOptions.push({ label: type, value: type });
            }
        });

        baseOptions.push(addNewOption);

        this.contactTypeOptions = baseOptions;
        //this.contactList = this.contactList1;
        this.contactList = this.contactList1.map((c, index, arr) => {
        const isLast = index === arr.length - 1;
        const isPrimary = c.contactType === 'Primary';
        const isGuardian = c.contactType === 'Guardian';

        return {
            ...c,

            // ✅ THIS IS THE IMPORTANT LINE
            showCreateUserIcon: isGuardian,

            // Placeholders
            firstNamePlaceholder: isPrimary ? '* Enter Name' : 'Enter Name',
            lastNamePlaceholder: isPrimary ? '* Enter Name' : 'Enter Name',
            phonePlaceholder: isPrimary ? '* Enter Number' : 'Enter Number',
            emailPlaceholder: isPrimary ? '* Enter Email' : 'Enter Email',

            // + button logic
            showAdd: isLast,
            addButtonClass: isLast ? 'add-visible' : 'add-hidden'
        };
    });

        console.log("🏁 Final Contact Type Options:", JSON.stringify(this.contactTypeOptions));

        console.log("🟩 [wiredClient] Completed successfully");

        this.loadContactAttachmentCounts();

        /* ------------------------------------
        CHECK GUARDIAN USER STATUS
        ------------------------------------ */

        this.contactList.forEach((con, index) => {

            if (con.contactType === 'Guardian' && con.email) {

                console.log('🔍 Checking Guardian User:', con.email);

                isGuardianUserActive({ email: con.email })
                    .then(isActive => {

                        console.log('✅ User Active Status:', isActive);

                        // Update row properly
                        const updatedList = [...this.contactList];
                        updatedList[index] = {
                            ...updatedList[index],
                            isDisabled: isActive   // 🔥 THIS CONTROLS YOUR UI
                        };

                        this.contactList = updatedList;

                        console.log('📞 Updated Contact List:', JSON.stringify(this.contactList));

                    })
                    .catch(error => {
                        console.error('❌ Error checking Guardian User status', error);
                    });

            }
        });

        console.log("📞 Final Contact List:", JSON.stringify(this.contactList));

    } else if (error) {
        console.error("❌ [wiredClient] Error:");
        console.error(JSON.stringify(error));
        this.handleError(error);
    }
}

//  fetchMultiFaciltyOptions(){
//           getFacilityData().then(facResponse => {
//             let orginalFacValues=facResponse
           
//                if (this.clientData[0].Type_of_Participant__c == 'NDIS') {
             
//                 orginalFacValues = orginalFacValues.filter(
//                     fac => fac.Type_of_Service__c === 'NDIS'
//                 );
//                 } else if (this.clientData[0].Type_of_Participant__c !== 'NDIS') {
//                   orginalFacValues = orginalFacValues.filter(
//                         fac => fac.Type_of_Service__c !== 'NDIS'
//                     );
//                 }else{
//                     orginalFacValues = orginalFacValues
//        }
            
//               console.log('this.selctedMultipleFcailityValues  '+this.selctedMultipleFcailityValues)    
//                 // Build enhanced option objects (with toggle + badge)
//                 this.multiFacilityDroDownList = orginalFacValues.map((fac, index) => {
//                     const isActive = this.selctedMultipleFcailityValues.includes(fac.Id);
//                     //const isActive = true;
//                     return {
//                         id: index.toString(),
//                         label: fac.Name,
//                         value: fac.Id,
//                         checked: isActive,
//                         isActive: isActive, //  Added to match new structure
//                         statusText: isActive ? 'Active' : 'Inactive',     
//                         badgeClass: this.getBadgeClass(isActive), // Updated to use method
//                         buttonClass: this.getOptionButtonClass(isActive), // Updated to use method
//                         isDisabled: !isActive // Updated logic to match new structure
//                     };
//                 });
//                      console.log('all fac response ==>'+JSON.stringify(this.multiFacilityDroDownList));
//          })
//     }


// fetchMultiFaciltyOptions() {
//     console.log('facilityOptionsFromParent=>'+JSON.stringify(this.facilityOptionsFromParent));
//     getFacilityData()
//         .then(facResponse => {
//             let orginalFacValues = facResponse || [];

//             if (this.clientData?.[0]?.Type_of_Participant__c === 'NDIS') {
//                 orginalFacValues = orginalFacValues.filter(
//                     fac => fac.Type_of_Service__c === 'NDIS'
//                 );
//             } else if (this.clientData?.[0]?.Type_of_Participant__c !== 'NDIS') {
//                 orginalFacValues = orginalFacValues.filter(
//                     fac => fac.Type_of_Service__c !== 'NDIS'
//                 );
//             }
//                         // ✅ ADD THIS BLOCK HERE
//             const parentFacilityIds = (this.facilityOptionsFromParent || []).map(f => f.value);

//             orginalFacValues = orginalFacValues.filter(fac =>
//                 parentFacilityIds.includes(fac.Id)
//             );

//             console.log('this.selctedMultipleFcailityValues =>', JSON.stringify(this.selctedMultipleFcailityValues));

//             this.multiFacilityDroDownList = orginalFacValues.map((fac, index) => {
//                 const isSelected = this.selctedMultipleFcailityValues.includes(fac.Id);

//                 return {
//                     id: index.toString(),
//                     label: fac.Name,
//                     value: fac.Id,
//                     checked: true,
//                     isActive: true,
//                     statusText: 'Active',
//                     badgeClass: this.getBadgeClass(true),
//                     buttonClass: this.getOptionButtonClass(true),
//                     isDisabled: false,
//                     Type_of_Service__c: fac.Type_of_Service__c
//                 };
//             });

//             // keep display synced for edit mode
//             this.activeFaciltyDisplay = this.multiFacilityDroDownList
//                 .filter(f => this.selctedMultipleFcailityValues.includes(f.value))
//                 .map(f => f.label)
//                 .join(', ');

//             console.log('all fac response ==>' + JSON.stringify(this.multiFacilityDroDownList));
//             console.log('activeFaciltyDisplay ==>' + this.activeFaciltyDisplay);
//         })
//         .catch(error => {
//             console.error('Error in fetchMultiFaciltyOptions:', error);
//         });
// }


fetchMultiFaciltyOptions() {
    console.log('facilityOptionsFromParent =>', JSON.stringify(this.facilityOptionsFromParent));

    getFacilityData()
        .then(facResponse => {

            let orginalFacValues = facResponse || [];

            const participantType = this.clientData?.[0]?.Type_of_Participant__c;

            console.log('participantType =>', participantType);

            // ✅ FILTER BASED ON PARTICIPANT TYPE
            if (participantType === 'NDIS') {

                orginalFacValues = orginalFacValues.filter(
                    fac => fac.Type_of_Service__c === 'NDIS'
                );

            } else if (participantType === 'Aged Care') {

                orginalFacValues = orginalFacValues.filter(
                    fac => fac.Type_of_Service__c === 'Aged Care'
                );

            } else if (participantType === 'Nursing') {

            // ✅ NURSING + TRANSPORT + CHILD CARE
            orginalFacValues = orginalFacValues.filter(fac => {

                const serviceType = fac.Type_of_Service__c;

                return (
                    serviceType === 'Nursing' ||
                    serviceType === 'Transport' ||
                    serviceType === 'Child Care'
                );
            });

        } else {

                // Optional fallback
                orginalFacValues = orginalFacValues.filter(
                    fac =>
                        fac.Type_of_Service__c !== 'NDIS' &&
                        fac.Type_of_Service__c !== 'Aged Care'
                );
            }

            // ✅ FILTER USING PARENT FACILITIES
            const parentFacilityIds =
                (this.facilityOptionsFromParent || []).map(f => f.value);

            orginalFacValues = orginalFacValues.filter(fac =>
                parentFacilityIds.includes(fac.Id)
            );

            console.log(
                'this.selctedMultipleFcailityValues =>',
                JSON.stringify(this.selctedMultipleFcailityValues)
            );

            // ✅ BUILD DROPDOWN
            this.multiFacilityDroDownList = orginalFacValues.map((fac, index) => {

                const isSelected =
                    this.selctedMultipleFcailityValues.includes(fac.Id);

                return {
                    id: index.toString(),
                    label: fac.Name,
                    value: fac.Id,
                    checked: isSelected,
                    isActive: true,
                    statusText: 'Active',
                    badgeClass: this.getBadgeClass(true),
                    buttonClass: this.getOptionButtonClass(true),
                    isDisabled: false,
                    Type_of_Service__c: fac.Type_of_Service__c
                };
            });

            // ✅ DISPLAY SELECTED FACILITIES
            this.activeFaciltyDisplay = this.multiFacilityDroDownList
                .filter(f =>
                    this.selctedMultipleFcailityValues.includes(f.value)
                )
                .map(f => f.label)
                .join(', ');

            console.log(
                'all fac response ==>',
                JSON.stringify(this.multiFacilityDroDownList)
            );

            console.log(
                'activeFaciltyDisplay ==>',
                this.activeFaciltyDisplay
            );
        })
        .catch(error => {
            console.error('Error in fetchMultiFacaltyOptions:', error);
        });
}

    @track toggleflag = false;
    handleStatus(event) {
        this.previousToggleValue = this.toggleValue;
        console.log('previousToggleValue'+this.previousToggleValue);
        this.toggleflag = true;
                
        //this.toggleValue = event.target.checked; 
        const newValue = event.target.checked;
        console.log('Toggle status:', newValue);
        if (newValue === false && this.clientId) {
            event.target.checked = true;
            this.checkServicesAndProceed();
            console.log('  this.toggleValue in checkFutureServices after: ',this.toggleValue);
            console.log('   event.target.checked in checkFutureServices after : ',  event.target.checked);
        }else {
            this.toggleValue = newValue;
            console.log(' this.toggleValue in else : ', this.toggleValue);
            console.log('   event.target.checked else : ',  event.target.checked);
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
        //   const isNdis = !this.individualflag && !this.companyflag;
        if (this.contactList.length === 1) {
            this.showToast('Error', 'At least one row is required. ', 'error');
            return;
        }
        const index = event.target.dataset.index;
        const contactId = this.contactList[index]?.id;

        console.log('Deleting Contact Id:', contactId);
        if (contactId) {
            this.deletedContactIds.push(contactId);
            console.log('Marked for delete:', contactId);
        }
        this.contactList.splice(index, 1);
        this.contactList = [...this.contactList];
        this.updateAddButtonVisibility();
    
    }

    handleContactsChange(event) {
        const index = event.target.dataset.index;
        const field = event.target.name;

        let value;
        if (event.target.type === "checkbox") {
            value = event.target.checked;
        } else {
            value = event.target.value;
        }

        // 🔹 Handle "Add New Contact Type"
        if (field === 'contactType' && value === 'Add New Contact Type') {

            this.activeContactRowIndex = index;
            this.previousContactType = this.contactList[index].contactType;

            //this.contactList[index].contactType = this.previousContactType || '';
             this.contactList[index].contactType = '';
            this.contactList = [...this.contactList];

            this.showContactTypeModal = true;
            return;
        }

        // 🔹 Update field value
        this.contactList[index][field] = value;

        // ✅ ADD THIS BLOCK (ICON VISIBILITY LOGIC)
        if (field === 'contactType') {
            this.contactList[index].showCreateUserIcon = (value === 'Guardian');
        }

        // 🔹 Notify validation
        if (field === 'notify' && value === true && !this.contactList[index].email) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Email Required',
                    message: `Email is required when Notify is selected ( Contact Row ${index + 1}).`,
                    variant: 'error'
                })
            );
        }

        // 🔹 Mandatory field logic for Primary
        const isMandatory =  this.contactList[index].contactType === 'Primary' || this.contactList[index].contactType === 'Guardian';

        this.contactList[index].firstNamePlaceholder =
            isMandatory ? '* Enter Name' : 'Enter Name';

        this.contactList[index].lastNamePlaceholder =
            isMandatory ? '* Enter Name' : 'Enter Name';

        this.contactList[index].phonePlaceholder =
            isMandatory ? '* Enter Number' : 'Enter Number';

        this.contactList[index].emailPlaceholder =
            isMandatory ? '* Enter Email' : 'Enter Email';

        this.contactList = [...this.contactList];

        console.log("this.contactList : " + JSON.stringify(this.contactList));
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

    deleteCustomContactType(event) {
        const value = event.currentTarget.dataset.value;

        this.customContactTypes =
            this.customContactTypes.filter(t => t.value !== value);

        this.contactTypeOptions =
            this.contactTypeOptions.filter(o => o.value !== value);
    }
    // closeContactTypeModal() {
    //     // this.contactList[this.activeContactRowIndex].contactType =
    //     //     this.previousContactType || '';
    //     this.contactList[this.activeContactRowIndex].contactType = '';
    //     this.contactList = [...this.contactList];

    //     this.resetContactTypeModal();
    // }
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

    // stageDeleteContactType(event) {
    //     const value = event.currentTarget.dataset.value;

    //     // ❌ do NOT stage delete if used
    //     if (this.isContactTypeUsed(value)) {
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Cannot Delete',
    //                 message: `"${value}" is currently used in contact rows.`,
    //                 variant: 'warning'
    //             })
    //         );
    //         return;
    //     }

    //     if (!this.stagedDeleteTypes.includes(value)) {
    //         this.stagedDeleteTypes = [...this.stagedDeleteTypes, value];
    //     }
    // }

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
        this.activeContactRowIndex = undefined;
        this.previousContactType = undefined;
        this.stagedDeleteTypes = [];
        console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
        this.contactList = [...this.contactList];
        console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
    }

    // saveNewContactType(event) {
    //     const index = event.target.dataset.index;
    //     const newType = this.contactList[index].newContactTypeValue;

    //     if (!newType) return;

    //     // 1️⃣ Add new type to options
    //     this.contactTypeOptions = [
    //         ...this.contactTypeOptions.filter(opt => opt.value !== "Add New Contact Type"),
    //         { label: newType, value: newType },
    //         { label: "Add New", value: "Add New Contact Type" }
    //     ];

    //     // 2️⃣ Set this row to new type
    //     this.contactList[index].contactType = newType;

    //     this.contactList[index].newContactTypeValue = "";

    //     // 3️⃣ Close textbox UI
    //     this.contactList[index].showNewTypeInput = false;

    //     this.contactList = [...this.contactList];

    //     // 4️⃣ Re-open combobox (simulated)
    //     setTimeout(() => {
    //         const combo = this.template.querySelector(
    //             `lightning-combobox[data-index="${index}"]`
    //         );
    //         if (combo) {
    //             combo.focus();       // focus on the combobox
    //             combo.click();       // simulate click to open dropdown
    //         }
    //     }, 50);
    // }

    // cancelNewContactType(event) {
    //     const index = event.target.dataset.index;
    //     this.contactList[index].newContactTypeValue = '';
    //     this.contactList[index].showNewTypeInput = false;
    //     this.contactList = [...this.contactList];
    // }

    handleSubmit(event){
        //  console.log('in submit');
        const fields = event.detail.fields;
        event.preventDefault();// stop the form from submitting
        if (!this.facilityId) {
            console.error('Staff Facility is required.');
            // Optionally show a toast or error message on UI
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select a Facility before submitting.',
                    variant: 'error',
                })
            );
            return; // exit the method early
        }

        console.log( 'contactList after trimming empty rows >>', JSON.stringify(this.contactList) );
        
        console.log('this.individualflag >>>>>>', this.individualflag);
        console.log('this.companyflag >>>>>>', this.companyflag);

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
        // 2️⃣ Find all Primary contacts
        const primaryContacts = this.contactList.filter( (con) => con.contactType === "Primary" );

        const guardianContacts = this.contactList.filter( (con) => con.contactType === "Guardian" );
        
        // 4️⃣ Validate ONLY the Primary row(s) 
        for (let i = 0; i < primaryContacts.length; i++) {
            let c = primaryContacts[i];

            if (!c.firstName || !c.lastName || !c.contactNumber || !c.email) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Missing Required Fields',
                        message: 'All fields are required for the Primary contact.',
                        variant: 'error'
                    })
                );
                return;
            }
        }

        // 🔹 Validate Guardian Contacts
        for (let i = 0; i < guardianContacts.length; i++) {
            let c = guardianContacts[i];

            if (!c.firstName || !c.lastName || !c.contactNumber || !c.email) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Missing Required Fields',
                        message: 'All fields are required for the Guardian contact.',
                        variant: 'error'
                    })
                );
                return;
            }
        }
        //if (!this.individualflag && !this.companyflag) {
            

        // 3️⃣ At least ONE Primary required
        /* if (primaryContacts.length === 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Primary Contact Required',
                    message: 'Please select at least one Primary contact.',
                    variant: 'error'
                })
            );
            return;
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
        
        // alert(JSON.stringify(fields));
        fields.Address__Street__s = this.street1;
        fields.Address__City__s =  this.city;
        fields.Address__StateCode__s = this.province;
        fields.Address__CountryCode__s = 'AU';
        fields.Address__PostalCode__s = this.postalcode;
        // fields.Pre_Tax_Calculator__c = this.preTaxForSubmit;
        fields.Facility__c=this.facilityId;
        fields.Name = this.fullName;
        fields.Status__c = this.toggleValue;
        fields.Preferred_Nationality__c = this.Nationality;
        fields.Preferred_Languages__c =  this.selectedLangs;
        fields.Preferred_Gender__c = this.preferredGender;
        console.log('Participant Name >'+fields.Name);
        console.log('After fields>>'+JSON.stringify(fields));
        const fullAddress = `${this.street}, ${this.city} ${this.postalcode}, AU`;
            const apiKey = GOOGLE_API_KEY;
            console.log('Fetching geocode for:', fullAddress);
            
            const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
        
            console.log('Fetching geocode for:', fullAddress);
        
            fetch(endpoint)
                .then(response => response.json())
                .then(data => {
                    console.log('Geocode API response:', data);
        
                    if (data.status === 'OK' && data.results.length > 0) {
                        const location = data.results[0].geometry.location;
                        fields.Location__Latitude__s = location.lat;
                        fields.Location__Longitude__s = location.lng;
        
                        console.log('Parsed coordinates:', location.lat, location.lng);
                    } else {
                        console.warn('No geocode results found or status not OK');
                    }
        
                    // 🚀 Submit the form AFTER geocode response
                    this.template.querySelector('lightning-record-edit-form').submit(fields);
                })
                .catch(error => {
                    console.error('Error calling Geocode API:', error);
                    // Submit form even if geocode failed
                    this.template.querySelector('lightning-record-edit-form').submit(fields);
                });
        
    }

    async handleSuccess(event) {
        try {
            // -------------------------------
            // SUCCESS TOAST
            // -------------------------------
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Success",
                    message: "Changes Saved Successfully",
                    variant: "success"
                })
            );

            this.toggleflag = false;
            this.handleflag();
            refreshApex(this.wiredClientResult);

            let staffRecID = event.detail.id;
            console.log("filelength " + this.fileName?.length);

            // -------------------------------
            // 1️⃣ FILE UPLOAD (if exists)
            // -------------------------------
            if (this.fileName && this.fileName.length > 0) {
                try {
                    await uploadFile({
                        base64: JSON.stringify(this.base64FileData),
                        filename: this.fileName,
                        recordId: staffRecID,
                        obj: "client"
                    });

                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Success!!",
                            message: `${this.file.name} - Uploaded Successfully!!!`,
                            variant: "success"
                        })
                    );
                } catch (uploadErr) {
                    console.error("❌ File upload error:", uploadErr);
                }
            }

            // -------------------------------
            // 2️⃣ SAFE CONTACT UPDATE
            // -------------------------------
            let safeContactPayload =
                Array.isArray(this.contactList) && this.contactList.length > 0
                    ? JSON.stringify(this.contactList)
                    : null;

            if (safeContactPayload) {
                try {
                    await updateParticipantContacts({
                        clientId: staffRecID,
                        contactData: safeContactPayload
                    });
                } catch (contactError) {
                    console.error("❌ Contacts update error:", contactError);
                    return; // stop further processing
                }
            } else {
                console.warn("⚠️ No contacts to update — skipping updateParticipantContacts()");
            }
                
                        const payload = {
                                participantId: staffRecID,
                                selectedFacilityIds: this.selctedMultipleFcailityValues
                        }
                            console.log("✅ ppayload  Before  save ."+JSON.stringify(payload));
                    const participantFacilityResult=await upsertParticipantFacilities({
                                    wrapperJson: JSON.stringify(payload)
                        })
                console.log("✅ participantFacilityResult updated."+JSON.stringify(participantFacilityResult));

            // -------------------------------
            // 3️⃣ INSERT STAFF RECORDS
            // -------------------------------
            try {
                await insertStaffRecords({
                    clientId: staffRecID,
                    roleId: this.role,
                    selectedStaff: this.staffName
                });

                this.participanteditflag = false;
                refreshApex(this.wiredStaffResult);
                this.selectedRoles = this.staffName;

            } catch (staffErr) {
                console.error("❌ Error inserting staff record:", staffErr);
            }

            if (this.deletedContactIds && this.deletedContactIds.length > 0) {
                console.log('Deleting contacts list: ', JSON.stringify(this.deletedContactIds));
                
                deleteContacts({ contactIds: this.deletedContactIds })
                    .then(() => {
                        console.log('Deleted contacts:', this.deletedContactIds);
                        this.deletedContactIds = []; // clear after success
                    })
                    .catch(error => {
                        this.showToast(
                            'Error',
                            error.body?.message || 'Failed to delete contacts',
                            'error'
                        );
                    });
            }

            // -------------------------------
            // 4️⃣ FINAL REFRESH AFTER DELAY
            // -------------------------------
            setTimeout(() => {
                refreshApex(this.wiredClientResult);
            }, 2000);

        } catch (err) {
            console.error("❌ Unexpected handleSuccess error:", err);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Unexpected Error",
                    message: err.body?.message || "Unknown error occurred",
                    variant: "error"
                })
            );
        }
      this.createCurrentStep='createstep1';
        
    }

    checkServicesAndProceed() {
        console.log('this.clientId in checkServicesAndProceed : ', this.clientId);
         checkFutureServices({ clientId: this.clientId })
            .then(services => {
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
                    this.hasFutureShifts = true;
                    this.toggleValue = true;
                    console.log('  this.toggleValue in checkFutureServices : ',this.toggleValue);
                    
                    //return;

                } else {
                     this.toggleValue = false;
                    console.log('  this.toggleValue in checkFutureServices else : ',this.toggleValue);
                }

                    })
            .catch(error => {
                console.error('Error:', error);
            });

    }
    handleFutureShiftClose(){
        
        this.hasFutureShifts=false;  
    }

  addressInputChange(event) {
    const address = event.detail;
    console.log('address'+JSON.stringify(address));
    if (!address.street || !address.city || !address.postalCode || !address.province) {
    this.errorMessage = 'Please provide complete address information.';
    this.saveButtonDisable = true;
    }
    else{
      this.errorMessage = '';
      this.saveButtonDisable = false;
      //  console.log('event detail'+JSON.stringify(event.detail)); 
      this.street1=event.detail.street;
      
      this.city=event.detail.city;
      this.postalcode=event.detail.postalCode;
      this.province=event.detail.province;
      this.country=event.detail.country;
    }
  }
  @track previousToggleValue;
  handleflag(){
      if (this.detailseditflag) {
        this.detailseditflag = false; 
        this.detailsflag = true;      
      } else if (this.addresseditflag) {
          this.addresseditflag = false; 
          this.addressflag = true; 
      } else if (this.identificationeditflag) {
          this.identificationeditflag = false; 
          this.identificationflag = true; 
      } else if (this.insuranceeditflag) {
          this.insuranceeditflag = false; 
          this.insuranceflag = true; 
      } else if (this.primaryeditflag) {
          this.primaryeditflag = false; 
          this.primaryflag = true; 
      } else if (this.secondaryeditflag) {
          this.secondaryeditflag = false; 
          this.secondaryflag = true; 
      } else if (this.participanteditflag) {
        this.participanteditflag = false;
        this.editButtom = true; 
        this.participantflag = true;
        this.editandBackButton = true; 
    }
      
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
            title: 'Update Failed',
            message: message,
            variant: 'error',
            
        })
    );
}
  handleeditClose(event){
    this.searchStaff = '';
    if(this.toggleflag)
    {
     this.toggleValue = this.previousToggleValue;
     console.log('toggleflag'+this.toggleflag);
     console.log('Toggle status INSIDE IF:', this.toggleValue);
    }
     console.log('Toggle status OUTSIDE IF:', this.toggleValue);
    this.toggleflag = false;
    if (
        !this.contactList ||
        this.contactList.length === 0 ||
        (
            this.contactList[0].firstName === '' &&
            this.contactList[0].lastName === '' &&
            this.contactList[0].contactNumber === '' &&
            this.contactList[0].email === ''
        )
    ) {
        this.contactList = [
            {
                id: Date.now(),
                firstName: '',
                lastName: '',
                contactNumber: '',
                email: '',
                contactType: '',
                notify: false,

                // Mandatory placeholders
                firstNamePlaceholder: 'Enter Name',
                lastNamePlaceholder: 'Enter Name',
                phonePlaceholder: 'Enter Number',
                emailPlaceholder: 'Enter Email',

                showAdd: true,
                addButtonClass: 'add-visible'
            }
        ];
    }
    this.handleflag();
   
     if (this.participanteditflag) {
        // ✅ Revert all edited data
        this.staffMembers = this.originalStaffMembers.map(staff => ({
            ...staff,
            roleAssignments: { ...staff.roleAssignments }
        }));

        this.filteredStaffMembers = [...this.staffMembers];

        this.modifiedStaffMap = {}; // ✅ Clear unsaved changes

        // ✅ Reset edit UI
        this.participanteditflag = false;
        this.editandBackButton = true;
        this.editButtom = true;

        console.log('🔄 Participant edit cancelled – data reverted.');
    }

    this.activeFaciltyDisplay = this.multiFacilityDroDownList
    .filter(f => this.selctedMultipleFcailityValues.includes(f.value))
    .map(f => f.label)
    .join(', ');
    this.selectedRoles =[];
    
  }
  
  triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
  }

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
];
@track preferredGender;
  handledetails(event){
    this.detailsflag=true;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
    localStorage.setItem('activeAdminClientTab', 'clientDetails');
  }
  handleaddress(event){
    this.detailsflag=false;
    this.addressflag=true;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
    localStorage.setItem('activeAdminClientTab', 'clientAddress');
  }
  handleidentification(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=true;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
     localStorage.setItem('activeAdminClientTab', 'clientIdentification');
  }
  handleinsurance(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=true;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
     localStorage.setItem('activeAdminClientTab', 'clientInsurance');
  }
  handleprimary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=true;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
     localStorage.setItem('activeAdminClientTab', 'clientPrimary');
  }
   
  handleParticipant(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = true;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
    //this.getStaffValues();
    console.log('role 3 >>'+this.role);
    //refreshApex(this.wiredStaffResult);
     localStorage.setItem('activeAdminClientTab', 'clientParticipant');
      this.fetchRolesForStaff();
  }
  handlesecondary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=true;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.editButtom = true;
    this.editandBackButton = true;
     localStorage.setItem('activeAdminClientTab', 'clientSecondary');
  }
  
  async handleeditdetails() {
    this.createCurrentStep = 'createstep1';
    
    console.log('handleeditdetails');
    if (this.detailsflag) {
        this.detailseditflag = true;
         
        console.log('contactList.length', this.contactList.length);
        if (!this.contactList || this.contactList.length === 0) {
            console.log('No contacts found. Adding a new contact...');
             if (!this.contactList || this.contactList.length === 0) {
                this.contactList = [
                    {
                        id: Date.now(),
                        firstName: '',
                        lastName: '',
                        contactNumber: '',
                        email: '',
                        contactType: '',
                        notify: false,

                        // Mandatory placeholders
                        firstNamePlaceholder: 'Enter Name',
                        lastNamePlaceholder: 'Enter Name',
                        phonePlaceholder: 'Enter Number',
                        emailPlaceholder: 'Enter Email',

                        showAdd: true,
                        addButtonClass: 'add-visible'
                    }
                ];
            }
        }
    } else if (this.addressflag) {
        this.addresseditflag = true;
    } else if (this.identificationflag) {
        this.identificationeditflag = true;
    } else if (this.insuranceflag) {
        this.insuranceeditflag = true;
    } else if (this.primaryflag) {
        this.primaryeditflag = true;
    } else if (this.secondaryflag) {
        this.secondaryeditflag = true;
    } else if (this.participantflag) {
        this.showSpinner = true;
        this.participanteditflag = true;
        this.participantflag = false;
        this.editandBackButton = false;
        this.editButtom = false;

        this.modifiedStaffMap = {};
        this.searchStaff = '';
        // this.originalStaffMembers = JSON.parse(JSON.stringify(this.staffMembers));
        // this.originalModifiedStaffMap = JSON.parse(JSON.stringify(this.modifiedStaffMap));
       this.originalStaffMembers = this.staffMembers.map(staff => ({
            ...staff,
            roleAssignments: { ...staff.roleAssignments }
        }));

        this.originalModifiedStaffMap = Object.fromEntries(
            Object.entries(this.modifiedStaffMap).map(([key, staff]) => [
                key,
                { ...staff, roleAssignments: { ...staff.roleAssignments } }
            ])
        );
       
            try {
                // 🔁 Force data load in sequence
                await this.fetchRoles();
                await this.fetchRolesForStaff();   // will call fetchStaffMembers() internally

                // ✅ Make sure filtered list is set
                this.filteredStaffMembers = [...this.staffMembers];

                console.log('✅ Data loading completed.');
            } catch (err) {
                console.error('❌ Error loading roles/staff:', err);
            }
    }

    this.fileName = '';
 }

 handleFormLoad(event) {
    const record = event.detail.records;
    const recordId = Object.keys(record)[0];
    this.facilityId = record[recordId].fields.Facility__c.value;
    console.log('✅ Facility ID:', this.facilityId);
}


  get detailsClass(){
    return (this.detailsflag || this.detailseditflag) ? 'menu-item1' : 'menu-item';
  }
  get addressClass(){
    return (this.addressflag || this.addresseditflag) ? 'menu-item1' : 'menu-item';
  }
  get identificationClass(){
    return (this.identificationflag || this.identificationeditflag) ? 'menu-item1' : 'menu-item'; 
  }
  get insuranceClass(){
    return (this.insuranceflag || this.insuranceeditflag) ? 'menu-item1' : 'menu-item';
  }
  get primaryClass(){
    return (this.primaryflag || this.primaryeditflag) ? 'menu-item1' : 'menu-item';
  }
  get participantClass(){
    return (this.participantflag || this.participanteditflag) ? 'menu-item1' : 'menu-item';
  }

  onFileUpload(event) {       
    this.isattachError=false;
    if (event.target.files.length > 0) {
        this.selectedFilesToUpload = event.target.files;      
        this.file = this.selectedFilesToUpload[0];
        this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
        this.fileType = this.selectedFilesToUpload[0].type;
        this.fileSize = this.selectedFilesToUpload[0].size;     
       
        if (!this.fileType.startsWith('image/')) {
          this.isattachError = true;
          this.imageerror='Only image files are allowed';
          return;
      }
        
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
    //this.showSpinner = false;
   /*  console.log('fileName>>',this.fileName);
    console.log('file prepared');
   */
   
  }
  handleNameChange(event){
    if(event.target.name == 'fname') {
        this.firstName = '';
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        this.firstName =inputValue;
    }
    if(event.target.name == 'lname') {
        this.lastName = '';
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        this.lastName =inputValue;

    }
    if((this.firstName != undefined || this.firstName != NULL) || (this.lastName != undefined || this.lastName != NULL)){
        this.fullName = this.firstName +' '+ this.lastName;
    }
  }
  @track originalstaffoptions = [];
  @track originalselectedroles = [];

  handleStaffChange(event) {
   /*  this.originalstaffoptions = this.staffOptions;
    this.originalselectedroles = this.selectedRoles;
    console.log('this.origiinalselectedroles'+JSON.stringify(this.originalselectedroles));
    console.log('this.originalstaffoptions'+JSON.stringify(this.originalstaffoptions)); */
    this.selectedRoles = event.detail.value;
    console.log('Updated selected roles: ' + JSON.stringify(this.selectedRoles));
    //this.handleUpdateStaff();
  }

  handleGenderChange(event) {
    this.preferredGender = event.detail.value;
}

  // Update the backend with selected roles
  handleUpdateStaff() {
        console.log('Client Id >> ', this.clientId);
        console.log('Modified Staff Map >> ', JSON.stringify(this.modifiedStaffMap));

        // ✅ CALL FORM SUBMIT (added)
    const form = this.template.querySelector('lightning-record-edit-form');

    if (form) {
        const fields = {};
        console.log('Preferred_Gender__c',this.preferredGender);

        fields.Id = this.clientId;
        fields.Preferred_Gender__c = this.preferredGender;
        fields.Preferred_Nationality__c = this.Nationality;
        fields.Preferred_Languages__c = this.selectedLangs;

        form.submit(fields);
    } else {
        console.warn('Form not found');
    }

        const modifiedStaffList = Object.values(this.modifiedStaffMap);

        // Prepare payload (only modified records)
        const assignmentPayload = modifiedStaffList.map(staff => ({
            Id: staff.Id,
            Name: staff.Name,
            roleAssignments: staff.roleAssignments,
            rowClass: staff.rowClass
        }));

        const serializedPayload = JSON.stringify(assignmentPayload);
        console.log('assignmentPayload >> ', serializedPayload);

        // 🔁 Call Apex
        updateStaffAssignments({
            clientId: this.clientId,
            assignmentsJSON: serializedPayload
        })
        .then(() => {
            console.log('✅ Successfully updated staff assignments.');
            this.showToast('success', 'Staff Successfully Updated');
            this.participanteditflag = false;
            this.editButtom = true;
            this.editandBackButton = true;
            this.participantflag = true;
            this.fetchRolesForStaff();
            // ✅ Clear modified staff map
            this.modifiedStaffMap = {};
            this.searchStaff = '';
        })
        .catch(error => {
            console.error('❌ Error updating staff assignments:', error);
        });
    }

    showToast(variant, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: variant === 'success' ? 'Success' : 'Error',
                message: message,
                variant: variant,
                mode: 'dismissable'
            })
        );
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

    // Always normalize before using
    get displayTextLang() {
        if (!this.selectedLangs)
        {
            return 'Select Languages';
        }
        const langs = Array.isArray(this.selectedLangs)
            ? this.selectedLangs
            : this.selectedLangs.split(';');
        const display = langs.filter(Boolean).join(', ');
        return display || 'Select Languages';
    }


    handleDropdownToggle(event) {
        event.stopPropagation();
        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {
            // ✅ Bind and attach outside click listener
            this._boundHandleClickOutside = this.handleClickOutside.bind(this);
            window.addEventListener('click', this._boundHandleClickOutside);
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

        // 🧩 Ensure selectedLangs is defined as a string
        if (!this.selectedLangs) {
            this.selectedLangs = '';
        }

        // 🧩 Convert to array safely (handles both array and string cases)
        let langsArray = [];

        if (Array.isArray(this.selectedLangs)) {
            langsArray = [...this.selectedLangs];
        } else if (typeof this.selectedLangs === 'string') {
            langsArray = this.selectedLangs.split(';').filter(Boolean);
        } else {
            langsArray = [];
        }

        // 🧩 Add or remove the selected language
        if (isChecked) {
            if (!langsArray.includes(optionId)) {
                langsArray.push(optionId);
                console.log('➕ Added:', optionId);
            }
        } else {
            langsArray = langsArray.filter(v => v !== optionId);
            console.log('➖ Removed:', optionId);
        }

        // 🧩 Store as a semicolon-separated string
        this.selectedLangs = langsArray.join(';');

        console.log('📋 Updated Selected Languages (semicolon):', this.selectedLangs);

        // Refresh UI or data
        this.refreshValues();

        console.log('🔁 Values refreshed');
        console.log('🌀 [handleLanguageToggle] END');
    }

    refreshValues() {
    console.log('🌀 [refreshValues] START');
    console.log('📋 Current Selected Languages:', JSON.stringify(this.selectedLangs));

    // 🔒 SAFETY CHECK — ENSURE selectedLangs is always a string
    let langStr = this.selectedLangs || "";

    // Convert if backend accidentally returns array
    if (Array.isArray(langStr)) {
        console.warn('⚠️ selectedLangs is array. Converting to comma string.');
        langStr = langStr.join(',');
    }

    // Normalize: ensure consistent comma-separated list
    langStr = String(langStr);

    console.log("🔧 Normalized Language String:", langStr);

    this.Languages = this.Languages.map(opt => {
        // Safe include check
        // const isSelected =
        //     langStr !== "" && langStr.split(",").map(s => s.trim()).includes(opt.id);
        const isSelected =
             langStr !== "" && langStr.split(";").map(s => s.trim()).includes(opt.id);

        console.log(`🔄 Processing: ${opt.id} | Selected: ${isSelected}`);

        return {
            ...opt,
            checked: isSelected,
            badgeClass: isSelected ? 'status-badge active' : 'status-badge inactive',
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

    // get selectedOptionClass() {
    //     return this.selectedRoleValues.length > 0 ? 'selected-text' : 'placeholder-text';
    // }

    //  get selectedOptionClass() {
    //     return this.selctedMultipleFcailityValues.length > 0 ? 'selected-text' : 'placeholder-text';
    // }

    get selectedOptionClass() {
        const hasRole = this.selectedRoleValues?.length > 0;
        const hasFacility = this.selctedMultipleFcailityValues?.length > 0;

        return (hasRole || hasFacility)
            ? 'selected-text slds-truncate'
            : 'placeholder-text slds-truncate';
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

handleMedicareChange(event) {
    const value = event.target.value;
    this.isMedicareEntered = value && value.trim() !== '';
}

handlesavebutton1(event) {

    console.log('===== SAVE BUTTON CLICKED =====');
    const dataset = event.currentTarget.dataset;
    console.log('Contact Type:', dataset.contacttype);
    console.log('First Name:', dataset.firstname);
    console.log('Last Name:', dataset.lastname);
    console.log('Email:', dataset.email);
    console.log('Contact Number:', dataset.contactnumber);
    console.log('Notify:', dataset.notify);


    // 1️⃣ First Name
    if (!dataset.firstname) {
        console.warn('Validation Failed: First Name missing');
        this.showToast('error', 'First Name is required');
        return;
    }

    // 2️⃣ Last Name
    if (!dataset.lastname) {
        console.warn('Validation Failed: Last Name missing');
        this.showToast('error', 'Last Name is required');
        return;
    }

    // 3️⃣ Contact Number
    if (!dataset.contactnumber) {
        console.warn('Validation Failed: Contact Number missing');
        this.showToast('error', 'Contact Number is required');
        return;
    }    

    // 4️⃣ Email
    if (!dataset.email) {
        console.warn('Validation Failed: Email missing');
        this.showToast('error', 'Email is required');
        return;
    }

    console.log('✅ All field validations passed');

    this.contactData = {
        contactType: dataset.contacttype,
        firstName: dataset.firstname,
        lastName: dataset.lastname,
        contactNumber: dataset.contactnumber,
        email: dataset.email,
        notify: dataset.notify === 'true'
    };

    console.log('Prepared contactData:', JSON.stringify(this.contactData));

    console.log('🚀 Calling Apex checkUserExists with email:', dataset.email);

    // 🔹 Call Apex
    checkUserExists({ emailAddress: dataset.email })
        .then((result) => {

            console.log('✅ Apex Success - User does NOT exist');
            console.log('Apex Result:', result);

            this.participantModule = false;
            this.createUserflag = true;

        })
        .catch(error => {

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'User Already Exists',
                    message: error?.body?.message || 'Unknown error occurred',
                    variant: 'error'
                })
            );
        });
}

handleCloseChild(event) {

    console.log('Child requested close:', event.detail);

    this.createUserflag = false;
    this.participantModule = true;

    // Optional: refresh list
    /* if (event.detail.refresh) {
        this.refreshParticipants();
    } */
}


// handleFacilitySelection(event) {
//     const selected = event.detail.value || [];

//     console.log('Selected Facilities:', JSON.stringify(selected));

//     this.selctedMultipleFcailityValues = [...selected];

//     this.activeFaciltyDisplay = this.multiFacilityDroDownList
//         .filter(f => this.selctedMultipleFcailityValues.includes(f.value))
//         .map(f => f.label)
//         .join(', ');

//     console.log('Updated activeFaciltyDisplay:', this.activeFaciltyDisplay);
// }


handleFacilitySelection(event) {

    console.log('Facility event:', JSON.stringify(event.detail));

    const value = event.detail.value;

    // ✅ IGNORE SEARCH + CLEAR BOTH
    if (!Array.isArray(value)) {
        console.log('🚫 Ignored (search or clear event)');
        return;
    }

    // ✅ ONLY HANDLE REAL SELECTION
    const selected = value;

    console.log('✅ Selected Facilities:', JSON.stringify(selected));

    this.selctedMultipleFcailityValues = [...selected];

    this.activeFaciltyDisplay = this.multiFacilityDroDownList
        .filter(f => this.selctedMultipleFcailityValues.includes(f.value))
        .map(f => f.label)
        .join(', ');

    console.log('✅ Updated activeFaciltyDisplay:', this.activeFaciltyDisplay);
}

// get facilityDropdownOptions() {
//     if (!Array.isArray(this.multiFacilityDroDownList)) {
//         return [];
//     }

//     return this.multiFacilityDroDownList.map(item => ({
//         label: item.label,
//         value: item.value
//     }));
// }

get facilityDropdownOptions() {

    if (!Array.isArray(this.multiFacilityDroDownList)) {
        return [];
    }

    // ✅ Prefer tracked participant type for create mode
    const participantType =
        this.clientData?.[0]?.Type_of_Participant__c ||
        this.selectedParticipantType ||
        this.participantType;

    console.log('facilityDropdownOptions participantType =>', participantType);

    let filteredFacilities = [...this.multiFacilityDroDownList];

    // ✅ NDIS
    if (participantType === 'NDIS') {

        filteredFacilities = filteredFacilities.filter(
            item => item.Type_of_Service__c === 'NDIS'
        );

    }

    // ✅ Aged Care
    else if (participantType === 'Aged Care') {

        filteredFacilities = filteredFacilities.filter(
            item => item.Type_of_Service__c === 'Aged Care'
        );

    }else if (participantType === 'Nursing') {

           filteredFacilities = filteredFacilities.filter(item => {

        const serviceType = item.Type_of_Service__c;

        return (
            serviceType === 'Nursing' ||
            serviceType === 'Transport' ||
            serviceType === 'Child Care'
        );
    });

}

    // ✅ Other participant types
    else {

        filteredFacilities = filteredFacilities.filter(
            item =>
                item.Type_of_Service__c !== 'NDIS' &&
                item.Type_of_Service__c !== 'Aged Care'
        );
    }

    return filteredFacilities.map(item => ({
        label: item.label,
        value: item.value
    }));
}

@track selectedParticipantType = '';

handleParticipantTypeChange(event) {
    this.selectedParticipantType = event.detail.value;

    console.log('selectedParticipantType =>', this.selectedParticipantType);

    this.fetchMultiFaciltyOptions();
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
    // GET FIELD VALUES
    // =====================================================

    const attachmentId = 
        this.template.querySelector(
            '[data-id="attachmentId"]'
        )?.value;

    const attachmentName =
        this.template.querySelector(
            '[data-id="attachmentName"]'
        )?.value;

    const attachmentType =
        this.template.querySelector(
            '[data-id="attachmentType"]'
        )?.value;

    const comments =
        this.template.querySelector(
            '[data-id="commentsField"]'
        )?.value;

    const expiryDate =
        this.template.querySelector(
            '[data-id="expiryDate"]'
        )?.value;

    const otherComments =
        this.template.querySelector(
            '[data-id="otherComments"]'
        )?.value;


    // =====================================================
    // NORMALIZE NEW FILES
    // =====================================================

    const newFiles = this.uploadedFiles.map(file => {

        return {

            // existing attachments later will have value
            attachmentId: attachmentId,

            url: file.url,

            key: file.key,

            size: file.size,

            attachmentName: attachmentName,

            type: attachmentType,

            comments: comments,

            expiryDate: expiryDate,

            otherComments: otherComments,

            userId: this.currentUserId
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

    const fileKey =
        event.currentTarget.dataset.key;

    console.log(
        '🗑 Delete Attachment:',
        attachmentId
    );

    console.log(
        '🗝 File Key:',
        fileKey
    );

    // =====================================================
    // FIND CONTACT
    // =====================================================

    const contactIndex = this.contactList.findIndex(
        row =>
            row.id === this.selectedContactId ||
            row.Id === this.selectedContactId
    );

    if (contactIndex === -1) {

        console.error('❌ Contact not found');

        return;
    }

    // =====================================================
    // TEMP FILE
    // NO SALESFORCE ID
    // =====================================================

    if (!attachmentId) {

        console.log(
            '🟡 Temporary attachment detected'
        );

        // Remove from modal list
        this.contactAttachments =
            this.contactAttachments.filter(
                file =>
                    file.key !== fileKey &&
                    file.Key__c !== fileKey
            );

        // Remove from contact uploadedFiles
        const updatedContacts = [...this.contactList];

        updatedContacts[contactIndex].uploadedFiles =
            updatedContacts[
                contactIndex
            ].uploadedFiles.filter(
                file =>
                    file.key !== fileKey &&
                    file.Key__c !== fileKey
            );

        // Update count
        updatedContacts[contactIndex].attachmentCount =
            updatedContacts[
                contactIndex
            ].uploadedFiles.length;

        // Force reactivity
        this.contactList = updatedContacts;

        console.log(
            '✅ Temporary attachment removed'
        );

        return;
    }

    // =====================================================
    // EXISTING SALESFORCE FILE
    // =====================================================

    this.showSpinner = true;

    deleteContactAttachment({
        attachmentId: attachmentId
    })
    .then(() => {

        this.dispatchEvent(
            new ShowToastEvent({
                title: "Success",
                message:
                    "Attachment deleted successfully",
                variant: "success"
            })
        );

        // Refresh backend data
        this.loadContactAttachments();

        this.loadContactAttachmentCounts();

        return refreshApex(
            this.wiredClientResult
        );
    })
    .catch(error => {

        console.error(error);

        this.showToast(
            'Error',
            error?.body?.message ||
            'Delete failed',
            'error'
        );
    })
    .finally(() => {

        this.showSpinner = false;
    });
}

closeAttachmentListModal() {

    this.showAttachmentListModal = false;
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

    console.log(
        '================================================'
    );

    console.log(
        '📂 handleOpenAttachmentList START'
    );

    // ============================================
    // GET INDEX
    // ============================================

    const index =
        event.currentTarget.dataset.index;

    console.log(
        '📌 Selected Index:',
        index
    );

    // ============================================
    // GET CONTACT
    // ============================================

    const contact =
        this.contactList[index];

    console.log(
        '👤 Selected Contact:',
        JSON.stringify(contact)
    );

    // ============================================
    // VALIDATION
    // ============================================

    if (!contact || !contact.id) {

        console.error(
            '❌ Invalid contact or missing contact id'
        );

        return;
    }

    // ============================================
    // STORE CONTACT ID
    // ============================================

    this.selectedContactId =
        contact.id;

    console.log(
        '🆔 selectedContactId:',
        this.selectedContactId
    );

    // ============================================
    // OPEN MODAL
    // ============================================

    this.showAttachmentListModal = true;

    console.log(
        '🪟 Attachment modal opened'
    );

    // ============================================
    // SCENARIO 1
    // FRONTEND FILES EXIST
    // ============================================

    console.log(
        '📦 uploadedFiles:',
        JSON.stringify(contact.uploadedFiles)
    );

    if (
        contact.uploadedFiles &&
        contact.uploadedFiles.length > 0
    ) {

        console.log(
            '🟢 Frontend uploadedFiles found'
        );

        console.log(
            '📊 uploadedFiles count:',
            contact.uploadedFiles.length
        );

        this.contactAttachments =
            contact.uploadedFiles.map(
                (file, fileIndex) => {

                    console.log(
                        `📄 Processing File ${fileIndex + 1}:`,
                        JSON.stringify(file)
                    );

                    const normalizedFile = {

                        // ====================================
                        // ATTACHMENT ID
                        // ====================================

                        Id:
                            file.attachmentId || null,

                        // ====================================
                        // FILE NAME
                        // ====================================

                        attachmentName:
                            file.attachmentName ||
                            file.originalName ||
                            file.Name ||
                            '',

                        // ====================================
                        // TYPE
                        // ====================================

                        type:
                            file.type ||
                            file.Type__c ||
                            '',

                        // ====================================
                        // EXPIRY DATE
                        // ====================================

                        expiryDate:
                            file.expiryDate ||
                            file.Date_Format__c ||
                            '',

                        // ====================================
                        // COMMENTS
                        // ====================================

                        comments:
                            file.comments ||
                            file.Comments__c ||
                            '',

                        // ====================================
                        // URL
                        // ====================================

                        viewUrl:
                            file.viewUrl ||
                            file.url ||
                            file.Amazon_file_URL__c ||
                            '',

                        // ====================================
                        // KEY
                        // ====================================

                        key:
                            file.key ||
                            file.Key__c ||
                            '',

                        // ====================================
                        // USER
                        // ====================================

                        userId:
                            file.userId ||
                            file.User__c ||
                            null
                    };

                    console.log(
                        '✅ Normalized File:',
                        JSON.stringify(normalizedFile)
                    );

                    return normalizedFile;
                }
            );

        console.log(
            '📋 Final contactAttachments:',
            JSON.stringify(this.contactAttachments)
        );

        console.log(
            '✅ FRONTEND FILE LOAD COMPLETE'
        );

        console.log(
            '================================================'
        );

        return;
    }

    // ============================================
    // SCENARIO 2
    // LOAD FROM BACKEND
    // ============================================

    console.log(
        '🟡 No frontend files found'
    );

    console.log(
        '☁ Loading attachments from backend...'
    );

    this.loadContactAttachments();

    console.log(
        '================================================'
    );
}

loadContactAttachments() {

    console.log(
        '================================================'
    );

    console.log(
        '☁ loadContactAttachments START'
    );

    console.log(
        '🆔 selectedContactId:',
        this.selectedContactId
    );

    // ============================================
    // CALL APEX
    // ============================================

    getContactAttachments({
        contactId: this.selectedContactId
    })

    .then(result => {

        console.log(
            '✅ Apex Response Received'
        );

        console.log(
            '📦 Raw Result:',
            JSON.stringify(result)
        );

        console.log(
            '📊 Attachment Count:',
            result?.length || 0
        );

        // ============================================
        // MODAL ATTACHMENT LIST
        // ============================================

        console.log(
            '🔄 Mapping contactAttachments...'
        );

        this.contactAttachments =
            result.map((file, index) => {

                console.log(
                    `📄 Processing Backend File ${index + 1}:`,
                    JSON.stringify(file)
                );

                const normalizedFile = {

                    ...file,

                    // ====================================
                    // URL
                    // ====================================

                    viewUrl:
                        file.Amazon_file_URL__c,

                    // ====================================
                    // FILE NAME
                    // ====================================

                    attachmentName:
                        file.Name,

                    // ====================================
                    // COMMENTS
                    // ====================================

                    comments:
                        file.Comments__c,

                    // ====================================
                    // USER
                    // ====================================

                    userId:
                        file.User__c,

                    // ====================================
                    // TYPE
                    // ====================================

                    type:
                        file.Type__c,

                    // ====================================
                    // EXPIRY DATE
                    // ====================================

                    expiryDate:
                        file.Date_Format__c
                };

                console.log(
                    '✅ Normalized contactAttachment:',
                    JSON.stringify(normalizedFile)
                );

                return normalizedFile;
            });

        console.log(
            '📋 Final contactAttachments:',
            JSON.stringify(this.contactAttachments)
        );

        // ============================================
        // FIND CONTACT INDEX
        // ============================================

        console.log(
            '🔍 Finding contact index...'
        );

        const contactIndex =
            this.contactList.findIndex(
                row =>
                    row.id === this.selectedContactId ||
                    row.Id === this.selectedContactId
            );

        console.log(
            '📌 contactIndex:',
            contactIndex
        );

        // ============================================
        // SYNC uploadedFiles
        // ============================================

        if (contactIndex !== -1) {

            console.log(
                '🟢 Syncing uploadedFiles into contactList'
            );

            this.contactList[
                contactIndex
            ].uploadedFiles =
                result.map((file, index) => {

                    console.log(
                        `📄 Sync File ${index + 1}:`,
                        JSON.stringify(file)
                    );

                    const uploadedFile = {

                        // ====================================
                        // ATTACHMENT ID
                        // ====================================

                        attachmentId:
                            file.Id,

                        // ====================================
                        // FILE NAME
                        // ====================================

                        attachmentName:
                            file.Name,

                        // ====================================
                        // TYPE
                        // ====================================

                        type:
                            file.Type__c,

                        // ====================================
                        // SIZE
                        // ====================================

                        Size__c:
                            file.Size__c,

                        // ====================================
                        // COMMENTS
                        // ====================================

                        comments:
                            file.Comments__c,

                        // ====================================
                        // EXPIRY DATE
                        // ====================================

                        expiryDate:
                            file.Date_Format__c,

                        // ====================================
                        // URL
                        // ====================================

                        viewUrl:
                            file.Amazon_file_URL__c,

                        url:
                            file.Amazon_file_URL__c,

                        // ====================================
                        // KEY
                        // ====================================

                        Key__c:
                            file.Key__c,

                        key:
                            file.Key__c,

                        // ====================================
                        // USER
                        // ====================================

                        userId:
                            file.User__c
                    };

                    console.log(
                        '✅ uploadedFile Object:',
                        JSON.stringify(uploadedFile)
                    );

                    return uploadedFile;
                });

            // ============================================
            // UPDATE ATTACHMENT COUNT
            // ============================================

            this.contactList[
                contactIndex
            ].attachmentCount =
                this.contactList[
                    contactIndex
                ].uploadedFiles.length;

            console.log(
                '📎 Updated attachmentCount:',
                this.contactList[
                    contactIndex
                ].attachmentCount
            );

            // ============================================
            // FORCE REACTIVITY
            // ============================================

            this.contactList =
                [...this.contactList];

            console.log(
                '♻ Reactivity triggered'
            );

            console.log(
                '✅ Final Synced Contact:',
                JSON.stringify(
                    this.contactList[
                        contactIndex
                    ]
                )
            );
        }
        else {

            console.warn(
                '⚠ Contact index not found'
            );
        }

        console.log(
            '✅ loadContactAttachments COMPLETE'
        );

        console.log(
            '================================================'
        );
    })

    .catch(error => {

        console.error(
            '❌ Error loading attachments'
        );

        console.error(
            '📛 Full Error:',
            JSON.stringify(error)
        );

        console.error(
            '📛 Error Body:',
            JSON.stringify(error?.body)
        );

        console.error(
            '📛 Error Message:',
            error?.body?.message
        );

        console.error(error);
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

handleAttachmentTypeChange(event) {

    this.attachmentType = event.detail.value;

    this.showOtherField =
        this.attachmentType === 'Other';

    console.log(
        'Selected Type =>',
        this.attachmentType
    );

    console.log(
        'showOtherField =>',
        this.showOtherField
    );
}

handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid',isValid);

    this.fieldErrorMap[field] = !isValid;
}

@track isEditAttachment = false;

@track editingAttachmentId = null;

handleEditAttachment(event) {

    const attachmentId =
        event.currentTarget.dataset.id;

    console.log(
        '✏️ Edit Attachment:',
        attachmentId
    );

    const attachment =
        this.contactAttachments.find(
            file => file.Id === attachmentId
        );

    if (!attachment) {

        console.error(
            '❌ Attachment not found'
        );

        return;
    }

    // ====================================
    // STORE EDIT STATE
    // ====================================

    this.editingAttachmentId =
        attachment.Id;

    this.isEditAttachment = true;

    // ====================================
    // PREFILL FIELDS
    // ====================================

    setTimeout(() => {

        const attachmentNameField =
            this.template.querySelector(
                '[data-id="attachmentName"]'
            );

        if (attachmentNameField) {

            attachmentNameField.value =
                attachment.Name;
        }

        const attachmentTypeField =
            this.template.querySelector(
                '[data-id="attachmentType"]'
            );

        if (attachmentTypeField) {

            attachmentTypeField.value =
                attachment.Type__c;
        }

        const commentsField =
            this.template.querySelector(
                '[data-id="commentsField"]'
            );

        if (commentsField) {

            commentsField.value =
                attachment.Comments__c;
        }

        const expiryDateField =
            this.template.querySelector(
                '[data-id="expiryDate"]'
            );

        if (expiryDateField) {

            expiryDateField.value =
                attachment.Date_Format__c;
        }

    }, 0);

    // ====================================
    // OPEN MODAL
    // ====================================

    this.showAttachmentListModal = false;
    this.showContactAttachmentModal = true;
}

}