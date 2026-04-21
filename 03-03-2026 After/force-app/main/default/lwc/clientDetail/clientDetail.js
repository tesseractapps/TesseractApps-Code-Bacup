import { LightningElement, api, track, wire } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import fetchFacilitiess from "@salesforce/apex/ClientSearchController.fetchFacilitiess";
import statusClient from "@salesforce/apex/ClientDataController.statusClient";
import uploadFile from "@salesforce/apex/AWSS3FileUploadController.uploadFile"; // Manimala added this
import getStaffData from "@salesforce/apex/ClientDataController.getStaffData";
import organizationDetails from "@salesforce/apex/InvoiceHandler.organizationDetails";
import insertStaffRecords from "@salesforce/apex/ClientDataController.insertStaffRecords";
import { refreshApex } from "@salesforce/apex";
import getClientById from "@salesforce/apex/ClientDataController.getClientById";
import updateStaffAssignments from "@salesforce/apex/ClientDataController.updateStaffAssignments";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getStaffRoleAssignment from "@salesforce/apex/PreferredStaffController.getStaffRoleAssignment";
import getStaffMembers from "@salesforce/apex/PreferredStaffController.getStaffMembers";
import getRoles from "@salesforce/apex/PreferredStaffController.getRoles";
import getRoleOptionsByFacility from '@salesforce/apex/StaffController.getRoleOptionsByFacility';
import updateParticipantContacts from "@salesforce/apex/ClientDataController.updateParticipantContacts";
import upsertParticipantFacilities from '@salesforce/apex/staffFacilityHandler.upsertParticipantFacilities';
import deleteContacts from "@salesforce/apex/ClientDataController.deleteContacts";
import checkUserExists from '@salesforce/apex/UserAccessController.checkUserExists';
import isGuardianUserActive from '@salesforce/apex/UserAccessController.isGuardianUserActive';

const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};


export default class ClientDetail extends NavigationMixin(LightningElement) {
  @api facilityId;
  @api clientId = "";
  @api individualflag;
  @api companyflag;
  @api ndiscreateflag;
  @track objectApiName = "Client__c";
  activeSections = [
    "ClientDetails",
    "IdentificationDetails",
    "InsuranceDetails",
    "Address",
    "PrimaryContact",
    "SecondaryContact",
    "StaffDetails"
  ];
  @track ParticpantRecordForm = false;
  @track errorMessage = "";
  @track saveButtonDisable = false;
  @track street;
  @track city;
  @track country;
  @track province;
  @track postalcode;
  @api recordId;
  @track participantJson = {};
  @track status;
  @api selectedName;
  @track fullName;
  @track lastName;
  @track firstName;
  @track fileReaderObj; // Manimala added these 27 to 36
  @track base64FileData;
  @track fileName;
  @track file;
  @track myFile;
  @track fileType;
  @track fileSize;
  @track selectedFilesToUpload = [];
  @track isattachError = false;
  @track showSpinner = false;
  @track OrgNisationRoles = [];
  @track facilityId = "";
  @track role = "";
  @track staffName;
  @track staffOptions = [];
  @track selectedRoles = [];
  @track staffRecID;
  wiredStaffResult;
  wiredClientResult;
  @track isDisabled = true;
  @track error;
  @track staffVal;
  //  @track clientData=[];
  @track street1;
  @track clientName;
  @api faclist1 = [];
  @track facilityOptions = [];
  // @track userFacilities=[];
  @track finalListFacilities = [];
  @track facilityCheckboxOptions = [];
  @track staffDetailsTemplate = false;
  @track fieldErrorMap = {};
  @track serializedPayload;
  @track facilityPreferredName;
  @track participantPreferredName;
  @track contactList1 = [];
  @track industryWiseFacility=[]; //vamshi
  @track deletedContactIds = [];
  @track participantModule = true;
  @track createUserflag = false;
  @track contactList = [
      {
          id: 1,
          firstName: '',
          lastName: '',
          contactNumber: '',
          email: '',
          contactType: 'Primary', // NEW FIELD
          notify:false,
          firstNamePlaceholder: '* Enter Name',
          lastNamePlaceholder: '* Enter Name',
          phonePlaceholder: '* Enter Number',
          emailPlaceholder: '* Enter Email',
          showAdd: true,
          addButtonClass: 'add-visible'
      }
  ];

  //@track orgId;

  @track sectionFlags = {
    PartcipantDetails: true,
    Addressdetails: false,
    IdentificationDetails: false,
    InsuranceDetails: false,
    PrimaryContactDetails: false,
    SecondaryContactDetails: false,
    Assignstaff: false,
    OtherPreferences: false,
    ParticipantIdentifiers: false,
    MedicalCardDetails: false,

    PartcipantDetails1: true,
    Addressdetails1: false,
    IdentificationDetails1: false,
    InsuranceDetails1: false,
    PrimaryContactDetails1: false,
    SecondaryContactDetails1: false,
    Assignstaff1: false,
    OtherPreferences1: false,
  };

  // @track sectionIcons = {
  //   PartcipantDetails: "\u2B9F",

  //   Addressdetails: "\u2B9C",
  //   IdentificationDetails: "\u2B9C",
  //   InsuranceDetails: "\u2B9C",
  //   PrimaryContactDetails: "\u2B9C",
  //   SecondaryContactDetails: "\u2B9C",
  //   Assignstaff: "\u2B9C",
  //   OtherPreferences: "\u2B9C",
  //   ParticipantIdentifiers: "\u2B9C",
  //   MedicalCardDetails: "\u2B9C",

  //   PartcipantDetails1: "\u2B9F",
  //   Addressdetails1: "\u2B9C",
  //   IdentificationDetails1: "\u2B9C",
  //   InsuranceDetails1: "\u2B9C",
  //   PrimaryContactDetails1: "\u2B9C",
  //   SecondaryContactDetails1: "\u2B9C",
  //   Assignstaff1: "\u2B9C",
  //   OtherPreferences1: "\u2B9C",
  // };

