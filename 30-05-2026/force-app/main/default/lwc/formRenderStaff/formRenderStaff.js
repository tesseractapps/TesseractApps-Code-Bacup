import { LightningElement, track, wire, api } from "lwc";
import getForms from "@salesforce/apex/FormController.getForms";
import QUILL from '@salesforce/resourceUrl/Quill';
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
// import getFormResponsesByClient from "@salesforce/apex/FormController.getFormResponsesByClient";
import uploadFileToSalesforce from "@salesforce/apex/FormController.uploadFileToSalesforce";
import { getRecord } from "lightning/uiRecordApi";
import USER_FIRSTNAME from "@salesforce/schema/User.FirstName";
import USER_LASTNAME from "@salesforce/schema/User.LastName";
import USER_EMAIL from "@salesforce/schema/User.Email";
import USER_ROLE from "@salesforce/schema/User.User_Role__c";
import USER_TYPE from "@salesforce/schema/User.User_Type__c";
import USER_ORG_NAME from "@salesforce/schema/User.Organization_Name__c";
import getFacilityByUserEmail from "@salesforce/apex/FormController.getFacilityByUserEmail";
import { loadScript, loadStyle } from "lightning/platformResourceLoader";
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

import html2canvas from "@salesforce/resourceUrl/html2canvas";



import getStaffForCurrentUser 
  from "@salesforce/apex/FormController.getStaffForCurrentUser";
import getAccessibleStaffForms from "@salesforce/apex/FormController.getAccessibleStaffForms";
import saveStaffFormResponse
  from "@salesforce/apex/FormController.saveStaffFormResponse";
  import updateStaffFormResponse
  from "@salesforce/apex/FormController.updateStaffFormResponse";
  import getFormResponsesByStaff
  from "@salesforce/apex/FormController.getFormResponsesByStaff";
import getOrgLogo from "@salesforce/apex/IncidentRegisterControllerV2.getOrgLogo";
import isStartPlan from '@salesforce/apex/LimitCheckService.isStartPlan';







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
  @track staffId;
  @track staffNameToDisplay = "";
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
  @track staffEmail = "";

  @track signatureInitialized  =false;
  @track showUpgradeModal;
  @track isHome=true;



    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
  
    get logoUrl() {
      return this.tLogoUrl;
    }
  
    get imageUrl() {
      return this.tImageUrl;
    }

    @wire(MessageContext) context;


async connectedCallback() {

   try {
            const isStart = await isStartPlan();
 
            // 🔴 BLOCK ENTIRE MODULE
            if (isStart ) {
                console.log('🚫 Start plan → block training  module');
                this.showUpgradeModal = true;
 
                // ❗ STOP EVERYTHING
                this.isHome = false;
           
 
                return;
            }
       
 
            } catch (error) {
                console.error('Error checking plan:', error);
                return;
            }
  console.log("📌 Received Org ID in Form Render Staff:", this.orgid);

  // =====================================================
  // 👨‍💼 Resolve Logged-in Staff (UNCHANGED)
  // =====================================================
  getStaffForCurrentUser()
    .then((staff) => {
      if (staff) {
        this.staffId = staff.Id;
        this.staffNameToDisplay = staff.NameToDisplay__c;
        this.staffEmail = staff.Email_Address__c;

        console.log("👨‍💼 Logged-in StaffId:", this.staffId);
        console.log("🧑 Staff NameToDisplay__c:", this.staffNameToDisplay);
         console.log("📧 Staff Email:", this.staffEmail);
      } else {
        console.warn("⚠️ No Staff record found for current user.");
      }

      // 🔥 KEEP EXISTING FLOW
      this.loadStaffAccessibleForms();
      this.loadStaffResponses();
    })
    .catch((err) => {
      console.error("❌ Failed to resolve Staff", err);
    });

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

          this.orgName = result.Name;

          console.log("📌 Received Org Name in Form Render Staff:", this.orgName);

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

    /* ---------------------------------------
    ⭐ LOAD QUILL CSS + JS
    --------------------------------------- */

    if (!this.quillLoaded) {

        this.quillLoaded = true;

        Promise.all([
            loadStyle(this, QUILL + "/quill.snow.css"),
            loadScript(this, QUILL + "/quill.min.js")
        ])
        .then(() => {

            console.log("✅ Quill CSS + JS loaded successfully");

            this.quillReady = true;

        })
        .catch((error) => {

            console.error("❌ Failed to load Quill resources", error);

        });

    }
}




// async handleTsignFromForms(event) {
//   event.preventDefault?.();
//   event.stopPropagation?.();

//   try {
//     const responseId = event.currentTarget.dataset.id;
//     const resp = (this.formResponses || []).find((r) => r.Id === responseId);

//     const signatureUrlFromDataset = event.currentTarget.dataset.signatureUrl;
//     const resolvedSignatureUrl = signatureUrlFromDataset || resp?.signatureUrl;

//     // ✅ SIGNED: open/download
//     if (resolvedSignatureUrl) {
//       window.open(resolvedSignatureUrl, "_blank");
//       return;
//     }

//     // ❌ NOT SIGNED: prepare data and show confirm modal
//     let awsUrl = event.currentTarget.dataset.url;
//     if (!awsUrl) awsUrl = resp?.AWS_Url__c;

//     if (!awsUrl) {
//       this.showToast(
//         "Missing PDF",
//         "Please submit the form to generate the PDF before using TSign.",
//         "warning"
//       );
//       return;
//     }

//     const clientId = resp?.Client_Id__c;
//     let clientEmail = "";
//     if (clientId) {
//       clientEmail = await getClientEmailByClientId({ clientId });
//     }

//     // store for confirmation step
//     this.pendingTsignResponseId = responseId;
//     this.pendingTsignAwsUrl = awsUrl;
//     this.pendingTsignClientEmail = clientEmail || "";

//     this.isTsignConfirmModalOpen = true;
//   } catch (e) {
//     console.error("❌ handleTsignFromForms failed:", e);
//     this.showToast("Error", "Failed to open TSign.", "error");
//   }
// }

