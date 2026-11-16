@IsTest
public class Support_GoalsControllerTest {

    @TestSetup
    static void setupData() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id, Name
            FROM Organisation__c
            LIMIT 1
        ];

        Staff__c staff = [
            SELECT Id, Email_Address__c
            FROM Staff__c
            LIMIT 1
        ];

        Support_Client__c participant = new Support_Client__c();
        participant.Name = 'Test Participant';
        participant.First_Name__c = 'John';
        participant.Last_Name__c = 'Doe';
        participant.Status__c = 'Active';
        participant.SupportClient_To_Staff__c = staff.Id;
        participant.Organization__c = org.Id;
        insert participant;

        Support_Provider__c provider = new Support_Provider__c();
        provider.Name = 'Provider One';
        provider.Status__c = 'Active';
        insert provider;

        Support_Goals__c goal = new Support_Goals__c();
        goal.Name = 'Goal One';
        goal.SupportClient_To_Goals__c = participant.Id;
        goal.Status__c = 'Active';
        goal.Priority__c = 'High';
        goal.Goal_Category__c = 'NDIS';
        goal.Review_Frequency__c = 'Weekly';
        goal.Budget__c = 1000;
        insert goal;

        Support_SubGoals__c subGoal = new Support_SubGoals__c();
        subGoal.Title__c = 'Sub Goal';
        subGoal.Description__c = 'Description';
        subGoal.Status__c = 'Not Started';
        subGoal.Support_Goals_To_SubGoals__c = goal.Id;
        insert subGoal;

        Support_Goal_Review__c review = new Support_Goal_Review__c();
        review.Support_Goals_To_GoalReview__c = goal.Id;
        review.Update_Progress__c = '40';
        review.BudgetSpent__c = 200;
        review.Review_Date__c = Date.today();
        insert review;

        Support_Notes__c note = new Support_Notes__c();
        note.SupportNotes_To_SupportGoals__c = goal.Id;
        note.Entry_Date__c = Date.today();
        note.Activity_Details__c = 'Testing Notes';
        note.Billable__c = true;
        insert note;
    }

    @IsTest
    static void testGetParticipantGoals() {

        Test.startTest();
        Support_GoalsController.getParticipantGoals();
        Test.stopTest();
    }

    @IsTest
    static void testGetActiveParticipants() {

        Test.startTest();
        Support_GoalsController.getActiveParticipants();
        Test.stopTest();
    }

    @IsTest
    static void testGetActiveProviders() {

        Test.startTest();
        Support_GoalsController.getActiveProviders();
        Test.stopTest();
    }

    @IsTest
    static void testSaveGoalWithSubGoals() {

        Support_Client__c participant = [
            SELECT Id
            FROM Support_Client__c
            LIMIT 1
        ];

        String payloadJson =
        '{' +
            '"goal":{' +
                '"Name":"New Goal",' +
                '"SupportClient_To_Goals__c":"' + participant.Id + '",' +
                '"Status__c":"Active"' +
            '},' +
            '"subGoals":[' +
                '{' +
                    '"Title__c":"Sub1",' +
                    '"Description__c":"Desc1"' +
                '}' +
            ']' +
        '}';

        Test.startTest();
        Support_GoalsController.saveGoalWithSubGoals(payloadJson);
        Test.stopTest();
    }

       @IsTest
    static void testGetParticipantGoalsPaged() {
    
        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
    
        System.runAs(testUser) {
    
            Test.startTest();
    
            Support_GoalsController.getParticipantGoalsPaged(5, 1);
    
            Test.stopTest();
        }
    }
    @IsTest
    static void testGetGoalReviews() {

        Support_Goals__c goal = [
            SELECT Id
            FROM Support_Goals__c
            LIMIT 1
        ];

        Test.startTest();
        Support_GoalsController.getGoalReviews(goal.Id);
        Test.stopTest();
    }

    @IsTest
    static void testSaveGoalReview() {

        Support_Goals__c goal = [
            SELECT Id
            FROM Support_Goals__c
            LIMIT 1
        ];

        Support_Goal_Review__c review = new Support_Goal_Review__c();
        review.Support_Goals_To_GoalReview__c = goal.Id;
        review.Update_Progress__c = '20';
        review.Review_Date__c = Date.today();
        review.Progress_Summary__c = 'Good Progress';

        Test.startTest();
        Support_GoalsController.saveGoalReview(review);
        Test.stopTest();
    }

   
       @IsTest
    static void testGetGlobalDashboardMetrics() {
    
        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
    
        System.runAs(testUser) {
    
            Test.startTest();
            Support_GoalsController.getGlobalDashboardMetrics();
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetNotesByGoal() {

        Support_Goals__c goal = [
            SELECT Id
            FROM Support_Goals__c
            LIMIT 1
        ];

        Test.startTest();
        Support_GoalsController.getNotesByGoal(goal.Id);
        Test.stopTest();
    }

    @IsTest
    static void testUpdateSubGoalStatus() {

        Support_SubGoals__c sg = [
            SELECT Id
            FROM Support_SubGoals__c
            LIMIT 1
        ];

        Test.startTest();
        Support_GoalsController.updateSubGoalStatus(
            sg.Id,
            'Completed'
        );
        Test.stopTest();
    }

    @IsTest
    static void testExceptionScenarios() {

        Test.startTest();

        try {
            Support_GoalsController.getGoalReviews(null);
        } catch (Exception e) {}

        try {
            Support_GoalsController.saveGoalWithSubGoals(null);
        } catch (Exception e) {}

        try {
            Support_GoalsController.updateSubGoalStatus(null, null);
        } catch (Exception e) {}

        try {
            Support_GoalsController.saveGoalReview(
                new Support_Goal_Review__c()
            );
        } catch (Exception e) {}

        Test.stopTest();
    }
}