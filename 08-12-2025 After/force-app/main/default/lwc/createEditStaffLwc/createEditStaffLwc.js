import { LightningElement, wire, api, track } from 'lwc';
import fetchStaff from '@salesforce/apex/StaffController.fetchStaff';
import getStaffById from '@salesforce/apex/StaffController.getStaffById1';
import { CurrentPageReference } from "lightning/navigation";
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import insertPreTax from '@salesforce/apex/StaffController.insertPreTax';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';
import getShadAwards from '@salesforce/apex/StaffController.getShadAwards';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key';
import getStaffAssignmentsbyId from '@salesforce/apex/HRTraining.getStaffAssignmentsbyId';
import getStaffHistory from '@salesforce/apex/StaffController.getStaffHistory';
import getstaffId2 from '@salesforce/apex/UserAccessController.getstaffId2';
import Loading_Logo from '@salesforce/resourceUrl/Loading_Logo';
import userId from '@salesforce/user/Id';
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';
import getNursingAwrds from '@salesforce/apex/StaffController.getNursingAwrds';
import getRoleOptions from '@salesforce/apex/StaffController.getRoleOptions';
import createStaffRoles from '@salesforce/apex/StaffRoleController.createStaffRoles';
import getStaffRoles from '@salesforce/apex/StaffRoleController.getStaffRoles';
import getStaffRoleWithRates from '@salesforce/apex/StaffRoleController.getStaffRoleWithRates';
import getSelectedRole from '@salesforce/apex/StaffRoleController.getSelectedRole';
import getActiveStaffRoles from '@salesforce/apex/StaffRoleController.getActiveStaffRoles';
import getChildcareAwrds from '@salesforce/apex/StaffController.getChildcareAwrds';
import updateDocumentStatus from '@salesforce/apex/StaffController.updateDocumentStatus';
const actions = [
    { label: 'View Document', name: 'view_details' },   
    { label: 'Edit', name: 'edit' }   ,
    { label: 'Delete', name: 'delete' } ,]

    const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
    const ENDPOINTS = {
        delete: `${AWS_BASE}/delete-file`
    };

export default class CreateEditStaffLwc extends NavigationMixin(LightningElement){
    primary = My_Resource + '/myResource/images/Primary.svg';
    secondary = My_Resource + '/myResource/images/Secondary.svg';
    admin = My_Resource + '/myResource/images/admin.svg';
    infoicon = My_Resource + '/myResource/images/Info_Icon.png';
    infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';
   
    @api staffId;
     @track ictUserType=false;
    @track employeeflag=true;
    @track invoiceFlag=false;
    @track taxationFlag=false;
    @track emergencyFlag=false;
    @track bankFlag=false;
    @track voluntaryFlag=false;
    @track historyFlag=false;
    @track employeeeditflag = false;
    @track invoiceeditFlag = false;
    @track taxationeditFlag=false;
    @track emergencyeditFlag = false;
    @track bankeditFlag = false;
    @track voluntaryeditFlag=false;  
    @track clientData=[];
    @track isattachError=false;
    @track isFileAttached=false
    @track selectedFilesToUpload = []; //store selected files
    @track showSpinner = false; //used for when to show spinner
    @track fileName;
    @track doc;
    @track fileSize;
    @track file; //holding file instance
    @track myFile;    
    @track fileType;//holding file type
    @track fileReaderObj;
    @track base64FileData; 
    @track totalPretaxvalue="Pre Tax Deduction - Total ";
    @track preTaxForSubmit;
    @track postTaxlabel='Post Tax Deduction - Total '
    @track postTaxLabelvalue=0;
    @track pretaxOne=0;
    @track  pretaxtwo=0;
    @track  pretaxThree=0;
    @track  pretaxFour=0;
    @track  pretaxFive=0;
    @track ShowPretaxModal;
    @track parentStaffId;
    @track preTaxRecId='';
    @track accountRecList = [];
    @track image;
    @track isHome=true;
    @track individualstaffassigments=[];
    @track fieldErrorMap = {};
    @track points;
    @track totalPoints;
    @track key;
    @track uploadedFiles1;
    @track documentedit=false;
    @track roleoptions = [];
    @track selectedRoleValues = [];
    @track selectedRoleEmploymentValues = [];
    @track genralHourlyRate ;
    @track sturdayHourlyRate ;
    @track sundayhourlyRate ;
    @track publicHolidayRate ;
    @track afterNoonShiftRate ;
    @track nightShiftRate ;
    @track sleepoverAllowance;
    @track selectedEmploymentRole = '';//manendra
    staffRoleComboboxValueSet = [];
    @track activeRoles = [];
    @track SelectedRole;
    @track isOpen = false;//manendra for custombox
    @track options = [];
    @track DisplayRole;
    @track DisplayLanguages;
    
    @track showPreTaxRecordEditForm=false;

    @track showStaffDocumentSection=false;
    activeSections = ['StaffDetails', 'EmploymentDetails', 'staffDocumentation', 'Address', 'ApproversDetails', 'Leaves'];
    activeSections1 = ['TaxationDetails', 'PreTaxDetails', 'PostTax'];
    @track staffDocumentMap={};
    @track showDocumentTable;
    @track  DocumentTableData=[];
    @track AddDocButtonDisable= false;
    @track selected = [];
    @track OrgNisationRoles=[{}];
    //@track createdShiftRole;
    @track paidBreak=true;
    @track editstaffflag = false;
    @track showDescription2 = false;
    @track showDescription3 = false;
    @track showDescription4 = false;
    @track showDescription5 = false;
    @track delete2 = false;
    @track delete3 = false;
    @track delete4 = false;
    @track descriptionone;
    @track descriptiontwo;
    @track descriptionthree;
    @track descriptionfour;
    @track descriptionfive;
    @track trainingFlag = false;
    @track orgId;
    @track StaffFacility='';
    @track noRecordsFlag=false;
    @track toggleValue;
    @track previousToggleValue;
    @track toggleValueGeolocation;
    @track previousToggleValueGeolocation;
    @track showLoadingSpinner=false;
    @track successmessage;
    @track facilityPreferredName;
    @track participantPreferredName;
    @track staffPreferredName;
    @track Nationality;
    @track Languages = [];
    
     /*  praveen changes for nursing awards start*/
    @track typeOfService;
    @track isSchadsAwards=false;
    @track isNursingAwards=false;
     /*  praveen changes for nursing awards end*/

    //Maheswari changes for child care awards
    @track isChildCareAwards=false;

    tLogoUrl = `${Loading_Logo}/TLogo.png`;
    tImageUrl = `${Loading_Logo}/T.png`;
    
    get logoUrl() {
        return this.tLogoUrl;
    }

    get imageUrl() {
        return this.tImageUrl;
    }
    @track DocumentColumns = [
        {
            label: 'Doc No',
            fieldName: 'Name',
            initialWidth: 150
            
        },
        {
            label: 'Type of Document',
            fieldName: 'Type__c',
            initialWidth: 200
            
          },{
          label: 'Comments',
          fieldName: 'Comments__c',
          initialWidth: 200
        },{
            label: 'Expiry Date',
            fieldName: 'Expiry_Date__c',
            type: 'date',
            typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"}, initialWidth: 150
            
          },/* {
            label: 'View File',
            fieldName: 'View_File__c',
            type: 'url',
            initialWidth: 150
            
          }, */
           {
            label: 'Status',
            fieldName: 'Status__c',
            cellAttributes: { class: { fieldName: 'statusClass' } },
            initialWidth: 120
        },

        {
            type: 'button',
            label: 'Approve',
            initialWidth: 100,
            typeAttributes: {
                label: 'Approve',
                name: 'approve',
                variant: 'success',
                disabled: { fieldName: 'disableApprove' }
            }
        },

        {
            type: 'button',
            label: 'Reject',
            initialWidth: 100,
            typeAttributes: {
                label: 'Reject',
                name: 'reject',
                variant: 'destructive',
                disabled: { fieldName: 'disableReject' }
            }
        },
          
        {            
            type: 'action',
            label: 'Action',  
            initialWidth: 100,          
            typeAttributes: {
                rowActions: actions,
            }
        }
        ];

        @track sectionFlags = {
            staffDetails: true,
            Addressdetails: false,
            EmploymentDetails: false,
            InvoiceDetails: false,
            TaxationDetails: true,
            PreTaxDeduction: false,
            PostTaxDeduction: false,
            EmergencyDetails: false,
            BankDetails: false,
            SuperannuationDetails: false,
            Leaves: false,
            ApproversDetails: false,
            staffDocumentation: false,
            staffDetails1: true,
            Addressdetails1: false,
            EmploymentDetails1: false,
            InvoiceDetails1: false,
            TaxationDetails1: true,
            PreTaxDeduction1: false,
            PostTaxDeduction: false,
            EmergencyDetails1: false,
            BankDetails1: false,
            SuperannuationDetails1: false,
            Leaves1: false,
            ApproversDetails1: false,
            staffDocumentation1: false,
            StaffTrainingStatus: false,
            staffhistory: true,
        };
        
        // Icons for the toggle buttons
        @track sectionIcons = {
            staffDetails: '\u2B9F', 
            Addressdetails: '\u2B9C',
            EmploymentDetails: '\u2B9C',
            InvoiceDetails: '\u2B9C',
            TaxationDetails: '\u2B9F',
            PreTaxDeduction: '\u2B9C',
            PostTaxDeduction: '\u2B9C',
            EmergencyDetails: '\u2B9C',
            BankDetails: '\u2B9C',
            SuperannuationDetails: '\u2B9C', 
            Leaves: '\u2B9C',
            ApproversDetails: '\u2B9C',
            staffDocumentation: '\u2B9C', 
            staffDetails1: '\u2B9F', 
            Addressdetails1: '\u2B9C',
            EmploymentDetails1: '\u2B9C',
            InvoiceDetails1: '\u2B9C',
            TaxationDetails1: '\u2B9F',
            PreTaxDeduction1: '\u2B9C',
            PostTaxDeduction1: '\u2B9C',
            EmergencyDetails1: '\u2B9C',
            BankDetails1: '\u2B9C',
            SuperannuationDetails1: '\u2B9C', 
            Leaves1: '\u2B9C',
            ApproversDetails1: '\u2B9C',
            staffDocumentation1: '\u2B9C', 
            StaffTrainingStatus: '\u2B9C',
            staffhistory: '\u2B9F',
            
        };

        @track showDropdown = false;
        @track filteredOptions = [];
        @track noResults = false;

    allNationalities = [
        'Afghan', 'American', 'Argentinian', 'Armenian', 'Australian', 'Azerbaijani', 'Bahraini', 'Bangladeshi', 
        'Bhutanese', 'Brazilian', 'British', 'Bruneian', 'Burmese', 'Cambodian', 'Canadian', 'Chilean', 'Chinese', 
        'Colombian', 'Cuban', 'Egyptian', 'Emirati', 'Fijian', 'Filipino', 'French', 'German', 'Ghanaian', 'Greek', 
        'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Israeli', 'Italian', 'Jamaican', 'Japanese', 'Jordanian', 'Kazakhstani', 
        'Kenyan', 'Kuwaiti', 'Kyrgyzstani', 'Laotian', 'Lebanese', 'Malaysian', 'Maldivian', 'Mexican', 'Mongolian', 'Moroccan', 
        'Nepali', 'New Zealander', 'Nigerian', 'North Korean', 'Norwegian', 'Omani', 'Pakistani', 'Peruvian', 'Portuguese', 'Qatari', 
        'Russian', 'Samoan', 'Saudi', 'Singaporean', 'South African', 'South Korean', 'Spanish', 'Sri Lankan', 'Swedish', 'Syrian', 
        'Taiwanese', 'Tajikistani', 'Thai', 'Tongan', 'Turkish', 'Uzbekistani', 'Vietnamese', 'Yemeni'
    ];
    @track selectedLangs = [];
    @track isExpanded = false;
       
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
    @track showRejectModal = false;
    @track comments = '';
    @track currentDocumentId = '';
    @api faclist=[];

    @api
    showStaffForm(staffId) {
        this.staffId = staffId;
        this.isModalOpen = true; // ✅ Open modal or section
        console.log('CreateEditStaff: Form opened for Staff ID', staffId);
    }

    @wire(CurrentPageReference)
    currentPageRef;
  
    @api propertyValue;
    get propertyValue() {
      return this.currentPageRef.state.c__propertyValue;
    }
  
    @api orgnisationId;
    get orgnisationId() {
      return this.currentPageRef.state.c__orgID;
    }
    @api pagename;
    get pagename() {
      return this.currentPageRef.state.c__page;
    }
    /* @api typeOfUser; */
    @track Typeofuser;
    @track typeOfDocument;
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    @track pageSizeOptions = [5, 10, 25, 50];
    @track pageSize;
    @track totalPages;
    @track pageNumber = 1;
    @track records = [];
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
  
     //@track hourlyRate;//manendra
   /*  @api typeOfUser; 
    get typeOfUser(){
        return this.currentPageRef.state.c__typeofUser; 
    }*/

    // @wire(getRoleOptions,{staffId: '$staffId'})
    // handleRoleOptions({error,data}){
    //     if(data){
    //         this.roleoptions = data.map(item => ({
    //             label: item,
    //             value: item
    //         }));
    //         console.log(" Available roleoptions:", JSON.stringify(this.roleoptions, null, 2));
    //     }else{
    //         console.error('error while fetching role options '+JSON.stringify(error));
    //     }
    // }


    /* fetchOptions() {
        console.log("🚀 [fetchOptions] START");
        console.log("📥 staffId received:", this.staffId);

        if (!this.staffId) {
            console.warn("⚠️ [fetchOptions] No staffId provided, aborting fetch");
            return;
        }

        // get Roles form the Facility
        getRoleOptions({ staffId: this.staffId })
        .then(data => {
            this.roleoptions = data.map(item => ({
                label: item,
                value: item
            }));
            console.log(" Available roleoptions:", JSON.stringify(this.roleoptions, null, 2));

            // Step 2: Fetch already assigned roles from Staff
            return getStaffRoles({ staffId: this.staffId });
        })
        .then(result => {
            this.selectedRoleValues = result;  
            console.log(" Pre-selected roles (Active):", JSON.stringify(this.selectedRoleValues, null, 2));
              this.selectedRoleEmploymentValues = this.selectedRoleValues.map(val => ({
                    label: val,
                    value: val
                }));
  this.staffRoleComboboxValueSet = [...this.selectedRoleEmploymentValues];
           return getSelectedRole({ staffId: this.staffId });
        })
         .then(lastSelectedRole => {
            console.log('manendra error');
            if (lastSelectedRole && this.selectedRoleValues.includes(lastSelectedRole)) {
                    this.selectedEmploymentRole = lastSelectedRole;
                } else {
                    this.selectedEmploymentRole = this.selectedRoleValues.length
                        ? this.selectedRoleValues[this.selectedRoleValues.length - 1]
                        : '';
                }
                 if (this.selectedEmploymentRole) {
                    this.fetchDropdownRoleWithRates();
                }
            })
        .catch(error => {
            console.error(" Error fetching roles:", error);
        })
        .finally(() => {
            console.log(" [fetchOptions] END");
        });
    } */
     // SCHADS Picklist Options
     jobTypeOptions = [
        { label: 'Full-time and part-time', value: 'Full-time and part-time' },
        { label: 'Casual', value: 'Casual' }
    ];
    schadsCategoryOptions = [
        { label: 'Social and community services employee', value: 'Social and community services employee' },
        { label: 'Crisis accommodation employee', value: 'Crisis accommodation employee' },
        { label: 'Family day care employee', value: 'Family day care employee' },
        { label: 'Home care employee', value: 'Home care employee' }
    ];
    schadsLevelOptions = [
        { label: 'Level 1', value: 'Level 1' },
        { label: 'Level 2', value: 'Level 2' },
        { label: 'Level 3', value: 'Level 3' },
        { label: 'Level 4', value: 'Level 4' },
        { label: 'Level 5', value: 'Level 5' },
        { label: 'Level 6', value: 'Level 6' },
        { label: 'Level 7', value: 'Level 7' },
        { label: 'Level 8', value: 'Level 8' }
    ];

    schadsPayPointOptions = [
        { label: 'Pay Point 1', value: 'Pay Point 1' },
        { label: 'Pay Point 2', value: 'Pay Point 2' },
        { label: 'Pay Point 3', value: 'Pay Point 3' },
        { label: 'Pay Point 4', value: 'Pay Point 4' }
    ];
    //Child Care
    childCareCategoryOptions = [
        { label: 'Adult', value: 'Adult' }        
    ];
    childCareLevelOptions = [
        { label: 'Level 1', value: 'Level 1' },
        { label: 'Level 2', value: 'Level 2' },
        { label: 'Level 3', value: 'Level 3' },
        { label: 'Level 4', value: 'Level 4' },
        { label: 'Level 5', value: 'Level 5' },
        { label: 'Level 6', value: 'Level 6' },
        { label: 'Level 7', value: 'Level 7' },
        { label: 'Level 8', value: 'Level 8' }
    ];

    childCarePayPointOptions = [
        { label: 'Pay Point 1', value: 'Pay Point 1' },
        { label: 'Pay Point 2', value: 'Pay Point 2' },
        { label: 'Pay Point 3', value: 'Pay Point 3' }
    ];
    // Nursing Picklist Options
    nursingCategoryOptions = [
        { label: 'Nursing Care', value: 'Nursing Care' }
    ];

    nursingLevelOptions = [
{ label: 'Nursing Assistant', value: 'Nursing Assistant' },
{ label: 'Student Enroller Nurse', value: 'Student Enroller Nurse' },
{ label: 'Enrolled Nurse', value: 'Enrolled Nurse' },
{ label: 'Registered Nurse with 4 year degree', value: 'Registered Nurse with 4 year degree' },
{ label: 'Registered Nurse with a master degree', value: 'Registered Nurse with a master degree' },
{ label: 'Register Nurse - level 1', value: 'Register Nurse - level 1' },
{ label: 'Register Nurse - level 2', value: 'Register Nurse - level 2' },
{ label: 'Register Nurse - level 3', value: 'Register Nurse - level 3' },
{ label: 'Register Nurse - level 4', value: 'Register Nurse - level 4' },
{ label: 'Register Nurse - level 5', value: 'Register Nurse - level 5' },
{ label: 'Nurse Practitioner', value: 'Nurse Practitioner' },
{ label: 'Occupational Health Nurse - level 1', value: 'Occupational Health Nurse - level 1' },
{ label: 'Occupational Health Nurse - level 2', value: 'Occupational Health Nurse - level 2' },
{ label: 'Senior Occupational Health Clinical Nurse', value: 'Senior Occupational Health Clinical Nurse' },
{ label: 'Occupational Health Nurse - level 3', value: 'Occupational Health Nurse - level 3' }

    ];

