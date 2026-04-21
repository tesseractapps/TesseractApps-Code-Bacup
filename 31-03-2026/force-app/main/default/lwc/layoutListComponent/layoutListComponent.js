// layoutListComponent.js
import { LightningElement, track, api } from "lwc";
import getAllLayouts from "@salesforce/apex/LayoutController.getAllLayouts";
import deleteLayout from "@salesforce/apex/LayoutController.deleteLayout";

import getLayoutData from "@salesforce/apex/LayoutController.getLayoutData";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import { publish, MessageContext } from "lightning/messageService";
import LAYOUT_MESSAGE_CHANNEL from "@salesforce/messageChannel/LayoutMessageChannel__c";
import { wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getDefaultFormLayout from "@salesforce/apex/LayoutController.getDefaultFormLayout";
import StaticForms from "@salesforce/resourceUrl/Static_Forms";
import getUnifiedForms from '@salesforce/apex/LayoutController.getUnifiedForms';
// import getStaffAccess
//   from '@salesforce/apex/LayoutController.getStaffAccess';
// import getParticipantsAccess
//   from '@salesforce/apex/LayoutController.getParticipantsAccess';

  import getParticipantsFilter
  from '@salesforce/apex/FormController.getParticipantsFilter';
  import fetchFacilitiess
  from '@salesforce/apex/FormController.fetchFacilitiess';

  import fetchStaffRolesByFacility from '@salesforce/apex/LayoutController.fetchStaffRolesByFacility';
  import getStaffForAssign from '@salesforce/apex/LayoutController.getStaffForAssign';
  import grantAccessToParticipantsBulk
  from '@salesforce/apex/LayoutController.grantAccessToParticipantsBulk';

import grantAccessToStaffBulk
  from '@salesforce/apex/LayoutController.grantAccessToStaffBulk';



const FORM_IMAGE_1 = `${StaticForms}/form1.png`;
const FORM_IMAGE_2 = `${StaticForms}/form2.png`;

const formImages = [FORM_IMAGE_1, FORM_IMAGE_2];

export default class LayoutListComponent extends NavigationMixin(
  LightningElement
) {
  @track defaultLayouts = [];
  @track customLayouts = [];
  searchKey = '';
allLayouts = []; // keep original copy
  @api selectedFormType = "";
  @api formModule;

  @track selectedAudience = 'Staff'; // default
  @track participantDataMaster = [];
@track showAssignModal = false;


  @wire(MessageContext) messageContext;
  @api orgid;
  layoutDataWireResult;

  isLoadingLayouts = false;
_lastLoadSeq = 0;     // protects against race conditions
_lastLoadedSig = null;

  // @wire(getAllLayouts, { orgId: "$orgid", formModule: "$formModule" })
  // wiredLayoutData(result) {
  //   this.layoutDataWireResult = result;

  //   if (result.data) {
  //     const layoutMap = result.data;

  //     this.customLayouts = layoutMap.CustomLayouts.map((layout) => ({
  //       ...layout,
  //       layoutName: layout.layoutName,
  //       displayName: layout.displayName,
  //       image: this.getRandomFormImage(),
  //       createdById: layout.createdById,
  //     createdByName: layout.createdByName,
  //     createdByInitials: this.getInitials(layout.createdByName)
  //     }));

  //     this.defaultLayouts = layoutMap.DefaultLayouts.map((layout) => ({
  //       ...layout,
  //       layoutName: layout.layoutName,
  //       displayName: layout.displayName
  //     }));

  //     this.pageNumber = 1;
  //     this.allLayouts = [...this.customLayouts];
  //     this.paginateLayouts();
  //   } else if (result.error) {
  //     console.error("❌ Error in wired layout fetch:", result.error);
  //     this.showToast("Error", "Failed to retrieve saved layouts.", "error");
  //   }
  // }

  // Example setters you can call from wherever you currently learn these values:
applyOrgId(a01) {
  const next = (a01 || '').trim();
  if (!next || next === this.orgid) return;
  this.orgid = next;
  this.loadLayoutsIfReady();
}

applyFormModule(mod) {
  const next = (mod || '').trim();
  if (!next || next === this.formModule) return;
  this.formModule = next;
  this.loadLayoutsIfReady();
}


  async loadLayoutsIfReady() {
  if (!this.orgid || !this.formModule) {
    console.log('⏳ Skipping layout load (missing orgid/formModule):', { orgid: this.orgid, formModule: this.formModule });
    return;
  }
  // await this.loadLayouts(); 
  await this.loadUnifiedForms();
}

// async loadLayouts() {
//   const seq = ++this._lastLoadSeq;        // keep race protection
//   this.isLoadingLayouts = true;

//   console.groupCollapsed('📥 loadLayouts()');
//   console.log('params:', { orgId: this.orgid, formModule: this.formModule });

//   try {
//     // If needed, add a cache buster param to Apex signature and pass here.
//     const layoutMap = await getAllLayouts({ orgId: this.orgid, formModule: this.formModule });

//     // Drop late responses if a newer call started
//     if (seq !== this._lastLoadSeq) {
//       console.warn('⚠️ Stale layout response ignored (newer request in flight).');
//       return;
//     }

//     // --- ALWAYS remap fresh data ---
//     this.customLayouts = (layoutMap?.CustomLayouts || []).map((layout) => ({
//       ...layout,
//       layoutName: layout.layoutName,
//       displayName: layout.displayName,
//       image: this.getRandomFormImage(),
//       createdById: layout.createdById,
//       createdByName: layout.createdByName,
//       createdByInitials: this.getInitials(layout.createdByName)
//     }));

//     this.defaultLayouts = (layoutMap?.DefaultLayouts || []).map((layout) => ({
//       ...layout,
//       layoutName: layout.layoutName,
//       displayName: layout.displayName
//     }));

//     // reset paging off the fresh dataset
//     this.pageNumber = 1;
//     this.allLayouts = [...this.customLayouts];
//     this.paginateLayouts();

//     console.log('✅ Layouts loaded:', {
//       custom: this.customLayouts.length,
//       defaults: this.defaultLayouts.length
//     });
//   } catch (error) {
//     console.error('❌ Error in layout fetch (imperative):', error);
//     this.showToast('Error', 'Failed to retrieve saved layouts.', 'error');
//   } finally {
//     if (seq === this._lastLoadSeq) this.isLoadingLayouts = false;
//     console.groupEnd();
//   }
// }

async loadUnifiedForms() {

  const seq = ++this._lastLoadSeq;
  this.isLoadingLayouts = true;

  console.groupCollapsed('📥 loadUnifiedForms()');

  console.log('▶ params', {
    orgId: this.orgid,
    formModule: this.formModule,
    audience: this.selectedAudience
  });

  try {

    const rows = await getUnifiedForms({
      orgId: this.orgid,
      formModule: this.formModule,
      audience: this.selectedAudience
    });

    console.log('🧾 Apex returned rows:', rows);

    // =====================================================
    // 🔵 MAP ROWS
    // =====================================================

    const mappedRows = (rows || []).map((row, idx) => {

      const creatorInitials =
        this.getInitialsSafe(row.createdByName);

      // 🔥 SAFE defaults
      const staffUsers =
        row.staffUsers || [];

      const participantUsers =
        row.participantUsers || [];

      const mapped = {

        // -------------------------------------------------
        // BASIC FORM DATA
        // -------------------------------------------------

        layoutName: row.recordId,
        title: row.formName,
        displayName: row.category,

        createdByName: row.createdByName,
        createdByInitials: creatorInitials,

        createdDateRaw: row.createdDate,

        dateTimeString:
          this.formatDate(row.createdDate),

        isSelected: false,

        category: row.category,

        isDraft: row.category === 'Draft',
        isPublished: row.category === 'Published',

        // -------------------------------------------------
        // 🔥 RAW ACCESS ARRAYS
        // -------------------------------------------------

        staffUsers,
        participantUsers,

        // =================================================
        // 👔 STAFF DISPLAY
        // =================================================

        hasVisibleStaff:
          row.category === 'Published' &&
          staffUsers.length > 0,

        visibleStaff:
          staffUsers.slice(0, 5),

        hasExtraStaff:
          staffUsers.length > 5,

        extraStaffCount:
          Math.max(0, staffUsers.length - 5),

        extraStaffNames:
          staffUsers
            .slice(5)
            .map(u => u.name)
            .join(', '),

        // =================================================
        // 👥 PARTICIPANT DISPLAY
        // =================================================

        hasVisibleParticipants:
          row.category === 'Published' &&
          participantUsers.length > 0,

        visibleParticipants:
          participantUsers.slice(0, 5),

        hasExtraParticipants:
          participantUsers.length > 5,

        extraParticipantCount:
          Math.max(0, participantUsers.length - 5),

        extraParticipantNames:
          participantUsers
            .slice(5)
            .map(u => u.name)
            .join(', '),

        // -------------------------------------------------
        // CATEGORY STYLE
        // -------------------------------------------------

        categoryClass:
          row.category === 'Draft'
            ? 'publishtable-ellipsis nd-pill nd-pill--draft'
            : row.category === 'Published'
              ? 'publishtable-ellipsis nd-pill nd-pill--published'
              : 'publishtable-ellipsis'
      };

      console.log(`🔍 mapped row #${idx + 1}`, mapped);

      return mapped;
    });

    // =====================================================
    // 🔀 SORT (DESC)
    // =====================================================

    mappedRows.sort((a, b) => {
      return new Date(b.createdDateRaw) -
             new Date(a.createdDateRaw);
    });

    // =====================================================
    // 📦 ASSIGN + PAGINATE
    // =====================================================

    this.allLayouts = [...mappedRows];
    this.customLayouts = [...mappedRows];

    console.log('📊 total mapped rows:', this.allLayouts.length);

    this.pageNumber = 1;
    this.paginateLayouts();

    console.log('📄 paginatedLayouts:', this.paginatedLayouts);

  } catch (err) {

    console.error('❌ loadUnifiedForms failed', err);

    if (err?.body?.message) {
      console.error('⚠ Apex message:', err.body.message);
    }

    this.showToast(
      'Error',
      'Failed to load forms.',
      'error'
    );

  } finally {

    this.isLoadingLayouts = false;

    console.groupEnd();
  }
}




formatDate = (dateValue) => {

  if (!dateValue) return '';

  const date = new Date(dateValue);

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};


getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] || '';
  const b = parts[1]?.[0] || '';
  return (a + b || a).toUpperCase() || 'U';
}


