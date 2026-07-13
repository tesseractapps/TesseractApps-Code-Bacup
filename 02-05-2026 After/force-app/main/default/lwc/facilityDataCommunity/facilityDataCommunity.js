import {LightningElement,track,wire,api} from 'lwc';
import fetchFacilitiesByOrgId from '@salesforce/apex/FacilityController.fetchFacilitiesByOrgIdCommunity';
import statusFacility from '@salesforce/apex/FacilityController.statusFacility';
//import fetchFacility from '@salesforce/apex/FacilityController.fetchFacility';
//import updateFacility from '@salesforce/apex/FacilityController.updateFacility';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { NavigationMixin } from 'lightning/navigation';
import {refreshApex} from '@salesforce/apex';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import FACILITY_OBJECT from '@salesforce/schema/Facility__c';
import SERVICES_FIELD from '@salesforce/schema/Facility__c.Services__c';
import My_Resource from "@salesforce/resourceUrl/myResource";
import {RefreshEvent} from 'lightning/refresh';
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key'; 
import CURRENT_USER_ID from '@salesforce/user/Id';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import typeOfUser from '@salesforce/schema/User.Type_of_User__c';
import getServicesData from '@salesforce/apex/FacilityController.getServicesData';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import orgDetailsCommunity from "@salesforce/apex/OrgDetails.orgDetailsCommunity";
import generateCustomGUID from "@salesforce/apex/OrgDetails.generateCustomGUID";
import generateSoftwareID from "@salesforce/apex/GovReportsSoftwareID.generateSoftwareID";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import savefacilityRoles from '@salesforce/apex/FacilityController.savefacilityRoles';
import getFacilityRoles from '@salesforce/apex/FacilityController.getFacilityRoles';
import getCompanyAndEntityStatus from '@salesforce/apex/FacilityController.getCompanyAndEntityStatus';
import getServiceLineItem from '@salesforce/apex/FacilityController.getServiceLineItem';
import saveCatalogue from '@salesforce/apex/CatalogueController.saveCatalogue';
import getfacilityselectedCatalogue from '@salesforce/apex/CatalogueController.getfacilityselectedCatalogue';
import processBulkSelectedRecords from '@salesforce/apex/CatalogueController.processBulkSelectedRecords';
import handleUncheck from '@salesforce/apex/CatalogueController.handleUncheck';
import processBulkSelectedRecordsUncheck from '@salesforce/apex/CatalogueController.processBulkSelectedRecordsUncheck';
import isFacilityLimitReached from '@salesforce/apex/LimitCheckService.isFacilityLimitReached';
import checkActiveStaffAndParticipants from '@salesforce/apex/FacilityController.checkActiveStaffAndParticipants';

const DEFAULT_ICON = { 
    icon: 'navigation', 
    class: 'material-symbols material-symbols-filled rotate-icon rotate-down' 
}; 

export default class FacilityDataCommunity extends NavigationMixin (LightningElement)  {
    recordId;
    subscription = {};
    CHANNEL_NAME = '/event/RefreshDataTable__e'; 
    records = []; //All records available in the data table    
    totalRecords = 0; //Total no.of records
    pageSize; //No.of records to be displayed per page
    totalPages; //Total no.of pages
    pageNumber = 1; //Page number    
    recordsToDisplay = []; //Records to be displayed on the page
    @track accountingEntityName = '';//manendra
    showAccountingEntity = false;//manendra
    @track refreshTable=[];
    @track recordsToDisplay=[];
    @api selectedName;
    @api orgAbn;
    @api orgid;
    @api facilityButton;
    @api isFromManageInvoice;
    @api createCompanyFacilityId;
    @track enableSIL = false;
    //@api createCompanyFundTrackerId;
    @track orgNam='';
    @track visible=false;
    @track isServiceModel=false;
    @track facilityName;
    @track servicePicklist;
    @track lstOptions=[];
    @track facEditFlag=false;
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalcode;
    @track name;
    @track status;
    @track phone;
    @track manger;
    @track service;
    @track email;
    @track firstname;
    @track headeringName;
    @track facilityJSONData = {};
    @track serviceTypeOptions = [];
    @track supportItemOptions = [];
     @track selectedServiceType=[];
     @track selectedSupportItem;
    @track serviceDate;
    @track buttonName ='';
    @track noRecordsFlag =false;
    @track showSpinner = false;
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
    @track toggleValue = false;
   
    @track facilitylabel = 'All';
    @track sectionFlags = {
        Facility: true,
        Addressdetails: false,
        Facility1: true,
        PayrollSettings:true,
        PayrollSettings1:true,
        Roster:true,
        RosterManagement: true,
        Bank: true,
    Bank1: true,
        SIL:true//manendra
        
    };


    @track handleAbnFlag = false;
    originalToggleValue;

    @track facilityOptions=[];
    @track selectedFacilities=[];
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole;
    @track userType;
    @track usererror;
    @track userFacilities=[];
    @track finalListFacilities=[];
    @track BMSconfirmMessgeTemplate=false;
    @track SoftwareIDconfirmMessgeTemplate=false;
    @track BMSIDValue;
    @track softwareIDValue;
    @track isBMSIDDisbale=true;
    @track bmsIdButtonDisable=true;
    @track isSoftwareIdDisable=false;
    @track softwareButtonDisbale=false;
    @track wiredOrgResult;
    @track ABNNumber;
    @track orgDetails;
    @track agentName;
    @track taxAgency;
    @track taxAgencyNumber;
    @track useOrgPayrollSettings=false;
    @track NdisFlag;
    @track typeofuser;
    @track fieldErrorMap = {};
    @track successMessage;
    @track facilityPreferredName;
    @track participantPreferredName;
    @track staffPreferredName;
    @track facilityNameEdited = false;
    @track participantNameEdited = false;
    @track staffNameEdited = false;
    @track facilityIdfromlocalStorage;
    @track isOpen = false;
    @track selectedOption = null;
    @track options = [];
    @track newOptionText = '';
    @track allServices = [];
    @track isServicesOpen = false; 
    @track activeRolesDisplay = '';
    @track isMultiFacilityUpload;
    @track servicesDisplayText = 'Select Services';//manendra */
    @track documentsList = [];
    @track documentsDisplayText = "Select Documents";
    @track isDocumentsOpen = false;
    @track selectedDocuments = [];
    @track trainingsList = [];
    @track trainingsDisplayText = "Select Trainings";
    @track isTrainingsOpen = false;
    @track selectedTrainings = [];
    @track DisplayTrainings;
    @track rolesDisplayValue = '';
    @track servicesDisplayValue = '';
    @track documentsDisplayValue = '';
    @track trainingsDisplayValue = ''; 
    @track isCompanyExist=false;
    @track isEntityExist=false;
    @track existingCompanyId;
    @track existingCompanyName;
    @track isNewEntityFlag=false;
    @track selectedCardType='Customer';
    @track facilityIdEditIcon;
    @track existingEntityId;
    @track existingEntityName;
    @track shiftPenaltyMode
    @track totalCatalogues;
    @track activeServices;
    @track trackedRecords = [];
    @track enableShiftRejection=false;
    @track isAccounting=false;
    @track accountingService;
    @track filteredServiceTypes = [];
    @track showServiceTypeDropdown = false;
    @track selectedServiceTypeLabel = '';
    @track selectedServiceTypeLabelValue = '';
    @track hasFutureServices = false;
    @track hasFutureServices1 = false;
    @track popupMsg = '';
    @track popupMsg1 = '';

    @track staffClientCountMessage = '';
    @track hasFutureShifts = false;
     @track previousToggleValue;
     @track showUpgradeModal = false;

    autoFacilityOpened = false;
    serviceDocumentsMap = {
        'NDIS': [
            'NDIS Worker Screening Check',
            'Working With Children Check (WWCC) — if supporting minors',
            'Police Check',
            'Signed NDIS Code of Conduct',
            'Visa & Right to Work Evidence',
            'Covid-19 Immunisation Proof',
            'Qualifications (Cert III/IV Disability Support, etc.)',
            'Service Agreement',
            'Consent Form',
            'Complaints Management Policy',
            'Incident Management Policy',
            'Privacy & Confidentiality Policy',
            'Risk Assessment Form',
            'Medication Administration Record',
            'Behaviour Support Plan',
            'Emergency Preparedness Plan',
            'NDIS Code of Conduct Policy',
            'Participant Support Plan',
            'Staff Competency Assessment Form',
            'Progress Notes Template',
            'Invoice & Billing Compliance Template',
            'First Aid / CPR'
        ],
        'Nursing': [
            'AHPRA Registration',
            'Immunisation Record (Hep B, Flu, COVID)',
            'CPR Certificate',
            'Infection Control Certificate',
            'Fire & Emergency Evacuation Certificate',
            'Incident Reporting Policy Acknowledgement',
            'Police Check',
            'Working With Children Check (if applicable)',
            'Privacy & Confidentiality Agreement',
            'Code of Conduct Acknowledgement',
            'Nursing Degree Certificate',
            'CPD (Continuing Professional Development) Record',
            'Right to Work',
            'Qualification (RN/EN Certificate)'
        ],
        'Child Care': [
            'WWCC',
            'Police Check',
            'First Aid Certificate (Pediatric preferred)',
            'CPR Certificate',
            'Child Protection Certificate',
            'Safe Sleep / SIDS Training Certificate',
            'Food Safety / Allergy Management Certificate',
            'Emergency & Evacuation Certificate',
            'Infection Control Certificate',
            'Cert III Early Childhood Education',
            'Diploma in Early Childhood Education',
            'Immunisation Record',
            'Covid Vaccination Evidence'
        ]
    };

    // Icons for the toggle buttons
    // @track sectionIcons = {
    //     Facility: '\u2B9F', 
    //     Addressdetails: '\u2B9C',
    //     Facility1: '\u2B9F', 
    //     PayrollSettings: '\u2B9F',
    //     RosterManagement: '\u2B9F',
    //     PayrollSettings1:'\u2B9F',
    //     Roster:'\u2B9F'
    // };
@track sectionIcons = {
  Facility: { ...DEFAULT_ICON },
  Addressdetails: { ...DEFAULT_ICON },
  Facility1: { ...DEFAULT_ICON },
  PayrollSettings: { ...DEFAULT_ICON },
  RosterManagement: { ...DEFAULT_ICON },
  PayrollSettings1: { ...DEFAULT_ICON },
  Roster: { ...DEFAULT_ICON },
  SIL: { ...DEFAULT_ICON },//manendra
    Bank: { ...DEFAULT_ICON },
    Bank1: { ...DEFAULT_ICON }
};


// STEP CONTROL
@track currentStep = 'step1';

// // STEP FLAGS
// get isStep1() {
//     return this.currentStep === 'step1';
// }
// get isStep2() {
//     return this.currentStep === 'step2';
// }
// get isStep3() {
//     return this.currentStep === 'step3';
// }
// get isStep4() {
//     return this.currentStep === 'step4';
// }

get step1Class() {
    return this.currentStep === 'step1' ? '' : 'slds-hide';
}

get step2Class() {
    return this.currentStep === 'step2' ? '' : 'slds-hide';
}

get step3Class() {
    return this.currentStep === 'step3' ? '' : 'slds-hide';
}

get step4Class() {
    return this.currentStep === 'step4' ? '' : 'slds-hide';
}

// ALWAYS SHOW CANCEL
get showCancel() {
    return true;
}

// SHOW SKIP ONLY ON BANK (STEP 3)
get showSkip() {
    return this.currentStep === 'step3';
}

get generateBtn() {
    return this.currentStep === 'step2';
}

// PREVIOUS (NOT STEP 1)
get showPrevious() {
    return this.currentStep !== 'step1';
}

// NEXT (HIDE ON LAST STEP)
get showNext() {
    return this.currentStep !== 'step4';
}

// SAVE ONLY ON LAST STEP
get showSave() {
    return this.currentStep === 'step4';
}
// NAVIGATION
handleNext() {

    const missingFields = this.validateStepFields(this.currentStep);

    if (missingFields.length > 0) {
        this.showError(`Please fill required fields: ${missingFields.join(', ')}`);
        return;
    }

    if (this.currentStep === 'step1') this.currentStep = 'step2';
    else if (this.currentStep === 'step2') this.currentStep = 'step3';
    else if (this.currentStep === 'step3') this.currentStep = 'step4';
}

handlePrevious() {
    if (this.currentStep === 'step4') this.currentStep = 'step3';
    else if (this.currentStep === 'step3') this.currentStep = 'step2';
    else if (this.currentStep === 'step2') this.currentStep = 'step1';
}

handleSkip() {
    if (this.currentStep === 'step3') {
        this.currentStep = 'step4';
    }
}
resetSteps() {
    this.currentStep = 'step1';
}

@track createCurrentStep = 'createstep1';

get createstep1Class() {
    return this.createCurrentStep === 'createstep1' ? '' : 'slds-hide';
}

get createstep2Class() {
    return this.createCurrentStep === 'createstep2' ? '' : 'slds-hide';
}

get createstep3Class() {
    return this.createCurrentStep === 'createstep3' ? '' : 'slds-hide';
}

// get createstep4Class() {
//     return this.createCurrentStep === 'createstep4' ? '' : 'slds-hide';
// }

get showCreatePrevious() {
    return this.createCurrentStep !== 'createstep1';
}

get showCreateNext() {
    return this.createCurrentStep !== 'createstep3';
}

get showCreateSave() {
    return this.createCurrentStep === 'createstep3';
}

// get showCreateSkip() {
//     return this.createCurrentStep === 'createstep3';
// }
get showCreateGenerateBtn() {
    return this.createCurrentStep === 'createstep2';
}

handleCreateNext() {

    const missingFields = this.validateStepFields(this.createCurrentStep);

    if (missingFields.length > 0) {
        this.showError(`Please fill required fields: ${missingFields.join(', ')}`);
        return;
    }

    if (this.createCurrentStep === 'createstep1') {
        this.createCurrentStep = 'createstep2';
    } 
    else if (this.createCurrentStep === 'createstep2') {
        this.createCurrentStep = 'createstep3';
    }
}

handleCreatePrevious() {
    // if (this.createCurrentStep === 'createstep4') this.createCurrentStep = 'createstep3';
    // else
     if (this.createCurrentStep === 'createstep3') this.createCurrentStep = 'createstep2';
    else if (this.createCurrentStep === 'createstep2') this.createCurrentStep = 'createstep1';
}

// handleCreateSkip() {
//     if (this.createCurrentStep === 'createstep3') {
//         this.createCurrentStep = 'createstep4';
//     }
// }

resetCreateSteps() {
    this.createCurrentStep = 'createstep1';
}

// handleStepClick(event) {
//     const targetStep = event.target.value;

//     // validate current step before moving
//     const missingFields = this.validateStepFields(this.currentStep);

//     if (missingFields.length > 0) {
//         this.dispatchEvent(
//             new ShowToastEvent({
//                 title: 'Missing Required Fields',
//                 message: `Please fill required fields: ${missingFields.join(', ')}`,
//                 variant: 'error'
//             })
//         );
//         return;
//     }

//     // allow navigation only if validation passes
//     this.currentStep = targetStep;
// }
handleStepClick(event) {
    const targetStep = event.target.value;
    const stepOrder = { step1: 1, step2: 2, step3: 3, step4: 4 };
    const current = stepOrder[this.currentStep];
    const target = stepOrder[targetStep];

    // Allow backward navigation freely (no validation needed going back)
    if (target < current) {
        this.currentStep = targetStep;
        return;
    }

    // Allow clicking the current step (no-op)
    if (target === current) {
        return;
    }

    // Moving FORWARD: validate ALL steps between current and target
    const stepKeys = Object.keys(stepOrder); // ['step1','step2','step3','step4']
    for (let i = current; i < target; i++) {
        const stepToValidate = stepKeys[i - 1]; // stepOrder is 1-indexed, array is 0-indexed
        const missingFields = this.validateStepFields(stepToValidate);
        if (missingFields.length > 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: `Step ${i} - Missing Required Fields`,
                    message: `Please fill required fields: ${missingFields.join(', ')}`,
                    variant: 'error'
                })
            );
            // Navigate only up to the step that failed
            this.currentStep = stepToValidate;
            return;
        }
    }

    // All intermediate steps passed validation — allow the jump
    this.currentStep = targetStep;
}

handleCreateStepClick(event) {
    const targetStep = event.target.value;
    const stepOrder = { createstep1: 1, createstep2: 2, createstep3: 3 };
    const current = stepOrder[this.createCurrentStep];
    const target = stepOrder[targetStep];

    // Allow backward navigation freely
    if (target < current) {
        this.createCurrentStep = targetStep;
        return;
    }

    // Allow clicking the current step (no-op)
    if (target === current) {
        return;
    }

    // Moving FORWARD: validate ALL steps between current and target
    const stepKeys = Object.keys(stepOrder); // ['createstep1','createstep2','createstep3']
    for (let i = current; i < target; i++) {
        const stepToValidate = stepKeys[i - 1];
        const missingFields = this.validateStepFields(stepToValidate);
        if (missingFields.length > 0) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: `Step ${i} - Missing Required Fields`,
                    message: `Please fill required fields: ${missingFields.join(', ')}`,
                    variant: 'error'
                })
            );
            // Stop at the failing step
            this.createCurrentStep = stepToValidate;
            return;
        }
    }

    // All intermediate steps passed — allow the jump
    this.createCurrentStep = targetStep;
}

handleEscKey(event) {
    if (event.key === 'Escape') {
        this.handleeditClose();
    }
}
 
    @track ictUserType=false;
     // ===== Catalogue Pagination =====
    @track catalogueRecords = [];
    cataloguePageNumber = 1;
    cataloguePageSize = 10;
    catalogueTotalPages = 1;
    catalogueTotalRecords = 0;
    cataloguePaginationVisible = false;
    cataloguePageSizeOptions = [10, 20, 50, 100];

    get isCatalogueFirstPage() {
    return this.cataloguePageNumber <= 1;
    }

    get isCatalogueLastPage() {
        return this.cataloguePageNumber >= this.catalogueTotalPages;
    }
