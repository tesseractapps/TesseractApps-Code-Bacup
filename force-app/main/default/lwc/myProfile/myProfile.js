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

const actions = [
    { label: 'View Document', name: 'view_details' },   
    { label: 'Edit', name: 'edit' }   ,
    { label: 'Delete', name: 'delete' } ,]

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
    activeSections = ['StaffDetails', 'EmploymentDetails', 'staffDocumentation', 'Address', 'ApproversDetails', 'Leaves'];
    activeSections1 = ['TaxationDetails', 'PreTaxDetails', 'PostTax'];
    
    @track ictUserType;
    @track endDate;
    @track startDate;
    @track typeOfUser;
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
   
   connectedCallback(){
    if(this.superiorFlag){
        console.log('childsuperiorflag'+this.superiorFlag);
        console.log('STAFF ID'+this.staffId);
    }
    window.addEventListener('click', this.handleOutsideClick.bind(this));
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
      this.wiredClientResult = result;
    const { data, error } = result;
        if (data) {
            this.clientData = data;
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

            this.genralHourlyRate=this.clientData[0].Working_Hours_Rate__c;
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
          
            console.log('type of user in edit '+this.typeOfUser)
            if(this.typeOfUser=='ICT User'){
               // this.isICtUserInViewForm=true;
                this.ictUserType=true;
            }else{
               // this.isICtUserInViewForm=false;
                this.ictUserType=false;
            }
            if(this.clientData[0].Fixed_Rate_or_Not__c){
                this.isFixedcategoryInViewForm=true;
                this.isFixedcategory=false;
            }else{
                this.isFixedcategoryInViewForm=false;
                this.isFixedcategory=true;
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
                        : ''
                });
             }
            });
            console.log('child records '+JSON.stringify( this.DocumentTableData));
            
         
        } else if (error) {
            this.handleError(error);
        }
    }
    
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
        }

        handleEditEmployee() {
            if (this.employeeflag) {
                this.employeeeditflag = true;
               
    
            } else if (this.emergencyFlag) {
                this.emergencyeditFlag = true;
            } else if (this.bankFlag) {
                this.bankeditFlag = true;
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
            message: "Changes Saved Successfully",
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
                            message: this.file.name + ' - Uploaded Successfully!!!',
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
        console.log('Parent record Id '+this.parentStaffId );
        fetchStaff({recordId :this.parentStaffId }).then(response => {
            console.log('satff list after save'+JSON.stringify(response));
           let childRec= response.Child_Staffs__r;
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
                        : ''
                });
            }
           });
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
                        
                        this.accountRecList=[];
                        
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
                        this.showSpinner = false;
                    });
                })
               // this.reloadPage();
                this.showStaffDocumentSection=false;
                this.showPreTaxRecordEditForm=false;
                this.ShowDataTable=true;
                setTimeout(() => {
                    this.showSpinner = false;
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
                this.showSpinner = false;
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
         const actionName = event.currentTarget.name;
         const url = event.currentTarget.dataset.url;
         console.log(' ID'+this.preTaxRecId);
         console.log(' STAFF ID'+this.parentStaffId);
         console.log(' NAME'+actionName);
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
               this.addingPreTax();  
               }).catch(error => {
                 console.log('error=>'+JSON.stringify(error));
              });
             break;
 
         case 'edit':
             this.showPreTaxRecordEditForm=true;
             this.fileName='';
             
         break;
         case 'view_details':
               event.preventDefault(); 
               this.isHome=false;
               this.currentUrl = url;
              // console.log('file url  '+ this.currentUrl);  
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
        console.log('record edit form');
        const fields = event.detail.fields;
        console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-recid="PreTaxForm"]').submit(fields);


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
            
            this.accountRecList=[];
           // this.addingPreTax();  

            setTimeout(() => {
                
                this.addingPreTax(); 
                this.showSpinner = false; 
            }, 3000);
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

}