public with sharing class IncidentSelector {

    public static List<Incident_Register_Response__c> selectResponsesByIds(Set<Id> ids) {
        return [
            SELECT Id, Name__c, Status__c, Client_Id__c, 
                   Incident_Assigned_Staff__c, Incident_Assigned_Staff__r.Name,
                   Severity__c, NDIS_Reportable__c, Next_Action__c, Next_Due__c,
                   Open_Actions__c, CreatedDate
            FROM Incident_Register_Response__c
            WHERE Id IN :ids
            WITH USER_MODE
        ];
    }

    public static List<Incident_Investigation__c> selectInvestigationsByIds(Set<Id> ids) {
        return [
            SELECT Id, Incident_Response__c, Status__c, Assigned_Investigator__c, 
                   Assigned_Investigator__r.Name, Severity__c, NDIS_Reportable__c, 
                   Assessment_Notes__c, Findings_Summary__c, Root_Cause__c, 
                   Final_Notes__c, NDIS_Overall_Status__c, NDIS_Current_Stage__c
            FROM Incident_Investigation__c
            WHERE Id IN :ids
            WITH USER_MODE
        ];
    }

    public static List<Incident_Investigation__c> selectInvestigationsByResponseIds(Set<Id> responseIds) {
        return [
            SELECT Id, Incident_Response__c, Status__c, Assigned_Investigator__c, 
                   Assigned_Investigator__r.Name, Severity__c, NDIS_Reportable__c, 
                   Assessment_Notes__c, Findings_Summary__c, Root_Cause__c, 
                   Final_Notes__c, NDIS_Overall_Status__c, NDIS_Current_Stage__c
            FROM Incident_Investigation__c
            WHERE Incident_Response__c IN :responseIds
            WITH USER_MODE
        ];
    }

    public static List<Incident_Corrective_Action__c> selectCorrectiveActionsByInvestigation(Id invId) {
        return [
            SELECT Id, Incident_Investigation__c, Action_Title__c, Assigned_Owner__c, 
                   Assigned_Owner__r.Name, Due_Date__c, Status__c, Completion_Date__c, 
                   Notes__c, AWS_Evidence_Key__c, LastModifiedDate
            FROM Incident_Corrective_Action__c
            WHERE Incident_Investigation__c = :invId
            WITH USER_MODE
            ORDER BY Due_Date__c ASC
        ];
    }

    public static List<Incident_Corrective_Action__c> selectAllCorrectiveActions() {
        return [
            SELECT Id, Incident_Investigation__c, Incident_Investigation__r.Incident_Response__c,
                   Incident_Investigation__r.Incident_Response__r.Name,
                   Action_Title__c, Assigned_Owner__c, Assigned_Owner__r.Name, 
                   Due_Date__c, Status__c, Completion_Date__c, Notes__c, 
                   AWS_Evidence_Key__c, LastModifiedDate
            FROM Incident_Corrective_Action__c
            WITH USER_MODE
            ORDER BY Due_Date__c ASC
        ];
    }

    public static List<Incident_NDIS_Submission__c> selectNdisSubmissionsByInvestigation(Id invId) {
        return [
            SELECT Id, Incident_Investigation__c, Submission_Type__c, Submitted_By__c, 
                   Submitted_By__r.Name, Submission_Date__c, Submission_Time__c, 
                   Reference_Number__c, Summary_Notes__c
            FROM Incident_NDIS_Submission__c
            WHERE Incident_Investigation__c = :invId
            WITH USER_MODE
            ORDER BY Submission_Date__c DESC, Submission_Time__c DESC
        ];
    }
}