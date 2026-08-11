import { LightningElement,track,wire,api } from 'lwc';
import getRiskMatrix from '@salesforce/apex/RiskMatrixController.getRiskMatrix';
import insertRiskRecords from '@salesforce/apex/RiskMatrixController.insertRiskRecords';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRiskRecords from '@salesforce/apex/RiskMatrixController.getRiskRecords'; 
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';

export default class TesseractAppsRiskManagementLwc extends LightningElement {
    @api clientId;
    @api 
    get subroute() {
        return this._subroute;
    }
    set subroute(val) {
        this._subroute = val;
        this.processSubroute(val);
    }
    _pendingSubroute;    
    @track isOpenModal = false;
    @track isOpenModalFlag = false;
    @track displayedRiskRecords = [];
    @track recentEmpData = [];
    @track staffFeedbackData = false;
    @track staffFeedbackNoData = false;
    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number
    @track showSpinner=false;
    @api recordId = '';
    @track successmessage;
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

    @track processedCategoryGroups = [];
    @track otherValues = {};

   connectedCallback(){
        console.log('CLient Id >>'+ this.clientId);        
        if(this.clientId){
            refreshApex(this.wiredFeedbackData);
        }
        this.processedCategoryGroups = [
            {
                heading: 'Manual Handling',
                options: [
                    { label: 'Posture/Repetitive Movements', value: 'Posture/Repetitive Movements' },
                    { label: 'Lifting/Carrying/Push/Pull', value: 'Lifting/Carrying/Push/Pull' },
                    { label: 'Other manual handling needs/supports', value: 'Other manual handling needs/supports' },
                    { label: 'Other', value: 'Other' },
                   /*  { isOtherSelected:false} */
                ]
            },
            {
                heading: 'Meal Management',
                options: [
                    { label: 'Dysphagia - Likely to choke on food', value: 'Dysphagia - Likely to choke on food' },
                    { label: 'Severe Dysphagia', value: 'Severe Dysphagia' },
                    { label: 'Medical dietary needs', value: 'Medical dietary needs' },
                    { label: 'Food Allergies', value: 'Food Allergies' },
                    { label: 'Enteral Feeding (PEG management plan required in addition to MMP)', value: 'Enteral Feeding' }
                ]
            },
            {
                heading: 'Medical Conditions',
                options: [
                    { label: 'Epilepsy - Complete Epilepsy management plan', value: 'Epilepsy - Complete Epilepsy management plan' },
                    { label: 'Incontinence', value: 'Incontinence' },
                    { label: 'Respiratory conditions', value: 'Respiratory conditions' },
                    { label: 'Diabetes - Complete diabetes management plan', value: 'Diabetes - Complete diabetes management plan' },
                    { label: 'Skin conditions/Wound conditions', value: 'Skin conditions/Wound conditions' },
                    { label: 'High risk to sun exposure', value: 'High risk to sun exposure' },
                    { label: 'Support needed to take medication, includes subcutaneous injection - Complete medication management plan', value: 'Support needed to take medication, includes subcutaneous injection - Complete medication management plan' },
                    { label: 'Allergies', value: 'Allergies' },
                    { label: 'Special dietary needs', value: 'Special dietary needs' },
                    { label: 'General health and wellbeing', value: 'General health and wellbeing' },
                    { label: 'Other', value: 'Other' },
                   /*  { isOtherSelected:false} */
                ]
            },
            {
                heading: 'Behavioural & Mental Health',
                options: [
                    { label: 'Likely to become physically aggressive', value: 'Likely to become physically aggressive' },
                    { label: 'Likely to become verbally aggressive', value: 'Likely to become verbally aggressive' },
                    { label: 'Likely to use a weapon', value: 'Likely to use a weapon' },
                    { label: 'Exhibits sexual/Predatory behaviours', value: 'Exhibits sexual/Predatory behaviours' },
                    { label: 'Self-harm/Suicide risk - Historical and current', value: 'Self-harm/Suicide risk - Historical and current' },
                    { label: 'Likely to overeat or become sick/unwell', value: 'overeatiLikely to overeat or become sick/unwellng_sick' },
                    { label: 'Likely to experience a panic reaction', value: 'Likely to experience a panic reaction' },
                    { label: 'Historical psychosis/Hallucinations', value: 'Historical psychosis/Hallucinations' },
                    { label: 'Other', value: 'Other' },
                    /* { isOtherSelected:false} */
                ]
            },
            {
                heading: 'Identification and Legal',
                options: [
                    { label: 'Awareness of own information (name, address, phone numbers, next of kin)', value: 'Awareness of own information (name, address, phone numbers, next of kin)' },
                    { label: 'Guardianship/Administrator in place', value: 'Guardianship/Administrator in place' },
                    { label: 'Support needed to use mobile', value: 'Support needed to use mobile' },
                    { label: 'Legal issues - Historical or current', value: 'Legal issues - Historical or current' },
                    { label: 'Other', value: 'Other' },
                    /* { isOtherSelected:false} */
                ]
            },
            {
                heading: 'Money Handling',
                options: [
                    { label: 'Support needed to make purchases', value: 'Support needed to make purchases' },
                    { label: 'Support needed to carry money', value: 'Support needed to carry money' },
                    { label: 'Other', value: 'Other' },
                    /* { isOtherSelected:false} */
                ]
            },
            
            {
                heading: 'Environmental & Social',
                options: [
                    { label: 'Support needed with road safety', value: 'Support needed with road safety' },
                    { label: 'Support needed to travel in vehicle or public transport', value: 'Support needed to travel in vehicle or public transport' },
                    { label: 'Support needed to navigate local area', value: 'Support needed to navigate local area' },
                    { label: 'Support needed in the community', value: 'Support needed in the community' },
                    { label: 'Support needed with religious/spiritual beliefs', value: 'Support needed with religious/spiritual beliefs' },
                    { label: 'Support to contact/access emergency services as needed', value: 'Support to contact/access emergency services as needed' },
                    { label: 'Lives in bushfire-prone area - Complete Emergency plan', value: 'Lives in bushfire-prone area - Complete Emergency plan' },
                    { label: 'Other', value: 'Other' },
                    /* { isOtherSelected:false} */
                ]
            },
            {
                heading: 'Risky or Unsafe Behaviours',
                options: [
                    { label: 'Gambling issues', value: 'Gambling issues' },
                    { label: 'Excessive alcohol issue - complete individual risk assessment', value: 'Excessive alcohol issue - complete individual risk assessment' },
                    { label: 'Illicit drug use - Complete individual risk assessment', value: 'Illicit drug use - Complete individual risk assessment' },
                    { label: 'Family violence - Complete individual risk assessment', value: 'Family violence - Complete individual risk assessment' },
                    { label: 'Criminal activity or behaviour', value: 'Criminal activity or behaviour' },
                    { label: 'Aggressive behaviour towards employees or others - history or current', value: 'Aggressive behaviour towards employees or others - history or current' },
                    { label: 'Other', value: 'Other' },
                    /* { isOtherSelected:false} */
                ] 
            },
            {
                heading: 'Relationships - Carer, Family Members, Other Support Providers',
                options: [
                    { label: 'Relationship breakdown or challenges', value: 'Relationship breakdown or challenges' },
                    { label: 'Children - Arrangements for care, child protection involvements, etc.', value: 'Children - Arrangements for care, child protection involvements, etc.' },
                    { label: 'Mentioning of certain family members names', value: 'Mentioning of certain family members names' },
                    { label: 'Other', value: 'Other' },
                    /* { isOtherSelected:false} */
                ]
            },
           
            {
                heading: 'Supports to be provided in Home Environment',
                options: [
                    { label: 'Unstable home environment', value: 'Unstable home environment' },
                    { label: 'Home safety assessment completed', value: 'Home safety assessment completed' },
                    { label: 'Other', value: 'Other' },
                    /* { isOtherSelected:false} */
                ]
            },
            {
                heading: 'Movement/Mobility',
                options: [
                    { label: 'Unsteady', value: 'Unsteady' },
                    { label: 'Likely to wander or abscond', value: 'Likely to wander or abscond' },
                    { label: 'Activity related slips/trips & falls possible', value: 'Activity related slips/trips & falls possible' },
                    { label: 'Use of aides/wheelchair (List type below)', value: 'Use of aides/wheelchair (List type below)' },
                    { label: 'Transfer required (List type below)', value: 'Transfer required (List type below)' },
                    { label: 'Other', value: 'Other' },
                    /* { isOtherSelected:false} */
                ]
            },
            
            {
                heading: 'Medical Conditions',
                options: [
                    { label: 'Complex Bowel', value: 'Complex Bowel' },
                    { label: 'Urinary Catheter Care', value: 'Urinary Catheter Care' },
                    { label: 'Tracheostomy Care', value: 'Tracheostomy Care' },
                    { label: 'Other', value: 'Other' },
                    /* { isOtherSelected:false} */
                ]
            },
            {
                heading: 'Biological/Infection Control',
                options: [
                    { label: 'Transfer of disease/infection', value: 'Transfer of disease/infection' },
                    { label: 'Personal Hygiene', value: 'Personal Hygiene' },
                    { label: 'Other', value: 'Other' },
                   /*  { isOtherSelected:false} */
                ]
            },
            {
                heading: 'Lives Alone with No Other Face-to-Face Services/Supports',
                options: [
                    { label: 'Complete individual risk assessment', value: 'Complete individual risk assessment' }
                ]
            }
        ];
        
    }