    nursingPayPointOptions = [
    { label: '1st Year', value: '1st Year' },
    { label: '2nd Year', value: '2nd Year' },
    { label: '3rd Year', value: '3rd Year' },
    { label: 'Experienced', value: 'Experienced' },
    { label: 'Less than 21 years age', value: 'Less than 21 years age' },
    { label: '21 years of age and over', value: '21 years of age and over' },
    { label: 'Pay Point 1', value: 'Pay Point 1' },
    { label: 'Pay Point 2', value: 'Pay Point 2' },
    { label: 'Pay Point 3', value: 'Pay Point 3' },
    { label: 'Pay Point 4', value: 'Pay Point 4' },
    { label: 'Pay Point 5', value: 'Pay Point 5' },
    { label: 'Entry Rate', value: 'Entry Rate' },
    { label: 'Pay Point 6', value: 'Pay Point 6' },
    { label: 'Pay Point 7', value: 'Pay Point 7' },
    { label: 'Pay Point 8', value: 'Pay Point 8' },
    { label: 'Grade 1', value: 'Grade 1' },
    { label: 'Grade 2', value: 'Grade 2' },
    { label: 'Grade 3', value: 'Grade 3' },
    { label: 'Grade 4', value: 'Grade 4' },
    { label: 'Grade 5', value: 'Grade 5' },
    { label: 'Grade 6', value: 'Grade 6' }
    ];

//    toggleDropdown(e) {
//         e.stopPropagation();
//         this.isOpen = !this.isOpen;
//     }
    
