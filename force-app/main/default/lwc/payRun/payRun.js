import { LightningElement, track, wire, api } from 'lwc';
import getpPaySettings from '@salesforce/apex/PayrunSettingHandler.getpPaySettings';
import fetchPayrollStaff from '@salesforce/apex/PayRunHandler.fetchPayrollStaff';
//import staffPayroll from '@salesforce/apex/PayrunSettingHandler.staffPayroll';
import accpetedStaffPayroll from '@salesforce/apex/PayrunSettingHandler.accpetedStaffPayroll';
import staffAllocationCalculation from '@salesforce/apex/PayRunHandler.staffAllocationCalculation';
import payrollRun from '@salesforce/apex/PayrollPdfData.payrollRun';
import updateSubmit from '@salesforce/apex/PayrollPdfData.updateSubmit';
import uploadFile from '@salesforce/apex/AWSS3FileUploadController.uploadFile';

import statusPayrollSetting from '@salesforce/apex/PayrollPdfData.statusPayrollSetting';
import emailAttach from '@salesforce/apex/SingleEmailAttachment.emailAttach';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import { loadScript } from "lightning/platformResourceLoader";
import jsPDF from '@salesforce/resourceUrl/jspdf';
//import organization from '@salesforce/resourceUrl/organization';
import { NavigationMixin } from 'lightning/navigation';
import My_Resource from "@salesforce/resourceUrl/myResource";
//import { subscribe, unsubscribe, onError } from 'lightning/empApi';
import FORM_FACTOR from '@salesforce/client/formFactor';
import LightningConfirm from 'lightning/confirm'; 
//stp 
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import submitPayload from '@salesforce/apex/GovReportsAPICallout.submitPayload';
import updateGovReportStatus from '@salesforce/apex/PayRunHandler.updateGovReportStatus';
import fetchPayrollStaff1 from '@salesforce/apex/PayRunHandler.fetchPayrollStaff1';
import getCustomMetaData from '@salesforce/apex/PayRunHandler.getCustomMetaData';
import getPayHistrory from '@salesforce/apex/PayrollSettingSchedular.getPayHistrory';
import saveSTPResponse from '@salesforce/apex/PayRunHandler.saveSTPResponse';
import getSTPActivityLog from '@salesforce/apex/PayRunHandler.getSTPActivityLog';




export default class PayRun extends NavigationMixin(LightningElement) {
    // @api companyid;
    // @api companyname;
    @track isPayrollTitle = false;
    @track statusValueTest;
    //subscription = {};
    //CHANNEL_NAME = '/event/RefreshDataTable__e';
    @track orgLogo;
    @track staffrecordsAddPayrun;
    @track staffFinalrecord;
    @track staffPayrollId;
    @track isaddpayrun = false;
    @track payrunSetting;
    @track payrun;
    @track payrunList;
    @track payrollSettingNewList;
    @track employmentTypePicklistValues;
    @track buttonsONPayroll = false;
    @track staffrecords;
    @track staffnewId;
    @track payrunSettingnewValue;
    @track sdate;
    @track edate;
    @track typeofEmployment;
    @track isopenPaysettings = false;
    @track paysetId;
    @track ispayrun = true;
    @track isrender = true;
    @track base64string;
    @track staffEmail;
    @track subjectName;
    @track startEndDate;
    @track orgName;
    @track orgEmail;
    @track staffpaysetId;
    @track staffPayIds=[];
    @track chpaymentDate;
    @track blpayDate=false;
    STPloading = My_Resource+'/myResource/images/STPloading.gif';
    @track records = []; //All records available in the data table    
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track visible = false;
    @track payrunEdit=false;
    @track isStatus=false;
    @track ispayslip=false;
    @track isSubmitbtn=false;
    @track showCsvExtract=false;
    @track stpCSVTable=[];
    @track issavedpayrun=false;
    recruitment = My_Resource + '/myResource/images/payroll1.svg';

      @track datain={
        PayEventPayer:null ,
        Intermediary: null,
        PayEventPayees: [],
        SoftwareID: ""
      };
   @track currentUser;
   @track usererror;
   @track StaffPayrollJasonFormat={};
   @track firstPretax;
   @track secondPretax;
   @track ThirdPretax;
   @track fourthPretax;
   @track fifthPretax;
   @track totalPretaxvalue;
   @track paySettingsNextPayJson={}
      @wire(getRecord, { recordId: Id, fields: [UserNameFld ]}) 
      userDetails({error, data}) {
          if (data) {
              this.currentUser = data.fields.Name.value;           
          } else if (error) {
              this.usererror = error ;
          }
      }
      activeSections = ['WorkingHours','StaffDetails','PreTaxDetails','PostTaxDetails','reimbursements','superAnnuation','PreviousEmployeeYTDDetails'];
    get isDesktop() {
        return FORM_FACTOR === 'Large';
    }

    get isMobile() {
        return FORM_FACTOR === 'Small';
    }
    @api reload() {
        this.isaddpayrun = false;
        this.isopenPaysettings = false;
        this.ispayrun = true;
    }
    get payRollStatusOptions() {
        return [
            { label: 'Draft', value: 'Draft' },
            { label: 'Submitted', value: 'Submitted' },
            { label: 'STP Filed', value: 'STP Filed' },
            { label: 'Finalised', value: 'Finalised' },
            { label: 'Delete', value: 'Delete' },
        ];
    }

    @track FinalisedYtdFlag =false;
    @track NormalYtdFlag=true; 
    @track isDisbaleWorkingHours = false; 
    @track sectionFlags = {
        StaffDetails: true,
        WorkingHours: false,
        PreTaxDetails: false,
        PostTaxDetails: false,
        reimbursements: false,
        superAnnuation: false, 
        PreviousEmployeeYTDDetails: false,      
    };
    
     @track sectionIcons = {
        StaffDetails: '\u2B9F', 
        WorkingHours: '\u2B9C',
        PreTaxDetails: '\u2B9C',
        PostTaxDetails: '\u2B9C',
        reimbursements: '\u2B9C',
        superAnnuation: '\u2B9C', 
        PreviousEmployeeYTDDetails: '\u2B9C',  
    };    
    handleEditPayStaff(event) {
        this.payrunEdit = true;  
       /*  alert("handleEditPayStaff"); */
        let staffId = event.currentTarget.dataset.staffid;
         console.log(' consol '+event.currentTarget.dataset.typeofuser);
        //alert("getting staff ID: " + staffId);
        if(event.currentTarget.dataset.typeofuser=='NDIS User'){
            this.isDisbaleWorkingHours=true;
         }else{
             this.isDisbaleWorkingHours=false
         } 
   
        this.staffpaysetId = event.currentTarget.dataset.id;
       // console.log('staffPayroll jason format'+JSON.stringify(this.StaffPayrollJasonFormat));
        this.totalPretaxvalue=this.StaffPayrollJasonFormat[this.staffpaysetId]["TotalPreTax"]
        this.firstPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxOne"];
        this.secondPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxTwo"];
        this.ThirdPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxThree"];
        this.fourthPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxFour"];
        this.fifthPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxFive"];
        //this.totalPretaxvalue=parseFloat(this.firstPretax)+parseFloat(this.secondPretax)+parseFloat(this.ThirdPretax)+parseFloat(this.fourthPretax)+parseFloat(this.fifthPretax);

        let voluntaryContribution =this.StaffPayrollJasonFormat[this.staffpaysetId]["voluntaryContribution"];
        this.voluntaryContributionCureencyVal=this.StaffPayrollJasonFormat[this.staffpaysetId]["ContributionCurrency"];
        this.voluntaryContributionPercentVal=this.StaffPayrollJasonFormat[this.staffpaysetId]["ContributionPercent"];
            if(voluntaryContribution =='Fixed'){
                this.VoluntaryContributionCurrency=true;
                this.VoluntaryContributionPercent=false;
            }else{
                this.VoluntaryContributionPercent=true;
                this.VoluntaryContributionCurrency=false;
            }
         
        this.postTaxlabelValue=this.StaffPayrollJasonFormat[this.staffpaysetId]["postTax"];
        
        this.reimburementsValue=this.StaffPayrollJasonFormat[this.staffpaysetId]["reimb"];
        this.pretaxOneChange=this.firstPretax;
        this.pretaxTwoChange=this.secondPretax;
        this.pretaxThreeChange=this.ThirdPretax;
        this.pretaxFourChange=this.fourthPretax;
        this.pretaxFiveChange=this.fifthPretax;
        if(this.firstPretax ==0){
            this.firstPretax=false;
        }
        if(this.secondPretax ==0){
            this.secondPretax=false;
        }
        if(this.ThirdPretax ==0){
            this.ThirdPretax=false;
        }
        if(this.fourthPretax ==0){
            this.fourthPretax=false;
        }
        if(this.fifthPretax ==0){
            this.fifthPretax=false;
        }

        let localLastTaxYTD=0;
        let localLastGrossSalaryYTD=0;
        let localLastSuperannuationYTD=0;
        let localLastPreTaxYTD=0;
        let localLastPostTaxYTD=0;
        let localLastNetPaySalaryYTD=0;
        let localLastSalaryWagesYTD=0;
        let localLastVoluntarySuperAnnuationYTD=0;
        let localLastSuperAndVoluntaryAnnuationYTD=0;
        // checking Previous month equal to June month for the process payment Date
        if(this.blhdfinalized==true){            
            // const staffLastYtdList = JSON.parse(this.transformedJuneData);
           // console.log(' in finalised button');
           // console.log('stafff Id '+staffId);
            this.FinalisedYtdFlag=true;
            this.NormalYtdFlag=false;
            let firstElement =this.transformedJuneData[staffId][0];
           /*  console.log('Staff june data in edit '+JSON.stringify(firstElement));
            alert("True"); */
            localLastTaxYTD = firstElement.Parent.Current_Tax_YTD__c;
            localLastGrossSalaryYTD = firstElement.Parent.Current_Taxble_Gross_Salary_YTD__c;
            localLastSuperannuationYTD = firstElement.Parent.Current_Superannuation_YTD__c;
            localLastPreTaxYTD = firstElement.Parent.Current_Pre_Tax_YTD__c;
            localLastPostTaxYTD = firstElement.Parent.Current_Post_Tax_YTD__c;
            localLastNetPaySalaryYTD =firstElement.Parent.Current_Net_Pay_Salary_YTD__c;
            localLastSalaryWagesYTD = firstElement.Parent.Current_Salary_Wages_YTD__c; 
            localLastVoluntarySuperAnnuationYTD=firstElement.Parent.Current_Voluntary_Superannuation_YTD__c;
            localLastSuperAndVoluntaryAnnuationYTD=firstElement.Parent.Current_Super_and_Voluntaryannuation_YTD__c;

            console.log('local last voluntary super '+ localLastVoluntarySuperAnnuationYTD);
            console.log(' local last super and voluntary  '+ localLastVoluntarySuperAnnuationYTD);
        }else{
            let staffTaxYTdsJSon={};
           
            getPayHistrory({Paymentdate: this.chpaymentDate, groupName: this.groupName}).then(response => {
               // console.log('  year data 1' + JSON.stringify(response)); 
                let financialyearData=[];
                response.forEach(rec=>{
                    const payDate = new Date(rec.Parent.Pay_Date__c);
                    const month = payDate.getMonth() + 1; // getMonth() returns 0-based month, adding 1 for 1-based month
                    if (month >= 7 ) {
                        financialyearData.push(rec);
                    }                    
                });

                if (financialyearData.length>0){
                    staffTaxYTdsJSon= this.transformData(financialyearData);
                    console.log(' get history data ' + JSON.stringify(staffTaxYTdsJSon)); 
                   // console.log('count of year transactions '+staffTaxYTdsJSon[staffId].length);
                    if(staffTaxYTdsJSon[staffId].length <= 1){
                        if (this.editHistoryPayroll == true)
                        {
                            this.editHistoryPayroll=false;
                            const payDateon = new Date(this.chpaymentDate);
                            const monthOn = payDateon.getMonth() + 1;
                            if(monthOn < 7){
                                this.NormalYtdFlag=true;
                                this.FinalisedYtdFlag=false;
                            }
                        }
                        else{
                             console.log(' if 1');
                            this.FinalisedYtdFlag=true;
                            this.NormalYtdFlag=false;
                            localLastTaxYTD = 0;
                            localLastGrossSalaryYTD = 0;
                            localLastSuperannuationYTD = 0;
                            localLastPreTaxYTD = 0;
                            localLastPostTaxYTD = 0;
                            localLastNetPaySalaryYTD =0;
                            localLastSalaryWagesYTD = 0;
                            localLastVoluntarySuperAnnuationYTD=0;
                            localLastSuperAndVoluntaryAnnuationYTD=0;
                        }
                       
                    }else{
                       console.log(' else 1');
                        this.NormalYtdFlag=true;
                        this.FinalisedYtdFlag=false;
                    }
                }
                else{
                    const payDateon = new Date(this.chpaymentDate);
                    const monthOn = payDateon.getMonth() + 1;
                    if(monthOn == 7){
                       // console.log(' if 2');
                        this.FinalisedYtdFlag=true;
                        this.NormalYtdFlag=false;
                        localLastTaxYTD = 0;
                        localLastGrossSalaryYTD = 0;
                        localLastSuperannuationYTD = 0;
                        localLastPreTaxYTD = 0;
                        localLastPostTaxYTD = 0;
                        localLastNetPaySalaryYTD =0;
                        localLastSalaryWagesYTD = 0;
                        localLastVoluntarySuperAnnuationYTD=0;
                        localLastSuperAndVoluntaryAnnuationYTD=0;
                    }else{
                       // console.log(' else 2');
                        this.NormalYtdFlag=true;
                        this.FinalisedYtdFlag=false;
                    }
                }
                
            }).catch(error => {
               // console.log('custom meta error ' + JSON.stringify(error));
            });
        }

        this.LastTaxYTD = localLastTaxYTD;
        this.LastGrossSalaryYTD = localLastGrossSalaryYTD;
        this.LastSuperannuationYTD = localLastSuperannuationYTD;
        this.LastPreTaxYTD = localLastPreTaxYTD;
        this.LastPostTaxYTD = localLastPostTaxYTD;
        this.LastNetPaySalaryYTD =localLastNetPaySalaryYTD;
        this.LastSalaryWagesYTD = localLastSalaryWagesYTD;
        this.LastVoluntarySuperAnnuationYtd=localLastVoluntarySuperAnnuationYTD;
        this.LastSuperAndVoluntarySuperAnnuationYtd=localLastSuperAndVoluntaryAnnuationYTD;

        this.Editbutton = false;
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
        this.sectionIcons[sectionId] = sectionElement.classList.contains('hidden-section') ? '\u2B9C' : '\u2B9F';
      }

