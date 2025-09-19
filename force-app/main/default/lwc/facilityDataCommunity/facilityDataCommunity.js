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
import CURRENT_USER_ID from '@salesforce/user/Id';
import getFacilityData from '@salesforce/apex/HrHomeHandler.fetchFacilitiess';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import UserType from '@salesforce/schema/User.User_Type__c';
import typeOfUser from '@salesforce/schema/User.Type_of_User__c';

import getFacilityCurrentUser from '@salesforce/apex/PortalUserController.getFacilityCurrentUser';
import orgDetailsCommunity from "@salesforce/apex/OrgDetails.orgDetailsCommunity";
import generateCustomGUID from "@salesforce/apex/OrgDetails.generateCustomGUID";
import generateSoftwareID from "@salesforce/apex/GovReportsSoftwareID.generateSoftwareID";


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
        PayrollSettings:true,
        PayrollSettings1:true,
        Roster:true,
        RosterManagement: true
    };
    @track handleAbnFlag = false;

    @track facilityOptions=[];
    @track selectedFacilities=[];
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole;
    @track userType;
    @track usererror;
    @track userFacilities=[];
    @track finalListFacilities=[];
    @track BMSconfirmMessgeTemplate=false;
    @track SoftwareIDconfirmMessgeTemplate=false;
    @track BMSIDValue;
    @track softwareIDValue;
    @track isBMSIDDisbale=true;
    @track bmsIdButtonDisable=true;
    @track isSoftwareIdDisable=false;
    @track softwareButtonDisbale=false;
    @track wiredOrgResult;
    @track ABNNumber;
    @track orgDetails;
    @track agentName;
    @track taxAgency;
    @track taxAgencyNumber;
    @track useOrgPayrollSettings=false;
    @track generalshiftcolor='';
    @track morningshiftcolor='';
    @track afternoonshiftcolor='';
    @track nightshiftcolor='';
    @track customshiftcolor='';
    @track sleepovershiftcolor='';
    @track NdisFlag;
    @track typeofuser;

    @track generalShiftStartTime;
    @track generalShiftEndTime;

    @track morningShiftStartTime;
    @track morningShiftEndTime;

    @track afternoonShiftStartTime;
    @track afternoonShiftEndTime;

    @track nightShiftStartTime;
    @track nightShiftEndTime;

    @track customShiftStartTime;
    @track customShiftEndTime;

    @track sleepoverShiftStartTime;
    @track sleepoverShiftEndTime;

    @track costPerKmElectric=0;
    @track costPerKmFuel=0;
    
    // Icons for the toggle buttons
    @track sectionIcons = {
        Facility: '\u2B9F', 
        Addressdetails: '\u2B9C',
        Facility1: '\u2B9F', 
        PayrollSettings: '\u2B9F',
        RosterManagement: '\u2B9F',
        PayrollSettings1:'\u2B9F',
        Roster:'\u2B9F'
    };
      colorOptions = [
        { label: 'Light Red', value: '#FFADAD', style: 'background-color: #FFADAD; color: black;' },
        { label: 'Light Orange', value: '#FFD6A5', style: 'background-color: #FFD6A5; color: black;' },
        { label: 'Light Yellow', value: '#FDFFB6', style: 'background-color: #FDFFB6; color: black;' },
        { label: 'Light Green', value: '#CAFFBF', style: 'background-color: #CAFFBF; color: black;' },
        { label: 'Light Blue', value: '#9BF6FF', style: 'background-color: #9BF6FF; color: black;' },
        { label: 'Pale Blue', value: '#A0C4FF', style: 'background-color: #A0C4FF; color: black;' },
        { label: 'Lavender', value: '#DDD8FF', style: 'background-color: #DDD8FF; color: black;' },
        { label: 'Light Pink', value: '#FFC6FF', style: 'background-color: #FFC6FF; color: black;' },
        { label: 'Light Beige', value: '#FDE8B3', style: 'background-color: #FDE8B3; color: black;' },
        { label: 'Light Aqua', value: '#C6EAED', style: 'background-color: #C6EAED; color: black;' },
        { label: 'Soft Yellow', value: '#E4E87E', style: 'background-color: #E4E87E; color: black;' },

        { label: 'Magenta Pink', value: '#AE016A', style: 'background-color: #AE016A; color: white;' },
        { label: 'Vibrant Blue', value: '#0C7CEC', style: 'background-color: #0C7CEC; color: white;' },
        { label: 'Burnt Orange', value: '#D35701', style: 'background-color: #D35701; color: white;' },
        { label: 'Deep Navy', value: '#0E185F', style: 'background-color: #0E185F; color: white;' },
        { label: 'Teal Green', value: '#0D815C', style: 'background-color: #0D815C; color: white;' }
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
   // this.fetchFacilities();
}