handleSectionToggle(event) {
  const sectionId = event.currentTarget.dataset.id;

  // First click: show section
  if (!this.sectionFlags[sectionId]) {
    this.sectionFlags[sectionId] = true;

    // ▼ Expanded → DOWN
    this.sectionIcons[sectionId] = {
      icon: 'navigation',
      class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
    };

  } else {
    // Subsequent clicks
    const sectionElement = this.template.querySelector(
      `[data-section="${sectionId}"]`
    );

    if (sectionElement) {
      sectionElement.classList.toggle('hidden-section');

      const isCollapsed = sectionElement.classList.contains('hidden-section');

      // ◀ Collapsed → LEFT | ▼ Expanded → DOWN
      this.sectionIcons[sectionId] = {
        icon: 'navigation',
        class: isCollapsed
          ? 'material-symbols material-symbols-filled rotate-icon rotate-left'
          : 'material-symbols material-symbols-filled rotate-icon rotate-down'
      };

    } else {
      // Fallback (element not found)
      this.sectionFlags[sectionId] = false;

      this.sectionIcons[sectionId] = {
        icon: 'navigation',
        class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
      };
    }
  }
}


    // handleStatus(event) {
        
    //     if (event.target.name === 'checkbox') {
    //         this.toggleValue = event.target.value; // Use 'value' for checkboxes
    //         console.log('Checkbox value:', this.toggleValue);
    //     } else if (event.target.name === 'toggle') {
    //         this.toggleValue = event.target.checked; // Use 'checked' for toggles
    //         console.log('Toggle status:', this.toggleValue);
    //     }
    // }
   
    async handleStatus(event) {

        if (event.target.name === 'checkbox') {
            this.toggleValue = event.target.value;
            console.log('Checkbox value:', this.toggleValue);
            return;
        }

        if (event.target.name === 'toggle') {

            const newValue = event.target.checked;
            this.previousToggleValue = this.toggleValue;
            console.log('newValue :', newValue);
            console.log('this.recordId in handleStatus :', this.recordId);
            if (newValue === true && this.recordId) {
                event.target.checked = this.previousToggleValue;
                try {
                    const limitReached = await isFacilityLimitReached();
                    console.log('Facility limit reached:', limitReached);

                    if (limitReached) {
                       
                        this.toggleValue = false;

                       // this.facEditFlag = false;
                        this.showUpgradeModal = true;
                        return;
                    }
                    event.target.checked = true;
                    // Allow activation
                    this.toggleValue = true;

                } catch (error) {
                    console.error('Error checking limit:', error);

                    // fallback
                    event.target.checked = this.previousToggleValue;
                    this.toggleValue = this.previousToggleValue;
                }
            }

            else if (newValue === false && this.recordId) {
                console.log('this.recordId111 :', this.recordId);
                console.log('this.facilityname  ', this.facilityname );
                event.target.checked = this.previousToggleValue;
                try {
                    const result = await checkActiveStaffAndParticipants({
                        facilityId: this.recordId
                    });
                    console.log('result:', JSON.stringify(result));

                    const participantCount = result.participants || 0;
                    const staffCount = result.staff || 0;

                    console.log('Participants:', participantCount);
                    console.log('Staff:', staffCount);

                    if (participantCount > 0 || staffCount > 0) {

                        this.hasFutureShifts = true;
                       // this.handleStatusFlag = false;

                        this.staffClientCountMessage =
                            ` Participants: ${participantCount},  Staff: ${staffCount}`;

                        // keep toggle ON
                        this.toggleValue = true;
                      //  event.target.checked = this.previousToggleValue;
                        return; 
                    } 

                        this.hasFutureShifts = false;
                        this.toggleValue = false;

                } catch (error) {
                    console.error('Error:', error);

                    // fallback
                     event.target.checked = this.previousToggleValue; 
                    this.toggleValue = this.previousToggleValue;
                }

            } else {
                // ✅ Normal ON case
                this.toggleValue = newValue;
            }
        }
    }
        
    facility = My_Resource+'/myResource/images/facility.svg';
   
    
    @wire(getObjectInfo, { objectApiName: FACILITY_OBJECT })
    objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName:  SERVICES_FIELD})
    servicePicklist(data, error){
        if(data && data.data && data.data.values){
            data.data.values.forEach( objPicklist => {
                this.lstOptions.push({
                    label: objPicklist.label,
                    value: objPicklist.value
                });
            });
        } else if(error){
            //console.log(error);
        }
    };
   
    
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }



    closeUpgradeModal() {
    this.showUpgradeModal = false;
}