@track cardFlag = false; 

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


   try {
    const saved = localStorage.getItem('formsViewMode');
    if (saved === 'card')  this.cardFlag = true;
    if (saved === 'table') this.cardFlag = false;
  } catch (e) {}
  this.loadLayoutsIfReady();

  window.addEventListener(
    'click',
    this.handleAssignOutsideClick.bind(this)
  );

}
 
  getRandomFormImage() {
    const index = Math.floor(Math.random() * formImages.length);
    return formImages[index];
  }

  renderedCallback() {
    // Attach event listeners for edit and delete links
    this.template.querySelectorAll(".edit-link").forEach((link) => {
      link.addEventListener("click", this.handleEditLayout.bind(this));
    });

    this.template.querySelectorAll(".delete-link").forEach((link) => {
      link.addEventListener("click", this.handleDeleteLayout.bind(this));
    });
  }

  // Handle edit action and dispatch event
  
  async handleEditLayout(event) {
    try {
      const layoutId = event.detail.layoutId; // Get layout ID to edit
      const layoutData = await getLayoutData({ layoutName: layoutId }); // Fetch data based on layout ID

      if (layoutData) {
        // Load layout data into the component for editing
        this.layoutId = layoutId;
        this.formTitle = layoutData.title || ""; // Set the title
        this.tableRows = JSON.parse(layoutData.layoutJson).tableRows || []; // Load table structure
        this.selectedFormType = layoutData.layoutName; // Set the dropdown to the layout name
        console.log("Editing layout:", layoutData);

        // Update dropdown value
        requestAnimationFrame(() => {
          const dropdown = this.template.querySelector(".form-dropdown");
          if (dropdown) dropdown.value = this.selectedFormType;
        });

        this.showToast("Success", "Layout loaded for editing.", "success");
      } else {
        this.showToast("Error", "No layout data found for editing.", "error");
      }
    } catch (error) {
      console.error("Error loading layout for editing:", error);
      this.showToast("Error", "Failed to load layout for editing.", "error");
    }
  }

  // Main Edit

  // Handle the edit action, emit layout ID to dragdropcomp
  // handleEditLayout(event) {
  //   const layoutName = event.currentTarget.dataset.id;

  //   getLayoutData({ layoutName })
  //     .then((layoutData) => {
  //       console.log("✅ Retrieved layout data for editing:", layoutData);

  //       const message = {
  //         layoutName: layoutData.layoutName, // Unique identifier (Name)
  //         formType: layoutData.displayName, // Display-friendly Name__c
  //         layoutJSON: layoutData.layoutJson, // JSON structure
  //         formModule: layoutData.formModule, // ✅ Form Module (Customizable/Incident)
  //         actionType: "edit",
  //         title: layoutData.title
  //       };

  //       console.log(
  //         "📤 Publishing layout edit message:",
  //         JSON.stringify(message)
  //       );

  //       publish(this.messageContext, LAYOUT_MESSAGE_CHANNEL, message);
  //     })
  //     .catch((error) => {
  //       console.error("❌ Error loading layout for editing:", error);
  //       this.showToast(
  //         "Error",
  //         "Failed to load layout. Please try again.",
  //         "error"
  //       );
  //     });
  // }

