import { LightningElement, track, wire, api } from 'lwc';
//Import apex method 
import USER_ID from '@salesforce/user/Id';
import fetchFacilitiess from '@salesforce/apex/StaffController.fetchStaffs';
import fetchStaff from '@salesforce/apex/StaffController.fetchStaff';
import createUser from '@salesforce/apex/PortalUserController.createPortalUserStaff';
import updatestaff from '@salesforce/apex/PortalUserController.createstafffromstaffDataCommunity';
import statusStaff from '@salesforce/apex/StaffController.statusStaff';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import My_Resource from "@salesforce/resourceUrl/myResource";
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import insertPreTax from '@salesforce/apex/StaffController.insertPreTax';
import { deleteRecord } from 'lightning/uiRecordApi';
import getShadAwards from '@salesforce/apex/StaffController.getShadAwards';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import getUserTypeValuesfromOrg  from '@salesforce/apex/PortalUserController.getUserTypeValues';
import getUserRole  from '@salesforce/apex/PortalUserController.getUserRole';
import getModules from '@salesforce/apex/HRTraining.getModules';
import insertAssignRecords from '@salesforce/apex/HRTraining.insertAssignRecords';
import createTraining from '@salesforce/apex/HRTraining.createTraining';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';


//import { RefreshEvent } from 'lightning/refresh'; 

const actions = [ 
    { label: 'View Document', name: 'view_details' },    
    { label: 'Edit', name: 'edit' }   ,
    { label: 'Delete', name: 'delete' }]

export default class TesseractAppsCreateEmployee extends NavigationMixin(LightningElement) {
    employee = My_Resource + '/myResource/images/employee.svg';
    // JS Properties
    @track address;
    @track cardFlag=false;
    @track portalStaffId = '';
    recordId;
    subscription = {};
    CHANNEL_NAME = '/event/RefreshDataTable__e';
    records = []; //All records available in the data table
    records2 = [];
    totalRecords = 0; //Total no.of records
    pageSize; //No.of records to be displayed per page
    totalPages; //Total no.of pages
    pageNumber = 1; //Page number    
   // recordsToDisplay = []; //Records to be displayed on the page
    @track refreshTable = [];
    @track recordsToDisplay = [];
    @api selectedName;
    @api facilityButton;
    @track orgNam = '';
    @track visible = false;
    @track fname = '';
    @track lname = '';
    @track firstname='';
    @track lastname ='';
    @track blurflag=false;
    @track staffEditFlag=false;
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalcode;
    @track name;
    @track status;
    @track lastname1;
    @track state;
    @track satffDataJasonformat={};
    @track heading;
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
    @track ShowPretaxModal;
    @track parentStaffId;
    @track preTaxRecId='';
    @track accountRecList = [];
    activeSections = ['StaffDetails', 'Address', 'EmploymentDetails', 'staffDocumentation', 'InvoiceDetails', 'PreTaxDetails','PostTax','ApproversDetails','BankDetails','SuperannuationDetails','Leaves','TaxationDetails','EmergencyDetails'];
    @track showPreTaxRecordEditForm=false;
    @track totalPretaxvalue="Pre Tax Deduction - Total ";
    @track preTaxForSubmit;
    @track postTaxlabel='Post Tax Deduction - Total '
    @track postTaxLabelvalue=0;
    @track pretaxOne=0;
    @track  pretaxtwo=0;
    @track  pretaxThree=0;
    @track  pretaxFour=0;
    @track  pretaxFive=0;
    @track noRecordsFlag=true;
    @track submitButtonlabel;
    @api pageName;
    @track OrgNisationRoles;
    @track stafflabel='All';
    @track CreateUserflag = false;
    @track userCrearedflag = false;
    UserTypeValues = [];
    userId = USER_ID;
    @track selectedRole = '';
    @track selectedUserType = '';
    wiredresult;
    @track geoLocationStatus=false;
    @track currentStep = 'step1'; 
    courseOptions = [
  { label: "Disability Awareness", value: "Disability Awareness" },
  { label: "Employee Onboarding", value: "Employee Onboarding" },
  { label: "Hand Hygiene", value: "Hand Hygiene" },
  { label: "NDIS Code of Conduct", value: "NDIS Code of Conduct" },
  { label: "Policies and Procedures", value: "Policies and Procedures" },
  { label: "Safe Meals and Oral Hygiene", value: "Safe Meals and Oral Hygiene" },
  { label: "Supporting Effective Communication", value: "Supporting Effective Communication" },
  { label: "Managing Challenging Situations", value: "Managing Challenging Situations" },
  { label: "Risk Management", value: "Risk Management" },
  { label: "Safe Workplaces (WHS)", value: "Safe Workplaces (WHS)" },
  { label: "Workplace Bullying and Harassment", value: "Workplace Bullying and Harassment" },
  { label: "Incident Reporting", value: "Incident Reporting" },
  { label: "Privacy and Confidentiality", value: "Privacy and Confidentiality" },
  { label: "Introduction to Restrictive Practices for NDIS Workers", value: "Introduction to Restrictive Practices for NDIS Workers" },
  { label: "Understanding Psychosocial Disability Under The NDIS", value: "Understanding Psychosocial Disability Under The NDIS" },
  { label: "Medication Management for NDIS Workers", value: "Medication Management for NDIS Workers" },
  { label: "Introduction to Eating Disorders", value: "Introduction to Eating Disorders" },
  { label: "Diabetes Management", value: "Diabetes Management" },
  { label: "Introduction to Autism", value: "Introduction to Autism" },
  { label: "Receiving Feedback With a Growth Mindset", value: "Receiving Feedback With a Growth Mindset" },
  { label: "Diversity, Equity and Inclusivity in the Workplace", value: "Diversity, Equity and Inclusivity in the Workplace" },
  { label: "First Aid and CPR Refresher Course", value: "First Aid and CPR Refresher Course" },
  { label: "Introduction to Positive Behaviour Support (NDIS)", value: "Introduction to Positive Behaviour Support (NDIS)" },
  { label: "Trauma Informed Support", value: "Trauma Informed Support" },
  { label: "Mental Health Awareness and Support", value: "Mental Health Awareness and Support" },
  { label: "Effective Complaint Handling for NDIS Providers", value: "Effective Complaint Handling for NDIS Providers" },
  { label: "Suicide Awareness and Prevention", value: "Suicide Awareness and Prevention" },
  { label: "Insulin and Diabetes", value: "Insulin and Diabetes" },
  { label: "Waste Management for NDIS", value: "Waste Management for NDIS" }
];

 
    @track sectionFlags = {
        staffDetails: true,
        Addressdetails: true,
        EmploymentDetails: true,
        InvoiceDetails: true,
        TaxationDetails: true,
        PreTaxDeduction: true,
        PostTaxDeduction: true,
        EmergencyDetails: true,
        BankDetails: true,
        SuperannuationDetails: true,
        Leaves: true,
        ApproversDetails: true,
        Training: true,
    };
    