    toggleDropdown(event) {
        event.stopPropagation(); // prevent bubbling from the button
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            // Bind ensures 'this' refers to the component
            this._boundHandleClickOutside = this.handleClickOutside.bind(this);
            window.addEventListener('click', this._boundHandleClickOutside);
        } else {
            window.removeEventListener('click', this._boundHandleClickOutside);
        }
    }
    //manendra fr customcombobox
     get chevronIcon() {
        return this.isOpen ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get selectedOptionClass() {
        return this.selectedRoleValues.length > 0 ? 'selected-text' : 'placeholder-text';
    }

    get displayText() {
        const count = this.selectedRoleValues.length;
        if (count === 0) {
            return 'Select Roles';
        } else{
            return this.selectedRoleValues[0];
        }
        
    }//manendra fr customcombobox
    /* async fetchOptions() {
        console.log(" [fetchOptions] START");
        console.log(" staffId received:", this.staffId);

        if (!this.staffId) {
            console.warn(" [fetchOptions] No staffId provided, aborting fetch");
            return;
        }

        try {
            // Step 1: Fetch available Role options
            console.log(" Step 1: Fetching available Role options from Facility...");
            const data = await getRoleOptions({ staffId: this.staffId });
            console.log(" [getRoleOptions] Response received:", JSON.stringify(data, null, 2));

            this.options = data.map((item, index) => {
                const isActive = this.selectedRoleValues.includes(item);
                return {
                    id: index.toString(),
                    label: item,
                    value: item,
                    checked: isActive, 
                    statusText: isActive ? 'Active' : 'Inactive',
                    badgeClass: isActive ? 'badge-active' : 'badge-inactive',
                    buttonClass: 'option-button',
                    isDisabled: false
                };
            });//manendra fr custom combo
            console.log(" [roleoptions] Final mapped roleoptions:", JSON.stringify(this.roleoptions, null, 2));

            // Step 2: Fetch already assigned Staff Roles
            console.log(" Step 2: Fetching already assigned Staff Roles...");
            const result = await getStaffRoles({ staffId: this.staffId });
            console.log(" [getStaffRoles] Response received:", JSON.stringify(result, null, 2));

            this.selectedRoleValues = result || [];
            console.log(" [selectedRoleValues] Active roles:", JSON.stringify(this.selectedRoleValues, null, 2));

            this.selectedRoleEmploymentValues = this.selectedRoleValues.map(val => ({
                label: val,
                value: val
            }));
            console.log(" [selectedRoleEmploymentValues] Populated:", JSON.stringify(this.selectedRoleEmploymentValues, null, 2));

            this.staffRoleComboboxValueSet = [...this.selectedRoleEmploymentValues];
            console.log(" [staffRoleComboboxValueSet] Final combo values:", JSON.stringify(this.staffRoleComboboxValueSet, null, 2));

            // Step 4: Fetch rates for selected role
            if (this.selectedEmploymentRole) {
                console.log(" Step 4: Fetching rates for selectedEmploymentRole:", this.selectedEmploymentRole);
                await new Promise(resolve => setTimeout(async () => {
                    await this.fetchDropdownRoleWithRates();
                    resolve();
                }, 1500));
            } else {
                console.warn("⚠️ [fetchOptions] No selectedEmploymentRole found, skipping rate fetch");
            }

        } catch (error) {
            console.error(" [fetchOptions] Error occurred:", error);
        } finally {
            console.log(" [fetchOptions] END");
        }
    } */
    
async fetchOptions() {
    console.log("[fetchOptions] START");
    console.log("staffId received:", this.staffId);

    if (!this.staffId) {
        console.warn("[fetchOptions] No staffId provided — aborting fetch");
        return;
    }

    try {
        // Step 1: Fetch available Role options
        console.log("Step 1: Fetching all available Role options from Facility...");
        const allRoles = await getRoleOptions({ staffId: this.staffId });
        console.log("[getRoleOptions] Response received:", JSON.stringify(allRoles, null, 2));

        if (!allRoles || allRoles.length === 0) {
            console.warn("[getRoleOptions] Returned empty or null data");
        }

        // Step 2: Fetch already assigned Staff Roles
        console.log("Step 2: Fetching already assigned (Active) Staff Roles...");
        const activeRoles = await getStaffRoles({ staffId: this.staffId });
        console.log("[getStaffRoles] Response received:", JSON.stringify(activeRoles, null, 2));

        this.selectedRoleValues = activeRoles || [];
        console.log("[selectedRoleValues] Active roles:", JSON.stringify(this.selectedRoleValues, null, 2));
/* //role bug fix
const facilityRoleSet = new Set(allRoles);
this.selectedRoleValues = this.selectedRoleValues.filter(role =>
    facilityRoleSet.has(role)
);
console.log("[UI FIX] Cleaned selectedRoleValues:", JSON.stringify(this.selectedRoleValues));
//end */
        // Step 3: Map all roles and mark active ones as checked
        console.log("Step 3: Mapping role options and setting checked status...");
        this.options = allRoles.map((role, index) => {
            const isActive = this.selectedRoleValues.includes(role);

            const mappedItem = {
                id: index.toString(),
                label: role,
                value: role,
                checked: isActive,
                isActive: isActive,
                statusText: isActive ? 'Active' : 'Inactive',
                buttonClass: this.getOptionButtonClass(isActive),
                badgeClass: this.getBadgeClass(isActive),
                toggleTrackClass: this.getToggleTrackClass({ checked: isActive }),
                isDisabled: false
            };

            console.log(`   ↳ [Role Option ${index}] ${role} → ${isActive ? "Active" : "Inactive"}`);
            return mappedItem;
        });

        console.log("[options] Final mapped options:", JSON.stringify(this.options, null, 2));

        // Step 4: Prepare combo box values for UI
        this.selectedRoleEmploymentValues = this.selectedRoleValues.map(val => ({
            label: val,
            value: val
        }));
        console.log(" [selectedRoleEmploymentValues] Populated:", JSON.stringify(this.selectedRoleEmploymentValues, null, 2));

        this.staffRoleComboboxValueSet = [...this.selectedRoleEmploymentValues];
        console.log("[staffRoleComboboxValueSet] Final combo values:", JSON.stringify(this.staffRoleComboboxValueSet, null, 2));
      
        // Step 5: Fetch rates if selected role exists
        if (this.selectedEmploymentRole) {
            console.log("Step 5: Fetching rates for selectedEmploymentRole:", this.selectedEmploymentRole);
            console.log("Waiting 1.5s before fetching rates...");
            await new Promise(resolve => setTimeout(async () => {
                console.log("Calling fetchDropdownRoleWithRates() now...");
                await this.fetchDropdownRoleWithRates();
                console.log("[fetchDropdownRoleWithRates] Completed");
                resolve();
            }/* , 1500 */));
        } else {
            console.warn("[fetchOptions] No selectedEmploymentRole found, skipping rate fetch");
        }

    } catch (error) {
        console.error("[fetchOptions] Error occurred:", error);
        console.error("Stack trace:", error?.stack);
    } finally {
        console.log("[fetchOptions] END");
    }
}



    
    // handleToggleActive(e) {
    //     const optionId = e.target.dataset.optionId;
    //     const option = this.options.find(opt => opt.id === optionId);
    //     if (!option) return;

    //     option.checked = e.target.checked;
    //     option.statusText = option.checked ? 'Active' : 'Inactive';
    //     option.badgeClass = option.checked ? 'badge-active' : 'badge-inactive';

    //     this.updateSelectedRoles();
    // }

        handleToggleActive(e) {
        const optionId = e.target.dataset.optionId;
        const option = this.options.find(opt => opt.id === optionId);
        if (!option) return;

        const isChecked = e.target.checked;

        // Update option state
        option.checked = isChecked;
        option.isActive = isChecked;
        option.statusText = isChecked ? 'Active' : 'Inactive';

        // Update dynamic CSS classes using helper methods
        option.buttonClass = this.getOptionButtonClass(isChecked);
        option.badgeClass = this.getBadgeClass(isChecked);
        option.toggleTrackClass = this.getToggleTrackClass(option);

        // Update selected roles or any other dependent state
        this.updateSelectedRoles();
        }



    handleSelectOption(e) {
        const optionId = e.target.dataset.optionId;
        const option = this.options.find(opt => opt.id === optionId);
        if (!option) return;

        this.updateSelectedRoles();
    }

    //manendra fr custom combo
    updateSelectedRoles() {
        // Collect all checked roles
        this.selectedRoleValues = this.options
            .filter(opt => opt.checked)
            .map(opt => opt.label);

        // Update combobox values
        this.selectedRoleEmploymentValues = this.selectedRoleValues.map(val => ({
            label: val,
            value: val
        }));

        this.staffRoleComboboxValueSet = [...this.selectedRoleEmploymentValues];

        // ✅ If no options are checked, reset selectedEmploymentRole
        if (this.selectedRoleValues.length === 0) {
            this.selectedEmploymentRole = '';
        }

        console.log('🔄 [updateSelectedRoles] Active:', JSON.stringify(this.selectedRoleValues));
    }


    async fetchActiveRoles() {
    console.log(" [fetchActiveRoles] START");
    try {
        if (!this.staffId) {
            console.warn(" [fetchActiveRoles] No staffId provided.");
            return;
        }
        const result = await getActiveStaffRoles({ staffId: this.staffId });
        console.log(" Active Roles fetched:", JSON.stringify(result, null, 2));
          this.activeRoles = result.map(role => {
            return {
                RoleName: role.RoleName ? String(role.RoleName) : '--',
                CategoryType: role.CategoryType ? String(role.CategoryType) : '--',
                ClassificationLevel: role.ClassificationLevel ? String(role.ClassificationLevel) : '--',
                ClassificationPayType: role.ClassificationPayType ? String(role.ClassificationPayType) : '--',
                JobType: role.JobType ? String(role.JobType) : '--',
                HourlyRate: role.HourlyRate != null ? Number(role.HourlyRate).toFixed(2) : '--',
                SaturdayRate: role.SaturdayRate != null ? Number(role.SaturdayRate).toFixed(2) : '--',
                SundayRate: role.SundayRate != null ? Number(role.SundayRate).toFixed(2) : '--',
                PublicHolidayRate: role.PublicHolidayRate != null ? Number(role.PublicHolidayRate).toFixed(2) : '--',
                AfternoonShiftRate: role.AfternoonShiftRate != null ? Number(role.AfternoonShiftRate).toFixed(2) : '--',
                NightShiftRate: role.NightShiftRate != null ? Number(role.NightShiftRate).toFixed(2) : '--',
                SleepoverAllowance: role.SleepoverAllowance != null ? Number(role.SleepoverAllowance).toFixed(2) : '--'
            };
        });
    } catch (error) {
        console.error("[fetchActiveRoles] Error fetching active roles:", error);
    } finally {
        console.log(" [fetchActiveRoles] END");
    }
}
    async fetchDropdownRoleWithRates() {
        console.log(" [fetchDropdownRoleWithRates] START");
        console.log("staffId received:", this.staffId);
        console.log(" selectedEmploymentRole:", this.selectedEmploymentRole);

        if (!this.staffId) {
            console.warn("⚠️ [fetchDropdownRoleWithRates] No staffId provided, aborting fetch");
            return;
        }

        try {
            console.log(" Step 1: Fetching Staff Role with Rates...");
            const result = await getStaffRoleWithRates({
                staffId: this.staffId,
                roleName: this.selectedEmploymentRole
            });
            console.log("[getStaffRoleWithRates] Response received:", JSON.stringify(result, null, 2));

            if (result && result.RoleName === this.selectedEmploymentRole) {
                console.log(" Matching Role Found:", result.RoleName);
                this.selectedEmploymentRole = result.RoleName;
                this.genralHourlyRate = result.HourlyRate;
                this.sturdayHourlyRate = result.SaturdayRate;
                this.sundayhourlyRate = result.SundayRate;
                this.publicHolidayRate = result.PublicHolidayRate;
                this.afterNoonShiftRate = result.AfternoonShiftRate;
                this.nightShiftRate = result.NightShiftRate;
                this.sleepoverAllowance = result.SleepoverAllowance;
                this.jobType = result.jobType;
                this.categoryType = result.categoryType;
                this.classificationLevel = result.classificationLevel;
                this.classificationPayType = result.classificationPayType;


                console.log("[Rates Updated]");
                console.log("HourlyRate:", this.genralHourlyRate);
                console.log("SaturdayRate:", this.sturdayHourlyRate);
                console.log("SundayRate:", this.sundayhourlyRate);
                console.log("PublicHolidayRate:", this.publicHolidayRate);
                console.log("AfternoonShiftRate:", this.afterNoonShiftRate);
                console.log("NightShiftRate:", this.nightShiftRate);
                console.log("SleepoverAllowance:", this.sleepoverAllowance);
                 console.log("classificationPayType:", this.classificationPayType);

                console.log(" [Combobox Values] Rebuilt for all selected roles:", JSON.stringify(this.selectedRoleEmploymentValues, null, 2));
            } else {
                console.warn(" [fetchDropdownRoleWithRates] No matching role found or rates unavailable");
                console.log("  Expected Role:", this.selectedEmploymentRole);
                console.log("  Returned Role:", result ? result.RoleName : " None");
            }

        } catch (error) {
            console.error(" [fetchDropdownRoleWithRates] Error occurred:", error);
        } finally {
            console.log(" [fetchDropdownRoleWithRates] END");
        }
    }//manendra

   /*  handleHourlyRateChange(event) {
    const value = event.target.value;
    this.genralHourlyRate = value ? parseFloat(value) : 0;
    console.log('Hourly Rate entered:', this.genralHourlyRate);
}*///manendra
handleHourlyRateChange(event) {
    const fieldName = event.target.name;
    const value = event.target.value;
    console.log(`Raw value from input ${fieldName}:`, value, typeof value);

    // Convert to decimal
    const decimalValue = value !== undefined && value !== null && value !== '' ? parseFloat(value) : null;
    console.log(`Converted decimal ${fieldName}:`, decimalValue, typeof decimalValue);

    switch(fieldName) {
        case 'genralHourlyRate':
            this.genralHourlyRate = decimalValue;
            break;
        case 'sturdayHourlyRate':
            this.sturdayHourlyRate = decimalValue;
            break;
        case 'sundayhourlyRate':
            this.sundayhourlyRate = decimalValue;
            break;
        case 'publicHolidayRate':
            this.publicHolidayRate = decimalValue;
            break;
        case 'afterNoonShiftRate':
            this.afterNoonShiftRate = decimalValue;
            break;
        case 'nightShiftRate':
            this.nightShiftRate = decimalValue;
            break;
        case 'sleepoverAllowance':
            this.sleepoverAllowance = decimalValue;
            break;
    }
}


//manendra
    
   get options() {
       /*  return [
            { label: 'Visa Status', value: 'Visa Status' },
            { label: 'Drivers Licence', value: 'Drivers Licence' },
            { label: 'Working With Vulnerable People', value: 'Working With Vulnerable People' }, 
            { label: 'Covid Immunisation', value: 'Covid Immunisation' },
            { label: 'Registration', value: 'Registration' },
            { label: 'Certificate', value: 'Certificate' },
            { label: 'Other', value: 'Other' },
        ]; */
        return [
        { label: 'Visa Status', value: 'Visa Status' },
        { label: 'Drivers Licence', value: 'Drivers Licence' },
        { label: 'Working With Vulnerable People', value: 'Working With Vulnerable People' },
        { label: 'Covid Immunisation', value: 'Covid Immunisation' },
        { label: 'Registration', value: 'Registration' },
        { label: 'Certificate', value: 'Certificate' },
      
        { label: 'Working With Children Check (WWCC)', value: 'Working With Children Check (WWCC)' },
        { label: 'NDIS Worker Screening', value: 'NDIS Worker Screening' },
        { label: 'NDIS Worker Orientation Certificate', value: 'NDIS Worker Orientation Certificate' },
        { label: 'Signed Code of Conduct', value: 'Signed Code of Conduct' },
        { label: 'Infection Control Training', value: 'Infection Control Training' },
        { label: 'First Aid Certificate', value: 'First Aid Certificate' },
        { label: 'Qualifications', value: 'Qualifications' },
        { label: 'Police Check', value: 'Police Check' },
        { label: 'Australian Passport', value: 'Australian Passport' },
        { label: 'Foreign Passport', value: 'Foreign Passport' },
        { label: 'Medicare Card', value: 'Medicare Card' },
        { label: 'Birth Certificate', value: 'Birth Certificate' },
        { label: 'Certificate of Identity', value: 'Certificate of Identity' },
        { label: 'Photo ID', value: 'Photo ID' },
        { label: 'Proof of Age Card', value: 'Proof of Age Card' },
        { label: 'Rating Authority', value: 'Rating Authority' },
        { label: 'Citizenship Certificate', value: 'Citizenship Certificate' },
        { label: 'Change of Name Certificate', value: 'Change of Name Certificate' },
        { label: 'Bank Statement 1', value: 'Bank Statement 1' },
        { label: 'Bank Statement 2', value: 'Bank Statement 2' },
        { label: 'Centrelink Card', value: 'Centrelink Card' },
        { label: 'DVA Card', value: 'DVA Card' },
        { label: 'Lease Agreement', value: 'Lease Agreement' },
        { label: 'Marriage Certificate', value: 'Marriage Certificate' },
        { label: 'Utility Bill 1', value: 'Utility Bill 1' },
        { label: 'Utility Bill 2', value: 'Utility Bill 2' },
        { label: 'Foreign Birth Certificate', value: 'Foreign Birth Certificate' },
        { label: 'Indigenous Reference', value: 'Indigenous Reference' },
        { label: 'Other', value: 'Other' },
    ];
    }

    hierarchicalOptions = [
    {
        id: '100-points-id',
        label: '100 Points of ID',
        value: '100-points-id',
        children: [
            {
                id: 'primary-id',
                label: 'Primary Identity Document',
                value: 'primary-id',
                children: [
                    { id: 'aus-passport', label: 'Australian passport (60pts)', value: 'Australian Passport', parent: 'primary-id' },
                    { id: 'foreign-passport', label: 'Foreign passport (60pts)', value: 'Foreign Passport', parent: 'primary-id' },
                    { id: 'drivers-license', label: 'Driver’s License/permit (40pts)', value: 'Drivers Licence', parent: 'primary-id' },
                    { id: 'medicare-card', label: 'Medicare card (25pts)', value: 'Medicare Card', parent: 'primary-id' }
                ]
            },
            {
                id: 'secondary-id',
                label: 'Secondary Identity Document',
                value: 'secondary-id',
                children: [
                    { id: 'birth-cert', label: 'Birth certificate (40pts)', value: 'Birth Certificate', parent: 'secondary-id' },
                    { id: 'identity-cert', label: 'Certificate of identity (40pts)', value: 'Certificate of Identity', parent: 'secondary-id' },
                    { id: 'photo-id', label: 'Photo ID (40pts)', value: 'Photo ID', parent: 'secondary-id' },
                    { id: 'proof-age', label: 'Proof of age card (40pts)', value: 'Proof of Age Card', parent: 'secondary-id' },
                    { id: 'rating-authority', label: 'Rating authority (25pts)', value: 'Rating Authority', parent: 'secondary-id' },
                    { id: 'citizenship-cert', label: 'Citizenship certificate (25pts)', value: 'Citizenship Certificate', parent: 'secondary-id' },
                    { id: 'name-change-cert', label: 'Change of name certificate (25pts)', value: 'Change of Name Certificate', parent: 'secondary-id' },
                    { id: 'bank-statement-1', label: 'Bank statement 1 (20pts)', value: 'Bank Statement 1', parent: 'secondary-id' },
                    { id: 'bank-statement-2', label: 'Bank statement 2 (20pts)', value: 'Bank Statement 2', parent: 'secondary-id' },
                    { id: 'centrelink-card', label: 'Centrelink card (20pts)', value: 'Centrelink Card', parent: 'secondary-id' },
                    { id: 'dva-card', label: 'DVA card (20pts)', value: 'DVA Card', parent: 'secondary-id' },
                    { id: 'lease-agreement', label: 'Lease agreement (20pts)', value: 'Lease Agreement', parent: 'secondary-id' },
                    { id: 'marriage-cert', label: 'Marriage certificate (20pts)', value: 'Marriage Certificate', parent: 'secondary-id' },
                    { id: 'utility-bill-1', label: 'Utility bill 1 (20pts)', value: 'Utility Bill 1', parent: 'secondary-id' },
                    { id: 'utility-bill-2', label: 'Utility bill 2 (20pts)', value: 'Utility Bill 2', parent: 'secondary-id' },
                    { id: 'foreign-birth-cert', label: 'Birth certificate (foreign) (15pts)', value: 'Foreign Birth Certificate', parent: 'secondary-id' },
                    { id: 'indigenous-ref', label: 'Indigenous reference (15pts)', value: 'Indigenous Reference', parent: 'secondary-id' }
                ]
            }
        ]
    },
    {
        id: 'other-docs',
        label: 'Other Documents',
        value: 'other-docs',
        children: [
            { id: 'wwcc', label: 'Working With Children Check (WWCC)', value: 'Working With Children Check (WWCC)', parent: 'other-docs' },
            { id: 'ndis-screening', label: 'NDIS Worker Screening', value: 'NDIS Worker Screening', parent: 'other-docs' },
            { id: 'ndis-orientation', label: 'NDIS Worker Orientation Certificate', value: 'NDIS Worker Orientation Certificate', parent: 'other-docs' },
            { id: 'code-of-conduct', label: 'Signed Code of Conduct', value: 'Signed Code of Conduct', parent: 'other-docs' },
            { id: 'infection-training', label: 'Infection Control Training', value: 'Infection Control Training', parent: 'other-docs' },
            { id: 'first-aid', label: 'First Aid Certificate', value: 'First Aid Certificate', parent: 'other-docs' },
            { id: 'Qualifications', label: 'Qualifications', value: 'Qualifications', parent: 'other-docs' },
            { id: 'police-check', label: 'Police Check', value: 'Police Check', parent: 'other-docs' },
            { id: 'visa-status', label: 'Visa Status', value: 'Visa Status', parent: 'other-docs' },
            { id: 'vulnerable-people', label: 'Working With Vulnerable People', value: 'Working With Vulnerable People', parent: 'other-docs' },
            { id: 'covid-immunisation', label: 'Covid Immunisation', value: 'Covid Immunisation', parent: 'other-docs' },
            { id: 'registration', label: 'Registration', value: 'Registration', parent: 'other-docs' },
            { id: 'certificate', label: 'Certificate', value: 'Certificate', parent: 'other-docs' },
            { id: 'other', label: 'Other', value: 'Other', parent: 'other-docs' }
        ]
    }
];


    handleErrorCss(event) {
    const field = event.target.fieldName;
    const isValid = event.target.reportValidity();
    console.log('isValid',isValid);

    this.fieldErrorMap[field] = !isValid;
}

    getFieldClass(fieldName) {
        return this.fieldErrorMap[fieldName] ? 'floating-label1' : 'floating-label';
    }
    get emailClass() {
        return this.getFieldClass('Email__c');
    }
     get DateOfBirthClass() {
        return this.getFieldClass('Date_Of_Birth__c');
    }

    handleMouseOver(event) {
        const img = event.target;
        img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
        img.style.opacity = '0'; // Start fade-out for the current image
    
        setTimeout(() => {
            img.src = this.infoiconhover; // Change the image
            img.style.opacity = '1'; // Fade-in the new image
        }, 150); // Wait for the fade-out to complete
    }
    
    handleMouseOut(event) {
        const img = event.target;
        img.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'; // Add dissolve effect
        img.style.opacity = '0'; // Start fade-out for the current image
    
        setTimeout(() => {
            img.src = this.infoicon; // Change back to the default image
            img.style.opacity = '1'; // Fade-in the default image
        }, 150); // Wait for the fade-out to complete
    }
    

    backTostaff(event){
      /*   if (!this.orgnisationId && !this.propertyValue) {
            console.error('Organisation ID is not defined.');
            return;
        } 
       if(this.pagename=='administration')
       {
        this[NavigationMixin.Navigate]({
            
            type: 'comm__namedPage',
            
            attributes: {
              pageName: this.pagename,
             
            },
            state: {
              c__propertyValue: "Staff",
              c__orgID:this.orgnisationId
            },
          });
       }
       else{
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
            
                pageName: 'humanresources'
            },
        });  

       } */
         localStorage.removeItem('activeAdminStaffTab');
        const customEvent = new CustomEvent('staffevent', {
            detail: { message: 'Hello from Child!' }
        });
        this.dispatchEvent(customEvent);
    
      }
    @track disableedit = true;
   
    handleEmployee(event){
    this.employeeflag=true;
    this.invoiceFlag=false;
    this.taxationFlag=false;
    this.emergencyFlag=false;
    this.bankFlag=false;
    this.voluntaryFlag=false;
    this.employeeeditflag=false;
    this.invoiceeditFlag=false;
    this.taxationeditFlag=false;
    this.emergencyeditFlag=false;
    this.bankeditFlag=false;
    this.voluntaryeditFlag=false;
     this.trainingFlag = false;
     this.disableedit = true;
     this.historyFlag = false;
    localStorage.setItem('activeAdminStaffTab', 'staffEmployee');
    }
    handleInvoice(event){
        this.employeeflag=false;
        this.invoiceFlag=true;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
         this.trainingFlag = false;
         this.disableedit = true;
         this.historyFlag = false;
    }
    handleTax(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=true;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
        this.trainingFlag = false;
        this.disableedit = true;
        this.historyFlag = false;
       
        localStorage.setItem('activeAdminStaffTab', 'staffTax');
         this.voluntaryMethod();
    }
    handleVoluntary(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=true;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
         this.trainingFlag = false;
         this.disableedit = true;
         this.historyFlag = false;
        this.voluntaryMethod();
    }
    handleEmergency(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=true;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
         this.trainingFlag = false;
         this.disableedit = true;
         this.historyFlag = false;
    }
    handleBank(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=true;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
         this.trainingFlag = false;
         this.disableedit = true;
         this.historyFlag = false;
    }
    handletraining(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
        this.trainingFlag = true;
        this.disableedit = false;
        this.historyFlag = false;
    }
     handleHistory(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
        this.trainingFlag = false;
        this.historyFlag = true;
        this.disableedit = false
        localStorage.setItem('activeAdminStaffTab', 'staffHistory');
    }

    /* handleRoleOptionsChange(event) {
        // The selected values come as an array from event.detail.value
        this.selectedRoleValues = event.detail.value;

        console.log('🔄 [handleChange] Dual listbox changed');
        console.log('📥 Selected Values:', JSON.stringify(this.selectedRoleValues));
        if (this.selectedRoleValues && this.selectedRoleValues.length > 0) {
            console.log('✅ At least one value selected');

            // Convert plain values into combobox option objects
            this.selectedRoleEmploymentValues = this.selectedRoleValues.map(val => ({
                label: val,
                value: val
            }));

         this.staffRoleComboboxValueSet = [...this.selectedRoleEmploymentValues];
       if (!this.selectedRoleValues.includes(this.selectedEmploymentRole)) {
    this.selectedEmploymentRole = this.selectedRoleValues.length
        ? this.selectedRoleValues[this.selectedRoleValues.length - 1]
        : '';
}
            console.log('selected staff role 2 ==>'+this.selectedEmploymentRole);
            console.log('🎯 Built role options for combobox:', JSON.stringify(this.selectedRoleEmploymentValues));
        } else {
            console.log('⚠️ No values selected, clearing selectedRoleEmploymentValues');
            this.selectedRoleEmploymentValues = [];
        }

        console.log('🏁 [handleRoleOptionsChange] END');
    } */
handleRoleinEmploymentChange(event) {
    this.selectedEmploymentRole = event.detail.value; //manendra
    console.log('selected staff role 3 ==>'+this.selectedEmploymentRole);
    console.log('Role picked for hourly rate:', this.selectedEmploymentRole);
    this.fetchDropdownRoleWithRates();

}
    
    handleEditEmployee() {
        this.fieldErrorMap = {};
        if (this.employeeflag) {
            this.employeeeditflag = true;
            this.successmessage='Employee Details updated successfully.';
            //this.ShowDocumentSection();
            this.totalfiles=[];
            this.parentStaffId=this.staffId; 
            this.disableedit = true;
            this.primaryApproverValue=this.clientData[0].Make_Primary_as_Approver__c;
            this.secondaryApproverValue=this.clientData[0].Make_Secondary_as_Approver__c; 
            this.Nationality=this.clientData[0].Nationality__c;
            const savedLangs = this.clientData[0].Languages__c;
            if (savedLangs) {
                // Handle both comma and semicolon separated values
                this.selectedLangs = savedLangs.split(/[;,]+/)
                    .map(lang => lang.trim())
                    .filter(Boolean);
            } else {
                this.selectedLangs = [];
            }

            this.Languages = this.LANGUAGE_OPTIONS.map(lang => {
                const isSelected = this.selectedLangs.includes(lang);
                return {
                    id: lang,
                    label: lang,
                    checked: isSelected,
                    buttonClass: 'option-button',
                    badgeClass: isSelected ? 'status-badge active' : 'status-badge inactive',
                    statusText: isSelected ? 'Active' : 'Inactive'
                };
            });

            console.log('📋 Selected Languages:', JSON.stringify(this.selectedLangs));
            console.log('✅ Updated Languages State:', JSON.stringify(this.Languages));
            console.log('✅ Parsed Selected Languages:', this.selectedLangs);
            console.log('Nationality123456:', this.clientData[0].Nationality__c);
            console.log('Languages:', this.clientData[0].Languages__c);
            this.hasRecords = this.DocumentTableData.length > 0;
            console.log('hasRecords:', this.hasRecords);
            console.log('📋 DocumentTableData:', JSON.stringify(this.DocumentTableData));
            


            this.fetchOptions();
            // this.voluntaryMethod();
             console.log(' this.secondaryApproverValue,this.primaryApproverValue',this.secondaryApproverValue+this.primaryApproverValue)

        } else if (this.invoiceFlag) {
            this.invoiceeditFlag = true;
        } else if (this.taxationFlag) {
            console.log('taxtype',this.taxationFlag);
            console.log('sathourrate', this.saturdayHourlyRate);
             console.log('employeetype', this.classificationPayType);
            console.log('HourlyRate', this.genralHourlyRate);
            this.successmessage='Tax updated successfully.';
            this.taxationeditFlag = true;
            this.pretaxOne=this.clientData[0].Pre_Tax_One_Value__c;
        this.pretaxtwo=this.clientData[0].Pre_Tax_Two_Value__c;
        this.pretaxThree=this.clientData[0].Pre_Tax_Three_Value__c;
        this.pretaxFour=this.clientData[0].Pre_Tax_Four_Value__c;
        this.pretaxFive=this.clientData[0].Pre_Tax_Five_Value__c;
        this.preTaxForSubmit=this.clientData[0].Pre_Tax_Calculator__c;
        this.postTaxLabelvalue=this.clientData[0].Post_Tax__c;
        } else if (this.emergencyFlag) {
            this.emergencyeditFlag = true;
        } else if (this.bankFlag) {
            this.bankeditFlag = true;
        } else if (this.voluntaryFlag) {
            this.voluntaryeditFlag = true;
            this.voluntaryMethod();
        } 
        this.fileName = '';
    }
    handleback() {
        this.isHome=true;
        this.isModalOpen=false;
        this.currentUrl='';
        this.employeeflag=true;
    }
     loadStaffAssignment() {
                getStaffAssignmentsbyId({ staffId: this.staffId })
                    .then(result => {
                        this.individualstaffassigments = result.map(assign => ({
                            ...assign,
                            modulename: this.capitalizeFirstLetter(assign.Module_Name__r?.Name ?? ''),
                            fullName: `${assign.Staff__r?.Name ?? 'N/A'} ${assign.Staff__r?.Last_Name__c ?? ''}`,
                            description: this.capitalizeFirstLetter(assign.Module_Name__r?.description__c ?? ''),
                            Dueby: assign.Due_Date__c ? new Date(assign.Due_Date__c).toLocaleDateString('en-GB') : '',
                            completeddate:assign.Completed_Date__c ? new Date(assign.Completed_Date__c).toLocaleDateString('en-GB') : '',
                            uiStatus: assign.Status__c=="Inprogress" ?"In Progress":assign.Status__c
                        }));
                        console.log('Assign records', JSON.stringify(this.staffassigments));
                        console.log('individual records', JSON.stringify(this.individualstaffassigments));
                    })
                    .catch(error => {
                        console.error('Error fetching modules:', error);
                    });
            }

            capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    /* handleEditEmployee(event){
        this.employeeflag=true;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=true;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
        this.fileName='';

        this.primaryApproverValue=this.clientData[0].Make_Primary_as_Approver__c;
        this.secondaryApproverValue=this.clientData[0].Make_Secondary_as_Approver__c; 

       
      
       
    }
    handleEditInvoice(event){
        this.employeeflag=false;
        this.invoiceFlag=true;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=true;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
    }
    handleEditTax(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=true;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=true;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;

        this.pretaxOne=this.clientData[0].Pre_Tax_One_Value__c;
        this.pretaxtwo=this.clientData[0].Pre_Tax_Two_Value__c;
        this.pretaxThree=this.clientData[0].Pre_Tax_Three_Value__c;
        this.pretaxFour=this.clientData[0].Pre_Tax_Four_Value__c;
        this.pretaxFive=this.clientData[0].Pre_Tax_Five_Value__c;
        this.preTaxForSubmit=this.clientData[0].Pre_Tax_Calculator__c;
     
    }
 */
    preTaxCalMethod(){
        if(this.clientData[0].Pre_Tax_One_Value__c){
            this.pretaxOne=this.clientData[0].Pre_Tax_One_Value__c;
        }else{
            this.pretaxOne=0;
        }

        if(this.clientData[0].Pre_Tax_Two_Value__c){
            this.pretaxtwo=this.clientData[0].Pre_Tax_Two_Value__c;
        }else{
            this.pretaxtwo=0;
        }
       
        if(this.clientData[0].Pre_Tax_Three_Value__c){
            this.pretaxThree=this.clientData[0].Pre_Tax_Three_Value__c;
        }else{
            this.pretaxThree=0;
        }
       
        if(this.clientData[0].Pre_Tax_Four_Value__c){
            this.pretaxFour=this.clientData[0].Pre_Tax_Four_Value__c;
        }else{
            this.pretaxFour=0;
        }
       
        if(this.clientData[0].Pre_Tax_Five_Value__c){
            this.pretaxFive=this.clientData[0].Pre_Tax_Five_Value__c;
        }else{
            this.pretaxFive=0;
        }
       
        if(this.clientData[0].Pre_Tax_Calculator__c){
            this.preTaxForSubmit=this.clientData[0].Pre_Tax_Calculator__c;
        }else{
            this.preTaxForSubmit=0;
        }
       

    }
   /*  handleEditVoluntary(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=true;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=true;
        this.voluntaryMethod();
  
    } */

    voluntaryMethod(){
        let voluntaryContribution =this.clientData[0].Voluntary_Contribution__c;
        this.voluntaryContributionCureencyVal=this.clientData[0].Voluntary_Contribution_Fixed__c;
        this.voluntaryContributionPercentVal=this.clientData[0].Voluntary_Contribution_Percent__c;
        if(voluntaryContribution =='Fixed'){
            this.VoluntaryContributionCurrency=true;
            this.VoluntaryContributionPercent=false;
            
        }else{
            this.VoluntaryContributionPercent=true;
            this.VoluntaryContributionCurrency=false;
            
        } 
    }
   /*  handleEditEmergency(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=true;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=true;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
    }
    handleEditBank(event){
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=true;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=true;
        this.voluntaryeditFlag=false;
    }  */

    @wire (organizationDetails)
    wiredOrDetails(result){
        const { data, error } = result;
        if(data){
        this.orgId = data.listofPriceBook.Id;
        //this.facilityPreferredName = data.listofPriceBook.Facility_Preferred_Name_Formula__c;
        //this.participantPreferredName = data.listofPriceBook.Participant_Preferred_Name_Formula__c;  
       /*  this.OrgNisationRoles=data.listofPriceBook.Roles__c.split(";").map(rec=>{
            return {
            value:rec,label:rec
            }
        
        }); */
        this.loadStaffAssignment();
       // console.log('orgdata roles '+JSON.stringify(this.OrgNisationRoles));
      
        } else if (error) {
           
        }
    }
    @track noimage;
    historyData = [];
    wiredHistoryResult;
   // @track isICtUserInViewForm=true;
    @track isFixedcategoryInViewForm=false;
    /* @wire(getStaffById, { recordId: '$staffId' })
    wiredClient(result) {
      this.wiredClientResult = result;
        const { data, error } = result;
            if (data) {
                this.clientData = data.map(rec => {
                        return {
                            ...rec, // keep all existing fields
                            activeRoles: rec.StaffRoles__r ? rec.StaffRoles__r.map(r => r.RoleName__c) : [],
                            activeRolesDisplay: rec.StaffRoles__r && rec.StaffRoles__r.length > 0
                                ? rec.StaffRoles__r.map(r => r.RoleName__c).join(', ')
                                : '',
                        
                        };
                    });
                console.log('STAFF DATA'+JSON.stringify(this.clientData));
                this.image = this.clientData[0].picture__c;
                if(!this.image){
                    this.noimage = true;
                }else{
                    this.noimage = false;
                }
                this.selectedEmploymentRole = this.clientData[0].SelectedRole__c;//manendra
                console.log('Manendraroleselected',this.SelectedRole);
                this.Nationality=this.clientData[0].Nationality__c;
                //this.Languages=this.clientData[0].Languages__c;
                console.log('Nationality:', this.clientData[0].Nationality__c);
                console.log('Languages:', this.clientData[0].Languages__c);

            // console.log('Client data:', JSON.stringify(this.clientData));
                this.city = this.clientData[0].Address__City__s;
                this.country = this.clientData[0].Address__CountryCode__s;
                this.province = this.clientData[0].Address__StateCode__s;
                this.postalcode = this.clientData[0].Address__PostalCode__s;
                this.street=this.clientData[0].Address__Street__s;
                this.lastName=this.clientData[0].Last_Name__c;
                this.firstName=this.clientData[0].First_Name__c;
                this.Typeofuser=this.clientData[0].Type_of_User__c;
                this.StaffFacility=this.clientData[0].Facility__c;
                this.DisplayRole=this.clientData[0].activeRolesDisplay;
                this.DisplayLanguages=this.clientData[0].Languages__c;
            //praveen changes for nursing awards start
                    this.fetchFacility( this.StaffFacility);
            
                  //praveen changes for nursing awards end
                
                this.genralHourlyRate=this.clientData[0].Working_Hours_Rate__c;
                this.nightShiftRate=this.clientData[0].Night_shift_Hourly_Rate__c;
                this.publicHolidayRate=this.clientData[0].Public_holiday_Hourly_Rate__c;
                this.sturdayHourlyRate=this.clientData[0].Saturday_Hourly_Rate__c;
                this.afterNoonShiftRate=this.clientData[0].Afternoon_shift_Hourly_Rate__c;
                this.sundayhourlyRate=this.clientData[0].Sunday_Hourly_Rate__c;
                this.sleepoverAllowance=this.clientData[0].Sleepover_Allowance__c;
            
                this.selected = this.clientData[0].Role__c? this.clientData[0].Role__c.split(';') : [];
                this.superannuationValue = this.clientData[0].Superannuation_Inc_or_Exc__c;
                //this.createdShiftRole=this.clientData[0].Role__c;
                console.log('this.createdShiftRole   role==> : ' ,this.createdShiftRole);
                //console.log('Superannuation value : '+this.superannuationValue);
                this.paidBreak= this.clientData[0].Paid_Break__c;
                this.pretaxOne = this.clientData[0].Pre_Tax_One_Value__c;
                this.descriptionone = this.clientData[0].Pre_Tax_One_Description__c;
                this.pretaxThree = this.clientData[0].Pre_Tax_Three_Value__c;
                this.toggleValue = this.clientData[0].Status__c;
                this.toggleValueGeolocation = this.clientData[0].Enable_Geolocation__c;
            // console.log('this.pretaxThree '+this.pretaxThree);
                console.log('this.clientData[0].Pre_Tax_Two_Value__c '+this.clientData[0].Pre_Tax_Two_Value__c);
                console.log('this.clientData[0].Pre_Tax_Three_Value__c '+this.clientData[0].Pre_Tax_Three_Value__c);
                console.log('this.clientData[0].Pre_Tax_Four_Value__c'+this.clientData[0].Pre_Tax_Four_Value__c);
                console.log('this.clientData[0].Pre_Tax_Five_Value__c'+this.clientData[0].Pre_Tax_Five_Value__c);
                console.log('type of user in edit '+this.Typeofuser)
                if(this.Typeofuser=='ICT User'){
                // this.isICtUserInViewForm=true;
                    this.ictUserType=true;
                    console.log('ict user'+this.ictUserType);
                }else{
                // this.isICtUserInViewForm=false;
                    this.ictUserType=false;
                    console.log('ict user'+this.ictUserType);
                }
                // praveen changes for nursing awards start 
                if(this.clientData[0].Fixed_Rate_or_Not__c || this.clientData[0].Nursning_Awards__c){
                    this.isFixedcategoryInViewForm=true;
                    this.isFixedcategory=false;
                    this.includeSuperannuation = false 
                }else{
                    this.isFixedcategoryInViewForm=false;
                    this.isFixedcategory=true;   
                    this.includeSuperannuation = true;           
                }
                //praveen changes for nursing awards end
                if(this.clientData[0].Pre_Tax_Two_Value__c){
                    console.log('2');
                    this.showDescription2 = true;
                    this.pretaxtwo = this.clientData[0].Pre_Tax_Two_Value__c;
                //  console.log('Pre_Tax_Two_Description__c' +this.this.clientData[0].Pre_Tax_Two_Description__c);
                    this.descriptiontwo = this.clientData[0].Pre_Tax_Two_Description__c || '';
                    this.delete2 = true;
                    this.delete3 = false;
                    this.delete4 = false;
                    this.delete5 = false;

                }
                if(parseInt(this.clientData[0].Pre_Tax_Three_Value__c)){
                    console.log('3');
                    this.showDescription3 = true;
                    this.pretaxThree = this.clientData[0].Pre_Tax_Three_Value__c;
                    this.descriptionthree = this.clientData[0].Pre_Tax_Three_Description__c || '';
                    this.delete2 = false;
                    this.delete3 = true;
                    this.delete5 = false;


                }
                if(this.clientData[0].Pre_Tax_Four_Value__c ){
                    console.log('4');
                    this.showDescription4 = true;
                    this.descriptionfour = this.clientData[0].Pre_Tax_Four_Description__c || '';
                    this.pretaxFour = this.clientData[0].Pre_Tax_Four_Value__c;
                    this.delete2 = false;
                    this.delete3 = false;
                    this.delete4 = true;
                    this.delete5 = false;


                }
                if(this.clientData[0].Pre_Tax_Five_Value__c){
                    console.log('5');
                    this.showDescription5 = true;
                    this.descriptionfive = this.clientData[0].Pre_Tax_Five_Description__c || '';
                    this.pretaxFive = this.clientData[0].Pre_Tax_Five_Value__c;
                    this.delete2 = false;
                    this.delete3 = false;
                    this.delete4 = false;
                    this.delete5 = true;

                }
                
            

                const childRec=this.clientData[0].Child_Staffs__r || [];
                this.DocumentTableData=[];
                let totalPoints = 0;
                childRec.forEach(rec => {
                if (rec.Type__c) {

                    // ⭐ Correct place for status calculation
                    const status = rec.Status__c || 'Pending';

                    totalPoints += Number(rec.Points__c) || 0;

                    this.DocumentTableData.push({
                        ...rec,

                        // status + class
                        statusClass:
                            status === 'Approved'
                                ? 'status-approved'
                                : status === 'Rejected'
                                ? 'status-rejected'
                                : 'status-pending',

                        Status__c: status,

                        isPending: status === 'Pending',
                        isApproved: status === 'Approved',
                        isRejected: status === 'Rejected',

                        Status_Display: status === 'Pending' ? '' : status,  // hide text only for Pending

                        disableApprove: status !== 'Pending',
                        disableReject: status !== 'Pending',

                        // formatted fields
                        FormattedDate: rec.Expiry_Date__c
                            ? new Date(rec.Expiry_Date__c).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })
                            : '',

                        ComplianceFormatted:
                            rec.Compliance__c !== null && rec.Compliance__c !== undefined
                                ? String(rec.Compliance__c).charAt(0).toUpperCase() +
                                String(rec.Compliance__c).slice(1).toLowerCase()
                                : '',

                        KeyVal: rec.key__c ? rec.key__c : ''
                    });
                }
                });
                this.totalPoints = totalPoints;
                this.hasRecords = this.DocumentTableData.length > 0;
                this.records = [...this.DocumentTableData];
                //console.log('child records '+JSON.stringify( this.DocumentTableData));
                // 🔥 Add pagination here
                this.totalRecords = this.DocumentTableData.length;
                this.pageSize = this.pageSizeOptions[0];
                this.pageNumber = 1;
                this.paginationHelper();
            
            } else if (error) {
                this.handleError(error);
            }
    } */

    /* @wire(getStaffById, { recordId: '$staffId' })
    wiredClient(result) {
        console.log("🔥 WIRE CALLED getStaffById");
        console.log("➡️ Raw wire result:", JSON.parse(JSON.stringify(result)));

        this.wiredClientResult = result;
        const { data, error } = result;

        if (data) {
            console.log("✔ Data received:", JSON.parse(JSON.stringify(data)));


          this.clientData = data.map(rec => {
                console.log("📌 Mapping Staff Record:", JSON.parse(JSON.stringify(rec)));
                return {
                    ...rec,
                    activeRoles: rec.StaffRoles__r ? rec.StaffRoles__r.map(r => r.RoleName__c) : [],
                    activeRolesDisplay:
                        rec.StaffRoles__r && rec.StaffRoles__r.length > 0
                            ? rec.StaffRoles__r.map(r => r.RoleName__c).join(', ')
                            : '',
                };
            }); 

            this.image = this.clientData[0].picture__c;
            this.noimage = !this.image;

            this.selectedEmploymentRole = this.clientData[0].SelectedRole__c;
            this.Nationality = this.clientData[0].Nationality__c;

            // Address
            this.city = this.clientData[0].Address__City__s;
            this.country = this.clientData[0].Address__CountryCode__s;
            this.province = this.clientData[0].Address__StateCode__s;
            this.postalcode = this.clientData[0].Address__PostalCode__s;
            this.street = this.clientData[0].Address__Street__s;

            // Basic fields
            this.lastName = this.clientData[0].Last_Name__c;
            this.firstName = this.clientData[0].First_Name__c;
            this.Typeofuser = this.clientData[0].Type_of_User__c;
            this.StaffFacility = this.clientData[0].Facility__c;

            this.DisplayRole = this.clientData[0].activeRolesDisplay;
            this.DisplayLanguages = this.clientData[0].Languages__c;

            this.fetchFacility(this.StaffFacility);

            // ----- DOCUMENT PROCESSING -----
            console.log("📄 Processing Child_Staffs__r records…");

            const childRec = this.clientData[0].Child_Staffs__r || [];
            let processedDocs = [];
            let totalPoints = 0;

            childRec.forEach(rec => {
                const status = rec.Status__c || 'Pending';
                totalPoints += Number(rec.Points__c) || 0;

                let row = {
                    ...rec,
                    Status__c: status,
                    statusClass:
                        status === 'Approved'
                            ? 'status-approved'
                            : status === 'Rejected'
                            ? 'status-rejected'
                            : 'status-pending',

                    // 🔥 These MUST stay reactive
                    isPending: status === 'Pending',
                    isApproved: status === 'Approved',
                    isRejected: status === 'Rejected',

                    disableApprove: status !== 'Pending',
                    disableReject: status !== 'Pending',

                    FormattedDate: rec.Expiry_Date__c
                        ? new Date(rec.Expiry_Date__c).toLocaleDateString('en-GB')
                        : '',

                    ComplianceFormatted: rec.Compliance__c
                        ? rec.Compliance__c.charAt(0).toUpperCase() +
                        rec.Compliance__c.slice(1).toLowerCase()
                        : '',

                    KeyVal: rec.key__c || ''
                };

                // 🔥 FIX: reactive update instead of push()
                processedDocs = [...processedDocs, row];
            });

            console.log("📊 Final processed documents:", processedDocs);

            this.totalPoints = totalPoints;

            // 🔥 Pagination initializer (UNCHANGED)
            this.initializePagination(processedDocs);

        } else if (error) {
            console.error("❌ Wire Error:", error);
            this.handleError(error);
        }
    } */

    async fetchStaffImperatively() {
        try {
            console.log("🔥 IMPERATIVE CALL → getStaffById");

            const data = await getStaffById({ recordId: this.staffId });

            console.log("✔ Imperative result:", JSON.parse(JSON.stringify(data)));

            // ---- SAME LOGIC YOU USED IN WIRE ----
            this.clientData = data.map(rec => {
                return {
                    ...rec,
                    activeRoles: rec.StaffRoles__r 
                        ? rec.StaffRoles__r.map(r => r.RoleName__c) 
                        : [],
                    activeRolesDisplay:
                        rec.StaffRoles__r && rec.StaffRoles__r.length
                            ? rec.StaffRoles__r.map(r => r.RoleName__c).join(', ')
                            : ''
                };
            });

            // Image
            this.image = this.clientData[0].picture__c;
            this.noimage = !this.image;

            // Basic fields
            this.selectedEmploymentRole = this.clientData[0].SelectedRole__c;
            this.Nationality = this.clientData[0].Nationality__c;
            this.genralHourlyRate=this.clientData[0].Hourly_Rate__c;//bug fix 05-12
            // Address
            this.city = this.clientData[0].Address__City__s;
            this.country = this.clientData[0].Address__CountryCode__s;
            this.province = this.clientData[0].Address__StateCode__s;
            this.postalcode = this.clientData[0].Address__PostalCode__s;
            this.street = this.clientData[0].Address__Street__s;

            this.lastName = this.clientData[0].Last_Name__c;
            this.firstName = this.clientData[0].First_Name__c;
            this.Typeofuser = this.clientData[0].Type_of_User__c;
            console.log('Usertypechecking',this.Typeofuser);
            this.StaffFacility = this.clientData[0].Facility__c;

            this.DisplayRole = this.clientData[0].activeRolesDisplay;
            this.selectedRoleValues = this.clientData[0].activeRoles || [];//bug fix 05-12

            this.DisplayLanguages = this.clientData[0].Languages__c;
this.selectedLangs = this.clientData[0].Languages__c
    ? this.clientData[0].Languages__c.split(";")
    : [];//bug fix 05-12
            this.fetchFacility(this.StaffFacility);

            // 🔥 Child Docs Processing (same as wire)
            const childRec = this.clientData[0].Child_Staffs__r || [];
            let processedDocs = [];
            let totalPoints = 0;

            childRec.forEach(rec => {
                const status = rec.Status__c || 'Pending';
                totalPoints += Number(rec.Points__c) || 0;

                let row = {
                    ...rec,
                    Status__c: status,
                    statusClass:
                        status === 'Approved'
                            ? 'status-approved'
                            : status === 'Rejected'
                            ? 'status-rejected'
                            : 'status-pending',

                    isPending: status === 'Pending',
                    isApproved: status === 'Approved',
                    isRejected: status === 'Rejected',

                    disableApprove: status !== 'Pending',
                    disableReject: status !== 'Pending',

                    FormattedDate: rec.Expiry_Date__c
                        ? new Date(rec.Expiry_Date__c).toLocaleDateString('en-GB')
                        : '',

                    //ComplianceFormatted: rec.Compliance__c,

                    ComplianceFormatted:
                        rec.Compliance__c === true ? 'TRUE' :
                        rec.Compliance__c === false ? 'FALSE' :
                        rec.Compliance__c ? String(rec.Compliance__c) : '',

                    KeyVal: rec.key__c || ''
                };

                processedDocs = [...processedDocs, row];
            });

            this.totalPoints = totalPoints;

            console.log("📄 Imperative processed docs:", processedDocs);

            // 🔥 Pagination same as wire
            this.initializePagination(processedDocs);
            
             if(this.Typeofuser== 'ICT User'){
                this.ictUserType=true;
                console.log('checkUsertype1',this.ictUserType);
                }else{
                this.ictUserType=false;
                console.log('checkUsertype2',this.ictUserType);
                }
        } catch (error) {
            console.error("❌ Imperative error:", error);
            this.handleError(error);
        }
        
    }

    initializePagination(docList) {
        console.log("🟦 INITIALIZING PAGINATION");

        // Store full list
        this.records = [...docList];
        this.totalRecords = this.records.length;

        // Set default page size if not set
        if (!this.pageSize) {
            this.pageSize = 5;
        }

        console.log("📘 Total Records:", this.totalRecords);
        console.log("📏 Page Size:", this.pageSize);

        // Reset to first page
        this.pageNumber = 1;

        // Set flags for UI
        this.hasRecords = this.totalRecords > 0;
        this.noRecordsFlag = this.totalRecords === 0;
        
        console.log("✅ hasRecords:", this.hasRecords);
        console.log("✅ noRecordsFlag:", this.noRecordsFlag);

        // Run pagination
        this.paginationHelper();
    }

   @wire(getStaffHistory, { staffId: '$staffId' })
    wiredHistory(result) {
        this.wiredHistoryResult = result; // 🔁 Save wire result to use for refresh

        const { data, error } = result;
        console.log('STAFFID-------------------->' + this.staffId);
        console.log('HISTORY DATA-------------------->', JSON.stringify(result));

        if (data) {

            const filtered = data.filter(item => {
                    const isIdValue = (val) =>
                        val && typeof val === 'string' && /^[a-zA-Z0-9]{15,18}$/.test(val);

                    // If both old and new values are IDs => skip this record
                    if (isIdValue(item.OldValue) && isIdValue(item.NewValue)) {
                        return false;
                    }
                    return true;
                });
            this.historyData = filtered.map(item => {
                const fieldName = item.Field === 'Facility__c'
                    ? 'Facility'
                    : (item.Field === 'created' ? 'Created' : item.Field);

                return {
                    id: item.Id,
                    field: fieldName,
                    field1: fieldName === 'Facility' ? this.facilityPreferredName : '', // ✅ set field1
                    oldValue: item.OldValue,
                    newValue: item.NewValue,
                    changedBy: item.CreatedBy.Name,
                    date: this.formatDate(item.CreatedDate)
                };
            });
        } else if (error) {
            this.error = error;
        }
    }


    formatDate(dateStr) {
    const dateObj = new Date(dateStr);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return new Intl.DateTimeFormat('en-GB', options).format(dateObj);
}

    

     onFileUpload(event) {        
        this.isattachError=false;
        if (event.target.files.length > 0) {
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
        this.showSpinner = false;
        console.log('fileName>>',this.fileName);
        console.log('file prepared');
      
       
    }   

    /* handleSubmit(event){
        console.log('in submit');
        console.log('CheckNationality',this.Nationality);
        console.log('📋 Updated Selected Languages (semicolon):', this.selectedLangs.join(';'));
        console.log('📋 Updated Selected Languages (semicolon):', this.Nationality);
        event.preventDefault();// stop the form from submitting
          console.log('in submit');
        event.preventDefault();// stop the form from submitting
                if (!this.StaffFacility) {
            console.error('Staff Facility is required.');
            // Optionally show a toast or error message on UI
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select a Facility before submitting.',
                    variant: 'error',
                })
            );
            return; // exit the method early
        }
          // Validate selected role
          console.log('manendra check',JSON.stringify(this.selectedRoleValues));
          console.log('manendracheck2', this.selectedEmploymentRole);
   
    if ( this.genralHourlyRate === 0) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Please select a Hourly Rate before saving.',
                variant: 'error'
            })
        );
        return; // prevent save
    }

    if (!fields.Management_Fee__c) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Management Fee is required.',
                variant: 'error',
            })
        );
        return; 
    }

    if (!this.ictUserType) {

        if ((!this.selectedRoleValues || this.selectedRoleValues.length === 0 || !this.selectedEmploymentRole)) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please select a role in employment section before saving.',
                    variant: 'error'
                })
            );
            return; // prevent save
        }
      
    if (!this.selectedLangs || this.selectedLangs.length === 0 || !this.selectedLangs) {
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Error',
            message: 'Please select a language before saving.',
            variant: 'error'
        })
    );
    return; 
    }

    if (!this.Nationality || this.Nationality.length === 0 || !this.Nationality) {
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Error',
            message: 'Please select a Nationality before saving.',
            variant: 'error'
        })
    );
    return; 
    }
}
        console.log('this.createdShiftRole   role : ' ,this.createdShiftRole);
        // if ( !this.createdShiftRole ) {
        //     this.showToast('Error', 'Please select the Role.', 'error');
        //     return;
        // }
          const fields = event.detail.fields;
          // alert(JSON.stringify(fields));
            fields.Address__Street__s = this.street;
            fields.Address__City__s =  this.city;
            fields.Address__StateCode__s = this.province;
            fields.Address__CountryCode__s = 'AU';
            fields.Address__PostalCode__s = this.postalcode;
            fields.SelectedRole__c = this.selectedEmploymentRole;//manendra
            //fields.Role__c=this.createdShiftRole;
            fields.Facility__c=this.StaffFacility;
            fields.Pre_Tax_One_Value__c = this.pretaxOne;
            fields.Pre_Tax_Two_Value__c = this.pretaxtwo;
            fields.Pre_Tax_Three_Value__c = this.pretaxThree;
            fields.Pre_Tax_Four_Value__c = this.pretaxFour;
            fields.Pre_Tax_Five_Value__c = this.pretaxFive;
            fields.Pre_Tax_Two_Description__c = this.descriptiontwo;
            fields.Pre_Tax_Three_Description__c = this.descriptionthree;
            fields.Pre_Tax_Four_Description__c = this.descriptionfour;
            fields.Pre_Tax_Five_Description__c = this.descriptionfive;
            fields.Status__c = this.toggleValue;
            fields.Enable_Geolocation__c = this.toggleValueGeolocation;
            fields.Nationality__c = this.Nationality;
            fields.Languages__c = this.selectedLangs.join(';');
            if(this.isNursingAwards == true){
                fields.Fixed_Rate_or_Not__c=false;
                fields.Category_Type__c=null;
                fields.Classification_Level__c=null;
                fields.Classification_Pay_Point__c=null;
            }
             if(this.isSchadsAwards == true){
                fields.Nursning_Awards__c=false;
                fields.Nursing_Category_Type__c=null;
                fields.Nursing_Classification_Level__c=null;
                fields.Nursing_Classification_Pay_Point__c=null;
            }
           // fields.Pre_Tax_Calculator__c = this.preTaxForSubmit;
           if(this.voluntaryContributionCureencyVal==undefined){
            this.voluntaryContributionCureencyVal=0;
           }
           if(this.voluntaryContributionPercentVal==undefined){
            this.voluntaryContributionPercentVal=0;
           }
           
           fields.Voluntary_Contribution_Fixed__c=this.voluntaryContributionCureencyVal;
           fields.Voluntary_Contribution_Percent__c= this.voluntaryContributionPercentVal;
            fields.Type_of_User__c=this.Typeofuser;
        //    console.log('fields.Tax_free_threshold__c : ',fields.Tax_free_threshold__c);
        //     if (!fields.Tax_free_threshold__c) {
        //         this.showToast('Error', 'Please Enter TFT.', 'error');
        //         return;
        //    }

          console.log('After fields>>'+JSON.stringify(fields));
          const fullAddress = `${this.street}, ${this.city} ${this.postalcode}, AU`;
        const apiKey = GOOGLE_API_KEY;
        console.log('Fetching geocode for:', fullAddress);
        
        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
    
        console.log('Fetching geocode for:', fullAddress);
    
        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                console.log('Geocode API response:', data);
    
                if (data.status === 'OK' && data.results.length > 0) {
                    const location = data.results[0].geometry.location;
                    fields.Location__Latitude__s = location.lat;
                    fields.Location__Longitude__s = location.lng;
    
                    console.log('Parsed coordinates:', location.lat, location.lng);
                } else {
                    console.warn('No geocode results found or status not OK');
                }
    
                // 🚀 Submit the form AFTER geocode response
                this.template.querySelector('lightning-record-edit-form').submit(fields);
            })
            .catch(error => {
                console.error('Error calling Geocode API:', error);
                // Submit form even if geocode failed
                this.template.querySelector('lightning-record-edit-form').submit(fields);
            });
          //refreshApex(this.wiredClientResult);
          this.fetchStaffImperatively(); 
          
          
    } */


    handleSubmit(event) {
        console.log("🚀 SUBMIT STARTED");

        event.preventDefault(); // stop default submit
console.log('taxflag',this.taxationFlag);
console.log('taxflag',this.taxationeditFlag);
        console.log("Nationality:", this.Nationality);
        console.log("Selected Languages:", this.selectedLangs);
        console.log("Facility:", this.StaffFacility);
        console.log('HourlyRate',this.genralHourlyRate);

 const fields = event.detail.fields;
        // -----------------------------------
        // 1️⃣ VALIDATION BEFORE FIELDS CREATION
        // -----------------------------------

        if (!this.StaffFacility) {
            this.showToast("Error", "Please select a Facility before submitting.", "error");
            return;
        }


if (this.ictUserType==false && this.taxationeditFlag == false) {
        if (this.genralHourlyRate === 0 || !this.genralHourlyRate) {
            this.showToast("Error", "Please select an Hourly Rate before saving.", "error");
            return;
        }
    }

        // -----------------------------------
        // 2️⃣ GET FIELDS (MUST BE AT TOP)
        // -----------------------------------
        //const fields = event.detail.fields; // 🔥 FIX: fields must be declared early

        // Now validations that use fields are SAFE
/*         if (!fields.Management_Fee__c) {
            this.showToast("Error", "Management Fee is required.", "error");
            return;
        } */

        // -----------------------------------
        // 3️⃣ VALIDATIONS FOR NON-ICT USERS
        // -----------------------------------

        if (!this.ictUserType) {

            if (!this.selectedRoleValues || this.selectedRoleValues.length === 0 || !this.selectedEmploymentRole) {
                this.showToast("Error", "Please select a role in employment section before saving.", "error");
                return;
            }

            if (!this.selectedLangs || this.selectedLangs.length === 0) {
                this.showToast("Error", "Please select a language before saving.", "error");
                return;
            }

            if (!this.Nationality || this.Nationality.length === 0) {
                this.showToast("Error", "Please select a Nationality before saving.", "error");
                return;
            }
        }

        // -----------------------------------
        // 4️⃣ POPULATE FIELDS
        // -----------------------------------

        fields.Address__Street__s = this.street;
        fields.Address__City__s = this.city;
        fields.Address__StateCode__s = this.province;
        fields.Address__CountryCode__s = "AU";
        fields.Address__PostalCode__s = this.postalcode;

        fields.SelectedRole__c = this.selectedEmploymentRole;
        fields.Facility__c = this.StaffFacility;

        // Pre-tax
        fields.Pre_Tax_One_Value__c = this.pretaxOne;
        fields.Pre_Tax_Two_Value__c = this.pretaxtwo;
        fields.Pre_Tax_Three_Value__c = this.pretaxThree;
        fields.Pre_Tax_Four_Value__c = this.pretaxFour;
        fields.Pre_Tax_Five_Value__c = this.pretaxFive;

        fields.Pre_Tax_Two_Description__c = this.descriptiontwo;
        fields.Pre_Tax_Three_Description__c = this.descriptionthree;
        fields.Pre_Tax_Four_Description__c = this.descriptionfour;
        fields.Pre_Tax_Five_Description__c = this.descriptionfive;

        // Toggles
        fields.Status__c = this.toggleValue;
        fields.Enable_Geolocation__c = this.toggleValueGeolocation;

        // User fields
        fields.Nationality__c = this.Nationality;
        fields.Languages__c = this.selectedLangs.join(";");

        // Nursing award conditions
        if (this.isNursingAwards) {
            fields.Fixed_Rate_or_Not__c = false;
            fields.Category_Type__c = null;
            fields.Classification_Level__c = null;
            fields.Classification_Pay_Point__c = null;
        }

        if (this.isSchadsAwards) {
            fields.Nursning_Awards__c = false;
            fields.Nursing_Category_Type__c = null;
            fields.Nursing_Classification_Level__c = null;
            fields.Nursing_Classification_Pay_Point__c = null;
        }

        // Voluntary contributions
        fields.Voluntary_Contribution_Fixed__c = this.voluntaryContributionCureencyVal || 0;
        fields.Voluntary_Contribution_Percent__c = this.voluntaryContributionPercentVal || 0;

        fields.Type_of_User__c = this.Typeofuser;

        console.log("📌 FINAL FIELDS BEFORE SUBMIT:", JSON.stringify(fields));

        // -----------------------------------
        // 5️⃣ GOOGLE GEO-CODING BEFORE SUBMIT
        // -----------------------------------

        const fullAddress = `${this.street}, ${this.city} ${this.postalcode}, AU`;
        const apiKey = GOOGLE_API_KEY;
        const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

        console.log("🌍 Calling Geocode:", endpoint);

        fetch(endpoint)
            .then((response) => response.json())
            .then((data) => {
                console.log("📍 Geocode Response:", data);

                if (data.status === "OK" && data.results.length > 0) {
                    const loc = data.results[0].geometry.location;
                    fields.Location__Latitude__s = loc.lat;
                    fields.Location__Longitude__s = loc.lng;
                    console.log("✔ Coordinates:", loc.lat, loc.lng);
                } else {
                    console.warn("⚠ No geocode results found");
                }

                // FINAL SUBMIT AFTER API
                this.template.querySelector("lightning-record-edit-form").submit(fields);
            })
            .catch((error) => {
                console.error("❌ Geocode Error:", error);

                // Submit anyway if API failed
                this.template.querySelector("lightning-record-edit-form").submit(fields);
            });

        // Refresh staff data after save
        //this.fetchStaffImperatively();
    }


    handleSuccess(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: this.successmessage,
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        this.staffEditFlag=false;
        this.toggleflag = false;
        this.toggleflagGeolocation = false;
        let staffRecID=event.detail.id;
        console.log(' Staff saved, Id:', staffRecID);
        console.log(' Roles to sync:', JSON.stringify(this.selectedRoleValues));
        console.log(' Dropdown Selected Role:', this.selectedEmploymentRole);
        console.log('selected staff role 4 ==>'+this.selectedEmploymentRole);
        console.log(' Hourly Rate to save BEFORE Apex call:', this.hourlyRate);  
        console.log(' Hourly Rate to save BEFORE Apex call:', this.saturdayHourlyRate);
        console.log(' checkclassificationpay before:', this.classificationPayType);
        console.log('Usertypee',this.ictUserType);
         console.log('Tagflag',this.taxationeditFlag);
                 // 🔗 Call Apex to sync StaffRoles
       if (this.ictUserType==false && this.taxationeditFlag == false) {
                console.log('UsertypeeinIF',this.ictUserType);
         console.log('TagflagINIF',this.taxationeditFlag);
            createStaffRoles({ 
            staffId: staffRecID, 
            selectedRoles: this.selectedRoleValues,
           // selectedRoles : this.selectedEmploymentRole,
            hourlyRate: this.genralHourlyRate,
            saturdayHourlyRate:this.sturdayHourlyRate,
            sundayHourlyRate:this.sundayhourlyRate,
            publicHolidayHourlyRate:this.publicHolidayRate,
            afternoonShiftRate:this.afterNoonShiftRate,
            nightShiftRate:this.nightShiftRate,
            sleepoverAllowance:this.sleepoverAllowance,
            dropdownSelectedRole:this.selectedEmploymentRole || '',
            categoryType: this.categoryType || '',
            classificationLevel: this.classificationLevel || '',
            classificationPayType: this.classificationPayType || '',
            jobType: this.jobType || ''    
           
            })
            
            .then(() => {
                console.log(' StaffRoles updated successfully in Apex');
               console.log(' checkclassificationpay:', this.classificationPayType);
               console.log(' hourlyRate:', this.genralHourlyRate);
               console.log('typeOfJob saved', this.jobType);
               
            })
            .catch(error => {
                console.error(' Error updating StaffRoles:', error);
                console.log(' Hourly Rate to save:', this.genralHourlyRate);
            });

    }
    this.handleflag();
        this.confirmEmailError='';
        this.primaryEmailError=false;
        this.secondaryEmailError=false;
        console.log('file base64 in success=>'+JSON.stringify(this.base64FileData));
        console.log('Record in success=>'+this.preTaxRecId);
        console.log('File in success=>'+this.fileName);

        //this.fetchOptions();
       // Refresh the data after success
       //refreshApex(this.wiredClientResult);
       this.fetchStaffImperatively();
        refreshApex(this.wiredHistoryResult); 
        console.log('after success +')
       
            
             // console.log('file length'+this.fileName.length);
             // console.log('base64Data>>', JSON.stringify(this.base64FileData ));
             if(this.fileName.length>0){
                uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:staffRecID,obj:'staff'}).then(result => {
                    console.log('Upload result = ' +result);
                    //this.fileName = this.fileName + ' - Uploaded Successfully';       
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success!!',
                            message: this.file.name + ' - Uploaded Successfully!!!',
                            variant: 'success',
                        }),
                    );
                    refreshApex(this.refreshTable);
                   
                }).catch(error => {
                    console.log('ERROR'+JSON.stringify(error));
                      window.console.log(error);
                      this.dispatchEvent(
                          new ShowToastEvent({
                              title: 'Error in uploading File',
                              message: error.message,
                              variant: 'error',
                          }),
                      );
                      this.showSpinner = false;
                  });
            }
            
            setTimeout(() => {
                //refreshApex(this.wiredClientResult);
                this.fetchStaffImperatively();
                this.fetchActiveRoles();
            }, 2000);
             
            
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }
    handleflag(){
        if (this.employeeeditflag) {
          this.employeeeditflag = false; 
          this.employeeflag = true; 
          
      } else if (this.taxationeditFlag) {
          this.taxationeditFlag = false; 
          this.taxationFlag = true; 
      } else if (this.invoiceeditFlag) {
          this.invoiceeditFlag = false; 
          this.invoiceFlag = true; 
      } else if (this.emergencyeditFlag) {
          this.emergencyeditFlag = false; 
          this.emergencyFlag= true; 
      } else if (this.bankeditFlag) {
          this.bankeditFlag = false; 
          this.bankFlag= true; 
      } else if (this.voluntaryeditFlag) {
          this.voluntaryeditFlag = false; 
          this.voluntaryFlag = true; 
      }
      
  }

  handleChange1(event){
    let inputValue = event.target.value;
    inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
    event.target.value = inputValue;
}

  handleeditClose(event){
      if(this.toggleflag){
          this.toggleValue = this.previousToggleValue;
          console.log('toggleflag'+this.toggleflag);
          console.log('Toggle status INSIDE IF:', this.toggleValue);
       }
       console.log('Toggle status OUTSIDE IF:', this.toggleValue);
       this.toggleflag = false;
       if(this.toggleflagGeolocation){
            this.toggleValueGeolocation = this.previousToggleValueGeolocation;
            console.log('toggleflagGeolocation'+this.toggleflagGeolocation);
            console.log('Toggle Geolocation status INSIDE IF:', this.toggleValueGeolocation);
       }
       console.log('Toggle Geolocation status OUTSIDE IF:', this.toggleValueGeolocation);
       this.toggleflagGeolocation = false;
       this.handleflag();
  }
  get employeeClass(){
    return (this.employeeflag || this.employeeeditflag) ? 'menu-item1' : 'menu-item'; 

}
get taxClass(){
  return (this.taxationFlag || this.taxationeditFlag) ? 'menu-item1' : 'menu-item'; 

}
get invoiceClass(){
  return this.invoiceFlag ? 'menu-item1' : 'menu-item'; 

}
get emergencyClass(){
  return (this.emergencyFlag || this.emergencyeditFlag) ? 'menu-item1' : 'menu-item'; 

}
get bankClass(){
  return (this.bankFlag || this.bankeditFlag) ? 'menu-item1' : 'menu-item'; 

}
get TrainingClass(){
  return (this.trainingFlag) ? 'menu-item1' : 'menu-item'; 

}
get HistoryClass(){
  return (this.historyFlag) ? 'menu-item1' : 'menu-item'; 

}
get voluntaryClass(){
    return (this.voluntaryFlag || this.voluntaryeditFlag) ? 'menu-item1' : 'menu-item'; 
  
  }

  
  addressInputChange(event) { 
       
    const address = event.detail;
    if (!address.street || !address.city || !address.postalCode || !address.province) {
        this.errorMessage = 'Please provide complete address information.';
        this.saveButtonDisable = true;
    }
    else{
        this.errorMessage = '';
        this.saveButtonDisable = false;
        console.log('event detail'+JSON.stringify(event.detail)); 
        this.street=event.detail.street;
        this.city=event.detail.city;
        this.postalcode=event.detail.postalCode;
        this.province=event.detail.province;
        this.country=event.detail.country;
        console.log('poscid', this.province);
        console.log('poscid2', this.postalcode);
        console.log('poscid3', this.city);

       
    }
}
handleAddDescription() {
    this.delete2 = false;
    this.delete3 = false;
    this.delete4 = false;
    if (!this.showDescription2) {
        this.showDescription2 = true;
        this.delete2 = true;
    } else if (!this.showDescription3) {
        this.showDescription3 = true;
        this.delete3 = true;
    } else if (!this.showDescription4) {
        this.showDescription4 = true;
        this.delete4 = true;
    } else if (!this.showDescription5) {
        this.showDescription5 = true;
        this.delete5 = true;
    }
}
handleDeleteDescription(event) {
    this.delete2 = false;
    this.delete3 = false;
    this.delete4 = false;
    this.delete5 = false;
    const index = event.target.dataset.index;

    if (index === "2") {
        this.showDescription2 = false;
        this.pretaxtwo = 0;
        this.descriptiontwo = '';
        
    } else if (index === "3") {
        this.showDescription3 = false;
        this.delete2 = true;
        this.pretaxThree = 0;
        this.descriptionthree = '';
        
    } else if (index === "4") {
        this.showDescription4 = false;
        this.delete3 = true;
        this.pretaxFour = 0;
        this.descriptionfour = '';
        
    } else if (index === "5") {
        this.showDescription5 = false;
        this.delete4 = true;
        this.pretaxFive = 0;
        this.descriptionfive = '';
        
        
    }
    this.handlePreTaxChange({ target: { name: '' } });
}