// Main Edit
  async handleEditLayout(event) {
  const layoutName = event.currentTarget.dataset.id;

  try {
    const layoutData = await getLayoutData({ layoutName });

    console.log("✅ Retrieved layout data for editing:", layoutData);

    let finalLayoutJson;

    // 🔁 Resolve AWS vs legacy inline
    const raw = layoutData.layoutJson;

    if (raw) {
      const parsed = JSON.parse(raw);

      if (parsed?.url && parsed?.key) {
        console.log("🌐 Layout JSON stored in AWS — fetching:", parsed.url);

        const resp = await fetch(parsed.url);
        if (!resp.ok) {
          throw new Error("Failed to load layout JSON from AWS");
        }

        finalLayoutJson = await resp.json();
      } else {
        // legacy inline
        finalLayoutJson = parsed;
      }
    }

    const message = {
      layoutName: layoutData.layoutName,
      formType: layoutData.displayName,
      layoutJSON: finalLayoutJson, // ✅ actual structure now
      formModule: layoutData.formModule,
      actionType: "edit",
      title: layoutData.title,
      audience: layoutData.audience
    };

    console.log("📤 Publishing layout edit message:", message);

    publish(this.messageContext, LAYOUT_MESSAGE_CHANNEL, message);

  } catch (error) {
    console.error("❌ Error loading layout for editing:", error);
    this.showToast(
      "Error",
      "Failed to load layout. Please try again.",
      "error"
    );
  }
}


  // Single, consolidated handleDeleteLayout method
  async handleDeleteLayout(event) {
    const layoutName = event.currentTarget.dataset.id;
    console.log("Captured layoutName for deletion:", layoutName); // Log to confirm value

    if (!layoutName) {
      this.showToast("Error", "Layout Name is missing for deletion.", "error");
      return;
    }

    try {
      // Call Apex delete function with correct parameter
      await deleteLayout({ layoutName });
      console.log("Layout deleted successfully:", layoutName);

      // Refresh the layout list and show success toast
      // this.fetchAllLayouts();
      // await refreshApex(this.layoutDataWireResult);
      await this.loadLayoutsIfReady();

      this.showToast("Success", "Draft Form deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting layout:", error);
      this.showToast("Error", "Failed to delete layout.", "error");
    }
  }

  // // Handle the delete action, emit layout ID to dragdropcomp
  // async handleDeleteLayout(event) {
  //     const layoutName = event.currentTarget.dataset.id;
  //     console.log('Captured layoutName for deletion:', layoutName); // Check if layoutName is populated correctly

  //     if (!layoutName) {
  //         this.showToast('Error', 'Layout Name is missing for deletion.', 'error');
  //         return;
  //     }

  //     try {
  //         // Call Apex delete function
  //         await deleteLayout({ layoutName });
  //         this.dispatchEvent(new CustomEvent('refreshlayouts'));
  //         this.showToast('Success', 'Layout deleted successfully.', 'success');
  //     } catch (error) {
  //         console.error('Error deleting layout:', error);
  //         this.showToast('Error', 'Failed to delete layout.', 'error');
  //     }
  // }

  handleCloneLayout(event) {
    const layoutName = event.currentTarget.dataset.id; // Retrieve Name (unique identifier)
    console.log("Cloning layout with Name:", layoutName);

    if (layoutName) {
      getDefaultFormLayout({ layoutName }) // Pass Name (not Name__c) to Apex
        .then((layoutData) => {
          console.log("Layout data retrieved for cloning:", layoutData);

          // Convert Proxy object to a regular object
          const clonedLayoutData = JSON.parse(JSON.stringify(layoutData));

          publish(this.messageContext, LAYOUT_MESSAGE_CHANNEL, {
            actionType: "clone",
            formType: clonedLayoutData.formType,
            layoutJSON: clonedLayoutData.Form_JSON__c,
            Name__c: clonedLayoutData.Name__c
          });
        })
        .catch((error) => {
          console.error("Error cloning layout:", error);
          this.showToast(
            "Error",
            "Failed to clone layout. Please try again.",
            "error"
          );
        });
    } else {
      console.warn("No layoutName found for cloning.");
    }
  }

  // Show toast messages
  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

  // // Handle delete action
  // async handleDeleteLayout(event) {
  //     try {
  //         const layoutId = event.target.dataset.id; // Retrieve the ID of the layout to delete
  //         await deleteLayout({ layoutName: layoutId }); // Call Apex to delete the layout

  //         // Refresh the layout list in layoutListComponent to reflect changes
  //         this.dispatchEvent(new CustomEvent('refreshlayouts'));
  //         this.showToast('Success', 'Layout deleted successfully.', 'success');
  //     } catch (error) {
  //         console.error('Error deleting layout:', error);
  //         this.showToast('Error', 'Failed to delete layout.', 'error');
  //     }
  // }

  handleBackToForm() {
    this.dispatchEvent(new CustomEvent("backtoform"));
  }

  // Handle delete action
  // handleDeleteLayout(event) {
  //     const layoutId = event.target.dataset.id;

  //     deleteLayout({ layoutId })
  //         .then(() => {
  //             this.fetchAllLayouts();
  //             this.dispatchEvent(
  //                 new ShowToastEvent({
  //                     title: 'Success',
  //                     message: 'Layout deleted successfully.',
  //                     variant: 'success',
  //                 })
  //             );
  //         })
  //         .catch((error) => {
  //             console.error('Error deleting layout:', error);
  //             this.dispatchEvent(
  //                 new ShowToastEvent({
  //                     title: 'Error',
  //                     message: 'Failed to delete layout.',
  //                     variant: 'error',
  //                 })
  //             );
  //         });
  // }

  @track pageNumber = 1;
  @track pageSize = 10;
  @track totalRecords = 0;
  @track totalPages = 0;
  @track bDisableFirst = true;
  @track bDisableLast = true;
  @track paginatedLayouts = [];

  pageSizeOptions = [10, 15, 20];
  handleSearchChange(event) {
    this.searchKey = event.target.value.toLowerCase();

    if (this.searchKey) {
        this.customLayouts = this.allLayouts.filter(layout =>
            (layout.title || '').toLowerCase().includes(this.searchKey)
        );
    } else {
        // reset when search empty
        this.customLayouts = [...this.allLayouts];
    }

    this.pageNumber = 1;  // reset to first page on new search
    this.paginateLayouts();
}

  paginateLayouts() {
    this.totalRecords = this.customLayouts.length;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLayouts = this.customLayouts.slice(start, end);

    this.bDisableFirst = this.pageNumber === 1;
    this.bDisableLast = this.pageNumber === this.totalPages;
  }
  firstPage() {
    this.pageNumber = 1;
    this.paginateLayouts();
  }

  lastPage() {
    this.pageNumber = this.totalPages;
    this.paginateLayouts();
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.paginateLayouts();
    }
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber++;
      this.paginateLayouts();
    }
  }

  handleRecordsPerPage(event) {
    this.pageSize = parseInt(event.target.value, 10);
    this.pageNumber = 1;
    this.paginateLayouts();
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

  // ---------------------------------
  // 🔥 RESET TABLE BULK SELECTION
  // ---------------------------------

  this.selectAllPublishedChecked = false;
  this.isBulkAssign = false;
  this.selectedFormId = null;

  this.allLayouts = this.allLayouts.map(l => ({
    ...l,
    isSelected: false
  }));

  this.customLayouts = [...this.allLayouts];

  // ---------------------------------
  // 🔒 clear participant state
  // ---------------------------------

  this.assignParticipantsPage = [];
  this.assignParticipantsFiltered = [];
  this.assignParticipantMaster = [];
  this.assignTotalRecords = 0;

  this.loadLayoutsIfReady();
}


handleParticipantToggle() {

  if (this.selectedAudience === 'Participant') return;

  this.selectedAudience = 'Participant';

  // ---------------------------------
  // 🔥 RESET TABLE BULK SELECTION
  // ---------------------------------

  this.selectAllPublishedChecked = false;
  this.isBulkAssign = false;
  this.selectedFormId = null;

  this.allLayouts = this.allLayouts.map(l => ({
    ...l,
    isSelected: false
  }));

  this.customLayouts = [...this.allLayouts];

  // ---------------------------------
  // 🔒 clear staff state
  // ---------------------------------

  this.assignStaffPage = [];
  this.assignStaffFiltered = [];
  this.assignStaffMaster = [];
  this.assignStaffTotalRecords = 0;

  this.loadLayoutsIfReady();
}



get isStaffAudience() {
  return this.selectedAudience === 'Staff';
}

get isParticipantAudience() {
  return this.selectedAudience === 'Participant';
}


normalizeId(id) {
  if (!id) return '';
  return id.substring(0, 15);
}
parseAccessibleForms(raw) {

  if (!raw) return [];

  return raw
    // ✅ supports:
    // newline, carriage return, semicolon, comma
    .split(/[\n\r;,]+/)
    .map(x => x.trim())
    .filter(Boolean)
    .map(id => this.normalizeId(id));
}

