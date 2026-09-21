@isTest
public class IncidentSelectorTest {
    
    @TestSetup
    static void setupTestData() {
        // Call the existing factory
        RosterCopyPasteHandlerTestData.createTestData();
        
        // =============================================
        // CREATE ADDITIONAL DATA NEEDED FOR INCIDENT SELECTOR
        // =============================================
        
        User testUser = [SELECT Id, Email, User_Type__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Staff__c staff = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c WHERE First_Name__c = 'Test' AND Last_Name__c = 'Participant2948' LIMIT 1];
        
        // Update staff Organization_Full_Name__c
        //staff.Organization_Full_Name__c = 'Ashfield Consultants';
        update staff;
        
        // Create Incident_Form__c
        Incident_Form__c form = new Incident_Form__c();
        form.Name__c = 'Test Incident Form';
        form.Form_JSON__c = '{}';
        form.Form_Type__c = 'Incident Register';
        form.Org_Id__c = org.Id;
        form.Status__c = 'Published';
        insert form;
        
        // Create Incident_Register_Response__c
        Incident_Register_Response__c response = new Incident_Register_Response__c();
        response.Incident_Form__c = form.Id;
        response.Response_JSON__c = '{}';
        response.Org_Id__c = org.Id;
        response.Client_Id__c = client.Id;
        response.Name__c = 'Test Incident Response';
        response.Form_Type__c = 'Incident Register';
        response.Status__c = 'Open';
        response.Severity__c = 'High';
        response.Incident_Assigned_Staff__c = staff.Id;
        response.Facility__c = fac.Id;
        insert response;
        
        // Create Incident_Investigation__c
        Incident_Investigation__c investigation = new Incident_Investigation__c();
        investigation.Incident_Response__c = response.Id;
        investigation.Status__c = 'In Progress';
        investigation.Severity__c = 'High';
        investigation.NDIS_Reportable__c = 'Yes';
        investigation.Assigned_Investigator__c = staff.Id;
        insert investigation;
        
        // Create Incident_Corrective_Action__c
        Incident_Corrective_Action__c correctiveAction = new Incident_Corrective_Action__c();
        correctiveAction.Incident_Investigation__c = investigation.Id;
        correctiveAction.Action_Title__c = 'Test Corrective Action';
        correctiveAction.Assigned_Owner__c = staff.Id;
        correctiveAction.Due_Date__c = Date.today().addDays(7);
        correctiveAction.Status__c = 'Open';
        insert correctiveAction;
        
        // Create Incident_NDIS_Submission__c
        Incident_NDIS_Submission__c ndisSubmission = new Incident_NDIS_Submission__c();
        ndisSubmission.Incident_Investigation__c = investigation.Id;
        ndisSubmission.Submission_Type__c = 'Initial Notification';
        ndisSubmission.Submitted_By__c = staff.Id;
        ndisSubmission.Submission_Date__c = Date.today();
        ndisSubmission.Reference_Number__c = 'NDIS-001';
        insert ndisSubmission;
    }
    
    // =============================================
    // HELPER METHODS
    // =============================================
    static User getTestUser() {
        return [SELECT Id, Email, User_Type__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    static Incident_Register_Response__c getTestResponse() {
        return [SELECT Id FROM Incident_Register_Response__c LIMIT 1];
    }
    
    static Incident_Investigation__c getTestInvestigation() {
        return [SELECT Id, Incident_Response__c FROM Incident_Investigation__c LIMIT 1];
    }
    
    static Incident_Corrective_Action__c getTestCorrectiveAction() {
        return [SELECT Id, Incident_Investigation__c FROM Incident_Corrective_Action__c LIMIT 1];
    }
    
    static Incident_NDIS_Submission__c getTestNdisSubmission() {
        return [SELECT Id, Incident_Investigation__c FROM Incident_NDIS_Submission__c LIMIT 1];
    }
    
    // =============================================
    // TEST 1: selectResponsesByIds
    // =============================================
    @isTest
    static void testSelectResponsesByIds() {
        User u = getTestUser();
        Incident_Register_Response__c response = getTestResponse();
        
        Set<Id> ids = new Set<Id>{response.Id};
        
        Test.startTest();
        System.runAs(u) {
            List<Incident_Register_Response__c> result = IncidentSelector.selectResponsesByIds(ids);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 2: selectInvestigationsByIds
    // =============================================
    @isTest
    static void testSelectInvestigationsByIds() {
        User u = getTestUser();
        Incident_Investigation__c investigation = getTestInvestigation();
        
        Set<Id> ids = new Set<Id>{investigation.Id};
        
        Test.startTest();
        System.runAs(u) {
            List<Incident_Investigation__c> result = IncidentSelector.selectInvestigationsByIds(ids);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 3: selectInvestigationsByResponseIds
    // =============================================
    @isTest
    static void testSelectInvestigationsByResponseIds() {
        User u = getTestUser();
        Incident_Investigation__c investigation = getTestInvestigation();
        
        Set<Id> responseIds = new Set<Id>{investigation.Incident_Response__c};
        
        Test.startTest();
        System.runAs(u) {
            List<Incident_Investigation__c> result = IncidentSelector.selectInvestigationsByResponseIds(responseIds);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 4: selectCorrectiveActionsByInvestigation
    // =============================================
    @isTest
    static void testSelectCorrectiveActionsByInvestigation() {
        User u = getTestUser();
        Incident_Corrective_Action__c correctiveAction = getTestCorrectiveAction();
        
        Test.startTest();
        System.runAs(u) {
            List<Incident_Corrective_Action__c> result = IncidentSelector.selectCorrectiveActionsByInvestigation(correctiveAction.Incident_Investigation__c);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 5: selectAllCorrectiveActions
    // =============================================
    @isTest
    static void testSelectAllCorrectiveActions() {
        User u = getTestUser();
        
        Test.startTest();
        System.runAs(u) {
            List<Incident_Corrective_Action__c> result = IncidentSelector.selectAllCorrectiveActions();
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 6: selectNdisSubmissionsByInvestigation
    // =============================================
    @isTest
    static void testSelectNdisSubmissionsByInvestigation() {
        User u = getTestUser();
        Incident_NDIS_Submission__c ndisSubmission = getTestNdisSubmission();
        
        Test.startTest();
        System.runAs(u) {
            List<Incident_NDIS_Submission__c> result = IncidentSelector.selectNdisSubmissionsByInvestigation(ndisSubmission.Incident_Investigation__c);
        }
        Test.stopTest();
    }
}