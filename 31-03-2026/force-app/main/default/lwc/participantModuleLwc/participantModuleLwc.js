import {LightningElement,track,wire,api} from 'lwc';
import fetchFacilitiess from '@salesforce/apex/ClientSearchController.fetchFacilitiess';
import statusClient from '@salesforce/apex/ClientSearchController.statusClient';
import { NavigationMixin } from 'lightning/navigation';
import {refreshApex} from '@salesforce/apex';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import My_Resource from "@salesforce/resourceUrl/myResource";
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getStaffData from '@salesforce/apex/ClientDataController.getStaffData';     //Manimala added 15-17
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails'; 
import insertStaffRecords from '@salesforce/apex/ClientDataController.insertStaffRecords';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getstaffId from '@salesforce/apex/UserAccessController.getstaffId';
import getStaffMembers from '@salesforce/apex/PreferredStaffController.getStaffMembers';
import getRoles from '@salesforce/apex/PreferredStaffController.getRoles'; 
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';    
import updateStaffAssignments from '@salesforce/apex/ClientDataController.updateStaffAssignments';
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';
import updateParticipantContacts from "@salesforce/apex/ClientDataController.updateParticipantContacts";
import upsertParticipantFacilities from '@salesforce/apex/staffFacilityHandler.upsertParticipantFacilities';

const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};


export default class ParticipantModuleLwc extends LightningElement {
   // client records are displyed card view by default
   value = 'cardview';
    
   Search = My_Resource+'/myResource/images/Participants.svg';
   @api userId = USER_ID;
   // JS Properties
   @track  availablePatients=[];
   @api recordId;
   @api participantdetails;
   @api riskindexdetails;
   @api navigatedParticipantId;
   subscription = {};
   CHANNEL_NAME = '/event/RefreshDataTable__e'; 
   records = []; //All records available in the data table
   records1 = []; //All records available in the data table
   columns = []; //columns information available in the data table
   totalRecords = 0; //Total no.of records
   pageSize; //No.of records to be displayed per page
   totalPages; //Total no.of pages
   pageNumber = 1; //Page number    
   recordsToDisplay = []; //Records to be displayed on the page
   @track refreshTable=[];
   @track recordsToDisplay=[];
   @track searchKey;
   @track cardFlag=true;
   @track listFlag=false;
   @track isDetails=false;
   @track isHome=true;
   @track noRecordsFlag=false;

   currentPageReference = null; 
   urlStateParameters = null;
   @api selectedName='';
   @api facilityButton;
   @track orgNam='';
   selectedfields =[];
   @track visible=false;
   @track name;
   @track currentUserRole;
   @track error;
   @track inputValue;
   isLoading=true;
   @track ParticpantRecordForm;
   
   @track participantJson = {};
   @track orgId;
   @track lastName='';
   @track firstName='';
   @track fullName;
   @track errorMessage = '';
   @track saveButtonDisable = false;
   @track street;
   @track city;
   @track country;
   @track province;
   @track postalcode;
   @track headerName;
   @track buttonLabel;
   @track ndisFlag;
   @track ndisCreateFlag = false;
   @track nonndisFlag = false;
   @track individualFlag = false;
   @track CompanyFlag = false;
   @track ParticipantType;

   @track isExec=false;
   @track isManager=false;
   @track isStaff=false;
   @track showSpinner = false;
   @track statusFlag = false; 
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
   @track OrgNisationRoles=[];      //Manimala added 96-104      
   @track facilityId = ''; 
   @track staffOptions = [];
   @track staffName = []; // For selected staff
   @track role = '';
   @track staffName;
   @track staffRecID; 
   @track roleStaffFlag=false; 
   @track headeringName;  
   @track addStaffDisable = true;
   @track orginalData=[];
   @track fieldErrorMap = {};
   @track serializedPayload;
   @track close = 'Edit';
   @track facilityPreferredName;
   @track participantPreferredName;
   @track navigatedFromNotifications= false;
   @track isMultiClientUpload= false;

   @track showClientCreationTemplate=false;
   @track clientCreationTypeName;
   @track clientWithUser;
   clientCreationTypes = [
      { label: 'Create a user account for the participant', value: 'Create a user account for the participant' },
      { label: 'Managed by admin only', value: 'Managed by admin only' }
   ];
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
  
    // Icons for the toggle buttons
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

    //  @track sectionIcons = {
    //     PartcipantDetails: '\u2B9F', 
    //     Addressdetails: '\u2B9C',
    //     IdentificationDetails: '\u2B9C',
    //     ParticipantIdentifiers: "\u2B9C",
    //     MedicalCardDetails: "\u2B9C",
    //     InsuranceDetails: '\u2B9C',
    //     PrimaryContactDetails: '\u2B9C',
    //     SecondaryContactDetails: '\u2B9C',   
    //     OtherPreferences: "\u2B9C",
    // };

        @track sectionIcons = {
        PartcipantDetails: { ...ICON_DOWN },

        Addressdetails: { ...ICON_LEFT },
        IdentificationDetails: { ...ICON_LEFT },
        ParticipantIdentifiers: { ...ICON_LEFT },
        MedicalCardDetails: { ...ICON_LEFT },
        InsuranceDetails: { ...ICON_LEFT },
        PrimaryContactDetails: { ...ICON_LEFT },
        SecondaryContactDetails: { ...ICON_LEFT },
        OtherPreferences: { ...ICON_LEFT },
        };

        @track facilityOptions=[];
        @track userFacilities=[];
        @track finalListFacilities=[];
        @track facilityCheckboxOptions=[];
    
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
      @track Languages = [];

    @track showContactTypeModal = false;
    @track newContactTypeName = '';
    @track customContactTypes = [];
    @track stagedDeleteTypes = [];          // ✅ ARRAY (not Set)
    @track activeContactRowIndex;
    @track previousContactType;             // ✅ STORE OLD VALUE
      @track typeOfIndustry=[{ label: 'NDIS', value: 'NDIS' },
                           { label: 'Non-NDIS', value: 'Non-NDIS' },
      ];
  @track multiFacilityDroDownList=[];
  @track selctedMultipleFcailityValues=[];
  @track facilityDropDownOpen=false;
  @track activeFaciltyDisplay='';
  @track selectedTypeOfIndustry='NDIS';
   @track  orginalSelectedFacilities=[];

@track contactTypeOptions = [
    { label: 'Primary', value: 'Primary' },
    { label: 'Secondary', value: 'Secondary' },
    { label: 'Emergency', value: 'Emergency' },
    { label: 'Add New', value: 'Add New Contact Type' }
];
  @track isMedicareEntered = false;
      @api
    opendetailslwc(ParticipantId) {
        console.log('StaffDataCommunity: Opening CreateEditStaff with ID', ParticipantId);
        this.recordId=ParticipantId;
        this.isDetails=true;

        // ✅ Call the method on the super-child
        const participantEdit = this.template.querySelector('c-details-lwc');
        if (participantEdit) {
            participantEdit.showFundtracker(ParticipantId);
        }
    }


handleFormsClick() {
    this.dispatchEvent(new CustomEvent('openforms'));
}

    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute

        // Toggle the flag and update the icon dynamically
        // this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
        // this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
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