getInitialsSafe(name) {

  if (!name) return '';

  return name
    .split(' ')
    .map(p => p.charAt(0))
    .join('')
    .toUpperCase();
}





// ==========================
// PARTICIPANT ASSIGN STATE
// ==========================

assignParticipantMaster = [];
assignParticipantsFiltered = [];
assignParticipantsPage = [];

assignParticipantSearchTerm = '';

assignPageNumber = 1;
assignPageSize = 10;
assignTotalPages = 0;
assignTotalRecords = 0;

bDisableAssignFirst = true;
bDisableAssignLast = true;

assignSelectAllChecked = false;
selectAllPublishedChecked = false;


// ==========================
// ASSIGN FACILITY STATE
// ==========================

assignSelectedFacilities = [];
assignFilteredFacilityOptions = [];
assignFacilityOptions = [];
assignFacilitySearchTerm = '';
showAssignFacilityOptions = false;

allFacilityIds = [];

get isAssignParticipants() {
  return this.selectedAudience === 'Participant';
}

get isAssignStaff() {
  return this.selectedAudience === 'Staff';
}

// ==========================
// STAFF ASSIGN STATE
// ==========================

assignStaffMaster = [];
assignStaffFiltered = [];
assignStaffPage = [];

assignStaffSearchTerm = '';

assignStaffPageNumber = 1;
assignStaffPageSize = 10;
assignStaffTotalPages = 0;
assignStaffTotalRecords = 0;

bDisableAssignStaffFirst = true;
bDisableAssignStaffLast = true;
// ==========================
// STAFF ROLE FILTER STATE
// ==========================

assignSelectedRoles = [];
assignRoleOptions = [];
assignFilteredRoleOptions = [];
assignRoleSearchTerm = '';
showAssignRoleOptions = false;

// ==========================
// STAFF SELECT ALL
// ==========================

assignStaffSelectAllChecked = false;



async loadAssignParticipantsByFacility(facilityIds) {

  console.group('👥 loadAssignParticipantsByFacility');

  console.log('Facilities:', facilityIds);

  const rows = await getParticipantsFilter({
    facilityIds
  });

  console.log('🧾 Apex participants:', rows);

  // normalize
  this.assignParticipantMaster = rows.map(r => ({

    Id: r.Id,
    Name: r.Name,

    // ⭐ UPDATED FIELD
    FacilityName: r.Facility_Names,

    Status: r.Participant_Status__c,
    AccessibleForms: r.Accessible_Forms__c,
    Picture: r.Picture__c,

    isSelected: false,

    initials: this.getInitialsSafe(r.Name)

  }));

  this.assignParticipantsFiltered =
    [...this.assignParticipantMaster];

  this.assignPageNumber = 1;

  this.applyAssignPagination();

  console.groupEnd();
}


handleAssignParticipantSearch(event) {

  this.assignParticipantSearchTerm =
    event.target.value?.toLowerCase() || '';

  const term = this.assignParticipantSearchTerm;

  this.assignParticipantsFiltered =
    this.assignParticipantMaster.filter(p =>
      (p.Name || '').toLowerCase().includes(term)
    );

  this.assignPageNumber = 1;

  this.applyAssignPagination();
}

handleAssignSelectAll(event) {

  const checked = event.target.checked;

  this.assignSelectAllChecked = checked;

  this.assignParticipantsFiltered =
    this.assignParticipantsFiltered.map(p => ({
      ...p,
      isSelected: checked
    }));

  // sync master
  const mapIds =
    new Map(
      this.assignParticipantsFiltered.map(p => [p.Id, p])
    );

  this.assignParticipantMaster =
    this.assignParticipantMaster.map(p =>
      mapIds.get(p.Id) || p
    );

  this.applyAssignPagination();
}
handleAssignParticipantToggle(event) {

  console.group('👥 handleAssignParticipantToggle');

  const id = event.target.dataset.id;
  const checked = event.target.checked;

  console.log('➡ Participant Id:', id);
  console.log('✅ Checked:', checked);

  // -----------------------------
  // Update MASTER
  // -----------------------------

  this.assignParticipantMaster =
    this.assignParticipantMaster.map(p =>
      p.Id === id
        ? { ...p, isSelected: checked }
        : p
    );

  const masterSelected =
    this.assignParticipantMaster
      .filter(p => p.isSelected)
      .map(p => p.Id);

  console.log('📦 assignParticipantMaster selected:', masterSelected);

  // -----------------------------
  // Update FILTERED
  // -----------------------------

  this.assignParticipantsFiltered =
    this.assignParticipantsFiltered.map(p =>
      p.Id === id
        ? { ...p, isSelected: checked }
        : p
    );

  const filteredSelected =
    this.assignParticipantsFiltered
      .filter(p => p.isSelected)
      .map(p => p.Id);

  console.log('📦 assignParticipantsFiltered selected:', filteredSelected);

  // -----------------------------
  // Select All state
  // -----------------------------

  this.assignSelectAllChecked =
    this.assignParticipantsFiltered.length &&
    this.assignParticipantsFiltered.every(p => p.isSelected);

  console.log(
    '☑ Select All Checked:',
    this.assignSelectAllChecked
  );

  // -----------------------------
  // Refresh page
  // -----------------------------

  this.applyAssignPagination();

  console.groupEnd();
}


handleAssignStaffToggle(event) {

  const id = event.target.dataset.id;
  const checked = event.target.checked;

  console.group('👔 handleAssignStaffToggle');

  console.log('➡ Staff Id:', id);
  console.log('✅ Checked:', checked);

  // -------------------------
  // Update master list
  // -------------------------

  this.assignStaffMaster =
    this.assignStaffMaster.map(s =>
      s.Id === id
        ? { ...s, isSelected: checked }
        : s
    );

  console.log(
    '📦 assignStaffMaster selected:',
    this.assignStaffMaster.filter(s => s.isSelected).map(s => s.Id)
  );

  // -------------------------
  // Update filtered list
  // -------------------------

  this.assignStaffFiltered =
    this.assignStaffFiltered.map(s =>
      s.Id === id
        ? { ...s, isSelected: checked }
        : s
    );

  console.log(
    '📦 assignStaffFiltered selected:',
    this.assignStaffFiltered.filter(s => s.isSelected).map(s => s.Id)
  );

  // -------------------------
  // Update Select-All state
  // -------------------------

  this.assignStaffSelectAllChecked =
    this.assignStaffFiltered.length &&
    this.assignStaffFiltered.every(s => s.isSelected);

  console.log(
    '☑ Select All Checked:',
    this.assignStaffSelectAllChecked
  );

  // -------------------------
  // Refresh page
  // -------------------------

  this.applyAssignStaffPagination();

  console.groupEnd();
}

applyAssignPagination() {

  const start =
    (this.assignPageNumber - 1) *
    this.assignPageSize;

  const end =
    start + this.assignPageSize;

  this.assignParticipantsPage =
    this.assignParticipantsFiltered.slice(start, end);

  this.assignTotalRecords =
    this.assignParticipantsFiltered.length;

  this.assignTotalPages =
    Math.ceil(
      this.assignTotalRecords /
      this.assignPageSize
    );

  this.bDisableAssignFirst =
    this.assignPageNumber <= 1;

  this.bDisableAssignLast =
    this.assignPageNumber >= this.assignTotalPages;
}
firstPageAssign() {
  this.assignPageNumber = 1;
  this.applyAssignPagination();
}

previousPageAssign() {
  if (this.assignPageNumber > 1) {
    this.assignPageNumber--;
    this.applyAssignPagination();
  }
}