async handleTsignFromForms(event) {
  event.preventDefault?.();
  event.stopPropagation?.();

  try {
    const responseId = event.currentTarget.dataset.id;
    const resp = (this.formResponses || []).find((r) => r.Id === responseId);

    const signatureUrlFromDataset = event.currentTarget.dataset.signatureUrl;
    const resolvedSignatureUrl =
      signatureUrlFromDataset || resp?.signatureUrl;

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

    // ------------------------------------------------
    // ⭐ KEEP EXISTING VARIABLES (UNCHANGED)
    // ------------------------------------------------
    this.pendingTsignResponseId = responseId;
    this.pendingTsignAwsUrl = awsUrl;
    this.pendingTsignClientEmail = this.staffEmail || "";


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

  hasLoadedStaffForms = false;

  loadStaffAccessibleForms() {
  if (!this.staffId) {
    console.warn("⚠️ loadStaffAccessibleForms skipped — staffId missing");
    return;
  }

  console.log("📋 Loading accessible forms for staff:", this.staffId);

  getAccessibleStaffForms({ staffId: this.staffId })
    .then((formRecords) => {
      if (!formRecords || formRecords.length === 0) {
        this.forms = [];
        this.filteredForms = [];
        console.warn("⚠️ No accessible forms for staff.");
        return;
      }

      this.forms = formRecords.map((form) => {
        let miniRows = [];
        try {
          if (form.Form_JSON__c) {
            let parsed;
            const raw = form.Form_JSON__c;

            if (raw) {
              const tmp = JSON.parse(raw);

              if (tmp?.url && tmp?.key) {
                console.warn(
                  "Mini preview skipped (AWS-backed form):",
                  form.Name__c
                );
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
        "✅ Staff forms loaded:",
        this.filteredForms.map((f) => f.Name__c)
      );
    })
    .catch((error) => {
      console.error(
        "❌ Error fetching accessible forms for staff:",
        error
      );
    });
}
loadStaffResponses() {
  if (!this.staffId) {
    console.warn("⚠️ loadStaffResponses skipped — staffId missing");
    return;
  }

  console.log("📥 Loading staff form responses for:", this.staffId);

  getFormResponsesByStaff({ staffId: this.staffId })
    .then((data) => {
      console.log("✅ Retrieved Form Responses for Staff:", data);

      this.formResponses = data || [];
      this.processFormResponses(this.formResponses);
    })
    .catch((error) => {
      console.error("❌ Error fetching responses for staff:", error);
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

    if (!this.html2canvasInitialized) {
        loadScript(this, html2canvas)
            .then(() => {
                console.log("✅ html2canvas loaded");
                this.html2canvasInitialized = true;
            })
            .catch(err => {
                console.error("❌ html2canvas load failed", err);
            });
    }

    try {
      const pageIndex = this.stepCurrentPageIndex ?? 0;
      const currentPage = this.stepPagedRows?.[pageIndex] || [];

      // Build a quick lookup for the visible page’s cells
      const cellById = new Map();

currentPage.forEach((row) => {
  (row?.cells || []).forEach((cell) => {

    /* MAIN GRID CELL */
    cellById.set(String(cell?.id ?? ""), cell);

    /* TABLE BLOCK CELLS */
    if (cell?.isTableBlock && cell?.field?.tableConfig?.renderRows) {

  cell.field.tableConfig.renderRows.forEach((tRow) => {

        (tRow?.renderCells || []).forEach((tCell) => {

          cellById.set(String(tCell?.id ?? ""), tCell);

        });

      });

    }

  });
});

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
    if (this.isDrawMode) {
      setTimeout(() => {
        this.initializeSignaturePad();
      }, 0);
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
  const isOpening = !this.showPublishedForms;

  this.showPublishedForms = isOpening;

  if (isOpening) {
    // ✅ Reset search + list when opening
    this.searchQuery = "";
    this.filteredForms = [...this.forms];
  }

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


  getDecileClass(pct) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    const bucket = Math.floor(clamped / 10) * 10; // 0,10,...,100
    return `resp-bar__fill resp-bar__fill--${bucket}`;
  }

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
      // console.log(`🧾 [${index}] Form Response RAW:`, response);

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

      // console.log(`🧾 [${index}] Form Response MAPPED:`, mapped);

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
    // console.log("➡️ Checking signature for FormResponse:", r.Id);

    return checkFormSignatureStatus({ formResponseId: r.Id })
      .then((status) => {
        // console.log("✅ Signature status from Apex for", r.Id, "=>", status);

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

        // console.log(
        //   "🔄 Row updated:",
        //   r.Id,
        //   "isSigned:",
        //   updated.isSigned,
        //   "signatureUrl:",
        //   updated.signatureUrl
        // );

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
        // this.fetchParticipants();
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

  normalizeRowCells(row) {

    if (!row.cells || row.cells.length === 0) {
        return row;
    }

    const maxCol = Math.max(...row.cells.map(c => c.col));

    const normalizedCells = [];

    for (let i = 0; i <= maxCol; i++) {

        const existing = row.cells.find(c => c.col === i);

        if (existing) {
            normalizedCells.push(existing);
        } else {
            normalizedCells.push({
                id: `placeholder-${row.id}-${i}`,
                row: row.row,
                col: i,
                field: null,
                colspan: 1,
                rowspan: 1,
                isVisible: true
            });
        }
    }

    return {
        ...row,
        cells: normalizedCells
    };

    
}

  @track selectedFormTitle = "";

async handleFormClick(event) {
  const formId = event.currentTarget.dataset.id;
  this.selectedForm = this.forms.find((form) => form.Id === formId);

  if (this.selectedForm) {

    this.selectedFormType =
      this.selectedForm.Form_Type__c || "Unknown Form Type";

    this.selectedFormTitle =
      this.selectedForm.Name__c || "Untitled Form";

    console.log("🔹 Clicked Form ID:", formId);
    console.log("🔹 Clicked Form Name:", this.selectedForm.Name__c);
    console.log("🔹 Clicked Form Type:", this.selectedFormType);

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

        parsedJson = parsed;

      }

    }

    this.masterFormJson = JSON.parse(JSON.stringify(parsedJson));

    this.tableRows = parsedJson.map(row => this.normalizeRowCells(row));

    const filteredRows = parsedJson.map((row, rowIndex) => ({

      ...row,

      cells: row.cells.map((cell, colIndex) => {

        /* ------------------------------------------------ */
        /* 🔁 SHARED FIELD PROCESSOR */
        /* ------------------------------------------------ */

        const shared = this.processCellField(cell);

        let isTableBlock = false;
        let tableConfig = null;

        /* TABLE BLOCK */

        if (
  cell.field?.isTableBlock ||
  cell.field?.dataType === "Table Block"
) {

  isTableBlock = true;

  const builtConfig = this.buildTableBlockRenderModel(cell);

  console.log("🆕 TableBlock INIT → renderRows:",
    builtConfig.renderRows?.length
  );

  cell = {
    ...cell,
    field: {
      ...cell.field,
      tableConfig: builtConfig   // 🔥 MUST ASSIGN BACK
    }
  };

  this.reinitializeRichEditors();
}

        /* HEADER */

        let isHeader = false;
        let headerText = null;
        let headerStyle = "";

        if (
          cell.field?.dataType === "Header" ||
          cell.field?.type === "header" ||
          cell.field?.isHeader === true
        ) {

          isHeader = true;

          headerText =
            cell.field?.text ||
            cell.field?.label ||
            "Section Title";

          headerStyle =
            cell.field?.inlineStyle ||
            this.computeHeaderInlineStyle?.({
              fontSize: cell.field?.fontSize || "24",
              fontWeight: cell.field?.fontWeight || "600",
              textAlign: cell.field?.textAlign || "left",
              textDecoration: cell.field?.textDecoration || "none",
              color: cell.field?.color || "#000000"
            }) ||
            `font-size:${cell.field?.fontSize || 24}px;
             font-weight:${cell.field?.fontWeight || 600};
             text-align:${cell.field?.textAlign || "left"};
             text-decoration:${cell.field?.textDecoration || "none"};
             color:${cell.field?.color || "#000000"};`;

        }

        const dataId = `row-${rowIndex}-col-${colIndex}`;

        const id = cell.id || `cell-${rowIndex}-${colIndex}`;

        return {

          ...cell,

          ...shared,

          dataId,
          id,
           isDropdownOpen: false,

          isHeader,
          headerText,
          headerStyle,

          isTableBlock,
          tableConfig,

          field: {
            ...cell.field,
            value:
              (shared.isRichText || shared.isRichTextDisplay)
                ? (cell.field?.richTextContent || cell.field?.value || "")
                : (cell.field?.value || ""),
            options: shared.options
          },

          hasContent: !!(
            isHeader ||
            shared.isSignature ||
            isTableBlock ||
            shared.isRichTextDisplay ||
            cell.field?.label ||
            shared.isTextField ||
            shared.isAlphaNumeric ||
            shared.isOnlyAlphabets ||
            shared.isNumberField ||
            shared.isCurrency ||
            shared.isContactNumber ||
            shared.isDefaultNumber ||
            shared.isTimeField ||
            shared.isDateField ||
            shared.isCheckboxField ||
            shared.isDropdownField ||
            shared.isUploadField ||
            shared.isRadioButton ||
            shared.isTextArea
          )

        };

      })

    }));

    this.tableRows = filteredRows;

    /* PAGINATION */

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

    this.reinitializeRichEditors();

    this.isFormSelected = true;

    this.isViewModeON = false;

    this.showPublishedForms = false;

    console.log("✅ isFormSelected set to true. UI should render form.");

  }
}

  
buildTableBlockRenderModel(cell) {

  const tableConfig = { ...(cell.field?.tableConfig || {}) };

  const columns = tableConfig.columns || [];
  const rowNames = tableConfig.rowNames || [];
  const innerCells = tableConfig.innerCells || [];

  const hasRowLabel = columns.some(c => c.isRowLabel);

  console.group("🧱 buildTableBlockRenderModel");

  console.log("📦 columns:", columns.length);
  console.log("📦 rowNames:", rowNames.length);
  console.log("📦 innerCells:", innerCells.length);

  const renderRows = innerCells.map((innerRow, rIndex) => {

    return {

      key: `row-${rIndex}`,
      value: rowNames[rIndex]?.value || "",

      renderCells: columns.map((col, cIndex) => {

        /* ================= ROW LABEL ================= */

        if (col.isRowLabel) {
          return {
            key: `${rIndex}-label`,
            isRowLabel: true,
            cellValue: rowNames[rIndex]?.value || ""
          };
        }

        /* ================= INNER INDEX ================= */

        const innerIndex = hasRowLabel ? cIndex - 1 : cIndex;

        /* ================= STRICT MATCH ================= */

        const innerCell = (innerRow.cells || []).find(
          c => Number(c.col) === Number(innerIndex)
        );

        if (!innerCell) {
          console.error("❌ INNER CELL NOT FOUND", {
            rIndex,
            cIndex,
            innerIndex,
            innerRow
          });
        }

        /* ================= VALUE ================= */

        const sourceValue = innerCell?.field?.value ?? "";

        /* ================= SAFE FIELD CLONE ================= */

        const field = {
          ...(innerCell?.field
            ? JSON.parse(JSON.stringify(innerCell.field))
            : {}),
          value: sourceValue,

          /* 🔥 IMPORTANT: unique per cell */
          id: innerCell?.id,

          /* optional debug */
          _originalFieldId: innerCell?.field?.id
        };

        /* ================= PROCESS FIELD ================= */

        const shared = this.processCellField({
          ...innerCell,
          field
        });

        /* ================= FINAL RETURN ================= */

        return {

          key: `${rIndex}-${cIndex}`,
          col: innerIndex,
          isRowLabel: false,

          ...shared,

          /* 🔥 CRITICAL: stable unique id */
          id: innerCell?.id || `${rIndex}-${cIndex}`,

          isDropdownField: shared.isDropdownField,
          isMultiSelect: shared.isMultiSelect,
          isDropdownOpen: false,

          selectedValues: shared.selectedValues,
          selectedOptionsArray: shared.selectedOptionsArray,

          field: {
            ...field,
            options: shared.options
          }

        };

      })

    };

  });

  console.log("✅ renderRows built:", renderRows.length);

  console.groupEnd();

  tableConfig.renderRows = renderRows;

  return tableConfig;
}

processCellField(cell, rowIndex = 0, colIndex = 0) {

  let options = [];
  let selectedOptionsArray = [];
  let selectedValues = "";

  let isTextField = false;
  let isTextArea = false;
  let isAlphaNumeric = false;
  let isOnlyAlphabets = false;
  
  let isNumberField = false;
  let isCurrency = false;
  let isContactNumber = false;
  let isDefaultNumber = false;

  let isTimeField = false;
  let isDateField = false;
  let isCheckboxField = false;

  let isDropdownField = false;
  let isUploadField = false;

  let isMultiSelect = false;
  let isDropdownOpen = false;

  let maxLength = null;
  let decimalPlaces = 0;
  let charCount = 0;
  let placeholderText = "";

  let floatingLabelStyle = this.getBorderStyle(cell.field?.dataType);

  let isRichText = false;
  let isRadioButton = false;
  let radioOptionsProcessed = [];
  let selectedRadioOption = "";
  let subInputValue = "";
  let subRadioName = "";

  let isSignature = false;
  let signatureButtonLabel = "Add Signature";

  let isRichTextDisplay = false;

  isCheckboxField = cell.field?.dataType === "Checkbox Field";

  /* -------------------------------- */
  /* DROPDOWN FIELD */
  /* -------------------------------- */

  if (cell.field?.dataType === "Dropdown Field") {

    isDropdownField = true;
    placeholderText = `Select ${cell.field.label}`;

    if (cell.field.selectedDropdownOption === "predefinedList") {

      const type = (cell.field.predefinedListType || "").trim().toLowerCase();

      if (type === "staff" && this.staffOptions.length > 0) {

        options = this.staffOptions.map(opt => ({
          label: opt.label,
          value: opt.value,
          isSelected: cell.field.value === opt.value
        }));

      }
      else if (type === "participant" && this.allparticipants.length > 0) {

        options = this.allparticipants.map(p => ({
          label: p.Name,
          value: p.Id,
          isSelected: cell.field.value === p.Id
        }));

      }
      else if (type === "facility" && this.facilityOptions.length > 0) {

        options = this.facilityOptions.map(opt => ({
          label: opt.label,
          value: opt.value,
          isSelected: cell.field.value === opt.value
        }));

      }
      else {

        options = [];

      }

    }
    else if (
      cell.field.selectedDropdownOption === "singleSelect" &&
      cell.field.singleSelectValues
    ) {

      options = cell.field.singleSelectValues
        .split("\n")
        .map(option => ({
          label: option.trim(),
          value: option.trim(),
          isSelected: cell.field.value === option.trim()
        }))
        .filter(option => option.label);

    }
    else if (
      cell.field.selectedDropdownOption === "multiSelect" &&
      cell.field.multiSelectValues
    ) {

      isMultiSelect = true;

      options = cell.field.multiSelectValues
        .split("\n")
        .map(option => ({
          label: option.trim(),
          value: option.trim(),
          isSelected: false
        }))
        .filter(option => option.label);

      selectedOptionsArray = cell.field.value
        ? cell.field.value.split(", ")
        : [];

      selectedValues = selectedOptionsArray.join(", ");

      options.forEach(option => {
        if (selectedOptionsArray.includes(option.label)) {
          option.isSelected = true;
        }
      });

    }
  }

  /* -------------------------------- */
  /* TEXT FIELD */
  /* -------------------------------- */

  if (cell.field?.dataType === "Text Field") {

    if (cell.field.selectedTextFieldOption === "textArea") {

      isTextArea = true;
      maxLength = 255;
      charCount = cell.field.value ? cell.field.value.length : 0;
      placeholderText = `Enter ${cell.field.label} (Up to 255 chars)`;

    }
    else if (cell.field.selectedTextFieldOption === "alphaNumeric") {

      isAlphaNumeric = true;

      maxLength = cell.field.alphaNumericLength
        ? parseInt(cell.field.alphaNumericLength, 10)
        : 56;

      placeholderText = `Enter ${cell.field.label} (Max ${maxLength} chars)`;

    }
    else if (cell.field.selectedTextFieldOption === "onlyAlphabets") {

      isOnlyAlphabets = true;

      maxLength = cell.field.onlyAlphabetsLength
        ? parseInt(cell.field.onlyAlphabetsLength, 10)
        : 55;

      placeholderText = `Enter ${cell.field.label} (Alphabets only, Max ${maxLength} chars)`;

    }
    else if (cell.field.selectedTextFieldOption === "richText") {

      isRichText = true;

    }
    else {

      isTextField = true;
      placeholderText = `Enter ${cell.field.label}`;

    }
  }

  /* -------------------------------- */
  /* NUMBER FIELD */
  /* -------------------------------- */

  if (cell.field?.dataType === "Number Field") {

    isNumberField = true;

    switch (cell.field.selectedNumberFieldOption) {

      case "contactNumber":

        isContactNumber = true;

        maxLength = cell.field.contactNumberDigits
          ? parseInt(cell.field.contactNumberDigits, 10)
          : 10;

        placeholderText =
          `Enter ${cell.field.label} (Max ${maxLength} digits)`;

        break;

      case "currency":

        isCurrency = true;

        decimalPlaces = cell.field.decimalValue
          ? parseInt(cell.field.decimalValue, 10)
          : 2;

        placeholderText =
          `Enter ${cell.field.label} (Up to ${decimalPlaces} decimals)`;

        break;

      default:

        isDefaultNumber = true;

        placeholderText =
          `Enter ${cell.field.label} (Numbers Only)`;
    }
  }

  /* -------------------------------- */
  /* DATE / TIME */
  /* -------------------------------- */

  if (cell.field?.dataType === "Time Field") {
    isTimeField = true;
    placeholderText = `Select Time`;
  }

  if (cell.field?.dataType === "Date Field") {
    isDateField = true;
    placeholderText = `Select Date`;
  }

  /* -------------------------------- */
  /* FILE UPLOAD */
  /* -------------------------------- */

  if (cell.field?.dataType === "Upload File") {
    isUploadField = true;
    placeholderText = "Upload File";

      if (!cell.field.meta) {
    cell.field.meta = {
      uploadedFiles: []
    };
  }
  }

/* -------------------------------- */
/* RADIO BUTTON */
/* -------------------------------- */

if (cell.field?.dataType === "Radio Button") {

  isRadioButton = true;

  const valueObj = cell.field?.value;

  // ✅ FIX: extract from structured value
  if (valueObj && typeof valueObj === "object") {
    selectedRadioOption = valueObj.selectedOption || "";
    subInputValue = valueObj.subValue || "";
  }

  // 🔁 fallback for old string format
  else if (typeof valueObj === "string") {
    selectedRadioOption = valueObj;
    subInputValue = "";
  }

  radioOptionsProcessed = (cell.field.radioOptions || []).map(option => {

    const isSelected =
      String(selectedRadioOption) === String(option.optionLabel);

    let processedSubOptions = [];

    if (option.usePredefinedOptions) {

      const predefined = option.selectedPredefined?.toLowerCase();

      let source = [];

      if (predefined === "staff") source = this.staffOptions || [];
      if (predefined === "participant") {
        source = (this.participants || []).map(p => ({
          label: p.Name,
          value: p.Id
        }));
      }
      if (predefined === "facility") source = this.facilityOptions || [];

      processedSubOptions = source.map(opt => ({
        label: opt.label,
        value: opt.value ?? opt.label,

        // ✅ FIX: match both value + label
        isSelected:
          String(subInputValue) === String(opt.value) ||
          String(subInputValue) === String(opt.label)
      }));

    } else {

      processedSubOptions = (option.values || []).map(val => ({
        label: val,
        value: val,
        isSelected: String(subInputValue) === String(val)
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

  subRadioName = cell.id + "-subradio";
}

  /* -------------------------------- */
  /* SIGNATURE */
  /* -------------------------------- */

  if (cell.field?.isSignature || cell.field?.dataType === "Signature") {

    isSignature = true;

    signatureButtonLabel =
      cell.field?.value
        ? "View / Update Signature"
        : "Add Signature";
  }

  /* -------------------------------- */
  /* RICH TEXT DISPLAY */
  /* -------------------------------- */

  if (cell.field?.dataType === "Rich Text" || cell.field?.isRichTextDisplay) {

    isRichTextDisplay = true;

  }

  return {

    options,
    selectedOptionsArray,
    selectedValues,

    isTextField,
    isTextArea,
    isAlphaNumeric,
    isOnlyAlphabets,

    isNumberField,
    isCurrency,
    isContactNumber,
    isDefaultNumber,

    isTimeField,
    isDateField,
    isCheckboxField,

    isDropdownField,
    isUploadField,

    isMultiSelect,
    isDropdownOpen,

    maxLength,
    decimalPlaces,
    charCount,
    placeholderText,

    floatingLabelStyle,

    isRichText,
    isRadioButton,
    radioOptionsProcessed,
    selectedRadioOption,
    subInputValue,
    subRadioName,

    isSignature,
    signatureButtonLabel,

    isRichTextDisplay

  };

}



  getBorderStyle(dataType) {
    return ["Checkbox Field", "Radio Button", "Header", "Table Block", "Rich Text"].includes(dataType)
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

  renderRichTextFields() {

    const containers = this.template.querySelectorAll('.rich-text-preview');

    containers.forEach(container => {

        const cellId = container.dataset.id;

        const cell = this.findCellById(cellId);

        if (cell?.field?.isRichTextDisplay && cell.field.richTextContent) {

            container.classList.add('ql-editor'); // apply Quill formatting

            if (container.innerHTML !== cell.field.richTextContent) {
                container.innerHTML = cell.field.richTextContent;
            }
        }

    });

}

// initializeQuillEditors() {

//     const editors = this.template.querySelectorAll(".rich-text-editor");

//     editors.forEach(container => {

//         const cellId = container.dataset.id;

//         if (container.dataset.initialized) {
//             return;
//         }

//         const cell = this.findCellById(cellId);

//        const quill = new window.Quill(container, {
//             theme: "snow",
//             placeholder: container.dataset.placeholder || "",
//             modules: {
//                 toolbar: [
//                     [{ header: [1, 2, 3, 4, 5, 6, false] }],
//                     ["bold", "italic", "underline", "strike"],
//                     [{ color: [] }, { background: [] }],
//                     [{ script: "sub" }, { script: "super" }],
//                     [{ list: "ordered" }, { list: "bullet" }],
//                     [{ indent: "-1" }, { indent: "+1" }],
//                     [{ direction: "rtl" }],
//                     [{ align: [] }],
//                     ["link", "image"],
//                     ["blockquote", "code-block"],
//                     ["clean"]
//                 ]
//             }
//         });

//         // ✅ LOAD EXISTING VALUE
//         if (cell?.field?.value) {
//             quill.root.innerHTML = cell.field.value;
//         }

//         // ✅ HANDLE CHANGE (existing functionality)
//         quill.on("text-change", () => {

//             const html = quill.root.innerHTML;

//             if (cell?.field) {
//                 cell.field.value = html;
//             }

//             // mimic lightning-input-rich-text onchange
//             this.handleInputChange({
//                 target: {
//                     dataset: { id: cellId },
//                     value: html
//                 }
//             });

//         });

//         // // ✅ HANDLE PASTE (existing functionality)
//         // quill.root.addEventListener("paste", (event) => {

//         //     this.handleRtePaste({
//         //         target: {
//         //             dataset: { id: cellId }
//         //         },
//         //         clipboardData: event.clipboardData
//         //     });

//         // });

//         container.dataset.initialized = "true";

//         console.log("✅ Quill initialized for:", cellId);

//     });

// }

initializeQuillEditors() {

    if (!this.quillReady) {
        console.warn("⛔ Quill not ready yet");
        return;
    }

    const editors = this.template.querySelectorAll(".rich-text-editor");

    console.log("🔍 Found editors:", editors.length);

    editors.forEach(container => {

        const cellId = container.dataset.id;
        console.log("👉 Processing editor:", cellId);

        if (container.dataset.initialized) {
            console.log("⏭️ Skipping already initialized:", cellId);
            return;
        }

        const cell = this.findCellById(cellId);
        console.log("📦 Cell:", JSON.parse(JSON.stringify(cell)));

        // =====================================================
        // 🔥 FIX: define flag INSIDE each editor scope
        // =====================================================
        let isToolbarInteraction = false;

        // =========================
        // ✅ INIT QUILL
        // =========================
        const quill = new window.Quill(container, {
            theme: "snow",
            placeholder: container.dataset.placeholder || "",
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ color: [] }, { background: [] }],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ align: [] }],
                    ["link"],
                    ["clean"]
                ]
            }
        });

        console.log("✅ Quill created:", cellId);

        // =====================================================
        // 🔥 FIX: detect toolbar interaction CORRECTLY
        // =====================================================
        const toolbarEl = container.parentNode.querySelector(".ql-toolbar");

        if (toolbarEl) {
            toolbarEl.addEventListener("mousedown", () => {
                console.log("🧰 Toolbar interaction");
                isToolbarInteraction = true;
            });
        }

        // =========================
        // ✅ LOAD CONTENT
        // =========================
        if (cell?.field?.value) {

            const value = cell.field.value;

            try {
                const parsed = JSON.parse(value);

                if (parsed?.ops) {
                    quill.setContents(parsed);
                } else {
                    quill.clipboard.dangerouslyPasteHTML(value);
                }

            } catch {
                quill.clipboard.dangerouslyPasteHTML(value);
            }
        }

        // =====================================================
        // 🔥 SELECTION TRACKING
        // =====================================================
        let lastRange = null;

        quill.on("selection-change", (range, oldRange, source) => {

            console.log("🧭 [SELECTION]", { cellId, range, source });

            if (range) {
                lastRange = range;
            }
        });

        // =====================================================
        // 🔥 CURSOR FIX (ALL CASES)
        // =====================================================
        quill.on("text-change", (delta, oldDelta, source) => {

            if (source !== "user") return;

            const before = quill.getSelection();

            setTimeout(() => {

                let after = quill.getSelection();

                if (before && after && after.index === before.index) {

                    console.warn("🚨 Cursor stuck → fixing");

                    const newIndex = before.index + 1;

                    quill.setSelection(newIndex, 0);
                }

            }, 0);

            if (cell?.field) {
                cell.field.value = quill.root.innerHTML;
            }
        });

        // =====================================================
        // 🔥 FIXED BLUR HANDLER
        // =====================================================
        quill.root.addEventListener("blur", () => {

            console.warn("🔴 BLUR");

            setTimeout(() => {

                if (isToolbarInteraction) {
                    console.log("⏭️ Skip save (toolbar click)");
                    isToolbarInteraction = false;
                    return;
                }

                const html = quill.root.innerHTML;

                console.log("💾 Saving:", html);

                this.handleInputChange({
                    target: {
                        dataset: { id: cellId },
                        value: html
                    }
                });

            }, 150);
        });

        // =====================================================
        // 🔥 TOOLBAR SAFE FORMAT
        // =====================================================
        const toolbar = quill.getModule("toolbar");

        if (toolbar) {

            const applyFormatSafely = (format, value) => {

                quill.focus();

                let range = quill.getSelection();

                if (!range && lastRange) {

                    const length = quill.getLength();

                    let safeIndex = Math.min(lastRange.index, length - 1);
                    let safeLength = lastRange.length || 0;

                    try {
                        quill.setSelection(safeIndex, safeLength);
                        range = quill.getSelection();
                    } catch {
                        quill.setSelection(length - 1, 0);
                        range = quill.getSelection();
                    }
                }

                if (!range) return;

                const formats = quill.getFormat(range);
                const current = formats[format];

                try {

                    if (range.length > 0) {
                        quill.formatText(
                            range.index,
                            range.length,
                            format,
                            value !== undefined ? value : !current
                        );
                    } else {
                        quill.format(
                            format,
                            value !== undefined ? value : !current
                        );
                    }

                } catch (e) {
                    console.error("❌ Format failed:", e);
                }
            };

            toolbar.addHandler("bold", () => applyFormatSafely("bold"));
            toolbar.addHandler("color", (v) => applyFormatSafely("color", v));
            toolbar.addHandler("background", (v) => applyFormatSafely("background", v));

            ["italic", "underline", "strike"].forEach(fmt => {
                toolbar.addHandler(fmt, () => applyFormatSafely(fmt));
            });
        }

        // =====================================================
        // 🔥 DEBUG (OPTIONAL)
        // =====================================================
        const observer = new MutationObserver(() => {
            console.warn("🧨 DOM mutation detected");
        });

        observer.observe(quill.root, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // =====================================================
        // ✅ STORE INSTANCE
        // =====================================================
        if (!this._quillMap) {
            this._quillMap = new Map();
        }

        this._quillMap.set(cellId, quill);

        container.dataset.initialized = "true";

        console.log("🎉 Ready:", cellId);
    });
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
  //   const pageIndex = this.stepCurrentPageIndex ?? 0;
  //   const raw = this.stepPagedRows?.[pageIndex] || [];
  //   const page = JSON.parse(JSON.stringify(raw)); 

  //   // 📝 collect BEFORE snapshot (textareas + dates)
  //   const before = [];
  //   raw.forEach((row, rIdx) =>
  //     (row.cells || []).forEach((cell, cIdx) => {
  //       if (cell?.isTextArea || cell?.isDateField) {
  //         before.push({
  //           id: String(cell.id),
  //           type: cell.isTextArea ? "textarea" : "date",
  //           rIdx,
  //           cIdx,
  //           value: cell.field?.value ?? ""
  //         });
  //       }
  //     })
  //   );
  //   console.group(`📄 updateStepVisibleRows(page=${pageIndex})`);
  //   console.log("🧾 BEFORE (textarea/date):", before);

  //   // build render model (unchanged) + add page-scoped key
  //   this.tableRows = page.map((row) => ({
  //     ...row,
  //     cells: (row.cells || []).map((cell) => ({
  //       ...cell,
  //       domKey: `${cell.id}@p${pageIndex}`,
  //       isVisible:
  //         !(
  //           cell.field?.dataType === "Blank" &&
  //           cell.field?.label?.toLowerCase().trim() === "page break"
  //         ) && cell.style !== "display: none;",
  //       hasContent: !!(cell.field?.label || cell.field?.value)
  //     }))
  //   }));

  //   // 📝 collect AFTER snapshot (textareas + dates)
  //   const after = [];
  //   this.tableRows.forEach((row, rIdx) =>
  //     (row.cells || []).forEach((cell, cIdx) => {
  //       if (cell?.isTextArea || cell?.isDateField) {
  //         after.push({
  //           id: String(cell.id),
  //           type: cell.isTextArea ? "textarea" : "date",
  //           domKey: cell.domKey,
  //           rIdx,
  //           cIdx,
  //           value: cell.field?.value ?? ""
  //         });
  //       }
  //     })
  //   );
  //   console.log("🧾 AFTER (textarea/date):", after);

  //   // 🔁 diffs
  //   const beforeMap = Object.fromEntries(before.map((x) => [x.id, x.value]));
  //   const diffs = after
  //     .filter((x) => beforeMap[x.id] !== x.value)
  //     .map((x) => ({
  //       id: x.id,
  //       type: x.type,
  //       from: beforeMap[x.id],
  //       to: x.value,
  //       domKey: x.domKey
  //     }));
  //   if (diffs.length) console.warn("🔁 Diff (paged→render):", diffs);
  //   else console.log("✅ No diffs (paged→render).");

  //   console.groupEnd();
  // }



// updateStepVisibleRows() {
//   const pageIndex = this.stepCurrentPageIndex ?? 0;
//   const raw = this.stepPagedRows?.[pageIndex] || [];
//   const page = JSON.parse(JSON.stringify(raw)); 

//   console.group(`📄 updateStepVisibleRows(page=${pageIndex})`);
//   console.log("📦 Raw page data:", JSON.parse(JSON.stringify(raw)));

//   // 📝 collect BEFORE snapshot (textareas + dates)
//   const before = [];
//   raw.forEach((row, rIdx) =>
//     (row.cells || []).forEach((cell, cIdx) => {
//       if (cell?.isTextArea || cell?.isDateField) {
//         before.push({
//           id: String(cell.id),
//           type: cell.isTextArea ? "textarea" : "date",
//           rIdx,
//           cIdx,
//           value: cell.field?.value ?? ""
//         });
//       }
//     })
//   );
//   console.log("🧾 BEFORE (textarea/date):", before);

//   // build render model
//   this.tableRows = page.map((row) => ({
//     ...row,
//     cells: (row.cells || []).map((cell) => {

//   /* ⭐ FIX: ensure upload meta exists */
//   if (cell?.field?.dataType === "Upload File") {

//     if (!cell.field.meta) {
//       cell.field.meta = { uploadedFiles: [] };
//     }

//   }

//   return {
//     ...cell,
//     domKey: `${cell.id}@p${pageIndex}`,
//     isVisible:
//       !(
//         cell.field?.dataType === "Blank" &&
//         cell.field?.label?.toLowerCase().trim() === "page break"
//       ) && cell.style !== "display: none;",
//     hasContent: !!(cell.field?.label || cell.field?.value)
//   };

// })
//   }));

// /* ===========================
//    ⭐ TABLE BLOCK RENDER MODEL
// =========================== */

// this.tableRows.forEach((row, rIdx) => {

//   (row.cells || []).forEach((cell, cIdx) => {

//    if (cell?.field?.dataType === "Table Block") {

//   console.group("🟦 Table Block Found");
//   console.log("📍 Cell ID:", cell.id);
//   console.log("📍 Row Index:", rIdx, "Col Index:", cIdx);

//   let updatedTableConfig = cell.field.tableConfig;

//   /* Only build if UI model does not exist */
//   if (!updatedTableConfig?.renderRows) {
//     updatedTableConfig = this.buildTableBlockRenderModel(cell);
//   }

//   /* ensure upload meta */
//   (updatedTableConfig?.renderRows || []).forEach(r => {
//     (r.renderCells || []).forEach(c => {
//       if (c?.field?.dataType === "Upload File") {
//         if (!c.field.meta) {
//           c.field.meta = { uploadedFiles: [] };
//         }
//       }
//     });
//   });

//   cell.field = {
//     ...cell.field,
//     tableConfig: updatedTableConfig
//   };

//   console.log(
//     "✅ Generated renderRows:",
//     JSON.parse(JSON.stringify(updatedTableConfig.renderRows))
//   );

//   console.groupEnd();
// }

//   });

// });


//   // 📝 collect AFTER snapshot (textareas + dates)
//   const after = [];
//   this.tableRows.forEach((row, rIdx) =>
//     (row.cells || []).forEach((cell, cIdx) => {
//       if (cell?.isTextArea || cell?.isDateField) {
//         after.push({
//           id: String(cell.id),
//           type: cell.isTextArea ? "textarea" : "date",
//           domKey: cell.domKey,
//           rIdx,
//           cIdx,
//           value: cell.field?.value ?? ""
//         });
//       }
//     })
//   );

//   console.log("🧾 AFTER (textarea/date):", after);

//   const beforeMap = Object.fromEntries(before.map((x) => [x.id, x.value]));
//   const diffs = after
//     .filter((x) => beforeMap[x.id] !== x.value)
//     .map((x) => ({
//       id: x.id,
//       type: x.type,
//       from: beforeMap[x.id],
//       to: x.value,
//       domKey: x.domKey
//     }));

//   if (diffs.length) console.warn("🔁 Diff (paged→render):", diffs);
//   else console.log("✅ No diffs (paged→render).");

//   console.groupEnd();
// }

updateStepVisibleRows() {

  const pageIndex = this.stepCurrentPageIndex ?? 0;
  const raw = this.stepPagedRows?.[pageIndex] || [];

  console.group(`📄 updateStepVisibleRows(page=${pageIndex})`);

  /* ================= GLOBAL STATE LOG ================= */

  console.log("📦 stepPagedRows length:", this.stepPagedRows?.length);
  console.log("📄 current page rows:", raw?.length);

  if (!Array.isArray(raw)) {
    console.error("❌ Invalid page data", raw);
    console.groupEnd();
    return;
  }

  this.tableRows = raw.map((row, rIdx) => {

    return {
      ...row,

      cells: (row.cells || []).map((cell, cIdx) => {

        /* ================= TABLE BLOCK ================= */

if (cell?.field?.dataType === "Table Block") {

  console.group(`🟦 TABLE BLOCK [row:${rIdx}, col:${cIdx}]`);

  let tableConfig = cell.field?.tableConfig || {};

  tableConfig = {
    showTableName: false,
    tableName: "",
    columns: [],
    rowNames: [],
    innerCells: [],
    renderRows: [],
    ...tableConfig
  };

  console.log("📍 Cell ID:", cell.id);
  console.log("📦 innerCells:", tableConfig.innerCells.length);

  /* 🔥 REBUILD FROM SOURCE */
  const rebuiltConfig = this.buildTableBlockRenderModel({
    ...cell,
    field: {
      ...cell.field,
      tableConfig
    }
  });

  const renderRows = rebuiltConfig.renderRows || [];

  console.log("✅ renderRows REBUILT:", renderRows.length);

  console.groupEnd();

  return {
    ...cell,

    field: {
      ...cell.field,
      tableConfig: {
        ...rebuiltConfig   // ✅ ALWAYS USE REBUILT
      }
    },

    /* 🔥 USE REBUILT CONFIG EVERYWHERE */
    safeTableName: rebuiltConfig.tableName || "",
    safeColumns: rebuiltConfig.columns || [],
    safeRenderRows: renderRows,

    hasTableConfig: true,
    hasHeaderSafe: !!rebuiltConfig.hasHeader,
    showTableNameSafe: !!rebuiltConfig.showTableName,
    hasRowsSafe: renderRows.length > 0,

    domKey: cell.id,
    isVisible: true,
    hasContent: true
  };
}

        // /* ================= NORMAL CELL ================= */

        // return {
        //   ...cell,
        //   domKey: cell.id,
        //   isVisible:
        //     !(
        //       cell.field?.dataType === "Blank" &&
        //       cell.field?.label?.toLowerCase().trim() === "page break"
        //     ) &&
        //     cell.style !== "display: none;",
        //   hasContent: !!(cell.field?.label || cell.field?.value)
        // };

        /* ================= NORMAL CELL ================= */

        if (cell.isDropdownField && !cell.isMultiSelect) {

          const selectedValue = cell.field?.value;

          const updatedOptions = (cell.field?.options || []).map(opt => ({
            ...opt,
            isSelected: opt.value === selectedValue
          }));

          return {
            ...cell,

            field: {
              ...cell.field,
              options: updatedOptions
            },

            domKey: cell.id,

            isVisible:
              !(
                cell.field?.dataType === "Blank" &&
                cell.field?.label?.toLowerCase().trim() === "page break"
              ) &&
              cell.style !== "display: none;",

            hasContent: !!(cell.field?.label || cell.field?.value)
          };
        }

        /* ===== DEFAULT NORMAL CELL ===== */

        return {
          ...cell,
          domKey: cell.id,

          isVisible:
            !(
              cell.field?.dataType === "Blank" &&
              cell.field?.label?.toLowerCase().trim() === "page break"
            ) &&
            cell.style !== "display: none;",

          hasContent: !!(cell.field?.label || cell.field?.value)
        };

      })
    };

  });

  /* ================= FINAL UI STATE ================= */

  this.tableRows = [...this.tableRows];

  console.log("✅ Visible rows:", this.tableRows.length);

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

  goToNextStepPage() {
    if (!this.isLastStepPage) {
      this.persistVisiblePage(); // <-- save edits first
      this.stepCurrentPageIndex++;
      this.updateStepVisibleRows(); // then render the new page
      this.reinitializeRichEditors();
    }
  }

  goToPreviousStepPage() {
    if (!this.isFirstStepPage) {
      this.persistVisiblePage(); // <-- save edits first
      this.stepCurrentPageIndex--;
      this.updateStepVisibleRows(); // then render the new page
      this.reinitializeRichEditors();
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

  reinitializeRichEditors() {
  setTimeout(() => {
    this.renderRichTextFields();
    this.initializeQuillEditors();
  }, 0);
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



prepareViewTable(formJson) {

  console.log("📋 prepareViewTable() called");

  let tableData = [];
  let currentPage = 1;

  formJson.forEach((row, rowIndex) => {

    // Detect page break
    const isPageBreak = row.cells.some(
      (cell) =>
        cell.field?.dataType === "Blank" &&
        cell.field?.label?.toLowerCase().trim() === "page break"
    );

    // If page break → increase page count but do NOT render row
    if (isPageBreak) {
      currentPage++;
      return;
    }

    const processedRow = {
      id: row.id,
      belongsToPage: currentPage,
      isVisible: false,
      cells: []
    };

    row.cells.forEach((cell, colIndex) => {

      // Preserve empty cells to maintain grid alignment
      if (!cell?.field) {

        processedRow.cells.push({
          id: cell.id || `empty-${rowIndex}-${colIndex}`,
          isEmpty: true,
          colspan: cell.colspan || 1,
          rowspan: cell.rowspan || 1,
          gridStyle: `grid-column: span ${cell.colspan || 1}; grid-row: span ${cell.rowspan || 1};`
        });

        return;
      }

      // =========================
      // SECTION HEADER
      // =========================
      if (this.viewIsHeaderCell(cell)) {

        const title = this.viewNormalizeHeaderTitle(cell);

        if (title) {

          processedRow.cells.push({
            id: cell.id,
            isSectionHeader: true,
            title,
            headerStyle: cell.headerStyle || cell.field?.inlineStyle || "",
            colspan: cell.colspan || 12,
            rowspan: cell.rowspan || 1
          });

        }

        return;
      }

      // Skip invalid labels
      if (!(cell.field.label || "").trim()) return;

      const dataType = cell.field.dataType;

      // =========================
      // 🔥 VALUE NORMALIZATION (RICH TEXT DISPLAY FIX)
      // =========================
      let normalizedValue = cell.field.value;

      // ✅ FIX: Rich Text Display uses richTextContent
      if (
        cell.field?.isRichTextDisplay === true &&
        cell.field?.richTextContent
      ) {
        normalizedValue = cell.field.richTextContent;
      }

      const isUploadFile =
        dataType === "upload file" || cell.field?.isUpload === true;

      const isRichText =
        dataType === "Rich Text" ||
        cell.field?.isRichTextDisplay === true ||
        cell.field?.selectedTextFieldOption === "richText";

      const isRadioButton = dataType === "Radio Button";

      const isCheckbox = dataType === "Checkbox Field";

      const isSignature =
        dataType === "Signature" ||
        cell.field?.isSignature === true;

      const isTableBlock =
        dataType === "Table Block" ||
        cell.field?.isTableBlock === true;

      const toArrayFn =
        typeof toArray === "function"
          ? toArray
          : this.viewToArray.bind(this);

      const isImageUrlFn =
        typeof isImageUrl === "function"
          ? isImageUrl
          : this.viewIsImageUrl.bind(this);

      const urlsArr = toArrayFn(cell.field.value);
      const downloadArr = toArrayFn(cell.field.downloadLink);

      const files = urlsArr.map((url, i) => {

        const downloadUrl = downloadArr[i] || url;

        return {
          key: `${cell.id}-${i}`,
          url,
          downloadUrl,
          isImage: isImageUrlFn(url)
        };

      });

      const previewUrl = files[0]?.url || null;
      const downloadUrl = files[0]?.downloadUrl || previewUrl;
      const isImage = files[0]?.isImage || false;

      // =========================
      // TABLE BLOCK SUPPORT
      // =========================
      if (isTableBlock) {

        console.log("🧱 [TABLE BLOCK] Processing table block:", cell);

        const tableConfig = cell.field?.tableConfig || {};

        // 🔥 CRITICAL FIX: use innerCells (SOURCE OF TRUTH)
        const matrix = tableConfig.innerCells || [];

        const headers = tableConfig.columns || [];
        const rowNames = tableConfig.rowNames || [];

        const hasRowLabel =
          headers.length > 0 && headers[0]?.isRowLabel === true;

        const tableClass = hasRowLabel
          ? "view-table-block has-row-label"
          : "view-table-block";

        const rows = matrix.map((rowObj, rIndex) => {

          const rowCells = rowObj?.cells || [];

          console.log(`➡️ [ROW ${rIndex}] innerCells:`, JSON.stringify(rowCells));

          

          return {

            key: `row-${rIndex}`,

            rowLabel: rowNames[rIndex]?.value || "",

            cells: headers.map((col, cIndex) => {

              console.log(`   🔹 [CELL ${rIndex}-${cIndex}] column config:`, col);

              // =========================
              // 🟢 ROW LABEL
              // =========================
              if (col.isRowLabel) {
                return {
                  key: `${rIndex}-label`,
                  isRowLabel: true,
                  isRegularField: true,
                  cellClass: "row-label",
                  value: rowNames[rIndex]?.value || ""
                };
              }

      // =========================
      // 🔥 COLUMN-BASED LOOKUP (FIX)
      // =========================
      let actualColIndex = col.key;

      if (hasRowLabel) {
        actualColIndex = col.key - 1;
      }

      if (col.isRowLabel) {
        actualColIndex = null;
      }

      const rawCell =
        actualColIndex !== null
          ? rowCells.find(c => c.col === actualColIndex)
          : null;

      console.log("   🟡 matched rawCell:", JSON.stringify(rawCell));

      const field = rawCell?.field || {};

      // 🔥 VALUE NORMALIZATION (CRITICAL FIX)
      let rawValue = field.value;

      // =========================
      // 📅 DATE FORMAT FIX
      // =========================
      if (
        field.dataType === "Date Field" &&
        rawValue
      ) {
        try {
          const d = new Date(rawValue);

          if (!isNaN(d)) {
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();

            rawValue = `${day}/${month}/${year}`;
          }
        } catch (e) {
          console.warn("⚠️ Date parse failed:", rawValue);
        }
      }

      // ✅ HANDLE RICH TEXT DISPLAY MODE
      if (
        field.isRichTextDisplay === true &&
        field.richTextContent
      ) {
        rawValue = field.richTextContent;
      }

      // =========================
      // 🟣 HEADER DETECTION
      // =========================
      const isHeader =
        field.isHeader === true ||
        field.dataType === "Header" ||
        field.dataType === "header" ||
        field.type === "header";

      if (isHeader) {

        console.log("   ✅ HEADER DETECTED:", field);

        return {
          key: `${rIndex}-${cIndex}`,
          isSectionHeader: true,
          title: field.text || field.label || "",
          headerStyle: field.inlineStyle || "",
          isRowLabel: false
        };
      }

      // =========================
      // 🧠 TYPE DETECTION
      // =========================
      const isCheckbox = field.isCheckbox === true;

      const isUploadFile = field.isUpload === true;

      const isRichText =
        field.isRichTextInput === true ||
        field.selectedTextFieldOption === "richText" ||
        field.isRichTextDisplay === true; // 🔥 FIX

      const isSignature = field.isSignature === true;

      const isRadioButton = field.isRadio === true;

      console.log("   🧠 TYPE FLAGS:", {
        isCheckbox,
        isUploadFile,
        isRichText,
        isSignature,
        isRadioButton
      });

      // =========================
      // 📁 FILE HANDLING
      // =========================
      const fileUrls =
        field.urls ||
        field.downloadLink ||
        (Array.isArray(rawValue) ? rawValue : []);

      const files = (Array.isArray(fileUrls) ? fileUrls : []).map((url, i) => ({
        key: `${rIndex}-${cIndex}-${i}`,
        url,
        downloadUrl: url,
        isImage: true
      }));

      // =========================
      // 🔴 VALUE DISPLAY (FIXED)
      // =========================
      let displayValue = rawValue ?? "";

      // 🔥 PREDEFINED DROPDOWN FIX
      if (
        field.isDropdown === true &&
        field.selectedDropdownOption === "predefinedList"
      ) {
        displayValue =
          field.displayValue ||
          rawValue ||
          "";
      }

      // 🔴 RADIO DISPLAY
      if (isRadioButton && typeof rawValue === "object") {
        displayValue = rawValue.subValue
          ? `${rawValue.selectedOption} - ${rawValue.subValue}`
          : rawValue.selectedOption;
      }

      // =========================
      // 🟣 RICH TEXT
      // =========================
      const richTextHtml = isRichText
        ? `<div class="ql-editor">${rawValue || ""}</div>`
        : null;

      return {
        key: `${rIndex}-${cIndex}`,

        cellClass: "",

        isRowLabel: false,

        value: displayValue,

        isCheckbox,
        checkboxIcon: isCheckbox
          ? rawValue
            ? "✔" 
            : "✖"
          : null,

        isUploadFile,
        files,

        isRichText,
        richTextHtml,

        isSignature,
        isRadioButton,

        isRegularField:
          !isCheckbox &&
          !isUploadFile &&
          !isRichText &&
          !isSignature &&
          !isRadioButton
      };

            })

          };

        });

        console.log("✅ [TABLE BLOCK] Final rows:", JSON.stringify(rows, null, 2));

        processedRow.cells.push({

          id: cell.id,
          label: cell.field.label,

          isTableBlock: true,
            hasTableConfig: true,
        hasHeaderSafe: headers && headers.length > 0,
        hasRowsSafe: rows && rows.length > 0,
        hasHeader: tableConfig.hasHeader,
        headers: headers,

        // 🔥 REQUIRED DATA FOR TEMPLATE
        safeColumns: headers,
        safeRenderRows: rows,
          headers,
          rows,

          hasRowLabel,
          tableClass,

          colspan: cell.colspan || 12,
          rowspan: cell.rowspan || 1,

          gridStyle: `grid-column: span ${cell.colspan || 12}; grid-row: span ${cell.rowspan || 1};`

        });

        return;
      }

      // =========================
      // NORMAL FIELD
      // =========================

      processedRow.cells.push({

        id: cell.id,

        label: cell.field.label,

       value: isRichText
        ? normalizedValue
        : isSignature
        ? normalizedValue
        : this.getFormattedValue({
            ...cell,
            field: { ...cell.field, value: normalizedValue }
          }),

      richTextHtml: isRichText
        ? `<div class="ql-editor">${normalizedValue || ""}</div>`
        : null,

        colspan: cell.colspan || 1,
        rowspan: cell.rowspan || 1,

        gridStyle: `grid-column: span ${cell.colspan || 1}; grid-row: span ${cell.rowspan || 1};`,

        isCheckbox:
          cell.isCheckboxField ||
          cell.field?.dataType === "Checkbox Field",

        isUploadFile,
        files,

        isSignature,

        uploadUrl: previewUrl,
        isImageFile: isImage,

        downloadUrl,
        finalDownloadUrl: downloadUrl || previewUrl,

        isRichText,
        isRadioButton,

        isRegularField:
          !isUploadFile &&
          !isCheckbox &&
          !isRichText &&
          !isRadioButton &&
          !isSignature
      });

    });

    if (processedRow.cells.length > 0) {
      tableData.push(processedRow);
    }

  });

  // Set pagination info
  this.totalViewPages = currentPage;
  this.currentViewPage = 1;

  // Set visible rows for first page
  tableData.forEach(row => {
    row.isVisible = row.belongsToPage === this.currentViewPage;
  });

  console.log("✅ Final viewTableData:", JSON.stringify(tableData, null, 2));

  this.viewTableData = [...tableData];

  setTimeout(() => {
    this.renderRichText();
  }, 0);
}

renderRichText() {

    console.log("🟢 renderRichText() called");

    if (!this.viewTableData) {
        console.warn("⚠️ viewTableData is empty or undefined");
        return;
    }

    const renderCell = (cell) => {

        if (!cell) return;

        // =========================
        // 🟣 RICH TEXT (MAIN + TABLE)
        // =========================
        if (cell.isRichText && cell.value) {

            const selector = `[data-id="${cell.id || cell.key}"]`;
            console.log("🔍 Looking for container:", selector);

            const container = this.template.querySelector(selector);

            if (!container) {
                console.warn("⚠️ Container NOT found for:", cell.id || cell.key);
                return;
            }

            if (container.dataset.rendered) {
                return;
            }

            container.innerHTML =
                `<div class="ql-editor">${cell.value}</div>`;

            container.dataset.rendered = "true";

            console.log("✅ Rich text rendered:", cell.id || cell.key);
        }

        // =========================
        // 🧱 TABLE BLOCK (RECURSION)
        // =========================
        if (cell.isTableBlock && cell.rows) {

            cell.rows.forEach((r, rIndex) => {

                r.cells.forEach((c, cIndex) => {

                    console.log(`🔁 Table cell [${rIndex}][${cIndex}]`, c);

                    renderCell(c); // 🔥 recursion

                });

            });

        }
    };

    // =========================
    // 🔁 MAIN LOOP
    // =========================
    this.viewTableData.forEach((row, rowIndex) => {

        if (!row.cells) return;

        row.cells.forEach((cell, cellIndex) => {

            console.log(`➡️ Processing row ${rowIndex}, cell ${cellIndex}`);

            renderCell(cell);

        });

    });

    console.log("🏁 renderRichText() completed");

}
  
goToNextViewPage() {

  if (this.currentViewPage >= this.totalViewPages) return;

  this.currentViewPage++;
  this.updateVisibleRows();

}

goToPreviousViewPage() {

  if (this.currentViewPage <= 1) return;

  this.currentViewPage--;
  this.updateVisibleRows();

}

updateVisibleRows() {

  console.log("🔄 updateVisibleRows triggered for page:", this.currentViewPage);

  // 🔁 Update visibility
  this.viewTableData = this.viewTableData.map(row => {

    const isVisible = row.belongsToPage === this.currentViewPage;

    return {
      ...row,
      isVisible
    };

  });

  console.log("✅ Visible rows updated");

  // =========================
  // 🔥 CRITICAL: Re-render rich text AFTER DOM update
  // =========================
  requestAnimationFrame(() => {

    console.log("🎯 Running renderRichText after DOM update");

    this.renderRichText();

  });

}
  
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
    // if (cell.isCheckboxField || cell.field?.dataType === "Checkbox Field") {
    //   return cell.field.value === true || cell.field.value === "true"
    //     ? "action:approval"
    //     : "action:close";
    // }
    if (cell.isCheckboxField || cell.field?.dataType === "Checkbox Field") {
      return cell.field.value === true || cell.field.value === "true"
        ? "✔"   // checked
        : "✖";  // unchecked
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

  const fieldValue = cell.field?.value;

  // 🔥 NEW STRUCTURE SUPPORT (MAIN FIX)
  if (fieldValue && typeof fieldValue === "object") {

    const selectedOption = fieldValue.selectedOption || "";
    const subLabel = fieldValue.subLabel || "";

    return subLabel
      ? `${selectedOption} - ${subLabel}`   // ✅ LABEL used
      : selectedOption || "—";
  }

  // 🔁 FALLBACK (OLD DATA SUPPORT)
  const selectedOption =
    cell.selectedRadioOption || fieldValue || "";

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
  const cellId = String(event.target.dataset.id);
  const optionValue = event.target.dataset.value;

  const applyRemove = (cell) => {

    const updatedOptions = (cell.field?.options || []).map(option => ({
      ...option,
      isSelected:
        option.label === optionValue ? false : option.isSelected
    }));

    const selectedValues = updatedOptions
      .filter(option => option.isSelected)
      .map(option => option.label)
      .join(", ");

    return {
      ...cell,
      selectedValues,
      field: {
        ...cell.field,
        options: updatedOptions,
        value: selectedValues
      }
    };
  };

  const syncTableBlock = (config) => {

    /* STEP 1: update renderRows */
    (config.renderRows || []).forEach(r => {
      (r.renderCells || []).forEach(c => {
        if (String(c.id) === cellId) {
          Object.assign(c, applyRemove(c));
        }
      });
    });

    /* STEP 2: renderRows → innerCells */
    const flatRender = config.renderRows.flatMap(r => r.renderCells || []);

    (config.innerCells || []).forEach(r => {
      (r.cells || []).forEach(c => {

        const match = flatRender.find(
          rc => String(rc.id) === String(c.id)
        );

        if (match) {
          Object.assign(c, {
            ...match,
            field: { ...match.field }
          });
        }

      });
    });

    /* STEP 3: innerCells → renderRows */
    const flatInner = config.innerCells.flatMap(r => r.cells || []);

    (config.renderRows || []).forEach(r => {
      (r.renderCells || []).forEach(rc => {

        const match = flatInner.find(
          ic => String(ic.id) === String(rc.id)
        );

        if (match) {
          Object.assign(rc, {
            ...match,
            field: { ...match.field }
          });
        }

      });
    });
  };

  const updateRow = (row) => {
    if (!row?.cells) return row;

    return {
      ...row,
      cells: row.cells.map(cell => {

        /* ================= MAIN GRID ================= */
        if (String(cell.id) === cellId) {
          Object.assign(cell, applyRemove(cell));
          return cell;
        }

        /* ================= TABLE BLOCK ================= */
        if (cell?.isTableBlock && cell?.field?.tableConfig) {

          syncTableBlock(cell.field.tableConfig);
          return cell;
        }

        return cell;
      })
    };
  };

  /* 🔥 UPDATE BOTH STATE LAYERS */

  this.tableRows = this.tableRows.map(updateRow);

  this.stepPagedRows = JSON.parse(
    JSON.stringify(this.stepPagedRows.map(page => page.map(updateRow)))
  );
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
    this.rehydrateTableBlockMultiSelect();
    this.reinitializeRichEditors();

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

    this.viewTableData = this.buildViewTableDataFromSubmitRows(
  this.stepPagedRows.flat()
);


    // ============================================
    // ✅ UI state
    // ============================================
    this.isFormSelected = true;
    this.isViewModeON = false;
    this.showPublishedForms = false;

    setTimeout(() => {
      this.initializeQuillEditors();
    }, 0);

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
  // SIGNATURE ⭐ NEW (CRITICAL)
  // =====================================================
  let isSignature =
    cell.field?.dataType === "Signature" ||
    cell.field?.isSignature === true;

  if (isSignature) {
    console.log("✍️ EDIT signature detected:", {
      cellId: cell.id,
      valuePreview: (cell.field?.value || "").substring(0, 30)
    });

    // 🔥 IMPORTANT: normalize value for LWC reactivity
    if (cell.field?.value) {
      cell.field.value = String(cell.field.value);
    }
  }


  // =====================================================
  // RADIO VALUE SPLIT (CRITICAL)
  // =====================================================
 let selectedRadioOption = "";
let subInputValue = "";

const valueObj = cell.field?.value;

if (valueObj && typeof valueObj === "object") {
  selectedRadioOption = valueObj.selectedOption || "";
  subInputValue = valueObj.subValue || "";
} else if (typeof valueObj === "string") {
  // 🔁 backward compatibility (old data)
  const parts = valueObj.split(" - ");
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
// RADIO 🔥 FULL RESTORE (FINAL FIXED)
// =====================================================
if (cell.field?.dataType === "Radio Button") {
  isRadioButton = true;

  cell.radioOptionsProcessed = (cell.field.radioOptions || []).map(opt => {

    const isSelected =
      String(selectedRadioOption) === String(opt.optionLabel);

    let processedSubOptions = [];

    // =====================================================
    // 🔥 PREDEFINED OPTIONS (FIXED)
    // =====================================================
    if (opt.usePredefinedOptions) {

      const predefined = (opt.selectedPredefined || "").toLowerCase();

      let source = [];

      if (predefined === "staff") {
        source = this.staffOptions || [];
      }

      if (predefined === "participant") {
        source = (this.participants || []).map(p => ({
          label: p.Name,
          value: p.Id
        }));
      }

      if (predefined === "facility") {
        source = this.facilityOptions || [];
      }

      processedSubOptions = source.map(o => ({
        label: o.label,
        value: o.value ?? o.label,

        // ✅ FIX: match both label & value
        isSelected:
          String(subInputValue) === String(o.value) ||
          String(subInputValue) === String(o.label)
      }));
    }

    // =====================================================
    // 🔥 MANUAL OPTIONS (TEXT / DROPDOWN / RADIO)
    // =====================================================
    else {

      processedSubOptions = (opt.values || []).map(v => ({
        label: v,
        value: v,

        isSelected:
          String(subInputValue) === String(v)
      }));

    }

    return {
      ...opt,
      isSelected,
      processedSubOptions,

      // UI flags
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
// TABLE BLOCK ⭐ FINAL FIX (FULL SUPPORT)
// =====================================================

let isTableBlock = cell.field?.dataType === "Table Block";

if (isTableBlock) {

  const tableConfig = JSON.parse(
    JSON.stringify(cell.field?.tableConfig || {})
  );

  const columns = tableConfig.columns || [];
  const rowNames = tableConfig.rowNames || [];
  const innerCells = tableConfig.innerCells || [];

  console.group("📊 TABLE BLOCK EDIT RESTORE");
  console.log("Rows:", innerCells.length);
  console.log("Columns:", columns.length);

  tableConfig.renderRows = innerCells.map((innerRow, rIndex) => {

    console.group(`➡️ Row ${rIndex}`);

    let innerIndex = 0; // 🔥 CRITICAL FIX

    return {
      key: `row-${rIndex}`,
      value: rowNames?.[rIndex]?.value || "",

      // 🔥 FIXED: iterate columns, NOT innerRow.cells
      renderCells: columns.map((col, cIndex) => {

        let innerCell;

        // =====================================================
        // ✅ HANDLE ROW LABEL COLUMN (DYNAMIC)
        // =====================================================
        if (col?.isRowLabel) {

          innerCell = {
            id: `rowlabel-${rIndex}`,
            isRowLabel: true,
            field: {
              value: rowNames?.[rIndex]?.value || ""
            }
          };

          console.log("🏷️ ROW LABEL CELL:", innerCell.field.value);

        } else {

          // =====================================================
          // 🔥 SAFE INNER CELL ACCESS
          // =====================================================
          innerCell = innerRow.cells?.[innerIndex];

          if (!innerCell) {

            console.warn("⚠️ Missing innerCell FIXED:", {
              rIndex,
              cIndex,
              innerIndex
            });

            innerCell = {
              id: `inner-${rIndex}-${innerIndex}`,
              field: {
                value: "",
                options: []
              }
            };

            if (!innerRow.cells) innerRow.cells = [];
            innerRow.cells[innerIndex] = innerCell;
          }

          // =====================================================
          // 🔥 ENSURE STABLE ID
          // =====================================================
          if (!innerCell.id) {
            innerCell.id = `inner-${rIndex}-${innerIndex}`;
          }

          console.group(`🔹 Cell [${rIndex}-${cIndex}] → ${innerCell.id}`);

          // ===============================
          // 🔍 BEFORE NORMALIZATION
          // ===============================
          console.log("📥 BEFORE:", {
            id: innerCell.id,
            type: innerCell.field?.dataType,
            rawValue: innerCell.field?.value,
            options: innerCell.field?.options,
            radioOptions: innerCell.field?.radioOptions
          });

        // ===============================
// 🔥 RADIO FIX (FINAL)
// ===============================
if (innerCell.field?.dataType === "Radio Button") {

  const rawValue = innerCell.field?.value;

  let selectedRadioOption = "";
  let subInputValue = "";

  // =====================================================
  // ✅ HANDLE STRUCTURED VALUE (NEW)
  // =====================================================
  if (rawValue && typeof rawValue === "object") {
    selectedRadioOption = rawValue.selectedOption || "";
    subInputValue = rawValue.subValue || "";
  }

  // =====================================================
  // 🔁 FALLBACK: OLD STRING FORMAT (BACKWARD COMPAT)
  // =====================================================
  else if (typeof rawValue === "string" && rawValue) {
    const parts = rawValue.split(" - ");
    selectedRadioOption = parts[0] || "";
    subInputValue = parts[1] || "";
  }

  innerCell.selectedRadioOption = selectedRadioOption;
  innerCell.subInputValue = subInputValue;

  // =====================================================
  // 🔥 PROCESS OPTIONS
  // =====================================================
  innerCell.radioOptionsProcessed = (innerCell.field.radioOptions || []).map(opt => {

    const isSelected =
      String(selectedRadioOption) === String(opt.optionLabel);

    let processedSubOptions = [];

    // =====================================================
    // 🔥 PREDEFINED OPTIONS
    // =====================================================
    if (opt.usePredefinedOptions) {

      const type = (opt.selectedPredefined || "").toLowerCase();

      let source = [];

      if (type === "staff") {
        source = this.staffOptions || [];
      }

      if (type === "participant") {
        source = (this.participants || []).map(p => ({
          label: p.Name,
          value: p.Id
        }));
      }

      if (type === "facility") {
        source = this.facilityOptions || [];
      }

      processedSubOptions = source.map(o => ({
        label: o.label,
        value: o.value ?? o.label,
        isSelected:
          String(subInputValue) === String(o.value) ||
          String(subInputValue) === String(o.label)
      }));

    }

    // =====================================================
    // 🔥 MANUAL OPTIONS (TEXT / DROPDOWN / RADIO)
    // =====================================================
    else {

      processedSubOptions = (opt.values || []).map(v => ({
        label: v,
        value: v,
        isSelected:
          String(subInputValue) === String(v)
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
}

          // ===============================
          // 🔥 MULTI SELECT FIX
          // ===============================
          if (
            innerCell.field?.dataType === "Dropdown Field" &&
            innerCell.field?.selectedDropdownOption === "multiSelect"
          ) {

            const selectedArray = innerCell.field.value
              ? innerCell.field.value.split(", ").map(v => v.trim())
              : [];

            innerCell.selectedOptionsArray = selectedArray;

            innerCell.field.options = (innerCell.field.options || []).map(opt => ({
              ...opt,
              isSelected: selectedArray.includes(opt.label)
            }));
          }

          // ===============================
          // 🔥 BUILD CELL
          // ===============================
          const rebuiltCell = this.buildCellRuntimeModel(
            innerCell,
            rIndex,
            cIndex
          );

          console.groupEnd();

          // 🔥 MOVE POINTER ONLY FOR REAL CELLS
          innerIndex++;

          return {
            ...rebuiltCell,
            key: `${rIndex}-${cIndex}`,
            isInnerCell: true
          };
        }

        // =====================================================
        // 🔥 BUILD ROW LABEL CELL
        // =====================================================
        const rebuiltCell = this.buildCellRuntimeModel(
          innerCell,
          rIndex,
          cIndex
        );

        return {
          ...rebuiltCell,
          key: `${rIndex}-${cIndex}`,
          isInnerCell: true
        };

      })

    };

  });

  cell.field.tableConfig = tableConfig;

  console.groupEnd();
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
    isSignature,
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

    isTableBlock,
    tableConfig: cell.field?.tableConfig || {},

    field: {
      ...cell.field,
      value: cell.field?.value || "",
      options
    },

    hasContent: !!(
      isHeader ||
      cell.field?.label ||
      isSignature || 
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
        this.loadStaffResponses(); // Refresh responses after deletion
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

  const target = event?.target;
  const cellId = String(target?.dataset?.id || "");
  if (!cellId) return;

  const inputType = String(target?.type || "").toLowerCase();

  const isRichText =
    target?.tagName?.toUpperCase() === "LIGHTNING-INPUT-RICH-TEXT" ||
    target?.classList?.contains("rich-text-editor");

  /* ================= DERIVE VALUE ================= */

  let newValue = "";

  if (inputType === "checkbox") {
    newValue = !!target.checked;
  }
  else if (isRichText) {

    const raw = event?.detail?.value ?? "";

    let cleaned = raw
      .replace(/<img\b[^>]*>/gi, "")
      .replace(/url\(["']?data:image\/[^"')]+["']?\)/gi, "");

    newValue = cleaned;

    if (cleaned !== raw) {
      const rte = this.template.querySelector(
        `.rich-text-editor[data-id="${cellId}"]`
      );
      if (rte) rte.value = cleaned;
    }
  }
  else {
    newValue = target.value ?? "";
  }

  /* ================= DATE NORMALIZATION ================= */

  if (!isRichText && inputType === "date" && newValue) {

    if (!(newValue instanceof Date) && !/^\d{4}-\d{2}-\d{2}$/.test(newValue)) {

      const d = new Date(newValue);
      if (!isNaN(d)) {

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        newValue = `${y}-${m}-${day}`;
      }
    }
  }

  /* ================= UPDATE ================= */

  this.updateCellOnCurrentPage(cellId, (cell) => {

    const safeField = cell.field || {};

    const updated = { ...cell };

    if (inputType === "checkbox") {

      updated.field = {
        ...safeField,
        value: newValue
      };
    }

    else if (cell.isDropdownField && !cell.isMultiSelect) {

  let displayValue = newValue;

  // 🔥 PREDEFINED DROPDOWN (REAL FIX)
  if (safeField.selectedDropdownOption === "predefinedList") {

    const type = (safeField.predefinedListType || "").toLowerCase();

    let source = [];

    if (type === "staff") {
      source = this.staffOptions || [];
    }
    else if (type === "participant") {
      source = (this.allparticipants || []).map(p => ({
        label: p.Name,
        value: p.Id
      }));
    }
    else if (type === "facility") {
      source = this.facilityOptions || [];
    }

    const match = source.find(opt => opt.value === newValue);

    displayValue = match?.label || newValue;
  }

  // ✅ NORMAL DROPDOWN (NO CHANGE)
  else {

    const options = safeField.options || [];

    const selectedOption = options.find(o => o.value === newValue);

    displayValue =
      selectedOption?.label ||
      selectedOption?.value ||
      newValue;
  }

  updated.field = {
    ...safeField,
    value: newValue,
    displayValue
  };

  updated.selectedValues = displayValue;
}

    else if (cell.isDropdownField && cell.isMultiSelect) {

      const selected = Array.from(
        event.target.selectedOptions || [],
        o => o.value
      );

      const joined = selected.join(", ");

      updated.field = {
        ...safeField,
        value: joined
      };

      updated.selectedValues = joined;
    }

    else {

      updated.field = {
        ...safeField,
        value: newValue
      };
    }

    return updated;

  });

  console.groupEnd();
}


updateCellOnCurrentPage(cellId, updater) {

  console.group(`🔄 UPDATE → ${cellId}`);

  const pages = this.stepPagedRows || [];

  const updatedPages = pages.map((page) => {

    return page.map((row) => {

      if (!Array.isArray(row?.cells)) return row;

      const cells = row.cells.map((cell) => {

        /* ================= MAIN GRID ================= */

        if (String(cell?.id) === String(cellId)) {

          console.log("🟢 MAIN CELL MATCH:", cellId);

          const updated = updater({
            ...cell,
            field: cell.field || {}
          });

          return {
            ...cell,
            field: {
              ...(cell.field || {}),
              ...(updated.field || {}),
              value: updated?.field?.value ?? ""
            }
          };
        }

        /* ================= TABLE BLOCK ================= */

        if (cell?.field?.dataType === "Table Block") {

  console.group("🟣 TABLE BLOCK UPDATE");

  const tableConfig = cell.field.tableConfig || {};
  const innerCells = tableConfig.innerCells || [];
  const renderRows = tableConfig.renderRows || [];

  let updatedValue = "";
  let found = false;

  /* ================= UPDATE INNER CELLS ================= */

  const newInnerCells = innerCells.map((r) => ({
    ...r,
    cells: (r.cells || []).map(c => {

      if (String(c.id) !== String(cellId)) return c;

      found = true;

      const updated = updater({
        ...c,
        field: c.field || {}
      });

      updatedValue =
        updated?.field?.value ??
        updated?.value ??
        "";

      console.log("🎯 Updating innerCell:", cellId, "→", updatedValue);

      const baseField = c.field || {};
const updatedField = updated.field || {};

const isPredefinedDropdown =
  baseField.isDropdown &&
  baseField.selectedDropdownOption === "predefinedList";

return {
  ...c,
  field: isPredefinedDropdown
    ? {
        // 🔥 ONLY STORE CLEAN DATA
        ...baseField,
        value: updatedField.value ?? "",
        displayValue: updatedField.displayValue ?? ""
      }
    : {
        // ✅ KEEP NORMAL BEHAVIOR
        ...baseField,
        ...updatedField,
        value: updatedField.value ?? updatedValue ?? ""
      }
};

    })
  }));

  if (!found) {
    console.warn("⚠️ Table cell NOT FOUND (SKIPPING):", cellId);
    console.groupEnd();
    return cell; // ✅ safe exit
  }

  console.log("💾 innerCells updated");

  /* ================= 🔥 SYNC RENDER ROWS ================= */

  const flatInner = newInnerCells.flatMap(r => r.cells || []);

  const newRenderRows = renderRows.map(r => ({
    ...r,
    renderCells: (r.renderCells || []).map(rc => {

      const match = flatInner.find(
        ic => String(ic.id) === String(rc.id)
      );

      if (match) {
        console.log("🔁 Sync renderCell:", rc.id, "→", match.field?.value);
        return {
          ...rc,
          field: { ...match.field }
        };
      }

      return rc;
    })
  }));

  console.log("🔄 renderRows synced");

  console.groupEnd();

  /* ================= RETURN UPDATED CELL ================= */

  return {
    ...cell,
    field: {
      ...cell.field,
      tableConfig: {
        ...tableConfig,
        innerCells: newInnerCells,
        renderRows: newRenderRows // 🔥 CRITICAL FIX
      }
    }
  };
}

        return cell;

      });

      return { ...row, cells };

    });

  });

  /* ===== SAVE (CLEAN) ===== */

  this.stepPagedRows = updatedPages.map(page =>
    page.map(row => ({
      ...row,
      cells: row.cells.map(cell => ({ ...cell }))
    }))
  );

  console.log("✅ stepPagedRows updated");

  /* ================= 🔥 FULL RAW DATA LOG ================= */

  console.group("🧾 FULL FORM RAW DATA (stepPagedRows)");

  try {
    const snapshot = JSON.parse(JSON.stringify(this.stepPagedRows));
    console.log(snapshot);

    /* 🔍 OPTIONAL: QUICK FIND FOR CURRENT CELL */
    let foundValue = null;

    snapshot.forEach(page => {
      page.forEach(row => {
        row.cells.forEach(cell => {

          if (cell?.field?.dataType === "Table Block") {
            (cell.field.tableConfig?.innerCells || []).forEach(r => {
              (r.cells || []).forEach(c => {
                if (String(c.id) === String(cellId)) {
                  foundValue = c.field?.value;
                }
              });
            });
          }

          if (String(cell.id) === String(cellId)) {
            foundValue = cell.field?.value;
          }

        });
      });
    });

    console.log("🔍 FINAL VALUE CHECK:", cellId, "→", foundValue);

  } catch (e) {
    console.warn("⚠️ Deep clone failed");
    console.log(this.stepPagedRows);
  }

  console.groupEnd();

  /* ===== RENDER ===== */

  this.updateStepVisibleRows();

  console.groupEnd();
}

handleTextAreaInput(event) {
  const id = String(event?.target?.dataset?.id ?? "");
  const val = event?.target?.value ?? "";

  console.group(`📝 handleTextAreaInput cellId="${id}" val="${val}"`);

  // Update source of truth (supports main grid + table block)
  this.updateCellOnCurrentPage(id, (cell) => ({
    ...cell,
    field: { ...(cell.field || {}), value: val },
    charCount: val.length
  }));

  // Remove validation highlight if user typed something
  if (val && event?.target?.classList?.contains("highlight-error")) {
    event.target.classList.remove("highlight-error");
  }

  console.groupEnd();
}

// updateCellOnCurrentPage(cellId, updater) {
//   const i = this.stepCurrentPageIndex ?? 0;
//   const pages = this.stepPagedRows || [];
//   const page = Array.isArray(pages[i]) ? pages[i] : [];

//   console.group(
//     `🔄 updateCellOnCurrentPage → cellId="${cellId}" pageIndex=${i}`
//   );
//   console.log("➡️ Current page snapshot:", JSON.parse(JSON.stringify(page)));

//   const updatedPage = page.map((row, rIdx) => {
//     if (!Array.isArray(row?.cells)) return row;

//     const cells = row.cells.map((c, cIdx) => {
//       if (String(c?.id) === String(cellId)) {
//         console.log(
//           `✅ Match row=${rIdx} col=${cIdx} oldVal="${c?.field?.value}"`
//         );
//         const newCell = updater({ ...c });
//         console.log(`   → newVal="${newCell?.field?.value}"`);
//         return newCell;
//       }
//       return c;
//     });

//     return { ...row, cells };
//   });


//   // 🔁 WRITE BACK INTO stepPagedRows
//   this.stepPagedRows = pages.map((p, idx) =>
//   idx === i ? updatedPage : p
// );

//   // 🔁 ALSO update tableRows for the current page
//   // if (i === this.stepCurrentPageIndex) {
//   //   this.tableRows = JSON.parse(JSON.stringify(updatedPage));
//   // }

//   // 🔁 ALSO update tableRows (GLOBAL copy)
// this.tableRows = (this.tableRows || []).map(row => {
//   if (!Array.isArray(row?.cells)) return row;

//   const cells = row.cells.map(c => {
//     if (String(c?.id) === String(cellId)) {
//       return updater({ ...c });
//     }
//     return c;
//   });

//   return { ...row, cells };
// });

//   console.log("✅ stepPagedRows[pageIndex] updated:", this.stepPagedRows[i]);
//   console.groupEnd();
// }

  // handleTextAreaInput(event) {
  //   const id = String(event?.target?.dataset?.id ?? "");
  //   const val = event?.target?.value ?? "";

  //   console.group(`📝 handleTextAreaInput cellId="${id}" val="${val}"`);

  //   // 1) Update the paged source of truth immediately
  //   this.updateCellOnCurrentPage(id, (cell) => ({
  //     ...cell,
  //     field: { ...(cell.field || {}), value: val },
  //     charCount: val.length
  //   }));

  //   // 2) Mirror into currently rendered rows so the UI stays in sync
  //   let matched = false;
  //   this.tableRows = (this.tableRows || []).map((row, rIdx) => {
  //     if (!Array.isArray(row?.cells)) return row;
  //     const cells = row.cells.map((c, cIdx) => {
  //       if (String(c?.id) === id) {
  //         matched = true;
  //         console.log(
  //           `🔎 Match in tableRows row=${rIdx} col=${cIdx} oldVal="${c?.field?.value}"`
  //         );
  //         return {
  //           ...c,
  //           field: { ...(c.field || {}), value: val },
  //           charCount: val.length
  //         };
  //       }
  //       return c;
  //     });
  //     return { ...row, cells };
  //   });

  //   if (!matched) {
  //     console.warn(`⚠️ No match for id="${id}" inside tableRows`);
  //   }

  //   console.log("✅ Updated tableRows:", this.tableRows);
  //   console.groupEnd();
  // }

  restrictAlphaNumeric(event) {
    const char = event.key;
    const regex = /^[A-Za-z0-9]$/; // ✅ Only allows letters and numbers
    if (!regex.test(char)) {
      event.preventDefault();
    }
  }

  validateAlphaNumeric(event) {
    event.target.value = event.target.value.replace(/[^A-Za-z0-9]/g, ""); // ✅ Removes special characters dynamically
  this.handleInputChange(event);
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
 this.handleInputChange(event);
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
    this.handleInputChange(event);
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
    this.handleInputChange(event);
  }


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
        // ⭐ SIGNATURE NORMALIZATION (NEW)
        // ============================================
        if (dataType === "Signature") {
          value = f.value || "";

          // if signature exists, ensure it's base64 image
          if (value && !String(value).startsWith("data:image")) {
            console.warn("⚠️ Signature value is not base64 image:", value);
          }
        }

        // ============================================
        // ⭐ TABLE BLOCK SUPPORT (NEW FIX)
        // ============================================
        if (dataType === "Table Block") {

          const matrix = Array.isArray(f.value) ? f.value : [];

          out.push({
            id: cell.id,
            label,
            value: matrix,              // 🔥 preserve matrix
            dataType,
            field: f,
            isPageBreak: false,
            isVisible: true,
            isTableBlock: true,         // ⭐ important flag
            tableConfig: f.tableConfig || {}
          });

          return; // skip normal processing
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
          isSignature: dataType === "Signature",
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


formatDateForPdf(value) {
    if (!value) return "";

    const d = new Date(value);
    if (isNaN(d)) return value;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`; // DD/MM/YYYY
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



async handleSubmit() {
  console.log("📤 handleSubmit triggered");

  // 🚫 Prevent double submit
  if (this.isLoading) return;

  // 🚫 If no status selected yet, open modal
  if (!this.submitFinalStatus) {
    this.openSubmitConfirmModal();
    return;
  }

  this.isLoading = true;

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
    // ✅ CONTINUE NORMAL SUBMIT FLOW
    // ============================================
    await this.processSubmit();

  } catch (error) {
    console.error("❌ Error in handleSubmit:", error);
    this.showToast("Error", "Error submitting form", "error");
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


async processSubmit() {

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

        const selectedRadio =
          cell.selectedRadioOption ||
          field?.value?.selectedOption ||
          field?.value ||
          "";

        // 🔥 IMPORTANT: Prefer LABEL over ID
        const subInputLabel =
          field?.value?.subLabel ||   // ✅ correct label
          cell.subInputValue ||       // fallback (old behavior)
          "";

        newField = {
          ...field,

          // ✅ Save label instead of ID
          value: subInputLabel
            ? `${selectedRadio} - ${subInputLabel}`
            : selectedRadio
        };

        return {
          ...cell,
          selectedRadioOption: selectedRadio,

          // keep this for compatibility (no break)
          subInputValue: field?.value?.subValue || cell.subInputValue || "",

          field: newField
        };
      }

      if (cell.isTableBlock) {

        const tableConfig = cell.field?.tableConfig || {};

        const rows = tableConfig.rows || 0;
        const cols = tableConfig.columns?.length || 0;

        // ✅ Start from existing matrix
        let matrix = Array.isArray(cell.field?.value)
          ? JSON.parse(JSON.stringify(cell.field.value))
          : Array.from({ length: rows }, () => Array(cols).fill(""));

        const cellValues = tableConfig.cellValues || {};

        Object.keys(cellValues).forEach((key) => {

          const [r, c] = key.split("-").map(Number);

          if (!matrix[r]) {
            matrix[r] = Array(cols).fill("");
          }

          matrix[r][c] = cellValues[key];

        });

        console.log("📊 Final table matrix:", matrix);

        const newField = {
          ...cell.field,
          value: matrix
        };

        return {
          ...cell,
          field: newField
        };
      }

      return { ...cell, field: field };
    })
  }));

  // ✅ Set header values
  this.selectedFormTitle =
    this.selectedForm?.Name__c || this.selectedFormTitle || "Form";

  this.selectedSubmissionDate =
    new Intl.DateTimeFormat("en-GB").format(new Date());

  this.selectedParticipantName =
    this.selectedParticipantName ||
    this.clientName ||
    this.selectedClientName ||
    "";

  // ✅ Build JSON
  const values = this.buildValueMapFromRuntime();
  const cleanTemplate = JSON.parse(JSON.stringify(this.masterFormJson));
  const mergedJson = this.injectValuesIntoTemplate(cleanTemplate, values);

  // this.viewTableData = this.buildViewTableDataFromSubmitRows(allRows);

// 🔥 Generate view structure silently for PDF

// const previousViewData = this.viewTableData;

// this.prepareViewTable(mergedJson);

// this._pdfViewData = JSON.parse(JSON.stringify(this.viewTableData));

// // restore UI state
// this.viewTableData = previousViewData;

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
    "SubmittedResponses", this.selectedFormTitle,  existingJsonKey
  );

  console.log("📦 [ResponseJSON] AWS meta:", responseAwsMeta);

  // 🔁 Route to update or insert
  if (this.isEditing) {
    await this.handleUpdateSubmit(responseAwsMeta);
  } else {
    await this.handleInsertSubmit(responseAwsMeta);
  }
}


async handleUpdateSubmit(responseAwsMeta) {

  const resp = await updateStaffFormResponse({
    responseId: this.selectedResponseId,
    responseJson: JSON.stringify(responseAwsMeta),
    status: this.submitFinalStatus
  });

  const updatedId = resp?.Id || this.selectedResponseId;

  this.selectedParticipantName = this.staffNameToDisplay || "";

  const existing =
    (this.formResponses || []).find((r) => r.Id === updatedId) || {};

  const existingAwsJson =
    existing.AWS_Json__c || existing.Aws_Json__c || "";

  let existingKey = null;
  if (existingAwsJson) {
    try {
      existingKey = JSON.parse(existingAwsJson)?.key || null;
    } catch (e) {
      console.warn("⚠️ existingAwsJson invalid:", existingAwsJson);
    }
  }

  // await this.generateUploadAndUpdateAws({
  //   responseId: updatedId,
  //   isUpdate: !!existingKey,
  //   existingAwsJson
  // });

  this.showToast("Success", "Form Updated", "success");

  this.isFormSelected = false;
  this.isViewModeON = true;
  this.isEditing = false;
  this.isExpandview = false;

  this.resetSearchAndList();
  this.loadStaffResponses();
}


async handleInsertSubmit(responseAwsMeta) {

  const resp = await saveStaffFormResponse({
    formId: this.selectedForm.Id,
    responseJson: JSON.stringify(responseAwsMeta),
    orgId: this.orgid,
    staffId: this.staffId,
    formName: this.selectedForm.Name__c,
    formType: this.selectedForm.Form_Type__c,
    status: this.submitFinalStatus
  });

  const newResponseId = resp?.Id;

  if (!newResponseId) {
    throw new Error("saveStaffFormResponse did not return Id");
  }

  this.selectedParticipantName = this.staffNameToDisplay || "";

  // await this.generateUploadAndUpdateAws({
  //   responseId: newResponseId,
  //   isUpdate: false,
  //   existingAwsJson: null
  // });

  this.showToast("Success", "Form Submitted", "success");

  this.isFormSelected = false;
  this.isViewModeON = true;
  this.isEditing = false;
  this.isExpandview = false;

  this.resetSearchAndList();
  this.loadStaffResponses();
}

async generateUploadAndUpdateAws({ responseId, isUpdate, existingAwsJson }) {

  // backup current UI data
  const originalViewData = this.viewTableData;

  // use the prepared PDF data
  this.viewTableData = this._pdfViewData;

  const { file } = await this.downloadPdf();

  // restore UI data
  this.viewTableData = originalViewData;

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

  const base =
    cell.selectedRadioOption ||
    field?.value?.selectedOption ||
    field.value ||
    "";

  // 🔥 USE LABEL INSTEAD OF ID
  const subLabel =
    field?.value?.subLabel ||   // ✅ correct source
    cell.subInputValue ||       // fallback
    "";

  values[field.id] = subLabel
    ? `${base} - ${subLabel}`
    : base;
}
      // ⭐ SIGNATURE (NEW — VERY IMPORTANT)
      if (field?.dataType === "Signature") {
        values[field.id] = field.value || "";
        return;
      }

      // ⭐ TABLE BLOCK
// ⭐ TABLE BLOCK (FIXED — USE innerCells)
if (cell.isTableBlock || field?.dataType === "Table Block") {

  const tableConfig = field.tableConfig || {};
  const innerRows = tableConfig.innerCells || [];

  const matrix = innerRows.map(row =>
    (row.cells || []).map(innerCell => {

      const innerField = innerCell?.field;

      if (!innerField) return "";

      // ✅ EXACT SAME LOGIC AS NORMAL CELLS

      // Checkbox
      if (innerField.isCheckbox) {
        return !!innerField.value;
      }

      // Upload
      if (innerField.isUpload) {
        return {
          value: innerField.value || [],
          downloadLink: innerField.downloadLink || [],
          urls: innerField.urls || [],
          s3Key: innerField.s3Key || [],
          fileName: innerField.fileName || "",
          contentType: innerField.contentType || "",
          meta: {
            ...(innerField.meta || {}),
            uploadedFiles: innerField.meta?.uploadedFiles || []
          }
        };
      }

      // Dropdown (single/multi simplified)
      if (innerField.isDropdown) {
        return innerField.value || "";
      }

      // Radio
      if (innerField.isRadio) {
        return innerField.value || "";
      }

      // Signature
      if (innerField.isSignature) {
        return innerField.value || "";
      }

      // Default (TEXT / NUMBER / DATE / TIME)
      return innerField.value ?? "";

    })
  );

  values[field.id] = matrix;

  console.log("✅ TABLE MATRIX FROM innerCells:", field.id, matrix);

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
        
        cell.field?.isRichTextDisplay
      ) {
        return; // ❌ DO NOT INJECT
      }

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

        // ⭐ SIGNATURE
        if (cell.field?.dataType === "Signature") {
          cell.field.value = saved || "";
          return;
        }

        // ⭐ TABLE BLOCK (FIXED — SYNC MATRIX → innerCells)
        if (cell.field?.dataType === "Table Block") {

          console.log("📊 Injecting table value:", saved);

          const tableConfig = cell.field?.tableConfig || {};
          const innerRows = tableConfig.innerCells || [];

          let matrix;

          if (Array.isArray(saved)) {
            // ✅ use saved matrix
            matrix = JSON.parse(JSON.stringify(saved));
          } else {
            // fallback empty matrix
            const rows = tableConfig.rows || 0;
            const cols = tableConfig.columns?.length || 0;

            matrix = Array.from({ length: rows }, () =>
              Array(cols).fill("")
            );
          }

          // ✅ set matrix on field (for persistence)
          cell.field.value = matrix;

          // 🔥 CRITICAL FIX: Sync into innerCells (for UI binding)
          innerRows.forEach((innerRow, r) => {
            (innerRow.cells || []).forEach((innerCell, c) => {

              const innerField = innerCell?.field;
              if (!innerField) return;

              const value = matrix[r]?.[c];

              // ✅ SAME behavior as main grid
              if (innerField.isCheckbox) {
                innerField.value = !!value;
              } else if (innerField.isUpload && value && typeof value === "object") {
                innerCell.field = {
                  ...innerField,
                  ...value,
                  meta: {
                    ...(innerField.meta || {}),
                    ...(value.meta || {})
                  }
                };
              } else if (
  innerField.isDropdown &&
  innerField.selectedDropdownOption === "predefinedList"
) {

  const selectedValue =
    typeof value === "object" ? value.value : value;

  let selectedLabel =
    typeof value === "object"
      ? value.displayValue || value.label
      : "";

  // 🔥 IF LABEL MISSING → RESOLVE FROM SOURCE
  if (!selectedLabel && selectedValue) {

    const type = (innerField.predefinedListType || "").toLowerCase();

    let source = [];

    if (type === "staff") {
      source = this.staffOptions || [];
    }
    else if (type === "participant") {
      source = (this.allparticipants || []).map(p => ({
        label: p.Name,
        value: p.Id
      }));
    }
    else if (type === "facility") {
      source = this.facilityOptions || [];
    }

    const match = source.find(opt => opt.value === selectedValue);

    selectedLabel = match?.label || selectedValue;
  }

  innerField.value = selectedValue || "";

  innerField.displayValue =
    selectedLabel ||
    innerField.displayValue ||
    selectedValue ||
    "";
} else {
                innerField.value = value ?? "";
              }

            });
          });

          return;
        }

        // 🔥 RADIO FIX (CRITICAL)
        if (cell.field?.dataType === "Radio Button") {

          if (typeof saved === "string") {

            // Split "1 - Sai Eswar"
            const parts = saved.split(" - ");

            const selectedOption = parts[0] || "";
            const subLabel = parts[1] || "";

            cell.field.value = {
              selectedOption,
              subType: "dropdown", // or infer if needed
              subValue: "",        // optional
              subLabel
            };

          } else if (saved && typeof saved === "object") {
            cell.field.value = saved;
          }

          return;
        }

        // ⭐ Existing object logic (dropdown etc)
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


 get hasResponses() {
    return (
      Array.isArray(this.paginatedFormResponses) &&
      this.paginatedFormResponses.length > 0
    );
  }



toggleDropdown(event) {
  const cellId = String(event.currentTarget.dataset.id);

  console.log("🔽 Toggle Dropdown:", cellId);

  const updateRow = (row) => {
    if (!row?.cells) return row;

    return {
      ...row,
      cells: row.cells.map(cell => {

        /* MAIN GRID (UNCHANGED) */
        if (String(cell.id) === cellId) {
          return {
            ...cell,
            isDropdownOpen: !cell.isDropdownOpen
          };
        }

        /* TABLE BLOCK (FIXED) */
        if (cell?.isTableBlock && cell?.field?.tableConfig) {

          const config = cell.field.tableConfig;

          // 🔥 renderRows
          (config.renderRows || []).forEach(r => {
            (r.renderCells || []).forEach(c => {

              // ✅ REHYDRATE BEFORE OPEN
              if (c?.field?.dataType === "Dropdown Field" &&
c?.field?.selectedDropdownOption === "multiSelect") {
                Object.assign(c, this.syncMultiSelectFromValue(c));
              }

              c.isDropdownOpen =
                String(c.id) === cellId ? !c.isDropdownOpen : false;
            });
          });

          // 🔥 innerCells
          (config.innerCells || []).forEach(r => {
            (r.cells || []).forEach(c => {

              // ✅ REHYDRATE
              if (c?.field?.dataType === "Dropdown Field" &&
c?.field?.selectedDropdownOption === "multiSelect") {
                Object.assign(c, this.syncMultiSelectFromValue(c));
              }

              c.isDropdownOpen =
                String(c.id) === cellId ? !c.isDropdownOpen : false;
            });
          });

          return cell;
        }

        return {
          ...cell,
          isDropdownOpen: false
        };
      })
    };
  };

  this.tableRows = this.tableRows.map(updateRow);

  this.stepPagedRows = JSON.parse(
    JSON.stringify(this.stepPagedRows.map(page => page.map(updateRow)))
  );

  if (!this.dropdownListenerAdded) {
    document.addEventListener("click", this.closeDropdowns);
    this.dropdownListenerAdded = true;
  }
}

handleMultiSelectChange(event) {
  const optionLabel = event.target.value || event.target.dataset.value;
  const cellId = String(event.target.dataset.id);
  const isChecked = !!event.target.checked;

  console.log("🧩 MULTISELECT CHANGE TRIGGERED:", {
    cellId,
    optionLabel,
    isChecked
  });

  const applyChange = (cell) => {

    console.log("🟡 BEFORE CHANGE:", {
      cellId: cell.id,
      value: cell.field?.value,
      options: cell.field?.options
    });

    const updatedOptions = (cell.field?.options || []).map(opt => {
      const match =
        opt.label === optionLabel || opt.value === optionLabel;

      return match
        ? { ...opt, isSelected: isChecked }
        : opt;
    });

    const selected = updatedOptions.filter(o => o.isSelected);

    const updatedCell = {
      ...cell,
      selectedValues: selected.map(o => o.label).join(", "),
      field: {
        ...cell.field,
        options: updatedOptions,
        value: selected.map(o => o.value ?? o.label).join(", ")
      }
    };

    console.log("🟢 AFTER CHANGE:", {
      cellId: cell.id,
      value: updatedCell.field.value
    });

    return updatedCell;
  };

  const updateRow = (row) => {
    if (!row?.cells) return row;

    return {
      ...row,
      cells: row.cells.map(cell => {

        /* MAIN GRID (UNCHANGED) */
        if (String(cell.id) === cellId) {
          const updated = applyChange(cell);
          Object.assign(cell, updated);
          return cell;
        }

        /* TABLE BLOCK */
        if (cell?.isTableBlock && cell?.field?.tableConfig) {

          const config = cell.field.tableConfig;

          console.log("📦 TABLE BLOCK CHANGE");

          // 🔥 STEP 1: UPDATE renderRows
          (config.renderRows || []).forEach(r => {
            (r.renderCells || []).forEach(c => {
              if (String(c.id) === cellId) {

                Object.assign(c, this.syncMultiSelectFromValue(c));
                Object.assign(c, applyChange(c));

                console.log("🟢 UPDATED renderCell:", {
                  cellId: c.id,
                  value: c.field?.value
                });
              }
            });
          });

          // 🔥 STEP 2: SYNC renderRows → innerCells
          (config.innerCells || []).forEach((r, rIndex) => {
            (r.cells || []).forEach((c, cIndex) => {

             const renderCell =
  config.renderRows?.[rIndex]?.renderCells
    ?.find(rc => String(rc.id) === String(c.id));

              if (renderCell) {

                console.log("🔁 SYNC CHANGE → INNER:", {
                  cellId: c.id,
                  from: c.field?.value,
                  to: renderCell.field?.value
                });

                Object.assign(c, {
                  ...renderCell,
                  field: { ...renderCell.field }
                });
              }

            });
          });

          return cell;
        }

        return cell;
      })
    };
  };

  this.tableRows = this.tableRows.map(updateRow);

  console.log("🧠 TABLE ROWS AFTER CHANGE:", JSON.stringify(this.tableRows));

  this.stepPagedRows = JSON.parse(
    JSON.stringify(this.stepPagedRows.map(page => page.map(updateRow)))
  );
}

saveMultiSelect(event) {
  const cellId = String(event.target.dataset.id);

  console.log("💾 SAVE MULTISELECT:", cellId);

  const finalize = (cell) => {

    console.log("🟠 BEFORE SAVE:", {
      cellId: cell.id,
      value: cell.field?.value
    });

    const selected = (cell.field?.options || []).filter(o => o.isSelected);

    const updatedCell = {
      ...cell,
      selectedValues: selected.map(o => o.label).join(", "),
      field: {
        ...cell.field,
        options: cell.field.options,
        value: selected.map(o => o.value ?? o.label).join(", ")
      },
      isDropdownOpen: false
    };

    console.log("🟢 AFTER SAVE:", {
      cellId: cell.id,
      value: updatedCell.field.value
    });

    return updatedCell;
  };

  const updateRow = (row) => {
    if (!row?.cells) return row;

    return {
      ...row,
      cells: row.cells.map(cell => {

        /* MAIN GRID */
        if (String(cell.id) === cellId) {
          const updated = finalize(cell);
          Object.assign(cell, updated);
          return cell;
        }

        /* TABLE BLOCK */
        if (cell?.isTableBlock && cell?.field?.tableConfig) {

          const config = cell.field.tableConfig;

          console.log("📦 TABLE BLOCK SAVE");

          // 🔥 STEP 1: UPDATE renderRows
          (config.renderRows || []).forEach(r => {
            (r.renderCells || []).forEach(c => {
              if (String(c.id) === cellId) {

                console.log("🔵 RENDER BEFORE:", c.field?.value);

                Object.assign(c, finalize(c));

                console.log("🟢 RENDER AFTER:", c.field?.value);
              }
            });
          });

          // 🔥🔥🔥 CRITICAL FIX
          // SYNC renderRows → innerCells (SOURCE OF TRUTH)
          (config.innerCells || []).forEach((r, rIndex) => {
            (r.cells || []).forEach((c, cIndex) => {

             const renderCell =
  config.renderRows?.[rIndex]?.renderCells
    ?.find(rc => String(rc.id) === String(c.id));

              if (renderCell) {

                console.log("🔁 SYNC SAVE → INNER:", {
                  cellId: c.id,
                  old: c.field?.value,
                  new: renderCell.field?.value
                });

                Object.assign(c, {
                  ...renderCell,
                  field: { ...renderCell.field }
                });
              }

            });
          });

          return cell;
        }

        return cell;
      })
    };
  };

  this.tableRows = this.tableRows.map(updateRow);

  console.log("🧠 TABLE ROWS AFTER SAVE:", JSON.stringify(this.tableRows));

  this.stepPagedRows = JSON.parse(
    JSON.stringify(this.stepPagedRows.map(page => page.map(updateRow)))
  );

  document.removeEventListener("click", this.closeDropdowns);
}

syncMultiSelectFromValue(cell) {
 if (
  !cell?.field ||
  cell.field.dataType !== "Dropdown Field" ||
  cell.field.selectedDropdownOption !== "multiSelect"
) return cell;

  const raw = cell.field.value || "";

  const selectedValues = raw
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

  const updatedOptions = (cell.field.options || []).map(opt => ({
    ...opt,
    isSelected:
      selectedValues.includes(opt.value) ||
      selectedValues.includes(opt.label)
  }));

  return {
    ...cell,
    field: {
      ...cell.field,
      options: updatedOptions
    }
  };
}

rehydrateTableBlockMultiSelect() {
  this.tableRows.forEach(row => {
    (row.cells || []).forEach(cell => {

      if (cell?.isTableBlock && cell?.field?.tableConfig) {

        const config = cell.field.tableConfig;

        (config.renderRows || []).forEach(r => {
          (r.renderCells || []).forEach(c => {
            if (c?.field?.dataType === "Dropdown Field" &&
c?.field?.selectedDropdownOption === "multiSelect") {
              Object.assign(c, this.syncMultiSelectFromValue(c));
            }
          });
        });

        (config.innerCells || []).forEach(r => {
          (r.cells || []).forEach(c => {
            if (c?.field?.dataType === "Dropdown Field" &&
c?.field?.selectedDropdownOption === "multiSelect") {
              Object.assign(c, this.syncMultiSelectFromValue(c));
            }
          });
        });

      }

    });
  });

  this.tableRows = [...this.tableRows];
}


closeDropdowns = (event) => {

  if (
    this.template
      .querySelector(".multi-dropdown-options")
      ?.contains(event.target)
  ) {
    return;
  }

  const updateRow = (row) => {

    if (!Array.isArray(row?.cells)) return row;

    const cells = row.cells.map((cell) => {

      if (cell?.isTableBlock && cell?.tableConfig?.renderRows) {

        const newTableConfig = {
          ...cell.tableConfig,
          renderRows: cell.tableConfig.renderRows.map((tRow) => ({
            ...tRow,
            renderCells: tRow.renderCells.map((tCell) => ({
              ...tCell,
              isDropdownOpen: false
            }))
          }))
        };

        return { ...cell, tableConfig: newTableConfig };
      }

      return { ...cell, isDropdownOpen: false };
    });

    return { ...row, cells };
  };

  this.tableRows = this.tableRows.map(updateRow);

  document.removeEventListener("click", this.closeDropdowns);
};

  stopPropagation(event) {
    event.stopPropagation();
  }
  handleinputCancel() {
    this.isFormSelected = false;
    this.isViewModeON = true;
    this.isViewMode = false;
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

  const cellId = String(event.target.dataset.cellId);

  console.log("📂 File selected for cell:", cellId, files);

  // get all document services in the template
  const services = this.template.querySelectorAll("c-document-office-service");

  if (!services.length) {
    console.warn("⚠️ No document-office-service components found in DOM");
    return;
  }

  let found = false;

  services.forEach((svc) => {

    // context-cell-id becomes contextCellId in JS
    if (String(svc.contextCellId) === cellId) {

      console.log("✅ Found upload service for cell:", cellId);

      svc.incomingFiles = files;

      found = true;
    }

  });

  if (!found) {
    console.warn("⚠️ No matching document-office-service found for cell:", cellId);
  }

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

    const cellId = ctx;

    // 🔹 collect existing values
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

    // 🔍 scan existing (MAIN + TABLE)
    (this.tableRows || []).forEach(row => {
      row.cells.forEach(cell => {

        /* MAIN GRID */
        if (cell.id === cellId) {
          collectExisting(cell);
        }

        /* TABLE BLOCK */
        if (cell?.isTableBlock && cell?.field?.tableConfig) {

          const config = cell.field.tableConfig;

          (config.renderRows || []).forEach(tRow => {
            (tRow.renderCells || []).forEach(tCell => {
              if (tCell.id === cellId) collectExisting(tCell);
            });
          });

          (config.innerCells || []).forEach(tRow => {
            (tRow.cells || []).forEach(tCell => {
              if (tCell.id === cellId) collectExisting(tCell);
            });
          });

        }

      });
    });

    // 🔹 NEW payload
    const newUrls = files.map(f => f?.url).filter(Boolean);
    const newNames = files.map(f => f?.originalName).filter(Boolean);
    const newTypes = files.map(f => f?.type).filter(Boolean);
    const newKeys = files.map(f => f?.key).filter(Boolean);
    const modulePath = files[0]?.modulePath ?? undefined;

    // 🔹 merge
    const urls = [...existingUrls, ...newUrls];
    const names = [...existingNames, ...newNames];
    const types = newTypes;
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

    // =========================
    // 🔄 UPDATE tableRows
    // =========================
    this.tableRows = this.tableRows.map(row => ({

      ...row,

      cells: row.cells.map(cell => {

        /* MAIN GRID */
        if (cell.id === cellId) {

          return {
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

        }

        /* TABLE BLOCK */
        if (cell?.isTableBlock && cell?.field?.tableConfig) {

          const config = cell.field.tableConfig;

          // 🔥 MUTATE renderRows
          (config.renderRows || []).forEach((tRow, rIdx) => {
            (tRow.renderCells || []).forEach((tCell, cIdx) => {

              if (tCell.id === cellId) {

                console.log(`🔥 Upload → renderRows [${rIdx}-${cIdx}]`);

                Object.assign(tCell, {
                  ...tCell,
                  field: {
                    ...tCell.field,
                    value: valueForField,
                    downloadLink: urls,
                    fileName: names.join(", "),
                    contentType: urls.length === 1 ? types[0] || null : "multiple",
                    s3Key: s3Keys,
                    urls,
                    meta: metaPayload
                  }
                });

              }

            });
          });

          // 🔥 MUTATE innerCells
          (config.innerCells || []).forEach((iRow, rIdx) => {
            (iRow.cells || []).forEach((iCell, cIdx) => {

              if (iCell.id === cellId) {

                console.log(`🔥 Upload → innerCells [${rIdx}-${cIdx}]`);

                Object.assign(iCell, {
                  ...iCell,
                  field: {
                    ...iCell.field,
                    value: valueForField,
                    downloadLink: urls,
                    fileName: names.join(", "),
                    contentType: urls.length === 1 ? types[0] || null : "multiple",
                    s3Key: s3Keys,
                    urls,
                    meta: metaPayload
                  }
                });

              }

            });
          });

          return cell;
        }

        return cell;

      })

    }));

    // =========================
    // 🔄 UPDATE stepPagedRows
    // =========================
    this.stepPagedRows = JSON.parse(
      JSON.stringify(
        this.stepPagedRows.map(page =>
          page.map(row => ({

            ...row,

            cells: row.cells.map(cell => {

              if (cell.id === cellId) {

                return {
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

              }

              if (cell?.isTableBlock && cell?.field?.tableConfig) {

                const config = cell.field.tableConfig;

                (config.renderRows || []).forEach(tRow => {
                  (tRow.renderCells || []).forEach(tCell => {
                    if (tCell.id === cellId) {
                      Object.assign(tCell, {
                        ...tCell,
                        field: {
                          ...tCell.field,
                          value: valueForField,
                          downloadLink: urls,
                          fileName: names.join(", "),
                          contentType: urls.length === 1 ? types[0] || null : "multiple",
                          s3Key: s3Keys,
                          urls,
                          meta: metaPayload
                        }
                      });
                    }
                  });
                });

                (config.innerCells || []).forEach(iRow => {
                  (iRow.cells || []).forEach(iCell => {
                    if (iCell.id === cellId) {
                      Object.assign(iCell, {
                        ...iCell,
                        field: {
                          ...iCell.field,
                          value: valueForField,
                          downloadLink: urls,
                          fileName: names.join(", "),
                          contentType: urls.length === 1 ? types[0] || null : "multiple",
                          s3Key: s3Keys,
                          urls,
                          meta: metaPayload
                        }
                      });
                    }
                  });
                });

                return cell;
              }

              return cell;

            })

          }))
        )
      )
    );

    // 🔹 clear input
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



// async buildPdfDoc() {
//   console.log("📄 ===== PDF BUILD START =====")
//   const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;

//   if (!jsPDFConstructor || !jsPDFConstructor.API?.autoTable) {
//     console.error("❌ jsPDF or autoTable not available.", {
//       jsPDFConstructor,
//       jspdf: window.jspdf
//     });
//     throw new Error("PDF library not available");
//   }

//   // normalize view data
//   this.viewTableData = (this.viewTableData || []).map((item) => ({
//     ...item,
//     isVisible: true,
//     ...(item.isPageBreak ? { arrow: "▼" } : {})
//   }));

//   const doc = new jsPDFConstructor();

//   // 🔧 Patch missing getters for autoTable compatibility
// if (!doc.getFontSize && doc.internal?.getFontSize) {
//   doc.getFontSize = () => doc.internal.getFontSize();
// }

// if (!doc.getFont && doc.internal?.getFont) {
//   doc.getFont = () => doc.internal.getFont();
// }


//   // =====================================================
//   // 🔥 REQUIRED for jsPDF 4 + autoTable v5
//   // =====================================================
//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(10);

//   if (typeof doc.autoTable !== "function") {
//     console.error("❌ autoTable missing on doc instance", doc);
//     throw new Error("autoTable not attached");
//   }

//  // =====================================================
//   // LOGO (PRELOAD ONLY — DO NOT DRAW HERE)
//   // =====================================================
//   let logoData = null;

//   if (this.orgLogoUrl) {
//     const img = new Image();
//     img.crossOrigin = "Anonymous";
//     img.src = this.orgLogoUrl;

//     await new Promise((resolve) => {
//       img.onload = () => {
//         try {
//           const canvas = document.createElement("canvas");
//           canvas.width = img.width;
//           canvas.height = img.height;

//           const ctx = canvas.getContext("2d");
//           ctx.drawImage(img, 0, 0);

//           logoData = {
//             base64: canvas.toDataURL("image/png"),
//             width: img.width,
//             height: img.height
//           };
//         } catch (e) {
//           console.warn("⚠️ Logo render error:", e);
//         }
//         resolve();
//       };

//       img.onerror = () => {
//         console.warn("⚠️ Logo failed to load:", this.orgLogoUrl);
//         resolve();
//       };
//     });
//   }


//   // =====================================================
//   // CONTENT
//   // =====================================================
//   await this.drawPdfContent(doc, logoData);


//   return doc;
// }


async buildPdfDoc() {

  console.log("📄 ===== PDF BUILD START =====");

  const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;

  console.log("🔍 jsPDFConstructor:", jsPDFConstructor);

  if (!jsPDFConstructor || !jsPDFConstructor.API?.autoTable) {
    console.error("❌ jsPDF or autoTable not available.", {
      jsPDFConstructor,
      jspdf: window.jspdf
    });
    throw new Error("PDF library not available");
  }

  // =====================================================
  // 🔍 DEBUG viewTableData BEFORE NORMALIZATION
  // =====================================================

  console.log("📊 viewTableData BEFORE normalize:", JSON.stringify(this.viewTableData));

  if (!this.viewTableData || this.viewTableData.length === 0) {
    console.warn("⚠️ viewTableData is EMPTY before PDF generation");
  }

  const tableBlocks = (this.viewTableData || []).filter(
    i => i.dataType === "Table Block"
  );

  console.log("📊 TableBlock entries BEFORE normalize:", tableBlocks);

  // =====================================================
  // normalize view data
  // =====================================================

  this.viewTableData = (this.viewTableData || []).map((item) => ({
    ...item,
    isVisible: true,
    ...(item.isPageBreak ? { arrow: "▼" } : {})
  }));

  console.log("📊 viewTableData AFTER normalize:", JSON.stringify(this.viewTableData));

  const doc = new jsPDFConstructor();

  console.log("📄 jsPDF instance created:", doc);

  // 🔧 Patch missing getters for autoTable compatibility
  if (!doc.getFontSize && doc.internal?.getFontSize) {
    doc.getFontSize = () => doc.internal.getFontSize();
  }

  if (!doc.getFont && doc.internal?.getFont) {
    doc.getFont = () => doc.internal.getFont();
  }

  // =====================================================
  // jsPDF config
  // =====================================================

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  console.log("🧾 Font configured");

  if (typeof doc.autoTable !== "function") {
    console.error("❌ autoTable missing on doc instance", doc);
    throw new Error("autoTable not attached");
  }

  console.log("✅ autoTable available");

  // =====================================================
  // LOGO
  // =====================================================

  let logoData = null;

  if (this.orgLogoUrl) {

    console.log("🖼️ Loading logo:", this.orgLogoUrl);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = this.orgLogoUrl;

    await new Promise((resolve) => {

      img.onload = () => {

        console.log("✅ Logo loaded:", img.width, img.height);

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

          console.log("🖼️ Logo converted to base64");

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

  } else {

    console.warn("⚠️ No orgLogoUrl available");

  }

  // =====================================================
  // BEFORE DRAW CONTENT
  // =====================================================

  console.log("📄 Calling drawPdfContent()");
  console.log("📊 viewTableData sent to drawPdfContent:", JSON.stringify(this.viewTableData));

  await this.drawPdfContent(doc, logoData);

  console.log("📄 ===== PDF BUILD COMPLETE =====");

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

console.log("PDF Generation Started");

const rows = this.viewTableData || [];

const pageW = doc.internal.pageSize.getWidth();
const pageH = doc.internal.pageSize.getHeight();

const BRAND = [0,42,82];

const marginX = 30;
let y = 70;
let currentPage = 1;


/* ================= HEADER (FIRST PAGE ONLY) ================= */

const drawHeader = () => {

const headerHeight = 60;

doc.setFillColor(...BRAND);
doc.rect(0,0,pageW,headerHeight,"F");

doc.setFont("helvetica","bold");
doc.setFontSize(16);
doc.setTextColor(255,255,255);

doc.text(
 this.selectedFormTitle || "View Ps",
 marginX,
 22
);

doc.setFont("helvetica","normal");
doc.setFontSize(10);

const staff = this.staffNameToDisplay || "";
const submitted = this.selectedSubmissionDate || "";

doc.text(`Staff: ${staff}`,marginX,38);
doc.text(`Submitted: ${submitted}`,marginX,50);


/* LOGO (aspect ratio preserved) */

if(logoData?.base64){

 try{

  const props = doc.getImageProperties(logoData.base64);

  const logoWidth = 36;
  const logoHeight = logoWidth * (props.height/props.width);

  const logoY = (headerHeight - logoHeight)/2;

  doc.addImage(
   logoData.base64,
   "PNG",
   pageW - logoWidth - marginX,
   logoY,
   logoWidth,
   logoHeight
  );

 }catch(e){

  console.warn("Logo render error");

 }

}

};

drawHeader();



/* ================= GRID ================= */

for (const row of rows) {

if(!row.isVisible) continue;


/* PAGE SWITCH */

if(row.belongsToPage !== currentPage){

 doc.addPage();
 currentPage = row.belongsToPage;

 y = 30;

}


/* SECTION HEADER */

if(row.cells?.[0]?.isSectionHeader){

 doc.setFont("helvetica","bold");
 doc.setFontSize(15);
 doc.setTextColor(33,115,255);

 doc.text(
  row.cells[0].title,
  pageW/2,
  y,
  {align:"center"}
 );

 y += 20;

 continue;

}


if(!row.cells) continue;


/* COLUMN CALC */

let totalCols = 0;

row.cells.forEach(c=>{
 totalCols += (c.colspan || 1);
});

const usableWidth = pageW - marginX*2;
const colWidth = usableWidth / totalCols;


/* ================= PASS 1: ROW HEIGHT ================= */

let rowHeight = 18;

row.cells.forEach(cell=>{

if(cell.isEmpty) return;

let width = colWidth * (cell.colspan || 1);
let value = cell.value ?? "";


/* SIGNATURE */

if(cell.isSignature && value?.startsWith("data:image")){

 try{

  const props = doc.getImageProperties(value);

  const imgWidth = (width-10) * 0.8;
  const imgHeight = imgWidth * (props.height/props.width);

  rowHeight = Math.max(rowHeight,imgHeight+12);

 }catch(e){}

}


/* UPLOAD IMAGE */

else if(cell.isUploadFile && cell.files?.length){

 const file = cell.files[0];

 if(file.isImage){

  try{

   const props = doc.getImageProperties(file.downloadUrl);

   const imgWidth = (width-10) * 0.8;
   const imgHeight = imgWidth * (props.height/props.width);

   rowHeight = Math.max(rowHeight,imgHeight+12);

  }catch(e){}

 }

}

else if(cell.isTableBlock){

  const headers = cell.headers || [];
  const rowsData = cell.rows || [];

  const tableRowHeight = 18;

  const tableHeight =
      tableRowHeight * (rowsData.length + 1);

  rowHeight = Math.max(rowHeight, tableHeight + 10);

  return;
}

/* RICH TEXT HEIGHT (SAFE FALLBACK) */
else if (cell.isRichText && value) {

  const estimatedHeight = this.estimateRichTextHeight(value, width - 10);

  rowHeight = Math.max(rowHeight, estimatedHeight + 10);

}

/* TEXT */

else{

 const lines = doc.splitTextToSize(String(value),width-10);

 const textHeight = lines.length*6 + 10;

 rowHeight = Math.max(rowHeight,textHeight);

}

});


/* ================= PASS 2: RENDER ================= */

let x = marginX;

for (const cell of row.cells) {

const width = colWidth * (cell.colspan || 1);


/* EMPTY CELL */

if(cell.isEmpty){

 x += width;
 continue;

}


let label = cell.label || "";
let value = cell.value ?? "";


/* CHECKBOX */

if(cell.isCheckbox){
 value = value ? "Yes":"No";
}

/* ================= TABLE BLOCK ================= */

if(cell.isTableBlock){

 const headers = cell.headers || [];
 const rowsData = cell.rows || [];

 const tableCols = headers.length || 1;
 const tableWidth = usableWidth;
 const colW = tableWidth / tableCols;

 const startX = marginX;
 let tableY = y;

 const rowH = 16;

 /* FIELD LABEL */

 doc.setFont("helvetica","bold");
 doc.setFontSize(11);
 doc.setTextColor(60,60,60);

 doc.text(
  (cell.label || "").toUpperCase(),
  marginX,
  tableY
 );

 tableY += 10;

 /* HEADER */

 headers.forEach((h,ci)=>{

  const hx = startX + ci*colW;

  doc.setFillColor(238,242,246);
  doc.rect(hx,tableY,colW,rowH,"F");

  doc.setDrawColor(200);
  doc.rect(hx,tableY,colW,rowH);

  doc.setFont("helvetica","bold");
  doc.setFontSize(9);
  doc.setTextColor(30);

  doc.text(
   h.header || "",
   hx + colW/2,
   tableY + 11,
   {align:"center"}
  );

 });

 tableY += rowH;

 /* BODY */

 rowsData.forEach(r=>{

  r.cells.forEach((c,ci)=>{

   const cx = startX + ci*colW;

   doc.setDrawColor(200);
   doc.rect(cx,tableY,colW,rowH);

   const textX = cx + (c.isRowLabel ? 4 : colW/2);
   const textY = tableY + 11;

   doc.text(String(c.value || ""), textX, textY, {
     align: c.isRowLabel ? "left":"center"
   });

  });

  tableY += rowH;

 });

 y = tableY + 14;

 continue;

}


/* LABEL */

doc.setFont("helvetica","bold");
doc.setFontSize(9);
doc.setTextColor(90,100,110);

doc.text(label.toUpperCase(),x,y);


/* VALUE BACKGROUND */

const boxY = y + 4;

doc.setFillColor(241,245,249);

doc.roundedRect(
 x,
 boxY,
 width-4,
 rowHeight,
 2,
 2,
 "F"
);


/* VALUE TEXT STYLE */

doc.setFont("helvetica","normal");
doc.setFontSize(10);
doc.setTextColor(20,20,20);


/* SIGNATURE */

if(cell.isSignature && value?.startsWith("data:image")){

 try{

  const props = doc.getImageProperties(value);

  const imgWidth = (width-10)*0.8;
  const imgHeight = imgWidth*(props.height/props.width);

  const imgY = boxY + (rowHeight-imgHeight)/2;

  doc.addImage(
   value,
   "PNG",
   x+4,
   imgY,
   imgWidth,
   imgHeight
  );

 }catch(e){}

}


/* FILE */

else if(cell.isUploadFile && cell.files?.length){

 const file = cell.files[0];

 if(file.isImage){

  try{

   const props = doc.getImageProperties(file.downloadUrl);

   const imgWidth = (width-10)*0.8;
   const imgHeight = imgWidth*(props.height/props.width);

   const imgY = boxY + (rowHeight-imgHeight)/2;

   doc.addImage(
    file.downloadUrl,
    "JPEG",
    x+4,
    imgY,
    imgWidth,
    imgHeight
   );

  }catch(e){}

 }else{

  doc.text("Attachment Uploaded",x+4,boxY+8);

 }

}

/* RICH TEXT */

else if (cell.isRichText && value) {

  try {

    await this.renderRichTextAsImage(
      doc,
      value,
      x + 4,
      boxY + 4,
      width - 10,
      pageH
    );

  } catch (e) {

    const lines = doc.splitTextToSize(String(value), width - 10);
    doc.text(lines, x + 4, boxY + 10);

  }

}

/* NORMAL TEXT */

else{

 const lines = doc.splitTextToSize(String(value),width-10);

 doc.text(lines,x+4,boxY+10);

}


x += width;

}

y += rowHeight + 12;


/* PAGE BREAK */

if(y > pageH-40){

 doc.addPage();
 y = 30;

}

}


/* ================= PAGE NUMBERS ================= */

const pageCount = doc.internal.getNumberOfPages();

for(let i=1;i<=pageCount;i++){

 doc.setPage(i);

 doc.setFontSize(9);
 doc.setTextColor(120);

 doc.text(
  `Page ${i} of ${pageCount}`,
  pageW/2,
  pageH-10,
  {align:"center"}
 );

}

console.log("PDF generation complete");

}


estimateRichTextHeight(html, width) {

  const container = document.createElement("div");

  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";

  // ✅ MATCH PDF WIDTH
  container.style.width = width + "px";

  // ✅ CRITICAL: RESET QUILL STYLES
  container.style.height = "auto";
  container.style.minHeight = "0";
  container.style.maxHeight = "none";
  container.style.padding = "0";
  container.style.margin = "0";
  container.style.overflow = "hidden";
  container.style.display = "inline-block";

  container.className = "ql-editor";
  container.innerHTML = html;
  // 🔥 ADD THIS
this.normalizeRichTextImages(container, width);

  // ✅ REMOVE EXTRA SPACING FROM QUILL
  const style = document.createElement("style");
  style.innerHTML = `
    .ql-editor {
      padding: 0 !important;
      margin: 0 !important;
    }
    .ql-editor p {
      margin: 0 !important;
    }
  `;
  container.appendChild(style);

  document.body.appendChild(container);

  const domHeight = container.scrollHeight;

  console.log("✅ FIXED Estimated DOM height:", domHeight);

  document.body.removeChild(container);

  return domHeight; // ✅ NO MORE 0.75 HACK
}

async renderRichTextAsImage(doc, html, x, y, width, pageH) {

  console.log("---- RICH TEXT START ----");
  console.log("HTML:", html);
  console.log("Target width:", width);
  console.log("Start Y:", y);

  if (!html) return;

  const container = document.createElement("div");

  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";

  // ✅ EXACT WIDTH OF BLUE BOX
  container.style.width = width + "px";

  // ✅ CRITICAL FIXES (REMOVE QUILL EXPANSION)
  container.style.height = "auto";
  container.style.minHeight = "0";
  container.style.maxHeight = "none";
  container.style.padding = "0";
  container.style.margin = "0";
  container.style.overflow = "hidden";
  container.style.display = "inline-block";

  container.className = "ql-editor";
  container.innerHTML = html;
  // 🔥 ADD THIS
this.normalizeRichTextImages(container, width);

  // ✅ REMOVE EXTRA SPACING
  const style = document.createElement("style");
  style.innerHTML = `
    .ql-editor {
      padding: 0 !important;
      margin: 0 !important;
    }
    .ql-editor p {
      margin: 0 !important;
    }
  `;
  container.appendChild(style);

  document.body.appendChild(container);

  const domHeight = container.scrollHeight;
  const domWidth = container.scrollWidth;

  console.log("✅ FIXED DOM height:", domHeight);
  console.log("DOM width:", domWidth);

  const canvas = await window.html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: null
  });

  console.log("Canvas width:", canvas.width);
  console.log("Canvas height:", canvas.height);

  const imgData = canvas.toDataURL("image/png");

  document.body.removeChild(container);

  // ✅ CORRECT SCALING (MOST IMPORTANT)
  const ratio = width / canvas.width;

  const imgWidth = width;
  const imgHeight = canvas.height * ratio;

  console.log("Final imgWidth:", imgWidth);
  console.log("Final imgHeight:", imgHeight);

  // ✅ PAGE BREAK SAFE
  if (y + imgHeight > pageH - 20) {
    console.log("⚠️ PAGE BREAK TRIGGERED");
    doc.addPage();
    y = 30;
  }

  doc.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

  console.log("---- RICH TEXT END ----");
}

normalizeRichTextImages(container, maxWidth) {

  const images = container.querySelectorAll("img");

  images.forEach(img => {

    // 🔥 FORCE IMAGE TO FIT INSIDE BOX
    img.style.maxWidth = maxWidth + "px";
    img.style.width = "100%";
    img.style.height = "auto";

    img.style.display = "block";
    img.style.margin = "6px 0";

  });

}

async optimizeLogoForPdf(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;

    img.onload = () => {
      const maxWidth = 300;
      const scale = maxWidth / img.width;

      const canvas = document.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");

      // 🔥 FIX: Fill white background first
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw logo on top
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to JPEG
      const optimized = canvas.toDataURL("image/jpeg", 0.7);

      resolve(optimized);
    };
  });
}


async printViewPageWise() {

  console.log("🖨️ Page-wise print started");

  const container = this.template.querySelector(".view-popup-content");

  if (!container) {
    console.error("❌ view-popup-content not found");
    return;
  }

  const originalPage = this.currentViewPage;

  // ✅ Show all rows
  this.viewTableData = this.viewTableData.map(row => ({
    ...row,
    isVisible: !row.isPageBreak
  }));

  await new Promise(resolve => requestAnimationFrame(resolve));

  const html = this.buildPageWiseCloneHtml(container);

  // ✅ Restore state
  this.currentViewPage = originalPage;
  this.updateVisibleRows();

  const cssUrl = `${window.location.origin}/resource/Quill/quill.snow.css`;

  console.log("🔗 Quill CSS URL:", cssUrl);

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    console.error("❌ Failed to open print window");
    return;
  }

  // ✅ Write HTML
  printWindow.document.write(`
    <html>
      <head>
        <title>${this.selectedFormTitle}</title>

        <link id="quillCss" href="${cssUrl}" rel="stylesheet">

        <style>
          ${this.getFullCssForPrint()}
        </style>
      </head>

      <body>
        ${html}
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {

  console.log("📄 Print window loaded");

  setTimeout(() => {

    printWindow.document.body.style.visibility = "visible";

    console.log("🖨️ Triggering print");

    printWindow.focus();
    printWindow.print();

  }, 300); // shorter delay

};

// 🔥 CLOSE AFTER PRINT (CANCEL OR SUCCESS)
printWindow.onafterprint = () => {
  printWindow.close();
};
}



buildPageWiseCloneHtml(originalContainer) {

  console.log("🧾 Starting buildPageWiseCloneHtml");

  const pages = {};

  (this.viewTableData || []).forEach(row => {
    if (!row.isVisible || row.isPageBreak) return;

    const page = Number(row.belongsToPage || 1);

    if (!pages[page]) {
      pages[page] = [];
    }

    pages[page].push(row.id);
  });

  console.log("📄 Pages grouped:", pages);

  let finalHtml = "";

  // 🔥 Header map
  const headerMap = new Map();

  (this.tableRows || []).forEach(row => {
    (row.cells || []).forEach(cell => {
      if (cell.field?.isHeader) {
        headerMap.set((cell.field.text || "").trim(), cell.field);
      }
    });
  });

  console.log("🏷 HeaderMap:", headerMap);

  // 🔥 Build rowId → builderRow map
const builderRowMap = new Map();

(this.tableRows || []).forEach(row => {
  builderRowMap.set(row.id, row);
});

console.log("🗂 builderRowMap:", builderRowMap);

  Object.keys(pages).forEach((pageNumber, index) => {

    const viewPage = Number(pageNumber);
    console.log(`\n📌 Processing Page: ${viewPage}`);

    const pageClone = originalContainer.cloneNode(true);

    const popupHeader = pageClone.querySelector(".view-popup-header");
    if (popupHeader) popupHeader.remove();

    const actions = pageClone.querySelector(".view-popup-actions");
    if (actions) actions.remove();

    const scrollContainer = pageClone.querySelector(".view-popup-table-container");
    if (scrollContainer) {
      scrollContainer.style.maxHeight = "none";
      scrollContainer.style.overflow = "visible";
      scrollContainer.style.height = "auto";
    }

    const allRows = pageClone.querySelectorAll(".form-row");

    console.log("🔢 Total rows in clone:", allRows.length);

    let structuredRows = [];

    allRows.forEach((rowEl, rowIndex) => {

      const rowId = rowEl.getAttribute("data-row-id");

      if (!pages[viewPage].includes(rowId)) {
        console.log("❌ Removing row (not in page):", rowId);
        rowEl.remove();
        return;
      }

      console.log("✅ Keeping row:", rowId);

      let cells = rowEl.querySelectorAll(".table-cell");

      if (!cells || cells.length === 0) {
        console.log("⚠️ No .table-cell found, using children");
        cells = rowEl.children;
      }

      let rowData = [];

Array.from(cells).forEach((cell, colIndex) => {

  const cellText = (cell.innerText || "").trim();

  let content = cell.innerHTML || "&nbsp;";

  const builderRow = builderRowMap.get(rowId);
  const builderCell = builderRow?.cells?.[colIndex];
  const field = builderCell?.field;

  const isTableBlock = field?.isTableBlock;

  // =========================
  // 🔥 RICH TEXT (FIXED)
  // =========================
 if (field?.dataType === "Rich Text") {

  console.log("🟢 [RICH TEXT DETECTED]");
  console.log("➡️ RowId:", rowId);
  console.log("➡️ ColIndex:", colIndex);
  console.log("➡️ Field Object:", JSON.parse(JSON.stringify(field)));

  // 🔍 DATA SOURCES
  const richFromField = field.richTextContent;
  const fallbackValue = field.value;
  const domContent = cell.innerHTML;

  console.log("📊 RichText Sources:");
  console.log("   field.richTextContent:", richFromField);
  console.log("   field.value:", fallbackValue);
  console.log("   DOM innerHTML:", domContent);

  let finalRichText = richFromField || fallbackValue || "";

  if (!finalRichText) {
    console.warn("⚠️ EMPTY RICH TEXT DETECTED → Using fallback");
  }

  // 🔍 LENGTH CHECK
  console.log("📏 RichText Length:", finalRichText.length);

  // 🔍 PREVIEW
  console.log("🧾 RichText Preview:", finalRichText.substring(0, 200));

  // 🔥 FINAL HTML (CORRECT STRUCTURE)
content = `
  <div class="field-label">
    ${field.label || ''}
  </div>

  <div class="field-value">
    <div class="ql-container ql-snow">
      <div class="ql-editor">
        ${finalRichText}
      </div>
    </div>
  </div>
`;
}

  // =========================
  // 🔥 HEADER
  // =========================
  else if (headerMap.has(cellText)) {

    const headerField = headerMap.get(cellText);

    content = `
      <div style="
        ${headerField.inlineStyle || ""}
        width:100%;
        display:block;
      ">
        ${headerField.text}
      </div>
    `;
  }

  rowData.push({
    colspan: cell.getAttribute("colspan") || 1,
    rowspan: cell.getAttribute("rowspan") || 1,
    content,
    isTableBlock 
  });
});

      if (rowData.length > 0) {

  const isTableRow = rowData.some(cell => cell.isTableBlock);

  structuredRows.push({
    cells: rowData,
    isTableRow
  });
}

      rowEl.remove();
    });

    console.log("📊 StructuredRows count:", structuredRows.length);

    // ============================================
// BUILD GRID (REPLACED TABLE WITH FLEX)
// ============================================

let tableHtml = "";

if (structuredRows.length > 0) {

  tableHtml += `<div class="print-grid">`;

  structuredRows.forEach((rowObj, rIndex) => {

  console.log("🧱 Building row:", rIndex);

  // 🔥 TABLE BLOCK ROW
  if (rowObj.isTableRow) {

    console.log("📊 Rendering TABLE BLOCK row");

    // 🔥 WRAP TABLE TO PREVENT PAGE BREAK SPLIT
tableHtml += `<div class="table-block-wrapper">`;

tableHtml += `<table class="print-table-block">`;

rowObj.cells.forEach(cell => {
  tableHtml += `
    <tr>
      <td colspan="${cell.colspan}" rowspan="${cell.rowspan}">
        ${cell.content}
      </td>
    </tr>
  `;
});

tableHtml += `</table>`;
tableHtml += `</div>`;
  }

  // 🔥 NORMAL ROW (FLEX)
  else {

    tableHtml += `<div class="print-row">`;

    rowObj.cells.forEach(cell => {
      tableHtml += `
        <div class="print-cell"
             style="flex:${cell.colspan};">
          ${cell.content}
        </div>
      `;
    });

    tableHtml += `</div>`;
  }

});

  tableHtml += `</div>`;

} else {
  console.warn("⚠️ No structured rows → fallback");
  tableHtml = `<div style="padding:10px;">No data available</div>`;
}

    const gridContainer = pageClone.querySelector(".view-grid-container");

    if (gridContainer) {
      console.log("📥 Injecting table HTML into gridContainer");
      gridContainer.innerHTML = tableHtml;
    } else {
      console.error("❌ gridContainer not found");
    }

    let headerHtml = "";

    if (index === 0) {
      console.log("🏷 Adding print header");

      headerHtml = `
        <div class="print-header">
          ${this.orgLogoUrl ? `<img src="${this.orgLogoUrl}" class="print-logo"/>` : ""}

          <div class="print-header-text">
            <div class="print-title">${this.selectedFormTitle || ""}</div>
            <div class="print-meta">
              ${this.staffNameToDisplay || ""} | ${this.selectedSubmissionDate || ""}
            </div>
          </div>
        </div>
      `;
    }

    finalHtml += `
      <div class="view-page">
        ${headerHtml}
        ${pageClone.outerHTML}
      </div>
    `;
  });

  console.log("✅ Final HTML generated");

  return finalHtml;
}


getFullCssForPrint() {

  return `

    * {
      box-sizing: border-box;
    }

    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
      page-break-inside: avoid;
    }
@page {
  size: A4;
  margin: 10mm 10mm 18mm 10mm;

  @bottom-left {
    content: "${this.orgName || ''}";
       font-size: 13px;     
    font-weight: 600;     
    color: #003466; 

    background: linear-gradient(to top, #003466 1px, transparent 1px);
    background-repeat: no-repeat;
    background-size: 100% 1px;
    background-position: top;
    padding-top: 4px;
  }

  @bottom-right {
    content: "Page " counter(page);
       font-size: 13px;     
    font-weight: 600;     
    color: #003466; 

    background: linear-gradient(to top, #003466 1px, transparent 1px);
    background-repeat: no-repeat;
    background-size: 100% 1px;
    background-position: top;
    padding-top: 4px;
  }
}

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    /* HEADER */

    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      border-bottom: 2px solid #003466;
      padding-bottom: 6px;
    }

   /* .print-logo {
      max-height: 40px;
      width: auto;
      max-width: 120px;
    }
      */

    .print-logo {
      height: auto;
      width: auto;

      max-height: 70px; 
      max-width: 30%;    

      object-fit: contain;
    }

    .print-header-text {
      text-align: right;
    }

    .print-title {
      font-size: 18px;
      font-weight: bold;
      color: #003466;
    }

    .print-meta {
      font-size: 12px;
      color: #555;
    }

    /* PAGE */

    .view-page {
      width: 100%;
      margin-bottom: 20px;
      page-break-after: auto;
    }

    /* FOOTER (OPTIONAL VISUAL ONLY) */

    .print-footer {
      margin-top: 10px;
      border-top: 2px solid #003466;
      padding-top: 4px;
      font-size: 11px;
      display: flex;
      justify-content: space-between;
    }



    /* GRID */

    .form-row {
      display: block !important;
  width: 100% !important;
      margin-bottom: 8px;
      page-break-inside: auto;
    }

    .form-field-card,
    .field-value {
      page-break-inside: avoid;
      width: 100%;
    }

    /* CONTAINER */

    .view-popup-content {
      width: 100% !important;
      max-width: none !important;
      margin: 0;
      padding: 0;
      box-shadow: none !important;
    }

    .view-popup-table-container {
      max-height: none !important;
      overflow: visible !important;
      height: auto !important;
    }

    /* FIELD */

    .field-label {
  text-transform: uppercase !important;
  font-size: 12px;
  color: #6b778c;
  margin-bottom: 4px;
  font-weight: 600;
  page-break-after: avoid !important;
  break-after: avoid !important;
}



.field-value {
  background: #dfe6f1 !important;
  padding: 12px !important;
  border-radius: 6px !important;
  font-size: 13px;

  /* 🔥 KEY FIX */
  width: auto !important;
  display: block;
}

/* ============================================
   🔥 FLEX LAYOUT FIX (DO NOT REMOVE EXISTING CSS)
============================================ */

.print-grid {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
}

.print-row {
  display: flex !important;
  width: 100% !important;
  gap: 16px;
  margin-bottom: 16px;
}

.print-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
   page-break-inside: avoid !important;
  break-inside: avoid !important;
}

/* ============================================
   🔥 REMOVE ALL BORDERS (GLOBAL OVERRIDE)
============================================ */

.print-grid,
.print-row,
.print-cell {
  border: none !important;
}

.print-grid * {
  border: none !important;
}

.table-block-wrapper {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

/* 🔥 FIX TABLE BLOCK RENDERING */

.print-table-block {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

.print-table-block td {
  border: 1px solid #003466;
  padding: 6px;
  vertical-align: top;
}

.print-table-block th {
  border: 1px solid #003466;
  background: #003466;
  color: white;
}

.print-cell:has(.print-table-block) {
  page-break-inside: avoid !important;
}

/* ============================================
   🔥 PREVENT COLUMN SHRINK
============================================ */

.print-cell {
  min-width: 0 !important;
}

/* ============================================
   🔥 FIX IMAGE + QR ALIGNMENT
============================================ */

.print-cell img {
  max-width: 100% !important;
  height: auto !important;
}

/* ============================================
   🔥 RICH TEXT WIDTH FIX
============================================ */

.ql-container,
.ql-editor {
  width: 100% !important;
}

/* ✅ ONLY TABLE BLOCKS → WITH BORDERS */
table:not(.print-grid) {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #003466;
}

table:not(.print-grid) th {
  background: #003466 !important;
  color: white !important;
  padding: 6px;
  font-size: 12px;
  border: 1px solid #003466;
}

/* ❌ remove border from main grid only */
.print-grid td {
  border: none !important;
}

/* ✅ APPLY BORDER TO NESTED TABLES */
.print-grid table td,
.print-grid table th {
  border: 1px solid #003466 !important;
}

.print-grid table {
  border: 1px solid #003466 !important;
  border-collapse: collapse;
}


tr {
  page-break-inside: auto !important;
}

td {
  page-break-inside: auto !important;
}


    /* RICH TEXT */

    .ql-editor {
      padding: 0 !important;
      font-size: 13px;
      word-break: break-word;
      page-break-inside: auto !important;
  break-inside: auto !important;
      width: 100%;
    }

    .ql-editor p,
.ql-editor li {
  page-break-inside: avoid;
  break-inside: avoid;
}

  `;
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
  const cellId = String(event.target.dataset.id);
  const selectedValue = event.target.value;

  const buildUpdatedCell = (cell) => {

    const field = { ...(cell.field || {}) };

    const sourceOptions =
      cell.radioOptionsProcessed ||
      field.radioOptions ||
      [];

    const selectedOptionObj = sourceOptions.find(
      opt => String(opt.optionLabel) === String(selectedValue)
    );

    field.value = {
      selectedOption: selectedValue,
      subType: selectedOptionObj?.subType || "",
      subValue: "",
      subLabel: ""
    };

    const radioOptionsProcessed = sourceOptions.map(option => {

      const isSelected =
        String(selectedValue) === String(option.optionLabel);

      return {
        ...option,
        isSelected,
        processedSubOptions: option.processedSubOptions || [],
        isDropdown: option.subType === "dropdown",
        isTextInput: option.subType === "text",
        isRadioList: option.subType === "radio",
        hasSubInput: option.hasSubInput || false
      };
    });

    field.radioOptions = radioOptionsProcessed;
    field.radioOptionsProcessed = radioOptionsProcessed;

    return {
      ...cell,
      field,
      selectedRadioOption: selectedValue,
      subInputValue: "",
      radioOptionsProcessed
    };
  };

  const syncTableBlock = (config, updaterFn) => {

    /* STEP 1: update renderRows */
    (config.renderRows || []).forEach(r => {
      (r.renderCells || []).forEach(c => {
        if (String(c.id) === cellId) {
          Object.assign(c, updaterFn(c));
        }
      });
    });

    /* STEP 2: renderRows → innerCells */
    const flatRender = config.renderRows.flatMap(r => r.renderCells || []);

    (config.innerCells || []).forEach(r => {
      (r.cells || []).forEach(c => {

        const match = flatRender.find(rc => String(rc.id) === String(c.id));

        if (match) {
          Object.assign(c, {
            ...match,
            field: { ...match.field }
          });
        }

      });
    });

    /* STEP 3: innerCells → renderRows */
    const flatInner = config.innerCells.flatMap(r => r.cells || []);

    (config.renderRows || []).forEach(r => {
      (r.renderCells || []).forEach(rc => {

        const match = flatInner.find(ic => String(ic.id) === String(rc.id));

        if (match) {
          Object.assign(rc, {
            ...match,
            field: { ...match.field }
          });
        }

      });
    });
  };

  const updateRow = (row) => {
    if (!row?.cells) return row;

    return {
      ...row,
      cells: row.cells.map(cell => {

        /* MAIN GRID */
        if (String(cell.id) === cellId) {
          Object.assign(cell, buildUpdatedCell(cell));
          return cell;
        }

        /* TABLE BLOCK */
        if (cell?.isTableBlock && cell?.field?.tableConfig) {

          syncTableBlock(cell.field.tableConfig, buildUpdatedCell);
          return cell;
        }

        return cell;
      })
    };
  };

  this.tableRows = this.tableRows.map(updateRow);

  this.stepPagedRows = JSON.parse(
    JSON.stringify(this.stepPagedRows.map(page => page.map(updateRow)))
  );
}


// handleRadioSubInputChange(event) {
//   const cellId = String(event.target.dataset.id);
//   const subValueRaw = event.target.value;

//   const applySubChangeToCell = (cell) => {

//     const field = { ...(cell.field || {}) };

//     const selectedRadio =
//       cell.selectedRadioOption ||
//       field.value?.selectedOption ||
//       "";

//     const sourceOptions =
//       cell.radioOptionsProcessed ||
//       field.radioOptions ||
//       [];

//     const selectedOption = sourceOptions.find(
//       o => String(o.optionLabel) === String(selectedRadio)
//     );

//     const subType = selectedOption?.subType || "text";

//     let subValue = "";
//     let subLabel = "";

//     if (subType === "text") {
//       subValue = subValueRaw;
//       subLabel = subValueRaw;
//     }

//     if (subType === "dropdown") {

//       if (selectedOption?.usePredefinedOptions) {

//         let source = [];

//         const type = selectedOption.selectedPredefined?.toLowerCase();

//         if (type === "staff") source = this.staffOptions;
//         if (type === "participant") {
//           source = this.participants.map(p => ({
//             label: p.Name,
//             value: p.Id
//           }));
//         }
//         if (type === "facility") source = this.facilityOptions;

//         const match = source.find(
//           o => String(o.value) === String(subValueRaw)
//         );

//         subValue = match?.value || "";
//         subLabel = match?.label || "";
//       } else {
//         subValue = subValueRaw;
//         subLabel = subValueRaw;
//       }
//     }

//     if (subType === "radio") {
//       subValue = subValueRaw;
//       subLabel = subValueRaw;
//     }

//     field.value = {
//       selectedOption: selectedRadio,
//       subType,
//       subValue,
//       subLabel
//     };

//     const updatedProcessed = sourceOptions.map(opt => {

//       const isMainSelected =
//         String(opt.optionLabel) === String(selectedRadio);

//       if (!isMainSelected) {
//         return {
//           ...opt,
//           isSelected: false
//         };
//       }

//       let processedSubOptions = [];

//       if (opt.usePredefinedOptions) {

//         const type = (opt.selectedPredefined || "").toLowerCase();

//         let source = [];

//         if (type === "staff") source = this.staffOptions || [];
//         if (type === "participant") {
//           source = (this.participants || []).map(p => ({
//             label: p.Name,
//             value: p.Id
//           }));
//         }
//         if (type === "facility") source = this.facilityOptions || [];

//         processedSubOptions = source.map(o => ({
//           label: o.label,
//           value: o.value ?? o.label,
//           isSelected:
//             String(subValue) === String(o.value) ||
//             String(subValue) === String(o.label)
//         }));

//       } else {

//         processedSubOptions = (opt.values || []).map(v => ({
//           label: v,
//           value: v,
//           isSelected: String(subValue) === String(v)
//         }));

//       }

//       return {
//         ...opt,
//         isSelected: true,
//         processedSubOptions,
//         isDropdown: opt.subType === "dropdown",
//         isTextInput: opt.subType === "text",
//         isRadioList: opt.subType === "radio",
//         hasSubInput: opt.hasSubInput || false,
//         subQuestion: opt.subQuestion || ""
//       };
//     });

//     field.radioOptions = updatedProcessed;
//     field.radioOptionsProcessed = updatedProcessed;

//     return {
//       ...cell,
//       field,
//       subInputValue: subValue,
//       selectedRadioOption: selectedRadio,
//       radioOptionsProcessed: updatedProcessed
//     };
//   };

//   const syncTableBlock = (config, updaterFn) => {

//     (config.renderRows || []).forEach(r => {
//       (r.renderCells || []).forEach(c => {
//         if (String(c.id) === cellId) {
//           Object.assign(c, updaterFn(c));
//         }
//       });
//     });

//     const flatRender = config.renderRows.flatMap(r => r.renderCells || []);

//     (config.innerCells || []).forEach(r => {
//       (r.cells || []).forEach(c => {

//         const match = flatRender.find(rc => String(rc.id) === String(c.id));

//         if (match) {
//           Object.assign(c, {
//             ...match,
//             field: { ...match.field }
//           });
//         }

//       });
//     });

//     const flatInner = config.innerCells.flatMap(r => r.cells || []);

//     (config.renderRows || []).forEach(r => {
//       (r.renderCells || []).forEach(rc => {

//         const match = flatInner.find(ic => String(ic.id) === String(rc.id));

//         if (match) {
//           Object.assign(rc, {
//             ...match,
//             field: { ...match.field }
//           });
//         }

//       });
//     });
//   };

//   const updateRow = (row) => {
//     if (!row?.cells) return row;

//     return {
//       ...row,
//       cells: row.cells.map(cell => {

//         if (String(cell.id) === cellId) {
//           Object.assign(cell, applySubChangeToCell(cell));
//           return cell;
//         }

//         if (cell?.isTableBlock && cell?.field?.tableConfig) {
//           syncTableBlock(cell.field.tableConfig, applySubChangeToCell);
//           return cell;
//         }

//         return cell;
//       })
//     };
//   };

//   this.tableRows = this.tableRows.map(updateRow);

//   this.stepPagedRows = JSON.parse(
//     JSON.stringify(this.stepPagedRows.map(page => page.map(updateRow)))
//   );
// }

handleRadioSubInputChange(event) {
  const cellId = String(event.target.dataset.id);
  const subValueRaw = event.target.value;

  console.log("🟡 Radio SubInput Change Triggered");
  console.log("➡️ cellId:", cellId);
  console.log("➡️ subValueRaw (ID):", subValueRaw);

  const applySubChangeToCell = (cell) => {

    const field = { ...(cell.field || {}) };

    const selectedRadio =
      cell.selectedRadioOption ||
      field.value?.selectedOption ||
      "";

    console.log("🔹 Selected Radio Option:", selectedRadio);

    const sourceOptions =
      cell.radioOptionsProcessed ||
      field.radioOptions ||
      [];

    const selectedOption = sourceOptions.find(
      o => String(o.optionLabel) === String(selectedRadio)
    );

    console.log("🔹 Selected Option Object:", selectedOption);

    const subType = selectedOption?.subType || "text";
    console.log("🔹 SubType:", subType);

    let subValue = "";
    let subLabel = "";

    /* ================= TEXT ================= */
    if (subType === "text") {
      subValue = subValueRaw;
      subLabel = subValueRaw;
    }

    /* ================= DROPDOWN ================= */
    if (subType === "dropdown") {

      if (selectedOption?.usePredefinedOptions) {

        let source = [];

        const type = selectedOption.selectedPredefined?.toLowerCase();
        console.log("📦 Predefined Type:", type);

        if (type === "staff") source = this.staffOptions || [];
        if (type === "participant") {
          source = (this.participants || []).map(p => ({
            label: p.Name,
            value: p.Id
          }));
        }
        if (type === "facility") source = this.facilityOptions || [];

        console.log("📦 Source Options:", source);

        const match = source.find(
          o => String(o.value) === String(subValueRaw)
        );

        console.log("🔍 Match Found:", match);

        if (match) {
          subValue = match.value;
          subLabel = match.label;

          console.log("✅ Matched Value:", subValue);
          console.log("✅ Matched Label:", subLabel);

        } else {
          console.warn("⚠️ No match found for ID:", subValueRaw);
          subValue = subValueRaw;
          subLabel = subValueRaw;
        }

      } else {
        subValue = subValueRaw;
        subLabel = subValueRaw;
      }
    }

    /* ================= RADIO ================= */
    if (subType === "radio") {
      subValue = subValueRaw;
      subLabel = subValueRaw;
    }

    /* ================= FINAL VALUE ================= */
    field.value = {
      selectedOption: selectedRadio,
      subType,
      subValue,
      subLabel
    };

    console.log("💾 Final Stored Value:", field.value);

    const updatedProcessed = sourceOptions.map(opt => {

      const isMainSelected =
        String(opt.optionLabel) === String(selectedRadio);

      if (!isMainSelected) {
        return {
          ...opt,
          isSelected: false
        };
      }

      let processedSubOptions = [];

      if (opt.usePredefinedOptions) {

        const type = (opt.selectedPredefined || "").toLowerCase();

        let source = [];

        if (type === "staff") source = this.staffOptions || [];
        if (type === "participant") {
          source = (this.participants || []).map(p => ({
            label: p.Name,
            value: p.Id
          }));
        }
        if (type === "facility") source = this.facilityOptions || [];

        processedSubOptions = source.map(o => ({
          label: o.label,
          value: o.value ?? o.label,
          isSelected: String(subValue) === String(o.value)
        }));

      } else {

        processedSubOptions = (opt.values || []).map(v => ({
          label: v,
          value: v,
          isSelected: String(subValue) === String(v)
        }));

      }

      return {
        ...opt,
        isSelected: true,
        processedSubOptions,
        isDropdown: opt.subType === "dropdown",
        isTextInput: opt.subType === "text",
        isRadioList: opt.subType === "radio",
        hasSubInput: opt.hasSubInput || false,
        subQuestion: opt.subQuestion || ""
      };
    });

    field.radioOptions = updatedProcessed;
    field.radioOptionsProcessed = updatedProcessed;

    return {
      ...cell,
      field,
      subInputValue: subValue,
      selectedRadioOption: selectedRadio,
      radioOptionsProcessed: updatedProcessed
    };
  };

  const syncTableBlock = (config, updaterFn) => {

    (config.renderRows || []).forEach(r => {
      (r.renderCells || []).forEach(c => {
        if (String(c.id) === cellId) {
          Object.assign(c, updaterFn(c));
        }
      });
    });

    const flatRender = config.renderRows.flatMap(r => r.renderCells || []);

    (config.innerCells || []).forEach(r => {
      (r.cells || []).forEach(c => {

        const match = flatRender.find(rc => String(rc.id) === String(c.id));

        if (match) {
          Object.assign(c, {
            ...match,
            field: { ...match.field }
          });
        }

      });
    });

    const flatInner = config.innerCells.flatMap(r => r.cells || []);

    (config.renderRows || []).forEach(r => {
      (r.renderCells || []).forEach(rc => {

        const match = flatInner.find(ic => String(ic.id) === String(rc.id));

        if (match) {
          Object.assign(rc, {
            ...match,
            field: { ...match.field }
          });
        }

      });
    });
  };

  const updateRow = (row) => {
    if (!row?.cells) return row;

    return {
      ...row,
      cells: row.cells.map(cell => {

        if (String(cell.id) === cellId) {
          Object.assign(cell, applySubChangeToCell(cell));
          return cell;
        }

        if (cell?.isTableBlock && cell?.field?.tableConfig) {
          syncTableBlock(cell.field.tableConfig, applySubChangeToCell);
          return cell;
        }

        return cell;
      })
    };
  };

  this.tableRows = this.tableRows.map(updateRow);

  this.stepPagedRows = JSON.parse(
    JSON.stringify(this.stepPagedRows.map(page => page.map(updateRow)))
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




// async handleDeleteUploadedFile(evt) {
//   evt.preventDefault();
//   console.log("[PARENT DELETE] called");

//   const cellId = evt.currentTarget?.dataset?.cellid;
//   const index = Number(evt.currentTarget?.dataset?.index);
//   const keyFromBtn = evt.currentTarget?.dataset?.key; // preferred
//   const fileIdFromBtn = evt.currentTarget?.dataset?.fileid;
//   const urlFromBtn = evt.currentTarget?.dataset?.url;

//   if (!cellId || Number.isNaN(index)) return;

//   // Helper: find key/url from current JSON if not provided
//   const deriveFromCell = (cell) => {
//     const f = cell?.field || {};
//     const key =
//       keyFromBtn ||
//       (Array.isArray(f?.meta?.uploadedFiles) ? f.meta.uploadedFiles[index]?.key : null) ||
//       (Array.isArray(f?.s3Key) ? f.s3Key[index] : null);

//     const url =
//       urlFromBtn ||
//       (Array.isArray(f?.meta?.uploadedFiles) ? f.meta.uploadedFiles[index]?.url : null) ||
//       (Array.isArray(f?.urls) ? f.urls[index] : null) ||
//       (Array.isArray(f?.value) ? f.value[index] : null);

//     const fileId =
//       fileIdFromBtn ||
//       (Array.isArray(f?.meta?.uploadedFiles) ? f.meta.uploadedFiles[index]?.fileId : null);

//     return { key, url, fileId };
//   };

//   // Find the current cell snapshot (from tableRows first)
//   let snapshot = null;
//   (this.tableRows || []).some((row) =>
//     row.cells.some((c) => {
//       if (c.id === cellId) {
//         snapshot = c;
//         return true;
//       }
//       return false;
//     })
//   );

//   if (!snapshot) {
//     console.warn("[PARENT DELETE] cell not found:", cellId);
//     return;
//   }

//   const { key, url } = deriveFromCell(snapshot);

//   if (!key) {
//     console.warn("[PARENT DELETE] Missing key; cannot delete from AWS. cellId:", cellId, "index:", index);
//     return;
//   }

//   // Optional: you can set a local "deleting" state here if you want (UI spinner)
//   // but keeping minimal since you said production.

//   try {
//     const resp = await fetch(ENDPOINTS.delete, {
//       method: "DELETE",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ key })
//     });

//     const text = await resp.text();
//     let json;
//     try {
//       json = JSON.parse(text);
//     } catch {
//       json = null;
//     }

//     if (!resp.ok) throw new Error(json?.error || `Delete failed ${resp.status}: ${text}`);

//     console.log("[PARENT DELETE] AWS delete success:", json);

//     // Remove from JSON arrays consistently (by index / key / url)
//     const applyRemoval = (cell) => {
//       if (cell.id !== cellId || cell.field?.dataType !== "Upload File") return cell;

//       const f = { ...(cell.field || {}) };

//       const uploaded = Array.isArray(f.meta?.uploadedFiles) ? [...f.meta.uploadedFiles] : [];
//       const nextUploaded = uploaded.filter((u, i) => {
//         if (i === index) return false;
//         if (key && u?.key === key) return false;
//         if (url && u?.url === url) return false;
//         return true;
//       });

//       const spliceSafe = (arr) => {
//         const a = Array.isArray(arr) ? [...arr] : [];
//         if (a.length > index) a.splice(index, 1);
//         // also remove any exact matches if present
//         return a.filter((x) => (key ? x !== key : true)).filter((x) => (url ? x !== url : true));
//       };

//       const nextValue = spliceSafe(f.value);
//       const nextUrls = spliceSafe(f.urls);
//       const nextDownload = spliceSafe(f.downloadLink);
//       const nextKeys = spliceSafe(f.s3Key);

//       const nextNames = nextUploaded.map((u) => u?.originalName).filter(Boolean);

//       return {
//         ...cell,
//         field: {
//           ...f,
//           value: nextValue,
//           urls: nextUrls,
//           downloadLink: nextDownload,
//           s3Key: nextKeys,
//           fileName: nextNames.join(", "),
//           contentType:
//             nextValue.length === 1 ? (nextUploaded[0]?.type || null) : (nextValue.length ? "multiple" : null),
//           meta: {
//             ...(f.meta || {}),
//             uploadedFiles: nextUploaded
//           }
//         }
//       };
//     };

//     // Update tableRows
//     this.tableRows = (this.tableRows || []).map((row) => ({
//       ...row,
//       cells: row.cells.map(applyRemoval)
//     }));

//     // Update stepPagedRows
//     this.stepPagedRows = (this.stepPagedRows || []).map((page) =>
//       page.map((row) => ({
//         ...row,
//         cells: row.cells.map(applyRemoval)
//       }))
//     );
//   } catch (e) {
//     console.error("[PARENT DELETE] error:", e);
//     // Optional: show toast
//     // this.showToast("Delete failed", e.message, "error");
//   }
// }

async handleDeleteUploadedFile(evt) {
  evt.preventDefault();
  console.log("[DELETE] triggered");

  const cellId = evt.currentTarget?.dataset?.cellid;
  const keyFromBtn = evt.currentTarget?.dataset?.key;
  const urlFromBtn = evt.currentTarget?.dataset?.url;

  if (!cellId) return;

  let key = keyFromBtn;
  let url = urlFromBtn;

  // ============================================
  // 🔍 FIND CELL (MAIN + TABLE BLOCK)
  // ============================================
  const findCell = () => {
    for (const row of this.tableRows || []) {
      for (const cell of row.cells) {

        if (cell.id === cellId) return cell;

        if (cell?.isTableBlock && cell?.field?.tableConfig) {
          const config = cell.field.tableConfig;

          for (const tRow of config.renderRows || []) {
            for (const tCell of tRow.renderCells || []) {
              if (tCell.id === cellId) return tCell;
            }
          }

          for (const iRow of config.innerCells || []) {
            for (const iCell of iRow.cells || []) {
              if (iCell.id === cellId) return iCell;
            }
          }
        }
      }
    }
    return null;
  };

  const targetCell = findCell();

  if (!targetCell) {
    console.warn("[DELETE] cell not found:", cellId);
    return;
  }

  const f = targetCell.field || {};

  // ============================================
  // 🔑 FIX KEY (CRITICAL)
  // ============================================
  if (!key || !key.includes("/")) {
    console.warn("[DELETE] Fixing invalid key from button");

    const uploaded = f.meta?.uploadedFiles || [];

    const valid = uploaded.find(u => u?.key && key?.endsWith(u.key));
    if (valid) {
      key = valid.key;
      url = valid.url;
    } else if (Array.isArray(f.s3Key)) {
      key = f.s3Key.find(k => k?.includes("/"));
    }
  }

  console.log("[DELETE DEBUG]", { cellId, key, url });

  // ============================================
  // 🌐 AWS DELETE
  // ============================================
  if (key && key.includes("/")) {
    try {
      const resp = await fetch(ENDPOINTS.delete, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });

      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); } catch {}

      if (!resp.ok && resp.status !== 404) {
        throw new Error(json?.error || `Delete failed ${resp.status}`);
      }

      if (resp.status === 404) {
        console.warn("[DELETE] File already missing in AWS");
      } else {
        console.log("[DELETE] AWS success:", json);
      }

    } catch (e) {
      console.warn("[DELETE] AWS error (ignored):", e);
    }
  }

  // ============================================
  // 🧹 REMOVE FILE FROM FIELD
  // ============================================
  const removeFromField = (field) => {
    if (!field) return field;

    const uploaded = field.meta?.uploadedFiles || [];

    const nextUploaded = uploaded.filter(u => {
      const matchByKey = u.key === key || key?.endsWith(u.key);
      const matchByUrl = u.url === url;
      return !(matchByKey || matchByUrl);
    });

    return {
      ...field,
      value: (field.value || []).filter(v => v !== url),
      urls: (field.urls || []).filter(v => v !== url),
      s3Key: (field.s3Key || []).filter(k => k !== key),
      downloadLink: (field.downloadLink || []).filter(v => v !== url),
      fileName: nextUploaded.map(f => f.originalName).join(", "),
      contentType:
        nextUploaded.length === 1
          ? nextUploaded[0]?.type || null
          : nextUploaded.length
          ? "multiple"
          : null,
      meta: {
        ...(field.meta || {}),
        uploadedFiles: nextUploaded
      }
    };
  };

  // ============================================
  // 🔥 TABLE BLOCK MUTATION (MATCH UPLOAD)
  // ============================================
  const mutateTableBlock = (config) => {

    (config.renderRows || []).forEach((tRow) => {
      (tRow.renderCells || []).forEach((tCell) => {
        if (tCell.id === cellId) {
          console.log("🔥 DELETE → renderRows");
          Object.assign(tCell, {
            ...tCell,
            field: removeFromField(tCell.field)
          });
        }
      });
    });

    (config.innerCells || []).forEach((iRow) => {
      (iRow.cells || []).forEach((iCell) => {
        if (iCell.id === cellId) {
          console.log("🔥 DELETE → innerCells");
          Object.assign(iCell, {
            ...iCell,
            field: removeFromField(iCell.field)
          });
        }
      });
    });

    return config;
  };

  // ============================================
  // 🔄 UPDATE tableRows
  // ============================================
  this.tableRows = (this.tableRows || []).map(row => ({
    ...row,
    cells: row.cells.map(cell => {

      // ✅ MAIN GRID (UNCHANGED)
      if (cell.id === cellId) {
        return { ...cell, field: removeFromField(cell.field) };
      }

      // 🔥 TABLE BLOCK FIX
      if (cell?.isTableBlock && cell?.field?.tableConfig) {
        mutateTableBlock(cell.field.tableConfig);
        return cell; // ⚠️ keep same reference
      }

      return cell;
    })
  }));

  // ============================================
  // 🔄 UPDATE stepPagedRows
  // ============================================
  this.stepPagedRows = (this.stepPagedRows || []).map(page =>
    page.map(row => ({
      ...row,
      cells: row.cells.map(cell => {

        if (cell.id === cellId) {
          return { ...cell, field: removeFromField(cell.field) };
        }

        if (cell?.isTableBlock && cell?.field?.tableConfig) {
          mutateTableBlock(cell.field.tableConfig);
          return cell; // ⚠️ same reference
        }

        return cell;
      })
    }))
  );

  // ============================================
  // ⚡ FORCE REACTIVITY
  // ============================================
  this.tableRows = [...this.tableRows];
  this.stepPagedRows = [...this.stepPagedRows];

  console.log("[DELETE] completed ✅ UI SHOULD UPDATE NOW");
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
      `CustomisableForms/${this.orgid}/Staff/${dateStr}/${folderType}/${fileName}.json`;

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
            return "status-pill status-completed";
        default:
            return "status-pill status-default";
    }
}


@track showSignatureModal = false;
@track activeSignatureCellId = null;
@track signatureMode = 'draw'; // draw | upload | type
@track signatureTypedText = '';
@track signaturePad; // later
@track pendingSignatureBase64 = '';
isDrawing = false;
signatureCanvas;
signatureCtx;

openSignatureModal(event) {
  const cellId = event.currentTarget.dataset.id;

  this.activeSignatureCellId = cellId;

  const cell = this.findCellById(cellId);

  console.log("🪄 Opening signature modal for edit:", {
    cellId,
    hasExisting: !!cell?.field?.value
  });

  // ⭐ preload existing signature
  if (cell?.field?.value) {
    this.pendingSignatureBase64 = cell.field.value;
  }

  this.showSignatureModal = true;
}

findCellById(cellId) {

    if (!cellId) return null;

    /* SEARCH MAIN GRID */

    for (const row of this.tableRows || []) {

        for (const cell of row.cells || []) {

            if (cell.id === cellId) {
                return cell;
            }

            /* SEARCH TABLE BLOCK */

            if (cell.isTableBlock && cell.tableConfig?.renderRows) {

                for (const tRow of cell.tableConfig.renderRows) {

                    for (const tCell of tRow.renderCells) {

                        if (tCell.id === cellId) {
                            return tCell;
                        }

                    }

                }

            }

        }

    }

    return null;
}

resetSignatureState() {
    // Clear typed signature
    this.signatureTypedText = '';

    // Clear uploaded image
    this.pendingSignatureBase64 = null;

    // Reset mode to default
    this.signatureMode = 'type';

    // Clear canvas safely
    this.clearDrawSignature();
}

closeSignatureModal() {
    this.resetSignatureState();
    this.showSignatureModal = false;
}
get signatureModeOptions() {
  return [
    { label: 'Draw', value: 'draw' },
    { label: 'Upload', value: 'upload' },
    { label: 'Type', value: 'type' }
  ];
}

get isDrawMode() { return this.signatureMode === 'draw'; }
get isUploadMode() { return this.signatureMode === 'upload'; }
get isTypeMode() { return this.signatureMode === 'type'; }

handleSignatureModeChange(e) {
  this.signatureMode = e.detail.value;
}
saveSignature() {
  console.group('💾 [Signature] saveSignature');

  let base64 = '';

  // UPLOAD
  if (this.signatureMode === 'upload') {
    base64 = this.pendingSignatureBase64;
    console.log('📤 Upload mode base64 length:', base64?.length);
  }

  // TYPE
  if (this.signatureMode === 'type') {
    base64 = this.generateTypedSignature(this.signatureTypedText);
    console.log('⌨️ Type mode base64 length:', base64?.length);
  }

  // DRAW
  if (this.signatureMode === 'draw' && this.signatureCanvas) {
    base64 = this.signatureCanvas.toDataURL('image/png');
    console.log('✍️ Draw mode base64 length:', base64?.length);
  }

  if (!base64) {
    console.warn('⚠️ No signature generated');
    console.groupEnd();
    return;
  }

  console.log('🎯 Active cell id:', this.activeSignatureCellId);

  // APPLY
  this.applySignatureToCell(base64);

  // FORCE REFRESH
  this.updateStepVisibleRows();

  this.showSignatureModal = false;
  this.resetSignatureState();

  console.log('✅ Signature saved and UI refresh triggered');
  console.groupEnd();
}



applySignatureToCell(base64) {
  console.group('🧩 [Signature] applySignatureToCell');

  let updated = false;

  (this.stepPagedRows || []).forEach((page) => {

    (page || []).forEach(row => {

      (row.cells || []).forEach(cell => {

        // ⭐ NORMAL CELL
        if (String(cell.id) === String(this.activeSignatureCellId)) {

          console.log('✅ Updating MAIN cell:', cell.id);
          cell.field.value = base64;
          updated = true;
        }

        // ⭐ TABLE BLOCK CELL
        if (cell.isTableBlock) {

          const tableConfig = cell.field?.tableConfig || {};

          // ⭐ 1. UPDATE renderRows (UI)
          if (tableConfig.renderRows) {

            tableConfig.renderRows.forEach(tRow => {

              (tRow.renderCells || []).forEach(tCell => {

                if (String(tCell.id) === String(this.activeSignatureCellId)) {

                  console.log('✅ Updating TABLE UI cell:', tCell.id);

                  if (!tCell.field) {
                    tCell.field = {};
                  }

                  tCell.field.value = base64;
                  updated = true;
                }

              });

            });

          }

          // ⭐ 2. UPDATE innerCells (DATA SOURCE — CRITICAL)
          if (tableConfig.innerCells) {

            tableConfig.innerCells.forEach(iRow => {

              (iRow.cells || []).forEach(iCell => {

                if (String(iCell.id) === String(this.activeSignatureCellId)) {

                  console.log('🔥 Syncing TABLE innerCell:', iCell.id);

                  if (!iCell.field) {
                    iCell.field = {};
                  }

                  iCell.field.value = base64;
                  updated = true;
                }

              });

            });

          }

        }

      });

    });

  });

  if (!updated) {
    console.warn('⚠️ No matching cell found for signature');
  }

  // ⭐ force deep reactivity
  this.stepPagedRows = JSON.parse(JSON.stringify(this.stepPagedRows));

  console.groupEnd();
}



selectSignatureMode(event) {
  this.signatureMode = event.currentTarget.dataset.mode;
}
get typeBtnClass() {
  return `signature-pill ${this.signatureMode === 'type' ? 'active' : ''}`;
}

get drawBtnClass() {
  return `signature-pill ${this.signatureMode === 'draw' ? 'active' : ''}`;
}

get uploadBtnClass() {
  return `signature-pill ${this.signatureMode === 'upload' ? 'active' : ''}`;
}
triggerSignatureFileInput() {
  const input = this.template.querySelector(
    'input[data-role="signature-upload"]'
  );
  if (input) {
    input.click();
  }
}
handleSignatureUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const base64 = reader.result;
    this.pendingSignatureBase64 = base64;
  };

  reader.readAsDataURL(file);
}

handleSignatureTyped(event) {
  this.signatureTypedText = event.target.value;
}
generateTypedSignature(text) {
  if (!text) return '';

  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 150;

  const ctx = canvas.getContext('2d');

  // white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // signature text
  ctx.fillStyle = '#000000';
  ctx.font = '40px "Brush Script MT", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL('image/png');
}
initializeSignaturePad() {


  const canvas = this.template.querySelector('.signature-canvas');
  if (!canvas) {
    console.warn('⚠️ [Signature] Canvas NOT found');
    return;
  }

  console.log('✅ [Signature] Canvas found');

  this.signatureCanvas = canvas;
  this.signatureCtx = canvas.getContext('2d');

  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  console.log('📏 [Signature] Canvas rect:', rect);
  console.log('📱 [Signature] DPR:', ratio);

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;

  this.signatureCtx.scale(ratio, ratio);

  this.signatureCtx.lineWidth = 2;
  this.signatureCtx.lineCap = 'round';
  this.signatureCtx.strokeStyle = '#000';

  console.log('🎯 [Signature] Context configured');

  // listeners
  canvas.addEventListener('mousedown', this.startDraw.bind(this));
  canvas.addEventListener('mousemove', this.draw.bind(this));
  canvas.addEventListener('mouseup', this.endDraw.bind(this));
  canvas.addEventListener('mouseleave', this.endDraw.bind(this));

  canvas.addEventListener('touchstart', this.startDraw.bind(this), { passive: false });
  canvas.addEventListener('touchmove', this.draw.bind(this), { passive: false });
  canvas.addEventListener('touchend', this.endDraw.bind(this));

  console.log('🔗 [Signature] Event listeners attached');
}


getCanvasPos(event) {
  const rect = this.signatureCanvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

startDraw(event) {
  console.log('🟢 [Signature] startDraw fired');

  event.preventDefault();
  this.isDrawing = true;

  const pos = this.getCanvasPos(event);
  console.log('📍 [Signature] Start position:', pos);

  this.signatureCtx.beginPath();
  this.signatureCtx.moveTo(pos.x, pos.y);
}



draw(event) {
  if (!this.isDrawing) return;
  event.preventDefault();

  const pos = this.getCanvasPos(event);
  this.signatureCtx.lineTo(pos.x, pos.y);
  this.signatureCtx.stroke();
}


endDraw(event) {
  this.isDrawing = false;
}



handleSignatureDelete(event) {
  console.group('🗑️ [Signature] handleSignatureDelete');

  const cellId = event.currentTarget.dataset.id;
  let cleared = false;

  (this.tableRows || []).forEach(row => {

    (row.cells || []).forEach(cell => {

      // ⭐ NORMAL CELL
      if (String(cell.id) === String(cellId)) {
        console.log('✅ Clearing MAIN cell:', cell.id);
        cell.field.value = '';
        cleared = true;
      }

      // ⭐ TABLE BLOCK CELL
      if (cell.isTableBlock && cell.tableConfig?.renderRows) {

        cell.tableConfig.renderRows.forEach(tRow => {

          (tRow.renderCells || []).forEach(tCell => {

            if (String(tCell.id) === String(cellId)) {

              console.log('✅ Clearing TABLE cell:', tCell.id);

              if (!tCell.field) {
                tCell.field = {};
              }

              tCell.field.value = '';

              cleared = true;
            }

          });

        });

      }

    });

  });

  if (!cleared) {
    console.warn('⚠️ No matching signature cell found:', cellId);
  }

  // ⭐ Force deep reactivity
  this.tableRows = JSON.parse(JSON.stringify(this.tableRows));

  console.groupEnd();
}

clearTypedSignature() {
  this.signatureTypedText = '';
}
clearDrawSignature() {
  if (!this.signatureCanvas || !this.signatureCtx) return;

  this.signatureCtx.clearRect(
    0,
    0,
    this.signatureCanvas.width,
    this.signatureCanvas.height
  );
}
clearUploadedSignature() {
  this.pendingSignatureBase64 = '';
}



handleTableBlockInput(event) {

    const parentId = event.target.dataset.parentId;
    const rowIndex = parseInt(event.target.dataset.row, 10);
    const colIndex = parseInt(event.target.dataset.col, 10);
    const value = event.detail.value;

    const page = this.tableRows || [];

    page.forEach(row => {

        row.cells.forEach(cell => {

            if (cell.id === parentId && cell.field?.dataType === "Table Block") {

                const tableConfig = cell.field.tableConfig;

                if (!tableConfig.cellValues) {
                    tableConfig.cellValues = {};
                }

                const key = `${rowIndex}-${colIndex}`;
                tableConfig.cellValues[key] = value;

                // matrix storage
                if (!Array.isArray(cell.field.value)) {
                    cell.field.value = [];
                }

                if (!Array.isArray(cell.field.value[rowIndex])) {
                    cell.field.value[rowIndex] = [];
                }

                cell.field.value[rowIndex][colIndex] = value;

                const matrix = cell.field.value;
                const columns = tableConfig.columns || [];
                const rowNames = tableConfig.rowNames || [];

                tableConfig.renderRows = matrix.map((r, rIndex) => ({
                    key: `row-${rIndex}`,
                    value: rowNames[rIndex]?.value || "",
                    renderCells: columns.map((col, cIndex) => {

                        if (col.isRowLabel) {
                            return {
                                key: `${rIndex}-label`,
                                isRowLabel: true,
                                cellValue: rowNames[rIndex]?.value || ""
                            };
                        }

                        return {
                            key: `${rIndex}-${cIndex}`,
                            isRowLabel: false,
                            cellValue: r?.[cIndex] || ""
                        };

                    })
                }));

            }

        });

    });

    // update visible page
    this.tableRows = [...page];

    // sync back to paged storage
    this.stepPagedRows = this.stepPagedRows.map((p, i) =>
        i === this.stepCurrentPageIndex ? JSON.parse(JSON.stringify(this.tableRows)) : p
    );
}


}