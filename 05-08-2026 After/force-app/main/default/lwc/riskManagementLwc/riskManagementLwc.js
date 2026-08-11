import { LightningElement,track,wire,api } from 'lwc';
import getRiskMatrix from '@salesforce/apex/RiskMatrixController.getRiskMatrix';
import insertRiskRecords from '@salesforce/apex/RiskMatrixController.insertRiskRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRiskRecords from '@salesforce/apex/RiskMatrixController.getRiskRecords'; 
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';

export default class RiskManagementLwc extends LightningElement {
    @api clientId;
    @track isOpenModal = false;
    @track isOpenModalFlag = false;
    @track displayedRiskRecords = [];
    @track recentEmpData = [];
    @track staffFeedbackData = false;
    @track staffFeedbackNoData = false;
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number
    @track showSpinner=false;
    @api recordId = '';
    file; //holding file instance
    myFile;    
    fileType;//holding file type
    fileReaderObj;
    base64FileData;
    @track fileName;
    @track doc;
    @track fileSize;
    @track currentUrl;
    @track isattachError=false;
    @track isFileAttached=false;
    @track isSaveDisabled = true;
    @track submissionFlag=false;

    @track manualHandling = [];
    @track mealManagement = [];
    @track medicalConditions = [];
    @track behaviouralMentalHealth = [];
    @track identificationLegal = [];
    @track moneyHandling = [];
    @track environmentalSocial = [];
    @track riskyBehaviours = [];
    @track relationships = [];
    @track homeSupport = [];
    @track mobility = [];
    @track biological = [];
    @track otherMedicalConditons=[];
    @track livesAlone = false;
    
    @track selectedCategories = [];
      
  

    handleRiskManagement(){        
        this.isOpenModal = true;
        console.log('New Risk Create :' +this.isOpenModal);
        this.isOpenModalFlag = true;
        this.fileName='';
        this.isViewModalOpen = false;
        this.selectedCategories = [];
        this.isSaveDisabled = true;
    }

    hideModalBox() {
        this.isOpenModal = false;
        if (this.selectedCategories && this.selectedCategories.length > 0) {
            this.selectedCategories = [];
        } else {
            console.log('Selected Categories:', this.selectedCategories);
        }
        this.isOpenModalFlag = false;
        this.isViewModalOpen = false;
        this.currentUrl = null;
        console.log('Closes Risk :' +this.isOpenModal);
        refreshApex(this.wiredFeedbackData);
    }

    closeRiskManagement(){
        this.isOpenModalFlag = false;
        this.currentUrl = null;
        this.isOpenModal = false;
    }
    
    @track sectionFlags = {
        RiskDetails: true,
        RiskManage: false,  
    };

    @track sectionIcons = {
        RiskDetails: '\u2B9F', 
        RiskManage: '\u2B9C',
    };
    
    get manualHandlingOptions() {
        return [
            { label: 'Posture/Repetitive Movements', value: 'Posture/Repetitive Movements', uniqueId: 1743402853067 },
            { label: 'Lifting/Carrying/Push/Pull', value: 'Lifting/Carrying/Push/Pull', uniqueId: 1743402854105 },
            { label: 'Other manual handling needs/supports', value: 'Other manual handling needs/supports', uniqueId: 1743402855308 },
            { label: 'Other', value: 'Other', uniqueId: 1743402856409 }
        ];
    }
    
    get mealManagementOptions() {
        return [
            { label: 'Dysphagia – Likely to choke on food', value: 'Dysphagia – Likely to choke on food', uniqueId: 1743402857501 },
            { label: 'Severe Dysphagia', value: 'Severe Dysphagia', uniqueId: 1743402858502 },
            { label: 'Medical dietary needs', value: 'Medical dietary needs', uniqueId: 1743402859503 },
            { label: 'Food Allergies', value: 'Food Allergies', uniqueId: 1743402860504 },
            { label: 'Enteral Feeding (PEG management plan required in addition to MMP)', value: 'Enteral Feeding (PEG management plan required in addition to MMP)', uniqueId: 1743402861505 }
        ];
    }
    
    get identificationLegalOptions() {
        return [
            { label: 'Awareness of own information (name, address, phone numbers, next of kin)', value: 'Awareness of own information (name, address, phone numbers, next of kin)', uniqueId: 1743402862506 },
            { label: 'Guardianship/Administrator in place', value: 'Guardianship/Administrator in place', uniqueId: 1743402863507 },
            { label: 'Support needed to use mobile', value: 'Support needed to use mobile', uniqueId: 1743402864508 },
            { label: 'Legal issues – Historical or current', value: 'Legal issues – Historical or current', uniqueId: 1743402865509 },
            { label: 'Other', value: 'Other', uniqueId: 1743402866510 }
        ];
    }
    
    // Money Handling
    get moneyHandlingOptions() {
        return [
            { label: 'Support needed to make purchases', value: 'Support needed to make purchases', uniqueId: 1743402867511 },
            { label: 'Support needed to carry money', value: 'Support needed to carry money', uniqueId: 1743402868512 },
            { label: 'Other', value: 'Other', uniqueId: 1743402869513 }
        ];
    }
    