nextPageAssign() {
  if (this.assignPageNumber < this.assignTotalPages) {
    this.assignPageNumber++;
    this.applyAssignPagination();
  }
}

lastPageAssign() {
  this.assignPageNumber = this.assignTotalPages;
  this.applyAssignPagination();
}



async handleAssignClick(event) {

  event.stopPropagation();

  console.group('🧭 handleAssignClick');

  const clickedFormId = event.currentTarget.dataset.id;

  this.selectedFormId = clickedFormId;

  console.log('📝 Clicked Form:', clickedFormId);

  // ---------------------------------
  // Resolve SELECTED FORMS (bulk)
  // ---------------------------------

  const selectedForms =
    this.allLayouts
      .filter(l => l.isSelected)
      .map(l => l.layoutName);

  // If none checked → single click fallback
  const finalFormIds =
    selectedForms.length
      ? selectedForms
      : [clickedFormId];

  this.isBulkAssign =
    finalFormIds.length > 1;

  console.log('📦 Bulk Mode:', this.isBulkAssign);
  console.log('📦 Forms to assign:', finalFormIds);

  // ---------------------------------
  // Title (single only)
  // ---------------------------------

  if (!this.isBulkAssign) {

    const selected =
      this.allLayouts.find(
        l => l.layoutName === clickedFormId
      );

    this.selectedFormTitle =
      selected?.title || 'Form';

  } else {

    this.selectedFormTitle =
      `${finalFormIds.length} Forms`;
  }

  // ---------------------------------
  // Load facilities if missing
  // ---------------------------------

  if (!this.allFacilityIds?.length) {

    console.log('🏥 loading facilities first...');

    await this.loadAssignFacilities();
  }

  // ---------------------------------
  // Resolve selected facilities
  // ---------------------------------

  const facilityIds =
    this.assignSelectedFacilities.length
      ? this.assignSelectedFacilities.map(f => f.value)
      : this.allFacilityIds;

  console.log('🏥 Using facilities:', facilityIds);

  // =====================================================
  // 🔥 LOAD USERS BASED ON AUDIENCE
  // =====================================================

  if (this.selectedAudience === 'Staff') {

    console.log('👔 Audience = STAFF');

    // 🔥 LOAD ROLES FIRST
    await this.loadAssignRolesByFacility(
      facilityIds
    );

    // 🔥 LOAD STAFF
    await this.loadAssignStaffByFacility(
      facilityIds
    );

    // reset staff paging/search
    this.assignStaffSearchTerm = '';
    this.assignStaffPageNumber = 1;

    this.applyAssignStaffPagination();

  } else {

    console.log('👥 Audience = PARTICIPANT');

    await this.loadAssignParticipantsByFacility(
      facilityIds
    );

    // reset participant paging/search
    this.assignParticipantSearchTerm = '';
    this.assignPageNumber = 1;

    this.applyAssignPagination();
  }

  // =====================================================
  // 🎯 Apply pre-selection ONLY for single form
  // =====================================================

  if (!this.isBulkAssign) {

    console.log(
      '🎯 Applying access selection for:',
      clickedFormId
    );

    this.applyAccessSelection(clickedFormId);

  } else {

    console.log(
      '🚫 Bulk assign → skipping pre-selection'
    );
  }

  // ---------------------------------
  // Open modal
  // ---------------------------------

  this.showAssignModal = true;

  console.groupEnd();
}




handleSelectAllPublished(event) {

  const checked = event.target.checked;

  this.selectAllPublishedChecked = checked;

  this.allLayouts =
    this.allLayouts.map(l =>
      l.isPublished
        ? { ...l, isSelected: checked }
        : l
    );

  this.customLayouts = [...this.allLayouts];

  this.paginateLayouts();
}

handlePublishedRowToggle(event) {

  const id = event.target.dataset.id;
  const checked = event.target.checked;

  console.group('📌 handlePublishedRowToggle');

  console.log('➡️ Toggled Layout:', id);
  console.log('✅ Checked:', checked);

  this.allLayouts =
    this.allLayouts.map(l =>
      l.layoutName === id
        ? { ...l, isSelected: checked }
        : l
    );

  this.customLayouts = [...this.allLayouts];

  // ---------------------------------
  // Selected records (ALL)
  // ---------------------------------

  const selectedAll =
    this.allLayouts.filter(l => l.isSelected);

  console.log(
    '📦 Selected Layouts:',
    selectedAll.map(l => l.layoutName)
  );

  console.log(
    '📊 Total Selected:',
    selectedAll.length
  );

  // ---------------------------------
  // Published only
  // ---------------------------------

  const published =
    this.allLayouts.filter(l => l.isPublished);

  const selectedPublished =
    published.filter(l => l.isSelected);

  console.log(
    '📰 Published Selected:',
    selectedPublished.map(l => l.layoutName)
  );

  // recompute header checkbox state
  this.selectAllPublishedChecked =
    published.length &&
    published.every(l => l.isSelected);

  console.log(
    '☑️ Header checkbox:',
    this.selectAllPublishedChecked
  );

  this.paginateLayouts();

  console.groupEnd();
}



async loadAssignFacilities() {

  const rows = await fetchFacilitiess();

  this.assignFacilityOptions = rows.map(f => ({
    label: f.Name,
    value: f.Id,
    checked: false
  }));

  this.assignFilteredFacilityOptions =
  [...this.assignFacilityOptions];


  this.allFacilityIds =
    this.assignFacilityOptions.map(o => o.value);

    this.assignSelectedFacilities = [];
this.assignFacilitySearchTerm = '';
this.showAssignFacilityOptions = false;
}

async handleAssignFacilityCheckboxChange(event) {

  event.stopPropagation();

  const id = event.target.value;
  const label = event.target.dataset.label;
  const checked = event.target.checked;

  console.log('🏥 facility toggled:', id, checked);

  // ---------------------------
  // Selected pills
  // ---------------------------

  if (checked) {

    if (!this.assignSelectedFacilities.some(f => f.value === id)) {
      this.assignSelectedFacilities = [
        ...this.assignSelectedFacilities,
        { value: id, label }
      ];
    }

  } else {

    this.assignSelectedFacilities =
      this.assignSelectedFacilities.filter(
        f => f.value !== id
      );
  }

  // ---------------------------
  // Sync master options
  // ---------------------------

  this.assignFacilityOptions =
    this.assignFacilityOptions.map(f =>
      f.value === id
        ? { ...f, checked }
        : f
    );

  // ---------------------------
  // Sync filtered view
  // ---------------------------

  this.assignFilteredFacilityOptions =
    this.assignFacilityOptions.filter(f =>
      f.label
        .toLowerCase()
        .includes(this.assignFacilitySearchTerm || '')
    );

  // ---------------------------
  // Resolve facilities
  // ---------------------------

  const facilityIds =
    this.assignSelectedFacilities.length
      ? this.assignSelectedFacilities.map(f => f.value)
      : this.allFacilityIds;

  // ---------------------------
  // Reload based on audience 🔥
  // ---------------------------

  if (this.selectedAudience === 'Staff') {

    console.log('👔 reloading ROLES + STAFF for facilities');

    // 🔥 1. Reload roles based on facility
    await this.loadAssignRolesByFacility(facilityIds);

    // 🔥 2. Clear selected roles (prevent stale filters)
    this.assignSelectedRoles = [];

    // 🔥 3. Reload staff using new facility scope
    await this.loadAssignStaffByFacility(facilityIds);

    // 🔥 reset paging safely
    this.assignStaffPageNumber = 1;
    this.applyAssignStaffPagination();

  } else {

    console.log('👥 reloading PARTICIPANTS for facilities');

    await this.loadAssignParticipantsByFacility(
      facilityIds
    );

    // reset pagination
    this.assignPageNumber = 1;
    this.applyAssignPagination();
  }
}




