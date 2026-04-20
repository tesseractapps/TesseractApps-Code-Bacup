import { LightningElement, track, wire, api } from "lwc";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getForms from "@salesforce/apex/IncidentRegisterControllerV2.getForms";
import saveFormResponse from "@salesforce/apex/IncidentRegisterControllerV2.saveFormResponse";
import updateFormResponse from "@salesforce/apex/IncidentRegisterControllerV2.updateFormResponse";
import getFormResponses from "@salesforce/apex/IncidentRegisterControllerV2.getFormResponses";
import deleteFormResponse from "@salesforce/apex/IncidentRegisterControllerV2.deleteFormResponse";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import CURRENT_USER_ID from "@salesforce/user/Id";
import getUserAccessDetails from "@salesforce/apex/UserAccessController.getUserAccessDetailsforAccessManager1";
import getParticipants from "@salesforce/apex/IncidentRegisterControllerV2.getParticipants";
import getAvailableForms from "@salesforce/apex/IncidentRegisterControllerV2.getAvailableForms";
// import grantAccessToParticipant from '@salesforce/apex/FormController.grantAccessToParticipant';
import grantAccessToStaff from "@salesforce/apex/IncidentRegisterControllerV2.grantAccessToStaff";
import getAccessibleForms from "@salesforce/apex/IncidentRegisterControllerV2.getAccessibleForms";
import clearGrantedForms from "@salesforce/apex/IncidentRegisterControllerV2.clearGrantedForms";
import getFormsByClient from "@salesforce/apex/FormController.getFormsByClient";
import getFormResponsesByClient from "@salesforce/apex/IncidentRegisterControllerV2.getFormResponsesByClient";
import uploadFileToSalesforce from "@salesforce/apex/FormController.uploadFileToSalesforce";
import { getRecord } from "lightning/uiRecordApi";
import USER_NAME from "@salesforce/schema/User.Name";
import USER_EMAIL from "@salesforce/schema/User.Email";
import USER_ROLE from "@salesforce/schema/User.User_Role__c";
import Form3D from "@salesforce/resourceUrl/Form3D";
import saveCaseRecord from "@salesforce/apex/issueRegisterSearch.saveCaseRecord";

import Id from "@salesforce/user/Id";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import fetchClient from "@salesforce/apex/ClientDataController.fetchFacilitiess";
import getStaffByEmail from "@salesforce/apex/StaffController.getStaffByEmail";
import getEmployeeData from "@salesforce/apex/IncidentRegisterControllerV2.getEmployeeData";
import getStaffRecords from "@salesforce/apex/IncidentRegisterControllerV2.getStaffRecords";
import getFormDetailsById from "@salesforce/apex/IncidentRegisterControllerV2.getFormDetailsById";
import UsrRoleName from "@salesforce/schema/User.User_Role__c";
import UserOrgName from "@salesforce/schema/User.Organization_Name__c";
import UserType from "@salesforce/schema/User.User_Type__c";
import FirstName from "@salesforce/schema/User.FirstName";
import LastName from "@salesforce/schema/User.LastName";
import UserEmail from "@salesforce/schema/User.Email";
import sendFormDetailsToStaff from "@salesforce/apex/IncidentRegisterControllerV2.sendFormDetailsToStaff";
import getStaffEmailById from "@salesforce/apex/IncidentRegisterControllerV2.getStaffEmailById";
import getUserDetails from "@salesforce/apex/issueRegisterSearch.getUserDetails";
import updateFormWithHistory from "@salesforce/apex/IncidentRegisterControllerV2.updateFormWithHistory";
import getPreviousFormData from "@salesforce/apex/IncidentRegisterControllerV2.getPreviousFormData";
import { subscribe, MessageContext } from 'lightning/messageService';
import NEW_FORM_REDIRECT_CHANNEL from "@salesforce/messageChannel/NewFormRedirectChannel__c";
import getFormsForUser from '@salesforce/apex/IncidentRegisterControllerV2.getFormsForUser';
import getStaffsByOrg from '@salesforce/apex/IncidentRegisterControllerV2.getStaffsByOrg';
import fetchImageAsBase64 from "@salesforce/apex/IncidentRegisterControllerV2.fetchImageAsBase64";
import getPresignedUrl from "@salesforce/apex/WordEditorController.getPresignedUrl";
import getUpdatePresignedUrl from "@salesforce/apex/WordEditorController.getUpdatePresignedUrl";


import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from "@salesforce/resourceUrl/jspdf";
import autoTable from "@salesforce/resourceUrl/autotable";
import getOrgLogo from "@salesforce/apex/IncidentRegisterControllerV2.getOrgLogo";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
let jsPDFLoaded = false;

import StaticForms from "@salesforce/resourceUrl/Static_Forms";

const FORM_IMAGE_1 = `${StaticForms}/form1.png`;
const FORM_IMAGE_2 = `${StaticForms}/form2.png`;

const formImages = [FORM_IMAGE_1, FORM_IMAGE_2];
import LAYOUT_MESSAGE_CHANNEL from '@salesforce/messageChannel/LayoutMessageChannel__c';

const AWS_BASE = "https://tesseractapps.com"; 
const ENDPOINTS = {
  delete: `${AWS_BASE}/delete-file`
};

export default class FormRender extends LightningElement {
  @api hideSubmittedForms = false;
  @api hideFormAccessTable = false;
  @track orgLogoUrl = "";
  @track forms = [];
  @track selectedForm;
  @track tableRows = [];
  @track isFormSelected = false;
  @track selectedFormType = "";
  @track formResponses = [];
  @track selectedResponseId;
  @track isEditing = false;
  @track isViewMode = false;
  @track viewTableData = [];
  @api clientId = "";
  @api orgid = "";
  userId = CURRENT_USER_ID;
  form3D = Form3D;
  wiredFormResponses;
  @track participantAccess = false;
  @track showFormsAccess = false;
  @track showFormsAccessClick = false;
  @track isNdisOrgAdmin = false;
  @track defaultIncidentLayout;
  @track wiredParticipants;
  @track participants = []; // Stores fetched records
  @track recordsToDisplay = []; // Stores paginated records
  @track totalRecords = 0;
  @track pageNumber = 1;
  @track pageSize = 5; // Default number of records per page
  @track totalPages = 0;
  @track isDesktop = true; // Simulated for desktop behavior
  @track visible = true; // For visibility control
  @track noRecordsFlag = false; // Flag to handle no records message
  @track bDisableFirst = true; // Disable First & Previous initially
  @track bDisableLast = true; // Disable Next & Last initially
  @track selectedParticipantId = "";
  @track selectedParticipantName = "";
  @track isGrantAccessPopupOpen = false;
  @track availableForms = [];
  @track selectedForms = new Set();
  @track grantedForms = new Set();

  @track showPublishedForms = false;
  @track paginatedFormResponses = []; // Stores paginated submitted forms
  @track totalFormRecords = 0;
  @track formPageNumber = 1;
  @track formPageSize = 10; // Default number of records per page
  @track totalFormPages = 0;
  @track disableFirstFormPage = true;
  @track disableLastFormPage = true;
  @track searchQuery = "";
  @track filteredForms = [];
  @track selectedFacilityFilter = "";
  @track selectedRoleFilter = "";
  @track roleOptions = [];

  pageSizeOptions = [10, 20, 50];


  @track selectedFacilityId;

  @track userId = Id;
  @track userRole;
  @track orgName;
  @track userType;
  @track firstName;
  @track lastName;
  @track userEmail;
  @track userFacility;
  @track pagedRows = []; // All pages
  @track currentPageIndex = 0; // Current step
  @track isLoading = false;

  jsPDFLoaded = false;
  jsPDFConstructor;

   tLogoUrl = `${Loading_Logo}/TLogo.png`;
      tImageUrl = `${Loading_Logo}/T.png`;
    
      get logoUrl() {
        return this.tLogoUrl;
      }
    
      get imageUrl() {
        return this.tImageUrl;
      }


  @track dataTypes = [
    { id: "1", label: "Text Field" },
    { id: "2", label: "Number Field" },
    { id: "3", label: "Date Field" },
    { id: "4", label: "Time Field" },
    { id: "5", label: "Checkbox Field" },
    { id: "6", label: "Dropdown Field" },
    { id: "7", label: "URL Field" }
  ];

  @wire(getRecord, {
    recordId: Id,
    fields: [UsrRoleName, UserOrgName, UserType, FirstName, LastName, UserEmail]
  })
  wiredUser({ error, data }) {
    if (data) {
      this.userRole = data.fields.User_Role__c.value;
      this.orgName = data.fields.Organization_Name__c.value;
      this.userType = data.fields.User_Type__c.value;

      this.userEmail = data.fields.Email.value;

      // Logging user info
      console.log(" User ID: ", this.userId);
      console.log(" User Role: ", this.userRole);
      console.log(" Organization Name: ", this.orgName);
      console.log(" User Type: ", this.userType);
      console.log(" First Name: ", this.firstName);
      console.log(" Last Name: ", this.lastName);
      console.log(" Email: ", this.userEmail);
      this.showFormsAccess =
        this.userType === "NDIS Org Admin" ||
        this.userType === "Roster Manager" ||
        this.userType === "Facility Admin";
      this.showFormsAccessClick =
        this.userType === "NDIS Org Admin" ||
        this.userType === "Roster Manager" ||
        this.userType === "Facility Admin";

      this.fetchUserRoles();
      this.getFacilityValues();
      this.getStaffValues();
      this.loadFormsForCurrentUser()
    } else if (error) {
      console.error("❌ Error fetching user info:", error);
    }
  }

  fetchUserRoles() {
    getStaffByEmail({ email: this.userEmail })
      .then((response) => {
        if (response && response.length > 0) {

          const userData = response[0];

this.userFacility = userData.Facility__r?.Name || "";
this.loggedInStaffId = userData.Id;

console.log("🏥 Facility from Staff:", this.userFacility);
console.log("🆔 Logged-in Staff Id:", this.loggedInStaffId);

// ============================
// 👤 NAME FROM STAFF
// ============================

this.firstName = userData.Name || "";
this.lastName = userData.Last_Name__c || "";

console.log("👤 First Name (Staff.Name):", this.firstName);
console.log("👤 Last Name (Staff.Last_Name__c):", this.lastName);

// ============================
// 📞 CONTACT FROM STAFF
// ============================

this.userContactNum = userData.Contact_Number__c || "";

console.log(
  "📞 Contact Number (Staff.Contact_Number__c):",
  this.userContactNum
);

// ============================
// 🧑‍💼 ROLES FROM CHILD RECORDS
// ============================

this.rolesArray =
  userData.StaffRoles__r
    ?.filter(r => r.Active__c)
    .map(r => r.RoleName__c) || [];

this.role =
  this.rolesArray[0] || "";

console.log(
  "🧑‍💼 Roles from StaffRoles__r:",
  this.rolesArray
);
console.log("🎯 Primary Role:", this.role);



          // ✅ Enhanced Logs
          // console.log('✅ getStaffByEmail SUCCESS');
          // console.log('🎯 Email Used:', this.userEmail);
          // console.log('🏢 Facility Name:', this.userFacility);
          // console.log('🧑‍💼 Staff Data:', JSON.stringify(userData, null, 2));
          // console.log('📋 Roles Array:', this.rolesArray);
          // console.log('📞 Contact Number:', this.userContactNum);
        } else {
          console.warn("⚠️ No Role__c found in response or response is empty");
          console.log("Response:", JSON.stringify(response, null, 2));
        }
      })
      .catch((error) => {
        console.error("❌ Error in getStaffByEmail:", error);
      });
  }

  @wire(MessageContext) messageContext;


  handleRedirectClick() {
    const sampleLayout = {
      layoutJSON: JSON.stringify({
        tableRows: [
          {
            id: "row-0",
            cells: [
              {
                id: "cell-0-0",
                row: 0,
                col: 0,
                field: {
                  id: "field-nsrd535t8",
                  label: "First Name",
                  dataType: "Text Field",
                  isRequired: true,
                  comments: "",
                  selectedTextFieldOption: "alphaNumeric",
                  alphaNumericLength: "50",
                  onlyAlphabetsLength: ""
                },
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-0-0-edit",
                deleteKey: "cell-0-0-delete"
              },
              {
                id: "cell-0-1",
                row: 0,
                col: 1,
                field: {
                  id: "field-2ghzhgdq6",
                  label: "Last Name",
                  dataType: "Text Field",
                  isRequired: true,
                  comments: "",
                  selectedTextFieldOption: "alphaNumeric",
                  alphaNumericLength: "50",
                  onlyAlphabetsLength: ""
                },
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-0-1-edit",
                deleteKey: "cell-0-1-delete"
              }
            ]
          },
          {
            id: "row-1",
            cells: [
              {
                id: "cell-1-0",
                row: 1,
                col: 0,
                field: {
                  id: "field-c81bg5do4",
                  label: "Email ID",
                  dataType: "Text Field",
                  isRequired: true,
                  comments: "",
                  selectedTextFieldOption: "alphaNumeric",
                  alphaNumericLength: "50",
                  onlyAlphabetsLength: ""
                },
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-1-0-edit",
                deleteKey: "cell-1-0-delete"
              },
              {
                id: "cell-1-1",
                row: 1,
                col: 1,
                field: {
                  id: "field-bcx32dwj7",
                  label: "Facility",
                  dataType: "Dropdown Field",
                  isRequired: true,
                  comments: "",
                  selectedDropdownOption: "singleSelect",
                  multiSelectValues: "",
                  singleSelectValues: ""
                },
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-1-1-edit",
                deleteKey: "cell-1-1-delete"
              }
            ]
          },
          {
            id: "row-2",
            cells: [
              {
                id: "cell-2-0",
                row: 2,
                col: 0,
                field: {
                  id: "field-r4zw6wftx",
                  label: "Role",
                  dataType: "Text Field",
                  isRequired: false,
                  comments: "",
                  selectedTextFieldOption: "onlyAlphabets",
                  alphaNumericLength: "",
                  onlyAlphabetsLength: "50"
                },
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-2-0-edit",
                deleteKey: "cell-2-0-delete"
              },
              {
                id: "cell-2-1",
                row: 2,
                col: 1,
                field: {
                  id: "field-99vf167tp",
                  label: "Contact Number",
                  dataType: "Number Field",
                  isRequired: true,
                  comments: "",
                  selectedNumberFieldOption: "contactNumber",
                  decimalValue: "",
                  contactNumberDigits: "12"
                },
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-2-1-edit",
                deleteKey: "cell-2-1-delete"
              }
            ]
          },
          {
            id: "row-3",
            cells: [
              {
                id: "cell-3-0",
                row: 3,
                col: 0,
                field: {
                  id: "field-vgnrxq19d",
                  label: "Participant",
                  dataType: "Dropdown Field",
                  isRequired: true,
                  comments: "",
                  selectedDropdownOption: "singleSelect",
                  multiSelectValues: "",
                  singleSelectValues: ""
                },
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-3-0-edit",
                deleteKey: "cell-3-0-delete"
              },
              {
                id: "cell-3-1",
                row: 3,
                col: 1,
                field: {
                  id: "field-vpamk79dn",
                  label: "Status",
                  dataType: "Dropdown Field",
                  isRequired: true,
                  comments: "",
                  selectedDropdownOption: "singleSelect",
                  multiSelectValues: "",
                  singleSelectValues: "Open\nIn-Progress\nResolved"
                },
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-3-1-edit",
                deleteKey: "cell-3-1-delete"
              }
            ]
          },
          {
            id: "row-4",
            cells: [
              {
                id: "cell-4-0",
                row: 4,
                col: 0,
                field: {
                  id: "field-8yzyici3g",
                  label: "Assigned To",
                  dataType: "Dropdown Field",
                  isRequired: true,
                  comments: "",
                  selectedDropdownOption: "singleSelect",
                  multiSelectValues: "",
                  singleSelectValues: ""
                },
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-4-0-edit",
                deleteKey: "cell-4-0-delete"
              },
              {
                id: "cell-4-1",
                row: 4,
                col: 1,
                field: null,
                colspan: 1,
                rowspan: 1,
                showMenu: false,
                style: "border: 1px solid #ddd;",
                editKey: "cell-4-1-edit",
                deleteKey: "cell-4-1-delete"
              }
            ]
          },
          {
            id: "row-5",
            cells: [
              {
                id: "cell-5-0",
                row: 5,
                col: 0,
                field: null,
                colspan: 1,
                rowspan: 1,
                style: "border: 1px solid #ddd;"
              },
              {
                id: "cell-5-1",
                row: 5,
                col: 1,
                field: null,
                colspan: 1,
                rowspan: 1,
                style: "border: 1px solid #ddd;"
              }
            ]
          },
          {
            id: "row-6",
            cells: [
              {
                id: "cell-6-0",
                row: 6,
                col: 0,
                field: {
                  id: "field-b3676plnt",
                  label: "page break",
                  dataType: "Text Field",
                  isRequired: false,
                  comments: "",
                  selectedTextFieldOption: "",
                  alphaNumericLength: "",
                  onlyAlphabetsLength: ""
                },
                colspan: 2,
                rowspan: 1,
                style: "border: 1px solid #ddd;"
              }
            ]
          }
        ],
        selectedFormType: "Incident Register"
      }),
      Name__c: "Incident Register",
      title: "Incident Register",
      actionType: "redirect"
    };

    this.dispatchEvent(
      new CustomEvent("navigatetoform", {
        detail: {
          activateFormCreate: true,
          ...sampleLayout
        },
        bubbles: true,
        composed: true
      })
    );

    setTimeout(() => {
      console.log("✅ Layout payload:", sampleLayout);
      publish(this.messageContext, NEW_FORM_REDIRECT_CHANNEL, sampleLayout);
      console.log(
        "🚀 Message published successfully to NEW_FORM_REDIRECT_CHANNEL."
      );
    }, 500);
  }

  getFacilityValues() {
    console.log("📥 Calling getFacilityData Apex method...");

    getFacilityData()
      .then((response) => {
        // ✅ Map the facility list
        this.facilityOptions = response.map((record) => ({
          value: record.Id,
          label: record.Name
        }));

        const facilityLength = this.facilityOptions.length;
        // console.log('✅ getFacilityData SUCCESS');
        // console.log('🏢 Total Facilities Retrieved:', facilityLength);
        // console.log('🏢 Facility Options:', JSON.stringify(this.facilityOptions, null, 2));
        const facilityLabels = this.facilityOptions.map((f) => f.label);
        console.log("🏷️ All Facility Labels:", facilityLabels.join(", "));

        // ✅ Try to match the user's facility name to the options
        if (this.userFacility) {
          const matchedOption = this.facilityOptions.find(
            (opt) => opt.label === this.userFacility
          );
          if (matchedOption) {
            this.facilityVal = matchedOption.value;
            this.faclitylabel = matchedOption.label;
            this.faclitylabel1 = matchedOption.label;

            console.log("✅ User Facility Matched:", matchedOption);
          } else {
            console.warn(
              "⚠️ User Facility NOT found in facilityOptions:",
              this.userFacility
            );
            // Fallback to the first facility
            this.facilityVal = this.facilityOptions[0]?.value || "";
            this.faclitylabel = this.facilityOptions[0]?.label || "";
            this.faclitylabel1 = this.facilityOptions[0]?.label || "";
          }
        } else {
          console.warn("⚠️ userFacility is not defined yet");
          // Default to the first facility if no userFacility found
          this.facilityVal = this.facilityOptions[0]?.value || "";
          this.faclitylabel = this.facilityOptions[0]?.label || "";
          this.faclitylabel1 = this.facilityOptions[0]?.label || "";
        }

        // Flag to indicate facility was loaded
        this.facilityValFalg = !!this.facilityVal;
        console.log("📍 Selected Facility Value:", this.facilityVal);
        console.log("🏷️ Selected Facility Label:", this.faclitylabel);
        this.fetchParticipants();
      })
      .catch((error) => {
        console.error("❌ Error in getFacilityData:", error);
      });
  }

  // =========================================
// 🔍 Centralized Logger
// =========================================
log(section, message, data = null, type = "log") {
  const prefix = `🧭 [${section}]`;

  switch (type) {
    case "warn":
      console.warn(prefix, message, data ?? "");
      break;
    case "error":
      console.error(prefix, message, data ?? "");
      break;
    default:
      console.log(prefix, message, data ?? "");
  }
}


getStaffValues() {

    this.log("getStaffValues", "Method invoked");

    // 🔥 Facility from localStorage first
    const storedFacilityId = localStorage.getItem("defaultFacilityId");

    this.log("getStaffValues", "Facility in localStorage", storedFacilityId);

    const facilityId = storedFacilityId || this.facilityVal;

    this.log("getStaffValues", "Resolved facilityId", facilityId);
    this.log("getStaffValues", "Resolved orgId", this.orgid);

    if (!facilityId || !this.orgid) {

        this.log(
            "getStaffValues",
            "❌ OrgId or FacilityId missing — skipping staff fetch",
            {
                orgId: this.orgid,
                facilityId
            },
            "warn"
        );

        return;
    }

    // ===============================
    // 📞 APEX CALL — STAFF
    // ===============================

    this.log("getStaffValues", "📞 Calling getStaffsByOrg Apex", {
        recordId: this.orgid,
        FacilityId: facilityId
    });

    getStaffsByOrg({
        recordId: this.orgid,
        facilityId: facilityId

    })
        .then((response) => {

            console.group("🧭 STAFF APEX RESPONSE");
            console.log("Raw response:", response);
            console.log("Type:", typeof response);
            console.log("Is Array:", Array.isArray(response));
            console.log("Count:", response?.length || 0);

            if (response?.length) {
                console.log("First record:", response[0]);
                console.log(
                    "Email_Address__c:",
                    response[0].Email_Address__c
                );
                console.log(
                    "Status__c:",
                    response[0].Status__c
                );
            }

            console.groupEnd();

            this.log(
                "getStaffValues",
                `Staff records received: ${response?.length || 0}`
            );

            if (!response || response.length === 0) {

                this.log(
                    "getStaffValues",
                    "⚠️ No staff records returned from Apex",
                    null,
                    "warn"
                );

                this.staffOptions = [];
                this.staffOptions1 = [];
                this.staffOptions2 = [];

                return;
            }

            // ===============================
            // 🔧 BUILD OPTIONS
            // ===============================

            this.staffOptions = response.map((record) => ({
                value: record.Id,
                label: record.Name
            }));

            this.staffOptions1 = response.map((record) => ({
                value: record.Id,
                label: record.Last_Name__c
            }));

            this.staffOptions2 = response.map((record) => ({
                value: record.Id,
                label: record.NameToDisplay__c
            }));

            this.log(
                "getStaffValues",
                "staffOptions (Name) sample",
                this.staffOptions.slice(0, 5)
            );

            this.log(
                "getStaffValues",
                "staffOptions2 (Display) sample",
                this.staffOptions2.slice(0, 5)
            );

            // defaults
            this.staffVal = this.staffOptions[0]?.label || "";
            this.staffVal1 = this.staffOptions1[0]?.label || "";
            this.stafflabel = this.staffOptions2[0]?.label || "";

            this.log("getStaffValues", "Default selections", {
                staffVal: this.staffVal,
                staffVal1: this.staffVal1,
                stafflabel: this.stafflabel
            });

        })
        .catch((err) => {

            console.group("❌ STAFF APEX ERROR");
            console.error(err);
            console.groupEnd();

            this.log(
                "getStaffValues",
                "Error fetching staff data",
                err,
                "error"
            );

        });

    // ===============================
    // 👤 USER DETAILS
    // ===============================

    this.log("getStaffValues", "📞 Calling getUserDetails Apex");

    getUserDetails()
        .then((user) => {

            console.group("👤 USER DETAILS");
            console.log("User object:", user);
            console.groupEnd();

            this.firstName = user.FirstName;
            this.lastName = user.LastName;

            this.log(
                "getStaffValues",
                "Logged-in user resolved",
                `${this.firstName} ${this.lastName}`
            );

        })
        .catch((err) => {

            console.group("❌ USER DETAILS ERROR");
            console.error(err);
            console.groupEnd();

            this.log(
                "getStaffValues",
                "Error fetching user details",
                err,
                "error"
            );

        });
}




