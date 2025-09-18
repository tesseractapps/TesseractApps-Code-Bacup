import { LightningElement, track, wire, api } from 'lwc';
import NAME_FIELD from '@salesforce/schema/Organisation__c.Name';
import ABN_FIELD from '@salesforce/schema/Organisation__c.ABN__c';
import ACN_FIELD from '@salesforce/schema/Organisation__c.ACN__c';
import NDIS_FIELD from '@salesforce/schema/Organisation__c.NDIS_Provider__c';
import CONTACT_FIELD from '@salesforce/schema/Organisation__c.Contact_No__c';
import EMAIL_FIELD from '@salesforce/schema/Organisation__c.Email__c';
import Add_FIELD from '@salesforce/schema/Organisation__c.Address__c';
import Additional_FIELD from '@salesforce/schema/Organisation__c.Additional_Tax_Areas_Applicable_to_your__c';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import orgDetailsCommunity from "@salesforce/apex/OrgDetails.orgDetailsCommunity";
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import { NavigationMixin } from 'lightning/navigation';
import FORM_FACTOR from '@salesforce/client/formFactor';
import Objects_Type from "@salesforce/apex/OrgDetails.orgName";
import Id from '@salesforce/user/Id';
import ProfileName from '@salesforce/schema/User.Profile.Name';
import { getRecord } from 'lightning/uiRecordApi';
import My_Resource from "@salesforce/resourceUrl/myResource";
import {refreshApex} from '@salesforce/apex';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import generateCustomGUID from "@salesforce/apex/OrgDetails.generateCustomGUID";
import generateSoftwareID from "@salesforce/apex/GovReportsSoftwareID.generateSoftwareID";
import getUsersByOrganizationName from '@salesforce/apex/TicketManager.getUsersByOrganizationName';
import saveOrganisationSettings from '@salesforce/apex/TicketManager.saveOrganisationSettings';
import getUsersByIds from '@salesforce/apex/TicketManager.getUsersByIds';

//import getPrivilegeData from "@salesforce/apex/SecurityPrivilege.getPrivilegeData";
//import getUserRole from "@salesforce/apex/SecurityPrivilege.getUserRole";
export default class OrgLwcCommunity extends NavigationMixin(LightningElement) {
    admin = My_Resource + '/myResource/images/admin.svg';
    infoicon = My_Resource + '/myResource/images/Info_Icon.png';
    infoiconhover = My_Resource + '/myResource/images/Info_Icon_Hover.png';
    @track Picklist_Value;
    @track objectApiName = 'Organisation__c';
    fields = [NAME_FIELD, ABN_FIELD, ACN_FIELD, NDIS_FIELD, CONTACT_FIELD, EMAIL_FIELD, Add_FIELD, Additional_FIELD];
    @track l_All_Types;
    @track TypeOptions;
    @track orgRecord;
    @track orgAccountNumber;
    userId = Id;
    userProfileName;
    @track editFlag = false;
    @track orgEditFlag = false;
    @track street;
    @track city;
    @track country;
    @track province;
    @track postalcode;
    @track email;
    @track name;
    @track abn;
    @track acn;
    @track ndis;
    @track contact;
    @track logo;
    @track OrgJsonFormat={}
    @track orgflag=true;
    @track bankflag=false;
    @track rosterflag=false;
    @track addressflag=false;
    @track payrollflag=false;
    @track orgeditflag=false;
    @track bankeditflag=false;
    @track rostereditflag=false;
    @track addresseditflag=false;
    @track payrolleditflag=false;
    @track clientData;
    @track fileName;
    @track UserSettingsFlag=false;
    @track UserSettingsEditFlag=false;
    @track activitySettingsFlag=false;
    @track activitySettingsEditFlag=false;
    @track securitySettingsFlag=false;
    @track EditSecurityPrivilegForm=false;
    @track orgName;
    @track userRole;
    @track showOtherPrivileg=false;
    @track image;
    @track settingsFlag = false;
    @track settingsEditFlag = false;


    @track ticketSelectedUserNames = [];
    @track ticketSelectedUserIds = [];
    @track ticketUserOptions = [];
    @track ticketSupportEmail = '';
    
   

