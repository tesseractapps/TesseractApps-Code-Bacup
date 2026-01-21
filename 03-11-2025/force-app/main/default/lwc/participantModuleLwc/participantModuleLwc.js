import {LightningElement,track,wire,api} from 'lwc';
import fetchFacilitiess from '@salesforce/apex/ClientSearchController.fetchFacilitiess';
import statusClient from '@salesforce/apex/ClientSearchController.statusClient';
import { NavigationMixin } from 'lightning/navigation';
import {refreshApex} from '@salesforce/apex';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import My_Resource from "@salesforce/resourceUrl/myResource";
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getStaffData from '@salesforce/apex/ClientDataController.getStaffData';     //Manimala added 15-17
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails'; 
import insertStaffRecords from '@salesforce/apex/ClientDataController.insertStaffRecords';
import getCurrentLoggedUserInfo from '@salesforce/apex/UserAccessController.getCurrentLoggedUserInfo';
import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import getstaffId from '@salesforce/apex/UserAccessController.getstaffId';
import getStaffMembers from '@salesforce/apex/PreferredStaffController.getStaffMembers';
import getRoles from '@salesforce/apex/PreferredStaffController.getRoles';     
import updateStaffAssignments from '@salesforce/apex/ClientDataController.updateStaffAssignments';
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';

const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

export default class ParticipantModuleLwc extends LightningElement {
   // client records are displyed card view by default
   value = 'cardview';
    
   Search = My_Resource+'/myResource/images/Participants.svg';
   @api userId = USER_ID;
   // JS Properties
   @track  availablePatients=[];
   @api recordId;
   @api participantdetails;
   @api riskindexdetails;
   subscription = {};
   CHANNEL_NAME = '/event/RefreshDataTable__e'; 
   records = []; //All records available in the data table
   records1 = []; //All records available in the data table
   columns = []; //columns information available in the data table
   totalRecords = 0; //Total no.of records
   pageSize; //No.of records to be displayed per page
   totalPages; //Total no.of pages
   pageNumber = 1; //Page number    
   recordsToDisplay = []; //Records to be displayed on the page
   @track refreshTable=[];
   @track recordsToDisplay=[];
   @track searchKey;
   @track cardFlag=true;
   @track listFlag=false;
   @track isDetails=false;
   @track isHome=true;
   @track noRecordsFlag=false;

   currentPageReference = null; 
   urlStateParameters = null;
   @api selectedName='';
   @api facilityButton;
   @track orgNam='';
   selectedfields =[];
   @track visible=false;
   @track name;
   @track currentUserRole;
   @track error;
   @track inputValue;
   isLoading=true;
   @track ParticpantRecordForm;
   
   @track participantJson = {};
   @track orgId;
   @track lastName='';
   @track firstName='';
   @track fullName;
   @track errorMessage = '';
   @track saveButtonDisable = false;
   @track street;
   @track city;
   @track country;
   @track province;
   @track postalcode;
   @track headerName;
   @track buttonLabel;
   @track ndisFlag;
   @track ndisCreateFlag = false;
   @track nonndisFlag = false;
   @track individualFlag = false;
   @track CompanyFlag = false;
   @track ParticipantType;

   @track isExec=false;
   @track isManager=false;
   @track isStaff=false;
   @track showSpinner = false;
   @track statusFlag = false; 
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
   @track OrgNisationRoles=[];      //Manimala added 96-104      
   @track facilityId = ''; 
   @track staffOptions = [];
   @track staffName = []; // For selected staff
   @track role = '';
   @track staffName;
   @track staffRecID; 
   @track roleStaffFlag=false; 
   @track headeringName;  
   @track addStaffDisable = true;
   @track orginalData=[];
   @track fieldErrorMap = {};
   @track serializedPayload;
   @track close = 'Edit';
   @track facilityPreferredName;
   @track participantPreferredName;
  
  
    // Icons for the toggle buttons
    @track sectionFlags = {
        PartcipantDetails: true,
        Addressdetails: false,
        IdentificationDetails: false,
        InsuranceDetails: false,
        PrimaryContactDetails: false,
        SecondaryContactDetails: false,       
    };

     @track sectionIcons = {
        PartcipantDetails: '\u2B9F', 
        Addressdetails: '\u2B9C',
        IdentificationDetails: '\u2B9C',
        InsuranceDetails: '\u2B9C',
        PrimaryContactDetails: '\u2B9C',
        SecondaryContactDetails: '\u2B9C',   
    };
        @track facilityOptions=[];
        @track userFacilities=[];
        @track finalListFacilities=[];
        @track facilityCheckboxOptions=[];
    
    facilityTypeOptions = [
        { label: 'Individual', value: 'Individual' },
        { label: 'Company', value: 'Company' }
    ];

      @api
    opendetailslwc(ParticipantId) {
        console.log('StaffDataCommunity: Opening CreateEditStaff with ID', ParticipantId);
        this.recordId=ParticipantId;
        this.isDetails=true;

        // ✅ Call the method on the super-child
        const participantEdit = this.template.querySelector('c-details-lwc');
        if (participantEdit) {
            participantEdit.showFundtracker(ParticipantId);
        }
    }


handleFormsClick() {
    this.dispatchEvent(new CustomEvent('openforms'));
}

    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute

        // Toggle the flag and update the icon dynamically
        // this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
        // this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
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

    handleChange1(event){
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        event.target.value = inputValue;
    }

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
       console.log('message >>', message);
     