    // Medical Conditions
    get medicalConditionsOptions() {
        return [
            { label: 'Epilepsy – Complete Epilepsy management plan', value: 'Epilepsy – Complete Epilepsy management plan', uniqueId: 1743402870514 },
            { label: 'Incontinence', value: 'Incontinence', uniqueId: 1743402871515 },
            { label: 'Respiratory conditions', value: 'Respiratory conditions', uniqueId: 1743402872516 },
            { label: 'Diabetes – Complete diabetes management plan', value: 'Diabetes – Complete diabetes management plan', uniqueId: 1743402873517 },
            { label: 'Skin conditions/Wound conditions', value: 'Skin conditions/Wound conditions', uniqueId: 1743402874518 },
            { label: 'High risk to sun exposure', value: 'High risk to sun exposure', uniqueId: 1743402875519 },
            { label: 'Support needed to take medication, includes subcutaneous injection – Complete medication management plan', value: 'Support needed to take medication, includes subcutaneous injection – Complete medication management plan', uniqueId: 1743402876520 },
            { label: 'Allergies', value: 'Allergies', uniqueId: 1743402877521 },
            { label: 'Special dietary needs', value: 'Special dietary needs', uniqueId: 1743402878522 },
            { label: 'General health and wellbeing', value: 'General health and wellbeing', uniqueId: 1743402879523 },
            { label: 'Other', value: 'Other', uniqueId: 1743402880524 }
        ];
    }
    
    // Behavioural & Mental Health
    get behaviouralMentalHealthOptions() {
        return [
            { label: 'Likely to become physically aggressive', value: 'Likely to become physically aggressive', uniqueId: 1743402881525 },
            { label: 'Likely to become verbally aggressive', value: 'Likely to become verbally aggressive', uniqueId: 1743402882526 },
            { label: 'Likely to use a weapon', value: 'Likely to use a weapon', uniqueId: 1743402883527 },
            { label: 'Exhibits sexual/Predatory behaviours', value: 'Exhibits sexual/Predatory behaviours', uniqueId: 1743402884528 },
            { label: 'Self-harm/Suicide risk – Historical and current', value: 'Self-harm/Suicide risk – Historical and current', uniqueId: 1743402885529 },
            { label: 'Likely to overeat or become sick/unwell', value: 'Likely to overeat or become sick/unwell', uniqueId: 1743402886530 },
            { label: 'Likely to experience a panic reaction', value: 'Likely to experience a panic reaction', uniqueId: 1743402887531 },
            { label: 'Historical psychosis/Hallucinations', value: 'Historical psychosis/Hallucinations', uniqueId: 1743402888532 },
            { label: 'Other', value: 'Other', uniqueId: 1743402889533 }
        ];
    }
    
    // Environmental & Social
    get environmentalSocialOptions() {
        return [
            { label: 'Support needed with road safety', value: 'Support needed with road safety', uniqueId: 1743402890534 },
            { label: 'Support needed to travel in vehicle or public transport', value: 'Support needed to travel in vehicle or public transport', uniqueId: 1743402891535 },
            { label: 'Support needed to navigate local area', value: 'Support needed to navigate local area', uniqueId: 1743402892536 },
            { label: 'Support needed in the community', value: 'Support needed in the community', uniqueId: 1743402893537 },
            { label: 'Support needed with religious/spiritual beliefs', value: 'Support needed with religious/spiritual beliefs', uniqueId: 1743402894538 },
            { label: 'Support to contact/access emergency services as needed', value: 'Support to contact/access emergency services as needed', uniqueId: 1743402895539 },
            { label: 'Lives in bushfire-prone area – Complete Emergency plan', value: 'Lives in bushfire-prone area – Complete Emergency plan', uniqueId: 1743402896540 },
            { label: 'Other', value: 'Other', uniqueId: 1743402897541 }
        ];
    }
    
    // Relationships
    get relationshipOptions() {
        return [
            { label: 'Relationship breakdown or challenges', value: 'Relationship breakdown or challenges', uniqueId: 1743402898542 },
            { label: 'Children – Arrangements for care, child protection involvements, etc.', value: 'Children – Arrangements for care, child protection involvements, etc.', uniqueId: 1743402899543 },
            { label: 'Mentioning of certain family members names', value: 'Mentioning of certain family members names', uniqueId: 1743402900544 },
            { label: 'Other', value: 'Other', uniqueId: 1743402901545 }
        ];
    }
    
    get biologicalOptions() {
        return [
            { label: 'Transfer of disease/infection', value: 'Transfer of disease/infection', uniqueId: 1743402902546 },
            { label: 'Personal Hygiene', value: 'Personal Hygiene', uniqueId: 1743402903547 },
            { label: 'Other', value: 'Other', uniqueId: 1743402904548 }
        ];
    }
    
    get mobilityOptions() {
        return [
            { label: 'Unsteady', value: 'Unsteady', uniqueId: 1743402905549 },
            { label: 'Likely to wander or abscond', value: 'Likely to wander or abscond', uniqueId: 1743402906550 },
            { label: 'Activity related slips/trips & falls possible', value: 'Activity related slips/trips & falls possible', uniqueId: 1743402907551 },
            { label: 'Use of aides/wheelchair (List type below)', value: 'Use of aides/wheelchair (List type below)', uniqueId: 1743402908552 },
            { label: 'Transfer required (List type below)', value: 'Transfer required (List type below)', uniqueId: 1743402909553 },
            { label: 'Other', value: 'Other', uniqueId: 1743402910554 }
        ];
    }
    