  @track sectionIcons = {
  PartcipantDetails: { ...ICON_DOWN },

  Addressdetails: { ...ICON_LEFT },
  IdentificationDetails: { ...ICON_LEFT },
  InsuranceDetails: { ...ICON_LEFT },
  PrimaryContactDetails: { ...ICON_LEFT },
  SecondaryContactDetails: { ...ICON_LEFT },
  Assignstaff: { ...ICON_LEFT },
  OtherPreferences: { ...ICON_LEFT },
  ParticipantIdentifiers: { ...ICON_LEFT },
  MedicalCardDetails: { ...ICON_LEFT },

  PartcipantDetails1: { ...ICON_DOWN },
  Addressdetails1: { ...ICON_LEFT },
  IdentificationDetails1: { ...ICON_LEFT },
  InsuranceDetails1: { ...ICON_LEFT },
  PrimaryContactDetails1: { ...ICON_LEFT },
  SecondaryContactDetails1: { ...ICON_LEFT },
  ParticipantIdentifiers1: { ...ICON_LEFT },
  Assignstaff1: { ...ICON_LEFT },
  OtherPreferences1: { ...ICON_LEFT },
  MedicalCardDetails1: { ...ICON_LEFT },
};


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
  @track Nationality;
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
  @track Languages = [];
  @track activeFaciltyDisplay='';
  @track multiFacilityDroDownList=[];
  @track selctedMultipleFcailityValues=[];
  @track facilityDropDownOpen=false;
  @track activeFaciltyDisplay='';
  @track selectedTypeOfIndustry='NDIS';
  @track  participantType;

@track showContactTypeModal = false;
@track newContactTypeName = '';
@track customContactTypes = [];
@track stagedDeleteTypes = [];          // ✅ ARRAY (not Set)
@track activeContactRowIndex;
@track previousContactType;             // ✅ STORE OLD VALUE





  @track contactTypeOptions = [
      { label: 'Primary', value: 'Primary' },
      { label: 'Secondary', value: 'Secondary' },
      { label: 'Guardian', value: 'Guardian' },
      { label: 'Emergency', value: 'Emergency' },
      { label: 'Add New', value: 'Add New Contact Type' }
  ];
@track isMedicareEntered = false;


