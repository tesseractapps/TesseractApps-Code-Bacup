import { LightningElement, track, wire, api } from "lwc";
import fetchFacilitiess from "@salesforce/apex/ClientDataController.fetchFacilitiess";
import statusClient from "@salesforce/apex/ClientDataController.statusClient";
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
  pageSize; //No.of records to be displayed per page
  totalPages; //Total no.of pages
  pageNumber = 1; //Page number
  recordsToDisplay = []; //Records to be displayed on the page
  @track refreshTable = [];
  @track recordsToDisplay = [];
  @api selectedName = "";
  @api facilityButton;
  @track orgNam = "";
  selectedfields = [];
  @track visible = false;
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
    InsuranceDetails: false,
    PrimaryContactDetails: false,
    SecondaryContactDetails: false,
    OtherPreferences: false,   
  };

  @track sectionIcons = {
    PartcipantDetails: "\u2B9F",
    Addressdetails: "\u2B9C",
    IdentificationDetails: "\u2B9C",
    InsuranceDetails: "\u2B9C",
    PrimaryContactDetails: "\u2B9C",
    SecondaryContactDetails: "\u2B9C",
    OtherPreferences: "\u2B9C",
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
  /*  @wire(getStaffData, { clientId: '$clientid', facilityId: '$facilityId', role: '$role' })    
    wiredStaffData(result) {
      //  this.selectedRoles=[];
        this.wiredStaffResult = result; // Store the result for later use in refreshApex
        console.log('result in wire method '+JSON.stringify(result));
        const { error, data } = result;
        if (data) {
            // Process the data
            this.staffOptions = data.map(record => ({
                value: record.Id,
                label: record.Name
                 //label:  `${record.Name} ${record.Last_Name__c}`
            }));

         //   console.log('Staff options: ' + JSON.stringify(this.staffOptions));

            // Assign the first staff's label to staffVal if available
            if (this.staffOptions.length > 0) {
                this.staffVal = this.staffOptions[0].label;
            }

            // Default to pre-assigned staff if no roles selected
            if (!this.selectedRoles || this.selectedRoles.length === 0) {
                this.selectedRoles = data
                    .filter(record => record.isAssigned)  // Assuming 'isAssigned' indicates if the staff is already assigned
                    .map(record => record.Id);
            }
            console.log('Selected staff: ' + JSON.stringify(this.selectedRoles));
        } else if (error) {
            console.error('Error fetching staff values: ', error);
        }
    } */

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
    this.sectionIcons[sectionId] = sectionElement.classList.contains(
      "hidden-section"
    )
      ? "\u2B9C"
      : "\u2B9F";
  }
  // connectedCallback method called when the element is inserted into a document
  connectedCallback() {
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
      //console.log('listofPriceBook:', response.listofPriceBook);
      this.OrgNisationRoles = orgRoles
        .split(";")
        .sort()
        .map((rec) => {
          return {
            value: rec,
            label: rec
          };
        });
      this.role = this.OrgNisationRoles[0].value;
      //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
      //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;
    });
    //this.fetchParticipant();
    /*   fetchFacilitiess({recordId : this.selectedName, firstname: this.firstname, lastname: this.lastname}).then(response => {  
            this.refreshTable= response;               
                this.records = response;
                if (Array.isArray(response)) {
                    response.forEach(item => {
                        this.participantJson[item.Id] = {
                            "street": item.Address__Street__s,
                            "city": item.Address__City__s,
                            "stateCode": item.Address__StateCode__s,
                            "countryCode": item.Address__CountryCode__s,
                            "postalCode": item.Address__PostalCode__s,
                            "status": item.Status__c,
                            "lastname":item.Last_Name__c,
                            "firstname":item.First_Name__c
                        };
                    });
                   this.noRecordsFlag=true;
                }else{
                    this.noRecordsFlag=false;
                }

                this.totalRecords = response.length;            
                this.visible = this.totalRecords > 6;            
            this.paginationHelper();   
            this.ParticpantRecordForm=false;
          
        });
        */
      console.log("JUST BEFORE CALLING fetchParticipant  IN connectedCallback :");
      this.fetchParticipant().then(() => {
        const storedClientId = localStorage.getItem('adminClientRecordId');
         console.log("storedClientId IN connectedCallback :", storedClientId);
        if (storedClientId && this.participantJson?.[storedClientId]) {
           console.log(' adminClientRecordId AND this.participantJson found in localStorage INSIDE connectedCallback.');
          const json = this.participantJson[storedClientId];
          //const name = `${json.firstname || ''} ${json.lastname || ''}`.trim();
         // const participantName = name !== '' ? name : json.companyName || 'Unknown';

          this.loadClientData(
            storedClientId,
            json.typeofservice,
            json.participanttype
          );

          // ✅ Remove it to prevent future auto-loading
          //localStorage.removeItem('adminClientRecordId');
        } else {
          if (!storedClientId) {
            console.log('No adminClientRecordId found in localStorage.');
          } else {
            console.log(`No participantJson found for adminClientRecordId: ${storedClientId}`);
          }
        }
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
  }

  // setPageSizeByZoomAndScreen() {
  //   const zoomLevel = Math.round(window.devicePixelRatio * 100); // 100, 125, 150, etc.

  //   if (zoomLevel <= 100) {
  //     this.pageSize = 16;
  //   } else if (zoomLevel <= 125) {
  //     this.pageSize = 12;
  //   } else {
  //     this.pageSize = 8;
  //   }
  // }

setPageSizeByZoomAndScreen() {
    const zoomLevel = Math.round(window.devicePixelRatio * 100);
    const userAgent = navigator.userAgent;
    const isMac = /Mac|Macintosh/i.test(userAgent);
    const isWindows = /Windows/i.test(userAgent);
    const screenHeight = window.innerHeight;

    console.log('OS:', isMac ? 'Mac' : isWindows ? 'Windows' : 'Other');
    console.log('Height:', screenHeight, 'Zoom:', zoomLevel);

    // ✅ Mac logic
    if (isMac) {
        if (zoomLevel <= 110) {
            this.pageSize = 16; // 100%–110% zoom
        } else if (zoomLevel <= 125) {
            this.pageSize = 12; // 110%–125% zoom
        } else if (zoomLevel <= 150) {
            this.pageSize = 8; // 150% zoom
        } else {
            this.pageSize = 10; // Beyond 150%
        }

        // height-based safety adjustment (small screens)
        if (screenHeight < 900 && this.pageSize > 12) {
            this.pageSize = 12;
        }

        console.log(`💻 Mac zoom ${zoomLevel}% → showing ${this.pageSize} cards`);
        this.visible = true;
        return;
    }

    // 🖥️ Windows logic
    if (isWindows) {
        if (zoomLevel <= 100) {
            this.pageSize = 16; // 100% zoom
        } else if (zoomLevel <= 125) {
            this.pageSize = 12; // 110%–125% zoom
        } else if (zoomLevel <= 150) {
            this.pageSize = 8; // 150% zoom
        } else {
            this.pageSize = 8; // >150% zoom
        }

        // height-based adjustment
        if (screenHeight < 900 && this.pageSize > 12) {
            this.pageSize = 12;
        }

        console.log(`🖥️ Windows zoom ${zoomLevel}% → showing ${this.pageSize} cards`);
        this.visible = true;
        return;
    }

    // 🌍 Default fallback for unknown OS
    if (zoomLevel <= 110) {
        this.pageSize = 16;
    } else if (zoomLevel <= 150) {
        this.pageSize = 12;
    } else {
        this.pageSize = 10;
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

  /* handleChangeRole(event) {
        console.log('onchange '+JSON.stringify(event.detail));
        this.role = event.detail.value; // Handle combobox value change
        console.log('Selected Role >> ' + this.role);
        if(this.role){
        refreshApex(this.wiredStaffResult);
        }       
    } */
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

        // Find the staff already assigned to the participant and set them as selected
        /* this.selectedRoles = response
                .filter(record => record.isAssigned) // Assuming 'isAssigned' indicates if the staff is already selected
                .map(record => record.Id);
            
            console.log('Selected staff: ' + JSON.stringify(this.selectedRoles)); */

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

  /*  handleError(event) {
    event.preventDefault(); // Prevent standard error UI

    let message = 'An unknown error occurred.';

    // Check for backend validation error
    const backendErrors = event.detail?.output?.errors;
    if (backendErrors && backendErrors.length > 0) {
        message = backendErrors.map(err => err.message).join(', ');
    }
    // Fallback to top-level message
    else if (event.detail?.message) {
        message = event.detail.message;
    }

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
  handleToggleparticipant() {
    // Cycle through the filter states
    if (this.filterState === "All") {
      this.filterState = "Active";
    } else if (this.filterState === "Active") {
      this.filterState = "Inactive";
    } else {
      this.filterState = "All";
    }
    console.log("total records" + JSON.stringify(this.refreshTable));
    // Apply filtering logic based on the filter state
    if (this.filterState === "Active") {
      this.participantlabel = "Active";
      this.filteredRecords = this.refreshTable.filter(
        (record) => record.Status__c === true
      );
    } else if (this.filterState === "Inactive") {
      this.participantlabel = "Inactive";
      this.filteredRecords = this.refreshTable.filter(
        (record) => record.Status__c === false
      );
    } else {
      this.participantlabel = "All";
      this.filteredRecords = [...this.refreshTable]; // Show all users
    }

    // Update total records and handle pagination
    this.records = this.filteredRecords;
    this.totalRecords = this.filteredRecords.length;
    console.log("total records" + this.totalRecords);
    //this.noRecordsFlag = this.totalRecords === 0;
    this.paginationHelper();
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
    for (
      let i = (this.pageNumber - 1) * this.pageSize;
      i < this.pageNumber * this.pageSize;
      i++
    ) {
      if (i === this.totalRecords) {
        break;
      }
      this.recordsToDisplay.push(this.records[i]);
    }
    refreshApex(this.refreshTable);
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

  // create a new facility
  handleCreateNewParticipant() {
    this.fieldErrorMap = {};
    this.ParticpantRecordForm = true;
    this.ndisCreateFlag=false;
    this.nonndisFlag=false;
    this.individualFlag=false;
    this.CompanyFlag=false;
    this.Company='';
    this.participanttype='';
    this.cardview = true;
    this.recordId = "";
    this.street = "";
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
    //this.addStaffDisable = !this.facilityId;
    this.addStaffDisable = true;
    this.selectedRoles = [];
    this.selectedNationality = '';
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
  }
  handleeditClose() {
    this.ParticpantRecordForm = false;
    this.fullName = "";
    this.cardview = true;
    this.cardFlag = true;
    this.visible = true;
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
    }
   loadClientData(facId, typeofservice, ParticipantType){
      console.log('handleEditFacility -> facId in loadFacilityClientData:', facId);
      //console.log('participant  in loadFacilityClientData :', participant);
      console.log('typeofservice  in loadFacilityClientData:', typeofservice);
      console.log('ParticipantType  in loadFacilityClientData:', ParticipantType);
      // if (!this.participantJson || !this.participantJson[facId]) {
      //     console.error('Participant data not found for:', facId);
      //     return;
      // }

    this.headerName = "Update " + this.participantPreferredName;
    this.buttonLabel = "Update";
    this.clientid = facId;
    console.log("client id" + this.clientid);
    this.recordId = facId;
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
            // Only check ParticipantType when NDIS is false
            if (!ParticipantType) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.participantPreferredName + ' type is required.',
                        variant: 'error',
                    })
                );
                return; // stop execution
            }

            // Set flags based on participant type
            this.individualFlag = (ParticipantType === 'Individual');
            this.companyFlag = (ParticipantType === 'Company');
             this.ndisCreateFlag=false;
        } else {
            // If NDIS is true, all others false
            this.individualFlag = false;
            this.companyFlag = false;
            this.ndisCreateFlag=true;
        }
        console.log( 'this.individualFlag,this.companyFlag,this.ndisCreateFlag'+this.individualFlag+ this.companyFlag + this.ndisCreateFlag)
        console.log(' typeofservice', typeofservice);
       console.log(' this.participant', this.participant);
    console.log("record id" + this.recordId);
    this.name = this.participantJson[facId]["name"];
    this.street = this.participantJson[facId]["street"];
    this.city = this.participantJson[facId]["city"];
    this.country = this.participantJson[facId]["countryCode"];
    this.province = this.participantJson[facId]["stateCode"];
    this.postalcode = this.participantJson[facId]["postalCode"];
    //this.status = this.participantJson[facId]["status"];
    this.lName = this.participantJson[this.recordId]["lastname"];
    this.fName = this.participantJson[this.recordId]["firstname"];
    this.errorMessage = "";
    this.saveButtonDisable = false;
    this.cardview = false;
    this.fileName = "";
    this.cardFlag = true;
    this.editclientflag = true;
    /*  this[NavigationMixin.Navigate]({
            // Pass in pageReference
            type: 'comm__namedPage',
            attributes: {
               pageName: 'partcipantnewmodule',
            },
            state: {
              c__propertyValue:this.recordId,
              c__orgID:this.selectedName
            },
          }); */
    // console.log('Participant Data ',JSON.stringify(this.participantJson));
    localStorage.setItem('adminClientRecordId', this.clientid);
    console.log('adminClientRecordId Stored in localStorage:', this.clientid);
  }
  handleChildEvent() {
    localStorage.removeItem('adminClientRecordId');
    console.log('LocalStorage cleared in parent.');
    this.cardview = true;
    this.listFlag = false;
    this.editclientflag = false;
    refreshApex(this.refreshTable);
    this.fetchParticipant();
  }

  handleSubmit(event) {
    //  console.log('in submit');
    event.preventDefault(); // stop the form from submitting
    /*  if (this.facilityId =='' ||this.facilityId ==null || this.facilityId ==undefined ) {
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
        } */
    const facilityInput = this.template.querySelector('[data-id="facility"]');

    // Validate facilityId and trigger UI error if invalid
    if (!this.facilityId) {
      facilityInput.reportValidity(); // shows “Complete this field”
      /*  this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Please select a Facility before submitting.',
                variant: 'error',
            })
        ); */
      return;
    }
    const fields = event.detail.fields;
    // alert(JSON.stringify(fields));
    fields.Address__Street__s = this.street;
    fields.Address__City__s = this.city;
    fields.Address__StateCode__s = this.province;
    fields.Address__CountryCode__s = "AU";
    fields.Address__PostalCode__s = this.postalcode;
    fields.Name = this.fullName;
    fields.Status__c = this.toggleValue;
    fields.Facility__c = this.facilityId;
    fields.ParticipantType__c=this.ParticipantType;
    //  console.log('After fields>>'+JSON.stringify(fields));
        // 🔥 CRITICAL: Explicitly handle empty values
    fields.Preferred_Nationality__c = this.Nationality || ''; // Empty string if null/undefined
    fields.Preferred_Languages__c = Array.isArray(this.selectedLangs) && this.selectedLangs.length > 0 
        ? this.selectedLangs.join(';') 
        : ''; // Empty string if no languages selected
    this.template.querySelector("lightning-record-edit-form").submit(fields);
  }

  handleSuccess(event) {
    const toastEvent = new ShowToastEvent({
      title: "Success",
      message: this.participantPreferredName + " created successfully.",
      variant: "success"
    });
    this.roleStaffFlag = false;
    this.dispatchEvent(toastEvent);
    this.ParticpantRecordForm = false;
    this.cardFlag = true;
    this.fetchParticipant();
    let staffRecID = event.detail.id;
    console.log("StaffRecId :" + staffRecID);
    console.log("SelectedStaff :" + this.staffName);
    if (staffRecID != null) {
      uploadFile({
        base64: JSON.stringify(this.base64FileData),
        filename: this.fileName,
        recordId: staffRecID,
        obj: "client"
      }).then((result) => {
        //  console.log('Upload result = ' +result);
        //this.fileName = this.fileName + ' - Uploaded Successfully';
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: this.file.name + " - Uploaded Successfully.",
            variant: "success"
          })
        );
      });

      /*updateStaffAssignments({ clientId:staffRecID, staffIds: this.selectedRoles ,roleId:this.role}).then(() => {
                console.log('Successfully updated staff assignments in the backend.');
                this.participanteditflag=false;  
                 
                this.participantflag = true; 
                //this.getStaffValues();
            
                 console.log('role 5 >>'+this.role);
                 setTimeout(() => {
                    refreshApex(this.wiredStaffResult);
                  }, 1000);
                
              })
              .catch(err => {
                  console.error('Error updating staff assignments in the backend: ', err);
                  // Optionally show an error message to the user
              });
        }*/

      updateStaffAssignments({
        clientId: staffRecID,
        assignmentsJSON: this.serializedPayload
      })
        .then(() => {
          console.log("✅ Successfully updated staff assignments.");
          this.participanteditflag = false;
          this.participantflag = true;
          this.selectedRoles = this.staffName;
          //this.getStaffValues();
          // ✅ Clear modified staff map
          this.modifiedStaffMap = {};
          setTimeout(() => {
            refreshApex(this.wiredStaffResult);
          }, 1000);
        })
        .catch((error) => {
          console.error("❌ Error updating staff assignments:", error);
        });
    }
    this.fetchParticipant();
    refreshApex(this.refreshTable);
    this.fullName = "";
    this.cardview = true;
  }
  /* handlefacStatus(event) {
        //this.showSpinner = true;
        let facId = event.currentTarget.dataset.id;
        let facstatus = event.target.dataset.name;
        let finalStatus;
        let message;
        if (facstatus == 'true') {
            finalStatus = 'false';
            message = 'Client is Inactive'
        }
        else if (facstatus == 'false') {
            finalStatus = 'true';
            message = 'Client is Active'
        }
        statusClient({ IdValue: facId, status: finalStatus }).then(response => {
            //this.showSpinner= false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: '',
                    message: message,
                    variant: 'success'
                })
            );
            //this.dispatchEvent(new RefreshEvent());
            refreshApex(this.refreshTable);
            this.fetchParticipant();
            
        });
    }*/
  @track handleStatusFlag = false;
  @track facId;
  @track facstatus;
  @track message;
  @track originalToggleState;
  @track toggleElement;
  @track finalStatus;
  @track clientname;
  // handlefacStatus(event){
  //    // this.showSpinner = true;
  //     this.toggleElement = event.target;
  //     this.handleStatusFlag=true;
  //      this.facId=event.currentTarget.dataset.id;
  //      this.facstatus=event.target.dataset.name;
  //      this.clientname=event.target.dataset.client;
  //      this.originalToggleState = this.facstatus;

  //     if(this.facstatus == 'true'){
  //        this.finalStatus='false';
  //         this.message= 'Participant is Inactive'
  //     }
  //     else if(this.facstatus == 'false'){
  //        this.finalStatus='true';
  //        this.message= 'Participant is Active'
  //     }

  // }

  handlefacStatus(event) {
    this.handleStatusFlag = true;

    const dataset = event.currentTarget.dataset;

    this.toggleElement = event.currentTarget;
    this.facId = dataset.id;
    this.facstatus = dataset.name;
    this.clientname = dataset.client;
    this.originalToggleState = this.facstatus;

    if (this.facstatus === "true") {
      this.finalStatus = "false";
      this.message = this.participantPreferredName + " is Inactive.";
    } else if (this.facstatus === "false") {
      this.finalStatus = "true";
      this.message = this.participantPreferredName + " is Active.";
    }
  }

  // handlestatuschange(){
  //     console.log('finalStatus'+this.finalStatus);
  //     console.log('facId'+this.facId);
  //     statusClient({ IdValue:this.facId, status:this.finalStatus }).then(response => {
  //         //this.showSpinner= false;
  //         this.dispatchEvent(
  //             new ShowToastEvent({
  //                 title: '',
  //                 message: this.message,
  //                 variant: 'success'
  //             })
  //         );
  //         //this.dispatchEvent(new RefreshEvent());
  //         this.fetchParticipant();
  //         refreshApex(this.refreshTable);

  //     });
  //     this.participantlabel='All';
  //     this.filterState === 'All';
  //     this.handleStatusFlag=false;
  // }
  handlestatuschange() {
    statusClient({ IdValue: this.facId, status: this.finalStatus }).then(
      (response) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "",
            message: this.message,
            variant: "success"
          })
        );

        this.handleStatusFlag = false;
        this.fetchParticipant();

        /* fetchFacilitiess({ recordId: this.selectedName, firstname: this.firstname, lastname: this.lastname })
                    .then(response => {
                        this.refreshTable = response;
                        this.records = response;

                        if (Array.isArray(response)) {
                            response.forEach(item => {
                                this.participantJson[item.Id] = {
                                    street: item.Address__Street__s,
                                    city: item.Address__City__s,
                                    stateCode: item.Address__StateCode__s,
                                    countryCode: item.Address__CountryCode__s,
                                    postalCode: item.Address__PostalCode__s,
                                    lastname: item.Last_Name__c,
                                    firstname: item.First_Name__c,
                                    status: item.Status__c 
                                };
                            });
                        }
                        this.applyFilters();
                        this.paginationHelper();

                        this.ParticpantRecordForm = false;
                        this.showSpinner = false;
                    })
                    .catch(error => {
                        this.showSpinner = false;
                        console.error('Error fetching participants after status update:', error);
                    }); */
      }
    );
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

  //changes made by maheswari code start
  handleClear() {
    let listOfsearchString = [];
    this.firstname = "";
    this.lastname = "";
    this.fetchParticipant();
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

  fetchParticipant() {
    this.showSpinner = true;
    return  fetchFacilitiess({
      recordId: this.selectedName,
      firstname: this.firstname,
      lastname: this.lastname
    })
      .then((response) => {
         console.log('ADMIN response>>>',response);
        if (response.length > 0) {
          this.noRecordsFlag = false;
          this.refreshTable = response;
          let finalData = [];
          
          if (Array.isArray(response)) {
            response.forEach((item) => {
               let firstName = item.First_Name__c || '';
                let lastName = item.Last_Name__c || '';
              this.participantJson[item.Id] = {
                street: item.Address__Street__s,
                city: item.Address__City__s,
                stateCode: item.Address__StateCode__s,
                countryCode: item.Address__CountryCode__s,
                postalCode: item.Address__PostalCode__s,
                lastname: lastName,
                firstname: firstName,
                //name: (`${firstName || ''} ${lastName || ''}`.trim()) || item.Company__c,
                typeofservice:item.Facility__r.Type_of_Service__c,
                participanttype:item.ParticipantType__c

              };
            });
            //  console.log('Response>>'+JSON.stringify(this.participantJson));
          }
          const storedFacilityId = localStorage.getItem("defaultFacilityId");
          const storedFacilityLabel = localStorage.getItem(
            "defaultFacilityLabel"
          );
          console.log("storedFacilityId" + storedFacilityId);
          console.log("storedFacilityLabel" + storedFacilityLabel);

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
                console.log("Fetch Participant>>>" + JSON.stringify(response));
                this.finalListFacilities = this.facilityOptions;
                finalData = response;
                let facilityIds = [];
                console.log(
                  "Fetch Participant filteredData>>>" + JSON.stringify(response)
                );
                facilityIds.push(storedFacilityId);
                console.log("facilityIds  " + JSON.stringify(facilityIds));
                const filteredData = response.filter((rec) =>
                  facilityIds.includes(rec.Facility__c)
                );

                this.records = filteredData;
                this.orginalData = filteredData;

                console.log(
                  "Fetch Participant finalData>>>" + JSON.stringify(finalData)
                );
                this.totalRecords = filteredData.length; // update total records count
                if (this.totalRecords > 0) {
                  this.noRecordsFlag = false;
                } else {
                  this.noRecordsFlag = true;
                }
                this.pageSize = 12;
                if (this.totalRecords > 6) {
                  this.visible = true;
                }
                this.setPageSizeByZoomAndScreen();
                this.applyFilters();
                //this.paginationHelper(); // call helper menthod to update pagination logic
                this.ParticpantRecordForm = false;
                this.showSpinner = false;
              } else if (
                userTpe == "Facility Admin" ||
                userTpe == "HR Admin" ||
                userTpe == "Roster Manager"
              ) {
                getFacilityCurrentUser().then((result) => {
                  console.log(
                    "getFacilityCurrentUser facility   " +
                      JSON.stringify(result)
                  );
                  this.finalListFacilities = result.map((record) => ({
                    label: record.Facility__r.Name,
                    value: record.Facility__r.Id
                  }));
                });
                let facilityIds = [];
                // finalData =response;
                console.log(
                  "Fetch Participant filteredData>>>" + JSON.stringify(response)
                );
                facilityIds.push(storedFacilityId);
                console.log("facilityIds  " + JSON.stringify(facilityIds));
                const filteredData = response.filter((rec) =>
                  facilityIds.includes(rec.Facility__c)
                );

                this.records = filteredData;
                this.orginalData = filteredData;
                console.log(
                  "Fetch Participant filteredData>>>" +
                    JSON.stringify(filteredData)
                );
                console.log(
                  "Fetch Participant filteredData length >>>" +
                    filteredData.length
                );
                this.totalRecords = filteredData.length; // update total records count
                if (this.totalRecords > 0) {
                  this.noRecordsFlag = false;
                } else {
                  this.noRecordsFlag = true;
                }
                this.pageSize = 12;
                if (this.totalRecords > 6) {
                  this.visible = true;
                }
                this.setPageSizeByZoomAndScreen();
                this.applyFilters();
              //  this.paginationHelper(); // call helper menthod to update pagination logic
                this.ParticpantRecordForm = false;
                this.showSpinner = false;
              }
            });
          });
        } else {
          this.noRecordsFlag = true;
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
                console.log("Fetch Participant>>>" + JSON.stringify(response));
                this.finalListFacilities = this.facilityOptions;
              }else if (userTpe == "Facility Admin" || userTpe == "HR Admin" || userTpe == "Roster Manager") {
                  getFacilityCurrentUser().then((result) => {
                    console.log(
                      "getFacilityCurrentUser facility   " +
                        JSON.stringify(result)
                    );
                    this.finalListFacilities = result.map((record) => ({
                      label: record.Facility__r.Name,
                      value: record.Facility__r.Id
                    }));
                  });
              }
            })
          })
        }

        // this.dispatchEvent(new RefreshEvent());
      })
      .catch((error) => {
        this.showSpinner = false;
      });
  }

  handleKeyDown(event) {
    if (event.key === "Enter") {
      const inp = this.template.querySelectorAll("lightning-input");
      let listOfsearchString = [];

      inp.forEach((element) => {
        if (element.name === "fname") {
          this.firstname = element.value;
          listOfsearchString.push(element.value);
        } else if (element.name === "lname") {
          this.lastname = element.value;
          listOfsearchString.push(element.value);
        }
      });

      this.showSpinner = true;
      this.fetchParticipant(); // Call your method
    }
  }

  handleSearch(event) {
    //  console.log(event.target.label);
    var inp = this.template.querySelectorAll("lightning-input");
    let listOfsearchString = [];
    inp.forEach(function (element) {
      if (element.name == "fname") {
        this.firstname = element.value;
        listOfsearchString.push(element.value);
      } else if (element.name == "lname") {
        this.lastname = element.value;
        listOfsearchString.push(element.value);
      }
    }, this);
    //  console.log(JSON.stringify(listOfsearchString));
    this.fetchParticipant();
  } ////changes made by maheswari code end

  @track errorMessage = "";
  @track saveButtonDisable = false;

  /* @track name='';   
    @track nameError = false;
    @track phoneNumber = '';
    @track phoneErrorMessage = '';
    @track phoneFlag = false;
    @track saveButtonDisable = false;
    @track emailErrorMessage = '';
    @track emailFlag = false;
    handleNameChange(event){
        if(event.target.name == 'fname'){
            this.validateName(event);
        }
        if(event.target.name == 'lname'){
            this.validateName(event);
        }
         if(event.target.name == 'email'){
            this.emailCheckFunction(event);
        } 
    }
    validateName(event) {        
        const nameRegex = /^[a-zA-Z ]{2,32}$/;
        if (nameRegex.test(event.target.value)) {
            this.nameError = false;
            this.errorMessage = '';
            this.saveButtonDisable = false;
        } else {            
            this.nameError = true;
            this.errorMessage = 'The name must be in between 2 to 32 characters, and name cannot contain special characters or numbers.';
            this.saveButtonDisable = true;
        }
    } */
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
  activeFilterOn = true;
  inactiveFilterOn = false;

  handleSearchKeyPress(event) {
    this.fullName = event.target.value;
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
  let result = [...this.orginalData];

  if (this.fullName && this.fullName.trim() !== "") {
    const searchLower = this.fullName.toLowerCase();

    result = result.filter((p) => {
      const firstName = p.First_Name__c ? p.First_Name__c.toLowerCase() : "";
      const lastName = p.Last_Name__c ? p.Last_Name__c.toLowerCase() : "";
      const contactNumber = p.Contact_Number__c ? p.Contact_Number__c.toLowerCase() : "";

      // Combine address fields for easier searching
      const address = [
        p.Address__Street__s,
        p.Address__City__s,
        p.Address__StateCode__s,
        p.Address__PostalCode__s,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        contactNumber.includes(searchLower) ||
        address.includes(searchLower)
      );
    });
  }

  // Active/Inactive filters
  if (this.activeFilterOn && !this.inactiveFilterOn) {
    result = result.filter((p) => p.Status__c === true);
  } else if (this.inactiveFilterOn && !this.activeFilterOn) {
    result = result.filter((p) => p.Status__c === false);
  }

  // Update results
  this.filteredRecords = result;
  this.records = result;
  this.totalRecords = result.length;
  this.noRecordsFlag = this.totalRecords === 0;

  this.paginationHelper(); // Refresh visible records
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
      const result = await getStaffMembers({ facilityId: this.facilityId });
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
          // Extract roles from StaffRoles__r
          const roles = staff.StaffRoles__r
              ? staff.StaffRoles__r.map((r) => r.RoleName__c)
              : [];

          return {
              Id: staff.Id,
              Name: staff.Display_Nickname__c || staff.Name || "Unnamed",
              Email: staff.Email,
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

 /*    async fetchRoles() {
    try {
      const result = await getRoles();
      //console.log("Roles data >>", result);
      this.roles = result;
      this.loadAssignments();
      this.roleStaffFlag = true;
    } catch (error) {
      throw error;
    }
  }  */
    async fetchRoles() {
     console.log(" [fetchRoles] START");
 
     if (!this.facilityId) {
         console.warn("No facilityId found, cannot fetch Facility Roles.");
         return;
     }
 
     try {
         const result = await getRoleOptionsByFacility({ facilityId: this.facilityId });
         console.log(" Facility Roles fetched:", JSON.stringify(result));
 
         this.roles = result || [];
 
         // Optional: reuse your existing assignment loader if needed
         this.loadAssignments?.();
         this.roleStaffFlag = true;
 
     } catch (error) {
         console.error(" Error fetching Facility Roles:", error);
     }
 
     console.log(" [fetchRoles] END");
 }//manendra  */

  loadAssignments() {
    console.log("this.staffMembers >> ", this.staffMembers);
    console.log("this.roles >> ", this.roles);
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
     // console.log('assignmentPayload >> ', this.serializedPayload);
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
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyC') {
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
      this.fetchParticipant();
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

        const path = typeof event.composedPath === 'function'
            ? event.composedPath()
            : [event.target];
        let clickedInsideGrid = false;
        let clickedInsideNationality = false;
        let clickedInsideLanguage = false;

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
        return this.selectedRoleValues.length > 0 ? 'selected-text' : 'placeholder-text';
    }
}