    // 4. Show all errors as a toast
    this.dispatchEvent(
        new ShowToastEvent({
            title: 'Update Failed',
            message: message,
            variant: 'error',
           
        })
    );
}
   
   @wire(getRecord, {
       recordId: USER_ID,
       fields: [NAME_FIELD,UsrRoleName]
   }) wireuser({
       error,
       data
   }) {
       if (error) {
           this.error = error;
       } else if (data) {
           this.name = data.fields.Name.value;
           this.currentUserRole =data.fields.User_Role__c.value;
           console.log('CUrrent Role>'+this.currentUserRole);
           if( this.currentUserRole == 'Portal Account Partner Executive' || this.currentUserRole == 'CEO' || this.currentUserRole == 'Admin' ){
               this.isExec=true;
               this.isManager=false;
               this.isStaff=false;
               this.statusFlag = true;
               this.isStatusTrue = false;
               console.log('Org Data>>'+this.statusFlag);
               console.log('org Status'+this.isStatusTrue);
           }
           if(this.currentUserRole == 'Portal Account Partner Manager'){
               this.isExec=false;
               this.isManager=true;
               this.isStaff=false;
               this.statusFlag = true;
               this.isStatusTrue = false;
           }
           if(this.currentUserRole == 'Portal Account Partner User'){
               this.isExec=false;
               this.isManager=false;
               this.isStaff=true;
               this.statusFlag = false;
               this.isStatusTrue = true;
               console.log('Staff Status'+this.isStatusTrue);
               console.log('Staff Data>>'+this.statusFlag);
           }             
       }

       console.log('this.isStaff  >>', this.isStaff);
   } 
  
   
   get bDisableFirst() {
       return this.pageNumber == 1;
   }
   get bDisableLast() {
       return this.pageNumber == this.totalPages;
   }
   // connectedCallback method called when the element is inserted into a document
   connectedCallback() { 
   
      // this.disableRightClick();
      // this.disableShortcuts(); 
          this.setPageSizeByZoomAndScreen(); // Initial setup
          this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
          this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";

        // Add responsive listener
        window.addEventListener('resize', this.handleResize.bind(this));
        this._handleOutsideFacilityClick = this.handleOutsideFacilityClick.bind(this); // ✅ bind once
        window.addEventListener('click', this._handleOutsideFacilityClick);

       //Platform Event 
       subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
           this.subscription = response;
       });
       onError(error => {
           
       }); 
       //Manimala added 165-174
       organizationDetails().then(response => {
           console.log("working", JSON.stringify(response));
           let orgRoles= response.listofPriceBook.Roles__c;
           this.state =response.listofPriceBook.Address_Latest__StateCode__s;
           //this.facilityPreferredName = response.listofPriceBook.Facility_Preferred_Name_Formula__c;
           //console.log("facilityPreferredName==>", response.listofPriceBook.Facility_Preferred_Name_Formula__c);
           //this.participantPreferredName = response.listofPriceBook.Participant_Preferred_Name_Formula__c;
           
            console.log('state:', response.listofPriceBook.Address_Latest__StateCode__s);
           //console.log('listofPriceBook:', response.listofPriceBook);
           this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
             return {
             value: rec,
             label: rec
             };
           });
       }) ;
       this.isHome=true;
       console.log(' risk deatils from dashboard  '+JSON.stringify(this.riskindexdetails));
      console.log('this.riskindexdetails.length '+this.riskindexdetails.length )
       if((this.riskindexdetails.naviagte !=null || this.riskindexdetails.naviagte != undefined || this.riskindexdetails.naviagte !='')&&this.riskindexdetails.naviagte=='riskmanagement'){
                this.recordId=this.riskindexdetails.participantId;
                this.ndisFlag = this.riskindexdetails.ndisFlag || false;
                this.editstaffflag = true;
                this.isDetails=false;
                this.isHome = false;
       }
        if(this.participantdetails && Object.keys(this.participantdetails).length > 0){
        this.recordId=this.participantdetails.id;
        this.editstaffflag = true;
        this.isDetails=false;
        this.isHome = false;
        this.ndisFlag = (this.participantdetails.service === 'NDIS');
            if (!this.ndisFlag) {
            // Only check ParticipantType when NDIS is false
           

            // Set flags based on participant type
            this.individualFlag = (this.participantdetails.type === 'Individual');
            this.companyFlag = (this.participantdetails.type === 'Company');
             this.ndisCreateFlag=false;
        } else {
            // If NDIS is true, all others false
            this.individualFlag = false;
            this.companyFlag = false;
            this.ndisCreateFlag=true;
        }

       }
        //refreshApex(this.refreshTable); 
        // const storedclientId = localStorage.getItem('clientRecordId');
        // console.log('storedclientId from localStorage:', storedclientId);
        //   console.log('participantJson in connected callback :', JSON.stringify(this.participantJson));
        // if (storedclientId && this.participantJson?.[storedclientId]) {
        //       console.log('storedclientId from localStorage inside if :', storedclientId); 
        //     const json = this.participantJson[storedclientId];
        //      console.log('participantJson found for storedclientId:', json);
        //     this.loadFacilityClientData(storedclientId, json.name, json.typeofservice, json.participanttype);
        // } else {
        //     if (!storedclientId) {
        //         console.log('No storedclientId found in localStorage.');
        //     } else if (!this.participantJson?.[storedclientId]) {
        //         console.log(`No participantJson data found for storedclientId: ${storedclientId}`);
        //     }
        // }
   }

   disableRightClick() {
       document.addEventListener('contextmenu', function(e) {
           e.preventDefault();
       });
   }

   disableShortcuts() {
       document.addEventListener('keydown', function(e) {
           // Prevent F12 (Inspect), Ctrl+Shift+I (Inspect), Ctrl+Shift+C (Element picker), and Ctrl+Shift+J (Console)
           if (
               e.key === 'F12' ||
               (e.ctrlKey && e.shiftKey && e.key === 'I') ||
               (e.ctrlKey && e.shiftKey && e.key === 'C') ||
               (e.ctrlKey && e.shiftKey && e.key === 'J') ||
               (e.ctrlKey && e.shiftKey && e.key === 'K')
           ) {
               e.preventDefault();
           }
       });
   }

   filterState = 'All';
   @track filteredRecords = [];
   @track participantlabel='All';
   handleToggleparticipant() {
       if (this.filterState === 'All') {
           this.filterState = 'Active';
       } else if (this.filterState === 'Active') {
           this.filterState = 'Inactive';
       } else {
           this.filterState = 'All';
       }
       console.log('total records'+JSON.stringify(this.refreshTable));
       if (this.filterState === 'Active') {
           this.participantlabel='Active';
           this.filteredRecords = this.records1.filter(record => record.Status__c === true );
           
       } else if (this.filterState === 'Inactive') {
            this.participantlabel='Inactive';
           this.filteredRecords = this.records1.filter(record => record.Status__c === false );
       } else {
           this.participantlabel='All'
           this.filteredRecords = [...this.records1]; 
       }
   
       this.records = this.filteredRecords;
       this.totalRecords = this.filteredRecords.length;
       console.log('total records'+this.totalRecords);
       this.paginationHelper();
   }


   // Manimala added 177-188
   handleFacilityChange(event) {     
       //  console.log('facility onchange '+(event.target)) ;     
       this.ParticipantType='';            
       this.facilityId = event.target.value; // Capture Facility ID
       if (this.facilityId) {
            // Call Apex to get facility details
            getfacilityById({ facId: this.facilityId })
                .then(result => {
                    console.log('Facility Record:', result);
                   if (result.Type_of_Service__c === 'NDIS') {
                    this.ndisCreateFlag = true;
                    this.nonndisFlag = false;
                    this.CompanyFlag = false;
                    this.individualFlag = false;
                } else {
                    this.ndisCreateFlag = false;
                    this.nonndisFlag = true;
                    this.CompanyFlag = false;
                    this.individualFlag = false;
                }

                console.log('NDIS Flag:', this.ndisCreateFlag);
                console.log('Non-NDIS Flag:', this.nonndisFlag);

                   
                })
                .catch(error => {
                    console.error('Error fetching facility:', error);
                });
        }
       this.getStaffValues(); // Fetch staff based on the new facility
       console.log('Selected facility >> ' + this.facilityId);
       this.addStaffDisable = !this.facilityId;
   } 
    
   handleParticipantType(event) {
        const facilityType = event.target.value;
        this.ParticipantType=facilityType;

        if (facilityType === 'Individual') {
            this.individualFlag = true;
            this.CompanyFlag = false;
            this.ndisCreateFlag= false;
        } else {
            this.CompanyFlag = true;
            this.individualFlag = false;
            this.ndisCreateFlag= false;
           
        }

        console.log('Individual Flag:', this.individualFlag);
        console.log('ParticipantType:', this.ParticipantType);
       
    }

   handleChangeRole(event) {
       console.log('onchange '+JSON.stringify(event.detail));
       this.role = event.detail.value; // Handle combobox value change
       console.log('Selected Role >> ' + this.role);
       this.getStaffValues(); 
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
          
       });
       console.log('disconnected call back '+ this.editstaffflag);
       this.riskindexdetails={};
       this.editstaffflag=false;
       window.removeEventListener('resize', this.handleResize.bind(this));
      window.removeEventListener('click', this._handleOutsideFacilityClick);

   }
   // clients records are displayed based on flag start
   get options() {
       return [
           { label: 'Card View', value: 'cardview' },
           { label: 'List View', value: 'listview' },
       ];
   }

   handleChange(event) {
       this.value = event.target.dataset.name;
       if(this.value=='cardview'){
           this.showSpinner= true;
           this.cardFlag=true;
           this.listFlag=false;
           this.showSpinner= false;
       }else  if(this.value=='listview'){
           this.showSpinner= true;
           this.cardFlag=false;
           this.listFlag=true;
           this.showSpinner=false;
       }
   }

   @track isStatusTrue =false;
   // clients records are displayed based on flag end
   @wire( fetchFacilitiess,{recordId : '$selectedName', isTrue : '$isStatusTrue'} )  recordsToDisplay( result) {  
    console.log('result for participant in fetchFacilitiess >>',JSON.stringify(result));
       this.refreshTable= result;
       console.log('refreshTable for participant in fetchFacilitiess >>',JSON.stringify(this.refreshTable));
       let finalData=[];
       if (result.data) {
           this.records = result.data;
           finalData = result.data;
           if (Array.isArray(this.records)) {
               this.records.forEach(item => {
                    let firstName = item.First_Name__c || '';
                    let lastName = item.Last_Name__c || '';
                    
                   this.participantJson[item.Id] = {
                       "street": item.Address__Street__s,
                       "city": item.Address__City__s,
                       "stateCode": item.Address__StateCode__s,
                       "countryCode": item.Address__CountryCode__s,
                       "postalCode": item.Address__PostalCode__s,
                       "status": item.Status__c,
                       "orgId":item.Facility__r.Organisation__c,
                       
                       "lastName":lastName,
                       "firstName":firstName,
                       //"name": `${firstName} ${lastName}`.trim(),
                       "name": (`${firstName || ''} ${lastName || ''}`.trim()) || item.Company__c,
                       "typeofservice":item.Facility__r.Type_of_Service__c,
                       "participanttype":item.ParticipantType__c
                   };
               });
              // this.noRecordsFlag=true;
           }else{
               //this.noRecordsFlag=false;
           }
            const storedFacilityId = localStorage.getItem('defaultFacilityId');
            const storedFacilityLabel = localStorage.getItem('defaultFacilityLabel');
            console.log('storedFacilityId'+storedFacilityId);
            console.log('storedFacilityLabel'+storedFacilityLabel);
            
               getCurrentLoggedUserInfo().then(userData=>{
                            let userType=userData.User_Type__c;   
                        console.log('user data ==>'+JSON.stringify(userData));
                           getFacilityData().then(facresponse => {
                                                console.log('Facility data fetched successfully:', facresponse);
                                                this.finalListFacilities=[];
                                                this.selectedFacilities=[];
                                                this.facilityOptions = facresponse.map(record => ({
                                                    label: record.Name,
                                                    value: record.Id
                                                }));
                    if( userType =='NDIS Org Admin' || userType == 'ICT Admin'){
                        this.finalListFacilities= this.facilityOptions ;
                        this.facilityCheckboxOptions = this.facilityOptions
                        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(option => {
                                    return {
                                    ...option,
                                    checked: option.value === storedFacilityId
                                    };
                        });

                        // 2. Set as selected bubble
                        this.selectedFacilities = [{
                                label: storedFacilityLabel,
                                value: storedFacilityId
                        }];
                             console.log('Fetch Participant123>>>'+ JSON.stringify(result));
                             //finalData =result.data;
                            this.records =finalData ;
                            
                            this.orginalData=finalData;
                            console.log('Fetch Participant finalData>>>'+ JSON.stringify(finalData));
                            this.totalRecords = finalData.length; // update total records count                 
                            this.pageSize = 12;
                            if(this.totalRecords>6){
                            this.visible=true;
                            }
                            this.setPageSizeByZoomAndScreen();   
                            this.applyFilters(); 
                           // this.paginationHelper(); // call helper menthod to update pagination logic           
                            this.ParticpantRecordForm=false;
                            this.showSpinner = false;
                          }else if(userType =='Facility Admin' || userType =='HR Admin' || userType =='Roster Manager'){
                             getFacilityCurrentUser().then(result => {
                                                console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                                   this.facilityCheckboxOptions =  result.map(record => ({
                                                                                                            label: record.Facility__r.Name,
                                                                                                            value: record.Facility__r.Id
                                                                                                }));
                                                         this.finalListFacilities= this.facilityCheckboxOptions ;                                       

                                                                                                let facilityIds = this.facilityCheckboxOptions.map(f => f.value);
                            
                                  console.log('facilityIds  '+JSON.stringify(facilityIds))
                                const filteredData = finalData.filter(rec =>
                                    facilityIds.includes(rec.Facility__c)
                                );
                                this.facilityCheckboxOptions =  this.facilityCheckboxOptions
                                        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(option => {
                                        return {
                                        ...option,
                                        checked: option.value === storedFacilityId
                                        };
                                });

                                // 2. Set as selected bubble
                                this.selectedFacilities = [{
                                        label: storedFacilityLabel,
                                        value: storedFacilityId
                                }];

                                this.records =filteredData ;
                                  this.orginalData=filteredData;
                                console.log('Fetch Participant filteredData>>>'+ JSON.stringify(filteredData));
                                 console.log('Fetch Participant filteredData length >>>'+filteredData.length);
                                this.totalRecords = filteredData.length; // update total records count                 
                                this.pageSize = 12;
                                if(this.totalRecords>6){
                                this.visible=true;
                                }
                                this.setPageSizeByZoomAndScreen();   
                                this.applyFilters(); 
                               // this.paginationHelper(); // call helper menthod to update pagination logic           
                                this.ParticpantRecordForm=false;
                                this.showSpinner = false;
                             })
                    
                                
                          } else if (userType === 'NDIS Staff' || userType === 'ICT Staff') {
                                getstaffId({ userId: this.userId })
                                    .then(staffresult => {
                                        console.log('NDIS/ICT Staff facility result >>', staffresult);

                                        if (staffresult && staffresult.Facility__c && staffresult.Facility__r?.Name) {
                                            let facilityValue = staffresult.Facility__c;
                                            let facilityLabel = staffresult.Facility__r.Name;
                                            this.finalListFacilities = [{
                                                label: facilityLabel,
                                                value: facilityValue
                                            }];

                                            //localStorage.setItem('defaultFacilityId', this.facilityValue);
                                            //localStorage.setItem('defaultFacilityLabel', this.facilityLabel);

                                            console.log('NDIS/ICT Staff facility from Apex:', JSON.stringify(this.finalListFacilities));
                                            // 2. Set as selected bubble
                                            this.selectedFacilities = [{
                                                    label: storedFacilityLabel,
                                                    value: storedFacilityId
                                            }];
                                                console.log('Fetch Participant>>>'+ JSON.stringify(result));
                                                //finalData =result.data;
                                                this.records =finalData ;
                                                
                                                this.orginalData=finalData;
                                                console.log('Fetch Participant finalData>>>'+ JSON.stringify(finalData));
                                                this.totalRecords = finalData.length; // update total records count                 
                                                this.pageSize = 12;
                                                if(this.totalRecords>6){
                                                this.visible=true;
                                                }
                                                this.applyFilters(); 
                                            // this.paginationHelper(); // call helper menthod to update pagination logic           
                                                this.ParticpantRecordForm=false;
                                                this.showSpinner = false;
                                        }
                                    })
                                    .catch(error => {
                                        this.error = error;
                                        this.finalListFacilities = [];
                                        console.error('Error fetching staff data for NDIS/ICT Staff:', error);
                                    });
                            }

                })
                        
                        
             })

          /*  this.records1=result.data;
           this.totalRecords = result.data.length; // update total records count                 
           if(this.totalRecords>6){
               this.visible=true;
           }
           this.paginationHelper(); // call helper menthod to update pagination logic 
           this.isLoading=false; */
       }
        // const storedclientId = localStorage.getItem('clientRecordId');
        // console.log('storedclientId from localStorage:', storedclientId);
        //   console.log('participantJson in connected callback :', JSON.stringify(this.participantJson));
        // if (storedclientId && this.participantJson?.[storedclientId]) {
        //       console.log('storedclientId from localStorage inside if :', storedclientId); 
        //     const json = this.participantJson[storedclientId];
        //      console.log('participantJson found for storedclientId:', json);
        //     this.loadFacilityClientData(storedclientId, json.name, json.typeofservice, json.participanttype);
        // } else {
        //     if (!storedclientId) {
        //         console.log('No storedclientId found in localStorage.');
        //     } else if (!this.participantJson?.[storedclientId]) {
        //         console.log(`No participantJson data found for storedclientId: ${storedclientId}`);
        //     }
        // }
        const storedclientId = localStorage.getItem('clientRecordId');
        console.log('storedclientId from localStorage:', storedclientId);
          console.log('participantJson in connected callback :', JSON.stringify(this.participantJson));
        if (storedclientId && this.participantJson?.[storedclientId]) {
              console.log('storedclientId from localStorage inside if :', storedclientId); 
            const json = this.participantJson[storedclientId];
             console.log('participantJson found for storedclientId:', json);
             if ( this.riskindexdetails && this.riskindexdetails.naviagte === 'riskmanagement' ) {
                console.log('✅ Post-wire: Navigation from Risk Management');
                this.ndisFlag = this.riskindexdetails.ndisFlag || false;
                console.log(' this.ndisFlag in  risk',  this.ndisFlag);
                //this.loadFacilityClientData( storedclientId,json.name,json.typeofservice,json.participanttype);
            } else {
                console.log('✅ Post-wire: Normal participant navigation');
               // this.loadFacilityClientData( storedclientId,json.name,json.typeofservice,json.participanttype);
            }
            this.loadFacilityClientData(storedclientId, json.name, json.typeofservice, json.participanttype);
        } else {
            if (!storedclientId) {
                console.log('No storedclientId found in localStorage.');
            } else if (!this.participantJson?.[storedclientId]) {
                console.log(`No participantJson data found for storedclientId: ${storedclientId}`);
            }
        }
   }

   handleClear() {
       this.inputValue = '';
       fetchFacilitiess({recordId : '', isTrue : this.isStatusTrue}).then(response=>{
           this.records = response;
           this.records1=response;
           this.totalRecords = response.length; // update total records count                 
           this.pageSize = 12;
           if(this.totalRecords>6){
               this.visible=true;
           }
           this.paginationHelper();

       });    

   }    

   handleSearch( event ) {
       this.inputValue=event.target.value;
      const searchKey = event.target.value.toLowerCase();
      this.availablePatients = this.records;
       if ( searchKey ) {
          if ( this.availablePatients ) {
               let recs = [];
               for ( let rec of this.availablePatients ) {
                   let valuesArray = Object.values( rec );
                       for ( let val of valuesArray ) {
                           let strVal = String( val );
                               if ( strVal ) {
                                   if ( strVal.toLowerCase().includes( searchKey ) ) {
                                       recs.push( rec );
                                       break;
                                   }
                               }
                       }
               }
               this.availablePatients = recs;
           }
       } 
       else {
           this.availablePatients=[];
           this.availablePatients = this.records1;
       }
       this.records=this.availablePatients;
       this.totalRecords=this.availablePatients.length;
       this.pageSize = 12;
       if(this.totalRecords>6){
           this.visible=true;
       }
      this.paginationHelper(); // call helper menthod to update pagination logic 
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
       if(this.totalRecords>0) {
            this.noRecordsFlag=false;
        }else{
            this.noRecordsFlag=true;
        } 
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
       console.log('records to display In pagination : '+ JSON.stringify( this.recordsToDisplay));
      // refreshApex(this.refreshTable);         
   }

   get isDesktop() {
       //alert(FORM_FACTOR);
       return FORM_FACTOR === 'Large';
   }

   get isMobile() {
       return FORM_FACTOR === 'Small';
   }

   @track editstaffflag = false;
   @track participant;
   handleEditFacility(event){
       let facId = event.currentTarget.dataset.id;
       this.participant = event.currentTarget.dataset.name;
       const typeofservice = event.currentTarget.dataset.typeofservice;
       const ParticipantType = event.currentTarget.dataset.participanttype;
       
        console.log('handleEditFacility -> facId:', facId);
        console.log('participant:', this.participant);
        console.log('typeofservice:', typeofservice);
        console.log('ParticipantType:', ParticipantType);
        console.log('participantJson:', JSON.stringify(this.participantJson));
       this.loadFacilityClientData(facId, this.participant, typeofservice, ParticipantType);
   }
   loadFacilityClientData(facId, participant, typeofservice, ParticipantType){
        console.log('handleEditFacility -> facId in loadFacilityClientData:', facId);
        console.log('participant  in loadFacilityClientData :', participant);
        console.log('typeofservice  in loadFacilityClientData:', typeofservice);
        console.log('ParticipantType  in loadFacilityClientData:', ParticipantType);
        if (!this.participantJson || !this.participantJson[facId]) {
            console.error('Participant data not found for:', facId);
            return;
        }
         this.recordId = facId;
         this.participant = participant;
         if (!typeofservice) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'Type of Service is missing. Please update in facility.',
                variant: 'error',
                
            })
        );
            return;
        }
        this.ndisFlag = (typeofservice === 'NDIS');
            if (!this.ndisFlag) {
              console.log(' typeofservice inside !this.ndisFlag ', typeofservice);
              console.log(' this.participantPreferredName inside !this.ndisFlag ', this.participantPreferredName);
              console.log(' ParticipantType inside !this.ndisFlag ', ParticipantType);
          
            // Only check ParticipantType when NDIS is false
            if (!ParticipantType) {

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.participantPreferredName + ' type is required.',
                        variant: 'error',
                    })
                );
                return; // stop execution
            }

            // Set flags based on participant type
            this.individualFlag = (ParticipantType === 'Individual');
            this.companyFlag = (ParticipantType === 'Company');
             this.ndisCreateFlag=false;
        } else {
            // If NDIS is true, all others false
            this.individualFlag = false;
            this.companyFlag = false;
            this.ndisCreateFlag=true;
        }
        console.log( 'this.individualFlag,this.companyFlag,this.ndisCreateFlag'+this.individualFlag+ this.companyFlag + this.ndisCreateFlag)
        console.log(' typeofservice', typeofservice);
       console.log(' this.participant', this.participant);
       //this.recordId=facId;
       this.editstaffflag = true;
       this.isDetails=false;
       this.isHome = false;
       this.orgId=this.participantJson[facId]["orgId"];
       console.log('OrgId>>'+this.orgId);
       this.headerName='Update ' + this.participantPreferredName;
       this.buttonLabel='Update';
       
       this.street = this.participantJson[this.recordId]["street"];
       this.city = this.participantJson[this.recordId]["city"];
       this.country = this.participantJson[this.recordId]["countryCode"];
       this.province =this.participantJson[this.recordId]["stateCode"];
       this.postalcode = this.participantJson[this.recordId]["postalCode"];
       this.lastName = this.participantJson[this.recordId]["lastName"];
       this.firstName = this.participantJson[this.recordId]["firstName"];
       this.errorMessage = '';
       this.saveButtonDisable = false;

        localStorage.setItem('clientRecordId', this.recordId);
        console.log('clientRecordId Stored in localStorage:', this.recordId);
   
      
   }
   childevent(event){
        localStorage.removeItem('clientRecordId');
        console.log('LocalStorage cleared in parent.');
        this.editstaffflag = false;
        this.isHome =true;
        this.cardFlag =true;
        this.listFlag= false;
    }

  /*  handlefacStatus(event){
       let facId=event.currentTarget.dataset.id;
       this.showSpinner=true;
       let facstatus=event.target.dataset.name;
       let finalStatus;
       let message;
       if(facstatus == 'true'){
        finalStatus='false';
        message= 'Client is Inactive'
       }
       else if(facstatus == 'false'){
        finalStatus='true';
        message= 'Client is Active'
       }
       statusClient({IdValue:facId,status:finalStatus}).then(response => {
           this.dispatchEvent(
               new ShowToastEvent({
                   title: '',
                   message: message,
                   variant: 'success'
               })
           );  
           this.showSpinner=false; 
       });        

   } */

       @track handleStatusFlag=false;
       @track facId;
       @track facstatus;
       @track message;
       @track originalToggleState;
       @track toggleElement; 
       @track finalStatus;
       @track client;
           handlefacStatus(event){   
              // this.showSpinner = true;   
               this.toggleElement = event.target;
               this.handleStatusFlag=true;  
                this.facId=event.currentTarget.dataset.id;
                this.facstatus=event.target.dataset.name;
                this.client=event.target.dataset.client;
                this.originalToggleState = this.facstatus;
                
               if(this.facstatus == 'true'){
                  this.finalStatus='false';
                   this.message= this.participantPreferredName + ' is Inactive.'
               }
               else if(this.facstatus == 'false'){
                  this.finalStatus='true';
                  this.message= this.participantPreferredName + ' is Active.'
               }
              
           }
       
           handlestatuschange(){
               statusClient({ IdValue:this.facId, status:this.finalStatus }).then(response => {
                   //this.showSpinner= false;
                   this.dispatchEvent(
                       new ShowToastEvent({
                           title: '',
                           message: this.message,
                           variant: 'success'
                       })
                   );
                   //this.dispatchEvent(new RefreshEvent());
                   refreshApex(this.refreshTable);
                   //this.fetchParticipant();
                   
               });  
               this.handleStatusFlag=false; 
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
      

   get cardViewClass(){
       return this.cardFlag ? 'slds-box slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-align_absolute-center'; // you can use your custom class here.
   }

   get listViewClass(){
       return this.listFlag ? 'slds-box slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-align_absolute-center'; // you can use your custom class here.
   }  

   handleCreateNewFacility(){
       this.fieldErrorMap={};
       this.ParticpantRecordForm=true;
       this.ndisCreateFlag=false;
       this.nonndisFlag=false;
       this.individualFlag=false;
       this.CompanyFlag=false;
       this.recordId ='';
       this.street ='';
       this.city ='';
       this.country ='';
       this.province ='';
       this.postalcode =''; 
       this.headerName='Create New ' + this.participantPreferredName;
       this.buttonLabel='Save';
       this.errorMessage = '';
       this.saveButtonDisable = false;
       //this.isDetails = false;
       this.isHome = true;
       this.cardFlag = false;
       this.listFlag = false;
       //this.totalRecords = false;
       this.visible = false;
       this.firstName = '';
       this.lastName = '';
       this.facilityId = '';
       this.fileName = '';
       this.addStaffDisable = true;
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
       }
   }
   handleChange1(event) {
       let inputValue = event.target.value;
       inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
       event.target.value = inputValue;
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
      /*  console.log('fileName>>',this.fileName);
       console.log('file prepared');
      */
      
   } 

   handleSuccess(event) { 
       const toastEvent = new ShowToastEvent({
           title: "Success",
           message: this.participantPreferredName + " created successfully.",
           variant: "success"
       });
       this.dispatchEvent(toastEvent);
       this.roleStaffFlag=false;
       this.isHome = true;
       this.cardFlag = true;
       this.fetchParticipant(); 
       let staffRecID=event.detail.id;
       
        uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:staffRecID, obj:'client'}).then(result => {
            //  console.log('Upload result = ' +result);
                //this.fileName = this.fileName + ' - Uploaded Successfully';                 
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success!!',
                        message: this.file.name + ' - Uploaded Successfully!!!',
                        variant: 'success',
                    }),
                );
                
            })
       this.ParticpantRecordForm=false;
       refreshApex(this.refreshTable); 
      /*  fetchFacilitiess().then(response=>{
           if (Array.isArray(response)) {
               response.forEach(item => {
                   this.participantJson[item.Id] = {
                       "street": item.Address__Street__s,
                       "city": item.Address__City__s,
                       "stateCode": item.Address__StateCode__s,
                       "countryCode": item.Address__CountryCode__s,
                       "postalCode": item.Address__PostalCode__s,
                       "lastName":item.Last_Name__c,
                       "firstName":item.First_Name__c
                   };
               });
               console.log('Response>>'+JSON.stringify(this.participantJson));
           }

           this.records = response;
           this.totalRecords = response.length; // update total records count                 
           this.pageSize = 12;
           if(this.totalRecords>6){
               this.visible=true;
           }
           this.paginationHelper();
       }); */
       //Manimala added 565-581
       /* insertStaffRecords({ clientId: staffRecID,selectedStaff: this.staffName}).then(() => {
           this.participanteditflag=false;  
           this.participantflag = true; 
           this.getStaffValues();
           this.selectedRoles = this.staffName;  
       })
       .catch(error => {
       // Handle error
           console.error('Error inserting record:', error);
       }); */
       
       updateStaffAssignments({
            clientId: staffRecID,
            assignmentsJSON: this.serializedPayload
        })
        .then(() => {
            console.log('✅ Successfully updated staff assignments.');
            this.participanteditflag=false;  
            this.participantflag = true;
            this.selectedRoles = this.staffName; 
            this.getStaffValues();
            // ✅ Clear modified staff map
            this.modifiedStaffMap = {};
        })
        .catch(error => {
            console.error('❌ Error updating staff assignments:', error);
        });
   }

   handleSubmit(event){
       console.log('in submit');
         const facilityInput = this.template.querySelector('[data-id="facility"]');

   
    if (!this.facilityId) {
        facilityInput.reportValidity(); // shows “Complete this field”
        return;
    }
       event.preventDefault();// stop the form from submitting
       const fields = event.detail.fields;
       fields.Address__Street__s = this.street;
       fields.Address__City__s =  this.city;
       fields.Address__StateCode__s = this.province;
       fields.Address__CountryCode__s = 'AU';
       fields.Address__PostalCode__s = this.postalcode;
       fields.Name=this.fullName;
       fields.Status__c = this.toggleValue;
       fields.Facility__c=this.facilityId;
       fields.ParticipantType__c=this.ParticipantType;
       console.log('After fields>>'+JSON.stringify(fields));
       this.template.querySelector('lightning-record-edit-form').submit(fields);  
   }

   handleeditClose(){
       this.ParticpantRecordForm=false;
       this.cardFlag = true;
       this.visible = true;
       //this.totalRecords = true;
       this.isHome = true;
   }
   @track Company;

   handleNameChange(event){
       if(event.target.name == 'fname') {
           this.firstName = '';
           let inputValue = event.target.value;
           inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
           this.firstName =inputValue;
     
       }
       if(event.target.name == 'lname') {
           this.lastName = '';
           let inputValue = event.target.value;
           inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
           this.lastName =inputValue;
       }
       
       if((this.firstName != undefined || this.firstName != NULL) || (this.lastName != undefined || this.lastName != NULL)){
           this.fullName = this.firstName +' '+ this.lastName;
       }
       console.log('Full Name>>'+this.fullName);
   }

   handleCompanyChange(event){
       this.Company = event.detail.value;
       console.log('Company>>'+this.Company);
       this.fullName = this.Company;
   }
   

   fetchParticipant(){
       fetchFacilitiess().then(response=>{
           this.records = response;
           this.records1=response;
           this.totalRecords = response.length; // update total records count                 
           if(this.totalRecords>6){
               this.visible=true;
           }
        //    this.paginationHelper();
           this.applyFilters();
       });  
   }
   //Manimala added 634-667
   handleStaffChange(event) {
       this.staffName = event.target.value;
       console.log('Staff Name >> '+ this.staffName);
   }
   getStaffValues() {
       console.log('Selected facility >> ' + this.facilityId);
       console.log('Selected Role >> ' + this.role);
   // Call Apex method to get staff data, including which staff are already assigned to the participant
       getStaffData({ clientId: this.clientId, facilityId: this.facilityId, role: this.role}).then(response => {
           this.staffOptions = response.map(record => ({
               value: record.Id,
               label: record.Name
           }));
           console.log('Staff options: ' + JSON.stringify(this.staffOptions));

           // Find the staff already assigned to the participant and set them as selected
           this.selectedRoles = response
               .filter(record => record.isAssigned) // Assuming 'isAssigned' indicates if the staff is already selected
               .map(record => record.Id);
           
           console.log('Selected staff: ' + JSON.stringify(this.selectedRoles));
       })
       .catch(err => {
           console.error('Error fetching staff values: ', err);
       });
   }
    async  handleAddMultiUsers() {
        this.headeringName = 'Preferred Staff';
        this.close = 'Edit';
        await this.fetchStaffMembers();
    }

    @track savedSelectedRoles = [];
    handleSave(event) {
        if(this.staffName && this.staffName.length > 0){
            this.roleStaffFlag=false;
            this.errorMessage='';
            this.savedSelectedRoles = [...this.selectedRoles];
        }
        else{
            this.errorMessage='please select staff'
        }
    }
    handleEditStaffClose(){
       this.roleStaffFlag=false;
    }
    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }

    @track toggleValue = false;
    handleStatus(event) {        
        this.toggleValue = event.target.checked; 
        console.log('Toggle status:', this.toggleValue);    
    }

