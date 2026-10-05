@IsTest
public class SupportBudgetControllerTest {

    @TestSetup
    static void setupData() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        Support_Client__c participant =
            new Support_Client__c(
                First_Name__c = 'John',
                Last_Name__c = 'Budget',
                Status__c = 'Active',
                Organization__c = org.Id,
                SupportClient_To_Staff__c = staff.Id
            );

        insert participant;
        
       
        // Coordinator Group
        Support_CoordinatorCatalogueGroup__c coordinatorGroup =
            new Support_CoordinatorCatalogueGroup__c(
                Name = 'Support Coordination',
                Support_Client__c = participant.Id,
                Organization__c = org.Id,
                BudgetAllocation__c = 1000,
                Budget_Spent_to_Date__c = 200,
                AmountSpent__c = 200,
                State__c = 'ACT'
            );

        insert coordinatorGroup;

        // Catalogue Group
        Support_CatalogueGroup__c catalogueGroup =
            new Support_CatalogueGroup__c(
                Name = 'Core Supports',
                SupportCatalogueGroup_To_SupportClient__c = participant.Id,
                Organization_To_Support_CatalogueGroup__c = org.Id,
                BudgetAllocation__c = 1500,
                Budget_Spent_to_Date__c = 300,
                AmountSpent__c = 300,
                State__c = 'ACT'
            );

        insert catalogueGroup;

        // Budget
        Support_Budget__c budget =
            new Support_Budget__c(
                Support_Client__c = participant.Id,
                Service_Type__c = 'Support Coordination',
                Service_Item__c = 'Item 001',
                Unit_Price__c = 25,
                Total_Hours__c = 4,
                Total_Amount__c = 100,
                Actual_Amount__c = 80,
                Budget_Date__c = Date.today().addDays(-2),
                Start_Time__c = Time.newInstance(10,0,0,0),
                End_Time__c = Time.newInstance(12,0,0,0)
            );

        insert budget;

        // Support Note
        Support_Notes__c note =
            new Support_Notes__c(
                SupportClient_To_Notes__c = participant.Id,
                Entry_Date__c = Date.today().addDays(-1),
                Notes_Type__c = 'Case Note',
                Billable__c = true,
                Duration_Hours__c = '2',
                Total_Cost__c = '50',
                Activity_Details__c = 'Testing Notes',
                Entry_Cost_c__c = '50',
                Created_From__c = 'Case',
                Organization__c = org.Id
            );

        insert note;
    }

    @IsTest
    static void testCreateSupportBudget() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Support_Client__c participant = [
                SELECT Id
                FROM Support_Client__c
                LIMIT 1
            ];

            Test.startTest();
            List<String> recurrenceDates = new List<String>{String.valueOf(Date.today())};

            SupportBudgetController.createSupportBudget(
                participant.Id,
                'Support Coordination',
                'Service Item',
                25,
                5,
                125,
                100,
                '10:00 AM',
                '12:00 PM',
                recurrenceDates,
                'INV001'
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetSupportBudgets() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Support_Client__c participant = [
                SELECT Id
                FROM Support_Client__c
                LIMIT 1
            ];

            Test.startTest();

            SupportBudgetController.getSupportBudgets(
                participant.Id
            );

            Test.stopTest();
        }
    }

    @IsTest
static void testUpdateSupportBudget() {

    User testUser = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Support_Client__c participant = [
            SELECT Id
            FROM Support_Client__c
            LIMIT 1
        ];

        List<String> recurrenceDates =
            new List<String>{ String.valueOf(Date.today()) };

        List<Id> budgetIds =
            SupportBudgetController.createSupportBudget(
                participant.Id,
                'Support Coordination',
                'Initial Item',
                20,
                4,
                80,
                60,
                '09:00 AM',
                '11:00 AM',
                recurrenceDates,
                'INV001'
            );

        Id budgetId = budgetIds[0];

        Test.startTest();

        SupportBudgetController.updateSupportBudget(
            budgetId,
            'Updated Service',
            'Updated Item',
            30,
            6,
            180,
            150,
            '01:00 PM',
            '03:00 PM',
            recurrenceDates,
            'https://testfile.com/file.pdf',
            'INV002'
        );

        Test.stopTest();
    }
}

   @IsTest
