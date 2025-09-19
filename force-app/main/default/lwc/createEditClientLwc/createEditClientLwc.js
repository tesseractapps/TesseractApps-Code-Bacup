import { LightningElement, wire, api, track } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getClientById from '@salesforce/apex/ClientDataController.getClientById';
import { refreshApex } from '@salesforce/apex';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import My_Resource from "@salesforce/resourceUrl/myResource";
import getEmployeeData from '@salesforce/apex/issueRegisterSearch.getEmployeeData';
import insertStaffRecords from '@salesforce/apex/ClientDataController.insertStaffRecords';
import getStaffData from '@salesforce/apex/ClientDataController.getStaffData';
import updateStaffAssignments from '@salesforce/apex/ClientDataController.updateStaffAssignments'; 
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails'; 

export default class CreateEditClientLwc extends NavigationMixin(LightningElement) {
  primary = My_Resource + '/myResource/images/Primary.svg';
  secondary = My_Resource + '/myResource/images/Secondary.svg';
  Search = My_Resource + '/myResource/images/Participants.svg';
  infoicon = My_Resource + '/myResource/images/Info_Icon.png';
  infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';
  @track detailsflag=true;
  @track addressflag=false;
  @track identificationflag;
  @track insuranceflag;
  @track participantflag;
  @track primaryflag;
  @track secondaryflag;
  @track detailseditflag=false;
  @track addresseditflag;
  @track identificationeditflag;
  @track insuranceeditflag;
  @track primaryeditflag;
  @track participanteditflag;
  @track secondaryeditflag;
  @track clientData=[];
  wiredClientResult;
  @track imageerror;
  @track fileName;
  @track street1;
  @track city;
  @track country;
  @track province;
  @track postalcode;
  @track fullName;
  @track firstName='';
  @track lastName='';
  @track clientId;
  @track clientName;
  @track assignParticipant = false;
  @track staffOptions = [];    
  @track staffVal;  
  @track staffName=[];
  @track orgId;
  @track selectedRoles=[];
  @track OrgNisationRoles=[]; 
  @track facilityId = ''; 
  @track role = '';
  @track staffRecID;
  @api participantId;
  @track image;
  @track toggleValue;
  wiredStaffResult;

  @track sectionFlags = {
    PartcipantDetails: true,
    Addressdetails: true,
    IdentificationDetails: true,
    InsuranceDetails: true,
    PrimaryContactDetails: true,
    SecondaryContactDetails: false, 
    Assignstaff: true,      
};

 @track sectionIcons = {
    PartcipantDetails: '\u2B9F', 
    Addressdetails: '\u2B9F',
    IdentificationDetails: '\u2B9F',
    InsuranceDetails: '\u2B9F',
    PrimaryContactDetails: '\u2B9F',
    SecondaryContactDetails: '\u2B9C', 
    Assignstaff: '\u2B9F',  
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

  backtoparticipant(event){
   /*  if (!this.orgnisationId) {
      console.error('Organisation ID is not defined.');
      return;
    }
    this[NavigationMixin.Navigate]({
        // Pass in pageReference
        type: 'comm__namedPage',
        //type: 'standard__component',
        attributes: {
          pageName: 'administration',
         // componentName: "c__clientDataWithPagination",
        },
        state: {
          c__propertyValue: "Clients",
          c__orgID:this.orgnisationId
        },
      });
      //refreshApex(this.wiredStaffResult); */
      const customEvent = new CustomEvent('myevent', {
        detail: { message: 'Hello from Child!' }
    });
    this.dispatchEvent(customEvent);
  }

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
connectedCallback() {
  console.log('recordId ', this.propertyValue);
  //Manimala added 95-104
  organizationDetails().then(response => {        
    let orgRoles= response.listofPriceBook.Roles__c;
    //console.log('listofPriceBook:', response.listofPriceBook);
    this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
      return {
      value: rec,
      label: rec
      };
    });
  }) 
  this.clientId=this.participantId;
  //this.getStaffValues();    
  // This will trigger a refresh of the wired data.
  console.log('role 1 >>'+this.role);
  refreshApex(this.wiredStaffResult);
  document.addEventListener('click', this.handleOutsideClick.bind(this));
  document.body.style.overflowX = 'hidden';

}

