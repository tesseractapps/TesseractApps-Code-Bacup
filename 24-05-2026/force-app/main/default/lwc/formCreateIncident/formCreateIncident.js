import { LightningElement, api, track } from "lwc";
import { loadScript, loadStyle }from "lightning/platformResourceLoader";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import sendEmailWithCustomBody from "@salesforce/apex/EmailController.sendEmailWithCustomBody";
import saveLayout from "@salesforce/apex/LayoutIncidentController.saveLayout";
import getLayoutData from "@salesforce/apex/LayoutIncidentController.getLayoutData";
import { CurrentPageReference } from "lightning/navigation";
import { NavigationMixin } from "lightning/navigation";
import { wire } from "lwc";
import {publish, subscribe, MessageContext } from "lightning/messageService";
import LAYOUT_MESSAGE_CHANNEL from "@salesforce/messageChannel/LayoutMessageChannel__c";
import getCurrentUserName from "@salesforce/apex/UserController.getCurrentUserName";
import My_Resource from "@salesforce/resourceUrl/myResource";
import saveForm from "@salesforce/apex/IncidentRegisterControllerV2.saveForm";
import NEW_FORM_REDIRECT_CHANNEL from "@salesforce/messageChannel/NewFormRedirectChannel__c";
import getAllLayouts from "@salesforce/apex/LayoutIncidentController.getAllLayouts";
import getDefaultFormLayout from "@salesforce/apex/LayoutIncidentController.getDefaultFormLayout";
import StaticForms from "@salesforce/resourceUrl/Static_Forms";

const FORM_IMAGE_1 = `${StaticForms}/form1.png`;
const FORM_IMAGE_2 = `${StaticForms}/form2.png`;
import pdfjsLib from '@salesforce/resourceUrl/pdfJS'; 
import pdfWorker from '@salesforce/resourceUrl/pdfWorker';
import pdfjsLibMin from '@salesforce/resourceUrl/PDFLib';
import TESSA from '@salesforce/resourceUrl/Tessa';
import BOT_ACTIONS_CONFIG from '@salesforce/resourceUrl/bot_actions_config';
import BOT_ACTION_CHANNEL from "@salesforce/messageChannel/BotActionMessageChannel__c";

