import {LightningElement, wire, api, track } from 'lwc';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import orgDetailsCommunity from "@salesforce/apex/OrgDetails.orgDetailsCommunity";
//import Objects_Type from "@salesforce/apex/OrgDetails.orgName";import {refreshApex} from '@salesforce/apex';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import generateCustomGUID from "@salesforce/apex/OrgDetails.generateCustomGUID";
import generateSoftwareID from "@salesforce/apex/GovReportsSoftwareID.generateSoftwareID";



const ICON_DOWN = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-down'
};

const ICON_LEFT = {
  icon: 'navigation',
  class: 'material-symbols material-symbols-filled rotate-icon rotate-left'
};

export default class TesseractAppsAccountingSettingsLwc extends LightningElement {
    
    @api orgid;
    @track isHome=true; 
    @track payRollSettingsFlag=true;
    @track accountingSettingsFlag=false;
    @track Picklist_Value;
    @track objectApiName = 'Organisation__c';
    @track BMSconfirmMessgeTemplate=false;
    @track SoftwareIDconfirmMessgeTemplate=false;
    @track BMSIDValue;
    @track softwareIDValue;
    @track isBMSIDDisbale=true;
    @track bmsIdButtonDisable=true;
    @track isShowSpinner=false;
    @track isSoftwareIdDisable=false;
    @track softwareButtonDisbale=false;
    @track orgRecord;
    @track orgName;
    @track isEditIcon=true;
    @track payrolleditflag=false;
    @track clientData;
    @track ABNNumber;
    @track payRollSettingsTab = true;
    @track payGroupTabFlag = true;

    // connectedCallback(){
    //     console.log('orgId IN TesseractAppsAccountingModuleLWC : '+this.orgid);
    //    // this.orgidtrack = this.orgid;
    // }
    get payRollSettingsClass(){
        return this.payRollSettingsFlag  ? 'menu-item1' : 'menu-item'; 
    
    }
    get accountingSettingsClass(){
      return this.accountingSettingsFlag  ? 'menu-item1' : 'menu-item'; 
    
    }
    @track sectionFlags = {
      
        payroll: true,
        // User1: true,
        // Activity1: true,
        // AdminSettings: true,
        payGroup: true,
        payroll1: true,
    };
    
    // Icons for the toggle buttons
    // @track sectionIcons = {
       
    //     payroll: '\u2B9F',
    //     payGroup: '\u2B9F',
    //     payroll1: '\u2B9F',
    // };
    @track sectionIcons = {
    payroll: { ...ICON_DOWN },
    payGroup: { ...ICON_DOWN },
    payroll1: { ...ICON_DOWN },
    };


     connectedCallback() {        
            orgDetails().then(response => {
                this.orgRecord = response;
                this.Picklist_Value = response.Id;
               console.log('orgname in connected call back  '+JSON.stringify(response));
              // this.orgName=response.Name;
                //create event
                //this.OrgJsonFormat[response.Id]={"name":response.Name,"street":response.Address_Latest__Street__s,"city":response.Address_Latest__City__s,"stateCode":response.Address_Latest__StateCode__s,"countryCode":response.Address_Latest__CountryCode__s,"postalCode":response.Address_Latest__PostalCode__s,"general":response.Generalshiftcolor__c}; //,"additionalTax":response.Additional_Tax_Areas_Applicable_to_your__c
    
                // const searchEvent = new CustomEvent("getsearchvalue", {
                //     detail: this.Picklist_Value
                // });
    
                //Dispatches the event
                //this.dispatchEvent(searchEvent);
                // Do Something.
            });       
            //document.addEventListener('click', this.handleOutsideClick.bind(this));
            //document.body.style.overflowX = 'hidden';

             this.handleShortcut = this.handleShortcut.bind(this);
                window.addEventListener("keydown", this.handleShortcut);
        }
       disconnectedCallback() {
    window.removeEventListener("keydown", this.handleShortcut);
        }


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
        // this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';