  connectedCallback() {
    console.log("📌 Received Org ID in iNCIDENT:", this.orgid);
    console.log("🔹 Received Client ID:", this.clientId);
    this.subscribeToMessageChannel();

    orgDetails().then((response) => {
      console.log("response==>" + JSON.stringify(response));
      this.Orgid = response.Id;
      this.orgfullname = response.Name;
      this.orgname = response.Name
        ? response.Name.split(" ").slice(0, 2).join(" ")
        : "";
      this.usertype = response.Type_of_User__c;
      // this.userEmail = response?.Email__c || null;

      console.log("this.usertype===>" + this.usertype);
      console.log("this.useremail===>" + this.useremail);

      if (this.usertype === "NDIS User") {
        if (this.currentUserRole == "Portal Account Partner User") {
          this.blNDISUser = true;
        }
        this.NdisFlag = true;
        console.log("user type" + this.usertype);
      }

     if (this.Orgid) {

  getOrgLogo({ orgId: this.Orgid })
  .then((src) => {

    console.log("🏷️ Org Logo SRC:", src);

    if (!src) {
      console.warn("⚠️ Apex returned empty Org Logo");
      this.orgLogoUrl = "";
      return;
    }

    // ✅ Decode &amp; etc
    const txt = document.createElement("textarea");
    txt.innerHTML = src;
    const decodedSrc = txt.value;

    // ✅ Make absolute
    if (decodedSrc.startsWith("/")) {
      this.orgLogoUrl =
        window.location.origin + decodedSrc;
    } else {
      this.orgLogoUrl = decodedSrc;
    }

    console.log("✅ Final browser logo URL:", this.orgLogoUrl);

  })
  .catch((error) => {

    console.error(
      "❌ Error fetching Org Logo from Apex:",
      error
    );

    this.orgLogoUrl = "";
  });


}




      this.loadStaffList();
    });

    if (this.orgid != null) {
      console.log(
        "📥 Fetching Clients (Participants) using orgid:",
        this.orgid
      );

      fetchClient({ recordId: this.orgid, firstname: null, lastname: null })
        .then((response) => {
          this.clientOption = response.map((record) => ({
            value: record.Id,
            label: record.Name,
            facility: record.Facility__c
          }));

          const clientLength = this.clientOption.length;
          this.clientVal = this.clientOption[0]?.value || "";
          this.client = this.clientVal;
          this.clientLabel = this.clientOption[0]?.label || "";
          this.clientLabel1 = this.clientOption[0]?.label || "";

          // ✅ Logging Participants
          // console.log('✅ fetchClient SUCCESS');
          // console.log('👤 Total Participants Retrieved:', clientLength);
          // console.log('👥 Client List:', JSON.stringify(this.clientOption, null, 2));
          // console.log('🔖 Default Client Value:', this.clientVal);
          // console.log('🔖 Default Client Label:', this.clientLabel);
        })
        .catch((error) => {
          console.error("❌ Error fetching participants (clients):", error);
        });
    }

    // ✅ Hide Participants Table if clientId is present
    if (this.clientId && this.clientId.trim() !== "") {
      this.participantAccess = false; // Hide Participants Table
      console.log(
        "🚫 Hiding Participants Table - Form is Specific to a Client"
      );
    } else {
      this.participantAccess = true; // Show Participants Table
      console.log("✅ Showing Participants Table - No Specific Client ID");
    }

    this.loadIncidentResponses();

    
  }

async loadIncidentResponses() {

  if (!this.orgid) {
    console.warn("⚠️ OrgId missing — skipping fetch");
    return;
  }

  // 🔥 read facility from localStorage
  const facilityId =
    localStorage.getItem("defaultFacilityId");

  console.log("🏥 Facility used for response fetch:", facilityId);

  try {

    const data = await getFormResponses({
      orgId: this.orgid,
      facilityId: facilityId
    });

    console.log(
      "✅ Retrieved Form Responses (Org Filtered):",
      data
    );

    this.processFormResponses(data);

  } catch (err) {

    console.error(
      "❌ Error fetching form responses:",
      err
    );

    this.showToast(
      "Error",
      "Failed to load responses",
      "error"
    );
  }
}