  async fetchRolesForStaff() {
    try {
      const result = await getStaffRoleAssignment({
        clientId: this.clientId
      });

      this.activeRoles = result;
      console.log("✅ Active roles (await):", JSON.stringify(this.activeRoles));
      console.log(" clientId:", this.clientId);

      // Transform to match LWC template expectations
      this.paginatedData = result.map((item) => {
        return {
          userId: item.staffId,
          nickName: item.staffName,
          roles: item.roles ? item.roles.join(", ") : "",
          profileUrl: item.profileUrl
        };
      });

      console.log(
        "🔎 paginatedData after mapping:",
        JSON.stringify(this.paginatedData)
      );

      await this.fetchStaffMembers(); // 🔁 Ensure this populates paginatedData
    } catch (error) {
      console.error("❌ Error fetching staff roles:", error);
    }
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

  disconnectedCallback() {
      window.removeEventListener('click', this._handleOutsideClick);
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


    /* async fetchRoles() {
    try {
      const result = await getRoles();
      console.log("Roles data >>", result);
      this.roles = result;
      this.loadAssignments();
    } catch (error) {
      throw error;
    }
  }  */
  async fetchRoles() {
    console.log(" [fetchRoles] START");

    if (!this.facilityId) {
        console.warn("⚠️ No facilityId found, cannot fetch Facility Roles.");
        return;
    }

    try {
      const result = await getRoleOptionsByFacility({ facilityIdList: this.selctedMultipleFcailityValues });
      console.log(" Facility Roles fetched:", JSON.stringify(result));

      this.roles = (result || []).map(role => role.Role_Name__c);
           
        // Optional: reuse your existing assignment loader if needed
        this.loadAssignments?.();

    } catch (error) {
        console.error(" Error fetching Facility Roles:", error);
    }

    console.log(" [fetchRoles] END");
}//manendra 

  
  loadAssignments() {
    console.log("this.staffMembers >> ", this.staffMembers);
    console.log("this.roles >> ", this.roles);
    if (this.staffMembers.length > 0 && this.roles.length > 0) {
      // this.staffMembers = this.staffMembers.map(staff => {
      //     const updatedStaff = { ...staff };
      //     updatedStaff.roleAssignments = {};
      //     this.roles.forEach(role => {
      //         updatedStaff.roleAssignments[role] = false;
      //     });
      //     return updatedStaff;
      // });
      this.staffMembers = this.staffMembers.map((staff) => {
        const matching = this.activeRoles.find((ar) => ar.staffId === staff.Id);
        const roleAssignments = {};

        if (matching && Array.isArray(matching.roles)) {
          matching.roles.forEach((role) => {
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

  get groupedStaffRoleData() {
    const staffList = this.filteredStaffMembers || [];

    if (
      !staffList ||
      !this.roles ||
      this.roles.length === 0 ||
      !this.activeRoles
    ) {
      console.log("Missing staffMembers, roles, or activeRoles.");
      return [];
    }

    const grouped = [];
    const activeRoleMap = {};
    const debugLogs = [];

    // Build map: staffId → Set of active roles
    if (Array.isArray(this.activeRoles)) {
      this.activeRoles.forEach((item) => {
        activeRoleMap[item.staffId] = new Set(item.roles);
      });
    } else if (
      this.activeRoles?.staffId &&
      Array.isArray(this.activeRoles.roles)
    ) {
      activeRoleMap[this.activeRoles.staffId] = new Set(this.activeRoles.roles);
    }

    staffList.forEach((originalStaff) => {
      const activeRolesForStaff = activeRoleMap[originalStaff.Id] || new Set();

      // Merge modified version (if any)
      const modified = this.modifiedStaffMap[originalStaff.Id];
      //console.log('modified >>', JSON.stringify(modified));
      //console.log('originalStaff >>', JSON.stringify(originalStaff));
      // console.log('activeRolesForStaff>>', JSON.stringify(activeRolesForStaff));
      const staff = modified
        ? { ...originalStaff, ...modified }
        : originalStaff;

      const roleList = originalStaff.Role__c
        ? originalStaff.Role__c.split(";").map((r) => r.trim())
        : [];
      const assignedRoles = new Set(roleList);

      // 🟡 Log debug info per staff
      debugLogs.push({
        staffId: staff.Id,
        name: staff.Name,
        activeRoles: Array.from(activeRolesForStaff),
        modifiedRoles: staff.roleAssignments
          ? Object.entries(staff.roleAssignments)
              .filter(([_, v]) => v)
              .map(([k]) => k)
          : [],
        roleAssignments: staff.roleAssignments || {}
      });

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

        // ✅ Prioritize modified value if present
        let isChecked;
        if (
          staff.roleAssignments &&
          staff.roleAssignments.hasOwnProperty(roleName)
        ) {
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
    //  console.log('🟢 Role State Summary:', JSON.stringify(debugLogs, null, 2));
    // console.log('✅ Final Grouped Data:', JSON.stringify(grouped, null, 2));

    return grouped;
  }

  @track searchStaff = "";
  @track filteredStaffMembers = [];
  @track staffMembers = [];
  @track roles = [];

  handleSearchStaffInput(event) {
    this.searchStaff = (event.target.value || "").toLowerCase().trim();
    let before = this.filteredStaffMembers.length;
    if (!this.searchStaff) {
      this.filteredStaffMembers = [...this.staffMembers];
    } else {
      this.filteredStaffMembers = this.staffMembers.filter((staff) =>
        (staff.Name || "").toLowerCase().includes(this.searchStaff)
      );
    }
    console.log(
      "Search:",
      this.searchStaff,
      "Before:",
      before,
      "After:",
      this.filteredStaffMembers.length
    );
    // This should trigger the UI update thanks to the getter.
  }

  handleUpdateStaff() {
    console.log("Client Id >> ", this.clientId);
    console.log(
      "Modified Staff Map >> ",
      JSON.stringify(this.modifiedStaffMap)
    );

    const modifiedStaffList = Object.values(this.modifiedStaffMap);

    // Prepare payload (only modified records)
    const assignmentPayload = modifiedStaffList.map((staff) => ({
      Id: staff.Id,
      Name: staff.Name,
      roleAssignments: staff.roleAssignments,
      rowClass: staff.rowClass
    }));

    this.serializedPayload = JSON.stringify(assignmentPayload);
    console.log("assignmentPayload >> ", this.serializedPayload);
    this.staffDetailsTemplate = false;
    this.searchStaff = "";
  }

  handleeditClose1() {
    this.staffDetailsTemplate = false;
    this.searchStaff = "";
    this.modifiedStaffMap = {};

    // ❗ Reset to original data (if needed)
    this.filteredStaffMembers = [...this.staffMembers];
  }

  modifiedStaffMap = {};

  handleRoleToggle(event) {
    const staffId = event.target.dataset.staffId;
    const roleId = event.target.dataset.roleId;
    const isChecked = event.target.checked;

    // 🔁 Get the latest version: from modified map if exists, otherwise from original list
    const originalStaff =
      this.modifiedStaffMap[staffId] ||
      this.staffMembers.find((s) => s.Id === staffId);

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

    console.log(
      "🗂️ Modified Staff Map:",
      JSON.stringify(this.modifiedStaffMap)
    );
  }

  handleSectionToggle(event) {
    // const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute
    // // Toggle the flag and update the icon dynamically
    // this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
    // this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
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
      if (!sectionElement) {
        console.warn("Section element not yet in DOM:", sectionId);
        return;
    }
    // Toggle the icon dynamically
    // this.sectionIcons[sectionId] = sectionElement.classList.contains(
    //   "hidden-section"
    // )
    //   ? "\u2B9C"
    //   : "\u2B9F";
    this.sectionIcons[sectionId] =
    sectionElement.classList.contains('hidden-section')
      ? { ...ICON_LEFT }
      : { ...ICON_DOWN };
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
        //label:  `${record.Name} ${record.Last_Name__c}`
      }));

      console.log("Staff options: " + JSON.stringify(this.staffOptions));

      // Assign the first staff's label to staffVal if available
      if (this.staffOptions.length > 0) {
        this.staffVal = this.staffOptions[0].label;
      }

      // Default to pre-assigned staff if no roles selected
      if (!this.selectedRoles || this.selectedRoles.length === 0) {
        this.selectedRoles = data
          .filter((record) => record.isAssigned) // Assuming 'isAssigned' indicates if the staff is already assigned
          .map((record) => record.Id);
      }
      console.log("Selected staff: " + JSON.stringify(this.selectedRoles));
    } else if (error) {
      console.error("Error fetching staff values: ", error);
    }
  }
  connectedCallback() {
    console.log("SelectedName>>" + this.selectedName);
    console.log('company flag..',this.companyflag);
    console.log('individual flag..',this.individualflag);
    console.log('ndis create flag..',this.ndiscreateflag);
    this.wiredStaffResult = [];
    this.wiredClientResult = [];
    // Fetch organization roles
    this.participantPreferredName =
      localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName =
      localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    organizationDetails().then((response) => {
      let orgRoles = response.listofPriceBook.Roles__c;
      //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
      //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c
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
    });

    // Fetch facilities and update participant details
    this.handlefacility();
    // Log client details if clientId is not null
    if (this.clientId != null) {
      console.log("client Id 11>> " + this.clientId);
      //this.getStaffValues()
      refreshApex(this.wiredClientResult);
    }
    this.fetchRolesForStaff();

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
    return this.getFieldClass("Email__c");
  }
  get DateOfBirthClass() {
    return this.getFieldClass("Date_Of_Birth__c");
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
    message = errorMessages.join("\n");

    // 4. Show all errors as a toast
    /* this.dispatchEvent(
        new ShowToastEvent({
            title: 'Update Failed',
            message: message,
            variant: 'error',
           
        })
    ); */
  }

 
  handlefacility() {
    fetchFacilitiess().then((response) => {
      // console.log('fetch method response>>> '+JSON.stringify(response));
      this.refreshTable = response;

      if (Array.isArray(response)) {
        response.forEach((item) => {
          this.participantJson[item.Id] = {
            street: item.Address__Street__s,
            city: item.Address__City__s,
            stateCode: item.Address__StateCode__s,
            countryCode: item.Address__CountryCode__s,
            postalCode: item.Address__PostalCode__s,
            lastName: item.Last_Name__c,
            firstName: item.First_Name__c,
            facilityId: item.Facility__c
            /*"role": item.Participant_Staff_Associations__r && item.Participant_Staff_Associations__r.length > 0
                            ? item.Participant_Staff_Associations__r[0].Role__c
                            : ''*/
          };
        });

        const storedFacilityId = localStorage.getItem("defaultFacilityId");
        const storedFacilityLabel = localStorage.getItem(
          "defaultFacilityLabel"
        );
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

              /*  this.facilityCheckboxOptions = this.facilityOptions
                        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(option => {
                                    return {
                                    ...option,
                                    checked: option.value === storedFacilityId
                                    };
                        }); */

                        if(this.ndiscreateflag){
                            this.industryWiseFacility = facresponse
                              .filter(record => record.Type_of_Service__c === 'NDIS')
                              .map(record => ({
                                  label: record.Name,
                                  value: record.Id
                              }));
                        } else{
                             this.industryWiseFacility = facresponse
                              .filter(record => record.Type_of_Service__c === 'Nursing')
                              .map(record => ({
                                  label: record.Name,
                                  value: record.Id
                              }));
                          
                        }
 
                             
                         
           



              // 2. Set as selected bubble
              /*  this.selectedFacilities = [{
                                label: storedFacilityLabel,
                                value: storedFacilityId
                        }]; */
              /*  console.log('Fetch Participant>>>'+ JSON.stringify(result));
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
                            this.showSpinner = false; */
            } else if (
              userTpe == "Facility Admin" ||
              userTpe == "HR Admin" ||
              userTpe == "Roster Manager"
            ) {
              getFacilityCurrentUser().then((result) => {
                console.log(
                  "getFacilityCurrentUser facility   " + JSON.stringify(result)
                );
                this.facilityCheckboxOptions = result.map((record) => ({
                  label: record.Facility__r.Name,
                  value: record.Facility__r.Id
                }));
                this.finalListFacilities = this.facilityCheckboxOptions;
                /* 
                                                                                                let facilityIds = this.facilityCheckboxOptions.map(f => f.value);
                            
                                  console.log('facilityIds  '+JSON.stringify(facilityIds))
                                const filteredData = finalData.filter(rec =>
                                    facilityIds.includes(rec.Facility__c)
                                );
                                this.facilityCheckboxOptions =  this.facilityCheckboxOptions
                                        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(option => {
                                        return {
                                        ...option,
                                        checked: option.value === storedFacilityId
                                        };
                                });
                */
                // 2. Set as selected bubble
                /* this.selectedFacilities = [{
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
                                this.applyFilters(); 
                               // this.paginationHelper(); // call helper menthod to update pagination logic           
                                this.ParticpantRecordForm=false;
                                this.showSpinner = false; */
              });
            }
          });
        });
        //console.log('Response>>' + JSON.stringify(this.participantJson));
      }
      
      this.ParticpantRecordForm = false;
    });
  }

  handleFacilityChange(event) {
    //  console.log('facility onchange '+(event.target)) ;
    this.facilityId = event.target.value; // Capture Facility ID
    //this.getStaffValues(); // Fetch staff based on the new facility
    refreshApex(this.wiredStaffResult);
    console.log("Selected facility >> " + this.facilityId);
  }
  handleChangeRole(event) {
    console.log("onchange " + JSON.stringify(event.detail));
    this.role = event.detail.value; // Handle combobox value change
    console.log("Selected Role >> " + this.role);
    // this.getStaffValues();
    refreshApex(this.wiredStaffResult);
  }

  async handleOpenstaffModal(event) {
    console.log("this.staffDetailsTemplate >>", this.staffDetailsTemplate);
    await Promise.all([
      //this.fetchRoles(),
      this.fetchRolesForStaff()
    ]);
    this.staffDetailsTemplate = true;
    console.log("this.staffDetailsTemplate >>", this.staffDetailsTemplate);
  }

    @wire(getClientById, { recordId: "$clientId" })
    wiredClient(result) {

        console.log("===== WIRED CLIENT INVOKED =====");
        console.log("ClientId >>> ", this.clientId);

        this.wiredClientResult = result;
        const { data, error } = result;

        console.log("Wire Raw Result >>> ", JSON.stringify(result));

        if (data) {

            console.log("===== CLIENT DATA RECEIVED =====");
            console.log("Full Data >>> ", JSON.stringify(data));

            this.facilityId = data[0].Facility__c;
            this.participantType = data[0].Type_of_Participant__c;
            this.toggleValue = data[0].Status__c;

            console.log("FacilityId >>> ", this.facilityId);
            console.log("Participant Type >>> ", this.participantType);
            console.log("Status Toggle Value >>> ", this.toggleValue);

            this.isMedicareEntered =
                !!data[0].Medicare_Card_ID__c &&
                data[0].Medicare_Card_ID__c.trim() !== '';

            console.log("Is Medicare Entered >>> ", this.isMedicareEntered);

            // ====== ROLE HANDLING ======
            console.log("Participant_Staff_Associations__r >>> ",
                JSON.stringify(data[0].Participant_Staff_Associations__r));

            if (
                data[0].Participant_Staff_Associations__r &&
                data[0].Participant_Staff_Associations__r.length > 0
            ) {
                this.role =
                    data[0].Participant_Staff_Associations__r[0].Role__c;

                console.log("Role from client data >>> ", this.role);

                if (this.role) {
                    console.log("Refreshing staff wire because role exists...");
                    refreshApex(this.wiredStaffResult);
                }
            } else {
                this.role = "";
                console.log("No Staff Associations Found. Role cleared.");
            }

            // ====== UPDATE CONTACT LIST ======
            console.log("Participant_Contacts__r >>> ",
                JSON.stringify(data[0].Participant_Contacts__r));

            if (data[0].Participant_Contacts__r) {

                this.contactList1 =
                    data[0].Participant_Contacts__r.map((c) => {
                        console.log("Mapping Contact >>> ", JSON.stringify(c));

                        return {
                            id: c.Id,
                            firstName: c.First_Name__c || '',
                            lastName: c.Last_Name__c || '',
                            contactNumber: c.Contact_Number__c || '',
                            email: c.Email__c || '',
                            contactType: c.Contact_Type__c || '',
                            notify: c.Notify__c || false
                        };
                    });

                console.log("Mapped Contact List1 >>> ",
                    JSON.stringify(this.contactList1));

            } else {
                this.contactList1 = [];
                console.log("No Participant Contacts Found.");
            }

            // ====== FACILITY MULTI SELECT ======
            console.log("Participant_Facilities__r >>> ",
                JSON.stringify(data[0].Participant_Facilities__r));

            if (data[0].Participant_Facilities__r) {

                this.selctedMultipleFcailityValues =
                    data[0].Participant_Facilities__r
                        .map(f => {
                            console.log("Mapping Facility Record >>> ",
                                JSON.stringify(f));
                            return f.Facility__c;
                        })
                        .filter(Boolean);

                console.log("Selected Facility Ids >>> ",
                    JSON.stringify(this.selctedMultipleFcailityValues));

                this.fetchMultiFaciltyOptions();

                this.activeFaciltyDisplay =
                    data[0].Participant_Facilities__r
                        .map(f => f.Facility__r?.Name)
                        .filter(Boolean)
                        .join(', ');

                console.log("Active Facility Display >>> ",
                    this.activeFaciltyDisplay);

            } else {
                this.selctedMultipleFcailityValues = [];
                console.log("No Participant Facilities Found.");
            }

            // ====== BUILD CONTACT TYPE OPTIONS ======
            console.log("Building Contact Type Options...");

            let baseOptions = [
                { label: 'Primary', value: 'Primary' },
                { label: 'Secondary', value: 'Secondary' },
                { label: 'Guardian', value: 'Guardian' },
                { label: 'Emergency', value: 'Emergency' }
            ];

            const addNewOption = {
                label: 'Add New',
                value: 'Add New Contact Type'
            };

            let backendTypes = new Set();

            this.contactList1.forEach(c => {
                if (c.contactType) {
                    backendTypes.add(c.contactType);
                }
            });

            console.log("Backend Contact Types Found >>> ",
                JSON.stringify([...backendTypes]));

            backendTypes.forEach(type => {
                if (!baseOptions.some(opt => opt.value === type)) {
                    console.log("Adding Backend Type to Options >>> ", type);
                    baseOptions.push({ label: type, value: type });
                }
            });

            baseOptions.push(addNewOption);

            this.contactTypeOptions = baseOptions;
            this.contactList = this.contactList1;

            // ====== ENHANCE CONTACT LIST FOR UI ======
            this.contactList = this.contactList1.map((c, index, arr) => {

                const isLast = index === arr.length - 1;
                const isPrimary = c.contactType === 'Primary';
                const isGuardian = c.contactType === 'Guardian';

                return {
                    ...c,

                    // 🔥 Show create user icon only for Guardian
                    showCreateUserIcon: isGuardian,

                    // Placeholders
                    firstNamePlaceholder: isPrimary ? '* Enter Name' : 'Enter Name',
                    lastNamePlaceholder: isPrimary ? '* Enter Name' : 'Enter Name',
                    phonePlaceholder: isPrimary ? '* Enter Number' : 'Enter Number',
                    emailPlaceholder: isPrimary ? '* Enter Email' : 'Enter Email',

                    // Add button logic
                    showAdd: isLast,
                    addButtonClass: isLast ? 'add-visible' : 'add-hidden',

                    // Default disable state
                    isDisabled: false
                };
            });

            console.log("Enhanced Contact List >>> ", JSON.stringify(this.contactList));

            // ====== CHECK GUARDIAN USER STATUS ======
            this.contactList.forEach((con, index) => {

                if (con.contactType === 'Guardian' && con.email) {

                    console.log('🔍 Checking Guardian User:', con.email);

                    isGuardianUserActive({ email: con.email })
                        .then(isActive => {

                            console.log('✅ Guardian Active Status:', isActive);

                            const updatedList = [...this.contactList];

                            updatedList[index] = {
                                ...updatedList[index],
                                isDisabled: isActive
                            };

                            this.contactList = updatedList;

                            console.log("Updated Contact List >>> ",
                                JSON.stringify(this.contactList));

                        })
                        .catch(error => {
                            console.error('❌ Error checking Guardian User', error);
                        });
                }
            });

            console.log("Final Contact Type Options >>> ",
                JSON.stringify(this.contactTypeOptions));

            console.log("Final Contact List >>> ",
                JSON.stringify(this.contactList));

            

            console.log("===== WIRED CLIENT COMPLETED SUCCESSFULLY =====");
        }

        else if (error) {
            console.error("===== WIRED CLIENT ERROR =====");
            console.error("Error >>> ", JSON.stringify(error));
            this.handleError(error);
        }
    }


  handleBackToParticipant(event) {
    this.staffDetailsTemplate = false;
  }

  addContactRow() {
    console.log('addContactRow');
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
      // if (this.ndiscreateflag  === true && this.contactList.length === 1) {
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
  
  // handleContactsChange(event) {
  //     const index = event.target.dataset.index;
  //     const field = event.target.name;
  //     //let value = event.target.value;
  //     let value;
  //     if (event.target.type === "checkbox") {
  //        value = event.target.checked;
  //     } else {
  //        value = event.target.value;
  //     }
  //     this.contactList[index][field] = value;
  //      if (field === 'notify' && value === true && !this.contactList[index].email) {
  //       this.dispatchEvent(
  //           new ShowToastEvent({
  //               title: 'Email Required',
  //               message: `Email is required when Notify is selected ( Contact Row ${index + 1}).`,
  //               variant: 'error'
  //           })
  //       );

  //       // ⛔ Revert checkbox to false
  //      // this.contactList[index].notify = false;
  //   }
  //     // If user selected "Add New Contact Type"
  //     if (field === "contactType" && value === "Add New Contact Type") {
  //         this.contactList[index].showNewTypeInput = true;   // open textbox
  //         this.contactList = [...this.contactList];
  //         return;
  //     }

  //     this.contactList[index][field] = value;
  //      const isMandatory =
  //       this.contactList[index].contactType === 'Primary';

  //       this.contactList[index].firstNamePlaceholder =
  //           isMandatory  ? '* Enter Name' : 'Enter Name';

  //       this.contactList[index].lastNamePlaceholder =
  //           isMandatory  ? '* Enter Name' : 'Enter Name';

  //       this.contactList[index].phonePlaceholder =
  //           isMandatory  ? '* Enter Number' : 'Enter Number';

  //       this.contactList[index].emailPlaceholder =
  //           isMandatory  ? '* Enter Email' : 'Enter Email';
  //     this.contactList = [...this.contactList];
  // }

handleContactsChange(event) {
    const index = event.target.dataset.index;
    const field = event.target.name;
    let value = event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;

    /* ===============================
       ADD NEW CONTACT TYPE
       =============================== */
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

    // ✅ ADD THIS BLOCK (ICON VISIBILITY LOGIC)
    if (field === 'contactType') {
        this.contactList[index].showCreateUserIcon = (value === 'Guardian');
    }

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
    const isMandatory = this.contactList[index].contactType === 'Primary' || this.contactList[index].contactType === 'Guardian';

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
//     this.contactList[this.activeContactRowIndex].contactType =
//         this.previousContactType || '';

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




// resetContactTypeModal() {
//     this.showContactTypeModal = false;
//     this.newContactTypeName = '';
//     this.activeContactRowIndex = undefined;
//     this.previousContactType = undefined;
//     this.stagedDeleteTypes = [];
//     this.contactList = [...this.contactList];
// }


  resetContactTypeModal() {
      this.showContactTypeModal = false;
      this.newContactTypeName = '';
      // this.activeContactRowIndex = undefined;
      // this.previousContactType = undefined;
      this.activeContactRowIndex = null;
      this.previousContactType = null;
     
      this.stagedDeleteTypes = [];
      console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
     // this.contactList = [...this.contactList];
      console.log('this.contactList in reset : ',JSON.stringify(this.contactList));
  }






  saveNewContactType(event) {
      const index = event.target.dataset.index;
      const newType = this.contactList[index].newContactTypeValue;

      if (!newType) return;

      // 1️⃣ Add new type to options
      this.contactTypeOptions = [
          ...this.contactTypeOptions.filter(opt => opt.value !== "Add New Contact Type"),
          { label: newType, value: newType },
          { label: "Add New", value: "Add New Contact Type" }
      ];

      // 2️⃣ Set this row to new type
      this.contactList[index].contactType = newType;

      this.contactList[index].newContactTypeValue = "";

      // 3️⃣ Close textbox UI
      this.contactList[index].showNewTypeInput = false;

      this.contactList = [...this.contactList];

      // 4️⃣ Re-open combobox (simulated)
      setTimeout(() => {
          const combo = this.template.querySelector(
              `lightning-combobox[data-index="${index}"]`
          );
          if (combo) {
              combo.focus();       // focus on the combobox
              combo.click();       // simulate click to open dropdown
          }
      }, 50);
  }

  cancelNewContactType(event) {
      const index = event.target.dataset.index;
      this.contactList[index].newContactTypeValue = '';
      this.contactList[index].showNewTypeInput = false;
      this.contactList = [...this.contactList];
  }

  handleEditClient(event) {
    event.stopPropagation();
    console.log('handleEditClient ');
    this.fieldErrorMap = {};
    this.ParticpantRecordForm = true;
    console.log('contactList.length', this.contactList.length);
    if (!this.contactList || this.contactList.length === 0) {
        console.log('No contacts found. Adding a new contact...');
        // this.addContactRow();
        this.contactList = [
            {
                id: Date.now(),
                firstName: '',
                lastName: '',
                contactNumber: '',
                email: '',
                contactType: 'Primary',
                notify: false,

                // Mandatory placeholders
                firstNamePlaceholder: '* Enter Name',
                lastNamePlaceholder: '* Enter Name',
                phonePlaceholder: '* Enter Number',
                emailPlaceholder: '* Enter Email',

                showAdd: true,
                addButtonClass: 'add-visible'
            }
        ];
    }
   // this.contactList = this.contactList1;
    this.contactList = this.contactList.map((c, index, arr) => {
        const isLast = index === arr.length - 1;
        const isPrimary = c.contactType === 'Primary';
        return {
            ...c,

            // Placeholders (always present)
            firstNamePlaceholder: isPrimary ? '* Enter Name' : 'Enter Name',
            lastNamePlaceholder: isPrimary ? '* Enter Name' : 'Enter Name',
            phonePlaceholder: isPrimary ? '* Enter Number' : 'Enter Number',
            emailPlaceholder: isPrimary ? '* Enter Email' : 'Enter Email',

            // + button logic (ONLY last row)
            showAdd: isLast,
            addButtonClass: isLast ? 'add-visible' : 'add-hidden',

            // Safety flags
           // showNewTypeInput: false
        };
    });

    console.log("Final Contact Type Options => ", JSON.stringify(this.contactList));
    console.log("Final Contact Type Options => ", JSON.stringify(this.contactList1));
    this.recordId = this.clientId;
    let facId = event.currentTarget.dataset.id;
    console.log("FacId>>" + this.clientId);
    //this.recordId = facId;
    console.log("Participant Data ", JSON.stringify(this.participantJson));
    this.street = this.participantJson[this.recordId]["street"];
    this.city = this.participantJson[this.recordId]["city"];
    this.country = this.participantJson[this.recordId]["countryCode"];
    this.province = this.participantJson[this.recordId]["stateCode"];
    this.postalcode = this.participantJson[this.recordId]["postalCode"];
    this.lastName = this.participantJson[this.recordId]["lastName"];
    this.firstName = this.participantJson[this.recordId]["firstName"];
    this.facilityId = this.participantJson[this.recordId]["facilityId"];
    this.fileName = "";
    this.errorMessage = "";
    this.saveButtonDisable = false;
    refreshApex(this.wiredStaffResult);
    console.log("Child handleEditClient invoked by parent");
    // Example: maybe open a modal or set an edit mode
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
    }
  }

  async handleSuccess(event) {
      try {
          // --------------------------------
          // ✅ INITIAL SUCCESS TOAST
          // --------------------------------
          this.dispatchEvent(
              new ShowToastEvent({
                  title: "Success",
                  message: "Details updated successfully.",
                  variant: "success"
              })
          );

          this.ParticpantRecordForm = false;
          refreshApex(this.wiredClientResult);

          let staffRecID = event.detail.id;

          // --------------------------------
          // 📁 FILE UPLOAD (IF FILE EXISTS)
          // --------------------------------
          if (staffRecID && this.fileName?.length > 0) {
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
                          message: this.fileName + " - Uploaded Successfully!!!",
                          variant: "success"
                      })
                  );
              } catch (fileError) {
                  console.error("❌ File Upload Error:", fileError);
                  this.dispatchEvent(
                      new ShowToastEvent({
                          title: "File Upload Error",
                          message: fileError.body?.message || "Unable to upload file.",
                          variant: "error"
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
          // --------------------------------
          // 👥 UPDATE STAFF ASSIGNMENTS (SAFE)
          // --------------------------------
          let safeAssignmentsJSON =
              this.serializedPayload &&
              this.serializedPayload !== "{}" &&
              this.serializedPayload !== "[]"
                  ? this.serializedPayload
                  : null;

          if (safeAssignmentsJSON) {
              try {
                  await updateStaffAssignments({
                      clientId: this.clientId,
                      assignmentsJSON: safeAssignmentsJSON
                  });

                  console.log("✅ Successfully updated staff assignments.");
              } catch (staffError) {
                  console.error("❌ Staff assignment error:", staffError);
                  this.dispatchEvent(
                      new ShowToastEvent({
                          title: "Staff Assignment Error",
                          message: staffError.body?.message || "Unknown staff assignment error",
                          variant: "error"
                      })
                  );
                  return; // ❗ STOP further actions
              }
          } else {
              console.warn("⚠️ No staff assignments to update — skipping updateStaffAssignments()");
          }

          // --------------------------------
          // 📞 UPDATE PARTICIPANT CONTACTS (SAFE)
          // --------------------------------
          let safeContactPayload =
              this.contactList && Array.isArray(this.contactList) && this.contactList.length > 0
                  ? JSON.stringify(this.contactList)
                  : null;

          if (safeContactPayload) {
              try {
                  await updateParticipantContacts({
                      clientId: this.clientId,
                      contactData: safeContactPayload
                  });

              
              } catch (contactError) {
                  console.error("❌ Contacts update error:", contactError);
              
                  return; // ❗ STOP further actions
              }
          } else {
              console.warn("⚠️ No contacts to update — skipping updateParticipantContacts()");
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
          // --------------------------------
          // 📝 SUBMIT PARENT lightning-record-edit-form
          // --------------------------------
          const fields = event.detail.fields;
          const form = this.template.querySelector("lightning-record-edit-form");
          if (form) {
              form.submit(fields);
          }

          // --------------------------------
          // 🎛️ UI STATE RESET
          // --------------------------------
          this.participanteditflag = false;
          this.editButtom = true;
          this.editandBackButton = true;
          this.participantflag = true;

          // Clear modified staff map
          this.modifiedStaffMap = {};

          // --------------------------------
          // 🔄 REFRESH RELATED DATA (Delay)
          // --------------------------------
          setTimeout(() => {
              console.log("child fired");
              this.handlefacility();
              refreshApex(this.wiredClientResult);
              this.dispatchEvent(new CustomEvent("participantupdated"));
          }, 1000);

      } catch (err) {
          console.error("❌ General Error in handleSuccess:", err);
          this.dispatchEvent(
              new ShowToastEvent({
                  title: "Unexpected Error",
                  message: err.body?.message || err.message || "Unknown issue occurred.",
                  variant: "error"
              })
          );
      }
  }


  //Manimala added this  144 to 199
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

  handleSubmit(event) {
    console.log("in submit");
    event.preventDefault(); // stop the form from submitting
    const fields = event.detail.fields;
    const facilityInput = this.template.querySelector('[data-id="facility"]');
    if (!this.facilityId) {
      facilityInput.reportValidity(); // shows “Complete this field”
      return;
    }

    console.log("contactList>>", JSON.stringify(this.contactList));
    console.log("individualFlag>>", this.individualflag);
    console.log("CompanyFlag>>", this.companyflag);
    console.log("ndiscreateflag>>", this.ndiscreateflag);

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

    // 5️⃣ Validate Guardian contacts (all fields required)
    const guardianContacts = this.contactList.filter(
        (con) => con.contactType === "Guardian"
    );

    for (let i = 0; i < guardianContacts.length; i++) {
        let c = guardianContacts[i];

        if (
            !c.firstName ||
            !c.lastName ||
            !c.contactNumber ||
            !c.email
        ) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Guardian Contact Required Fields',
                    message: 'All fields are required for the Guardian contact.',
                    variant: 'error'
                })
            );
            return;
        }
    }
    //if(this.ndiscreateflag  === true){
      // 3️⃣ At least ONE Primary required
      if (primaryContacts.length === 0) {
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Primary Contact Required',
                  message: 'Please select at least one Primary contact.',
                  variant: 'error'
              })
          );
          return;
      }
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

