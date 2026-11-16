@isTest
private class TSignGuidedTourControllerTest {

    // Staff record for the running user, matched by email (or by User__c when linkUser is true).
    private static TSign_Staff__c createStaff(Boolean linkUser) {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Tour Org ' + DateTime.now().getTime(),
            Account_Type__c = 'Organisation',
            Active__c = true,
            Email__c = 'tour.org.' + DateTime.now().getTime() + '@example.com'
        );
        insert org;

        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c = 'Chris',
            Last_Name__c = 'Evans',
            Email__c = UserInfo.getUserEmail(),
            TSign_Organisation__c = org.Id,
            Status__c = true,
            User_Type__c = 'T Sign Org Admin',
            Module_Access__c = 'T Sign;Folders'
        );
        if (linkUser) {
            staff.User__c = UserInfo.getUserId();
        }
        insert staff;
        return staff;
    }

    @isTest
    static void newUserSeesWelcome() {
        createStaff(false);

        Test.startTest();
        TSignGuidedTourController.TourState state = TSignGuidedTourController.getTourState();
        Test.stopTest();

        Assert.isTrue(state.showWelcome, 'A new person should see the welcome popup');
        Assert.areEqual('Chris', state.firstName);
        Assert.isNull(state.status);
    }

    @isTest
    static void skipHidesWelcome() {
        TSign_Staff__c staff = createStaff(true);

        Test.startTest();
        TSignGuidedTourController.saveTourStatus(TSignGuidedTourController.SKIPPED);
        TSignGuidedTourController.TourState state = TSignGuidedTourController.getTourState();
        Test.stopTest();

        Assert.isFalse(state.showWelcome, 'Welcome must not show again after Skip');
        Assert.areEqual('Skipped', state.status);
        TSign_Staff__c saved = [SELECT Guided_Tour_Date__c FROM TSign_Staff__c WHERE Id = :staff.Id];
        Assert.isNotNull(saved.Guided_Tour_Date__c, 'Date should be stamped');
    }

    @isTest
    static void completedIsKept() {
        TSign_Staff__c staff = createStaff(true);

        Test.startTest();
        TSignGuidedTourController.saveTourStatus(TSignGuidedTourController.STARTED);
        TSignGuidedTourController.saveTourStatus(TSignGuidedTourController.COMPLETED);
        TSignGuidedTourController.saveTourStatus(TSignGuidedTourController.SKIPPED); // replayed from Help, then skipped
        Test.stopTest();

        TSign_Staff__c saved = [SELECT Guided_Tour_Status__c FROM TSign_Staff__c WHERE Id = :staff.Id];
        Assert.areEqual('Completed', saved.Guided_Tour_Status__c);
    }

    @isTest
    static void unknownStatusIsRejected() {
        createStaff(true);
        Boolean failed = false;

        Test.startTest();
        try {
            TSignGuidedTourController.saveTourStatus('Maybe');
        } catch (AuraHandledException e) {
            failed = true;
        }
        Test.stopTest();

        Assert.isTrue(failed, 'Unknown status should throw');
    }

    @isTest
    static void noStaffRecord() {
        Test.startTest();
        TSignGuidedTourController.TourState state = TSignGuidedTourController.getTourState();
        TSignGuidedTourController.saveTourStatus(TSignGuidedTourController.SKIPPED); // nothing to update, no error
        Test.stopTest();

        Assert.isFalse(state.showWelcome, 'No staff record: no welcome popup');
    }
}