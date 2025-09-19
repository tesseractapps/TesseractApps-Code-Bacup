import { LightningElement , track, wire,api} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import accpetedStaffPayroll from '@salesforce/apex/MyProfileHandler.accpetedStaffPayroll';
import organizationDetails from '@salesforce/apex/InvoiceHandler.organizationDetails';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import UserEmail from '@salesforce/schema/User.Email';
import UsrRoleName from '@salesforce/schema/User.User_Role__c';
import userOrgName from '@salesforce/schema/User.Organization_Name__c';
import updatePayeventIndicator from '@salesforce/apex/PayRunHandler.updatePayeventIndicator';
import My_Resource from "@salesforce/resourceUrl/myResource";
import getFinalisedList from '@salesforce/apex/PayRunHandler.getFinalisedList';
import submitPayload from '@salesforce/apex/GovReportsAPICallout.submitPayload';
import insertSTPFinalise from '@salesforce/apex/PayRunHandler.insertSTPFinalise';
import getFinalisedActivityLog from '@salesforce/apex/PayRunHandler.getFinalisedActivityLog';
import getPullRequest from '@salesforce/apex/GovReportsAPICallout.getPullRequest';

const actions = [
    { label: 'Show Response', name: 'Show_Pull_Request_Response' } , 
    { label: 'Show JSON Data', name: 'Show_JSON_Data' }, 
    { label: 'Get Pull Request', name: 'Get_Pull_Request' },
      
 ];

export default class FinalisedLwc extends NavigationMixin(LightningElement) {

    @track pageSizeOptions = [10, 25, 50, 75, 100]; //Page size options
    @track records = []; //All records available in the data table
    @track columns = []; //columns information available in the data table
    @track totalRecords = 0; //Total no.of records
    @track pageSize; //No.of records to be displayed per page
    @track totalPages; //Total no.of pages
    @track pageNumber = 1; //Page number    
    @track recordsToDisplay = []; //Records to be displayed on the page
    @track currentUser;
    @track currentUserEmail;
    @track currentUserRole
    @track usererror;
    @track userOrgName;
    @track error;
    @track financialStartDate;
    @track financialEndDate;
    @track accList;
    STPloading = My_Resource+'/myResource/images/STPloading.gif';
    @track openservice;
    @track YearValue;
   
    
    @track staffPayCoulumns= [
        {
        label: 'Resourse Name',
        fieldName: 'Resource_Name__c' ,  initialWidth: 150       
        },
        {            
            label: 'Last Pay Date',
            fieldName: 'Pay_Date__c',  initialWidth: 120,type: 'date',
            typeAttributes:{month: "2-digit",day: "2-digit",year: "numeric"} 
        },
        {            
            label: 'Tax',
            fieldName: 'Current_Tax_YTD__c',  initialWidth:80,  type: 'currency',
            cellAttributes: { alignment: 'left' }
        },
        {            
            label: 'Superannuation',
            fieldName: 'Current_Super_and_Voluntaryannuation_YTD__c',  initialWidth: 140,  type: 'currency',
            cellAttributes: { alignment: 'left' }
        },
        {            
            label: 'Gross Salary',
            fieldName: 'Current_Taxble_Gross_Salary_YTD__c',  initialWidth: 120,  type: 'currency',
            cellAttributes: { alignment: 'left' }
        }
        ,
        {            
            label: 'Net Pay Salary',
            fieldName: 'Current_Net_Pay_Salary_YTD__c',  initialWidth: 120, 
             type: 'currency',
            cellAttributes: { alignment: 'left' }
        },
        {            
            label: 'Pre Tax',
            fieldName: 'Current_Pre_Tax_YTD__c',  initialWidth: 120,  type: 'currency',
            cellAttributes: { alignment: 'left' }
        },
        {            
            label: 'Post Tax',
            fieldName: 'Current_Post_Tax_YTD__c',  initialWidth: 120,  type: 'currency',
            cellAttributes: { alignment: 'left' }
        },
        {            
           label: 'Payroll Status', fieldName: 'PayrollStatus', type: 'text' ,initialWidth: 120
        }  ,{            
            label: 'Finalised',
            fieldName: 'Finalised_Formula__c',  initialWidth: 120
        } 
    ];