    wiredClientResult;
    wiredSecurityResult;
    @track finalSecurityResult=[];
    @track BMSconfirmMessgeTemplate=false;
    @track SoftwareIDconfirmMessgeTemplate=false;
    @track BMSIDValue;
    @track softwareIDValue;
    @track ABNNumber;
    @track isBMSIDDisbale=true;
    @track bmsIdButtonDisable=true;
    @track isShowSpinner=false;
    @track isSoftwareIdDisable=false;
    @track softwareButtonDisbale=false;
    /* colorOptions = [
        { label: 'Red', value: '#ff0000' },
        { label: 'Green', value: '#00ff00' },
        { label: 'Blue', value: '#0000ff' },
        { label: 'Yellow', value: '#ffff00' },
        { label: 'Purple', value: '#800080' },
        { label: 'Orange', value: '#ffa500' },
        { label: 'Cyan', value: '#00ffff' },
        { label: 'Magenta', value: '#ff00ff' },
        { label: 'Brown', value: '#a52a2a' },
        { label: 'Pink', value: '#ffc0cb' }
    ]; */
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

    @track sectionFlags = {
        Organisation: true,
        Addressdetails: true,
        Bank: true,
        Roster: true,
        payroll: true,
        User: true,
        Activity: true,
        AdminSettings: true,

        Organisation1: true,
        Addressdetails1: true,
        Bank1: true,
        Roster1: true,
        payroll1: true,
        User1: true,
        Activity1: true,
        AdminSettings1: true,
        
    };
    
