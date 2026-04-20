// layoutListComponent.js
import { LightningElement, track, api } from "lwc";
import getAllLayouts from "@salesforce/apex/LayoutIncidentController.getAllLayouts";
import deleteLayout from "@salesforce/apex/IncidentRegisterControllerV2.deleteLayout";

// import getLayoutData from "@salesforce/apex/LayoutIncidentController.getLayoutData";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { NavigationMixin } from "lightning/navigation";
import { publish, MessageContext } from "lightning/messageService";
import LAYOUT_MESSAGE_CHANNEL from "@salesforce/messageChannel/LayoutMessageChannel__c";
import { wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import getDefaultFormLayout from "@salesforce/apex/LayoutIncidentController.getDefaultFormLayout";
import StaticForms from "@salesforce/resourceUrl/Static_Forms";

const FORM_IMAGE_1 = `${StaticForms}/form1.png`;
const FORM_IMAGE_2 = `${StaticForms}/form2.png`;

const formImages = [FORM_IMAGE_1, FORM_IMAGE_2];

import getUnifiedForms from '@salesforce/apex/LayoutIncidentController.getUnifiedForms';
import getLayoutDataById from '@salesforce/apex/LayoutIncidentController.getLayoutDataById';
import getStaffRecords from '@salesforce/apex/IncidentRegisterControllerV2.getStaffRecords';
import appendFormsToStaff from '@salesforce/apex/IncidentRegisterControllerV2.appendFormsToStaff';


export default class LayoutListComponent extends NavigationMixin(
  LightningElement
) {
  @track defaultLayouts = [];
  @track customLayouts = [];
  searchKey = '';
allLayouts = []; // keep original copy
  @api selectedFormType = "";
  @api formModule;

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
//   await this.loadLayouts();  // fire-and-forget OK too
  await this.loadUnifiedForms(); 
}

async loadLayouts() {
  const seq = ++this._lastLoadSeq;        // keep race protection
  this.isLoadingLayouts = true;

  console.groupCollapsed('📥 loadLayouts()');
  console.log('params:', { orgId: this.orgid, formModule: this.formModule });

  try {
    // If needed, add a cache buster param to Apex signature and pass here.
    const layoutMap = await getAllLayouts({ orgId: this.orgid, formModule: this.formModule });

    // Drop late responses if a newer call started
    if (seq !== this._lastLoadSeq) {
      console.warn('⚠️ Stale layout response ignored (newer request in flight).');
      return;
    }

    // --- ALWAYS remap fresh data ---
    this.customLayouts = (layoutMap?.CustomLayouts || []).map((layout) => ({
      ...layout,
      layoutName: layout.layoutName,
      displayName: layout.displayName,
      image: this.getRandomFormImage(),
      createdById: layout.createdById,
      createdByName: layout.createdByName,
      createdByInitials: this.getInitials(layout.createdByName)
    }));

    this.defaultLayouts = (layoutMap?.DefaultLayouts || []).map((layout) => ({
      ...layout,
      layoutName: layout.layoutName,
      displayName: layout.displayName
    }));

    // reset paging off the fresh dataset
    this.pageNumber = 1;
    this.allLayouts = [...this.customLayouts];
    this.paginateLayouts();

    console.log('✅ Layouts loaded:', {
      custom: this.customLayouts.length,
      defaults: this.defaultLayouts.length
    });
  } catch (error) {
    console.error('❌ Error in layout fetch (imperative):', error);
    this.showToast('Error', 'Failed to retrieve saved layouts.', 'error');
  } finally {
    if (seq === this._lastLoadSeq) this.isLoadingLayouts = false;
    console.groupEnd();
  }
}


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

  // Handle the edit action, emit layout ID to dragdropcomp
  handleEditLayout(event) {
    const layoutName = event.currentTarget.dataset.id;

    getLayoutData({ layoutName })
      .then((layoutData) => {
        console.log("✅ Retrieved layout data for editing:", layoutData);

        const message = {
          layoutName: layoutData.layoutName, // Unique identifier (Name)
          formType: layoutData.displayName, // Display-friendly Name__c
          layoutJSON: layoutData.layoutJson, // JSON structure
          formModule: layoutData.formModule, // ✅ Form Module (Customizable/Incident)
          actionType: "edit",
          title: layoutData.title
        };

        console.log(
          "📤 Publishing layout edit message:",
          JSON.stringify(message)
        );

        publish(this.messageContext, LAYOUT_MESSAGE_CHANNEL, message);
      })
      .catch((error) => {
        console.error("❌ Error loading layout for editing:", error);
        this.showToast(
          "Error",
          "Failed to load layout. Please try again.",
          "error"
        );
      });
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
//   handleSearchChange(event) {
//     this.searchKey = event.target.value.toLowerCase();

//     if (this.searchKey) {
//         this.customLayouts = this.allLayouts.filter(layout =>
//             (layout.title || '').toLowerCase().includes(this.searchKey)
//         );
//     } else {
//         // reset when search empty
//         this.customLayouts = [...this.allLayouts];
//     }

//     this.pageNumber = 1;  // reset to first page on new search
//     this.paginateLayouts();
// }

//   paginateLayouts() {
//     this.totalRecords = this.customLayouts.length;
//     this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

//     const start = (this.pageNumber - 1) * this.pageSize;
//     const end = start + this.pageSize;
//     this.paginatedLayouts = this.customLayouts.slice(start, end);

//     this.bDisableFirst = this.pageNumber === 1;
//     this.bDisableLast = this.pageNumber === this.totalPages;
//   }
//   firstPage() {
//     this.pageNumber = 1;
//     this.paginateLayouts();
//   }

//   lastPage() {
//     this.pageNumber = this.totalPages;
//     this.paginateLayouts();
//   }

//   previousPage() {
//     if (this.pageNumber > 1) {
//       this.pageNumber--;
//       this.paginateLayouts();
//     }
//   }

//   nextPage() {
//     if (this.pageNumber < this.totalPages) {
//       this.pageNumber++;
//       this.paginateLayouts();
//     }
//   }

//   handleRecordsPerPage(event) {
//     this.pageSize = parseInt(event.target.value, 10);
//     this.pageNumber = 1;
//     this.paginateLayouts();
//   }

  @track allForms = [];          // full unified list
    @track filteredForms = [];     // after search/filter
    @track paginatedForms = []; 



async loadUnifiedForms() {
    try {
        console.log('📥 Calling getUnifiedForms Apex...');

        const result = await getUnifiedForms();

        console.log('✅ Raw Apex result:', result);
        console.log('📊 Total records returned:', result?.length);

        const MAX_VISIBLE = 5;

        this.allForms = result.map((row, index) => {

            console.log(`➡️ Mapping row #${index + 1}:`, JSON.stringify(row));

            const creatorInitials = row.createdByName
                ? row.createdByName
                      .split(' ')
                      .map(w => w[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                : '';

            /* ===============================
             🔥 STAFF PROCESSING
            =============================== */

            // ===============================
// 👥 STAFF DISPLAY LOGIC
// ===============================

let processedStaff = [];
let visibleStaff = [];
let extraStaff = [];

let staffTextOnly = false;
let staffTextLabel = '';

if (row.category === 'Default') {

    // 🔒 Default Incident → text only
    staffTextOnly = true;
    staffTextLabel = 'Accessible to all staff';

} else {

    const staffList = row.assignedStaff || [];

    processedStaff = staffList.map(s => {

        const initials = s.name
            ? s.name
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
            : '';

        return {
            id: s.staffId,
            name: s.name,
            pictureUrl: s.picture,
            initials
        };
    });

    visibleStaff = processedStaff.slice(0, MAX_VISIBLE);
    extraStaff = processedStaff.slice(MAX_VISIBLE);
}


            const mappedRow = {
                ...row,

                dateTimeString: this.formatDate(row.createdDate),

                createdByInitials: creatorInitials,
                isDraft: row.category === 'Draft',
                isPublished: row.category === 'Published',
                isDefault: row.category === 'Default',

hideCheckbox: row.category === 'Default',

staffTextOnly: row.category === 'Default',

staffTextLabel:
  row.category === 'Default'
    ? 'Accessible to all staff'
    : '',


                categoryClass:
                    row.category === 'Draft'
                        ? 'nd-pill nd-pill--draft'
                        : row.category === 'Published'
                            ? 'nd-pill nd-pill--published'
                            : row.category === 'Default'
                                ? 'nd-pill nd-pill--default'
                                : '',


                /* 🔥 staff UI helpers */
                visibleStaff,

hasVisibleStaff:
    row.category !== 'Default' &&
    visibleStaff.length > 0,

hasExtraStaff:
    row.category !== 'Default' &&
    extraStaff.length > 0,

extraStaffCount:
    row.category !== 'Default'
        ? extraStaff.length
        : 0,

extraStaffNames:
    row.category !== 'Default'
        ? extraStaff.map(s => s.name).join(', ')
        : '',

staffTextOnly,
staffTextLabel,

// hide checkbox for Default
hideCheckbox: row.category === 'Default'

            };

            console.log(`🧾 Final mapped row #${index + 1}:`, mappedRow);

            return mappedRow;
        });

        console.log('📦 allForms array prepared:', this.allForms);

        this.filteredForms = [...this.allForms];
        this.pageNumber = 1;

        this.paginateForms();

    } catch (error) {
        console.error('❌ Error in loadUnifiedForms():', error);

        if (error?.body?.message) {
            console.error('⚠️ Apex message:', error.body.message);
        }
    }
}




    // -----------------------------
    // SEARCH
    // -----------------------------

    handleSearchChange(event) {
        this.searchKey = event.target.value.toLowerCase();

        if (this.searchKey) {
            this.filteredForms = this.allForms.filter(form =>
                (form.formName || '').toLowerCase().includes(this.searchKey) ||
                (form.formType || '').toLowerCase().includes(this.searchKey) ||
                (form.createdByName || '').toLowerCase().includes(this.searchKey) ||
                (form.staffName || '').toLowerCase().includes(this.searchKey)
            );
        } else {
            this.filteredForms = [...this.allForms];
        }

        this.pageNumber = 1;
        this.paginateForms();
    }

    // -----------------------------
    // PAGINATION CORE
    // -----------------------------

    paginateForms() {

        this.totalRecords = this.filteredForms.length;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize) || 1;

        const start = (this.pageNumber - 1) * this.pageSize;
        const end = start + this.pageSize;

        this.paginatedForms = this.filteredForms.slice(start, end);

        this.bDisableFirst = this.pageNumber === 1;
        this.bDisableLast = this.pageNumber === this.totalPages;
    }

    // -----------------------------
    // PAGINATION ACTIONS
    // -----------------------------

    firstPage() {
        this.pageNumber = 1;
        this.paginateForms();
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginateForms();
    }

    previousPage() {
        if (this.pageNumber > 1) {
            this.pageNumber--;
            this.paginateForms();
        }
    }

    nextPage() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber++;
            this.paginateForms();
        }
    }

    handleRecordsPerPage(event) {
        this.pageSize = parseInt(event.target.value, 10);
        this.pageNumber = 1;
        this.paginateForms();
    }

    // -----------------------------
    // HELPERS
    // -----------------------------

    formatDate(dateValue) {

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
    }





async handleEditDraft(event) {

  const recordId = event.currentTarget.dataset.id;

  console.log("✏️ Incident Draft Edit clicked:", recordId);

  try {

    const layoutData = await getLayoutDataById({ templateId: recordId });

    let resolvedJson = [];

    // ================================
    // 🔥 Resolve AWS vs inline JSON
    // ================================
    if (layoutData.layoutJson) {

      const parsed = JSON.parse(layoutData.layoutJson);

      if (parsed?.url && parsed?.key) {

        console.log("🌐 Loading draft JSON from AWS:", parsed.url);

        const resp = await fetch(parsed.url);

        if (!resp.ok) {
          throw new Error("Failed to fetch draft JSON from AWS");
        }

        resolvedJson = await resp.json();

      } else {

        // legacy inline
        resolvedJson = parsed;
      }
    }

    // ================================
    // 📤 Publish edit message
    // ================================
    const message = {
      layoutName: layoutData.layoutName,
      formType: layoutData.displayName,
      layoutJSON: JSON.stringify(resolvedJson), // 🔥 ALWAYS send real JSON
      formModule: "Incident",
      actionType: "edit",
      title: layoutData.title
    };

    console.log("📤 Publishing Incident edit message:", message);

    publish(this.messageContext, LAYOUT_MESSAGE_CHANNEL, message);

  } catch (error) {

    console.error("❌ Incident edit failed:", error);

    this.showToast(
      "Error",
      "Failed to load draft form.",
      "error"
    );
  }
}


async handleDeleteDraft(event) {

    const recordId = event.currentTarget.dataset.id;

    console.log('🗑️ Delete Draft clicked. recordId =', recordId);

    if (!recordId) {
        this.showToast(
            'Error',
            'Draft Form Id missing for deletion.',
            'error'
        );
        return;
    }

    try {

        console.log('📤 Calling Apex deleteLayout with layoutId:', recordId);

        await deleteLayout({ layoutId: recordId });

        console.log('✅ Draft deleted successfully:', recordId);

        // Reload unified list
        await this.loadUnifiedForms();

        this.showToast(
            'Success',
            'Draft Form deleted successfully.',
            'success'
        );

    } catch (error) {

        console.error('❌ Error deleting draft form:', error);

        if (error?.body?.message) {
            console.error('Apex message:', error.body.message);
        }

        this.showToast(
            'Error',
            'Failed to delete draft form.',
            'error'
        );
    }
}


// ===== Grant Access State =====

isGrantAccessPopupOpen = false;

formsToGrant = [];

staffList = [];
filteredStaffList = [];

selectedStaffIds = new Set();

staffFacilityOptions = [];
chosenFacilityValues = [];

pageNumberStaff = 1;
pageSizeStaff = 10;
totalStaffRecords = 0;
totalStaffPages = 0;

selectedFacility = '';

paginatedStaff = [];

bDisableFirstStaff = true;
bDisableLastStaff = true;

staffSearchKey = '';


handleFacilityChange(event) {

    this.selectedFacility = event.detail.value || '';

    this.applyStaffFilters();
}



handleStaffSearch(event) {

    this.staffSearchKey = event.target.value
        ? event.target.value.toLowerCase()
        : '';

    this.applyStaffFilters();
}
applyStaffFilters() {

    let temp = [...this.staffList];

    // Facility filter
    if (this.selectedFacility) {
        temp = temp.filter(
            s => s.facilityName === this.selectedFacility
        );
    }

    // Name search
    if (this.staffSearchKey) {
        temp = temp.filter(s =>
            `${s.firstName} ${s.lastName}`
                .toLowerCase()
                .includes(this.staffSearchKey)
        );
    }

    this.filteredStaffList = temp;

    this.pageNumberStaff = 1;
    this.pageSizeStaff = 10;


    this.paginateStaff();
}


handleGrantAccess(event) {

    let formIds = [];

    // From row click
    if (event?.currentTarget?.dataset?.id) {

        const clickedId = event.currentTarget.dataset.id;

        // If bulk selected use them
        if (this.selectedPublishedFormIds.size) {
            formIds = [...this.selectedPublishedFormIds];
        } else {
            formIds = [clickedId];
        }

    } else {
        // From bulk button later
        formIds = [...this.selectedPublishedFormIds];
    }

    if (!formIds.length) {
        this.showToast('Error','Select at least one form','error');
        return;
    }

    console.log('🚀 Opening Grant modal for forms:', formIds);

    this.formsToGrant = formIds;
    this.selectedFormId = formIds[0];

console.log(
    '📌 Selected FormId for preselect:',
    this.selectedFormId
);


    this.isGrantAccessPopupOpen = true;

    this.loadStaffList();
}


handleBulkGrantAccessClick() {

    if (!this.selectedFormIds.size) {
        this.showToast('Error','Select forms first','error');
        return;
    }

    this.formsToGrant = [...this.selectedFormIds];

    this.isGrantAccessPopupOpen = true;

    this.loadStaffList();
}

loadStaffList() {

    getStaffRecords({ orgId: this.orgid })
        .then(data => {

            console.log('🟢 Raw staff data:', data);

            let debugCount = 0; // 👈 limit logs

            this.staffList = data.map(staff => {

                const grantedForms = staff.Accessible_Forms__c
                    ? staff.Accessible_Forms__c.split(';')
                    : [];

                // 🔍 DEBUG only first 5 staff
                if (debugCount < 5) {
                    console.log(
                        '🧪 Staff:',
                        staff.Name,
                        'Accessible:',
                        staff.Accessible_Forms__c,
                        'Split:',
                        grantedForms
                    );
                    debugCount++;
                }

                return {
                    Id: staff.Id,
                    firstName: staff.Name,
                    lastName: staff.Last_Name__c,
                    picture: staff.Picture__c,
                    email: staff.Email_Address__c,
                    facilityName: staff.Facility__r?.Name || 'Unknown',
                    role: staff.Role__c,
                    status: staff.Status__c,
                    displayStatus: staff.Status__c ? 'Active' : 'Inactive',
                    grantedForms,

                    // 🔥 multi-form safe preselect
                    isSelected: this.formsToGrant?.some(id =>
                        grantedForms.includes(id)
                    )
                };
            });

            // ===============================
            // 🔍 PRESELECTED STAFF DEBUG
            // ===============================

            const preselected = this.staffList.filter(s => s.isSelected);

            console.log(
                '✅ Preselected staff count:',
                preselected.length
            );

            console.table(
                preselected.map(s => ({
                    Id: s.Id,
                    Name: `${s.firstName} ${s.lastName}`,
                    Facility: s.facilityName,
                    GrantedForms: s.grantedForms
                }))
            );

            // ===============================

            const uniqueFacilityNames = [
                ...new Set(this.staffList.map(s => s.facilityName).filter(Boolean))
            ];

            this.staffFacilityOptions = [
                { label: 'All Facilities', value: '' },
                ...uniqueFacilityNames.map(name => ({
                    label: name,
                    value: name
                }))
            ];

            this.filteredStaffList = [...this.staffList];

            this.totalStaffRecords = this.staffList.length;

            this.pageNumberStaff = 1;

            this.applyStaffFilters();
            this.paginateStaff();

        })
        .catch(err => {
            console.error('❌ Staff load failed', err);
        });
}


handleCheckBoxChange(event) {

    this.chosenFacilityValues = event.detail.value;

    if (!this.chosenFacilityValues.length) {
        this.filteredStaffList = [...this.staffList];
    } else {
        this.filteredStaffList = this.staffList.filter(s =>
            this.chosenFacilityValues.includes(s.facilityName)
        );
    }

    this.pageNumberStaff = 1;

    this.paginationHelperStaff();
}
handleStaffSelect(event) {

    const id = event.currentTarget.dataset.id;
    const checked = event.target.checked;

    if (checked) {
        this.selectedStaffIds.add(id);
    } else {
        this.selectedStaffIds.delete(id);
    }

    this.staffList = this.staffList.map(s =>
        s.Id === id ? { ...s, isSelected: checked } : s
    );

    this.filteredStaffList = [...this.filteredStaffList];
}

paginateStaff() {

    this.totalStaffRecords = this.filteredStaffList.length;

    this.totalStaffPages = Math.ceil(
        this.totalStaffRecords / this.pageSizeStaff
    ) || 1;

    const start = (this.pageNumberStaff - 1) * this.pageSizeStaff;

    const end = start + this.pageSizeStaff;

    this.paginatedStaff = this.filteredStaffList.slice(start, end);

    this.bDisableFirstStaff = this.pageNumberStaff === 1;

    this.bDisableLastStaff =
        this.pageNumberStaff === this.totalStaffPages;
}

async grantAccess() {

    const staffIds = this.staffList
        .filter(s => s.isSelected)
        .map(s => s.Id);

    if (!staffIds.length) {
        this.showToast('Error','Select staff','error');
        return;
    }

    try {

        await appendFormsToStaff({
            staffIds,
            formIds: this.formsToGrant
        });

        this.showToast('Success','Access granted','success');

        this.closeGrantAccessPopup();

        // 🔄 refresh staff list
        this.loadStaffList();

        // 🔥 refresh unified forms list
        await this.loadUnifiedForms();

    } catch (error) {

        console.error('❌ Grant error', error);

        this.showToast(
            'Error',
            error.body?.message || 'Grant failed',
            'error'
        );
    }
}

closeGrantAccessPopup() {

    console.log('🧹 Closing Grant modal — clearing selections');

    this.isGrantAccessPopupOpen = false;

    // 🔥 Clear selected staff
    this.selectedStaffIds.clear();

    this.staffList = this.staffList.map(s => ({
        ...s,
        isSelected: false
    }));

    this.filteredStaffList = [...this.staffList];

    this.paginatedStaff = [];

    // 🔥 Clear selected forms
    this.formsToGrant = [];

    this.selectedPublishedFormIds?.clear?.();

    this.isAllPublishedSelected = false;

    // 🔥 Reset filters
    this.selectedFacility = '';
    this.staffSearchKey = '';

    // 🔥 Reset pagination
    this.pageNumberStaff = 1;

    console.log('✅ Grant modal state fully reset');
}

firstStaffPage() {
    this.pageNumberStaff = 1;
    this.paginateStaff();
}

previousStaffPage() {
    if (this.pageNumberStaff > 1) {
        this.pageNumberStaff--;
        this.paginateStaff();
    }
}

nextStaffPage() {
    if (this.pageNumberStaff < this.totalStaffPages) {
        this.pageNumberStaff++;
        this.paginateStaff();
    }
}

lastStaffPage() {
    this.pageNumberStaff = this.totalStaffPages;
    this.paginateStaff();
}

staffPageSizeOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 }
];
handleStaffPageSizeChange(event) {

    const newSize = parseInt(event.target.value, 10);

    console.log('📄 Staff page size changed to:', newSize);

    this.pageSizeStaff = newSize;

    this.pageNumberStaff = 1;

    this.paginateStaff();
}
selectedPublishedFormIds = new Set();
isAllPublishedSelected = false;