@wire(getClientById, { recordId: '$participantId' })
  wiredClient(result) {
    this.wiredClientResult = result;
    const { data, error } = result;
    if (data) {
        this.clientData = data;
        console.log('CLIENT DATA'+JSON.stringify(this.clientData));
        this.image = this.clientData[0].Picture__c;
        console.log('image'+this.image);
        this.city = this.clientData[0].Address__City__s;
        this.country = this.clientData[0].Address__CountryCode__s;
        this.province = this.clientData[0].Address__StateCode__s;
        this.postalcode = this.clientData[0].Address__PostalCode__s;
        this.street1=this.clientData[0].Address__Street__s;
        this.lastName=this.clientData[0].Last_Name__c;
        this.firstName=this.clientData[0].First_Name__c;
        this.clientId = this.clientData[0].Id;
        this.clientName = this.clientData[0].Name;
        this.orgId = this.clientData[0].Organization_Name__c;
        this.facilityId = this.clientData[0].Facility__c;
        //this.role = this.clientData[0].Participant_Staff_Associations__r[0].Role__c;
        this.toggleValue = this.clientData[0].Status__c;
        console.log('Organisation Name >>'+ this.orgId);
        console.log('CleintId >>'+this.clientId);
        console.log('Client Name >>'+this.clientName);
        console.log('Client data:', JSON.stringify(this.clientData));

        if (this.clientData[0].Participant_Staff_Associations__r && this.clientData[0].Participant_Staff_Associations__r.length > 0) {
          this.role = this.clientData[0].Participant_Staff_Associations__r[0].Role__c;  // Set the first role
          console.log('Role from client data >>' + this.role);
      } else {
          this.role = '';  // No role selected
      }
      refreshApex(this.wiredClientResult);
    } else if (error) {
        this.handleError(error);
    }
  }

  @wire(getStaffData, { clientId: '$clientId', facilityId: '$facilityId', role: '$role' })
    wiredStaffData(result) {
        this.wiredStaffResult = result; // Store the result for later use in refreshApex
        const { error, data } = result;
        if (data) {
            // Process the data
            this.staffOptions = data.map(record => ({
                value: record.Id,
                label: record.Name
            }));

            console.log('Staff options: ' + JSON.stringify(this.staffOptions));

            // Assign the first staff's label to staffVal if available
            if (this.staffOptions.length > 0) {
                this.staffVal = this.staffOptions[0].label;
            }

            // Default to pre-assigned staff if no roles selected
            if (!this.selectedRoles || this.selectedRoles.length === 0) {
                this.selectedRoles = data
                    .filter(record => record.isAssigned)  // Assuming 'isAssigned' indicates if the staff is already assigned
                    .map(record => record.Id);
            }
            console.log('Selected staff: ' + JSON.stringify(this.selectedRoles));
        } else if (error) {
            console.error('Error fetching staff values: ', error);
        }
    }


 
  //Manimala added 110-121
  handleFacilityChange(event) {    
    //  console.log('facility onchange '+(event.target)) ;                 
      this.facilityId = event.target.value; // Capture Facility ID
      //this.getStaffValues(); // Fetch staff based on the new facility
      refreshApex(this.wiredStaffResult);
      console.log('Selected facility >> ' + this.facilityId);
  }
  handleChangeRole(event) {
    //console.log('onchange '+JSON.stringify(event.detail));
    this.role = event.detail.value; // Handle combobox value change
    console.log('Selected Role >> ' + this.role);
    //this.getStaffValues();
    refreshApex(this.wiredStaffResult);
  
}
handleStatus(event) {
        
  this.toggleValue = event.target.checked; 
  console.log('Toggle status:', this.toggleValue);

}

  handleSubmit(event){
    //  console.log('in submit');
    event.preventDefault();// stop the form from submitting
    const fields = event.detail.fields;
    // alert(JSON.stringify(fields));
    fields.Address__Street__s = this.street1;
    fields.Address__City__s =  this.city;
    fields.Address__StateCode__s = this.province;
    fields.Address__CountryCode__s = 'AU';
    fields.Address__PostalCode__s = this.postalcode;
    // fields.Pre_Tax_Calculator__c = this.preTaxForSubmit;
    fields.Name = this.fullName;
    fields.Status__c = this.toggleValue;
    console.log('Participant Name >'+fields.Name);
    console.log('After fields>>'+JSON.stringify(fields));
    this.template.querySelector('lightning-record-edit-form').submit(fields);  
      
  }

  handleSuccess(event) { 
    const toastEvent = new ShowToastEvent({
        title: "Success",
        message: "Changes Saved Successfully",
        variant: "success"
    });
    //this.fetchParticipant();
    this.dispatchEvent(toastEvent);
    this.handleflag();
    refreshApex(this.wiredClientResult);
    let staffRecID=event.detail.id;
    console.log('filelength'+this.fileName.length);
    if(this.fileName.length > 0){
      
    uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:staffRecID, obj:'client'}).then(result => {
       this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: this.file.name + ' - Uploaded Successfully!!!',
                variant: 'success',
            }),
        );
       
    })
  }
    setTimeout(() => {
      refreshApex(this.wiredClientResult);
    }, 2000);
    console.log('role>>'+this.role);

    insertStaffRecords({ clientId: staffRecID, roleId: this.role,selectedStaff: this.staffName}).then(() => {
      this.participanteditflag=false;  
      /* this.dispatchEvent(
         new ShowToastEvent({
            title: 'Success',
            message: 'Records inserted successfully',
            variant: 'success'
        })
      );   */
      //this.participantflag = true; 
      //this.getStaffValues();
      console.log('role 2 >>'+this.role);
      refreshApex(this.wiredStaffResult);
      this.selectedRoles = this.staffName;  
    })
    .catch(error => {
   // Handle error
      console.error('Error inserting record:', error);
    }); 
    
  }
  addressInputChange(event) {
    const address = event.detail;
    console.log('address'+JSON.stringify(address));
    if (!address.street || !address.city || !address.postalCode || !address.province) {
    this.errorMessage = 'Please provide complete address information.';
    this.saveButtonDisable = true;
    }
    else{
      this.errorMessage = '';
      this.saveButtonDisable = false;
      //  console.log('event detail'+JSON.stringify(event.detail)); 
      this.street1=event.detail.street;
      
      this.city=event.detail.city;
      this.postalcode=event.detail.postalCode;
      this.province=event.detail.province;
      this.country=event.detail.country;
    }
  }
  handleflag(){
      if (this.detailseditflag) {
        this.detailseditflag = false; 
        this.detailsflag = true;           
      } else if (this.addresseditflag) {
          this.addresseditflag = false; 
          this.addressflag = true; 
      } else if (this.identificationeditflag) {
          this.identificationeditflag = false; 
          this.identificationflag = true; 
      } else if (this.insuranceeditflag) {
          this.insuranceeditflag = false; 
          this.insuranceflag = true; 
      } else if (this.primaryeditflag) {
          this.primaryeditflag = false; 
          this.primaryflag = true; 
      } else if (this.secondaryeditflag) {
          this.secondaryeditflag = false; 
          this.secondaryflag = true; 
      } else if (this.participanteditflag) {
        this.participanteditflag = false; 
        this.participantflag = true; 
    }
      
  }