let idCounter = 0;
const norm = (x) => (x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const pushUnique = (arr, v) => {
  const n = norm(v);
  if (n && !arr.some((q) => norm(q) === n)) arr.push(v.trim());
};

const formImages = [FORM_IMAGE_1, FORM_IMAGE_2];

import getStaffRecords from '@salesforce/apex/IncidentRegisterControllerV2.getStaffRecords';
import appendFormsToStaff from '@salesforce/apex/IncidentRegisterControllerV2.appendFormsToStaff';
import getPresignedUrl from "@salesforce/apex/WordEditorController.getPresignedUrl";
import Loading_Logo from "@salesforce/resourceUrl/Loading_Logo";
import doesLayoutTitleExist
from "@salesforce/apex/LayoutIncidentController.doesLayoutTitleExist";

import doesPublishedFormExist
from "@salesforce/apex/IncidentRegisterControllerV2.doesPublishedFormExist";

import QUILL from '@salesforce/resourceUrl/Quill';

import saveFormWithVersion from "@salesforce/apex/LayoutIncidentController.saveFormWithVersion";





export default class DragDropComponent extends NavigationMixin(
  LightningElement
) {
  formicon = My_Resource + "/myResource/images/CustomisableFormsIcon.png";
  layoutId;
  subscription = null;
  @api orgid = "";
  @api layoutId;
  @wire(MessageContext) messageContext;
  pageRef(pageRef) {
    if (pageRef && pageRef.state.c__layoutId) {
      this.loadLayoutById(pageRef.state.c__layoutId);
    }
  }
  

      tLogoUrl = `${Loading_Logo}/TLogo.png`;
      tImageUrl = `${Loading_Logo}/T.png`;
    
      get logoUrl() {
        return this.tLogoUrl;
      }
    
      get imageUrl() {
        return this.tImageUrl;
      }

      @track quillLoaded = false;
      @track quillInstances = {};


  @track dataTypes = [
  { id: '1', label: 'Header',         icon: 'title' },
  { id: '2', label: 'Text Field',     icon: 'short_text' },
  { id: '3', label: 'Number Field',   icon: 'calculate' },
  { id: '4', label: 'Date Field',     icon: 'calendar_today' },
  { id: '5', label: 'Time Field',     icon: 'schedule' },
  { id: '6', label: 'Checkbox Field', icon: 'check_box' },
  { id: '7', label: 'Dropdown Field', icon: 'arrow_drop_down_circle' },
  { id: '8', label: 'Blank',          icon: 'insert_page_break' },
  { id: '9', label: 'Upload File',    icon: 'upload_file' },
  { id: '10', label: 'Radio Button',   icon: 'radio_button_checked' },
  { id: '11', label: 'Table Block',   icon: 'table_chart' },
  { id: '12', label: 'Signature', icon: 'draw' },
  { id: '13', label: 'Rich Text', icon: 'notes' }
];


getTypeFlags(type) {
  return {
    isText:     type === 'Text Field',
    isNumber:   type === 'Number Field',
    isDate:     type === 'Date Field',
    isTime:     type === 'Time Field',
    isDropdown: type === 'Dropdown Field',
    isCheckbox: type === 'Checkbox Field',
    isRadio:    type === 'Radio Button',
    isUpload:   type === 'Upload File',
    isHeader:   type === 'Header',
    isTableBlock: type === 'Table Block',
    isSignature: type === 'Signature',
    isRichTextDisplay: type === 'Rich Text',
    previewOptions: [] // default (used by dropdown/radio)
  };
}


  @track formTypeOptions = [
    { label: "Behavioral", value: "Behavioral" },
    { label: "Medication", value: "Medication" },
    { label: "PRN Medication", value: "PRN Medication" },
    { label: "Fluid Intake", value: "Fluid Intake" },
    { label: "Sleep and Selfcare", value: "Sleep and Selfcare" },
    { label: "Weekly Blood Glucose", value: "Weekly Blood Glucose" },
    { label: "Bowel Movement", value: "Bowel Movement" },
    { label: "General Weekly", value: "General Weekly" },
    { label: "Activity Chart", value: "Activity Chart" },
    { label: "Shift Report", value: "Shift Report" },
    { label: "Incident Register", value: "Incident Register" },
    { label: "Other", value: "Other" },
    { label: "Custom New Form", value: "Custom New Form" }
  ];

  get defaultFormType() {
    return this.selectedModuleType === "Incident Register"
      ? "Incident Register"
      : "Custom New Form";
  }

  get filteredFormTypeOptions() {
    let baseOptions;

    if (this.selectedModuleType === "Customisable Form") {
      baseOptions = this.formTypeOptions.filter(
        (opt) => opt.value !== "Incident Register"
      );
    } else if (this.selectedModuleType === "Incident Register") {
      baseOptions = this.formTypeOptions.filter(
        (opt) => opt.value === "Incident Register"
      );
    } else {
      baseOptions = this.formTypeOptions;
    }

    // Add `selected` property
    return baseOptions.map((opt) => {
      return {
        ...opt,
        selected: opt.value === this.defaultFormType
      };
    });
  }

  @track showFormTypeModal = false;
  @track customFormTypeInput = "";
  @track tableRows = [];
  @track formTitle = "";
  @track selectedCells = [];
  @track isPreviewMode = false;
  @track showPopup = false;
  @track fieldLabel = "";
  @track isMandatory = false;
  @track comments = "";
  @track showHeaderPopup = false;
  @track layoutFields = [];
  @track selectedHeaderFields = [];
  @track selectedFormType = "";
  @track isFormTypeSelected = false;
  @track isPreviewEnabled = false;
  @track isViewingLayouts = false;
  @track layoutFields = [];
  @api layoutData;
  @track layoutData;
  @track senderName = "";
  @track isUnsaved = false;
  @track showConfirmationPopup = false;
  @track isViewingLayouts = false;
  @track lastSavedState = null;
  @track hasChanges = false;
  @track isResetState = true;
  @track isUploadFileField = false;
  @track isLoading = false;

  // @track selectedModuleType = '';
  // @api selectedModuleType = 'Customisable Form';

  @api selectedModuleType = "Customisable Form";

  @track showFormTypeDropdown = true;
  @track defaultLayouts = [];

  html2canvasLoaded = false;
  jsPDFLoaded = false;

  currentCell = null;
  tableHistory = [];

  @track selectedTextFieldOption = "";
  @track isAlphaNumericEnabled = false;
  @track isOnlyAlphabetsEnabled = false;
  @track isTextAreaEnabled = false;

  @track isAlphaNumericDisabled = true;
  @track isOnlyAlphabetsDisabled = true;
  @track isTextAreaDisabled = true;
  @track alphaNumericLength = "";
  @track onlyAlphabetsLength = "";
  @track selectedOption = "";

  @track selectedNumberFieldOption = ""; // Track the selected option for Number Field
  @track decimalValue = ""; // Value for Currency option's decimal input
  @track contactNumberDigits = "";

  @track isCaptureDisabled = true; // Initially disabled
  @track isSendDisabled = true; // Initially disabled

  @track newDesign = false;


  @track isHardResetModalOpen = false;
  @track isHardResetConfirmed = false;
  @track isRichTextDisplay = false;

  // Define options for specific fields
  @track textFieldOptions = [
    { label: "Alpha Numeric", value: "alphaNumeric" },
    { label: "Only Alphabets", value: "onlyAlphabets" },
    { label: "Text Area (Max 255 Characters)", value: "textArea" },
    { label: "Rich Text", value: "richText" }
  ];

  @track numberFieldOptions = [
    { label: "Currency", value: "currency" },
    { label: "Contact Number", value: "contactNumber" },
    { label: "Default Number", value: "defaultNumber" }
  ];

  @track decimalOptions = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" }
  ];

  @track selectedDateFieldOption = ""; // Track the selected option for Date Field
  @track selectedDateFormat = ""; // Selected format for Date View

  // Date format options
  dateFormatOptions = [
    { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
    { label: "YYYY/MM/DD", value: "YYYY/MM/DD" }
  ];

  @track dropDownOptions = [
    { label: "Multi-select Picklist", value: "multiSelect" },
    { label: "Single-select Picklist", value: "singleSelect" }
  ];
  @track predefinedListType = "";
  @track predefinedOptions = [
    { label: "Participant", value: "Participant" },
    { label: "Facility", value: "Facility" },
    { label: "Staff", value: "Staff" }
  ];

  // Track field type conditions
  @track isTextField = false;
  @track isNumberField = false;
  @track isDateField = false;
  @track isDropDownField = false;
  @track isRadioButtonField = false;
  @track radioOptions = ""; // For input values (newline-separated)

  // Track specific field values
  @track isAlphaNumeric = false;
  @track isOnlyAlphabets = false;
  @track isTextArea = false;
  @track isCurrency = false;
  @track isContactNumber = false;
  @track dropDownValues = "";

  @track isTimeField = false;
  @track is12HourFormat = false; // To track whether 12-hour format is selected
  @track timeDisplayFormat = ""; // To hold selected display format
  @track timeFormat = ""; // Tracks either '12' or '24'
    @track isTableBlock = false;
  @track isSignatureField = false;

  @track isAltSelectionMode = false;
  @track copiedFields = [];

  @track isEditModeActive = false;

  get isDragEnabled() {
    return (
      this.formTitle.trim().length > 0 &&
      this.selectedModuleType.trim().length > 0 &&
      this.selectedFormType.trim().length > 0
    );
  }

  timeFormatOptions = [
    { label: "12 Hour", value: "12" },
    { label: "24 Hour", value: "24" }
  ];

  // Define options for time display format
  timeDisplayFormatOptions = [
    { label: "H:MM", value: "H:MM" },
    { label: "HH:MM", value: "HH:MM" },
    { label: "HH:MM:SS", value: "HH:MM:SS" }
  ];

  @wire(getCurrentUserName)
  wiredUserName({ error, data }) {
    if (data) {
      this.senderName = data; // Store the user name
    } else if (error) {
      console.error("Error fetching user name:", error);
    }
  }
  get captureButtonClass() {
    return this.isPreviewEnabled
      ? "lightning-button active"
      : "lightning-button inactive";
  }

  get sendButtonClass() {
    // Ensures the button is active when both conditions are met
    return this.selectedFormType && this.isPreviewEnabled
      ? "lightning-button active"
      : "lightning-button inactive";
  }

  get isSendDisabled() {
    const titleValid = this.formTitle && this.formTitle.trim().length > 0;
    const formTypeValid =
      this.selectedFormType && this.selectedFormType.trim().length > 0;
    return !(titleValid && formTypeValid && this.isPreviewEnabled);
  }

  get isCaptureDisabled() {
    return !this.isPreviewEnabled;
  }

  get isAlphaNumericEnabled() {
    return this.selectedOption === "alphaNumeric";
  }

  get isOnlyAlphabetsEnabled() {
    return this.selectedOption === "onlyAlphabets";
  }

  get isTextAreaEnabled() {
    return this.selectedOption === "textArea";
  }

  // Getters for conditional rendering
  get isAlphaNumericSelected() {
    return this.selectedOption === "alphaNumeric";
  }

  get isOnlyAlphabetsSelected() {
    return this.selectedOption === "onlyAlphabets";
  }

  get isTextAreaSelected() {
    return this.selectedOption === "textArea";
  }

  // Getters for the disabled state (negation of the selected state)
  get isAlphaNumericDisabled() {
    return this.selectedOption !== "alphaNumeric";
  }

  get isOnlyAlphabetsDisabled() {
    return this.selectedOption !== "onlyAlphabets";
  }

  get isTextAreaDisabled() {
    return this.selectedOption !== "textArea";
  }
  get isRichTextSelected() {
    return this.selectedOption === "richText";
  }

  // Getters for visibility and enablement based on selected option
  get isCurrencySelected() {
    return this.selectedNumberFieldOption === "currency";
  }

  get isContactNumberSelected() {
    return this.selectedNumberFieldOption === "contactNumber";
  }

  get isDefaultNumberSelected() {
    return this.selectedNumberFieldOption === "defaultNumber";
  }

  // Getters for negated (disabled) conditions
  get isCurrencyDisabled() {
    return !this.isCurrencySelected;
  }

  get isContactNumberDisabled() {
    return !this.isContactNumberSelected;
  }

  get isDateViewSelected() {
    return this.selectedDateFieldOption === "dateView";
  }

  get is12HourSelected() {
    return this.timeFormat === "12";
  }

  get is24HourSelected() {
    return this.timeFormat === "24";
  }
  get isPredefinedListSelected() {
    return this.selectedDropdownOption === "predefinedList";
  }
  handleModuleTypeChange(event) {
    this.selectedModuleType = event.target.value;

    // Show dropdown for customizable forms only
    this.showFormTypeDropdown = this.selectedModuleType === "Customisable Form";

    if (this.selectedModuleType === "Incident Register") {
      this.selectedFormType = "Incident Register";
    } else {
      this.selectedFormType = "";
    }
  }

  get isDefaultModuleSelected() {
    return this.selectedModuleType === "";
  }

  get isCustomizableSelected() {
    return this.selectedModuleType === "Customisable Form";
  }

  get isIncidentSelected() {
    return this.selectedModuleType === "Incident Register";
  }

  navigateToLayoutList() {
    this.isViewingLayouts = true;
  }

  handleBackToForm() {
    this.isViewingLayouts = false;

    // Ensure that the UI elements reflect the current preview state
    if (this.isPreviewEnabled) {
      this.isCaptureDisabled = false;
      this.isSendDisabled = !this.selectedFormType;
    } else {
      this.isCaptureDisabled = true;
      this.isSendDisabled = true;
    }

    // Optionally ensure the toggle remains visually checked
    requestAnimationFrame(() => {
      const previewToggle = this.template.querySelector(".preview-toggle");
      if (previewToggle) {
        previewToggle.checked = this.isPreviewEnabled;
      }
    });
  }

  handleTitleChange(event) {
    this.formTitle = event.target.value;
    console.log("Form Title:", this.formTitle); // Debug log
  }

connectedCallback() {
    console.group("🚀 connectedCallback ENTRY");

    console.log(
      "💡 Received layoutData in form-create:",
      JSON.stringify(this.layoutData)
    );
    console.log("📌 Received Org ID in form create:", this.orgid);

    console.log("🧬 Version BEFORE LOAD:", {
      recordId: this.dynamicFormRecordId,
      groupId: this.dynamicFormGroupId,
      version: this.dynamicFormVersionLabel
    });

    console.groupEnd();

    this.loadDefaultLayouts();
    this.fetchSenderName();
    this.subscribeToMessageChannel();
    this.subscribeToRedirectChannel();

    (async () => {
      await this.loadBotConfig();
      this.subscription = subscribe(
        this.messageContext,
        BOT_ACTION_CHANNEL,
        (message) => this.handleBotActionMessage(message)
      );
    })();

    Promise.all([
      loadScript(this, pdfjsLib),
      loadScript(this, pdfjsLibMin)
    ])
    .then(() => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
      this.pdfJsReady = !!window.pdfjsLib;
      this.pdfLibReady = !!window.PDFLib;
    })
    .catch((e) => {
      this.pdfJsReady = false;
      this.pdfLibReady = false;
      console.error('pdf.js / pdf-lib load failed', e);
    });

    // 🧱 Always create a default table first
    console.log("🧱 Creating default table first");
    this.createTable(5, 1); // Default fallback

    if (this.layoutData && this.layoutData.layoutJSON) {
      setTimeout(() => {

        // 🔥 PREVENT DOUBLE LOAD (CRITICAL FIX)
        if (this.hasLoadedFromMessage) {
          console.warn("⛔ Skipping connectedCallback load — LMS already handled");
          return;
        }

        console.group("⏳ connectedCallback LOAD");

        console.log("🧬 Version FROM layoutData:", {
          groupId: this.layoutData.formGroupId,
          version: this.layoutData.versionLabel
        });

        console.log("🧬 layoutData full:", this.layoutData);

        console.groupEnd();

        this.loadClonedLayout({
    layoutJSON: this.layoutData.layoutJSON,
    layoutName: this.layoutData.layoutName,
    title: this.layoutData.title || this.layoutData.formType,
    formType: this.layoutData.formType,
    formModule: this.layoutData.formModule,
    audience: this.layoutData.audience,

    // ✅ USE CORRECT KEYS FROM LOG
    dynamicFormRecordId: this.layoutData.dynamicFormRecordId,
    dynamicFormGroupId: this.layoutData.dynamicFormGroupId,
    dynamicFormVersionLabel: this.layoutData.dynamicFormVersionLabel,

    isVersionEditFlowActive: true
  });

        this.newDesign = true;
        this.isCloneMode = false;

      }, 200);

    } else if (this.layoutId) {
      console.log("📦 Loading layout by ID:", this.layoutId);
      this.loadLayoutById(this.layoutId);
    }

    requestAnimationFrame(() => {
      const dropdown = this.template.querySelector(".form-dropdown");
      if (dropdown) {
        dropdown.value = this.selectedFormType;

        if (!this.selectedFormType && this.formTypeOptions?.length > 0) {
          this.selectedFormType = this.formTypeOptions[0].value;
          dropdown.value = this.selectedFormType;
        }
      } else {
        console.warn("⚠️ Dropdown element not found.");
      }
    });

    this.isCaptureDisabled = !this.isPreviewEnabled;
    this.isSendDisabled = !(this.isPreviewEnabled && this.selectedFormType);

    setTimeout(() => {
      this.selectedFormType = this.defaultFormType;
      console.log("Default form type set to:", this.selectedFormType);
    }, 500);

    document.addEventListener(
      'keydown',
      this.handleAltCopyKeyDown.bind(this)
    );

    document.addEventListener(
      'keyup',
      this.handleAltCopyKeyUp.bind(this)
    );

    document.addEventListener(
      "click",
      this.closeMenuOnOutsideClick,
      true
    );

    document.addEventListener(
      "scroll",
      this.closeMenuOnScroll,
      true
    );
}

  fetchSenderName() {
    getCurrentUserName()
      .then((result) => {
        this.senderName = result; // Store the user's name
      })
      .catch((error) => {
        console.error("Error fetching user name:", error);
      });
  }

  loadDefaultLayouts() {
    getAllLayouts({ orgId: this.orgid })
      .then((layoutMap) => {
        this.defaultLayouts = layoutMap.DefaultLayouts.map((layout) => ({
          ...layout,
          layoutName: layout.layoutName,
          displayName: layout.displayName,
          image: this.getRandomFormImage()
        }));
      })
      .catch((error) => {
        console.error("❌ Failed to load default layouts:", error);
      });
  }
  getRandomFormImage() {
    const index = Math.floor(Math.random() * formImages.length);
    return formImages[index];
  }

  loadLayoutFromJSON(layoutJSON) {
    try {
      const parsedJSON = JSON.parse(layoutJSON);
      this.tableRows = parsedJSON.tableRows || [];
      this.selectedFormType = parsedJSON.selectedFormType || "";
      this.formTitle = parsedJSON.formTitle || "";
      this.togglePreview({ target: { checked: this.isPreviewEnabled } });

      console.log("Loaded layout data into tableRows:", this.tableRows);
    } catch (error) {
      console.error("Error parsing layout JSON:", error);
    }
  }

handleOnlyPublish() {

    this.openGrantAfterPublish = false;

    this.handlePublish();
}

handlePublishAndGrant() {

    this.openGrantAfterPublish = true;

    this.handlePublish();
}

@track openGrantAfterPublish = false;
@track isGrantAccessPopupOpen = false;


// async handlePublish() {
//       this.isLoading = true;
//     console.log("⏳ [Publish] Started — spinner ON");


//     if (!this.formTitle || !this.selectedFormType) {
//       this.showToast(
//         "Error",
//         "Form Title and Form Type are required.",
//         "error"
//       );
//       return;
//     }

//     const filteredTableRows = [];
//     const occupiedCells = new Set();

//     this.tableRows.forEach((row) => {

//       const hasMergedCell = row.cells.some(
//         (cell) => cell.col === 0 && cell.colspan === 2
//       );

//       const filteredCells = row.cells
//         .filter((cell) => {
//           if (hasMergedCell) {
//             return cell.col === 0;
//           }
//           return cell.col < 2;
//         })
//         .map((cell) => {

//           const key = `${cell.row}-${cell.col}`;

//           if (occupiedCells.has(key)) {
//             return null;
//           }

//           if (cell.rowspan > 1) {
//             for (let i = 1; i < cell.rowspan; i++) {
//               occupiedCells.add(`${cell.row + i}-${cell.col}`);
//             }
//           }

//           return {
//             ...cell,
//             field: this.sanitizeFieldForPersist(cell.field),
//             colspan: hasMergedCell ? 2 : cell.colspan
//           };
//         })
//         .filter((cell) => cell !== null);

//       filteredTableRows.push({
//         ...row,
//         cells: filteredCells
//       });
//     });

//     console.log("🔍 Filtered Rows Before Prepend:", filteredTableRows);

//     const finalRowsToSave =
//       this.selectedFormType === "Incident Register"
//         ? this.prependDefaultRowsIfIncident(filteredTableRows)
//         : filteredTableRows;

//     console.log("📋 Final Rows To Save:", finalRowsToSave);

//         // ===============================
//       // 🔥 AWS upload
//       // ===============================
//       const awsMeta = await this.uploadFormJsonToAws(
//         finalRowsToSave,
//         "PublishedIR"
//       );

//       console.log("📦 [FormJSON] awsMeta BEFORE saveForm:", awsMeta);

//     const formJson = JSON.stringify(finalRowsToSave);

//     console.log("Publishing Form with Details:", {
//       formName: this.formTitle,
//       formJson: formJson,
//       formType: this.selectedFormType,
//       orgId: this.orgid
//     });

//     saveForm({
//       formName: this.formTitle,
//       formJson: JSON.stringify(awsMeta),
//       formType: this.selectedFormType,
//       orgId: this.orgid
//     })
//   .then((result) => {

//     console.log("Form Published Successfully!", result);
//     this.isLoading = false;

//     this.showToast(
//       "Success",
//       "Form Published Successfully!",
//       "success"
//     );

//     // 🔥 open Grant modal if requested
//     if (this.openGrantAfterPublish) {

//       console.log("👉 Opening Grant Access modal after publish");

//       // try to read Id if returned
//       this.lastPublishedFormId = result?.formId || result || null;

//       this.formsToGrant = this.lastPublishedFormId
//         ? [this.lastPublishedFormId]
//         : [];

//       this.selectedPublishedFormIds = new Set(this.formsToGrant);

//       this.isGrantAccessPopupOpen = true;

//       this.loadStaffList();

//       this.openGrantAfterPublish = false;
//     }

//     this.publishTempalte = false;
//     this.isFormSaved = true;

//     console.log(
//       "isGrantAccessPopupOpen:",
//       this.isGrantAccessPopupOpen
//     );
//   })

//       .catch((error) => {

//         console.error("Error saving form:", error);
//         this.isLoading = false;

//         this.showToast(
//           "Error",
//           "Failed to publish form.",
//           "error"
//         );
//       });
// }


sanitizeFieldForPersist(field) {
    if (!field) return field;

    // ===============================
    // 🔵 TABLE BLOCK CLEANUP
    // ===============================
  if (field.isTableBlock && field.tableConfig) {

    const cfg = field.tableConfig;

    return {
      ...field,
      isEditMode: false,
      tableConfig: {
        rows: cfg.rows,
        cols: cfg.cols,
        hasHeader: cfg.hasHeader,
        hasRowLabels: cfg.hasRowLabels,
        showTableName: cfg.showTableName,
        tableName: cfg.tableName,

        columns: (cfg.columns || []).map(c => ({
          key: c.key,
          isRowLabel: c.isRowLabel,
          header: c.header,
          width: c.width
        })),

        rowNames: cfg.rowNames || [],

        cellValues: cfg.cellValues || {},

        /* 🔥 IMPORTANT */
        innerCells: (cfg.innerCells || []).map(row => ({
          index: row.index,
          cells: row.cells.map(cell => ({
            id: cell.id,
            row: cell.row,
              col: cell.col,
            field: this.sanitizeFieldForPersist(cell.field)
          }))
        }))
      }
    };

  }

    // ===============================
    // 🔵 SIGNATURE (future safe)
    // ===============================
    if (field.isSignature) {
      return {
        id: field.id,
        label: field.label,
        dataType: field.dataType,
        isSignature: true,
        isRequired: field.isRequired || false,
        comments: field.comments || ""
      };
    }

    return field;
}

  prependDefaultRowsIfIncident(existingRows) {
    const incidentDefaultRows = [
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
              onlyAlphabetsLength: "",
              isDisabled: true
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
              onlyAlphabetsLength: "",
              isDisabled: true
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
              onlyAlphabetsLength: "",
              isDisabled: true
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
              singleSelectValues: "",
              isDisabled: true
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
              onlyAlphabetsLength: "50",
              isDisabled: true
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
              contactNumberDigits: "12",
              isDisabled: true
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
            field: {
              id: "field-p7r1ority1",
              label: "Priority",
              dataType: "Dropdown Field",
              isRequired: true,
              comments: "",
              selectedDropdownOption: "singleSelect",
              multiSelectValues: "",
              singleSelectValues: "High\nMedium\nLow",
              value: ""
            },
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
              dataType: "Blank",
              isRequired: false,
              isReadOnlyLabel: true,
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
    ];
    console.log("🛠 Existing Rows Before Prepend:", existingRows);
    console.log("🧩 Default Incident Rows:", incidentDefaultRows);
    const offset = incidentDefaultRows.length;

    const newRows = JSON.parse(JSON.stringify(existingRows)); // Deep clone

    newRows.forEach((row, i) => {
      const newIndex = i + offset;
      row.id = `row-${newIndex}`;
      row.cells.forEach((cell, j) => {
        const col = cell.col;
        cell.row = newIndex;
        cell.id = `cell-${newIndex}-${col}`;
        if (cell.editKey) cell.editKey = `cell-${newIndex}-${col}-edit`;
        if (cell.deleteKey) cell.deleteKey = `cell-${newIndex}-${col}-delete`;
      });
    });

    const combinedRows = [...incidentDefaultRows, ...newRows];

    console.log("✅ Final Combined Rows (After Prepend):", combinedRows);
    return combinedRows;
  }

  subscribeToMessageChannel() {
    this.subscription = subscribe(
      this.messageContext,
      LAYOUT_MESSAGE_CHANNEL,
      (message) => this.handleMessage(message)
    );
  }

  subscribeToRedirectChannel() {
    this.redirectSubscription = subscribe(
      this.messageContext,
      NEW_FORM_REDIRECT_CHANNEL,
      (message) => this.handleRedirectMessage(message)
    );
  }
  handleRedirectMessage(message) {
    console.log("📬 Redirect message received:", message);

    if (message.actionType === "redirect") {
      //this.loadRedirectedLayout(message);
    }
  }

  handleMessage(message) {
    console.group("📨 handleMessage START");

    console.log("Received message:", message);

    // 🔥 MARK THAT LMS HAS TAKEN CONTROL
    this.hasLoadedFromMessage = true;

    if (message.actionType === "edit" && message.layoutName) {
      this.isCloneMode = false;
      this.layoutId = message.layoutName;
      this.isViewingLayouts = false;
      this.audience = message.audience || "";

      console.log("🧬 Version FROM MESSAGE:", {
        recordId: message.dynamicFormRecordId,
        groupId: message.dynamicFormGroupId,
        version: message.dynamicFormVersionLabel
      });

      this.loadLayoutById(this.layoutId);
      console.log("Editing layout with ID:", this.layoutId);

      requestAnimationFrame(() => {
        const dropdown = this.template.querySelector(".form-dropdown");
        if (dropdown) dropdown.value = this.selectedFormType;
      });

    } else if (message.actionType === "clone") {

      this.isCloneMode = true;
      this.selectedFormType = message.Name__c;

      console.log(
        "Cloning layout with Name__c (form type):",
        this.selectedFormType
      );

      this.loadClonedLayout(message);

      requestAnimationFrame(() => {
        const dropdown = this.template.querySelector(".form-dropdown");
          if (dropdown) dropdown.value = this.selectedFormType;
        });

      } else if (message.actionType === "redirect") {

        console.log("Redirecting with layout:", message);
        this.loadRedirectedLayout(message); // 👉 call the new method

      }

      console.groupEnd();
}

  renderFromLayoutData(layoutData) {
    try {
      console.log("🔄 Rendering from layoutData:", layoutData);

      // Apply layout data
      this.tableRows = layoutData.tableRows || [];
      this.selectedFormType = layoutData.selectedFormType || "Medication";
      this.formTitle = layoutData.formTitle || "Hardcoded Form Title";
      this.isViewingLayouts = false;

      // Defer DOM-dependent logic until next render cycle
      setTimeout(() => {
        // Sync form type dropdown
        const dropdown = this.template.querySelector(".form-dropdown");
        if (dropdown) {
          dropdown.value = this.selectedFormType;
          console.log(
            "✅ Dropdown initialized with selectedFormType:",
            dropdown.value
          );
        } else {
          console.warn("⚠️ Form dropdown element not found.");
        }

        // Sync preview toggle
        const previewToggle = this.template.querySelector(".preview-toggle");
        if (previewToggle) {
          previewToggle.checked = this.isPreviewEnabled;
          console.log("✅ Preview toggle synced.");
        } else {
          console.warn("⚠️ Preview toggle element not found.");
        }

        // Re-bind cell click handlers
        const cells = this.template.querySelectorAll(".table-cell");
        if (cells.length > 0) {
          cells.forEach((cell) => {
            cell.removeEventListener("click", this.handleCellClick);
            cell.addEventListener("click", this.handleCellClick.bind(this));
          });
          console.log(`✅ Bound click handlers to ${cells.length} cells.`);
        } else {
          console.warn("❌ No table cells found for event binding.");
        }

        // Highlight and update UI state
        if (typeof this.highlightSelectedCells === "function") {
          this.highlightSelectedCells();
        }

        this.updatePreviewAndButtonStates();
      }, 0); // Wait for DOM render
    } catch (error) {
      console.error("❌ Error rendering layoutData in table:", error);
      this.showToast("Error", "Failed to render layout data.", "error");
    }
  }

  loadRedirectedLayout(message) {
    try {
      console.log("✅ Layout payload IN loadRedirectedLayout:", message);

      const parsedData = JSON.parse(message.layoutJSON);
      console.log("✅ Parsed layout data:", parsedData);

      this.layoutData = parsedData;
      this.tableRows = parsedData.tableRows || [];

      // ✅ FIX: Use message values instead of hardcoding
      this.selectedFormType =
        message.Name__c || parsedData.selectedFormType || "";
      this.formTitle = message.title || parsedData.formTitle || "";
      this.isViewingLayouts = false;

      // ✅ Delay DOM updates
      setTimeout(() => {
        const dropdown = this.template.querySelector(".form-dropdown");
        if (dropdown) {
          dropdown.value = this.selectedFormType;
          console.log(
            "✅ Dropdown value set after layout load:",
            dropdown.value
          );
        }

        const previewToggle = this.template.querySelector(".preview-toggle");
        if (previewToggle) {
          previewToggle.checked = this.isPreviewEnabled;
        }

        const cells = this.template.querySelectorAll(".table-cell");
        if (cells.length > 0) {
          cells.forEach((cell) => {
            cell.removeEventListener("click", this.handleCellClick);
            cell.addEventListener("click", this.handleCellClick.bind(this));
          });
        }

        this.highlightSelectedCells?.();
        this.updatePreviewAndButtonStates();
      }, 0);
    } catch (error) {
      console.error("❌ Error loading layout from redirect:", error);
      this.showToast(
        "Error",
        "Could not load layout from redirect. Please retry.",
        "error"
      );
    }
  }

  updatePreviewAndButtonStates() {
    const titleValid = this.formTitle && this.formTitle.trim().length > 0;
    const formTypeValid =
      this.selectedFormType && this.selectedFormType.trim().length > 0;

    this.isSendDisabled = !(
      titleValid &&
      formTypeValid &&
      this.isPreviewEnabled
    );

    console.log("📌 Form Title Valid:", titleValid);
    console.log("📌 Form Type Valid:", formTypeValid);
    console.log("📌 Preview Enabled:", this.isPreviewEnabled);
    console.log("📌 Send Button Disabled:", this.isSendDisabled);
  }

    loadClonedLayout(message) {
      try {
        console.group("🧠 loadClonedLayout START");

        console.log("Cloning layout with JSON data:", message.layoutJSON);
        console.log("Incoming message:", message);

        // ===============================
        // 🔥 PARSE + NORMALIZE JSON
        // ===============================
        let parsedData =
          typeof message.layoutJSON === "string"
            ? JSON.parse(message.layoutJSON)
            : message.layoutJSON;

        // 🔥 Fix: handle array-only structure (Dynamic Form case)
        if (Array.isArray(parsedData)) {
          parsedData = {
            tableRows: parsedData,
            selectedFormType: message.formType || "",
            selectedModuleType: message.formModule || "Customisable Form",
            audience: message.audience || ""
          };
        }

        this.layoutData = parsedData;

        // ===============================
        // 🔥 TABLE ROWS CLONE
        // ===============================
        this.tableRows = JSON.parse(
          JSON.stringify(this.layoutData.tableRows || [])
        );

        // ===============================
        // 🔥 REBUILD TABLE BLOCKS
        // ===============================
        this.tableRows.forEach((row) => {
          row.cells?.forEach((cell) => {
            if (cell.field?.isTableBlock) {
              this.rebuildRenderCells(cell.field);

              // 🔥 Force reactivity
              cell.field.tableConfig = {
                ...cell.field.tableConfig
              };
            }
          });
        });

        // ===============================
        // 🔥 VERSION CONTEXT (SAFE SET)
        // ===============================
        console.log("🧬 Version BEFORE APPLY:", {
          existing: this.dynamicFormGroupId,
          incoming: message.dynamicFormGroupId
        });

        if (this.dynamicFormGroupId && !message.dynamicFormGroupId) {
          console.warn("⚠️ Prevented version overwrite");
        } else {
          this.dynamicFormRecordId = message.dynamicFormRecordId || null;
          this.dynamicFormGroupId = message.dynamicFormGroupId || null;
          this.dynamicFormVersionLabel = message.dynamicFormVersionLabel || null;
        }

        this.isVersionEditFlowActive = !!this.dynamicFormGroupId;

        console.log("🧬 Version context FINAL:", {
          recordId: this.dynamicFormRecordId,
          groupId: this.dynamicFormGroupId,
          version: this.dynamicFormVersionLabel,
          isEdit: this.isVersionEditFlowActive
        });

        // ===============================
        // 🔥 MODULE TYPE
        // ===============================
        this.selectedModuleType =
          message.formModule ||
          this.layoutData.selectedModuleType ||
          "";

        this.showFormTypeDropdown = true;

        console.log("📌 Form Module defaulted to:", this.selectedModuleType);

        // ===============================
        // 🔥 FORM TYPE + TITLE
        // ===============================
        this.selectedFormType =
          this.layoutData.selectedFormType ||
          message.formType ||
          "";

        this.formTitle = message.title || "";

        console.log("📌 Form Type set to:", this.selectedFormType);


        // ===============================
        // 🔥 DROPDOWN SYNC
        // ===============================
        requestAnimationFrame(() => {
          const formModuleDropdown = this.template.querySelector(
            ".form-module-dropdown"
          );
          if (formModuleDropdown) {
            formModuleDropdown.value = this.selectedModuleType;
          }

          const formTypeDropdown = this.template.querySelector(".form-dropdown");
          if (formTypeDropdown) {
            formTypeDropdown.value = this.selectedFormType;
          }
        });

        // ===============================
        // 🔥 UI STATE
        // ===============================
        this.newDesign = true;
        this.isCloneMode = false;
        this.isViewingLayouts = false;

        console.groupEnd();

      } catch (error) {
        console.error("❌ Error parsing layout JSON for clone:", error);
        this.showToast("Error", "Failed to load cloned layout data.", "error");
      }
}

  // Method to redirect to the drag-and-drop view (if needed)
  navigateToDragDropView() {
    // Logic to show or activate the drag-and-drop component view
    this.showDragDropView = true; // This assumes you’re using a conditional rendering flag
    console.log("Redirected to drag-and-drop view");
  }

  // ❗ Keep ONLY this version in your JS file
async loadLayoutById(layoutId) {
  try {
    console.log("Loading layout data for ID:", layoutId);
    const layout = await getLayoutData({ layoutName: layoutId });

    if (!layout) {
      console.warn("No layout data returned for ID:", layoutId);
      return;
    }

    console.log("Retrieved layout for editing:", layout);

    // Name / title / type
    this.layoutName = layout.displayName || "";
    this.formTitle = layout.title || "";
    this.selectedFormType = layout.displayName || ""; // or whatever you use as form type

    // Parse layout JSON safely
    const parsed = layout.layoutJson ? JSON.parse(layout.layoutJson) : {};
    this.tableRows = parsed.tableRows || [];

    this.tableHistory = [
  JSON.parse(JSON.stringify(this.tableRows))
];

    // 🔹 IMPORTANT: keep column count in sync with loaded layout
    if (this.tableRows.length) {
      this.currentCols =
        this.tableRows.reduce(
          (max, row) => Math.max(max, (row.cells ? row.cells.length : 0)),
          0
        ) || 1;
    } else {
      this.currentCols = 1; // sensible default
    }

    console.log("Loaded cols (currentCols):", this.currentCols);

    // Reset preview mode on load
    this.isPreviewEnabled = false;

    // Sync dropdown in UI
    requestAnimationFrame(() => {
      const dropdown = this.template.querySelector(".form-dropdown");
      if (dropdown) {
        dropdown.value = this.selectedFormType;
        console.log("Dropdown value set:", dropdown.value);
      } else {
        console.warn("Dropdown element not found.");
      }
    });

    console.log("Loaded form title:", this.formTitle);
    console.log("Loaded form type:", this.selectedFormType);
  } catch (error) {
    console.error("Error loading layout by ID:", error);
    this.showToast("Error", "Failed to load layout data.", "error");
  }
}


  // loadLayoutById(layoutId) {
  //   getLayoutData({ layoutName: layoutId }) // Pass Name here
  //     .then((layout) => {
  //       this.layoutName = layout.displayName; // Set display name (Name__c) in UI
  //       this.formTitle = layout.title;
  //       this.tableRows = JSON.parse(layout.layoutJson).tableRows || [];
  //       // Update dropdown if applicable
  //       requestAnimationFrame(() => {
  //         const dropdown = this.template.querySelector(".form-dropdown");
  //         if (dropdown) dropdown.value = this.layoutName;
  //       });
  //     })
  //     .catch((error) => {
  //       console.error("Error loading layout:", error);
  //     });
  // }

  loadLayout(layout) {
    console.log("Entering loadLayout with layout:", layout); // Debug log to confirm method entry

    try {
      // Validate layout and its JSON property
      if (layout && layout.Layout_JSON__c) {
        // Parse layout JSON and extract data
        this.layoutData = JSON.parse(layout.Layout_JSON__c);
        this.tableRows = this.layoutData.tableRows || [];
        this.selectedFormType = this.layoutData.selectedFormType || "";
        this.formTitle = layout.title || ""; // Set the form title
        this.layoutId = layout.layoutId || ""; // Set layout ID for further operations
        this.isPreviewEnabled = false; // Reset preview mode on load

        console.log("Loaded layout data:", this.layoutData); // Confirm data parsing
        console.log("Form Type loaded:", this.selectedFormType);
        console.log("Form Title loaded:", this.formTitle);

        this.isViewingLayouts = false; // Ensure the component is in editing mode

        // Update dropdown selection and button states after rendering
        requestAnimationFrame(() => {
          this.updateDropdown();
          this.updateButtonStates();
        });
      } else {
        console.warn("Invalid or missing layout data.");
        this.showToast("Error", "Layout data is missing or invalid.", "error");
      }
    } catch (error) {
      console.error("Error parsing layout data in loadLayout:", error);
      this.showToast("Error", "Failed to load layout data.", "error");
    }
  }

  // Helper method to update dropdown selection
  updateDropdown() {
    const dropdown = this.template.querySelector(".form-dropdown");
    if (dropdown) {
      dropdown.value = this.selectedFormType;
      console.log("Dropdown value set to:", this.selectedFormType); // Confirm dropdown update
    } else {
      console.warn("Dropdown element not found in template.");
    }
  }

  // Helper method to update button states
  updateButtonStates() {
    const titleValid = this.formTitle && this.formTitle.trim().length > 0;
    const formTypeValid =
      this.selectedFormType && this.selectedFormType.trim().length > 0;
    const sendButton = this.template.querySelector(".send-button");

    if (sendButton) {
      sendButton.disabled = !(
        titleValid &&
        formTypeValid &&
        this.isPreviewEnabled
      );
      console.log(
        "Send Button State Updated: ",
        sendButton.disabled ? "Disabled" : "Enabled"
      );
    }
  }

  loadLayout(message) {
    console.log("Loading layout data in DragDropComp:", message);
    this.layoutName = message.layoutName; // Assign unique identifier
    this.formTitle = message.title || ""; // Assign title if available
    this.selectedFormType = message.formType; // Set form type in dropdown
    this.tableRows = JSON.parse(message.layoutJSON).tableRows || []; // Parse table rows

    // Ensure the component view updates to show the layout
    this.isViewingLayouts = false;
    this.showDragDropView = true;

    // Force dropdown update if necessary
    requestAnimationFrame(() => {
      const dropdown = this.template.querySelector(".form-dropdown");
      if (dropdown) dropdown.value = this.selectedFormType;
    });
  }



  renderedCallback() {
    // console.log("🔁 Rendered callback executed.");

    // Wait for full DOM rendering
    requestAnimationFrame(() => {
      // Add a short delay to ensure all child components and DOM elements are fully rendered
      setTimeout(() => {
        // 🔘 Synchronize the preview toggle state
        const previewToggle = this.template.querySelector(".preview-toggle");
        if (previewToggle) {
          previewToggle.checked = this.isPreviewEnabled;
        } else {
          console.warn("⚠️ Preview toggle element not found.");
        }

        // 🔽 Synchronize the dropdown with selectedFormType
        const dropdown = this.template.querySelector(".form-dropdown");
        if (dropdown) {
          if (!this.selectedFormType) {
            this.selectedFormType = dropdown.value;
          } else {
            dropdown.value = this.selectedFormType;
          }
          console.log("✅ Dropdown value synchronized:", dropdown.value);
        } else {
          console.warn("⚠️ Form dropdown element not found.");
        }

        const formModuleDropdown = this.template.querySelector(
          ".form-module-dropdown"
        );
        if (formModuleDropdown) {
          formModuleDropdown.value = this.selectedModuleType || "";
        }

        // ✅ Validate form title and form type
        const titleValid = this.formTitle && this.formTitle.trim().length > 0;
        const formTypeValid =
          this.selectedFormType && this.selectedFormType.trim().length > 0;
        this.isSendDisabled = !(
          titleValid &&
          formTypeValid &&
          this.isPreviewEnabled
        );

        // console.log("📋 Validation Status:");
        // console.log("📌 Form Title Valid:", titleValid);
        // console.log("📌 Form Type Valid:", formTypeValid);
        // console.log("📌 Preview Enabled:", this.isPreviewEnabled);
        // console.log("📌 Send Button Disabled:", this.isSendDisabled);

        // 🔁 Attach click listeners to all table cells
        const cells = this.template.querySelectorAll(".table-cell");
        if (cells.length > 0) {
          cells.forEach((cell) => {
            cell.removeEventListener("click", this.handleCellClick); // Avoid duplicates
            cell.addEventListener("click", this.handleCellClick.bind(this));
          });
          console.log(
            `✅ Attached click listeners to ${cells.length} table cells.`
          );
        } else {
          console.warn("❌ No table cells found for event binding.");
        }

        // ✨ Highlight selected cells if any
        this.highlightSelectedCells();

        // 📥 Update button states
        this.updateButtonStates();

           /* --------------------------------------
         ✅ RENDER RICH TEXT WITHOUT SANITIZING
         -------------------------------------- */

      const richContainers = this.template.querySelectorAll('.rich-text-preview');

      richContainers.forEach(container => {

        const cellId = container.dataset.id;

        const cell = this.tableRows
          ?.flatMap(r => r.cells)
          ?.find(c => c.id === cellId);

        if (!cell) return;

        const html = cell.field?.richTextContent || '';

        if (container.innerHTML !== html) {
          container.innerHTML = html;
        }

      });
      }, 1000); // Delay (in milliseconds)
    });

    if (this.triggerNewDesign && !this.hasTriggeredNewDesignClick) {
      console.log(
        "⚡ triggerNewDesign is true — calling handleNewDesignClick()"
      );
      this.handleNewDesignClick();
      // this.hideBackButton();
      this.hasTriggeredNewDesignClick = true;
    } else {
      console.log(
        "⏭️ Skipping design click — triggerNewDesign:",
        this.triggerNewDesign,
        "hasTriggeredNewDesignClick:",
        this.hasTriggeredNewDesignClick
      );
    }
     /* ------------------------------
     ✅ ADD THIS BLOCK FOR QUILL
     ------------------------------ */

 if (!this.quillLoaded) {

    this.quillLoaded = true;

    Promise.all([
      loadScript(this, QUILL + "/quill.min.js"),
      loadStyle(this, QUILL + "/quill.snow.css")
    ])
    .then(() => {
      console.log("✅ Quill editor loaded successfully");
    })
    .catch(error => {
      console.error("❌ Error loading Quill:", error);
    });

  }
  }

  hideBackButton() {
    this.showBackButton = false;
  }

  @track showBackButton = true;

  @api triggerNewDesign = false;
  hasTriggeredNewDesignClick = false;

  createTable(rows, cols) {
    this.tableRows = [];
    const maxCols = 2;

    for (let row = 0; row < rows; row++) {
      const tableRow = { id: `row-${row}`, cells: [] };
      for (let col = 0; col < Math.min(cols, maxCols); col++) {
        tableRow.cells.push({
          id: `cell-${row}-${col}`,
          row,
          col,
          field: null,
          colspan: 1,
          rowspan: 1,
          showMenu: false,
          style: "border: 1px solid #ddd;",
          editKey: `cell-${row}-${col}-edit`,
          deleteKey: `cell-${row}-${col}-delete`,
          dynamicCellClass: "table-cell",
        });
      }
      this.tableRows.push(tableRow);
    }
    this.saveTableState();
  }

  saveTableState() {
    if (!Array.isArray(this.tableHistory)) {
      this.tableHistory = [];
    }

    const currentState = JSON.stringify(this.tableRows);

    const lastState =
      this.tableHistory.length > 0
        ? JSON.stringify(this.tableHistory[this.tableHistory.length - 1])
        : null;

    if (currentState !== lastState) {
      this.tableHistory.push(JSON.parse(currentState));
    }
  }

toggleMenu(event) {

  if (this.showPopup) {
    console.log("⛔ Menu blocked because settings is open");
    return;
  }

  event.stopPropagation();

  const id = event.currentTarget.dataset.id;

  console.group("🧭 toggleMenu triggered");
  console.log("Clicked menu id:", id);

  let found = false;

  this.tableRows.forEach((row, rowIndex) => {

    console.log("Checking row:", rowIndex);

    row.cells.forEach((cell, cellIndex) => {

      console.log("Checking cell:", cell.id);

      // ================= GRID CELLS =================
      if (cell.id === id) {

        console.log("✅ Grid cell match found:", cell.id);

        const newState = !cell.showMenu;

        cell.showMenu = newState;

        console.log("Grid cell showMenu state:", cell.showMenu);

        found = true;

      } else {
        cell.showMenu = false;
      }

      // ================= INNER TABLE CELLS =================
      if (cell.field?.isTableBlock) {

        const innerRows = cell.field.tableConfig.innerCells || [];

        console.log("Checking innerCells count:", innerRows.length);

        innerRows.forEach((innerRow, rIndex) => {

          innerRow.cells.forEach((innerCell, cIndex) => {

            console.log("Inspecting innerCell:", innerCell.id);

            if (innerCell.id === id) {

              console.log("✅ Inner cell match found:", innerCell);

              const newState = !innerCell.showMenu;

              // Update source object
              innerCell.showMenu = newState;

              // 🔹 Sync renderCells because template renders from renderCells
              if (innerRow.renderCells) {

                innerRow.renderCells.forEach(renderCell => {

                  if (renderCell.id === id) {
                    renderCell.showMenu = newState;
                  } else {
                    renderCell.showMenu = false;
                  }

                });

              }

              console.log("Inner cell showMenu state:", innerCell.showMenu);

              found = true;

            } else {

              innerCell.showMenu = false;

              // 🔹 Also reset renderCells menu state
              if (innerRow.renderCells) {

                innerRow.renderCells.forEach(renderCell => {
                  if (renderCell.id !== id) {
                    renderCell.showMenu = false;
                  }
                });

              }

            }

          });

        });

      }

    });

  });

  if (!found) {
    console.warn("⚠️ No cell or innerCell matched id:", id);
  }

  console.log("🔄 Triggering tableRows re-render");

  // Force LWC reactivity
  this.tableRows = JSON.parse(JSON.stringify(this.tableRows));

  console.log("Updated tableRows snapshot:", this.tableRows);

  console.groupEnd();

  // document.addEventListener("click", this.closeMenuOnOutsideClick);
  // document.addEventListener("scroll", this.closeMenuOnScroll);
}

closeMenuOnOutsideClick = (event) => {

    const path = event.composedPath(); // 🔥 CRITICAL

    const isInsideMenu = path.some(el =>
        el.classList && el.classList.contains("menu-container")
    );

    if (!isInsideMenu) {
        this.closeAllMenus();
    }
};

  closeMenuOnScroll = () => {
    this.closeAllMenus();
  };

closeAllMenus() {
    this.tableRows.forEach(row => {
        row.cells.forEach(cell => {
            cell.showMenu = false;

            if (cell.field?.isTableBlock) {
                const innerRows = cell.field.tableConfig.innerCells || [];

                innerRows.forEach(innerRow => {

                    innerRow.cells.forEach(innerCell => {
                        innerCell.showMenu = false;
                    });

                    // 🔥 ALSO RESET renderCells
                    if (innerRow.renderCells) {
                        innerRow.renderCells.forEach(rc => {
                            rc.showMenu = false;
                        });
                    }

                });
            }
        });
    });

    this.tableRows = [...this.tableRows];
}

  handleEdit(event) {

   this.isEditModeActive = true; // 🔥 mark edit mode

  this._tableStateBackup = JSON.parse(JSON.stringify(this.tableRows));
    const cellId = event.target.dataset.id;
    const cell = this.getCellById(cellId);
    if (cell && cell.field) {
      this.currentCell = cell;
      this.fieldLabel = cell.field.label || "";
      this.currentFieldType = cell.field.dataType;
      this.isMandatory = cell.field.isRequired || false;
      this.comments = cell.field.comments || "";

      this.selectedField = null;
    this.selectedField = cell.field; 

      // Reset all field type flags
      this.isTextField = false;
      this.isNumberField = false;
      this.isDateField = false;
      this.isDropDownField = false;
      this.isTimeField = false;
      this.isUploadFileField = false;
      this.isRadioButtonField = false;
      this.isHeaderField = false;
            this.isTableBlock = false; 


      // Populate specific fields based on the saved field type
      if (cell.field.dataType === "Text Field") {
        this.isTextField = true;
        this.selectedOption = cell.field.selectedTextFieldOption || ""; // Load the saved radio button for Text Field
        this.alphaNumericLength = cell.field.alphaNumericLength || "";
        this.onlyAlphabetsLength = cell.field.onlyAlphabetsLength || "";
      } else if (cell.field.dataType === "Number Field") {
        this.isNumberField = true;
        this.selectedNumberFieldOption =
          cell.field.selectedNumberFieldOption || ""; // Load the saved radio button for Number Field
        this.decimalValue = cell.field.decimalValue || "";
        this.contactNumberDigits = cell.field.contactNumberDigits || "";
      } else if (cell.field.dataType === "Date Field") {
        this.isDateField = true;
        this.selectedDateFormat = cell.field.selectedDateFormat || ""; // Load saved date format
      } else if (cell.field.dataType === "Dropdown Field") {
        this.isDropDownField = true;
        this.selectedDropdownOption = cell.field.selectedDropdownOption || ""; // Load saved radio button for Drop Down
        this.multiSelectValues = cell.field.multiSelectValues || "";
        this.singleSelectValues = cell.field.singleSelectValues || "";
        this.predefinedListType = cell.field.predefinedListType || "";
      } else if (cell.field.dataType === "Time Field") {
        this.isTimeField = true;
        this.timeFormat = cell.field.timeFormat || "";
        this.timeDisplayFormat = cell.field.timeDisplayFormat || "";
      } else if (cell.field.dataType === "Upload File") {
        this.isUploadFileField = true;
      } else if (cell.field.dataType === "Radio Button") {
        this.isRadioButtonField = true;
        this.hydrateRadioField(cell.field);
      } else if (cell.field.dataType === "Header") {
        this.isHeaderField = true;
        
            } else if (cell.field.dataType === "Table Block") {

        this.isTableBlock = true;

        const cfg =
          cell.field.tableConfig || {};

        // 🔵 restore grid shape
        this.tableRowsInput =
          cfg.rows || 2;

        this.tableColsInput =
          cfg.cols || 2;

        // 🔵 restore toggles
        this.hasTableHeader =
          !!cfg.hasHeader;

        this.hasRowLabels =
          !!cfg.hasRowLabels;

        this.showTableName =
          !!cfg.showTableName;

        this.tableName =
          cfg.tableName || '';

          // 🔥 HYDRATE COLUMN HEADERS
this.columnHeaderInputs = (cfg.columns || [])
  .filter(c => !c.isRowLabel)
  .map((c, i) => ({
    key: `hdr-${i}`,
    index: i,
    label: `Column ${i + 1}`,
    value: c.header || ''
  }));

// 🔥 HYDRATE ROW LABELS
this.rowLabelInputs = (cfg.rowNames || []).map((r, i) => ({
  key: `row-${i}`,
  index: i,
  label: `Row ${i + 1}`,
  value: r.value || ''
}));

        // 🔥 Detect autofill from existing cells (for old + new data)
        const hasAutoGeneratedCells =
          cfg.innerCells?.some(row =>
            row.cells?.some(cell => cell.field?.isAutoGenerated)
          );

        // ✅ Restore toggle (priority: saved config → fallback detection)
        this.autoFillEmptyCells =
          cfg.autoFillEmptyCells ?? hasAutoGeneratedCells;

        // ✅ Restore type
        if (cfg.autoFillType) {

          this.autoFillType = cfg.autoFillType;

        } else {

          const autoField =
            cfg.innerCells
              ?.flatMap(row => row.cells)
              ?.find(cell => cell.field?.isAutoGenerated)?.field;

          this.autoFillType =
            autoField?.dataType || 'Text Field';
        }

        // 🔵 restore column widths model
       this.tableColumnWidths =
        (cfg.columns || []).map((c, i) => ({
          key: c.key,
          label:
            cfg.hasRowLabels && i === 0
              ? 'Row Label'
              : `Column ${cfg.hasRowLabels ? i : i + 1}`,
          width: c.width
        }));


        // 🔵 force table into edit mode
        cell.field.isEditMode = true;
        // 🔥 CRITICAL: rebuild preview in edit mode
this.updateLiveTablePreview(cell);

        // 🔵 ensure popup reflects it
        this.currentFieldType =
          "Table Block";
            }

             else if (cell.field.dataType === "Rich Text") {
        this.isRichTextDisplay = true;

        // Load existing content
        this.richTextContent = cell.field.richTextContent || "<p>Enter formatted text</p>";

        // Wait until popup DOM renders, then initialize Quill
        setTimeout(() => {
          this.initializeQuillEditors();

          // Load existing content into the editor
          const quill = this.quillInstances?.['richTextEditor'];
          if (quill) {
            quill.root.innerHTML = this.richTextContent;
          }
        }, 100);
      }

      // Show the popup for editing with populated values
      this.showPopup = true;
      this.hideMenu(cellId);
    }
  }

    handleDelete(event) {

    const cellId = event.currentTarget.dataset.id;

    console.log("🗑 Deleting cell:", cellId);

    const cell = this.getCellById(cellId);

    if (!cell) {
        console.warn("❌ Cell not found:", cellId);
        return;
    }

    /* Remove field */
    cell.field = null;
    cell.showMenu = false;

    /* If it's an inner table cell, rebuild table preview */
    const parentCell = this.findParentTableCell(cell);

    if (parentCell && parentCell.field?.isTableBlock) {

        console.log("🔄 Rebuilding table after delete");

        this.rebuildRenderCells(parentCell.field);

    }

    /* Trigger LWC reactivity */
    this.tableRows = [...this.tableRows];

    this.isMenuOpen = false;

    this.handleCancel();

    this.saveTableState();

    this.isFormSaved = false;

}

  hideMenu(cellId) {
    const cell = this.getCellById(cellId);
    cell.showMenu = false;
    this.tableRows = [...this.tableRows];
  }

handleCellClick(event) {

  const cellId = event.currentTarget.dataset.id;
  const cell = this.getCellById(cellId);

  if (!cell) return;

  if (this.isAltCopyModeActive) return;

  // ⭐ paste target
  if (this.altCopyClipboardBuffer && this.altCopyClipboardBuffer.length) {

    console.log("📍 Paste target selected:", cellId);

    this.altCopyPasteTargetCell = cell;

    this.highlightSelectedCells(); // refresh UI

    return;
  }

  // existing merge selection
  if (event.shiftKey && this.selectedCells.length > 0) {

    const startCell = this.selectedCells[0];
    this.selectRange(startCell, cell);

  } else {

    this.selectedCells = [cell];

  }

  this.highlightSelectedCells();
}



  highlightSelectedCells() {

  this.template.querySelectorAll(".table-cell").forEach((cellElement) => {

    const cellId = cellElement.dataset.id;

    // remove previous states
    cellElement.classList.remove("selected-cell");
    cellElement.classList.remove("paste-target-cell");

    // merge selection
    if (this.selectedCells.some((c) => c.id === cellId)) {
      cellElement.classList.add("selected-cell");
    }

    // paste target highlight
    if (this.altCopyPasteTargetCell && this.altCopyPasteTargetCell.id === cellId) {
      cellElement.classList.add("paste-target-cell");
    }

  });

}


  selectRange(startCell, endCell) {
    const startRow = Math.min(startCell.row, endCell.row);
    const endRow = Math.max(startCell.row, endCell.row);
    const startCol = Math.min(startCell.col, endCell.col);
    const endCol = Math.max(startCell.col, endCell.col);

    this.selectedCells = []; // Reset selection

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = this.getCellById(`cell-${row}-${col}`);
        if (cell) {
          this.selectedCells.push(cell);
        }
      }
    }

    this.highlightSelectedCells();
  }

  handleMerge() {
    if (this.selectedCells.length > 1) {
      const firstCell = this.selectedCells[0];
      const isHorizontal = this.selectedCells.every(
        (c) => c.row === firstCell.row
      );
      const isVertical = this.selectedCells.every(
        (c) => c.col === firstCell.col
      );

      if (isHorizontal) {
        this.mergeCellsHorizontally();
      } else if (isVertical) {
        this.mergeCellsVertically();
      } else {
        alert("Please select either a full row or a full column to merge.");
      }

      this.selectedCells = [];
      this.saveTableState();
    }
  }

  mergeCellsHorizontally() {
    // Determine the start and end cells based on the column indices
    const startCell = this.selectedCells[0];
    const endCell = this.selectedCells[this.selectedCells.length - 1];
    const startCol = Math.min(startCell.col, endCell.col);
    const endCol = Math.max(startCell.col, endCell.col);

    if (endCol >= 3) {
      alert("You cannot merge beyond the 3-column limit.");
      return;
    }

    const cellToMerge = this.getCellById(`cell-${startCell.row}-${startCol}`);
    const totalColspan = endCol - startCol + 1;

    cellToMerge.colspan = totalColspan;

    for (let col = startCol + 1; col <= endCol; col++) {
      const cell = this.getCellById(`cell-${startCell.row}-${col}`);
      if (cell) {
        cell.style = "display: none;";
      }
    }

    // Make sure to retain the right border of the merged column
    const lastCell = this.getCellById(`cell-${startCell.row}-${endCol}`);
    if (lastCell) {
      lastCell.style.borderRight = "1px solid #ddd";
    }

    cellToMerge.style = `border: 1px solid #ddd; width: ${totalColspan * 100}px; overflow-x: auto;`;
  }

  mergeCellsVertically() {
    const startCell = this.selectedCells[0];
    const startRow = startCell.row;
    const endRow = this.selectedCells[this.selectedCells.length - 1].row;

    const cellToMerge = this.getCellById(startCell.id);
    cellToMerge.rowspan = endRow - startRow + 1;
    cellToMerge.style = `border: 1px solid #ddd; height: ${cellToMerge.rowspan * 60}px;`; // Adjust the height based on the rowspan

    // Loop through each cell in the column range to hide them, except for the first cell
    for (let i = 1; i < this.selectedCells.length; i++) {
      const cell = this.selectedCells[i];
      cell.style = "display: none;";
    }

    // Ensure the rest of the layout structure remains unaffected by this merge
    this.tableRows = [...this.tableRows]; // Refresh the table rows
  }