@track activeFilterOn = true;
@track inactiveFilterOn = false;

    handleActiveToggle() {
    if (this.activeFilterOn) {
        this.activeFilterOn = false; // turn off
    } else {
        this.activeFilterOn = true;
        this.inactiveFilterOn = false;
    }
    this.applyFilters();
}

handleInactiveToggle() {
    if (this.inactiveFilterOn) {
        this.inactiveFilterOn = false; // turn off
    } else {
        this.inactiveFilterOn = true;
        this.activeFilterOn = false;
    }
    this.applyFilters();
}

// applyFilters() {
//     let result = [...this.orginalData]; // Use original unfiltered dataset

//     if (this.firstname && this.firstname.trim() !== '') {
//         result = result.filter(item =>
//             item.First_Name__c?.toLowerCase().includes(this.firstname.toLowerCase()) ||
//             item.Last_Name__c?.toLowerCase().includes(this.firstname.toLowerCase())
//         );
//     }

//     if (this.activeFilterOn && !this.inactiveFilterOn) {
//         result = result.filter(item => item.Status__c === true);
//     } else if (this.inactiveFilterOn && !this.activeFilterOn) {
//         result = result.filter(item => item.Status__c === false);
//     }

//     this.records = [...result];
//     this.totalRecords = result.length;
//     this.pageNumber = 1;
//     this.paginationHelper();
// }