closeAssignModal() {

  console.log('❌ Closing Assign Modal');

  // -----------------------------
  // Hide modal
  // -----------------------------

  this.showAssignModal = false;

  // -----------------------------
  // Clear selected form
  // -----------------------------

  this.selectedFormId = null;
  this.selectedFormTitle = '';

  // -----------------------------
  // Reset participant select all
  // -----------------------------

  this.assignSelectAllChecked = false;

  // -----------------------------
  // Reset staff select all
  // -----------------------------

  this.assignStaffSelectAllChecked = false;

  // -----------------------------
  // Clear search terms
  // -----------------------------

  this.assignParticipantSearchTerm = '';
  this.assignStaffSearchTerm = '';
  this.assignFacilitySearchTerm = '';
  this.assignRoleSearchTerm = '';
  this.assignSearchTerm = '';


  // -----------------------------
  // Reset paging
  // -----------------------------

  this.assignPageNumber = 1;
  this.assignStaffPageNumber = 1;

  // -----------------------------
  // Clear participant selections
  // -----------------------------

  this.assignParticipantMaster =
    this.assignParticipantMaster.map(p => ({
      ...p,
      isSelected: false
    }));

  this.assignParticipantsFiltered =
    [...this.assignParticipantMaster];

  this.assignParticipantsPage = [];

  // -----------------------------
  // Clear staff selections
  // -----------------------------

  this.assignStaffMaster =
    this.assignStaffMaster.map(s => ({
      ...s,
      isSelected: false
    }));

  this.assignStaffFiltered =
    [...this.assignStaffMaster];

  this.assignStaffPage = [];

  // -----------------------------
  // Clear facility selections
  // -----------------------------

  this.assignSelectedFacilities = [];

  this.assignFacilityOptions =
    this.assignFacilityOptions.map(f => ({
      ...f,
      checked: false
    }));

  this.assignFilteredFacilityOptions =
    [...this.assignFacilityOptions];

  this.showAssignFacilityOptions = false;

  // -----------------------------
  // Clear role selections
  // -----------------------------

  this.assignSelectedRoles = [];

  this.assignRoleOptions =
    this.assignRoleOptions.map(r => ({
      ...r,
      checked: false
    }));

  this.assignFilteredRoleOptions =
    [...this.assignRoleOptions];

  this.showAssignRoleOptions = false;

  // -----------------------------
  // Recalculate pagination safely
  // -----------------------------

  this.applyAssignPagination?.();
  this.applyAssignStaffPagination?.();

  console.log('✅ Assign Modal fully reset');
}



showAssignFacilityDropdown(event) {

  event?.stopPropagation();

  console.log('🏥 showAssignFacilityDropdown');

  this.showAssignFacilityOptions = true;
}


handleAssignOutsideClick = () => {

  // Close facility dropdown
  if (this.showAssignFacilityOptions) {
    console.log('❌ closing facility dropdown');
    this.showAssignFacilityOptions = false;
  }

  // 🔥 Close role dropdown ALSO
  if (this.showAssignRoleOptions) {
    console.log('❌ closing role dropdown');
    this.showAssignRoleOptions = false;
  }
};


stopPropagation(event) {
  event.stopPropagation();
}


handleAssignFacilitySearchChange(event) {

  const term =
    event.target.value?.toLowerCase() || '';

  this.assignFacilitySearchTerm = term;

  this.assignFilteredFacilityOptions =
    this.assignFacilityOptions.filter(f =>
      f.label.toLowerCase().includes(term)
    );
}

removeAssignFacility(event) {

  event.stopPropagation();

  const id = event.currentTarget.dataset.id;

  console.log('❌ removing facility:', id);

  // remove from selected
  this.assignSelectedFacilities =
    this.assignSelectedFacilities.filter(
      f => f.value !== id
    );

  // uncheck option
  this.assignFacilityOptions =
    this.assignFacilityOptions.map(o =>
      o.value === id
        ? { ...o, checked: false }
        : o
    );

  this.assignFilteredFacilityOptions =
    [...this.assignFacilityOptions];

  // reload based on audience 🔥
  const facilityIds =
    this.assignSelectedFacilities.length
      ? this.assignSelectedFacilities.map(f => f.value)
      : this.allFacilityIds;

  if (this.selectedAudience === 'Staff') {

    console.log('👔 reloading STAFF after facility remove');

    this.loadAssignStaffByFacility(facilityIds);

  } else {

    console.log('👥 reloading PARTICIPANTS after facility remove');

    this.loadAssignParticipantsByFacility(facilityIds);

  }
}


async loadAssignStaffByFacility(facilityIds) {

  console.group('👔 loadAssignStaffByFacility');

  console.log('🏥 Facilities passed:', facilityIds);

  const roleNames =
    (this.assignSelectedRoles || [])
      .filter(r => r && r.value)
      .map(r => r.value);

  console.log('🎭 Roles selected:', roleNames);

  const rows = await getStaffForAssign({
    facilityIds,
    roleNames,
    orgId: this.orgid
  });

  // ===============================
  // RAW APEX RESULT DEBUG
  // ===============================

  console.log('📦 Raw Apex staff result (FULL):', rows);
  console.log('📊 Total rows returned:', rows?.length);

  // ⭐ DEBUG FIRST RECORD ONLY
  if (rows && rows.length > 0) {

    console.group('🧪 FIRST RECORD DEBUG (Nagendra check)');

    const first = rows[0];

    console.log('🧾 First record object:', first);
    console.log('👤 Name:', first.Name);
    console.log('🏥 FacilityName:', first.FacilityName);
    console.log('🎭 Role (RAW):', first.Role);
    console.log('🖼 Picture:', first.Picture__c);
    console.log('📄 Accessible Forms:', first.Accessible_Custom_Forms__c);

    console.log(
      '❓ Role empty check =>',
      first.Role === null ||
      first.Role === undefined ||
      first.Role === ''
    );

    console.groupEnd();
  } else {
    console.warn('⚠️ No rows returned from Apex');
  }

  // ===============================
  // MAP FOR UI
  // ===============================

  this.assignStaffMaster = rows.map((r, index) => {

    // ⭐ LOG ONLY FIRST RECORD AFTER MAPPING
    if (index === 0) {
      console.group('🧪 FIRST RECORD AFTER MAPPING');

      console.log('Original Role:', r.Role);
      console.log('Mapped Role:', r.Role || '—');
      console.log('Will UI show dash?', !(r.Role));

      console.groupEnd();
    }

    return {
      Id: r.Id,
      Name: r.Name,
      FacilityName: r.FacilityName,
      Role: r.Role || '—',
      Picture: r.Picture__c,
      AccessibleForms: r.Accessible_Custom_Forms__c,
      isSelected: false,
      initials: this.getInitialsSafe(r.Name)
    };
  });

  console.log(
    '👨‍💼 Final Staff Loaded:',
    this.assignStaffMaster
  );

  // ⭐ FINAL VERIFY FIRST RECORD IN UI DATA
  if (this.assignStaffMaster.length) {
    console.log(
      '🎯 FIRST RECORD FINAL ROLE SHOWN IN UI:',
      this.assignStaffMaster[0].Role
    );
  }

  this.assignStaffFiltered = [...this.assignStaffMaster];

  this.assignStaffPageNumber = 1;

  this.applyAssignStaffPagination();

  console.groupEnd();
}




