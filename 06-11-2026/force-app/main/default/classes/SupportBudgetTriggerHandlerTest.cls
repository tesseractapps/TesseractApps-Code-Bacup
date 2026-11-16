@isTest
public class SupportBudgetTriggerHandlerTest {

    @isTest
    static void testUpdateBudgetTotals() {

        // Create Participant
        Support_Client__c participant = new Support_Client__c(
            Name = 'Test Participant',
            Plan_Start_Date__c = Date.today().addDays(-30),
            Plan_End_Date__c = Date.today().addDays(30)
        );
        insert participant;

        // Budget 1 - Uses Actual Amount
        Support_Budget__c budget1 = new Support_Budget__c(
            Support_Client__c = participant.Id,
            Budget_Date__c = Date.today(),
            Total_Amount__c = 100,
            Actual_Amount__c = 80
        );

        // Budget 2 - Uses Total Amount because Actual Amount is null
        Support_Budget__c budget2 = new Support_Budget__c(
            Support_Client__c = participant.Id,
            Budget_Date__c = Date.today(),
            Total_Amount__c = 200
        );

        // Budget 3 - Outside Plan Date Range (should not count)
        Support_Budget__c budget3 = new Support_Budget__c(
            Support_Client__c = participant.Id,
            Budget_Date__c = Date.today().addDays(60),
            Total_Amount__c = 300,
            Actual_Amount__c = 250
        );

        insert new List<Support_Budget__c>{
            budget1,
            budget2,
            budget3
        };

        Map<Id, Support_Budget__c> newMap =
            new Map<Id, Support_Budget__c>(
                [SELECT Id,
                        Support_Client__c,
                        Budget_Date__c,
                        Total_Amount__c,
                        Actual_Amount__c
                 FROM Support_Budget__c
                 WHERE Id IN :new List<Id>{
                     budget1.Id,
                     budget2.Id,
                     budget3.Id
                 }]
            );

        Test.startTest();

        SupportBudgetTriggerHandler.updateBudgetTotals(
            newMap,
            null
        );

        Test.stopTest();

        // Verify Participant Total
        participant = [
            SELECT Id,
                   Total_Budget_Spent__c
            FROM Support_Client__c
            WHERE Id = :participant.Id
        ];

        // Expected:
        // budget1 = 80 (Actual Amount)
        // budget2 = 200 (Total Amount)
        // budget3 = ignored (outside date range)
        System.assertEquals(
            280,
            participant.Total_Budget_Spent__c,
            'Participant total budget spent should equal 280'
        );
    }

    @isTest
    static void testNoMatchingBudgets() {

        Support_Client__c participant = new Support_Client__c(
            Name = 'No Match Participant',
            Plan_Start_Date__c = Date.today().addDays(-10),
            Plan_End_Date__c = Date.today().addDays(-5)
        );
        insert participant;

        Support_Budget__c budget = new Support_Budget__c(
            Support_Client__c = participant.Id,
            Budget_Date__c = Date.today(),
            Total_Amount__c = 100
        );
        insert budget;

        Map<Id, Support_Budget__c> newMap =
            new Map<Id, Support_Budget__c>(
                [SELECT Id,
                        Support_Client__c,
                        Budget_Date__c,
                        Total_Amount__c,
                        Actual_Amount__c
                 FROM Support_Budget__c
                 WHERE Id = :budget.Id]
            );

        Test.startTest();

        SupportBudgetTriggerHandler.updateBudgetTotals(
            newMap,
            null
        );

        Test.stopTest();

        participant = [
            SELECT Total_Budget_Spent__c
            FROM Support_Client__c
            WHERE Id = :participant.Id
        ];

        System.assertEquals(
            0,
            participant.Total_Budget_Spent__c,
            'Total should be zero when no budgets fall within plan dates'
        );
    }
}