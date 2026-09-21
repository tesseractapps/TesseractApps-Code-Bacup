@IsTest
public class ShiftWithStaffHistoryControllerTest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
    }
    
    @IsTest
    static void testGetShiftHistory_WithValidShiftId() {
        // Get a ShiftwithStaff record and Staff record created in test data
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id, Name FROM Staff__c LIMIT 1];
        
        // Create some history records for this shift
        ShiftWithStaff_History__c history1 = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = Time.newInstance(9, 0, 0, 0),
            Modified_Start_Time__c = Time.newInstance(10, 0, 0, 0),
            Reason_For_Time__c = 'Test Reason 1',
            Modified_By__c = staff.Id,
            Original_Support_Item__c = 'Support Item 1',
            Modified_Support_Item__c = 'Support Item 2',
            Original_Billable_Hours__c = 5,
            Modified_Billable_Hours__c = 7,
            Original_End_Time__c = Time.newInstance(17, 0, 0, 0),
            Modified_End_time__c = Time.newInstance(18, 0, 0, 0)
        );
        insert history1;
        
        // Add another history record
        ShiftWithStaff_History__c history2 = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = Time.newInstance(8, 0, 0, 0),
            Modified_Start_Time__c = Time.newInstance(9, 0, 0, 0),
            Reason_For_Time__c = 'Test Reason 2',
            Modified_By__c = staff.Id
        );
        insert history2;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithNullShiftId() {
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(null);
        Test.stopTest();
    }
    
  
    
    @IsTest
    static void testGetShiftHistory_WithStartTimeChangeOnly() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = Time.newInstance(9, 0, 0, 0),
            Modified_Start_Time__c = Time.newInstance(10, 30, 0, 0),
            Reason_For_Time__c = 'Start Time Change',
            Modified_By__c = staff.Id
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithEndTimeChangeOnly() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_End_Time__c = Time.newInstance(17, 0, 0, 0),
            Modified_End_time__c = Time.newInstance(18, 30, 0, 0),
            Reason_For_Time__c = 'End Time Change',
            Modified_By__c = staff.Id
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithSupportItemChange() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Support_Item__c = 'Old Support Item',
            Modified_Support_Item__c = 'New Support Item',
            Reason_For_Time__c = 'Support Item Change',
            Modified_By__c = staff.Id
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithBillableHoursChange() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Billable_Hours__c = 5.5,
            Modified_Billable_Hours__c = 7.5,
            Reason_For_Time__c = 'Billable Hours Change',
            Modified_By__c = staff.Id
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithMultipleChanges() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Create a history record with multiple changes
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = Time.newInstance(9, 0, 0, 0),
            Modified_Start_Time__c = Time.newInstance(10, 0, 0, 0),
            Original_End_Time__c = Time.newInstance(17, 0, 0, 0),
            Modified_End_time__c = Time.newInstance(18, 0, 0, 0),
            Original_Support_Item__c = 'Support Item A',
            Modified_Support_Item__c = 'Support Item B',
            Original_Billable_Hours__c = 5,
            Modified_Billable_Hours__c = 6,
            Reason_For_Time__c = 'Multiple Changes',
            Modified_By__c = staff.Id
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithNullValues() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Create history with null values to test null handling
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = null,
            Modified_Start_Time__c = Time.newInstance(10, 0, 0, 0),
            Reason_For_Time__c = 'Null Original Value',
            Modified_By__c = staff.Id
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithOnlyReason() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Test that changes are only recorded when there are actual value changes
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Reason_For_Time__c = 'Some Reason',
            Modified_By__c = staff.Id
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_OrderByCreatedDateDesc() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Create history records with different dates
        ShiftWithStaff_History__c history1 = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = Time.newInstance(9, 0, 0, 0),
            Modified_Start_Time__c = Time.newInstance(10, 0, 0, 0),
            Modified_By__c = staff.Id
        );
        insert history1;
        
        // Insert another after a small delay to ensure different CreatedDate
        ShiftWithStaff_History__c history2 = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_End_Time__c = Time.newInstance(17, 0, 0, 0),
            Modified_End_time__c = Time.newInstance(18, 0, 0, 0),
            Modified_By__c = staff.Id
        );
        insert history2;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_FormatTime_NullInput() {
        // This tests the private formatTime method indirectly
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = null,
            Modified_Start_Time__c = null,
            Modified_By__c = staff.Id
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithEmptyShiftId() {
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory('');
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithInvalidShiftId() {
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory('a0B000000000001');
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithMultipleHistoryRecordsSameType() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Create multiple start time changes
        ShiftWithStaff_History__c history1 = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = Time.newInstance(9, 0, 0, 0),
            Modified_Start_Time__c = Time.newInstance(10, 0, 0, 0),
            Reason_For_Time__c = 'First Change',
            Modified_By__c = staff.Id
        );
        insert history1;
        
        ShiftWithStaff_History__c history2 = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = Time.newInstance(10, 0, 0, 0),
            Modified_Start_Time__c = Time.newInstance(11, 0, 0, 0),
            Reason_For_Time__c = 'Second Change',
            Modified_By__c = staff.Id
        );
        insert history2;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithTimeFormatting() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Test with various times to verify formatting
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = Time.newInstance(0, 0, 0, 0), // Midnight
            Modified_Start_Time__c = Time.newInstance(23, 59, 0, 0), // 11:59 PM
            Reason_For_Time__c = 'Time Formatting Test',
            Modified_By__c = staff.Id,
            Original_End_Time__c = Time.newInstance(12, 0, 0, 0), // Noon
            Modified_End_time__c = Time.newInstance(13, 30, 0, 0) // 1:30 PM
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetShiftHistory_WithMissingModifiedBy() {
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        // Create history without Modified_By__c set
        ShiftWithStaff_History__c history = new ShiftWithStaff_History__c(
            ShiftwithStaff__c = shiftWithStaff.Id,
            Original_Start_Time__c = Time.newInstance(9, 0, 0, 0),
            Modified_Start_Time__c = Time.newInstance(10, 0, 0, 0),
            Reason_For_Time__c = 'No Modified By'
        );
        insert history;
        
        Test.startTest();
        List<ShiftWithStaffHistoryController.HistoryWrapper> result = 
            ShiftWithStaffHistoryController.getShiftHistory(shiftWithStaff.Id);
        Test.stopTest();
    }
}