  renderedCallback() {
    // ✅ Set tooltip titles for labels
    const labels = this.template.querySelectorAll(".label-text-drop");
    labels.forEach((label) => {
      if (!label.title) {
        label.title = label.textContent;
      }
    });

    // ✅ Inject rich text content (only in view mode)
    if (
      this.isViewMode &&
      this.viewTableData &&
      Array.isArray(this.viewTableData)
    ) {
      this.viewTableData.forEach((item) => {
        if (item.isRichText && item.value) {
          const container = this.template.querySelector(
            `div[data-id="${item.id}"]`
          );
          if (container) {
            container.innerHTML = item.value;
          }
        }
      });
    }

    // ✅ Update CSS progress bar variables
    const progressLine = this.template.querySelector(".progress-line");
    if (progressLine && Array.isArray(this.pagedRows)) {
      progressLine.style.setProperty("--progress", this.currentPageIndex);
      progressLine.style.setProperty(
        "--total-steps",
        this.pagedRows.length - 1
      ); // One less for 'Complete'
    }

    const statusElements = this.template.querySelectorAll(".status-indicator");

    if (!this.hasInjectedPulseStyle) {
      const style = document.createElement("style");
      style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.6; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `;
      this.template.querySelector("div")?.appendChild(style);
      this.hasInjectedPulseStyle = true;
    }

    statusElements.forEach((el) => {
      const rawStatus = el.dataset.status;
      const status = rawStatus ? rawStatus.trim().toLowerCase() : "unknown";
      const dot = document.createElement("span");
      dot.style.display = "inline-block";
      dot.style.width = "10px";
      dot.style.height = "10px";
      dot.style.borderRadius = "50%";
      dot.style.marginRight = "8px";
      dot.style.verticalAlign = "middle";
      dot.style.animation = "pulse 1.5s infinite";

      switch (status) {
        case "open":
          dot.style.backgroundColor = "blue";
          dot.style.boxShadow = "0 0 4px 1px rgba(0, 0, 255, 0.4)";
          break;
        case "in-progress":
          dot.style.backgroundColor = "orange";
          dot.style.boxShadow = "0 0 4px 1px rgba(255, 165, 0, 0.4)";
          break;
        case "resolved":
          dot.style.backgroundColor = "green";
          dot.style.boxShadow = "0 0 4px 1px rgba(0, 128, 0, 0.4)";
          break;
        default:
          dot.style.backgroundColor = "gray";
          break;
      }

      const existingDot = el.querySelector(".dot");
      if (existingDot) {
        existingDot.remove();
      }

      dot.classList.add("dot");
      el.prepend(dot);
      el.style.display = "flex";
      el.style.alignItems = "center";
    });

    if (this.jsPDFLoaded) return;

Promise.all([
  loadScript(this, jsPDF),
  loadScript(this, autoTable)
])
  .then(() => {

    const jspdfNS = window.jspdf || {};

    const jsPDFConstructor =
      jspdfNS.jsPDF || window.jsPDF;

    if (!jsPDFConstructor) {
      console.warn("⚠️ jsPDF constructor missing");
      return;
    }

    // 👇 autoTable attaches directly to API
    const hasAutoTable =
      typeof jsPDFConstructor.API?.autoTable === "function";

    console.log("jsPDF:", jsPDFConstructor);
    console.log("autoTable on API:", hasAutoTable);

    if (hasAutoTable) {
      this.jsPDFLoaded = true;
      this.jsPDFConstructor = jsPDFConstructor;

      console.log("✅ jsPDF + autoTable fully ready");
    } else {
      console.warn("⚠️ autoTable not attached to jsPDF API");
    }
  })
  .catch(err => {
    console.error("❌ Failed loading PDF libs:", err);
  });


  }



  @wire(getRecord, {
    recordId: "$userId",
    fields: [USER_NAME, USER_EMAIL, USER_ROLE]
  })
  userDetails({ error, data }) {
    if (data) {
      this.userName = data.fields.Name.value;
      this.userEmail = data.fields.Email.value;
      this.userRole = data.fields.User_Role__c.value;

      console.log("🔹 Logged-in User:", this.userName);
      console.log("🔹 User Role:", this.userRole);
      console.log("🔹 User userEmail:", this.userEmail);

      // ✅ Restrict Access to Specific Roles
      const allowedRoles = [
        "Portal Account Partner Executive",
        "Portal Account Partner Manager",
        "CEO",
        "Admin"
      ];
      // this.participantAccess = allowedRoles.includes(this.userRole);

      console.log("🔹 Participant Access Granted:", this.participantAccess);
    } else if (error) {
      console.error("❌ Error fetching user details:", error);
    }
  }

  // @wire(getParticipants)
  // wiredRecords({ data, error }) {
  //     if (data) {
  //         this.participants = data.map(participant => ({
  //             ...participant,
  //             grantedForms: participant.Form_Access__c ? participant.Form_Access__c.split(';') : []
  //         }));
  //         // this.totalRecords = data.length;
  //         // this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
  //         // this.paginationHelper();
  //     } else if (error) {
  //         console.error('Error fetching participants:', error);
  //     }
  // }

 fetchParticipants() {
    console.log("📌 Attempting to fetch participants...");

    // 🔥 Get facility from localStorage first
    const storedFacilityId = localStorage.getItem("defaultFacilityId");

    // fallback to component state
    const facilityId = storedFacilityId || this.facilityVal;

    console.log("🏢 Facility used for fetch:", facilityId);

    if (!facilityId) {
        console.warn("⚠️ FacilityId not available yet. Skipping fetch.");
        return;
    }

    getParticipants({ facilityId })
        .then((data) => {
            console.log("✅ Apex call succeeded.");
            console.log("👥 Participants returned:", data.length);

            this.participants = data.map((participant) => {

                const grantedForms = participant.Accessible_Forms__c
                    ? participant.Accessible_Forms__c.split(";")
                    : [];

                return {
                    ...participant,
                    grantedForms
                };
            });

            console.log(
                `🎯 Total participants loaded: ${this.participants.length}`
            );
        })
        .catch((error) => {
            console.error("❌ Error fetching participants:", error);

            if (error?.body?.message) {
                console.error("📛 Apex message:", error.body.message);
            }
        });
}


  @wire(getUserAccessDetails, { userId: "$userId" })
  wiredUserAccessDetails({ error, data }) {
    if (data) {
      this.userData = this.processUserData(data);
      this.totalRecords = this.userData.length;
      console.log("✅ User Access Data Fetched:", JSON.stringify(userData));
    } else if (error) {
      this.showToast("Error", "Failed to fetch user data.", "error");
    }
  }
  // togglePublishedForms() {
  //     this.showPublishedForms = !this.showPublishedForms;
  // }

  loadStaffList() {
    getStaffRecords({ orgId: this.orgid })
      .then((data) => {
        console.log("🟢 Raw staff data:", JSON.stringify(data, null, 2));
        this.staffList = data.map((staff) => {
          const grantedForms = staff.Accessible_Forms__c
            ? staff.Accessible_Forms__c.split(";")
            : [];

          return {
            Id: staff.Id,
            firstName: staff.Name,
            lastName: staff.Last_Name__c,
            picture: staff.Picture__c,
            email: staff.Email_Address__c,
            facilityName: staff.Facility__r?.Name || "Unknown",
            role: staff.Role__c,
            status: staff.Status__c,
            displayStatus: staff.Status__c ? "Active" : "Inactive",
            grantedForms,
            isSelected: false
          };
        });
        // 🔹 Extract unique Facilities
        // After staffList is mapped:
        const uniqueFacilityNames = [
          ...new Set(this.staffList.map((s) => s.facilityName).filter(Boolean))
        ];

        this.staffFacilityOptions = uniqueFacilityNames.map((name) => ({
          label: name,
          value: name
        }));

        // 🔹 Extract unique Roles (split multiple roles by ;)
        const allRoles = data
          .map((s) => s.Role__c?.split(";"))
          .flat()
          .filter(Boolean);
        const uniqueRoles = [...new Set(allRoles)];
        this.staffRoleOptions = uniqueRoles.map((role) => ({
          label: role,
          value: role
        }));

        this.filteredStaffList = [...this.staffList];
        console.log("✅ Staff loaded:", this.staffList);
        this.totalRecords = this.staffList.length;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.paginationHelper();
      })
      .catch((error) => {
        console.error("❌ Error loading staff records:", error);
      });
  }

  @track staffList = [];
  @wire(getStaffRecords, { orgId: "$orgid" })
  wiredStaff({ data, error }) {
    console.log("✅ getStaffRecords START");
    console.log("Staff data " + JSON.stringify(data));
    if (data) {
      this.staffList = data.map((staff) => {
        const grantedForms = staff.Accessible_Forms__c
          ? staff.Accessible_Forms__c.split(";")
          : [];

        return {
          Id: staff.Id,
          firstName: staff.Name,
          lastName: staff.Last_Name__c,
          picture: staff.Picture__c,
          email: staff.Email_Address__c,
          facilityName: staff.Facility__r?.Name || "Unknown",
          role: staff.Role__c,
          status: staff.Status__c,
          displayStatus: staff.Status__c ? "Active" : "Inactive",
          grantedForms
        };
      });

      console.log("✅ Total Staff Records:", this.staffList.length);

      this.totalRecords = this.staffList.length;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
      this.paginationHelper();
    } else if (error) {
      console.error("❌ Error fetching staff records:", error);
    }
  }
  @track staffRecordByEmail;
  wiredStaffResult;

  @wire(getStaffByEmail, { email: "$userEmail" })
  wiredStaff(result) {
    this.wiredStaffResult = result;

    const { data, error } = result;

    if (data && data.length > 0) {
      // console.log("✅ Staff Record by email:", JSON.stringify(data));
      this.staffRecordByEmail = data[0]; // Only one record expected per email
    } else if (error) {
      console.error("❌ Error loading staff record:", error);
    }
  }

  async loadFormsForCurrentUser() {

    try {

        console.log('🚀 loadFormsForCurrentUser start');
        console.log("📌 Received Org ID in iNCIDENT:", this.orgid);
    console.log("🔹 Received usertype:", this.userType);
    console.log("📌 Received userEmail in iNCIDENT:", this.userEmail);
 

        const result = await getFormsForUser({
            userType: this.userType,
            userEmail: this.userEmail,
            orgId: this.orgid
        });

        console.log('✅ Forms returned:', result);

        this.forms = this.addImagesToForms(result);

        this.filteredForms = [...this.forms];

    } catch (error) {

        console.error('❌ Error loading forms:', error);

        this.showToast(
            'Error',
            error.body?.message || 'Failed to load forms',
            'error'
        );
    }
}

async togglePublishedForms() {
  
  console.log("🔁 togglePublishedForms() triggered");

  await this.loadFormsForCurrentUser();

  console.log("📊 Forms currently loaded:", this.forms?.length);
  console.log("📂 showPublishedForms BEFORE:", this.showPublishedForms);

  // =============================
  // 🚫 NO FORMS AT ALL
  // =============================
  if (!this.forms || !this.forms.length) {

    console.warn("⚠️ No forms returned from Apex");

    this.showToast(
      "Info",
      "No incident forms are available.",
      "info"
    );

    return;
  }

  // =============================
  // 📌 ENSURE DEFAULT EXISTS
  // =============================

  const hasDefault = this.forms.some(
    (f) => f.DefaultIncident__c === true
  );

  if (!hasDefault) {
    console.warn(
      "⚠️ Default Incident NOT present in list (unexpected)"
    );
  }

  // =============================
  // 📂 ONLY ONE FORM → AUTO OPEN
  // =============================

  if (this.forms.length === 1) {

    const formId = this.forms[0].Id;

    console.log(
      "✅ Only one form available — opening directly:",
      formId
    );

    this.handleFormClick({
      currentTarget: {
        dataset: { id: formId }
      }
    });

    return;
  }

  // =============================
  // 🔁 MULTIPLE FORMS → TOGGLE
  // =============================

  this.showPublishedForms = true;

  console.log(
    "📂 showPublishedForms AFTER:",
    this.showPublishedForms
  );

}


handleCancelPublishedForms() {
  this.showPublishedForms = false;
}



  processUserData(data) {
    // console.log('Raw Data:', JSON.stringify(data, null, 2));
    return data
      .filter((user) => user.staffId) // Remove users without staffId
      .map((user) => ({
        ...user,
        staffId: user.staffId || "N/A",
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        userEmail: user.userEmail,
        userRole: user.userRole,
        userType: user.userType,
        userStatus: user.userStatus,
        staffName: user.staffName || "N/A",
        staffGender: user.staffGender || "N/A",
        staffFacility: user.staffFacility || "N/A",
        staffEmail: user.staffEmail || "N/A",
        staffUserRole1: user.staffUserRole1 || "N/A",
        staffUserType:
          user.staffUserType && user.staffUserType.trim()
            ? user.staffUserType
            : "N/A",
        staffStatus: user.staffStatus || "In-Progress" // Default to 'In-Progress' if null/undefined
      }));
  }

  roleOptions = [
    { label: "Org Admin", value: "Portal account partner Executive" },
    { label: "Roster Admin", value: "Portal account partner Manager" },
    { label: "Staff", value: "Portal account partner User" }
  ];



  // @wire(getFormsByClient, { clientId: "$clientId" })
  // wiredClientForms({ data, error }) {
  //   if (data && this.clientId) {
  //     this.forms = this.addImagesToForms(data);
  //     this.filteredForms = this.forms;
  //     console.log("✅ Client-Specific Forms Fetched:", this.forms);
  //   } else if (error) {
  //     console.error("❌ Error fetching client-specific forms:", error);
  //   }
  // }

  // @wire(getForms)
  // wiredAllForms({ data, error }) {
  //   if (data && !this.clientId) {
  //     this.forms = this.addImagesToForms(data);
  //     this.filteredForms = this.forms;
  //     console.log("✅ All Forms Fetched:", this.forms);
  //   } else if (error) {
  //     console.error("❌ Error fetching all forms:", error);
  //   }
  // }

  addImagesToForms(forms) {
    return forms.map((form) => ({
      ...form,
      formImageUrl: this.getRandomFormImage() // or use getStableFormImage(form.Id)
    }));
  }

  getRandomFormImage() {
    const index = Math.floor(Math.random() * formImages.length);
    return formImages[index];
  }

  handleSearchChange(event) {
    this.searchQuery = event.target.value.toLowerCase();

    // ✅ Filter forms based on Name__c
    this.filteredForms = this.forms.filter((form) =>
      form.Name__c.toLowerCase().includes(this.searchQuery)
    );
  }

processFormResponses(data) {

  this.formResponses = data.map((response) => {

    const submittedById =
      response.CreatedById;

    // =============================
    // EDIT → anyone who can view row
    // =============================
    const canEdit = true;

    // =============================
    // DELETE → admin/roster/facility
    //         OR submitted by user
    // =============================
    const canDelete =
      this.showFormsAccess ||
      (this.userId &&
  submittedById === this.userId);


    return {
      ...response,

      // ✅ Facility column
      FacilityName:
        response.Facility__r?.Name || "—",

      // ✅ Date formatting
      FormattedDate:
        this.formatDate(response.CreatedDate),

      // ✅ Assigned To display
      AssignedStaffName:
        response.Incident_Assigned_Staff__r?.NameToDisplay__c ||
        response.Assigned_Staff__c ||
        "—",

      // ✅ Submitted By display
      SubmittedBy:
        response.CreatedBy?.Name || "—",

      // 🔥 UI permission flags
      canEdit,
      canDelete
    };
  });

  // ==========================
  // pagination stays untouched
  // ==========================

  this.filteredFormResponses = [...this.formResponses];
  this.totalFormRecords = this.filteredFormResponses.length;
  this.totalFormPages = Math.ceil(
    this.totalFormRecords / this.formPageSize
  );

  this.updatePaginatedFormResponses();
}


get hasFormResponses() {
  return (
    Array.isArray(this.paginatedFormResponses) &&
    this.paginatedFormResponses.length > 0
  );
}


formatDate(isoDate) {
  if (!isoDate) return "N/A";

  const date = new Date(isoDate);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}


  updatePaginatedFormResponses() {
    if (this.totalFormRecords === 0) {
      this.paginatedFormResponses = [];
      return;
    }

    const startIndex = (this.formPageNumber - 1) * this.formPageSize;
    const endIndex = this.formPageNumber * this.formPageSize;

    this.paginatedFormResponses = this.filteredFormResponses.slice(
      startIndex,
      endIndex
    );

    this.disableFirstFormPage = this.formPageNumber === 1;
    this.disableLastFormPage = this.formPageNumber === this.totalFormPages;
  }

  // ✅ Pagination Controls
  previousFormPage() {
    if (this.formPageNumber > 1) {
      this.formPageNumber--;
      this.updatePaginatedFormResponses();
    }
  }

  nextFormPage() {
    if (this.formPageNumber < this.totalFormPages) {
      this.formPageNumber++;
      this.updatePaginatedFormResponses();
    }
  }

  firstFormPage() {
    this.formPageNumber = 1;
    this.updatePaginatedFormResponses();
  }

  lastFormPage() {
    this.formPageNumber = this.totalFormPages;
    this.updatePaginatedFormResponses();
  }

handleFormPageSizeChange(event) {

    this.formPageSize = Number(event.target.value);

    // reset to first page
    this.formPageNumber = 1;

    // recompute totals
    this.totalFormPages = Math.ceil(
        this.filteredFormResponses.length / this.formPageSize
    );

    this.updatePaginatedFormResponses();
}



  get isFirstPage() {
    return this.currentPageIndex === 0;
  }

  get isLastPage() {
    return this.currentPageIndex === this.pagedRows.length - 1;
  }

  get currentPageDisplay() {
    return this.currentPageIndex + 1;
  }

  goToNextPage() {
    if (this.currentPageIndex < this.pageRowIndexMap.length - 1) {
      this.currentPageIndex++;
      this.updateVisibleRows();
    }
  }

  goToPreviousPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.updateVisibleRows();
    }
  }

  get totalFormsteps() {
    return this.pagedRows.length;
  }
  get currentPageRows() {
    return this.pagedRows[this.currentPageIndex] || [];
  }

  renderPageData(pageRows) {
    const filteredRows = pageRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        let isTextArea = false;
        let isAlphaNumeric = false;
        let isOnlyAlphabets = false;
        let isCurrency = false;
        let isContactNumber = false;
        let isDefaultNumber = false;
        let isTimeField = false;
        let isDateField = false;
        let isCheckboxField = false;
        let isRichText = false;
        let options = [];
        let selectedOptionsArray = [];
        let selectedValues = "";
        let maxLength = null;
        let decimalPlaces = 0;
        let placeholderText = "";

        const label = cell.field?.label?.toLowerCase().trim();

        if (!this.isEditing && label) {
          if (label === "first name" && this.firstName)
            cell.field.value = this.firstName;
          else if (label === "last name" && this.lastName)
            cell.field.value = this.lastName;
          else if (label === "role" && this.rolesArray?.length > 0)
            cell.field.value = this.rolesArray[0];
          else if (label === "email id" && this.userEmail)
            cell.field.value = this.userEmail;
          else if (label === "contact number" && this.userContactNum)
            cell.field.value = this.userContactNum;
          else if (label === "facility") {
            const match = this.facilityOptions.find(
              (opt) => opt.label === this.userFacility
            );
            if (match) cell.field.value = match.value;
          }
        }

        if (cell.field?.dataType === "Text Field") {
          if (cell.field.selectedTextFieldOption === "textArea") {
            isTextArea = true;
            maxLength = 255;
          } else if (cell.field.selectedTextFieldOption === "alphaNumeric") {
            isAlphaNumeric = true;
            maxLength = parseInt(cell.field.alphaNumericLength || "56");
          } else if (cell.field.selectedTextFieldOption === "onlyAlphabets") {
            isOnlyAlphabets = true;
            maxLength = parseInt(cell.field.onlyAlphabetsLength || "55");
          } else if (cell.field.selectedTextFieldOption === "richText") {
            isRichText = true;
          }
        }

        if (cell.field?.dataType === "Number Field") {
          switch (cell.field.selectedNumberFieldOption) {
            case "contactNumber":
              isContactNumber = true;
              maxLength = parseInt(cell.field.contactNumberDigits || "10");
              break;
            case "currency":
              isCurrency = true;
              decimalPlaces = parseInt(cell.field.decimalValue || "2");
              break;
            default:
              isDefaultNumber = true;
              break;
          }
        }

        if (cell.field?.dataType === "Time Field") isTimeField = true;
        if (cell.field?.dataType === "Date Field") isDateField = true;
        if (cell.field?.dataType === "Checkbox Field") isCheckboxField = true;

        if (cell.field?.dataType === "Dropdown Field") {
          if (label === "facility") {
            options = this.facilityOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
              isSelected: cell.field.value === opt.value
            }));
          } else if (label === "assigned to") {
            options = this.staffOptions2.map((opt) => ({
              label: opt.label,
              value: opt.value,
              isSelected: cell.field.value === opt.value
            }));
          } else if (label.includes("participant")) {
            options = this.participants.map((p) => ({
              label: p.Name,
              value: p.Id,
              isSelected: cell.field.value === p.Id
            }));
          } else if (cell.field.selectedDropdownOption === "singleSelect") {
            options =
              cell.field.singleSelectValues?.split("\n").map((opt) => ({
                label: opt.trim(),
                value: opt.trim(),
                isSelected: cell.field.value === opt.trim()
              })) || [];
          } else if (cell.field.selectedDropdownOption === "multiSelect") {
            options =
              cell.field.multiSelectValues?.split("\n").map((opt) => ({
                label: opt.trim(),
                value: opt.trim(),
                isSelected: false
              })) || [];
            selectedOptionsArray = cell.field.value
              ? cell.field.value.split(", ")
              : [];
            options.forEach((o) => {
              if (selectedOptionsArray.includes(o.label)) o.isSelected = true;
            });
            selectedValues = selectedOptionsArray.join(", ");
          }
        }

        return {
          ...cell,
          isVisible: cell.style !== "display: none;",
          isTextField:
            cell.field?.dataType === "Text Field" &&
            !isTextArea &&
            !isAlphaNumeric &&
            !isOnlyAlphabets &&
            !isRichText,
          isTextArea,
          isAlphaNumeric,
          isOnlyAlphabets,
          isNumberField: cell.field?.dataType === "Number Field",
          isContactNumber,
          isCurrency,
          isDefaultNumber,
          isTimeField,
          isDateField,
          isCheckboxField,
          isDropdownField: cell.field?.dataType === "Dropdown Field",
          isMultiSelect: cell.field?.selectedDropdownOption === "multiSelect",
          isUploadField: cell.field?.dataType === "Upload File",
          isRichText,
          floatingLabelStyle: isCheckboxField
            ? "border: 1px solid transparent;"
            : "border: 1px solid black;",
          placeholderText,
          maxLength,
          decimalPlaces,
          selectedOptionsArray,
          selectedValues,
          charCount: cell.field.value?.length || 0,
          isDropdownOpen: false,
          hasContent: !!cell.field?.label,
          field: {
            ...cell.field,
            value: cell.field.value || "",
            options
          }
        };
      })
    }));

    this.tableRows = filteredRows; // ✅ Required to make inputs and handlers work
  }

//   async handleFormClick(event) {
//     console.log("📂 HANDLEFORMCLCIK CLCICK TRIGEREDDDDDDDDDDDDDD");
//     console.log("🧪 Participants loaded:", this.participants.length);
//     console.log("🧪 Staff loaded:", this.staffOptions.length);

//     const formId = event.currentTarget.dataset.id;
//     this.selectedForm = this.forms.find((form) => form.Id === formId);

//     if (!this.selectedForm) return;

//   this.selectedFormType =
//     this.selectedForm.Form_Type__c || "Unknown Form Type";

//   console.log("🔹 Clicked Form ID:", formId);
//   console.log("🔹 Clicked Form Name:", this.selectedForm.Name__c);
//   console.log("🔹 Clicked Form Type:", this.selectedFormType);


//     const raw = this.selectedForm.Form_JSON__c;

//     let allRows = [];

//     if (raw) {
//       const parsed = JSON.parse(raw);

//       if (parsed?.url && parsed?.key) {
//         console.log("🌐 Loading form layout from AWS:", parsed.url);

//         const awsResp = await fetch(parsed.url);

//         if (!awsResp.ok) {
//           throw new Error("Failed to load form JSON from AWS");
//         }

//         allRows = await awsResp.json();
//       } else {
//         // legacy inline
//         allRows = parsed;
//       }
    

//     console.log("🔹 Resolved Form JSON rows:", allRows);
//     // ✅ STORE IMMUTABLE TEMPLATE
// this.originalTemplate = structuredClone(allRows);



//       // 🔄 Build page index map based on "Page Break"
//       let pageMap = [];
//       let currentPage = [];

//       allRows.forEach((row, index) => {
//         const hasPageBreak = row.cells?.some(
//           (cell) => cell.field?.label?.toLowerCase().trim() === "page break"
//         );

//         if (hasPageBreak) {
//           if (currentPage.length > 0) {
//             pageMap.push(currentPage);
//           }
//           currentPage = [];
//         } else {
//           currentPage.push(index);
//         }
//       });

//       if (currentPage.length > 0) {
//         pageMap.push(currentPage);
//       }

//       this.pageRowIndexMap = pageMap;
//       this.pagedRows = pageMap.map((indices) => {
//         return indices.map((i) => this.tableRows[i]);
//       });
//       this.totalFormPages = pageMap.length;
//       this.currentPageIndex = 0;

//       const uiRows = structuredClone(allRows);

// this.tableRows = uiRows.map((row, rowIndex) => {
//         const newCells = row.cells.map((cell) => {
//           let options = [];
//           let selectedOptionsArray = [];
//           let selectedValues = "";

//           let isTextArea = false;
//           let isTextField = false;
//           let isDropdownField = false;
//           let isNumberField = false;
//           let isUploadField = false;

//           let isAlphaNumeric = false;
//           let isOnlyAlphabets = false;
//           let isCurrency = false;
//           let isContactNumber = false;
//           let isDefaultNumber = false;

//           let isTimeField = false;
//           let isDateField = false;
//           let isCheckboxField = false;

//           let maxLength = null;
//           let decimalPlaces = 0;
//           let charCount = 0;
//           let placeholderText = "";
//           isCheckboxField = cell.field?.dataType === "Checkbox Field";
//           let floatingLabelStyle = this.getBorderStyle(cell.field?.dataType);

//           let isRichText = false;
//           let isRadioButton = false;
//           let selectedRadioOption = "";
//           let subInputValue = "";
//           let isHeader = false;
//           let headerText = null;
//           let headerStyle = "";


//           const isFirstPageRow = this.pageRowIndexMap[0]?.includes(rowIndex);
//           // 🧠 Auto-fill
//           if (!this.isEditing && isFirstPageRow && cell.field?.label) {
//             const label = cell.field.label.trim().toLowerCase();

//             if (label === "first name" && this.firstName) {
//               cell.field.value = this.firstName;
//             } else if (label === "last name" && this.lastName) {
//               cell.field.value = this.lastName;
//             } else if (label === "role" && this.rolesArray?.length > 0) {
//               cell.field.value = this.rolesArray.join(', ');
//             } else if (label === "email id" && this.userEmail) {
//               cell.field.value = this.userEmail;
//             } else if (
//               label === "facility"
//             ) {

//               const storedFacilityId = localStorage.getItem('defaultFacilityId');
//               const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');

//               console.log('🏥 Prefilling Facility from localStorage:', {
//                 storedFacilityId,
//                 storedFacilityLabel
//               });

//               if (storedFacilityId) {
//                 cell.field.value = storedFacilityId;
//               } else if (storedFacilityLabel) {
//                 // fallback if only label exists
//                 cell.field.value = storedFacilityLabel;
//               }

//             } else if (label === "contact number" && this.userContactNum) {
//                     cell.field.value = this.userContactNum;
//                   }
//                 }

//           // 🎯 Dropdown handling
//           const dropdownLabel = cell.field?.label?.trim().toLowerCase();
//           if (cell.field?.dataType === "Dropdown Field") {
//             placeholderText = `Select ${cell.field.label}`;

//             if (
//               dropdownLabel === "facility" &&
//               this.facilityOptions.length > 0
//             ) {
//               options = this.facilityOptions.map((opt) => ({
//                 label: opt.label,
//                 value: opt.value,
//                 isSelected: cell.field.value === opt.value
//               }));
//             } else if (
//               dropdownLabel.includes("participant") &&
//               this.participants.length > 0
//             ) {
//               options = this.participants.map((p) => ({
//                 label: p.Name,
//                 value: p.Id,
//                 isSelected: cell.field.value === p.Id
//               }));
//             } else if (
//               dropdownLabel === "assigned to" &&
//               this.staffOptions.length > 0
//             ) {
//               options = this.staffOptions.map((emp) => ({
//                 label: emp.label,
//                 value: emp.value,
//                 isSelected: cell.field.value === emp.value
//               }));
//             } else if (cell.field.selectedDropdownOption === "predefinedList") {
//               const type = cell.field.predefinedListType?.toLowerCase();

//               if (type === "staff" && this.staffOptions.length > 0) {
//                 options = this.staffOptions.map((opt) => ({
//                   label: opt.label,
//                   value: opt.value,
//                   isSelected: cell.field.value === opt.value
//                 }));
//               } else if (
//                 type === "participant" &&
//                 this.participants.length > 0
//               ) {
//                 options = this.participants.map((p) => ({
//                   label: p.Name,
//                   value: p.Id,
//                   isSelected: cell.field.value === p.Id
//                 }));
//               } else if (
//                 type === "facility" &&
//                 this.facilityOptions.length > 0
//               ) {
//                 options = this.facilityOptions.map((opt) => ({
//                   label: opt.label,
//                   value: opt.value,
//                   isSelected: cell.field.value === opt.value
//                 }));
//               }
//             } else if (
//               cell.field.selectedDropdownOption === "singleSelect" &&
//               cell.field.singleSelectValues
//             ) {
//               options = cell.field.singleSelectValues
//                 .split("\n")
//                 .map((option) => ({
//                   label: option.trim(),
//                   value: option.trim(),
//                   isSelected: cell.field.value === option.trim()
//                 }))
//                 .filter((option) => option.label);
//             } else if (
//               cell.field.selectedDropdownOption === "multiSelect" &&
//               cell.field.multiSelectValues
//             ) {
//               options = cell.field.multiSelectValues
//                 .split("\n")
//                 .map((option) => ({
//                   label: option.trim(),
//                   value: option.trim(),
//                   isSelected: false
//                 }))
//                 .filter((option) => option.label);

//               selectedOptionsArray = cell.field.value
//                 ? cell.field.value.split(", ")
//                 : [];
//               selectedValues = selectedOptionsArray.join(", ");
//               options.forEach((option) => {
//                 if (selectedOptionsArray.includes(option.label)) {
//                   option.isSelected = true;
//                 }
//               });
//             }
//           }
//           isDropdownField = cell.field?.dataType === "Dropdown Field";


//           if (cell.field?.dataType === "Text Field") {
//             if (cell.field.selectedTextFieldOption === "textArea") {
//               isTextArea = true;
//               maxLength = 255;
//               charCount = cell.field.value ? cell.field.value.length : 0;
//               placeholderText = `Enter ${cell.field.label} (Up to 255 chars)`;
//             } else if (cell.field.selectedTextFieldOption === "alphaNumeric") {
//               isAlphaNumeric = true;
//               maxLength = parseInt(cell.field.alphaNumericLength || "56");
//               placeholderText = `Enter ${cell.field.label} (Max ${maxLength} chars)`;
//             } else if (cell.field.selectedTextFieldOption === "onlyAlphabets") {
//               isOnlyAlphabets = true;
//               maxLength = parseInt(cell.field.onlyAlphabetsLength || "55");
//               placeholderText = `Enter ${cell.field.label} (Alphabets only, Max ${maxLength} chars)`;
//             } else if (cell.field.selectedTextFieldOption === "richText") {
//               isRichText = true;
//             }
//           }

//           // 👇 ADD THIS RIGHT AFTER
//           isTextField =
//             cell.field?.dataType === "Text Field" &&
//             !isTextArea &&
//             !isAlphaNumeric &&
//             !isOnlyAlphabets &&
//             !isRichText;


//           if (cell.field?.dataType === "Number Field") {
//             switch (cell.field.selectedNumberFieldOption) {
//               case "contactNumber":
//                 isContactNumber = true;
//                 maxLength = parseInt(cell.field.contactNumberDigits || "10");
//                 placeholderText = `Enter ${cell.field.label} (Max ${maxLength} digits)`;
//                 break;
//               case "currency":
//                 isCurrency = true;
//                 decimalPlaces = parseInt(cell.field.decimalValue || "2");
//                 placeholderText = `Enter ${cell.field.label} (Up to ${decimalPlaces} decimals)`;
//                 break;
//               default:
//                 isDefaultNumber = true;
//                 placeholderText = `Enter ${cell.field.label} (Numbers Only)`;
//                 break;
//             }
//           }
//           // ✅ Base Number Field flag (same pattern as FormRender)
// isNumberField = cell.field?.dataType === "Number Field";


//           if (cell.field?.dataType === "Time Field") {
//             isTimeField = true;
//             placeholderText = "Select Time";
//           }

//           if (cell.field?.dataType === "Date Field") {
//             isDateField = true;
//             placeholderText = "Select Date";
//           }

//           if (cell.field?.dataType === "Upload File") {
//             placeholderText = "Upload File";
//           }
//           isUploadField = cell.field?.dataType === "Upload File";
// isCheckboxField = cell.field?.dataType === "Checkbox Field";

//           if (cell.field?.dataType === "Radio Button") {
//             isRadioButton = true;

//             selectedRadioOption = cell.field.value || "";
//             subInputValue = cell.subInputValue || "";

//             console.log("🔘 Processing Radio Button Cell:", cell.id);
//             console.log("📌 Selected Radio Option:", selectedRadioOption);
//             console.log("📌 Sub Input Value:", subInputValue);

//             cell.radioOptionsProcessed = (cell.field.radioOptions || []).map(
//               (option) => {
//                 const isSelected = selectedRadioOption === option.optionLabel;

//                 let processedSubOptions = [];

//                 if (option.usePredefinedOptions) {
//                   const predefined = option.selectedPredefined?.toLowerCase();
//                   if (predefined === "staff") {
//                     processedSubOptions = this.staffOptions.map((opt) => ({
//                       label: opt.label,
//                       isSelected: subInputValue === opt.label
//                     }));
//                   } else if (predefined === "participant") {
//                     processedSubOptions = this.participants.map((p) => ({
//                       label: p.Name,
//                       isSelected: subInputValue === p.Name
//                     }));
//                   } else if (predefined === "facility") {
//                     processedSubOptions = this.facilityOptions.map((opt) => ({
//                       label: opt.label,
//                       isSelected: subInputValue === opt.label
//                     }));
//                   }
//                 } else {
//                   processedSubOptions = (option.values || []).map((val) => ({
//                     label: val,
//                     isSelected: subInputValue === val
//                   }));
//                 }

//                 return {
//                   ...option,
//                   isSelected,
//                   processedSubOptions,
//                   isDropdown: option.subType === "dropdown",
//                   isTextInput: option.subType === "text",
//                   isRadioList: option.subType === "radio",
//                   hasSubInput: option.hasSubInput || false,
//                   subQuestion: option.subQuestion || ""
//                 };
//               }
//             );

//             cell.subRadioName = cell.id + "-subradio";

//             console.log(
//               "✅ Final radioOptionsProcessed:",
//               JSON.stringify(cell.radioOptionsProcessed, null, 2)
//             );
//           }
//           // ✅ HEADER FIELD SUPPORT (MISSING IN V2)
//           if (
//             cell.field?.dataType === "Header" ||
//             cell.field?.type === "header" ||
//             cell.field?.isHeader === true
//           ) {
//             isHeader = true;

//             headerText =
//               cell.field?.text ||
//               cell.field?.label ||
//               "Section Title";

//             headerStyle =
//               cell.field?.inlineStyle ||
//               this.computeHeaderInlineStyle?.({
//                 fontSize: cell.field?.fontSize || "24",
//                 fontWeight: cell.field?.fontWeight || "600",
//                 textAlign: cell.field?.textAlign || "left",
//                 textDecoration: cell.field?.textDecoration || "none",
//                 color: cell.field?.color || "#000000"
//               }) ||
//               `font-size:${cell.field?.fontSize || 24}px;
//               font-weight:${cell.field?.fontWeight || 600};
//               text-align:${cell.field?.textAlign || "left"};
//               text-decoration:${cell.field?.textDecoration || "none"};
//               color:${cell.field?.color || "#000000"};`;
//           }

//           const uploadedFiles = cell.field?.meta?.uploadedFiles || [];

//           const hasUploadedFiles =
//             Array.isArray(uploadedFiles) && uploadedFiles.length > 0;



//           return {
//             ...cell,
//             isVisible: cell.style !== "display: none;",
//             isTextField:
//               cell.field?.dataType === "Text Field" &&
//               !isTextArea &&
//               !isAlphaNumeric &&
//               !isOnlyAlphabets &&
//               !isRichText,
//             isAlphaNumeric,
//             isOnlyAlphabets,
//             isTextArea,
//             isNumberField,
//             isDropdownField,
//             isUploadField,

//             isCurrency,
//             isContactNumber,
//             isDefaultNumber,
//             isTimeField,
//             isDateField,
//             isCheckboxField,
//             floatingLabelStyle,
           
//             isMultiSelect: cell.field?.selectedDropdownOption === "multiSelect",
//             hasComment: cell.field?.comments?.trim() !== "",
//             placeholderText,
//             maxLength,
//             decimalPlaces,
//             isDropdownOpen: false,
//             selectedOptionsArray,
//             selectedValues,
//             charCount,
            
//             isRichText,
//             isRadioButton,
//             selectedRadioOption,
//             subInputValue,
//             isHeader,
//             headerText,
//             headerStyle,
//             hasUploadedFiles,



//             field: {
//               ...cell.field,
//               value: cell.field?.value || "",
//               //subInputValue: cell.field.subInputValue || '',
//               options,
//               isDisabled: cell.field?.isDisabled || false
//             },

//             hasContent: !!(
//             isHeader ||
//             cell.field?.label ||
//             isTextField ||
//             isAlphaNumeric ||
//             isOnlyAlphabets ||
//             isNumberField ||
//             isCurrency ||
//             isContactNumber ||
//             isDefaultNumber ||
//             isTimeField ||
//             isDateField ||
//             isCheckboxField ||
//             isDropdownField ||
//             isUploadField ||
//             isRadioButton ||
//             isTextArea
//           )

//           };
//         });

//         newCells.forEach((cell) => {
//           if (cell?.field?.label) {
//             console.log(
//               `🧪 Field "${cell.field.label}" - isDisabled:`,
//               cell.field.isDisabled
//             );
//           }
//         });

//         return {
//           ...row,
//           cells: newCells,
//           displayStyle: "display: none;" // default (will be updated later)
//         };
//       });

//       // 🪄 Show rows for current page only
//       this.updateVisibleRows();
//       this.isFormSelected = true;
//     }
//   }


async handleFormClick(event) {

  console.log("📂 HANDLEFORMCLCIK CLCICK TRIGEREDDDDDDDDDDDDDD");
  console.log("🧪 Participants loaded:", this.participants.length);
  console.log("🧪 Staff loaded:", this.staffOptions.length);

  const formId = event.currentTarget.dataset.id;

  this.selectedForm = this.forms.find(
    (form) => form.Id === formId
  );

  if (!this.selectedForm) return;

  this.selectedFormType =
    this.selectedForm.Form_Type__c || "Unknown Form Type";

  console.log("🔹 Clicked Form ID:", formId);
  console.log("🔹 Clicked Form Name:", this.selectedForm.Name__c);
  console.log("🔹 Clicked Form Type:", this.selectedFormType);

  const raw = this.selectedForm.Form_JSON__c;

  let allRows = [];

  if (raw) {

    const parsed = JSON.parse(raw);

    if (parsed?.url && parsed?.key) {

      console.log("🌐 Loading form layout from AWS:", parsed.url);

      const awsResp = await fetch(parsed.url);

      if (!awsResp.ok) {
        throw new Error("Failed to load form JSON from AWS");
      }

      allRows = await awsResp.json();

    } else {

      // legacy inline
      allRows = parsed;
    }

    console.log("🔹 Resolved Form JSON rows:", allRows);

    // ======================================================
    // ✅ STORE IMMUTABLE TEMPLATE (NEVER TOUCH AFTER THIS)
    // ======================================================
    this.originalTemplate = structuredClone(allRows);

    // ======================================================
    // 🔄 Build page index map based on "Page Break"
    // ======================================================
    let pageMap = [];
    let currentPage = [];

    allRows.forEach((row, index) => {

      const hasPageBreak = row.cells?.some(
        (cell) =>
          cell.field?.label?.toLowerCase().trim() === "page break"
      );

      if (hasPageBreak) {

        if (currentPage.length > 0) {
          pageMap.push(currentPage);
        }

        currentPage = [];

      } else {

        currentPage.push(index);
      }
    });

    if (currentPage.length > 0) {
      pageMap.push(currentPage);
    }

    this.pageRowIndexMap = pageMap;
    this.totalFormPages = pageMap.length;
    this.currentPageIndex = 0;

    // ======================================================
// 🧠 AUTO-FILL FIRST PAGE (NEW FORM ONLY)
// ======================================================
if (!this.isEditing) {

  const firstPageRows = this.pageRowIndexMap?.[0] || [];

  allRows.forEach((row, rowIndex) => {

    if (!firstPageRows.includes(rowIndex)) return;

    row.cells.forEach((cell) => {

      if (!cell.field?.label) return;

      const label = cell.field.label.trim().toLowerCase();

      if (label === "first name" && this.firstName) {

        cell.field.value = this.firstName;

      } else if (label === "last name" && this.lastName) {

        cell.field.value = this.lastName;

      } else if (
        label === "role" &&
        this.rolesArray?.length > 0
      ) {

        cell.field.value = this.rolesArray.join(", ");

      } else if (
        label === "email id" &&
        this.userEmail
      ) {

        cell.field.value = this.userEmail;

      } else if (label === "facility") {

        const storedFacilityId =
          localStorage.getItem("defaultFacilityId");

        const storedFacilityLabel =
          localStorage.getItem("defaultFacilityLabel");

        console.log("🏥 Prefilling Facility from localStorage:", {
          storedFacilityId,
          storedFacilityLabel
        });
        this.selectedFacilityId = storedFacilityId || null;

        if (storedFacilityId) {

          cell.field.value = storedFacilityId;

        } else if (storedFacilityLabel) {

          cell.field.value = storedFacilityLabel;
        }

      } else if (
        label === "contact number" &&
        this.userContactNum
      ) {

        cell.field.value = this.userContactNum;
      }

    });

  });
}


    // ======================================================
    // 🎨 UI DECORATION (CLONE FIRST!)
    // ======================================================
    const uiRows = structuredClone(allRows);

    // 👉 decorate ONLY UI flags & options — NOT structure
    this.tableRows = this.decorateRowsForUI(uiRows);
    this.pagedRows = this.pageRowIndexMap.map(
  (indices) => indices.map((i) => this.tableRows[i])
);

    // ======================================================
    // 🪄 Show rows for current page only
    // ======================================================
    this.updateVisibleRows();

    this.isFormSelected = true;

    console.log("✅ isFormSelected set to true. UI should render form.");

  }
}


decorateRowsForUI(allRows) {

  console.log("🎨 Decorating rows for UI:", allRows.length);

  return allRows.map((row, rowIndex) => {

    const newCells = row.cells.map((cell) => {

      let options = [];
      let selectedOptionsArray = [];
      let selectedValues = "";

      let isTextArea = false;
      let isTextField = false;
      let isDropdownField = false;
      let isNumberField = false;
      let isUploadField = false;

      let isAlphaNumeric = false;
      let isOnlyAlphabets = false;
      let isCurrency = false;
      let isContactNumber = false;
      let isDefaultNumber = false;

      let isTimeField = false;
      let isDateField = false;
      let isCheckboxField = false;

      let maxLength = null;
      let decimalPlaces = 0;
      let charCount = 0;
      let placeholderText = "";

      let floatingLabelStyle = this.getBorderStyle(
        cell.field?.dataType
      );

      let isRichText = false;
      let isRadioButton = false;
      let selectedRadioOption = "";
      let subInputValue = "";

      let isHeader = false;
      let headerText = null;
      let headerStyle = "";

      const dropdownLabel =
        cell.field?.label?.trim().toLowerCase();

      // =====================================================
      // DROPDOWN
      // =====================================================
      if (cell.field?.dataType === "Dropdown Field") {

        placeholderText = `Select ${cell.field.label}`;

        if (
          dropdownLabel === "facility" &&
          this.facilityOptions.length
        ) {
          options = this.facilityOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
            isSelected: cell.field.value === opt.value
          }));
        }
        else if (
          dropdownLabel.includes("participant") &&
          this.participants.length
        ) {
          options = this.participants.map((p) => ({
            label: p.Name,
            value: p.Id,
            isSelected: cell.field.value === p.Id
          }));
        }
        else if (
          dropdownLabel === "assigned to" &&
          this.staffOptions2.length
        ) {
          options = this.staffOptions2.map((emp) => ({
            label: emp.label,
            value: emp.value,
            isSelected: cell.field.value === emp.value
          }));
        }
        else if (
          cell.field.selectedDropdownOption === "predefinedList"
        ) {

          const type =
            cell.field.predefinedListType?.toLowerCase();

          if (type === "staff") {
            options = this.staffOptions2.map((opt) => ({
              label: opt.label,
              value: opt.value,
              isSelected: cell.field.value === opt.value
            }));
          }

          if (type === "participant") {
            options = this.participants.map((p) => ({
              label: p.Name,
              value: p.Id,
              isSelected: cell.field.value === p.Id
            }));
          }

          if (type === "facility") {
            options = this.facilityOptions.map((opt) => ({
              label: opt.label,
              value: opt.value,
              isSelected: cell.field.value === opt.value
            }));
          }
        }

        else if (
          cell.field.selectedDropdownOption === "singleSelect" &&
          cell.field.singleSelectValues
        ) {
          options = cell.field.singleSelectValues
            .split("\n")
            .map((o) => ({
              label: o.trim(),
              value: o.trim(),
              isSelected: cell.field.value === o.trim()
            }))
            .filter((o) => o.label);
        }

        else if (
          cell.field.selectedDropdownOption === "multiSelect" &&
          cell.field.multiSelectValues
        ) {
          options = cell.field.multiSelectValues
            .split("\n")
            .map((o) => ({
              label: o.trim(),
              value: o.trim(),
              isSelected: false
            }))
            .filter((o) => o.label);

          selectedOptionsArray = cell.field.value
            ? cell.field.value.split(", ")
            : [];

          selectedValues = selectedOptionsArray.join(", ");

          options.forEach((o) => {
            if (selectedOptionsArray.includes(o.label)) {
              o.isSelected = true;
            }
          });
        }
      }

      isDropdownField =
        cell.field?.dataType === "Dropdown Field";

      // =====================================================
      // TEXT
      // =====================================================
      if (cell.field?.dataType === "Text Field") {

        if (
          cell.field.selectedTextFieldOption === "textArea"
        ) {
          isTextArea = true;
          maxLength = 255;
          charCount = cell.field.value?.length || 0;
        }

        if (
          cell.field.selectedTextFieldOption === "alphaNumeric"
        ) {
          isAlphaNumeric = true;
          maxLength = parseInt(
            cell.field.alphaNumericLength || "56"
          );
        }

        if (
          cell.field.selectedTextFieldOption === "onlyAlphabets"
        ) {
          isOnlyAlphabets = true;
          maxLength = parseInt(
            cell.field.onlyAlphabetsLength || "55"
          );
        }

        if (
          cell.field.selectedTextFieldOption === "richText"
        ) {
          isRichText = true;
        }
      }

      isTextField =
        cell.field?.dataType === "Text Field" &&
        !isTextArea &&
        !isAlphaNumeric &&
        !isOnlyAlphabets &&
        !isRichText;

      // =====================================================
      // NUMBER
      // =====================================================
      if (cell.field?.dataType === "Number Field") {

        switch (cell.field.selectedNumberFieldOption) {

          case "contactNumber":
            isContactNumber = true;
            maxLength = parseInt(
              cell.field.contactNumberDigits || "10"
            );
            break;

          case "currency":
            isCurrency = true;
            decimalPlaces = parseInt(
              cell.field.decimalValue || "2"
            );
            break;

          default:
            isDefaultNumber = true;
        }
      }

      isNumberField =
        cell.field?.dataType === "Number Field";

      // =====================================================
      // TIME / DATE
      // =====================================================
      if (cell.field?.dataType === "Time Field") {
        isTimeField = true;
      }

      if (cell.field?.dataType === "Date Field") {
        isDateField = true;
      }

      // =====================================================
// CHECKBOX
// =====================================================
if (cell.field?.dataType === "Checkbox Field") {
  isCheckboxField = true;
}

// =====================================================
// UPLOAD FILE
// =====================================================
if (cell.field?.dataType === "Upload File") {
  isUploadField = true;

  // 🔴 CRITICAL — make sure meta exists
  if (!cell.field.meta) {
    cell.field.meta = {};
  }

  if (!Array.isArray(cell.field.meta.uploadedFiles)) {
    cell.field.meta.uploadedFiles = [];
  }
}




      // =====================================================
      // RADIO
      // =====================================================
     if (cell.field?.dataType === "Radio Button") {

  isRadioButton = true;

  // main selected radio
  selectedRadioOption =
    cell.field?.selectedRadioOption ||
    cell.field?.value ||
    "";

  // 🔥 FIX — sub input must come from FIELD
  subInputValue =
    cell.field?.subInputValue || "";

  cell.radioOptionsProcessed =
    (cell.field.radioOptions || []).map((option) => {

      const isSelected =
        selectedRadioOption === option.optionLabel;

      let processedSubOptions = [];

      if (option.usePredefinedOptions) {

        const predefined =
          option.selectedPredefined?.toLowerCase();

        // ================= STAFF =================
        if (predefined === "staff") {
          processedSubOptions =
            this.staffOptions2.map((o) => ({
              label: o.label,
              value: o.value,
              isSelected:
                subInputValue === o.label ||
                subInputValue === o.value
            }));
        }

        // ================= PARTICIPANT =================
        if (predefined === "participant") {
          processedSubOptions =
            this.participants.map((p) => ({
              label: p.Name,
              value: p.Id,
              isSelected:
                subInputValue === p.Name ||
                subInputValue === p.Id
            }));
        }

        // ================= FACILITY =================
        if (predefined === "facility") {
          processedSubOptions =
            this.facilityOptions.map((o) => ({
              label: o.label,
              value: o.value,
              isSelected:
                subInputValue === o.label ||
                subInputValue === o.value
            }));
        }

      } else {

        // normal static values
        processedSubOptions =
          (option.values || []).map((v) => ({
            label: v,
            value: v,
            isSelected:
              subInputValue === v
          }));
      }

      return {
        ...option,
        isSelected,
        processedSubOptions,

        isDropdown:
          option.subType === "dropdown",

        isTextInput:
          option.subType === "text",

        isRadioList:
          option.subType === "radio",

        hasSubInput:
          option.hasSubInput || false,

        subQuestion:
          option.subQuestion || ""
      };
    });

  cell.subRadioName =
    cell.id + "-subradio";
}


      // =====================================================
      // HEADER
      // =====================================================
      if (
        cell.field?.dataType === "Header" ||
        cell.field?.isHeader
      ) {

        isHeader = true;

        headerText =
          cell.field.text ||
          cell.field.label;

        headerStyle =
          cell.field.inlineStyle ||
          "";
      }

      const uploadedFiles =
  cell.field?.meta?.uploadedFiles ||
  cell.field?.value ||
  [];

const hasUploadedFiles =
  Array.isArray(uploadedFiles) &&
  uploadedFiles.length > 0;


      

      return {

        ...cell,

        isVisible: true,

        isTextField,
        isAlphaNumeric,
        isOnlyAlphabets,
        isTextArea,

        isNumberField,
        isDropdownField,
        isUploadField,

        isCurrency,
        isContactNumber,
        isDefaultNumber,

        isTimeField,
        isDateField,
        isCheckboxField,

        floatingLabelStyle,

        isMultiSelect:
          cell.field?.selectedDropdownOption ===
          "multiSelect",

        placeholderText,

        maxLength,
        decimalPlaces,

        selectedOptionsArray,
        selectedValues,
        charCount,

        isRichText,
        isRadioButton,
        selectedRadioOption,
        subInputValue,

        isHeader,
        headerText,
        headerStyle,

        hasUploadedFiles,

        field: {
          ...cell.field,
          value:
    cell.field?.dataType === "Checkbox Field"
      ? Boolean(cell.field.value)
      : cell.field?.dataType === "Upload File"
        ? cell.field.value || []
        : cell.field?.value || "",

          options
        },

        hasContent: !!(
          isHeader ||
          cell.field?.label ||
          isTextField ||
          isAlphaNumeric ||
          isOnlyAlphabets ||
          isNumberField ||
          isCurrency ||
          isContactNumber ||
          isDefaultNumber ||
          isTimeField ||
          isDateField ||
          isCheckboxField ||
          isDropdownField ||
          isUploadField ||
          isRadioButton ||
          isTextArea
        )
      };
    });

    return {
      ...row,
      cells: newCells,
      displayStyle: ""
    };
  });
}