handleUndo() {

  console.group("↩️ Undo Triggered");

  // 🔥 STEP 1: Clear popup / draft state if open
  if (this.showPopup) {
    console.log("⚠️ Popup open during undo → resetting UI state");

    this.fieldLabel = "";
    this.isMandatory = false;
    this.comments = "";

    this.showPopup = false;

    this.hasPendingFieldChange = false;

    this.selectedField = null;
    this.currentFieldType = null;

    this.draggingFieldType = null;
    this.draggingFieldId = null;

    this.currentCell = null;
    this.currentDraftFieldId = null;
  }

  // 🔥 STEP 2: Validate history
  if (!this.tableHistory || this.tableHistory.length <= 1) {
    console.warn("⚠️ Nothing to undo");
    alert("Nothing to undo.");
    console.groupEnd();
    return;
  }

  // 🔥 STEP 3: Get states
  const currentState = JSON.parse(
    JSON.stringify(this.tableHistory[this.tableHistory.length - 1])
  );

  const previousState = JSON.parse(
    JSON.stringify(this.tableHistory[this.tableHistory.length - 2])
  );

  console.log("📦 Current snapshot:", currentState);
  console.log("📦 Previous snapshot:", previousState);

  // 🔥 STEP 4: Detect removed fields (safe compare)
  const removedFields = [];

  for (let r = 0; r < currentState.length; r++) {

    const currentRow  = currentState[r]?.cells  || [];
    const previousRow = previousState[r]?.cells || [];

    const maxCols = Math.max(currentRow.length, previousRow.length);

    for (let c = 0; c < maxCols; c++) {

      const currentCell  = currentRow[c];
      const previousCell = previousRow[c];

      if (currentCell?.field && !previousCell?.field) {
        removedFields.push(currentCell.field.label || "Unnamed Field");
      }
    }
  }

  if (removedFields.length > 0) {
    console.log(
      "🧹 Undo removed field(s):",
      removedFields.join(", ")
    );
  } else {
    console.log("↩️ Undo did not remove any fields");
  }

  // 🔥 STEP 5: Remove current snapshot
  this.tableHistory.pop();

  // 🔥 STEP 6: Restore previous state
  this.tableRows = previousState;

  // 🔥 STEP 7: Sync column count (supports uneven rows)
  if (this.tableRows && this.tableRows.length) {
    this.currentCols = this.tableRows.reduce(
      (max, row) => Math.max(max, row.cells?.length || 0),
      0
    );
  } else {
    this.currentCols = 1;
  }

  console.log("📏 Updated column count:", this.currentCols);

  // 🔥 STEP 8: Clear selection
  this.selectedCells = [];

  // 🔥 STEP 9: FORCE FULL RE-RENDER (CRITICAL FIX)
  this.tableRows = JSON.parse(JSON.stringify(this.tableRows));

  // 🔥 STEP 10: Delay highlight (DOM sync)
  setTimeout(() => {
    this.highlightSelectedCells();
  }, 0);

  console.groupEnd();
}



handleAddRow() {

  const cols = this.getMinColumns();

  // ✅ decide insertion index
  let insertIndex = this.tableRows.length;

  if (this.selectedCells && this.selectedCells.length > 0) {
    insertIndex = this.selectedCells[0].row + 1;
  }

  // 🆕 create new row
  const newRow = {
    id: `row-${insertIndex}`,
    cells: []
  };

  for (let col = 0; col < cols; col++) {
    newRow.cells.push({
      id: `cell-${insertIndex}-${col}`,
      row: insertIndex,
      col,
      field: null,
      colspan: 1,
      rowspan: 1,
      style: "border: 1px solid #ddd;",
      dynamicCellClass: "table-cell"
    });
  }

  // 🧠 insert row in correct position
  const updatedRows = [...this.tableRows];
  updatedRows.splice(insertIndex, 0, newRow);

  // 🔥 IMPORTANT: re-index ALL rows + cells
  updatedRows.forEach((row, rowIndex) => {
    row.id = `row-${rowIndex}`;

    row.cells.forEach((cell, colIndex) => {
      cell.row = rowIndex;
      cell.col = colIndex;
      cell.id = `cell-${rowIndex}-${colIndex}`;
    });
  });

  this.tableRows = updatedRows;

  // ✅ clear selection (optional but recommended)
  this.selectedCells = [];

  this.hasChanges = true;
  this.saveTableState();
}

handleAddColumn() {

  if (!this.selectedCells || this.selectedCells.length === 0) {
    this.showToast('Error', 'Please select a cell or row first.', 'error');
    return;
  }

  const selectedCell = this.selectedCells[0];
  const rowIndex = selectedCell.row;

  const row = this.tableRows[rowIndex];

  const newColIndex = row.cells.length;

  const newCell = {
    id: `cell-${rowIndex}-${newColIndex}`,
    row: rowIndex,
    col: newColIndex,
    field: null,
    colspan: 1,
    rowspan: 1,
    showMenu: false,
    style: "border: 1px solid #ddd;",
    dynamicCellClass: "table-cell",
    editKey: `cell-${rowIndex}-${newColIndex}-edit`,
    deleteKey: `cell-${rowIndex}-${newColIndex}-delete`
  };

  row.cells.push(newCell);

  this.updateColumnIndexes(row);

  this.tableRows = [...this.tableRows];

  this.saveTableState();
}

getMinColumns() {
  if (!this.tableRows || this.tableRows.length === 0) {
    return 1;
  }

  let minCols = Infinity;

  this.tableRows.forEach(row => {
    let colCount = 0;

    row.cells.forEach(cell => {
      colCount += cell.colspan || 1; // IMPORTANT
    });

    minCols = Math.min(minCols, colCount);
  });

  return minCols === Infinity ? 1 : minCols;
}

updateColumnIndexes(row) {
  row.cells.forEach((cell, index) => {
    cell.col = index;
    cell.id = `cell-${cell.row}-${index}`;
  });
}


  handleReset() {
    // Reset table rows to their initial empty state
    this.tableRows = [];
      this.createTable(5, this.currentCols);

    // Clear other relevant fields
    this.selectedCells = [];
    this.selectedHeaderFields = [];
    this.layoutFields = [];
    this.formTitle = "";
    // this.selectedModuleType = ''; 
    // this.selectedFormType = ""; 
    this.selectedFormType = "Custom New Form"; 
    this.fieldLabel = "";
    this.isMandatory = false;
    this.comments = "";
    this.isFormTypeSelected = false;
    this.showFormTypeDropdown = false; // Hide form type dropdown
    this.hasChanges = false;
    this.isResetState = true;
    this.isPreviewMode = false;
    this.isPreviewEnabled = false;
    this.showPopup = false;
    this.showHeaderPopup = false;

    requestAnimationFrame(() => {
      const formTypeDropdown = this.template.querySelector(".form-dropdown");
      if (formTypeDropdown) {
        formTypeDropdown.value = "";
      }
      const formModuleDropdown = this.template.querySelector(
        ".form-module-dropdown"
      );
      if (formModuleDropdown) {
        formModuleDropdown.value = "";
      }
    });

    this.saveTableState(); // Save the reset state
    console.log("🔄 Form has been reset to initial empty state.");
  }

  handleSaveHeaderLayout() {
    this.layoutFields = this.tableRows
      .flatMap((row) => row.cells)
      .filter((cell) => cell.field)
      .map((cell) => ({ id: cell.field.id, label: cell.field.label }));
    this.showHeaderPopup = true;
  }

  handleCancelLayout() {
    this.selectedHeaderFields = [];
    this.showHeaderPopup = false;
  }


handleCancel() {

console.group("🚫 Cancel Triggered");

// 🔥 STEP 1: Restore previous state (CRITICAL FIX)
// ✅ ONLY restore when editing
if (this.isEditModeActive && this._tableStateBackup) {
  console.log("♻️ Restoring edit backup...");

  // 🔥 restore table structure
  this.tableRows = JSON.parse(JSON.stringify(this._tableStateBackup));

  // 🔥 ALSO restore autofill state (CRITICAL FIX)
  if (this.currentCell) {
    const backupCell =
      this._tableStateBackup[this.currentCell.row]
        ?.cells[this.currentCell.col];

    if (backupCell?.field?.isTableBlock) {
      const cfg = backupCell.field.tableConfig;

      this.autoFillEmptyCells = cfg.autoFillEmptyCells ?? false;
      this.autoFillType = cfg.autoFillType ?? null;
    }
  } else {
    // 🔥 fallback safety
    this.autoFillEmptyCells = false;
    this.autoFillType = null;
  }
}

this.fieldLabel = "";
this.isMandatory = false;
this.comments = "";
this.showPopup = false;

  console.log("Draft field ID:", this.currentDraftFieldId);

  if (this.currentDraftFieldId) {

    this.tableRows.forEach((row, rIndex) => {

      console.log(`Checking row: ${rIndex}`);

      row.cells.forEach((cell, cIndex) => {

        console.log(`Checking grid cell [${rIndex}, ${cIndex}]`, cell);

        /* MAIN GRID DELETE (ONLY IF DRAFT) */
        if (
          cell.field?.id === this.currentDraftFieldId &&
          cell.field?.isDraft
        ) {
          console.log("🗑 Draft field found in MAIN GRID → deleting", cell.field);
          cell.field = null;
        }

        /* INNER TABLE CHECK */
        const inner = cell.field?.tableConfig?.innerCells;

        if (Array.isArray(inner)) {

          console.log("📦 TableBlock detected → scanning inner cells");

          inner.forEach((innerRow, irIndex) => {

            console.log(`Checking inner row: ${irIndex}`);

            innerRow.cells?.forEach((innerCell, icIndex) => {

              if (
                innerCell.field?.id === this.currentDraftFieldId &&
                innerCell.field?.isDraft
              ) {

                console.log(
                  "🗑 Draft field found in INNER CELL → deleting",
                  innerCell.field
                );

                innerCell.field = null;

                /* 🔥 rebuild renderCells so UI updates */
                if (cell.field?.isTableBlock) {
                  this.rebuildRenderCells(cell.field);
                }

              }

            });

          });

        }

      });

    });

  } else {

    console.warn("⚠ No currentDraftFieldId set → nothing to delete");

  }

  console.log("🔄 Refreshing tableRows for re-render");

  // 🔥 STEP: disable edit mode everywhere
this.tableRows.forEach(row => {
  row.cells.forEach(cell => {
    if (cell.field?.isTableBlock) {
      cell.field.isEditMode = false;
    }
  });
});

// 🔥 STEP: rebuild preview in view mode
// this.tableRows.forEach(row => {
//   row.cells.forEach(cell => {
//     if (cell.field?.isTableBlock) {
//       this.updateLiveTablePreview(cell);
//     }
//   });
// });
this.tableRows.forEach(row => {
  row.cells.forEach(cell => {

    if (cell.field?.isTableBlock) {

      // 🔥 1. Disable table edit mode
      cell.field.isEditMode = false;

      const cfg = cell.field.tableConfig;

      /* ============================
         🔥 FIX 1: Disable HEADER EDIT
      ============================ */
      if (Array.isArray(cfg.columns)) {
        cfg.columns = cfg.columns.map(col => ({
          ...col,
          isEditable: false
        }));
      }

      /* ============================
         🔥 FIX 2: Disable ROW LABEL EDIT
      ============================ */
      if (Array.isArray(cfg.innerCells)) {
        cfg.innerCells = cfg.innerCells.map(innerRow => ({

          ...innerRow,

          // 🔥 critical
          isEditable: false,

          cells: innerRow.cells?.map(innerCell => ({

            ...innerCell,

            // 🔥 also reset field-level edit flags
            field: innerCell.field
              ? {
                  ...innerCell.field,
                  isEditMode: false
                }
              : null

          }))

        }));
      }

      /* ============================
         🔥 FIX 3: Rebuild render layer
      ============================ */
      this.rebuildRenderCells(cell.field);

    }

  });
});

this.tableRows = JSON.parse(JSON.stringify(this.tableRows));

  // this.tableRows = [...this.tableRows];

  // 🔥 STEP 2: Reset state flags
  this.hasPendingFieldChange = false;

  this.selectedField = null;
  this.currentFieldType = null;

  this.draggingFieldType = null;
  this.draggingFieldId = null;

  this.currentCell = null;
  this.currentDraftFieldId = null;

  // 🔥 STEP 3: Clear backup (IMPORTANT)
  this.isEditModeActive = false;
this._tableStateBackup = null;

  console.groupEnd();
}


  handleCancelHeader() {
    this.selectedHeaderFields = []; // Reset any temporary selections
    this.showHeaderPopup = false; // Hide the header selection popup
  }

  handleFieldSelection(event) {
    const fieldId = event.target.dataset.id;
    const isChecked = event.target.checked;

    if (isChecked) {
      if (this.selectedHeaderFields.length < 7) {
        const selectedField = this.layoutFields.find(
          (field) => field.id === fieldId
        );
        this.selectedHeaderFields = [
          ...this.selectedHeaderFields,
          selectedField
        ];
      } else {
        event.target.checked = false;
        this.showToast("Error", "You can select up to 7 fields only.", "error");
      }
    } else {
      this.selectedHeaderFields = this.selectedHeaderFields.filter(
        (field) => field.id !== fieldId
      );
    }

    // Disable unchecked fields if the limit is reached
    const disableRemaining = this.selectedHeaderFields.length >= 7;
    this.layoutFields = this.layoutFields.map((field) => ({
      ...field,
      checked: this.selectedHeaderFields.some(
        (selected) => selected.id === field.id
      ),
      disabled:
        disableRemaining &&
        !this.selectedHeaderFields.some((selected) => selected.id === field.id)
    }));
  }
  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }

  handleSaveHeader() {
    // Filter layoutFields to only include checked items and remove duplicates
    this.selectedHeaderFields = this.layoutFields
      .filter((field) => field.checked)
      .filter(
        (field, index, self) =>
          self.findIndex((f) => f.id === field.id) === index
      );

    // Close the popup
    this.showHeaderPopup = false;
  }

  openHeaderPopup() {
    this.layoutFields = this.layoutFields.map((field) => ({
      ...field,
      checked: this.selectedHeaderFields.some(
        (selected) => selected.id === field.id
      )
    }));
    this.showHeaderPopup = true; // Open the popup
  }

  showToast(title, message, variant) {
    const event = new ShowToastEvent({
      title: title,
      message: message,
      variant: variant
    });
    this.dispatchEvent(event);
  }


  get isDragEnabled() {
  return !this.showPopup;
}

  handleDragStart(event) {
    const titleMissing = !this.formTitle || this.formTitle.trim() === "";
    const moduleMissing =
      !this.selectedModuleType || this.selectedModuleType.trim() === "";
    const typeMissing =
      !this.selectedFormType || this.selectedFormType.trim() === "";

    if (titleMissing || moduleMissing || typeMissing) {
      event.preventDefault(); // Block the drag

      const missingFields = [
        titleMissing ? "Form Title" : "",
        moduleMissing ? "Form Module" : "",
        typeMissing ? "Form Type" : ""
      ]
        .filter((x) => x)
        .join(", ");

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Action Required",
          message: `Please fill out the following before dragging fields: ${missingFields}`,
          variant: "warning",
          mode: "dismissable"
        })
      );
      return;
    }

    // ✅ All conditions passed, allow drag
    this.draggingFieldType = event.target.dataset.type;
    event.dataTransfer.setData("text/plain", this.draggingFieldType);
  }

  handleDragStartDropped(event) {
    this.draggingFieldId = event.target.dataset.id;
    event.dataTransfer.setData("text/plain", this.draggingFieldId);
  }
  @track hasPendingFieldChange = false;

  handleDrop(event) {



    if (this.blockIfUnsavedPlaceholders(event)) return;
  event.preventDefault();

  const targetCellId = event.target.dataset.id;
  const targetCell = this.getCellById(targetCellId);

  const draggingId = event.dataTransfer.getData("text/plain");

  if (this.draggingFieldId) {
    // (unchanged) Move an existing dropped field between cells
    const sourceCell = this.getCellByFieldId(this.draggingFieldId);
    if (sourceCell && sourceCell.field) {
      targetCell.field = sourceCell.field;
      sourceCell.field = null;
      this.draggingFieldId = null;
    }
  } else if (this.draggingFieldType) {
    console.log("🧪 draggingFieldType:", this.draggingFieldType);

    // (unchanged) Special case: Blank/Page Break -> no popup
    if (this.draggingFieldType === "Blank") {
      const droppedField = {
        id: Date.now().toString(),
        dataType: "Blank",
        label: "Page Break",
        isReadOnlyLabel: true,
        isRequired: false,
        isBlank: true
      };


      console.log("🚫 Dropping a BLANK field...");
      console.log("📌 Target Cell:", targetCell);
      console.log("📥 Dropped Field:", droppedField);

      targetCell.field = droppedField;
      this.fieldLabel = "Page Break";
      this.draggingFieldType = null;
      this.showPopup = false;
      this.tableRows = [...this.tableRows];

      console.log("✅ BLANK field assigned. Popup skipped.");
      return;
    }

    // (unchanged) prep type flags for popup
    this.resetFieldSettings();
    this.currentFieldType = this.draggingFieldType;

    if (this.draggingFieldType === "Text Field") {
      this.isTextField = true;
    } else if (this.draggingFieldType === "Number Field") {
      this.isNumberField = true;
    } else if (this.draggingFieldType === "Date Field") {
      this.isDateField = true;
    } else if (this.draggingFieldType === "Dropdown Field") {
      this.isDropDownField = true;
    } else if (this.draggingFieldType === "Time Field") {
      this.isTimeField = true;
    } else if (this.draggingFieldType === "Upload File") {
      this.isUploadFileField = true;
    } else if (this.draggingFieldType === "Radio Button") {
      this.isRadioButtonField = true;
    } else if (this.draggingFieldType === "Header") {
      this.isHeaderField = true; // NEW
    } else if (this.draggingFieldType === "Table Block") {

      this.currentCell = targetCell;
      this.isEditModeActive = false;

      this.resetFieldFlags()
      this.isTableBlock = true;

      this.tableRowsInput = this.tableRowsInput || 2;
this.tableColsInput = this.tableColsInput || 2;

    const logicalCount =
      this.hasRowLabels
        ? this.tableColsInput + 1
        : this.tableColsInput;
    const baseWidth =
      Math.floor(100 / logicalCount);

    this.tableColumnWidths = Array.from(

      { length: logicalCount },

      (_, i) => {

        const isRowLabel =

          this.hasRowLabels && i === 0;

        return {

          key: i,
          label: isRowLabel

            ? 'Row Label Column'

            : `Column ${this.hasRowLabels ? i : i + 1}`,

          width: baseWidth

        };

      }

    );

    const columns = this.tableColumnWidths.map(c => ({

      key: c.key,

      header: '',

      width: c.width,

      style: `width:${c.width}%`,

      isRowLabel:

        this.hasRowLabels && c.key === 0

    }));


      const rowNames = Array.from(

        { length: Number(this.tableRowsInput) },

        (_, i) => ({

          key: `row-${i}`,

          value: ""

        })

      );

      const tableId = `tbl-${Date.now()}`;

      this.currentDraftFieldId = tableId;

      const placeholder = {

        id: tableId,

        dataType: "Table Block",

        label: "",

        isRequired: false,

        isTableBlock: true,

        isDraft: true,

        isEditMode: true,





        tableConfig: {

  rows: this.tableRowsInput,
  cols: this.tableColsInput,
  hasHeader: this.hasTableHeader,
  hasRowLabels: this.hasRowLabels,
  showTableName: this.showTableName,
  tableName: "",

  columns,
  rowNames,

  cellValues: {},

  innerCells: this.createInnerCells(
    Number(this.tableRowsInput),
    Number(this.tableColsInput)
  )

}

      };
      targetCell.field = placeholder;
      this.saveTableState();
      this.tableRows = [...this.tableRows];
      this.updateLiveTablePreview();
      this.showPopup = true;

      this.draggingFieldType = null;

      return;

    } else if (this.draggingFieldType === "Signature") {
      this.isSignatureField = true;
    } else if (this.draggingFieldType === "Rich Text") {
      this.isRichTextDisplay = true;

        setTimeout(() => {
            this.initializeQuillEditors();
        }, 0);
    }



    // 🔹 NEW: show a DRAFT placeholder immediately in the table
    const placeholderId = `field-${Math.random().toString(36).substr(2, 9)}`;
    this.currentDraftFieldId = placeholderId;
    const placeholder = {
      id: placeholderId,
      dataType: this.draggingFieldType,
       label: "",  
      isRequired: false,
      isDraft: true                    // flag so we can tell it's a placeholder
    };
    Object.assign(placeholder, this.getTypeFlags
      ? this.getTypeFlags(this.draggingFieldType)
      : {
          isText:     this.draggingFieldType === 'Text Field',
          isNumber:   this.draggingFieldType === 'Number Field',
          isDate:     this.draggingFieldType === 'Date Field',
          isTime:     this.draggingFieldType === 'Time Field',
          isDropdown: this.draggingFieldType === 'Dropdown Field',
          isCheckbox: this.draggingFieldType === 'Checkbox Field',
          isRadio:    this.draggingFieldType === 'Radio Button',
          isUpload:   this.draggingFieldType === 'Upload File',
          isHeader:   this.draggingFieldType === 'Header' 
        }
    );


    if (this.draggingFieldType === "Upload File") {
      placeholder.meta = { uploadedFiles: [] }; 
      placeholder.value = [];                   
    }


    if (this.draggingFieldType === "Header") {
      const headerDefaults = this.createHeaderDefaults();
      headerDefaults.inlineStyle = this.computeHeaderInlineStyle(headerDefaults);
      Object.assign(placeholder, headerDefaults);
    }
    if (this.draggingFieldType === "Rich Text") {
      placeholder.richTextContent = "<p>Enter formatted text</p>";
    }
    targetCell.field = placeholder;
    this.currentCell = targetCell;

    // (unchanged) open settings popup
    this.currentCell = targetCell;
    this.selectedField = targetCell.field; 
    this.showPopup = true;
    this.draggingFieldType = null; // Reset the new field type
  }

  // (unchanged) Refresh + defer save when popup is open
  this.tableRows = [...this.tableRows];


// // 🔎 DEBUG: inspect full builder structure
// console.group("📊 FORM BUILDER STATE AFTER DROP");

// try {
//   console.log(
//     "🔎 tableRows (deep view):",
//     JSON.parse(JSON.stringify(this.tableRows))
//   );
// } catch (e) {
//   console.warn("⚠️ Could not stringify tableRows:", e);
//   console.log("Raw tableRows:", this.tableRows);
// }

// this.tableRows.forEach((row, rIndex) => {
//   row.cells.forEach((cell, cIndex) => {

//     if (cell?.field?.isTableBlock) {
//       console.log(
//         `📦 TableBlock found at grid [${rIndex}, ${cIndex}]`,
//         JSON.parse(JSON.stringify(cell.field.tableConfig))
//       );

//       const inner = cell.field.tableConfig.innerCells || [];

//       inner.forEach((innerRow, ir) => {
//         innerRow.cells.forEach((innerCell, ic) => {
//           if (innerCell.field) {
//             console.log(
//               `   ➜ Inner field at [${ir}, ${ic}]`,
//               innerCell.field
//             );
//           }
//         });
//       });
//     }

//   });
// });

// console.groupEnd();


  if (this.showPopup) {
    this.hasPendingFieldChange = true; // Defer saving until user confirms
  } else {
    this.saveTableState(); // Only save if no popup (e.g., for blank fields or direct move)
  }
}

hasUnsavedPlaceholders() {
  return (this.tableRows || []).some(row =>
    (row.cells || []).some(cell => cell?.field?.isDraft === true)
  );
}

blockIfUnsavedPlaceholders(event) {
  if (this.hasUnsavedPlaceholders()) {
    event.preventDefault();
    event.stopPropagation();
    this.showToast("Error", "Please click Save before rearranging fields.", "error");
    return true;
  }
  return false;
}



  handleDragOver(event) {
  // 🔹 NEW: Block rearrange when draft placeholders exist
  if (this.blockIfUnsavedPlaceholders(event)) return;

  event.preventDefault();
}


  handleFieldLabelChange(event) {
    this.fieldLabel = event.target.value;
    this.hasChanges = true;
  }

  handleMandatoryChange(event) {
    this.isMandatory = event.target.checked;
  }

  handleCommentsChange(event) {
    this.comments = event.target.value;
  }

_closingPopup = false;