    // Icons for the toggle buttons
    @track sectionIcons = {
        staffDetails: '\u2B9F', 
        Addressdetails: '\u2B9F',
        EmploymentDetails: '\u2B9F',
        InvoiceDetails: '\u2B9F',
        TaxationDetails: '\u2B9F',
        PreTaxDeduction: '\u2B9F',
        PostTaxDeduction: '\u2B9F',
        EmergencyDetails: '\u2B9F',
        BankDetails: '\u2B9F',
        SuperannuationDetails: '\u2B9F', 
        Leaves: '\u2B9F',
        ApproversDetails: '\u2B9F',
        Training: '\u2B9F',
    };
     @track training = {
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        courses: ''
    };

    @track trainingId;

    handleTraining(event) {
        const field = event.target.name;
        this.training[field] = event.target.value;
        console.log('TRAINING'+JSON.stringify(this.training));
    }
   handleCreateTraining() {
    const { name, startDate, endDate, description, courses } = this.training;

    createTraining({ 
        name: name, 
        startDate: startDate, 
        endDate: endDate, 
        description: description, 
        CurrentOrgId: this.orgId,
        courses: courses.join(';') // If courses is an array, convert to semicolon-separated string
    })
    .then(result => {
        console.log('Training Created with Id--------->', result);
        this.selectedmoduleId = result;
        // Optionally show success toast
       this.handleassignmentinsert();
    })
    .catch(error => {
        console.error('Error creating training:', error);
        // Optionally show error toast
    });
}

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
    
    get step1Style() {
        return this.currentStep === 'step1' ? 'display: block;' : 'display: none;';
    }
    get step2Style() {
        return this.currentStep === 'step2' ? 'display: block;' : 'display: none;';
    }
    get step3Style() {
        return this.currentStep === 'step3' ? 'display: block;' : 'display: none;';
    }
    get step4Style() {
        return this.currentStep === 'step4' ? 'display: block;' : 'display: none;';
    }
    
    handleNext1(){
        
        const mandatoryFields = this.template.querySelectorAll('[data-id="mandatory"]');
    let isValid = true;

    mandatoryFields.forEach(field => {
        if (!field.reportValidity()) {
            isValid = false;
        }
    });

    if (isValid) {
        this.currentStep = 'step2'; // move to next step
    }
        
    }
    handleprevious1(){
         this.currentStep ='step1';
    }
    handleNext2(){
   const mandatoryFields = this.template.querySelectorAll('[data-id="mandatory1"]');
    let isValid = true;

    mandatoryFields.forEach(field => {
        if (!field.reportValidity()) {
            isValid = false;
        }
    });

    if (isValid) {
        this.currentStep = 'step3'; // move to next step
    }

        
    }
     handleprevious2(){
         this.currentStep ='step2';
    }
    handleNext3(){
          const mandatoryFields = this.template.querySelectorAll('[data-id="mandatory2"]');
    let isValid = true;

    mandatoryFields.forEach(field => {
        if (!field.reportValidity()) {
            isValid = false;
        }
    });

    if (isValid) {
         this.currentStep ='step4'; // move to next step
    }
        
        
    }
     handleprevious3(){
         this.currentStep ='step3';
    }

    ShowDocumentSection(event){
        this.showStaffDocumentSection= true;
        this.ShowDataTable=false;
        this.parentStaffId=event.currentTarget.dataset.id; 
        console.log('parent Id=>'+this.parentStaffId);

    }



    roleOptions = [
        { label: 'Org Admin', value: 'Portal account partner Executive' },
        { label: 'Roster Admin', value: 'Portal account partner Manager' },
        { label: 'Staff', value: 'Portal account partner User' }
    ];

    @wire(getUserRole)
    wiredUserRole({ error, data }) {
        if (data) {
            this.userTypeRole = data;
            console.log('User Type:', this.userTypeRole);
        } else if (error) {
            console.error('Error fetching user role:', error);
        }
    }

    get filteredRoleOptions() {
        console.log('this.userTypeRole===>'+this.userTypeRole);
        if (this.userTypeRole === 'NDIS Org Admin') {
            return this.roleOptions;
        } else {
            return this.roleOptions.filter(role => 
                role.value === 'Portal account partner Manager' || 
                role.value === 'Portal account partner User'
            );
        }
    }

    handlerolechange(event){
        this.selectedRole = event.target.value;
        // Enable the User Type combobox when a role is selected
    if (this.selectedRole) {
        this.isUserTypeDisabled = false; 
    } else {
        this.isUserTypeDisabled = true; 
    }
    }

    

    

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
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

        @track showStaffDocumentSection = false;
        @api whatId;
   
        @track staffDocumentMap={};
        @track showDocumentTable;
        @track  DocumentTableData=[];
        @track AddDocButtonDisable= false;
        @track typeOfUser;
        @track orgId;
        @track trainingOptions = [];
        @track modules = [];
        @track selectedmoduleId;
        @track orgname;
        @track CoursesFlag =true;
        @track Courses = [];
        
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
                typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"}, initialWidth: 200
                
              },/* {
                label: 'View File',
                fieldName: 'View_File__c',
                type: 'url',
                initialWidth: 150
                
              }, */
            {            
                type: 'action',
                label: 'Action',  
                initialWidth: 100,          
                typeAttributes: {
                    rowActions: actions,
                }
            }
            ];
    // connectedCallback method called when the element is inserted into a document
    connectedCallback() {
    /*  this.addEventListener('staffidchange', this.handleStaffIdChange.bind(this)); */
    console.log('whatid from task'+this.whatId);
    if(this.whatId){
      this.editstaffflag=true;
      this.adminFlag =false;
      this.cardFlag =false;
      this.listFlag = false;
       
      this.recordId=this.whatId;
      this.dispatchEvent(new CustomEvent('clearstaffid', {
        bubbles: true,
        composed: true
    }));
    
    }else{
       this.blurflag = true;
       this.recordId='';
        //Platform Event 
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            console.log('Successfully subscribed to channel');
            this.subscription = response;
        });

        onError(error => {
            console.error('Received error from server: ', error);
        });
        this.noRecordsFlag=true;
        console.log('Before Connected Callback>>'+this.selectedName);  
        organizationDetails().then(response => {
            console.log('org details'+JSON.stringify(response));
           this.orgId = response.listofPriceBook.Id;
           this.orgname = response.listofPriceBook.Name;
             this.typeOfUser = response.listofPriceBook.Type_of_User__c;
           
             let orgRoles= response.listofPriceBook.Roles__c;
             this.OrgNisationRoles=orgRoles.split(";").map(rec=>{
                return {
                  value:rec,label:rec
                }
               
              });
              console.log('org roles  '+ JSON.stringify(this.orgId));
               this.fetchTrainingModules(); 
           });
          
    }
     
       
    }
     setPageSizeByZoomAndScreen() {
    const zoomLevel = Math.round(window.devicePixelRatio * 100); 

    if (zoomLevel <= 100) {
        this.pageSize = 16;
    } else if (zoomLevel <= 125) {
        this.pageSize = 12;
    } else {
        this.pageSize = 8;
    }
}

