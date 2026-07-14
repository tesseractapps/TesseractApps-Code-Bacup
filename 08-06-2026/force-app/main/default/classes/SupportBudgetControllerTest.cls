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
                Date.today()
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

            Id budgetId =
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
                    Date.today()
                );

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
                Date.today(),
                'https://testfile.com/file.pdf'
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

            Id budgetId =
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
                    Date.today()
                );

            Test.startTest();

            SupportBudgetController.deleteSupportBudget(
                budgetId
            );

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
                    null,
                    null
                );

            } catch (Exception e) {}

            try {

                SupportBudgetController.deleteSupportBudget(
                    null
                );

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

            Test.startTest();

            // Utilization
            SupportCoordinationReports.getParticipantUtilization(
                participant.Id
            );

            // Reconciliation
            SupportCoordinationReports.getParticipantReconciliation(
                participant.Id
            );

            // Case Notes
            SupportCoordinationReports.getParticipantCaseNotes(
                participant.Id
            );

            Test.stopTest();
        }
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
                    null
                );

            } catch (Exception e) {}

            try {

                SupportCoordinationReports.getParticipantReconciliation(
                    null
                );

            } catch (Exception e) {}

            try {

                SupportCoordinationReports.getParticipantCaseNotes(
                    null
                );

            } catch (Exception e) {}

            Test.stopTest();
        }
    }
}