    handleRiskManagement() {
        this.isOpenModal = true;
        this.successmessage = 'Risk Identification created successfully.';
        console.log('New Risk Create :' + this.isOpenModal);
        this.isOpenModalFlag = true;
        this.fileName = '';
        this.isViewModalOpen = false;
        this.selectedCategories = [];
        this.isSaveDisabled = true;
    
        // Reset the checkbox states to unselected
        this.processedCategoryGroups = this.categoryGroups.map(group => {
            return {
                ...group,
                options: group.options.map(option => ({
                    ...option,
                    checked: false,
                    Other: '' // Reset "Other" text value as well
                }))
            };
        });
    
        console.log('Reset processedCategoryGroups:', JSON.stringify(this.processedCategoryGroups));
         this._syncRoute();
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
        this.recordId = null;
        console.log('Closes Risk :' +this.isOpenModal);
        refreshApex(this.wiredFeedbackData);
         this._syncRoute();
    }

    closeRiskManagement(){
        this.isOpenModalFlag = false;
        this.currentUrl = null;
        this.isOpenModal = false;
        this.isViewModalOpen = false;
        this.recordId = null;
        this._syncRoute();
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
            this.sectionFlags[sectionId] = true;
        } else {
            sectionElement.classList.toggle('hidden-section');
        }
        this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
    } 

    @track categoryGroups = [
        {
            heading: 'Manual Handling',
            options: [
                { label: 'Posture/Repetitive Movements', value: 'Posture/Repetitive Movements' },
                { label: 'Lifting/Carrying/Push/Pull', value: 'Lifting/Carrying/Push/Pull' },
                { label: 'Other manual handling needs/supports', value: 'Other manual handling needs/supports' },
                { label: 'Other', value: 'Other' },
                /* { isOtherSelected:false} */
            ]
        },
        {
            heading: 'Meal Management',
            options: [
                { label: 'Dysphagia - Likely to choke on food', value: 'Dysphagia - Likely to choke on food' },
                { label: 'Severe Dysphagia', value: 'Severe Dysphagia' },
                { label: 'Medical dietary needs', value: 'Medical dietary needs' },
                { label: 'Food Allergies', value: 'Food Allergies' },
                { label: 'Enteral Feeding (PEG management plan required in addition to MMP)', value: 'Enteral Feeding' }
            ]
        },
        {
            heading: 'Medical Conditions',
            options: [
                { label: 'Epilepsy - Complete Epilepsy management plan', value: 'Epilepsy - Complete Epilepsy management plan' },
                { label: 'Incontinence', value: 'Incontinence' },
                { label: 'Respiratory conditions', value: 'Respiratory conditions' },
                { label: 'Diabetes - Complete diabetes management plan', value: 'Diabetes - Complete diabetes management plan' },
                { label: 'Skin conditions/Wound conditions', value: 'Skin conditions/Wound conditions' },
                { label: 'High risk to sun exposure', value: 'High risk to sun exposure' },
                { label: 'Support needed to take medication, includes subcutaneous injection - Complete medication management plan', value: 'Support needed to take medication, includes subcutaneous injection - Complete medication management plan' },
                { label: 'Allergies', value: 'Allergies' },
                { label: 'Special dietary needs', value: 'Special dietary needs' },
                { label: 'General health and wellbeing', value: 'General health and wellbeing' },
                { label: 'Other', value: 'Other' },
                /* { isOtherSelected:false} */
            ]
        },
        {
            heading: 'Behavioural & Mental Health',
            options: [
                { label: 'Likely to become physically aggressive', value: 'Likely to become physically aggressive' },
                { label: 'Likely to become verbally aggressive', value: 'Likely to become verbally aggressive' },
                { label: 'Likely to use a weapon', value: 'Likely to use a weapon' },
                { label: 'Exhibits sexual/Predatory behaviours', value: 'Exhibits sexual/Predatory behaviours' },
                { label: 'Self-harm/Suicide risk - Historical and current', value: 'Self-harm/Suicide risk - Historical and current' },
                { label: 'Likely to overeat or become sick/unwell', value: 'overeatiLikely to overeat or become sick/unwellng_sick' },
                { label: 'Likely to experience a panic reaction', value: 'Likely to experience a panic reaction' },
                { label: 'Historical psychosis/Hallucinations', value: 'Historical psychosis/Hallucinations' },
                { label: 'Other', value: 'Other' },
                /* { isOtherSelected:false} */
            ]
        },
        {
            heading: 'Identification and Legal',
            options: [
                { label: 'Awareness of own information (name, address, phone numbers, next of kin)', value: 'Awareness of own information (name, address, phone numbers, next of kin)' },
                { label: 'Guardianship/Administrator in place', value: 'Guardianship/Administrator in place' },
                { label: 'Support needed to use mobile', value: 'Support needed to use mobile' },
                { label: 'Legal issues - Historical or current', value: 'Legal issues - Historical or current' },
                { label: 'Other', value: 'Other' },
                /* { isOtherSelected:false} */
            ]
        },
        {
            heading: 'Money Handling',
            options: [
                { label: 'Support needed to make purchases', value: 'Support needed to make purchases' },
                { label: 'Support needed to carry money', value: 'Support needed to carry money' },
                { label: 'Other', value: 'Other' },
                /* { isOtherSelected:false} */
            ]
        },
        
        {
            heading: 'Environmental & Social',
            options: [
                { label: 'Support needed with road safety', value: 'Support needed with road safety' },
                { label: 'Support needed to travel in vehicle or public transport', value: 'Support needed to travel in vehicle or public transport' },
                { label: 'Support needed to navigate local area', value: 'Support needed to navigate local area' },
                { label: 'Support needed in the community', value: 'Support needed in the community' },
                { label: 'Support needed with religious/spiritual beliefs', value: 'Support needed with religious/spiritual beliefs' },
                { label: 'Support to contact/access emergency services as needed', value: 'Support to contact/access emergency services as needed' },
                { label: 'Lives in bushfire-prone area - Complete Emergency plan', value: 'Lives in bushfire-prone area - Complete Emergency plan' },
                { label: 'Other', value: 'Other' },
               /*  { isOtherSelected:false} */
            ]
        },
        {
            heading: 'Risky or Unsafe Behaviours',
            options: [
                { label: 'Gambling issues', value: 'Gambling issues' },
                { label: 'Excessive alcohol issue - complete individual risk assessment', value: 'Excessive alcohol issue - complete individual risk assessment' },
                { label: 'Illicit drug use - Complete individual risk assessment', value: 'Illicit drug use - Complete individual risk assessment' },
                { label: 'Family violence - Complete individual risk assessment', value: 'Family violence - Complete individual risk assessment' },
                { label: 'Criminal activity or behaviour', value: 'Criminal activity or behaviour' },
                { label: 'Aggressive behaviour towards employees or others - history or current', value: 'Aggressive behaviour towards employees or others - history or current' },
                { label: 'Other', value: 'Other' },
                /* { isOtherSelected:false} */
            ] 
        },
        {
            heading: 'Relationships - Carer, Family Members, Other Support Providers',
            options: [
                { label: 'Relationship breakdown or challenges', value: 'Relationship breakdown or challenges' },
                { label: 'Children - Arrangements for care, child protection involvements, etc.', value: 'Children - Arrangements for care, child protection involvements, etc.' },
                { label: 'Mentioning of certain family members names', value: 'Mentioning of certain family members names' },
                { label: 'Other', value: 'Other' },
               /*  { isOtherSelected:false} */
            ]
        },
       
        {
            heading: 'Supports to be provided in Home Environment',
            options: [
                { label: 'Unstable home environment', value: 'Unstable home environment' },
                { label: 'Home safety assessment completed', value: 'Home safety assessment completed' },
                { label: 'Other', value: 'Other' },
               /*  { isOtherSelected:false} */
            ]
        },
        {
            heading: 'Movement/Mobility',
            options: [
                { label: 'Unsteady', value: 'Unsteady' },
                { label: 'Likely to wander or abscond', value: 'Likely to wander or abscond' },
                { label: 'Activity related slips/trips & falls possible', value: 'Activity related slips/trips & falls possible' },
                { label: 'Use of aides/wheelchair (List type below)', value: 'Use of aides/wheelchair (List type below)' },
                { label: 'Transfer required (List type below)', value: 'Transfer required (List type below)' },
                { label: 'Other', value: 'Other' },
                /* { isOtherSelected:false} */
            ]
        },
        
        {
            heading: 'Medical Conditions',
            options: [
                { label: 'Complex Bowel', value: 'Complex Bowel' },
                { label: 'Urinary Catheter Care', value: 'Urinary Catheter Care' },
                { label: 'Tracheostomy Care', value: 'Tracheostomy Care' },
                { label: 'Other', value: 'Other' },
                /* { isOtherSelected:false} */
            ]
        },
        {
            heading: 'Biological/Infection Control',
            options: [
                { label: 'Transfer of disease/infection', value: 'Transfer of disease/infection' },
                { label: 'Personal Hygiene', value: 'Personal Hygiene' },
                { label: 'Other', value: 'Other' },
                /* { isOtherSelected:false} */
            ]
        },
        {
            heading: 'Lives Alone with No Other Face-to-Face Services/Supports',
            options: [
                { label: 'Complete individual risk assessment', value: 'Complete individual risk assessment' }
            ]
        }
    ];

    @track selectedCategories = [];
    @track isOtherSelected = false; 
    handleSelection(event) {
        const selectedValue = event.target.dataset.value;
        const categoryGroup = event.target.dataset.group;
        const isChecked = event.target.checked;
    
        console.log('selectedValue :' + selectedValue);
        console.log('categoryGroup : ' + categoryGroup);
    
        // Update the category groups directly
        this.categoryGroups = this.categoryGroups.map(group => {
            if (group.heading === categoryGroup) {
                return {
                    ...group,
                    options: group.options.map(option => {
                        if (option.value === selectedValue) {
                            if (selectedValue === 'Other') {
                                return { ...option, Other: isChecked, checked: isChecked };
                            }
                            return { ...option, checked: isChecked };
                        }
                        return option;
                    })
                };
            }
            return group;
        });
    
        // Check if the "Other" option is selected
        if (selectedValue === 'Other') {
            if (isChecked) {
                const uniqueId = Date.now(); // Create a unique ID using category and timestamp
                this.selectedCategories = [...this.selectedCategories, {
                    area: categoryGroup,
                    category: selectedValue,
                    Id: null,
                    uniqueId: uniqueId,
                    fileName: "",
                    otherText: ""
                }];
            } else {
                // Remove the specific "Other" entry based on area
                this.selectedCategories = this.selectedCategories.filter(item => !(item.category === 'Other' && item.area === categoryGroup));
            }
        } else {
            if (isChecked) {
                const uniqueId = `${categoryGroup}-${Date.now()}`; // Create a unique ID using category and timestamp
                this.selectedCategories = [...this.selectedCategories, {
                    area: categoryGroup,
                    category: selectedValue,
                    Id: null,
                    uniqueId: uniqueId,
                    fileName: ""
                }];
            } else {
                this.selectedCategories = this.selectedCategories.filter(item => !(item.category === selectedValue && item.area === categoryGroup));
            }
        }
    
        // Update the processed category groups to reflect changes in the UI
        this.processedCategoryGroups = this.categoryGroups.map(group => {
            return {
                ...group,
                options: group.options.map(option => {
                    return {
                        ...option,
                        checked: this.selectedCategories.some(item => item.category === option.value && item.area === group.heading)
                    };
                })
            };
        });
    
        console.log('selectedCategories:', JSON.stringify(this.selectedCategories));
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
    /* handleInputChange(event) {
        const { dataset, value } = event.target;
        const category = dataset.id;
        const area = dataset.area;
        const fieldName = dataset.field;
    
        console.log('category: ' + category);
        console.log('area: ' + area);
    
        // Find the row based on both category and area (or uniqueId if available)
        let row = this.selectedCategories.find(item => item.category === category && item.area === area);
        console.log('row: ' + JSON.stringify(row));
    
        if (row) {
            row[fieldName] = value;
    
            // Calculate risk index only if both likelihood and consequences are selected
            if (row.likelihood && row.consequences) {
                const key = `${row.likelihood}_${row.consequences}`;
                row.riskRating = this.riskMatrixData[key] || 'N/A';
            }
    
            // Update the selectedCategories array to trigger reactivity
            this.selectedCategories = [...this.selectedCategories];
            this.riskRecords = [];
    
            // Update riskRecords with all selected categories and their respective data
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
    } */
    

    handleInputChange(event) {
        const { dataset, value } = event.target;
        const category = dataset.id;
        const area=dataset.area;
        console.log('category '+category);
        console.log('area '+area);
        const fieldName = dataset.field;
    
        let row = this.selectedCategories.find(item => item.category === category && item.area === area);
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
                    let uploadRiskData = this.selectedCategories.find(cat => cat.uniqueId === item.UniqueRefId__c);
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
    
                this.showToast('Success', this.successmessage, 'success');
                this.isOpenModalFlag = false;
                this.isOpenModal = false;
                this.recordId = null;
                this._syncRoute();                
            })
            .catch(error => {
                window.console.log(error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Risk Strategy characters limit cannot be exceed 60 characters',
                        variant: 'error',
                    }),
                );
              //  this.showToast('Error message', error.body?.message || 'Failed to save records', 'error');
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
                     tempRec.RiskUID = record.Risk_UID__c;
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
            if (this._pendingSubroute) {
                this.processSubroute(this._pendingSubroute);
                this._pendingSubroute = null;
            }            
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
        this.successmessage = 'Risk Identification updated successfully.';
        console.log('Record Id >> ' + this.recordId);
    
        if (!this.displayedRiskRecords || this.displayedRiskRecords.length === 0) {
            console.warn('displayedRiskRecords is empty or undefined.');
            return;
        }
    
        const recordToEdit = this.displayedRiskRecords.find(record => record.Id === this.recordId);
    
        if (recordToEdit) {
            console.log('Record Edit: ' + JSON.stringify(recordToEdit));            
    
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
                        const isOtherSelected = (option.value === 'Other') && this.selectedCategories.some(item => item.category === 'Other' && item.area === group.heading);
    
                        return {
                            ...option,
                            checked: isChecked,
                            Other: isOtherSelected,
                            otherText: isOtherSelected ? recordToEdit.Other_Text__c || '' : '' // Correctly populate text if "Other" is selected
                        };
                    })
                };
            });
    
            this.isOpenModal = true;
            this.isOpenModalFlag = true;
            this.isViewModalOpen = false;
            this.isSaveDisabled = false;            
        } else {
            console.warn('No matching record found for ID:', this.recordId);
        }
         this._syncRoute();
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
        console.log('selectedCategories>>',JSON.stringify(this.selectedCategories));
     //   this.selectedCategories
            this.onDocumentUpload(event).then(filedata => {
              console.log('filedata>>',JSON.stringify(filedata));
            for (let i = 0; i < this.selectedCategories.length; i++) {
                        console.log('this.selectedCategories[i].uniqueId '+this.selectedCategories[i].uniqueId);
                           console.log('parseInt(uniqueid) '+uniqueid);
                    if (this.selectedCategories[i].uniqueId === uniqueid) {
                        console.log('inside  if ')
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
            console.log('984 filename '+fileName);
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
                   ///   console.log('file NAME , BASE 64' +JSON.stringify({ "fileName": fileName, "base64Data": base64FileData }));
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
        if (!url) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'No image available to preview',
                variant: 'error',
                mode: 'dismissable'
            })
        );
        return; // exit early
    }
        this.currentUrl = url;
                this.recordId = event.currentTarget.dataset.id;
        this.isOpenModalFlag = true;
        console.log('url '+this.currentUrl);

        this.isViewModalOpen = true;
        this.staffFeedbackData=false;
         this._syncRoute();
        const fileType = this.getFileType(this.currentUrl);
        
        //console.log('file type: ' + fileType);
        // Check if the file type is not PNG or PDF
         if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg' && fileType !== 'jpg' && fileType !== 'txt') { 
            setTimeout(() => {
                this.hideModalBox();
            }, 1700);
            
        }  
    }

   // @api categoryGroups = [];
    get processedCategoryGroups() {
        return this.categoryGroups.map(group => {
            return {
                ...group,
                options: group.options.map(option => {
                    return {
                        ...option,
                        checked: this.selectedCategories.some(item => item.category === option.value)
                    };
                })
            };
        });
    }

    closeRiskManagement(){
        this.isOpenModalFlag = false;
        this.currentUrl = null;
        this.isOpenModal = false;
        this.staffFeedbackData=true;
        this.isViewModalOpen = false;
        this.recordId = null;
        this._syncRoute();        
    }

    fetchRefreshRiskIndex(){
        this.showSpinner = true;
         this.records=[];
         setTimeout(() => {
            refreshApex(this.wiredFeedbackData);
            this.showSpinner = false;
         }, 2000); 
    }

    _syncRoute(replace = false) {
        let subView = '';
        if (this.isOpenModal) {
            subView = this.recordId ? `${this._getRiskUid(this.recordId)}/edit` : 'risk-identification';
        } else if (this.isViewModalOpen && this.recordId) {
            subView = `${this._getRiskUid(this.recordId)}/view`;
        }
        
        console.log('[Routing] tesseractAppsRiskManagementLwc dispatching subrouteupdate:', subView);
        this.dispatchEvent(new CustomEvent('subrouteupdate', {
            detail: {
                subView,
                replace
            },
            bubbles: true,
            composed: true
        }));
    }

    _getRiskUid(id) {
        const rec = this.records.find(r => r.Id === id);
        return rec ? rec.RiskUID : id;
    }

    processSubroute(subroute) {
        if (!subroute) {
            this.isOpenModal = false;
            this.isOpenModalFlag = false;
            this.isViewModalOpen = false;
            this.staffFeedbackData = true;
            return;
        }

        if (subroute === 'risk-identification') {
            this.successmessage = 'Risk Identification created successfully.';
            this.isOpenModal = true;
            this.isOpenModalFlag = true;
            this.fileName = '';
            this.isViewModalOpen = false;
            this.selectedCategories = [];
            this.isSaveDisabled = true;
            this.processedCategoryGroups = this.categoryGroups.map(group => {
                return {
                    ...group,
                    options: group.options.map(option => ({
                        ...option,
                        checked: false,
                        Other: ''
                    }))
                };
            });
        } else {
            const parts = subroute.split('/');
            const uid = parts[0];
            const action = parts[1] || 'view';
            if (uid.startsWith('rsk-') || /^[a-z0-9]{15}$|^[a-z0-9]{18}$/i.test(uid)) {
                if (this.records && this.records.length > 0) {
                    const record = this.records.find(r => r.RiskUID === uid || r.Id === uid);
                    if (record) {
                        this.recordId = record.Id;
                        this.selectedCategories = [record.category];
                        this.riskIndex = record.rating;
                        this.personResponsible = record.personResponsible;
                        this.strategyValue = record.riskStrategy;
                        this.areaValue = record.Area__c;
                        this.commentsValue = record.comments;
                        this.fileName = record.fileName;
                        this.currentUrl = record.AmazonURL;
                        this.otherText = record.otherText;
                        
                        if (action === 'view') {
                            this.isViewModalOpen = true;
                            this.isOpenModalFlag = true;
                            this.isOpenModal = false;
                            this.staffFeedbackData = false;
                        } else if (action === 'edit') {
                            this.successmessage = 'Risk Identification updated successfully.';
                            this.isOpenModal = true;
                            this.isOpenModalFlag = true;
                            this.isViewModalOpen = false;
                            this.isSaveDisabled = false;
                        }
                    }
                } else {
                    this._pendingSubroute = subroute;
                }
            }
        }
    }    
}