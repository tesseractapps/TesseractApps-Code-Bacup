@isTest
private class TSignUserGuideControllerTest {

    // Organisation + staff record for the running user (same pattern as TSignGuidedTourControllerTest).
    private static TSign_Staff__c createStaff() {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Guide Org ' + DateTime.now().getTime(),
            Account_Type__c = 'Organisation',
            Active__c = true,
            Email__c = 'guide.org.' + DateTime.now().getTime() + '@example.com'
        );
        insert org;

        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c = 'Chris',
            Last_Name__c = 'Evans',
            Email__c = UserInfo.getUserEmail(),
            TSign_Organisation__c = org.Id,
            Status__c = true,
            User_Type__c = 'T Sign Org Admin',
            Module_Access__c = 'T Sign;Folders',
            User__c = UserInfo.getUserId()
        );
        insert staff;
        return staff;
    }

    @isTest
    static void newAccountHasNothingDone() {
        createStaff();

        Test.startTest();
        TSignUserGuideController.SetupProgress progress = TSignUserGuideController.getSetupProgress();
        Test.stopTest();

        Assert.isFalse(progress.signature, 'No signature saved yet');
        Assert.isFalse(progress.users, 'Only the account owner exists');
        Assert.isFalse(progress.contacts, 'No contacts yet');
        Assert.isFalse(progress.templates, 'No templates yet');
        Assert.isFalse(progress.folders, 'No attachments yet');
    }

    @isTest
    static void savedRecordsTickTheList() {
        TSign_Staff__c staff = createStaff();
        insert new TSign_Signature__c(TSign_Staff__c = staff.Id, Is_Default__c = true);
        insert new List<TSign_Facility__c>{
            new TSign_Facility__c(Name = 'Head office', TSign_Organisation__c = staff.TSign_Organisation__c),
            new TSign_Facility__c(Name = 'Second site', TSign_Organisation__c = staff.TSign_Organisation__c)
        };
        insert new TSign_Contact__c(
            First_Name__c = 'Olivia',
            Last_Name__c = 'Bennett',
            Email__c = 'olivia.bennett@example.com',
            TSign_Organisation__c = staff.TSign_Organisation__c,
            Is_Archived__c = false
        );

        Test.startTest();
        TSignUserGuideController.SetupProgress progress = TSignUserGuideController.getSetupProgress();
        Test.stopTest();

        Assert.isTrue(progress.signature, 'Saved signature should tick the list');
        Assert.isTrue(progress.users, 'A second facility should tick users and facilities');
        Assert.isTrue(progress.contacts, 'A live contact should tick the list');
    }

    @isTest
    static void archivedContactDoesNotCount() {
        TSign_Staff__c staff = createStaff();
        insert new TSign_Contact__c(
            First_Name__c = 'Sarah',
            Last_Name__c = 'Bennett',
            Email__c = 'sarah.bennett@example.com',
            TSign_Organisation__c = staff.TSign_Organisation__c,
            Is_Archived__c = true
        );

        Test.startTest();
        TSignUserGuideController.SetupProgress progress = TSignUserGuideController.getSetupProgress();
        Test.stopTest();

        Assert.isFalse(progress.contacts, 'Archived contacts should not count');
    }

    @isTest
    static void noStaffRecord() {
        Test.startTest();
        TSignUserGuideController.SetupProgress progress = TSignUserGuideController.getSetupProgress();
        Test.stopTest();

        Assert.isFalse(progress.signature, 'No staff record: nothing is done');
        Assert.isFalse(progress.contacts, 'No staff record: nothing is done');
    }
}