handlePreTaxChange(event){
        
    if (event.target.name == 'name') {
        this.name = event.detail.value;
    }
    if (event.target.name == 'lastname1') {
        this.lastname1 = event.detail.value;
    }
    if(event.target.name == 'PreTaxonevalue'){
        this.pretaxOne=event.target.value;
       
    }
    if(event.target.name == 'PreTaxTwovalue'){
        this.pretaxtwo=event.target.value;
     
    }
    if(event.target.name == 'pretaxthreevalue'){
        this.pretaxThree=event.target.value;
       
    }
    if(event.target.name == 'pretaxFourvalue'){
        this.pretaxFour=event.target.value;
        
    }
    if(event.target.name == 'pretaxFivevalue'){
        this.pretaxFive=event.target.value;
       
    }
    if(event.target.name == 'descriptionone'){
        this.descriptionone=event.target.value;
        console.log('this.descriptionone'+this.descriptionone);
       
    }
    if(event.target.name == 'descriptiontwo'){
        this.descriptiontwo=event.target.value;
        console.log('this.descriptiontwo'+this.descriptiontwo);
       
    }
    if(event.target.name == 'descriptionthree'){
        this.descriptionthree=event.target.value;
        console.log('this.descriptionthree'+this.descriptionthree);
    }
    if(event.target.name == 'descriptionfour'){
        this.descriptionfour=event.target.value;
        console.log('this.descriptionthree'+this.descriptionfour);
       
    }
    if(event.target.name == 'descriptionfive'){
        this.descriptionfive=event.target.value;
        console.log('this.descriptionthree'+this.descriptionfive);
    }


    if(this.pretaxOne==''|| this.pretaxOne== undefined  || this.pretaxOne== null){
        this.pretaxOne=0; 
    }
    if(this.pretaxtwo==''|| this.pretaxtwo== undefined  || this.pretaxtwo== null){
        this.pretaxtwo=0; 
    }
    if(this.pretaxThree==''|| this.pretaxThree== undefined  || this.pretaxThree== null){
        this.pretaxThree=0; 
    }
    if(this.pretaxFour==''|| this.pretaxFour== undefined  || this.pretaxFour== null){
        this.pretaxFour=0; 
    }
    if(this.pretaxFive==''|| this.pretaxFive== undefined  || this.pretaxFive== null){
        this.pretaxFive=0; 
    }

     this.preTaxForSubmit=parseFloat(this.pretaxOne)+parseFloat(this.pretaxtwo)+parseFloat(this.pretaxThree)+parseFloat(this.pretaxFour)+parseFloat(this.pretaxFive);

    this.totalPretaxvalue= "Pre Tax Deduction - Total " +this.preTaxForSubmit;

    if(event.target.name == 'totalPreTax'){
        this.preTaxForSubmit=event.target.value;
       
    }
    if(this.preTaxForSubmit==''|| this.preTaxForSubmit== undefined  || this.preTaxForSubmit== null){
        this.preTaxForSubmit=0;
    }  
    
    
} 
handlePosttaxChange(event){
   
    if(event.target.name == 'posttax'){
        this.postTaxLabelvalue=event.target.value;
    }
    if(this.postTaxLabelvalue ==''||this.postTaxLabelvalue ==undefined||this.postTaxLabelvalue ==null ){
        this.postTaxLabelvalue=0;
    }
    this.postTaxlabel='Post Tax Deduction - Total '+parseFloat(this.postTaxLabelvalue);

}