async loadAssignRolesByFacility(facilityIds) {

  const rows = await fetchStaffRolesByFacility({
    facilityIds
  });

  // 🔥 Extra safety: dedupe on client as well
  const seen = new Set();

  this.assignRoleOptions = rows
    .filter(r => {

      // dedupe by role + facility
      const key =
        `${r.name}|${r.facilityName}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .map(r => ({

      // 🔥 NEW LABEL FORMAT
      label: `${r.name} - ${r.facilityName}`,

      // ⚠ IMPORTANT — KEEP THIS SAME
      value: r.name,

      checked: false
    }));

  this.assignFilteredRoleOptions = [
    ...this.assignRoleOptions
  ];

  this.assignSelectedRoles = [];
  this.assignRoleSearchTerm = '';
}



showAssignRoleDropdown(event) {
  event?.stopPropagation();
  this.showAssignRoleOptions = true;
}

handleAssignRoleSearchChange(event) {

  const term =
    event.target.value?.toLowerCase() || '';

  this.assignRoleSearchTerm = term;

  this.assignFilteredRoleOptions =
    this.assignRoleOptions.filter(r =>
      r.label.toLowerCase().includes(term)
    );
}

handleAssignRoleCheckboxChange(event) {

  event.stopPropagation();

  const id = event.target.value;
  const label = event.target.dataset.label;
  const checked = event.target.checked;

  // pills
  if (checked) {

    if (!this.assignSelectedRoles.some(r => r.value === id)) {

      this.assignSelectedRoles = [
        ...this.assignSelectedRoles,
        { value: id, label }
      ];
    }

  } else {

    this.assignSelectedRoles =
      this.assignSelectedRoles.filter(
        r => r.value !== id
      );
  }

  // sync options
  this.assignRoleOptions =
    this.assignRoleOptions.map(r =>
      r.value === id
        ? { ...r, checked }
        : r
    );

  this.assignFilteredRoleOptions =
    this.assignRoleOptions.filter(r =>
      r.label
        .toLowerCase()
        .includes(this.assignRoleSearchTerm || '')
    );

  // reload staff
  this.reloadAssignStaff();
}

removeAssignRole(event) {

  event.stopPropagation();

  const id = event.currentTarget.dataset.id;

  this.assignSelectedRoles =
    this.assignSelectedRoles.filter(
      r => r.value !== id
    );

  this.assignRoleOptions =
    this.assignRoleOptions.map(r =>
      r.value === id
        ? { ...r, checked: false }
        : r
    );

  this.assignFilteredRoleOptions =
    [...this.assignRoleOptions];

  this.reloadAssignStaff();
}
applyAssignStaffPagination() {

  const start =
    (this.assignStaffPageNumber - 1) *
    this.assignStaffPageSize;

  const end = start + this.assignStaffPageSize;

  this.assignStaffPage =
    this.assignStaffFiltered.slice(start, end);

  this.assignStaffTotalRecords =
    this.assignStaffFiltered.length;

  this.assignStaffTotalPages =
    Math.ceil(
      this.assignStaffTotalRecords /
      this.assignStaffPageSize
    );

  this.bDisableAssignStaffFirst =
    this.assignStaffPageNumber <= 1;

  this.bDisableAssignStaffLast =
    this.assignStaffPageNumber >=
    this.assignStaffTotalPages;
}

handleAssignSearch(event) {

  const term =
    event.target.value?.toLowerCase() || '';

  this.assignSearchTerm = term;

  if (this.selectedAudience === 'Staff') {

    this.assignStaffFiltered =
      this.assignStaffMaster.filter(s =>
        s.Name.toLowerCase().includes(term)
      );

    this.assignStaffPageNumber = 1;

    this.applyAssignStaffPagination();

  } else {

    this.assignParticipantsFiltered =
      this.assignParticipantMaster.filter(p =>
        p.Name.toLowerCase().includes(term)
      );

    this.assignPageNumber = 1;

    this.applyAssignPagination();
  }
}

handleAssignStaffSelectAll(event) {

  const checked = event.target.checked;

  this.assignStaffSelectAllChecked = checked;

  this.assignStaffFiltered =
    this.assignStaffFiltered.map(s => ({
      ...s,
      isSelected: checked
    }));

  const mapIds =
    new Map(
      this.assignStaffFiltered.map(s => [s.Id, s])
    );

  this.assignStaffMaster =
    this.assignStaffMaster.map(s =>
      mapIds.get(s.Id) || s
    );

  this.applyAssignStaffPagination();
}
async reloadAssignStaff() {

  const facilityIds =
    this.assignSelectedFacilities.length
      ? this.assignSelectedFacilities.map(f => f.value)
      : this.allFacilityIds;

  await this.loadAssignStaffByFacility(
    facilityIds
  );
}

firstPageAssignStaff() {
  this.assignStaffPageNumber = 1;
  this.applyAssignStaffPagination();
}

previousPageAssignStaff() {
  if (this.assignStaffPageNumber > 1) {
    this.assignStaffPageNumber--;
    this.applyAssignStaffPagination();
  }
}

nextPageAssignStaff() {
  if (this.assignStaffPageNumber < this.assignStaffTotalPages) {
    this.assignStaffPageNumber++;
    this.applyAssignStaffPagination();
  }
}

lastPageAssignStaff() {
  this.assignStaffPageNumber = this.assignStaffTotalPages;
  this.applyAssignStaffPagination();
}


getSelectedFormIds() {

  console.group('📦 getSelectedFormIds');

  // -----------------------------
  // BULK MODE — use checkboxes
  // -----------------------------

  const bulkSelected =
    this.allLayouts
      ?.filter(l => l.isSelected)
      .map(l => l.layoutName) || [];

  console.log('🗂 Bulk selected forms:', bulkSelected);

  if (bulkSelected.length) {
    console.groupEnd();
    return bulkSelected;
  }

  // -----------------------------
  // SINGLE MODE — Assign click
  // -----------------------------

  if (this.selectedFormId) {

    console.log(
      '🎯 Single selectedFormId:',
      this.selectedFormId
    );

    console.groupEnd();
    return [this.selectedFormId];
  }

  console.warn('⚠ No forms resolved');

  console.groupEnd();

  return [];
}



// async grantAccess() {

//   console.group('🚀 grantAccess()');

//   try {

//     const formIds =
//       this.getSelectedFormIds();

//     console.log('📦 Forms to grant:', formIds);

//     if (!formIds.length) {
//       this.showToast(
//         'Error',
//         'Select at least one form.',
//         'error'
//       );
//       console.groupEnd();
//       return;
//     }

//     // ----------------------------------
//     // PARTICIPANT
//     // ----------------------------------

//     if (this.selectedAudience === 'Participant') {

//       const ids =
//         this.assignParticipantMaster
//           .filter(p => p.isSelected)
//           .map(p => p.Id);

//       console.log('👥 Selected Participants:', ids);

//       if (!ids.length) {
//         this.showToast(
//           'Error',
//           'Select participants.',
//           'error'
//         );
//         console.groupEnd();
//         return;
//       }

//       await grantAccessToParticipantsBulk({
//         participantIds: ids,
//         formIds
//       });

//       console.log('✅ Participants updated');

//       // 🔁 Refresh participants list
//       await this.loadAssignParticipantsByFacility(
//         this.assignSelectedFacilities.length
//           ? this.assignSelectedFacilities.map(f => f.value)
//           : this.allFacilityIds
//       );
//     }

//     // ----------------------------------
//     // STAFF
//     // ----------------------------------

//     if (this.selectedAudience === 'Staff') {

//       const ids =
//         this.assignStaffMaster
//           .filter(s => s.isSelected)
//           .map(s => s.Id);

//       console.log('👔 Selected Staff:', ids);

//       if (!ids.length) {
//         this.showToast(
//           'Error',
//           'Select staff.',
//           'error'
//         );
//         console.groupEnd();
//         return;
//       }

//       await grantAccessToStaffBulk({
//         staffIds: ids,
//         formIds
//       });

//       console.log('✅ Staff updated');

//       // 🔁 Refresh staff list
//       await this.reloadAssignStaff();
//     }

//     // ----------------------------------
//     // 🔁 Reload unified forms so avatars update
//     // ----------------------------------

//     await this.loadUnifiedForms();

//     // ----------------------------------
//     // Success toast
//     // ----------------------------------

//     this.showToast(
//       'Success',
//       'Access granted successfully.',
//       'success'
//     );

//     // ----------------------------------
//     // Close + reset modal
//     // ----------------------------------

//     this.closeAssignModal();

//   } catch (e) {

//     console.error('❌ grantAccess failed', e);

//     this.showToast(
//       'Error',
//       e.body?.message || 'Grant failed',
//       'error'
//     );

//   } finally {

//     console.groupEnd();
//   }
// }


// applyAccessSelection(formId) {

//   console.log('🎯 Applying access selection for:', formId);

//   const normFormId = this.normalizeId(formId);

//   // ===============================
//   // PARTICIPANTS
//   // ===============================

//   this.assignParticipantMaster =
//     this.assignParticipantMaster.map(p => {

//       const ids =
//         this.parseAccessibleForms(
//           p.AccessibleForms
//         );

//       return {
//         ...p,
//         isSelected: ids.includes(normFormId)
//       };
//     });

//   this.assignParticipantsFiltered = [
//     ...this.assignParticipantMaster
//   ];

//   this.applyAssignPagination();


//   // ===============================
//   // STAFF
//   // ===============================

//   this.assignStaffMaster =
//     this.assignStaffMaster.map(s => {

//       const ids =
//         this.parseAccessibleForms(
//           s.AccessibleForms
//         );

//       return {
//         ...s,
//         isSelected: ids.includes(normFormId)
//       };
//     });

//   this.assignStaffFiltered = [
//     ...this.assignStaffMaster
//   ];

//   this.applyAssignStaffPagination();
// }



async grantAccess() {

  console.group('🚀 grantAccess()');

  try {

    const formIds = this.getSelectedFormIds();

    console.log('📦 Forms to grant:', formIds);

    if (!formIds.length) {
      this.showToast(
        'Error',
        'Select at least one form.',
        'error'
      );
      console.groupEnd();
      return;
    }

    // ==================================
    // PARTICIPANT
    // ==================================

    if (this.selectedAudience === 'Participant') {

      const allParticipantIds =
        this.assignParticipantMaster.map(p => p.Id);

      const selectedParticipantIds =
        this.assignParticipantMaster
          .filter(p => p.isSelected)
          .map(p => p.Id);

      console.log('👥 ALL Participants:', allParticipantIds);
      console.log('✅ Selected Participants:', selectedParticipantIds);

      if (!allParticipantIds.length) {
        this.showToast(
          'Error',
          'No participants available.',
          'error'
        );
        console.groupEnd();
        return;
      }

      await grantAccessToParticipantsBulk({
        allParticipantIds,
        selectedParticipantIds,
        formIds,
        appendOnly: this.isBulkAssign
      });

      console.log('✅ Participants synced');

      await this.loadAssignParticipantsByFacility(
        this.assignSelectedFacilities.length
          ? this.assignSelectedFacilities.map(f => f.value)
          : this.allFacilityIds
      );
    }

    // ==================================
    // STAFF
    // ==================================

    if (this.selectedAudience === 'Staff') {

      const allStaffIds =
        this.assignStaffMaster.map(s => s.Id);

      const selectedStaffIds =
        this.assignStaffMaster
          .filter(s => s.isSelected)
          .map(s => s.Id);

      console.log('👔 ALL Staff:', allStaffIds);
      console.log('✅ Selected Staff:', selectedStaffIds);

      if (!allStaffIds.length) {
        this.showToast(
          'Error',
          'No staff available.',
          'error'
        );
        console.groupEnd();
        return;
      }

      await grantAccessToStaffBulk({
        allStaffIds,
        selectedStaffIds,
        formIds,
        appendOnly: this.isBulkAssign
      });

      console.log('✅ Staff synced');

      await this.reloadAssignStaff();
    }

    // ==================================
    // 🔁 Refresh Forms (avatars update)
    // ==================================

    await this.loadUnifiedForms();

    // ==================================
    // 🔥 RESET BULK SELECTION STATE
    // (Fix header checkbox not clearing)
    // ==================================

    this.selectAllPublishedChecked = false;

    this.allLayouts = this.allLayouts.map(l => ({
      ...l,
      isSelected: false
    }));

    this.customLayouts = [...this.allLayouts];

    // reset bulk assign flag
    this.isBulkAssign = false;

    // ==================================
    // SUCCESS
    // ==================================

    this.showToast(
      'Success',
      'Access updated successfully.',
      'success'
    );

    this.closeAssignModal();

  } catch (e) {

    console.error('❌ grantAccess failed', e);

    this.showToast(
      'Error',
      e.body?.message || 'Grant failed',
      'error'
    );

  } finally {
    console.groupEnd();
  }
}


applyAccessSelection(formId) {

  console.log('🎯 Applying access selection for:', formId);

  const normFormId = this.normalizeId(formId);

  // ===================================
  // PARTICIPANTS ONLY
  // ===================================

  if (this.selectedAudience === 'Participant') {

    this.assignParticipantMaster =
      this.assignParticipantMaster.map(p => {

        const ids =
          this.parseAccessibleForms(
            p.AccessibleForms
          );

        return {
          ...p,
          isSelected: ids.includes(normFormId)
        };
      });

    this.assignParticipantsFiltered = [
      ...this.assignParticipantMaster
    ];

    this.applyAssignPagination();
  }

  // ===================================
  // STAFF ONLY
  // ===================================

  if (this.selectedAudience === 'Staff') {

    this.assignStaffMaster =
      this.assignStaffMaster.map(s => {

        const ids =
          this.parseAccessibleForms(
            s.AccessibleForms
          );

        return {
          ...s,
          isSelected: ids.includes(normFormId)
        };
      });

    this.assignStaffFiltered = [
      ...this.assignStaffMaster
    ];

    this.applyAssignStaffPagination();
  }
}



get showGrantAccessButton() {
  if (this.selectedAudience === 'Participant') {
    return this.assignTotalRecords > 0;
  }

  if (this.selectedAudience === 'Staff') {
    return this.assignStaffTotalRecords > 0;
  }

  return false;
}


get selectedPublishedCount() {
  return this.allLayouts
    ?.filter(l => l.isPublished && l.isSelected)
    .length || 0;
}

get isBulkSelection() {
  const value =
    this.selectedPublishedCount > 1;

  console.log(
    '🔒 Grant icon disabled:',
    value,
    '| selected count:',
    this.selectedPublishedCount
  );

  return value;
}


get hasAnySelection() {
  return this.selectedPublishedCount > 0;
}
handleBulkGrantClick() {

  // pick first selected form just to satisfy handler
  const firstSelected =
    this.allLayouts.find(
      l => l.isSelected && l.isPublished
    );

  if (!firstSelected) return;

  // fake event object
  this.handleAssignClick({
    stopPropagation() {},
    currentTarget: {
      dataset: {
        id: firstSelected.layoutName
      }
    }
  });
}












}