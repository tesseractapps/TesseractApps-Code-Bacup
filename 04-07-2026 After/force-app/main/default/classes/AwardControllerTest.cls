@IsTest
public class AwardControllerTest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
    }
    
    private static User getRunningUser() {
        return [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND  Email= 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    @IsTest
    static void testGetAwards() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Award__c award = [SELECT Id FROM Award__c LIMIT 1];
            
            Test.startTest();
            AwardController.getAwards(staff.Id, org.Id);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetAwardsByOrg() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            
            Test.startTest();
            AwardController.getAwardsByOrg(org.Id);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetFacilityAwards() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            AwardController.getFacilityAwards(facility.Id);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testAddAwardToFacility() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            AwardController.addAwardToFacility(facility.Id, 'Test Award');
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testAddAwardToFacility_NullParameters() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            AwardController.addAwardToFacility(null, 'Test Award');
            AwardController.addAwardToFacility(facility.Id, '');
            AwardController.addAwardToFacility(facility.Id, null);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testAddAwardToFacility_Duplicate() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            AwardController.addAwardToFacility(facility.Id, 'Duplicate Award');
            AwardController.addAwardToFacility(facility.Id, 'Duplicate Award');
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testDeleteAwardFromFacility() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            AwardController.addAwardToFacility(facility.Id, 'Award To Delete');
            AwardController.deleteAwardFromFacility(facility.Id, 'Award To Delete');
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testDeleteAwardFromFacility_NullParameters() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            AwardController.deleteAwardFromFacility(null, 'Test Award');
            AwardController.deleteAwardFromFacility(facility.Id, '');
            AwardController.deleteAwardFromFacility(facility.Id, null);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testDeleteAwardFromFacility_EmptyAwards() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            AwardController.deleteAwardFromFacility(facility.Id, 'NonExistent Award');
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetStaffList() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            AwardController.getStaffList(org.Id, facility.Id);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetStaffListforRosterManager() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Date today = Date.today();
            String shiftDate = today.day() + '/' + today.month() + '/' + today.year();
            String endDate = today.day() + '/' + today.month() + '/' + today.year();
            
            Test.startTest();
            AwardController.getStaffListforRosterManager(
                org.Id,
                facility.Id,
                shiftDate,
                endDate,
                '9:00 AM',
                '5:00 PM',
                'Admin'
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetStaffListforRosterManager_Weekend() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Date saturday = Date.today().toStartOfWeek().addDays(5);
            String shiftDate = saturday.day() + '/' + saturday.month() + '/' + saturday.year();
            String endDate = saturday.day() + '/' + saturday.month() + '/' + saturday.year();
            
            Test.startTest();
            AwardController.getStaffListforRosterManager(
                org.Id,
                facility.Id,
                shiftDate,
                endDate,
                '9:00 AM',
                '5:00 PM',
                'Admin'
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetStaffListforRosterManager_WithLeave() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Date today = Date.today();
            String shiftDate = today.day() + '/' + today.month() + '/' + today.year();
            String endDate = today.day() + '/' + today.month() + '/' + today.year();
            
            Leave__c leave = new Leave__c(
                Staff__c = staff.Id,
                From__c = today,
                To__c = today.addDays(1),
                Status__c = 'Approved'
            );
            insert leave;
            
            Test.startTest();
            AwardController.getStaffListforRosterManager(
                org.Id,
                facility.Id,
                shiftDate,
                endDate,
                '9:00 AM',
                '5:00 PM',
                'Admin'
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetStaffListforRosterManager_WithOverlap() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Add_Shift__c addShift = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1];
            Date today = Date.today();
            String shiftDate = today.day() + '/' + today.month() + '/' + today.year();
            String endDate = today.day() + '/' + today.month() + '/' + today.year();
            
            ShiftwithStaff__c overlapShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Attendence__c = true,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Start_Date__c = today,
                Shift_End_Date__c = today,
                Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0),
                Shift_End_Time__c = Time.newInstance(12, 0, 0, 0),
                Shift_Rejected__c = false
            );
            insert overlapShift;
            
            Test.startTest();
            AwardController.getStaffListforRosterManager(
                org.Id,
                facility.Id,
                shiftDate,
                endDate,
                '9:00 AM',
                '11:00 AM',
                'Admin'
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetStaffListforRosterManager_WithRejectedShift() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Add_Shift__c addShift = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1];
            Date today = Date.today();
            String shiftDate = today.day() + '/' + today.month() + '/' + today.year();
            String endDate = today.day() + '/' + today.month() + '/' + today.year();
            
            ShiftwithStaff__c rejectedShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Attendence__c = false,
                Shift_Rejected__c = true,
                Role__c = 'Admin',
                Status__c = 'Unassigned',
                Start_Date__c = today,
                Shift_End_Date__c = today,
                Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0),
                Shift_End_Time__c = Time.newInstance(12, 0, 0, 0)
            );
            insert rejectedShift;
            
            Test.startTest();
            AwardController.getStaffListforRosterManager(
                org.Id,
                facility.Id,
                shiftDate,
                endDate,
                '9:00 AM',
                '11:00 AM',
                'Admin'
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetStaffListforRosterManager_WithAvailability() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Date today = Date.today();
            String shiftDate = today.day() + '/' + today.month() + '/' + today.year();
            String endDate = today.day() + '/' + today.month() + '/' + today.year();
            
            Availability__c av = new Availability__c(
                Staff__c = staff.Id,
                Start_Date__c = today,
                Start_Time__c = Time.newInstance(8, 0, 0, 0),
                End_Time__c = Time.newInstance(18, 0, 0, 0),
                Type__c = 'Unavailable'
            );
            insert av;
            
            Test.startTest();
            AwardController.getStaffListforRosterManager(
                org.Id,
                facility.Id,
                shiftDate,
                endDate,
                '9:00 AM',
                '5:00 PM',
                'Admin'
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testParseDateDMY() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            AwardController.parseDateDMY('18/08/2025');
            AwardController.parseDateDMY('2025-08-18');
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testParseDateDMY_InvalidFormat() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            try {
                AwardController.parseDateDMY('invalid-date');
            } catch (Exception e) {
                // Expected exception
            }
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testParseDateDMY_Blank() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            try {
                AwardController.parseDateDMY('');
            } catch (Exception e) {
                // Expected exception
            }
            try {
                AwardController.parseDateDMY(null);
            } catch (Exception e) {
                // Expected exception
            }
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testFormatHours() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            AwardController.formatHours(null);
            AwardController.formatHours(10);
            AwardController.formatHours(10.5);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetWeekStartDate() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Date testDate = Date.newInstance(2025, 8, 18);
            
            Test.startTest();
            AwardController.getWeekStartDate(testDate, 'Monday');
            AwardController.getWeekStartDate(testDate, 'Tuesday');
            AwardController.getWeekStartDate(testDate, 'Wednesday');
            AwardController.getWeekStartDate(testDate, 'Thursday');
            AwardController.getWeekStartDate(testDate, 'Friday');
            AwardController.getWeekStartDate(testDate, 'Saturday');
            AwardController.getWeekStartDate(testDate, 'Sunday');
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testCalculateWeeklyStaffHours() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Set<Id> staffIds = new Set<Id>{staff.Id};
            Date today = Date.today();
            
            Test.startTest();
            AwardController.calculateWeeklyStaffHours(staffIds, today);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testCalculateWeeklyStaffHours_Empty() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Set<Id> staffIds = new Set<Id>();
            Date today = Date.today();
            
            Test.startTest();
            AwardController.calculateWeeklyStaffHours(staffIds, today);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testStaffWrapper() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            AwardController.StaffWrapper wrapper = new AwardController.StaffWrapper();
            wrapper.Id = 'a03Bo00000a2QxzIAE';
            wrapper.Name = 'Test Staff';
            wrapper.DisplayName = 'Test Display';
            wrapper.ClassAndLevel = '1.1';
            wrapper.WeeklyHours = '20/40';
            Test.stopTest();
        }
    }
}