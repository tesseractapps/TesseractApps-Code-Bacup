import { LightningElement, track, wire, api } from 'lwc';
import accpetedStaffPayroll from '@salesforce/apex/PayrunSettingHandler.accpetedStaffPayroll';
import getSTPActivityLog from '@salesforce/apex/PayRunHandler.getSTPActivityLog';
import Id from '@salesforce/user/Id';
import { getRecord } from 'lightning/uiRecordApi';
import UserNameFld from '@salesforce/schema/User.Name';
import getPullRequest from '@salesforce/apex/GovReportsAPICallout.getPullRequest';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import My_Resource from "@salesforce/resourceUrl/myResource";
import saveSTPResponse from '@salesforce/apex/PayRunHandler.saveSTPResponse';
import { refreshApex } from '@salesforce/apex';

const actions = [
    { label: 'Show Response', name: 'Show_Pull_Request_Response' } , 
    { label: 'Show JSON Data', name: 'Show_JSON_Data' }, 
    { label: 'Get Pull Request', name: 'Get_Pull_Request' },
      
 ];

export default class StpPullRequestSignature extends LightningElement {
    @api parentPaysetId;
    @track datain={
        PayEventPayer:null ,
        Intermediary: null,
        PayEventPayees: [],
        SoftwareID: ""
      };
    @track activityData=[];
    @track currentUser;
    @track usererror;
    @track signatureValue; 
    @track softWareID='';
    @track agentNumber='';
    @track displayActivity=true;
    @track error;
    @track showActivitytable=false;
    @track showJsondata=false;
    @track payLoad={
                    PayEventPayer:null ,
                    Intermediary: null,
                    PayEventPayees: [],
                    SoftwareID: "" };
    @track agentData={};
    @track showProgressbar=false;    
    @track isProgressing = false;
    @track isShowResponse=false;
    @track finalOutPutResponse={};
    @track stpRefID = '';
    @track status = '';
    @track reportedDate = '';  // This field is not in your JSON, so it will remain empty
    @track declarationDate = '';  // This field is also not in your JSON
    @track shortMessage;
    @track submissionType;
    STPloading = My_Resource+'/myResource/images/STPloading.gif';

    connectedCallback(){
        console.log('parent Id '+ this.parentPaysetId );       
    }

    @wire(getRecord, { recordId: Id, fields: [UserNameFld ]}) 
    userDetails({error, data}) {
        if (data) {
            this.currentUser = data.fields.Name.value;           
        } else if (error) {
            this.usererror = error ;
        }
    }
    
    ResetSignature(){
        this.datain={
            PayEventPayer:null ,
            Intermediary: null,
            PayEventPayees: [],
            SoftwareID: ""
          };
          this.signatureValue='';
    }   