    get riskyBehavioursOptions() {
        return [
            { label: 'Gambling issues', value: 'Gambling issues', uniqueId: 1743402911555 },
            { label: 'Excessive alcohol issue – complete individual risk assessment', value: 'Excessive alcohol issue – complete individual risk assessment', uniqueId: 1743402912556 },
            { label: 'Illicit drug use – Complete individual risk assessment', value: 'Illicit drug use – Complete individual risk assessment', uniqueId: 1743402913557 },
            { label: 'Family violence – Complete individual risk assessment', value: 'Family violence – Complete individual risk assessment', uniqueId: 1743402914558 },
            { label: 'Criminal activity or behaviour', value: 'Criminal activity or behaviour', uniqueId: 1743402915559 },
            { label: 'Aggressive behaviour towards employees or others – history or current', value: 'Aggressive behaviour towards employees or others – history or current', uniqueId: 1743402916560 },
            { label: 'Other', value: 'Other', uniqueId: 1743402917561 }
        ];
    }
    
    get homeSupportOptions() {
        return [
            { label: 'Unstable home environment', value: 'Unstable home environment', uniqueId: 1743402918562 },
            { label: 'Home safety assessment completed', value: 'Home safety assessment completed', uniqueId: 1743402919563 },
            { label: 'Other', value: 'Other', uniqueId: 1743402920564 }
        ];
    }
    
    get livesAloneOptions() {
        return [
            { label: 'Complete individual risk assessment', value: 'yes', uniqueId: 1743402921565 }
        ];
    }
    
    get medicalConditionsOption() {
        return [
            { label: 'Complex Bowel', value: 'Complex Bowel', uniqueId: 1743402922566 },
            { label: 'Urinary Catheter Care', value: 'Urinary Catheter Care', uniqueId: 1743402923567 },
            { label: 'Tracheostomy Care', value: 'Tracheostomy Care', uniqueId: 1743402924568 },
            { label: 'Other', value: 'Other', uniqueId: 1743402925569 }
        ];
    }

    @track isLivingAlone = false;
    handleCheckboxChange(event) {
        this.isLivingAlone = event.target.checked;
        console.log('Living alone:', this.isLivingAlone);
    }

    handleChange(event) {
        this.selectedValue = event.detail.value; // Updates selected value
    }

    @track categoryGroups = [];
    handleSelection(event) {
        const { name } = event.target;
        let value = event.target.value;
    
        console.log(`handleSelection called with name: ${name} and value: ${value}`);
    
        // Check if the value contains commas and split it, otherwise wrap it in an array
        let selectedValues = value.includes(',') ? value.split(',') : [value];
        console.log(`Selected Values:`, JSON.stringify(selectedValues));
    
        // Handle checkbox selection for each category using switch-case
        switch (name) {
            case 'manualHandling':
                console.log('Handling Manual Handling selection');
                selectedValues.forEach(val => this.toggleSelection(this.manualHandling, val.trim(), 'Manual Handling'));
                break;
            case 'mealManagement':
                console.log('Handling Meal Management selection');
                selectedValues.forEach(val => this.toggleSelection(this.mealManagement, val.trim(), 'Meal Management'));
                break;
            case 'medicalConditions':
                console.log('Handling Medical Conditions selection');
                selectedValues.forEach(val => this.toggleSelection(this.medicalConditions, val.trim(), 'Medical Conditions'));
                break;
            case 'behaviouralMentalHealth':
                console.log('Handling Behavioural & Mental Health selection');
                selectedValues.forEach(val => this.toggleSelection(this.behaviouralMentalHealth, val.trim(), 'Behavioural & Mental Health'));
                break;
            case 'identificationLegal':
                console.log('Handling Identification Legal selection');
                selectedValues.forEach(val => this.toggleSelection(this.identificationLegal, val.trim(), 'Identification Legal'));
                break;
            case 'moneyHandling':
                console.log('Handling Money Handling selection');
                selectedValues.forEach(val => this.toggleSelection(this.moneyHandling, val.trim(), 'Money Handling'));
                break;
            case 'environmentalSocial':
                console.log('Handling Environmental & Social Needs selection');
                selectedValues.forEach(val => this.toggleSelection(this.environmentalSocial, val.trim(), 'Environmental & Social Needs'));
                break;
            case 'riskyBehaviours':
                console.log('Handling Risky or Unsafe Behaviours selection');
                selectedValues.forEach(val => this.toggleSelection(this.riskyBehaviours, val.trim(), 'Risky or Unsafe Behaviours'));
                break;
            case 'relationships':
                console.log('Handling Relationships selection');
                selectedValues.forEach(val => this.toggleSelection(this.relationships, val.trim(), 'Relationships - Carer, Family Members, Other Support Providers'));
                break;
            case 'homeSupport':
                console.log('Handling Supports to be provided in Home Environment selection');
                selectedValues.forEach(val => this.toggleSelection(this.homeSupport, val.trim(), 'Supports to be provided in Home Environment'));
                break;
            case 'mobility':
                console.log('Handling Movement/Mobility selection');
                selectedValues.forEach(val => this.toggleSelection(this.mobility, val.trim(), 'Movement/Mobility'));
                break;
            case 'otherMedicalConditons':
                console.log('Handling Other Medical Conditions selection');
                selectedValues.forEach(val => this.toggleSelection(this.mobility, val.trim(), 'Medical Conditions'));
                break;
            case 'biological':
                console.log('Handling Biological/Infection Control selection');
                selectedValues.forEach(val => this.toggleSelection(this.biological, val.trim(), 'Biological/Infection Control'));
                break;
            case 'livesAlone':
                console.log(`Lives Alone checkbox selected: ${event.target.checked}`);
                this.livesAlone = event.target.checked;
                break;
            default:
                console.log('Unknown category name:', name);
                break;
        }
    }
    

