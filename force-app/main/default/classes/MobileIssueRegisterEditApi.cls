/*Test Class:issueRegisterSearchTest*/
@RestResource(urlMapping='/issueRegisterEditApi/*')
global class MobileIssueRegisterEditApi {
     @HttpGet
    global static MobileIssueregisterRest.CaseRecordWrapper getIssueByid(){
        RestRequest req = RestContext.request;
        string issueId = (req.params.get('recordID'));
       	case  issueRecord=[SELECT Id,First_Name__c,Last_Name__c,Client__c,Facility__c,Organization__c,Role__c,Email__c,Participant_Representative__c,Sub_Contractor__c,Participant_Name__c,Facility_Name_1__c,Assign_to__c,Assign_to_1__c,
                          Phone_Number__c,Type_of_Issue__c,Status_1__c,Priority,Allegation__c,Allegation_description__c,Revelant_Issue_Type__c,Date_of_Incident__c,Incident_Time__c,Alleged_Date__c,Alleged_Time__c,Description,
                          Reported_to_the_Police__c,Police_Comments__c,Regarding_the_Issue__c,Description1__c,Description2__c,Description3__c,Most_Relevant_Others__c,Amazon_URL__c,CaseNumber from case where id=:issueId];
        
        MobileIssueregisterRest.CaseRecordWrapper caseRec= new MobileIssueregisterRest.CaseRecordWrapper();
        
          	caseRec.ReporterfirstName=issueRecord.First_Name__c;
            caseRec.ReporterlastName=issueRecord.Last_Name__c;
            caseRec.ReporterParticipantId=issueRecord.Client__c;
            caseRec.ReporterfacilityId=issueRecord.Facility__c;
            caseRec.ReporterRole=issueRecord.Role__c;
            caseRec.ReporterEmail=issueRecord.Email__c;
            caseRec.ReporterPhone=issueRecord.Phone_Number__c;
            caseRec.ReporterStatus=issueRecord.Status_1__c;
            caseRec.ReporterAssignTo=issueRecord.Assign_to_1__c;
        
            caseRec.IncidentPriorityValue=issueRecord.Priority;
            caseRec.IncidentInvolvedByValue=issueRecord.Allegation__c;
        	caseRec.IncidentParticipantId=issueRecord.Participant_Name__c;
        	caseRec.IncidentSelectedFacilityId=issueRecord.Facility_Name_1__c;
            caseRec.IncidentSelectedStaffId=issueRecord.Assign_to__c;
            caseRec.IncidentSubContractorValue=issueRecord.Sub_Contractor__c;
        	caseRec.IncidentRepresentativeValue=issueRecord.Participant_Representative__c;
        	caseRec.IncidentOthers=issueRecord.Allegation_description__c;
            caseRec.IncidentRelaventTypeValue=issueRecord.Revelant_Issue_Type__c;
        	caseRec.IncidentmostReleventothers=issueRecord.Most_Relevant_Others__c;
            caseRec.incidentDate=issueRecord.Date_of_Incident__c;
            caseRec.incidentTime=issueRecord.Incident_Time__c;
            caseRec.allegedDate=issueRecord.Alleged_Date__c;
            caseRec.allegedTime=issueRecord.Alleged_Time__c;
            caseRec.IncidentDescription=issueRecord.Description;
          
            caseRec.ActionReportToPolice=(issueRecord.Reported_to_the_Police__c!=null || !String.isBlank(issueRecord.Reported_to_the_Police__c)) ? issueRecord.Reported_to_the_Police__c : 'No' ;
            caseRec.ActionPoliceComments=issueRecord.Police_Comments__c;
        	caseRec.ActionRegardingtheIssue=issueRecord.Regarding_the_Issue__c;
        	caseRec.ActionDescription1=issueRecord.Description1__c;
            caseRec.ActionDescription2=issueRecord.Description2__c;
            caseRec.ActionDescription3=issueRecord.Description3__c;
         	caseRec.amazonUrl=issueRecord.Amazon_URL__c;
        
         return caseRec;
        
        
    }

}