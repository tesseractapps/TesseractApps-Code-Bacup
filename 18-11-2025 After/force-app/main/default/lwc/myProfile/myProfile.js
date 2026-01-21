import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from '@salesforce/apex';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import My_Resource from "@salesforce/resourceUrl/myResource";
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import insertPreTax from '@salesforce/apex/StaffController.insertPreTax';
import fetchStaff from '@salesforce/apex/StaffController.fetchStaff';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key';
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';
import getActiveStaffRoles from '@salesforce/apex/StaffRoleController.getActiveStaffRoles';
import getStaffRoleWithRates from '@salesforce/apex/StaffRoleController.getStaffRoleWithRates';
const actions = [
    { label: 'View Document', name: 'view_details' },   
    { label: 'Edit', name: 'edit' }   ,
    { label: 'Delete', name: 'delete' } ,]

      const AWS_BASE = 'https://tesseractapps.com'; // no trailing slash
    const ENDPOINTS = {
        delete: `${AWS_BASE}/delete-file`
    };

export default class MyProfile extends NavigationMixin(LightningElement){
    primary = My_Resource + '/myResource/images/Primary.svg';
    secondary = My_Resource + '/myResource/images/Secondary.svg';
    admin = My_Resource + '/myResource/images/admin.svg';
    infoicon = My_Resource + '/myResource/images/Info_Icon.png';
    infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';