   /* handleSelection(event) { 
        const { name, value } = event.target;
        console.log(`handleSelection called with name: ${name} and value: ${value}`);

        // Handle checkbox selection for each category using switch-case
        switch (name) {
            case 'manualHandling':
                console.log('Handling Manual Handling selection');
                this.toggleSelection(this.manualHandling, value, 'Manual Handling');
                break;
            case 'mealManagement':
                console.log('Handling Meal Management selection');
                this.toggleSelection(this.mealManagement, value, 'Meal Management');
                break;
            case 'medicalConditions':
                console.log('Handling Medical Conditions selection');
                this.toggleSelection(this.medicalConditions, value, 'Medical Conditions');
                break;
            case 'behaviouralMentalHealth':
                console.log('Handling Behavioural & Mental Health selection');
                this.toggleSelection(this.behaviouralMentalHealth, value, 'Behavioural & Mental Health');
                break;
            case 'identificationLegal':
                console.log('Handling Identification Legal selection');
                this.toggleSelection(this.identificationLegal, value, 'Identification Legal');
                break;
            case 'moneyHandling':
                console.log('Handling Money Handling selection');
                this.toggleSelection(this.moneyHandling, value, 'Money Handling');
                break;
            case 'environmentalSocial':
                console.log('Handling Environmental & Social Needs selection');
                this.toggleSelection(this.environmentalSocial, value, 'Environmental & Social Needs');
                break;
            case 'riskyBehaviours':
                console.log('Handling Risky or Unsafe Behaviours selection');
                this.toggleSelection(this.riskyBehaviours, value, 'Risky or Unsafe Behaviours');
                break;
            case 'relationships':
                console.log('Handling Relationships selection');
                this.toggleSelection(this.relationships, value, 'Relationships - Carer, Family Members, Other Support Providers');
                break;
            case 'homeSupport':
                console.log('Handling Supports to be provided in Home Environment selection');
                this.toggleSelection(this.homeSupport, value, 'Supports to be provided in Home Environment');
                break;
            case 'mobility':
                console.log('Handling Movement/Mobility selection');
                this.toggleSelection(this.mobility, value, 'Movement/Mobility');
                break;
            case 'otherMedicalConditons':
                console.log('Handling Movement/Mobility selection');
                this.toggleSelection(this.mobility, value, 'Medical Conditions');
                break;
            case 'biological':
                console.log('Handling Biological/Infection Control selection');
                this.toggleSelection(this.biological, value, 'Biological/Infection Control');
                break;
            case 'livesAlone':
                console.log(`Lives Alone checkbox selected: ${event.target.checked}`);
                this.livesAlone = event.target.checked;
                break;
            default:
                console.log('Unknown category name:', name);
                break;
        }
    } */

// This function handles the selection and updates the categoryGroups array
toggleSelection(array, value, area) {
    console.log(`toggleSelection called for area: ${area} with value: ${value}`);

    const option = this.getOption(area, value); // Get the selected option object
    console.log(`Option found:`, option);

    if (!option) {
        console.log(`No option found for area: ${area} and value: ${value}`);
        return; // If no option found, return
    }

    const index = array.indexOf(value);
    if (index === -1) {
        // Add the value to the selection
        console.log(`Value '${value}' not in array, adding it.`);
        array.push(value);

        // Add the selected value to the categoryGroups array
        this.categoryGroups.push({
            area,
            category: value,
            uniqueId: option.uniqueId,
            fileName: ""  // Optional: you can add the logic for fileName if needed
        });

        console.log(`Added to categoryGroups:`, this.categoryGroups);
    } else {
        // Remove the value from the selection
        console.log(`Value '${value}' already in array, removing it.`);
        array.splice(index, 1);

        // Remove the corresponding entry from the categoryGroups array
        this.categoryGroups = this.categoryGroups.filter(item => item.uniqueId !== option.uniqueId);
        console.log('Updated categoryGroups after removal:', this.categoryGroups);
    }
}
    