handleUpgradeClick() {
    window.location.href = 'mailto:sales@yourcompany.com?subject=Upgrade%20Request';
    this.closeUpgradeModal();
}

    // connectedCallback method called when the element is inserted into a document
    connectedCallback() {
        console.log('this.orgid in connected callback IN  FacilityDataCommunity: ');
        console.log('this.orgid in connected callback : ',this.orgid);
        console.log('this.selectedName in connected callback : ',this.selectedName);
        console.log('this.isFromManageInvoice in connected callback : ',this.isFromManageInvoice);
        console.log('this.createCompanyFacilityId in connected callback : ',this.createCompanyFacilityId);
       // console.log('this.createCompanyFundTrackerId in connected callback : ',this.createCompanyFundTrackerId);
        console.log('this.recordId >>>>', this.recordId);
        this.fetchServices();//manendra
        this.setPageSizeByZoomAndScreen(); // Initial setup
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
        this.facilityIdfromlocalStorage = localStorage.getItem("defaultFacilityId") || "";
        
         orgDetailsCommunity()
            .then(data => {
                console.log('org data in toggle', JSON.stringify(data));

                this.orgDetails = data;
                this.accountingService =
                    this.orgDetails?.Accounting_Services__c || '';

                console.log( 'this.accountingService in connectedCallback:',this.accountingService);
                if (this.accountingService === 'Tesseract System'||  !this.accountingService || this.accountingService.trim() === '') {
                    this.isAccounting = true;
                } else  {
                    this.isAccounting = false;
                }
                console.log( 'this.isAccounting in connectedCallback:',this.isAccounting);
            })
            .catch(error => {
                console.error('Error fetching org details', error);
            });
        this.serviceDate = new Date().toISOString().split('T')[0];
       this.fetchFacilities()
        .then(() => {
            try {
                 if (this.isFromManageInvoice) {
                    console.log('⏭ Skipping localStorage restore (Manage Invoice flow)');
                    return;
                }
                const storedFacilityId = localStorage.getItem('facilityRecordId');
                if (storedFacilityId) {
                    console.log('Restoring facility view from localStorage:', storedFacilityId);
                    this.viewFacilityById(storedFacilityId);
                    //this.loadFacilityRoles(storedFacilityId);
                    this.facilityIdEditIcon = storedFacilityId;
                    this.recordId = storedFacilityId;
                      this.loadFacilityRoles(storedFacilityId);
                    //this.loadFacilityRoles(storedFacilityId);
                    this.facilityIdEditIcon = storedFacilityId;
                    this.recordId = storedFacilityId;
                    console.log(' Json data in connected call back '+JSON.stringify(this.facilityJSONData));

                      const facility = this.facilityJSONData?.[storedFacilityId];

                        // Roles (already computed elsewhere → reuse)
                      //  this.rolesDisplayValue = this.activeRolesDisplay || '';

                        // Services
                        this.servicesDisplayValue = Array.isArray(facility?.services)
                            ? facility.services.join(', ')
                            : '';

                        // Documents
                        this.documentsDisplayValue = facility?.selected_documents ? facility.selected_documents.replaceAll(';', ', ') : '';

                        // Trainings
                        this.trainingsDisplayValue = facility?.selected_trainings ? facility.selected_trainings.replaceAll(';', ', ') : '';


                }
            } catch (err) {
                console.error('Error restoring facility view:', err);
            }
        })
        .catch(error => {
            console.error('Error during fetchFacilities or restoring facility view:', error);
        });

        const activeTab = localStorage.getItem('activeFacilityTab');
        
        // Reset all tabs to false first
        this.facilitydetails = false;
        this.facilityonboard = false;
        this.facilitydocument = false;
        this.facilityidentity = false;
        this.facilitytrainings = false;
        this.facilityshiftcompliance = false;
        this.facilitycompliancereport = false;

        switch (activeTab) {
            case 'details':
                this.facilitydetails = true;
                break;

            case 'onboarding':
                this.facilityonboard = true;
                break;

            case 'document':
                this.facilitydocument = true;
                break;

            case 'identity':
                this.facilityidentity = true;
                break;

            case 'trainings':
                this.facilitytrainings = true;
                break;

            case 'shiftcompliance':
                this.facilityshiftcompliance = true;
                break;

            case 'compliancereport':
                this.facilitycompliancereport = true;
                break;

            case 'bulkentity':
                this.facilityBulkEntity = true;
                break;

            case 'catalogue':
                setTimeout(() => {
                    this.loadCatalogueData();
                    this.loadSelectedCatalogues();
                }, 1000);
                this.facilityCatalogue = true;
                this.facilitydetails = false;
                break;
            default:
                this.facilitydetails = true;
                break;
        }

        // Add responsive listener
        window.addEventListener('resize', this.handleResize.bind(this));

        // Store bound references so we can remove them later
        this._boundHandleClickOutside = this.handleClickOutside.bind(this);
        this._boundHandleResize = this.handleResize.bind(this);

        // Attach listeners
        document.addEventListener('click', this._boundHandleClickOutside);
        window.addEventListener('resize', this._boundHandleResize);
        window.addEventListener('keydown', this.handleKeyShortcut.bind(this));

        // Subscribe to Platform Event
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            this.subscription = response;
        });

        onError(error => {
            // Handle platform event errors if needed
        });        

        // Fetch facility data
        // this.fetchFacilities();
    }
    renderedCallback() {
        if (
            !this.isFromManageInvoice ||
            !this.createCompanyFacilityId ||
            this.autoFacilityOpened
        ) {
            return;
        }

        // 🔑 wait until facilityJSONData exists AND contains the facility
        if (
            this.facilityJSONData &&
            this.facilityJSONData[this.createCompanyFacilityId]
        ) {
            this.autoFacilityOpened = true;

            console.log('🚀 Auto-opening handleviewFacility (data is ready)');

            const fakeEvent = {
                currentTarget: {
                    dataset: {
                        id: this.createCompanyFacilityId
                    }
                }
            };

            this.handleviewFacility(fakeEvent);

            // open bulk entity AFTER view opens
            Promise.resolve().then(() => {
                this.autoOpenBulkEntity();
            });
            // setTimeout(() => {
            //     if (this.autoFacilityOpened) {
            //         this.autoOpenBulkEntity();
            //     }
            // }, 0);
        }
    }
    async autoOpenBulkEntity() {
        console.log('📦 Auto opening Bulk Entity');

        this.facilitydetails = false;
        this.facilityonboard = false;
        this.facilitydocument = false;
        this.facilityidentity = false;
        this.facilitytrainings = false;
        this.facilityshiftcompliance = false;
        this.facilitycompliancereport = false;
        this.facilityCatalogue = false;

        await this.checkCompanyAndEntityExist();
        this.facilityBulkEntity = true;

        console.log('bulkentity', this.facilityBulkEntity);
    }


    disconnectedCallback() {
        // Unsubscribe from platform event
        unsubscribe(this.subscription, () => {
            console.log('Unsubscribed from RefreshDataTable__e');
        });

        window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
        // Remove listeners cleanly
        if (this._boundHandleClickOutside) {
            document.removeEventListener('click', this._boundHandleClickOutside);
        }
        if (this._boundHandleResize) {
            window.removeEventListener('resize', this._boundHandleResize);
        }
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

@wire(getRecord, { recordId: CURRENT_USER_ID, fields: [UserNameFld ,UserEmail,UsrRoleName,UserType,typeOfUser]}) 
     userDetails({error, data}) {
         if (data) {
             this.currentUser = data.fields.Name.value; 
             this.currentUserEmail=data.fields.Email.value;
             this.currentUserRole =data.fields.User_Role__c.value;
             this.userType=data.fields.User_Type__c.value;
             this.typeofuser =data.fields.Type_of_User__c.value;
              console.log('role==>'+this.currentUserRole);
              console.log('current logged in user==>'+this.currentUser) ; 
               console.log('current logged in email==>'+ this.currentUserEmail) ;
              console.log('current logged in userType==>'+ this.userType) ;
                console.log('Fetching facility data from Apex...');
              
                getFacilityData().then(response => {
                    console.log('Facility data fetched successfully:', response);
                    this.finalListFacilities=[];
                    this.selectedFacilities=[];
                    this.facilityOptions = response.map(record => ({
                        label: record.Name,
                        value: record.Id
                    }));
                    if( this.userType =='NDIS Org Admin' || this.userType == 'ICT Admin'){
                        this.finalListFacilities=this.facilityOptions  ;
                           console.log('Mapped facility options: FOR ORG ADMIN', JSON.stringify(this.finalListFacilities));
                           if(this.userType =='NDIS Org Admin'){
                               this.NdisFlag = true;
                           }
                             this.fetchFacilities();
                            
                    }else if((this.userType =='Facility Admin' || this.userType =='HR Admin') ){
                                    if(this.typeofuser =='NDIS') {
                                      this.NdisFlag = true;
                                    }
                              
                                    getFacilityCurrentUser().then(result => {
                                        console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                             this.finalListFacilities =  result.map(record => ({
                                                                        label: record.Facility__r.Name,
                                                                        value: record.Facility__r.Id
                                                               })); 
                                            this.fetchFacilities();
                                           
                                            console.log('Mapped facility options: Facility Admin', JSON.stringify(this.finalListFacilities));
                                        }).catch(error => {
                                            this.error = error;
                                            console.error('Error fetching facilities:', error);
                                 });
                                            
                    }
                                    
                 
                })
                .catch(err => {
                    console.error('Error fetching facility data:', err);
                });

                } else if (error) {  
                        this.usererror = error ;
          }
     }
 //manendra start
fetchServices() {
    console.log('this.recordId in the fetchServices1>>>>', this.recordId);
        getServicesData({ facilityId: this.recordId })
            .then(result => {
                const { allServices, savedServices } = result;
                            this.allServices = allServices.map((svc, index) => {
                    const isChecked = !!savedServices?.includes(svc); // ensures true/false
                    return {
                        id: index,
                        label: svc,
                        checked: isChecked,
                        statusText: isChecked ? 'Active' : 'Inactive',
                        buttonClass: this.getOptionButtonClass(isChecked),
                        badgeClass: this.getBadgeClass(isChecked)
                    };
                });
                console.log('manencrachecked',JSON.stringify(this.allServices));
                 const selected = this.allServices.filter(svc => svc.checked);
                this.servicesDisplayText = selected.length ? selected[0].label : 'Select Services';
            })
            .catch(error => {
                console.error('Error fetching services:', error);
            });
    }
    //     toggleServicesDropdown() {
    //     this.isServicesOpen = !this.isServicesOpen;
    // }

    //  Handle search typing
     handleToggleService(event) {
        const serviceId = parseInt(event.target.dataset.serviceId, 10);
        const isChecked = event.target.checked;

        this.allServices = this.allServices.map(svc => {
            if (svc.id === serviceId) {
                return {
                    ...svc,
                    checked: isChecked,
                    statusText: isChecked ? 'Active' : 'Inactive',
                   // badgeClass: isChecked ? 'badge badge-active' : 'badge badge-inactive'
                   buttonClass: this.getOptionButtonClass(isChecked),
                  badgeClass: this.getBadgeClass(isChecked)
                };
            }
            return svc;
        });

        // Update dropdown placeholder text
          const selected = this.allServices.filter(svc => svc.checked);
                this.servicesDisplayText = selected.length ? selected[0].label : 'Select Services';
    }

    // Get selected services string (for saving)
    get selectedServicesString() {
        return this.allServices
            .filter(svc => svc.checked)
            .map(svc => svc.label)
            .join(';');
    }

    getSelectedServices() {
        return this.allServices
                .filter(svc => svc.checked)
                .map(svc => svc.label)
                .join(';');                  
    }//manendra end */
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

async fetchFacilities() {
    console.log('fetchFacilities is called ');
    try {
        const response = await fetchFacilitiesByOrgId({
            recordId: this.selectedName,
            firstname: this.firstname
        });
        console.log('response from fetchFacilitiesByOrgId :  ',JSON.stringify(response));
        let finalFacilityList = [];

        if (this.userType === 'NDIS Org Admin' || this.userType === 'ICT Admin') {
            finalFacilityList = response;
           
        } else if (
            this.userType === 'Facility Admin' ||
            this.userType === 'HR Admin' ||
            this.userType === 'NDIS Lead'
        ) {
            // 🛠️ FIX: Proper filtering using .filter() instead of .map()
            const facilityIds = this.finalListFacilities.map(f => f.value);
            finalFacilityList = response.filter(rec => facilityIds.includes(rec.Id));
           
        }
         console.log('finalFacilityList in fetchFacilities '+JSON.stringify(finalFacilityList));
        // Set filtered list
        this.refreshTable = finalFacilityList;
        this.records = finalFacilityList;

        // Build JSON data
        this.facilityJSONData = {};
        if (Array.isArray(finalFacilityList)) {
            finalFacilityList.forEach(item => {

                const Trainings_Display = item.Selected_Trainings__c
                    ? item.Selected_Trainings__c.replaceAll(';', ', ')
                    : '';
                
                // console.log(
                //     `Facility: ${item.Name} | Enable Shift Rejection: `,
                //     item.Enable_Shift_Rejection__c
                // );


                this.facilityJSONData[item.Id] = {
                    name: item.Name,
                    street: item.Address__Street__s,
                    city: item.Address__City__s,
                    stateCode: item.Address__StateCode__s,
                    countryCode: item.Address__CountryCode__s,
                    postalCode: item.Address__PostalCode__s,
                    status: item.Status__c,
                    abn: item.ABN__c,
                    useorgabn: item.Use_Org_ABN__c,
                    enableShiftRejection:item.Enable_Shift_Rejection__c,
                    softwareId:item.Software_Id__c,
                    bmsIdentifier:item.BMS_Identifier__c,
                    agentName:item.Agent_Name__c,
                    taxAgency:item.Tax_Agency__c,
                    agentnumber:item.Agent_Number__c,
                    services: item.Services__c ? item.Services__c.split(';') : [],//manendra
                    type_of_service: item.Type_of_Service__c, // This is the picklist field
                    selected_documents: item.Selected_Documents__c || '',
                    selected_trainings: item.Selected_Trainings__c || '',
                    shiftPenaltyMode:item.Shift_Penalty_Mode__c || 'SCHADS'
                    //DisplayTrainings: item.Trainings_Display || ''

                };
            });
           // this.noRecordsFlag = true;
        } else {
            //this.noRecordsFlag = false;
        }

        this.totalRecords = finalFacilityList.length;
        if(this.totalRecords>0) {
        this.noRecordsFlag=false;
        }else{
        this.noRecordsFlag=true;
        }  
        this.visible = this.totalRecords > 6;
        this.paginationHelper();
        this.applyFilters();
        this.facEditFlag = false;

        // ✅ Return filtered list (if needed in another call)
        return finalFacilityList;

    } catch (error) {
        console.error('❌ Error fetching facilities:', error);
        throw error;
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
     
    filterState = 'All';
    @track filteredRecords = [];
    handleToggleUsers() {
        // Cycle through the filter states
        if (this.filterState === 'All') {
            this.filterState = 'Active';
        } else if (this.filterState === 'Active') {
            this.filterState = 'Inactive';
        } else {
            this.filterState = 'All';
        }
        console.log('total records'+JSON.stringify(this.refreshTable));
        // Apply filtering logic based on the filter state
        if (this.filterState === 'Active') {
            this.facilitylabel='Active';
            this.filteredRecords = this.refreshTable.filter(record => record.Status__c === true );
            
        } else if (this.filterState === 'Inactive') {
             this.facilitylabel='Inactive';
            this.filteredRecords = this.refreshTable.filter(record => record.Status__c === false );
        } else {
            this.facilitylabel='All';
            this.filteredRecords = [...this.refreshTable]; // Show all users
        }
    
        // Update total records and handle pagination
        this.records = this.filteredRecords;
        this.totalRecords = this.filteredRecords.length;
        console.log('total records'+this.totalRecords);
        //this.noRecordsFlag = this.totalRecords === 0;
        this.paginationHelper();
    }
  

    handleRecordsPerPage(event) {
        this.pageSize = event.target.value;
        this.paginationHelper();
    }
    confirmAbn(){
        this.handleAbnFlag=true;
    }
    handlecloseAbn(){
        this.handleAbnFlag=false;
        setTimeout(() => {
        const abnInput = this.template.querySelector('[data-id="abnInput"]');
        if (abnInput) {
            abnInput.focus();
        }
    }, 0);
      this.useOrgAbn = false; 
      this.abnfield = false;
        this.refreshPayrollSettinggs();
        this.disablePayrollSettingValue=false;
        this.bmsIdButtonDisable=false;
        this.disablePayrollSettingValue=false;
        this.softwareButtonDisbale=false;
    }
    @track ABN;
    @track useOrgAbn = false;
    @track abnfield = false;
   async  handleOrgAbnToggle(event) {
        this.useOrgAbn = event.target.checked;
        if (this.useOrgAbn) {
            this.handleAbnFlag=true;
            const data = await orgDetailsCommunity();
            console.log('org data in toggle  '+JSON.stringify(data))
            this.orgDetails = data;
            this.softwareIDValue = this.orgDetails.SoftwareId__c || '';

            this.agentName = this.orgDetails.Agent_Name__c || '';
            this.BMSIDValue = this.orgDetails.BMSI_Identifier__c || '';
            this.taxAgency = this.orgDetails.Tax_Agency__c || '';

            this.taxAgencyNumber = this.orgDetails.Agent_Number__c || '';
            this.disablePayrollSettingValue=true;
             this.bmsIdButtonDisable=true;
             this.softwareButtonDisbale=true;
             // this.generalShiftEndTime=this.orgDetails.General_Shift_End_Time__c ;
          


        } else {
            this.ABN = ''; // or retain existing value if needed
            setTimeout(() => {
                this.template.querySelector('[data-id="abnInput"]').focus();
            }, 0); // Ensure focus after re-render
            this.abnfield = false;
             this.ABNNumber =  '';
            this.BMSIDValue =  '';
            this.softwareIDValue = '';

            this.agentName =  '';
            this.BMSIDValue =  '';
            this.taxAgency = '';

            this.taxAgencyNumber ='';
             this.bmsIdButtonDisable=false;
            this.disablePayrollSettingValue=false;
            this.softwareButtonDisbale=false;
            this.refreshPayrollSettinggs();
        }
       
    }
 
refreshPayrollSettinggs(){
        this.ABNNumber =  '';
        this.BMSIDValue =  '';
        this.softwareIDValue = '';

        this.agentName =  '';
        this.BMSIDValue =  '';
        this.taxAgency = '';

        this.taxAgencyNumber ='';
}

    handleAbn(){
        this.ABN = this.orgAbn;
        this.handleAbnFlag = false;
        this.abnfield = true;
        const abnInput = this.template.querySelector('[data-id="abnInput"]');
    if (abnInput) {
        abnInput.blur(); // workaround to refresh
        abnInput.focus();
    }
    }
     handleAbnChange(event) {
        const input = event.target;
        this.ABN = input.value;
        console.log('Updated ABN:', this.ABN);
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
        }

    // ✅ ADD THIS BELOW
    this.recordsToDisplay = this.recordsToDisplay.map(fac => {
        let status = (fac.facility_status__c || '').toLowerCase();

        return {
            ...fac,
            statusClass:
                status === 'active'
                    ? 'status-pill status-active'
                    : 'status-pill status-inactive'
        };
    });        
        refreshApex(this.refreshTable); 
        
    }

   
    // create a new facility
    async handleCreateNewFacility() {
        this.currentStep = 'createstep1';

        console.log('Checking facility limit...');

        try {
            const limitReached = await isFacilityLimitReached();
            console.log('Facility limit reached:', limitReached);

         
            if (limitReached) {
                this.facEditFlag = false;
                this.showUpgradeModal = true;
                return;

            } else {

                // ✅ IF FALSE → CONTINUE YOUR EXISTING CODE
                this.facEditFlag = true;
                this.fieldErrorMap = {};
                this.successMessage = 'Facility created successfully.';
                this.recordId = '';
                this.ABN ='';
                this.useOrgAbn = false;
                this.enableShiftRejection=false;
                this.headeringName = 'Create New ' + this.facilityPreferredName;
                this.name='';
                this.street ='';
                this.city ='';
                this.country ='';
                this.province ='';
                this.postalcode =''; 
                this.buttonName = 'Save';
                this.errorMessage = '';
                this.fileName='';
                this.bmsIdButtonDisable=false;
                this.disablePayrollSettingValue=false;
                this.softwareButtonDisbale=false;
                this.isBMSIDDisbale=true;
                this.toggleValue=true;
                this.shiftPenaltyMode='SCHADS';
                console.log('toggleValue', this.toggleValue);

                this.refreshPayrollSettinggs();

                this.selectedOption = null;
                this.newOptionText = '';
                this.servicesDisplayText = 'Select Services';

                this.allServices = this.allServices.map(service => ({
                    ...service,
                    checked: false,
                    isActive: false,
                    buttonClass: this.getOptionButtonClass(false),
                    badgeClass: this.getBadgeClass(false),
                    statusText: 'Inactive'
                }));

                this.trainingsList = this.trainingsList.map(tr => ({
                    ...tr,
                    checked: false,
                    statusText: 'Inactive',
                    buttonClass: 'option-button',
                    badgeClass: 'badge badge-inactive'
                }));

                this.trainingsDisplayText = "Select Trainings";
                this.selectedTrainings = [];

                this.documentsList = this.documentsList.map(doc => ({
                    ...doc,
                    checked: false,
                    statusText: 'Inactive',
                    buttonClass: 'option-button',
                    badgeClass: 'badge badge-inactive'
                }));

                this.documentsDisplayText = "Select Documents";
                this.selectedDocuments = [];
            }

        } catch (error) {
    console.error('FULL ERROR:', error);
    console.error('ERROR STRING:', JSON.stringify(error));
    console.error('ERROR BODY:', error?.body);
    console.error('ERROR MESSAGE:', error?.body?.message);
    console.error('STACK:', error?.body?.stackTrace);

    this.showToast(
        'Error',
        error?.body?.message || 'Something went wrong while checking limit.',
        'error'
    );
}
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

    get NDISProviderClass() {
        return this.getFieldClass('NDIS_Provider__c');
    }
     get ContactNumberClass() {
        return this.getFieldClass('Contact_No__c');
    }

    get isDesktop() {
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    get isDesktop() {
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    @track facviewFlag = false;
    @track facFlag = true;
    @track facilityflag = false;
    @track facilityeditflag = false;
    /* handleviewFacility(event){
        let facId = event.currentTarget.dataset.id;
         console.log('[Facility] click -> dataset.id =', facId, '| typeof =', typeof facId);
         this.viewFacilityById(facId);
    } */

    handleviewFacility(event) {
        let facId = event.currentTarget.dataset.id;
        console.log('[Facility] click -> dataset.id =', facId, '| typeof =', typeof facId);
        let facilityName = event.currentTarget.dataset.facilityname; 
        console.log('Facility Name:', facilityName);

        this.facilityname = facilityName;
         console.log('this.facilityname in view:', this.facilityname );

        this.viewFacilityById(facId);
        console.log('facilityJSONData in view :',JSON.stringify(this.facilityJSONData));
        // ✅ SAFE UI display mapping (no logic change)
        const facility = this.facilityJSONData?.[facId];
        console.log('facility in view :',JSON.stringify(facility));

        // Roles (already computed elsewhere → reuse)
        this.rolesDisplayValue = this.activeRolesDisplay || '';

        // Services
        this.servicesDisplayValue = Array.isArray(facility?.services)
            ? facility.services.join(', ')
            : '';

        // Documents
        this.documentsDisplayValue = facility?.selected_documents
            ? facility.selected_documents.replaceAll(';', ', ')
            : '';

        // Trainings
        this.trainingsDisplayValue = facility?.selected_trainings
            ? facility.selected_trainings.replaceAll(';', ', ')
            : '';

        this.facilityIdEditIcon = facId;

        console.log('this.facilityIdEditIcon  >>>>>>', this.facilityIdEditIcon);


        // Fetch Facility Roles from Apex
        this.loadFacilityRoles(facId);
        this.loadCatalogueData();
        this.loadSelectedCatalogues();
    }

    loadFacilityRoles(facilityId) {
        getFacilityRoles({ facilityId })
            .then(data => {
                console.log('✅ Facility Roles fetched:', JSON.stringify(data, null, 2));

                if (data && data.length > 0) {
                    this.options = data.map(option => ({
                        id: option.Id,
                        label: option.Role_Name__c,
                        checked: option.Is_Active__c,
                        isActive: option.Is_Active__c,
                        toggleId: `toggle-${option.Id}`,
                        buttonClass: this.getOptionButtonClass(option.Is_Active__c),
                        badgeClass: this.getBadgeClass(option.Is_Active__c),
                        statusText: option.Is_Active__c ? 'Active' : 'Inactive',
                        isDisabled: !option.Is_Active__c
                    }));

                    // Select first active option by default
                    const activeOption = this.options.find(opt => opt.isActive);
                    this.selectedOption = activeOption ? activeOption : null;
                    this.activeRolesDisplay = this.options
    .filter(opt => opt.checked || opt.isActive) // ✅ show only active ones
    .map(opt => opt.label)
    .join(', ') || 'No Active Roles';
                    console.log('this.options after mapping =====>', JSON.stringify(this.options, null, 2));
                } else {
                    this.options = [];
                    this.selectedOption = null;
                }
                  if (this.facilityJSONData[facilityId] && this.facilityJSONData[facilityId].services) {
                const selectedServices = this.facilityJSONData[facilityId].services;

                this.allServices = this.allServices.map(service => {
                    const isSelected = selectedServices.includes(service.label);
                    return {
                        ...service,
                        checked: isSelected,
                        isActive: isSelected,
                        buttonClass: this.getOptionButtonClass(isSelected),
                        badgeClass: this.getBadgeClass(isSelected),
                        statusText: isSelected ? 'Active' : 'Inactive'
                    };
                });

                console.log('this.allServices after mapping:', JSON.stringify(this.allServices, null, 2));
            }//manendra
            })
            .catch(error => {
                console.error('❌ Error fetching Facility Roles:', error);
                this.showToast('Error', 'Failed to load Facility Roles', 'error');
            });
  
        }
       
    viewFacilityById(facId) {
        console.log('[Facility] click -> facId =', facId);
        const facilityData = this.facilityJSONData[facId];
        console.log('facilityData: ',JSON.stringify(facilityData));
        if (!facilityData) {
            console.warn(`⚠️ Facility data not found for ID: ${facId}. Skipping view setup.`);
            
            // Optional: remove stale ID from localStorage to avoid repeat errors
            localStorage.removeItem('facilityRecordId');
            return;
        }
        this.recordId=facId;
        this.facEditFlag=false;
        this.facviewFlag = true;
        this.name = facilityData.name;
        this.street = facilityData.street;
        this.city = facilityData.city;
        this.country = facilityData.countryCode;
        this.province = facilityData.stateCode;
        this.postalcode = facilityData.postalCode;
        this.status = facilityData.status;
        this.ABN = facilityData.abn;
        this.useOrgAbn = facilityData.useorgabn;
        this.enableShiftRejection=facilityData.enableShiftRejection;
        this.shiftPenaltyMode= facilityData.shiftPenaltyMode;
        console.log('enableShiftRejection in view : '+this.enableShiftRejection);

        console.log('status'+this.status);
        this.toggleValue = this.status;
        console.log('toggleValue'+this.toggleValue);
        this.cardFlag = false;
        this.listFlag = false;
        this.facFlag = false;
        this.facilityflag = true;
        this.facilityeditflag = false;
        localStorage.setItem('facilityRecordId', this.recordId);
        console.log('facilityRecordId Stored in localStorage:', this.recordId);
    }

    async handleEdit(event) {
        this.currentStep = 'step1';
    console.group('📝 === handleEdit START ===');
    console.log('enableShiftRejection in Edit1:', this.enableShiftRejection);

    let facId = event.currentTarget.dataset.id;
    console.log('🎯 Facility ID:', facId);

    this.loadFacilityRoles(facId);
    this.fieldErrorMap = {};
    this.successMessage = 'Facility updated successfully.';

    // Show edit UI immediately
    this.facilityflag = true;
    this.facilityeditflag = true;
    this.SIL = true;
    try {
        // Wait for facility data to load
        await this.fetchFacilities();
        await this.fetchServices();
        console.log('✅ Data fetched');

        const facility = this.facilityJSONData[facId];
        console.log('facility',JSON.stringify(facility));

        if (!facility) {
            console.error('❌ Facility not found for ID:', facId);
            console.groupEnd();
            return;
        }

        console.log('📊 Facility Data:', {
            name: facility.name,
            type_of_service: facility.type_of_service,
            selected_documents: facility.selected_documents,
            services: facility.services,
            selected_trainings: facility.selected_trainings || facility.Selected_Trainings__c,
            shiftPenaltyMode :facility.shiftPenaltyMode
        });

        // Set basic facility info
        this.name = facility.name;
        this.street = facility.street;
        this.city = facility.city;
        this.country = facility.countryCode;
        this.province = facility.stateCode;
        this.postalcode = facility.postalCode;
        this.status = facility.status;
        this.ABN = facility.abn;
        this.useOrgAbn = facility.useorgabn;
        this.enableShiftRejection=facility.enableShiftRejection;
        this.abnfield = this.useOrgAbn;
        this.fileName = '';
        this.BMSIDValue = facility.bmsIdentifier;
        this.softwareIDValue = facility.softwareId;
        this.agentName = facility.agentName;
        this.taxAgency = facility.taxAgency;
        this.taxAgencyNumber = facility.agentnumber;
        this.shiftPenaltyMode=facility.shiftPenaltyMode;
        this.toggleValue=facility.status;
        this.originalToggleValue = facility.status;
        console.log(' this.toggleValue', this.toggleValue)

        // Set button states
        this.bmsIdButtonDisable = !!(facility.bmsIdentifier && facility.bmsIdentifier.trim());
        this.softwareButtonDisbale = !!(facility.softwareId && facility.softwareId.trim());
        this.isBMSIDDisbale = true;
        this.disablePayrollSettingValue = this.useOrgAbn;
        console.log('enableShiftRejection in Edit2:', this.enableShiftRejection);

        // CRITICAL: Handle Type of Service and Documents + Trainings
        console.log('📄 Setting up Type of Service, Documents and Trainings...');

        // Step 1: Check if we have Type_of_Service in facility data
        if (facility.type_of_service) {
            console.log('✅ Type of Service found:', facility.type_of_service);

            // Step 2: Update documents list based on service type
            this.updateDocumentsList(facility.type_of_service);

            // Step 3: Update trainings list based on service type
            this.updateTrainingsList(facility.type_of_service);

            // Step 4: Check for saved documents
            if (facility.selected_documents && facility.selected_documents.trim() !== '') {
                console.log('✅ Saved documents found:', facility.selected_documents);

                // Split saved documents
                const savedDocsArray = facility.selected_documents.split(';').map(doc => doc.trim());
                console.log('📋 Saved documents array:', savedDocsArray);

                // Update documentsList with checked status
                this.documentsList = this.documentsList.map(doc => {
                    const isChecked = savedDocsArray.includes(doc.label);

                    console.log(`🔍 Document "${doc.label}": ${isChecked ? '✅ CHECKED' : '❌ NOT CHECKED'}`);

                    return {
                        ...doc,
                        checked: isChecked,
                        statusText: isChecked ? 'Active' : 'Inactive',
                        buttonClass: isChecked ? 'option-button-selected' : 'option-button',
                        badgeClass: isChecked ? 'badge badge-active' : 'badge badge-inactive'
                    };
                });

                // Update display text
                const selectedCount = this.documentsList.filter(d => d.checked).length;
                this.documentsDisplayText = selectedCount > 0
                    ? `${selectedCount} selected`
                    : "Select Documents";

                console.log('🏷️ Documents display text updated to:', this.documentsDisplayText);

            } else {
                console.log('⚠️ No saved documents found');
                this.documentsDisplayText = "Select Documents";
            }

            // Step 5: Check for saved trainings (support multiple possible keys)
            const rawSavedTrainings = (
                facility.selected_trainings ||
                facility.selectedTrainings ||
                facility.Selected_Trainings__c ||
                ''
            );

            if (rawSavedTrainings && rawSavedTrainings.trim() !== '') {
                console.log('✅ Saved trainings found:', rawSavedTrainings);

                const savedTrainingsArray = rawSavedTrainings.split(';').map(t => t.trim());
                console.log('📋 Saved trainings array:', savedTrainingsArray);

                // Update trainingsList with checked status
                this.trainingsList = this.trainingsList.map(tr => {
                    const isChecked = savedTrainingsArray.includes(tr.label);

                    console.log(`🔍 Training "${tr.label}": ${isChecked ? '✅ CHECKED' : '❌ NOT CHECKED'}`);

                    return {
                        ...tr,
                        checked: isChecked,
                        statusText: isChecked ? 'Active' : 'Inactive',
                        buttonClass: isChecked ? this.getOptionButtonClass(true) : this.getOptionButtonClass(false),
                        badgeClass: isChecked ? this.getBadgeClass(true) : this.getBadgeClass(false)
                    };
                });

                // Keep selectedTrainings as array of objects (matching your other code)
                this.selectedTrainings = this.trainingsList.filter(t => t.checked);

                // Update display text
                const selectedTrainingsCount = this.trainingsList.filter(t => t.checked).length;
                this.trainingsDisplayText = selectedTrainingsCount > 0
                    ? `${selectedTrainingsCount} selected`
                    : "Select Trainings";

                console.log('🏷️ Trainings display text updated to:', this.trainingsDisplayText);

            } else {
                console.log('⚠️ No saved trainings found');
                this.trainingsDisplayText = "Select Trainings";
                this.selectedTrainings = [];
            }

        } else {
            console.warn('⚠️ No Type of Service found. Documents & Trainings dropdowns will not be populated.');
            this.documentsList = [];
            this.documentsDisplayText = "Select Documents";

            this.trainingsList = [];
            this.trainingsDisplayText = "Select Trainings";
            this.selectedTrainings = [];
        }

        // Handle Services
        const selectedServices = facility.services || [];
        console.log('🛠️ Services to select:', selectedServices);

        if (this.allServices && this.allServices.length > 0) {
            this.allServices = this.allServices.map(service => {
                const isSelected = selectedServices.includes(service.label);
                console.log(`🔍 Service "${service.label}": ${isSelected ? '✅ SELECTED' : '❌ NOT SELECTED'}`);

                return {
                    ...service,
                    checked: isSelected,
                    isActive: isSelected,
                    buttonClass: this.getOptionButtonClass(isSelected),
                    badgeClass: this.getBadgeClass(isSelected),
                    statusText: isSelected ? 'Active' : 'Inactive'
                };
            });

            const selectedServiceItems = this.allServices.filter(svc => svc.checked);
            this.servicesDisplayText = selectedServiceItems.length ? selectedServiceItems[0].label : 'Select Services';
            console.log('✅ Services updated, display:', this.servicesDisplayText);
        }

        console.log('📊 Final state:', {
            type_of_service: facility.type_of_service,
            documentsListLength: this.documentsList.length,
            documentsDisplayText: this.documentsDisplayText,
            checkedDocuments: this.documentsList.filter(d => d.checked).map(d => d.label),
            trainingsListLength: this.trainingsList.length,
            trainingsDisplayText: this.trainingsDisplayText,
            checkedTrainings: this.trainingsList.filter(t => t.checked).map(t => t.label)
        });

    } catch (error) {
        console.error('❌ Error in handleEdit:', error);
        console.error('Error stack:', error.stack);
    }

    console.groupEnd();
}

    handleClose(event){
        console.log('hi');
        this.facilityflag = true;
        this.facilityeditflag = false;
        this.bmsIdButtonDisable=false;
        this.disablePayrollSettingValue=false;
        this.softwareButtonDisbale=false;
        console.log('this.originalToggleValue',this.originalToggleValue);
        this.toggleValue = this.originalToggleValue;
        console.log('this.toggleValue',this.originalToggleValue);
        this.refreshPayrollSettinggs();
        this.allServices = this.allServices.map(service => ({
            ...service,
            checked: false,
            isActive: false,
            buttonClass: this.getOptionButtonClass(false),
            badgeClass: this.getBadgeClass(false),
            statusText: 'Inactive'
        }));//manendra
        this.resetSteps();
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
           /*  console.log('event detail'+JSON.stringify(event.detail)); */ 
            this.street=event.detail.street;
            this.city=event.detail.city;
            this.postalcode=event.detail.postalCode;
            this.province=event.detail.province;
            this.country=event.detail.country;
           /*  console.log('poscid', this.province);
            console.log('poscid2', this.postalcode);
            console.log('poscid3', this.city);
           */

        }

    }

    handleeditClose(){
        this.facEditFlag=false;
        this.bmsIdButtonDisable=false;
        this.disablePayrollSettingValue=false;
        this.softwareButtonDisbale=false;
        this.options = [];
        
        this.refreshPayrollSettinggs();
    }
    @track handleStatusFlag=false;
    @track facId;
    @track facstatus;
    @track message;
    @track originalToggleState;
    @track toggleElement; 
    @track facilityname;
    @track disablePayrollSettingValue =false;
    
    // handlefacStatus(event) {
    //     this.handleStatusFlag = true;

    //     const dataset = event.currentTarget.dataset;

    //     this.toggleElement = event.currentTarget;
    //     this.facId = dataset.id;
    //     this.facstatus = dataset.name;
    //     this.originalToggleState = this.facstatus;
    //     this.facilityname = dataset.facilityname;

    //     if (this.facstatus === 'true') {
    //         this.finalStatus = 'false';
    //         this.message = 'Facility is Inactive';
    //     } else if (this.facstatus === 'false') {
    //         this.finalStatus = 'true';
    //         this.message = 'Facility is Active';
    //     }
    // }
     async  handlefacStatus(event) {

        const dataset = event.currentTarget.dataset;

        this.toggleElement = event.currentTarget;
        this.facId = dataset.id;
       this.facstatus = dataset.name;
      this.originalToggleState = this.facstatus;
      this.facilityname = dataset.facilityname;

         if (this.facstatus === 'true') {
           this.finalStatus = 'false';
           this.message = 'Facility is Inactive';
        } else if (this.facstatus === 'false') {
            this.finalStatus = 'true';
            this.message = 'Facility is Active';
        }
        
        try {
            const result = await checkActiveStaffAndParticipants({
                facilityId: this.facId
            });

           const participantCount = result.participants || 0;
           const staffCount = result.staff || 0;

            console.log('Participants:', participantCount);
             console.log('Staff:', staffCount);

             if (participantCount > 0 || staffCount > 0) {

              this.hasFutureShifts = true;
              this.handleStatusFlag = false;

              this.staffClientCountMessage =
                    `Participants: ${participantCount},  Staff: ${staffCount}`;

           } else {

                this.hasFutureShifts = false;
               this.handleStatusFlag = true;
            }

        } catch (error) {
            console.error('Error:', error);
        }
     }

     /*async  handlefacStatus(event) {

        const dataset = event.currentTarget.dataset;

        this.toggleElement = event.currentTarget;
        this.facId = dataset.id;
        this.facstatus = dataset.name;
        this.originalToggleState = this.facstatus;
        this.facilityname = dataset.facilityname;

      
        if (this.facstatus === 'false') {
            this.finalStatus = 'true';
            this.message = 'Facility is Active';
            try {
                const limitReached = await isFacilityLimitReached();
                console.log('Facility limit reached:', limitReached);

                if (limitReached) {
                    this.showUpgradeModal = true;
                    this.finalStatus = 'false';
                    this.handleStatusFlag = false;
                    return;
                }

            } catch (error) {
                this.finalStatus = 'false';
                console.error('Error checking limit:', error);
                return;
            }
        } else   if (this.facstatus === 'true') {
            this.finalStatus = 'false';
            this.message = 'Facility is Inactive';
       
            try {
                const result = await checkActiveStaffAndParticipants({
                    facilityId: this.facId
                });

                const participantCount = result.participants || 0;
                const staffCount = result.staff || 0;

                console.log('Participants:', participantCount);
                console.log('Staff:', staffCount);

                if (participantCount > 0 || staffCount > 0) {

                    this.hasFutureShifts = true;
                    this.handleStatusFlag = false;
                    this.finalStatus = 'true';
                    this.staffClientCountMessage =
                        `Participants: ${participantCount},  Staff: ${staffCount}`;

                } else {

                    this.hasFutureShifts = false;
                    this.handleStatusFlag = true;
                }

            } catch (error) {
                this.finalStatus = 'true';
                console.error('Error:', error);
            }
        }
    }*/


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


/*   handlestatuschange() {
    statusFacility({ IdValue: this.facId, status: this.finalStatus }).then(response => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: '',
                message: this.message,
                variant: 'success'
            })
        );

        this.handleStatusFlag = false;
       
          this.facEditFlag = false;
            this.fetchFacilities();
    });
     
} */
    
    handlestatuschange() {//MODIFED BY MANENDRA FOR DUPLICATE FACILITY CHECK
    statusFacility({ IdValue: this.facId, status: this.finalStatus })
    .then(response => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: this.message,
                variant: 'success'
            })
        );

        this.handleStatusFlag = false;
        this.fetchFacilities();
    })
    .catch(error => {
        console.error('ERROR:', JSON.stringify(error));

        let message = 'Error updating facility';

        if (error?.body?.pageErrors?.length) {
            message = error.body.pageErrors[0].message;
        }

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );
    });
    }

    handleFutureShiftClose(){
            
        this.hasFutureShifts=false;  
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
    servicesList(event){       
        this.isServiceModel=true;
        this.facilityName=event.currentTarget.dataset.name;
    }
    closeservicesList(){
       this.isServiceModel=false;
    }
    //changes made by maheswari code start
    handleClear() {
        let listOfsearchString = [];
        this.firstname = '';
        this.fetchFacilities();
    }
    
   

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            const inputs = this.template.querySelectorAll('lightning-input');
            let listOfsearchString = [];

            inputs.forEach((element) => {
                if (element.name === 'fname') {
                    this.firstname = element.value;
                    listOfsearchString.push(element.value);
                }
            });

             this.fetchFacilities(); // your method to call Apex or filter results
        }
    }



    handleSubmit(event){
        // console.log('in submit');
        console.log("✅ Updated options:", JSON.stringify(this.options));
        event.preventDefault();// stop the form from submitting

        const selectedRoles = this.options?.filter(opt => opt.checked) || [];
        const selectedDocs = this.documentsList
            .filter(d => d.checked)
            .map(d => d.label)
            .join(';');
        event.detail.fields.Selected_Documents__c = selectedDocs;
        event.detail.fields.Selected_Trainings__c = this.selectedTrainingsString;
        if (selectedRoles.length === 0 && this.NdisFlag == true) {
            this.rolesError = true; // inline error in template
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please add at least one Role',
                    variant: 'error'
                })
            );
            console.warn('❌ No roles selected. Aborting save.');
            return;
        } else {
            this.rolesError = false;
        }

        const selectedServices = this.allServices?.filter(svc => svc.checked) || [];
        if (selectedServices.length === 0 && this.NdisFlag == true) {
            this.servicesError = true; // Show inline error if you added <div if:true={servicesError}>
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select at least one Service',
                    variant: 'error'
                })
            );
            console.warn('❌ No services selected. Aborting save.');
            return; // Stop further processing
        } else {
            this.servicesError = false; // Clear error
        }//manendra
         this.showSpinner=true;
         const fields = event.detail.fields;
         let phone = fields.Phone__c;
         console.log('Original phone value:', phone);
         // Check if phone number starts with '0'
         if (phone && phone.charAt(0) !== '0') {
             console.log('Phone does not start with 0, appending 0...');
             phone = '0' + phone; // Append '0' if it doesn't start with '0'
         } else {
             console.log('Phone already starts with 0, no change needed.');
         }
 
         // Update the phone field with the modified value
         fields.Phone__c = phone;
         fields.Use_Org_ABN__c = this.useOrgAbn;
         fields.Enable_Shift_Rejection__c=this.enableShiftRejection;
         fields.ABN__c = this.ABN;
         console.log('Updated phone value:', fields.Phone__c);
         // alert(JSON.stringify(fields));
         fields.Address__Street__s = this.street;
         fields.Address__City__s =  this.city;
         fields.Address__StateCode__s = this.province;
         fields.Address__CountryCode__s = 'AU';
         fields.Address__PostalCode__s = this.postalcode;
         fields.Status__c = this.toggleValue;
        fields.Services__c = this.getSelectedServices();
        console.log('fields.Services__c set to:', fields.Services__c);


         // fields.Pre_Tax_Calculator__c = this.preTaxForSubmit;
         console.log('After fields>>'+JSON.stringify(fields));
         const fullAddress = `${this.street}, ${this.city} ${this.postalcode}, AU`;
        const apiKey = GOOGLE_API_KEY;
        console.log('Fetching geocode for:', fullAddress);
        
        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
    
        console.log('Fetching geocode for:', fullAddress);
        this.showSpinner=false;
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
                this.showSpinner=false;
                console.error('Error calling Geocode API:', error);
                // Submit form even if geocode failed
                this.template.querySelector('lightning-record-edit-form').submit(fields);
                
            });
           // this.clearFieldErrors();
            this.showSpinner=false;
    }
    handleSuccess(event) {
        this.facEditFlag = false;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: this.successMessage,
                variant: 'success'
            })
        );
        let staffRecID = event.detail.id;
        this.ABN = '';
        this.nameError = false;
        this.phoneFlag = false;
        this.cardFlag = true;
        this.facEditFlag = false;
        this.facviewFlag = false;
        this.facFlag = true;
        console.log('✅ Saved Record Id:', staffRecID);

        // 👉 Call Apex to save options + staffRecID
        if (this.options && this.options.length > 0) {
            console.log(
                '📤 Sending options + staffRecID to Apex:',
                staffRecID,
                JSON.stringify(this.options)
            );
            savefacilityRoles({ facilityId: staffRecID, options: this.options })
                .then(result => {
                    console.log('✅ Options saved in Apex:', result);
                })
                .catch(error => {
                    console.error('❌ Error saving options:', error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message:
                                error.body?.message ||
                                'Failed to save facility roles',
                            variant: 'error'
                        })
                    );
                });
        } else {
            console.log('⚠️ No options to save.');
        }

        // 👉 File upload if present
        if (this.fileName.length > 0) {
            uploadFile({
                base64: JSON.stringify(this.base64FileData),
                filename: this.fileName,
                recordId: staffRecID,
                obj: 'facility'
            }).then(result => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.fileName + ' - Uploaded Successfully!!!',
                        variant: 'success'
                    })
                );
            });
        }

        this.options = [];
        // 👉 Finish with spinner + reload if needed
        setTimeout(() => {
            this.showSpinner = false;
            this.fetchFacilities();
        }, 1500);

        if (
            this.facilityNameEdited ||
            this.participantNameEdited ||
            this.staffNameEdited
        ) {
            window.location.reload();
        } else {
            console.log('Updated without preferred name change');
        }
        this.resetSteps();
    }
    @track errorMessage = '';
    @track saveButtonDisable = false;
    
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
        // console.log('fileName>>',this.fileName);
        // console.log('file prepared');
        
        
        
    }  
    handleChange(event) {
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        event.target.value = inputValue;
    }

    @track cardFlag=true;
    @track listFlag=false;
    handleBack(event){
        console.log('handleBack method triggered');
        console.log('Removing facilityRecordId and activeFacilityTab from localStorage');
        this.selectedServiceType = '';
        
        localStorage.removeItem('facilityRecordId');
        localStorage.removeItem('activeFacilityTab');
        
        console.log('Updating component flags:');
        console.log('cardFlag: true');
        this.cardFlag=true;
        
        console.log('facEditFlag: false');
        this.facEditFlag=false;
        
        console.log('facviewFlag: false');
        this.facviewFlag=false;
        
        console.log('facFlag: true');
        this.facFlag=true;
        
        console.log('facilitydetails: true');
        this.facilitydetails=true;
        
        console.log('facilityonboard: false');
        this.facilityonboard=false;
        this.facilitydocument=false;
        this.facilityidentity=false;
        this.facilitytrainings=false;
        this.facilityshiftcompliance=false;
        this.facilitycompliancereport=false;
        this.facilityBulkEntity=false;
        this.facilityCatalogue = false;
        
        // This line appears twice in your original code, keeping it once
        this.facilityonboard=false;
        this.options = [];       
        if (this.isFromManageInvoice) {
            console.log('🔼 Dispatching createcompanyback (Manage Invoice flow)');
            this.dispatchEvent(
                new CustomEvent('createcompanyback', {
                    bubbles: true,
                    composed: true
                })
            );
        }
 
        console.log('handleBack method completed');
    }

    get cardViewClass(){
        return this.cardFlag ? 'slds-box slds-size_1-of-6 slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-6 slds-align_absolute-center'; // you can use your custom class here.
        //'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse' : 'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse'
    }

    get listViewClass(){
        return this.listFlag ? 'slds-box slds-size_1-of-6 slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-6 slds-align_absolute-center'; // you can use your custom class here.
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
    
    

firstname = '';
activeFilterOn = true;
inactiveFilterOn = false;
handleSearchInput(event) {
    this.firstname = event.target.value || '';
    console.log(' this.firstname', this.firstname);
    this.applyFilters();
}

handleSearchKeyPress(event) {
    this.firstname = event.target.value;
    console.log(' this.firstname', this.firstname);
    this.fetchFacilities();
    //this.applyFilters();
}

handleClear() {
    this.firstname = '';
    this.applyFilters();
}
handleActiveToggle() {
    if (this.activeFilterOn) {
        this.activeFilterOn = false; // turn off
    } else {
        this.activeFilterOn = true;
        this.inactiveFilterOn = false;
    }
    this.applyFilters();
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
        
        
        // 4. Show all errors as a toast
         this.dispatchEvent(
            new ShowToastEvent({
                title: 'Update Failed',
                message: message,
                variant: 'error',
            
            })
        ); 
    }
 handleError1(event) {
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
        message = errorMessages.join('\n')

    // Show toast
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Update Failed',
            message: message,
            variant: 'error',
            
        })
    );
}