@track primaryApproverValue=false;
@track secondaryApproverValue=false;
@track VoluntaryContributionCurrency=false;
@track VoluntaryContributionPercent=false;
@track voluntaryContributionCureencyVal=0;
@track voluntaryContributionPercentVal=0;
@track confirmEmailError;
@track saveButtonDisable=false;
@track secondaryEmailError=false;
@track primaryEmailError=false;

primaryHandleApprover(event){
        this.primaryApproverValue = event.target.value; 
        if( this.primaryApproverValue==true){
                this.secondaryApproverValue=false;
        }
        if(this.primaryApproverValue==false){
                this.secondaryApproverValue=true;
        }   
} 
secondaryHandleApprover(event){

    this.secondaryApproverValue = event.target.value; 
    if(this.secondaryApproverValue==true){
            this.primaryApproverValue=false;
        } 
    if(this.secondaryApproverValue==false){
            this.primaryApproverValue=true ;
    }     
}
EmailChangeHandler(event){

  this.ValidateEmail(event) ;
}

ValidateEmail(event) {
   if(event.target.name=='primary'){
        this.emailCheckFunction(event);
        this.primaryEmailError=true;
        this.secondaryEmailError=false;
   
   }else{
        this.emailCheckFunction(event);
        this.primaryEmailError=false;
        this.secondaryEmailError=true;
   }
   
}

  emailCheckFunction(event){
    // var validRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    var validRegex = /^\w+([\.-]?\w+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,3})+(\.(gov|com|org|co)(\.au)?)?$/;


    if (!event.target.value) {
        // If it's empty, reset error message and enable the save button
        this.confirmEmailError = '';
        this.saveButtonDisable = false;
        return; // Exit the function
    }
        if (event.target.value.match(validRegex)) {
            this.confirmEmailError='';
            this.saveButtonDisable=false;
        console.log('valid email')
        } else {
    
            console.log(' in valid  email');
            this.confirmEmailError='Please Enter valid Email';
            this.saveButtonDisable=true;
    
        }
  }

    VoluntaryChange(event){
        if(event.target.value=='Fixed'){

            this.VoluntaryContributionCurrency=true;
            this.VoluntaryContributionPercent=false;
        console.log('Contribution fixed : '+ event.target.value);
        }
        if(event.target.value=='Percentage'){
            this.VoluntaryContributionPercent=true;
            this.VoluntaryContributionCurrency=false;
        console.log('Contribution Percentage : '+ event.target.value);

        }
        else {
            // '--None--' or any unexpected value
           // this.VoluntaryContributionCurrency = false;
           // this.VoluntaryContributionPercent = false;
            this.voluntaryContributionCureencyVal = 0;
            this.voluntaryContributionPercentVal = 0;
        }
        if(event.target.name=='contributionFixed'){
            this.voluntaryContributionCureencyVal=event.target.value;
        }
        if(event.target.name=='contributionPercent'){
            this.voluntaryContributionPercentVal=event.target.value;
        }
        console.log( this.voluntaryContributionPercentVal);
    }
  handleInputChange(event) {
        let index = event.target.dataset.id;
        let fieldName = event.target.name;
        let value = event.target.value;
        for(let i = 0; i < this.accountRecList.length; i++) {
            if(this.accountRecList[i].index === parseInt(index)) {
                this.accountRecList[i][fieldName] = value;
            }
        }
    }

    createRow(accountRecList) {
        let accountObject = {};
        if(accountRecList.length > 0) {
            accountObject.index = accountRecList[accountRecList.length - 1].index + 1;
        } else {
            accountObject.index = 1;
        }
        accountObject.Description = null;
        accountObject.Quantity = null;
        accountObject.preTaxDate = null;
        accountObject.comment = null;
        accountRecList.push(accountObject);
       
    }
   
    addDocumentRow(){
        this.createRow(this.accountRecList);
    }
    removeRow(event) {
        let toBeDeletedRowIndex = event.target.name;
        console.log(toBeDeletedRowIndex);
        let accountRecList = [];
        for(let i = 0; i < this.accountRecList.length; i++) {
            let tempRecord = Object.assign({}, this.accountRecList[i]); //cloning object
            console.log(tempRecord);
            if(tempRecord.index !== toBeDeletedRowIndex) {
                accountRecList.push(tempRecord);
            }
        }
        for(let i = 0; i < accountRecList.length; i++) {
            accountRecList[i].index = i + 1;
        }
        this.accountRecList = accountRecList;
    }

    ShowDocumentSection(event){
        this.showStaffDocumentSection= true;
        this.ShowDataTable=false;
        this.parentStaffId=event.currentTarget.dataset.id; 
        console.log('parent Id=>'+this.parentStaffId);

    }
    closeDocumentSection(){
        this.showStaffDocumentSection= false;
        this.ShowDataTable=true;
        this.accountRecList=[];
    }

    handleDocumentchange(event) {
        let index = event.target.dataset.id;
        let fieldName = event.target.name;
        let value = event.target.value;
        if(fieldName=='file'){
            this.onDocumentUpload(event).then(filedata => {
                 for (let i = 0; i < this.accountRecList.length; i++) {
                        if (this.accountRecList[i].index === parseInt(index)) {
                            this.accountRecList[i]['fileName'] = filedata.fileName;
                            this.accountRecList[i]['base64Data'] = JSON.stringify(filedata.base64Data);
                            }
                        }
                        console.log('file data 11=>' + JSON.stringify(this.accountRecList));
                    }).catch(error => {
                        console.error('Error:', error);
                    });
                }else{
                    for (let i = 0; i < this.accountRecList.length; i++) {
                        if (this.accountRecList[i].index === parseInt(index)) {
                            this.accountRecList[i][fieldName] = value;
                        }
                    }  
            }
        console.log('file data=>'+JSON.stringify(this.accountRecList));
    }
          
        onDocumentUpload(event) {
            return new Promise((resolve, reject) => {
                this.isattachError = false;
                this.showSpinner = true;
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


    handleSubmitDocuments() {
       // this.showSpinner = true;
      /*  if(this.accountRecList.length === 0)
        {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please check complaince.',
                    variant: 'error',
                })
            );
            return;
        } */

    let hasError = false;

    this.uploadedFiles = this.uploadedFiles.map(file => {
        if (!file.typeOfDocument) {
            hasError = true;
            return { ...file, errorMessage: 'Complete this field' };
        }
        return { ...file, errorMessage: '' };
    });

    if (hasError) {
        return; // ❌ Stop submission
    }

    // ✅ Proceed with submission
    console.log('🚀 Submitting files:', JSON.stringify(this.uploadedFiles));

        this.accountRecList = this.uploadedFiles;
        this.showLoadingSpinner = true;
         this.accountRecList.forEach(item => {
            this.staffDocumentMap[item.fileName] = item.base64Data;
        }); 
        console.log('staffMap=>' + JSON.stringify(this.staffDocumentMap));
        console.log('staffMap accountRecList =>' + JSON.stringify(this.accountRecList));
        insertPreTax({JsonString: JSON.stringify(this.accountRecList),staffID: this.staffId,isPretax: false
        }).then(result => {
            console.log('document result' + JSON.stringify(result));
           /*  result.forEach(item => {
                let base64Data = this.staffDocumentMap[item.File_Name__c]; 
                console.log('base64' + base64Data)
                uploadFile({base64:JSON.stringify(base64Data),filename: item.File_Name__c,recordId: item.Id,obj: 'ChildStaff'}).then(result => {
                    console.log('Upload result = ' + result);
                    //this.fileName = this.fileName + ' - Uploaded Successfully';
                    
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success!!',
                            message: item.File_Name__c + ' - Uploaded Successfully!!!',
                            variant: 'success',
                        }),
                    );
                    
                    this.accountRecList=[];
                    this.uploadedFiles=[];
                    
                    refreshApex(this.refreshTable);
                   // this.loadStaffData()
                    //const myTimeout = setTimeout( this.loadStaffData(), 5000); 
                   
                }).catch(error => {
                    //console.error(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error in uploading File. Please Provide All Details',
                            message: error.message,
                            variant: 'error',
                        }),
                    );
                    //this.showSpinner = false;
                    this.showLoadingSpinner = false;
                });
            }) */
           // this.reloadPage();
           this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Documents submitted successfully!',
                variant: 'success',
            })
        );

            this.accountRecList=[];
            this.uploadedFiles=[];
            this.showStaffDocumentSection=false;
            this.showPreTaxRecordEditForm=false;
            this.ShowDataTable=true;
          
            setTimeout(() => {
                //this.showSpinner = false;
                 this.showLoadingSpinner = false;
                this.addingPreTax();  
            }, 3000);
        }).catch(error => {
           
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error in uploading File. Please Provide All Details',
                    message: error.message,
                    variant: 'error',
                }),
            );
            console.error('error' + JSON.stringify(error));
            //this.showSpinner = false;
            this.showLoadingSpinner = false;
            this.showStaffDocumentSection=false;
            this.showPreTaxRecordEditForm=false;
            this.ShowDataTable=true;
            
        });  
        
        
    }

    reloadPage() {
        // Use NavigationMixin to navigate to the current page
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: window.location.href
            }
        });
    }
    handleRowActions(event){ 
       // const row = event.detail.row
        this.preTaxRecId= event.currentTarget.dataset.id;
        this.parentStaffId=event.currentTarget.dataset.staff;
        this.typeOfDocument=event.currentTarget.dataset.type;
        const actionName = event.currentTarget.name;
        const url = event.currentTarget.dataset.url;
        this.key = event.currentTarget.dataset.key;
        console.log(' this.key'+ this.key);
        console.log(' ID'+this.preTaxRecId);
        console.log(' STAFF ID'+this.parentStaffId);
        console.log(' NAME'+actionName);
        this.totalfiles=[];
        console.log('totalfiles',JSON.stringify(this.totalfiles));
        switch (actionName) {
            case 'delete':
              deleteRecord(this.preTaxRecId).then(() => {
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: 'Success',
                    message: 'Staff Document has been deleted',
                    variant: 'success'
                  })
                );
                this.ShowDataTable=true;
                
              //  return refreshApex(this.recordsToDisplay)
              //this.loadStaffData()
              this.deleteFile(this.key);
              this.addingPreTax();  
              }).catch(error => {
                console.log('error=>'+JSON.stringify(error));
             });
            break;

        case 'edit':
            this.showPreTaxRecordEditForm=true;
            this.employeeeditflag=false;
            this.fileName='';
            this.documentedit=true;
            
        break;
        case 'view_details':
              event.preventDefault(); 
              this.isHome=false;
              this.currentUrl = url;
             console.log('file url  '+ this.currentUrl);  
              this.isModalOpen = true;

               const fileType = this.getFileType(this.currentUrl); 
        
              //console.log('file type: ' + fileType);
              // Check if the file type is not PNG or PDF
               if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'jpg' && fileType !== 'csv' && fileType !== 'svg') {
                  setTimeout(() => {
                      this.closeModal();
                  }, 1700);
                  
              } 
        break;
     } 
      
    }

    handlePreTaxRecordFormSubmit(event) {
        event.preventDefault(); // stop the form from submitting
        console.log('record edit form');
        console.log('key:', this.key);

        const fields = event.detail.fields;

        // ⭐ ALWAYS APPROVE DOCUMENT UPON UPLOAD
        fields.Status__c = 'Approved';

        fields.Type__c = this.typeOfDocument;

        if (this.uploadedFiles1 && this.uploadedFiles1.length > 0) {
            this.deleteFile(this.key);

            fields.View_File__c = this.uploadedFiles1[0].url;
            fields.Awsjson__c = JSON.stringify(this.uploadedFiles1[0]);
            fields.File_Name__c = this.uploadedFiles1[0].originalName;
            fields.key__c = this.uploadedFiles1[0].key;
        }

        console.log('After fields>>' + JSON.stringify(fields));

        this.template.querySelector(
            'lightning-record-edit-form[data-recid="PreTaxForm"]'
        ).submit(fields);
    }

    closePreTaxRecordEditForm(event){
        this.showPreTaxRecordEditForm=false;
        this.uploadedFiles1 =[];
         this.key='';
         this.employeeeditflag=true;
         this.preTaxRecId='';
         this.totalfiles=[];
         this.documentedit=false;
         console.log('TOTALFILES',JSON.stringify( this.totalfiles));
    }

    handlePreTaxSuccess(event){
        this.preTaxRecId=event.detail.id;
        
       
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Changes Saved Successfully !!',
                variant: 'success',
            }),
        );
        this.showPreTaxRecordEditForm=false;
        this.employeeeditflag=true;
       //this.employeeeditflag=true;
        setTimeout(() => {
            this.showSpinner = false;
            this.addingPreTax();  
        }, 2000);
        /* if(this.fileName.length  > 0){
            this.showSpinner = true;
            console.log('file base64 in success=>'+JSON.stringify(this.base64FileData));
            console.log('Record in success=>'+this.preTaxRecId);
            console.log('File in success=>'+this.fileName);
            
              console.log('file length'+this.fileName.length);
             // console.log('base64Data>>', JSON.stringify(this.base64FileData ));
              uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:this.preTaxRecId,obj:'ChildStaff'}).then(result => {
                  console.log('Upload result = ' +result);
                  //this.fileName = this.fileName + ' - Uploaded Successfully';                 
                  this.dispatchEvent(
                      new ShowToastEvent({
                          title: 'Success!!',
                          message: this.file.name + ' - Uploaded Successfully!!!',
                          variant: 'success',
                      }),
                  );
                
              }).catch(error => {
                    window.console.log(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error in uploading File',
                            message: error.message,
                            variant: 'error',
                        }),
                    );
                    this.showSpinner = false;
                });
             }
             */
            this.accountRecList=[];
            this.uploadedFiles1 =[];
            this.key='';
            this.documentedit=false;
           // this.addingPreTax();  

          /*   setTimeout(() => {
                
                this.addingPreTax(); 
                this.showSpinner = false; 
            }, 3000); */
            console.log('last line ')              
    }

    
    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileType(url) {
       const fileName = url.substring(url.lastIndexOf('/') + 1);
       return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
   }
    @track hasRecords;
    addingPreTax(){
         console.log('Parent record Id  in addingPreTax'+this.parentStaffId );
        fetchStaff({recordId :this.parentStaffId }).then(response => {
            console.log('satff list after save'+JSON.stringify(response));
            console.log('response.length :  '+(Object.keys(response).length));
        // this.noRecordsFlag = !(response && response.length > 0);
        //   this.noRecordsFlag = !response || Object.keys(response).length === 0;
        //     console.log('noRecordsFlag:  '+this.noRecordsFlag);
        let childRec = response && response.Child_Staffs__r ? response.Child_Staffs__r : [];
        console.log('childRec :  '+JSON.stringify(childRec));
        this.DocumentTableData=[];
        let totalPoints = 0;
        childRec.forEach(rec=>{
            if(rec.Type__c ){
                // ADD STATUS PROCESSING HERE
                const status = rec.Status__c || 'Pending';
                totalPoints += Number(rec.Points__c) || 0;
                
                this.DocumentTableData.push({
                    ...rec, // Spread existing record properties
                    // ADD STATUS-RELATED FIELDS
                    statusClass: status === 'Approved' ? 'status-approved' : 
                                status === 'Rejected' ? 'status-rejected' : 'status-pending',
                    Status__c: status,
                    isPending: status === 'Pending',
                    isApproved: status === 'Approved', 
                    isRejected: status === 'Rejected',
                    Status_Display: status === 'Pending' ? '' : status,
                    disableApprove: status !== 'Pending',
                    disableReject: status !== 'Pending',
                    FormattedDate: rec.Expiry_Date__c 
                        ? new Date(rec.Expiry_Date__c).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                        }) 
                        : '',
                    ComplianceFormatted: rec.Compliance__c !== null && rec.Compliance__c !== undefined
                        ? String(rec.Compliance__c).charAt(0).toUpperCase() +
                        String(rec.Compliance__c).slice(1).toLowerCase()
                        : '',
                    KeyVal: rec && rec.key__c ? rec.key__c : ''
                });
            }
        });
            console.log('this.DocumentTableData :  '+JSON.stringify(this.DocumentTableData));
            this.hasRecords = this.DocumentTableData.length > 0;

            this.totalPoints = totalPoints;
            
            // Update records for pagination
            this.records = [...this.DocumentTableData];
            this.totalRecords = this.records.length;
            this.paginationHelper();
        }); 
 
    }

    @track categoryType;
    @track jobType;
    @track classificationLevel;
    @track classificationPayType;
    @track genralHourlyRate=0;
    @track sturdayHourlyRat=0;
    @track sundayhourlyRate=0;
    @track publicHolidayRate=0;
    @track afterNoonShiftRate=0;
    @track nightShiftRate=0;
    @track sleepoverAllowance=0;
    @track isFixedcategory=true; //praveen chnages

    @track setHoursAccess =false;
    

