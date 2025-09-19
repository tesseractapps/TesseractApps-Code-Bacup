import { LightningElement, track, wire, api } from 'lwc';
import fetchFacilitiess from '@salesforce/apex/ClientDataController.fetchFacilitiess';
import statusClient from '@salesforce/apex/ClientDataController.statusClient';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import My_Resource from "@salesforce/resourceUrl/myResource";
import {RefreshEvent} from 'lightning/refresh';
import getEmployeeData from '@salesforce/apex/issueRegisterSearch.getEmployeeData';
import insertStaffRecords from '@salesforce/apex/ClientDataController.insertStaffRecords';
import getStaffData from '@salesforce/apex/ClientDataController.getStaffData';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';


export default class ClientDataWithPagination extends NavigationMixin(LightningElement) {
    Search = My_Resource + '/myResource/images/Participants.svg';
    // JS Properties
    recordId;
    subscription = {};
    CHANNEL_NAME = '/event/RefreshDataTable__e';
    records = []; //All records available in the data table
    columns = []; //columns information available in the data table
    totalRecords = 0; //Total no.of records
    pageSize; //No.of records to be displayed per page
    totalPages; //Total no.of pages
    pageNumber = 1; //Page number    
    recordsToDisplay = []; //Records to be displayed on the page
    @track refreshTable = [];
    @track recordsToDisplay = [];   
    @api selectedName = '';
    @api facilityButton;
    @track orgNam = '';
    selectedfields = [];
    @track visible = false;
    @track firstname='';
    @track lastname='';
    @track ParticpantRecordForm;
    @track participantJson={};
    @track headerName;
    @track buttonLabel;
    @track noRecordsFlag=true;
    @track showSpinner = false;
    @track status;
    @track fullName;
    @track showSpinner = false;
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
    @track cardview=true;
    @track lastName='';
    @track firstName='';
    @track OrgNisationRoles=[];
    @track facilityId = ''; 
    @track staffOptions = [];
    @track selectedRoles = []; // For selected staff
    @track role = '';
    @track roleStaffFlag=false;
    @track headeringName;
    @track addStaffDisable = true;
    @track participantlabel='All';
    @track toggleValue = false;

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
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
    // connectedCallback method called when the element is inserted into a document
    connectedCallback() {
        //Platform Event 
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            this.subscription = response;
        });
        onError(error => {
            
        });
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
         
        //changes made by maheswari to add fatchFacilities method
        fetchFacilitiess({recordId : this.selectedName, firstname: this.firstname, lastname: this.lastname}).then(response => {
            //console.log('response>>>',response);
            this.refreshTable= response;               
                this.records = response;
                if (Array.isArray(response)) {
                    response.forEach(item => {
                        this.participantJson[item.Id] = {
                            "street": item.Address__Street__s,
                            "city": item.Address__City__s,
                            "stateCode": item.Address__StateCode__s,
                            "countryCode": item.Address__CountryCode__s,
                            "postalCode": item.Address__PostalCode__s,
                            "status": item.Status__c,
                            "lastname":item.Last_Name__c,
                            "firstname":item.First_Name__c
                        };
                    });
                   this.noRecordsFlag=true;
                }else{
                    this.noRecordsFlag=false;
                }
         //       console.log('Fetch Participant>>>'+ JSON.stringify(response));
                this.totalRecords = response.length; // update total records count                 
                this.pageSize = 12;
                if(this.totalRecords>6){
                    this.visible=true;
                }               
            this.paginationHelper(); // call helper menthod to update pagination logic          
            this.ParticpantRecordForm=false;
            this.getStaffValues();
        });
    }
    handleStatus(event) {
        
            this.toggleValue = event.target.checked; 
            console.log('Toggle status:', this.toggleValue);
        
    }
    
    handleFacilityChange(event) {    
      //  console.log('facility onchange '+(event.target)) ;                 
        this.facilityId = event.target.value; // Capture Facility ID
        this.getStaffValues(); // Fetch staff based on the new facility
        console.log('Selected facility >> ' + this.facilityId);
        this.addStaffDisable = !this.facilityId;
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
    }
    //changes made by maheswari to add firstname and lastname on fetchFacilitiess
   /*  @wire(fetchFacilitiess, { recordId: '$selectedName', firstname: '$firstname', lastname: '$lastname' }) recordsToDisplay(result) {
        this.refreshTable = result;
        if (result.data) {
            this.records = result.data;
            if (Array.isArray(this.records)) {
                this.records.forEach(item => {
                    this.participantJson[item.Id] = {
                        "street": item.Address__Street__s,
                        "city": item.Address__City__s,
                        "stateCode": item.Address__StateCode__s,
                        "countryCode": item.Address__CountryCode__s,
                        "postalCode": item.Address__PostalCode__s,
                        "status": item.Status__c,
                        "orgId":item.Facility__r.Organisation__c,
                        "lastname":item.Last_Name__c,
                        "firstname":item.First_Name__c
                    };
                });
                this.noRecordsFlag=true;
            }else{
                this.noRecordsFlag=false;
            }
           
            this.totalRecords = result.data.length; // update total records count                 
            this.pageSize = 12;
            if (this.totalRecords > 6) {
                this.visible = true;
            }
            this.paginationHelper(); // call helper menthod to update pagination logic 
        }

    } */
    filterState = 'All';
    @track filteredRecords = [];
    handleToggleparticipant() {
        // Cycle through the filter states
        if (this.filterState === 'All') {
            this.filterState = 'Active';
        } else if (this.filterState === 'Active') {
            this.filterState = 'Inactive';
        } else {
            this.filterState = 'All';
        }
        console.log('total records'+JSON.stringify(this.refreshTable));
        // Apply filtering logic based on the filter state
        if (this.filterState === 'Active') {
            this.participantlabel='Active';
            this.filteredRecords = this.refreshTable.filter(record => record.Status__c === true );
            
        } else if (this.filterState === 'Inactive') {
             this.participantlabel='Inactive';
            this.filteredRecords = this.refreshTable.filter(record => record.Status__c === false );
        } else {
            this.participantlabel='All'
            this.filteredRecords = [...this.refreshTable]; // Show all users
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
    triggerFileInput() {
        this.template.querySelector('input[type="file"]').click();
    }



    // create a new facility
    handleCreateNewFacility() {
        this.ParticpantRecordForm=true;
        this.cardview=true;
        this.recordId ='';
        this.street ='';
        this.city ='';
        this.country ='';
        this.province ='';
        this.postalcode =''; 
        this.headerName='Create New Participant';
        this.buttonLabel='Save';
        this.errorMessage = '';
        this.saveButtonDisable = false;
        this.fileName='';
        this.visible=false;
        this.cardFlag = true;
        this.listFlag = false;
        this.staffName = '';
        this.firstName = '';
        this.lastName = '';
        this.facilityId = '';
        //this.addStaffDisable = !this.facilityId;
        this.addStaffDisable = true;

    }
    handleeditClose(){
        this.ParticpantRecordForm=false;
        this.cardview=true;
        this.cardFlag = true;
        this.visible = true;
    }

    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }
    @track editclientflag = false;
    @track clientid;
	@track fName = '';
    @track lName = '';
    handleEditFacility(event) {
       // this.ParticpantRecordForm=true;
        this.headerName='Update Participant ';
        this.buttonLabel='Update';
        let facId = event.currentTarget.dataset.id;
        this.clientid = facId;
        console.log('client id'+this.clientid);
        this.recordId = facId;
        console.log('record id'+this.recordId);
        this.name=this.participantJson[facId]["name"];
        this.street = this.participantJson[facId]["street"];
        this.city = this.participantJson[facId]["city"];
        this.country = this.participantJson[facId]["countryCode"];
        this.province =this.participantJson[facId]["stateCode"];
        this.postalcode = this.participantJson[facId]["postalCode"];
        //this.status = this.participantJson[facId]["status"];
        this.lName = this.participantJson[this.recordId]["lastname"];
        this.fName = this.participantJson[this.recordId]["firstname"];
        this.errorMessage = '';
        this.saveButtonDisable = false;
        this.cardview=false;
        this.fileName='';
        this.cardFlag = true;
        this.editclientflag = true;
       /*  this[NavigationMixin.Navigate]({
            // Pass in pageReference
            type: 'comm__namedPage',
            attributes: {
               pageName: 'partcipantnewmodule',
            },
            state: {
              c__propertyValue:this.recordId,
              c__orgID:this.selectedName
            },
          }); */
       // console.log('Participant Data ',JSON.stringify(this.participantJson));
    }
    handleChildEvent(){
        this.cardview = true;
        this.listFlag = false;
        this.editclientflag = false;
        refreshApex(this.refreshTable);
        this.fetchParticipant();
        
    }

    handleSubmit(event){
      //  console.log('in submit');
        event.preventDefault();// stop the form from submitting
        const fields = event.detail.fields;
        // alert(JSON.stringify(fields));
        fields.Address__Street__s = this.street;
        fields.Address__City__s =  this.city;
        fields.Address__StateCode__s = this.province;
        fields.Address__CountryCode__s = 'AU';
        fields.Address__PostalCode__s = this.postalcode;
        fields.Name=this.fullName;
        fields.Status__c = this.toggleValue;
      //  console.log('After fields>>'+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form').submit(fields);          
    }

    handleSuccess(event) { 
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.roleStaffFlag=false;
        this.dispatchEvent(toastEvent);
        this.ParticpantRecordForm=false;
        this.cardFlag = true;
        this.fetchParticipant();
        let staffRecID=event.detail.id;
        console.log('StaffRecId :'+staffRecID);
        console.log('SelectedStaff :'+this.staffName);
        if(staffRecID != null){
           
       
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
            });

            insertStaffRecords({ clientId: staffRecID,roleId: this.role,selectedStaff: this.staffName}).then(() => {
                this.participanteditflag=false;  
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Records inserted successfully',
                        variant: 'success'
                    })
                );  
                this.participantflag = true; 
                this.getStaffValues();
                this.selectedRoles = this.staffName;  
            })
            .catch(error => {
            // Handle error
                console.error('Error inserting record:', error);
            }); 
        }
        this.fetchParticipant();
        refreshApex(this.refreshTable);
        this.cardview=true;
    }
   /* handlefacStatus(event) {
        //this.showSpinner = true;
        let facId = event.currentTarget.dataset.id;
        let facstatus = event.target.dataset.name;
        let finalStatus;
        let message;
        if (facstatus == 'true') {
            finalStatus = 'false';
            message = 'Client is Inactive'
        }
        else if (facstatus == 'false') {
            finalStatus = 'true';
            message = 'Client is Active'
        }
        statusClient({ IdValue: facId, status: finalStatus }).then(response => {
            //this.showSpinner= false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: '',
                    message: message,
                    variant: 'success'
                })
            );
            //this.dispatchEvent(new RefreshEvent());
            refreshApex(this.refreshTable);
            this.fetchParticipant();
            
        });
    }*/
        @track handleStatusFlag=false;
        @track facId;
        @track facstatus;
        @track message;
        @track originalToggleState;
        @track toggleElement; 
        @track finalStatus;
            handlefacStatus(event){   
               // this.showSpinner = true;   
                this.toggleElement = event.target;
                this.handleStatusFlag=true;  
                 this.facId=event.currentTarget.dataset.id;
                 this.facstatus=event.target.dataset.name;
                 this.originalToggleState = this.facstatus;
                 
                if(this.facstatus == 'true'){
                   this.finalStatus='false';
                    this.message= 'Participant is Inactive'
                }
                else if(this.facstatus == 'false'){
                   this.finalStatus='true';
                   this.message= 'Participant is Active'
                }
               
            }
        
            handlestatuschange(){
                console.log('finalStatus'+this.finalStatus);
                console.log('facId'+this.facId);
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
                    this.fetchParticipant();
                    refreshApex(this.refreshTable);
                    
                    
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
        

    //changes made by maheswari code start
    handleClear() {
        let listOfsearchString = [];
        this.firstname = '';
        this.lastname = '';
        this.fetchParticipant();
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
          //  console.log('event detail'+JSON.stringify(event.detail)); 
            this.street=event.detail.street;
            this.city=event.detail.city;
            this.postalcode=event.detail.postalCode;
            this.province=event.detail.province;
            this.country=event.detail.country;           
        }
    }
   
    fetchParticipant(){
        this.showSpinner = true;
        fetchFacilitiess({recordId : this.selectedName, firstname: this.firstname, lastname: this.lastname}).then(response => {
           // console.log('response>>>',response);
            this.refreshTable= response; 
            if (Array.isArray(response)) {
                response.forEach(item => {
                    this.participantJson[item.Id] = {
                        "street": item.Address__Street__s,
                        "city": item.Address__City__s,
                        "stateCode": item.Address__StateCode__s,
                        "countryCode": item.Address__CountryCode__s,
                        "postalCode": item.Address__PostalCode__s,
                        "lastname":item.Last_Name__c,
                        "firstname":item.First_Name__c
                    };
                });
              //  console.log('Response>>'+JSON.stringify(this.participantJson)); 
            }      
                  
            this.records = response;
            console.log('Fetch Participant>>>'+ JSON.stringify(response));
            this.totalRecords = response.length; // update total records count                 
            this.pageSize = 12;
            if(this.totalRecords>6){
                this.visible=true;
            }
               
            this.paginationHelper(); // call helper menthod to update pagination logic           
            this.ParticpantRecordForm=false;
            this.showSpinner = false;
           // this.dispatchEvent(new RefreshEvent());
        }).catch(error=>{
            this.showSpinner = false;
        });
    }

    handleSearch(event) {
      //  console.log(event.target.label);
        var inp = this.template.querySelectorAll("lightning-input");
        let listOfsearchString = [];
        inp.forEach(function (element) {
            if (element.name == "fname") {
                this.firstname = element.value;
                listOfsearchString.push(element.value);
            }
            else if (element.name == "lname") {
                this.lastname = element.value;
                listOfsearchString.push(element.value);
            }
        }, this);
      //  console.log(JSON.stringify(listOfsearchString));
        this.fetchParticipant();
    } ////changes made by maheswari code end

    @track errorMessage = '';
    @track saveButtonDisable = false;

    /* @track name='';   
    @track nameError = false;
    @track phoneNumber = '';
    @track phoneErrorMessage = '';
    @track phoneFlag = false;
    @track saveButtonDisable = false;
    @track emailErrorMessage = '';
    @track emailFlag = false;
    handleNameChange(event){
        if(event.target.name == 'fname'){
            this.validateName(event);
        }
        if(event.target.name == 'lname'){
            this.validateName(event);
        }
         if(event.target.name == 'email'){
            this.emailCheckFunction(event);
        } 
    }
    validateName(event) {        
        const nameRegex = /^[a-zA-Z ]{2,32}$/;
        if (nameRegex.test(event.target.value)) {
            this.nameError = false;
            this.errorMessage = '';
            this.saveButtonDisable = false;
        } else {            
            this.nameError = true;
            this.errorMessage = 'The name must be in between 2 to 32 characters, and name cannot contain special characters or numbers.';
            this.saveButtonDisable = true;
        }
    } */
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
    handleChange(event) {
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        event.target.value = inputValue;
    }
    @track cardFlag=true;
    @track listFlag=false;

    get cardViewClass(){
        return this.cardFlag ? 'slds-box slds-size_1-of-6 slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-6 slds-align_absolute-center'; // you can use your custom class here.
        //'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse' : 'slds-box slds-size_1-of-4 slds-align_absolute-center slds-float_right slds-m-right_medium slds-theme_inverse'
    }

    get listViewClass(){
        return this.listFlag ? 'slds-box slds-size_1-of-6 slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-6 slds-align_absolute-center'; // you can use your custom class here.
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

    getStaffValues(){
        getEmployeeData().then(response => {
          this.staffOptions = response.map(record => ({ value: record.Id, label: record.Name })); 
          console.log('staff options '+JSON.stringify(this.staffOptions));  
          this.staffVal = this.staffOptions[0].label;
          this.staffVal1 = this.staffOptions1[0].labels
          console.log('staff Options label '+ this.staffOptions[0].label);
        }).catch(err => {
        
        });
    }
    
    handleStaffChange(event) {
        this.staffName = event.target.value;
        console.log('Staff Name >> '+ this.staffName);
    }
    handleSave(event) {
        if(this.staffName){
            this.roleStaffFlag=false;
            this.errorMessage='';
        }
        else{
            this.errorMessage='please select staff'
        }
    }

    handleStaffinsert() {
        insertStaffRecords({ clientId: this.clientId,selectedStaff: this.staffName}).then(() => {
          this.participanteditflag=false;  
          this.dispatchEvent(
              new ShowToastEvent({
                  title: 'Success',
                  message: 'Records inserted successfully',
                  variant: 'success'
              })
          );  
          this.participantflag = true; 
          this.getStaffValues();
          this.selectedRoles = this.staffName;           
        })
        .catch(error => {
          // Handle error
          console.error('Error inserting record:', error);
        });  
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

    handleAddMultiUsers() {
        this.roleStaffFlag = true;
      this.headeringName = 'Manage Staff Access';
     }
     
     handleEditStaffClose(){
        this.roleStaffFlag=false;
     }
}