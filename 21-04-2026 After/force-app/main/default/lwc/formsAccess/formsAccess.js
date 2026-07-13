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
import getParticipantsFilter from "@salesforce/apex/FormController.getParticipantsFilter";
import getEmployeeData from "@salesforce/apex/issueRegisterSearch.getEmployeeData";
import getFacilityData from "@salesforce/apex/FormController.fetchFacilitiess";
import getAvailableForms from "@salesforce/apex/FormController.getAvailableForms";
import grantAccessToParticipants from "@salesforce/apex/FormController.grantAccessToParticipants";
import revokeAccessFromParticipants from "@salesforce/apex/FormController.revokeAccessFromParticipants";
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
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getFacilityCurrentUser from "@salesforce/apex/PortalUserController.getFacilityCurrentUser";
import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from "@salesforce/resourceUrl/jspdf";
import autoTable from "@salesforce/resourceUrl/autotable";
import StaticForms from "@salesforce/resourceUrl/Static_Forms";
import getFormResponsesFiltered from "@salesforce/apex/FormController.getFormResponsesFiltered";
import getOrgLogo from "@salesforce/apex/IncidentRegisterControllerV2.getOrgLogo";


const FORM_IMAGE_1 = `${StaticForms}/form1.png`;
const FORM_IMAGE_2 = `${StaticForms}/form2.png`;
let jsPDFLoaded = false;
const formImages = [FORM_IMAGE_1, FORM_IMAGE_2];

export default class FormRender extends LightningElement {
  @api viewmode;
  @track forms = [];
  @track allForms = [];
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
  @track selectedFormId = null;
  @track selectedParticipantIds = new Set();
  @track isAllParticipantsSelected = false;
  @track selectedAudience = 'Staff';
  @track orgLogoUrl = "";

  @track filteredFormResponses = [];
  formPageSizeOptions = [10, 15, 20, 25];
  @track manageFormsNew = false;

  get showSubmittedForms() {
    return this.viewmode === "submit";
  }

  get showCreatedForms() {
    return this.viewmode === "create";
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

cardFlag = true; 

get isCardView()   { return this.cardFlag; }
get isTableView()  { return !this.cardFlag; }

// Use Material Icons names: 'view_module' (cards), 'table_rows' (table)
get viewToggleIcon()  { return this.cardFlag ? 'table_rows' : 'view_module'; }
get viewToggleTitle() { return this.cardFlag ? 'Switch to Table View' : 'Switch to Card View'; }

// data-name on the icon (purely informational for the handler)
get viewToggleTarget() { return this.cardFlag ? 'tableview' : 'cardview'; }

// --- handler wired to the <i> icon ---
handleChangeview(event) {
  // prevent bubbling if button has other listeners
  event?.stopPropagation?.();

  const targetName = event?.currentTarget?.dataset?.name;
  // if a specific target is sent, honour it; else just toggle
  if (targetName === 'cardview')  this.cardFlag = true;
  else if (targetName === 'tableview') this.cardFlag = false;
  else this.cardFlag = !this.cardFlag;

  // persist (optional)
  try { localStorage.setItem('formsViewMode', this.cardFlag ? 'card' : 'table'); } catch (e) {}
}

  connectedCallback() {
    console.log("📌 Received Org ID in Chatter:", this.orgid);
    console.log("🔹 Received Client ID:", this.clientId);
    console.log("📌 Received viewmode:", this.viewmode);

   try {
    const saved = localStorage.getItem('formsViewMode');
    if (saved === 'card')  this.cardFlag = true;
    if (saved === 'table') this.cardFlag = false;
  } catch (e) {}

 if (this.orgid) {
  this.togglePublishedForms();

  // =============================
  // 🏢 LOAD ORG LOGO (FIXED)
  // =============================
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
  console.log('⏳ Waiting for org id before loading forms…');
}

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

    this._initialRefreshRequested = true;
    console.log('🚀 connectedCallback: will force a one-time server refresh after first wire emission');

    getCurrentLoggedUserInfo().then((userData) => {
      const storedFacilityId = localStorage.getItem("defaultFacilityId");
      const storedFacilityLabel = localStorage.getItem("defaultFacilityLabel");
      console.log("storedFacilityId local storage " + storedFacilityId);
      console.log("storedFacilityLabel local storage " + storedFacilityLabel);
      console.log("user data ==>", JSON.stringify(userData));

      const userType = userData.User_Type__c;
      this.loggedInUserType = userType;

      const isOrgAdmin = userType === "NDIS Org Admin";

      // 🔹 Shared promise (Org Admin or Facility Admin/Roster Manager)
      const facilityPromise = isOrgAdmin
        ? getFacilityData()
        : getFacilityCurrentUser();

      facilityPromise.then((facilityResponse) => {
        this.facilityOptions = facilityResponse.map((record) => {
          return isOrgAdmin
            ? { value: record.Id, label: record.Name }
            : { value: record.Facility__r.Id, label: record.Facility__r.Name };
        });

        // Shift times from org (from getFacilityData always)
        getFacilityData().then((orgResponse) => {
          this.organisationShiftTimes = orgResponse[0].Organisation__r;
        });

        this.facilityValue = [];

        if (this.facilityOptions.length > 0) {
          if (storedFacilityId) {
            this.facilityValue.push(storedFacilityId);
            this.SelectedComboBoxFacility = storedFacilityId;
          }

          // 🔹 Get all facility IDs from options
          this.allFacilityIds = this.facilityOptions.map((f) => f.value);
        }

        console.log(
          "facilityOptions ==> ",
          JSON.stringify(this.facilityOptions)
        );
        console.log("facilityValue (selected) ==> ", this.facilityValue);
        console.log("allFacilityIds (for Apex) ==> ", this.allFacilityIds);

        // ✅ Fetch participants (only one unified call)
        this.fetchParticipantsfilter(this.allFacilityIds);
      });
    });

     this._isConnected = true;
    // ✅ Trigger only when Client ID is NOT present
    if (!this.clientId) {
      this.fetchAllResponses();
    }


  }


async fetchAllResponses() {

  // 🔥 RESET DERIVED STATE BEFORE FETCH
  this.formPageNumber = 1;
  this.filteredFormResponses = [];
  this.paginatedFormResponses = [];
  this.totalFormRecords = 0;
  this.totalFormPages = 0;

  this.isLoading = true;

  try {

    const data = await getFormResponsesFiltered({
      audience: this.selectedAudience,
      orgId: this.orgid
    });

    if (!this._isConnected) return;

    console.log("🔄 fetchAllResponses returned:", data?.length);

    this.formResponses = data || [];

    // ⚠️ ALWAYS call process even if empty
    this.processFormResponses(this.formResponses);

  } catch (error) {

    if (!this._isConnected) return;

    console.error("❌ fetchAllResponses failed:", error);

  } finally {

    if (this._isConnected) {
      this.isLoading = false;
    }
  }
}






fetchParticipantsfilter(facilityIdList) {
  getParticipantsFilter({ facilityIds: facilityIdList })
    .then((data) => {
      const rows = Array.isArray(data) ? data : [];

      // 🔎 Summary: do any participants have staff?
      const withStaff = rows.filter(
        p => Array.isArray(p.staffMembers) && p.staffMembers.length > 0
      ).length;

      console.log(
        `📈 Any participant has staff? ${withStaff > 0 ? 'YES' : 'NO'} — ${withStaff}/${rows.length} have ≥1 staff.`
      );

      // =====================================================
      // 🔑 PRESERVE SELECTION STATE (CRITICAL FIX)
      // =====================================================
      const previousSelectionMap = new Map(
        (this.participantDataMaster || []).map(p => [p.Id, p.isSelected])
      );

      // MASTER (merge-by-Id)
      this.participantDataMaster = rows.map(p => ({
        ...p,
        isSelected: previousSelectionMap.get(p.Id) ?? false
      }));

      // -----------------------------------------------------
      // Back-compat mirrors (unchanged behavior)
      // -----------------------------------------------------
      this.participantData = [...this.participantDataMaster];
      this.participants    = [...this.participantDataMaster];

      // -----------------------------------------------------
      // Template gating + totals
      // -----------------------------------------------------
      this.totalRecords = this.participantDataMaster.length;
      this.totalParticipants = this.totalRecords;

      // -----------------------------------------------------
      // Reset search & paging (INTENTIONAL)
      // -----------------------------------------------------
      this.filteredParticipants = [];
      this.searchFormsAccessQuery = '';
      this.pageNumber = 1;

      console.log(
        '✅ Participants loaded:',
        this.totalRecords,
        'records',
        '| Selected:',
        this.participantDataMaster.filter(p => p.isSelected).length
      );

      // -----------------------------------------------------
      // Rebuild pagination + staff avatars
      // -----------------------------------------------------
      this.paginationHelper();
      this.tryAttach(); // re-join avatars to forms
    })
    .catch((error) => {
      console.error("❌ Error loading participants:", error);
    });
}




filterParticipants(list, qRaw) {
  const q = (qRaw || '').toLowerCase().trim();
  if (!q) return [...list];

  return list.filter((p) => {
    const name   = (p?.Name || '').toLowerCase();
    const status = (p?.Participant_Status__c || p?.Status__c || '').toLowerCase();
    const staffHit = (p?.visibleStaffMembers || []).some(
      s => ((s?.name || s?.Name || '').toLowerCase()).includes(q)
    );
    return name.includes(q) || status.includes(q) || staffHit;
  });
}


  renderedCallback() {
    // ✅ Set tooltip titles for labels
    console.log("🟢 viewmode:", this.viewmode);
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
                  const parsed = JSON.parse(form.Form_JSON__c);
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
              return {
                ...form,
                miniRows,
                formImageUrl: this.getRandomFormImage()
              };
            });

            this.filteredForms = this.forms;
            this.createdFormPageNumber = 1;
            this.paginateCreatedForms();

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
    
              if (jsPDFConstructor && window.jspdf?.autoTable) {
                jsPDFConstructor.API.autoTable = window.jspdf.autoTable;
              } else if (jsPDFConstructor && window.autoTable) {
                jsPDFConstructor.API.autoTable = window.autoTable;
              }
    