    @track pretaxOneChange;
    @track pretaxTwoChange;
    @track pretaxThreeChange;
    @track pretaxFourChange;
    @track pretaxFiveChange;
    @track postTaxlabelValue;
    @track reimburementsValue;
    @track VoluntaryContributionCurrency=false;
    @track VoluntaryContributionPercent=false;
    @track voluntaryContributionCureencyVal=0;
    @track voluntaryContributionPercentVal=0;
     handlePreTaxChange(event){
        
        if(event.target.name == 'PreTaxonevalue'){
            this.pretaxOneChange=event.target.value;
           
        }
        if(event.target.name == 'PreTaxTwovalue'){
            this.pretaxTwoChange=event.target.value;
         
        }
        if(event.target.name == 'pretaxthreevalue'){
            this.pretaxThreeChange=event.target.value;
           
        }
        if(event.target.name == 'pretaxFourvalue'){
            this.pretaxFourChange=event.target.value;
            
        }
        if(event.target.name == 'pretaxFivevalue'){
            this.pretaxFiveChange=event.target.value;
           
        }
        if(this.pretaxOneChange==''|| this.pretaxOneChange== undefined  || this.pretaxOneChange== null){
            this.pretaxOneChange=0; 
        }
        if(this.pretaxTwoChange==''|| this.pretaxTwoChange== undefined  || this.pretaxTwoChange== null){
            this.pretaxTwoChange=0; 
        }
        if(this.pretaxThreeChange==''|| this.pretaxThreeChange== undefined  || this.pretaxThreeChange== null){
            this.pretaxThreeChange=0; 
        }
        if(this.pretaxFourChange==''|| this.pretaxFourChange== undefined  || this.pretaxFourChange== null){
            this.pretaxFourChange=0; 
        }
        if(this.pretaxFiveChange==''|| this.pretaxFiveChange== undefined  || this.pretaxFiveChange== null){
            this.pretaxFiveChange=0; 
        }


        this.totalPretaxvalue=parseFloat(this.pretaxOneChange)+parseFloat(this.pretaxTwoChange)+parseFloat(this.pretaxThreeChange)+parseFloat(this.pretaxFourChange)+parseFloat(this.pretaxFiveChange);
       
        if(event.target.name == 'totalPreTax'){
            this.totalPretaxvalue=event.target.value;   
        }
        if(this.totalPretaxvalue==''|| this.totalPretaxvalue== undefined  || this.totalPretaxvalue== null){
            this.totalPretaxvalue=0;
           // console.log('total pre tax '+this.totalPretaxvalue);
        }

    } 
    handlePostTaxhandler(event){
        if(event.target.name == 'posttax'){
            this.postTaxlabelValue=event.target.value;   
        }
        if(this.postTaxlabelValue ==''||this.postTaxlabelValue ==undefined||this.postTaxlabelValue ==null ){
            this.postTaxlabelValue=0;
        }
    }
    handleReimbureseMents(event){
        if(event.target.name == 'reimbursements'){
            this.reimburementsValue=event.target.value;   
        }
        if(this.reimburementsValue ==''||this.reimburementsValue ==undefined||this.reimburementsValue ==null ){
            this.reimburementsValue=0;
        }

    }
   
    VoluntaryChange(event){
            if(event.target.value=='Fixed'){
                this.VoluntaryContributionCurrency=true;
                this.VoluntaryContributionPercent=false;
            }
            if(event.target.value=='Percentage'){
                this.VoluntaryContributionPercent=true;
                this.VoluntaryContributionCurrency=false;
            }
            if(event.target.name=='contributionFixed'){
                this.voluntaryContributionCureencyVal=event.target.value;
            }
            if(event.target.name=='contributionPercent'){
                this.voluntaryContributionPercentVal=event.target.value;
            }
      
        }
    
   HandleSubmitStaffPayRoll(event){
        const fields = event.detail.fields;
       
        if(this.totalPretaxvalue==''|| this.totalPretaxvalue== undefined  || this.totalPretaxvalue== null){
            this.totalPretaxvalue=0;

        }
        if(this.postTaxlabelValue ==''||this.postTaxlabelValue ==undefined||this.postTaxlabelValue ==null ){
            this.postTaxlabelValue=0;
        }
        if(this.reimburementsValue ==''||this.reimburementsValue ==undefined||this.reimburementsValue ==null ){
            this.reimburementsValue=0;
        }
        fields.Pre_tax_values__c = this.totalPretaxvalue;
        fields.Post_tax_values__c = this.postTaxlabelValue;
        fields.Reimbursements__c = this.reimburementsValue;

        if(this.voluntaryContributionCureencyVal==undefined ||this.voluntaryContributionCureencyVal=='' ||this.voluntaryContributionCureencyVal==null ){
            this.voluntaryContributionCureencyVal=0; 
        }
        if(this.voluntaryContributionPercentVal==undefined ||this.voluntaryContributionPercentVal=='' ||this.voluntaryContributionPercentVal==null){
            this.voluntaryContributionPercentVal=0;
        }
        fields.Voluntary_Contribution_Fixed__c=this.voluntaryContributionCureencyVal;
        fields.Voluntary_Contribution_Percent__c= this.voluntaryContributionPercentVal;
        fields.Pay_Event_Indicator__c=this.finalizedPayEventIndicator;
       // console.log('fields '+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-staffpay="staffPayrollForm"]').submit(fields);
    }

    handleeditSuccess(){
       let payrunSetting=[];   
       this.StaffPayrollJasonFormat={};    
       accpetedStaffPayroll({ payrollId: this.paysetId }).then(response => {
            response.forEach(record => {
                let tempRec = Object.assign({}, record);
               // console.log('tempRec event', JSON.stringify(tempRec));
                tempRec.grossSalary = tempRec.Gross_Salary__c.toFixed(2);
               // tempRec.totalHours = tempRec.Total_Hours__c.toFixed(2);
               tempRec.totalHours = tempRec.Working_Hours__c.toFixed(2);
               // console.log('tempRec grossSalary', tempRec.grossSalary);
                tempRec.superAnnuation = tempRec.Super_And_Voluntary_Supper_Annuation__c.toFixed(2);
                tempRec.grossPerWeek = tempRec.Gross_Salary_Display__c.toFixed(2);
                tempRec.netPay = tempRec.Net_Pay__c.toFixed(2);
                tempRec.tax = tempRec.Tax__c.toFixed(2);
                payrunSetting.push(tempRec);
                this.StaffPayrollJasonFormat[record.Id]={"preTaxOne":record.Pre_Tax_One_Value__c,"preTaxTwo":record.Pre_Tax_Two_Value__c,"preTaxThree":record.Pre_Tax_Three_Value__c,"preTaxFour":record.Pre_Tax_Four_Value__c,"preTaxFive":record.Pre_Tax_Five_Value__c
                ,"TotalPreTax":record.Pre_tax_values__c,"postTax":record.Post_tax_values__c,"reimb":record.Reimbursements__c,"voluntaryContribution":record.Voluntary_Contribution__c,"ContributionCurrency":record.Voluntary_Contribution_Fixed__c,"ContributionPercent":record.Voluntary_Contribution_Percent__c};
            })
            this.staffrecords = payrunSetting;

            if (this.staffrecords.length > 0) {
                this.buttonsONPayroll = true;
            } else {
                this.buttonsONPayroll = false;
            }
            this.payrunEdit=false; 
            this.blhdfinalized=false;
            this.finalizedPayEventIndicator=false;
            this.NormalYtdFlag=true
            this.FinalisedYtdFlag=false;
            this.isDisbaleWorkingHours=false 
            const toastEvent = new ShowToastEvent({
                title: "Success",
                message: "Changes Saved Successfully",
                variant: "success"
            });
            this.dispatchEvent(toastEvent); 
        }).catch(err => {
           // console.log(err);
        });
    }