    // Helper method to get the option object by area and value
    getOption(area, value) {
        console.log(`getOption called for area: ${area} and value: ${value}`);
        switch (area) {
            case 'manualHandling':
                console.log('manualHandlingOptions:', JSON.stringify(this.manualHandlingOptions)); // Log the options list
                // Using a for loop to find the matching option
                for (let i = 0; i < this.manualHandlingOptions.length; i++) {
                    console.log(`Comparing "${value}" with "${this.manualHandlingOptions[i].value}"`);
                    if (this.manualHandlingOptions[i].value == value.trim()) {
                        console.log('Option found:', this.manualHandlingOptions[i]);
                        return this.manualHandlingOptions[i]; // Return the first match
                    }
                }
                console.log(`No option found for area: ${area} and value: ${value}`);
                return null; // Return null if no match found
    
            case 'mealManagement':
                for (let i = 0; i < this.mealManagementOptions.length; i++) {
                    if (this.mealManagementOptions[i].value === value) {
                        return this.mealManagementOptions[i];
                    }
                }
                return null;
    
            case 'Medical Conditions':
                for (let i = 0; i < this.medicalConditionsOptions.length; i++) {
                    if (this.medicalConditionsOptions[i].value === value) {
                        return this.medicalConditionsOptions[i];
                    }
                }
                return null;
    
            case 'Behavioural & Mental Health':
                for (let i = 0; i < this.behaviouralMentalHealthOptions.length; i++) {
                    if (this.behaviouralMentalHealthOptions[i].value === value) {
                        return this.behaviouralMentalHealthOptions[i];
                    }
                }
                return null;
    
            case 'Identification Legal':
                for (let i = 0; i < this.identificationLegalOptions.length; i++) {
                    if (this.identificationLegalOptions[i].value === value) {
                        return this.identificationLegalOptions[i];
                    }
                }
                return null;
    
            case 'Money Handling':
                for (let i = 0; i < this.moneyHandlingOptions.length; i++) {
                    if (this.moneyHandlingOptions[i].value === value) {
                        return this.moneyHandlingOptions[i];
                    }
                }
                return null;
    
            case 'Environmental & Social Needs':
                for (let i = 0; i < this.environmentalSocialOptions.length; i++) {
                    if (this.environmentalSocialOptions[i].value === value) {
                        return this.environmentalSocialOptions[i];
                    }
                }
                return null;
    
            case 'Risky or Unsafe Behaviours':
                for (let i = 0; i < this.riskyBehavioursOptions.length; i++) {
                    if (this.riskyBehavioursOptions[i].value === value) {
                        return this.riskyBehavioursOptions[i];
                    }
                }
                return null;
    
            case 'Relationships - Carer, Family Members, Other Support Providers':
                for (let i = 0; i < this.relationshipOptions.length; i++) {
                    if (this.relationshipOptions[i].value === value) {
                        return this.relationshipOptions[i];
                    }
                }
                return null;
    
            case 'Supports to be provided in Home Environment':
                for (let i = 0; i < this.homeSupportOptions.length; i++) {
                    if (this.homeSupportOptions[i].value === value) {
                        return this.homeSupportOptions[i];
                    }
                }
                return null;
    
            case 'Movement/Mobility':
                for (let i = 0; i < this.mobilityOptions.length; i++) {
                    if (this.mobilityOptions[i].value === value) {
                        return this.mobilityOptions[i];
                    }
                }
                return null;
    
            case 'Biological/Infection Control':
                for (let i = 0; i < this.biologicalOptions.length; i++) {
                    if (this.biologicalOptions[i].value === value) {
                        return this.biologicalOptions[i];
                    }
                }
                return null;
    
            case 'Other Medical Conditions':
                for (let i = 0; i < this.medicalConditionsOption.length; i++) {
                    if (this.medicalConditionsOption[i].value === value) {
                        return this.medicalConditionsOption[i];
                    }
                }
                return null;
    
            default:
                return null;
        }
    }
    
    @track isLivingAlone = false; // Default value

    handleCheckboxChange(event) {
        this.isLivingAlone = event.target.checked;
    }

    handleSave() {
        console.log("Saved selections:", this.selectedValues);
        alert("Selections saved successfully!");
    }

    @track sectionFlags = {
        RiskDetails: true,
        RiskManage: false,  
    };

    @track sectionIcons = {
        RiskDetails: '\u2B9F', 
        RiskManage: '\u2B9C',
    };

    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id;
        const sectionElement = this.template.querySelector(`[data-section="${sectionId}"]`);
    
        if (!this.sectionFlags[sectionId]) {
            // First click: Set the section to true so it loads in the DOM
            this.sectionFlags[sectionId] = true;
        } else {
            // From second click onwards: Just toggle the hidden-section class
            sectionElement.classList.toggle('hidden-section');
        }
    