buildPageMapFromRows(rows) {
  let pageMap = [];
  let currentPage = [];

  rows.forEach((row, index) => {
    const hasPageBreak = row.cells?.some(
      (cell) =>
        cell.field?.label?.toLowerCase().trim() === "page break"
    );

    if (hasPageBreak) {
      if (currentPage.length > 0) {
        pageMap.push(currentPage);
      }
      currentPage = [];
    } else {
      currentPage.push(index);
    }
  });

  if (currentPage.length > 0) {
    pageMap.push(currentPage);
  }

  return pageMap;
}


  getBorderStyle(dataType) {
    return ["Checkbox Field", "Radio Button", "Header"].includes(dataType)
      ? "border: 1px solid transparent;"
      : "border: 1px solid black;";
  }

  updateVisibleRows() {
    if (!this.pageRowIndexMap || !this.tableRows) return;

    const currentVisibleRows = new Set(
      this.pageRowIndexMap[this.currentPageIndex]
    );

    this.tableRows = this.tableRows.map((row, index) => {
      return {
        ...row,
        displayStyle: currentVisibleRows.has(index) ? "" : "display: none;"
      };
    });
  }

  paginationHelper() {
    if (this.totalRecords === 0) {
      this.noRecordsFlag = true;
      return;
    }

    this.noRecordsFlag = false;
    this.recordsToDisplay = [];

    // Use filtered list for pagination
    const sourceList = this.filteredStaffList || [];

    // Recalculate total pages
    this.totalPages = Math.ceil(sourceList.length / this.pageSize);

    // Adjust page number
    if (this.pageNumber < 1) {
      this.pageNumber = 1;
    } else if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }

    // Slice filtered list
    let startIndex = (this.pageNumber - 1) * this.pageSize;
    let endIndex = this.pageNumber * this.pageSize;
    this.recordsToDisplay = sourceList.slice(startIndex, endIndex);

    // Update navigation controls
    this.bDisableFirst = this.pageNumber === 1;
    this.bDisableLast = this.pageNumber === this.totalPages;
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.paginationHelper();
    }
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.paginationHelper();
    }
  }

  firstPage() {
    this.pageNumber = 1;
    this.paginationHelper();
  }

  lastPage() {
    this.pageNumber = this.totalPages;
    this.paginationHelper();
  }
  @track selectedFormId = null;
  @track searchQuery = "";
  @track filteredAvailableForms = [];

  handleGrantAccessClick(event) {
    this.selectedStaffId = event.target.dataset.id;

    const staff = this.staffList.find((s) => s.Id === this.selectedStaffId);
    this.selectedStaffName = staff
      ? `${staff.firstName || ""} ${staff.lastName || ""}`.trim()
      : "Unknown";

    console.log("🔹 Opening Grant Access for Staff:", this.selectedStaffName);

    // Reset state
    this.selectedFormId = null;
    this.availableForms = [];
    this.filteredAvailableForms = [];
    this.searchQuery = "";

    getAvailableForms()
      .then((data) => {
        console.log(
          "🔍 getAvailableForms() returned:",
          data.map(
            (f) => `${f.Name__c} (${f.Id}) - Default: ${f.DefaultIncident__c}`
          )
        );

        return getAccessibleForms({ staffId: this.selectedStaffId }).then(
          (grantedForms) => {
            console.log(
              "🔹 Previously Granted Forms:",
              grantedForms.map((f) => `${f.Name__c} (${f.Id})`)
            );

            // 🔍 Find the default incident register form from available forms
            const defaultForm = data.find(
              (f) =>
                f.Name__c?.trim() === "Default Incident Register" &&
                f.DefaultIncident__c === true
            );

            console.log(
              "🔍 Found Default Form:",
              defaultForm
                ? `${defaultForm.Name__c} (${defaultForm.Id})`
                : "❌ NOT FOUND"
            );

            // ✅ Set selectedFormId based on granted or default
            if (grantedForms.length > 0) {
              this.selectedFormId = grantedForms[0].Id;
              console.log(
                "✅ Selected First Granted Form:",
                this.selectedFormId
              );
            } else if (defaultForm) {
              this.selectedFormId = defaultForm.Id;
              console.log("✅ Selected Default Form:", this.selectedFormId);
            } else {
              console.warn(
                "⚠️ No granted form or default form found. Nothing pre-selected."
              );
            }

            // Map availableForms and mark selection
            this.availableForms = data.map((form) => ({
              ...form,
              isSelected: form.Id === this.selectedFormId
            }));

            this.filteredAvailableForms = [...this.availableForms];

            console.log("✅ Final Pre-selected Form ID:", this.selectedFormId);
            console.log("📋 Available Forms:", this.availableForms);

            this.isGrantAccessPopupOpen = true;
          }
        );
      })
      .catch((error) => {
        console.error("❌ Error fetching available or granted forms:", error);
      });
  }

  handleFormSearch(event) {
    this.searchQuery = event.target.value.toLowerCase();

    if (!this.searchQuery) {
      this.filteredAvailableForms = [...this.availableForms];
      return;
    }

    this.filteredAvailableForms = this.availableForms.filter((form) =>
      form.Name__c?.toLowerCase().includes(this.searchQuery)
    );
  }

  // ✅ Getter method to check if a form is selected
  isFormSelected(formId) {
    return this.selectedForms.has(formId);
  }

  handleFormSelection(event) {
    const selectedId = event.target.dataset.id;
    this.selectedFormId = selectedId;

    this.availableForms = this.availableForms.map((form) => ({
      ...form,
      isSelected: form.Id === selectedId
    }));

    console.log("🔹 Selected Form ID:", this.selectedFormId);
  }

  grantAccess() {
    console.log("🔹 Initiating Grant Access...");

    if (!this.selectedFormId) {
      this.showToast("Error", "Please select a form to grant access.", "error");
      return;
    }

    const selectedForm = this.availableForms.find(
      (f) => f.Id === this.selectedFormId
    );
    const isDefault =
      selectedForm?.Name__c === "Default Incident Register" &&
      selectedForm?.Default__c;

    if (this.isBulkGrantMode) {
      const staffIds = Array.from(this.selectedStaffIds || []);
      if (staffIds.length === 0) {
        this.showToast("Error", "No staff selected for bulk grant.", "error");
        return;
      }

      console.log("🔹 Bulk Grant: Staff IDs:", staffIds);
      console.log("🔹 Form ID:", this.selectedFormId);

      grantAccessToStaff({
        staffIds: staffIds,
        selectedFormIds: [this.selectedFormId]
      })
        .then(() => {
          this.showToast(
            "Success",
            "Access granted to selected staff!",
            "success"
          );
          this.closeGrantAccessPopup();
          this.loadStaffList();
        })
        .catch((error) => {
          console.error("❌ Error in bulk grant:", JSON.stringify(error));
          this.showToast("Error", "Failed to grant access in bulk.", "error");
        });

      return;
    }

    // 🔹 Single staff logic (unchanged)
    console.log("🔹 Selected Form ID:", this.selectedFormId);
    console.log("🔹 Staff ID:", this.selectedStaffId);

    if (isDefault) {
      clearGrantedForms({ staffId: this.selectedStaffId })
        .then(() => {
          console.log("✅ Cleared previously granted forms from backend.");
          this.showToast(
            "Success",
            "Access reverted to default Incident Register only.",
            "success"
          );
          this.closeGrantAccessPopup();

          return getAccessibleForms({ staffId: this.selectedStaffId });
        })
        .then((formRecords) => {
          this.forms = formRecords || [];
          this.filteredForms = formRecords || [];
        })
        .catch((error) => {
          console.error(
            "❌ Error reverting to default form:",
            JSON.stringify(error)
          );
          this.showToast(
            "Error",
            "Failed to revert to default Incident Register.",
            "error"
          );
        });

      return;
    }

    grantAccessToStaff({
      staffIds: [this.selectedStaffId],
      selectedFormIds: [this.selectedFormId]
    })
      .then(() => {
        this.showToast("Success", "Access granted successfully!", "success");
        this.closeGrantAccessPopup();

        return getAccessibleForms({ staffId: this.selectedStaffId });
      })
      .then((formRecords) => {
        this.forms = formRecords || [];
        this.filteredForms = formRecords || [];
      })
      .catch((error) => {
        console.error("❌ Error granting access:", JSON.stringify(error));
        this.showToast("Error", "Failed to grant access.", "error");
      });
  }

  closeGrantAccessPopup() {
    this.isGrantAccessPopupOpen = false;
    this.selectedForms.clear();
  }

// async handleView(event) {

//   // ⛔ Prevent double clicks while loading
//   if (this.isLoading) {
//     console.warn("⏳ View already loading — skipping");
//     return;
//   }

//   this.isLoading = true;

//   this.isViewMode = true;
//   this.selectedResponseId = event.currentTarget.dataset.id;

//   const response = this.formResponses.find(
//     (resp) => resp.Id === this.selectedResponseId
//   );

//   if (!response) {
//     console.warn(
//       "⚠️ Form response not found for ID:",
//       this.selectedResponseId
//     );
//     this.isLoading = false;
//     return;
//   }

//   try {
//     // ==============================
//     // ✅ Store selected response
//     // ==============================
//     this.selectedForm = response;

//     console.log(
//       "📄 Selected Response for View/PDF:",
//       JSON.stringify(this.selectedForm, null, 2)
//     );

//     this.formattedSubmissionDate = new Date(
//       response.CreatedDate
//     ).toLocaleDateString("en-GB");

//     // ==============================
//     // 🔥 Resolve AWS vs inline JSON
//     // ==============================
//     const raw = response.Response_JSON__c;

//     let formJson = [];

//     if (raw) {
//       const parsed = JSON.parse(raw);

//       if (parsed?.url && parsed?.key) {
//         console.log("🌐 Loading response JSON from AWS:", parsed.url);

//         const awsResp = await fetch(parsed.url);

//         if (!awsResp.ok) {
//           throw new Error("Failed to fetch response JSON from AWS");
//         }

//         formJson = await awsResp.json();
//       } else {
//         // legacy inline JSON
//         formJson = parsed;
//       }
//     }

//     console.log("📄 Resolved response JSON:", formJson);

//     // ==============================
//     // ✅ Build view table
//     // ==============================
//     this.prepareViewTable(formJson);

//     // ==============================
//     // ✅ Mark dropdown selections
//     // ==============================
//     this.tableRows = formJson.map((row) => ({
//       ...row,
//       cells: row.cells.map((cell) => {

//         if (cell.isDropdownField && cell.isMultiSelect) {
//           const selectedOptionsArray = cell.field.value
//             ? cell.field.value.split(", ")
//             : [];

//           cell.field.options.forEach((option) => {
//             option.isSelected =
//               selectedOptionsArray.includes(option.label);
//           });

//           cell.selectedValues = cell.field.value;
//         }

//         return cell;
//       })
//     }));

//   } catch (err) {

//     console.error("❌ Failed loading form for view:", err);

//     this.showToast(
//       "Error",
//       "Failed to load submitted form.",
//       "error"
//     );

//   } finally {

//     // 🛑 ALWAYS stop spinner
//     this.isLoading = false;
//   }
// }

async handleView(event) {

  // ⛔ Prevent double clicks while loading
  if (this.isLoading) {
    console.warn("⏳ View already loading — skipping");
    return;
  }

  this.isLoading = true;

  this.isViewMode = true;
  this.isEditing = false;
  this.isFormSelected = false;

  this.selectedResponseId =
    event.currentTarget.dataset.id;

  const response = this.formResponses.find(
    (resp) => resp.Id === this.selectedResponseId
  );

  if (!response) {
    console.warn(
      "⚠️ Form response not found for ID:",
      this.selectedResponseId
    );
    this.isLoading = false;
    return;
  }

  console.log(
    "📄 Full response object:",
    JSON.stringify(response, null, 2)
  );

  // ==============================
  // ✅ Store response only (NOT FORM)
  // ==============================
  this.selectedForm = response;

  this.formattedSubmissionDate =
    new Date(response.CreatedDate)
      .toLocaleDateString("en-GB");

  try {

    // ====================================
    // 🔥 Load RESPONSE JSON
    // ====================================
    let responseRows = [];

    const raw = response.Response_JSON__c;

    if (raw) {

      const parsed = JSON.parse(raw);

      if (parsed?.url && parsed?.key) {

        console.log(
          "🌐 Loading response JSON from AWS:",
          parsed.url
        );

        const awsResp = await fetch(parsed.url);

        if (!awsResp.ok) {
          throw new Error(
            "Failed to fetch response JSON from AWS"
          );
        }

        responseRows = await awsResp.json();

      } else {

        responseRows = parsed;
      }
    }

    console.log(
      "📄 Resolved response JSON:",
      responseRows
    );

    // ====================================
// 🎨 Decorate response rows for VIEW
// ====================================
const uiRows = structuredClone(responseRows);

this.tableRows = this.decorateRowsForUI(uiRows);

// =======================================
// 🔄 Resolve dropdown labels
// =======================================
this.tableRows.forEach(row => {
  row.cells.forEach(cell => {

    if (
      cell.field?.dataType === "Dropdown Field" &&
      Array.isArray(cell.field.options)
    ) {

      const selected = cell.field.options.filter(
        o =>
          o.isSelected ||
          o.value === cell.field.value ||
          o.label === cell.field.value
      );

      if (selected.length) {

        cell.selectedValues =
          selected.map(o => o.label).join(", ");

        cell.field.selectedLabel =
          selected[0].label;
      }
    }
  });
});

// ====================================
// 🧾 BUILD READ-ONLY VIEW
// ====================================
this.prepareViewTable(this.tableRows);


    console.log("✅ VIEW MODE READY");

  } catch (err) {

    console.error(
      "❌ Failed loading form for view:",
      err
    );

    this.showToast(
      "Error",
      "Failed to load submitted form.",
      "error"
    );

  } finally {

    // 🛑 ALWAYS stop spinner
    this.isLoading = false;
  }
}





  closeView() {
    this.isViewMode = false;
    this.isFormSelected = false;
  }

  // loadFormData(formJson, isViewMode) {
  //     this.tableRows = formJson.map(row => ({
  //         ...row,
  //         cells: row.cells.map(cell => ({
  //             ...cell,
  //             isVisible: cell.style !== 'display: none;',
  //             field: { ...cell.field, value: cell.field?.value || '' },
  //             hasContent: !!(cell.field?.label || cell.field?.value),
  //             readonlyValue: this.computeReadonlyValue(cell, isViewMode)
  //         }))
  //     }));
  // }

  loadFormData(formJson, isViewMode) {
    const processedRows = formJson.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        const field = { ...cell.field, value: cell.field?.value || "" };
        const dataType = field.dataType;
        const label = field.label?.toLowerCase().trim() || "";
        const isVisible = cell.style !== "display: none;";
        const hasContent = !!(field.label || field.value);

        let selectedRadioOption = "";
        let subInputValue = "";
        let radioOptionsProcessed = [];
        let options = [];

        // ✅ Handle Radio Button: restore selected option and sub input
        if (dataType === "Radio Button") {
          selectedRadioOption = field.value || "";
          subInputValue = cell.subInputValue || field.subInputValue || "";

          radioOptionsProcessed = (field.radioOptions || []).map((option) => {
            const isSelected = selectedRadioOption === option.optionLabel;
            let processedSubOptions = [];

            if (option.usePredefinedOptions) {
              const type = option.selectedPredefined?.toLowerCase();
              if (type === "staff" && this.staffOptions2?.length) {
                processedSubOptions = this.staffOptions2.map((opt) => ({
                  label: opt.label,
                  isSelected: subInputValue === opt.label
                }));
              } else if (type === "participant" && this.participants?.length) {
                processedSubOptions = this.participants.map((p) => ({
                  label: p.Name,
                  isSelected: subInputValue === p.Name
                }));
              } else if (type === "facility" && this.facilityOptions?.length) {
                processedSubOptions = this.facilityOptions.map((opt) => ({
                  label: opt.label,
                  isSelected: subInputValue === opt.label
                }));
              }
            } else {
              processedSubOptions = (option.values || []).map((val) => ({
                label: val,
                isSelected: subInputValue === val
              }));
            }

            return {
              ...option,
              isSelected,
              processedSubOptions,
              isDropdown: option.subType === "dropdown",
              isTextInput: option.subType === "text",
              isRadioList: option.subType === "radio",
              hasSubInput: option.hasSubInput || false,
              subQuestion: option.subQuestion || ""
            };
          });

          cell.subRadioName = cell.id + "-subradio"; // unique group name
        }
        if (
          dataType === "Dropdown Field" &&
          field.selectedDropdownOption === "singleSelect"
        ) {
          const rawOptions =
            field.singleSelectValues
              ?.split("\n")
              .map((opt) => opt.trim())
              .filter(Boolean) || [];

          options = rawOptions.map((opt) => ({
            label: opt,
            value: opt,
            isSelected: field.value === opt
          }));

          field.options = options; // ✅ Inject processed options back into field
        }

        return {
          ...cell,
          isVisible,
          hasContent,
          field,
          readonlyValue: this.computeReadonlyValue(cell, isViewMode),
          selectedRadioOption,
          subInputValue,
          isRadioButton: dataType === "Radio Button",
          radioOptionsProcessed
        };
      })
    }));

    this.tableRows = processedRows;
    this.pagedRows[this.currentPageIndex] = processedRows;
  }
  computeReadonlyValue(cell, isViewMode) {
    if (!isViewMode || !cell.field) return "-";

    if (
      cell.isTextField ||
      cell.isTextArea ||
      cell.isAlphaNumeric ||
      cell.isOnlyAlphabets ||
      cell.isNumberField ||
      cell.isTimeField ||
      cell.isDateField
    ) {
      return cell.field.value || "-";
    }

    if (cell.isCheckboxField) {
      return cell.field.value ? "utility:check" : "utility:close";
    }

    if (cell.isDropdownField) {
      return cell.selectedValues || cell.field.value || "-";
    }

    if (cell.isRadioButton) {
      const selectedOption =
        cell.selectedRadioOption || cell.field?.value || "";
      const subValue = cell.subInputValue || cell.field?.subInputValue || "";

      if (!subValue && Array.isArray(cell.radioOptionsProcessed)) {
        const matched = cell.radioOptionsProcessed.find(
          (opt) => opt.isSelected
        );
        if (matched?.processedSubOptions?.length > 0) {
          const selectedSub = matched.processedSubOptions.find(
            (sub) => sub.isSelected
          );
          if (selectedSub) {
            return `${selectedOption} - ${selectedSub.label}`;
          }
        }
      }

      return subValue
        ? `${selectedOption} - ${subValue}`
        : selectedOption || "-";
    }

    return cell.field.value || "-";
  }

  // prepareViewTable(formJson) {
  //   let tableData = [];
  //   let pageNumber = 1;
  //   let currentPageRows = [];

  //   const hasAnyPageBreak = formJson.some((row) =>
  //     row.cells?.some(
  //       (cell) => cell.field?.label?.toLowerCase().trim() === "page break"
  //     )
  //   );

  //   formJson.forEach((row) => {
  //     const isPageBreak = row.cells?.some(
  //       (cell) => cell.field?.label?.toLowerCase().trim() === "page break"
  //     );

  //     if (isPageBreak) {
  //       // Push previous page data first
  //       if (currentPageRows.length > 0) {
  //         tableData.push({
  //           key: "page-" + pageNumber,
  //           isPageBreak: true,
  //           pageNumber,
  //           isOpen: true, // ✅ Keep open
  //           arrow: "▼",
  //           isVisible: true
  //         });

  //         tableData.push(...currentPageRows);
  //         currentPageRows = [];
  //         pageNumber++;
  //       } else {
  //         // Just page header
  //         tableData.push({
  //           key: "page-" + pageNumber,
  //           isPageBreak: true,
  //           pageNumber,
  //           isOpen: true,
  //           arrow: "▼",
  //           isVisible: true
  //         });
  //         pageNumber++;
  //       }
  //     } else {
  //       const validCells = row.cells.filter(
  //         (cell) =>
  //           cell.isVisible &&
  //           cell.field &&
  //           cell.field.label &&
  //           cell.field.label.trim() !== ""
  //       );

  //       validCells.forEach((cell) => {
  //         const isUploadFile = cell.field.dataType === "Upload File";
  //         const isRichText =
  //           cell.field.dataType === "Text Field" &&
  //           cell.field.selectedTextFieldOption === "richText";
  //         const previewUrl = cell.field.value;
  //         const downloadUrl = cell.field.downloadLink;
  //         const isImage =
  //           previewUrl &&
  //           (/\.(jpg|jpeg|png|gif)$/i.test(previewUrl) ||
  //             previewUrl.includes("rendition=ORIGINAL_JPG"));

  //         currentPageRows.push({
  //           ...cell,
  //           key: cell.id || Date.now() + Math.random(),
  //           isPageBreak: false,
  //           pageNumber,
  //           isVisible: true, // ✅ Always visible initially
  //           label: cell.field.label,
  //           value: this.getFormattedValue(cell),
  //           isCheckbox: cell.isCheckboxField,
  //           isUploadFile: isUploadFile,
  //           uploadUrl: previewUrl,
  //           isImageFile: isImage,
  //           downloadUrl: downloadUrl,
  //           finalDownloadUrl: downloadUrl || previewUrl,
  //           isRichText: isRichText,
  //           isRadioButton: cell.field.dataType === "Radio Button",
  //           isRegularField:
  //             !isUploadFile &&
  //             !cell.isCheckboxField &&
  //             !isRichText &&
  //             !cell.isRadioButton
  //         });
  //       });
  //     }
  //   });

  //   // Push the final page if anything is left
  //   if (currentPageRows.length > 0) {
  //     tableData.push({
  //       key: "page-" + pageNumber,
  //       isPageBreak: true,
  //       pageNumber,
  //       isOpen: true,
  //       arrow: "▼",
  //       isVisible: true
  //     });

  //     tableData.push(...currentPageRows);
  //   }

  //   this.viewTableData = tableData;
  // }