handleInactiveToggle() {
    if (this.inactiveFilterOn) {
        this.inactiveFilterOn = false; // turn off
    } else {
        this.inactiveFilterOn = true;
        this.activeFilterOn = false;
    }
    this.applyFilters();
}

applyFilters() {
    let result = [...this.refreshTable];

    // 🔍 General text search across Name, Phone, Services, Email
    if (this.firstname && this.firstname.trim() !== '') {
        const searchKey = this.firstname.toLowerCase();

        result = result.filter(fac => {
            const nameMatch = fac.Name && fac.Name.toLowerCase().includes(searchKey);
            const phoneMatch = fac.Phone__c && fac.Phone__c.toLowerCase().includes(searchKey);
            const servicesMatch = fac.Services__c && fac.Services__c.toLowerCase().includes(searchKey);
            const emailMatch = fac.Email__c && fac.Email__c.toLowerCase().includes(searchKey);

            // Return true if any of the above matches
            return nameMatch || phoneMatch || servicesMatch || emailMatch;
        });
    }

    // ✅ Active/Inactive filter logic (unchanged)
    if (this.activeFilterOn && !this.inactiveFilterOn) {
        result = result.filter(fac => fac.Status__c === true);
    } else if (this.inactiveFilterOn && !this.activeFilterOn) {
        result = result.filter(fac => fac.Status__c === false);
    }

    // ✅ Assign filtered results
    this.filteredRecords = result;
    this.records = result;
    this.totalRecords = result.length;
    this.noRecordsFlag = this.totalRecords === 0;

    // ✅ Recalculate pagination
    this.paginationHelper();
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


 handleOpenBMSSoftwareID(event){
        if(event.target.name=='bmsid'){
            this.BMSconfirmMessgeTemplate=true;
            }else{
            this.SoftwareIDconfirmMessgeTemplate=true;
        }
    
    }
  
    handleCopyBmsId(event){
        this.isBMSIDDisbale=false;
        this.bmsIdButtonDisable=true;
        this.BMSconfirmMessgeTemplate=false;
    }
    handleBmsId(event){
        generateCustomGUID({}).then(result => {
    
            if(result){
                this.BMSIDValue=result;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'BMS ID generated successfully.',
                        variant: 'success'
                    })
                );
             
            this.BMSconfirmMessgeTemplate=false;
            this.SoftwareIDconfirmMessgeTemplate=false;
            this.bmsIdButtonDisable=true;
            }
          
         console.log('GUID:'+result);
        
        })
    }
    GenerateSoftwareId(event){
        this.showSpinner = true;
        if(this.ABN==null || this.ABN=='' || this.ABN==undefined){ 
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'ABN Number Cannot be Empty, Please enter the value',
                    variant: 'error'
                })
            ); 
            this.BMSconfirmMessgeTemplate=false;
            this.SoftwareIDconfirmMessgeTemplate=false;
             this.showSpinner = false;
        }else{
            generateSoftwareID({ ABN_NUMBER: this.ABN })
        .then(response => {
            console.log('Raw Response:', response);
            setTimeout(() => {
                let result = JSON.parse(response); // Parse only once
                console.log('Parsed Result:', result);
    
                if (result.IsSuccess) {
                    this.softwareIDValue = result.Result;
                 //   this.errorMessage = null;
    
                    // Show success toast
                    this.showToast('Success', 'Software ID Details Updated Successfully!!', 'success');
                       this.softwareButtonDisbale=true;
                } else {
                    this.softwareIDValue = '';
                  //  this.errorMessage = result.MessageEvents?.[0]?.ShortMessage || 'Unknown error occurred';
    
                    // Show error toast
                    this.showToast('Error', result.MessageEvents?.[0]?.ShortMessage || 'Unknown error occurred', 'error');
                       this.softwareButtonDisbale=false;
                }
    
                this.showSpinner = false;
                this.BMSconfirmMessgeTemplate=false;
                this.SoftwareIDconfirmMessgeTemplate=false;
            
            }, 3000);
        })
        .catch(error => {
            this.showSpinner = false;
            this.showToast('Error', error.body?.message || 'Unexpected error occurred', 'error');
              this.softwareButtonDisbale=false;
        });
        }
          
    }
    
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    
  ConfirmClose (){
     this.BMSconfirmMessgeTemplate=false;
      this.SoftwareIDconfirmMessgeTemplate=false;
       this.isBMSIDDisbale=true;
  }
        
    handleCostChange(event) {
        const field = event.target.name;
        const value = event.detail.value;

        if (field === 'fuel') {
            this.costPerKmFuel = value;
            console.log('Fuel Cost per Km changed to:', value);
        } else if (field === 'electric') {
            this.costPerKmElectric = value;
            console.log('Electric Cost per Km changed to:', value);
        }
    }

     // Handle Facility Preferred Name change
    handleFacilityNameChange(event) {
        this.facilityNameEdited = true;
    }

    // Handle Participant Preferred Name change
    handleParticipantNameChange(event) {
        this.participantNameEdited = true;
    }
    
    // Handle Staff Preferred Name change
    handleStaffNameChange(event) {
        this.staffNameEdited = true;
    }

    @track facilitydetails=true;
    @track facilityonboard=false;
    @track facilitydocument=false;
    @track facilityidentity=false;
    @track facilitytrainings=false;
    @track facilityshiftcompliance=false;
    @track facilitycompliancereport=false;
    @track facilityBulkEntity=false;
    @track facilityCatalogue=false;

    get facilitydetailsclass(){
        return (this.facilitydetails || this.facilitydetailsedit) ? 'menu-item1' : 'menu-item'; 
    }

    get facilityonboardclass(){
    return this.facilityonboard ? 'menu-item1' : 'menu-item'; 
    return (this.facilityonboard || this.facilityonboardedit) ? 'menu-item1' : 'menu-item'; 
    }

    get facilitydocumentclass(){
    return this.facilitydocument ? 'menu-item1' : 'menu-item'; 
    }

    get facilitydentityclass(){
    return this.facilityidentity ? 'menu-item1' : 'menu-item'; 
    }

    get facilitytrainingsclass(){
    return this.facilitytrainings ? 'menu-item1' : 'menu-item'; 
    }

    get facilityshiftcomplianceclass(){
    return this.facilityshiftcompliance ? 'menu-item1' : 'menu-item'; 
    }

    get facilitycompliancereportclass(){
    return this.facilitycompliancereport ? 'menu-item1' : 'menu-item'; 
    }

    get facilityBulkEntityclass(){
        return this.facilityBulkEntity ? 'menu-item1' : 'menu-item'; 
    }
     get facilityCatalogueclass(){
        return this.facilityCatalogue ? 'menu-item1' : 'menu-item'; 
    }
     get facilitySILclass(){
        return this.facilitySIL ? 'menu-item1' : 'menu-item'; 
    }
   handledetails(event){
        this.selectedServiceType = '';
        this.facilitydetails=true;
        this.facilityonboard=false;
        this.facilitydocument=false;
        this.facilityidentity=false;
        this.facilitytrainings=false;
        this.facilityshiftcompliance=false;
        this.facilitycompliancereport=false;
        this.facilityBulkEntity = false;
        this.facilityCatalogue =false;
        this.isFromManageInvoice=false;
        localStorage.setItem('activeFacilityTab', 'details');
    }
    handleonboard(event){
        this.selectedServiceType = '';
        this.facilitydetails=false;
        this.facilityonboard=true;
        this.facilitydocument=false;
        this.facilityidentity=false;
        this.facilitytrainings=false;
        this.facilityshiftcompliance=false;
        this.facilitycompliancereport=false;
        this.facilityBulkEntity = false;
        this.facilityCatalogue =false;
        this.isFromManageInvoice=false;
        localStorage.setItem('activeFacilityTab', 'onboarding');
    }
    handledocument(event){
        this.selectedServiceType = '';
        this.facilitydetails=false;
        this.facilityonboard=false;
        this.facilitydocument=true;
        this.facilityidentity=false;
        this.facilitytrainings=false;
        this.facilityshiftcompliance=false;
        this.facilitycompliancereport=false;
        this.facilityBulkEntity = false;
        this.facilityCatalogue =false;
        this.isFromManageInvoice=false;
        localStorage.setItem('activeFacilityTab', 'document');
    }
    handleidentity(event){
        this.selectedServiceType = '';
        this.facilitydetails=false;
        this.facilityonboard=false;
        this.facilitydocument=false;
        this.facilityidentity=true;
        this.facilitytrainings=false;
        this.facilityshiftcompliance=false;
        this.facilitycompliancereport=false;
        this.facilityBulkEntity = false;
        this.facilityCatalogue =false;
        this.isFromManageInvoice=false;
        localStorage.setItem('activeFacilityTab', 'identity');
    }
    handletrainings(event){
        this.selectedServiceType = '';
        this.facilitydetails=false;
        this.facilityonboard=false;
        this.facilitydocument=false;
        this.facilityidentity=false;
        this.facilitytrainings=true;
        this.facilityshiftcompliance=false;
        this.facilitycompliancereport=false;
        this.facilityBulkEntity = false;
        this.facilityCatalogue =false;
        this.isFromManageInvoice=false;
        localStorage.setItem('activeFacilityTab', 'trainings');
    }
    handleshiftcompliance(event){
        this.selectedServiceType = '';
        this.facilitydetails=false;
        this.facilityonboard=false;
        this.facilitydocument=false;
        this.facilityidentity=false;
        this.facilitytrainings=false;
        this.facilityshiftcompliance=true;
        this.facilitycompliancereport=false;
        this.facilityBulkEntity = false;
        this.facilityCatalogue =false;
        this.isFromManageInvoice=false;
        localStorage.setItem('activeFacilityTab', 'shiftcompliance');
    }
    handlecompliancereport(event){
        this.selectedServiceType = '';
        this.facilitydetails=false;
        this.facilityonboard=false;
        this.facilitydocument=false;
        this.facilityidentity=false;
        this.facilitytrainings=false;
        this.facilityshiftcompliance=false;
        this.facilitycompliancereport=true;
        this.facilityBulkEntity = false;
        this.facilityCatalogue =false;
        this.isFromManageInvoice=false;
        localStorage.setItem('activeFacilityTab', 'compliancereport');
        console.log('compliancereport', this.facilitycompliancereport);
    }
    async handleBulkEntity(event){
        this.selectedServiceType = '';
        this.facilitydetails=false;
        this.facilityonboard=false;
        this.facilitydocument=false;
        this.facilityidentity=false;
        this.facilitytrainings=false;
        this.facilityshiftcompliance=false;
        this.facilitycompliancereport=false;
        this.facilityCatalogue =false;
        await this.checkCompanyAndEntityExist();
        this.facilityBulkEntity = true;
        localStorage.setItem('activeFacilityTab', 'bulkentity');
        console.log('bulkentity', this.facilityBulkEntity);
    }

    handleCatalogueClick(event){
        this.selectedServiceType = '';
        localStorage.setItem('activeFacilityTab', 'catalogue');
        this.loadCatalogueData();
        this.loadSelectedCatalogues();
        this.facilitydetails=false;
        this.facilityonboard=false;
        this.facilitydocument=false;
        this.facilityidentity=false;
        this.facilitytrainings=false;
        this.facilityshiftcompliance=false;
        this.facilitycompliancereport=false;
        this.facilityBulkEntity = false;
        this.facilityCatalogue =true;
    }

     

    @track isCreateCatalogueModalOpen = false;
    @track supportItemNumber;
    @track formData = {
        Id:'',
        serviceType: '',
        supportItemName: '',
        supportItemNumber: '',   // ✅ added
        ACT: '0',
        NSW: '0',
        NT: '0',
        QLD: '0',
        SA: '0',
        TAS: '0',
        VIC: '0',
        WA: '0'
    };
    @track rateFields = [
        { label: 'ACT Rate', field: 'ACT' },
        { label: 'NSW Rate', field: 'NSW' },
        { label: 'NT Rate', field: 'NT' },
        { label: 'QLD Rate', field: 'QLD' },
        { label: 'SA Rate', field: 'SA' },
        { label: 'TAS Rate', field: 'TAS' },
        { label: 'VIC Rate', field: 'VIC' },
        { label: 'WA Rate', field: 'WA' }
    ];

    handleSelectAll(event) {

        const checked = event.target.checked;

        console.log('==============================');
        console.log('--- handleSelectAll START ---');
        console.log('Select All Checkbox Value:', checked);

        console.log(
            'this.filteredCatalogs >>>>>\n',
            JSON.stringify(this.filteredCatalogs, null, 2)
        );

        /* ---------------------------------------
        STEP 1: Update UI records
        --------------------------------------- */

        this.filteredCatalogs = this.filteredCatalogs.map(item => ({
            ...item,
            isSelected: checked,
            isSelectedcheckBox: checked
        }));

        /* ---------------------------------------
        STEP 2: Update trackedRecords
        (🔥 minimal payload ONLY)
        --------------------------------------- */

        if (checked) {

            console.log('Select All = TRUE → Mark all visible as selected');


            this.filteredCatalogs.forEach(rec => {

                if (!rec.isSelectedcheckBox) {

                    map.set(rec.Id, {
                        Id: rec.Id,
                        isSelected: true
                    });
                }
            });

            this.trackedRecords = this.catalogueRecords.map(item => ({
                Id: item.Id,
                isSelected: true
            }));

        } else {

            console.log('❌ Select All = FALSE → Reset ALL records');

            // ✅ STEP 1: Uncheck ALL UI records
            this.filteredCatalogs = this.filteredCatalogs.map(item => ({
                ...item,
                isSelected: false,
                isSelectedcheckBox: false
            }));

            // ✅ STEP 2: Collect ALL Ids (use catalogueRecords if you want all pages)
            const allIds = this.catalogueRecords.map(item => item.Id);

            console.log('📦 All Ids:', allIds);
            console.log('🏢 Facility Id:', this.facilityIdEditIcon);

            // ✅ STEP 3: Prepare trackedRecords (optional)
            this.trackedRecords = allIds.map(id => ({
                Id: id,
                isSelected: false
            }));

            // ✅ STEP 4: Call Apex with facilityId
            this.callUnselectAllApex(allIds);

        }

        /* ---------------------------------------
        STEP 3: Update Select All Checkbox
        --------------------------------------- */

        this.updateSelectAllCheckbox();

        /* ---------------------------------------
        STEP 4: Refresh Pagination
        --------------------------------------- */

        this.cataloguePaginate();

        console.log('FINAL trackedRecords:', this.trackedRecords);
        console.log('--- handleSelectAll END ---');
        console.log('==============================');
    }

    async callUnselectAllApex(ids) {

        try {
            console.log('🚀 Sending to Apex:', {
                facilityId: this.facilityIdEditIcon,
                recordIds: ids
            });

            const result = await processBulkSelectedRecordsUncheck({
                facilityId: this.facilityIdEditIcon,
                recordIds: ids
            });

            console.log('✅ Apex Response:', JSON.stringify(result, null, 2));

            const hasAnyFuture = Object.values(result).some(val => val === true);
            this.hasFutureServices1 = hasAnyFuture;

            if (hasAnyFuture) {
                this.popupMsg1 =
                    'Some support items cannot be deselected because future shifts are scheduled. Please delete the future shifts first.';
            }

            console.log('🚩 hasFutureServices1:', this.hasFutureServices1);

            /* ---------------------------------------
            STEP 1: Update catalogueRecords (UI)
            --------------------------------------- */

            this.catalogueRecords = this.catalogueRecords.map(item => {
                const hasFuture = result[item.Id];

                return {
                    ...item,
                    isSelected: hasFuture,              // ✅ true → keep checked
                    isSelectedcheckBox: hasFuture       // ✅ sync both
                };
            });

            /* ---------------------------------------
            STEP 2: Update filteredCatalogs (visible)
            --------------------------------------- */

            this.filteredCatalogs = this.filteredCatalogs.map(item => {
                const hasFuture = result[item.Id];

                return {
                    ...item,
                    isSelected: hasFuture,
                    isSelectedcheckBox: hasFuture
                };
            });

            /* ---------------------------------------
            STEP 3: Update trackedRecords (minimal)
            --------------------------------------- */

            this.trackedRecords = Object.keys(result).map(id => ({
                Id: id,
                isSelected: result[id]
            }));

            console.log('📦 Updated trackedRecords:', this.trackedRecords);

            /* ---------------------------------------
            STEP 4: Refresh UI helpers
            --------------------------------------- */

            this.updateSelectAllCheckbox();
            this.cataloguePaginate();

        } catch (error) {
            console.error('❌ Apex Error:', error);
        }
    }

    handleCloseWarningModal1(){
        this.hasFutureServices1 = false;
    }

    /* handleSaveforServiceCatalogue() {

        console.log('===== SAVE START =====');

        const records = [...this.trackedRecords];

        console.log('Records to save:', records);

        if (records.length === 0) {

            this.showToast(
                'Validation Error',
                'Please select at least one catalogue record.',
                'error'
            );
            return;
        }

        const payload = JSON.stringify(records);

        console.log('Payload:', payload);
        console.log('Facility Id:', this.recordId);

        processBulkSelectedRecords({
            facilityId: this.recordId,
            selectedRecordsJson: payload
        })
        .then(() => {

            console.log('✅ Save successful');

            this.showToast(
                'Success',
                'Service catalogues saved successfully.',
                'success'
            );

            // 🔥 Reset tracking after save
            this.trackedRecords = [];

            // 🔄 Reload data
            setTimeout(() => {
                this.loadCatalogueData();
                this.loadSelectedCatalogues();
            }, 800);
        })
        .catch(error => {

            console.error('❌ Save error:', error);

            this.showToast(
                'Error',
                error?.body?.message || 'Unexpected error occurred',
                'error'
            );
        });

        console.log('===== SAVE END =====');
    } */

    handleSaveforServiceCatalogue() {

        console.log('===== SAVE START =====');

        // ✅ Get ONLY selected records from catalogueRecords
        const records = [...this.catalogueRecords];

        console.log('✅ Selected Records:', JSON.stringify(records, null, 2));

        if (records.length === 0) {

            this.showToast(
                'Validation Error',
                'Please select at least one catalogue record.',
                'error'
            );
            return;
        }

        const payload = JSON.stringify(records);

        console.log('📤 Payload:', payload);
        console.log('📌 Facility Id:', this.recordId);

        processBulkSelectedRecords({
            facilityId: this.recordId,
            selectedRecordsJson: payload
        })
        .then(() => {

            console.log('✅ Save successful');

            this.showToast(
                'Success',
                'Service catalogues saved successfully.',
                'success'
            );

            // 🔥 Reset selection
            this.catalogueRecords = this.catalogueRecords.map(item => ({
                ...item,
                isSelected: false,
                isSelectedcheckBox: false
            }));

            // 🔄 Reload data
            setTimeout(() => {
                this.loadCatalogueData();
                this.loadSelectedCatalogues();
            }, 800);
        })
        .catch(error => {

            console.error('❌ Save error:', error);

            this.showToast(
                'Error',
                error?.body?.message || 'Unexpected error occurred',
                'error'
            );
        });

        console.log('===== SAVE END =====');
    }
    
    async handleRowSelection(event) {
        console.log('==============================');
        console.log('👉 handleRowSelection START');
        console.log('==============================');

        const recordId = event.target.dataset.id;
        const isChecked = event.target.checked;

        console.log('📌 Record Id:', recordId);
        console.log('📌 Checked:', isChecked);
        console.log('📌 Facility Id:', this.facilityIdEditIcon);

        try {

            // ====================================
            // ❌ UNCHECK → VALIDATE WITH APEX
            // ====================================
            if (!isChecked) {

                console.log('⏳ Calling handleUncheck Apex...');

                const result = await handleUncheck({
                    facilityId: this.facilityIdEditIcon,
                    recordId: recordId
                });

                console.log('📥 Apex Result:', JSON.stringify(result));

                // 🚫 BLOCK → IF RESULT NOT EMPTY
                if (result && result.length > 0) {

                    console.log('⛔ BLOCKING UNCHECK → reverting');

                    this.catalogueRecords = this.catalogueRecords.map(item => {
                        if (item.Id === recordId) {
                            return { ...item, isSelected: true, isSelectedcheckBox: true };
                        }
                        return item;
                    });

                    await Promise.resolve();
                    this.catalogueRecords = [...this.catalogueRecords];

                    this.hasFutureServices = true;
                    this.popupMsg =
                        'This support item cannot be deselected because future shifts are scheduled. To proceed, please delete the future shifts first.';

                    return;
                }

                // ✅ ALLOW UNCHECK (RESULT EMPTY)
                console.log('✅ Apex result EMPTY → allowing uncheck');

                this.catalogueRecords = this.catalogueRecords.map(item => {
                    if (item.Id === recordId) {
                        console.log('⬇️ Setting checkbox FALSE for:', recordId);

                        return { 
                            ...item, 
                            isSelected: false, 
                            isSelectedcheckBox: false 
                        };
                    }
                    return item;
                });

                // 🔁 Force re-render (important in LWC)
                await Promise.resolve();
                this.catalogueRecords = [...this.catalogueRecords];

                console.log('📦 Updated catalogueRecords after UNCHECK:',
                    JSON.stringify(this.catalogueRecords, null, 2)
                );
            } else {
                // ====================================
                // ✅ CHECKED = TRUE FLOW
                // ====================================
                console.log('✅ CHECKBOX CHECKED → Processing selection');

                console.log('📊 Before Update trackedRecords:',
                    JSON.stringify(this.trackedRecords, null, 2)
                );

                this.trackedRecords = this.trackedRecords.map(row => {
                    console.log('🔍 Iterating Row Id:', row.Id);

                    if (row.Id === recordId) {
                        console.log('🎯 MATCH FOUND');
                        console.log('➡️ Updating isSelected to TRUE for:', recordId);

                        return { 
                            ...row, 
                            isSelected: isChecked 
                        };
                    }

                    return row;
                });

                console.log('📊 After Update trackedRecords:',
                    JSON.stringify(this.trackedRecords, null, 2)
                );

                // Optional: If checkbox UI depends on catalogueRecords
                this.catalogueRecords = this.catalogueRecords.map(item => {
                    console.log('🔄 Sync catalogueRecords Item Id:', item.Id);

                    if (item.Id === recordId) {
                        console.log('📌 Syncing catalogueRecords checkbox TRUE for:', recordId);

                        return { 
                            ...item, 
                            isSelected: true,
                            isSelectedcheckBox: true 
                        };
                    }

                    return item;
                });

                console.log('📦 Updated catalogueRecords after CHECK:',
                    JSON.stringify(this.catalogueRecords, null, 2)
                );
            }

            console.log('📦 Updated catalogueRecords:', JSON.stringify(this.catalogueRecords));

        } catch (error) {
            console.error('❌ Error in handleRowSelection:', error);

            // 🔁 Fail-safe → revert
            this.catalogueRecords = this.catalogueRecords.map(item => {
                if (item.Id == recordId) {
                    return { ...item, isSelected: true };
                }
                return item;
            });

            event.target.checked = true;
        }

        console.log('🏁 handleRowSelection END');
    }

    handleCloseWarningModal() {

        console.log("🔔 Warning modal closed");

        this.hasFutureServices = false;

        // ⭐ Re-check the blocked row
        this.showSpinner = true;
        this.facilitycompliancereport = true;
        this.facilityCatalogue = false;
        setTimeout(() => {
            console.log('⏳ Reloading catalogue after delay...');
            this.loadCatalogueData();
            this.loadSelectedCatalogues();
            this.facilitycompliancereport = false;
            this.facilityCatalogue = true;
            this.showSpinner = false;
        }, 1000);
    }

    updateSelectAllCheckbox() {
        console.log('--- updateSelectAllCheckbox START ---');

        const allSelected =
            this.filteredCatalogs.length > 0 &&
            this.filteredCatalogs.every(item => item.isSelected);

        console.log('All rows selected?', allSelected);

        const selectAllCheckbox = this.template.querySelector(
            'lightning-input[type="checkbox"]'
        );

        if (selectAllCheckbox) {
            selectAllCheckbox.checked = allSelected;
            console.log('Header checkbox set to:', allSelected);
        } else {
            console.log('Header checkbox NOT found');
        }

        console.log('--- updateSelectAllCheckbox END ---');
    }

    handleCreateCatalogue() {
        this.CreateorEditCatalogueName = 'Create Service Catalogue';
        console.log('Create New Catalogue button clicked');
        this.supportItemNumber = this.generateSupportItemNumber();
        this.formData = {
            ...this.formData,
            supportItemNumber: this.supportItemNumber
        };
        this.isCreateCatalogueModalOpen = true;
        console.log('Generated Support Item Number:', this.supportItemNumber);
    }

    generateSupportItemNumber() {
        const section = '01';
        const category = '001';

        const now = new Date();

        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        return `${section}_${category}_${yyyy}${mm}${dd}_${hh}${min}${ss}`;
    }

    handleCancelCreateCatalogue() {
        console.log('Cancel New Catalogue button clicked');this.recordId
        console.log('this.formData >>>>>>', JSON.stringify(this.formData));
        console.log('this.recordId >>>>>>', this.recordId);
        this.resetCreateCatalogueForm();
    }

    validateCreateCatalogueForm() {
        if (!this.formData.serviceType || !this.formData.serviceType.trim()) {
            this.showToast(
                'Validation Error',
                'Service Type is required',
                'error'
            );
            return false;
        }

        if (!this.formData.supportItemName || !this.formData.supportItemName.trim()) {
            this.showToast(
                'Validation Error',
                'Support Item Name is required',
                'error'
            );
            return false;
        }

        return true;
    }

    handleSaveCreateCatalogue() {

        console.log('this.recordId >>>>>', this.recordId);
        console.log('this.formData >>>>'+ JSON.stringify(this.formData));

        // 🔴 SHOW TOAST & STOP if invalid
        if (!this.validateCreateCatalogueForm()) {
            return;
        }

        saveCatalogue({
            recordId: this.recordId,
            formDataJson: JSON.stringify(this.formData)
        })
        .then(() => {
            this.selectedServiceTypeLabel = this.selectedServiceTypeLabelValue;
            this.loadCatalogueData();
            this.loadSelectedCatalogues();

            const isEdit =
                this.CreateorEditCatalogueName === 'Edit Service Catalogue';

            this.showToast(
                'Success',
                isEdit
                    ? 'Catalogue updated successfully'
                    : 'Catalogue created successfully',
                'success'
            );

            this.resetCreateCatalogueForm();
        })
        .catch(error => {
            this.showToast(
                'Error',
                error?.body?.message || 'Something went wrong while saving',
                'error'
            );
        });
    }

    resetCreateCatalogueForm() {
        this.formData = {
            Id:'',
            serviceType: '',
            supportItemName: '',
            supportItemNumber: '',
            ACT: '0',
            NSW: '0',
            NT: '0',
            QLD: '0',
            SA: '0',
            TAS: '0',
            VIC: '0',
            WA: '0'
        };

        // Close modal
        this.isCreateCatalogueModalOpen = false;

        console.log('Create Catalogue form reset');
    }

    handleChangeserviceCatalogue(event) {
        const field = event.target.dataset.field;
        let value = event.target.value;

        // ✅ Only default numeric (rate) fields
        if (event.target.type === 'number' && value === '') {
            value = '0.00';
        }

        this.formData = {
            ...this.formData,
            [field]: value
        };

        console.log('Updated formData:', JSON.stringify(this.formData));
    }


    @api placeholder = 'Select an option';
    @api initialOptions = [
        { id: '1', label: 'Option 1', isActive: true },
        { id: '2', label: 'Option 2', isActive: true },
        { id: '3', label: 'Option 3', isActive: false }
    ];

    get displayText() {
        return this.selectedOption ? this.selectedOption.label : this.placeholder;
    }

    get selectedOptionClass() {
        return this.selectedOption ? 'selected-text' : 'placeholder-text';
    }

    get chevronIcon() {
        return this.isOpen ? 'utility:chevronup' : 'utility:chevrondown';
    }

     get chevronIcon2() {
        return this.isServicesOpen ? 'utility:chevronup' : 'utility:chevrondown';
    }

     get chevronIcon3() {
        return this.isDocumentsOpen ? 'utility:chevronup' : 'utility:chevrondown';
    }

     get chevronIcon4() {
        return this.isTrainingsOpen ? 'utility:chevronup' : 'utility:chevrondown';
    }

    get isAddDisabled() {
        return !this.newOptionText.trim();
    }

    handleDropdownClick(event) {
        
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
    }
    handleClickOutside(event) {
        const path = event.composedPath ? event.composedPath() : [event.target];

        const rolesDropdown = this.template.querySelector('.dropdown-container');
        const servicesDropdown = this.template.querySelector('.dropdown-container1');
        const documentsDropdown = this.template.querySelector('.dropdown-container-documents');
        const trainingsDropdown = this.template.querySelector('.dropdown-container-trainings');
        const serviceTypeDropdown = this.template.querySelector('.service-search-container');

        // If click is inside DOCUMENTS dropdown
        if (documentsDropdown && path.includes(documentsDropdown)) {
            return;  // ⭐ KEEP DOCUMENTS DROPDOWN OPEN
        }

        // If click is inside SERVICES dropdown
        if (servicesDropdown && path.includes(servicesDropdown)) {
            return;  // ⭐ KEEP SERVICES DROPDOWN OPEN
        }

        // If click is inside ROLES dropdown
        if (rolesDropdown && path.includes(rolesDropdown)) {
            return;  // ⭐ KEEP ROLES DROPDOWN OPEN
        }

        if (trainingsDropdown && path.includes(trainingsDropdown)) {
            return; // Keep it open
        }

        if (serviceTypeDropdown && serviceTypeDropdown.contains(event.target)) {
            return;
        }

        // Otherwise click is outside → close all dropdowns
        this.isOpen = false;
        this.isServicesOpen = false;
        this.isDocumentsOpen = false;
        this.isTrainingsOpen = false;
        this.showServiceTypeDropdown = false;
    }

    toggleDocumentsDropdown(event) {
        event.stopPropagation();
        this.isDocumentsOpen = !this.isDocumentsOpen;
        if (this.isDocumentsOpen) {
            this.isOpen = false;
            this.isServicesOpen = false;
            this.isTrainingsOpen = false; 
        }
    }

    toggleServicesDropdown(event) {
        event.stopPropagation();
        this.isServicesOpen = !this.isServicesOpen;
        if (this.isServicesOpen) {
            this.isOpen = false;
            this.isDocumentsOpen = false;
            this.isTrainingsOpen = false; 
        }
    }

    toggleDropdown(event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.isServicesOpen = false;
            this.isDocumentsOpen = false;
            this.isTrainingsOpen = false; 
        }
    }

    toggleTrainingsDropdown(event) {
        event.stopPropagation();
        this.isTrainingsOpen = !this.isTrainingsOpen;

        if (this.isTrainingsOpen) {
            this.isDocumentsOpen = false;
            this.isServicesOpen = false;
            this.isOpen = false;
        }
    }

    handleInputChange(event) {
        this.newOptionText = event.target.value;
    }

    handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleAddOption();
        }
    }

    handleAddOption() {
        const trimmedValue = this.newOptionText.trim();

        if (trimmedValue) {
            // Check if option with same label already exists (case-insensitive)
            const isDuplicate = this.options.some(
                opt => opt.label.toLowerCase() === trimmedValue.toLowerCase()
            );

            if (isDuplicate) {
                // 🔴 Show error toast (or set an error flag if you want inline error)
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Duplicate Option",
                        message: `Option "${trimmedValue}" already exists.`,
                        variant: "error"
                    })
                );
                return; // Stop execution
            }

            const newOption = {
                id: Date.now().toString(),
                label: trimmedValue,
                isActive: true,
                toggleId: `toggle-${Date.now()}`,
                buttonClass: this.getOptionButtonClass(true),
                badgeClass: this.getBadgeClass(true),
                statusText: 'Active',
                isDisabled: false,
                checked: true
            };

            this.options = [...this.options, newOption];
            this.newOptionText = '';

            // Dispatch custom event for parent component
            this.dispatchEvent(new CustomEvent('optionadded', {
                detail: { option: newOption }
            }));
        }
    }


    handleSelectOption(event) {
        const optionId = event.target.dataset.optionId;
        const option = this.options.find(opt => opt.id === optionId);
        
        if (option && option.isActive) {
            this.selectedOption = option;
            this.isOpen = false;

            // Dispatch selection change event
            this.dispatchEvent(new CustomEvent('selectionchange', {
                detail: { selectedOption: option }
            }));
        }
    }

    handleToggleActive(event) {
        const optionId = event.target.dataset.optionId;
        const isChecked = event.target.checked; // true/false from UI

        console.log("🔀 Toggle changed:", { optionId, isChecked });

        this.options = this.options.map(option => {
            if (option.id === optionId) {
                return {
                    ...option,
                    checked: isChecked,     // 👈 update checked so UI reflects toggle
                    isActive: isChecked,    // 👈 keep isActive in sync
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
    }


    getOptionButtonClass(isActive) {
        return isActive 
            ? 'option-button option-button-active' 
            : 'option-button option-button-inactive';
    }

    getBadgeClass(isActive) {
        console.log(" [getOptionButtonClass] isActive:", isActive);
        return isActive 
        
            ? 'status-badge1 status-badge-active1' 
            : 'status-badge1 status-badge-inactive1';
    }

    getToggleTrackClass(option) {
        return option.checked ? 'custom-toggle-track active' : 'custom-toggle-track';
    }

    handleKeyShortcut(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
            event.preventDefault();
            this.handleCreateNewFacility();
        }
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyU') {
            event.preventDefault();
            this.handleFacilityBulkUpload();
        }
    }
   
    handleFacilityBulkUpload() {
        this.isMultiFacilityUpload = true;
        this.facEditFlag=false;
        this.facviewFlag = false;
        
        this.cardFlag = false;
        this.listFlag = false;
        this.facFlag = false;
        this.facilityflag = false;
        this.facilityeditflag = false;
    }
    childevent(){

        this.isMultiFacilityUpload = false;
        this.facEditFlag=false;
        this.facviewFlag = false;

        this.cardFlag = true;
        this.listFlag = false;
        this.facFlag = true;
        this.facilityflag = false;
        this.facilityeditflag = false;
        //refreshApex(this.refreshTable);
        //this.fetchParticipant();
    }

    handleServiceChange(event) {
        
        const selectedService = event.detail.value;
        this.updateDocumentsList(selectedService);
        this.updateTrainingsList(selectedService);
        
    }

    updateDocumentsList(selectedService) {
        const docs = this.serviceDocumentsMap[selectedService] || [];

        this.documentsList = docs.map((doc, index) => ({
            id: index,
            label: doc,
            checked: false,
            statusText: 'Inactive',
            buttonClass: 'option-button',
            badgeClass: 'badge badge-inactive'
        }));

        this.documentsDisplayText = "Select Documents";
    }
    
    handleSelectDocument(event) {
        const id = Number(event.currentTarget.dataset.docId);

        this.documentsList = this.documentsList.map(doc => {
            if (doc.id === id) {
                return {
                    ...doc,
                    checked: !doc.checked,
                    statusText: !doc.checked ? 'Active' : 'Inactive',
                    buttonClass: !doc.checked ? 'option-button-selected' : 'option-button',
                    badgeClass: !doc.checked ? 'badge badge-active' : 'badge badge-inactive'
                };
            }
            return doc;
        });

        const selected = this.documentsList.filter(d => d.checked);
        this.documentsDisplayText = selected.length
            ? `${selected.length} selected`
            : "Select Documents";
    }
    get selectedDocumentsString() {
        return this.documentsList
            .filter(doc => doc.checked)
            .map(doc => doc.label)
            .join(";");
    }

    handleToggleDocument(event) {
        console.log('📄 === handleToggleDocument START ===');
        
        // Stop event propagation
        event.stopPropagation(); 
        console.log('✅ Event propagation stopped');
        
        // Log the event details
        console.log('🔍 Event details:', {
            target: event.target,
            targetType: event.target.type,
            targetTagName: event.target.tagName,
            currentTarget: event.currentTarget,
            dataset: event.target.dataset,
            checked: event.target.checked,
            value: event.target.value
        });
        
        const docId = event.target.dataset.docId;
        const isChecked = event.target.checked;
        
        console.log('📊 Input parameters:', {
            docId: docId,
            docIdType: typeof docId,
            isChecked: isChecked,
            isCheckedType: typeof isChecked
        });
        
        // Log current documentsList before update
        console.log('📋 Current documentsList BEFORE update:', JSON.parse(JSON.stringify(this.documentsList)));
        
        // Update documentsList
        this.documentsList = this.documentsList.map(doc => {
            console.log(`🔄 Processing document ID: ${doc.id} (looking for ${docId})`);
            
            if (doc.id == docId) {
                console.log(`✅ Found matching document!`, {
                    previousState: {
                        checked: doc.checked,
                        statusText: doc.statusText,
                        buttonClass: doc.buttonClass,
                        badgeClass: doc.badgeClass
                    },
                    newState: {
                        checked: isChecked,
                        statusText: isChecked ? 'Active' : 'Inactive',
                        buttonClass: this.getOptionButtonClass(isChecked),
                        badgeClass: this.getBadgeClass(isChecked)
                    }
                });
                
                return {
                    ...doc,
                    checked: isChecked,
                    statusText: isChecked ? 'Active' : 'Inactive',
                    buttonClass: this.getOptionButtonClass(isChecked),
                    badgeClass: this.getBadgeClass(isChecked)
                };
            }
            return doc;
        });
        
        // Log documentsList after update
        console.log('📋 Updated documentsList AFTER update:', JSON.parse(JSON.stringify(this.documentsList)));
        
        // Calculate selected documents
        const selectedDocuments = this.documentsList.filter(doc => doc.checked);
        console.log('✅ Selected documents:', {
            count: selectedDocuments.length,
            documents: selectedDocuments.map(doc => ({id: doc.id, label: doc.label}))
        });
        
        // Update display text
        const previousDisplayText = this.documentsDisplayText;
        this.documentsDisplayText = selectedDocuments.length
            ? `${selectedDocuments.length} selected`
            : "Select Documents";
        
        console.log('📝 Display text updated:', {
            from: previousDisplayText,
            to: this.documentsDisplayText
        });
        
        // Log dropdown state
        console.log('📦 Current dropdown states:', {
            isDocumentsOpen: this.isDocumentsOpen,
            isOpen: this.isOpen,
            isServicesOpen: this.isServicesOpen
        });
        
        // Force documents dropdown to stay open
        this.isDocumentsOpen = true;
        console.log('🔒 Forcing documents dropdown to stay open: isDocumentsOpen =', this.isDocumentsOpen);
        
        console.log('📄 === handleToggleDocument END ===');
    }

    get trainingsSelectedClass() {
            return this.selectedTrainings.length > 0 
                ? 'selected-text' 
                : 'placeholder-text';
        }

        trainingMap = {
        'NDIS': [
            'NDIS Worker Orientation Module',
            'Manual Handling & Mobility Support',
            'Medication Assistance & Management',
            'Infection Control & PPE Use',
            'First Aid & CPR',
            'Behaviour Support & Restrictive Practices',
            'Mealtime Management & Dysphagia',
            'Epilepsy Management',
            'Risk Management & Incident Reporting',
            'Privacy & Confidentiality',
            'Emergency & Disaster Management',
            'Human Rights & Abuse Prevention',
            'Fire Safety',
            'Incident Reporting',
            'Cultural Awareness & Diversity'
        ],
        'Nursing': [
            'Basic Life Support (BLS)',
            'Advanced Life Support (ALS/ACLS)',
            'Infection Control & Standard Precautions',
            'Medication Administration Training',
            'Manual Handling / Safe Patient Handling',
            'Fire Safety & Emergency Action',
            'Abuse, Neglect & Exploitation Prevention',
            'Privacy & Confidentiality',
            'Incident Reporting',
            'Hazardous Chemical & Bloodborne Pathogens',
            'Dementia Care',
            'Mental Health Training',
            'Wound Care',
            'IV Therapy Competency',
            'EHR / EMR System Training'
        ],
        'Child Care': [
            'Pediatric First Aid & CPR',
            'Safe Sleep Practices & SIDS Prevention',
            'Child Abuse Recognition & Reporting',
            'Emergency Preparedness & Evacuation',
            'Infection Control & Hygiene',
            'Medication Administration',
            'Food Safety & Allergy Management',
            'Positive Behavior Guidance',
            'Child Development & Learning Strategies',
            'Transportation & Traffic Safety',
            'Cultural Competency & Inclusion'
        ]
    };

updateTrainingsList(selectedService) {
    const trainings = this.trainingMap[selectedService] || [];

    this.trainingsList = trainings.map((tr, index) => ({
        id: index,
        label: tr,
        checked: false,
        statusText: 'Inactive',
        buttonClass: 'option-button',
        badgeClass: 'badge badge-inactive'
    }));

    this.trainingsDisplayText = "Select Trainings";
}

handleToggleTraining(event) {
    event.stopPropagation();

    const trId = event.target.dataset.trId;
    const isChecked = event.target.checked;

    this.trainingsList = this.trainingsList.map(tr => {
        if (tr.id == trId) {
            return {
                ...tr,
                checked: isChecked,
                statusText: isChecked ? 'Active' : 'Inactive',
                buttonClass: this.getOptionButtonClass(isChecked),
                badgeClass: this.getBadgeClass(isChecked)
            };
        }
        return tr;
    });

    const selected = this.trainingsList.filter(t => t.checked);
    this.selectedTrainings = selected;

    this.trainingsDisplayText = selected.length
        ? `${selected.length} selected`
        : "Select Trainings";

    this.isTrainingsOpen = true; // keep open
}

get selectedTrainingsString() {
    return this.trainingsList
        .filter(t => t.checked)
        .map(t => t.label)
        .join(';');
}
       
        async checkCompanyAndEntityExist() {
        try {
            console.log('🔍 Checking company & entity for facility:', this.recordId);
            console.log('isFromManageInvoice:', this.isFromManageInvoice);


            const result = await getCompanyAndEntityStatus({
                facilityId: this.recordId
               // invoiceFundTrackerId: fundTrackerIdToSend
            });

            this.isCompanyExist = result.companyExists;
            this.existingCompanyId = result.companyId;
            this.existingCompanyName = result.companyName;
            this.isEntityExist = result.entityExists;
            this.existingEntityId=result.entityId;
            this.existingEntityName = result.entityName;
            console.log('Company Id:', this.existingCompanyId);
            console.log('Company exists:', this.isCompanyExist);
            console.log('Entity exists:', this.isEntityExist);
            console.log('existingCompanyName :', this.existingCompanyName);

            console.log('existingEntityId Id:', this.existingEntityId);
            if(this.isEntityExist && this.isFromManageInvoice){
                this.facilityBulkEntity=false;
                this.facEditFlag=false;
                this.facviewFlag=false;
                this.cardFlag=false;

                console.log('🔼 Dispatching createcompanyback (Manage Invoice flow)');
                this.dispatchEvent(
                    new CustomEvent('createentityback', {
                    // new CustomEvent('createcompanyback', {
                        detail: {
                            existingEntityId: this.existingEntityId,
                            existingEntityName: this.existingEntityName
                        },
                        bubbles: true,
                        composed: true
                    })
                );
            
            }

        } catch (error) {
            console.error(error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body?.message || 'Error checking company',
                    variant: 'error'
                })
            );
        }
    }
    handleCreateCompanyFromParent(){
        this.facviewFlag=false;
        this.createCompanyFlag=true;
        this.isFromFacility = true;
    }
    handleCreateEntityFromParent(){
        this.facviewFlag=false;
        this.isNewEntityFlag=true;
        this.isFromFacility = true;
    }

    async handleCreateCompanyBack() {
        console.log("🔁 handleCreateCompanyBack → opening Bulk Entity");

         
        //localStorage.removeItem('facilityRecordId');
        localStorage.removeItem('activeFacilityTab');
        // Reset all facility tabs
        this.facilitydetails = false;
        this.facilityonboard = false;
        this.facilitydocument = false;
        this.facilityidentity = false;
        this.facilitytrainings = false;
        this.facilityshiftcompliance = false;
        this.facilitycompliancereport = false;
        this.facilityBulkEntity = false;

        // If Bulk Entity requires async prep
        await this.checkCompanyAndEntityExist();

        // Open Bulk Entity tab
        this.facilityBulkEntity = true;
        this.facviewFlag=true;
        this.createCompanyFlag=false;

        // Optional (recommended)
       // localStorage.setItem("activeFacilityTab", "bulkentity");
    }
      async handleCreateEntityBack() {
        console.log("🔁 handleCreateEntityBack → opening Bulk Entity");
         
        //localStorage.removeItem('facilityRecordId');
        localStorage.removeItem('activeFacilityTab');
        // Reset all facility tabs
        this.facilitydetails = false;
        this.facilityonboard = false;
        this.facilitydocument = false;
        this.facilityidentity = false;
        this.facilitytrainings = false;
        this.facilityshiftcompliance = false;
        this.facilitycompliancereport = false;
        this.facilityBulkEntity = false;

        // If Bulk Entity requires async prep
        await this.checkCompanyAndEntityExist();

        // Open Bulk Entity tab
        this.facilityBulkEntity = true;
        this.facviewFlag=true;
        this.isNewEntityFlag=false;

        // Optional (recommended)
      //  localStorage.setItem("activeFacilityTab", "bulkentity");
    }
     
    @track NdisServiceGroupName = false;
    serviceGroupName = [];
    @track allCatalogs=[];
    @track filteredCatalogs=[];
    @track CreateorEditCatalogueName = 'Create Service Catalogue';
    selectedCatalogueIdSet = new Set();
    selectedCatalogueMap = new Map(); // key = catalogueId, value = serviceCatalogueId
    @track isSelectAllChecked = false;

    loadSelectedCatalogues() {
        getfacilityselectedCatalogue({
            facilityId: this.facilityIdEditIcon
        })
        .then(result => {
            console.log('Selected Service Catalogues ==> ', result);

            this.selectedCatalogueMap.clear();

            result.forEach(sc => {
                if (sc.NDIS_Support_Catalogue__c) {
                    this.selectedCatalogueMap.set(
                        sc.NDIS_Support_Catalogue__c,
                        {
                            serviceCatalogueId: sc.Id,
                            isActive: sc.Active__c
                        }
                    );
                }

                if (sc.Nursing_Catalogue__c) {
                    this.selectedCatalogueMap.set(
                        sc.Nursing_Catalogue__c,
                        {
                            serviceCatalogueId: sc.Id,
                            isActive: sc.Active__c
                        }
                    );
                }
            });

            console.log(
                'Selected Catalogue Map ==> ',
                Array.from(this.selectedCatalogueMap.entries())
            );

            this.applySelectionToFilteredCatalogs();
        })
        .catch(error => {
            console.error('Error fetching selected catalogues', error);
        });
    }

    applySelectionToFilteredCatalogs() {
        if (!this.filteredCatalogs || !this.filteredCatalogs.length) {
            return;
        }

        this.filteredCatalogs = this.filteredCatalogs.map(item => {
            const entry = this.selectedCatalogueMap.get(item.Id);

            return {
                ...item,
                isSelected: entry ? entry.isActive : false, // ✅ ONLY if Active__c = true
                isSelectedcheckBox: entry ? entry.isActive : false,
                serviceCatalogueId: entry ? entry.serviceCatalogueId : null
            };
        });
    }

    loadCatalogueData() {
        getServiceLineItem({
            ServiceDate: this.serviceDate,
            recordId: this.facilityIdEditIcon
        })
        .then(data => {
            console.log('Raw data for Catalogue Data:', JSON.stringify(data));

            // 1️⃣ Store Facility
            this.facility = data?.facility || null;

            // 2️⃣ Store catalogues
            this.allCatalogs = data?.catalogues || [];

            // 3️⃣ Build Service Type dropdown options
            const uniqueNames = new Set();
            this.allCatalogs.forEach(rec => {
                if (rec.Name) {
                    uniqueNames.add(rec.Name);
                }
            });

            let options = [...uniqueNames].map(name => ({
                label: name,
                value: name
            }));

            // 4️⃣ Apply Facility Type rules
            const serviceType = this.facility?.Type_of_Service__c;

            // 🔹 NDIS rules
            if (serviceType === 'NDIS') {
                options = options.filter(({ value }) =>
                    !value.startsWith('Others') &&
                    !value.startsWith('Miscellaneous -')
                );
            }

            // 🔹 Nursing / Child Care / Transport rules
            if (['Nursing', 'Child Care', 'Transport'].includes(serviceType)) {
                options = options.filter(({ value }) =>
                    !value.startsWith('Miscellaneous') &&
                    !value.startsWith('Others -')
                );
            }

            // 5️⃣ Sort alphabetically, but keep Miscellaneous & Others last
            options.sort((a, b) => {
                const special = ['Miscellaneous', 'Others'];

                const aIsSpecial = special.includes(a.value);
                const bIsSpecial = special.includes(b.value);

                if (aIsSpecial && bIsSpecial) return 0;
                if (aIsSpecial) return 1;
                if (bIsSpecial) return -1;

                return a.value.localeCompare(b.value);
            });

            this.serviceTypeOptions = options;

            console.log(
                'Service Type options:',
                JSON.stringify(this.serviceTypeOptions)
            );

            console.log('this.selectedServiceType >>>>', JSON.stringify(this.selectedServiceType));

            // 6️⃣ Auto-select first option & filter catalogues
            if (Array.isArray(this.selectedServiceType)) {
                this.selectedServiceType = null;
            }

            const hasSelected =
                this.selectedServiceType !== null &&
                this.selectedServiceType !== undefined &&
                this.selectedServiceType !== '';

            // ✅ if already selected → keep it
            if (hasSelected) {
                this.applyCatlogFilters();
            }
            // ✅ only if empty → auto select first option
            else if (this.serviceTypeOptions?.length > 0) {
                this.selectedServiceType = this.serviceTypeOptions[0].value;
                this.selectedServiceTypeLabel = this.serviceTypeOptions[0].label;
                this.applyCatlogFilters();
            }
            else {
                this.filteredCatalogs = [];
            }



            console.log('Facility:', JSON.stringify(this.facility));
            console.log('Default selected service:', this.selectedServiceType);
            console.log(
                'Filtered catalogs:',
                JSON.stringify(this.filteredCatalogs, null, 2)
            );
        })
        .catch(error => {
            console.error('Apex error:', error);
        });
    }


    applyCatlogFilters() {
        console.log('--- applyCatlogFilters START ---');

        console.log('this.selectedServiceType >>>>', this.selectedServiceType);
        const selected = this.selectedServiceType;
        console.log('selected >>>>', selected);

        this.filteredCatalogs = this.allCatalogs
            .filter(rec => {
                if (!rec.Name) return false;

                // ✅ Miscellaneous → contains match
                if (selected === 'Miscellaneous') {
                    return rec.Name.startsWith('Miscellaneous');
                }

                // ✅ Others → contains match
                if (selected === 'Others') {
                    return rec.Name.startsWith('Others');
                }

                // ✅ Default → exact match
                return rec.Name === selected;
            })
            .map(rec => {
                const result = { ...rec };

                result.isFacilityRecord = !!rec.Facility__c;

                const states = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
                states.forEach(state => {
                    const fieldName = `${state}__c`;
                    const stateKey = `${state}State`;
                    const value = rec[fieldName];

                    result[stateKey] = value ? `$${value}` : '$0';
                });

                return result;
            });

        // ✅ APPLY SELECTION HERE
        this.applySelectionToFilteredCatalogs();

        // -------------------------------------------------
        // ✅ COUNTS
        // -------------------------------------------------

        // total filtered records
        this.totalCatalogues = this.filteredCatalogs.length;

        // how many are selected
        this.activeServices = this.filteredCatalogs.filter(
            rec => rec.isSelected === true
        ).length;

        // -------------------------------------------------

        this.cataloguePageNumber = 1;
        this.cataloguePaginate();

        console.log(
            'Filtered catalogs FINAL RESULT:',
            JSON.stringify(this.filteredCatalogs, null, 2)
        );

        console.log(
            'Counts => total:',
            this.filteredCatalogsCount,
            'selected:',
            this.selectedCatalogsCount
        );

        console.log('--- applyCatlogFilters END ---');
    }


    handleEditNDISSupportCat(event) {
        this.CreateorEditCatalogueName = 'Edit Service Catalogue';
        this.isEditNDISSupportCat = true;
        const recordId = event.currentTarget.dataset.id;
        console.log('Edit Facility record:', recordId);
        console.log('FORM DATA AFTER SET:', JSON.stringify(this.formData));
        console.log('SERVICE OPTIONS:', JSON.stringify(this.serviceTypeOptions));

        const selectedRecord = this.filteredCatalogs.find(
            rec => rec.Id === recordId
        );

        if (!selectedRecord) return;

        this.isEditMode = true;
        this.editingRecordId = recordId;

        console.log('Selected record:', JSON.stringify(selectedRecord, null, 2));

        // ✅ Populate formData (this drives UI)
        this.formData = {
            ...this.formData, // 🔑 THIS LINE FIXES EVERYTHING
            serviceType: selectedRecord.Name,
            supportItemName: selectedRecord.Support_Item_Name__c,
            supportItemNumber: selectedRecord.Support_Item_Number__c,
            ACT: selectedRecord.ACT__c ?? 0,
            NSW: selectedRecord.NSW__c ?? 0,
            NT: selectedRecord.NT__c ?? 0,
            QLD: selectedRecord.QLD__c ?? 0,
            SA: selectedRecord.SA__c ?? 0,
            TAS: selectedRecord.TAS__c ?? 0,
            VIC: selectedRecord.VIC__c ?? 0,
            WA: selectedRecord.WA__c ?? 0,
            Id: selectedRecord.Id
        };

        console.log('FORM DATA AFTER SET:', JSON.stringify(this.formData));

        this.isCreateCatalogueModalOpen = true;
    }

    get computedRateFields() {
        console.log('--- computedRateFields called ---');
        console.log('rateFields:', JSON.stringify(this.rateFields));
        console.log('formData:', JSON.stringify(this.formData));

        const result = this.rateFields.map(rate => {
            const value = this.formData[rate.field] ?? 0;

            console.log(
                `Mapping rate → field: ${rate.field}, value: ${value}`
            );

            return {
                ...rate,
                value: value
            };
        });

        console.log(
            'computedRateFields result:',
            JSON.stringify(result)
        );

        return result;
    }

    handleServiceTypeChange(event) {
        this.selectedServiceType = event.detail.value;
        console.log('Selected service:', this.selectedServiceType);
        this.isSelectAllChecked = false;
       /*  this.filteredCatalogs = this.allCatalogs.filter(rec => rec.Name === this.selectedServiceType); */
       this.applyCatlogFilters();
       
    }

    cataloguePaginate() {
        const records = Array.isArray(this.filteredCatalogs)
            ? this.filteredCatalogs
            : [];

        this.catalogueTotalRecords = records.length;
        this.cataloguePaginationVisible = this.catalogueTotalRecords > 0;

        this.catalogueTotalPages =
            this.cataloguePageSize > 0
                ? Math.ceil(this.catalogueTotalRecords / this.cataloguePageSize)
                : 1;

        // Clamp page number
        if (this.cataloguePageNumber < 1) {
            this.cataloguePageNumber = 1;
        }
        if (this.cataloguePageNumber > this.catalogueTotalPages) {
            this.cataloguePageNumber = this.catalogueTotalPages;
        }

        const start = (this.cataloguePageNumber - 1) * this.cataloguePageSize;
        const end = this.cataloguePageNumber * this.cataloguePageSize;

        // 🔑 NEW ARRAY + NEW OBJECTS
        this.catalogueRecords = records.slice(start, end).map(r => ({ ...r }));
    }

    get isSelectAllChecked() {
        if (!this.catalogueRecords || this.catalogueRecords.length === 0) {
            return false;
        }

        return this.catalogueRecords.every(rec => rec.isSelected === true);
    }

    catalogueFirstPage() {
        this.cataloguePageNumber = 1;
        this.cataloguePaginate();
    }

    cataloguePreviousPage() {
        if (!this.isCatalogueFirstPage) {
            this.cataloguePageNumber--;
            this.cataloguePaginate();
        }
    }

    catalogueNextPage() {
        if (!this.isCatalogueLastPage) {
            this.cataloguePageNumber++;
            this.cataloguePaginate();
        }
    }

    catalogueLastPage() {
        this.cataloguePageNumber = this.catalogueTotalPages;
        this.cataloguePaginate();
    }

    handleCatalogueRecordsPerPage(event) {
        this.cataloguePageSize = Number(event.target.value);
        this.cataloguePageNumber = 1;
        this.cataloguePaginate();
    } 
     handlePenaltyModeChange(event) {
        this.shiftPenaltyMode = event.detail.value;
    }

    get penaltyHelpText() {
        if (this.shiftPenaltyMode === 'Provider') {
            return 'Provider Based: Applies penalty rates only to the hours worked within defined Afternoon or Night time windows, rather than to the entire shift.';
        }

        return 'SCHADS Based: Applies Afternoon (12.5%) or Night (15%) penalty rates to the entire shift when the shift meets SCHADS Award definitions.';
    }    

    handleShiftCancellationChange(event) {
        const value = Number(event.target.value);

        if (value > 15) {
            event.target.value = 15;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Validation Error',
                    message: 'Maximum allowed value is 15',
                    variant: 'error'
                })
            );
        }
        else if(value > 7 && value <= 15){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Warning',
                    message: 'A cancellation notice period greater than 7 days exceeds NDIS requirements, and is not NDIS compliant',
                    variant: 'warning'
                })
            );
        }
    }

    handleEnableShiftRejection(event) {
        this.enableShiftRejection = event.target.checked;
        console.log('Shift Rejection Enabled:', this.enableShiftRejection);
    }

    mapCatalogueRecord(rec) {

        const result = { ...rec };

        // ⭐ REQUIRED FLAG FOR TABLE UI
        result.isFacilityRecord = !!rec.Facility__c;

        const states = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

        states.forEach(state => {
            const field = `${state}__c`;
            const key = `${state}State`;

            result[key] = rec[field] ? `$${rec[field]}` : '$0';
        });

        return result;
    }

    updateCatalogueCounts() {

        // Total records after filtering/search
        this.totalCatalogues = this.filteredCatalogs.length;

        // Selected (checked) records
        this.activeServices = this.filteredCatalogs.filter(
            rec => rec.isSelected === true
        ).length;
    }

    handleServiceTypeSearch(event) {
       
        /* --------------------------------
        STEP 1 — Capture input
        -------------------------------- */


        const rawValue = event?.target?.value || '';
        const searchKey = rawValue.toLowerCase().trim();

        this.selectedServiceTypeLabel = rawValue;

        /* --------------------------------
        STEP 2 — Validate data
        -------------------------------- */

        if (!this.allCatalogs || !Array.isArray(this.allCatalogs)) {
            return;
        }

        const originalList = [...this.allCatalogs];
        this.isSelectAllChecked = false;

        /* =====================================================
        CASE 1 — EMPTY SEARCH → RESTORE FULL TABLE
        ===================================================== */

        if (!searchKey) {

            // this.filteredCatalogs =
            //     originalList.map(rec => this.mapCatalogueRecord(rec));
            this.filteredCatalogs =
                originalList.map(rec => ({
                    ...this.mapCatalogueRecord(rec),
                    isSelected: false 
                }));


            //this.applySelectionToFilteredCatalogs();
            
            // ⭐ UPDATE COUNTS
            this.updateCatalogueCounts();

            // ⭐ RESET PAGINATION
            this.resetCataloguePagination(this.filteredCatalogs);

            this.cataloguePaginate();
            this.isSelectAllChecked = false;

            this.showServiceTypeDropdown = true;

            return;
        }

        /* =====================================================
        CASE 2 — SEARCH BY SUPPORT ITEM NUMBER → TABLE
        ===================================================== */

        const numberMatches = originalList.filter(item => {

            const number =
                (item.Support_Item_Number__c || '').toLowerCase();

            return number.includes(searchKey);
        });

        if (numberMatches.length > 0) {

            // this.filteredCatalogs =
            //     numberMatches.map(rec => this.mapCatalogueRecord(rec));

            // this.applySelectionToFilteredCatalogs();
            this.filteredCatalogs =
                numberMatches.map(rec => ({
                    ...this.mapCatalogueRecord(rec),
                    isSelected: false 
                }));

            // this.applySelectionToFilteredCatalogs();

            // ⭐ UPDATE COUNTS
            this.updateCatalogueCounts();

            this.resetCataloguePagination(this.filteredCatalogs);
            this.cataloguePaginate();
            
            this.isSelectAllChecked = false;

            this.showServiceTypeDropdown = true;

            return;
        }

        /* =====================================================
        CASE 3 — SEARCH BY NAME → DROPDOWN MODE
        ===================================================== */

        const nameMatches = originalList.filter(item => {

            const category =
                (item.Name || '').toLowerCase();

            return category.includes(searchKey);
        });

        const uniqueMap = new Map();

        nameMatches.forEach(item => {

            const label =
                item.Name || item.Support_Item_Name__c;

            if (!uniqueMap.has(label)) {
                uniqueMap.set(label, {
                    label: label,
                    value: item.Id,
                    disabled: false
                });
            }
        });

        this.filteredServiceTypes =
            Array.from(uniqueMap.values())
                .sort((a, b) => a.label.localeCompare(b.label));

        if (this.filteredServiceTypes.length === 0) {

            this.filteredServiceTypes = [{
                label: 'No results found',
                value: 'no-results',
                disabled: true
            }];
        }

        this.showServiceTypeDropdown = true;

        /* IMPORTANT — CLEAR TABLE */

        this.catalogueRecords = [];
        this.filteredCatalogs = [];
        this.isSelectAllChecked = false;

        // ⭐ UPDATE COUNTS (0)
        this.updateCatalogueCounts();

        // ⭐ RESET PAGINATION
        this.resetCataloguePagination([]);
    }

    resetCataloguePagination(records = []) {
        this.cataloguePageNumber = 1;

        this.catalogueTotalRecords = records.length;

        this.catalogueTotalPages = Math.max(
            1,
            Math.ceil(this.catalogueTotalRecords / this.cataloguePageSize)
        );

        this.cataloguePaginationVisible =
            this.catalogueTotalRecords > this.cataloguePageSize;
    }

    handleServiceTypeFocus() {

        console.log('Service type input focused');

        this.filteredServiceTypes = [...this.serviceTypeOptions];

        this.showServiceTypeDropdown = true;
    }

    handleServiceTypeSelect(event) {
        this.facilityCatalogue = false;
        this.facilitycompliancereport = true;

        setTimeout(() => {
            this.facilitycompliancereport = false;
            this.facilityCatalogue = true;
        }, 0);


        const value = event.currentTarget.dataset.id;
        const label = event.currentTarget.dataset.label;

        this.selectedServiceType = label;
        this.selectedServiceTypeLabelValue = label;
        this.selectedServiceTypeLabel = label;

        this.isSelectAllChecked = false;

        this.showServiceTypeDropdown = false;

        console.log('Selected Service Type:', label);
        this.applyCatlogFilters();
    }

    stopDropdownClick(event) {
        event.stopPropagation();
    }


 async handleAddEntity() {
     //this.recordId = null; 
    this._wasInEditMode = this.facilityeditflag;
        // ✅ Just fetch the companyId — nothing else needed
    if (!this.existingCompanyId) {
        try {
            const result = await getCompanyAndEntityStatus({ facilityId: this.recordId });
            this.existingCompanyId = result.companyId;
            this.existingCompanyName = result.companyName;
            console.log('✅ existingCompanyId resolved:', this.existingCompanyId);
        } catch (error) {
            console.error('❌ Error fetching company ID:', error);
        }
        
    }

    this.facviewFlag = false;
    this.facFlag = false;
    this.facilityflag = false;
    this.facilityeditflag = false;

    this.facilitydetails = false;
    this.facilityonboard = false;
    this.facilitydocument = false;
    this.facilityidentity = false;
    this.facilitytrainings = false;
    this.facilityshiftcompliance = false;
    this.facilitycompliancereport = false;
    this.facilityBulkEntity = false;
    this.facilityCatalogue = false;

    this.showAccountingEntity = true;
}
      handleBackFromEntity() {
    this.showAccountingEntity = false;

    this.facviewFlag = true;
    this.facFlag = false;
    this.facilityflag = true;
    this.facilityeditflag = true;
    this._wasInEditMode = false;

    this.facilitydetails = true;
    this.facilityonboard = false;
    this.facilitydocument = false;
    this.facilityidentity = false;
    this.facilitytrainings = false;
    this.facilityshiftcompliance = false;
    this.facilitycompliancereport = false;
    this.facilityBulkEntity = false;
    this.facilityCatalogue = false;

    this.sectionFlags = {
        ...this.sectionFlags,
        SIL: true
    };

    // ✅ FIX 2: Tell SIL settings to reload entity dropdown
    setTimeout(() => {
        const silCmp = this.template.querySelector('c-facility-s-i-l-settings');
        if (silCmp) {
            silCmp.refreshEntities();
        }
    }, 300);
    }   