    @api  orgId;
    @api staffId;
    @api superiorFlag;
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole
    @track usererror;
    @track userOrgName
    @track refreshTable = [];
    @track satffDataJasonformat={};
    @track isHome=true;
    @track error;
    @track recordsToDisplay = [];
    @track fname ='';
    @track lname ='';
    @track firstname = '';
    @track lastname = '';
    @track organixationID;
    @track recordId;
    @track stffsFlag =false;
    @track noStffsFlag=false;
    @track satffDataJasonformat={};
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalcode;
    @track showSpinner;
    @track DocumentTableData=[];
    @track staffViewFlag=false;
    @track isAccepted=[];
    @track records= [];
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; 
    @track employeeflag=true;
    @track invoiceFlag=false;
    @track taxationFlag=false;
    @track emergencyFlag=false;
    @track bankFlag=false;
    @track voluntaryFlag=false;
    @track employeeeditflag = false;
    @track invoiceeditFlag = false;
    @track taxationeditFlag=false;
    @track emergencyeditFlag = false;
    @track bankeditFlag = false;
    @track voluntaryeditFlag=false;
    @track typeOfDocument;
    activeSections = ['StaffDetails', 'EmploymentDetails', 'staffDocumentation', 'Address', 'ApproversDetails', 'Leaves'];
    activeSections1 = ['TaxationDetails', 'PreTaxDetails', 'PostTax'];
    @track DisplayRole;
    @track DisplayLanguages;
    @track ictUserType;
    @track endDate;
    @track startDate;
    @track typeOfUser;
    @track noRecordsFlag=false;
    @track successmessage;
    @track facilityPreferredName;
    @track participantPreferredName;
    @track staffPreferredName;
    @track points;
    @track isFileExpand = false;
    @track totalfiles=[];
    @track key;
    @track activeRoles = [];
    @track uploadedFiles1;
    @track documentedit=false;
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
            type: 'action',
            label: 'Action',  
            initialWidth: 100,          
            typeAttributes: {
                rowActions: actions,
            }
        }
        ];

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
    
    
  
   
    @track amazonurl;
    @track profilepic;


    @track sectionFlags = {
        staffDetails: true,
        Addressdetails: false,
        EmploymentDetails: false,
        InvoiceDetails: true,
        TaxationDetails: true,
        PreTaxDeduction: false,
        PostTaxDeduction: false,
        EmergencyDetails: true,
        BankDetails: true,
        SuperannuationDetails: true,
        Leaves: false,
        ApproversDetails: false,
        staffDocumentation: false,


        staffDetails1: true,
        Addressdetails1: false,
        EmploymentDetails1: false,
        InvoiceDetails1: true,
        TaxationDetails1: true,
        PreTaxDeduction1: false,
        PostTaxDeduction1: false,
        EmergencyDetails1: true,
        BankDetails1: true,
        SuperannuationDetails1: true,
        Leaves1: false,
        ApproversDetails1: false,
        staffDocumentation1: false,
    };
    
    // Icons for the toggle buttons
    @track sectionIcons = {
        staffDetails: '\u2B9F', 
        Addressdetails: '\u2B9C',
        EmploymentDetails: '\u2B9C',
        InvoiceDetails: '\u2B9F',
        TaxationDetails: '\u2B9F',
        PreTaxDeduction: '\u2B9C',
        PostTaxDeduction: '\u2B9C',
        EmergencyDetails: '\u2B9F',
        BankDetails: '\u2B9F',
        SuperannuationDetails: '\u2B9F', 
        Leaves: '\u2B9C',
        ApproversDetails: '\u2B9C',
        staffDocumentation: '\u2B9C', 

        staffDetails1: '\u2B9F', 
        Addressdetails1: '\u2B9C',
        EmploymentDetails1: '\u2B9C',
        InvoiceDetails1: '\u2B9F',
        TaxationDetails1: '\u2B9F',
        PreTaxDeduction1: '\u2B9C',
        PostTaxDeduction1: '\u2B9C',
        EmergencyDetails1: '\u2B9F',
        BankDetails1: '\u2B9F',
        SuperannuationDetails1: '\u2B9F', 
        Leaves1: '\u2B9C',
        ApproversDetails1: '\u2B9C',
        staffDocumentation1: '\u2B9C',
    };
    @track StaffFacility='';
    @track typeOfService;
    @track isSchadsAwards=false;
    @track isNursingAwards=false;
    @track isFixedcategory=true; 
    @track searchKey = '';
    @track showDropdown = false;
    @track filteredOptions = [];
    @track noResults = false;

  allNationalities = [
    'Afghan', 'Albanian', 'Algerian', 'American', 'Argentinian', 'Armenian',
    'Australian', 'Austrian', 'Bangladeshi', 'Belgian', 'Brazilian', 'British',
    'Bulgarian', 'Canadian', 'Chinese', 'Colombian', 'Cuban', 'Danish',
    'Dutch', 'Egyptian', 'English', 'Filipino', 'Finnish', 'French', 'German',
    'Greek', 'Hungarian', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish',
    'Israeli', 'Italian', 'Japanese', 'Kenyan', 'Korean', 'Malaysian',
    'Mexican', 'Moroccan', 'Nepali', 'New Zealander', 'Nigerian', 'Pakistani',
    'Peruvian', 'Polish', 'Portuguese', 'Russian', 'Saudi', 'Singaporean',
    'South African', 'Spanish', 'Sri Lankan', 'Swedish', 'Swiss', 'Thai',
    'Turkish', 'Ukrainian', 'Vietnamese', 'Zimbabwean'
  ];

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

        fetchOrgDetails() {
            orgDetails()
                .then((response) => {
                    console.log("Response for Org Details =>", response);
                    this.Orgid = response.Id;
                    this.orgfullname = response.Name;
                    //this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
                    //this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
                })
                .catch((error) => {
                    console.error("Error fetching org details:", error);
                    this.error = error;
                });
        }
   
   connectedCallback(){
    console.log('calijgn connetd ');
    if(this.superiorFlag){
        console.log('childsuperiorflag'+this.superiorFlag);
        console.log('STAFF ID'+this.staffId);
    }
    //this.fetchOrgDetails();
    /* this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "";
    this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || ""; */
    this.participantPreferredName = localStorage.getItem("defaultParticipantPreferredName") || "Participant";
    this.facilityPreferredName = localStorage.getItem("defaultFacilityPreferredName") || "Facility";
    this.staffPreferredName = localStorage.getItem("defaultStaffPreferredName") || "Staff";
    console.log('participantPreferredName '+ this.participantPreferredName);
    console.log('facilityPreferredName '+ this.facilityPreferredName);
    console.log('staffPreferredName '+ this.staffPreferredName);
    this.addingPreTax();

    const activeTab = localStorage.getItem('activeMyProfileTab');
    console.log('activeTab in  my profile in  connectedCallback' ,activeTab )
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
    
    switch (activeTab) {
        case 'myProfileEmployee':
            this.employeeflag = true;
            console.log('this.employeeflag in my profile in  connectedCallback:' ,this.employeeflag);
            break;
        case 'myProfileInvoice':
            this.invoiceFlag = true;
             console.log('this.invoiceFlag in my profile in  connectedCallback:' ,this.invoiceFlag);
            break;
        case 'myProfileTax':
            this.taxationFlag = true;
            console.log('this.taxationFlag in my profile in  connectedCallback:' ,this.taxationFlag);
            break;
        case 'myProfileVoluntary':
            this.voluntaryFlag = true;
            console.log('this.voluntaryFlag in my profile in  connectedCallback:' ,this.voluntaryFlag);
            break;
        case 'myProfileEmergency':
            this.emergencyFlag = true;
            console.log('this.emergencyFlag in my profile in  connectedCallback:' ,this.emergencyFlag);
            break;
        case 'myProfileBank':
            this.bankFlag = true;
            console.log('this.bankFlag in my profile in  connectedCallback:' ,this.bankFlag);
            break;
        
        default:
            this.employeeflag = true;
            console.log('this.employeeflag in my profile in  default connectedCallback:' ,this.employeeflag);

    }
    window.addEventListener('click', this.handleOutsideClick.bind(this));

    this.filteredOptions = this.allNationalities.map(n => ({
      label: n,
      value: n
    }));
   }

   disconnectedCallback() {
    window.removeEventListener('click', this.handleOutsideClick.bind(this));
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
     
    addressInputChange(event) { 
        console.log('event detail'+JSON.stringify(event.detail)); 
        this.street=event.detail.street;
        this.city=event.detail.city;
        this.postalcode=event.detail.postalCode;
        this.province=event.detail.province;
        this.country=event.detail.country;
    }
  @track image;
  @track noimage;
  
   @wire(getStaffById, { recordId: '$staffId' })
    wiredClient(result) {
    console.log('staffId passed to Apex:', this.staffId);
    console.log('Raw wire result:', JSON.stringify(result, null, 2));
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
            this.image = this.clientData[0].picture__c;
             if(!this.image){
          this.noimage = true;
        }else{
           this.noimage = false;
        }
            console.log('Client data:', JSON.stringify(this.clientData));
            this.city = this.clientData[0].Address__City__s;
            this.country = this.clientData[0].Address__CountryCode__s;
            this.province = this.clientData[0].Address__StateCode__s;
            this.postalcode = this.clientData[0].Address__PostalCode__s;
            this.street=this.clientData[0].Address__Street__s;
            this.lastName=this.clientData[0].Last_Name__c;
            this.firstName=this.clientData[0].First_Name__c;
            this.DisplayRole=this.clientData[0].activeRolesDisplay;
            this.DisplayLanguages=this.clientData[0].Languages__c;
            this.genralHourlyRate=this.clientData[0].Working_Hours_Rate__c ||'--';
            this.nightShiftRate=this.clientData[0].Night_shift_Hourly_Rate__c;
            this.publicHolidayRate=this.clientData[0].Public_holiday_Hourly_Rate__c;
            this.sturdayHourlyRate=this.clientData[0].Saturday_Hourly_Rate__c;
            this.afterNoonShiftRate=this.clientData[0].Afternoon_shift_Hourly_Rate__c;
            this.sundayhourlyRate=this.clientData[0].Sunday_Hourly_Rate__c;
            this.categoryType=this.clientData[0].Category_Type__c;
            this.jobType=this.clientData[0].Type_of_Job__c; 
            this.classificationLevel=this.clientData[0].Classification_Level__c; 
            this.classificationPaytype=this.clientData[0].Classification_Pay_Point__c; 
            this.selected = this.clientData[0].Role__c? this.clientData[0].Role__c.split(';') : [];
            this.typeOfUser = this.clientData[0].Type_of_User__c;
             this.StaffFacility=this.clientData[0].Facility__c;
          /*  praveen changes for nursing awards start*/
                this.fetchFacility( this.StaffFacility);
          console.log('manendraDisplayRole', this.DisplayRole);
            console.log('type of user in edit '+this.typeOfUser);
             if (this.staffId) {
                this.fetchActiveRoles();
            }
            if(this.typeOfUser=='ICT User'){
               // this.isICtUserInViewForm=true;
                this.ictUserType=true;
            }else{
               // this.isICtUserInViewForm=false;
                this.ictUserType=false;
            }
            if(this.clientData[0].Fixed_Rate_or_Not__c || this.clientData[0].Nursning_Awards__c){
               
                this.isFixedcategory=true;
            }else{
              
                this.isFixedcategory=false;
            }
          

            const childRec=this.clientData[0].Child_Staffs__r || [];
            this.DocumentTableData=[];
            childRec.forEach(rec=>{
                 
             if(rec.Type__c ){
                this.DocumentTableData.push({
                    ...rec, // Spread existing record properties
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
                        : ''
                });
             }
            });
            console.log('child records '+JSON.stringify( this.DocumentTableData));
            
         
        } else if (error) {
            this.handleError(error);
        }
    }