    get yearOptions() {
        return [
            { label: '2023-2024', value: '2023-2024' },
            { label: '2024-2025', value: '2024-2025' },
            { label: '2025-2026', value: '2025-2026' },
        ];
    }
     connectedCallback() {  
         this.hideParentChildHandler();
     }
    @wire(getRecord, { recordId: Id, fields: [UserNameFld ,UserEmail,UsrRoleName,userOrgName]}) 
    userDetails({error, data}) {
        if (data) {
            this.currentUser = data.fields.Name.value; 
            this.currentUserEmail=data.fields.Email.value;
            this.currentUserRole =data.fields.User_Role__c.value;
            this.userOrgName=data.fields.Organization_Name__c.value;
            // console.log('role==>'+this.currentUserRole);
           // console.log('current logged in user==>'+this.currentUser) ; 
          //  console.log('current logged in user orgname==>'+this.userOrgName) ; 
            this.YearValue='2024-2025';
            this.calculateFinancialYear( this.YearValue);
        } else if (error) {
            this.usererror = error ;
        }
    }

    handleYearChange(event){
        this.YearValue = event.detail.value;
        //console.log('Event Detail: ' + JSON.stringify(event.detail));
        this.calculateFinancialYear( this.YearValue);

    }

    calculateFinancialYear(selectedYear) {
        // Parse the selected year to get the start and end year
        const years = selectedYear.split('-');
        const startYear = parseInt(years[0], 10);
        const endYear = parseInt(years[1], 10);

        // Set the financial start and end dates
        this.financialStartDate = new Date(startYear, 6, 1);
        this.financialEndDate = new Date(endYear, 5, 30);

        const startYearFormatted = this.financialStartDate.getFullYear();
        const startMonthFormatted = String(this.financialStartDate.getMonth() + 1).padStart(2, '0'); // Adding 1 since month is zero-based
        const startDayFormatted = String(this.financialStartDate.getDate()).padStart(2, '0');
        this.financialStartDate = `${startYearFormatted}-${startMonthFormatted}-${startDayFormatted}`;

        const endYearFormatted = this.financialEndDate.getFullYear();
        const endMonthFormatted = String(this.financialEndDate.getMonth() + 1).padStart(2, '0'); // Adding 1 since month is zero-based
        const endDayFormatted = String(this.financialEndDate.getDate()).padStart(2, '0');
        this.financialEndDate = `${endYearFormatted}-${endMonthFormatted}-${endDayFormatted}`;

        console.log('Financial year start date: ' + this.financialStartDate);
        console.log('Financial year end date: ' + this.financialEndDate);

        if (this.financialStartDate && this.financialEndDate) {
            this.loadStaffData();
        }
    }
        