/*     typeOfUserChnage(event){
        if(event.detail.value=='ICT User'){
            this.ictUserType=true;
            console.log('Usertypechecking',this.ictUserType );
        }else{
            this.ictUserType=false;
           console.log('Usertypechecking2',this.ictUserType );
        }

    } */

    @track includeSuperannuation = false;
    @track superannuationValue;
    @track containerStyle;
    @track LANGUAGE_OPTIONS = [
        'Arabic', 'Armenian', 'Azerbaijani', 'Bengali', 'Burmese', 'Dhivehi', 'Dzongkha',
        'English', 'Filipino', 'French', 'German', 'Greek', 'Hebrew', 'Hindi', 'Indonesian',
        'Italian', 'Japanese', 'Kazakh', 'Khmer', 'Korean', 'Kyrgyz', 'Lao', 'Malay', 'Mandarin',
        'Mongolian', 'Nepali', 'Persian', 'Portuguese', 'Russian', 'Samoan', 'Sinhala', 'Swahili',
        'Thai', 'Tongan', 'Turkish', 'Urdu', 'Uzbek', 'Vietnamese'
    ];


    connectedCallback() {
        this._handleOutsideClick = this.handleClickOutside.bind(this);
        this._updateHeight = this.updateHeight.bind(this);
        window.addEventListener('click', this._handleOutsideClick);
        window.addEventListener('resize', this._updateHeight);
        this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
        this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
        this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
        this.fetchStaffInfo();
        this.fetchStaffImperatively();
        //this.fetchOptions();
         this.fetchActiveRoles();
        //this.fetchDropdownRoleWithRates();//manendra
        const activeTab = localStorage.getItem('activeAdminStaffTab');
        this.employeeflag=false;
        this.invoiceFlag=false;
        this.taxationFlag=false;
        this.emergencyFlag=false;
        this.bankFlag=false;
        this.voluntaryFlag=false;
        this.employeeeditflag=false;
        this.invoiceeditFlag=false;
        this.taxationeditFlag=false;
        this.emergencyeditFlag=false;
        this.bankeditFlag=false;
        this.voluntaryeditFlag=false;
        this.trainingFlag = false;
        this.disableedit = true;
        this.historyFlag = false;

         switch (activeTab) {
            case 'staffEmployee':
                this.employeeflag = true;
                break;
            case 'staffTax':
                this.taxationFlag = true;
                this.voluntaryMethod();
                break;
            case 'staffHistory':
                this.historyFlag = true;
                this.disableedit = false
                break;
            
            default:
                this.employeeflag = true;
        }

        this.filteredOptions = this.allNationalities.map(n => ({
        label: n,
        value: n
        }));

        this.Languages = this.LANGUAGE_OPTIONS.map(lang => ({
            id: lang,
            label: lang,
            checked: false,
            buttonClass: 'option-button',
            badgeClass: 'status-badge inactive',
            statusText: 'Inactive'
        }));

        console.log('Languages>>', this.Languages);

    }
    
    disconnectedCallback() {
        window.removeEventListener('click', this._handleOutsideClick);
        window.removeEventListener('resize', this._updateHeight);
    }
    renderedCallback() {
        setTimeout(() => {
            this.updateHeight();
        }, 50);
        const cells = this.template.querySelectorAll('.fixed-table td, .fixed-table th');
        cells.forEach(cell => {
            // Remove previous title to avoid duplicates
            cell.removeAttribute('title');

            // Check if text is truncated (scrollWidth > clientWidth)
            if (cell.scrollWidth > cell.clientWidth) {
                cell.setAttribute('title', cell.textContent.trim());
            }
        });
      }

    fetchStaffInfo() {
        getstaffId2({ userId: userId })
            .then(result => {
                console.log('Staff Wrapper Result:', result);
                this.setHoursAccess = result.setHoursAccess;
            })
            .catch(error => {
                console.error('Error fetching staff info:', error);
                this.showToast('Error', 'Failed to fetch staff information', 'error');
            });
    }


      updateHeight() {
        const footer = document.querySelector('c-footerlwc_footerlwc'); // default class
        const header = document.querySelector('header'); // adjust this as needed
        const footerHeight = footer ? footer.offsetHeight : 0;
        const headerHeight = header ? header.offsetHeight : 0;
        const height = window.innerHeight - footerHeight - headerHeight;
    
        this.containerStyle = `height: ${height}px; overflow-y: auto; overflow-x: hidden;`;
        console.log('height '+this.containerStyle);
        console.log('FOOTER '+footer);
        console.log('FOOTER '+header);
      }
    employmentTypeChange(event){    
        if(event.target.name=='fixedcategoryType'){
            if(event.target.value==true){
                this.isFixedcategory=false;
                this.includeSuperannuation = false;
                this.superannuationValue = 'Include Superannuation';
                console.log('onchange event : '+this.superannuationValue);
                this.paidBreak=true;
            }else{
                this.isFixedcategory=true;
                this.includeSuperannuation = true;
                this.superannuationValue = 'Exclude Superannuation';
                console.log('onchange event : '+this.superannuationValue);
                this.paidBreak=false;
            }
        }

        if(event.target.name=='categoryType'){
            this.categoryType=event.target.value;  
        }
        if(event.target.name=='jobType'){
            this.jobType=event.target.value;  
        }
        if(event.target.name=='classificationType'){
            this.classificationLevel=event.target.value;  
        }
        if(event.target.name=='classificationPayType'){
            this.classificationPayType=event.target.value;    
        }
          console.log(' categoryType ' + this.categoryType);
            console.log(' jobType ' + this.jobType);
            console.log(' classificationType ' + this.classificationLevel);
            console.log(' classificationPayType ' + this.classificationPayType);

        if( this.categoryType !=null &&  this.jobType !=null &&  this.classificationLevel !=null &&  this.classificationPayType !=null){          
            if(this.isSchadsAwards == true){
                getShadAwards({categoryType:this.categoryType,jobType:this.jobType,classificationType :this.classificationLevel,classificationPayType:this.classificationPayType }).then(result=>{
           
                    console.log('Shad awards list '+JSON.stringify(result));
                        if(result.length>0){
                            this.genralHourlyRate=result[0].General_Hourly_pay_rate__c;
                            this.nightShiftRate=result[0].Night_shift_Hourly_Rate__c;
                            this.publicHolidayRate=result[0].Public_holiday_Hourly_Rate__c;
                            this.sturdayHourlyRate=result[0].Saturday_Hourly_Rate__c;
                            this.afterNoonShiftRate=result[0].Afternoon_shift_Hourly_Rate__c;
                            this.sundayhourlyRate=result[0].Sunday_Hourly_Rate__c;
                            this.sleepoverAllowance=result[0].Sleepover_Allowance__c;
                        }else{
                            this.genralHourlyRate=0;
                            this.nightShiftRate=0;
                            this.publicHolidayRate=0;
                            this.sturdayHourlyRate=0;
                            this.afterNoonShiftRate=0;
                            this.sundayhourlyRate=0;
                            this.sleepoverAllowance=0;
                        }
                        
                    });
                }
           
                if(this.isNursingAwards == true){
                        getNursingAwrds({categoryType:this.categoryType,jobType:this.jobType,classificationType :this.classificationLevel,classificationPayType:this.classificationPayType }).then(result=>{
        
                        console.log('Nursing awards list '+JSON.stringify(result));
                        if(result.length>0){
                            this.genralHourlyRate=result[0].General_Hourly_Pay_Rate__c;
                            this.nightShiftRate=result[0].Night_Shift_Hourly_Rate__c;
                            this.publicHolidayRate=result[0].Public_Holiday_Hourly_Rate__c;
                            this.sturdayHourlyRate=result[0].Saturday_Hourly_Rate__c;
                            this.afterNoonShiftRate=result[0].Afternoon_Shift_Hourly_Rate__c;
                            this.sundayhourlyRate=result[0].Sunday_Hourly_Rate__c;
                            this.sleepoverAllowance=0;
                        }else{
                            this.genralHourlyRate=0;
                            this.nightShiftRate=0;
                            this.publicHolidayRate=0;
                            this.sturdayHourlyRate=0;
                            this.afterNoonShiftRate=0;
                            this.sundayhourlyRate=0;
                            this.sleepoverAllowance=0;
                        }
                        
                    });
                }

                if(this.isChildCareAwards == true){
                    getChildcareAwrds({categoryType:this.categoryType,jobType:this.jobType,classificationType :this.classificationLevel,classificationPayType:this.classificationPayType }).then(result=>{
    
                    console.log('Child Care awards list '+JSON.stringify(result));
                    if(result.length>0){
                        this.genralHourlyRate=result[0].General_Hourly_Pay_Rate__c;
                        this.nightShiftRate=result[0].Night_Shift_Hourly_Rate__c;
                        this.publicHolidayRate=result[0].Public_Holiday_Hourly_Rate__c;
                        this.sturdayHourlyRate=result[0].Saturday_Hourly_Rate__c;
                        this.afterNoonShiftRate=result[0].Afternoon_Shift_Hourly_Rate__c;
                        this.sundayhourlyRate=result[0].Sunday_Hourly_Rate__c;
                        this.sleepoverAllowance=0;
                    }else{
                        this.genralHourlyRate=0;
                        this.nightShiftRate=0;
                        this.publicHolidayRate=0;
                        this.sturdayHourlyRate=0;
                        this.afterNoonShiftRate=0;
                        this.sundayhourlyRate=0;
                            this.sleepoverAllowance=0;
                    }
                    
                    });
                }
        }  

    }
    // handleRoleChange(event) {
    //     this.selected = event.detail.value;
    //     console.log('selected value '+this.selected);
    //     //this.createdShiftRole = '';
    //     event.detail.value.forEach(rec => {
    //         //this.createdShiftRole += rec + ';';
    //     });
    //     // Remove the trailing semicolon
    //     if (this.createdShiftRole.endsWith(';')) {
    //         this.createdShiftRole = this.createdShiftRole.slice(0, -1);
    //     }

    //     console.log('staff roles ' + this.createdShiftRole);

    // }