    handleeditClose(){
        this.payrunEdit=false;  
    }
    @track groupName;
    @track orgABN;
    @track chkLabel;
    @track fileStpbutton;
    @track Editbutton;    
    @track paymentProcessDate = false;
    @track processdate;
    @track editProcessedDate=false;
    @track AddPayRunButton=true;
    @track initialPayProcessDate;
    @track initialPayEnddate;
    @track listOfStaffPAyRoll=[];
    @track activityLogButton=true;

    
    openPaysettings(event) {
        this.chkLabel='I, ' +this.currentUser+', have read and accepted the Authorization to file';
        this.isopenPaysettings = true;
        this.ispayrun = false;
        this.isaddpayrun = false;    
        this.blEditPayrun = false;  
        this.editProcessedDate=true; 
        this.customMetadatDetails=0 
        this.paysetId = event.currentTarget.dataset.id;
        this.chpaymentDate = event.currentTarget.dataset.date;
        this.initialPayProcessDate= event.currentTarget.dataset.date;
        this.initialPayEnddate=event.currentTarget.dataset.enddate;
        this.blhdfinalized=false;
        this.disableSubmitButton=false;
        this.NormalYtdFlag=true;
        this.FinalisedYtdFlag=false;
        this.activityData=[];
        this.showSignatureTemplate = true;
        
       // console.log('group name  '+event.currentTarget.dataset.groupname);
        getCustomMetaData({PayDate: this.chpaymentDate}).then(response => {
            this.customMetadatDetails=response.length;
           // console.log('custom meta data Details '+this.customMetadatDetails);
        }).catch(error=>{
           // console.log('custom meta error '+JSON.stringify(error));
        });  
       // console.log('chpaymentDate '+this.chpaymentDate )      
        let statusValue = event.currentTarget.dataset.name; 
       // console.log('status value '+statusValue);      
        if(statusValue=='Submitted' || statusValue=='Delete'){
            this.isStatus=true;  
        }
        else{
            this.isStatus=false; 
        }
        if(statusValue=='Submitted'){
            this.ispayslip=true;
            this.isSubmitbtn=true;
        }
        else{
            this.ispayslip=false; 
            this.isSubmitbtn=false;
        }
        // praveen code starts here
        if(statusValue=='Draft'){ 
            this.fileStpbutton =true;
            this.isStatus=false;
            this.editProcessedDate=false;
            this.activityLogButton=true;
        } else if(statusValue=='Submitted'){  
            this.fileStpbutton =false;
            this.Editbutton = false; 
            this.activityLogButton=true;          
        }else if(statusValue=='STP Filed'){
            this.fileStpbutton =true;
            this.ispayslip=true; 
            this.isSubmitbtn=true; 
            this.isStatus=true;
            this.Editbutton = true;  
            this.activityLogButton=false;          
        }

        this.listOfStaffPAyRoll=[];
        let payrunSetting = [];    
      
        accpetedStaffPayroll({ payrollId: this.paysetId }).then(response => {   
            let PayerTotalPAYGWAmount=0;
            let PayerTotalGrossPaymentsAmount=0;        
            response.forEach(record => {              
                let tempRec = Object.assign({}, record);
               // console.log('tempRec ', JSON.stringify(tempRec));
                this.StaffPayrollJasonFormat[record.Id]={"preTaxOne":record.Pre_Tax_One_Value__c,"preTaxTwo":record.Pre_Tax_Two_Value__c,"preTaxThree":record.Pre_Tax_Three_Value__c,"preTaxFour":record.Pre_Tax_Four_Value__c,"preTaxFive":record.Pre_Tax_Five_Value__c,
                    "TotalPreTax":record.Pre_tax_values__c,"postTax":record.Post_tax_values__c,"reimb":record.Reimbursements__c,"voluntaryContribution":record.Voluntary_Contribution__c,"ContributionCurrency":record.Voluntary_Contribution_Fixed__c,"ContributionPercent":record.Voluntary_Contribution_Percent__c};
                    
                tempRec.grossSalary = tempRec.Gross_Salary__c.toFixed(2);
               // tempRec.totalHours = tempRec.Total_Hours__c.toFixed(2);
                tempRec.totalHours = tempRec.Working_Hours__c.toFixed(2);
                tempRec.superAnnuation = tempRec.Super_And_Voluntary_Supper_Annuation__c.toFixed(2);
                tempRec.grossPerWeek = tempRec.Gross_Salary_Display__c.toFixed(2);
                tempRec.netPay = tempRec.Net_Pay__c.toFixed(2);
                tempRec.tax = tempRec.Tax__c.toFixed(2);
                this.processdate =tempRec.Pay_Date__c;                
                if (this.processdate != undefined)
                {
                    this.paymentProcessDate = true;
                    this.processdate =tempRec.Pay_Date__c;   
                }
                else
                {
                    this.paymentProcessDate = false;
                }
                
                payrunSetting.push(tempRec);
                
                this.listOfStaffPAyRoll.push(tempRec.Id);

                let tfn='';
                let abn='';                      
               
                PayerTotalPAYGWAmount=PayerTotalPAYGWAmount+tempRec.Tax__c; ////// Last Tax YTD + Current
                PayerTotalGrossPaymentsAmount=PayerTotalGrossPaymentsAmount+tempRec.Gross_Salary_Display__c; //// Last Gross Salary YTD + Current Gross
               
                let payeedetails={
                        PayeeTFN: tempRec.Staff__r.TFN_number__c, //either abn or tfn is mandatory
                        ContractorABN:tempRec.Staff__r.ABN_Number__c,                 
                        PayeePayrollID: tempRec.Staff__c, //uniquie record id of staff (PayrollId__c),
                        PreviousPayrollID: null,
                        PayeeNameDetails: {
                          PayeeFamilyName: tempRec.Staff__r.Last_Name__c,
                          PayeeFirstName: tempRec.Staff__r.Name__c,
                          PayeeOtherName: null                         
                        },
                        PayeeDateOfBirth: tempRec.Staff__r.Date_Of_Birth__c,
                        PayeeAddressDetails: {
                          Line1: tempRec.Staff__r.Address__Street__s,
                          Line2: null,
                          Line3: null,
                          LocalityName: tempRec.Staff__r.Address__City__s,
                          Postcode: tempRec.Staff__r.Address__PostalCode__s,
                          StateOrTerritoryCode:  tempRec.Staff__r.Address__StateCode__s,
                          CountryCode: 'au'
                        },
                        PayeeEmailAddress:  tempRec.Staff__r.Email_Address__c,
                        PayeePhoneNumber: tempRec.Staff__r.Contact_Number__c,
                        EmploymentConditions: {
                          PayeeCommencementDate: tempRec.Staff__r.Emp_Start_Date__c,
                          PayeeCessationDate: tempRec.Staff__r.Emp_exit_date__c,
                          EmploymentBasisCode:'F',//tempRec.Staff__r.Type_of_Employment__c,
                          CessationTypeCode:tempRec.Staff__r.Exit_Reason_Code__c,
                          TaxTreatmentCode: 'RDXXXX',
                          TaxOffsetAmount: null
                        },
                        PayrollRun: {
                          PeriodStartDate: tempRec.Payroll_Setting__r.Period_Start_Date__c,
                          PeriodEndDate: tempRec.Payroll_Setting__r.Period_End_Date__c,
                          FinalEventIndicator: false,
                          IncomeStreams: [
                            {
                              IncomeStreamTypeCode: 'SAW', // need confirmation
                              CountryCode: null,
                              PAYGWAmount: tempRec.Current_Tax_YTD__c,// Need confirmaiton ---- Current Tax or Current Tax YTD ?
                              ForeignTaxPaidAmount: null,
                              ExemptForeignIncomeAmount: null,
                              GrossAmount: tempRec.Current_Taxble_Gross_Salary_YTD__c, // Need confirmaiton ---- Current Gross Salary or Current Gross Salary YTD ?
                              PaidLeaves: null,
                              Allowances: null,
                              OvertimeAmount: null, 
                              BonusesAndCommissionsAmount: null,
                              DirectorsFeesAmount: null,
                              SalarySacrifices: null,
                              LumpSumPayments: null,                            
                            }
                          ],
                          Deductions: null,
                          SuperEntitlements: [
                            {
                              SuperEntitlementTypeCode: 'L',
                              SuperEntitlementAmount: tempRec.Current_Super_and_Voluntaryannuation_YTD__c
                            }
                          ],
                          ReportableFringeBenefits: null                        
                }
              
            }
            let payerDetails= {                       
                BMSIdentifier: response[0].Org_BMSId__c,
                PayerABN:response[0].Org_ABN__c,//staff__r.Org_ABN__c,
                PayerWPN: null,
                PayerBranchCode: response[0].Staff__r.Facility__r.Organisation__r.Branch_code__c, //Need to create Branch Code field in Org Object
                PreviousBMSIdentifier: null,
                PayerOrganisationName: response[0].Org_Name__c,
                PayerContactName: response[0].Staff__r.Facility__r.Organisation__r.Contact_Name__c, // need to pass values as new field
                PayerEmailAddress: response[0].orgEmail__c,
                PayerBusinessHoursPhoneNumber: response[0].Org_Phone__c,
                PayerPostcode: response[0].OrgPostalCode__c,
                PayerCountryCode:'au',
                    Payroll:{ PayOrUpdateDate: response[0].Pay_Date__c,  //// Modified by Nagendra due to Payment date changes by the user at payrun time
                             FullFileReplacementIndicator:false},
                    PayerPeriodTotals: {  PayerTotalPAYGWAmount: null,
                        PayerTotalGrossPaymentsAmount: null,
                        ChildSupportTotalGarnisheeAmount:null,
                        ChildSupportTotalDeductionsAmount: null},   
                    PayerDeclaration:{  PayerDeclarerIdentifier: this.currentUser,
                            PayerDeclarationDate: new Date(),
                            PayerDeclarationAcceptanceIndicator:true},
                    PayerPeriodTotals:{
                        PayerTotalPAYGWAmount:PayerTotalPAYGWAmount,
                        PayerTotalGrossPaymentsAmount:PayerTotalGrossPaymentsAmount,
                        ChildSupportTotalGarnisheeAmount:0,
                        ChildSupportTotalDeductionsAmount:0
                    }         
            }
            this.datain.PayEventPayer=payerDetails;
               
            this.datain.PayEventPayees.push(payeedetails);
            })
            this.staffrecords = payrunSetting;
         
            if (this.staffrecords.length > 0) {
                this.buttonsONPayroll = true;
            } else {
                this.buttonsONPayroll = false;
            }
            this.groupName=response[0].Payroll_Setting__r.Group_Name__c;
            this.orgABN=response[0].Org_ABN__c; 
            this.datain.SoftwareID=response[0].Staff__r.Facility__r.Organisation__r.SoftwareId__c;        
        })        
    }

    renderedCallback() {
        Promise.all([
            loadScript(this, jsPDF).then(() => {
            }).catch(error => {
                console.error("Error " + error);
            })
        ]);
    }

