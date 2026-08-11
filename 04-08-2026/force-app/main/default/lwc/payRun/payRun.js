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
import EditAccessForPayroll from '@salesforce/schema/User.Allow_Payroll_Edit__c';
import submitPayload from '@salesforce/apex/GovReportsAPICallout.submitPayload';
import updateGovReportStatus from '@salesforce/apex/PayRunHandler.updateGovReportStatus';
import fetchPayrollStaff1 from '@salesforce/apex/PayRunHandler.fetchPayrollStaff1';
import getCustomMetaData from '@salesforce/apex/PayRunHandler.getCustomMetaData';
import getPayHistrory from '@salesforce/apex/PayrollSettingSchedular.getPayHistrory';
import saveSTPResponse from '@salesforce/apex/PayRunHandler.saveSTPResponse';
import getSTPActivityLog from '@salesforce/apex/PayRunHandler.getSTPActivityLog';
import processSuperannuation from '@salesforce/apex/OZEDIController.processSuperannuation';
import checkContributionStatus from '@salesforce/apex/OZEDIController.checkContributionStatus';
import sendContribution from '@salesforce/apex/OZEDIController.sendContribution';
import getValidationSummary from '@salesforce/apex/OZEDIController.getValidationSummary';
import getValidationLogs from '@salesforce/apex/OZEDIController.getValidationLogs';
import orgDetails from "@salesforce/apex/OrgDetails.orgDetails";
import retrySpecificFailedContributions from '@salesforce/apex/OZEDIController.retrySpecificFailedContributions';
import generateABAFile from '@salesforce/apex/OZEDIController.generateABAFile';
import processPayrunPayment from '@salesforce/apex/OZEDIController.processPayrunPayment';
import getValidationLogsFromPayrun from '@salesforce/apex/PayrunSettingHandler.getValidationLogs';



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
    @track staffPayIds = [];
    @track chpaymentDate;
    @track blpayDate = false;
    STPloading = My_Resource + '/myResource/images/STPloading.gif';
    @track records = []; //All records available in the data table    
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track visible = false;
    @track payrunEdit = false;
    @track isStatus = false;
    @track ispayslip = false;
    @track isSubmitbtn = false;
    @track showCsvExtract = false;
    @track stpCSVTable = [];
    @track issavedpayrun = false;
    recruitment = My_Resource + '/myResource/images/payroll1.svg';

    @track datain = {
        PayEventPayer: null,
        Intermediary: null,
        PayEventPayees: [],
        SoftwareID: ""
    };
    @track currentUser;
    @track usererror;
    @track StaffPayrollJasonFormat = {};
    @track firstPretax;
    @track secondPretax;
    @track ThirdPretax;
    @track fourthPretax;
    @track fifthPretax;
    @track totalPretaxvalue;
    @track noRecordsFlag = false;
    @track paySettingsNextPayJson = {};
    @track disableYTD = false;
    // Add these with your other @track properties
    @track showMoreDetailsTemplate = false;
    @track showFullResponse = false;
    @track selectedFailedLogs = [];
    @track showRetryButton = false;
    @track moreDetailsData = {
        type: 'Superannuation',
        refId: 'N/A',
        status: 'Info',
        isSuccess: false,
        isFailed: false,
        isProgress: false,
        isInfo: true,
        date: 'N/A',
        declarationDate: 'N/A',
        response: 'No response available'
    };

    // Validation Logs Pagination Properties
    @track validationLogsList = [];
    @track allValidationLogs = [];
    @track validationTotalRecords = 0;
    @track validationPageSize = 5;
    @track validationTotalPages = 0;
    @track validationPageNumber = 1;
    @track showValidationPagination = false;
    @track validationPageSizeOptions = [5, 10, 25, 50];

    // Superannuation Properties
    showProgress = false;
    statusMessage = '';
    currentUploadUuid = '';
    validationSummary = null;
    showValidationErrorModal = false;
    validationErrorModalMessage = '';
    @track showPayEmployeesPopup = false;
    @track paymentDate = '';
    @track selectedBankAccount = '';
    @track bankAccountOptions = [];
    @track paymentReference = '';
    @track defaultPaymentMethod = false;
    @track totalEmployeesForPayment = 0;
    @track totalPaymentAmount = 0;
    @track selectedPaymentMethod = 'ABA';
    @track superannuationButtonDisabled = false;
    @track payButtonDisabled = false;
    @track processPaymentButtonDisabled = false;
    @track validationErrorModalMessageHtml = '';

    @wire(getRecord, {
        recordId: Id,
        fields: [UserNameFld, EditAccessForPayroll]
    })
    userDetails({
        error,
        data
    }) {
        if (data) {
            this.currentUser = data.fields.Name.value;
            let editAccessForPayroll = data.fields.Allow_Payroll_Edit__c.value;
            console.log('editAccessForPayroll ===> ' + data.fields.Allow_Payroll_Edit__c.value);
            this.disableYTD = !editAccessForPayroll;
            console.log('editAccessForPayroll ===> ' + this.disableYTD);
        } else if (error) {
            this.usererror = error;
        }
    }

    activeSections = ['WorkingHours', 'StaffDetails', 'PreTaxDetails', 'PostTaxDetails', 'reimbursements', 'superAnnuation', 'PreviousEmployeeYTDDetails'];

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
        return [{
                label: 'Draft',
                value: 'Draft'
            },
            {
                label: 'Submitted',
                value: 'Submitted'
            },
            {
                label: 'STP Filed',
                value: 'STP Filed'
            },
            {
                label: 'Finalised',
                value: 'Finalised'
            },
            {
                label: 'Delete',
                value: 'Delete'
            },
        ];
    }

    @track FinalisedYtdFlag = false;
    @track NormalYtdFlag = true;
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
    @track facilityPreferredName;
    @track participantPreferredName;

    handleEditPayStaff(event) {
        this.payrunEdit = true;
        /*  alert("handleEditPayStaff"); */
        let staffId = event.currentTarget.dataset.staffid;
        console.log(' consol ' + event.currentTarget.dataset.typeofuser);
        // this.chpaymentDate='';
        //alert("getting staff ID: " + staffId);
        /*  if(event.currentTarget.dataset.typeofuser=='NDIS User'){
             this.isDisbaleWorkingHours=true;
          }else{
              this.isDisbaleWorkingHours=false
          }  */

        this.staffpaysetId = event.currentTarget.dataset.id;
        // console.log('staffPayroll jason format'+JSON.stringify(this.StaffPayrollJasonFormat));
        this.totalPretaxvalue = this.StaffPayrollJasonFormat[this.staffpaysetId]["TotalPreTax"]
        this.firstPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxOne"];
        this.secondPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxTwo"];
        this.ThirdPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxThree"];
        this.fourthPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxFour"];
        this.fifthPretax = this.StaffPayrollJasonFormat[this.staffpaysetId]["preTaxFive"];
        //this.totalPretaxvalue=parseFloat(this.firstPretax)+parseFloat(this.secondPretax)+parseFloat(this.ThirdPretax)+parseFloat(this.fourthPretax)+parseFloat(this.fifthPretax);

        let voluntaryContribution = this.StaffPayrollJasonFormat[this.staffpaysetId]["voluntaryContribution"];
        this.voluntaryContributionCureencyVal = this.StaffPayrollJasonFormat[this.staffpaysetId]["ContributionCurrency"];
        this.voluntaryContributionPercentVal = this.StaffPayrollJasonFormat[this.staffpaysetId]["ContributionPercent"];
        if (voluntaryContribution == 'Fixed') {
            this.VoluntaryContributionCurrency = true;
            this.VoluntaryContributionPercent = false;
        } else {
            this.VoluntaryContributionPercent = true;
            this.VoluntaryContributionCurrency = false;
        }

        this.postTaxlabelValue = this.StaffPayrollJasonFormat[this.staffpaysetId]["postTax"];

        this.reimburementsValue = this.StaffPayrollJasonFormat[this.staffpaysetId]["reimb"];
        this.pretaxOneChange = this.firstPretax;
        this.pretaxTwoChange = this.secondPretax;
        this.pretaxThreeChange = this.ThirdPretax;
        this.pretaxFourChange = this.fourthPretax;
        this.pretaxFiveChange = this.fifthPretax;
        if (this.firstPretax == 0) {
            this.firstPretax = false;
        }
        if (this.secondPretax == 0) {
            this.secondPretax = false;
        }
        if (this.ThirdPretax == 0) {
            this.ThirdPretax = false;
        }
        if (this.fourthPretax == 0) {
            this.fourthPretax = false;
        }
        if (this.fifthPretax == 0) {
            this.fifthPretax = false;
        }

        let localLastTaxYTD = 0;
        let localLastGrossSalaryYTD = 0;
        let localLastSuperannuationYTD = 0;
        let localLastPreTaxYTD = 0;
        let localLastPostTaxYTD = 0;
        let localLastNetPaySalaryYTD = 0;
        let localLastSalaryWagesYTD = 0;
        let localLastVoluntarySuperAnnuationYTD = 0;
        let localLastSuperAndVoluntaryAnnuationYTD = 0;
        console.log('this.chpaymentDate  IN  BEFORE  IF this.blhdfinalized ==>' + this.chpaymentDate);
        // checking Previous month equal to June month for the process payment Date
        if (this.blhdfinalized == true) {
            console.log('this.chpaymentDate  IN  IF this.blhdfinalized ==>' + this.chpaymentDate);
            // const staffLastYtdList = JSON.parse(this.transformedJuneData);
            // console.log(' in finalised button');
            // console.log('stafff Id '+staffId);
            this.FinalisedYtdFlag = true;
            this.NormalYtdFlag = false;
            let firstElement = this.transformedJuneData[staffId][0];
            /*  console.log('Staff june data in edit '+JSON.stringify(firstElement));
             alert("True"); */
            localLastTaxYTD = firstElement.Parent.Current_Tax_YTD__c;
            localLastGrossSalaryYTD = firstElement.Parent.Current_Taxble_Gross_Salary_YTD__c;
            localLastSuperannuationYTD = firstElement.Parent.Current_Superannuation_YTD__c;
            localLastPreTaxYTD = firstElement.Parent.Current_Pre_Tax_YTD__c;
            localLastPostTaxYTD = firstElement.Parent.Current_Post_Tax_YTD__c;
            localLastNetPaySalaryYTD = firstElement.Parent.Current_Net_Pay_Salary_YTD__c;
            localLastSalaryWagesYTD = firstElement.Parent.Current_Salary_Wages_YTD__c;
            localLastVoluntarySuperAnnuationYTD = firstElement.Parent.Current_Voluntary_Superannuation_YTD__c;
            localLastSuperAndVoluntaryAnnuationYTD = firstElement.Parent.Current_Super_and_Voluntaryannuation_YTD__c;

            console.log('local last voluntary super ' + localLastVoluntarySuperAnnuationYTD);
            console.log(' local last super and voluntary  ' + localLastVoluntarySuperAnnuationYTD);
        } else {
            let staffTaxYTdsJSon = {};
            console.log('this.chpaymentDate BEFORE HISTORY ==>' + this.chpaymentDate);
            getPayHistrory({
                Paymentdate: this.chpaymentDate,
                groupName: this.groupName
            }).then(response => {
                // console.log('  year data 1' + JSON.stringify(response)); 
                let financialyearData = [];
                response.forEach(rec => {
                    const payDate = new Date(rec.Parent.Pay_Date__c);
                    const month = payDate.getMonth() + 1; // getMonth() returns 0-based month, adding 1 for 1-based month
                    if (month >= 7) {
                        financialyearData.push(rec);
                    }
                });

                if (financialyearData.length > 0) {
                    staffTaxYTdsJSon = this.transformData(financialyearData);
                    console.log(' get history data ' + JSON.stringify(staffTaxYTdsJSon));
                    // console.log('count of year transactions '+staffTaxYTdsJSon[staffId].length);
                    if (staffTaxYTdsJSon[staffId].length <= 1) {
                        if (this.editHistoryPayroll == true) {
                            this.editHistoryPayroll = false;
                            const payDateon = new Date(this.chpaymentDate);
                            const monthOn = payDateon.getMonth() + 1;
                            if (monthOn < 7) {
                                this.NormalYtdFlag = true;
                                this.FinalisedYtdFlag = false;
                            }
                        } else {
                            console.log(' if 1');
                            this.FinalisedYtdFlag = true;
                            this.NormalYtdFlag = false;
                            localLastTaxYTD = 0;
                            localLastGrossSalaryYTD = 0;
                            localLastSuperannuationYTD = 0;
                            localLastPreTaxYTD = 0;
                            localLastPostTaxYTD = 0;
                            localLastNetPaySalaryYTD = 0;
                            localLastSalaryWagesYTD = 0;
                            localLastVoluntarySuperAnnuationYTD = 0;
                            localLastSuperAndVoluntaryAnnuationYTD = 0;
                        }

                    } else {
                        console.log(' else 1');
                        this.NormalYtdFlag = true;
                        this.FinalisedYtdFlag = false;
                    }
                } else {
                    const payDateon = new Date(this.chpaymentDate);
                    const monthOn = payDateon.getMonth() + 1;
                    if (monthOn == 7) {
                        // console.log(' if 2');
                        this.FinalisedYtdFlag = true;
                        this.NormalYtdFlag = false;
                        localLastTaxYTD = 0;
                        localLastGrossSalaryYTD = 0;
                        localLastSuperannuationYTD = 0;
                        localLastPreTaxYTD = 0;
                        localLastPostTaxYTD = 0;
                        localLastNetPaySalaryYTD = 0;
                        localLastSalaryWagesYTD = 0;
                        localLastVoluntarySuperAnnuationYTD = 0;
                        localLastSuperAndVoluntaryAnnuationYTD = 0;
                    } else {
                        // console.log(' else 2');
                        this.NormalYtdFlag = true;
                        this.FinalisedYtdFlag = false;
                    }
                }
                console.log('this.chpaymentDate AFTER  HISTORY  ==>' + this.chpaymentDate);

            }).catch(error => {
                // console.log('custom meta error ' + JSON.stringify(error));
            });
        }

        this.LastTaxYTD = localLastTaxYTD;
        this.LastGrossSalaryYTD = localLastGrossSalaryYTD;
        this.LastSuperannuationYTD = localLastSuperannuationYTD;
        this.LastPreTaxYTD = localLastPreTaxYTD;
        this.LastPostTaxYTD = localLastPostTaxYTD;
        this.LastNetPaySalaryYTD = localLastNetPaySalaryYTD;
        this.LastSalaryWagesYTD = localLastSalaryWagesYTD;
        this.LastVoluntarySuperAnnuationYtd = localLastVoluntarySuperAnnuationYTD;
        this.LastSuperAndVoluntarySuperAnnuationYtd = localLastSuperAndVoluntaryAnnuationYTD;

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
    @track VoluntaryContributionCurrency = false;
    @track VoluntaryContributionPercent = false;
    @track voluntaryContributionCureencyVal = 0;
    @track voluntaryContributionPercentVal = 0;
    handlePreTaxChange(event) {

        if (event.target.name == 'PreTaxonevalue') {
            this.pretaxOneChange = event.target.value;

        }
        if (event.target.name == 'PreTaxTwovalue') {
            this.pretaxTwoChange = event.target.value;

        }
        if (event.target.name == 'pretaxthreevalue') {
            this.pretaxThreeChange = event.target.value;

        }
        if (event.target.name == 'pretaxFourvalue') {
            this.pretaxFourChange = event.target.value;

        }
        if (event.target.name == 'pretaxFivevalue') {
            this.pretaxFiveChange = event.target.value;

        }
        if (this.pretaxOneChange == '' || this.pretaxOneChange == undefined || this.pretaxOneChange == null) {
            this.pretaxOneChange = 0;
        }
        if (this.pretaxTwoChange == '' || this.pretaxTwoChange == undefined || this.pretaxTwoChange == null) {
            this.pretaxTwoChange = 0;
        }
        if (this.pretaxThreeChange == '' || this.pretaxThreeChange == undefined || this.pretaxThreeChange == null) {
            this.pretaxThreeChange = 0;
        }
        if (this.pretaxFourChange == '' || this.pretaxFourChange == undefined || this.pretaxFourChange == null) {
            this.pretaxFourChange = 0;
        }
        if (this.pretaxFiveChange == '' || this.pretaxFiveChange == undefined || this.pretaxFiveChange == null) {
            this.pretaxFiveChange = 0;
        }


        this.totalPretaxvalue = parseFloat(this.pretaxOneChange) + parseFloat(this.pretaxTwoChange) + parseFloat(this.pretaxThreeChange) + parseFloat(this.pretaxFourChange) + parseFloat(this.pretaxFiveChange);

        if (event.target.name == 'totalPreTax') {
            this.totalPretaxvalue = event.target.value;
        }
        if (this.totalPretaxvalue == '' || this.totalPretaxvalue == undefined || this.totalPretaxvalue == null) {
            this.totalPretaxvalue = 0;
            // console.log('total pre tax '+this.totalPretaxvalue);
        }

    }
    handlePostTaxhandler(event) {
        if (event.target.name == 'posttax') {
            this.postTaxlabelValue = event.target.value;
        }
        if (this.postTaxlabelValue == '' || this.postTaxlabelValue == undefined || this.postTaxlabelValue == null) {
            this.postTaxlabelValue = 0;
        }
    }
    handleReimbureseMents(event) {
        if (event.target.name == 'reimbursements') {
            this.reimburementsValue = event.target.value;
        }
        if (this.reimburementsValue == '' || this.reimburementsValue == undefined || this.reimburementsValue == null) {
            this.reimburementsValue = 0;
        }

    }

    VoluntaryChange(event) {
        if (event.target.value == 'Fixed') {
            this.VoluntaryContributionCurrency = true;
            this.VoluntaryContributionPercent = false;
        }
        if (event.target.value == 'Percentage') {
            this.VoluntaryContributionPercent = true;
            this.VoluntaryContributionCurrency = false;
        }
        if (event.target.name == 'contributionFixed') {
            this.voluntaryContributionCureencyVal = event.target.value;
        }
        if (event.target.name == 'contributionPercent') {
            this.voluntaryContributionPercentVal = event.target.value;
        }

    }

    HandleSubmitStaffPayRoll(event) {
        const fields = event.detail.fields;

        if (this.totalPretaxvalue == '' || this.totalPretaxvalue == undefined || this.totalPretaxvalue == null) {
            this.totalPretaxvalue = 0;

        }
        if (this.postTaxlabelValue == '' || this.postTaxlabelValue == undefined || this.postTaxlabelValue == null) {
            this.postTaxlabelValue = 0;
        }
        if (this.reimburementsValue == '' || this.reimburementsValue == undefined || this.reimburementsValue == null) {
            this.reimburementsValue = 0;
        }
        fields.Pre_tax_values__c = this.totalPretaxvalue;
        fields.Post_tax_values__c = this.postTaxlabelValue;
        fields.Reimbursements__c = this.reimburementsValue;

        if (this.voluntaryContributionCureencyVal == undefined || this.voluntaryContributionCureencyVal == '' || this.voluntaryContributionCureencyVal == null) {
            this.voluntaryContributionCureencyVal = 0;
        }
        if (this.voluntaryContributionPercentVal == undefined || this.voluntaryContributionPercentVal == '' || this.voluntaryContributionPercentVal == null) {
            this.voluntaryContributionPercentVal = 0;
        }
        fields.Voluntary_Contribution_Fixed__c = this.voluntaryContributionCureencyVal;
        fields.Voluntary_Contribution_Percent__c = this.voluntaryContributionPercentVal;
        fields.Pay_Event_Indicator__c = this.finalizedPayEventIndicator;
        // console.log('fields '+JSON.stringify(fields));
        this.template.querySelector('lightning-record-edit-form[data-staffpay="staffPayrollForm"]').submit(fields);
    }

    handleeditSuccess() {
        let payrunSetting = [];
        this.StaffPayrollJasonFormat = {};
        accpetedStaffPayroll({
            payrollId: this.paysetId
        }).then(response => {
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
                this.StaffPayrollJasonFormat[record.Id] = {
                    "preTaxOne": record.Pre_Tax_One_Value__c,
                    "preTaxTwo": record.Pre_Tax_Two_Value__c,
                    "preTaxThree": record.Pre_Tax_Three_Value__c,
                    "preTaxFour": record.Pre_Tax_Four_Value__c,
                    "preTaxFive": record.Pre_Tax_Five_Value__c,
                    "TotalPreTax": record.Pre_tax_values__c,
                    "postTax": record.Post_tax_values__c,
                    "reimb": record.Reimbursements__c,
                    "voluntaryContribution": record.Voluntary_Contribution__c,
                    "ContributionCurrency": record.Voluntary_Contribution_Fixed__c,
                    "ContributionPercent": record.Voluntary_Contribution_Percent__c
                };
            })
            this.staffrecords = payrunSetting;

            if (this.staffrecords.length > 0) {
                this.buttonsONPayroll = true;
            } else {
                this.buttonsONPayroll = false;
            }
            this.payrunEdit = false;
            this.blhdfinalized = false;
            this.finalizedPayEventIndicator = false;
            this.NormalYtdFlag = true
            this.FinalisedYtdFlag = false;
            this.isDisbaleWorkingHours = false
            const toastEvent = new ShowToastEvent({
                title: "Success",
                message: "Payrun updated successfully.",
                variant: "success"
            });
            this.dispatchEvent(toastEvent);
            this.selectedButton = 'Submitted';
            console.log('this.chpaymentDate ==> ' + this.blEditPayrun);
            if (this.blEditPayrun == true) {
                this.UpdatePayRunStatus();
            }

        }).catch(err => {
            // console.log(err);
        });
    }

    handleeditClose() {
        this.payrunEdit = false;
    }
    @track groupName;
    @track orgABN;
    @track chkLabel;
    @track fileStpbutton;
    @track Editbutton;
    @track paymentProcessDate = false;
    @track processdate;
    @track editProcessedDate = false;
    @track AddPayRunButton = true;
    @track initialPayProcessDate;
    @track initialPayEnddate;
    @track listOfStaffPAyRoll = [];
    @track activityLogButton = true;
    @track payrollStatus1;


    openPaysettings(event) {
        this.chkLabel = 'I, ' + this.currentUser + ', have read and accepted the Authorization to file';
        this.isopenPaysettings = true;
        this.ispayrun = false;
        this.isaddpayrun = false;
        this.blEditPayrun = false;
        this.editProcessedDate = true;
        this.customMetadatDetails = 0;
        this.chpaymentDate = '';
        this.currentPayrunId = event.currentTarget.dataset.id; // Store the ID
        this.paysetId = event.currentTarget.dataset.id;
        this.chpaymentDate = event.currentTarget.dataset.date;
        this.initialPayProcessDate = event.currentTarget.dataset.date;
        this.initialPayEnddate = event.currentTarget.dataset.enddate;
        this.blhdfinalized = false;
        this.disableSubmitButton = false;
        this.NormalYtdFlag = true;
        this.FinalisedYtdFlag = false;
        this.activityData = [];

        this.showSignatureTemplate = true;
        console.log('chpaymentDate  in open pay settings 11 ==>' + this.chpaymentDate)

        // console.log('group name  '+event.currentTarget.dataset.groupname);
        getCustomMetaData({
            PayDate: this.chpaymentDate
        }).then(response => {
            this.customMetadatDetails = response.length;
            // console.log('custom meta data Details '+this.customMetadatDetails);
        }).catch(error => {
            // console.log('custom meta error '+JSON.stringify(error));
        });
        console.log('chpaymentDate  in open pay settings ==>' + this.chpaymentDate)
        let statusValue = event.currentTarget.dataset.name;
        this.payrollStatus1 = statusValue;
        // console.log('status value '+statusValue);      
        if (statusValue == 'Submitted' || statusValue == 'Delete') {
            this.isStatus = true;
        } else {
            this.isStatus = false;
        }
        if (statusValue == 'Submitted') {
            this.ispayslip = true;
            this.isSubmitbtn = true;
        } else {
            this.ispayslip = false;
            this.isSubmitbtn = false;
        }
        // praveen code starts here
        if (statusValue == 'Draft') {
            this.fileStpbutton = true;
            this.isStatus = false;
            this.editProcessedDate = false;
            this.activityLogButton = true;
            this.superannuationButtonDisabled = true;
            this.payButtonDisabled = true;
            this.processPaymentButtonDisabled = true;
        } else if (statusValue == 'Submitted') {
            this.fileStpbutton = false;
            this.Editbutton = false;
            this.activityLogButton = true;
            this.superannuationButtonDisabled = true;
            this.payButtonDisabled = true;
            this.processPaymentButtonDisabled = true;
        } else if (statusValue == 'STP Filed') {
            this.fileStpbutton = true;
            this.ispayslip = true;
            this.isSubmitbtn = true;
            this.isStatus = true;
            this.Editbutton = true;
            this.activityLogButton = false;
        }

        this.payLoadData();
    }

    payLoadData() {
        this.listOfStaffPAyRoll = [];
        let payrunSetting = [];

        // First call - Get staff payroll records
        accpetedStaffPayroll({
            payrollId: this.paysetId
        }).then(response => {
            let PayerTotalPAYGWAmount = 0;
            let PayerTotalGrossPaymentsAmount = 0;
            
            response.forEach(record => {
                let tempRec = Object.assign({}, record);
                console.log('tempRec IN PAY LOAD ==> ', JSON.stringify(tempRec));
                this.StaffPayrollJasonFormat[record.Id] = {
                    "preTaxOne": record.Pre_Tax_One_Value__c,
                    "preTaxTwo": record.Pre_Tax_Two_Value__c,
                    "preTaxThree": record.Pre_Tax_Three_Value__c,
                    "preTaxFour": record.Pre_Tax_Four_Value__c,
                    "preTaxFive": record.Pre_Tax_Five_Value__c,
                    "TotalPreTax": record.Pre_tax_values__c,
                    "postTax": record.Post_tax_values__c,
                    "reimb": record.Reimbursements__c,
                    "voluntaryContribution": record.Voluntary_Contribution__c,
                    "ContributionCurrency": record.Voluntary_Contribution_Fixed__c,
                    "ContributionPercent": record.Voluntary_Contribution_Percent__c
                };

                tempRec.grossSalary = tempRec.Gross_Salary__c.toFixed(2);
                tempRec.totalHours = tempRec.Working_Hours__c.toFixed(2);
                tempRec.superAnnuation = tempRec.Super_And_Voluntary_Supper_Annuation__c.toFixed(2);
                tempRec.grossPerWeek = tempRec.Gross_Salary_Display__c.toFixed(2);
                tempRec.netPay = tempRec.Net_Pay__c.toFixed(2);
                tempRec.tax = tempRec.Tax__c.toFixed(2);
                this.processdate = tempRec.Pay_Date__c;

                if (this.processdate != undefined) {
                    this.paymentProcessDate = true;
                    this.processdate = tempRec.Pay_Date__c;
                } else {
                    this.paymentProcessDate = false;
                }

                payrunSetting.push(tempRec);
                this.listOfStaffPAyRoll.push(tempRec.Id);

                let tfn = '';
                let abn = '';

                PayerTotalPAYGWAmount = PayerTotalPAYGWAmount + tempRec.Tax__c;
                PayerTotalGrossPaymentsAmount = PayerTotalGrossPaymentsAmount + tempRec.Gross_Salary_Display__c;

                let payeedetails = {
                    PayeeTFN: tempRec.Staff__r.TFN_number__c,
                    ContractorABN: tempRec.Staff__r.ABN_Number__c,
                    PayeePayrollID: tempRec.Staff__c,
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
                        StateOrTerritoryCode: tempRec.Staff__r.Address__StateCode__s,
                        CountryCode: 'au'
                    },
                    PayeeEmailAddress: tempRec.Staff__r.Email_Address__c,
                    PayeePhoneNumber: tempRec.Staff__r.Contact_Number__c,
                    EmploymentConditions: {
                        PayeeCommencementDate: tempRec.Staff__r.Emp_Start_Date__c,
                        PayeeCessationDate: tempRec.Staff__r.Emp_exit_date__c,
                        EmploymentBasisCode: 'F',
                        CessationTypeCode: tempRec.Staff__r.Exit_Reason_Code__c,
                        TaxTreatmentCode: 'RDXXXX',
                        TaxOffsetAmount: null
                    },
                    PayrollRun: {
                        PeriodStartDate: tempRec.Payroll_Setting__r.Period_Start_Date__c,
                        PeriodEndDate: tempRec.Payroll_Setting__r.Period_End_Date__c,
                        FinalEventIndicator: false,
                        IncomeStreams: [{
                            IncomeStreamTypeCode: 'SAW',
                            CountryCode: null,
                            PAYGWAmount: tempRec.Current_Tax_YTD__c,
                            ForeignTaxPaidAmount: null,
                            ExemptForeignIncomeAmount: null,
                            GrossAmount: tempRec.Current_Taxble_Gross_Salary_YTD__c,
                            PaidLeaves: null,
                            Allowances: null,
                            OvertimeAmount: null,
                            BonusesAndCommissionsAmount: null,
                            DirectorsFeesAmount: null,
                            SalarySacrifices: null,
                            LumpSumPayments: null,
                        }],
                        Deductions: null,
                        SuperEntitlements: [{
                            SuperEntitlementTypeCode: 'L',
                            SuperEntitlementAmount: tempRec.Current_Super_and_Voluntaryannuation_YTD__c
                        }],
                        ReportableFringeBenefits: null
                    }
                }
                let payerDetails = {
                    BMSIdentifier: response[0].Org_BMSId__c,
                    PayerABN: response[0].Org_ABN__c,
                    PayerWPN: null,
                    PayerBranchCode: response[0].Staff__r.Facility__r.Organisation__r.Branch_code__c,
                    PreviousBMSIdentifier: null,
                    PayerOrganisationName: response[0].Org_Name__c,
                    PayerContactName: response[0].Staff__r.Facility__r.Organisation__r.Contact_Name__c,
                    PayerEmailAddress: response[0].orgEmail__c,
                    PayerBusinessHoursPhoneNumber: response[0].Org_Phone__c,
                    PayerPostcode: response[0].OrgPostalCode__c,
                    PayerCountryCode: 'au',
                    Payroll: {
                        PayOrUpdateDate: response[0].Pay_Date__c,
                        FullFileReplacementIndicator: false
                    },
                    PayerPeriodTotals: {
                        PayerTotalPAYGWAmount: null,
                        PayerTotalGrossPaymentsAmount: null,
                        ChildSupportTotalGarnisheeAmount: null,
                        ChildSupportTotalDeductionsAmount: null
                    },
                    PayerDeclaration: {
                        PayerDeclarerIdentifier: this.currentUser,
                        PayerDeclarationDate: new Date(),
                        PayerDeclarationAcceptanceIndicator: true
                    },
                    PayerPeriodTotals: {
                        PayerTotalPAYGWAmount: PayerTotalPAYGWAmount,
                        PayerTotalGrossPaymentsAmount: PayerTotalGrossPaymentsAmount,
                        ChildSupportTotalGarnisheeAmount: 0,
                        ChildSupportTotalDeductionsAmount: 0
                    }
                }
                this.datain.PayEventPayer = payerDetails;
                this.datain.PayEventPayees.push(payeedetails);
            })
            this.staffrecords = payrunSetting;

            if (this.staffrecords.length > 0) {
                this.buttonsONPayroll = true;
            } else {
                this.buttonsONPayroll = false;
            }
            this.groupName = response[0].Payroll_Setting__r.Group_Name__c;
            this.orgABN = response[0].Org_ABN__c;
            this.datain.SoftwareID = response[0].Staff__r.Facility__r.Organisation__r.SoftwareId__c;
            
            // Now call the second method to get validation logs
            this.getValidationLogs();
            
        }).catch(error => {
            console.error('Error getting staff payroll records: ', error);
        });
    }

    // New method to get validation logs
    getValidationLogs() {
        // Use the imported function with alias
        getValidationLogsFromPayrun({
            payrollId: this.paysetId
        }).then(result => {
            console.log('Validation Logs from PayrunSettingHandler: ', JSON.stringify(result));
            this.validationLogs = result;
            
            // Check if status is 'STP Filed' and there are no validation logs
            if (this.payrollStatus1 === 'STP Filed') {
                if (!this.validationLogs || this.validationLogs.length === 0) {
                    // No validation logs found, enable superannuation button
                    this.superannuationButtonDisabled = false;
                    console.log('STP Filed with no validation logs - Superannuation button enabled');
                } else {
                    // Validation logs exist, keep superannuation button disabled
                    this.superannuationButtonDisabled = true;
                    this.payButtonDisabled = false;
                    this.processPaymentButtonDisabled = false;
                    console.log('STP Filed with validation logs - Superannuation button disabled');
                }
            }
        }).catch(error => {
            console.error('Error getting validation logs: ', error);
            if (this.payrollStatus1 === 'STP Filed') {
                this.superannuationButtonDisabled = true;
            }
        });
    }

    renderedCallback() {
        Promise.all([
            loadScript(this, jsPDF).then(() => {}).catch(error => {
                console.error("Error " + error);
            })
        ]);
    }

    connectedCallback() {
        const storedCompanyId = localStorage.getItem('selectedCompanyId');
        const storedCompanyName = localStorage.getItem('selectedCompanyName');
        if (storedCompanyId && storedCompanyName) {
            this.companyId = storedCompanyId;
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
        this.fetchOrgDetails();
        this.blpayDate = false;
        this.issavedpayrun = false;
        var today = new Date(new Date().getFullYear(), new Date().getMonth(), 2);
        this.sdate = today.toISOString().slice(0, 10);
        var last = new Date(new Date().getFullYear(), new Date().getMonth(), 9);
        this.edate = last.toISOString().slice(0, 10);
        //fetchPayrollStaff1({payrollGroupName: this.groupName, startDat: this.payrollStartDate, endDate : this.payrollEndDate}).then(response=> {
        getpPaySettings().then(response => {
            this.payrunSetting = response;
            var options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            let tempConList = [];
            let tempConListExceptDraft = [];
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                // tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                if (record.Staff_Payroll_Settings__r) {
                    let childPayruns = record.Staff_Payroll_Settings__r;

                    childPayruns.forEach(rec => {
                        tempConRec.paymentDate = new Date(rec.Pay_Date__c).toLocaleDateString('en-GB');

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
                } else {
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

    fetchOrgDetails() {
        orgDetails()
            .then((response) => {
                console.log("Response for Org Details =>", response);
                this.Orgid = response.Id;
                this.orgfullname = response.Name;
                this.facilityPreferredName = response.Facility_Preferred_Name_Formula__c;
                this.participantPreferredName = response.Participant_Preferred_Name_Formula__c;
            })
            .catch((error) => {
                console.error("Error fetching org details:", error);
                this.error = error;
            });
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
        if (this.totalRecords > 0) {
            this.noRecordsFlag = false;
        } else {
            this.noRecordsFlag = true;
        }
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
        this.disableSubmitButton = false;
        this.payrunSettingnewValue = '';
        this.finalizedPayEventIndicator = false;
        fetchPayrollStaff().then(response => {
            this.payrollSettingNewList = response.map(record => ({
                value: record.Id,
                label: record.Period__c
            }));
            // console.log(JSON.stringify(this.payrollSettingNewList));
            response.forEach(rec => {
                this.paySettingsNextPayJson[rec.Id] = {
                    "NextParunDate": rec.Next_Pay_Date__c
                };
            })

        }).catch(err => {
            // console.log(err);
        });

    }

    closeaddPayRun() {
        console.log('===== START closeaddPayRun =====');
        
        // Reset all flags
        this.isaddpayrun = false;
        this.staffrecords = [];
        this.staffrecordsAddPayrun = [];
        this.buttonsONPayroll = false;
        this.isopenPaysettings = false;
        this.ispayrun = true;
        this.AddPayRunButton = true;
        this.showSignatureTemplate = false;
        this.payrunEdit = false;
        
        // Clear any stored payrun ID
        this.currentPayrunId = null;
        this.paysetId = null;
        
        // Fetch updated list
        this.fetchPayrun();
        
        console.log('===== END closeaddPayRun =====');
    }

    @track isFileSTP = false;
    @track hideSTPButton = true;
    handlefileSTP() {
        this.payLoadData();
        this.isFileSTP = true;
    }
    hideModalBox() {
        this.isFileSTP = false;
    }
    handleStpauth(event) {
        var ischeked = event.target.checked;
        if (ischeked) {
            this.hideSTPButton = false;
        } else {
            this.hideSTPButton = true;
        }
    }

    @track stpRefId;
    @track showProgressbar = false;
    @track isProgressing = true;

    submitSTP(event) {
        this.selectedButton = "STP Filed";
        // console.log('selectedButton ', this.selectedButton);
        this.hideSTPButton = true;
        this.showProgressbar = true;
        this.isProgressing = false;
        console.log('data in payload ' + JSON.stringify(this.datain));
        //    var datain='{"PayEventPayer": {"BMSIdentifier": "125b8925-9a97-4178-8dee-78d3fdeb0437", "PayerABN": "67094544519", "PayerWPN": null, "PayerBranchCode": "2", "PreviousBMSIdentifier": null, "PayerOrganisationName": "YALACT P/L", "PayerContactName": "Mary-Anne Ackland", "PayerEmailAddress": "Maryaa@gmail.com", "PayerBusinessHoursPhoneNumber": "02 99720000", "PayerPostcode": "3000", "PayerCountryCode": "au", "Payroll": { "PayOrUpdateDate": "2023-06-30T00:00:00", "FullFileReplacementIndicator": false }, "PayerPeriodTotals": { "PayerTotalPAYGWAmount": 15000.5, "PayerTotalGrossPaymentsAmount": 150750.0, "ChildSupportTotalGarnisheeAmount": null, "ChildSupportTotalDeductionsAmount": null }, "PayerDeclaration": { "PayerDeclarerIdentifier": "MAAckland", "PayerDeclarationDate": "2023-10-19T14:59:53.2660835+05:30", "PayerDeclarationAcceptanceIndicator": true } }, "Intermediary": null, "PayEventPayees": [ { "PayeeTFN": "151994243", "ContractorABN": null, "PayeePayrollID": "50236", "PreviousPayrollID": null, "PayeeNameDetails": { "PayeeFamilyName": "Martin", "PayeeFirstName": "Mark", "PayeeOtherName": null }, "PayeeDateOfBirth": "1990-10-02T00:00:00", "PayeeAddressDetails": { "Line1": "34 wanderer street", "Line2": null, "Line3": null, "LocalityName": "Mt Helen", "Postcode": "3350", "StateOrTerritoryCode": "VIC", "CountryCode": "au" }, "PayeeEmailAddress": "heaven@gmail.com", "PayeePhoneNumber": null, "EmploymentConditions": { "PayeeCommencementDate": "2018-07-11T00:00:00", "PayeeCessationDate": "2023-06-12T00:00:00", "EmploymentBasisCode": "C", "CessationTypeCode": "C", "TaxTreatmentCode": "RDXXXX", "TaxOffsetAmount": null }, "PayrollRun": { "PeriodStartDate": "2023-06-01T00:00:00", "PeriodEndDate": "2023-06-30T00:00:00", "FinalEventIndicator": false, "IncomeStreams": [ { "IncomeStreamTypeCode": "SAW", "CountryCode": null, "PAYGWAmount": 3000.0, "ForeignTaxPaidAmount": null, "ExemptForeignIncomeAmount": null, "GrossAmount": 15000.0, "PaidLeaves": null, "Allowances": null, "OvertimeAmount": null, "BonusesAndCommissionsAmount": null, "DirectorsFeesAmount": null, "SalarySacrifices": null, "LumpSumPayments": null, "TerminationPayments": [ { "ETPCode": "R", "PayeeETPPaymentDate": "2023-06-18T00:00:00", "PayeeTerminationPaymentTaxFreeComponent": 10000.0, "PayeeTerminationPaymentTaxableComponent": 10000.0, "PayeeTotalETPPAYGWAmount": 3000.0 } ] } ], "Deductions": null, "SuperEntitlements": [ { "SuperEntitlementTypeCode": "L", "SuperEntitlementAmount": 2257.45 } ], "ReportableFringeBenefits": null } }, { "PayeeTFN": "151994716", "ContractorABN": null, "PayeePayrollID": "50237", "PreviousPayrollID": null, "PayeeNameDetails": { "PayeeFamilyName": "Lyons", "PayeeFirstName": "Lamar", "PayeeOtherName": null }, "PayeeDateOfBirth": "1989-09-02T00:00:00", "PayeeAddressDetails": { "Line1": "19 May St", "Line2": null, "Line3": null, "LocalityName": "Melbourne", "Postcode": "3021", "StateOrTerritoryCode": "VIC", "CountryCode": "au" }, "PayeeEmailAddress": "LittleL@hotmail.com", "PayeePhoneNumber": null, "EmploymentConditions": { "PayeeCommencementDate": "2018-02-15T00:00:00", "PayeeCessationDate": null, "EmploymentBasisCode": "F", "CessationTypeCode": null, "TaxTreatmentCode": "RTX2X1", "TaxOffsetAmount": null }, "PayrollRun": { "PeriodStartDate": "2023-06-01T00:00:00", "PeriodEndDate": "2023-06-30T00:00:00", "FinalEventIndicator": false, "IncomeStreams": [ { "IncomeStreamTypeCode": "SAW", "CountryCode": null, "PAYGWAmount": 3000.0, "ForeignTaxPaidAmount": null, "ExemptForeignIncomeAmount": null, "GrossAmount": 15000.0, "PaidLeaves": null, "Allowances": null, "OvertimeAmount": null, "BonusesAndCommissionsAmount": null, "DirectorsFeesAmount": null, "SalarySacrifices": null, "LumpSumPayments": null, "TerminationPayments": null } ], "Deductions": null, "SuperEntitlements": [ { "SuperEntitlementTypeCode": "O", "SuperEntitlementAmount": 467.45 } ], "ReportableFringeBenefits": null } }, { "PayeeTFN": null, "ContractorABN": "61000031569", "PayeePayrollID": "50238", "PreviousPayrollID": null, "PayeeNameDetails": { "PayeeFamilyName": "Trevor", "PayeeFirstName": "Jef", "PayeeOtherName": "Martin" }, "PayeeDateOfBirth": "1986-10-02T00:00:00", "PayeeAddressDetails": { "Line1": "Unit 6", "Line2": "34 wanderer street", "Line3": null, "LocalityName": "Mt Helen", "Postcode": "3350", "StateOrTerritoryCode": "VIC", "CountryCode": "au" }, "PayeeEmailAddress": "heaven@gmail.com", "PayeePhoneNumber": null, "EmploymentConditions": { "PayeeCommencementDate": "2018-02-20T00:00:00", "PayeeCessationDate": "2023-06-20T00:00:00", "EmploymentBasisCode": "L", "CessationTypeCode": "V", "TaxTreatmentCode": "RDXXXX", "TaxOffsetAmount": null }, "PayrollRun": { "PeriodStartDate": "2023-06-01T00:00:00", "PeriodEndDate": "2023-06-30T00:00:00", "FinalEventIndicator": false, "IncomeStreams": [ { "IncomeStreamTypeCode": "VOL", "CountryCode": null, "PAYGWAmount": 3000.0, "ForeignTaxPaidAmount": null, "ExemptForeignIncomeAmount": null, "GrossAmount": 15000.0, "PaidLeaves": null, "Allowances": null, "OvertimeAmount": null, "BonusesAndCommissionsAmount": null, "DirectorsFeesAmount": null, "SalarySacrifices": null, "LumpSumPayments": null, "TerminationPayments": null } ], "Deductions": null, "SuperEntitlements": [ { "SuperEntitlementTypeCode": "O", "SuperEntitlementAmount": 756.0 } ], "ReportableFringeBenefits": null } } ], "SoftwareID": "1487226280" }';
        submitPayload({
            data: JSON.stringify(this.datain),
            isUpdate: false
        }).then(response => {
            console.log('stp response ' + JSON.stringify(JSON.parse(response)));
            const parsedResponse = JSON.parse(response);
            console.log('ref id ' + parsedResponse.Result.RefMessageID);
            setTimeout(() => {
                this.stpRefId = parsedResponse.Result.RefMessageID;
                if (this.stpRefId == null) {
                    const event = new ShowToastEvent({
                        title: '',
                        message: 'STP filing Failed. Please Contact System Admin',
                        variant: 'Error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(event);
                    this.isProgressing = true;
                    this.showProgressbar = false;
                    saveSTPResponse({
                        paySettingId: this.paysetId,
                        typeOfsubmission: 'File STP',
                        output: response,
                        refID: this.stpRefId
                    });
                } else {
                    updateGovReportStatus({
                            payrollId: this.paysetId,
                            refId: this.stpRefId,
                            status: ''
                        }).then((result) => {
                            //alert('STP filed successfully');
                            const event = new ShowToastEvent({
                                title: '',
                                message: 'STP filed successfully',
                                variant: 'Success',
                                mode: 'dismissable'
                            });
                            this.dispatchEvent(event);
                            this.UpdatePayRunStatus();
                            this.showProgressbar = false;
                            this.isProgressing = true;
                        })
                        .catch((error) => {
                            //alert('STP submission failed due to '+error.msg);
                            const event = new ShowToastEvent({
                                title: '',
                                message: 'STP submission failed due to ' + error.msg,
                                variant: 'Error',
                                mode: 'dismissable'
                            });
                            this.dispatchEvent(event);
                            this.showProgressbar = false;
                            this.isProgressing = true;
                        });

                    saveSTPResponse({
                        paySettingId: this.paysetId,
                        typeOfsubmission: 'File STP',
                        output: response,
                        refID: this.stpRefId
                    });
                }
            }, 5000);

            if (!this.stpRefId == '' || !this.stpRefId == null) {}

        })
        this.isFileSTP = false;
    }
    saveaddPayRun() {
        //console.log('Payroll setting ID '+this.payrunSettingnewValue );

        if (this.customMetadatDetails == 0) {
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Payrun Financial year data is empty.',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        } else {
            staffAllocationCalculation({
                payrollId: this.payrunSettingnewValue
            }).then(response => {
                this.isaddpayrun = false;
                this.staffrecords = response;
                // console.log('Staff Payroll records '+JSON.stringify(this.staffrecords));
                this.staffrecords.forEach(rec => {
                    this.StaffPayrollJasonFormat[rec.Id] = {
                        "preTaxOne": rec.Pre_Tax_One_Value__c,
                        "preTaxTwo": rec.Pre_Tax_Two_Value__c,
                        "preTaxThree": rec.Pre_Tax_Three_Value__c,
                        "preTaxFour": rec.Pre_Tax_Four_Value__c,
                        "preTaxFive": rec.Pre_Tax_Five_Value__c,
                        "TotalPreTax": rec.Pre_tax_values__c,
                        "postTax": rec.Post_tax_values__c,
                        "reimb": rec.Reimbursements__c,
                        "voluntaryContribution": rec.Voluntary_Contribution__c,
                        "ContributionCurrency": rec.Voluntary_Contribution_Fixed__c,
                        "ContributionPercent": rec.Voluntary_Contribution_Percent__c
                    };
                })
                // console.log('Staff data jsonFormat '+JSON.stringify(this.StaffPayrollJasonFormat));
                this.staffrecordsAddPayrun = [];
                this.buttonsONPayroll = false;
                this.isopenPaysettings = false;
                this.ispayrun = true;
                this.paystaffFlag = true;
                this.AddPayRunButton = true;
                this.records = []; // new line added by praveen for pagination

                getpPaySettings().then(response => {
                    this.payrunSetting = response;
                    var options = {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    };
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
                            // alert("Save payment Date: " + tempConRec.Next_Pay_Date__c);
                            this.chpaymentDate = tempConRec.Next_Pay_Date__c;
                            tempConList.push(tempConRec);
                        }
                        if (tempConRec.Status__c != undefined && tempConRec.Status__c != 'Draft') {
                            tempConListExceptDraft.push(tempConRec);
                        }
                    })
                    // this.payrunList = tempConListExceptDraft;  new line added by praveen for pagination , till 883 line 
                    this.records = tempConListExceptDraft;
                    this.totalRecords = this.records.length;
                    this.paginationHelper();
                    this.payrun = tempConList;
                    console.log('save payment date==>' + this.chpaymentDate);
                })

            });
            const evt = new ShowToastEvent({
                title: ' success',
                message: 'Payrun saved successfully.',
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }
        this.issavedpayrun = false;
    }


    handlePayrollSettingChange(event) {
        let selectedValue;
        let periosrtdate;
        let periodenddate;
        this.customMetadatDetails = 0;
        if (event.target.name == 'payrollSetting') {
            selectedValue = event.detail.value;
            this.payrunSettingnewValue = event.detail.value;
        }

        console.log("Pay Run: " + JSON.stringify(this.payrunSettingnewValue));
        let nextPayrunDate = this.paySettingsNextPayJson[this.payrunSettingnewValue]["NextParunDate"];
        this.customMetadatDetails = 0;
        getCustomMetaData({
            PayDate: nextPayrunDate
        }).then(response => {
            this.customMetadatDetails = response.length;
            // console.log('custom meta data Details '+this.customMetadatDetails);
        }).catch(error => {
            // console.log('custom meta error '+JSON.stringify(error));
        });

        accpetedStaffPayroll({
            payrollId: this.payrunSettingnewValue
        }).then(response => {
            let tempConList = [];

            for (let i = 0; i < response.length; i++) {
                let record = response[i];
                let tempConRec = Object.assign({}, record);
                if (record.Staff__r.Status__c == false) {
                    const evt = new ShowToastEvent({
                        title: 'Error',
                        message: `Staff member ${record.Staff__r.Name} ${record.Staff__r.Last_Name__c} is currently inactive and cannot be included in this payrun group.`,
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
                    this.issavedpayrun = true;
                    return;
                } else if (record.Payroll_Setting__r.Frequency__c != record.Staff__r.Employment_type__c) {
                    const evt = new ShowToastEvent({
                        title: 'Error',
                        message: 'Group frequency and Staff ' + record.Staff__r.Name + ' ' + record.Staff__r.Last_Name__c + ' frequency names do not match.',
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
                    this.issavedpayrun = true;
                    return;
                } else {
                    tempConList.push(tempConRec);
                    this.issavedpayrun = false;
                }
            }
            console.log("Selected Staff Data : " + JSON.stringify(tempConList));
            this.staffrecordsAddPayrun = tempConList;
            if (this.staffrecordsAddPayrun.length > 0) {
                this.buttonsONPayroll = true;
            } else {
                this.buttonsONPayroll = false;
            }

        })
        this.AddPayRunButton = false;
    }

    handleSelect(event) {
        this.staffnewId = event.currentTarget.dataset.id;
    }

    @track transformedJuneData = {};
    @track transformedJulyData = {};
    @track disableSubmitButton = false;

    paymentDateChanged(event) {
        // alert("PaymentDateChanged ");
        this.chpaymentDate = event.target.value;
        this.customMetadatDetails = 0;
        this.disableSubmitButton = false;

        getCustomMetaData({
            PayDate: this.chpaymentDate
        }).then(response => {
            this.customMetadatDetails = response.length;
            // console.log('custom meta data Details ' + this.customMetadatDetails);
        }).catch(error => {
            // console.log('custom meta error ' + JSON.stringify(error));
        });

        // console.log('inital date  ' + this.initialPayProcessDate);
        if (new Date(this.chpaymentDate) < new Date(this.initialPayEnddate)) {
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Pay Date should not be less than Period End Date',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
            this.disableSubmitButton = true;
            return;
        } else if (new Date(this.chpaymentDate) < new Date(this.initialPayProcessDate) &&
            new Date(this.chpaymentDate).getMonth() == 5 &&
            new Date(this.initialPayProcessDate).getMonth() != 5) {
            /*  alert("Inside Condition True: "); */
            this.blhdfinalized = true;
            this.transformedJuneData = {};
            this.transformedJulyData = {};
            getPayHistrory({
                Paymentdate: this.chpaymentDate,
                groupName: this.groupName
            }).then(response => {
                // console.log(' get history data ' + JSON.stringify(response));

                const transformedData = this.separateAndTransformData(response);
                this.transformedJuneData = transformedData.juneData;
                this.transformedJulyData = transformedData.julyData;

            }).catch(error => {
                // console.log('custom meta error ' + JSON.stringify(error));
            });
        } else {
            this.blhdfinalized = false;
            this.disableSubmitButton = false;
            this.NormalYtdFlag = true
            this.FinalisedYtdFlag = false;
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

        return {
            juneData,
            julyData
        };
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
    @track editHistoryPayroll = false;
    @track payruneditFlag = false;
    EditPayRun(event) {
        this.payruneditFlag = true;
    }
    handleeditpayrun(event) {
        this.blEditPayrun = true;
        this.isStatus = false;
        this.isSubmitbtn = false;
        this.Editbutton = true;
        this.editProcessedDate = false;
        // this.blhdfinalized = true;
        this.editHistoryPayroll = true;
        this.payruneditFlag = false;
    }
    handlepayrunclose(event) {
        this.blEditPayrun = false;
        this.isStatus = true;
        this.isSubmitbtn = true;
        this.Editbutton = false;
        this.editProcessedDate = true;
        this.blhdfinalized = false;
        this.editHistoryPayroll = false;
        this.payruneditFlag = false;
    }

    @track selectedButton;
    @track customMetadatDetails;
    handleSubmit(event) {
        this.selectedButton = event.target.name;
        if (this.customMetadatDetails == 0) {
            const evt = new ShowToastEvent({
                title: ' Error',
                message: 'Payrun Financial year data is empty.',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        } else {
            this.UpdatePayRunStatus();
        }


        if (event.currentTarget.dataset.message == 'delete') {
            const evt = new ShowToastEvent({
                title: ' success',
                message: 'Payrun deleted successfully.',
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
    @track finalizedPayEventIndicator = false;

    UpdatePayRunStatus() {
        // console.log('selectedButton ', this.selectedButton);
        statusPayrollSetting({
            paysetId: this.paysetId
        }).then(response => {
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
                console.log('this.selectedButton==>  ' + this.selectedButton);
                console.log('this.chpaymentDate ==> ' + this.chpaymentDate);

                updateSubmit({
                    paysetId: this.paysetId,
                    statusValue: this.selectedButton,
                    changedpayDate: this.chpaymentDate
                }).then(response => {
                    getpPaySettings().then(response => {
                        this.records = []; //this line addded by praveen  for pagination
                        this.payrunSetting = response;
                        var options = {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        };
                        let tempConList = [];
                        let tempConListExceptDraft = [];
                        response.forEach((record) => {
                            let tempConRec = Object.assign({}, record);
                            // tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                            if (record.Staff_Payroll_Settings__r) {
                                let childPayruns = record.Staff_Payroll_Settings__r;
                                // console.log('childs Payruns '+JSON.stringify(childPayruns));
                                childPayruns.forEach(rec => {
                                    tempConRec.paymentDate = new Date(rec.Pay_Date__c).toLocaleDateString('en-GB');
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
                        this.records = tempConListExceptDraft;
                        this.totalRecords = this.records.length;
                        this.paginationHelper();
                    })

                    this.staffPayIds = response;

                    // console.log('staff Pay Roll ids ',JSON.stringify(this.staffPayIds));
                    this.handleDataPdf();
                })

                if (this.blEditPayrun == true) {
                    console.log('blEditPayrun  CALLED  ')
                    this.isopenPaysettings = true;
                    this.isSubmitbtn = true;
                    this.editProcessedDate = true;
                    this.isStatus = true;
                    this.payLoadData();
                } else {
                    this.isopenPaysettings = false;
                    this.isaddpayrun = false;
                    this.staffrecords = [];
                    this.buttonsONPayroll = false;
                    this.ispayrun = true;
                    this.editProcessedDate = true;
                    this.NormalYtdFlag = true
                    this.FinalisedYtdFlag = false;
                    this.customMetadatDetails = 0
                }
                // this.isopenPaysettings = false;

            }
        });
    }

    //Payslip
    @track childPdf = false;
    async handleDataPdf() {
        console.log('staff Id list before for loop', JSON.stringify(this.staffPayIds));
        let originalChpaymentDate = this.chpaymentDate;
        console.log('Original date stored:', originalChpaymentDate);


        for (const staffIdValue of this.staffPayIds) {
            console.log('Staff Id in for loop', staffIdValue);
            console.log('Using original date:', originalChpaymentDate);
            // Ensure childPdf is false before making the call
            this.childPdf = false;

            try {
                console.log('3. this.chpaymentDate in Loop ==> ' + this.chpaymentDate);
                const response = await payrollRun({
                    staffPayrollId: staffIdValue
                });
                this.chpaymentDate = originalChpaymentDate;
                console.log('4. Immediately after await:', this.chpaymentDate); // This shows the change

                console.log('flag', this.childPdf);
                this.currentRecordPdf = response;
                console.log('4. Before currentRecordPdf assignment:', this.chpaymentDate);
                console.log("Current Record for PDF:", JSON.stringify(this.currentRecordPdf));
                console.log('5. After currentRecordPdf assignment:', this.chpaymentDate);
                if (this.currentRecordPdf && this.currentRecordPdf.length > 0) {

                    if (this.currentRecordPdf[0].staffpayrollData.Type_of_User__c === 'ICT User') {
                        console.log('this.chpaymentDate before calling in IF  PDF ==> ' + this.chpaymentDate);
                        this.childPdf = false;
                        this.generatePayroll();
                    } else {
                        console.log('this.chpaymentDate before calling  PDF ==> ' + this.chpaymentDate);
                        this.childPdf = true;
                    }
                }
                let originalChpaymentDate2 = this.chpaymentDate;
                // Wait for child component to render the PDF before moving to the next iteration
                await this.sleep(2000);
                this.chpaymentDate = originalChpaymentDate2;
                console.log('this.chpaymentDate after  PDF ==> ' + this.chpaymentDate);
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
        const {
            jsPDF
        } = window.jspdf;
        var doc = new jsPDF();
        // new condition added by praveen for pre tax
        if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c > 0 || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c > 0 ||
            this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c > 0 || this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c > 0 ||
            this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c > 0) {
            doc.addImage(this.currentRecordPdf[0].bolbdata, "PNG", 10, 18, 70, 18);
            this.orgEmail = this.currentRecordPdf[0].organization.Email__c;

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(134, 15, 60, 37, "FD");

            doc.setFont("roboto", "bold");
            doc.setFontSize(10);
            doc.text("PAID BY", 137, 23);

            doc.setFont("roboto", "");
            doc.setFontSize(10);
            doc.text(this.currentRecordPdf[0].organization.Name, 137, 30);
            doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.street + ', ' + this.currentRecordPdf[0].organization.Address_Latest__c.city, 137, 35);
            doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.state + ', ' + this.currentRecordPdf[0].organization.Address_Latest__c.postalCode, 137, 40);
            doc.text("ABN: " + this.currentRecordPdf[0].organization.ABN__c, 137, 45);

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(134, 60, 60, 27, "FD");

            doc.setFont("roboto", "bold");
            doc.setFontSize(10);
            doc.text("EMPLOYMENT DETAILS", 137, 68);
            doc.setFont("roboto", "");
            doc.setFontSize(10);

            doc.text("Pay Frequency: " + this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Frequency__c, 137, 76);
            doc.text(this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c, 10, 76);
            // console.log(this.currentRecordPdf[0].staffData.Address__c.street);
            doc.text(this.currentRecordPdf[0].staffData.Address__c.street + ', ' + this.currentRecordPdf[0].staffData.Address__c.city, 10, 81);
            doc.text(this.currentRecordPdf[0].staffData.Address__c.state + ', ' + this.currentRecordPdf[0].staffData.Address__c.postalCode, 10, 86);
            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 92, 185, 10, "FD");

            doc.text("Pay Period:", 12, 98);
            doc.text("Payment Date:", 72, 98);

            const oldDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_Start_Date__c;
            const finalDate = this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Period_End_Date__c;

            const nextPayDate = this.currentRecordPdf[0].staffpayrollData.Pay_Date__c;

            // Split the date string at '-' char
            const arr = oldDate.split('-');
            const arr1 = finalDate.split('-');
            if (nextPayDate != undefined || !nextPayDate == '' || !nextPayDate == null) {
                const arr2 = nextPayDate.split('-');
                const nextPayDateFinal = arr2[2] + '/' + arr2[1] + '/' + arr2[0];
                doc.text(nextPayDateFinal, 94, 98);
            }
            const newDate = arr[2] + '/' + arr[1] + '/' + arr[0];
            const newfinalDate = arr1[2] + '/' + arr1[1] + '/' + arr1[0];


            doc.setFont("roboto", "bold");
            doc.setFontSize(10);
            doc.text(newDate + ' - ' + newfinalDate, 30, 98);
            this.subjectName = this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c + ' Pay slip for the period ' + newDate + ' to ' + newfinalDate;
            this.startEndDate = ' Please find attached your pay slip for the pay period  ' + newDate + ' to ' + newfinalDate;
            this.orgName = this.currentRecordPdf[0].organization.Name;


            let dollarUSLocale = Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            });
            doc.setFont("roboto", "");
            doc.setFontSize(10);
            doc.text("Total Earnings:", 120, 98);
            doc.setFont("roboto", "bold");
            if (this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c == undefined) {
                doc.text("$0.00", 143, 98);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 143, 98);
            }
            doc.setFont("roboto", "");
            doc.text("Net Pay:", 165, 98);
            doc.setFont("roboto", "bold");
            if (this.currentRecordPdf[0].staffpayrollData.Net_Pay__c == undefined) {
                doc.text("$0.00", 179, 98);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 179, 98);
            }
            doc.text("THIS PAY", 142, 110);
            doc.line(10, 112, 195, 112);
            doc.text("YTD", 182, 110);
            doc.text("SALARY & WAGES", 10, 120);
            doc.setFont("roboto", "bold");
            if (this.currentRecordPdf[0].staffpayrollData.Type_of_User__c == 'ICT User') {
                doc.text("RATE", 122, 120);
                doc.setFont("roboto", "");
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffData.Working_Hours_Rate__c.toFixed(2)), 120, 126);
            }

            doc.setFont("roboto", "");
            doc.setFontSize(10);
            doc.text("Ordinary Hours", 10, 126);
            doc.text(this.currentRecordPdf[0].staffpayrollData.Working_Hours__c.toFixed(2), 97, 126);

            if (this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c == undefined) {
                doc.text("$0.00", 144, 126);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 126);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c == undefined) {
                doc.text("$0.00", 179, 126);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 126);
            }
            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 129, 185, 8, "FD");
            doc.setFont("roboto", "bold");
            doc.text("TOTAL", 122, 134);
            doc.setFontSize(10);
            if (this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c == undefined) {
                doc.text("$0.00", 144, 134);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 134);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c == undefined) {
                doc.text("$0.00", 179, 134);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 134);
            }
            doc.text("Pre TAX Deductions", 10, 143);
            doc.setFont("roboto", "");
            doc.setFontSize(10);
            let positionOfRows = 0;
            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c != undefined) {
                doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Description__c, 10, 150);
                positionOfRows = 28;
            }
            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c != undefined) {
                doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Description__c, 10, 157);
                positionOfRows = 20;
            }
            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c != undefined) {
                doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Description__c, 10, 164);
                positionOfRows = 12;
            }
            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c != undefined) {
                doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Description__c, 10, 171);
                positionOfRows = 4;

            }
            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c != undefined) {
                doc.text(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Description__c, 10, 178);
                positionOfRows = 0;
            }

            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c > 0) {

                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_One_Value__c.toFixed(2)), 144, 150);
            }
            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c > 0) {

                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Two_Value__c.toFixed(2)), 144, 157);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c > 0) {

                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Three_Value__c.toFixed(2)), 144, 164);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c > 0) {

                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Four_Value__c.toFixed(2)), 144, 171);
            }
            if (this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c > 0) {

                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_Tax_Five_Value__c.toFixed(2)), 144, 178);
            }
            doc.setFont("roboto", "bold");
            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 180 - parseInt(positionOfRows), 185, 8, "FD");
            doc.text("TOTAL", 122, 185 - parseInt(positionOfRows));
            if (this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c == undefined) {
                doc.text("$0.00", 144, 185 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 185 - parseInt(positionOfRows));
            }
            if (this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c == undefined) {
                doc.text("$0.00", 179, 185 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 185 - parseInt(positionOfRows));
            }
            doc.setFont("roboto", "bold");
            doc.text("TAX", 10, 194 - parseInt(positionOfRows));
            doc.text("PAYG", 10, 199 - parseInt(positionOfRows));
            doc.setFont("roboto", "");
            if (this.currentRecordPdf[0].staffpayrollData.Tax__c == undefined) {
                doc.text("$0.00", 144, 199 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 199 - parseInt(positionOfRows));

            }
            if (this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c == undefined) {
                doc.text("$0.00", 179, 199 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 199 - parseInt(positionOfRows));
            }
            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.setFont("roboto", "bold");
            doc.rect(10, 203 - parseInt(positionOfRows), 185, 8, "FD");
            doc.text("TOTAL", 122, 208 - parseInt(positionOfRows));
            if (this.currentRecordPdf[0].staffpayrollData.Tax__c == undefined) {
                doc.text("$0.00", 144, 208 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 144, 208 - parseInt(positionOfRows));

            }
            if (this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c == undefined) {
                doc.text("$0.00", 179, 208 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 208 - parseInt(positionOfRows));
            }

            doc.text("SUPERANNUATION", 10, 220 - parseInt(positionOfRows));
            if (this.currentRecordPdf[0].staffData.Superannuation_Number__c == undefined) {
                doc.text("Guaranteed Superannuation", 10, 226 - parseInt(positionOfRows));
            } else {
                doc.text("Super Annuation | Account Number - " + this.currentRecordPdf[0].staffData.Superannuation_Number__c, 10, 226 - parseInt(positionOfRows));
            }
            doc.setFont("roboto", "");
            if (this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c == undefined) {
                doc.text("$0.00", 144, 226 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c.toFixed(2)), 144, 226 - parseInt(positionOfRows));
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c == undefined) {
                doc.text("$0.00", 179, 226 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 226 - parseInt(positionOfRows));
            }
            if (this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c) {
                if (this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c == 'Fixed') {
                    doc.text("Voluntary Superannuation-Fixed", 10, 232 - parseInt(positionOfRows));
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 232 - parseInt(positionOfRows));
                } else {
                    doc.text("Voluntary Superannuation-Percentage (" + this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c + "%)", 10, 232 - parseInt(positionOfRows));
                    //doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97,232-parseInt(positionOfRows) );
                    doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 232 - parseInt(positionOfRows));
                }
            } else {
                doc.text("Voluntary Superannuation", 10, 232 - parseInt(positionOfRows));
                doc.text("$0.00", 144, 232 - parseInt(positionOfRows));

            }
            if (this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c == undefined) {
                doc.text("$0.00", 179, 232 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 232 - parseInt(positionOfRows));
            }
            doc.setDrawColor(235, 235, 235);
            doc.setFillColor(235, 235, 235);
            doc.setFont("roboto", "bold");
            doc.rect(10, 235 - parseInt(positionOfRows), 185, 8, "FD");
            doc.text("TOTAL", 122, 240 - parseInt(positionOfRows));

            if (this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c == undefined) {
                doc.text("$0.00", 144, 240 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c.toFixed(2)), 144, 240 - parseInt(positionOfRows));
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c == undefined) {
                doc.text("$0.00", 179, 240 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 240 - parseInt(positionOfRows));
            }
            doc.setFont("roboto", "bold");
            doc.text("Post Tax Deductions ", 10, 248 - parseInt(positionOfRows));
            doc.setFont("roboto", "");
            let posttaxRow = 5
            if (this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c != undefined) {
                doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 253 - parseInt(positionOfRows));
                posttaxRow = 0
            }

            if (this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c == undefined) {
                doc.text("$0.00", 144, 253 - parseInt(positionOfRows) - parseInt(posttaxRow));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 253 - parseInt(positionOfRows) - parseInt(posttaxRow));
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c == undefined) {
                doc.text("$0.00", 179, 253 - parseInt(positionOfRows) - parseInt(posttaxRow));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 253 - parseInt(positionOfRows) - parseInt(posttaxRow));
            }
            doc.text("Reimbursements", 10, 258 - parseInt(positionOfRows));

            if (this.currentRecordPdf[0].staffpayrollData.Reimbursements__c == undefined) {
                doc.text("$0.00", 144, 258 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 258 - parseInt(positionOfRows));
            }
            doc.line(10, 260 - parseInt(positionOfRows), 195, 260 - parseInt(positionOfRows));
            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 260 - parseInt(positionOfRows), 185, 8, "FD"); //265
            doc.text("Gross Salary", 12, 265 - parseInt(positionOfRows));

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 270 - parseInt(positionOfRows), 185, 8, "FD"); //273 maheswari code end

            //Gross Salary
            if (this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c == undefined) {
                doc.text("$0.00", 144, 265 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 265 - parseInt(positionOfRows));
            }
            //Gross Salary YTD        
            if (this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c == undefined) {
                doc.text("$0.00", 179, 265 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 179, 265 - parseInt(positionOfRows));
            }
            doc.text("NET SALARY", 12, 275 - parseInt(positionOfRows));
            //Net Salary
            if (this.currentRecordPdf[0].staffpayrollData.Net_Pay__c == undefined) {
                doc.text("$0.00", 144, 275 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 275 - parseInt(positionOfRows));
            }
            //Net YTD Salary
            if (this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c == undefined) {
                doc.text("$0.00", 179, 275 - parseInt(positionOfRows));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 179, 275 - parseInt(positionOfRows));
            }

        } else {
            // added for image and organization details
            doc.addImage(this.currentRecordPdf[0].bolbdata, "PNG", 10, 18, 70, 18);
            this.orgEmail = this.currentRecordPdf[0].organization.Email__c;

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(134, 15, 60, 37, "FD");

            doc.setFont("roboto", "bold");
            doc.setFontSize(10);
            doc.text("PAID BY", 137, 23);

            doc.setFont("roboto", "");
            doc.setFontSize(10);
            doc.text(this.currentRecordPdf[0].organization.Name, 137, 30);
            doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.street + ', ' + this.currentRecordPdf[0].organization.Address_Latest__c.city, 137, 35);
            doc.text(this.currentRecordPdf[0].organization.Address_Latest__c.state + ', ' + this.currentRecordPdf[0].organization.Address_Latest__c.postalCode, 137, 40);
            doc.text("ABN: " + this.currentRecordPdf[0].organization.ABN__c, 137, 45);

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(134, 60, 60, 27, "FD");

            doc.setFont("roboto", "bold");
            doc.setFontSize(10);
            doc.text("EMPLOYMENT DETAILS", 137, 68);
            doc.setFont("roboto", "");
            doc.setFontSize(10);

            doc.text("Pay Frequency: " + this.currentRecordPdf[0].staffpayrollData.Payroll_Setting__r.Frequency__c, 137, 76);
            doc.text(this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c, 10, 76);
            // console.log(this.currentRecordPdf[0].staffData.Address__c.street);
            doc.text(this.currentRecordPdf[0].staffData.Address__c.street + ', ' + this.currentRecordPdf[0].staffData.Address__c.city, 10, 81);
            doc.text(this.currentRecordPdf[0].staffData.Address__c.state + ', ' + this.currentRecordPdf[0].staffData.Address__c.postalCode, 10, 86);

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 92, 185, 10, "FD");

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 129, 185, 8, "FD");

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 157, 185, 8, "FD");

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 189, 185, 8, "FD");

            //Maheswari start few line 
            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 217, 185, 8, "FD");

            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(10, 228, 185, 8, "FD"); //225 maheswari code end

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
            if (nextPayDate != undefined || !nextPayDate == '' || !nextPayDate == null) {
                const arr2 = nextPayDate.split('-');
                const nextPayDateFinal = arr2[2] + '/' + arr2[1] + '/' + arr2[0];
                doc.text(nextPayDateFinal, 94, 98);
            }
            const newDate = arr[2] + '/' + arr[1] + '/' + arr[0];
            const newfinalDate = arr1[2] + '/' + arr1[1] + '/' + arr1[0];


            doc.setFont("roboto", "bold");
            doc.setFontSize(10);
            doc.text(newDate + ' - ' + newfinalDate, 30, 98);

            //console.log("New Date and Final Date: "+newDate + ' - ' + newfinalDate);
            // Subject for email
            this.subjectName = this.currentRecordPdf[0].staffData.Name + ' ' + this.currentRecordPdf[0].staffData.Last_Name__c + ' Pay slip for the period ' + newDate + ' to ' + newfinalDate;
            this.startEndDate = ' Please find attached your pay slip for the pay period ' + newDate + ' to ' + newfinalDate;
            this.orgName = this.currentRecordPdf[0].organization.Name;

            let dollarUSLocale = Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            });
            // console.log('value is',dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c));
            if (this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c == undefined) {
                doc.text("$0.00", 143, 98);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 143, 98);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Net_Pay__c == undefined) {
                doc.text("$0.00", 179, 98);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 179, 98);
            }

            doc.line(10, 112, 195, 112);
            doc.line(10, 216, 195, 216);
            doc.setFont("roboto", "bold");
            doc.setFontSize(10);
            doc.text("THIS PAY", 142, 110);
            doc.text("YTD", 182, 110);

            doc.text("SALARY & WAGES", 10, 120);
            doc.text("TAX", 10, 150);
            doc.text("PAYG", 10, 154);
            doc.text("TOTAL", 122, 162);
            doc.text("TOTAL", 122, 194);

            doc.text("SUPERANNUATION", 10, 176);

            doc.setFont("roboto", "");
            doc.setFontSize(10);
            doc.text("Pre TAX", 10, 143);
            doc.text("Ordinary Hours", 10, 126);

            if (this.currentRecordPdf[0].staffData.Superannuation_Number__c == undefined) {
                doc.text("Guaranteed Superannuation", 10, 181);
            } else {
                doc.text("Super Annuation | Account Number - " + this.currentRecordPdf[0].staffData.Superannuation_Number__c, 10, 181);
            }
            // doc.text("Post TAX",10,201);
            if (this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c) {
                if (this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution__c == 'Fixed') {
                    doc.text("Voluntary Superannuation-Fixed", 10, 186);
                    doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Fixed__c.toFixed(2)), 144, 186);
                } else {
                    doc.text("Voluntary Superannuation-Percentage (" + this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c + "%)", 10, 186);
                    // doc.text(this.currentRecordPdf[0].staffpayrollData.Voluntary_Contribution_Percent__c +"%", 97, 186);
                    doc.text(dollarUSLocale.format(parseFloat(this.currentRecordPdf[0].staffpayrollData.Voluntary_Percent_Values__c.toFixed(2))), 144, 186);
                }
            } else {
                doc.text("Voluntary Superannuation", 10, 186);
                doc.text("$0.00", 144, 186);
            }
            if (this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c == undefined) {
                doc.text("$0.00", 179, 186);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Voluntary_Superannuation_YTD__c.toFixed(2)), 179, 186);
            }
            doc.setFont("roboto", "bold");
            doc.text("Post Tax Deductions ", 10, 201);
            doc.setFont("roboto", "");
            let posttaxRow = 5
            if (this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c != undefined) {
                doc.text(this.currentRecordPdf[0].staffpayrollData.Post_Tax_Decription__c, 10, 206);
                posttaxRow = 0
            }
            doc.text("Reimbursements", 10, 211);
            if (this.currentRecordPdf[0].staffpayrollData.Type_of_User__c == 'ICT User') {
                doc.setFont("roboto", "bold");
                doc.text("RATE", 122, 120);
                doc.setFont("roboto", "");
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffData.Working_Hours_Rate__c.toFixed(2)), 120, 126);
            }

            doc.text("TOTAL", 122, 134);
            doc.setDrawColor(229, 229, 229);
            doc.setFillColor(229, 229, 229);
            doc.rect(212, 15, 60, 37, "FD");
            doc.text("Gross Salary", 12, 222); //222
            doc.text("NET SALARY", 12, 233); //230

            doc.text(this.currentRecordPdf[0].staffpayrollData.Working_Hours__c.toFixed(2), 97, 126);

            //Net Salary
            if (this.currentRecordPdf[0].staffpayrollData.Net_Pay__c == undefined) {
                doc.text("$0.00", 144, 233); //230
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Net_Pay__c.toFixed(2)), 144, 233); //230
            }

            //Net YTD Salary
            if (this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c == undefined) {
                doc.text("$0.00", 177, 233); //230
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Net_Pay_Salary_YTD__c.toFixed(2)), 177, 233); //230
            }


            if (this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c == undefined) {
                doc.text("$0.00", 144, 126);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 126);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c == undefined) {
                doc.text("$0.00", 179, 126);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 126);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Tax__c == undefined) {
                doc.text("$0.00", 143, 154);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 143, 154);

            }
            if (this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c == undefined) {
                doc.text("$0.00", 179, 154);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 154);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Tax__c == undefined) {
                doc.text("$0.00", 143, 162);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Tax__c.toFixed(2)), 143, 162);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c == undefined) {
                doc.text("$0.00", 179, 162);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Tax_YTD__c.toFixed(2)), 179, 162);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c == undefined) {
                doc.text("$0.00", 144, 144);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Pre_tax_values__c.toFixed(2)), 144, 144);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c == undefined) {
                doc.text("$0.00", 179, 144);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Pre_Tax_YTD__c.toFixed(2)), 179, 144);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c == undefined) {
                doc.text("$0.00", 144, 206 - parseInt(posttaxRow));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Post_tax_values__c.toFixed(2)), 144, 206 - parseInt(posttaxRow));
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c == undefined) {
                doc.text("$0.00", 179, 206 - parseInt(posttaxRow));
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Post_Tax_YTD__c.toFixed(2)), 179, 206 - parseInt(posttaxRow));
            }

            //Gross Salary
            if (this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c == undefined) {
                doc.text("$0.00", 144, 222);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary_Display__c.toFixed(2)), 144, 222);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Reimbursements__c == undefined) {
                doc.text("$0.00", 144, 211);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Reimbursements__c.toFixed(2)), 144, 211);
            }

            //Gross Salary YTD        
            if (this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c == undefined) {
                doc.text("$0.00", 177, 222);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Taxble_Gross_Salary_YTD__c.toFixed(2)), 177, 222);
            }


            if (this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c == undefined) {
                doc.text("$0.00", 144, 179);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_Annuation_Final__c.toFixed(2)), 144, 179);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c == undefined) {
                doc.text("$0.00", 179, 179);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Superannuation_YTD__c.toFixed(2)), 179, 179);
            }

            doc.setFont("roboto", "bold");
            doc.setFontSize(10);

            if (this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c == undefined) {
                doc.text("$0.00", 144, 134);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Gross_Salary__c.toFixed(2)), 144, 134);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c == undefined) {
                doc.text("$0.00", 179, 134);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Salary_Wages_YTD__c.toFixed(2)), 179, 134);
            }

            if (this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c == undefined) {
                doc.text("$0.00", 144, 194);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Super_And_Voluntary_Supper_Annuation__c.toFixed(2)), 144, 194);
            }
            if (this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c == undefined) {
                doc.text("$0.00", 179, 194);
            } else {
                doc.text(dollarUSLocale.format(this.currentRecordPdf[0].staffpayrollData.Current_Super_and_Voluntaryannuation_YTD__c.toFixed(2)), 179, 194);
            }
        }
        /*  var paySlipName = this.currentRecordPdf[0].staffpayrollData.Name; */
        var paySlipName = this.currentRecordPdf[0].staffpayrollData.Name;
        var docName = paySlipName + '.pdf';
        // console.log('public holiday');
        this.base64string = btoa(doc.output());
        // console.log('public staffEmail',this.currentRecordPdf[0].staffpayrollData.Email_Address__c);
        this.staffEmail = this.currentRecordPdf[0].staffData.Email_Address__c;
        //doc.save(paySlipName);        
        uploadFile({
            base64: JSON.stringify(this.base64string),
            filename: docName,
            recordId: this.currentRecordPdf[0].staffpayrollData.Id,
            obj: 'audit'
        }).then(result => {
            // console.log('data'); 
            const event = new ShowToastEvent({
                title: '',
                message: 'Pay Slip ' + docName + ' generated successfully',
                variant: 'Success',
                mode: 'dismissable'
            });
            this.dispatchEvent(event);

        }).catch(error => {
            console.error('Received error from server: ', error);
        });

        // this.handleClick();
    }
    handleClick() {
        // console.log('data',JSON.stringify(this.base64string) );
        emailAttach({
            base64: JSON.stringify(this.base64string),
            staffEmail: this.staffEmail,
            subjectName: this.subjectName,
            startEndDate: this.startEndDate,
            orgEmail: this.orgEmail,
            orgName: this.orgName
        }).then(result => {
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
    @track csvHeaders = ['Payee TFN Number', 'Payee ABN Number', 'Payee Staff ID', 'Payee First Name', 'Payee Last Name', 'Payee Other Name', 'Payee Date of Birth', 'Current Payee Tax', 'Current Payee Gross Salary', 'Payee Prvious Payroll ID', 'Payee Street', 'Payee City', 'Payee Postal Code', 'Payee State Code', 'Payee Country Code', 'Payee Email Address', 'Payee Contact Number', 'Payee Emp Start Date', 'Payee Emp Exit Date', 'Payee Emploement Basis Code', 'Payee Exit Reason Code', 'Payee Tax Treatment Code', 'Payee Tax Offset Amount', 'Payee Period Start Date', 'Payee Period End Date', 'Payee Final Event Indicator', 'Payee Income Stream Type Code', 'Payee Country Code', 'Payee Current Tax YTD', 'Payee Foreign Tax Paid Amount', 'Payee Exempt Foreign Income Amount', 'Payee Current Taxable Gross salary YTD', 'Payee Paid Leaves', 'Payee Allowances', 'Payee Over Time Amount', 'Payee Bonuses And Commissions Amount', 'Payee Directors Fee Amount', 'Payee Salary Sacrifices', 'Payee Lump Sum Amount', 'Payee Super Entitlement Type Code', 'Payee Super Entitlement Amount', 'Payee Reportabale Fringe Amount Benifits']; // 'Payer BMS ID', 'Payer ABN', 'Payer Branch Code', 'Payer Name', 'Payer Contact Name','Payer Email','Payer Phone','Payer Postal Code',
    @track csvPayerHeaders = ['BMS Identifier', 'Payer Australian Business Number', 'Payer Withholding Payer Number', 'Payer Branch Code', 'Previous BMS Identifier', 'Payer Organisation Name', 'Payer Contact Name', 'Payer E-mail Address', 'Payer Business Hours Phone Number', 'Payer Postcode', 'Payer Country Code', 'Pay/Update Date', 'Payee Record Count', 'Run Date/Time Stamp', 'Submission ID', 'Full File Replacement Indicator', 'Payer Total PAYGW Amount', 'Payer Total Gross Payments Amount', 'Child Support Total Garnishee Amount', 'Child Support Total Deductions Amount', 'Payer Declarer Identifier', 'Payer Declaration Date (UTC)', 'Payer Declaration Acceptance Indicator'];

    handleExportCSV(event) {
        this.showCsvExtract = true;
        //alert("Export to CSV");
        this.paysetId = event.currentTarget.dataset.id;
        accpetedStaffPayroll({
            payrollId: this.paysetId
        }).then(response => {
            this.stpCSVTable = response;
            this.csvOrgBmsID = response[0].Org_BMSId__c;
            this.csvOrgABNNum = response[0].Org_ABN__c;
            this.csvOrgBranchCode = response[0].Staff__r.Facility__r.Organisation__r.Branch_code__c;
            this.csvOrgName = response[0].Org_Name__c;
            this.csvOrgContactName = response[0].Staff__r.Facility__r.Organisation__r.Contact_Name__c;
            this.csvOrgEmail = response[0].orgEmail__c;
            this.csvOrgPhone = response[0].Org_Phone__c;
            this.csvOrgPostalCode = response[0].OrgPostalCode__c;
            this.csvOrgCountryCode = 'AU';
        });
    }

    handlecloseCsv() {
        this.showCsvExtract = false;
    }

    handleDownloadCSV() {
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
        doc += '<td style="font-size: 17px; font-family: Calibri;">' + this.csvOrgBmsID + '</td>';
        if (this.csvOrgABNNum) {
            doc += '<td style="font-size: 17px; font-family: Calibri;text-align:right;">' + this.csvOrgABNNum + '</td>';
        } else {
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
        let PayerTotalPAYGWAmount = 0;
        let PayerTotalGrossPaymentsAmount = 0;
        this.stpCSVTable.forEach(fieldsData => {
            PayerTotalPAYGWAmount = PayerTotalPAYGWAmount + fieldsData.Tax__c; ////// Last Tax YTD + Current
            PayerTotalGrossPaymentsAmount = PayerTotalGrossPaymentsAmount + fieldsData.Gross_Salary_Display__c;
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

            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.TFN_number__c + '</td>';
            if (fieldsData.Staff__r.ABN_Number__c) {
                doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + fieldsData.Staff__r.ABN_Number__c + '</td>';
            } else {
                doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + 'No Data' + '</td>';
            }
            //doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' +  fieldsData.Staff__r.ABN_Number__c+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; ">' + fieldsData.Staff__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Name + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Last_Name__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Date_Of_Birth__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + fieldsData.Tax__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + fieldsData.Gross_Salary_Display__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Address__Street__s + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Address__City__s + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + fieldsData.Staff__r.Address__PostalCode__s + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Address__StateCode__s + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'AU' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Email_Address__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + fieldsData.Staff__r.Contact_Number__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Emp_Start_Date__c + '</td>';

            if (fieldsData.Staff__r.Emp_exit_date__c) {
                doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Emp_exit_date__c + '</td>';
            } else {
                doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'No Data' + '</td>';
            }

            // doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Emp_exit_date__c+ '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'F' + '</td>';
            if (fieldsData.Staff__r.Exit_Reason_Code__c) {
                doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Staff__r.Exit_Reason_Code__c + '</td>';
            } else {
                doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'No Data' + '</td>';
            }
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'RDXXXX' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Payroll_Setting__r.Period_Start_Date__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + fieldsData.Payroll_Setting__r.Period_End_Date__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'false' + '</td>';

            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'SAW' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + fieldsData.Current_Tax_YTD__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:right;">' + fieldsData.Current_Taxble_Gross_Salary_YTD__c + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';

            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri; text-align:center;">' + 'NULL' + '</td>';
            doc += '<td style="font-size: 17px; font-family: Calibri;">' + 'L' + '</td>';
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
    handleSearch(event) {
        var sname = event.target.name;

        if (event.target.name == 'SearchPayroll') {
            this.searchGroupName = event.detail.value;
            // console.log('Payroll GroupName>>>'+this.searchGroupName);
        }
        if (event.target.name == 'status') {
            this.payrollStatus = event.detail.value;

        }
        //console.log('Payroll status>>>'+this.payrollStatus);
        fetchPayrollStaff1({
            payrollGroupName: this.searchGroupName,
            Status: this.payrollStatus
        }).then(response => {
            this.payrunSetting = response;
            // console.log('Response>>>'+JSON.stringify(response));
            var options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            let tempConList = [];
            let tempConListExceptDraft = [];
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                // tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                if (record.Staff_Payroll_Settings__r) {
                    let childPayruns = record.Staff_Payroll_Settings__r;
                    // console.log('childs Payruns '+JSON.stringify(childPayruns));
                    childPayruns.forEach(rec => {
                        tempConRec.paymentDate = new Date(rec.Pay_Date__c).toLocaleDateString('en-GB');
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
                } else {
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

    /* fetchPayrun() {
        fetchPayrollStaff1({
            payrollGroupName: this.searchGroupName,
            Status: this.payrollStatus
        }).then(response => {
            this.payrunSetting = response;
            // console.log('Response>>>'+JSON.stringify(response));
            var options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            let tempConList = [];
            let tempConListExceptDraft = [];
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                // tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                if (record.Staff_Payroll_Settings__r) {
                    let childPayruns = record.Staff_Payroll_Settings__r;
                    //console.log('childs Payruns '+JSON.stringify(childPayruns));
                    childPayruns.forEach(rec => {
                        tempConRec.paymentDate = new Date(rec.Pay_Date__c).toLocaleDateString('en-GB');
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
                } else {
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
    } */

    fetchPayrun() {
        fetchPayrollStaff1({
            payrollGroupName: this.searchGroupName,
            Status: this.payrollStatus
        }).then(response => {
            this.payrunSetting = response;
            // console.log('Response>>>'+JSON.stringify(response));
            var options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            let tempConList = [];
            let tempConListExceptDraft = [];
            response.forEach((record) => {
                let tempConRec = Object.assign({}, record);
                // tempConRec.paymentDate = new Date(tempConRec.Next_Pay_Date__c).toLocaleDateString('en-GB');
                if (record.Staff_Payroll_Settings__r) {
                    let childPayruns = record.Staff_Payroll_Settings__r;
                    //console.log('childs Payruns '+JSON.stringify(childPayruns));
                    childPayruns.forEach(rec => {
                        tempConRec.paymentDate = new Date(rec.Pay_Date__c).toLocaleDateString('en-GB');
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
                } else {
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
        this.isopenPaysettings = false;
        this.isPayrollTitle = false;
    }

    closeModal() {
        this.isopenPaysettings = true;
        this.isModalOpen = false;
        this.currentUrl = null;
    }

    getFileName(url) {
        return url.substring(url.lastIndexOf('/') + 1);
    }

    /* handleSuperannuation() {
        processSuperannuation({ paySetId: this.paysetId })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Superannuation submitted successfully',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body ? error.body.message : error.message,
                        variant: 'error'
                    })
                );
            });
    } */

    /* get superannuationButtonDisabled() {
        return !this.fileStpbutton;
    } */

    /* get superannuationButtonDisabled() {
        // Disable if no paysetId, or if status is not appropriate
        return !this.paysetId || this.showProgress || this.statusValueTest === 'Draft';
    }

    get payButtonDisabled() {
        // Disable if no paysetId, if status is Draft, or if no employees with net pay
        return !this.paysetId || 
            this.statusValueTest === 'Draft' || 
            this.statusValueTest === 'Delete' ||
            this.showProgress;
    } */

    // ==========================================
    // SUPERANNUATION PROPERTIES
    // ==========================================
    showProgress = false;
    statusMessage = '';
    currentUploadUuid = '';
    validationSummary = null;
    showValidationErrorModal = false;
    validationErrorModalMessage = '';

    // Main method to handle Superannuation submission
    handleSuperannuation() {
        console.log('===== START handleSuperannuation =====');
        console.log('PaySetId:', this.paysetId);

        if (!this.paysetId) {
            console.error('ERROR: No PaySetId found');
            this.showValidationErrorModal = true;
            this.validationErrorModalMessage = 'No payroll setting selected. Please try again.';
            return;
        }

        this.showProgress = true;
        this.statusMessage = 'Validating employees...';

        processSuperannuation({
                paySetId: this.paysetId
            })
            .then(result => {
                console.log('processSuperannuation Response:', JSON.stringify(result));
                this.showProgress = false;

                if (result.success === false) {
                    console.error('ProcessSuperannuation returned failure:', result.message);
                    
                    if (result.failedEmployees && result.failedEmployees.length > 0) {
                        this.showValidationErrors(result.failedEmployees);
                    } else if (result.errorReport) {
                        this.showErrorReport(result.errorReport);
                    } else {
                        this.showValidationErrorModal = true;
                        this.validationErrorModalMessage = result.message || 'Failed to process superannuation';
                    }
                    return;
                }

                this.displayValidationSummary(result);

                const uploadUuid = result.uploadUuid;
                console.log('Upload UUID extracted:', uploadUuid);

                if (uploadUuid) {
                    this.currentUploadUuid = uploadUuid;
                    
                    // ==============================================
                    // FIXED: REMOVE AUTO-SEND AND STATUS POLLING
                    // ==============================================
                    // The upload is created with status UPLOAD_READY
                    // User must click "Pay" or "Process Payment" to send
                    // ==============================================
                    
                    this.statusMessage = 'Superannuation upload created successfully. Click "Pay" or "Process Payment" to send.';
                    this.showProgress = false;
                    
                    // Show success message
                    this.showToast('Success', `Superannuation created successfully. Click "Pay" or "Process Payment" to send.`, 'success');
                    
                } else {
                    console.warn('No upload UUID in response');
                    this.showProgress = false;
                    if (result.failedEmployees && result.failedEmployees.length > 0) {
                        this.showValidationErrors(result.failedEmployees);
                    } else {
                        this.showValidationErrors([]);
                    }
                }

                this.getValidationLogs();
            })
            .catch(error => {
                console.error('===== ERROR in handleSuperannuation =====');
                this.showProgress = false;

                let errorMessage = 'Failed to process superannuation. Please try again.';
                if (error.body) {
                    if (typeof error.body === 'object' && error.body.message) {
                        errorMessage = error.body.message;
                    } else if (typeof error.body === 'string') {
                        errorMessage = error.body;
                    }
                } else if (error.message) {
                    errorMessage = error.message;
                }

                this.showValidationErrorModal = true;
                this.validationErrorModalMessage = errorMessage;
            });
    }

    displayValidationSummary(result) {
        console.log('===== displayValidationSummary =====');

        this.validationSummary = result;

        let message = '';

        // Show total summary
        message += `📊 SUPERANNUATION SUMMARY\n`;
        message += '='.repeat(50) + '\n\n';
        message += `Total Employees: ${result.totalEmployees || 0}\n`;
        message += `✅ Valid: ${result.validEmployees || 0}\n`;
        message += `❌ Failed: ${result.failedEmployees ? result.failedEmployees.length : 0}\n`;
        
        // Show MVR status
        if (result.mvrFailedEmployees && result.mvrFailedEmployees.length > 0) {
            message += `🔄 MVR Required: ${result.mvrFailedEmployees.length}\n`;
            message += '   (Employees need MVR verification)\n';
        }

        // Show successful employees
        if (result.successfulEmployees && result.successfulEmployees.length > 0) {
            message += `\n✅ Successfully Processed (${result.successfulEmployees.length}):\n`;
            result.successfulEmployees.forEach(name => {
                message += `   • ${name}\n`;
            });
        }

        // Show upload UUID if available
        if (result.uploadUuid) {
            message += `\n📤 Upload ID: ${result.uploadUuid}\n`;
        }

        // Show MVR failed employees separately
        if (result.mvrFailedEmployees && result.mvrFailedEmployees.length > 0) {
            message += `\n⚠️ ${result.mvrFailedEmployees.length} employee(s) need MVR verification:\n`;
            result.mvrFailedEmployees.forEach(emp => {
                message += `   • ${emp.employeeName}\n`;
                if (emp.errors) {
                    emp.errors.forEach(error => {
                        message += `      - ${error}\n`;
                    });
                }
            });
            message += `\n💡 Please complete MVR verification and try again.`;
        } else if (result.failedEmployees && result.failedEmployees.length > 0) {
            message += `\n⚠️ ${result.failedEmployees.length} employee(s) failed validation.\n`;
            message += `Please check the error details below and retry.`;
            this.showValidationErrors(result.failedEmployees);
        } else {
            message += `\n✅ All employees validated successfully!`;
            this.showValidationErrors([]);
        }
    }

    showValidationErrors(failedEmployees) {
        console.log('===== showValidationErrors =====');

        // Build structured data with explicit flags
        this.validationErrorItems = [];
        
        // Add successful employees
        if (this.validationSummary && this.validationSummary.successfulEmployees && this.validationSummary.successfulEmployees.length > 0) {
            this.validationErrorItems.push({
                title: '✅ SUCCESSFULLY PROCESSED',
                items: this.validationSummary.successfulEmployees,
                isSuccess: true,
                isError: false,
                isInfo: false,
                isWarning: false,
                color: '#2e7d32',
                borderColor: '#4caf50',
                uploadId: null
            });
        }

        // Add upload UUID if available - FIXED: using uploadId property
        if (this.validationSummary && this.validationSummary.uploadUuid) {
            this.validationErrorItems.push({
                title: '📤 Upload ID',
                items: [],
                isSuccess: false,
                isError: false,
                isInfo: true,
                isWarning: false,
                color: '#0d47a1',
                borderColor: '#1976d2',
                uploadId: this.validationSummary.uploadUuid
            });
        }

        // Add failed employees
        if (failedEmployees && failedEmployees.length > 0) {
            const otherErrors = failedEmployees.filter(emp => 
                !emp.errors || !emp.errors.some(e => 
                    e.includes('MVR') || e.includes('verification')
                )
            );
            
            if (otherErrors.length > 0) {
                this.validationErrorItems.push({
                    title: '❌ OTHER VALIDATION ERRORS',
                    items: otherErrors.map(emp => ({
                        name: emp.employeeName || 'Unknown Employee',
                        errors: this.cleanErrorMessages(emp.errors || [])
                    })),
                    isSuccess: false,
                    isError: true,
                    isInfo: false,
                    isWarning: false,
                    color: '#d32f2f',
                    borderColor: '#d32f2f',
                    uploadId: null
                });
            }
        }

        this.showValidationErrorModal = true;
    }

    cleanErrorMessages(errors) {
        if (!errors || errors.length === 0) {
            return [];
        }
        
        const cleaned = [];
        const seenErrors = new Set();
        
        errors.forEach(error => {
            let cleanError = error
                .replace(/^Error\s+\d+:/, '')
                .replace(/^•\s*/, '')
                .replace(/^Issue:\s*/, '')
                .replace(/^Details:\s*/, '')
                .replace(/^Affected Fields:\s*/, '')
                .trim()
                .replace(/\s+/g, ' ');
            
            if (cleanError && cleanError.length > 0) {
                const lowerError = cleanError.toLowerCase();
                if (!seenErrors.has(lowerError)) {
                    seenErrors.add(lowerError);
                    cleaned.push(cleanError);
                }
            }
        });
        
        return cleaned;
    }

    /**
     * Creates a formatted HTML error box for a single employee
     */
    createErrorBoxHtml(employee, index) {
        const employeeName = employee.employeeName || 'Unknown Employee';
        const cleanErrors = this.cleanErrorMessages(employee.errors || []);
        
        let html = '';
        
        // Box container with shadow and border
        html += `<div style="border: 2px solid #d32f2f; border-radius: 8px; margin: 10px 0; 
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">`;
        
        // Header
        html += `<div style="background: #d32f2f; color: white; padding: 8px 15px; 
                            font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                    <span>${index + 1}. ${employeeName}</span>
                    <span style="background: white; color: #d32f2f; padding: 2px 10px; border-radius: 12px; font-size: 12px;">
                        ${employee.errors ? employee.errors.length : 0} Error(s)
                    </span>
                </div>`;
        
        // Body with errors
        html += `<div style="padding: 12px 15px; background: #fff5f5;">`;
        
        if (cleanErrors && cleanErrors.length > 0) {
            cleanErrors.forEach(error => {
                // Different styling for different error types
                let icon = '•';
                let color = '#d32f2f';
                
                if (error.toLowerCase().includes('tfn') || error.toLowerCase().includes('tax file number')) {
                    icon = '🔢';
                } else if (error.toLowerCase().includes('abn')) {
                    icon = '🏢';
                } else if (error.toLowerCase().includes('bsb')) {
                    icon = '🏦';
                } else if (error.toLowerCase().includes('account number')) {
                    icon = '💳';
                } else if (error.toLowerCase().includes('member')) {
                    icon = '👤';
                } else if (error.toLowerCase().includes('fund')) {
                    icon = '💰';
                } else if (error.toLowerCase().includes('missing')) {
                    icon = '❌';
                } else if (error.toLowerCase().includes('invalid')) {
                    icon = '⚠️';
                }
                
                html += `<div style="padding: 4px 0; display: flex; align-items: flex-start; gap: 8px;">
                            <span style="color: ${color}; min-width: 20px;">${icon}</span>
                            <span style="color: #333;">${error}</span>
                        </div>`;
            });
        } else {
            html += `<div style="color: #999; padding: 4px 0;">No specific errors provided.</div>`;
        }
        
        html += `</div>`;
        html += `</div>`;
        
        return html;
    }

    /**
     * Cleans and formats error messages
     */
    cleanErrorMessages(errors) {
        if (!errors || errors.length === 0) {
            return [];
        }
        
        const cleaned = [];
        const seenErrors = new Set();
        
        errors.forEach(error => {
            // Clean up the error message
            let cleanError = error
                .replace(/^Error\s+\d+:/, '')
                .replace(/^•\s*/, '')
                .replace(/^Issue:\s*/, '')
                .replace(/^Details:\s*/, '')
                .replace(/^Affected Fields:\s*/, '')
                .trim();
            
            // Remove duplicate spaces
            cleanError = cleanError.replace(/\s+/g, ' ').trim();
            
            // Skip empty errors
            if (!cleanError || cleanError.length === 0) {
                return;
            }
            
            // Skip duplicate errors (case insensitive)
            const lowerError = cleanError.toLowerCase();
            if (seenErrors.has(lowerError)) {
                return;
            }
            seenErrors.add(lowerError);
            
            cleaned.push(cleanError);
        });
        
        return cleaned;
    }

    /**
     * Creates a formatted error box for a single employee
     */
    createErrorBox(employee, index) {
        let box = '';
        const employeeName = employee.employeeName || 'Unknown Employee';
        
        // Box header
        box += '┌' + '─'.repeat(68) + '┐\n';
        box += `│ ${index + 1}. ${employeeName.padEnd(60)} │\n`;
        box += '├' + '─'.repeat(68) + '┤\n';
        
        // Errors
        if (employee.errors && employee.errors.length > 0) {
            employee.errors.forEach((error, i) => {
                // Clean up the error message
                let cleanError = error
                    .replace(/^Error\s+\d+:/, '')
                    .replace(/^•\s*/, '')
                    .replace(/^Issue:\s*/, '')
                    .trim();
                
                // Truncate if too long
                if (cleanError.length > 60) {
                    cleanError = cleanError.substring(0, 57) + '...';
                }
                
                box += `│ • ${cleanError.padEnd(66)} │\n`;
            });
        } else {
            box += `│ No specific errors provided.${' '.repeat(43)} │\n`;
        }
        
        // Box footer
        box += '└' + '─'.repeat(68) + '┘\n';
        box += '\n';
        
        return box;
    }


    /**
     * Formats individual employee errors with clean error messages
     */
    formatEmployeeErrors(employee) {
        if (!employee || !employee.errors || employee.errors.length === 0) {
            return '• No errors reported';
        }
        
        const errorMessages = [];
        employee.errors.forEach(error => {
            // Clean up the error message
            let cleanError = error
                .replace(/^Error\s+\d+:/, '')
                .replace(/^•\s*/, '')
                .replace(/^Issue:\s*/, '')
                .replace(/^Details:\s*/, '')
                .trim();
            
            // Extract field info if present
            let fieldInfo = '';
            if (cleanError.includes('The Tax File Number')) {
                const match = cleanError.match(/The Tax File Number\s+(\d+)/);
                if (match) {
                    fieldInfo = `TFN: ${match[1]}`;
                }
            } else if (cleanError.includes('Superannuation Fund Member')) {
                fieldInfo = 'Member ID';
            } else if (cleanError.includes('ABN')) {
                const match = cleanError.match(/ABN\s+(\d+)/);
                if (match) {
                    fieldInfo = `ABN: ${match[1]}`;
                }
            } else if (cleanError.includes('USI')) {
                fieldInfo = 'USI';
            }
            
            // Build final error message
            let finalMessage = cleanError;
            if (fieldInfo) {
                finalMessage = `${fieldInfo}: ${cleanError}`;
            }
            
            // Remove the field info from the message if it's already there
            finalMessage = finalMessage.replace(/^(TFN|ABN|USI|Member ID):\s*/, '');
            
            errorMessages.push(finalMessage);
        });
        
        return errorMessages.join('\n• ');
    }

    @track validationErrorItems = [];
    @track showValidationErrorModal = false;

    closeValidationModal() {
        this.showValidationErrorModal = false;
        this.validationErrorItems = [];
    }

    showErrorReport(errorReport) {
        console.log('===== showErrorReport =====');
        this.validationErrorModalMessage = errorReport;
        this.showValidationErrorModal = true;
    }

    pollStatus(uploadUuid) {
        console.log('===== START pollStatus =====');

        if (!uploadUuid) {
            this.showToast('Error', 'Invalid upload ID for status check', 'error');
            this.showProgress = false;
            return;
        }

        let attempts = 0;
        const maxAttempts = 24;
        const interval = 5000;

        this.showProgress = true;
        this.statusMessage = 'Processing upload (attempt 0/' + maxAttempts + ')...';

        const statusInterval = setInterval(() => {
            attempts++;
            this.statusMessage = 'Processing upload (attempt ' + attempts + '/' + maxAttempts + ')...';

            checkContributionStatus({
                    uploadUuid: uploadUuid
                })
                .then(result => {
                    const status = result.uploadStatus;
                    console.log('Current Status:', status);
                    this.statusMessage = 'Status: ' + (status || 'Unknown');

                    // Handle ALL success statuses
                    if (status === 'UPLOAD_READY') {
                        clearInterval(statusInterval);
                        this.statusMessage = 'Sending to super fund...';
                        this.sendContribution(uploadUuid);

                    } else if (status === 'UPLOAD_COMPLETED' ||
                        status === 'SENT' ||
                        status === 'UPLOAD_SEND_SUCCESS' ||
                        status === 'UPLOAD_SENT') {
                        clearInterval(statusInterval);
                        this.showProgress = false;
                        this.showToast('Success', 'Superannuation processed successfully', 'success');

                    } else if (status === 'UPLOAD_FAILED') {
                        clearInterval(statusInterval);
                        this.showProgress = false;

                        if (result.errors) {
                            let errorMsg = 'Validation failed: ';
                            if (Array.isArray(result.errors)) {
                                errorMsg += result.errors.map(e => e.message || JSON.stringify(e)).join('; ');
                            } else {
                                errorMsg += JSON.stringify(result.errors);
                            }
                            this.showToast('Upload Failed', errorMsg, 'error');
                        } else {
                            this.showToast('Upload Failed', 'Validation failed. Please check the data.', 'error');
                        }

                    } else if (attempts >= maxAttempts) {
                        clearInterval(statusInterval);
                        this.showProgress = false;
                        this.showWarning('Upload is taking longer than expected. Please check status later.');
                    }
                })
                .catch(error => {
                    console.error('Error in polling:', error);
                    this.statusMessage = 'Status check failed. Retrying...';
                });
        }, interval);
    }

    sendContribution(uploadUuid) {
        console.log('===== START sendContribution =====');
        console.log('Upload UUID:', uploadUuid);

        if (!uploadUuid) {
            this.showProgress = false;
            this.validationErrorModalMessage = 'Invalid upload ID for sending';
            this.showValidationErrorModal = true;
            return;
        }

        this.statusMessage = 'Sending to super fund...';
        console.log('Status Message:', this.statusMessage);

        console.log('Calling sendContribution Apex...');
        sendContribution({
                uploadUuid: uploadUuid
            })
            .then(result => {
                console.log('sendContribution Response:', JSON.stringify(result));

                if (result.success === true) {
                    console.log('SUCCESS: Contribution sent to super fund');
                    this.showProgress = false;
                    this.showValidationErrorModal = true;

                    console.log('Starting final status polling...');
                    this.pollFinalStatus(uploadUuid);
                    return;
                }

                if (result && result.message) {
                    console.error('Send returned error:', result.message);
                    this.showProgress = false;

                    if (result.message.includes('no content to map to Object') ||
                        result.message.includes('end of input')) {
                        this.validationErrorModalMessage = '⚠️ Contribution sent but received empty response from OZEDI. Please check status manually.';
                        this.showValidationErrorModal = true;
                        this.pollFinalStatus(uploadUuid);
                        return;
                    }

                    this.validationErrorModalMessage = result.message;
                    this.showValidationErrorModal = true;
                    return;
                }

                this.showProgress = false;
                this.validationErrorModalMessage = 'Unexpected response from server';
                this.showValidationErrorModal = true;
            })
            .catch(error => {
                console.error('===== ERROR IN sendContribution =====');
                console.error('Upload UUID:', uploadUuid);
                console.error('Error Object:', JSON.stringify(error));
                console.error('Error Message:', error.message || 'Unknown error');
                console.error('Error Body:', error.body);

                this.showProgress = false;

                let errorMessage = 'Failed to send contribution. Please try again.';
                let shouldCheckStatus = false;

                if (error && error.body) {
                    if (typeof error.body === 'object') {
                        if (error.body.message) {
                            errorMessage = error.body.message;
                            if (errorMessage.includes('no content to map to Object') ||
                                errorMessage.includes('end of input')) {
                                shouldCheckStatus = true;
                                errorMessage = '⚠️ Contribution sent but received empty response. Please check status.';
                            }
                        }
                    } else if (typeof error.body === 'string') {
                        try {
                            const parsedBody = JSON.parse(error.body);
                            if (parsedBody && parsedBody.message) {
                                errorMessage = parsedBody.message;
                                if (errorMessage.includes('no content to map to Object') ||
                                    errorMessage.includes('end of input')) {
                                    shouldCheckStatus = true;
                                    errorMessage = '⚠️ Contribution sent but received empty response. Please check status.';
                                }
                            }
                        } catch (e) {
                            errorMessage = error.body;
                        }
                    }
                } else if (error && error.message) {
                    errorMessage = error.message;
                    if (errorMessage.includes('no content to map to Object') ||
                        errorMessage.includes('end of input')) {
                        shouldCheckStatus = true;
                        errorMessage = '⚠️ Contribution sent but received empty response. Please check status.';
                    }
                }

                this.validationErrorModalMessage = errorMessage;
                this.showValidationErrorModal = true;

                if (shouldCheckStatus) {
                    this.pollFinalStatus(uploadUuid);
                }
            });
    }

    pollFinalStatus(uploadUuid) {
        console.log('===== START pollFinalStatus =====');

        if (!uploadUuid) {
            console.warn('No upload UUID for final status polling');
            this.showProgress = false;
            return;
        }

        let attempts = 0;
        const maxAttempts = 8;
        const interval = 5000;

        this.statusMessage = 'Checking final status...';
        this.showProgress = true;

        const statusInterval = setInterval(() => {
            attempts++;
            console.log('Final status attempt:', attempts, 'of', maxAttempts);

            checkContributionStatus({
                    uploadUuid: uploadUuid
                })
                .then(result => {
                    console.log('Final Status Response:', JSON.stringify(result));

                    if (!result) {
                        console.warn('Empty result received');
                        if (attempts >= maxAttempts) {
                            clearInterval(statusInterval);
                            this.showProgress = false;
                            this.showToast('Status Check', 'Unable to get final status. Please check manually.', 'warning');
                        }
                        return;
                    }

                    const status = result.uploadStatus;
                    console.log('Final Status:', status);
                    this.statusMessage = 'Final Status: ' + (status || 'Unknown');

                    // Handle ALL success statuses
                    if (status === 'UPLOAD_COMPLETED' ||
                        status === 'SENT' ||
                        status === 'UPLOAD_SEND_SUCCESS' ||
                        status === 'UPLOAD_SENT') {

                        console.log('=== FINAL STATUS: SUCCESS ===');
                        clearInterval(statusInterval);
                        this.showProgress = false;
                        this.showToast('Success', 'Contribution has been successfully processed by the super fund.', 'success');

                    } else if (status === 'UPLOAD_FAILED') {
                        clearInterval(statusInterval);
                        this.showProgress = false;
                        this.showToast('Final Status', 'Contribution failed to process. Please check OZEDI logs.', 'error');

                    } else if (status === 'UPLOAD_READY') {
                        // Upload is ready but not sent yet - try sending again
                        clearInterval(statusInterval);
                        this.statusMessage = 'Retrying send...';
                        this.sendContribution(uploadUuid);

                    } else if (status === 'UPLOAD_PROCESSING' ||
                        status === 'UPLOAD_PRE_PROCESSING' ||
                        status === 'UPLOAD_RECEIVED') {
                        // Still processing, continue polling
                        console.log('Still processing...');

                    } else if (status === 'UPLOAD_NOT_FOUND') {
                        console.warn('Upload not found yet');

                    } else if (attempts >= maxAttempts) {
                        clearInterval(statusInterval);
                        this.showProgress = false;
                        this.showToast('Status Check', 'Still processing. Please check status later using the "Check Status" button.', 'warning');

                    } else {
                        console.log('Unknown status:', status, 'continuing polling...');
                    }
                })
                .catch(error => {
                    console.error('Error in final status polling:', error);
                    this.statusMessage = 'Status check failed. Retrying...';

                    if (attempts >= maxAttempts) {
                        clearInterval(statusInterval);
                        this.showProgress = false;
                        this.showToast('Status Check', 'Unable to check final status. Please use "Check Status" button.', 'warning');
                    }
                });
        }, interval);

        console.log('Final status polling started - checking every', interval / 1000, 'seconds');
    }

    handleRetryFailed() {
        console.log('===== START handleRetryFailed =====');

        if (!this.paysetId) {
            this.validationErrorModalMessage = 'No payroll setting selected.';
            this.showValidationErrorModal = true;
            return;
        }

        if (!this.validationSummary || !this.validationSummary.failedEmployees || this.validationSummary.failedEmployees.length === 0) {
            this.validationErrorModalMessage = 'No failed employees to retry.';
            this.showValidationErrorModal = true;
            return;
        }

        this.showProgress = true;
        this.statusMessage = 'Retrying failed employees...';

        /* retryFailedContributions({
                paySetId: this.paysetId
            })
            .then(result => {
                console.log('Retry Response:', JSON.stringify(result));
                this.showProgress = false;

                if (result.success) {
                    let message = '';
                    if (result.retriedEmployees && result.retriedEmployees.length > 0) {
                        message += `✅ ${result.retriedEmployees.length} employee(s) retried successfully.\n`;
                    }
                    if (result.stillFailedEmployees && result.stillFailedEmployees.length > 0) {
                        message += `⚠️ ${result.stillFailedEmployees.length} employee(s) still have errors.\n`;
                        this.validationSummary = result;
                        this.showValidationErrors(result.stillFailedEmployees);
                    } else {
                        message += 'All employees processed successfully!';
                        this.validationSummary = result;
                        this.validationErrorModalMessage = message;
                        this.showValidationErrorModal = true;
                    }
                } else {
                    this.validationErrorModalMessage = result.message || 'Retry failed';
                    this.showValidationErrorModal = true;
                }
            })
            .catch(error => {
                console.error('Retry Error:', error);
                this.showProgress = false;
                this.validationErrorModalMessage = 'Failed to retry: ' + (error.message || 'Unknown error');
                this.showValidationErrorModal = true;
            }); */
    }

    handleCheckStatus() {
        console.log('===== START handleCheckStatus =====');

        if (!this.currentUploadUuid) {
            this.validationErrorModalMessage = 'No upload ID to check. Please submit superannuation first.';
            this.showValidationErrorModal = true;
            return;
        }

        this.showProgress = true;
        this.statusMessage = 'Checking status...';

        checkContributionStatus({
                uploadUuid: this.currentUploadUuid
            })
            .then(result => {
                console.log('Status Check Result:', result);
                this.showProgress = false;

                const status = result.uploadStatus;
                this.statusMessage = 'Status: ' + (status || 'Unknown');

                let message = 'Current Status: ' + (status || 'Unknown');
                if (result.errors) {
                    message += '\nErrors: ' + JSON.stringify(result.errors);
                }
                if (result.message) {
                    message += '\nMessage: ' + result.message;
                }

                this.validationErrorModalMessage = message;
                this.showValidationErrorModal = true;
            })
            .catch(error => {
                console.error('Status Check Error:', error);
                this.showProgress = false;
                this.validationErrorModalMessage = 'Failed to check status: ' + (error.message || 'Unknown error');
                this.showValidationErrorModal = true;
            });
    }

    handleViewValidationHistory() {
        console.log('===== START handleViewValidationHistory =====');

        if (!this.paysetId) {
            this.validationErrorModalMessage = 'No payroll setting selected.';
            this.showValidationErrorModal = true;
            return;
        }

        this.showProgress = true;
        this.statusMessage = 'Loading validation history...';

        getValidationSummary({
                paySetId: this.paysetId
            })
            .then(result => {
                console.log('Validation Summary:', JSON.stringify(result));
                this.showProgress = false;

                let message = `📊 VALIDATION HISTORY:\n\n`;
                message += `Total Validations: ${result.totalValidations || 0}\n`;
                message += `✅ Valid: ${result.validCount || 0}\n`;
                message += `❌ Failed: ${result.failedCount || 0}\n`;
                message += `📤 Processed by OZEDI: ${result.processedCount || 0}\n`;
                if (result.latestValidationDate) {
                    const date = new Date(result.latestValidationDate);
                    message += `\nLast Validation: ${date.toLocaleString()}`;
                }

                this.validationErrorModalMessage = message;
                this.showValidationErrorModal = true;
            })
            .catch(error => {
                console.error('Error getting validation history:', error);
                this.showProgress = false;
                this.validationErrorModalMessage = 'Failed to get validation history: ' + (error.message || 'Unknown error');
                this.showValidationErrorModal = true;
            });
    }

    showToast(title, message, variant) {
        // This method is now only for non-superannuation toasts
        // Superannuation messages go to the modal
        try {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: title,
                    message: message,
                    variant: variant || 'info',
                    mode: 'dismissable'
                })
            );
        } catch (error) {
            console.error('Failed to dispatch toast notification:', error);
        }
    }

    showSuccess(message) {
        this.showProgress = false;
        this.showToast('Success', message, 'success');
    }

    showWarning(message) {
        this.showProgress = false;
        this.showToast('Warning', message, 'warning');
    }

    /* get superannuationButtonDisabled() {
        return !this.paysetId || this.showProgress;
    } */

    get retryButtonDisabled() {
        if (this.showProgress) return true;
        if (!this.validationSummary) return true;
        if (!this.validationSummary.failedEmployees) return true;
        return this.validationSummary.failedEmployees.length === 0;
    }

    get checkStatusButtonDisabled() {
        return !this.currentUploadUuid || this.showProgress;
    }

    get hasFailedEmployees() {
        if (!this.validationSummary) return false;
        if (!this.validationSummary.failedEmployees) return false;
        return this.validationSummary.failedEmployees.length > 0;
    }

    // ==========================================
    // HANDLE CLOSE PARENT AND OPEN NEW
    // ==========================================

    @track currentPayrunId = null;

    handleCloseParentAndOpenNew(event) {
        console.log('===== START handleCloseParentAndOpenNew =====');
        console.log('Event received:', event);
        console.log('Event detail:', JSON.stringify(event.detail || {}));
        
        // Close ALL existing components/templates
        this.showSignatureTemplate = false;
        this.isopenPaysettings = false;
        this.ispayrun = false;
        this.isaddpayrun = false;
        this.payrunEdit = false;
        this.payruneditFlag = false;
        this.isModalOpen = false;
        this.childPdf = false;
        this.showCsvExtract = false;
        this.isFileSTP = false;
        this.showProgressbar = false;
        this.showValidationErrorModal = false;
        console.log('✅ All components closed successfully');
        
        // Get data from the event
        const detail = event.detail || {};
        const status = detail.status || 'Info';
        const parentPaysetId = detail.parentPaysetId || this.paysetId || 'N/A';
        const logsFromChild = detail.validationLogs || [];
        const hasValidationLogsFromChild = detail.hasValidationLogs || false;
        
        // Store the parent payset ID for later use when going back
        this.currentPayrunId = parentPaysetId !== 'N/A' ? parentPaysetId : null;
        console.log('Stored current payrun ID for back navigation:', this.currentPayrunId);
        console.log('Validation logs from child:', logsFromChild.length, 'hasValidationLogs:', hasValidationLogsFromChild);
        
        // Determine status flags for CSS classes
        let isSuccess = false;
        let isFailed = false;
        let isProgress = false;
        let isInfo = false;
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('success')) {
            isSuccess = true;
            console.log('  Status flags: SUCCESS');
        } else if (statusLower.includes('failed') || statusLower.includes('error')) {
            isFailed = true;
            console.log('  Status flags: FAILED');
        } else if (statusLower.includes('progress') || statusLower.includes('in progress') || statusLower.includes('processing')) {
            isProgress = true;
            console.log('  Status flags: IN PROGRESS');
        } else {
            isInfo = true;
            console.log('  Status flags: INFO (default)');
        }
        
        // Format dates
        const formattedDate = this.formatDisplayDate(detail.date);
        const formattedDeclarationDate = this.formatDisplayDate(detail.declarationDate);
        
        // Store the data first
        this.moreDetailsData = {
            type: detail.type || 'Superannuation',
            refId: detail.refId || 'N/A',
            status: status,
            isSuccess: isSuccess,
            isFailed: isFailed,
            isProgress: isProgress,
            isInfo: isInfo,
            date: formattedDate,
            declarationDate: formattedDeclarationDate,
            response: detail.response || 'No response available',
            parentPaysetId: parentPaysetId,
            validationLogs: [],
            totalValidationLogs: 0,
            validationDetails: null
        };
        
        // Reset full response view
        this.showFullResponse = false;
        console.log('✓ showFullResponse set to false');
        
        // Process validation logs - CHECK IF WE HAVE LOGS FROM CHILD FIRST
        if (logsFromChild && logsFromChild.length > 0) {
            console.log('✅ Using validation logs from child:', logsFromChild.length);
            const processedLogs = this.processValidationLogs(logsFromChild);
            this.validationLogs = processedLogs;
            this.updateValidationLogs(processedLogs);
            this.moreDetailsData.validationLogs = processedLogs;
            this.moreDetailsData.totalValidationLogs = processedLogs.length;
            this.showRetryButton = processedLogs.some(log => log.isFailed);
            this.showMoreDetailsTemplate = true;
            console.log('✓ showMoreDetailsTemplate set to true (from child logs)');
        } else if (parentPaysetId !== 'N/A' && parentPaysetId !== null && parentPaysetId !== undefined) {
            // If no logs from child, try to fetch from Apex
            console.log('No logs from child, fetching from Apex for paySetId:', parentPaysetId);
            
            this.showProgress = true;
            this.statusMessage = 'Loading validation logs...';
            
            getValidationLogs({ paySetId: parentPaysetId })
                .then(result => {
                    console.log('Validation Logs Response from Apex:', JSON.stringify(result));
                    console.log('Total validation logs from Apex:', result ? result.length : 0);
                    
                    const processedLogs = this.processValidationLogs(result);
                    console.log('Processed validation logs count:', processedLogs.length);
                    
                    this.validationLogs = processedLogs;
                    this.updateValidationLogs(processedLogs);
                    this.moreDetailsData.validationLogs = processedLogs;
                    this.moreDetailsData.totalValidationLogs = processedLogs.length;
                    this.showRetryButton = processedLogs.some(log => log.isFailed);
                    this.showProgress = false;
                    this.showMoreDetailsTemplate = true;
                    console.log('✓ showMoreDetailsTemplate set to true (from Apex)');
                })
                .catch(error => {
                    console.error('Error getting validation logs from Apex:', error);
                    this.showProgress = false;
                    
                    let errorMessage = 'Failed to load validation logs. Please try again.';
                    if (error.body) {
                        if (typeof error.body === 'object' && error.body.message) {
                            errorMessage = error.body.message;
                        } else if (typeof error.body === 'string') {
                            errorMessage = error.body;
                        }
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    this.showToast('Error', errorMessage, 'error');
                    this.showMoreDetailsTemplate = true;
                    console.log('✓ showMoreDetailsTemplate set to true (with error)');
                });  // <-- THIS CLOSING BRACE WAS MISSING
        } else {
            console.warn('No parentPaysetId available and no logs from child');
            this.showMoreDetailsTemplate = true;
            console.log('✓ showMoreDetailsTemplate set to true (no logs)');
        }
        
        console.log('===== END handleCloseParentAndOpenNew =====');
    }


    openSpecificPayrun(payrunId) {
        console.log('===== openSpecificPayrun =====');
        console.log('Opening payrun with ID:', payrunId);
        
        if (!payrunId) {
            console.warn('No payrun ID provided, going to list');
            this.goToPayrunList();
            return;
        }
        
        // Search in ALL payrun lists
        let payrunRecord = null;
        
        // First, check in this.records (historical payruns)
        if (this.records && this.records.length > 0) {
            payrunRecord = this.records.find(record => record.Id === payrunId);
            console.log('Found in records (historical):', payrunRecord ? 'Yes' : 'No');
        }
        
        // If not found, check in this.payrun (draft payruns)
        if (!payrunRecord && this.payrun && this.payrun.length > 0) {
            payrunRecord = this.payrun.find(record => record.Id === payrunId);
            console.log('Found in payrun (draft):', payrunRecord ? 'Yes' : 'No');
        }
        
        // If still not found, check in this.payrunList (paginated list)
        if (!payrunRecord && this.payrunList && this.payrunList.length > 0) {
            payrunRecord = this.payrunList.find(record => record.Id === payrunId);
            console.log('Found in payrunList:', payrunRecord ? 'Yes' : 'No');
        }
        
        // If still not found, use the payset ID directly to load data
        if (!payrunRecord) {
            console.warn('Payrun record not found in local lists, using payset ID directly');
            // Instead of trying to open it, just go to list
            // This prevents infinite loops
            this.goToPayrunList();
            return;
        }
        
        console.log('Found payrun record:', payrunRecord);
        this.openPayrunFromRecord(payrunRecord);
    }

    // New method to open payrun by ID without needing the full record
    openPayrunById(payrunId) {
        console.log('===== openPayrunById =====');
        console.log('Opening payrun with ID:', payrunId);
        
        // Set the payset ID
        this.paysetId = payrunId;
        this.blhdfinalized = false;
        this.disableSubmitButton = false;
        this.NormalYtdFlag = true;
        this.FinalisedYtdFlag = false;
        
        // Default status - will be updated when data loads
        this.payrollStatus1 = 'STP Filed';
        
        // Set default status flags for STP Filed
        this.isStatus = true;
        this.ispayslip = true;
        this.isSubmitbtn = true;
        this.Editbutton = true;
        this.fileStpbutton = true;
        this.activityLogButton = false;
        this.superannuationButtonDisabled = false;
        
        // Set showSignatureTemplate to true
        this.showSignatureTemplate = true;
        
        // Open the payrun
        this.isopenPaysettings = true;
        this.ispayrun = false;
        this.isaddpayrun = false;
        
        // Load the data - this will fetch all staff records and update status
        this.payLoadData();
        
        console.log('Successfully opened payrun by ID:', payrunId);
    }

    // New method to open payrun from record
    openPayrunFromRecord(payrunRecord) {
        console.log('===== openPayrunFromRecord =====');
        
        // Get the payrun status
        const statusValue = payrunRecord.Status__c;
        this.payrollStatus1 = statusValue;
        console.log('Payrun status:', statusValue);
        
        // Set the payset ID
        this.paysetId = payrunRecord.Id;
        this.chpaymentDate = payrunRecord.Next_Pay_Date__c;
        this.initialPayProcessDate = payrunRecord.Next_Pay_Date__c;
        this.initialPayEnddate = payrunRecord.Period_End_Date__c;
        this.blhdfinalized = false;
        this.disableSubmitButton = false;
        this.NormalYtdFlag = true;
        this.FinalisedYtdFlag = false;
        this.groupName = payrunRecord.Group_Name__c;
        
        // Set status flags
        this.isStatus = (statusValue === 'Submitted' || statusValue === 'Delete');
        this.ispayslip = (statusValue === 'Submitted');
        this.isSubmitbtn = (statusValue === 'Submitted');
        
        // Set button states based on status
        if (statusValue === 'Draft') {
            this.fileStpbutton = true;
            this.Editbutton = false;
            this.activityLogButton = true;
            this.superannuationButtonDisabled = true;
            this.payButtonDisabled = true;
            this.processPaymentButtonDisabled = true;
        } else if (statusValue === 'Submitted') {
            this.fileStpbutton = false;
            this.Editbutton = false;
            this.activityLogButton = true;
            this.superannuationButtonDisabled = true;
            this.payButtonDisabled = true;
            this.processPaymentButtonDisabled = true;
        } else if (statusValue === 'STP Filed') {
            this.fileStpbutton = true;
            this.ispayslip = true;
            this.isSubmitbtn = true;
            this.isStatus = true;
            this.Editbutton = true;
            this.activityLogButton = false;
            // For STP Filed, enable superannuation button if no validation logs
            this.superannuationButtonDisabled = false;
        }
        
        // Set showSignatureTemplate to true
        this.showSignatureTemplate = true;
        
        // Open the payrun
        this.isopenPaysettings = true;
        this.ispayrun = false;
        this.isaddpayrun = false;
        
        // Load the data
        this.payLoadData();
        
        console.log('Successfully opened payrun:', payrunRecord.Id);
    }

    // Helper method to go to payrun list
    goToPayrunList() {
        console.log('Going to payrun list');
        this.ispayrun = true;
        this.isopenPaysettings = false;
        this.isaddpayrun = false;
        this.showSignatureTemplate = false;
        this.payrunEdit = false;
        this.currentPayrunId = null;
        this.paysetId = null;
        this.fetchPayrun();
    }

    // ==========================================
    // PROCESS VALIDATION LOGS
    // ==========================================

    processValidationLogs(logs) {
        console.log('===== processValidationLogs =====');
        
        if (!logs || logs.length === 0) {
            console.log('No logs to process');
            return [];
        }
        
        const processedLogs = logs.map(log => {
            // Get status from Validation_Status__c or STP_Response__c
            let validationStatus = log.Validation_Status__c || '';
            let statusClass = 'status-info';
            let isFailed = false;
            let isSuccess = false;
            let isProgress = false;
            let isInfo = false;
            
            // Check if we need to parse status from response
            if (!validationStatus && log.STP_Response__c) {
                try {
                    const response = JSON.parse(log.STP_Response__c);
                    if (response.IsSuccess === true) {
                        validationStatus = 'SUCCESS';
                    } else if (response.IsSuccess === false) {
                        validationStatus = 'FAILED';
                    } else {
                        validationStatus = 'PENDING';
                    }
                } catch (e) {
                    // Check if response contains error indicators
                    const responseText = log.STP_Response__c || '';
                    if (responseText.toLowerCase().includes('success') || responseText.toLowerCase().includes('processed')) {
                        validationStatus = 'SUCCESS';
                    } else if (responseText.toLowerCase().includes('failed') || responseText.toLowerCase().includes('error')) {
                        validationStatus = 'FAILED';
                    } else {
                        validationStatus = 'PENDING';
                    }
                }
            }
            
            // Set status class and flags based on validation status
            if (validationStatus === 'SUCCESS' || validationStatus === 'VALID') {
                statusClass = 'status-success';
                isSuccess = true;
            } else if (validationStatus === 'FAILED') {
                statusClass = 'status-failed';
                isFailed = true;
            } else if (validationStatus === 'IN_PROGRESS' || validationStatus === 'PENDING') {
                statusClass = 'status-progress';
                isProgress = true;
            } else {
                statusClass = 'status-info';
                isInfo = true;
            }
            
            // Format validation errors as numbered list
            const formattedErrors = this.formatValidationErrors(log.Validation_Errors__c);
            
            return {
                Id: log.Id,
                Name: log.Name || 'N/A',
                Employee__c: log.Employee__c || 'N/A',
                Type_of_Submission__c: log.Type_of_Submission__c || 'N/A',
                STP_Response__c: log.STP_Response__c || 'No response available',
                STP_Ref_ID__c: log.STP_Ref_ID__c || 'N/A',
                STP_Date__c: log.STP_Date__c,
                Payer_Declaration_Date__c: log.Payer_Declaration_Date__c,
                CreatedDate: log.CreatedDate,
                LastModifiedDate: log.LastModifiedDate,
                // Processed fields with safe defaults
                employeeName: log.Employee__r?.Name || log.Employee_Name__c || 'N/A',
                superFundName: log.Super_Fund_Name__c || 'N/A',
                contributionAmount: log.Contribution_Amount__c || 0,
                superABN: log.Super_ABN__c || 'N/A',
                superNumber: log.Super_Number__c || 'N/A',
                uploadUUID: log.Upload_UUID__c || 'N/A',
                usi: log.USI__c || 'N/A',
                validationDate: log.Validation_Date__c || log.CreatedDate,
                validationErrors: log.Validation_Errors__c || 'N/A',
                formattedValidationErrors: formattedErrors,
                errorTypes: log.Error_Types__c || 'N/A',
                processedByOZEDI: log.Processed_by_OZEDI__c || false,
                validationStatus: validationStatus,
                statusClass: statusClass,
                statusLabel: validationStatus === 'VALID' ? 'Success' : (validationStatus === 'SUCCESS' ? 'Success' : (validationStatus || 'Pending')),
                isSuccess: isSuccess,
                isFailed: isFailed,
                isProgress: isProgress,
                isInfo: isInfo
            };
        });
        
        console.log('Processed ' + processedLogs.length + ' logs');
        console.log('Logs with isFailed=true:', processedLogs.filter(log => log.isFailed).length);
        return processedLogs;
    }

    // ==========================================
    // SHOW MAIN DETAILS FALLBACK (Helper Method)
    // ==========================================

    showMainDetailsFallback(detail, status, parentPaysetId) {
        console.log('===== showMainDetailsFallback =====');
        
        // Determine status flags for CSS classes
        let isSuccess = false;
        let isFailed = false;
        let isProgress = false;
        let isInfo = false;
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('success')) {
            isSuccess = true;
        } else if (statusLower.includes('failed') || statusLower.includes('error')) {
            isFailed = true;
        } else if (statusLower.includes('progress') || statusLower.includes('in progress') || statusLower.includes('processing')) {
            isProgress = true;
        } else {
            isInfo = true;
        }
        
        // Format dates
        const formattedDate = this.formatDisplayDate(detail.date);
        const formattedDeclarationDate = this.formatDisplayDate(detail.declarationDate);
        
        // Store the data without validation logs
        this.moreDetailsData = {
            type: detail.type || 'Superannuation',
            refId: detail.refId || 'N/A',
            status: status,
            isSuccess: isSuccess,
            isFailed: isFailed,
            isProgress: isProgress,
            isInfo: isInfo,
            date: formattedDate,
            declarationDate: formattedDeclarationDate,
            response: detail.response || 'No response available',
            parentPaysetId: parentPaysetId,
            validationLogs: [],
            totalValidationLogs: 0,
            validationDetails: null
        };
        
        // Update pagination with empty data
        this.updateValidationLogs([]);
        
        console.log('moreDetailsData stored (fallback)');
        
        // Reset full response view
        this.showFullResponse = false;
        console.log('✓ showFullResponse set to false');
        
        // Open the new template
        this.showMoreDetailsTemplate = true;
        console.log('✓ showMoreDetailsTemplate set to true');
        
        console.log('===== END showMainDetailsFallback =====');
    }

    // ==========================================
    // FORMAT DISPLAY DATE (Helper Method)
    // ==========================================

    formatDisplayDate(dateString) {
        if (!dateString || dateString === 'N/A' || dateString === 'null' || dateString === 'undefined' || dateString === '') {
            return 'N/A';
        }
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.warn('Error formatting date:', error);
            return dateString || 'N/A';
        }
    }

    // ==========================================
    // HANDLE VIEW LOG RESPONSE
    // ==========================================

    handleViewLogResponse(event) {
        console.log('===== handleViewLogResponse =====');
        const logId = event.currentTarget.dataset.id;
        console.log('Log ID:', logId);
        
        // Find the log in the full list (not paginated)
        const log = this.allValidationLogs.find(item => item.Id === logId);
        
        if (log) {
            console.log('Found log:', JSON.stringify(log));
            
            // Determine status class
            let statusClass = 'status-info';
            const validationStatus = log.statusLabel || 'Pending';
            if (validationStatus === 'Success') {
                statusClass = 'status-success';
            } else if (validationStatus === 'Failed') {
                statusClass = 'status-failed';
            } else if (validationStatus === 'In Progress') {
                statusClass = 'status-progress';
            }
            
            // Update moreDetailsData with the selected log's response
            this.moreDetailsData = {
                ...this.moreDetailsData,
                response: log.STP_Response__c || 'No response available',
                type: log.Type_of_Submission__c || 'Superannuation',
                refId: log.STP_Ref_ID__c || 'N/A',
                date: this.formatDisplayDate(log.STP_Date__c),
                declarationDate: this.formatDisplayDate(log.Payer_Declaration_Date__c),
                validationDetails: {
                    employeeName: log.employeeName || 'N/A',
                    superFundName: log.superFundName || 'N/A',
                    superABN: log.superABN || 'N/A',
                    superNumber: log.superNumber || 'N/A',
                    contributionAmount: log.contributionAmount || 0,
                    validationStatus: validationStatus,
                    statusClass: statusClass,
                    validationDate: this.formatDisplayDate(log.validationDate),
                    processedByOZEDI: log.processedByOZEDI || false,
                    uploadUUID: log.uploadUUID || 'N/A',
                    usi: log.usi || 'N/A',
                    errorTypes: log.errorTypes || 'N/A',
                    validationErrors: log.validationErrors || 'N/A',
                    formattedValidationErrors: log.formattedValidationErrors || [],
                    validationRules: log.validationRules || 'N/A',
                    urlSlugs: log.urlSlugs || 'N/A'
                }
            };
            
            // Show the full response
            this.showFullResponse = true;
            
            console.log('Updated moreDetailsData with log details:', JSON.stringify(this.moreDetailsData));
        } else {
            console.warn('Log not found with ID:', logId);
            this.showToast('Warning', 'Validation log not found', 'warning');
        }
        
        console.log('===== END handleViewLogResponse =====');
    }

    // ==========================================
    // FORMAT VALIDATION ERRORS AS NUMBERED LIST
    // ==========================================

    formatValidationErrors(errorString) {
        console.log('===== formatValidationErrors =====');
        console.log('Input error string:', errorString);
        
        if (!errorString || errorString === 'N/A' || errorString === '') {
            console.log('No errors to format');
            return [];
        }
        
        try {
            // Split by semicolon to get individual errors
            const errors = errorString.split(';').map(error => error.trim()).filter(error => error.length > 0);
            console.log('Split errors:', errors);
            
            // Format each error with number
            const formattedErrors = errors.map((error, index) => {
                return {
                    number: index + 1,
                    message: error
                };
            });
            
            console.log('Formatted errors:', formattedErrors);
            return formattedErrors;
            
        } catch (error) {
            console.error('Error formatting validation errors:', error);
            return [{ number: 1, message: errorString }];
        }
    }

    // Alternative method if errors are separated by newline
    formatValidationErrorsNewLine(errorString) {
        console.log('===== formatValidationErrorsNewLine =====');
        console.log('Input error string:', errorString);
        
        if (!errorString || errorString === 'N/A' || errorString === '') {
            console.log('No errors to format');
            return [];
        }
        
        try {
            // Split by newline or semicolon
            const errors = errorString.split(/[\n;]/).map(error => error.trim()).filter(error => error.length > 0);
            console.log('Split errors:', errors);
            
            // Format each error with number
            const formattedErrors = errors.map((error, index) => {
                return {
                    number: index + 1,
                    message: error
                };
            });
            
            console.log('Formatted errors:', formattedErrors);
            return formattedErrors;
            
        } catch (error) {
            console.error('Error formatting validation errors:', error);
            return [{ number: 1, message: errorString }];
        }
    }

    // Add a getter method
    get processedByOZEDIDisplay() {
        return this.moreDetailsData?.validationDetails?.processedByOZEDI ? 'Yes' : 'No';
    }

    // ==========================================
    // CLOSE FULL RESPONSE
    // ==========================================

    handleCloseFullResponse() {
        console.log('===== START handleCloseFullResponse =====');
        console.log('Current showFullResponse:', this.showFullResponse);
        console.log('Current moreDetailsData:', JSON.stringify(this.moreDetailsData));
        
        // Close the full response modal
        this.showFullResponse = false;
        console.log('✓ showFullResponse set to false');
        
        // Reset validation details to prevent showing old data
        if (this.moreDetailsData) {
            this.moreDetailsData = {
                ...this.moreDetailsData,
                validationDetails: null
            };
            console.log('✓ validationDetails reset');
        }
        
        console.log('Full response modal closed and data reset successfully');
        console.log('===== END handleCloseFullResponse =====');
    }

    // ==========================================
    // CLOSE MORE DETAILS
    // ==========================================

    handleCloseMoreDetails() {
        console.log('===== START handleCloseMoreDetails =====');
        console.log('Current state before closing:');
        console.log('  showMoreDetailsTemplate:', this.showMoreDetailsTemplate);
        console.log('  showFullResponse:', this.showFullResponse);
        console.log('  ispayrun:', this.ispayrun);
        console.log('  currentPayrunId to reopen:', this.currentPayrunId);
        
        // Close the details template
        this.showMoreDetailsTemplate = false;
        console.log('✓ showMoreDetailsTemplate set to false');
        
        this.showFullResponse = false;
        console.log('✓ showFullResponse set to false');
        
        // Reset validation logs
        this.validationLogs = [];
        this.allValidationLogs = [];
        this.validationLogsList = [];
        this.selectedFailedLogs = [];
        this.showRetryButton = false;
        console.log('✓ validation data reset');
        
        // IMPORTANT: Store the payrun ID before resetting
        const payrunIdToReopen = this.currentPayrunId || this.paysetId;
        console.log('Payrun ID to reopen:', payrunIdToReopen);
        
        // Reset the current payrun ID after storing
        this.currentPayrunId = null;
        
        // Close the details view
        this.showMoreDetailsTemplate = false;
        
        // Re-open the specific payrun
        if (payrunIdToReopen) {
            console.log('Reopening payrun with ID:', payrunIdToReopen);
            
            // First, make sure we're in the right view
            this.ispayrun = false;
            this.isopenPaysettings = false;
            this.isaddpayrun = false;
            
            // Use setTimeout to ensure DOM updates properly
            setTimeout(() => {
                // Re-open the specific payrun
                this.openSpecificPayrun(payrunIdToReopen);
            }, 100);
        } else {
            // Fallback: just go back to payrun list
            console.log('No payrun ID to reopen, going to list');
            this.goToPayrunList();
        }
        
        console.log('===== END handleCloseMoreDetails =====');
    }
    
    // ==========================================
    // HANDLE RETRY CHECKBOX
    // ==========================================

    handleRetryCheckbox(event) {
        console.log('===== handleRetryCheckbox =====');
        const logId = event.currentTarget.dataset.id;
        const isChecked = event.target.checked;
        console.log('Log ID:', logId);
        console.log('Is Checked:', isChecked);
        
        if (!this.selectedFailedLogs) {
            this.selectedFailedLogs = [];
        }
        
        if (isChecked) {
            // Add to selected list
            if (!this.selectedFailedLogs.includes(logId)) {
                this.selectedFailedLogs.push(logId);
                console.log('Added log to selection:', logId);
            }
        } else {
            // Remove from selected list
            this.selectedFailedLogs = this.selectedFailedLogs.filter(id => id !== logId);
            console.log('Removed log from selection:', logId);
        }
        
        // Show retry button if any logs are selected
        this.showRetryButton = this.selectedFailedLogs.length > 0;
        
        console.log('Selected Failed Logs count:', this.selectedFailedLogs.length);
        console.log('Show Retry Button:', this.showRetryButton);
        console.log('===== END handleRetryCheckbox =====');
    }

    // ==========================================
    // HANDLE RETRY SELECTED
    // ==========================================

    handleRetrySelected() {
        console.log('===== handleRetrySelected =====');
        console.log('Retrying selected logs:', this.selectedFailedLogs);
        
        if (!this.selectedFailedLogs || this.selectedFailedLogs.length === 0) {
            this.showToast('Warning', 'No logs selected for retry', 'warning');
            return;
        }
        
        const parentPaysetId = this.moreDetailsData?.parentPaysetId;
        
        if (!parentPaysetId || parentPaysetId === 'N/A') {
            this.showToast('Error', 'No payroll setting ID found', 'error');
            return;
        }
        
        this.showProgress = true;
        this.statusMessage = `Retrying ${this.selectedFailedLogs.length} selected employee(s)...`;
        
        retrySpecificFailedContributions({ 
            logIds: this.selectedFailedLogs,
            paySetId: parentPaysetId
        })
        .then(result => {
            console.log('Retry Response:', JSON.stringify(result));
            this.showProgress = false;
            
            if (result.success) {
                let message = '';
                if (result.retriedEmployees && result.retriedEmployees.length > 0) {
                    message += `✅ ${result.retriedEmployees.length} employee(s) retried successfully.\n`;
                }
                
                if (result.stillFailedEmployees && result.stillFailedEmployees.length > 0) {
                    message += `⚠️ ${result.stillFailedEmployees.length} selected employee(s) still have errors.\n`;
                    this.showRetryErrors(result.stillFailedEmployees);
                } else {
                    message += 'All selected employees processed successfully!';
                    this.showToast('Success', message, 'success');
                    this.refreshValidationLogs();
                }
                
                if (result.uploadUuid) {
                    message += `\n📤 Upload ID: ${result.uploadUuid}`;
                    this.moreDetailsData.uploadUuid = result.uploadUuid;
                    this.currentUploadUuid = result.uploadUuid;
                }
                
                this.selectedFailedLogs = [];
                this.showRetryButton = false;
                
            } else {
                // Check if the error message contains MVR related content
                if (result.message && result.message.includes('MVR')) {
                    this.showValidationErrorModal = true;
                    this.validationErrorModalMessage = result.message + '\n\n💡 Please complete MVR verification before retrying.';
                } else {
                    this.showValidationErrorModal = true;
                    this.validationErrorModalMessage = result.message || 'Retry failed. Please try again.';
                }
            }
        })
        .catch(error => {
            console.error('Retry Error:', error);
            this.showProgress = false;
            
            let errorMessage = 'Failed to retry: ';
            if (error.body) {
                if (typeof error.body === 'object' && error.body.message) {
                    errorMessage += error.body.message;
                } else if (typeof error.body === 'string') {
                    errorMessage += error.body;
                }
            } else if (error.message) {
                errorMessage += error.message;
            }
            
            this.showValidationErrorModal = true;
            this.validationErrorModalMessage = errorMessage;
        });
    }


    showRetryErrors(failedEmployees) {
        console.log('===== showRetryErrors =====');
        
        // Build structured data
        this.validationErrorItems = [];
        
        // Add warning header
        this.validationErrorItems.push({
            title: '⚠️ EMPLOYEES STILL FAILING',
            items: [],
            isSuccess: false,
            isError: false,
            isInfo: false,
            isWarning: true,
            color: '#ed6c02',
            borderColor: '#ed6c02',
            uploadId: null
        });
        
        // Check if any are MVR related
        const mvrErrors = failedEmployees.filter(emp => 
            emp.errors && emp.errors.some(e => 
                e.includes('MVR') || e.includes('verification')
            )
        );
        
        if (mvrErrors.length > 0) {
            this.validationErrorItems.push({
                title: '🔄 MVR VERIFICATION STILL REQUIRED',
                items: mvrErrors.map(emp => ({
                    name: emp.employeeName || 'Unknown Employee',
                    errors: this.cleanErrorMessages(emp.errors || [])
                })),
                isSuccess: false,
                isError: false,
                isInfo: false,
                isWarning: true,
                color: '#ed6c02',
                borderColor: '#ed6c02',
                uploadId: null
            });
        }
        
        // Show other errors
        const otherErrors = failedEmployees.filter(emp => 
            !emp.errors || !emp.errors.some(e => 
                e.includes('MVR') || e.includes('verification')
            )
        );
        
        if (otherErrors.length > 0) {
            this.validationErrorItems.push({
                title: '❌ OTHER VALIDATION ERRORS',
                items: otherErrors.map(emp => ({
                    name: emp.employeeName || 'Unknown Employee',
                    errors: this.cleanErrorMessages(emp.errors || [])
                })),
                isSuccess: false,
                isError: true,
                isInfo: false,
                isWarning: false,
                color: '#d32f2f',
                borderColor: '#d32f2f',
                uploadId: null
            });
        }
        
        this.showValidationErrorModal = true;
    }

    // ==========================================
    // HANDLE RETRY SELECTED WITH SPECIFIC LOGS (Alternative Approach)
    // ==========================================

    handleRetrySelectedWithSpecificLogs() {
        console.log('===== handleRetrySelectedWithSpecificLogs =====');
        console.log('Retrying selected logs:', this.selectedFailedLogs);
        
        if (!this.selectedFailedLogs || this.selectedFailedLogs.length === 0) {
            this.showToast('Warning', 'No logs selected for retry', 'warning');
            return;
        }
        
        // Get the selected log details
        const selectedLogs = this.allValidationLogs.filter(log => 
            this.selectedFailedLogs.includes(log.Id)
        );
        
        console.log('Selected logs details:', JSON.stringify(selectedLogs));
        
        // Extract employee IDs from the selected logs
        const employeeIds = selectedLogs
            .map(log => log.Employee__c)
            .filter(id => id && id !== 'N/A' && id !== '');
        
        console.log('Employee IDs to retry:', employeeIds);
        
        if (employeeIds.length === 0) {
            this.showToast('Error', 'No valid employee IDs found in selected logs', 'error');
            return;
        }
        
        const parentPaysetId = this.moreDetailsData?.parentPaysetId;
        
        if (!parentPaysetId || parentPaysetId === 'N/A') {
            this.showToast('Error', 'No payroll setting ID found', 'error');
            return;
        }
        
        // Show progress
        this.showProgress = true;
        this.statusMessage = `Retrying ${employeeIds.length} selected employee(s)...`;
        

    }

    // ==========================================
    // REFRESH VALIDATION LOGS
    // ==========================================

    refreshValidationLogs() {
        console.log('===== refreshValidationLogs =====');
        const parentPaysetId = this.moreDetailsData?.parentPaysetId;
        
        if (!parentPaysetId || parentPaysetId === 'N/A') {
            console.warn('No parentPaysetId available, skipping refresh');
            return;
        }
        
        // Show progress while refreshing
        this.showProgress = true;
        this.statusMessage = 'Refreshing validation logs...';
        
        getValidationLogs({ paySetId: parentPaysetId })
            .then(result => {
                console.log('Refresh: Validation Logs Response:', JSON.stringify(result));
                
                // Process the logs
                const processedLogs = this.processValidationLogs(result);
                this.validationLogs = processedLogs;
                
                // Update pagination
                this.updateValidationLogs(processedLogs);
                
                // Update moreDetailsData
                this.moreDetailsData = {
                    ...this.moreDetailsData,
                    validationLogs: processedLogs,
                    totalValidationLogs: processedLogs.length
                };
                
                // Reset selected logs
                this.selectedFailedLogs = [];
                this.showRetryButton = false;
                this.showProgress = false;
                
                console.log('Validation logs refreshed successfully');
            })
            .catch(error => {
                console.error('Error refreshing validation logs:', error);
                this.showProgress = false;
                this.showToast('Error', 'Failed to refresh validation logs', 'error');
            });
    }

    get validationBDisableFirst() {
        return this.validationPageNumber == 1 || this.validationTotalPages === 0;
    }

    get validationBDisableLast() {
        return this.validationPageNumber == this.validationTotalPages || this.validationTotalPages === 0;
    }

    // ==========================================
    // VALIDATION LOGS PAGINATION METHODS
    // ==========================================

    handleValidationRecordsPerPage(event) {
        console.log('===== handleValidationRecordsPerPage =====');
        this.validationPageSize = parseInt(event.target.value, 10);
        this.validationPageNumber = 1;
        this.paginateValidationLogs();
        console.log('Page size changed to:', this.validationPageSize);
    }

    validationPreviousPage() {
        console.log('===== validationPreviousPage =====');
        if (this.validationPageNumber > 1) {
            this.validationPageNumber = this.validationPageNumber - 1;
            this.paginateValidationLogs();
            console.log('Previous page:', this.validationPageNumber);
        }
    }

    validationNextPage() {
        console.log('===== validationNextPage =====');
        if (this.validationPageNumber < this.validationTotalPages) {
            this.validationPageNumber = this.validationPageNumber + 1;
            this.paginateValidationLogs();
            console.log('Next page:', this.validationPageNumber);
        }
    }

    validationFirstPage() {
        console.log('===== validationFirstPage =====');
        this.validationPageNumber = 1;
        this.paginateValidationLogs();
        console.log('First page');
    }

    validationLastPage() {
        console.log('===== validationLastPage =====');
        this.validationPageNumber = this.validationTotalPages;
        this.paginateValidationLogs();
        console.log('Last page:', this.validationPageNumber);
    }

    // ==========================================
    // PAGINATE VALIDATION LOGS
    // ==========================================

    paginateValidationLogs() {
        console.log('===== paginateValidationLogs =====');
        console.log('Total records:', this.validationTotalRecords);
        console.log('Page size:', this.validationPageSize);
        console.log('Current page:', this.validationPageNumber);
        
        if (this.validationTotalRecords === 0) {
            this.validationLogsList = [];
            this.validationTotalPages = 0;
            this.showValidationPagination = false;
            console.log('No records to paginate');
            return;
        }
        
        // Calculate total pages
        this.validationTotalPages = Math.ceil(this.validationTotalRecords / this.validationPageSize);
        
        // Ensure page number is valid
        if (this.validationPageNumber < 1) {
            this.validationPageNumber = 1;
        } else if (this.validationPageNumber > this.validationTotalPages) {
            this.validationPageNumber = this.validationTotalPages;
        }
        
        // Get the records for the current page
        const startIndex = (this.validationPageNumber - 1) * this.validationPageSize;
        const endIndex = Math.min(startIndex + this.validationPageSize, this.validationTotalRecords);
        
        this.validationLogsList = this.allValidationLogs.slice(startIndex, endIndex);
        
        // Show/hide pagination
        this.showValidationPagination = this.validationTotalRecords > this.validationPageSize;
        
        console.log('Paginated records count:', this.validationLogsList.length);
        console.log('Total pages:', this.validationTotalPages);
        console.log('Show pagination:', this.showValidationPagination);
    }

    // ==========================================
    // UPDATE VALIDATION LOGS WITH PAGINATION
    // ==========================================

    updateValidationLogs(logs) {
        console.log('===== updateValidationLogs =====');
        
        // Store all validation logs
        this.allValidationLogs = logs || [];
        this.validationTotalRecords = this.allValidationLogs.length;
        this.validationPageNumber = 1;
        
        // Reset selected logs when data changes
        this.selectedFailedLogs = [];
        this.showRetryButton = false;
        
        // Paginate the logs
        this.paginateValidationLogs();
        
        // Update total validation logs count in moreDetailsData
        if (this.moreDetailsData) {
            this.moreDetailsData.totalValidationLogs = this.validationTotalRecords;
        }
        
        console.log('Updated validation logs. Total:', this.validationTotalRecords);
    }

    // ==========================================
    // SHOW TOAST (Helper Method)
    // ==========================================

    showToast(title, message, variant) {
        try {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: title,
                    message: message,
                    variant: variant || 'info',
                    mode: 'dismissable'
                })
            );
        } catch (error) {
            console.error('Failed to dispatch toast notification:', error);
        }
    }


    // Add these with your other @track properties
    @track payButtonDisabled = true;
    @track showAbaExtract = false;
    @track abaExtractData = [];
    @track abaFileName = '';
    @track abaContent = '';
    @track abaResult = null;  // Add this with your other @track properties

    // ==========================================
    // HANDLE PAY - OPEN POPUP
    // ==========================================

    handlePay() {
        console.log('===== handlePay START =====');
        console.log('Payset ID:', this.paysetId);
        
        if (!this.paysetId) {
            this.showToast('Error', 'No payroll setting selected', 'error');
            return;
        }
        
        // Check if there are employees with superannuation
        if (!this.staffrecords || this.staffrecords.length === 0) {
            this.showToast('Error', 'No employees found with superannuation for this pay run.', 'error');
            return;
        }
        
        // Set default values
        this.paymentDate = new Date().toISOString().split('T')[0];
        this.paymentReference = `Payroll - ${this.groupName || 'Weekly'}`;
        this.totalEmployeesForPayment = this.staffrecords.length;
        
        // Calculate total payment amount
        let total = 0;
        this.staffrecords.forEach(record => {
            if (record.Super_And_Voluntary_Supper_Annuation__c) {
                total += parseFloat(record.Super_And_Voluntary_Supper_Annuation__c);
            }
        });
        this.totalPaymentAmount = total.toFixed(2);
        
        // Set bank account options
        this.bankAccountOptions = [
            { label: 'Payroll Operating Account', value: 'payroll_operating' },
            { label: 'Main Business Account', value: 'main_business' },
            { label: 'Secondary Account', value: 'secondary' }
        ];
        this.selectedBankAccount = 'payroll_operating';
        
        // Open the popup
        this.showPayEmployeesPopup = true;
        console.log('Pay Employees popup opened');
    }

    // ==========================================
    // CLOSE PAY POPUP
    // ==========================================

    closePayPopup() {
        this.showPayEmployeesPopup = false;
        console.log('Pay Employees popup closed');
    }

    // ==========================================
    // HANDLE PAYMENT METHOD CHANGE
    // ==========================================

    handlePaymentMethodChange(event) {
        this.selectedPaymentMethod = event.target.value;
        console.log('Payment method changed to:', this.selectedPaymentMethod);
    }

    // ==========================================
    // HANDLE REFERENCE CHANGE
    // ==========================================

    handleReferenceChange(event) {
        this.paymentReference = event.target.value;
        console.log('Reference changed to:', this.paymentReference);
    }

    // ==========================================
    // HANDLE DEFAULT PAYMENT CHANGE
    // ==========================================

    handleDefaultPaymentChange(event) {
        this.defaultPaymentMethod = event.target.checked;
        console.log('Default payment method:', this.defaultPaymentMethod);
    }

    // ==========================================
    // GENERATE ABA FILE DOWNLOAD (FROM POPUP)
    // ==========================================

    generateABAFileDownload() {
        console.log('===== generateABAFileDownload START =====');
        console.log('Payment Date:', this.paymentDate);
        console.log('Bank Account:', this.selectedBankAccount);
        console.log('Reference:', this.paymentReference);
        
        // Show loading spinner
        this.showProgress = true;
        this.statusMessage = 'Generating ABA file...';
        
        // Close the popup
        this.showPayEmployeesPopup = false;
        
        // First try to get ABA from OZEDI
        generateABAFile({ paySetId: this.paysetId })
            .then(result => {
                console.log('ABA Generation Result:', JSON.stringify(result));
                
                if (result.success) {
                    this.abaResult = result;
                    
                    // Check if we have ABA files
                    if (result.abaFiles && result.abaFiles.length > 0) {
                        this.handleMultipleABAFiles(result);
                    } else if (result.fileContent) {
                        this.handleSingleABAFile(result);
                    } else {
                        // Fallback: build from staff records
                        this.buildAndDownloadABAFromStaff();
                    }
                } else {
                    // Fallback: build from staff records
                    console.log('API returned error, falling back to staff records');
                    this.buildAndDownloadABAFromStaff();
                }
            })
            .catch(error => {
                console.error('Error generating ABA:', error);
                // Fallback: build from staff records
                this.buildAndDownloadABAFromStaff();
            });
    }

    // ==========================================
    // BUILD AND DOWNLOAD ABA FROM STAFF RECORDS
    // ==========================================

    buildAndDownloadABAFromStaff() {
        console.log('===== buildAndDownloadABAFromStaff START =====');
        
        this.showProgress = true;
        this.statusMessage = 'Building ABA file from employee data...';
        
        if (!this.staffrecords || this.staffrecords.length === 0) {
            this.showToast('Error', 'No employee data available', 'error');
            this.showProgress = false;
            return;
        }
        
        try {
            // Get Organisation details from the first staff record
            const orgDetails = this.getOrganisationDetails();
            console.log('Organisation Details:', JSON.stringify(orgDetails));
            
            // Build ABA content with organisation details
            const abaContent = this.buildCorrectABA(this.staffrecords, orgDetails);
            const fileName = `SuperContribution_${new Date().toISOString().split('T')[0]}.aba`;
            
            this.downloadABAFile(abaContent, fileName);
            this.showToast('Success', 'ABA file downloaded successfully', 'success');
            this.showProgress = false;
            
        } catch (error) {
            console.error('Error building ABA:', error);
            this.showToast('Error', 'Failed to build ABA: ' + error.message, 'error');
            this.showProgress = false;
        }
    }

    // ==========================================
    // GET ORGANISATION DETAILS
    // ==========================================

    getOrganisationDetails() {
        console.log('===== getOrganisationDetails START =====');
        
        // Get from staff records first
        let org = {
            name: this.orgName || 'Organisation',
            bsb: this.orgBSB || this.organisation?.BSB__c || '124001',
            accountNumber: this.orgAccountNumber || this.organisation?.Account_Number__c || '123456789',
            userId: this.orgUserId || '123456',
            abn: this.orgABN || this.organisation?.ABN__c || '99900007496'
        };
        
        // Try to get from staffrecords if available
        if (this.staffrecords && this.staffrecords.length > 0) {
            const firstRecord = this.staffrecords[0];
            if (firstRecord) {
                // Get from staff record fields
                if (firstRecord.Org_Name__c) {
                    org.name = firstRecord.Org_Name__c;
                }
                if (firstRecord.Org_ABN__c) {
                    org.abn = firstRecord.Org_ABN__c;
                }
                if (firstRecord.OrgPostalCode__c) {
                    org.postcode = firstRecord.OrgPostalCode__c;
                }
                if (firstRecord.Org_Phone__c) {
                    org.phone = firstRecord.Org_Phone__c;
                }
                if (firstRecord.orgEmail__c) {
                    org.email = firstRecord.orgEmail__c;
                }
                if (firstRecord.Org_BMSId__c) {
                    org.bmsId = firstRecord.Org_BMSId__c;
                }
                // BSB and Account Number from staff
                if (firstRecord.Staff__r?.BSB__c) {
                    org.bsb = firstRecord.Staff__r.BSB__c;
                }
                if (firstRecord.Staff__r?.Account_Number__c) {
                    org.accountNumber = firstRecord.Staff__r.Account_Number__c;
                }
            }
        }
        
        console.log('Organisation Details:', JSON.stringify(org));
        return org;
    }

    // ==========================================
    // BUILD CORRECT ABA (BOQ SPECIFICATION)
    // ==========================================

    buildCorrectABA(staffRecords, orgDetails) {
        console.log('===== buildCorrectABA START =====');
        
        if (!staffRecords || staffRecords.length === 0) {
            throw new Error('No employee records available');
        }
        
        const config = {
            userId: orgDetails?.userId || this.orgUserId || '123456',
            bankCode: 'BQL',
            description: 'SUPER',
            userName: orgDetails?.name || this.orgName || 'Swift Senders Pty Ltd',
            processDate: this.paymentDate || new Date().toISOString().split('T')[0],
            traceBSB: orgDetails?.bsb || this.orgBSB || this.organisation?.BSB__c || '124001',
            traceAccount: orgDetails?.accountNumber || this.orgAccountNumber || this.organisation?.Account_Number__c || '123456789',
            traceAccountName: orgDetails?.name || this.orgName || this.organisation?.Name || 'Organisation Account',
            contraReference: 'CONTRA WAGES',
            contraTransactionCode: '13',
            abn: orgDetails?.abn || this.orgABN || this.organisation?.ABN__c || '99900007496'
        };
        
        console.log('ABA Config:', JSON.stringify(config));
        
        function leftBlank(value, length) {
            value = (value == null) ? "" : String(value);
            if (value.length > length) value = value.substring(0, length);
            return value.padEnd(length, " ");
        }
        
        function rightZero(value, length) {
            value = (value == null) ? "" : String(value);
            if (value.length > length) value = value.substring(0, length);
            return value.padStart(length, "0");
        }
        
        function rightBlank(value, length) {
            value = (value == null) ? "" : String(value);
            if (value.length > length) value = value.substring(0, length);
            return value.padStart(length, " ");
        }
        
        function formatBSB(value) {
            if (!value) {
                console.warn('BSB is empty, using default 124-001');
                return '124-001';
            }
            const digits = String(value).replace(/\D/g, "");
            if (digits.length !== 6) {
                console.warn(`Invalid BSB: ${value}, using default 124-001`);
                return '124-001';
            }
            return digits.substring(0, 3) + "-" + digits.substring(3);
        }
        
        function abaDate(date) {
            const d = new Date(date);
            if (isNaN(d.getTime())) throw new Error("Invalid process date.");
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yy = String(d.getFullYear()).slice(-2);
            return dd + mm + yy;
        }
        
        function formatAmount(value) {
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue <= 0) return rightZero(0, 10);
            const cents = Math.round(numValue * 100);
            return rightZero(cents, 10);
        }
        
        function validateRecord(record, type) {
            if (record.length !== 120) {
                console.warn(`${type} record length is ${record.length}. Expected 120.`);
                if (record.length < 120) return record.padEnd(120, ' ');
                return record.substring(0, 120);
            }
            return record;
        }
        
        const processDate = abaDate(config.processDate);
        const traceBSB = formatBSB(config.traceBSB);
        const traceAccountNumber = String(config.traceAccount).replace(/\D/g, '');
        const traceAccount = rightBlank(traceAccountNumber.substring(0, 9), 9);
        
        // HEADER (Type 0)
        const header = 
            "0" +
            leftBlank("", 17) +
            "01" +
            leftBlank(config.bankCode, 3) +
            leftBlank("", 7) +
            leftBlank(config.userName, 26) +
            rightZero(config.userId.replace(/\D/g, ''), 6) +
            leftBlank(config.description, 12) +
            processDate +
            leftBlank("", 40);
        
        const headerRecord = validateRecord(header, 'Header');
        console.log('Header Record:', headerRecord, 'Length:', headerRecord.length);
        
        // DETAIL RECORDS (Type 1)
        let totalCredits = 0;
        const detailRecords = [];
        let detailCounter = 0;
        
        const eligibleEmployees = staffRecords.filter(emp => 
            emp.Super_And_Voluntary_Supper_Annuation__c && 
            parseFloat(emp.Super_And_Voluntary_Supper_Annuation__c) > 0 &&
            emp.Staff__r &&
            emp.Staff__r.BSB__c &&
            emp.Staff__r.Account_Number__c
        );
        
        console.log(`Found ${eligibleEmployees.length} eligible employees`);
        
        eligibleEmployees.forEach((emp, index) => {
            detailCounter++;
            const staff = emp.Staff__r;
            const amount = parseFloat(emp.Super_And_Voluntary_Supper_Annuation__c) || 0;
            if (amount <= 0) return;
            
            const employeeBSB = staff.BSB__c ? formatBSB(staff.BSB__c) : traceBSB;
            const employeeAccount = staff.Account_Number__c ? 
                rightBlank(String(staff.Account_Number__c).replace(/\D/g, '').substring(0, 9), 9) : 
                traceAccount;
            
            const employeeName = `${staff.Last_Name__c || 'Employee'} ${staff.Name || ''}`.trim();
            const accountTitle = leftBlank(employeeName, 32);
            const reference = leftBlank(emp.Name || `REF${String(index + 1).padStart(4, '0')}`, 18);
            const amountFormatted = formatAmount(amount);
            totalCredits += amount;
            
            const detail =
                "1" +
                employeeBSB +
                employeeAccount +
                " " +
                "50" +
                amountFormatted +
                accountTitle +
                reference +
                traceBSB +
                traceAccount +
                leftBlank(config.userName, 16) +
                "00000000";
            
            const detailRecord = validateRecord(detail, `Detail ${detailCounter}`);
            detailRecords.push(detailRecord);
            console.log(`Detail ${detailCounter}:`, detailRecord);
        });
        
        if (detailRecords.length === 0) {
            throw new Error('No valid employee records with superannuation and bank details');
        }
        
        // CONTRA RECORD (Type 1) — self-balancing debit
        const contraAmount = formatAmount(totalCredits);
        const contra =
            "1" +
            traceBSB +
            traceAccount +
            " " +
            config.contraTransactionCode +
            contraAmount +
            leftBlank(config.traceAccountName, 32) +
            leftBlank(config.contraReference, 18) +
            traceBSB +
            traceAccount +
            leftBlank(config.userName, 16) +
            "00000000";
        
        const contraRecord = validateRecord(contra, 'Contra');
        detailRecords.push(contraRecord);
        console.log('Contra Record:', contraRecord);
        
        // FOOTER (Type 7)
        const totalCents = Math.round(totalCredits * 100);
        
        const footer =
            "7" +
            "999-999" +
            leftBlank("", 12) +
            rightZero(0, 10) +                  // 21-30 Net Total — MUST be 0 in self-balanced file
            rightZero(totalCents, 10) +         // 31-40 Credit Total
            rightZero(totalCents, 10) +         // 41-50 Debit Total
            leftBlank("", 24) +
            rightZero(detailRecords.length, 6) + // includes contra record
            leftBlank("", 40);
        
        const footerRecord = validateRecord(footer, 'Footer');
        console.log('Footer Record:', footerRecord);
        
        // ASSEMBLE
        const allRecords = [headerRecord, ...detailRecords, footerRecord];
        const abaContent = allRecords.join('\r\n') + '\r\n';
        
        console.log('✅ ABA generated');
        console.log(`  Org: ${config.userName}, ABN: ${config.abn}`);
        console.log(`  Trace BSB: ${traceBSB}, Trace Acct: ${traceAccount}`);
        console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
        console.log(`  Detail Records (incl contra): ${detailRecords.length}`);
        
        return abaContent;
    }

    // ==========================================
    // DOWNLOAD ABA FILE (BOQ Specification)
    // ==========================================

    downloadABAFile(content, fileName) {
        console.log('===== downloadABAFile START =====');
        console.log('File Name:', fileName);
        console.log('Content Length:', content ? content.length : 0);
        
        if (!content) {
            this.showToast('Error', 'No content to download', 'error');
            return;
        }
        
        try {
            // Clean up the content
            let cleanContent = content;
            
            // If content has separators, extract the actual ABA content
            if (content.includes('===== FILE FOR UUID')) {
                const lines = content.split('\n');
                let extractedContent = '';
                let inFile = false;
                let fileFound = false;
                
                for (const line of lines) {
                    if (line.includes('===== FILE FOR UUID')) {
                        if (!fileFound) {
                            fileFound = true;
                            inFile = true;
                            continue;
                        } else {
                            break;
                        }
                    }
                    if (inFile && line.trim() !== '') {
                        extractedContent += line + '\n';
                    }
                }
                cleanContent = extractedContent.trim();
                console.log('Extracted ABA content length:', cleanContent.length);
            }
            
            // Split into records and fix each to be exactly 120 characters
            const records = cleanContent.split('\n').filter(line => line.trim() !== '');
            const fixedRecords = records.map(record => {
                let cleanRecord = record.replace(/\r/g, '');
                if (cleanRecord.length < 120) {
                    return cleanRecord.padEnd(120, ' ');
                } else if (cleanRecord.length > 120) {
                    return cleanRecord.substring(0, 120);
                }
                return cleanRecord;
            });
            
            cleanContent = fixedRecords.join('\r\n') + '\r\n';
            
            console.log('Fixed Content Length:', cleanContent.length);
            
            // Create blob with ABA content
            const blob = new Blob([cleanContent], { 
                type: 'text/plain;charset=ascii' 
            });
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || `SuperContribution_${new Date().toISOString().split('T')[0]}.aba`;
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            console.log('✅ ABA file downloaded:', fileName);
            
        } catch (error) {
            console.error('Error downloading ABA file:', error);
            this.showToast('Error', 'Failed to download ABA file: ' + error.message, 'error');
        }
    }

    // ==========================================
    // HANDLE SINGLE ABA FILE
    // ==========================================

    handleSingleABAFile(result) {
        console.log('===== handleSingleABAFile START =====');
        
        let fileContent = result.fileContent || '';
        
        if (!fileContent) {
            this.buildAndDownloadABAFromStaff();
            return;
        }
        
        // Check if it contains multiple files combined
        if (fileContent.includes('===== FILE FOR UUID')) {
            const lines = fileContent.split('\n');
            let firstFileContent = '';
            let inFile = false;
            let fileFound = false;
            
            for (const line of lines) {
                if (line.includes('===== FILE FOR UUID')) {
                    if (!fileFound) {
                        fileFound = true;
                        inFile = true;
                        continue;
                    } else {
                        break;
                    }
                }
                if (inFile && line.trim() !== '') {
                    firstFileContent += line + '\n';
                }
            }
            fileContent = firstFileContent.trim();
        }
        
        // Validate it's ABA format
        if (fileContent.startsWith('0') && fileContent.includes('7')) {
            const fileName = result.fileName || 'SuperContribution.aba';
            this.downloadABAFile(fileContent, fileName);
            this.showToast('Success', 'ABA file downloaded successfully', 'success');
        } else {
            // Fallback: build from staff records
            this.buildAndDownloadABAFromStaff();
        }
    }

    // ==========================================
    // HANDLE MULTIPLE ABA FILES
    // ==========================================

    handleMultipleABAFiles(result) {
        console.log('===== handleMultipleABAFiles START =====');
        
        if (!result.abaFiles || result.abaFiles.length === 0) {
            this.buildAndDownloadABAFromStaff();
            return;
        }
        
        // If only one file, download it directly
        if (result.abaFiles.length === 1) {
            const file = result.abaFiles[0];
            this.downloadABAFile(file.fileContent, file.fileName);
            this.showToast('Success', 'ABA file downloaded successfully', 'success');
            return;
        }
        
        // Multiple files - show modal with preview
        this.abaExtractData = result.abaData || [];
        this.abaFileName = result.fileName || 'SuperContribution_Multiple.aba';
        
        // Build combined content for preview
        let combinedContent = '';
        result.abaFiles.forEach((file, index) => {
            combinedContent += `========== FILE ${index + 1}: ${file.fileName} ==========\n`;
            combinedContent += file.fileContent;
            combinedContent += '\n\n';
        });
        this.abaContent = combinedContent;
        this.showAbaExtract = true;
        
        // Download all files individually
        result.abaFiles.forEach((file, index) => {
            setTimeout(() => {
                this.downloadABAFile(file.fileContent, file.fileName);
            }, index * 500);
        });
        
        this.showToast('Info', `Downloading ${result.abaFiles.length} ABA files...`, 'info');
    }

    // ==========================================
    // CLOSE ABA EXTRACT MODAL
    // ==========================================

    closeAbaExtract() {
        this.showAbaExtract = false;
        this.abaExtractData = [];
        this.abaContent = '';
        this.abaFileName = '';
    }

    // ==========================================
    // DOWNLOAD ABA FROM MODAL
    // ==========================================

    downloadABAFileFromModal() {
        console.log('===== downloadABAFileFromModal START =====');
        
        if (this.abaContent) {
            const fileName = this.abaFileName || 'SuperContribution.aba';
            this.downloadABAFile(this.abaContent, fileName);
            this.showToast('Success', 'ABA file downloaded successfully', 'success');
        } else if (this.abaResult && this.abaResult.abaFiles && this.abaResult.abaFiles.length > 0) {
            this.abaResult.abaFiles.forEach((file, index) => {
                setTimeout(() => {
                    this.downloadABAFile(file.fileContent, file.fileName);
                }, index * 500);
            });
            this.showToast('Success', `Downloading ${this.abaResult.abaFiles.length} ABA files`, 'success');
        } else {
            this.buildAndDownloadABAFromStaff();
        }
    }

    // ==========================================
    // SHOW TOAST (Helper Method)
    // ==========================================

    showToast(title, message, variant) {
        try {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: title,
                    message: message,
                    variant: variant || 'info',
                    mode: 'dismissable'
                })
            );
        } catch (error) {
            console.error('Failed to dispatch toast notification:', error);
        }
    }


    // ==========================================
    // NEW: PROCESS PAYMENT BUTTON HANDLER
    // ==========================================

    @track processPaymentButtonDisabled = true;

    /**
     * Handles the Process Payment button click
     * This calls the OZEDI API to send all uploads for payment
     */
    handleProcessPayment() {
        console.log('===== handleProcessPayment START =====');
        console.log('Payset ID:', this.paysetId);
        
        if (!this.paysetId) {
            this.showToast('Error', 'No payroll setting selected', 'error');
            return;
        }
        
        // Show confirmation dialog
        this.showPaymentConfirmation();
    }

    /**
     * Shows payment confirmation dialog with details
     */
    showPaymentConfirmation() {
        console.log('===== showPaymentConfirmation START =====');
        
        // Get employee count
        let employeeCount = 0;
        let totalAmount = 0;
        
        if (this.staffrecords) {
            employeeCount = this.staffrecords.length;
            this.staffrecords.forEach(record => {
                if (record.Super_And_Voluntary_Supper_Annuation__c) {
                    totalAmount += parseFloat(record.Super_And_Voluntary_Supper_Annuation__c);
                }
            });
        }
        
        // Build confirmation message
        let message = 'Are you sure you want to process payment for this pay run?\n\n';
        message += `📊 Pay Run: ${this.groupName || 'N/A'}\n`;
        message += `👥 Employees: ${employeeCount}\n`;
        message += `💰 Total Amount: $${totalAmount.toFixed(2)}\n\n`;
        message += 'This will send all valid superannuation contributions to OZEDI for payment processing.\n';
        message += 'This action cannot be undone.';
        
        // Show confirmation modal
        this.confirmationMessage = message;
        this.showConfirmationModal = true;
    }

    /**
     * Confirms and processes the payment
     */
    confirmProcessPayment() {
        console.log('===== confirmProcessPayment START =====');
        this.showConfirmationModal = false;
        
        // Show progress
        this.showProgress = true;
        this.statusMessage = 'Processing payment...';
        this.processPaymentButtonDisabled = true;
        
        // Call Apex to process payment
        processPayrunPayment({ paySetId: this.paysetId })
            .then(result => {
                console.log('Payment Processing Result:', JSON.stringify(result));
                this.showProgress = false;
                this.processPaymentButtonDisabled = false;
                
                if (result.success) {
                    // Show success message
                    let message = result.message || 'Payment processed successfully';
                    
                    if (result.allSuccess) {
                        this.showToast('Success', message, 'success');
                    } else if (result.partialSuccess) {
                        this.showToast('Warning', '⚠️ ' + message, 'warning');
                        
                        // Show detailed results in modal
                        this.showPaymentResults(result);
                    } else {
                        this.showToast('Error', 'Payment processing failed', 'error');
                        
                        // Show failure details
                        this.showPaymentResults(result);
                    }
                    
                    // Refresh data
                    this.fetchPayrun();
                    
                    // Update pay run status
                    setTimeout(() => {
                        this.isopenPaysettings = false;
                        setTimeout(() => {
                            this.isopenPaysettings = true;
                            this.payLoadData();
                        }, 500);
                    }, 1000);
                    
                } else {
                    this.showToast('Error', result.message || 'Payment processing failed', 'error');
                    
                    // Show detailed error
                    if (result.failedUuids && result.failedUuids.length > 0) {
                        this.showPaymentResults(result);
                    }
                }
            })
            .catch(error => {
                console.error('Error processing payment:', error);
                this.showProgress = false;
                this.processPaymentButtonDisabled = false;
                
                let errorMessage = 'Failed to process payment: ';
                if (error.body && error.body.message) {
                    errorMessage += error.body.message;
                } else if (error.message) {
                    errorMessage += error.message;
                } else {
                    errorMessage += 'Unknown error';
                }
                
                this.showToast('Error', errorMessage, 'error');
            });
    }

    /**
     * Shows detailed payment results in a modal
     */
    showPaymentResults(result) {
        console.log('===== showPaymentResults START =====');
        
        let message = '';
        
        // Successful payments
        if (result.successfulUuids && result.successfulUuids.length > 0) {
            message += '✅ SUCCESSFUL PAYMENTS\n';
            message += '='.repeat(50) + '\n';
            result.successfulUuids.forEach((uuid, index) => {
                message += `${index + 1}. UUID: ${uuid}\n`;
            });
            message += '\n';
        }
        
        // Skipped payments (already sent)
        if (result.skippedUuids && result.skippedUuids.length > 0) {
            message += '⏭️ SKIPPED PAYMENTS (Already Sent)\n';
            message += '='.repeat(50) + '\n';
            result.skippedUuids.forEach((skip, index) => {
                message += `${index + 1}. UUID: ${skip.uploadUuid}\n`;
                message += `   Status: ${skip.status || 'Already Sent'}\n`;
                message += `   Message: ${skip.message || 'Already processed'}\n`;
            });
            message += '\n';
        }
        
        // Failed payments
        if (result.failedUuids && result.failedUuids.length > 0) {
            message += '❌ FAILED PAYMENTS\n';
            message += '='.repeat(50) + '\n';
            result.failedUuids.forEach((failure, index) => {
                message += `${index + 1}. UUID: ${failure.uploadUuid}\n`;
                message += `   Error: ${failure.message || 'Unknown error'}\n`;
                if (failure.errorDetails) {
                    // Try to extract just the detail from the error
                    let detail = failure.errorDetails;
                    try {
                        const parsed = JSON.parse(detail);
                        if (parsed.detail) {
                            detail = parsed.detail;
                        }
                    } catch (e) {
                        // Keep as is
                    }
                    message += `   Details: ${detail}\n`;
                }
                message += '\n';
            });
        }
        
        if (message) {
            this.validationErrorModalMessage = message;
            this.showValidationErrorModal = true;
        }
    }

    // ==========================================
    // CONFIRMATION MODAL PROPERTIES
    // ==========================================

    @track showConfirmationModal = false;
    @track confirmationMessage = '';

    /**
     * Closes the confirmation modal
     */
    closeConfirmationModal() {
        this.showConfirmationModal = false;
    }

    // ==========================================
    // GETTERS FOR BUTTON STATES
    // ==========================================

    get payButtonDisabled() {
        return !this.paysetId || this.showProgress;
    }

    get processPaymentButtonDisabled() {
        return !this.paysetId || this.showProgress || this.statusValueTest === 'Draft';
    }



}