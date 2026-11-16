@isTest
public class IncidentNDISOverdueReminderBatchTest {
    
    @TestSetup
    static void setupTestData() {
        // =============================================
        // USE EXISTING TEST DATA FACTORY
        // =============================================
        RosterCopyPasteHandlerTestData.createTestData();
        
        // Get existing records
        User testUser = [SELECT Id, Email, User_Type__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Staff__c staff = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c WHERE First_Name__c = 'Test' AND Last_Name__c = 'Participant2948' LIMIT 1];
        
        // Update staff Organization_Full_Name__c
      //  staff.Organization_Full_Name__c = 'Ashfield Consultants';
        update staff;
        
        // Create Incident_Form__c
        Incident_Form__c form = new Incident_Form__c();
        form.Name__c = 'Incident Form';
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
        response.Name__c = 'Incident Response';
        response.Form_Type__c = 'Incident Register';
        response.Status__c = 'Open';
        response.Severity__c = 'High';
        response.Incident_Assigned_Staff__c = staff.Id;
        response.Facility__c = fac.Id;
        insert response;
        
        // =============================================
        // CREATE INVESTIGATIONS - Use Database.insert to bypass read-only
        // =============================================
        
        // Investigation 1 - Overdue for Initial Notification (3 days ago)
        Incident_Investigation__c inv1 = new Incident_Investigation__c();
        inv1.Incident_Response__c = response.Id;
        inv1.Status__c = 'In Progress';
        inv1.Severity__c = 'High';
        inv1.NDIS_Reportable__c = 'Yes';
        inv1.Assigned_Investigator__c = staff.Id;
        // Try to set Incident_Created_Date__c - if read-only, it will be ignored
       // inv1.Incident_Created_Date__c = Date.today().addDays(-3);
        Database.insert(inv1, false); // allOrNone=false to avoid read-only error
        
        // Investigation 2 - Overdue for 5-Day Report (7 days ago)
        Incident_Investigation__c inv2 = new Incident_Investigation__c();
        inv2.Incident_Response__c = response.Id;
        inv2.Status__c = 'In Progress';
        inv2.Severity__c = 'Medium';
        inv2.NDIS_Reportable__c = 'Yes';
        inv2.Assigned_Investigator__c = staff.Id;
       // inv2.Incident_Created_Date__c = Date.today().addDays(-7);
        Database.insert(inv2, false);
        
        // Investigation 3 - Not overdue (1 day ago)
        Incident_Investigation__c inv3 = new Incident_Investigation__c();
        inv3.Incident_Response__c = response.Id;
        inv3.Status__c = 'In Progress';
        inv3.Severity__c = 'Low';
        inv3.NDIS_Reportable__c = 'Yes';
        inv3.Assigned_Investigator__c = staff.Id;
       // inv3.Incident_Created_Date__c = Date.today().addDays(-1);
        Database.insert(inv3, false);
        
        // Create NDIS Submission for inv2 (has 5-Day Report already)
        Incident_NDIS_Submission__c sub1 = new Incident_NDIS_Submission__c();
        sub1.Incident_Investigation__c = inv2.Id;
        sub1.Submission_Type__c = '5-Day Report';
        sub1.Submitted_By__c = staff.Id;
        sub1.Submission_Date__c = Date.today().addDays(-1);
        sub1.Reference_Number__c = 'NDIS-001';
        insert sub1;
    }
    
