import {LightningElement,track,wire,api} from 'lwc';
import fetchFacilitiesByOrgId from '@salesforce/apex/FacilityController.fetchFacilitiesByOrgIdCommunity';
import statusFacility from '@salesforce/apex/FacilityController.statusFacility';
//import fetchFacility from '@salesforce/apex/FacilityController.fetchFacility';
//import updateFacility from '@salesforce/apex/FacilityController.updateFacility';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { NavigationMixin } from 'lightning/navigation';
import {refreshApex} from '@salesforce/apex';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import FACILITY_OBJECT from '@salesforce/schema/Facility__c';
import SERVICES_FIELD from '@salesforce/schema/Facility__c.Services__c';
import My_Resource from "@salesforce/resourceUrl/myResource";
import {RefreshEvent} from 'lightning/refresh';


export default class FacilityDataCommunity extends NavigationMixin (LightningElement)  {
    recordId;
    subscription = {};
    CHANNEL_NAME = '/event/RefreshDataTable__e'; 
    records = []; //All records available in the data table    
    totalRecords = 0; //Total no.of records
    pageSize; //No.of records to be displayed per page
    totalPages; //Total no.of pages
    pageNumber = 1; //Page number    
    recordsToDisplay = []; //Records to be displayed on the page
    @track refreshTable=[];
    @track recordsToDisplay=[];
    @api selectedName;
    @api facilityButton;
    @track orgNam='';
    @track visible=false;
    @track isServiceModel=false;
    @track facilityName;
    @track servicePicklist;
    @track lstOptions=[];
    @track facEditFlag=false;
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalcode;
    @track name;
    @track status;
    @track phone;
    @track manger;
    @track service;
    @track email;
    @track firstname;
    @track headeringName;
    @track facilityJSONData = {};
    @track buttonName ='';
    @track noRecordsFlag =true;
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
    @track toggleValue = false;
    @track facilitylabel = 'All';
    @track sectionFlags = {
        Facility: true,
        Addressdetails: false,
        Facility1: true,
    };
    