@wire(getRecord, { recordId: CURRENT_USER_ID, fields: [UserNameFld ,UserEmail,UsrRoleName,UserType,typeOfUser]}) 
     userDetails({error, data}) {
         if (data) {
             this.currentUser = data.fields.Name.value; 
             this.currentUserEmail=data.fields.Email.value;
             this.currentUserRole =data.fields.User_Role__c.value;
             this.userType=data.fields.User_Type__c.value;
             this.typeofuser =data.fields.Type_of_User__c.value;
              console.log('role==>'+this.currentUserRole);
              console.log('current logged in user==>'+this.currentUser) ; 
               console.log('current logged in email==>'+ this.currentUserEmail) ;
              console.log('current logged in userType==>'+ this.userType) ;
                console.log('Fetching facility data from Apex...');
              
                getFacilityData().then(response => {
                    console.log('Facility data fetched successfully:', response);
                    this.finalListFacilities=[];
                    this.selectedFacilities=[];
                    this.facilityOptions = response.map(record => ({
                        label: record.Name,
                        value: record.Id
                    }));
                    if( this.userType =='NDIS Org Admin' || this.userType == 'ICT Admin'){
                        this.finalListFacilities=this.facilityOptions  ;
                           console.log('Mapped facility options: FOR ORG ADMIN', JSON.stringify(this.finalListFacilities));
                           if(this.userType =='NDIS Org Admin'){
                               this.NdisFlag = true;
                           }
                             this.fetchFacilities();
                            
                    }else if((this.userType =='Facility Admin' || this.userType =='HR Admin') ){
                                    if(this.typeofuser =='NDIS') {
                                      this.NdisFlag = true;
                                    }
                              
                                    getFacilityCurrentUser().then(result => {
                                        console.log('getFacilityCurrentUser facility   '+JSON.stringify(result));
                                             this.finalListFacilities =  result.map(record => ({
                                                                        label: record.Facility__r.Name,
                                                                        value: record.Facility__r.Id
                                                               })); 
                                            this.fetchFacilities();
                                           
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

                } else if (error) {  
                        this.usererror = error ;
          }
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

        let finalFacilityList = [];

        if (this.userType === 'NDIS Org Admin' || this.userType === 'ICT Admin') {
            finalFacilityList = response;
        } else if (
            this.userType === 'Facility Admin' ||
            this.userType === 'HR Admin' ||
            this.userType === 'NDIS Lead'
        ) {
            // 🛠️ FIX: Proper filtering using .filter() instead of .map()
            const facilityIds = this.finalListFacilities.map(f => f.value);
            finalFacilityList = response.filter(rec => facilityIds.includes(rec.Id));
        }

        // Set filtered list
        this.refreshTable = finalFacilityList;
        this.records = finalFacilityList;

        // Build JSON data
        this.facilityJSONData = {};
        if (Array.isArray(finalFacilityList)) {
            finalFacilityList.forEach(item => {
                this.facilityJSONData[item.Id] = {
                    name: item.Name,
                    street: item.Address__Street__s,
                    city: item.Address__City__s,
                    stateCode: item.Address__StateCode__s,
                    countryCode: item.Address__CountryCode__s,
                    postalCode: item.Address__PostalCode__s,
                    status: item.Status__c,
                    abn: item.ABN__c,
                    useorgabn: item.Use_Org_ABN__c,
                    softwareId:item.Software_Id__c,
                    bmsIdentifier:item.BMS_Identifier__c,
                    agentName:item.Agent_Name__c,
                    taxAgency:item.Tax_Agency__c,
                    agentnumber:item.Agent_Number__c,
                    generalshiftcolor:item.General_Shift_Color__c,
                    morningshiftcolor:item.Morning_Shift_Color__c,
                    afternoonshiftcolor:item.Afternoon_Shift_Color__c,
                    nightshiftcolor:item.Night_Shift_Color__c,
                    sleepovershiftcolor:item.Sleepover_Shift_Color__c,
                    customshiftcolor:item.Custom_Shift_Color__c,

                    generalShiftStartTime:item.General_Shift_Start_Time__c,
                    generalShiftEndTime:item.General_Shift_End_Time__c,

                    morningShiftStartTime:item.Morning_Shift_Start_Time__c,
                    morningShiftEndTime:item.Morning_Shift_End_Time__c,

                    afternoonShiftStartTime:item.Afternoon_Shift_Start_Time__c,
                    afternoonShiftEndTime:item.Afternoon_Shift_End_Time__c,

                    nightShiftStartTime:item.Night_Shift_Start_Time__c,
                    nightShiftEndTime:item.Night_Shift_End_Time__c,

                    customShiftStartTime:item.Custom_Shift_Start_Time__c,
                    customShiftEndTime:item.Custom_Shift_End_Time__c,

                    sleepoverShiftStartTime:item.Sleepover_Shift_Strat_Time__c,
                    sleepoverShiftEndTime:item.Sleepover_Shift_End_Time__c,


                    costPerKmElectric:item.Cost_per_Km_Electric__c,
                    costPerKmFuel:item.Cost_per_Km_Fuel__c


                };
            });
            this.noRecordsFlag = true;
        } else {
            this.noRecordsFlag = false;
        }

        this.totalRecords = finalFacilityList.length;
        this.visible = this.totalRecords > 6;
        this.paginationHelper();
        this.facEditFlag = false;

        // ✅ Return filtered list (if needed in another call)
        return finalFacilityList;

    } catch (error) {
        console.error('❌ Error fetching facilities:', error);
        throw error;
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
        this.resetShiftTimes();
        this.resetShiftTimes();
        this.refreshPayrollSettinggs();
        this.refreshColors();
        this.disablePayrollSettingValue=false;
        this.bmsIdButtonDisable=false;
        this.disablePayrollSettingValue=false;
        this.softwareButtonDisbale=false;
    }
    @track ABN;
    @track useOrgAbn = false;
    @track abnfield = false;
   async  handleOrgAbnToggle(event) {
        this.useOrgAbn = event.target.checked;
        if (this.useOrgAbn) {
            this.handleAbnFlag=true;
            const data = await orgDetailsCommunity();
            console.log('org data in toggle  '+JSON.stringify(data))
            this.orgDetails = data;
            this.softwareIDValue = this.orgDetails.SoftwareId__c || '';

            this.agentName = this.orgDetails.Agent_Name__c || '';
            this.BMSIDValue = this.orgDetails.BMSI_Identifier__c || '';
            this.taxAgency = this.orgDetails.Tax_Agency__c || '';

            this.taxAgencyNumber = this.orgDetails.Agent_Number__c || '';
            this.disablePayrollSettingValue=true;
             this.bmsIdButtonDisable=true;
             this.softwareButtonDisbale=true;
             // this.generalShiftEndTime=this.orgDetails.General_Shift_End_Time__c ;
            this.generalShiftStartTime=this.orgDetails.General_Shift_Start_Time__c;
            this.generalShiftEndTime=this.orgDetails.General_Shift_End_time__c ;


            this.morningShiftStartTime=this.orgDetails.Morning_Shift_Start_Time__c;
            this.morningShiftEndTime=this.orgDetails.Morning_Shift_End_Time__c;

            this.afternoonShiftStartTime=this.orgDetails.Afternoon_Shift_Start_Time__c;
            this.afternoonShiftEndTime=this.orgDetails.Afternoon_Shift_End_Time__c;

            this.nightShiftStartTime=this.orgDetails.Night_Shift_Start_Time__c;
            this.nightShiftEndTime=this.orgDetails.Night_Shift_End_Time__c;

            this.customShiftStartTime=this.orgDetails.Custom_Shift_Start_Time__c;
            this.customShiftEndTime=this.orgDetails.Custom_Shift_End_Time__c;

            this.sleepoverShiftStartTime=this.orgDetails.Sleepover_Start__c;
            this.sleepoverShiftEndTime=this.orgDetails.Sleepover_Shift_End_Time__c;

            this.generalshiftcolor = String(this.orgDetails.Generalshiftcolor__c || '');
            console.log('General Shift Color (as string):', this.generalshiftcolor);

            this.afternoonshiftcolor = String(this.orgDetails.Afternoonshiftcolor__c || '');
            console.log('Afternoon Shift Color (as string):', this.afternoonshiftcolor);

            this.nightshiftcolor = String(this.orgDetails.Nightshiftcolor__c || '');
            console.log('Night Shift Color (as string):', this.nightshiftcolor);

            this.customshiftcolor = String(this.orgDetails.customshiftcolor__c || '');
            console.log('Custom Shift Color (as string):', this.customshiftcolor);

            this.sleepovershiftcolor = String(this.orgDetails.Sleepover_Shift_Color__c || '');
            console.log('Sleepover Shift Color (as string):', this.sleepovershiftcolor);

            this.morningshiftcolor = String(this.orgDetails.Morningshiftcolor__c || '');
            console.log('Morning Shift Color (as string):', this.morningshiftcolor);


            this.costPerKmElectric= this.orgDetails.Mileage_Amount__c || 0,
            this.costPerKmFuel= this.orgDetails.Cost_per_Km_Electric__c || 0


        } else {
            this.ABN = ''; // or retain existing value if needed
            setTimeout(() => {
                this.template.querySelector('[data-id="abnInput"]').focus();
            }, 0); // Ensure focus after re-render
            this.abnfield = false;
             this.ABNNumber =  '';
            this.BMSIDValue =  '';
            this.softwareIDValue = '';

            this.agentName =  '';
            this.BMSIDValue =  '';
            this.taxAgency = '';

            this.taxAgencyNumber ='';
             this.bmsIdButtonDisable=false;
            this.disablePayrollSettingValue=false;
            this.softwareButtonDisbale=false;
            this.resetShiftTimes();
            this.resetShiftTimes();
            this.refreshPayrollSettinggs();
            this.refreshColors();
        }


        /*  if(this.BMSIDValue ==''|| this.BMSIDValue ==null  || this.BMSIDValue ==undefined ){
                this.bmsIdButtonDisable=false;
            }else{
                 this.bmsIdButtonDisable=true;
                
        }

        if(this.softwareIDValue ==''|| this.softwareIDValue ==null  || this.softwareIDValue ==undefined ){
                this.softwareButtonDisbale=false;
            }else{
                 this.softwareButtonDisbale=true;
            } */
       
    }
    resetShiftTimes() {
    this.generalShiftStartTime = '';
    this.generalShiftEndTime = '';

    this.morningShiftStartTime = '';
    this.morningShiftEndTime = '';

    this.afternoonShiftStartTime = '';
    this.afternoonShiftEndTime = '';

    this.nightShiftStartTime = '';
    this.nightShiftEndTime = '';

    this.customShiftStartTime = '';
    this.customShiftEndTime = '';

    this.sleepoverShiftStartTime = '';
    this.sleepoverShiftEndTime = '';
}
refreshPayrollSettinggs(){
        this.ABNNumber =  '';
        this.BMSIDValue =  '';
        this.softwareIDValue = '';

        this.agentName =  '';
        this.BMSIDValue =  '';
        this.taxAgency = '';

        this.taxAgencyNumber ='';
}
refreshColors(){
    this.generalshiftcolor='';
    this.afternoonshiftcolor = '';
    this.nightshiftcolor = '';
    this.customshiftcolor = '';
    this.sleepovershiftcolor = '';
    this.morningshiftcolor = '';
    this.costPerKmElectric=0;
    this.costPerKmFuel=0;
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
        this.bmsIdButtonDisable=false;
        this.disablePayrollSettingValue=false;
        this.softwareButtonDisbale=false;
         this.isBMSIDDisbale=true;
        this.resetShiftTimes();
        this.resetShiftTimes();
        this.refreshPayrollSettinggs();
        this.refreshColors();
        //this.cardFlag = false;
       // this.listFlag = false;
    }

    get isDesktop() {
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
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

        this.generalshiftcolor = this.facilityJSONData[facId]["generalshiftcolor"];
        console.log("General Shift Color:", this.generalshiftcolor);

        this.afternoonshiftcolor = this.facilityJSONData[facId]["afternoonshiftcolor"];
        console.log("Afternoon Shift Color:", this.afternoonshiftcolor);

        this.nightshiftcolor = this.facilityJSONData[facId]["nightshiftcolor"];
        console.log("Night Shift Color:", this.nightshiftcolor);

        this.customshiftcolor = this.facilityJSONData[facId]["customshiftcolor"];
        console.log("Custom Shift Color:", this.customshiftcolor);

        this.sleepovershiftcolor = this.facilityJSONData[facId]["sleepovershiftcolor"];
        console.log("Sleepover Shift Color:", this.sleepovershiftcolor);

        this.morningshiftcolor = this.facilityJSONData[facId]["morningshiftcolor"];
        console.log("Morning Shift Color:", this.morningshiftcolor);

        console.log('status'+this.status);
        this.toggleValue = this.status;
        console.log('toggleValue'+this.toggleValue);
        this.cardFlag = false;
        this.listFlag = false;
        this.facFlag = false;
        this.facilityflag = true;
        this.facilityeditflag = false;

    }
  
 async handleEdit(event) {
    let facId = event.currentTarget.dataset.id;

    // Show edit UI immediately
    this.facilityflag = true;
    this.facilityeditflag = true;

    try {
        // Wait for facility data to load
        await this.fetchFacilities();
        console.log('HANDLEDIT');
        
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
            this.BMSIDValue = facility.bmsIdentifier;
            this.softwareIDValue = facility.softwareId;

            this.agentName =  facility.agentName;
            this.taxAgency = facility.taxAgency;

            this.taxAgencyNumber =facility.agentnumber;
            this.generalshiftcolor=facility.generalshiftcolor;
            this.morningshiftcolor=facility.morningshiftcolor;
            this.afternoonshiftcolor=facility.afternoonshiftcolor;
            this.nightshiftcolor=facility.nightshiftcolor;
            this.customshiftcolor=facility.customshiftcolor;
            this.sleepovershiftcolor=facility.sleepovershiftcolor;

            this.generalShiftStartTime =facility.generalShiftStartTime;
            this.generalShiftEndTime=facility.generalShiftEndTime;

            this.morningShiftStartTime=facility.morningShiftStartTime;
            this.morningShiftEndTime=facility.morningShiftEndTime;

            this.afternoonShiftStartTime=facility.afternoonShiftStartTime;
            this.afternoonShiftEndTime=facility.afternoonShiftEndTime;

            this.nightShiftStartTime=facility.nightShiftStartTime;
            this.nightShiftEndTime=facility.nightShiftEndTime;

            this.customShiftScostPerKmElectrictartTime =facility.customShiftStartTime;
            this.customShiftEndTime=facility.customShiftEndTime;

            this.sleepoverShiftStartTime=facility.sleepoverShiftStartTime;
            this.sleepoverShiftEndTime=facility.sleepoverShiftEndTime;

            this.costPerKmFuel=facility.costPerKmFuel || 0;
            this.costPerKmElectric=facility.costPerKmElectric || 0;




            if(facility.bmsIdentifier ==''|| facility.bmsIdentifier ==null  || facility.bmsIdentifier ==undefined ){
                this.bmsIdButtonDisable=false;
            }else{
                 this.bmsIdButtonDisable=true;
            }

             if(facility.softwareId ==''|| facility.softwareId ==null  || facility.softwareId ==undefined ){
                this.softwareButtonDisbale=false;
            }else{
                 this.softwareButtonDisbale=true;
            }
            this.isBMSIDDisbale=true;
            console.log('ABN:', this.ABN);
            console.log('useOrgAbn:', this.useOrgAbn);
            this.disablePayrollSettingValue =this.useOrgAbn
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
        this.bmsIdButtonDisable=false;
        this.disablePayrollSettingValue=false;
        this.softwareButtonDisbale=false;
        this.resetShiftTimes();
        this.resetShiftTimes();
        this.refreshPayrollSettinggs();
        this.refreshColors();
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

    handleeditClose(){
        this.facEditFlag=false;
        this.bmsIdButtonDisable=false;
        this.disablePayrollSettingValue=false;
        this.softwareButtonDisbale=false;
        this.resetShiftTimes();
        this.resetShiftTimes();
        this.refreshPayrollSettinggs();
        this.refreshColors();
    }
@track handleStatusFlag=false;
@track facId;
@track facstatus;
@track message;
@track originalToggleState;
@track toggleElement; 
@track facilityname;
@track disablePayrollSettingValue =false;
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
       
          this.facEditFlag = false;
            this.fetchFacilities();
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
        this.fetchFacilities();
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

             this.fetchFacilities(); // your method to call Apex or filter results
        }
    }



    handleSubmit(event){
        // console.log('in submit');
         event.preventDefault();// stop the form from submitting
         this.showSpinner=true;
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
        fields.General_Shift_Color__c = this.generalshiftcolor ? this.generalshiftcolor.toString() : '';
        console.log('General Shift Color:', this.generalshiftcolor ?? 'null');

        fields.Morning_Shift_Color__c = this.morningshiftcolor ? this.morningshiftcolor.toString() : '';
        console.log('Morning Shift Color:', this.morningshiftcolor ?? 'null');

        fields.Afternoon_Shift_Color__c = this.afternoonshiftcolor ? this.afternoonshiftcolor.toString() : '';
        console.log('Afternoon Shift Color:', this.afternoonshiftcolor ?? 'null');

        fields.Night_Shift_Color__c = this.nightshiftcolor ? this.nightshiftcolor.toString() : '';
        console.log('Night Shift Color:', this.nightshiftcolor ?? 'null');

        fields.Custom_Shift_Color__c = this.customshiftcolor ? this.customshiftcolor.toString() : '';
        console.log('Custom Shift Color:', this.customshiftcolor ?? 'null');

        fields.Sleepover_Shift_Color__c = this.sleepovershiftcolor ? this.sleepovershiftcolor.toString() : '';
        console.log('Sleepover Shift Color:', this.sleepovershiftcolor ?? 'null');

        // Safely assign cost fields
        fields.Cost_per_Km_Electric__c = this.costPerKmElectric ?? 0;
        console.log('Cost per Km Electric:', this.costPerKmElectric ?? 'null');

        fields.Cost_per_Km_Fuel__c = this.costPerKmFuel ?? 0;
        console.log('Cost per Km Fuel:', this.costPerKmFuel ?? 'null');



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
            //this.showSpinner=false;
        })
    }

        setTimeout(() => {
            this.showSpinner=false;
             this.fetchFacilities();
        }, 1500);
        
        

        //refreshApex(this.refreshTable);
    }//changes made by maheswaricode end

    @track errorMessage = '';
    @track saveButtonDisable = false;
    
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
    this.showSpinner=false;
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
    this.showSpinner=false;
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


 handleOpenBMSSoftwareID(event){
        if(event.target.name=='bmsid'){
            this.BMSconfirmMessgeTemplate=true;
            }else{
            this.SoftwareIDconfirmMessgeTemplate=true;
        }
    
    }
  
    handleCopyBmsId(event){
        this.isBMSIDDisbale=false;
        this.bmsIdButtonDisable=true;
        this.BMSconfirmMessgeTemplate=false;
    }
    handleBmsId(event){
        generateCustomGUID({}).then(result => {
    
            if(result){
                this.BMSIDValue=result;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'BMS Details Updated Successfully!!',
                        variant: 'success'
                    })
                );
             
            this.BMSconfirmMessgeTemplate=false;
            this.SoftwareIDconfirmMessgeTemplate=false;
            this.bmsIdButtonDisable=true;
            }
          
         console.log('GUID:'+result);
        
        })
    }
    GenerateSoftwareId(event){
        this.showSpinner = true;
        if(this.ABN==null || this.ABN=='' || this.ABN==undefined){ 
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'ABN Number Cannot be Empty, Please enter the value',
                    variant: 'error'
                })
            ); 
            this.BMSconfirmMessgeTemplate=false;
            this.SoftwareIDconfirmMessgeTemplate=false;
             this.showSpinner = false;
        }else{
            generateSoftwareID({ ABN_NUMBER: this.ABN })
        .then(response => {
            console.log('Raw Response:', response);
            setTimeout(() => {
                let result = JSON.parse(response); // Parse only once
                console.log('Parsed Result:', result);
    
                if (result.IsSuccess) {
                    this.softwareIDValue = result.Result;
                 //   this.errorMessage = null;
    
                    // Show success toast
                    this.showToast('Success', 'Software ID Details Updated Successfully!!', 'success');
                       this.softwareButtonDisbale=true;
                } else {
                    this.softwareIDValue = '';
                  //  this.errorMessage = result.MessageEvents?.[0]?.ShortMessage || 'Unknown error occurred';
    
                    // Show error toast
                    this.showToast('Error', result.MessageEvents?.[0]?.ShortMessage || 'Unknown error occurred', 'error');
                       this.softwareButtonDisbale=false;
                }
    
                this.showSpinner = false;
                this.BMSconfirmMessgeTemplate=false;
                this.SoftwareIDconfirmMessgeTemplate=false;
            
            }, 3000);
        })
        .catch(error => {
            this.showSpinner = false;
            this.showToast('Error', error.body?.message || 'Unexpected error occurred', 'error');
              this.softwareButtonDisbale=false;
        });
        }
          
    }
    
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    
  ConfirmClose (){
     this.BMSconfirmMessgeTemplate=false;
      this.SoftwareIDconfirmMessgeTemplate=false;
       this.isBMSIDDisbale=true;
  }
   handleColorChange(event){
        if(event.target.name=='general'){
            this.generalshiftcolor=event.target.value;
            console.log('color:'+this.generalshiftcolor);

        }else if(event.target.name=='morning'){
            this.morningshiftcolor=event.target.value;
            console.log('color:'+this.morningshiftcolor);

        }else if(event.target.name=='afternoon'){
            this.afternoonshiftcolor=event.target.value;
            console.log('color:'+this.afternoonshiftcolor);

        }else if(event.target.name=='night'){
            this.nightshiftcolor=event.target.value;
            console.log('color:'+this.nightshiftcolor);

        }else if(event.target.name=='custom'){
            this.customshiftcolor=event.target.value;
            console.log('color:'+this.customshiftcolor);

        }else if(event.target.name=='sleep'){
            this.sleepovershiftcolor=event.target.value;
            console.log('color:'+this.sleepovershiftcolor);

        }
    }
     get dynamicgeneralshiftcolor() {
            return `background: ${this.generalshiftcolor};`;
        }
        get dynamicmorningshiftcolor() {
            return `background: ${this.morningshiftcolor};`;
        }
        get dynamicafternoonshiftcolor() {
            return `background: ${this.afternoonshiftcolor};`;
        }
        get dynamicnightshiftcolor() {
            return `background: ${this.nightshiftcolor};`;
        }
        get dynamiccustomshiftcolor() {
            return `background: ${this.customshiftcolor};`;
        }
        get dynamicsleepovercolor() {
            return `background: ${this.sleepovershiftcolor};`;
        }

        
    handleCostChange(event) {
        const field = event.target.name;
        const value = event.detail.value;

        if (field === 'fuel') {
            this.costPerKmFuel = value;
            console.log('Fuel Cost per Km changed to:', value);
        } else if (field === 'electric') {
            this.costPerKmElectric = value;
            console.log('Electric Cost per Km changed to:', value);
        }
    }


}