/* Test calss:issueRegisterSearchTest*/

@RestResource(urlMapping='/IssueRegisterAPI/*')
global class MobileIssueregisterRest {
     @HttpGet
    global static list<case> getIssueList(){
        list<case> participantlsit = new list <case>();
        SObjectAccessDecision decision ;
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        // Retrieve parameters from the URL query string
        String listOfsearchString = '["","","","","",""]';
        String typeofIssue ='Own Org'; 
        
        // Call the searchIssues method with the parameters
        List<Case> cases = issueRegisterSearch.searchIssues(listOfsearchString, typeofIssue);
        decision = Security.stripInaccessible(AccessType.READABLE, cases);
       
        // Return the cases list
       //return cases;
        return (List<case>) decision.getRecords();
    }
    
    @HttpPost
    global static string saveCaseRecordViaApi() {
        String responseMessage = ''; // Default response
        RestRequest req = RestContext.request;
        string jsonString = req.requestBody.toString();
        system.debug('request body '+jsonString);
        CaseRecordWrapper caseData = (CaseRecordWrapper)JSON.deserialize(jsonString, CaseRecordWrapper.class);
         case caseRecord = new case() ;
        User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id;    
        
        // Check if recordId is provided (for update) or not (for create)
        try {
            
       
        if (String.isNotBlank(caseData.recordId)) {
            // If recordId is provided, update the existing case record
            caseRecord= issueRegisterSearch.updateCaseRecord(Id.valueof(caseData.recordId), orgID, caseData.ReporterfirstName, caseData.IncidentOthers, caseData.ReporterlastName,Id.valueof(caseData.ReporterParticipantId) ,Id.valueof(caseData.ReporterfacilityId), 
                                    caseData.ReporterRole, caseData.ReporterEmail, caseData.ReporterPhone, caseData.ReporterStatus, caseData.IncidentPriorityValue, caseData.IncidentInvolvedByValue, caseData.IncidentRelaventTypeValue, caseData.incidentDate, 
                                    caseData.incidentTime, caseData.allegedDate, caseData.allegedTime, caseData.IncidentDescription, caseData.ActionReportToPolice, caseData.ActionRegardingtheIssue, 
                                    caseData.ActionPoliceComments, caseData.ActionDescription1, caseData.ActionDescription2, caseData.ActionDescription3, caseData.IncidentRepresentativeValue, 
                                    caseData.IncidentSubContractorValue, caseData.IncidentParticipantId, caseData.IncidentSelectedFacilityId, caseData.IncidentSelectedStaffId, caseData.ReporterAssignTo,caseData.IncidentmostReleventothers);
            
        } else {
            // If no recordId is provided, create a new case
            caseRecord= issueRegisterSearch.saveCaseRecord(orgID, caseData.ReporterfirstName, caseData.IncidentOthers, caseData.ReporterlastName, caseData.ReporterParticipantId, caseData.ReporterfacilityId, caseData.ReporterRole, caseData.ReporterEmail, caseData.ReporterPhone, 
                                  caseData.ReporterStatus, caseData.IncidentPriorityValue, caseData.IncidentInvolvedByValue, caseData.IncidentRelaventTypeValue,caseData.incidentDate, caseData.incidentTime, 
                                  caseData.allegedDate, caseData.allegedTime, caseData.IncidentDescription, caseData.ActionReportToPolice, caseData.ActionRegardingtheIssue, caseData.ActionPoliceComments, 
                                  caseData.ActionDescription1, caseData.ActionDescription2, caseData.ActionDescription3, caseData.IncidentRepresentativeValue, caseData.IncidentSubContractorValue, 
                                  caseData.IncidentParticipantId, caseData.IncidentSelectedFacilityId, caseData.IncidentSelectedStaffId, caseData.ReporterAssignTo,caseData.IncidentmostReleventothers);
        		}
                if (caseRecord.id != null && caseData.fileName != null) {
                    try {
                         String fileName = caseData.fileName.trim().replaceAll('\\s+', '_');
                        system.debug('filename '+fileName);
                        AWSS3FileUploadController.uploadFile(caseData.base64, caseData.fileName,String.valueOf(caseRecord.id),'case');
                    } catch (Exception e) {
                        // Handle file upload failure
                        responseMessage = 'Error during file upload: ' + e.getMessage();
                        return responseMessage; // Return error message for file upload failure
            		}
        }

        // If everything went well, set the response message to success
        responseMessage = 'Success: issue record saved/updated successfully. issue ID: ' + caseRecord.id;
         } catch (Exception e) {
        // Handle any errors that might occur during the case creation/update process
        responseMessage = 'Error: ' + e.getMessage(); // Return the error message
    }
    
    return responseMessage; 
                                                 
    }
        global class CaseRecordWrapper {
        global String recordId;
        global String ReporterfirstName;
        global String IncidentOthers;
        global String ReporterlastName;
        global Id ReporterParticipantId;
        global Id ReporterfacilityId;
        global String ReporterRole;
        global String ReporterEmail;
        global String ReporterPhone;
        global String ReporterStatus;
        global String IncidentPriorityValue;
        global String IncidentInvolvedByValue;
        global String IncidentRelaventTypeValue;
        global Date incidentDate;
        global String incidentTime;
        global Date allegedDate;
        global String allegedTime;
        global String IncidentDescription;
        global String ActionReportToPolice;
        global String ActionRegardingtheIssue;
        global String ActionPoliceComments;
        global String ActionDescription1;
        global String ActionDescription2;
        global String ActionDescription3;
        global String IncidentRepresentativeValue;
        global String IncidentSubContractorValue;
        global String IncidentParticipantId;
        global String IncidentSelectedFacilityId;
        global String IncidentSelectedStaffId;
        global String ReporterAssignTo;
        global String IncidentmostReleventothers;
        global String fileName;
        global String base64;
        global string amazonUrl;
   
       
    }

}