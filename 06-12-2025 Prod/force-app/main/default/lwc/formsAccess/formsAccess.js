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
import getFacilityData from "@salesforce/apex/HrHomeHandler.fetchFacilitiess";
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
  } else {
    console.log('⏳ Waiting for org id before loading forms…');
    // wherever you finally get a01…, call:
    // this.orgid = a01Id; this.togglePublishedForms();
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

//   fetchParticipantsfilter(facilityIdList) {
//   getParticipantsFilter({ facilityIds: facilityIdList })
//     .then((data) => {
   
//       this.participantDataMaster = (data || []).map(p => ({
//         ...p,
//         isSelected: !!p.isSelected
//       }));

//       this.participantData = [...this.participantDataMaster];
//       this.participants    = [...this.participantDataMaster];

//       this.filteredParticipants = [];
//       this.searchFormsAccessQuery = '';
//       this.pageNumber = 1;

//       console.log("✅ Participants loaded:", this.participantDataMaster.length);
//       this.paginationHelper();
//       this.tryAttach(); 
//     })
//     .catch((error) => {
//       console.error("❌ Error loading participants:", error);
//     });
// }

async fetchAllResponses() {
    if (this.clientId) return; // keep the original guard

    this.isLoading = true;
    try {
      const data = await getFormResponses(); // no params, mirrors your wire
      if (!this._isConnected) return;        // avoid setting state after unmount

      this.wiredFormResponses = { data, error: undefined };
      if (data) {
        this.processFormResponses(data);     // your existing handler
      }
    } catch (error) {
      if (!this._isConnected) return;
      this.wiredFormResponses = { data: undefined, error };
      // match original logging
      // eslint-disable-next-line no-console
      console.error('❌ Error fetching all responses:', error);
    } finally {
      if (this._isConnected) this.isLoading = false;
    }
  }

fetchParticipantsfilter(facilityIdList) {
  getParticipantsFilter({ facilityIds: facilityIdList })
    .then((data) => {
      const rows = Array.isArray(data) ? data : [];

      // 🔎 Summary: do any participants have staff?
      const withStaff = rows.filter(p => Array.isArray(p.staffMembers) && p.staffMembers.length > 0).length;
      console.log(`📈 Any participant has staff? ${withStaff > 0 ? 'YES' : 'NO'} — ${withStaff}/${rows.length} have ≥1 staff.`);

      // (optional) per-participant detail — uncomment if needed
      // rows.forEach(p => console.log(`👤 ${p.Name}: ${Array.isArray(p.staffMembers) && p.staffMembers.length ? `Staff ${p.staffMembers.length}` : 'No Staff'}`));

      // MASTER
      this.participantDataMaster = rows.map(p => ({
        ...p,
        isSelected: !!p.isSelected
      }));

      // Back-compat mirrors
      this.participantData = [...this.participantDataMaster];
      this.participants    = [...this.participantDataMaster];

      // Reset search/filter & paging
      this.filteredParticipants = [];
      this.searchFormsAccessQuery = '';
      this.pageNumber = 1;

      console.log("✅ Participants loaded:", this.participantDataMaster.length);
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
            ? participant.Accessible_Forms__c.split("\n")
            : [],
          isSelected: false
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

     const orgIdParam = this.orgid || null; // falls back server-side if null

    getForms({ orgId: orgIdParam })

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

  @wire(getFormsByClient, { clientId: "$clientId",orgId: this.orgid })
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
  // @wire(getFormResponses)
  // wiredAllResponses(result) {
  //   if (!this.clientId) {
  //     // ✅ Trigger only when Client ID is NOT present
  //     this.wiredFormResponses = result;
  //     if (result.data) {
  //       this.processFormResponses(result.data);
  //     } else if (result.error) {
  //       console.error("❌ Error fetching all responses:", result.error);
  //     }
  //   }
  // }

  // ✅ Process responses and format date
  processFormResponses(data) {
    this.formResponses = data.map((response) => ({
      ...response,
      FormattedDate: this.formatDate(response.CreatedDate),
      formImageUrl: this.getRandomFormImage()
    }));

    this.filteredFormResponses = [...this.formResponses]; // ✅ Init filter
    this.totalFormRecords = this.filteredFormResponses.length;
    this.totalFormPages = Math.ceil(this.totalFormRecords / this.formPageSize);
    this.updatePaginatedFormResponses();
  }

  // ✅ Format date as "dd-MM-yyyy"
  formatDate(isoDate) {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB"); // ✅ Formats as "dd/MM/yyyy"
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
  const master = this.participantDataMaster || [];
  const usingSearch = !!(this.searchFormsAccessQuery && this.searchFormsAccessQuery.trim());
  const source = usingSearch ? (this.filteredParticipants || []) : master;

  if (!source.length) {
    this.noRecordsFlag = true;
    this.recordsToDisplay = [];
    this.totalPages = 0;
    this.totalPagestotalParticipants = 0; // keep your legacy field in sync
    this.totalParticipants = 0;
    return;
  }

  this.noRecordsFlag = false;

  // totals
  const total = source.length;
  this.totalParticipants = total;
  this.totalPages = Math.ceil(total / this.pageSize);
  this.totalPagestotalParticipants = this.totalPages; // legacy mirror

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

  handleView(event) {
    this.isViewMode = true;
    this.selectedResponseId = event.currentTarget.dataset.id;
    const response = this.formResponses.find(
      (resp) => resp.Id === this.selectedResponseId
    );

    if (response) {
      const formJson = JSON.parse(response.Response_JSON__c);
      this.prepareViewTable(formJson);

      // ✅ Set Form Title and Type for header display
      this.selectedFormType = response.Form_Type__c || "Unknown Form Type";
      this.selectedFormTitle = response.Name__c || "Untitled Form";

      // ✅ Ensure selected values are marked properly in dropdown options
      this.tableRows = formJson.map((row) => ({
        ...row,
        cells: row.cells.map((cell) => {
          if (cell.isDropdownField && cell.isMultiSelect) {
            let selectedOptionsArray = cell.field.value
              ? cell.field.value.split(", ")
              : [];
            cell.field.options.forEach((option) => {
              option.isSelected = selectedOptionsArray.includes(option.label);
            });
            cell.selectedValues = cell.field.value;
          }
          return cell;
        })
      }));
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
    // Only show fields for current step
    this.tableRows = this.stepPagedRows[this.stepCurrentPageIndex].map(
      (row) => ({
        ...row,
        cells: row.cells.map((cell) => ({
          ...cell,
          isVisible:
            !(
              cell.field?.dataType === "Blank" &&
              cell.field?.label?.toLowerCase().trim() === "page break"
            ) && cell.style !== "display: none;",
          hasContent: !!(cell.field?.label || cell.field?.value)
        }))
      })
    );
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
    if (cell.isDropdownField) {
      return cell.field.value ? cell.field.value : "—";
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

  getFormattedValue(cell) {
    if (cell.isCheckboxField) {
      return cell.field.value ? "action:approval" : "action:close";
    }
    if (cell.isDropdownField && cell.isMultiSelect) {
      return cell.selectedValues || "—"; // ✅ Show selected multi-select values
    }
    if (cell.isDropdownField) {
      return cell.field.value ? cell.field.value : "—"; // ✅ Show selected dropdown value
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
        orgId: this.orgid,
        clientId: this.clientId,
        participantName: this.selectedParticipantName || ""
      });

      saveFormResponse({
        formId: this.selectedForm.Id,
        responseJson: responseJson,
        orgId: this.orgid,
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

  handleSubmittedFormSearch(event) {
    this.searchSubmittedQuery = event.target.value.toLowerCase();

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

  const formId = event.currentTarget?.dataset?.id;
  this.selectedFormId = formId;

  const selectedForm = this.forms?.find(f => f.Id === formId);
  this.selectedFormTitle = selectedForm ? (selectedForm.Name__c || selectedForm.Name || 'Form') : 'Form';

  // ✅ Mark selections on the MASTER list you paginate from
  // Use participantDataMaster if you implemented it; otherwise use participantData
  const master = Array.isArray(this.participantDataMaster) && this.participantDataMaster.length
    ? 'participantDataMaster'
    : 'participantData';

  this[master] = (this[master] || []).map(p => ({
    ...p,
    isSelected: this.hasAccess(p, formId)
  }));

  // Keep mirrors in sync if other code relies on them
  this.participantData = [...this[master]];
  this.participants    = [...this[master]];

  // If there is an active search, refresh the filtered view from MASTER
  const hasQuery = !!(this.searchFormsAccessQuery && this.searchFormsAccessQuery.trim());
  this.filteredParticipants = hasQuery
    ? this.filterParticipants(this[master], this.searchFormsAccessQuery)
    : [];

  // Recompute "Select All" against the active source
  const source = hasQuery ? this.filteredParticipants : this[master];
  this.isAllParticipantsSelected = !!source.length && source.every(p => p.isSelected);

  // Reset to page 1 (optional) and paginate
  this.pageNumber = 1;
  this.paginationHelper();

  // Open the modal
  this.showAssignModal = true;

  // Debug (optional)
  console.log('🔎 Preselected count:',
    source.filter(p => p.isSelected).length,
    'of', source.length
  );
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

}