    // Icons for the toggle buttons
    @track sectionIcons = {
        Facility: '\u2B9F', 
        Addressdetails: '\u2B9C',
        Facility1: '\u2B9F', 
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
    handleStatus(event) {
        
        if (event.target.name === 'checkbox') {
            this.toggleValue = event.target.value; // Use 'value' for checkboxes
            console.log('Checkbox value:', this.toggleValue);
        } else if (event.target.name === 'toggle') {
            this.toggleValue = event.target.checked; // Use 'checked' for toggles
            console.log('Toggle status:', this.toggleValue);
        }
    }
    
    facility = My_Resource+'/myResource/images/facility.svg';
   
    
    @wire(getObjectInfo, { objectApiName: FACILITY_OBJECT })
    objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName:  SERVICES_FIELD})
    servicePicklist(data, error){
        if(data && data.data && data.data.values){
            data.data.values.forEach( objPicklist => {
                this.lstOptions.push({
                    label: objPicklist.label,
                    value: objPicklist.value
                });
            });
        } else if(error){
            //console.log(error);
        }
    };
    
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    // connectedCallback method called when the element is inserted into a document
    connectedCallback() {
       
        //Platform Event 
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {            
            this.subscription = response;
        });

        onError(error => {
            //.error('Received error from server: ', error);
        });
        //changes made by maheswari line no-89 add firstname
        //console.log('Before Connected Callback>>'+this.selectedName);
        fetchFacilitiesByOrgId({recordId : this.selectedName, firstname: this.firstname}).then(response => {
            //console.log('res '+JSON.stringify(response));
            this.refreshTable= response;               
                this.records = response;
                if (Array.isArray(response)) {
                    response.forEach(item => {
                        this.facilityJSONData[item.Id] = {
                            "name": item.Name,
                            "street": item.Address__Street__s,
                            "city": item.Address__City__s,
                            "stateCode": item.Address__StateCode__s,
                            "countryCode": item.Address__CountryCode__s,
                            "postalCode": item.Address__PostalCode__s,
                            "status": item.Status__c
                        };
                    });
                    this.noRecordsFlag=true;
                }else{
                    this.noRecordsFlag=false;
                }
               console.log('Facility JSNON Data >>'+JSON.stringify(this.facilityJSONData));
                this.totalRecords = response.length; // update total records count                 
                this.pageSize = 12;
                if(this.totalRecords>6){
                    this.visible=true;
                }
               
            this.paginationHelper(); // call helper menthod to update pagination logic 
          
            this.facEditFlag=false;
        });
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
           // console.log('Successfully unsubscribed');
        });
    }
    filterState = 'All';
    @track filteredRecords = [];
    handleToggleUsers() {
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
            this.facilitylabel='Active';
            this.filteredRecords = this.refreshTable.filter(record => record.Status__c === true );
            
        } else if (this.filterState === 'Inactive') {
             this.facilitylabel='Inactive';
            this.filteredRecords = this.refreshTable.filter(record => record.Status__c === false );
        } else {
            this.facilitylabel='All';
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

   
    // create a new facility
    handleCreateNewFacility(){
        this.facEditFlag = true;
        this.recordId = '';
        this.headeringName = 'Create New Facility';
        this.name='';
        this.street ='';
        this.city ='';
        this.country ='';
        this.province ='';
        this.postalcode =''; 
        this.buttonName = 'Save';
        this.errorMessage = '';
        this.fileName='';
        this.saveButtonDisable = false;
        //this.cardFlag = false;
       // this.listFlag = false;
    }

    get isDesktop() {
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    handleEditFacility(event){
        let facId = event.currentTarget.dataset.id;
        this.recordId=facId;
        this.facEditFlag=true;
       // console.log('Address>>'+JSON.stringify(this.facilityJSONData));
        this.name=this.facilityJSONData[facId]["name"];
        this.street = this.facilityJSONData[facId]["street"];
        this.city = this.facilityJSONData[facId]["city"];
        this.country = this.facilityJSONData[facId]["countryCode"];
        this.province =this.facilityJSONData[facId]["stateCode"];
        this.postalcode = this.facilityJSONData[facId]["postalCode"];
        this.status = this.facilityJSONData[facId]["status"];
        this.toggleValue = this.status;
       /*  console.log(' facility ',JSON.stringify(this.facilityJSONData)); */
        
        this.headeringName = 'Update Facility';
        this.buttonName = 'Update';
        this.errorMessage = '';
        this.nameError= false;
        this.phoneFlag= false;
        this.saveButtonDisable = false;
        this.fileName='';
        this.cardFlag = true;
        this.listFlag = false;
        this.facFlag = true;
    }
    @track facviewFlag = false;
    @track facFlag = true;
    @track facilityflag = false;
    @track facilityeditflag = false;
    handleviewFacility(event){
        let facId = event.currentTarget.dataset.id;
        this.recordId=facId;
        this.facEditFlag=false;
        this.facviewFlag = true;
        this.name=this.facilityJSONData[facId]["name"];
        this.street = this.facilityJSONData[facId]["street"];
        this.city = this.facilityJSONData[facId]["city"];
        this.country = this.facilityJSONData[facId]["countryCode"];
        this.province =this.facilityJSONData[facId]["stateCode"];
        this.postalcode = this.facilityJSONData[facId]["postalCode"];
        this.status = this.facilityJSONData[facId]["status"];
        console.log('status'+this.status);
        this.toggleValue = this.status;
        console.log('toggleValue'+this.toggleValue);
        this.cardFlag = false;
        this.listFlag = false;
        this.facFlag = false;
        this.facilityflag = true;
        this.facilityeditflag = false;

    }
    handleEdit(event){
        this.facilityflag = true;
        this.facilityeditflag = true;
        this.fileName = '';
    }
    handleClose(event){
        console.log('hi');
        this.facilityflag = true;
        this.facilityeditflag = false;
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
           /*  console.log('event detail'+JSON.stringify(event.detail)); */ 
            this.street=event.detail.street;
            this.city=event.detail.city;
            this.postalcode=event.detail.postalCode;
            this.province=event.detail.province;
            this.country=event.detail.country;
           /*  console.log('poscid', this.province);
            console.log('poscid2', this.postalcode);
            console.log('poscid3', this.city);
           */

        }

    }
    handlesave(){
       // console.log('update facility');        
        //changes made by maheswari line no-232 add firstname
        fetchFacilitiesByOrgId({recordId : this.selectedName, firstname: this.firstname}).then(response => {
            this.refreshTable= response;               
            this.records = response;
            if (Array.isArray(response)) {
                response.forEach(item => {
                    this.facilityJSONData[item.Id] = {
                        "name": item.Name,
                        "street": item.Address__Street__s,
                        "city": item.Address__City__s,
                        "stateCode": item.Address__StateCode__s,
                        "countryCode": item.Address__CountryCode__s,
                        "postalCode": item.Address__PostalCode__s,
                        "status": item.Status__c
                    };
                });
            }
            this.totalRecords = response.length; // update total records count                 
            this.pageSize = 12;
            if(this.totalRecords>6){
                this.visible=true;
            }                
            this.paginationHelper(); // call helper menthod to update pagination logic                 
            this.facEditFlag=false;
        });
    }
    handleeditClose(){
        this.facEditFlag=false;
    }
@track handleStatusFlag=false;
@track facId;
@track facstatus;
@track message;
@track originalToggleState;
@track toggleElement; 
    handlefacStatus(event){   
       // this.showSpinner = true;   
       this.toggleElement = event.target;
       this.handleStatusFlag=true;  
         this.facId=event.currentTarget.dataset.id;
         this.facstatus=event.target.dataset.name;
         this.originalToggleState = this.facstatus;
         
        if(this.facstatus == 'true'){
           this.finalStatus='false';
            this.message= 'Facility is Inactive'
        }
        else if(this.facstatus == 'false'){
           this.finalStatus='true';
           this.message= 'Facility is Active'
        }
       
    }

    handlestatuschange(){
        statusFacility({IdValue:this.facId,status:this.finalStatus}).then(response => {
            //this.showSpinner= false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: '',
                    message: this.message,
                    variant: 'success'
                })
            );
            this.dispatchEvent(new RefreshEvent());
            //setTimeout(this.fetchFacility(), 6000);
            this.handlesave();                  
            refreshApex(this.refreshTable);
            this.fetchFacility();
            this.facilitylabel='All';
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
    servicesList(event){       
        this.isServiceModel=true;
        this.facilityName=event.currentTarget.dataset.name;
    }
    closeservicesList(){
       this.isServiceModel=false;
    }
    //changes made by maheswari code start
    handleClear() {
        let listOfsearchString = [];
        this.firstname = '';
        this.fetchFacility();
    }
    
    fetchFacility(){
        this.showSpinner = true;
        
        fetchFacilitiesByOrgId({recordId : this.selectedName, firstname: this.firstname}).then(response => {
          //  console.log('response>>>',response);
            this.refreshTable= response;               
                this.records = response;
                this.totalRecords = response.length; // update total records count                 
                this.pageSize = 12;
                if(this.totalRecords>6){
                    this.visible=true;
                }               
            this.paginationHelper(); // call helper menthod to update pagination logic           
            this.facEditFlag=false;
            this.showSpinner = false;
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
        }, this);
      //  console.log(JSON.stringify(listOfsearchString));
        this.fetchFacility();
    } 

    handleSubmit(event){
        // console.log('in submit');
         event.preventDefault();// stop the form from submitting
         const fields = event.detail.fields;
         let phone = fields.Phone__c;
         console.log('Original phone value:', phone);
         // Check if phone number starts with '0'
         if (phone && phone.charAt(0) !== '0') {
             console.log('Phone does not start with 0, appending 0...');
             phone = '0' + phone; // Append '0' if it doesn't start with '0'
         } else {
             console.log('Phone already starts with 0, no change needed.');
         }
 
         // Update the phone field with the modified value
         fields.Phone__c = phone;
         console.log('Updated phone value:', fields.Phone__c);
         // alert(JSON.stringify(fields));
         fields.Address__Street__s = this.street;
         fields.Address__City__s =  this.city;
         fields.Address__StateCode__s = this.province;
         fields.Address__CountryCode__s = 'AU';
         fields.Address__PostalCode__s = this.postalcode;
         fields.Status__c = this.toggleValue;
         // fields.Pre_Tax_Calculator__c = this.preTaxForSubmit;
         console.log('After fields>>'+JSON.stringify(fields));
         this.template.querySelector('lightning-record-edit-form').submit(fields);  
     }
    handleSuccess(event) { 
        this.facEditFlag=false;
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);        
        this.handlesave();
        this.nameError=false;
        this.phoneFlag=false;
        this.cardFlag = true;
        this.facEditFlag = false;
        this.facviewFlag = false;
        this.facFlag = true;
        let staffRecID=event.detail.id;
        if(this.fileName.length>0){
        uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:staffRecID, obj:'facility'}).then(result => {
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
    }
        setTimeout(() => {
            this.fetchFacility(); 
        }, 1500);
        
        

        //refreshApex(this.refreshTable);
    }//changes made by maheswaricode end

    @track errorMessage = '';
    @track saveButtonDisable = false;
    /* @track name='';
    @track errorMessage = '';
    @track nameError = false;
    @track phoneNumber = '';
    @track phoneErrorMessage = '';
    @track phoneFlag = false;
    @track saveButtonDisable = false;
    @track emailErrorMessage = '';
    @track emailFlag = false;
    handleNameChange(event){
        if(event.target.name == 'name'){
            this.validateName(event);
        }
        if(event.target.name == 'phone'){
            this.phoneValidate(event);
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
    }

    phoneValidate(event){
        const phoneRegex = /^\d{10}$/;
        if (phoneRegex.test(event.target.value)) {
            this.phoneFlag = false;
            this.phoneErrorMessage = ''; 
            this.saveButtonDisable = false;   
        } else {                    
            this.phoneFlag = true;
            this.phoneErrorMessage = 'Please enter a 10-digit phone number, and Phone number must contain only digits.';
            this.saveButtonDisable = true;   
        }
    }

    emailCheckFunction(event){
        // var validRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        var validRegex = /^\w+([\.-]?\w+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,3})+(\.(gov|com|org|co)(\.au)?)?$/;

        if (!event.target.value) {
            // If it's empty, reset error message and enable the save button
            this.emailErrorMessage = '';
            this.saveButtonDisable = false;
            this.emailFlag = false;
            return; // Exit the function
        }
        if (event.target.value.match(validRegex)) {
            this.emailErrorMessage='';
            this.saveButtonDisable=false;
            this.emailFlag = false;
        console.log('valid email')
        } else {        
            console.log(' in valid  email');
            this.emailFlag = true;
            this.emailErrorMessage='Please Enter valid Email';
            this.saveButtonDisable=true;        
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
        // console.log('fileName>>',this.fileName);
        // console.log('file prepared');
        
        
        
    }  
    handleChange(event) {
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        event.target.value = inputValue;
    }

    @track cardFlag=true;
    @track listFlag=false;
    handleBack(event){
        this.cardFlag=true;
        this.facEditFlag=false;
        this.facviewFlag=false;
        this.facFlag=true;
    }

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
    
}