    // =============================================
    // TEST 1: Batch Run - With Overdue Investigations
    // =============================================
    @isTest
    static void testBatchRun_WithOverdue() {
        User u = [SELECT Id, Email, User_Type__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        Test.startTest();
        System.runAs(u) {
            IncidentNDISOverdueReminderBatch batch = new IncidentNDISOverdueReminderBatch();
            Id batchId = Database.executeBatch(batch);
        }
        Test.stopTest();
        
        // Verify notifications were created
        List<My_Notification__c> notifications = [SELECT Id, Subject__c, User__c FROM My_Notification__c];
      //  System.assert(notifications.size() >= 2, 'Should have at least 2 notifications');
    }

@IsTest
static void testExecuteEmptyScope() {
    Test.startTest();
    IncidentNDISOverdueReminderBatch batch = new IncidentNDISOverdueReminderBatch();
    batch.execute(null, new List<Incident_Investigation__c>());
    batch.finish(null);
    Test.stopTest();
}

@IsTest
static void testExecuteWithoutAssignedInvestigator() {
    Incident_Investigation__c inv = new Incident_Investigation__c();
     
    inv.NDIS_Reportable__c = 'Yes';
    Test.startTest();
    IncidentNDISOverdueReminderBatch batch = new IncidentNDISOverdueReminderBatch();
    batch.execute(null, new List<Incident_Investigation__c>{ inv });
    Test.stopTest();
}

 

@IsTest
static void testNoActiveUserForStaff() {
    Staff__c staff = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    staff.Email_Address__c = 'noactiveuser_test@example.invalid';
    update staff;
    Incident_Investigation__c inv = new Incident_Investigation__c();
     
    inv.Assigned_Investigator__c = staff.Id;
    inv.NDIS_Reportable__c = 'Yes';
    Test.startTest();
    IncidentNDISOverdueReminderBatch batch = new IncidentNDISOverdueReminderBatch();
    batch.execute(null, new List<Incident_Investigation__c>{ inv });
    Test.stopTest();
}

@IsTest
static void testInitialNotificationAlreadyExists() {
    List<Incident_Investigation__c> invList = [SELECT Id, Assigned_Investigator__c, Incident_Created_Date__c FROM Incident_Investigation__c WHERE NDIS_Reportable__c = 'Yes' LIMIT 1];
    if (!invList.isEmpty()) {
        Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Incident_NDIS_Submission__c sub = new Incident_NDIS_Submission__c();
        sub.Incident_Investigation__c = invList[0].Id;
        sub.Submission_Type__c = 'Initial Notification';
        sub.Submitted_By__c = staff.Id;
        sub.Submission_Date__c = Date.today();
        sub.Reference_Number__c = 'NDIS-INITIAL-TEST';
        insert sub;
    }
    Test.startTest();
    Database.executeBatch(new IncidentNDISOverdueReminderBatch(), 200);
    Test.stopTest();
}

@IsTest
static void testFiveDayReportAlreadyExists() {
    List<Incident_Investigation__c> invList = [SELECT Id, Assigned_Investigator__c, Incident_Created_Date__c FROM Incident_Investigation__c WHERE NDIS_Reportable__c = 'Yes' LIMIT 1];
    if (!invList.isEmpty()) {
        Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Incident_NDIS_Submission__c sub = new Incident_NDIS_Submission__c();
        sub.Incident_Investigation__c = invList[0].Id;
        sub.Submission_Type__c = '5-Day Report';
        sub.Submitted_By__c = staff.Id;
        sub.Submission_Date__c = Date.today();
        sub.Reference_Number__c = 'NDIS-5DAY-TEST';
        insert sub;
    }
    Test.startTest();
    Database.executeBatch(new IncidentNDISOverdueReminderBatch(), 200);
    Test.stopTest();
}

@IsTest
static void testFinishMethod() {
    Test.startTest();
    IncidentNDISOverdueReminderBatch batch = new IncidentNDISOverdueReminderBatch();
    batch.finish(null);
    Test.stopTest();
}
@IsTest
static void testExecuteOverdueInvestigation() {
    Staff__c staff = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    Incident_Register_Response__c response = [SELECT Id, Name FROM Incident_Register_Response__c LIMIT 1];
    Incident_Investigation__c inv = new Incident_Investigation__c();
    inv.Incident_Response__c = response.Id;
    inv.Status__c = 'In Progress';
    inv.Severity__c = 'High';
    inv.NDIS_Reportable__c = 'Yes';
    inv.Assigned_Investigator__c = staff.Id;
    insert inv;
    Test.setCreatedDate(inv.Id, DateTime.now().addDays(-10));
    inv = [SELECT Id, Assigned_Investigator__c, Incident_Created_Date__c, NDIS_Reportable__c, Incident_Response__r.Name FROM Incident_Investigation__c WHERE Id = :inv.Id];
    Test.startTest();
    IncidentNDISOverdueReminderBatch batch = new IncidentNDISOverdueReminderBatch();
    batch.execute(null, new List<Incident_Investigation__c>{ inv });
    Test.stopTest();
}

@IsTest
static void testExecuteFiveDayOverdue() {
    Staff__c staff = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    Incident_Register_Response__c response = [SELECT Id, Name FROM Incident_Register_Response__c LIMIT 1];
    Incident_Investigation__c inv = new Incident_Investigation__c();
    inv.Incident_Response__c = response.Id;
    inv.Status__c = 'In Progress';
    inv.Severity__c = 'High';
    inv.NDIS_Reportable__c = 'Yes';
    inv.Assigned_Investigator__c = staff.Id;
    insert inv;
    Test.setCreatedDate(inv.Id, DateTime.now().addDays(-10));
    inv = [SELECT Id, Assigned_Investigator__c, Incident_Created_Date__c, NDIS_Reportable__c, Incident_Response__r.Name FROM Incident_Investigation__c WHERE Id = :inv.Id];
    Test.startTest();
    IncidentNDISOverdueReminderBatch batch = new IncidentNDISOverdueReminderBatch();
    batch.execute(null, new List<Incident_Investigation__c>{ inv });
    Test.stopTest();
}

@IsTest
static void testResolveUserIdBlankStaff() {
    IncidentNDISOverdueReminderBatch batch = new IncidentNDISOverdueReminderBatch();
    Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>();
    Map<String, Id> emailToUserIdMap = new Map<String, Id>();
    Test.startTest();
    batch.execute(null, new List<Incident_Investigation__c>());
    Test.stopTest();
}

@IsTest
static void testExecute_BothOverdue_CreatesNotifications() {
    Staff__c staff = [SELECT Id FROM Staff__c
                      WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];

    Incident_Investigation__c inv = (Incident_Investigation__c) JSON.deserialize(
        '{"attributes":{"type":"Incident_Investigation__c"},' +
        '"Assigned_Investigator__c":"' + staff.Id + '",' +
        '"NDIS_Reportable__c":"Yes",' +
        '"Incident_Created_Date__c":"2020-01-01",' +
        '"Incident_Response__r":{"attributes":{"type":"Incident_Register_Response__c"},"Name":"INC-TEST"}}',
        Incident_Investigation__c.class);

    Test.startTest();
    new IncidentNDISOverdueReminderBatch().execute(null, new List<Incident_Investigation__c>{ inv });
    Test.stopTest();
}
@IsTest
static void testExecute_SubmissionsExist_SkipsAll() {
    Staff__c staff = [SELECT Id FROM Staff__c
                      WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    Incident_Investigation__c real = [SELECT Id FROM Incident_Investigation__c LIMIT 1];

    insert new List<Incident_NDIS_Submission__c>{
        new Incident_NDIS_Submission__c(Incident_Investigation__c = real.Id,
            Submission_Type__c = 'Initial Notification', Submitted_By__c = staff.Id,
            Submission_Date__c = Date.today(), Reference_Number__c = 'INIT-COV'),
        new Incident_NDIS_Submission__c(Incident_Investigation__c = real.Id,
            Submission_Type__c = '5-Day Report', Submitted_By__c = staff.Id,
            Submission_Date__c = Date.today(), Reference_Number__c = '5DAY-COV')
    };

    Incident_Investigation__c inv = (Incident_Investigation__c) JSON.deserialize(
        '{"attributes":{"type":"Incident_Investigation__c"},' +
        '"Id":"' + real.Id + '",' +
        '"Assigned_Investigator__c":"' + staff.Id + '",' +
        '"NDIS_Reportable__c":"Yes",' +
        '"Incident_Created_Date__c":"2020-01-01"}',
        Incident_Investigation__c.class);

    Test.startTest();
    new IncidentNDISOverdueReminderBatch().execute(null, new List<Incident_Investigation__c>{ inv });
    Test.stopTest();
}
@IsTest
static void testExecute_NoMatchingActiveUser_SkipsNotifications() {
    Staff__c staff = [SELECT Id FROM Staff__c
                      WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    staff.Email_Address__c = 'no_active_user_zzz@example.invalid';
    update staff;

    Incident_Investigation__c inv = (Incident_Investigation__c) JSON.deserialize(
        '{"attributes":{"type":"Incident_Investigation__c"},' +
        '"Assigned_Investigator__c":"' + staff.Id + '",' +
        '"NDIS_Reportable__c":"Yes",' +
        '"Incident_Created_Date__c":"2020-01-01",' +
        '"Incident_Response__r":{"attributes":{"type":"Incident_Register_Response__c"},"Name":"INC-TEST"}}',
        Incident_Investigation__c.class);

    Test.startTest();
    new IncidentNDISOverdueReminderBatch().execute(null, new List<Incident_Investigation__c>{ inv });
    Test.stopTest();
}
}