    connectedCallback() {  
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        if (storedCompanyId && storedCompanyName) {
            this.companyId  = storedCompanyId;
            this.companyname = storedCompanyName;
             this.isPayrollTitle = true;
            console.log('Company from localStorage connectedCallback payroll:', this.companyId, this.companyname);
        } else {
            this.isPayrollTitle = false;
            console.warn('No company info found in localStorage connectedCallback payroll');
            
        }
        //if(this.companyid && this.companyname){
         //   this.isPayrollTitle = true;
          //  console.log('companyid in connectedCallback payroll: ', this.companyid);
            //this.companyId = this.companyid;
            console.log(' companyname in connectedCallback payroll: ', this.companyname);
            //console.log('companyId in connectedCallback payroll: ', this.companyId); 
        // } else {
        //     this.isPayrollTitle = false;
        // }
        
        this.blpayDate=false;    
        this.issavedpayrun = false;    
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.sdate = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth(), 9);
        this.edate = last.toISOString().slice(0, 10);
        //fetchPayrollStaff1({payrollGroupName: this.groupName, startDat: this.payrollStartDate, endDate : this.payrollEndDate}).then(response=> {
        getpPaySettings().then(response => {
            this.payrunSetting = response;
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            let tempConList = [];
            let tempConListExceptDraft = [];
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
            // tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
               if(record.Staff_Payroll_Settings__r){
                let childPayruns=record.Staff_Payroll_Settings__r;
                 
                  childPayruns.forEach(rec=>{
                      tempConRec.paymentDate=new Date(rec.Pay_Date__c).toLocaleDateString('en-GB');
                     
                  });
               }
                var date1 = new Date(tempConRec.Next_Pay_Date__c);
                var fdate = date1.toLocaleDateString("en-US", options);
                if (tempConRec.Frequency__c == 'Weekly') {
                    tempConRec.period = 'Week ending' + ' ' + fdate;
                }
                if (tempConRec.Frequency__c == 'Monthly') {
                    tempConRec.period = fdate;
                }
                if (tempConRec.Status__c == 'STP Filed') {
                    // Need to add ICON for STP Filed related Groups in Payroll History
                    tempConRec.StatusChecking = true;
                }
                else{
                    tempConRec.StatusChecking = false;
                }
                if (tempConRec.Status__c == 'Draft') {
                    //alert("Callback payment Date: " + tempConRec.Next_Pay_Date__c);
                    //this.chpaymentDate = tempConRec.Next_Pay_Date__c;
                    //this.blpayDate=true;
                    tempConList.push(tempConRec);
                    tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                }
                if (tempConRec.Status__c != undefined && tempConRec.Status__c != 'Draft') {
                    tempConListExceptDraft.push(tempConRec);
                }
            })
            this.records = tempConListExceptDraft;
            //this.payrunList = tempConListExceptDraft;
            this.payrun = tempConList;
           // console.log('  this.payrun>>',  JSON.stringify(this.payrun));
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
        this.payrunList = [];
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
            this.payrunList.push(this.records[i]);
        }
        //refreshApex(this.refreshTable);         
    }

    handleaddPayrun() {
        this.isaddpayrun = true;
        this.ispayrun = true;
        this.isopenPaysettings = false;     
        this.blhdfinalized = false;
        this.disableSubmitButton=false;
        this.payrunSettingnewValue = ''; 
        this.finalizedPayEventIndicator=false;    
        fetchPayrollStaff().then(response => {
            this.payrollSettingNewList = response.map(record => ({ value: record.Id, label: record.Period__c }));         
           // console.log(JSON.stringify(this.payrollSettingNewList));
            response.forEach(rec=>{
                this.paySettingsNextPayJson[rec.Id]={"NextParunDate":rec.Next_Pay_Date__c};
            })
           
        }).catch(err => {
           // console.log(err);
        });
      
    }
    closeaddPayRun() {
        this.isaddpayrun = false;
        this.staffrecords = [];
        this.staffrecordsAddPayrun = [];
        this.buttonsONPayroll = false;
        this.isopenPaysettings = false;
        this.ispayrun = true;    
        this.AddPayRunButton=true;
        this.showSignatureTemplate=false;
        this.closeModal();
    }

    @track isFileSTP=false;
    @track hideSTPButton=true;
    handlefileSTP(){       
        this.isFileSTP=true;
    }
    hideModalBox(){
        this.isFileSTP=false;
    }
    handleStpauth(event){
       var ischeked= event.target.checked;
       if(ischeked){
     this.hideSTPButton=false;
       }else{
        this.hideSTPButton=true;
       }
    }
 
    @track stpRefId;
    @track showProgressbar=false;    
    @track isProgressing = true;

    submitSTP(event){
        this.selectedButton = "STP Filed";        
       // console.log('selectedButton ', this.selectedButton);
        this.hideSTPButton=true;           
        this.showProgressbar=true;
        this.isProgressing = false;        
    //    var datain='{"PayEventPayer": {"BMSIdentifier": "125b8925-9a97-4178-8dee-78d3fdeb0437", "PayerABN": "67094544519", "PayerWPN": null, "PayerBranchCode": "2", "PreviousBMSIdentifier": null, "PayerOrganisationName": "YALACT P/L", "PayerContactName": "Mary-Anne Ackland", "PayerEmailAddress": "Maryaa@gmail.com", "PayerBusinessHoursPhoneNumber": "02 99720000", "PayerPostcode": "3000", "PayerCountryCode": "au", "Payroll": { "PayOrUpdateDate": "2023-06-30T00:00:00", "FullFileReplacementIndicator": false }, "PayerPeriodTotals": { "PayerTotalPAYGWAmount": 15000.5, "PayerTotalGrossPaymentsAmount": 150750.0, "ChildSupportTotalGarnisheeAmount": null, "ChildSupportTotalDeductionsAmount": null }, "PayerDeclaration": { "PayerDeclarerIdentifier": "MAAckland", "PayerDeclarationDate": "2023-10-19T14:59:53.2660835+05:30", "PayerDeclarationAcceptanceIndicator": true } }, "Intermediary": null, "PayEventPayees": [ { "PayeeTFN": "151994243", "ContractorABN": null, "PayeePayrollID": "50236", "PreviousPayrollID": null, "PayeeNameDetails": { "PayeeFamilyName": "Martin", "PayeeFirstName": "Mark", "PayeeOtherName": null }, "PayeeDateOfBirth": "1990-10-02T00:00:00", "PayeeAddressDetails": { "Line1": "34 wanderer street", "Line2": null, "Line3": null, "LocalityName": "Mt Helen", "Postcode": "3350", "StateOrTerritoryCode": "VIC", "CountryCode": "au" }, "PayeeEmailAddress": "heaven@gmail.com", "PayeePhoneNumber": null, "EmploymentConditions": { "PayeeCommencementDate": "2018-07-11T00:00:00", "PayeeCessationDate": "2023-06-12T00:00:00", "EmploymentBasisCode": "C", "CessationTypeCode": "C", "TaxTreatmentCode": "RDXXXX", "TaxOffsetAmount": null }, "PayrollRun": { "PeriodStartDate": "2023-06-01T00:00:00", "PeriodEndDate": "2023-06-30T00:00:00", "FinalEventIndicator": false, "IncomeStreams": [ { "IncomeStreamTypeCode": "SAW", "CountryCode": null, "PAYGWAmount": 3000.0, "ForeignTaxPaidAmount": null, "ExemptForeignIncomeAmount": null, "GrossAmount": 15000.0, "PaidLeaves": null, "Allowances": null, "OvertimeAmount": null, "BonusesAndCommissionsAmount": null, "DirectorsFeesAmount": null, "SalarySacrifices": null, "LumpSumPayments": null, "TerminationPayments": [ { "ETPCode": "R", "PayeeETPPaymentDate": "2023-06-18T00:00:00", "PayeeTerminationPaymentTaxFreeComponent": 10000.0, "PayeeTerminationPaymentTaxableComponent": 10000.0, "PayeeTotalETPPAYGWAmount": 3000.0 } ] } ], "Deductions": null, "SuperEntitlements": [ { "SuperEntitlementTypeCode": "L", "SuperEntitlementAmount": 2257.45 } ], "ReportableFringeBenefits": null } }, { "PayeeTFN": "151994716", "ContractorABN": null, "PayeePayrollID": "50237", "PreviousPayrollID": null, "PayeeNameDetails": { "PayeeFamilyName": "Lyons", "PayeeFirstName": "Lamar", "PayeeOtherName": null }, "PayeeDateOfBirth": "1989-09-02T00:00:00", "PayeeAddressDetails": { "Line1": "19 May St", "Line2": null, "Line3": null, "LocalityName": "Melbourne", "Postcode": "3021", "StateOrTerritoryCode": "VIC", "CountryCode": "au" }, "PayeeEmailAddress": "LittleL@hotmail.com", "PayeePhoneNumber": null, "EmploymentConditions": { "PayeeCommencementDate": "2018-02-15T00:00:00", "PayeeCessationDate": null, "EmploymentBasisCode": "F", "CessationTypeCode": null, "TaxTreatmentCode": "RTX2X1", "TaxOffsetAmount": null }, "PayrollRun": { "PeriodStartDate": "2023-06-01T00:00:00", "PeriodEndDate": "2023-06-30T00:00:00", "FinalEventIndicator": false, "IncomeStreams": [ { "IncomeStreamTypeCode": "SAW", "CountryCode": null, "PAYGWAmount": 3000.0, "ForeignTaxPaidAmount": null, "ExemptForeignIncomeAmount": null, "GrossAmount": 15000.0, "PaidLeaves": null, "Allowances": null, "OvertimeAmount": null, "BonusesAndCommissionsAmount": null, "DirectorsFeesAmount": null, "SalarySacrifices": null, "LumpSumPayments": null, "TerminationPayments": null } ], "Deductions": null, "SuperEntitlements": [ { "SuperEntitlementTypeCode": "O", "SuperEntitlementAmount": 467.45 } ], "ReportableFringeBenefits": null } }, { "PayeeTFN": null, "ContractorABN": "61000031569", "PayeePayrollID": "50238", "PreviousPayrollID": null, "PayeeNameDetails": { "PayeeFamilyName": "Trevor", "PayeeFirstName": "Jef", "PayeeOtherName": "Martin" }, "PayeeDateOfBirth": "1986-10-02T00:00:00", "PayeeAddressDetails": { "Line1": "Unit 6", "Line2": "34 wanderer street", "Line3": null, "LocalityName": "Mt Helen", "Postcode": "3350", "StateOrTerritoryCode": "VIC", "CountryCode": "au" }, "PayeeEmailAddress": "heaven@gmail.com", "PayeePhoneNumber": null, "EmploymentConditions": { "PayeeCommencementDate": "2018-02-20T00:00:00", "PayeeCessationDate": "2023-06-20T00:00:00", "EmploymentBasisCode": "L", "CessationTypeCode": "V", "TaxTreatmentCode": "RDXXXX", "TaxOffsetAmount": null }, "PayrollRun": { "PeriodStartDate": "2023-06-01T00:00:00", "PeriodEndDate": "2023-06-30T00:00:00", "FinalEventIndicator": false, "IncomeStreams": [ { "IncomeStreamTypeCode": "VOL", "CountryCode": null, "PAYGWAmount": 3000.0, "ForeignTaxPaidAmount": null, "ExemptForeignIncomeAmount": null, "GrossAmount": 15000.0, "PaidLeaves": null, "Allowances": null, "OvertimeAmount": null, "BonusesAndCommissionsAmount": null, "DirectorsFeesAmount": null, "SalarySacrifices": null, "LumpSumPayments": null, "TerminationPayments": null } ], "Deductions": null, "SuperEntitlements": [ { "SuperEntitlementTypeCode": "O", "SuperEntitlementAmount": 756.0 } ], "ReportableFringeBenefits": null } } ], "SoftwareID": "1487226280" }';
    console.log(' payload Data '+JSON.stringify(this.datain)) ;
    submitPayload({data: JSON.stringify(this.datain),isUpdate:false}).then(response =>{              
            console.log('stp response '+JSON.stringify(JSON.parse(response)));
            const parsedResponse = JSON.parse(response);
             console.log('ref id '+ parsedResponse.Result.RefMessageID);
            setTimeout(() => {
               this.stpRefId=parsedResponse.Result.RefMessageID;
                if(this.stpRefId ==null){                    
                    const event = new ShowToastEvent({
                        title: '',
                        message: 'STP filing Failed. Please Contact System Admin',
                        variant: 'Error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(event);
                    this.isProgressing=true;
                    this.showProgressbar=false; 
                    saveSTPResponse({paySettingId:this.paysetId ,typeOfsubmission:'File STP',output:response,refID:this.stpRefId}); 
                }else{
                        updateGovReportStatus({payrollId:this.paysetId ,refId:this.stpRefId,status:''}).then((result) => {                    
                            //alert('STP filed successfully');
                            const event = new ShowToastEvent({
                                title: '',
                                message: 'STP filed successfully',
                                variant: 'Success',
                                mode: 'dismissable'
                            });
                            this.dispatchEvent(event);                    
                            this.UpdatePayRunStatus();
                            this.showProgressbar=false;
                            this.isProgressing=true;  
                        })
                        .catch((error) => {                    
                            //alert('STP submission failed due to '+error.msg);
                            const event = new ShowToastEvent({
                                title: '',
                                message: 'STP submission failed due to '+error.msg,
                                variant: 'Error',
                                mode: 'dismissable'
                            });
                            this.dispatchEvent(event);
                            this.showProgressbar=false;
                            this.isProgressing=true;
                        });

                        saveSTPResponse({paySettingId:this.paysetId ,typeOfsubmission:'File STP',output:response,refID:this.stpRefId}); 
                    }
            }, 5000);
            
            if(!this.stpRefId == '' || !this.stpRefId == null){                                
            }

        })
        this.isFileSTP=false;
    }
    saveaddPayRun() {
        //console.log('Payroll setting ID '+this.payrunSettingnewValue );
       
        if(this.customMetadatDetails==0){
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Pay Run Financial year data is empty',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);  
        }else{
            staffAllocationCalculation({ payrollId: this.payrunSettingnewValue }).then(response => {
                this.isaddpayrun = false;
                this.staffrecords = response;
               // console.log('Staff Payroll records '+JSON.stringify(this.staffrecords));
                this.staffrecords.forEach(rec=>{
                    this.StaffPayrollJasonFormat[rec.Id]={"preTaxOne":rec.Pre_Tax_One_Value__c,"preTaxTwo":rec.Pre_Tax_Two_Value__c,"preTaxThree":rec.Pre_Tax_Three_Value__c,"preTaxFour":rec.Pre_Tax_Four_Value__c,"preTaxFive":rec.Pre_Tax_Five_Value__c,
                    "TotalPreTax":rec.Pre_tax_values__c,"postTax":rec.Post_tax_values__c,"reimb":rec.Reimbursements__c,"voluntaryContribution":rec.Voluntary_Contribution__c,"ContributionCurrency":rec.Voluntary_Contribution_Fixed__c,"ContributionPercent":rec.Voluntary_Contribution_Percent__c};
                })
               // console.log('Staff data jsonFormat '+JSON.stringify(this.StaffPayrollJasonFormat));
                this.staffrecordsAddPayrun = [];
                this.buttonsONPayroll = false;
                this.isopenPaysettings = false;
                this.ispayrun = true;            
                this.paystaffFlag = true;
                this.AddPayRunButton=true;
                this.records=[]; // new line added by praveen for pagination
    
                getpPaySettings().then(response => {
                    this.payrunSetting = response;
                    var options = { year: 'numeric', month: 'long', day: 'numeric' };
                    let tempConList = [];
                    let tempConListExceptDraft = [];
                   // console.log('Payroll Setting Data==>'+JSON.stringify(response));
                    response.forEach((record) => {
                        let tempConRec = Object.assign({}, record); 
                        tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                        var date1 = new Date(tempConRec.Next_Pay_Date__c)
                        var fdate = date1.toLocaleDateString("en-US", options);
                        if (tempConRec.Frequency__c == 'Weekly') {
                            tempConRec.period = 'Week ending' + ' ' + fdate;
                        }
                        if (tempConRec.Frequency__c == 'Monthly') {
                            tempConRec.period = fdate;
                        }
                        if (tempConRec.Status__c == 'Draft') {
                            //alert("Save payment Date: " + tempConRec.Next_Pay_Date__c);
                            this.chpaymentDate = tempConRec.Next_Pay_Date__c;
                            tempConList.push(tempConRec);
                        }
                        if (tempConRec.Status__c != undefined && tempConRec.Status__c != 'Draft') {
                            tempConListExceptDraft.push(tempConRec);
                        }
                    })
                   // this.payrunList = tempConListExceptDraft;  new line added by praveen for pagination , till 883 line 
                   this.records=tempConListExceptDraft;
                   this.totalRecords = this.records.length; 
                   this.paginationHelper();
                    this.payrun = tempConList;
                    //console.log('save payment date==>'+this.chpaymentDate);
                })
    
            });
            const evt = new ShowToastEvent({
                title: ' success',
                message: 'Pay Run is saved successfully',
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);  
        }
        this.issavedpayrun=false;
    }    

   
    handlePayrollSettingChange(event) {
        let selectedValue;
        let periosrtdate;
        let periodenddate;  
        this.customMetadatDetails=0;      
        if (event.target.name == 'payrollSetting') {
            selectedValue = event.detail.value;
            this.payrunSettingnewValue = event.detail.value;      
        }

        console.log("Pay Run: "+ JSON.stringify(this.payrunSettingnewValue));
        let nextPayrunDate=this.paySettingsNextPayJson[this.payrunSettingnewValue]["NextParunDate"];
        this.customMetadatDetails=0;
        getCustomMetaData({PayDate: nextPayrunDate}).then(response => {
            this.customMetadatDetails=response.length;
           // console.log('custom meta data Details '+this.customMetadatDetails);
        }).catch(error=>{
           // console.log('custom meta error '+JSON.stringify(error));
        });       
        
        accpetedStaffPayroll({ payrollId: this.payrunSettingnewValue }).then(response => {
            let tempConList = [];
            
            for (let i = 0; i < response.length; i++) {
                let record = response[i];
                let tempConRec = Object.assign({}, record);
                if(record.Staff__r.Status__c ==false){
                     const evt = new ShowToastEvent({
                        title: 'Error',
                        message: `Staff member ${record.Staff__r.Name} ${record.Staff__r.Last_Name__c} is currently inactive and cannot be included in this pay run group.`,
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
                    this.issavedpayrun = true;
                    return;
                } else if(record.Payroll_Setting__r.Frequency__c != record.Staff__r.Employment_type__c){
                        const evt = new ShowToastEvent({
                                title: 'Error',
                                message: 'Group frequency and Staff '+record.Staff__r.Name +' '+record.Staff__r.Last_Name__c+' frequency names are not matched.',
                                variant: 'error',
                                mode: 'dismissable'
                            });
                            this.dispatchEvent(evt);
                            this.issavedpayrun = true;
                            return;
                } else{
                    tempConList.push(tempConRec);
                    this.issavedpayrun = false;
                }
            }
            console.log("Selected Staff Data : "+ JSON.stringify(tempConList));
            this.staffrecordsAddPayrun = tempConList;
            if (this.staffrecordsAddPayrun.length > 0) {
                this.buttonsONPayroll = true;
            } else {
                this.buttonsONPayroll = false;
            }

        })
       this.AddPayRunButton=false;
    }

    handleSelect(event) {
        this.staffnewId = event.currentTarget.dataset.id;
    }   

    @track transformedJuneData={};
    @track transformedJulyData={};
    @track disableSubmitButton=false;
    
    paymentDateChanged(event){
       /*  alert("PaymentDateChanged "); */
        this.chpaymentDate = event.target.value; 
        this.customMetadatDetails = 0;
        this.disableSubmitButton=false;
    
        getCustomMetaData({PayDate: this.chpaymentDate}).then(response => {
            this.customMetadatDetails = response.length;
           // console.log('custom meta data Details ' + this.customMetadatDetails);
        }).catch(error => {
           // console.log('custom meta error ' + JSON.stringify(error));
        });
    
       // console.log('inital date  ' + this.initialPayProcessDate);
        if(new Date(this.chpaymentDate) <new Date(this.initialPayEnddate)){
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Pay Date should not be less than Period End Date',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
            this.disableSubmitButton=true;
            return ;
        } else if (new Date(this.chpaymentDate) < new Date(this.initialPayProcessDate) &&
            new Date(this.chpaymentDate).getMonth() == 5 && 
            new Date(this.initialPayProcessDate).getMonth() != 5) {
               /*  alert("Inside Condition True: "); */
                this.blhdfinalized=true;
                this.transformedJuneData={};
                this.transformedJulyData={};
                getPayHistrory({Paymentdate: this.chpaymentDate, groupName: this.groupName}).then(response => {
                // console.log(' get history data ' + JSON.stringify(response));
                    
                    const transformedData = this.separateAndTransformData(response);
                    this.transformedJuneData=transformedData.juneData;
                    this.transformedJulyData=transformedData.julyData;
                    
                }).catch(error => {
                   // console.log('custom meta error ' + JSON.stringify(error));
                });
        }else{
            this.blhdfinalized=false; 
            this.disableSubmitButton=false;
            this.NormalYtdFlag=true
            this.FinalisedYtdFlag=false;
        }
    }
    
    separateAndTransformData(data) {
        const juneList = [];
        const julyList = [];
    
        data.forEach(item => {
            const payDate = new Date(item.Parent.Pay_Date__c);
            const month = payDate.getMonth() + 1; // getMonth() returns 0-based month, adding 1 for 1-based month
    
            if (month === 6) {
                juneList.push(item);
            } else if (month === 7) {
                julyList.push(item);
            }
        });
    
        const juneData = this.transformData(juneList);
        const julyData = this.transformData(julyList);
    
        return { juneData, julyData };
    }
    
    transformData(data) {
        const result = {};
    
        data.forEach(item => {
            const staff = item.Parent.Staff__c;
    
            if (!result[staff]) {
                result[staff] = [];
            }
    
            result[staff].push(item);
        });
    
        return result;
    }
    
    

    @track blEditPayrun = false;
    @track editHistoryPayroll=false;
    @track payruneditFlag=false;
     EditPayRun(event)
    {       
      this.payruneditFlag=true;
    }    
    handleeditpayrun(event){
        this.blEditPayrun = true;          
            this.isStatus = false;
            this.isSubmitbtn=false; 
            this.Editbutton = true;
            this.editProcessedDate=false;
            // this.blhdfinalized = true;
            this.editHistoryPayroll=true;
            this.payruneditFlag=false;
    }
    handlepayrunclose(event){
            this.blEditPayrun = false;          
            this.isStatus = true;
            this.isSubmitbtn=true;
            this.Editbutton = false;
            this.editProcessedDate=true; 
            this.blhdfinalized = false; 
            this.editHistoryPayroll=false;
            this.payruneditFlag=false;
    }

    @track selectedButton;
    @track customMetadatDetails;
    handleSubmit(event) {
        this.selectedButton = event.target.name;
        if(this.customMetadatDetails==0){
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Pay Run Financial year data is empty',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }else{
            this.UpdatePayRunStatus(); 
        }
        
         
        if(event.currentTarget.dataset.message=='delete'){
            const evt = new ShowToastEvent({
                title: ' success',
                message: 'Pay Run is deleted successfully',
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);  
        }     
        //alert ("Payset ID : " + this.paysetId);        
    }

    @track LastTaxYTD;
    @track LastGrossSalaryYTD;
    @track LastSuperannuationYTD;
    @track LastPreTaxYTD;
    @track LastPostTaxYTD;
    @track LastNetPaySalaryYTD;
    @track LastSalaryWagesYTD;
    @track LastVoluntarySuperAnnuationYtd;
    @track LastSuperAndVoluntarySuperAnnuationYtd;
    @track blhdfinalized = false;
    @track finalizedPayEventIndicator=false;   

    UpdatePayRunStatus(){
       // console.log('selectedButton ', this.selectedButton);
        statusPayrollSetting({ paysetId: this.paysetId }).then(response => {
            this.statusValueTest = response.Status__c;
            if (this.statusValueTest == 'STP Filed' || this.statusValueTest == 'Delete') {
                const evt = new ShowToastEvent({
                    title: ' Error',
                    message: 'Payrun is already ' + this.statusValueTest,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
            } else {
                //alert("Submit payment Date: " + this.chpaymentDate);
                updateSubmit({ paysetId: this.paysetId, statusValue: this.selectedButton, changedpayDate: this.chpaymentDate }).then(response => {                    
                    getpPaySettings().then(response => {
                        this.records=[]; //this line addded by praveen  for pagination
                        this.payrunSetting = response;
                        var options = { year: 'numeric', month: 'long', day: 'numeric' };
                        let tempConList = [];
                        let tempConListExceptDraft = [];
                        response.forEach((record) => {
                            let tempConRec = Object.assign({}, record);
                           // tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                           if(record.Staff_Payroll_Settings__r){
                            let childPayruns=record.Staff_Payroll_Settings__r;
                             // console.log('childs Payruns '+JSON.stringify(childPayruns));
                              childPayruns.forEach(rec=>{
                                  tempConRec.paymentDate=new Date(rec.Pay_Date__c).toLocaleDateString('en-GB');
                              });
                           }
                            var date1 = new Date(tempConRec.Next_Pay_Date__c)
                            var fdate = date1.toLocaleDateString("en-US", options);
                            if (tempConRec.Frequency__c == 'Weekly') {
                                tempConRec.period = 'Week ending' + ' ' + fdate;
                            }                            
                            if (tempConRec.Frequency__c == 'Monthly') {
                                tempConRec.period = fdate;
                            }
                            if (tempConRec.Status__c == 'Draft') {
                                //alert("Handle or STP Submit payment Date: " + tempConRec.Next_Pay_Date__c);
                                this.chpaymentDate = tempConRec.Next_Pay_Date__c;
                                tempConList.push(tempConRec);
                            }
                            
                            if (tempConRec.Status__c != undefined && tempConRec.Status__c != 'Draft') {
                                //Nagendra this condition showing STP files and Reference ID within the History page                                
                                tempConListExceptDraft.push(tempConRec);
                            }                          
                        })
                       // this.payrunList = tempConListExceptDraft; this line commented by praveen and added 1069 to 1071 for pagination
                        this.payrun = tempConList;
                        this.records=tempConListExceptDraft;
                        this.totalRecords = this.records.length; 
                        this.paginationHelper();
                    })
        
                    this.staffPayIds=response;
                    
                  // console.log('staff Pay Roll ids ',JSON.stringify(this.staffPayIds));
                   this.handleDataPdf();                    
                })             
                this.isaddpayrun = false;
                this.staffrecords = [];
                this.buttonsONPayroll = false;
                this.isopenPaysettings = false;
                this.ispayrun = true;
                this.editProcessedDate=true;
                this.NormalYtdFlag=true
                this.FinalisedYtdFlag=false;
                this.customMetadatDetails=0
            }
        });        
    }   

    //Payslip
    @track childPdf=false;
    async handleDataPdf() {
        console.log('staff Id list before for loop', JSON.stringify(this.staffPayIds));
    
        for (const staffIdValue of this.staffPayIds) {
            console.log('Staff Id in for loop', staffIdValue);
    
            // Ensure childPdf is false before making the call
            this.childPdf = false;
    
            try {
                const response = await payrollRun({ staffPayrollId: staffIdValue });
    
                console.log('flag', this.childPdf);
                this.currentRecordPdf = response;
                console.log("Current Record for PDF:", JSON.stringify(this.currentRecordPdf));
    
                if (this.currentRecordPdf && this.currentRecordPdf.length > 0) {
                    if (this.currentRecordPdf[0].staffpayrollData.Type_of_User__c === 'ICT User') {
                        this.childPdf = false;
                        this.generatePayroll();
                    } else {
                        this.childPdf = true;
                    }
                }
    
                // Wait for child component to render the PDF before moving to the next iteration
                await this.sleep(2000);
    
            } catch (error) {
                console.error('Error processing payroll:', error);
            }
        }
    }
    
    // Sleep function to delay execution
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generatePayroll() {        
       // console.log('staffData.Base_Rate__c ', this.currentRecordPdf[0].staffData.Base_Rate__c);
        const { jsPDF } = window.jspdf;
        var doc = new jsPDF();
        // new condition added by praveen for pre tax
        if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c >0 || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c >0
            || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c >0  || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c >0
            || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c >0){
                doc.addImage(this.currentRecordPdf[0].bolbdata, "PNG", 10, 18, 70, 18);
                this.orgEmail = this.currentRecordPdf[0].organization.Email__c;
                    
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(134, 15, 60, 37,"FD");
        
                doc.setFont("roboto", "bold");
                doc.setFontSize(10);
                doc.text("PAID BY", 137, 23);
        
                doc.setFont("roboto", "");
                doc.setFontSize(10);
                doc.text(this.currentRecordPdf[0].organization.Name, 137, 30);
                doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.street + ', ' +this.currentRecordPdf[0].organization.Address_Latest__c.city, 137, 35);
                doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.state + ', ' + this.currentRecordPdf[0].organization.Address_Latest__c.postalCode, 137, 40);
                doc.text("ABN: "+this.currentRecordPdf[0].organization.ABN__c, 137, 45);
        
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(134, 60, 60, 27,"FD");
        
                doc.setFont("roboto", "bold");
                doc.setFontSize(10);
                doc.text("EMPLOYMENT DETAILS", 137, 68);
                doc.setFont("roboto", "");
                doc.setFontSize(10);
                
                doc.text("Pay Frequency: "+this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Frequency__c, 137, 76);
                doc.text(this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c, 10, 76);
               // console.log(this.currentRecordPdf[0].staffData.Address__c.street);
                doc.text(this.currentRecordPdf[0].staffData.Address__c.street + ', ' +this.currentRecordPdf[0].staffData.Address__c.city, 10, 81);
                doc.text(this.currentRecordPdf[0].staffData.Address__c.state + ', ' + this.currentRecordPdf[0].staffData.Address__c.postalCode, 10, 86);
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 92, 185, 10,"FD");

                doc.text("Pay Period:", 12, 98);
                doc.text("Payment Date:", 72, 98);
    
                const oldDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_Start_Date__c;
                const finalDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_End_Date__c;
            
                const nextPayDate = this.currentRecordPdf[0].staffpayrollData.Pay_Date__c;

                // Split the date string at '-' char
                const arr = oldDate.split('-');
                const arr1 = finalDate.split('-');   
                if (nextPayDate != undefined || !nextPayDate == '' || !nextPayDate == null){
                    const arr2 = nextPayDate.split('-');
                    const nextPayDateFinal = arr2[2]+'/'+arr2[1]+'/'+arr2[0];
                    doc.text(nextPayDateFinal, 94, 98);
                }
                const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];
                const newfinalDate = arr1[2]+'/'+arr1[1]+'/'+arr1[0];
                

                doc.setFont("roboto", "bold");
                doc.setFontSize(10);
                doc.text(newDate + ' - ' + newfinalDate, 30, 98);
                this.subjectName = this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c +' Pay slip for the period ' + newDate +' to '+newfinalDate;
                this.startEndDate = ' Please find attached your pay slip for the pay period  ' + newDate +' to '+newfinalDate;
                this.orgName = this.currentRecordPdf[0].organization.Name;

                
                let dollarUSLocale = Intl.NumberFormat('en-US', { 
                                                        style: 'currency', 
                                                        currency: 'USD' 
                                                    });
                doc.setFont("roboto", "");
                doc.setFontSize(10);
                doc.text("Total Earnings:", 120, 98);
                doc.setFont("roboto", "bold");
                if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
                    doc.text("$0.00", 143, 98);
               }else{
                   doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 143, 98);
               }
               doc.setFont("roboto", "");
               doc.text("Net Pay:", 165, 98);  
               doc.setFont("roboto", "bold");
               if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
                   doc.text("$0.00", 179, 98);
               }else{
                   doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 179, 98);
               } 
               doc.text("THIS PAY", 142, 110);
               doc.line(10, 112, 195, 112);
               doc.text("YTD", 182, 110); 
               doc.text("SALARY & WAGES",10,120);
               doc.setFont("roboto", "bold");
              if(this.currentRecordPdf[0].staffpayrollData.Type_of_User__c =='ICT User'){ 
                doc.text("RATE",122,120);
                doc.setFont("roboto", "");
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffData.Working_Hours_Rate__c.toFixed(2)), 120, 126);
              } 
          
               doc.setFont("roboto", "");
               doc.setFontSize(10);
               doc.text("Ordinary Hours",10,126);
               doc.text(this.currentRecordPdf[0].staffpayrollData.Working_Hours__c.toFixed(2), 97, 126);
               
               if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
                doc.text("$0.00", 144, 126);
                }else{
               doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 126);
                }
    
                if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
               doc.text("$0.00", 179, 126);
                 }else{
               doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 126);
                 }
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 129, 185, 8,"FD");
                doc.setFont("roboto", "bold");
                doc.text("TOTAL",122,134);
                doc.setFontSize(10);
                if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
                    doc.text("$0.00", 144, 134);
                }else{
                        doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 134);
                }
            
                if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
                        doc.text("$0.00", 179, 134);
                 }else{
                        doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 134);
                }
                doc.text("Pre TAX Deductions",10,143);
                doc.setFont("roboto", "");
                doc.setFontSize(10);
                let positionOfRows=0;
                if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c !=undefined){
                    doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c, 10, 150);
                    positionOfRows=28;
                }
                if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c !=undefined){
                    doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c, 10, 157);
                    positionOfRows=20;
                }
                if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c !=undefined){
                    doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c, 10, 164);
                    positionOfRows=12;
                }
                if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c !=undefined){
                    doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c, 10, 171);
                    positionOfRows=4;

                }if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c !=undefined){
                    doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c, 10, 178);
                    positionOfRows=0;
                }
                
                if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c >0){
               
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c.toFixed(2)), 144, 150);
                }
                if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c>0){
                 
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c.toFixed(2)), 144, 157);
                }

                if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c>0){
               
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c.toFixed(2)), 144, 164);
                }

                if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c>0){
                 
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c.toFixed(2)), 144, 171);
                }
                if(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c>0){
                
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c.toFixed(2)), 144, 178);
                } 
                doc.setFont("roboto", "bold");  
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 180-parseInt(positionOfRows), 185, 8,"FD"); 
                doc.text("TOTAL",122,185-parseInt(positionOfRows));
                if(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c==undefined){
                    doc.text("$0.00", 144, 185-parseInt(positionOfRows));
               }else{
                   doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 185-parseInt(positionOfRows));
               }
               if(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c==undefined){
                doc.text("$0.00", 179, 185-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 185-parseInt(positionOfRows));
                }
                doc.setFont("roboto", "bold");
                doc.text("TAX",10,194-parseInt(positionOfRows));
                doc.text("PAYG",10,199-parseInt(positionOfRows));
                doc.setFont("roboto", "");
                if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                    doc.text("$0.00", 144, 199-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 199-parseInt(positionOfRows));
        
                } 
                if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 199-parseInt(positionOfRows));
                }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 199-parseInt(positionOfRows));
                }
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.setFont("roboto", "bold");
                doc.rect(10, 203-parseInt(positionOfRows), 185, 8,"FD"); 
                doc.text("TOTAL",122,208-parseInt(positionOfRows));
                if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                    doc.text("$0.00", 144, 208-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 208-parseInt(positionOfRows));
        
                } 
                if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 208-parseInt(positionOfRows));
                }else{
                     doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 208-parseInt(positionOfRows));
                }
        
                doc.text("SUPERANNUATION",10,220-parseInt(positionOfRows)); 
                if(this.currentRecordPdf[0].staffData.Superannuation_Number__c ==undefined){
                    doc.text("Guaranteed Superannuation",10,226-parseInt(positionOfRows));
                }else{
                    doc.text("Super Annuation | Account Number - "+this.currentRecordPdf[0].staffData.Superannuation_Number__c ,10,226-parseInt(positionOfRows));
                }
                doc.setFont("roboto", "");
                if(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c==undefined){
                    doc.text("$0.00", 144, 226-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c .toFixed(2)), 144, 226-parseInt(positionOfRows));
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 226-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 226-parseInt(positionOfRows));
                }
                if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c){
                    if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c =='Fixed'){  
                        doc.text("Voluntary Superannuation-Fixed",10,232-parseInt(positionOfRows));
                        doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 232-parseInt(positionOfRows));
                    }else{
                        doc.text("Voluntary Superannuation-Percentage ("+this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c+"%)",10,232-parseInt(positionOfRows)); 
                        //doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97,232-parseInt(positionOfRows) );
                        doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 232-parseInt(positionOfRows));
                    } 
                }else{
                    doc.text("Voluntary Superannuation",10,232-parseInt(positionOfRows));
                    doc.text("$0.00", 144, 232-parseInt(positionOfRows));
                   
                }
                if(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 232-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 232-parseInt(positionOfRows));
                }
                doc.setDrawColor(235,235,235);
                doc.setFillColor(235, 235, 235);
                doc.setFont("roboto", "bold");
                doc.rect(10, 235-parseInt(positionOfRows), 185, 8,"FD"); 
                doc.text("TOTAL",122,240-parseInt(positionOfRows));
                
                if(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c==undefined){
                    doc.text("$0.00", 144, 240-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c .toFixed(2)), 144, 240-parseInt(positionOfRows));
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c==undefined){
                    doc.text("$0.00", 179, 240-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 240-parseInt(positionOfRows));
                } 
                doc.setFont("roboto", "bold");
                doc.text("Post Tax Deductions ",10,248-parseInt(positionOfRows));
                doc.setFont("roboto", "");
                let posttaxRow=5
                if(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c !=undefined){
                    doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 253-parseInt(positionOfRows));
                    posttaxRow=0
                }
        
                if(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c==undefined)
                {   
                    doc.text("$0.00", 144, 253-parseInt(positionOfRows)-parseInt(posttaxRow));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 253-parseInt(positionOfRows)-parseInt(posttaxRow));
                }
                
                if(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c==undefined){
                    doc.text("$0.00", 179, 253-parseInt(positionOfRows)-parseInt(posttaxRow));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 253-parseInt(positionOfRows)-parseInt(posttaxRow));
                }
                doc.text("Reimbursements",10,258-parseInt(positionOfRows));
    
                if(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c==undefined)
                {
                    doc.text("$0.00", 144, 258-parseInt(positionOfRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 258-parseInt(positionOfRows));
                } 
                doc.line(10, 260-parseInt(positionOfRows), 195, 260-parseInt(positionOfRows));                
                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 260-parseInt(positionOfRows), 185, 8,"FD"); //265
                doc.text("Gross Salary",12,265-parseInt(positionOfRows));

                doc.setDrawColor(229,229,229);
                doc.setFillColor(229, 229, 229);
                doc.rect(10, 270-parseInt(positionOfRows), 185, 8,"FD");//273 maheswari code end
              
                //Gross Salary
                if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c==undefined)
                {
                    doc.text("$0.00", 144, 265-parseInt(positionOfRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 265-parseInt(positionOfRows));
                }        
                //Gross Salary YTD        
                if(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c==undefined)
                {
                    doc.text("$0.00", 179,265-parseInt(positionOfRows));
                }
                else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 179,265-parseInt(positionOfRows));
                }
                doc.text("NET SALARY",12,275-parseInt(positionOfRows));
                 //Net Salary
                if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
                    doc.text("$0.00", 144, 275-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 275-parseInt(positionOfRows));
                }
                                //Net YTD Salary
                if(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c==undefined){
                    doc.text("$0.00", 179, 275-parseInt(positionOfRows));
                }else{
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 179, 275-parseInt(positionOfRows));
                }            
            
            }else{
        // added for image and organization details
        doc.addImage(this.currentRecordPdf[0].bolbdata, "PNG", 10, 18, 70, 18);
        this.orgEmail = this.currentRecordPdf[0].organization.Email__c;
            
        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(134, 15, 60, 37,"FD");

        doc.setFont("roboto", "bold");
        doc.setFontSize(10);
        doc.text("PAID BY", 137, 23);

        doc.setFont("roboto", "");
        doc.setFontSize(10);
        doc.text(this.currentRecordPdf[0].organization.Name, 137, 30);
        doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.street + ', ' +this.currentRecordPdf[0].organization.Address_Latest__c.city, 137, 35);
        doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.state + ', ' + this.currentRecordPdf[0].organization.Address_Latest__c.postalCode, 137, 40);
        doc.text("ABN: "+this.currentRecordPdf[0].organization.ABN__c, 137, 45);

        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(134, 60, 60, 27,"FD");

        doc.setFont("roboto", "bold");
        doc.setFontSize(10);
        doc.text("EMPLOYMENT DETAILS", 137, 68);
        doc.setFont("roboto", "");
        doc.setFontSize(10);
        
        doc.text("Pay Frequency: "+this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Frequency__c, 137, 76);
        doc.text(this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c, 10, 76);
       // console.log(this.currentRecordPdf[0].staffData.Address__c.street);
        doc.text(this.currentRecordPdf[0].staffData.Address__c.street + ', ' +this.currentRecordPdf[0].staffData.Address__c.city, 10, 81);
        doc.text(this.currentRecordPdf[0].staffData.Address__c.state + ', ' + this.currentRecordPdf[0].staffData.Address__c.postalCode, 10, 86);

        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(10, 92, 185, 10,"FD");

        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(10, 129, 185, 8,"FD");

        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(10, 157, 185, 8,"FD");

        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(10, 189, 185, 8,"FD");

        //Maheswari start few line 
        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(10, 217, 185, 8,"FD");

        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(10, 228, 185, 8,"FD"); //225 maheswari code end

        doc.text("Pay Period:", 12, 98);
        doc.text("Payment Date:", 72, 98);
        doc.text("Total Earnings:", 120, 98);
        doc.text("Net Pay:", 165, 98);        
       
        // Date in YYYY-MM-DD format
        const oldDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_Start_Date__c;
        const finalDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_End_Date__c;
        //alert("PDF: " + this.currentRecordPdf[0].staffpayrollData.Pay_Date__c);
        const nextPayDate = this.currentRecordPdf[0].staffpayrollData.Pay_Date__c;

        // Split the date string at '-' char
        const arr = oldDate.split('-');
        const arr1 = finalDate.split('-');   
        if (nextPayDate != undefined || !nextPayDate == '' || !nextPayDate == null){
            const arr2 = nextPayDate.split('-');
            const nextPayDateFinal = arr2[2]+'/'+arr2[1]+'/'+arr2[0];
            doc.text(nextPayDateFinal, 94, 98);
        }
        const newDate = arr[2]+'/'+arr[1]+'/'+arr[0];
        const newfinalDate = arr1[2]+'/'+arr1[1]+'/'+arr1[0];
        

        doc.setFont("roboto", "bold");
        doc.setFontSize(10);
        doc.text(newDate + ' - ' + newfinalDate, 30, 98);

        //console.log("New Date and Final Date: "+newDate + ' - ' + newfinalDate);
        // Subject for email
        this.subjectName = this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c +' Pay slip for the period ' + newDate +' to '+newfinalDate;
        this.startEndDate = ' Please find attached your pay slip for the pay period ' + newDate +' to '+newfinalDate;
        this.orgName = this.currentRecordPdf[0].organization.Name;

        let dollarUSLocale = Intl.NumberFormat('en-US', { 
                                                style: 'currency', 
                                                currency: 'USD' 
                                            });
       // console.log('value is',dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c));
        if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
             doc.text("$0.00", 143, 98);
        }else{
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 143, 98);
        }

        if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
            doc.text("$0.00", 179, 98);
        }else{
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 179, 98);
        }      

        doc.line(10, 112, 195, 112);
        doc.line(10, 216, 195, 216);
        doc.setFont("roboto", "bold");
        doc.setFontSize(10);
        doc.text("THIS PAY", 142, 110);
        doc.text("YTD", 182, 110);

        doc.text("SALARY & WAGES",10,120);
        doc.text("TAX",10,150);
        doc.text("PAYG",10,154);
        doc.text("TOTAL",122,162);
        doc.text("TOTAL",122,194);
        
        doc.text("SUPERANNUATION",10,176);        

        doc.setFont("roboto", "");
        doc.setFontSize(10);
        doc.text("Pre TAX",10,143);
        doc.text("Ordinary Hours",10,126);
       
        if(this.currentRecordPdf[0].staffData.Superannuation_Number__c ==undefined){
            doc.text("Guaranteed Superannuation",10,181);
        }else{
            doc.text("Super Annuation | Account Number - "+this.currentRecordPdf[0].staffData.Superannuation_Number__c ,10,181);
        }
       // doc.text("Post TAX",10,201);
       if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c){
            if(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c =='Fixed'){  
                doc.text("Voluntary Superannuation-Fixed",10,186);
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 186);
            }else{
                doc.text("Voluntary Superannuation-Percentage ("+this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c+"%)",10,186); 
               // doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97, 186);
                doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 186);
            } 
        }else{
            doc.text("Voluntary Superannuation",10,186);
            doc.text("$0.00", 144, 186);
        }
        if(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c==undefined){
            doc.text("$0.00", 179, 186);
        }else{
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 186);
        }
        doc.setFont("roboto", "bold");
        doc.text("Post Tax Deductions ",10,201);
        doc.setFont("roboto", "");
        let posttaxRow=5
        if(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c !=undefined){
            doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 206);
            posttaxRow=0
        }
        doc.text("Reimbursements",10,211);
         if(this.currentRecordPdf[0].staffpayrollData.Type_of_User__c =='ICT User'){ 
            doc.setFont("roboto", "bold");
            doc.text("RATE",122,120);
            doc.setFont("roboto", "");
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffData.Working_Hours_Rate__c.toFixed(2)), 120, 126);
          } 
       
        doc.text("TOTAL",122,134);
        doc.setDrawColor(229,229,229);
        doc.setFillColor(229, 229, 229);
        doc.rect(212, 15, 60, 37,"FD");
        doc.text("Gross Salary",12,222);//222
        doc.text("NET SALARY",12,233); //230
       
        doc.text(this.currentRecordPdf[0].staffpayrollData.Working_Hours__c.toFixed(2), 97, 126);
      
        //Net Salary
        if(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c==undefined){
            doc.text("$0.00", 144, 233); //230
        }else{
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 233); //230
        }

        //Net YTD Salary
        if(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c==undefined){
            doc.text("$0.00", 177, 233); //230
        }else{
            doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 177, 233); //230
        }


       if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
            doc.text("$0.00", 144, 126);
       }else{
           doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 126);
       }

       if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
           doc.text("$0.00", 179, 126);
       }else{
           doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 126);
       }

         if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
            doc.text("$0.00", 143, 154);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 143, 154);

            } 
            if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                doc.text("$0.00", 179, 154);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 154);
            }

            if(this.currentRecordPdf[0].staffpayrollData.Tax__c==undefined){
                doc.text("$0.00", 143, 162);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 143, 162);
            }
    
            if(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c==undefined){
                doc.text("$0.00", 179, 162);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 162);
            }

            if(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c==undefined){
                doc.text("$0.00", 144, 144);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 144);
            }
    
            if(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c==undefined){
                doc.text("$0.00", 179, 144);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 144);
            }   
            
            if(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c==undefined)
            {
                doc.text("$0.00", 144, 206-parseInt(posttaxRow));
            }
            else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 206-parseInt(posttaxRow));
            }
        
            if(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c==undefined){
                doc.text("$0.00", 179, 206-parseInt(posttaxRow));
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 206-parseInt(posttaxRow));
            }
    
            //Gross Salary
            if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c==undefined)
            {
                doc.text("$0.00", 144, 222);
            }
            else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 222);
            }
           
            if(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c==undefined)
            {
                doc.text("$0.00", 144, 211);
            }
            else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 211);
            }
    
            //Gross Salary YTD        
            if(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c==undefined)
            {
                doc.text("$0.00", 177,222);
            }
            else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 177,222);
            }         
        
    
            if(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c==undefined){
                doc.text("$0.00", 144, 179);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c .toFixed(2)), 144, 179);
            }
    
            if(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c==undefined){
                doc.text("$0.00", 179, 179);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 179);
            }
    
           doc.setFont("roboto", "bold");
           doc.setFontSize(10);
    
           if(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c==undefined){
            doc.text("$0.00", 144, 134);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 134);
            }
    
            if(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c==undefined){
                doc.text("$0.00", 179, 134);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 134);
            }
    
            if(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c==undefined){
                doc.text("$0.00", 144, 194);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c .toFixed(2)), 144, 194);
            }
            if(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c==undefined){
                doc.text("$0.00", 179, 194);
            }else{
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 194);
            } 
        }
       /*  var paySlipName = this.currentRecordPdf[0].staffpayrollData.Name; */
       var paySlipName = this.currentRecordPdf[0].staffpayrollData.Name;
        var docName=paySlipName+'.pdf';
       // console.log('public holiday');
        this.base64string = btoa(doc.output());
       // console.log('public staffEmail',this.currentRecordPdf[0].staffpayrollData.Email_Address__c);
        this.staffEmail = this.currentRecordPdf[0].staffData.Email_Address__c;
        //doc.save(paySlipName);        
        uploadFile({base64:JSON.stringify(this.base64string), filename:docName, recordId: this.currentRecordPdf[0].staffpayrollData.Id, obj:'audit'}).then(result=>{
           // console.log('data'); 
            const event = new ShowToastEvent({
                title: '',
                message: 'Pay Slip '+docName+ ' generated successfully',
                variant: 'Success',
                mode: 'dismissable'
            });
            this.dispatchEvent(event);  
           
        }).catch(error =>{
            console.error('Received error from server: ', error);
        });
       
        this.handleClick();
    }
    handleClick() {
       // console.log('data',JSON.stringify(this.base64string) );
        emailAttach({ base64: JSON.stringify(this.base64string) ,staffEmail:this.staffEmail,subjectName:this.subjectName,startEndDate:this.startEndDate,orgEmail:this.orgEmail,orgName:this.orgName}).then(result => {
           // console.log('data');
        });
    }

    @track csvOrgBmsID;
    @track csvOrgABNNum;
    @track csvOrgBranchCode;
    @track csvOrgName;
    @track csvOrgContactName;
    @track csvOrgPhone;
    @track csvOrgPostalCode;
    @track csvOrgEmail;
    @track csvOrgCountryCode;
    @track csvHeaders = ['Payee TFN Number','Payee ABN Number', 'Payee Staff ID','Payee First Name','Payee Last Name','Payee Other Name','Payee Date of Birth','Current Payee Tax','Current Payee Gross Salary','Payee Prvious Payroll ID','Payee Street','Payee City','Payee Postal Code','Payee State Code','Payee Country Code','Payee Email Address', 'Payee Contact Number','Payee Emp Start Date','Payee Emp Exit Date', 'Payee Emploement Basis Code','Payee Exit Reason Code','Payee Tax Treatment Code','Payee Tax Offset Amount','Payee Period Start Date','Payee Period End Date','Payee Final Event Indicator','Payee Income Stream Type Code' , 'Payee Country Code','Payee Current Tax YTD','Payee Foreign Tax Paid Amount','Payee Exempt Foreign Income Amount', 'Payee Current Taxable Gross salary YTD','Payee Paid Leaves','Payee Allowances','Payee Over Time Amount','Payee Bonuses And Commissions Amount', 'Payee Directors Fee Amount', 'Payee Salary Sacrifices','Payee Lump Sum Amount', 'Payee Super Entitlement Type Code','Payee Super Entitlement Amount','Payee Reportabale Fringe Amount Benifits' ]; // 'Payer BMS ID', 'Payer ABN', 'Payer Branch Code', 'Payer Name', 'Payer Contact Name','Payer Email','Payer Phone','Payer Postal Code',
    @track csvPayerHeaders = ['BMS Identifier','Payer Australian Business Number','Payer Withholding Payer Number','Payer Branch Code','Previous BMS Identifier','Payer Organisation Name','Payer Contact Name','Payer E-mail Address','Payer Business Hours Phone Number','Payer Postcode','Payer Country Code','Pay/Update Date','Payee Record Count','Run Date/Time Stamp','Submission ID','Full File Replacement Indicator','Payer Total PAYGW Amount','Payer Total Gross Payments Amount','Child Support Total Garnishee Amount','Child Support Total Deductions Amount','Payer Declarer Identifier','Payer Declaration Date (UTC)','Payer Declaration Acceptance Indicator'];
    
    handleExportCSV(event)
    {
        this.showCsvExtract=true;
        //alert("Export to CSV");
        this.paysetId = event.currentTarget.dataset.id;
        accpetedStaffPayroll({ payrollId: this.paysetId }).then(response => { 
            this.stpCSVTable= response; 
            this.csvOrgBmsID=response[0].Org_BMSId__c;
            this.csvOrgABNNum=response[0].Org_ABN__c;
            this.csvOrgBranchCode=response[0].Staff__r.Facility__r.Organisation__r.Branch_code__c;
            this.csvOrgName=response[0].Org_Name__c;
            this.csvOrgContactName=response[0].Staff__r.Facility__r.Organisation__r.Contact_Name__c;
            this.csvOrgEmail=response[0].orgEmail__c;
            this.csvOrgPhone=response[0].Org_Phone__c;
            this.csvOrgPostalCode=response[0].OrgPostalCode__c;
            this.csvOrgCountryCode = 'AU';
        });      
    }
 
    handlecloseCsv(){
        this.showCsvExtract=false;
    }

    handleDownloadCSV(){
        let doc = '<table>'; 
        doc += '<style>';
        doc += 'table, th, td {';
        doc += '    border: 5px solid black;';
        doc += '    border-collapse: collapse;';
        doc += '}';
        doc += '</style>';
        doc += '<tr >';
        doc += '<th bgcolor="1a4876" colspan="42" style="font-size: 10; font-family: Calibri;">' + '<h2>' + '<font color="white" style="font-size: 17; font-family: Calibri;">' + 'File STP Extract' + '</font>' + '</h2>' + '</th>';
        doc += '</tr>';

        doc += '<tr>';
        this.csvPayerHeaders.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';
        doc += '<tr>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + this.csvOrgBmsID+ '</td>';
            if(this.csvOrgABNNum){
                doc += '<td style="font-size: 17px; font-family: Calibri;text-align:right;">' + this.csvOrgABNNum + '</td>';
            }else{
                doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'No Data' + '</td>';
            }
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + this.csvOrgBranchCode + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + this.csvOrgName + '</td>'; 
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + this.csvOrgContactName + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + this.csvOrgEmail + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + this.csvOrgPhone + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + this.csvOrgPostalCode + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + this.csvOrgCountryCode + '</td>';           
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            let PayerTotalPAYGWAmount=0;
            let PayerTotalGrossPaymentsAmount=0;
            this.stpCSVTable.forEach(fieldsData => {
                PayerTotalPAYGWAmount=PayerTotalPAYGWAmount+fieldsData.Tax__c; ////// Last Tax YTD + Current
                PayerTotalGrossPaymentsAmount=PayerTotalGrossPaymentsAmount+fieldsData.Gross_Salary_Display__c;
            });
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + PayerTotalPAYGWAmount + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + PayerTotalGrossPaymentsAmount + '</td>';            
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
        doc += '</tr>';

        doc += '<tr><td colspan="4"></td></tr>';

        doc += '<tr>';
        this.csvHeaders.forEach(header => {
            doc += '<th bgcolor="c6c6c6" style="font-size: 17; font-family: Calibri;">' + header + '</th>'
        });
        doc += '</tr>';
        this.stpCSVTable.forEach(fieldsData => {
            doc += '<tr>';          

            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.TFN_number__c+ '</td>';
            if(fieldsData.Staff__r.ABN_Number__c){
                doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +  fieldsData.Staff__r.ABN_Number__c + '</td>';
            }else{
                doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + 'No Data' + '</td>';
            }
            //doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +  fieldsData.Staff__r.ABN_Number__c+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; ">' +   fieldsData.Staff__c+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Name + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' +  fieldsData.Staff__r.Last_Name__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' +  'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Date_Of_Birth__c + '</td>';            
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">'  + fieldsData.Tax__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">'  + fieldsData.Gross_Salary_Display__c + '</td>';            
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' +  'NULL'+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Address__Street__s+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' +  fieldsData.Staff__r.Address__City__s + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +   fieldsData.Staff__r.Address__PostalCode__s+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' +   fieldsData.Staff__r.Address__StateCode__s + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' +  'AU' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Email_Address__c+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +  fieldsData.Staff__r.Contact_Number__c+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Emp_Start_Date__c + '</td>';

            if(fieldsData.Staff__r.Emp_exit_date__c){
                doc += '<td style="font-size: 17px; font-family: Calibri;">' +  fieldsData.Staff__r.Emp_exit_date__c + '</td>';
            }else{
                doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'No Data' + '</td>';
            }

           // doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Emp_exit_date__c+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'F'+ '</td>';
            if(fieldsData.Staff__r.Exit_Reason_Code__c){
                doc += '<td style="font-size: 17px; font-family: Calibri;">' +   fieldsData.Staff__r.Exit_Reason_Code__c+ '</td>';
            } else {
                doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'No Data' + '</td>';
            }
            doc += '<td style="font-size: 17px; font-family: Calibri;">' +  'RDXXXX'+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' +  'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Payroll_Setting__r.Period_Start_Date__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' +  fieldsData.Payroll_Setting__r.Period_End_Date__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'false' + '</td>';

            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'SAW'+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +   fieldsData.Current_Tax_YTD__c+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' +   'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' +  'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + fieldsData.Current_Taxble_Gross_Salary_YTD__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' +  'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';

            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' +'NULL'+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' +  'NULL'+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' +  'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL'+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'L'+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + fieldsData.Super_And_Voluntary_Supper_Annuation__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';

            doc += '</tr>';
        });
        doc += '</table>';
        
        var element = 'data:text/csv;charset=utf-8,' + encodeURIComponent(doc);
        let downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        // use .csv or .xls as extension on below line if you want to export data
        downloadElement.download = 'STPEXTRACT.xls';
        document.body.appendChild(downloadElement);
        downloadElement.click();
    }
    @track searchGroupName;
    @track payrollStartDate;
    @track payrollEndDate;
    @track payrollStatus;
    handleSearch(event){
        var sname = event.target.name;        

        if(event.target.name == 'SearchPayroll'){
            this.searchGroupName = event.detail.value;
           // console.log('Payroll GroupName>>>'+this.searchGroupName);
        }
        if(event.target.name == 'status'){
            this.payrollStatus = event.detail.value;
            
        }
        //console.log('Payroll status>>>'+this.payrollStatus);
        fetchPayrollStaff1({payrollGroupName: this.searchGroupName, Status: this.payrollStatus}).then(response=> {
            this.payrunSetting = response;
           // console.log('Response>>>'+JSON.stringify(response));
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            let tempConList = [];
            let tempConListExceptDraft = [];
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                // tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
               if(record.Staff_Payroll_Settings__r){
                let childPayruns=record.Staff_Payroll_Settings__r;
                 // console.log('childs Payruns '+JSON.stringify(childPayruns));
                  childPayruns.forEach(rec=>{
                      tempConRec.paymentDate=new Date(rec.Pay_Date__c).toLocaleDateString('en-GB');
                  });
               }

                var date1 = new Date(tempConRec.Next_Pay_Date__c);
                var fdate = date1.toLocaleDateString("en-US", options);
                if (tempConRec.Frequency__c == 'Weekly') {
                    tempConRec.period = 'Week ending' + ' ' + fdate;
                }
                if (tempConRec.Frequency__c == 'Monthly') {
                    tempConRec.period = fdate;
                }
                if (tempConRec.Status__c == 'STP Filed') {
                    // Need to add ICON for STP Filed related Groups in Payroll History
                    tempConRec.StatusChecking = true;
                }
                else{
                    tempConRec.StatusChecking = false;
                }
                if (tempConRec.Status__c == 'Draft') {                    
                    tempConList.push(tempConRec);
                }
                if (tempConRec.Status__c != undefined && tempConRec.Status__c != 'Draft') {
                    tempConListExceptDraft.push(tempConRec);
                }
            })
            this.records = tempConListExceptDraft;            
            this.totalRecords = this.records.length; // update total records count                 
                this.pageSize = 10;
                if (this.totalRecords > 10) {
                    this.visible = true;
                }
                //this.payrunSetting=tempconList;
            this.paginationHelper();
        })
    }

    fetchPayrun(){
        fetchPayrollStaff1({payrollGroupName: this.searchGroupName, Status: this.payrollStatus}).then(response=> {
            this.payrunSetting = response;
           // console.log('Response>>>'+JSON.stringify(response));
            var options = { year: 'numeric', month: 'long', day: 'numeric' };
            let tempConList = [];
            let tempConListExceptDraft = [];
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                // tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
               if(record.Staff_Payroll_Settings__r){
                let childPayruns=record.Staff_Payroll_Settings__r;
                  //console.log('childs Payruns '+JSON.stringify(childPayruns));
                  childPayruns.forEach(rec=>{
                      tempConRec.paymentDate=new Date(rec.Pay_Date__c).toLocaleDateString('en-GB');
                  });
               }

                var date1 = new Date(tempConRec.Next_Pay_Date__c);
                var fdate = date1.toLocaleDateString("en-US", options);
                if (tempConRec.Frequency__c == 'Weekly') {
                    tempConRec.period = 'Week ending' + ' ' + fdate;
                }
                if (tempConRec.Frequency__c == 'Monthly') {
                    tempConRec.period = fdate;
                }
                if (tempConRec.Status__c == 'STP Filed') {
                    // Need to add ICON for STP Filed related Groups in Payroll History
                    tempConRec.StatusChecking = true;
                }
                else{
                    tempConRec.StatusChecking = false;
                }
                if (tempConRec.Status__c == 'Draft') {                    
                    tempConList.push(tempConRec);
                }
                if (tempConRec.Status__c != undefined && tempConRec.Status__c != 'Draft') {
                    tempConListExceptDraft.push(tempConRec);
                }
            })
            this.records = tempConListExceptDraft;
            //this.payrunList = tempConListExceptDraft;
            this.payrun = tempConList;
           // console.log('  this.payrun >>',  JSON.stringify(this.payrun));
            this.totalRecords = this.records.length; // update total records count                 
                this.pageSize = 10;
                if (this.totalRecords > 10) {
                    this.visible = true;
                }
                //this.payrunSetting=tempconList;
            this.paginationHelper();
        })
    }

    @track isModalOpen = false;
    @track currentUrl;

    handleView(event) {
        event.preventDefault(); 
        const url = event.currentTarget.dataset.url;
        this.currentUrl = url;
       // console.log('file url  '+ this.currentUrl);  
        this.isModalOpen = true;
        this.isopenPaysettings=false;
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileName(url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }   
    @track showSignatureTemplate=true;    
}