    getFinalPayLoad(){ 
        console.log('Parent PaysetId : '+this.parentPaysetId);       
        accpetedStaffPayroll({ payrollId: this.parentPaysetId }).then(response => {   
            let PayerTotalPAYGWAmount=0;
            let PayerTotalGrossPaymentsAmount=0;  
            console.log('response  '+JSON.stringify(response));
            if (!this.datain) {
                this.datain = {
                    PayEventPayer: null,
                    Intermediary: null,
                    PayEventPayees: [],
                    SoftwareID: ""
                };
            }    
            response.forEach(record => {  
                let tempRec = Object.assign({}, record);             
               
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
                              SuperEntitlementAmount: tempRec.Super_And_Voluntary_Supper_Annuation__c
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
           
            this.softWareID=response[0].Staff__r.Facility__r.Organisation__r.SoftwareId__c;
            this.agentNumber=response[0].Staff__r.Facility__r.Organisation__r.Agent_Number__c;
            this.datain.SoftwareID=response[0].Staff__r.Facility__r.Organisation__r.SoftwareId__c;
            this.datain=JSON.stringify( this.datain, null, 2);
            console.log('Data pull request >> '+this.datain);
        
        })
    }
    
    /* showActivity(){
        this.displayActivity=false;
        this.showActivitytable=true;
        this.activityData=[];
        console.log('payset Id in activity '+this.parentPaysetId )

        getSTPActivityLog({ paySetID: this.parentPaysetId })
        .then(result => {
            this.activityData = result.map(item => ({
                Id: item.Id,
                Type_of_Submission__c: item.Type_of_Submission__c,
                STP_Response__c: item.STP_Response__c,
                stpoverallresponse: JSON.parse(item.STP_Response__c).IsSuccess === true ? 'Success' : 'Failed',
                STP_Ref_ID__c: item.STP_Ref_ID__c,
                STP_Date__c: this.formatDate(item.STP_Date__c),
                Payer_Declaration_Date__c: this.formatDate(item.Payer_Declaration_Date__c),
                Payroll_Setting__c : item.Payroll_Setting__c,
            }));            
            console.log('Activity Data : ' + JSON.stringify(this.activityData));
        })
        .catch(error => {
            console.error('Error fetching activity log: ', error);
        });       
    }  */
    /* 
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } */

    showActivity() {
        this.displayActivity = false;
        this.showActivitytable = true;
        this.activityData = [];
        console.log('payset Id in activity ' + this.parentPaysetId);

        getSTPActivityLog({ paySetID: this.parentPaysetId })
            .then(result => {
                this.activityData = result.map(item => {
                    let stpOverallResponse = '';
                    let responseType = 'Unknown';
                    let isSuperannuation = false;
                    
                    // Check Type of Submission
                    if (item.Type_of_Submission__c === 'Superannuation') {
                        // For Superannuation, use the full response directly
                        stpOverallResponse = item.STP_Response__c || 'No response available';
                        responseType = 'Plain Text';
                        isSuperannuation = true;  // <-- Set flag to true
                    } else {
                        // For File STP, Pull Request, etc., try to parse as JSON
                        try {
                            const parsedResponse = JSON.parse(item.STP_Response__c);
                            if (parsedResponse.IsSuccess === true) {
                                stpOverallResponse = '✅ Success';
                            } else if (parsedResponse.IsSuccess === false) {
                                stpOverallResponse = '❌ Failed';
                            } else {
                                stpOverallResponse = '⚠️ Unknown Status';
                            }
                            responseType = 'JSON';
                        } catch (e) {
                            // If JSON parsing fails, fallback to showing the raw response
                            console.warn('Failed to parse JSON for item: ', item.Id, e);
                            stpOverallResponse = item.STP_Response__c || 'Invalid response format';
                            responseType = 'Plain Text (Fallback)';
                        }
                        isSuperannuation = false;  // <-- Set flag to false
                    }
                    
                    return {
                        Id: item.Id,
                        Type_of_Submission__c: item.Type_of_Submission__c,
                        STP_Response__c: item.STP_Response__c,
                        stpoverallresponse: stpOverallResponse,
                        responseType: responseType,
                        isSuperannuation: isSuperannuation,  // <-- Add this property
                        STP_Ref_ID__c: item.STP_Ref_ID__c || 'N/A',
                        STP_Date__c: this.formatDate(item.STP_Date__c),
                        Payer_Declaration_Date__c: this.formatDate(item.Payer_Declaration_Date__c),
                        Payroll_Setting__c: item.Payroll_Setting__c,
                    };
                });
                console.log('Activity Data : ' + JSON.stringify(this.activityData));
            })
            .catch(error => {
                console.error('Error fetching activity log: ', error);
            });
    }

    closeActivity(){
        this.displayActivity=true;
        this.activityData=[];
        this.showActivitytable=false;
    }   

    handleAction(event) {
        const actionName = event.target.dataset.action;
        const rowId = event.target.dataset.id;
        console.log('RoWID :'+ rowId);
        console.log('activityData1 :'+ JSON.stringify(this.activityData));
        const row = this.activityData.find(item => item.Id === rowId);
        console.log('Row Id :' + JSON.stringify(row));
    
        switch (actionName) {
            case 'Show_JSON_Data':
                this.isShowResponse = false;
                this.parentPaysetId = row.Payroll_Setting__c;
                this.getFinalPayLoad();
                this.showJsondata = true;
                break;
    
            case 'Get_Pull_Request':
                if (row.Type_of_Submission__c === 'Pull Request') {
                    const event = new ShowToastEvent({
                        title: '',
                        message: 'Type of submission must be File STP',
                        variant: 'Error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(event);
                } else {
                    this.getFinalPayLoad();
                    setTimeout(() => {
                        this.isProgressing = true;
                        this.showProgressbar = true;
                        this.agentData = {
                            "SoftwareID": this.softWareID,
                            "RefMessageID": row.STP_Ref_ID__c,
                            "RegisteredAgentNumber": this.agentNumber
                        };
                        console.log('Agent Data: ' + JSON.stringify(this.agentData));
    
                        getPullRequest({ payLoad: JSON.stringify(this.datain), agentData: JSON.stringify(this.agentData) })
                            .then(response => {
                                setTimeout(() => {
                                    const parsedResponse = JSON.parse(response);
                                    let overallStatus = parsedResponse.IsSuccess;
                                    console.log('STP Response: ' + JSON.stringify(parsedResponse));
                                    console.log('Overall status: ' + overallStatus);
    
                                    if (!overallStatus) {
                                        const event = new ShowToastEvent({
                                            title: '',
                                            message: 'STP filing Failed. Please Contact System Admin',
                                            variant: 'Error',
                                            mode: 'dismissable'
                                        });
                                        this.dispatchEvent(event);
                                        this.isProgressing=false;
                                        this.showProgressbar=false;

                                        saveSTPResponse({
                                            paySettingId: this.parentPaysetId,
                                            typeOfsubmission: 'Pull Request',
                                            output: response,
                                            refID: null
                                        });
                                        setTimeout(() => {
                                            this.showActivity();
                                        }, 2000);
                                    } else {
                                        this.showToastMessage('Success', 'STP pull request successful');
                                        this.isProgressing = false;
                                        this.showProgressbar = false;
                                        saveSTPResponse({
                                            paySettingId: this.parentPaysetId,
                                            typeOfsubmission: 'Pull Request',
                                            output: response,
                                            refID: null
                                        });
                                        this.activityData = [];
                                        setTimeout(() => {
                                            this.showActivity();
                                        }, 2000);
                                    }
                                }, 5000);
                            })
                            .catch(error => {
                                console.error('Error in pull request: ' + JSON.stringify(error));
                                this.showToastMessage('Error', 'STP filing Failed. Please Contact System Admin');
                                this.isProgressing = false;
                                this.showProgressbar = false;
                            });
                    }, 2000);
                }
                break;
    
            case 'Show_Pull_Request_Response':
                this.showJsondata = true;
                this.isShowResponse = true;
                const parsedResponse = JSON.parse(row.STP_Response__c);
                console.log('Parsed Response: ' + JSON.stringify(parsedResponse, null, 2));
                this.finalOutPutResponse = JSON.stringify(parsedResponse, null, 2);
    
                // Assign values based on parsed response
                this.stpRefID = parsedResponse.Result && parsedResponse.Result.RefMessageID
                    ? parsedResponse.Result.RefMessageID
                    : 'No Data';
                this.shortMessage = parsedResponse.MessageEvents && parsedResponse.MessageEvents.length > 0
                    ? parsedResponse.MessageEvents[0].ShortMessage
                    : 'No message available';
    
                // Update status logic
                if (parsedResponse.OverallResult && parsedResponse.OverallResult === 'Success') {
                    this.status = 'Success';
                } else if (parsedResponse.IsSuccess === false) {
                    this.status = 'Failure';
                } else {
                    this.status = 'Unknown';
                }
    
                // Update submissionType based on the EventType
                this.submissionType = parsedResponse.MessageEvents && parsedResponse.MessageEvents.length > 0
                    ? parsedResponse.MessageEvents[0].EventType
                    : 'No message available';
    
                // Submission Dates
                this.reportedDate = row.STP_Date__c;
                this.declarationDate = row.Payer_Declaration_Date__c;
                break;
            
            case 'Show_More_Details':
                // Close child component views
                this.showJsondata = false;
                this.showActivitytable = false;
                this.displayActivity = true;
                
                // Determine status from response
                const responseText = row.STP_Response__c || 'No response available';
                let status = 'Info';
                const lowerResponse = responseText.toLowerCase();
                
                if (lowerResponse.includes('successfully') || 
                    lowerResponse.includes('processed') || 
                    lowerResponse.includes('all employees') ||
                    lowerResponse.includes('success')) {
                    status = '✅ Success';
                } else if (lowerResponse.includes('failed') || 
                        lowerResponse.includes('error') || 
                        lowerResponse.includes('invalid') ||
                        lowerResponse.includes('missing')) {
                    status = '❌ Failed';
                } else if (lowerResponse.includes('processing') || 
                        lowerResponse.includes('in progress')) {
                    status = '⏳ In Progress';
                }
                
                // Create an event to notify parent
                const closeEvent = new CustomEvent('closeparentandopennew', {
                    detail: {
                        type: row.Type_of_Submission__c || 'Superannuation',
                        refId: row.STP_Ref_ID__c || 'N/A',
                        status: status,
                        date: row.STP_Date__c || 'N/A',
                        declarationDate: row.Payer_Declaration_Date__c || 'N/A',
                        response: responseText,
                        parentPaysetId: this.parentPaysetId
                    },
                    bubbles: true,
                    composed: true
                });
                this.dispatchEvent(closeEvent);
                break;
        }
    } 

    closeJSonData(){
        this.datain={
            PayEventPayer:null ,
            Intermediary: null,
            PayEventPayees: [],
            SoftwareID: ""
            }
        this.showJsondata = false;
        this.finalOutPutResponse={};
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
}