/*  handleRoleChange(event){
   
   

} */
      
    //Slide-In-Out-Animation
    @track header = true; // Always true
    @track animationClass = ''; // Tracks the animation class
    
    toggleHeader(event) {
        event.stopPropagation(); // Prevent triggering the outside click listener when clicking the icon
        const gridElement = this.template.querySelector('.grid');
    
        if (gridElement.classList.contains('slide-in')) {
            // Slide out the header
            gridElement.classList.remove('slide-in');
            gridElement.classList.add('slide-out');
    
            // Hide the header after the animation completes
            setTimeout(() => {
                gridElement.style.visibility = 'none';
                console.log('Header is now hidden after sliding out.');
            }, 500); // Match the animation duration
        } else {
            // Slide in the header
            gridElement.style.visibility = 'visible'; // Ensure it is visible before sliding in
            gridElement.classList.remove('slide-out');
            gridElement.classList.add('slide-in');
    
            console.log('Header is now visible after sliding in.');
        }
    }
    

    // handleOutsideClick(event) {
    //      const dropdown = this.template.querySelector('.dropdown-container');

    // // Only close if clicked **outside** dropdown
    // if (dropdown && !event.target.closest('.dropdown-container')) {
    //     this.isOpen = false;
    // }

    //     // Check if click is outside the dropdown
    //     if (!dropdown.contains(event.target)) {
    //         this.isOpen = false;
    //     }

    //     // Also handle your grid logic
    //     const gridElement = this.template.querySelector('.grid');
    //     if (
    //         gridElement &&
    //         !gridElement.contains(event.target) &&
    //         !event.target.closest('img')
    //     ) {
    //         if (gridElement.classList.contains('slide-in')) {
    //             gridElement.classList.remove('slide-in');
    //             gridElement.classList.add('slide-out');
    //         }
    //     }
    // }

    handleClickOutside(event) {
        const dropdown = this.template.querySelector('.dropdown-container'); 
        const gridElement = this.template.querySelector('.grid');
        const nationalityDropdown = this.template.querySelector('.custom-dropdown'); // nationality
        const languageDropdown = this.template.querySelector('.dropdown-container'); // language dropdown container (same class)

        const path = typeof event.composedPath === 'function'
            ? event.composedPath()
            : [event.target];

        let clickedInsideDropdown = false;
        let clickedInsideGrid = false;
        let clickedInsideNationality = false;
        let clickedInsideLanguage = false;

        for (const node of path) {
            if (!node) continue;

            // Click inside role dropdown → ignore
            if (node === dropdown || (node.classList && node.classList.contains('dropdown-container'))) {
                clickedInsideDropdown = true;
            }

            // Click inside nationality dropdown → ignore
            if (node === nationalityDropdown || (node.classList && node.classList.contains('custom-dropdown'))) {
                clickedInsideNationality = true;
            }

            // Click inside language dropdown → ignore
            if (node === languageDropdown || (node.classList && node.classList.contains('dropdown-container'))) {
                clickedInsideLanguage = true;
            }

            // Click inside grid → ignore for animation
            if (node === gridElement || (node.classList && node.classList.contains('grid'))) {
                clickedInsideGrid = true;
            }

            // Click inside toggle → ignore
            if (
                node.classList &&
                (node.classList.contains('toggle-input') ||
                node.classList.contains('toggle-switch-container'))
            ) {
                clickedInsideDropdown = true;
            }
        }

        // ✅ Close Roles dropdown
        if (this.isOpen && !clickedInsideDropdown) {
            this.isOpen = false;
            window.removeEventListener('click', this._boundHandleClickOutside);
        }

        // ✅ Close Nationality dropdown
        if (this.showDropdown && !clickedInsideNationality) {
            this.showDropdown = false;
            window.removeEventListener('click', this._boundHandleClickOutside);
        }

        // ✅ Close Language dropdown
        if (this.isExpanded && !clickedInsideLanguage) {
            this.isExpanded = false;
            window.removeEventListener('click', this._boundHandleClickOutside);
        }

        // ✅ Handle Grid animation
        if (gridElement && !clickedInsideGrid && !path.some(node => node.tagName === 'IMG')) {
            if (gridElement.classList.contains('slide-in')) {
                gridElement.classList.remove('slide-in');
                gridElement.classList.add('slide-out');
            }
        }
    }

    
    handleError(event) {
       event.preventDefault(); // Prevent default UI (red errors under fields)
    this.removeRadius = true;
    this.fieldErrorMap = {};
    let message = 'An unknown error occurred.';
    const detail = event.detail;
    const errorMessages = [];
    
    // 1. Record-level errors (e.g. from Apex)
    const recordErrors = detail?.output?.errors;
    if (recordErrors && recordErrors.length > 0) {
        recordErrors.forEach(err => {
            if (err.message) {
                errorMessages.push(err.message);
            }
        });
    }

    // 2. Field-level errors (e.g. validation errors on fields)
    const fieldErrors = detail?.output?.fieldErrors;
    if (fieldErrors) {
        Object.keys(fieldErrors).forEach(fieldName => {
            fieldErrors[fieldName].forEach(error => {
                errorMessages.push(`${fieldName}: ${error.message}`);
            });
            this.fieldErrorMap[fieldName] = true;
        });
    }

    // 3. Top-level message fallback
    if (errorMessages.length === 0 && detail?.message) {
        errorMessages.push(detail.message);
    }

    // Final combined message
    message = errorMessages.join('\n');

        // Show toast
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Update Failed',
                message: message,
                variant: 'error',
                
            })
        );
    }

    preventClose(event) {
        event.stopPropagation(); // Prevent triggering the outside click listener when clicking inside the grid
    }

   /*  triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    } */
     triggerFileInput() {
        
        console.log('triggerFileInput called ');
        const inputEl = this.template.querySelector('input[type="file"]');
        if (inputEl) {
            inputEl.value = '';
            inputEl.click();
            console.log('triggerFileInput called111 ');
        } else {
            console.warn("⚠️ File input not found.");
        }
    }

    @track isFileExpand = false;
    handleAwsUploadComplete(evt) {
        try {
            console.group('[AWS Upload Complete]');
            console.log('Raw event detail:', evt?.detail);

            //const { recordId, files = [], ctx } = evt.detail || {};
            const { recordId, files = [] } = evt.detail || {};
            console.log('recordId:', recordId);
            console.log('files count:', files.length, 'files:', files);
            //console.log('ctx (cellId):', ctx);

            if (!files.length) {
                console.warn('No uploaded files in payload; aborting.');
                console.groupEnd();
                return;
            }

            // Build arrays from the full payload
            const urls       = files.map(f => f?.url).filter(Boolean);
            const names      = files.map(f => f?.originalName).filter(Boolean);
            const types      = files.map(f => f?.type).filter(Boolean);
            const s3Keys     = files.map(f => f?.key).filter(Boolean);
            const modulePath = files[0]?.modulePath ?? undefined;
            const sizes      = files.map(f => f?.size).filter(Boolean);
            const totalBytes  = files.map(f => f?.totalBytes).filter(Boolean);

            console.log('All URLs:', urls);
            console.log('All names:', names);
            console.log('All types:', types);
            console.log('All s3 keys:', s3Keys);
            console.log('All sizes:', sizes);

            // If your field.value must be a string, use:
            // const valueForField = urls.join(',');
            const valueForField = urls; // ✅ save all URLs as an array

            const metaPayload = {
                modulePath,
                recordId,
                uploadedAt: new Date().toISOString(),
                uploadedFiles: files,     // ✅ include ALL returned file objects
                rawEventDetail: evt.detail
            };

           
            if(this.documentedit){
                 this.uploadedFiles1=files;
                 this.isFileExpand = true;
                 console.log(' this.uploadedFiles1 : ',  JSON.stringify(this.uploadedFiles1));
            }else{
                 this.processSelectedFiles(files);
                 this.isFileExpand = false;
                 console.log(' this.uploadedFiles  : ',  JSON.stringify(this.uploadedFiles));
            }
           
           
            this.fileSizeInBytes = totalBytes;
            console.log(' Files in last  : ',  files);
            
           
            this.isFileAttached=true;
            console.groupEnd();
        } catch (e) {
            console.error('[AWS Upload Complete] handler error:', e);
        }
    }
   /*  handleFileUploadInputChange(event) {
        const files = Array.from(event.target.files || []);
        this.processFiles(files); 
        event.target.value = ''; 
        
    } */
   @track totalfiles=[];
   handleFileUploadInputChange(event) {
    let files = Array.from(event.target.files || []);
   
     const invalidFile = files.find(f => !this.isAllowedFile(f));
    if (invalidFile) {
        this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
        event.target.value = ''; // reset
        return;
    }
     const longNameFile = files.find(f => f.name.length > 50);
        if (longNameFile) {
            this.showToast(
                'Error',
                `Filename too long: "${longNameFile.name}". Maximum allowed is 50 characters.`,
                'error'
            );
            event.target.value = '';
            return;
        }

    if (this.documentedit) {
        // Allow only one file in edit mode
         if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            event.target.value = ''; // reset input
            return;
        }
        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }
        // Take only the first file
        files = [files[0]];
    }
     this.totalfiles.push(...files);

    this.processFiles(files);

    // Reset file input so same file can be re-uploaded if needed
    event.target.value = '';
}
    processFiles(files) {
    if (!files || !files.length) return;

    setTimeout(() => {
        this.isFileExpand = true;

        setTimeout(() => {
            const svc = this.template.querySelector('c-document-office-service');
            if (!svc) {
                console.warn('⚠️ No <c-document-office-service> component found.');
                return;
            }

            svc.incomingFiles = files;
        }, 1000);
    }, 0);
  }



    handleFaciltyChange(event){
      /*   praveen changes for nursing  start*/
        console.log('facilty change '+event.detail.value)
        this.StaffFacility=event.detail.value;
        console.log('StaffFacility ' +this.StaffFacility); 
         this.fetchFacility(this.StaffFacility);
         this.categoryType='';
        this.jobType='';
        this.classificationLevel='';
        this.classificationPayType='';
          /*   praveen changes for nursing  end*/
         
    }
    @track toggleflag = false;
    handleStatus(event) {
        this.previousToggleValue = this.toggleValue;
        console.log('previousToggleValue'+this.previousToggleValue);
        this.toggleflag = true;
                
        this.toggleValue = event.target.checked; 
        
        console.log('Toggle status:', this.toggleValue);

    }
    @track toggleflagGeolocation = false;
    handleGeolocation(event) {
        this.previousToggleValueGeolocation = this.toggleValueGeolocation;
        console.log('previousToggleValueGeolocation'+this.previousToggleValueGeolocation);
        this.toggleflagGeolocation = true;
                
        this.toggleValueGeolocation = event.target.checked; 
        
        console.log('Toggle status in Geolocation:', this.toggleValueGeolocation);

    }

     @track uploadedFiles = [];

      get hasFiles() {
        return this.uploadedFiles.length > 0;
    }

    //staff documentation new implementation
     triggerFileDialog() {
        const input = this.template.querySelector('.file-input');
        if (input) {
            input.click();
        }
    }

     handlemultipleFileUpload(event) {
        this.processSelectedFiles(Array.from(event.target.files));
    }

    // Drag & drop
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    }

    ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

    isAllowedFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return this.ALLOWED_FILE_EXTENSIONS.includes(ext);
    }

    handleDrop(event) {
     event.preventDefault();
     event.stopPropagation();
    let files = Array.from(event.dataTransfer.files || []);
     const invalidFile = files.find(f => !this.isAllowedFile(f));
    if (invalidFile) {
        this.showToast('Error', `File type not allowed: ${invalidFile.name}. Only PDF and image files (.pdf, .png, .jpg, .jpeg) are allowed.`, 'error');
        event.target.value = ''; // reset
        return;
    }
    if (this.documentedit) {
        // 🚫 Allow only one file in edit mode
        if (this.totalfiles.length >= 1) {
            this.showToast('Error', 'Only one file can be uploaded in edit mode.', 'error');
            return;
        }

        if (files.length > 1) {
            this.showToast('Error', 'You can only upload one file in edit mode.', 'error');
            return;
        }

        files = [files[0]]; // take only the first file
    }

    // Push to tracking array
    this.totalfiles.push(...files);

    // Process files as usual
    this.processFiles(files);
    }

 processSelectedFiles(responseJson) {
    // Ensure it's always an array
    const files = Array.isArray(responseJson) ? responseJson : [responseJson];

    files.forEach(file => {
        const newFile = {
           index: this.uploadedFiles.length,
           Description: null,
           Quantity: null,
           preTaxDate: null, 
           comment: '',
           typeOfDocument: '',
           fileName: file.originalName,
           staffExpirydate: '',
           compliance: false,
           points: 0,
           awsjson:file, 
           status:'Approved',
           admin:true
           
                
        };

        this.uploadedFiles = [...this.uploadedFiles, newFile];
    });

    console.log('✅ Uploaded files pushed:', this.uploadedFiles);
}

