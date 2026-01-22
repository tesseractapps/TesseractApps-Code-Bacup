public class GovReportsAPICallout {
    
     @AuraEnabled
    public static string GetAccessToken(){
        string accessToken;
        Http httpCls = new Http();
        HttpRequest request = new HttpRequest();
        string tokenUrl=System.Label.GovReportsTokenEndPoint;
        request.setEndpoint(tokenUrl);
        request.setMethod('POST');   
        string ApplicationKey=System.Label.GovReportsApplicationKey;
        string ConsumerKey=System.Label.GovReportsConsumerKey;
        string ConsumerSecret=System.Label.GovReportsConsumerSecret;
       	string body='<LoginRequest><ApplicationKey>'+ApplicationKey+'</ApplicationKey><ConsumerKey>'+ConsumerKey+'</ConsumerKey><ConsumerSecret>'+ConsumerSecret+'</ConsumerSecret></LoginRequest>';
        request.setHeader('Content-Type','application/xml');        
        request.setBody(body);  
        httpResponse response = httpCls.send(request); 
        if(response.getStatusCode() == 200){
            map<string,Object> resultMap = (map<string,Object>)JSON.deserializeUntyped(response.getBody());
            accessToken = (String)resultMap.get('Result');    
            system.debug('acctok>>'+accessToken);
            return accessToken;
        }
        else{
            system.debug('## Could not retrieve the access token' ); 
            system.debug('## response status :' + response.getStatus()); 
            system.debug('## response message :' + response.getBody());      
            return(response.getBody());
        }
    }
     @AuraEnabled
    public static string GetSignatureValue(string datainp){
        // string datain='{"PayEventPayer": {"BMSIdentifier": "125b8925-9a97-4178-8dee-78d3fdeb0437", "PayerABN": "67094544519", "PayerWPN": null, "PayerBranchCode": "2", "PreviousBMSIdentifier": null, "PayerOrganisationName": "YALACT P/L", "PayerContactName": "Mary-Anne Ackland", "PayerEmailAddress": "Maryaa@gmail.com", "PayerBusinessHoursPhoneNumber": "02 99720000", "PayerPostcode": "3000", "PayerCountryCode": "au", "Payroll": { "PayOrUpdateDate": "2023-06-30T00:00:00", "FullFileReplacementIndicator": false }, "PayerPeriodTotals": { "PayerTotalPAYGWAmount": 15000.5, "PayerTotalGrossPaymentsAmount": 150750.0, "ChildSupportTotalGarnisheeAmount": null, "ChildSupportTotalDeductionsAmount": null }, "PayerDeclaration": { "PayerDeclarerIdentifier": "MAAckland", "PayerDeclarationDate": "2023-10-19T14:59:53.2660835+05:30", "PayerDeclarationAcceptanceIndicator": true } }, "Intermediary": null, "PayEventPayees": [ { "PayeeTFN": "151994243", "ContractorABN": null, "PayeePayrollID": "50236", "PreviousPayrollID": null, "PayeeNameDetails": { "PayeeFamilyName": "Martin", "PayeeFirstName": "Mark", "PayeeOtherName": null }, "PayeeDateOfBirth": "1990-10-02T00:00:00", "PayeeAddressDetails": { "Line1": "34 wanderer street", "Line2": null, "Line3": null, "LocalityName": "Mt Helen", "Postcode": "3350", "StateOrTerritoryCode": "VIC", "CountryCode": "au" }, "PayeeEmailAddress": "heaven@gmail.com", "PayeePhoneNumber": null, "EmploymentConditions": { "PayeeCommencementDate": "2018-07-11T00:00:00", "PayeeCessationDate": "2023-06-12T00:00:00", "EmploymentBasisCode": "C", "CessationTypeCode": "C", "TaxTreatmentCode": "RDXXXX", "TaxOffsetAmount": null }, "PayrollRun": { "PeriodStartDate": "2023-06-01T00:00:00", "PeriodEndDate": "2023-06-30T00:00:00", "FinalEventIndicator": false, "IncomeStreams": [ { "IncomeStreamTypeCode": "SAW", "CountryCode": null, "PAYGWAmount": 3000.0, "ForeignTaxPaidAmount": null, "ExemptForeignIncomeAmount": null, "GrossAmount": 15000.0, "PaidLeaves": null, "Allowances": null, "OvertimeAmount": null, "BonusesAndCommissionsAmount": null, "DirectorsFeesAmount": null, "SalarySacrifices": null, "LumpSumPayments": null, "TerminationPayments": [ { "ETPCode": "R", "PayeeETPPaymentDate": "2023-06-18T00:00:00", "PayeeTerminationPaymentTaxFreeComponent": 10000.0, "PayeeTerminationPaymentTaxableComponent": 10000.0, "PayeeTotalETPPAYGWAmount": 3000.0 } ] } ], "Deductions": null, "SuperEntitlements": [ { "SuperEntitlementTypeCode": "L", "SuperEntitlementAmount": 2257.45 } ], "ReportableFringeBenefits": null } }, { "PayeeTFN": "151994716", "ContractorABN": null, "PayeePayrollID": "50237", "PreviousPayrollID": null, "PayeeNameDetails": { "PayeeFamilyName": "Lyons", "PayeeFirstName": "Lamar", "PayeeOtherName": null }, "PayeeDateOfBirth": "1989-09-02T00:00:00", "PayeeAddressDetails": { "Line1": "19 May St", "Line2": null, "Line3": null, "LocalityName": "Melbourne", "Postcode": "3021", "StateOrTerritoryCode": "VIC", "CountryCode": "au" }, "PayeeEmailAddress": "LittleL@hotmail.com", "PayeePhoneNumber": null, "EmploymentConditions": { "PayeeCommencementDate": "2018-02-15T00:00:00", "PayeeCessationDate": null, "EmploymentBasisCode": "F", "CessationTypeCode": null, "TaxTreatmentCode": "RTX2X1", "TaxOffsetAmount": null }, "PayrollRun": { "PeriodStartDate": "2023-06-01T00:00:00", "PeriodEndDate": "2023-06-30T00:00:00", "FinalEventIndicator": false, "IncomeStreams": [ { "IncomeStreamTypeCode": "SAW", "CountryCode": null, "PAYGWAmount": 3000.0, "ForeignTaxPaidAmount": null, "ExemptForeignIncomeAmount": null, "GrossAmount": 15000.0, "PaidLeaves": null, "Allowances": null, "OvertimeAmount": null, "BonusesAndCommissionsAmount": null, "DirectorsFeesAmount": null, "SalarySacrifices": null, "LumpSumPayments": null, "TerminationPayments": null } ], "Deductions": null, "SuperEntitlements": [ { "SuperEntitlementTypeCode": "O", "SuperEntitlementAmount": 467.45 } ], "ReportableFringeBenefits": null } }, { "PayeeTFN": null, "ContractorABN": "61000031569", "PayeePayrollID": "50238", "PreviousPayrollID": null, "PayeeNameDetails": { "PayeeFamilyName": "Trevor", "PayeeFirstName": "Jef", "PayeeOtherName": "Martin" }, "PayeeDateOfBirth": "1986-10-02T00:00:00", "PayeeAddressDetails": { "Line1": "Unit 6", "Line2": "34 wanderer street", "Line3": null, "LocalityName": "Mt Helen", "Postcode": "3350", "StateOrTerritoryCode": "VIC", "CountryCode": "au" }, "PayeeEmailAddress": "heaven@gmail.com", "PayeePhoneNumber": null, "EmploymentConditions": { "PayeeCommencementDate": "2018-02-20T00:00:00", "PayeeCessationDate": "2023-06-20T00:00:00", "EmploymentBasisCode": "L", "CessationTypeCode": "V", "TaxTreatmentCode": "RDXXXX", "TaxOffsetAmount": null }, "PayrollRun": { "PeriodStartDate": "2023-06-01T00:00:00", "PeriodEndDate": "2023-06-30T00:00:00", "FinalEventIndicator": false, "IncomeStreams": [ { "IncomeStreamTypeCode": "VOL", "CountryCode": null, "PAYGWAmount": 3000.0, "ForeignTaxPaidAmount": null, "ExemptForeignIncomeAmount": null, "GrossAmount": 15000.0, "PaidLeaves": null, "Allowances": null, "OvertimeAmount": null, "BonusesAndCommissionsAmount": null, "DirectorsFeesAmount": null, "SalarySacrifices": null, "LumpSumPayments": null, "TerminationPayments": null } ], "Deductions": null, "SuperEntitlements": [ { "SuperEntitlementTypeCode": "O", "SuperEntitlementAmount": 756.0 } ], "ReportableFringeBenefits": null } } ], "SoftwareID": "1487226280" }';
        
        string datain=datainp;
        Blob data = Blob.valueOf(datain);
        string cert=System.Label.GovReportsCert;
        blob output= System.Crypto.signWithCertificate('RSA-SHA256', data, cert);
        string s = EncodingUtil.base64Encode(output);
        system.debug('signvalue>>'+s);
        return s;
        
    }
     @AuraEnabled
    public static string submitPayload(string data, boolean isUpdate){
      //error  data='{"PayEventPayer":{"BMSIdentifier":"125b8925-9a97-4178-8dee-78d3fdeb0437","PayerABN":"15603031803","PayerWPN":null,"PayerBranchCode":"","PreviousBMSIdentifier":null,"PayerOrganisationName":"Pinnacle IT Service Pty LTD","PayerEmailAddress":"info@pinnacleitservices.com","PayerBusinessHoursPhoneNumber":"sakuhasdkh","PayerPostcode":"2060","PayerCountryCode":"au","Payroll":{"PayOrUpdateDate":"2024-01-27","FullFileReplacementIndicator":false},"PayerPeriodTotals":{"PayerTotalPAYGWAmount":null,"PayerTotalGrossPaymentsAmount":21170,"ChildSupportTotalGarnisheeAmount":0,"ChildSupportTotalDeductionsAmount":0},"PayerDeclaration":{"PayerDeclarerIdentifier":"Nagendra","PayerDeclarationDate":"2024-01-23T08:25:25.143Z","PayerDeclarationAcceptanceIndicator":true}},"Intermediary":null,"PayEventPayees":[{"PayeePayrollID":"a031s00000HEtq1AAD","PreviousPayrollID":null,"PayeeNameDetails":{"PayeeFamilyName":"Three","PayeeFirstName":"Hello","PayeeOtherName":null},"PayeeDateOfBirth":"2015-12-09","PayeeAddressDetails":{"Line1":"8 Keewong Street","Line2":null,"Line3":null,"LocalityName":"Ormeau","Postcode":"4208","StateOrTerritoryCode":"QLD","CountryCode":"au"},"PayeeEmailAddress":"staffthree.loginthree@gmail.com","PayeePhoneNumber":"4567890995","EmploymentConditions":{"TaxTreatmentCode":"RDXXXX","TaxOffsetAmount":null},"PayrollRun":{"PeriodStartDate":"2024-02-20","PeriodEndDate":"2024-02-26","FinalEventIndicator":false,"IncomeStreams":[{"IncomeStreamTypeCode":null,"CountryCode":null,"ForeignTaxPaidAmount":null,"ExemptForeignIncomeAmount":null,"GrossAmount":10500,"PaidLeaves":null,"Allowances":null,"OvertimeAmount":null,"BonusesAndCommissionsAmount":null,"DirectorsFeesAmount":null,"SalarySacrifices":null,"LumpSumPayments":null,"TerminationPayments":[{"ETPCode":"R","PayeeTerminationPaymentTaxFreeComponent":null,"PayeeTerminationPaymentTaxableComponent":null,"PayeeTotalETPPAYGWAmount":null}]}],"Deductions":null,"SuperEntitlements":[{"SuperEntitlementTypeCode":"L","SuperEntitlementAmount":0}],"ReportableFringeBenefits":null}},{"PayeePayrollID":"a031s00000HEtqGAAT","PreviousPayrollID":null,"PayeeNameDetails":{"PayeeFamilyName":"Six","PayeeFirstName":"Staff","PayeeOtherName":null},"PayeeDateOfBirth":"2007-12-05","PayeeAddressDetails":{"Line1":"8 Keewong Street","Line2":null,"Line3":null,"LocalityName":"Ormeau","Postcode":"4208","StateOrTerritoryCode":"QLD","CountryCode":"au"},"PayeeEmailAddress":"staffsix.loginsix@hotmail.com","PayeePhoneNumber":"4567890984","EmploymentConditions":{"TaxTreatmentCode":"RDXXXX","TaxOffsetAmount":null},"PayrollRun":{"PeriodStartDate":"2024-02-20","PeriodEndDate":"2024-02-26","FinalEventIndicator":false,"IncomeStreams":[{"IncomeStreamTypeCode":null,"CountryCode":null,"ForeignTaxPaidAmount":null,"ExemptForeignIncomeAmount":null,"GrossAmount":4160,"PaidLeaves":null,"Allowances":null,"OvertimeAmount":null,"BonusesAndCommissionsAmount":null,"DirectorsFeesAmount":null,"SalarySacrifices":null,"LumpSumPayments":null,"TerminationPayments":[{"ETPCode":"R","PayeeTerminationPaymentTaxFreeComponent":null,"PayeeTerminationPaymentTaxableComponent":null,"PayeeTotalETPPAYGWAmount":null}]}],"Deductions":null,"SuperEntitlements":[{"SuperEntitlementTypeCode":"L","SuperEntitlementAmount":0}],"ReportableFringeBenefits":null}},{"PayeePayrollID":"a031s00000HEtpcAAD","PreviousPayrollID":null,"PayeeNameDetails":{"PayeeFamilyName":"Two","PayeeFirstName":"Staff","PayeeOtherName":null},"PayeeDateOfBirth":"2007-12-05","PayeeAddressDetails":{"Line1":"8 Keewong Street","Line2":null,"Line3":null,"LocalityName":"Ormeau","Postcode":"4208","StateOrTerritoryCode":"QLD","CountryCode":"au"},"PayeeEmailAddress":"stafftwo.logintwo@gmail.com","PayeePhoneNumber":"4567890998","EmploymentConditions":{"TaxTreatmentCode":"RDXXXX","TaxOffsetAmount":null},"PayrollRun":{"PeriodStartDate":"2024-02-20","PeriodEndDate":"2024-02-26","FinalEventIndicator":false,"IncomeStreams":[{"IncomeStreamTypeCode":null,"CountryCode":null,"ForeignTaxPaidAmount":null,"ExemptForeignIncomeAmount":null,"GrossAmount":6510,"PaidLeaves":null,"Allowances":null,"OvertimeAmount":null,"BonusesAndCommissionsAmount":null,"DirectorsFeesAmount":null,"SalarySacrifices":null,"LumpSumPayments":null,"TerminationPayments":[{"ETPCode":"R","PayeeTerminationPaymentTaxFreeComponent":null,"PayeeTerminationPaymentTaxableComponent":null,"PayeeTotalETPPAYGWAmount":null}]}],"Deductions":null,"SuperEntitlements":[{"SuperEntitlementTypeCode":"L","SuperEntitlementAmount":0}],"ReportableFringeBenefits":null}},{"PayeePayrollID":"a031s00000HEtq1AAD","PreviousPayrollID":null,"PayeeNameDetails":{"PayeeFamilyName":"Three","PayeeFirstName":"Hello","PayeeOtherName":null},"PayeeDateOfBirth":"2015-12-09","PayeeAddressDetails":{"Line1":"8 Keewong Street","Line2":null,"Line3":null,"LocalityName":"Ormeau","Postcode":"4208","StateOrTerritoryCode":"QLD","CountryCode":"au"},"PayeeEmailAddress":"staffthree.loginthree@gmail.com","PayeePhoneNumber":"4567890995","EmploymentConditions":{"TaxTreatmentCode":"RDXXXX","TaxOffsetAmount":null},"PayrollRun":{"PeriodStartDate":"2024-02-20","PeriodEndDate":"2024-02-26","FinalEventIndicator":false,"IncomeStreams":[{"IncomeStreamTypeCode":null,"CountryCode":null,"ForeignTaxPaidAmount":null,"ExemptForeignIncomeAmount":null,"GrossAmount":10500,"PaidLeaves":null,"Allowances":null,"OvertimeAmount":null,"BonusesAndCommissionsAmount":null,"DirectorsFeesAmount":null,"SalarySacrifices":null,"LumpSumPayments":null,"TerminationPayments":[{"ETPCode":"R","PayeeTerminationPaymentTaxFreeComponent":null,"PayeeTerminationPaymentTaxableComponent":null,"PayeeTotalETPPAYGWAmount":null}]}],"Deductions":null,"SuperEntitlements":[{"SuperEntitlementTypeCode":"L","SuperEntitlementAmount":0}],"ReportableFringeBenefits":null}},{"PayeePayrollID":"a031s00000HEtqGAAT","PreviousPayrollID":null,"PayeeNameDetails":{"PayeeFamilyName":"Six","PayeeFirstName":"Staff","PayeeOtherName":null},"PayeeDateOfBirth":"2007-12-05","PayeeAddressDetails":{"Line1":"8 Keewong Street","Line2":null,"Line3":null,"LocalityName":"Ormeau","Postcode":"4208","StateOrTerritoryCode":"QLD","CountryCode":"au"},"PayeeEmailAddress":"staffsix.loginsix@hotmail.com","PayeePhoneNumber":"4567890984","EmploymentConditions":{"TaxTreatmentCode":"RDXXXX","TaxOffsetAmount":null},"PayrollRun":{"PeriodStartDate":"2024-02-20","PeriodEndDate":"2024-02-26","FinalEventIndicator":false,"IncomeStreams":[{"IncomeStreamTypeCode":null,"CountryCode":null,"ForeignTaxPaidAmount":null,"ExemptForeignIncomeAmount":null,"GrossAmount":4160,"PaidLeaves":null,"Allowances":null,"OvertimeAmount":null,"BonusesAndCommissionsAmount":null,"DirectorsFeesAmount":null,"SalarySacrifices":null,"LumpSumPayments":null,"TerminationPayments":[{"ETPCode":"R","PayeeTerminationPaymentTaxFreeComponent":null,"PayeeTerminationPaymentTaxableComponent":null,"PayeeTotalETPPAYGWAmount":null}]}],"Deductions":null,"SuperEntitlements":[{"SuperEntitlementTypeCode":"L","SuperEntitlementAmount":0}],"ReportableFringeBenefits":null}},{"PayeePayrollID":"a031s00000HEtpcAAD","PreviousPayrollID":null,"PayeeNameDetails":{"PayeeFamilyName":"Two","PayeeFirstName":"Staff","PayeeOtherName":null},"PayeeDateOfBirth":"2007-12-05","PayeeAddressDetails":{"Line1":"8 Keewong Street","Line2":null,"Line3":null,"LocalityName":"Ormeau","Postcode":"4208","StateOrTerritoryCode":"QLD","CountryCode":"au"},"PayeeEmailAddress":"stafftwo.logintwo@gmail.com","PayeePhoneNumber":"4567890998","EmploymentConditions":{"TaxTreatmentCode":"RDXXXX","TaxOffsetAmount":null},"PayrollRun":{"PeriodStartDate":"2024-02-20","PeriodEndDate":"2024-02-26","FinalEventIndicator":false,"IncomeStreams":[{"IncomeStreamTypeCode":null,"CountryCode":null,"ForeignTaxPaidAmount":null,"ExemptForeignIncomeAmount":null,"GrossAmount":6510,"PaidLeaves":null,"Allowances":null,"OvertimeAmount":null,"BonusesAndCommissionsAmount":null,"DirectorsFeesAmount":null,"SalarySacrifices":null,"LumpSumPayments":null,"TerminationPayments":[{"ETPCode":"R","PayeeTerminationPaymentTaxFreeComponent":null,"PayeeTerminationPaymentTaxableComponent":null,"PayeeTotalETPPAYGWAmount":null}]}],"Deductions":null,"SuperEntitlements":[{"SuperEntitlementTypeCode":"L","SuperEntitlementAmount":0}],"ReportableFringeBenefits":null}}],"SoftwareID":"0000521413"}';// string datain='testing'
        string signValue;
        string govReportsResponse;
        string endPointUrl=System.Label.GovReportsPayloadEndpoint;
        string updEndPoint=System.Label.GovReportsUpdateEndpoint;      
        Http httpCls = new Http();
        HttpRequest request = new HttpRequest();
        if(isUpdate){
             request.setEndpoint(updEndPoint);
        }else{
             request.setEndpoint(endPointUrl);
        }
       
        request.setMethod('POST');       
        string accessToken=GetAccessToken();
        if(Test.isRunningTest()){
           signValue='bQqcJXnKDmUSgYiOdWrAxCT/d9sm4MHjF6R/ARkHcFyiHFzNbndN29Ts7BqN5xW53apRII1PAJ7chFN84JAK5NwxexQtVB+eVBSTf7K+tanGeXLRDd8WJv2vGO32WEHLx9IUXaNqB0i63JjYEIo/N6nlYSJbVKo75+/5g8kgjtdmtkcAB6vKmvFVEta3g9rmvnlx5vtGgKID1UjBc2/Btp48uq5iQHLpXD4Ik/iCJ5owFGhGdbxe103aigsEjld1+8unny134Jct1tUgWAG9gZQ5WxID+oUDKz3W6UCDqHBzCBPxuKS6PRau1x9bnYUHvgq6drejjYV4cbaP8cLGhA==' ;
        } else{
             signValue=GetSignatureValue(data);
        }    
        request.setHeader('Content-Type','application/json');  
        request.setHeader('Authorization', 'Bearer '+accessToken);
        request.setHeader('SignatureValue', signValue);        
        request.setBody(data);   
        system.debug('Signature Value: ' + signValue);
        httpResponse response = httpCls.send(request); 
        system.debug('response body  '+ response.getBody());
        if(response.getStatusCode() == 200){                
            jsonOutput results = (jsonOutput) JSON.deserialize(response.getBody(), jsonOutput.class);    
            system.debug(results);
          /*  if(results.result.RefMessageID == null ){  			praveen commented this line to save response body;
                return 'STP Submission Failed.';
            }else{
                 govReportsResponse=results.result.RefMessageID;
             system.debug(govReportsResponse);
            return govReportsResponse;
            } */
           
           return  response.getBody();
        }
        else{
          throw new AuraHandledException(response.getBody()); 
        }
    }
     @AuraEnabled
    public static string getPullRequest(string payLoad,string agentData ){
        
        string signValue;
        string requestEndPointUrl=System.Label.GovReportsPullRequest;
        Http httpCls = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint(requestEndPointUrl);
        
        request.setMethod('POST');       
        string accessToken=GetAccessToken();
        if(Test.isRunningTest()){
           signValue='bQqcJXnKDmUSgYiOdWrAxCT/d9sm4MHjF6R/ARkHcFyiHFzNbndN29Ts7BqN5xW53apRII1PAJ7chFN84JAK5NwxexQtVB+eVBSTf7K+tanGeXLRDd8WJv2vGO32WEHLx9IUXaNqB0i63JjYEIo/N6nlYSJbVKo75+/5g8kgjtdmtkcAB6vKmvFVEta3g9rmvnlx5vtGgKID1UjBc2/Btp48uq5iQHLpXD4Ik/iCJ5owFGhGdbxe103aigsEjld1+8unny134Jct1tUgWAG9gZQ5WxID+oUDKz3W6UCDqHBzCBPxuKS6PRau1x9bnYUHvgq6drejjYV4cbaP8cLGhA==' ;
        } else{
             signValue=GetSignatureValue(agentData);
        }    
        request.setHeader('Content-Type','application/json');  
        request.setHeader('Authorization', 'Bearer '+accessToken);
        request.setHeader('SignatureValue', signValue);        
        request.setBody(agentData);   
        system.debug('Signature Value: ' + signValue);
        httpResponse response = httpCls.send(request); 
        system.debug('response body '+ response.getBody());
        if(response.getStatusCode() == 200){                
           return  response.getBody();
        }
        else{
          throw new AuraHandledException(response.getBody()); 
        }
        
    }
    
    public class cls_response {		
        public String result;	
        public String RefMessageID;	
        public string MessageEvents;
        
        
    }    
    public class JSONOutput{
        public cls_response result;
        
    }
    
    
}