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

const actions = [
    { label: 'Edit', name: 'edit' },
    { label: 'Delete', name: 'delete' },
];

export default class ClientSearchLWC extends NavigationMixin (LightningElement) {
    // client records are displyed card view by default
    value = 'cardview';
    
    Search = My_Resource+'/myResource/images/Participants.svg';

    // JS Properties
    @track  availablePatients=[];
    @api recordId;
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
    @track noRecordsFlag=true;
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
    @track state;
   
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
        ParticipantDetails: '\u2B9F', 
        Addressdetails: '\u2B9C',
        IdentificationDetails: '\u2B9C',
        InsuranceDetails: '\u2B9C',
        PrimaryContactDetails: '\u2B9C',
        SecondaryContactDetails: '\u2B9C',   
    };
    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id; // Get section ID from data-id attribute

        // Toggle the flag and update the icon dynamically
        this.sectionFlags[sectionId] = !this.sectionFlags[sectionId];
        this.sectionIcons[sectionId] = this.sectionFlags[sectionId] ? '\u2B9F' : '\u2B9C';
    }

    handleChange1(event){
        let inputValue = event.target.value;
        inputValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1);
        event.target.value = inputValue;
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

        //Platform Event 
        subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
            this.subscription = response;
        });
        onError(error => {
            
        }); 
        //Manimala added 165-174
        organizationDetails().then(response => {
            console.log('listofPriceBook:', JSON.stringify(response));
            let orgRoles= response.listofPriceBook.Roles__c;
            this.state =response.listofPriceBook.Address_Latest__StateCode__s;
           
            console.log('state:', response.listofPriceBook.Address_Latest__StateCode__s);
            this.OrgNisationRoles = orgRoles.split(";").sort().map(rec => {
              return {
              value: rec,
              label: rec
              };
            });
        }) ;
        this.isHome=true;
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
            this.filteredRecords = this.records1.filter(record => record.Status__c === true );
            
        } else if (this.filterState === 'Inactive') {
             this.participantlabel='Inactive';
            this.filteredRecords = this.records1.filter(record => record.Status__c === false );
        } else {
            this.participantlabel='All'
            this.filteredRecords = [...this.records1]; // Show all users
        }
    
        // Update total records and handle pagination
        this.records = this.filteredRecords;
        this.totalRecords = this.filteredRecords.length;
        console.log('total records'+this.totalRecords);
        //this.noRecordsFlag = this.totalRecords === 0;
        this.paginationHelper();
    }


    // Manimala added 177-188
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
        this.refreshTable= result;
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
                        "lastName":item.Last_Name__c,
                        "firstName":item.First_Name__c
                    };
                });
                this.noRecordsFlag=true;
            }else{
                this.noRecordsFlag=false;
            }

            this.records1=result.data;
            this.totalRecords = result.data.length; // update total records count                 
            this.pageSize = 12;
            if(this.totalRecords>6){
                this.visible=true;
            }
            this.paginationHelper(); // call helper menthod to update pagination logic 
            this.isLoading=false;
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

    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    @track editstaffflag = false;
    handleEditFacility(event){
        let facId = event.currentTarget.dataset.id;
        this.editstaffflag = true;
        this.recordId=facId;
        this.isDetails=true;
        this.isHome = false;
        this.orgId=this.participantJson[facId]["orgId"];
        console.log('OrgId>>'+this.orgId);
        this.headerName='Update Participant';
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
    }

    modalCloseHandler(){
        console.log('Parent Component Fired');
       // this.showModal = false
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
                    this.fetchParticipant();
                    
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
        return this.cardFlag ? 'slds-box slds-size_1-of-4 slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-4 slds-align_absolute-center'; // you can use your custom class here.
    }

    get listViewClass(){
        return this.listFlag ? 'slds-box slds-size_1-of-4 slds-align_absolute-center slds-theme_inverse' : 'slds-box slds-size_1-of-4 slds-align_absolute-center'; // you can use your custom class here.
    }  

    handleCreateNewFacility(){
        this.ParticpantRecordForm=true;
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
        //this.isDetails = false;
        this.isHome = false;
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
            message: "Changes Saved Successfully",
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
        fetchFacilitiess().then(response=>{
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
        });
        //Manimala added 565-581
        insertStaffRecords({ clientId: staffRecID,selectedStaff: this.staffName}).then(() => {
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

    handleSubmit(event){
        console.log('in submit');
        event.preventDefault();// stop the form from submitting
        const fields = event.detail.fields;
        fields.Address__Street__s = this.street;
        fields.Address__City__s =  this.city;
        fields.Address__StateCode__s = this.province;
        fields.Address__CountryCode__s = 'AU';
        fields.Address__PostalCode__s = this.postalcode;
        fields.Name=this.fullName;
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

    fetchParticipant(){
        fetchFacilitiess().then(response=>{
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
    handleAddMultiUsers() {
        this.roleStaffFlag = true;
      this.headeringName = 'Add Multiple Staff';
     }
     
     handleEditStaffClose(){
        this.roleStaffFlag=false;
     }
     
}