applyFilters() {
    let result = [...this.orginalData]; // Use original unfiltered dataset

    // 🔍 Name filter
    if (this.firstname && this.firstname.trim() !== '') {
        result = result.filter(item =>
            item.First_Name__c?.toLowerCase().includes(this.firstname.toLowerCase()) ||
            item.Last_Name__c?.toLowerCase().includes(this.firstname.toLowerCase())
        );
    }

    // ✅ Facility filter (multi-select)
    if (this.selectedFacilities.length > 0) {
        const selectedFacilityIds = this.selectedFacilities.map(f => f.value);
        result = result.filter(item =>
            selectedFacilityIds.includes(item.Facility__r?.Id)
        );
    }

    // ✅ Active/Inactive filter
    if (this.activeFilterOn && !this.inactiveFilterOn) {
        result = result.filter(item => item.Status__c === true);
    } else if (this.inactiveFilterOn && !this.activeFilterOn) {
        result = result.filter(item => item.Status__c === false);
    }

    // 🔄 Update filtered records
    this.records = [...result];
    this.totalRecords = result.length;
    this.pageNumber = 1;
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
    console.log('recordsToDisplay:', JSON.stringify(this.recordsToDisplay));
    return this.recordsToDisplay.map((item) => {
        const isActive = item.Status__c === true || item.Status__c === 'true';
        return {
            ...item,
            toggleTrackClass: isActive ? 'toggle-track active' : 'toggle-track',
            toggleKnobClass: isActive ? 'toggle-knob active' : 'toggle-knob',
            toggleLabelClass: isActive ? 'toggle-label active' : 'toggle-label inactive',
            toggleLabel: isActive ? 'Active' : 'Inactive'
        };
    });
}