handlefilecancel(event){
    console.log('child called');
     console.log('Cancel event received:', event.detail.message);
    this.totalfiles=[];
}

 handleFileDeleted(event) {
        console.group('handleFileDeleted called ');
        const { key, fileId ,files} = event.detail;
        console.log('File deleted in child. Key:', key, 'FileId:', fileId, 'files:',JSON.stringify(files) );

        // Example: remove it from parent's tracking
        this.uploadedFiles1 = this.uploadedFiles1.filter(f => f.fileId !== fileId);
        console.log(' this.uploadedFiles in handleFileDeleted: ',  JSON.stringify(this.uploadedFiles1));
        // if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
        //    this.isFileExpand = false;
        // }
        if (!files || files.length === 0) {
           this.isFileExpand = false;
           
        }
    }



   /*  handleDocTypeChange(event) {
            const index = event.target.dataset.index;
            this.uploadedFiles[index].typeOfDocument = event.detail.value;
            this.uploadedFiles = [...this.uploadedFiles];
             console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
        } */

    handleDocTypeChange1(event){
        this.typeOfDocument = event.detail.value;
        console.log('type of document',this.typeOfDocument);
         const docPointsMap = {
        'Australian Passport': 60,
        'Foreign Passport': 60,
        'Drivers Licence': 40,
        'Medicare Card': 25,
        'Birth Certificate': 40,
        'Certificate of Identity': 40,
        'Photo ID': 40,
        'Proof of Age Card': 40,
        'Rating Authority': 25,
        'Citizenship Certificate': 25,
        'Change of Name Certificate': 25,
        'Bank Statement 1': 20,
        'Bank Statement 2': 20,
        'Centrelink Card': 20,
        'DVA Card': 20,
        'Lease Agreement': 20,
        'Marriage Certificate': 20,
        'Utility Bill 1': 20,
        'Utility Bill 2': 20,
        'Foreign Birth Certificate': 15,
        'Indigenous Reference': 15
    };
    this.points =  docPointsMap[ this.typeOfDocument] || 0;

    }

     handleDocTypeChange(event) {
    const index = event.target.dataset.index;
    const selectedType = event.detail.value;

    // Update the selected document type
    this.uploadedFiles[index].typeOfDocument = selectedType;
    this.uploadedFiles[index].errorMessage = '';

    // Assign points based on document type
    const docPointsMap = {
        'Australian Passport': 60,
        'Foreign Passport': 60,
        'Drivers Licence': 40,
        'Medicare Card': 25,
        'Birth Certificate': 40,
        'Certificate of Identity': 40,
        'Photo ID': 40,
        'Proof of Age Card': 40,
        'Rating Authority': 25,
        'Citizenship Certificate': 25,
        'Change of Name Certificate': 25,
        'Bank Statement 1': 20,
        'Bank Statement 2': 20,
        'Centrelink Card': 20,
        'DVA Card': 20,
        'Lease Agreement': 20,
        'Marriage Certificate': 20,
        'Utility Bill 1': 20,
        'Utility Bill 2': 20,
        'Foreign Birth Certificate': 15,
        'Indigenous Reference': 15
    };

    // Assign points or default to 0 if not found
    this.uploadedFiles[index].points = docPointsMap[selectedType] || 0;

    // Trigger reactivity
    this.uploadedFiles = [...this.uploadedFiles];

    console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
}
   

    /* handleCommentsChange(event) {
        const index = parseInt(event.target.dataset.index);
        const comment = event.target.value;
        
        console.log('📝 Updating comment for index:', index, 'Comment:', comment);
        
        // Create a new array to ensure reactivity
        const updatedFiles = [...this.uploadedFiles];
        
        if (updatedFiles[index]) {
            updatedFiles[index].comment = comment;
            this.uploadedFiles = updatedFiles;
            
            console.log('✅ Comments updated:', JSON.stringify(this.uploadedFiles));
        } else {
            console.error('❌ Invalid index for comments update:', index);
        }
    } */

    handleCommentsChangeDoc(event) {
        const index = Number(event.target.dataset.index);
        const newValue = event.target.value;

        console.log("✏ Comment Change → index:", index, "value:", newValue);

        // 🔥 Deep clone array + objects (fixes non-reactive nested values)
        const updatedFiles = this.uploadedFiles.map((f, i) =>
            i === index ? { ...f, comment: newValue } : { ...f }
        );

        this.uploadedFiles = updatedFiles;

        console.log("📌 Updated uploadedFiles:", JSON.stringify(this.uploadedFiles));
    }


    handleExpiryDateChange(event) {
        const index = event.target.dataset.index;
        this.uploadedFiles[index].staffExpirydate = event.target.value;
        this.uploadedFiles = [...this.uploadedFiles];
         console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
         
    }

    handleComplianceChange(event) {
        const index = event.target.dataset.index;
        this.uploadedFiles[index].compliance = event.target.checked;
        this.uploadedFiles = [...this.uploadedFiles];
        /*  console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
         this.updateCompliantFiles(); */
    }
    updateCompliantFiles() {
        this.accountRecList = this.uploadedFiles.filter(file => file.compliance);
        console.log(' ACCOUNTLIST', JSON.stringify(this.accountRecList));
    }

    handleDelete(event) {
        const index = event.target.dataset.index;
        const key = event.currentTarget.dataset.key;
         console.log('key:',key );
        this.uploadedFiles.splice(index, 1);
        this.uploadedFiles = [...this.uploadedFiles];
         console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
          this.deleteFile(key);
    }

    handleCancel(event){
       
        this.uploadedFiles = [];
        this.totalfiles=[];
        console.log('executed');
    }
     fetchFacility(facId) {
            
            getfacilityById({ facId: facId })
                .then(result => {
                    if (result) {
                        this.typeOfService = result.Type_of_Service__c;
                        console.log('Type of Service:', this.typeOfService);
                         
                        this.jobType=this.clientData[0].Type_of_Job__c; 
                        if(this.typeOfService == 'NDIS'){
                            this.isSchadsAwards = true;
                             this.isNursingAwards = false;
                             this.isChildCareAwards = false;
                           //  this.isFixedcategory =false;
                            this.categoryType=this.clientData[0].Category_Type__c;
                            this.classificationLevel=this.clientData[0].Classification_Level__c; 
                            this.classificationPayType=this.clientData[0].Classification_Pay_Point__c; 
                        }else if(this.typeOfService == 'Nursing'){
                             this.isSchadsAwards = false;
                            this.isNursingAwards = true;
                            this.isChildCareAwards = false;
                          //   this.isFixedcategory =false;
                            this.categoryType=this.clientData[0].Nursing_Category_Type__c;
                            this.classificationLevel=this.clientData[0].Nursing_Classification_Level__c; 
                            this.classificationPayType=this.clientData[0].Nursing_Classification_Pay_Point__c;
                        }else if(this.typeOfService == 'Child Care'){
                            this.isSchadsAwards = false;
                            this.isNursingAwards = false;
                            this.isChildCareAwards = true;
                          //   this.isFixedcategory =false;
                            this.categoryType=this.clientData[0].Nursing_Category_Type__c;
                            this.classificationLevel=this.clientData[0].Nursing_Classification_Level__c; 
                            this.classificationPayType=this.clientData[0].Nursing_Classification_Pay_Point__c;
                        }else if(this.typeOfService ==undefined || this.typeOfService == null || this.typeOfService ==''){
                            this.isSchadsAwards = false;
                            this.isNursingAwards = false;
                            this.isFixedcategory =true;
                            this.isChildCareAwards = false;
                        }else{
                            this.isSchadsAwards = false;
                            this.isNursingAwards = false;
                            this.isFixedcategory =true;
                            this.isChildCareAwards = false;
                        }
    
                    }
                })
                .catch(error => {
                    console.error('Error fetching facility:', error);
                });
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

            // Optionally, dispatch an event if some other part of the app needs to know
          /*   this.dispatchEvent(new CustomEvent('filedeleted', {
                detail: { key },
                bubbles: true,
                composed: true
            }));

 */

           

            this.isDisabled=false;
            this.key='';
            this.isEdit=false;
           
            
        } catch (e) {
            console.error('[DELETE] error', e);
        }
    }

    getOptionButtonClass(isActive) {
        return isActive 
            ? 'option-button option-button-active' 
            : 'option-button option-button-inactive';
    }

    getBadgeClass(isActive) {
        return isActive 
            ? 'status-badge1 status-badge-active1' 
            : 'status-badge1 status-badge-inactive1';
    }

    getToggleTrackClass(option) {
        return option.checked ? 'custom-toggle-track active' : 'custom-toggle-track';
    }
    
    
    handleSearchChange(event) {
        const searchKey = event.target.value.toLowerCase();

        if (searchKey) {
            const filtered = this.allNationalities
                .filter(nation => nation.toLowerCase().includes(searchKey))
                .map(n => ({
                    label: n,
                    value: n
                }));

            this.filteredOptions = filtered;
            this.noResults = filtered.length === 0;
             console.log(' No Results Found:', this.noResults);
        } else {
            // reset dropdown when input is cleared
            this.filteredOptions = this.allNationalities.map(n => ({
                label: n,
                value: n
            }));
            this.noResults = false;
            this.Nationality = null;
        }
        // ✅ Always show dropdown when typing or clearing
        this.showDropdown = true;
    }


    toggleDrop(event) {
        event.stopPropagation(); // prevent bubbling

        this.showDropdown = !this.showDropdown;

            if (this.showDropdown) {
                // ✅ Populate dropdown options
                this.filteredOptions = this.allNationalities.map(n => ({
                    label: n,
                    value: n
                }));
                this.noResults = false;

                // ✅ Bind & attach outside click listener
                this._boundHandleClickOutside = this.handleClickOutside.bind(this);
                window.addEventListener('click', this._boundHandleClickOutside);
            } else {
                // ✅ Remove listener when closed
                this.showDropdown = false;
                window.removeEventListener('click', this._boundHandleClickOutside);
            }
    }


    filterOptions() {
        const term = this.searchKey.toLowerCase();
        const filtered = this.allNationalities
        .filter(n => n.toLowerCase().includes(term))
        .map(n => ({ label: n, value: n }));

        this.filteredOptions = filtered;
        this.noResults = filtered.length === 0;
    }

    handleSelect(event) {
        // Get the selected value from the clicked li
        const selectedValue = event.currentTarget.dataset.value;
        console.log('📌 Selected Nationality via onclick:', selectedValue);

        // Update local search key
        this.searchKey = selectedValue;

        // Hide the dropdown
        this.showDropdown = false;

        // Update bound variable
        this.Nationality = selectedValue;

        // Dispatch custom event for lightning-record-edit-form
        this.dispatchEvent(new CustomEvent('change', {
            detail: { Nationality: selectedValue }
        }));

        console.log('🌀 handleSelect complete. Nationality:', this.Nationality);
    }

    get displayTextLang() {
        return this.selectedLangs.length
            ? this.selectedLangs.join(', ')
            : 'Select Languages';
    }

    handleDropdownToggle() {
        this.isExpanded = !this.isExpanded;
    }

    handleLanguageToggle(event) {
        const optionId = event.target.dataset.optionId;
        const isChecked = event.target.checked;

        console.log('🌀 [handleLanguageToggle] START');
        console.log('👉 Toggled Language:', optionId);
        console.log('✅ Checked:', isChecked);

        // Ensure selectedLangs is always an array
        if (!Array.isArray(this.selectedLangs)) {
            this.selectedLangs = [];
        }

        if (isChecked) {
            if (!this.selectedLangs.includes(optionId)) {
                this.selectedLangs = [...this.selectedLangs, optionId];
                console.log('➕ Added:', optionId);
            }
        } else {
            this.selectedLangs = this.selectedLangs.filter(v => v !== optionId);
            console.log('➖ Removed:', optionId);
        }

        // Log as semicolon-separated string without changing the array itself
        console.log('📋 Updated Selected Languages (semicolon):', this.selectedLangs.join(';'));

        this.refreshValues();

        console.log('🔁 Values refreshed');
        console.log('🌀 [handleLanguageToggle] END');
        console.log('📋 Updated Selected Languages (semicolon):', this.selectedLangs.join(';'));
    }

    refreshValues() {
        console.log('🌀 [refreshValues] START');
        console.log('📋 Current Selected Languages:', JSON.stringify(this.selectedLangs));

        this.Languages = this.Languages.map(opt => {
            const isSelected = this.selectedLangs.includes(opt.id);
            console.log(`🔄 Processing: ${opt.id} | Selected: ${isSelected}`);

            return {
                ...opt,
                checked: isSelected,
                badgeClass: isSelected
                    ? 'status-badge active'
                    : 'status-badge inactive',
                statusText: isSelected ? 'Active' : 'Inactive'
            };
        });

        console.log('✅ Updated Languages State:', JSON.stringify(this.Languages));
        console.log('🌀 [refreshValues] END');
    }
    
    async handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === "approve") {
            await updateDocumentStatus({ 
                recordId: row.Id, 
                newStatus: 'Approved' 
            });
            this.refreshDocumentTable();
        }
        else if (actionName === "reject") {
            this.currentDocumentId = row.Id;  // store doc ID
            this.showRejectModal = true; 
        }
    }

    updateDocumentStatus(docId, newStatus, comments = '') {
        updateDocumentStatus({
            documentId: docId,
            status: newStatus,
            comments: comments   // ⭐ pass comments only when rejecting
        })
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: `Document marked as ${newStatus}`,
                    variant: 'success'
                })
            );

            //return refreshApex(this.wiredClientResult);
            return this.fetchStaffImperatively();
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }

    getStatusClass(status) {
        const baseClass = "status-badge";
        switch (status) {
            case "Pending":
                return `${baseClass} pending`;
            case "Approved":
                return `${baseClass} approved`;
            case "Rejected":
                return `${baseClass} rejected`;
            default:
                return baseClass;
        }
    }

    handleApprove(event) {
        const docId = event.currentTarget.dataset.id;
        this.updateDocumentStatus(docId, 'Approved');
    }

    handleReject(event) {
        this.currentDocumentId = event.currentTarget.dataset.id;
        this.showRejectModal = true;   // OPEN MODAL
    }

    refreshDocumentTable() {
        //return refreshApex(this.wiredClientResult);
        return this.fetchStaffImperatively();
    }

    handleCommentsChange(event) {
        this.comments = event.target.value;
    }

    handleRejectedClose() {
        this.showRejectModal = false;
        this.comments = '';
        this.currentDocumentId = '';
    }

    handleRejectSubmit() {
        if (!this.comments || this.comments.trim() === '') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Please enter comments before submitting.',
                    variant: 'error'
                })
            );
            return;
        }

        // Update the document with rejected status + comments
        this.updateDocumentStatus(this.currentDocumentId, 'Rejected', this.comments);

        // Close modal and reset
        this.showRejectModal = false;
        this.comments = '';
    }

    handleRecordsPerPage(event) {
        this.pageSize = event.target.value;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    previousPage() {
        this.pageNumber = this.pageNumber - 1;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    nextPage() {
        this.pageNumber = this.pageNumber + 1;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    firstPage() {
        this.pageNumber = 1;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    lastPage() {
        this.pageNumber = this.totalPages;
        this.paginationHelper();
        this.selectAllChecked = false;
    }

    // JS function to handel pagination logic
    paginationHelper() {
        console.log("🟦================ PAGINATION HELPER START ================🟦");
        console.log("📊 Total Records:", this.totalRecords);
        console.log("📏 Page Size:", this.pageSize);
        console.log("🔢 Current Page Number:", this.pageNumber);

        // Calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        console.log("📘 Total Pages:", this.totalPages);

        // Validate page number
        if (this.pageNumber < 1) this.pageNumber = 1;
        if (this.pageNumber > this.totalPages) this.pageNumber = this.totalPages;

        // Calculate slice indexes
        const start = (this.pageNumber - 1) * this.pageSize;
        const end = this.pageNumber * this.pageSize;

        console.log(`📌 Slice Range: start = ${start}, end = ${end}`);

        // Apply slice - this is what the table actually displays
        this.DocumentTableData = this.records.slice(start, end);

        console.log("📄 Records shown on UI:", this.DocumentTableData.length);
        console.log("📄 DocumentTableData:", JSON.parse(JSON.stringify(this.DocumentTableData)));
        console.log("🟩================ PAGINATION HELPER END =================🟩");
    }
//Display role fix
/* get displayRole() {
    console.log("🔥 displayRole getter called");

    // If staff data not ready yet
    if (!this.clientData || !this.clientData[0]) {
        console.log("⏳ No clientData yet");
        return "";
    }

    // If facility roles not loaded yet
    if (!this.options || this.options.length === 0) {
        console.log("⏳ options not loaded yet");
        return this.clientData[0].activeRolesDisplay || "";
    }

    // Facility roles available
    const facilityRoleSet = new Set(this.options.map(o => o.label));
    console.log("🏥 Facility active roles:", [...facilityRoleSet]);

    // Raw staff roles
    const rawRoles = this.clientData[0].StaffRoles__r || [];
    const rawRoleNames = rawRoles.map(r => r.RoleName__c);
    console.log("🧑‍🤝‍🧑 Staff raw roles:", rawRoleNames);

    // UI-only filtering
    const cleaned = rawRoleNames.filter(role => facilityRoleSet.has(role));
    console.log("🧹 Cleaned roles:", cleaned);

    return cleaned.length > 0 ? cleaned.join(", ") : "";
} */


}