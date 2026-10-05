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

import getDynamicFormData from "@salesforce/apex/LayoutController.getDynamicFormData";
import deleteDynamicForm from "@salesforce/apex/LayoutController.deleteDynamicForm";

import checkCanAssignPermission from "@salesforce/apex/FormLibraryController.checkCanAssignPermission";
import getLibraryForms from "@salesforce/apex/FormLibraryController.getLibraryForms";
import getAvailableOrganisations from "@salesforce/apex/FormLibraryController.getAvailableOrganisations";
import getFormAssignments from "@salesforce/apex/FormLibraryController.getFormAssignments";
import saveFormAssignments from "@salesforce/apex/FormLibraryController.saveFormAssignments";
import cloneLibraryForms from "@salesforce/apex/FormLibraryController.cloneLibraryForms";

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

async loadUnifiedForms() {

  console.group('🚀 loadUnifiedForms');

  try {

    const rows = await getUnifiedForms({
      orgId: this.orgid,
      formModule: this.formModule,
      audience: this.selectedAudience
    });

    console.log('🧾 RAW rows from Apex:', rows);
    console.log('📊 Row count:', rows?.length);

    if (!rows || rows.length === 0) {
      console.warn('⚠ No rows returned from Apex');
    }

       const MAX = 5;

    // ================= MAP =================

    const mappedRows = (rows || []).map(row => {
      console.log('➡ Mapping row:', row);

   

const staffUsers = row.staffUsers || [];
const participantUsers = row.participantUsers || [];

// ================= STAFF =================

const visibleStaff = staffUsers.slice(0, MAX);

const extraStaff = staffUsers.slice(MAX);

const hasVisibleStaff = visibleStaff.length > 0;

const hasExtraStaff = extraStaff.length > 0;

const extraStaffCount = extraStaff.length;

const extraStaffNames = extraStaff
  .map(u => u.name)
  .join(', ');

// ================= PARTICIPANTS =================

const visibleParticipants = participantUsers.slice(0, MAX);

const extraParticipants = participantUsers.slice(MAX);

const hasVisibleParticipants = visibleParticipants.length > 0;

const hasExtraParticipants = extraParticipants.length > 0;

const extraParticipantCount = extraParticipants.length;

const extraParticipantNames = extraParticipants
  .map(u => u.name)
  .join(', ');

      return {
        layoutName: row.recordId,
        formGroupId: row.formGroupId,
        title: row.formName,
        version: row.versionLabel,

        createdByName: row.createdByName,
        createdByInitials: this.getInitialsSafe(row.createdByName),

        createdDateRaw: row.createdDate,
        dateTimeString: this.formatDate(row.createdDate),

        isAssigned: row.isAssigned,

       // ORIGINAL (keep if needed elsewhere)
  staffUsers,
  participantUsers,

  // 🔥 NEW (matches your OLD HTML)
  visibleStaff,
  hasVisibleStaff,
  hasExtraStaff,
  extraStaffCount,
  extraStaffNames,

  visibleParticipants,
  hasVisibleParticipants,
  hasExtraParticipants,
  extraParticipantCount,
  extraParticipantNames,
      };
    });

    console.log('🧱 mappedRows:', mappedRows);

    // ================= GROUP =================

    const groupedMap = {};

    mappedRows.forEach(row => {

      console.log('🔁 Processing row groupId:', row.formGroupId);

      if (!row.formGroupId) {
        console.warn('❌ Skipping row (no groupId):', row);
        return;
      }

      if (!groupedMap[row.formGroupId]) {
        groupedMap[row.formGroupId] = {
          groupId: row.formGroupId,
          formName: row.title,
          versions: [],
          isExpanded: false,
          iconName: 'chevron_right'
        };
      }

      groupedMap[row.formGroupId].versions.push(row);
    });

    console.log('🗂 groupedMap:', groupedMap);

    let groupedArray = Object.values(groupedMap);

    console.log('📦 groupedArray BEFORE processing:', groupedArray);

    groupedArray.forEach(group => {

      group.versions.sort((a, b) =>
        new Date(b.createdDateRaw) - new Date(a.createdDateRaw)
      );

      group.latest = group.versions[0] || {};
      group.versionCount = group.versions.length;

      console.log('📌 Group processed:', group);
    });

    console.log('📦 FINAL groupedArray:', groupedArray);

   this.allLayouts = [...groupedArray];
this.customLayouts = [...groupedArray];

// 🔥 RESET PAGE
this.pageNumber = 1;

// 🔥 CALL PAGINATION
this.paginateLayouts();

  } catch (err) {

    console.error('❌ loadUnifiedForms failed', err);

    this.showToast(
      'Error',
      'Failed to load forms.',
      'error'
    );
  }

  console.groupEnd();
}

