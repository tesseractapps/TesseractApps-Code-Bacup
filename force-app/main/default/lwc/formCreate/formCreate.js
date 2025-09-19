import { LightningElement, api, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import sendEmailWithCustomBody from '@salesforce/apex/EmailController.sendEmailWithCustomBody';
import saveLayout from '@salesforce/apex/LayoutController.saveLayout';
import getLayoutData from '@salesforce/apex/LayoutController.getLayoutData';
import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';
import { wire } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import LAYOUT_MESSAGE_CHANNEL from '@salesforce/messageChannel/LayoutMessageChannel__c';
import getCurrentUserName from '@salesforce/apex/UserController.getCurrentUserName';
import My_Resource from "@salesforce/resourceUrl/myResource";
import saveForm from '@salesforce/apex/FormController.saveForm';
import NEW_FORM_REDIRECT_CHANNEL from '@salesforce/messageChannel/NewFormRedirectChannel__c';
import getAllLayouts from '@salesforce/apex/LayoutController.getAllLayouts';
import getDefaultFormLayout from '@salesforce/apex/LayoutController.getDefaultFormLayout';
import StaticForms from '@salesforce/resourceUrl/Static_Forms';

const FORM_IMAGE_1 = `${StaticForms}/form1.png`;
const FORM_IMAGE_2 = `${StaticForms}/form2.png`;

const formImages = [FORM_IMAGE_1, FORM_IMAGE_2];
export default class DragDropComponent extends NavigationMixin(LightningElement) {
    formicon = My_Resource + '/myResource/images/CustomisableFormsIcon.png';
    layoutId;
    subscription = null;
    @api orgid = '';
    @api layoutId
    @wire(MessageContext) messageContext;
    pageRef(pageRef) {
        if (pageRef && pageRef.state.c__layoutId) {
            this.loadLayoutById(pageRef.state.c__layoutId);
        }
    }
    @track dataTypes = [
        { id: '1', label: 'Text Field' },
        { id: '2', label: 'Number Field' },
        { id: '3', label: 'Date Field' },
        { id: '4', label: 'Time Field' },
        { id: '5', label: 'Checkbox Field' },
        { id: '6', label: 'Dropdown Field' },
        { id: '7', label: 'Blank' },
        { id: '8', label: 'Upload File' },
        { id: '9', label: 'Radio Button' },

    ];
    @track formTypeOptions = [
        { label: 'Behavioral', value: 'Behavioral' },
        { label: 'Medication', value: 'Medication' },
        { label: 'PRN Medication', value: 'PRN Medication' },
        { label: 'Fluid Intake', value: 'Fluid Intake' },
        { label: 'Sleep and Selfcare', value: 'Sleep and Selfcare' },
        { label: 'Weekly Blood Glucose', value: 'Weekly Blood Glucose' },
        { label: 'Bowel Movement', value: 'Bowel Movement' },
        { label: 'General Weekly', value: 'General Weekly' },
        { label: 'Activity Chart', value: 'Activity Chart' },
        { label: 'Shift Report', value: 'Shift Report' },
        { label: 'Incident Register', value: 'Incident Register' },
        { label: 'Other', value: 'Other' },
        { label: 'Custom New Form', value: 'Custom New Form' } 
    ];

    get defaultFormType() {
    return 'Custom New Form';
}
    
    get filteredFormTypeOptions() {
    let baseOptions;

    if (this.selectedModuleType === 'Customisable Form') {
        baseOptions = this.formTypeOptions.filter(opt => opt.value !== 'Incident Register');
    } else if (this.selectedModuleType === 'Incident Register') {
        baseOptions = this.formTypeOptions.filter(opt => opt.value === 'Incident Register');
    } else {
        baseOptions = this.formTypeOptions;
    }

    // Add `selected` property
    return baseOptions.map(opt => {
        return {
            ...opt,
            selected: opt.value === this.defaultFormType
        };
    });
}


    
    
    @track showFormTypeModal = false;
    @track customFormTypeInput = '';
    @track tableRows = [];
    @track formTitle = '';
    @track selectedCells = [];
    @track isPreviewMode = false;
    @track showPopup = false;
    @track fieldLabel = '';
    @track isMandatory = false;
    @track comments = '';
    @track showHeaderPopup = false;
    @track layoutFields = [];
    @track selectedHeaderFields = [];
    @track selectedFormType = '';
    @track isFormTypeSelected = false;
    @track isPreviewEnabled = false;
    @track isViewingLayouts = false;
    @track layoutFields = [];
    @api layoutData;
    @track layoutData;
    @track senderName = '';
    @track isUnsaved = false;
    @track showConfirmationPopup = false;
    @track isViewingLayouts = false;
    @track lastSavedState = null;
    @track hasChanges = false; 
    @track isResetState = true;
    @track isUploadFileField = false;
    // @track selectedModuleType = '';
    @track selectedModuleType = 'Customisable Form';
    @track showFormTypeDropdown = true;
    @track defaultLayouts = [];
 

    html2canvasLoaded = false;
    jsPDFLoaded = false;
    
    currentCell = null;
    tableHistory = [];

    @track selectedTextFieldOption = '';
    @track isAlphaNumericEnabled = false;
    @track isOnlyAlphabetsEnabled = false;
    @track isTextAreaEnabled = false;
    
    @track isAlphaNumericDisabled = true;
    @track isOnlyAlphabetsDisabled = true;
    @track isTextAreaDisabled = true;
    @track alphaNumericLength = '';
    @track onlyAlphabetsLength = '';
    @track selectedOption = '';


    @track selectedNumberFieldOption = ''; // Track the selected option for Number Field
    @track decimalValue = '';              // Value for Currency option's decimal input
    @track contactNumberDigits = ''; 

    @track isCaptureDisabled = true; // Initially disabled
    @track isSendDisabled = true;   // Initially disabled

    @track newDesign = false;
    

    // Define options for specific fields
@track textFieldOptions = [
    { label: 'Alpha Numeric', value: 'alphaNumeric' },
    { label: 'Only Alphabets', value: 'onlyAlphabets' },
    { label: 'Text Area (Max 255 Characters)', value: 'textArea' },
    { label: 'Rich Text', value: 'richText' }
];

@track numberFieldOptions = [
    { label: 'Currency', value: 'currency' },
    { label: 'Contact Number', value: 'contactNumber' },
    { label: 'Default Number', value: 'defaultNumber' },
];

@track decimalOptions = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
];

@track selectedDateFieldOption = '';  // Track the selected option for Date Field
    @track selectedDateFormat = '';       // Selected format for Date View

    // Date format options
    dateFormatOptions = [
        { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
        { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
        { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' }
    ];

@track dropDownOptions = [
    { label: 'Multi-select Picklist', value: 'multiSelect' },
    { label: 'Single-select Picklist', value: 'singleSelect' },
];
@track predefinedListType = ''; 
@track predefinedOptions = [
    { label: 'Participant', value: 'Participant' },
    { label: 'Facility', value: 'Facility' },
    { label: 'Staff', value: 'Staff' }
];

// Track field type conditions
@track isTextField = false;
@track isNumberField = false;
@track isDateField = false;
@track isDropDownField = false;
@track isRadioButtonField = false;
@track radioOptions = ''; // For input values (newline-separated)


// Track specific field values
@track isAlphaNumeric = false;
@track isOnlyAlphabets = false;
@track isTextArea = false;
@track isCurrency = false;
@track isContactNumber = false;
@track dropDownValues = '';

@track isTimeField = false;
@track is12HourFormat = false;  // To track whether 12-hour format is selected
@track timeDisplayFormat = '';  // To hold selected display format
@track timeFormat = ''; // Tracks either '12' or '24'

get isDragEnabled() {
    return (
        this.formTitle.trim().length > 0 &&
        this.selectedModuleType.trim().length > 0 &&
        this.selectedFormType.trim().length > 0
    );
}


timeFormatOptions = [
    { label: '12 Hour', value: '12' },
    { label: '24 Hour', value: '24' }
];

// Define options for time display format
timeDisplayFormatOptions = [
    { label: 'H:MM', value: 'H:MM' },
    { label: 'HH:MM', value: 'HH:MM' },
    { label: 'HH:MM:SS', value: 'HH:MM:SS' }
];

@wire(getCurrentUserName)
    wiredUserName({ error, data }) {
        if (data) {
            this.senderName = data; // Store the user name
        } else if (error) {
            console.error('Error fetching user name:', error);
        }
    }
    get captureButtonClass() {
        return this.isPreviewEnabled ? 'lightning-button active' : 'lightning-button inactive';
    }

    get sendButtonClass() {
        // Ensures the button is active when both conditions are met
        return this.selectedFormType && this.isPreviewEnabled ? 'lightning-button active' : 'lightning-button inactive';
    }
    
    get isSendDisabled() {
        const titleValid = this.formTitle && this.formTitle.trim().length > 0;
        const formTypeValid = this.selectedFormType && this.selectedFormType.trim().length > 0;
        return !(titleValid && formTypeValid && this.isPreviewEnabled);
    }
    
    
    
    get isCaptureDisabled() {
        return !this.isPreviewEnabled;
    }

   

    get isAlphaNumericEnabled() {
        return this.selectedOption === 'alphaNumeric';
    }

    get isOnlyAlphabetsEnabled() {
        return this.selectedOption === 'onlyAlphabets';
    }

    get isTextAreaEnabled() {
        return this.selectedOption === 'textArea';
    }

    // Getters for conditional rendering
    get isAlphaNumericSelected() {
        return this.selectedOption === 'alphaNumeric';
    }

    get isOnlyAlphabetsSelected() {
        return this.selectedOption === 'onlyAlphabets';
    }

    get isTextAreaSelected() {
        return this.selectedOption === 'textArea';
    }

    // Getters for the disabled state (negation of the selected state)
    get isAlphaNumericDisabled() {
        return this.selectedOption !== 'alphaNumeric';
    }

    get isOnlyAlphabetsDisabled() {
        return this.selectedOption !== 'onlyAlphabets';
    }

    get isTextAreaDisabled() {
        return this.selectedOption !== 'textArea';
    }
    get isRichTextSelected() {
        return this.selectedOption === 'richText';
    }
    

    // Getters for visibility and enablement based on selected option
    get isCurrencySelected() {
        return this.selectedNumberFieldOption === 'currency';
    }

    get isContactNumberSelected() {
        return this.selectedNumberFieldOption === 'contactNumber';
    }

    get isDefaultNumberSelected() {
        return this.selectedNumberFieldOption === 'defaultNumber';
    }

    // Getters for negated (disabled) conditions
    get isCurrencyDisabled() {
        return !this.isCurrencySelected;
    }

    get isContactNumberDisabled() {
        return !this.isContactNumberSelected;
    }

    get isDateViewSelected() {
        return this.selectedDateFieldOption === 'dateView';
    }

    get is12HourSelected() {
        return this.timeFormat === '12';
    }
    
    get is24HourSelected() {
        return this.timeFormat === '24';
    }
    get isPredefinedListSelected() {
        return this.selectedDropdownOption === 'predefinedList';
    }
    handleModuleTypeChange(event) {
        this.selectedModuleType = event.target.value;
    
        // Show dropdown for customizable forms only
        this.showFormTypeDropdown = this.selectedModuleType === 'Customisable Form';
    
        if (this.selectedModuleType === 'Incident Register') {
            this.selectedFormType = 'Incident Register';
        } else {
            this.selectedFormType = '';
        }
    }

    get isDefaultModuleSelected() {
        return this.selectedModuleType === '';
    }
    
    get isCustomizableSelected() {
        return this.selectedModuleType === 'Customisable Form';
    }
    
    get isIncidentSelected() {
        return this.selectedModuleType === 'Incident Register';
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
            const previewToggle = this.template.querySelector('.preview-toggle');
            if (previewToggle) {
                previewToggle.checked = this.isPreviewEnabled;
            }
        });
    }


    
    
    

    handleTitleChange(event) {
        this.formTitle = event.target.value;
        console.log('Form Title:', this.formTitle); // Debug log
    }

    connectedCallback() {
        console.log('💡 Received layoutData in form-create:', JSON.stringify(this.layoutData));
        console.log('📌 Received Org ID in form create:', this.orgid);
        this.loadDefaultLayouts();
        this.fetchSenderName();
        this.subscribeToMessageChannel();
        this.subscribeToRedirectChannel();
    
        // 🧱 Always create a default table first
        console.log('🧱 Creating default table first');
        this.createTable(5, 2); // Default fallback
    
        // ⏳ Delay rendering layoutData if it exists
        // if (this.layoutData && this.layoutData.tableRows && this.layoutData.tableRows.length > 0) {
        //     setTimeout(() => {
        //         console.log('⏳ Delayed render of layoutData after table creation');
        //         // this.renderFromLayoutData(this.layoutData);
        //         this.createTable(5, 2);
        //     }, 200); // Delay of 2 seconds
        // } 

        if (this.layoutData && this.layoutData.layoutJSON) {
    setTimeout(() => {
        console.log('⏳ Rendering layoutData in connectedCallback');
        this.loadClonedLayout({
            layoutJSON: this.layoutData.layoutJSON,
            Name__c: this.layoutData.layoutName,
            title: this.layoutData.title || this.layoutData.formType
        });
        this.newDesign = true;
        this.isCloneMode = false;
    }, 200);
}

        
        else if (this.layoutId) {
            // Load from backend if layoutId is present
            console.log('📦 Loading layout by ID:', this.layoutId);
            this.loadLayoutById(this.layoutId);
          
        }
    
        // ✅ Delay dropdown sync until DOM is painted
        requestAnimationFrame(() => {
            const dropdown = this.template.querySelector('.form-dropdown');
            if (dropdown) {
                dropdown.value = this.selectedFormType;
                console.log('🔽 Dropdown initialized with selectedFormType:', this.selectedFormType);
    
                if (!this.selectedFormType && this.formTypeOptions?.length > 0) {
                    this.selectedFormType = this.formTypeOptions[0].value;
                    dropdown.value = this.selectedFormType;
                    console.log('🔁 Dropdown set to default value:', this.selectedFormType);
                }
            } else {
                console.warn('⚠️ Dropdown element not found.');
            }
        });
    
        // Set initial button states
        this.isCaptureDisabled = !this.isPreviewEnabled;
        this.isSendDisabled = !(this.isPreviewEnabled && this.selectedFormType);

        setTimeout(() => {
            this.selectedFormType = 'Custom New Form';
            console.log('Default form type set to:', this.selectedFormType);
        }, 500); // 500ms delay
    }
    
    
    fetchSenderName() {
        getCurrentUserName()
            .then(result => {
                this.senderName = result; // Store the user's name
            })
            .catch(error => {
                console.error('Error fetching user name:', error);
            });
    }

    loadDefaultLayouts() {
    getAllLayouts({ orgId: this.orgid })
        .then(layoutMap => {
            this.defaultLayouts = layoutMap.DefaultLayouts.map(layout => ({
                ...layout,
                layoutName: layout.layoutName,
                displayName: layout.displayName,
                image: this.getRandomFormImage()
            }));
        })
        .catch(error => {
            console.error('❌ Failed to load default layouts:', error);
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
            this.selectedFormType = parsedJSON.selectedFormType || '';
            this.formTitle = parsedJSON.formTitle || '';
            this.togglePreview({ target: { checked: this.isPreviewEnabled } });

            console.log('Loaded layout data into tableRows:', this.tableRows);
        } catch (error) {
            console.error('Error parsing layout JSON:', error);
        }
    }


    handlePublish() {
        if (!this.formTitle || !this.selectedFormType) {
            this.showToast('Error', 'Form Title and Form Type are required.', 'error');
            return;
        }
    
        const filteredTableRows = [];
        const occupiedCells = new Set(); // ✅ Keeps track of merged cells to prevent duplicates
    
        this.tableRows.forEach(row => {
            const hasMergedCell = row.cells.some(cell => cell.col === 0 && cell.colspan === 2);
            const filteredCells = row.cells
                .filter(cell => {
                    if (hasMergedCell) {
                        return cell.col === 0; // ✅ Keep only the first column if a merged field exists
                    }
                    return cell.col < 2;
                })
                .map(cell => {
                    const key = `${cell.row}-${cell.col}`;
    
                    // ✅ Skip duplicate cells caused by rowspan
                    if (occupiedCells.has(key)) {
                        return null;
                    }
    
                    // ✅ Mark merged cells so they don't appear multiple times
                    if (cell.rowspan > 1) {
                        for (let i = 1; i < cell.rowspan; i++) {
                            occupiedCells.add(`${cell.row + i}-${cell.col}`);
                        }
                    }
    
                    return {
                        ...cell,
                        colspan: hasMergedCell ? 2 : cell.colspan, // ✅ Adjust colspan
                    };
                })
                .filter(cell => cell !== null); // ✅ Remove null entries
    
            filteredTableRows.push({
                ...row,
                cells: filteredCells,
            });
        });
        console.log("🔍 Filtered Rows Before Prepend:", filteredTableRows);
        const finalRowsToSave = this.selectedFormType === 'Incident Register'
        ? this.prependDefaultRowsIfIncident(filteredTableRows)
        : filteredTableRows;
        console.log("📋 Final Rows To Save:", finalRowsToSave);
    const formJson = JSON.stringify(finalRowsToSave);
    
        // const formJson = JSON.stringify(filteredTableRows);
    
        console.log('Publishing Form with Details:', {
            formName: this.formTitle,
            formJson: formJson,
            formType: this.selectedFormType,
            orgId: this.orgid
        });
        
        saveForm({ 
            formName: this.formTitle, 
            formJson: formJson, 
            formType: this.selectedFormType, 
            orgId: this.orgid // ✅ Include orgId
        })
        .then(() => {
            console.log('Form Published Successfully!');
            this.showToast('Success', 'Form Published Successfully!', 'success');
        })
        .catch(error => {
            console.error('Error saving form:', error);
            this.showToast('Error', 'Failed to publish form.', 'error');
        });

        this.publishTempalte = false;
        this.isFormSaved = true;

    }

   
    
    
    prependDefaultRowsIfIncident(existingRows) {
        const incidentDefaultRows = [
            {
              "id": "row-0",
              "cells": [
                {
                  "id": "cell-0-0",
                  "row": 0,
                  "col": 0,
                  "field": {
                    "id": "field-nsrd535t8",
                    "label": "First Name",
                    "dataType": "Text Field",
                    "isRequired": true,
                    "comments": "",
                    "selectedTextFieldOption": "alphaNumeric",
                    "alphaNumericLength": "50",
                    "onlyAlphabetsLength": "",
                    "isDisabled": true
                  },
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-0-0-edit",
                  "deleteKey": "cell-0-0-delete"
                },
                {
                  "id": "cell-0-1",
                  "row": 0,
                  "col": 1,
                  "field": {
                    "id": "field-2ghzhgdq6",
                    "label": "Last Name",
                    "dataType": "Text Field",
                    "isRequired": true,
                    "comments": "",
                    "selectedTextFieldOption": "alphaNumeric",
                    "alphaNumericLength": "50",
                    "onlyAlphabetsLength": "",
                    "isDisabled": true
                  },
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-0-1-edit",
                  "deleteKey": "cell-0-1-delete"
                }
              ]
            },
            {
              "id": "row-1",
              "cells": [
                {
                  "id": "cell-1-0",
                  "row": 1,
                  "col": 0,
                  "field": {
                    "id": "field-c81bg5do4",
                    "label": "Email ID",
                    "dataType": "Text Field",
                    "isRequired": true,
                    "comments": "",
                    "selectedTextFieldOption": "alphaNumeric",
                    "alphaNumericLength": "50",
                    "onlyAlphabetsLength": "",
                    "isDisabled": true
                  },
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-1-0-edit",
                  "deleteKey": "cell-1-0-delete"
                },
                {
                  "id": "cell-1-1",
                  "row": 1,
                  "col": 1,
                  "field": {
                    "id": "field-bcx32dwj7",
                    "label": "Facility",
                    "dataType": "Dropdown Field",
                    "isRequired": true,
                    "comments": "",
                    "selectedDropdownOption": "singleSelect",
                    "multiSelectValues": "",
                    "singleSelectValues": "",
                    "isDisabled": true
                  },
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-1-1-edit",
                  "deleteKey": "cell-1-1-delete"
                }
              ]
            },
            {
              "id": "row-2",
              "cells": [
                {
                  "id": "cell-2-0",
                  "row": 2,
                  "col": 0,
                  "field": {
                    "id": "field-r4zw6wftx",
                    "label": "Role",
                    "dataType": "Text Field",
                    "isRequired": false,
                    "comments": "",
                    "selectedTextFieldOption": "onlyAlphabets",
                    "alphaNumericLength": "",
                    "onlyAlphabetsLength": "50",
                    "isDisabled": true
                  },
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-2-0-edit",
                  "deleteKey": "cell-2-0-delete"
                },
                {
                  "id": "cell-2-1",
                  "row": 2,
                  "col": 1,
                  "field": {
                    "id": "field-99vf167tp",
                    "label": "Contact Number",
                    "dataType": "Number Field",
                    "isRequired": true,
                    "comments": "",
                    "selectedNumberFieldOption": "contactNumber",
                    "decimalValue": "",
                    "contactNumberDigits": "12",
                    "isDisabled": true
                  },
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-2-1-edit",
                  "deleteKey": "cell-2-1-delete"
                }
              ]
            },
            {
              "id": "row-3",
              "cells": [
                {
                  "id": "cell-3-0",
                  "row": 3,
                  "col": 0,
                  "field": {
                    "id": "field-vgnrxq19d",
                    "label": "Participant",
                    "dataType": "Dropdown Field",
                    "isRequired": true,
                    "comments": "",
                    "selectedDropdownOption": "singleSelect",
                    "multiSelectValues": "",
                    "singleSelectValues": ""
                  },
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-3-0-edit",
                  "deleteKey": "cell-3-0-delete"
                },
                {
                  "id": "cell-3-1",
                  "row": 3,
                  "col": 1,
                  "field": {
                    "id": "field-vpamk79dn",
                    "label": "Status",
                    "dataType": "Dropdown Field",
                    "isRequired": true,
                    "comments": "",
                    "selectedDropdownOption": "singleSelect",
                    "multiSelectValues": "",
                    "singleSelectValues": "Open\nIn-Progress\nResolved"
                  },
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-3-1-edit",
                  "deleteKey": "cell-3-1-delete"
                }
              ]
            },
            {
              "id": "row-4",
              "cells": [
                {
                  "id": "cell-4-0",
                  "row": 4,
                  "col": 0,
                  "field": {
                    "id": "field-8yzyici3g",
                    "label": "Assigned To",
                    "dataType": "Dropdown Field",
                    "isRequired": true,
                    "comments": "",
                    "selectedDropdownOption": "singleSelect",
                    "multiSelectValues": "",
                    "singleSelectValues": ""
                  },
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-4-0-edit",
                  "deleteKey": "cell-4-0-delete"
                },
                {
                  "id": "cell-4-1",
                  "row": 4,
                  "col": 1,
                  "field": null,
                  "colspan": 1,
                  "rowspan": 1,
                  "showMenu": false,
                  "style": "border: 1px solid #ddd;",
                  "editKey": "cell-4-1-edit",
                  "deleteKey": "cell-4-1-delete"
                }
              ]
            },
            {
              "id": "row-5",
              "cells": [
                {
                  "id": "cell-5-0",
                  "row": 5,
                  "col": 0,
                  "field": null,
                  "colspan": 1,
                  "rowspan": 1,
                  "style": "border: 1px solid #ddd;"
                },
                {
                  "id": "cell-5-1",
                  "row": 5,
                  "col": 1,
                  "field": null,
                  "colspan": 1,
                  "rowspan": 1,
                  "style": "border: 1px solid #ddd;"
                }
              ]
            },
            {
              "id": "row-6",
              "cells": [
                {
                  "id": "cell-6-0",
                  "row": 6,
                  "col": 0,
                  "field": {
                    "id": "field-b3676plnt",
                    "label": "page break",
                    "dataType": "Text Field",
                    "isRequired": false,
                    "comments": "",
                    "selectedTextFieldOption": "",
                    "alphaNumericLength": "",
                    "onlyAlphabetsLength": ""
                  },
                  "colspan": 2,
                  "rowspan": 1,
                  "style": "border: 1px solid #ddd;"
                }
              ]
            },
            
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
    
        if (message.actionType === 'redirect') {
            //this.loadRedirectedLayout(message);
        }
    }
    




    handleMessage(message) {
        console.log("Received message:", message);
    
        if (message.actionType === 'edit' && message.layoutName) {
            this.isCloneMode = false;
            this.layoutId = message.layoutName; 
            this.isViewingLayouts = false;
            this.loadLayoutById(this.layoutId);
            console.log("Editing layout with ID:", this.layoutId);
    
            requestAnimationFrame(() => {
                const dropdown = this.template.querySelector('.form-dropdown');
                if (dropdown) dropdown.value = this.selectedFormType;
            });
        } 
        else if (message.actionType === 'clone') {
            this.isCloneMode = true;
            this.selectedFormType = message.Name__c;
            console.log("Cloning layout with Name__c (form type):", this.selectedFormType);
            this.loadClonedLayout(message);
    
            requestAnimationFrame(() => {
                const dropdown = this.template.querySelector('.form-dropdown');
                if (dropdown) dropdown.value = this.selectedFormType;
            });
        } 
        else if (message.actionType === 'redirect') {
            console.log("Redirecting with layout:", message);
            this.loadRedirectedLayout(message); // 👉 call the new method
        }
    }
    
    
    
    renderFromLayoutData(layoutData) {
        try {
            console.log('🔄 Rendering from layoutData:', layoutData);
    
            // Apply layout data
            this.tableRows = layoutData.tableRows || [];
            this.selectedFormType = layoutData.selectedFormType || 'Medication';
            this.formTitle = layoutData.formTitle || 'Hardcoded Form Title';
            this.isViewingLayouts = false;
    
            // Defer DOM-dependent logic until next render cycle
            setTimeout(() => {
                // Sync form type dropdown
                const dropdown = this.template.querySelector('.form-dropdown');
                if (dropdown) {
                    dropdown.value = this.selectedFormType;
                    console.log('✅ Dropdown initialized with selectedFormType:', dropdown.value);
                } else {
                    console.warn('⚠️ Form dropdown element not found.');
                }
    
                // Sync preview toggle
                const previewToggle = this.template.querySelector('.preview-toggle');
                if (previewToggle) {
                    previewToggle.checked = this.isPreviewEnabled;
                    console.log('✅ Preview toggle synced.');
                } else {
                    console.warn('⚠️ Preview toggle element not found.');
                }
    
                // Re-bind cell click handlers
                const cells = this.template.querySelectorAll('.table-cell');
                if (cells.length > 0) {
                    cells.forEach(cell => {
                        cell.removeEventListener('click', this.handleCellClick);
                        cell.addEventListener('click', this.handleCellClick.bind(this));
                    });
                    console.log(`✅ Bound click handlers to ${cells.length} cells.`);
                } else {
                    console.warn('❌ No table cells found for event binding.');
                }
    
                // Highlight and update UI state
                if (typeof this.highlightSelectedCells === 'function') {
                    this.highlightSelectedCells();
                }
    
                this.updatePreviewAndButtonStates();
    
            }, 0); // Wait for DOM render
        } catch (error) {
            console.error('❌ Error rendering layoutData in table:', error);
            this.showToast('Error', 'Failed to render layout data.', 'error');
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
            this.selectedFormType = message.Name__c || parsedData.selectedFormType || '';
            this.formTitle = message.title || parsedData.formTitle || '';
            this.isViewingLayouts = false;
    
            // ✅ Delay DOM updates
            setTimeout(() => {
                const dropdown = this.template.querySelector('.form-dropdown');
                if (dropdown) {
                    dropdown.value = this.selectedFormType;
                    console.log("✅ Dropdown value set after layout load:", dropdown.value);
                }
    
                const previewToggle = this.template.querySelector('.preview-toggle');
                if (previewToggle) {
                    previewToggle.checked = this.isPreviewEnabled;
                }
    
                const cells = this.template.querySelectorAll('.table-cell');
                if (cells.length > 0) {
                    cells.forEach(cell => {
                        cell.removeEventListener('click', this.handleCellClick);
                        cell.addEventListener('click', this.handleCellClick.bind(this));
                    });
                }
    
                this.highlightSelectedCells?.();
                this.updatePreviewAndButtonStates();
            }, 0);
        } catch (error) {
            console.error("❌ Error loading layout from redirect:", error);
            this.showToast('Error', 'Could not load layout from redirect. Please retry.', 'error');
        }
    }
    
    
    updatePreviewAndButtonStates() {
        const titleValid = this.formTitle && this.formTitle.trim().length > 0;
        const formTypeValid = this.selectedFormType && this.selectedFormType.trim().length > 0;
    
        this.isSendDisabled = !(titleValid && formTypeValid && this.isPreviewEnabled);
    
        console.log("📌 Form Title Valid:", titleValid);
        console.log("📌 Form Type Valid:", formTypeValid);
        console.log("📌 Preview Enabled:", this.isPreviewEnabled);
        console.log("📌 Send Button Disabled:", this.isSendDisabled);
    }
    
    
    
    
    
    

    loadClonedLayout(message) {
    try {
        console.log("Cloning layout with JSON data:", message.layoutJSON);

        this.layoutData = JSON.parse(message.layoutJSON);
        this.tableRows = this.layoutData.tableRows || [];

        
         this.selectedModuleType = message.formModule || this.layoutData.selectedModuleType || '';

        this.showFormTypeDropdown = this.selectedModuleType;
        this.showFormTypeDropdown = true;
        console.log("📌 Form Module defaulted to:", this.selectedModuleType);

       // ✅ Dynamically set form type and title
this.selectedFormType = this.layoutData.selectedFormType || '';
this.formTitle = message.title || '';
console.log("📌 Form Type set to:", this.selectedFormType);


        // ✅ Update dropdown values after render
        requestAnimationFrame(() => {
            const formModuleDropdown = this.template.querySelector('.form-module-dropdown');
            if (formModuleDropdown) {
                formModuleDropdown.value = this.selectedModuleType;
            }

            const formTypeDropdown = this.template.querySelector('.form-dropdown');
            if (formTypeDropdown) {
                formTypeDropdown.value = this.selectedFormType;
            }
        });

        this.newDesign = true;
        this.isCloneMode = false;
        this.isViewingLayouts = false;

        // Optionally scroll to top or focus input
    } catch (error) {
        console.error("❌ Error parsing layout JSON for clone:", error);
        this.showToast('Error', 'Failed to load cloned layout data.', 'error');
    }
}

    
    
    
    
    
    
    
    
    
    
    
    
    // Method to redirect to the drag-and-drop view (if needed)
    navigateToDragDropView() {
        // Logic to show or activate the drag-and-drop component view
        this.showDragDropView = true; // This assumes you’re using a conditional rendering flag
        console.log('Redirected to drag-and-drop view');
    }
    
    

    async loadLayoutById(layoutId) {
        try {
            console.log('Loading layout data for ID:', layoutId);
            const layout = await getLayoutData({ layoutName: layoutId });
    
            if (layout) {
                console.log('Retrieved layout for editing:', layout);
    
                this.formTitle = layout.title || '';
                this.selectedFormType = layout.displayName || '';
    
                this.tableRows = layout.layoutJson ? JSON.parse(layout.layoutJson).tableRows : [];
                this.isPreviewEnabled = false; // Reset preview mode on load
    
                requestAnimationFrame(() => {
                    const dropdown = this.template.querySelector('.form-dropdown');
                    if (dropdown) {
                        dropdown.value = this.selectedFormType; // Sync UI with backend value
                        console.log('Dropdown value set:', dropdown.value);
                    } else {
                        console.warn('Dropdown element not found.');
                    }
                });
    
                console.log('Loaded form title:', this.formTitle);
                console.log('Loaded form type:', this.selectedFormType);
            } else {
                console.warn('No layout data returned for ID:', layoutId);
            }
        } catch (error) {
            console.error('Error loading layout by ID:', error);
            this.showToast('Error', 'Failed to load layout data.', 'error');
        }
    }
    
    
    
    
    loadLayoutById(layoutId) {
        getLayoutData({ layoutName: layoutId }) // Pass Name here
            .then(layout => {
                this.layoutName = layout.displayName; // Set display name (Name__c) in UI
                this.formTitle = layout.title;
                this.tableRows = JSON.parse(layout.layoutJson).tableRows || [];
                // Update dropdown if applicable
                requestAnimationFrame(() => {
                    const dropdown = this.template.querySelector('.form-dropdown');
                    if (dropdown) dropdown.value = this.layoutName;
                });
            })
            .catch(error => {
                console.error('Error loading layout:', error);
            });
    }
    
    
    
    
    loadLayout(layout) {
        console.log("Entering loadLayout with layout:", layout); // Debug log to confirm method entry
    
        try {
            // Validate layout and its JSON property
            if (layout && layout.Layout_JSON__c) {
                // Parse layout JSON and extract data
                this.layoutData = JSON.parse(layout.Layout_JSON__c);
                this.tableRows = this.layoutData.tableRows || [];
                this.selectedFormType = this.layoutData.selectedFormType || '';
                this.formTitle = layout.title || ''; // Set the form title
                this.layoutId = layout.layoutId || ''; // Set layout ID for further operations
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
                this.showToast('Error', 'Layout data is missing or invalid.', 'error');
            }
        } catch (error) {
            console.error("Error parsing layout data in loadLayout:", error);
            this.showToast('Error', 'Failed to load layout data.', 'error');
        }
    }
    
    // Helper method to update dropdown selection
    updateDropdown() {
        const dropdown = this.template.querySelector('.form-dropdown');
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
        const formTypeValid = this.selectedFormType && this.selectedFormType.trim().length > 0;
        const sendButton = this.template.querySelector('.send-button');
    
        if (sendButton) {
            sendButton.disabled = !(titleValid && formTypeValid && this.isPreviewEnabled);
            console.log(
                "Send Button State Updated: ",
                sendButton.disabled ? "Disabled" : "Enabled"
            );
        }
    }
    
    
    loadLayout(message) {
        console.log('Loading layout data in DragDropComp:', message);
        this.layoutName = message.layoutName;       // Assign unique identifier
        this.formTitle = message.title || '';       // Assign title if available
        this.selectedFormType = message.formType;   // Set form type in dropdown
        this.tableRows = JSON.parse(message.layoutJSON).tableRows || []; // Parse table rows
    
        // Ensure the component view updates to show the layout
        this.isViewingLayouts = false;
        this.showDragDropView = true;
    
        // Force dropdown update if necessary
        requestAnimationFrame(() => {
            const dropdown = this.template.querySelector('.form-dropdown');
            if (dropdown) dropdown.value = this.selectedFormType;
        });
    }
    
    // loadClonedLayout(message) {
    //     try {
    //         console.log("Cloning layout with JSON data:", message.layoutJSON);
    
    //         // Parse the JSON data from the cloned message
    //         this.layoutData = JSON.parse(message.layoutJSON);
    
    //         // Set tableRows and use Name__c as the form type
    //         this.tableRows = this.layoutData.tableRows || [];
    //         this.selectedFormType = message.Name__c || ''; // Ensure Name__c is used for dropdown
    //         this.formTitle = message.title || ''; // Set the title if available
    //         this.selectedModuleType = 'Customizable Form';
    //         console.log("📌 Form Module defaulted to:", this.selectedModuleType);
    
    //         console.log("Form Type (Name__c) set to:", this.selectedFormType);
    
    //         // Force dropdown update after rendering
    //         requestAnimationFrame(() => {
    //             const dropdown = this.template.querySelector('.form-dropdown');
    //             if (dropdown) {
    //                 dropdown.value = this.selectedFormType; // Explicitly set to Name__c
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
    
    
    
    
    
    
    


    renderedCallback() {

        console.log('🔁 Rendered callback executed.');

   
        // Wait for full DOM rendering
        requestAnimationFrame(() => {
            // Add a short delay to ensure all child components and DOM elements are fully rendered
            setTimeout(() => {
                // 🔘 Synchronize the preview toggle state
                const previewToggle = this.template.querySelector('.preview-toggle');
                if (previewToggle) {
                    previewToggle.checked = this.isPreviewEnabled;
                } else {
                    console.warn('⚠️ Preview toggle element not found.');
                }
    
                // 🔽 Synchronize the dropdown with selectedFormType
                const dropdown = this.template.querySelector('.form-dropdown');
                if (dropdown) {
                    if (!this.selectedFormType) {
                        this.selectedFormType = dropdown.value;
                    } else {
                        dropdown.value = this.selectedFormType;
                    }
                    console.log('✅ Dropdown value synchronized:', dropdown.value);
                } else {
                    console.warn('⚠️ Form dropdown element not found.');
                }

                const formModuleDropdown = this.template.querySelector('.form-module-dropdown');
                if (formModuleDropdown) {
                    formModuleDropdown.value = this.selectedModuleType || '';
                }

    
                // ✅ Validate form title and form type
                const titleValid = this.formTitle && this.formTitle.trim().length > 0;
                const formTypeValid = this.selectedFormType && this.selectedFormType.trim().length > 0;
                this.isSendDisabled = !(titleValid && formTypeValid && this.isPreviewEnabled);
    
                console.log('📋 Validation Status:');
                console.log('📌 Form Title Valid:', titleValid);
                console.log('📌 Form Type Valid:', formTypeValid);
                console.log('📌 Preview Enabled:', this.isPreviewEnabled);
                console.log('📌 Send Button Disabled:', this.isSendDisabled);
    
                // 🔁 Attach click listeners to all table cells
                const cells = this.template.querySelectorAll('.table-cell');
                if (cells.length > 0) {
                    cells.forEach(cell => {
                        cell.removeEventListener('click', this.handleCellClick); // Avoid duplicates
                        cell.addEventListener('click', this.handleCellClick.bind(this));
                    });
                    console.log(`✅ Attached click listeners to ${cells.length} table cells.`);
                } else {
                    console.warn('❌ No table cells found for event binding.');
                }
    
                // ✨ Highlight selected cells if any
                this.highlightSelectedCells();
    
                // 📥 Update button states
                this.updateButtonStates();
    
            }, 1000); // Delay (in milliseconds)
        });
    }
    
    
    
    
    
    
    

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
                    style: 'border: 1px solid #ddd;',
                    editKey: `cell-${row}-${col}-edit`,
                    deleteKey: `cell-${row}-${col}-delete`
                });
            }
            this.tableRows.push(tableRow);
        }
        this.saveTableState();
    }

    // saveTableState() {
    //     if (!Array.isArray(this.tableHistory)) {
    //         this.tableHistory = [];
    //     }
    //     const currentState = JSON.parse(JSON.stringify(this.tableRows));
    //     this.tableHistory.push(currentState);
    // }


    saveTableState() {
        if (!Array.isArray(this.tableHistory)) {
            this.tableHistory = [];
        }
    
        const currentState = JSON.stringify(this.tableRows);
    
        const lastState = this.tableHistory.length > 0
            ? JSON.stringify(this.tableHistory[this.tableHistory.length - 1])
            : null;
    
        if (currentState !== lastState) {
            this.tableHistory.push(JSON.parse(currentState));
        }
    }
    
    toggleMenu(event) {
        event.stopPropagation(); // Prevent event from bubbling to document
        const cellId = event.target.dataset.id;
        const cell = this.getCellById(cellId);
    
        // Toggle the menu for the selected cell and close others
        this.tableRows.forEach(row => {
            row.cells.forEach(c => {
                c.showMenu = c.id === cellId ? !c.showMenu : false;
            });
        });
    
        this.tableRows = [...this.tableRows]; // Trigger reactivity
    
        // If menu is open, attach event listener to detect outside click/scroll
        if (cell.showMenu) {
            document.addEventListener('click', this.closeMenuOnOutsideClick);
            document.addEventListener('scroll', this.closeMenuOnScroll);
        }
    }
    
    closeMenuOnOutsideClick = (event) => {
        if (!this.template.querySelector('.menu-dropdown')) {
            return; // No menu found, exit early
        }
    
        const menuContainer = this.template.querySelector('.menu-container');
        if (!menuContainer.contains(event.target)) {
            this.closeAllMenus();
        }
    };
    
    closeMenuOnScroll = () => {
        this.closeAllMenus();
    };
    
    closeAllMenus() {
        this.tableRows.forEach(row => {
            row.cells.forEach(c => c.showMenu = false);
        });
    
        this.tableRows = [...this.tableRows]; // Trigger reactivity
    
        // Remove event listeners when menu is closed
        document.removeEventListener('click', this.closeMenuOnOutsideClick);
        document.removeEventListener('scroll', this.closeMenuOnScroll);
    }
    

    handleEdit(event) {
        const cellId = event.target.dataset.id;
        const cell = this.getCellById(cellId);
        if (cell && cell.field) {
            this.currentCell = cell;
            this.fieldLabel = cell.field.label || '';
            this.currentFieldType = cell.field.dataType; 
            this.isMandatory = cell.field.isRequired || false;
            this.comments = cell.field.comments || '';
        
            // Reset all field type flags
            this.isTextField = false;
            this.isNumberField = false;
            this.isDateField = false;
            this.isDropDownField = false;
            this.isTimeField = false;
            this.isUploadFileField = false;
            this.isRadioButtonField = false;
        
            // Populate specific fields based on the saved field type
            if (cell.field.dataType === 'Text Field') {
                this.isTextField = true;
                this.selectedOption = cell.field.selectedTextFieldOption || '';  // Load the saved radio button for Text Field
                this.alphaNumericLength = cell.field.alphaNumericLength || '';
                this.onlyAlphabetsLength = cell.field.onlyAlphabetsLength || '';
            } else if (cell.field.dataType === 'Number Field') {
                this.isNumberField = true;
                this.selectedNumberFieldOption = cell.field.selectedNumberFieldOption || '';  // Load the saved radio button for Number Field
                this.decimalValue = cell.field.decimalValue || '';
                this.contactNumberDigits = cell.field.contactNumberDigits || '';
            } else if (cell.field.dataType === 'Date Field') {
                this.isDateField = true;
                this.selectedDateFormat = cell.field.selectedDateFormat || '';  // Load saved date format
            } else if (cell.field.dataType === 'Dropdown Field') {
                this.isDropDownField = true;
                this.selectedDropdownOption = cell.field.selectedDropdownOption || '';  // Load saved radio button for Drop Down
                this.multiSelectValues = cell.field.multiSelectValues || '';
                this.singleSelectValues = cell.field.singleSelectValues || '';
                this.predefinedListType = cell.field.predefinedListType || '';
            } else if (cell.field.dataType === 'Time Field') {
                this.isTimeField = true;
                this.timeFormat = cell.field.timeFormat || '';
                this.timeDisplayFormat = cell.field.timeDisplayFormat || '';
                
            }else if (cell.field.dataType === 'Upload File') {
                this.isUploadFileField = true;
            }else if (cell.field.dataType === 'Radio Button') {
                this.isRadioButtonField = true;
                this.radioOptions = cell.field.radioOptions || '';
            }
            
            
        
            // Show the popup for editing with populated values
            this.showPopup = true;
            this.hideMenu(cellId);
        }
    }
    
    
    
    

    handleDelete(event) {
        const cellId = event.target.dataset.id;
        const cell = this.getCellById(cellId);
    
        if (cell) {
            cell.field = null;
            cell.showMenu = false;
            this.isMenuOpen = false;  // Reset isMenuOpen after delete
            this.saveTableState();
            this.isFormSaved = false;
        }
    }

    hideMenu(cellId) {
        const cell = this.getCellById(cellId);
        cell.showMenu = false;
        this.tableRows = [...this.tableRows];
    }

    handleCellClick(event) {
        const cellId = event.target.dataset.id;
        const cell = this.getCellById(cellId);
    
        if (event.shiftKey && this.selectedCells.length > 0) {
            // Multi-select range with Shift key
            const startCell = this.selectedCells[0];
            this.selectRange(startCell, cell);
        } else {
            // Single-cell selection (clear previous selection if no Shift key is pressed)
            this.selectedCells = [cell];
        }
    
        this.highlightSelectedCells();
    }
    
    
    
    
    
    
    

    highlightSelectedCells() {
        this.template.querySelectorAll('.table-cell').forEach(cellElement => {
            const cellId = cellElement.dataset.id;
            if (this.selectedCells.some(c => c.id === cellId)) {
                cellElement.classList.add('selected-cell'); // Add visual class
            } else {
                cellElement.classList.remove('selected-cell');
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
            const isHorizontal = this.selectedCells.every(c => c.row === firstCell.row);
            const isVertical = this.selectedCells.every(c => c.col === firstCell.col);

            if (isHorizontal) {
                this.mergeCellsHorizontally();
            } else if (isVertical) {
                this.mergeCellsVertically();
            } else {
                alert('Please select either a full row or a full column to merge.');
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
            alert('You cannot merge beyond the 3-column limit.');
            return;
        }
    
        const cellToMerge = this.getCellById(`cell-${startCell.row}-${startCol}`);
        const totalColspan = endCol - startCol + 1;
    
        cellToMerge.colspan = totalColspan;
    
        for (let col = startCol + 1; col <= endCol; col++) {
            const cell = this.getCellById(`cell-${startCell.row}-${col}`);
            if (cell) {
                cell.style = 'display: none;';
            }
        }
    
        // Make sure to retain the right border of the merged column
        const lastCell = this.getCellById(`cell-${startCell.row}-${endCol}`);
        if (lastCell) {
            lastCell.style.borderRight = '1px solid #ddd';
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
            cell.style = 'display: none;';
        }
    
        // Ensure the rest of the layout structure remains unaffected by this merge
        this.tableRows = [...this.tableRows]; // Refresh the table rows
    }
    
    
    
    
    
    

    // handleUndo() {
    //     if (this.tableHistory && this.tableHistory.length > 1) {
    //         // Remove the current state
    //         this.tableHistory.pop();
    
    //         // Restore the previous state
    //         const previousState = JSON.parse(JSON.stringify(this.tableHistory[this.tableHistory.length - 1]));
    //         this.tableRows = previousState;
    
    //         // Clear selected cells after undo to avoid visual artifacts
    //         this.selectedCells = [];
    
    //         // Refresh the UI
    //         this.tableRows = [...this.tableRows];
    //         this.highlightSelectedCells();
    //     } else {
    //         alert('Nothing to undo.');
    //     }
    // }

    handleUndo() {
        if (this.tableHistory && this.tableHistory.length > 1) {
            const currentState = this.tableRows;
            const previousState = JSON.parse(JSON.stringify(this.tableHistory[this.tableHistory.length - 2]));
    
            // Compare and log removed fields
            const removedFields = [];
    
            for (let r = 0; r < currentState.length; r++) {
                const currentRow = currentState[r]?.cells || [];
                const previousRow = previousState[r]?.cells || [];
    
                for (let c = 0; c < currentRow.length; c++) {
                    const currentCell = currentRow[c];
                    const previousCell = previousRow[c];
    
                    if (currentCell?.field && !previousCell?.field) {
                        removedFields.push(currentCell.field.label || 'Unnamed Field');
                    }
                }
            }
    
            if (removedFields.length > 0) {
                console.log('🧹 Undo removed the following field(s):', removedFields.join(', '));
            } else {
                console.log('↩️ Undo did not remove any fields.');
            }
    
            // Remove the current state
            this.tableHistory.pop();
    
            // Restore the previous state
            this.tableRows = previousState;
    
            // Clear selected cells and refresh
            this.selectedCells = [];
            this.tableRows = [...this.tableRows];
            this.highlightSelectedCells();
        } else {
            alert('Nothing to undo.');
        }
    }
    
    

    handleAddRow() {
        const newRow = { id: `row-${this.tableRows.length}`, cells: [] };
        const cols = 2;

        for (let col = 0; col < cols; col++) {
            newRow.cells.push({
                id: `cell-${this.tableRows.length}-${col}`,
                row: this.tableRows.length,
                col,
                field: null,
                colspan: 1,
                rowspan: 1,
                style: 'border: 1px solid #ddd;'
            });
        }
        this.tableRows.push(newRow);
        this.hasChanges = true;
        this.saveTableState();
    }

    handleReset() {
        // Reset table rows to their initial empty state
        this.tableRows = [];
        this.createTable(5, 2); // Re-initialize with default 5 rows and 2 columns
    
        // Clear other relevant fields
        this.selectedCells = [];
        this.selectedHeaderFields = [];
        this.layoutFields = [];
        this.formTitle = '';
        // this.selectedModuleType = '';   // Reset Form Module dropdown value
        this.selectedFormType = '';     // Reset Form Type dropdown value
        this.fieldLabel = '';
        this.isMandatory = false;
        this.comments = '';
        this.isFormTypeSelected = false;
        this.showFormTypeDropdown = false; // Hide form type dropdown
        this.hasChanges = false; 
        this.isResetState = true;
        this.isPreviewMode = false;
        this.isPreviewEnabled = false;
        this.showPopup = false;
        this.showHeaderPopup = false;
    
        requestAnimationFrame(() => {
            const formTypeDropdown = this.template.querySelector('.form-dropdown');
            if (formTypeDropdown) {
                formTypeDropdown.value = '';
            }
            const formModuleDropdown = this.template.querySelector('.form-module-dropdown');
            if (formModuleDropdown) {
                formModuleDropdown.value = '';
            }
        });
    
        this.saveTableState(); // Save the reset state
        console.log('🔄 Form has been reset to initial empty state.');
    }
    
    

    handleSaveHeaderLayout() {
        this.layoutFields = this.tableRows
            .flatMap(row => row.cells)
            .filter(cell => cell.field)
            .map(cell => ({ id: cell.field.id, label: cell.field.label }));
        this.showHeaderPopup = true;
    }

    handleCancelLayout() {
        this.selectedHeaderFields = [];
        this.showHeaderPopup = false;
    }

    handleCancel() {
        // Reset the popup fields
        this.fieldLabel = '';
        this.isMandatory = false;
        this.comments = '';
        this.showPopup = false; // Hide the field settings popup
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
                const selectedField = this.layoutFields.find(field => field.id === fieldId);
                this.selectedHeaderFields = [...this.selectedHeaderFields, selectedField];
            } else {
                event.target.checked = false; 
                this.showToast('Error', 'You can select up to 7 fields only.', 'error');
            }
        } else {
            this.selectedHeaderFields = this.selectedHeaderFields.filter(field => field.id !== fieldId);
        }
    
        // Disable unchecked fields if the limit is reached
        const disableRemaining = this.selectedHeaderFields.length >= 7;
        this.layoutFields = this.layoutFields.map(field => ({
            ...field,
            checked: this.selectedHeaderFields.some(selected => selected.id === field.id),
            disabled: disableRemaining && !this.selectedHeaderFields.some(selected => selected.id === field.id),
        }));
    }
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
    
    
    

    handleSaveHeader() {
        // Filter layoutFields to only include checked items and remove duplicates
        this.selectedHeaderFields = this.layoutFields
            .filter(field => field.checked)
            .filter((field, index, self) => self.findIndex(f => f.id === field.id) === index);
    
        // Close the popup
        this.showHeaderPopup = false;
    }

    openHeaderPopup() {
        this.layoutFields = this.layoutFields.map(field => ({
            ...field,
            checked: this.selectedHeaderFields.some(selected => selected.id === field.id)
        }));
        this.showHeaderPopup = true; // Open the popup
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
    

    // handleDragStart(event) {
    //     // Check if Form Title and Form Type are filled
    //     if (!this.formTitle || !this.selectedFormType) {
    //         // Prevent the default drag event
    //         event.preventDefault();
    
    //         // Show a toast message warning the user
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: 'Action Required',
    //                 message: 'Please enter the Form Title and select a Form Type before dragging fields.',
    //                 variant: 'warning',
    //                 mode: 'dismissable'
    //             })
    //         );
    //         return;
    //     }
    
    //     // Allow dragging if conditions are met
    //     this.draggingFieldType = event.target.dataset.type;
    //     event.dataTransfer.setData('text/plain', this.draggingFieldType);
    // }
    
    handleDragStart(event) {
    const titleMissing = !this.formTitle || this.formTitle.trim() === '';
    const moduleMissing = !this.selectedModuleType || this.selectedModuleType.trim() === '';
    const typeMissing = !this.selectedFormType || this.selectedFormType.trim() === '';

    if (titleMissing || moduleMissing || typeMissing) {
        event.preventDefault(); // Block the drag

        const missingFields = [
            titleMissing ? 'Form Title' : '',
            moduleMissing ? 'Form Module' : '',
            typeMissing ? 'Form Type' : ''
        ].filter(x => x).join(', ');

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Action Required',
                message: `Please fill out the following before dragging fields: ${missingFields}`,
                variant: 'warning',
                mode: 'dismissable'
            })
        );
        return;
    }

    // ✅ All conditions passed, allow drag
    this.draggingFieldType = event.target.dataset.type;
    event.dataTransfer.setData('text/plain', this.draggingFieldType);
}

    

    handleDragStartDropped(event) {
        this.draggingFieldId = event.target.dataset.id;
        event.dataTransfer.setData('text/plain', this.draggingFieldId);
    }
    @track hasPendingFieldChange = false;


    handleDrop(event) {
        event.preventDefault();

        const targetCellId = event.target.dataset.id;
        const targetCell = this.getCellById(targetCellId);

        const draggingId = event.dataTransfer.getData('text/plain');

        if (this.draggingFieldId) {

            const sourceCell = this.getCellByFieldId(this.draggingFieldId);

            if (sourceCell && sourceCell.field) {
                targetCell.field = sourceCell.field; 
                sourceCell.field = null; 
                this.draggingFieldId = null; 
            }
        } 

        else if (this.draggingFieldType) {
            console.log('🧪 draggingFieldType:', this.draggingFieldType); 


        if (this.draggingFieldType === 'Blank') {
            const droppedField = {
                id: Date.now().toString(),
                dataType: 'Blank',
                label: 'Page Break',
                isReadOnlyLabel: true,
                isRequired: false,
                isBlank: true
            };
            
            console.log('🚫 Dropping a BLANK field...');
            console.log('📌 Target Cell:', targetCell);
            console.log('📥 Dropped Field:', droppedField);
        
            targetCell.field = droppedField;
            this.fieldLabel = 'Page Break';
            this.draggingFieldType = null;
            this.showPopup = false;
            this.tableRows = [...this.tableRows];

        
            console.log('✅ BLANK field assigned. Popup skipped.');
            return;
        }
            this.resetFieldSettings(); 
            this.currentFieldType = this.draggingFieldType;

            if (this.draggingFieldType === 'Text Field') {
                this.isTextField = true;
            } else if (this.draggingFieldType === 'Number Field') {
                this.isNumberField = true;
            } else if (this.draggingFieldType === 'Date Field') {
                this.isDateField = true;
            } else if (this.draggingFieldType === 'Dropdown Field') {
                this.isDropDownField = true;
            } else if (this.draggingFieldType === 'Time Field') {
                this.isTimeField = true;
            }else if (this.draggingFieldType === 'Upload File') {
                this.isUploadFileField = true;
            }else if (this.draggingFieldType === 'Radio Button') {
                this.isRadioButtonField = true;
            }

            this.currentCell = targetCell;
            this.showPopup = true;
            this.draggingFieldType = null; // Reset the new field type
        }
    
        // Update table rows to reflect changes in UI
        this.tableRows = [...this.tableRows];
        if (this.showPopup) {
            this.hasPendingFieldChange = true; // Defer saving until user confirms
        } else {
            this.saveTableState(); // Only save if no popup (e.g., for blank fields or direct move)
        }
    }


    

    handleDragOver(event) {
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

    handleSave() {
        // Validation: Ensure the Field Label is not empty
        if (!this.fieldLabel || !this.fieldLabel.trim()) {
            this.showToast('Error', 'Field Label is mandatory.', 'error');
            return; // Stop further execution if validation fails
        }
    
        if (this.currentCell) {
            const fieldData = {
                id: this.currentCell.field ? this.currentCell.field.id : `field-${Math.random().toString(36).substr(2, 9)}`,
                label: this.fieldLabel.trim(), // Ensure the label is trimmed of extra spaces
                dataType: this.currentFieldType,
                isRequired: this.isMandatory,
                comments: this.comments,
            };
    
            // Save specific options based on the field type
            if (this.isTextField) {
                fieldData.selectedTextFieldOption = this.selectedOption; // Save selected radio button for Text Field
                fieldData.alphaNumericLength = this.alphaNumericLength || '';
                fieldData.onlyAlphabetsLength = this.onlyAlphabetsLength || '';
            } else if (this.isNumberField) {
                fieldData.selectedNumberFieldOption = this.selectedNumberFieldOption; // Save selected radio button for Number Field
                fieldData.decimalValue = this.decimalValue || '';
                fieldData.contactNumberDigits = this.contactNumberDigits || '';
            } else if (this.isDateField) {
                fieldData.selectedDateFormat = this.selectedDateFormat || ''; // Save selected date format
            } else if (this.isDropDownField) {
                fieldData.selectedDropdownOption = this.selectedDropdownOption; // Save selected radio button for Drop Down
                fieldData.multiSelectValues = this.multiSelectValues || '';
                fieldData.singleSelectValues = this.singleSelectValues || '';
                fieldData.predefinedListType = this.predefinedListType || '';
            } else if (this.isTimeField) {
                fieldData.timeFormat = this.timeFormat;
                fieldData.timeDisplayFormat = this.timeDisplayFormat;
            }else if (this.isUploadFileField) {
                // No additional properties needed
            }else if (this.isRadioButtonField) {
                fieldData.radioOptions = this.radioSubInputs.map(sub => ({
                    optionLabel: sub.option,
                    hasSubInput: sub.hasSubInput,
                    ...(sub.hasSubInput && {
                        subQuestion: sub.subQuestion,
                        subType: sub.subType,
                        usePredefinedOptions: sub.usePredefinedOptions || false,
                        selectedPredefined: sub.selectedPredefined || '',
                        values: sub.usePredefinedOptions
                            ? [] // Values are predefined, handled separately
                            : (sub.subValues || '').split('\n').map(v => v.trim()).filter(v => v)
                    })
                }));
                
            }
            
            
            
            
    
            // Set field data to the cell
            this.currentCell.field = fieldData;
    
            // Reset popup fields and hide the popup
            this.resetPopupFields();
            this.showPopup = false;
        }
        if (this.hasPendingFieldChange) {
            this.saveTableState(); // Save final state after user confirmation
            this.hasPendingFieldChange = false;
        }

        this.isFormSaved = false;
        
    }
    
    // Helper method to show toast messages
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
    
    
    
    
    
    resetPopupFields() {
        this.fieldLabel = '';
        this.isMandatory = false;
        this.comments = '';
        
        // Clear specific field type selections
        this.alphaNumericLength = '';
        this.onlyAlphabetsLength = '';
        this.decimalValue = '';
        this.contactNumberDigits = '';
        this.selectedDateFormat = '';
        this.multiSelectValues = '';
        this.singleSelectValues = '';
        this.selectedOption = '';   // Reset selection for Text Field options
        this.selectedNumberFieldOption = ''; // Reset Number Field options
        this.selectedDropdownOption = ''; // Reset Dropdown Field options
        this.is12HourFormat = false;
        this.timeDisplayFormat = '';
        this.isTimeField = false;
        // Clear flags for conditional rendering
        this.isTextField = false;
        this.isNumberField = false;
        this.isDateField = false;
        this.isDropDownField = false;
        this.isRadioButtonField = false;
        this.radioOptions = '';

    }
    
    
    resetFieldSettings() {
        this.fieldLabel = '';
        this.isMandatory = false;
        this.comments = '';
    
        // Reset Text Field-specific settings
        this.selectedOption = '';
        this.alphaNumericLength = '';
        this.onlyAlphabetsLength = '';
    
        // Reset Number Field-specific settings
        this.selectedNumberFieldOption = '';
        this.decimalValue = '';
        this.contactNumberDigits = '';
    
        // Reset Date Field-specific settings
        this.selectedDateFormat = '';
    
        // Reset Dropdown-specific settings
        this.selectedDropdownOption = '';
        this.multiSelectValues = '';
        this.singleSelectValues = '';

        this.is12HourFormat = false;
        this.timeDisplayFormat = '';
    
        // Reset flags
        this.isTextField = false;
        this.isNumberField = false;
        this.isDateField = false;
        this.isDropDownField = false;
        this.isTimeField = false;
        this.isRadioButtonField = false;
        this.isUploadFileField = false;
        this.radioOptions = '';
        this.mainRadioOptions = '';
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
            const previewToggle = this.template.querySelector('.preview-toggle');
            if (previewToggle) {
                previewToggle.checked = false; // Uncheck the toggle
                previewToggle.disabled = true; // Disable the toggle
            } else {
                console.warn('Preview toggle element not found.');
            }
        });
    
        console.log('Preview toggle disabled.');
    }
    

    async handleSaveAndNavigate() {
        try {
            // Call handleSaveLayout and wait for it to complete
            await this.handleSaveLayout();
    
            // If the save was successful, proceed with navigation
            this.isUnsaved = false; // Reset the unsaved flag
            this.showConfirmationPopup = false; // Close the popup
            this.hasChanges = false; // Reset changes flag
            this.isResetState = true;
    
            // Navigate to "Existing Forms"
            this.navigateToLayoutList();
        } catch (error) {
            console.error('Error during save and navigate:', error);
            // Optional: Show an error message if save fails
            this.showToast('Error', 'Failed to save and navigate.', 'error');
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
        console.log('Saving form...');
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
        // Update the selected option based on user choice
        this.selectedOption = event.target.value;
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


    @track selectedDropdownOption = '';  // Track the selected option for Dropdown Field
    @track multiSelectValues = '';       // Values for Multi-Select Picklist
    @track singleSelectValues = '';      // Values for Single-Select Picklist

    // Getters for visibility and enablement based on selected option
    get isMultiSelectSelected() {
        return this.selectedDropdownOption === 'multiSelect';
    }

    get isSingleSelectSelected() {
        return this.selectedDropdownOption === 'singleSelect';
    }

    handleDropdownRadioSelection(event) {
        this.selectedDropdownOption = event.target.value;
        this.predefinedListType = ''; // Reset predefined list type on change
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
        for (let row of this.tableRows) {
            const cell = row.cells.find(cell => cell.id === cellId);
            if (cell) return cell;
        }
        return null;
    }

    getCellByFieldId(fieldId) {
        for (let row of this.tableRows) {
            const cell = row.cells.find(c => c.field && c.field.id === fieldId);
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
        const tableCells = this.template.querySelectorAll('.table-cell');
        tableCells.forEach(cell => {
            cell.style.border = this.isBordersVisible ? '1px solid #ddd' : 'none';
            if (!this.isBordersVisible) {
                cell.classList.remove('selected-cell');
            }
        });

        if (!this.isBordersVisible) {
            this.selectedCells = [];
        }
    }

    


    @track Name__c = ''; // Add this to define Name__c property

    // handleFormTypeChange(event) {
    //     this.selectedFormType = event.target.value;
    //     console.log('Form Type Selected:', this.selectedFormType);
    // }


    handleFormTypeChange(event) {
        const selectedValue = event.target.value;
    
        if (selectedValue === 'Other') {
            this.showFormTypeModal = true;
            this.customFormTypeInput = '';
        } else {
            this.selectedFormType = selectedValue;
        }
    }
    
    handleCustomFormTypeInputChange(event) {
        const input = event.target.value;
    
        if (input.length > 20) {
            this.showToast('Error', 'Form Type must be at most 20 characters.', 'error');
            this.customFormTypeInput = ''; // Optionally clear input
        } else {
            this.customFormTypeInput = input;
        }
    }
    
    
    // Cancel modal
    handleCancelFormTypeModal() {
        this.showFormTypeModal = false;
    
        // Reset the dropdown back to empty if user cancels
        requestAnimationFrame(() => {
            const dropdown = this.template.querySelector('.form-dropdown');
            if (dropdown) dropdown.value = '';
        });
    }
    
    // Confirm modal
    handleConfirmFormTypeModal() {
        const trimmed = this.customFormTypeInput.trim();
    
        if (!trimmed) {
            this.showToast('Error', 'Please enter a valid form type.', 'error');
            return;
        }
    
        this.selectedFormType = trimmed;
        this.showFormTypeModal = false;
    
        requestAnimationFrame(() => {
            const dropdown = this.template.querySelector('.form-dropdown');
            if (dropdown) {
                // Add option if it doesn't exist already
                let exists = [...dropdown.options].some(opt => opt.value === trimmed);
                if (!exists) {
                    let newOption = document.createElement('option');
                    newOption.value = trimmed;
                    newOption.text = trimmed;
                    dropdown.appendChild(newOption);
                }
                dropdown.value = trimmed;
            }
        });
    
        console.log('Custom Form Type selected:', trimmed);
    }
    
    

    handleSend() {
        if (!this.selectedFormType || !this.isPreviewEnabled) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Please select a form type before sending the email.',
                variant: 'error',
            }));
            return;
        }
    
        const layoutContainer = this.template.querySelector('.excel-table');
        const headerContainer = this.template.querySelector('.header-table');
    
        if (!layoutContainer || !headerContainer) {
            console.error('Error: Layout or Header table is missing.');
            this.dispatchEvent(new ShowToastEvent({
                title: 'Error',
                message: 'Layout or Header table is missing.',
                variant: 'error',
            }));
            return;
        }
    
        // Construct the plain text email body
        const emailBody = this.constructEmailBody();
        console.log('Constructed Email Body:', emailBody);
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
                            ${Array.from(layoutContainer.rows).map(row => `
                                <tr>
                                    ${Array.from(row.cells).map(cell => {
                                        const rowspan = cell.getAttribute('rowspan') || 1;
                                        const colspan = cell.getAttribute('colspan') || 1;
    
                                        return `
                                            <td 
                                                style="height: ${rowspan * 60}px;" 
                                                colspan="${colspan}" 
                                                rowspan="${rowspan}">
                                                <div class="field-item">
                                                    ${cell.innerHTML}
                                                </div>
                                            </td>`;
                                    }).join('')}
                                </tr>`).join('')}
                        </table>
                    </div>
                    <div>
                        <h2 style="color: #333;">Captured Header</h2>
                        <table class="header-table">
                            ${Array.from(headerContainer.rows).map(row => `
                                <tr>
                                    ${Array.from(row.cells).map(cell => `
                                        <th>${cell.innerHTML}</th>
                                    `).join('')}
                                </tr>`).join('')}
                        </table>
                    </div>
                    <div class="email-body">
                        <h2>Details</h2>
                        <p>${this.constructEmailBody().replace(/\n/g, '<br>')}</p>
                    </div>
                </body>
            </html>
        `;
    
        // Call Apex to send the email
        sendEmailWithCustomBody({ htmlContent, plainTextBody: emailBody, formType: this.selectedFormType })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Email sent successfully!',
                    variant: 'success',
                }));
            })
            .catch(error => {
                console.error('Error sending email:', error);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'There was an error sending the email.',
                    variant: 'error',
                }));
            });
    }
    
    

    constructEmailBody() {
        // Start with the form type
        let emailBody = `Form Type: ${this.selectedFormType}\n\nForm Data:\n\n`;

        // Include sender name
        emailBody += `Sender Name: ${this.senderName}\n\n`;
    
        // Add the selected header fields section
        emailBody += 'Columns to be displayed in the table:\n';
        this.selectedHeaderFields.forEach(field => {
            emailBody += `- ${field.label}\n`;
        });
        emailBody += '\n'; // Add a blank line before the detailed field data
    
        // Add details for each field, but simplify the borders
        this.tableRows.forEach(row => {
            row.cells.forEach(cell => {
                if (cell.field) {
                    const details = this.getFieldDetails(cell.field);
                    emailBody += `-----------------------------------\n`;  // Simpler separator
                    emailBody += `Field Type      : ${cell.field.dataType}\n`;
                    emailBody += `Field Label     : ${cell.field.label}\n`;
                    emailBody += `Selected Option : ${details.option}\n`;
                    emailBody += `Additional Info : ${details.additional}\n`;
                    emailBody += `Comments        : ${cell.field.comments || '-'}\n`;
                    emailBody += `-----------------------------------\n\n`;  // Simpler separator
                }
            });
        });
    
        return emailBody;
    }
    
    // Helper method to get specific field details in plain text
    getFieldDetails(field) {
        switch (field.dataType) {
            case 'Text Field':
                return {
                    option: field.selectedTextFieldOption || 'None',
                    additional: field.selectedTextFieldOption === 'alphaNumeric'
                        ? `Length: ${field.alphaNumericLength || 'Not specified'}`
                        : field.selectedTextFieldOption === 'onlyAlphabets'
                        ? `Length: ${field.onlyAlphabetsLength || 'Not specified'}`
                        : field.selectedTextFieldOption === 'textArea'
                        ? 'Text Area (Max 255 Characters)'
                        : field.selectedTextFieldOption === 'richText'
                        ? 'Rich Text Field Enabled'
                        : '-'
                };

            case 'Number Field':
                return {
                    option: field.selectedNumberFieldOption || 'None',
                    additional: field.selectedNumberFieldOption === 'currency'
                        ? `Decimals: ${field.decimalValue || 'Not specified'}`
                        : field.selectedNumberFieldOption === 'contactNumber'
                        ? `Digits: ${field.contactNumberDigits || 'Not specified'}`
                        : '-'
                };
            case 'Date Field':
                return {
                    option: 'Date View',
                    additional: `Format: ${field.selectedDateFormat || 'Not specified'}`
                };
            case 'Dropdown Field':
                const options = field.selectedDropdownOption === 'multiSelect' ? field.multiSelectValues : field.singleSelectValues;
                return {
                    option: field.selectedDropdownOption || 'None',
                    additional: `Options: ${options || '-'}`
                };
            default:
                return { option: '-', additional: '-' };
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
        this.tableRows = this.tableRows.map(row => ({
            ...row,
            cells: row.cells.map(cell => ({
                ...cell,
                editKey: `${cell.id}-edit`,
                deleteKey: `${cell.id}-delete`
            }))
        }));
    }

    async handleSaveLayout() {
        try {
            if (!this.formTitle || !this.selectedFormType) {
                this.showToast('Error', 'Title and Form Type are required.', 'error');
                return;
            }
    
            // Determine the save type
            let actionType;
            if (!this.layoutId || this.isCloneMode) {
                actionType = 'new'; // Set as "new" if no layoutId or cloning
            } else {
                actionType = 'edit';
            }
    
            console.log(`Saving layout with actionType: ${actionType}`);
            console.log('Form Title:', this.formTitle);
            console.log('Intended layout Name (Name__c):', this.selectedFormType); // Log the exact layout name
            console.log('Form Module: ', this.selectedModuleType);
    
            const layoutData = JSON.stringify({
                tableRows: this.tableRows,
                layoutFields: this.layoutFields,
                selectedFormType: this.selectedFormType,
                selectedModuleType: this.selectedModuleType
            });
    
            // Call Apex method with the appropriate actionType and layoutName (Name__c)
            const savedLayoutName = await saveLayout({
                layoutData,
                layoutName: actionType === 'new' ? this.selectedFormType : this.layoutId,  // Use `selectedFormType` for new layouts
                title: this.formTitle,
                actionType: actionType,
                orgId: this.orgid,
                formModule: this.selectedModuleType 
            });

            this.lastSavedState = layoutData; // Store the current state as the last saved state
            this.hasChanges = false;
    
            this.showToast('Success', `Form saved successfully with Name: ${savedLayoutName}`, 'success');
        } catch (error) {
            console.error('Error saving layout:', error);
            this.showToast('Error', 'Failed to save layout.', 'error');
        }

        this.saveTemplate = false;
        this.isFormSaved = true;

    }
    
    isLayoutChanged() {
        const currentState = JSON.stringify({
            tableRows: this.tableRows,
            layoutFields: this.layoutFields,
            selectedFormType: this.selectedFormType,
        });
        return currentState !== this.lastSavedState;
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    


    loadLayout(layout) {
        try {
            console.log('Loading layout data:', layout);  // Debug log
            if (!layout || !layout.layoutJson) {
                console.error('Error: layout or layout.layoutJson is missing');
                this.showToast('Error', 'No layout data found for loading.', 'error');
                return;
            }
    
            // Parse the JSON layout data
            this.layoutData = JSON.parse(layout.layoutJson);
            this.tableRows = this.layoutData.tableRows || [];
            this.selectedFormType = this.layoutData.selectedFormType || '';
            this.layoutId = layout.layoutId;  // Retain layoutId for future saves
            this.isViewingLayouts = false; // Switch to form editing mode
    
            // Set dropdown value after rendering
            requestAnimationFrame(() => {
                const dropdown = this.template.querySelector('.form-dropdown');
                if (dropdown) dropdown.value = this.selectedFormType;
            });
    
            console.log('Successfully loaded layout with ID:', this.layoutId);
        } catch (error) {
            console.error('Error parsing or loading layout:', error);
            this.showToast('Error', 'Failed to load layout data.', 'error');
        }
    }
    
    
    

    initializeLayout(layout) {
        if (layout && layout.Layout_JSON__c) {
            const layoutData = JSON.parse(layout.Layout_JSON__c);
            this.tableRows = layoutData.tableRows || [];
            this.selectedFormType = layoutData.selectedFormType || '';
            console.log('Layout data loaded successfully');
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
                this.formTitle = layoutData.title || ''; // Set the title
                this.tableRows = JSON.parse(layoutData.layoutJson).tableRows || []; // Load table structure
                this.selectedFormType = layoutData.layoutName; // Set the dropdown to the layout name
                console.log("Editing layout:", layoutData);

                // Disable the send email button initially
                this.isPreviewEnabled = false; // Reset preview mode
                this.isSendDisabled = true; // Disable send button on edit
                console.log("Editing layout:", layoutData);
    
                // Update dropdown value
                requestAnimationFrame(() => {
                    const dropdown = this.template.querySelector('.form-dropdown');
                    if (dropdown) dropdown.value = this.selectedFormType;
                });
    
                this.showToast('Success', 'Layout loaded for editing.', 'success');
            } else {
                this.showToast('Error', 'No layout data found for editing.', 'error');
            }
        } catch (error) {
            console.error('Error loading layout for editing:', error);
            this.showToast('Error', 'Failed to load layout for editing.', 'error');
        }
    }

    resetAllFields() {
        // Reset table rows and related states
        this.tableRows = [];
        this.selectedCells = [];
        this.layoutFields = [];
        this.selectedHeaderFields = [];
        this.selectedFormType = '';
        this.formTitle = '';
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
            const dropdown = this.template.querySelector('.form-dropdown');
            if (dropdown) dropdown.value = ''; // Reset dropdown to empty
        });
    
        console.log('All fields have been reset.');
    }
    
    
    async handleDeleteLayout(event) {
        try {
            const layoutId = event.target.dataset.id; // Retrieve the ID of the layout to delete
            await deleteLayout({ layoutName: layoutId }); // Call Apex to delete the layout
    
            // Refresh the layout list in layoutListComponent to reflect changes
            this.dispatchEvent(new CustomEvent('refreshlayouts'));
            this.showToast('Success', 'Layout deleted successfully.', 'success');
        } catch (error) {
            console.error('Error deleting layout:', error);
            this.showToast('Error', 'Failed to delete layout.', 'error');
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
    
    @track mainRadioOptions = ''; // User-entered dept options
@track radioSubInputs = []; // [{ option, subType, subValues }]
@track subInputTypes = [
    { label: 'Radio', value: 'radio' },
    { label: 'Dropdown', value: 'dropdown' },
    { label: 'Text Input', value: 'text' }
];
@track radioSubInputs = []; // [{ option, subType, subQuestion, subValues }]
@track predefinedSubOptions = [
    { label: 'Participant', value: 'Participant' },
    { label: 'Facility', value: 'Facility' },
    { label: 'Staff', value: 'Staff' }
];
@track inputTypeToggleOptions = [
    { label: 'Enter options', value: 'manual' },
    { label: 'Use predefined options', value: 'predefined' }
];

getInputTypeToggleValue(optionLabel) {
    const sub = this.radioSubInputs.find(r => r.option === optionLabel);
    return sub?.usePredefinedOptions ? 'predefined' : 'manual';
}


handleMainRadioOptionsChange(event) {
    this.mainRadioOptions = event.target.value;
    const options = this.mainRadioOptions.split('\n').map(o => o.trim()).filter(o => o);

    this.radioSubInputs = options.map(opt => {
        const existing = this.radioSubInputs.find(r => r.option === opt);
        const subType = existing?.subType || 'text';
        const isDropdown = subType === 'dropdown';
        const isRadio = subType === 'radio';

        const usePredefined = isDropdown ? (existing?.usePredefinedOptions || false) : false;

        return {
            option: opt,
            hasSubInput: existing?.hasSubInput || false,
            subType: subType,
            isDropdownType: isDropdown,
            isRadioType: isRadio,
            subQuestion: existing?.subQuestion || '',
            subValues: existing?.subValues || '',
            hasValues: isDropdown || isRadio,
            usePredefinedOptions: usePredefined,
            inputTypeToggleValue: usePredefined ? 'predefined' : 'manual',
            showManualOptions: !usePredefined,
            showPredefinedOptions: usePredefined,
            selectedPredefined: existing?.selectedPredefined || ''
        };
    });
}






handleSubQuestionChange(event) {
    const option = event.target.dataset.option;
    const value = event.target.value;
    this.radioSubInputs = this.radioSubInputs.map(sub =>
        sub.option === option ? { ...sub, subQuestion: value } : sub
    );
}

handleSubInputTypeChange(event) {
    const option = event.target.dataset.option;
    const value = event.target.value;

    this.radioSubInputs = this.radioSubInputs.map(sub => {
        if (sub.option === option) {
            const isDropdown = value === 'dropdown';
            const isRadio = value === 'radio';

            return {
                ...sub,
                subType: value,
                isDropdownType: isDropdown,   // ✅ added
                isRadioType: isRadio,         // ✅ optional if needed
                hasValues: isDropdown || isRadio,
                usePredefinedOptions: false,
                inputTypeToggleValue: 'manual',
                subValues: '',
                selectedPredefined: '',
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

    this.radioSubInputs = this.radioSubInputs.map(sub => {
        if (sub.option === option) {
            const isPredefined = selectedValue === 'predefined';
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

    this.radioSubInputs = this.radioSubInputs.map(sub =>
        sub.option === option ? { ...sub, selectedPredefined: value } : sub
    );
}



handleSubInputValuesChange(event) {
    const option = event.target.dataset.option;
    const value = event.target.value;
    this.radioSubInputs = this.radioSubInputs.map(sub =>
        sub.option === option ? { ...sub, subValues: value } : sub
    );
}

handleHasSubInputToggle(event) {
    const option = event.target.dataset.option;
    const checked = event.target.checked;

    this.radioSubInputs = this.radioSubInputs.map(sub => {
        if (sub.option === option) {
            return {
                ...sub,
                hasSubInput: checked,
                subQuestion: '',
                subType: 'text',
                subValues: '',
                hasValues: false
            };
        }
        return sub;
    });
}

    

    @track isPreviewModalOpen = false;
@track previewTableRows = [];

     
togglePreview(event) {
    this.isPreviewEnabled = event.target.checked;

    if (this.isPreviewEnabled) {
        // ✅ Check DOM for dropped fields inside the container
        const droppedFields = this.template.querySelectorAll('.excel-table-container .field-item.dropped');

        if (!droppedFields || droppedFields.length === 0) {
            this.isPreviewEnabled = false;
            this.isPreviewModalOpen = false;
            this.showToast('Warning', 'Please drag and drop at least one field to preview the form.', 'warning');
            return;
        }

        // ✅ Proceed if there is at least one dropped field
        this.generatePreviewRows();
        this.isPreviewModalOpen = true;
    } else {
        this.isPreviewModalOpen = false;
    }
}



closePreviewModal() {
    this.isPreviewModalOpen = false;
    this.isPreviewEnabled = false;
}
generatePreviewRows() {
    if (!this.tableRows || this.tableRows.length === 0) return;

    const previewRows = this.tableRows.map(row => {
        const newCells = row.cells.map(cell => {
            const field = cell.field || {};
            const dataType = field.dataType || '';

            const isTextArea = field.selectedTextFieldOption === 'textArea';
            const isAlphaNumeric = field.selectedTextFieldOption === 'alphaNumeric';
            const isOnlyAlphabets = field.selectedTextFieldOption === 'onlyAlphabets';
            const isRichText = field.selectedTextFieldOption === 'richText';

            const isCurrency = field.selectedNumberFieldOption === 'currency';
            const isContactNumber = field.selectedNumberFieldOption === 'contactNumber';
            const isDefaultNumber = field.selectedNumberFieldOption === 'defaultNumber';

            const isNumberField = dataType === 'Number Field';

            const isTimeField = dataType === 'Time Field';
            const isDateField = dataType === 'Date Field';
            const isCheckboxField = dataType === 'Checkbox Field';
            const isUploadField = dataType === 'Upload File';
            const isRadioButton = dataType === 'Radio Button';
            const isDropdownField = dataType === 'Dropdown Field';
            

            let placeholderText = field.label ? `Enter ${field.label}` : '';
            let maxLength = 255;

            if (isAlphaNumeric) {
                maxLength = parseInt(field.alphaNumericLength || '50');
                placeholderText += ` (AlphaNumeric)`;
            } else if (isOnlyAlphabets) {
                maxLength = parseInt(field.onlyAlphabetsLength || '50');
                placeholderText += ` (Alphabets Only)`;
            } else if (isTextArea) {
                placeholderText += ` (Max 255 chars)`;
            }

            let singleSelectOptions = [];
            if (isDropdownField && field.selectedDropdownOption === 'singleSelect' && field.singleSelectValues) {
                singleSelectOptions = field.singleSelectValues.split('\n').map(opt => ({
                    label: opt.trim(),
                    value: opt.trim(),
                    isSelected: field.value === opt.trim()
                })).filter(opt => opt.label);
            }

            let radioOptions = [];
            if (isRadioButton && field.radioOptions) {
                radioOptions = field.radioOptions.map(option => ({
                    ...option,
                    isChecked: field.value === option.optionLabel
                }));
            }
            let wrapperClass = 'floating-label';
                if (isTextArea) {
                    wrapperClass = 'floating-label-comments';
                } else if (isRadioButton) {
                    wrapperClass = 'floating-label-radio';
                }

                    console.log('Field:', field.label, 'Type:', field.dataType);
const shouldRender = !(field.dataType === 'Blank' || field.label === 'Page Break');

            return {
                ...cell,
                 wrapperClass,
                 shouldRender,
                field: {
                    ...field,
                    value: field.value || '',
                    isRequired: field.isRequired || false
                },
                isTextField: dataType === 'Text Field' && !isTextArea && !isAlphaNumeric && !isOnlyAlphabets && !isRichText,
                isAlphaNumeric,
                isOnlyAlphabets,
                isTextArea,
                isRichText,
                isCurrency,
                isContactNumber,
                isDefaultNumber,
                isNumberField,
                isTimeField,
                isDateField,
                isCheckboxField,
                isUploadField,
                isRadioButton,
                isDropdownField,
                placeholderText,
                maxLength,
                singleSelectOptions,
                radioOptions,
              floatingLabelStyle: (field.dataType !== 'Radio Button' && field.dataType !== 'Checkbox Field') ? 'border: 1px solid #000; border-radius: 6px;' : '',
            };
        });

        return { ...row, cells: newCells };
    });

    this.previewTableRows = previewRows;


}




    handleNewDesignClick() {
    this.newDesign = !this.newDesign;
    this.isViewingLayouts = false;

    // ✅ Reset layout state
    this.formTitle = '';
    // this.selectedFormType = '';
    // this.selectedModuleType = '';
    this.showFormTypeDropdown = false;
    this.tableRows = [];

    // ✅ Create fresh blank table
    this.createTable(5, 2);

    // ✅ Reset preview
    this.isPreviewEnabled = false;
    this.isSendDisabled = true;
    this.isCaptureDisabled = true;

    // ✅ Force dropdowns and toggles to reset after render
    // requestAnimationFrame(() => {
    //     const dropdown = this.template.querySelector('.form-dropdown');
    //     if (dropdown) dropdown.value = '';
    // });

    console.log('🆕 Started new design mode with clean state.');
}


// handleNewDesignClick() {
//     console.log('[formCreate] Clicked New Design button');

//     // 🛑 Check for unsaved changes
//     if (this.hasUnsavedChanges()) {
//         console.log('[formCreate] Unsaved changes detected. Showing confirmation popup.');
//         this.pendingAction = 'newDesign';
//         this.showConfirmationPopup = true;
//         return; // ❌ Don't reset form yet
//     }

//     // ✅ No unsaved changes, proceed with reset
//     this.newDesign = !this.newDesign;
//     this.isViewingLayouts = false;

//     // ✅ Reset layout state
//     this.formTitle = '';
//     this.selectedFormType = '';
//     // this.selectedModuleType = '';
//     this.showFormTypeDropdown = false;
//     this.tableRows = [];

//     // ✅ Create fresh blank table
//     this.createTable(5, 2);

//     // ✅ Reset preview
//     this.isPreviewEnabled = false;
//     this.isSendDisabled = true;
//     this.isCaptureDisabled = true;

//     // ✅ Force dropdowns and toggles to reset after render
//     requestAnimationFrame(() => {
//         const dropdown = this.template.querySelector('.form-dropdown');
//         if (dropdown) dropdown.value = '';

//         // const moduleDropdown = this.template.querySelector('.form-module-dropdown');
//         // if (moduleDropdown) moduleDropdown.value = '';
//     });

//     console.log('🆕 Started new design mode with clean state.');
// }



    handleCloneFromDefaults(event) {
    const layoutName = event.currentTarget.dataset.id;

    getDefaultFormLayout({ layoutName })
        .then(layoutData => {
            const parsedLayout = JSON.parse(layoutData.Form_JSON__c);

            const message = {
                layoutJSON: layoutData.Form_JSON__c,
                Name__c: layoutData.Name__c,
                title: layoutData.title || '',
                actionType: 'clone',
                formModule: layoutData.Form_Module__c
            };

            // ✅ Log the message before proceeding
            console.log('📤 Clone message being sent to loadClonedLayout:', JSON.stringify(message));

            this.newDesign = true;
            this.loadClonedLayout(message);
        })
        .catch(error => {
            console.error('❌ Error loading default layout for cloning:', error);
            this.showToast('Error', 'Failed to load default form.', 'error');
        });
}


get previewButtonLabel() {
    return this.isPreviewEnabled ? 'Exit Preview' : 'Preview';
}

get previewButtonVariant() {
    return this.isPreviewEnabled ? 'destructive' : 'brand'; // Or 'neutral'
}

get previewIcon() {
    return this.isPreviewEnabled ? 'utility:close' : 'utility:preview';
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
  if (value && value.actionType === 'edit' && value.layoutJSON) {
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

handleConfirmPublish() {
    this.publishTempalte = true;

}

handleSaveClose() {
    this.saveTemplate = false;
}

handleConfirmSaveLayout() {
    this.saveTemplate = true;
    this.showConfirmationPopup = false;
}

@api hasUnsavedChanges() {
    console.log('[formCreate] Checking unsaved changes... isFormSaved:', this.isFormSaved);
    return !this.isFormSaved;
}




@api
triggerUnsavedChangesPopup(tabName) {
    this.pendingTabNavigation = tabName;
    this.showConfirmationPopup = true;
}

handleConfirmNavigation() {
    this.showConfirmationPopup = false;
    this.dispatchEvent(new CustomEvent('navigateaway', {
        detail: { tab: this.pendingTabNavigation }
    }));
    this.pendingTabNavigation = null;
}

handleCancelNavigation() {
    this.showConfirmationPopup = false;
    this.pendingTabNavigation = null;
}

@track isFormSaved = true;
@track showConfirmationPopupNew = false;

handleConfirmNavigationNew() {
    console.log('[formCreate] Confirmed new design after unsaved warning');
    this.showConfirmationPopupNew = false;

    if (this.pendingAction === 'newDesign') {
        this.newDesign = false;
        this.isViewingLayouts = false;
        this.formTitle = '';
        this.selectedFormType = '';
        this.showFormTypeDropdown = false;
        this.tableRows = [];

        this.createTable(5, 2);
        this.isPreviewEnabled = false;
        this.isSendDisabled = true;
        this.isCaptureDisabled = true;
        this.isFormSaved = false;

        requestAnimationFrame(() => {
            const dropdown = this.template.querySelector('.form-dropdown');
            if (dropdown) dropdown.value = '';
        });

        console.log('🆕 Resumed new design after confirmation.');
    }

    this.pendingAction = null;
}

handleCancelPopupNew() {
    this.showConfirmationPopupNew = false;
    this.pendingAction = null;
}


}