/* @wire(getClientById, { recordId: this.propertyValue})
    wiredClient({ error, data }) {
        if (data) {
            this.clientData = data; 
          console.log('client data'+this.clientData);
        } else if (error) {
            this.handleError(error); // Call the custom error handling method
        }
    } */

  

  handleError(error) {
      console.error('An error occurred:', error); 
      // Implement additional error handling logic here if needed
  }
  handleeditClose(event){
    this.handleflag();
    this.selectedRoles = [...this.originalSelectedRoles];
    this.staffOptions =  [...this.originalStaffOptions];
  }
  triggerFileInput() {
    this.template.querySelector('input[type="file"]').click();
}
  handledetails(event){
    this.detailsflag=true;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
  }
  handleaddress(event){
    this.detailsflag=false;
    this.addressflag=true;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
  }
  handleidentification(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=true;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
  }
  handleinsurance(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=true;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
  }
  handleprimary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=true;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
  }
   
  handleParticipant(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = true;
    this.participanteditflag=false;
    //this.getStaffValues();
    console.log('role 3 >>'+this.role);
    refreshApex(this.wiredStaffResult);
  }
  handlesecondary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=true;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
  }
  handleeditdetails() {
    if (this.detailsflag) {
        this.detailseditflag = true;
    } else if (this.addressflag) {
        this.addresseditflag = true;
    } else if (this.identificationflag) {
        this.identificationeditflag = true;
    } else if (this.insuranceflag) {
        this.insuranceeditflag = true;
    } else if (this.primaryflag) {
        this.primaryeditflag = true;
    } else if (this.secondaryflag) {
        this.secondaryeditflag = true;
    } else if (this.participantflag) {
      this.participanteditflag = true;
      this.originalSelectedRoles = [...this.selectedRoles];
      this.originalstaffoptions = [...this.staffoptions];

  } 
    this.fileName = '';
}
 /*  handleeditdetails(event){
    this.detailsflag=true;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=true;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.imageerror='';
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditaddress(event){
    this.detailsflag=false;
    this.addressflag=true;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=true;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.street=this.clientData.Address__Street__s;
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditidentification(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=true;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=true;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditinsurance(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=true;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=true;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditparticipant(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=false;
    this.participantflag = true;
    this.participanteditflag=true;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
    //this.getStaffValues(); 
    console.log('role 4 >>'+this.role);
   refreshApex(this.wiredStaffResult);
 
  }
  handleeditprimary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=false;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=true;
    this.secondaryeditflag=false;
    this.participantflag = true;
    this.participanteditflag=false;
    this.fileName='';
    console.log('FILENAME'+this.fileName);
  }
  handleeditsecondary(event){
    this.detailsflag=false;
    this.addressflag=false;
    this.identificationflag=false;
    this.insuranceflag=false;
    this.primaryflag=false;
    this.secondaryflag=true;
    this.detailseditflag=false;
    this.addresseditflag=false;
    this.identificationeditflag=false;
    this.insuranceeditflag=false;
    this.primaryeditflag=false;
    this.secondaryeditflag=true;
    this.participantflag = false;
    this.participanteditflag=false;
    this.fileName='';
  } */
  get detailsClass(){
    return (this.detailsflag || this.detailseditflag) ? 'menu-item1' : 'menu-item';
  }
  get addressClass(){
    return (this.addressflag || this.addresseditflag) ? 'menu-item1' : 'menu-item';
  }
  get identificationClass(){
    return (this.identificationflag || this.identificationeditflag) ? 'menu-item1' : 'menu-item'; 
  }
  get insuranceClass(){
    return (this.insuranceflag || this.insuranceeditflag) ? 'menu-item1' : 'menu-item';
  }
  get primaryClass(){
    return (this.primaryflag || this.primaryeditflag) ? 'menu-item1' : 'menu-item';
  }
  get participantClass(){
    return (this.participantflag || this.participanteditflag) ? 'menu-item1' : 'menu-item';
  }

  onFileUpload(event) {       
    this.isattachError=false;
    if (event.target.files.length > 0) {
        this.selectedFilesToUpload = event.target.files;      
        this.file = this.selectedFilesToUpload[0];
        this.fileName = this.selectedFilesToUpload[0].name.split(" ").join("");
        this.fileType = this.selectedFilesToUpload[0].type;
        this.fileSize = this.selectedFilesToUpload[0].size;     
       
        if (!this.fileType.startsWith('image/')) {
          this.isattachError = true;
          this.imageerror='Only image files are allowed';
          return;
      }
        
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
  }
  @track originalstaffoptions = [];
  @track originalselectedroles = [];

  handleStaffChange(event) {
   /*  this.originalstaffoptions = this.staffOptions;
    this.originalselectedroles = this.selectedRoles;
    console.log('this.origiinalselectedroles'+JSON.stringify(this.originalselectedroles));
    console.log('this.originalstaffoptions'+JSON.stringify(this.originalstaffoptions)); */
    this.selectedRoles = event.detail.value;
    console.log('Updated selected roles: ' + JSON.stringify(this.selectedRoles));
    //this.handleUpdateStaff();
  }

  // Update the backend with selected roles
  handleUpdateStaff() {
    console.log('staffids'+JSON.stringify(this.selectedRoles));
    console.log('role'+this.role);
    console.log('clientId'+this.clientId);
    updateStaffAssignments({ clientId: this.clientId, staffIds: this.selectedRoles ,roleId:this.role}).then(() => {
      console.log('Successfully updated staff assignments in the backend.');
      this.participanteditflag=false;  
      this.dispatchEvent(
          new ShowToastEvent({
              title: 'Success',
              message: 'Records inserted successfully',
              variant: 'success'
          })
      );  
      this.participantflag = true; 
      //this.getStaffValues();
      setTimeout(() => {
       // refreshApex(this.wiredClientResult);
      
        refreshApex(this.wiredStaffResult);
    }, 3000);
     
    })
    .catch(err => {
        console.error('Error updating staff assignments in the backend: ', err);
        // Optionally show an error message to the user
    });
  }

 /* getStaffValues() {
    console.log('get Staff Values by Client >> ' + this.clientId);
    // Call Apex method to get staff data, including which staff are already assigned to the participant
    getStaffData({ clientId: this.clientId, facilityId: this.facilityId, role: this.role }).then(response => {
        this.staffOptions = response.map(record => ({
            value: record.Id,
            label: record.Name
        }));
        console.log('Staff options: ' + JSON.stringify(this.staffOptions));
        console.log('staffValue response :' + JSON.stringify(response));
        this.staffVal = this.staffOptions[0].label;
        console.log('Staff options: ' + JSON.stringify(this.staffVal));

        // Check if there are any user-selected values; if not, default to pre-assigned staff
        if (!this.selectedRoles || this.selectedRoles.length === 0) {
            this.selectedRoles = response
                .filter(record => record.isAssigned) // Assuming 'isAssigned' indicates if the staff is already selected
                .map(record => record.Id);
        }
        console.log('Selected staff: ' + JSON.stringify(this.selectedRoles));
    })
    .catch(err => {
        console.error('Error fetching staff values: ', err);
    });
  }*/

}