toggleGroup(event) {

  const groupId = event.currentTarget.dataset.id;

  this.allLayouts = this.allLayouts.map(g => {
    if (g.groupId === groupId) {
      const isExpanded = !g.isExpanded;
      return {
        ...g,
        isExpanded,
        iconName: isExpanded ? 'expand_more' : 'chevron_right'
      };
    }
    return g;
  });

  this.customLayouts = [...this.allLayouts];

  this.paginateLayouts();
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


  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  handleResize() {
    if (this.isPageSizeManuallySet) return;
    this.setPageSizeByZoomAndScreen();
  }

  setPageSizeByZoomAndScreen() {
    const container = this.template.querySelector('.publishtable-wrapper');
    if (!container) return;
    const containerHeight = container.getBoundingClientRect().height;
    const rowHeight = 52;
    let computedPageSize = Math.floor(containerHeight / rowHeight);
    if (computedPageSize < 3) computedPageSize = 3;

    if (this.pageSize !== computedPageSize) {
      this.pageSize = computedPageSize;
      this.pageNumber = 1;
      this.paginateLayouts();
    }
  }

  // Handle edit action and dispatch event
  
  // async handleEditLayout(event) {
  //   try {
  //     const layoutId = event.detail.layoutId; // Get layout ID to edit
  //     const layoutData = await getLayoutData({ layoutName: layoutId }); // Fetch data based on layout ID

  //     if (layoutData) {
  //       // Load layout data into the component for editing
  //       this.layoutId = layoutId;
  //       this.formTitle = layoutData.title || ""; // Set the title
  //       this.tableRows = JSON.parse(layoutData.layoutJson).tableRows || []; // Load table structure
  //       this.selectedFormType = layoutData.layoutName; // Set the dropdown to the layout name
  //       console.log("Editing layout:", layoutData);

  //       // Update dropdown value
  //       requestAnimationFrame(() => {
  //         const dropdown = this.template.querySelector(".form-dropdown");
  //         if (dropdown) dropdown.value = this.selectedFormType;
  //       });

  //       this.showToast("Success", "Layout loaded for editing.", "success");
  //     } else {
  //       this.showToast("Error", "No layout data found for editing.", "error");
  //     }
  //   } catch (error) {
  //     console.error("Error loading layout for editing:", error);
  //     this.showToast("Error", "Failed to load layout for editing.", "error");
  //   }
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

async handleEditPublishedForm(event) {

  const recordId = event.currentTarget.dataset.id;

  try {

    const layoutData = await getDynamicFormData({ recordId });

    console.log("✅ Retrieved dynamic form:", layoutData);

    let finalLayoutJson;
    const raw = layoutData.layoutJson;

    if (raw) {

      const parsed = JSON.parse(raw);

      if (parsed?.url && parsed?.key) {

        const resp = await fetch(parsed.url);
        if (!resp.ok) {
          throw new Error("Failed to fetch AWS JSON");
        }

        const fetched = await resp.json();

        finalLayoutJson = Array.isArray(fetched)
          ? {
              tableRows: fetched,
              selectedFormType: layoutData.displayName || "",
              selectedModuleType: "Customisable Form",
              audience: layoutData.audience || ""
            }
          : fetched;

      } else {

        finalLayoutJson = Array.isArray(parsed)
          ? {
              tableRows: parsed,
              selectedFormType: layoutData.displayName || "",
              selectedModuleType: "Customisable Form",
              audience: layoutData.audience || ""
            }
          : parsed;
      }
    }

    // ===============================
    // 🔥 SEND FULL VERSION CONTEXT
    // ===============================
    const message = {
      layoutName: layoutData.layoutName,
      formType: layoutData.displayName,
      layoutJSON: finalLayoutJson,
      formModule: layoutData.formModule,
      actionType: "edit",
      title: layoutData.title,
      audience: layoutData.audience,

      // 🔥 VERSIONING DATA
      dynamicFormRecordId: layoutData.layoutName,
      dynamicFormGroupId: layoutData.formGroupId,
      dynamicFormVersionLabel: layoutData.versionLabel,
      isVersionEditFlowActive: true
    };

    publish(this.messageContext, LAYOUT_MESSAGE_CHANNEL, message);

  } catch (error) {

    console.error("❌ Error loading form:", error);

    this.showToast(
      "Error",
      "Failed to load form.",
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


  async handleDeletePublishedForm(event) {

  const recordId = event.currentTarget.dataset.id;

  console.log("Captured recordId for dynamic form deletion:", recordId);

  if (!recordId) {
    this.showToast("Error", "Record Id is missing.", "error");
    return;
  }

  try {

    await deleteDynamicForm({ recordId });

    console.log("Dynamic form deleted successfully:", recordId);

    // refresh list
    await this.loadLayoutsIfReady();

    this.showToast("Success", "Form deleted successfully.", "success");

  } catch (error) {

    console.error("Error deleting dynamic form:", error);

    this.showToast(
      "Error",
      error?.body?.message || "Failed to delete form.",
      "error"
    );
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


  get pageSizeOptions() {
    return [10, 20, 50];
  }



  handleSearchChange(event) {

  this.searchKey = (event.target.value || '').toLowerCase().trim();

  console.log('🔍 Search Key:', this.searchKey);

  if (this.searchKey) {

    this.customLayouts = this.allLayouts.filter(group => {

      // ✅ match form name
      const formMatch =
        (group.formName || '')
          .toLowerCase()
          .includes(this.searchKey);

      // ✅ match any version inside group
      const versionMatch =
        (group.versions || []).some(v =>
          (v.title || '').toLowerCase().includes(this.searchKey) ||
          (v.version || '').toLowerCase().includes(this.searchKey) ||
          (v.createdByName || '').toLowerCase().includes(this.searchKey)
        );

      return formMatch || versionMatch;
    });

  } else {

    // reset when search cleared
    this.customLayouts = [...this.allLayouts];
  }

  // 🔥 always reset page
  this.pageNumber = 1;

  // 🔥 reapply pagination
  this.paginateLayouts();

  console.log('📄 Search Result Count:', this.customLayouts.length);
}

paginateLayouts() {

  this.totalRecords = this.customLayouts.length;

  this.totalPages = Math.ceil(
    this.totalRecords / this.pageSize
  ) || 1;

  const start = (this.pageNumber - 1) * this.pageSize;
  const end = start + this.pageSize;

  const pageData = this.customLayouts.slice(start, end);

  // ✅ USE SOURCE OF TRUTH (allLayouts)
  this.paginatedLayouts = pageData.map(group => {

    const source = this.allLayouts.find(
      g => g.groupId === group.groupId
    );

    return {
      ...group,
      isExpanded: source ? source.isExpanded : false,
      iconName: source
        ? source.iconName
        : 'chevron_right'
    };
  });

  this.bDisableFirst = this.pageNumber <= 1;
  this.bDisableLast = this.pageNumber >= this.totalPages;
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
    const val = event.target.value;
    this.pageSize = parseInt(val, 10);
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

 const selectedForms = [];

this.allLayouts.forEach(group => {
  group.versions.forEach(v => {
    if (v.isSelected) {
      selectedForms.push(v.layoutName);
    }
  });
});

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


stopClickPropagation(event) {
  event.stopPropagation();
}

handleSelectAllPublished(event) {
event.stopPropagation();
  const checked = event.target.checked;

  this.selectAllPublishedChecked = checked;

  // 🔥 FIX: update all versions inside groups
  this.allLayouts = this.allLayouts.map(group => ({
    ...group,
    versions: group.versions.map(v => ({
      ...v,
      isSelected: checked
    }))
  }));

  this.customLayouts = [...this.allLayouts];

  this.paginateLayouts();
}

handlePublishedRowToggle(event) {
event.stopPropagation();
  const id = event.target.dataset.id;
  const checked = event.target.checked;

  console.group('📌 handlePublishedRowToggle');

  console.log('➡️ Toggled Layout:', id);
  console.log('✅ Checked:', checked);

  // 🔥 FIX: go inside versions
  this.allLayouts = this.allLayouts.map(group => {

    const updatedVersions = group.versions.map(v =>
      v.layoutName === id
        ? { ...v, isSelected: checked }
        : v
    );

    return {
      ...group,
      versions: updatedVersions
    };
  });

  this.customLayouts = [...this.allLayouts];

  // ---------------------------------
  // Selected records (ALL)
  // ---------------------------------

  const selectedAll = [];

  this.allLayouts.forEach(group => {
    group.versions.forEach(v => {
      if (v.isSelected) {
        selectedAll.push(v);
      }
    });
  });

  console.log(
    '📦 Selected Layouts:',
    selectedAll.map(l => l.layoutName)
  );

  console.log(
    '📊 Total Selected:',
    selectedAll.length
  );

  // ---------------------------------
  // Published only (all are published now)
  // ---------------------------------

  const allVersions = [];

  this.allLayouts.forEach(group => {
    allVersions.push(...group.versions);
  });

  const selectedPublished =
    allVersions.filter(v => v.isSelected);

  console.log(
    '📰 Published Selected:',
    selectedPublished.map(l => l.layoutName)
  );

  // header checkbox
  this.selectAllPublishedChecked =
    allVersions.length &&
    allVersions.every(v => v.isSelected);

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

  const selected = [];

  this.allLayouts.forEach(group => {
    group.versions.forEach(v => {
      if (v.isSelected) {
        selected.push(v.layoutName);
      }
    });
  });

  console.log('🗂 Selected forms:', selected);

  if (selected.length) {
    console.groupEnd();
    return selected;
  }

  if (this.selectedFormId) {
    console.log('🎯 Single selectedFormId:', this.selectedFormId);
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

  let count = 0;

  this.allLayouts.forEach(group => {
    group.versions.forEach(v => {
      if (v.isSelected) count++;
    });
  });

  return count;
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

  let firstSelected = null;

  this.allLayouts.some(group => {
    return group.versions.some(v => {
      if (v.isSelected) {
        firstSelected = v;
        return true;
      }
      return false;
    });
  });

  if (!firstSelected) return;

  this.handleAssignClick({
    stopPropagation() {},
    currentTarget: {
      dataset: {
        id: firstSelected.layoutName
      }
    }
  });
}












  // ==============================================================
  // 📚 FORM LIBRARY & CROSS-ORGANISATION ASSIGNMENT
  // ==============================================================
  @track canAssignToOrg = false;

  @wire(checkCanAssignPermission)
  wiredCanAssignPermission({ data, error }) {
    if (data !== undefined) {
      this.canAssignToOrg = data;
    } else if (error) {
      console.error("Error checking Can_Assign_Library_Forms permission:", error);
    }
  }

  // Form Library state
  @track showLibraryModal = false;
  @track libraryForms = [];
  @track selectedLibraryFormIds = new Set();
  @track librarySearchKey = "";
  @track libraryAudienceFilter = "All";
  @track isLibraryLoading = false;
  @track isCloningLoading = false;
  @track libraryPageNumber = 1;
  @track libraryPageSize = 10;

  // Assign to Organisation state
  @track showAssignToOrgModal = false;
  @track activeAssignFormId = null;
  @track activeAssignFormTitle = "";
  @track availableOrganisations = [];
  @track selectedOrgIds = new Set();
  @track orgSearchKey = "";
  @track isOrgAssignLoading = false;
  @track isOrgAssignSaving = false;
  @track orgPageNumber = 1;
  @track orgPageSize = 10;

  // Preview / View Mode state (Editor format matching formRenderStaff)
  @track showPreviewModal = false;
  @track isViewMode = false;
  @track isViewModeON = false;
  @track isFormSelected = false;
  @track previewFormTitle = "";
  @track selectedFormTitle = "";
  @track selectedFormType = "";
  @track isPreviewLoading = false;
  @track tableRows = [];
  @track stepPagedRows = [];
  @track stepCurrentPageIndex = 0;

  get isFirstStepPage() {
    return (this.stepCurrentPageIndex ?? 0) === 0;
  }

  get isLastStepPage() {
    return (this.stepCurrentPageIndex ?? 0) >= (this.stepPagedRows?.length || 1) - 1;
  }

  get stepCurrentPageDisplay() {
    return (this.stepCurrentPageIndex ?? 0) + 1;
  }

  get totalStepPages() {
    return this.stepPagedRows?.length || 1;
  }

  get showStepProgressIndicator() {
    return this.stepPagedRows && this.stepPagedRows.length > 1;
  }

  get libraryAudienceOptions() {
    return [
      { label: "All", value: "All" },
      { label: "Staff", value: "Staff" },
      { label: "Participants", value: "Participants" }
    ];
  }

  get libraryPageSizeOptions() {
    return [10, 20, 50];
  }

  get filteredLibraryForms() {
    let list = this.libraryForms || [];
    if (this.libraryAudienceFilter && this.libraryAudienceFilter !== "All") {
      list = list.filter(f => f.Audience__c === this.libraryAudienceFilter);
    }
    if (this.librarySearchKey) {
      const q = this.librarySearchKey.toLowerCase();
      list = list.filter(f => (f.Name__c || "").toLowerCase().includes(q));
    }
    return list.map(f => ({
      ...f,
      isSelected: this.selectedLibraryFormIds.has(f.Id),
      createdDateDisplay: this.formatDate(f.CreatedDate),
      audienceBadgeClass: f.Audience__c === "Staff" ? "nd-pill nd-pill--staff" : "nd-pill nd-pill--participant"
    }));
  }

  get libraryTotalRecords() {
    return (this.filteredLibraryForms || []).length;
  }

  get libraryTotalPages() {
    return Math.ceil(this.libraryTotalRecords / this.libraryPageSize) || 1;
  }

  get bDisableLibraryFirst() {
    return this.libraryPageNumber <= 1;
  }

  get bDisableLibraryLast() {
    return this.libraryPageNumber >= this.libraryTotalPages;
  }

  get pagedLibraryForms() {
    const list = this.filteredLibraryForms || [];
    const start = (this.libraryPageNumber - 1) * this.libraryPageSize;
    const end = start + this.libraryPageSize;
    return list.slice(start, end);
  }

  firstLibraryPage() {
    this.libraryPageNumber = 1;
  }

  lastLibraryPage() {
    this.libraryPageNumber = this.libraryTotalPages;
  }

  previousLibraryPage() {
    if (this.libraryPageNumber > 1) {
      this.libraryPageNumber--;
    }
  }

  nextLibraryPage() {
    if (this.libraryPageNumber < this.libraryTotalPages) {
      this.libraryPageNumber++;
    }
  }

  handleLibraryPageSize(event) {
    this.libraryPageSize = parseInt(event.target.value, 10);
    this.libraryPageNumber = 1;
  }

  get isLibraryEmpty() {
    return !this.isLibraryLoading && this.filteredLibraryForms.length === 0;
  }

  get selectedLibraryCount() {
    return this.selectedLibraryFormIds.size;
  }

  get selectAllLibraryChecked() {
    const visible = this.pagedLibraryForms;
    if (!visible || visible.length === 0) return false;
    return visible.every(f => this.selectedLibraryFormIds.has(f.Id));
  }

  get isCloneDisabled() {
    return this.selectedLibraryCount === 0 || this.isCloningLoading;
  }

  get orgPageSizeOptions() {
    return [10, 20, 50];
  }

  get filteredOrganisations() {
    let list = this.availableOrganisations || [];
    if (this.orgSearchKey) {
      const q = this.orgSearchKey.toLowerCase();
      list = list.filter(o => (o.Name || "").toLowerCase().includes(q));
    }
    return list.map(org => {
      const isAssigned = this.selectedOrgIds.has(org.Id);
      return {
        ...org,
        isSelected: isAssigned,
        statusLabel: isAssigned ? "Assigned" : "Not Assigned",
        statusBadgeClass: isAssigned ? "nd-pill nd-pill--active" : "nd-pill nd-pill--inactive"
      };
    });
  }

  get orgTotalRecords() {
    return (this.filteredOrganisations || []).length;
  }

  get orgTotalPages() {
    return Math.ceil(this.orgTotalRecords / this.orgPageSize) || 1;
  }

  get bDisableOrgFirst() {
    return this.orgPageNumber <= 1;
  }

  get bDisableOrgLast() {
    return this.orgPageNumber >= this.orgTotalPages;
  }

  get pagedOrganisations() {
    const list = this.filteredOrganisations || [];
    const start = (this.orgPageNumber - 1) * this.orgPageSize;
    const end = start + this.orgPageSize;
    return list.slice(start, end);
  }

  get isOrgEmpty() {
    return !this.isOrgAssignLoading && (this.filteredOrganisations || []).length === 0;
  }

  firstOrgPage() {
    this.orgPageNumber = 1;
  }

  lastOrgPage() {
    this.orgPageNumber = this.orgTotalPages;
  }

  previousOrgPage() {
    if (this.orgPageNumber > 1) {
      this.orgPageNumber--;
    }
  }

  nextOrgPage() {
    if (this.orgPageNumber < this.orgTotalPages) {
      this.orgPageNumber++;
    }
  }

  handleOrgPageSize(event) {
    this.orgPageSize = parseInt(event.target.value, 10);
    this.orgPageNumber = 1;
  }

  get selectedOrgCount() {
    return this.selectedOrgIds.size;
  }

  get selectAllOrgsChecked() {
    const visible = this.pagedOrganisations;
    if (!visible || visible.length === 0) return false;
    return visible.every(o => this.selectedOrgIds.has(o.Id));
  }

  get hasPreviewRows() {
    return this.previewFormRows && this.previewFormRows.length > 0;
  }

  // ==============================================================
  // 📚 LIBRARY MODAL ACTIONS
  // ==============================================================
  async handleOpenLibraryModal() {
    this.showLibraryModal = true;
    this.selectedLibraryFormIds = new Set();
    this.librarySearchKey = "";
    this.libraryAudienceFilter = "All";
    this.libraryPageNumber = 1;
    await this.loadLibraryForms();
  }

  handleCloseLibraryModal() {
    this.showLibraryModal = false;
    this.selectedLibraryFormIds = new Set();
    this.libraryPageNumber = 1;
  }

  async loadLibraryForms() {
    this.isLibraryLoading = true;
    try {
      const data = await getLibraryForms({
        orgId: this.orgid,
        audience: this.libraryAudienceFilter,
        searchKey: this.librarySearchKey
      });
      this.libraryForms = data || [];
      if (this.libraryPageNumber > this.libraryTotalPages) {
        this.libraryPageNumber = 1;
      }
    } catch (e) {
      console.error("Error loading library forms:", e);
      this.showToast("Error", "Failed to load library forms: " + (e?.body?.message || e.message), "error");
    } finally {
      this.isLibraryLoading = false;
    }
  }

  handleLibrarySearch(event) {
    this.librarySearchKey = event.target.value;
    this.libraryPageNumber = 1;
  }

  async handleLibraryAudienceChange(event) {
    this.libraryAudienceFilter = event.detail.value;
    this.libraryPageNumber = 1;
    await this.loadLibraryForms();
  }

  handleLibraryRowToggle(event) {
    const id = event.target.dataset.id;
    const next = new Set(this.selectedLibraryFormIds);
    if (event.target.checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.selectedLibraryFormIds = next;
  }

  handleSelectAllLibrary(event) {
    const checked = event.target.checked;
    const next = new Set(this.selectedLibraryFormIds);
    const visible = this.pagedLibraryForms;
    for (const item of visible) {
      if (checked) {
        next.add(item.Id);
      } else {
        next.delete(item.Id);
      }
    }
    this.selectedLibraryFormIds = next;
  }

  async handleCloneLibraryForms() {
    if (this.selectedLibraryCount === 0) return;
    this.isCloningLoading = true;
    try {
      const sourceIds = Array.from(this.selectedLibraryFormIds);
      const clonedIds = await cloneLibraryForms({
        sourceFormIds: sourceIds,
        targetOrgId: this.orgid
      });

      this.showToast(
        "Success",
        `${clonedIds.length} form template(s) cloned into your organisation successfully.`,
        "success"
      );

      this.handleCloseLibraryModal();
      await this.loadUnifiedForms();
    } catch (e) {
      console.error("Error cloning library forms:", e);
      this.showToast("Error", "Failed to clone forms: " + (e?.body?.message || e.message), "error");
    } finally {
      this.isCloningLoading = false;
    }
  }

  // ==============================================================
  // 👁️ FORM PREVIEW PIPELINE (EDITOR FORMAT MATCHING FORMRENDERSTAFF)
  // ==============================================================
  async handleView(event) {
    console.log("📍 handleView triggered (LayoutListComponent - Form Library Preview)");
    this.tableRows = [];
    this.stepPagedRows = [];
    this.stepCurrentPageIndex = 0;

    this.selectedFormTitle = "";
    this.previewFormTitle = "";
    this.selectedFormType = "";

    this.isViewMode = true;
    this.isViewModeON = true;
    this.isFormSelected = true;
    this.showPreviewModal = true;
    this.isPreviewLoading = true;

    const formId = event.currentTarget?.dataset?.id;

    const form =
      (this.libraryForms || []).find((f) => f.Id === formId) ||
      (this.unifiedForms || []).find((f) => f.Id === formId) ||
      (this.publishedForms || []).find((f) => f.Id === formId) ||
      (this.unpublishedForms || []).find((f) => f.Id === formId) ||
      (this.formResponses || []).find((f) => f.Id === formId);

    if (!form) {
      console.warn("⚠️ No form found for id:", formId);
      this.isPreviewLoading = false;
      return;
    }

    this.selectedFormTitle = form.Name__c || "Untitled Form";
    this.previewFormTitle = form.Name__c || "Untitled Form";
    this.selectedFormType = form.Form_Type__c || "Unknown Form Type";

    try {
      const rawJson = form.Form_JSON__c || form.Response_JSON__c;
      let parsedJson;

      if (rawJson) {
        let parsed = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;

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

      if (!parsedJson) {
        console.warn("⚠️ No JSON structure found for form:", formId);
        this.isPreviewLoading = false;
        return;
      }

      const rowsArray = Array.isArray(parsedJson)
        ? parsedJson
        : (parsedJson.tableRows || parsedJson.rows || []);

      const normalizedRows = rowsArray.map((row) => this.normalizeRowCells(row));

      const filteredRows = normalizedRows.map((row, rowIndex) => ({
        ...row,
        cells: (row.cells || []).map((cell, colIndex) => {
          const shared = this.processCellField(cell, rowIndex, colIndex);
          let isTableBlock = false;
          let tableConfig = null;

          if (
            cell.field?.isTableBlock ||
            cell.field?.dataType === "Table Block"
          ) {
            isTableBlock = true;
            const builtConfig = this.buildTableBlockRenderModel(cell);
            cell = {
              ...cell,
              field: {
                ...cell.field,
                tableConfig: builtConfig,
              },
            };
          }

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
              cell.field?.text || cell.field?.label || "Section Title";
            headerStyle =
              cell.field?.inlineStyle ||
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
                shared.isRichText || shared.isRichTextDisplay
                  ? cell.field?.richTextContent || cell.field?.value || ""
                  : cell.field?.value || "",
              options: shared.options,
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
            ),
          };
        }),
      }));

      /* PAGINATION */
      this.stepPagedRows = [];
      let currentStepPage = [];
      filteredRows.forEach((row) => {
        const isPageBreak = (row.cells || []).some(
          (cell) =>
            cell.field?.dataType === "Blank" &&
            cell.field?.label?.toLowerCase().trim() === "page break",
        );
        if (isPageBreak) {
          currentStepPage.push({
            ...row,
            isPageBreak: true,
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
    } catch (e) {
      console.error("❌ Failed opening form:", e);
      this.showToast("Error", "Unable to open form preview.", "error");
    } finally {
      this.isPreviewLoading = false;
    }
  }

  handlePreviewLibraryForm(event) {
    return this.handleView(event);
  }

  closeView() {
    this.isViewMode = false;
    this.isViewModeON = false;
    this.isFormSelected = false;
    this.showPreviewModal = false;
    this.tableRows = [];
    this.stepPagedRows = [];
  }

  handleClosePreviewModal() {
    this.closeView();
  }

  normalizeRowCells(row) {
    if (!row.cells || row.cells.length === 0) {
      return row;
    }
    const maxCol = Math.max(...row.cells.map((c) => c.col));
    const normalizedCells = [];
    for (let i = 0; i <= maxCol; i++) {
      const existing = row.cells.find((c) => c.col === i);
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
          isVisible: true,
        });
      }
    }
    return {
      ...row,
      cells: normalizedCells,
    };
  }

  getBorderStyle(dataType) {
    return [
      "Checkbox Field",
      "Radio Button",
      "Header",
      "Table Block",
      "Descriptive Text",
    ].includes(dataType)
      ? "border: 1px solid transparent;"
      : "border: 1px solid black;";
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

    /* DROPDOWN FIELD */
    if (cell.field?.dataType === "Dropdown Field") {
      isDropdownField = true;
      placeholderText = `Select ${cell.field.label || ""}`;
      if (cell.field.selectedDropdownOption === "predefinedList") {
        const type = (cell.field.predefinedListType || "").trim().toLowerCase();
        if (type === "staff" && this.staffOptions?.length > 0) {
          options = this.staffOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
            isSelected: cell.field.value === opt.value,
          }));
        } else if (type === "participant" && ((this.participantDataMaster?.length > 0) || (this.allparticipants?.length > 0))) {
          const pList = this.participantDataMaster || this.allparticipants || [];
          options = pList.map((p) => ({
            label: p.Name || p.name || p.label,
            value: p.Id || p.value,
            isSelected: cell.field.value === (p.Id || p.value),
          }));
        } else if (type === "facility" && this.facilityOptions?.length > 0) {
          options = this.facilityOptions.map((opt) => ({
            label: opt.label,
            value: opt.value,
            isSelected: cell.field.value === opt.value,
          }));
        } else {
          options = [];
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
            isSelected: cell.field.value === option.trim(),
          }))
          .filter((option) => option.label);
      } else if (
        cell.field.selectedDropdownOption === "multiSelect" &&
        cell.field.multiSelectValues
      ) {
        isMultiSelect = true;
        options = cell.field.multiSelectValues
          .split("\n")
          .map((option) => ({
            label: option.trim(),
            value: option.trim(),
            isSelected: false,
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

    /* TEXT FIELD */
    if (cell.field?.dataType === "Text Field") {
      if (cell.field.selectedTextFieldOption === "textArea") {
        isTextArea = true;
        maxLength = 255;
        charCount = cell.field.value ? cell.field.value.length : 0;
        placeholderText = `Enter ${cell.field.label || ""} (Up to 255 chars)`;
      } else if (cell.field.selectedTextFieldOption === "alphaNumeric") {
        isAlphaNumeric = true;
        maxLength = cell.field.alphaNumericLength
          ? parseInt(cell.field.alphaNumericLength, 10)
          : 56;
        placeholderText = `Enter ${cell.field.label || ""} (Max ${maxLength} chars)`;
      } else if (cell.field.selectedTextFieldOption === "onlyAlphabets") {
        isOnlyAlphabets = true;
        maxLength = cell.field.onlyAlphabetsLength
          ? parseInt(cell.field.onlyAlphabetsLength, 10)
          : 55;
        placeholderText = `Enter ${cell.field.label || ""} (Alphabets only, Max ${maxLength} chars)`;
      } else if (cell.field.selectedTextFieldOption === "richText") {
        isRichText = true;
      } else {
        isTextField = true;
        placeholderText = `Enter ${cell.field.label || ""}`;
      }
    }

    /* NUMBER FIELD */
    if (cell.field?.dataType === "Number Field") {
      isNumberField = true;
      switch (cell.field.selectedNumberFieldOption) {
        case "contactNumber":
          isContactNumber = true;
          maxLength = cell.field.contactNumberDigits
            ? parseInt(cell.field.contactNumberDigits, 10)
            : 10;
          placeholderText = `Enter ${cell.field.label || ""} (Max ${maxLength} digits)`;
          break;
        case "currency":
          isCurrency = true;
          decimalPlaces = cell.field.decimalValue
            ? parseInt(cell.field.decimalValue, 10)
            : 2;
          placeholderText = `Enter ${cell.field.label || ""} (Up to ${decimalPlaces} decimals)`;
          break;
        default:
          isDefaultNumber = true;
          placeholderText = `Enter ${cell.field.label || ""} (Numbers Only)`;
      }
    }

    /* DATE / TIME */
    if (cell.field?.dataType === "Time Field") {
      isTimeField = true;
      placeholderText = `Select Time`;
    }
    if (cell.field?.dataType === "Date Field") {
      isDateField = true;
      placeholderText = `Select Date`;
    }

    /* FILE UPLOAD */
    if (cell.field?.dataType === "Upload File") {
      isUploadField = true;
      placeholderText = "Upload File";
    }

    /* RADIO BUTTON */
    if (cell.field?.dataType === "Radio Button") {
      isRadioButton = true;
      const valueObj = cell.field?.value;
      if (valueObj && typeof valueObj === "object") {
        selectedRadioOption = valueObj.selectedOption || "";
        subInputValue = valueObj.subValue || "";
      } else if (typeof valueObj === "string") {
        selectedRadioOption = valueObj;
        subInputValue = "";
      }

      radioOptionsProcessed = (cell.field.radioOptions || []).map((option) => {
        const isSelected =
          String(selectedRadioOption) === String(option.optionLabel);
        let processedSubOptions = [];
        if (option.usePredefinedOptions) {
          const predefined = option.selectedPredefined?.toLowerCase();
          let source = [];
          if (predefined === "staff") source = this.staffOptions || [];
          if (predefined === "participant") {
            source = (this.participantDataMaster || this.participants || []).map((p) => ({
              label: p.Name || p.name,
              value: p.Id || p.value,
            }));
          }
          if (predefined === "facility") source = this.facilityOptions || [];
          processedSubOptions = source.map((opt) => ({
            label: opt.label || opt.Name,
            value: opt.value ?? opt.Id ?? opt.label,
            isSelected:
              String(subInputValue) === String(opt.value) ||
              String(subInputValue) === String(opt.label),
          }));
        } else {
          processedSubOptions = (option.values || []).map((val) => ({
            label: val,
            value: val,
            isSelected: String(subInputValue) === String(val),
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
          subQuestion: option.subQuestion || "",
        };
      });
      subRadioName = (cell.id || `radio-${rowIndex}-${colIndex}`) + "-subradio";
    }

    /* SIGNATURE */
    if (cell.field?.isSignature || cell.field?.dataType === "Signature") {
      isSignature = true;
      signatureButtonLabel = cell.field?.value
        ? "View / Update Signature"
        : "Add Signature";
    }

    /* DESCRIPTIVE TEXT */
    if (
      cell.field?.dataType === "Descriptive Text" ||
      cell.field?.isRichTextDisplay
    ) {
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
      isRichTextDisplay,
    };
  }

  buildTableBlockRenderModel(cell) {
    const tableConfig = {
      ...(cell.field?.tableConfig || {}),
    };
    const columns = tableConfig.columns || [];
    const rowNames = tableConfig.rowNames || [];
    const innerCells = tableConfig.innerCells || [];
    const hasRowLabel = columns.some((c) => c.isRowLabel);

    const renderRows = innerCells.map((innerRow, rIndex) => {
      return {
        key: `row-${rIndex}`,
        value: rowNames[rIndex]?.value || "",
        renderCells: columns.map((col, cIndex) => {
          if (col.isRowLabel) {
            return {
              key: `${rIndex}-label`,
              isRowLabel: true,
              cellValue: rowNames[rIndex]?.value || "",
            };
          }

          const innerIndex = hasRowLabel ? cIndex - 1 : cIndex;
          const innerCell = (innerRow.cells || []).find(
            (c) => Number(c.col) === Number(innerIndex)
          );

          const sourceValue = innerCell?.field?.value ?? "";
          const field = {
            ...(innerCell?.field
              ? JSON.parse(JSON.stringify(innerCell.field))
              : {}),
            value: sourceValue,
            id: innerCell?.id,
          };

          const shared = this.processCellField({
            ...innerCell,
            field,
          }, rIndex, cIndex);

          return {
            key: `${rIndex}-${cIndex}`,
            col: innerIndex,
            isRowLabel: false,
            ...shared,
            id: innerCell?.id || `${rIndex}-${cIndex}`,
            field: {
              ...field,
              options: shared.options,
            },
          };
        }),
      };
    });

    tableConfig.renderRows = renderRows;
    return tableConfig;
  }

  updateStepVisibleRows() {
    const pageIndex = this.stepCurrentPageIndex ?? 0;
    const raw = this.stepPagedRows?.[pageIndex] || [];
    if (!Array.isArray(raw)) {
      return;
    }
    this.tableRows = raw.map((row, rIdx) => {
      return {
        ...row,
        cells: (row.cells || []).map((cell, cIdx) => {
          if (cell?.field?.dataType === "Table Block") {
            let tableConfig = cell.field?.tableConfig || {};
            tableConfig = {
              showTableName: false,
              tableName: "",
              columns: [],
              rowNames: [],
              innerCells: [],
              renderRows: [],
              ...tableConfig,
            };
            const rebuiltConfig = this.buildTableBlockRenderModel({
              ...cell,
              field: {
                ...cell.field,
                tableConfig,
              },
            });
            const renderRows = rebuiltConfig.renderRows || [];
            return {
              ...cell,
              field: {
                ...cell.field,
                tableConfig: {
                  ...rebuiltConfig,
                },
              },
              safeTableName: rebuiltConfig.tableName || "",
              safeColumns: rebuiltConfig.columns || [],
              safeRenderRows: renderRows,
              hasTableConfig: true,
              hasHeaderSafe: !!rebuiltConfig.hasHeader,
              showTableNameSafe: !!rebuiltConfig.showTableName,
              hasRowsSafe: renderRows.length > 0,
              domKey: cell.id,
              isVisible: true,
              hasContent: true,
            };
          }

          if (cell.isDropdownField && !cell.isMultiSelect) {
            const selectedValue = cell.field?.value;
            const updatedOptions = (cell.field?.options || []).map((opt) => ({
              ...opt,
              isSelected: opt.value === selectedValue,
            }));
            return {
              ...cell,
              field: {
                ...cell.field,
                options: updatedOptions,
              },
              domKey: cell.id,
              isVisible:
                !(
                  cell.field?.dataType === "Blank" &&
                  cell.field?.label?.toLowerCase().trim() === "page break"
                ) && cell.style !== "display: none;",
              hasContent: !!(cell.field?.label || cell.field?.value),
            };
          }

          return {
            ...cell,
            domKey: cell.id,
            isVisible:
              !(
                cell.field?.dataType === "Blank" &&
                cell.field?.label?.toLowerCase().trim() === "page break"
              ) && cell.style !== "display: none;",
            hasContent: !!(cell.field?.label || cell.field?.value),
          };
        }),
      };
    });
    this.tableRows = [...this.tableRows];
  }

  findCellById(cellId) {
    if (!cellId) return null;
    for (const row of this.tableRows || []) {
      for (const cell of row.cells || []) {
        if (cell.id === cellId) {
          return cell;
        }
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

  renderRichTextFields() {
    const containers = this.template.querySelectorAll(".rich-text-preview");
    containers.forEach((container) => {
      const cellId = container.dataset.id;
      const cell = this.findCellById(cellId);
      if (cell?.field?.isRichTextDisplay && cell.field.richTextContent) {
        container.classList.add("ql-editor");
        if (container.innerHTML !== cell.field.richTextContent) {
          container.innerHTML = cell.field.richTextContent;
        }
      } else if (cell?.field?.value) {
        container.classList.add("ql-editor");
        if (container.innerHTML !== cell.field.value) {
          container.innerHTML = cell.field.value;
        }
      }
    });
  }

  reinitializeRichEditors() {
    setTimeout(() => {
      this.renderRichTextFields();
    }, 0);
  }

  persistVisiblePage() {
    const i = this.stepCurrentPageIndex ?? 0;
    const current = Array.isArray(this.tableRows) ? this.tableRows : [];
    const cloned = JSON.parse(JSON.stringify(current));
    this.stepPagedRows = (this.stepPagedRows || []).map((page, idx) =>
      idx === i ? cloned : page
    );
  }

  goToNextStepPage() {
    if (!this.isLastStepPage) {
      this.persistVisiblePage();
      this.stepCurrentPageIndex++;
      this.updateStepVisibleRows();
      this.reinitializeRichEditors();
    }
  }

  goToPreviousStepPage() {
    if (!this.isFirstStepPage) {
      this.persistVisiblePage();
      this.stepCurrentPageIndex--;
      this.updateStepVisibleRows();
      this.reinitializeRichEditors();
    }
  }

  handleIconKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  }

  // ==============================================================
  // 🏢 ASSIGN TO ORGANISATION ACTIONS
  // ==============================================================
  async handleOpenAssignToOrgModal(event) {
    const formId = event.currentTarget.dataset.id;
    const title = event.currentTarget.dataset.title || "Form";

    this.activeAssignFormId = formId;
    this.activeAssignFormTitle = title;
    this.showAssignToOrgModal = true;
    this.orgSearchKey = "";
    this.isOrgAssignLoading = true;
    this.selectedOrgIds = new Set();
    this.orgPageNumber = 1;

    try {
      const [allOrgs, currentAssignments] = await Promise.all([
        getAvailableOrganisations(),
        getFormAssignments({ formId })
      ]);

      this.availableOrganisations = allOrgs || [];

      const assignedOrgSet = new Set();
      (currentAssignments || []).forEach(a => {
        if (a.Organisation__c && a.Status__c === "Active") {
          assignedOrgSet.add(a.Organisation__c);
        }
      });
      this.selectedOrgIds = assignedOrgSet;
      if (this.orgPageNumber > this.orgTotalPages) {
        this.orgPageNumber = 1;
      }
    } catch (e) {
      console.error("Error loading organisations:", e);
      this.showToast("Error", "Failed to load organisations: " + (e?.body?.message || e.message), "error");
    } finally {
      this.isOrgAssignLoading = false;
    }
  }

  handleCloseAssignToOrgModal() {
    this.showAssignToOrgModal = false;
    this.activeAssignFormId = null;
    this.selectedOrgIds = new Set();
    this.orgPageNumber = 1;
  }

  handleOrgSearch(event) {
    this.orgSearchKey = event.target.value;
    this.orgPageNumber = 1;
  }

  handleOrgRowToggle(event) {
    const orgId = event.target.dataset.id;
    const next = new Set(this.selectedOrgIds);
    if (event.target.checked) {
      next.add(orgId);
    } else {
      next.delete(orgId);
    }
    this.selectedOrgIds = next;
  }

  handleSelectAllOrgs(event) {
    const checked = event.target.checked;
    const next = new Set(this.selectedOrgIds);
    const visible = this.pagedOrganisations;
    for (const org of visible) {
      if (checked) {
        next.add(org.Id);
      } else {
        next.delete(org.Id);
      }
    }
    this.selectedOrgIds = next;
  }

  async handleSaveOrgAssignments() {
    if (!this.activeAssignFormId) return;

    this.isOrgAssignSaving = true;
    try {
      const orgIds = Array.from(this.selectedOrgIds);
      await saveFormAssignments({
        formId: this.activeAssignFormId,
        organisationIds: orgIds
      });

      this.showToast(
        "Success",
        `Organisation assignments for "${this.activeAssignFormTitle}" updated successfully.`,
        "success"
      );

      this.handleCloseAssignToOrgModal();
    } catch (e) {
      console.error("Error saving organisation assignments:", e);
      this.showToast("Error", "Failed to save organisation assignments: " + (e?.body?.message || e.message), "error");
    } finally {
      this.isOrgAssignSaving = false;
    }
  }

}