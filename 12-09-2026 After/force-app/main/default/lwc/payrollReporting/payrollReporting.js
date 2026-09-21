import { LightningElement,track,wire,api} from 'lwc';
import NAME_FIELD from '@salesforce/schema/Organisation__c.Name';
import ABN_FIELD from '@salesforce/schema/Organisation__c.ABN__c';
import ACN_FIELD from '@salesforce/schema/Organisation__c.ACN__c';
import NDIS_FIELD from '@salesforce/schema/Organisation__c.NDIS_Provider__c';
import CONTACT_FIELD from '@salesforce/schema/Organisation__c.Contact_No__c';
import EMAIL_FIELD from '@salesforce/schema/Organisation__c.Email__c';
import Add_FIELD from '@salesforce/schema/Organisation__c.Address__c';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import { NavigationMixin } from 'lightning/navigation';
import FORM_FACTOR from '@salesforce/client/formFactor';
import Objects_Type from "@salesforce/apex/OrgDetails.orgName";
import Id from '@salesforce/user/Id';
import ProfileName from '@salesforce/schema/User.Profile.Name';
import { getRecord } from 'lightning/uiRecordApi';
import My_Resource from "@salesforce/resourceUrl/myResource";
import ChartJS from '@salesforce/resourceUrl/chratJs';
import jsPDF from '@salesforce/resourceUrl/jspdf';
import { loadScript } from "lightning/platformResourceLoader";
import getFacilityData from '@salesforce/apex/PayrunSettingHandler.fetchFacilitiesByOrgId';
import fetchExpenses from '@salesforce/apex/PayrollReportingHandler.fetchExpenses';
import fetchInvoices from '@salesforce/apex/PayrollReportingHandler.fetchInvoices';
import fetchStaffPayrollSetting from '@salesforce/apex/PayrollReportingHandler.fetchStaffPayrollSetting';
import getStatementData from '@salesforce/apex/ActivityStatementHandler.getStatementData';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';
import getActivityStatement from '@salesforce/apex/ActivityStatementHandler.getActivityStatement';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PayrollReporting extends NavigationMixin(LightningElement) {
    admin = My_Resource+'/myResource/images/admin.svg';
    @track Picklist_Value;
    @track objectApiName='Organisation__c';
    fields = [NAME_FIELD, ABN_FIELD, ACN_FIELD,NDIS_FIELD,CONTACT_FIELD,EMAIL_FIELD,Add_FIELD];
    @track l_All_Types;
    @track TypeOptions;
    @track orgRecord;
    userId = Id;
    userProfileName;
    @track editFlag=false;
    @track sdate;
    @track edate;
    @track isVisible;   
    @track invoiceTable=[];
    @track expenseTable=[];
    @track PayrollSettingTable=[];
    @track expensesAmount;
    @track paryollSettingAmount;
    @track invoiceAmount;
    @track frequency;
    @track chartJSLoaded;
    @track chart;
    @track isLibraryLoaded = false;
    @track abn;
    @track orgName;
    @track orgStreet;
    @track stateCode;
    @track postalCode;
    @track countryCode;
    @track orgCity;
    @track contactNo;
    @track logo;

    @track excelDataInvoice=[];
    @track excelDataExpense=[];
    @track excelDataWages=[];
    @track selectedFacilityValue;
    @track facilityOptions;

    @track addExpenses = true;
    @track Listofdata_Pagination = [];
    @track pageSizeOptions = [5, 10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number   
 
    @track addExpenses = true;
    @track isOpenModal = false;
    @track typeofExpense;   
    @track staffexpensesData = false;
    @track staffexpensesNoData = false;
    @api recordId = '';
    @track selectedValue;
    @track fileName = '';
    @track orgId;
    @track orgname;
    @track abn;
    @track address;
    @track statePostal;
    @track orgLogo;
    @track currentUrl;
    @track isPopupOpen = false;
    @track recentEmpData = [];
    @track base64FileData;
    @track paygTotalAmountW5;
    @track  responseData = [];
    @track paygAmountW2;
    @track paygAmountW3;
    @track paygAmount4; 
    @track BIas = false;
    @track CBas = false;
    @track DBas = false;
    @track FBas = false;
    @track GBas = false;
    @track IIas = false;
    @track JIas = false;
    @track NBas = false;
    @track PBas = false;
    @track QBas = false;
    @track RBas = false;
    @track SBas = false;
    @track TBas = false;
    @track UBas = false;
    @track VBas = false;
    @track WBas = false;
    @track XBas = false;
    @track YBas = false;
    @track ZBas = false;
    @track startDate;
    @track endDate;
    @track showSpinner=false;
    @track isHome = true;
    @track aBasChild = false;
    @track bIaschild = false;
    @track cBasChild = false;
    @track dBasChild = false;
    @track fBasChild = false;
    @track gBasChild = false;
    @track iIasChild = false;
    @track jIasChild = false;
    @track nAnnual = false;
    @track pAnnual = false;
    @track qAnnual = false;
    @track rQuartely = false;
    @track sQuartely = false;
    @track tQuartely = false;
    @track uBasChild = false;
    @track vBasChild = false;
    @track wBasChild = false;
    @track xBasChild = false;
    @track yBasChild = false;
    @track zAnnual = false;

    formtypeOptions = [
        { label: 'A.Bas', value: 'A.BAS' },
        { label: 'B.IAS', value: 'B.IAS' },
        { label: 'C.BAS', value: 'C.BAS' },
        { label: 'D.BAS', value: 'D.BAS' },
        { label: 'F.BAS', value: 'F.BAS' },
        { label: 'G.BAS', value: 'G.BAS' },
        { label: 'I.IAS', value: 'I.IAS' },
        { label: 'J.IAS', value: 'J.IAS' },
        { label: 'N.Annual PAYG', value: 'N.Annual PAYG' },
        { label: 'P.Annual GST Return', value: 'P.Annual GST Return' },
        { label: 'Q.Annual GST Information Report', value: 'Q.Annual GST Information Report' },
        { label: 'R.Quarterly PAYG Instalment Notice', value: 'R.Quarterly PAYG Instalment Notice' },
        { label: 'S.Quartely Instalment Notice', value: 'S.Quartely Instalment Notice' },
        { label: 'T.Quartely GST & PAYG Instalment Notice', value: 'T.Quartely GST & PAYG Instalment Notice' },
        { label: 'U.BAS', value: 'U.BAS' },
        { label: 'V.BAS', value: 'V.BAS' },
        { label: 'W.BAS', value: 'W.BAS' },
        { label: 'X.BAS', value: 'X.BAS' },
        { label: 'Y.BAS', value: 'Y.BAS' },
        { label: 'Z.Annual GST Return', value: 'Z.Annual GST Return' }
    ];

    renderedCallback() {
        Promise.all([
            loadScript(this, jsPDF).then(() => {
               // console.log("JS loaded jsPDF");
            }).catch(error => {
            })
        ]);
    }
    @wire(getRecord, { recordId: Id, fields: [ProfileName] })
    userDetails({ error, data }) {
        if (error) {
            this.error = error;
        } else if (data) {
            if (data.fields.Profile.value != null) {
                this.userProfileName = data.fields.Profile.value.fields.Name.value;
            }

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
                    options.push({ label: data[key].Name, value: data[key].Id  });
                }
                this.TypeOptions = options;                 
            } catch (error) {
                //console.error('check error here', error);
            }
        } else if (error) {
           /// console.error('check error here', error);
        } 
    }
    connectedCallback(){
        orgDetails().then(response=>{
            this.orgRecord=response;
            //console.log('recordsnew>>>>>',response);
            this.Picklist_Value = response.Id;
            this.abn = response.ABN__c;
            this.orgName = response.Name;
            this.orgStreet = response.Address_Latest__Street__s;
            this.orgCity = response.Address_Latest__City__s;
            this.stateCode = response.Address_Latest__StateCode__s;
            this.postalCode = response.Address_Latest__PostalCode__s;
            this.countryCode = response.Address_Latest__CountryCode__s;
            this.contactNo = response.Contact_No__c; 
            if(this.userProfileName=='System Administrator'){
                this.editFlag=true;
            }
            const searchEvent = new CustomEvent("getsearchvalue",{
                detail : this.Picklist_Value
            });        
            //Dispatches the event
            this.dispatchEvent(searchEvent);
        });
        getFacilityData().then(response => {
            this.facilityOptions = response.map(record => ({ value: record.Id, label: record.Name }))          
        }).catch(err => {
            
        });
        this.records=[];
        this.formtypeValue = '';
        this.startDatainputvalue = '';
        this.endDateinputvalue = '';
        this.expensesData();
        this.handleInvoiceData();
    }
    @track startDatainputvalue='';
    @track endDateinputvalue='';
    @track formtypeValue='';
    expensesData() {
        let tempConList = []; 
        getStatementData({formType: this.formtypeValue,startDate: this.startDatainputvalue, endDate: this.endDateinputvalue}).then(response => {
           // console.log('calling expenses Data1 >>'+JSON.stringify(response));
            if (response != null) {      
                response.forEach(record => {
                    let tempRec = Object.assign({}, record);
                    tempRec.Name = '/' + tempRec.Id;
                    tempRec.amazonUrl = tempRec.Amazon_URL__c;
                    tempRec.staff = tempRec.Staff_Name__c;
                    tempRec.formType = tempRec.Form_Type__c;
                    tempRec.startDate = new Date(tempRec.Start_Date__c).toLocaleDateString('en-GB');
                    tempRec.endDate = new Date(tempRec.End_Date__c).toLocaleDateString('en-GB');
                    tempConList.push(tempRec);
                });
                this.recentEmpData = tempConList;
               // console.log('Fetch Data >>'+ JSON.stringify(tempConList));
                this.records = tempConList;              
                this.totalRecords = response.length; // update total records count                 
                this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                this.pageNumber = 1;
                this.paginationHelper();
                if (this.recentEmpData.length > 0) {
                    this.staffexpensesData = true;
                    this.staffexpensesNoData = false;
                } else {
                    this.staffexpensesData = false;
                    this.staffexpensesNoData = true;
                }
            }
            this.showSpinner = false;
        }).catch(err => {
          this.showSpinner = false;
        });
    }

    handleSubmit(event){  
        event.preventDefault(); 
        const fields=event.detail.fields;
       // console.log('fields>>',fields);
        this.template.querySelector('lightning-record-edit-form').submit(fields);       
        this.expensesData();  
    }   
    
    handleSuccess(event){
        this.recordId=event.detail.id;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success!!',
                message: 'Details Saved Successfully !!',
                variant: 'success',
            }),
        ); 
      //  console.log('Base 64 data >>'+ JSON.stringify(this.generatePdf()));
        getActivityStatement({recordId: this.recordId}).then(response => {
            console.log('get activity statement >>>'+ JSON.stringify(response));
            this.responseData = response;
            let docName = this.responseData[0].Name+'.pdf';
            console.log('DocName  >>'+docName);
            if(this.responseData.length > 0) {
                uploadFile({base64: JSON.stringify(this.generatePdf()), filename:docName, recordId: this.recordId, obj:'activity'})
                .then(result => {
                    this.fileName = this.recordId + ' - Uploaded Successfully';
                    //call to show uploaded files        
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success!!',
                            message: 'PDF Generated Successfully!!!',
                            variant: 'success',
                        }),
                    );
                })
            }           
        }).catch(err => {
                this.showSpinner =false;
        });   
                
        this.isOpenModal = false;   
        this.addExpenses = true ; 
        this.isHome = true;
        setTimeout(() => {
            this.expensesData();
            this.showSpinner = false;
        }, 5000); 
    }
    handleValueChange(event) {
        const fieldName = event.target.name;
        const value = parseFloat(event.target.value) || 0; // Use 0 if the value is null or empty
    
        if (fieldName === 'amount2') {
            this.paygAmountW2 = value;
            console.log('amount 2 >>' + this.paygAmountW2);
        }
        if (fieldName === 'amount3') {
            this.paygAmountW3 = value;
            console.log('amount 3 >>' + this.paygAmountW3);
        }
        if (fieldName === 'amount4') {
            this.paygAmountW4 = value;
            console.log('amount 4 >>' + this.paygAmountW4);
        }    
        // Calculate the total amount
        this.paygTotalAmountW5 = (this.paygAmountW2 || 0) + (this.paygAmountW3 || 0) + (this.paygAmountW4 || 0);
        console.log('total amount >>' + this.paygTotalAmountW5);
    
        // Update the field value dynamically
        this.template.querySelector("lightning-input-field[name='amount5']").value = this.paygTotalAmountW5;
    }
    formatDate(dateString) {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-GB', options);
    }
    handleInvoiceData() {
        organizationDetails().then(response => {
            //console.log('calling response raja', JSON.stringify(response));
            this.invoiceData = response.listofPriceBook;        
            this.orgId = response.listofPriceBook.Id;
            this.orgname = response.listofPriceBook.Name;
            this.abn = response.listofPriceBook.ABN__c;
            this.address =response.listofPriceBook.Address_Latest__Street__s;
            this.statePostal = response.listofPriceBook.Address_Latest__City__s + ',' + response.listofPriceBook.Address_Latest__StateCode__s + ',' + response.listofPriceBook.Address_Latest__PostalCode__s;            
            this.orgLogo = response.bolbdata;
            // console.log('org name>>>>', this.orgname); 
        });
    } 
    handleBack(){
        this.currentUrl = '';
        this.addExpenses = true;
        this.isHome = true;
        this.isPopupOpen = false;
        this.isOpenModal=false;
        this.expensesData();
    }    
    hideModalBox(){
        this.isOpenModal=false;
        this.isHome = true;
        this.addExpenses = true;
        this.expensesData();
    }
    handleCreate(event){
        this.isHome = false;
        this.isOpenModal = true;
        this.recordId = '';
        this.addExpenses = false;
        this.fileName ='';
        this.aBasChild = false;
        this.BIas = false;
        this.CBas = false;
        this.DBas = false;
        this.FBas = false;
        this.GBas = false;
        this.IIas = false;
        this.JIas = false;
        this.NBas = false;
        this.PBas = false;
        this.QBas = false;
        this.RBas = false;
        this.SBas = false;
        this.TBas = false;
        this.UBas = false;
        this.VBas = false;
        this.WBas = false;
        this.XBas = false;
        this.YBas = false;
        this.ZBas =false;
        this.saveButtonDisable = false;
        this.startDate = '';
        this.endDate = '';
        this.paygAmountW3 = 0.00;
        this.paygAmountW2 = 0.00;
        this.paygAmountW4 = 0.00;
        this.paygTotalAmountW5 = 0.00;       
    }
    @track selectedFormTypeName;
    changeExpense(event){      
        this.selectedFormTypeName = event.detail.value;  
       // console.log('Form type1 >>>'+this.selectedFormTypeName);      
        if (event.detail.value == 'A.BAS') {
            this.typeofExpense=event.target.value;
           // console.log('Form type 2 >>>'+this.typeofExpense); 
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName); 
            this.aBasChild=true;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false;
            this.FBas = false; 
            this.JIas = false;
            this.IIas = false;
            this.GBas = false; 
            this.NBas = false;
            this.PBas = false; 
            this.QBas = false;
            this.RBas = false; 
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false; 
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;     
        }
        if (event.detail.value == 'B.IAS') {
            this.typeofExpense=event.target.value;
            console.log('Form type 2 >>>'+this.typeofExpense); 
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName); 
            this.aBasChild=false;
            this.BIas = true;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false; 
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false; 
        }
        if (event.detail.value == 'C.BAS') {
            this.typeofExpense=event.target.value;
            console.log('Form type 2 >>>'+this.typeofExpense); 
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName); 
            this.aBasChild=false;
            this.BIas = false;
            this.CBas = true;
            this.DBas = false;
            this.FBas = false; 
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'D.BAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName); 
            this.aBasChild=false;
            this.BIas = false;
            this.CBas = false;
            this.DBas = true;
            this.FBas = false; 
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false; 
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'F.BAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.FBas = true;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false;
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.NBas = false; 
            this.PBas = false;
            this.QBas = false;
            this.RBas= false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'G.BAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.GBas = true;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.JIas = false;
            this.IIas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false; 
        } 
        if (event.detail.value == 'I.IAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.IIas = true;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.JIas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'J.IAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = true;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false; 
        } 
        if (event.detail.value == 'N.Annual PAYG') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = true;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'P.Annual GST Return') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = true;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false; 
        }
        if (event.detail.value == 'Q.Annual GST Information Report') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = true;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'R.Quarterly PAYG Instalment Notice') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = true;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false; 
        }
        if (event.detail.value == 'S.Quartely Instalment Notice') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas= false;
            this.SBas = true;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'T.Quartely GST & PAYG Instalment Notice') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = true;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false; 
        }
        if (event.detail.value == 'U.BAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = true;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'V.BAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = true;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;

        }
        if (event.detail.value == 'W.BAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.SBas = false;
            this.TBas = false; 
            this.UBas = false;
            this.VBas = false;
            this.WBas = true;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'X.BAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = true;
            this.YBas = false;
            this.ZBas =false;
        }
        if (event.detail.value == 'Y.BAS') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = true;
            this.ZBas =false;
        }
        if (event.detail.value == 'Z.Annual GST Return') {
            this.typeofExpense=event.target.value;
            this.selectedFormTypeName = event.detail.value;
            console.log('Form type >>>'+this.selectedFormTypeName);            
            this.JIas = false;
            this.IIas = false;
            this.GBas = false;
            this.aBasChild=false;
            this.BIas = false; 
            this.CBas = false; 
            this.DBas = false; 
            this.FBas = false; 
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =true;
        }
    }
    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isPopupOpen = true;
        this.isOpenModal=false;
        this.addExpenses = false;
        this.isHome = false;

        const fileType = this.getFileType(this.currentUrl);        
        // Check if the file type is not PNG or PDF
         if (fileType !== 'png' && fileType !== 'pdf' && fileType !== 'jpeg' && fileType !== 'csv' && fileType !== 'svg') {
            setTimeout(() => {
                this.hideModalBox();
            }, 1700);            
        } 
    }
    handleEdit(event){ 
        this.recordId = event.currentTarget.dataset.id; 
        this.saveButtonDisable = false;
        let type = event.currentTarget.dataset.type;
        console.log('Type of form is on edit >>'+type);
        this.addExpenses = false;
        this.isHome = false;

        if(type == 'A.BAS'){
            this.isOpenModal=true;
            this.aBasChild = true;
            this.BIas = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.IIas = false;
            this.JIas = false;
            this.NBas = false;
            this.PBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'B.IAS'){
            this.isOpenModal=true;
            this.BIas = true;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.IIas = false;
            this.JIas = false;
            this.NBas = false;
            this.PBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'C.BAS'){
            this.isOpenModal=true;
            this.CBas = true;
            this.BIas = false;
            this.aBasChild = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.IIas = false;
            this.JIas = false;
            this.NBas = false;
            this.PBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        } 
        if(type == 'D.BAS'){
            this.isOpenModal=true;
            this.DBas = true;
            this.CBas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.FBas = false;
            this.GBas = false;
            this.IIas = false;
            this.JIas = false;
            this.NBas = false;
            this.PBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'F.BAS'){
            this.isOpenModal=true;
            this.FBas = true;
            this.DBas = false;
            this.CBas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.GBas = false;
            this.IIas = false;
            this.JIas = false;
            this.NBas = false;
            this.PBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'G.BAS'){
            this.isOpenModal=true;
            this.GBas = true;
            this.CBas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.DBas = false;
            this.FBas = false;
            this.IIas = false;
            this.JIas = false;
            this.NBas = false;
            this.PBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        } 
        if(type == 'I.IAS'){
            this.isOpenModal=true;
            this.IIas = true;
            this.JIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'J.IAS'){
            this.isOpenModal=true;
            this.JIas = true;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        } 
        if(type == 'N.Annual PAYG'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = true;
            this.PBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'P.Annual GST Return'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = true;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        } 
        if(type == 'Q.Annual GST Information Report'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = true;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        } 
        if(type == 'R.Quarterly PAYG Instalment Notice'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = true;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'S.Quartely Instalment Notice'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = true;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        } 
        if(type == 'T.Quartely GST & PAYG Instalment Notice'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = true;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'U.BAS'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = true;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'V.BAS'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = true;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'W.BAS'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = true;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'X.BAS'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = true;
            this.YBas = false;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'Y.BAS'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = true;
            this.ZBas =false;
            this.typeofExpense = type;
        }
        if(type == 'Z.Annual GST Return'){
            this.isOpenModal=true;
            this.JIas = false;
            this.IIas = false;
            this.BIas = false;
            this.aBasChild = false;
            this.CBas = false;
            this.DBas = false;
            this.FBas = false;
            this.GBas = false;
            this.NBas = false;
            this.PBas = false;
            this.QBas = false;
            this.RBas = false;
            this.SBas = false;
            this.TBas = false;
            this.UBas = false;
            this.VBas = false;
            this.WBas = false;
            this.XBas = false;
            this.YBas = false;
            this.ZBas =true;
            this.typeofExpense = type;
        }
        getActivityStatement({recordId: this.recordId}).then(response => {
            console.log('get activity statement >>>'+ JSON.stringify(response));
            // this.responseData = response;
            this.paygAmountW3 = response[0].Amount_Withheld_from_Payments_Shown__c;
            this.paygAmountW2 = response[0].Amount_Withheld_Where_no_ABN_is_Quoted__c;
            this.paygAmountW4 = response[0].Other_Amounts_Withheld__c;
            this.paygTotalAmountW5 = response[0].Total_Amounts_Withheld_W2_W4_W3__c; 
            this.startDate = response[0].Start_Date__c;
            this.endDate = response[0].End_Date__c;
            console.log('get activity1 >>>'+ this.paygAmountW3); 
            console.log('get activity1 >>>'+ this.paygAmountW2); 
            console.log('get activity1 >>>'+ this.paygAmountW4); 
            console.log('get activity1 >>>'+ this.paygTotalAmountW5);  
        });
        this.addExpenses = false;
        
        //console.log('Edit', this.recordId);
        this.fileName='';       
        this.isPopupOpen = false;   
        this.expensesData(); 
    }

    handleTypeChange(event){
        this.Picklist_Value = event.target.value;         
        //create event
        const searchEvent = new CustomEvent("getsearchvalue",{
            detail : this.Picklist_Value
        });
        //Dispatches the event
        this.dispatchEvent(searchEvent);
    }
    handleStartDateChange(event) {
        if(event.target.name == 'start') {
            this.startDate = '';
            let inputValue = event.target.value;
            this.startDate =inputValue;
            console.log('start date >>'+this.startDate);
            this.saveButtonDisable = true;
        }
        if(event.target.name == 'end') {
            this.endDate = '';
            let inputValue = event.target.value;
            this.endDate =inputValue;
            console.log('End date >>'+this.endDate);
            this.saveButtonDisable = true;
            console.log('End date >>'+this.endDate);      
        }        
         
        if (this.startDate && this.endDate && this.startDate > this.endDate) {
            // Show an error toast
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'End Date cannot be greater than Start Date.',
                    variant: 'error'
                })
            );
        } else if(this.startDate && this.endDate && this.startDate < this.endDate) {
            this.saveButtonDisable = false;
        }
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

    value = 'Monthly';    

    hadleDates(event) {
        var sname = event.target.name;        

        if (event.target.name == 'sdate') {
            this.sdate = event.detail.value;
            console.log('Start Date>>>>'+this.sdate);
        }
        if (event.target.name == 'edate') {
            this.edate = event.detail.value;
            console.log('End Date>>>>'+this.edate);
        }
        if (event.target.name == 'Facility') {             
            this.selectedFacilityValue = event.detail.value;
            console.log('215 SelectedFacilityValue>>'+this.selectedFacilityValue);
        } 
        let tempconList=[];
        var expAmount = 0;
        fetchExpenses({ startDate: this.sdate, endDate: this.edate, facility: this.selectedFacilityValue }).then(response => {  
            console.log("expenses data>>>>>",JSON.stringify(response));   
            //this.excelDataExpense = response;        
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record); 
                tempConRec.name = tempConRec.Name;               
                tempConRec.typeOfExpenses = tempConRec.Type_of_Expense__c;
                if(tempConRec.Type_of_Expense__c == 'Other'){
                    tempConRec.description = tempConRec.Description__c;
                } else{
                    tempConRec.description = tempConRec.Sub_type__c;
                }                
                //tempConRec.otherComment = tempConRec.Comments__c;
                tempConRec.gst = tempConRec.Incl_GST__c.toFixed(2);
                tempConRec.amount = tempConRec.Amount__c.toFixed(2);

                expAmount = expAmount + tempConRec.Amount__c;
                tempconList.push(tempConRec);
               
            })
            this.expensesAmount = expAmount.toFixed(2);
            this.expenseTable=tempconList;
            this.excelDataExpense = tempconList;
            
        })

        let tempconList1=[];
        var invAmount = 0;
        fetchInvoices ({ startDate: this.sdate, endDate: this.edate, orgName: this.orgName }).then(response => {
            //this.excelDataInvoice = response;
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record); 
                if(tempConRec.Tax_Invoice__c != undefined){
                    tempConRec.taxinvoice = tempConRec.Tax_Invoice__c;
                }else {
                    tempConRec.taxinvoice = tempConRec.Name;
                }
                if(tempConRec.Is_Created_From_CSV__c){
                    tempConRec.gst = tempConRec.Total_CSV_GST__c.toFixed(2);
                    tempConRec.totalamount = tempConRec.Final_CSV_Total__c.toFixed(2);
                }else{
                    tempConRec.gst = tempConRec.Total_GST__c.toFixed(2);
                    tempConRec.totalamount = tempConRec.Total_Amount__c.toFixed(2);
                }
               /*  tempConRec.totalamount = tempConRec.Total_Amount__c.toFixed(2);
                tempConRec.gst = tempConRec.Total_GST__c.toFixed(2); */
               
                tempConRec.date = new Date(tempConRec.Date_Issued__c).toLocaleDateString('en-GB');
                invAmount = invAmount + tempConRec.Total_Amount__c;
                tempconList1.push(tempConRec);               
            })
            this.invoiceAmount = invAmount.toFixed(2);
            this.invoiceTable=tempconList1;
            this.excelDataInvoice = tempconList1;
            console.log("Invoice data>>>>>",JSON.stringify(this.invoiceTable));  
        })

        let tempconList2=[];  
        var expAmount2 = 0;   
        let parollSatff={} ;  

        fetchStaffPayrollSetting ({ startDate: this.sdate, endDate: this.edate, orgName: this.orgName, facilityName: this.selectedFacilityValue }).then(response => {
        //this.excelDataWages=response;
        //console.log('response1-->'+JSON.stringify(this.excelDataWages));
        console.log('277 response>>'+JSON.stringify(response)); 

        response.forEach((wrapper) => {
        let tempConRec = Object.assign({}, wrapper.staffRecord);
        //tempConRec.adminFee = tempConRec.Management_Fee__c;
        if(typeof wrapper.adminFee != 'undefined'){
            tempConRec.adminFee = tempConRec.Management_Fee__c + 0.00;
        }
        tempConRec.postTax = wrapper.totalpostTax.toFixed(2);
        tempConRec.preTax = wrapper.totalpreTax.toFixed(2);    
        if (typeof wrapper.superAnnuation !== 'undefined') {
          tempConRec.superAnnuation = parseFloat(wrapper.superAnnuation).toFixed(2);
        } else {
    
         tempConRec.superAnnuation = 0; 
         }   
       // tempConRec.superAnnuation = parseFloat(wrapper.superAnnuation).toFixed(2);
       
        tempConRec.tax = wrapper.totalTax.toFixed(2);
        tempConRec.gross = wrapper.totalGross.toFixed(2);
        tempConRec.netPay = wrapper.netPayable.toFixed(2);
        tempConRec.netSal = wrapper.netSal.toFixed(2);
        tempConRec.staffname = wrapper.resourceName;
        //tempConRec.superAnnuation = wrapper.superAnnuation;
        tempConRec.adminFee = wrapper.adminFee.toFixed(2);
        tempConRec.sdate = new Date(tempConRec.Start_Date__c);
        tempConRec.edate = new Date(tempConRec.End_Date__c);
        //console.log('staffName>>>' + tempConRec.staffname);
        //console.log('adminFee>>>' + tempConRec.adminFee);
        //console.log('gross>>>' + tempConRec.gross);
        //console.log('netPay>>>' + tempConRec.netPay);
        //console.log('netSal>>>' + tempConRec.netSal);
        //console.log('posttax>>>' +  tempConRec.postTax);
        //console.log('totaltax>>>' +  tempConRec.tax);
        expAmount2 = expAmount2 + tempConRec.Net_Pay__c;
        let parollSatff = { name: tempConRec.Resource_Name__c, amount: expAmount2 };
        tempconList2.push(tempConRec);
        //}
        }); 
            this.PayrollSettingTable=tempconList2;
            this.excelDataWages = tempconList2;
            //console.log("Payroll setting data  line 243>>>>>"+JSON.stringify(this.PayrollSettingTable)); 
        })
    }

    @track invoicesHeader = ['Invoice Number', 'Date', 'GST', 'Total Amount' ];
    @track expensesHeader = ['Type of Expenses', 'Sub Type/Description', 'GST', 'Amount' ];
    @track wagesHeader = ['Staff Name', 'Admin Fee', 'Pre Tax FBT', 'Post FBT', 'Super Annuation','Gross','Tax','Net Payable' ];

    downloadWagesExcel() { 
        let doc = '<table>';

        // Add styles for the table
        doc += '<style>';
        doc += 'table, th, td {';
        doc += '    border: 0.8px solid gray;';
        doc += '    border-collapse: collapse;';
        doc += '}';
        doc += '</style>';
       
        doc += '<tr>';
        doc += '<td colspan="4"><h3 style="font-size: 24; font-family: Calibri;">' +  this.orgName + '</td>';
        doc += '</tr>';
        doc += '<tr>';
        doc += '<td colspan="4" style="font-size: 20; font-family: Calibri;">Address: ' + this.orgStreet +', '+ this.orgCity  +', '+ this.stateCode +', '+this.postalCode + '</td>';
        doc += '</tr>';
        doc += '<tr>';
        doc += '<td colspan="4" style="text-align:left;font-size: 20; font-family: Calibri;">Contact No: ' +  this.contactNo + '</td>';
        doc += '</tr>';
        doc += '<tr>';
        doc += '<td colspan="4" style="text-align:left; font-size: 20; font-family: Calibri;">ABN: ' + this.abn + '</td>';
        doc += '</tr>';
        
        doc += '<tr><td colspan="4"></td></tr>';
        doc += '<tr><td colspan="4"></td></tr>';

        doc += '<tr >';
        doc += '<th bgcolor="1a4876" colspan="8" style="font-size: 10; font-family: Calibri;">' + '<h2>' + '<font color="white" style="font-size: 17; font-family: Calibri;">' + 'Wages Data' + '</font>' + '</h2>' + '</th>';
        doc += '</tr>';

        function formatDate(dateStr) {
            var parts = dateStr.split('-');
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        }

        // Reformat the dates
        var formattedSDate = formatDate(this.sdate);
        var formattedEDate = formatDate(this.edate);    
        //console.log('Sdate>>'+formattedSDate);
       // console.log('Edate>>'+formattedEDate);
        doc += '<tr><td colspan="8" style="text-align:left;font-size: 17px; font-family: Calibri;">Start Date: ' + formattedSDate + ' and End Date: ' + formattedEDate +' </td></tr>';

        doc += '<tr>';
        this.wagesHeader.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';
        

        this.excelDataWages.forEach(fieldsData => {
            doc += '<tr>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.staffname + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' +fieldsData.adminFee + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +  '$' +fieldsData.preTax + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.postTax + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.superAnnuation + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.gross + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.tax + '</td>';
            //doc += '<td>' + fieldsData.netSal + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.netPay + '</td>';
            doc += '</tr>';
        });
        
        // Add a blank row for spacing
        doc += '<tr><td colspan="8"></td></tr>';

        // End of Table 1
        doc += '</table>';

        // Start of Table 2
        doc += '<table>';

        doc += '<tr >';
        doc += '<th bgcolor="1a4876" colspan="4" style="font-size: 10; font-family: Calibri;">' + '<h2>' + '<font color="white" style="font-size: 17; font-family: Calibri;">' + 'Expenses Data' + '</font>' + '</h2>' + '</th>';
        doc += '</tr>';

        doc += '<tr>';
        this.expensesHeader.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';

        // Add rows for the second table - Invoice Data
        this.excelDataExpense.forEach(fieldsData => {
                doc += '<tr>';
                //doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.name + '</td>';
                if(fieldsData.typeOfExpenses != undefined){
                    doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.typeOfExpenses + '</td>';
                } else {
                    doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'No Data' + '</td>';
                }                
                if(fieldsData.description != undefined)
                {
                    doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.description + '</td>';
                } else {
                    doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'No Data' + '</td>';
                }
                doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.gst + '</td>';
                doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + '$' + fieldsData.amount + '</td>';
                doc += '</tr>';
            });
            doc += '<tr><td colspan="4" style="text-align:right; font-size: 17px; font-family: Calibri;"><b>Total Amount : ' + '$' + this.expensesAmount + '</b></td></tr>';

            // Add a blank row for spacing
            doc += '<tr><td colspan="4"></td></tr>';

        // End of Table 2
        doc += '</table>';        

        // Start of Table 3
        doc += '<table>';
        doc += '<tr >';
        doc += '<th bgcolor="1a4876" colspan="4" style="font-size: 10; font-family: Calibri;">' + '<h2>' + '<font color="white" style="font-size: 17; font-family: Calibri;">' + 'Invoice Data' + '</font>' + '</h2>' + '</th>';
        doc += '</tr>';
        doc += '<tr>';
        this.invoicesHeader.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';

        // Add rows for the second table - Invoice Data
        this.excelDataInvoice.forEach(fieldsData => {
            doc += '<tr>';
            doc += '<td style="font-size: 17; font-family: Calibri;">' + fieldsData.taxinvoice + '</td>';
            // doc += '<td>' + fieldsData.Description__c + '</td>';
            doc += '<td style="font-size: 17; font-family: Calibri;">' + fieldsData.date + '</td>';
            doc += '<td style="font-size: 17; font-family: Calibri; text-align:right;">' + '$' +fieldsData.gst + '</td>';
            doc += '<td style="font-size: 17; font-family: Calibri; text-align:right;">' + '$' +fieldsData.totalamount + '</td>';            
            doc += '</tr>';
        });
        doc += '<tr><td colspan="4" style="text-align:right; font-size: 17px; font-family: Calibri;"><b>Total Amount : ' + '$' + this.invoiceAmount + '</b></td></tr>';
        // End of Table 3
        doc += '</table>';
        
        //var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(doc); //data:application/vnd.ms-excel
        var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(doc);
        let downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        // use .csv or .xls as extension on below line if you want to export data
        downloadElement.download = 'Wages.xls';
        //downloadElement.download = 'Wages.xlsm';
        //downloadElement.download = 'Wages.xlsx';
        document.body.appendChild(downloadElement);
        downloadElement.click();
    }
    handleNavigateImport(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                
                pageName: 'importexpenseinvoice'
            },
        });
    }
    /* handleNavigateActivityStatement(){
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                //Name of any CustomTab. Visualforce tabs, web tabs, Lightning Pages, and Lightning Component tabs
                
                pageName: 'activitystatement'
            },
        });
    } */
    paginationHelper() {
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
       // console.log("totalPages  : "+ JSON.stringify(this.totalPages));
        if (this.pageNumber <= 1) {
            this.pageNumber = 1;
        } else if (this.pageNumber >= this.totalPages) {
            this.pageNumber = this.totalPages;
        }
        let tempconList=[];   
       // console.log('calling pagination Data1 >>'+JSON.stringify(tempconList));    
        for (let i = (this.pageNumber - 1) * this.pageSize; i < this.pageNumber * this.pageSize; i++) {
            if (i === this.totalRecords) {
                break;
            }            
            let tempConRec = Object.assign({}, this.records[i]);           
            tempconList.push(tempConRec);    
        }
        //console.log('calling pagination Data >>'+JSON.stringify(tempconList));
        this.Listofdata_Pagination = tempconList;

        this.bIaschild = false;
        this.cBasChild = false;
        this.dBasChild = false;
        this.fBasChild = false;
        this.gBasChild = false;
        this.iIasChild = false;
        this.jIasChild = false;
        this.nAnnual = false;
        this.pAnnual = false;
        this.qAnnual = false;
        this.rQuartely = false;
        this.sQuartely = false;
        this.tQuartely = false;
        this.uBasChild = false;
        this.vBasChild = false;
        this.wBasChild = false;
        this.xBasChild = false;
        this.yBasChild = false;
        this.zAnnual = false;
    }
    generatePdf() {
        console.log('PDF start');
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF();
        console.log('PDF Generated');
        if(this.typeofExpense == 'A.BAS') {
            // Add logo  My_Resource+'/myResource/images/bas.png';
            var logoPath = My_Resource + '/myResource/images/bas.png';
            doc.addImage(logoPath, 'PNG', 13, 18, 40, 20);  // Adjust the size and position as needed */

            // Right-aligned text
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(9);
            doc.text('Lovelin Jagjit Gandhi', 190, 20, { align: 'right' });
            /* doc.setFont("Helvetica", "normal");
            doc.setFontSize(9); */
            doc.text('12 Pipersbrook Crescent', 190, 25, { align: 'right' });
            doc.text('Bella Vista NSW 2153', 190, 30, { align: 'right' });
            doc.text('0424350075', 190, 35, { align: 'right' });
            doc.text('accounts@infiniteexperts.com.au', 190, 40, { align: 'right' });

            // Date and Address
            doc.text('6 August 2024', 20, 45);
            doc.text(this.responseData[0].Client_Name__c, 20, 50);
            doc.text('Level 2 Suite 2 99 Northbourne Ave', 20, 55);
            doc.text('TURNER ACT 2612', 20, 60);

            // Body Text
            doc.text('Dear,', 20, 75);
            doc.setFontSize(9);
            doc.setFont("Helvetica", "bold");
            doc.text('Re: Activity statement for '+this.responseData[0].Client_Name__c, 20, 85);
            doc.setFontSize(9);
            doc.setFont("Helvetica", "normal");
            doc.text(`Following is your completed activity statement for the period ending 1 September 2022 that is due for lodgment with the Australian Tax Office (ATO) by.`, 20, 95, { maxWidth: 165 });
            doc.text('Please review each page of this activity statement. To confirm that all items are true and correct, sign and date all declarations.', 20, 107, { maxWidth: 165 })
            doc.text('Your activity statement will be electronically lodged once we have received your signed and dated declarations.',20, 119, { maxWidth: 165 });
            doc.text('We have calculated that you have nothing due or refundable. This includes GST and all other relevant tax instalments and withholdings.',20, 131, { maxWidth: 165 });
            doc.text('If you have any questions or require further information then please do not hesitate to contact Lovelin Jagjit Gandhi on 0424350075.',20, 143, { maxWidth: 165 });

            doc.text('Yours sincerely,', 20, 170);
            doc.text('Lovelin Jagjit Gandhi', 20, 195);

            doc.addPage("a4","portrait");

            doc.setFontSize(10);
            doc.setFont("Helvetica", "normal");
            doc.text(this.responseData[0].Client_Name__c, 200, 8, { align: 'right' });

            const startDate = this.formatDate(this.responseData[0].Start_Date__c);
            const endDate = this.formatDate(this.responseData[0].End_Date__c);

            let dateYear = startDate.split(' ');
            console.log('date year >>'+dateYear);
            let currentYear = dateYear[2];
            console.log('Current Year >>'+ currentYear);

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(12);
            //doc.text(currentYear, 184, 20);
            doc.text(currentYear +' ACTIVITY STATEMENT SUBSTANTIATION DECLARATION', 10, 20);
            doc.line(10, 25, 200, 25);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Activity statements are assessed on a Self-Assessment basis. This means that the ATO may not check whether the information you have submitted is correct. We will make every endeavour to ensure that your activity statement is prepared accurately and correctly, however we rely on you to ensure that all relevant information is disclosed to us.`, 10, 30, { maxWidth: 190 });

            doc.setFont("Helvetica", "bold");
            doc.text(`I, declare the following in relation to the attached Activity Statement:`, 10, 46);
            doc.setFont("Helvetica", "normal");
            doc.text('1. I have disclosed all transactions for the relevant period.', 15, 51, { maxWidth: 165 } );
            doc.text('2. GST payable, as shown on the front of the activity statement, correctly reflects the GST on taxable supplies made during the period.', 15, 56, { maxWidth: 180 } );
            doc.text('3. An input tax credit has not been claimed for any acquisitions that are GST-free, input taxed, or otherwise have no GST in the price.', 15, 64, { maxWidth: 180 } );
            doc.text('4. No supplies have been made to associates at less than their GST-inclusive market value, except for those specifically advised by me.', 15, 72, { maxWidth: 180 } );
            doc.text('5. Where an insurance claim has been made, I have advised the insurer of the extent to which I am entitled to claim an input tax credit.', 15, 80, { maxWidth: 180 } );
            doc.text('i. If the real property was acquired on or after 1 July 2000, it was so acquired under the margin scheme, or;', 20, 88, { maxWidth: 180 } );
            doc.text('ii. If the real property was acquired before 1 July 2000, a valid valuation was obtained in the period of this BAS', 20, 93, { maxWidth: 180 } );
            doc.text('6. Where supplies are used for both business and private purposes (individuals only) e.g. car, mobile telephone, home telephone, computer etc, I have kept appropriate apportionment records to verify my business usage claim and that I am aware that an input tax credit cannot be claimed for supplies for private purposes. I have instructed you to prepare the activity statement based on my specific instructions on the understanding I will be able to produce such information to the satisfaction of the ATO under audit.', 15, 98, { maxWidth: 180 });

            let yPosition = 105;
            doc.setFont("Helvetica", "bold");
            doc.text('Valid tax invoices:', 10 ,118);
            doc.setFont("Helvetica", "normal");
            doc.text('1. I have maintained records to ensure that there are valid tax invoices and adjustment notes to support input tax credits claimed.',15, 123, { maxWidth: 165 });
            doc.text('2. I am aware of the need to retain such records for a minimum of five years from the date of lodgment of the activity statement.',15, 131, { maxWidth: 165 });
        
            doc.setFont("Helvetica", "bold");
            doc.text('Penalties and Audits:',10, 142);
            doc.setFont("Helvetica", "normal");
            doc.text('1. I am also aware that various additional tax, interest charges and other penalties may apply where the amounts of the various tax liabilities which comprise the activity statement, are understated.',15, 148, { maxWidth: 165 });
            doc.text('2. I am aware that the procedures to follow if a document is lost or destroyed is to obtain a copy from the supplier;',15, 156, { maxWidth: 165 });
            doc.text('3. I may be required to substantiate or verify any income or expense item declared or claimed in my activity statement in the event of an ATO audit;',15, 161, { maxWidth: 165 });
        
            doc.text('Signature: ____________________________  Date: _______________', 10, yPosition + 85);

            doc.addPage("a4","portrait");

            doc.setFontSize(10);
            doc.setFont("Helvetica", "normal");
            doc.text(this.responseData[0].Client_Name__c, 200, 8, { align: 'right' });

            doc.setFontSize(20);
            doc.setFont("Helvetica", "bold");
            doc.text('Activity Statement', 10, 20);            
            doc.text(currentYear, 184, 20); 
            
            doc.setFontSize(13);
            doc.setFont("Helvetica", "normal");
            // Use the em dash (—) between the dates
            doc.text(`${startDate} — ${endDate}`, 143, 28); 

            doc.line(10, 32, 200, 32);

            yPosition += 20;
            doc.setFontSize(12);
            doc.setFont("Helvetica", "normal");
           // console.log('Response Daata >>'+JSON.stringify(this.responseData));
            doc.text('Client Name: ' +this.responseData[0].Client_Name__c, 10, 40);
            doc.line(10, 42, 107, 42);            
            doc.text('TFN:            ' + (this.responseData[0].TFN__c ? this.responseData[0].TFN__c : 'No Data'), 110, 40);
            doc.line(110, 42, 200, 42);

            let formType = this.responseData[0].Form_Type__c;

            // Rearrange the form type to 'BAS-A'
            let formattedFormType = formType.split('.').reverse().join('-');
            doc.text('Form type:              ' + formattedFormType, 10, 47);
            doc.line(10, 50, 107, 50);
            doc.text('ABN:           '+this.responseData[0].ABN__c, 110, 48);
            doc.line(110, 50, 200, 50);
            doc.text('Document ID:         ' + (this.responseData[0].Document_Id__c ? this.responseData[0].Document_Id__c : 'No Data'), 10, 56);
            doc.line(10, 59, 107, 59);
            doc.line(110, 59, 200, 59);

            doc.line(10, 68, 200, 68);

            doc.setFontSize(16);
            doc.setFont("Helvetica", "bold");
            doc.text('Summary', 10, 76);

            doc.line(10, 78, 200, 78);
            yPosition += 30;
            doc.setFontSize(11);
            doc.setFont("Helvetica", "normal");
            doc.text('AMOUNTS YOU OWE THE TAX OFFICE', 10, 85);
            doc.text('AMOUNTS THE TAX OFFICE OWES YOU', 117, 85);
            doc.line(10, 88, 200, 88);
            doc.text('PAYG tax withheld:                    '+'$'+this.responseData[0].PAYG_Tax_Withheld__c+'.00', 10, 94);

            doc.line(10, 97, 200, 97);
            doc.setFont("Helvetica", "bold");
            doc.text('Nothing due or refundable:     ' +'$'+this.responseData[0].Nothing_due_or_Refundable__c+'.00',10 , 104);

            doc.line(10, 107, 200, 107);
            doc.setFontSize(16);
            doc.setFont("Helvetica", "bold");
            doc.text('Declaration',10 , 115);
            doc.line(10, 117, 200, 117);
            doc.setFontSize(9);
            doc.setFont("Helvetica", "normal");
            doc.text('I authorise Lovelin Jagjit Gandhi to give this activity statement to the Commissioner of Taxation for '+ this.responseData[0].Client_Name__c +'. I declare that I am authorised to make this declaration, and the information provided for the preparation of this activity statement is true and correct.',10 , 123, { maxWidth: 180 });
            
            doc.text('Signature: ____________________________  Date: _______________', 10, 143);

            doc.addPage("a4","portrait");

            doc.setFontSize(10);
            doc.setFont("Helvetica", "normal");
            doc.text(this.responseData[0].Client_Name__c, 200, 8, { align: 'right' }); 

            doc.setFontSize(20);
            doc.setFont("Helvetica", "bold");
            doc.text('Activity Statement', 10, 20);            
           // doc.text('2024', 185, 20);
            doc.text(currentYear, 184, 20);

            doc.setFontSize(13);
            doc.setFont("Helvetica", "normal");           
            doc.text(`${startDate} — ${endDate}`, 143, 28); 

            doc.line(10, 32, 200, 32);  
            doc.setFontSize(18);
            doc.setFont("Helvetica", "bold");
            doc.text('PAYG tax withheld', 10, 40);
            doc.line(10, 43, 200, 43); //
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(11);
            doc.text('Total salary, wages and other payments', 10, 50);
            doc.text('W1', 140, 50);
            doc.text('$'+this.responseData[0].Total_Salary_Wages_and_Other_Payments__c+'.00', 182, 50);
            console.log('toal salary >>'+this.responseData[0].Total_Salary_Wages_and_Other_Payments__c);
            doc.line(10, 53, 200, 53); 
            doc.text('Amount withheld from payments shown at W1', 10, 60);
            doc.text('W2', 140, 60);
            doc.text('$'+this.responseData[0].Amount_Withheld_from_Payments_Shown__c+'.00', 182, 60);
            console.log('Amount withheld payment >>'+this.responseData[0].Amount_Withheld_from_Payments_Shown__c);
            doc.line(10, 63, 200, 63);  
            doc.text('Amount withheld where no ABN is quoted', 10, 70);
            doc.text('W3', 140, 70);
            doc.text('$'+this.responseData[0].Amount_Withheld_Where_no_ABN_is_Quoted__c+'.00', 182, 70);
            console.log('Amount withheld ABN >>'+this.responseData[0].Amount_Withheld_Where_no_ABN_is_Quoted__c);
            doc.line(10, 73, 200, 73); 
            doc.text('Other amounts withheld', 10, 80);
            doc.text('W4', 140, 80);
            doc.text('$'+this.responseData[0].Other_Amounts_Withheld__c+'.00', 182, 80);
            console.log('other amounts >>'+this.responseData[0].Other_Amounts_Withheld__c);
            doc.line(10, 83, 200, 83);
            this.paygTotalAmountW5 = this.responseData[0].Amount_Withheld_from_Payments_Shown__c +this.responseData[0].Amount_Withheld_Where_no_ABN_is_Quoted__c+this.responseData[0].Other_Amounts_Withheld__c;
            console.log('total amount >>'+this.paygTotalAmountW5);

            doc.setFont("Helvetica", "bold");
            doc.text('Total amounts withheld (W2 + W4 + W3) ', 10, 90);
            doc.text('W5', 140, 90);
            doc.text('$'+this.paygTotalAmountW5+'.00', 182, 90);            
            console.log('total amount >>'+this.paygTotalAmountW5);
            doc.line(10, 93, 200, 93); 

            this.aBasChild =true;
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;            
        }
        if(this.typeofExpense == 'B.IAS'){
            this.bIaschild = true;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
            this.BIas = true;
        } 
        if(this.typeofExpense == 'C.BAS'){
            this.cBasChild = true;
            this.bIaschild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
            this.CBas = true;
        }
        if(this.typeofExpense == 'D.BAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = true;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
            this.DBas = true;
        }
        if(this.typeofExpense == 'F.BAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = true;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
            this.FBas = true;
        }
        if(this.typeofExpense == 'G.BAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = true;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
            this.GBas = true;
        }
        if(this.typeofExpense == 'I.IAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = true;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;            
        }
        if(this.typeofExpense == 'J.IAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = true;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'N.Annual PAYG'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = true;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'P.Annual GST Return'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = true;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        } 
        if(this.typeofExpense == 'Q.Annual GST Information Report'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = true;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'R.Quarterly PAYG Instalment Notice'){ 
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = true;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'S.Quartely Instalment Notice'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = true;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'T.Quartely GST & PAYG Instalment Notice'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = true;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'U.BAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = true;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'V.BAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = true;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'W.BAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = true;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'X.BAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = true;
            this.yBasChild = false;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'Y.BAS'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = true;
            this.zAnnual = false;
        }
        if(this.typeofExpense == 'Z.Annual GST Return'){
            this.bIaschild = false;
            this.cBasChild = false;
            this.dBasChild = false;
            this.fBasChild = false;
            this.gBasChild = false;
            this.iIasChild = false;
            this.jIasChild = false;
            this.nAnnual = false;
            this.pAnnual = false;
            this.qAnnual = false;
            this.rQuartely = false;
            this.sQuartely = false;
            this.tQuartely = false;
            this.uBasChild = false;
            this.vBasChild = false;
            this.wBasChild = false;
            this.xBasChild = false;
            this.yBasChild = false;
            this.zAnnual = true;
        }   
        this.base64FileData = btoa(doc.output());
        console.log('Generated PDF Base64: ' + this.base64FileData);
        return this.base64FileData;
    }
    get bDisableFirst() {
        return this.pageNumber == 1;
    }
    get bDisableLast() {
        return this.pageNumber == this.totalPages;
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
    hadleFormtypeChange(event){
        //var sname = event.target.name;
        if (event.target.name == 'FormType') {
            this.formtypeValue = event.detail.value;
            console.log('start date is >>'+this.formtypeValue);            
        }
        if (event.target.name == 'sdate1') {
            this.startDatainputvalue = event.detail.value;
            console.log('start date is >>'+this.startDatainputvalue);            
        }
        if (event.target.name == 'edate1') {
            this.endDateinputvalue = event.detail.value;
            console.log('end date is >>'+this.endDateinputvalue); 
        }
        this.showSpinner = true;
        this.expensesData();
    }
    handleClear(){
        this.formtypeValue = '';
        this.startDatainputvalue = '';
        this.endDateinputvalue = '';
        this.expensesData();
    }
    fetchActivityStatement(){       
        this.showSpinner = true;
        this.records=[];
        this.expensesData();
        this.handleInvoiceData();
    } 
}