    loadStaffData(){
        this.records=[];
        this.totalRecords=0;
        accpetedStaffPayroll({orgName: this.userOrgName,staffId: null,startDate: this.financialStartDate,enddate: this.financialEndDate,isFinalised:true}).then(result=>{  
             
            if (result != null) {  
                //console.log('payslip data '+JSON.stringify(result)); 
                result.sort((a, b) => new Date(a.Pay_Date__c) - new Date(b.Pay_Date__c));

                // Step 2: Use a Map to keep track of the latest entry for each `Staff__c`
                const mapStaffPayList = new Map();
                
                // Step 3: Iterate over the sorted array and update the Map
                result.forEach(ss => {
                    if(ss.Payroll_Setting__r.Status__c === "Submitted" || ss.Payroll_Setting__r.Status__c === "STP Filed" ){ 
                        mapStaffPayList.set(ss.Staff__c, ss);
                    }
                   
                });
                
                // Step 4: Convert the Map values to an array
                const latestEntriesArray = Array.from(mapStaffPayList.values());
                
                // `latestEntriesArray` now contains the latest entry for each unique `Staff__c`
                
                this.records = latestEntriesArray.map(value=>{
                        return {
                                    Id:value.Id,
                                    Resource_Name__c:value.Resource_Name__c,
                                    Pay_Date__c:value.Pay_Date__c,
                                    Current_Tax_YTD__c:parseFloat(value.Current_Tax_YTD__c).toFixed(2),
                                    Current_Super_and_Voluntaryannuation_YTD__c: value.Current_Super_and_Voluntaryannuation_YTD__c,
                                    Current_Taxble_Gross_Salary_YTD__c: parseFloat(value.Current_Taxble_Gross_Salary_YTD__c).toFixed(2),
                                    Current_Net_Pay_Salary_YTD__c: parseFloat(value.Current_Net_Pay_Salary_YTD__c).toFixed(2),
                                    Current_Pre_Tax_YTD__c:parseFloat(value.Current_Pre_Tax_YTD__c).toFixed(2),
                                    Current_Post_Tax_YTD__c:parseFloat(value.Current_Post_Tax_YTD__c).toFixed(2),
                                    Finalised_Formula__c:value.Finalised_Formula__c,
                                    PayrollStatus:value.Payroll_Setting__r.Status__c,
                                    Pay_Event_Indicator__c:value.Pay_Event_Indicator__c
                                }
                }); 
                //console.log('each records'+JSON.stringify( this.records));  
                //this.records=latestEntriesArray;
                this.totalRecords = this.records.length;       
                this.pageSize = this.pageSizeOptions[0]; //set pageSize with default value as first option
                this.pageNumber = 1;
                this.paginationHelper(); // call helper menthod to update pagination logic 
            } 
        }).catch(error=>{
            this.accList = undefined; 
            this.error = error;
        })
                
    }

    
    hadleDates(event) {
        if (event.target.name == 'StartDateInput') {
            this.financialStartDate = event.detail.value; 
            this.loadStaffData();
        }
        if (event.target.name == 'EndDateInput') {
            this.financialEndDate = event.detail.value;
            this.loadStaffData();
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
        this.accList = [];
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
            this.accList.push(this.records[i]);            
        }       
        //refreshApex(this.accList);
    }

     @track datain={
        PayEventPayer:null ,
        Intermediary: null,
        PayEventPayees: [],
        SoftwareID: ""
      };

     @track stpRefId;
     @track showProgressbar=false;    
     @track isProgressing = false;
     @track disableFinalised=true;
     @track staffIDList;