    handleChange1(event){
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        event.target.value = inputValue;
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
       console.log('message >>', message);
     
    // 4. Show all errors as a toast
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Update Failed',
            message: message,
            variant: 'error',
           
        })
    );
}
   
   @wire(getRecord, {
       recordId: USER_ID,
       fields: [NAME_FIELD,UsrRoleName]
   }) wireuser({
       error,
       data
   }) {
       if (error) {
           this.error = error;
       } else if (data) {
           this.name = data.fields.Name.value;
           this.currentUserRole =data.fields.User_Role__c.value;
           console.log('CUrrent Role>'+this.currentUserRole);
           if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
               this.isExec=true;
               this.isManager=false;
               this.isStaff=false;
               this.statusFlag = true;
               this.isStatusTrue = false;
               console.log('Org Data>>'+this.statusFlag);
               console.log('org Status'+this.isStatusTrue);
           }
           if(this.currentUserRole == 'Portal Account Partner Manager'){
               this.isExec=false;
               this.isManager=true;
               this.isStaff=false;
               this.statusFlag = true;
               this.isStatusTrue = false;
           }
           if(this.currentUserRole == 'Portal Account Partner User'){
               this.isExec=false;
               this.isManager=false;
               this.isStaff=true;
               this.statusFlag = false;
               this.isStatusTrue = true;
               console.log('Staff Status'+this.isStatusTrue);
               console.log('Staff Data>>'+this.statusFlag);
           }             
       }

       console.log('this.isStaff  >>', this.isStaff);
   } 
  
   
   get bDisableFirst() {
       return this.pageNumber == 1;
   }
   get bDisableLast() {
       return this.pageNumber == this.totalPages;
   }
   // connectedCallback method called when the element is inserted into a document
   connectedCallback() { 
   
      // this.disableRightClick();
      // this.disableShortcuts(); 
          this.addKeyboardShortcuts(); 
          //window.addEventListener('keydown', this.handleKeyShortcut.bind(this));
          this.setPageSizeByZoomAndScreen(); // Initial setup
          this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
          this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";

        // Add responsive listener
        window.addEventListener('resize', this.handleResize.bind(this));
        this._handleOutsideFacilityClick = this.handleOutsideFacilityClick.bind(this); // ✅ bind once
        window.addEventListener('click', this._handleOutsideFacilityClick);

       //Platform Event 
       subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
           this.subscription = response;
       });
       onError(error => {
           
       }); 

        //  this.fetchMultiFaciltyOptions();
       //Manimala added 165-174
       organizationDetails().then(response => {
           console.log("working", JSON.stringify(response));
           let orgRoles= response.listofPriceBook.Roles__c;
           this.state =response.listofPriceBook.Address_Latest__StateCode__s;
           //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
           //console.log("facilityPreferredName==>", response.listofPriceBook.Facility_Preferred_Name_Formula__c);
           //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;
           
            console.log('state:', response.listofPriceBook.Address_Latest__StateCode__s);
           //console.log('listofPriceBook:', response.listofPriceBook);
        //    this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
        //      return {
        //      value: rec,
        //      label: rec
        //      };
        //    });
       }) ;
       this.isHome=true;
       console.log(' risk deatils from dashboard  '+JSON.stringify(this.riskindexdetails));
      console.log('this.riskindexdetails.length '+this.riskindexdetails.length )
       if((this.riskindexdetails.naviagte !=null || this.riskindexdetails.naviagte != undefined || this.riskindexdetails.naviagte !='')&&this.riskindexdetails.naviagte=='riskmanagement'){
                this.recordId=this.riskindexdetails.participantId;
                this.ndisFlag = this.riskindexdetails.ndisFlag || false;
                this.editstaffflag = true;
                this.isDetails=false;
                this.isHome = false;
       }
        if(this.participantdetails && Object.keys(this.participantdetails).length > 0){
        this.recordId=this.participantdetails.id;
        this.editstaffflag = true;
        this.isDetails=false;
        this.isHome = false;
        this.ndisFlag = (this.participantdetails.service === 'NDIS');
            if (!this.ndisFlag) {
            // Only check ParticipantType when NDIS is false
           

            // Set flags based on participant type
            this.individualFlag = (this.participantdetails.type === 'Individual');
            this.CompanyFlag = (this.participantdetails.type === 'Company');
             this.ndisCreateFlag=false;
        } else {
            // If NDIS is true, all others false
            this.individualFlag = false;
            this.CompanyFlag = false;
            this.ndisCreateFlag=true;
        }

       }

        console.log('navigatedParticipantId in connectedCallback '+ this.navigatedParticipantId);
        if(this.navigatedParticipantId){
             this.recordId=this.navigatedParticipantId;
             this.editstaffflag = true;
             this.isDetails=false;
             this.isHome = false;
             this.navigatedFromNotifications= true;
             this.ndisFlag= true;
        }
        // Add a placeholder option and reset initial Nationality
            this.filteredOptions = [
                { label: '-- Select Nationality --', value: '' },
                ...this.allNationalities.map(n => ({ label: n, value: n }))
            ];
            this.Nationality = ''; // ✅ ensures no default value

            // Initialize Languages with proper structure
            this.Languages = this.LANGUAGE_OPTIONS.map(lang => ({
                id: lang,
                label: lang,
                checked: false, // Start with all unchecked
                buttonClass: 'option-button',
                badgeClass: 'status-badge inactive',
                statusText: 'Inactive'
            }));

        // Initialize selectedLangs as empty array
        this.selectedLangs = [];
     

        console.log('Languages>>', this.Languages);
        console.log('Selected Languages>>', this.selectedLangs);
   }

   disableRightClick() {
       document.addEventListener('contextmenu', function(e) {
           e.preventDefault();
       });
   }

   disableShortcuts() {
       document.addEventListener('keydown', function(e) {
           // Prevent F12 (Inspect), Ctrl+Shift+I (Inspect), Ctrl+Shift+C (Element picker), and Ctrl+Shift+J (Console)
           if (
               e.key === 'F12' ||
               (e.ctrlKey && e.shiftKey && e.key === 'I') ||
               (e.ctrlKey && e.shiftKey && e.key === 'C') ||
               (e.ctrlKey && e.shiftKey && e.key === 'J') ||
               (e.ctrlKey && e.shiftKey && e.key === 'K')
           ) {
               e.preventDefault();
           }
       });
   }

   filterState = 'All';
   @track filteredRecords = [];
   @track participantlabel='All';
   handleToggleparticipant() {
       if (this.filterState === 'All') {
           this.filterState = 'Active';
       } else if (this.filterState === 'Active') {
           this.filterState = 'Inactive';
       } else {
           this.filterState = 'All';
       }
       console.log('total records'+JSON.stringify(this.refreshTable));
       if (this.filterState === 'Active') {
           this.participantlabel='Active';
           this.filteredRecords = this.records1.filter(record => record.Status__c === true );
           
       } else if (this.filterState === 'Inactive') {
            this.participantlabel='Inactive';
           this.filteredRecords = this.records1.filter(record => record.Status__c === false );
       } else {
           this.participantlabel='All'
           this.filteredRecords = [...this.records1]; 
       }
   
       this.records = this.filteredRecords;
       this.totalRecords = this.filteredRecords.length;
       console.log('total records'+this.totalRecords);
       this.paginationHelper();
   }


   // Manimala added 177-188
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
       this.getStaffValues(); // Fetch staff based on the new facility
       console.log('Selected facility >> ' + this.facilityId);
       this.addStaffDisable = !this.facilityId;
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
    //   const isNdis = !this.individualFlag && !this.CompanyFlag;
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
       
  }

//   handleContactsChange(event) {
//       const index = event.target.dataset.index;
//       const field = event.target.name;
//       // let value = event.target.value;
//       let value;
//       if (event.target.type === "checkbox") {
//           value = event.target.checked;
//       } else {
//           value = event.target.value;
//       }
//        this.contactList[index][field] = value;
//        if (field === 'notify' && value === true && !this.contactList[index].email) {
//             this.dispatchEvent(
//                 new ShowToastEvent({
//                     title: 'Email Required',
//                     message: `Email is required when Notify is selected ( Contact Row ${index + 1}).`,
//                     variant: 'error'
//                 })
//             );

//             // ⛔ Revert checkbox to false
//         // this.contactList[index].notify = false;
//         }
//       // If user selected "Add New Contact Type"
//       if (field === "contactType" && value === "Add New Contact Type") {
//           this.contactList[index].showNewTypeInput = true;   // open textbox
//           this.contactList = [...this.contactList];
//           return;
//       }

//       this.contactList[index][field] = value;

//       const isMandatory =
//         this.contactList[index].contactType === 'Primary';

//         this.contactList[index].firstNamePlaceholder =
//             isMandatory  ? '* Enter Name' : 'Enter Name';

//         this.contactList[index].lastNamePlaceholder =
//             isMandatory  ? '* Enter Name' : 'Enter Name';

