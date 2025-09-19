import { LightningElement,api,track } from 'lwc';
import staffPayroll from '@salesforce/apex/PayrunSettingHandler.staffPayroll';
import { NavigationMixin } from 'lightning/navigation';
import { deleteRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import newStaffList from '@salesforce/apex/PayrunSettingHandler.newStaffList';
import updatePayset from '@salesforce/apex/PayrunSettingHandler.updatePayset';
import getCustomMetaData from '@salesforce/apex/PayRunHandler.getCustomMetaData';


const columns = [
    { label: 'First Name', fieldName: 'firstName' },
    { label: 'Last Name', fieldName: 'lastName' },
    { label: 'Frequency', fieldName: 'frequency' },
    { label: 'Contact Number', fieldName: 'contactNumber' }

];
export default class PaysettingsDetails extends NavigationMixin(LightningElement) {
    @api paysetId;
    @api payGroupName;
    @track payrollStaff;    
    @track columns = columns;
    @track buttonsONPayroll = false;
    @track staffrecords;
    @track staffNameLatest;
    @track staffIdLatest;
    @track selectedRowsFinalList;
    @track iststaus=false;
    @track paysetEdit=false;
    @api fequency;
    @track customMetadatDetails;

    connectedCallback(){
        console.log('pay group name '+this.payGroupName);
        staffPayroll({ payrollId: this.paysetId}).then(response => {
            this.payrollStaff=response;
            console.log('status>>>',this.payrollStaff[0].Payroll_Setting__r.Status__c);
            //console.log('status>>>',JSON.stringify(this.payrollStaff));
            if(this.payrollStaff[0].Payroll_Setting__r.Status__c===undefined){
                this.iststaus=true;
            }

        }).catch(err => {
            console.log(err);
        });
      
    }
    
    handleEditStaff(event){
       this.paysetEdit=true; 
       console.log('Fequency>>'+this.fequency);
       /* this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
                    attributes: {
                        recordId: this.paysetId,
                        objectApiName: 'Payroll_Setting__c',
                        actionName: 'edit'
                    },
        });*/
    }
    handleeditClose(event){
        this.paysetEdit=false;  
    }

    handleSuccess(event){
        this.paysetEdit=false;
        this.dispatchEvent(
            new ShowToastEvent({
              title: 'Success',
              message: 'Changes Saved Successfullly',
              variant: 'success'
            })
        ); 
    }

    handleDelete(event){
        let payId = event.currentTarget.dataset.id;
      
          deleteRecord(payId).then(() => {
            this.dispatchEvent(
              new ShowToastEvent({
                title: 'Success',
                message: 'Staff deleted from Payrun Setting',
                variant: 'success'
              })
            );
            staffPayroll({ payrollId: this.paysetId }).then(response => {
                this.payrollStaff=response;
    
            }).catch(err => {
                console.log(err);
            });
        });
    }

    @track isstaffList=false;
    displayStaffList(){
        this.isstaffList=true;
        newStaffList({ payrollSettingId: this.paysetId }).then(response => {
            console.log('staffrecords>>>>>>>>>>', JSON.stringify(response));
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

            if (this.staffrecords.length > 0) {
                this.buttonsONPayroll = true;
            } else {
                this.buttonsONPayroll = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                      title: 'Error',
                      message: 'No staff is available for this facility',
                      variant: 'error'
                    })
                  );
            }            
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
        console.log('list of ',JSON.stringify(this.staffNameLatest));
        console.log('list of ',JSON.stringify(this.staffIdLatest));
        this.selectedRowsFinalList = JSON.stringify(selectedRows);

    }

    closeaddPayRun() {           
        this.staffrecords = [];
        this.buttonsONPayroll = false;
        this.selectedRowsFinalList = [];
        this.isstaffList=false;
       
    }

    savePayrunSetting(){
        updatePayset({paysetId:this.paysetId,jsonStringStaffPayollId :JSON.stringify(this.staffIdLatest) }).then(response => {
            staffPayroll({ payrollId: this.paysetId }).then(response => {
                this.payrollStaff=response;
    
            })
            console.log('  this.payrollStaff>>>>',JSON.stringify(  this.payrollStaff));
            this.isstaffList=false;
        }).catch(err => {
            console.log(err);
        });

    }

   /*  handleBackToPayroll(event){
        event.preventDefault();
        console.log('onclick ')
        this[NavigationMixin.Navigate]({
            type: "standard__component",
            attributes: {
              componentName: "c__navigateToPayrunSetting"
            }
          });
    } */

    @track sdate;
    @track edate;

    endOfMonth(dateConvert){
        const year = dateConvert.getFullYear();
        const month = dateConvert.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        return new Date(year, month, lastDayOfMonth);
    }

    handleFrequencyChange(event)
    {
        this.sdate = '';
        this.fequency = event.detail.value;
    }

    handleDateChange(event){
        this.sdate = event.detail.value;
        var dateConvert = new Date(this.sdate);
        console.log('during start date change==>'+dateConvert);
        var date = new Date();
        var ndateValue = new Date();  
        
        if (this.fequency == 'Weekly') { 
            date = new Date(dateConvert.setDate(dateConvert.getDate() + 6));
            ndateValue = new Date(dateConvert.setDate(dateConvert.getDate() + 1));
            this.edate = date.toISOString().slice(0, 10);
            console.log('Weekly Enddate>>'+this.edate);
        }
        else if (this.fequency == 'Fortnightly') {
            date = new Date(dateConvert.setDate(dateConvert.getDate() + 13));
            ndateValue = new Date(dateConvert.setDate(dateConvert.getDate() + 1));
            this.edate = date.toISOString().slice(0, 10);
            console.log('Fortnightly Enddate>>'+this.edate);
        } else if (this.fequency == 'Monthly'){
        // date = new Date(dateConvert.setDate(dateConvert.getDate() + 29));
            date =this.endOfMonth(dateConvert);
            console.log('monthly end date==>'+date)
            ndateValue = new Date(dateConvert.setDate(dateConvert.getDate() + 1));
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 since month is zero-based
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            this.edate=formattedDate;
            console.log('Monthly Enddate>>'+this.edate);
        }
    }

    handleNextpayChange(event){
        this.customMetadatDetails=0;
        getCustomMetaData({PayDate: event.detail.value}).then(response => {
            this.customMetadatDetails=response.length;
            console.log('custom meta data Details '+this.customMetadatDetails);
        }).catch(error=>{
            console.log('custom meta error '+JSON.stringify(error));
        });

    }
    
    handleSubmit(event){
        if(this.customMetadatDetails==0){
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Pay Run Financial year data is empty',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
            event.preventDefault();
        }else{
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        }
    }
 
}