              if (jsPDFConstructor?.API?.autoTable) {
                this.jsPDFInitialized = true;
                console.log("✅ jsPDF and autoTable loaded successfully.");
              } else {
                console.error("❌ Failed to attach autoTable plugin to jsPDF.");
              }
            })
            .catch((error) => {
              console.error("❌ Error loading jsPDF or autoTable:", error);
            });
        }
  }

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
        this.userType === "Roster Manager" ||
        this.userType === "Facility Admin";

      // this.isStaffUser = this.userType === 'NDIS Staff';
      this.isStaffUser = this.userType === "NDIS Org Admin";
      console.log("✅ showFormsAccess:", this.showFormsAccess);

      // ✅ Now fetch the user's Facility ID
      getFacilityByUserEmail({ userEmail: this.userEmail })
        .then((facilityId) => {
          console.log("🏥 Facility ID for user:", facilityId);
          this.facilityId = facilityId;

          // ✅ Fetch participants only for this facility
          this.fetchPredefinedParticipants(facilityId);
        })
        .catch((error) => {
          console.error("❌ Error fetching facility:", error);
        });
      this.filterParticipantOptions();
    } else if (error) {
      console.error("❌ Error fetching user info:", error);
    }
  }
  fetchPredefinedParticipants(facilityId) {
    if (!facilityId) {
      console.error("❌ Cannot fetch participants: facilityId is undefined");
      return;
    }

    getParticipantsFilter({ facilityIds: [facilityId] })
      .then((data) => {
        this.predefinedParticipants = data;
        console.log("🎯 Predefined Participants (for dropdown):", data);
      })
      .catch((error) => {
        console.error("❌ Error fetching predefined participants:", error);
      });
  }

  // @wire(getParticipants, { facilityId: "$facilityId" })
  // wiredRecords({ data, error }) {
  //   if (data) {
  //     this.participants = data.map((participant) => {
  //       const staffMembers = participant.staffMembers || [];

  //       // ✅ Separate visible (first 5) and remaining staff
  //       const visibleStaffMembers = staffMembers.slice(0, 5);
  //       const extraStaff = staffMembers.slice(5);
  //       const extraStaffCount = extraStaff.length;
  //       const extraStaffNames = extraStaff.map((s) => s.name).join(", ");

  //       // ✅ Debug logs
  //       visibleStaffMembers.forEach((staff) => {});

  //       if (extraStaffCount > 0) {
  //         console.log(`➕ ${extraStaffCount} extra staff: ${extraStaffNames}`);
  //       }

  //       return {
  //         ...participant,
  //         visibleStaffMembers,
  //         hasVisibleStaff: visibleStaffMembers.length > 0, // ✅ Add this
  //         extraStaffCount,
  //         extraStaffNames,
  //         hasExtraStaff: extraStaffCount > 0,
  //         grantedForms: participant.Accessible_Forms__c
  //           ? participant.Accessible_Forms__c.split("\n")
  //           : [],
  //         isSelected: false
  //       };
  //     });

  //     this.filteredParticipants = [...this.participants];
  //     this.totalRecords = this.filteredParticipants.length;
  //     this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
  //     this.paginationHelper();

  //     this.participantsLoaded = true;
  //     this.filterParticipantOptions();
  //   } else if (error) {
  //     console.error("❌ Error fetching participants:", error);
  //   }
  // }

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
  // togglePublishedForms() {
  //     this.showPublishedForms = !this.showPublishedForms;

  //     // ✅ Clear selected participant and forms if staff is closing the modal
  //     if (!this.showPublishedForms && this.isStaffUser) {
  //         this.selectedParticipantId = '';
  //         this.forms = [];
  //         this.filteredForms = [];
  //     }
  // }

  togglePublishedForms() {
    console.log("📌 called togglePublishedForms ");
    this.showPublishedForms = !this.showPublishedForms;

    if (this.showPublishedForms) {

     const orgidParam = this.orgid || null; // falls back server-side if null

    getForms({ orgid: orgidParam })

        .then((formRecords) => {
          this.forms = formRecords.map((form) => {
            let miniRows = [];
            try {
              if (form.Form_JSON__c) {
                const parsed = JSON.parse(form.Form_JSON__c);
                miniRows = parsed.slice(0, 4).map((row, rowIndex) => ({
                  index: rowIndex,
                  cells: row.cells
                    .filter((cell) => cell.field?.label)
                    .map((cell, colIndex) => ({
                      label: cell.field.label,
                      index: colIndex
                    }))
                }));
              }
            } catch (e) {
              console.error(
                "❌ Error parsing Form_JSON__c for:",
                form.Name__c,
                e
              );
            }
const createdByName = form.CreatedBy ? form.CreatedBy.Name : 'Unknown';
          const createdById   = form.CreatedById || null;
          const createdByInitials =
            (this.getInitials && this.getInitials(createdByName)) ||
            (createdByName && createdByName.split(/\s+/).map(p => p[0]).join('').slice(0,2).toUpperCase()) ||
            'U';
           const createdAt = this.formatCreatedAt(form.CreatedDate);
            return {
              ...form,
              miniRows,
              formImageUrl: this.getRandomFormImage(),
              isHovered: form.Id === this.hoveredFormId,
              createdByName,
            createdByInitials,
            createdById,
             createdAt  
            };
          });

          this.filteredForms = this.forms;
          this.createdFormPageNumber = 1;
          this.paginateCreatedForms();
           this.tryAttach();

          console.log("✅ Loaded all forms on toggle:", this.forms.length);
        })
        .catch((error) => {
          console.error("❌ Failed to load forms:", error);
        });
    } else {
      // 🔁 Reset on close
      this.forms = [];
      this.filteredForms = [];
    }
  }

// Formats a Salesforce Datetime string -> { dateStr: 'dd/mm/yyyy', timeStr: 'hh:mm am/pm' }
// In your component class
formatCreatedAt(sfDateTime) {
  if (!sfDateTime) return '';
  const d = new Date(sfDateTime);
  if (isNaN(d)) return '';

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  let h = d.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12; // 0 -> 12
  const hh = String(h).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy}, ${hh}:${min} ${ampm}`;
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
              const parsed = JSON.parse(form.Form_JSON__c);
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


 wiredFormsResult;
_forceInitialRefresh = true;     // start true so first emission triggers refresh
_freshPending = false;
_lastSignature = null;
_emitNo = 0;                     // emission counter
_refreshCycleNo = 0;             // refresh cycle counter
_refreshInFlightNo = null; 
  // @wire(getForms)
  // wiredAllForms(result) {
  //   this.wiredFormsResult = result; // 🔹 Store the wire result object

  //   const { data, error } = result;
  //   if (data && !this.clientId) {
  //     this.allForms = data.map((form) => {
  //       let miniRows = [];
  //       try {
  //         if (form.Form_JSON__c) {
  //           const parsed = JSON.parse(form.Form_JSON__c);
  //           miniRows = parsed.slice(0, 4).map((row, rowIndex) => ({
  //             index: rowIndex,
  //             cells: row.cells
  //               .filter((cell) => cell.field && cell.field.label)
  //               .map((cell, colIndex) => ({
  //                 label: cell.field.label,
  //                 index: colIndex
  //               }))
  //           }));
  //         }
  //       } catch (e) {
  //         console.error(
  //           "❌ Error parsing Form_JSON__c for mini view:",
  //           form.Name__c,
  //           e
  //         );
  //       }

  //       return {
  //         ...form,
  //         miniRows,
  //         formImageUrl: this.getRandomFormImage(),
  //         isHovered: false
  //       };
  //     });

  //     this.filteredForms = this.allForms;
  //     this.createdFormPageNumber = 1;
  //     this.paginateCreatedForms();

  //     console.log(
  //       "✅ All Forms Cached with Mini View Ready:",
  //       JSON.stringify(this.allForms)
  //     );
  //   } else if (error) {
  //     console.error("❌ Error fetching all forms:", error);
  //   }
  // }

@wire(getForms)
wiredAllForms(result) {
  this.wiredFormsResult = result;
  const { data, error } = result;

  const ts = new Date().toISOString();
  const makeSig = (arr) => Array.isArray(arr) ? `${arr.length}|${arr.slice(0,5).map(r => r.Id).join(',')}` : 'no-data';

  const emissionId = ++this._emitNo;
  console.groupCollapsed(`📦 Forms Wire #${emissionId} @ ${ts}`);
  console.log('Wire result object:', result);

  // ---- EMISSION-LEVEL LOGGING (outside of clientId checks) ----
  if (data) {
    const sig = makeSig(data);
    const isFreshLanding = this._freshPending && this._refreshInFlightNo !== null;

    if (isFreshLanding) {
      console.group(`✨ Fresh data received (cycle #${this._refreshInFlightNo})`);
      console.log('Count:', data.length);
      console.log('Signature:', sig);
      console.groupEnd();
      this._freshPending = false;
      this._refreshInFlightNo = null;
    } else if (this._lastSignature !== sig) {
      console.group('📥 Wire emission (likely from storable cache / first load)');
      console.log('Count:', data.length);
      console.log('Signature:', sig);
      console.groupEnd();
    } else {
      console.log('ℹ️ Wire re-emitted with same signature (no data change).');
    }

    this._lastSignature = sig;
  } else if (error) {
    console.group('❌ Wire error');
    console.error(error);
    console.groupEnd();
  } else {
    console.log('⏳ Wire pending (data and error undefined).');
  }

  // ---- YOUR EXISTING MAPPING LOGIC (unchanged) ----
  if (data && !this.clientId) {
    this.allForms = data.map((form) => {
      let miniRows = [];
      try {
        if (form.Form_JSON__c) {
          const parsed = JSON.parse(form.Form_JSON__c);
          miniRows = parsed.slice(0, 4).map((row, rowIndex) => ({
            index: rowIndex,
            cells: row.cells
              .filter((cell) => cell.field && cell.field.label)
              .map((cell, colIndex) => ({
                label: cell.field.label,
                index: colIndex
              }))
          }));
        }
      } catch (e) {
        console.error("❌ Error parsing Form_JSON__c for mini view:", form.Name__c, e);
      }

      return {
        ...form,
        miniRows,
        formImageUrl: this.getRandomFormImage(),
        isHovered: false
      };
    });

    this.filteredForms = this.allForms;
    this.createdFormPageNumber = 1;
    this.paginateCreatedForms();

    console.groupCollapsed('✅ All Forms Cached with Mini View Ready');
    try { console.log(JSON.stringify(this.allForms)); } catch { console.log('[payload omitted]'); }
    console.groupEnd();
  } else if (data) {
    // Optional: visibility log when clientId present and we intentionally skip mapping
    console.log('🙈 Skipped mapping because clientId is set.');
  }

  // ---- ONE-TIME SERVER REFRESH ON FIRST EMISSION (race-proof) ----
  if (this._forceInitialRefresh && (data !== undefined || error !== undefined)) {
    this._forceInitialRefresh = false;
    this._freshPending = true;
    this._refreshCycleNo += 1;
    this._refreshInFlightNo = this._refreshCycleNo;

    console.group(`🔁 Forcing server refresh via refreshApex (cycle #${this._refreshInFlightNo})`);
    Promise.resolve()
      .then(() => refreshApex(this.wiredFormsResult))
      .then(() => {
        console.log('refreshApex resolved; waiting for wire to re-emit with fresh data…');
        console.groupEnd();
      })
      .catch((e) => {
        this._freshPending = false;
        this._refreshInFlightNo = null;
        console.error('refreshApex failed', e);
        console.groupEnd();
      });
  }

  console.groupEnd(); // end emission group
}

  @wire(getFormsByClient, { clientId: "$clientId",orgid: this.orgid })
  wiredClientForms({ data, error }) {
    if (data && this.clientId) {
      this.allForms = data;
      // Do NOT assign this.forms here
      console.log("✅ Client-Specific Forms Cached");
    } else if (error) {
      console.error("❌ Error fetching client-specific forms:", error);
    }
  }

  handleSearchChange(event) {
    this.searchQuery = event.target.value.toLowerCase();

    // ✅ Filter forms based on Name__c
    this.filteredForms = this.forms.filter((form) =>
      form.Name__c.toLowerCase().includes(this.searchQuery)
    );

    // ✅ Reset to first page and refresh pagination
    this.createdFormPageNumber = 1;
    this.paginateCreatedForms();
  }

  // ✅ Process responses and format date
// processFormResponses(data) {

//   const isStaff = this.selectedAudience === "Staff";

//   const mapped = (data || []).map((response) => {

//     const statusRaw = response.Status__c || "Pending";

//     return {
//       ...response,

//       // -------------------
//       // STATUS ENRICHMENT
//       // -------------------
//       Status__c: statusRaw,

//       statusDotClass: this.getStatusDotClass(statusRaw),

//       canEditOrDelete: statusRaw === "Pending",

//       // -------------------
//       // EXISTING FIELDS
//       // -------------------
//       audience: response.Form_Reference__r?.Audience__c,