//         this.contactList[index].phonePlaceholder =
//             isMandatory  ? '* Enter Number' : 'Enter Number';

//         this.contactList[index].emailPlaceholder =
//             isMandatory  ? '* Enter Email' : 'Enter Email';
//       this.contactList = [...this.contactList];
//   }

handleContactsChange(event) {
    const index = event.target.dataset.index;
    const field = event.target.name;
    let value = event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;

    /* ===============================
       ADD NEW CONTACT TYPE
       =============================== */
    // if (field === 'contactType' && value === 'Add New Contact Type') {

    //     // ✅ store row index
    //     this.activeContactRowIndex = index;

    //     // ✅ store previous value
    //     this.previousContactType = this.contactList[index].contactType;

    //     // ❌ DO NOT update contactList here
    //     this.showContactTypeModal = true;
    //     return;
    // }
     if (field === 'contactType' && value === 'Add New Contact Type') {

        this.activeContactRowIndex = index;
        this.previousContactType = this.contactList[index].contactType;

        this.contactList[index].contactType = this.previousContactType || '';

        this.contactList = [...this.contactList]; // force UI sync

        this.showContactTypeModal = true;
        return;
    }

    // Normal assignment
    this.contactList[index][field] = value;

    /* ===============================
       NOTIFY VALIDATION
       =============================== */
    if (field === 'notify' && value && !this.contactList[index].email) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Email Required',
                message: `Email is required when Notify is selected (Row ${index + 1})`,
                variant: 'error'
            })
        );
        this.contactList[index].notify = false;
    }

    /* ===============================
       PRIMARY VALIDATION
       =============================== */
    const isMandatory = this.contactList[index].contactType === 'Primary';

    this.contactList[index].firstNamePlaceholder =
        isMandatory ? '* Enter Name' : 'Enter Name';
    this.contactList[index].lastNamePlaceholder =
        isMandatory ? '* Enter Name' : 'Enter Name';
    this.contactList[index].phonePlaceholder =
        isMandatory ? '* Enter Number' : 'Enter Number';
    this.contactList[index].emailPlaceholder =
        isMandatory ? '* Enter Email' : 'Enter Email';

    this.contactList = [...this.contactList];
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
            this.contactList[this.activeContactRowIndex].contactType = '';
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
      const value = event.currentTarget.dataset.value;

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

      if (!this.stagedDeleteTypes.includes(value)) {
          this.stagedDeleteTypes = [...this.stagedDeleteTypes, value];
      }
  }

  resetContactTypeModal() {
      this.showContactTypeModal = false;
      this.newContactTypeName = '';
      // this.activeContactRowIndex = undefined;
      // this.previousContactType = undefined;
      this.activeContactRowIndex = null;
      this.previousContactType = null;
     
      this.stagedDeleteTypes = [];
      console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
        this.contactList = [...this.contactList];
      console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
  }

  cancelNewContactType(event) {
      const index = event.target.dataset.index;
      this.contactList[index].newContactTypeValue = '';
      this.contactList[index].showNewTypeInput = false;
      this.contactList = [...this.contactList];
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

   handleChangeRole(event) {
       console.log('onchange '+JSON.stringify(event.detail));
       this.role = event.detail.value; // Handle combobox value change
       console.log('Selected Role >> ' + this.role);
       this.getStaffValues(); 
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
          
       });
       console.log('disconnected call back '+ this.editstaffflag);
       this.riskindexdetails={};
       this.editstaffflag=false;
       window.removeEventListener('resize', this.handleResize.bind(this));
       window.removeEventListener('click', this._handleOutsideFacilityClick);
       //window.removeEventListener('keydown', this.handleKeyShortcut.bind(this));
       this.removeKeyboardShortcuts();
   }
   // clients records are displayed based on flag start
   get options() {
       return [
           { label: 'Card View', value: 'cardview' },
           { label: 'List View', value: 'listview' },
       ];
   }

   handleChange(event) {
       this.value = event.target.dataset.name;
       if(this.value=='cardview'){
           this.showSpinner= true;
           this.cardFlag=true;
           this.listFlag=false;
           this.showSpinner= false;
       }else  if(this.value=='listview'){
           this.showSpinner= true;
           this.cardFlag=false;
           this.listFlag=true;
           this.showSpinner=false;
       }
   }

   @track isStatusTrue =false;
   // clients records are displayed based on flag end
   @wire( fetchFacilitiess,{recordId : '$selectedName', isTrue : '$isStatusTrue'} )  recordsToDisplay( result) {  
    console.log('result for participant in fetchFacilitiess >>',JSON.stringify(result));
       
       this.refreshTable= result;
       console.log('refreshTable for participant in fetchFacilitiess >>',JSON.stringify(this.refreshTable));
       let finalData=[];
       if (result.data) {
           this.records = result.data;
          
           finalData = result.data;
            finalData =  finalData.map(item => {
            return {
                ...item,
                activeFaciltyDisplay: (item.Participant_Facilities__r || [])
                    .map(f => f.Facility__r?.Name)
                    .filter(Boolean)
                    .join(', ')
            };
        });
           
           if (Array.isArray(this.records)) {
               this.records.forEach(item => {
                    let firstName = item.First_Name__c || '';
                    let lastName = item.Last_Name__c || '';
                    
                   this.participantJson[item.Id] = {
                       "street": item.Address__Street__s,
                       "city": item.Address__City__s,
                       "stateCode": item.Address__StateCode__s,
                       "countryCode": item.Address__CountryCode__s,
                       "postalCode": item.Address__PostalCode__s,
                       "status": item.Status__c,
                       "orgId":item.Facility__r.Organisation__c,
                       
                       "lastName":lastName,
                       "firstName":firstName,
                       //"name": `${firstName} ${lastName}`.trim(),
                       "name": (`${firstName || ''} ${lastName || ''}`.trim()) || item.Company__c,
                       "typeofservice":item.Facility__r.Type_of_Service__c,
                       "participanttype":item.ParticipantType__c,
                       "languages": item.Preferred_Languages__c || "", 
                    "nationality": item.Preferred_Nationality__c || "",
                   };
               });
              // this.noRecordsFlag=true;
           }else{
               //this.noRecordsFlag=false;
           }
            const storedFacilityId = localStorage.getItem('defaultFacilityId');
            const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
            console.log('storedFacilityId'+storedFacilityId);
            console.log('storedFacilityLabel'+storedFacilityLabel);
            
               getCurrentLoggedUserInfo().then(userData=>{
                        let userType=userData.User_Type__c;
                        const participantType  = userData.Participant_Type__c;
                         console.log('user data participantType ==>', participantType);
                        const userEmail = userData.Email;   
                        console.log('user data ==>'+JSON.stringify(userData));
                           getFacilityData().then(facresponse => {
                                                console.log('Facility data fetched successfully:', facresponse);
                                                this.finalListFacilities=[];
                                                this.selectedFacilities=[];
                                                this.facilityOptions = facresponse.map(record => ({
                                                    label: record.Name,
                                                    value: record.Id
                                                }));
                    if( userType =='NDIS Org Admin' || userType == 'ICT Admin'){
                        this.finalListFacilities= this.facilityOptions ;
                        this.facilityCheckboxOptions = this.facilityOptions
                        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(option => {
                                    return {
                                    ...option,
                                    checked: option.value === storedFacilityId
                                    };
                        });

                        // 2. Set as selected bubble
                        this.selectedFacilities = [{
                                label: storedFacilityLabel,
                                value: storedFacilityId
                        }];
                             console.log('Fetch Participant123>>>'+ JSON.stringify(result));
                             //finalData =result.data;
                            this.records =finalData ;
                            
                            this.orginalData=finalData;
                            console.log('Fetch Participant finalData>>>'+ JSON.stringify(finalData));
                            this.totalRecords = finalData.length; // update total records count                 
                            this.pageSize = 12;
                            if(this.totalRecords>6){
                            this.visible=true;
                            }
                            this.setPageSizeByZoomAndScreen();   
                            this.applyFilters(); 
                           // this.paginationHelper(); // call helper menthod to update pagination logic           
                            this.ParticpantRecordForm=false;
                            this.showSpinner = false;
                    }else if(userType =='Facility Admin' || userType =='HR Admin' || userType =='Roster Manager'){
                        getFacilityCurrentUser().then(result => {
                                        console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                            this.facilityCheckboxOptions =  result.map(record => ({
                                                                                                    label: record.Facility__r.Name,
                                                                                                    value: record.Facility__r.Id
                                                                                        }));
                                                    this.finalListFacilities= this.facilityCheckboxOptions ;                                       

                                                                                        let facilityIds = this.facilityCheckboxOptions.map(f => f.value);
                    
                            console.log('facilityIds  '+JSON.stringify(facilityIds))
                        /*   const filteredData = finalData.filter(rec =>
                            facilityIds.includes(rec.Facility__c)
                        );*/
                            const filteredData = finalData.filter(rec => {
                                                const facilities = rec.Participant_Facilities__r || [];
                                                return facilities.some(sf =>
                                                        facilityIds.includes(sf.Facility__c)
                                                );
                                }); 
                        this.facilityCheckboxOptions =  this.facilityCheckboxOptions
                                this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(option => {
                                return {
                                ...option,
                                checked: option.value === storedFacilityId
                                };
                        });

                        // 2. Set as selected bubble
                        this.selectedFacilities = [{
                                label: storedFacilityLabel,
                                value: storedFacilityId
                        }];

                        this.records =filteredData ;
                            this.orginalData=filteredData;
                        console.log('Fetch Participant filteredData>>>'+ JSON.stringify(filteredData));
                            console.log('Fetch Participant filteredData length >>>'+filteredData.length);
                        this.totalRecords = filteredData.length; // update total records count                 
                        this.pageSize = 12;
                        if(this.totalRecords>6){
                        this.visible=true;
                        }
                        this.setPageSizeByZoomAndScreen();   
                        this.applyFilters(); 
                        // this.paginationHelper(); // call helper menthod to update pagination logic           
                        this.ParticpantRecordForm=false;
                        this.showSpinner = false;
                        })
            
                        
                    } else if (userType === 'NDIS Staff' || userType === 'ICT Staff') {
                        getstaffId({ userId: this.userId })
                            .then(staffresult => {
                                console.log('NDIS/ICT Staff facility result >>', staffresult);

                                if (staffresult && staffresult.Facility__c && staffresult.Facility__r?.Name) {
                                    let facilityValue = staffresult.Facility__c;
                                    let facilityLabel = staffresult.Facility__r.Name;
                                    this.finalListFacilities = [{
                                        label: facilityLabel,
                                        value: facilityValue
                                    }];

                                    //localStorage.setItem('defaultFacilityId', this.facilityValue);
                                    //localStorage.setItem('defaultFacilityLabel', this.facilityLabel);

                                    console.log('NDIS/ICT Staff facility from Apex:', JSON.stringify(this.finalListFacilities));
                                    // 2. Set as selected bubble
                                    this.selectedFacilities = [{
                                            label: storedFacilityLabel,
                                            value: storedFacilityId
                                    }];
                                        console.log('Fetch Participant>>>'+ JSON.stringify(result));
                                        //finalData =result.data;
                                        this.records =finalData ;
                                        
                                        this.orginalData=finalData;
                                        console.log('Fetch Participant finalData>>>'+ JSON.stringify(finalData));
                                        this.totalRecords = finalData.length; // update total records count                 
                                        this.pageSize = 12;
                                        if(this.totalRecords>6){
                                        this.visible=true;
                                        }
                                        this.applyFilters(); 
                                    // this.paginationHelper(); // call helper menthod to update pagination logic           
                                        this.ParticpantRecordForm=false;
                                        this.showSpinner = false;
                                }
                            })
                            .catch(error => {
                                this.error = error;
                                this.finalListFacilities = [];
                                console.error('Error fetching staff data for NDIS/ICT Staff:', error);
                            });
                    } else if (userType === 'NDIS Participants') {
                        console.log('🔐 NDIS Participant logged in:', userEmail);
                        console.log('👤 Participant Type:', participantType);

                        const finalParticipants = finalData.filter(rec => {
                        // Check 1: Participant's own Email__c matches
                        const participantEmailMatch = 
                            rec.Email__c?.toLowerCase() === userEmail?.toLowerCase();

                        // Check 2: Guardian contact email matches (existing logic)
                        const contacts = rec.Participant_Contacts__r || [];
                        const guardianMatch = contacts.some(contact =>
                            contact.Email__c?.toLowerCase() === userEmail?.toLowerCase() &&
                            contact.Contact_Type__c === 'Guardian'
                        );

                        return participantEmailMatch || guardianMatch;
                    });

                    console.log('Filtered Guardian Participants:', finalParticipants);

                        // 📌 Assign to UI
                        this.records = finalParticipants;
                        this.orginalData = finalParticipants;
                        this.recordsToDisplay = [...finalParticipants];

                        this.totalRecords = finalParticipants.length;
                        this.pageSize = finalParticipants.length;
                        this.visible = false;
                        this.noRecordsFlag = finalParticipants.length === 0;

                        this.applyFilters();
                        this.showSpinner = false;
                        return;
                    }
 

                
                
                })
                        
                        
             })

       }
       
        const storedclientId = localStorage.getItem('clientRecordId');
        console.log('storedclientId from localStorage:', storedclientId);
          console.log('participantJson in connected callback :', JSON.stringify(this.participantJson));
        if (storedclientId && this.participantJson?.[storedclientId]) {
              console.log('storedclientId from localStorage inside if :', storedclientId); 
            const json = this.participantJson[storedclientId];
             console.log('participantJson found for storedclientId:', json);
             if ( this.riskindexdetails && this.riskindexdetails.naviagte === 'riskmanagement' ) {
                console.log('✅ Post-wire: Navigation from Risk Management');
                this.ndisFlag = this.riskindexdetails.ndisFlag || false;
                console.log(' this.ndisFlag in  risk',  this.ndisFlag);
                //this.loadFacilityClientData( storedclientId,json.name,json.typeofservice,json.participanttype);
            } else {
                console.log('✅ Post-wire: Normal participant navigation');
               // this.loadFacilityClientData( storedclientId,json.name,json.typeofservice,json.participanttype);
            }
            this.loadFacilityClientData(storedclientId, json.name, json.typeofservice, json.participanttype);
        } else {
            if (!storedclientId) {
                console.log('No storedclientId found in localStorage.');
            } else if (!this.participantJson?.[storedclientId]) {
                console.log(`No participantJson data found for storedclientId: ${storedclientId}`);
            }
        }
   }

   handleClear() {
       this.inputValue = '';
       fetchFacilitiess({recordId : '', isTrue : this.isStatusTrue}).then(response=>{
           this.records = response;
           this.records1=response;
           this.totalRecords = response.length; // update total records count                 
           this.pageSize = 12;
           if(this.totalRecords>6){
               this.visible=true;
           }
           this.paginationHelper();

       });    

   }      


