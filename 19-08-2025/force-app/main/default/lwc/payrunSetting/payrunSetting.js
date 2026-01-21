/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 07-10-2023
 * @last modified by  : Raja Sekhar Reddy
**/
import { LightningElement, track, wire, api } from 'lwc';
import getpPaySettings from '@salesforce/apex/PayrunSettingHandler.getpPaySettings';
import getFacilityList from '@salesforce/apex/PayrunSettingHandler.fetchFacilitiesByOrgId';
import payrollRun from '@salesforce/apex/PayrunSettingHandler.payrollRun';
import insertInvoice from '@salesforce/apex/PayrunSettingHandler.insertInvoice';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import STAFF_OBJECT from '@salesforce/schema/Staff__c';
import EMPLOYMENTTYPE_FIELD from '@salesforce/schema/Staff__c.Employment_type__c';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import My_Resource from "@salesforce/resourceUrl/myResource";
import FORM_FACTOR from '@salesforce/client/formFactor';
//import getLastPayDate from '@salesforce/apex/PayrunSettingHandler.getLastPayDate';
import fetchPayrollStaff1 from '@salesforce/apex/PayRunHandler.fetchPayrollStaff1';
import { CurrentPageReference } from 'lightning/navigation';
import getCustomMetaData from '@salesforce/apex/PayRunHandler.getCustomMetaData';
import Id from '@salesforce/user/Id';
import OrgNisation from '@salesforce/schema/User.Organization_Name__c';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { deleteRecord } from 'lightning/uiRecordApi';

const columns = [
{ label: 'First Name', fieldName: 'firstName' },
{ label: 'Last Name', fieldName: 'lastName' },
{ label: 'Frequency', fieldName: 'frequency' },
{ label: 'Contact Number', fieldName: 'contactNumber' }

];

export default class PayRunSetting extends NavigationMixin(LightningElement) {
    @track isaddpayrun = false;
    @track payrunSetting = [];
    @track payrun;
    @track facilityNewList;
    @track employmentTypePicklistValues;
    @track buttonsONPayroll = false;
    @track staffrecords;
    @track staffnewId;
    @track facilitynewValue;
    @track groupName;
    @track sdate;
    @track edate;
    @track ndate;
    @track typeofEmployment;
    @track columns = columns;
    @track selectedRowsFinalList;
    @track isopenPaysettings = false;
    @track staffNameLatest =[];
    @track staffIdLatest=[];
    @track paysetId;
    @track ispayset = true;
    @track lstpaydt;
    @track customMetadatDetails;
    @track ChartOfAccountFlag=false;
    @track openCHartForm=false;  
    @track chartId;
    @track orgName;
    @track keyWordsList=[];
    wiredKeyWords
    records = []; //All records available in the data table    
    totalRecords = 0; //Total no.of records
    pageSize; //No.of records to be displayed per page
    totalPages; //Total no.of pages
    pageNumber = 1; //Page number    
    @track visible = false;
    paysetting = My_Resource + '/myResource/images/PayrollSettings.svg';

    @wire(getObjectInfo, { objectApiName: STAFF_OBJECT })
    objectInfoStaff;
    @wire(getPicklistValues, { recordTypeId: '$objectInfoStaff.data.defaultRecordTypeId', fieldApiName: EMPLOYMENTTYPE_FIELD })
    employmentTypePicklistValues;

   // @wire(CurrentPageReference) pageRef;

    get isDesktop() {
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }

    @wire(getRecord, { recordId: Id, fields: [OrgNisation]}) 
     userDetails({error, data}) {
         if (data) {
           console.log('organisation '+data.fields.Organization_Name__c.value);
           this.orgName=data.fields.Organization_Name__c.value;
         } else if (error) {
         }
     }


    handlePaySettings() {     
        this.isaddpayrun = true;
        this.ispayset = false;
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDay() + 1);

        this.sdate = today.toISOString().slice(0, 10);