    if (fields.IRN__c=== '0') {
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

  //     for (let i = 0; i < this.contactList.length; i++) {
  //         let c = this.contactList[i];

  //         if (
  //             !c.firstName ||
  //             !c.lastName ||
  //             !c.contactNumber ||
  //             !c.email ||
  //             !c.contactType
  //         ) {
  //             this.dispatchEvent(
  //                 new ShowToastEvent({
  //                     title: 'Missing Required Fields',
  //                     message: `All fields are required for Contact Row ${i + 1}.`,
  //                     variant: 'error'
  //                 })
  //             );
  //             return; // ❗ Stop execution immediately
  //         }
  //     }
  //  } 
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
    fields.Address__Street__s = this.street;
    fields.Address__City__s = this.city;
    fields.Address__StateCode__s = this.province;
    fields.Address__CountryCode__s = "AU";
    fields.Address__PostalCode__s = this.postalcode;
    fields.Facility__c = this.facilityId;
    fields.Preferred_Nationality__c = this.Nationality;
    fields.Preferred_Languages__c =  this.selectedLangs;
    fields.Status__c = this.toggleValue;
    // console.log('After fields>>'+JSON.stringify(fields));
    this.template.querySelector("lightning-record-edit-form").submit(fields);
  }

  handleeditClose() {
    this.ParticpantRecordForm = false;
    this.staffDetailsTemplate = false;
     /* this.contactList = this.contactList1.map((c, index, arr) => {
        const isLast = index === arr.length - 1;
        const isPrimary = c.contactType === 'Primary';
        return {
            ...c,

            // Placeholders (always present)
           firstNamePlaceholder: isPrimary ? '* Enter Name' : 'Enter Name',
           lastNamePlaceholder: isPrimary ? '* Enter Name' : 'Enter Name',
           phonePlaceholder: isPrimary ? '* Enter Number' : 'Enter Number',
           emailPlaceholder: isPrimary ? '* Enter Email' : 'Enter Email',

            // + button logic (ONLY last row)
            showAdd: isLast,
            addButtonClass: isLast ? 'add-visible' : 'add-hidden',

            // Safety flags
           // showNewTypeInput: false
        };
    }); */
  }