@track selectedFacilities = [];  // array of {label, value}
@track facilitySearchTerm = '';
@track showFacilityOptions = false;



handleFacilityCheckboxChange(event) {
        const value = event.target.value;
        const label = event.target.dataset.label;

        const alreadySelected = this.selectedFacilities.find(fac => fac.value === value);

        if (event.target.checked && !alreadySelected) {
            this.selectedFacilities = [...this.selectedFacilities, { label, value }];
        } else if (!event.target.checked && alreadySelected) {
            this.selectedFacilities = this.selectedFacilities.filter(fac => fac.value !== value);
        }

        // Update checkbox state
        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(fac => {
            return { ...fac, checked: this.selectedFacilities.some(sf => sf.value === fac.value) };
        });

        this.applyFilters();
    }
handleFacilitySearchChange(event) {
    this.facilitySearchTerm = event.target.value.toLowerCase();
}
 get filteredFacilityCheckboxOptions() {
        if (!this.facilitySearchTerm) return this.facilityCheckboxOptions;
        return this.facilityCheckboxOptions.filter(option =>
            option.label.toLowerCase().includes(this.facilitySearchTerm)
        );
    }

handleHorizontalScroll(event) {
    event.preventDefault(); // Prevent vertical scroll
    const container = event.currentTarget;
    container.scrollLeft += event.deltaY; // Apply vertical delta to horizontal scroll
}
 removeFacility(event) {
        const value = event.currentTarget.dataset.id;

        this.selectedFacilities = this.selectedFacilities.filter(fac => fac.value !== value);

        // Uncheck it in the dropdown list
        this.facilityCheckboxOptions = this.facilityCheckboxOptions.map(fac => {
            return { ...fac, checked: fac.value === value ? false : fac.checked };
        });

        this.updateSearchInputLabel();
        this.applyFilters();
    }