        var last = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDay() + 7);
        this.edate = last.toISOString().slice(0, 10);


        var ndatelast = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDay() + 8);
    // this.ndate = ndatelast.toISOString().slice(0, 10);


        getFacilityList().then(response => {
            this.facilityNewList = response.map(record => ({ value: record.Id, label: record.Name }))

        }).catch(err => {
           // console.log(err);
        });
         this.hideParentHandler();

    }
    hideParentHandler(){
        console.log('hideParentHandler calling  >> ');
        const event = new CustomEvent('hidesettings');
        this.dispatchEvent(event);
    }
    handleHidePayRunSettings(){
        console.log('handleHidePayRunSettings calling  >> ');
        
         this.isopenPaysettings = false;
        this.ispayset = false;
        this.isaddpayrun = false;
        this.hideParentHandler();
    }
    // handleHideAccountingSettings(){
    //     this.hideParentHandler(); 
    // }

    @api reload() {
        this.isopenPaysettings = false;
        this.ispayset = true;
        this.isaddpayrun = false;
    }

    connectedCallback() {
        let tempconList = [];
        getpPaySettings().then(response => {
            response.forEach(record => {
                let tempRec = Object.assign({}, record);
                tempRec.startDate = new Date(tempRec.Period_Start_Date__c).toLocaleDateString('en-GB');
                tempRec.endDate = new Date(tempRec.Period_End_Date__c).toLocaleDateString('en-GB');
                tempRec.nextDate = new Date(tempRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                if (tempRec.Status__c != 'Submitted' && tempRec.Status__c != 'Delete' && tempRec.Status__c != 'STP Filed') {
                    tempconList.push(tempRec);
                }
                
            })
            this.records = tempconList;
                this.totalRecords = this.records.length; // update total records count                 
                this.pageSize = 10;
                if (this.totalRecords > 10) {
                    this.visible = true;
                }
                //this.payrunSetting=tempconList;
            this.paginationHelper();

        })
    }

    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
    }
    // c
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
    paginationHelper() {
        this.payrunSetting = [];
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
            this.payrunSetting.push(this.records[i]);
        }
        //refreshApex(this.refreshTable); 
    }

    closeaddPayRun() {
        this.isaddpayrun = false;
        this.ispayset = true;
        this.staffrecords = [];
        this.buttonsONPayroll = false;
        this.selectedRowsFinalList = [];
        this.facilitynewValue = '';
        this.sdate = '';
        this.edate = '';
        this.ndate = '';
        this.typeofEmployment = '';
         this.hideParentHandler();
    }

    savePayrunSetting() {
       // console.log('length of staffList ',this.staffIdLatest.length);
        let tempconlist = [];
            
        if (this.facilitynewValue == undefined || this.groupName == undefined || this.sdate == undefined || this.edate == undefined || this.ndate == undefined || this.typeofEmployment == undefined ) {

            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Please provide the required data',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        } else if(this.staffIdLatest.length ==0 ){
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Please select atleast one staff to create a pay group',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);

        }else if(this.customMetadatDetails==0){
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Pay Run Financial year data is empty',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);

        }else{
           // console.log('calling');
            insertInvoice({
                JsonString: JSON.stringify(this.staffNameLatest), jsonStringStaffPayollId :JSON.stringify(this.staffIdLatest), facilityid: this.facilitynewValue,
                periodStartDate: this.sdate, periodEndDate: this.edate, nextPayDate: this.ndate,
                frequency: this.typeofEmployment, groupName: this.groupName,
            }).then(response => {
                this.isaddpayrun = false;
                this.ispayset = true;
                this.buttonsONPayroll = false;
                this.staffNameLatest=[];
                this.staffIdLatest=[];
                this.selectedRowsFinalList = [];
                this.facilitynewValue = '';
                this.sdate = '';
                this.edate = '';
                this.ndate = '';
                this.typeofEmployment = '';
                this.groupName = '',

                    getpPaySettings().then(response => {
                        response.forEach(record => {
                            let tempRec = Object.assign({}, record);
                            tempRec.startDate = new Date(tempRec.Period_Start_Date__c).toLocaleDateString('en-GB');
                            tempRec.endDate = new Date(tempRec.Period_End_Date__c).toLocaleDateString('en-GB');
                            tempRec.nextDate = new Date(tempRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                            if (tempRec.Status__c != 'Submitted') {
                                tempconlist.push(tempRec);
                            }                            

                        })
                        //this.payrunSetting=tempconlist;
                        this.records = tempconlist;
                            this.totalRecords = this.records.length; // update total records count                 
                            this.pageSize = 10;
                            if (this.totalRecords > 10) {
                                this.visible = true;
                            }
                            //this.payrunSetting=tempconList;
                        this.paginationHelper();
                    })

                    this.dispatchEvent(
                        new ShowToastEvent({
                          title: 'Success',
                          message: 'New Pay group is created',
                          variant: 'success'
                        })
                      ); 
            })

        }
    }

    handleFacilityChange(event) { 
       // console.log('in hadlechange');
        let selectedValue;
        if(event.target.name == 'ndate'){
           // console.log('ndate',event.target.name);
             this.ndate= event.detail.value;
            // console.log('ndate val',this.ndate );
             this.customMetadatDetails=0
            getCustomMetaData({PayDate: this.ndate}).then(response => {
                this.customMetadatDetails=response.length;
               // console.log('custom meta data Details '+this.customMetadatDetails);
            }).catch(error=>{
               // console.log('custom meta error '+JSON.stringify(error));
            });
        }
        if (event.target.name == 'facility') {
            selectedValue = event.detail.value;
            this.facilitynewValue = event.detail.value;      
        }
        if (event.target.name == 'groupName') {
            selectedValue = event.detail.value;
            this.groupName = event.detail.value;
        }
        if (event.target.name == 'typeofEmployment') {
            this.typeofEmployment = event.detail.value;
           // console.log('type of employment==>'+this.typeofEmployment);
            if(this.lstpaydt !=''){
                var dateConvert=new Date(this.lstpaydt);
            }else{
        // var dateConvert = new Date(this.sdate);
        // console.log('start date'+this.sdate);
            }
           // console.log('start date'+this.sdate);
            var dateConvert = new Date(this.sdate);
           // console.log('start date==>'+dateConvert);
            var date = new Date();
            var ndateValue = new Date();
            if (this.typeofEmployment == 'Weekly') {
                date = new Date(dateConvert.setDate(dateConvert.getDate() + 6));
               // console.log('weekly date'+date);
                this.edate = date.toISOString().slice(0, 10);
                ndateValue = new Date(dateConvert.setDate(dateConvert.getDate() + 1));
            }
            else if (this.typeofEmployment == 'Fortnightly') {
                date = new Date(dateConvert.setDate(dateConvert.getDate() + 13));
                this.edate = date.toISOString().slice(0, 10);
               // console.log('fortnightly date date'+date);
                ndateValue = new Date(dateConvert.setDate(dateConvert.getDate() + 1));
            } else {
                date =this.endOfMonth(dateConvert);
               // console.log('monthly end date==>'+date)
                //date = new Date(dateConvert.setDate(dateConvert.getDate() + 29));
                ndateValue = new Date(dateConvert.setDate(dateConvert.getDate() + 1));
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 since month is zero-based
                const day = String(date.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;
                this.edate=formattedDate;
            }
           // console.log(' end date==>'+ this.edate);
    //     this.ndate = ndateValue.toISOString().slice(0, 10);

        }
        if (event.target.name == 'sdate') {
            this.sdate = event.detail.value;
            var dateConvert = new Date(this.sdate);
           // console.log('during start date change==>'+dateConvert);
            var date = new Date();
            var ndateValue = new Date();
            if (this.typeofEmployment == 'Weekly') { 
                date = new Date(dateConvert.setDate(dateConvert.getDate() + 6));
                ndateValue = new Date(dateConvert.setDate(dateConvert.getDate() + 1));
                this.edate = date.toISOString().slice(0, 10);
            }
            else if (this.typeofEmployment == 'Fortnightly') {
                date = new Date(dateConvert.setDate(dateConvert.getDate() + 13));
                ndateValue = new Date(dateConvert.setDate(dateConvert.getDate() + 1));
                this.edate = date.toISOString().slice(0, 10);
            } else {
            // date = new Date(dateConvert.setDate(dateConvert.getDate() + 29));
                date =this.endOfMonth(dateConvert);
               // console.log('monthly end date==>'+date)
                ndateValue = new Date(dateConvert.setDate(dateConvert.getDate() + 1));
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 since month is zero-based
                const day = String(date.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;
                this.edate=formattedDate;
            }
            
        //   this.ndate = ndateValue.toISOString().slice(0, 10);
        }
        
        this.handlepayrollRun();

    }
    endOfMonth(dateConvert){
        const year = dateConvert.getFullYear();
        const month = dateConvert.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        return new Date(year, month, lastDayOfMonth);
    }

    handlepayrollRun() {
        //this.staffrecords=[];
        payrollRun({ factId: this.facilitynewValue, employmentType: this.typeofEmployment }).then(response => {

            let tempConList = [];
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                tempConRec.firstName = tempConRec.staffData.Name;
                tempConRec.staffId = tempConRec.staffData.Id;
                tempConRec.lastName = tempConRec.staffData.Last_Name__c;
                tempConRec.frequency = tempConRec.staffData.Employment_type__c;
                tempConRec.contactNumber = tempConRec.staffData.Contact_Number__c;
                tempConList.push(tempConRec);

            })
            this.staffrecords = tempConList;
           // console.log("PayRoll Settings Information: " + JSON.stringify(this.staffrecords));

            if (this.staffrecords.length > 0) {
                this.buttonsONPayroll = true;
            } else {
                this.buttonsONPayroll = false;
            }

            //console.log('staffrecords>>>>>>>>>>', JSON.stringify(this.staffrecords));
        })
    }

    onRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        this.staffNameLatest=[];
        this.staffIdLatest=[];
        for(const staffRed of selectedRows){
            this.staffNameLatest.push(staffRed.staffData.Name+' '+staffRed.staffData.Last_Name__c);
            this.staffIdLatest.push(staffRed.staffData.Id);
        }
       // console.log('list of ',JSON.stringify(this.staffNameLatest));
       // console.log('list of ',JSON.stringify(this.staffIdLatest));
        this.selectedRowsFinalList = JSON.stringify(selectedRows);

    }

    handleSelect(event) {
        this.staffnewId = event.currentTarget.dataset.id;

    }

    @track payGroupName ;
    @track fequency;

    openPaysettings(event) {
        this.isopenPaysettings = true;
        this.ispayset = false;
        this.paysetId = event.currentTarget.dataset.id;
        this.payGroupName=event.currentTarget.dataset.groupname; // new line added by praveen
        this.fequency = event.currentTarget.dataset.fequency; 
        this.hideParentHandler();
    }
    @track searchGroupName;
    onSearchPayrollSetting(event){
        this.searchGroupName = event.detail.value;
       // console.log('Payroll GroupName>>>'+this.searchGroupName);
        let tempconList =[];
        setTimeout(() => {     
            fetchPayrollStaff1({payrollGroupName: this.searchGroupName }).then(response=> {
               // console.log('search results '+ JSON.stringify(response))
                response.forEach(record => {
                  
                    let tempRec = Object.assign({}, record);
                    tempRec.startDate = new Date(tempRec.Period_Start_Date__c).toLocaleDateString('en-GB');
                    tempRec.endDate = new Date(tempRec.Period_End_Date__c).toLocaleDateString('en-GB');
                    tempRec.nextDate = new Date(tempRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                    if (tempRec.Status__c != 'Submitted' && tempRec.Status__c != 'Delete' && tempRec.Status__c != 'STP Filed' &&  tempRec.StaffList__c !='0') {
                        tempconList.push(tempRec);
                    }
                    
                })
                this.records = tempconList;
                    this.totalRecords = this.records.length; // update total records count                 
                    this.pageSize = 10;
                    if (this.totalRecords > 10) {
                        this.visible = true;
                    }
                    //this.payrunSetting=tempconList;
                this.paginationHelper();
    
            }).catch(error=>{
            })
        }, 1000);
      
    }

    fetchPayrollSetting(){
        let tempconList = [];
        getpPaySettings().then(response => {
            response.forEach(record => {
                let tempRec = Object.assign({}, record);
                tempRec.startDate = new Date(tempRec.Period_Start_Date__c).toLocaleDateString('en-GB');
                tempRec.endDate = new Date(tempRec.Period_End_Date__c).toLocaleDateString('en-GB');
                tempRec.nextDate = new Date(tempRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                if (tempRec.Status__c != 'Submitted' && tempRec.Status__c != 'Delete' && tempRec.Status__c != 'STP Filed') {
                    tempconList.push(tempRec);
                }
                
            })
           // console.log('Paysetting Data >>>'+ JSON.stringify(this.records));
            this.records = tempconList;
                this.totalRecords = this.records.length; // update total records count                 
                this.pageSize = 10;
                if (this.totalRecords > 10) {
                    this.visible = true;
                }
                //this.payrunSetting=tempconList;
            this.paginationHelper();

        })
    }
    @track isOpenModal;
   /*  handleFinalised(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                
                pageName: 'finalised'
            },
        });
    } */

    @track isFinalisedFlag = false;
    handleFinalised(){
        this.ispayset = false;
        this.isaddpayrun = false;
        this.isopenPaysettings = false;
        this.isFinalisedFlag = true;
        this.handleHidePayRunSettings();
         this.hideParentHandler();
    }
  
    hideModalBox(){
        this.isOpenModal=false;    
    }  

    handleSuperSend(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                
                pageName: 'supersend'
            },
        });
    }
    handleFinalisedBack(){
        console.log('From Child ');
        this.ispayset = true;
        this.isaddpayrun = false;
        this.isopenPaysettings = false;
        this.isFinalisedFlag = false;
        // this.handleHidePayRunSettings();
        this.hideParentHandler();
    }
      
    
}