        // Toggle the icon dynamically
        this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
    } 

    handleOtherTextChange(event) {
        const categoryGroup = event.currentTarget.dataset.group;
        const value = event.target.value;
        const optionValue = event.currentTarget.dataset.id;
    
        this.selectedCategories = this.selectedCategories.map(item => {
            if (item.category === 'Other' && item.area === categoryGroup) {
                return { ...item, otherText: value, value: optionValue };
            }
            return item;
        });
    
        console.log('Updated Other Text:', JSON.stringify(this.selectedCategories));
    }        

    impactOptions = [
        { label: 'Participant', value: 'Participant' },
        { label: 'Employee', value: 'Employee' }
    ];

    likelihoodOptions = [
        { label: 'Frequent', value: 'Frequent' },
        { label: 'Likely', value: 'Likely' },
        { label: 'Possible', value: 'Possible' },
        { label: 'Unlikely', value: 'Unlikely' },
        { label: 'Rare', value: 'Rare' }
    ];

    consequencesOptions = [
        { label: 'Insignificant', value: 'Insignificant' },
        { label: 'Minor', value: 'Minor' },
        { label: 'Moderate', value: 'Moderate' },
        { label: 'Major', value: 'Major' },
        { label: 'Catastrophic', value: 'Catastrophic' }
    ];

    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }
    
    riskMatrixData = {};

    @wire(getRiskMatrix)
    wiredRiskMatrix({ error, data }) {
        if (data) {
            this.riskMatrixData = data;
        } else if (error) {
            console.error('Error fetching Risk Matrix', error);
        }
    }

    // Check if all required fields are completed
    checkIfAllCompleted() {
        this.isSaveDisabled = this.selectedCategories.some(row => 
            !row.impact || !row.likelihood || !row.consequences || !row.strategy || !row.responsiblePerson || !row.dateCompleted
        );
    }

    handleInputChange(event) {
        const { dataset, value } = event.target;
        const category = dataset.id;
        const area=dataset.area;
        console.log('category '+category);
        console.log('area '+area);
        const fieldName = dataset.field;
    
        let row = this.selectedCategories.find(item => item.category === category);
        console.log('rows '+JSON.stringify(row));
        if (row) {
            row[fieldName] = value;
    
            if (row.likelihood && row.consequences) {
                const key = `${row.likelihood}_${row.consequences}`;
                row.riskRating = this.riskMatrixData[key] || 'N/A';
            }
    
            this.selectedCategories = [...this.selectedCategories];
            this.riskRecords = [];
    
            this.riskRecords = this.selectedCategories.map(item => ({
                Id: item.Id,
                area: item.area || "",
                category: item.category || "",
                impact: item.impact || null,
                likelihood: item.likelihood || null,
                consequences: item.consequences || null,
                riskRating: item.riskRating || null,
                strategy: item.strategy || null,
                responsiblePerson: item.responsiblePerson || null,
                dateCompleted: item.dateCompleted || null,
                clientId: item.clientId || this.clientId,
                uniqueId: item.uniqueId || null,
                fileName: item.fileName || "",
                otherText: item.otherText || ""
            }));
        }    
        this.checkIfAllCompleted();
    }
        
    @track riskRecords = [
        {     
            Id: null,      
            area: "",
            category: "",
            impact: "",
            likelihood: "",
            consequences: "",
            riskRating: "",
            strategy: "",
            responsiblePerson: "",
            dateCompleted: "",
            clientId:"",
            uniqueId:"",
            fileName:"",
            otherText:""
        }
    ];

    handlesubmissionclose(event){
        this.submissionFlag=false;
    }

    handleConfirmation(event){ 
       // this.submissionFlag=true;
        if (this.riskRecords.length === 0) {
            this.showToast('Error', 'No records to save', 'error');
            return;
        }
    
        // Validate required fields before saving
        let isValid = true;
        let missingFields = [];
    
        this.riskRecords.forEach(record => {
            if (!record.impact || !record.likelihood || !record.consequences || !record.responsiblePerson || !record.strategy || !record.dateCompleted) {
                isValid = false;
                missingFields.push(record.category || "Unknown Category"); // Identify which category has missing values
            }
        });
    
        if (!isValid) {
            this.showToast('Error', 'Please fill all fields information.', 'error');
            return;
        }
    
        console.log('Before Insert : ' + JSON.stringify(this.riskRecords));
    
        insertRiskRecords({ riskRecordsJson: JSON.stringify(this.riskRecords) })
            .then(result => {
                this.showSpinner = true;
                console.log('Risk result ', JSON.stringify(result));
    
                let timeLength = result.length * 1000;
                result.forEach(item => {
                    let uploadRiskData = this.selectedCategories.find(cat => parseInt(cat.uniqueId) === parseInt(item.UniqueRefId__c));
                    console.log('uploadRiskData' + JSON.stringify(uploadRiskData));
                    
                    if (uploadRiskData && uploadRiskData.base64Data) {
                        uploadFile({ base64: uploadRiskData.base64Data, filename: uploadRiskData.fileName, recordId: item.Id, obj: 'RiskRecords' })
                            .then(result => { })
                            .catch(error => { });
                    }
                });
    
                setTimeout(() => {
                    refreshApex(this.wiredFeedbackData);
                    this.showSpinner = false;
                    this.selectedCategories = [];
                }, timeLength);
    
                this.showToast('Success', 'The changes to the Risk Management Plan have been saved successfully.', 'success');
                this.isOpenModalFlag = false;
                this.isOpenModal = false;
            })
            .catch(error => {
                this.showToast('Error message', error.body?.message || 'Failed to save records', 'error');
                this.showSpinner = false;
            });
    
        this.isOpenModalFlag = false;
        this.isOpenModal = false;
        this.submissionFlag=false;      
    }

    handleSave() {
        this.submissionFlag=true;       
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`; // Format as dd-mm-yyyy
    }

    wiredFeedbackData;

    @wire(getRiskRecords, { clientId: '$clientId' })
    wiredFeedback(response) {
      //  console.log('Response >> ' + JSON.stringify(response));
        
        this.wiredFeedbackData = response; // Store the wire result for refreshApex
        const { data, error } = response;

        if (data) {
           // console.log('Fetch Feedback > ' + JSON.stringify(data));
            let tempConList = [];

            data.forEach(record => {
                if (record) { // Ensure record exists
                    let tempRec = Object.assign({}, record);

                    tempRec.Name = record.Id ? '/' + record.Id : ''; 
                    tempRec.time = record.Date_Completed__c || 'N/A';
                    tempRec.rating = record.Risk_Index__c || ''; 
                    tempRec.category = record.Category__c || '';
                    tempRec.personResponsible = record.Person_Responsible__c || '';
                    tempRec.riskStrategy = record.Risk_Strategy__c || '';
                    tempRec.Area__c = record.Area__c || '';
                    tempRec.comments = record.Comments__c || 'No comments';
                    tempRec.AmazonURL = record.Amazon_URL__c || '';
                    tempRec.uniqueId=record.UniqueRefId__c || '';
                    tempRec.fileName=record.File_Name__c || '';                    
                   
                    tempRec.dateCompleted = record.Date_Completed__c ? this.formatDate(record.Date_Completed__c) : 'N/A';
                    tempRec.otherText=record.Other_Text__c || '';

                    console.log('Completed Date:', tempRec.dateCompleted);
                    console.log('Rating index >> ' + tempRec.rating);
                    tempConList.push(tempRec);
                }
            });
            this.displayedRiskRecords = tempConList;
            console.log('Processed Risk Records > ' + JSON.stringify(this.displayedRiskRecords));
            this.records = tempConList;
            this.totalRecords = data.length; // update total records count
            this.pageSize = this.pageSizeOptions[0]; // set pageSize with default value as first option
            this.pageNumber = 1;
            this.paginationHelper(); // Call your pagination method           
            this.staffFeedbackData = this.displayedRiskRecords.length > 0;
            this.staffFeedbackNoData = this.displayedRiskRecords.length === 0; 
           // this.showSpinner = false;
            this.isOpenModalFlag = false;
            this.isOpenModal = false;
        } else if (error) {
            console.error('Error fetching feedback:', JSON.stringify(error));
            this.displayedRiskRecords = [];  // Prevent UI crashes
        }
    }
    @track existingIndex = []; 

    handleEdit(event) {
        this.recordId = event.currentTarget.dataset.id;
        console.log('Record Id >> ' + this.recordId);
    
        if (!this.displayedRiskRecords || this.displayedRiskRecords.length === 0) {
            console.warn('displayedRiskRecords is empty or undefined.');
            return;
        }
    
        const recordToEdit = this.displayedRiskRecords.find(record => record.Id === this.recordId);
    
        if (recordToEdit) {
            console.log('Record Edit: ' + JSON.stringify(recordToEdit));
    
            if (!Array.isArray(this.selectedCategories)) {
                this.selectedCategories = [];
            }
    
            this.existingIndex = this.selectedCategories.findIndex(rec => rec.Id === this.recordId);
    
            const updatedRecord = {
                Id: recordToEdit.Id,
                area: recordToEdit.Area__c || 'N/A',
                category: recordToEdit.Category__c || 'N/A',
                riskRating: recordToEdit.Risk_Index__c || 'N/A',
                dateCompleted: recordToEdit.Date_Completed__c || 'N/A',
                responsiblePerson: recordToEdit.Person_Responsible__c || 'N/A',
                strategy: recordToEdit.Risk_Strategy__c || 'N/A',
                impact: recordToEdit.Impact_on_Whom__c || 'N/A',
                likelihood: recordToEdit.Likelihood__c || 'N/A',
                consequences: recordToEdit.Consequences__c || 'N/A',
                uniqueId: recordToEdit.UniqueRefId__c || 'N/A',
                fileName: recordToEdit.File_Name__c || 'N/A',
                otherText: recordToEdit.Other_Text__c || '', // Properly retrieve 'Other' text
                checked: true // Ensure the checkbox remains checked when editing
            };
    
            if (this.existingIndex !== -1) {
                this.selectedCategories[this.existingIndex] = updatedRecord;
                console.log('Updated existing record in selectedCategories:', JSON.stringify(this.selectedCategories[this.existingIndex]));
            } else {
                this.selectedCategories.push(updatedRecord);
                console.log('Added new record to selectedCategories:', JSON.stringify(updatedRecord));
            }
    
            // Update checkboxes and handle "Other" option correctly
            this.processedCategoryGroups = this.categoryGroups.map(group => {
                return {
                    ...group,
                    options: group.options.map(option => {
                        const isChecked = this.selectedCategories.some(item => item.category === option.value && item.area === group.heading);
                        const isOtherSelected = (option.value === 'Other') && isChecked;
    
                        return {
                            ...option,
                            checked: isChecked,
                            isOtherSelected: isOtherSelected,
                            otherText: isOtherSelected ? recordToEdit.Other_Text__c || '' : '' // Correctly populate text if "Other" is selected
                        };
                    })
                };
            });
    
            this.isOpenModal = true;
        } else {
            console.warn('No matching record found for ID:', this.recordId);
        }
    }
  
    // Show toast message
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }    
    handleRecordsPerPage(event) {
        this.pageSize = event.target.value;
        this.paginationHelper();
    }
    previousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
    }
    nextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
    }
    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
    }
    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
    }
    paginationHelper() {
        this.displayedRiskRecords = [];
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        let tempconList=[];   
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records[i]);           
            tempconList.push(tempConRec);    
        }
       // console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.displayedRiskRecords = tempconList;
        refreshApex(this.wiredFeedbackData);
    }
   
   
    handleDocumentchange(event) {
        let uniqueid = event.currentTarget.dataset.uniqueid;
        console.log('uniqueid>>',uniqueid);
        console.log('type of '+ typeof(uniqueid))
        let fieldName = event.target.name;
        let value = event.target.value;
        console.log('fieldName>>',JSON.stringify(this.selectedCategories));
     //   this.selectedCategories
            this.onDocumentUpload(event).then(filedata => {
              //  console.log('filedata>>',JSON.stringify(filedata));
            for (let i = 0; i < this.selectedCategories.length; i++) {
                    if (parseInt(this.selectedCategories[i].uniqueId) === parseInt(uniqueid)) {
                        this.selectedCategories[i]['fileName'] = filedata.fileName;
                        this.selectedCategories[i]['base64Data'] = JSON.stringify(filedata.base64Data);
                        }
                    }
                    console.log('file data=>' + JSON.stringify(this.selectedCategories));
                }).catch(error => {
                    console.error('Error:', error);
                });
          
      // console.log('file data=>'+JSON.stringify(this.selectedCategories));
       this.riskRecords = [];
       // Update riskRecords to match selectedCategories
       this.riskRecords = this.selectedCategories.map(item => ({
           Id: item.Id, // Ensure unique ID
           area: item.area || "",
           category: item.category || "",
           impact: item.impact || null,
           likelihood: item.likelihood || null,
           consequences: item.consequences || null,
           riskRating: item.riskRating || null,
           strategy: item.strategy || null,
           responsiblePerson: item.responsiblePerson || null,
           dateCompleted: item.dateCompleted || null,
           clientId: item.clientId || this.clientId,
           uniqueId: item.uniqueId || null,
           fileName: item.fileName || '',
           
       }));
       console.log('file data=>'+JSON.stringify( this.riskRecords));

    }
          
    onDocumentUpload(event) {
        return new Promise((resolve, reject) => {
            this.isattachError = false;
            // this.showSpinner = true;
            let selectedFilesToUpload = event.target.files;
            let file = selectedFilesToUpload[0];
            let fileName = selectedFilesToUpload[0].name.split(" ").join("");
            let fileType = selectedFilesToUpload[0].type;
            let fileSize = selectedFilesToUpload[0].size;
    
            if (file.size > this.MAX_FILE_SIZE || file.size < this.MIN_FILE_SIZE) {
                this.isattachError = true;
                reject('File size out of range');
                return;
            }
    
            let fileReaderObj = new FileReader();
            fileReaderObj.onloadend = () => {
                let fileContents = fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',') + 1);
    
                let sliceSize = 1024;
                let byteCharacters = atob(fileContents);
                let bytesLength = byteCharacters.length;
                let slicesCount = Math.ceil(bytesLength / sliceSize);
                let byteArrays = new Array(slicesCount);
                for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                    let begin = sliceIndex * sliceSize;
                    let end = Math.min(begin + sliceSize, bytesLength);
                    let bytes = new Array(end - begin);
                    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }
    
                let myFile = new File(byteArrays, fileName, { type: fileType });
    
                let reader = new FileReader();
                reader.onloadend = () => {
                    let base64data = reader.result;
                    let base64FileData = base64data.substr(base64data.indexOf(',') + 1);
                    resolve({ "fileName": fileName, "base64Data": base64FileData });
                };
                reader.readAsDataURL(myFile);
            };
            fileReaderObj.readAsDataURL(file);
    
            this.showSpinner = false;
            console.log('file prepared');
        });
    }

    onFileUpload(event) {
        this.isattachError=false;
        this.isFileAttached=true;
        this.isEdit=false;
      //  console.log('in files upload',event.target.files.length);
        if (event.target.files.length > 0) {
           // this.showSpinner = true;
            this.selectedFilesToUpload = event.target.files;      
            this.file = this.selectedFilesToUpload[0];
            this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
            this.fileType = this.selectedFilesToUpload[0].type;
            this.fileSize = this.selectedFilesToUpload[0].size;     
            
            if (this.file.size > this.MAX_FILE_SIZE || this.file.size < this.MIN_FILE_SIZE) {  
                this.isattachError=true;
            }
            //create an intance of File
            this.fileReaderObj = new FileReader();

            //this callback function in for fileReaderObj.readAsDataURL
            this.fileReaderObj.onloadend = (() => {        
                //get the uploaded file in base64 format
                let fileContents = this.fileReaderObj.result;
                fileContents = fileContents.substr(fileContents.indexOf(',')+1);
                
                //read the file chunkwise
                let sliceSize = 1024;           
                let byteCharacters = atob(fileContents);
                let bytesLength = byteCharacters.length;
                let slicesCount = Math.ceil(bytesLength / sliceSize);                
                let byteArrays = new Array(slicesCount);
                for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
                    let begin = sliceIndex * sliceSize;
                    let end = Math.min(begin + sliceSize, bytesLength);                    
                    let bytes = new Array(end - begin);
                    for (let offset = begin, i = 0 ; offset < end; ++i, ++offset) {
                        bytes[i] = byteCharacters[offset].charCodeAt(0);         
                    }
                    byteArrays[sliceIndex] = new Uint8Array(bytes);
                }                
                //from arraybuffer create a File instance
                this.myFile =  new File(byteArrays, this.fileName, { type: this.fileType });
                
                //callback for final base64 String format
                let reader = new FileReader();
                reader.onloadend = (() => {
                    let base64data = reader.result;
                    this.base64FileData = base64data.substr(base64data.indexOf(',')+1);
                });
                reader.readAsDataURL(this.myFile);                                 
            });
            this.fileReaderObj.readAsDataURL(this.file);
        }
      //  console.log('fileName>>',typeof(JSON.stringify(event.target.files) ));
    }

    @track isViewModalOpen = false;
    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
        this.isOpenModalFlag = true;
        console.log('url '+this.currentUrl);

        this.isViewModalOpen = true;
        this.staffFeedbackData=false;
        const fileType = this.getFileType(this.currentUrl);
        
        //console.log('file type: ' + fileType);
        // Check if the file type is not PNG or PDF
         if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg') {
            setTimeout(() => {
                this.hideModalBox();
            }, 1700);
            
        }  
    }

    closeRiskManagement(){
        this.isOpenModalFlag = false;
        this.currentUrl = null;
        this.isOpenModal = false;
        this.staffFeedbackData=true;
        this.isViewModalOpen = false;
    }

    fetchRefreshRiskIndex(){
        this.showSpinner = true;
         this.records=[];
         setTimeout(() => {
            refreshApex(this.wiredFeedbackData);
            this.showSpinner = false;
         }, 2000); 
    }

}