handlePublishedCheckboxChange(event) {

    const formId = event.currentTarget.dataset.id;
    const checked = event.target.checked;

    console.log('☑️ Published checkbox:', formId, checked);

    // Update current page UI
    this.paginatedForms = this.paginatedForms.map(f =>
        f.recordId === formId
            ? { ...f, isSelected: checked }
            : f
    );

    // Track globally
    if (checked) {
        this.selectedPublishedFormIds.add(formId);
    } else {
        this.selectedPublishedFormIds.delete(formId);
    }

    // 🔁 Sync header "select all" checkbox for visible page
    const visiblePublished = this.paginatedForms.filter(f => f.isPublished);

    this.isAllPublishedSelected =
        visiblePublished.length > 0 &&
        visiblePublished.every(f =>
            this.selectedPublishedFormIds.has(f.recordId)
        );

    console.log(
        '📦 Selected published forms:',
        [...this.selectedPublishedFormIds]
    );
}

handleSelectAllPublished(event) {

    const checked = event.target.checked;

    console.log('☑️ Header select all:', checked);

    this.isAllPublishedSelected = checked;

    // Only apply to visible page
    const updatedPage = this.paginatedForms.map(form => {

        if (form.isPublished) {

            if (checked) {
                this.selectedPublishedFormIds.add(form.recordId);
            } else {
                this.selectedPublishedFormIds.delete(form.recordId);
            }

            return { ...form, isSelected: checked };
        }

        return form;
    });

    this.paginatedForms = updatedPage;
}


}