// validateStepFields(stepName) {
//     let missingFields = [];

//     const currentStepEl = this.template.querySelector(
//         `[data-step="${stepName}"]`
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
    

//     // 🔹 CUSTOM MULTI COMBOBOX
//     const customFields = currentStepEl.querySelectorAll('[data-id="mandatory"]');

//     customFields.forEach(field => {
//         if (field.tagName.includes('C-TESSERACT-APPS-MULTI-COMBOBOX')) {
//             if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
//                 missingFields.push(field.dataset.label || 'Facility');
//             }
//         }
//     });

//     // 🔹 ADDRESS VALIDATION
//     const addressCmp = currentStepEl.querySelector('[data-id="mandatory-address"]');
//     if (addressCmp) {
//         if (!this.street) missingFields.push('Street');
//         if (!this.city) missingFields.push('Suburb');
//         if (!this.province) missingFields.push('State');
//         if (!this.postalcode) missingFields.push('Post Code');
//         if (!this.country) missingFields.push('Country');
//     }

//     return [...new Set(missingFields)];
// }
// validateStepFields(stepName) {
//     let missingFields = [];
//     const currentStepEl = this.template.querySelector(
//         `[data-step="${stepName}"]`
//     );
//     if (!currentStepEl) return missingFields;

//     // 🔹 STANDARD FIELDS — skip ABN (handled separately below)
//     const fields = currentStepEl.querySelectorAll(
//         'lightning-input, lightning-input-field, lightning-combobox, lightning-textarea'
//     );
//     fields.forEach(field => {
//         if (field.required && field.dataset.id !== 'abnInput') {
//             const isValid = field.reportValidity();
//             if (!isValid) {
//                 let label = field.dataset.label || field.label || field.fieldName || 'Field';
//                 label = label.replace(/__c/g, '').replace(/_/g, ' ');
//                 missingFields.push(label);
//             }
//         }
//     });