prepareViewTable(rows) {

  let tableData = [];
  let pageNumber = 1;
  let currentPageRows = [];

  rows.forEach((row) => {

    const isPageBreak = row.cells?.some(
      (cell) =>
        cell.field?.label?.toLowerCase().trim() === "page break"
    );

    // =============================
    // PAGE BREAK HANDLING
    // =============================
    if (isPageBreak) {

      tableData.push({
        key: "page-" + pageNumber,
        isPageBreak: true,
        pageNumber,
        isOpen: true,
        arrow: "▼",
        isVisible: true
      });

      tableData.push(...currentPageRows);
      currentPageRows = [];
      pageNumber++;

      return;
    }

    // =============================
    // NORMAL ROW PROCESSING
    // =============================
    row.cells.forEach((cell) => {

      // =============================
      // HEADER SUPPORT
      // =============================
     if (cell?.field && this.viewIsHeaderCell(cell)) {

  const title = this.viewNormalizeHeaderTitle(cell);

  const headerStyle =
    cell.field?.inlineStyle || "";

  if (title) {

    currentPageRows.push({

      ...cell,

      key: cell.id || Date.now() + Math.random(),
      isPageBreak: false,
      pageNumber,
      isVisible: true,

      // 🔥 HEADER DATA
      isSectionHeader: true,
title,

      headerStyle,

      // do NOT treat as field
      label: null,
      value: null,

      field: cell.field,

      isRegularField: false
    });
  }

  return;
}


      // =============================
      // SKIP EMPTY CELLS
      // =============================
      if (
        !cell?.field ||
        !cell.field.label ||
        !cell.field.label.trim()
      ) {
        return;
      }

      // =============================
      // FIELD TYPES
      // =============================

      const isRichText =
        cell.field.dataType === "Text Field" &&
        cell.field.selectedTextFieldOption === "richText";

      const isUploadFile =
        cell.field.dataType === "Upload File";

      // =============================
      // FILE UPLOAD HANDLING
      // =============================

      let uploadedFiles =
        cell.field?.meta?.uploadedFiles || [];

      let previewUrls = [];

      if (Array.isArray(uploadedFiles)) {
        previewUrls = uploadedFiles
          .map(f => f.url)
          .filter(Boolean);
      }

      // fallback if legacy
      if (
        previewUrls.length === 0 &&
        Array.isArray(cell.field.value)
      ) {
        previewUrls = cell.field.value;
      }

      const imageRegex = /\.(jpg|jpeg|png|gif)$/i;

      const imageFiles = previewUrls.filter(
        url =>
          typeof url === "string" &&
          (imageRegex.test(url) ||
          url.includes("rendition=ORIGINAL_JPG"))
      );


      // =============================
      // 🎯 RADIO DISPLAY FIX (NEW)
      // =============================

      let formattedValue = this.getFormattedValue(cell);

      if (cell.field?.dataType === "Radio Button") {

        const selected =
          cell.field.selectedRadioOption ||
          cell.field.value;

        const sub =
          cell.field.subInputValue;

        const opt =
          cell.field.radioOptions?.find(
            o => o.optionLabel === selected
          );

        if (opt && opt.hasSubInput && sub) {

          formattedValue =
  `${selected} (${opt.subQuestion}: ${sub})`;


        } else {

          formattedValue = selected || "";
        }
      }

      // =============================
      // PUSH NORMAL ROW
      // =============================

      currentPageRows.push({

        ...cell,

        key: cell.id || Date.now() + Math.random(),
        isPageBreak: false,
        pageNumber,
        isVisible: true,

        label: cell.field.label,

        // ✅ formatted for UI / PDF
        value: formattedValue,

        // 🔥 RAW for PDF checkbox logic
        rawValue: cell.field?.value,

        // flags
        isCheckbox:
          cell.field?.dataType === "Checkbox Field",

        isUploadFile,

        isDropdownField: cell.isDropdownField,
        selectedValues: cell.selectedValues,

        field: cell.field,

        uploadedFiles,
        previewUrls,
        imageFiles,

        isRichText,

        isRadioButton:
          cell.field.dataType === "Radio Button",

        isRegularField:
          !isUploadFile &&
          cell.field.dataType !== "Checkbox Field" &&
          !isRichText &&
          !cell.isRadioButton
      });

    });

  });

  // =============================
  // PUSH FINAL PAGE
  // =============================
  if (currentPageRows.length > 0) {

    tableData.push({
      key: "page-" + pageNumber,
      isPageBreak: true,
      pageNumber,
      isOpen: true,
      arrow: "▼",
      isVisible: true
    });

    tableData.push(...currentPageRows);
  }

  this.viewTableData = tableData;
}



viewIsHeaderCell(cell) {

  const type =
    (cell?.field?.dataType || "")
      .toLowerCase()
      .trim();

  return (

    // primary indicators
    type === "header" ||
    type === "section header" ||
    cell?.field?.isHeader === true ||
    cell?.isHeader === true
  );
}



viewNormalizeHeaderTitle(cell) {
  const candidates = [
    cell?.headerText,
    cell?.field?.text,
    cell?.field?.label,
    cell?.field?.value
  ];

  for (const c of candidates) {
    const t = this.viewAsText(c);
    if (t) return t;
  }

  return "";
}

viewAsText(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").trim();
}


  togglePageSection(event) {
    const selectedPage = parseInt(event.currentTarget.dataset.page, 10);
    let isNowOpen = true;

    // First, find the new state of the page (open/close)
    this.viewTableData = this.viewTableData.map((item) => {
      if (item.isPageBreak && item.pageNumber === selectedPage) {
        isNowOpen = !item.isOpen;
        return { ...item, isOpen: isNowOpen, arrow: isNowOpen ? "▼" : "▶" };
      }
      return item;
    });

    // Then, update visibility of child rows based on new state
    this.viewTableData = this.viewTableData.map((item) => {
      if (!item.isPageBreak && item.pageNumber === selectedPage) {
        return { ...item, isVisible: isNowOpen };
      }
      return item;
    });
  }

  removeSelectedOption(event) {
    const cellId = event.target.dataset.id;
    const optionValue = event.target.dataset.value;

    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (cell.id === cellId) {
          let updatedOptions = cell.field.options.map((option) => ({
            ...option,
            isSelected: option.label === optionValue ? false : option.isSelected
          }));

          let selectedValues = updatedOptions
            .filter((option) => option.isSelected)
            .map((option) => option.label)
            .join(", ");

          return {
            ...cell,
            selectedValues: selectedValues,
            field: {
              ...cell.field,
              options: updatedOptions,
              value: selectedValues
            }
          };
        }
        return cell;
      })
    }));
  }

  getFormattedValue(cell) {
    if (cell.isCheckboxField) {
      return cell.field.value ? "action:approval" : "action:close";
    }

    if (cell.isDropdownField && cell.isMultiSelect) {
      return cell.selectedValues || "—"; // ✅ Show selected multi-select values
    }

    if (cell.isDropdownField) {
      // Prefer stored label (new logic)
      if (cell.field.selectedLabel) {
        return cell.field.selectedLabel;
      }

      // Fallback: resolve from options if present
      if (cell.field.options?.length && cell.field.value) {
        const match = cell.field.options.find(
          (o) => o.value === cell.field.value
        );
        if (match) return match.label;
      }

      // Final fallback
      return cell.field.value || "—";
    }


    if (cell.field?.dataType === "Upload File") {
      return cell.field.value || "No File";
    }

    if (
      cell.field?.dataType === "Text Field" &&
      cell.field?.selectedTextFieldOption === "richText"
    ) {
      return cell.field.value || "<span>No Rich Text</span>";
    }

    // ✅ Handle Radio Button with Sub Input
    if (cell.isRadioButton || cell.field?.dataType === "Radio Button") {
      const selectedOption =
        cell.selectedRadioOption || cell.field?.value || "";
      const subValue = cell.subInputValue || "";

      if (!subValue && Array.isArray(cell.radioOptionsProcessed)) {
        const matched = cell.radioOptionsProcessed.find(
          (opt) => opt.isSelected
        );
        if (matched?.processedSubOptions?.length > 0) {
          const selectedSub = matched.processedSubOptions.find(
            (sub) => sub.isSelected
          );
          if (selectedSub) {
            return `${selectedOption} - ${selectedSub.label}`;
          }
        }
      }

      return subValue
        ? `${selectedOption} - ${subValue}`
        : selectedOption || "—";
    }

    return cell.field.value ? cell.field.value : "—"; // Default to dash if empty
  }

  triggerFileInput(event) {
    const cellId = event.target.dataset.id;
    const inputEl = this.template.querySelector(
      `input[data-cell-id="${cellId}"]`
    );
    if (inputEl) {
      inputEl.click();
    } else {
      console.warn("⚠️ File input not found for cell:", cellId);
    }
  }


  mergeResponseIntoTemplate(template, response) {

  template.forEach((row, rIdx) => {

    row.cells.forEach((cell, cIdx) => {

      const respCell = response[rIdx]?.cells[cIdx];

      if (!cell.field || !respCell?.field) return;

      // copy only answer data
      cell.field.value = respCell.field.value ?? null;

      if (respCell.field.selectedLabel)
        cell.field.selectedLabel =
          respCell.field.selectedLabel;

      if (respCell.field.selectedValues)
        cell.field.selectedValues =
          respCell.field.selectedValues;

      if (respCell.field.subInputValue)
        cell.field.subInputValue =
          respCell.field.subInputValue;

      if (respCell.field.meta?.uploadedFiles) {
        cell.field.meta = {
          uploadedFiles:
            respCell.field.meta.uploadedFiles
        };
      }

    });

  });
}





// async handleEdit(event) {

//   this.isEditing = true;
//   this.selectedResponseId = event.currentTarget.dataset.id;

//   const response = this.formResponses.find(
//     (resp) => resp.Id === this.selectedResponseId
//   );

//   if (!response) {
//     console.error("❌ Response not found.");
//     return;
//   }

//   console.log("🧪 Full response object:", JSON.stringify(response, null, 2));

//   // ====================================
//   // 🔎 Resolve parent FORM
//   // ====================================
//   this.selectedForm = this.forms.find(
//     (f) => f.Id === response.Incident_Form__c
//   );

//   if (!this.selectedForm) {
//     console.error(
//       "❌ Could not resolve form for response:",
//       response.Incident_Form__c
//     );
//     return;
//   }

//   console.log("🧪 Resolved form:", this.selectedForm);

//   try {

//     // ====================================
//     // 🔥 Load RESPONSE JSON
//     // ====================================
//     let responseRows = [];

//     const raw = response.Response_JSON__c;

//     if (raw) {

//       const parsed = JSON.parse(raw);

//       if (parsed?.url && parsed?.key) {

//         console.log("🌐 Loading response JSON from AWS:", parsed.url);

//         const awsResp = await fetch(parsed.url);

//         if (!awsResp.ok) {
//           throw new Error("Failed to load response JSON from AWS");
//         }

//         responseRows = await awsResp.json();

//       } else {
//         responseRows = parsed;
//       }
//     }

//     // ====================================
//     // 📄 Load TEMPLATE JSON
//     // ====================================
//     let templateRows = [];

//     const templateRaw = this.selectedForm.Form_JSON__c;

//     if (templateRaw) {

//       const parsedTemplate = JSON.parse(templateRaw);

//       if (parsedTemplate?.url && parsedTemplate?.key) {

//         console.log(
//           "🌐 Loading template JSON from AWS:",
//           parsedTemplate.url
//         );

//         const awsTemplateResp = await fetch(parsedTemplate.url);

//         if (!awsTemplateResp.ok) {
//           throw new Error("Failed to load template JSON from AWS");
//         }

//         templateRows = await awsTemplateResp.json();

//       } else {
//         templateRows = parsedTemplate;
//       }
//     }

//     // ====================================
//     // 🔀 Merge RESPONSE → TEMPLATE
//     // ====================================
//     this.mergeResponseIntoTemplate(
//       templateRows,
//       responseRows
//     );

//     console.log(
//       "🧪 Template after merge:",
//       JSON.stringify(templateRows, null, 2)
//     );

//     // ====================================
//     // 🧠 Store immutable merged template
//     // ====================================
//     this.originalTemplate = structuredClone(templateRows);

//     // ====================================
//     // 🔄 Build PAGE MAP (ONCE)
//     // ====================================
//     let pageMap = [];
//     let currentPage = [];

//     templateRows.forEach((row, index) => {

//       const hasPageBreak = row.cells?.some(
//         (cell) =>
//           cell.field?.label
//             ?.toLowerCase()
//             .trim() === "page break"
//       );

//       if (hasPageBreak) {

//         if (currentPage.length > 0) {
//           pageMap.push(currentPage);
//         }

//         currentPage = [];

//       } else {
//         currentPage.push(index);
//       }
//     });

//     if (currentPage.length > 0) {
//       pageMap.push(currentPage);
//     }

//     this.pageRowIndexMap = pageMap;
//     this.totalFormPages = pageMap.length;
//     this.currentPageIndex = 0;

//     // ====================================
//     // 🎨 Decorate for UI
//     // ====================================
//     const uiRows = structuredClone(templateRows);

//     this.tableRows = this.decorateRowsForUI(uiRows);

//     // ====================================
//     // 🔥 BUILD PAGED ROWS (FOR STEPS)
//     // ====================================
//     this.pagedRows = this.pageRowIndexMap.map(
//       (indices) => indices.map((i) => this.tableRows[i])
//     );

//     // ====================================
//     // 🪄 Show first page
//     // ====================================
//     this.updateVisibleRows();

//     // ====================================
//     // ✅ TITLE + STEPS STATE
//     // ====================================
//     this.selectedFormType =
//       response.Form_Type__c || this.selectedForm.Form_Type__c;

//     // if you already have a method building steps UI:
//     this.buildVisualSteps?.();

//     this.isFormSelected = true;

//     console.log("✅ EDIT mode UI rendered.", {
//       totalPages: this.totalFormPages,
//       pagedRows: this.pagedRows.length,
//       selectedFormType: this.selectedFormType
//     });

//   } catch (err) {

//     console.error("❌ Failed loading response for edit:", err);

//     this.showToast(
//       "Error",
//       "Failed to load submitted form for editing.",
//       "error"
//     );
//   }
// }

async handleEdit(event) {

  this.isEditing = true;
  this.selectedResponseId = event.currentTarget.dataset.id;

  const response = this.formResponses.find(
    (resp) => resp.Id === this.selectedResponseId
  );

  if (!response) {
    console.error("❌ Response not found.");
    return;
  }

  console.log(
    "🧪 Full response object:",
    JSON.stringify(response, null, 2)
  );

  // ====================================
  // 🔎 Resolve parent FORM (🔥 FIXED)
  // ====================================

  try {

    console.log(
      "📄 Fetching form for edit:",
      response.Incident_Form__c
    );

   const responseRecord = await getFormDetailsById({
  formId: response.Id
});

    if (!responseRecord) {
      console.error(
        "❌ Form record not returned for:",
        response.Incident_Form__c
      );

      this.showToast(
        "Error",
        "Form definition not found for this response.",
        "error"
      );

      return;
    }

    // 🔥 form is now nested
this.selectedForm = responseRecord.Incident_Form__r;

    console.log(
      "🧪 Resolved form from Apex:",
      this.selectedForm
    );

  } catch (err) {

    console.error(
      "❌ Failed to resolve form for edit:",
      err
    );

    this.showToast(
      "Error",
      "Unable to load form template.",
      "error"
    );

    return;
  }

  try {

    // ====================================
    // 🔥 Load RESPONSE JSON
    // ====================================
    let responseRows = [];

    const raw = response.Response_JSON__c;

    if (raw) {

      const parsed = JSON.parse(raw);

      if (parsed?.url && parsed?.key) {

        console.log(
          "🌐 Loading response JSON from AWS:",
          parsed.url
        );

        const awsResp = await fetch(parsed.url);

        if (!awsResp.ok) {
          throw new Error(
            "Failed to load response JSON from AWS"
          );
        }

        responseRows = await awsResp.json();

      } else {
        responseRows = parsed;
      }
    }

    // ====================================
    // 📄 Load TEMPLATE JSON
    // ====================================
    let templateRows = [];

    const templateRaw = this.selectedForm.Form_JSON__c;

    if (templateRaw) {

      const parsedTemplate = JSON.parse(templateRaw);

      if (parsedTemplate?.url && parsedTemplate?.key) {

        console.log(
          "🌐 Loading template JSON from AWS:",
          parsedTemplate.url
        );

        const awsTemplateResp = await fetch(
          parsedTemplate.url
        );

        if (!awsTemplateResp.ok) {
          throw new Error(
            "Failed to load template JSON from AWS"
          );
        }

        templateRows = await awsTemplateResp.json();

      } else {
        templateRows = parsedTemplate;
      }
    }

    // ====================================
    // 🔀 Merge RESPONSE → TEMPLATE
    // ====================================
    this.mergeResponseIntoTemplate(
      templateRows,
      responseRows
    );

    console.log(
      "🧪 Template after merge:",
      JSON.stringify(templateRows, null, 2)
    );

    // ====================================
    // 🧠 Store immutable merged template
    // ====================================
    this.originalTemplate =
      structuredClone(templateRows);

    // ====================================
    // 🔄 Build PAGE MAP (ONCE)
    // ====================================
    let pageMap = [];
    let currentPage = [];

    templateRows.forEach((row, index) => {

      const hasPageBreak = row.cells?.some(
        (cell) =>
          cell.field?.label
            ?.toLowerCase()
            .trim() === "page break"
      );

      if (hasPageBreak) {

        if (currentPage.length > 0) {
          pageMap.push(currentPage);
        }

        currentPage = [];

      } else {
        currentPage.push(index);
      }
    });

    if (currentPage.length > 0) {
      pageMap.push(currentPage);
    }

    this.pageRowIndexMap = pageMap;
    this.totalFormPages = pageMap.length;
    this.currentPageIndex = 0;

    // ====================================
    // 🎨 Decorate for UI
    // ====================================
    const uiRows =
      structuredClone(templateRows);

    this.tableRows =
      this.decorateRowsForUI(uiRows);

    // ====================================
    // 🔥 BUILD PAGED ROWS (FOR STEPS)
    // ====================================
    this.pagedRows =
      this.pageRowIndexMap.map(
        (indices) =>
          indices.map(
            (i) => this.tableRows[i]
          )
      );

    // ====================================
    // 🪄 Show first page
    // ====================================
    this.updateVisibleRows();

    // ====================================
    // ✅ TITLE + STEPS STATE
    // ====================================
    this.selectedFormType =
      response.Form_Type__c ||
      this.selectedForm.Form_Type__c;

    this.buildVisualSteps?.();

    this.isFormSelected = true;

    console.log("✅ EDIT mode UI rendered.", {
      totalPages: this.totalFormPages,
      pagedRows: this.pagedRows.length,
      selectedFormType: this.selectedFormType
    });

  } catch (err) {

    console.error(
      "❌ Failed loading response for edit:",
      err
    );

    this.showToast(
      "Error",
      "Failed to load submitted form for editing.",
      "error"
    );
  }
}





@track  showDeleteConfirm = false;
@track deleteResponseId = null;
deleteFormName;


  // handleDelete(event) {
  //   const responseId = event.currentTarget.dataset.id;

  //   if (!responseId) {
  //     console.error("Error: Response ID is undefined");
  //     return;
  //   }

  //   deleteFormResponse({ responseId })
  //     .then(() => {
  //       this.showToast(
  //         "Success",
  //         "Form response deleted successfully!",
  //         "success"
  //       );
  //       return refreshApex(this.wiredFormResponses); // Refresh responses after deletion
  //     })
  //     .catch((error) => {
  //       console.error("Error deleting response:", error);
  //       this.showToast("Error", "Error deleting response", "error");
  //     });
  // }

handleDelete(event) {
  const responseId = event.currentTarget.dataset.id;

  const response = this.formResponses.find(
    (r) => r.Id === responseId
  );

  this.deleteResponseId = responseId;
  this.deleteFormName = response?.Name__c || "—";

  this.showDeleteConfirm = true;
}

handleDeleteConfirm() {

  if (this.isLoading) {
    console.warn("⏳ Delete already in progress");
    return;
  }

  this.isLoading = true;

  deleteFormResponse({ responseId: this.deleteResponseId })
    .then(() => {

      this.showToast(
        "Success",
        "Form response deleted successfully!",
        "success"
      );

      this.showDeleteConfirm = false;
      this.deleteResponseId = null;

      // 🔥 RESET TO FIRST PAGE
      this.formPageNumber = 1;

      // 🔥 FORCE FULL RELOAD
      return this.loadIncidentResponses();

    })
    .catch((error) => {

      console.error("❌ Error deleting response:", error);

      this.showToast(
        "Error",
        error?.body?.message || "Error deleting response",
        "error"
      );

    })
    .finally(() => {
      this.isLoading = false;
    });
}


