import { LightningElement, track, wire, api } from "lwc";
import getForms from "@salesforce/apex/FormController.getForms";
import saveFormResponse from "@salesforce/apex/FormController.saveFormResponse";
import updateFormResponse from "@salesforce/apex/FormController.updateFormResponse";
import getFormResponses from "@salesforce/apex/FormController.getFormResponses";
import deleteFormResponse from "@salesforce/apex/FormController.deleteFormResponse";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import CURRENT_USER_ID from "@salesforce/user/Id";
import getUserAccessDetails from "@salesforce/apex/UserAccessController.getUserAccessDetailsforAccessManager1";
import getParticipants from "@salesforce/apex/FormController.getParticipants";
import getEmployeeData from "@salesforce/apex/FormController.getEmployeeData";
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
import getAvailableForms from "@salesforce/apex/FormController.getAvailableForms";
// import grantAccessToParticipant from '@salesforce/apex/FormController.grantAccessToParticipant';
import getAccessibleForms from "@salesforce/apex/FormController.getAccessibleForms";
import getFormsByClient from "@salesforce/apex/FormController.getFormsByClient";
import getFormResponsesByClient from "@salesforce/apex/FormController.getFormResponsesByClient";
import uploadFileToSalesforce from "@salesforce/apex/FormController.uploadFileToSalesforce";
import { getRecord } from "lightning/uiRecordApi";
import USER_FIRSTNAME from "@salesforce/schema/User.FirstName";
import USER_LASTNAME from "@salesforce/schema/User.LastName";
import USER_EMAIL from "@salesforce/schema/User.Email";
import USER_ROLE from "@salesforce/schema/User.User_Role__c";
import USER_TYPE from "@salesforce/schema/User.User_Type__c";
import USER_ORG_NAME from "@salesforce/schema/User.Organization_Name__c";
import getFacilityByUserEmail from "@salesforce/apex/FormController.getFacilityByUserEmail";
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from "@salesforce/resourceUrl/jspdf";
import autoTable from "@salesforce/resourceUrl/autotable";
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import updateAwsFields from "@salesforce/apex/FormController.updateAwsFields";
import getPresignedUrl from "@salesforce/apex/WordEditorController.getPresignedUrl";
import getUpdatePresignedUrl from "@salesforce/apex/WordEditorController.getUpdatePresignedUrl";
import { publish, MessageContext } from "lightning/messageService";
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";
import getClientEmailByClientId from "@salesforce/apex/FormController.getClientEmailByClientId";
import checkFormSignatureStatus from "@salesforce/apex/FormController.checkFormSignatureStatus";
import getOrgLogo from "@salesforce/apex/IncidentRegisterControllerV2.getOrgLogo";



import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
let jsPDFLoaded = false;

import Form3D from "@salesforce/resourceUrl/Form3D";

import StaticForms from "@salesforce/resourceUrl/Static_Forms";

const FORM_IMAGE_1 = `${StaticForms}/form1.png`;
const FORM_IMAGE_2 = `${StaticForms}/form2.png`;

const formImages = [FORM_IMAGE_1, FORM_IMAGE_2];
import getParticipantsByOrgId from "@salesforce/apex/FormController.getParticipantsByOrgId";

const toArray = (v) => (Array.isArray(v) ? v : v != null ? [v] : []);
const isImageUrl = (u) =>
  typeof u === "string" &&
  (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(u) ||
    u.includes("rendition=ORIGINAL_JPG"));

    const AWS_BASE = "https://tesseractapps.com"; 
const ENDPOINTS = {
  delete: `${AWS_BASE}/delete-file`
};


export default class FormRender extends LightningElement {
  @track forms = [];
  @track allForms = [];
  @track selectedForm;
  @track tableRows = [];
  @track isFormSelected = false;
  @track isViewModeON = true;
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
  @track showFormsAccess = false;
  @track facilityId;
  userInfoLoaded = false;
  participantsLoaded = false;
  @track currentPageIndex = 0;
  @track pagedRows = [];
  @track isIncidentRegisterSelected = false;
  @track isCustomisableFormSelected = true;
  @track facilityPreferredName;
  @track participantPreferredName;
  @track dataTypes = [
    { id: "1", label: "Text Field" },
    { id: "2", label: "Number Field" },
    { id: "3", label: "Date Field" },
    { id: "4", label: "Time Field" },
    { id: "5", label: "Checkbox Field" },
    { id: "6", label: "Dropdown Field" },
    { id: "7", label: "URL Field" }
  ];

@track isSubmitConfirmModalOpen = false;
@track submitFinalStatus = null;


  @track orgid;
  @track orgLogoUrl = "";

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
  
    get logoUrl() {
      return this.tLogoUrl;
    }
  
    get imageUrl() {
      return this.tImageUrl;
    }

    @wire(MessageContext) context;


  connectedCallback() {
    console.log("📌 Received Org ID in Chatter:", this.orgid);
    console.log("🔹 Received Client ID:", this.clientId);

    // ✅ Hide Participants Table if clientId is present
    if (this.clientId && this.clientId.trim() !== "") {
      this.participantAccess = false;
      console.log(
        "🚫 Hiding Participants Table - Form is Specific to a Client"
      );
    } else {
      this.participantAccess = true;
      console.log("✅ Showing Participants Table - No Specific Client ID");
      console.log("📧 Sending User Email to Apex:", USER_EMAIL);
      // 🔄 Fetch facility and trigger wire
    }

    
      // =====================================================
      // 🏢 Organisation Details (UNCHANGED + LOGO ADDED)
      // =====================================================
      orgDetails()
        .then((result) => {
          if (result && result.Id) {
    
            this.orgid = result.Id;
    
            console.log("📌 Received Org ID in Chatter:", this.orgid);
    
            // EXISTING FUNCTIONALITY (UNCHANGED)
            this.fetchParticipantsByOrgId(this.orgid);
    
            this.facilityPreferredName =
              result.Facility_Preferred_Name_Formula__c;
    
            this.participantPreferredName =
              result.Participant_Preferred_Name_Formula__c;
    
            // =====================================================
            // 🖼️ NEW — LOAD ORG LOGO (FROM INCIDENT V2)
            // =====================================================
            getOrgLogo({ orgId: this.orgid })
              .then((src) => {
    
                console.log("🏷️ Org Logo SRC:", src);
    
                if (!src) {
                  console.warn("⚠️ Org logo not found");
                  this.orgLogoUrl = "";
                  return;
                }
    
                // decode html entities (&amp; etc)
                const txt = document.createElement("textarea");
                txt.innerHTML = src;
                const decodedSrc = txt.value;
    
                // convert relative → absolute
                this.orgLogoUrl = decodedSrc.startsWith("/")
                  ? window.location.origin + decodedSrc
                  : decodedSrc;
    
                console.log("✅ Final orgLogoUrl:", this.orgLogoUrl);
              })
              .catch((err) => {
                console.error("❌ Failed to load Org Logo:", err);
                this.orgLogoUrl = "";
              });
    
          } else {
            console.warn("⚠️ No organisation found for current user.");
          }
        })
        .catch((error) => {
          console.error("❌ Failed to get organisation details:", error);
        });
    }




async handleTsignFromForms(event) {
  event.preventDefault?.();
  event.stopPropagation?.();

  try {
    const responseId = event.currentTarget.dataset.id;
    const resp = (this.formResponses || []).find((r) => r.Id === responseId);

    const signatureUrlFromDataset = event.currentTarget.dataset.signatureUrl;
    const resolvedSignatureUrl = signatureUrlFromDataset || resp?.signatureUrl;

    // ✅ SIGNED: open/download
    if (resolvedSignatureUrl) {
      window.open(resolvedSignatureUrl, "_blank");
      return;
    }

    // ❌ NOT SIGNED: prepare data and show confirm modal
    let awsUrl = event.currentTarget.dataset.url;
    if (!awsUrl) awsUrl = resp?.AWS_Url__c;

    if (!awsUrl) {
      this.showToast(
        "Missing PDF",
        "Please submit the form to generate the PDF before using TSign.",
        "warning"
      );
      return;
    }

    const clientId = resp?.Client_Id__c;
    let clientEmail = "";
    if (clientId) {
      clientEmail = await getClientEmailByClientId({ clientId });
    }

    // store for confirmation step
    this.pendingTsignResponseId = responseId;
    this.pendingTsignAwsUrl = awsUrl;
    this.pendingTsignClientEmail = clientEmail || "";

    this.isTsignConfirmModalOpen = true;
  } catch (e) {
    console.error("❌ handleTsignFromForms failed:", e);
    this.showToast("Error", "Failed to open TSign.", "error");
  }
}



isTsignConfirmModalOpen = false;
pendingTsignResponseId;
pendingTsignAwsUrl;
pendingTsignClientEmail;


closeTsignConfirmModal() {
  this.isTsignConfirmModalOpen = false;
  this.pendingTsignResponseId = null;
  this.pendingTsignAwsUrl = null;
  this.pendingTsignClientEmail = null;
}

confirmAndLaunchTsign() {
  try {
    // close modal first (better UX)
    this.isTsignConfirmModalOpen = false;

    const message = {
      source: "FORM",
      tsignreUrl: this.pendingTsignAwsUrl,
      recordId: this.pendingTsignResponseId,
      clientEmail: this.pendingTsignClientEmail || ""
    };

    publish(this.context, TSIGN_MESSAGE_CHANNEL, message);
    this.dispatchEvent(new CustomEvent("redirecttsign"));

    // cleanup
    this.pendingTsignResponseId = null;
    this.pendingTsignAwsUrl = null;
    this.pendingTsignClientEmail = null;
  } catch (e) {
    console.error("❌ confirmAndLaunchTsign failed:", e);
    this.showToast("Error", "Failed to launch TSign.", "error");
  }
}





