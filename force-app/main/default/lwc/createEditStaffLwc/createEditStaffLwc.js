import { LightningElement, wire, api, track } from 'lwc';
import fetchStaff from '@salesforce/apex/StaffController.fetchStaff';
import getStaffById from '@salesforce/apex/StaffController.getStaffById';
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
const actions = [
    { label: 'View Document', name: 'view_details' },   
    { label: 'Edit', name: 'edit' }   ,
    { label: 'Delete', name: 'delete' } ,]

export default class CreateEditStaffLwc extends NavigationMixin(LightningElement){
    primary = My_Resource + '/myResource/images/Primary.svg';
    secondary = My_Resource + '/myResource/images/Secondary.svg';
    admin = My_Resource + '/myResource/images/admin.svg';
    infoicon = My_Resource + '/myResource/images/Info_Icon.png';
    infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';
   
    @api staffId;
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
    @track createdShiftRole;
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
            PostTaxDeduction: false,
            EmergencyDetails1: true,
            BankDetails1: true,
            SuperannuationDetails1: true,
            Leaves1: false,
            ApproversDetails1: false,
            staffDocumentation1: false,
            StaffTrainingStatus: true,
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
            StaffTrainingStatus: '\u2B9F',
            
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
    
   @api faclist=[];

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
   /*  @api typeOfUser; 
    get typeOfUser(){
        return this.currentPageRef.state.c__typeofUser; 
    }*/
  
    
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
        this.disableedit = false;
    }
    
    handleEditEmployee() {
        if (this.employeeflag) {
            this.employeeeditflag = true;
            this.disableedit = true;
            this.primaryApproverValue=this.clientData[0].Make_Primary_as_Approver__c;
            this.secondaryApproverValue=this.clientData[0].Make_Secondary_as_Approver__c; 

        } else if (this.invoiceFlag) {
            this.invoiceeditFlag = true;
        } else if (this.taxationFlag) {
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
        this.OrgNisationRoles=data.listofPriceBook.Roles__c.split(";").map(rec=>{
            return {
            value:rec,label:rec
            }
        
        });
        this.loadStaffAssignment();
        console.log('orgdata roles '+JSON.stringify(this.OrgNisationRoles));
            
        } else if (error) {
           
        }
    }
    @track noimage;
    historyData = [];
    wiredHistoryResult;
   // @track isICtUserInViewForm=true;
   // @track isFixedcategoryInViewForm=false;
     @wire(getStaffById, { recordId: '$staffId' })
    wiredClient(result) {
      this.wiredClientResult = result;
    const { data, error } = result;
        if (data) {
            this.clientData = data;
            console.log('STAFF DATA'+JSON.stringify(this.clientData));
            this.image = this.clientData[0].picture__c;
            if(!this.image){
          this.noimage = true;
        }else{
           this.noimage = false;
        }
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
            this.genralHourlyRate=this.clientData[0].Working_Hours_Rate__c;
            this.nightShiftRate=this.clientData[0].Night_shift_Hourly_Rate__c;
            this.publicHolidayRate=this.clientData[0].Public_holiday_Hourly_Rate__c;
            this.sturdayHourlyRate=this.clientData[0].Saturday_Hourly_Rate__c;
            this.afterNoonShiftRate=this.clientData[0].Afternoon_shift_Hourly_Rate__c;
            this.sundayhourlyRate=this.clientData[0].Sunday_Hourly_Rate__c;
			this.sleepoverAllowance=this.clientData[0].Sleepover_Allowance__c;
            this.categoryType=this.clientData[0].Category_Type__c;
            this.jobType=this.clientData[0].Type_of_Job__c; 
            this.classificationLevel=this.clientData[0].Classification_Level__c; 
            this.classificationPaytype=this.clientData[0].Classification_Pay_Point__c; 
            this.selected = this.clientData[0].Role__c? this.clientData[0].Role__c.split(';') : [];
            this.superannuationValue = this.clientData[0].Superannuation_Inc_or_Exc__c;
            //console.log('Superannuation value : '+this.superannuationValue);
            this.paidBreak= this.clientData[0].Paid_Break__c;
            this.pretaxOne = this.clientData[0].Pre_Tax_One_Value__c;
            this.descriptionone = this.clientData[0].Pre_Tax_One_Description__c;
            this.pretaxThree = this.clientData[0].Pre_Tax_Three_Value__c;
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
            if(this.clientData[0].Fixed_Rate_or_Not__c){
                this.isFixedcategoryInViewForm=true;
                this.isFixedcategory=false;
                this.includeSuperannuation = false 
            }else{
                this.isFixedcategoryInViewForm=false;
                this.isFixedcategory=true;   
                this.includeSuperannuation = true;           
            }
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
            //console.log('child records '+JSON.stringify( this.DocumentTableData));
            
         
        } else if (error) {
            this.handleError(error);
        }
    }


   @wire(getStaffHistory, { staffId: '$staffId' })
    wiredHistory(result) {
        this.wiredHistoryResult = result; // 🔁 Save wire result to use for refresh

        const { data, error } = result;
        console.log('STAFFID-------------------->' + this.staffId);

        if (data) {
            this.historyData = data.map(item => ({
                id: item.Id,
               // field: item.Field === 'Facility__c' ? 'Facility' : item.Field,
                field: item.Field === 'Facility__c' ? 'Facility' : (item.Field === 'created' ? 'Created' : item.Field),
                oldValue: item.OldValue,
                newValue: item.NewValue,
                changedBy: item.CreatedBy.Name,
                date: this.formatDate(item.CreatedDate)
            }));
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

    handleSubmit(event){
        console.log('in submit');
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
          const fields = event.detail.fields;
          // alert(JSON.stringify(fields));
            fields.Address__Street__s = this.street;
            fields.Address__City__s =  this.city;
            fields.Address__StateCode__s = this.province;
            fields.Address__CountryCode__s = 'AU';
            fields.Address__PostalCode__s = this.postalcode;
            fields.Role__c=this.createdShiftRole;
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
           // fields.Pre_Tax_Calculator__c = this.preTaxForSubmit;
           if(this.voluntaryContributionCureencyVal==undefined){
            this.voluntaryContributionCureencyVal=0;
           }
           if(this.voluntaryContributionPercentVal==undefined){
            this.voluntaryContributionPercentVal=0;
           }
           /* if(this.voluntaryContributionNoneVal=='None'){
             this.voluntaryContributionCureencyVal=0;
             this.voluntaryContributionPercentVal=0;
           } */
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
            })
            .catch(error => {
                console.error('Error calling Geocode API:', error);
                // Submit form even if geocode failed
                this.template.querySelector('lightning-record-edit-form').submit(fields);
            });
          refreshApex(this.wiredClientResult); 
          
          
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
                refreshApex(this.wiredClientResult);
            }, 2000);
             
        
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

   addingPreTax(){
    console.log('Parent record Id '+this.parentStaffId );
    fetchStaff({recordId :this.parentStaffId }).then(response => {
        //console.log('satff list after save'+JSON.stringify(response));
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
	@track sleepoverAllowance=0;
    @track isFixedcategory=false;
    @track ictUserType;
    

    typeOfUserChnage(event){
        if(event.detail.value=='ICT User'){
            this.ictUserType=true;
        }else{
            this.ictUserType=false;
        }

    }

    @track includeSuperannuation = false;
    @track superannuationValue;
    @track containerStyle;

    connectedCallback() {
        window.addEventListener('click', this.handleOutsideClick.bind(this));
        window.addEventListener('resize', this.updateHeight.bind(this));

    }
    
    disconnectedCallback() {
        window.removeEventListener('click', this.handleOutsideClick.bind(this));
    }
    renderedCallback() {
        setTimeout(() => {
            this.updateHeight();
        }, 50);
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

    }
    handleRoleChange(event) {
        this.selected = event.detail.value;
        console.log('selected value '+this.selected);
        this.createdShiftRole = '';
        event.detail.value.forEach(rec => {
            this.createdShiftRole += rec + ';';
        });
        // Remove the trailing semicolon
        if (this.createdShiftRole.endsWith(';')) {
            this.createdShiftRole = this.createdShiftRole.slice(0, -1);
        }

        console.log('staff roles ' + this.createdShiftRole);

    }
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
            title: 'Update Failed',
            message: message,
            variant: 'error',
            
        })
    );
}

preventClose(event) {
event.stopPropagation(); // Prevent triggering the outside click listener when clicking inside the grid
}

triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
}
handleFaciltyChange(event){
    console.log('facilty change '+event.detail.value)
    this.StaffFacility=event.detail.value;
    console.log('StaffFacility ' +this.StaffFacility); 
}

            
}