handleDeleteCancel() {
  this.showDeleteConfirm = false;
  this.deleteResponseId = null;
}


  isOptionSelected(cell, option) {
    return cell.selectedOptionsArray.includes(option);
  }

  @track isCommentVisible = false;
  @track selectedComment = "";

  handleCommentClick(event) {
    this.selectedComment = event.target.dataset.comment;
    this.isCommentVisible = true;
  }

  closeCommentSidebar() {
    this.isCommentVisible = false;
  }

  handleInputChange(event) {
    const { id } = event.target.dataset;
    const rowIdx = id.split("-")[1];
    const colIdx = id.split("-")[2];
    const row = this.tableRows[rowIdx];
    const cell = row?.cells[colIdx];

    if (cell && cell.field) {
      let newValue;

      // ✅ Handle checkboxes
      if (event.target.type === "checkbox") {
        newValue = event.target.checked;
        cell.field.value = newValue;
      }
      // ✅ Handle single-select dropdowns
      else if (cell.isDropdownField && !cell.isMultiSelect) {
        const selectEl = event.target;

        const selectedValue = selectEl.value;
        const selectedLabel =
          selectEl.options[selectEl.selectedIndex]?.text || "";

        cell.field.value = selectedValue;
        cell.field.selectedLabel = selectedLabel;

        console.log(
          `✅ Single-Select Updated: value=${selectedValue}, label=${selectedLabel}`
        );
      }

      // ✅ Handle multi-select dropdowns
      else if (cell.isDropdownField && cell.isMultiSelect) {
        const selectedValues = Array.from(
          event.target.selectedOptions,
          (option) => option.value
        ).join(", ");
        newValue = selectedValues;
        cell.field.value = selectedValues;
        console.log(`✅ Multi-Select Updated: ${cell.field.value}`);
      }
      // ✅ Handle all other input types (text, number, etc.)
      else {
        newValue = event.target.value;
        cell.field.value = newValue;
      }

      // ✅ Remove red highlight if the field is required and now has a value
      if (
        cell.field.isRequired &&
        newValue !== undefined &&
        newValue !== null &&
        newValue.toString().trim() !== ""
      ) {
        event.target.classList.remove("highlight-error");
      }
    }
  }

  handleTextAreaInput(event) {
    const cellId = event.target.dataset.id;
    const textValue = event.target.value;

    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (cell.id === cellId) {
          return {
            ...cell,
            field: {
              ...cell.field,
              value: textValue
            },
            charCount: textValue.length
          };
        }
        return cell;
      })
    }));
  }

  restrictAlphaNumeric(event) {
    const char = event.key;
    const regex = /^[A-Za-z0-9]$/; // ✅ Only allows letters and numbers
    if (!regex.test(char)) {
      event.preventDefault();
    }
  }

  validateAlphaNumeric(event) {
    event.target.value = event.target.value.replace(/[^A-Za-z0-9]/g, ""); // ✅ Removes special characters dynamically
  }

  restrictOnlyAlphabets(event) {
    const char = event.key;
    const regex = /^[A-Za-z]$/; // ✅ Only allows letters
    if (!regex.test(char)) {
      event.preventDefault();
    }
  }

  validateOnlyAlphabets(event) {
    event.target.value = event.target.value.replace(/[^A-Za-z]/g, ""); // ✅ Removes numbers & special characters dynamically
  }

  restrictNumbersOnly(event) {
    const char = event.key;

    // ✅ Allow numbers, spaces, and plus (+) for country codes
    const regex = /^[0-9+\s]$/;

    if (!regex.test(char)) {
      event.preventDefault();
    }
  }

  validateNumbersOnly(event) {
    // ✅ Keep only numbers, spaces, and plus sign (+)
    event.target.value = event.target.value.replace(/[^0-9+\s]/g, "");
  }

  restrictCurrencyInput(event) {
    const char = event.key;
    const value = event.target.value;
    const decimalPlaces = parseInt(event.target.dataset.decimals, 10) || 2; // ✅ Dynamically retrieve allowed decimals

    // ✅ Allow only numbers and a single decimal point
    if (!/[0-9.]/.test(char) || (char === "." && value.includes("."))) {
      event.preventDefault();
      return;
    }

    // ✅ Prevent more decimals than allowed
    if (value.includes(".") && char !== "Backspace") {
      const [integerPart, decimalPart] = value.split(".");
      if (decimalPart.length >= decimalPlaces) {
        event.preventDefault();
      }
    }
  }

  validateCurrencyInput(event) {
    let value = event.target.value;

    // ✅ Remove invalid characters (keep numbers & a single dot)
    value = value.replace(/[^0-9.]/g, "");

    // ✅ Ensure only one decimal point exists
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }

    // ✅ Restrict decimal places dynamically
    const decimalPlaces = parseInt(event.target.dataset.decimals, 10) || 2;
    if (parts[1] && parts[1].length > decimalPlaces) {
      value = parts[0] + "." + parts[1].substring(0, decimalPlaces);
    }

    event.target.value = value;
  }


cleanDropdownOptionsBeforeSave() {
  const firstPageRowIndexes = this.pageRowIndexMap?.[0] || [];

  return this.tableRows.map((row, rowIndex) => {
    const isFirstPage = firstPageRowIndexes.includes(rowIndex);

    return {
      ...row,
      cells: row.cells.map((cell) => {
        if (!cell.field) return cell;

        const label = cell.field.label?.toLowerCase();
        const isDropdown = cell.field.dataType === "Dropdown Field";

        const isFirstPageTarget =
          isFirstPage &&
          (label === "facility" ||
            label === "participant" ||
            label === "assigned to");

        const isPredefinedList =
          cell.field.selectedDropdownOption === "predefinedList";

        // only clean when:
        // first page special OR predefinedList anywhere
        if (!isDropdown || (!isFirstPageTarget && !isPredefinedList)) {
          return cell;
        }

        let finalValue = cell.field.value;
        let finalLabel = cell.field.selectedLabel || null;

        // try to extract from options if still present
        if (cell.field.options?.length) {
          const selected = cell.field.options.find(
            (o) =>
              o.value === finalValue ||
              o.isSelected ||
              o.label === finalValue
          );

          if (selected) {
            finalValue = selected.value;
            finalLabel = selected.label;
          }
        }

        const { options, ...restField } = cell.field;

        return {
          ...cell,
          field: {
            ...restField,
            value: finalValue,
            selectedLabel: finalLabel
          }
        };
      })
    };
  });
}



  // handleSubmit() {
  //   let missingFields = [];

  //   this.tableRows.forEach((row) => {
  //     row.cells.forEach((cell) => {
  //       const field = cell.field;
  //       const inputEl = this.template.querySelector(`[data-id="${cell.id}"]`);

  //       // Remove existing error class
  //       if (inputEl) inputEl.classList.remove("highlight-error");

  //       if (
  //         field &&
  //         field.isRequired === true &&
  //         (field.value === undefined ||
  //           field.value === null ||
  //           field.value.toString().trim() === "")
  //       ) {
  //         missingFields.push(field.label);

  //         // Add red highlight class
  //         if (inputEl) {
  //           inputEl.classList.add("highlight-error");
  //         }
  //       }
  //     });
  //   });

  //   if (missingFields.length > 0) {
  //     this.showToast(
  //       "Missing Required Fields",
  //       `Please fill the following required fields: ${missingFields.join(", ")}`,
  //       "error"
  //     );
  //     return; // ⛔ Stop submission
  //   }

  //   // const responseJson = JSON.stringify(this.tableRows);
  //   const responseJson = JSON.stringify(this.cleanDropdownOptionsBeforeSave());


  //   let assignedStaffId = null;
  //   let statusValue = null;
  //   this.tableRows.forEach((row) => {
  //     row.cells.forEach((cell) => {
  //       const label = cell.field?.label?.toLowerCase().trim();
  //       if (label === "assigned to") {
  //         assignedStaffId = cell.field?.value;
  //       }
  //       if (
  //         label === "status" &&
  //         cell.field?.dataType?.toLowerCase().includes("dropdown")
  //       ) {
  //         statusValue = cell.field?.value;
  //         console.log("🟦 Status field found. Value:", statusValue);
  //       }
  //     });
  //   });

  //   if (this.isEditing) {
  //     this.logFormEditHistory();
  //     updateFormResponse({
  //       responseId: this.selectedResponseId,
  //       responseJson,
  //       statusValue,
  //       assignedStaffId
  //     })
  //       .then(() => {
  //         this.showToast("Success", "Form Updated Successfully!", "success");
  //         this.isFormSelected = false;
  //         this.isEditing = false;
  //         // this.logFormEditHistory();

  //         if (assignedStaffId) {
  //           getStaffEmailById({ staffId: assignedStaffId })
  //             .then((email) => {
  //               if (email) {
  //                 const emailHTML = this.buildHtmlSummary(this.tableRows);
  //                 sendFormDetailsToStaff({
  //                   emailAddress: email,
  //                   formDataHtml: emailHTML
  //                 })
  //                   .then(() => {
  //                     console.log("📧 Email sent to assigned staff (update)");
  //                   })
  //                   .catch((err) => {
  //                     console.error("❌ Failed to send email on update:", err);
  //                   });
  //               }
  //             })
  //             .catch((error) => {
  //               console.error("❌ Failed to fetch email on update:", error);
  //             });
  //         }
  //         return refreshApex(this.wiredFormResponses); // Refresh responses after update
  //       })
  //       .catch((error) => {
  //         this.showToast("Error", "Error updating form", "error");
  //         console.error(error);
  //       });
  //   } else {
  //     console.log("Initiating Form Submission...");
  //     //this.submitIncidentCase();
  //     console.log("Form Details:", {
  //       formId: this.selectedForm?.Id,
  //       formName: this.selectedForm?.Name__c,
  //       formType: this.selectedForm?.Form_Type__c,
  //       responseJson: responseJson,
  //       orgId: this.orgid,
  //       clientId: this.clientId,
  //       statusValue,
  //       assignedStaffId
  //     });

  //     saveFormResponse({
  //       formId: this.selectedForm.Id,
  //       responseJson: responseJson,
  //       orgId: this.orgid, 
  //       clientId: this.clientId, 
  //       formName: this.selectedForm.Name__c,
  //       formType: this.selectedForm.Form_Type__c, 
  //       statusValue,
  //       assignedStaffId
  //     })
  //       .then(() => {
  //         console.log("✅ Form Submitted Successfully!");
  //         console.log("Resetting state variables...");
  //         this.showToast("Success", "Form Submitted Successfully!", "success");
  //         this.isFormSelected = false;
  //         this.isEditing = false;

  //         console.log("Refreshing Apex Data...");
  //         return refreshApex(this.wiredFormResponses);
  //       })
  //       .then(() => {
  //         console.log("✅ Apex Data Refreshed Successfully!");
  //         // ✅ Send Email to Assigned Staff (if assigned)
  //         if (assignedStaffId) {
  //           getStaffEmailById({ staffId: assignedStaffId })
  //             .then((email) => {
  //               console.log("📬 Staff Email:", email);
  //               if (email) {
  //                 const emailHTML = this.buildHtmlSummary(this.tableRows);
  //                 sendFormDetailsToStaff({
  //                   emailAddress: email,
  //                   formDataHtml: emailHTML
  //                 })
  //                   .then(() => {
  //                     console.log("📧 Email sent to assigned staff");
  //                   })
  //                   .catch((err) => {
  //                     console.error(
  //                       "❌ Failed to send email to assigned staff:",
  //                       err
  //                     );
  //                   });
  //               }
  //             })
  //             .catch((error) => {
  //               console.error("❌ Failed to fetch staff email by name:", error);
  //             });
  //         }
  //       })
  //       .catch((error) => {
  //         console.error("❌ Error submitting form:", error);
  //         this.showToast("Error", "Error submitting form", "error");
  //       });
  //   }
  // }


  async handleSubmit() {

  if (this.isLoading) return;
  this.isLoading = true;

  try {

    // =====================================
    // ✅ REQUIRED FIELD VALIDATION (UNCHANGED)
    // =====================================
    let missingFields = [];

    this.tableRows.forEach((row) => {
      row.cells.forEach((cell) => {
        const field = cell.field;
        const inputEl = this.template.querySelector(
          `[data-id="${cell.id}"]`
        );

        if (inputEl) inputEl.classList.remove("highlight-error");

        if (
          field &&
          field.isRequired === true &&
          (field.value === undefined ||
            field.value === null ||
            field.value.toString().trim() === "")
        ) {
          missingFields.push(field.label);
          if (inputEl) inputEl.classList.add("highlight-error");
        }
      });
    });

    if (missingFields.length > 0) {
      this.showToast(
        "Missing Required Fields",
        `Please fill the following required fields: ${missingFields.join(", ")}`,
        "error"
      );
      return;
    }

    // =====================================
    // 🧹 CLEAN FORM DATA
    // =====================================
    // const cleanedRows = this.cleanDropdownOptionsBeforeSave();
    const cleanedRows = this.buildResponsePayloadFromTemplate();

    // =====================================
    // 🔥 UPLOAD RESPONSE JSON → AWS
    // =====================================
    const existingAwsJson =
      this.isEditing
        ? this.formResponses.find(
            (r) => r.Id === this.selectedResponseId
          )?.Response_JSON__c
        : null;

    const awsMeta = await this.uploadResponseJsonToAws(
      cleanedRows,
      this.isEditing ? "update" : "create",
      existingAwsJson
    );

    const responseJson = JSON.stringify(awsMeta);

    console.log("📦 Response AWS Meta:", awsMeta);

    // =====================================
    // 🔍 Assigned / Status (UNCHANGED)
    // =====================================
    let assignedStaffId = null;
    let statusValue = null;

    this.tableRows.forEach((row) => {
      row.cells.forEach((cell) => {
        const label = cell.field?.label?.toLowerCase().trim();

        if (label === "assigned to") {
          assignedStaffId = cell.field?.value;
        }

        if (
          label === "status" &&
          cell.field?.dataType?.toLowerCase().includes("dropdown")
        ) {
          statusValue = cell.field?.value;
          console.log("🟦 Status field found. Value:", statusValue);
        }
      });
    });

    // =====================================
    // ♻️ UPDATE FLOW
    // =====================================
    if (this.isEditing) {

      await this.logFormEditHistory();

      await updateFormResponse({
        responseId: this.selectedResponseId,
        responseJson,
        statusValue,
        assignedStaffId
      });

      this.showToast("Success", "Form Updated Successfully!", "success");

      this.isFormSelected = false;
      this.isEditing = false;
      this.showPublishedForms = false;

      if (assignedStaffId) {
        try {
          const email = await getStaffEmailById({
            staffId: assignedStaffId
          });
          console.log(
  "📤 About to send email to staff:",
  assignedStaffId
);


          if (email) {
            const emailHTML = this.buildHtmlSummary(this.tableRows);

            await sendFormDetailsToStaff({
              emailAddress: email,
              formDataHtml: emailHTML
            });

            console.log("📧 Email sent to assigned staff (update)");
          }
        } catch (err) {
          console.error("❌ Staff email send failed (update):", err);
        }
      }

      this.formPageNumber = 1;

      // 🔥 reload responses and wait
      await this.loadIncidentResponses();
      return;
    }

    // =====================================
    // 🆕 CREATE FLOW
    // =====================================
    console.log("Initiating Form Submission...");

    await saveFormResponse({
      formId: this.selectedForm.Id,
      responseJson,
      orgId: this.orgid,
      clientId: this.clientId,
      formName: this.selectedForm.Name__c,
      formType: this.selectedForm.Form_Type__c,
      facilityId: this.selectedFacilityId,
      statusValue,
      assignedStaffId
    });

    this.showToast("Success", "Form Submitted Successfully!", "success");

    this.isFormSelected = false;
    this.isEditing = false;
    this.showPublishedForms = false;

    // 🔥 reset pagination
    this.formPageNumber = 1;

    // 🔥 reload table data
    await this.loadIncidentResponses();


    // =====================================
    // 📧 STAFF EMAIL AFTER CREATE
    // =====================================
    if (assignedStaffId) {
      try {
        const email = await getStaffEmailById({
          staffId: assignedStaffId
        });

        if (email) {
          const emailHTML = this.buildHtmlSummary(this.tableRows);

          await sendFormDetailsToStaff({
            emailAddress: email,
            formDataHtml: emailHTML
          });

          console.log("📧 Email sent to assigned staff");
        }
      } catch (err) {
        console.error("❌ Staff email send failed:", err);
      }
    }

  } catch (error) {

    console.error("❌ Error submitting form:", error);

    this.showToast(
      "Error",
      error?.body?.message || error?.message || "Error submitting form",
      "error"
    );

  } finally {
    this.isLoading = false;
    this.showPublishedForms = false;
  }
}

buildResponsePayloadFromTemplate() {

  // ✅ clone pristine layout
  const payload = structuredClone(this.originalTemplate);

  const firstPageRowIndexes = this.pageRowIndexMap?.[0] || [];

  payload.forEach((row, rowIndex) => {

    row.cells.forEach((cell, cellIndex) => {

      const uiCell = this.tableRows[rowIndex]?.cells[cellIndex];

      if (!cell.field || !uiCell?.field) return;

      const label = cell.field.label?.toLowerCase();
      const isDropdown = cell.field.dataType === "Dropdown Field";

      // -----------------------------
      // ✅ COPY VALUE ALWAYS
      // -----------------------------
      cell.field.value = uiCell.field.value ?? null;

      // -----------------------------
      // ✅ Dropdown label/value sync
      // -----------------------------
      if (isDropdown) {

        let finalValue = uiCell.field.value;
        let finalLabel = uiCell.field.selectedLabel || null;

        if (uiCell.field.options?.length) {

          const selected = uiCell.field.options.find(
            (o) =>
              o.value === finalValue ||
              o.isSelected ||
              o.label === finalValue
          );

          if (selected) {
            finalValue = selected.value;
            finalLabel = selected.label;
          }
        }

        cell.field.value = finalValue;
        cell.field.selectedLabel = finalLabel;
      }

      // -----------------------------
      // ✅ Radio
      // -----------------------------
      if (uiCell.selectedRadioOption) {
        cell.field.selectedRadioOption =
          uiCell.selectedRadioOption;
      }

      if (uiCell.subInputValue) {
        cell.field.subInputValue =
          uiCell.subInputValue;
      }

      // -----------------------------
      // ✅ Upload metadata only
      // -----------------------------
      if (uiCell.field.meta?.uploadedFiles) {
        cell.field.meta = {
          uploadedFiles: uiCell.field.meta.uploadedFiles
        };
      }

    });

  });

  return payload;
}



 async logFormEditHistory() {
  console.log("📥 Fetching previous form data for history comparison...");

  try {
    const prevRecord = await getPreviousFormData({
      responseId: this.selectedResponseId
    });

    console.log("✅ Previous form record loaded:", prevRecord);

    // =====================================
    // 🔥 Resolve AWS vs inline previous JSON
    // =====================================
    let prevJson = [];

    const raw = prevRecord.Response_JSON__c;

    if (raw) {
      const parsed = JSON.parse(raw);

      if (parsed?.url) {
        console.log("🌐 Loading previous response JSON from AWS:", parsed.url);

        const resp = await fetch(parsed.url);

        if (!resp.ok) {
          throw new Error("Failed to fetch previous AWS JSON");
        }

        prevJson = await resp.json();
      } else {
        prevJson = parsed;
      }
    }

    // =====================================
    // ✅ Current rows (already in memory)
    // =====================================
    const currentJson = JSON.parse(JSON.stringify(this.tableRows));

    console.log("📊 Current form data prepared:", currentJson);

    // =====================================
    // 📜 Existing history log
    // =====================================
    const historyLog = prevRecord.History_Log__c
      ? JSON.parse(prevRecord.History_Log__c)
      : [];

    console.log("📜 Existing history log:", historyLog);

    // =====================================
    // 🔍 Diff
    // =====================================
    const prevMap = this.extractFieldMap(prevJson);
    const currMap = this.extractFieldMap(currentJson);

    const prevAssigned = prevMap.get("assigned to") || "";
    const newAssigned = currMap.get("assigned to") || "";

    const prevStatus = prevMap.get("status") || "";
    const newStatus = currMap.get("status") || "";

    const changes = [];

    if (prevAssigned !== newAssigned) {
      changes.push(
        `Assigned To: '${prevAssigned || "None"}' → '${newAssigned || "None"}'`
      );
    }

    if (prevStatus !== newStatus) {
      changes.push(
        `Status: '${prevStatus || "None"}' → '${newStatus || "None"}'`
      );
    }

    console.log("⬅️ Previous Assigned:", prevAssigned);
    console.log("➡️ New Assigned:", newAssigned);
    console.log("⬅️ Previous Status:", prevStatus);
    console.log("➡️ New Status:", newStatus);
    console.log("🔍 Detected changes:", changes);

    if (!changes.length) {
      console.log("🟢 No form changes to log. Skipping history update.");
      return;
    }

    // =====================================
    // 📝 Append history
    // =====================================
    const logEntry = {
      timestamp: this.formatTimestamp(new Date()),
      user: `${this.firstName} ${this.lastName}`,
      action: "Edited Form",
      content: changes.join("; ")
    };

    historyLog.push(logEntry);

    console.log("📝 Appending new log entry:", logEntry);

    // =====================================
    // ⚠️ ONLY update history here
    // =====================================
    await updateFormWithHistory({
      responseId: this.selectedResponseId,
      historyLog: JSON.stringify(historyLog),
      statusValue: null,
      assignedStaffId: null
    });

    console.log("📘 Form edit history logged successfully.");

  } catch (error) {
    console.error("❌ Error logging form history:", error);
  }
}

  formatTimestamp(date) {
    const options = { month: "short", day: "2-digit", year: "numeric" };
    const datePart = date.toLocaleDateString("en-US", options).replace(",", "");

    const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    const timePart = date
      .toLocaleTimeString("en-US", timeOptions)
      .toLowerCase();

    return `${datePart.toUpperCase()} ${timePart}`;
  }

 extractFieldMap(rows) {
  const map = new Map();

  rows.forEach((row) => {
    row.cells.forEach((cell) => {
      const field = cell.field;
      const label = field?.label?.trim().toLowerCase();

      if (!label) return;

      let value = "";

      // ✅ Use display label for lookup dropdowns
      if (
        field.dataType === "Dropdown Field" &&
        field.selectedLabel
      ) {
        value = field.selectedLabel;
      } 
      // ✅ Upload fields (array)
      else if (Array.isArray(field.value)) {
        value = field.value.join(", ");
      } 
      // fallback
      else {
        value = field.value ?? "";
      }

      map.set(label, value);
    });
  });

  return map;
}



  getFormChanges(oldRows, newRows) {
    const prevMap = this.extractFieldMap(oldRows);
    const currMap = this.extractFieldMap(newRows);
    const changes = [];

    const allLabels = new Set([...prevMap.keys(), ...currMap.keys()]);

    allLabels.forEach((label) => {
      const oldVal = prevMap.get(label) ?? "";
      const newVal = currMap.get(label) ?? "";
      if (oldVal !== newVal) {
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
        changes.push(
          `${formattedLabel}: '${oldVal || "None"}' → '${newVal || "None"}'`
        );
      }
    });

    return changes;
  }

  buildHtmlSummary(tableRows) {
    let html =
      '<h2>Submitted Form Details</h2><table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">';
    tableRows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cell.field?.label && cell.field?.value) {
          html += `<tr><td><strong>${cell.field.label}</strong></td><td>${cell.field.value}</td></tr>`;
        }
      });
    });
    html += "</table>";
    return html;
  }

  toggleDropdown(event) {
    const cellId = event.currentTarget.dataset.id;

    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => ({
        ...cell,
        isDropdownOpen: cell.id === cellId ? !cell.isDropdownOpen : false
      }))
    }));

    // Optional: check which cell opened dropdown
    // const clickedCell = this.getCellById(cellId);
    // if (clickedCell?.isDropdownOpen) {
    //   document.addEventListener("click", this.closeDropdowns);
    // }
  }

  handleIconClick(event) {
    event.stopPropagation(); 
    this.toggleDropdown(event);
  }



  // ✅ Handles multi-select dropdown checkbox changes
  handleMultiSelectChange(event) {
    const optionValue = event.target.value;
    const cellId = event.target.dataset.id;

    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (cell.id === cellId) {
          let updatedOptions = cell.field.options.map((option) => {
            if (option.label === optionValue) {
              return { ...option, isSelected: event.target.checked }; // ✅ Toggle isSelected
            }
            return option;
          });

          // ✅ Update `selectedValues` and `value` in field
          let selectedOptions = updatedOptions
            .filter((option) => option.isSelected)
            .map((option) => option.label);
          let selectedValues = selectedOptions.join(", ");

          return {
            ...cell,
            selectedValues: selectedValues, // ✅ Update input field
            field: {
              ...cell.field,
              options: updatedOptions,
              value: selectedValues // ✅ Store selected multi-select values
            }
          };
        }
        return cell;
      })
    }));
  }

  saveMultiSelect(event) {
    const cellId = event.target.dataset.id;

    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (cell.id === cellId) {
          let selectedOptions = cell.field.options.filter(
            (option) => option.isSelected
          );
          let selectedValues = selectedOptions
            .map((option) => option.label)
            .join(", ");

          return {
            ...cell,
            selectedValues: selectedValues, // ✅ Update input field
            field: {
              ...cell.field,
              value: selectedValues // ✅ Store multi-select values correctly
            },
            isDropdownOpen: false // ✅ Close dropdown after saving
          };
        }
        return cell;
      })
    }));

    document.removeEventListener("click", this.closeDropdowns); // ✅ Remove event listener
  }

  closeDropdowns = (event) => {
    const dropdownOptions = this.template.querySelector(
      ".multi-dropdown-options"
    );
    const multiSelectedValues = this.template.querySelector(
      ".multi-selected-values"
    );

    // ✅ Prevent closing if clicking inside the dropdown OR on selected values
    if (
      dropdownOptions?.contains(event.target) ||
      multiSelectedValues?.contains(event.target)
    ) {
      return;
    }

    // ✅ Close all dropdowns
    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => ({
        ...cell,
        isDropdownOpen: false
      }))
    }));

    document.removeEventListener("click", this.closeDropdowns); // ✅ Clean up listener
  };

  stopPropagation(event) {
    event.stopPropagation();
  }
  handleinputCancel() {
    this.isFormSelected = false;
    this.isEditing = false;
    this.tableRows = []; // Clear the form data
    this.showPublishedForms = false;
    console.log("🚫 Form selection canceled");
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

  handleFileUpload(event) {
    const cellId = event.target.dataset.id;
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];

      // Apex call to upload file
      uploadFileToSalesforce({
        base64Data: base64,
        fileName: file.name,
        contentType: file.type
      })
        .then((fileResponse) => {
          const { previewUrl, downloadUrl } = fileResponse;

          this.tableRows = this.tableRows.map((row) => ({
            ...row,
            cells: row.cells.map((cell) => {
              if (cell.id === cellId) {
                return {
                  ...cell,
                  field: {
                    ...cell.field,
                    value: previewUrl, // image preview URL
                    downloadLink: downloadUrl // actual download link
                  }
                };
              }
              return cell;
            })
          }));
        })

        .catch((error) => {
          console.error("❌ File upload failed:", error);
          this.showToast("Error", "File upload failed", "error");
        });
    };

    reader.readAsDataURL(file);
  }


    _modulePathFromParent = "ticket"; // default

  handleFileUploadInputChange(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const cellId = event.target.dataset.cellId;
    // find the corresponding child inside this cell
    const svc = this.template.querySelector(
      `c-document-office-service[data-cell-id="${cellId}"]`
    );
    if (!svc) return;
    svc.incomingFiles = files;

  }