fetchActiveRoles() {
    if (!this.staffId) return;

    getActiveStaffRoles({ staffId: this.staffId })
        .then(result => {
            if (!result || result.length === 0) {
                this.activeRoles = [];
                console.warn('No active roles returned');
                return;
            }
          this.activeRoles = result.map(role => {
    return {
        RoleName: role.RoleName ? String(role.RoleName) : '--',
        CategoryType: role.CategoryType ? String(role.CategoryType) : '--',
        ClassificationLevel: role.ClassificationLevel ? String(role.ClassificationLevel) : '--',
        ClassificationPayType: role.ClassificationPayType ? String(role.ClassificationPayType) : '--',
        JobType: role.JobType ? String(role.JobType) : '--',
        HourlyRate: role.HourlyRate != null ? role.HourlyRate.toFixed(2) : '--',
        SaturdayRate: role.SaturdayRate != null ? role.SaturdayRate.toFixed(2) : '--',
        SundayRate: role.SundayRate != null ? role.SundayRate.toFixed(2) : '--',
        PublicHolidayRate: role.PublicHolidayRate != null ? role.PublicHolidayRate.toFixed(2) : '--',
        AfternoonShiftRate: role.AfternoonShiftRate != null ? role.AfternoonShiftRate.toFixed(2) : '--',
        NightShiftRate: role.NightShiftRate != null ? role.NightShiftRate.toFixed(2) : '--',
        SleepoverAllowance: role.SleepoverAllowance != null ? role.SleepoverAllowance.toFixed(2) : '--'
    };
});


        })
        .catch(error => {
            console.error('Error fetching roles:', error);
            this.activeRoles = [];
        });
}