handleResize() {
    const oldSize = this.pageSize;
    this.setPageSizeByZoomAndScreen();

    if (this.pageSize !== oldSize) {
        this.paginationHelper(); 
    }
}
    handleStaffIdChange(event) {
        this.recordId = event.detail.staffId;        
        console.log('Child received staffId:', this.recordId);
    }

    handleSearchKeyPress(event) {
        if (event.key === 'Enter') {
            this.searchName = event.target.value;
            this.applyFilters(); // Or whatever method you use to search
        }
    }

   fetchTrainingModules() {
    console.log('Calling getModules with orgId:', this.orgId);

    getModules({ CurrentOrgId: this.orgId })
        .then(result => {
            console.log('Training result:', JSON.stringify(result));
            this.modules = result;
        console.log('Training result:', JSON.stringify(this.modules));
            // ✅ Ensures a new array is assigned
            this.trainingOptions = [...result.map(item => ({
                label: item.Name,
                value: item.Id
            }))];

            console.log('Dropdown options:', JSON.stringify(this.trainingOptions));
        })
        .catch(error => {
            this.error = error;
            console.error('Error fetching modules:', error);
        });
}
 handleModuleChange(event) {
        this.selectedmoduleId = event.detail.value;
        console.log('Selected Training Module Id:', this.selectedmoduleId);
        const selectedModule = this.modules.find(module => module.Id === this.selectedmoduleId);
        if (selectedModule && selectedModule.Courses__c) {
            this.CoursesFlag = true;
            const CoursesArray = selectedModule.Courses__c.split(';');
            this.Courses = CoursesArray.join('\n');
        } else {
            this.Courses = [];
        }
        console.log('selected courses'+JSON.stringify(this.Courses));
    }
     handleassignmentinsert() {
       // console.log('organisation name insert :'+this.userOrgName);
    let staffid = [this.parentStaffId];
    
   
    console.log('selectedmoduleId----->'+this.selectedmoduleId);
     console.log('staffid----->'+JSON.stringify(staffid));
      console.log('orgname----->'+this.orgname);

        insertAssignRecords({ moduleID: this.selectedmoduleId, selectedStaff: staffid, OrganizationName: this.orgname })
        .then(() => {
            
        
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records inserted successfully',
                    variant: 'success'
                })
            );
           
            
        })
        .catch(error => {
            // Handle error
            console.error('Error inserting record:', error);
        });
            
    }

     handleStaffIdChange(event) {
        this.recordId = event.detail.staffId;
        
        console.log('Child received staffId:', this.recordId);
    }
    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }

    handleEvent = event => {
        const refreshRecordEvent = event.data.payload;
        if (refreshRecordEvent.RecordId__c === this.recordId) {
            this.recordId = '';
            return refreshApex(this.refreshTable);
        }
    }

    disconnectedCallback() {
        unsubscribe(this.subscription, () => {
            console.log('Successfully unsubscribed');
        });
    }

    @wire(getUserTypeValuesfromOrg, { selectedroleValue: '$selectedRole', userId: '$userId' })
      wiredMultiPicklistValues({ error, data }) {
        console.log('Selected Role:', this.selectedRole);
        console.log('User ID:', this.userId);
        console.log('User Type Values received:', data);
        if (data) {
                console.log('User Type Values received:', data);
                this.UserTypeValues = data.map(item => ({ label: item, value: item }));
            } else if (error) {
                console.error('Error fetching User Type values', error);
            }
        }


    handleUserTypeChange(event){
        this.selectedUserType = event.target.value;
    }
    

    @wire(fetchFacilitiess, { recordId: '$selectedName', firstname: '$firstname', lastname: '$lastname' }) recordsToDisplay(result) {
        this.wiredresult = result;
       // this.refreshTable = result;
      
        if (result.data) {
            this.refreshTable = result.data;
             let finalData=[];
             this.records=[];
             this.records2=[];
                finalData=  result.data;
            console.log('RESULT--> ' + JSON.stringify(result));
            result.data.forEach(rec=>{
                this.satffDataJasonformat[rec.Id]={"street":rec.Address__Street__s,"city":rec.Address__City__s,"stateCode":rec.Address__StateCode__s,"countryCode":rec.Address__CountryCode__s,"postalCode":rec.Address__PostalCode__s,"childRecords":rec.Child_Staffs__r,
                "preTaxvalue":rec.Pre_Tax_Calculator__c,"pretaxone":rec.Pre_Tax_One_Value__c,"pretaxtwo":rec.Pre_Tax_Two_Value__c,"pretaxThree":rec.Pre_Tax_Three_Value__c,"pretaxFour":rec.Pre_Tax_Four_Value__c,"pretaxFive":rec.Pre_Tax_Five_Value__c,
                "postTax":rec.Post_Tax__c,"primaryVal":rec.Make_Primary_as_Approver__c,"secondaryVal":rec.Make_Secondary_as_Approver__c,"voluntaryContribution":rec.Voluntary_Contribution__c,"ContributionCurrency":rec.Voluntary_Contribution_Fixed__c,"ContributionPercent":rec.Voluntary_Contribution_Percent__c,
                "status":rec.Status__c};
            });
           // console.log('Staff data Json format'+JSON.stringify(this.satffDataJasonformat));
           const storedFacilityId = localStorage.getItem('defaultFacilityId');
            const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
            console.log('storedFacilityId'+storedFacilityId);
            console.log('storedFacilityLabel'+storedFacilityLabel);
            getCurrentLoggedUserInfo().then(userData=>{
                    console.log('user data ==>'+JSON.stringify(userData));
                    let userType=userData.User_Type__c;
                         getFacilityData().then(response => {
                                        console.log('Facility data fetched successfully:', response);
                                        this.finalListFacilities=[];
                                        this.selectedFacilities=[];
                                        this.facilityOptions = response.map(record => ({
                                            label: record.Name,
                                            value: record.Id
                                        }));
                                        if( userType =='NDIS Org Admin' || userType == 'ICT Admin'){
                                            this.finalListFacilities=this.facilityOptions  ;
                                               console.log('Mapped facility options: FOR ORG ADMIN', JSON.stringify(this.finalListFacilities));
                                                let facilityIds = [];
                                                facilityIds.push(storedFacilityId); 
                                                const filteredData = finalData.filter(rec =>
                                                    facilityIds.includes(rec.Facility__c)
                                                );
                                                this.records = filteredData;
                                                this.records2 = filteredData;
                                                 this.orginalData=filteredData;
                                                this.totalRecords = filteredData.length;  
                                                this.setPageSizeByZoomAndScreen();
                                                if (this.totalRecords > 9) {
                                                this.visible = true;
                                                }            
                                                this.paginationHelper(); 
                                                this.applyFilters();
                                                this.noRecordsFlag=true;
                                                
                                        }else if(userType =='Facility Admin' || userType =='HR Admin' || userType =='Roster Manager'){
                                        
                                                        getFacilityCurrentUser().then(result => {
                                                            console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                                                 this.finalListFacilities =  result.map(record => ({
                                                                                            label: record.Facility__r.Name,
                                                                                            value: record.Facility__r.Id
                                                                                   })); 
                                                                  
                                                               /*   const facilityIds = this.finalListFacilities.map(f => f.value); */
                                                                    let facilityIds = [];
                                                                    facilityIds.push(storedFacilityId); 
                                                                    const filteredData = finalData.filter(rec =>
                                                                        facilityIds.includes(rec.Facility__c)
                                                                    );
                                                                      console.log('facilityIds--> ' + JSON.stringify(facilityIds));
                                                                      console.log('filteredData--> ' + JSON.stringify(filteredData));
                                                                         console.log('filteredData LENGTH--> ' +filteredData.length);
                                                                  
                                                                    this.records = filteredData;
                                                                    this.records2 = filteredData;
                                                                      this.orginalData=filteredData;
                                                                     console.log('filteredData--> ' + JSON.stringify(this.records));
                                                                         console.log('filteredData LENGTH--> ' +this.records.length);
                                                                           console.log('filteredData--> ' + JSON.stringify( this.records2));
                                                                         console.log('filteredData LENGTH--> ' + this.records2.length);
                                                                    this.totalRecords = filteredData.length;  
                                                                    this.setPageSizeByZoomAndScreen();
                                                                    if (this.totalRecords > 9) {
                                                                    this.visible = true;
                                                                    }            
                                                                    this.paginationHelper(); 
                                                                    this.applyFilters();
                                                                    this.noRecordsFlag=true;

                                                                console.log('Mapped facility options: Facility Admin', JSON.stringify(this.finalListFacilities));
                                                            }).catch(error => {
                                                                this.error = error;
                                                                console.error('Error fetching facilities:', error);
                                                    
                                                            });
                                                                
                                        }
                                                        
                                     
                                    })
                                    .catch(err => {
                                        console.error('Error fetching facility data:', err);
                                    });
            });
           /*  this.records = result.data;
            this.records2 = result.data;
            this.totalRecords = result.data.length; // update total records count                
            this.pageSize = 12;
             this.setPageSizeByZoomAndScreen();
            if (this.totalRecords > 9) {
                this.visible = true;
            } */
            //console.log('Org details Key : ',keyValue);
            // this.pageSizeOptions[0]; //set pageSize with default value as first option
           /*  this.paginationHelper(); // call helper menthod to update pagination logic 
            this.applyFilters();
            this.noRecordsFlag=true; */
        }else{
            this.noRecordsFlag=false; 
        }

    }
    
    filterState = 'All';
    @track filteredRecords = [];
    handleTogglestaff() {
        
        // Cycle through the filter states
        if (this.filterState === 'All') {
            this.filterState = 'Active';
        } else if (this.filterState === 'Active') {
            this.filterState = 'Inactive';
        } else {
            this.filterState = 'All';
        }
       // console.log('REFRESH TABLE'+JSON.stringify(this.refreshTable));
        // Apply filtering logic based on the filter state
        if (this.filterState === 'Active') {
            this.stafflabel='Active';
            this.filteredRecords = this.records2.filter(record => record.Status__c === true );
            
        } else if (this.filterState === 'Inactive') {
             this.stafflabel='Inactive';
            this.filteredRecords = this.records2.filter(record => record.Status__c === false );
        } else {
            this.stafflabel='All'
            this.filteredRecords = [...this.records2]; // Show all users
        }
    
        // Update total records and handle pagination
        this.records = this.filteredRecords;
        this.totalRecords = this.filteredRecords.length;
        console.log('total records'+this.totalRecords);
        //this.noRecordsFlag = this.totalRecords === 0;
        this.paginationHelper();
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
    // JS function to handel pagination logic 
    paginationHelper() {
        this.recordsToDisplay = [];
        // calculate total pages
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        // set page number 
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        // set records to display on current page 
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }
            this.recordsToDisplay.push(this.records[i]);
        }
        refreshApex(this.refreshTable);

    }
    
    fetchStaff(){      
       this.showSpinner = true;
       console.log('Staff Data1>>'+this.selectedName);
        fetchFacilitiess({ recordId: this.selectedName, firstname: this.fname, lastname: this.lname })
            .then(response => {
                console.log('response>>>',response);
                this.refreshTable= response;
                if(response){
                    
                    response.forEach(rec=>{
                        this.satffDataJasonformat[rec.Id]={"street":rec.Address__Street__s,"city":rec.Address__City__s,"stateCode":rec.Address__StateCode__s,"countryCode":rec.Address__CountryCode__s,"postalCode":rec.Address__PostalCode__s,"childRecords":rec.Child_Staffs__r,
                        "preTaxvalue":rec.Pre_Tax_Calculator__c,"pretaxone":rec.Pre_Tax_One_Value__c,"pretaxtwo":rec.Pre_Tax_Two_Value__c,"pretaxThree":rec.Pre_Tax_Three_Value__c,"pretaxFour":rec.Pre_Tax_Four_Value__c,"pretaxFive":rec.Pre_Tax_Five_Value__c,
                        "postTax":rec.Post_Tax__c,"primaryVal":rec.Make_Primary_as_Approver__c,"secondaryVal":rec.Make_Secondary_as_Approver__c,"voluntaryContribution":rec.Voluntary_Contribution__c,"ContributionCurrency":rec.Voluntary_Contribution_Fixed__c,"ContributionPercent":rec.Voluntary_Contribution_Percent__c,
                         "status":rec.Status__c};
                    });
                    //this.dispatchEvent(new RefreshEvent());
                  
                }
                this.refreshTable = response;               
                   // console.log('RESULT--> ' + JSON.stringify(response));
                    this.records = response;
                    this.totalRecords = response.length; // update total records count                 
                    this.pageSize = 12;
                    if (this.totalRecords > 6) {
                        this.visible = true;
                    }
                console.log('Staff Data >>>'+JSON.stringify(this.refreshTable));
                this.paginationHelper();
                //this.staffEditFlag=false;
                this.showSpinner = false;
        }).catch(error=>{
            this.showSpinner = false;
        });
    }

    handleClear() {
        let listOfsearchString = [];
        this.fname = '';
        this.lname = '';
        this.fetchStaff();
    }
   /* onRefreshStaff(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                pageName: 'staffpage'
            },
        });
    } */ 

        @track StaffFacility='';
