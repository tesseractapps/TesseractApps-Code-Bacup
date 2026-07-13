import { LightningElement, track, api, wire } from 'lwc';
import getAppStatus from '@salesforce/apex/HrJobApplicationHandler.getAppStatus';
import createJobApp from '@salesforce/apex/HrJobApplicationHandler.createJobApp';
import getJobAds from '@salesforce/apex/HrHomeHandler.getJobAds';
import { refreshApex } from '@salesforce/apex';
import JOBAPP_OBJECT from '@salesforce/schema/Job_Application__c';
import APPSTATUS_FIELD from '@salesforce/schema/Job_Application__c.Application_status__c';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import FORM_FACTOR from '@salesforce/client/formFactor';


export default class HrjobApplication extends LightningElement {
    @track addAppStatus = false;
    @track data;
    @track refreshTable = [];
    @track fname;
    @track lname;
    @track contact;
    @track email;
    @track jobtitle;
    @track intdate;
    @track jobOptions = [];
    @track appstatusPicklistValues;
    @track selectedAppstatus;
    @track appstatus;

    get isDesktop() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Large';
    }
    
    get isMobile() {
        //alert(FORM_FACTOR);
        return FORM_FACTOR === 'Small';
    }

    @wire(getObjectInfo, { objectApiName: JOBAPP_OBJECT })
    objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$objectInfo.data.defaultRecordTypeId', fieldApiName: APPSTATUS_FIELD })
    appstatusPicklistValues;

    connectedCallback() {
        let tempConList = [];
        getAppStatus().then(response => {
            //this.jobAdsList=response; 
            response.forEach(record => {
                let tempRec = Object.assign({}, record);
                tempRec.interviewDate = new Date(tempRec.Interview_date__c).toLocaleDateString('en-GB');
                tempRec.Name = '/' + tempRec.Id;
                tempRec.jobTitile = '/' + tempRec.Advertisement__c;
                tempRec.fullname = tempRec.First_Name__c+' '+tempRec.Last_Name__c;
                tempConList.push(tempRec);
            });
            //this.accounts=tempConList; 
            this.data = tempConList;
            this.refreshTable = this.data;
            refreshApex(this.refreshTable);
            //console.log('app status save>>>>', this.refreshTable.length);
        }).catch(err => {
            console.log('Oh noooo!!');
            console.log(err);
            //alert(err);
        });

        getJobAds().then(response => {

            this.jobOptions = response.map(record => ({ value: record.Id, label: record.Job_Title__c }))

        }).catch(err => {
            console.log('Oh noooo!!');
            console.log(err);

        });
    }

    handleChangeApp(event) {
        let value = event.detail.value;
        if (event.target.name == 'fname') {
            this.fname = event.detail.value;
        }
        if (event.target.name == 'lname') {
            this.lname = event.detail.value;
        }
        if (event.target.name == 'contact') {
            this.contact = event.detail.value;
        }
        if (event.target.name == 'email') {
            this.email = event.detail.value;
        }
        if (event.target.name == 'jobtitle') {
            this.jobtitle = event.detail.value;
        }
        if (event.target.name == 'intdate') {
            this.intdate = event.detail.value;
        }
        if (event.target.name == 'appstatus') {
            this.appstatus = event.detail.value;
        }
    }

    handleSubmitApp(event) {
       
        if(this.intdate==undefined || this.appstatus==undefined || this.jobtitle==undefined
            || this.fname==undefined || this.lname==undefined || this.contact==undefined
            || this.email==undefined) {
                const evt = new ShowToastEvent({
                    title: ' Error',
                    message: 'Provide the required fields',
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);   
        }
        else{    
            createJobApp({ fname: this.fname, lname: this.lname, contact: this.contact, email: this.email, jobtitle: this.jobtitle, intdate: this.intdate, appstatus: this.appstatus }).then(response => {
                console.log("create job application");
                getAppStatus().then(response => {
                    let tempConList = [];
                    response.forEach(record => {
                        let tempRec = Object.assign({}, record);
                        tempRec.Name = '/' + tempRec.Id;
                        tempRec.jobTitile = '/' + tempRec.Advertisement__c;
                        tempConList.push(tempRec);
                    });
                    this.data = tempConList;
                    this.refreshTable = this.data;
                    refreshApex(this.refreshTable);
                })
               
            });
            this.addAppStatus=false;
        }    
        
    }

    handleAdd() {
        this.addAppStatus = true;
    }

    closeAppstatusModal() {
        this.addAppStatus = false;
    }
}