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
import GOOGLE_API_KEY from '@salesforce/label/c.Google_Geocode_API_Key'; 


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
    @api orgAbn;
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
    @track handleAbnFlag = false;
    
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
    this.setPageSizeByZoomAndScreen(); // Initial setup

    // Add responsive listener
    window.addEventListener('resize', this.handleResize.bind(this));

    // Subscribe to Platform Event
    subscribe(this.CHANNEL_NAME, -1, this.handleEvent).then(response => {
        this.subscription = response;
    });

    onError(error => {
        // Handle platform event errors if needed
    });

    // Fetch facility data
    this.fetchFacilities();
}



setPageSizeByZoomAndScreen() {
    const zoomLevel = Math.round(window.devicePixelRatio * 100); // 100, 125, 150, etc.

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
        this.paginationHelper(); // Recalculate pages if size changed
    }
}

async fetchFacilities() {
    try {
        const response = await fetchFacilitiesByOrgId({
            recordId: this.selectedName,
            firstname: this.firstname
        });

        this.refreshTable = response;
        this.records = response;
        this.facilityJSONData = {};
        console.log('RESPONSE----' + JSON.stringify(response));

        if (Array.isArray(response)) {
            response.forEach(item => {
                this.facilityJSONData[item.Id] = {
                    name: item.Name,
                    street: item.Address__Street__s,
                    city: item.Address__City__s,
                    stateCode: item.Address__StateCode__s,
                    countryCode: item.Address__CountryCode__s,
                    postalCode: item.Address__PostalCode__s,
                    status: item.Status__c,
                    abn: item.ABN__c,
                    useorgabn: item.Use_Org_ABN__c
                };
            });
            console.log('this.facilityJSONData', JSON.stringify(this.facilityJSONData));
            this.noRecordsFlag = true;
        } else {
            this.noRecordsFlag = false;
        }

        this.totalRecords = response.length;
        this.visible = this.totalRecords > 6;
        this.paginationHelper();
        this.facEditFlag = false;

    } catch (error) {
        console.error('Error fetching facilities:', error);
        throw error; // Re-throw to be caught in calling function (like handleEdit)
    }
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
         window.removeEventListener('resize', this.handleResize.bind(this));
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
    confirmAbn(){
        this.handleAbnFlag=true;
    }
    handlecloseAbn(){
        this.handleAbnFlag=false;
        setTimeout(() => {
        const abnInput = this.template.querySelector('[data-id="abnInput"]');
        if (abnInput) {
            abnInput.focus();
        }
    }, 0);
      this.useOrgAbn = false; 
      this.abnfield = false;
    }
    @track ABN;
    @track useOrgAbn = false;
    @track abnfield = false;
     handleOrgAbnToggle(event) {
        this.useOrgAbn = event.target.checked;
        if (this.useOrgAbn) {
            this.handleAbnFlag=true;
            

        } else {
            this.ABN = ''; // or retain existing value if needed
            setTimeout(() => {
                this.template.querySelector('[data-id="abnInput"]').focus();
            }, 0); // Ensure focus after re-render
            this.abnfield = false;
        }
    }
    handleAbn(){
        this.ABN = this.orgAbn;
        this.handleAbnFlag = false;
        this.abnfield = true;
        const abnInput = this.template.querySelector('[data-id="abnInput"]');
    if (abnInput) {
        abnInput.blur(); // workaround to refresh
        abnInput.focus();
    }
    }
     handleAbnChange(event) {
        const input = event.target;
        this.ABN = input.value;
        console.log('Updated ABN:', this.ABN);
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
        this.ABN ='';
        this.useOrgAbn = false;
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
        this.ABN = this.facilityJSONData[facId]["abn"];
        this.useOrgAbn = this.facilityJSONData[facId]["useorgabn"];
        console.log(' abn ',this.facilityJSONData[facId]["abn"]); 
        console.log('useOrgAbn',this.facilityJSONData[facId]["useorgabn"]);
        
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
        this.ABN = this.facilityJSONData[facId]["abn"];
        this.useOrgAbn = this.facilityJSONData[facId]["useorgabn"];
        console.log('status'+this.status);
        this.toggleValue = this.status;
        console.log('toggleValue'+this.toggleValue);
        this.cardFlag = false;
        this.listFlag = false;
        this.facFlag = false;
        this.facilityflag = true;
        this.facilityeditflag = false;

    }
   /*  handleEdit(event){
       
        this.fetchFacilities();
         console.log('HANDLEDIT');
        setTimeout(()=>{
        this.facilityflag = true;
        this.facilityeditflag = true;
        let facId = event.currentTarget.dataset.id;
        this.name=this.facilityJSONData[facId]["name"];
        this.street = this.facilityJSONData[facId]["street"];
        this.city = this.facilityJSONData[facId]["city"];
        this.country = this.facilityJSONData[facId]["countryCode"];
        this.province =this.facilityJSONData[facId]["stateCode"];
        this.postalcode = this.facilityJSONData[facId]["postalCode"];
        this.status = this.facilityJSONData[facId]["status"];
        this.ABN = this.facilityJSONData[facId]["abn"];
        console.log('ABN:', this.ABN);
        console.log(' abn ',this.facilityJSONData[facId]["abn"]); 
        console.log('useOrgAbn',this.facilityJSONData[facId]["useorgabn"]);
        this.useOrgAbn = this.facilityJSONData[facId]["useorgabn"]; 
        if(this.useOrgAbn){
            this.abnfield =true;
        }else{
              this.abnfield = false;
        }
        this.fileName = '';
        },5000)
    
       
    } */
 async handleEdit(event) {
    let facId = event.currentTarget.dataset.id;

    // Show edit UI immediately
    this.facilityflag = true;
    this.facilityeditflag = true;

    try {
        // Wait for facility data to load
        await this.fetchFacilities();
        console.log('HANDLEDIT');

        // Access facility data
        const facility = this.facilityJSONData[facId];

        if (facility) {
            this.name = facility.name;
            this.street = facility.street;
            this.city = facility.city;
            this.country = facility.countryCode;
            this.province = facility.stateCode;
            this.postalcode = facility.postalCode;
            this.status = facility.status;
            this.ABN = facility.abn;
            this.useOrgAbn = facility.useorgabn;

            this.abnfield = this.useOrgAbn;
            this.fileName = '';

            console.log('ABN:', this.ABN);
            console.log('useOrgAbn:', this.useOrgAbn);
        } else {
            console.error('Facility not found for ID:', facId);
        }
    } catch (error) {
        console.error('Error fetching facilities:', error);
    }
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
    // handlesave(){
    //    // console.log('update facility');        
    //     //changes made by maheswari line no-232 add firstname
    //     fetchFacilitiesByOrgId({recordId : this.selectedName, firstname: this.firstname}).then(response => {
    //         this.refreshTable= response;               
    //         this.records = response;
    //         if (Array.isArray(response)) {
    //             response.forEach(item => {
    //                 this.facilityJSONData[item.Id] = {
    //                     "name": item.Name,
    //                     "street": item.Address__Street__s,
    //                     "city": item.Address__City__s,
    //                     "stateCode": item.Address__StateCode__s,
    //                     "countryCode": item.Address__CountryCode__s,
    //                     "postalCode": item.Address__PostalCode__s,
    //                     "status": item.Status__c
    //                 };
    //             });
    //         }
    //         this.totalRecords = response.length; // update total records count                 
    //         this.pageSize = 12;
    //         if(this.totalRecords>6){
    //             this.visible=true;
    //         }                
    //         this.paginationHelper(); // call helper menthod to update pagination logic                 
    //         this.facEditFlag=false;
    //     });
    // }
    handleeditClose(){
        this.facEditFlag=false;
    }
@track handleStatusFlag=false;
@track facId;
@track facstatus;
@track message;
@track originalToggleState;
@track toggleElement; 
@track facilityname;
    handlefacStatus(event) {
    this.handleStatusFlag = true;

    const dataset = event.currentTarget.dataset;

    this.toggleElement = event.currentTarget;
    this.facId = dataset.id;
    this.facstatus = dataset.name;
    this.originalToggleState = this.facstatus;
    this.facilityname = dataset.facilityname;

    if (this.facstatus === 'true') {
        this.finalStatus = 'false';
        this.message = 'Facility is Inactive';
    } else if (this.facstatus === 'false') {
        this.finalStatus = 'true';
        this.message = 'Facility is Active';
    }
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




    // handlestatuschange(){
    //     statusFacility({IdValue:this.facId,status:this.finalStatus}).then(response => {
    //         //this.showSpinner= false;
    //         this.dispatchEvent(
    //             new ShowToastEvent({
    //                 title: '',
    //                 message: this.message,
    //                 variant: 'success'
    //             })
    //         );
    //         this.dispatchEvent(new RefreshEvent());
    //         //setTimeout(this.fetchFacility(), 6000);
    //         this.handlesave();                  
    //         refreshApex(this.refreshTable);
    //         this.fetchFacility();
    //    });
    //    this.handleStatusFlag=false;  

    // }

    handlestatuschange() {
    statusFacility({ IdValue: this.facId, status: this.finalStatus }).then(response => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: '',
                message: this.message,
                variant: 'success'
            })
        );

        this.handleStatusFlag = false;

        // Fetch updated facilities
        fetchFacilitiesByOrgId({ recordId: this.selectedName, firstname: this.firstname })
            .then(response => {
                this.refreshTable = response;
                this.records = response;


                if (Array.isArray(response)) {
                    response.forEach(item => {
                        this.facilityJSONData[item.Id] = {
                            name: item.Name,
                            street: item.Address__Street__s,
                            city: item.Address__City__s,
                            stateCode: item.Address__StateCode__s,
                            countryCode: item.Address__CountryCode__s,
                            postalCode: item.Address__PostalCode__s,
                            status: item.Status__c
                        };
                    });
                }

                // Apply filtering mode: Active/Inactive
                this.applyFilters();         
                this.paginationHelper();    

                this.facEditFlag = false;
            });
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

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            const inputs = this.template.querySelectorAll('lightning-input');
            let listOfsearchString = [];

            inputs.forEach((element) => {
                if (element.name === 'fname') {
                    this.firstname = element.value;
                    listOfsearchString.push(element.value);
                }
            });

            this.fetchFacility(); // your method to call Apex or filter results
        }
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
         fields.Use_Org_ABN__c = this.useOrgAbn;
         fields.ABN__c = this.ABN;
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
            this.clearFieldErrors();
     }
    handleSuccess(event) { 
        this.facEditFlag=false;
        const toastEvent = new ShowToastEvent({
            title: "Success",
            message: "Changes Saved Successfully",
            variant: "success"
        });
        this.dispatchEvent(toastEvent);        
        //this.handlesave();
        this.ABN ='';
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
    
    /* handleError(event) {
        const errorMessage = event.detail.message;
        console.error('Error:', errorMessage);

        const abnField = this.template.querySelector('[data-id="abn"]');
        const emailField = this.template.querySelector('[data-id="email"]');

        if (errorMessage.includes('ABN__c duplicates value')) {
            abnField.setCustomValidity('This ABN is already in use.');
            abnField.reportValidity();
        }

        if (errorMessage.includes('Email__c duplicates value')) {
            emailField.setCustomValidity('This email is already in use.');
            emailField.reportValidity();
        }
    }

    clearFieldErrors() {
        const fields = this.template.querySelectorAll('lightning-input-field');
        fields.forEach(field => {
            field.setCustomValidity('');
            field.reportValidity();
        });
    } */

   /*  handleError(event) {
    const error = event.detail;
    // This logs the error and you can inspect it
    console.log('Error:', JSON.stringify(error));
 
    } */

firstname = '';
activeFilterOn = false;
inactiveFilterOn = false;
handleSearchInput(event) {
    this.firstname = event.target.value;
    this.applyFilters();
}

handleSearchKeyPress(event) {
    this.firstname = event.target.value;
    this.applyFilters();
}

handleClear() {
    this.firstname = '';
    this.applyFilters();
}
handleActiveToggle() {
    if (this.activeFilterOn) {
        this.activeFilterOn = false; // turn off
    } else {
        this.activeFilterOn = true;
        this.inactiveFilterOn = false;
    }
    this.applyFilters();
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
            title: 'Save Failed',
            message: message,
            variant: 'error',
            
        })
    );
}
 handleError1(event) {
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

handleInactiveToggle() {
    if (this.inactiveFilterOn) {
        this.inactiveFilterOn = false; // turn off
    } else {
        this.inactiveFilterOn = true;
        this.activeFilterOn = false;
    }
    this.applyFilters();
}

applyFilters() {
    let result = [...this.refreshTable];

    if (this.firstname && this.firstname.trim() !== '') {
        result = result.filter(fac =>
            fac.Name && fac.Name.toLowerCase().includes(this.firstname.toLowerCase())
        );
    }

    if (this.activeFilterOn && !this.inactiveFilterOn) {
        result = result.filter(fac => fac.Status__c === true);
    } else if (this.inactiveFilterOn && !this.activeFilterOn) {
        result = result.filter(fac => fac.Status__c === false);
    }
    // if both filters are off, show all matching names

    this.filteredRecords = result;
    this.records = result;
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


}