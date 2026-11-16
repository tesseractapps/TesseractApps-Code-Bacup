import {LightningElement,track,wire,api} from 'lwc';
//Import apex method 

import fetchFacilitiesByOrgId from '@salesforce/apex/FacilityController.fetchFacilitiesByOrgId';
import statusFacility from '@salesforce/apex/FacilityController.statusFacility';
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

export default class FacilityDataWithPagination extends NavigationMixin (LightningElement) {
    
    // JS Properties
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
    @api selectedName='';
    @api facilityButton;
    @track orgNam='';
    @track visible=false;
    @track isServiceModel=false;
    @track facilityName;
    @track servicePicklist;
    @track lstOptions=[];
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
            console.log(error);
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
            console.log('Successfully unsubscribed');
        });
    }
    
    @wire( fetchFacilitiesByOrgId,{recordId : '$selectedName'} )  recordsToDisplay( result) {
        
        this.refreshTable= result;
                if (result.data) {
                    this.records = result.data;
                    this.totalRecords = result.data.length; // update total records count                 
                    this.pageSize = 6;
                    if(this.totalRecords>6){
                        this.visible=true;
                    }
                   
                    this.paginationHelper(); // call helper menthod to update pagination logic 
                }
              
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
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Facility__c',
                actionName: 'new',
            },
        });
        
    }

    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    handleEditFacility(event){

        let facId = event.currentTarget.dataset.id;
        this.recordId=facId;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
                    attributes: {
                        recordId: facId,
                        objectApiName: 'Facility__c',
                        actionName: 'edit'
                    },
        });
    }
     
    handlefacStatus(event){
       let facId=event.currentTarget.dataset.id;
       let facstatus=event.target.dataset.name;
       let finalStatus;
       let message;
       if(facstatus == 'true'){
        finalStatus='false';
        message= 'Facility is Inactive'
       }
       else if(facstatus == 'false'){
        finalStatus='true';
        message= 'Facility is Active'
       }
       statusFacility({IdValue:facId,status:finalStatus}).then(response => {
        this.dispatchEvent(
            new ShowToastEvent({
                title: '',
                message: message,
                variant: 'success'
            })
        );
        
       refreshApex(this.refreshTable);

       });

    }
    servicesList(event){       
        this.isServiceModel=true;
        this.facilityName=event.currentTarget.dataset.name;
    }
    closeservicesList(){
       this.isServiceModel=false;
    }

}