  fetchParticipantsByOrgId(orgid) {
    console.log("✅ All 4567890Participants:");
    getParticipantsByOrgId({ orgid })
      .then((result) => {
        console.log("✅ All Participants:", result);
        this.allparticipants = result;
      })
      .catch((error) => {
        console.error("❌ Error loading participants:", error);
      });
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

    // ✅ Load accessible forms if clientId is available
    if (this.clientId && !this.selectedParticipantId) {
      console.log("🔹 Received Client ID:", this.clientId);
      this.selectedParticipantId = this.clientId;

      getAccessibleForms({ participantId: this.clientId })
        .then((formRecords) => {
          if (!formRecords || formRecords.length === 0) {
            this.forms = [];
            this.filteredForms = [];
            console.log("⚠️ No accessible forms for this participant.");
          } else {
            // 🛠 Build miniRows here immediately
            this.forms = formRecords.map((form) => {
              let miniRows = [];
              try {
                if (form.Form_JSON__c) {
                  //const parsed = JSON.parse(form.Form_JSON__c);

                  let parsed;

                  const raw = form.Form_JSON__c;
                  if (raw) {
                    const tmp = JSON.parse(raw);

                    if (tmp?.url && tmp?.key) {
                      // AWS-backed → cannot build miniRows unless fetched
                      console.warn("Mini preview skipped (AWS-backed form):", form.Name__c);
                      parsed = [];
                    } else {
                      parsed = tmp;
                    }
                  }

                  miniRows = parsed.map((row, rowIndex) => ({
                    index: rowIndex,
                    cells: row.cells.map((cell, colIndex) => ({
                      label: cell.field?.label || " ",
                      index: colIndex
                    }))
                  }));
                }
              } catch (e) {
                console.error(
                  "❌ Error parsing Form_JSON__c for mini view:",
                  form.Name__c,
                  e
                );
              }
              const creatorName = form?.CreatedBy?.Name || "";
              const formattedCreated = this.viewFormatCreatedDate(
                form.CreatedDate
              );
              return {
                ...form,
                miniRows,
                formImageUrl: this.getRandomFormImage(),
                CreatedByName: creatorName,
                FormattedCreatedDate: formattedCreated
              };
            });

            this.filteredForms = this.forms;
            console.log(
              "✅ Forms loaded with mini views:",
              this.filteredForms.map((f) => f.Name__c)
            );
          }
        })
        .catch((error) => {
          console.error(
            "❌ Error fetching accessible forms by clientId:",
            error
          );
        });
    }
    if (!this.jsPDFInitialized) {
      Promise.all([loadScript(this, jsPDF), loadScript(this, autoTable)])
.then(() => {
    const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;

    console.log("🔎 jsPDFConstructor:", jsPDFConstructor);
    console.log("🔎 window.jspdf:", window.jspdf);
    console.log("🔎 window.jsPDF:", window.jsPDF);

    // ---- jsPDF version ----
    const jspdfVersion =
        jsPDFConstructor?.version ||
        window.jspdf?.jsPDF?.version ||
        "UNKNOWN";

    console.log("📄 jsPDF version detected:", jspdfVersion);

    // ---- autoTable version ----
    const autoTableVersion =
        window.jspdfAutoTable?.version ||
        window.jspdf?.autoTable?.version ||
        window.autoTable?.version ||
        jsPDFConstructor?.API?.autoTable?.version ||
        "UNKNOWN";

    console.log("📄 autoTable version detected:", autoTableVersion);

    console.log("🔗 BEFORE attach → jsPDF.API.autoTable:",
        jsPDFConstructor?.API?.autoTable
    );

    console.log("🔗 window.jspdfAutoTable:", window.jspdfAutoTable);
    console.log("🔗 window.autoTable:", window.autoTable);

    // ==================================================
    // ✅ PROPER v5 REGISTRATION
    // ==================================================

    if (window.jspdfAutoTable && jsPDFConstructor) {
        window.jspdfAutoTable(jsPDFConstructor);
        console.log("✅ autoTable registered using jspdfAutoTable()");
    }

    // fallback only if still missing
    if (!jsPDFConstructor?.API?.autoTable && window.autoTable) {
        jsPDFConstructor.API.autoTable = window.autoTable;
        console.warn("⚠️ autoTable manually attached as fallback");
    }

    console.log("🔗 AFTER attach → jsPDF.API.autoTable:",
        jsPDFConstructor?.API?.autoTable
    );

    if (jsPDFConstructor?.API?.autoTable) {
        this.jsPDFInitialized = true;
        console.log("✅ jsPDF and autoTable READY");
    } else {
        console.error("❌ autoTable still NOT attached to jsPDF.");
    }
})


        .catch((error) => {
          console.error("❌ Error loading jsPDF or autoTable:", error);
        });
    }

    try {
      const pageIndex = this.stepCurrentPageIndex ?? 0;
      const currentPage = this.stepPagedRows?.[pageIndex] || [];

      // Build a quick lookup for the visible page’s cells
      const cellById = new Map();
      currentPage.forEach((row) =>
        (row?.cells || []).forEach((cell) => {
          cellById.set(String(cell?.id ?? ""), cell);
        })
      );

      const textareas = this.template.querySelectorAll(
        "textarea.input-textarea"
      );
      textareas.forEach((el) => {
        const id = String(el.dataset.id || "");
        const modelCell = cellById.get(id);
        const modelVal = modelCell?.field?.value ?? "";

        if (el.value !== modelVal) {
          // eslint-disable-next-line no-console
          console.warn(
            `🔧 Sync textarea id="${id}" dom="${el.value}" → model="${modelVal}"`
          );
          el.value = modelVal; // keep DOM in sync with your data
        }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("⚠️ Textarea sync error:", e);
    }
  }

  // Formats ISO date to a readable string (e.g., 05 Sep 2025)
  viewFormatCreatedDate(dateStr) {
    if (!dateStr) return "";
    try {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date(dateStr));
    } catch (e) {
      // fallback
      return dateStr;
    }
  }

  jsPDFInitialized = false;

  get isParticipantLocked() {
    return (
      this.clientId !== null &&
      this.clientId !== undefined &&
      this.clientId !== ""
    );
  }

  @wire(getRecord, {
    recordId: "$userId",
    fields: [
      USER_ROLE,
      USER_ORG_NAME,
      USER_TYPE,
      USER_FIRSTNAME,
      USER_LASTNAME,
      USER_EMAIL
    ]
  })
  wiredUser({ error, data }) {
    if (data) {
      this.userRole = data.fields.User_Role__c.value;
      this.orgName = data.fields.Organization_Name__c.value;
      this.userType = data.fields.User_Type__c.value;
      this.firstName = data.fields.FirstName.value;
      this.lastName = data.fields.LastName.value;
      this.userEmail = data.fields.Email.value;

      // Logging user info
      console.log("✅ User ID: ", this.userId);
      console.log("✅ User Role: ", this.userRole);
      console.log("✅ Organization Name: ", this.orgName);
      console.log("✅ User Type: ", this.userType);
      console.log("✅ First Name: ", this.firstName);
      console.log("✅ Last Name: ", this.lastName);
      console.log("✅ Email: ", this.userEmail);
      this.showFormsAccess =
        this.userType === "NDIS Org Admin" ||
        this.userType === "Roster Manager";
      // this.isStaffUser = this.userType === 'NDIS Staff';
      this.isStaffUser = this.userType === "NDIS Org Admin";
      console.log("✅ showFormsAccess:", this.showFormsAccess);

      this.getFacilityValues();
      this.getStaffValues();

      // ✅ Now fetch the user's Facility ID
      getFacilityByUserEmail({ userEmail: this.userEmail })
        .then((facilityId) => {
          console.log("🏥 Facility ID for user:", facilityId);
          this.facilityId = facilityId; // Make sure facilityId is reactive
        })
        .catch((error) => {
          console.error("❌ Error fetching facility:", error);
        });
      this.filterParticipantOptions();
    } else if (error) {
      console.error("❌ Error fetching user info:", error);
    }
  }

  // @wire(getRecord, { recordId: '$userId', fields: [USER_NAME, USER_EMAIL, USER_ROLE] })
  // userDetails({ error, data }) {
  //     if (data) {
  //         this.userName = data.fields.Name.value;
  //         this.userEmail = data.fields.Email.value;
  //         this.userRole = data.fields.User_Role__c.value;

  //         console.log('🔹 Logged-in User:', this.userName);
  //         console.log('🔹 User Role:', this.userRole);

  //         // ✅ Restrict Access to Specific Roles
  //         const allowedRoles = ['Portal Account Partner Executive', 'Portal Account Partner Manager', 'CEO', 'Admin'];
  //         // this.participantAccess = allowedRoles.includes(this.userRole);

  //         console.log('🔹 Participant Access Granted:', this.participantAccess);
  //     } else if (error) {
  //         console.error('❌ Error fetching user details:', error);
  //     }
  // }

  // @wire(getParticipants)
  // wiredRecords({ data, error }) {
  //     if (data) {
  //         this.participants = data.map(participant => ({
  //             ...participant,
  //             grantedForms: participant.Form_Access__c ? participant.Form_Access__c.split(';') : []
  //         }));
  //         this.totalRecords = data.length;
  //         this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
  //         this.paginationHelper();
  //     } else if (error) {
  //         console.error('Error fetching participants:', error);
  //     }
  // }

  @wire(getParticipants, { facilityId: "$facilityId" })
  wiredRecords({ data, error }) {
    if (data) {
      this.participants = data.map((participant) => {
        const staffMembers = participant.staffMembers || [];

        // ✅ Separate visible (first 5) and remaining staff
        const visibleStaffMembers = staffMembers.slice(0, 5);
        const extraStaff = staffMembers.slice(5);
        const extraStaffCount = extraStaff.length;
        const extraStaffNames = extraStaff.map((s) => s.name).join(", ");

        // ✅ Debug logs
        visibleStaffMembers.forEach((staff) => {});

        if (extraStaffCount > 0) {
          console.log(`➕ ${extraStaffCount} extra staff: ${extraStaffNames}`);
        }

        return {
          ...participant,
          visibleStaffMembers,
          hasVisibleStaff: visibleStaffMembers.length > 0, // ✅ Add this
          extraStaffCount,
          extraStaffNames,
          hasExtraStaff: extraStaffCount > 0,
          grantedForms: participant.Accessible_Forms__c
            ? participant.Accessible_Forms__c.split(";")
            : []
        };
      });

      this.filteredParticipants = [...this.participants];
      this.totalRecords = this.filteredParticipants.length;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
      this.paginationHelper();

      this.participantsLoaded = true;
      this.filterParticipantOptions();
    } else if (error) {
      console.error("❌ Error fetching participants:", error);
    }
  }

  filterParticipantOptions() {
    if (!this.userInfoLoaded || !this.participantsLoaded) return;

    const fullName = `${this.firstName} ${this.lastName}`;

    if (this.userType === "NDIS Staff") {
      // ✅ Show only related participants for staff
      this.participantOptions = this.participants
        .filter(
          (p) =>
            p.visibleStaffMembers &&
            p.visibleStaffMembers.some((staff) => staff.name === fullName)
        )
        .map((p) => ({
          label: p.Name,
          value: p.Id
        }));

      console.log(
        `✅ [Staff] Filtered participants for ${fullName}:`,
        this.participantOptions
      );
    } else {
      // ✅ Org Admins, Roster Managers see all participants
      this.participantOptions = this.participants.map((p) => ({
        label: p.Name,
        value: p.Id
      }));

      console.log(
        `✅ [Admin] Showing all participants:`,
        this.participantOptions
      );
    }

    console.log(
      "🔍 Final participantOptions:",
      JSON.stringify(this.participantOptions, null, 2)
    );
  }

  handleParticipantDropdownClick() {
    if (!this.participants || !this.userType || !this.userEmail) {
      console.warn("⚠️ Missing participants or user info");
      return;
    }

    if (this.userType === "NDIS Staff") {
      this.participantOptions = this.participants
        .filter(
          (p) =>
            p.visibleStaffMembers &&
            p.visibleStaffMembers.some(
              (staff) => staff.email === this.userEmail
            )
        )
        .map((p) => ({
          label: p.Name,
          value: p.Id
        }));

      console.log(
        "✅ [Staff] Filtered participantOptions on dropdown open:",
        JSON.stringify(this.participantOptions)
      );
    } else {
      this.participantOptions = this.participants.map((p) => ({
        label: p.Name,
        value: p.Id
      }));

      console.log(
        "✅ [Admin] Loaded all participants on dropdown open:",
        JSON.stringify(this.participantOptions)
      );
    }
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

  togglePublishedForms() {
    this.showPublishedForms = !this.showPublishedForms;
    console.log("✅ Loaded all forms on toggle:", this.forms.length);
  }

  @track isStaffUser = false;
  @track participantOptions = [];
  @track selectedParticipantId = "";
  @track staffParticipantForms = [];

  handleParticipantChange(event) {
    this.selectedParticipantId = event.detail.value;
    const selectedOption = this.participantOptions.find(
      (p) => p.value === this.selectedParticipantId
    );
    this.selectedParticipantName = selectedOption ? selectedOption.label : "";

    console.log("🔸 Participant Selected:", this.selectedParticipantId);
    console.log("👤 Participant Name:", this.selectedParticipantName);

    getAccessibleForms({ participantId: this.selectedParticipantId })
      .then((formRecords) => {
        console.log("📋 Accessible Forms from Apex:", formRecords);

        if (!formRecords || formRecords.length === 0) {
          console.log("⚠️ No accessible forms for this participant.");
          this.forms = [];
          this.filteredForms = [];
          return;
        }

        // 🛠 Build miniRows correctly
        this.forms = formRecords.map((form) => {
          let miniRows = [];
          try {
            if (form.Form_JSON__c) {
              //const parsed = JSON.parse(form.Form_JSON__c);

              let parsed;

                const raw = form.Form_JSON__c;
                if (raw) {
                  const tmp = JSON.parse(raw);

                  if (tmp?.url && tmp?.key) {
                    // AWS-backed → cannot build miniRows unless fetched
                    console.warn("Mini preview skipped (AWS-backed form):", form.Name__c);
                    parsed = [];
                  } else {
                    parsed = tmp;
                  }
                }

              miniRows = parsed.slice(0, 4).map((row, rowIndex) => ({
                index: rowIndex,
                cells: row.cells
                  .filter((cell) => cell.field && cell.field.label) // Only fields with label
                  .map((cell, colIndex) => ({
                    label: cell.field.label,
                    index: colIndex
                  }))
              }));
            }
          } catch (e) {
            console.error(
              "❌ Error parsing Form_JSON__c for mini view:",
              form.Name__c,
              e
            );
          }
          return {
            ...form,
            miniRows
          };
        });

        this.filteredForms = this.forms;
        console.log(
          "✅ Forms now visible to participant (with mini view):",
          this.filteredForms.map((f) => f.Name__c)
        );
      })
      .catch((error) => {
        console.error("❌ Error fetching accessible forms:", error);
      });
  }

  processUserData(data) {
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

  @wire(getForms)
  wiredAllForms({ data, error }) {
    if (data && !this.clientId) {
      this.allForms = data.map((form) => {
        let miniRows = [];
        try {
          if (form.Form_JSON__c) {
            //const parsed = JSON.parse(form.Form_JSON__c);
            let parsed;

            const raw = form.Form_JSON__c;
            if (raw) {
              const tmp = JSON.parse(raw);

              if (tmp?.url && tmp?.key) {
                // AWS-backed → cannot build miniRows unless fetched
                console.warn("Mini preview skipped (AWS-backed form):", form.Name__c);
                parsed = [];
              } else {
                parsed = tmp;
              }
            }

            miniRows = parsed.slice(0, 4).map((row, rowIndex) => ({
              index: rowIndex,
              cells: row.cells
                .filter((cell) => cell.field && cell.field.label) // Only fields with label
                .map((cell, colIndex) => ({
                  label: cell.field.label,
                  index: colIndex
                }))
            }));
          }
        } catch (e) {
          console.error(
            "❌ Error parsing Form_JSON__c for mini view:",
            form.Name__c,
            e
          );
        }

        return {
          ...form,
          miniRows,
          formImageUrl: this.getRandomFormImage()
        };
      });

      this.filteredForms = this.allForms; // ✅ Assign filteredForms
      console.log(
        "✅ All Forms Cached with Mini View Ready:",
        JSON.stringify(this.allForms)
      );
    } else if (error) {
      console.error("❌ Error fetching all forms:", error);
    }
  }

  @wire(getFormsByClient, { clientId: "$clientId" })
  wiredClientForms({ data, error }) {
    if (data && this.clientId) {
      this.allForms = data;
      // Do NOT assign this.forms here
      console.log("✅ Client-Specific Forms Cached");
    } else if (error) {
      console.error("❌ Error fetching client-specific forms:", error);
    }
  }

  resetSearchAndList() {
    this.searchQuery = "";
    this.filteredForms = [...this.forms];
  }

  handleSearchChange(event) {
    this.searchQuery = (event.target.value || "").toLowerCase().trim();
    if (!this.searchQuery) {
      this.filteredForms = [...this.forms]; // reset to full list
      return;
    }
    this.filteredForms = this.forms.filter((f) =>
      (f.Name__c || "").toLowerCase().includes(this.searchQuery)
    );
  }
  // ✅ Fetch responses based on Client ID
  @wire(getFormResponsesByClient, { clientId: "$clientId" })
  wiredResponsesByClient(result) {
    if (this.clientId) {
      // ✅ Trigger only when Client ID is present
      this.wiredFormResponses = result;
      if (result.data) {
        console.log("✅ Retrieved Form Responses for Client:", result.data);
        this.processFormResponses(result.data);
      } else if (result.error) {
        console.error("❌ Error fetching responses for client:", result.error);
      }
    }
  }

  // ✅ Fetch all responses when Client ID is NOT present
  @wire(getFormResponses)
  wiredAllResponses(result) {
    if (!this.clientId) {
      // ✅ Trigger only when Client ID is NOT present
      this.wiredFormResponses = result;
      if (result.data) {
        this.processFormResponses(result.data);
      } else if (result.error) {
        console.error("❌ Error fetching all responses:", result.error);
      }
    }
  }

  getDecileClass(pct) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    const bucket = Math.floor(clamped / 10) * 10; // 0,10,...,100
    return `resp-bar__fill resp-bar__fill--${bucket}`;
  }

  // processFormResponses(data) {
  //   this.formResponses = data.map((response) => {
  //     const payload = this.getResponsePayloadObject(response);
  //     const score   = payload ? this.scoreCompletionFromPayload(payload)
  //                             : { pct: 0, filled: 0, total: 0 };

  //     return {
  //       ...response,
  //       FormattedDate: this.formatDate(response.CreatedDate),
  //       formImageUrl: this.getRandomFormImage(),
  //       completionPct: score.pct,
  //       completionFillClass: this.getDecileClass(score.pct),   // <-- fixed
  //       completionBarStyle: `width:${Math.max(0, Math.min(100, score.pct))}%`,
  //       CreatedByName: (response && response.CreatedBy && response.CreatedBy.Name)
  //         ? response.CreatedBy.Name
  //         : '—'
  //     };
  //   });

  //   this.filteredFormResponses = [...this.formResponses];
  //   this.totalFormRecords = this.filteredFormResponses.length;
  //   this.totalFormPages = Math.ceil(this.totalFormRecords / this.formPageSize);
  //   this.updatePaginatedFormResponses();
  // }

  // ✅ Keep your existing methods intact (getDecileClass, processFormResponses, formatDate, updatePaginatedFormResponses)
  // Add the following properties/methods without changing the current flow

  // Optional view toggle (default = current flat view)
  isGroupedView = false;

  // Group data stores
  groupedResponses = [];
  paginatedGroups = [];
  totalGroupRecords = 0;
  totalGroupPages = 0;

  // Colspan for the parent row (matches your header column count)
  get colSpan() {
    return 7;
  } // Form Name, Type, Participant, Created By, Submitted On, Progress, Actions

  // Augment your existing processFormResponses with group building (no behavior change if isGroupedView=false)
async processFormResponses(data) {
  console.log("📥 Raw form responses fetched from Apex:", data);
  console.log("📥 Total records fetched:", data?.length);

  this.formResponses = await Promise.all(
    data.map(async (response, index) => {
      console.log(`🧾 [${index}] Form Response RAW:`, response);

      const payload = await this.getResponsePayloadObject(response);

      const score = payload
        ? this.scoreCompletionFromPayload(payload)
        : { pct: 0, filled: 0, total: 0 };
      const statusRaw = response.Status__c || "Pending";

      const mapped = {
        ...response,
        Status__c: statusRaw,
        // statusDotClass: this.getStatusDotClass(statusRaw),
        statusBadgeClass: this.getStatusBadgeClass(statusRaw),
        canEditOrDelete: statusRaw === "Pending",
        FormattedDate: this.formatDate(response.CreatedDate),
        formImageUrl: this.getRandomFormImage(),
        completionPct: score.pct,
        completionFillClass: this.getDecileClass(score.pct),
        completionBarStyle: `width:${Math.max(0, Math.min(100, score.pct))}%`,
        CreatedByName:
          response?.CreatedBy?.Name || "—"
      };

      console.log(`🧾 [${index}] Form Response MAPPED:`, mapped);

      return mapped;
    })
  );

  this.allFormResponses = [...this.formResponses];

  // ---- EXISTING FLOW UNCHANGED ----

  const rawNames = this.allFormResponses.map((r) =>
    this._normalizeName(r?.Name__c)
  );

  this.uniqueNames = Array.from(new Set(rawNames));
  this._buildNameTabs?.();

  this.filteredFormResponses = [...this.formResponses];
  this.totalFormRecords = this.filteredFormResponses.length;
  this.totalFormPages = Math.ceil(this.totalFormRecords / this.formPageSize);

  this.updatePaginatedFormResponses();
  this.fetchFormSignatureStatuses();

  this.buildGroups(this.filteredFormResponses);
  this.updatePaginatedGroups();
}
getStatusDotClass(status) {
  const s = (status || "").toLowerCase();

  switch (s) {
    case "pending":
      return "status-dot status-pending";
    case "completed":
      return "status-dot status-completed";
    default:
      return "status-dot status-default";
  }
}


fetchFormSignatureStatuses() {
  const rows = this.filteredFormResponses || [];
  console.log("📄 Fetching signature status for forms:", rows.length, rows);

  if (!rows.length) {
    console.warn("⚠️ No form responses to check signatures for.");
    return;
  }

  const promises = rows.map((r) => {
    console.log("➡️ Checking signature for FormResponse:", r.Id);

    return checkFormSignatureStatus({ formResponseId: r.Id })
      .then((status) => {
        console.log("✅ Signature status from Apex for", r.Id, "=>", status);

        return {
          id: r.Id,
          isSigned: !!status?.isSigned,
          signatureUrl: status?.signatureUrl || null
        };
      })
      .catch((err) => {
        console.error("❌ Signature check failed for", r.Id, err);
        return {
          id: r.Id,
          isSigned: false,
          signatureUrl: null
        };
      });
  });

  Promise.all(promises)
    .then((results) => {
      console.log("📊 All signature results:", results);

      const byId = new Map(results.map((x) => [x.id, x]));

      this.filteredFormResponses = this.filteredFormResponses.map((r) => {
        const s = byId.get(r.Id);

        const updated = {
          ...r,
          isSigned: s?.isSigned || false,
          signatureUrl: s?.signatureUrl || null
        };

        console.log(
          "🔄 Row updated:",
          r.Id,
          "isSigned:",
          updated.isSigned,
          "signatureUrl:",
          updated.signatureUrl
        );

        return updated;
      });

      // keep pagination in sync
      console.log("📑 Updating paginated form responses");
      this.updatePaginatedFormResponses();
    })
    .catch((e) => {
      console.error("❌ Promise.all failed in fetchFormSignatureStatuses", e);
    });
}




  // helper: returns the correct class for the arrow
  getArrowClass(expanded) {
    return expanded ? "group-arrow group-arrow--open" : "group-arrow";
  }

  // when you build groups
  buildGroups(rows) {
    const byKey = new Map();
    for (const r of rows) {
      const key = `${r.Name__c}__${r.FormattedDate}`;
      if (!byKey.has(key)) {
        byKey.set(key, {
          id: key,
          formName: r.Name__c,
          submittedOn: r.FormattedDate,
          items: [],
          expanded: false,
          arrowClass: this.getArrowClass(false) // 👈 precompute
        });
      }
      byKey.get(key).items.push(r);
    }

    this.groupedResponses = Array.from(byKey.values())
      // ... your sort/map as before ...
      .map((g) => ({
        ...g,
        count: g.items.length,
        countLabel: g.items.length === 1 ? "submission" : "submissions"
      }));

    this.totalGroupRecords = this.groupedResponses.length;
    this.totalGroupPages = Math.ceil(
      (this.totalGroupRecords || 0) / this.formPageSize
    );
  }

  // Paginate groups (uses same page vars as flat view)
  updatePaginatedGroups() {
    if (!this.groupedResponses || this.groupedResponses.length === 0) {
      this.paginatedGroups = [];
      this.disableFirstFormPage = true;
      this.disableLastFormPage = true;
      return;
    }
    const startIndex = (this.formPageNumber - 1) * this.formPageSize;
    const endIndex = this.formPageNumber * this.formPageSize;
    this.paginatedGroups = this.groupedResponses.slice(startIndex, endIndex);

    this.disableFirstFormPage = this.formPageNumber === 1;
    this.disableLastFormPage = this.formPageNumber === this.totalGroupPages;
  }

  handleToggleGroup(evt) {
    const key = evt.currentTarget?.dataset?.groupId;
    if (!key) return;

    const idx = this.groupedResponses.findIndex((g) => g.id === key);
    if (idx === -1) return;

    const exp = !this.groupedResponses[idx].expanded;

    // reassign the item to trigger reactivity
    this.groupedResponses = this.groupedResponses.map((g) =>
      g.id === key
        ? { ...g, expanded: exp, arrowClass: this.getArrowClass(exp) }
        : g
    );

    this.updatePaginatedGroups(); // keep the page view in sync
  }

  // If you have filters/search elsewhere, after filtering call:
  // this.buildGroups(this.filteredFormResponses);
  // this.formPageNumber = 1;
  // this.updatePaginatedGroups();

  // ✅ Format date as "dd-MM-yyyy"
  formatDate(isoDate) {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB"); // ✅ Formats as "dd/MM/yyyy"
  }

  getUniqueNamesFromPage() {
    const raw = (this.paginatedFormResponses || []).map(
      (r) => r?.Name__c || "Unnamed"
    );
    return Array.from(new Set(raw));
  }

  updatePaginatedFormResponses() {
    if (this.totalFormRecords === 0) {
      this.paginatedFormResponses = [];
      return;
    }

    let startIndex = (this.formPageNumber - 1) * this.formPageSize;
    let endIndex = this.formPageNumber * this.formPageSize;

    this.paginatedFormResponses = this.filteredFormResponses.slice(
      startIndex,
      endIndex
    );

    this.disableFirstFormPage = this.formPageNumber === 1;
    this.disableLastFormPage = this.formPageNumber === this.totalFormPages;
    const uniqueNames = this.getUniqueNamesFromPage();
    console.log("Unique form names:", uniqueNames);
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

getStaffValues() {
  console.log("📥 Calling getEmployeeData Apex method...");

  const defaultFacilityId = localStorage.getItem("defaultFacilityId");
  console.log("🏥 defaultFacilityId from localStorage:", defaultFacilityId);

  if (!defaultFacilityId) {
    console.warn("⚠️ defaultFacilityId not found in localStorage. Staff list will be empty.");
    this.staffOptions = [];
    this.staffOptions1 = [];
    this.staffOptions2 = [];
    return;
  }

  getEmployeeData({ facilityid: defaultFacilityId })  // ✅ PASS PARAM
    .then((response) => {
      this.staffOptions = (response || []).map((record) => ({
        value: record.Id,
        label: record.NameToDisplay__c
      }));
      this.staffOptions1 = (response || []).map((record) => ({
        value: record.Id,
        label: record.Last_Name__c
      }));
      this.staffOptions2 = (response || []).map((record) => ({
        value: record.Id,
        label: record.NameToDisplay__c
      }));

      console.log("👨‍💼 staffOptions length:", this.staffOptions.length);
      console.log("👨‍💼 staffOptions sample (first 5):", this.staffOptions.slice(0, 5));

      this.staffVal = this.staffOptions[0]?.label || "";
      this.staffVal1 = this.staffOptions1[0]?.label || "";
      this.stafflabel = this.staffOptions2[0]?.label || "";

    })
    .catch((err) => {
      console.error("❌ Error fetching staff data from getEmployeeData:", err);
    });

  getUserDetails()
    .then((user) => {
      this.firstName = user.FirstName;
      this.lastName = user.LastName;
      console.log("🙋 Logged-in User:", this.firstName + " " + this.lastName);
    })
    .catch((err) => {
      console.error("❌ Error fetching user details:", err);
    });
}



  fetchParticipants() {
    console.log("📌 Attempting to fetch participants...");
    console.log("🏢 userFacility:", this.facilityVal);

    if (!this.facilityVal) {
      console.warn("⚠️ facilityVal not yet available. Skipping fetch.");
      return;
    }

    getParticipants({ facilityId: this.facilityVal })
      .then((data) => {
        console.log("✅ Apex call succeeded. Raw data received:");
        console.log(
          "👥 All Participants Raw Data:",
          JSON.stringify(data, null, 2)
        );

        this.participants = data.map((participant, index) => {
          console.log(
            `📍 Processing participant #${index + 1}: ${participant.Name}`
          );
          const grantedForms = participant.Accessible_Forms__c
            ? participant.Accessible_Forms__c.split(";")
            : [];

          console.log(
            "🔗 Accessible_Forms__c:",
            participant.Accessible_Forms__c
          );
          console.log("✅ Parsed granted forms:", grantedForms);

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
        console.error("❌ Error fetching participants from Apex:", error);
        if (error.body && error.body.message) {
          console.error("📛 Apex error message:", error.body.message);
        }
      });
  }

  @track selectedFormTitle = "";

  async handleFormClick(event) {
    const formId = event.currentTarget.dataset.id;
    this.selectedForm = this.forms.find((form) => form.Id === formId);
    if (this.selectedForm) {
      this.selectedFormType =
        this.selectedForm.Form_Type__c || "Unknown Form Type";
      this.selectedFormTitle = this.selectedForm.Name__c || "Untitled Form";
      console.log("🔹 Clicked Form ID:", formId);
      console.log("🔹 Clicked Form Name:", this.selectedForm.Name__c);
      console.log("🔹 Clicked Form Type:", this.selectedFormType);

      // const rawJson = this.selectedForm.Form_JSON__c;
      // const parsedJson = JSON.parse(rawJson);
      // this.loadFormData(parsedJson);

      const rawJson = this.selectedForm.Form_JSON__c;

      let parsedJson;

      if (rawJson) {
        const parsed = JSON.parse(rawJson);

        if (parsed?.url && parsed?.key) {
          console.log("🌐 Form layout stored in AWS — fetching:", parsed.url);

          const resp = await fetch(parsed.url);
          if (!resp.ok) {
            throw new Error("Failed to load form JSON from AWS");
          }

          parsedJson = await resp.json();
        } else {
          parsedJson = parsed; // legacy inline
        }
      }
      this.masterFormJson = JSON.parse(JSON.stringify(parsedJson));


      this.loadFormData(parsedJson);


      // this.loadFormData(JSON.parse(this.selectedForm.Form_JSON__c));
      // const filteredRows = JSON.parse(this.selectedForm.Form_JSON__c).map(row => ({
      const filteredRows = parsedJson.map((row, rowIndex) => ({
        ...row,
        cells: row.cells.map((cell, colIndex) => {
          let options = [];
          let selectedOptionsArray = [];
          let selectedValues = "";
          let isTextArea = false;
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
          isCheckboxField = cell.field?.dataType === "Checkbox Field";
          let floatingLabelStyle = this.getBorderStyle(cell.field?.dataType);
          let isRichText = false;
          let isRadioButton = false;
          let selectedRadioOption = "";
          let subInputValue = "";
          let isHeader = false;
          let headerText = null;
          let headerStyle = "";

          // ✅ Handle Dropdown Fields (Single & Multi-Select)
          // if (cell.field?.dataType === 'Dropdown Field') {
          //     placeholderText = `Select ${cell.field.label}`;
          //     if (cell.field.selectedDropdownOption === 'singleSelect' && cell.field.singleSelectValues) {
          //         options = cell.field.singleSelectValues.split('\n').map(option => ({
          //             label: option.trim(),
          //             isSelected: cell.field.value === option.trim()
          //         })).filter(option => option.label);
          //     } else if (cell.field.selectedDropdownOption === 'multiSelect' && cell.field.multiSelectValues) {
          //         options = cell.field.multiSelectValues.split('\n').map(option => ({
          //             label: option.trim(),
          //             isSelected: false
          //         })).filter(option => option.label);

          //         selectedOptionsArray = cell.field.value ? cell.field.value.split(', ') : [];
          //         selectedValues = selectedOptionsArray.join(", ");

          //         // ✅ Mark selected options
          //         options.forEach(option => {
          //             if (selectedOptionsArray.includes(option.label)) {
          //                 option.isSelected = true;
          //             }
          //         });
          //     }
          // }

          const dropdownLabel = cell.field?.label?.trim().toLowerCase();

if (cell.field?.dataType === "Dropdown Field") {
  placeholderText = `Select ${cell.field.label}`;

  // ✅ Only load predefined options when predefinedList is explicitly selected
  if (cell.field.selectedDropdownOption === "predefinedList") {
    const type = (cell.field.predefinedListType || "").trim().toLowerCase();

    if (type === "staff" && this.staffOptions.length > 0) {
      options = this.staffOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
        isSelected: cell.field.value === opt.value
      }));
    } else if (type === "participant" && this.allparticipants.length > 0) {
      options = this.allparticipants.map((p) => ({
        label: p.Name,
        value: p.Id,
        isSelected: cell.field.value === p.Id
      }));
    } else if (type === "facility" && this.facilityOptions.length > 0) {
      options = this.facilityOptions.map((opt) => ({
        label: opt.label,
        value: opt.value,
        isSelected: cell.field.value === opt.value
      }));
    } else {
      // predefinedList selected but type/options not ready → show empty dropdown
      options = [];
    }

  // ✅ Manual options: single select
  } else if (
    cell.field.selectedDropdownOption === "singleSelect" &&
    cell.field.singleSelectValues
  ) {
    options = cell.field.singleSelectValues
      .split("\n")
      .map((option) => ({
        label: option.trim(),
        value: option.trim(),
        isSelected: cell.field.value === option.trim()
      }))
      .filter((option) => option.label);

  // ✅ Manual options: multi select
  } else if (
    cell.field.selectedDropdownOption === "multiSelect" &&
    cell.field.multiSelectValues
  ) {
    options = cell.field.multiSelectValues
      .split("\n")
      .map((option) => ({
        label: option.trim(),
        value: option.trim(),
        isSelected: false
      }))
      .filter((option) => option.label);

    selectedOptionsArray = cell.field.value ? cell.field.value.split(", ") : [];
    selectedValues = selectedOptionsArray.join(", ");
    options.forEach((option) => {
      if (selectedOptionsArray.includes(option.label)) {
        option.isSelected = true;
      }
    });

  // ✅ Nothing selected yet
  } else {
    options = [];
  }
}


          // ✅ Handle Text Fields
          if (cell.field?.dataType === "Text Field") {
            if (cell.field.selectedTextFieldOption === "textArea") {
              isTextArea = true;
              maxLength = 255;
              charCount = cell.field.value ? cell.field.value.length : 0;
              placeholderText = `Enter ${cell.field.label} (Up to 255 chars)`;
            } else if (cell.field.selectedTextFieldOption === "alphaNumeric") {
              isAlphaNumeric = true;
              maxLength = cell.field.alphaNumericLength
                ? parseInt(cell.field.alphaNumericLength, 10)
                : 56;
              placeholderText = `Enter ${cell.field.label} (Max ${maxLength} chars)`;
            } else if (cell.field.selectedTextFieldOption === "onlyAlphabets") {
              isOnlyAlphabets = true;
              maxLength = cell.field.onlyAlphabetsLength
                ? parseInt(cell.field.onlyAlphabetsLength, 10)
                : 55;
              placeholderText = `Enter ${cell.field.label} (Alphabets only, Max ${maxLength} chars)`;
            } else if (cell.field.selectedTextFieldOption === "richText") {
              isRichText = true;
            } else {
              placeholderText = `Enter ${cell.field.label}`;
            }
          }

          // ✅ Handle Number Fields
          if (cell.field?.dataType === "Number Field") {
            switch (cell.field.selectedNumberFieldOption) {
              case "contactNumber":
                isContactNumber = true;
                maxLength = cell.field.contactNumberDigits
                  ? parseInt(cell.field.contactNumberDigits, 10)
                  : 10;
                placeholderText = `Enter ${cell.field.label} (Max ${maxLength} digits)`;
                break;
              case "currency":
                isCurrency = true;
                decimalPlaces = cell.field.decimalValue
                  ? parseInt(cell.field.decimalValue, 10)
                  : 2;
                placeholderText = `Enter ${cell.field.label} (Up to ${decimalPlaces} decimals)`;
                break;
              case "defaultNumber":
              default:
                isDefaultNumber = true;
                placeholderText = `Enter ${cell.field.label} (Numbers Only)`;
                break;
            }
          }

          // ✅ Handle Time Field (No Conversion)
          if (cell.field?.dataType === "Time Field") {
            isTimeField = true;
            placeholderText = `Select Time`;
          }

          // ✅ Handle Date Field (No Conversion)
          if (cell.field?.dataType === "Date Field") {
            isDateField = true;
            placeholderText = `Select Date`;
          }
          // ✅ Handle Checkbox Field (Slider Toggle)
          if (cell.field?.dataType === "Checkbox Field") {
            isCheckboxField = true;
          }
          if (cell.field?.dataType === "Upload File") {
            placeholderText = "Upload File";
            console.log(
              "📂 Upload File field detected:",
              cell.field.label,
              "at cell ID:",
              cell.id
            );
          }

          if (cell.field?.dataType === "Radio Button") {
            isRadioButton = true;

            selectedRadioOption = cell.field.value || "";
            subInputValue = cell.subInputValue || "";

            console.log("🔘 Processing Radio Button Cell:", cell.id);
            console.log("📌 Selected Radio Option:", selectedRadioOption);
            console.log("📌 Sub Input Value:", subInputValue);

            cell.radioOptionsProcessed = (cell.field.radioOptions || []).map(
              (option) => {
                const isSelected = selectedRadioOption === option.optionLabel;

                let processedSubOptions = [];

                if (option.usePredefinedOptions) {
                  const predefined = option.selectedPredefined?.toLowerCase();
                  if (predefined === "staff") {
                    processedSubOptions = this.staffOptions.map((opt) => ({
                      label: opt.label,
                      isSelected: subInputValue === opt.label
                    }));
                  } else if (predefined === "participant") {
                    processedSubOptions = this.participants.map((p) => ({
                      label: p.Name,
                      isSelected: subInputValue === p.Name
                    }));
                  } else if (predefined === "facility") {
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
              }
            );

            cell.subRadioName = cell.id + "-subradio";

            console.log(
              "✅ Final radioOptionsProcessed:",
              JSON.stringify(cell.radioOptionsProcessed, null, 2)
            );
          }

          if (
            cell.field?.dataType === "Header" ||
            cell.field?.type === "header" ||
            cell.field?.isHeader === true
          ) {
            isHeader = true;

            // text to display
            headerText =
              cell.field?.text || cell.field?.label || "Section Title";

            // use saved inlineStyle if present; otherwise compute it
            headerStyle =
              cell.field?.inlineStyle ||
              this.computeHeaderInlineStyle?.({
                fontSize: cell.field?.fontSize || "24",
                fontWeight: cell.field?.fontWeight || "600",
                textAlign: cell.field?.textAlign || "left",
                textDecoration: cell.field?.textDecoration || "none",
                color: cell.field?.color || "#000000"
              }) ||
              `font-size:${cell.field?.fontSize || 24}px; font-weight:${cell.field?.fontWeight || 600}; text-align:${cell.field?.textAlign || "left"}; text-decoration:${cell.field?.textDecoration || "none"}; color:${cell.field?.color || "#000000"};`;
          }

          const isPageBreakCell =
            cell.field?.dataType === "Blank" &&
            cell.field?.label?.toLowerCase().trim() === "page break";
          const dataId = `row-${rowIndex}-col-${colIndex}`;
          const id = cell.id || `cell-${rowIndex}-${colIndex}`;
          return {
            ...cell,
            dataId: dataId,
            id,
            isVisible:
              !(
                cell.field?.dataType === "Blank" &&
                cell.field?.label?.toLowerCase().trim() === "page break"
              ) && cell.style !== "display: none;",
            isTextField:
              cell.field?.dataType === "Text Field" &&
              !isTextArea &&
              !isAlphaNumeric &&
              !isOnlyAlphabets &&
              !isRichText,
            isAlphaNumeric: isAlphaNumeric,
            isOnlyAlphabets: isOnlyAlphabets,
            isTextArea: isTextArea,
            isNumberField: cell.field?.dataType === "Number Field",
            isCurrency: isCurrency,
            isContactNumber: isContactNumber,
            isDefaultNumber: isDefaultNumber,
            isTimeField: isTimeField,
            isDateField: isDateField,
            isCheckboxField: isCheckboxField,
            floatingLabelStyle: floatingLabelStyle,
            isDropdownField: cell.field?.dataType === "Dropdown Field",
            isMultiSelect: cell.field?.selectedDropdownOption === "multiSelect",
            hasComment:
              cell.field?.comments && cell.field.comments.trim() !== "",
            placeholderText: placeholderText,
            maxLength: maxLength,
            decimalPlaces: decimalPlaces,
            isDropdownOpen: false,
            selectedOptionsArray: selectedOptionsArray,
            selectedValues: selectedValues,
            charCount: charCount,
            isUploadField: cell.field?.dataType === "Upload File",
            isRichText: isRichText,
            isRadioButton,
            selectedRadioOption,
            subInputValue,
            isHeader,
            headerText,
            headerStyle,

            field: {
              ...cell.field,
              value: cell.field?.value || "",
              options: options
            },

            hasContent: !!(
              cell.isHeader ||
              cell.field?.label ||
              cell.isTextField ||
              cell.isAlphaNumeric ||
              cell.isOnlyAlphabets ||
              cell.isNumberField ||
              cell.isCurrency ||
              cell.isContactNumber ||
              cell.isDefaultNumber ||
              cell.isTimeField ||
              cell.isDateField ||
              cell.isCheckboxField ||
              cell.isDropdownField ||
              cell.isUploadField ||
              cell.isRadioButton ||
              cell.isTextArea
            )
          };
        })
      }));

      this.tableRows = filteredRows;

      this.stepPagedRows = [];
      let currentStepPage = [];

      filteredRows.forEach((row) => {
        const isPageBreak = row.cells.some(
          (cell) =>
            cell.field?.dataType === "Blank" &&
            cell.field?.label?.toLowerCase().trim() === "page break"
        );

        if (isPageBreak) {
          currentStepPage.push({
            ...row,
            isPageBreak: true
          });

          if (currentStepPage.length > 0) {
            this.stepPagedRows.push([...currentStepPage]);
            currentStepPage = [];
          }
        } else {
          currentStepPage.push(row);
        }
      });

      if (currentStepPage.length > 0) {
        this.stepPagedRows.push(currentStepPage);
      }

      this.stepCurrentPageIndex = 0;
      this.updateStepVisibleRows();
      // Render only first step's rows

      this.isFormSelected = true;
      this.isViewModeON = false;
      this.showPublishedForms = false;
      console.log("✅ isFormSelected set to true. UI should render form.");
    }
  }

  paginationHelper() {
    if (this.totalRecords === 0) {
      this.noRecordsFlag = true;
      return;
    }

    this.noRecordsFlag = false;
    this.recordsToDisplay = [];

    // Calculate total pages
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

    // Adjust page number
    if (this.pageNumber < 1) {
      this.pageNumber = 1;
    } else if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }

    // Set records to display
    let startIndex = (this.pageNumber - 1) * this.pageSize;
    let endIndex = this.pageNumber * this.pageSize;
    this.recordsToDisplay = this.filteredParticipants.slice(
      startIndex,
      endIndex
    );

    // Update button states
    this.bDisableFirst = this.pageNumber === 1;
    this.bDisableLast = this.pageNumber === this.totalPages;
  }

  getBorderStyle(dataType) {
    return ["Checkbox Field", "Radio Button", "Header"].includes(dataType)
      ? "border: 1px solid transparent;"
      : "border: 1px solid black;";
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

  get showSubmitButton() {
    return (
      this.totalStepPages === 1 ||
      this.stepCurrentPageIndex === this.totalStepPages - 1
    );
  }

  @track selectedParticipantStaffNames = "";
  @track grantSearchQuery = "";
  @track filteredAvailableForms = [];
  handleGrantFormSearch(event) {
    this.grantSearchQuery = event.target.value.toLowerCase();
    this.filteredAvailableForms = this.availableForms.filter((form) =>
      form.Name__c.toLowerCase().includes(this.grantSearchQuery)
    );
  }

  handleGrantAccessClick(event) {
    this.isLoading = true;
    this.selectedParticipantId = event.target.dataset.id;

    const participant = this.participants.find(
      (p) => p.Id === this.selectedParticipantId
    );
    this.selectedParticipantName = participant ? participant.Name : "Unknown";
    this.selectedParticipantStaffNames =
      participant?.visibleStaffMembers?.map((staff) => staff.name).join(", ") ||
      "No Staff Assigned";

    console.log(
      "🔹 Opening Grant Access for Participant:",
      this.selectedParticipantName
    );

    getAvailableForms()
      .then((data) => {
        return getAccessibleForms({
          participantId: this.selectedParticipantId
        }).then((grantedForms) => {
          // ✅ Extract only the IDs from the returned form records
          this.selectedForms = new Set(grantedForms.map((f) => f.Id));

          // ✅ Mark checkboxes as selected based on IDs
          this.availableForms = data.map((form) => ({
            ...form,
            isSelected: this.selectedForms.has(form.Id)
          }));

          // ✅ Sync filtered list for search
          this.filteredAvailableForms = [...this.availableForms];

          // ✅ Show the modal
          this.isGrantAccessPopupOpen = true;
          this.isLoading = false;
        });
      })
      .catch((error) => {
        console.error("❌ Error fetching available or granted forms:", error);
        this.isLoading = false;
      });
  }

  // ✅ Getter method to check if a form is selected
  isFormSelected(formId) {
    return this.selectedForms.has(formId);
  }

  // ✅ Handle Checkbox Selection
  handleFormSelection(event) {
    const formId = event.target.value;
    const isChecked = event.target.checked;

    // ✅ Update selectedForms set
    if (isChecked) {
      this.selectedForms.add(formId);
    } else {
      this.selectedForms.delete(formId);
    }

    // ✅ Update both lists with the new selection state
    this.availableForms = this.availableForms.map((form) => ({
      ...form,
      isSelected: this.selectedForms.has(form.Id)
    }));

    this.filteredAvailableForms = this.filteredAvailableForms.map((form) => ({
      ...form,
      isSelected: this.selectedForms.has(form.Id)
    }));

    console.log("🔹 Updated Selected Forms:", Array.from(this.selectedForms));
  }

  // ✅ Update Multi-Picklist on Grant Access
  grantAccess() {
    console.log("🔹 Initiating Grant Access...");

    if (this.selectedForms.size === 0) {
      this.showToast(
        "Error",
        "Please select at least one form to grant access.",
        "error"
      );
      return;
    }

    console.log("🔹 Selected Form IDs:", Array.from(this.selectedForms));
    console.log("🔹 Participant ID:", this.selectedParticipantId);

    grantAccessToParticipant({
      participantId: this.selectedParticipantId,
      selectedFormIds: Array.from(this.selectedForms)
    })
      .then(() => {
        console.log("✅ Grant Access Success!");
        this.showToast("Success", "Access granted successfully!", "success");
        this.closeGrantAccessPopup();

        // ✅ Re-fetch the accessible forms for selected participant
        return getAccessibleForms({
          participantId: this.selectedParticipantId
        });
      })
      .then((formRecords) => {
        if (!formRecords || formRecords.length === 0) {
          this.forms = [];
          this.filteredForms = [];
          console.log("🔹 No forms returned after grant.");
        } else {
          this.forms = formRecords;
          this.filteredForms = formRecords;
          console.log(
            "🔹 Refreshed forms:",
            this.filteredForms.map((f) => f.Name__c)
          );
        }
      })

      .catch((error) => {
        console.error("❌ Error granting access:", JSON.stringify(error));

        if (error && error.body && error.body.message) {
          console.error("📌 Apex Debug Log:", error.body.message);
        }

        this.showToast("Error", "Failed to grant access.", "error");
      });
  }

  getRandomFormImage() {
    const index = Math.floor(Math.random() * formImages.length);
    return formImages[index];
  }

  closeGrantAccessPopup() {
    this.isGrantAccessPopupOpen = false;
    this.selectedForms.clear();
  }

  // handleView(event) {
  //   // 🔄 Reset previous view state to avoid showing stale data
  //   console.log("📍 handleView triggered");
  //   this.viewTableData = [];
  //   this.tableRows = [];
  //   this.selectedFormTitle = "";
  //   this.selectedFormType = "";
  //   this.selectedParticipantName = "";
  //   this.selectedSubmissionDate = "";

  //   // ✅ Activate view mode
  //   this.isViewMode = true;
  //   this.isViewModeON = true;
  //   this.isFormSelected = false;

  //   // ✅ Get the ID of the form response clicked
  //   this.selectedResponseId = event.currentTarget.dataset.id;
  //   console.log("🆔 Selected Response ID:", this.selectedResponseId);

  //   // ✅ Find the full response object
  //   const response = this.formResponses.find(
  //     (resp) => resp.Id === this.selectedResponseId
  //   );

  //   if (response) {
  //     console.log("📄 Matched Response:", response);

  //     try {
  //       const formJson = JSON.parse(response.Response_JSON__c);
  //       console.log("📄 Parsed Form JSON:", JSON.stringify(formJson));

  //       // ✅ Prepare the view table rows from JSON
  //       this.prepareViewTable(formJson);
  //       console.log("✅ Called prepareViewTable() successfully");

  //       // ✅ Set header details
  //       this.selectedFormType = response.Form_Type__c || "Unknown Form Type";
  //       this.selectedFormTitle = response.Name__c || "Untitled Form";
  //       this.selectedParticipantName = response.Participant_Name__c;
  //       this.selectedSubmissionDate = response.FormattedDate;

  //       console.log("📋 Form Title:", this.selectedFormTitle);
  //       console.log("📂 Form Type:", this.selectedFormType);
  //       console.log("👤 Participant Name:", this.selectedParticipantName);
  //       console.log("📅 Submission Date:", this.selectedSubmissionDate);

  //       // ✅ Prepare dropdown selections if any
  //       this.tableRows = formJson.map((row, rowIndex) => ({
  //         ...row,
  //         cells: row.cells.map((cell, colIndex) => {
  //           if (cell.isDropdownField && cell.isMultiSelect) {
  //             let selectedOptionsArray = cell.field.value
  //               ? cell.field.value.split(", ")
  //               : [];
  //             cell.field.options.forEach((option) => {
  //               option.isSelected = selectedOptionsArray.includes(option.label);
  //             });
  //             cell.selectedValues = cell.field.value;
  //             console.log(
  //               `🔽 Updated multiselect for cell [${rowIndex}][${colIndex}]`,
  //               selectedOptionsArray
  //             );
  //           }
  //           return cell;
  //         })
  //       }));
  //     } catch (e) {
  //       console.error(
  //         "❌ Error parsing Response_JSON__c or preparing view:",
  //         e
  //       );
  //     }
  //   } else {
  //     console.warn(
  //       "⚠️ No matching response found for ID:",
  //       this.selectedResponseId
  //     );
  //   }
  // }

  async handleView(event) {
  // 🔄 Reset previous view state to avoid showing stale data
  console.log("📍 handleView triggered");

  this.viewTableData = [];
  this.tableRows = [];
  this.selectedFormTitle = "";
  this.selectedFormType = "";
  this.selectedParticipantName = "";
  this.selectedSubmissionDate = "";

  // ✅ Activate view mode
  this.isViewMode = true;
  this.isViewModeON = true;
  this.isFormSelected = false;

  // ✅ Get the ID of the form response clicked
  this.selectedResponseId = event.currentTarget.dataset.id;
  console.log("🆔 Selected Response ID:", this.selectedResponseId);

  // ✅ Find the full response object
  const response = this.formResponses.find(
    (resp) => resp.Id === this.selectedResponseId
  );

  if (!response) {
    console.warn(
      "⚠️ No matching response found for ID:",
      this.selectedResponseId
    );
    return;
  }

  console.log("📄 Matched Response:", response);

  try {
    const raw = response.Response_JSON__c;

    let formJson;

    if (raw) {
      const parsed = JSON.parse(raw);

      // 🌐 AWS-backed response
      if (parsed?.url && parsed?.key) {
        console.log("🌐 Response JSON stored in AWS — fetching:", parsed.url);

        const resp = await fetch(parsed.url);
        if (!resp.ok) {
          throw new Error("Failed to load response JSON from AWS");
        }

        formJson = await resp.json();
      } else {
        // legacy inline
        formJson = parsed;
      }
    }

    console.log("📄 Resolved Response JSON:", formJson);

    // ✅ Prepare the view table rows from JSON
    this.prepareViewTable(formJson);
    console.log("✅ Called prepareViewTable() successfully");

    // ✅ Set header details
    this.selectedFormType = response.Form_Type__c || "Unknown Form Type";
    this.selectedFormTitle = response.Name__c || "Untitled Form";
    this.selectedParticipantName = response.Participant_Name__c;
    this.selectedSubmissionDate = response.FormattedDate;

    console.log("📋 Form Title:", this.selectedFormTitle);
    console.log("📂 Form Type:", this.selectedFormType);
    console.log("👤 Participant Name:", this.selectedParticipantName);
    console.log("📅 Submission Date:", this.selectedSubmissionDate);

    // ✅ Prepare dropdown selections if any (unchanged logic)
    this.tableRows = (formJson || []).map((row, rowIndex) => ({
      ...row,
      cells: row.cells.map((cell, colIndex) => {
        if (cell.isDropdownField && cell.isMultiSelect) {
          const selectedOptionsArray = cell.field.value
            ? cell.field.value.split(", ")
            : [];

          cell.field.options.forEach((option) => {
            option.isSelected = selectedOptionsArray.includes(option.label);
          });

          cell.selectedValues = cell.field.value;

          console.log(
            `🔽 Updated multiselect for cell [${rowIndex}][${colIndex}]`,
            selectedOptionsArray
          );
        }
        return cell;
      })
    }));

  } catch (e) {
    console.error(
      "❌ Error resolving Response_JSON__c or preparing view:",
      e
    );
    this.showToast(
      "Error",
      "Failed to load submitted form data.",
      "error"
    );
  }
}


  @track selectedParticipantName;
  @track selectedSubmissionDate;

 closeView() {
  this.isViewMode = false;
  this.isFormSelected = false;
  this.isViewModeON = true;
  this.isExpandview = false;
}


  @track isExpandview = false; // you already have this

  expandview() {
    this.isExpandview = !this.isExpandview;
    console.log(
      "🔀 expand toggle →",
      this.isExpandview ? "expanded" : "compressed"
    );
  }

  get expandIconName() {
    // Material Icons: expand = open_in_full, compress = close_fullscreen
    return this.isExpandview ? "close_fullscreen" : "open_in_full";
  }
  get expandButtonTitle() {
    return this.isExpandview ? "Compress View" : "Expand View";
  }

  get viewPopupContentClass() {
    return `view-popup-content${this.isExpandview ? " is-expanded" : ""}`;
  }

  get unitedContentClass() {
    return `united-edit${this.isExpandview ? " is-expanded" : ""}`;
  }

  // loadFormData(formJson, isViewMode) {
  //     const processedRows = formJson.map(row => ({
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
    const processedRows = formJson.map((row, rowIndex) => ({
      ...row,
      cells: row.cells.map((cell, colIndex) => {
        const newCell = {
          ...cell,
          isVisible: cell.style !== "display: none;",
          field: { ...cell.field },
          hasContent: !!(cell.field?.label || cell.field?.value),
          id: cell.id || `cell-${rowIndex}-${colIndex}`
        };

        const field = newCell.field;
        const fieldValue = field?.value || "";

        // ✅ Normalize checkbox field
        if (newCell.isCheckboxField) {
          field.value = !!fieldValue;
        }

        // ✅ Normalize single-select dropdown
        if (
          newCell.isDropdownField &&
          !newCell.isMultiSelect &&
          Array.isArray(field.options)
        ) {
          field.options = field.options.map((opt) => ({
            ...opt,
            isSelected: opt.label === fieldValue
          }));
          newCell.selectedValues = fieldValue;
        }

        // ✅ Normalize multi-select dropdown
        if (
          newCell.isDropdownField &&
          newCell.isMultiSelect &&
          Array.isArray(field.options)
        ) {
          const selectedLabels = fieldValue
            .split(",")
            .map((label) => label.trim());
          field.options = field.options.map((opt) => ({
            ...opt,
            isSelected: selectedLabels.includes(opt.label)
          }));
          newCell.selectedValues = selectedLabels.join(", ");
        }

        // ✅ Handle radio button: extract selected + optional subinput
        if (newCell.isRadioButton || field?.dataType === "Radio Button") {
          const parts = fieldValue.split(" - ");
          newCell.selectedRadioOption = parts[0] || "";
          newCell.subInputValue = parts[1] || "";
        }

        // ✅ Compute readonly value for view mode
        newCell.readonlyValue = this.computeReadonlyValue(newCell, isViewMode);

        return newCell;
      })
    }));

    // ✅ Assign processed rows to tableRows
    this.tableRows = processedRows;

    // ✅ Rebuild paginated rows (stepPagedRows)
    // this.stepPagedRows = [];
    // let currentPage = [];

    // processedRows.forEach((row) => {
    //   const isPageBreak = row.cells.some(
    //     (cell) =>
    //       cell.field?.dataType === "Blank" &&
    //       cell.field?.label?.toLowerCase().trim() === "page break"
    //   );

    //   if (isPageBreak) {
    //     if (currentPage.length > 0) {
    //       this.stepPagedRows.push([...currentPage]);
    //     }
    //     currentPage = [row]; // page break row starts a new page
    //   } else {
    //     currentPage.push(row);
    //   }
    // });

    // if (currentPage.length > 0) {
    //   this.stepPagedRows.push(currentPage);
    // }


    // ✅ Rebuild paginated rows (stepPagedRows)
this.stepPagedRows = [];
let currentPage = [];

processedRows.forEach((row) => {
  const isPageBreak = row.cells.some(
    (cell) =>
      cell.field?.dataType === "Blank" &&
      cell.field?.label?.toLowerCase().trim() === "page break"
  );

  if (isPageBreak) {
    // finalize current page
    if (currentPage.length > 0) {
      this.stepPagedRows.push([...currentPage]);
      currentPage = [];
    }
    return; // 🚫 do not store the page-break row
  }

  currentPage.push(row);
});

if (currentPage.length > 0) {
  this.stepPagedRows.push(currentPage);
}



    // ✅ Reset to first step and update visible rows
    this.stepCurrentPageIndex = 0;
    this.updateStepVisibleRows();
  }

  // updateStepVisibleRows() {
  //   // Only show fields for current step
  //   this.tableRows = this.stepPagedRows[this.stepCurrentPageIndex].map(
  //     (row) => ({
  //       ...row,
  //       cells: row.cells.map((cell) => ({
  //         ...cell,
  //         isVisible:
  //           !(
  //             cell.field?.dataType === "Blank" &&
  //             cell.field?.label?.toLowerCase().trim() === "page break"
  //           ) && cell.style !== "display: none;",
  //         hasContent: !!(cell.field?.label || cell.field?.value)
  //       }))
  //     })
  //   );
  // }

  updateStepVisibleRows() {
    const pageIndex = this.stepCurrentPageIndex ?? 0;
    const raw = this.stepPagedRows?.[pageIndex] || [];
    const page = JSON.parse(JSON.stringify(raw)); 

    // 📝 collect BEFORE snapshot (textareas + dates)
    const before = [];
    raw.forEach((row, rIdx) =>
      (row.cells || []).forEach((cell, cIdx) => {
        if (cell?.isTextArea || cell?.isDateField) {
          before.push({
            id: String(cell.id),
            type: cell.isTextArea ? "textarea" : "date",
            rIdx,
            cIdx,
            value: cell.field?.value ?? ""
          });
        }
      })
    );
    console.group(`📄 updateStepVisibleRows(page=${pageIndex})`);
    console.log("🧾 BEFORE (textarea/date):", before);

    // build render model (unchanged) + add page-scoped key
    this.tableRows = page.map((row) => ({
      ...row,
      cells: (row.cells || []).map((cell) => ({
        ...cell,
        domKey: `${cell.id}@p${pageIndex}`,
        isVisible:
          !(
            cell.field?.dataType === "Blank" &&
            cell.field?.label?.toLowerCase().trim() === "page break"
          ) && cell.style !== "display: none;",
        hasContent: !!(cell.field?.label || cell.field?.value)
      }))
    }));

    // 📝 collect AFTER snapshot (textareas + dates)
    const after = [];
    this.tableRows.forEach((row, rIdx) =>
      (row.cells || []).forEach((cell, cIdx) => {
        if (cell?.isTextArea || cell?.isDateField) {
          after.push({
            id: String(cell.id),
            type: cell.isTextArea ? "textarea" : "date",
            domKey: cell.domKey,
            rIdx,
            cIdx,
            value: cell.field?.value ?? ""
          });
        }
      })
    );
    console.log("🧾 AFTER (textarea/date):", after);

    // 🔁 diffs
    const beforeMap = Object.fromEntries(before.map((x) => [x.id, x.value]));
    const diffs = after
      .filter((x) => beforeMap[x.id] !== x.value)
      .map((x) => ({
        id: x.id,
        type: x.type,
        from: beforeMap[x.id],
        to: x.value,
        domKey: x.domKey
      }));
    if (diffs.length) console.warn("🔁 Diff (paged→render):", diffs);
    else console.log("✅ No diffs (paged→render).");

    console.groupEnd();
  }

  get isFirstStepPage() {
    return this.stepCurrentPageIndex === 0;
  }

  get isLastStepPage() {
    return this.stepCurrentPageIndex === this.stepPagedRows.length - 1;
  }

  get stepCurrentPageDisplay() {
    return this.stepCurrentPageIndex + 1;
  }

  get totalStepPages() {
    return this.stepPagedRows.length;
  }

  get stepCurrentPageRows() {
    return this.stepPagedRows[this.stepCurrentPageIndex] || [];
  }

  // goToNextStepPage() {
  //   if (!this.isLastStepPage) {
  //     this.stepCurrentPageIndex++;
  //     this.updateStepVisibleRows();
  //   }
  // }

  // goToPreviousStepPage() {
  //   if (!this.isFirstStepPage) {
  //     this.stepCurrentPageIndex--;
  //     this.updateStepVisibleRows();
  //   }
  // }

  goToNextStepPage() {
    if (!this.isLastStepPage) {
      this.persistVisiblePage(); // <-- save edits first
      this.stepCurrentPageIndex++;
      this.updateStepVisibleRows(); // then render the new page
    }
  }

  goToPreviousStepPage() {
    if (!this.isFirstStepPage) {
      this.persistVisiblePage(); // <-- save edits first
      this.stepCurrentPageIndex--;
      this.updateStepVisibleRows(); // then render the new page
    }
  }
  // 1) Persist the visible page back into stepPagedRows
  persistVisiblePage() {
    const i = this.stepCurrentPageIndex ?? 0;
    const current = Array.isArray(this.tableRows) ? this.tableRows : [];

    // deep clone so LWC reactivity sees a new reference
    const cloned = JSON.parse(JSON.stringify(current));

    this.stepPagedRows = (this.stepPagedRows || []).map((page, idx) =>
      idx === i ? cloned : page
    );
  }

  get showStepProgressIndicator() {
    return this.stepPagedRows && this.stepPagedRows.length > 1;
  }

  get stepProgressFillStyle() {
    const total = this.stepPagedRows?.length || 1;
    const completed = this.stepCurrentPageIndex;
    const percentage = total > 1 ? (completed / (total - 1)) * 100 : 0;
    return `width: ${percentage}%;`;
  }

  get stepVisualProgressSteps() {
    return this.stepPagedRows.map((_, index) => {
      const isCompleted = index < this.stepCurrentPageIndex;
      const isActive = index === this.stepCurrentPageIndex;

      return {
        index,
        stepIndexPlusOne: index + 1,
        label:
          index === this.stepPagedRows.length - 1
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

  handleStepClick(event) {
    const stepIndex = parseInt(event.currentTarget.dataset.index, 10) - 1;
    if (stepIndex >= 0 && stepIndex < this.stepPagedRows.length) {
      this.stepCurrentPageIndex = stepIndex;
      this.updateStepVisibleRows();
    }
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
  //     let tableData = [];
  //     let pageCounter = 1;
  //     let currentPage = 1;

  //     // Insert first page heading
  //     tableData.push({
  //         isPageBreak: true,
  //         pageNumber: currentPage,
  //         arrow: '▼',
  //         isVisible: true,
  //         key: `page-${currentPage}`
  //     });

  //     formJson.forEach(row => {
  //         const isPageBreak = row.cells.some(cell =>
  //             cell.field?.dataType === 'Blank' &&
  //             cell.field?.label?.toLowerCase().trim() === 'page break'
  //         );

  //         if (isPageBreak) {
  //             currentPage++;
  //             tableData.push({
  //                 isPageBreak: true,
  //                 pageNumber: currentPage,
  //                 arrow: '▶',
  //                 isVisible: false,
  //                 key: `page-${currentPage}`
  //             });
  //             return; // skip rendering actual page break cell
  //         }

  //         row.cells.forEach(cell => {
  //             // ❌ Skip empty cells
  //             if (
  //                 cell?.field &&
  //                 cell.field.label &&
  //                 cell.field.label.trim() !== ''
  //             ) {
  //                 const isUploadFile = cell.field.dataType === 'Upload File';
  //                 const isRichText = cell.field.dataType === 'Text Field' && cell.field.selectedTextFieldOption === 'richText';
  //                 const isCheckbox = dataType === 'Checkbox Field';
  //                 const previewUrl = cell.field.value;
  //                 const downloadUrl = cell.field.downloadLink;
  //                 const isImage = previewUrl && (
  //                     /\.(jpg|jpeg|png|gif)$/i.test(previewUrl) ||
  //                     previewUrl.includes('rendition=ORIGINAL_JPG')
  //                 );

  //                 tableData.push({
  //                     id: cell.id,
  //                     label: cell.field.label,
  //                     value: this.getFormattedValue(cell),
  //                     isCheckbox: cell.isCheckboxField,
  //                     isUploadFile,
  //                     uploadUrl: previewUrl,
  //                     isImageFile: isImage,
  //                     isRegularField: !isUploadFile && !cell.isCheckboxField && !isRichText,
  //                     downloadUrl,
  //                     finalDownloadUrl: downloadUrl || previewUrl,
  //                     isRichText,
  //                     belongsToPage: currentPage,
  //                     isVisible: currentPage === 1,
  //                     isRadioButton: cell.field.dataType === 'Radio Button',
  //                     isRegularField: !isUploadFile && !cell.isCheckboxField && !isRichText && !cell.isRadioButton
  //                 });
  //             }
  //         });
  //     });

  //     this.viewTableData = tableData;
  // }

  prepareViewTable(formJson) {
    console.log("📋 prepareViewTable() called");
    let tableData = [];
    let pageCounter = 1; // kept for compatibility
    let currentPage = 1;

    // Insert first page heading
    tableData.push({
      isPageBreak: true,
      pageNumber: currentPage,
      arrow: "▼",
      isVisible: true,
      key: `page-${currentPage}`
    });

    formJson.forEach((row, rowIndex) => {
      const isPageBreak = row.cells.some(
        (cell) =>
          cell.field?.dataType === "Blank" &&
          cell.field?.label?.toLowerCase().trim() === "page break"
      );

      if (isPageBreak) {
        currentPage++;
        tableData.push({
          isPageBreak: true,
          pageNumber: currentPage,
          arrow: "▶",
          isVisible: false,
          key: `page-${currentPage}`
        });
        return; // skip rendering actual page break cell
      }

      row.cells.forEach((cell, colIndex) => {
        // ✅ Handle headers FIRST, regardless of label/value emptiness
        if (cell?.field && this.viewIsHeaderCell(cell)) {
          const title = this.viewNormalizeHeaderTitle(cell);
          if (title) {
            tableData.push({
              id: cell.id,
              isSectionHeader: true,
              title,
              // (optional) carry style if you want to use it in the template:
              headerStyle: cell.headerStyle || cell.field?.inlineStyle || "",
              belongsToPage: currentPage,
              isVisible: currentPage === 1
            });
            console.log(
              `🧭 Section Header at [${rowIndex}][${colIndex}]:`,
              title
            );
          } else {
            console.log(
              `🧭 Section Header at [${rowIndex}][${colIndex}] (empty title) — skipped`
            );
          }
          return; // don't also add a label/value row for this cell
        }

        // ❌ Skip truly empty/non-field cells
        if (!cell?.field || !(cell.field.label || "").trim()) {
          return;
        }

        const dataType = cell.field.dataType;
        const isUploadFile =
          dataType === "upload file" || cell.field?.isUpload === true;

        console.log(
          `🧩 Row ${rowIndex}, Cell ${colIndex} — rawType="${dataType}", normalized="${dataType}", isUploadFile=`,
          isUploadFile
        );

        const isRichText =
          dataType === "Text Field" &&
          cell.field.selectedTextFieldOption === "richText";
        const isRadioButton = dataType === "Radio Button";
        const isCheckbox = dataType === "Checkbox Field";
        const isChecked =
          isCheckbox &&
          (cell.field.value === true || cell.field.value === "true");

        const toArrayFn =
          typeof toArray === "function" ? toArray : this.viewToArray.bind(this);
        const isImageUrlFn =
          typeof isImageUrl === "function"
            ? isImageUrl
            : this.viewIsImageUrl.bind(this);

        const urlsArr = toArrayFn(cell.field.value);
        const downloadArr = toArrayFn(cell.field.downloadLink);

        // Build a normalized files[] list
        const files = urlsArr.map((url, i) => {
          const downloadUrl = downloadArr[i] || url;
          return {
            key: `${cell.id}-${i}`,
            url,
            downloadUrl,
            isImage: isImageUrlFn(url)
          };
        });

        // Legacy single-value fields for backward compatibility
        const previewUrl = files[0]?.url || null;
        const downloadUrl = files[0]?.downloadUrl || previewUrl;
        const isImage = files[0]?.isImage || false;

        // 🔍 Debug logs
        console.log(`🧩 Row ${rowIndex}, Cell ${colIndex}`);
        console.log(`   Label: ${cell.field.label}`);
        console.log(`   Data Type: ${dataType}`);
        console.log(`   Value:`, cell.field.value);
        console.log(`   isCheckbox:`, isCheckbox);
        console.log(`   value (urls):`, urlsArr);
        console.log(`   downloadLink (urls):`, downloadArr);

        const checkboxDisplayValue =
          cell.field.value === true || cell.field.value === "true";
        if (isCheckbox) {
          console.log("📦 checkboxDisplayValue:", checkboxDisplayValue);
        }

        tableData.push({
          id: cell.id,
          label: cell.field.label,
          value: this.getFormattedValue(cell),
          isCheckbox:
            cell.isCheckboxField || cell.field?.dataType === "Checkbox Field",
          isUploadFile,
          files, // [{ url, downloadUrl, isImage }]

          // legacy single-url fields (still present so old templates keep working)
          uploadUrl: previewUrl,
          isImageFile: isImage,
          downloadUrl,
          finalDownloadUrl: downloadUrl || previewUrl,

          isRichText,
          belongsToPage: currentPage,
          isVisible: currentPage === 1,
          isRadioButton,
          isRegularField:
            !isUploadFile && !isCheckbox && !isRichText && !isRadioButton
        });
      });
    });

    console.log("✅ Final viewTableData:", JSON.stringify(tableData, null, 2));
    this.viewTableData = tableData;
  }

  // Safely strip HTML to text
  viewAsText(html) {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || "").trim();
  }

  // Detect a header cell across your schema variants
  viewIsHeaderCell(cell) {
    const t = (cell?.field?.dataType || "").toLowerCase().trim();
    const opt = (cell?.field?.selectedTextFieldOption || "")
      .toLowerCase()
      .trim();
    return (
      t === "header" ||
      t === "heading" ||
      t === "section header" ||
      (t === "text field" &&
        ["header", "heading", "title", "h1", "h2", "h3"].includes(opt)) ||
      cell?.isHeader === true ||
      cell?.field?.isHeader === true
    );
  }

  // Prefer headerText → field.text → label → value
  viewNormalizeHeaderTitle(cell) {
    const candidates = [
      cell?.headerText, // ← present in your JSON
      cell?.field?.text, // ← present in your JSON ("YOU")
      cell?.field?.label,
      cell?.field?.value
    ];
    for (const c of candidates) {
      const t = this.viewAsText(c);
      if (t) return t;
    }
    return "";
  }

  // Fallbacks if originals aren't present
  viewToArray(v) {
    if (Array.isArray(v)) return v;
    if (v === null || v === undefined) return [];
    return String(v)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  viewIsImageUrl(u) {
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(u || "");
  }

  getFormattedValue(cell) {
    const dataType = cell.field?.dataType;

    // ✅ Checkbox Field (simplified: return "true" or "false" as string)
    if (cell.isCheckboxField || cell.field?.dataType === "Checkbox Field") {
      return cell.field.value === true || cell.field.value === "true"
        ? "action:approval"
        : "action:close";
    }

    // ✅ Multi-select dropdown
    if (cell.isDropdownField && cell.isMultiSelect) {
      if (Array.isArray(cell.selectedValues)) {
        return cell.selectedValues.join(", ");
      } else if (typeof cell.selectedValues === "string") {
        return cell.selectedValues;
      } else {
        return "—";
      }
    }

    // ✅ Single-select dropdown
    if (
      (cell.isDropdownField || dataType === "Dropdown Field") &&
      !cell.isMultiSelect
    ) {

      const field = cell.field || {};

      const matchedOption =
        (field.options || []).find(
          opt => opt.value === field.value
        );

      return (
        field.displayValue ||     // 🔥 THIS WILL NOW WORK
        matchedOption?.label ||
        field.value ||
        "—"
      );
    }



    // ✅ Upload File
    if (dataType === "Upload File") {
      return cell.field.value || "No File";
    }

    // ✅ Date Field
    if (dataType === "Date Field") {
      return this.formatDateDD(cell.field.value);
    }

    // ✅ Rich Text
    if (
      dataType === "Text Field" &&
      cell.field?.selectedTextFieldOption === "richText"
    ) {
      return cell.field.value || "<span>No Rich Text</span>";
    }

    // ✅ Radio Button
    if (cell.isRadioButton || dataType === "Radio Button") {
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

    // ✅ Fallback
    return cell.field.value != null ? String(cell.field.value) : "—";
  }

  togglePageSection(event) {
    const pageNumber = parseInt(event.currentTarget.dataset.page, 10);

    this.viewTableData = this.viewTableData.map((item) => {
      if (item.isPageBreak && item.pageNumber === pageNumber) {
        const isVisible = !item.isVisible;
        return {
          ...item,
          arrow: isVisible ? "▼" : "▶",
          isVisible
        };
      }

      if (!item.isPageBreak && item.belongsToPage === pageNumber) {
        const pageBreakRow = this.viewTableData.find(
          (p) => p.isPageBreak && p.pageNumber === pageNumber
        );
        return {
          ...item,
          isVisible: pageBreakRow ? !pageBreakRow.isVisible : item.isVisible
        };
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

  isCheckboxChecked(value) {
    return value === true || value === "true";
  }

  formatDateDD(value) {
  if (!value) return "N/A";

  // already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  // convert DD-MM-YYYY → DD/MM/YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [d, m, y] = value.split("-");
    return `${d}/${m}/${y}`;
  }

  // convert YYYY-MM-DD → DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  }

  // fallback for ISO or timestamp
  const date = new Date(value);
  if (isNaN(date)) return value;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
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

  // ── Helpers (unique names with "view" prefix) ────────────────────────────────
  viewResolveFormTitle(resp) {
    // Prefer Name__c → Name → (fallback empty)
    return resp?.Name__c ?? resp?.Name ?? "";
  }
  viewResolveFormType(resp) {
    // Prefer Form_Type__c → Type__c → FormType → (fallback empty)
    return resp?.Form_Type__c ?? resp?.Type__c ?? resp?.FormType ?? "";
  }
  viewLogFormHeader(where, title, type, resp) {
    console.log(
      `🧩 [${where}] Header snapshot → title=`,
      title,
      ", type=",
      type
    );
    if (!title) {
      console.warn(
        `⚠️ [${where}] selectedFormTitle is empty. Checked fields: Name__c, Name.`,
        {
          Name__c: resp?.Name__c,
          Name: resp?.Name
        }
      );
    }
    if (!type) {
      console.warn(
        `⚠️ [${where}] selectedFormType is empty. Checked fields: Form_Type__c, Type__c, FormType.`,
        {
          Form_Type__c: resp?.Form_Type__c,
          Type__c: resp?.Type__c,
          FormType: resp?.FormType
        }
      );
    }
  }



//   async handleEdit(event) {
//   this.isEditing = true;
//   this.selectedResponseId = event.currentTarget.dataset.id;

//   const response = this.formResponses.find(
//     (resp) => resp.Id === this.selectedResponseId
//   );

//   if (!response) {
//     console.error("❌ Error: Response not found.");
//     return;
//   }

//   try {
//     const initialTitle = this.viewResolveFormTitle(response);
//     const initialType = this.viewResolveFormType(response);

//     this.selectedFormTitle = initialTitle || "";
//     this.selectedFormType = initialType || "";

//     this.viewLogFormHeader(
//       "before-loadFormData(assign)",
//       this.selectedFormTitle,
//       this.selectedFormType,
//       response
//     );

//     // ============================================
//     // 🔥 Resolve AWS vs legacy inline JSON
//     // ============================================
//     const raw = response.Response_JSON__c;

//     let parsedResponseJson = [];

//     if (raw) {
//       const parsed = JSON.parse(raw);

//       if (parsed?.url && parsed?.key) {
//         console.log("🌐 Editing AWS-backed response — fetching:", parsed.url);

//         const resp = await fetch(parsed.url);
//         if (!resp.ok) {
//           throw new Error("Failed to load response JSON from AWS");
//         }

//         parsedResponseJson = await resp.json();
//       } else {
//         // legacy inline
//         parsedResponseJson = parsed;
//       }
//     }

//     // ============================================
//     // ✅ Log field labels BEFORE loadFormData
//     // ============================================
//     const preLabels = parsedResponseJson
//       .flatMap((row) => row.cells)
//       .filter((cell) => cell.field?.label && cell.field?.dataType !== "Blank")
//       .map((cell) => cell.field.label);

//     console.log("📋 Field Labels BEFORE loadFormData():", preLabels);

//     // ✅ Log full response data
//     console.log("📥 Parsed Response Data for Edit:", parsedResponseJson);

//     // ============================================
//     // ✅ Load into form renderer
//     // ============================================
//     this.loadFormData(parsedResponseJson, false);

//     this.isFormSelected = true;
//     this.isViewModeON = false;

//     // ============================================
//     // ✅ Log visible labels AFTER render
//     // ============================================
//     const visibleLabels = this.tableRows
//       .flatMap((row) => row.cells)
//       .filter(
//         (cell) =>
//           cell.isVisible &&
//           cell.field?.label &&
//           cell.field?.dataType !== "Blank"
//       )
//       .map((cell) => cell.field.label);

//     console.log("🧾 Visible Field Labels on Edit:", visibleLabels);

//   } catch (err) {
//     console.error("❌ Error loading response for edit:", err);
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
    console.error("❌ Error: Response not found.");
    return;
  }

    // ============================================
// ⭐ RESTORE MASTER TEMPLATE (REQUIRED FOR SUBMIT)
// ============================================

let templateRaw =
  response?.Form_Reference__r?.Form_JSON__c;

if (templateRaw) {
  try {

    let parsedTemplate = JSON.parse(templateRaw);

    // 🌐 Template stored in AWS
    if (parsedTemplate?.url && parsedTemplate?.key) {
      console.log("🌐 Loading MASTER template from AWS:", parsedTemplate.url);

      const tmplResp = await fetch(parsedTemplate.url);
      if (!tmplResp.ok) {
        throw new Error("Failed to load master template");
      }

      parsedTemplate = await tmplResp.json();
    }

    // ⭐ THIS IS THE FIX
    this.masterFormJson = structuredClone(parsedTemplate);

    console.log("✅ masterFormJson restored for EDIT");

  } catch (e) {
    console.error("❌ Failed to restore master template:", e);
  }
}

  try {
    // ============================================
    // ✅ Resolve Title + Type
    // ============================================
    const initialTitle = this.viewResolveFormTitle(response);
    const initialType = this.viewResolveFormType(response);

    this.selectedFormTitle = initialTitle || "";
    this.selectedFormType = initialType || "";

    this.viewLogFormHeader(
      "before-edit-load",
      this.selectedFormTitle,
      this.selectedFormType,
      response
    );

    // ============================================
    // 🔥 Resolve AWS vs legacy inline JSON
    // ============================================
    const raw = response.Response_JSON__c;

    let parsedResponseJson = [];

    if (raw) {
      const parsed = JSON.parse(raw);

      if (parsed?.url && parsed?.key) {
        console.log("🌐 Editing AWS-backed response — fetching:", parsed.url);

        const resp = await fetch(parsed.url);
        if (!resp.ok) {
          throw new Error("Failed to load response JSON from AWS");
        }

        parsedResponseJson = await resp.json();
      } else {
        parsedResponseJson = parsed;
      }
    }

    // ============================================
    // ✅ Debug: labels before build
    // ============================================
    const preLabels = parsedResponseJson
      .flatMap((row) => row.cells)
      .filter((cell) => cell.field?.label && cell.field?.dataType !== "Blank")
      .map((cell) => cell.field.label);

    console.log("📋 Field Labels BEFORE edit build:", preLabels);
    console.log("📥 Parsed Response JSON:", parsedResponseJson);
    //this.masterFormJson = JSON.parse(JSON.stringify(parsedResponseJson));

    console.log("🧪 EDIT CLICK — predefined option availability:", {
  staffOptions: this.staffOptions?.length || 0,
  participants: this.participants?.length || 0,
  facilityOptions: this.facilityOptions?.length || 0
});



    // ============================================
    // 🔥 BUILD UI RUNTIME MODEL (SAME AS CREATE)
    // ============================================
    const filteredRows = parsedResponseJson.map((row, rowIndex) => ({
      ...row,
      cells: row.cells.map((cell, colIndex) => {
        // 🔁 reuse EXACT same logic as handleFormClick

        return this.buildCellRuntimeModel(
          cell,
          rowIndex,
          colIndex
        );
      })
    }));

    // ============================================
    // ✅ Assign rows
    // ============================================
    this.tableRows = filteredRows;

    this.tableRows.forEach(row => {
  row.cells.forEach(cell => {
    if (
      cell.isDropdownField &&
      cell.field?.selectedDropdownOption === "predefinedList"
    ) {
      const match = cell.field.options?.find(o => o.isSelected);

      if (match) {
        console.log("🧩 POST BUILD forcing select value:", match);
        cell.field.value = match.value;
      }
    }
  });
});


    // ============================================
    // ✅ Build step pagination
    // ============================================
    this.stepPagedRows = [];
    let currentStepPage = [];

    filteredRows.forEach((row) => {
      const isPageBreak = row.cells.some(
        (cell) =>
          cell.field?.dataType === "Blank" &&
          cell.field?.label?.toLowerCase().trim() === "page break"
      );

      if (isPageBreak) {
        currentStepPage.push({
          ...row,
          isPageBreak: true
        });

        if (currentStepPage.length > 0) {
          this.stepPagedRows.push([...currentStepPage]);
          currentStepPage = [];
        }
      } else {
        currentStepPage.push(row);
      }
    });

    if (currentStepPage.length > 0) {
      this.stepPagedRows.push(currentStepPage);
    }

    this.stepCurrentPageIndex = 0;
    this.updateStepVisibleRows();

  //   this.viewTableData =
  // this.buildViewTableDataFromSubmitRows(allRows);
  this.viewTableData =
  this.buildViewTableDataFromSubmitRows(
    this.stepPagedRows.flat()
  );




    // ============================================
    // ✅ UI state
    // ============================================
    this.isFormSelected = true;
    this.isViewModeON = false;
    this.showPublishedForms = false;

    console.log("✅ Edit mode initialized. Form rendered.");

    // ============================================
    // ✅ Debug visible labels
    // ============================================
    const visibleLabels = this.tableRows
      .flatMap((row) => row.cells)
      .filter(
        (cell) =>
          cell.isVisible &&
          cell.field?.label &&
          cell.field?.dataType !== "Blank"
      )
      .map((cell) => cell.field.label);

    console.log("🧾 Visible Field Labels AFTER edit build:", visibleLabels);

  } catch (err) {
    console.error("❌ Error loading response for edit:", err);
    this.showToast(
      "Error",
      "Failed to load submitted form for editing.",
      "error"
    );
  }
}


buildCellRuntimeModel(cell, rowIndex, colIndex) {

  console.log("🧪 buildCellRuntimeModel options snapshot:", {
  dataType: cell.field?.dataType,
  dropdownType: cell.field?.selectedDropdownOption,
  predefinedType: cell.field?.predefinedListType,
  staff: this.staffOptions?.length || 0,
  participants: this.participants?.length || 0,
  facilities: this.facilityOptions?.length || 0,
  storedValue: cell.field?.value
});

  // =====================================================
  // BASE STATE
  // =====================================================
  let options = [];
  let selectedOptionsArray = [];
  let selectedValues = "";

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
  let isRadioButton = false;

  let isDropdownField = false;
  let isMultiSelect = false;

  let isUploadField = false;

  let isHeader = false;

  let hasComment = false;

  let isDropdownOpen = false;

  let maxLength = null;
  let decimalPlaces = 0;
  let charCount = 0;

  let placeholderText = "";

  // =====================================================
  // RADIO VALUE SPLIT (CRITICAL)
  // =====================================================
  let selectedRadioOption = "";
  let subInputValue = "";

  if (cell.field?.value) {
    const parts = String(cell.field.value).split(" - ");
    selectedRadioOption = parts[0] || "";
    subInputValue = parts[1] || "";
  }

  const floatingLabelStyle = this.getBorderStyle(cell.field?.dataType);

  const domKey = cell.domKey || `${rowIndex}-${colIndex}`;
  const id = cell.id || `cell-${rowIndex}-${colIndex}`;
  const dataId = `row-${rowIndex}-col-${colIndex}`;

  // =====================================================
  // COMMENTS
  // =====================================================
  hasComment =
    !!cell.field?.comments && cell.field.comments.trim() !== "";

  // =====================================================
  // UPLOAD FILE  🔥 FIXED
  // =====================================================
  if (cell.field?.dataType === "Upload File") {
    isUploadField = true;

    const urls = Array.isArray(cell.field.value)
      ? cell.field.value
      : [];

    cell.field.meta = cell.field.meta || {};
    cell.field.meta.uploadedFiles = urls.map((url, idx) => ({
      fileId: `edit-${idx}`,
      url,
      key: url.split("/").pop(),
      originalName: url.split("/").pop()
    }));
  }

  // =====================================================
  // DROPDOWN
  // =====================================================
  if (cell.field?.dataType === "Dropdown Field") {
    isDropdownField = true;

    placeholderText = `Select ${cell.field.label}`;

    if (cell.field.selectedDropdownOption === "multiSelect") {
      isMultiSelect = true;
    }

    // ---- predefined
   if (cell.field.selectedDropdownOption === "predefinedList") {
  const type = (cell.field.predefinedListType || "")
    .trim()
    .toLowerCase();

  const storedRaw = String(cell.field.value || "")
    .trim()
    .toLowerCase();

  console.log("🧪 EDIT predefined dropdown match check:", {
    type,
    storedRaw
  });

  // ======================
// PREDEFINED LIST HANDLING (STAFF / PARTICIPANT / FACILITY)
// ======================
if (type === "staff" || type === "participant" || type === "facility") {

  const normalize = str =>
    String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const storedRaw = cell.field?.value || "";
  const storedNorm = normalize(storedRaw);

  console.log("🧪 EDIT predefined dropdown match check:", {
    type,
    storedRaw,
    storedNorm,
    staff: this.staffOptions?.length || 0,
    participants: this.participants?.length || 0,
    facilities: this.facilityOptions?.length || 0
  });

  // ----------------------------------
  // STAFF
  // ----------------------------------
  if (type === "staff" && this.staffOptions?.length) {
    options = this.staffOptions.map(o => {
      const idNorm = normalize(o.value);
      const labelNorm = normalize(o.label);

      const isSelected =
        storedNorm === idNorm ||
        storedNorm === labelNorm;

      if (isSelected) {
        console.log("✅ STAFF MATCH:", {
          storedRaw,
          option: o
        });
      }

      return {
        label: o.label,
        value: o.value,
        isSelected
      };
    });
  }

  // ----------------------------------
  // PARTICIPANT
  // ----------------------------------
  if (type === "participant" && this.participants?.length) {
    let matchedId = null;

    options = this.participants.map(p => {
      const idNorm = normalize(p.Id);
      const nameNorm = normalize(p.Name);

      const isSelected =
        storedNorm === idNorm ||
        storedNorm === nameNorm;

      if (isSelected) {
        matchedId = p.Id;

        console.log("✅ PARTICIPANT MATCH FOUND:", {
          storedRaw,
          optionName: p.Name,
          optionId: p.Id
        });
      }

      return {
        label: p.Name,
        value: p.Id,
        isSelected
      };
    });

    // 🔥 FORCE SELECT VALUE TO ID FOR <select>
    if (matchedId) {
      cell.field.value = matchedId;
    }
  }


  // ----------------------------------
  // FACILITY
  // ----------------------------------
  if (type === "facility" && this.facilityOptions?.length) {
    options = this.facilityOptions.map(f => {
      const idNorm = normalize(f.value);
      const labelNorm = normalize(f.label);

      const isSelected =
        storedNorm === idNorm ||
        storedNorm === labelNorm;

      if (isSelected) {
        console.log("✅ FACILITY MATCH:", {
          storedRaw,
          option: f
        });
      }

      return {
        label: f.label,
        value: f.value,
        isSelected
      };
    });
  }
}

}


    // ---- manual single
    if (
      cell.field.selectedDropdownOption === "singleSelect" &&
      cell.field.singleSelectValues
    ) {
      options = cell.field.singleSelectValues
        .split("\n")
        .map(v => ({
          label: v.trim(),
          value: v.trim(),
          isSelected: cell.field.value === v.trim()
        }))
        .filter(o => o.label);
    }

    // ---- manual multi
    if (
      cell.field.selectedDropdownOption === "multiSelect" &&
      cell.field.multiSelectValues
    ) {
      options = cell.field.multiSelectValues
        .split("\n")
        .map(v => ({
          label: v.trim(),
          value: v.trim(),
          isSelected: false
        }))
        .filter(o => o.label);

      selectedOptionsArray = cell.field.value
        ? cell.field.value.split(", ")
        : [];

      selectedValues = selectedOptionsArray.join(", ");

      options.forEach(o => {
        if (selectedOptionsArray.includes(o.label)) {
          o.isSelected = true;
        }
      });
    }
  }

  // =====================================================
  // TEXT FIELD
  // =====================================================
  if (cell.field?.dataType === "Text Field") {
    if (cell.field.selectedTextFieldOption === "textArea") {
      isTextArea = true;
      maxLength = 255;
      charCount = cell.field.value?.length || 0;
    }

    if (cell.field.selectedTextFieldOption === "alphaNumeric") {
      isAlphaNumeric = true;
      maxLength = parseInt(cell.field.alphaNumericLength || 56, 10);
    }

    if (cell.field.selectedTextFieldOption === "onlyAlphabets") {
      isOnlyAlphabets = true;
      maxLength = parseInt(cell.field.onlyAlphabetsLength || 55, 10);
    }

    if (cell.field.selectedTextFieldOption === "richText") {
      isRichText = true;
    }

    placeholderText ||= `Enter ${cell.field.label}`;
  }

  // =====================================================
  // NUMBER
  // =====================================================
  if (cell.field?.dataType === "Number Field") {
    switch (cell.field.selectedNumberFieldOption) {
      case "contactNumber":
        isContactNumber = true;
        maxLength = parseInt(cell.field.contactNumberDigits || 10, 10);
        break;

      case "currency":
        isCurrency = true;
        decimalPlaces = parseInt(cell.field.decimalValue || 2, 10);
        break;

      default:
        isDefaultNumber = true;
    }
  }

  if (cell.field?.dataType === "Time Field") isTimeField = true;
  if (cell.field?.dataType === "Date Field") isDateField = true;
  if (cell.field?.dataType === "Checkbox Field") isCheckboxField = true;

  // =====================================================
  // RADIO 🔥 FULL RESTORE
  // =====================================================
  if (cell.field?.dataType === "Radio Button") {
    isRadioButton = true;

    cell.radioOptionsProcessed = (cell.field.radioOptions || []).map(opt => {
      const isSelected = selectedRadioOption === opt.optionLabel;

      let processedSubOptions = [];

      if (opt.usePredefinedOptions) {
        const predefined = opt.selectedPredefined?.toLowerCase();

        if (predefined === "staff") {
          processedSubOptions = this.staffOptions.map(o => ({
            label: o.label,
            isSelected: subInputValue === o.label
          }));
        }

        if (predefined === "participant") {
          processedSubOptions = this.participants.map(p => ({
            label: p.Name,
            isSelected: subInputValue === p.Name
          }));
        }

        if (predefined === "facility") {
          processedSubOptions = this.facilityOptions.map(f => ({
            label: f.label,
            isSelected: subInputValue === f.label
          }));
        }
      } else {
        processedSubOptions = (opt.values || []).map(v => ({
          label: v,
          isSelected: subInputValue === v
        }));
      }

      return {
        ...opt,
        isSelected,
        processedSubOptions,
        isDropdown: opt.subType === "dropdown",
        isTextInput: opt.subType === "text",
        isRadioList: opt.subType === "radio",
        hasSubInput: opt.hasSubInput || false,
        subQuestion: opt.subQuestion || ""
      };
    });

    cell.subRadioName = id + "-subradio";
  }

  // =====================================================
  // HEADER
  // =====================================================
  let headerText = null;
  let headerStyle = "";

  if (
    cell.field?.dataType === "Header" ||
    cell.field?.isHeader === true
  ) {
    isHeader = true;
    headerText = cell.field?.text || cell.field?.label || "Section";
    headerStyle = cell.field?.inlineStyle || "";
  }

  // =====================================================
  // VISIBILITY
  // =====================================================
  const isPageBreak =
    cell.field?.dataType === "Blank" &&
    cell.field?.label?.toLowerCase().trim() === "page break";

  const isVisible = !isPageBreak && cell.style !== "display: none;";

  // =====================================================
  // RETURN FINAL CELL
  // =====================================================
  return {
    ...cell,

    id,
    dataId,
    domKey,

    isVisible,

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
    isCurrency,
    isContactNumber,
    isDefaultNumber,

    isTimeField,
    isDateField,
    isCheckboxField,

    isDropdownField,
    isMultiSelect,

    isUploadField,

    isRichText,
    isRadioButton,

    isHeader,
    headerText,
    headerStyle,

    hasComment,

    floatingLabelStyle,
    placeholderText,

    maxLength,
    decimalPlaces,

    charCount,

    isDropdownOpen,

    selectedOptionsArray,
    selectedValues,

    selectedRadioOption,
    subInputValue,

    field: {
      ...cell.field,
      value: cell.field?.value || "",
      options
    },

    hasContent: !!(
      isHeader ||
      cell.field?.label ||
      isTextArea ||
      isAlphaNumeric ||
      isOnlyAlphabets ||
      isRichText ||
      isCheckboxField ||
      isDropdownField ||
      isUploadField ||
      isRadioButton
    )
  };
}



  handleDelete(event) {
    const responseId = event.currentTarget.dataset.id;

    if (!responseId) {
      console.error("Error: Response ID is undefined");
      return;
    }

    deleteFormResponse({ responseId })
      .then(() => {
        this.showToast(
          "Success",
          "Form response deleted successfully!",
          "success"
        );
        return refreshApex(this.wiredFormResponses); // Refresh responses after deletion
      })
      .catch((error) => {
        console.error("Error deleting response:", error);
        this.showToast("Error", "Error deleting response", "error");
      });
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

  //   handleInputChange(event) {
  //   const cellIdRaw = event?.target?.dataset?.id;
  //   const cellId = cellIdRaw != null ? String(cellIdRaw) : '';
  //   const inputType = String(event?.target?.type || '').toLowerCase();

  //   let newValue = inputType === 'checkbox' ? !!event.target.checked : (event?.target?.value ?? '');

  //   // Optional: normalize dates to YYYY-MM-DD (browser usually already does this)
  //   if (inputType === 'date' && newValue) {
  //     if (newValue instanceof Date) {
  //       const y = newValue.getFullYear();
  //       const m = String(newValue.getMonth() + 1).padStart(2, '0');
  //       const d = String(newValue.getDate()).padStart(2, '0');
  //       newValue = `${y}-${m}-${d}`;
  //     } else if (/^\d{4}-\d{2}-\d{2}$/.test(newValue) === false) {
  //       const t = new Date(newValue);
  //       if (!isNaN(t)) {
  //         const y = t.getFullYear();
  //         const m = String(t.getMonth() + 1).padStart(2, '0');
  //         const d = String(t.getDate()).padStart(2, '0');
  //         newValue = `${y}-${m}-${d}`;
  //       }
  //     }
  //   }

  //   console.group(`🖊️ handleInputChange id="${cellId}" type=${inputType} val="${newValue}"`);

  //   let matched = false;
  //   let matchedPos = null;
  //   let oldValue;

  //   // 🔄 Update the actual data source: stepPagedRows (across all pages) — your logic, with logs
  //   for (let pIdx = 0; pIdx < (this.stepPagedRows?.length || 0); pIdx++) {
  //     const page = this.stepPagedRows[pIdx] || [];
  //     for (let rIdx = 0; rIdx < page.length; rIdx++) {
  //       const row = page[rIdx];
  //       const cells = row?.cells || [];
  //       for (let cIdx = 0; cIdx < cells.length; cIdx++) {
  //         const cell = cells[cIdx];

  //         if (String(cell?.id) === cellId && cell?.field) {
  //           matched = true;
  //           matchedPos = { pIdx, rIdx, cIdx };
  //           oldValue = cell.field.value;

  //           // ✅ Checkbox
  //           if (inputType === 'checkbox') {
  //             cell.field.value = newValue;
  //           }
  //           // ✅ Single-select dropdown
  //           else if (cell.isDropdownField && !cell.isMultiSelect) {
  //             cell.field.value = newValue;
  //             cell.selectedValues = newValue;

  //             if (Array.isArray(cell.field.options)) {
  //               cell.field.options = cell.field.options.map((opt) => ({
  //                 ...opt,
  //                 isSelected: opt.label === newValue
  //               }));
  //             }
  //             console.log(`✅ Single-Select Updated: ${cell.field.value}`);
  //           }
  //           // ✅ Multi-select dropdown (native <select multiple>)
  //           else if (cell.isDropdownField && cell.isMultiSelect) {
  //             const selected = Array.from(event.target.selectedOptions || [], (o) => o.value);
  //             newValue = selected.join(', ');
  //             cell.field.value = newValue;
  //             console.log(`✅ Multi-Select Updated: ${cell.field.value}`);
  //           }
  //           // ✅ Default: Text, date, time, number, etc.
  //           else {
  //             cell.field.value = newValue;
  //           }

  //           console.log(`📌 stepPagedRows write @ page=${pIdx} row=${rIdx} col=${cIdx} | "${oldValue}" → "${cell.field.value}"`);

  //           // Optional global store (if you’re using it)
  //           if (this.cellValueById instanceof Map) {
  //             this.cellValueById.set(cellId, cell.field.value);
  //           }

  //           // ✅ Remove error highlight if valid (your logic intact)
  //           if (
  //             cell.field.isRequired &&
  //             newValue !== undefined &&
  //             newValue !== null &&
  //             String(newValue).trim() !== ''
  //           ) {
  //             event.target.classList.remove('highlight-error');
  //           }

  //           // done — exit all loops
  //           pIdx = this.stepPagedRows.length; // force outer loop exit
  //           break;
  //         }
  //       }
  //     }
  //   }

  //   if (!matched) {
  //     console.warn(`⚠️ No matching cell for id="${cellId}" found across stepPagedRows.`);
  //   }

  //   // 🪞 Mirror into the currently rendered tableRows so UI updates immediately (keeps your UX snappy)
  //   if (matched) {
  //     this.tableRows = (this.tableRows || []).map((row, rIdx) => {
  //       const cells = (row?.cells || []).map((c, cIdx) => {
  //         if (String(c?.id) !== cellId) return c;
  //         console.log(`🪟 tableRows mirror @ row=${rIdx} col=${cIdx} | "${c?.field?.value}" → "${newValue}"`);
  //         return { ...c, field: { ...(c.field || {}), value: newValue } };
  //       });
  //       return { ...row, cells };
  //     });
  //   }

  //   console.groupEnd();
  // }

    handleRtePaste(event) {
    try {
      const items = event.clipboardData?.items || [];
      // Block pasted image files outright
      for (const it of items) {
        if (it.kind === "file" && it.type?.startsWith("image/")) {
          event.preventDefault();
          return;
        }
      }
      // Block HTML pastes that contain <img>
      const html = event.clipboardData?.getData("text/html") || "";
      if (/<img\b/i.test(html)) {
        event.preventDefault();
      }
    } catch (e) {
      // no-op; the sanitization in handleInputChange still protects you
    }
  }

handleInputChange(event) {
  const cellIdRaw = event?.target?.dataset?.id;
  const cellId = cellIdRaw != null ? String(cellIdRaw) : "";

  // Detect LWC rich text
  const isRichText =
    (event?.target?.tagName &&
      String(event.target.tagName).toUpperCase() ===
        "LIGHTNING-INPUT-RICH-TEXT") ||
    event?.target?.classList?.contains("rich-text-editor");

  const inputType = String(event?.target?.type || "").toLowerCase();

  // === derive newValue with RTE support & sanitization ===
  let newValue;
  if (inputType === "checkbox") {
    newValue = !!event.target.checked;
  } else if (isRichText) {
    const raw = event?.detail?.value ?? "";
    let cleaned = raw.replace(/<img\b[^>]*>/gi, "");
    cleaned = cleaned.replace(/url\(["']?data:image\/[^"')]+["']?\)/gi, "");
    newValue = cleaned;

    if (cleaned !== raw) {
      const rte = this.template.querySelector(
        `.rich-text-editor[data-id="${cellId}"]`
      );
      if (rte) rte.value = cleaned;
    }
  } else {
    newValue = event?.target?.value ?? "";
  }

  // Normalize dates
  if (!isRichText && inputType === "date" && newValue) {
    if (newValue instanceof Date) {
      const y = newValue.getFullYear();
      const m = String(newValue.getMonth() + 1).padStart(2, "0");
      const d = String(newValue.getDate()).padStart(2, "0");
      newValue = `${y}-${m}-${d}`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(newValue) === false) {
      const t = new Date(newValue);
      if (!isNaN(t)) {
        const y = t.getFullYear();
        const m = String(t.getMonth() + 1).padStart(2, "0");
        const d = String(t.getDate()).padStart(2, "0");
        newValue = `${y}-${m}-${d}`;
      }
    }
  }

  console.group(
    `🖊️ handleInputChange id="${cellId}" type=${inputType} val="${newValue}"`
  );

  // ✅ SINGLE SOURCE OF TRUTH UPDATE
  this.updateCellOnCurrentPage(cellId, (cell) => {
    const updated = { ...cell };

    // Checkbox
    if (inputType === "checkbox") {
      updated.field = { ...(cell.field || {}), value: newValue };
    }

    // Single-select dropdown
    else if (cell.isDropdownField && !cell.isMultiSelect) {

      const options = cell.field?.options || [];

      const selectedOption =
        options.find(opt => opt.value === newValue);

      updated.field = {
        ...(cell.field || {}),

        value: newValue,

        // 🔥 STORE LABEL ALSO
        displayValue:
          selectedOption?.label ||
          selectedOption?.value ||
          newValue,

        options: options.map(opt => ({
          ...opt,
          isSelected: opt.value === newValue
        }))
      };

      updated.selectedValues =
        selectedOption?.label || newValue;
    }


    // Multi-select dropdown
    else if (cell.isDropdownField && cell.isMultiSelect) {
      const selected = Array.from(
        event.target.selectedOptions || [],
        (o) => o.value
      );
      const joined = selected.join(", ");

      updated.field = { ...(cell.field || {}), value: joined };
      updated.selectedValues = joined;
    }

    // Default
    else {
      updated.field = { ...(cell.field || {}), value: newValue };
    }

    // Remove error highlight if valid
    if (
      updated.field?.isRequired &&
      newValue !== undefined &&
      newValue !== null &&
      String(newValue).trim() !== ""
    ) {
      event.target.classList.remove("highlight-error");
    }

    // Optional global store
    if (this.cellValueById instanceof Map) {
      this.cellValueById.set(cellId, updated.field?.value);
    }

    return updated;
  });

  console.groupEnd();
}




updateCellOnCurrentPage(cellId, updater) {
  const i = this.stepCurrentPageIndex ?? 0;
  const pages = this.stepPagedRows || [];
  const page = Array.isArray(pages[i]) ? pages[i] : [];

  console.group(
    `🔄 updateCellOnCurrentPage → cellId="${cellId}" pageIndex=${i}`
  );
  console.log("➡️ Current page snapshot:", JSON.parse(JSON.stringify(page)));

  const updatedPage = page.map((row, rIdx) => {
    if (!Array.isArray(row?.cells)) return row;

    const cells = row.cells.map((c, cIdx) => {
      if (String(c?.id) === String(cellId)) {
        console.log(
          `✅ Match row=${rIdx} col=${cIdx} oldVal="${c?.field?.value}"`
        );
        const newCell = updater({ ...c });
        console.log(`   → newVal="${newCell?.field?.value}"`);
        return newCell;
      }
      return c;
    });

    return { ...row, cells };
  });


  // 🔁 WRITE BACK INTO stepPagedRows
  this.stepPagedRows = pages.map((p, idx) =>
  idx === i ? updatedPage : p
);

  // 🔁 ALSO update tableRows for the current page
  // if (i === this.stepCurrentPageIndex) {
  //   this.tableRows = JSON.parse(JSON.stringify(updatedPage));
  // }

  // 🔁 ALSO update tableRows (GLOBAL copy)
this.tableRows = (this.tableRows || []).map(row => {
  if (!Array.isArray(row?.cells)) return row;

  const cells = row.cells.map(c => {
    if (String(c?.id) === String(cellId)) {
      return updater({ ...c });
    }
    return c;
  });

  return { ...row, cells };
});

  console.log("✅ stepPagedRows[pageIndex] updated:", this.stepPagedRows[i]);
  console.groupEnd();
}



  handleTextAreaInput(event) {
    const id = String(event?.target?.dataset?.id ?? "");
    const val = event?.target?.value ?? "";

    console.group(`📝 handleTextAreaInput cellId="${id}" val="${val}"`);

    // 1) Update the paged source of truth immediately
    this.updateCellOnCurrentPage(id, (cell) => ({
      ...cell,
      field: { ...(cell.field || {}), value: val },
      charCount: val.length
    }));

    // 2) Mirror into currently rendered rows so the UI stays in sync
    let matched = false;
    this.tableRows = (this.tableRows || []).map((row, rIdx) => {
      if (!Array.isArray(row?.cells)) return row;
      const cells = row.cells.map((c, cIdx) => {
        if (String(c?.id) === id) {
          matched = true;
          console.log(
            `🔎 Match in tableRows row=${rIdx} col=${cIdx} oldVal="${c?.field?.value}"`
          );
          return {
            ...c,
            field: { ...(c.field || {}), value: val },
            charCount: val.length
          };
        }
        return c;
      });
      return { ...row, cells };
    });

    if (!matched) {
      console.warn(`⚠️ No match for id="${id}" inside tableRows`);
    }

    console.log("✅ Updated tableRows:", this.tableRows);
    console.groupEnd();
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

  // handleSubmit() {
  //   console.log("📤 handleSubmit triggered");
  //   // ✅ Flatten all rows
  //   let allRows = this.stepPagedRows.flat();

  //   // ✅ Pre-process dropdown values before saving
  //   allRows = allRows.map((row) => ({
  //     ...row,
  //     cells: row.cells.map((cell) => {
  //       const field = cell.field;

  //       // 🟨 ✅ 1. Preserve Page Breaks without modifying anything
  //       if (
  //         field &&
  //         field.dataType === "Blank" &&
  //         field.label?.toLowerCase().trim() === "page break"
  //       ) {
  //         return cell;
  //       }

  //       let newField;

  //       // 🟢 2. Handle Checkbox Field
  //       if (cell.isCheckboxField) {
  //         newField = {
  //           ...cell.field,
  //           value: !!cell.field?.value // force true/false
  //         };

  //         return {
  //           ...cell,
  //           field: newField
  //         };
  //       }

  //       // 📎 3. Handle Upload Field
  //       if (cell.isUploadField && cell.field?.downloadLink) {
  //         newField = {
  //           ...cell.field,
  //           downloadLink: cell.field.downloadLink
  //         };

  //         return {
  //           ...cell,
  //           field: newField
  //         };
  //       }

  //       // 🔽 4. Handle Multi-select Dropdown
  //       if (cell.isDropdownField && cell.isMultiSelect) {
  //         const selectedOptions = cell.field.options
  //           .filter((option) => option.isSelected)
  //           .map((option) => option.label)
  //           .join(", ");

  //         newField = {
  //           ...cell.field,
  //           value: selectedOptions
  //         };

  //         return {
  //           ...cell,
  //           selectedValues: selectedOptions,
  //           field: newField
  //         };
  //       }

  //       // 🔽 5. Handle Single-select Dropdown
  //       if (cell.isDropdownField && !cell.isMultiSelect) {
  //         const selectedValue = cell.selectedValues || cell.field?.value || "";

  //         newField = {
  //           ...cell.field,
  //           value: selectedValue
  //         };

  //         return {
  //           ...cell,
  //           selectedValues: selectedValue,
  //           field: newField
  //         };
  //       }

  //       // 🔘 6. Handle Radio Button with optional subinput
  //       if (cell.isRadioButton || field?.dataType === "Radio Button") {
  //         const selectedRadio = cell.selectedRadioOption || field?.value || "";
  //         const subInput = cell.subInputValue || "";

  //         newField = {
  //           ...field,
  //           value: subInput ? `${selectedRadio} - ${subInput}` : selectedRadio
  //         };

  //         return {
  //           ...cell,
  //           selectedRadioOption: selectedRadio,
  //           subInputValue: subInput,
  //           field: newField
  //         };
  //       }

  //       // 🔚 7. Default fallback: return cell with preserved field
  //       return {
  //         ...cell,
  //         field: field
  //       };
  //     })
  //   }));

  //   console.log("🔍 Validating required fields...");

  //   let missingFields = [];
  //   allRows.forEach((row) => {
  //     row.cells.forEach((cell) => {
  //       const field = cell.field;
  //       const inputEl = this.template.querySelector(`[data-id="${cell.id}"]`);
  //       if (inputEl) inputEl.classList.remove("highlight-error");

  //       if (field && field.isRequired === true) {
  //         const isEmpty =
  //           field.value === undefined ||
  //           field.value === null ||
  //           field.value.toString().trim() === "";

  //         console.log(`🔍 Checking Required Field: ${field.label}`);
  //         console.log(`   ⮕ Field Value: "${field.value}"`);
  //         console.log(`   ⮕ Data ID: ${cell.id}`);
  //         console.log(`   ⮕ Input Element Found:`, inputEl);

  //         if (isEmpty) {
  //           console.warn(`❗ Missing Required Field: ${field.label}`);
  //           missingFields.push(field.label);
  //           if (inputEl) {
  //             inputEl.classList.add("highlight-error");
  //           } else {
  //             console.warn(
  //               `⚠️ No input element found for data-id="${cell.id}"`
  //             );
  //           }
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

  //   // ✅ Convert to JSON for backend
  //   const responseJson = JSON.stringify(allRows);
  //   console.log("✅ RESPONSE!" + responseJson);

  //   if (this.isEditing) {
  //     updateFormResponse({ responseId: this.selectedResponseId, responseJson })
  //       .then(() => {
  //         this.showToast("Success", "Form Updated Successfully!", "success");
  //         this.isFormSelected = false;
  //         this.isViewModeON = true;
  //         this.isEditing = false;
  //         this.isExpandview = false;
  //         this.resetSearchAndList();
  //         return refreshApex(this.wiredFormResponses);
  //       })
  //       .catch((error) => {
  //         this.showToast("Error", "Error updating form", "error");
  //         console.error(error);
  //       });
  //   } else {
  //     console.log("Initiating Form Submission...");
  //     console.log("Form Details:", {
  //       formId: this.selectedForm?.Id,
  //       formName: this.selectedForm?.Name__c,
  //       formType: this.selectedForm?.Form_Type__c,
  //       responseJson: responseJson,
  //       orgId: this.orgid,
  //       clientId: this.clientId
  //     });

  //     saveFormResponse({
  //       formId: this.selectedForm.Id,
  //       responseJson: responseJson,
  //       orgId: this.orgid,
  //       clientId: this.clientId,
  //       formName: this.selectedForm.Name__c,
  //       formType: this.selectedForm.Form_Type__c
  //     })
  //       .then(() => {
  //         console.log("✅ Form Submitted Successfully!");
  //         this.showToast("Success", "Form Submitted Successfully!", "success");
  //         this.isFormSelected = false;
  //         this.isViewModeON = true;
  //         this.isEditing = false;
  //         this.isExpandview = false;
  //         this.resetSearchAndList();
  //         return refreshApex(this.wiredFormResponses);
  //       })
  //       .then(() => {
  //         console.log("✅ Apex Data Refreshed Successfully!");
  //       })
  //       .catch((error) => {
  //         console.error("❌ Error submitting form:", error);
  //         this.showToast("Error", "Error submitting form", "error");
  //       });
  //   }
  // }

// @track bucketName = 'datainfo';
@track bucketName = 'docimgupld';

async uploadPdfFileToS3({ file, responseId, isUpdate, existingAwsJson }) {
  console.log("📦 [uploadPdfFileToS3] START", {
    responseId,
    isUpdate,
    fileName: file?.name,
    fileType: file?.type,
    fileSize: file?.size
  });

  const ts = Date.now();
  const safe = this.sanitizeName(file.name);

  console.log("🧼 [uploadPdfFileToS3] Sanitized filename:", safe);

  // ✅ reuse key if updating
  let key;
  if (isUpdate && existingAwsJson) {
    try {
      const parsed = JSON.parse(existingAwsJson);
      key = parsed?.key;
      console.log("♻️ [uploadPdfFileToS3] Reusing existing S3 key:", key);
    } catch (e) {
      console.warn("⚠️ [uploadPdfFileToS3] Failed to parse existingAwsJson", e);
    }
  }

  if (!key) {
    key = `forms/${responseId}/${ts}-${safe}`;
    console.log("🆕 [uploadPdfFileToS3] Generated new S3 key:", key);
  }

  const contentType = file.type || "application/pdf";
  console.log("📄 [uploadPdfFileToS3] Content-Type:", contentType);
  console.log("🪣 [uploadPdfFileToS3] Bucket:", this.bucketName);

  // ---- presign ----
  console.log(
    `🔐 [uploadPdfFileToS3] Requesting presign (${isUpdate ? "UPDATE" : "CREATE"})`
  );

  const presign = isUpdate
    ? await getUpdatePresignedUrl({ bucketName: this.bucketName, key, contentType })
    : await getPresignedUrl({ bucketName: this.bucketName, key, contentType });

  console.log("🔑 [uploadPdfFileToS3] Presign response:", presign);

  if (!presign?.uploadUrl || !presign?.key) {
    console.error("❌ [uploadPdfFileToS3] Invalid presign response", presign);
    throw new Error("Presign response missing uploadUrl/key");
  }

  // ---- PUT upload ----
  console.log("🚀 [uploadPdfFileToS3] Uploading to S3 PUT URL");
  console.log("➡️ PUT URL:", presign.uploadUrl);

  const putResp = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file
  });

  console.log(
    "📤 [uploadPdfFileToS3] PUT response:",
    putResp.status,
    putResp.statusText
  );

  if (!putResp.ok) {
    console.error("❌ [uploadPdfFileToS3] S3 PUT failed", {
      status: putResp.status,
      statusText: putResp.statusText
    });
    throw new Error(`S3 PUT failed: ${putResp.status} ${putResp.statusText}`);
  }

  const url = `https://${this.bucketName}.s3.amazonaws.com/${presign.key}`;

  console.log("✅ [uploadPdfFileToS3] Upload SUCCESS", {
    key: presign.key,
    url
  });

  return {
    key: presign.key,
    url,
    contentType,
    fileName: file.name
  };
}
sanitizeName(name) {
  if (!name) return "file";
  return name
    .replace(/\s+/g, "_")          // spaces → underscore
    .replace(/[^\w.\-]/g, "")      // remove unsafe chars
    .toLowerCase();
}

// buildViewTableDataFromSubmitRows(allRows) {
//   const out = [];

//   allRows.forEach((row) => {
//     row.cells.forEach((cell) => {
//       const f = cell.field;
//       if (!f) return;

//       const label = (f.label || "").trim();
//       const dataType = f.dataType;

//       const isPageBreak =
//         dataType === "Blank" &&
//         label.toLowerCase() === "page break";

//       // ✅ skip ALL Blank fields except real page breaks (or if you want them visible)
//       if (dataType === "Blank" && !isPageBreak) return;

//       let value = f.value ?? "";

//       // ✅ skip totally empty rows (these are what become “extra rows”)
//       const valueStr = (value === null || value === undefined) ? "" : String(value).trim();
//       if (!label && !valueStr && !isPageBreak) return;

//       out.push({
//         id: cell.id,
//         label,
//         value,
//         dataType,
//         isPageBreak,
//         isVisible: true,
//         isCheckbox: cell.isCheckboxField || dataType === "Checkbox",
//         isRichText: dataType === "Rich Text"
//       });
//     });
//   });

//   return out;
// }

buildViewTableDataFromSubmitRows(allRows) {
  const out = [];

  // 🔹 Centralized PDF date formatter
  const formatDateForPdf = (value) => {
    if (!value) return "";

    const d = new Date(value);
    if (isNaN(d)) return value; // fallback if already formatted

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`; // DD/MM/YYYY
  };

  allRows.forEach((row) => {
    row.cells.forEach((cell) => {
      const f = cell.field;
      if (!f) return;

      const label = (f.label || "").trim();
      const dataType = f.dataType;

      const isPageBreak =
        dataType === "Blank" &&
        label.toLowerCase() === "page break";

      // ✅ skip ALL Blank fields except page breaks
      if (dataType === "Blank" && !isPageBreak) return;

      let value = f.value ?? "";

        // 🔥 dropdown label support
        if (dataType === "Dropdown Field") {
          value =
            f.displayValue ||
            (f.options || []).find(o => o.value === f.value)?.label ||
            f.value ||
            "";
        }


      // ============================================
      // ⭐ DATE NORMALIZATION (MAIN FIX)
      // ============================================
      if (dataType === "Date Field" && value) {
        value = formatDateForPdf(value);
      }

      // ✅ skip totally empty rows
      const valueStr =
        value === null || value === undefined
          ? ""
          : String(value).trim();

      if (!label && !valueStr && !isPageBreak) return;

      out.push({
        id: cell.id,
        label,
        value,
        dataType,
       
        field: f, 
        isPageBreak,
        isVisible: true,
        isCheckbox:
          cell.isCheckboxField ||
          dataType === "Checkbox Field" ||
          dataType === "Checkbox",
        isRichText: dataType === "Rich Text"
      });
    });
  });

  return out;
}


openSubmitConfirmModal() {
  this.isSubmitConfirmModalOpen = true;
}

closeSubmitConfirmModal() {
  this.isSubmitConfirmModalOpen = false;
  this.submitFinalStatus = null;
}

confirmPartialSubmit() {
  this.submitFinalStatus = "Pending";
  this.isSubmitConfirmModalOpen = false;

  this.handleSubmit(); // run real submit
}

confirmFinalSubmit() {
  this.submitFinalStatus = "Completed";
  this.isSubmitConfirmModalOpen = false;

  this.handleSubmit(); // run real submit
}

  @track isLoading = false;

// async handleSubmit() {
//   console.log("📤 handleSubmit triggered");
//   console.log("📤 handleSubmit triggered", this.isLoading);
//    this.isLoading = true;
//   console.log("📤 handleSubmit triggered",  this.isLoading);

//   // ✅ Flatten all rows
// // let allRows = this.stepPagedRows.flat();
// // let allRows = this.tableRows;

//  if (!this.submitFinalStatus) {
//     this.openSubmitConfirmModal();
//     return;
//   }


//   // ✅ Pre-process dropdown values before saving
// const allRows = this.tableRows.map(row => ({
//     ...row,
//     cells: row.cells.map((cell) => {
//       const field = cell.field;

//       if (
//         field &&
//         field.dataType === "Blank" &&
//         field.label?.toLowerCase().trim() === "page break"
//       ) {
//         return cell;
//       }

//       let newField;

//       if (cell.isCheckboxField) {
//         newField = { ...cell.field, value: !!cell.field?.value };
//         return { ...cell, field: newField };
//       }

//       if (cell.isUploadField && cell.field?.downloadLink) {
//         newField = { ...cell.field, downloadLink: cell.field.downloadLink };
//         return { ...cell, field: newField };
//       }

//       if (cell.isDropdownField && cell.isMultiSelect) {
//         const selectedOptions = cell.field.options
//           .filter((option) => option.isSelected)
//           .map((option) => option.label)
//           .join(", ");

//         newField = { ...cell.field, value: selectedOptions };
//         return { ...cell, selectedValues: selectedOptions, field: newField };
//       }

//       if (cell.isDropdownField && !cell.isMultiSelect) {
//         const selectedValue = cell.selectedValues || cell.field?.value || "";
//         newField = { ...cell.field, value: selectedValue };
//         return { ...cell, selectedValues: selectedValue, field: newField };
//       }

//       if (cell.isRadioButton || field?.dataType === "Radio Button") {
//         const selectedRadio = cell.selectedRadioOption || field?.value || "";
//         const subInput = cell.subInputValue || "";
//         newField = {
//           ...field,
//           value: subInput ? `${selectedRadio} - ${subInput}` : selectedRadio
//         };
//         return {
//           ...cell,
//           selectedRadioOption: selectedRadio,
//           subInputValue: subInput,
//           field: newField
//         };
//       }

//       return { ...cell, field: field };
//     })
//   }));

//   // ✅ Build viewTableData NOW so submit-PDF uses same input shape as view-PDF
// this.viewTableData = this.buildViewTableDataFromSubmitRows(
//   (this.stepPagedRows || []).flat()
// );
//   console.log("✅ viewTableData prepared for PDF:", {
//     count: this.viewTableData?.length,
//     sample: this.viewTableData?.slice(0, 3)
//   });

//   // ✅ Set header values (title + date) now; participant will be overwritten from Apex return
//   this.selectedFormTitle =
//     this.selectedForm?.Name__c || this.selectedFormTitle || "Form";

//   // match view pdf date format (date only)
//   this.selectedSubmissionDate = new Intl.DateTimeFormat("en-GB").format(new Date());

//   // keep any existing participant fallback; real one will come from Apex return
//   this.selectedParticipantName =
//     this.selectedParticipantName ||
//     this.clientName ||
//     this.selectedClientName ||
//     "";

//   console.log("🔍 Validating required fields...");

//   // ✅ required field validation
//   let missingFields = [];
//   (this.stepPagedRows || []).flat().forEach((row) => {
//     row.cells.forEach((cell) => {
//       const field = cell.field;
//       const inputEl = this.template.querySelector(`[data-id="${cell.id}"]`);
//       if (inputEl) inputEl.classList.remove("highlight-error");

//       if (field && field.isRequired === true) {
//         const isEmpty =
//           field.value === undefined ||
//           field.value === null ||
//           field.value.toString().trim() === "";

//         if (isEmpty) {
//           missingFields.push(field.label);
//           if (inputEl) inputEl.classList.add("highlight-error");
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
//     return;
//   }

// const values = this.buildValueMapFromRuntime();

// console.log("🧪 VALUE MAP:", values);

// const cleanTemplate = JSON.parse(
//   JSON.stringify(this.masterFormJson)
// );

// const mergedJson = this.injectValuesIntoTemplate(
//   cleanTemplate,
//   values
// );

// console.log("📦 FINAL JSON BEFORE AWS:", mergedJson);

// const responseAwsMeta = await this.uploadFormJsonToAws(
//   mergedJson,
//   "SubmittedResponses"
// );
  

//   //const responseJson = JSON.stringify(allRows);
//   // const responseAwsMeta = await this.uploadFormJsonToAws(
//   //   allRows,
//   //   "SubmittedResponses"
//   // );

//   console.log("📦 [ResponseJSON] AWS meta:", responseAwsMeta);


//   // helper: after apex returns record -> set participant -> generate pdf -> upload -> update aws
//   const generateUploadAndUpdateAws = async ({
//     responseId,
//     isUpdate,
//     existingAwsJson
//   }) => {
//     console.log("🧾 [PDF] Generating for responseId:", responseId);

//     // 1) generate PDF blob
//     const { file, fileName } = await this.downloadPdf();
//     console.log("🧾 [PDF] Generated:", { fileName, size: file?.size, type: file?.type });

//     // 2) upload
//     const uploadMeta = await this.uploadPdfFileToS3({
//       file,
//       responseId,
//       isUpdate,
//       existingAwsJson
//     });

//     console.log("✅ [S3] Uploaded:", uploadMeta);

//     // 3) update aws fields on record
//     await updateAwsFields({
//       responseId,
//       awsUrl: uploadMeta.url,
//       awsJson: JSON.stringify(uploadMeta)
//     });

//     console.log("✅ [AWS FIELDS] Updated on record:", responseId);
//   };

//   // =========================
//   // ✅ UPDATE EXISTING RESPONSE
//   // =========================
//   if (this.isEditing) {
//     updateFormResponse({
//       responseId: this.selectedResponseId,
//       responseJson: JSON.stringify(responseAwsMeta),
//       status: this.submitFinalStatus
//     })
//       .then(async (resp) => {
//         // ✅ resp is now an object (not Id)
//         const updatedId = resp?.Id || this.selectedResponseId;

//         // ✅ set participant for PDF header from Apex return (this is the key fix)
//         this.selectedParticipantName =
//           resp?.Participant_Name__c ||
//           this.selectedParticipantName ||
//           "";

//         console.log("🧾 PDF header values (UPDATE submit):", {
//           title: this.selectedFormTitle,
//           participant: this.selectedParticipantName,
//           date: this.selectedSubmissionDate
//         });

//         const existing =
//   (this.formResponses || []).find((r) => r.Id === updatedId) || {};

// const existingAwsJson = existing.AWS_Json__c || existing.Aws_Json__c || ""; // handle typo/case if any

// let existingKey = null;
// if (existingAwsJson) {
//   try {
//     existingKey = JSON.parse(existingAwsJson)?.key || null;
//   } catch (e) {
//     console.warn("⚠️ existingAwsJson is not valid JSON:", existingAwsJson);
//   }
// }

// console.log("♻️ UPDATE: existing AWS json/key:", {
//   existingAwsJson,
//   existingKey
// });

// // ✅ If no key exists yet, treat this update as a "create upload"
// await generateUploadAndUpdateAws({
//   responseId: updatedId,
//   isUpdate: !!existingKey,        // only true if key exists
//   existingAwsJson: existingAwsJson
// });


//         this.showToast("Success", "Form Updated", "success");
//         this.submitFinalStatus = null;
//         this.isSubmitConfirmModalOpen = false;
//         this.isFormSelected = false;
//         this.isViewModeON = true;
//         this.isEditing = false;
//         this.isExpandview = false;
//          this.isLoading = false;
//         this.resetSearchAndList();
//         return refreshApex(this.wiredFormResponses);
//       })
//       .catch((error) => {
//         console.error("❌ Update submit error:", error);
//          this.isLoading = false;
//         this.showToast("Error", "Error updating form / uploading PDF", "error");
//       });

//     return;
//   }

//   // =========================
//   // ✅ INSERT NEW RESPONSE
//   // =========================
//   saveFormResponse({
//   formId: this.selectedForm.Id,
//   responseJson: JSON.stringify(responseAwsMeta),
//   orgId: this.orgid,
//   clientId: this.clientId,
//   formName: this.selectedForm.Name__c,
//   formType: this.selectedForm.Form_Type__c,
//   status: this.submitFinalStatus
// })

//     .then(async (resp) => {
//       // ✅ resp is now an object (not Id)
//       const newResponseId = resp?.Id;

//       if (!newResponseId) {
//         throw new Error("saveFormResponse did not return Id");
//       }

//       // ✅ set participant for PDF header from Apex return (this is the key fix)
//       this.selectedParticipantName =
//         resp?.Participant_Name__c ||
//         this.selectedParticipantName ||
//         "";

//       console.log("🧾 PDF header values (NEW submit):", {
//         title: this.selectedFormTitle,
//         participant: this.selectedParticipantName,
//         date: this.selectedSubmissionDate
//       });

//       await generateUploadAndUpdateAws({
//         responseId: newResponseId,
//         isUpdate: false,
//         existingAwsJson: null
//       });

//       this.showToast("Success", "Form Submitted", "success");
//       this.isFormSelected = false;
//       this.isViewModeON = true;
//       this.isEditing = false;
//       this.isExpandview = false;
//        this.isLoading = false;
//        this.submitFinalStatus = null;
// this.isSubmitConfirmModalOpen = false;

//       this.resetSearchAndList();
//       return refreshApex(this.wiredFormResponses);
//     })
//     .then(() => {
//       console.log("✅ Apex Data Refreshed Successfully!");
//     })
//     .catch((error) => {
//       console.error("❌ Error submitting form:", error);
//        this.isLoading = false;
//          this.submitFinalStatus = null;
//   this.isSubmitConfirmModalOpen = false;
//       this.showToast("Error", "Error submitting form / uploading PDF", "error");
//     });
// }

async handleSubmit() {
  console.log("📤 handleSubmit triggered");
  console.log("📤 handleSubmit triggered", this.isLoading);

  // 🚫 Prevent double submit
  if (this.isLoading) return;

  // 🚫 If no status selected, open modal
  if (!this.submitFinalStatus) {
    this.openSubmitConfirmModal();
    return;
  }

  this.isLoading = true;
  console.log("📤 handleSubmit triggered", this.isLoading);

  try {

    // ============================================
    // ✅ VALIDATE ONLY FOR FINAL SUBMIT
    // ============================================
    if (this.submitFinalStatus === "Completed") {
      const missingFields = this.validateRequiredFields();

      if (missingFields.length > 0) {
        this.showToast(
          "Missing Required Fields",
          `Please fill the following required fields: ${missingFields.join(", ")}`,
          "error"
        );
        return;
      }
    }

    // ============================================
    // ✅ CONTINUE MAIN PROCESS
    // ============================================
    await this.processSubmitFlow();

  } catch (error) {
    console.error("❌ Error submitting form:", error);
    this.showToast("Error", "Error submitting form / uploading PDF", "error");
  } finally {
    this.isLoading = false;
    this.submitFinalStatus = null;
    this.isSubmitConfirmModalOpen = false;
  }
}

validateRequiredFields() {
  console.log("🔍 Validating required fields...");

  let missingFields = [];

  (this.stepPagedRows || []).flat().forEach((row) => {
    row.cells.forEach((cell) => {
      const field = cell.field;
      const inputEl = this.template.querySelector(`[data-id="${cell.id}"]`);
      if (inputEl) inputEl.classList.remove("highlight-error");

      if (field && field.isRequired === true) {
        const isEmpty =
          field.value === undefined ||
          field.value === null ||
          field.value.toString().trim() === "";

        if (isEmpty) {
          missingFields.push(field.label);
          if (inputEl) inputEl.classList.add("highlight-error");
        }
      }
    });
  });

  return missingFields;
}


async processSubmitFlow() {

    if (!this.masterFormJson) {
  throw new Error("Master template not loaded (edit mode)");
}

 // 🔥 VERY IMPORTANT — save current visible edits first
this.persistVisiblePage();

// 🔥 Use ALL pages, not just visible page
const allRows = (this.stepPagedRows || [])
  .flat()
  .map(row => ({
    ...row,
    cells: row.cells.map((cell) => {
      const field = cell.field;

      if (
        field &&
        field.dataType === "Blank" &&
        field.label?.toLowerCase().trim() === "page break"
      ) {
        return cell;
      }

      let newField;

      if (cell.isCheckboxField) {
        newField = { ...cell.field, value: !!cell.field?.value };
        return { ...cell, field: newField };
      }

      if (cell.isUploadField && cell.field?.downloadLink) {
        newField = { ...cell.field, downloadLink: cell.field.downloadLink };
        return { ...cell, field: newField };
      }

      if (cell.isDropdownField && cell.isMultiSelect) {
        const selectedOptions = cell.field.options
          .filter((option) => option.isSelected)
          .map((option) => option.label)
          .join(", ");

        newField = { ...cell.field, value: selectedOptions };
        return { ...cell, selectedValues: selectedOptions, field: newField };
      }

      if (cell.isDropdownField && !cell.isMultiSelect) {

          const selectedOption =
            (cell.field?.options || []).find(o => o.isSelected);

          const selectedValue = cell.field?.value || "";
          const displayValue =
            cell.field?.displayValue ||
            selectedOption?.label ||
            selectedValue;

          newField = {
            ...cell.field,
            value: selectedValue,
            displayValue: displayValue
          };

          return {
            ...cell,
            selectedValues: displayValue,
            field: newField
          };
        }


      if (cell.isRadioButton || field?.dataType === "Radio Button") {
        const selectedRadio = cell.selectedRadioOption || field?.value || "";
        const subInput = cell.subInputValue || "";
        newField = {
          ...field,
          value: subInput ? `${selectedRadio} - ${subInput}` : selectedRadio
        };
        return {
          ...cell,
          selectedRadioOption: selectedRadio,
          subInputValue: subInput,
          field: newField
        };
      }

      return { ...cell, field: field };
    })
  }));

  // this.tableRows = allRows;
  // this.stepPagedRows = [allRows];

  // ✅ Build viewTableData NOW so submit-PDF uses same input shape as view-PDF
  // this.viewTableData = this.buildViewTableDataFromSubmitRows(
  //   (this.stepPagedRows || []).flat()
  // );

  this.viewTableData =
  this.buildViewTableDataFromSubmitRows(allRows);


  // ✅ Set header values (title + date)
  this.selectedFormTitle =
    this.selectedForm?.Name__c || this.selectedFormTitle || "Form";

  this.selectedSubmissionDate =
    new Intl.DateTimeFormat("en-GB").format(new Date());

  this.selectedParticipantName =
    this.selectedParticipantName ||
    this.clientName ||
    this.selectedClientName ||
    "";

  // ============================================
  // ✅ BUILD JSON
  // ============================================
  const values = this.buildValueMapFromRuntime();
  const cleanTemplate = JSON.parse(JSON.stringify(this.masterFormJson));
  const mergedJson = this.injectValuesIntoTemplate(cleanTemplate, values);

  console.log("📦 FINAL JSON BEFORE AWS:", mergedJson);

  let existingJsonKey = null;

  if (this.isEditing) {
    const existing =
      (this.formResponses || []).find(
        (r) => r.Id === this.selectedResponseId
      ) || {};

    const existingJson = existing.Response_JSON__c;

    if (existingJson && typeof existingJson === "string") {
      try {
        existingJsonKey =
          JSON.parse(existingJson)?.key || null;
      } catch (e) {
        console.warn("⚠️ Invalid existing JSON metadata");
      }
    }
  }


  const responseAwsMeta = await this.uploadFormJsonToAws(
    mergedJson,
    "SubmittedResponses", this.selectedFormTitle, existingJsonKey
  );

  console.log("📦 [ResponseJSON] AWS meta:", responseAwsMeta);

  // ============================================
  // ROUTE TO UPDATE OR INSERT
  // ============================================
  if (this.isEditing) {
    await this.handleUpdateSubmit(responseAwsMeta);
  } else {
    await this.handleInsertSubmit(responseAwsMeta);
  }
}

async handleUpdateSubmit(responseAwsMeta) {

  const resp = await updateFormResponse({
    responseId: this.selectedResponseId,
    responseJson: JSON.stringify(responseAwsMeta),
    status: this.submitFinalStatus
  });

  const updatedId = resp?.Id || this.selectedResponseId;

  this.selectedParticipantName =
    resp?.Participant_Name__c ||
    this.selectedParticipantName ||
    "";

  const existing =
    (this.formResponses || []).find((r) => r.Id === updatedId) || {};

  const existingAwsJson =
    existing.AWS_Json__c || existing.Aws_Json__c || "";

  let existingKey = null;
  if (existingAwsJson) {
    try {
      existingKey = JSON.parse(existingAwsJson)?.key || null;
    } catch (e) {
      console.warn("⚠️ existingAwsJson is not valid JSON:", existingAwsJson);
    }
  }

  await this.generateUploadAndUpdateAws({
    responseId: updatedId,
    isUpdate: !!existingKey,
    existingAwsJson
  });

  this.showToast("Success", "Form Updated", "success");

  this.isFormSelected = false;
  this.isViewModeON = true;
  this.isEditing = false;
  this.isExpandview = false;

  this.resetSearchAndList();
  await refreshApex(this.wiredFormResponses);
}

async handleInsertSubmit(responseAwsMeta) {

  const resp = await saveFormResponse({
    formId: this.selectedForm.Id,
    responseJson: JSON.stringify(responseAwsMeta),
    orgId: this.orgid,
    clientId: this.clientId,
    formName: this.selectedForm.Name__c,
    formType: this.selectedForm.Form_Type__c,
    status: this.submitFinalStatus
  });

  const newResponseId = resp?.Id;

  if (!newResponseId) {
    throw new Error("saveFormResponse did not return Id");
  }

  this.selectedParticipantName =
    resp?.Participant_Name__c ||
    this.selectedParticipantName ||
    "";

  await this.generateUploadAndUpdateAws({
    responseId: newResponseId,
    isUpdate: false,
    existingAwsJson: null
  });

  this.showToast("Success", "Form Submitted", "success");

  this.isFormSelected = false;
  this.isViewModeON = true;
  this.isEditing = false;
  this.isExpandview = false;

  this.resetSearchAndList();
  await refreshApex(this.wiredFormResponses);
}


async generateUploadAndUpdateAws({ responseId, isUpdate, existingAwsJson }) {

  const { file } = await this.downloadPdf();

  const uploadMeta = await this.uploadPdfFileToS3({
    file,
    responseId,
    isUpdate,
    existingAwsJson
  });

  await updateAwsFields({
    responseId,
    awsUrl: uploadMeta.url,
    awsJson: JSON.stringify(uploadMeta)
  });
}





buildValueMapFromRuntime() {
  const values = {};

  (this.stepPagedRows || []).flat().forEach(row => {
    row.cells.forEach(cell => {
      const field = cell.field;
      if (!field?.id) return;

      // Checkbox
      if (cell.isCheckboxField) {
        values[field.id] = !!field.value;
        return;
      }

      // 🔥 Upload (FIXED)
      if (
        cell.isUploadField ||
        field?.isUpload ||
        field?.dataType === "Upload File"
      ) {
        values[field.id] = {
          value: field.value || [],
          downloadLink: field.downloadLink || [],
          urls: field.urls || [],
          s3Key: field.s3Key || [],
          fileName: field.fileName || "",
          contentType: field.contentType || "",
          meta: {
            ...(field.meta || {}),
            uploadedFiles: field.meta?.uploadedFiles || []
          }
        };
        return;
      }

      // Multi-select dropdown
      if (cell.isDropdownField && cell.isMultiSelect) {
        const selected = (field.options || [])
          .filter(o => o.isSelected)
          .map(o => o.label);

        values[field.id] = selected.join(", ");
        return;
      }

      // Single dropdown (KEEP existing behavior)
      if (cell.isDropdownField && !cell.isMultiSelect) {
        const selectedOption =
          (field.options || []).find(
            o => o.value === field.value
          );

        values[field.id] = {
          value: field.value || "",
          displayValue:
            field.displayValue ||
            selectedOption?.label ||
            field.value ||
            ""
        };
        return;
      }

      // Number / Time / Date
      if (
        cell.isNumberField ||
        cell.isTimeField ||
        cell.isDateField
      ) {
        values[field.id] = field.value || "";
        return;
      }

      // Radio
      if (cell.isRadioButton) {
        const base = cell.selectedRadioOption || field.value || "";
        const sub = cell.subInputValue || "";
        values[field.id] = sub ? `${base} - ${sub}` : base;
        return;
      }

      // Default
      values[field.id] = field.value ?? "";
    });
  });

  return values;
}

injectValuesIntoTemplate(template, valueMap) {
  template.forEach(row => {
    row.cells.forEach(cell => {

      if (
        cell.field?.id &&
        valueMap.hasOwnProperty(cell.field.id)
      ) {

        const saved = valueMap[cell.field.id];

        // 🔥 Upload field (CRITICAL FIX)
        if (
          cell.field?.dataType === "Upload File" &&
          saved &&
          typeof saved === "object"
        ) {
          cell.field = {
            ...cell.field,
            ...saved,
            meta: {
              ...(cell.field.meta || {}),
              ...(saved.meta || {})
            }
          };
          return;
        }

        // Existing object logic (dropdown etc)
        if (saved && typeof saved === "object") {
          cell.field.value = saved.value;
          cell.field.displayValue = saved.displayValue;
        } else {
          cell.field.value = saved;
        }
      }
    });
  });

  return template;
}


  toggleDropdown(event) {
    const cellId = event.target.dataset.id;
    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => ({
        ...cell,
        isDropdownOpen: cell.id === cellId ? !cell.isDropdownOpen : false
      }))
    }));

    if (this.isDropdownOpen) {
      // ✅ Attach event listener to close when clicking outside
      document.addEventListener("click", this.closeDropdowns);
    }
  }

  get hasResponses() {
    return (
      Array.isArray(this.paginatedFormResponses) &&
      this.paginatedFormResponses.length > 0
    );
  }

  // ✅ Handles multi-select dropdown checkbox changes
  handleMultiSelectChange(event) {
    const optionLabel = event.target.value;
    const cellId = String(event.target.dataset.id);
    const isChecked = !!event.target.checked;

    // 1) Update stepPagedRows (SUBMIT SOURCE)
    if (Array.isArray(this.stepPagedRows)) {
      for (let p = 0; p < this.stepPagedRows.length; p++) {
        const page = this.stepPagedRows[p] || [];
        for (let r = 0; r < page.length; r++) {
          const row = page[r];
          const cells = row?.cells || [];
          for (let c = 0; c < cells.length; c++) {
            const cell = cells[c];
            if (String(cell?.id) === cellId && cell?.field?.options) {
              // toggle option
              const updatedOptions = cell.field.options.map((opt) =>
                opt.label === optionLabel
                  ? { ...opt, isSelected: isChecked }
                  : opt
              );

              // derive selected labels & values
              const selected = updatedOptions.filter((o) => o.isSelected);
              const selectedLabels = selected.map((o) => o.label);
              const selectedValues = selected.map((o) => o.value ?? o.label); // prefer value

              // write back
              cell.field.options = updatedOptions;
              cell.selectedValues = selectedLabels.join(", ");
              cell.field.value = selectedValues.join(", "); // what you’ll submit

              // optional mirror map
              if (this.cellValueById instanceof Map) {
                this.cellValueById.set(cellId, cell.field.value);
              }

              // break all loops
              p = this.stepPagedRows.length;
              break;
            }
          }
        }
      }
    }

    // 2) Update the rendered tableRows (UI)
    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (String(cell.id) !== cellId) return cell;

        const updatedOptions = (cell.field?.options || []).map((opt) =>
          opt.label === optionLabel ? { ...opt, isSelected: isChecked } : opt
        );
        const selected = updatedOptions.filter((o) => o.isSelected);
        const selectedLabels = selected.map((o) => o.label);
        const selectedValues = selected.map((o) => o.value ?? o.label);

        return {
          ...cell,
          selectedValues: selectedLabels.join(", "),
          field: {
            ...cell.field,
            options: updatedOptions,
            value: selectedValues.join(", ")
          }
        };
      })
    }));
  }
  saveMultiSelect(event) {
    const cellId = String(event.target.dataset.id);

    // 1) Persist to stepPagedRows (SUBMIT SOURCE)
    if (Array.isArray(this.stepPagedRows)) {
      for (let p = 0; p < this.stepPagedRows.length; p++) {
        const page = this.stepPagedRows[p] || [];
        for (let r = 0; r < page.length; r++) {
          const row = page[r];
          const cells = row?.cells || [];
          for (let c = 0; c < cells.length; c++) {
            const cell = cells[c];
            if (String(cell?.id) === cellId && cell?.field?.options) {
              const selected = cell.field.options.filter((o) => o.isSelected);
              const selectedLabels = selected.map((o) => o.label);
              const selectedValues = selected.map((o) => o.value ?? o.label);

              cell.selectedValues = selectedLabels.join(", ");
              cell.field.value = selectedValues.join(", ");
              cell.isDropdownOpen = false;

              if (this.cellValueById instanceof Map) {
                this.cellValueById.set(cellId, cell.field.value);
              }

              p = this.stepPagedRows.length;
              break;
            }
          }
        }
      }
    }

    // 2) Mirror to tableRows (UI)
    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (String(cell.id) !== cellId) return cell;
        const selected = (cell.field?.options || []).filter(
          (o) => o.isSelected
        );
        const selectedLabels = selected.map((o) => o.label);
        const selectedValues = selected.map((o) => o.value ?? o.label);
        return {
          ...cell,
          selectedValues: selectedLabels.join(", "),
          field: { ...cell.field, value: selectedValues.join(", ") },
          isDropdownOpen: false
        };
      })
    }));

    document.removeEventListener("click", this.closeDropdowns);
  }

  closeDropdowns = (event) => {
    // ✅ Prevent closing if clicking inside the dropdown
    if (
      this.template
        .querySelector(".multi-dropdown-options")
        ?.contains(event.target)
    ) {
      return;
    }

    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => ({ ...cell, isDropdownOpen: false }))
    }));

    document.removeEventListener("click", this.closeDropdowns); // ✅ Remove event listener
  };

  stopPropagation(event) {
    event.stopPropagation();
  }
  handleinputCancel() {
    this.isFormSelected = false;
    this.isViewModeON = true;
    this.isEditing = false;
    this.tableRows = []; // Clear the form data
    this.resetSearchAndList();
    console.log("🚫 Form selection canceled");
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
  handleFileUpload(event) {
    const cellId = event.target.dataset.id;
    const file = event.target.files[0];

    if (!file) {
      console.warn("⚠️ No file selected.");
      return;
    }

    console.log("📁 Uploading file:", file.name);
    console.log("📄 File type:", file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];

      console.log(
        "📦 Base64 file size (approx):",
        `${((base64.length * 3) / 4 / 1024).toFixed(2)} KB`
      );

      // Apex call to upload file
      uploadFileToSalesforce({
        base64Data: base64,
        fileName: file.name,
        contentType: file.type
      })
        .then((fileResponse) => {
          const { previewUrl, downloadUrl } = fileResponse;

          console.log("✅ File uploaded to Salesforce");
          console.log("🔗 Preview URL:", previewUrl);
          console.log("⬇️ Download URL:", downloadUrl);

          // ✅ Update tableRows
          this.tableRows = this.tableRows.map((row) => ({
            ...row,
            cells: row.cells.map((cell) => {
              if (cell.id === cellId) {
                console.log(`📝 Updating cell with ID: ${cellId}`);
                return {
                  ...cell,
                  field: {
                    ...cell.field,
                    value: previewUrl,
                    downloadLink: downloadUrl
                  }
                };
              }
              return cell;
            })
          }));

          // ✅ Update stepPagedRows as well (needed for submission)
          this.stepPagedRows = this.stepPagedRows.map((page) =>
            page.map((row) => ({
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.id === cellId) {
                  return {
                    ...cell,
                    field: {
                      ...cell.field,
                      value: previewUrl,
                      downloadLink: downloadUrl
                    }
                  };
                }
                return cell;
              })
            }))
          );
        })
        .catch((error) => {
          console.error("❌ File upload failed:", error);
          this.showToast("Error", "File upload failed", "error");
        });
    };

    reader.readAsDataURL(file);
  }

  // inside the class
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

    // hand off files; child will show confirm/removal/progress UI
    svc.incomingFiles = files;
    // module path is already set via attribute: module-path-from-parent="ticket"
    // record-id and context-cell-id are also passed via attributes
  }

  // Child will send ctx (cellId). Update that cell’s values.
  // handleAwsUploadComplete(evt) {
  //   try {
  //     console.group('[AWS Upload Complete]');
  //     console.log('Raw event detail:', evt?.detail);

  //     const { recordId, files, ctx } = evt.detail || {};
  //     console.log('recordId:', recordId);
  //     console.log('files count:', Array.isArray(files) ? files.length : 0, 'files:', files);
  //     console.log('ctx (cellId):', ctx);

  //     const uploaded = files && files[0];
  //     if (!uploaded) {
  //       console.warn('No uploaded files in payload; aborting.');
  //       console.groupEnd();
  //       return;
  //     }
  //     console.log('Using first uploaded file:', uploaded);

  //     const previewUrl = uploaded.url;
  //     const downloadUrl = uploaded.url;
  //     const cellId = ctx;

  //     console.log('previewUrl:', previewUrl);
  //     console.log('downloadUrl:', downloadUrl);

  //     // Update tableRows
  //     this.tableRows = this.tableRows.map((row) => ({
  //       ...row,
  //       cells: row.cells.map((cell) => {
  //         if (cell.id === cellId) {
  //           const updatedCell = {
  //             ...cell,
  //             field: {
  //               ...cell.field,
  //               value: previewUrl,
  //               downloadLink: downloadUrl,
  //               fileName: uploaded.originalName,
  //               contentType: uploaded.type,
  //               s3Key: uploaded.key,
  //               meta: { modulePath: uploaded.modulePath, recordId }
  //             }
  //           };
  //           console.log('Updated cell in tableRows:', { cellId, updatedField: updatedCell.field });
  //           return updatedCell;
  //         }
  //         return cell;
  //       })
  //     }));

  //     // Update stepPagedRows
  //     this.stepPagedRows = this.stepPagedRows.map((page) =>
  //       page.map((row) => ({
  //         ...row,
  //         cells: row.cells.map((cell) => {
  //           if (cell.id === cellId) {
  //             const updatedCell = {
  //               ...cell,
  //               field: {
  //                 ...cell.field,
  //                 value: previewUrl,
  //                 downloadLink: downloadUrl,
  //                 fileName: uploaded.originalName,
  //                 contentType: uploaded.type,
  //                 s3Key: uploaded.key,
  //                 meta: { modulePath: uploaded.modulePath, recordId }
  //               }
  //             };
  //             console.log('Updated cell in stepPagedRows:', { cellId, updatedField: updatedCell.field });
  //             return updatedCell;
  //           }
  //           return cell;
  //         })
  //       }))
  //     );

  //     // Clear the input so the same file can be selected again
  //     const input = this.template.querySelector(`input.hidden-file-input[data-cell-id="${cellId}"]`);
  //     if (input) {
  //       input.value = '';
  //       console.log('Cleared file input for cellId:', cellId);
  //     } else {
  //       console.warn('No input found to clear for cellId:', cellId);
  //     }

  //     console.groupEnd();
  //   } catch (e) {
  //     console.error('[AWS Upload Complete] handler error:', e);
  //   }
  // }

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

    const cellId = ctx;

    // 🔹 NEW: collect existing values BEFORE overwrite
    let existingUrls = [];
    let existingNames = [];
    let existingTypes = [];
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
    (this.tableRows || []).forEach(row =>
      row.cells.forEach(cell => {
        if (cell.id === cellId) collectExisting(cell);
      })
    );

    // Build arrays from NEW payload
    const newUrls = files.map((f) => f?.url).filter(Boolean);
    const newNames = files.map((f) => f?.originalName).filter(Boolean);
    const newTypes = files.map((f) => f?.type).filter(Boolean);
    const newKeys = files.map((f) => f?.key).filter(Boolean);
    const modulePath = files[0]?.modulePath ?? undefined;

    // 🔹 NEW: append (not overwrite)
    const urls = [...existingUrls, ...newUrls];
    const names = [...existingNames, ...newNames];
    const types = newTypes; // used only for display
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
      uploadedFiles, // 🔹 NEW: merged list
      rawEventDetail: evt.detail
    };

    // Update tableRows
    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        if (cell.id === cellId) {
          const updatedCell = {
            ...cell,
            field: {
              ...cell.field,
              value: valueForField,
              downloadLink: urls,
              fileName: names.join(", "),
              contentType: urls.length === 1 ? types[0] || null : "multiple",
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

    // Update stepPagedRows
    this.stepPagedRows = this.stepPagedRows.map((page) =>
      page.map((row) => ({
        ...row,
        cells: row.cells.map((cell) => {
          if (cell.id === cellId) {
            const updatedCell = {
              ...cell,
              field: {
                ...cell.field,
                value: valueForField,
                downloadLink: urls,
                fileName: names.join(", "),
                contentType: urls.length === 1 ? types[0] || null : "multiple",
                s3Key: s3Keys,
                urls,
                meta: metaPayload
              }
            };
            console.log("Updated cell in stepPagedRows:", {
              cellId,
              updatedField: updatedCell.field
            });
            return updatedCell;
          }
          return cell;
        })
      }))
    );

    // Clear the input so the same file can be selected again
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


  @track searchSubmittedQuery = "";
  @track filteredFormResponses = []; // Filtered results
  @track searchFormsAccessQuery = "";
  @track filteredParticipants = []; // Used for displaying filtered + paginated records

  handleSubmittedFormSearch(event) {
    this.searchSubmittedQuery = event.target.value.toLowerCase();
    this.selectedNameFilter = "ALL";
    this._buildNameTabs();
    this.filteredFormResponses = this.formResponses.filter(
      (response) =>
        (response.Name__c || "")
          .toLowerCase()
          .includes(this.searchSubmittedQuery) ||
        (response.Form_Type__c || "")
          .toLowerCase()
          .includes(this.searchSubmittedQuery) ||
        (response.Participant_Name__c || "")
          .toLowerCase()
          .includes(this.searchSubmittedQuery) ||
        (response.FormattedDate || "")
          .toLowerCase()
          .includes(this.searchSubmittedQuery)
      // Add status if available
    );

    this.totalFormRecords = this.filteredFormResponses.length;
    this.totalFormPages = Math.ceil(this.totalFormRecords / this.formPageSize);
    this.formPageNumber = 1; // reset to first page
    this.updatePaginatedFormResponses();
  }

  handleFormsAccessSearch(event) {
    this.searchFormsAccessQuery = event.target.value.toLowerCase();

    this.filteredParticipants = this.participants.filter(
      (participant) =>
        (participant.Name || "")
          .toLowerCase()
          .includes(this.searchFormsAccessQuery) ||
        participant.visibleStaffMembers?.some((staff) =>
          (staff.name || "").toLowerCase().includes(this.searchFormsAccessQuery)
        ) ||
        (participant.Status__c || "")
          .toLowerCase()
          .includes(this.searchFormsAccessQuery)
    );

    this.pageNumber = 1;
    this.totalRecords = this.filteredParticipants.length;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    this.paginationHelper();
  }



  async downloadPdfinView() {
  const doc = await this.buildPdfDoc();
  const safeName = (this.selectedFormTitle || "Form").replace(/[\\/:*?"<>|]/g, "_");
  doc.save(`${safeName}.pdf`);
}



async buildPdfDoc() {
  const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;

  if (!jsPDFConstructor || !jsPDFConstructor.API?.autoTable) {
    console.error("❌ jsPDF or autoTable not available.", {
      jsPDFConstructor,
      jspdf: window.jspdf
    });
    throw new Error("PDF library not available");
  }

  // normalize view data
  this.viewTableData = (this.viewTableData || []).map((item) => ({
    ...item,
    isVisible: true,
    ...(item.isPageBreak ? { arrow: "▼" } : {})
  }));

  const doc = new jsPDFConstructor();

  // 🔧 Patch missing getters for autoTable compatibility
if (!doc.getFontSize && doc.internal?.getFontSize) {
  doc.getFontSize = () => doc.internal.getFontSize();
}

if (!doc.getFont && doc.internal?.getFont) {
  doc.getFont = () => doc.internal.getFont();
}


  // =====================================================
  // 🔥 REQUIRED for jsPDF 4 + autoTable v5
  // =====================================================
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (typeof doc.autoTable !== "function") {
    console.error("❌ autoTable missing on doc instance", doc);
    throw new Error("autoTable not attached");
  }

  // =====================================================
  // LOGO (PRELOAD ONLY — DO NOT DRAW HERE)
  // =====================================================
  let logoData = null;

  if (this.orgLogoUrl) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = this.orgLogoUrl;

    await new Promise((resolve) => {
      img.onload = () => {
        try {
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
        } catch (e) {
          console.warn("⚠️ Logo render error:", e);
        }
        resolve();
      };

      img.onerror = () => {
        console.warn("⚠️ Logo failed to load:", this.orgLogoUrl);
        resolve();
      };
    });
  }

  // =====================================================
  // CONTENT
  // =====================================================
  await this.drawPdfContent(doc, logoData);

  return doc;
}




async downloadPdf() {
  const doc = await this.buildPdfDoc();

  const safeName = (this.selectedFormTitle || "Form").replace(/[\\/:*?"<>|]/g, "_");
  const fileName = `${safeName}.pdf`;

  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });

  return { file, fileName };
}



async drawPdfContent(doc, logoData) {

  console.log("🧾 PDF DEBUG viewTableData sample:", {
    count: this.viewTableData?.length,
    first: this.viewTableData?.[0],
    firstLabel: this.viewTableData?.[0]?.label,
    firstValue: this.viewTableData?.[0]?.value,
    firstFieldValue: this.viewTableData?.[0]?.field?.value
  });

  // ---------- collect rows + image rows ----------
  const headers = [["Field Name", "Value"]];
  const rows = [];
  const imageRows = [];

  const formatDateForPdf = (value) => {
  if (!value) return "";

  const d = new Date(value);
  if (isNaN(d)) return value; // already formatted → keep it

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`; // DD/MM/YYYY
};


  this.viewTableData.forEach((item) => {
    if (!item.isPageBreak && item.isVisible) {

      // ---------- HEADER-LIKE ROWS ----------
      const isHeaderLike =
        item.isSectionHeader === true || item.title ||
        item.isHeader === true || item.dataType === "Header" || item.type === "header" ||
        item.field?.isHeader === true || item.field?.dataType === "Header" || item.field?.type === "header";

      if (isHeaderLike) {

        const parseStyle = (s = "") => {
          const out = {};
          s.split(";").forEach(p => {
            const [k, v] = p.split(":").map(t => t && t.trim());
            if (k && v) out[k] = v;
          });
          return out;
        };

        const hexToRGB = (hex = "#000000") => {
          const h = hex.replace("#", "").trim();
          const n = x => parseInt(x, 16) || 0;
          return [n(h.slice(0, 2)), n(h.slice(2, 4)), n(h.slice(4, 6))];
        };

        const weightToStyle = (w = "normal") => {
          const n = parseInt(w, 10);
          return (w === "bold" || n >= 600) ? "bold" : "normal";
        };

        const alignToHAlign = (a = "left") =>
          (a === "center" || a === "right") ? a : "left";

        const clean = (s) =>
          (s || "").replace(/\u200B/g, "").trim();

        const sectionTextRaw =
          item.title ??
          item.field?.headerText ?? item.field?.text ??
          item.headerText ?? item.text ?? item.label ?? "";

        const sectionText = clean(sectionTextRaw) || " ";

        const styleSrc =
          item.headerStyle || item.inlineStyle ||
          item.field?.headerStyle || item.field?.inlineStyle || "";

        const s = parseStyle(styleSrc);

        console.log("PDF Section Header →", {
          id: item.id || item.dataId || item.field?.id,
          textRaw: sectionTextRaw,
          textClean: sectionText,
          styleSrc,
          parsedStyle: s
        });

        rows.push([
            {
              content: sectionText,
              colSpan: 2,
              styles: {
                font: "helvetica",
                fontSize: parseInt((s["font-size"] || "16px"), 10) || 16,
                fontStyle: weightToStyle(s["font-weight"] || "600"),
                halign: alignToHAlign(s["text-align"] || "left"),
                textColor: hexToRGB(s.color || "#000000"),
                fillColor: [245, 245, 245],
                lineWidth: 0,
                cellPadding: 4,
                minCellHeight: 12
              }
            },
            null // 👈 REQUIRED filler cell for colSpan rows
          ]);


        return;
      }

      // ---------- NORMAL FIELD ROWS ----------
      const label = item.label;

      let rawValue = "";

        // 🔥 Dropdown → use displayValue first
        if (
          item.field?.dataType === "Dropdown Field" ||
          item.isDropdownField
        ) {
          rawValue =
            item.field?.displayValue ||
            item.field?.value ||
            item.value ||
            "";
        }
        else {
          rawValue =
            item.field?.value ??
            item.value ??
            "";
        }


      let value = "";

      const stripHtml = (html) => {
        if (!html) return "";
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
      };

      const isRichTextItem =
        item?.isRichText === true ||
        item?.selectedTextFieldOption === "richText" ||
        item?.field?.selectedTextFieldOption === "richText" ||
        /<\/?[a-z][\s\S]*>/i.test(rawValue);

      if (item.isCheckbox) {
        value =
      rawValue === true ||
      rawValue === "true" ||
      rawValue === "action:approval"
         ? "Yes"
         : "No";

      } else if (isRichTextItem) {
        value = stripHtml(rawValue);

      } else if (this.looksLikeUpload(item)) {
        const urls = this.extractImageUrls(item);
        if (urls.length) {
          urls.forEach((u) => imageRows.push({ label, url: u }));
          value = "Image attached below";
        } else {
          value = "";
        }

      } else if (item.dataType === "Date Field") {
        value = formatDateForPdf(rawValue);

      } else {
        value = rawValue;
      }


      console.log("🧾 PDF row candidate:", {
        label,
        rawValue,
        finalValue: value,
        dataType: item.dataType,
        isPageBreak: item.isPageBreak,
        isHeaderLike
      });

      rows.push([label, value]);
    }
  });

  // ---------- header values ----------
  const formName = this.selectedFormTitle || "N/A";
  const participant = this.selectedParticipantName || "N/A";
  const submissionDate = this.selectedSubmissionDate || "N/A";

  // ---------- layout constants ----------
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const headerX = 12;
  const headerY = 12;
  const headerW = pageW - headerX * 2;
  const headerPad = 6;
  const contentX = headerX + headerPad;
  //const contentMaxW = headerW - headerPad * 2;
  const logoReservedWidth =
  logoData?.base64 ? 65 : 0;

  const contentMaxW =
  headerW - headerPad * 2 - logoReservedWidth;

  const nameTitleSize = 16;
  const bodySize = 11;
  const lineH = 6;
  const betweenBlocks = 3;

  // ---------- font helpers ----------
  const useFont = (name, style) => {
    try {
      doc.setFont(name, style);
    } catch {
      doc.setFont("helvetica", style || "normal");
    }
  };

  const textWidth = (txt) => doc.getTextWidth(txt);

  const wrapValue = (text, firstWidth, nextWidth) => {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let current = "";
    let width = firstWidth;

    for (let i = 0; i < words.length; i++) {
      const trial = current ? current + " " + words[i] : words[i];
      if (textWidth(trial) <= width) {
        current = trial;
      } else {
        if (current) lines.push(current);
        current = words[i];
        width = nextWidth;

        if (textWidth(current) > width) {
          let chunk = "";
          for (const ch of current) {
            const t = chunk + ch;
            if (textWidth(t) <= width) chunk = t;
            else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          current = chunk;
        }
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  useFont("helvetica", "bold");
  doc.setFontSize(nameTitleSize);
  const nameLinesCentered = wrapValue(formName, contentMaxW, contentMaxW);
  const nameBlockH = Math.max(1, nameLinesCentered.length) * lineH;

  useFont("helvetica", "bold");
  doc.setFontSize(bodySize);
  const partLabel = "Participant: ";
  const dateLabel = "Submission Date: ";

  const partLabelW = textWidth(partLabel);
  const dateLabelW = textWidth(dateLabel);

  useFont("helvetica", "normal");

  const partValLines =
    partLabelW >= contentMaxW
      ? wrapValue(participant, contentMaxW, contentMaxW)
      : wrapValue(participant, contentMaxW - partLabelW, contentMaxW);

  const dateValLines =
    dateLabelW >= contentMaxW
      ? wrapValue(submissionDate, contentMaxW, contentMaxW)
      : wrapValue(submissionDate, contentMaxW - dateLabelW, contentMaxW);

  const partH = Math.max(1, partValLines.length) * lineH;
  const dateH = Math.max(1, dateValLines.length) * lineH;

  const bodyTotalH = partH + betweenBlocks + dateH;

  const headerHeight =
    headerPad + nameBlockH + betweenBlocks + bodyTotalH + headerPad;

  doc.setFillColor(230, 230, 250);
  doc.rect(headerX, headerY, headerW, headerHeight, "F");

  // =====================================
  // 🖼️ ORG LOGO INSIDE HEADER (FIX)
  // =====================================
  if (logoData?.base64) {

    const maxLogoWidth = 55;
    const maxLogoHeight = 22;

    const ratio =
      logoData.width / logoData.height;

    let logoWidth = maxLogoWidth;
    let logoHeight = logoWidth / ratio;

    // keep aspect ratio
    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = logoHeight * ratio;
    }

    // right aligned inside header
    const logoX =
      headerX + headerW - logoWidth - 10;

    // centered vertically inside header
    const logoY =
      headerY +
      (headerHeight - logoHeight) / 2;

    doc.addImage(
      logoData.base64,
      "PNG",
      logoX,
      logoY,
      logoWidth,
      logoHeight
    );

    console.log("🖼️ Logo placed inside header");
  }

  useFont("helvetica", "bold");
  doc.setFontSize(nameTitleSize);
  doc.setTextColor(44, 62, 80);

  // const centerX = headerX + headerW / 2;
  const centerX =
  headerX +
  (headerW - logoReservedWidth) / 2;
  let y = headerY + headerPad + lineH;

  nameLinesCentered.forEach((ln) => {
    doc.text(ln, centerX, y, { align: "center" });
    y += lineH;
  });

  y += betweenBlocks;

  useFont("helvetica", "bold");
  doc.setFontSize(bodySize);
  doc.setTextColor(33, 33, 33);

  const drawLabelValue = (label, labelW, valueLines) => {
    if (labelW >= contentMaxW) {
      useFont("helvetica", "bold");
      doc.text(label.trim(), contentX, y);
      y += lineH;
      useFont("helvetica", "normal");
      valueLines.forEach((ln) => {
        doc.text(ln, contentX, y);
        y += lineH;
      });
    } else {
      useFont("helvetica", "bold");
      doc.text(label, contentX, y);
      useFont("helvetica", "normal");
      const first = valueLines.length ? valueLines[0] : "";
      doc.text(first, contentX + labelW, y);
      y += lineH;
      for (let i = 1; i < valueLines.length; i++) {
        doc.text(valueLines[i], contentX, y);
        y += lineH;
      }
    }
  };

  drawLabelValue(partLabel, partLabelW, partValLines);
  y += betweenBlocks;
  drawLabelValue(dateLabel, dateLabelW, dateValLines);

  console.log("📐 autoTable about to run — font:", {
  font: doc.internal?.getFont?.(),
  fontSize: doc.internal?.getFontSize?.()
});
try {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
} catch (e) {
  console.warn("⚠️ Font reset before autoTable failed:", e);
}



 try {
  doc.autoTable({
    head: headers,
    body: rows,
    startY: headerY + headerHeight + 6,
    styles: { font: "helvetica", fontSize: 10, cellPadding: 3 },
    headStyles: {
      font: "helvetica",
      fontStyle: "bold",
      fillColor: [41, 128, 185],
      textColor: 255
    }
  });
} catch (e) {
  console.error("❌ autoTable crashed:", e);
  throw new Error("PDF table rendering failed");
}


  let imgY =
    (doc.lastAutoTable?.finalY ?? headerY + headerHeight + 6) + 10;

  for (const img of imageRows) {
    try {
      const { dataUrl, format } = await this.getDataUrlAndFormat(
        img.url,
        img.contentType
      );

      if (imgY + 40 > pageH) {
        doc.addPage();
        imgY = 10;
      }

      doc.setFontSize(12);
      useFont("helvetica", "normal");
      doc.setTextColor(33, 33, 33);
      doc.text(img.label, contentX, imgY);
      imgY += 5;

      doc.addImage(dataUrl, format, contentX, imgY, 50, 30);
      imgY += 40;

    } catch (error) {
      console.error("❌ Image render error:", error);
    }
  }
}



  async drawPdfContentinView(doc) {

    console.log("🧾 PDF DEBUG viewTableData sample:", {
  count: this.viewTableData?.length,
  first: this.viewTableData?.[0],
  firstLabel: this.viewTableData?.[0]?.label,
  firstValue: this.viewTableData?.[0]?.value,
  firstFieldValue: this.viewTableData?.[0]?.field?.value
});

  // ---------- collect rows + image rows ----------
  const headers = [["Field Name", "Value"]];
  const rows = [];
  const imageRows = [];

  this.viewTableData.forEach((item) => {
    if (!item.isPageBreak && item.isVisible) {
      // NEW: render Header fields as a full-width section row inside the table
// NEW: render Header fields as a full-width section row inside the table
const isHeaderLike =
  item.isSectionHeader === true || item.title ||
  item.isHeader === true || item.dataType === "Header" || item.type === "header" ||
  item.field?.isHeader === true || item.field?.dataType === "Header" || item.field?.type === "header";

if (isHeaderLike) {
  // helpers
  const parseStyle = (s = "") => {
    const out = {};
    s.split(";").forEach(p => {
      const [k, v] = p.split(":").map(t => t && t.trim());
      if (k && v) out[k] = v;
    });
    return out;
  };
  const hexToRGB = (hex = "#000000") => {
    const h = hex.replace("#","").trim();
    const n = x => parseInt(x, 16) || 0;
    return [n(h.slice(0,2)), n(h.slice(2,4)), n(h.slice(4,6))];
  };
  const weightToStyle = (w = "normal") => {
    const n = parseInt(w, 10);
    return (w === "bold" || n >= 600) ? "bold" : "normal";
  };
  const alignToHAlign = (a = "left") => (a === "center" || a === "right") ? a : "left";
  const clean = (s) => (s || "").replace(/\u200B/g, "").trim(); // strip zero-width

  // pull text/style from ALL known shapes (field*, top-level*, section*)
  const sectionTextRaw =
    item.title ??
    item.field?.headerText ?? item.field?.text ??
    item.headerText ?? item.text ?? item.label ?? "";

  const sectionText = clean(sectionTextRaw) || " "; // never pass truly empty

  const styleSrc =
    item.headerStyle || item.inlineStyle ||            // ← section header (your current shape)
    item.field?.headerStyle || item.field?.inlineStyle || // ← nested field shape
    "";

  const s = parseStyle(styleSrc);

  // 🔎 DEBUG
  // eslint-disable-next-line no-console
  console.log("PDF Section Header →", {
    id: item.id || item.dataId || item.field?.id,
    textRaw: sectionTextRaw,
    textClean: sectionText,
    styleSrc,
    parsedStyle: s,
    shape: item.isSectionHeader ? "sectionHeader" :
           (item.field?.isHeader ? "field.header" : "other")
  });

  // IMPORTANT: push a 2-length row; some builds need a dummy second cell
  rows.push([
    {
      content: sectionText,
      colSpan: 2,
      styles: {
        fontSize: parseInt((s["font-size"] || "16px"), 10) || 16,
        fontStyle: weightToStyle(s["font-weight"] || "600"),
        halign: alignToHAlign(s["text-align"] || "left"),
        textColor: hexToRGB(s.color || "#000000"),
        fillColor: [245, 245, 245], // optional highlight
        lineWidth: 0,
        cellPadding: 4,
        minCellHeight: 12
      }
    },
    "" // filler so the row has two cells; colSpan consumes both
  ]);

  return; // skip normal label/value handling for header rows
}




      // (existing) normal field handling
      const label = item.label;
      let value = "";

      if (item.isCheckbox) {
        value = item.value === "action:approval" ? "Yes" : "No";
      } else if (item.isRichText) {
        const div = document.createElement("div");
        div.innerHTML = item.value;
        value = div.textContent || div.innerText || "";
      } else if (this.looksLikeUpload(item)) {
        const urls = this.extractImageUrls(item);
        if (urls.length) {
          urls.forEach((u) => imageRows.push({ label, url: u }));
          value = "Image attached below";
        } else {
          value = "";
        }
      } else {
        value = item.value || "";
      }

      rows.push([label, value]);
    }
  });

  // ---------- header values ----------
  const formName = this.selectedFormTitle || "N/A";
  // const formType = this.selectedFormType || "N/A"; // ❌ not used anymore
  const participant = this.selectedParticipantName || "N/A";
  const submissionDate = this.selectedSubmissionDate || "N/A";

  // ---------- layout constants ----------
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const headerX = 12;
  const headerY = 12;
  const headerW = pageW - headerX * 2;
  const headerPad = 6; // ↓ tighter header
  const contentX = headerX + headerPad;
  const contentMaxW = headerW - headerPad * 2;

  const nameTitleSize = 16; // centered form name size
  const bodySize = 11;
  const lineH = 6;
  const betweenBlocks = 3;

  // ---------- font helpers ----------
  const useFont = (name, style) => {
    try {
      doc.setFont(name, style);
    } catch {
      doc.setFont("helvetica", style || "normal");
    }
  };
  const textWidth = (txt) => doc.getTextWidth(txt);

  // Wrap helper (unchanged)
  const wrapValue = (text, firstWidth, nextWidth) => {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let current = "";
    let width = firstWidth;

    for (let i = 0; i < words.length; i++) {
      const trial = current ? current + " " + words[i] : words[i];
      if (textWidth(trial) <= width) {
        current = trial;
      } else {
        if (current) lines.push(current);
        current = words[i];
        width = nextWidth;
        if (textWidth(current) > width) {
          let chunk = "";
          for (const ch of current) {
            const t = chunk + ch;
            if (textWidth(t) <= width) {
              chunk = t;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          current = chunk;
        }
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  // ---------- pre-measure to compute header height ----------
  // 1) Centered Form Name (no label)
  useFont("Roboto", "bold");
  doc.setFontSize(nameTitleSize);
  const nameLinesCentered = wrapValue(formName, contentMaxW, contentMaxW);
  const nameBlockH = Math.max(1, nameLinesCentered.length) * lineH;

  // 2) Body rows (Participant & Submission Date only)
  useFont("Roboto", "bold");
  doc.setFontSize(bodySize);
  const partLabel = "Participant: ";
  const dateLabel = "Submission Date: ";

  const partLabelW = textWidth(partLabel);
  const dateLabelW = textWidth(dateLabel);

  useFont("Roboto", "normal");
  const partValLines =
    partLabelW >= contentMaxW
      ? wrapValue(participant, contentMaxW, contentMaxW)
      : wrapValue(participant, contentMaxW - partLabelW, contentMaxW);

  const dateValLines =
    dateLabelW >= contentMaxW
      ? wrapValue(submissionDate, contentMaxW, contentMaxW)
      : wrapValue(submissionDate, contentMaxW - dateLabelW, contentMaxW);

  const partH = Math.max(1, partValLines.length) * lineH;
  const dateH = Math.max(1, dateValLines.length) * lineH;

  const bodyTotalH = partH + betweenBlocks + dateH;

  // Smaller header (no title, no form type, and tighter padding)
  const headerHeight =
    headerPad + nameBlockH + betweenBlocks + bodyTotalH + headerPad;

  // ---------- draw header background ----------
  doc.setFillColor(230, 230, 250);
  doc.rect(headerX, headerY, headerW, headerHeight, "F");

  // ---------- draw header content ----------
  // 1) Centered Form Name at the very top
  useFont("Roboto", "bold");
  doc.setFontSize(nameTitleSize);
  doc.setTextColor(44, 62, 80);
  const centerX = headerX + headerW / 2;
  let y = headerY + headerPad + lineH;

  nameLinesCentered.forEach((ln) => {
    doc.text(ln, centerX, y, { align: "center" });
    y += lineH;
  });

  // small spacer
  y += betweenBlocks;

  // 2) Participant & Submission Date
  useFont("Roboto", "bold");
  doc.setFontSize(bodySize);
  doc.setTextColor(33, 33, 33);

  const drawLabelValue = (label, labelW, valueLines) => {
    if (labelW >= contentMaxW) {
      useFont("Roboto", "bold");
      doc.text(label.trim(), contentX, y);
      y += lineH;
      useFont("Roboto", "normal");
      valueLines.forEach((ln) => {
        doc.text(ln, contentX, y);
        y += lineH;
      });
    } else {
      useFont("Roboto", "bold");
      doc.text(label, contentX, y);
      useFont("Roboto", "normal");
      const first = valueLines.length ? valueLines[0] : "";
      doc.text(first, contentX + labelW, y);
      y += lineH;
      for (let i = 1; i < valueLines.length; i++) {
        doc.text(valueLines[i], contentX, y);
        y += lineH;
      }
    }
  };

  drawLabelValue(partLabel, partLabelW, partValLines);
  y += betweenBlocks;
  drawLabelValue(dateLabel, dateLabelW, dateValLines);

  // ---------- table just below the dynamic header ----------
  doc.autoTable({
    head: headers,
    body: rows, // now includes full-width section rows
    startY: headerY + headerHeight + 6,
    styles: { font: "Roboto", fontSize: 10, cellPadding: 3 },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [41, 128, 185],
      textColor: 255
    }
  });

  // ---------- images below table ----------
  let imgY =
    (doc.previousAutoTable && doc.previousAutoTable.finalY
      ? doc.previousAutoTable.finalY
      : headerY + headerHeight + 6) + 10;

  for (const img of imageRows) {
    try {
      const { dataUrl, format } = await this.getDataUrlAndFormat(
        img.url,
        img.contentType
      );
      if (imgY + 40 > pageH) {
        doc.addPage();
        imgY = 10;
      }

      doc.setFontSize(12);
      useFont("Roboto", "normal");
      doc.setTextColor(33, 33, 33);
      doc.text(img.label, contentX, imgY);
      imgY += 5;

      doc.addImage(dataUrl, format, contentX, imgY, 50, 30); // 50x30 thumbnail
      imgY += 40;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Image render error:", error);
    }
  }

  // ---------- save ----------
  const safeName = (this.selectedFormTitle || "Form").replace(
    /[\\/:*?"<>|]/g,
    "_"
  );
  const fileName = `${safeName}.pdf`;
  doc.save(fileName);
}


  async getBase64ImageFromURL(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  looksLikeUpload(item) {
    console.log("🔍 looksLikeUpload check:", JSON.stringify(item));

    // case 1: item.value is an object with flags
    if (item?.value?.isUploadFile && item?.value?.uploadUrl) {
      console.log(
        "✅ Detected upload object with uploadUrl:",
        item.value.uploadUrl
      );
      return true;
    }

    // case 2: item.value is a comma-separated url string
    if (typeof item?.value === "string" && /https?:\/\//i.test(item.value)) {
      console.log("✅ Detected URL string:", item.value);
      return true;
    }

    // case 3: item.value is an array of urls or file objects
    if (Array.isArray(item?.value) && item.value.length) {
      console.log("✅ Detected array of uploads:", item.value);
      return true;
    }

    console.log("❌ Not recognized as upload");
    return false;
  }

  extractImageUrls(item) {
    console.log("🔍 extractImageUrls input:", JSON.stringify(item));

    const urls = [];
    const pushIfImg = (u) => {
      if (!u) return;
      const s = String(u).trim();
      if (/\.(png|jpe?g|gif|webp|bmp|tiff?)($|\?)/i.test(s)) {
        console.log("   📷 Accepted image URL:", s);
        urls.push(s);
      } else {
        console.warn("   ⚠️ Skipped non-image URL:", s);
      }
    };

    if (item?.value?.isUploadFile && item?.value?.uploadUrl) {
      console.log("➡️ From object:", item.value.uploadUrl);
      pushIfImg(item.value.uploadUrl);
    } else if (typeof item?.value === "string") {
      console.log("➡️ From string, splitting by comma");
      item.value.split(",").forEach(pushIfImg);
    } else if (Array.isArray(item?.value)) {
      console.log("➡️ From array of uploads:", item.value);
      item.value.forEach((v) => {
        pushIfImg(v?.uploadUrl || v);
      });
    }

    console.log("✅ extractImageUrls result:", urls);
    return urls;
  }

  async getDataUrlAndFormat(url) {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const mime =
      typeof dataUrl === "string" ? dataUrl.slice(5, dataUrl.indexOf(";")) : "";
    const format = /png/i.test(mime) ? "PNG" : "JPEG";
    return { dataUrl, format };
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

    // Small helper to produce the updated cell (reuses your current logic)
    const buildUpdatedCell = (cell) => {
      console.log("📌 Updating Radio Cell:", cellId);

      // Clone field to keep reactivity clean
      const newField = { ...(cell.field || {}) };
      newField.value = selectedValue;

      // ✅ Rebuild radioOptionsProcessed (unchanged logic)
      const radioOptionsProcessed = (newField.radioOptions || []).map(
        (option) => {
          const isSelected = selectedValue === option.optionLabel;
          let processedSubOptions = [];

          if (option.usePredefinedOptions) {
            const type = option.selectedPredefined?.toLowerCase();

            if (type === "staff" && this.staffOptions?.length > 0) {
              processedSubOptions = this.staffOptions.map((opt) => ({
                label: opt.label,
                isSelected: false
              }));
            } else if (
              type === "participant" &&
              this.participants?.length > 0
            ) {
              processedSubOptions = this.participants.map((p) => ({
                label: p.Name,
                isSelected: false
              }));
            } else if (
              type === "facility" &&
              this.facilityOptions?.length > 0
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

      return {
        ...cell,
        field: newField,
        selectedRadioOption: selectedValue,
        subInputValue: "", // Clear sub input on change (kept)
        radioOptionsProcessed
      };
    };

    // 1) Update the currently rendered rows (your existing behavior)
    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) =>
        cell.id === cellId ? buildUpdatedCell(cell) : cell
      )
    }));

    // 2) Mirror the same change into the paged source so paging preserves the selection
    //    (this is the missing piece that fixes the issue)
    this.stepPagedRows = this.stepPagedRows.map((page) =>
      page.map((row) => ({
        ...row,
        cells: row.cells.map((cell) =>
          cell.id === cellId ? buildUpdatedCell(cell) : cell
        )
      }))
    );
  }

  // handleRadioSubInputChange(event) {
  //   const cellId = event.target.dataset.id;
  //   const subValue = event.target.value;

  //   console.log("📥 Sub-Input Change in Cell:", cellId, "| Value:", subValue);

  //   this.tableRows = this.tableRows.map((row) => ({
  //     ...row,
  //     cells: row.cells.map((cell) => {
  //       if (cell.id === cellId) {
  //         // 1️⃣ Store subInputValue
  //         cell.subInputValue = subValue;

  //         // 2️⃣ Compose final value with main radio
  //         const selectedRadio = cell.selectedRadioOption || "";
  //         if (selectedRadio) {
  //           cell.field.value = subValue
  //             ? `${selectedRadio} - ${subValue}`
  //             : selectedRadio;
  //         }

  //         // 3️⃣ Rebuild processed options with correct selection
  //         cell.radioOptionsProcessed = (cell.radioOptionsProcessed || []).map(
  //           (option) => {
  //             const isSelected = option.optionLabel === selectedRadio;

  //             if (!isSelected) return option;

  //             let processedSubOptions = [];

  //             if (option.usePredefinedOptions) {
  //               const type = (option.selectedPredefined || "").toLowerCase();

  //               if (type === "staff" && Array.isArray(this.staffOptions)) {
  //                 processedSubOptions = this.staffOptions.map((opt) => ({
  //                   label: opt.label,
  //                   isSelected: subValue === opt.label
  //                 }));
  //               } else if (
  //                 type === "participant" &&
  //                 Array.isArray(this.participants)
  //               ) {
  //                 processedSubOptions = this.participants.map((p) => ({
  //                   label: p.Name,
  //                   isSelected: subValue === p.Name
  //                 }));
  //               } else if (
  //                 type === "facility" &&
  //                 Array.isArray(this.facilityOptions)
  //               ) {
  //                 processedSubOptions = this.facilityOptions.map((opt) => ({
  //                   label: opt.label,
  //                   isSelected: subValue === opt.label
  //                 }));
  //               }
  //             } else {
  //               processedSubOptions = (option.values || []).map((val) => ({
  //                 label: val,
  //                 isSelected: subValue === val
  //               }));
  //             }

  //             return {
  //               ...option,
  //               isSelected: true,
  //               processedSubOptions
  //             };
  //           }
  //         );
  //       }
  //       return cell;
  //     })
  //   }));
  // }

  handleRadioSubInputChange(event) {
    const cellId = String(event.target.dataset.id);
    const subValue = event.target.value;

    const applySubChangeToCell = (cell) => {
      const field = { ...(cell.field || {}) };
      const selectedRadio =
        cell.selectedRadioOption || field.selectedRadio || "";

      // update stored sub value
      field.subValue = subValue;

      // compose final value for submit (e.g., "Option - SubChoice" or "Option" if empty)
      field.value = selectedRadio
        ? subValue
          ? `${selectedRadio} - ${subValue}`
          : selectedRadio
        : subValue || "";

      // reflect sub selection in processed options
      const updatedProcessed = (cell.radioOptionsProcessed || []).map((opt) => {
        if (opt.optionLabel !== selectedRadio) return opt;

        let processedSubOptions = [];
        if (opt.usePredefinedOptions) {
          const type = (opt.selectedPredefined || "").toLowerCase();
          if (type === "staff" && Array.isArray(this.staffOptions)) {
            processedSubOptions = this.staffOptions.map((o) => ({
              label: o.label,
              isSelected: subValue === o.label
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
            processedSubOptions = this.facilityOptions.map((o) => ({
              label: o.label,
              isSelected: subValue === o.label
            }));
          }
        } else {
          processedSubOptions = (opt.values || []).map((v) => ({
            label: v,
            isSelected: subValue === v
          }));
        }

        return { ...opt, isSelected: true, processedSubOptions };
      });

      return {
        ...cell,
        subInputValue: subValue, // mirror for text box
        field,
        radioOptionsProcessed: updatedProcessed
      };
    };

    // UI copy
    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) =>
        String(cell.id) === cellId ? applySubChangeToCell(cell) : cell
      )
    }));

    // Canonical copy (submit source)
    this.stepPagedRows = this.stepPagedRows.map((page) =>
      page.map((row) => ({
        ...row,
        cells: row.cells.map((cell) =>
          String(cell.id) === cellId ? applySubChangeToCell(cell) : cell
        )
      }))
    );
  }

  get isFormListEmpty() {
    return (
      !this.paginatedFormResponses || this.paginatedFormResponses.length === 0
    );
  }

  // --- Helpers to read & score a response JSON -------------------------------
  normalizeId(id) {
    return (id || "").substring(0, 15);
  }

awsPayloadCache = new Map();

async getResponsePayloadObject(resp) {
  const candidates = [
    resp?.Response_JSON__c,
    resp?.Form_Response__c,
    resp?.Form_Data__c,
    resp?.Form_JSON__c,
    resp?.Json__c,
    resp?.Response__c
  ];

  for (const s of candidates) {
    if (!s || typeof s !== "string") continue;

    try {
      const parsed = JSON.parse(s);

      // ✅ AWS descriptor object
      if (parsed?.version === "aws-v1" && parsed?.url) {

        // cache by URL
        if (this.awsPayloadCache.has(parsed.url)) {
          return this.awsPayloadCache.get(parsed.url);
        }

        const res = await fetch(parsed.url);
        if (!res.ok) throw new Error("AWS JSON fetch failed");

        const realPayload = await res.json();

        this.awsPayloadCache.set(parsed.url, realPayload);

        return realPayload;
      }

      // ✅ inline JSON (old system)
      return parsed;

    } catch (e) {
      // ignore parse errors and continue
    }
  }

  // fallback if wire already returned object
  if (resp && typeof resp === "object" && (resp.tableRows || resp.fields || resp.pages)) {
    return resp;
  }

  return null;
}


  // Decide if this object is a display-only widget we should ignore
  isDisplayOnly(node) {
    const t = (node?.type || node?.ctrlType || node?.fieldType || "")
      .toString()
      .toLowerCase();
    return [
      "header",
      "heading",
      "title",
      "section",
      "divider",
      "hr",
      "html",
      "image",
      "button",
      "spacer"
    ].includes(t);
  }

  // Pick first key that exists on an object
  firstKeyValue(obj, keys) {
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    }
    return undefined;
  }

  // Is a value "filled"?
  isFilled(val) {
    if (val === null || val === undefined) return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "number") return true; // 0 is still an answer
    if (typeof val === "boolean") return true; // false is still an answer
    if (Array.isArray(val))
      return val.filter((v) => this.isFilled(v)).length > 0;
    if (typeof val === "object") {
      // consider filled if any leaf in the object is filled
      return Object.values(val).some((v) => this.isFilled(v));
    }
    return false;
  }

scoreCompletionFromPayload(root) {
  const LABEL_KEYS = ["label","fieldLabel","displayName","title","name","question","prompt"];
  const VALUE_KEYS = ["value","fieldValue","answer","selectedValue","input","text","checked"];

  let total = 0;
  let filled = 0;

  // Stack carries traversal context so we can ignore radio internals
  const stack = [{ node: root, inRadioInternals: false }];

  while (stack.length) {
    const { node, inRadioInternals } = stack.pop();
    if (node == null) continue;

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        stack.push({ node: node[i], inRadioInternals });
      }
      continue;
    }

    if (typeof node === "object") {
      // Table/cell shapes used by many builders
      if (node.cells && Array.isArray(node.cells)) {
        for (const c of node.cells) {
          // preserve context; push field if present, but still traverse cell later
          stack.push({ node: c?.field || c, inRadioInternals });
        }
      }

      // 🔹 Header guard (ignore in scoring)
      const isHeaderish =
        node?.dataType === "Header" || node?.type === "header" || node?.isHeader === true;

      // 🔹 Page Break / Blank guard (ignore in scoring)
      const isPageBreakish =
        node?.dataType === "Blank" ||
        node?.isBlank === true ||
        node?.isPageBreak === true ||
        (typeof node?.label === "string" && /page\s*break/i.test(node.label));

      // 🔹 Radio internals guard (ignore option rows & suboptions)
      // If we are already inside radio internals, skip counting this node.
      const isInsideRadioInternals = !!inRadioInternals;

      // Normalize labels: strip zero-width spaces then trim
      const rawLabel = this.firstKeyValue(node, LABEL_KEYS);
      const normLabel = typeof rawLabel === "string" ? rawLabel.replace(/\u200B/g, "").trim() : "";

      const val = this.firstKeyValue(node, VALUE_KEYS);

      // Count only real inputs
      const looksLikeField =
        normLabel.length > 0 &&
        !isHeaderish &&
        !isPageBreakish &&
        !isInsideRadioInternals &&        // ← exclude radio suboptions wherever they live
        !this.isDisplayOnly?.(node);

      if (looksLikeField) {
        total += 1;
        if (this.isFilled(val)) filled += 1;
      }

      // Keep traversing children, propagating context:
      // Enter radio internals when walking into option trees of a Radio Button field.
      const isRadioField = node?.dataType === "Radio Button" || node?.isRadio === true || node?.isRadioButton === true;
      for (const [key, v] of Object.entries(node)) {
        if (!v || (typeof v !== "object" && !Array.isArray(v))) continue;

        const nextInRadioInternals =
          inRadioInternals ||
          (isRadioField &&
            (key === "radioOptions" ||
             key === "radioOptionsProcessed" ||
             key === "processedSubOptions" ||
             key === "values"));

        stack.push({ node: v, inRadioInternals: nextInRadioInternals });
      }
    }
  }

  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { total, filled, pct, text: `${filled}/${total} (${pct}%)` };
}



  @track uniqueNames = []; // stored unique names
  @track nameTabs = []; // prebuilt tabs for the wrapper
  @track selectedNameFilter = "ALL";

  _normalizeName(v) {
    const t = (v ?? "").toString().trim();
    return t ? t : "Unnamed";
  }

  _buildNameTabs() {
    const collator = new Intl.Collator(undefined, { sensitivity: "base" });

    // sort uniques (already computed below)
    const sorted = [...this.uniqueNames].sort(collator.compare);

    const tabs = sorted.map((name) => ({
      label: name,
      value: name,
      computedClass: `role-tab-button ${this.selectedNameFilter === name ? "role-tab-active" : ""}`
    }));

    // prepend "All"
    tabs.unshift({
      label: "All",
      value: "ALL",
      computedClass: `role-tab-button ${this.selectedNameFilter === "ALL" ? "role-tab-active" : ""}`
    });

    this.nameTabs = tabs;
  }

  handleNameTabClick(event) {
    const value = event.currentTarget.dataset.role;
    if (!value) return;

    this.selectedNameFilter = value;
    this.formPageNumber = 1;

    // rebuild tabs so the active class updates immediately
    this._buildNameTabs();

    this.recomputeFiltersAndPagination();
  }

  recomputeFiltersAndPagination() {
    const base = this.allFormResponses || [];
    let filtered = base;

    if (this.selectedNameFilter !== "ALL") {
      filtered = base.filter(
        (r) => this._normalizeName(r?.Name__c) === this.selectedNameFilter
      );
    }

    this.filteredFormResponses = filtered;

    this.totalFormRecords = filtered.length;
    this.totalFormPages = Math.max(
      1,
      Math.ceil(this.totalFormRecords / this.formPageSize)
    );

    this.updatePaginatedFormResponses();
  }

  updateArrowVisibility = () => {
    const container = this.template.querySelector(
      '[data-id="roleTabsContainer"]'
    );
    if (!container) return;

    const scrollLeft = Math.ceil(container.scrollLeft);
    const scrollWidth = Math.ceil(container.scrollWidth);
    const clientWidth = Math.ceil(container.clientWidth);

    this.disableLeftArrow = scrollLeft <= 0;
    this.disableRightArrow = scrollLeft + clientWidth >= scrollWidth;
  };

  scrollTabsLeft() {
    const container = this.template.querySelector(
      '[data-id="roleTabsContainer"]'
    );
    if (container) {
      container.scrollBy({ left: -150, behavior: "smooth" });
      setTimeout(() => this.updateArrowVisibility(), 300);
      console.log("⬅ Scroll left clicked");
    }
  }

  scrollTabsRight() {
    const container = this.template.querySelector(
      '[data-id="roleTabsContainer"]'
    );
    if (container) {
      container.scrollBy({ left: 150, behavior: "smooth" });
      setTimeout(() => this.updateArrowVisibility(), 300);
      console.log("⬅ Scroll left clicked");
    }
  }

  handleScroll() {
    this.updateArrowVisibility();
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


async uploadFormJsonToAws(finalRows, folderType, formTitle, existingKey = null) {
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
const effectiveTitle = formTitle || this.formTitle || "Form";

const fileName = this.buildTimestampedFileName(effectiveTitle);
let key;

 if (existingKey) {
    key = existingKey;
    console.log("♻️ Reusing existing key:", key);
  } else {
    key =
     `CustomisableForms/${this.orgid}/Participant/${dateStr}/${folderType}/${fileName}.json`;

  }


    console.log("🔑 [FormJSON] Generated S3 key:", key);

    console.log("📡 [FormJSON] Requesting presigned URL:", {
      bucketName: "docimgupld",
      key,
      contentType: "application/json"
    });

      const presign = existingKey
      ? await getUpdatePresignedUrl({
          bucketName: "docimgupld",
          key,
          contentType: "application/json"
        })
      : await getPresignedUrl({
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

buildTimestampedFileName(name) {

  const safe = this.sanitizeFileName(name);

  const now = new Date();

  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();

  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  const compactTimestamp = `${dd}${mm}${yyyy}${hh}${min}`;

  return `${safe}_${compactTimestamp}`;
}


formatToday() {
  const d = new Date();

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}


getStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();

  switch (s) {
    case "pending":
      return "status-pill status-pending";

    case "completed":
    case "signed":
      return "status-pill status-completed";

    case "rejected":
      return "status-pill status-rejected";

    case "draft":
      return "status-pill status-draft";

    default:
      return "status-pill status-default";
  }
}



}