handleAwsUploadComplete(evt) {
  try {
    console.group("[AWS Upload Complete]");
    console.log("Raw event detail:", evt?.detail);

    const { recordId, files = [], ctx } = evt.detail || {};
    console.log("recordId:", recordId);
    console.log("files count:", files.length, "files:", files);
    console.log("ctx (cellId):", ctx);

    if (!files.length) {
      console.warn("No uploaded files in payload; aborting.");
      console.groupEnd();
      return;
    }

    if (!Array.isArray(this.tableRows)) {
      console.error("tableRows not initialized yet");
      console.groupEnd();
      return;
    }

    const cellId = ctx;

    // 🔹 collect existing values BEFORE overwrite
    let existingUrls = [];
    let existingNames = [];
    let existingKeys = [];
    let existingUploadedFiles = [];

    const collectExisting = (cell) => {
      if (Array.isArray(cell.field?.urls)) existingUrls = [...cell.field.urls];
      if (Array.isArray(cell.field?.s3Key)) existingKeys = [...cell.field.s3Key];
      if (Array.isArray(cell.field?.meta?.uploadedFiles)) {
        existingUploadedFiles = [...cell.field.meta.uploadedFiles];
      }
      if (cell.field?.fileName) {
        existingNames = cell.field.fileName.split(",").map(v => v.trim());
      }
    };

    // Scan once for existing cell
    this.tableRows.forEach(row =>
      row.cells.forEach(cell => {
        if (cell.id === cellId) collectExisting(cell);
      })
    );

    // Build arrays from NEW payload
    const newUrls = files.map(f => f?.url).filter(Boolean);
    const newNames = files.map(f => f?.originalName).filter(Boolean);
    const newTypes = files.map(f => f?.type).filter(Boolean);
    const newKeys = files.map(f => f?.key).filter(Boolean);
    const modulePath = files[0]?.modulePath ?? undefined;

    // 🔹 append (not overwrite)
    const urls = [...existingUrls, ...newUrls];
    const names = [...existingNames, ...newNames];
    const s3Keys = [...existingKeys, ...newKeys];
    const uploadedFiles = [...existingUploadedFiles, ...files];

    console.log("Merged URLs:", urls);
    console.log("Merged file names:", names);
    console.log("Merged s3 keys:", s3Keys);

    const valueForField = urls;

    const metaPayload = {
      modulePath,
      recordId,
      uploadedAt: new Date().toISOString(),
      uploadedFiles,
      rawEventDetail: evt.detail
    };

    // ✅ Update ONLY tableRows
    this.tableRows = this.tableRows.map(row => ({
      ...row,
      cells: row.cells.map(cell => {
        if (cell.id === cellId) {
          const updatedCell = {
            ...cell,
            field: {
              ...cell.field,
              value: valueForField,
              downloadLink: urls,
              fileName: names.join(", "),
              contentType:
                urls.length === 1 ? newTypes[0] || null : "multiple",
              s3Key: s3Keys,
              urls,
              meta: metaPayload
            }
          };

          console.log("Updated cell in tableRows:", {
            cellId,
            updatedField: updatedCell.field
          });

          return updatedCell;
        }
        return cell;
      })
    }));

    // Clear file input so same file can be re-selected
    const input = this.template.querySelector(
      `input.hidden-file-input[data-cell-id="${cellId}"]`
    );

    if (input) {
      input.value = "";
      console.log("Cleared file input for cellId:", cellId);
    } else {
      console.warn("No input found to clear for cellId:", cellId);
    }

    console.groupEnd();
  } catch (e) {
    console.error("[AWS Upload Complete] handler error:", e);
  }
}


  isRadioChecked(selectedValue, optionValue) {
    return selectedValue === optionValue;
  }

  isRadioSelected(selectedOption, currentOption) {
    return selectedOption === currentOption;
  }

  isSelected(optionValue, selectedValue) {
    return optionValue === selectedValue;
  }

  isDropdownSubType(type) {
    return type === "dropdown";
  }

  isTextSubType(type) {
    return type === "text";
  }

  isRadioSubType(type) {
    return type === "radio";
  }

  getSubRadioGroupName(cellId) {
    return `${cellId}-subradio`;
  }

  handleRadioChange(event) {
    const cellId = event.target.dataset.id;
    const selectedValue = event.target.value;
    const subType = event.target.dataset.subtype;

    console.log("🔘 Radio Clicked:", selectedValue, "| Subtype:", subType);

    this.tableRows = this.tableRows.map((row) => {
      return {
        ...row,
        cells: row.cells.map((cell) => {
          if (cell.id === cellId) {
            console.log("📌 Updating Radio Cell:", cellId);

            // Update selected value
            cell.field.value = selectedValue;
            cell.selectedRadioOption = selectedValue;
            cell.subInputValue = ""; // Clear sub input

            // ✅ Rebuild radioOptionsProcessed
            cell.radioOptionsProcessed = (cell.field.radioOptions || []).map(
              (option) => {
                const isSelected = selectedValue === option.optionLabel;
                let processedSubOptions = [];

                if (option.usePredefinedOptions) {
                  const type = option.selectedPredefined?.toLowerCase();

                  if (type === "staff" && this.staffOptions2.length > 0) {
                    processedSubOptions = this.staffOptions2.map((opt) => ({
                      label: opt.label,
                      isSelected: false
                    }));
                  } else if (
                    type === "participant" &&
                    this.participants.length > 0
                  ) {
                    processedSubOptions = this.participants.map((p) => ({
                      label: p.Name,
                      isSelected: false
                    }));
                  } else if (
                    type === "facility" &&
                    this.facilityOptions.length > 0
                  ) {
                    processedSubOptions = this.facilityOptions.map((opt) => ({
                      label: opt.label,
                      isSelected: false
                    }));
                  }
                } else {
                  processedSubOptions = (option.values || []).map((val) => ({
                    label: val,
                    isSelected: false
                  }));
                }

                return {
                  ...option,
                  isSelected,
                  processedSubOptions,
                  isDropdown: option.subType === "dropdown",
                  isTextInput: option.subType === "text",
                  isRadioList: option.subType === "radio",
                  hasSubInput: option.hasSubInput || false,
                  subQuestion: option.subQuestion || ""
                };
              }
            );

            console.log("✅ Updated Radio Option Selection:", selectedValue);
          }
          return cell;
        })
      };
    });
  }

  handleRadioSubInputChange(event) {
    const cellId = event.target.dataset.id;
    const subValue = event.target.value;

    console.log("📥 Sub-Input Change in Cell:", cellId, "| Value:", subValue);

    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (cell.id === cellId) {
          cell.subInputValue = subValue;

          // ✅ Rebuild radioOptionsProcessed
          cell.radioOptionsProcessed = (cell.radioOptionsProcessed || []).map(
            (option) => {
              const isSelected =
                option.optionLabel === cell.selectedRadioOption;

              // Keep existing values unless selected
              if (!isSelected) return option;

              let processedSubOptions = [];

              if (option.usePredefinedOptions) {
                const type = (option.selectedPredefined || "").toLowerCase();

                if (type === "staff" && Array.isArray(this.staffOptions2)) {
                  processedSubOptions = this.staffOptions2.map((opt) => ({
                    label: opt.label,
                    isSelected: subValue === opt.label
                  }));
                } else if (
                  type === "participant" &&
                  Array.isArray(this.participants)
                ) {
                  processedSubOptions = this.participants.map((p) => ({
                    label: p.Name,
                    isSelected: subValue === p.Name
                  }));
                } else if (
                  type === "facility" &&
                  Array.isArray(this.facilityOptions)
                ) {
                  processedSubOptions = this.facilityOptions.map((opt) => ({
                    label: opt.label,
                    isSelected: subValue === opt.label
                  }));
                }
              } else {
                processedSubOptions = (option.values || []).map((val) => ({
                  label: val,
                  isSelected: subValue === val
                }));
              }

              return {
                ...option,
                isSelected: true,
                processedSubOptions
              };
            }
          );
        }
        return cell;
      })
    }));
  }

  submitIncidentCase() {
    let firstName = null;
    let lastName = null;
    let facility = null;
    let participant = null;

    const isValidId = (val) =>
      typeof val === "string" && /^[a-zA-Z0-9]{15,18}$/.test(val);

    this.tableRows.forEach((row) => {
      row.cells.forEach((cell) => {
        const label = cell.field?.label?.toLowerCase().trim();
        const value = cell.field?.value ?? null;

        switch (label) {
          case "first name":
            firstName = value;
            break;
          case "last name":
            lastName = value;
            break;
          case "facility":
            facility = isValidId(value) ? value : null;
            break;
          case "participant":
            participant = value;
            break;
        }
      });
    });

    console.log("🧾 First Name:", firstName ?? "⚠️ Not Found");
    console.log("🧾 Last Name:", lastName ?? "⚠️ Not Found");
    console.log("🏢 Facility ID:", facility ?? "⚠️ Invalid or Missing ID");
    console.log(
      "👤 Participant ID:",
      participant ?? "⚠️ Invalid or Missing ID"
    );

    // 🔁 Call Apex
    saveCaseRecord({
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      facilityId: facility ?? "",
      participant: participant ?? ""
    })
      .then((result) => {
        console.log("✅ Case created successfully:");
        console.log("🔹 First Name:", result.First_Name__c);
        console.log("🔹 Last Name:", result.Last_Name__c);
        console.log("🔹 Facility:", result.Facility__c);
        console.log("🔹 Participant Name:", result.Participant_Name__c); // This will show now
        this.showToast("Success", "Case created!", "success");
      })

      .catch((error) => {
        console.error("❌ Error creating case:", error);
        this.showToast("Error", "Case creation failed", "error");
      });
  }

  get visualProgressSteps() {
    return this.pagedRows.map((_, index) => {
      const isCompleted = index < this.currentPageIndex;
      const isActive = index === this.currentPageIndex;

      return {
        index,
        label:
          index === this.pagedRows.length - 1
            ? "Complete"
            : `Step ${index + 1}`,
        isCompleted,
        isActive,
        circleClass: isCompleted
          ? "circle completed"
          : isActive
            ? "circle active"
            : "circle upcoming",
        labelClass: isCompleted
          ? "step-label completed"
          : isActive
            ? "step-label active"
            : "step-label upcoming"
      };
    });
  }

  get showProgressIndicator() {
    return this.pagedRows && this.pagedRows.length > 1;
  }
  get progressFillStyle() {
    const total = this.pagedRows?.length || 1;
    const completed = this.currentPageIndex;

    // Avoid showing 100% unless we're on the last "Complete" step
    const percentage = total > 1 ? (completed / (total - 1)) * 100 : 0;
    return `width: ${percentage}%;`;
  }

  handleStepClick(event) {
    const stepIndex = parseInt(event.currentTarget.dataset.index, 10);

    if (
      !isNaN(stepIndex) &&
      stepIndex >= 0 &&
      stepIndex < this.pagedRows.length
    ) {
      this.currentPageIndex = stepIndex;
      this.updateVisibleRows(); // this method should re-render based on currentPageIndex
      console.log("📍 Moved to Step/Page:", stepIndex + 1);
    } else {
      console.warn("⚠️ Invalid step index clicked:", stepIndex);
    }
  }

  @track submittedFormsSearchKey = "";
  @track filteredFormResponses = []; // After search
  handleSubmittedFormsSearch(event) {
    this.submittedFormsSearchKey = event.target.value.toLowerCase();

    if (this.submittedFormsSearchKey) {
      this.filteredFormResponses = this.formResponses.filter(
        (response) =>
          (response.Name__c &&
            response.Name__c.toLowerCase().includes(
              this.submittedFormsSearchKey
            )) ||
          (response.Form_Type__c &&
            response.Form_Type__c.toLowerCase().includes(
              this.submittedFormsSearchKey
            )) ||
          (response.Assigned_Staff__c &&
            response.Assigned_Staff__c.toLowerCase().includes(
              this.submittedFormsSearchKey
            )) ||
          (response.FormattedDate &&
            response.FormattedDate.toLowerCase().includes(
              this.submittedFormsSearchKey
            )) ||
          (response.Status__c &&
            response.Status__c.toLowerCase().includes(
              this.submittedFormsSearchKey
            ))
      );
    } else {
      this.filteredFormResponses = [...this.formResponses];
    }

    this.formPageNumber = 1;
    this.totalFormRecords = this.filteredFormResponses.length;
    this.totalFormPages = Math.ceil(this.totalFormRecords / this.formPageSize);
    this.updatePaginatedFormResponses();
  }

  @track formAccessSearchKey = ""; // search keyword for forms access
  @track filteredStaffList = []; // filtered list for pagination

  handleFormAccessSearch(event) {
    this.formAccessSearchKey = event.target.value.toLowerCase();

    if (this.formAccessSearchKey) {
      this.filteredStaffList = this.staffList.filter(
        (staff) =>
          (staff.firstName &&
            staff.firstName.toLowerCase().includes(this.formAccessSearchKey)) ||
          (staff.lastName &&
            staff.lastName.toLowerCase().includes(this.formAccessSearchKey)) ||
          (staff.displayStatus &&
            staff.displayStatus
              .toLowerCase()
              .includes(this.formAccessSearchKey))
      );
    } else {
      this.filteredStaffList = [...this.staffList];
    }

    // reset pagination
    this.pageNumber = 1;
    this.totalRecords = this.filteredStaffList.length;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    this.paginationHelper();
  }

  loadRoleOptionsFromStaff() {
    const uniqueRoles = new Set();
    this.staffList.forEach((staff) => {
      if (staff.staffUserRole1) {
        uniqueRoles.add(staff.staffUserRole1);
      }
    });

    this.roleOptions = Array.from(uniqueRoles).map((role) => ({
      label: role,
      value: role
    }));
  }
  @track selectedStaffFacilities = []; // Holds selected facility IDs from filter
  @track selectedStaffRoles = []; // Holds selected role strings from filter

  @track staffFacilityOptions = []; // Dual-listbox facility options
  @track staffRoleOptions = []; // Dual-listbox role options
  @track isPopoverVisible = false;

  @track chosenFacilityValues = []; // selected facility values
  @track chosenRoleValues = [];

  togglePopover() {
    this.isPopoverVisible = !this.isPopoverVisible;
  }

  closePopover() {
    this.isPopoverVisible = false;
  }

  handleCheckBoxChange(event) {
    const { name, value } = event.target;
    if (name === "Facility") {
      this.chosenFacilityValues = value;
    } else if (name === "progress") {
      this.chosenRoleValues = value;
    }
    this.applyStaffFilters(); // call filtering logic
  }

  applyStaffFilters() {
    let filtered = [...this.staffList];

    if (this.chosenFacilityValues.length > 0) {
      filtered = filtered.filter((staff) =>
        this.chosenFacilityValues.includes(staff.facilityName)
      );
    }

    if (this.chosenRoleValues.length > 0) {
      filtered = filtered.filter((staff) => {
        const roles = staff.role?.split(";") || [];
        return roles.some((role) => this.chosenRoleValues.includes(role));
      });
    }

    this.filteredStaffList = filtered;
    this.totalRecords = filtered.length;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.pageNumber = 1;
    this.paginationHelper();
  }

  @track isAllStaffSelected = false;
  @track selectedStaffIds = [];
  selectedStaffSet = new Set();

  handleStaffSelection(event) {
    const staffId = event.target.dataset.id;
    const isChecked = event.target.checked;

    this.filteredStaffList = this.filteredStaffList.map((staff) => {
      if (staff.Id === staffId) {
        staff.isSelected = isChecked;
      }
      return staff;
    });

    this.recordsToDisplay = this.filteredStaffList.slice(
      (this.pageNumber - 1) * this.pageSize,
      this.pageNumber * this.pageSize
    );

    if (isChecked) {
      this.selectedStaffSet.add(staffId);
    } else {
      this.selectedStaffSet.delete(staffId);
      this.isAllStaffSelected = false;
    }

    // ✅ Convert Set to Array for reactivity
    this.selectedStaffIds = Array.from(this.selectedStaffSet);
  }

  toggleSelectAllStaff(event) {
    const checked = event.target.checked;
    this.isAllStaffSelected = checked;
    this.selectedStaffSet = new Set();

    this.filteredStaffList = this.filteredStaffList.map((staff) => {
      staff.isSelected = checked;
      if (checked) {
        this.selectedStaffSet.add(staff.Id);
      }
      return staff;
    });

    // ✅ Convert Set to Array for reactivity
    this.selectedStaffIds = Array.from(this.selectedStaffSet);
  }

  handleGlobalGrantAccess() {
    const staffIds = Array.from(this.selectedStaffIds);

    if (staffIds.length === 0) {
      this.showToast(
        "Error",
        "Select at least one staff and one form",
        "error"
      );
      return;
    }

    // 🔁 Replace this with your actual form logic
    const formIds = this.selectedForms ? Array.from(this.selectedForms) : [];

    if (formIds.length === 0) {
      this.showToast("Error", "Select at least one form", "error");
      return;
    }

    grantAccessToStaff({ staffIds, formIds })
      .then(() => {
        this.showToast(
          "Success",
          "Access granted to selected staff!",
          "success"
        );
        this.loadStaffList();
      })
      .catch((error) => {
        console.error("❌ Error granting access:", error);
        this.showToast("Error", "Failed to grant access.", "error");
      });
  }
  handleBulkGrantAccessClick() {
    const staffIds = Array.from(this.selectedStaffIds);

    if (staffIds.length === 0) {
      this.showToast(
        "Error",
        "Please select at least one staff to grant access.",
        "error"
      );
      return;
    }

    console.log("🔹 Opening Bulk Grant Access for Staff:", staffIds);

    // Reset state
    this.selectedFormId = null;
    this.availableForms = [];
    this.filteredAvailableForms = [];
    this.searchQuery = "";
    this.selectedStaffId = null; // Clear single mode
    this.isBulkGrantMode = true;

    getAvailableForms()
      .then((data) => {
        console.log(
          "🔍 getAvailableForms() returned:",
          data.map(
            (f) => `${f.Name__c} (${f.Id}) - Default: ${f.DefaultIncident__c}`
          )
        );

        // 🔍 Find the default incident register form from available forms
        const defaultForm = data.find(
          (f) =>
            f.Name__c?.trim() === "Default Incident Register" &&
            f.DefaultIncident__c === true
        );

        if (defaultForm) {
          this.selectedFormId = defaultForm.Id;
          console.log(
            "✅ Selected Default Form for bulk:",
            this.selectedFormId
          );
        } else {
          console.warn(
            "⚠️ No default form found. Nothing pre-selected for bulk."
          );
        }

        // Map availableForms and mark selection
        this.availableForms = data.map((form) => ({
          ...form,
          isSelected: form.Id === this.selectedFormId
        }));

        this.filteredAvailableForms = [...this.availableForms];

        console.log("📋 Available Forms (bulk):", this.availableForms);

        // Finally, open the popup
        this.isGrantAccessPopupOpen = true;
      })
      .catch((error) => {
        console.error("❌ Error fetching available forms for bulk:", error);
      });
  }

  get selectedStaffNamesPreview() {
    if (!this.selectedStaffIds || this.selectedStaffIds.length === 0) {
      return "";
    }

    const names = this.selectedStaffIds
      .map((id) => {
        const staff = this.staffList.find((s) => s.Id === id);
        return staff
          ? `${staff.firstName || ""} ${staff.lastName || ""}`.trim()
          : null;
      })
      .filter(Boolean);

    return names.length < 5
      ? names.join(", ")
      : `${names.length} Staff Members`;
  }

async downloadPdf() {

  console.log("📥 Download PDF triggered.");

  if (!this.jsPDFLoaded || !this.jsPDFConstructor) {
    console.error("❌ jsPDF not ready yet.");
    this.showToast(
      "Please wait",
      "PDF engine still loading. Try again in 2 seconds.",
      "info"
    );
    return;
  }

  const doc = new this.jsPDFConstructor();

  console.log("📄 jsPDF instance created.");

  // ---------------------------------
  // 🖼️ Preload logo as Base64 FIRST
  // ---------------------------------
  let logoData = null;

  if (this.orgLogoUrl) {

    console.log("🖼️ Attempting to load logo from:", this.orgLogoUrl);

    try {

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = this.orgLogoUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      logoData = {
        base64: canvas.toDataURL("image/png"),
        width: img.width,
        height: img.height
      };

      console.log("✅ Logo converted to Base64");

    } catch (err) {

      console.warn("⚠️ Failed to preload logo:", err);
      logoData = null;

    }
  }

  // ---------------------------------
  // 📄 Draw PDF once
  // ---------------------------------
  await this.drawPdfContent(doc, logoData);

}



