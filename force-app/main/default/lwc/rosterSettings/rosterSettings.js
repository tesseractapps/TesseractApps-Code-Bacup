import { LightningElement,api,track } from 'lwc';
import orgDetailsCommunity from "@salesforce/apex/OrgDetails.orgDetailsCommunity";
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getfacilityById from '@salesforce/apex/FacilityController.getfacilityById';

export default class RosterSettings extends LightningElement {
    @api typeofuser;
    @api isOrgAdmin=false;
    @api facilitylist
    @track generalShiftColor = '';
    @track morningShiftColor = '';
    @track afternoonShiftColor = '';
    @track nightShiftColor = '';
    @track customShiftColor = '';
    @track sleepoverShiftColor = '';

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
    @track isEdit=false;
    @api facilityoptions;
    @track facilityValue='';
    @track isEditShow=true;

     HandleBack() {
        console.log('HANDLE BACK')
        this.dispatchEvent(new CustomEvent("rostersettingsbackbutton"));
    }
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
    connectedCallback() {
        console.log('CONNECTED CALLBACK');
        console.log('typeofuser '+this.typeofuser);
        console.log('org id '+this.orgid);
        console.log('facility options '+JSON.stringify(this.facilityoptions));
        this.isOrgAdmin=this.typeofuser=='NDIS Org Admin';
        this.facilityValue=this.facilityoptions[0].value;
        if(this.facilityValue !=null && this.facilityValue!='' &this.facilityValue!=undefined  && this.isOrgAdmin==false){
            this.getFacilitydata();
        }
         if(this.isOrgAdmin==true){
                orgDetailsCommunity()
                        .then(result => {
                            console.log('org data:', JSON.stringify(result));
                            this.orgid=result.Id;
                            // Shift Colors
                            this.generalShiftColor = result.Generalshiftcolor__c;
                            this.morningShiftColor = result.Morningshiftcolor__c;
                            this.afternoonShiftColor = result.Afternoonshiftcolor__c;
                            this.nightShiftColor = result.Nightshiftcolor__c;
                            this.customShiftColor = result.customshiftcolor__c;
                            this.sleepoverShiftColor = result.Sleepover_Shift_Color__c;

                        }).catch(error => {
                     this.handleError(error);
                });
         }
       
        //this.rostersettings = this.getData();
        }

        getFacilitydata(){
               getfacilityById({ facId: this.facilityValue })
                      .then(result => {
                            console.log('result '+JSON.stringify(result));
                        this.generalShiftColor = result.General_Shift_Color__c;
                        this.morningShiftColor = result.Morning_Shift_Color__c;
                        this.afternoonShiftColor = result.Afternoon_Shift_Color__c;
                        this.nightShiftColor = result.Night_Shift_Color__c;
                        this.customShiftColor = result.Custom_Shift_Color__c;
                        this.sleepoverShiftColor = result.Sleepover_Shift_Color__c;
                      }).catch(error => {
                          this.handleError(error);
                      });
        }
          get dynamicgeneralshiftcolor() {
            return `background: ${this.generalShiftColor};`;
        }
        get dynamicmorningshiftcolor() {
            return `background: ${this.morningShiftColor};`;
        }
        get dynamicafternoonshiftcolor() {
            return `background: ${this.afternoonShiftColor};`;
        }
        get dynamicnightshiftcolor() {
            return `background: ${this.nightShiftColor};`;
        }
        get dynamiccustomshiftcolor() {
            return `background: ${this.customShiftColor};`;
        }
        get dynamicsleepovercolor() {
            return `background: ${this.sleepoverShiftColor};`;
        }

         handleColorChange(event){
        if(event.target.name=='general'){
            this.generalShiftColor=event.target.value;
            console.log('color:'+this.generalShiftColor);

        }else if(event.target.name=='morning'){
            this.morningShiftColor=event.target.value;
            console.log('color:'+this.morningShiftColor);

        }else if(event.target.name=='afternoon'){
            this.afternoonShiftColor=event.target.value;
            console.log('color:'+this.afternoonShiftColor);

        }else if(event.target.name=='night'){
            this.nightShiftColor=event.target.value;
            console.log('color:'+this.nightShiftColor);

        }else if(event.target.name=='custom'){
            this.customShiftColor=event.target.value;
            console.log('color:'+this.customShiftColor);

        }else if(event.target.name=='sleep'){
            this.sleepoverShiftColor=event.target.value;
            console.log('color:'+this.sleepoverShiftColor);

        }
    }
    handleEditOrg(){
           console.log('open edit org');
            this.isEdit=true;
            this.isEditShow=false;
    }
     handleeditClose() {
       this.isEdit=false;
        this.isEditShow=true;
    }
       handlesave(event){
            event.preventDefault();// stop the form from submitting

            const fields = event.detail.fields;
            // alert(JSON.stringify(fields));
              fields.Generalshiftcolor__c=this.generalShiftColor;
              fields.Morningshiftcolor__c=this.morningShiftColor;
              fields.Afternoonshiftcolor__c=this.afternoonShiftColor;
              fields.Nightshiftcolor__c=this.nightShiftColor;
              fields.customshiftcolor__c=this.customShiftColor;
              fields.Sleepover_Shift_Color__c=this.sleepoverShiftColor;
             console.log('After fields>>'+JSON.stringify(fields)); 
            this.template.querySelector('lightning-record-edit-form').submit(fields);  
         
        }
    
        HandleSuccess(event){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Roster timings are updated successfully.',
                    variant: 'success'
                })
            );
                this.isEdit=false;
                 this.isEditShow=true;
        }
        handleFacilityChnage(event){
            console.log('facility change '+event.target.value);
            this.facilityValue=event.target.value;
            if( this.facilityValue !=null && this.facilityValue!='' &this.facilityValue!=undefined ){
             this.getFacilitydata();
            }
        }
        handleFacilitySave(event){
              const fields = event.detail.fields;
            // alert(JSON.stringify(fields));
              fields.General_Shift_Color__c=this.generalShiftColor;
              fields.Morning_Shift_Color__c=this.morningShiftColor;
              fields.Afternoon_Shift_Color__c=this.afternoonShiftColor;
              fields.Night_Shift_Color__c=this.nightShiftColor;
              fields.Custom_Shift_Color__c=this.customShiftColor;
              fields.Sleepover_Shift_Color__c=this.sleepoverShiftColor;
             console.log('After fields>>'+JSON.stringify(fields)); 
             this.template.querySelector('lightning-record-edit-form[data-recid="facilityRecordEditForm"]').submit(fields);
        }
        HandleFacilitySuccess(event){
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Roster timings are updated successfully.',
                    variant: 'success'
                })
            );
                this.isEdit=false;
                 this.isEditShow=true;
        }
}