handleSearch(event) {
    this.inputValue = event.target.value;
    const searchKey = this.inputValue ? this.inputValue.toLowerCase().trim() : '';

    // Use the full dataset as base
   // let result = [...(this.orginalData || [])];
     let result=[...this.orginalData];
  // let result = [...(this.refreshTable?.data || [])];
    // 🔍 Search filter (Name, Phone, Role)
    if (searchKey) {
        result = result.filter(record => {
            const firstName = record.First_Name__c || '';
            const lastName = record.Last_Name__c || '';
            const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
            const facilityNames = record.activeFaciltyDisplay ? record.activeFaciltyDisplay.toLowerCase() : "";

            const nameMatch = fullName.includes(searchKey);
            const contactMatch = record.Phone__c && record.Phone__c.toLowerCase().includes(searchKey);
            const roleMatch = record.ParticipantType__c && record.ParticipantType__c.toLowerCase().includes(searchKey);
             const facilityMatch = facilityNames.includes(searchKey);

            return nameMatch || contactMatch || roleMatch ||facilityMatch ;
        });
    }
   if (this.selectedFacilities && this.selectedFacilities.length > 0) {
        const selectedFacilityIds = this.selectedFacilities.map(f => f.value);

        result = result.filter(record => {
            const facilities = record.Participant_Facilities__r || [];
            return facilities.some(child =>
                selectedFacilityIds.includes(child.Facility__c)
            );
        });
}

      
    // ✅ Active/Inactive filters
    if (this.activeFilterOn && !this.inactiveFilterOn) {
        result = result.filter(rec => rec.Status__c === true);
    } else if (this.inactiveFilterOn && !this.activeFilterOn) {
        result = result.filter(rec => rec.Status__c === false);
    }

    // 🔄 Update component data
    this.records = result;
    this.totalRecords = result.length;
    this.noRecordsFlag = this.totalRecords === 0;
    // this.pageSize = 12;
    this.visible = this.totalRecords > 6;

    this.paginationHelper(); // Update pagination

    console.log('🔍 Search applied with filters:', {
        searchKey,
        selectedFacilities: this.selectedFacilities,
        totalResults: this.totalRecords
    });
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
       if(this.totalRecords>0) {
            this.noRecordsFlag=false;
        }else{
            this.noRecordsFlag=true;
        } 
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
       console.log('records to display In pagination : '+ JSON.stringify( this.recordsToDisplay));
      // refreshApex(this.refreshTable);         
   }

   get isDesktop() {
       //alert(FORM_FACTOR);
       return FORM_FACTOR === 'Large';
   }

   get isMobile() {
       return FORM_FACTOR === 'Small';
   }

   @track editstaffflag = false;
   @track participant;
   handleEditFacility(event){
       let facId = event.currentTarget.dataset.id;
       this.participant = event.currentTarget.dataset.name;
       const typeofservice = event.currentTarget.dataset.typeofservice;
       const ParticipantType = event.currentTarget.dataset.participanttype;
       
        console.log('handleEditFacility -> facId:', facId);
        console.log('participant:', this.participant);
        console.log('typeofservice:', typeofservice);
        console.log('ParticipantType:', ParticipantType);
        console.log('participantJson:', JSON.stringify(this.participantJson));
       this.loadFacilityClientData(facId, this.participant, typeofservice, ParticipantType);
   }
    loadFacilityClientData(facId, participant, typeofservice, ParticipantType){
        console.log('handleEditFacility -> facId in loadFacilityClientData:', facId);
        console.log('participant  in loadFacilityClientData :', participant);
        console.log('typeofservice  in loadFacilityClientData:', typeofservice);
        console.log('ParticipantType  in loadFacilityClientData:', ParticipantType);
        
        if (!this.participantJson || !this.participantJson[facId]) {
            console.error('Participant data not found for:', facId);
            return;
        }
        
        this.recordId = facId;
        this.participant = participant;
        
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
        
        this.ndisFlag = (typeofservice === 'NDIS');
        if (!this.ndisFlag) {
            console.log(' typeofservice inside !this.ndisFlag ', typeofservice);
            console.log(' this.participantPreferredName inside !this.ndisFlag ', this.participantPreferredName);
            console.log(' ParticipantType inside !this.ndisFlag ', ParticipantType);
            
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

            this.individualFlag = (ParticipantType === 'Individual');
            this.CompanyFlag = (ParticipantType === 'Company');
            this.ndisCreateFlag = false;
        } else {
            this.individualFlag = false;
            this.CompanyFlag = false;
            this.ndisCreateFlag = true;
        }
        
        console.log('this.individualFlag,this.companyFlag,this.ndisCreateFlag', this.individualFlag, this.CompanyFlag, this.ndisCreateFlag);
        console.log(' typeofservice', typeofservice);
        console.log(' this.participant', this.participant);
        
        this.editstaffflag = true;
        this.isDetails = false;
        this.isHome = false;
        this.orgId = this.participantJson[facId]["orgId"];
        console.log('OrgId>>' + this.orgId);
        this.headerName = 'Update ' + this.participantPreferredName;
        this.buttonLabel = 'Update';
        
        this.street = this.participantJson[this.recordId]["street"];
        this.city = this.participantJson[this.recordId]["city"];
        this.country = this.participantJson[this.recordId]["countryCode"];
        this.province = this.participantJson[this.recordId]["stateCode"];
        this.postalcode = this.participantJson[this.recordId]["postalCode"];
        this.lastName = this.participantJson[this.recordId]["lastName"];
        this.firstName = this.participantJson[this.recordId]["firstName"];
        this.errorMessage = '';
        this.saveButtonDisable = false;
        this.Nationality = this.participantJson[this.recordId]["nationality"] || '';
        const savedLanguages = this.participantJson[this.recordId]["languages"];

        // Handle Languages - convert from string to array if needed
        if (savedLanguages) {
        this.selectedLangs = typeof savedLanguages === 'string' 
            ? savedLanguages.split(';').filter(Boolean)
            : savedLanguages;
        } else {
            this.selectedLangs = [];
        }
        
        console.log('✅ Final selectedLangs after processing:', this.selectedLangs);
        
        // ✅ FIX 3: Force refresh of the UI state
        this.refreshValues();
        
        localStorage.setItem('clientRecordId', this.recordId);
        console.log('clientRecordId Stored in localStorage:', this.recordId);
        
        // ✅ FIX 4: Debug the state
        this.debugLanguageState();
    }
   childevent(event){
        localStorage.removeItem('clientRecordId');
        console.log('LocalStorage cleared in parent.');
        this.editstaffflag = false;
        this.isHome =true;
        this.cardFlag =true;
        this.listFlag= false;
    }


       @track handleStatusFlag=false;
       @track facId;
       @track facstatus;
       @track message;
       @track originalToggleState;
       @track toggleElement; 
       @track finalStatus;
       @track client;
           handlefacStatus(event){   
              // this.showSpinner = true;   
               this.toggleElement = event.target;
               this.handleStatusFlag=true;  
                this.facId=event.currentTarget.dataset.id;
                this.facstatus=event.target.dataset.name;
                this.client=event.target.dataset.client;
                this.originalToggleState = this.facstatus;
                
               if(this.facstatus == 'true'){
                  this.finalStatus='false';
                   this.message= this.participantPreferredName + ' is Inactive.'
               }
               else if(this.facstatus == 'false'){
                  this.finalStatus='true';
                  this.message= this.participantPreferredName + ' is Active.'
               }
              
           }
       
           handlestatuschange(){
               statusClient({ IdValue:this.facId, status:this.finalStatus }).then(response => {
                   //this.showSpinner= false;
                   this.dispatchEvent(
                       new ShowToastEvent({
                           title: '',
                           message: this.message,
                           variant: 'success'
                       })
                   );
                   //this.dispatchEvent(new RefreshEvent());
                   refreshApex(this.refreshTable);
                   //this.fetchParticipant();
                   
               });  
               this.handleStatusFlag=false; 
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
      

   get cardViewClass(){
       return this.cardFlag ? 'slds-box slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-align_absolute-center'; // you can use your custom class here.
   }

   get listViewClass(){
       return this.listFlag ? 'slds-box slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-align_absolute-center'; // you can use your custom class here.
   }  
    handleCreateNewFacility() {
    this.showClientCreationTemplate=true;
     this.clientCreationTypeName='';
  }
  handleClientCreationChange(event) {
      const value = event.detail.value;

      this.clientCreationTypeName = value;

      if (value === 'Create a user account for the participant') {     //  Participant with User
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

  // create a new facility
  //handleCreateNewFacility() {
 
   handleCreateNewClient(){
       this.fieldErrorMap={};
       this.ParticpantRecordForm=true;
       this.ndisCreateFlag=false;
       this.nonndisFlag=false;
       this.individualFlag=false;
       this.CompanyFlag=false;
       this.ParticipantType='';
       this.recordId ='';
       this.street ='';
       this.city ='';
       this.country ='';
       this.province ='';
       this.postalcode =''; 
       this.headerName='Create New ' + this.participantPreferredName;
       this.buttonLabel='Save';
       this.errorMessage = '';
       this.saveButtonDisable = false;
       //this.isDetails = false;
       this.isHome = true;
       this.cardFlag = false;
       this.listFlag = false;
       //this.totalRecords = false;
       this.visible = false;
       this.firstName = '';
       this.lastName = '';
       this.facilityId = '';
       this.fileName = '';
       this.addStaffDisable = true;
       this.Nationality = ''; // Explicit empty
       this.selectedLangs = []; // Empty array
       this.Languages = this.LANGUAGE_OPTIONS.map(lang => ({
            id: lang,
            label: lang,
            checked: false,
            buttonClass: 'option-button',
            badgeClass: 'status-badge inactive',
            statusText: 'Inactive'
        }));
        this.selectedTypeOfIndustry='';
        this.multiFacilityDroDownList=[];
        this.selctedMultipleFcailityValues=[];
        this.fetchMultiFaciltyOptions();
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
       }
   }
   handleChange1(event) {
       let inputValue = event.target.value;
       inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
       event.target.value = inputValue;
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
      /*  console.log('fileName>>',this.fileName);
       console.log('file prepared');
      */
      
   } 

   async handleSuccess(event) {
    try {
        // -------------------------------
        // SUCCESS TOAST
        // -------------------------------
        this.dispatchEvent(
            new ShowToastEvent({
                title: "Success",
                message: `${this.participantPreferredName} created successfully.`,
                variant: "success",
            })
        );

        let staffRecID = event.detail.id;

        // UI flags
        this.roleStaffFlag = false;
        this.isHome = true;
        this.cardFlag = true;
        this.ParticpantRecordForm = false;

        // Refresh table
       // refreshApex(this.refreshTable);

        // Fetch participant data
        this.fetchParticipant();

        // -------------------------------
        // 1️⃣ FILE UPLOAD (if file exists)
        // -------------------------------
        if (this.base64FileData && this.fileName) {
            try {
                await uploadFile({
                    base64: JSON.stringify(this.base64FileData),
                    filename: this.fileName,
                    recordId: staffRecID,
                    obj: "client",
                });

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Success!!",
                        message: `${this.file.name} - Uploaded Successfully!!!`,
                        variant: "success",
                    })
                );
            } catch (fileErr) {
                console.error("❌ File upload error:", fileErr);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "File Upload Error",
                        message: fileErr.body?.message || "Unable to upload file",
                        variant: "error",
                    })
                );
            }
        }
        const payload = {
        participantId: staffRecID,
                selectedFacilityIds: this.selctedMultipleFcailityValues
                }
            const participantFacilityResult=await upsertParticipantFacilities({
                    wrapperJson: JSON.stringify(payload)
        })
                    console.log("✅ participantFacilityResult updated."+JSON.stringify(participantFacilityResult));

        // -------------------------------
        // 2️⃣ UPDATE STAFF ASSIGNMENTS
        // -------------------------------
        try {
            await updateStaffAssignments({
                clientId: staffRecID,
                assignmentsJSON: this.serializedPayload
            });

            console.log("✅ Staff assignments updated.");

            this.participanteditflag = false;
            this.participantflag = true;
            this.selectedRoles = this.staffName;
            this.modifiedStaffMap = {}; // clear map
            this.getStaffValues();

        } catch (staffErr) {
            console.error("❌ Staff assignments update error:", staffErr);
        }

        // -------------------------------
        // 3️⃣ UPDATE CONTACTS (SAFE)
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

                console.log("✅ Contacts updated.");
            } catch (contactError) {
                console.error("❌ Contacts update error:", contactError);
                /* this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Error updating contacts",
                        message: contactError.body?.message || "Unknown contact error",
                        variant: "error",
                    })
                ); */
            }
        } else {
            console.warn("⚠️ No contact records to update.");
        }
        this.fetchParticipant();
        refreshApex(this.refreshTable);

        this.contactList1 = [];
        this.contactList = [
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

    } catch (err) {
        console.error("❌ handleSuccess() unexpected error:", err);
        /* this.dispatchEvent(
            new ShowToastEvent({
                title: "Unexpected Error",
                message: err.body?.message || "Unknown error occurred",
                variant: "error",
            })
        ); */
    }
}


    handleSubmit(event){
        console.log('in submit');
        const fields = event.detail.fields;
        // Validate required fields first
       /*  const facilityInput = this.template.querySelector('[data-id="facility"]');
        if (!this.facilityId) {
            facilityInput.reportValidity();
            return;
        } */
        event.preventDefault();// stop the form from submitting

        console.log("contactList>>", JSON.stringify(this.contactList));
        console.log("individualFlag>>", this.individualFlag);
        console.log("CompanyFlag>>", this.CompanyFlag); 
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
        if (
            this.selectedTypeOfIndustry !== 'NDIS' &&
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

        // 2️⃣ Find all Primary contacts
        const primaryContacts = this.contactList.filter(
            (con) => con.contactType === "Primary"
        );


        // 4️⃣ Validate ONLY the Primary row(s)
        for (let i = 0; i < primaryContacts.length; i++) {
            let c = primaryContacts[i];

            if (
                !c.firstName ||
                !c.lastName ||
                !c.contactNumber ||
                !c.email
            ) {
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
        //if (this.individualFlag === false && this.CompanyFlag === false) {
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
            
            // for (let i = 0; i < this.contactList.length; i++) {
            //     let c = this.contactList[i];
            //     if (c.contactType === 'Primary') continue;
            //     if (
            //         !c.firstName ||
            //         !c.lastName ||
            //         !c.contactNumber ||
            //         !c.email ||
            //         !c.contactType
            //     ) {
            //         this.dispatchEvent(
            //             new ShowToastEvent({
            //                 title: 'Missing Required Fields',
            //                 message: `All fields are required for Contact Row ${i + 1}.`,
            //                 variant: 'error'
            //             })
            //         );
            //         return; // ❗ Stop execution immediately
            //     }
            // }
       // }  
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
        
        // Your existing field assignments...
        fields.Address__Street__s = this.street;
        fields.Address__City__s = this.city;
        fields.Address__StateCode__s = this.province;
        fields.Address__CountryCode__s = 'AU';
        fields.Address__PostalCode__s = this.postalcode;
        fields.Name = this.fullName;
        fields.Status__c = this.toggleValue;
        fields.Facility__c=this.selctedMultipleFcailityValues[0];;
        fields.ParticipantType__c=this.ParticipantType;
        fields.Preferred_Nationality__c = this.Nationality;
        // Handle Languages - ensure proper semicolon-separated string
        if (Array.isArray(this.selectedLangs) && this.selectedLangs.length > 0) {
            fields.Preferred_Languages__c = this.selectedLangs.join(';');
        } else {
            fields.Preferred_Languages__c = ''; // Explicit empty string
        }
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form').submit(fields);  
    }
    
   handleeditClose(){
       console.log('handleeditClose ');
       this.ParticpantRecordForm=false;
       this.cardFlag = true;
       this.visible = true;
       //this.totalRecords = true;
       this.isHome = true;
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
   @track Company;

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
       console.log('Full Name>>'+this.fullName);
   }

   handleCompanyChange(event){
       this.Company = event.detail.value;
       console.log('Company>>'+this.Company);
       this.fullName = this.Company;
   }
   

   fetchParticipant(){
       fetchFacilitiess().then(response=>{
           this.records = response;
           this.records1=response;
           this.totalRecords = response.length; // update total records count                 
           if(this.totalRecords>6){
               this.visible=true;
           }
        //    this.paginationHelper();
           this.applyFilters();
       });  
   }
   //Manimala added 634-667
   handleStaffChange(event) {
       this.staffName = event.target.value;
       console.log('Staff Name >> '+ this.staffName);
   }
   getStaffValues() {
       console.log('Selected facility >> ' + this.facilityId);
       console.log('Selected Role >> ' + this.role);
   // Call Apex method to get staff data, including which staff are already assigned to the participant
       getStaffData({ clientId: this.clientId, facilityId: this.facilityId, role: this.role}).then(response => {
           this.staffOptions = response.map(record => ({
               value: record.Id,
               label: record.Name
           }));
           console.log('Staff options: ' + JSON.stringify(this.staffOptions));

           // Find the staff already assigned to the participant and set them as selected
           this.selectedRoles = response
               .filter(record => record.isAssigned) // Assuming 'isAssigned' indicates if the staff is already selected
               .map(record => record.Id);
           
           console.log('Selected staff: ' + JSON.stringify(this.selectedRoles));
       })
       .catch(err => {
           console.error('Error fetching staff values: ', err);
       });
   }
    async  handleAddMultiUsers() {
        this.headeringName = 'Preferred Staff';
        this.close = 'Edit';
        this.roleCancelFlag=false;
        await this.fetchStaffMembers();
    }

    @track savedSelectedRoles = [];
    handleSave(event) {
        if(this.staffName && this.staffName.length > 0){
            this.roleStaffFlag=false;
            this.errorMessage='';
            this.savedSelectedRoles = [...this.selectedRoles];
        }
        else{
            this.errorMessage='please select staff'
        }
    }
    handleEditStaffClose(){
       this.roleStaffFlag=false;
    }
    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }

    @track toggleValue = false;
    handleStatus(event) {        
        this.toggleValue = event.target.checked; 
        console.log('Toggle status:', this.toggleValue);    
    }

@track activeFilterOn = true;
@track inactiveFilterOn = false;

    handleActiveToggle() {
    if (this.activeFilterOn) {
        this.activeFilterOn = false; // turn off
    } else {
        this.activeFilterOn = true;
        this.inactiveFilterOn = false;
    }
    this.applyFilters();
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
    let result = [...this.orginalData]; // Use original unfiltered dataset

    // 🔍 Name filter
    if (this.firstname && this.firstname.trim() !== '') {
        result = result.filter(item =>
            item.First_Name__c?.toLowerCase().includes(this.firstname.toLowerCase()) ||
            item.Last_Name__c?.toLowerCase().includes(this.firstname.toLowerCase())
        );
    }

    // ✅ Facility filter (multi-select)
    if (this.selectedFacilities.length > 0) {
        const selectedFacilityIds = this.selectedFacilities.map(f => f.value);
      /*   result = result.filter(item =>
            selectedFacilityIds.includes(item.Facility__r?.Id)
        ); */

       result = result.filter(rec => {
                const facilities = rec.Participant_Facilities__r || [];
                return facilities.some(sf =>
                    selectedFacilityIds.includes(sf.Facility__c)
                );
           });
    }

    // ✅ Active/Inactive filter
    if (this.activeFilterOn && !this.inactiveFilterOn) {
        result = result.filter(item => item.Status__c === true);
    } else if (this.inactiveFilterOn && !this.activeFilterOn) {
        result = result.filter(item => item.Status__c === false);
    }

    // 🔄 Update filtered records
    this.records = [...result];
    this.totalRecords = result.length;
    this.pageNumber = 1;
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

get recordsWithToggleStyle() {
    console.log('recordsToDisplay:', JSON.stringify(this.recordsToDisplay));
    return this.recordsToDisplay.map((item) => {
        const isActive = item.Status__c === true || item.Status__c === 'true';
        return {
            ...item,
            toggleTrackClass: isActive ? 'toggle-track active' : 'toggle-track',
            toggleKnobClass: isActive ? 'toggle-knob active' : 'toggle-knob',
            toggleLabelClass: isActive ? 'toggle-label active' : 'toggle-label inactive',
            toggleLabel: isActive ? 'Active' : 'Inactive'
        };
    });
}

@track selectedFacilities = [];  // array of {label, value}
@track facilitySearchTerm = '';
@track showFacilityOptions = false;



handleFacilityCheckboxChange(event) {
    const value = event.target.value;
    const label = event.target.dataset.label;
    console.log('Checkbox changed:', { value, label, checked: event.target.checked });

    const alreadySelected = this.selectedFacilities.find(fac => fac.value === value);
    console.log('Already selected?', alreadySelected);

    if (event.target.checked && !alreadySelected) {
        this.selectedFacilities = [...this.selectedFacilities, { label, value }];
        console.log('Added to selectedFacilities:', JSON.stringify(this.selectedFacilities));
    } else if (!event.target.checked && alreadySelected) {
        this.selectedFacilities = this.selectedFacilities.filter(fac => fac.value !== value);
        console.log('Removed from selectedFacilities:', this.selectedFacilities);
    }

    // Update checkbox state
    this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(fac => {
        const isChecked = this.selectedFacilities.some(sf => sf.value === fac.value);
        return { ...fac, checked: isChecked };
    });

    console.log('Updated facilityCheckboxOptions:', JSON.stringify(this.facilityCheckboxOptions) );

    this.applyFilters();
    console.log('Filters applied');
}

handleFacilitySearchChange(event) {
    this.facilitySearchTerm = event.target.value.toLowerCase();
}
 get filteredFacilityCheckboxOptions() {
        if (!this.facilitySearchTerm) return this.facilityCheckboxOptions;
        return this.facilityCheckboxOptions.filter(option =>
            option.label.toLowerCase().includes(this.facilitySearchTerm)
        );
    }

handleHorizontalScroll(event) {
    event.preventDefault(); // Prevent vertical scroll
    const container = event.currentTarget;
    container.scrollLeft += event.deltaY; // Apply vertical delta to horizontal scroll
}
 removeFacility(event) {
        const value = event.currentTarget.dataset.id;

        this.selectedFacilities = this.selectedFacilities.filter(fac => fac.value !== value);

        // Uncheck it in the dropdown list
        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(fac => {
            return { ...fac, checked: fac.value === value ? false : fac.checked };
        });

        this.updateSearchInputLabel();
        this.applyFilters();
    }

updateSearchInputLabel() {
    const selectedLabels = this.selectedFacilities.map(f => f.label);
    this.facilitySearchTerm = ''; // You can clear the input or keep the last typed string
}


// Show/hide dropdown
showFacilityDropdown() {
    this.showFacilityOptions = true;
}
handleOutsideFacilityClick(event) {
    const container = this.template.querySelector('.facility-multiselect');
    if (container && !container.contains(event.target)) {
        this.showFacilityOptions = false;
    }
}
   stopPropagation(event) {
    event.stopPropagation();
}
   

// setPageSizeByZoomAndScreen() {
//     const zoomLevel = Math.round(window.devicePixelRatio * 100); // 100, 125, 150, etc.

//     if (zoomLevel <= 100) {
//         this.pageSize = 16;
//     } else if (zoomLevel <= 125) {
//         this.pageSize = 12;
//     } else {
//         this.pageSize = 8;
//     }
// }

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

    async fetchStaffMembers() {
        console.log('this.facilityId >>', this.facilityId);
        try {
         const result = await getStaffMembers({ facilityId: this.selctedMultipleFcailityValues });
            console.log('Staff data >>', result);
            this.processStaffData(result);
            this.fetchRoles();
        } catch (error) {
            throw error;
        }
    }

    processStaffData(staffData) {
      this.staffMembers = staffData.map((staff, index) => {
        const profileUrl = staff.picture__c ? staff.picture__c : '';
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
              if(this.roleCancelFlag ){
                 this.roleStaffFlag = false;
      
              } else{
                 this.roleStaffFlag = true;
              } 
             
          } catch (error) {
              console.error(" Error fetching Facility Roles:", error);
          }
      
          console.log(" [fetchRoles] END");
      }//manendra

    loadAssignments() {
        console.log('this.staffMembers >> ', this.staffMembers);
        console.log('this.roles >> ', this.roles);
        if (this.staffMembers.length > 0 && this.roles.length > 0) {
            this.staffMembers = this.staffMembers.map(staff => {
                const updatedStaff = { ...staff };
                updatedStaff.roleAssignments = {};
                this.roles.forEach(role => {
                    updatedStaff.roleAssignments[role] = false;
                });
                return updatedStaff;
            });
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

    @track searchStaff = '';              
    @track filteredStaffMembers = [];     
    @track staffMembers = [];             
    @track roles = [];  

    // Group the flat data by staff for template iteration
    get groupedStaffRoleData() {
        console.log('groupedStaffRoleData >>');
        
        const staffList = Array.isArray(this.filteredStaffMembers) && this.searchStaff
                            ? this.filteredStaffMembers
                            : this.staffMembers;

        if (!staffList || !this.roles || this.roles.length === 0) {
            console.log('Missing staffMembers or roles.');
            return [];
        }

        const grouped = [];

        staffList.forEach((originalStaff) => {
            const staff = this.modifiedStaffMap[originalStaff.Id] || originalStaff;

            const roleList = staff.Role__c
                ? staff.Role__c.split(';').map(r => r.trim())
                : [];

            const assignedRoles = new Set(roleList);

            const staffData = {
                Id: staff.Id,
                Name: staff.Name,
                Email: staff.Email,
                profileUrl: staff.profileUrl,
                rowClass: staff.rowClass,
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

            //console.log('Final staffData:', JSON.stringify(staffData, null, 2));
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
            this.filteredStaffMembers = this.staffMembers.filter(staff =>
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
    @track roleCancelFlag=false;
    async handleeditClose1() {
        console.log('handleeditClose1 ');
        this.close = 'cancel';
        this.roleStaffFlag = false;
        this.roleCancelFlag=true;
        this.searchStaff = '';
        this.modifiedStaffMap = {};
        await this.fetchStaffMembers();
        
        // 🛠️ Reapply changes from modifiedStaffMap
        this.staffMembers = this.staffMembers.map(staff => {
            const modified = this.modifiedStaffMap[staff.Id];
            return modified ? modified : staff;
        });

        console.log('this.staffMembers >>', this.staffMembers);

        this.contactList1 = [];
        this.contactList = [
            {
                id: 1,
                firstName: '',
                lastName: '',
                contactNumber: '',
                email: '',
                contactType: '',
                notify:false
            }
        ];
    }

    handleUpdateStaff() {
        console.log('Client Id >> ', this.clientId);
        console.log('Modified Staff Map >> ', JSON.stringify(this.modifiedStaffMap));

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
        return this.roleStaffFlag ? 'slds-hide' : '';
    }

    get showPreferredStaffClass() {
        return this.roleStaffFlag ? '' : 'slds-hide';
    }
    handleHideFacilityEvent(event) {
        const { hideFacility, message } = event.detail;

        const forwardEvent = new CustomEvent('facilitydropdownevent', {
            detail: {
            hideFacility,
            message
            }
        });
        this.dispatchEvent(forwardEvent);
    }

    handleKeyShortcut(event) {

        if(!this.isStaff && (this.cardFlag || this.listFlag)){
            if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
                event.preventDefault();
                this.handleCreateNewFacility();
                }
            
            if (event.ctrlKey && event.shiftKey && event.code === 'KeyF') {
                event.preventDefault();
                this.handleFormsClick();
                }
            if (event.ctrlKey && event.shiftKey && event.code === 'KeyU') {
                event.preventDefault();
                this.handleSwitchToMultiClientUpload();
                }
            }
    }

    addKeyboardShortcuts() {
        if (!this._boundHandleKeyShortcut) {
            this._boundHandleKeyShortcut = this.handleKeyShortcut.bind(this);
            window.addEventListener('keydown', this._boundHandleKeyShortcut);
        }
    }

    removeKeyboardShortcuts() {
        if (this._boundHandleKeyShortcut) {
            window.removeEventListener('keydown', this._boundHandleKeyShortcut);
            this._boundHandleKeyShortcut = null;
        }
    }

    handleSwitchToMultiClientUpload() {
      this.isMultiClientUpload = true;
      this.isHome = false;
      this.cardFlag =false;
      this.listFlag= false;
      this.editstaffflag = false;
  }
  childeventNavigate(){

      this.isMultiClientUpload = false;
     this.editstaffflag = false;
        this.isHome =true;
        this.cardFlag =true;
        this.listFlag= false;
      refreshApex(this.refreshTable);
      this.fetchParticipant();
  }

    handleSearchChange(event) {
        const searchKey = event.target.value;
        
        // 🔥 CRITICAL FIX: Always sync the input value with Nationality
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
            this.Nationality = ''; // 🔥 Explicitly clear when empty
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
        if (!this.selectedLangs || this.selectedLangs.length === 0) {
            return 'Select Languages';
        }
        
        const langs = Array.isArray(this.selectedLangs) 
            ? this.selectedLangs 
            : this.selectedLangs.split(';').filter(Boolean);
                
        const display = langs.join(', ');
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

        // Ensure selectedLangs is always an array
        if (!Array.isArray(this.selectedLangs)) {
            this.selectedLangs = [];
        }

        let updatedSelectedLangs;
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

        // Update UI state
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
        const facilityBox = this.template.querySelector('.facility-dropdown12');

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
            console.log('fetchMultiFaciltyOptions ')
                   getFacilityData().then(facResponse => {
                          console.log('facResponse  ==>'+JSON.stringify(facResponse)); 
                 
                         // Build enhanced option objects (with toggle + badge)
                         this.multiFacilityDroDownList = facResponse.map((fac, index) => {
                             const isActive = false
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
                                 isDisabled: !isActive, // Updated logic to match new structure
                                 Type_of_Service__c:fac.Type_of_Service__c
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
    
      handleTypeOfIndustry(event) {
        console.log('handleTypeOfIndustry invoked');
    
        // Log raw event
        console.log('Event received:', event);
    
        // Capture selected value
        this.selectedTypeOfIndustry = event.target.value;
        console.log('Selected Type Of Industry:', this.selectedTypeOfIndustry);
        if (this.selectedTypeOfIndustry === 'NDIS') {
            this.ndisCreateFlag = true;
            this.nonndisFlag = false;
            this.CompanyFlag = false;
            this.individualFlag = false;
    
            console.log('NDIS selected → NDIS flags enabled');
        } else {
            this.ndisCreateFlag = false;
            this.nonndisFlag = true;
            this.CompanyFlag = false;
            this.individualFlag = false;
            this.ParticipantType='';
            console.log('Non-NDIS selected → Non-NDIS flags enabled');
        }
        console.log('orginalSelectedFacilities options:'+ JSON.stringify(this.orginalSelectedFacilities));
        let orginalFacValues=  this.orginalSelectedFacilities;
          if (this.selectedTypeOfIndustry === 'NDIS') {
             
         this.multiFacilityDroDownList = orginalFacValues.filter(
                    fac => fac.Type_of_Service__c === 'NDIS'
                );
         } else if (this.selectedTypeOfIndustry === 'Non-NDIS') {
                   this.multiFacilityDroDownList = orginalFacValues.filter(
                        fac => fac.Type_of_Service__c !== 'NDIS'
                    );
         }else{
                    this.multiFacilityDroDownList = orginalFacValues
       }
         console.log('this.multiFacilityDroDownList options:'+ JSON.stringify(this.multiFacilityDroDownList));
          // this.fetchStaffData();
        console.log("Selected facility >> " + this.facilityId);
       
        
    }

    handleMedicareChange(event) {
        const value = event.target.value;
        this.isMedicareEntered = value && value.trim() !== '';
    }


get facilityDropdownOptions() {

    if (!Array.isArray(this.multiFacilityDroDownList)) {
        return [];
    }

    return this.multiFacilityDroDownList.map(item => ({
        label: item.label,
        value: item.value
    }));

}



handleFacilitySelection(event) {

    const value = event.detail.value;

    // ✅ IGNORE SEARCH + CLEAR BOTH
    if (!Array.isArray(value)) {
        console.log('🚫 Ignored (search or clear event)');
        return;
    }

    // ✅ ONLY HANDLE REAL SELECTION
    const selected = value;

    console.log('Selected Facilities:', JSON.stringify(selected));

    this.selctedMultipleFcailityValues = [...selected];

    this.activeFaciltyDisplay = this.multiFacilityDroDownList
        .filter(f => this.selctedMultipleFcailityValues.includes(f.value))
        .map(f => f.label)
        .join(', ');

}



}