    // Icons for the toggle buttons
    @track sectionIcons = {
        Organisation: '\u2B9F', 
        Addressdetails: '\u2B9F',
        Bank: '\u2B9F',
        Roster: '\u2B9F',
        payroll: '\u2B9F',
        User: '\u2B9F',
        Activity: '\u2B9F',
        Organisation1: '\u2B9F', 
        Addressdetails1: '\u2B9F',
        Bank1: '\u2B9F',
        Roster1: '\u2B9F',
        payroll1: '\u2B9F',
        User1: '\u2B9F',
        Activity1: '\u2B9F',
        AdminSettings: '\u2B9F',
        AdminSettings1: '\u2B9F',
        
    };
    handleSectionToggle(event) {
        const sectionId = event.currentTarget.dataset.id;
        console.log(sectionId);
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

    @wire(getRecord, { recordId: Id, fields: [ProfileName] })
    userDetails({ error, data }) {
        if (error) {
            this.error = error;
        } else if (data) {
            if (data.fields.Profile.value != null) {
                this.userProfileName = data.fields.Profile.value.fields.Name.value;
                if (this.userProfileName == 'System Administrator' || this.userProfileName == 'ClientProfile' || this.userProfileName == 'Channel Account User1') {
                    this.editFlag = true;
                }
            }

        }
    }
    /* @wire(getPrivilegeData)
    wiredSecurity(result) {
        this.wiredSecurityResult = result;
        //console.log('Result: ', result); // Debugging line
        const { data, error } = result;
        if (data) {
            this.finalSecurityResult=data;
           console.log(' security Data: ', data); // Debugging line
        } else if (error) {
            console.error('Error: ', error); // Debugging line
           
        }
    } */

    get isDesktop() {
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
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
@track usertype;
@track NdisFlag;
    @wire(orgDetailsCommunity)
    wiredClient(result) {
      this.wiredClientResult = result;
        const { data, error } = result;
        if (data) {
            this.clientData = data;
            console.log('Client data:', JSON.stringify(this.clientData));
            this.image = this.clientData.Logo__c;
            this.usertype = this.clientData.Type_of_User__c;
            if(this.usertype === 'NDIS User'){
                this.NdisFlag = true;
                console.log('user type'+this.usertype);
            }
            console.log('IMAGE:', this.image); 
            this.city = this.clientData.Address_Latest__City__s;
            this.country = this.clientData.Address_Latest__CountryCode__s;
            this.province = this.clientData.Address_Latest__StateCode__s;
            this.postalcode = this.clientData.Address_Latest__PostalCode__s;
            this.street=this.clientData.Address_Latest__Street__s;
            this.generalshiftcolor=this.clientData.Generalshiftcolor__c;
            this.morningshiftcolor=this.clientData.Morningshiftcolor__c;
            this.afternoonshiftcolor=this.clientData.Afternoonshiftcolor__c;
            this.nightshiftcolor=this.clientData.Nightshiftcolor__c;
            this.customshiftcolor=this.clientData.customshiftcolor__c;
            this.sleepovershiftcolor=this.clientData.Sleepover_Shift_Color__c;
            this.ABNNumber=this.clientData.ABN__c ||'';
            this.BMSIDValue=this.clientData.BMSI_Identifier__c || '';
            this.softwareIDValue=this.clientData.SoftwareId__c || '';
            console.log('abn number '+this.ABNNumber);
            console.log('BMSIDValue '+this.BMSIDValue);
            console.log('softwareIDValue '+this.softwareIDValue);
           // this.additionalTax = this.clientData.Additional_Tax_Areas_Applicable_to_your__c;
         
        } else if (error) {
            this.handleError(error);
        }
    }
  

    @wire(Objects_Type, {})
    WiredObjects_Type({ error, data }) {

        if (data) {
            try {
                this.l_All_Types = data;
                let options = [];

                for (var key in data) {
                    // Here key will have index of list of records starting from 0,1,2,....
                    options.push({ label: data[key].Name, value: data[key].Id });

                    // Here Name and Id are fields from sObject list.
                }
                this.TypeOptions = options;

            } catch (error) {
                /* console.error('check error here', error); */
            }
        } else if (error) {
            /* console.error('check error here', error); */
        }

    }
    connectedCallback() {        
        orgDetails().then(response => {
            this.orgRecord = response;
            this.Picklist_Value = response.Id;
           // console.log('orgname in connected call back  '+response.Name);
           this.orgName=response.Name;
            //create event
            this.OrgJsonFormat[response.Id]={"name":response.Name,"street":response.Address_Latest__Street__s,"city":response.Address_Latest__City__s,"stateCode":response.Address_Latest__StateCode__s,"countryCode":response.Address_Latest__CountryCode__s,"postalCode":response.Address_Latest__PostalCode__s,"general":response.Generalshiftcolor__c}; //,"additionalTax":response.Additional_Tax_Areas_Applicable_to_your__c

            const searchEvent = new CustomEvent("getsearchvalue", {
                detail: this.Picklist_Value
            });

            //Dispatches the event
            this.dispatchEvent(searchEvent);
            // Do Something.
        });       
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        document.body.style.overflowX = 'hidden';
    }

    disconnectedCallback() {
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }

    handleTypeChange(event) {
        this.Picklist_Value = event.target.value;
        //create event
        const searchEvent = new CustomEvent("getsearchvalue", {
            detail: this.Picklist_Value
        });

        //Dispatches the event
        this.dispatchEvent(searchEvent);
        // Do Something.
    }

    // handleEditOrg(event) {
    //     this.orgEditFlag = true;
    //     this.Picklist_Value=event.currentTarget.dataset.id
    //     this.name=this.OrgJsonFormat[this.Picklist_Value]["name"];
    //     this.street =this.OrgJsonFormat[this.Picklist_Value]["street"];;
    //     this.city = this.OrgJsonFormat[this.Picklist_Value]["city"];
    //     this.country =this.OrgJsonFormat[this.Picklist_Value]["countryCode"];
    //     this.province = this.OrgJsonFormat[this.Picklist_Value]["stateCode"];
    //     this.postalcode =this.OrgJsonFormat[this.Picklist_Value]["postalCode"]; 
    //     //this.orgAccountNumber = this.OrgJsonFormat[this.Picklist_Value]["orgaccountnumber"]; 
    //    // this.additionalTax = this.OrgJsonFormat[this.Picklist_Value]["additionalTax"];
    //    // console.log('Edit Account Number : ', this.additionalTax);
    // }
    handleeditClose() {
        this.orgeditflag = false;
        this.settingsEditFlag = false;
        //this.handleflag();
        this.userRole='';
      //  this.ticketSupportEmail='';
        this.bmsIdButtonDisable=false;
        this.softwareButtonDisbale=false;
         this.loadOrganisationSettings();
    }

  
    navigatetoHome() {
        this[NavigationMixin.Navigate]({
            type: 'standard__navItemPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                apiName: 'Home'
            },
        });
    }

    addressInputChange(event) {
        /* console.log('event detail'+JSON.stringify(event.detail));  */
        this.street = event.detail.street;
        this.city = event.detail.city;
        this.province = event.detail.province;
        this.country = event.detail.country;
        this.postalcode = event.detail.postalCode;
    }

    handlesave(event){
        event.preventDefault();// stop the form from submitting
        if(this.street && this.city && this.province && this.country && this.postalcode){
        const fields = event.detail.fields;
        // alert(JSON.stringify(fields));
          fields.Address_Latest__Street__s = this.street;
          fields.Address_Latest__City__s =  this.city;
          fields.Address_Latest__StateCode__s = this.province;
          fields.Address_Latest__CountryCode__s = 'AU';
          fields.Address_Latest__PostalCode__s =  this.postalcode;
          fields.Generalshiftcolor__c=this.generalshiftcolor;
          fields.Morningshiftcolor__c=this.morningshiftcolor;
          fields.Afternoonshiftcolor__c=this.afternoonshiftcolor;
          fields.Nightshiftcolor__c=this.nightshiftcolor;
          fields.customshiftcolor__c=this.customshiftcolor;
          fields.Sleepover_Shift_Color__c=this.sleepovershiftcolor;
        /* console.log('After fields>>'+JSON.stringify(fields)); */
        this.template.querySelector('lightning-record-edit-form').submit(fields);  
        }else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message:     'Please fill all the fields',
                    variant: 'error'
                })
            );
        }
    }

    HandleSuccess(event){
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Organisation details are updated',
                variant: 'success'
            })
        );
        refreshApex(this.wiredClientResult);
        
        this.handleeditClose();
        let orgRecID=event.detail.id;
        if(this.fileName.length>0){
         uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:orgRecID, obj:'org'}).then(result => {
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

        orgDetails().then(response => {
            this.orgRecord = response;
            this.Picklist_Value=response.Id;
            this.OrgJsonFormat[response.Id]={"name":response.Name,"street":response.Address_Latest__Street__s,"city":response.Address_Latest__City__s,"stateCode":response.Address_Latest__StateCode__s,"countryCode":response.Address_Latest__CountryCode__s,"postalCode":response.Address_Latest__PostalCode__s};//,"additionalTax":response.Additional_Tax_Areas_Applicable_to_your__c
        })
        const searchEvent = new CustomEvent("getsearchvalue", {
            detail: this.Picklist_Value
        });
        //Dispatches the event
        this.dispatchEvent(searchEvent);
        /* console.log('orgDetails ==>'+JSON.stringify(this.orgRecord));  */
       
        this.handleSaveSettings();
    }
    @track generalshiftcolor;
    @track morningshiftcolor;
    @track afternoonshiftcolor;
    @track nightshiftcolor;
    @track customshiftcolor;
    @track sleepovershiftcolor;
    @track securityID;
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
    get detailsClass(){
        return (this.orgflag || this.orgeditflag) ? 'menu-item1' : 'menu-item'; 
    
    }
    get addressClass(){
      return (this.addressflag || this.addresseditflag) ? 'menu-item1' : 'menu-item'; 
    
    }
    get bankClass(){
      return (this.bankflag || this.bankeditflag) ? 'menu-item1' : 'menu-item'; 
    
    }
    get rosterClass(){
      return (this.rosterflag || this.rostereditflag) ? 'menu-item1' : 'menu-item'; 
    
    }
    get payrollClass(){
      return (this.payrollflag || this.payrolleditflag) ? 'menu-item1' : 'menu-item'; 
    
    }

    get UserRoleClass(){
        return (this.UserSettingsFlag || this.UserSettingsEditFlag) ? 'menu-item1' : 'menu-item'; 
      
    }

    get activityClass(){
        return (this.activitySettingsFlag || this.activitySettingsEditFlag) ? 'menu-item1' : 'menu-item'; 
      
    }
    get securityClass(){
        return (this.securitySettingsFlag || this.EditSecurityPrivilegForm ) ? 'menu-item1' : 'menu-item';
    }

    get settingsClass() {
        return this.settingsFlag ? 'menu-item1' : 'menu-item';
    }
    
      
    handledeorg(event){
        this.orgflag=true;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;  
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false; 
        this.settingsFlag = false;    
    }
    handleaddress(event){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=true;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
        this.settingsFlag = false;
    }
    handlebank(event){
        this.orgflag=false;
        this.bankflag=true;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
        this.settingsFlag = false;
    }
    handleroster(event){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=true;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
        this.settingsFlag = false;
    }
    handlepayroll(event){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=true;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.settingsFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
        if(this.BMSIDValue =='' || this.BMSIDValue==null || this.BMSIDValue==undefined){
           
            this.bmsIdButtonDisable=false;
        }else{
            this.bmsIdButtonDisable=true;
        }
        if(this.softwareIDValue =='' || this.softwareIDValue== null || this.softwareIDValue==undefined ){
            console.log('in else  software id ')
            this.softwareButtonDisbale=false;
        }else{
            this.softwareButtonDisbale=true;
        }
        this.isBMSIDDisbale=true;
    }

    handleEditOrg() {
         this.fileName='';
        if (this.orgflag) {
           
            this.orgeditflag = true;
       // } else if (this.bankflag) {
           // this.bankeditflag = true;
        // } else if (this.rosterflag) {
        //     this.rostereditflag = true;
        //} else if (this.addressflag) {
            //this.addresseditflag = true;
        } else if (this.payrollflag) {
            this.payrolleditflag = true;
            if(this.BMSIDValue =='' || this.BMSIDValue==null || this.BMSIDValue==undefined){
           
                this.bmsIdButtonDisable=false;
            }else{
                this.bmsIdButtonDisable=true;
            }
            if(this.softwareIDValue =='' || this.softwareIDValue== null || this.softwareIDValue==undefined ){
                console.log('in else  software id ')
                this.softwareButtonDisbale=false;
            }else{
                this.softwareButtonDisbale=true;
            }
            this.isBMSIDDisbale=true;
        // } else if (this.UserSettingsFlag) {
        //     this.UserSettingsEditFlag = true;
        // } else if (this.activitySettingsFlag) {
        //     this.activitySettingsEditFlag = true;
        } else if (this.securitySettingsFlag) {
            this.EditSecurityPrivilegForm = true;
        }else if (this.settingsFlag) {
            this.settingsEditFlag = true;
            this.loadOrgUsers();
        }
    }
    handleRole(){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=true;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
        this.settingsFlag = false;
    }
    handleActivity(){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = true;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
        this.settingsFlag = false;
    }
    handleSecurity(){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false; 
        this.securitySettingsFlag=true;
        this.EditSecurityPrivilegForm=false;
        this.settingsFlag = false;
        
    }
    handleEditSecurity(event){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=true;
        this.securityID=event.currentTarget.dataset.id;
        this.userRole=event.currentTarget.dataset.role;
        this.settingsFlag = false;
    }
    handleSettings(event) {
        this.orgflag = false;
        this.bankflag = false;
        this.rosterflag = false;
        this.addressflag = false;
        this.payrollflag = false;
        this.UserSettingsFlag = false;
        this.UserSettingsEditFlag = false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag = false;
        this.EditSecurityPrivilegForm = false;
        this.settingsFlag = true;
        this.loadOrganisationSettings();
        
    }

    loadOrganisationSettings() {
        orgDetails().then(response => {
            console.log('📥 Fetched Organisation Details:', JSON.stringify(response));
    
            this.ticketSupportEmail = response.Support_Email__c;
            console.log(' ticketSupportEmail in Organisation Details:', this.ticketSupportEmail);
            const rawIds = response.Ticketing_Members__c;
            if (rawIds) {
                const ids = rawIds.split('\n').filter(Boolean);
                this.ticketSelectedUserIds = ids;
    
                getUsersByIds({ userIds: ids })
                    .then(userList => {
                        console.log(' IDS:', JSON.stringify(userList));
                        this.ticketSelectedUserNames = userList.map(user => user.Full_Name__c);
                        console.log('✅ Mapped User Names:', this.ticketSelectedUserNames);
                    })
                    .catch(error => {
                        console.error('❌ Error fetching user names:', error);
                    });
            } else {
                this.ticketSelectedUserIds = [];
                this.ticketSelectedUserNames = [];
                console.log('⚠️ No ticketing members found.');
            }
        }).catch(error => {
            console.error('❌ Error fetching orgDetails:', error);
        });
    }
    
    
    
    
    
    

    loadOrgUsers() {
        if (!this.orgName) {
            console.warn('Organisation name is not set');
            return;
        }
    
        getUsersByOrganizationName({ orgName: this.orgName })
            .then(result => {
                this.ticketUserOptions = result.map(user => ({
                    label: user.Full_Name__c,
                    value: user.Id
                }));                
                console.log('Fetched Users:', this.userOptions);
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    }
    
    handleSaveSettings() {
        console.log('Saving to Organisation ID:', this.Picklist_Value);
        console.log('Ticketing Support Email:', this.ticketSupportEmail);
        console.log('Ticketing Selected Users:', this.ticketSelectedUserIds);
    
        saveOrganisationSettings({
            orgId: this.Picklist_Value,
            supportEmail: this.ticketSupportEmail,
            selectedUsers: this.ticketSelectedUserIds
        })
        .then(() => {
            this.settingsEditFlag = false;
           /*  this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Ticketing members and email saved!',
                    variant: 'success'
                })
            ); */
    
            // ✅ Refresh updated data manually
            this.loadOrganisationSettings();
        })
        .catch(error => {
            console.error('Error saving Organisation settings:', JSON.stringify(error));
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Failed to save settings',
                    variant: 'error'
                })
            );
        });
    }
    
    
    
    handleTicketUserChange(event) {
        this.ticketSelectedUserIds  = event.detail.value;
        console.log('Updated ticketSelectedUsers:', this.ticketSelectedUserIds );
    }
    
    handleTicketEmailChange(event) {
        this.ticketSupportEmail = event.target.value;
        console.log('Updated ticketSupportEmail:', this.ticketSupportEmail);
    }
    
    
    
    
    handleCancelSettings() {
        this.settingsEditFlag = false;
        this.ticketSupportEmail='';
    }
    
    
    
   /*  handleEditOrg(event){
        this.orgflag=true;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=true;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.fileName='';
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
    }
    
    handleEditBank(event){
        this.orgflag=false;
        this.bankflag=true;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=true;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
    }
    handleEditRoster(event){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=true;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=true;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;    
    }
    handleEditAddress(event){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=true;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=true;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;  
        this.securitySettingsFlag=false; 
        this.EditSecurityPrivilegForm=false;     
    }
    handleEditpayroll(event){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=true;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=true;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
    }
    

    
    handleUserSettings(event){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=true;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = false;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
    }

    handleActivitySettings(event){
        this.orgflag=false;
        this.bankflag=false;
        this.rosterflag=false;
        this.addressflag=false;
        this.payrollflag=false;
        this.orgeditflag=false;
        this.bankeditflag=false;
        this.rostereditflag=false;
        this.addresseditflag=false;
        this.payrolleditflag=false;
        this.UserSettingsFlag=false;
        this.UserSettingsEditFlag=false;
        this.activitySettingsFlag = false;
        this.activitySettingsEditFlag = true;
        this.securitySettingsFlag=false;
        this.EditSecurityPrivilegForm=false;
    }
    
 */

    // handleeditClose(event){

    //     this.handleflag();
    //     this.bmsIdButtonDisable=false;
    //     this.softwareButtonDisbale=false;
    //   }

    handleflag(){
        console.log('this.orgeditflag >>'+orgeditflag);
        if (this.orgeditflag) {
          this.orgeditflag = false; 
          this.orgflag = true;           
        } else if (this.bankeditflag) {
          this.bankeditflag = false; 
          this.bankflag = true; 
        } else if (this.rostereditflag) {
          this.rostereditflag = false; 
          this.rosterflag = true; 
        } else if (this.addresseditflag) {
          this.addresseditflag = false; 
          this.addressflag= true; 
        }  else if (this.payrolleditflag) {
          this.payrolleditflag = false; 
          this.payrollflag= true; 
        } else if (this.UserSettingsEditFlag) {
            this.UserSettingsEditFlag = false; 
            this.UserSettingsFlag= true; 
        } else if (this.activitySettingsEditFlag) {
            this.activitySettingsEditFlag = false; 
            this.activitySettingsFlag= true; 
        } else if (this.EditSecurityPrivilegForm) {
            this.EditSecurityPrivilegForm = false; 
            this.securitySettingsFlag= true; 
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
    }

    handleSubmit(event) {
        // this.value  Additional_Tax_Areas_Applicable_to_your__c
         const fields=event.detail.fields;
         console.log('fields>>',fields);        
         event.preventDefault();
        /*  fields.Additional_Tax_Areas_Applicable_to_your__c = this.additionalTax;   
         console.log('submit additional tax >> '+ fields.Additional_Tax_Areas_Applicable_to_your__c);   */
         this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    /* options = [
        { label: 'Fringe Benefits Tax', value: 'Fringe Benefits Tax' },
        { label: 'Fuel Tax Credits', value: 'Fuel Tax Credits' },
        { label: 'Wine Equalisation Tax', value: 'Wine Equalisation Tax' },
    ];

    handleRadioChange(event) {
        this.additionalTax = event.target.value;
        console.log('Option selected with value: ' + this.additionalTax);
    } */
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
        triggerFileInput() {
            this.template.querySelector('input[type="file"]').click();
        }
        handleSecuritySave(event){
            this.template.querySelector('lightning-record-edit-form[data-recid="PreTaxForm"]').submit(fields);
        }
        HandleSecuritySuccess(event){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Security Details Updated Successfully!!',
                    variant: 'success'
                })
            );
            refreshApex(this.wiredSecurityResult);
            this.handleflag();
        }
        handleNewSecurity(){
          this.EditSecurityPrivilegForm = true;
          this.securityID='';
          this.userRole='';
          this.securitySettingsFlag=false
        }

        handleUserChange(event){
            getUserRole({userId:event.target.value}).then(result => {
                this.userRole = result.User_Type__c;
            })
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
         
            this.ConfirmClose();
            this.bmsIdButtonDisable=true;
        }
      
     console.log('GUID:'+result);
    
    })
}