//manendra
    
    handleeditClose(event){
        this.handleflag();
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
        localStorage.setItem('activeMyProfileTab', 'myProfileEmployee');
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
            localStorage.setItem('activeMyProfileTab', 'myProfileInvoice');
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
            localStorage.setItem('activeMyProfileTab', 'myProfileTax');
        }
        handleVoluntary(event){
            console.log('handleVoluntary ');
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
            localStorage.setItem('activeMyProfileTab', 'myProfileVoluntary');
           // this.voluntaryMethod();
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
            localStorage.setItem('activeMyProfileTab', 'myProfileEmergency');
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
            localStorage.setItem('activeMyProfileTab', 'myProfileBank');
        }

        handleEditEmployee() {
            if (this.employeeflag) {
                this.employeeeditflag = true;
                this.successmessage='Employee details updated successfully.';
               
    
            } else if (this.emergencyFlag) {
                this.emergencyeditFlag = true;
                this.successmessage='Emergency updated successfully.';
            } else if (this.bankFlag) {
                this.bankeditFlag = true;
                this.successmessage='Bank updated successfully.';
            } 
            this.fileName = '';
        }
    
    
       /*  handleEditEmployee(event){
            this.employeeflag=false;
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
            this.invoiceFlag=false;
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
            this.taxationFlag=false;
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
        handleEditVoluntary(event){
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
            this.voluntaryeditFlag=true;
        }
        handleEditEmergency(event){
            this.employeeflag=false;
            this.invoiceFlag=false;
            this.taxationFlag=false;
            this.emergencyFlag=false;
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
            this.bankFlag=false;
            this.voluntaryFlag=false;
            this.employeeeditflag=false;
            this.invoiceeditFlag=false;
            this.taxationeditFlag=false;
            this.emergencyeditFlag=false;
            this.bankeditFlag=true;
            this.voluntaryeditFlag=false;
        } */
    
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
    get voluntaryClass(){
        return (this.voluntaryFlag || this.voluntaryeditFlag) ? 'menu-item1' : 'menu-item'; 
      
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
            }) .catch(error => {
                console.error('Error calling Geocode API:', error);
                
                // Submit form even if geocode failed
                this.template.querySelector('lightning-record-edit-form').submit(fields);
            });  
      }

    handleSuccess(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: this.successmessage,
            variant: "success"
        });
        this.dispatchEvent(toastEvent);
        this.staffEditFlag=false;
        this.handleflag();
        let staffRecID=event.detail.id;
        this.confirmEmailError='';
        this.primaryEmailError=false;
        this.secondaryEmailError=false;
        console.log('file base64 in success=>'+JSON.stringify(this.base64FileData));
        console.log('Record in success=>'+this.preTaxRecId);
        console.log('File in success=>'+this.fileName);
       // Refresh the data after success
       refreshApex(this.wiredClientResult);
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
                            message: this.file.name + ' added successfully.',
                            variant: 'success',
                        }),
                    );
                    refreshApex(this.refreshTable);
                   
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
                refreshApex(this.wiredClientResult);
            }, 2000);
             
        
    }  

   handleError(event) {
    event.preventDefault(); // Prevent default UI (red errors under fields)
    
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

    @track accountRecList=[];
    @track showStaffDocumentSection;
    @track parentStaffId;
    @track isattachError=false;
    @track isFileAttached=false
    @track selectedFilesToUpload = [];
    @track staffDocumentMap={};
    @track showPreTaxRecordEditForm=false;
    @track preTaxRecId='';
    @track fileName;
    @track doc;
    @track fileSize;
    @track file; //holding file instance
    @track myFile;    
    @track fileType;//holding file type
    @track fileReaderObj;
    @track base64FileData; 
    @track ShowPretaxModal;
    @track  ShowDataTable;
    @track totalPoints;
  
    

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

     addingPreTax(){
    console.log('Parent record Id  in addingPreTax'+this.staffId );
    fetchStaff({recordId :this.staffId }).then(response => {
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
            totalPoints += Number(rec.Points__c) || 0;
            this.DocumentTableData.push({
                ...rec, // Spread existing record properties
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
         KeyVal: rec && rec.key__c ? rec.key__c : ''
            });
        }
       });
        console.log('this.DocumentTableData :  '+JSON.stringify(this.DocumentTableData));
        this.hasRecords = this.DocumentTableData.length > 0;

        this.totalPoints = totalPoints;
    }); 

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
    @track key;
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
    handleback() {
        this.isHome=true;
        this.isModalOpen=false;
        this.currentUrl='';
        this.employeeflag=true;
    }

   
     handlePreTaxRecordFormSubmit(event){
       // this.deleteFile(this.key);
        event.preventDefault(); // stop the form from submitting
        console.log('record edit form');
        console.log('key:',this.key);
         const fields = event.detail.fields;
        fields.Type__c = this.typeOfDocument;
        if(this.uploadedFiles1 && this.uploadedFiles1.length>0){
        this.deleteFile(this.key);
        fields.View_File__c = this.uploadedFiles1[0].url;
        fields.Awsjson__c = JSON.stringify(this.uploadedFiles1[0]);
        fields.File_Name__c = this.uploadedFiles1[0].originalName;
        fields.key__c = this.uploadedFiles1[0].key;
        }
        
       
       
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recid="PreTaxForm"]').submit(fields);


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
       
            this.accountRecList=[];
            this.uploadedFiles1 =[];
            this.key='';
            this.documentedit=false;
         
            console.log('last line ')              
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

    hadleDates(event) {
        if (event.target.name == 'StartDateInput') {
            this.startDate = event.detail.value; 
            this.loadAcceptedStaffPayrollStatus();
        }
        if (event.target.name == 'EndDateInput') {
            this.endDate = event.detail.value;
            this.loadAcceptedStaffPayrollStatus();
        }
    }

   
    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
    // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isHome=false;
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
        this.isHome=true;
    }
    
    getFileType(url) {
        const fileName = url.substring(url.lastIndexOf('/') + 1);
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    @track pageSizeOptions1 = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records1 = []; //All records available in the data table
    @track columns1 = []; //columns information available in the data table
    @track totalRecords1 = 0; //Total no.of records
    @track pageSize1; //No.of records to be displayed per page
    @track totalPages1; //Total no.of pages
    @track pageNumber1 = 1; //Page number   

    get bDisableFirst1() {
        return this.pageNumber1 == 1;
    }
    get bDisableLast1() {
        return this.pageNumber1 == this.totalPages1;
    }
    
    handleRecordsPerPage1(event) {
        this.pageSize1 = event.target.value;
        this.paginationHelper1();
    }
    previousPage1() {
        this.pageNumber1 = this.pageNumber1 - 1;
        this.paginationHelper1();
    }
    nextPage1() {
        this.pageNumber1 = this.pageNumber1 + 1;
        this.paginationHelper1();
    }
    firstPage1() {
        this.pageNumber1 = 1;
        this.paginationHelper1();
    }
    lastPage1() {
        this.pageNumber1 = this.totalPages1;
        this.paginationHelper1();
    }
    
    // JS function to handel pagination logic 
    paginationHelper1() {
        try{
        this.ictInvoiceList = [];
        // calculate total pages
        this.totalPages1 = Math.ceil(this.totalRecords1 / this.pageSize1);
        // console.log("totalPages  : "+ JSON.stringify(this.totalPages));
        // set page number 
        if (this.pageNumber1 <= 1) {
            this.pageNumber1 = 1;
        } else if (this.pageNumber1 >= this.totalPages1) {
            this.pageNumber1 = this.totalPages1;
        }

        // console.log("pageNumber  : "+ JSON.stringify(this.pageNumber));
        // set records to display on current page 
        let tempconList=[];
        for (let i = (this.pageNumber1 - 1) * this.pageSize1; i < this.pageNumber1 * this.pageSize1; i++) {
            if (i === this.totalRecords1) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records1[i]);
            tempconList.push(tempConRec)           
        }
        refreshApex(tempconList);
        console.log("Pagination1 : "+ JSON.stringify(tempconList));
        this.ictInvoiceList = tempconList;
        }catch(err){
            console.log('Error >.'+err);
        }
    }  
    
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
                gridElement.style.visibility = 'hidden';
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
    