handleSave() {

  console.group('💾 handleSave: entry');
  console.log('🟡 BEFORE | showPopup =', this.showPopup, {
    isHeader: this.isHeader,
    hasCurrentCell: !!this.currentCell,
    currentFieldType: this.currentFieldType,
    fieldLabel: this.fieldLabel,
    hasPendingFieldChange: this.hasPendingFieldChange
  });

  // Prevent any “open settings” code from running during save
  this._closingPopup = true;
  console.log('🔒 _closingPopup =', this._closingPopup);

  // ────────────────────────────── HEADER PATH ──────────────────────────────
  if (this.isHeader && this.currentCell) {
    console.group('📂 HEADER PATH');

    const id = this.currentCell.field
      ? this.currentCell.field.id
      : `field-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 header id =', id);

    const h = (this.selectedField?.type === 'header')
      ? this.selectedField
      : this.createHeaderDefaults();
    console.log('🧱 header source =', (this.selectedField?.type === 'header') ? 'selectedField' : 'createHeaderDefaults()');

    const headerData = {
      id,
      label: '\u200B',
      dataType: 'Header',
      type: 'header',
      isHeader: true,
      isRequired: false,
      comments: '',
      isDraft: false,
      text: h.text,
      fontSize: h.fontSize,
      fontWeight: h.fontWeight,
      textAlign: h.textAlign,
      textDecoration: h.textDecoration,
      inlineStyle: this.computeHeaderInlineStyle(h),
      ...(this.getTypeFlags ? this.getTypeFlags('Header') : { isHeader: true })
    };
    console.log('📝 headerData prepared:', headerData);

    // STEP H1: write field
    try {
      this.currentCell.field = headerData;
      console.log('✍️ H1: currentCell.field updated');
    } catch (e) {
      console.error('❌ H1 failed (write header to cell):', e);
    }

    // STEP H2: optional rerender trigger
    try {
      this.tableRows = [...this.tableRows];
      console.log('🔄 H2: tableRows cloned (header)');
    } catch (e) {
      console.error('❌ H2 failed (tableRows clone):', e);
    }

    // STEP H3: reset popup fields
    try {
      console.log('➡️ H3: calling resetPopupFields()');
      this.resetPopupFields();
      console.log('🧼 H3: resetPopupFields() done');
    } catch (e) {
      console.error('❌ H3 failed (resetPopupFields):', e);
    }

    // STEP H4: close popup
    try {
      console.log('➡️ H4: setting showPopup=false (was', this.showPopup, ')');
      this.showPopup = false;
      console.log('🟢 H4: AFTER | showPopup =', this.showPopup);
    } catch (e) {
      console.error('❌ H4 failed (set showPopup=false):', e);
    }

    // STEP H5: save state if needed
    if (this.hasPendingFieldChange) {
      try {
        console.log('➡️ H5: saveTableState()');
        this.saveTableState();
        this.hasPendingFieldChange = false;
        console.log('✅ H5: saved');
      } catch (e) {
        console.error('❌ H5 failed (saveTableState):', e);
      }
    }

    // STEP H6: form saved flag
    try {
      this.isFormSaved = false;
      console.log('🧷 H6: isFormSaved =', this.isFormSaved);
    } catch (e) {
      console.error('❌ H6 failed (set isFormSaved):', e);
    }

    // Post checks
    Promise.resolve().then(() => {
      console.log('🔁 microtask (header) | showPopup =', this.showPopup, ' _closingPopup=', this._closingPopup);
    });
    setTimeout(() => {
      console.log('⏱ next tick (header) | showPopup =', this.showPopup, ' _closingPopup=', this._closingPopup);
      this._closingPopup = false;
      console.log('🟩 _closingPopup released (header) →', this._closingPopup);
    }, 0);

    console.groupEnd();   // HEADER PATH
    console.groupEnd();   // entry
    return;
  }

  // ───────────────────────────── GENERIC PATH ─────────────────────────────
  console.group('🧭 GENERIC PATH');
  console.log('🔎 G0: validation | fieldLabel:', this.fieldLabel);

  if (!this.fieldLabel || !this.fieldLabel.trim()) {
    console.warn('🟥 G0: VALIDATION FAIL → Field Label is mandatory');
    this.showToast("Error", "Field Label is mandatory.", "error");
    this._closingPopup = false;
    console.log('🟩 _closingPopup released (validation abort) →', this._closingPopup);
    console.groupEnd();   // GENERIC
    console.groupEnd();   // entry
    return;
  }
  console.log('🟩 G0: VALIDATION OK');

  if (this.currentCell) {
    console.group('🧱 G1: BUILD FIELD DATA');

    const fieldData = {
      id: this.currentCell.field
        ? this.currentCell.field.id
        : `field-${Math.random().toString(36).substr(2, 9)}`,
      label: this.fieldLabel.trim(),
      dataType: this.currentFieldType,
      isRequired: this.isMandatory,
      comments: this.comments,
      isDraft: false
    };
    console.log('🆔 G1: field id =', fieldData.id);
    console.log('📄 G1: base fieldData:', JSON.parse(JSON.stringify(fieldData)));

    if (this.isTextField) {
      fieldData.selectedTextFieldOption = this.selectedOption;
      fieldData.alphaNumericLength = this.alphaNumericLength || "";
      fieldData.onlyAlphabetsLength = this.onlyAlphabetsLength || "";
      fieldData.isRichTextInput = this.selectedOption === "richText";
      console.log('✳️ G1: TextField opts:', {
        selectedOption: this.selectedOption,
        alphaNumericLength: this.alphaNumericLength,
        onlyAlphabetsLength: this.onlyAlphabetsLength
      });
    } else if (this.isNumberField) {
      fieldData.selectedNumberFieldOption = this.selectedNumberFieldOption;
      fieldData.decimalValue = this.decimalValue || "";
      fieldData.contactNumberDigits = this.contactNumberDigits || "";
      console.log('🔢 G1: NumberField opts:', {
        selectedNumberFieldOption: this.selectedNumberFieldOption,
        decimalValue: this.decimalValue,
        contactNumberDigits: this.contactNumberDigits
      });
    } else if (this.isDateField) {
      fieldData.selectedDateFormat = this.selectedDateFormat || "";
      console.log('📅 G1: DateField opts:', { selectedDateFormat: this.selectedDateFormat });
    } else if (this.isDropDownField) {
      fieldData.selectedDropdownOption = this.selectedDropdownOption;
      fieldData.multiSelectValues = this.multiSelectValues || "";
      fieldData.singleSelectValues = this.singleSelectValues || "";
      fieldData.predefinedListType = this.predefinedListType || "";
      console.log('⬇️ G1: Dropdown opts:', {
        selectedDropdownOption: this.selectedDropdownOption,
        multiSelectValues: this.multiSelectValues,
        singleSelectValues: this.singleSelectValues,
        predefinedListType: this.predefinedListType
      });
    } else if (this.isTimeField) {
      fieldData.timeFormat = this.timeFormat;
      fieldData.timeDisplayFormat = this.timeDisplayFormat;
      console.log('⏱ G1: TimeField opts:', {
        timeFormat: this.timeFormat,
        timeDisplayFormat: this.timeDisplayFormat
      });
    } else if (this.isUploadFileField) {
  const existingMeta = this.currentCell?.field?.meta;

  fieldData.meta = {
    ...(existingMeta || {}),
    uploadedFiles: Array.isArray(existingMeta?.uploadedFiles)
      ? [...existingMeta.uploadedFiles]
      : []
  };
  fieldData.value = Array.isArray(this.currentCell?.field?.value)
    ? [...this.currentCell.field.value]
    : [];
}
 else if (this.isRadioButtonField) {
      fieldData.radioOptions = this.radioSubInputs.map((sub) => ({
        optionLabel: sub.option,
        hasSubInput: sub.hasSubInput,
        ...(sub.hasSubInput && {
          subQuestion: sub.subQuestion,
          subType: sub.subType,
          usePredefinedOptions: sub.usePredefinedOptions || false,
          selectedPredefined: sub.selectedPredefined || "",
          values: sub.usePredefinedOptions
            ? []
            : (sub.subValues || "").split("\n").map(v => v.trim()).filter(Boolean)
        })
      }));
      console.log('📻 G1: RadioButton opts count =', this.radioSubInputs?.length || 0);
    } else if (this.isTableBlock) {

  const prevCfg = this.currentCell.field.tableConfig || {};
  const oldColumns = prevCfg.columns || [];

  const colCount = Number(this.tableColsInput);
  const rowCount = Number(this.tableRowsInput);
  const hasRowLabels = this.hasRowLabels;

  // total rendered columns (includes row label column if enabled)
  const logicalCount = hasRowLabels ? colCount + 1 : colCount;

  // ──────────────────────────────
  // 🔵 NORMALIZE WIDTHS → 100%
  // ──────────────────────────────

  const base = logicalCount > 0
    ? Math.floor(100 / logicalCount)
    : 100;

  let widths = Array.from(
    { length: logicalCount },
    (_, i) => Number(oldColumns[i]?.width) || base
  );

  let total = widths.reduce((s, w) => s + w, 0);

  if (total !== 100 && logicalCount > 0) {
    const scale = 100 / total;

    widths = widths.map((w, i) =>
      i === logicalCount - 1
        ? 100 -
          widths
            .slice(0, -1)
            .map(v => Math.round(v * scale))
            .reduce((a, b) => a + b, 0)
        : Math.round(w * scale)
    );
  }

  // ──────────────────────────────
  // 🔵 BUILD COLUMNS (STABLE)
  // ──────────────────────────────

  const columns = widths.map((width, i) => {
    const isRowLabel = hasRowLabels && i === 0;

    // 🔥 Adjust index when row label column exists
    const inputIndex = hasRowLabels ? i - 1 : i;

    return {
      key: i,
      isRowLabel,

      header:
  (
    oldColumns[i]?.header
    ??
    this.columnHeaderInputs?.[
      hasRowLabels ? i - 1 : i
    ]?.value
    ??
    (isRowLabel ? "Row Label" : "")
  ),

      width,
      style: `width:${width}%`,
      thClass: isRowLabel ? 'row-label-col' : 'header-col'
    };
  });

  // ──────────────────────────────
  // 🔵 ROW LABELS (STABLE LENGTH)
  // ──────────────────────────────

const rowNames = Array.from(
  { length: rowCount },
  (_, i) => ({
    key: `row-${i}`,
    value:
      this.currentCell.field.tableConfig.rowNames?.[i]?.value
      ??
      this.rowLabelInputs?.[i]?.value
      ??
      ''
  })
);

  // ──────────────────────────────
  // 🔵 FINAL CONFIG
  // ──────────────────────────────

  const needRebuild =
    !prevCfg.innerCells ||
    prevCfg.rows !== rowCount ||
    prevCfg.cols !== colCount;

  const innerCells = needRebuild
    ? this.createInnerCells(rowCount, colCount)
    : prevCfg.innerCells;

  const cfg = {
    rows: rowCount,
    cols: colCount,
    hasHeader: this.hasTableHeader,
    hasRowLabels,
    showTableName: this.showTableName,
    tableName: prevCfg.tableName || this.tableName || '',
    columns,
    rowNames,
    cellValues: prevCfg.cellValues || {},
    autoFillEmptyCells: this.autoFillEmptyCells,
    autoFillType: this.autoFillType,
    innerCells
  };

  const cell =
    this.tableRows[this.currentCell.row]
      .cells[this.currentCell.col];

  cell.field = {
    ...cell.field,
    label: this.fieldLabel,
    isDraft: false,
    isEditMode: false, // 🔒 preview mode
    tableConfig: cfg
  };

  // 🔥 force re-render
  this.tableRows = [...this.tableRows];

  // 🔥 CRITICAL FIX → pass cell (prevents null issue)
  this.updateLiveTablePreview(cell);

  // 🔥 VERY IMPORTANT (was missing)
  if (this.hasPendingFieldChange) {
    this.saveTableState();
    this.hasPendingFieldChange = false;
  }

  this.isTableBlock = false;
  this.showPopup = false;
  this.currentCell = null;

  return;
} else if (this.isRichTextDisplay) {

      fieldData.richTextContent = this.richTextContent || "";

      console.log('📝 G1: RichText content length =', 
          (this.richTextContent || "").length
      );

    }




    const typeFlags = this.getTypeFlags
      ? this.getTypeFlags(this.currentFieldType)
      : {
          isText:     this.currentFieldType === 'Text Field',
          isNumber:   this.currentFieldType === 'Number Field',
          isDate:     this.currentFieldType === 'Date Field',
          isTime:     this.currentFieldType === 'Time Field',
          isDropdown: this.currentFieldType === 'Dropdown Field',
          isCheckbox: this.currentFieldType === 'Checkbox Field',
          isRadio:    this.currentFieldType === 'Radio Button',
          isUpload:   this.currentFieldType === 'Upload File',
          previewOptions: []
        };
    console.log('🏷 G1: typeFlags:', typeFlags);

    Object.assign(fieldData, typeFlags);


    console.log('✅ G1: FINAL fieldData:', JSON.parse(JSON.stringify(fieldData)));

    console.groupEnd(); // G1 build

    // STEP G2: write
    try {

      this.currentCell.field = fieldData;

      console.log('✍️ G2: currentCell.field updated (generic)');

      /* 🔥 IMPORTANT FIX FOR TABLE BLOCK CELLS */

      const parentCell = this.findParentTableCell(this.currentCell);

      if (parentCell && parentCell.field?.isTableBlock) {

          console.log("🔄 Rebuilding inner table renderCells");

          this.rebuildRenderCells(parentCell.field);

      }

      /* 🔥 Force LWC re-render */

      this.tableRows = [...this.tableRows];

    } catch (e) {

      console.error('❌ G2 failed (write field):', e);

    }

    // STEP G3: reset popup fields
    try {
      console.log('➡️ G3: calling resetPopupFields()');
      this.resetPopupFields();
      console.log('🧼 G3: resetPopupFields() done');
    } catch (e) {
      console.error('❌ G3 failed (resetPopupFields):', e);
    }

    // STEP G4: close popup
    try {
      console.log('➡️ G4: setting showPopup=false (was', this.showPopup, ')');
      this.showPopup = false;
      console.log('🟢 G4: AFTER | showPopup =', this.showPopup);
    } catch (e) {
      console.error('❌ G4 failed (set showPopup=false):', e);
    }

  } else {
    console.warn('⚠️ Gx: No currentCell — nothing to save');
  }

  // STEP G5: save if pending
  if (this.hasPendingFieldChange) {
    try {
      console.log('➡️ G5: saveTableState()');
      this.saveTableState();
      this.hasPendingFieldChange = false;
      console.log('✅ G5: saved');
    } catch (e) {
      console.error('❌ G5 failed (saveTableState):', e);
    }
  }

  // STEP G6: mark unsaved
  try {
    this.isFormSaved = false;
    console.log('🧷 G6: isFormSaved =', this.isFormSaved);
  } catch (e) {
    console.error('❌ G6 failed (set isFormSaved):', e);
  }
  
  try {
  console.group("📊 FINAL BUILDER STATE AFTER SAVE");

  const snapshot = JSON.parse(JSON.stringify(this.tableRows));

  console.log("🧱 tableRows (complete structure):", snapshot);

  console.dir(snapshot, { depth: null });

  console.groupEnd();

} catch (err) {
  console.warn("⚠️ Could not stringify tableRows:", err);
  console.log("Raw tableRows:", this.tableRows);
}
  // Post checks (does anything reopen it?)
  Promise.resolve().then(() => {
    console.log('🔁 microtask (generic) | showPopup =', this.showPopup, ' _closingPopup=', this._closingPopup);
  });
  setTimeout(() => {
    console.log('⏱ next tick (generic) | showPopup =', this.showPopup, ' _closingPopup=', this._closingPopup);
    this._closingPopup = false;
    console.log('🟩 _closingPopup released (generic) →', this._closingPopup);
  }, 0);

  console.groupEnd(); // GENERIC PATH
  console.groupEnd(); // entry
}

findParentTableCell(innerCell) {

    for (const row of this.tableRows) {

        for (const cell of row.cells) {

            if (cell.field?.isTableBlock) {

                const innerRows = cell.field.tableConfig?.innerCells || [];

                for (const r of innerRows) {

                    for (const c of r.cells) {

                        if (c === innerCell) {

                            return cell;

                        }

                    }

                }

            }

        }

    }

    return null;

}


// Build classes from state
get mandatoryTrackClass() {
  return `toggle-track ${this.isMandatory ? 'active' : ''}`;
}
get mandatoryKnobClass() {
  return `toggle-knob ${this.isMandatory ? 'active' : ''}`;
}
get mandatoryLabelClass() {
  return `toggle-label1 ${this.isMandatory ? 'active' : 'inactive'}`;
}
get mandatoryLabel() {
  return this.isMandatory ? 'Mandatory' : 'Not Mandatory';
}

// Click toggling (keeps your existing handler contract)
toggleMandatory = () => {
  const next = !this.isMandatory;
  // Update local state
  this.isMandatory = next;
  // Call your existing handler as if from lightning-input
  if (typeof this.handleMandatoryChange === 'function') {
    this.handleMandatoryChange({ target: { checked: next } });
  }
};

// Keyboard accessibility (Space/Enter)
handleMandatoryKeydown = (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    this.toggleMandatory();
  }
};


  // Helper method to show toast messages
  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

 resetPopupFields() {
    console.log('🧼 resetPopupFields() start');
    this.fieldLabel = "";
    this.isMandatory = false;
    this.comments = "";

    // Clear specific field type selections
    this.alphaNumericLength = "";
    this.onlyAlphabetsLength = "";
    this.decimalValue = "";
    this.contactNumberDigits = "";
    this.selectedDateFormat = "";
    this.multiSelectValues = "";
    this.singleSelectValues = "";
    this.selectedOption = ""; // Reset selection for Text Field options
    this.selectedNumberFieldOption = ""; // Reset Number Field options
    this.selectedDropdownOption = ""; // Reset Dropdown Field options
    this.is12HourFormat = false;
    this.timeDisplayFormat = "";
    this.isTimeField = false;
    // Clear flags for conditional rendering
    this.isTextField = false;
    this.isNumberField = false;
    this.isDateField = false;
    this.isDropDownField = false;
    this.isRadioButtonField = false;
    this.isHeaderField = false;
    this.showPopup = false;
    this.currentCell = null;
    this.selectedField = null;    // <- important
    this.currentFieldType = null;
    this.radioSubInputs = [];
    this.radioOptions = [];

    // Reset Rich Text
    this.richTextContent = "";
    this.isRichTextDisplay = false;

    // Reset Table Block
    this.isTableBlock = false;
    this.tableRowsInput = 0;
    this.tableColsInput = 0;
    this.hasTableHeader = false;
    this.hasRowLabels = false;
    this.showTableName = false;
    this.tableName = "";
    this.tableColumnWidths = [];

    this.autoFillEmptyCells = false;
    this.autoFillType = 'Text Field';

  }

  resetFieldSettings() {
    this.fieldLabel = "";
    this.isMandatory = false;
    this.comments = "";

    // Reset Text Field-specific settings
    this.selectedOption = "";
    this.alphaNumericLength = "";
    this.onlyAlphabetsLength = "";

    // Reset Number Field-specific settings
    this.selectedNumberFieldOption = "";
    this.decimalValue = "";
    this.contactNumberDigits = "";

    // Reset Date Field-specific settings
    this.selectedDateFormat = "";

    // Reset Dropdown-specific settings
    this.selectedDropdownOption = "";
    this.multiSelectValues = "";
    this.singleSelectValues = "";

    this.is12HourFormat = false;
    this.timeDisplayFormat = "";
    this.showPopup = false;

      // 🔵 Rich Text
  this.richTextContent = "";
  this.isRichTextDisplay = false;

  // 🔵 Table Block
  this.isTableBlock = false;
  this.tableRowsInput = 0;
  this.tableColsInput = 0;
  this.hasTableHeader = false;
  this.hasRowLabels = false;
  this.showTableName = false;
  this.tableName = "";
  this.tableColumnWidths = [];
  this.autoFillEmptyCells = false;
  this.autoFillType = 'Text Field';

    // Reset flags
    this.isTextField = false;
    this.isNumberField = false;
    this.isDateField = false;
    this.isDropDownField = false;
    this.isTimeField = false;
    this.isRadioButtonField = false;
    this.isUploadFileField = false;
    this.isHeaderField = false;
    this.radioOptions = "";
    this.mainRadioOptions = "";
    this.radioSubInputs = [];
  }
  handleFormTitleChange(event) {
    this.formTitle = event.target.value;
    this.hasChanges = true;
  }

  handleExistingFormsClick() {
    if (this.isLayoutChanged()) {
      this.showConfirmationPopup = true; // Show popup if there are unsaved changes
    } else {
      this.disablePreviewToggle();
      this.navigateToLayoutList(); // Navigate directly if no changes
    }
  }

  disablePreviewToggle() {
    this.isPreviewEnabled = false; // Ensure the preview mode is off
    this.isCaptureDisabled = true; // Disable the Capture button
    this.isSendDisabled = true; // Disable the Send button

    // Disable the preview toggle in the UI
    requestAnimationFrame(() => {
      const previewToggle = this.template.querySelector(".preview-toggle");
      if (previewToggle) {
        previewToggle.checked = false; // Uncheck the toggle
        previewToggle.disabled = true; // Disable the toggle
      } else {
        console.warn("Preview toggle element not found.");
      }
    });

    console.log("Preview toggle disabled.");
  }

  async handleSaveAndNavigate() {
  try {

    // 🔥 ONLY trigger confirmation modal
    await this.handleConfirmPublish();

    // ❌ DO NOT reset state here
    // ❌ DO NOT navigate here

  } catch (error) {
    console.error("Error during save flow:", error);
    this.showToast("Error", "Failed to initiate publish.", "error");
  }
}


  handleDiscardAndNavigate() {
    this.isUnsaved = false; // Reset the unsaved flag
    this.hasChanges = false;
    this.showConfirmationPopup = false; // Close the popup
    this.navigateToLayoutList(); // Navigate to "Existing Forms"
  }

  handleCancelPopup() {
    this.showConfirmationPopup = false; // Close the popup without navigation
  }

  saveForm() {
    // Implement your save form logic here
    console.log("Saving form...");
  }

  navigateToLayoutList() {
    this.isViewingLayouts = true; // Show "Existing Forms" view
  }

  handleNewFieldDrop() {
    // Reset field settings before opening the popup for a new field
    this.resetPopupFields();

    // Open the popup (assuming you have a method or logic to show the popup)
    this.showPopup = true;
  }
  // For text fields (Text Field Options)
  handleRadioSelection(event) {

    console.group("🔄 Radio Selection Change");

    this.selectedOption = event.target.value;
    console.log("👉 Selected Option:", this.selectedOption);

    if (!this.currentCell || !this.currentCell.field) {
        console.warn("❌ No active cell");
        console.groupEnd();
        return;
    }

    const field = this.currentCell.field;

    const wasRichText = field.isRichTextInput;
    console.log("📌 Was Rich Text:", wasRichText);

    field.selectedTextFieldOption = this.selectedOption;
    field.isRichTextInput = this.selectedOption === "richText";

    console.log("📌 Now Rich Text:", field.isRichTextInput);

    // 🔥 DESTROY FIRST
    if (!field.isRichTextInput && wasRichText) {
        console.log("🧹 Destroying Quill Editor...");
        this.destroyQuillEditorForCell(this.currentCell.id);
    }

    // 🔥 Trigger re-render
    this.tableRows = [...this.tableRows];
    console.log("🔄 tableRows updated");

    // 🔥 INIT AFTER render
    if (field.isRichTextInput && !wasRichText) {
        console.log("🚀 Initializing Quill...");
        setTimeout(() => {
            this.initializeQuillEditorForCell(this.currentCell.id);
        }, 50);
    }

    console.groupEnd();
}

initializeQuillEditorForCell(cellId) {

    console.group("🚀 Init Quill:", cellId);

    const container = this.template.querySelector(
        `.rich-text-preview[data-rich-id="${cellId}"]`
    );

    if (!container) {
        console.warn("❌ Container NOT FOUND");
        console.groupEnd();
        return;
    }

    if (!this.quillInstances) {
        this.quillInstances = {};
    }

    if (this.quillInstances[cellId]) {
        console.warn("⚠️ Already initialized → skipping");
        console.groupEnd();
        return;
    }

    if (container.__quillInitialized) {
        console.warn("⚠️ DOM already initialized → skipping");
        console.groupEnd();
        return;
    }

    console.log("✅ Creating new Quill instance");

    const quill = new window.Quill(container, {
        theme: "snow",
        readOnly: true,
        placeholder: "Rich Text Preview(Read Only)",

        // 🔥 IMPORTANT: REMOVE TOOLBAR
        modules: {
            toolbar: false
        }
    });

    this.quillInstances[cellId] = quill;
    container.__quillInitialized = true;

    console.log("✅ Quill initialized");

    console.groupEnd();
}
destroyQuillEditorForCell(cellId) {

    console.group("🧹 Destroy Quill:", cellId);

    if (!this.quillInstances) {
        console.warn("⚠️ No quillInstances object");
        console.groupEnd();
        return;
    }

    const container = this.template.querySelector(
        `.rich-text-preview[data-rich-id="${cellId}"]`
    );

    const instance = this.quillInstances[cellId];

    console.log("📦 Container:", container);
    console.log("📦 Instance exists:", !!instance);

    if (instance) {
        console.log("🔥 Clearing Quill root");
        instance.root.innerHTML = "";

        delete this.quillInstances[cellId];
        console.log("🗑 Instance removed");
    }

    if (container) {
        console.log("🧼 Cleaning DOM container");

        container.innerHTML = "";

        container.classList.remove("ql-container", "ql-snow");

        delete container.__quillInitialized;
    } else {
        console.warn("❌ Container NOT FOUND during destroy");
    }

    console.groupEnd();
}

  handleAlphaNumericLengthChange(event) {
    this.alphaNumericLength = event.target.value;
  }

  handleOnlyAlphabetsLengthChange(event) {
    this.onlyAlphabetsLength = event.target.value;
  }

  handleOptionChange(event) {
    // Update the selected option based on user choice
    this.selectedOption = event.detail.value;
  }

  // For number fields (Number Field Options)
  handleNumberFieldOptionChange(event) {
    // Update the selected option based on user choice
    this.selectedNumberFieldOption = event.detail.value;
  }
  handleNumberFieldRadioSelection(event) {
    // Update the selected option based on user choice
    this.selectedNumberFieldOption = event.target.value;
  }

  handleDecimalChange(event) {
    this.decimalValue = event.target.value;
  }

  handleContactNumberDigitsChange(event) {
    this.contactNumberDigits = event.target.value;
  }

  // For date fields (Date Field Options)
  handleDateFormatChange(event) {
    this.dateFormat = event.target.value;
  }

  // For drop-down fields (Drop Down Options)
  handleDropDownOptionChange(event) {
    this.selectedDropDownOption = event.detail.value;
  }

  handleDropDownValuesChange(event) {
    this.dropDownValues = event.target.value;
  }

  handleDateFieldRadioSelection(event) {
    this.selectedDateFieldOption = event.target.value;
  }

  handleDateFormatChange(event) {
    this.selectedDateFormat = event.target.value;
  }

  @track selectedDropdownOption = ""; // Track the selected option for Dropdown Field
  @track multiSelectValues = ""; // Values for Multi-Select Picklist
  @track singleSelectValues = ""; // Values for Single-Select Picklist

  // Getters for visibility and enablement based on selected option
  get isMultiSelectSelected() {
    return this.selectedDropdownOption === "multiSelect";
  }

  get isSingleSelectSelected() {
    return this.selectedDropdownOption === "singleSelect";
  }

  handleDropdownRadioSelection(event) {
    this.selectedDropdownOption = event.target.value;
    this.predefinedListType = ""; // Reset predefined list type on change
  }
  handlePredefinedListChange(event) {
    this.predefinedListType = event.detail.value;
  }

  handleMultiSelectValuesChange(event) {
    this.multiSelectValues = event.target.value;
  }

  handleSingleSelectValuesChange(event) {
    this.singleSelectValues = event.target.value;
  }

  handleTimeFormatChange(event) {
    this.timeFormat = event.target.value;
  }

  handleTimeDisplayFormatChange(event) {
    this.timeDisplayFormat = event.target.value;
  }

  getCellById(cellId) {

  // 1️⃣ search normal grid cells
  for (let row of this.tableRows) {

    const cell = row.cells.find(c => c.id === cellId);
    if (cell) return cell;

    // 2️⃣ search inner table cells
    for (let c of row.cells) {

      if (c.field?.isTableBlock) {

        const inner = c.field.tableConfig?.innerCells || [];

        for (let innerRow of inner) {
          const innerCell = innerRow.cells.find(ic => ic.id === cellId);
          if (innerCell) return innerCell;
        }

      }

    }

  }

  return null;
}

  getCellByFieldId(fieldId) {
    for (let row of this.tableRows) {
      const cell = row.cells.find((c) => c.field && c.field.id === fieldId);
      if (cell) return cell;
    }
    return null;
  }

  get is24HourFormat() {
    return !this.is12HourFormat;
  }

  // togglePreview(event) {
  //     this.isPreviewEnabled = event.target.checked;
  //     console.log("Preview Mode Toggled:", this.isPreviewEnabled);

  //     // Force a revalidation of the title and form type
  //     const titleValid = this.formTitle && this.formTitle.trim().length > 0;
  //     const formTypeValid = this.selectedFormType && this.selectedFormType.trim().length > 0;
  //     this.isSendDisabled = !(this.isPreviewEnabled && titleValid && formTypeValid);
  //     if (this.isPreviewEnabled) {
  //         this.isCaptureDisabled = false;
  //         this.isSendDisabled = !(titleValid && formTypeValid);
  //     } else {
  //         this.isCaptureDisabled = true;
  //         this.isSendDisabled = true;
  //     }

  //     console.log("Form Title:", this.formTitle);
  //     console.log("Selected Form Type:", this.selectedFormType);
  //     console.log("Capture Button Disabled:", this.isCaptureDisabled);
  //     console.log("Send Email Button Disabled:", this.isSendDisabled);

  //     // Ensure menu icons are hidden in preview mode
  //     const menuIcons = this.template.querySelectorAll('.menu-icon');
  //     menuIcons.forEach(icon => {
  //         icon.style.display = this.isPreviewEnabled ? 'none' : 'inline-block';
  //     });

  //     // Toggle borders visibility based on preview state
  //     this.toggleBorders(event);
  // }

  toggleBorders(event) {
    this.isBordersVisible = !event.target.checked;
    const tableCells = this.template.querySelectorAll(".table-cell");
    tableCells.forEach((cell) => {
      cell.style.border = this.isBordersVisible ? "1px solid #ddd" : "none";
      if (!this.isBordersVisible) {
        cell.classList.remove("selected-cell");
      }
    });

    if (!this.isBordersVisible) {
      this.selectedCells = [];
    }
  }

  @track Name__c = ""; // Add this to define Name__c property

  // handleFormTypeChange(event) {
  //     this.selectedFormType = event.target.value;
  //     console.log('Form Type Selected:', this.selectedFormType);
  // }

  handleFormTypeChange(event) {
    const selectedValue = event.target.value;

    if (selectedValue === "Other") {
      this.showFormTypeModal = true;
      this.customFormTypeInput = "";
    } else {
      this.selectedFormType = selectedValue;
    }
  }

  handleCustomFormTypeInputChange(event) {
    const input = event.target.value;

    if (input.length > 20) {
      this.showToast(
        "Error",
        "Form Type must be at most 20 characters.",
        "error"
      );
      this.customFormTypeInput = ""; // Optionally clear input
    } else {
      this.customFormTypeInput = input;
    }
  }

  // Cancel modal
  handleCancelFormTypeModal() {
    this.showFormTypeModal = false;

    // Reset the dropdown back to empty if user cancels
    requestAnimationFrame(() => {
      const dropdown = this.template.querySelector(".form-dropdown");
      if (dropdown) dropdown.value = "";
    });
  }

  // Confirm modal
  handleConfirmFormTypeModal() {
    const trimmed = this.customFormTypeInput.trim();

    if (!trimmed) {
      this.showToast("Error", "Please enter a valid form type.", "error");
      return;
    }

    this.selectedFormType = trimmed;
    this.showFormTypeModal = false;

    requestAnimationFrame(() => {
      const dropdown = this.template.querySelector(".form-dropdown");
      if (dropdown) {
        // Add option if it doesn't exist already
        let exists = [...dropdown.options].some((opt) => opt.value === trimmed);
        if (!exists) {
          let newOption = document.createElement("option");
          newOption.value = trimmed;
          newOption.text = trimmed;
          dropdown.appendChild(newOption);
        }
        dropdown.value = trimmed;
      }
    });

    console.log("Custom Form Type selected:", trimmed);
  }

  handleSend() {
    if (!this.selectedFormType || !this.isPreviewEnabled) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Please select a form type before sending the email.",
          variant: "error"
        })
      );
      return;
    }

    const layoutContainer = this.template.querySelector(".excel-table");
    const headerContainer = this.template.querySelector(".header-table");

    if (!layoutContainer || !headerContainer) {
      console.error("Error: Layout or Header table is missing.");
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: "Layout or Header table is missing.",
          variant: "error"
        })
      );
      return;
    }

    // Construct the plain text email body
    const emailBody = this.constructEmailBody();
    console.log("Constructed Email Body:", emailBody);
    // Inline styles for email content
    const htmlContent = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        /* General table styling */
                        .excel-table {
                            min-width: 300px;
                            table-layout: fixed;
                            width: 100%;
                            border-collapse: collapse;
                            border: 1px solid #0070d2; /* Only outer border */
                        }
    
                        .excel-table td {
                            width: 150px;
                            text-align: center;
                            vertical-align: middle;
                            padding: 5px;
                            box-sizing: border-box;
                            border: 1px solid #0070d2; /* Outer border only */
                        }
    
                        /* Field styling */
                        .field-item {
                            display: block;
                            width: 100%;
                            height: 100%;
                            padding: 10px;
                            text-align: center;
                            font-size: 14px;
                            font-weight: bold;
                            color: #333;
                            box-sizing: border-box;
                            border: none; /* No inner borders */
                        }
    
                        /* Header table styling */
                        .header-table {
                            width: 100%;
                            margin-top: 20px;
                            border-collapse: collapse;
                            table-layout: fixed;
                        }
    
                        .header-table th {
                            padding: 12px;
                            background-color: #2596be;
                            color: white;
                            text-align: center;
                            font-size: 16px;
                            font-weight: bold;
                            border: 1px solid #0070d2;
                        }
    
                        .header-table td {
                            padding: 8px;
                            text-align: center;
                            vertical-align: middle;
                            font-size: 14px;
                            color: #333;
                            border: 1px solid #0070d2;
                            background-color: #2596be; /* Matches header background */
                            color: white; /* White text */
                        }
                    </style>
                </head>
                <body>
                    <div>
                        <h1 style="text-align: center; color: #333;">Form Type: ${this.selectedFormType}</h1>
                    </div>
                    
                    <div>
                        <h2 style="color: #333;">Captured Layout</h2>
                        <table class="excel-table">
                            ${Array.from(layoutContainer.rows)
                              .map(
                                (row) => `
                                <tr>
                                    ${Array.from(row.cells)
                                      .map((cell) => {
                                        const rowspan =
                                          cell.getAttribute("rowspan") || 1;
                                        const colspan =
                                          cell.getAttribute("colspan") || 1;

                                        return `
                                            <td 
                                                style="height: ${rowspan * 60}px;" 
                                                colspan="${colspan}" 
                                                rowspan="${rowspan}">
                                                <div class="field-item">
                                                    ${cell.innerHTML}
                                                </div>
                                            </td>`;
                                      })
                                      .join("")}
                                </tr>`
                              )
                              .join("")}
                        </table>
                    </div>
                    <div>
                        <h2 style="color: #333;">Captured Header</h2>
                        <table class="header-table">
                            ${Array.from(headerContainer.rows)
                              .map(
                                (row) => `
                                <tr>
                                    ${Array.from(row.cells)
                                      .map(
                                        (cell) => `
                                        <th>${cell.innerHTML}</th>
                                    `
                                      )
                                      .join("")}
                                </tr>`
                              )
                              .join("")}
                        </table>
                    </div>
                    <div class="email-body">
                        <h2>Details</h2>
                        <p>${this.constructEmailBody().replace(/\n/g, "<br>")}</p>
                    </div>
                </body>
            </html>
        `;

    // Call Apex to send the email
    sendEmailWithCustomBody({
      htmlContent,
      plainTextBody: emailBody,
      formType: this.selectedFormType
    })
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Email sent successfully!",
            variant: "success"
          })
        );
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: "There was an error sending the email.",
            variant: "error"
          })
        );
      });
  }

  constructEmailBody() {
    // Start with the form type
    let emailBody = `Form Type: ${this.selectedFormType}\n\nForm Data:\n\n`;

    // Include sender name
    emailBody += `Sender Name: ${this.senderName}\n\n`;

    // Add the selected header fields section
    emailBody += "Columns to be displayed in the table:\n";
    this.selectedHeaderFields.forEach((field) => {
      emailBody += `- ${field.label}\n`;
    });
    emailBody += "\n"; // Add a blank line before the detailed field data

    // Add details for each field, but simplify the borders
    this.tableRows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cell.field) {
          const details = this.getFieldDetails(cell.field);
          emailBody += `-----------------------------------\n`; // Simpler separator
          emailBody += `Field Type      : ${cell.field.dataType}\n`;
          emailBody += `Field Label     : ${cell.field.label}\n`;
          emailBody += `Selected Option : ${details.option}\n`;
          emailBody += `Additional Info : ${details.additional}\n`;
          emailBody += `Comments        : ${cell.field.comments || "-"}\n`;
          emailBody += `-----------------------------------\n\n`; // Simpler separator
        }
      });
    });

    return emailBody;
  }

  // Helper method to get specific field details in plain text
  getFieldDetails(field) {
    switch (field.dataType) {
      case "Text Field":
        return {
          option: field.selectedTextFieldOption || "None",
          additional:
            field.selectedTextFieldOption === "alphaNumeric"
              ? `Length: ${field.alphaNumericLength || "Not specified"}`
              : field.selectedTextFieldOption === "onlyAlphabets"
                ? `Length: ${field.onlyAlphabetsLength || "Not specified"}`
                : field.selectedTextFieldOption === "textArea"
                  ? "Text Area (Max 255 Characters)"
                  : field.selectedTextFieldOption === "richText"
                    ? "Rich Text Field Enabled"
                    : "-"
        };

      case "Number Field":
        return {
          option: field.selectedNumberFieldOption || "None",
          additional:
            field.selectedNumberFieldOption === "currency"
              ? `Decimals: ${field.decimalValue || "Not specified"}`
              : field.selectedNumberFieldOption === "contactNumber"
                ? `Digits: ${field.contactNumberDigits || "Not specified"}`
                : "-"
        };
      case "Date Field":
        return {
          option: "Date View",
          additional: `Format: ${field.selectedDateFormat || "Not specified"}`
        };
      case "Dropdown Field":
        const options =
          field.selectedDropdownOption === "multiSelect"
            ? field.multiSelectValues
            : field.singleSelectValues;
        return {
          option: field.selectedDropdownOption || "None",
          additional: `Options: ${options || "-"}`
        };
      default:
        return { option: "-", additional: "-" };
    }
  }

  preventDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "none"; // Change cursor to indicate dropping is not allowed
  }

  preventDrop(event) {
    event.preventDefault();
    event.stopPropagation(); // Block any drop action
  }

  calculateMaxCharacters(colspan) {
    const baseCharacterLimit = 20;
    return baseCharacterLimit * colspan;
  }

  prepareTableRows() {
    this.tableRows = this.tableRows.map((row) => ({
      ...row,
      cells: row.cells.map((cell) => ({
        ...cell,
        editKey: `${cell.id}-edit`,
        deleteKey: `${cell.id}-delete`
      }))
    }));
  }

   async handleSaveLayout() {
  if (this.isLoading) return;

  this.isLoading = true;

  try {
    if (!this.formTitle || !this.selectedFormType || !this.audience) {
      this.showToast(
        "Error",
        "Title, Form For and Form Type are required.",
        "error"
      );
      return;
    }

    const actionType =
      !this.layoutId || this.isCloneMode ? "new" : "edit";

    console.log("💾 [Draft] Saving layout:", actionType);

    // 🔥 NEW — sanitize rows
    const cleanedRows = this.tableRows.map(row => ({
      ...row,
      cells: row.cells.map(cell => ({
        ...cell,
        field: this.sanitizeFieldForPersist(cell.field)
      }))
    }));

    const layoutObj = {
      tableRows: cleanedRows, // ✅ UPDATED
      layoutFields: this.layoutFields,
      selectedFormType: this.selectedFormType,
      selectedModuleType: this.selectedModuleType,
      audience: this.audience
    };

    // 🔥 Upload to AWS under DraftForms
    const awsMeta = await this.uploadFormJsonToAws(
      layoutObj,
      "DraftForms",
      this.formTitle
    );

    console.log("📦 [Draft] AWS meta:", awsMeta);

    const savedLayoutName = await saveLayout({
      layoutData: JSON.stringify(awsMeta),
      layoutName:
        actionType === "new" ? this.selectedFormType : this.layoutId,
      title: this.formTitle,
      actionType,
      orgId: this.orgid,
      formModule: this.selectedModuleType,
      audience: this.audience
    });

    this.lastSavedState = JSON.stringify(layoutObj);
    this.hasChanges = false;

    this.showToast("Success", "Form saved successfully", "success");

  } catch (error) {
    console.error("🔥 Draft save failed:", error);
    this.showToast("Error", "Failed to save layout.", "error");

  } finally {
    this.isLoading = false;
  }

  this.saveTemplate = false;
  this.isFormSaved = true;
}