handleOpenBMSSoftwareID(event){
    if(event.target.name=='bmsid'){
        this.BMSconfirmMessgeTemplate=true;
        }else{
        this.SoftwareIDconfirmMessgeTemplate=true;
    }

}
ConfirmClose(){
    this.BMSconfirmMessgeTemplate=false;
    this.SoftwareIDconfirmMessgeTemplate=false;
    this.bmsIdButtonDisable=false;
    this.softwareButtonDisbale=false;
     this.isBMSIDDisbale=true;
}
handleCopyBmsId(event){
    this.isBMSIDDisbale=false;
    this.bmsIdButtonDisable=true;
    this.BMSconfirmMessgeTemplate=false;
}

GenerateSoftwareId(event){
    this.isShowSpinner = true;
    if(this.ABNNumber==null || this.ABNNumber=='' || this.ABNNumber==undefined){ 
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: 'ABN Number Cannot be Empty, Please enter the value',
                variant: 'error'
            })
        ); 
        this.ConfirmClose();
    }else{
        generateSoftwareID({ ABN_NUMBER: this.ABNNumber })
    .then(response => {
        console.log('Raw Response:', response);

       // this.isShowSpinner = true;
        setTimeout(() => {
            let result = JSON.parse(response); // Parse only once
            console.log('Parsed Result:', result);

            if (result.IsSuccess) {
                this.softwareIDValue = result.Result;
             //   this.errorMessage = null;

                // Show success toast
                this.showToast('Success', 'Software ID Details Updated Successfully!!', 'success');
            } else {
                this.softwareIDValue = '';
              //  this.errorMessage = result.MessageEvents?.[0]?.ShortMessage || 'Unknown error occurred';

                // Show error toast
                this.showToast('Error', result.Message || 'Unknown error occurred', 'error');
            }

            this.isShowSpinner = false;
            this.ConfirmClose();
            this.softwareButtonDisbale=true;
        }, 3000);
    })
    .catch(error => {
        this.isShowSpinner = false;
        this.showToast('Error', error.body?.message || 'Unexpected error occurred', 'error');
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


       
}