updateSearchInputLabel() {
    const selectedLabels = this.selectedFacilities.map(f => f.label);
    this.facilitySearchTerm = ''; // You can clear the input or keep the last typed string
}


// Show/hide dropdown
showFacilityDropdown() {
    this.showFacilityOptions = true;
}
handleOutsideFacilityClick(event) {
    const container = this.template.querySelector('.facility-multiselect');
    if (container && !container.contains(event.target)) {
        this.showFacilityOptions = false;
    }
}
   stopPropagation(event) {
    event.stopPropagation();
}
   

// setPageSizeByZoomAndScreen() {
//     const zoomLevel = Math.round(window.devicePixelRatio * 100); // 100, 125, 150, etc.

//     if (zoomLevel <= 100) {
//         this.pageSize = 16;
//     } else if (zoomLevel <= 125) {
//         this.pageSize = 12;
//     } else {
//         this.pageSize = 8;
//     }
// }
setPageSizeByZoomAndScreen() {
    let zoomLevel = Math.round(window.devicePixelRatio * 100);
    const userAgent = navigator.userAgent;
    const isMac = /Mac|Macintosh/i.test(userAgent);
    const isWindows = /Windows/i.test(userAgent);
    const screenHeight = window.innerHeight;

    // ✅ Normalize Mac Retina 2x baseline (so 200% reads as 100%)
    if (isMac && zoomLevel >= 190 && zoomLevel <= 210) {
        zoomLevel = 100;
    }

    console.log('OS:', isMac ? 'Mac' : isWindows ? 'Windows' : 'Other');
    console.log('Height:', screenHeight, 'Zoom (normalized):', zoomLevel);

    // Mac logic
    if (isMac) {
        if (zoomLevel <= 180) {
            this.pageSize = 16;
        } else if (zoomLevel <= 250) {
            this.pageSize = 12;
        } else {
            this.pageSize = 8;
        }
        // Adjusted safety check:
        // Only reduce to 8 if BOTH height is small AND zoom is extreme
        if (screenHeight < 700 && zoomLevel > 250) {
            this.pageSize = 8;
        }
        console.log(`💻 Mac zoom ${zoomLevel}% → showing ${this.pageSize} cards`);
        this.visible = true;
        return;
    }

    // 🖥️ --- Windows logic ---
    if (isWindows) {
        if (zoomLevel <= 100) {
            this.pageSize = 16;
        } else if (zoomLevel <= 125) {
            this.pageSize = 12;
        } else {
            this.pageSize = 8;
        }

        if (screenHeight < 800 && this.pageSize > 12) {
            this.pageSize = 12;
        }

        console.log(`🖥️ Windows zoom ${zoomLevel}% → showing ${this.pageSize} cards`);
        this.visible = true;
        return;
    }

    // 🌍 --- Default fallback ---
    if (zoomLevel <= 110) {
        this.pageSize = 16;
    } else if (zoomLevel <= 250) {
        this.pageSize = 12;
    } else {
        this.pageSize = 8;
    }

    console.log(`🌍 Other OS zoom ${zoomLevel}% → showing ${this.pageSize} cards`);
    this.visible = true;
}
handleResize() {
    const oldSize = this.pageSize;
    this.setPageSizeByZoomAndScreen();

    if (this.pageSize !== oldSize) {
        this.paginationHelper(); // Recalculate pages if size changed
    }
}

    async fetchStaffMembers() {
        console.log('this.facilityId >>', this.facilityId);
        try {
            const result = await getStaffMembers({ facilityId: this.facilityId });
            console.log('Staff data >>', result);
            this.processStaffData(result);
            this.fetchRoles();
        } catch (error) {
            throw error;
        }
    }

    processStaffData(staffData) {
        this.staffMembers = staffData.map((staff, index) => {
            const staffMember = {
                Id: staff.Id,
                Name: staff.Display_Nickname__c,
                Email: staff.Email,
                Role__c: staff.Role__c,
                roleAssignments: {},
                rowClass: index % 2 === 0 ? 'slds-hint-parent' : 'slds-hint-parent slds-theme_shade'
            };
            return staffMember;
        });
    }

    async fetchRoles() {
        try {
            const result = await getRoles();
            console.log('Roles data >>', result);
            this.roles = result;
            this.loadAssignments();
            if(this.close != 'cancel'){
                this.roleStaffFlag = true;
            }
        } catch (error) {
            throw error;
        }
    }


    loadAssignments() {
        console.log('this.staffMembers >> ', this.staffMembers);
        console.log('this.roles >> ', this.roles);
        if (this.staffMembers.length > 0 && this.roles.length > 0) {
            this.staffMembers = this.staffMembers.map(staff => {
                const updatedStaff = { ...staff };
                updatedStaff.roleAssignments = {};
                this.roles.forEach(role => {
                    updatedStaff.roleAssignments[role] = false;
                });
                return updatedStaff;
            });
        }
    }


    processAssignments(assignmentData) {
        // Process the assignment data and update staff role assignments
        const assignmentMap = {};
        
        assignmentData.forEach(assignment => {
            if (!assignmentMap[assignment.AssigneeId]) {
                assignmentMap[assignment.AssigneeId] = {};
            }
            assignmentMap[assignment.AssigneeId][assignment.PermissionSetId] = true;
        });

        // Update staff members with their role assignments
        this.staffMembers = this.staffMembers.map(staff => {
            const updatedStaff = { ...staff };
            const staffAssignments = assignmentMap[staff.Id] || {};
            
            // Update role assignments
            Object.keys(updatedStaff.roleAssignments).forEach(roleId => {
                updatedStaff.roleAssignments[roleId] = !!staffAssignments[roleId];
            });
            
            return updatedStaff;
        });

        this.isLoading = false;
    }

    // Create flattened data structure for template iteration
    get staffRoleData() {
        const flatData = [];
        
        this.staffMembers.forEach(staff => {
            this.roles.forEach(role => {
                flatData.push({
                    staffId: staff.Id,
                    staffName: staff.Name,
                    roleId: role.Id,
                    roleName: role.Name,
                    hasRole: staff.roleAssignments && staff.roleAssignments[role.Id],
                    rowClass: staff.rowClass
                });
            });
        });
        
        return flatData;
    }

    @track searchStaff = '';              
    @track filteredStaffMembers = [];     
    @track staffMembers = [];             
    @track roles = [];  

    // Group the flat data by staff for template iteration
    get groupedStaffRoleData() {
        console.log('groupedStaffRoleData >>');
        
        const staffList = Array.isArray(this.filteredStaffMembers) && this.searchStaff
                            ? this.filteredStaffMembers
                            : this.staffMembers;

        if (!staffList || !this.roles || this.roles.length === 0) {
            console.log('Missing staffMembers or roles.');
            return [];
        }

        const grouped = [];

        staffList.forEach((originalStaff) => {
            const staff = this.modifiedStaffMap[originalStaff.Id] || originalStaff;

            const roleList = staff.Role__c
                ? staff.Role__c.split(';').map(r => r.trim())
                : [];

            const assignedRoles = new Set(roleList);

            const staffData = {
                Id: staff.Id,
                Name: staff.Name,
                Email: staff.Email,
                rowClass: staff.rowClass,
                roleData: []
            };

            this.roles.forEach((roleName) => {
                const hasRoleInStaff = assignedRoles.has(roleName);
                const isChecked = staff.roleAssignments && staff.roleAssignments.hasOwnProperty(roleName)
                    ? staff.roleAssignments[roleName]
                    : hasRoleInStaff;  

                staffData.roleData.push({
                    roleId: roleName,
                    roleName,
                    hasRole: isChecked,
                    hasRoleinstaff: hasRoleInStaff // same value now, since activeRoles is removed
                });
            });

            console.log('Final staffData:', JSON.stringify(staffData, null, 2));
            grouped.push(staffData);
        });

        console.log(JSON.stringify(grouped, null, 2));
        return grouped;
    }

    handleSearchStaffInput(event) {
        this.searchStaff = event.target.value.toLowerCase();

        if (!this.searchStaff) {
            this.filteredStaffMembers = [...this.staffMembers];
        } else {
            this.filteredStaffMembers = this.staffMembers.filter(staff =>
                staff.Name && staff.Name.toLowerCase().includes(this.searchStaff)
            );
        }
    }

    modifiedStaffMap = {};

    // handleRoleToggle(event) {
    //     const staffId = event.target.dataset.staffId;
    //     const roleId = event.target.dataset.roleId;
    //     const isChecked = event.target.checked;

    //     let changedStaff = null;

    //     this.staffMembers = this.staffMembers.map(staff => {
    //         if (staff.Id === staffId) {
    //             const updatedStaff = { ...staff };
    //             updatedStaff.roleAssignments = { ...staff.roleAssignments };
    //             updatedStaff.roleAssignments[roleId] = isChecked;
    //             changedStaff = updatedStaff;
    //             return updatedStaff;
    //         }
    //         return staff;
    //     });

    //     // ✅ Store multiple modified staff entries
    //     if (changedStaff) {
    //         this.modifiedStaffMap[staffId] = changedStaff;
    //     }

    //     console.log('🗂️ Modified Staff Map:', JSON.stringify(this.modifiedStaffMap));
    // }
    handleRoleToggle(event) {
        const staffId = event.target.dataset.staffId;
        const roleId = event.target.dataset.roleId;
        const isChecked = event.target.checked;

        // 🔁 Get the latest version: from modified map if exists, otherwise from original list
        const originalStaff = this.modifiedStaffMap[staffId] || this.staffMembers.find(s => s.Id === staffId);

        if (!originalStaff) return;

        // 🛠 Clone the staff and their roleAssignments
        const updatedStaff = { ...originalStaff };
        updatedStaff.roleAssignments = { ...(originalStaff.roleAssignments || {}) };
        updatedStaff.roleAssignments[roleId] = isChecked;

        // ✅ Save back into modified map
        this.modifiedStaffMap = {
        ...this.modifiedStaffMap,
        [staffId]: updatedStaff
        };

        console.log("🗂️ Modified Staff Map:", JSON.stringify(this.modifiedStaffMap));
    }
    async handleeditClose1() {
        this.close = 'cancel';
        this.roleStaffFlag = false;
        this.searchStaff = '';
        this.modifiedStaffMap = {};
        await this.fetchStaffMembers();
        
        // 🛠️ Reapply changes from modifiedStaffMap
        this.staffMembers = this.staffMembers.map(staff => {
            const modified = this.modifiedStaffMap[staff.Id];
            return modified ? modified : staff;
        });

        console.log('this.staffMembers >>', this.staffMembers);
    }

    handleUpdateStaff() {
        console.log('Client Id >> ', this.clientId);
        console.log('Modified Staff Map >> ', JSON.stringify(this.modifiedStaffMap));

        const modifiedStaffList = Object.values(this.modifiedStaffMap);

        // Prepare payload (only modified records)
        const assignmentPayload = modifiedStaffList.map(staff => ({
            Id: staff.Id,
            Name: staff.Name,
            roleAssignments: staff.roleAssignments,
            rowClass: staff.rowClass
        }));

        this.serializedPayload = JSON.stringify(assignmentPayload);
        console.log('assignmentPayload >> ', this.serializedPayload);
        this.roleStaffFlag = false;
        this.searchStaff = '';
    }


    get showParticipantFormClass() {
        return this.roleStaffFlag ? 'slds-hide' : '';
    }

    get showPreferredStaffClass() {
        return this.roleStaffFlag ? '' : 'slds-hide';
    }
    handleHideFacilityEvent(event) {
        const { hideFacility, message } = event.detail;

        const forwardEvent = new CustomEvent('facilitydropdownevent', {
            detail: {
            hideFacility,
            message
            }
        });
        this.dispatchEvent(forwardEvent);
    }
}