        this.sectionIcons[sectionId] =
        sectionElement.classList.contains('hidden-section')
            ? { ...ICON_LEFT }
            : { ...ICON_DOWN };


    }
    @wire(orgDetailsCommunity)
    wiredClient(result) {
      this.wiredClientResult = result;
        const { data, error } = result;
        if (data) {
            this.clientData = data;
            console.log('Client data:', JSON.stringify(this.clientData));
            this.ABNNumber=this.clientData.ABN__c ||'';
            this.BMSIDValue=this.clientData.BMSI_Identifier__c || '';
            this.softwareIDValue=this.clientData.SoftwareId__c || '';
            console.log('BMSIDValue '+this.BMSIDValue);
            console.log('softwareIDValue '+this.softwareIDValue);
           // this.additionalTax = this.clientData.Additional_Tax_Areas_Applicable_to_your__c;
         
        } else if (error) {
            this.handleError(error);
        }
    }
  
    handlePayRollSettings(){
        this.payRollSettingsFlag=true;
        this.accountingSettingsFlag=false;
        //this.isHome = false;
        this.isEditIcon=true;
    }
    handleAccountingSettings(){
        this.payRollSettingsFlag=false;
        this.accountingSettingsFlag=true;
        //this.isHome = false;
        this.isEditIcon=false;
    } 
    handleHideAccountingSettings() {
        this.isHome = !this.isHome;
    }

    get majorContClass() {
    return this.isHome ?  'major-cont custom-scroll': 'major-contfull  custom-scroll';
}

     handleHideSettings() {
         console.log('handleHideSettings calling  >> ');
       // this.payRollSettingsFlag=false;
        this.isHome = !this.isHome;
        this.payRollSettingsTab = !this.payRollSettingsTab;
        this.isEditIcon =!this.isEditIcon;
        //this.payGroupTabFlag = !this.payGroupTabFlag;
       // this.accountingSettingsFlag=false;
        //console.log('handleHideSettings calling  >> ');
        console.log('isHome   >> ', this.isHome);
       // console.log('handleHideSettings calling  >> ');
    }
    handleeditClose() {
        this.payrolleditflag = false;
        //this.userRole='';
        this.bmsIdButtonDisable=false;
        this.softwareButtonDisbale=false;
    }
    handleEditOrg() {
    
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
    handlesave(event){
        event.preventDefault();// stop the form from submitting
        // if(this.street && this.city && this.province && this.country && this.postalcode){
         const fields = event.detail.fields;
        // // alert(JSON.stringify(fields));
        //   fields.Address_Latest__Street__s = this.street;
        //   fields.Address_Latest__City__s =  this.city;
        //   fields.Address_Latest__StateCode__s = this.province;
        //   fields.Address_Latest__CountryCode__s = 'AU';
        //   fields.Address_Latest__PostalCode__s =  this.postalcode;
        //   fields.Generalshiftcolor__c=this.generalshiftcolor;
        //   fields.Morningshiftcolor__c=this.morningshiftcolor;
        //   fields.Afternoonshiftcolor__c=this.afternoonshiftcolor;
        //   fields.Nightshiftcolor__c=this.nightshiftcolor;
        //   fields.customshiftcolor__c=this.customshiftcolor;
        //   fields.Sleepover_Shift_Color__c=this.sleepovershiftcolor;
        /* console.log('After fields>>'+JSON.stringify(fields)); */
        this.template.querySelector('lightning-record-edit-form').submit(fields);  
       
    }

    HandleSuccess(event){
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Payroll Settings updated succesfully.',
                variant: 'success'
            })
        );
        // refreshApex(this.wiredClientResult);
        // this.handleflag();
        let orgRecID=event.detail.id;
        // uploadFile({base64: JSON.stringify(this.base64FileData), filename:this.fileName, recordId:orgRecID, obj:'org'}).then(result => {
        //    this.dispatchEvent(
        //         new ShowToastEvent({
        //             title: 'Success!!',
        //             message: this.file.name + ' - Uploaded Successfully!!!',
        //             variant: 'success',
        //         }),
        //     );
           
        // })
        setTimeout(() => {
          refreshApex(this.wiredClientResult);
      }, 1000);
        // orgDetails().then(response => {
        //     this.orgRecord = response;
        //     this.Picklist_Value=response.Id;
        //     this.OrgJsonFormat[response.Id]={"name":response.Name,"street":response.Address_Latest__Street__s,"city":response.Address_Latest__City__s,"stateCode":response.Address_Latest__StateCode__s,"countryCode":response.Address_Latest__CountryCode__s,"postalCode":response.Address_Latest__PostalCode__s};//,"additionalTax":response.Additional_Tax_Areas_Applicable_to_your__c
        // })
        // const searchEvent = new CustomEvent("getsearchvalue", {
        //     detail: this.Picklist_Value
        // });
        // //Dispatches the event
        // this.dispatchEvent(searchEvent);
        /* console.log('orgDetails ==>'+JSON.stringify(this.orgRecord));  */
        this.payrolleditflag = false; 
        //this.handleSaveSettings();
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



         handleShortcut(event){


            //      if (event.altKey && event.shiftKey && event.key === "W") {
            //         console.log('inside group name...');
            //     event.preventDefault();

            //     const nameField = this.template.querySelector('[data-id="groupNameField"]');

            //     if (nameField) {
            //         setTimeout(() => {
            //             nameField.focus();   // lightning-input supports focus()
            //         }, 10);

            //         console.log("Focused group name field via alt + h");
            //     } else {
            //         console.log("Search Payoll Group field not found.");
            //     }
            // }

    // ALT + F → focus Start Date field
// if (event.altKey && event.key.toLowerCase() === "f") {
//     event.preventDefault();

//     const field = this.template.querySelector('[data-id="dateField"]');

//     if (field) {
//         setTimeout(() => field.focus(), 10);
//         console.log("Focused Start Date field using Alt + F");
//     } else {
//         console.log("Start Date field NOT FOUND");
//     }
// }

//Focus Group Name of Create New Pay Group
if (event.ctrlKey && event.key.toLowerCase() === "g") {
        event.preventDefault();
        console.log("ctrl+g pressed");

        this.template.querySelector("c-payrun-setting")
            ?.focusgroupNameField();
    }
        //Name Of Facility of Create New Pay Group
    if (event.altKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        console.log("ALT+F pressed");

        this.template.querySelector("c-payrun-setting")
            ?.focusfacilityName();
    }


    if (event.altKey && event.key.toLowerCase() === "q") {
        event.preventDefault();
        console.log("ALT+q pressed");

        this.template.querySelector("c-payrun-setting")
            ?.focusFrequency();
    }

    if (event.altKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        console.log("alt+e pressed");

        this.template.querySelector("c-payrun-setting")
            ?.focusStartDateField();
    }
    if (event.altKey && event.key.toLowerCase() === "u") {
            event.preventDefault();
            console.log("alt+U pressed");

            this.template.querySelector("c-payrun-setting")
                ?.focusEndDateField();
        }

        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "h") {
                    event.preventDefault();
                    console.log("ctrl + shift + n pressed");

                    this.template.querySelector("c-payrun-setting")
                        ?.focusnextPayrunDateField();
                }


                            // CTRL + S  → trigger child save button
            if (event.ctrlKey && event.key.toLowerCase() === "s") {
                event.preventDefault();     // IMPORTANT → stop browser Save Page dialog

                const child = this.template.querySelector("c-payrun-setting"); 
                // replace with actual child tag

                if (child && child.focusSaveField) {
                    child.focusSaveField();     // calls child method
                    console.log("Triggered Save via Ctrl + S");
                } else {
                    console.log("Child save method not found.");
                }
            }


                     // CTRL + SHIFT + P → Open Payroll Settings
                    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "p") {
                        event.preventDefault();

                        const btn = this.template.querySelector('[data-id="payrollsettingsBtn"]');

                        if (btn) {
                            btn.click();   // Simulate click → calls handleAccountingSettings()
                            console.log("Opened Payroll  Settings using Ctrl + Shift + p");
                        } else {
                            console.log("Payroll Settings button not found.");
                        }
                    }

                // CTRL + SHIFT + C → Open Accounting Settings
                    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "c") {
                        event.preventDefault();

                        const btn = this.template.querySelector('[data-id="accountingSettingsBtn"]');

                        if (btn) {
                            btn.click();   // Simulate click → calls handleAccountingSettings()
                            console.log("Opened Accounting Settings using Ctrl + Shift + C");
                        } else {
                            console.log("Accounting Settings button not found.");
                        }
                    }

                    

     }

}