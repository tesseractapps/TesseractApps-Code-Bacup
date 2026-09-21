@isTest
public class RosterReplicationConflictControllerTest {
    
    @testSetup
    static void setup() {
        RosterCopyPasteHandlerTestData.createTestData();
    }
    
    // Helper methods - NO SOQL filters on non-filterable fields
    static User getTestUser() {
        return [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    static Staff__c getTestStaff() {
        return [SELECT Id, Restrict_Set_Hours__c, Set_Hours__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    static ShiftwithStaff__c getTestShift1() {
        Date d = Date.newInstance(2024, 10, 16);
        return [SELECT Id, Staff__c, Add_Shift__c, Start_Date__c, Shift_Start_Time__c, Shift_End_Time__c, Shift_End_Date__c, Role__c 
                FROM ShiftwithStaff__c 
                WHERE Staff__c != null 
                AND Start_Date__c = :d 
                LIMIT 1];
    }
    
    static ShiftwithStaff__c getTestShift2() {
        Date d = Date.newInstance(2024, 10, 17);
        return [SELECT Id, Staff__c, Add_Shift__c, Start_Date__c, Shift_Start_Time__c, Shift_End_Time__c, Shift_End_Date__c, Role__c 
                FROM ShiftwithStaff__c 
                WHERE Staff__c != null 
                AND Start_Date__c = :d 
                LIMIT 1];
    }
    
    static Services_and_Support_Plan__c getTestService() {
        return [SELECT Id, ShiftWithStaff__c, Funds_Tracker__c, Service_Type__c, Edited_Unit_Price__c, Qty__c 
                FROM Services_and_Support_Plan__c 
                WHERE ShiftWithStaff__c != null 
                LIMIT 1];
    }
    
    static Facility__c getTestFacility() {
        return [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    
    // =============================================
    // TEST 1: Happy Path
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_HappyPath() {
        User u = getTestUser();
        ShiftwithStaff__c shift1 = getTestShift1();
        ShiftwithStaff__c shift2 = getTestShift2();
        Services_and_Support_Plan__c service = getTestService();
        Facility__c fac = getTestFacility();
        
        List<Id> shiftIds = new List<Id>{shift1.Id, shift2.Id};
        List<Id> serviceIds = new List<Id>{service.Id};
        Date sourceStart = shift1.Start_Date__c;
        Date sourceEnd = shift2.Start_Date__c;
        Date destStart = sourceStart.addDays(7);
        Date destEnd = sourceEnd.addDays(7);
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, serviceIds, sourceStart, sourceEnd, destStart, destEnd, facilityIds
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 2: Empty Shift IDs (Fallback)
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_EmptyShiftIds() {
        User u = getTestUser();
        Facility__c fac = getTestFacility();
        Date sourceStart = Date.newInstance(2024, 10, 16);
        Date sourceEnd = Date.newInstance(2024, 10, 24);
        Date destStart = sourceStart.addDays(7);
        Date destEnd = sourceEnd.addDays(7);
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    new List<Id>(), new List<Id>(), sourceStart, sourceEnd, destStart, destEnd, facilityIds
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 3: Null Inputs
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_NullInputs() {
        User u = getTestUser();
        ShiftwithStaff__c shift1 = getTestShift1();
        Facility__c fac = getTestFacility();
        
        List<Id> shiftIds = new List<Id>{shift1.Id};
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            
            List<RosterReplicationConflictController.ShiftConflictWrapper> result1 = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), null, Date.newInstance(2024, 10, 24), 
                    Date.newInstance(2024, 10, 30), Date.newInstance(2024, 11, 05), facilityIds
                );
            
            List<RosterReplicationConflictController.ShiftConflictWrapper> result2 = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), Date.newInstance(2024, 10, 16), Date.newInstance(2024, 10, 24), 
                    null, Date.newInstance(2024, 11, 05), facilityIds
                );
            
            List<RosterReplicationConflictController.ShiftConflictWrapper> result3 = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), Date.newInstance(2024, 10, 16), Date.newInstance(2024, 10, 24), 
                    Date.newInstance(2024, 10, 30), null, facilityIds
                );
            
            List<RosterReplicationConflictController.ShiftConflictWrapper> result4 = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), Date.newInstance(2024, 10, 16), Date.newInstance(2024, 10, 24), 
                    Date.newInstance(2024, 10, 30), Date.newInstance(2024, 11, 05), null
                );
                
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 4: No Services
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_NoServices() {
        User u = getTestUser();
        ShiftwithStaff__c shift1 = getTestShift1();
        Facility__c fac = getTestFacility();
        
        List<Id> shiftIds = new List<Id>{shift1.Id};
        Date sourceStart = shift1.Start_Date__c;
        Date sourceEnd = shift1.Start_Date__c.addDays(1);
        Date destStart = sourceStart.addDays(7);
        Date destEnd = sourceEnd.addDays(7);
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), sourceStart, sourceEnd, destStart, destEnd, facilityIds
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 5: Overlap Conflict
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_OverlapConflict() {
        User u = getTestUser();
        ShiftwithStaff__c shift1 = getTestShift1();
        ShiftwithStaff__c shift2 = getTestShift2();
        Services_and_Support_Plan__c service = getTestService();
        Facility__c fac = getTestFacility();
        
        List<Id> shiftIds = new List<Id>{shift1.Id, shift2.Id};
        List<Id> serviceIds = new List<Id>{service.Id};
        
        // Create overlapping destination shift
        ShiftwithStaff__c destOverlap = new ShiftwithStaff__c();
        destOverlap.Add_Shift__c = shift1.Add_Shift__c;
        destOverlap.Staff__c = shift1.Staff__c;
        destOverlap.Role__c = 'Admin';
        destOverlap.Status__c = 'Draft';
        destOverlap.Attendence__c = false;
        destOverlap.Start_Date__c = shift1.Start_Date__c.addDays(7);
        destOverlap.Shift_Start_Time__c = shift1.Shift_Start_Time__c;
        destOverlap.Shift_End_Date__c = shift1.Shift_End_Date__c != null ? shift1.Shift_End_Date__c.addDays(7) : shift1.Start_Date__c.addDays(7);
        destOverlap.Shift_End_Time__c = shift1.Shift_End_Time__c;
        destOverlap.Shift_Day_Name__c = 'Monday';
        insert destOverlap;
        
        Date sourceStart = shift1.Start_Date__c;
        Date sourceEnd = shift2.Start_Date__c;
        Date destStart = sourceStart.addDays(7);
        Date destEnd = sourceEnd.addDays(7);
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, serviceIds, sourceStart, sourceEnd, destStart, destEnd, facilityIds
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 6: No Source Shifts Found
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_NoSourceShifts() {
        User u = getTestUser();
        Facility__c fac = getTestFacility();
        
        // Use a dummy ID that doesn't exist
        List<Id> shiftIds = new List<Id>();
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), 
                    Date.newInstance(2024, 10, 16), Date.newInstance(2024, 10, 24), 
                    Date.newInstance(2024, 10, 30), Date.newInstance(2024, 11, 05), facilityIds
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 7: Null Staff
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_NullStaff() {
        User u = getTestUser();
        ShiftwithStaff__c shift1 = getTestShift1();
        Facility__c fac = getTestFacility();
        
        // Create a shift with null staff
        ShiftwithStaff__c nullStaffShift = new ShiftwithStaff__c();
        nullStaffShift.Add_Shift__c = shift1.Add_Shift__c;
        nullStaffShift.Role__c = 'Admin';
        nullStaffShift.Status__c = 'Draft';
        nullStaffShift.Attendence__c = false;
        nullStaffShift.Start_Date__c = shift1.Start_Date__c;
        nullStaffShift.Shift_Start_Time__c = shift1.Shift_Start_Time__c;
        nullStaffShift.Shift_End_Date__c = shift1.Shift_End_Date__c != null ? shift1.Shift_End_Date__c : shift1.Start_Date__c;
        nullStaffShift.Shift_End_Time__c = shift1.Shift_End_Time__c;
        insert nullStaffShift;
        
        List<Id> shiftIds = new List<Id>{nullStaffShift.Id};
        Date sourceStart = shift1.Start_Date__c;
        Date sourceEnd = shift1.Start_Date__c.addDays(1);
        Date destStart = sourceStart.addDays(7);
        Date destEnd = sourceEnd.addDays(7);
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), sourceStart, sourceEnd, destStart, destEnd, facilityIds
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 8: Weekend Shift
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_WeekendShift() {
        User u = getTestUser();
        ShiftwithStaff__c shift1 = getTestShift1();
        Facility__c fac = getTestFacility();
        
        // Create a shift on a weekend (Saturday = 2024-10-19)
        ShiftwithStaff__c weekendShift = new ShiftwithStaff__c();
        weekendShift.Add_Shift__c = shift1.Add_Shift__c;
        weekendShift.Staff__c = shift1.Staff__c;
        weekendShift.Role__c = 'Admin';
        weekendShift.Status__c = 'Draft';
        weekendShift.Attendence__c = false;
        weekendShift.Start_Date__c = Date.newInstance(2024, 10, 19); // Saturday
        weekendShift.Shift_Start_Time__c = shift1.Shift_Start_Time__c;
        weekendShift.Shift_End_Date__c = Date.newInstance(2024, 10, 19);
        weekendShift.Shift_End_Time__c = shift1.Shift_End_Time__c;
        insert weekendShift;
        
        List<Id> shiftIds = new List<Id>{weekendShift.Id};
        Date sourceStart = weekendShift.Start_Date__c;
        Date sourceEnd = weekendShift.Start_Date__c;
        Date destStart = sourceStart.addDays(7); // Also Saturday
        Date destEnd = sourceEnd.addDays(7);
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), sourceStart, sourceEnd, destStart, destEnd, facilityIds
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 9: Night Shift
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_NightShift() {
        User u = getTestUser();
        ShiftwithStaff__c shift1 = getTestShift1();
        Facility__c fac = getTestFacility();
        
        // Create night shift (late evening to early morning)
        ShiftwithStaff__c nightShift = new ShiftwithStaff__c();
        nightShift.Add_Shift__c = shift1.Add_Shift__c;
        nightShift.Staff__c = shift1.Staff__c;
        nightShift.Role__c = 'Admin';
        nightShift.Status__c = 'Draft';
        nightShift.Attendence__c = false;
        nightShift.Start_Date__c = Date.newInstance(2024, 10, 20); 
        nightShift.Shift_Start_Time__c = Time.newInstance(22, 0, 0, 0);
        nightShift.Shift_End_Date__c = Date.newInstance(2024, 10, 21);
        nightShift.Shift_End_Time__c = Time.newInstance(6, 0, 0, 0);
        insert nightShift;
        
        List<Id> shiftIds = new List<Id>{nightShift.Id};
        Date sourceStart = nightShift.Start_Date__c;
        Date sourceEnd = nightShift.Shift_End_Date__c;
        Date destStart = sourceStart.addDays(7);
        Date destEnd = sourceEnd.addDays(7);
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), sourceStart, sourceEnd, destStart, destEnd, facilityIds
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 10: Set Hours Restriction
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_SetHoursRestriction() {
        User u = getTestUser();
        ShiftwithStaff__c shift1 = getTestShift1();
        Facility__c fac = getTestFacility();
        Staff__c staff = getTestStaff();
        
        // Update staff to have Restrict_Set_Hours = true and lower Set_Hours
        staff.Restrict_Set_Hours__c = true;
        staff.Set_Hours__c = 2; // Low set hours to trigger conflict
        update staff;
        
        List<Id> shiftIds = new List<Id>{shift1.Id};
        Date sourceStart = shift1.Start_Date__c;
        Date sourceEnd = shift1.Start_Date__c.addDays(1);
        Date destStart = sourceStart.addDays(7);
        Date destEnd = sourceEnd.addDays(7);
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), sourceStart, sourceEnd, destStart, destEnd, facilityIds
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 11: Expired Document
    // =============================================
    @isTest
    static void test_validateRosterTemplateReplication_ExpiredDocument() {
        User u = getTestUser();
        ShiftwithStaff__c shift1 = getTestShift1();
        Facility__c fac = getTestFacility();
        Staff__c staff = getTestStaff();
        
        // Create expired document for staff
        Child_Staff__c expiredDoc = new Child_Staff__c();
        expiredDoc.Staff__c = staff.Id;
        expiredDoc.Document_Type__c = 'Visa Status';
        expiredDoc.Expiry_Date__c = Date.today().addDays(-1); // Expired
        expiredDoc.Compliance__c = true;
        expiredDoc.Status__c = 'Approved';
        expiredDoc.Is_Archived__c = false;
        insert expiredDoc;
        
        List<Id> shiftIds = new List<Id>{shift1.Id};
        Date sourceStart = shift1.Start_Date__c;
        Date sourceEnd = shift1.Start_Date__c.addDays(1);
        Date destStart = sourceStart.addDays(7);
        Date destEnd = sourceEnd.addDays(7);
        List<String> facilityIds = new List<String>{fac.Id};
        
        System.runAs(u) {
            Test.startTest();
            List<RosterReplicationConflictController.ShiftConflictWrapper> result = 
                RosterReplicationConflictController.validateRosterTemplateReplication(
                    shiftIds, new List<Id>(), sourceStart, sourceEnd, destStart, destEnd, facilityIds
                );
            Test.stopTest();
        }
    }
}