    handleRowSelection(event) {
     
            this.staffIDList=[];
            for (let rec of  event.detail.selectedRows) {
                if (rec.Pay_Event_Indicator__c == true ) {
                    this.disableFinalised = true;
                    const event = new ShowToastEvent({
                        title: 'Error',
                        message: 'You have selected a staff member who has been finalised. Please deselect this staff member.',
                        variant: 'Error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(event);
                    return;
                } else if(rec.PayrollStatus=='Submitted'){
                    this.disableFinalised = true;
                    const event = new ShowToastEvent({
                        title: 'Error',
                        message: 'You have selected a staff member who has been Submitted. Please File the STP.',
                        variant: 'Error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(event);
                    return;

                }
                else if(event.detail.selectedRows.length >0) {
                    this.disableFinalised = false;
                    this.staffIDList.push(rec.Id);
                } else{
                    this.disableFinalised = true;
                }

             
            }
              if(event.detail.selectedRows.length==0){
                this.disableFinalised = true;
                this.closeActivity();
              }
           // console.log('id list '+ this.staffIDList);   
            
       
    }
    handlePaySettings(){
       
        getFinalisedList({idList:this.staffIDList}).then(response=>{
            //console.log(' response '+JSON.stringify(response));
            this.datain={
                PayEventPayer:null ,
                Intermediary: null,
                PayEventPayees: [],
                SoftwareID: ""
              }

            response.forEach(record => {              
                let tempRec = Object.assign({}, record);
                this.isProgressing=true;
                this.showProgressbar=true;  
                

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
                          FinalEventIndicator: true,
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
                              SuperEntitlementAmount:tempRec.Current_Super_and_Voluntaryannuation_YTD__c
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
                            PayerDeclaration:{  PayerDeclarerIdentifier: this.currentUser,
                                    PayerDeclarationDate: new Date(),
                                    PayerDeclarationAcceptanceIndicator:true},   
                        }
            this.datain.PayEventPayer=payerDetails; 
            this.datain.PayEventPayees.push(payeedetails);
            })
            this.datain.SoftwareID=response[0].Staff__r.Facility__r.Organisation__r.SoftwareId__c;
        
     
        }).catch(error=>{

        })
        setTimeout(() => {
            this.submitSTP();
        },3000)
        
    }
    submitSTP(){
       console.log('data in payload '+JSON.stringify(this.datain));
        this.isProgressing=true;
        this.showProgressbar=true;    
        submitPayload({data: JSON.stringify(this.datain),isUpdate:true}).then(response =>{            
            setTimeout(() => {
               // console.log('1st Call');
               console.log('stp response '+JSON.stringify(JSON.parse(response)));
               const parsedResponse = JSON.parse(response);
                console.log('ref id '+ parsedResponse.Result.RefMessageID);
               this.stpRefId=parsedResponse.Result.RefMessageID;
                    if(this.stpRefId ==null){                    
                        //alert('STP filing Failed. Please out to System admin');
                        const event = new ShowToastEvent({
                            title: '',
                            message: 'STP filing Failed. Please Contact System Admin',
                            variant: 'Error',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(event);
                        this.isProgressing=false;
                        this.showProgressbar=false; 
                        this.loadStaffData(); 
                        insertSTPFinalise({staffPayIDList:this.staffIDList,typeOfsubmission:'Finalise',output:response,refID: this.stpRefId});
                    } else{
                      updatePayeventIndicator({idList:this.staffIDList}).then(response=>{
                        const event = new ShowToastEvent({
                            title: '',
                            message: 'STP filed successfully',
                            variant: 'Success',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(event);                    
                        this.showProgressbar=false;
                        this.isProgressing=false;
                        setTimeout(() => {
                            this.loadStaffData();
                        },2000)
                      });
                        
                      insertSTPFinalise({staffPayIDList:this.staffIDList,typeOfsubmission:'Finalise',output:response,refID: this.stpRefId});
                    }

                }, 5000);
            
            if(!this.stpRefId == '' || !this.stpRefId == null){
                //update salesforce record
                //console.log(' this.stpRefId in update', this.stpRefId);                       
            }

        }).catch(error=>{
           console.log('error '+JSON.stringify(error)) ;
            const event = new ShowToastEvent({
                title: '',
                message: 'STP filing Failed. Please Contact System Admin',
                variant: 'Error',
                mode: 'dismissable'
            });
            this.dispatchEvent(event);
            this.isProgressing=false;
            this.showProgressbar=false; 
        })
    }
    
   /*  handleBack(event){
       this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                
                pageName: 'payroll'
            },
             state: {
                c__ispayrollSettings: true,
            } 
        });
    } */
    @track displayActivity=true;
    @track activityData=[];
    @track error;
    @track showActivitytable=false;
    @track showJsondata=false;
    @track payLoad={
        PayEventPayer:null ,
        Intermediary: null,
        PayEventPayees: [],
        SoftwareID: ""
      };
    @track signatureValue;
    @track softWareID='';
    @track agentNumber='';
    @track isShowResponse=false;
    @track finalOutPutResponse={};

    showActivity(){
        this.displayActivity=false;
        this.showActivitytable=true;
        this.activityData=[];
        let sectletedRows= this.template.querySelector('lightning-datatable').getSelectedRows();
        console.log('selected rows ==> '+JSON.stringify(sectletedRows));
        if (sectletedRows.length == 1 ) {
            getFinalisedActivityLog({ staffPayID: sectletedRows[0].Id }).then(result=>{
                console.log('result '+JSON.stringify(result)) ;
                this.activityData = result.map(row => ({
                    Id: row.Id,
                    Finalise_Response__c: row.Finalise_Response__c,
                    stpoverallresponse: JSON.parse(row.Finalise_Response__c).IsSuccess === true ? 'Success' : 'Failed',
                    Finalise_Date__c: this.formatDate(row.Finalise_Date__c),
                    Payer_Declaration_Date__c: this.formatDate(row.Payer_Declaration_Date__c),
                    Type_of_Submission__c: row.Type_of_Submission__c,
                    Finalise_Ref_ID__c: row.Finalise_Ref_ID__c,
                    Staff_Payroll_Setting__c : row.Staff_Payroll_Setting__c,
                }));
                console.log('Activity Data Result :'+JSON.stringify(this.activityData));
            }).catch(error => {
                console.error('Error retrieving data:', error);
            });
        }   
    }  
    
    closeActivity(){
        this.displayActivity=true;
        this.activityData=[];
        this.showActivitytable=false;
    }

    @track stpRefID = '';
    @track status = '';
    @track reportedDate = '';  // This field is not in your JSON, so it will remain empty
    @track declarationDate = '';  // This field is also not in your JSON
    @track shortMessage;
    @track submissionType;

    closeJSonData(){
        this.payLoad={
            PayEventPayer:null ,
            Intermediary: null,
            PayEventPayees: [],
            SoftwareID: ""
          }
        this.showJsondata = false;
        this.finalOutPutResponse={};
    }

    getJSONData(stffPayList){
        //console.log('Staff Paylist : '+stffPayList);
        getFinalisedList({idList:stffPayList}).then(response=>{
            //console.log(' response '+JSON.stringify(response));
            this.payLoad={
                PayEventPayer:null ,
                Intermediary: null,
                PayEventPayees: [],
                SoftwareID: ""
              }

            response.forEach(record => {              
                let tempRec = Object.assign({}, record);
                
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
                          FinalEventIndicator: true,
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
                              SuperEntitlementAmount:tempRec.Current_Super_and_Voluntaryannuation_YTD__c
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
                            PayerDeclaration:{  PayerDeclarerIdentifier: this.currentUser,
                                    PayerDeclarationDate: new Date(),
                                    PayerDeclarationAcceptanceIndicator:true},   
                        }
            this.payLoad.PayEventPayer=payerDetails; 
            this.payLoad.PayEventPayees.push(payeedetails);
            })
            this.payLoad.SoftwareID=response[0].Staff__r.Facility__r.Organisation__r.SoftwareId__c;
            this.softWareID=response[0].Staff__r.Facility__r.Organisation__r.SoftwareId__c;
            this.agentNumber=response[0].Staff__r.Facility__r.Organisation__r.Agent_Number__c;
         
            this.payLoad=JSON.stringify(this.payLoad, null, 2);
        }).catch(error=>{

        })
    }

    // Helper function to format the date to dd-mm-yyyy
    formatDate(dateString) {
        if (!dateString) {
            return 'N/A'; // Return 'N/A' if the date is not available
        }
        const date = new Date(dateString);        
        // Format the date as dd-mm-yyyy
        const day = String(date.getDate()).padStart(2, '0'); // Add leading 0 if necessary
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();        
        return `${day}-${month}-${year}`;
    }

    handleShowResponse(event) {
        const rowId = event.target.dataset.id;
        const selectedRow = this.activityData.find(row => row.Id === rowId);
        console.log('Show Response Data:', selectedRow);
        
        if (selectedRow) {
            this.showJsondata = true;
            this.isShowResponse = true;
            const responseData = JSON.parse(selectedRow.Finalise_Response__c);
            this.finalOutPutResponse = JSON.stringify(responseData, null, 2);
            this.stpRefID = responseData.Result?.RefMessageID || 'No Data';
            this.shortMessage = responseData.MessageEvents?.[0]?.ShortMessage || 'No message available';
            this.status = responseData.OverallResult || 'Failure';
            
            this.submissionType = responseData.MessageEvents?.[0]?.EventType || 'No message available';
            this.reportedDate = selectedRow.Finalise_Date__c;
            this.declarationDate = selectedRow.Payer_Declaration_Date__c;
        }
    }
    
    handleShowJsonData(event) {
        const rowId = event.target.dataset.id;
        const selectedRow = this.activityData.find(row => row.Id === rowId);
       // console.log('Row Id : '+ rowId);
        console.log('Show JSON Data:',JSON.stringify(selectedRow));
    
        if (selectedRow) {
            let staffIDList = [selectedRow.Staff_Payroll_Setting__c];
          //  console.log('StaffPayrollSetting : '+staffIDList);
            this.getJSONData(staffIDList);
            this.showJsondata = true;
            this.isShowResponse = false;
        }
    }
    
    handleGetPullRequest(event) {
        const rowId = event.target.dataset.id;
        const selectedRow = this.activityData.find(row => row.Id === rowId);
        console.log('Get Pull Request Data:', selectedRow);
    
        if (selectedRow) {
            if (selectedRow.Type_of_Submission__c === 'Pull Request') {
                this.showToast('Error', 'Type of submit must be Finalise', 'Error');
            } else {
                let staffIDList = [selectedRow.Staff_Payroll_Setting__c];
                console.log('get pullrequest : '+ staffIDList);
                this.getJSONData(staffIDList);
                this.showProgressbar = true;
                this.isProgressing = true;
                this.agentData = {
                    "SoftwareID": this.softWareID,
                    "RefMessageID": selectedRow.Finalise_Ref_ID__c,
                    "RegisteredAgentNumber": this.agentNumber
                };
    
                getPullRequest({ payLoad: JSON.stringify(this.agentData), agentData: JSON.stringify(this.agentData) }).then(response => {
                    const parsedResponse = JSON.parse(response);
                    let overallStatus = parsedResponse.IsSuccess;
                    if (!overallStatus) {
                        //  this.showToast('Error', 'STP filing Failed. Please Contact System Admin', 'Error');
                            const event = new ShowToastEvent({
                            title: '',
                            message: 'STP filing Failed. Please Contact System Admin',
                            variant: 'Error',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(event);
                        this.isProgressing=false;
                        this.showProgressbar=false;
                    } else {
                        this.showToastMessage('Success', 'STP pull request successful');
                        this.isProgressing=false;
                                        this.showProgressbar=false;
                    }
                    insertSTPFinalise({ staffPayIDList: staffIDList, typeOfsubmission: 'Pull Request', output: response, refID: null });
                    this.showActivity();
                })
                .catch(error => {
                    this.showToast('Error', 'STP filing Failed. Please Contact System Admin', 'Error');
                    console.log('Error in pull request:', error);
                })
                .finally(() => {
                    this.isProgressing = false;
                    this.showProgressbar = false;
                });
            }
        }
    }

    HandleBack() {
        this.dispatchEvent(new CustomEvent("finalisedback"));
        // this.hideParentChildHandler();

    }
     hideParentChildHandler(){
        console.log('hideParentChildHandler calling  >> ');
        const event = new CustomEvent('hidepayrunsettings');
        this.dispatchEvent(event);
    }
      
}