handleOutsideClick(event) {
const gridElement = this.template.querySelector('.grid');
if (
    gridElement &&
    !gridElement.contains(event.target) && // Ensure click is outside the grid
    !event.target.closest('img') // Ensure click is not on the icon
) {
    if (gridElement.classList.contains('slide-in')) {
        // Slide out the header
        gridElement.classList.remove('slide-in');
        gridElement.classList.add('slide-out');
    }
}
}

preventClose(event) {
event.stopPropagation(); // Prevent triggering the outside click listener when clicking inside the grid
}

    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
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

     ALLOWED_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

    isAllowedFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return this.ALLOWED_FILE_EXTENSIONS.includes(ext);
    }


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
        console.log('ENTERED EDIT MODE');
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

   showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
        });
        this.dispatchEvent(event);
    }


    // Drag & drop
   handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
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
        this.totalfiles=[];
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
    this.uploadedFiles[index].errorMessage = '';


    // Update the selected document type
    this.uploadedFiles[index].typeOfDocument = selectedType;

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
   

    handleCommentsChange(event) {
        const index = event.target.dataset.index;
        this.uploadedFiles[index].comment = event.target.value;
        this.uploadedFiles = [...this.uploadedFiles];
         console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
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

   /*  handleDelete(event) {
        let index = event.target.dataset.index;
        let key = event.currentTarget.dataset.key;
         console.log('key:',key );
        this.uploadedFiles.splice(index, 1);
        this.uploadedFiles = [...this.uploadedFiles];
         console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));
          this.deleteFile(key);
    } */
   handleDelete(event) {
    const index = event.currentTarget.dataset.index;
    const fileToDelete = this.uploadedFiles[index];

    if (fileToDelete) {
        const key = fileToDelete.awsjson.key; // ✅ correct key
        console.log('Deleting key:', key);

        // Remove from array
        this.uploadedFiles = this.uploadedFiles.filter((_, i) => i !== parseInt(index, 10));

        console.log('🧾 UploadedFiles now:', JSON.stringify(this.uploadedFiles));

        this.deleteFile(key);
    }
}


    handleCancel(event){
       
        this.uploadedFiles = [];
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
                          
                        }else if(this.typeOfService == 'Nursing'){
                             this.isSchadsAwards = false;
                            this.isNursingAwards = true;
                          
                        }else if(this.typeOfService ==undefined || this.typeOfService == null || this.typeOfService ==''){
                             this.isSchadsAwards = false;
                              this.isNursingAwards = false;
                              this.isFixedcategory =true;
                        }else{
                             this.isSchadsAwards = false;
                              this.isNursingAwards = false;
                              this.isFixedcategory =true;
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

}