//     // 🔹 CUSTOM MULTI COMBOBOX
//     const customFields = currentStepEl.querySelectorAll('[data-id="mandatory"]');
//     customFields.forEach(field => {
//         if (field.tagName.includes('C-TESSERACT-APPS-MULTI-COMBOBOX')) {
//             if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
//                 missingFields.push(field.dataset.label || 'Facility');
//             }
//         }
//     });

//     // 🔹 ADDRESS VALIDATION
//     const addressCmp = currentStepEl.querySelector('[data-id="mandatory-address"]');
//     if (addressCmp) {
//         if (!this.street)      missingFields.push('Street');
//         if (!this.city)        missingFields.push('Suburb');
//         if (!this.province)    missingFields.push('State');
//         if (!this.postalcode)  missingFields.push('Post Code');
//         if (!this.country)     missingFields.push('Country');
//     }

//     // 🔹 ROLES VALIDATION (only when NdisFlag is true)
//     const rolesDropdown = currentStepEl.querySelector('lwc\\:ref[dropdownContainer], [lwc\\:ref="dropdownContainer"]');
//     if (this.NdisFlag) {
//         const hasActiveRole = this.options && this.options.some(opt => opt.checked && opt.isActive);
//         if (!hasActiveRole) {
//             missingFields.push('Roles');
//         }
//     }

