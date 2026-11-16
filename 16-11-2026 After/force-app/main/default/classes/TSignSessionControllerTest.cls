@IsTest
private class TSignSessionControllerTest {

    @TestSetup
    static void setupTestData() {
        // Get the email of the user running the tests
        String currentUserEmail = UserInfo.getUserEmail();

        // Create a TSign_Staff__c record matching the current user's email
        // so getCurrentStaff() can find it
        TSign_Staff__c staff = new TSign_Staff__c(
            Email__c = currentUserEmail,
            Manual_Logout__c = false,
            First_Name__c = 'Test',
            Last_Name__c = 'User'
        );
        insert staff;
    }

    // ─────────────────────────────────────────────────────
    // Test: claimAppSession
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testClaimAppSession_PreviousSessionNotLoggedOut() {
        // Manual_Logout__c is false by default from @TestSetup
        
        Test.startTest();
        Boolean result = TSignSessionController.claimAppSession();
        Test.stopTest();

        // Since Manual_Logout__c was false, it should set it to true and return false
        System.assertEquals(false, result, 'Should return false if previous session was not manually logged out');

        TSign_Staff__c updatedStaff = [SELECT Manual_Logout__c FROM TSign_Staff__c WHERE Email__c = :UserInfo.getUserEmail() LIMIT 1];
        System.assertEquals(true, updatedStaff.Manual_Logout__c, 'Manual_Logout__c should now be true');
    }

    @IsTest
    static void testClaimAppSession_ManualLogoutTrue() {
        // Set the flag to true before calling claimAppSession
        TSign_Staff__c staff = [SELECT Id FROM TSign_Staff__c WHERE Email__c = :UserInfo.getUserEmail() LIMIT 1];
        staff.Manual_Logout__c = true;
        update staff;

        Test.startTest();
        Boolean result = TSignSessionController.claimAppSession();
        Test.stopTest();

        // Since Manual_Logout__c was true, it should set it to false and return true
        System.assertEquals(true, result, 'Should return true if previous session was manually logged out');

        TSign_Staff__c updatedStaff = [SELECT Manual_Logout__c FROM TSign_Staff__c WHERE Id = :staff.Id LIMIT 1];
        System.assertEquals(false, updatedStaff.Manual_Logout__c, 'Manual_Logout__c should now be false');
    }

    // ─────────────────────────────────────────────────────
    // Test: markManualLogout
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testMarkManualLogout() {
        // Start with a clean state (Manual_Logout__c = false)
        TSign_Staff__c staff = [SELECT Id FROM TSign_Staff__c WHERE Email__c = :UserInfo.getUserEmail() LIMIT 1];
        staff.Manual_Logout__c = false;
        update staff;

        Test.startTest();
        TSignSessionController.markManualLogout();
        Test.stopTest();

        // Verify it was updated to true
        TSign_Staff__c updatedStaff = [SELECT Manual_Logout__c FROM TSign_Staff__c WHERE Id = :staff.Id LIMIT 1];
        System.assertEquals(true, updatedStaff.Manual_Logout__c, 'Manual_Logout__c should be set to true');
    }

    // ─────────────────────────────────────────────────────
    // Test: Exception Handling (Staff record not found)
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testClaimAppSession_StaffNotFound() {
        // Delete the staff record created in TestSetup
        delete [SELECT Id FROM TSign_Staff__c];

        Test.startTest();
        try {
            TSignSessionController.claimAppSession();
            System.assert(false, 'Expected AuraHandledException due to missing staff record');
        } catch (AuraHandledException e) {
            // Note: Due to Salesforce quirks, e.getMessage() might be "Script-thrown exception"
            // if you didn't use ex.setMessage() in the production class.
            System.assert(
                e.getMessage().contains('Script-thrown exception') || 
                e.getMessage().contains('T-Sign Staff record not found'),
                'Unexpected error message: ' + e.getMessage()
            );
        }
        Test.stopTest();
    }

    @IsTest
    static void testMarkManualLogout_StaffNotFound() {
        // Delete the staff record created in TestSetup
        delete [SELECT Id FROM TSign_Staff__c];

        Test.startTest();
        try {
            TSignSessionController.markManualLogout();
            System.assert(false, 'Expected AuraHandledException due to missing staff record');
        } catch (AuraHandledException e) {
            System.assert(
                e.getMessage().contains('Script-thrown exception') || 
                e.getMessage().contains('T-Sign Staff record not found'),
                'Unexpected error message: ' + e.getMessage()
            );
        }
        Test.stopTest();
    }
}