handleFaciltyChange(event){
    console.log('facilty change '+event.detail.value)
    this.StaffFacility=event.detail.value;
    console.log('StaffFacility ' +this.StaffFacility); 
} 

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            let inputs = this.template.querySelectorAll('lightning-input');
            let listOfsearchString = [];

            inputs.forEach((element) => {
                if (element.name === 'fname') {
                    this.fname = element.value;
                    listOfsearchString.push(element.value);
                } else if (element.name === 'lname') {
                    this.lname = element.value;
                    listOfsearchString.push(element.value);
                }
            });

            console.log(JSON.stringify(listOfsearchString));

            // You can now call your logic directly here (e.g., fetch data or dispatch an event)
            this.fetchStaff(); // if this still must be invoked at the end
        }
    }
@track searchName = ''; // search input

handleSearchNameInput(event) {
    this.fname = event.target.value;
    this.lname = event.target.value;
    console.log('🔍 Search input:', this.fname);
    this.fetchStaff();

    // Filter by First_Name__c or Last_Name__c
    /* const filtered = this.refreshTable.filter(staff => {
        const first = staff.First_Name__c?.toLowerCase() || '';
        const last = staff.Last_Name__c?.toLowerCase() || '';
        return first.includes(this.searchName) || last.includes(this.searchName);
    });

    console.log('📋 Filtered results count:', filtered.length);

    this.records = [...filtered]; // Required for paginationHelper
    this.totalRecords = filtered.length;
    this.pageNumber = 1;
    this.paginationHelper(); */
}



    
    handleSearch(event) {
        console.log(event.target.label);
        var inp = this.template.querySelectorAll("lightning-input");
        let listOfsearchString = [];

        inp.forEach(function (element) {

            if (element.name == "fname") {
                this.fname = element.value;
                listOfsearchString.push(element.value);
            }

            else if (element.name == "lname") {
                this.lname = element.value;
                listOfsearchString.push(element.value);
            }


        }, this);
        console.log(JSON.stringify(listOfsearchString));
        this.fetchStaff();
    }


    @track adminFlag = true;
    handleCreateNewStaff() {
         this.recordId ='';
         this.street ='';
         this.city ='';
         this.country ='';
         this.province ='';
         this.postalcode ='';
         this.preTaxForSubmit=0;
         this.postTaxLabelvalue=0;
        this.staffEditFlag=true;
        this.currentStep ='step1';
        this.blurflag=true;
        this.heading=false; 
        this.AddDocButtonDisable= true;
        this.primaryApproverValue=false;
        this.secondaryApproverValue=false;
        this.submitButtonlabel='Save';
        this.confirmEmailError='';
        this.primaryEmailError=false;
        this.secondaryEmailError=false;
        this.errorMessage = '';
        this.saveButtonDisable = false;
        this.fileName='';
        this.cardFlag = true;
        this.listFlag = false;
        this.adminFlag =true;
        this.visible = false;
        this.pretaxOne = 0;
        this.pretaxtwo = 0;
        this.pretaxThree = 0;
        this.pretaxFour = 0;
        this.pretaxFive = 0;
       this.training = {
                name: '',
                startDate: '',
                endDate: '',
                description: '',
                courses: []
            };
        this.CoursesFlag=true;    
        this.selectedmoduleId = '';

         this.categoryType='';
         this.jobType='';
         this.classificationLevel='';
         this.classificationPaytype='';
         this.createdShiftRole='';
         this.genralHourlyRate=0;
         this.sturdayHourlyRat=0;
         this.sundayhourlyRate=0;
         this.publicHolidayRate=0;
         this.afterNoonShiftRate=0;
         this.nightShiftRate=0;
         this.paidBreak=true;
         if(this.typeOfUser=='ICT User'){
            this.ictUserType=true;
         }else{
            this.ictUserType=false;
         }
         this.geoLocationStatus=false;
    }

    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }
    get animationclass() {
        return this.template ? 'right-align' : 'right-align-reverse';
    }

    @track editstaffflag = false;
    @track showDescription2 = false;
    @track showDescription3 = false;
    @track showDescription4 = false;
    @track showDescription5 = false;
    @track delete2 = false;
    @track delete3 = false;
    @track delete4 = false;
    @track delete5 = false;

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
        } else if (index === "3") {
            this.showDescription3 = false;
            this.delete2 = true;
            this.pretaxThree = 0;
        } else if (index === "4") {
            this.showDescription4 = false;
            this.delete3 = true;
            this.pretaxFour = 0;
        } else if (index === "5") {
            this.showDescription5 = false;
            this.delete4 = true;
            this.pretaxFive = 0;
            
        }
        this.handlePreTaxChange({ target: { name: '' } });
    }
    handleEditStaff(event) {
       
       // this.fetchStaff();
        let facId = event.currentTarget.dataset.id;
        this.recordId = facId;
        this.editstaffflag = true;
        this.adminFlag =false;
        this.listFlag = false;
        this.cardFlag =false;
        this.totalRecords = 0;
        this.parentStaffId=facId;
        this.staffEditFlag=false;
        this.submitButtonlabel='Update';
        this.heading=true; 
        this.AddDocButtonDisable= false;
        this.confirmEmailError='';
        this.primaryEmailError=false;
        this.secondaryEmailError=false;
        this.errorMessage = '';
        this.saveButtonDisable = false;
        this.fileName='';
        this.addingPreTax();
      
        console.log('Staff Id'+facId);
            this.street = this.satffDataJasonformat[facId]["street"];
            this.city = this.satffDataJasonformat[facId]["city"];
            this.country = this.satffDataJasonformat[facId]["countryCode"];
            this.province = this.satffDataJasonformat[facId]["stateCode"];
            this.postalcode = this.satffDataJasonformat[facId]["postalCode"];
            this.pretaxOne=this.satffDataJasonformat[facId]["pretaxone"];
            this.pretaxtwo=this.satffDataJasonformat[facId]["pretaxtwo"];
            this.pretaxThree=this.satffDataJasonformat[facId]["pretaxThree"];
            this.pretaxFour=this.satffDataJasonformat[facId]["pretaxFour"];
            this.pretaxFive=this.satffDataJasonformat[facId]["pretaxFive"];
            this.primaryApproverValue=this.satffDataJasonformat[facId]["primaryVal"];
            this.secondaryApproverValue=this.satffDataJasonformat[facId]["secondaryVal"];

            /* this.status = this.satffDataJasonformat[facId]["status"]; */
            let voluntaryContribution =this.satffDataJasonformat[facId]["voluntaryContribution"];
            this.voluntaryContributionCureencyVal=this.satffDataJasonformat[facId]["ContributionCurrency"];
            this.voluntaryContributionPercentVal=this.satffDataJasonformat[facId]["ContributionPercent"];
            if(voluntaryContribution =='Fixed'){
                this.VoluntaryContributionCurrency=true;
                this.VoluntaryContributionPercent=false;
                
            }else{
                this.VoluntaryContributionPercent=true;
                this.VoluntaryContributionCurrency=false;
                
            }
            console.log('contribution in fixed'+ this.voluntaryContributionCureencyVal)
            console.log('contribution in %'+ this.voluntaryContributionPercentVal)
            this.preTaxForSubmit=this.satffDataJasonformat[facId]["preTaxvalue"];
            if(this.satffDataJasonformat[facId]["preTaxvalue"]){
            this.totalPretaxvalue ='Pre Tax Deduction - Total '+ this.satffDataJasonformat[facId]["preTaxvalue"];
            }else{
                this.totalPretaxvalue ='Pre Tax Deduction - Total '+ 0;  
            }
            if(this.satffDataJasonformat[facId]["postTax"]){
            this.postTaxlabel='Post Tax Deduction - Total '+ this.satffDataJasonformat[facId]["postTax"];
            }else{
                this.postTaxlabel='Post Tax Deduction - Total '+ 0;  
            }
            console.log('pagename'+this.pageName);
           // this.addingPreTax();
          /*  this[NavigationMixin.Navigate]({
            // Pass in pageReference
            type: 'comm__namedPage',
            attributes: {
               pageName: 'editstaff',
            },
            state: {
              c__propertyValue:this.recordId,
              c__orgID:this.selectedName,
              c__page:this.pageName,
              c__typeofUser:this.typeOfUser

            },
          }); */
    }
    childevent(event){
        this.editstaffflag = false;
        this.adminFlag =true;
        this.cardFlag =false;
        this.listFlag = true;
        refreshApex(this.wiredresult);
        this.fetchStaff();
       /*  setTimeout(() => {
            this.fetchStaff();
        }, 1000); */
          
        /* handleEvent = event => {
            const refreshRecordEvent = event.data.payload;
            if (refreshRecordEvent.RecordId__c === this.recordId) {
                this.recordId = '';
                return refreshApex(this.refreshTable);
            }
        } */

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

    handleSubmit(event){
        console.log('in submit');
        event.preventDefault();// stop the form from submitting
          const fields = event.detail.fields;
          // alert(JSON.stringify(fields));
            fields.Address__Street__s = this.street;
            fields.Address__City__s =  this.city;
            fields.Address__StateCode__s = this.province;
            fields.Address__CountryCode__s = 'AU';
            fields.Address__PostalCode__s = this.postalcode;
            fields.Role__c=this.createdShiftRole;
            fields.Facility__c=this.StaffFacility;
            fields.Enable_Geolocation__c=this.geoLocationStatus;
           // fields.Pre_Tax_Calculator__c = this.preTaxForSubmit;
           if(this.voluntaryContributionCureencyVal==undefined){
            this.voluntaryContributionCureencyVal=0;
           }
           if(this.voluntaryContributionPercentVal==undefined){
            this.voluntaryContributionPercentVal=0;
           }
           fields.Voluntary_Contribution_Fixed__c=this.voluntaryContributionCureencyVal;
           fields.Voluntary_Contribution_Percent__c= this.voluntaryContributionPercentVal;
          console.log('After fields>>'+JSON.stringify(fields));
          this.template.querySelector('lightning-record-edit-form').submit(fields);  
      }
      handleSuccess(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        this.staffEditFlag=false;
        let staffRecID=event.detail.id;
        this.portalStaffId = event.detail.id;
        this.parentStaffId = event.detail.id;
        this.confirmEmailError='';
        this.primaryEmailError=false;
        this.secondaryEmailError=false;
        this.cardFlag = true;
        this.adminFlag = true;
        this.visible = true;
        this.currentStep ='step1'
        console.log('file base64 in success=>'+JSON.stringify(this.base64FileData));
        console.log('Record in success=>'+this.parentStaffId);
        console.log('File in success=>'+this.fileName);
        this.CreateUserflag = true;
        console.log('staff create user falg '+this.CreateUserflag)
       
       // Refresh the data after success
       refreshApex(this.refreshTable);
        //this.fetchStaff();
        console.log('after success +')
        setTimeout(() => {
            this.showSpinner = false;
            //refreshApex(this.recordsToDisplay);
            this.addingPreTax();  
        }, 2000);
        if(this.accountRecList.length>0 ){
        this.handleSubmitDocuments();
        }
        if(this.selectedmoduleId){
        this.handleassignmentinsert()
        }else if(this.training) {
            console.log('MODULE------------------------------------');
            this.handleCreateTraining();

        }   
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
                        variant: 'Success',
                    }),
                );
                refreshApex(this.refreshTable);
                this.CreateUserflag = true;
               
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
        
        // this.fetchStaff();
        setTimeout(() => {
            this.showSpinner = false;
            refreshApex(this.refreshTable);
            this.addingPreTax();  
            
        }, 2000);
      }
      handleConfirmReset(event){
        this.userCrearedflag = true;
        this.CreateUserflag = false;
        
      }

      handlecreateuser(event) {
        this.CreateUserflag = false;
        createUser({
            StaffId: this.portalStaffId,
            selectedRole: this.selectedRole,
            selectedUserType: this.selectedUserType
        })
        .then(result => {
            console.log('Success: ' + JSON.stringify(result));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Account created. Check your email in 3 hours.',
                    variant: 'Success',
                })
            );
        })
        .catch(err => {
            console.error('Error: ' + JSON.stringify(err));
        });
        this.userCrearedflag = false;
        this.selectedUserType = '';
        this.selectedRole = '';
    }
    

      handleCloseModal(event){
        if (!this.portalStaffId) {
            console.error('Error: StaffId is missing!');
            return;
        }
        updatestaff({
            StaffId: this.portalStaffId,
        })
        .then(result => {
            console.log('Success: ' + JSON.stringify(result));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success!!',
                    message: 'Staff Created Successfully',
                    variant: 'success',
                })
            );
        })
        .catch(err => {
            console.error('Error: ' + JSON.stringify(err));
        });

        this.selectedUserType = '';
        this.selectedRole = '';
        this.CreateUserflag = false;
        this.userCrearedflag = false;
    }
    
    handleeditClose(){
        
        this.staffEditFlag=false;
        this.cardFlag = false;
        this.adminFlag = true;
        this.visible = true;
        this.listFlag = true;
    }
    /* handleError(event) {
        const error = event.detail;
        console.log('Error Message : ' + JSON.stringify(error));
    } */
      handleError(event) {
    event.preventDefault(); // Prevent standard error UI

    let message = 'An unknown error occurred.';

    // Check for backend validation error
    const backendErrors = event.detail?.output?.errors;
    if (backendErrors && backendErrors.length > 0) {
        message = backendErrors.map(err => err.message).join(', ');
    }
    // Fallback to top-level message
    else if (event.detail?.message) {
        message = event.detail.message;
    }

    // Show toast
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Save Failed',
            message: message,
            variant: 'error',
            
        })
    );
}

   /*  handlefacStatus(event) {
        this.showSpinner = true;
        let facId = event.currentTarget.dataset.id;
        let facstatus = event.target.dataset.name;
        let finalStatus;
        let message;
        console.log(facstatus);
        if (facstatus == 'true') {
            finalStatus = 'false';
            message = 'Staff is Inactive'
        }
        else if (facstatus == 'false') {
            finalStatus = 'true';
            message = 'Staff is Active'
        }       
        statusStaff({ IdValue: facId, status: finalStatus }).then(response => {
            this.showSpinner = false;
            this.dispatchEvent(                
                new ShowToastEvent({
                    title: '',
                    message: message,
                    variant: 'success'
                })
            );           
           // refreshApex(this.refreshTable);
           // this.fetchStaff(); 
        });
        //this.dispatchEvent(new RefreshEvent());
        //this.recordsToDisplay=[];
        this.dispatchEvent(new RefreshEvent());
        //setTimeout(this.fetchFacility(), 6000);
        this.fetchStaff();
        refreshApex(this.refreshTable);
        
    } */

        @track handleStatusFlag=false;
        @track facId;
        @track facstatus;
        @track message;
        @track originalToggleState;
        @track toggleElement; 
        @track finalstatus; 
        @track staffname;
            handlefacStatus(event){   
            this.toggleElement = event.target;
            this.handleStatusFlag=true;  
              this.facId=event.currentTarget.dataset.id;
              this.facstatus=event.target.dataset.name;
              this.staffname=event.target.dataset.staffname;
              this.originalToggleState = this.facstatus;
              
             if(this.facstatus == 'true'){
                this.finalStatus='false';
                 this.message= 'Staff is Inactive'
             }
             else if(this.facstatus == 'false'){
                this.finalStatus='true';
                this.message= 'Staff is Active'
             }
               
            }
        
    handlestatuschange() {

    statusStaff({ IdValue: this.facId, status: this.finalStatus })
        .then(response => {


            this.dispatchEvent(
                new ShowToastEvent({
                    title: '',
                    message: this.message,
                    variant: 'success'
                })
            );

            this.handleStatusFlag = false;

            refreshApex(this.wiredresult).then(() => {
                this.applyFilters(); 
            });
        })
        .catch(error => {
            this.showSpinner = false;
            console.error('Error updating status:', error);
        });
}
    handlestatusclose(){
        const element = this.template.querySelector('[data-id='+this.facId+']'); 
        console.log('original state',this.originalToggleState);
        console.log('if1 condition');
        console.log('element',JSON.stringify(element.checked));   
        if(this.originalToggleState == "true"){
            element.checked=this.originalToggleState;
            console.log('if condition');
            // this.recordsToDisplay = [];

            // this.handlesave();
        }else{
            console.log('else condition');
            element.checked=!(this.originalToggleState);
        }
        console.log('element',JSON.stringify(element.checked));  
        
        
        this.handleStatusFlag=false;  
    }
        


    
    @track listFlag=true;
    
    get cardViewClass(){
        return this.cardFlag ? 'slds-box slds-size_1-of-6 slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-6  slds-align_absolute-center'; // you can use your custom class here.
        //'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse' : 'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse'
    }

    get listViewClass(){
        return this.listFlag ? 'slds-box slds-size_1-of-6  slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-6 slds-align_absolute-center'; // you can use your custom class here.
      }

    handleChange(event) {
        this.value = event.target.dataset.name;
        if(this.value=='cardview'){
            this.cardFlag=true;
            this.listFlag=false;
        }else  if(this.value=='listview'){
            this.cardFlag=false;
            this.listFlag=true;
        }
    }

    handleChange1(event){
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        event.target.value = inputValue;
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


    handleRowActions(event){ 
        const row = event.detail.row
        this.preTaxRecId= row.Id;
        this.parentStaffId=row.Staff__c;
        const actionName = event.detail.action.name;
        switch (actionName) {
            case 'delete':
              deleteRecord(row.Id).then(() => {
                this.dispatchEvent(
                  new ShowToastEvent({
                    title: 'Success',
                    message: 'Staff Document has been deleted',
                    variant: 'success'
                  })
                );
               // refreshApex(this.invoiceTable);
               refreshApex(this.refreshTable);
               this.fetchStaff()
               this.addingPreTax();
              }).catch(error => {
                console.log('error=>'+JSON.stringify(error));
             });
            break;

        case 'edit':
            this.showPreTaxRecordEditForm=true;
        break;
        case 'view_details':
              event.preventDefault(); 
              const url = row.View_File__c;
              this.currentUrl = url;
             // console.log('file url  '+ this.currentUrl);  
              this.isModalOpen = true;
              const fileType = this.getFileType(this.currentUrl);
        
            //console.log('file type: ' + fileType);
            // Check if the file type is not PNG or PDF
            if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg') {
                setTimeout(() => {
                    this.closeModal();
                }, 1700);
                
            }  
        break;
     } 
      
    }
    
    closePreTaxRecordEditForm(event){
        this.showPreTaxRecordEditForm=false;
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
        setTimeout(() => {
            this.showSpinner = false;
            this.addingPreTax();  
        }, 2000);
            if(this.fileName.length  > 0){
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
           
             setTimeout(() => {
                
                this.addingPreTax(); 
                this.showSpinner = false; 
            }, 3000);
            this.accountRecList=[];        
    }

    handlePreTaxRecordFormSubmit(){
        this.template.querySelector('lightning-record-edit-form[data-recid="PreTaxForm"]').submit(fields);

    }


    addingPreTax(){
        console.log('Parent record Id '+this.parentStaffId );
        
        fetchStaff({recordId :this.parentStaffId }).then(response => {
            console.log('satff list after save'+JSON.stringify(response));
            this.satffDataJasonformat[response.Id]={"street":response.Address__Street__s,"city":response.Address__City__s,"stateCode":response.Address__StateCode__s,"countryCode":response.Address__CountryCode__s,"postalCode":response.Address__PostalCode__s,"childRecords":response.Child_Staffs__r,
                "preTaxvalue":response.Pre_Tax_Calculator__c,"pretaxone":response.Pre_Tax_One_Value__c,"pretaxtwo":response.Pre_Tax_Two_Value__c,"pretaxThree":response.Pre_Tax_Three_Value__c,"pretaxFour":response.Pre_Tax_Four_Value__c,"pretaxFive":response.Pre_Tax_Five_Value__c,
                "postTax":response.Post_Tax__c,"primaryVal":response.Make_Primary_as_Approver__c,"secondaryVal":response.Make_Secondary_as_Approver__c,"voluntaryContribution":response.Voluntary_Contribution__c,"ContributionCurrency":response.Voluntary_Contribution_Fixed__c,"ContributionPercent":response.Voluntary_Contribution_Percent__c,
                 "status":response.Status__c};
           let childRec= response.Child_Staffs__r;
           this.DocumentTableData=[];
           childRec.forEach(rec=>{
            if(rec.Type__c ){
                this.DocumentTableData.push(rec)
            }
           });
        }); 
    }
   
    ShowDocumentSection(event){
        this.showStaffDocumentSection= true;
        this.parentStaffId=event.currentTarget.dataset.id; 
        console.log('parent Id=>'+this.parentStaffId);

    }
    closeDocumentSection(){
        this.showStaffDocumentSection= false;
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
                        console.log('file data=>' + JSON.stringify(this.accountRecList));
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
        this.showSpinner = true;
        this.accountRecList.forEach(item => {
            this.staffDocumentMap[item.fileName] = item.base64Data;
        });
        console.log('staffMap=>' + JSON.stringify(this.staffDocumentMap));
        insertPreTax({JsonString: JSON.stringify(this.accountRecList),staffID: this.parentStaffId,isPretax: false
        }).then(result => {
            console.log('document result' + JSON.stringify(result));
            result.forEach(item => {
                let base64Data = this.staffDocumentMap[item.File_Name__c]; 
                console.log('base64' + base64Data)
                uploadFile({base64:base64Data,filename: item.File_Name__c,recordId: item.Id,obj: 'ChildStaff'}).then(result => {
                    console.log('Upload result = ' + result);
                    //this.fileName = this.fileName + ' - Uploaded Successfully';
                    
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success!!',
                            message: item.File_Name__c + ' - Uploaded Successfully!!!',
                            variant: 'success',
                        }),
                    );
                    this.showSpinner = false;
                    this.accountRecList=[];
                    this.staffEditFlag=false;
                    
                    refreshApex(this.refreshTable)
                   // this.fetchStaff();
                   /* if(result == null){
                    this.addingPreTax();  
                   } */
                   
                }).catch(error => {
                    //console.error(error);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error in uploading File. Please Provide All Details',
                            message: error.message,
                            variant: 'error',
                        }),
                    );
                    this.showSpinner = false;
                });
               
            })
            this.showStaffDocumentSection=false;
            this.showPreTaxRecordEditForm=false;
            //this.staffEditFlag=true;
        }).catch(error => {
           
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error in uploading File. Please Provide All Details',
                    message: error.message,
                    variant: 'error',
                }),
            );
            console.error('error' + JSON.stringify(error));
            this.showSpinner = false;
            this.showStaffDocumentSection=false;
            this.showPreTaxRecordEditForm=false;
            this.staffEditFlag=false;
        });
      /*   setTimeout(() => {
            this.addingPreTax();  
        }, 10000);
           */
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
           
        }
        if(event.target.value=='Percentage'){
            this.VoluntaryContributionPercent=true;
            this.VoluntaryContributionCurrency=false;
        }
        if(event.target.name=='contributionFixed'){
            this.voluntaryContributionCureencyVal=event.target.value;
        }
        if(event.target.name=='contributionPercent'){
            this.voluntaryContributionPercentVal=event.target.value;
        }
        console.log( this.voluntaryContributionPercentVal);
    }

    @track isModalOpen = false;
    @track currentUrl;

    

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
    @track ictUserType=false;
    typeOfUserChnage(event){
        if(event.detail.value=='ICT User'){
            this.ictUserType=true;
        }else{
            this.ictUserType=false;
        }

    }
    @track categoryType;
    @track jobType;
    @track classificationLevel;
    @track classificationPaytype;
    @track genralHourlyRate=0;
    @track sturdayHourlyRat=0;
    @track sundayhourlyRate=0;
    @track publicHolidayRate=0;
    @track afterNoonShiftRate=0;
    @track nightShiftRate=0;
    @track isFixedcategory=false;
    @track createdShiftRole;
    @track includeSuperannuation = false;
    @track superannuationValue;
    @track paidBreak=true;
    @track orginalData=[];

    employmentTypeChange(event){ 
       if(event.target.name=='fixedcategoryType'){
           if(event.target.value==true){
                this.isFixedcategory=false;
                this.includeSuperannuation = false;
                this.superannuationValue = 'Include Superannuation';
                this.paidBreak=true;
                console.log('onchange event : '+this.superannuationValue);
           }else{
                this.isFixedcategory=true;
                this.paidBreak=false;
                this.includeSuperannuation = true;
                this.superannuationValue = 'Exclude Superannuation';
                console.log('onchange event : '+this.superannuationValue);
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
            this.classificationPaytype=event.target.value;    
        }

        if( this.categoryType !=null &&  this.jobType !=null &&  this.classificationLevel !=null &&  this.classificationPaytype !=null){ 
            console.log(' categoryType ' + this.categoryType);
            console.log(' jobType ' + this.jobType);
            console.log(' classificationType ' + this.classificationLevel);
            console.log(' classificationPayType ' + this.classificationPaytype);

            getShadAwards({categoryType:this.categoryType,jobType:this.jobType,classificationType :this.classificationLevel,classificationPayType:this.classificationPaytype }).then(result=>{

                console.log('Shad awards list '+JSON.stringify(result));
                if(result.length>0){
                    this.genralHourlyRate=result[0].General_Hourly_pay_rate__c;
                    this.nightShiftRate=result[0].Night_shift_Hourly_Rate__c;
                    this.publicHolidayRate=result[0].Public_holiday_Hourly_Rate__c;
                    this.sturdayHourlyRate=result[0].Saturday_Hourly_Rate__c;
                    this.afterNoonShiftRate=result[0].Afternoon_shift_Hourly_Rate__c;
                    this.sundayhourlyRate=result[0].Sunday_Hourly_Rate__c;
                }else{
                    this.genralHourlyRate=0;
                    this.nightShiftRate=0;
                    this.publicHolidayRate=0;
                    this.sturdayHourlyRate=0;
                    this.afterNoonShiftRate=0;
                    this.sundayhourlyRate=0;
                }
               
            });
        }  

    }
    handleRoleChange(event){
        this.createdShiftRole = '';

        event.target.value.forEach(rec => {
            this.createdShiftRole += rec + ';';
        });
        // Remove the trailing semicolon
        if (this.createdShiftRole.endsWith(';')) {
            this.createdShiftRole = this.createdShiftRole.slice(0, -1);
        }

        console.log('staff roles ' + this.createdShiftRole);

    }
    handleGeoLocationStatus(event){
        this.geoLocationStatus=event.target.checked;
        console.log('geo location '+this.geoLocationStatus);
    }
    /*  @track currentStep = 'step1';  */
    handleCreateIssue(event){           
       // this.headeringName = 'New Issue';
        this.staffEditFlag=true;
        this.recordId = '';
        this.fileName = '';
        this.buttonName = 'Save';
        this.issueparent=false;
        this.currentStep ='step1';
        this.parentStaffId = '';
        this.selectedmoduleId = '';
        
        
        
    }
    get isStep1() {
        return this.currentStep === 'step1';
    }

    get isStep2() {
        return this.currentStep === 'step2';
    }

    get isStep3() {
        return this.currentStep === 'step3';
    }

    get isStep4() {
        return this.currentStep === 'step4';
    }
  handlecreatetraining(){
    this.CoursesFlag=false;
    this.selectedmoduleId = '';
  }
  
@track searchName = '';
@track activeFilterOn = false;
@track inactiveFilterOn = false;


handleSearchInput(event) {
    this.searchName = event.target.value;
    this.applyFilters();
}

handleActiveToggle() {
    this.activeFilterOn = !this.activeFilterOn;
    if (this.activeFilterOn) this.inactiveFilterOn = false;
    this.applyFilters();
}

handleInactiveToggle() {
    this.inactiveFilterOn = !this.inactiveFilterOn;
    if (this.inactiveFilterOn) this.activeFilterOn = false;
    this.applyFilters();
}
applyFilters() {
    console.log('applyfilter triggered ');
    let result = [...this.orginalData];

    // Name filter using NameToDisplay__c
    if (this.searchName && this.searchName.trim() !== '') {
        const searchLower = this.searchName.toLowerCase();
        result = result.filter(staff => {
            const nameField = staff.NameToDisplay__c || '';
            return nameField.toLowerCase().includes(searchLower);
        });
    }

    // Status filter
    if (this.activeFilterOn && !this.inactiveFilterOn) {
        result = result.filter(staff => staff.Status__c === true || staff.Status__c === 'true');
    } else if (this.inactiveFilterOn && !this.activeFilterOn) {
        result = result.filter(staff => staff.Status__c === false || staff.Status__c === 'false');
    }

    this.records = result;
    this.filteredRecords = [...result];
    this.pageNumber = 1; // Reset to page 1 on new filter
    this.totalRecords = result.length;
    this.paginationHelper();
}



get activeButtonClass() {
    return this.activeFilterOn ? 'active-button' : '';
}

get inactiveButtonClass() {
    return this.inactiveFilterOn ? 'active-button' : '';
}

get viewToggleIcon() {
    return this.cardFlag ? 'list' : 'cards';
}

get viewToggleTitle() {
    return this.cardFlag ? 'Switch to List View' : 'Switch to Card View';
}

// Used for data-name on the button to inform handleChange()
get viewToggleTarget() {
    return this.cardFlag ? 'listview' : 'cardview';
}

    get recordsWithToggleStyle() {
    return this.recordsToDisplay.map((fac) => {
        const isActive = fac.Status__c === true || fac.Status__c === 'true';
        return {
            ...fac,
            toggleTrackClass: isActive ? 'toggle-track active' : 'toggle-track',
            toggleKnobClass: isActive ? 'toggle-knob active' : 'toggle-knob',
            toggleLabelClass: isActive ? 'toggle-label active' : 'toggle-label inactive',
            toggleLabel: isActive ? 'Active' : 'Inactive'
        };
    });
}
        
}