import { LightningElement, track, api, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import pdfjsLib from "@salesforce/resourceUrl/pdfJS";
import pdfWorker from "@salesforce/resourceUrl/pdfWorker";
import { loadScript } from "lightning/platformResourceLoader";
import createOfferTemplate from "@salesforce/apex/TemplateController.createOfferTemplate";
import uploadFileToAWS from "@salesforce/apex/TeSignAWSUploadController.uploadFile";
import getUploadedFileUrl from "@salesforce/apex/TemplateController.getUploadedFileUrl";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import savePlaceholders from "@salesforce/apex/TemplateController.savePlaceholders";
import getPlaceholders from "@salesforce/apex/TemplateController.getPlaceholders";
import getOfferTemplateCustomFields from "@salesforce/apex/TemplateController.getOfferTemplateCustomFields";
import createOfferTemplateCustomField from "@salesforce/apex/TemplateController.createOfferTemplateCustomField";
import updateOfferTemplateCustomField from "@salesforce/apex/TemplateController.updateOfferTemplateCustomField";
import deactivateOfferTemplateCustomField from "@salesforce/apex/TemplateController.deactivateOfferTemplateCustomField";

import sendRecordEmail from "@salesforce/apex/TemplateController.sendRecordEmail";
import saveEmailsToBackend from "@salesforce/apex/TemplateController.saveEmailsToBackend";
import updateCurrentRecipient from "@salesforce/apex/TemplateController.updateCurrentRecipient";
import startEmailSequence from "@salesforce/apex/TemplateController.startEmailSequence";
import advanceEmailSequence from "@salesforce/apex/TemplateController.advanceEmailSequence";
import updateRecordWithAWSUrl from "@salesforce/apex/TemplateController.updateRecordWithAWSUrl";
import TeSignLogo from "@salesforce/resourceUrl/Te_sign";
import mammothJs from "@salesforce/resourceUrl/mammothJs";
import jsPDF from "@salesforce/resourceUrl/jspdf";
import html2canvasLib from "@salesforce/resourceUrl/html2canvas";
import getTSignURL from "@salesforce/apex/TemplateController.getTSignURL";
import { subscribe, createMessageContext } from "lightning/messageService";
import TSIGN_MESSAGE_CHANNEL from "@salesforce/messageChannel/TsignMessageChannel__c";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import deleteOfferTemplate from "@salesforce/apex/TemplateController.deleteOfferTemplate";
import getTemplates from "@salesforce/apex/tSignDocsController.getTemplates";
import isStartPlan from '@salesforce/apex/LimitCheckService.isStartPlan';
import getDocumentTypes from "@salesforce/apex/OfferTemplateDocumentTypeController.getDocumentTypes";
import createDocumentType from "@salesforce/apex/OfferTemplateDocumentTypeController.createDocumentType";
import getTemplateDocumentTypeId from "@salesforce/apex/OfferTemplateDocumentTypeController.getTemplateDocumentTypeId";
import getDocumentTypeById from "@salesforce/apex/OfferTemplateDocumentTypeController.getDocumentTypeById";
import updateDocumentType from "@salesforce/apex/OfferTemplateDocumentTypeController.updateDocumentType";
import deleteDocumentType from "@salesforce/apex/OfferTemplateDocumentTypeController.deleteDocumentType";
import getCurrentLoggedUserInfo from "@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo";
import getDashboardCounts from '@salesforce/apex/tSignDocsController.getDashboardCounts';
import getDashboardRecords from '@salesforce/apex/tSignDocsController.getDashboardRecords';
import fetchPDF from '@salesforce/apex/tSignDocsController.fetchPDF';
import getRecentActivities from '@salesforce/apex/tSignDocsController.getRecentActivities';
import TIME_ZONE from '@salesforce/i18n/timeZone';

const PLACEHOLDER_W_DEFAULT = 240;
const PLACEHOLDER_H_DEFAULT = 44;
const AUTO_SHIFT_STEP = 8;
const MAX_SHIFT_STEPS = 200;
const GUTTER_X = 1;
const GUTTER_Y = 1;

const AWS_BASE = 'https://tesseractapps.com';
const ENDPOINTS = {
  delete: `${AWS_BASE}/delete-file`
};

export default class TemplateCreator extends LightningElement {
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
  @track showPdfPreviewModal = false;
  @track previewImageSrc = "";
  previewPdfDoc = null;
  @track previewCurrentPage = 1;
  @track previewTotalPages = 1;
  @track isPreviewLoading = false;

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
    return getDocumentTypes({ orgId: this.orgid })
      .then((data) => {
        let options = data.map((dt) => ({
          label: dt.Document_Type_Name__c,
          value: dt.Id,
          isDefault: dt.Is_Default__c,
          orgId: dt.Organization__c,
          active: dt.Active__c
        }));
        
        // Handle inactive option retrieval
        if (this.selectedDocumentTypeId) {
          const exists = options.some(opt => opt.value === this.selectedDocumentTypeId);
          if (!exists) {
            return getDocumentTypeById({ docTypeId: this.selectedDocumentTypeId, orgId: this.orgid })
              .then((dt) => {
                if (dt) {
                  options.push({
                    label: dt.Document_Type_Name__c,
                    value: dt.Id,
                    isDefault: dt.Is_Default__c,
                    orgId: dt.Organization__c,
                    active: dt.Active__c
                  });
                }
                this.documentTypeOptions = options;
              })
              .catch((err) => {
                console.error("Error loading inactive document type:", err);
                this.documentTypeOptions = options;
              });
          }
        }
        
        this.documentTypeOptions = options;
      })
      .catch((error) => {
        console.error("Error loading document types:", error);
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

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.searchKeyword = ""; // Reset search keyword on open
    }
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
  }

  openDocumentTypeModal() {
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
  @api orgid;
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
  @track recipientEmails = [
    {
      key: 0,
      label: "1st Recipient",
      email: "",
      color: "#0176D3",
      colorStyle: "background-color:#0176D3; border-radius: 8px;",
      canRemove: false
    }
  ];
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
        label: `${r.label} (${r.email || "No Email"})`,
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
    return recipientToRemove ? (recipientToRemove.email ? `${recipientToRemove.label} (${recipientToRemove.email})` : recipientToRemove.label) : "";
  }

  get hasRecipients() {
    return this.recipientEmails && this.recipientEmails.length > 0;
  }

  get recipientCount() {
    return this.recipientEmails ? this.recipientEmails.length : 0;
  }

  get recipientListFormatted() {
    return (this.recipientEmails || []).map((r) => {
      const isActive = this.activeRecipientKey === r.key;
      return {
        ...r,
        isActive,
        activeRadioClass: isActive ? 'recipient-active-radio checked' : 'recipient-active-radio',
        activeRadioStyle: isActive 
          ? `border-color: ${r.color || '#0176D3'}; background-color: ${r.color || '#0176D3'};` 
          : `border-color: #cbd5e1;`,
        rowStyle: `border-left: 3px solid ${r.color || '#0176D3'};`
      };
    });
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



  async connectedCallback() {
    try {
      const userData = await getCurrentLoggedUserInfo();
      console.log("user data Enable_Logs__c ==>", JSON.stringify(userData));
      if (userData?.User_Type__c === 'Support Coordinator') {
        this.isSupportCoordinator = true;
      } else if (userData?.SC__c === true) {
        this.isSupportCoordinator = true;
      }
      const isStart = await isStartPlan();

      // 🔴 BLOCK ENTIRE MODULE
      if (isStart) {
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
    console.log("📌 AWS URL received in Tsign via Parent Component:", this.tsignReurl);
    console.log("📌 Received Org ID:", this.orgid);
    console.log("📌 Received Service Agreement ID:", this.serviceId);
    console.log("📌 Source received in Tsign via Parent Component:", this.source);
    console.log("📌 Quote ID received in Tsign via Parent Component:", this.quoteId);
    console.log("📌 Attachment ID received in Tsign via Parent Component:", this.attachmentId); // manendra added for supportcoordinatorAttachments
    console.log("📌 Form ID received in Tsign via Parent Component:", this.formId);
    console.log("📌 Participant Template ID received in TemplateCreator:", this.hrId);
    console.log("📧 Client Email received in TemplateCreator:", this.tsignEmail);

    this.prepopulateClientEmail();
    this.subscribeToMessageChannel();
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
  }

  fetchDocxAndConvert(url) {
    fetch(url)
      .then((response) => response.blob())
      .then(async (blob) => {
        this.file = new File([blob], this.fileName, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });

        // ✅ Ensure converter child is rendered
        this.isFileExpand1 = true;

        // ✅ Wait for DOM render
        await Promise.resolve();               // microtask
        await new Promise(r => requestAnimationFrame(r)); // render frame

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

  handlefilecancel(event) {
    console.log('child called');
    console.log('Cancel event received:', event.detail.message);
    this.fileuploaded = false;
  }



  //ACCEPTS PDF AND WORD
  @track fileuploaded = false;
  @track isFileExpand1 = false;
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

      let MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB for PDF
      let MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB for DOC/DOCX

      if (this.fileType === 'application/pdf') {
        if (this.fileSize > MAX_PDF_SIZE) {
          this.showToast("Error", "PDF file size must be 10MB or smaller.", "error");
          this.showSpinner = false;
          this.isLoading = false;
          event.target.value = null;
          return;
        }
      } else if (this.fileType === 'application/msword' || this.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        if (this.fileSize > MAX_DOC_SIZE) {
          this.showToast("Error", "Word document size must be 10MB or smaller.", "error");
          this.showSpinner = false;
          this.isLoading = false;
          event.target.value = null;
          return;
        }
      }


      // ✅ Check if the file is a PDF or Word document
      if (this.fileType === "application/pdf") {
        console.log("📌 Processing PDF file:", this.fileName);
        // this.processPdfFile(); // ✅ Process PDF
        this.handleFileUploadInputChange(event);
        this.fileuploaded = true;
      } else if (
        this.fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || this.fileType === "application/msword"
      ) {
        this.isLoading = true;
        this.fileuploaded = false;
        console.log("📌 Processing Word file:", this.fileName);
        this.isFileExpand1 = true;

        await Promise.resolve();
        this.convertWordToPdf(); // ✅ Convert Word to PDF
        // this.handleFileUploadInputChange(event);
      } else {
        this.showToast(
          "Error",
          "Only PDF and Word files are allowed.",
          "error"
        );
        this.showSpinner = false;
        this.isLoading = false;
        return;
      }
    }

    this.showSpinner = false;
    event.target.value = null;
    console.log("📌 File Uploaded:", this.fileName);
  }

  @track uploadedFiles = [];
  handleFileUploadInputChange(event) {
    console.log('handleFileUploadInputChange called ');

    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setTimeout(() => {
      this.isFileExpand = true;

      // Now child will definitely be rendered — wait for that
      setTimeout(() => {
        const svc = this.template.querySelector('c-document-office-service');
        if (!svc) {
          console.warn('⚠️ No <c-document-office-service> component found.');
          return;
        }

        svc.incomingFiles = files;
        //event.target.value = '';
      }, 1000);
    }, 0); // delay can be adjusted if needed

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


  async convertWordToPdf() {
    try {
      // ✅ mark flow + reset one-time handler guard (prevents duplicate record creation)
      this._activeFlow = "WORD_CONVERT";
      this._wordConversionHandled = false;

      this.showSpinner = true;

      const files = [this.file];
      const svc = this.template.querySelector("c-convert-word-to-pdf-lwc");

      if (!svc) {
        this.showToast("Error", "Conversion service not found.", "error");
        this.showSpinner = false;
        await new Promise((r) => setTimeout(r, 300));
        return;
      }

      // ✅ Prevent multiple uploadcomplete handlers being attached across uploads
      if (this._wordUploadCompleteHandler) {
        svc.removeEventListener("uploadcomplete", this._wordUploadCompleteHandler);
      }

      this._wordUploadCompleteHandler = (e) => {
        // ✅ Ignore duplicate conversion events (some services/components can dispatch twice)
        if (this._wordConversionHandled) {
          console.warn("⛔ Duplicate Word→PDF uploadcomplete ignored.");
          return;
        }
        this._wordConversionHandled = true;

        console.log("✅ Word→PDF conversion complete:", e.detail);

        const convertedFile = e.detail?.files?.[0];

        // filename: keep your behavior (docx -> pdf)
        const pdfFilename =
          convertedFile?.originalName?.replace(/\.[^/.]+$/, ".pdf") || this.fileName;

        // ✅ url: always take pdfUrl (string)
        const pdfUrl =
          (typeof convertedFile?.pdfUrl === "string" && convertedFile.pdfUrl) ||
          (typeof convertedFile?.url?.pdfUrl === "string" && convertedFile.url.pdfUrl) ||
          "";

        // ✅ key: prefer pdfKey (because convertedFile.key is often null)
        const pdfKey =
          convertedFile?.pdfKey ||
          convertedFile?.url?.pdfKey ||
          convertedFile?.key ||
          null;

        this.url = pdfUrl;
        this.fileName = pdfFilename;
        this.key = pdfKey;

        if (this.url) {
          // this.handleSaveAndUpload();
          this.handleSaveAndUploadForConvertedWord(pdfUrl, pdfFilename);
        } else {
          this.showToast("Error", "Converted PDF URL not found.", "error");
          // allow retry if conversion returned no URL
          this._wordConversionHandled = false;
        }

        this.showSpinner = false;
      };

      // ✅ Re-attach handler safely (once per conversion)
      svc.addEventListener("uploadcomplete", this._wordUploadCompleteHandler);

      svc.incomingFiles = files;
      svc.modulePathFromParent = "ticket";
      svc.confirmUpload = true;
    } catch (err) {
      console.error("❌ convertWordToPdf failed:", err);
      this.showToast("Error", "Word to PDF conversion failed.", "error");
      this.showSpinner = false;

      // allow retry
      this._wordConversionHandled = false;
      this._activeFlow = null;
    }
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

    // ✅ Create Offer_Template__c record with extracted PDF filename
    createOfferTemplate({
      fileName: pdfFilename,
      picklistValue: picklistValue,
      orgId: this.orgid,

      serviceId: resolvedServiceId,
      quoteId: resolvedQuoteId,
      formId: resolvedFormId,
      attachmentId: resolvedAttachmentId, // manendra added for supportcoordinatorAttachments


      // ✅ Optional: if your Apex expects url, include it (safe)
      url: pdfUrl,
      documentTypeId: this.selectedDocumentTypeId || null
    })
      .then((recordId) => {
        this.recordId = recordId;
        console.log("📌 Record created for converted Word file. ID:", recordId);

        // ✅ Update the record with the PDF URL (awsUrl)
        return updateRecordWithAWSUrl({
          recordId: this.recordId,
          awsUrl: pdfUrl,

          serviceId: resolvedServiceId,
          quoteId: resolvedQuoteId,
          formId: resolvedFormId
        });
      })
      .then(() => {
        console.log("✅ Record updated with converted PDF URL:", pdfUrl);
        this.isFileUploaded = true;

        // ✅ IMPORTANT: wait for URL and render PDF -> imageSrc
        return this.retrieveFileUrl();
      })
      .then((urlToRender) => {
        console.log("🧩 Converted DOCX flow urlToRender:", urlToRender);

        if (urlToRender) {
          this.awsUrl = urlToRender;
          console.log("📄 Calling loadPdf() for converted DOCX PDF...");
          return this.loadPdf(urlToRender);
        }

        console.warn("⚠️ retrieveFileUrl returned null, cannot render PDF.");
        return null;
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

  @track isFileUploaded = false;

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

    createOfferTemplate({
      fileName: this.fileName,
      picklistValue,
      orgId: this.orgid,
      serviceId: resolvedServiceId,
      quoteId: resolvedQuoteId,
      url: finalUrl,
      formId: resolvedFormId,
      hrId: resolvedHrId,
      attachmentId: resolvedAttachmentId, // manendra added for supportcoordinatorAttachments
    })
      .then((recordId) => {
        this.recordId = recordId;
        console.log("🟩 handleSaveAndUpload record created:", recordId);

        if (finalUrl) {
          console.log("🟦 handleSaveAndUpload updating AWS URL:", finalUrl);

          return updateRecordWithAWSUrl({
            recordId: this.recordId,
            awsUrl: finalUrl,
            serviceId: resolvedServiceId,
            quoteId: resolvedQuoteId,
            formId: resolvedFormId,
            hrId: resolvedHrId,
            attachmentId: this.attachmentId, // manendra added for supportcoordinatorAttachments
          }).then(() => {
            console.log("🟩 handleSaveAndUpload AWS URL updated");
            return finalUrl;
          });
        }

        console.log("🟦 handleSaveAndUpload no URL, calling retrieveFileUrl()");
        return this.retrieveFileUrl();
      })
      .then((urlToRender) => {
        console.log("🟦 handleSaveAndUpload urlToRender:", urlToRender);

        if (urlToRender) {
          this.awsUrl = urlToRender;
          return this.loadPdf(urlToRender);
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






  async loadPdf(url) {
    console.group("📄 [loadPdf]");
    console.log("➡️ called with url:", url);

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

      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;

      console.log("📌 totalPages:", this.totalPages, "| currentPage:", this.currentPage);
      console.log("📌 Rendering first page as image...");
      await this.renderPageAsImage(this.currentPage);

      console.log("✅ loadPdf completed. imageSrc length:", this.imageSrc ? this.imageSrc.length : 0);
      console.groupEnd();
    } catch (error) {
      console.error("❌ loadPdf error:", error);
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

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const viewport = page.getViewport({ scale: 3.0 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      console.log("📌 Canvas size:", { w: canvas.width, h: canvas.height });
      console.log("📌 Rendering page to canvas...");
      const renderTask = page.render({ canvasContext: context, viewport });

      if (renderTask?.onContinue) {
        console.log("ℹ️ renderTask has onContinue");
      }

      await renderTask.promise;
      console.log("✅ Page rendered to canvas.");

      console.log("📌 Converting canvas to dataURL...");
      const dataUrl = canvas.toDataURL("image/png");
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

      // Bind to template
      this.imageSrc = dataUrl;
      console.log("✅ imageSrc set. length:", this.imageSrc.length);

      console.groupEnd();
    } catch (error) {
      console.error(`❌ renderPageAsImage error (page ${pageNumber}):`, error);
      this.handleError(`Failed to render page ${pageNumber}.`, error);
      console.groupEnd();
      throw error; // propagate error
    }
  }

  retrieveFileUrl() {
    console.group("🔗 [retrieveFileUrl]");
    console.log("➡️ called with recordId:", this.recordId);

    this.showSpinner = true;
    this.isLoading = true;

    return getUploadedFileUrl({ recordId: this.recordId })
      .then((url) => {
        console.log("✅ Apex getUploadedFileUrl returned:", url);

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
      this.currentPage--;
      this.renderPageAsImage(this.currentPage);
    }
  }

  showNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.renderPageAsImage(this.currentPage);
    }
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

    const imgEl = this.template.querySelector(".image-container img");
    if (!imgEl) { console.error("Image container not found."); return; }

    const rect = imgEl.getBoundingClientRect();

    // drag data
    const dragData = JSON.parse(event.dataTransfer.getData("text/plain"));
    const { type, customKey, offsetX, offsetY } = dragData;

    // mouse → image space
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // raw position (top-left of placeholder)
    let x = mouseX - offsetX;
    let y = mouseY - offsetY;

    // actual placeholder size (initial guess)
    const { w, h } = this._getPlaceholderSizeByType(type);

    // clamp to page
    ({ x, y } = this._clampToRect(x, y, rect.width, rect.height, w, h));

    // auto-avoid overlaps on the same page (with initial guess)
    const free = this._findFreeSpot(x, y, w, h, rect.width, rect.height, this.currentPage, /*excludeId*/ null);
    x = free.x; y = free.y;

    // compute PDF point coords (keeps your existing behavior)
    const pagePt = this.getPageDimensions(this.currentPage);
    const xPt = (x / rect.width) * pagePt.w;
    const yPt = (y / rect.height) * pagePt.h;

    if (type) {
      const isCustom = !!customKey;
      let customField = null;
      if (isCustom) {
        customField = this.customFields.find(cf => cf.key === customKey);
        if (!customField) { console.error("Custom field not found."); return; }
      }

      const newPlaceholder = {
        id: Date.now(),
        type,
        x, y,
        xPt, yPt,
        wPt: null, hPt: null,
        page: this.currentPage,
        style: `top:${y}px; left:${x}px; position:absolute;`,
        value: "",
        isName: !isCustom && type === "Name",
        isLastName: !isCustom && type === "LastName",
        isEmail: !isCustom && type === "Email",
        isContactNumber: !isCustom && type === "ContactNumber",
        isAddress: !isCustom && type === "Address",
        isDate: !isCustom && type === "Date",
        isDateOfSigning: !isCustom && type === "DateOfSigning",
        isInitials: !isCustom && type === "Initials",
        isABN: !isCustom && type === "ABN",
        isFullName: !isCustom && type === "FullName",
        isSignature: !isCustom && type === "Signature",
        
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
      `,
        customInlineStyle: false
      };

      // ⬇️ your current behavior (unchanged)
      this.newPlaceholder = newPlaceholder;
      this._commitPlaceholderPosition(newPlaceholder);

      this.styleOptions = {
        fontFamily: 'Calibri, Arial, sans-serif',
        fontSize: '18',
        bold: false,
        italic: false,
        underline: false,
        color: '#000000'
      };
      this.useCustomInlineStyle = false;

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

        const rect2 =
          this._getCanvasRect
            ? this._getCanvasRect()
            : rect;

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

  _getCanvasRect() {
    const img = this.template.querySelector('.image-container img');
    return img ? img.getBoundingClientRect() : null;
  }

  _getPlaceholderSizeByType(type) {
    if (type === "Initials") {
      return { w: 75, h: PLACEHOLDER_H_DEFAULT };
    }
    return { w: PLACEHOLDER_W_DEFAULT, h: PLACEHOLDER_H_DEFAULT };
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

  _getSize(phOrType) {

    // Placeholder object
    if (
      phOrType &&
      typeof phOrType === "object"
    ) {

      const measuredWidth =
        phOrType.w;

      const measuredHeight =
        phOrType.h;

      const finalWidth =
        (measuredWidth ??
          (phOrType.type === 'Initials' ? 75 : PLACEHOLDER_W_DEFAULT)) +
        GUTTER_X;

      const finalHeight =
        (measuredHeight ??
          PLACEHOLDER_H_DEFAULT) +
        GUTTER_Y;

      console.log(
        "Placeholder Size Calculation",
        {
          id: phOrType.id,
          type: phOrType.type,

          measuredWidth,
          measuredHeight,

          defaultWidth:
            phOrType.type === 'Initials' ? 75 : PLACEHOLDER_W_DEFAULT,

          defaultHeight:
            PLACEHOLDER_H_DEFAULT,

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
    const fallbackWidth =
      (phOrType === 'Initials' ? 75 : PLACEHOLDER_W_DEFAULT) +
      GUTTER_X;

    const fallbackHeight =
      PLACEHOLDER_H_DEFAULT +
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

    ph.w = Math.round(rect.width);
    ph.h = Math.round(rect.height);

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
      console.log(`Initials selected: ${placeholder.value}`);
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
    const updated = this._assignAndCommitPlaceholder(this.newPlaceholder, this.selectedRecipient, recipientColor);

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

  get placeholdersForCurrentPage() {
    return this.placeholders
      .map((placeholder) => ({
        ...placeholder,
        formattedRecipient: this.getFormattedEmail(placeholder.recipient) // Ensure recipient is passed
      }))
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

    if (!ph || ph.isSignature) {
      return;
    }

    this._resizing = true;
    this._currentResizingPlaceholder = ph;
    this._resizeStartX = event.clientX;

    const el = this.template.querySelector(
      `.measurable-placeholder[data-id="${id}"]`
    );
    this._resizeStartWidth = el
      ? el.getBoundingClientRect().width
      : (ph.w || 150);

    this._boundResizeMove = this.handleResizeMove.bind(this);
    this._boundResizeEnd = this.handleResizeEnd.bind(this);

    window.addEventListener("mousemove", this._boundResizeMove);
    window.addEventListener("mouseup", this._boundResizeEnd);
  }

  handleResizeMove(event) {
    if (!this._resizing || !this._currentResizingPlaceholder) {
      return;
    }

    this.suppressNextClick = true;

    const ph = this._currentResizingPlaceholder;
    const deltaX = event.clientX - this._resizeStartX;
    const rect = this._getCanvasRect();
    if (!rect) {
      return;
    }

    let newWidth = this._resizeStartWidth + deltaX;
    const maxWidth = rect.width - ph.x;
    newWidth = Math.max(100, Math.min(newWidth, maxWidth));

    ph.w = Math.round(newWidth);

    ph.combinedStyle = `
        top:${ph.y}px;
        left:${ph.x}px;
        position:absolute;
        border:3px dashed ${ph.recipientColor || "#0070d2"};
        border-radius:8px;
        width:${ph.w}px;
    `;

    this.placeholders = [...this.placeholders];
  }

  handleResizeEnd(event) {
    if (!this._resizing) {
      return;
    }
    this.suppressNextClick = true;

    const ph = this._currentResizingPlaceholder;
    if (ph) {
      const rect = this._getCanvasRect();
      const pagePt = this.getPageDimensions(ph.page);
      if (rect && pagePt) {
        ph.wPt = (ph.w / rect.width) * pagePt.w;
        ph.hPt = (ph.h / rect.height) * pagePt.h;
      }

      ph.combinedStyle = `
          top:${ph.y}px;
          left:${ph.x}px;
          position:absolute;
          border:3px dashed ${ph.recipientColor || "#0070d2"};
          border-radius:8px;
          width:${ph.w}px;
      `;

      this._commitPlaceholderPosition(ph);
    }

    this._resizing = false;
    this._currentResizingPlaceholder = null;

    window.removeEventListener("mousemove", this._boundResizeMove);
    window.removeEventListener("mouseup", this._boundResizeEnd);
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

    if (el) {
      el.classList.add('placeholder-dragging');
    }

    const box = el?.getBoundingClientRect();

    this._dragW =
      box?.width ?? PLACEHOLDER_W_DEFAULT;

    this._dragH =
      box?.height ?? PLACEHOLDER_H_DEFAULT;

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

    const rect = this._getCanvasRect();

    if (!rect) {
      return;
    }

    let x =
      event.clientX -
      rect.left -
      this._dragW / 2;

    let y =
      event.clientY -
      rect.top -
      this._dragH / 2;

    const mySize = this._getSize(ph);

    ({ x, y } = this._clampToRect(
      x,
      y,
      rect.width,
      rect.height,
      mySize.w,
      mySize.h
    ));

    const free = this._findFreeSpot(
      x,
      y,
      mySize.w,
      mySize.h,
      rect.width,
      rect.height,
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
        border:3px dashed${ph.recipientColor || "#0070d2"};
        border-radius:8px;
        ${ph.w ? `width:${ph.w}px;` : ""}
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

        const rect =
          this._getCanvasRect();

        if (rect) {

          ph.xPt =
            (ph.x / rect.width) *
            pagePt.w;

          ph.yPt =
            (ph.y / rect.height) *
            pagePt.h;
        }
      }

      ph.combinedStyle = `
            top:${ph.y}px;
            left:${ph.x}px;
            position:absolute;
            border:3px dashed${ph.recipientColor || "#0070d2"};
            border-radius:8px;
            ${ph.w ? `width:${ph.w}px;` : ""}
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
          newJoineeEmail: this.recipientEmails[0].email
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
            const w = placeholder.w;
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
            return {
              ...placeholder,
              style: `top: ${placeholder.y}px; left: ${placeholder.x}px; position: absolute;${w ? ` width:${w}px;` : ""}`,
              combinedStyle: `
                  top:${placeholder.y}px;
                  left:${placeholder.x}px;
                  position:absolute;
                  border:3px dashed ${placeholder.recipientColor || "#0070d2"};
                  border-radius:8px;
                  ${w ? `width:${w}px;` : ""}
              `
            };
          });
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
    const draggedKey = event.currentTarget.dataset.index;

    this.activeRecipientDragKey = draggedKey;

    const row = event.currentTarget.closest(
      '.recipient-input-row'
    );

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

    // Recalculate labels/colors
    this.refreshRecipientLabels();

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

    this.recipientEmails = [
      ...this.recipientEmails,
      {
        key: this.nextRecipientKey,
        label: "",
        email: "",
        color: "",
        colorStyle: "",
        canRemove: true
      }
    ];

    this.nextRecipientKey += 1;

    this.refreshRecipientLabels();

    console.log(
      "Updated recipientEmails:",
      JSON.stringify(this.recipientEmails)
    );
  }

  removeRecipient(event) {
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
      `;
      return {
        ...ph,
        recipientColor,
        combinedStyle
      };
    });
  }

  handleEmailChange(event) {
    const key = parseInt(event.target.dataset.index, 10);
    const newEmail = event.target.value;

    console.log(
      `Email input changed for key: ${key}, new email: ${newEmail}`
    );

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
      return;
    }

    this.recipientEmails = this.recipientEmails.map(recipient => {
      if (recipient.key === key) {
        return {
          ...recipient,
          email: newEmail
        };
      }
      return recipient;
    });

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

  handleFinish() {
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

        console.log("Updating recipient with:");
        console.log("recordId =", this.recordId);
        console.log("currentRecipient =", this.currentRecipient);

        return this.updateCurrentRecipient(this.currentRecipient);
      })
      .then(() => {
        console.log("Recipient updated successfully.");

        this.isLoadingCircle = false;
        this.showSuccessScreen = true;
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
    if (!key) {
      console.error('[DELETE] key is required');
      return;
    }

    try {
      const resp = await fetch(ENDPOINTS.delete, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      const text = await resp.text();
      let json;
      try { json = JSON.parse(text); } catch { json = null; }

      if (!resp.ok) throw new Error(json?.error || `Delete failed ${resp.status}: ${text}`);

      console.log('[DELETE] success', json);




      // this.isDisabled=false;
      this.key = '';
      // this.isEdit=false;


    } catch (e) {
      console.error('[DELETE] error', e);
    }
  }
  resetComponentState() {
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
    this.imageSrcs = [];
    this.imageSrc = [];

    this.recipientEmails = [
      {
        key: 0,
        label: "New Joinee Email*",
        email: "",
        canRemove: false
      }
    ];
    this.nextRecipientKey = 1;

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

    if (this.templateClickOutsideHandler) {
      window.removeEventListener("click", this.templateClickOutsideHandler);
    }

    // ✅ Fully reset component state (emails, LMS context, URLs, flags)
    this.resetComponentState();

    // ✅ Optional: clean up LMS subscription if you subscribed
    if (this.subscription) {
      unsubscribe(this.subscription);
      this.subscription = null;
      console.log("🔕 LMS subscription cleaned up.");
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

    createOfferTemplate({
      fileName: this.fileName,
      picklistValue,
      orgId: this.orgid,
      serviceId: resolvedServiceId,
      quoteId: resolvedQuoteId,
      formId: resolvedFormId,
      attachmentId: resolvedAttachmentId, // manendra added for supportcoordinatorAttachments
      url: this.tsignReurl || "",
      documentTypeId: this.selectedDocumentTypeId || null
    })
      .then((recordId) => {
        this.recordId = recordId;
        console.log("🟩 handleSaveAndUploadTemplate record created:", recordId);

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
              this.showToast("Success", "Document Uploaded successfully.", "success");
              // ✅ IMPORTANT: wait for URL and render PDF pages
              return this.retrieveFileUrl();
            })
            .then((urlToRender) => {
              if (urlToRender) {
                this.awsUrl = urlToRender;
                return this.loadPdf(urlToRender);
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
              return this.loadPdf(urlToRender);
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
        console.warn("📧 [TemplateCreator] recipientEmails not initialized yet.");
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

          const recipientListTooltip =
            recipientListDisplay
              .replace(
                /\n/g,
                ', '
              );


          // =========================================
          // CURRENT RECIPIENT + STATUS
          // =========================================

          let currentRecipientStatusDisplay =
            '—';


          if (
            record.currentRecipient
          ) {

            currentRecipientStatusDisplay =
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

          const status =
            record.status
              ? record.status.toLowerCase()
              : '';


          return (
            fileName.includes(searchTerm) ||
            recipient.includes(searchTerm) ||
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

  handleViewDocument(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      this.isLoading = true;
      fetchPDF({ pdfUrl: url })
        .then((base64Data) => {
          this.isLoading = false;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          
          if (!window.pdfjsLib || !window.pdfjsLib.getDocument) {
            throw new Error("pdfjsLib is not available on window.");
          }
          
          return window.pdfjsLib.getDocument({ data: byteArray }).promise;
        })
        .then((pdfDoc) => {
          this.previewPdfDoc = pdfDoc;
          this.previewTotalPages = pdfDoc.numPages;
          this.previewCurrentPage = 1;
          this.showPdfPreviewModal = true;
          this.renderPreviewPage(1);
        })
        .catch((error) => {
          this.isLoading = false;
          console.error("Error viewing PDF:", error);
          this.showToast("Error", "Failed to load the document preview.", "error");
        });
    }
  }

  async renderPreviewPage(pageNumber) {
    if (!this.previewPdfDoc) return;
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
    this.previewPdfDoc = null;
    this.previewImageSrc = "";
    this.previewCurrentPage = 1;
    this.previewTotalPages = 1;
    this.showPdfPreviewModal = false;
  }

  handleDownloadDocument(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      this.isLoading = true;
      fetchPDF({ pdfUrl: url })
        .then((base64Data) => {
          this.isLoading = false;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const blobUrl = window.URL.createObjectURL(blob);
          
          let filename = 'document.pdf';
          try {
            const parts = url.split('/');
            filename = parts[parts.length - 1].split('?')[0] || 'document.pdf';
          } catch(e) {}
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch((error) => {
          this.isLoading = false;
          console.error("Error downloading PDF:", error);
          this.showToast("Error", "Failed to download the document.", "error");
        });
    }
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

  renderedCallback() {
    if (this.pendingHighlightRecordId && !this.isDashboardRecordsLoading) {
      this.applyPendingHighlight();
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

}