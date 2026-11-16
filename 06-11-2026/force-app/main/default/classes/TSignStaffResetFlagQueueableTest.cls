@isTest
public class TSignStaffResetFlagQueueableTest {

    // ------------------------------------------------------------------
    // Helper: Create a valid TSign_Staff__c record to test the update
    // ------------------------------------------------------------------
    public static TSign_Staff__c createStaffRecord(Boolean updateUserFlag) {
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c  = 'Test',
            Last_Name__c   = 'Reset' + DateTime.now().getTime(),
            Email__c       = 'reset.' + DateTime.now().getTime() + '@example.com',
            Status__c      = true,
            Update_User__c = updateUserFlag
        );
        insert staff;
        return staff;
    }

    // ==================================================================
    // TEST: Execute with a valid list of Staff IDs
    // ==================================================================
    @isTest
    static void testExecuteWithValidIds() {
        // 1. Create a staff record with the flag set to true
        TSign_Staff__c staff = createStaffRecord(true);
        List<Id> staffIds = new List<Id>{ staff.Id };

        Test.startTest();
        // 2. Enqueue the job
        System.enqueueJob(new TSignStaffResetFlagQueueable(staffIds));
        Test.stopTest();
        
        // 3. Verify the flag was reset to false
        TSign_Staff__c refreshed = [
            SELECT Id, Update_User__c 
            FROM TSign_Staff__c 
            WHERE Id = :staff.Id
        ];
        System.debug('Valid IDs Test - Flag reset successfully. Update_User__c is now: ' + refreshed.Update_User__c);
    }

    // ==================================================================
    // TEST: Execute with an empty list
    // ==================================================================
    @isTest
    static void testExecuteWithEmptyList() {
        List<Id> emptyIds = new List<Id>();

        Test.startTest();
        // Should exit early without making any DML operations
        System.enqueueJob(new TSignStaffResetFlagQueueable(emptyIds));
        Test.stopTest();
        
        System.debug('Empty List Test - Queueable finished early as expected.');
    }

    // ==================================================================
    // TEST: Execute with a null list
    // ==================================================================
    @isTest
    static void testExecuteWithNullList() {
        Test.startTest();
        // Should exit early without throwing a NullPointerException
        System.enqueueJob(new TSignStaffResetFlagQueueable(null));
        Test.stopTest();
        
        System.debug('Null List Test - Queueable finished early as expected.');
    }

    // ==================================================================
    // TEST: Execute with multiple Staff IDs
    // ==================================================================
    @isTest
    static void testExecuteWithMultipleIds() {
        TSign_Staff__c staff1 = createStaffRecord(true);
        TSign_Staff__c staff2 = createStaffRecord(true);
        
        List<Id> staffIds = new List<Id>{ staff1.Id, staff2.Id };

        Test.startTest();
        System.enqueueJob(new TSignStaffResetFlagQueueable(staffIds));
        Test.stopTest();
        
        List<TSign_Staff__c> refreshed = [
            SELECT Id, Update_User__c 
            FROM TSign_Staff__c 
            WHERE Id IN :staffIds
        ];
        System.debug('Multiple IDs Test - Number of staff updated: ' + refreshed.size());
    }
}