async drawPdfContent(doc, logoData) {

  console.log("🛠️ Drawing PDF content...");

  const headers = [];

  const rows = [];
  const imageRows = [];

  console.log("📊 Iterating over viewTableData...");
  this.viewTableData.forEach((item) => {

    if (!item.isPageBreak && item.isVisible) {

      const label = item.label;
      let value = "";

      // ------------------------
      // CHECKBOX
      // ------------------------
      if (item.isCheckbox) {

        const raw = item.rawValue;

        if (
          raw === true ||
          raw === "true" ||
          raw === 1 ||
          raw === "1"
        ) {
          value = "Yes";
        } else {
          value = "No";
        }

      }

      // ------------------------
      // RICH TEXT
      // ------------------------
      else if (item.isRichText) {

        const div = document.createElement("div");
        div.innerHTML = item.value;
        value =
          div.textContent ||
          div.innerText ||
          "";

      }

      // ------------------------
// UPLOAD FILE
// ------------------------
else if (item.isUploadFile) {

  const files =
    item.uploadedFiles ||
    item.value?.uploadedFiles ||
    [];

  if (files.length) {

    const fileNames = [];

    files.forEach(f => {

      if (!f || !f.url) return;

      fileNames.push(f.originalName);

      const ext =
        f.originalName
          ?.split(".")
          .pop()
          ?.toLowerCase();

      const isImage =
        ["jpg", "jpeg", "png", "gif", "webp"]
          .includes(ext);

      // 🖼️ images go below table
      if (isImage) {
        imageRows.push({
          label,
          url: f.url,
          name: f.originalName
        });
      }

    });

    // Table value = filenames
    value =
      fileNames.join(", ");

  } else {

    value = "No File";

  }

}



      // ------------------------
      // DROPDOWN
      // ------------------------
      else if (item.isDropdownField) {

        value =
          this.resolveDropdownLabel(item);

      }

      // ------------------------
      // DEFAULT
      // ------------------------
      else {

        value = item.value || "";

      }

      console.log(
        `📝 Adding Row -> Label: "${label}", Value: "${value}"`
      );

      rows.push([label, value]);

    }

    // ==============================
    // SECTION HEADER ROWS
    // ==============================
    if (item.isSectionHeader === true || item.title) {

      const parseStyle = (s = "") => {
        const out = {};
        s.split(";").forEach(p => {
          const [k, v] =
            p.split(":")
              .map(t => t && t.trim());
          if (k && v) out[k] = v;
        });
        return out;
      };

      const hexToRGB = (hex = "#000000") => {
        const h = hex.replace("#", "");
        const n = x =>
          parseInt(x, 16) || 0;
        return [
          n(h.slice(0, 2)),
          n(h.slice(2, 4)),
          n(h.slice(4, 6))
        ];
      };

      const weightToStyle = (w = "normal") => {
        const n =
          parseInt(w, 10);
        return
          (w === "bold" || n >= 600)
            ? "bold"
            : "normal";
      };

      const alignToHAlign = (a = "left") =>
        (a === "center" || a === "right")
          ? a
          : "left";

      const clean = (s) =>
        (s || "")
          .replace(/\u200B/g, "")
          .trim();

      const sectionText =
        clean(
          item.title ||
          item.headerText ||
          item.field?.text ||
          item.label ||
          ""
        ) || " ";

      const s =
        parseStyle(item.headerStyle || "");

      rows.push([
        {
          content: sectionText,
          colSpan: 2,
          styles: {
            font: "helvetica",
            fontSize:
              parseInt(
                (s["font-size"] || "16px"),
                10
              ) || 16,
            fontStyle:
              weightToStyle(
                s["font-weight"] || "600"
              ),
            halign:
              alignToHAlign(
                s["text-align"] || "left"
              ),
            textColor:
              hexToRGB(
                s.color || "#000000"
              ),
            fillColor:
              [245, 245, 245],
            cellPadding: 4,
            minCellHeight: 12,
          }
        },
        null
      ]);

      return;

    }

  });

  // ==============================
  // FORM SUMMARY
  // ==============================

  const formName =
    this.selectedForm?.Name__c || "N/A";

  const formType =
    this.selectedForm?.Form_Type__c || "N/A";

  const assignedTo =
    this.selectedForm
      ?.Incident_Assigned_Staff__r
      .Name || "N/A";

  const submissionDate =
    this.formatDate(
      this.selectedForm?.CreatedDate
    ) || "N/A";

  doc.setFillColor(230, 230, 250);
  doc.rect(12, 12, 186, 40, "F");

  const leftX = 16;
  let y = 22;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(44, 62, 80);
  doc.text("Form Summary", leftX, y);

  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(33, 33, 33);

  const lineGap = 7;

  const drawLabelValue = (label, value, yPos) => {

  // label bold
  doc.setFont("helvetica", "bold");
  doc.text(label, leftX, yPos);

  // value normal
  doc.setFont("helvetica", "normal");
  doc.text(value, leftX + 38, yPos);

};

// Row spacing
drawLabelValue("Form Name:", formName, y);
y += lineGap;

drawLabelValue("Form Type:", formType, y);
y += lineGap;

drawLabelValue("Assigned To:", assignedTo, y);
y += lineGap;

drawLabelValue("Submission Date:", submissionDate, y);

// 👇 extra bottom padding after summary
y += 10;


  // ==============================
  // 🖼️ LOGO TOP RIGHT
  // ==============================
  // ==============================
// 🖼️ LOGO TOP RIGHT — CENTERED
// ==============================

if (logoData?.base64) {

  const summaryTop = 12;
  const summaryHeight = 40;

  const maxLogoWidth = 55;
  const maxLogoHeight = 22;

  const imgRatio =
    logoData.width / logoData.height;

  let logoWidth = maxLogoWidth;
  let logoHeight = maxLogoWidth / imgRatio;

  if (logoHeight > maxLogoHeight) {
    logoHeight = maxLogoHeight;
    logoWidth = maxLogoHeight * imgRatio;
  }

  const pageWidth =
    doc.internal.pageSize.width;

  const logoX =
    pageWidth - logoWidth - 16;

  // 👇 vertical centering inside purple box
  const logoY =
    summaryTop +
    (summaryHeight - logoHeight) / 2;

  doc.addImage(
    logoData.base64,
    "PNG",
    logoX,
    logoY,
    logoWidth,
    logoHeight
  );

  console.log("🖼️ Logo drawn in summary");

}


  // ==============================
  // TABLE
  // ==============================

  console.log("📑 Rendering response table...");

  doc.autoTable({
    head: headers,
    body: rows,
    startY: 58,
    showHead: "never",
    styles: {
      fontSize: 10,
      cellPadding: 3
    }
  });

  // ==============================
  // IMAGES AFTER TABLE
  // ==============================

  if (imageRows.length > 0) {

    const lastTable =
      doc.lastAutoTable ||
      doc.previousAutoTable;

    let y =
      lastTable?.finalY
        ? lastTable.finalY + 10
        : 70;

    const pageHeight =
      doc.internal.pageSize.height;

    for (const img of imageRows) {

    try {

      if (!img.url) continue;

      const imageDataUrl =
        await this.getBase64ImageFromURL(
          img.url
        );

      // new page if needed
      if (y + 60 > pageHeight) {
        doc.addPage();
        y = 15;
      }

      // label above image
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(img.label, 14, y);

      y += 6;

      // draw image
      doc.addImage(
        imageDataUrl,
        "JPEG",
        14,
        y,
        60,
        40
      );

      y += 45;

      // filename under image
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(img.name || "", 14, y);

      y += 12;

    } catch (error) {

      console.error(
        "❌ Failed to render image:",
        img.url,
        error
      );

      // fallback: filename only
      doc.setFontSize(10);
      doc.text(
        img.name || "Attachment",
        14,
        y
      );

      y += 10;
    }

}

  }

  // ==============================
  // SAVE
  // ==============================

  const fileName =
    (this.selectedForm?.Name__c || "Form")
      .replace(/[\\/:*?"<>|]/g, "_") +
    ".pdf";

  doc.save(fileName);

  console.log("✅ PDF download complete!");

}


  resolveDropdownLabel(item) {

  // 1️⃣ Multi-select prepared earlier
  if (item.selectedValues) {
    return item.selectedValues;
  }

  // 2️⃣ Explicit selected label
  if (item.field?.selectedLabel) {
    return item.field.selectedLabel;
  }

  // 3️⃣ Scan options array
  if (Array.isArray(item.field?.options)) {

    const selected = item.field.options.filter(
      o =>
        o.isSelected ||
        o.value === item.field.value ||
        o.label === item.field.value
    );

    if (selected.length) {
      return selected.map(o => o.label).join(", ");
    }
  }

  // 4️⃣ Fallback
  return item.value || "";
}

  async getBase64ImageFromURL(url) {
  const base64 = await fetchImageAsBase64({ url });
  return "data:image/jpeg;base64," + base64;
}

  @track formattedSubmissionDate = "";

  get formattedSubmissionDate() {
    if (!this.selectedForm?.CreatedDate) return "N/A";
    return new Date(this.selectedForm.CreatedDate).toLocaleDateString("en-GB");
  }

async handleDownloadFile(event) {

  try {

    const url =
      event.currentTarget.dataset.url;

    const fileName =
      event.currentTarget.dataset.name || "download";

    console.log("⬇️ Download clicked:", url);

    if (!url) {
      this.showToast(
        "Error",
        "File URL missing.",
        "error"
      );
      return;
    }

    // ⬇️ Fetch file
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Failed to fetch file: " + response.status
      );
    }

    const blob = await response.blob();

    // 🔥 Trigger browser download
    const downloadUrl =
      URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 🧹 cleanup
    URL.revokeObjectURL(downloadUrl);

  } catch (err) {

    console.error("❌ Download failed:", err);

    this.showToast(
      "Error",
      "Unable to download file.",
      "error"
    );
  }
}



  handleDownloadCSV() {

  if (!this.viewTableData || !this.viewTableData.length) {
    console.warn("⚠️ No data available to export.");
    return;
  }

  const rows = [];
  rows.push(["Field Name", "Value"]);

  this.viewTableData.forEach((item) => {

    // ==============================
    // 🚫 Skip hidden rows
    // ==============================
    if (!item.isVisible) {
      return;
    }

    // ==============================
    // 📄 PAGE BREAK ROW
    // ==============================
    if (item.isPageBreak) {

      rows.push([
        `--- Page ${item.pageNumber} ---`,
        ""
      ]);

      return;
    }

    // ==============================
    // 🟡 SECTION HEADER
    // ==============================
    if (item.isSectionHeader) {

      const headerText =
        item.title ||
        item.headerText ||
        "";

      rows.push([
        headerText,
        ""
      ]);

      return;
    }

    const label = item.label || "";
    let value = "";

    // ==============================
    // CHECKBOX
    // ==============================
    if (item.isCheckbox) {

      value =
        item.value === "action:approval"
          ? "Yes"
          : "No";
    }

    // ==============================
    // RICH TEXT
    // ==============================
    else if (item.isRichText) {

      const div = document.createElement("div");
      div.innerHTML = item.value;

      value =
        div.textContent ||
        div.innerText ||
        "";
    }

    // ==============================
    // UPLOAD FILE
    // ==============================
    else if (item.isUploadFile) {

      if (
        Array.isArray(item.uploadedFiles) &&
        item.uploadedFiles.length
      ) {

        value = item.uploadedFiles
          .map(f =>
            f.originalName ||
            f.url ||
            ""
          )
          .join(" | ");

      } else {

        value = "No File";
      }
    }

    // ==============================
    // DEFAULT
    // ==============================
    else {

      value = item.value || "";
    }

    // ==============================
    // 🛡️ Excel numeric safety
    // ==============================
    if (
      typeof value === "string" &&
      !isNaN(value) &&
      value.length > 10
    ) {
      value = `'${value}`;
    }

    // ==============================
    // 🧹 Clean smart chars
    // ==============================
    value = value
      .toString()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2014/g, "--")
      .trim();

    rows.push([label, value]);

  });

  // ==============================
  // 📦 Convert to CSV
  // ==============================

  const csvContent = rows
    .map(row =>
      row.map(cell =>
        `"${(cell || "").replace(/"/g, '""')}"`
      ).join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const link = document.createElement("a");

  const formName =
    this.selectedForm?.Name__c
      ?.replace(/[\\/:*?"<>|]/g, "_") ||
    "Form";

  link.href = URL.createObjectURL(blob);
  link.download = `${formName}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log("✅ CSV export complete!");
}


  @track showFormHistoryModal = false;

  appendFormHistory(actionType, content) {
    appendFormHistoryEntry({
      formId: this.selectedForm.Id,
      actionType,
      content
    })
      .then(() => {
        return getFormDetailsById({ formId: this.selectedForm.Id });
      })
      .then((result) => {
        this.selectedForm = result;
        this.renderFormHistoryUI();
      })
      .catch((error) => {
        console.error("❌ Error appending form history:", error);
      });
  }
  handleFormHistoryClick(event) {
  const formId = event.currentTarget.dataset.id;

  console.log("📝 Form History Clicked");
  console.log("📌 Extracted Form ID:", formId);

  getFormDetailsById({ formId })
    .then((result) => {
      console.log("✅ Form Details Retrieved:", result);

      let historyEntries = [];

      if (result.History_Log__c) {
        console.log("📜 Raw History Log:", result.History_Log__c);
        try {
          historyEntries = JSON.parse(result.History_Log__c);
          console.log("✅ Parsed History Entries:", historyEntries);
        } catch (parseErr) {
          console.error("❌ Error parsing History_Log__c:", parseErr);
        }
      }

      // 🚫 NO history → toast + exit
      if (!historyEntries.length) {
        this.showToast(
          "No History",
          "No edit history available for this form.",
          "info"
        );
        return;
      }

      // ✅ History exists → open modal
      this.selectedForm = {
        ...result,
        ParsedHistory: historyEntries
      };

      this.showFormHistoryModal = true;
    })
    .catch((error) => {
      console.error("❌ Error loading form for history:", error);
      this.showToast("Error", "Failed to load form history", "error");
    });
}


  get groupedFormHistory() {
    const logs = JSON.parse(this.selectedForm?.History_Log__c || "[]");
    const grouped = {};

    logs.forEach((entry) => {
      const [month, day, year, ...timeParts] = entry.timestamp.split(" ");
      const date = `${month} ${day} ${year}`;
      const time = timeParts.join(" ");

      const initials = entry.user
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase();

      const enriched = { ...entry, date, time, initials };

      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(enriched);
    });

    return Object.entries(grouped).map(([date, entries]) => ({
      date,
      entries
    }));
  }

  closeFormHistory() {
    this.showFormHistoryModal = false;
  }

  handleAccessButtonClick() {
    console.log("🔘 Access button clicked");

    this.paginatedFormResponses = false;
    this.showFormsAccess = true;
    this.hideFormAccessTable = false;
    this.hideSearchAndActions = true;

    // ✅ Logging related flags
    console.log("📌 isFormSelected:", this.isFormSelected);
    console.log("📌 hideFormAccessTable:", this.hideFormAccessTable);
    console.log("📌 showFormsAccess (after update):", this.showFormsAccess);
    console.log(
      "📌 paginatedFormResponses (after update):",
      this.paginatedFormResponses
    );
  }

  @track hideSearchAndActions = false;
  handleBackFromAccess() {
    this.showFormsAccess = false;
    this.hideSearchAndActions = false;
    this.hideFormAccessTable = true;
    this.updatePaginatedFormResponses();
  }

  @track isCreatedTabSelected = false;
  @track isDesignTabSelected = true;
  @track isDraftTabSelected = false;
  @track receivedLayoutData = null;
  @track isSubmittedTabSelected = false;
  @track renderKey = 0;
  @track shouldRenderFormRender = true;

  get designTabClass() {
    return this.isDesignTabSelected ? "menu-item1" : "menu-item";
  }

  get createdTabClass() {
    return this.isCreatedTabSelected ? "menu-item1" : "menu-item";
  }

  get draftTabClass() {
    return this.isDraftTabSelected ? "menu-item1" : "menu-item";
  }
  get submitTabClass() {
    return this.isSubmittedTabSelected ? "menu-item1" : "menu-item";
  }

  handleConfirmedTabSwitch(event) {
    const tab = event.detail.tab;
    if (tab === "draft") {
      this.activateDraftTab();
    } else if (tab === "created") {
      this.activateCreatedTab();
    }
  }

  handleDraftTab() {
    console.log("[handleDraftTab] Tab clicked.");

    const formCreateComponent = this.template.querySelector("c-form-create-incident");

    if (!formCreateComponent) {
      console.log(
        "[handleDraftTab] No formCreateComponent found. Proceeding with tab switch."
      );
      this.activateDraftTab();
      return;
    }

    const hasUnsaved = formCreateComponent.hasUnsavedChanges();
    console.log(
      `[handleDraftTab] formCreateComponent found. Unsaved changes: ${hasUnsaved}`
    );

    if (hasUnsaved) {
      console.log(
        "[handleDraftTab] Showing confirmation popup for unsaved changes."
      );
      formCreateComponent.triggerUnsavedChangesPopup("draft");
    } else {
      console.log(
        "[handleDraftTab] No unsaved changes. Proceeding with tab switch."
      );
      this.activateDraftTab();
    }
  }

  handleCreatedTab() {
    console.log("[handleCreatedTab] Tab clicked.");

    const formCreateComponent = this.template.querySelector("c-form-create-incident");

    if (!formCreateComponent) {
      console.log(
        "[handleCreatedTab] No formCreateComponent found. Proceeding with tab switch."
      );
      this.activateCreatedTab();
      return;
    }

    const hasUnsaved = formCreateComponent.hasUnsavedChanges();
    console.log(
      `[handleCreatedTab] formCreateComponent found. Unsaved changes: ${hasUnsaved}`
    );

    if (hasUnsaved) {
      console.log(
        "[handleCreatedTab] Showing confirmation popup for unsaved changes."
      );
      formCreateComponent.triggerUnsavedChangesPopup("created");
    } else {
      console.log(
        "[handleCreatedTab] No unsaved changes. Proceeding with tab switch."
      );
      this.activateCreatedTab();
    }
  }

  activateDraftTab() {
    this.isCreatedTabSelected = false;
    this.isDesignTabSelected = false;
    this.isDraftTabSelected = true;
    this.isSubmittedTabSelected = false;
    this.receivedLayoutData = null;
  }

  activateCreatedTab() {
    this.isCreatedTabSelected = true;
    this.isDesignTabSelected = false;
    this.isDraftTabSelected = false;
    this.isSubmittedTabSelected = false;
    this.receivedLayoutData = null;
    this.renderKey++;
    this.shouldRenderFormRender = false;
    this.viewModeFromParent = true;
  }

  handleDesignTab() {
    this.isDesignTabSelected = true;
    this.isCreatedTabSelected = false;
    this.isSubmittedTabSelected = false;
    this.isDraftTabSelected = false;
    this.shouldRenderFormRender = false;
    setTimeout(() => {
      this.renderKey++;
      this.shouldRenderFormRender = true;
      console.log("🔁 Switched to Design New Forms");
    }, 0);
  }

  handleSubmitTab() {
    this.isCreatedTabSelected = false;
    this.isDesignTabSelected = false;
    this.isDraftTabSelected = false;
    this.isSubmittedTabSelected = true;
    this.receivedLayoutData = null;
    this.viewModeFromParent = false;
  }

  
subscribeToMessageChannel() {

    if (this.subscription) return;

    this.subscription = subscribe(
        this.messageContext,
        LAYOUT_MESSAGE_CHANNEL,
        message => this.handleLayoutEditMessage(message)
    );

    console.log('📡 FormIncidentV2 subscribed to LayoutMessageChannel');
}

handleLayoutEditMessage(message) {

    console.log('📩 Incident parent received edit message:', message);

    if (message.actionType === 'edit') {

        this.isDesignTabSelected = true;
        this.isDraftTabSelected = false;
        this.isPublishedTabSelected = false;

        this.receivedLayoutData = message;

        this.shouldRenderIncidentDesigner = false;

        setTimeout(() => {
            this.renderKey++;
            this.shouldRenderIncidentDesigner = true;
        }, 0);
    }
}


async handleDeleteUploadedFile(evt) {
  evt.preventDefault();
  console.log("[PARENT DELETE] called");

  const cellId = evt.currentTarget?.dataset?.cellid;
  const index = Number(evt.currentTarget?.dataset?.index);
  const keyFromBtn = evt.currentTarget?.dataset?.key; // preferred
  const fileIdFromBtn = evt.currentTarget?.dataset?.fileid;
  const urlFromBtn = evt.currentTarget?.dataset?.url;

  if (!cellId || Number.isNaN(index)) return;

  // Helper: find key/url from current JSON if not provided
  const deriveFromCell = (cell) => {
    const f = cell?.field || {};
    const key =
      keyFromBtn ||
      (Array.isArray(f?.meta?.uploadedFiles) ? f.meta.uploadedFiles[index]?.key : null) ||
      (Array.isArray(f?.s3Key) ? f.s3Key[index] : null);

    const url =
      urlFromBtn ||
      (Array.isArray(f?.meta?.uploadedFiles) ? f.meta.uploadedFiles[index]?.url : null) ||
      (Array.isArray(f?.urls) ? f.urls[index] : null) ||
      (Array.isArray(f?.value) ? f.value[index] : null);

    const fileId =
      fileIdFromBtn ||
      (Array.isArray(f?.meta?.uploadedFiles) ? f.meta.uploadedFiles[index]?.fileId : null);

    return { key, url, fileId };
  };

  // Find the current cell snapshot (from tableRows first)
  let snapshot = null;
  (this.tableRows || []).some((row) =>
    row.cells.some((c) => {
      if (c.id === cellId) {
        snapshot = c;
        return true;
      }
      return false;
    })
  );

  if (!snapshot) {
    console.warn("[PARENT DELETE] cell not found:", cellId);
    return;
  }

  const { key, url } = deriveFromCell(snapshot);

  if (!key) {
    console.warn("[PARENT DELETE] Missing key; cannot delete from AWS. cellId:", cellId, "index:", index);
    return;
  }

  // Optional: you can set a local "deleting" state here if you want (UI spinner)
  // but keeping minimal since you said production.

  try {
    const resp = await fetch(ENDPOINTS.delete, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key })
    });

    const text = await resp.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    if (!resp.ok) throw new Error(json?.error || `Delete failed ${resp.status}: ${text}`);

    console.log("[PARENT DELETE] AWS delete success:", json);

    // Remove from JSON arrays consistently (by index / key / url)
    const applyRemoval = (cell) => {
      if (cell.id !== cellId || cell.field?.dataType !== "Upload File") return cell;

      const f = { ...(cell.field || {}) };

      const uploaded = Array.isArray(f.meta?.uploadedFiles) ? [...f.meta.uploadedFiles] : [];
      const nextUploaded = uploaded.filter((u, i) => {
        if (i === index) return false;
        if (key && u?.key === key) return false;
        if (url && u?.url === url) return false;
        return true;
      });

      const spliceSafe = (arr) => {
        const a = Array.isArray(arr) ? [...arr] : [];
        if (a.length > index) a.splice(index, 1);
        // also remove any exact matches if present
        return a.filter((x) => (key ? x !== key : true)).filter((x) => (url ? x !== url : true));
      };

      const nextValue = spliceSafe(f.value);
      const nextUrls = spliceSafe(f.urls);
      const nextDownload = spliceSafe(f.downloadLink);
      const nextKeys = spliceSafe(f.s3Key);

      const nextNames = nextUploaded.map((u) => u?.originalName).filter(Boolean);

      return {
        ...cell,
        field: {
          ...f,
          value: nextValue,
          urls: nextUrls,
          downloadLink: nextDownload,
          s3Key: nextKeys,
          fileName: nextNames.join(", "),
          contentType:
            nextValue.length === 1 ? (nextUploaded[0]?.type || null) : (nextValue.length ? "multiple" : null),
          meta: {
            ...(f.meta || {}),
            uploadedFiles: nextUploaded
          }
        }
      };
    };

    // Update tableRows
    this.tableRows = (this.tableRows || []).map((row) => ({
      ...row,
      cells: row.cells.map(applyRemoval)
    }));

    // Update stepPagedRows
    this.stepPagedRows = (this.stepPagedRows || []).map((page) =>
      page.map((row) => ({
        ...row,
        cells: row.cells.map(applyRemoval)
      }))
    );
  } catch (e) {
    console.error("[PARENT DELETE] error:", e);
    // Optional: show toast
    // this.showToast("Delete failed", e.message, "error");
  }
}
async uploadResponseJsonToAws(rows, mode = "create", existingAwsJson = null) {

  let existingKey = null;

  if (existingAwsJson) {
    try {
      existingKey = JSON.parse(existingAwsJson)?.key;
    } catch {}
  }

  // temporarily override title for responses
  const originalTitle = this.formTitle;
  this.formTitle = `response-${this.selectedResponseId || Date.now()}`;

  const result = await this.uploadFormJsonToAws(
    rows,
    "Responses",
    existingKey
  );

  this.formTitle = originalTitle;

  return result;
}

async uploadFormJsonToAws(finalRows, folderType, existingKey = null) {

  if (!folderType) {
  throw new Error(
    "[FormJSON] folderType is required (DraftForms / PublishedForms / etc)"
  );
}


  try {
    console.log("🟦 [FormJSON] Starting uploadFormJsonToAws");

    const jsonStr = JSON.stringify(finalRows);
    console.log("📏 [FormJSON] JSON length:", jsonStr.length);

    const blob = new Blob(
      [jsonStr],
      { type: "application/json" }
    );

    console.log("📦 [FormJSON] Blob created:", {
      size: blob.size,
      type: blob.type
    });

    const dateStr = this.formatToday();
const safeTitle = this.sanitizeFileName(this.formTitle);

const key =
  existingKey ||
  `CustomisableIR/${this.orgid}/${dateStr}/${folderType}/${safeTitle}.json`;



    console.log("🔑 [FormJSON] Generated S3 key:", key);

    console.log("📡 [FormJSON] Requesting presigned URL:", {
      bucketName: "docimgupld",
      key,
      contentType: "application/json"
    });

    const presign = await getPresignedUrl({
      bucketName: "docimgupld",
      key,
      contentType: "application/json"
    });

    console.log("📨 [FormJSON] Presign response:", presign);

    if (!presign?.uploadUrl || !presign?.key) {
      console.error("❌ [FormJSON] Invalid presign response", presign);
      throw new Error("Presign failed for form JSON");
    }

    console.log("🚀 [FormJSON] Uploading JSON to S3 via PUT:", presign.uploadUrl);

    const putResp = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: blob
    });

    console.log(
      "📤 [FormJSON] PUT response:",
      putResp.status,
      putResp.statusText
    );

    if (!putResp.ok) {
      console.error("❌ [FormJSON] S3 PUT failed", {
        status: putResp.status,
        statusText: putResp.statusText
      });
      throw new Error("S3 upload failed");
    }

    const awsPayload = {
      bucket: "docimgupld",
      key: presign.key,
      url: `https://docimgupld.s3.amazonaws.com/${presign.key}`,
      contentType: "application/json",
      fileName: "form.json",
      version: "aws-v1"
    };

    console.log("✅ [FormJSON] Upload SUCCESS. AWS payload:", awsPayload);

    return awsPayload;

  } catch (err) {
    console.error("🔥 [FormJSON] uploadFormJsonToAws FAILED:", err);
    throw err; // bubble up to caller
  }
}
sanitizeFileName(name) {
  return (name || "form")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.]/g, "");
}

formatToday() {
  const d = new Date();

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}


}