//     // 🔹 SERVICES VALIDATION
//     const servicesDropdown = currentStepEl.querySelector('[lwc\\:ref="dropdownContainerServices"]');
//     if (servicesDropdown || currentStepEl.querySelector('.dropdown-container1')) {
//         const hasSelectedService = this.allServices && this.allServices.some(svc => svc.checked);
//         if (!hasSelectedService) {
//             missingFields.push('Services');
//         }
//     }

//     // 🔹 ABN VALIDATION — single block, no internal toast
// const abnInput = currentStepEl.querySelector('[data-id="abnInput"]');
// if (abnInput) {
//     const abnValue = (this.ABN || '').replace(/\s/g, '');

//     if (!abnValue) {
//         // ✅ Empty → call reportValidity() to turn the field RED (same as other fields)
//         abnInput.reportValidity();
//         missingFields.push('ABN');
//     } else if (abnValue.length !== 11) {
//         // ✅ Wrong length → push descriptive message into toast
//         missingFields.push('ABN must be exactly 11 digits');
//     }
// }

//     return [...new Set(missingFields)];
// }

validateStepFields(stepName) {
    let missingFields = [];
    const currentStepEl = this.template.querySelector(
        `[data-step="${stepName}"]`
    );
    if (!currentStepEl) return missingFields;

    // 🔹 STANDARD FIELDS — skip ABN & skip disabled fields
    const fields = currentStepEl.querySelectorAll(
        'lightning-input, lightning-input-field, lightning-combobox, lightning-textarea'
    );
    fields.forEach(field => {
        if (field.required && !field.disabled && field.dataset.id !== 'abnInput') {
            const isValid = field.reportValidity();
            if (!isValid) {
                let label = field.dataset.label || field.label || field.fieldName || 'Field';
                label = label.replace(/__c/g, '').replace(/_/g, ' ');
                missingFields.push(label);
            }
        }
    });

    // 🔹 CUSTOM MULTI COMBOBOX
    const customFields = currentStepEl.querySelectorAll('[data-id="mandatory"]');
    customFields.forEach(field => {
        if (field.tagName.includes('C-TESSERACT-APPS-MULTI-COMBOBOX')) {
            if (!this.selctedMultipleFcailityValues || this.selctedMultipleFcailityValues.length === 0) {
                missingFields.push(field.dataset.label || 'Facility');
            }
        }
    });

    // 🔹 ADDRESS VALIDATION
    const addressCmp = currentStepEl.querySelector('[data-id="mandatory-address"]');
    if (addressCmp) {
        if (!this.street)     missingFields.push('Street');
        if (!this.city)       missingFields.push('Suburb');
        if (!this.province)   missingFields.push('State');
        if (!this.postalcode) missingFields.push('Post Code');
        if (!this.country)    missingFields.push('Country');
    }

    // 🔹 ROLES VALIDATION (only when NdisFlag is true)
    if (this.NdisFlag) {
        const hasActiveRole = this.options && this.options.some(opt => opt.checked && opt.isActive);
        if (!hasActiveRole) {
            missingFields.push('Roles');
        }
    }

    // 🔹 SERVICES VALIDATION
    if (currentStepEl.querySelector('.dropdown-container1')) {
        const hasSelectedService = this.allServices && this.allServices.some(svc => svc.checked);
        if (!hasSelectedService) {
            missingFields.push('Services');
        }
    }

    // 🔹 ABN VALIDATION — single block, no internal toast
    const abnInput = currentStepEl.querySelector('[data-id="abnInput"]');
    if (abnInput) {
        const abnValue = (this.ABN || '').replace(/\s/g, '');
        if (!abnValue) {
            // Empty → reportValidity() turns field RED
            abnInput.reportValidity();
            missingFields.push('ABN');
        } else if (abnValue.length !== 11) {
            // Filled but wrong length → descriptive toast message
            missingFields.push('ABN must be exactly 11 digits');
        }
    }

    return [...new Set(missingFields)];
}
showError(message) {
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Error',
            message: message,
            variant: 'error'
             // stays visible
        })
    );
}    
 

}