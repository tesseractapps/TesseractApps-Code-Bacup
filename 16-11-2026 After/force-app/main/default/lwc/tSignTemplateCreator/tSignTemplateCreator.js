import { LightningElement, track, api, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import pdfjsLib from "@salesforce/resourceUrl/pdfJS";
import pdfWorker from "@salesforce/resourceUrl/pdfWorker";
import { loadScript } from "lightning/platformResourceLoader";
import createOfferTemplate from "@salesforce/apex/TSignTemplateController.createOfferTemplate";
import uploadFileToAWS from "@salesforce/apex/TeSignAWSUploadController.uploadFile";
import getUploadedFileUrl from "@salesforce/apex/TSignTemplateController.getUploadedFileUrl";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import savePlaceholders from "@salesforce/apex/TSignTemplateController.savePlaceholders";
import getPlaceholders from "@salesforce/apex/TSignTemplateController.getPlaceholders";
import getOfferTemplateCustomFields from "@salesforce/apex/TSignTemplateController.getOfferTemplateCustomFields";
import createOfferTemplateCustomField from "@salesforce/apex/TSignTemplateController.createOfferTemplateCustomField";
import updateOfferTemplateCustomField from "@salesforce/apex/TSignTemplateController.updateOfferTemplateCustomField";
import deactivateOfferTemplateCustomField from "@salesforce/apex/TSignTemplateController.deactivateOfferTemplateCustomField";

import sendRecordEmail from "@salesforce/apex/TSignTemplateController.sendRecordEmail";
import saveEmailsToBackend from "@salesforce/apex/TSignTemplateController.saveEmailsToBackend";
import updateCurrentRecipient from "@salesforce/apex/TSignTemplateController.updateCurrentRecipient";
import startEmailSequence from "@salesforce/apex/TSignTemplateController.startEmailSequence";
import advanceEmailSequence from "@salesforce/apex/TSignTemplateController.advanceEmailSequence";
import updateRecordWithAWSUrl from "@salesforce/apex/TSignTemplateController.updateRecordWithAWSUrl";
import TeSignLogo from "@salesforce/resourceUrl/Te_sign";
import mammothJs from "@salesforce/resourceUrl/mammothJs";
import jsPDF from "@salesforce/resourceUrl/jspdf";
import html2canvasLib from "@salesforce/resourceUrl/html2canvas";
import getTSignURL from "@salesforce/apex/TSignTemplateController.getTSignURL";
import { subscribe, createMessageContext } from "lightning/messageService";
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import deleteOfferTemplate from "@salesforce/apex/TSignTemplateController.deleteOfferTemplate";
import getTemplates from "@salesforce/apex/TSignDocumentController.getTemplates";
// import isStartPlan from '@salesforce/apex/LimitCheckService.isStartPlan';
import getDocumentTypes from "@salesforce/apex/TSign_OfferTemplateDocumentType.getDocumentTypes";
import createDocumentType from "@salesforce/apex/TSign_OfferTemplateDocumentType.createDocumentType";
import getTemplateDocumentTypeId from "@salesforce/apex/TSign_OfferTemplateDocumentType.getTemplateDocumentTypeId";
import getDocumentTypeById from "@salesforce/apex/TSign_OfferTemplateDocumentType.getDocumentTypeById";
import updateDocumentType from "@salesforce/apex/TSign_OfferTemplateDocumentType.updateDocumentType";
import deleteDocumentType from "@salesforce/apex/TSign_OfferTemplateDocumentType.deleteDocumentType";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getDashboardCounts from '@salesforce/apex/TSignDocumentController.getDashboardCounts';
import getDashboardRecords from '@salesforce/apex/TSignDocumentController.getDashboardRecords';
import fetchPDF from '@salesforce/apex/TSignDocumentController.fetchPDF';
import getRecentActivities from '@salesforce/apex/TSignDocumentController.getRecentActivities';
import sendSignatureReminders from '@salesforce/apex/TSignDocumentController.sendSignatureReminders';
import getUserNameInfo from '@salesforce/apex/TsignUserManagementController.getUserNameInfo';
import searchContacts from '@salesforce/apex/TSignTemplateController.searchContacts';
import TIME_ZONE from '@salesforce/i18n/timeZone';
import USER_ID from '@salesforce/user/Id';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import USER_NAME from '@salesforce/schema/User.Name';
import USER_EMAIL from '@salesforce/schema/User.Email';
import deleteAwsFiles from "@salesforce/apex/tSignAwsBatchController.deleteFiles";
import getDocPages from "@salesforce/apex/tSignDocApiController.getPages";
import deleteDocFiles from "@salesforce/apex/tSignDocApiController.deleteFiles";
import getDocDownloadUrl from "@salesforce/apex/tSignDocApiController.getDownloadUrl";
import getDownloadUrlVariant from "@salesforce/apex/tSignDocApiController.getDownloadUrlVariant";
import { getVariantFileName } from "c/tSignDocApiUtils";

const PLACEHOLDER_W_DEFAULT = 240;
const PLACEHOLDER_H_DEFAULT = 44;
const SIGNATURE_W_DEFAULT = 240;
const SIGNATURE_H_DEFAULT = 64;
const SIGNATURE_MIN_W = 120;
const SIGNATURE_MIN_H = 40;
const AUTO_SHIFT_STEP = 8;
const MAX_SHIFT_STEPS = 200;
const GUTTER_X = 1;
const GUTTER_Y = 1;
const ZOOM_STEPS = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

const AWS_BASE = 'https://tesseractapps.com';
const ENDPOINTS = {
  delete: `${AWS_BASE}/delete-file`
};

const UPLOAD_TRACE = true;
const TIMING_LOG = true;

export default class TemplateCreator extends LightningElement {
  @track useDocApi = true;
  _usingServerPages = false;
  _serverPages = [];
  _serverPagesExpiresAt = null;
  _refreshingPages = false;

  _pageImagesSettled = new Map();
  _thumbImagesSettled = new Map();
  _hasLoggedPage1 = false;
  _hasLoggedAllPages = false;
  _hasLoggedAllThumbs = false;
  _perfTimeoutId = null;

  @track zoomLevel = 1;

  // Field Guide State (DocuSign-style tab navigation)
  @track guideIndex = -1;
  @track guideTargetId = null;
  @track guidePageNumber = null;
  @track guideTopPx = 0;
  @track guideLeftPx = -104;
  @track isGuideCompact = false;
  _guideDirty = false;
  _windowResizeHandler = null;
  _lastGuideRecipientKey = null;
  _lastGuideSig = '';

  @track fileName = "";
  @track url;
  @track selectedFile = null;
  @track isLoading = false;
  _recordId = "";
  @track awsUrl = "";

  @track documentTypeOptions = [];
  @track selectedDocumentTypeId = "";
  @track selectedDocumentType = "";
  @track showDocumentTypeModal = false;
  @track newDocumentTypeName = "";
  @track isSavingDocumentType = false;
  @api showPdfPreviewModal = false;
  @track previewImageSrc = "";
  previewPdfDoc = null;
  @track previewCurrentPage = 1;
  @track previewTotalPages = 1;
  @track isPreviewLoading = false;
  @track previewPages = []; // [{ pageNumber, src, wrapperStyle, altText }]
  _previewObserver = null;
  _previewRenderToken = 0;
  _previewRendering = new Set();
  _previewKey = null;
  _previewRefreshing = false;

  @track isDropdownOpen = false;
  @track searchKeyword = "";

  // Edit modal properties
  @track showEditModal = false;
  @track editingRecordId = "";
  @track editingRecordName = "";
  @track isSavingEdit = false;

  // Delete modal properties
  @track showDeleteModal = false;
  @track deletingRecordId = "";
  @track deletingRecordName = "";
  @track isDeleting = false;

  @api
  get recordId() {
    return this._recordId;
  }
  set recordId(value) {
    const oldVal = this._recordId;
    this._recordId = value;
    if (value && value !== oldVal) {
      this.loadTemplateDocumentType();
    }
  }

loadDocumentTypes() {
  console.log("========== loadDocumentTypes START ==========");
  console.log("Organisation ID (orgid):", this.orgid);
  console.log("Selected Document Type ID:", this.selectedDocumentTypeId);

  return getDocumentTypes({ orgId: this.orgid })
    .then((data) => {
      console.log("Raw document types response:", JSON.stringify(data, null, 2));
      console.log("Total document types retrieved:", data?.length);

      let options = data.map((dt) => ({
        label: dt.Document_Type_Name__c,
        value: dt.Id,
        isDefault: dt.Is_Default__c,
        orgId: dt.TSign_Organisation__c,
        active: dt.Active__c
      }));

      console.log("Mapped document type options:", JSON.stringify(options, null, 2));

      // Handle inactive option retrieval
      if (this.selectedDocumentTypeId) {
        console.log(
          "Checking whether selected document type exists:",
          this.selectedDocumentTypeId
        );

        const exists = options.some(
          (opt) => opt.value === this.selectedDocumentTypeId
        );

        console.log("Selected document type exists in options:", exists);

        if (!exists) {
          console.warn(
            "Selected document type not found in the initial list. Fetching by ID:",
            this.selectedDocumentTypeId
          );

          return getDocumentTypeById({
            docTypeId: this.selectedDocumentTypeId,
            orgId: this.orgid
          })
            .then((dt) => {
              console.log(
                "Document type retrieved by ID:",
                JSON.stringify(dt, null, 2)
              );

              if (dt) {
                const inactiveOption = {
                  label: dt.Document_Type_Name__c,
                  value: dt.Id,
                  isDefault: dt.Is_Default__c,
                  orgId: dt.TSign_Organisation__c,
                  active: dt.Active__c
                };

                options.push(inactiveOption);

                console.log(
                  "Added missing selected document type:",
                  JSON.stringify(inactiveOption, null, 2)
                );
              } else {
                console.warn(
                  "No document type returned for selected ID:",
                  this.selectedDocumentTypeId
                );
              }

              this.documentTypeOptions = options;

              console.log(
                "Final document type options:",
                JSON.stringify(this.documentTypeOptions, null, 2)
              );
              console.log(
                "Final options count:",
                this.documentTypeOptions.length
              );
              console.log("========== loadDocumentTypes END ==========");
            })
            .catch((err) => {
              console.error(
                "Error loading selected document type by ID:",
                err
              );
              console.error("Error details:", JSON.stringify(err, null, 2));

              this.documentTypeOptions = options;

              console.log(
                "Fallback document type options:",
                JSON.stringify(this.documentTypeOptions, null, 2)
              );
              console.log("========== loadDocumentTypes END (ERROR) ==========");
            });
        }
      } else {
        console.log(
          "No selectedDocumentTypeId provided. Skipping lookup by ID."
        );
      }

      this.documentTypeOptions = options;

      console.log(
        "Final document type options:",
        JSON.stringify(this.documentTypeOptions, null, 2)
      );
      console.log("Final options count:", this.documentTypeOptions.length);
      console.log("========== loadDocumentTypes END ==========");
    })
    .catch((error) => {
      console.error("Error loading document types:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.log("========== loadDocumentTypes END (ERROR) ==========");
    });
}  

  loadCustomFields() {
    if (!this.orgid) {
      console.warn("orgid is not available, skipping loadCustomFields");
      return Promise.resolve();
    }
    this.isLoading = true;
    return getOfferTemplateCustomFields({ orgId: this.orgid })
      .then((data) => {
        this.isLoading = false;
        if (data) {
          this.customFields = data.map((cf) => ({
            id: cf.Id,
            key: cf.Field_Key__c,
            label: cf.Field_Label__c,
            dataType: cf.Data_Type__c,
            options: cf.Picklist_Options__c ? cf.Picklist_Options__c.split("\n").map(o => o.trim()).filter(o => o !== "") : [],
            icon: this.getCustomFieldIcon(cf.Data_Type__c)
          }));
        }
      })
      .catch((error) => {
        this.isLoading = false;
        console.error("Error loading custom fields library:", error);
        this.showToast("Error", "Failed to load custom fields library.", "error");
      });
  }


  loadTemplateDocumentType() {
    if (this._recordId) {
      getTemplateDocumentTypeId({ templateId: this._recordId })
        .then((docTypeId) => {
          if (docTypeId) {
            this.selectedDocumentTypeId = docTypeId;
            this.loadDocumentTypes();
          }
        })
        .catch((error) => {
          console.error("Error retrieving template document type:", error);
        });
    }
  }

  get filteredDocumentTypeOptions() {
    let list = this.documentTypeOptions;
    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase().trim();
      list = list.filter(opt => opt.label.toLowerCase().includes(kw));
    }
    return list.map(opt => ({
      ...opt,
      isSelected: opt.value === this.selectedDocumentTypeId,
      class: `dropdown-item-li ${opt.value === this.selectedDocumentTypeId ? 'selected' : ''}`
    }));
  }

  get isFilteredListEmpty() {
    return this.filteredDocumentTypeOptions.length === 0;
  }

  get selectedDocumentTypeName() {
    const selected = this.documentTypeOptions.find(opt => opt.value === this.selectedDocumentTypeId);
    return selected ? selected.label : "Select Document Type";
  }

  // toggleDropdown() {
  //   this.isDropdownOpen = !this.isDropdownOpen;
  //   if (this.isDropdownOpen) {
  //     this.searchKeyword = ""; // Reset search keyword on open
  //   }
  // }
toggleDropdown(event) {
  event.stopPropagation();
  console.log("========== toggleDropdown START ==========");
  console.log("Dropdown state before toggle:", this.isDropdownOpen);
  console.log("Current search keyword:", this.searchKeyword);

  this.isDropdownOpen = !this.isDropdownOpen;

  console.log("Dropdown state after toggle:", this.isDropdownOpen);

  if (this.isDropdownOpen) {
    console.log("Dropdown opened. Resetting search keyword.");
    this.searchKeyword = "";

    console.log("Search keyword after reset:", this.searchKeyword);
    console.log("Available document type options:", this.documentTypeOptions?.length);
    console.log(
      "Document type options:",
      JSON.stringify(this.documentTypeOptions, null, 2)
    );
  } else {
    console.log("Dropdown closed.");
  }

  console.log("========== toggleDropdown END ==========");
}  

  handleSearchWrapperClick(event) {
    event.stopPropagation();
  }

  handleSearchInput(event) {
    this.searchKeyword = event.target.value;
  }

  handleOptionSelect(event) {
    const selectId = event.currentTarget.dataset.id;
    this.selectedDocumentTypeId = selectId;
    const selectedOption = this.documentTypeOptions.find(opt => opt.value === selectId);
    this.selectedDocumentType = selectedOption ? selectedOption.label : "";
    this.isDropdownOpen = false;
  }

  handleClickOutside(event) {
    const path = event.composedPath();
    const dropdown = this.template.querySelector('.custom-dropdown-container');
    if (dropdown && !path.includes(dropdown)) {
      this.isDropdownOpen = false;
    }
    const rcpDropdown = this.template.querySelector('.recipient-dropdown-container');
    if (rcpDropdown && !path.includes(rcpDropdown)) {
      this.isRecipientDropdownOpen = false;
    }
  }

  openDocumentTypeModal(event) {
    if (event) {
      event.stopPropagation();
    }
    this.isDropdownOpen = false;
    this.newDocumentTypeName = "";
    this.showDocumentTypeModal = true;
  }

  closeDocumentTypeModal() {
    this.showDocumentTypeModal = false;
    this.newDocumentTypeName = "";
  }

  handleNewDocumentTypeNameChange(event) {
    this.newDocumentTypeName = event.target.value;
  }

  handleSaveDocumentType() {
    if (!this.newDocumentTypeName || !this.newDocumentTypeName.trim()) {
      this.showToast("Error", "Document Type name cannot be empty.", "error");
      return;
    }

    this.isSavingDocumentType = true;
    createDocumentType({ documentTypeName: this.newDocumentTypeName, orgId: this.orgid })
      .then((createdRecord) => {
        this.showToast("Success", "Document Type created successfully.", "success");
        this.selectedDocumentTypeId = createdRecord.Id;
        this.selectedDocumentType = createdRecord.Document_Type_Name__c;
        this.closeDocumentTypeModal();
        return this.loadDocumentTypes();
      })
      .catch((error) => {
        console.error("Error creating document type:", error);
        this.showToast("Error", error.body?.message || "Failed to create Document Type.", "error");
      })
      .finally(() => {
        this.isSavingDocumentType = false;
      });
  }

  get customFieldDataTypeOptions() {
    return [
      { label: "Text", value: "Text" },
      { label: "Long Text", value: "Long Text" },
      { label: "Number", value: "Number" },
      { label: "Currency", value: "Currency" },
      { label: "Date", value: "Date" },
      { label: "Email", value: "Email" },
      { label: "Phone", value: "Phone" },
      { label: "Boolean / Checkbox", value: "Boolean" },
      { label: "Picklist", value: "Picklist" }
    ];
  }

  get isCustomFieldPicklist() {
    return this.customFieldDataType === "Picklist";
  }

  get customFieldModalTitle() {
    return this.editingCustomFieldKey ? "Edit Custom Field" : "Create Custom Field";
  }

  get customFieldModalButtonLabel() {
    return this.editingCustomFieldKey ? "Save Changes" : "Add Field";
  }

  openCustomFieldModal() {
    this.editingCustomFieldKey = null; // New Mode
    this.customFieldLabel = "";
    this.customFieldDataType = "Text";
    this.customFieldRequired = true;
    this.customFieldOptions = "";
    this.showCustomFieldEditor = true;
  }

  closeCustomFieldModal() {
    this.showCustomFieldEditor = false;
  }

  handleCustomFieldLabelChange(event) {
    this.customFieldLabel = event.target.value;
  }

  handleCustomFieldDataTypeChange(event) {
    this.customFieldDataType = event.detail.value;
  }

  handleCustomFieldOptionsChange(event) {
    this.customFieldOptions = event.target.value;
  }

  handleCustomFieldRequiredChange(event) {
    this.customFieldRequired = event.target.checked;
  }

  handleEditCustomField(event) {
    event.stopPropagation();
    const key = event.currentTarget.dataset.key;
    const cf = this.customFields.find(f => f.key === key);
    if (!cf) return;

    this.editingCustomFieldKey = key; // Edit Mode
    this.customFieldLabel = cf.label;
    this.customFieldDataType = cf.dataType;
    this.customFieldOptions = (cf.options || []).join("\n");

    this.showCustomFieldEditor = true;
  }

  handleCreateCustomField() {
    const label = (this.customFieldLabel || "").trim();
    if (!label) {
      this.showToast("Error", "Please enter a field label.", "error");
      return;
    }

    // Prohibit duplicate active labels within the organization
    const labelLower = label.toLowerCase();
    const isDuplicate = this.customFields.some(
      cf => cf.label.toLowerCase() === labelLower && cf.key !== this.editingCustomFieldKey
    );
    if (isDuplicate) {
      this.showToast("Error", `A custom field named "${label}" already exists in the library.`, "error");
      return;
    }

    if (this.customFieldDataType === "Picklist" && !this.customFieldOptions.trim()) {
      this.showToast("Error", "Please enter picklist options.", "error");
      return;
    }

    let optionsArray = [];
    let optionsString = "";
    if (this.customFieldDataType === "Picklist") {
      optionsArray = this.customFieldOptions
        .split("\n")
        .map(opt => opt.trim())
        .filter(opt => opt !== "");
      optionsString = optionsArray.join("\n");
    }

    this.isLoading = true;
    if (this.editingCustomFieldKey) {
      // Edit Mode
      const targetCf = this.customFields.find(f => f.key === this.editingCustomFieldKey);
      if (!targetCf) {
        this.isLoading = false;
        return;
      }

      updateOfferTemplateCustomField({
        fieldId: targetCf.id,
        label: label,
        dataType: this.customFieldDataType,
        options: optionsString
      })
        .then(() => {
          this.isLoading = false;
          this.customFields = this.customFields.map(cf => {
            if (cf.key === this.editingCustomFieldKey) {
              return {
                ...cf,
                label: label,
                dataType: this.customFieldDataType,
                options: optionsArray,
                icon: this.getCustomFieldIcon(this.customFieldDataType)
              };
            }
            return cf;
          });

          // Snapshot update: update current unsaved placed placeholders *only*
          this.placeholders = this.placeholders.map(placeholder => {
            if (placeholder.customKey === this.editingCustomFieldKey) {
              return {
                ...placeholder,
                label: label,
                dataType: this.customFieldDataType,
                options: optionsArray,
                picklistOptions: optionsArray,
                isCustomText: this.customFieldDataType === 'Text',
                isCustomLongText: this.customFieldDataType === 'Long Text',
                isCustomNumber: this.customFieldDataType === 'Number',
                isCustomCurrency: this.customFieldDataType === 'Currency',
                isCustomDate: this.customFieldDataType === 'Date',
                isCustomEmail: this.customFieldDataType === 'Email',
                isCustomPhone: this.customFieldDataType === 'Phone',
                isCustomBoolean: this.customFieldDataType === 'Boolean',
                isCustomPicklist: this.customFieldDataType === 'Picklist'
              };
            }
            return placeholder;
          });

          this.showToast("Success", `Custom field "${label}" updated.`, "success");
          this.editingCustomFieldKey = null;
          this.showCustomFieldEditor = false;
        })
        .catch(error => {
          this.isLoading = false;
          console.error("Error updating custom field:", error);
          this.showToast("Error", "Failed to update custom field.", "error");
        });
    } else {
      // Create Mode
      createOfferTemplateCustomField({
        label: label,
        dataType: this.customFieldDataType,
        options: optionsString,
        orgId: this.orgid
      })
        .then((createdRecord) => {
          this.isLoading = false;
          const newField = {
            id: createdRecord.Id,
            key: createdRecord.Field_Key__c,
            label: createdRecord.Field_Label__c,
            dataType: createdRecord.Data_Type__c,
            options: optionsArray,
            icon: this.getCustomFieldIcon(createdRecord.Data_Type__c)
          };

          this.customFields = [...this.customFields, newField];
          this.showToast("Success", `Custom field "${label}" added.`, "success");
          this.showCustomFieldEditor = false;
        })
        .catch(error => {
          this.isLoading = false;
          console.error("Error creating custom field:", error);
          this.showToast("Error", "Failed to create custom field.", "error");
        });
    }
  }

  getCustomFieldIcon(dataType) {
    switch (dataType) {
      case 'Text': return 'title';
      case 'Long Text': return 'notes';
      case 'Number': return 'pin';
      case 'Currency': return 'attach_money';
      case 'Date': return 'calendar_today';
      case 'Email': return 'email';
      case 'Phone': return 'phone';
      case 'Boolean': return 'check_box';
      case 'Picklist': return 'list';
      default: return 'help';
    }
  }

  deleteCustomFieldDefinition(event) {
    event.stopPropagation();
    const key = event.currentTarget.dataset.key;
    const targetCf = this.customFields.find(f => f.key === key);
    if (!targetCf) return;

    this.isLoading = true;
    deactivateOfferTemplateCustomField({ fieldId: targetCf.id })
      .then(() => {
        this.isLoading = false;
        this.customFields = this.customFields.filter(cf => cf.key !== key);
        this.placeholders = this.placeholders.filter(p => p.customKey !== key);
        this.showToast("Success", "Custom field deactivated successfully.", "success");
      })
      .catch((error) => {
        this.isLoading = false;
        console.error("Error deactivating custom field:", error);
        this.showToast("Error", "Failed to deactivate custom field.", "error");
      });
  }


  handleEditLaunch(event) {
    event.stopPropagation();
    this.editingRecordId = event.target.dataset.id;
    this.editingRecordName = event.target.dataset.name;
    this.showEditModal = true;
  }

  handleEditNameChange(event) {
    this.editingRecordName = event.target.value;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingRecordId = "";
    this.editingRecordName = "";
  }

  handleSaveEditDocumentType() {
    if (!this.editingRecordName || !this.editingRecordName.trim()) {
      this.showToast("Error", "Document Type name cannot be empty.", "error");
      return;
    }

    this.isSavingEdit = true;
    updateDocumentType({
      documentTypeId: this.editingRecordId,
      documentTypeName: this.editingRecordName,
      orgId: this.orgid
    })
      .then(() => {
        this.showToast("Success", "Document Type updated successfully.", "success");
        this.closeEditModal();
        return this.loadDocumentTypes();
      })
      .catch((error) => {
        console.error("Error updating document type:", error);
        this.showToast("Error", error.body?.message || "Failed to update Document Type.", "error");
      })
      .finally(() => {
        this.isSavingEdit = false;
      });
  }

  handleDeleteLaunch(event) {
    event.stopPropagation();
    this.deletingRecordId = event.target.dataset.id;
    this.deletingRecordName = event.target.dataset.name;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletingRecordId = "";
    this.deletingRecordName = "";
  }

  handleConfirmDelete() {
    this.isDeleting = true;
    deleteDocumentType({
      documentTypeId: this.deletingRecordId,
      orgId: this.orgid
    })
      .then(() => {
        this.showToast("Success", "Document Type deleted successfully.", "success");
        if (this.selectedDocumentTypeId === this.deletingRecordId) {
          this.selectedDocumentTypeId = "";
          this.selectedDocumentType = "";
        }
        this.closeDeleteModal();
        return this.loadDocumentTypes();
      })
      .catch((error) => {
        console.error("Error deleting document type:", error);
        this.showToast("Error", error.body?.message || "Failed to delete Document Type.", "error");
      })
      .finally(() => {
        this.isDeleting = false;
      });
  }
  @track isFileAttached = false;
  @track selectedFilesToUpload = [];
  @track showSpinner = false;
  @track fileName;
  @track doc;
  @track fileSize;
  @track isattachError = false;
  @track isTSignDocs = false;
  // @track recipientEmails = [
  //   {
  //     key: 0,
  //     label: "New Joinee Email (Required)",
  //     email: "",
  //     canRemove: false
  //   }
  // ];
  @track currentRecipient = "";
  @track key;
  @track currentRecipientStatus = "";
  @track showRecipientModal = false;
  @track selectedRecipient = null;
  @track newPlaceholder = null;
  d;
  @track isLoadingCircle = false;
  @track showSuccessScreen = false;
  @track isConfirmationPopupVisible = false;
  @track confirmationPopupMode = 'send';
  @track recipientToRemoveIndex = null;
  @track selectedReassignRecipientKey = null;
  // @api orgid; manendra commented for Tsigndata refresh
  _orgid;
_startupDone = false; // connectedCallback has run its first data loads
@api
get orgid() {
  return this._orgid;
}
set orgid(value) {
  const firstOrgId = !this._orgid && !!value;
  this._orgid = value;
  // Org Id arrived after T sign opened (e.g. page refresh): load the data now
  if (firstOrgId && this._startupDone) {
    this.loadDashboardCounts();
    this.loadDocumentTypes();
    this.loadCustomFields();
  }
}//manendra commented for Tsigndata refresh
  context = createMessageContext(); // Create LMS context
  @track tsignreUrl = "";
  file; //holding file instance
  myFile;
  fileType; //holding file type
  fileReaderObj;
  base64FileData;
  pdfDoc = null; // PDF document reference
  pdfLoaded = false; // Prevents reloading PDFs
  _pagePt = null;
  _pageDimensionsCache = new Map();
  @api imageSrc = ""; // Base64 image source
  @track imageSrcs = []; // Stores Base64 images for multi-page display
  @track pagesData = []; // Stores rendered page objects [{ pageNumber, imageSrc, containerStyle, pageLabel }]
  _intersectionObserver = null;
  _pageVisibilityMap = new Map();

  // Page Thumbnails Panel State
  @track isThumbnailPanelOpen = false;
  @track thumbnailSrcByPage = {};
  _thumbGenId = 0;
  _isGeneratingThumbnails = false;
  _hasGeneratedThumbnails = false;
  _lastThumbSyncedPage = null;
  _thumbNeedsScrollSync = false;

  get hasPages() {
    return this.pagesData && this.pagesData.length > 0;
  }

  @api currentPage = 1; // Current page for pagination
  @api totalPages = 0; // Total number of pages in the PDF
  @track placeholders = []; // List of placeholders
  @track draggedType = null; // Type of placeholder being dragged
  @track currentDraggedPlaceholder = null; // Placeholder currently being dragged
  @track isFileExpand = false;
  @track isHome = true;
  @track showUpgradeModal = false;
  @track isSupportCoordinator = false;
  @track activeRecipientKey = null;
  @track isRecipientDropdownOpen = false;
  @track isEditRecipientsModalOpen = false;
  @track showCustomFieldEditor = false;
  @track customFieldLabel = "";
  @track customFieldDataType = "Text";
  @track customFieldRequired = true;
  @track customFieldOptions = "";
  @track customFields = [];
  @track editingCustomFieldKey = null;


  @track actionRequiredCount = 0;
  @track waitingForOthersCount = 0;
  @track expiringSoonCount = 0;
  @track expiring24HoursCount = 0;
  @track completedCount = 0;
  @track recentActivities = [];
  pendingHighlightRecordId = null;
  highlightTimeout = null;
  applyTimeout = null;

  recipientColors = [
    '#0176D3', // Blue
    '#2E844A', // Green
    '#DD7A01', // Orange
    '#9050B5', // Purple
    '#C23934', // Red
    '#0B5CAB',
    '#4BCA81',
    '#F88962'
  ];
  @track recipientEmails = [];
  @track suggestions = [];
  @track suggestRowKey = null;
  @track suggestField = null;
  @track suggestActiveIndex = -1;
  @track suggestOpenUp = false;
  @track suggestStyle = '';
  _suggestTimer = null;
  _suggestSeq = 0;
  _suggestCache = new Map();
  @track isOnlySigner = false;
  isFetchingOnlySigner = false;
  _onlySignerName = '';
  _onlySignerEmail = '';
  selectedRecipientColor = '#0070d2';
  isPlaceholderDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  _resizing = false;
  _resizeStartWidth = 0;
  _resizeStartX = 0;
  _currentResizingPlaceholder = null;
  get containerStyle() {
    if (this._pagePt && this._pagePt.w > 0 && this._pagePt.h > 0) {
      const height = Math.round(1024 * (this._pagePt.h / this._pagePt.w));
      return `width: 1024px; height: ${height}px; min-height: ${height}px;`;
    }
    return "width: 1024px; height: 1448px; min-height: 1448px;";
  }

  getPageDimensions(pageNumber) {
    if (this._pageDimensionsCache && this._pageDimensionsCache.has(pageNumber)) {
      return this._pageDimensionsCache.get(pageNumber);
    }
    return this._pagePt || { w: 1024, h: 1448 };
  }

  get isSendConfirmationPopup() {
    return this.confirmationPopupMode === 'send';
  }

  get isExpiringSoonCard() {
    return this.selectedCardType === 'expiringSoon';
  }

  get isCompletedCard() {
    return this.selectedCardType === 'completed';
  }

  get reassignRecipientOptions() {
    if (this.recipientToRemoveIndex === null || this.recipientToRemoveIndex === undefined) {
      return [];
    }
    return this.recipientEmails
      .filter(r => r.key !== this.recipientToRemoveIndex)
      .map(r => ({
        label: `${r.name ? r.name + ' - ' : ''}${r.label} (${r.email || "No Email"})`,
        value: String(r.key)
      }));
  }

  get hasOtherRecipients() {
    return this.reassignRecipientOptions.length > 0;
  }

  get isReassignDisabled() {
    return this.selectedReassignRecipientKey === null || this.selectedReassignRecipientKey === undefined;
  }

  get assignedPlaceholdersCount() {
    if (this.recipientToRemoveIndex === null || this.recipientToRemoveIndex === undefined) {
      return 0;
    }
    const recipientToRemove = this.recipientEmails.find(r => r.key === this.recipientToRemoveIndex);
    if (!recipientToRemove) return 0;
    return this.placeholders.filter(p => p.recipient === recipientToRemove.email).length;
  }

  get recipientToRemoveName() {
    if (this.recipientToRemoveIndex === null || this.recipientToRemoveIndex === undefined) {
      return "";
    }
    const recipientToRemove = this.recipientEmails.find(r => r.key === this.recipientToRemoveIndex);
    if (!recipientToRemove) return "";
    const namePrefix = recipientToRemove.name ? `${recipientToRemove.name} - ` : "";
    return recipientToRemove.email ? `${namePrefix}${recipientToRemove.label} (${recipientToRemove.email})` : `${namePrefix}${recipientToRemove.label}`;
  }

  get hasRecipients() {
    if (!Array.isArray(this.recipientEmails) || this.recipientEmails.length === 0) {
      return false;
    }
    return this.recipientEmails.some(
      r => (r.email && r.email.trim().length > 0) || (r.name && r.name.trim().length > 0)
    );
  }

  get recipientCount() {
    if (!Array.isArray(this.recipientEmails)) return 0;
    return this.recipientEmails.filter(
      r => (r.email && r.email.trim().length > 0) || (r.name && r.name.trim().length > 0)
    ).length;
  }

  _getRecipientMeta(r) {
    if (!r) {
      return { initials: "", displayName: "Select recipient", subtext: "" };
    }
    const name = (r.name || "").trim();
    const email = (r.email || "").trim();
    const label = r.label || "Recipient";

    // 1. If recipient has a name entered, use its first letters for initials and full name for display
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      let initials = "";
      if (parts.length >= 2) {
        initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      } else if (parts.length === 1) {
        initials = parts[0].length >= 2
          ? parts[0].slice(0, 2).toUpperCase()
          : parts[0].charAt(0).toUpperCase();
      }

      const displayName = name;
      const subtext = email ? `${label} · ${email}` : `${label} · No email yet`;

      return {
        initials,
        displayName,
        subtext
      };
    }

    // 2. Fall back to email if no name entered
    if (email && email.includes("@")) {
      const localPart = email.split("@")[0];
      const parts = localPart.split(/[._\-\d]+/).filter(Boolean);

      let initials = "";
      let displayName = "";

      if (parts.length >= 2) {
        initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        displayName = parts
          .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(" ");
      } else if (parts.length === 1) {
        initials = parts[0].slice(0, 2).toUpperCase();
        displayName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      } else {
        initials = localPart.slice(0, 2).toUpperCase();
        displayName = localPart;
      }

      return {
        initials,
        displayName,
        subtext: `${label} · ${email}`
      };
    }

    // 3. Neither name nor email
    const ordinalMatch = label.match(/\d+/);
    const initials = ordinalMatch ? ordinalMatch[0] : "1";
    return {
      initials,
      displayName: label,
      subtext: `${label} · No email yet`
    };
  }

  get recipientListFormatted() {
    return (this.recipientEmails || []).map((r, idx) => {
      const isActive = this.activeRecipientKey === r.key;
      const meta = this._getRecipientMeta(r);
      const color = /^#[0-9a-fA-F]{6}$/.test(r.color || "") ? r.color : "#0176D3";

      const isRowSuggest = (this.suggestRowKey === r.key && Array.isArray(this.suggestions) && this.suggestions.length > 0);
      const showNameSuggest = isRowSuggest && this.suggestField === 'name';
      const showEmailSuggest = isRowSuggest && this.suggestField === 'email';
      const suggestListClass = 'rcp-suggest-list';
      const suggestItems = isRowSuggest
        ? this.suggestions.map((s, sIdx) => ({
            ...s,
            index: sIdx,
            isActive: sIdx === this.suggestActiveIndex
          }))
        : [];
      const zIndexStyle = isRowSuggest ? 'z-index: 100; position: relative;' : 'z-index: 1; position: relative;';

      return {
        ...r,
        name: r.name || "",
        orderNumber: idx + 1,
        orderBadgeStyle: `background-color: ${color}20; color: ${color}; border: 1px solid ${color}60;`,
        initials: meta.initials,
        displayName: meta.displayName,
        subtext: meta.subtext,
        isActive,
        activeRadioClass: isActive ? 'recipient-active-radio checked' : 'recipient-active-radio',
        activeRadioStyle: isActive
          ? `border-color: ${color}; background-color: ${color};`
          : `border-color: #cbd5e1;`,
        rowStyle: `border-left: 3px solid ${color}; ${zIndexStyle}`,
        ...this._getRecipientRowDisplayStyles(r, isActive, zIndexStyle),
        showNameSuggest,
        showEmailSuggest,
        nameSuggestExpanded: showNameSuggest ? 'true' : 'false',
        emailSuggestExpanded: showEmailSuggest ? 'true' : 'false',
        suggestListClass,
        suggestItems
      };
    });
  }

  // Display-only styles for the Recipients List rows (no data / behaviour change):
  // whole row = solid border + soft shadow in the recipient colour;
  // email box = light tint of that colour with coloured border and dark editable text.
  _getRecipientRowDisplayStyles(r, isActive, zIndexStyle = '') {
    const color = /^#[0-9a-fA-F]{6}$/.test(r.color || "") ? r.color : "#0176D3";

    const recipientRowStyle =
      `border: 2px solid ${color}; box-shadow: 0 3px 8px ${color}33, 0 1px 2px ${color}1F; ${zIndexStyle}`;

    const bg = `${color}14`;
    const border = `${color}73`;
    const text = "#1e293b";
    const recipientInputStyle =
      `--slds-c-input-color-background:${bg};--sds-c-input-color-background:${bg};` +
      `--slds-c-input-color-border:${border};--sds-c-input-color-border:${border};` +
      `--slds-c-input-text-color:${text};--sds-c-input-text-color:${text};`;

    return { recipientRowStyle, recipientInputStyle };
  }

  get activeRecipientCapsules() {
    return this.recipientEmails.map((r) => {
      let displayName = r.label || '';
      if (r.email && r.email.trim()) {
        const emailStr = r.email.trim();
        if (emailStr.includes('@')) {
          displayName = emailStr.split('@')[0];
        } else {
          displayName = emailStr;
        }
      }
      const isActive = this.activeRecipientKey === r.key;

      let className = 'active-recipient-capsule';
      if (isActive) {
        className += ' active';
      }

      let style = `border: 2px solid ${r.color}; color: ${r.color};`;
      if (isActive) {
        style = `background-color: ${r.color}; border: 2px solid ${r.color}; color: #ffffff; box-shadow: 0 0 8px ${r.color}80;`;
      }

      return {
        key: r.key,
        displayName,
        className,
        style
      };
    });
  }

  handleActiveRecipientSelect(event) {
    const key = parseInt(event.currentTarget.dataset.key, 10);
    this.activeRecipientKey = (this.activeRecipientKey === key) ? null : key;
  }

  // --- Recipient Dropdown Getters & Handlers ---

  get hasActiveRecipient() {
    return (
      this.activeRecipientKey !== null &&
      this.activeRecipientKey !== undefined &&
      (this.recipientEmails || []).some(r => r.key === this.activeRecipientKey)
    );
  }

  get activeRecipient() {
    if (!this.hasActiveRecipient) return null;
    return (this.recipientEmails || []).find(r => r.key === this.activeRecipientKey) || null;
  }

  get activeRecipientTriggerStyle() {
    const r = this.activeRecipient;
    if (!r) {
      return "border: 1px solid #d9dee5; background-color: #ffffff; color: #475569;";
    }
    const color = /^#[0-9a-fA-F]{6}$/.test(r.color || "") ? r.color : "#0176D3";
    return `border: 1.5px solid ${color}; background-color: ${color}14; color: #1e293b;`;
  }

  get activeRecipientAvatarStyle() {
    const r = this.activeRecipient;
    if (!r) return "background-color: #94a3b8; color: #ffffff;";
    const color = /^#[0-9a-fA-F]{6}$/.test(r.color || "") ? r.color : "#0176D3";
    return `background-color: ${color}; color: #ffffff;`;
  }

  get activeRecipientInitials() {
    const r = this.activeRecipient;
    if (!r) return "";
    return this._getRecipientMeta(r).initials;
  }

  get activeRecipientDisplayName() {
    const r = this.activeRecipient;
    if (!r) return "Select recipient";
    return this._getRecipientMeta(r).displayName;
  }

  get recipientDropdownChevronClass() {
    return this.isRecipientDropdownOpen
      ? "material-icons rcp-chevron open"
      : "material-icons rcp-chevron";
  }

  get recipientDropdownTriggerClass() {
    let cls = "rcp-dropdown-trigger";
    if (this.hasActiveRecipient) {
      cls += " active";
    }
    if (this.isRecipientDropdownOpen) {
      cls += " open";
    }
    return cls;
  }

  get recipientDropdownList() {
    return (this.recipientEmails || []).map((r) => {
      const isActive = this.activeRecipientKey === r.key;
      const meta = this._getRecipientMeta(r);
      const color = /^#[0-9a-fA-F]{6}$/.test(r.color || "") ? r.color : "#0176D3";
      return {
        key: r.key,
        initials: meta.initials,
        displayName: meta.displayName,
        subtext: meta.subtext,
        isActive,
        avatarStyle: `background-color: ${color}; color: #ffffff;`,
        itemClass: isActive ? "rcp-dropdown-item active" : "rcp-dropdown-item"
      };
    });
  }

  handleToggleRecipientDropdown(event) {
    event.stopPropagation();
    this.isRecipientDropdownOpen = !this.isRecipientDropdownOpen;
  }

  handleRecipientDropdownSelect(event) {
    const keyVal = event.currentTarget.dataset.key;
    const key = parseInt(keyVal, 10);
    if (!isNaN(key)) {
      this.activeRecipientKey = key;
    }
    this.isRecipientDropdownOpen = false;
    this._resetGuide();
  }

  handleOpenEditRecipientsModal() {
    this.isRecipientDropdownOpen = false;
    this.isEditRecipientsModalOpen = true;
  }

  handleAddRecipientFromSidebar() {
    if (!this.hasRecipients) {
      this.addRecipient();
      if (this.recipientEmails && this.recipientEmails.length > 0) {
        this.activeRecipientKey = this.recipientEmails[0].key;
      }
    }
    this.isEditRecipientsModalOpen = true;
  }

  get isEditRecipientsDoneDisabled() {
    if (!Array.isArray(this.recipientEmails) || this.recipientEmails.length === 0) {
      return true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.recipientEmails.some(r => {
      const name = (r.name || "").trim();
      const email = (r.email || "").trim();
      return !name || !email || !emailRegex.test(email);
    });
  }

  _validateModalRecipients() {
    if (!Array.isArray(this.recipientEmails) || this.recipientEmails.length === 0) {
      this.showToast("Error", "Please add at least one recipient.", "error");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < this.recipientEmails.length; i++) {
      const r = this.recipientEmails[i];
      const name = (r.name || "").trim();
      const email = (r.email || "").trim();
      const order = i + 1;

      if (!name) {
        this.showToast("Error", `Please enter a name for recipient #${order}.`, "error");
        return false;
      }
      if (!email) {
        this.showToast("Error", `Please enter an email for recipient #${order}.`, "error");
        return false;
      }
      if (!emailRegex.test(email)) {
        this.showToast("Error", `Please enter a valid email address for recipient #${order}.`, "error");
        return false;
      }
    }
    return true;
  }

  _validateModalEmails() {
    return this._validateModalRecipients();
  }

  handleEditRecipientsDone() {
    this._closeSuggest();
    if (!this._validateModalRecipients()) {
      return;
    }
    this.isEditRecipientsModalOpen = false;
  }

  handleEditRecipientsClose() {
    this._closeSuggest();
    // If closed via ✕ or backdrop, clean up completely unconfigured rows (no name and no email)
    this.recipientEmails = (this.recipientEmails || []).filter(
      r => (r.name && r.name.trim().length > 0) || (r.email && r.email.trim().length > 0)
    );
    this.refreshRecipientLabels();
    this.isEditRecipientsModalOpen = false;
  }

  handleEditRecipientsBackdropClick(event) {
    if (event.target.classList.contains("rcp-modal-overlay")) {
      this.handleEditRecipientsClose();
    }
  }

  handleModalContainerClick(event) {
    event.stopPropagation();
  }

  handleRecipientTriggerKeydown(event) {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      this.isRecipientDropdownOpen = true;
      requestAnimationFrame(() => {
        const firstItem = this.template.querySelector(".rcp-dropdown-item");
        if (firstItem) {
          firstItem.focus();
        }
      });
    } else if (event.key === "Escape") {
      this.isRecipientDropdownOpen = false;
    }
  }

  handleRecipientItemKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.handleRecipientDropdownSelect(event);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = event.currentTarget.nextElementSibling;
      if (next && next.classList.contains("rcp-dropdown-item")) {
        next.focus();
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = event.currentTarget.previousElementSibling;
      if (prev && prev.classList.contains("rcp-dropdown-item")) {
        prev.focus();
      } else {
        const trigger = this.template.querySelector(".rcp-dropdown-trigger");
        if (trigger) trigger.focus();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.isRecipientDropdownOpen = false;
      const trigger = this.template.querySelector(".rcp-dropdown-trigger");
      if (trigger) trigger.focus();
    }
  }


  getOrdinal(num) {
    if (num === 1) return "1st";
    if (num === 2) return "2nd";
    if (num === 3) return "3rd";
    return `${num}th`;
  }

  activeRecipientDragKey = null;
  // @track recipientEmails = [
  //   {
  //     key: 0,
  //     label: "New Joinee Email*",
  //     email: "",
  //     canRemove: false
  //   }
  // ];
  @track key;

  mode = "DEFAULT";

  nextRecipientKey = 1;
  logo = TeSignLogo;

  getPlaceholderStyle(placeholder) {
    // Ensure values are numbers and return valid CSS
    return `top: ${placeholder.y || 0}px; left: ${placeholder.x || 0}px; position: absolute;`;
  }

  get placeholdersForCurrentPage() {
    return this.placeholders.filter(
      (placeholder) => placeholder.page === this.currentPage
    );
  }

  getRowKey(index) {
    return `row-${index}`;
  }

  getRecipientLabel(index) {
    return `Recipient ${index + 1}`;
  }

  // ✅ email from parent
  _tsignEmail = "";

  @api
  get tsignEmail() {
    return this._tsignEmail;
  }
  set tsignEmail(value) {
    this._tsignEmail = (value || "").trim();
    console.log("📧 [TemplateCreator] tsignEmail setter received:", this._tsignEmail);
    this.prepopulateClientEmail();
  }


  tLogoUrl = `${Loading_Logo}/TLogo.png`;
  tImageUrl = `${Loading_Logo}/T.png`;

  get logoUrl() {
    return this.tLogoUrl;
  }

  get imageUrl() {
    return this.tImageUrl;
  }

  @api tsignReurl = "";
  @api serviceId = "";
  @api quoteId;
  @api formId = "";
  @api source;
  @api hrId;
  @api attachmentId; // manendra added for supportcoordinatorAttachments


  // Guided tour (c-t-sign-guided-tour on the dashboard): where a home-page area is on screen.
  // key: "status" | "upload" | "recent". Returns null when the home page is not showing.
  @api
  getTourTargetRect(key, scrollIntoView) {
    const selector = {
      status: ".status-card-container",
      upload: ".quick-action-section",
      recent: ".recent-activity-section"
    }[key];
    const el = selector ? this.template.querySelector(selector) : null;
    if (!el) return null;
    if (scrollIntoView) el.scrollIntoView({ block: "nearest" });
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }  

  get flowType() {
    if (this.source === "QUOTE") return "Quote";
    if (this.source === "FORM") return "Forms";
    if (this.source === "HR") return "HR";
    return "Service";
  }

  getPicklistValue() {
    if (this.mode !== "LMS") return "Default";

    if (this.source === "QUOTE") return "Quote";
    if (this.source === "FORM") return "Forms";
    if (this.source === "HR") return "HR";
    if (this.source === "SERVICE" || !this.source) return "Service"; // legacy safe

    return "Default";
  }

  get hasSignature() {
      return !!this.signatureUrl;
  }

  // Dynamically assign the CSS class based on the method
  get signatureClass() {
      return this.signatureMethod === 'Type' 
          ? 'signature-img signature-img-type' 
          : 'signature-img';
  }


  async connectedCallback() {
    try {
      const userData = await getCurrentLoggedUserInfo();
      const info = await getUserNameInfo();
      const firstName = info?.firstName ?? '';
      const lastName  = info?.lastName ?? '';
      
      this.userName = `${firstName} ${lastName}`.trim() || 'Guest';
      this.signatureUrl = info?.signatureUrl ?? '';
      this.signatureMethod = info?.method ?? '';
      console.log("user data Enable_Logs__c ==>", JSON.stringify(userData));
      if (userData?.User_Type__c === 'Support Coordinator') {
        this.isSupportCoordinator = true;
      } else if (userData?.SC__c === true) {
        this.isSupportCoordinator = true;
      }
      // const isStart = await isStartPlan();

      // // 🔴 BLOCK ENTIRE MODULE
      // if (isStart) {
      //   console.log('🚫 Start plan → block training  module');
      //   this.showUpgradeModal = true;

      //   // ❗ STOP EVERYTHING
      //   this.isHome = false;
      //   return;
      // }
    } catch (error) {
      console.error('Error checking plan:', error);
      return;
    }
    console.log("📌 AWS URL received in Tsign via Parent Component:", this.tsignReurl);
    console.log("📌 Received Org ID:", this.orgid);
    console.log("📌 Source received in Tsign via Parent Component:", this.source);
    console.log("📌 Form ID received in Tsign via Parent Component:", this.formId);
    console.log("📧 Client Email received in TemplateCreator:", this.tsignEmail);

    this.prepopulateClientEmail();
    this.subscribeToMessageChannel();
    this._startupDone = true; //manendra commented for Tsigndata refresh
    this.loadDashboardCounts();
    this.loadDocumentTypes();
    this.loadTemplateDocumentType();
    this.loadCustomFields();


    // Click outside listener for dropdown
    this.templateClickOutsideHandler = this.handleClickOutside.bind(this);
    window.addEventListener("click", this.templateClickOutsideHandler);

    try {
      await this.loadPdfLibraries();
      console.log("✅ PDF.js and worker script loaded successfully");

      // ✅ Add a small delay to ensure libraries are fully loaded into window
      await this.sleep(300); // Wait for 300 milliseconds

      getTSignURL()
        .then((data) => {
          this.tsignUrl = data; // Store the URL from custom metadata
        })
        .catch((error) => {
          console.error("Error fetching TSign URL from metadata:", error);
        });

      if (this.tsignReurl) {
        console.log("📌 Detected AWS URL in Tsign:", this.tsignReurl);
        this.mode = "LMS";
        this.redirectservice(this.tsignReurl);
      }
    } catch (error) {
      console.error("Error loading PDF libraries:", error);
      this.handleError("Failed to load PDF libraries.", error);
    }
  }

  // 💤 Helper function to create a delay
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }


  redirectservice() {
    console.log("📌 Redirecting with TSign URL:", this.tsignReurl);

    if (this.tsignReurl) {
      //const urlParts = this.tsignReurl.split("/");
      // this.fileName = urlParts[urlParts.length - 1]; // Extract filename
      const cleanUrl = this.tsignReurl.split("?")[0];
      const urlParts = cleanUrl.split("/");
      this.fileName = decodeURIComponent(urlParts[urlParts.length - 1]); //manendra
      console.log("📌 Extracted Filename:", this.fileName);

      const fileExtension = this.fileName.split(".").pop().toLowerCase();

      if (fileExtension === "docx") {
        console.log("📌 Detected DOCX file. Converting to PDF...");
        this.fileType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        this.fetchDocxAndConvert(this.tsignReurl); // Fetch + Convert to PDF
      } else if (fileExtension === "pdf") {
        console.log("📌 Detected PDF file. Saving directly...");
        this.fileType = "application/pdf";
        this.awsUrl = this.tsignReurl;
        this.isFileUploaded = true;
        this.handleSaveAndUpload(); // ✅ Directly save
      } else {
        this.showToast("Error", "Unsupported file format received.", "error");
      }
    }

    this._windowResizeHandler = () => {
      this._guideDirty = true;
      this._positionGuide();
    };
    window.addEventListener("resize", this._windowResizeHandler);
  }

    fetchDocxAndConvert(url) {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        this.file = new File([blob], this.fileName, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
        this.convertWordToPdf();
      })
      .catch((error) => {
        console.error("❌ Failed to fetch DOCX file:", error);
        this.showToast("Error", "Unable to fetch and convert Word file.", "error");
      });
  }


  // subscribeToMessageChannel() {
  //   console.log("✅ Subscribing to LMS in Tsign LWC...");

  //   subscribe(this.context, TSIGN_MESSAGE_CHANNEL, (message) => {
  //     try {
  //       const awsUrl = message?.tsignreUrl;
  //       const legacyRecordId = message?.recordId; // old behavior
  //       const source = message?.source;           // "SERVICE" | "QUOTE" | "FORM"
  //       const serviceId = message?.serviceId || legacyRecordId || null;
  //       const quoteId = message?.quoteId || null;

  //       // ✅ Keep current validation: if awsUrl + recordId => proceed (legacy)
  //       // ✅ Extend validation: allow QUOTE with awsUrl + quoteId
  //       // ✅ Extend validation: allow FORM with awsUrl + recordId
  //       const isLegacyService = awsUrl && legacyRecordId;         // current behavior
  //       const isServiceFlow = awsUrl && serviceId;
  //       const isQuoteFlow = awsUrl && source === "QUOTE" && quoteId;
  //       const isFormFlow = awsUrl && source === "FORM" && legacyRecordId;

  //       if (!(isLegacyService || isServiceFlow || isQuoteFlow || isFormFlow)) {
  //         console.warn("⚠️ Missing data in LMS message:", message);
  //         return;
  //       }

  //       // ✅ Always store aws url (same as your existing logic)
  //       this.tsignReurl = awsUrl || this.tsignReurl;
  //       this.url = this.tsignReurl;

  //       this.mode = "LMS";

  //       // ✅ Preserve old functionality:
  //       // If message has awsUrl + recordId and no explicit QUOTE/FORM, treat as Service Agreement
  //       if (!source || source === "SERVICE") {
  //         this.serviceId = serviceId || this.serviceId;
  //         // do not force-clear quoteId/formId to avoid disturbing existing behavior
  //         console.log("📌 AWS URL received in Tsign:", this.tsignReurl);
  //         console.log("📌 Service Agreement ID received in Tsign:", this.serviceId);
  //         console.log("✅ Updated Service Agreement ID in Tsign:", this.serviceId);
  //         return;
  //       }

  //       // ✅ New flows (added functionality, doesn’t affect legacy)
  //       if (source === "QUOTE") {
  //         this.quoteId = quoteId || this.quoteId;
  //         console.log("📌 AWS URL received in Tsign:", this.tsignReurl);
  //         console.log("📌 Quote ID received in Tsign:", this.quoteId);
  //         return;
  //       }

  //       if (source === "FORM") {
  //         // recordId carries Dynamic_Form_Response__c id
  //         this.formId = legacyRecordId || this.formId;
  //         console.log("📌 AWS URL received in Tsign:", this.tsignReurl);
  //         console.log("📌 Form Response ID received in Tsign:", this.formId);
  //         return;
  //       }

  //     } catch (e) {
  //       console.error("❌ Error processing LMS message in Tsign:", e, message);
  //     }
  //   });
  // }

  subscribeToMessageChannel() {
    console.log("✅ Subscribing to LMS in Tsign LWC...");

    subscribe(this.context, TSIGN_MESSAGE_CHANNEL, (message) => {
      try {
        const awsUrl = message?.tsignreUrl;
        const legacyRecordId = message?.recordId; // old behavior
        const source = message?.source;           // "SERVICE" | "QUOTE" | "FORM"
        const serviceId = message?.serviceId || legacyRecordId || null;
        const quoteId = message?.quoteId || null;
        const hrId = message?.hrId || null;
        const attachmentId = message?.attachmentId || null;// manendra added for supportcoordinatorAttachments
        console.log('MANENDRA TEST ATTACHMENT =>', attachmentId);

        // ✅ Keep current validation: if awsUrl + recordId => proceed (legacy)
        // ✅ Extend validation: allow QUOTE with awsUrl + quoteId
        // ✅ Extend validation: allow FORM with awsUrl + recordId
        // ✅ Extend validation: allow HR with awsUrl + hrId
        const isLegacyService = awsUrl && legacyRecordId;         // current behavior
        const isServiceFlow = awsUrl && serviceId;
        const isQuoteFlow = awsUrl && source === "QUOTE" && quoteId;
        const isFormFlow = awsUrl && source === "FORM" && legacyRecordId;
        const isHrFlow = awsUrl && source === "HR" && hrId;
        const isAttachmentFlow = awsUrl && source === "ATTACHMENT" && attachmentId; // manendra added for supportcoordinatorAttachments 
        if (!(isLegacyService || isServiceFlow || isQuoteFlow || isFormFlow || isHrFlow || isAttachmentFlow)) {
          console.warn("⚠️ Missing data in LMS message:", message);
          return;
        }

        // ✅ Always store aws url (same as your existing logic)
        this.tsignReurl = awsUrl || this.tsignReurl;
        this.url = this.tsignReurl;

        this.mode = "LMS";

        // ✅ Preserve old functionality:
        // If message has awsUrl + recordId and no explicit QUOTE/FORM, treat as Service Agreement
        if (!source || source === "SERVICE") {
          this.serviceId = serviceId || this.serviceId;
          // do not force-clear quoteId/formId to avoid disturbing existing behavior
          console.log("📌 AWS URL received in Tsign:", this.tsignReurl);
          console.log("📌 Service Agreement ID received in Tsign:", this.serviceId);
          console.log("✅ Updated Service Agreement ID in Tsign:", this.serviceId);
          return;
        }

        // ✅ New flows (added functionality, doesn’t affect legacy)
        if (source === "QUOTE") {
          this.quoteId = quoteId || this.quoteId;
          console.log("📌 AWS URL received in Tsign:", this.tsignReurl);
          console.log("📌 Quote ID received in Tsign:", this.quoteId);
          return;
        }

        if (source === "FORM") {
          // recordId carries Dynamic_Form_Response__c id
          this.formId = legacyRecordId || this.formId;
          console.log("📌 AWS URL received in Tsign:", this.tsignReurl);
          console.log("📌 Form Response ID received in Tsign:", this.formId);
          return;
        }

        if (source === "HR") {
          this.hrId = hrId || legacyRecordId || this.hrId;
          console.log("📌 AWS URL received in Tsign:", this.tsignReurl);
          console.log("📌 Participant Template ID received in Tsign:", this.hrId);
          return;
        }

        if (source === "ATTACHMENT") {
          this.attachmentId = attachmentId;

          console.log(
            "Attachment ID received in Tsign:",
            this.attachmentId
          );

          console.log(
            " AWS URL received in Tsign:",
            this.tsignReurl
          );

          return;
        }

      } catch (e) {
        console.error("❌ Error processing LMS message in Tsign:", e, message);
      }
    });
  }


  async loadPdfLibraries() {
    try {
      await loadScript(this, pdfjsLib);
      await loadScript(this, pdfWorker);

      window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

      // Load Mammoth.js dynamically
      if (!mammothJs) {
        throw new Error("Mammoth.js is not available.");
      }
      await loadScript(this, mammothJs);
      console.log("Mammoth.js loaded successfully.");
      console.log("Mammoth.js:", mammothJs);
      await loadScript(this, jsPDF);
      await loadScript(this, html2canvasLib);
      console.log("jsPDF and html2canvas libraries loaded successfully.");
    } catch (error) {
      throw new Error("Error while loading libraries: " + error.message);
    }
  }


  handleFileUploadSuccess() {
    this.isFileAttached = true;
    // other logic to handle successful file upload
  }

  handleFileNameChange(event) {
    this.fileName = event.target.value;
  }

  // Name saved to File_Name__c: "_" and "-" become spaces, extension is kept.
  // e.g. "cert_merged_pdf_f1e78d01.pdf" -> "cert merged pdf f1e78d01.pdf"
  getCleanFileName(name) {
    if (!name) return name;
    const dotIndex = name.lastIndexOf(".");
    const base = dotIndex > 0 ? name.substring(0, dotIndex) : name;
    const ext = dotIndex > 0 ? name.substring(dotIndex) : "";
    const cleanBase = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return (cleanBase || base) + ext;
  }

  handlefilecancel(event) {
    console.log('child called');
    console.log('Cancel event received:', event.detail.message);
    this.fileuploaded = false;
  }

  _perfStart(label) {
    const n = performance.now();
    this._perf = { t0: n, last: n, rows: [] };
    this._perfMark(label);
  }

  _perfMark(label) {
    if (!this._perf) return;
    const n = performance.now();
    this._perf.rows.push({
      label,
      step: Math.round(n - this._perf.last),
      total: Math.round(n - this._perf.t0)
    });
    this._perf.last = n;
  }

  _perfEnd(label) {
    if (!this._perf) return;
    this._perfMark(label);
    if (TIMING_LOG) {
      console.log(
        '[TIMING] UPLOAD → DISPLAY\n' +
        this._perf.rows
          .map(r => `${r.label.padEnd(48)} +${String(r.step).padStart(6)} ms   (total ${r.total} ms)`)
          .join('\n')
      );
    }
    this._perf = null;
  }

  _trace(msg) {
    if (UPLOAD_TRACE) console.log(`[UPLOAD-TRACE] ${msg}`);
  }

  _fmtBytes(n) {
    if (n === null || n === undefined || isNaN(n)) return '0 B';
    const bytes = Number(n);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  //ACCEPTS PDF AND WORD
  //ACCEPTS PDF AND WORD
  @track fileuploaded = false;
  @track isFileExpand1 = false;

    _pendingFile = null;
  _pendingUploadIsWord = false;

  get showUploader() {
    return this.isFileExpand && !!this.orgid;
  }

  async onFileUpload(event) {
    this.activeRecipientKey = null;
    this.isattachError = false;

    this.tsignReurl = "";
    this.serviceId = "";
    this.quoteId = null;
    this.source = null;

    this.mode = "DEFAULT";

    if (this.fileuploaded) {
      this.showToast("Error", "Only one file can be uploaded at a time.", "error");
      event.target.value = null;
      return;
    }

    if (event.target.files.length > 0) {
      this.showSpinner = true;
      this.selectedFilesToUpload = event.target.files;
      this.file = this.selectedFilesToUpload[0];
      this.fileName = this.file.name.replace(/\s+/g, "");
      this.fileType = this.file.type;
      this.fileSize = this.file.size;

      let MAX_PDF_SIZE = 20 * 1024 * 1024;
      let MAX_DOC_SIZE = 20 * 1024 * 1024;

      const isPdf = this.fileType === "application/pdf";
      const isWord =
        this.fileType === "application/msword" ||
        this.fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!isPdf && !isWord) {
        this.showToast("Error", "Only PDF and Word files are allowed.", "error");
        this.showSpinner = false;
        this.isLoading = false;
        event.target.value = null;
        return;
      }

      if ((isPdf && this.fileSize > MAX_PDF_SIZE) || (isWord && this.fileSize > MAX_DOC_SIZE)) {
        this.showToast("Error", "File size must be 20MB or smaller.", "error");
        this.showSpinner = false;
        this.isLoading = false;
        event.target.value = null;
        return;
      }

      this._trace(`File picked: name="${this.fileName}", type="${this.fileType}", size=${this._fmtBytes(this.fileSize)}, isPdf=${isPdf}, isWord=${isWord}, convertFlag=${isWord}`);
      this._perfStart('File picked');

      console.log(isPdf ? "📌 Uploading PDF:" : "📌 Uploading Word (convert):", this.fileName);

      this.isLoading = true;
      this.fileuploaded = true;
      this._sendToBatchUploader(this.file, isWord);
    }

    this.showSpinner = false;
    event.target.value = null;
  }

  // Fires when the child has loaded its config; start the upload now
  handleUploaderReady() {
    this._trace(`handleUploaderReady: child config loaded, pendingFile=${!!this._pendingFile}`);
    this._perfMark('Uploader ready (configload)');

    if (!this._pendingFile) return;

    const selector = this.useDocApi ? "c-t-sign-doc-uploader" : "c-t-signaws-batch-lwc";
    const svc = this.template.querySelector(selector);
    if (!svc) return;

    const file = this._pendingFile;
    this._pendingFile = null;

    svc.convert = this._pendingUploadIsWord;   // PDF → false, Word → true
    svc.uploadFilesFromParent([file]);
  }

  handleUploaderConfigError(event) {
    const msg = event?.detail || "Upload configuration failed.";
    console.error("[DOC-API] Config error:", msg);
    this.showToast("Error", msg, "error");
    this._resetUploadPendingState();
  }

  handleUploaderError(event) {
    const msg = event?.detail || "File upload failed.";
    console.error("[DOC-API] Upload error:", msg);
    this.showToast("Error", msg, "error");
    this._resetUploadPendingState();
  }

  _resetUploadPendingState() {
    this.isLoading = false;
    this.showSpinner = false;
    this.fileuploaded = false;
    this.isFileExpand = false;
    this._pendingFile = null;
    this._pendingUploadIsWord = false;
  }

  @track uploadedFiles = [];
  handleFileUploadInputChange(event) {
    console.log('handleFileUploadInputChange called ');

    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setTimeout(() => {
      this.isFileExpand = true;
      setTimeout(() => {
        this._perfMark('Waited in setTimeout(1000)');
        const svc = this.template.querySelector('c-document-office-service');
        if (!svc) {
          console.warn('⚠️ No <c-document-office-service> component found.');
          return;
        }
        svc.incomingFiles = files;
        svc.modulePathFromParent = "ticket";
        svc.confirmUpload = true;   // auto-start upload in templateCreator only
      }, 1000);
    }, 0);

  }

  _savingInProgress = false;

  // tracks what flow is currently active
  // "AWS_UPLOAD" | "WORD_CONVERT" | null
  _activeFlow = null;

  // protects against duplicate converter events
  _wordConversionHandled = false;


  handleAwsUploadComplete(evt) {
    try {
      // ✅ If Word→PDF flow is active, ignore AWS uploadcomplete to prevent double record creation
      if (this._activeFlow === "WORD_CONVERT") {
        console.warn("⛔ Ignoring AWS Upload Complete because WORD_CONVERT flow is active.");
        return;
      }

      // ✅ Mark this as the active flow (does not change existing behavior)
      this._activeFlow = "AWS_UPLOAD";
      this._perfMark('Upload done (base64 + MD5 + /upload-chunks)');

      console.group('[AWS Upload Complete]');
      console.log('Raw event detail:', evt?.detail);

      const { recordId, files = [] } = evt.detail || {};
      console.log('recordId:', recordId);
      console.log('files count:', files.length, 'files:', files);

      if (!files.length) {
        console.warn('No uploaded files in payload; aborting.');
        console.groupEnd();
        return;
      }

      this.uploadedFiles = files;
      this.isFileExpand = false;
      this.fileuploaded = false;

      const file = files[0];

      // ✅ Normalize URL
      let resolvedUrl = "";
      if (typeof file?.url === "string") {
        resolvedUrl = file.url;
      } else if (typeof file?.url?.pdfUrl === "string") {
        resolvedUrl = file.url.pdfUrl;
      } else if (typeof file?.pdfUrl === "string") {
        resolvedUrl = file.pdfUrl;
      }

      // ✅ Normalize key
      let resolvedKey =
        file?.key ||
        file?.url?.pdfKey ||
        file?.pdfKey ||
        null;

      this.fileName = file?.originalName || this.fileName;
      this.url = resolvedUrl;
      this.key = resolvedKey;

      console.log("✅ Resolved URL:", this.url);
      console.log("✅ Resolved KEY:", this.key);

      if (!this.url || typeof this.url !== "string") {
        this.showToast("Error", "Uploaded file URL is invalid.", "error");
        console.groupEnd();
        return;
      }

      this.handleSaveAndUpload();
      this.isFileAttached = true;

      console.log(' Files in last  : ', files);
      console.log(' this.uploadedFiles  : ', JSON.stringify(this.uploadedFiles));
      console.groupEnd();
    } catch (e) {
      console.error('[AWS Upload Complete] handler error:', e);
    }
  }

    convertToPdf = false;
  _uploaderReady = false;
  _pendingUploadIsWord = false;

  handleUploaderConfigLoad() {
    this._uploaderReady = true;
  }

  _resetUploadState() {
    this.showSpinner = false;
    this.isLoading = false;
    this.fileuploaded = false;
    this._pendingUploadIsWord = false;
    this._wordConversionHandled = false;
    this._activeFlow = null;
  }

  // Single entry point to the batch uploader for PDF and Word
  // Store the file and show the child; the upload starts in handleUploaderReady
  _sendToBatchUploader(file, isWord) {
    this._trace(`_sendToBatchUploader: uploader requested, isWord=${isWord}, setting isFileExpand=true`);
    this._pendingFile = file;
    this._pendingUploadIsWord = isWord;
    this.isFileExpand = true;
    return true;
  }
    convertWordToPdf() {
    this._activeFlow = "WORD_CONVERT";
    this._wordConversionHandled = false;
    this.showSpinner = true;

    if (!this._sendToBatchUploader(this.file, true)) {
      this._activeFlow = null;
    }
  }
   _pendingUploadIsWord = false;

   handleBatchUploadSuccess(event) {
    if (this._perf && Array.isArray(event.detail?.timings)) {
      event.detail.timings.forEach((t) => {
        const prevTotal = this._perf.rows.length > 0 ? this._perf.rows[this._perf.rows.length - 1].total : 0;
        const newTotal = prevTotal + t.ms;
        this._perf.rows.push({
          label: t.label,
          step: t.ms,
          total: newTotal
        });
      });
      this._perf.last = performance.now();
    } else {
      this._perfMark('Upload done (child)');
    }

    const file = event.detail?.files?.[0];
    let convertInfo = 'none';
    if (file?.convertWithJson) {
      try {
        const parsed = JSON.parse(file.convertWithJson);
        convertInfo = `pdfKey="${parsed.pdfKey}", pdfFullUrl="${parsed.pdfFullUrl}", endpoint="${parsed.endpoint}"`;
      } catch (e) {
        convertInfo = `raw="${file.convertWithJson}"`;
      }
    }
    const nextAction = this._pendingUploadIsWord ? 'handleSaveAndUploadForConvertedWord' : 'handleSaveAndUpload';
    this._trace(`Batch upload success: status="${file?.status}", key="${file?.key}", url="${file?.url}", sourceKey="${file?.sourceKey}", sourceUrl="${file?.sourceUrl}", convertWithJson=${!!file?.convertWithJson} (${convertInfo}), nextAction="${nextAction}"`);

    this.fileuploaded = false;
    this.isFileExpand = false;

    if (!file || file.status !== "ok" || !file.url) {
      this.showToast("Error", "File upload failed.", "error");
      this.isLoading = false;
      this._pendingUploadIsWord = false;
      return;
    }

    this.uploadedFiles = event.detail.files;
    this.url = file.url;
    this.key = file.key || null;
    this.sourceKey = file.sourceKey || null;   // original .docx (used by deleteFile)

    if (this.useDocApi) {
      this._serverPages = file.pages || [];
      this._serverPagesExpiresAt = file.expiresAt || null;
    }

    if (this._pendingUploadIsWord) {
      this._pendingUploadIsWord = false;

      // Word must come back as a PDF; never pass a .docx to pdf.js
      if (!/\.pdf(\?|$)/i.test(file.url)) {
        this._trace(`Word upload NOT converted: url="${file.url}", convertWithJson=${!!file.convertWithJson}`);
        this.showToast("Error", "Word file was uploaded but not converted to PDF.", "error");
        this.isLoading = false;
        return;
      }

      const pdfFilename = this.fileName.replace(/\.[^/.]+$/, ".pdf");
      this.handleSaveAndUploadForConvertedWord(file.url, pdfFilename);
    } else {
      this.handleSaveAndUpload();
    }
  }
  handleBatchUploadDelete() {
    this.uploadedFiles = [];
    this.url = null;
    this.key = null;
    this.fileuploaded = false;
    this.isFileExpand = false;
    this.isLoading = false;
    this._pendingFile = null;
    this._pendingUploadIsWord = false;
    this._renderedPages = new Set();
    this._renderingPages = new Set();
  }

  handleSaveAndUploadForConvertedWord(pdfUrl, pdfFilename) {
    // ✅ Prevent duplicate record creation across multiple async callbacks
    if (this._savingInProgress) {
      console.warn("⛔ Save already in progress, skipping handleSaveAndUploadForConvertedWord.");
      return;
    }
    this._savingInProgress = true;

    if (!pdfFilename || !pdfUrl) {
      this.showToast("Error", "PDF filename or URL is missing.", "error");
      console.error("❌ Missing Data:", { pdfFilename, pdfUrl });

      // release lock for retry
      this._savingInProgress = false;
      return;
    }

    this.isLoading = true;

    const picklistValue = this.getPicklistValue();

    // ✅ Resolve IDs safely (won’t affect existing functionality)
    const resolvedQuoteId = this.source === "QUOTE" ? (this.quoteId || null) : null;
    const resolvedFormId = this.source === "FORM" ? (this.formId || "") : "";
    const resolvedServiceId = this.source === "SERVICE" ? (this.serviceId || "") : "";
    const resolvedAttachmentId = this.source === "ATTACHMENT" ? (this.attachmentId || "") : ""; // manendra added for supportcoordinatorAttachments

    console.log("📌 Creating Offer_Template__c with PDF Filename:", pdfFilename, {
      picklistValue,
      source: this.source,
      quoteId: resolvedQuoteId,
      formId: resolvedFormId,
      serviceId: resolvedServiceId,
      attachmentId: resolvedAttachmentId, // manendra added for supportcoordinatorAttachments

    });

    console.log("📌 Facility Id for Offer_Template__c (converted Word):", localStorage.getItem("defaultFacilityId"));

    const cleanPdfName = this.getCleanFileName(pdfFilename);
    this._trace(`handleSaveAndUploadForConvertedWord: calling createOfferTemplate with fileName="${cleanPdfName}"`);

    // ✅ Create Offer_Template__c record with extracted PDF filename
    createOfferTemplate({
      fileName: cleanPdfName,
      picklistValue: picklistValue,
      orgId: this.orgid,

      serviceId: resolvedServiceId,
      quoteId: resolvedQuoteId,
      formId: resolvedFormId,
      attachmentId: resolvedAttachmentId, // manendra added for supportcoordinatorAttachments


      // ✅ Optional: if your Apex expects url, include it (safe)
      url: pdfUrl,
      documentTypeId: this.selectedDocumentTypeId || null,
      facilityId: localStorage.getItem("defaultFacilityId") || null
    })
      .then((recordId) => {
        this.recordId = recordId;
        console.log("📌 Record created for converted Word file. ID:", recordId);
        this._trace(`handleSaveAndUploadForConvertedWord: createOfferTemplate resolved recordId="${recordId}"`);
        this._perfMark('Apex createOfferTemplate');

        this._trace(`handleSaveAndUploadForConvertedWord: AWS URL saved directly via createOfferTemplate (skipped updateRecordWithAWSUrl & retrieveFileUrl): "${pdfUrl}"`);
        return pdfUrl;
      })
      .then((urlToRender) => {
        console.log("🧩 Converted DOCX flow urlToRender:", urlToRender);
        this._trace(`handleSaveAndUploadForConvertedWord: passing URL to loadPdf: "${urlToRender}"`);

        if (urlToRender) {
          this.awsUrl = urlToRender;
          console.log("📄 Calling loadTemplatePages() for converted DOCX PDF...");
          return this.loadTemplatePages(urlToRender);
        }

        console.warn("⚠️ No PDF URL to render.");
        return null;
      })
      .then(() => {
        this.isFileUploaded = true;
        this.isTemplateUploadChoiceModal = false;
        this.isFileExpand = false;
        this.isFileExpand1 = false;
        this.showToast("Success", "Document Uploaded successfully.", "success");
      })
      .catch((error) => {
        console.error("❌ Error in handleSaveAndUploadForConvertedWord:", error);
        this.showToast("Error", "Failed to create/update record.", "error");
      })
      .finally(() => {
        this.isLoading = false;

        // ✅ release lock + clear flow marker after save completes
        this._savingInProgress = false;
        if (this._activeFlow === "WORD_CONVERT") {
          this._activeFlow = null;
        }
      });
  }

  @api isFileUploaded = false;

  handleSaveAndUpload() {
    // ✅ Prevent duplicate record creation if multiple handlers call save
    if (this._savingInProgress) {
      console.warn("⛔ Save already in progress, skipping handleSaveAndUpload.");
      return;
    }
    this._savingInProgress = true;

    console.log("🟦 START handleSaveAndUpload");

    if (!this.fileName) {
      console.warn("🟨 handleSaveAndUpload: Missing fileName");
      this.showToast("Error", "Please provide a file name and select a file.", "error");

      // ✅ release lock for retry
      this._savingInProgress = false;
      return;
    }

    const finalUrl = this.url || this.tsignReurl || "";
    this.isLoading = true;

    console.log("🟦 handleSaveAndUpload inputs:", {
      fileName: this.fileName,
      tsignReurl: this.tsignReurl,
      url: this.url,
      finalUrl,
      source: this.source,
      serviceId: this.serviceId,
      quoteId: this.quoteId,
      formId: this.formId,
      hrId: this.hrId,
      attachmentId: this.attachmentId // manendra added for supportcoordinatorAttachments
    });

    const picklistValue = this.getPicklistValue();

    const resolvedServiceId = this.source === "SERVICE" ? (this.serviceId || "") : "";
    const resolvedQuoteId = this.source === "QUOTE" ? (this.quoteId || null) : null;
    const resolvedFormId = this.source === "FORM" ? (this.formId || "") : "";
    const resolvedHrId = this.source === "HR" ? (this.hrId || "") : "";
    const resolvedAttachmentId = this.source === "ATTACHMENT" ? (this.attachmentId || "") : ""; // manendra added for supportcoordinatorAttachments

    console.log("🟦 handleSaveAndUpload resolved values:", {
      picklistValue,
      resolvedServiceId,
      resolvedQuoteId,
      resolvedFormId,
      resolvedHrId,
      resolvedAttachmentId // manendra added for supportcoordinatorAttachments
    });

    console.log("📌 Facility Id for Offer_Template__c (handleSaveAndUpload):", localStorage.getItem("defaultFacilityId"));

    const cleanFileName = this.getCleanFileName(this.fileName);
    this._trace(`handleSaveAndUpload: calling createOfferTemplate with fileName="${cleanFileName}"`);

    createOfferTemplate({
      fileName: cleanFileName,
      picklistValue,
      orgId: this.orgid,
      serviceId: resolvedServiceId,
      quoteId: resolvedQuoteId,
      url: finalUrl,
      formId: resolvedFormId,
      hrId: resolvedHrId,
      attachmentId: resolvedAttachmentId, // manendra added for supportcoordinatorAttachments
      facilityId: localStorage.getItem("defaultFacilityId") || null
    })
      .then((recordId) => {
        this.recordId = recordId;
        console.log("🟩 handleSaveAndUpload record created:", recordId);
        this._trace(`handleSaveAndUpload: createOfferTemplate resolved recordId="${recordId}"`);
        this._perfMark('Apex createOfferTemplate');

        if (finalUrl) {
          this._trace(`handleSaveAndUpload: AWS URL saved directly via createOfferTemplate (skipped updateRecordWithAWSUrl): "${finalUrl}"`);
          return finalUrl;
        }

        console.log("🟦 handleSaveAndUpload no URL, calling retrieveFileUrl()");
        return this.retrieveFileUrl();
      })
      .then((urlToRender) => {
        console.log("🟦 handleSaveAndUpload urlToRender:", urlToRender);
        this._trace(`handleSaveAndUpload: passing URL to loadTemplatePages: "${urlToRender}"`);

        if (urlToRender) {
          this.awsUrl = urlToRender;
          return this.loadTemplatePages(urlToRender);
        }
        return null;
      })
      .then(() => {
        console.log("🟩 handleSaveAndUpload completed successfully");
        this.isFileUploaded = true;
        this.isTemplateUploadChoiceModal = false;
        this.isFileExpand = false;
        this.isFileExpand1 = false;
        console.log("🟦 isFileUploaded:", this.isFileUploaded);
        this.showToast("Success", "Document Uploaded successfully.", "success");
      })
      .catch((error) => {
        console.error("❌ handleSaveAndUpload error:", error);
        this.showToast("Error", "Failed to upload/update record.", "error");
      })
      .finally(() => {
        console.log("🟦 isFileUploaded:", this.isFileUploaded);
        console.log("🟦 END handleSaveAndUpload");
        this.isLoading = false;
        this.showSpinner = false;

        // ✅ release lock + clear flow marker after save completes
        this._savingInProgress = false;
        if (this._activeFlow === "AWS_UPLOAD") {
          this._activeFlow = null;
        }
      });
  }

  loadTemplatePages(url) {
    if (!this._perf) {
      this._perfStart('Template opened');
    }

    if (this.useDocApi && this._serverPages && this._serverPages.length > 0) {
      this._trace(`loadTemplatePages: using ${this._serverPages.length} server-rendered pages`);
      return this.loadServerPages(this._serverPages);
    }

    if (this.useDocApi) {
      this._trace(`loadTemplatePages: fetching server pages for reopen: "${url}"`);
      this.showSpinner = true;
      this.isLoading = true;
      return getDocPages({ keyOrUrl: url })
        .then((res) => {
          this._perfMark('Apex getPages (reopen)');
          let pages = null;
          if (res?.pages) {
            pages = res.pages;
          } else if (res && !res.error && res.body) {
            const data = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
            const item = data.results?.[0];
            pages = item?.pages || data.pages;
          }
          if (pages && pages.length > 0) {
            this._serverPages = pages;
            return this.loadServerPages(pages);
          }
          this._perfMark('pdf.js fallback used');
          return this.loadPdf(url);
        })
        .catch((err) => {
          this._trace(`getDocPages reopen error: ${err?.message}`);
          this._perfMark('pdf.js fallback used');
          return this.loadPdf(url);
        });
    }

    this._perfMark('pdf.js fallback used');
    this._trace(`loadTemplatePages: falling back to pdf.js loadPdf`);
    return this.loadPdf(url);
  }

  loadServerPages(pages) {
    this._usingServerPages = true;
    this._trace(`loadServerPages: rendering ${pages.length} pages from server images`);
    this.zoomLevel = 1;
    this._hasGeneratedThumbnails = true;
    this._isGeneratingThumbnails = false;
    this.pdfDoc = null;
    this._pdfBytes = null;
    this._rawPdfBytes = null;

    this.numPages = pages.length;
    this.totalPages = pages.length;
    this.pageCount = pages.length;
    this.isPdfLoaded = true;

    this._pageDimensionsCache = new Map();
    this.pageHeights = {};

    const thumbMap = {};
    pages.forEach((p) => {
      const pageNum = Number(p.pageNumber || p.page) || 1;
      const w = Number(p.widthPt || p.width) || 612;
      const h = Number(p.heightPt || p.height) || 792;
      const ptObj = { w, h, widthPt: w, heightPt: h, aspectRatio: w / h };
      this._pageDimensionsCache.set(pageNum, ptObj);
      thumbMap[pageNum] = p.thumbUrl || p.thumbnailUrl || p.imageUrl;
      if (pageNum === 1) {
        this._pagePt = ptObj;
      }
    });
    this.thumbnailSrcByPage = thumbMap;

    this.pagesData = pages.map((p) => {
      const pageNum = Number(p.pageNumber || p.page) || 1;
      const w = Number(p.widthPt || p.width) || 612;
      const h = Number(p.heightPt || p.height) || 792;
      const height = Math.round(1024 * (h / w));
      const containerStyle = `width: 1024px; height: ${height}px; min-height: ${height}px;`;
      return {
        pageNumber: pageNum,
        imageSrc: p.imageUrl,
        imageUrl: p.imageUrl,
        containerStyle,
        baseWidth: 1024,
        baseHeight: height,
        height,
        widthPt: w,
        heightPt: h,
        loaded: false
      };
    });

    if (pages.length > 0) {
      this.imageSrc = pages[0].imageUrl;
    }

    this.pageNumber = 1;
    this.currentPage = 1;
    this.isLoading = false;
    this.showSpinner = false;

    // Reset settlement tracking for timing
    this._pageImagesSettled = new Map();
    this._thumbImagesSettled = new Map();
    this._hasLoggedPage1 = false;
    this._hasLoggedAllPages = false;
    this._hasLoggedAllThumbs = false;

    if (this._perfTimeoutId) {
      clearTimeout(this._perfTimeoutId);
    }
    this._perfTimeoutId = setTimeout(() => {
      this._settlePerf('timeout');
    }, 60000);

    this._perfMark('Pages data built (loadServerPages)');
    return Promise.resolve().then(() => {
      if (typeof this.renderedCallback === "function") {
        this.renderedCallback();
      }
      if (typeof this.detectSignatures === "function") {
        this.detectSignatures();
      }
    });
  }

  handlePageImageLoad(event) {
    const pageNum = Number(event?.target?.dataset?.page || event?.target?.dataset?.pageNumber) || 1;
    if (!this._hasLoggedPage1 && pageNum === 1) {
      this._hasLoggedPage1 = true;
      this._perfMark('Page 1 image loaded');
    }
    this._pageImagesSettled.set(pageNum, 'ok');
    this._checkImagesSettled();
  }

  handlePageImageError(event) {
    const pageNum = Number(event?.target?.dataset?.page || event?.target?.dataset?.pageNumber) || 1;
    this._trace(`Image load error for page ${pageNum}. Retrying with fresh URL or falling back to pdf.js`);
    this._pageImagesSettled.set(pageNum, 'failed');
    this._checkImagesSettled();

    const keyOrUrl = this.sourceKey || this.savedFileUrl || this.awsUrl;
    if (!this._refreshingPages && keyOrUrl) {
      this._refreshingPages = true;
      getDocPages({ keyOrUrl })
        .then((res) => {
          let pages = null;
          if (res?.pages) {
            pages = res.pages;
          } else if (res && !res.error && res.body) {
            const data = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
            const item = data.results?.[0];
            pages = item?.pages || data.pages;
          }
          if (pages && pages.length > 0) {
            this._serverPages = pages;
            return this.loadServerPages(pages);
          }
          this._perfMark('pdf.js fallback used');
          return this.loadPdf(this.savedFileUrl || this.awsUrl);
        })
        .catch(() => {
          this._perfMark('pdf.js fallback used');
          this.loadPdf(this.savedFileUrl || this.awsUrl);
        })
        .finally(() => {
          this._refreshingPages = false;
        });
    } else {
      this._perfMark('pdf.js fallback used');
      this.loadPdf(this.savedFileUrl || this.awsUrl);
    }
  }

  handleThumbnailImageLoad(event) {
    const pageNum = Number(event?.target?.dataset?.page || event?.target?.dataset?.pageNumber) || 1;
    this._thumbImagesSettled.set(pageNum, 'ok');
    this._checkImagesSettled();
  }

  handleThumbnailImageError(event) {
    const pageNum = Number(event?.target?.dataset?.page || event?.target?.dataset?.pageNumber) || 1;
    this._trace(`Thumbnail load error for page ${pageNum}. Retrying refresh...`);
    this._thumbImagesSettled.set(pageNum, 'failed');
    this._checkImagesSettled();
    this.handlePageImageError(event);
  }

  _checkImagesSettled() {
    const total = Number(this.totalPages) || this.pagesData?.length || 0;
    if (total === 0) return;

    if (!this._hasLoggedAllPages && this._pageImagesSettled.size >= total) {
      this._hasLoggedAllPages = true;
      let okCount = 0;
      let failCount = 0;
      this._pageImagesSettled.forEach((status) => {
        if (status === 'ok') okCount++;
        else failCount++;
      });
      this._perfMark(`All page images loaded (${total}: ok=${okCount}, failed=${failCount})`);
    }

    if (!this._hasLoggedAllThumbs && this._thumbImagesSettled.size >= total) {
      this._hasLoggedAllThumbs = true;
      let okCount = 0;
      let failCount = 0;
      this._thumbImagesSettled.forEach((status) => {
        if (status === 'ok') okCount++;
        else failCount++;
      });
      this._perfMark(`All thumbnails loaded (${total}: ok=${okCount}, failed=${failCount})`);
    }

    if (this._hasLoggedAllPages && this._hasLoggedAllThumbs) {
      this._settlePerf('Done');
    }
  }

  _settlePerf(label) {
    if (this._perfTimeoutId) {
      clearTimeout(this._perfTimeoutId);
      this._perfTimeoutId = null;
    }
    if (!this._perf) return;

    const total = Number(this.totalPages) || this.pagesData?.length || 0;

    if (!this._hasLoggedAllPages && total > 0) {
      this._hasLoggedAllPages = true;
      let okCount = 0;
      let failCount = 0;
      this._pageImagesSettled.forEach((status) => {
        if (status === 'ok') okCount++;
        else failCount++;
      });
      const deferred = Math.max(0, total - (okCount + failCount));
      this._perfMark(
        `All page images loaded (${total}: ok=${okCount}, failed=${failCount}${deferred > 0 ? `, deferred=${deferred}` : ''})`
      );
    }

    if (!this._hasLoggedAllThumbs && total > 0) {
      this._hasLoggedAllThumbs = true;
      let okCount = 0;
      let failCount = 0;
      this._thumbImagesSettled.forEach((status) => {
        if (status === 'ok') okCount++;
        else failCount++;
      });
      const deferred = Math.max(0, total - (okCount + failCount));
      this._perfMark(
        `All thumbnails loaded (${total}: ok=${okCount}, failed=${failCount}${deferred > 0 ? `, deferred=${deferred}` : ''})`
      );
    }

    this._perfEnd(label);
  }

  async loadPdf(url) {
    this._usingServerPages = false;
    console.group("📄 [loadPdf]");
    console.log("➡️ called with url:", url);
    this._trace(`loadPdf called with URL="${url}"`);
    this.zoomLevel = 1;
    this._thumbGenId = (this._thumbGenId || 0) + 1;
    this.thumbnailSrcByPage = {};
    this._hasGeneratedThumbnails = false;
    this._lastThumbSyncedPage = null;
    this._isGeneratingThumbnails = false;

    try {
      if (!url || typeof url !== "string") {
        console.error("❌ Invalid URL passed to loadPdf:", url);
        this.handleError("Failed to load PDF. Invalid URL.", new Error("Invalid URL"));
        console.groupEnd();
        return;
      }

      if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
        console.error("❌ pdfjsLib is not available on window:", window.pdfjsLib);
        this.handleError("Failed to load PDF. pdfjsLib missing.", new Error("pdfjsLib missing"));
        console.groupEnd();
        return;
      }

      if (UPLOAD_TRACE) {
        try {
          const probe = await fetch(url, { method: 'GET', cache: 'no-store' });
          const probeLength = probe.headers.get('content-length');
          this._trace(`PDF pre-flight fetch: status=${probe.status} ${probe.statusText}, content-type="${probe.headers.get('content-type')}", content-length=${this._fmtBytes(probeLength)}`);
          if (!probe.ok) {
            const txt = await probe.text();
            const code = txt.match(/<Code>(.*?)<\/Code>/i)?.[1] || 'unknown';
            const msg = txt.match(/<Message>(.*?)<\/Message>/i)?.[1] || 'unknown';
            this._trace(`PDF pre-flight S3 Error: S3 Code=${code} Message=${msg}`);
          }
          this._perfMark('PDF pre-flight fetch');
        } catch (e) {
          this._trace(`PDF pre-flight fetch error: ${e.message}`);
        }
      }

      this.showSpinner = true;
      this.isLoading = true;

      console.log("📌 Starting pdfjsLib.getDocument...");
      const loadingTask = window.pdfjsLib.getDocument(url);

      // Helpful hooks if pdf.js exposes these
      if (loadingTask?.onProgress) {
        loadingTask.onProgress = (p) => {
          console.log("⏳ PDF load progress:", p);
        };
      }

      this.pdfDoc = await loadingTask.promise;
      console.log("✅ PDF loaded. pdfDoc:", this.pdfDoc);
      this._trace(`PDF loaded. Total pages: ${this.pdfDoc.numPages}`);

      try {
        const data = await this.pdfDoc.getData();
        this._trace(`PDF byte size: ${this._fmtBytes(data.length)}`);
      } catch (e) {
        this._trace(`PDF getData() unavailable: ${e.message}`);
      }

      try {
        const meta = await this.pdfDoc.getMetadata();
        const info = meta?.info || {};
        this._trace(`PDF metadata: Title="${info.Title || 'none'}", Producer="${info.Producer || 'none'}", PDFFormatVersion="${info.PDFFormatVersion || 'none'}"`);
      } catch (e) {
        this._trace(`PDF getMetadata() unavailable: ${e.message}`);
      }

      this._perfMark('pdf.js getDocument');

      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;

      console.log("📌 totalPages:", this.totalPages, "| currentPage:", this.currentPage);
      console.log("📌 Rendering all pages via PDF.js pipeline...");
      await this.renderAllPages();
      if (this.isThumbnailPanelOpen) {
        this.generateThumbnailsAsync();
      }

      const totalDataUrlBytes = (this.pagesData || []).reduce((acc, p) => acc + (p.imageSrc ? p.imageSrc.length : 0), 0);
      const renderedCount = (this.pagesData || []).filter(p => p.isRendered !== false).length;
      this._trace(`Pages initialized: ${this.pagesData?.length || 0} (initial rendered: ${renderedCount} of ${this.totalPages}), total dataUrl size=${this._fmtBytes(totalDataUrlBytes)}`);
      this._perfMark(`All page images loaded (${this.totalPages}: ok=${renderedCount}, failed=0)`);
      this._perfEnd('Done');

      console.log("✅ loadPdf completed. pagesData length:", this.pagesData ? this.pagesData.length : 0);
      console.groupEnd();
    } catch (error) {
      console.error("❌ loadPdf error:", error);
      this._trace(`loadPdf failed: name="${error?.name}", message="${error?.message}", status=${error?.status || 'none'}, url="${url}"`);
      this.handleError("Failed to load PDF.", error);
      console.groupEnd();
    } finally {
      // ensure spinners stop even if render throws
      this.showSpinner = false;
      this.isLoading = false;
    }
  }

  async renderPageAsImage(pageNumber) {
    console.group(`🖼️ [renderPageAsImage] page=${pageNumber}`);
    try {
      if (!this.pdfDoc) {
        console.error("❌ pdfDoc is null/undefined. loadPdf may have failed.");
        throw new Error("pdfDoc is not initialized");
      }

      console.log("📌 Getting page:", pageNumber);
      const page = await this.pdfDoc.getPage(pageNumber);
      console.log("✅ Got page object:", page);

      const vp1 = page.getViewport({ scale: 1 });
      this._pagePt = { w: vp1.width, h: vp1.height };
      if (!this._pageDimensionsCache) {
        this._pageDimensionsCache = new Map();
      }
      this._pageDimensionsCache.set(pageNumber, this._pagePt);
      console.log("📌 Page size (pt):", this._pagePt);
      this._trace(`Page ${pageNumber}: size=${vp1.width}x${vp1.height} pt, rotation=${vp1.rotation}`);

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const viewport = page.getViewport({ scale: 2.0 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      console.log("�� Canvas size:", { w: canvas.width, h: canvas.height });
      this._trace(`Page ${pageNumber}: canvas=${canvas.width}x${canvas.height} px, scale=2.0`);
      console.log("📌 Rendering page to canvas...");
      const renderTask = page.render({ canvasContext: context, viewport });

      if (renderTask?.onContinue) {
        console.log("ℹ️ renderTask has onContinue");
      }

      await renderTask.promise;
      this._perfMark(`Page ${pageNumber}: render`);
      console.log("✅ Page rendered to canvas.");

      console.log("📌 Converting canvas to dataURL...");
      const dataUrl = canvas.toDataURL("image/png");
      this._trace(`Page ${pageNumber}: dataUrl length=${this._fmtBytes(dataUrl.length)}`);
      this._perfMark(`Page ${pageNumber}: encode`);
      console.log("✅ dataUrl generated. length:", dataUrl.length);

      console.log("📌 Preloading image to validate dataUrl...");
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log("✅ Image preload success. natural:", img.naturalWidth, img.naturalHeight);
          resolve();
        };
        img.onerror = (e) => {
          console.error("❌ Image preload failed:", e);
          reject(new Error("Image preload failed"));
        };
        img.src = dataUrl;
      });
      this._perfMark(`Page ${pageNumber}: image check`);

      const height = Math.round(1024 * (this._pagePt.h / this._pagePt.w));
      const containerStyle = `width: 1024px; height: ${height}px; min-height: ${height}px;`;

      // Free canvas memory
      canvas.width = 0;
      canvas.height = 0;

      // Bind to template imageSrc for page 1 or single-page fallbacks
      if (pageNumber === 1) {
        this.imageSrc = dataUrl;
      }

      console.groupEnd();
      return {
        pageNumber,
        imageSrc: dataUrl,
        containerStyle,
        baseWidth: 1024,
        baseHeight: height,
        pageLabel: `Page ${pageNumber}`
      };
    } catch (error) {
      console.error(`❌ renderPageAsImage error (page ${pageNumber}):`, error);
      this.handleError(`Failed to render page ${pageNumber}.`, error);
      console.groupEnd();
      throw error; // propagate error
    }
  }

  // ===== LAZY RENDERING STATE =====
  _renderedPages = new Set();
  _renderingPages = new Set();

  async renderAllPages() {
    console.group("📄 [renderAllPages]");
    this.showSpinner = true;
    this.isLoading = true;

    try {
      if (!this.pdfDoc) {
        throw new Error("pdfDoc is not initialized");
      }

      const total = this.pdfDoc.numPages;
      this.totalPages = total;
      this.currentPage = 1;

      this._renderedPages = new Set([1]);
      this._renderingPages = new Set([1]);

      // 1. Render Page 1 immediately for instant display
      const page1Data = await this.renderPageAsImage(1);
      this._renderingPages.delete(1);
      page1Data.isRendered = true;

      const pages = [page1Data];

      // 2. Build lightweight placeholder shells for offscreen pages (pages 2..total)
      for (let pageNum = 2; pageNum <= total; pageNum++) {
        let pagePt = this._pageDimensionsCache?.get(pageNum);
        if (!pagePt) {
          try {
            const pageObj = await this.pdfDoc.getPage(pageNum);
            const vp1 = pageObj.getViewport({ scale: 1 });
            pagePt = { w: vp1.width, h: vp1.height };
            if (!this._pageDimensionsCache) {
              this._pageDimensionsCache = new Map();
            }
            this._pageDimensionsCache.set(pageNum, pagePt);
          } catch (e) {
            pagePt = { w: 612, h: 792 };
          }
        }

        const height = Math.round(1024 * (pagePt.h / pagePt.w));
        const containerStyle = `width: 1024px; height: ${height}px; min-height: ${height}px;`;

        pages.push({
          pageNumber: pageNum,
          imageSrc: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E",
          containerStyle,
          baseWidth: 1024,
          baseHeight: height,
          pageLabel: `Page ${pageNum}`,
          isRendered: false
        });
      }

      this.pagesData = pages;
      this.imageSrcs = pages.map((p) => p.imageSrc);

      // Attach IntersectionObserver after DOM renders
      setTimeout(() => {
        this.setupIntersectionObserver();
        if (total > 1) {
          this._queueBackgroundPageRender(2);
        }
      }, 150);

      console.groupEnd();
    } catch (error) {
      console.error("❌ renderAllPages error:", error);
      this.handleError("Failed to render PDF pages.", error);
      console.groupEnd();
      throw error;
    } finally {
      this.showSpinner = false;
      this.isLoading = false;
    }
  }

  async renderPageLazy(pageNumber) {
    if (!this.pdfDoc) return;
    if (this._renderedPages?.has(pageNumber) || this._renderingPages?.has(pageNumber)) {
      return;
    }
    if (!this._renderingPages) this._renderingPages = new Set();
    if (!this._renderedPages) this._renderedPages = new Set();

    this._renderingPages.add(pageNumber);

    try {
      this._trace(`Lazy-rendering page ${pageNumber}...`);
      const pageData = await this.renderPageAsImage(pageNumber);
      this._renderedPages.add(pageNumber);

      const updated = [...this.pagesData];
      const idx = pageNumber - 1;
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          imageSrc: pageData.imageSrc,
          isRendered: true
        };
        this.pagesData = updated;
        this.imageSrcs = updated.map((p) => p.imageSrc);
      }
      this._trace(`Lazy-rendered page ${pageNumber} successfully`);
    } catch (err) {
      console.error(`❌ renderPageLazy error (page ${pageNumber}):`, err);
    } finally {
      this._renderingPages.delete(pageNumber);
    }
  }

  _queueBackgroundPageRender(startPage) {
    if (!this.pdfDoc || !this.pagesData) return;
    const total = this.totalPages;
    if (startPage > total) return;

    const scheduleNext = typeof window.requestIdleCallback === 'function'
      ? (fn) => window.requestIdleCallback(fn, { timeout: 1000 })
      : (fn) => setTimeout(fn, 200);

    scheduleNext(async () => {
      let nextUnrendered = null;
      for (let p = 2; p <= total; p++) {
        if (!this._renderedPages?.has(p) && !this._renderingPages?.has(p)) {
          nextUnrendered = p;
          break;
        }
      }

      if (nextUnrendered) {
        await this.renderPageLazy(nextUnrendered);
        this._queueBackgroundPageRender(nextUnrendered + 1);
      }
    });
  }

  setupIntersectionObserver() {
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }

    const viewportEl = this.template.querySelector('.canvas-viewport');
    if (!viewportEl) {
      return;
    }

    const pageElements = this.template.querySelectorAll('.image-container.page-container[data-page-number]');
    if (!pageElements || pageElements.length === 0) {
      return;
    }

    this._pageVisibilityMap = new Map();

    const observerOptions = {
      root: viewportEl,
      rootMargin: '300px 0px 300px 0px',
      threshold: [0, 0.05, 0.25, 0.5, 0.75, 1.0]
    };

    this._intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const pageNum = parseInt(entry.target.dataset.pageNumber, 10);
        if (!isNaN(pageNum)) {
          this._pageVisibilityMap.set(pageNum, entry.intersectionRatio);

          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            if (!this._renderedPages?.has(pageNum)) {
              this.renderPageLazy(pageNum);
            }
          }
        }
      });

      let maxRatio = -1;
      let mostVisiblePage = this.currentPage;

      for (const [pageNum, ratio] of this._pageVisibilityMap.entries()) {
        if (ratio > maxRatio) {
          maxRatio = ratio;
          mostVisiblePage = pageNum;
        }
      }

      if (mostVisiblePage && mostVisiblePage !== this.currentPage && maxRatio > 0.05) {
        this.currentPage = mostVisiblePage;
      }
    }, observerOptions);

    pageElements.forEach((el) => this._intersectionObserver.observe(el));
  }

  retrieveFileUrl() {
    console.group("🔗 [retrieveFileUrl]");
    console.log("➡️ called with recordId:", this.recordId);
    this._trace(`retrieveFileUrl called with recordId="${this.recordId}"`);

    this.showSpinner = true;
    this.isLoading = true;

    return getUploadedFileUrl({ recordId: this.recordId })
      .then((url) => {
        console.log("✅ Apex getUploadedFileUrl returned:", url);
        this._trace(`retrieveFileUrl resolved with URL="${url}"`);
        this._perfMark('Apex getUploadedFileUrl');

        if (url) {
          console.log("✅ File URL retrieved:", url);
          this.awsUrl = url;
          console.log("📌 awsUrl set:", this.awsUrl);
          console.groupEnd();
          return url; // ✅ return url to caller
        }

        console.error("❌ No URL found for the uploaded file. recordId:", this.recordId);
        this.showToast("Warning", "File uploaded but URL could not be retrieved.", "warning");
        console.groupEnd();
        return null;
      })
      .catch((error) => {
        console.error("❌ Error retrieving file URL:", error);
        this.showToast("Error", "Error retrieving file URL.", "error");
        console.groupEnd();
        return null;
      })
      .finally(() => {
        this.showSpinner = false;
        this.isLoading = false;
        console.log("✅ [retrieveFileUrl] done. showSpinner:", this.showSpinner, "isLoading:", this.isLoading);
      });
  }



  showToast(title, message, variant, mode = 'dismissible') {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant,
      mode: mode
    });
    this.dispatchEvent(event);
  }
  get isPaginationVisible() {
    return this.totalPages > 1;
  }

  get isFirstPage() {
    return this.currentPage === 1;
  }

  get isLastPage() {
    return this.currentPage === this.totalPages;
  }

  showPreviousPage() {
    if (this.currentPage > 1) {
      this.scrollToPage(this.currentPage - 1);
    }
  }

  showNextPage() {
    if (this.currentPage < this.totalPages) {
      this.scrollToPage(this.currentPage + 1);
    }
  }

  scrollToPage(pageNumber) {
    if (!this._renderedPages?.has(pageNumber)) {
      this.renderPageLazy(pageNumber);
    }
    const pageEl = this.template.querySelector(`.image-container.page-container[data-page-number="${pageNumber}"]`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---- Placeholder Undo / Redo (per page, placement only) ----
  // _undoByPage: { [page]: [placeholderId, ...] } in placement order
  // _redoByPage: { [page]: [placeholderSnapshot, ...] } in undo order
  _undoByPage = {};
  _redoByPage = {};

  _recordPlaceholderAdd(placeholder) {
    const page = placeholder.page;
    this._undoByPage = {
      ...this._undoByPage,
      [page]: [...(this._undoByPage[page] || []), placeholder.id]
    };
    // A new placement discards the redo history of this page
    this._redoByPage = { ...this._redoByPage, [page]: [] };
  }

  _clearPlaceholderHistory() {
    this._undoByPage = {};
    this._redoByPage = {};
  }

  get isUndoDisabled() {
    if (this.showRecipientModal) {
      return true;
    }
    const ids = this._undoByPage[this.currentPage] || [];
    return !ids.some(id => this.placeholders.some(p => p.id === id));
  }

  get isRedoDisabled() {
    return this.showRecipientModal || (this._redoByPage[this.currentPage] || []).length === 0;
  }

  get isResetPageDisabled() {
    return this.showRecipientModal ||
      !this.placeholders.some(p => p.page === this.currentPage);
  }

  // Removes every placeholder of the current page. Not undoable, so this page's history is cleared.
  handleResetPage() {
    if (this.isResetPageDisabled) {
      return;
    }
    const page = this.currentPage;
    this.placeholders = this.placeholders.filter(p => p.page !== page);
    this._undoByPage = { ...this._undoByPage, [page]: [] };
    this._redoByPage = { ...this._redoByPage, [page]: [] };
  }

  handleUndoPlaceholder() {
    if (this.isUndoDisabled) {
      return;
    }
    const page = this.currentPage;
    const ids = [...(this._undoByPage[page] || [])];

    // Skip placements that were already removed with the X button
    while (ids.length) {
      const id = ids.pop();
      const ph = this.placeholders.find(p => p.id === id);
      if (ph) {
        this.placeholders = this.placeholders.filter(p => p.id !== id);
        this._redoByPage = {
          ...this._redoByPage,
          [page]: [...(this._redoByPage[page] || []), { ...ph }]
        };
        break;
      }
    }
    this._undoByPage = { ...this._undoByPage, [page]: ids };
  }

  handleRedoPlaceholder() {
    if (this.isRedoDisabled) {
      return;
    }
    const page = this.currentPage;
    const redo = [...(this._redoByPage[page] || [])];

    while (redo.length) {
      const ph = redo.pop();
      const recipientInfo = ph.recipient
        ? this.recipientEmails.find(r => r.email === ph.recipient)
        : null;

      // Do not restore placeholders whose recipient / custom field was removed meanwhile
      const recipientGone = !!ph.recipient && !recipientInfo;
      const customGone = ph.isCustom && !this.customFields.some(cf => cf.key === ph.customKey);
      if (recipientGone || customGone || this.placeholders.some(p => p.id === ph.id)) {
        continue;
      }

      let restored = ph;
      if (recipientInfo && recipientInfo.color && recipientInfo.color !== ph.recipientColor) {
        restored = {
          ...ph,
          recipientColor: recipientInfo.color,
          combinedStyle: `
              top:${ph.y}px;
              left:${ph.x}px;
              position:absolute;
              border:3px dashed ${recipientInfo.color};
              border-radius:8px;
              ${ph.w ? `width:${ph.w}px;` : ""}
              ${ph.h ? `height:${ph.h}px;` : ""}
          `
        };
      }

      this.placeholders = [...this.placeholders, restored];
      this._undoByPage = {
        ...this._undoByPage,
        [page]: [...(this._undoByPage[page] || []), restored.id]
      };
      break;
    }
    this._redoByPage = { ...this._redoByPage, [page]: redo };
  }

  // ---- Zoom Controls ----
  get zoomPercentLabel() {
    return `${Math.round(this._getZoom() * 100)}%`;
  }

  get isZoomOutDisabled() {
    const z = this._getZoom();
    const minZoom = ZOOM_STEPS[0];
    return z <= minZoom + 0.001;
  }

  get isZoomInDisabled() {
    const z = this._getZoom();
    const maxZoom = ZOOM_STEPS[ZOOM_STEPS.length - 1];
    return z >= maxZoom - 0.001;
  }

  _getZoom() {
    return this.zoomLevel > 0 ? this.zoomLevel : 1;
  }

  _getPageMetrics(pageNumber) {
    const r = this._getCanvasRect(pageNumber); // visual rect (unchanged function)
    if (!r) return null;
    const z = this._getZoom();
    return { left: r.left, top: r.top, width: r.width / z, height: r.height / z, zoom: z };
  }

  _applyZoom(newZoom) {
    const vp = this.template.querySelector('.canvas-viewport');
    let ratioY = 0;
    let ratioX = 0;
    if (vp) {
      const scrollHeight = vp.scrollHeight;
      const scrollWidth = Math.max(1, vp.scrollWidth);
      ratioY = scrollHeight > 0 ? vp.scrollTop / scrollHeight : 0;
      ratioX = vp.scrollLeft / scrollWidth;
    }

    this.zoomLevel = newZoom;

    window.requestAnimationFrame(() => {
      if (vp) {
        vp.scrollTop = ratioY * vp.scrollHeight;
        vp.scrollLeft = ratioX * vp.scrollWidth;
      }
      this._guideDirty = true;
      this._positionGuide();
    });
  }

  handleZoomIn() {
    const currentZoom = this._getZoom();
    const nextStep = ZOOM_STEPS.find((step) => step > currentZoom + 0.001);
    if (nextStep !== undefined) {
      this._applyZoom(nextStep);
    }
  }

  handleZoomOut() {
    const currentZoom = this._getZoom();
    const prevSteps = ZOOM_STEPS.filter((step) => step < currentZoom - 0.001);
    if (prevSteps.length > 0) {
      const prevStep = prevSteps[prevSteps.length - 1];
      this._applyZoom(prevStep);
    }
  }

  handleZoomReset() {
    this._applyZoom(1);
  }

  handleError(message, error) {
    console.error(message, error);
    this.errorMessage = `${message} ${error ? ": " + error.message : ""}`;
    this.showToast("Error", this.errorMessage, "error");
  }

  displayImage(imageDataUrl) {
    this.imageSrc = imageDataUrl;
  }

  showToast(title, message, variant, mode = 'dismissible') {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant,
      mode: mode
    });
    this.dispatchEvent(event);
  }

  handleDragStart(event) {
    const dragEl = event.target.closest('[data-type]') || event.target.closest('[data-id]') || event.target;
    const id = dragEl.dataset ? dragEl.dataset.id : event.target.dataset?.id;

    // Validate all recipient emails before dragging
    if (!this.areRecipientEmailsValid()) {
      event.preventDefault(); // Prevent the drag action
      this.showToast(
        "Error",
        "Please enter a valid email for all recipients before dragging placeholders.",
        "error"
      );
      return;
    }

    // If Shift key is pressed and the placeholder already exists, enable rearranging
    if (event.shiftKey && id) {
      this.currentDraggedPlaceholder = this.placeholders.find(
        (placeholder) => placeholder.id === parseInt(id, 10)
      );
    } else {
      // Otherwise, it's a new placeholder creation
      this.draggedType = (dragEl.dataset && dragEl.dataset.type) ? dragEl.dataset.type : event.target.dataset?.type;
      const customKey = dragEl.dataset.customKey || event.target.dataset?.customKey;
      const rect = dragEl.getBoundingClientRect();
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          type: this.draggedType,
          customKey: customKey || null,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top
        })
      );
      this.currentDraggedPlaceholder = null;
    }
  }


  areRecipientEmailsValid() {
    // No recipients → invalid
    if (!this.recipientEmails || this.recipientEmails.length === 0) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Every recipient must have a non-empty, valid email
    return this.recipientEmails.every((recipient) => {
      const email = (recipient.email || "").trim();
      return email && emailRegex.test(email);
    });
  }


  allowDrop(event) {
    event.preventDefault();
  }


  handleDrop(event) {
    event.preventDefault();

    const pageContainer = event.target.closest('[data-page-number]');
    if (!pageContainer) {
      console.error("Drop target is not within a valid PDF page container.");
      return;
    }

    const targetPage = parseInt(pageContainer.dataset.pageNumber, 10);
    const imgEl = pageContainer.querySelector('img') || pageContainer;
    const rawRect = imgEl.getBoundingClientRect();
    const z = this._getZoom();
    const rect = {
      left: rawRect.left,
      top: rawRect.top,
      width: rawRect.width / z,
      height: rawRect.height / z
    };

    // drag data
    const dragData = JSON.parse(event.dataTransfer.getData("text/plain"));
    const { type, customKey, offsetX, offsetY } = dragData;

    // mouse → image space (unscaled)
    const mouseX = (event.clientX - rect.left) / z;
    const mouseY = (event.clientY - rect.top) / z;

    // raw position (top-left of placeholder)
    let x = mouseX - offsetX;
    let y = mouseY - offsetY;

    // actual placeholder size (initial guess)
    const { w, h } = this._getPlaceholderSizeByType(type);

    // clamp to page
    ({ x, y } = this._clampToRect(x, y, rect.width, rect.height, w, h));

    // auto-avoid overlaps on the same page (with initial guess)
    const free = this._findFreeSpot(x, y, w, h, rect.width, rect.height, targetPage, /*excludeId*/ null);
    x = free.x; y = free.y;

    // compute PDF point coords (keeps your existing behavior)
    const pagePt = this.getPageDimensions(targetPage);
    const xPt = (x / rect.width) * pagePt.w;
    const yPt = (y / rect.height) * pagePt.h;

    if (type) {
      const isCustom = !!customKey;
      let customField = null;
      if (isCustom) {
        customField = this.customFields.find(cf => cf.key === customKey);
        if (!customField) { console.error("Custom field not found."); return; }
      }

      const isSig = !isCustom && type === "Signature";
      const phW = isSig ? w : undefined;
      const phH = isSig ? h : undefined;

      const newPlaceholder = {
        id: Date.now(),
        type,
        x, y,
        xPt, yPt,
        w: phW,
        h: phH,
        wPt: isSig && pagePt ? (w / rect.width) * pagePt.w : null,
        hPt: isSig && pagePt ? (h / rect.height) * pagePt.h : null,
        page: targetPage,
        style: `top:${y}px; left:${x}px; position:absolute;${phW ? ` width:${phW}px;` : ""}${phH ? ` height:${phH}px;` : ""}`,
        value: "",
        initialsSource: "",
        isName: !isCustom && type === "Name",
        isLastName: !isCustom && type === "LastName",
        isEmail: !isCustom && type === "Email",
        isContactNumber: !isCustom && type === "ContactNumber",
        isAddress: !isCustom && type === "Address",
        isDate: !isCustom && type === "Date",
        isDateOfSigning: !isCustom && type === "DateOfSigning",
        isInitials: !isCustom && type === "Initials",
        isNameInitials: !isCustom && type === "NameInitials",
        isABN: !isCustom && type === "ABN",
        isFullName: !isCustom && type === "FullName",
        isSignature: isSig,

        isCustom: isCustom,
        customKey: customKey || null,
        customFieldId: isCustom ? customField.id : null,
        label: isCustom ? customField.label : "",
        dataType: isCustom ? customField.dataType : "",
        required: true,
        options: isCustom ? (customField.options || []) : [],
        isCustomText: isCustom && customField.dataType === 'Text',
        isCustomLongText: isCustom && customField.dataType === 'Long Text',
        isCustomNumber: isCustom && customField.dataType === 'Number',
        isCustomCurrency: isCustom && customField.dataType === 'Currency',
        isCustomDate: isCustom && customField.dataType === 'Date',
        isCustomEmail: isCustom && customField.dataType === 'Email',
        isCustomPhone: isCustom && customField.dataType === 'Phone',
        isCustomBoolean: isCustom && customField.dataType === 'Boolean',
        isCustomPicklist: isCustom && customField.dataType === 'Picklist',
        checkedValue: false,


        recipient: "",
        recipientColor: "#0070d2",
        combinedStyle: `
          top:${y}px;
          left:${x}px;
          position:absolute;
          border:3px dashed #0176D3;
          border-radius:8px;
          ${phW ? `width:${phW}px;` : ""}
          ${phH ? `height:${phH}px;` : ""}
      `,
        customInlineStyle: false
      };

      // ⬇️ your current behavior (unchanged)
      this.newPlaceholder = newPlaceholder;
      this._commitPlaceholderPosition(newPlaceholder);
      this._recordPlaceholderAdd(newPlaceholder);

      this.styleOptions = {
        fontFamily: 'Calibri, Arial, sans-serif',
        fontSize: '18',
        bold: false,
        italic: false,
        underline: false,
        color: '#000000'
      };
      this.useCustomInlineStyle = false;

      // ---- NEW CODE ----
      // A newly dropped field starts as Required
      this.isFieldRequired = true;
      // ---- END NEW CODE ----

      // Check active recipient (requirement 3)
      let activeFound = false;
      if (this.activeRecipientKey !== null && this.activeRecipientKey !== undefined) {
        const activeRecipient = this.recipientEmails.find(r => r.key === this.activeRecipientKey);
        if (activeRecipient) {
          activeFound = true;
          const recipientEmail = activeRecipient.email || "";
          const recipientColor = activeRecipient.color || "#0070d2";
          this._assignAndCommitPlaceholder(newPlaceholder, recipientEmail, recipientColor);

          // Reset state (excluding activeRecipientKey)
          this.newPlaceholder = null;
          this.selectedRecipient = null;
          this.selectedRecipientColor = null;
          this.editingPlaceholderId = null;
          this.showRecipientModal = false;
        } else {
          // Stale key fallback: clear and open modal
          this.activeRecipientKey = null;
        }
      }

      if (!activeFound) {
        this.showRecipientModal = true;
      }

      // ⬇️ NEW: after it renders, measure actual size and reflow once if needed
      requestAnimationFrame(() => {

        this._measureAndCache(
          newPlaceholder
        );

        console.log(
          "Measured New Placeholder",
          {
            id: newPlaceholder.id,
            width: newPlaceholder.w,
            height: newPlaceholder.h
          }
        );

        const rect2 = this._getPageMetrics(newPlaceholder.page) || rect;

        if (!rect2) {
          return;
        }

        const size =
          this._getSize(
            newPlaceholder
          );

        const pos =
          this._findFreeSpot(
            newPlaceholder.x,
            newPlaceholder.y,
            size.w,
            size.h,
            rect2.width,
            rect2.height,
            newPlaceholder.page,
            newPlaceholder.id
          );

        if (
          pos.x !== newPlaceholder.x ||
          pos.y !== newPlaceholder.y
        ) {

          newPlaceholder.x = pos.x;
          newPlaceholder.y = pos.y;

          newPlaceholder.combinedStyle = `
                  top:${pos.y}px;
                  left:${pos.x}px;
                  position:absolute;
                  border:3px dashed #0176D3;
                  border-radius:8px;
                  ${newPlaceholder.w ? `width:${newPlaceholder.w}px;` : ""}
                  ${newPlaceholder.h ? `height:${newPlaceholder.h}px;` : ""}
              `;

          const pagePt = this.getPageDimensions(newPlaceholder.page);
          if (pagePt) {

            newPlaceholder.xPt =
              (pos.x / rect2.width) *
              pagePt.w;

            newPlaceholder.yPt =
              (pos.y / rect2.height) *
              pagePt.h;
          }

          this._commitPlaceholderPosition(
            newPlaceholder
          );
        }
      });
    }
  }

  _getCanvasRect(pageNumber) {
    const targetPage = pageNumber
      || this._currentResizingPlaceholder?.page
      || this.currentDraggedPlaceholder?.page
      || this.currentPage;

    const pageEl = this.template.querySelector(`.image-container.page-container[data-page-number="${targetPage}"]`)
      || this.template.querySelector(`.image-container[data-page-number="${targetPage}"]`);
    if (pageEl) {
      const img = pageEl.querySelector('img');
      return img ? img.getBoundingClientRect() : pageEl.getBoundingClientRect();
    }
    const fallbackImg = this.template.querySelector('.image-container img');
    return fallbackImg ? fallbackImg.getBoundingClientRect() : null;
  }

  _getPlaceholderSizeByType(type) {
    if (type === "Signature") {
      return { w: SIGNATURE_W_DEFAULT, h: SIGNATURE_H_DEFAULT };
    }
    if (type === "Initials" || type === "NameInitials") {
      return { w: 75, h: PLACEHOLDER_H_DEFAULT };
    }
    return { w: PLACEHOLDER_W_DEFAULT, h: PLACEHOLDER_H_DEFAULT };
  }

  /**
   * Pure function to derive initials from raw text according to derivation specification:
   * 1. Normalise: trim, collapse internal whitespace, cap at 60 characters.
   * 2. Split on spaces, hyphens, and en/em dashes.
   * 3. Drop leading honorifics (Mr, Mrs, Ms, Miss, Mx, Dr, Prof) if at least 1 other word remains.
   * 4. Take first Unicode letter per word; skip words without letters.
   * 5. Decide between full name and typed initials:
   *    - 2+ words -> full name: one initial per word.
   *    - 1 word containing dots -> strip non-letters and use all letters.
   *    - 1 word of 1-2 letters -> typed initials.
   *    - 1 word of 3-4 letters: if ALL UPPERCASE -> typed initials; if mixed/lower -> name (first letter).
   *    - 1 word of 5+ letters -> single name (first letter).
   * 6. Cap at 3 letters (if > 3 words remain: first, second, and last word).
   * 7. Uppercase with toLocaleUpperCase().
   * 8. Return '' if no letters found.
   */
  _deriveInitials(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let s = raw.trim().replace(/\s+/g, ' ');
    if (s.length > 60) s = s.slice(0, 60);
    if (!s) return '';

    let words = s.split(/[\s\-\u2013\u2014]+/).filter(w => w.length > 0);
    if (words.length === 0) return '';

    const HONORIFIC_REGEX = /^(?:mr|mrs|ms|miss|mx|dr|prof)\.?$/i;
    if (words.length > 1 && HONORIFIC_REGEX.test(words[0])) {
      words.shift();
    }
    if (words.length === 0) return '';

    let result = '';
    if (words.length === 1) {
      const word = words[0];
      if (word.includes('.')) {
        const letters = (word.match(/\p{L}/gu) || []).join('');
        result = letters.slice(0, 3);
      } else {
        const letters = (word.match(/\p{L}/gu) || []).join('');
        if (letters.length === 0) {
          return '';
        } else if (letters.length <= 2) {
          result = letters;
        } else if (letters.length <= 4) {
          const isAllUpper = letters === letters.toLocaleUpperCase() && letters !== letters.toLocaleLowerCase();
          if (isAllUpper) {
            result = letters.slice(0, 3);
          } else {
            result = letters.charAt(0);
          }
        } else {
          result = letters.charAt(0);
        }
      }
    } else {
      let wordInitials = [];
      for (const w of words) {
        const m = w.match(/\p{L}/u);
        if (m) {
          wordInitials.push(m[0]);
        }
      }
      if (wordInitials.length === 0) return '';
      if (wordInitials.length === 1) {
        result = wordInitials[0];
      } else if (wordInitials.length <= 3) {
        result = wordInitials.join('');
      } else {
        result = wordInitials[0] + wordInitials[1] + wordInitials[wordInitials.length - 1];
      }
    }

    result = result.toLocaleUpperCase();
    return /^\p{L}+$/u.test(result) ? result : '';
  }

  _bboxOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return !(
      ax + aw <= bx ||
      bx + bw <= ax ||
      ay + ah <= by ||
      by + bh <= ay
    );
  }

  _clampToRect(x, y, rectW, rectH, w, h) {
    return {
      x: Math.max(0, Math.min(x, rectW - w)),
      y: Math.max(0, Math.min(y, rectH - h)),
    };
  }

  // _findFreeSpot(x, y, w, h, rectW, rectH, page, excludeId) {
  //   let ix = x, iy = y;
  //   let steps = 0;

  //   // use each other's measured sizes
  //   const others = (this.placeholders || []).filter(p => p.page === page && p.id !== excludeId);

  //   const tryPos = (tx, ty) => !others.some(p => {
  //     const sz = this._getSize(p);            // p.w/p.h if measured, else default+gutter
  //     return this._bboxOverlap(tx, ty, w, h, p.x, p.y, sz.w, sz.h);
  //   });

  //   // initial clamp (using our own size)
  //   const clamped = this._clampToRect(ix, iy, rectW, rectH, w, h);
  //   ix = clamped.x; iy = clamped.y;
  //   if (tryPos(ix, iy)) return { x: ix, y: iy };

  //   // scan to the right with row wrap; use our own width/gutter step
  //   const stepX = 1;
  //   const stepY = 1;

  //   while (steps++ < 2000) { // bigger budget for dense layouts
  //     ix += stepX;
  //     if (ix + w > rectW) {
  //       ix = 0;
  //       iy += stepY;
  //     }
  //     if (iy + h > rectH) {
  //       // restart from top-left with slightly larger stride to escape dense zones
  //       ix = 0; iy = 0;
  //     }
  //     if (tryPos(ix, iy)) {
  //       return { x: ix, y: iy };
  //     }
  //   }

  //   // give up: return the clamped original
  //   return clamped;
  // }

  _findFreeSpot(
    x,
    y,
    w,
    h,
    rectW,
    rectH,
    page,
    excludeId
  ) {

    let ix = x;
    let iy = y;
    let steps = 0;

    console.log(
      "========== FIND FREE SPOT =========="
    );

    console.log(
      "Requested Position:",
      {
        x,
        y,
        w,
        h,
        page,
        excludeId
      }
    );

    const others =
      (this.placeholders || []).filter(
        p =>
          p.page === page &&
          p.id !== excludeId
      );

    console.log(
      "Other Placeholders:",
      JSON.stringify(others)
    );

    const tryPos = (tx, ty) => {

      let collisionFound = false;

      others.forEach(p => {

        const sz =
          this._getSize(p);

        const overlaps =
          this._bboxOverlap(
            tx,
            ty,
            w,
            h,
            p.x,
            p.y,
            sz.w,
            sz.h
          );

        if (overlaps) {

          collisionFound = true;

          console.warn(
            "Collision Detected"
          );

          console.warn(
            "Target:",
            {
              x: tx,
              y: ty,
              w,
              h
            }
          );

          console.warn(
            "Against Placeholder:",
            {
              id: p.id,
              type: p.type,
              x: p.x,
              y: p.y,
              w: sz.w,
              h: sz.h
            }
          );
        }
      });

      return !collisionFound;
    };

    const clamped =
      this._clampToRect(
        ix,
        iy,
        rectW,
        rectH,
        w,
        h
      );

    ix = clamped.x;
    iy = clamped.y;

    console.log(
      "Clamped Position:",
      clamped
    );

    if (tryPos(ix, iy)) {

      console.log(
        "No collision. Returning original position."
      );

      return {
        x: ix,
        y: iy
      };
    }

    const stepX = 1;
    const stepY = 1;

    while (steps++ < 2000) {

      ix += stepX;

      if (ix + w > rectW) {
        ix = 0;
        iy += stepY;
      }

      if (iy + h > rectH) {
        ix = 0;
        iy = 0;
      }

      if (tryPos(ix, iy)) {

        console.log(
          "Free Spot Found"
        );

        console.log(
          "Original:",
          {
            x,
            y
          }
        );

        console.log(
          "Final:",
          {
            x: ix,
            y: iy
          }
        );

        console.log(
          "Shifted By:",
          {
            deltaX: ix - x,
            deltaY: iy - y
          }
        );

        console.log(
          "Iterations:",
          steps
        );

        return {
          x: ix,
          y: iy
        };
      }
    }

    console.error(
      "No free position found after",
      steps,
      "iterations"
    );

    return clamped;
  }

  _commitPlaceholderPosition(updated) {
    // 1) update flat list (source of truth)
    this.placeholders = (this.placeholders || []).map(p =>
      p.id === updated.id ? { ...p, ...updated } : p
    );

    // 2) update paged map (if you render from it anywhere)
    if (this.placeholdersByPage && updated.page != null) {
      const list = (this.placeholdersByPage[updated.page] || []).map(p =>
        p.id === updated.id ? { ...p, ...updated } : p
      );
      this.placeholdersByPage = {
        ...this.placeholdersByPage,
        [updated.page]: list
      };
    }

    // 3) optional flag you can check before saving
    this._placeholdersDirty = true;
  }

  // _getSize(phOrType) {
  //   // phOrType could be a placeholder or a string type
  //   if (phOrType && typeof phOrType === 'object') {
  //     return {
  //       w: (phOrType.w ?? PLACEHOLDER_W_DEFAULT) + GUTTER_X,
  //       h: (phOrType.h ?? PLACEHOLDER_H_DEFAULT) + GUTTER_Y,
  //     };
  //   }
  //   // fallback by type, if you later vary sizes by type
  //   return { w: PLACEHOLDER_W_DEFAULT + GUTTER_X, h: PLACEHOLDER_H_DEFAULT + GUTTER_Y };
  // }

  // One-line text fields (standard and custom): no stretching, the box fits its label
  _isFitField(ph) {
    if (!ph || ph.isSignature) return false;
    if (ph.isCustom) {
      return ['Text', 'Number', 'Currency', 'Email', 'Phone'].includes(ph.dataType);
    }
    return ['Name', 'LastName', 'FullName', 'Email', 'ContactNumber', 'ABN'].includes(ph.type);
  }

  // Label shown inside the box (must match the placeholder text in the HTML)
  _getFitLabel(ph) {
    if (ph.isCustom) return ph.label || '';
    const labels = {
      Name: 'First Name', LastName: 'Last Name', FullName: 'Full Name',
      Email: 'Email', ContactNumber: 'Contact Number', ABN: 'ABN'
    };
    return labels[ph.type] || '';
  }

  // Box width in page px: label text + input padding/borders, min 80px
  _getFitWidth(ph) {
    if (!this._fitCtx) {
      this._fitCtx = document.createElement('canvas').getContext('2d');
    }
    // Use the real font of a rendered field input; fall back to the CSS default (1rem)
    if (!this._fitFont) {
      const input = this.template.querySelector('.placeholder-container .placeholder-input');
      if (input) {
        const cs = window.getComputedStyle(input);
        this._fitFont = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      }
    }
    this._fitCtx.font = this._fitFont || '400 16px Arial, sans-serif';
    const textWidth = this._fitCtx.measureText(this._getFitLabel(ph)).width;
    // ---- NEW CODE ----
    // Required fields show a red * inside the box, so add room for it
    const starRoom = ph.required !== false ? 16 : 0;
    return Math.max(80, Math.ceil(textWidth) + 28 + starRoom);
    // ---- END NEW CODE ----
  }

  _getSize(phOrType) {

    // Placeholder object
    if (
      phOrType &&
      typeof phOrType === "object"
    ) {

      // One-line text fields are as wide as their label
      const measuredWidth = this._isFitField(phOrType)
        ? this._getFitWidth(phOrType)
        : phOrType.w;

      const measuredHeight =
        phOrType.h;

      const isSignature = !!(phOrType.isSignature || phOrType.type === 'Signature');
      const isInitials = phOrType.type === 'Initials' || phOrType.type === 'NameInitials';

      const finalWidth =
        (measuredWidth ??
          (isInitials ? 75 : isSignature ? SIGNATURE_W_DEFAULT : PLACEHOLDER_W_DEFAULT)) +
        GUTTER_X;

      const finalHeight =
        (measuredHeight ??
          (isSignature ? SIGNATURE_H_DEFAULT : PLACEHOLDER_H_DEFAULT)) +
        GUTTER_Y;

      console.log(
        "Placeholder Size Calculation",
        {
          id: phOrType.id,
          type: phOrType.type,

          measuredWidth,
          measuredHeight,

          defaultWidth:
            isInitials ? 75 : isSignature ? SIGNATURE_W_DEFAULT : PLACEHOLDER_W_DEFAULT,

          defaultHeight:
            isSignature ? SIGNATURE_H_DEFAULT : PLACEHOLDER_H_DEFAULT,

          gutterX:
            GUTTER_X,

          gutterY:
            GUTTER_Y,

          finalWidth,
          finalHeight
        }
      );

      return {
        w: finalWidth,
        h: finalHeight
      };
    }

    // Fallback for type-based calculation
    const isSignature = phOrType === 'Signature';
    const isInitials = phOrType === 'Initials' || phOrType === 'NameInitials';

    const fallbackWidth =
      (isInitials ? 75 : isSignature ? SIGNATURE_W_DEFAULT : PLACEHOLDER_W_DEFAULT) +
      GUTTER_X;

    const fallbackHeight =
      (isSignature ? SIGNATURE_H_DEFAULT : PLACEHOLDER_H_DEFAULT) +
      GUTTER_Y;

    console.log(
      "Fallback Placeholder Size",
      {
        input: phOrType,
        width:
          fallbackWidth,
        height:
          fallbackHeight
      }
    );

    return {
      w: fallbackWidth,
      h: fallbackHeight
    };
  }

  // Measure a rendered placeholder and cache size on it
  _measureAndCache(ph) {
    if (!ph?.id) {
      return;
    }

    if ((ph.isSignature || ph.type === 'Signature') && Number.isFinite(ph.w) && Number.isFinite(ph.h) && ph.w > 0 && ph.h > 0) {
      return;
    }

    const el =
      this.template.querySelector(
        `.measurable-placeholder[data-id="${ph.id}"]`
      );

    if (!el) {
      console.warn(
        "Measurement element not found",
        ph.id
      );
      return;
    }

    const rect =
      el.getBoundingClientRect();
    const z = this._getZoom();

    ph.w = Math.round(rect.width / z);
    ph.h = Math.round(rect.height / z);

    console.log(
      "Measured Placeholder",
      ph.id,
      {
        width: ph.w,
        height: ph.h
      }
    );
  }


  handleInitialsSelection(event) {
    const id = parseInt(event.target.dataset.id, 10);
    const placeholder = this.placeholders.find((item) => item.id === id);
    if (placeholder) {
      placeholder.value = event.target.value;
      console.log(`Title selected: ${placeholder.value}`);
    }
  }

  _assignAndCommitPlaceholder(placeholder, recipientEmail, recipientColor) {
    let updated = {
      ...placeholder,
      recipient: recipientEmail,
      recipientColor: recipientColor
    };

    updated.combinedStyle = `
          top:${updated.y}px;
          left:${updated.x}px;
          position:absolute;
          border:3px dashed ${recipientColor};
          border-radius:8px;
          ${updated.w ? `width:${updated.w}px;` : ""}
          ${updated.h ? `height:${updated.h}px;` : ""}
      `;

    // Apply custom text styling if enabled
    if (this.useCustomInlineStyle) {
      updated = {
        ...updated,
        customInlineStyle: true,
        textStyle: {
          ...this.styleOptions
        }
      };
    } else {
      updated = {
        ...updated,
        customInlineStyle: false
      };
      delete updated.textStyle;
    }

    // Upsert placeholder
    const idx = this.placeholders.findIndex(
      p => Number(p.id) === Number(updated.id)
    );

    if (idx >= 0) {
      const placeholdersCopy = [...this.placeholders];
      placeholdersCopy[idx] = updated;
      this.placeholders = placeholdersCopy;
    } else {
      this.placeholders = [
        ...this.placeholders,
        updated
      ];
    }

    // Force reactivity
    this.placeholders = [...this.placeholders];

    requestAnimationFrame(() => {
      const ph = this.placeholders.find(p => p.id === updated.id);
      if (ph) {
        this._measureAndCache(ph);
        console.log("Measured After Save", {
          id: ph.id,
          width: ph.w,
          height: ph.h
        });
      }
    });

    return updated;
  }

  confirmRecipientSelection() {
    if (!this.newPlaceholder || !this.selectedRecipient) {
      this.showToast(
        "Error",
        "Please select a recipient.",
        "error"
      );
      return;
    }

    // Find selected recipient metadata
    const recipientInfo = this.recipientEmails.find(
      recipient =>
        recipient.email === this.selectedRecipient
    );

    const recipientColor =
      recipientInfo?.color || "#0070d2";

    // Assign and commit
    // ---- OLD CODE (commented out) ----
    // Required flag was not editable, so the popup did not pass it.
    // const updated = this._assignAndCommitPlaceholder(this.newPlaceholder, this.selectedRecipient, recipientColor);
    // ---- END OLD CODE ----

    // ---- NEW CODE ----
    // Save the Required toggle value on the field along with recipient + style
    const updated = this._assignAndCommitPlaceholder(
      { ...this.newPlaceholder, required: this.isFieldRequired },
      this.selectedRecipient,
      recipientColor
    );
    // ---- END NEW CODE ----

    // Update active recipient only after successful assignment (Requirement 5)
    if (recipientInfo) {
      this.activeRecipientKey = recipientInfo.key;
    }

    // Reset modal state
    this.newPlaceholder = null;
    this.selectedRecipient = null;
    this.selectedRecipientColor = null;
    this.editingPlaceholderId = null;
    this.showRecipientModal = false;
    this.useCustomInlineStyle = false;

    console.log(
      "Recipient + style saved:",
      updated
    );

    console.log(
      "All placeholders:",
      JSON.stringify(this.placeholders)
    );
  }

  cancelRecipientSelection() {
    if (this.newPlaceholder && !this.editingPlaceholderId) {
      const phId = this.newPlaceholder.id;
      const phPage = this.newPlaceholder.page || this.currentPage;
      this.placeholders = (this.placeholders || []).filter((p) => p.id !== phId);
      if (this.placeholdersByPage && this.placeholdersByPage[phPage]) {
        this.placeholdersByPage[phPage] = this.placeholdersByPage[phPage].filter((p) => p.id !== phId);
      }
      if (this._undoByPage && this._undoByPage[phPage]) {
        this._undoByPage = {
          ...this._undoByPage,
          [phPage]: (this._undoByPage[phPage] || []).filter((id) => id !== phId)
        };
      }
    }
    this.newPlaceholder = null;
    this.selectedRecipient = null;
    this.showRecipientModal = false;
    this.editingPlaceholderId = null;
  }

  get recipientRadioOptions() {
    return this.recipientEmails.map((recipient) => ({
      label: recipient.email,
      value: recipient.email
    }));
  }

  getFormattedEmail(email) {
    return email ? email.split("@")[0] : "No Recipient";
  }

  get renderedPages() {
    if (!this.pagesData || this.pagesData.length === 0) {
      return [];
    }

    const placeholdersByPage = new Map();
    (this.placeholders || []).forEach((placeholder) => {
      const pageNum = placeholder.page || 1;
      if (!placeholdersByPage.has(pageNum)) {
        placeholdersByPage.set(pageNum, []);
      }
      const color = placeholder.recipientColor;
      const shadowVars = /^#[0-9a-fA-F]{6}$/.test(color || "")
        ? `--ph-shadow:${color}33;--ph-shadow-soft:${color}1F;--ph-shadow-hover:${color}4D;--ph-shadow-hover-soft:${color}26;--ph-tint:${color}14;--ph-text:${color};`
        : "";
      // Text boxes fit their label (overrides any old stretched width)
      const fitStyle = this._isFitField(placeholder)
        ? `width:${this._getFitWidth(placeholder)}px;min-width:0;max-width:none;`
        : "";
      placeholdersByPage.get(pageNum).push({
        ...placeholder,
        combinedStyle: `${placeholder.combinedStyle || ""}${shadowVars}${fitStyle}`,
        formattedRecipient: this.getFormattedEmail(placeholder.recipient),
        // ---- NEW CODE ---- red * on required fields (older fields without the flag = required)
        // Signature shows its star next to the "Signature" label; checkboxes never block, so no star
        showRequiredStar: placeholder.required !== false && !placeholder.isSignature && !placeholder.isCustomBoolean,
        showSignatureStar: placeholder.required !== false && !!placeholder.isSignature,
        // Multi-line boxes (Address / long text): star on the first line instead of the middle
        requiredStarClass: (placeholder.isAddress || placeholder.isCustomLongText)
          ? 'required-star required-star--top'
          : 'required-star'
        // ---- END NEW CODE ----
      });
    });

    const z = this._getZoom();

    return this.pagesData.map((page) => {
      const baseWidth = page.baseWidth || 1024;
      const baseHeight = page.baseHeight || 1024;
      const zoomWrapperStyle = `width:${baseWidth * z}px; height:${baseHeight * z}px; flex-shrink:0; margin:0 auto; position:relative;`;
      const zoomedContainerStyle = `${page.containerStyle || ""} transform:scale(${z}); transform-origin:top left;`;

      return {
        ...page,
        zoomWrapperStyle,
        zoomedContainerStyle,
        isGuidePage: this.isGuideVisible && this.guidePageNumber === page.pageNumber,
        placeholders: placeholdersByPage.get(page.pageNumber) || []
      };
    });
  }

  get placeholdersForCurrentPage() {
    return this.placeholders
      .map((placeholder) => {
        const color = placeholder.recipientColor;
        // Shadow in the recipient's colour (display only; stored combinedStyle is untouched)
        const shadowVars = /^#[0-9a-fA-F]{6}$/.test(color || "")
          ? `--ph-shadow:${color}33;--ph-shadow-soft:${color}1F;--ph-shadow-hover:${color}4D;--ph-shadow-hover-soft:${color}26;--ph-tint:${color}14;--ph-text:${color};`
          : "";
        const fitStyle = this._isFitField(placeholder)
          ? `width:${this._getFitWidth(placeholder)}px;min-width:0;max-width:none;`
          : "";
        return {
          ...placeholder,
          combinedStyle: `${placeholder.combinedStyle || ""}${shadowVars}${fitStyle}`,
          formattedRecipient: this.getFormattedEmail(placeholder.recipient) // Ensure recipient is passed
        };
      })
      .filter((placeholder) => placeholder.page === this.currentPage); // Filter by current page
  }

  handleRecipientSelection(event) {
    this.selectedRecipient = event.detail.value;

    const recipientInfo = this.recipientEmails.find(
      recipient => recipient.email === this.selectedRecipient
    );

    this.selectedRecipientColor =
      recipientInfo?.color || '#0070d2';

    console.log(
      'Selected recipient:',
      this.selectedRecipient,
      'Color:',
      this.selectedRecipientColor
    );
  }

  handleMouseDown(event) {
    // Enable dragging only when Shift key is held
    if (event.shiftKey) {
      const id = event.target.dataset.id;
      if (id) {
        this.currentDraggedPlaceholder = this.placeholders.find(
          (placeholder) => placeholder.id === parseInt(id, 10)
        );
      }
    }
  }

  handleMouseUp(event) {
    // Reset dragging state
    this.currentDraggedPlaceholder = null;
  }

  handleResizeStart(event) {
    event.preventDefault();
    event.stopPropagation();

    const id = event.target.dataset.id;
    if (!id) {
      return;
    }

    const ph = this.placeholders.find(
      (p) => p.id === parseInt(id, 10)
    );

    if (!ph || (!ph.isSignature && !ph.isCustom)) {
      return;
    }

    if (event.target.setPointerCapture && event.pointerId != null) {
      try {
        event.target.setPointerCapture(event.pointerId);
      } catch (_) {}
    }
    this._resizePointerId = event.pointerId;
    this._resizeTarget = event.target;

    this._resizing = true;
    this._currentResizingPlaceholder = ph;
    this._resizeStartX = event.clientX;
    this._resizeStartY = event.clientY;

    const z = this._getZoom();
    const el = this.template.querySelector(
      `.measurable-placeholder[data-id="${id}"]`
    );
    const rect = el ? el.getBoundingClientRect() : null;
    this._resizeStartWidth = rect
      ? rect.width / z
      : (ph.w || (ph.isSignature ? SIGNATURE_W_DEFAULT : 150));
    this._resizeStartHeight = rect
      ? rect.height / z
      : (ph.h || (ph.isSignature ? SIGNATURE_H_DEFAULT : PLACEHOLDER_H_DEFAULT));

    this._boundResizeMove = this.handleResizeMove.bind(this);
    this._boundResizeEnd = this.handleResizeEnd.bind(this);

    window.addEventListener("pointermove", this._boundResizeMove);
    window.addEventListener("pointerup", this._boundResizeEnd);
    window.addEventListener("pointercancel", this._boundResizeEnd);
  }

  handleResizeMove(event) {
    if (!this._resizing || !this._currentResizingPlaceholder) {
      return;
    }

    this.suppressNextClick = true;

    const ph = this._currentResizingPlaceholder;
    const z = this._getZoom();
    const deltaX = (event.clientX - this._resizeStartX) / z;
    const deltaY = (event.clientY - this._resizeStartY) / z;
    const metrics = this._getPageMetrics(ph.page);
    if (!metrics) {
      return;
    }

    if (ph.isSignature) {
      let newW = this._resizeStartWidth + deltaX;
      let newH = this._resizeStartHeight + deltaY;

      const maxW = metrics.width - ph.x;
      const maxH = metrics.height - ph.y;

      newW = Math.max(SIGNATURE_MIN_W, Math.min(newW, maxW));
      newH = Math.max(SIGNATURE_MIN_H, Math.min(newH, maxH));

      ph.w = Math.round(newW);
      ph.h = Math.round(newH);

      ph.combinedStyle = `
          top:${ph.y}px;
          left:${ph.x}px;
          position:absolute;
          border:3px dashed ${ph.recipientColor || "#0070d2"};
          border-radius:8px;
          width:${ph.w}px;
          height:${ph.h}px;
      `;
    } else {
      let newWidth = this._resizeStartWidth + deltaX;
      const maxWidth = metrics.width - ph.x;
      newWidth = Math.max(100, Math.min(newWidth, maxWidth));

      ph.w = Math.round(newWidth);

      ph.combinedStyle = `
          top:${ph.y}px;
          left:${ph.x}px;
          position:absolute;
          border:3px dashed ${ph.recipientColor || "#0070d2"};
          border-radius:8px;
          width:${ph.w}px;
          ${ph.h ? `height:${ph.h}px;` : ""}
      `;
    }

    this.placeholders = [...this.placeholders];
  }

  handleResizeEnd(event) {
    if (!this._resizing) {
      return;
    }
    this.suppressNextClick = true;

    const ph = this._currentResizingPlaceholder;
    if (ph) {
      const metrics = this._getPageMetrics(ph.page);
      const pagePt = this.getPageDimensions(ph.page);
      if (metrics && pagePt) {
        if (ph.isSignature) {
          const u = pagePt.w / metrics.width;
          ph.wPt = ph.w * u;
          ph.hPt = ph.h * u;
        } else {
          ph.wPt = (ph.w / metrics.width) * pagePt.w;
          if (Number.isFinite(ph.h)) {
            ph.hPt = (ph.h / metrics.height) * pagePt.h;
          }
        }
      }

      ph.combinedStyle = `
          top:${ph.y}px;
          left:${ph.x}px;
          position:absolute;
          border:3px dashed ${ph.recipientColor || "#0070d2"};
          border-radius:8px;
          width:${ph.w}px;
          ${ph.h ? `height:${ph.h}px;` : ""}
      `;

      this._commitPlaceholderPosition(ph);
    }

    if (this._resizeTarget && this._resizeTarget.releasePointerCapture && this._resizePointerId != null) {
      try {
        this._resizeTarget.releasePointerCapture(this._resizePointerId);
      } catch (_) {}
    }
    this._resizeTarget = null;
    this._resizePointerId = null;

    this._resizing = false;
    this._currentResizingPlaceholder = null;

    window.removeEventListener("pointermove", this._boundResizeMove);
    window.removeEventListener("pointerup", this._boundResizeEnd);
    window.removeEventListener("pointercancel", this._boundResizeEnd);
  }

  handleRearrangeStart(event) {
    event.preventDefault();
    event.stopPropagation();

    const id =
      event.currentTarget?.dataset?.id ||
      event.target?.dataset?.id;

    if (!id) {
      return;
    }

    const ph = this.placeholders.find(
      p => p.id === parseInt(id, 10)
    );

    if (!ph) {
      return;
    }

    this.isPlaceholderDragging = false;

    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this._dragging = true;
    this.currentDraggedPlaceholder = ph;

    const el = this.template.querySelector(
      `[data-id="${id}"]`
    );

    const box = el?.getBoundingClientRect();
    const z = this._getZoom();
    const isSig = ph.isSignature || ph.type === 'Signature';

    this._dragW =
      ph.w || (box?.width != null ? box.width / z : (isSig ? SIGNATURE_W_DEFAULT : PLACEHOLDER_W_DEFAULT));

    this._dragH =
      ph.h || (box?.height != null ? box.height / z : (isSig ? SIGNATURE_H_DEFAULT : PLACEHOLDER_H_DEFAULT));

    if (el) {
      el.classList.add('placeholder-dragging');
    }

    window.addEventListener(
      "mousemove",
      this.handleRearrangeMove
    );

    window.addEventListener(
      "mouseup",
      this.handleRearrangeEnd
    );
  }

  suppressNextClick = false;
  handleRearrangeMove = (event) => {

    if (!this._dragging || event.buttons === 0) {
      this.handleRearrangeEnd();
      return;
    }

    const dragDistance = Math.sqrt(
      Math.pow(
        event.clientX - this.dragStartX,
        2
      ) +
      Math.pow(
        event.clientY - this.dragStartY,
        2
      )
    );

    if (dragDistance > 5) {
      this.isPlaceholderDragging = true;
      this.suppressNextClick = true;
    }

    const ph = this.currentDraggedPlaceholder;

    if (!ph) {
      return;
    }

    const m = this._getPageMetrics(ph.page);

    if (!m) {
      return;
    }

    const z = this._getZoom();

    let x =
      (event.clientX - m.left) / z -
      this._dragW / 2;

    let y =
      (event.clientY - m.top) / z -
      this._dragH / 2;

    const mySize = this._getSize(ph);

    ({ x, y } = this._clampToRect(
      x,
      y,
      m.width,
      m.height,
      mySize.w,
      mySize.h
    ));

    const free = this._findFreeSpot(
      x,
      y,
      mySize.w,
      mySize.h,
      m.width,
      m.height,
      ph.page,
      ph.id
    );

    x = free.x;
    y = free.y;

    ph.x = x;
    ph.y = y;

    ph.combinedStyle = `
        top:${y}px;
        left:${x}px;
        position:absolute;
        border:3px dashed ${ph.recipientColor || "#0070d2"};
        border-radius:8px;
        ${ph.w ? `width:${ph.w}px;` : ""}
        ${ph.h ? `height:${ph.h}px;` : ""}
    `;

    this.placeholders = [...this.placeholders];
  };
  handleRearrangeEnd = () => {

    if (!this._dragging) {
      return;
    }

    const ph = this.currentDraggedPlaceholder;

    if (ph) {

      const container =
        this.template.querySelector(
          `[data-id="${ph.id}"]`
        );

      if (container) {
        container.classList.remove(
          'placeholder-dragging'
        );
      }

      const pagePt = this.getPageDimensions(ph.page);
      if (pagePt) {
        const m = this._getPageMetrics(ph.page);
        if (m) {
          ph.xPt =
            (ph.x / m.width) *
            pagePt.w;

          ph.yPt =
            (ph.y / m.height) *
            pagePt.h;
        }
      }

      ph.combinedStyle = `
            top:${ph.y}px;
            left:${ph.x}px;
            position:absolute;
            border:3px dashed ${ph.recipientColor || "#0070d2"};
            border-radius:8px;
            ${ph.w ? `width:${ph.w}px;` : ""}
            ${ph.h ? `height:${ph.h}px;` : ""}
        `;

      this._commitPlaceholderPosition(ph);
    }

    if (this.isPlaceholderDragging) {
      this.suppressNextClick = true;
    }

    this._dragging = false;
    this._dragButton = undefined;
    this.currentDraggedPlaceholder = null;
    this._dragW = undefined;
    this._dragH = undefined;

    window.removeEventListener(
      "mousemove",
      this.handleRearrangeMove
    );

    window.removeEventListener(
      "mouseup",
      this.handleRearrangeEnd
    );

    window.removeEventListener(
      "pointerup",
      this.handleRearrangeEnd
    );

    window.removeEventListener(
      "mouseleave",
      this.handleRearrangeEnd
    );

    window.removeEventListener(
      "blur",
      this.handleRearrangeEnd
    );
  };


  deletePlaceholder(event) {
    event.stopPropagation();
    const id = parseInt(event.target.dataset.id, 10);
    this.placeholders = this.placeholders.filter((item) => item.id !== id);
  }

  handlePlaceholderInputChange(event) {
    const id = parseInt(event.target.dataset.id, 10);
    const placeholder = this.placeholders.find((item) => item.id === id);
    if (placeholder) {
      placeholder.value = event.target.value;
    }
  }

  handleUploadSignature(event) {
    const id = parseInt(event.target.dataset.id, 10);
    const placeholder = this.placeholders.find((item) => item.id === id);
    if (placeholder) {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/png, image/jpeg";
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        placeholder.value = file.name;
        alert("Signature uploaded: " + file.name);
      });
      fileInput.click();
    }
  }

  renderPlaceholder(placeholder) {
    const container = document.createElement("div");
    container.classList.add("placeholder-container");
    container.style.position = "absolute";
    container.style.left = `${placeholder.x}px`;
    container.style.top = `${placeholder.y}px`;

    if (placeholder.type === "Name") {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Enter Name";
      container.appendChild(input);
    } else if (placeholder.type === "Signature") {
      const uploadButton = document.createElement("button");
      uploadButton.textContent = "Upload Signature";
      container.appendChild(uploadButton);
    }

    this.template.querySelector(".pdf-viewer-container").appendChild(container);
  }

  _validateOrAutoAssignRecipients() {
    const validRecipients = (this.recipientEmails || []).filter((r) => r && r.email && r.email.trim());
    let singleEmail = null;
    let singleColor = '#0070d2';
    if (this.isOnlySigner && this._onlySignerEmail) {
      singleEmail = this._onlySignerEmail.trim();
      singleColor = '#0070d2';
    } else if (validRecipients.length === 1) {
      singleEmail = validRecipients[0].email.trim();
      singleColor = validRecipients[0].color || '#0070d2';
    }

    if (singleEmail) {
      let autoAssignedCount = 0;
      this.placeholders = (this.placeholders || []).map((ph) => {
        if (!ph.isConfig && (!ph.recipient || !ph.recipient.trim())) {
          autoAssignedCount++;
          return {
            ...ph,
            recipient: singleEmail,
            recipientColor: singleColor
          };
        }
        return ph;
      });
      if (autoAssignedCount > 0) {
        console.log(`[CREATOR] Auto-assigned ${autoAssignedCount} blank field(s) to single recipient: ${singleEmail}`);
        if (typeof this.refreshPlaceholderColors === 'function') {
          this.refreshPlaceholderColors();
        }
      }
    }

    const unassigned = (this.placeholders || []).filter(
      (p) => !p.isConfig && (!p.recipient || !p.recipient.trim())
    );

    if (unassigned.length > 0) {
      const details = unassigned
        .slice(0, 3)
        .map((p) => `page ${p.page || 1}: ${p.type || 'Field'}`)
        .join(', ');
      const extra = unassigned.length > 3 ? ` and ${unassigned.length - 3} more` : '';
      this.showToast(
        'Error',
        `${unassigned.length} field(s) have no recipient assigned (${details}${extra}). Please assign a recipient before sending.`,
        'error'
      );
      unassigned.forEach((p) => {
        const node = this.template.querySelector(`.placeholder-container[data-id="${p.id}"]`);
        if (node) {
          node.style.outline = '3px solid #ba0517';
          node.style.boxShadow = '0 0 8px rgba(186, 5, 23, 0.6)';
          setTimeout(() => {
            node.style.outline = '';
            node.style.boxShadow = '';
          }, 4000);
        }
      });
      const firstNode = this.template.querySelector(`.placeholder-container[data-id="${unassigned[0].id}"]`);
      if (firstNode) {
        firstNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  }

  showConfirmationPopup() {
    // Validate Document Type selection
    if (!this.selectedDocumentTypeId) {
      this.showToast(
        "Error",
        "Please select a Document Type before saving the template.",
        "error"
      );
      return;
    }

    // Check if at least one valid email is entered
    const hasEmail = this.recipientEmails.some(
      (recipient) => recipient.email && recipient.email.trim() !== ""
    );

    if (!hasEmail) {
      // If no email is entered, show a toast or an alert
      this.showToast(
        "Error",
        "Please add at least one recipient email before sending the document.",
        "error"
      );
      return;
    }

    // Validate that all placeholders have assigned recipients or auto-assign if single recipient
    if (!this._validateOrAutoAssignRecipients()) {
      return;
    }

    // Check if each recipient with an email has at least one placeholder assigned
    for (const recipient of this.recipientEmails) {
      if (recipient.email && recipient.email.trim() !== "") {
        const emailLower = recipient.email.trim().toLowerCase();
        const hasPlaceholder = (this.placeholders || []).some(
          (p) => p.recipient && p.recipient.trim().toLowerCase() === emailLower
        );
        if (!hasPlaceholder) {
          this.showToast(
            "Error",
            `Please assign at least one placeholder for ${recipient.email} before sending the document.`,
            "error"
          );
          return;
        }
      }
    }

    // Proceed to show the confirmation popup
    this.isConfirmationPopupVisible = true;
  }

  // Close the confirmation popup
  closeConfirmationPopup() {
    this.isConfirmationPopupVisible = false;
    this.confirmationPopupMode = 'send';
    this.recipientToRemoveIndex = null;
    this.selectedReassignRecipientKey = null;
  }

  // Handle the "Send" button in the confirmation popup
  handleSendConfirmation() {
    console.log("Document sent for signature.");

    // Proceed with sending the document
    this.handleSavePlaceholders();

    // Close the confirmation popup
    this.isConfirmationPopupVisible = false;
    this.isLoadingCircle = true;
  }

  handleSavePlaceholders() {
    if (!this._validateOrAutoAssignRecipients()) {
      return;
    }
    const dataToSave = [...this.placeholders];
    const placeholderData = JSON.stringify(dataToSave);
    const emails = this.recipientEmails
      .map((recipient) => recipient.email)
      .join("\n");

    savePlaceholders({
      recordId: this.recordId,
      placeholderJSON: placeholderData,
      documentTypeId: this.selectedDocumentTypeId || null
    })
      .then(() => {
        // Once placeholders are saved, save emails
        saveEmailsToBackend({
          recordId: this.recordId,
          emails: emails,
          newJoineeEmail: this.recipientEmails[0].email,
          names: this.recipientNames
        })
          .then(() => {
            console.log("Placeholders and emails saved successfully!");
            setTimeout(() => {
              this.handleFinish();
            }, 1000);
          })

          .catch((error) => {
            console.error("Error saving emails:", error);
            this.showToast("Error", "Failed to save emails.", "error");
          });
      })
      .catch((error) => {
        console.error("Error saving placeholders:", error);
        this.showToast("Error", "Failed to save placeholders.", "error");
      });
  }



  retrievePlaceholders() {
    getPlaceholders({ recordId: this.recordId })
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data);
          let placeholdersArray = [];
          if (Array.isArray(parsed)) {
            const configItem = parsed.find(p => p.isConfig);
            if (configItem) {
              if (!this.customFields || this.customFields.length === 0) {
                this.customFields = (configItem.customFields || []).map(cf => ({
                  ...cf,
                  id: cf.id || null,
                  icon: this.getCustomFieldIcon(cf.dataType)
                }));
              }
              placeholdersArray = parsed.filter(p => !p.isConfig);
            } else {
              placeholdersArray = parsed;
            }
          }
          this.placeholders = placeholdersArray.map((placeholder) => {
            const isSig = placeholder.isSignature || placeholder.type === 'Signature';
            const w = placeholder.w || (isSig ? SIGNATURE_W_DEFAULT : undefined);
            const h = placeholder.h || (isSig ? SIGNATURE_H_DEFAULT : undefined);
            if (isSig) {
              placeholder.isSignature = true;
              placeholder.w = w;
              placeholder.h = h;
              if (placeholder.wPt == null || placeholder.hPt == null) {
                const pagePt = this.getPageDimensions?.(placeholder.page || 1);
                const u = pagePt ? (pagePt.w / 1024) : 1;
                if (placeholder.wPt == null && w != null) placeholder.wPt = w * u;
                if (placeholder.hPt == null && h != null) placeholder.hPt = h * u;
              }
            }
            if (placeholder.isCustom) {
              placeholder.isCustomText = placeholder.dataType === 'Text';
              placeholder.isCustomLongText = placeholder.dataType === 'Long Text';
              placeholder.isCustomNumber = placeholder.dataType === 'Number';
              placeholder.isCustomCurrency = placeholder.dataType === 'Currency';
              placeholder.isCustomDate = placeholder.dataType === 'Date';
              placeholder.isCustomEmail = placeholder.dataType === 'Email';
              placeholder.isCustomPhone = placeholder.dataType === 'Phone';
              placeholder.isCustomBoolean = placeholder.dataType === 'Boolean';
              placeholder.isCustomPicklist = placeholder.dataType === 'Picklist';
              placeholder.checkedValue = placeholder.value === 'true';
            }
            if (placeholder.type === 'NameInitials') {
              placeholder.isNameInitials = true;
              placeholder.initialsSource = (placeholder.initialsSource === 'undefined' || placeholder.initialsSource == null) ? "" : placeholder.initialsSource;
            }
            return {
              ...placeholder,
              style: `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute;${w ? ` width:${w}px;` : ""}${h ? ` height:${h}px;` : ""}`,
              combinedStyle: `
                  top:${placeholder.y}px;
                  left:${placeholder.x}px;
                  position:absolute;
                  border:3px dashed ${placeholder.recipientColor || "#0070d2"};
                  border-radius:8px;
                  ${w ? `width:${w}px;` : ""}
                  ${h ? `height:${h}px;` : ""}
              `
            };
          });
          this._clearPlaceholderHistory();
        }
      })
      .catch((error) => {
        console.error("Error retrieving placeholders:", error);
        this.showToast("Error", "Failed to retrieve placeholders.", "error");
      });
  }

  refreshRecipientLabels() {
    this.recipientEmails = this.recipientEmails.map((recipient, index) => {
      const color =
        this.recipientColors[index % this.recipientColors.length];

      return {
        ...recipient,
        label: `${this.getOrdinal(index + 1)} Recipient`,
        color,
        colorStyle: `
                border: 3px dashed${color};
                border-radius: 8px;
            `,
        canRemove: index !== 0,
      };
    });
  }

  draggedRecipientElement;

  handleRecipientReorderStart(event) {
    this._closeSuggest();
    const draggedKey = event.currentTarget.dataset.index;

    this.activeRecipientDragKey = draggedKey;

    const row = event.currentTarget.closest(
      '.rcp-modal-row'
    ) || event.currentTarget.closest(
      '.recipient-table-row'
    );

    if (!row) {
      return;
    }

    this.draggedRecipientElement = row;

    row.classList.add('recipient-dragging');

    // Position drag image from the drag icon itself
    const rowRect = row.getBoundingClientRect();
    const iconRect = event.currentTarget.getBoundingClientRect();

    const offsetX =
      iconRect.left - rowRect.left + 8;

    const offsetY =
      iconRect.top - rowRect.top + 8;

    event.dataTransfer.setDragImage(
      row,
      offsetX,
      offsetY
    );

    event.dataTransfer.setData(
      'text/plain',
      draggedKey
    );

    event.dataTransfer.effectAllowed = 'move';

    console.log(
      'Started dragging recipient:',
      draggedKey
    );
  }
  handleRecipientReorderOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  handleRecipientReorderEnd() {
    if (this.draggedRecipientElement) {
      this.draggedRecipientElement.classList.remove(
        'recipient-dragging'
      );
    }

    this.draggedRecipientElement = null;
    this.activeRecipientDragKey = null;
  }

  handleRecipientReorderDrop(event) {
    event.preventDefault();

    const targetKey = event.currentTarget.dataset.index;

    if (
      !this.activeRecipientDragKey ||
      this.activeRecipientDragKey === targetKey
    ) {
      return;
    }

    const recipients = [...this.recipientEmails];

    const sourceIndex = recipients.findIndex(
      recipient =>
        String(recipient.key) ===
        String(this.activeRecipientDragKey)
    );

    const targetIndex = recipients.findIndex(
      recipient =>
        String(recipient.key) ===
        String(targetKey)
    );

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    // Remove dragged recipient
    const [draggedRecipient] =
      recipients.splice(sourceIndex, 1);

    // Insert at target position
    recipients.splice(
      targetIndex,
      0,
      draggedRecipient
    );

    // Update list
    this.recipientEmails = [...recipients];
    this.currentRecipient = this.recipientEmails[0]?.email || "";

    // Recalculate labels/colors
    this.refreshRecipientLabels();
    this.refreshPlaceholderColors();

    // Remove dragging visual state
    const draggingElement =
      this.template.querySelector(
        '.recipient-dragging'
      );

    if (draggingElement) {
      draggingElement.classList.remove(
        'recipient-dragging'
      );
    }

    // Add smooth reorder animation
    requestAnimationFrame(() => {
      const rows =
        this.template.querySelectorAll(
          '.recipient-input-row'
        );

      rows.forEach(row => {
        row.classList.add(
          'recipient-reordered'
        );

        setTimeout(() => {
          row.classList.remove(
            'recipient-reordered'
          );
        }, 300);
      });
    });

    this.activeRecipientDragKey = null;

    console.log(
      'Recipient order updated:',
      JSON.stringify(this.recipientEmails)
    );
  }

  addRecipient() {
    console.log("Add Recipient button clicked.");

    const newKey = this.nextRecipientKey;
    this.recipientEmails = [
      ...this.recipientEmails,
      {
        key: newKey,
        label: "",
        name: "",
        email: "",
        color: "",
        colorStyle: "",
        canRemove: true
      }
    ];

    this.nextRecipientKey += 1;

    this.refreshRecipientLabels();

    if (this.activeRecipientKey === null || this.activeRecipientKey === undefined) {
      this.activeRecipientKey = newKey;
    }

    console.log(
      "Updated recipientEmails:",
      JSON.stringify(this.recipientEmails)
    );
  }

  @wire(getRecord, { recordId: USER_ID, fields: [USER_NAME, USER_EMAIL] })
  wiredOnlySignerUser({ data, error }) {
    if (data) {
      this._onlySignerName = getFieldValue(data, USER_NAME) || '';
      this._onlySignerEmail = getFieldValue(data, USER_EMAIL) || '';
      this.isFetchingOnlySigner = false;
    } else if (error) {
      console.error('Error fetching current user info for only-signer:', error);
      this.isFetchingOnlySigner = false;
    }
  }

  handleOnlySignerChange(event) {
    const isChecked = event.target ? event.target.checked : event.detail.checked;
    if (isChecked) {
      if (!this._onlySignerName || !this._onlySignerName.trim() || !this._onlySignerEmail || !this._onlySignerEmail.trim()) {
        this.showToast('Error', 'Unable to fetch your user details. Please try again.', 'error');
        if (event.target) {
          event.target.checked = false;
        }
        this.isOnlySigner = false;
        return;
      }

      const firstRecipientEmail = this.recipientEmails && this.recipientEmails.length > 0 ? this.recipientEmails[0].email : null;
      const previousRecipientEmails = (this.recipientEmails || []).map(r => r.email);

      const thatRecipient = {
        key: this.nextRecipientKey,
        label: '',
        name: this._onlySignerName,
        email: this._onlySignerEmail,
        color: '',
        colorStyle: '',
        canRemove: false
      };

      this.recipientEmails = [thatRecipient];
      this.nextRecipientKey += 1;
      this.refreshRecipientLabels();

      this.activeRecipientKey = thatRecipient.key;
      this.currentRecipient = this._onlySignerEmail;
      this.isRecipientDropdownOpen = false;

      let reassignedCount = 0;
      if (Array.isArray(this.placeholders)) {
        this.placeholders = this.placeholders.map(ph => {
          if (previousRecipientEmails.includes(ph.recipient)) {
            if (ph.recipient !== this._onlySignerEmail) {
              reassignedCount++;
            }
            return {
              ...ph,
              recipient: this._onlySignerEmail
            };
          }
          return ph;
        });
      }

      this.refreshPlaceholderColors();

      if (reassignedCount > 0) {
        this.showToast('Info', 'All placed fields have been assigned to you.', 'info');
      }

      this.isOnlySigner = true;
    } else {
      this.isOnlySigner = false;
    }
  }

  handleNameChange(event) {
    const key = parseInt(event.target.dataset.index, 10);
    const newName = event.target.value;

    console.log(
      `Name input changed for key: ${key}, new name: ${newName}`
    );

    this.recipientEmails = this.recipientEmails.map(recipient => {
      if (recipient.key === key) {
        return {
          ...recipient,
          name: newName
        };
      }
      return recipient;
    });

    console.log(
      "Updated recipientEmails with name:",
      JSON.stringify(this.recipientEmails)
    );

    if (!this.isOnlySigner) {
      this._queueSuggest(key, 'name', newName);
    }
  }

  get recipientNames() {
    return (this.recipientEmails || [])
      .map(recipient => (recipient.name || "").trim())
      .join("\n");
  }

  removeRecipient(event) {
    this._closeSuggest();
    const index = parseInt(event.currentTarget.dataset.index, 10);
    console.log(`Remove Recipient button clicked for key: ${index}`);

    const recipientToRemove = this.recipientEmails.find(r => r.key === index);
    if (!recipientToRemove) return;

    // Check if any placeholders are assigned to this recipient's email
    const emailToMatch = recipientToRemove.email;
    const assignedPlaceholders = this.placeholders.filter(p => p.recipient === emailToMatch);

    if (assignedPlaceholders.length > 0) {
      // Open confirmation modal
      this.confirmationPopupMode = 'removeRecipient';
      this.recipientToRemoveIndex = index;
      this.selectedReassignRecipientKey = null;
      this.isConfirmationPopupVisible = true;
    } else {
      // Continue with immediate removal logic
      this._executeRecipientRemoval(index);
    }
  }

  _executeRecipientRemoval(index) {
    if (this.activeRecipientKey === index) {
      this.activeRecipientKey = null;
    }

    this.recipientEmails = this.recipientEmails.filter(
      recipient => recipient.key !== index
    );

    // Keep first recipient non-removable
    this.recipientEmails = this.recipientEmails.map((recipient, idx) => ({
      ...recipient,
      canRemove: idx !== 0
    }));

    this.refreshRecipientLabels();
    this.refreshPlaceholderColors();

    console.log(
      "Updated recipientEmails after removal:",
      JSON.stringify(this.recipientEmails)
    );
  }

  handleReassignRecipientChange(event) {
    const val = event.detail.value;
    this.selectedReassignRecipientKey = val ? String(val) : null;
  }

  handleDeleteRecipientAndPlaceholders() {
    if (this.recipientToRemoveIndex === null || this.recipientToRemoveIndex === undefined) return;
    const recipientToRemove = this.recipientEmails.find(r => r.key === this.recipientToRemoveIndex);
    if (recipientToRemove) {
      // Remove all placeholders assigned to this recipient
      this.placeholders = this.placeholders.filter(p => p.recipient !== recipientToRemove.email);
      // Remove recipient
      this._executeRecipientRemoval(this.recipientToRemoveIndex);
    }
    this.closeConfirmationPopup();
  }

  handleReassignAndRemoveRecipient() {
    if (this.recipientToRemoveIndex === null || this.recipientToRemoveIndex === undefined) return;
    if (this.selectedReassignRecipientKey === null || this.selectedReassignRecipientKey === undefined) return;

    const recipientToRemove = this.recipientEmails.find(r => r.key === this.recipientToRemoveIndex);
    const targetRecipient = this.recipientEmails.find(r => String(r.key) === String(this.selectedReassignRecipientKey));

    if (recipientToRemove && targetRecipient) {
      const targetEmail = targetRecipient.email || "";
      const targetColor = targetRecipient.color || "#0070d2";

      // Reassign all placeholders of the removed recipient to the target recipient
      this.placeholders = this.placeholders.map(ph => {
        if (ph.recipient === recipientToRemove.email) {
          const w = ph.w;
          const combinedStyle = `
              top:${ph.y}px;
              left:${ph.x}px;
              position:absolute;
              border:3px dashed ${targetColor};
              border-radius:8px;
              ${w ? `width:${w}px;` : ""}
              ${ph.h ? `height:${ph.h}px;` : ""}
          `;
          return {
            ...ph,
            recipient: targetEmail,
            recipientColor: targetColor,
            combinedStyle
          };
        }
        return ph;
      });

      // Remove original recipient
      this._executeRecipientRemoval(this.recipientToRemoveIndex);
    }
    this.closeConfirmationPopup();
  }

  refreshPlaceholderColors() {
    if (!this.recipientEmails || this.recipientEmails.length === 0) return;
    this.placeholders = this.placeholders.map(ph => {
      const recipientInfo = this.recipientEmails.find(r => r.email === ph.recipient);
      const recipientColor = recipientInfo?.color || "#0070d2";

      const w = ph.w;
      const combinedStyle = `
          top:${ph.y}px;
          left:${ph.x}px;
          position:absolute;
          border:3px dashed ${recipientColor};
          border-radius:8px;
          ${w ? `width:${w}px;` : ""}
          ${ph.h ? `height:${ph.h}px;` : ""}
      `;
      return {
        ...ph,
        recipientColor,
        combinedStyle
      };
    });
  }

  _applyRecipientEmail(key, newEmail) {
    const recipientToUpdate = (this.recipientEmails || []).find(r => r.key === key);
    const linkedEmail = (recipientToUpdate?.placeholderEmail ?? recipientToUpdate?.email ?? "").trim();
    const typed = (newEmail || "").trim();

    const isDuplicate = this.recipientEmails.some(
      recipient =>
        recipient.email?.toLowerCase() === newEmail?.toLowerCase() &&
        recipient.key !== key
    );

    if (isDuplicate) {
      this.showToast(
        "Error",
        "Duplicate email is not allowed.",
        "error"
      );
      return false;
    }

    this.recipientEmails = this.recipientEmails.map(recipient => {
      if (recipient.key === key) {
        return {
          ...recipient,
          email: newEmail,
          placeholderEmail: typed ? newEmail : (recipient.placeholderEmail ?? recipient.email ?? "")
        };
      }
      return recipient;
    });

    if (linkedEmail && typed && linkedEmail !== newEmail) {
      const targetEmailLower = linkedEmail.toLowerCase();
      if (Array.isArray(this.placeholders)) {
        this.placeholders = this.placeholders.map(p => {
          const rec = (p.recipient || "").trim();
          if (rec && rec.toLowerCase() === targetEmailLower) {
            return { ...p, recipient: newEmail };
          }
          return p;
        });
      }
      if (this._redoByPage && typeof this._redoByPage === "object") {
        const nextRedo = {};
        for (const [page, list] of Object.entries(this._redoByPage)) {
          if (Array.isArray(list)) {
            nextRedo[page] = list.map(p => {
              const rec = (p.recipient || "").trim();
              if (rec && rec.toLowerCase() === targetEmailLower) {
                return { ...p, recipient: newEmail };
              }
              return p;
            });
          } else {
            nextRedo[page] = list;
          }
        }
        this._redoByPage = nextRedo;
      }
    }

    this.currentRecipient = this.recipientEmails[0]?.email || "";

    // Toggle active recipient on for the 1st recipient when entering email
    if (this.recipientEmails.length > 0 && this.recipientEmails[0].key === key) {
      if (newEmail && this.activeRecipientKey !== key) {
        this.activeRecipientKey = key;
      }
    }

    console.log(
      "Updated recipientEmails:",
      JSON.stringify(this.recipientEmails)
    );

    return true;
  }

  handleEmailChange(event) {
    const key = parseInt(event.target.dataset.index, 10);
    const newEmail = event.target.value;

    console.log(
      `Email input changed for key: ${key}, new email: ${newEmail}`
    );

    this._applyRecipientEmail(key, newEmail);

    if (!this.isOnlySigner) {
      this._queueSuggest(key, 'email', newEmail);
    }
  }

  _queueSuggest(rowKey, field, value) {
    if (this.isOnlySigner || !this.orgid) {
      return;
    }

    if (this._suggestTimer) {
      clearTimeout(this._suggestTimer);
      this._suggestTimer = null;
    }

    const trimmed = (value || '').trim();
    if (trimmed.length < 2) {
      this._closeSuggest();
      return;
    }

    this._suggestTimer = setTimeout(() => {
      this._suggestTimer = null;
      const seq = ++this._suggestSeq;
      const cacheKey = `${this.orgid}_${trimmed.toLowerCase()}`;

      const processResults = (rawResults) => {
        if (seq !== this._suggestSeq) {
          return;
        }

        const results = Array.isArray(rawResults) ? rawResults : [];
        console.log('[SUGGEST] results', results.length);

        const otherEmails = new Set(
          (this.recipientEmails || [])
            .filter(r => r.key !== rowKey && r.email)
            .map(r => r.email.trim().toLowerCase())
        );

        const filtered = results.filter(
          contact => contact && contact.email && !otherEmails.has(contact.email.trim().toLowerCase())
        );

        if (filtered.length > 0) {
          this.suggestions = filtered;
          this.suggestRowKey = rowKey;
          this.suggestField = field;
          this.suggestActiveIndex = 0;
          this.suggestOpenUp = false;
          this._updateSuggestPosition(rowKey, field);

          requestAnimationFrame(() => {
            this._updateSuggestPosition(rowKey, field);
          });
        } else {
          this._closeSuggest();
        }
      };

      if (this._suggestCache && this._suggestCache.has(cacheKey)) {
        processResults(this._suggestCache.get(cacheKey));
      } else {
        searchContacts({ searchTerm: trimmed, orgId: this.orgid })
          .then((data) => {
            if (this._suggestCache) {
              this._suggestCache.set(cacheKey, data);
            }
            processResults(data);
          })
          .catch(() => {
            console.error('[SUGGEST] error searching contacts');
            this._closeSuggest();
          });
      }
    }, 300);
  }

  _updateSuggestPosition(rowKey, field) {
    if (rowKey === null || !field) {
      this.suggestStyle = '';
      return;
    }
    const selector = field === 'name'
      ? `.rcp-name-input-wrapper lightning-input[data-index="${rowKey}"]`
      : `.recipient-input-wrapper lightning-input[data-index="${rowKey}"]`;
    const inputEl = this.template.querySelector(selector);
    if (inputEl) {
      const rect = inputEl.getBoundingClientRect();
      this.suggestStyle = `position: fixed; top: ${Math.round(rect.bottom + 4)}px; left: ${Math.round(rect.left)}px; width: ${Math.round(rect.width)}px; z-index: 99999;`;
    }
  }

  handleModalBodyScroll() {
    if (this.suggestRowKey !== null && this.suggestField) {
      const modalBodyEl = this.template.querySelector('.rcp-modal-body');
      const selector = this.suggestField === 'name'
        ? `.rcp-name-input-wrapper lightning-input[data-index="${this.suggestRowKey}"]`
        : `.recipient-input-wrapper lightning-input[data-index="${this.suggestRowKey}"]`;
      const inputEl = this.template.querySelector(selector);
      if (modalBodyEl && inputEl) {
        const bRect = modalBodyEl.getBoundingClientRect();
        const iRect = inputEl.getBoundingClientRect();
        if (iRect.bottom < bRect.top || iRect.top > bRect.bottom) {
          this._closeSuggest();
          return;
        }
      }
      this._updateSuggestPosition(this.suggestRowKey, this.suggestField);
    }
  }

  _computeSuggestOpenUp() {
    return false;
  }

  _closeSuggest() {
    if (this._suggestTimer) {
      clearTimeout(this._suggestTimer);
      this._suggestTimer = null;
    }
    this.suggestions = [];
    this.suggestRowKey = null;
    this.suggestField = null;
    this.suggestActiveIndex = -1;
    this.suggestOpenUp = false;
    this.suggestStyle = '';
  }

  _pickContact(rowKey, contact) {
    if (!contact) return;

    const prevRecipient = (this.recipientEmails || []).find(r => r.key === rowKey);
    const prevName = prevRecipient ? prevRecipient.name : "";

    // 1) Set row name = displayName
    this.recipientEmails = this.recipientEmails.map(recipient => {
      if (recipient.key === rowKey) {
        return {
          ...recipient,
          name: contact.displayName
        };
      }
      return recipient;
    });

    // 2) Apply email, reverting name if duplicate
    const applied = this._applyRecipientEmail(rowKey, contact.email);
    if (!applied) {
      this.recipientEmails = this.recipientEmails.map(recipient => {
        if (recipient.key === rowKey) {
          return {
            ...recipient,
            name: prevName
          };
        }
        return recipient;
      });
      this._closeSuggest();
      return;
    }

    // 3) Close dropdown
    this._closeSuggest();

    // 4) Make the row's Name and Email inputs show the new values
    const nameInput = this.template.querySelector(`.rcp-name-input-wrapper lightning-input[data-index="${rowKey}"]`);
    if (nameInput) {
      nameInput.value = contact.displayName;
    }
    const emailInput = this.template.querySelector(`.recipient-input-wrapper lightning-input[data-index="${rowKey}"]`);
    if (emailInput) {
      emailInput.value = contact.email;
    }
  }

  handleSuggestPick(event) {
    event.preventDefault();
    const itemIndex = parseInt(event.currentTarget.dataset.index, 10);
    const rowKey = parseInt(event.currentTarget.dataset.row, 10);
    const contact = (this.suggestions || [])[itemIndex];
    if (contact) {
      this._pickContact(rowKey, contact);
    }
  }

  handleSuggestKeydown(event) {
    const rowKey = parseInt(event.target.dataset.index, 10);
    const field = event.target.dataset.field;

    if (
      this.suggestRowKey !== rowKey ||
      this.suggestField !== field ||
      !this.suggestions ||
      this.suggestions.length === 0
    ) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.suggestActiveIndex = (this.suggestActiveIndex + 1) % this.suggestions.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.suggestActiveIndex = (this.suggestActiveIndex - 1 + this.suggestions.length) % this.suggestions.length;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.suggestActiveIndex >= 0 && this.suggestActiveIndex < this.suggestions.length) {
        const contact = this.suggestions[this.suggestActiveIndex];
        this._pickContact(rowKey, contact);
      }
    } else if (event.key === 'Escape') {
      this._closeSuggest();
    }
  }

  handleSuggestBlur(event) {
    setTimeout(() => {
      this._closeSuggest();
    }, 150);
  }



  // handleFinish() {
  //   console.log("Record ID:", this.recordId);
  //   console.log("Current Email:", this.currentRecipient);

  //   if (this.recordId && this.currentRecipient) {
  //     startEmailSequence({ recordId: this.recordId })
  //       .then((result) => {
  //         console.log("Email Sequence Started:", result);
  //         this.updateCurrentRecipient(this.currentRecipient);
  //       })
  //       .catch((error) => {
  //         console.error(
  //           "Failed to initiate email sequence:",
  //           error.body?.message || error.message
  //         );
  //       });
  //   } else {
  //     console.error("Record ID and Current Email are required.");
  //   }
  //   this.isLoadingCircle = false;

  //   this.showSuccessScreen = true; // Show the success screen
  // }

  // handleFinish() {
  //   const firstRecipientEmail = (this.recipientEmails[0]?.email || "").trim();
  //   this.currentRecipient = firstRecipientEmail;

  //   console.log("Record ID:", this.recordId);
  //   console.log("Current Email:", this.currentRecipient);

  //   if (!this.recordId || !this.currentRecipient) {
  //     console.error("Record ID and Current Email are required.");
  //     return;
  //   }

  //   this.isLoadingCircle = true;

  //   startEmailSequence({ recordId: this.recordId })
  //     .then((result) => {
  //       console.log("Email Sequence Started:", result);

  //       console.log("Updating recipient with:");
  //       console.log("recordId =", this.recordId);
  //       console.log("currentRecipient =", this.currentRecipient);

  //       return this.updateCurrentRecipient(this.currentRecipient);
  //     })
  //     .then(() => {
  //       console.log("Recipient updated successfully.");

  //       this.isLoadingCircle = false;
  //       this.showSuccessScreen = true;
  //     })
  //     .catch((error) => {
  //       this.isLoadingCircle = false;

  //       console.error(
  //         "Error:",
  //         JSON.stringify(error)
  //       );
  //     });
  // }
    handleFinish() {
    const firstRecipientEmail = (this.recipientEmails[0]?.email || "").trim();
    this.currentRecipient = firstRecipientEmail;

    console.log("Record ID:", this.recordId);
    console.log("Current Email:", this.currentRecipient);

    if (!this.recordId || !this.currentRecipient) {
      console.error("Record ID and Current Email are required.");
      return;
    }

    this.isLoadingCircle = true;

    startEmailSequence({ recordId: this.recordId })
      .then((result) => {
        console.log("Email Sequence Started:", result);

        // ---- OLD CODE (commented out) ----
        // This second update cleared Current_Recipient_Status__c (no status passed),
        // which fired the status trigger again and sent a duplicate status mail.
        // console.log("Updating recipient with:");
        // console.log("recordId =", this.recordId);
        // console.log("currentRecipient =", this.currentRecipient);
        //
        // return this.updateCurrentRecipient(this.currentRecipient);
        // })
        // .then(() => {
        //   console.log("Recipient updated successfully.");
        //
        //   this.isLoadingCircle = false;
        //   this.showSuccessScreen = true;
        // ---- END OLD CODE ----

        // ---- NEW CODE ----
        // startEmailSequence already sets Current Recipient + 'Pending',
        // so no second update is needed -> only one status mail is sent.
        this.isLoadingCircle = false;
        this.showSuccessScreen = true;
        // ---- END NEW CODE ----
      })
      .catch((error) => {
        this.isLoadingCircle = false;

        console.error(
          "Error:",
          JSON.stringify(error)
        );
      });
  }

  handleCloseScreen() {
    console.log("✅ Closing success screen and resetting state...");
    this.resetComponentState();
    this.dispatchEvent(new CustomEvent("resetfromchild"));
  }


  handleReset() {
    const finishReset = () => {

      this.resetComponentState();
      this.dispatchEvent(new CustomEvent("resetfromchild"));
    };

    if (this.recordId) {
      deleteOfferTemplate({ recordId: this.recordId })
        .then(() => {
          console.log("✅ Reset successfully.");
          finishReset();
        })
        .catch((error) => {
          console.error("❌ Failed to delete record:", error);
          this.showToast("Error", "Failed to delete record.", "error");
          finishReset(); // Even on error, reset the UI
        });

      if (this.key) {
        this.deleteFile(this.key);
      }
    } else {
      finishReset();
    }
  }

    async deleteFile(key) {
    const keys = [key, this.sourceKey].filter(k => !!k);

    if (!keys.length) {
      console.error('[DELETE] key is required');
      return;
    }

    try {
      const result = this.useDocApi
        ? await deleteDocFiles({ keys })
        : await deleteAwsFiles({ keys });
      this._logDeleteResult(keys, result);

      if (result?.debugError || result?.error) {
        this.showToast('Error', 'Delete failed: ' + (result.debugError || result.error), 'error');
        return;
      }

      this.key = '';
      this.sourceKey = null;
    } catch (e) {
      console.error('[DELETE] Apex error:', e?.body?.message || e?.message || JSON.stringify(e));
    }
  }

  _logDeleteResult(keys, result) {
    console.log('[DELETE] keys sent      :', JSON.stringify(keys));
    console.log('[DELETE] endpoint       :', result?.debugEndpoint);
    console.log('[DELETE] request body   :', result?.debugRequest);
    console.log('[DELETE] HTTP status    :', result?.debugStatusCode, result?.debugStatus);
    console.log('[DELETE] response body  :', result?.debugResponse);
    console.log('[DELETE] error          :', result?.debugError || 'none');
    console.log('[DELETE] per-file       :', JSON.stringify(result?.results || []));
  }
  resetComponentState() {
    this._usingServerPages = false;
    this._pageImagesSettled = new Map();
    this._thumbImagesSettled = new Map();
    this._hasLoggedPage1 = false;
    this._hasLoggedAllPages = false;
    this._hasLoggedAllThumbs = false;
    if (this._perfTimeoutId) {
      clearTimeout(this._perfTimeoutId);
      this._perfTimeoutId = null;
    }
    this._perf = null;

    this._resetGuide();
    this._thumbGenId = (this._thumbGenId || 0) + 1;
    this.thumbnailSrcByPage = {};
    this._hasGeneratedThumbnails = false;
    this._lastThumbSyncedPage = null;
    this._isGeneratingThumbnails = false;
    this.zoomLevel = 1;
    this.activeRecipientKey = null;
    this.selectedDocumentTypeId = "";
    this.selectedDocumentType = "";
    this.searchKeyword = "";
    this.showSuccessScreen = false;
    this.fileName = "";
    this.selectedFile = null;
    this.isFileAttached = false;
    this.isFileUploaded = false;

    this.awsUrl = "";
    this.base64FileData = "";

    this.pdfDoc = null;
    this.pdfLoaded = false;
    this.placeholders = [];
    this._clearPlaceholderHistory();
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }
    this._pageVisibilityMap = new Map();
    this.pagesData = [];
    this.imageSrcs = [];
    this.imageSrc = "";

    this.recipientEmails = [];
    this.isOnlySigner = false;
    this.nextRecipientKey = 0;

    this.showSpinner = false;
    this.currentPage = 1;
    this.totalPages = 0;

    // ✅ ADD THIS (important)
    this.currentRecipient = "";

    // Record/context
    this.recordId = "";

    // LMS context
    this.serviceId = null;
    this.quoteId = null;
    this.formId = null;
    this.source = null;

    this.mode = "DEFAULT";

    this.selectedTemplateId = null;
    this.selectedTemplateUrl = "";
    this.tsignReurl = "";
    this.url = "";
    this.key = null;

    this._tsignEmail = "";


    console.log("Component has been reset to its initial state.");
    this.refreshDashboardData();
  }

  @api resetFromChild() {
    console.log("📣 [TemplateCreator] Requesting dashboard reset");
  }


  disconnectedCallback() {
    console.log("🔌 TemplateCreator disconnected from DOM.");

    if (this._suggestTimer) {
      clearTimeout(this._suggestTimer);
      this._suggestTimer = null;
    }
    this._closeSuggest();

    if (this.templateClickOutsideHandler) {
      window.removeEventListener("click", this.templateClickOutsideHandler);
    }

    if (this._previewObserver) {
      this._previewObserver.disconnect();
      this._previewObserver = null;
    }

    // ✅ Fully reset component state (emails, LMS context, URLs, flags)
    this.resetComponentState();

    // ✅ Optional: clean up LMS subscription if you subscribed
    if (this.subscription) {
      unsubscribe(this.subscription);
      this.subscription = null;
      console.log("🔕 LMS subscription cleaned up.");
    }

    if (this._windowResizeHandler) {
      window.removeEventListener("resize", this._windowResizeHandler);
      this._windowResizeHandler = null;
    }
  }


  updateCurrentRecipient(currentEmail) {
    console.log('recordId =>', this.recordId);
    console.log('currentEmail =>', currentEmail);
    if (this.recordId && currentEmail) {
      updateCurrentRecipient({
        recordId: this.recordId,
        currentRecipientEmail: currentEmail
      })
        .then(() => {
          console.log("Current recipient updated successfully.");
        })
        .catch((error) => {
          console.error("Error updating current recipient:", error);
          this.showToast(
            "Error",
            `Failed to update current recipient: ${error.body?.message || error.message}`,
            "error"
          );
        });
    } else {
      this.showToast(
        "Error",
        "Record ID and Current Email are required for updating.",
        "error"
      );
    }
  }

  advanceSequence() {
    advanceEmailSequence({ recordId: this.recordId })
      .then(() => {
        this.showToast("Success", "Advanced to the next recipient.", "success");
        this.updateCurrentRecipient();
      })
      .catch((error) => {
        this.showToast(
          "Error",
          `Failed to advance email sequence: ${error.body.message}`,
          "error"
        );
      });
  }

  validateEmails() {
    if (!this.recipientEmails?.length) return false;

    const hasEmpty = this.recipientEmails.some(r => !r.email || !r.email.trim());
    if (hasEmpty) {
      this.showToast("Error", "Please fill in all email fields before finishing.", "error");
      return false;
    }
    return true;
  }


  showToast(title, message, variant) {
    const evt = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(evt);
  }

  updateCurrentRecipient(currentEmail, status) {
    updateCurrentRecipient({
      recordId: this.recordId,
      currentRecipientEmail: currentEmail,
      status: status
    })
      .then(() => {
        console.log("Current recipient updated successfully.");
      })
      .catch((error) => {
        console.error("Error updating current recipient:", error);
        this.showToast(
          "Error",
          `Failed to update current recipient: ${error.body?.message || error.message}`,
          "error"
        );
      });
  }

  notifyFirstRecipient() {
    const firstRecipient = this.recipientEmails[0];
    const url = `${this.tsignUrl}/s/?recordId=${this.recordId}`;

    sendRecordEmail({
      recordId: this.recordId,
      email: firstRecipient.email,
      url
    })
      .then(() => {
        this.showToast(
          "Success",
          `Email sent successfully to ${firstRecipient.email}. Waiting for completion.`,
          "success"
        );
        // Mark the first recipient as processed
        this.updateCurrentRecipient(firstRecipient.email, "Pending");
      })
      .catch((error) => {
        console.error("Error sending email to the first recipient:", error);
        this.showToast(
          "Error",
          `Failed to send email: ${error.body?.message || error.message}`,
          "error"
        );
      });
  }

  updateCurrentRecipient(currentEmail) {
    updateCurrentRecipient({
      recordId: this.recordId,
      currentRecipientEmail: currentEmail
    })
      .then(() => {
        console.log("Current recipient updated successfully.");
      })
      .catch((error) => {
        console.error("Error updating current recipient:", error);
        this.showToast(
          "Error",
          `Failed to update current recipient: ${error.body?.message || error.message}`,
          "error"
        );
      });
  }

  saveEmailsToBackend(emails) {
    return saveEmailsToBackend({ recordId: this.recordId, emails });
  }

  handleRecipientFinish() {
    const nextRecipientIndex =
      this.recipientEmails.findIndex(
        (email) => email === this.currentRecipient
      ) + 1;

    if (nextRecipientIndex < this.recipientEmails.length) {
      const nextRecipient = this.recipientEmails[nextRecipientIndex];
      const url = `${this.tsignUrl}/s/?recordId=${this.recordId}`;

      sendRecordEmail({
        recordId: this.recordId,
        email: nextRecipient.email,
        url
      })
        .then(() => {
          this.showToast(
            "Success",
            `Email sent to ${nextRecipient.email}!`,
            "success"
          );
          updateCurrentRecipient({
            recordId: this.recordId,
            currentRecipient: nextRecipient.email
          });
        })
        .catch((error) => {
          console.error("Error sending email:", error);
          this.showToast("Error", "Failed to send email.", "error");
        });
    } else {
      // If all recipients have completed, notify everyone
      notifyAllRecipients({ recordId: this.recordId });
    }
  }

  @track isTemplateUploadChoiceModal = false;
  @track showExistingTemplatesTable = false;
  @track filteredCreatedTemplates = [];
  @track selectedTemplateId = null;
  @track selectedTemplateUrl = null;

  closeTemplateUploadChoiceModal() {
    this.isTemplateUploadChoiceModal = false;
  }

  // Flag to avoid showing modal when triggered programmatically
  skipUploadOptionModal = false;

  handleUploadOption(event) {
    if (this.skipUploadOptionModal) {
      console.log("⚠️ Skipping modal (programmatic click)");
      this.skipUploadOptionModal = false; // reset for next time
      return;
    }

    event.preventDefault(); // ✅ Block native picker on first click
    this.isTemplateUploadChoiceModal = true;
  }

  triggerNativeFileUpload() {
    console.log("📂 Upload New selected");

    this.isTemplateUploadChoiceModal = false;
    this.skipUploadOptionModal = true;

    setTimeout(() => {
      const input = this.template.querySelector(".visually-hidden");
      if (input) {
        console.log("✅ File input found by class. Triggering click.");
        input.click();
      } else {
        console.warn("⚠️ File input still not found.");
      }
    }, 0);
  }

  @track isUploadDragOver = false;
  _uploadDragDepth = 0;

  get uploadDropZoneClass() {
    return this.isUploadDragOver
      ? "upload-drop-zone is-drag-over"
      : "upload-drop-zone";
  }

  handleUploadDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    this._uploadDragDepth++;
    this.isUploadDragOver = true;
  }

  handleUploadDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }

  handleUploadDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this._uploadDragDepth--;
    if (this._uploadDragDepth <= 0) {
      this._uploadDragDepth = 0;
      this.isUploadDragOver = false;
    }
  }

  handleUploadDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this._uploadDragDepth = 0;
    this.isUploadDragOver = false;

    const files = e.dataTransfer?.files;
    if (!files || !files.length) {
      return;
    }
    if (files.length > 1) {
      this.showToast("Error", "Only one file can be uploaded at a time.", "error");
      return;
    }

    this.isTemplateUploadChoiceModal = false;
    this.skipUploadOptionModal = true;
    // reuse the existing pipeline (size/type checks, PDF + Word->PDF)
    this.onFileUpload({ target: { files: [files[0]], value: null } });
  }

  handleUseExistingTemplate() {
    console.log("📥 User selected 'Use Existing Template' option");
    this.mode = "DEFAULT";
    this.isTemplateUploadChoiceModal = false;
    this.showExistingTemplatesTable = true;

    getTemplates({ orgId: this.orgid })
      .then((result) => {
        console.log("✅ Templates fetched from Apex:", result);

        this.filteredCreatedTemplates = result.filter(
          (t) => t.Document_Type__c === "Created Template"
        );

        console.log(
          "✅ Filtered 'Created Template' entries:",
          this.filteredCreatedTemplates
        );

        this.cretTemplateTotalRecords = this.filteredCreatedTemplates.length;
        this.cretPageNumber = 1;
        this.cretTotalPages = Math.ceil(
          this.cretTemplateTotalRecords / this.cretPageSize
        );

        this.updateCretPaginatedList();

        if (this.filteredCreatedTemplates.length === 0) {
          console.warn("⚠️ No 'Created Template' entries found.");
        }
      })
      .catch((error) => {
        console.error("❌ Failed to fetch templates:", error);
        this.showToast("Error", "Could not fetch templates.", "error");
      });
  }

  get cretPaginatedListWithChecked() {
    return this.cretPaginatedList.map((template) => ({
      ...template,
      isChecked: template.Id === this.selectedTemplateId
    }));
  }

  handleTemplateRadioChange(event) {
    this.selectedTemplateId = event.currentTarget.dataset.id;
    this.selectedTemplateUrl = event.currentTarget.dataset.url;

    console.log(
      "🔘 Template selected:",
      this.selectedTemplateId,
      this.selectedTemplateUrl
    );
  }
  handleContinueWithSelectedTemplate() {
    if (!this.selectedTemplateId || !this.selectedTemplateUrl) {
      this.showToast(
        "Error",
        "Please select a template before continuing.",
        "error"
      );
      return;
    }
    this.activeRecipientKey = null;
    this.mode = "DEFAULT";

    console.log("✅ Proceeding with template ID:", this.selectedTemplateId);
    this.showExistingTemplatesTable = false;
    this.tsignReurl = this.selectedTemplateUrl;
    this.redirecttemplate(); // your existing method
  }

  redirecttemplate() {
    console.log("📌 Redirecting with TSign URL:", this.tsignReurl);

    // ✅ Prevent repeated redirects (double click) while a flow is already active/saving
    if (this._savingInProgress) {
      console.warn("⛔ Save already in progress, skipping redirecttemplate.");
      return;
    }
    if (this._activeFlow === "WORD_CONVERT") {
      console.warn("⛔ Word conversion already in progress, skipping redirecttemplate.");
      return;
    }

    if (this.tsignReurl) {
      //const urlParts = this.tsignReurl.split("/");
      // this.fileName = urlParts[urlParts.length - 1]; // Extract filename
      const cleanUrl = this.tsignReurl.split("?")[0];
      const urlParts = cleanUrl.split("/");
      this.fileName = decodeURIComponent(urlParts[urlParts.length - 1]); //manendra
      console.log("📌 Extracted Filename:", this.fileName);

      const fileExtension = this.fileName.split(".").pop().toLowerCase();

      if (fileExtension === "docx") {
        console.log("📌 Detected DOCX file. Converting to PDF...");
        this.fileType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        // ✅ mark flow (doesn't change behavior, just prevents duplicate triggers)
        this._activeFlow = "WORD_CONVERT";

        this.fetchDocxAndConvert(this.tsignReurl); // Fetch + Convert to PDF
      } else if (fileExtension === "pdf") {
        console.log("📌 Detected PDF file. Saving directly...");
        this.fileType = "application/pdf";
        this.awsUrl = this.tsignReurl;
        this.isFileUploaded = true;

        // ✅ mark flow (helps gate other handlers)
        this._activeFlow = "AWS_UPLOAD";

        this.handleSaveAndUploadTemplate(); // ✅ Directly save
      } else {
        this.showToast("Error", "Unsupported file format received.", "error");
      }
    }
  }


  handleSaveAndUploadTemplate() {
    // ✅ Prevent duplicate record creation if user double-clicks / multiple triggers happen
    if (this._savingInProgress) {
      console.warn("⛔ Save already in progress, skipping handleSaveAndUploadTemplate.");
      return;
    }
    this._savingInProgress = true;

    console.log("🟪 START handleSaveAndUploadTemplate");

    if (!this.fileName) {
      console.warn("🟨 handleSaveAndUploadTemplate: Missing fileName");
      this.showToast("Error", "Please provide a file name and select a file.", "error");

      // ✅ release lock for retry
      this._savingInProgress = false;
      return;
    }

    this.isLoading = true;

    console.log("🟪 handleSaveAndUploadTemplate inputs:", {
      fileName: this.fileName,
      tsignReurl: this.tsignReurl,
      source: this.source,
      serviceId: this.serviceId,
      quoteId: this.quoteId,
      formId: this.formId
    });

    const picklistValue = this.getPicklistValue();

    const resolvedServiceId = this.source === "SERVICE" ? (this.serviceId || "") : "";
    const resolvedQuoteId = this.source === "QUOTE" ? (this.quoteId || null) : null;
    const resolvedFormId = this.source === "FORM" ? (this.formId || "") : "";
    const resolvedAttachmentId = this.source === "ATTACHMENT" ? (this.attachmentId || "") : ""; // manendra added for supportcoordinatorAttachments

    console.log("🟪 handleSaveAndUploadTemplate resolved values:", {
      picklistValue,
      resolvedServiceId,
      resolvedQuoteId,
      resolvedFormId
    });

    console.log("📌 Facility Id for Offer_Template__c (handleSaveAndUploadTemplate):", localStorage.getItem("defaultFacilityId"));

    createOfferTemplate({
      fileName: this.getCleanFileName(this.fileName),
      picklistValue,
      orgId: this.orgid,
      serviceId: resolvedServiceId,
      quoteId: resolvedQuoteId,
      formId: resolvedFormId,
      attachmentId: resolvedAttachmentId, // manendra added for supportcoordinatorAttachments
      url: this.tsignReurl || "",
      documentTypeId: this.selectedDocumentTypeId || null,
      facilityId: localStorage.getItem("defaultFacilityId") || null
    })
      .then((recordId) => {
        this.recordId = recordId;
        console.log("🟩 handleSaveAndUploadTemplate record created:", recordId);
        this._perfMark('Apex createOfferTemplate');

        if (this.tsignReurl) {
          console.log("🟪 handleSaveAndUploadTemplate updating AWS URL:", this.tsignReurl);

          return updateRecordWithAWSUrl({
            recordId: this.recordId,
            awsUrl: this.tsignReurl,
            serviceId: resolvedServiceId,
            quoteId: resolvedQuoteId,
            formId: resolvedFormId,
            attachmentId: resolvedAttachmentId // manendra added for supportcoordinatorAttachments
          })
            .then(() => {
              console.log("🟩 handleSaveAndUploadTemplate AWS URL updated");
              this._perfMark('Apex updateRecordWithAWSUrl');
              this.showToast("Success", "Document Uploaded successfully.", "success");
              // ✅ IMPORTANT: wait for URL and render PDF pages
              return this.retrieveFileUrl();
            })
            .then((urlToRender) => {
              if (urlToRender) {
                this.awsUrl = urlToRender;
                return this.loadTemplatePages(urlToRender);
              }
              return null;
            })
            .catch((error) => {
              console.error("❌ handleSaveAndUploadTemplate update error:", error);
              this.showToast("Error", "Failed to update record.", "error");
            });
        }

        console.log("🟪 handleSaveAndUploadTemplate no AWS URL, uploading file");

        return uploadFileToAWS({
          base64: JSON.stringify(this.base64FileData),
          filename: this.fileName,
          recordId: this.recordId,
          obj: "offerLetter"
        })
          .then(() => {
            console.log("🟩 handleSaveAndUploadTemplate file uploaded to AWS");
            // ✅ keep your timing, but return a promise so chaining works
            return new Promise((resolve) => {
              setTimeout(async () => {
                try {
                  const urlToRender = await this.retrieveFileUrl();
                  resolve(urlToRender);
                } catch (e) {
                  resolve(null);
                }
              }, 3500);
            });
          })
          .then((urlToRender) => {
            if (urlToRender) {
              this.awsUrl = urlToRender;
              return this.loadTemplatePages(urlToRender);
            }
            return null;
          })
          .catch((error) => {
            console.error("❌ handleSaveAndUploadTemplate upload error:", error);
            this.showToast("Error", "File upload failed.", "error");
          });
      })
      .catch((error) => {
        console.error("❌ handleSaveAndUploadTemplate create error:", error);
        this.showToast("Error", "Failed to create record.", "error");
      })
      .finally(() => {
        // ✅ release lock + clear loading state
        this.isLoading = false;
        this._savingInProgress = false;

        // ✅ clear active flow marker if we were in AWS upload flow
        if (this._activeFlow === "AWS_UPLOAD") {
          this._activeFlow = null;
        }
      });
  }





  handleSelectExistingTemplate(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) {
      this.showToast("Error", "Template URL missing.", "error");
      return;
    }
    this.activeRecipientKey = null;

    this.showExistingTemplatesTable = false;
    this.tsignReurl = url;
    this.redirectservice(); // Load the template as if user uploaded it
  }

  closeExistingTemplatesTable() {
    this.showExistingTemplatesTable = false;
    this.selectedTemplateId = null;
    this.selectedTemplateUrl = null;
  }

  @track cretPageNumber = 1;
  @track cretPageSize = 5;
  @track cretTotalPages = 0;
  @track cretTemplateTotalRecords = 0;
  @track cretDisableFirst = true;
  @track cretDisableLast = false;
  @track cretPaginatedList = [];
  updateCretPaginatedList() {
    const startIdx = (this.cretPageNumber - 1) * this.cretPageSize;
    const endIdx = startIdx + this.cretPageSize;
    this.cretPaginatedList = this.filteredCreatedTemplates.slice(
      startIdx,
      endIdx
    );

    this.cretDisableFirst = this.cretPageNumber === 1;
    this.cretDisableLast = this.cretPageNumber === this.cretTotalPages;
  }

  handleCretFirst() {
    this.cretPageNumber = 1;
    this.updateCretPaginatedList();
  }

  handleCretPrevious() {
    if (this.cretPageNumber > 1) {
      this.cretPageNumber -= 1;
      this.updateCretPaginatedList();
    }
  }

  handleCretNext() {
    if (this.cretPageNumber < this.cretTotalPages) {
      this.cretPageNumber += 1;
      this.updateCretPaginatedList();
    }
  }

  handleCretLast() {
    this.cretPageNumber = this.cretTotalPages;
    this.updateCretPaginatedList();
  }


  editingPlaceholderId = null;
  @track useCustomInlineStyle = false;

  // ---- NEW CODE: Required toggle in the Select Recipient popup ----
  // Holds the toggle value while the popup is open; saved on Confirm.
  @track isFieldRequired = true;

  handleRequiredToggle(event) {
    this.isFieldRequired = event.target.checked;
  }
  // ---- END NEW CODE ----

  @track styleOptions = {
    fontFamily: 'Calibri, Arial, sans-serif',
    fontSize: '18',    // store as string for combobox; parse when needed
    bold: false,
    italic: false,
    underline: false,
    color: '#000000'
  };

  get fontFamilyOptions() {
    // keep it small; you can expand later
    return [
      { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
      { label: 'Roboto', value: 'Roboto, Arial, sans-serif' },
      { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
      { label: 'Calibri', value: 'Calibri, Arial, sans-serif' },
      { label: 'Courier New', value: '"Courier New", Courier, monospace' }
    ];
  }

  get fontSizeOptions() {
    return [
      { label: '10', value: '10' },
      { label: '12', value: '12' },
      { label: '14', value: '14' },
      { label: '16', value: '16' },
      { label: '18', value: '18' },
      { label: '20', value: '20' },
      { label: '24', value: '24' }
    ];
  }

  // tiny live preview computed CSS string
  get stylePreviewCss() {
    const f = this.styleOptions;
    const fw = f.bold ? '700' : '400';
    const fs = f.italic ? 'italic' : 'normal';
    const td = f.underline ? 'underline' : 'none';
    return `font-family:${f.fontFamily}; font-size:${f.fontSize}px; font-weight:${fw}; font-style:${fs}; text-decoration:${td}; color:${f.color}; border:1px dashed #ddd; padding:.5rem; display:inline-block;`;
  }

  handleStyleOptionChange = (evt) => {
    const { name, type, checked, value } = evt.target;
    this.styleOptions = {
      ...this.styleOptions,
      [name]: (type === 'checkbox') ? !!checked : value
    };
  };
  get boldToggleClass() {
    return 'style-toggle-pill' + (this.styleOptions.bold ? ' active' : '');
  }

  get italicToggleClass() {
    return 'style-toggle-pill' + (this.styleOptions.italic ? ' active' : '');
  }

  get underlineToggleClass() {
    return 'style-toggle-pill' + (this.styleOptions.underline ? ' active' : '');
  }

  handleStyleToggleClick(event) {
    const name = event.currentTarget.dataset.styleName;
    if (!name) return;

    this.styleOptions = {
      ...this.styleOptions,
      [name]: !this.styleOptions[name]
    };
  }

  handleRecipientBadgeClick(event) {

    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      this.isPlaceholderDragging = false;
      return;
    }

    if (this.isPlaceholderDragging) {
      this.isPlaceholderDragging = false;
      return;
    }

    const idStr =
      event.currentTarget.dataset.id;

    const id = Number(idStr);

    if (!idStr || Number.isNaN(id)) {
      return;
    }

    const placeholder =
      this.placeholders.find(
        p => Number(p.id) === id
      );

    if (!placeholder) {
      return;
    }

    this.editingPlaceholderId = id;

    this.newPlaceholder = {
      ...placeholder
    };

    this.selectedRecipient =
      placeholder.recipient || '';

    this.selectedRecipientColor =
      placeholder.recipientColor ||
      '#0070d2';

    this.useCustomInlineStyle =
      !!placeholder.customInlineStyle;

    // ---- NEW CODE ----
    // Show the field's saved Required value (older fields without the flag = required)
    this.isFieldRequired = placeholder.required !== false;
    // ---- END NEW CODE ----

    const ts =
      placeholder.textStyle || {};

    this.styleOptions = {
      fontFamily:
        ts.fontFamily ||
        'Calibri, Arial, sans-serif',

      fontSize:
        ts.fontSize || '18',

      bold:
        !!ts.bold,

      italic:
        !!ts.italic,

      underline:
        !!ts.underline,

      color:
        ts.color || '#000000'
    };

    this.showRecipientModal = true;
  }


  get showTextStylePanel() {
    // Only show for non-signature placeholders
    return this.newPlaceholder && !this.newPlaceholder.isSignature;
  }
  get disableStyleControls() {
    return !this.useCustomInlineStyle;
  }
  handleCustomInlineStyleToggle(event) {
    this.useCustomInlineStyle = event.target.checked;
  }
  get stylePanelGridClass() {
    // base class + optional disabled class
    return this.useCustomInlineStyle
      ? 'style-panel-grid'
      : 'style-panel-grid style-disabled';
  }


  prepopulateClientEmail() {
    try {
      if (!this._tsignEmail) {
        console.log("📧 [TemplateCreator] No client email to prepopulate.");
        return;
      }

      if (!Array.isArray(this.recipientEmails) || this.recipientEmails.length === 0) {
        if (this._tsignEmail) {
          this.recipientEmails = [
            {
              key: 0,
              label: "1st Recipient",
              name: "",
              email: this._tsignEmail,
              color: "#0176D3",
              colorStyle: "background-color:#0176D3; border-radius: 8px;",
              canRemove: true
            }
          ];
          this.activeRecipientKey = 0;
          this.currentRecipient = this._tsignEmail;
          this.nextRecipientKey = 1;
          console.log("✅ [TemplateCreator] Prepopulated recipient #1 with:", this._tsignEmail);
        }
        return;
      }

      const first = this.recipientEmails[0];

      // ✅ Only auto-fill if user hasn't typed anything already
      if (first && (!first.email || !first.email.trim())) {
        this.recipientEmails = [
          { ...first, email: this._tsignEmail },
          ...this.recipientEmails.slice(1)
        ];

        // ✅ CRITICAL: keep email flow working even without user typing
        this.currentRecipient = this._tsignEmail;

        console.log("✅ [TemplateCreator] Prepopulated recipient #1 with:", this._tsignEmail);
        console.log("✅ [TemplateCreator] currentRecipient set to:", this.currentRecipient);
      } else {
        console.log("ℹ️ [TemplateCreator] Recipient #1 already has email, not overriding.");
      }
    } catch (e) {
      console.error("❌ [TemplateCreator] prepopulateClientEmail error:", e);
    }
  }

  handleViewAllDocuments() {
    console.log('========================================');
    console.log('📌 View All Documents clicked');
    console.log('📌 Parent Org ID:', this.orgid);
    console.log('📌 Parent Org ID JSON:', JSON.stringify(this.orgid));
    console.log('📌 isHome before:', this.isHome);
    console.log('📌 isTSignDocs before:', this.isTSignDocs);
    console.log('========================================');

    this.isTSignDocs = true;
    this.isHome = false;
  }

 
  handleBackToHome() {
    console.log('⬅️ Returning to Template Creator Home');

    this.isTSignDocs = false;
    this.isHome = true;
    this.refreshDashboardData();
  }

  // @wire(getRecentActivities, { orgId: '$orgid' })
  // wiredRecentActivities({ error, data }) {
  //   if (data) {
  //     console.log('📊 Recent activities loaded:', JSON.stringify(data));
  //     this.recentActivities = data.map(activity => {
  //       return {
  //         ...activity,
  //         formattedDateTime: this.formatActivityDateTime(activity.activityDateTime),
  //         categoryClass: this.getCategoryClass(activity.category)
  //       };
  //     });
  //   } else if (error) {
  //     console.error('❌ Error loading recent activities:', error);
  //     this.recentActivities = [];
  //   }
  // }


  wiredRecentActivitiesResult;

  @wire(getRecentActivities, { orgId: '$orgid' })
  wiredRecentActivities(result) {
    this.wiredRecentActivitiesResult = result;
    const { error, data } = result;
    if (data) {
      console.log('📊 Recent activities loaded:', JSON.stringify(data));
      this.recentActivities = data.map(activity => {
        return {
          ...activity,
          formattedDateTime: this.formatActivityDateTime(activity.activityDateTime),
          categoryClass: this.getCategoryClass(activity.category)
        };
      });
    } else if (error) {
      console.error('❌ Error loading recent activities:', error);
      this.recentActivities = [];
    }
  }


  async refreshDashboardData() {
    try {
      await this.loadDashboardCounts();
      if (this.wiredRecentActivitiesResult) {
        await refreshApex(this.wiredRecentActivitiesResult);
      }
      if (this.isDashboardRecords && this.selectedCardType) {
        await this.openDashboardCard(this.selectedCardType);
      }
    } catch (e) {
      console.error('Error refreshing dashboard data:', e);
    }
  }
  get hasRecentActivities() {
    return this.recentActivities && this.recentActivities.length > 0;
  }

  get recentActivitiesCount() {
    return this.recentActivities ? this.recentActivities.length : 0;
  }

  formatActivityDateTime(dateTimeStr) {
    if (!dateTimeStr) return "";
    const dt = new Date(dateTimeStr);
    if (isNaN(dt.getTime())) return "";

    const day = dt.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[dt.getMonth()];
    const year = dt.getFullYear();

    let hours = dt.getHours();
    const minutes = String(dt.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day} ${month} ${year} • ${hours}:${minutes} ${ampm}`;
  }

  getCategoryClass(category) {
    if (category === 'Action Required') {
      return 'recent-activity-category category-action-required';
    } else if (category === 'Waiting for Others') {
      return 'recent-activity-category category-waiting';
    } else if (category === 'Expiring Soon') {
      return 'recent-activity-category category-expiring';
    } else if (category === 'Completed') {
      return 'recent-activity-category category-completed';
    }
    return 'recent-activity-category';
  }

  async loadDashboardCounts() {

    try {

      console.log('📊 Loading dashboard counts');
      console.log('📌 Org ID:', this.orgid);

      const result =
        await getDashboardCounts({
          orgId: this.orgid
        });

      console.log(
        '📊 Dashboard counts:',
        JSON.stringify(result)
      );


      this.actionRequiredCount =
        result?.actionRequired || 0;

      this.waitingForOthersCount =
        result?.waitingForOthers || 0;

      this.expiringSoonCount =
        result?.expiringSoon || 0;

      this.expiring24HoursCount =
        result?.expiring24Hours || 0;

      this.completedCount =
        result?.completed || 0;

    } catch (error) {

      console.error(
        '❌ Error loading dashboard counts:',
        error
      );

      this.actionRequiredCount = 0;
      this.waitingForOthersCount = 0;
      this.expiringSoonCount = 0;
      this.expiring24HoursCount = 0;
      this.completedCount = 0;
    }
  }

  @track selectedCardType;
  selectedCardTitle = '';

  dashboardRecords = [];
  isDashboardRecords = false;

  showDashboardRecords = false;
  isDashboardRecordsLoading = false;

  get isCompletedCard() {
    return this.selectedCardType === 'completed';
  }

  get showDocumentUrlColumn() {
    return this.selectedCardType !== 'completed' && this.selectedCardType !== 'waitingForOthers';
  }

  // get tableClass() {
  //   if (this.selectedCardType === 'expiringSoon') {
  //     return 'dashboard-record-table expiring-soon-table';
  //   }
  //   if (this.selectedCardType === 'completed') {
  //     return 'dashboard-record-table completed-card-table';
  //   }
  //   return 'dashboard-record-table';
  // }
  get tableClass() {
    if (this.selectedCardType === 'expiringSoon') {
      return 'dashboard-record-table expiring-soon-table';
    }
    if (this.selectedCardType === 'completed') {
      return 'dashboard-record-table completed-card-table';
    }
    if (this.selectedCardType === 'waitingForOthers') {
      return 'dashboard-record-table waiting-for-others-table';
    }
    return 'dashboard-record-table action-required-table';
  }

  get hasDashboardRecords() {
    return this.dashboardRecords &&
      this.dashboardRecords.length > 0;
  }

  async handleDashboardCardClick(event) {
    const cardType = event.currentTarget.dataset.card;
    await this.openDashboardCard(cardType);
  }

  async openDashboardCard(cardType) {

    // =====================================================
    // CARD TYPE
    // =====================================================


    console.log(
      '📊 Dashboard card clicked:',
      cardType
    );

    console.log(
      '📌 Org ID:',
      this.orgid
    );


    // =====================================================
    // STORE SELECTED CARD
    // =====================================================

    this.selectedCardType =
      cardType;


    // =====================================================
    // CARD TITLE + DESCRIPTION
    // =====================================================

    switch (cardType) {

      case 'actionRequired':

        this.selectedCardTitle =
          'Action Required';

        this.selectedCardDescription =
          'Document waiting for signature';

        break;


      case 'waitingForOthers':

        this.selectedCardTitle =
          'Waiting for Others';

        this.selectedCardDescription =
          'Document pending recipients';

        break;


      case 'expiringSoon':

        this.selectedCardTitle =
          'Expiring Soon';

        this.selectedCardDescription =
          'Documents approaching their expiry date';

        break;


      case 'completed':

        this.selectedCardTitle =
          'Completed';

        this.selectedCardDescription =
          'Successfully signed Documents';

        break;


      default:

        this.selectedCardTitle =
          'Documents';

        this.selectedCardDescription =
          '';

        break;
    }


    // =====================================================
    // NAVIGATION
    // =====================================================

    this.isHome = false;

    this.isTSignDocs = false;

    this.isDashboardRecords = true;


    // =====================================================
    // RESET TABLE STATE
    // =====================================================

    this.isDashboardRecordsLoading =
      true;


    this.dashboardRecords = [];

    this.dashboardVisibleRecords = [];

    this.dashboardSearchTerm = '';


    // =====================================================
    // RESET PAGINATION
    // =====================================================

    this.dashboardPageNumber =
      1;

    this.dashboardTotalPages =
      1;

    this.dashboardTotalRecords =
      0;

    this.dashboardDisableFirst =
      true;

    this.dashboardDisableLast =
      true;


    try {

      // =================================================
      // FETCH RECORDS
      // =================================================

      const data =
        await getDashboardRecords({
          orgId: this.orgid,
          cardType: cardType
        });


      console.log(
        '🔍 DASHBOARD RAW DATA:',
        JSON.stringify(data, null, 2)
      );


      // =================================================
      // PREPARE RECORDS
      // =================================================

      this.dashboardRecords =
        (data || []).map(record => {

          console.log(
            '🔍 DASHBOARD RECORD:',
            JSON.stringify(record, null, 2)
          );

          console.log(
            '🔍 CREATED BY NAME:',
            record.createdByName
          );

          console.log(
            '🔍 CREATED DATE:',
            record.createdDate
          );

          // =========================================
          // STATUS
          // =========================================

          const normalizedStatus =
            record.status
              ? record.status
                .trim()
                .toLowerCase()
              : '';


          let statusClass =
            'dashboard-status-pill';


          if (
            normalizedStatus ===
            'pending'
          ) {

            statusClass +=
              ' dashboard-status-pending';

          } else if (
            normalizedStatus ===
            'completed'
          ) {

            statusClass +=
              ' dashboard-status-completed';

          } else if (
            normalizedStatus ===
            'expired'
          ) {

            statusClass +=
              ' dashboard-status-expired';

          } else if (
            normalizedStatus ===
            'rejected'
          ) {

            statusClass +=
              ' dashboard-status-rejected';

          } else if (
            normalizedStatus ===
            'approved'
          ) {

            statusClass +=
              ' dashboard-status-approved';

          } else {

            statusClass +=
              ' dashboard-status-secondary';
          }


          // =========================================
          // EXPIRY DATE
          // =========================================

          let expiryDisplay =
            '';


          if (
            record.expireDate
          ) {

            const expiryDate =
              new Date(
                record.expireDate
              );


            if (
              !isNaN(
                expiryDate.getTime()
              )
            ) {

              expiryDisplay =
                new Intl.DateTimeFormat(
                  'en-US',
                  {
                    dateStyle:
                      'medium',

                    timeStyle:
                      'short'
                  }
                ).format(
                  expiryDate
                );
            }
          }


          // =========================================
          // CREATED DATE
          // =========================================

          let createdDateDisplay =
            '';


          if (
            record.createdDate
          ) {

            const createdDate =
              new Date(
                record.createdDate
              );


            if (
              !isNaN(
                createdDate.getTime()
              )
            ) {

              createdDateDisplay =
                new Intl.DateTimeFormat(
                  'en-GB',
                  {
                    day:
                      '2-digit',

                    month:
                      '2-digit',

                    year:
                      'numeric'
                  }
                ).format(
                  createdDate
                );
            }
          }


          // =========================================
          // CREATED BY NAME
          //
          // Apex returns:
          // User.Full_Name__c
          // =========================================

          const createdByName =
            record.createdByName ||
            'Unknown User';


          // =========================================
          // CREATED BY INITIALS
          // =========================================

          let createdByInitials =
            '';


          const nameParts =
            createdByName
              .trim()
              .split(/\s+/)
              .filter(
                part => part
              );


          if (
            nameParts.length === 1
          ) {

            createdByInitials =
              nameParts[0]
                .substring(
                  0,
                  2
                )
                .toUpperCase();

          } else if (
            nameParts.length > 1
          ) {

            createdByInitials =
              (
                nameParts[0]
                  .charAt(0)

                +

                nameParts[
                  nameParts.length - 1
                ].charAt(0)

              ).toUpperCase();

          } else {

            createdByInitials =
              '--';
          }

          console.log(
            '🔍 CREATED BY INITIALS:',
            createdByInitials
          );

          console.log(
            '🔍 CREATED DATE DISPLAY:',
            createdDateDisplay
          );


          // =========================================
          // ALL RECIPIENTS
          //
          // IMPORTANT:
          // Do NOT replace this with
          // currentRecipient.
          // =========================================

          let recipientListDisplay =
            '—';


          let rawRecipients =
            record.recipientListDisplay;


          // Support alternate Apex names

          if (!rawRecipients) {

            rawRecipients =
              record.allRecipients;
          }


          if (!rawRecipients) {

            rawRecipients =
              record.AllRecipients;
          }


          if (rawRecipients) {

            recipientListDisplay =
              rawRecipients

                .replace(
                  /\r\n/g,
                  '\n'
                )

                .replace(
                  /\r/g,
                  '\n'
                )

                .replace(
                  /<br\s*\/?>/gi,
                  '\n'
                )

                .split('\n')

                .map(
                  email =>
                    email.trim()
                )

                .filter(
                  email =>
                    email
                )

                .join('\n');
          }


          // =========================================
          // RECIPIENT TOOLTIP
          // =========================================

 let recipientListTooltip =
            recipientListDisplay
              .replace(
                /\n/g,
                ', '
              );

          // "Name - email" per recipient (names and emails are line-aligned from Apex)
          if (record.recipientEmailsDisplay) {
            const tooltipNames = (record.recipientListDisplay || '').split('\n');
            const tooltipEmails = record.recipientEmailsDisplay.split('\n');
            const tooltipParts = [];
            tooltipEmails.forEach((rawEmail, i) => {
              const email = (rawEmail || '').trim();
              if (!email) return;
              const name = (tooltipNames[i] || '').trim();
              tooltipParts.push(name && name.toLowerCase() !== email.toLowerCase() ? `${name} - ${email}` : email);
            });
            if (tooltipParts.length) {
              recipientListTooltip = tooltipParts.join(', ');
            }
          }
          // =========================================
          // CURRENT RECIPIENT + STATUS
          // =========================================

          let currentRecipientStatusDisplay =
            '—';


          if (
            record.currentRecipient
          ) {

            // Saved name (All_Recipient_Names__c), else the email
            currentRecipientStatusDisplay =
              record.currentRecipientName ||
              record.currentRecipient;


            if (
              record.status
            ) {

              currentRecipientStatusDisplay +=
                ' - ' +
                record.status;
            }
          }


          // =========================================
          // INDIVIDUAL RECIPIENT STATUSES
          // =========================================

          let recipientStatuses =
            [];


          if (
            Array.isArray(
              record.recipientStatuses
            )
            &&
            record.recipientStatuses
              .length
          ) {

            recipientStatuses =
              record.recipientStatuses.map(
                (
                  recipient,
                  index
                ) => {


                  const recipientEmail =
                    recipient.email ||
                    recipient.recipientEmail ||
                    recipient.RecipientEmail ||
                    '';


                  const recipientStatus =
                    recipient.status ||
                    recipient.Status ||
                    'Pending';


                  const normalizedRecipientStatus =
                    recipientStatus
                      .trim()
                      .toLowerCase();


                  let recipientStatusClass =
                    'dashboard-recipient-status-pill';


                  if (
                    normalizedRecipientStatus
                      .includes(
                        'completed'
                      )
                  ) {

                    recipientStatusClass +=
                      ' dashboard-recipient-status-completed';

                  } else if (
                    normalizedRecipientStatus
                      .includes(
                        'approved'
                      )
                  ) {

                    recipientStatusClass +=
                      ' dashboard-recipient-status-approved';

                  } else if (
                    normalizedRecipientStatus
                      .includes(
                        'rejected'
                      )
                  ) {

                    recipientStatusClass +=
                      ' dashboard-recipient-status-rejected';

                  } else if (
                    normalizedRecipientStatus
                      .includes(
                        'waiting'
                      )
                  ) {

                    recipientStatusClass +=
                      ' dashboard-recipient-status-waiting';

                  } else if (
                    normalizedRecipientStatus
                      .includes(
                        'pending'
                      )
                  ) {

                    recipientStatusClass +=
                      ' dashboard-recipient-status-pending';

                  } else {

                    recipientStatusClass +=
                      ' dashboard-recipient-status-secondary';
                  }


                  // =================================
                  // LABEL
                  // =================================

                  let label =
                    recipientStatus;


                  if (
                    recipientEmail
                  ) {

                    label =
                      recipientEmail +
                      ' - ' +
                      recipientStatus;
                  }


                  return {

                    key:
                      (
                        record.id ||
                        record.Id ||
                        'record'
                      )
                      +
                      '-'
                      +
                      index,

                    email:
                      recipientEmail,

                    status:
                      recipientStatus,

                    label,

                    className:
                      recipientStatusClass
                  };
                }
              );


          } else if (
            record.currentRecipient
          ) {


            // =========================================
            // FALLBACK
            // =========================================

            let fallbackStatusClass =
              'dashboard-recipient-status-pill';


            if (
              normalizedStatus ===
              'completed'
            ) {

              fallbackStatusClass +=
                ' dashboard-recipient-status-completed';

            } else if (
              normalizedStatus ===
              'rejected'
            ) {

              fallbackStatusClass +=
                ' dashboard-recipient-status-rejected';

            } else if (
              normalizedStatus ===
              'approved'
            ) {

              fallbackStatusClass +=
                ' dashboard-recipient-status-approved';

            } else if (
              normalizedStatus ===
              'pending'
            ) {

              fallbackStatusClass +=
                ' dashboard-recipient-status-pending';

            } else {

              fallbackStatusClass +=
                ' dashboard-recipient-status-secondary';
            }


            recipientStatuses = [

              {

                key:
                  (
                    record.id ||
                    record.Id ||
                    'record'
                  )
                  +
                  '-current',

                email:
                  record.currentRecipient,

                status:
                  record.status ||
                  'Pending',

                label:
                  currentRecipientStatusDisplay,

                className:
                  fallbackStatusClass
              }
            ];
          }


          // =========================================
          // FINAL RECORD
          // =========================================

          return {

            ...record,


            // Status
            statusClass,


            // Expiry
            expiryDisplay,


            // Created By
            createdByName,

            createdByInitials,


            // Created Date
            createdDateDisplay,


            // Recipients
            recipientListDisplay,

            recipientListTooltip,


            // Current recipient
            currentRecipientStatusDisplay,


            // Individual recipient statuses
            recipientStatuses
          };
        });


      console.log(
        '🔍 FINAL DASHBOARD RECORDS:',
        JSON.stringify(
          this.dashboardRecords,
          null,
          2
        )
      );


      // =================================================
      // PAGINATION
      // =================================================

      this.dashboardPageNumber = 1;

      if (this.pendingHighlightRecordId) {
        const recordIndex = this.dashboardRecords.findIndex(r => r.id === this.pendingHighlightRecordId);
        if (recordIndex >= 0) {
          const targetPage = Math.floor(recordIndex / this.dashboardRecordsPerPage) + 1;
          this.dashboardPageNumber = targetPage;
        }
      }

      this.updateDashboardPagination();


      // =================================================
      // DEBUG
      // =================================================

      console.log(
        '📊 Total Dashboard Records:',
        this.dashboardTotalRecords
      );


      console.log(
        '📄 Dashboard Total Pages:',
        this.dashboardTotalPages
      );


      console.log(
        '📄 Dashboard Current Page:',
        this.dashboardPageNumber
      );


      console.log(
        '📄 Dashboard Visible Records:',
        JSON.stringify(
          this.dashboardVisibleRecords
        )
      );

    } catch (error) {

      console.error(
        '❌ Error fetching dashboard records:',
        error
      );


      // =================================================
      // RESET TABLE
      // =================================================

      this.dashboardRecords =
        [];

      this.dashboardVisibleRecords =
        [];

      this.dashboardTotalRecords =
        0;

      this.dashboardTotalPages =
        1;

      this.dashboardPageNumber =
        1;

      this.dashboardDisableFirst =
        true;

      this.dashboardDisableLast =
        true;

    } finally {

      this.isDashboardRecordsLoading =
        false;
    }
  }
 @api
  handleDashboardBack() {
    if (this.applyTimeout) {
      clearTimeout(this.applyTimeout);
      this.applyTimeout = null;
    }
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = null;
    }
    this.pendingHighlightRecordId = null;
    const existingHighlights = this.template.querySelectorAll('.recent-activity-highlight');
    existingHighlights.forEach(el => el.classList.remove('recent-activity-highlight'));

    this.isDashboardRecords = false;

    this.isHome = true;


    this.selectedCardType = null;

    this.selectedCardTitle = '';

    this.selectedCardDescription = '';


    this.dashboardRecords = [];

    this.dashboardVisibleRecords = [];

    this.dashboardSearchTerm = '';

    this.dashboardPageNumber = 1;

    this.dashboardTotalPages = 1;


    this.refreshDashboardData();
    this.dashboardTotalRecords = 0;
  }

  // =========================================================
  // DASHBOARD RECORD PAGINATION
  // =========================================================

  dashboardRecordsPerPage = 10;

  dashboardPageNumber = 1;

  dashboardTotalPages = 1;

  dashboardTotalRecords = 0;

  dashboardDisableFirst = true;

  dashboardDisableLast = true;

  dashboardVisibleRecords = [];

  dashboardPageSizeOptions = [
    // {
    //   label: '5',
    //   value: 5
    // },
    {
      label: '10',
      value: 10
    },
    {
      label: '20',
      value: 20
    },
    {
      label: '50',
      value: 50
    }
  ];

  dashboardSearchTerm = '';

  handleDashboardSearch(event) {

    this.dashboardSearchTerm =
      event.target.value
        ? event.target.value.trim().toLowerCase()
        : '';

    this.dashboardPageNumber = 1;

    this.updateDashboardPagination();
  }

  handleDashboardSearchClick() {

    this.dashboardPageNumber = 1;

    this.updateDashboardPagination();
  }

  handleDashboardPageSizeChange(event) {

    this.dashboardRecordsPerPage =
      parseInt(
        event.target.value,
        10
      );

    this.dashboardPageNumber = 1;

    this.updateDashboardPagination();
  }

  updateDashboardPagination() {

    let records =
      this.dashboardRecords || [];


    // =====================================================
    // SEARCH
    // =====================================================

    if (this.dashboardSearchTerm) {

      const searchTerm =
        this.dashboardSearchTerm;

      records =
        records.filter(record => {

          const fileName =
            record.fileName
              ? record.fileName.toLowerCase()
              : '';

          const recipient =
            record.recipientListDisplay
              ? record.recipientListDisplay.toLowerCase()
              : '';

          const currentRecipient =
            record.currentRecipient
              ? record.currentRecipient.toLowerCase()
              : '';

          // Recipient List shows names, so also search the raw emails
          const recipientEmails =
            record.recipientEmailsDisplay
              ? record.recipientEmailsDisplay.toLowerCase()
              : '';

          const status =
            record.status
              ? record.status.toLowerCase()
              : '';


          return (
            fileName.includes(searchTerm) ||
            recipient.includes(searchTerm) ||
            recipientEmails.includes(searchTerm) ||
            currentRecipient.includes(searchTerm) ||
            status.includes(searchTerm)
          );
        });
    }


    // =====================================================
    // TOTAL RECORDS
    // =====================================================

    this.dashboardTotalRecords =
      records.length;


    // =====================================================
    // TOTAL PAGES
    // =====================================================

    this.dashboardTotalPages =
      Math.max(
        1,
        Math.ceil(
          this.dashboardTotalRecords /
          this.dashboardRecordsPerPage
        )
      );


    // =====================================================
    // SAFETY
    // =====================================================

    if (
      this.dashboardPageNumber >
      this.dashboardTotalPages
    ) {

      this.dashboardPageNumber =
        this.dashboardTotalPages;
    }


    if (
      this.dashboardPageNumber < 1
    ) {

      this.dashboardPageNumber = 1;
    }


    // =====================================================
    // START / END
    // =====================================================

    const startIndex =
      (
        this.dashboardPageNumber - 1
      ) *
      this.dashboardRecordsPerPage;


    const endIndex =
      startIndex +
      this.dashboardRecordsPerPage;


    // =====================================================
    // VISIBLE RECORDS
    // =====================================================

    this.dashboardVisibleRecords =
      records
        .slice(
          startIndex,
          endIndex
        )
        .map(
          (record, index) => {
            let formattedExpiryDate = '';
            let remainingTimeText = '';
            let isExpiringWithin24Hours = false;
            let expirationStatusLabel = 'Expiring Soon';

            let remainingTimeClass = '';
            let statusOverride = null;
            let statusClassOverride = null;
            let expiryDisplayOverride = null;

            if (this.selectedCardType === 'expiringSoon' && record.expireDate) {
              const expire = new Date(record.expireDate);
              const now = new Date();

              // Log raw inputs
              console.log('Salesforce raw expireDate:', record.expireDate);
              console.log('LWC received expireDate:', record.expireDate);
              console.log('Salesforce User TimeZoneSidKey:', TIME_ZONE);

              // Format expiryDisplay with TimeZone
              const displayFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: TIME_ZONE,
                dateStyle: 'medium',
                timeStyle: 'short'
              });
              expiryDisplayOverride = displayFormatter.format(expire);

              // Format DD/MM/YYYY with TimeZone
              const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: TIME_ZONE,
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              }).formatToParts(expire);
              let dd = '';
              let mm = '';
              let yyyy = '';
              for (const part of parts) {
                if (part.type === 'day') dd = part.value;
                if (part.type === 'month') mm = part.value;
                if (part.type === 'year') yyyy = part.value;
              }
              formattedExpiryDate = `${dd}/${mm}/${yyyy}`;

              const diffMs = expire - now;
              if (diffMs > 0) {
                const diffHours = diffMs / (1000 * 60 * 60);
                const diffDays = diffMs / (1000 * 60 * 60 * 24);

                if (diffHours < 24) {
                  isExpiringWithin24Hours = true;
                  expirationStatusLabel = 'Expires in 24 Hours';
                  const hours = Math.floor(diffHours);
                  remainingTimeText = hours === 1 ? '1 Hour' : `${hours} Hours`;
                } else if (diffDays >= 7 && diffDays < 14) {
                  remainingTimeText = '1 Week';
                } else if (diffDays >= 14 && diffDays < 21) {
                  remainingTimeText = '2 Weeks';
                } else if (diffDays >= 21 && diffDays < 28) {
                  remainingTimeText = '3 Weeks';
                } else {
                  const days = Math.floor(diffDays);
                  remainingTimeText = days === 1 ? '1 Day' : `${days} Days`;
                }
              } else {
                isExpiringWithin24Hours = true;
                expirationStatusLabel = 'Expired';
                remainingTimeText = '0 Hours';
              }

              if (isExpiringWithin24Hours) {
                remainingTimeClass = 'expiring-urgent-time';
                statusOverride = expirationStatusLabel;
                statusClassOverride = 'dashboard-status-pill expiring-urgent-status';
              } else {
                statusOverride = expirationStatusLabel;
                statusClassOverride = 'dashboard-status-pill expiring-normal-status';
              }

              // Log formatted outputs
              console.log('Current formatted expiry:', formattedExpiryDate);
              console.log('Current remaining time:', remainingTimeText);
            }

            return {
              ...record,
              dashboardRowNumber: startIndex + index + 1,
              formattedExpiryDate,
              expiryDisplay: expiryDisplayOverride || record.expiryDisplay,
              remainingTimeText,
              remainingTimeClass,
              isExpiringWithin24Hours,
              expirationStatusLabel,
              status: statusOverride || record.status,
              statusClass: statusClassOverride || record.statusClass
            };
          }
        );


    // =====================================================
    // BUTTON STATES
    // =====================================================

    this.dashboardDisableFirst =
      this.dashboardPageNumber <= 1;


    this.dashboardDisableLast =
      this.dashboardPageNumber >=
      this.dashboardTotalPages;
  }
  dashboardFirstPage() {

    if (
      this.dashboardPageNumber <= 1
    ) {
      return;
    }

    this.dashboardPageNumber = 1;

    this.updateDashboardPagination();
  }
  dashboardPreviousPage() {

    if (
      this.dashboardPageNumber <= 1
    ) {
      return;
    }

    this.dashboardPageNumber--;

    this.updateDashboardPagination();
  }
  dashboardNextPage() {

    if (
      this.dashboardPageNumber >=
      this.dashboardTotalPages
    ) {
      return;
    }

    this.dashboardPageNumber++;

    this.updateDashboardPagination();
  }
  dashboardLastPage() {

    if (
      this.dashboardPageNumber >=
      this.dashboardTotalPages
    ) {
      return;
    }

    this.dashboardPageNumber =
      this.dashboardTotalPages;

    this.updateDashboardPagination();
  }

    _normalizePdfUrl(url) {
    try {
      return encodeURI(decodeURI(url));
    } catch (e) {
      return encodeURI(url);
    }
  }

  _base64ToBytes(base64Data) {
    const byteCharacters = atob(base64Data);
    const bytes = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      bytes[i] = byteCharacters.charCodeAt(i);
    }
    return bytes;
  }

  async _getPdfBytes(url) {
    let targetUrl = url;
    if (this.useDocApi && (this.sourceKey || url)) {
      try {
        const keyOrUrl = this.sourceKey || url;
        const res = await getDocDownloadUrl({ keyOrUrl });
        if (res && !res.error && res.body) {
          const parsed = typeof res.body === "string" ? JSON.parse(res.body) : res.body;
          const dlUrl = parsed.results?.[0]?.downloadUrl || parsed.downloadUrl;
          if (dlUrl) {
            targetUrl = dlUrl;
          }
        }
      } catch (dlErr) {
        console.warn("[_getPdfBytes] getDocDownloadUrl failed, falling back to original url:", dlErr);
      }
    }
    const safeUrl = this._normalizePdfUrl(targetUrl);
    try {
      const resp = await fetch(safeUrl);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
      return new Uint8Array(await resp.arrayBuffer());
    } catch (clientError) {
      console.warn("Direct PDF fetch failed, falling back to Apex fetchPDF:", clientError);
      const base64Data = await fetchPDF({ pdfUrl: url });
      return this._base64ToBytes(base64Data);
    }
  }

  _getPdfFileName(url) {
    try {
      const name = url.split("?")[0].split("/").pop();
      return decodeURIComponent(name) || "document.pdf";
    } catch (e) {
      return "document.pdf";
    }
  }

  // handleViewDocument(event) {
  //   const url = event.currentTarget.dataset.url;
  //   if (url) {
  //     this.isLoading = true;
  //     fetchPDF({ pdfUrl: url })
  //       .then((base64Data) => {
  //         this.isLoading = false;
  //         const byteCharacters = atob(base64Data);
  //         const byteNumbers = new Array(byteCharacters.length);
  //         for (let i = 0; i < byteCharacters.length; i++) {
  //           byteNumbers[i] = byteCharacters.charCodeAt(i);
  //         }
  //         const byteArray = new Uint8Array(byteNumbers);

  //         if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
  //           throw new Error("pdfjsLib is not available on window.");
  //         }

  //         return window.pdfjsLib.getDocument({ data: byteArray }).promise;
  //       })
  //       .then(async (pdfDoc) => {
  //         this._previewRenderToken++;
  //         const currentToken = this._previewRenderToken;

  //         this.previewPdfDoc = pdfDoc;
  //         this.previewTotalPages = pdfDoc.numPages;
  //         this.previewCurrentPage = 1;

  //         const page1 = await pdfDoc.getPage(1);
  //         const viewport1 = page1.getViewport({ scale: 1 });
  //         const w = viewport1.width;
  //         const h = viewport1.height;

  //         const pages = [];
  //         for (let n = 1; n <= pdfDoc.numPages; n++) {
  //           pages.push({
  //             pageNumber: n,
  //             src: "",
  //             wrapperStyle: `aspect-ratio: ${w} / ${h};`,
  //             altText: `Page ${n}`
  //           });
  //         }
  //         this.previewPages = pages;
  //         this.showPdfPreviewModal = true;

  //         this._renderPreviewPageToList(1, currentToken);
  //         if (pdfDoc.numPages >= 2) {
  //           this._renderPreviewPageToList(2, currentToken);
  //         }

  //         requestAnimationFrame(() => {
  //           if (this._previewRenderToken !== currentToken) return;
  //           this._setupPreviewObserver();
  //           if (!this._previewObserver) {
  //             setTimeout(() => {
  //               if (this._previewRenderToken === currentToken) {
  //                 this._setupPreviewObserver();
  //               }
  //             }, 50);
  //           }
  //         });
  //       })
  //       .catch((error) => {
  //         this.isLoading = false;
  //         console.error("Error viewing PDF:", error);
  //         this.showToast("Error", "Failed to load the document preview.", "error");
  //       });
  //   }
  // }

  _extractDocKey(urlOrKey) {
    if (!urlOrKey) return "";
    try {
      const trimmed = String(urlOrKey).trim();
      if (!/^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
      const parsedUrl = new URL(trimmed);
      const host = parsedUrl.host.toLowerCase();
      if (host.includes(".amazonaws.com") || host.includes(".cloudfront.net")) {
        let pathname = parsedUrl.pathname;
        if (pathname.startsWith("/")) {
          pathname = pathname.substring(1);
        }
        return decodeURIComponent(pathname);
      }
      return trimmed;
    } catch (e) {
      return urlOrKey;
    }
  }

  _parseDocApiBody(res) {
    if (!res || res.error || !res.body) {
      throw new Error(res?.error || "Empty response");
    }
    return typeof res.body === "string" ? JSON.parse(res.body) : res.body;
  }

  async handleViewDocument(event) {
    const raw = event?.currentTarget?.dataset?.url;
    if (!raw) return;

    const tStart = performance.now();
    this._previewKey = this._extractDocKey(raw);
    this.isLoading = true;

    try {
      const res = await getDocPages({ keyOrUrl: this._previewKey });
      const data = this._parseDocApiBody(res);
      const pages = data.results?.[0]?.pages || data.pages;

      if (Array.isArray(pages) && pages.length > 0) {
        this._previewRenderToken++;
        this.previewPdfDoc = null;
        this.previewPages = pages.map((p) => {
          const n = Number(p.pageNumber || p.page);
          const w = Number(p.widthPt) || 612;
          const h = Number(p.heightPt) || 792;
          return {
            pageNumber: n,
            src: p.imageUrl,
            wrapperStyle: `aspect-ratio: ${w} / ${h};`,
            altText: `Page ${n}`
          };
        });
        this.previewTotalPages = pages.length;
        this.previewCurrentPage = 1;
        this.showPdfPreviewModal = true;

        requestAnimationFrame(() => {
          this._setupPreviewObserver();
        });

        const elapsed = Math.round(performance.now() - tStart);
        console.log(`[DASHBOARD-VIEW] action=view, key=${this._previewKey}, pages=${pages.length}, elapsedMs=${elapsed}`);
        return;
      }
      throw new Error("No pages returned from pages API");
    } catch (apiErr) {
      console.warn("[handleViewDocument] Server pages failed, falling back to pdf.js:", apiErr?.message || apiErr);
      await this._viewDocumentWithPdfJs(raw);
      const elapsed = Math.round(performance.now() - tStart);
      console.log(`[DASHBOARD-VIEW] action=view (pdf.js fallback), key=${this._previewKey}, elapsedMs=${elapsed}`);
    } finally {
      this.isLoading = false;
    }
  }

  async _viewDocumentWithPdfJs(url) {
    try {
      let byteArray;
      const safeUrl = this._normalizePdfUrl ? this._normalizePdfUrl(url) : url;
      try {
        const resp = await fetch(safeUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
        byteArray = new Uint8Array(await resp.arrayBuffer());
      } catch (directErr) {
        console.warn("Direct PDF fetch failed in preview fallback, calling fetchPDF:", directErr);
        const base64Data = await fetchPDF({ pdfUrl: url });
        byteArray = this._base64ToBytes(base64Data);
      }

      if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
        throw new Error("pdfjsLib is not available on window.");
      }

      const pdfDoc = await window.pdfjsLib.getDocument({ data: byteArray }).promise;
      this._previewRenderToken++;
      const currentToken = this._previewRenderToken;

      this.previewPdfDoc = pdfDoc;
      this.previewTotalPages = pdfDoc.numPages;
      this.previewCurrentPage = 1;

      const page1 = await pdfDoc.getPage(1);
      const viewport1 = page1.getViewport({ scale: 4 });
      const w = viewport1.width;
      const h = viewport1.height;

      const pages = [];
      for (let n = 1; n <= pdfDoc.numPages; n++) {
        pages.push({
          pageNumber: n,
          src: "",
          wrapperStyle: `aspect-ratio: ${w} / ${h};`,
          altText: `Page ${n}`
        });
      }
      this.previewPages = pages;
      this.showPdfPreviewModal = true;

      this._renderPreviewPageToList(1, currentToken);
      if (pdfDoc.numPages >= 2) {
        this._renderPreviewPageToList(2, currentToken);
      }

      requestAnimationFrame(() => {
        if (this._previewRenderToken !== currentToken) return;
        this._setupPreviewObserver();
        if (!this._previewObserver) {
          setTimeout(() => {
            if (this._previewRenderToken === currentToken) {
              this._setupPreviewObserver();
            }
          }, 50);
        }
      });
    } catch (error) {
      console.error("Error viewing PDF with pdf.js fallback:", error);
      this.showToast("Error", "Failed to load the document preview.", "error");
    }
  }

  async handlePreviewImageError(event) {
    if (this._previewRefreshing || !this._previewKey) {
      return;
    }
    this._previewRefreshing = true;

    try {
      console.warn("[handlePreviewImageError] Preview image failed to load, refreshing signed URLs for key:", this._previewKey);
      const res = await getDocPages({ keyOrUrl: this._previewKey });
      const data = this._parseDocApiBody(res);
      const pages = data.results?.[0]?.pages || data.pages;

      if (Array.isArray(pages) && pages.length > 0) {
        const pageMap = new Map();
        pages.forEach((p) => {
          const n = Number(p.pageNumber || p.page);
          if (n && p.imageUrl) {
            pageMap.set(n, p.imageUrl);
          }
        });

        this.previewPages = (this.previewPages || []).map((pg) => {
          const freshSrc = pageMap.get(pg.pageNumber);
          return freshSrc ? { ...pg, src: freshSrc } : pg;
        });
      } else {
        throw new Error("No pages returned during refresh");
      }
    } catch (refreshErr) {
      console.error("[handlePreviewImageError] Failed to refresh preview URLs:", refreshErr);
      this.showToast("Error", "Failed to render document page.", "error");
    }
  }

  async _renderPreviewPageToList(pageNumber, token) {
    if (token !== this._previewRenderToken) return;
    if (!this.previewPdfDoc) return;

    const pageItem = (this.previewPages || []).find((p) => p.pageNumber === pageNumber);
    if (pageItem && pageItem.src) return;

    if (this._previewRendering.has(pageNumber)) return;
    this._previewRendering.add(pageNumber);

    try {
      const page = await this.previewPdfDoc.getPage(pageNumber);
      if (token !== this._previewRenderToken) return;

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      if (token !== this._previewRenderToken) return;

      const src = canvas.toDataURL("image/jpeg", 0.9);
      const aspectStyle = `aspect-ratio: ${viewport.width} / ${viewport.height};`;

      this.previewPages = this.previewPages.map((p) => {
        if (p.pageNumber === pageNumber) {
          return {
            ...p,
            src: src,
            wrapperStyle: aspectStyle
          };
        }
        return p;
      });
    } catch (error) {
      if (token !== this._previewRenderToken) return;
      console.error(`Error rendering preview page ${pageNumber}:`, error);
      this.showToast("Error", "Failed to render document page.", "error");
    } finally {
      this._previewRendering.delete(pageNumber);
    }
  }

  _setupPreviewObserver() {
    if (this._previewObserver) {
      this._previewObserver.disconnect();
      this._previewObserver = null;
    }

    const scrollEl = this.template.querySelector(".doc-viewer-scroll");
    if (!scrollEl) return;

    const pageElements = this.template.querySelectorAll(".doc-viewer-page[data-page-number]");
    if (!pageElements || pageElements.length === 0) return;

    const pageVisibilityMap = new Map();

    const observerOptions = {
      root: scrollEl,
      rootMargin: "800px 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    };

    this._previewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const pageNum = parseInt(entry.target.dataset.pageNumber, 10);
        if (!isNaN(pageNum)) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            this._renderPreviewPageToList(pageNum, this._previewRenderToken);
          }
          pageVisibilityMap.set(pageNum, entry.intersectionRatio);
        }
      });

      let maxRatio = -1;
      let mostVisiblePage = this.previewCurrentPage;

      for (const [pageNum, ratio] of pageVisibilityMap.entries()) {
        if (ratio > maxRatio) {
          maxRatio = ratio;
          mostVisiblePage = pageNum;
        }
      }

      if (mostVisiblePage && mostVisiblePage !== this.previewCurrentPage && maxRatio > 0.05) {
        this.previewCurrentPage = mostVisiblePage;
      }
    }, observerOptions);

    pageElements.forEach((el) => this._previewObserver.observe(el));
  }

  async renderPreviewPage(pageNumber) {
    if (!this.previewPdfDoc) {
      this.previewCurrentPage = pageNumber;
      const targetPageEl = this.template.querySelector(`.doc-viewer-page[data-page-number="${pageNumber}"]`);
      if (targetPageEl) {
        targetPageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    this.isPreviewLoading = true;
    try {
      const page = await this.previewPdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      this.previewImageSrc = canvas.toDataURL("image/jpeg", 0.9);
      this.previewCurrentPage = pageNumber;
    } catch (error) {
      console.error("Error rendering preview page:", error);
      this.showToast("Error", "Failed to render document page.", "error");
    } finally {
      this.isPreviewLoading = false;
    }
  }

  handlePrevPreviewPage() {
    if (this.previewCurrentPage > 1) {
      this.renderPreviewPage(this.previewCurrentPage - 1);
    }
  }

  handleNextPreviewPage() {
    if (this.previewCurrentPage < this.previewTotalPages) {
      this.renderPreviewPage(this.previewCurrentPage + 1);
    }
  }

  get isFirstPreviewPage() {
    return this.previewCurrentPage === 1;
  }

  get isLastPreviewPage() {
    return this.previewCurrentPage === this.previewTotalPages;
  }

  closePdfPreviewModal() {
    this._previewRenderToken++;
    this._previewKey = null;
    this._previewRefreshing = false;
    if (this._previewObserver) {
      this._previewObserver.disconnect();
      this._previewObserver = null;
    }
    if (this._previewRendering) {
      this._previewRendering.clear();
    }
    this.previewPages = [];

    if (this.previewPdfDoc) {
      try {
        this.previewPdfDoc.destroy();
      } catch (err) {
        // Ignore destroy error
      }
    }
    this.previewPdfDoc = null;
    this.previewImageSrc = "";
    this.previewCurrentPage = 1;
    this.previewTotalPages = 1;
    this.showPdfPreviewModal = false;
  }

  // handleDownloadDocument(event) {
  //   const url = event.currentTarget.dataset.url;
  //   if (url) {
  //     this.isLoading = true;
  //     fetchPDF({ pdfUrl: url })
  //       .then((base64Data) => {
  //         this.isLoading = false;
  //         const byteCharacters = atob(base64Data);
  //         const byteNumbers = new Array(byteCharacters.length);
  //         for (let i = 0; i < byteCharacters.length; i++) {
  //           byteNumbers[i] = byteCharacters.charCodeAt(i);
  //         }
  //         const byteArray = new Uint8Array(byteNumbers);
  //         const blob = new Blob([byteArray], { type: 'application/pdf' });
  //         const blobUrl = window.URL.createObjectURL(blob);

  //         let filename = 'document.pdf';
  //         try {
  //           const parts = url.split('/');
  //           filename = parts[parts.length - 1].split('?')[0] || 'document.pdf';
  //         } catch (e) { }

  //         const link = document.createElement('a');
  //         link.href = blobUrl;
  //         link.download = filename;
  //         document.body.appendChild(link);
  //         link.click();
  //         document.body.removeChild(link);
  //         window.URL.revokeObjectURL(blobUrl);
  //       })
  //       .catch((error) => {
  //         this.isLoading = false;
  //         console.error("Error downloading PDF:", error);
  //         this.showToast("Error", "Failed to download the document.", "error");
  //       });
  //   }
  // }

  async handleDownloadDocument(event) {
    const raw = event?.currentTarget?.dataset?.url;
    if (!raw) return;

    const status = event?.currentTarget?.dataset?.status;
    const isCompleted = status === 'Completed' || this.isCompletedCard;

    if (isCompleted) {
      const fileName = event?.currentTarget?.dataset?.name || this._getPdfFileName(raw);
      this._downloadTarget = {
        url: raw,
        key: this._extractDocKey(raw),
        name: fileName
      };
      this.downloadModalSingleOption = false;
      this.isDownloadModalOpen = true;
      return;
    }

    const tStart = performance.now();
    const key = this._extractDocKey(raw);
    const fileName = this._getPdfFileName(raw);
    this.isLoading = true;

    try {
      let dlUrl;
      try {
        const res = await getDocDownloadUrl({ keyOrUrl: key });
        const data = this._parseDocApiBody(res);
        dlUrl = data.results?.[0]?.downloadUrl || data.downloadUrl;
        if (!dlUrl) {
          throw new Error("No downloadUrl returned from download API");
        }
      } catch (docApiErr) {
        console.warn("[handleDownloadDocument] getDocDownloadUrl failed, falling back to fetchPDF:", docApiErr?.message || docApiErr);
        const base64Data = await fetchPDF({ pdfUrl: raw });
        const byteArray = this._base64ToBytes(base64Data);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);

        const elapsed = Math.round(performance.now() - tStart);
        console.log(`[DASHBOARD-DOWNLOAD] action=download (fetchPDF fallback), key=${key}, elapsedMs=${elapsed}`);
        return;
      }

      const safeDlUrl = dlUrl.split("?")[0];
      const elapsed = Math.round(performance.now() - tStart);
      console.log(`[DASHBOARD-DOWNLOAD] action=download, key=${key}, downloadUrl=${safeDlUrl}, elapsedMs=${elapsed}`);

      try {
        const resp = await fetch(dlUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
        const blob = await resp.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } catch (fetchErr) {
        console.warn("[handleDownloadDocument] Blob fetch failed, opening download URL in new tab:", fetchErr);
        window.open(dlUrl, "_blank");
      }
    } catch (err) {
      console.error("Error downloading document:", err);
      this.showToast("Error", "Failed to download the document.", "error");
    } finally {
      this.isLoading = false;
    }
  }

  // Download Completed Document Options Modal
  @track isDownloadModalOpen = false;
  @track downloadModalSingleOption = false;
  @track isDownloadLoading = false;
  @track downloadingVariant = '';
  _downloadTarget = null;

  get isDownloadingDocument() {
    return this.isDownloadLoading && this.downloadingVariant === 'document';
  }

  get isDownloadingCertificate() {
    return this.isDownloadLoading && this.downloadingVariant === 'certificate';
  }

  get isDownloadingCombined() {
    return this.isDownloadLoading && this.downloadingVariant === 'combined';
  }

  get downloadTargetFileName() {
    return this._downloadTarget?.name || 'document';
  }

  closeDownloadModal() {
    this.isDownloadModalOpen = false;
    this.downloadModalSingleOption = false;
    this._downloadTarget = null;
    this.isDownloadLoading = false;
    this.downloadingVariant = '';
  }

  async handleDownloadVariant(event) {
    const variant = event?.currentTarget?.dataset?.variant || 'document';
    const target = this._downloadTarget?.key || this._downloadTarget?.url;
    if (!target) {
      this.showToast('Warning', 'Document not available', 'warning');
      this.closeDownloadModal();
      return;
    }

    this.isDownloadLoading = true;
    this.downloadingVariant = variant;
    const tStart = performance.now();
    const docName = this._downloadTarget?.name || 'Document.pdf';
    const fileName = getVariantFileName(docName, variant);

    try {
      const res = await getDownloadUrlVariant({
        keyOrUrl: target,
        variant,
        fileName
      });
      const data = this._parseDocApiBody(res);
      const item = data?.results?.[0] || data;

      if (item?.status === 'error' && item?.error === 'certificate_not_available') {
        if (item?.certificateEmbedded) {
          this.showToast('Info', 'This document was signed before certificates were stored separately. The certificate is already included in the document.', 'info');
          this.downloadModalSingleOption = true;
        } else {
          this.showToast('Warning', 'Certificate not available for this document.', 'warning');
        }
        return;
      }

      if (item?.status === 'error' || (!item?.downloadUrl && !data?.downloadUrl)) {
        throw new Error(item?.error || data?.error || 'Download failed');
      }

      const dlUrl = item?.downloadUrl || data?.downloadUrl;
      const downloadName = item?.fileName || fileName;

      try {
        const resp = await fetch(dlUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
        const blob = await resp.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } catch (fetchErr) {
        console.warn("[handleDownloadVariant] Blob fetch failed, opening download URL in new tab:", fetchErr);
        window.open(dlUrl, "_blank");
      }

      const safeKey = String(target).split('?')[0];
      console.log(`[DASHBOARD-DOWNLOAD] action=download-variant, variant=${variant}, key=${safeKey}, duration=${Math.round(performance.now() - tStart)}ms`);
      this.closeDownloadModal();
    } catch (err) {
      console.error('Download variant error:', err);
      this.showToast('Error', err?.message || 'Failed to download the document.', 'error');
    } finally {
      this.isDownloadLoading = false;
      this.downloadingVariant = '';
    }
  }

  showRemindAllConfirmation = false;

  // Remind All: every pending record on the Expiring Soon card (not limited by search / page)
  handleRemindAll() {
    const recordIds = (this.dashboardRecords || []).map(record => record.id);

    if (!recordIds.length) {
      this.showToast('Info', 'There are no pending documents to remind.', 'info');
      return;
    }

    this.showRemindAllConfirmation = true;
  }

  handleRemindAllConfirm() {
    this.showRemindAllConfirmation = false;

    const recordIds = (this.dashboardRecords || []).map(record => record.id);

    if (!recordIds.length) {
      return;
    }

    this.sendReminders(recordIds);
  }

  handleRemindAllCancel() {
    this.showRemindAllConfirmation = false;
  }

  // Bell icon: single record
  handleRemindRecipient(event) {
    const recordId = event.currentTarget.dataset.id;

    if (!recordId) {
      return;
    }

    this.sendReminders([recordId]);
  }

  sendReminders(recordIds) {
    this.isLoading = true;

    sendSignatureReminders({ offerTemplateIds: recordIds })
      .then((queuedCount) => {
        this.isLoading = false;

        if (queuedCount > 0) {
          this.showToast('Success', `Reminder queued for ${queuedCount} recipient(s).`, 'success');
        } else {
          this.showToast('Info', 'No pending recipients found to remind.', 'info');
        }
      })
      .catch((error) => {
        this.isLoading = false;
        console.error('Error sending reminders:', error);
        this.showToast('Error', (error && error.body && error.body.message) || 'Failed to send reminders.', 'error');
      });
  }

  getDashboardStatusClass(status) {

    const baseClass =
      'dashboard-status-pill';


    if (!status) {
      return baseClass +
        ' dashboard-status-secondary';
    }


    const normalizedStatus =
      status.toLowerCase();


    if (
      normalizedStatus === 'pending'
    ) {

      return baseClass +
        ' dashboard-status-pending';
    }


    if (
      normalizedStatus === 'completed'
    ) {

      return baseClass +
        ' dashboard-status-completed';
    }


    if (
      normalizedStatus === 'rejected'
    ) {

      return baseClass +
        ' dashboard-status-rejected';
    }


    if (
      normalizedStatus === 'approved'
    ) {

      return baseClass +
        ' dashboard-status-approved';
    }


    return baseClass +
      ' dashboard-status-secondary';
  }

  handleDashboardViewDocument(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      window.open(url, '_blank');
    }
  }

  handleDashboardDownloadDocument(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  handleRecentActivityClick(event) {
    const targetId = event.currentTarget.dataset.recordId;
    const category = event.currentTarget.dataset.category;

    if (!targetId) return;

    let cardType;
    if (category === 'Action Required') {
      cardType = 'actionRequired';
    } else if (category === 'Waiting for Others') {
      cardType = 'waitingForOthers';
    } else if (category === 'Expiring Soon') {
      cardType = 'expiringSoon';
    } else if (category === 'Completed') {
      cardType = 'completed';
    } else {
      return;
    }

    if (this.applyTimeout) {
      clearTimeout(this.applyTimeout);
      this.applyTimeout = null;
    }
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = null;
    }
    const existingHighlights = this.template.querySelectorAll('.recent-activity-highlight');
    existingHighlights.forEach(el => el.classList.remove('recent-activity-highlight'));

    this.pendingHighlightRecordId = targetId;

    const isAlreadyOpen = this.isDashboardRecords && this.selectedCardType === cardType;
    if (isAlreadyOpen) {
      this.dashboardSearchTerm = '';
      const recordIndex = this.dashboardRecords.findIndex(r => r.id === targetId);
      if (recordIndex >= 0) {
        const targetPage = Math.floor(recordIndex / this.dashboardRecordsPerPage) + 1;
        if (this.dashboardPageNumber !== targetPage) {
          this.dashboardPageNumber = targetPage;
          this.updateDashboardPagination();
        } else {
          this.applyPendingHighlight();
        }
      }
    } else {
      this.openDashboardCard(cardType);
    }
  }

  handleRecentActivityKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleRecentActivityClick(event);
    }
  }

  // ====================================================================
  // FIELD GUIDE (DocuSign-Style Tab Navigation)
  // ====================================================================

  get guideTargets() {
    if (!this.hasActiveRecipient || !this.activeRecipient) {
      return [];
    }
    const activeEmail = this.activeRecipient.email ? String(this.activeRecipient.email).trim() : '';
    if (!activeEmail) {
      return [];
    }
    const recipientPlaceholders = (this.placeholders || []).filter(
      (p) => p.recipient === activeEmail
    );
    return this._sortPlaceholders(recipientPlaceholders);
  }

  get isGuideVisible() {
    return (
      this.guideTargets.length > 0 &&
      !this.isLoading &&
      !this.isLoadingCircle &&
      !this.showDocumentTypeModal &&
      !this.showPdfPreviewModal &&
      !this.showEditModal &&
      !this.showDeleteModal &&
      !this.showRecipientModal &&
      !this.showUpgradeModal &&
      !this.isEditRecipientsModalOpen &&
      !this.isConfirmationPopupVisible &&
      this.guidePageNumber != null
    );
  }

  get currentGuideTarget() {
    const targets = this.guideTargets;
    if (!targets || targets.length === 0) return null;
    if (this.guideTargetId != null) {
      const matched = targets.find((t) => t.id === this.guideTargetId);
      if (matched) return matched;
    }
    if (this.guideIndex >= 0 && this.guideIndex < targets.length) {
      return targets[this.guideIndex];
    }
    return targets[0];
  }

  get guideLabel() {
    if (this.guideIndex === -1) {
      return 'START';
    }
    if (this.guideIndex === this.guideTargets.length - 1) {
      return 'BACK TO START';
    }
    return 'NEXT';
  }

  get guideCounterText() {
    const targets = this.guideTargets;
    if (this.guideIndex === -1 || targets.length === 0) {
      return '';
    }
    const currentNum = this.guideIndex + 1;
    return `${currentNum} / ${targets.length}`;
  }

  get guideAriaLabel() {
    const targets = this.guideTargets;
    if (this.guideIndex === -1) {
      return `Start field guide, ${targets.length} total fields for ${this.activeRecipient?.label || 'active recipient'}`;
    }
    const target = this.currentGuideTarget;
    const currentNum = this.guideIndex + 1;
    if (this.guideIndex === targets.length - 1) {
      // return `Back to start, field 1 of ${targets.length}`;
      return `Back to start, field ${currentNum} of ${targets.length}`;
    }
    return `Next field: ${this._getPlaceholderDisplayName(target)}, ${currentNum} of ${targets.length}`;
  }

  _getPlaceholderDisplayName(placeholder) {
    if (!placeholder) return 'Field';
    if (placeholder.isCustom) {
      const current = Array.isArray(this.customFields)
        ? this.customFields.find((cf) => cf.key === placeholder.customKey)
        : null;
      return current?.label || placeholder.label || 'Custom Field';
    }
    const standardFieldMap = {
      FullName: 'Full Name',
      Email: 'Email',
      ContactNumber: 'Contact Number',
      Address: 'Address',
      Date: 'Date',
      DateOfSigning: 'Date of Signing',
      Initials: 'Title',
      NameInitials: 'Initials',
      ABN: 'ABN',
      Signature: 'Signature',
      Name: 'First Name',
      LastName: 'Last Name'
    };
    return standardFieldMap[placeholder.type] || 'Field';
  }

  get guideTitle() {
    return this.guideAriaLabel;
  }

  get showPrevButton() {
    return this.guideIndex > 0;
  }

  get guideTabClass() {
    return `fg-tab-btn ${this.isGuideCompact ? 'compact' : ''}`;
  }

  get guideTabStyle() {
    const activeColor = this.activeRecipient?.color;
    const validColor = /^#[0-9a-fA-F]{6}$/.test(activeColor || '') ? activeColor : '#0176D3';
    const hoverColor = this._darkenColor(validColor, 0.1);
    const textColor = this._readableTextColor(validColor);
    const ringColor = this._hexToRgba(validColor, 0.4);

    return [
      `--fg-top:${this.guideTopPx}px;`,
      `--fg-left:${this.guideLeftPx}px;`,
      `--fg-color:${validColor};`,
      `--fg-color-hover:${hoverColor};`,
      `--fg-text:${textColor};`,
      `--fg-ring:${ringColor};`
    ].join('');
  }

  _sortPlaceholders(placeholders) {
    if (!Array.isArray(placeholders) || placeholders.length === 0) {
      return [];
    }
    return [...placeholders].sort((a, b) => {
      const pageA = Number(a.page) || 1;
      const pageB = Number(b.page) || 1;
      if (pageA !== pageB) {
        return pageA - pageB;
      }

      const yA = a.yPt != null ? Number(a.yPt) : (a.y != null ? Number(a.y) : 0);
      const yB = b.yPt != null ? Number(b.yPt) : (b.y != null ? Number(b.y) : 0);

      if (Math.abs(yA - yB) < 8) {
        const xA = a.xPt != null ? Number(a.xPt) : (a.x != null ? Number(a.x) : 0);
        const xB = b.xPt != null ? Number(b.xPt) : (b.x != null ? Number(b.x) : 0);
        return xA - xB;
      }
      return yA - yB;
    });
  }

  _readableTextColor(hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) {
      return '#FFFFFF';
    }
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const rLin = toLinear(r);
    const gLin = toLinear(g);
    const bLin = toLinear(b);

    const luminance = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
    return luminance > 0.55 ? '#181818' : '#FFFFFF';
  }

  _darkenColor(hex, factor = 0.1) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) {
      return '#014486';
    }
    const r = Math.max(0, Math.floor(parseInt(hex.slice(1, 3), 16) * (1 - factor)));
    const g = Math.max(0, Math.floor(parseInt(hex.slice(3, 5), 16) * (1 - factor)));
    const b = Math.max(0, Math.floor(parseInt(hex.slice(5, 7), 16) * (1 - factor)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  _hexToRgba(hex, alpha = 0.4) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) {
      return `rgba(1, 118, 211, ${alpha})`;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  _pulseAndScrollElement(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    el.classList.remove('fg-pulse');
    void el.offsetWidth;
    el.classList.add('fg-pulse');

    const onAnimationEnd = () => {
      el.classList.remove('fg-pulse');
      el.removeEventListener('animationend', onAnimationEnd);
    };
    el.addEventListener('animationend', onAnimationEnd, { once: true });
  }

  _updateHostColorProperties() {
    const activeColor = this.activeRecipient?.color;
    const validColor = /^#[0-9a-fA-F]{6}$/.test(activeColor || '') ? activeColor : '#0176D3';
    const ringColor = this._hexToRgba(validColor, 0.4);
    if (this.template?.host) {
      this.template.host.style.setProperty('--fg-color', validColor);
      this.template.host.style.setProperty('--fg-ring', ringColor);
    }
  }

  _positionGuide() {
    if (!this.isGuideVisible && this.guideTargets.length === 0) {
      if (this.guidePageNumber !== null) this.guidePageNumber = null;
      return;
    }

    const target = this.currentGuideTarget;
    if (!target) {
      if (this.guidePageNumber !== null) this.guidePageNumber = null;
      return;
    }

    window.requestAnimationFrame(() => {
      const targetEl = this.template.querySelector(`.placeholder-container[data-id="${target.id}"]`);
      if (!targetEl) {
        this._guideDirty = true;
        return;
      }

      const offsetTop = targetEl.offsetTop;
      const offsetHeight = targetEl.offsetHeight;
      const z = this._getZoom();
      const tabHeight = 36;
      const tabWidth = 96;

      let computedTop = (offsetTop + offsetHeight / 2) * z - tabHeight / 2;

      const vp = this.template.querySelector('.canvas-viewport');
      const wrapperEl = this.template.querySelector(`.page-zoom-wrapper[data-page-number="${target.page}"]`)
        || targetEl.closest('.page-zoom-wrapper');

      const pageHeightPx = wrapperEl ? wrapperEl.offsetHeight : 1448 * z;
      computedTop = Math.max(0, Math.min(computedTop, pageHeightPx - tabHeight));

      let isCompact = false;
      if (vp && wrapperEl) {
        const vpRect = vp.getBoundingClientRect();
        const pageRect = wrapperEl.getBoundingClientRect();
        const gutterLeft = pageRect.left - vpRect.left;
        if (gutterLeft < (tabWidth + 16)) {
          isCompact = true;
        }
      }

      const computedLeft = isCompact ? 0 : -(tabWidth + 8);

      const newTop = Math.round(computedTop);
      const newLeft = Math.round(computedLeft);
      const newPage = target.page;

      if (
        this.guideTopPx !== newTop ||
        this.guideLeftPx !== newLeft ||
        this.guidePageNumber !== newPage ||
        this.isGuideCompact !== isCompact
      ) {
        this.guideTopPx = newTop;
        this.guideLeftPx = newLeft;
        this.guidePageNumber = newPage;
        this.isGuideCompact = isCompact;
      }
      this._guideDirty = false;
    });
  }

  handleGuideClick(event) {
    event.stopPropagation();
    const targets = this.guideTargets;
    if (!targets || targets.length === 0) return;

    if (this.guideIndex === -1) {
      this.guideIndex = 0;
    } else if (this.guideIndex >= targets.length - 1) {
      if (targets.length === 1) {
        // Only one field: first and last are the same, so "Back to start"
        // returns to the START state instead of re-selecting index 0.
        this._resetGuide();
        const onlyEl = this.template.querySelector(`.placeholder-container[data-id="${targets[0].id}"]`);
        this._pulseAndScrollElement(onlyEl);
        return;
      }
      this.guideIndex = 0;
    } else {
      this.guideIndex += 1;
    }

    const target = targets[this.guideIndex];
    if (target) {
      this.guideTargetId = target.id;
      this.guidePageNumber = target.page;
      const targetEl = this.template.querySelector(`.placeholder-container[data-id="${target.id}"]`);
      this._pulseAndScrollElement(targetEl);
    }
    this._positionGuide();
  }

  handleGuidePrev(event) {
    event.stopPropagation();
    const targets = this.guideTargets;
    if (!targets || targets.length === 0 || this.guideIndex <= 0) return;

    this.guideIndex -= 1;
    const target = targets[this.guideIndex];
    if (target) {
      this.guideTargetId = target.id;
      this.guidePageNumber = target.page;
      const targetEl = this.template.querySelector(`.placeholder-container[data-id="${target.id}"]`);
      this._pulseAndScrollElement(targetEl);
    }
    this._positionGuide();
  }

  handleGuideWrapperClick(event) {
    event.stopPropagation();
  }

  _resetGuide() {
    this.guideIndex = -1;
    this.guideTargetId = null;
    this._updateHostColorProperties();
    this._guideDirty = true;
    this._positionGuide();
  }

  _onPlaceholdersChanged() {
    this._updateHostColorProperties();
    const targets = this.guideTargets;
    if (targets.length === 0) {
      this.guideIndex = -1;
      this.guideTargetId = null;
      this.guidePageNumber = null;
      return;
    }
    if (this.guideTargetId != null) {
      const existingIndex = targets.findIndex((t) => t.id === this.guideTargetId);
      if (existingIndex !== -1) {
        this.guideIndex = existingIndex;
      } else {
        this.guideIndex = Math.min(Math.max(0, this.guideIndex), targets.length - 1);
        this.guideTargetId = targets[this.guideIndex].id;
      }
    } else if (this.guideIndex >= targets.length) {
      this.guideIndex = targets.length - 1;
      this.guideTargetId = targets[this.guideIndex].id;
    }
    this._guideDirty = true;
    this._positionGuide();
  }

  renderedCallback() {
    if (this.pendingHighlightRecordId && !this.isDashboardRecordsLoading) {
      this.applyPendingHighlight();
    }

    // --- FIELD GUIDE CHANGE DETECTION (Revision 5) ---
    this._updateHostColorProperties();

    const currentRecipientKey = this.activeRecipientKey;
    const targets = this.guideTargets;
    const sig = `${currentRecipientKey}|${targets.map(t => [t.id, t.page, t.xPt, t.yPt, t.recipient].join(':')).join(',')}`;

    if (currentRecipientKey !== this._lastGuideRecipientKey) {
      this._lastGuideRecipientKey = currentRecipientKey;
      this._lastGuideSig = sig;
      this._resetGuide();
    } else if (sig !== this._lastGuideSig) {
      this._lastGuideSig = sig;
      this._onPlaceholdersChanged();
    } else if (this._guideDirty) {
      this._positionGuide();
    }

    if (this.isThumbnailPanelOpen) {
      this._syncThumbnailScroll();
    }
  }

  applyPendingHighlight() {
    const targetId = this.pendingHighlightRecordId;
    const row = this.template.querySelector(`tr[data-record-id="${targetId}"]`);
    if (!row) {
      return; // Element not rendered yet, keep pendingHighlightRecordId and retry on next render
    }

    this.pendingHighlightRecordId = null;

    if (this.applyTimeout) {
      clearTimeout(this.applyTimeout);
    }

    this.applyTimeout = setTimeout(() => {
      row.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      row.classList.add('recent-activity-highlight');

      if (this.highlightTimeout) {
        clearTimeout(this.highlightTimeout);
      }

      this.highlightTimeout = setTimeout(() => {
        row.classList.remove('recent-activity-highlight');
        this.highlightTimeout = null;
      }, 4000);

      this.applyTimeout = null;
    }, 50);
  }

  // ====================================================================
  // PAGE THUMBNAILS PANEL (Docked Push Panel)
  // ====================================================================

  get toolbarClass() {
    return `canvas-top-toolbar ${this.isThumbnailPanelOpen ? 'with-thumbs' : ''}`;
  }

  get toolbarThumbsBtnClass() {
    return `toolbar-icon-btn toolbar-thumbs-btn ${this.isThumbnailPanelOpen ? 'active' : ''}`;
  }

  get thumbnailPanelClass() {
    return `tc-thumb-panel custom-scroll ${this.isThumbnailPanelOpen ? 'open' : ''}`;
  }

  get thumbnailItems() {
    const total = Number(this.totalPages) || 0;
    if (total <= 0) return [];

    const pagesMap = new Map();
    (this.pagesData || []).forEach((p) => {
      pagesMap.set(Number(p.pageNumber), p);
    });

    const placeholders = this.placeholders || [];
    const activeEmail = this.activeRecipient?.email ? String(this.activeRecipient.email).trim() : null;
    const activeLabel = this.activeRecipientDisplayName || 'active recipient';
    const activeColor = this.activeRecipient?.color || '#0176D3';

    const items = [];
    for (let pageNum = 1; pageNum <= total; pageNum++) {
      const pageData = pagesMap.get(pageNum);
      const baseW = pageData?.baseWidth || 1024;
      const baseH = pageData?.baseHeight || 1448;
      const aspectRatio = `${baseW} / ${baseH}`;

      const src = this.thumbnailSrcByPage ? this.thumbnailSrcByPage[pageNum] : null;
      const hasImage = Boolean(src);

      const pagePlaceholders = placeholders.filter((p) => Number(p.page) === pageNum);
      const placeholderCount = pagePlaceholders.length;
      const hasPlaceholders = placeholderCount > 0;
      const badgeTitle = `${placeholderCount} ${placeholderCount === 1 ? 'field' : 'fields'}`;

      const hasActiveRecipientFields = Boolean(
        activeEmail && pagePlaceholders.some((p) => p.recipient === activeEmail)
      );

      const isActive = pageNum === this.currentPage;

      items.push({
        page: pageNum,
        pageLabel: `Page ${pageNum}`,
        src,
        hasImage,
        aspectRatio,
        skeletonStyle: `aspect-ratio: ${aspectRatio};`,
        imageStyle: `aspect-ratio: ${aspectRatio};`,
        hasPlaceholders,
        placeholderCount,
        badgeTitle,
        hasActiveRecipientFields,
        recipientDotTitle: `Has fields for ${activeLabel}`,
        recipientDotStyle: `background-color: ${activeColor};`,
        isActive,
        className: `tc-thumb-item ${isActive ? 'active' : ''}`,
        ariaLabel: `Go to page ${pageNum}`,
        ariaCurrent: isActive ? 'page' : null
      });
    }
    return items;
  }

  handleToggleThumbnails() {
    this.isThumbnailPanelOpen = !this.isThumbnailPanelOpen;
    if (this.isThumbnailPanelOpen) {
      if (!this._hasGeneratedThumbnails && !this.isLoading && !this.showSpinner) {
        this.generateThumbnailsAsync();
      }
      this._thumbNeedsScrollSync = true;
      setTimeout(() => {
        this._syncThumbnailScroll(true);
      }, 210);
    }
  }

  handleThumbnailPanelTransitionEnd(event) {
    if (event.propertyName === 'width') {
      if (typeof this._positionGuide === 'function') {
        this._guideDirty = true;
        this._positionGuide();
      }
      if (this.isThumbnailPanelOpen) {
        this._syncThumbnailScroll(true);
      }
    }
  }

  handleThumbnailClick(event) {
    const page = Number(event.currentTarget.dataset.page);
    if (page) {
      this.scrollToPage(page);
    }
  }

  handleThumbnailKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const page = Number(event.currentTarget.dataset.page);
      if (page) {
        this.scrollToPage(page);
      }
    }
  }

  async generateThumbnailsAsync() {
    if (this._usingServerPages || !this.pdfDoc || this._isGeneratingThumbnails) return;

    const currentGenId = ++this._thumbGenId;
    this._isGeneratingThumbnails = true;

    try {
      const total = Number(this.totalPages) || (this.pdfDoc.numPages || 0);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      for (let i = 1; i <= total; i++) {
        if (this._thumbGenId !== currentGenId) {
          return;
        }

        try {
          const page = await this.pdfDoc.getPage(i);
          if (this._thumbGenId !== currentGenId) return;

          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = Math.round(viewport.width * dpr);
          canvas.height = Math.round(viewport.height * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          await page.render({ canvasContext: ctx, viewport }).promise;
          if (this._thumbGenId !== currentGenId) {
            canvas.width = 0;
            canvas.height = 0;
            return;
          }

          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

          canvas.width = 0;
          canvas.height = 0;

          this.thumbnailSrcByPage = {
            ...this.thumbnailSrcByPage,
            [i]: dataUrl
          };
        } catch (pageErr) {
          console.warn(`[THUMBNAILS] Failed to generate thumbnail for page ${i}:`, pageErr);
        }

        if (i % 3 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      if (this._thumbGenId === currentGenId) {
        this._hasGeneratedThumbnails = true;
      }
    } catch (err) {
      console.error("[THUMBNAILS] Error generating thumbnails:", err);
    } finally {
      if (this._thumbGenId === currentGenId) {
        this._isGeneratingThumbnails = false;
      }
    }
  }

  _syncThumbnailScroll(force = false) {
    if (!this.isThumbnailPanelOpen) return;
    if (!force && this._lastThumbSyncedPage === this.currentPage && !this._thumbNeedsScrollSync) {
      return;
    }

    this._lastThumbSyncedPage = this.currentPage;
    this._thumbNeedsScrollSync = false;

    const panel = this.template.querySelector('.tc-thumb-panel');
    if (!panel) return;

    const activeItem = panel.querySelector(`.tc-thumb-item[data-page="${this.currentPage}"]`);
    if (!activeItem) return;

    const panelRect = panel.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const isAbove = itemRect.top < panelRect.top;
    const isBelow = itemRect.bottom > panelRect.bottom;

    if (isAbove || isBelow || force) {
      const relativeTop = itemRect.top - panelRect.top + panel.scrollTop;
      const targetScrollTop = relativeTop - (panel.clientHeight / 2) + (activeItem.clientHeight / 2);
      if (typeof panel.scrollTo === 'function') {
        panel.scrollTo({
          top: Math.max(0, Math.round(targetScrollTop)),
          behavior: 'smooth'
        });
      } else {
        panel.scrollTop = Math.max(0, Math.round(targetScrollTop));
      }
    }
  }

}