static void testDeleteSupportBudget() {

    User testUser = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Support_Client__c participant = [
            SELECT Id
            FROM Support_Client__c
            LIMIT 1
        ];

        List<String> recurrenceDates =
            new List<String>{ String.valueOf(Date.today()) };

        List<Id> budgetIds =
            SupportBudgetController.createSupportBudget(
                participant.Id,
                'Delete Service',
                'Delete Item',
                10,
                2,
                20,
                15,
                '08:00 AM',
                '09:00 AM',
                recurrenceDates,
                'INV001'
            );

        Id budgetId = budgetIds[0];

        Test.startTest();

        SupportBudgetController.deleteSupportBudget(budgetId);

        Test.stopTest();
    }
}

   @IsTest
static void testExceptionMethods() {

    User testUser = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Test.startTest();

        try {
            SupportBudgetController.createSupportBudget(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                new List<String>(),
                null
            );
        } catch (Exception e) {}

        try {
            SupportBudgetController.updateSupportBudget(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                new List<String>(),
                null,
                null
            );
        } catch (Exception e) {}

        try {
            SupportBudgetController.deleteSupportBudget(null);
        } catch (Exception e) {}

        Test.stopTest();
    }
}
    
     
   
  @IsTest
static void testParticipantReportsMethods() {

    User testUser = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Support_Client__c participant = [
            SELECT Id
            FROM Support_Client__c
            LIMIT 1
        ];

        List<Id> participantIds = new List<Id>{
            participant.Id
        };

        Test.startTest();

        SupportCoordinationReports.getParticipantUtilization(
            participantIds
        );

        SupportCoordinationReports.getParticipantReconciliation(
            participantIds,
            Date.today().addDays(-30),
            Date.today()
        );

        SupportCoordinationReports.getParticipantCaseNotes(
            participantIds,
            Date.today().addDays(-30),
            Date.today()
        );

        Test.stopTest();
    }
}
    
    @IsTest
static void testValidateBudgetDates_EditMode() {

    Support_Client__c participant = [
        SELECT Id
        FROM Support_Client__c
        LIMIT 1
    ];

    List<Support_Budget__c> budgets = [
        SELECT Id, Budget_Date__c
        FROM Support_Budget__c
        WHERE Support_Client__c = :participant.Id
        LIMIT 1
    ];

    Support_Budget__c existingBudget = budgets[0];

    Support_Budget__c anotherBudget = new Support_Budget__c(
        Support_Client__c = participant.Id,
        Service_Type__c = 'Support Coordination',
        Service_Item__c = 'Test Item',
        Unit_Price__c = 10,
        Total_Hours__c = 1,
        Total_Amount__c = 10,
        Actual_Amount__c = 10,
        Budget_Date__c = Date.today(),
        Start_Time__c = Time.newInstance(9,0,0,0),
        End_Time__c = Time.newInstance(10,0,0,0)
    );

    insert anotherBudget;

    List<String> recurrenceDates = new List<String>{
        String.valueOf(anotherBudget.Budget_Date__c)
    };

    Test.startTest();

    Map<String,String> result =
        SupportBudgetController.validateBudgetDates(
            participant.Id,
            recurrenceDates,
            true,
            existingBudget.Id
        );

    Test.stopTest();

    
}

    
  @IsTest
static void testExceptionScenarios() {

    User testUser = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Test.startTest();

        try {
            SupportCoordinationReports.getParticipantUtilization(
                new List<Id>()
            );
        } catch (Exception e) {
        }

        try {
            SupportCoordinationReports.getParticipantReconciliation(
                new List<Id>(),
                Date.today().addDays(-30),
                Date.today()
            );
        } catch (Exception e) {
        }

        try {
            SupportCoordinationReports.getParticipantCaseNotes(
                new List<Id>(),
                Date.today().addDays(-30),
                Date.today()
            );
            SupportCoordinationReports.getProviderReport();
        } catch (Exception e) {
        }

        Test.stopTest();
    }
    
    
}
}