//       FormattedDate: this.formatDate(response.CreatedDate),

//       formImageUrl: this.getRandomFormImage(),

//       // 🔥 dynamic name column
//       displayName: isStaff
//         ? response.Staff_Name__c
//         : response.Participant_Name__c
//     };
//   });

//   // 🔥 FORCE new array refs
//   this.formResponses = mapped;
//   this.filteredFormResponses = [...mapped];

//   this.totalFormRecords = mapped.length;

//   this.totalFormPages = Math.ceil(
//     this.totalFormRecords / this.formPageSize
//   );

//   console.log("📊 processFormResponses totals:", {
//     total: this.totalFormRecords,
//     pages: this.totalFormPages
//   });

//   this.updatePaginatedFormResponses();
// }

  processFormResponses(data) {

    const isStaff = this.selectedAudience === "Staff";

    const mapped = (data || []).map((response) => {

      const statusRaw = response.Status__c || "Pending";

      return {
        ...response,

        // -------------------
        // STATUS ENRICHMENT
        // -------------------
        Status__c: statusRaw,
        statusDotClass: this.getStatusDotClass(statusRaw),
        canEditOrDelete: statusRaw === "Pending",

        // -------------------
        // EXISTING FIELDS
        // -------------------
        audience: response.Form_Reference__r?.Audience__c,
        FormattedDate: this.formatDate(response.CreatedDate),
        formImageUrl: this.getRandomFormImage(),

        // 🔥 Dynamic Name Column
        displayName: isStaff
          ? response.Staff_Name__c
          : response.Participant_Name__c
      };
    });

    // 🔥 FORCE new references (important for LWC reactivity)
    this.formResponses = mapped;
    this.filteredFormResponses = [...mapped];

    // ----------------------------
    // PAGINATION FIX (IMPORTANT)
    // ----------------------------

    this.totalFormRecords = this.filteredFormResponses.length;

    this.totalFormPages =
      Math.ceil(this.totalFormRecords / this.formPageSize) || 1;

    // Reset to first page safely
    this.formPageNumber = 1;

    console.log("📊 processFormResponses totals:", {
      total: this.totalFormRecords,
      pages: this.totalFormPages
    });

    // 🔥 Call unified pagination engine
    this.updateFormPagination();
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

  // ✅ Format date as "dd-MM-yyyy"
formatDate(isoDate) {
  if (!isoDate) return "N/A";

  const date = new Date(isoDate);

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${dd}/${mm}/${yyyy}, ${hours}:${minutes} ${ampm}`;
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
  }
  getRandomFormImage() {
    const index = Math.floor(Math.random() * formImages.length);
    return formImages[index];
  }

  // ✅ Pagination Controls
  // previousFormPage() {
  //   if (this.formPageNumber > 1) {
  //     this.formPageNumber--;
  //     this.updatePaginatedFormResponses();
  //   }
  // }

  // nextFormPage() {
  //   if (this.formPageNumber < this.totalFormPages) {
  //     this.formPageNumber++;
  //     this.updatePaginatedFormResponses();
  //   }
  // }

  // firstFormPage() {
  //   this.formPageNumber = 1;
  //   this.updatePaginatedFormResponses();
  // }

  // lastFormPage() {
  //   this.formPageNumber = this.totalFormPages;
  //   this.updatePaginatedFormResponses();
  // }


    firstFormPage() {
        this.formPageNumber = 1;
        this.updateFormPagination();
    }

    previousFormPage() {
        if (this.formPageNumber > 1) {
            this.formPageNumber--;
            this.updateFormPagination();
        }
    }

    nextFormPage() {
        if (this.formPageNumber < this.totalFormPages) {
            this.formPageNumber++;
            this.updateFormPagination();
        }
    }

    lastFormPage() {
        this.formPageNumber = this.totalFormPages;
        this.updateFormPagination();
    }

    handleRecordsPerPage(event) {
        this.formPageSize = parseInt(event.target.value, 10);
        this.formPageNumber = 1;
        this.updateFormPagination();
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

    getEmployeeData()
      .then((response) => {
        // Map the response into different label/value formats
        this.staffOptions = response.map((record) => ({
          value: record.Id,
          label: record.NameToDisplay__c
        }));
        this.staffOptions1 = response.map((record) => ({
          value: record.Id,
          label: record.Last_Name__c
        }));
        this.staffOptions2 = response.map((record) => ({
          value: record.Id,
          label: record.NameToDisplay__c
        }));

        const staffLength = this.staffOptions.length;
        this.staffVal = this.staffOptions[0]?.label || "";
        this.staffVal1 = this.staffOptions1[0]?.label || "";
        this.stafflabel = this.staffOptions2[0]?.label || "";
      })
      .catch((err) => {
        console.error(
          "❌ Error fetching staff data from getEmployeeData:",
          err
        );
      });

    // Get logged-in user's name as well
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

  handleFormClick(event) {
    const formId = event.currentTarget.dataset.id;
    this.selectedForm = this.forms.find((form) => form.Id === formId);
    if (this.selectedForm) {
      this.selectedFormType =
        this.selectedForm.Form_Type__c || "Unknown Form Type";
      this.selectedFormTitle = this.selectedForm.Name__c || "Untitled Form";
      console.log("🔹 Clicked Form ID:", formId);
      console.log("🔹 Clicked Form Name:", this.selectedForm.Name__c);
      console.log("🔹 Clicked Form Type:", this.selectedFormType);

      const rawJson = this.selectedForm.Form_JSON__c;
      const parsedJson = JSON.parse(rawJson);
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
          let headerStyle = '';


          const dropdownLabel = cell.field?.label?.trim().toLowerCase();
          if (cell.field?.dataType === "Dropdown Field") {
            placeholderText = `Select ${cell.field.label}`;

            if (
              dropdownLabel === "facility" &&
              this.facilityOptions.length > 0
            ) {
              options = this.facilityOptions.map((opt) => ({
                label: opt.label,
                value: opt.value,
                isSelected: cell.field.value === opt.value
              }));
            } else if (
              dropdownLabel.includes("participant") &&
              this.participants.length > 0
            ) {
              options = this.participants.map((p) => ({
                label: p.Name,
                value: p.Id,
                isSelected: cell.field.value === p.Id
              }));
            } else if (
              dropdownLabel === "assigned to" &&
              this.staffOptions.length > 0
            ) {
              options = this.staffOptions.map((emp) => ({
                label: emp.label,
                value: emp.value,
                isSelected: cell.field.value === emp.value
              }));
            } else if (cell.field.selectedDropdownOption === "predefinedList") {
              const type = cell.field.predefinedListType?.toLowerCase();

              if (type === "staff" && this.staffOptions.length > 0) {
                options = this.staffOptions.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                  isSelected: cell.field.value === opt.value
                }));
              } else if (
                type === "participant" &&
                this.predefinedParticipants &&
                this.predefinedParticipants.length > 0
              ) {
                options = this.predefinedParticipants.map((p) => ({
                  label: p.Name,
                  value: p.Id,
                  isSelected: cell.field.value === p.Id
                }));
              } else if (
                type === "facility" &&
                this.facilityOptions.length > 0
              ) {
                options = this.facilityOptions.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                  isSelected: cell.field.value === opt.value
                }));
              }
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

              selectedOptionsArray = cell.field.value
                ? cell.field.value.split(", ")
                : [];
              selectedValues = selectedOptionsArray.join(", ");
              options.forEach((option) => {
                if (selectedOptionsArray.includes(option.label)) {
                  option.isSelected = true;
                }
              });
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

          if (cell.field?.dataType === "Header" || cell.field?.type === "header" || cell.field?.isHeader === true) {
            isHeader = true;

            // text to display
            headerText = cell.field?.text || cell.field?.label || "Section Title";

            // use saved inlineStyle if present; otherwise compute it
            headerStyle =
              cell.field?.inlineStyle ||
              this.computeHeaderInlineStyle?.({
                fontSize:       cell.field?.fontSize       || "24",
                fontWeight:     cell.field?.fontWeight     || "600",
                textAlign:      cell.field?.textAlign      || "left",
                textDecoration: cell.field?.textDecoration || "none",
                color:          cell.field?.color          || "#000000"
              }) ||
              `font-size:${cell.field?.fontSize || 24}px; font-weight:${cell.field?.fontWeight || 600}; text-align:${cell.field?.textAlign || 'left'}; text-decoration:${cell.field?.textDecoration || 'none'}; color:${cell.field?.color || '#000000'};`;


          }

          const isPageBreakCell =
            cell.field?.dataType === "Blank" &&
            cell.field?.label?.toLowerCase().trim() === "page break";
          const dataId = `row-${rowIndex}-col-${colIndex}`;

          return {
            ...cell,
            dataId: dataId,
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
      console.log("✅ isFormSelected set to true. UI should render form.");
    }
  }

paginationHelper() {
  const master = Array.isArray(this.participantDataMaster)
    ? this.participantDataMaster
    : [];

  const usingSearch = !!(this.searchFormsAccessQuery && this.searchFormsAccessQuery.trim());
  const source = usingSearch
    ? (this.filteredParticipants || [])
    : master;

  // 🔒 Empty state
  if (!source.length) {
    this.noRecordsFlag = true;
    this.recordsToDisplay = [];

    this.totalRecords = 0;
    this.totalParticipants = 0;
    this.totalPages = 0;
    this.totalPagestotalParticipants = 0;

    this.bDisableFirst = true;
    this.bDisableLast = true;
    return;
  }

  this.noRecordsFlag = false;

  // totals
  const total = source.length;
  this.totalRecords = total;              // 🔑 TEMPLATE USES THIS
  this.totalParticipants = total;
  this.totalPages = Math.ceil(total / this.pageSize);
  this.totalPagestotalParticipants = this.totalPages;

  // clamp page
  if (this.pageNumber < 1) this.pageNumber = 1;
  if (this.pageNumber > this.totalPages) this.pageNumber = this.totalPages;

  // slice
  const start = (this.pageNumber - 1) * this.pageSize;
  const end   = start + this.pageSize;
  this.recordsToDisplay = source.slice(start, end);

  // buttons
  this.bDisableFirst = this.pageNumber === 1;
  this.bDisableLast  = this.pageNumber === this.totalPages;

  // 🔎 Debug (optional)
  console.log(
    '📄 paginationHelper → displaying',
    this.recordsToDisplay.length,
    '/',
    this.totalRecords
  );
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
    if (this.pageNumber < this.totalPagestotalParticipants) {
      this.pageNumber++;
      this.paginationHelper();
    }
  }

  firstPage() {
    this.pageNumber = 1;
    this.paginationHelper();
  }

  lastPage() {
    this.pageNumber = this.totalPagestotalParticipants;
    this.paginationHelper();
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
  // grantAccess() {
  //     console.log('🔹 Initiating Grant Access...');

  //     if (this.selectedForms.size === 0) {
  //         this.showToast('Error', 'Please select at least one form to grant access.', 'error');
  //         return;
  //     }

  //     console.log('🔹 Selected Form IDs:', Array.from(this.selectedForms));
  //     console.log('🔹 Participant ID:', this.selectedParticipantId);

  //     grantAccessToParticipant({
  //         participantId: this.selectedParticipantId,
  //         selectedFormIds: Array.from(this.selectedForms)
  //     })
  //     .then(() => {
  //         console.log('✅ Grant Access Success!');
  //         this.showToast('Success', 'Access granted successfully!', 'success');
  //         this.closeGrantAccessPopup();

  //         return getAccessibleForms({ participantId: this.selectedParticipantId });
  //     })
  //     .then(formRecords => {
  //         if (!formRecords || formRecords.length === 0) {
  //             this.forms = [];
  //             this.filteredForms = [];
  //             console.log('🔹 No forms returned after grant.');
  //         } else {
  //             this.forms = formRecords;
  //             this.filteredForms = formRecords;
  //             console.log('🔹 Refreshed forms:', this.filteredForms.map(f => f.Name__c));
  //         }
  //     })

  //     .catch(error => {
  //         console.error('❌ Error granting access:', JSON.stringify(error));

  //         if (error && error.body && error.body.message) {
  //             console.error('📌 Apex Debug Log:', error.body.message);
  //         }

  //         this.showToast('Error', 'Failed to grant access.', 'error');
  //     });
  // }

grantAccess() {
  console.log("🔹 Initiating Grant Access...");

  const formId = this.selectedFormId;
  if (!formId) {
    this.showToast("Error", "No form selected. Please choose a form to assign.", "error");
    return;
  }

  // Use the MASTER for truth
  const source = this.participantDataMaster?.length ? this.participantDataMaster : (this.participantData || []);

  // Compute changes relative to current access
  const toGrant = source.filter(p => p.isSelected && !this.hasAccess(p, formId)).map(p => p.Id);
  const toRevoke = source.filter(p => !p.isSelected && this.hasAccess(p, formId)).map(p => p.Id);

  // If nothing to change, inform and exit
  if ((!toGrant || toGrant.length === 0) && (!toRevoke || toRevoke.length === 0)) {
    this.showToast("Info", "No changes to apply.", "info");
    return;
  }

  console.log("📌 Selected Form ID:", formId);
  console.log("➕ Will grant to:", toGrant);
  console.log("➖ Will revoke from:", toRevoke);

  // ✅ Optimistic UI
  if (toGrant.length)  this.applyGrantAccessPatch(formId, toGrant);
  if (toRevoke.length) this.applyRevokeAccessPatch(formId, toRevoke);

  // 🔁 Build Apex calls
  const calls = [];
  if (toGrant.length)  calls.push(grantAccessToParticipants({ participantIds: toGrant,  formId }));
  if (toRevoke.length) calls.push(revokeAccessFromParticipants({ participantIds: toRevoke, formId }));

  Promise.all(calls)
    .then(() => {
      // this.showToast("Success",
      //   `Access updated. Granted: ${toGrant.length}, Revoked: ${toRevoke.length}.`, "success");

      this.showToast("Success",
        `Access updated.`, "success");

      // Close + reset UI state (search/selections/paging)
      this.showAssignModal = false;
      this.selectedFormId = null;
      this.isAllParticipantsSelected = false;
      this.searchFormsAccessQuery = '';
      this.filteredParticipants = [];
      this.participantDataMaster = this.participantDataMaster.map(p => ({ ...p, isSelected: false }));
      this.participantData = [...this.participantDataMaster];
      this.participants    = [...this.participantDataMaster];
      this.pageNumber = 1;
      this.paginationHelper();

      // Authoritative refresh of participants, then reattach
      return getParticipantsFilter({ facilityIds: this.allFacilityIds });
    })
    .then((fresh) => {
      if (fresh) {
        this.participantDataMaster = (fresh || []).map(p => ({ ...p, isSelected: false }));
        this.participantData = [...this.participantDataMaster];
        this.participants    = [...this.participantDataMaster];
        this.filteredParticipants = [];
        this.searchFormsAccessQuery = '';
        this.pageNumber = 1;
        this.tryAttach();
        this.paginationHelper();
      }
      // return refreshApex(this.wiredFormsResult);
      return this.togglePublishedForms();
    })
    .catch((error) => {
      console.error("❌ Error updating access:", error);
      this.showToast("Error", "Failed to update access.", "error");
    });
}

applyRevokeAccessPatch(formId, participantIds) {
  if (!this.participantDataMaster?.length || !formId || !participantIds?.length) return;

  const key15 = this.normalizeId(formId);

  this.participantDataMaster = this.participantDataMaster.map(p => {
    if (!participantIds.includes(p.Id)) return p;

    const current = p.Accessible_Forms__c || '';
    const rawTokens = current.split(/[,;\s]+/).filter(Boolean);   // preserve original forms
    const filteredRaw = rawTokens.filter(t => this.normalizeId(t) !== key15);
    const updated = filteredRaw.join('\n'); // keep your newline style

    return { ...p, Accessible_Forms__c: updated };
  });

  // Mirrors + avatars refresh
  this.participantData = [...this.participantDataMaster];
  this.participants    = [...this.participantDataMaster];

  this.attachParticipantsToForms?.();
}

  closeGrantAccessPopup() {
    this.isGrantAccessPopupOpen = false;
    this.selectedForms.clear();
  }



async handleView(event) {
  console.log("📍 handleView triggered (FormsAccess)");

  // -------------------------
  // RESET VIEW STATE (MATCH STAFF)
  // -------------------------
  this.viewTableData = [];
  this.tableRows = [];
  this.stepPagedRows = [];
  this.stepCurrentPageIndex = 0;

  this.selectedFormTitle = "";
  this.selectedFormType = "";
  this.selectedParticipantName = "";
  this.selectedSubmissionDate = "";

  this.isViewMode = true;
  this.isViewModeON = true;
  this.isFormSelected = true;

  // -------------------------
  // GET RESPONSE
  // -------------------------
  this.selectedResponseId = event.currentTarget.dataset.id;

  const response = (this.formResponses || []).find(
    (resp) => resp.Id === this.selectedResponseId
  );

  if (!response) {
    console.warn("⚠️ No response found:", this.selectedResponseId);
    return;
  }

  try {
    const raw = response.Response_JSON__c;

    let formJson;

    if (raw) {
      const parsed = JSON.parse(raw);

      // 🌐 AWS backed
      if (parsed?.url && parsed?.key) {
        console.log("🌐 Loading response JSON from AWS:", parsed.url);

        const resp = await fetch(parsed.url);
        if (!resp.ok) {
          throw new Error("Failed to fetch AWS response JSON");
        }

        formJson = await resp.json();
      } else {
        // inline JSON
        formJson = parsed;
      }
    }

    console.log("📄 Resolved Response JSON:", formJson);

    // -------------------------
    // CORE PIPELINE (SAME AS STAFF)
    // -------------------------
    this.prepareViewTable(formJson);

    // -------------------------
    // HEADER VALUES
    // -------------------------
    this.selectedFormTitle =
      response.Name__c || "Untitled Form";

    this.selectedFormType =
      response.Form_Type__c || "Unknown";

    this.selectedParticipantName =
      response.Participant_Name__c || "";

    this.selectedSubmissionDate =
      response.FormattedDate || "";

      this.selectedDisplayName = response.displayName || "";

  } catch (e) {
    console.error("❌ Failed opening form:", e);
    this.showToast("Error", "Unable to open form.", "error");
  }
}


  closeView() {
    this.isViewMode = false;
    this.isFormSelected = false;
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
      cells: row.cells.map((cell, colIndex) => ({
        ...cell,
        isVisible: cell.style !== "display: none;",
        field: { ...cell.field, value: cell.field?.value || "" },
        hasContent: !!(cell.field?.label || cell.field?.value),
        readonlyValue: this.computeReadonlyValue(cell, isViewMode),
        id: cell.id || `cell-${rowIndex}-${colIndex}` // ✅ ensure cell.id exists
      }))
    }));

    // ✅ Assign processed rows to tableRows
    this.tableRows = processedRows;

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
        if (currentPage.length > 0) {
          this.stepPagedRows.push([...currentPage]);
        }
        currentPage = [row]; // page break row starts a new page
      } else {
        currentPage.push(row);
      }
    });

    if (currentPage.length > 0) {
      this.stepPagedRows.push(currentPage);
    }

    // ✅ Reset to first step and update visible rows
    this.stepCurrentPageIndex = 0;
    this.updateStepVisibleRows();
  }

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

  goToNextStepPage() {
    if (!this.isLastStepPage) {
      this.stepCurrentPageIndex++;
      this.updateStepVisibleRows();
    }
  }

  goToPreviousStepPage() {
    if (!this.isFirstStepPage) {
      this.stepCurrentPageIndex--;
      this.updateStepVisibleRows();
    }
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
      return cell.field.value ? cell.field.value : "-";
    }
    if (cell.isCheckboxField) {
      return cell.field.value ? "utility:check" : "utility:close";
    }
    if (cell.isDropdownField) {
      return cell.selectedValues ? cell.selectedValues : "-";
    }
    return "-";
  }

//    prepareViewTable(formJson) {
//     console.log("📋 prepareViewTable() called");
//     let tableData = [];
//     let pageCounter = 1; // kept for compatibility
//     let currentPage = 1;

//     // Insert first page heading
//     tableData.push({
//       isPageBreak: true,
//       pageNumber: currentPage,
//       arrow: "▼",
//       isVisible: true,
//       key: `page-${currentPage}`
//     });

//     formJson.forEach((row, rowIndex) => {
//       const isPageBreak = row.cells.some(
//         (cell) =>
//           cell.field?.dataType === "Blank" &&
//           cell.field?.label?.toLowerCase().trim() === "page break"
//       );

//       if (isPageBreak) {
//         currentPage++;
//         tableData.push({
//           isPageBreak: true,
//           pageNumber: currentPage,
//           arrow: "▶",
//           isVisible: false,
//           key: `page-${currentPage}`
//         });
//         return; // skip rendering actual page break cell
//       }

//       row.cells.forEach((cell, colIndex) => {
//         // ✅ Handle headers FIRST, regardless of label/value emptiness
//         if (cell?.field && this.viewIsHeaderCell(cell)) {
//           const title = this.viewNormalizeHeaderTitle(cell);
//           if (title) {
//             tableData.push({
//               id: cell.id,
//               isSectionHeader: true,
//               title,
//               // (optional) carry style if you want to use it in the template:
//               headerStyle: cell.headerStyle || cell.field?.inlineStyle || "",
//               belongsToPage: currentPage,
//               isVisible: currentPage === 1
//             });
//             console.log(
//               `🧭 Section Header at [${rowIndex}][${colIndex}]:`,
//               title
//             );
//           } else {
//             console.log(
//               `🧭 Section Header at [${rowIndex}][${colIndex}] (empty title) — skipped`
//             );
//           }
//           return; // don't also add a label/value row for this cell
//         }

//         // ❌ Skip truly empty/non-field cells
//         if (!cell?.field || !(cell.field.label || "").trim()) {
//           return;
//         }

//         const dataType = cell.field.dataType;
//         const isUploadFile =
//           dataType === "upload file" || cell.field?.isUpload === true;

//         console.log(
//           `🧩 Row ${rowIndex}, Cell ${colIndex} — rawType="${dataType}", normalized="${dataType}", isUploadFile=`,
//           isUploadFile
//         );

//         const isRichText =
//           dataType === "Text Field" &&
//           cell.field.selectedTextFieldOption === "richText";
//         const isRadioButton = dataType === "Radio Button";
//         const isCheckbox = dataType === "Checkbox Field";
//         const isChecked =
//           isCheckbox &&
//           (cell.field.value === true || cell.field.value === "true");

//         const toArrayFn =
//           typeof toArray === "function" ? toArray : this.viewToArray.bind(this);
//         const isImageUrlFn =
//           typeof isImageUrl === "function"
//             ? isImageUrl
//             : this.viewIsImageUrl.bind(this);

//         const urlsArr = toArrayFn(cell.field.value);
//         const downloadArr = toArrayFn(cell.field.downloadLink);

//         // Build a normalized files[] list
//         const files = urlsArr.map((url, i) => {
//           const downloadUrl = downloadArr[i] || url;
//           return {
//             key: `${cell.id}-${i}`,
//             url,
//             downloadUrl,
//             isImage: isImageUrlFn(url)
//           };
//         });

//         // Legacy single-value fields for backward compatibility
//         const previewUrl = files[0]?.url || null;
//         const downloadUrl = files[0]?.downloadUrl || previewUrl;
//         const isImage = files[0]?.isImage || false;

//         // 🔍 Debug logs
//         console.log(`🧩 Row ${rowIndex}, Cell ${colIndex}`);
//         console.log(`   Label: ${cell.field.label}`);
//         console.log(`   Data Type: ${dataType}`);
//         console.log(`   Value:`, cell.field.value);
//         console.log(`   isCheckbox:`, isCheckbox);
//         console.log(`   value (urls):`, urlsArr);
//         console.log(`   downloadLink (urls):`, downloadArr);

//         const checkboxDisplayValue =
//           cell.field.value === true || cell.field.value === "true";
//         if (isCheckbox) {
//           console.log("📦 checkboxDisplayValue:", checkboxDisplayValue);
//         }

//         const isSignature =
//           cell.field?.isSignature === true ||
//           cell.field?.dataType === "Signature";

//         tableData.push({
//           id: cell.id,
//           label: cell.field.label,
//           value: this.getFormattedValue(cell),
//           isCheckbox:
//             cell.isCheckboxField || cell.field?.dataType === "Checkbox Field",
//           isUploadFile,
//           files, // [{ url, downloadUrl, isImage }]

//           // legacy single-url fields (still present so old templates keep working)
//           uploadUrl: previewUrl,
//           isImageFile: isImage,
//           downloadUrl,
//           finalDownloadUrl: downloadUrl || previewUrl,

//           isRichText,
//           belongsToPage: currentPage,
//           isVisible: currentPage === 1,
//           isRadioButton,
//           isSignature,
//           signatureUrl: isSignature ? cell.field?.value : null,

//           isRegularField:
//             !isUploadFile &&
//             !isCheckbox &&
//             !isRichText &&
//             !isRadioButton &&
//             !isSignature
//         });
//       });
//     });

//     console.log("✅ Final viewTableData:", JSON.stringify(tableData, null, 2));
//     this.viewTableData = tableData;

//     this.stepPagedRows = [];
// let currentStepPage = [];

// tableData.forEach((row) => {
//   if (row.isPageBreak) {
//     if (currentStepPage.length) {
//       this.stepPagedRows.push([...currentStepPage]);
//       currentStepPage = [];
//     }
//   } else {
//     currentStepPage.push(row);
//   }
// });

// if (currentStepPage.length) {
//   this.stepPagedRows.push([...currentStepPage]);
// }

// this.stepCurrentPageIndex = 0;
// this.updateStepVisibleRows?.();
//   }

  // Safely strip HTML to text
  
  
  
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

resolveDropdownLabel(value, options = [], isMulti = false) {
  if (!value) return "—";

  // Multi-select
  if (isMulti) {
    const values = String(value)
      .split(",")
      .map(v => v.trim());

    return values
      .map(v => options.find(o => o.value === v)?.label || v)
      .join(", ");
  }

  // Single select
  return options.find(o => o.value === value)?.label || value;
}


formatDateDD(value) {
    if (!value) return "—";

    // 🔥 VERY IMPORTANT for YYYY-MM-DD values
    const d = new Date(value + "T00:00:00");

    if (isNaN(d)) return value;

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
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

  // getFormattedValue(cell) {
  //   if (cell.isCheckboxField) {
  //     return cell.field.value ? "action:approval" : "action:close";
  //   }
  //   if (cell.isDropdownField && cell.isMultiSelect) {
  //     return cell.selectedValues || "—"; // ✅ Show selected multi-select values
  //   }
  //   if (cell.isDropdownField) {
  //     return cell.field.value ? cell.field.value : "—"; // ✅ Show selected dropdown value
  //   }
  //   if (cell.field?.dataType === "Upload File") {
  //     return cell.field.value || "No File";
  //   }
  //   if (
  //     cell.field?.dataType === "Text Field" &&
  //     cell.field?.selectedTextFieldOption === "richText"
  //   ) {
  //     return cell.field.value || "<span>No Rich Text</span>";
  //   }
  //   return cell.field.value ? cell.field.value : "—"; // Default to dash if empty
  // }
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

  handleEdit(event) {
    this.isEditing = true;
    this.selectedResponseId = event.currentTarget.dataset.id;

    const response = this.formResponses.find(
      (resp) => resp.Id === this.selectedResponseId
    );
    if (response) {
      const parsedResponseJson = JSON.parse(response.Response_JSON__c || "[]");

      // ✅ Log field labels before loadFormData
      const preLabels = parsedResponseJson
        .flatMap((row) => row.cells)
        .filter((cell) => cell.field?.label && cell.field?.dataType !== "Blank")
        .map((cell) => cell.field.label);

      console.log("📋 Field Labels BEFORE loadFormData():", preLabels);

      // ✅ Log full response data
      console.log("📥 Parsed Response Data for Edit:", parsedResponseJson);
      this.loadFormData(JSON.parse(response.Response_JSON__c), false);
      this.isFormSelected = true;

      // this.updateStepVisibleRows();

      // ✅ Log all visible field labels on the current page
      const visibleLabels = this.tableRows
        .flatMap((row) => row.cells)
        .filter(
          (cell) =>
            cell.isVisible &&
            cell.field?.label &&
            cell.field?.dataType !== "Blank"
        )
        .map((cell) => cell.field.label);

      console.log("🧾 Visible Field Labels on Edit:", visibleLabels);
    } else {
      console.error("Error: Response not found.");
    }
  }

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

      // ✅ RELOAD submitted forms list
      return this.fetchAllResponses();
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

  handleInputChange(event) {
    const { id } = event.target.dataset;
    const rowIdx = id.split("-")[1];
    const colIdx = id.split("-")[2];
    const row = this.tableRows[rowIdx];
    const cell = row?.cells[colIdx];

    if (cell && cell.field) {
      // ✅ Preserve existing behavior for checkboxes
      if (event.target.type === "checkbox") {
        cell.field.value = event.target.checked;
      }
      // ✅ Handle single-select dropdowns
      else if (cell.isDropdownField && !cell.isMultiSelect) {
        const selected = event.target.value;
        cell.field.value = selected;
        cell.selectedValues = selected;

        // ✅ Mark correct option as selected
        if (Array.isArray(cell.field.options)) {
          cell.field.options = cell.field.options.map((opt) => ({
            ...opt,
            isSelected: opt.label === selected
          }));
        }

        console.log(`✅ Single-Select Updated: ${cell.field.value}`);
      }
      // ✅ Handle multi-select dropdowns
      else if (cell.isDropdownField && cell.isMultiSelect) {
        const selectedValues = Array.from(
          event.target.selectedOptions,
          (option) => option.value
        ).join(", "); // ✅ Convert to comma-separated string

        cell.field.value = selectedValues;
        console.log(`✅ Multi-Select Updated: ${cell.field.value}`);
      }
      // ✅ Preserve existing behavior for other input types
      else {
        cell.field.value = event.target.value;
      }
    }

    // ✅ Sync updated tableRows back into stepPagedRows
    if (
      Array.isArray(this.stepPagedRows) &&
      this.stepPagedRows.length > this.stepCurrentPageIndex
    ) {
      this.stepPagedRows[this.stepCurrentPageIndex] = JSON.parse(
        JSON.stringify(this.tableRows)
      );
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

  handleSubmit() {
    // ✅ Flatten all rows
    let allRows = this.stepPagedRows.flat();

    // ✅ Pre-process dropdown values before saving
    allRows = allRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => {
        const newField = {
          ...cell.field,
          value: cell.field?.value || ""
        };

        // ✅ Add downloadLink if this is an uploaded file
        if (cell.isUploadField && cell.field?.downloadLink) {
          newField.downloadLink = cell.field.downloadLink;
        }

        // ✅ Handle multi-select dropdown
        if (cell.isDropdownField && cell.isMultiSelect) {
          const selectedOptions = cell.field.options
            .filter((option) => option.isSelected)
            .map((option) => option.label)
            .join(", ");

          newField.value = selectedOptions;

          return {
            ...cell,
            selectedValues: selectedOptions,
            field: newField
          };
        }

        if (cell.isDropdownField && !cell.isMultiSelect) {
          const selectedValue = cell.selectedValues || cell.field?.value || "";
          const newField = {
            ...cell.field,
            value: selectedValue
          };

          return {
            ...cell,
            selectedValues: selectedValue,
            field: newField
          };
        }

        // ✅ Default: return cell with updated field (e.g. upload, text, etc.)
        return {
          ...cell,
          field: newField
        };
      })
    }));

    // ✅ Convert to JSON for backend
    const responseJson = JSON.stringify(allRows);
    console.log("✅ RESPONSE!" + responseJson);

    if (this.isEditing) {
      updateFormResponse({ responseId: this.selectedResponseId, responseJson })
        .then(() => {
          this.showToast("Success", "Form Updated Successfully!", "success");
          this.isFormSelected = false;
          this.isEditing = false;
          return refreshApex(this.wiredFormResponses);
        })
        .catch((error) => {
          this.showToast("Error", "Error updating form", "error");
          console.error(error);
        });
    } else {
      console.log("Initiating Form Submission...");
      console.log("Form Details:", {
        formId: this.selectedForm?.Id,
        formName: this.selectedForm?.Name__c,
        formType: this.selectedForm?.Form_Type__c,
        responseJson: responseJson,
        orgid: this.orgid,
        clientId: this.clientId,
        participantName: this.selectedParticipantName || ""
      });

      saveFormResponse({
        formId: this.selectedForm.Id,
        responseJson: responseJson,
        orgid: this.orgid,
        clientId: this.clientId,
        formName: this.selectedForm.Name__c,
        formType: this.selectedForm.Form_Type__c,
        participantName: this.selectedParticipantName || ""
      })
        .then(() => {
          console.log("✅ Form Submitted Successfully!");
          this.showToast("Success", "Form Submitted Successfully!", "success");
          this.isFormSelected = false;
          this.isEditing = false;
          return refreshApex(this.wiredFormResponses);
        })
        .then(() => {
          console.log("✅ Apex Data Refreshed Successfully!");
        })
        .catch((error) => {
          console.error("❌ Error submitting form:", error);
          this.showToast("Error", "Error submitting form", "error");
        });
    }
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
    this.isEditing = false;
    this.tableRows = []; // Clear the form data
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

  @track searchSubmittedQuery = "";
  @track filteredFormResponses = []; // Filtered results
  @track searchFormsAccessQuery = "";
  @track participantDataMaster = [];
  @track filteredParticipants = []; // Used for displaying filtered + paginated records

  // handleSubmittedFormSearch(event) {
  //   this.searchSubmittedQuery = event.target.value.toLowerCase();

  //   this.filteredFormResponses = this.formResponses.filter(
  //     (response) =>
  //       (response.Name__c || "")
  //         .toLowerCase()
  //         .includes(this.searchSubmittedQuery) ||
  //       (response.Form_Type__c || "")
  //         .toLowerCase()
  //         .includes(this.searchSubmittedQuery) ||
  //       (response.Participant_Name__c || "")
  //         .toLowerCase()
  //         .includes(this.searchSubmittedQuery) ||
  //       (response.FormattedDate || "")
  //         .toLowerCase()
  //         .includes(this.searchSubmittedQuery)
  //     // Add status if available
  //   );

  //   this.totalFormRecords = this.filteredFormResponses.length;
  //   this.totalFormPages = Math.ceil(this.totalFormRecords / this.formPageSize);
  //   this.formPageNumber = 1; // reset to first page
  //   this.updatePaginatedFormResponses();
  // }

    handleSubmittedFormSearch(event) {

        const query = (event.target.value || '').toLowerCase().trim();
        this.searchSubmittedQuery = query;

        // 🔎 If search is empty → restore all
        if (!query) {
            this.filteredFormResponses = [...this.formResponses];
        } else {

            this.filteredFormResponses = (this.formResponses || []).filter(
                (response) =>

                    (response.Name__c || '')
                        .toLowerCase()
                        .includes(query)

                    ||

                    (response.Form_Type__c || '')
                        .toLowerCase()
                        .includes(query)

                    ||

                    // 🔥 use displayName (dynamic Staff/Participant)
                    (response.displayName || '')
                        .toLowerCase()
                        .includes(query)

                    ||

                    (response.FormattedDate || '')
                        .toLowerCase()
                        .includes(query)

                    ||

                    (response.Status__c || '')
                        .toLowerCase()
                        .includes(query)
            );
        }

        // 🔥 Always reset to first page
        this.formPageNumber = 1;

        // 🔥 Let pagination engine handle totals & slicing
        this.updateFormPagination();
    }




// handleFormsAccessSearch(event) {
//   console.group('handleFormsAccessSearch');

//   const raw = event?.target?.value ?? '';
//   const q = raw.toLowerCase().trim();
//   this.searchFormsAccessQuery = q;

//   console.log('🔎 Query:', q);

//   const participantsLen    = this.participants?.length ?? 0;
//   const participantDataLen = this.participantData?.length ?? 0;
//   console.log('👥 participants len:', participantsLen, '| participantData len:', participantDataLen);

//   // Use whichever list currently has data
//   const source = (participantsLen > 0 ? this.participants : (this.participantData || []));
//   console.log('📦 Source selected:', participantsLen > 0 ? 'participants' : 'participantData', '(len =', source.length, ')');

//   console.time('⏱️ Filter time');
//   this.filteredParticipants = source.filter((participant) => {
//     const name   = (participant?.Name || '').toLowerCase();
//     const status = (participant?.Status__c || '').toLowerCase();
//     const staffHit = (participant?.visibleStaffMembers || []).some(
//       s => ((s?.name || s?.Name || '').toLowerCase()).includes(q)
//     );
//     return name.includes(q) || status.includes(q) || staffHit;
//   });
//   console.timeEnd('⏱️ Filter time');

//   console.log('✅ Filtered count:', this.filteredParticipants.length);
//   console.debug('🧪 Sample first 5:', this.filteredParticipants.slice(0, 5).map(p => p?.Name));

//   // Drive paginator with the filtered list
//   this.participantData = this.filteredParticipants;

//   // Reset paging and counts
//   this.pageNumber   = 1;
//   this.totalRecords = this.filteredParticipants.length;
//   this.totalPages   = Math.ceil(this.totalRecords / this.pageSize);
//   console.log('📄 Page size:', this.pageSize, '| 📊 totalPages:', this.totalPages, '| ↩️ pageNumber:', this.pageNumber);

//   // If no results, clear stale page and exit (keep paginationHelper unchanged)
//   if (this.filteredParticipants.length === 0) {
//     this.noRecordsFlag = true;
//     this.recordsToDisplay = [];
//     console.warn('⚠️ No matches → cleared recordsToDisplay; skipping paginationHelper().');
//     console.groupEnd();
//     return;
//   }

//   // Paginate normally
//   this.paginationHelper();

//   console.log('👁️ recordsToDisplay len:', this.recordsToDisplay?.length ?? 0);
//   const startIndex = (this.pageNumber - 1) * this.pageSize;
//   const endIndex   = startIndex + (this.recordsToDisplay?.length ?? 0) - 1;
//   console.log(`📑 Showing indexes: ${startIndex}..${Math.max(endIndex, startIndex - 1)}`);

//   console.groupEnd();
// }
handleFormsAccessSearch(event) {
  const raw = event?.target?.value ?? '';
  this.searchFormsAccessQuery = raw;

  // compute filtered from MASTER only
  this.filteredParticipants = this.filterParticipants(this.participantDataMaster, raw);

  // reset paging and paginate from the active source
  this.pageNumber = 1;
  this.paginationHelper();
}


  @track hoveredFormId = null;
  @track showAssignModal = false;
  handleHover(event) {
    const id = event.currentTarget.dataset.id;
    this.hoveredFormId = id;

    this.filteredForms = this.filteredForms.map((form) => ({
      ...form,
      isHovered: form.Id === id
    }));

    this.paginateCreatedForms();
  }

  handleMouseOut() {
    this.hoveredFormId = null;

    this.filteredForms = this.filteredForms.map((form) => ({
      ...form,
      isHovered: false
    }));

    this.paginateCreatedForms();
  }

handleAssignClick(event) {
  event.stopPropagation();

  console.group('🧭 handleAssignClick START');

  // -----------------------------
  // Form selection
  // -----------------------------
  const formId = event.currentTarget?.dataset?.id;
  this.selectedFormId = formId;
  console.log('📝 Selected Form Id:', formId);

  const selectedForm = this.forms?.find(f => f.Id === formId);
  this.selectedFormTitle = selectedForm
    ? (selectedForm.Name__c || selectedForm.Name || 'Form')
    : 'Form';

  console.log('📝 Selected Form Title:', this.selectedFormTitle);

  // -----------------------------
  // Determine master participant source
  // -----------------------------
  const hasMaster =
    Array.isArray(this.participantDataMaster) &&
    this.participantDataMaster.length > 0;

  console.log('📦 participantDataMaster exists?', hasMaster);
  console.log('📦 participantDataMaster length:', this.participantDataMaster?.length || 0);
  console.log('📦 participantData length:', this.participantData?.length || 0);

  const masterKey = hasMaster ? 'participantDataMaster' : 'participantData';
  const master = this[masterKey] || [];

  console.log(`✅ Using SOURCE = ${masterKey}`);
  console.log('👥 Source sample (first 3):', master.slice(0, 3));

  // -----------------------------
  // Apply form-access preselection
  // -----------------------------
  this[masterKey] = master.map(p => {
    const hasAccess = this.hasAccess(p, formId);
    return {
      ...p,
      isSelected: hasAccess
    };
  });

  console.log(
    '🎯 Pre-selected participants:',
    this[masterKey].filter(p => p.isSelected).length,
    '/',
    this[masterKey].length
  );

  // -----------------------------
  // Sync mirrors (legacy compatibility)
  // -----------------------------
  this.participantData = [...this[masterKey]];
  this.participants    = [...this[masterKey]];

  console.log('🔄 participantData synced:', this.participantData.length);
  console.log('🔄 participants synced:', this.participants.length);

  // -----------------------------
  // Search-aware filtering
  // -----------------------------
  const hasQuery = !!(this.searchFormsAccessQuery && this.searchFormsAccessQuery.trim());
  console.log('🔎 Active search query?', hasQuery, this.searchFormsAccessQuery);

  this.filteredParticipants = hasQuery
    ? this.filterParticipants(this[masterKey], this.searchFormsAccessQuery)
    : [];

  console.log('🔍 filteredParticipants length:', this.filteredParticipants.length);

  // -----------------------------
  // Select-all checkbox state
  // -----------------------------
  const source = hasQuery ? this.filteredParticipants : this[masterKey];
  this.isAllParticipantsSelected =
    !!source.length && source.every(p => p.isSelected);

  console.log('☑️ isAllParticipantsSelected:', this.isAllParticipantsSelected);

  // =====================================================
  // 🏥 NEW: Facility filter initialization (ADD ONLY)
  // =====================================================

  // Load facilities only once per modal lifecycle
  if (!Array.isArray(this.assignFacilityOptions) || !this.assignFacilityOptions.length) {
    console.log('🏥 Loading facilities for Assign modal');
    this.loadAssignFacilities();
  }

  // Default selection = ALL facilities (no filter)
  this.assignSelectedFacilityId = 'ALL';

  // Fetch participants for ALL facilities if available
  if (Array.isArray(this.allFacilityIds) && this.allFacilityIds.length) {
    console.log('🏥 Fetching participants for ALL facilities');
    this.fetchParticipantsfilter(this.allFacilityIds);
  }

  // -----------------------------
  // Pagination reset
  // -----------------------------
  this.pageNumber = 1;
  this.paginationHelper();

  // -----------------------------
  // Open modal
  // -----------------------------
  this.showAssignModal = true;
  console.log('📦 Assign modal opened');

  console.groupEnd();
}


 closeAssignModal() {
  this.showAssignModal = false;
  this.selectedFormId = null;
  this.isAllParticipantsSelected = false;

  // clear search
  this.searchFormsAccessQuery = '';
  this.filteredParticipants = [];

  // clear selections in MASTER
  this.participantDataMaster = this.participantDataMaster.map(p => ({ ...p, isSelected: false }));
  this.participantData = [...this.participantDataMaster];
  this.participants    = [...this.participantDataMaster];

  this.pageNumber = 1;
  this.paginationHelper();
}


handleParticipantCheckboxToggle(event) {
  console.group('📝 handleParticipantCheckboxToggle');

  const participantId = event.target.dataset.id;
  const isChecked = event.target.checked;

  // Update MASTER
  this.participantDataMaster = this.participantDataMaster.map(p => ({
    ...p,
    isSelected: p.Id === participantId ? isChecked : p.isSelected
  }));

  // Update filtered view (if any)
  if (this.filteredParticipants?.length) {
    this.filteredParticipants = this.filteredParticipants.map(p => ({
      ...p,
      isSelected: p.Id === participantId ? isChecked : p.isSelected
    }));
  }

  // Mirrors (if other code uses them)
  this.participantData = [...this.participantDataMaster];
  this.participants    = [...this.participantDataMaster];

  // Recalc select-all on the ACTIVE SOURCE
  const usingSearch = !!(this.searchFormsAccessQuery && this.searchFormsAccessQuery.trim());
  const source = usingSearch ? this.filteredParticipants : this.participantDataMaster;

  this.isAllParticipantsSelected = !!source.length && source.every(p => p.isSelected);

  // Refresh view
  this.paginationHelper();

  // ------- 📋 LOGGING ------------------------------------------------------
  const toggled = this.participantDataMaster.find(p => p.Id === participantId);
  console.log(`🔘 Toggled: ${toggled?.Name || participantId} (${participantId}) → ${isChecked ? 'SELECTED' : 'DESELECTED'}`);

  // All selected across the whole master list
  const selectedAll = this.participantDataMaster.filter(p => p.isSelected);
  console.log(`✅ Selected (total): ${selectedAll.length}/${this.participantDataMaster.length}`);
  // Show a compact table in the console (first 25 to keep logs light)
  console.table(
    selectedAll.slice(0, 25).map(p => ({
      Id: p.Id,
      Name: p.Name,
      Status: p.Participant_Status__c
    }))
  );
  if (selectedAll.length > 25) {
    console.log(`…and ${selectedAll.length - 25} more selected not shown`);
  }

  // Selected on the CURRENT PAGE
  const pageSelected = (this.recordsToDisplay || []).filter(p => p.isSelected);
  console.log(`📄 Selected on page ${this.pageNumber}: ${pageSelected.length}/${(this.recordsToDisplay || []).length}`);
  console.table(pageSelected.map(p => ({ Id: p.Id, Name: p.Name })));

  console.groupEnd();
}


handleSelectAllParticipants(event) {
  const isChecked = event.target.checked;
  this.isAllParticipantsSelected = isChecked;

  // Apply to ACTIVE SOURCE (search results or all)
  const usingSearch = !!(this.searchFormsAccessQuery && this.searchFormsAccessQuery.trim());
  const targetIds = (usingSearch ? this.filteredParticipants : this.participantDataMaster).map(p => p.Id);

  // Update MASTER
  this.participantDataMaster = this.participantDataMaster.map(p => ({
    ...p,
    isSelected: targetIds.includes(p.Id) ? isChecked : p.isSelected
  }));

  // Update filtered (if present)
  if (usingSearch) {
    this.filteredParticipants = this.filteredParticipants.map(p => ({
      ...p,
      isSelected: isChecked
    }));
  }

  // Mirrors
  this.participantData = [...this.participantDataMaster];
  this.participants    = [...this.participantDataMaster];

  this.paginationHelper();
}


  @track createdFormPageNumber = 1;
  @track createdFormPageSize = 10;
  @track totalCreatedFormPages = 0;
  @track totalCreatedFormRecords = 0;
  @track paginatedCreatedForms = [];
  @track disableCreatedFirstPage = true;
  @track disableCreatedLastPage = true;

  createdFormPageSizeOptions = [10, 15, 20];

  paginateCreatedForms() {
    this.totalCreatedFormRecords = this.filteredForms.length;
    this.totalCreatedFormPages = Math.ceil(
      this.totalCreatedFormRecords / this.createdFormPageSize
    );

    const start = (this.createdFormPageNumber - 1) * this.createdFormPageSize;
    const end = start + this.createdFormPageSize;

    this.paginatedCreatedForms = this.filteredForms.slice(start, end);

    this.disableCreatedFirstPage = this.createdFormPageNumber === 1;
    this.disableCreatedLastPage =
      this.createdFormPageNumber === this.totalCreatedFormPages;
  }

  firstCreatedFormPage() {
    this.createdFormPageNumber = 1;
    this.paginateCreatedForms();
  }

  lastCreatedFormPage() {
    this.createdFormPageNumber = this.totalCreatedFormPages;
    this.paginateCreatedForms();
  }

  nextCreatedFormPage() {
    if (this.createdFormPageNumber < this.totalCreatedFormPages) {
      this.createdFormPageNumber++;
      this.paginateCreatedForms();
    }
  }

  previousCreatedFormPage() {
    if (this.createdFormPageNumber > 1) {
      this.createdFormPageNumber--;
      this.paginateCreatedForms();
    }
  }

  handleCreatedFormRecordsPerPage(event) {
    this.createdFormPageSize = parseInt(event.target.value, 10);
    this.createdFormPageNumber = 1;
    this.paginateCreatedForms();
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

                  if (type === "staff" && this.staffOptions.length > 0) {
                    processedSubOptions = this.staffOptions.map((opt) => ({
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

                if (type === "staff" && Array.isArray(this.staffOptions)) {
                  processedSubOptions = this.staffOptions.map((opt) => ({
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


  // --- helper: normalize an Id to 15 chars for robust matching
normalizeId(id) {
  return (id || '').substring(0, 15);
}

parseAccessibleForms(text) {
  return (text || '')
    .split(/[,;\s]+/)        // commas, semicolons, newline, spaces
    .filter(Boolean)
    .map(t => this.normalizeId(t));
}

// True if participant already has access to formId
hasAccess(participant, formId) {
  const target = this.normalizeId(formId);
  const tokens = this.parseAccessibleForms(participant?.Accessible_Forms__c);
  return tokens.includes(target);
}

// --- helper: compute initials
getInitialsSafe(name) {
  if (!name) return 'U';
  try {
    return name.split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase() || 'U';
  } catch(e) { return 'U'; }
}

// --- core: attach participants to forms as avatar-group props
attachParticipantsToForms() {
  if (!this.forms?.length) return;
  if (!this.participantDataMaster?.length) return;

  const formKeySet = new Set(this.forms.map(f => this.normalizeId(f.Id)));

  const mapByForm = new Map();
  for (const p of this.participantDataMaster) {
    const acc = this.parseAccessibleForms(p.Accessible_Forms__c);
    for (const k of acc) {
      if (!formKeySet.has(k)) continue;
      if (!mapByForm.has(k)) mapByForm.set(k, []);
      mapByForm.get(k).push({
        id: p.Id,
        name: p.Name,
        pictureUrl: p.Picture__c,
        initials: this.getInitialsSafe(p.Name)
      });
    }
  }

  const MAX_VISIBLE = 5;
  this.forms = this.forms.map(form => {
    const k = this.normalizeId(form.Id);
    const list = mapByForm.get(k) || [];
    list.sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    const visible = list.slice(0, MAX_VISIBLE);
    const extraCount = Math.max(0, list.length - MAX_VISIBLE);
    const extraNames = extraCount > 0 ? list.slice(MAX_VISIBLE).map(x => x.name).join(', ') : '';

    return {
      ...form,
      hasVisibleParticipants: list.length > 0,
      visibleParticipants: visible,
      hasExtraParticipants: extraCount > 0,
      extraParticipantCount: extraCount,
      extraParticipantNames: extraNames,
      participantCount: list.length
    };
  });

  this.filteredForms = this.forms;
  this.paginateCreatedForms?.();
}


tryAttach() {
  if (this.forms?.length && this.participantDataMaster?.length) {
    this.attachParticipantsToForms();
  }
}

applyGrantAccessPatch(formId, participantIds) {
  if (!this.participantDataMaster?.length || !formId || !participantIds?.length) return;

  const formKey15 = this.normalizeId(formId);

  this.participantDataMaster = this.participantDataMaster.map((p) => {
    if (!participantIds.includes(p.Id)) return p;

    const current = p.Accessible_Forms__c || "";
    const tokens = current.split(/[,;\s]+/).filter(Boolean);
    const already = tokens.some((t) => this.normalizeId(t) === formKey15);
    if (already) return p;

    const updated = current ? `${current}\n${formId}` : formId;
    return { ...p, Accessible_Forms__c: updated };
  });

  // Refresh mirrors & avatars
  this.participantData = [...this.participantDataMaster];
  this.participants    = [...this.participantDataMaster];

  this.attachParticipantsToForms?.();
}


 async downloadPdf() {
    const jsPDFConstructor = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDFConstructor || !jsPDFConstructor.API?.autoTable) {
      console.error("❌ jsPDF or autoTable not available.");
      return;
    }

    this.viewTableData = this.viewTableData.map((item) => {
      if (item.isPageBreak) {
        return { ...item, isVisible: true, arrow: "▼" };
      } else {
        return { ...item, isVisible: true };
      }
    });

    const doc = new jsPDFConstructor();

    if (this.orgLogoUrl) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = this.orgLogoUrl;

      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const base64Image = canvas.toDataURL("image/png");

          doc.addImage(base64Image, "PNG", 165, 10, 30, 15);
          await this.drawPdfContent(doc);
        } catch (e) {
          console.warn("⚠️ Logo error:", e);
          await this.drawPdfContent(doc);
        }
      };

      img.onerror = async () => {
        await this.drawPdfContent(doc);
      };
    } else {
      await this.drawPdfContent(doc);
    }
  }

    async drawPdfContent(doc) {
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
           const rawCheckboxValue =
              item.field?.value ?? item.value;

          const isChecked =
              rawCheckboxValue === true ||
              rawCheckboxValue === "true" ||
              rawCheckboxValue === "action:approval";

          value = isChecked ? "Yes" : "No";
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



    // Facility filter (Assign Modal only)
@track assignFacilityOptions = [];
@track assignSelectedFacilityId = 'ALL';
@track allFacilityIds = [];
loadAssignFacilities() {
  getFacilityData()
    .then((data) => {
      const facilities = Array.isArray(data) ? data : [];

      // Store all IDs
      this.allFacilityIds = facilities.map(f => f.Id);

      // Build dropdown options
      this.assignFacilityOptions = [
        { label: 'All Facilities', value: 'ALL' },
        ...facilities.map(f => ({
          label: f.Name,
          value: f.Id
        }))
      ];

      // Default = All Facilities
      this.assignSelectedFacilityId = 'ALL';

      console.log('🏥 Assign Facilities Loaded:', this.assignFacilityOptions);
    })
    .catch(err => {
      console.error('❌ Facility load failed:', err);
    });
}
handleAssignFacilityChange(event) {
  this.assignSelectedFacilityId = event.detail.value;

  const facilityIds =
    this.assignSelectedFacilityId === 'ALL'
      ? this.allFacilityIds
      : [this.assignSelectedFacilityId];

  console.log('🏥 Facility filter changed:', facilityIds);

  // Re-fetch participants
  this.fetchParticipantsfilter(facilityIds);
}
handleManageFormsClick() {
  console.log("➡️ Manage Forms clicked");
  this.manageFormsNew = true;
}

handleBackFromForms(event) {
  console.log("⬅️ Close clicked in FormsCombined:", event.detail);

  // Switch back to Submitted Forms screen
  this.manageFormsNew = false;
}



handleAudienceToggle(event) {
  const checked = event.target.checked;

  if (checked) {
    this.handleParticipantToggle();
  } else {
    this.handleStaffToggle();
  }
}



handleStaffToggle() {
  if (this.selectedAudience === 'Staff') return;

  this.selectedAudience = 'Staff';

  // 🔥 reset everything
  this.searchSubmittedQuery = '';
  this.formPageNumber = 1;
  this.formPageSize = 10;
  
  this.filteredFormResponses = [];
  this.paginatedFormResponses = [];

  this.fetchAllResponses();

}

handleParticipantToggle() {
  if (this.selectedAudience === 'Participant') return;

  this.selectedAudience = 'Participant';

  // 🔥 reset everything
  this.searchSubmittedQuery = '';
  this.formPageNumber = 1;
  this.formPageSize = 10;
  this.filteredFormResponses = [];
  this.paginatedFormResponses = [];

  this.fetchAllResponses();

}




get isStaffAudience() {
  return this.selectedAudience === 'Staff';
}

get isParticipantAudience() {
  return this.selectedAudience === 'Participant';
}
get nameColumnHeader() {
  return this.selectedAudience === 'Staff'
    ? 'Staff'
    : 'Participant';
}


async handleDownloadPdf() {
    try {
        const response = this.formResponses?.find(
            r => r.Id === this.selectedResponseId
        );

        if (!response) {
            this.showToast("Error", "Form response not found.", "error");
            return;
        }

        // Priority 1: Signed PDF
        let fileUrl = response.signatureUrl;

        // Priority 2: Generated AWS PDF
        if (!fileUrl) {
            fileUrl = response.AWS_Url__c;
        }

        if (!fileUrl) {
            this.showToast(
                "PDF Not Available",
                "Please submit the form to generate PDF.",
                "warning"
            );
            return;
        }

        // 🔥 FORCE DOWNLOAD (no new tab)
        const fetchResponse = await fetch(fileUrl);
        const blob = await fetchResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${response.Name__c || "Form"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
        console.error("❌ Download failed:", error);
        this.showToast("Error", "Unable to download PDF.", "error");
    }
}

// handleDownloadCsv() {
//     try {

//         if (!this.viewTableData || !this.viewTableData.length) {
//             this.showToast("Warning", "No data available for CSV.", "warning");
//             return;
//         }

//         let csvRows = [];

//         // Header
//         csvRows.push(`Field Label,Value`);

//         this.viewTableData.forEach(row => {

//             if (row.isPageBreak) return;
//             if (row.isSectionHeader) return;
//             if (!row.label || !row.label.trim()) return;

//             let value = "";

//             // ---------- CHECKBOX (FIXED) ----------
//             if (row.isCheckbox) {

//                 const v = row.value;

//                 value =
//                   v === true ||
//                   v === "true" ||
//                   v === "action:approval" ||
//                   v === 1 ||
//                   v === "1"
//                     ? "Yes"
//                     : "No";
//             }

//             // ---------- UPLOAD FILE (FIXED) ----------
//             else if (row.isUploadFile) {

//                 const hasAttachment =
//                   (Array.isArray(row.files) && row.files.length > 0) ||
//                   (Array.isArray(row.value) && row.value.length > 0);

//                 value = hasAttachment
//                   ? "Attachment available in PDF"
//                   : "No Attachment";
//             }

//             // ---------- SIGNATURE ----------
//             else if (row.isSignature) {

//                 const hasSignature =
//                     row.signatureUrl &&
//                     row.signatureUrl.startsWith("data:image");

//                 value = hasSignature
//                     ? "Signature Provided (See PDF)"
//                     : "No Signature";
//             }
//             else if (row.isRichText) {
//                 const tempDiv = document.createElement("div");
//                 tempDiv.innerHTML = row.value || "";
//                 value = tempDiv.textContent || "";
//             } else {
//                 value = row.value || "";
//             }

//             const safeLabel = String(row.label).replace(/"/g, '""');
//             const safeValue = String(value).replace(/"/g, '""');

//             // 🔥 TWO COLUMNS ONLY
//             csvRows.push(`"${safeLabel}","${safeValue}"`);
//         });

//         const csvContent = csvRows.join("\n");


//         const blob = new Blob(
//             ["\uFEFF" + csvContent],
//             { type: "text/csv;charset=utf-8;" }
//         );

//         const url = URL.createObjectURL(blob);

//         const link = document.createElement("a");
//         link.href = url;
//         link.download = `${this.selectedFormTitle || "Form"}.csv`;

//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);

//         URL.revokeObjectURL(url);

//     } catch (error) {
//         console.error("❌ CSV download failed:", error);
//         this.showToast("Error", "Failed to generate CSV.", "error");
//     }
// }

handleDownloadCsv() {
  try {

    if (!this.viewTableData || !this.viewTableData.length) {
      this.showToast("Warning", "No data available for CSV.", "warning");
      return;
    }

    let csvRows = [];

    csvRows.push(`Field Label,Value`);

    // =============================
    // 🔥 GROUP BY PAGE
    // =============================
    const pages = {};

    this.viewTableData.forEach(row => {

      if (row.isPageBreak) return;

      const page = row.belongsToPage || 1;

      if (!pages[page]) {
        pages[page] = [];
      }

      pages[page].push(row);
    });

    // =============================
    // 🔥 LOOP EACH PAGE
    // =============================
    Object.keys(pages).forEach((pageNumber, index) => {

      // 🔥 PAGE SEPARATOR
      csvRows.push(``);
      csvRows.push(`------ Page ${pageNumber} ------`);

      pages[pageNumber].forEach(row => {

        (row.cells || []).forEach(cell => {

          if (!cell || cell.isEmpty) return;
          if (cell.isSectionHeader) return;
          if (!cell.label || !cell.label.trim()) return;

          let value = "";

          // =============================
          // CHECKBOX
          // =============================
          if (cell.isCheckbox) {

  if (cell.value === "✔" || cell.value === true || cell.value === "true") {
    value = "Yes";
  } else {
    value = "No";
  }
}

 

          // =============================
          // SIGNATURE
          // =============================
          else if (cell.isSignature) {
            value = cell.value ? "Signature Provided" : "No Signature";
          }

          else if (cell?.field?.dataType === "Date Field") {

  if (cell.value) {
    value = cell.value; // already formatted
  } else if (cell?.field?.value) {
    value = this.formatDateDD(cell.field.value);
  } else {
    value = "";
  }
}

          // =============================
          // RICH TEXT
          // =============================
          else if (cell.isRichText) {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = cell.value || "";
            value = tempDiv.textContent || "";
          }

          // =============================
          // RADIO
          // =============================
          else if (cell.isRadioButton) {
            value = cell.value || "";
          }

          // =============================
          // TABLE BLOCK
          // =============================
          else if (cell.isTableBlock) {
            value = this.convertTableBlockToCsv(cell);
          }

else if (
  cell.isUploadFile ||
  cell?.field?.isUpload === true ||
  (Array.isArray(cell.value) && cell.value.length > 0)
) {

  const hasFile =
    (Array.isArray(cell.files) && cell.files.length > 0) ||
    (Array.isArray(cell.value) && cell.value.length > 0) ||
    cell?.field?.meta?.uploadedFiles?.length > 0;

  value = hasFile
    ? "Attachment available in PDF"
    : "No Attachment";
}

          // =============================
          // DEFAULT
          // =============================
          else {
            value = cell.value || "";
          }

          const safeLabel = String(cell.label).replace(/"/g, '""');
          const safeValue = String(value).replace(/"/g, '""');

          csvRows.push(`"${safeLabel}","${safeValue}"`);

        });

      });

    });

    const csvContent = csvRows.join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${this.selectedFormTitle || "Form"}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("❌ CSV download failed:", error);
    this.showToast("Error", "Failed to generate CSV.", "error");
  }
}


convertTableBlockToCsv(cell) {

  try {

    if (!cell.rows || !cell.headers) return "";

    let lines = [];

    // Header row
    const headers = cell.headers.map(h => h.header || "");
    lines.push(headers.join(" | "));

    // Data rows
    cell.rows.forEach(row => {

      const rowValues = row.cells.map(c => {

        if (c.isCheckbox) {
          return c.value ? "Yes" : "No";
        }

        if (c.isUploadFile) {

  const hasFile =
    (Array.isArray(c.files) && c.files.length > 0);

  return hasFile
    ? "Attachment available in PDF"
    : "No Attachment";
}

        if (c.isSignature) {
          return c.value ? "Signed" : "Not Signed";
        }

        if (c.isRichText) {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = c.value || "";
          return tempDiv.textContent || "";
        }

        return c.value || "";

      });

      lines.push(rowValues.join(" | "));

    });

    return lines.join(" || "); // multi-line in single cell

  } catch (e) {
    console.error("❌ Table block CSV conversion failed", e);
    return "";
  }
}




    updateFormPagination() {

        // 🔐 Safety fallback
        const data = Array.isArray(this.filteredFormResponses)
            ? this.filteredFormResponses
            : [];

        this.totalFormRecords = data.length;

        // ✅ If no records, reset everything cleanly
        if (this.totalFormRecords === 0) {

            this.totalFormPages = 0;
            this.formPageNumber = 1;
            this.paginatedFormResponses = [];

            this.disableFirstFormPage = true;
            this.disableLastFormPage = true;

            return;
        }

        // ✅ Calculate total pages
        this.totalFormPages = Math.ceil(
            this.totalFormRecords / this.formPageSize
        );

        // ✅ Ensure current page stays within valid range
        if (this.formPageNumber > this.totalFormPages) {
            this.formPageNumber = this.totalFormPages;
        }

        if (this.formPageNumber < 1) {
            this.formPageNumber = 1;
        }

        // ✅ Calculate slice indexes
        const start = (this.formPageNumber - 1) * this.formPageSize;
        const end = start + this.formPageSize;

        // ✅ Paginate safely
        this.paginatedFormResponses = data.slice(start, end);

        // ✅ Button state
        this.disableFirstFormPage = this.formPageNumber <= 1;
        this.disableLastFormPage =
            this.formPageNumber >= this.totalFormPages;

        console.log("📄 Pagination Updated:", {
            totalRecords: this.totalFormRecords,
            pageSize: this.formPageSize,
            currentPage: this.formPageNumber,
            totalPages: this.totalFormPages
        });
    }

@track showFormHistoryModal = false;
@track groupedFormHistory = [];


handleFormHistoryClick(event) {
  const formId = event.currentTarget.dataset.id;

  console.log("📝 History clicked for:", formId);

  // ✅ Find from already-fetched responses
  const result = this.formResponses?.find(r => r.Id === formId);

  if (!result) {
    this.showToast("Error", "Form data not found", "error");
    return;
  }

  let historyEntries = [];

  // ===============================
  // ✅ Parse custom history (if you later add it)
  // ===============================
  if (result.History_Log__c) {
    try {
      const parsed = JSON.parse(result.History_Log__c);
      historyEntries = (parsed || []).map(item => ({
        timestamp: item.timestamp,
        user: item.user || "System",
        action: item.action || "updated the form",
        content: item.content || "",
        initials: this.getInitials(item.user || "System")
      }));
    } catch (e) {
      console.error("❌ History parse error:", e);
    }
  }

  // ===============================
  // ✅ SYSTEM EVENTS (from your query)
  // ===============================
  const systemEvents = [];

  // 🧾 FORM TEMPLATE CREATED
  if (result.Form_Reference__r?.CreatedDate) {
    systemEvents.push({
      timestamp: result.Form_Reference__r.CreatedDate,
      user:
        result.Form_Reference__r?.CreatedBy?.Name || "System",
      action: "created the form template",
      content: "Form template was created",
      initials: this.getInitials(
        result.Form_Reference__r?.CreatedBy?.Name || "System"
      )
    });
  }

  // 📩 FORM SUBMITTED (response CreatedDate)
  if (result.CreatedDate) {
    systemEvents.push({
      timestamp: result.CreatedDate,
      user: result.CreatedBy?.Name || "System",
      action: "submitted the form",
      content: "Form was submitted",
      initials: this.getInitials(
        result.CreatedBy?.Name || "System"
      )
    });
  }

  // ===============================
  // ✅ Merge + sort
  // ===============================
  const allHistory = [...systemEvents, ...historyEntries]
    .filter(h => h.timestamp)
    .sort(
  (a, b) =>
    new Date(a.timestamp).getTime() -
    new Date(b.timestamp).getTime()
);


  if (!allHistory.length) {
    this.showToast(
      "No History",
      "No edit history available for this form.",
      "info"
    );
    return;
  }

  // ✅ Group for your modal UI
  this.groupedFormHistory = this.groupHistoryByDate(allHistory);

  console.log("✅ Modal history:", this.groupedFormHistory);

  this.showFormHistoryModal = true;
}
groupHistoryByDate(entries) {
  const groups = {};

  entries.forEach(item => {
    const dt = new Date(item.timestamp);

    const dateLabel = dt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const timeLabel = dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }

    groups[dateLabel].push({
      ...item,
      time: timeLabel
    });
  });

  return Object.keys(groups).map(date => ({
    date,
    entries: groups[date]
  }));
}
getInitials(name) {
  if (!name) return "NA";

  return name
    .split(" ")
    .filter(Boolean)
    .map(part => part.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
closeFormHistory() {
  console.log("🔒 Closing history modal");

  // Close modal
  this.showFormHistoryModal = false;

  // Clear data to prevent stale render
  this.groupedFormHistory = [];

  // Optional: clear any selected context
  this.selectedHistoryRecordId = null;
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



}