  handlefacStatus(event) {
    let facId = event.currentTarget.dataset.id;
    let facstatus = event.target.dataset.name;
    let finalStatus;
    let message;
    if (facstatus == "true") {
      finalStatus = "false";
      message = "Client is Inactive";
    } else if (facstatus == "false") {
      finalStatus = "true";
      message = "Client is Active";
    }
    statusClient({ IdValue: facId, status: finalStatus }).then((response) => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "",
          message: message,
          variant: "success"
        })
      );
      //refreshApex(this.refreshTable);
    });
  }

  handleNameChange(event) {
    if (event.target.name == "fname") {
      this.firstName = "";
      this.firstName = event.target.value;
    }
    if (event.target.name == "lname") {
      this.lastName = "";
      this.lastName = event.target.value;
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
  handleStaffChange(event) {
    // this.staffName = event.target.value;
    // console.log('Staff Name >> '+ this.staffName);
    this.selectedRoles = event.detail.value;
    console.log(
      "Updated selected roles: " + JSON.stringify(this.selectedRoles)
    );
  }

  triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
  }

  get showParticipantFormClass() {
    return this.staffDetailsTemplate ? "slds-hide" : "";
  }

  get showPreferredStaffClass() {
    return this.staffDetailsTemplate ? "" : "slds-hide";
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
        } else {
            // reset dropdown when input is cleared
            this.filteredOptions = this.allNationalities.map(n => ({
                label: n,
                value: n
            }));
            this.noResults = false;
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
        console.log('this.lan >>>>>>', JSON.stringify(this.Languages));
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

    // get selectedOptionClass() {
    //     return this.selectedRoleValues.length > 0 ? 'selected-text' : 'placeholder-text';
    // }

  showToast(variant, message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: variant === "success" ? "Success" : "Error",
        message: message,
        variant: variant,
        mode: "dismissable"
      })
    );
  }

  // get selectedOptionClass() {
  //             return this.selctedMultipleFcailityValues.length > 0 ? 'selected-text' : 'placeholder-text';
  //    }


    get selectedOptionClass() {
      return (
          (this.selctedMultipleFcailityValues?.length > 0) ||
          (this.selectedRoleValues?.length > 0)
      )
          ? 'selected-text slds-truncate'
          : 'placeholder-text slds-truncate';
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
                     getFacilityData().then(facResponse => {
                        let orginalFacValues=facResponse
           
                    if ( this.participantType == 'NDIS') {
                        
                            orginalFacValues = orginalFacValues.filter(
                                fac => fac.Type_of_Service__c === 'NDIS'
                            );
                            } else if ( this.participantType !== 'NDIS') {
                              orginalFacValues = orginalFacValues.filter(
                                    fac => fac.Type_of_Service__c !== 'NDIS'
                                );
                            }else{
                                orginalFacValues = orginalFacValues
                  }
                          
                       
                         console.log('this.selctedMultipleFcailityValues  '+this.selctedMultipleFcailityValues)    
                           // Build enhanced option objects (with toggle + badge)
                           this.multiFacilityDroDownList = orginalFacValues.map((fac, index) => {
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

      @track toggleflag = false;
      @track previousToggleValue;
handleStatus(event) {
  this.previousToggleValue = this.toggleValue;
  console.log('previousToggleValue'+this.previousToggleValue);
  this.toggleflag = true;
        
  this.toggleValue = event.target.checked; 
  
  console.log('Toggle status:', this.toggleValue);

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
            console.log('Apex Result:', this.selctedMultipleFcailityValues);

            this.participantModule = false;
            this.createUserflag = true;

            const eventPayload = {
                contactData: this.contactData
            };

            this.dispatchEvent(
                new CustomEvent('createuser', {
                    detail: eventPayload,
                    bubbles: true,
                    composed: true
                })
            );

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

        const contactData = event.detail;

        this.dispatchEvent(
            new CustomEvent('createuser', {
                detail: contactData,
                bubbles: true,
                composed: true
            })
        );
    }

}