isLayoutChanged() {

  const currentState = JSON.stringify({
    tableRows: this.tableRows.map(row => ({
      ...row,
      cells: row.cells.map(cell => ({
        ...cell,
        field: this.sanitizeFieldForPersist(cell.field)
      }))
    })),
    layoutFields: this.layoutFields,
    selectedFormType: this.selectedFormType,
    selectedModuleType: this.selectedModuleType,
    audience: this.audience
  });

  const changed = currentState !== this.lastSavedState;

  console.log("🧪 LAYOUT DEBUG:", {
    changed,
    currentLength: currentState?.length,
    savedLength: this.lastSavedState?.length
  });

  return changed;
}

  loadLayout(layout) {
    try {
      console.log("Loading layout data:", layout); // Debug log
      if (!layout || !layout.layoutJson) {
        console.error("Error: layout or layout.layoutJson is missing");
        this.showToast("Error", "No layout data found for loading.", "error");
        return;
      }

      // Parse the JSON layout data
      this.layoutData = JSON.parse(layout.layoutJson);
      this.tableRows = this.layoutData.tableRows || [];
      this.selectedFormType = this.layoutData.selectedFormType || "";
      this.layoutId = layout.layoutId; // Retain layoutId for future saves
      this.isViewingLayouts = false; // Switch to form editing mode

      // Set dropdown value after rendering
      requestAnimationFrame(() => {
        const dropdown = this.template.querySelector(".form-dropdown");
        if (dropdown) dropdown.value = this.selectedFormType;
      });

      console.log("Successfully loaded layout with ID:", this.layoutId);
    } catch (error) {
      console.error("Error parsing or loading layout:", error);
      this.showToast("Error", "Failed to load layout data.", "error");
    }
  }

  initializeLayout(layout) {
    if (layout && layout.Layout_JSON__c) {
      const layoutData = JSON.parse(layout.Layout_JSON__c);
      this.tableRows = layoutData.tableRows || [];
      this.selectedFormType = layoutData.selectedFormType || "";
      console.log("Layout data loaded successfully");
    }
  }

  async handleEditLayout(event) {
    try {
      const layoutId = event.detail.layoutId; // Get layout ID to edit
      // Reset all fields before loading new data
      this.resetAllFields();
      const layoutData = await getLayoutData({ layoutName: layoutId }); // Fetch data based on layout ID

      if (layoutData) {
        // Load layout data into the component for editing
        this.layoutId = layoutId;
        this.formTitle = layoutData.title || ""; // Set the title
        this.tableRows = JSON.parse(layoutData.layoutJson).tableRows || []; // Load table structure
        this.selectedFormType = layoutData.layoutName; // Set the dropdown to the layout name
        console.log("Editing layout:", layoutData);

        // Disable the send email button initially
        this.isPreviewEnabled = false; // Reset preview mode
        this.isSendDisabled = true; // Disable send button on edit
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

  resetAllFields() {
    // Reset table rows and related states
    this.tableRows = [];
    this.selectedCells = [];
    this.layoutFields = [];
    this.selectedHeaderFields = [];
    this.selectedFormType = "";
    this.formTitle = "";
    this.isPreviewEnabled = false;
    this.isSendDisabled = true;
    this.showPopup = false;
    this.showHeaderPopup = false;
    this.isFormTypeSelected = false;
    this.isCaptureDisabled = true;
    this.hasChanges = false;
    this.isResetState = true;

    // Reset field-specific properties
    this.resetFieldSettings();

    // Clear the dropdown value
    requestAnimationFrame(() => {
      const dropdown = this.template.querySelector(".form-dropdown");
      if (dropdown) dropdown.value = ""; // Reset dropdown to empty
    });

    console.log("All fields have been reset.");
  }

  async handleDeleteLayout(event) {
    try {
      const layoutId = event.target.dataset.id; // Retrieve the ID of the layout to delete
      await deleteLayout({ layoutName: layoutId }); // Call Apex to delete the layout

      // Refresh the layout list in layoutListComponent to reflect changes
      this.dispatchEvent(new CustomEvent("refreshlayouts"));
      this.showToast("Success", "Layout deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting layout:", error);
      this.showToast("Error", "Failed to delete layout.", "error");
    }
  }

  // Helper method to show toast messages
  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

  // loadClonedLayout(message) {
  //     try {
  //         console.log("Cloning layout with JSON data:", message.layoutJSON);

  //         // Parse the JSON data from the cloned message
  //         this.layoutData = JSON.parse(message.layoutJSON);
  //         this.tableRows = this.layoutData.tableRows || [];

  //         // Set selectedFormType to the Name__c from message
  //         this.selectedFormType = message.Name__c || '';
  //         console.log("Form Type (Name__c) set to:", this.selectedFormType); // Log for confirmation
  //         this.formTitle = '';
  //         // Force dropdown update after rendering
  //         requestAnimationFrame(() => {
  //             const dropdown = this.template.querySelector('.form-dropdown');
  //             if (dropdown) {
  //                 dropdown.value = this.selectedFormType;
  //                 console.log("Dropdown updated with Name__c:", dropdown.value);
  //             } else {
  //                 console.warn("Dropdown element not found.");
  //             }
  //         });

  //         this.isViewingLayouts = false; // Switch to the drag-drop view
  //     } catch (error) {
  //         console.error("Error parsing layout JSON for clone:", error);
  //         this.showToast('Error', 'Failed to load cloned layout data. Check the JSON format.', 'error');
  //     }
  // }

  @track mainRadioOptions = ""; // User-entered dept options
  @track radioSubInputs = []; // [{ option, subType, subValues }]
  @track subInputTypes = [
    { label: "Radio", value: "radio" },
    { label: "Dropdown", value: "dropdown" },
    { label: "Text Input", value: "text" }
  ];
  @track radioSubInputs = []; // [{ option, subType, subQuestion, subValues }]
  @track predefinedSubOptions = [
    { label: "Participant", value: "Participant" },
    { label: "Facility", value: "Facility" },
    { label: "Staff", value: "Staff" }
  ];
  @track inputTypeToggleOptions = [
    { label: "Enter options", value: "manual" },
    { label: "Predefined", value: "predefined" }
  ];

  getInputTypeToggleValue(optionLabel) {
    const sub = this.radioSubInputs.find((r) => r.option === optionLabel);
    return sub?.usePredefinedOptions ? "predefined" : "manual";
  }

  handleMainRadioOptionsChange(event) {
    this.mainRadioOptions = event.target.value;
    const options = this.mainRadioOptions
      .split("\n")
      .map((o) => o.trim())
      .filter((o) => o);

    this.radioSubInputs = options.map((opt) => {
      const existing = this.radioSubInputs.find((r) => r.option === opt);
      const subType = existing?.subType || "text";
      const isDropdown = subType === "dropdown";
      const isRadio = subType === "radio";

      const usePredefined = isDropdown
        ? existing?.usePredefinedOptions || false
        : false;

      return {
        option: opt,
        hasSubInput: existing?.hasSubInput || false,
        subType: subType,
        isDropdownType: isDropdown,
        isRadioType: isRadio,
        subQuestion: existing?.subQuestion || "",
        subValues: existing?.subValues || "",
        hasValues: isDropdown || isRadio,
        usePredefinedOptions: usePredefined,
        inputTypeToggleValue: usePredefined ? "predefined" : "manual",
        showManualOptions: !usePredefined,
        showPredefinedOptions: usePredefined,
        selectedPredefined: existing?.selectedPredefined || ""
      };
    });
  }

  handleSubQuestionChange(event) {
    const option = event.target.dataset.option;
    const value = event.target.value;
    this.radioSubInputs = this.radioSubInputs.map((sub) =>
      sub.option === option ? { ...sub, subQuestion: value } : sub
    );
  }

  handleSubInputTypeChange(event) {
    const option = event.target.dataset.option;
    const value = event.target.value;

    this.radioSubInputs = this.radioSubInputs.map((sub) => {
      if (sub.option === option) {
        const isDropdown = value === "dropdown";
        const isRadio = value === "radio";

        return {
          ...sub,
          subType: value,
          isDropdownType: isDropdown, // ✅ added
          isRadioType: isRadio, // ✅ optional if needed
          hasValues: isDropdown || isRadio,
          usePredefinedOptions: false,
          inputTypeToggleValue: "manual",
          subValues: "",
          selectedPredefined: "",
          showManualOptions: true,
          showPredefinedOptions: false
        };
      }
      return sub;
    });
  }

  handleUsePredefinedToggle(event) {
    const option = event.target.dataset.option;
    const selectedValue = event.detail.value;

    this.radioSubInputs = this.radioSubInputs.map((sub) => {
      if (sub.option === option) {
        const isPredefined = selectedValue === "predefined";
        return {
          ...sub,
          usePredefinedOptions: isPredefined,
          inputTypeToggleValue: selectedValue,
          showManualOptions: !isPredefined,
          showPredefinedOptions: isPredefined
        };
      }
      return sub;
    });
  }

  handleSelectedPredefinedChange(event) {
    const option = event.target.dataset.option;
    const value = event.detail.value;

    this.radioSubInputs = this.radioSubInputs.map((sub) =>
      sub.option === option ? { ...sub, selectedPredefined: value } : sub
    );
  }

  handleSubInputValuesChange(event) {
    const option = event.target.dataset.option;
    const value = event.target.value;
    this.radioSubInputs = this.radioSubInputs.map((sub) =>
      sub.option === option ? { ...sub, subValues: value } : sub
    );
  }

handleHasSubInputToggle(event) {
    const option = event.target.dataset.option;

    const current = this.radioSubInputs.find(s => s.option === option);
    const checked = !current?.hasSubInput;

    console.log('Derived Checked Value:', checked);

    this.radioSubInputs = this.radioSubInputs.map((sub) => {
        if (sub.option === option) {
            return {
                ...sub,
                hasSubInput: checked,
                subQuestion: "",
                subType: "text",
                subValues: "",
                hasValues: false
            };
        }
        return sub;
    });
}

  @track isPreviewModalOpen = false;
  @track previewTableRows = [];

  // togglePreview(event) {
  //   this.isPreviewEnabled = event.target.checked;

  //   if (this.isPreviewEnabled) {
  //     // ✅ Check DOM for dropped fields inside the container
  //     const droppedFields = this.template.querySelectorAll(
  //       ".excel-table-container .field-item.dropped"
  //     );

  //     if (!droppedFields || droppedFields.length === 0) {
  //       this.isPreviewEnabled = false;
  //       this.isPreviewModalOpen = false;
  //       this.showToast(
  //         "Warning",
  //         "Please drag and drop at least one field to preview the form.",
  //         "warning"
  //       );
  //       return;
  //     }

  //     // ✅ Proceed if there is at least one dropped field
  //     this.generatePreviewRows();
  //     this.isPreviewModalOpen = true;
  //   } else {
  //     this.isPreviewModalOpen = false;
  //   }
  // }

  closePreviewModal() {
    this.isPreviewModalOpen = false;
    this.isPreviewEnabled = false;
  }
  // generatePreviewRows() {
  //   if (!this.tableRows || this.tableRows.length === 0) return;

  //   const previewRows = this.tableRows.map((row) => {
  //     const newCells = row.cells.map((cell) => {
  //       const field = cell.field || {};
  //       const dataType = field.dataType || "";
  //        const isHeader =
  //       dataType === "Header" || field.type === "header" || field.isHeader === true;

  //       const isTextArea = field.selectedTextFieldOption === "textArea";
  //       const isAlphaNumeric = field.selectedTextFieldOption === "alphaNumeric";
  //       const isOnlyAlphabets =
  //         field.selectedTextFieldOption === "onlyAlphabets";
  //       const isRichText = field.selectedTextFieldOption === "richText";

  //       const isCurrency = field.selectedNumberFieldOption === "currency";
  //       const isContactNumber =
  //         field.selectedNumberFieldOption === "contactNumber";
  //       const isDefaultNumber =
  //         field.selectedNumberFieldOption === "defaultNumber";

  //       const isNumberField = dataType === "Number Field";

  //       const isTimeField = dataType === "Time Field";
  //       const isDateField = dataType === "Date Field";
  //       const isCheckboxField = dataType === "Checkbox Field";
  //       const isUploadField = dataType === "Upload File";
  //       const isRadioButton = dataType === "Radio Button";
  //       const isDropdownField = dataType === "Dropdown Field";

  //       let headerText = null;
  //     let headerStyle = null;
  //     if (isHeader) {
  //       headerText = field.text || field.label || "Section Title";
  //       headerStyle =
  //         field.inlineStyle ||
  //         (this.computeHeaderInlineStyle
  //           ? this.computeHeaderInlineStyle({
  //               fontSize: field.fontSize || "24",
  //               fontWeight: field.fontWeight || "600",
  //               textAlign: field.textAlign || "left",
  //               textDecoration: field.textDecoration || "none"
  //             })
  //           : `font-size:${field.fontSize || 24}px; font-weight:${field.fontWeight || 600}; text-align:${field.textAlign || "left"}; text-decoration:${field.textDecoration || "none"};`);
  //     }

  //       let placeholderText = field.label ? `Enter ${field.label}` : "";
  //       let maxLength = 255;

  //       if (isAlphaNumeric) {
  //         maxLength = parseInt(field.alphaNumericLength || "50");
  //         placeholderText += ` (AlphaNumeric)`;
  //       } else if (isOnlyAlphabets) {
  //         maxLength = parseInt(field.onlyAlphabetsLength || "50");
  //         placeholderText += ` (Alphabets Only)`;
  //       } else if (isTextArea) {
  //         placeholderText += ` (Max 255 chars)`;
  //       }

  //       let singleSelectOptions = [];
  //       if (
  //         isDropdownField &&
  //         field.selectedDropdownOption === "singleSelect" &&
  //         field.singleSelectValues
  //       ) {
  //         singleSelectOptions = field.singleSelectValues
  //           .split("\n")
  //           .map((opt) => ({
  //             label: opt.trim(),
  //             value: opt.trim(),
  //             isSelected: field.value === opt.trim()
  //           }))
  //           .filter((opt) => opt.label);
  //       }

  //       let radioOptions = [];
  //       if (isRadioButton && field.radioOptions) {
  //         radioOptions = field.radioOptions.map((option) => ({
  //           ...option,
  //           isChecked: field.value === option.optionLabel
  //         }));
  //       }
  //       let wrapperClass = "floating-label";
  //       if (isTextArea) {
  //         wrapperClass = "floating-label-comments";
  //       } else if (isRadioButton) {
  //         wrapperClass = "floating-label-radio";
  //       }

  //       console.log("Field:", field.label, "Type:", field.dataType);
  //       const shouldRender = !(
  //         field.dataType === "Blank" || field.label === "Page Break"
  //       );

  //       return {
  //         ...cell,
  //          isHeader,
  //       headerText,
  //       headerStyle,
  //         wrapperClass,
  //         shouldRender,
  //         field: {
  //           ...field,
  //           value: field.value || "",
  //           isRequired: field.isRequired || false
  //         },
  //         isTextField:
  //           dataType === "Text Field" &&
  //           !isTextArea &&
  //           !isAlphaNumeric &&
  //           !isOnlyAlphabets &&
  //           !isRichText,
  //         isAlphaNumeric,
  //         isOnlyAlphabets,
  //         isTextArea,
  //         isRichText,
  //         isCurrency,
  //         isContactNumber,
  //         isDefaultNumber,
  //         isNumberField,
  //         isTimeField,
  //         isDateField,
  //         isCheckboxField,
  //         isUploadField,
  //         isRadioButton,
  //         isDropdownField,
  //         placeholderText,
  //         maxLength,
  //         singleSelectOptions,
  //         radioOptions,
  //         floatingLabelStyle:
  //           field.dataType !== "Radio Button" &&
  //           field.dataType !== "Checkbox Field"
  //             ? "border: 1px solid #000; border-radius: 6px;"
  //             : ""
  //       };
  //     });

  //     return { ...row, cells: newCells };
  //   });

  //   this.previewTableRows = previewRows;
  // }

  //@api
  // handleNewDesignClick() {
  //   this.newDesign = !this.newDesign;
  //   this.isViewingLayouts = false;

  //   // ✅ Reset layout state
  //   this.formTitle = "";
  //   // this.selectedFormType = '';
  //   // this.selectedModuleType = '';
  //   this.showFormTypeDropdown = false;
  //   this.tableRows = [];

  //   // ✅ Create fresh blank table
  //   this.createTable(5, 10);

  //   // ✅ Reset preview
  //   this.isPreviewEnabled = false;
  //   this.isSendDisabled = true;
  //   this.isCaptureDisabled = true;

  //   console.log("🆕 Started new design mode with clean state.");
  // }

    getBorderStyle(dataType) {
    return ["Checkbox Field", "Radio Button", "Header", "Table Block", "Rich Text"].includes(dataType)
      ? "border: 1px solid transparent;"
      : "border: 1px solid black;";
  }

buildTableBlockRenderModel(cell) {

    console.group("🧱 buildTableBlockRenderModel START");

    const tableConfig = { ...(cell.field?.tableConfig || {}) };

    const columns = tableConfig.columns || [];
    const rowNames = tableConfig.rowNames || [];
    const innerCells = tableConfig.innerCells || [];

    const hasRowLabel = columns.some(c => c.isRowLabel);

    console.log("📦 columns:", JSON.parse(JSON.stringify(columns)));
    console.log("📦 rowNames:", JSON.parse(JSON.stringify(rowNames)));
    console.log("📦 innerCells:", JSON.parse(JSON.stringify(innerCells)));

    /* =========================================
       🔥 FALLBACK ROW GENERATION
    ========================================= */

    const baseRows = innerCells.length
        ? innerCells
        : rowNames.map(() => ({ cells: [] }));

    console.log("🟡 baseRows (used for render):", baseRows.length);

    /* =========================================
       🔁 BUILD RENDER ROWS
    ========================================= */

    const renderRows = baseRows.map((innerRow, rIndex) => {

        console.log(`➡️ Processing Row ${rIndex}`, innerRow);

        return {

            key: `row-${rIndex}`,
            value: rowNames[rIndex]?.value || "",

            renderCells: columns.map((col, cIndex) => {

                console.log(`   🔹 Column ${cIndex}`, col);

                /* ================= ROW LABEL ================= */

                if (col.isRowLabel) {
                    return {
                        key: `${rIndex}-label`,
                        isRowLabel: true,
                        cellValue: rowNames[rIndex]?.value || ""
                    };
                }

                const innerIndex = hasRowLabel ? cIndex - 1 : cIndex;

                const innerCell = (innerRow.cells || []).find(
                    c => Number(c.col) === Number(innerIndex)
                );

                console.log("   🔸 innerCell:", innerCell);

                /* ================= SAFE FIELD ================= */

                const field = innerCell?.field
                    ? JSON.parse(JSON.stringify(innerCell.field))
                    : {
                        label: col.header || "Field",
                        dataType: col.dataType || "Text Field"
                    };

                console.log("   🧾 field used:", field);

                /* ================= PROCESS FIELD ================= */

                const shared = this.processCellField({
                    ...(innerCell || {}),   // ✅ FIXED BUG
                    field
                });

                console.log("   ⚙️ processed shared:", shared);

                /* ================= FINAL CELL ================= */

                const finalCell = {
                    key: `${rIndex}-${cIndex}`,
                    col: innerIndex,
                    isRowLabel: false,

                    ...shared,

                    id: innerCell?.id || `${rIndex}-${cIndex}`,

                    field: {
                        ...field,
                        options: shared.options
                    }
                };

                console.log("   ✅ finalCell:", finalCell);

                return finalCell;
            })

        };

    });

    console.log("✅ renderRows built:", renderRows.length);
    console.log("🚀 FINAL TABLE CONFIG:", {
        columns,
        rowNames,
        renderRows
    });

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
/* DROPDOWN FIELD (PREVIEW ONLY) */
/* -------------------------------- */

if (cell.field?.dataType === "Dropdown Field") {

    isDropdownField = true;
    placeholderText = `Select ${cell.field.label}`;

    if (
        cell.field.selectedDropdownOption === "singleSelect" &&
        cell.field.singleSelectValues
    ) {

        options = cell.field.singleSelectValues
            .split("\n")
            .map(option => ({
                label: option.trim(),
                value: option.trim(),
                isSelected: false
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

    }
    else {
        // 🔥 fallback if nothing configured
        options = [
            { label: "Option 1", value: "opt1", isSelected: false },
            { label: "Option 2", value: "opt2", isSelected: false }
        ];
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
/* RADIO BUTTON (PREVIEW ONLY) */
/* -------------------------------- */

if (cell.field?.dataType === "Radio Button") {

    isRadioButton = true;

    radioOptionsProcessed = (cell.field.radioOptions || []).map((option, index) => {

        let processedSubOptions = [];

        // 🔹 Sub options (only from config, no external data)
        if (option.values && option.values.length > 0) {

            processedSubOptions = option.values.map((val, subIndex) => ({
                label: val,
                value: val,
                key: `sub-${index}-${subIndex}`,
                isSelected: false
            }));

        } else {

            // 🔥 fallback dummy options
            processedSubOptions = [
                { label: "Option 1", value: "opt1", key: `sub-${index}-1`, isSelected: false },
                { label: "Option 2", value: "opt2", key: `sub-${index}-2`, isSelected: false }
            ];
        }

        return {
            ...option,

            // ❌ No selection in preview
            isSelected: false,

            isDropdown: option.subType === "dropdown",
            isTextInput: option.subType === "text",
            isRadioList: option.subType === "radio",
            hasSubInput: option.hasSubInput || false,
            subQuestion: option.subQuestion || "",

            processedSubOptions,

            // 🔥 required for LWC keys
            key: `opt-${index}`,
            inputKey: `opt-${index}-input`,
            dropdownKey: `opt-${index}-dropdown`,
            textKey: `opt-${index}-text`
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

  if (
    cell.field?.selectedTextFieldOption === "richText" ||
    cell.field?.isRichTextInput ||
    cell.field?.dataType === "Rich Text"
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

    isRichTextDisplay

  };

}

generatePreviewFromEngine() {

    if (!this.tableRows || !this.tableRows.length) return;

    /* =========================================
       🔥 STEP 1: PAGINATION (PAGE BREAK)
    ========================================= */

    const rebuiltPages = this.buildStepPagesFromRows(this.tableRows);

    /* =========================================
       🔒 STEP 2: SAFE CLONE
    ========================================= */

    const clonedPages = JSON.parse(JSON.stringify(rebuiltPages));

    /* =========================================
       🔁 STEP 3: FULL ENGINE PROCESSING
    ========================================= */

    this.previewPagedRows = clonedPages.map((page, pageIndex) => {

        return page.map((row, rowIndex) => ({

            ...row,

            cells: row.cells.map((cell, colIndex) => {

                const shared = this.processCellField(cell, rowIndex, colIndex);

                /* ================= TABLE BLOCK ================= */

                let isTableBlock = false;

                if (
                    cell.field?.isTableBlock ||
                    cell.field?.dataType === "Table Block"
                ) {
                    isTableBlock = true;

                    const rebuiltConfig =
                        this.buildTableBlockRenderModel(cell);

                    cell = {
                        ...cell,
                        field: {
                            ...cell.field,
                            tableConfig: rebuiltConfig
                        }
                    };
                }

                /* ================= HEADER ================= */

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
                            textAlign: cell.field?.textAlign || "left"
                        });
                }

                /* ================= PAGE BREAK ================= */

                const isPageBreak =
                    cell.field?.dataType === "Blank" &&
                    cell.field?.label?.toLowerCase().trim() === "page break";

                const shouldRender = !isPageBreak;

                /* ================= WRAPPER CLASS ================= */

                let wrapperClass = "floating-label-preview";

                if (shared.isTextArea) {
                    wrapperClass = "floating-label-comments";
                } else if (shared.isRadioButton) {
                    wrapperClass = "floating-label-radio";
                }

                /* ================= FINAL RETURN ================= */

               return {
    ...cell,
    ...shared,

    isTableBlock,

    // 🔥 ADD THIS BLOCK (CRITICAL FIX)
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

    // EXISTING FLAGS (KEEP AS IS)
    isVisible: cell.isVisible !== false,
    shouldRender,
    wrapperClass,

    isHeader,
    headerText,
    headerStyle
};

            })

        }));

    });

    /* =========================================
       🔥 STEP 4: INIT PAGE
    ========================================= */

    this.previewCurrentPage = 0;
    this.updatePreviewVisibleRowsEngine();
}


get previewPageDisplayNumber() {
    return this.previewCurrentPage + 1;
}

get previewTotalPagesCount() {
    return this.previewPagedRows ? this.previewPagedRows.length : 0;
}

get isPreviewFirstPage() {
    return this.previewCurrentPage === 0;
}

get isPreviewLastPage() {
    return this.previewCurrentPage === this.previewPagedRows.length - 1;
}

get computedPreviewTitle() {
    return this.formTitle && this.formTitle.trim().length
        ? this.formTitle
        : 'Preview';
}
updatePreviewVisibleRowsEngine() {
    this.previewTableRows =
        this.previewPagedRows[this.previewCurrentPage] || [];
}

handlePreviewNextEngine() {
    if (this.previewCurrentPage < this.previewPagedRows.length - 1) {
        this.previewCurrentPage++;
        this.updatePreviewVisibleRowsEngine();
    }
}

handlePreviewPrevEngine() {
    if (this.previewCurrentPage > 0) {
        this.previewCurrentPage--;
        this.updatePreviewVisibleRowsEngine();
    }
}

handlePreviewToggle() {

    this.isPreviewModalOpen = true;

    this.generatePreviewFromEngine();

     setTimeout(() => {
        this.initializePreviewQuill();
    }, 0);
}

buildStepPagesFromRows(rows) {

    const pages = [];
    let currentPage = [];

    rows.forEach((row) => {

        const isPageBreak = row.cells.some(
            (cell) =>
                cell.field?.dataType === "Blank" &&
                cell.field?.label?.toLowerCase().trim() === "page break"
        );

        if (isPageBreak) {

            currentPage.push({
                ...row,
                isPageBreak: true
            });

            if (currentPage.length > 0) {
                pages.push([...currentPage]);
                currentPage = [];
            }

        } else {
            currentPage.push(row);
        }

    });

    if (currentPage.length > 0) {
        pages.push(currentPage);
    }

    return pages;
}

initializePreviewQuill() {

    console.log("🟡 Initializing Preview Quill Editors");

    const editors = this.template.querySelectorAll('.quill-preview');

    if (!editors || !editors.length) {
        console.warn("❌ No preview quill containers found");
        return;
    }

    editors.forEach(editor => {

        const cellId = editor.dataset.id;

        if (editor.dataset.initialized) return;

        try {

            const quill = new Quill(editor, {
                theme: 'snow',
                readOnly: true,   // 🔥 IMPORTANT
                modules: {
                    toolbar: false // 🔥 NO toolbar in preview
                }
            });

            // 🔥 Find field value
            const field = this.findPreviewFieldById(cellId);

            if (field?.value) {
                quill.root.innerHTML = field.value;
            } else {
                quill.root.innerHTML = `<p style="color:#999">Rich Text Preview</p>`;
            }

            editor.dataset.initialized = true;

        } catch (e) {
            console.error("🔥 Preview Quill init error:", e);
        }

    });
}

findPreviewFieldById(cellId) {

    for (let page of this.previewPagedRows || []) {
        for (let row of page) {
            for (let cell of row.cells) {
                if (cell.id === cellId) {
                    return cell.field;
                }
            }
        }
    }

    return null;
}

@track isPreviewModalOpen = false;
@track previewPagedRows = [];
@track previewTableRows = [];
@track previewCurrentPage = 0;





  currentCols = 2;
  @api

handleNewDesignClick(evt) {
  const action = evt?.currentTarget?.dataset?.action;

  if (action === 'back') {
    // ✅ Go back to landing: hide builder section controlled by newDesign
    this.newDesign = false;

    // If you still use showLanding elsewhere, keep them in sync:
    if (typeof this.showLanding !== 'undefined') this.showLanding = true;


    return;
  }

  // Legacy / "Create New" entry points:
  const raw = parseInt(evt?.currentTarget?.dataset?.cols, 10);
  if (!Number.isNaN(raw)) {
    this.currentCols = Math.max(1, Math.min(20, raw)); // 1 or 2 in your flow
  }

  this.beginNewDesign(); // uses this.currentCols
}


handleNewFromTile(e) {
  const cols = parseInt(e.currentTarget.dataset.cols, 10) || 1; // 1 or 2
  this.currentCols = Math.max(1, Math.min(20, cols));          // remember the choice
  this.beginNewDesign();                                       // start with chosen cols
}

handleTileKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    this.handleNewFromTile(e);
  }
}

beginNewDesign() {
  this.newDesign = true;
  this.isViewingLayouts = false;

  // reset layout state
  this.formTitle = "";
  this.showFormTypeDropdown = false;
  this.tableRows = [];

  // reset preview
  this.isPreviewEnabled = false;
  this.isSendDisabled = true;
  this.isCaptureDisabled = true;
  this.showPopup = false;

  // use the remembered columns
  this.createTable(5, this.currentCols);

  // if you have a landing/main page toggle, hide it here:
  this.showLanding = false;

  // console.log(`🆕 Started new design: 5 x ${this.currentCols}`);
}





  handleCloneFromDefaults(event) {
    const layoutName = event.currentTarget.dataset.id;

    getDefaultFormLayout({ layoutName })
      .then((layoutData) => {
        const parsedLayout = JSON.parse(layoutData.Form_JSON__c);

        const message = {
          layoutJSON: layoutData.Form_JSON__c,
          Name__c: layoutData.Name__c,
          title: layoutData.title || "",
          actionType: "clone",
          formModule: layoutData.Form_Module__c
        };

        // ✅ Log the message before proceeding
        console.log(
          "📤 Clone message being sent to loadClonedLayout:",
          JSON.stringify(message)
        );

        this.newDesign = true;
        this.loadClonedLayout(message);
      })
      .catch((error) => {
        console.error("❌ Error loading default layout for cloning:", error);
        this.showToast("Error", "Failed to load default form.", "error");
      });
  }

  get previewButtonLabel() {
    return this.isPreviewEnabled ? "Exit Preview" : "Preview";
  }

  get previewButtonVariant() {
    return this.isPreviewEnabled ? "destructive" : "brand"; // Or 'neutral'
  }

  get previewIcon() {
    return this.isPreviewEnabled ? "utility:close" : "utility:preview";
  }

  handlePreviewToggleClick() {
    const simulatedEvent = {
      target: {
        checked: !this.isPreviewEnabled
      }
    };
    this.togglePreview(simulatedEvent);
  }

  _layoutData;

  get layoutData() {
    return this._layoutData;
  }
  set layoutData(value) {
    if (value && value.actionType === "edit" && value.layoutJSON) {
      this._layoutData = value;

      this.newDesign = true;
      this.isCloneMode = false;
      this.isViewingLayouts = false;

      this.loadClonedLayout({
        layoutJSON: value.layoutJSON,
        Name__c: value.layoutName,
        title: value.title || value.formType
      });
    }
  }

  @track publishTempalte = false;
  @track saveTemplate = false;

  handlePublishClose() {
    this.publishTempalte = false;
  }

async handleConfirmPublish() {

  if (this.showPopup) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: 'Save Required',
        message: 'Please save the field first, then publish.',
        variant: 'warning'
      })
    );
    return false;
  }

  console.log("🚀 Confirm publish triggered");

  this.showConfirmationPopup = false;
  this.publishTempalte = true; // ✅ opens modal

  return true; // 🔥 important
}

async handleConfirmSaveLayout() {

  console.group("💾 handleConfirmSaveLayout");

  console.log("➡️ Method triggered");
  console.log("showPopup:", this.showPopup);
  console.log("Form Title:", this.formTitle);
  console.log("Org Id:", this.orgid);

  // ==============================
  // Popup validation
  // ==============================
  if (this.showPopup) {

    console.warn("⚠️ Blocked: field popup still open");

    this.dispatchEvent(
      new ShowToastEvent({
        title: 'Save Required',
        message: 'Please save the field first, then continue.',
        variant: 'warning'
      })
    );

    console.groupEnd();
    return;
  }

  // ==============================
  // Duplicate check
  // ==============================
  console.log("🔎 Checking duplicate layout title...");

  let exists = false;

  try {

    exists = await doesLayoutTitleExist({
      title: this.formTitle,
      orgId: this.orgid
    });

    console.log("✅ Duplicate check response:", exists);

  } catch (error) {

    console.error("❌ Duplicate check failed:", error);

    this.dispatchEvent(
      new ShowToastEvent({
        title: "Error",
        message: "Failed to validate form title.",
        variant: "error"
      })
    );

    console.groupEnd();
    return;
  }

  // ==============================
  // Duplicate found
  // ==============================
  if (exists) {

    console.warn("🚫 Duplicate form detected — stopping save");

    this.dispatchEvent(
      new ShowToastEvent({
        title: "Duplicate Form",
        message: "A form with this title already exists.",
        variant: "warning"
      })
    );

    console.groupEnd();
    return;
  }

  // ==============================
  // Continue save flow
  // ==============================
  console.log("🟢 No duplicate found — proceeding with save");

  this.saveTemplate = true;
  this.showConfirmationPopup = false;

  console.log("✔ saveTemplate set to true");
  console.groupEnd();
}


  @api hasUnsavedChanges() {
    console.log(
      "[formCreate] Checking unsaved changes... isFormSaved:",
      this.isFormSaved
    );
    return !this.isFormSaved;
  }

  @api
  triggerUnsavedChangesPopup(tabName) {
    this.pendingTabNavigation = tabName;
    this.showConfirmationPopup = true;
  }

  handleConfirmNavigation() {
    this.showConfirmationPopup = false;
    this.dispatchEvent(
      new CustomEvent("navigateaway", {
        detail: { tab: this.pendingTabNavigation }
      })
    );
    this.pendingTabNavigation = null;
  }

  handleCancelNavigation() {
    this.showConfirmationPopup = false;
    this.pendingTabNavigation = null;
  }

  @track isFormSaved = true;
  @track showConfirmationPopupNew = false;

  handleConfirmNavigationNew() {
    console.log("[formCreate] Confirmed new design after unsaved warning");
    this.showConfirmationPopupNew = false;

    if (this.pendingAction === "newDesign") {
      this.newDesign = false;
      this.isViewingLayouts = false;
      this.formTitle = "";
      this.selectedFormType = "";
      this.showFormTypeDropdown = false;
      this.tableRows = [];

      this.createTable(5, 10);
      this.isPreviewEnabled = false;
      this.isSendDisabled = true;
      this.isCaptureDisabled = true;
      this.isFormSaved = false;

      requestAnimationFrame(() => {
        const dropdown = this.template.querySelector(".form-dropdown");
        if (dropdown) dropdown.value = "";
      });

      console.log("🆕 Resumed new design after confirmation.");
    }

    this.pendingAction = null;
  }

  handleCancelPopupNew() {
    this.showConfirmationPopupNew = false;
    this.pendingAction = null;
  }


// helper: normalize strings for fuzzy matches

  normalizeStr(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

@api
openDefaultLayoutByQuery(query) {
  const q = this.normalizeStr(query);
  if (!q) return;

  // Ensure default layouts are present. If still loading, retry shortly.
  if (!Array.isArray(this.defaultLayouts) || this.defaultLayouts.length === 0) {
    setTimeout(() => this.openDefaultLayoutByQuery(query), 200);
    return;
  }

  // Find candidates by displayName/layoutName
  const scored = this.defaultLayouts.map(l => {
    const dn = this.normalizeStr(l.displayName);
    const ln = this.normalizeStr(l.layoutName);
    let score = 0;

    // simple scoring
    if (dn.includes(q)) score += 2;
    if (ln.includes(q)) score += 2;

    // keyword boosts
    if (q.includes('behavioral') && (dn.includes('behavior') || dn.includes('behaviour'))) score += 3;
    if (q.includes('fluid') && dn.includes('fluid')) score += 3;

    return { layout: l, score };
  }).sort((a,b) => b.score - a.score);

  const hit = scored[0] && scored[0].score > 0 ? scored[0].layout : null;
  if (!hit) {
    // Optionally, toast "No matching default layout found"
    console.warn('Tsmart: no default layout match for query:', query);
    return;
  }

  // Prefer “fake click” on the actual card so all existing handlers run identically
  requestAnimationFrame(() => {
    const sel = `.form-card[data-id="${hit.layoutName}"]`;
    const el = this.template.querySelector(sel);

    if (el) {
      el.click(); // triggers handleCloneFromDefaults via onclick binding
    } else {
      // Fallback: call handler with a synthetic event
      this.handleCloneFromDefaults({
        currentTarget: { dataset: { id: hit.layoutName } }
      });
    }
  });
}


 @track activeLandingTab = 'new';     // 'describe' | 'new' | 'pdf'

  // ---- Tabs (classes & handlers)
  get isDescribeSelected() { return this.activeLandingTab === 'describe'; }
  get isNewSelected()      { return this.activeLandingTab === 'new'; }
  get isPdfSelected()      { return this.activeLandingTab === 'pdf'; }

  get describeTabClass() { return `fillout-tab ${this.isDescribeSelected ? 'fillout-is-active' : ''}`; }
  get newTabClass()      { return `fillout-tab ${this.isNewSelected ? 'fillout-is-active' : ''}`; }
  get pdfTabClass()      { return `fillout-tab ${this.isPdfSelected ? 'fillout-is-active' : ''}`; }

  handleLandingTab = (e) => {
    this.activeLandingTab = e.currentTarget.dataset.tab;
  };


  isThinking = false;
  thinkTimer = null;
  _thinkingMsgId = null;

   qsCreateFluidIntake = () => this.quickStart('open default layout for Fluid Intake');
  qsCreatePrnMedication = () => this.quickStart('open default layout for PRN Medication');
  qsCreateShiftReport = () => this.quickStart('open default layout for Shift Report');
  qsCreateSleepSelfcare = () => this.quickStart('open default layout for Sleep and Selfcare');
  quickStart(utterance) {
    this.userInput = utterance;
    this.handleExecute();
  }
handleChange(e) {
    this.userInput = e.target.value;
  }
  handleKeydown(e) {
    if (e.key === "Enter") this.handleExecute();
  }
  addMessage(text, sender) {
    const cssClass = sender === "user" ? "message user-msg" : "message bot-msg";
    this.messages = [
      ...this.messages,
      { id: ++idCounter, text, sender, cssClass }
    ];
    setTimeout(() => this.scrollToBottom(), 0);
  }
  scrollToBottom() {
    const el = this.template.querySelector("[data-chat-window]");
    if (el) el.scrollTop = el.scrollHeight;
  }
  toast(title, message, variant = "info") {
    this.dispatchEvent(
      new ShowToastEvent({ title, message, variant, mode: "dismissable" })
    );
  }

  // ---------- JS-ONLY PARSER ----------
parseSentenceJS(sentence) {
    const result = { action: '', target: '', extras: {}, raw: sentence || '' };
    if (!sentence) return result;

    const s = sentence.trim();
    const lower = norm(s);

    // ===== 1) FORM detection (from JSON) =====
    const formQueries = [];
    if (this._botConfigLoaded) {
      const { forms = [], regex = {} } = this._botConfig;

      // 1a) Alias and label/layoutName hits
      for (const form of forms) {
        const terms = [form.label, form.layoutName, ...(form.aliases || [])];
        if (terms.some((t) => lower.includes(norm(t)))) {
          pushUnique(formQueries, form.label);
        }
      }

      // 1b) Regex patterns (generic "open ... form", etc.)
      const rxGeneric = regex.genericForm ? new RegExp(regex.genericForm, 'i') : null;
      const rxAny = regex.anyForm ? new RegExp(regex.anyForm, 'i') : null;
      const rxOr = regex.orForm ? new RegExp(regex.orForm, 'i') : null;

      const m1 = rxGeneric ? s.match(rxGeneric) : null;
      if (m1 && m1[1]) pushUnique(formQueries, m1[1]);

      const m2 = rxAny ? s.match(rxAny) : null;
      if (m2 && m2[1]) pushUnique(formQueries, m2[1]);

      const m3 = rxOr ? s.match(rxOr) : null;
      if (m3) {
        pushUnique(formQueries, m3[1]);
        pushUnique(formQueries, m3[2]);
      }

      if (formQueries.length) {
        result.action = 'open_default_layout';
        result.extras.formQueries = formQueries;
        result.extras.formQuery = formQueries[0];
        // NOTE: we intentionally short-circuit here so "create ticket" doesn't hijack a form request.
        return result;
      }
    }

    // ===== 2) ACTION detection (from JSON) =====
    if (this._botConfigLoaded) {
      const { actions = [] } = this._botConfig;
      for (const def of actions) {
        const aliases = def.aliases || [];
        if (aliases.some((a) => lower.includes(norm(a)))) {
          result.action = def.id;
          // merge any default extras (e.g., targetStatus true/false)
          if (def.extras) result.extras = { ...result.extras, ...def.extras };
          break;
        }
      }
    }

    // ===== 3) Parameter extraction (same as your original) =====
    const mTarget = s.match(/\bfor\s+([\w\-\s']{1,80})/i);
    if (mTarget) result.target = mTarget[1].trim();

    const mStatus = s.match(/\bstatus\s+([\w\-\s]{1,40})/i);
    if (mStatus) result.extras.status = mStatus[1].trim();

    const mOwner = s.match(/\bowner\s+([\w\-\s]{1,60})/i);
    if (mOwner) result.extras.owner = mOwner[1].trim();

    const mName = s.match(/\bname\s+([a-zA-Z][a-zA-Z\s']{1,60})/i);
    if (mName) result.extras.name = mName[1].trim();

    const mWhen = s.match(/\bwhen\s+([\w\-\s:]{1,60})/i);
    if (mWhen) result.extras.whenText = mWhen[1].trim();

    const mNote = s.match(/\bnote\s+(.+)$/i);
    if (mNote) result.extras.note = mNote[1].trim();

    // Module hints
    const mModule = s.match(/\bin\s+(hr|human\s+resources)\b/i);
    if (mModule) result.extras.module = 'Human Resources';

    // Name extraction fallbacks
    if (!result.extras.name) {
      const theName = s.match(/\bthe\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/);
      if (theName) result.extras.name = theName[1].trim();
    }
    if (!result.extras.name) {
      const capName = s.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/);
      if (capName) result.extras.name = capName[1].trim();
    }

    return result;
  }

  hasAny(haystack, needles) {
    return needles.some((n) => haystack.includes(n));
  }

  hasAny(haystack, needles) {
    return needles.some((n) => haystack.includes(n));
  }

    async loadBotConfig() {
    try {
      const res = await fetch(BOT_ACTIONS_CONFIG + '?v=1'); // bump v to bust cache after edits
      this._botConfig = await res.json();
      this._botConfigLoaded = true;
    } catch (e) {
      console.error('Failed to load bot-actions-config.json', e);
      this._botConfig = { forms: [], actions: [], regex: {} };
      this._botConfigLoaded = false;
    }
  }
     _botConfig;
  _botConfigLoaded = false;
  @track userInput = "";
  @track messages = [];
  isOpen = false;
  isFabHovered = false;
  @wire(MessageContext) messageContext;

  @track botInProgress = false;

   async handleExecute() {
    const input = (this.userInput || '').trim();
    if (!input || this._isHandling) return;

    // Show user's message immediately
    this.addMessage(input, 'user');
    this.userInput = '';
    this._isHandling = true;

    // Start thinking animation
    this.startThinking();

    // Wait 3.5s (realistic pause)
    await this.delay(3500);

    try {
      // Now actually parse + act
      const parsed = this.parseSentenceJS(input); // your existing JS parser
      const { action, target, extras = {} } = parsed || {};

      if (!action) {
        this.stopThinking();
        this.addMessage(
          `Tessa AI: I couldn't determine the action. Try another.`,
          'bot'
        );
        return;
      }

      // Special case: open default form layout (publish to channel AFTER delay)
      if (action === 'open_default_layout') {
        const query = (extras.formQuery || '').trim();
        const queries = Array.isArray(extras.formQueries) ? extras.formQueries : (query ? [query] : []);
        if (!query) {
          this.stopThinking();
          this.addMessage(
            `Bot: Tell me which form to open (e.g., “open Behavioral form” or “Fluid Intake form”).`,
            'bot'
          );
          return;
        }

        // remove thinking bubble, then give feedback + publish
        this.stopThinking();
        this.addMessage(`Bot: Looking for “${query}” in Design New Form…`, 'bot');

        publish(this.messageContext, BOT_ACTION_CHANNEL, {
          action: 'open_default_layout',
          query,
          queries
        });
        return;
      }

      // Route all other actions (your existing dispatcher)
      const ok = await this.routeAction(action, target, extras);
      this.stopThinking();

      if (!ok) {
        this.addMessage(
          `Bot: I recognize the action “${action}”, but it's not implemented yet.`,
          'bot'
        );
      }
    } catch (error) {
      console.error('Error in handleExecute:', error);
      this.stopThinking();
      this.addMessage(`Bot: Oops, something went wrong while processing your request.`, 'bot');
      this.toast?.('Error', error?.message || 'Unexpected error', 'error');
    } finally {
      this._isHandling = false;
    }
  }

  // --- Thinking helpers ------------------------------------------------------
  startThinking() {
    if (this.isThinking) return;
    this.isThinking = true;
    this._thinkingMsgId = this.addMessage({ type: 'thinking' }, 'bot', true);
  }

  stopThinking() {
    if (this.thinkTimer) {
      clearTimeout(this.thinkTimer);
      this.thinkTimer = null;
    }
    this.isThinking = false;
    if (this._thinkingMsgId) {
      this.messages = this.messages.filter(m => m.id !== this._thinkingMsgId);
      this._thinkingMsgId = null;
      this.scrollToBottom();
    }
  }

  delay(ms) {
    return new Promise(resolve => {
      this.thinkTimer = setTimeout(resolve, ms);
    });
  }

  // --- Messaging helpers -----------------------------------------------------
  addMessage(textOrObj, sender = 'bot', silent = false) {
    const isThinkingObj = typeof textOrObj === 'object' && textOrObj?.type === 'thinking';
    const text = isThinkingObj ? '' : textOrObj;
    const cssClass = isThinkingObj
      ? 'message bot-msg thinking'
      : sender === 'user'
      ? 'message user-msg'
      : 'message bot-msg';

    const id = ++idCounter;
    this.messages = [...this.messages, { id, text, sender, cssClass, isThinking: isThinkingObj }];

    if (!silent) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
    return id;
  }

  scrollToBottom() {
    const pane = this.template.querySelector('[data-chat-window]');
    if (pane) pane.scrollTop = pane.scrollHeight;
  }


  // ---------- Router (map intents -> JS methods) ----------
  async routeAction(action, target, extras) {
    const a = (action || "").toLowerCase();

    const handlers = {
      create_ticket: () => this.createTicket(target, extras),
      reset_password: () => this.resetPassword(target),
      submit_report: () => this.submitReport(target, extras),
      assign_owner: () => this.assignOwner(target, extras),
      update_status: () => this.updateStatus(target, extras),
      add_note: () => this.addNote(target, extras),
      schedule_meeting: () => this.scheduleMeeting(target, extras),
      generate_report: () => this.generateReport(target, extras),
      export_csv: () => this.exportCsv(target, extras),
      notify_user: () => this.notifyUser(target, extras),
      print_name_pdf_download: () => this.printNameToPdf(extras),

      // ✅ NEW handler for deactivate staff
      change_staff_status: () =>
        this.changeStaffStatusNavigate(
          extras?.name || target || "",
          extras?.module || "Human Resources",
          extras?.targetStatus
        )
    };

    const aliasMap = {
      create: "create_ticket",
      ticket_create: "create_ticket",
      password_reset: "reset_password",
      print_pdf: "print_name_pdf_download",
      download_pdf: "print_name_pdf_download"
    };

    const key = handlers[a] ? a : aliasMap[a];
    if (!key || !handlers[key]) return false;

    await handlers[key]();
    return true;
  }

  // ---------- 10 SAMPLE ACTION METHODS ----------
  async createTicket(target = "", extras = {}) {
    this.addMessage(
      `Bot: Creating ticket ${target ? "for " + target : ""}…`,
      "bot"
    );
    // TODO: call Apex to create ticket
    this.toast("Ticket", "Ticket created successfully", "success");
  }

  async resetPassword(userName = "") {
    this.addMessage(
      `Bot: Resetting password ${userName ? "for " + userName : ""}…`,
      "bot"
    );
    // TODO: call Apex to reset password
    this.toast("Password", "Password reset initiated", "success");
  }

  async submitReport(reportName = "", extras = {}) {
    this.addMessage(`Bot: Submitting report ${reportName || ""}…`, "bot");
    // TODO: call Apex/report API
    this.toast("Report", "Report submitted", "success");
  }

  async assignOwner(recordId = "", extras = {}) {
    const owner = extras.owner || "Unassigned";
    this.addMessage(
      `Bot: Assigning ${recordId || "record"} to ${owner}…`,
      "bot"
    );
    // TODO: Apex DML
    this.toast("Assign", "Owner updated", "success");
  }

  async updateStatus(recordId = "", extras = {}) {
    const status = extras.status || "In Progress";
    this.addMessage(
      `Bot: Updating ${recordId || "record"} status to ${status}…`,
      "bot"
    );
    // TODO: Apex DML
    this.toast("Status", "Status updated", "success");
  }

  async addNote(recordId = "", extras = {}) {
    const note = extras.note || "No note provided";
    this.addMessage(`Bot: Adding note to ${recordId || "record"}…`, "bot");
    // TODO: Apex to insert ContentNote
    this.toast("Note", "Note added", "success");
  }

  async scheduleMeeting(withWho = "", extras = {}) {
    const whenText = extras.whenText || "tomorrow 10 AM";
    this.addMessage(
      `Bot: Scheduling meeting with ${withWho || "someone"} at ${whenText}…`,
      "bot"
    );
    // TODO: Calendar integration
    this.toast("Meeting", "Meeting scheduled", "success");
  }

  async generateReport(name = "", extras = {}) {
    this.addMessage(`Bot: Generating report ${name || ""}…`, "bot");
    // TODO: Apex to generate report data
    this.toast("Report", "Report generated", "success");
  }

  async exportCsv(name = "", extras = {}) {
    const rows = [
      ["Id", "Name", "Status"],
      ["001xx000003", "Acme", "Active"],
      ["001xx000004", "Globex", "Prospect"]
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${(v + "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (name || "export") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    this.addMessage(`Bot: CSV exported.`, "bot");
    this.toast("Export", "CSV downloaded", "success");
  }

  // Only server call we keep: generate & download PDF
  async printNameToPdf(extras = {}) {
    const name =
      extras.name || this.extractNameFromLastUserMessage() || "Unknown";
    this.addMessage(`Bot: Generating PDF with name "${name}"…`, "bot");
    try {
      const base64Pdf = await generatePdf({ name });
      const byteChars = atob(base64Pdf || "");
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++)
        byteNumbers[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Name-${name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      this.addMessage(`Bot: PDF downloaded.`, "bot");
      this.toast("PDF", "PDF generated & downloaded", "success");
    } catch (e) {
      console.error(e);
      this.addMessage(`Bot: Failed to generate PDF.`, "bot");
      this.toast("PDF", "Failed to generate PDF", "error");
    }
  }

  // Helper to pull a simple "name" token from last user message (best-effort)
  extractNameFromLastUserMessage() {
    const last = [...this.messages].reverse().find((m) => m.sender === "user");
    if (!last) return null;
    const m = /name\s+([a-zA-Z][a-zA-Z\s'-]{1,40})/i.exec(last.text);
    return m ? m[1].trim() : null;
  }

  changeStaffStatusNavigate(name, module, targetStatus) {
    const cleanName = (name || "").trim();
    const actionWord = targetStatus ? "activate" : "deactivate";

    this.addMessage(
      `Bot: Navigating to ${module} and ${actionWord} ${cleanName || "the user"}…`,
      "bot"
    );

    try {
      publish(this.messageContext, BOT_ACTION_CHANNEL, {
        action: "change_staff_status",
        module,
        name: cleanName,
        targetStatus // true = activate, false = deactivate
      });
      this.toast(
        "Task Sent",
        `HR will ${actionWord} ${cleanName || "the user"}.`,
        "success"
      );
      return true;
    } catch (e) {
      console.error(e);
      this.toast("Error", `Failed to send ${actionWord} command.`, "error");
      return false;
    }
  }

  get showWelcome() {
  // Show the hero when there are no chat messages yet
  return !this.messages || this.messages.length === 0;
}
  handleBotActionMessage(message) {
    if (!message || !message.action) return;

    // 🔵 Overlay triggers
    if (message.action === "overlay_start") {
      this.startBotAction();
    }
    if (message.action === "overlay_end") {
      this.endBotAction();
    }
  }

  startBotAction() {
    this.botInProgress = true;
  }

  endBotAction() {
    this.botInProgress = false;
  }
    pdfJsReady = false;
  pdfArrayBuffer;                 // Uint8Array of the picked PDF
  pdfFileName = '';
  @track pdfLabels = [];          // [{id, text, selected, score}]
  showPdfModal = false;

  // Enable/disable buttons in UI
  get isExtractDisabled() { return !this.pdfArrayBuffer || !this.pdfJsReady; }
  get importDisabled()   { return !this.pdfLabels.some(l => l.selected); }

    handlePdfPick(evt) {
    const file = evt.target.files?.[0];
    if (!file) return;

    this.pdfFileName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.pdfArrayBuffer = new Uint8Array(reader.result); // keep as Uint8Array
    };
    reader.readAsArrayBuffer(file);
  }

normalizeLabelText(s) {
  if (!s) return '';
  return String(s)
    .replace(/\u00A0/g, ' ')   // NBSP -> space
    .replace(/[ \t]+:/g, ':')  // "Name :" -> "Name:"
    .replace(/\s+/g, ' ')
    .trim();
}


async handleExtractLabels() {
  if (!this.pdfArrayBuffer || !this.pdfJsReady) return;

  // eslint-disable-next-line no-undef
  const pdf = await window.pdfjsLib.getDocument({ data: this.pdfArrayBuffer }).promise;

  const segments = []; // { page, top, xStart, text }
  const LINE_GRANULARITY = 3; // px tolerance to bucket words into the same line

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1 });
    const pageHeight = Math.round(viewport.height);
    const content = await page.getTextContent();

    // Bucket items by quantized Y (line buckets)
    const buckets = new Map(); // key: `${p}:${yKey}` -> [{ x, text }]
    for (const item of content.items) {
      const raw = item.str;
      if (!raw) continue;
      const x = Math.round(item.transform[4]);   // left
      const y = item.transform[5];               // baseline Y (PDF origin bottom-left)
      const yKey = Math.round(y / LINE_GRANULARITY) * LINE_GRANULARITY;
      const key = `${p}:${yKey}`;
      const t = raw.trim();
      if (!t) continue;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push({ x, text: t });
    }

    // For each line bucket: split into multiple labels (each ending with ":")
    for (const [key, arr] of buckets.entries()) {
      arr.sort((a, b) => a.x - b.x);
      const [, yKeyStr] = key.split(':');
      const yKey = Number(yKeyStr);
      const top = pageHeight - yKey;

      let seg = '';           // accumulating text for current label
      let segXStart = null;   // leftmost x for current label

      for (const token of arr) {
        if (seg) seg += ' ' + token.text; else seg = token.text;
        if (segXStart == null) segXStart = token.x;

        const norm = this.normalizeLabelText(seg);

        // Flush a segment whenever it ends with ":" (keep it as a separate label)
        if (/:$/.test(norm)) {
          segments.push({ page: p, top, xStart: segXStart, text: norm });
          seg = '';
          segXStart = null;
        }
      }
      // If line ends without a trailing ":", we ignore the leftover (not a label)
    }
  }

  // Deduplicate case-insensitively (remove if you want duplicates kept across pages)
  const seen = new Set();
  const unique = [];
  for (const c of segments) {
    const k = c.text.toLowerCase();
    if (!seen.has(k)) { seen.add(k); unique.push(c); }
  }

  // Order: page ↑, top ↑ (true visual top→bottom), xStart ↑ (left→right within a line)
  unique.sort((a, b) => (a.page - b.page) || (a.top - b.top) || (a.xStart - b.xStart));

  // Build modal data
  this.pdfLabels = unique.slice(0, 300).map((c, i) => ({
    id: `lbl-${i}`,
    text: c.text,      // keep trailing ":" as requested
    selected: true,
    score: 10
  }));

  this.showPdfModal = true;
}


  // Simple heuristic for "label-like" text
  scoreLabel(s) {
    const t = (s || '').trim();
    if (!t) return 0;
    if (t.length > 100) return 0;                 // labels are short
    let score = 0;
    if (/[.:?]\s*$/.test(t)) score += 3;          // ends with ':' or '?'
    if (t.includes(':')) score += 2;              // has colon
    if (/_+|_{3,}/.test(t)) score += 2;           // blanks like "____"
    if (/^\d+[\).-\s]/.test(t)) score += 1;       // "1) Name"
    if (/\b(yes|no)\b/i.test(t)) score += 1;
    if (/^[A-Z][\w\s\/,&()'-]{2,}$/.test(t)) score += 1; // starts capital, sane chars
    if (t.split(' ').length <= 10) score += 1;    // concise
    return score;
  }

  // ====== Modal actions ======
  closePdfModal = () => { this.showPdfModal = false; };

  toggleSelectAll = (e) => {
    const checked = e.detail.checked;
    this.pdfLabels = this.pdfLabels.map(l => ({ ...l, selected: checked }));
  };

  clearSelection = () => {
    this.pdfLabels = this.pdfLabels.map(l => ({ ...l, selected: false }));
  };

  toggleOne = (e) => {
    const id = e.currentTarget.dataset.id;
    const checked = e.target.checked;
    this.pdfLabels = this.pdfLabels.map(l => (l.id === id ? { ...l, selected: checked } : l));
  };

importSelectedLabels = () => {
  console.groupCollapsed('📥 PDF Import → Selected Labels');
  try {
    const selected = (this.pdfLabels || []).filter(l => l.selected);
    console.log('✅ Selected count:', selected.length, 'of', (this.pdfLabels || []).length);

    const labels = selected.map(l => (l.text || '').replace(/:\s*$/, ''));
    if (!labels.length) {
      console.warn('⚠️ No labels selected. Closing modal.');
      this.showPdfModal = false;
      return;
    }

    // ✅ Ensure the builder view is active (unmount landing)
    if (!this.newDesign) {
      console.log('🧭 Switching to builder view before populate (5×1 baseline).');
      this.newDesign = true;
      if (typeof this.showLanding !== 'undefined') this.showLanding = false;

      // Baseline grid 5×1 as you requested
      this.currentCols = 1;
      this.tableRows = [];
      this.createTable(5, 1);
    }

    console.log('➡️ Sending labels to grid:', labels);
    this.populateGridWithLabels(labels);

    // Close modal after populate
    this.showPdfModal = false;
    console.log('✅ Modal closed.');
  } catch (e) {
    console.error('❌ importSelectedLabels error:', e);
  } finally {
    console.groupEnd();
  }
};


populateGridWithLabels(labels) {
  console.groupCollapsed('🧩 Grid Populate');
  const colsRequested = this.currentCols || 1;               // default 1
  const cols = Math.min(Math.max(1, colsRequested), 20);
  console.log('ℹ️ Columns requested:', colsRequested, '→ Using:', cols);

  try {
    // Ensure grid exists
    if (!this.tableRows || !this.tableRows.length) {
      console.log(`🆕 No existing grid. Creating baseline 5×${cols}…`);
      this.createTable(5, cols);
    } else {
      console.log('✅ Grid exists with rows:', this.tableRows.length);
    }

    // Harmonize row cell counts
    let fixedRows = 0;
    this.tableRows.forEach((row, idx) => {
      if (!row.cells) row.cells = [];
      if (row.cells.length < cols) {
        const need = cols - row.cells.length;
        console.warn(`⚠️ Row ${idx} has ${row.cells.length} cells; adding ${need} to match cols=${cols}.`);
        for (let i = row.cells.length; i < cols; i++) {
          row.cells.push({
            id: `cell-${idx}-${i}`,
            row: idx, col: i, field: null,
            colspan: 1, rowspan: 1, showMenu: false,
            style: 'border: 1px solid #ddd;',
            editKey: `cell-${idx}-${i}-edit`,
            deleteKey: `cell-${idx}-${i}-delete`
          });
        }
        fixedRows++;
      }
    });
    if (fixedRows) console.log('🔧 Harmonized columns on rows:', fixedRows);

    // Fill cells row-by-row
    let r = 0, c = 0;
    let rowsAdded = 0;
    let cellsFilled = 0;

    labels.forEach((text, idx) => {
      // Add a new row if needed
      if (!this.tableRows[r]) {
        const newRowIndex = this.tableRows.length;
        console.log(`➕ Adding row ${newRowIndex} for label #${idx + 1}:`, JSON.stringify(text));
        const newRow = { id: `row-${newRowIndex}`, cells: [] };
        for (let i = 0; i < cols; i++) {
          newRow.cells.push({
            id: `cell-${newRowIndex}-${i}`,
            row: newRowIndex, col: i, field: null,
            colspan: 1, rowspan: 1, showMenu: false,
            style: 'border: 1px solid #ddd;',
            editKey: `cell-${newRowIndex}-${i}-edit`,
            deleteKey: `cell-${newRowIndex}-${i}-delete`
          });
        }
        // reassign to trigger reactivity
        this.tableRows = [...this.tableRows, newRow];
        rowsAdded++;
      }

      // Safety: ensure target cell
      if (!this.tableRows[r].cells[c]) {
        console.warn(`⚠️ Missing cell at [${r}, ${c}] — creating.`);
        this.tableRows[r].cells[c] = {
          id: `cell-${r}-${c}`,
          row: r, col: c, field: null,
          colspan: 1, rowspan: 1, showMenu: false,
          style: 'border: 1px solid #ddd;',
          editKey: `cell-${r}-${c}-edit`,
          deleteKey: `cell-${r}-${c}-delete`
        };
      }

      const cell = this.tableRows[r].cells[c];
      if (cell.field) {
        console.warn(`↪️ Overwriting field at [${r}, ${c}] (${cell.field?.label || cell.field?.name || 'unnamed'}) with:`, JSON.stringify(text));
      } else {
        console.log(`🧷 Placing label at [${r}, ${c}]:`, JSON.stringify(text));
      }

      // Set field (mutates nested object)
      cell.field = { type: 'label', label: text };
      cellsFilled++;

      // advance pointer
      c++;
      if (c >= cols) { c = 0; r++; }
    });

    // Persist + force rerender for nested updates
    this.saveTableState?.();
    this.tableRows = JSON.parse(JSON.stringify(this.tableRows)); // <- ensures DOM re-renders

    console.log('✅ Populate summary → rowsAdded:', rowsAdded, 'cellsFilled:', cellsFilled, 'finalRows:', this.tableRows.length, 'cols:', cols);
  } catch (e) {
    console.error('❌ populateGridWithLabels error:', e);
  } finally {
    console.groupEnd();
  }
}

// handleHeaderChange(event) {
//   const key = event.target.dataset.field;       // "text" | "fontSize" | ...
//   const val = event.detail?.value ?? event.target.value;
//   if (!this.isHeader || !this.selectedField) return;

//   // update the selected header model
//   this.selectedField = { ...this.selectedField, [key]: val };
//   this.selectedField.inlineStyle = this.computeHeaderInlineStyle(this.selectedField);

//   // persist into the grid
//   if (this.currentCell?.field?.id === this.selectedField.id) {
//     this.currentCell.field = { ...this.selectedField };
//   }

//   // trigger rerender
//   this.tableRows = [...this.tableRows];
// }


// Single truthy gate used by the template
get isHeader() {
  return (
    this.isHeaderField === true ||
    this.selectedField?.type === 'header' ||
    this.selectedField?.dataType === 'Header'
  );
}

// Inspector preview style (from selection)
get headerPreviewStyle() {
  const h = this.selectedHeader;
  if (!h) return '';
  const size  = `${parseInt(h.fontSize, 10) || 24}px`;
  const weight = `${h.fontWeight || '600'}`;
  const align  = h.textAlign || 'left';
  const deco   = h.textDecoration || 'none';
  const color  = h.color || '#000000';
  return `font-size:${size}; font-weight:${weight}; text-align:${align}; text-decoration:${deco}; color:${color};`;
}


get selectedHeader() {
  if (!this.isHeader) {
    return { text: 'Section Title', fontSize: '24', fontWeight: '600', textAlign: 'left', textDecoration: 'none' };
  }
  const f = this.selectedField || {};
  return {
    text: f.text ?? 'Section Title',
    fontSize: f.fontSize ?? '24',
    fontWeight: f.fontWeight ?? '600',
    textAlign: f.textAlign ?? 'left',
    textDecoration: f.textDecoration ?? 'none',
    color:          f.color ?? '#000000'  
  };
}


// Defaults + inline style helpers (as you had)
createHeaderDefaults() {
  return {
    type: 'header',
    isHeader: true,
    text: 'Section Title',
    fontSize: '24',
    fontWeight: '600',
    textAlign: 'left',
    textDecoration: 'none',
    color: '#000000', 
    inlineStyle: ''
  };
}

computeHeaderInlineStyle(h) {
  return `font-size:${h.fontSize}px;` +
         `font-weight:${h.fontWeight};` +
         `text-align:${h.textAlign};` +
         `text-decoration:${h.textDecoration};`+ `color:${h.color || '#000000'};`;
}

handleHeaderChange(event) {
  console.group("🧩 Header Change Triggered");

  const key = event?.target?.dataset?.field;
  const val = event?.detail?.value ?? event?.target?.value;

  console.log("👉 Field Key:", key);
  console.log("👉 New Value:", val);

  if (!key) {
    console.warn("❌ Missing key");
    console.groupEnd();
    return;
  }

  if (!this.isHeader) {
    console.warn("❌ Not in header mode");
    console.groupEnd();
    return;
  }

  if (!this.selectedField) {
    console.warn("❌ No selectedField");
    console.groupEnd();
    return;
  }

  // --- update model ---
  this.selectedField = { ...this.selectedField, [key]: val };
  this.selectedField.inlineStyle = this.computeHeaderInlineStyle(this.selectedField);

  const after = { ...this.selectedField };

  console.log("✅ Updated selectedField:", after);

  // --- MAIN GRID ---
  const currentId = this.currentCell?.field?.id;
  console.log("📌 currentCell.field.id:", currentId);
  console.log("📌 selectedField.id:", after.id);

  if (currentId === after.id) {
    this.currentCell.field = { ...after };
    console.log("✅ Main grid updated");
  } else {
    console.log("⚠️ Main grid NOT updated (ID mismatch)");
  }

  // --- UPDATE INNER CELLS ---
  const selectedId = after.id;
  let matchFound = false;

  this.tableRows = this.tableRows.map((row, rIndex) => ({
    ...row,
    cells: row.cells.map((cell, cIndex) => {

      if (cell.field?.isTableBlock && cell.field.tableConfig) {

        console.log(`📦 Found TableBlock at [${rIndex}, ${cIndex}]`);

        const cfg = cell.field.tableConfig;

        const updatedInnerCells = (cfg.innerCells || []).map((innerRow, ir) => ({
          ...innerRow,
          cells: innerRow.cells.map((innerCell, ic) => {

            if (innerCell.field?.id === selectedId) {

              matchFound = true;

              console.log(`🎯 MATCH FOUND in innerCells [${ir}, ${ic}]`);
              console.log("👉 Before:", innerCell.field);
              console.log("👉 Applying:", after);

              return {
                ...innerCell,
                field: {
                  ...innerCell.field,
                  ...after
                }
              };
            }

            return innerCell;
          })
        }));

        return {
          ...cell,
          field: {
            ...cell.field,
            tableConfig: {
              ...cfg,
              innerCells: updatedInnerCells
            }
          }
        };
      }

      return cell;
    })
  }));

  if (!matchFound) {
    console.warn("❌ No matching innerCell found for update!");
  } else {
    console.log("✅ Inner cell updated successfully");
  }

  // 🔥 CALL PREVIEW
  console.log("🔄 Calling updateLiveTablePreview...");
  this.updateLiveTablePreview();

  // --- trigger rerender ---
  this.tableRows = [...this.tableRows];

  console.log("🔄 tableRows reassigned");

  // 🔍 VERIFY AFTER UPDATE
  let verify = false;

  this.tableRows.forEach(row => {
    row.cells.forEach(cell => {
      if (cell.field?.isTableBlock) {
        cell.field.tableConfig.innerCells.forEach(r => {
          r.cells.forEach(c => {
            if (c.field?.id === selectedId) {
              verify = true;
              console.log("🔎 AFTER UPDATE FIELD:", c.field);
            }
          });
        });
      }
    });
  });

  if (!verify) {
    console.warn("❌ Updated field NOT found after update!");
  }

  console.groupEnd();
}

// Header controls
fontSizeOptions = [
  { label: '12 px', value: '12' },
  { label: '14 px', value: '14' },
  { label: '16 px', value: '16' },
  { label: '18 px', value: '18' },
  { label: '20 px', value: '20' },
  { label: '24 px', value: '24' },
  { label: '28 px', value: '28' },
  { label: '32 px', value: '32' },
  { label: '40 px', value: '40' },
  { label: '48 px', value: '48' }
];

fontWeightOptions = [
  { label: 'Light (300)', value: '300' },
  { label: 'Normal (400)', value: '400' },
  { label: 'Medium (500)', value: '500' },
  { label: 'Semibold (600)', value: '600' },
  { label: 'Bold (700)', value: '700' },
  { label: 'Extra Bold (800)', value: '800' },
  { label: 'Black (900)', value: '900' }
];

textAlignOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' }
];

textDecorationOptions = [
  { label: 'None', value: 'none' },
  { label: 'Underline', value: 'underline' },
  { label: 'Strikethrough', value: 'line-through' },
  { label: 'Overline', value: 'overline' }
];
// get showNormal() {
//   return !this.isHeader;   // false when Header is selected
// }

get showNormal() {
  return this.currentFieldType !== "Header";
}


async uploadFormJsonToAws(finalRows, folderType, formTitle) {
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

const key = `IncidentRegister/${this.orgid}/${dateStr}/${folderType}/${fileName}.json`;


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



//////////////////////////////////New



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
    console.log('🟢 loadStaffList called:');

    getStaffRecords({ orgId: this.orgid })
        .then(data => {

            console.log('🟢 Raw staff data:', data);

            this.staffList = data.map(staff => {

                const grantedForms = staff.Accessible_Forms__c
                    ? staff.Accessible_Forms__c.split(';')
                    : [];

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
                    isSelected: false
                };
            });

            const uniqueFacilityNames = [
                ...new Set(this.staffList.map(s => s.facilityName).filter(Boolean))
            ];

            this.staffFacilityOptions = [
    { label: 'All Facilities', value: '' }, // 👈 NEW
    ...uniqueFacilityNames.map(name => ({
        label: name,
        value: name
    }))
];


            this.filteredStaffList = [...this.staffList];

            this.totalStaffRecords = this.staffList.length;

            this.pageNumberStaff = 1;

            this.applyStaffFilters();


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

        this.loadStaffList();

    } catch (error) {

        console.error('❌ Grant error', error);

        this.showToast('Error', error.body?.message || 'Grant failed','error');
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
lastPublishedFormId;

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
async uploadFormJsonToAws(finalRows, folderType, formTitle) {
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

const key = `CustomisableForms/${this.orgid}/${dateStr}/${folderType}/${fileName}.json`;


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

handleHardResetClick() {
  this.isHardResetModalOpen = true;
}
handleHardResetConfirm() {
  this.isHardResetConfirmed = true;
  this.isHardResetModalOpen = false;

  this.handleReset();
}

handleHardResetCancel() {
  this.isHardResetModalOpen = false;
}





hydrateRadioField(field) {

  // ---------- SAFE CLONE ----------
  const options = Array.isArray(field?.radioOptions)
    ? JSON.parse(JSON.stringify(field.radioOptions))
    : [];

  // ---------- SUBTYPE NORMALIZER ----------
  const normalizeSubType = (type) => {
    if (!type) return "";

    const map = {
      text: "Text Field",
      number: "Number Field",
      date: "Date Field",
      time: "Time Field",
      dropdown: "Dropdown Field",
      radio: "Radio Button"
    };

    return map[type.toLowerCase()] || type;
  };

  // ---------- BUILD UI MODEL ----------
  this.radioSubInputs = options.map(opt => {

    const normalizedType = normalizeSubType(opt.subType);

    const subValues =
      Array.isArray(opt.values)
        ? opt.values.join("\n")
        : "";

    const isDropdownType =
      normalizedType === "Dropdown Field";

    const isRadioType =
      normalizedType === "Radio Button";

    return {
      // main option label
      option: opt.optionLabel || "",

      hasSubInput: !!opt.hasSubInput,

      // dependent question
      subQuestion: opt.subQuestion || "",
      subType: normalizedType,

      // ---------- UI FLAGS ----------
      hasValues: isDropdownType || isRadioType,
      isDropdownType,
      isRadioType,

      // textarea binding
      subValues,

      usePredefinedOptions:
        !!opt.usePredefinedOptions,

      selectedPredefined:
        opt.selectedPredefined || "",

      inputTypeToggleValue:
        opt.usePredefinedOptions
          ? "predefined"
          : "manual"
    };
  });

  // ---------- MAIN OPTIONS TEXTAREA ----------
  this.mainRadioOptions =
    this.radioSubInputs
      .map(sub => sub.option)
      .filter(Boolean)
      .join("\n");

  // ---------- LEGACY SUPPORT ----------
  this.radioOptions = this.radioSubInputs;
}


















@track showInsertTableModal = false;

@track tableRowsInput = 3;
@track tableColsInput = 3;

@track hasTableHeader = true;
@track hasRowLabels = false;

@track columnHeaderInputs = [];
@track rowLabelInputs = [];

@track showTableName = false;
@track tableName = '';
@track tableColumnWidths = [];




@track tableConfig = {
  rows: 3,
  cols: 3,
  hasHeader: true,
  hasRowLabels: false,
  headers: [],
  rowNames: []
};


openInsertTableModal() {
  this.initTableModalInputs();
  this.showInsertTableModal = true;
}

closeInsertTableModal() {
  this.showInsertTableModal = false;
}

handleTableRowsChange(e) {
  this.tableRowsInput = Number(e.target.value);
  this.buildRowInputs();
  this.updateLiveTablePreview(); 
}

handleTableColsChange(e) {
  this.tableColsInput = Number(e.target.value);
  this.buildHeaderInputs();
  this.updateLiveTablePreview(); 
}


handleRowLabelToggle(e) {
  const value = e.target.checked;

  this.hasRowLabels = value;

  // 🔥 SYNC CONFIG
  if (this.currentCell?.field?.isTableBlock) {
    this.currentCell.field.tableConfig.hasRowLabels = value;

    // 🔥 CLEAR CONFIG DATA when toggled OFF
    if (!value) {
      this.currentCell.field.tableConfig.rowNames = [];
    }
  }

  // 🔥 CLEAR INPUTS when OFF (correct behavior)
  this.buildRowInputs();

  this.updateLiveTablePreview(this.currentCell);
}

handleHeaderToggle(e) {
  const value = e.target.checked;

  this.hasTableHeader = value;

  if (this.currentCell?.field?.isTableBlock) {
    this.currentCell.field.tableConfig.hasHeader = value;

    if (!value) {
      this.currentCell.field.tableConfig.columns = [];
    }
  }

  this.buildHeaderInputs();

  this.updateLiveTablePreview(this.currentCell);
}

handleHeaderNameChange(e) {
  const key = e.target.dataset.key;

  this.columnHeaderInputs =
    this.columnHeaderInputs.map(h =>
      h.key === key ? { ...h, value: e.target.value } : h
    );
    this.updateLiveTablePreview(); 
}

handleRowNameChange(e) {
  const key = e.target.dataset.key;

  this.rowLabelInputs =
    this.rowLabelInputs.map(r =>
      r.key === key ? { ...r, value: e.target.value } : r
    );
    this.updateLiveTablePreview(); 
}


confirmInsertTable() {
  const cfg = {
    rows: this.tableRowsInput,
    cols: this.tableColsInput,
    hasHeader: this.hasTableHeader,
    hasRowLabels: this.hasRowLabels,
    headers: this.columnHeaderInputs.map(h => h.value),
    rowNames: this.rowLabelInputs.map(r => r.value)
  };

  this.showInsertTableModal = false;

  this.insertTableIntoGrid(
    this.currentCell.row,
    this.currentCell.col,
    cfg
  );
}

initTableModalInputs() {
  this.buildHeaderInputs();
  this.buildRowInputs();
}

buildHeaderInputs() {
  if (!this.hasTableHeader) {
    this.columnHeaderInputs = [];
    return;
  }

  this.columnHeaderInputs = Array.from(
    { length: this.tableColsInput },
    (_, i) => ({
      key: `hdr-${i}`,
      index: i,
      label: `Column ${i + 1}`,
      value: ''
    })
  );
}


buildRowInputs() {
  if (!this.hasRowLabels) {
    this.rowLabelInputs = []; // ✅ correct (clear)
    return;
  }

  this.rowLabelInputs = Array.from(
    { length: Number(this.tableRowsInput) },
    (_, i) => ({
      key: `row-${i}`,
      index: i,
      label: `Row ${i + 1}`,
      value: '' // ✅ fresh input
    })
  );
}



ensureGridSize(minRows, minCols) {
  while (this.tableRows.length < minRows) {
    this.addRowInternal();
  }

  this.tableRows.forEach((row, rIndex) => {
    while (row.cells.length < minCols) {
      row.cells.push(this.createEmptyCell(rIndex, row.cells.length));
    }
  });
}
placeHeaderCell(row, col, label, groupId) {
  const cell = this.tableRows[row].cells[col];

  cell.field = {
    id: `field-${Date.now()}-${Math.random()}`,
    dataType: "Header",
    label,
    text: label,
    isHeader: true,
    groupId
  };
}

placeBlankCell(row, col, groupId) {
  const cell = this.tableRows[row].cells[col];

  cell.field = {
    id: `field-${Date.now()}-${Math.random()}`,
    dataType: "Blank",
    label: "",
    isBlank: true,
    groupId
  };
}

createEmptyCell(rowIndex, colIndex) {
  return {
    id: `cell-${rowIndex}-${colIndex}-${Date.now()}`,
    row: rowIndex,
    col: colIndex,
    colspan: 1,
    rowspan: 1,
    field: null,
    showMenu: false,
    style: "border: 1px solid #ddd;",
    editKey: `cell-${rowIndex}-${colIndex}-edit`,
    deleteKey: `cell-${rowIndex}-${colIndex}-delete`
  };
}
addRowInternal() {
  const rowIndex = this.tableRows.length;

  const newRow = {
    id: `row-${rowIndex}`,
    cells: []
  };

  const cols =
    this.tableRows[0]?.cells?.length || 1;

  for (let c = 0; c < cols; c++) {
    newRow.cells.push(this.createEmptyCell(rowIndex, c));
  }

  this.tableRows = [...this.tableRows, newRow];
}

resetFieldFlags() {
  this.isTextField = false;
  this.isNumberField = false;
  this.isDateField = false;
  this.isDropDownField = false;
  this.isTimeField = false;
  this.isUploadFileField = false;
  this.isRadioButtonField = false;
  this.isHeaderField = false;
  this.isTableBlock = false;
}
initTablePopupInputs() {
  this.buildHeaderInputs();
  this.buildRowInputs();
}

buildHeaderInputs() {
  if (!this.hasTableHeader) {
    this.columnHeaderInputs = [];
    return;
  }

  this.columnHeaderInputs = Array.from(
    { length: this.tableColsInput },
    (_, i) => ({
      key: `hdr-${i}`,
      label: `Column ${i + 1}`,
      value: ''
    })
  );
}


updateLiveTablePreview(cellOverride) {

  // 🔥 DO NOT depend on isTableBlock flag
  if (!this.tableRows || !this.tableRows.length) {
    return;
  }

  // 🔍 FIND TABLE BLOCK CELL
  const cell = cellOverride || this.currentCell;

if (!cell || !cell.field?.isTableBlock) {
  console.warn("⚠️ No active table block found");
  return;
}

  const liveTableBlock = cell.field;
  const prevCfg = JSON.parse(
  JSON.stringify(liveTableBlock?.tableConfig || {})
);

  // 🔥 Identify if THIS table is being edited
const isEditingThisTable =
  this.currentCell &&
  this.currentCell.field?.id === liveTableBlock.id;

  // 🔥 SAFE FALLBACKS (CRITICAL FIX)
  const safeRows = this.tableRowsInput || prevCfg.rows || 1;
  const safeCols = this.tableColsInput || prevCfg.cols || 1;

  const hasRowLabels = prevCfg.hasRowLabels ?? this.hasRowLabels ?? false;

  const logicalCount =
    hasRowLabels
      ? safeCols + 1
      : safeCols;

  const baseWidth = Math.floor(100 / logicalCount);

  let widths =
    this.tableColumnWidths?.length === logicalCount
      ? [...this.tableColumnWidths]
      : Array.from({ length: logicalCount }, (_, i) => ({
          key: i,
          width: baseWidth
        }));

  let total =
    widths.reduce((s, c) => s + Number(c.width || 0), 0);

  if (total !== 100 && widths.length) {

    const scale = 100 / total;

    widths = widths.map((c, i) => ({
      ...c,
      width:
        i === widths.length - 1
          ? 100 -
            widths.slice(0, -1).reduce(
              (s, x) => s + Math.round(x.width * scale),
              0
            )
          : Math.round(c.width * scale)
    }));
  }

  this.tableColumnWidths = [...widths];

  /* -----------------------------
     BUILD COLUMNS
  ------------------------------ */

const columns =
  widths.map((c, i) => {

    const isRowLabel = hasRowLabels && i === 0;

    // 🔥 Get live column safely
    const liveCol =
      liveTableBlock.tableConfig.columns?.[i];

    return {
      key: i,
      isRowLabel,

      dataIndex:
        isRowLabel
          ? null
          : hasRowLabels
            ? i - 1
            : i,

      // 🔥 FINAL FIX (handles row-label column properly)
      header:
        liveCol?.header
        ??
        (isRowLabel ? "Row Label" : ""),

      width: c.width,
      style: `width:${c.width}%`,

      isEditable: liveTableBlock.isEditMode === true,

      thClass:
        isRowLabel
          ? "row-label-col"
          : "header-col"
    };
  });

  /* -----------------------------
     ROW LABELS
  ------------------------------ */

  const rowNames =
  Array.from(
    { length: Number(safeRows) },
    (_, i) => ({
      key: `row-${i}`,

      // ✅ SINGLE SOURCE OF TRUTH
      value:
  liveTableBlock.tableConfig.rowNames?.[i]?.value ?? ""
    })
  );

  /* -----------------------------
     INNER CELLS (FULL FIX)
  ------------------------------ */

  const needRebuild =
    !prevCfg.innerCells ||
    prevCfg.rows !== safeRows ||
    prevCfg.cols !== safeCols;

  const liveInnerCells =
    liveTableBlock?.tableConfig?.innerCells || [];

  let baseInnerCells;

  if (needRebuild) {

    const newCells = this.createInnerCells(
      Number(safeRows),
      Number(safeCols)
    );

    baseInnerCells = newCells.map((row, rIndex) => ({
      ...row,
      cells: row.cells.map((cell, cIndex) => {

        const oldField =
          liveInnerCells?.[rIndex]?.cells?.[cIndex]?.field;

        return {
          ...cell,
          field: oldField ? { ...oldField } : null
        };
      })
    }));

  } else {

    baseInnerCells = liveInnerCells.map(row => ({
      ...row,
      cells: row.cells.map(cell => ({
        ...cell,
        field: cell.field ? { ...cell.field } : null
      }))
    }));

  }

  /* -----------------------------
     AUTO-FILL (SAFE)
  ------------------------------ */

  let innerCells = baseInnerCells.map((row) => {

    const newCells = row.cells.map((cell) => {

      if (this.autoFillEmptyCells) {

        if (!cell.field) {

          const newField = this.createDefaultField(this.autoFillType);

          if (newField) {
            return {
              ...cell,
              field: {
                ...newField,
                isAutoGenerated: true
              }
            };
          }
        }

        return {
          ...cell,
          field: cell.field ? { ...cell.field } : null
        };
      }

      else {

        if (cell.field?.isAutoGenerated && !cell.field?.isHeader) {
          return {
            ...cell,
            field: null
          };
        }

        return {
          ...cell,
          field: cell.field ? { ...cell.field } : null
        };
      }

    });

    return {
      ...row,
      cells: newCells
    };

  });

  /* -----------------------------
     MAP FOR RENDER
  ------------------------------ */

  innerCells = innerCells.map((row, rIndex) => {

  const newRenderCells = row.cells.map((c, cIndex) => ({
    ...c,
    parentId: cell.id,
    rowIndex: rIndex,
    colIndex: cIndex,
    field: c.field ? { ...c.field } : null
  }));

  return {
    key: row.key || `row-${rIndex}`, // 🔥 ensure unique identity
index: rIndex,
    // 🔥 ALWAYS recompute label
    rowLabel: liveTableBlock.tableConfig.rowNames?.[rIndex]?.value || "",

    // 🔥 CRITICAL FIX: use isEditMode ONLY
    isEditable: liveTableBlock.isEditMode === true,

    // 🔥 BREAK reference (important for LWC reactivity)
    cells: [...row.cells],

    renderCells: newRenderCells
  };
});

  /* -----------------------------
     FINAL CONFIG
  ------------------------------ */

  const newConfig = {


  rows: safeRows,
  cols: safeCols,

  hasHeader: this.hasTableHeader ?? prevCfg.hasHeader ?? false,
  hasRowLabels,
  showTableName: this.showTableName ?? prevCfg.showTableName ?? false,
  tableName: this.tableName ?? prevCfg.tableName ?? "",

  columns: columns,

  rowNames: rowNames,

  cellValues: prevCfg.cellValues || {},

  autoFillEmptyCells: this.autoFillEmptyCells,
  autoFillType: this.autoFillType,

  innerCells
};

  cell.field = {
    ...cell.field,
    label: this.fieldLabel,
    isEditMode: liveTableBlock.isEditMode === true,
    tableConfig: newConfig
  };

  this.tableRows = [...this.tableRows];
}



handleInlineTableEdit(e) {

  const type = e.target.dataset.type;

  const rowIndex =
    e.target.dataset.row !== undefined
      ? Number(e.target.dataset.row)
      : null;

  const colIndex =
    e.target.dataset.col !== undefined
      ? Number(e.target.dataset.col)
      : null;

  const cell =
    this.tableRows[this.currentCell.row]
      .cells[this.currentCell.col];

  const cfg = cell.field.tableConfig;

  // ──────────────────────────────
  // 🔵 COLUMN HEADERS
  // ──────────────────────────────
 if (type === 'header' && colIndex !== null) {

  const hasRowLabels = cfg.hasRowLabels;

  // 🔥 FIX INDEX SHIFT
  const actualIndex =
    hasRowLabels ? colIndex : colIndex;

  // ⚠️ IMPORTANT: DO NOT SHIFT HERE
  // Because your columns array ALREADY includes row label column

  if (cfg.columns[actualIndex]) {
    cfg.columns[actualIndex].header = e.target.value;
  }

  console.log("🧪 HEADER FIX →", {
    colIndex,
    actualIndex,
    value: e.target.value,
    headers: cfg.columns.map(c => c.header)
  });
}

  // ──────────────────────────────
  // 🔵 ROW LABEL TEXT
  // ──────────────────────────────
  if (type === 'row' && rowIndex !== null) {

    // 🔥 ensure rowNames exists
    if (!cfg.rowNames) {
      cfg.rowNames = [];
    }

    if (!cfg.rowNames[rowIndex]) {
      cfg.rowNames[rowIndex] = {
        key: `row-${rowIndex}`,
        value: ''
      };
    }

    cfg.rowNames[rowIndex].value = e.target.value;

    // 🔥 sync preview row label
    if (cfg.innerCells?.[rowIndex]) {
      cfg.innerCells[rowIndex].rowLabel = e.target.value;
    }

    console.log("🧪 ROW LABEL EDIT →", {
      rowIndex,
      value: e.target.value,
      rowNames: JSON.parse(JSON.stringify(cfg.rowNames))
    });
  }

  // ──────────────────────────────
  // 🔵 TABLE NAME
  // ──────────────────────────────
  if (type === 'tableName') {
    cfg.tableName = e.target.value;
    this.tableName = e.target.value;

    console.log("🧪 TABLE NAME →", e.target.value);
  }

  // ──────────────────────────────
  // 🔵 DATA CELL VALUES (future use)
  // ──────────────────────────────
  if (type === 'cell' && rowIndex !== null && colIndex !== null) {

    if (!cfg.cellValues) {
      cfg.cellValues = {};
    }

    cfg.cellValues[`${rowIndex}-${colIndex}`] =
      e.target.value;

    console.log("🧪 CELL VALUE →", {
      rowIndex,
      colIndex,
      value: e.target.value
    });
  }

  // 🔥 force rerender (LWC reactivity)
  this.tableRows = [...this.tableRows];
}

buildWidthInputs() {
  const base = Math.floor(100 / this.tableColsInput);

  if (!this.tableColumnWidths.length) {
    this.tableColumnWidths = Array.from(
      { length: this.tableColsInput },
      (_, i) => ({
        key: i,
        label: `Column ${i + 1}`,
        width: base
      })
    );
  }

  // ensure size sync
  if (this.tableColumnWidths.length !== this.tableColsInput) {
    const old = this.tableColumnWidths;

    this.tableColumnWidths = Array.from(
      { length: this.tableColsInput },
      (_, i) => ({
        key: i,
        label: `Column ${i + 1}`,
        width: old[i]?.width ?? base
      })
    );
  }
}
handleColumnWidthChange(e) {

  const changedIndex =
    Number(e.target.dataset.col);

  let newWidth =
    Number(e.target.value);

  // ─────────────────────────────
  // 🛑 BASIC VALIDATION
  // ─────────────────────────────

  if (
    isNaN(newWidth) ||
    newWidth <= 0 ||
    newWidth > 100
  ) {
    this.showToast(
      'Invalid Width',
      'Column width must be between 1 and 100.',
      'error'
    );
    return;
  }

  const cols =
    [...this.tableColumnWidths];

  const otherIndexes =
    cols
      .map((_, i) => i)
      .filter(i => i !== changedIndex);

  const otherTotal =
    otherIndexes.reduce(
      (s, i) => s + cols[i].width,
      0
    );

  // ─────────────────────────────
  // 🛑 WOULD EXCEED 100?
  // ─────────────────────────────

  if (newWidth >= 100 && otherIndexes.length) {
    this.showToast(
      'Invalid Width',
      'Total column width must be 100%.',
      'error'
    );
    return;
  }

  const remaining =
    100 - newWidth;

  if (remaining < 0) {
    this.showToast(
      'Invalid Width',
      'Total column width cannot exceed 100%.',
      'error'
    );
    return;
  }

  // ─────────────────────────────
  // 🔵 DISTRIBUTE REMAINING
  // ─────────────────────────────

  const even =
    Math.floor(
      remaining / otherIndexes.length
    );

  const nextCols =
    cols.map((c, i) => {

      if (i === changedIndex) {
        return { ...c, width: newWidth };
      }

      return {
        ...c,
        width: even
      };
    });

  // rounding fix
  const used =
    nextCols.reduce(
      (s, c) => s + c.width,
      0
    );

  if (used !== 100) {

    const fixIndex =
      otherIndexes[0];

    nextCols[fixIndex] = {
      ...nextCols[fixIndex],
      width:
        nextCols[fixIndex].width +
        (100 - used)
    };
  }

  // ─────────────────────────────
  // ✅ SAVE + REFRESH
  // ─────────────────────────────

  this.tableColumnWidths =
    [...nextCols];

  this.updateLiveTablePreview();
}



  // ─────────────────────────────
  // ✅ Copy/Paste Functionality
  // ─────────────────────────────
// ALT selection state
isAltCopyModeActive = false;

// selected placeholders
altCopySelectedFieldIds = new Set();

// copied data
altCopyClipboardBuffer = [];

// paste target
altCopyPasteTargetCell = null;

handleAltCopyKeyDown(event) {

  if (event.altKey) {
    this.isAltCopyModeActive = true;
    console.log("ALT COPY MODE ENABLED");
  }

  if (event.key === "Escape") {
    this.clearAltCopySelection();
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "c") {
    this.handleAltCopy();
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "v") {
    this.handleAltPaste();
  }

}

handleAltCopyKeyUp(event) {

  if (!event.altKey) {
    this.isAltCopyModeActive = false;
    console.log("ALT released");
  }

}

handleAltPlaceholderClick(event) {

  if (!this.isAltCopyModeActive) return;

  const fieldId = event.currentTarget.dataset.id;

  console.log("Selecting placeholder:", fieldId);

  if (this.altCopySelectedFieldIds.has(fieldId)) {
    this.altCopySelectedFieldIds.delete(fieldId);
  } else {
    this.altCopySelectedFieldIds.add(fieldId);
  }

  this.highlightAltSelectedPlaceholders();

}

highlightAltSelectedPlaceholders() {

  this.tableRows.forEach(row => {

    row.cells.forEach(cell => {

      if (!cell.field) {
  cell.dynamicCellClass = "table-cell";
  return;
}

      if (this.altCopySelectedFieldIds.has(cell.field.id)) {
        cell.dynamicCellClass = "table-cell alt-copy-selected";
      } else {
        cell.dynamicCellClass = "table-cell";
      }

    });

  });

  this.tableRows = [...this.tableRows];

}



handleAltCopy() {

  if (!this.altCopySelectedFieldIds.size) {
    console.warn("Nothing selected to copy");
    return;
  }

  const copied = [];

  this.tableRows.forEach(row => {

    row.cells.forEach(cell => {

      if (cell.field && this.altCopySelectedFieldIds.has(cell.field.id)) {

        copied.push({
          field: JSON.parse(JSON.stringify(cell.field)),
          row: cell.row,
          col: cell.col
        });

      }

    });

  });

  if (!copied.length) return;

  // normalize layout (top-left becomes 0,0)
  const minRow = Math.min(...copied.map(c => c.row));
  const minCol = Math.min(...copied.map(c => c.col));

  copied.forEach(c => {
    c.row -= minRow;
    c.col -= minCol;
  });

  this.altCopyClipboardBuffer = copied;

  console.log("Copied grid:", copied);

}
handlePasteTargetClick(event) {

  if (!this.altCopyClipboardBuffer.length) return;

  const cellId = event.currentTarget.dataset.id;

  const cell = this.getCellById(cellId);

  if (!cell) return;

  console.log("Paste target:", cellId);

  this.altCopyPasteTargetCell = cell;

}

handleAltPaste() {

  if (!this.altCopyClipboardBuffer.length) {
    console.warn("Clipboard empty");
    return;
  }

  if (!this.altCopyPasteTargetCell) {
    console.warn("No paste target selected");
    return;
  }

  const baseRow = this.altCopyPasteTargetCell.row;
  const baseCol = this.altCopyPasteTargetCell.col;

  // 🔴 validate space before pasting
  for (const item of this.altCopyClipboardBuffer) {

    const targetRow = baseRow + item.row;
    const targetCol = baseCol + item.col;

    const row = this.tableRows[targetRow];

    const fieldLabel = item.field?.label || item.field?.dataType || "Field";

    // row doesn't exist
    if (!row) {
      this.showPasteError(`${fieldLabel} cannot be pasted — row ${targetRow + 1} does not exist.`);
      return;
    }

    const cell = row.cells.find(c => c.col === targetCol);

    // column doesn't exist
    if (!cell) {
      this.showPasteError(`${fieldLabel} cannot be pasted — column ${targetCol + 1} does not exist.`);
      return;
    }

    // cell already occupied
    if (cell.field) {
      this.showPasteError(`${fieldLabel} cannot be pasted — target cell already contains "${cell.field.label}".`);
      return;
    }

  }

  // 🟢 paste if validation passed
  this.altCopyClipboardBuffer.forEach(item => {

    const targetRow = baseRow + item.row;
    const targetCol = baseCol + item.col;

    const cell = this.tableRows[targetRow].cells.find(c => c.col === targetCol);

    // const newField = JSON.parse(JSON.stringify(item.field));

    // newField.id = "field-" + Math.random().toString(36).substr(2,9);

    let newField = JSON.parse(JSON.stringify(item.field));

    if (newField.isTableBlock) {
      newField = this.regenerateTableBlockIds(newField);
    } else {
      newField.id = "field-" + Math.random().toString(36).substr(2,9);
    }

    cell.field = newField;

  });

  // this.tableRows = [...this.tableRows];
  this.tableRows = JSON.parse(JSON.stringify(this.tableRows));

  console.log("Grid paste completed");

  this.clearAltCopySelection();
}
clearAltCopySelection() {

  console.log("Clearing selection");

  this.altCopySelectedFieldIds.clear();

  this.altCopyClipboardBuffer = [];

  this.altCopyPasteTargetCell = null;

  // clear merge selection too
  this.selectedCells = [];

  this.tableRows.forEach(row => {
    row.cells.forEach(cell => {
      cell.dynamicCellClass = "table-cell";
    });
  });

  this.tableRows = [...this.tableRows];

}

regenerateTableBlockIds(field) {

  // 🔥 new root id
  field.id = "field-" + Math.random().toString(36).substr(2, 9);

  const cfg = field.tableConfig;

  if (!cfg) return field;

  /* =========================
     🔹 COLUMNS
  ========================= */
  if (Array.isArray(cfg.columns)) {
    cfg.columns = cfg.columns.map((col, index) => ({
      ...col,
      key: index // safe reindex
    }));
  }

  /* =========================
     🔹 ROW NAMES
  ========================= */
  if (Array.isArray(cfg.rowNames)) {
    cfg.rowNames = cfg.rowNames.map((row, index) => ({
      ...row,
      key: `row-${index}`
    }));
  }

  /* =========================
     🔹 INNER CELLS
  ========================= */
  if (Array.isArray(cfg.innerCells)) {

    cfg.innerCells = cfg.innerCells.map((row, rIndex) => ({

      ...row,
      key: `row-${rIndex}`,
      index: rIndex,

      cells: row.cells.map((cell, cIndex) => {

        const newCellId = `inner-${rIndex}-${cIndex}-${Math.random().toString(36).substr(2,5)}`;

        return {
          ...cell,
          id: newCellId,

          field: cell.field
            ? this.regenerateNestedField(cell.field)
            : null
        };

      })

    }));
  }

  return field;
}
regenerateNestedField(field) {
  return {
    ...field,
    id: "field-" + Math.random().toString(36).substr(2, 9)
  };
}

showPasteError(message) {

  this.dispatchEvent(
    new ShowToastEvent({
      title: "Paste Failed",
      message: message,
      variant: "error"
    })
  );

}
handleRichTextChange(value) {

    this.richTextContent = value;

    console.log("✏️ RichText updated:", value);

    // update grid preview live
    if (this.currentCell && this.currentCell.field) {

        this.currentCell.field.richTextContent = value;

        // trigger re-render
        this.tableRows = [...this.tableRows];

    }
}
richTextFormats = [
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "indent",
    "align",
    "link",
    "image",
    "clean"
];


initializeQuillEditors() {

console.log("🟡 initializeQuillEditors() called");

const editor = this.template.querySelector('[data-id="quilleditor"]');

console.log("🔍 Searching for Quill container...");

if (!editor) {
    console.warn("❌ Quill container NOT FOUND in DOM");
    return;
}

console.log("✅ Quill container found:", editor);

if (editor.dataset.initialized) {
    console.log("⚠️ Quill already initialized, skipping...");
    return;
}

try {

    console.log("🚀 Creating new Quill instance...");

      const quill = new Quill(editor, {
      theme: 'snow',
      placeholder: 'Enter rich text...',
      modules: {
          toolbar: [
              [{ font: [] }],
              [{ size: ['small', false, 'large', 'huge'] }],
              [{ header: [1, 2, 3, 4, 5, 6, false] }],

              ['bold', 'italic', 'underline', 'strike'],

              [{ color: [] }, { background: [] }],

              [{ script: 'sub' }, { script: 'super' }],

              [{ list: 'ordered' }, { list: 'bullet' }],
              [{ indent: '-1' }, { indent: '+1' }],

              [{ direction: 'rtl' }],

              [{ align: [] }],

              ['link', 'image'],

              ['clean']
          ]
      }
  });

    console.log("✅ Quill instance created successfully");

    editor.dataset.initialized = true;

    quill.on('text-change', () => {

    const html = quill.root.innerHTML;

    this.handleRichTextChange(html);

});

    if(!this.quillInstances){
        this.quillInstances = {};
    }

    this.quillInstances['richTextEditor'] = quill;

    console.log("📌 Quill instance stored in quillInstances");

} catch(error){

    console.error("🔥 Error while initializing Quill:", error);

}

}








createInnerCells(rows, cols) {

  console.log("🧱 createInnerCells called", rows, cols);

  const grid = [];

  for (let r = 0; r < rows; r++) {

    const row = {
      index: r,
      cells: []
    };

    for (let c = 0; c < cols; c++) {

      const cell = {
        id: `inner-${r}-${c}-${Date.now()}`,
        row: r,
        col: c,
        field: null,
        showMenu:false
      };

      row.cells.push(cell);

    }

    grid.push(row);
  }

  console.log("🧱 Generated inner grid:", JSON.parse(JSON.stringify(grid)));

  return grid;
}

ensureInnerCells(field) {

    if (!field || !field.isTableBlock) return;

    const cfg = field.tableConfig;

    if (!cfg.innerCells) {

        cfg.innerCells = this.createInnerCells(
            cfg.rows || 3,
            cfg.cols || 3
        );

    }

}

rebuildRenderCells(field) {

    const cfg = field?.tableConfig;

    if (!cfg) return;

    /* Restore grid only if missing */
    if (!Array.isArray(cfg.innerCells) || cfg.innerCells.length === 0) {

        console.warn("⚠️ innerCells missing. Restoring from saved config.");

        cfg.innerCells = this.createInnerCells(
            Number(cfg.rows || 0),
            Number(cfg.cols || 0)
        );

    }

    cfg.innerCells.forEach((row, rIndex) => {

        /* 🔥 ADD THIS: inject rowLabel from rowNames */
        if (cfg.rowNames && cfg.rowNames[rIndex]) {
            row.rowLabel = cfg.rowNames[rIndex].value;
        }

        row.renderCells = (row.cells || []).map((cell, cIndex) => ({

            ...cell,
            parentId: field.id,
            rowIndex: rIndex,
            colIndex: cIndex

        }));

    });

}
handleInnerDragOver(event){
event.preventDefault();
event.currentTarget.classList.add("drag-hover");
}

handleInnerDragLeave(event){
event.currentTarget.classList.remove("drag-hover");
}

createInnerField(type) {

    const flags = this.getTypeFlags(type);

    return {
        id: 'field-' + Math.random().toString(36).substring(2),
        dataType: type,
        label: type,
        previewOptions: [],
        ...flags
    };

}

findCellById(cellId) {

    for (const row of this.tableRows) {

        for (const cell of row.cells) {

            // ================= MAIN GRID CELL =================
            if (cell.id === cellId) {
                return cell;
            }

            // ================= INNER TABLE CELLS =================
            if (cell.field?.isTableBlock) {

                const innerRows = cell.field.tableConfig?.innerCells || [];

                for (const innerRow of innerRows) {

                    for (const innerCell of innerRow.cells) {

                        if (innerCell.id === cellId) {
                            return innerCell;
                        }

                    }

                }

            }

        }

    }

    return null;

}


handleInnerDrop(event) {

    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget;

    if (!target) {
        console.warn("❌ No drop target found");
        return;
    }

    target.classList.remove("drag-hover");

    if (this.draggingFieldType === "Table Block") {

        this.showToast(
            "Error",
            "Table Block cannot be dropped inside another Table Block.",
            "error"
        );

        return;
    }

     if (this.draggingFieldType === "Blank") {

        this.showToast(
            "Error",
            "Blank cannot be placed inside a Table Block.",
            "error"
        );

        return;
    }

    const parentId = target.dataset.parent;
    const row = parseInt(target.dataset.row, 10);
    const col = parseInt(target.dataset.col, 10);

    console.group("📥 handleInnerDrop");
    console.log("Parent cell:", parentId);
    console.log("Row:", row);
    console.log("Col:", col);

    const parentCell = this.findCellById(parentId);

    if (!parentCell || !parentCell.field?.tableConfig) {

        console.warn("❌ Parent table cell not found");
        console.groupEnd();
        return;

    }

    const tableConfig = parentCell.field.tableConfig;

    if (!tableConfig.innerCells ||
        !tableConfig.innerCells[row] ||
        !tableConfig.innerCells[row].cells[col]) {

        console.warn("❌ Inner cell not found");
        console.groupEnd();
        return;

    }

    const innerCell = tableConfig.innerCells[row].cells[col];

    console.log("Target innerCell:", innerCell);

    // allow replacing an existing field
    if (innerCell.field) {
        console.log("🔁 Replacing existing field:", innerCell.field);
    }

    this.currentCell = innerCell;

    const originalGetCell = this.getCellById;

    // temporarily override lookup so handleDrop uses the inner cell
    this.getCellById = () => innerCell;

    try {

        this.handleDrop(event);

        // rebuild computed renderCells used by the template
        this.rebuildRenderCells(parentCell.field);

        // trigger LWC reactivity
        this.tableRows = [...this.tableRows];

        console.log("✅ Inner drop successful");

    } catch (error) {

        console.error("❌ Inner drop failed:", error);

    } finally {

        this.getCellById = originalGetCell;

        console.groupEnd();

    }

}

@track autoFillEmptyCells = false;
@track autoFillType = 'Text Field';

autoFillOptions = [
    { label: 'Text Field', value: 'Text Field' },
    { label: 'Number Field', value: 'Number Field' },
    { label: 'Checkbox Field', value: 'Checkbox Field' }
];

handleAutoFillToggle(event) {
    this.autoFillEmptyCells = event.target.checked;

    this.updateLiveTablePreview(); // 🔥 direct call
}

handleAutoFillTypeChange(event) {
    this.autoFillType = event.detail.value;

    this.updateLiveTablePreview(); // 🔥 direct call
}


createDefaultField(type) {

  const base = {
    id: `field-${Date.now()}-${Math.random()}`,
    label: 'AutoFill',
    isRequired: false,
    comments: '',
    isDraft: false,

    // 🔥 REQUIRED FLAGS (VERY IMPORTANT)
    isText: false,
    isNumber: false,
    isDate: false,
    isTime: false,
    isDropdown: false,
    isCheckbox: false,
    isRadio: false,
    isUpload: false,
    isHeader: false,
    isTableBlock: false,
    isSignature: false,
    isRichTextDisplay: false,

    previewOptions: []
  };

  switch (type) {

    case 'Text Field':
      return {
        ...base,
        dataType: 'Text Field',
        isText: true,

        selectedTextFieldOption: '',
        alphaNumericLength: '',
        onlyAlphabetsLength: '',
        isRichTextInput: false
      };

    case 'Number Field':
      return {
        ...base,
        dataType: 'Number Field',
        isNumber: true,

        selectedNumberFieldOption: 'defaultNumber',
        decimalValue: '',
        contactNumberDigits: ''
      };

    case 'Checkbox Field':
      return {
        ...base,
        dataType: 'Checkbox Field',
        isCheckbox: true
      };

    default:
      return null;
  }
}



@track dynamicFormRecordId;
@track dynamicFormGroupId;
@track dynamicFormVersionLabel;
@track isVersionEditFlowActive = false;


getCurrentLayoutState() {
  return JSON.stringify({
    tableRows: this.tableRows,
    layoutFields: this.layoutFields,
    selectedFormType: this.selectedFormType
  });
}


// async handlePublish() {

//   if (this.isLoading) {
//     console.warn("⏳ Publish already in progress");
//     return;
//   }

//   this.isLoading = true;

//   console.log("🚀 ====== PUBLISH STARTED ======");
//   console.log("🧾 Form Title:", this.formTitle);
//   console.log("👥 Audience:", this.audience);
//   console.log("📦 Form Type:", this.selectedFormType);

//   try {

//     // ===============================
//     // ✅ VALIDATION
//     // ===============================
//     if (!this.formTitle || !this.selectedFormType) {
//       console.warn("⚠️ Validation failed");
//       this.showToast("Error", "All required fields must be filled.", "error");
//       return;
//     }

//     // ===============================
//     // 🔥 PREPARE TABLE DATA
//     // ===============================
//     console.log("🧱 Preparing table rows...");
//     console.log("📊 Total rows before processing:", this.tableRows?.length);

//     const filteredTableRows = [];
//     const occupiedCells = new Set();

//     this.tableRows.forEach((row, rowIndex) => {

//       const filteredCells = row.cells
//         .map((cell) => {

//           const key = `${cell.row}-${cell.col}`;
//           if (occupiedCells.has(key)) return null;

//           if (cell.rowspan > 1) {
//             for (let i = 1; i < cell.rowspan; i++) {
//               occupiedCells.add(`${cell.row + i}-${cell.col}`);
//             }
//           }

//           return {
//             ...cell,
//             field: this.sanitizeFieldForPersist(cell.field)
//           };

//         })
//         .filter((c) => c !== null);

//       filteredTableRows.push({
//         ...row,
//         cells: filteredCells
//       });

//     });

//     console.log("✅ Processed rows count:", filteredTableRows.length);

//     // ===============================
//     // 🔥 BUILD FULL LAYOUT OBJECT (NEW)
//     // ===============================
//     const layoutObj = {
//       tableRows: filteredTableRows,
//       layoutFields: this.layoutFields,
//       selectedFormType: this.selectedFormType,
//       selectedModuleType: this.selectedModuleType,
//       audience: this.audience
//     };

//     console.log("📦 Final layoutObj for state tracking:", layoutObj);

//     // ===============================
//     // 🔥 AWS UPLOAD
//     // ===============================
//     console.log("☁️ Uploading JSON to AWS...");

//     const awsMeta = await this.uploadFormJsonToAws(
//       filteredTableRows,
//       "PublishedForms"
//     );

//     console.log("✅ AWS upload complete:", awsMeta);

//     // ===============================
//     // 🔥 VERSION CONTEXT DEBUG
//     // ===============================
//     console.log("🧬 Version Context BEFORE SAVE:");
//     console.log("   dynamicFormRecordId:", this.dynamicFormRecordId);
//     console.log("   dynamicFormGroupId:", this.dynamicFormGroupId);
//     console.log("   dynamicFormVersionLabel:", this.dynamicFormVersionLabel);
//     console.log("   isEditFlow (derived):", !!this.dynamicFormGroupId);

//     // ===============================
//     // 🔥 SAVE WITH VERSION
//     // ===============================
//     console.log("💾 Saving form with versioning...");

//     const result = await saveFormWithVersion({
//       recordId: this.dynamicFormRecordId || null,
//       formName: this.formTitle,
//       formJson: JSON.stringify(awsMeta),
//       formType: this.selectedFormType,
//       orgId: this.orgid,
//       audience: this.audience,
//       formGroupId: this.dynamicFormGroupId,
//       isVersionEditFlow: !!this.dynamicFormGroupId 
//     });

//     // ===============================
//     // 🔥 UPDATE VERSION STATE
//     // ===============================
//     this.dynamicFormRecordId = result.recordId;
//     this.dynamicFormGroupId = result.formGroupId;
//     this.dynamicFormVersionLabel = result.versionLabel;

//     console.log("✅ SAVE SUCCESS");
//     console.log("📌 New Record ID:", result.recordId);
//     console.log("🧬 Group ID:", result.formGroupId);
//     console.log("🔢 Version:", result.versionLabel);

//     // ===============================
//     // 🔥 SAVE STATE (CRITICAL FIX)
//     // ===============================
//     this.lastSavedState = JSON.stringify(layoutObj);
//     this.hasChanges = false;

//     console.log("💾 State synced after publish");
//     console.log("🧠 lastSavedState updated");

//     // ===============================
//     // 🔥 SUCCESS TOAST
//     // ===============================
//     this.showToast(
//       "Success",
//       `Form published as ${result.versionLabel}`,
//       "success"
//     );

//     this.isVersionEditFlowActive = true;
//     this.publishTempalte = false;

//     this.isUnsaved = false;
//     this.hasChanges = false;
//     this.isResetState = true;
//     this.lastSavedState = this.getCurrentLayoutState();
//     this.isFormSaved = true;

// console.log("🧪 AFTER PUBLISH isFormSaved:", this.isFormSaved);

//   } catch (error) {

//     console.error("❌ ====== PUBLISH FAILED ======");
//     console.error("Error object:", error);
//     console.error("Error message:", error?.body?.message);

//     this.showToast(
//       "Error",
//       error?.body?.message || "Failed to publish form",
//       "error"
//     );

//   } finally {

//     console.log("🏁 ====== PUBLISH ENDED ======");
//     this.isLoading = false;
//   }
// }

async handlePublish() {

  if (this.isLoading) {
    console.warn("⏳ Publish already in progress");
    return;
  }

  this.isLoading = true;

  console.log("🚀 ====== PUBLISH STARTED ======");
  console.log("🧾 Form Title:", this.formTitle);
  console.log("👥 Audience:", this.audience);
  console.log("📦 Form Type:", this.selectedFormType);

  try {

    // ===============================
    // ✅ VALIDATION
    // ===============================
    if (!this.formTitle || !this.selectedFormType) {
      console.warn("⚠️ Validation failed");
      this.showToast("Error", "All required fields must be filled.", "error");
      return;
    }

    // ===============================
    // 🔥 PREPARE TABLE DATA (RESTORED + FIXED)
    // ===============================
    console.log("🧱 Preparing table rows...");
    console.log("📊 Total rows before processing:", this.tableRows?.length);

    const filteredTableRows = [];
    const occupiedCells = new Set();

    this.tableRows.forEach((row) => {

      // 🔥 restore merged-cell logic
      const hasMergedCell = row.cells.some(
        (cell) => cell.col === 0 && cell.colspan === 2
      );

      const filteredCells = row.cells
        .filter((cell) => {
          if (hasMergedCell) return cell.col === 0;
          return true;
        })
        .map((cell) => {

          const key = `${cell.row}-${cell.col}`;
          if (occupiedCells.has(key)) return null;

          // handle rowspan
          if (cell.rowspan > 1) {
            for (let i = 1; i < cell.rowspan; i++) {
              occupiedCells.add(`${cell.row + i}-${cell.col}`);
            }
          }

          return {
            ...cell,
            field: this.sanitizeFieldForPersist(cell.field),
            colspan: hasMergedCell ? 2 : cell.colspan
          };

        })
        .filter((c) => c !== null);

      filteredTableRows.push({
        ...row,
        cells: filteredCells
      });

    });

    console.log("✅ Processed rows count:", filteredTableRows.length);

    // ===============================
    // 🔥 APPLY INCIDENT DEFAULT LOGIC (CRITICAL FIX)
    // ===============================
    const finalRowsToSave =
      this.selectedFormType === "Incident Register"
        ? this.prependDefaultRowsIfIncident(filteredTableRows)
        : filteredTableRows;

    console.log("📋 Final rows after Incident logic:", finalRowsToSave);

    // ===============================
    // 🔥 BUILD FULL LAYOUT OBJECT (UPDATED)
    // ===============================
    const layoutObj = {
      tableRows: finalRowsToSave,
      layoutFields: this.layoutFields,
      selectedFormType: this.selectedFormType,
      selectedModuleType: this.selectedModuleType,
      audience: this.audience
    };

    console.log("📦 Final layoutObj for state tracking:", layoutObj);

    // ===============================
    // 🔥 AWS UPLOAD (UPDATED)
    // ===============================
    console.log("☁️ Uploading JSON to AWS...");

    const awsMeta = await this.uploadFormJsonToAws(
      finalRowsToSave,
      "PublishedForms"
    );

    console.log("✅ AWS upload complete:", awsMeta);

    // ===============================
    // 🔥 VERSION CONTEXT DEBUG
    // ===============================
    console.log("🧬 Version Context BEFORE SAVE:");
    console.log("   dynamicFormRecordId:", this.dynamicFormRecordId);
    console.log("   dynamicFormGroupId:", this.dynamicFormGroupId);
    console.log("   dynamicFormVersionLabel:", this.dynamicFormVersionLabel);
    console.log("   isEditFlow:", !!this.dynamicFormGroupId);

    // ===============================
    // 🔥 SAVE WITH VERSION
    // ===============================
    console.log("💾 Saving form with versioning...");

    const result = await saveFormWithVersion({
      recordId: this.dynamicFormRecordId || null,
      formName: this.formTitle,
      formJson: JSON.stringify(awsMeta),
      formType: this.selectedFormType,
      orgId: this.orgid,
      audience: this.audience,
      formGroupId: this.dynamicFormGroupId,
      isVersionEditFlow: !!this.dynamicFormGroupId
    });

    // ===============================
    // 🔥 UPDATE VERSION STATE
    // ===============================
    this.dynamicFormRecordId = result.recordId;
    this.dynamicFormGroupId = result.formGroupId;
    this.dynamicFormVersionLabel = result.versionLabel;

    console.log("✅ SAVE SUCCESS");
    console.log("📌 Record ID:", result.recordId);
    console.log("🧬 Group ID:", result.formGroupId);
    console.log("🔢 Version:", result.versionLabel);

    // ===============================
    // 🔥 SAVE STATE (FIXED CLEANLY)
    // ===============================
    this.lastSavedState = JSON.stringify(layoutObj);
    this.hasChanges = false;
    this.isUnsaved = false;
    this.isResetState = true;
    this.isFormSaved = true;
    this.isVersionEditFlowActive = true;
    this.publishTempalte = false;

    console.log("💾 State synced after publish");

    // ===============================
    // 🔥 SUCCESS TOAST
    // ===============================
    this.showToast(
      "Success",
      `Form published as ${result.versionLabel}`,
      "success"
    );

    console.log("🧪 AFTER PUBLISH isFormSaved:", this.isFormSaved);

      // ===============================
    // 🔥 GRANT ACCESS MODAL (RESTORED)
    // ===============================
    if (this.openGrantAfterPublish) {
      console.log("👉 Opening Grant Access modal after publish");

      // Use result.recordId from saveFormWithVersion (new versioned API)
      this.lastPublishedFormId = result?.recordId || result || null;

      this.formsToGrant = this.lastPublishedFormId
        ? [this.lastPublishedFormId]
        : [];

      this.selectedPublishedFormIds = new Set(this.formsToGrant);

      this.isGrantAccessPopupOpen = true;

      this.loadStaffList();

      // Reset the flag so subsequent plain publishes don't re-open the modal
      this.openGrantAfterPublish = false;
    }

  } catch (error) {

    console.error("❌ ====== PUBLISH FAILED ======");
    console.error("Error:", error);

    this.showToast(
      "Error",
      error?.body?.message || "Failed to publish form",
      "error"
    );

  } finally {

    console.log("🏁 ====== PUBLISH ENDED ======");
    this.isLoading = false;
  }
}


}