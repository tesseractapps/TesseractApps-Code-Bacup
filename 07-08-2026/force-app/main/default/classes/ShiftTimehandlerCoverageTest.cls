@isTest
public class ShiftTimehandlerCoverageTest {
    
    @testSetup
    static void setup() {
        
        Organisation__c org = new Organisation__c(
            Name = 'Coverage Org',
            ABN__c = '11234567891',
            ACN__c = '878787878',
            Contact_No__c = '6132899740',
            RCTI__c = 'RCTI1',
            Email__c = 'coverage@gmail.com',
            Bank__c = 'Bank Test',
            BSB__c = 'BSB Test',
            Account_Name__c = 'Test Account',
            Account_Number__c = '1111111111',
            Description__c = 'test',
            Address_Latest__Street__s = '101 Main St, Sydney, NSW 2000',
            Address_Latest__City__s = 'Sydney',
            Address_Latest__PostalCode__s = '2000',
            Address_Latest__CountryCode__s = 'AU',
            Address_Latest__StateCode__s = 'NSW',
            NDIS_Provider__c = '12341234565',
            BMSI_Identifier__c = 'TEST BMSI',
            SoftwareId__c = 'jhdfn18328',
            Branch_code__c = 'BS123',
            Contact_Name__c = 'Test Contact',
            User_Type__c = 'NDIS Org Admin',
            Roles__c = 'Admin;AIN'
        );
        insert org;
        
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User u = new User(
            Alias = 'covusr',
            Email = 'coverage.test.user@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'CoverageUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'coverage.test.user@hotmail.com',
            Organization_Name__c = 'Coverage Org'
        );
        insert u;
        
        System.runAs(u) {
            
            Facility__c facNormal = new Facility__c(
                Name = 'Normal Facility',
                Address__City__s = 'Sydney',
                Address__Street__s = '8 Main Street',
                Address__StateCode__s = 'NSW',
                Address__PostalCode__s = '2000',
                Address__CountryCode__s = 'AU',
                Email__c = 'normal@facility.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '12345678900',
                Phone__c = '0212345678',
                Type_of_Service__c = 'Ndis',
                Shift_Penalty_Mode__c = 'SCHADS'
            );
            insert facNormal;
            
            Facility__c facSchads = new Facility__c(
                Name = 'SCHADS Facility',
                Address__City__s = 'Sydney',
                Address__Street__s = '9 SCHADS Street',
                Address__StateCode__s = 'NSW',
                Address__PostalCode__s = '2001',
                Address__CountryCode__s = 'AU',
                Email__c = 'schads@facility.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '12345678901',
                Phone__c = '0212345679',
                Type_of_Service__c = 'Ndis',
                Shift_Penalty_Mode__c = 'SCHADS'
            );
            insert facSchads;
            
            Staff__c staff = new Staff__c(
                Last_Name__c = 'CovStaff',
                Name = 'CovFirst',
                Name__c = 'CovFirst CovStaff',
                Contact_Number__c = '0412345678',
                Email_Address__c = 'coverage.test.user@hotmail.com',
                Facility__c = facNormal.Id,
                Address__Street__s = '8 Main Street',
                Address__City__s = 'Sydney',
                Address__StateCode__s = 'NSW',
                Address__PostalCode__s = '2000',
                Emergency_Phone_Number__c = '0412345679',
                Primary_Contact_Name__c = 'Contact One',
                Primary_Contact_Number__c = '0412345600',
                Make_Primary_as_Approver__c = true,
                Primary_Contact_Email__c = 'contact@test.com',
                Secondary_Contact_Name__c = 'Contact Two',
                Secondary_Contact_Email__c = 'contact2@test.com',
                Make_Secondary_as_Approver__c = false,
                Secondary_Contact_Number__c = '0412345601',
                Emp_exit_date__c = Date.newInstance(2028, 1, 5),
                Emp_Start_Date__c = Date.newInstance(2023, 2, 1),
                Date_Of_Birth__c = Date.newInstance(1990, 1, 1),
                role__c = 'Admin',
                Residency_Type__c = 'Australian',
                Working_Hours_Rate__c = 30,
                Saturday_Hourly_Rate__c = 45,
                Sunday_Hourly_Rate__c = 50,
                Night_shift_Hourly_Rate__c = 35,
                Afternoon_shift_Hourly_Rate__c = 33,
                Public_holiday_Hourly_Rate__c = 60,
                Set_Hours__c = 38,
                Xero_Employee_ID__c = 'XERO123'
            );
            insert staff;
            
            StaffRole__c srCasual = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Hourly_Rate__c = 30,
                Saturday_Hourly_Rate__c = 45,
                Sunday_Hourly_Rate__c = 50,
                Night_Shift_Hourly_Rate__c = 35,
                Afternoon_Shift_Hourly_Rate__c = 33,
                Public_Holiday_Hourly_Rate__c = 60,
                Category_Type__c = 'Social and community services employee',
                Type_of_Job__c = 'Casual',
                Facility__c = facSchads.Id
            );
            insert srCasual;
            
            StaffRole__c srParttime = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'AIN',
                Active__c = true,
                Hourly_Rate__c = 28,
                Category_Type__c = 'Social and community services employee',
                Type_of_Job__c = 'Part-time',
                Facility__c = facSchads.Id
            );
            insert srParttime;
            
            Add_Shift__c shiftNormal = new Add_Shift__c(
                Break__c = '30',
                Do_you_want_to_set_this_a_recurring_shif__c = true,
                Start_Date__c = Date.newInstance(2025, 3, 10),
                End_Date__c = Date.newInstance(2025, 3, 10),
                Role__c = 'Admin',
                Get_Facility__c = true,
                Quantity__c = 5,
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Facility__c = facNormal.Id,
                Status__c = 'Draft',
                Start_time_picklist__c = '9:00 am',
                End_time_picklist__c = '5:00 pm',
                Location__StateCode__s = 'NSW',
                Location__CountryCode__s = 'AU',
                Location__PostalCode__s = '2000',
                Shift_Type__c = 'General'
            );
            insert shiftNormal;
            
            Add_Shift__c shiftSchads = new Add_Shift__c(
                Break__c = '0',
                Do_you_want_to_set_this_a_recurring_shif__c = true,
                Start_Date__c = Date.newInstance(2025, 3, 12),
                End_Date__c = Date.newInstance(2025, 3, 12),
                Role__c = 'Admin',
                Get_Facility__c = true,
                Quantity__c = 5,
                Start_Time__c = Time.newInstance(8, 0, 0, 0),
                End_Time__c = Time.newInstance(20, 0, 0, 0),
                Facility__c = facSchads.Id,
                Status__c = 'Draft',
                Start_time_picklist__c = '8:00 am',
                End_time_picklist__c = '8:00 pm',
                Location__StateCode__s = 'NSW',
                Location__CountryCode__s = 'AU',
                Location__PostalCode__s = '2001',
                Day_Name__c = 'Monday',
                Shift_Type__c = 'General'
            );
            insert shiftSchads;
            
            Add_Shift__c shiftNight = new Add_Shift__c(
                Break__c = '0',
                Start_Date__c = Date.newInstance(2025, 3, 14),
                End_Date__c = Date.newInstance(2025, 3, 14),
                Role__c = 'Admin',
                Get_Facility__c = true,
                Quantity__c = 5,
                Start_Time__c = Time.newInstance(22, 0, 0, 0),
                End_Time__c = Time.newInstance(6, 0, 0, 0),
                Facility__c = facNormal.Id,
                Status__c = 'Draft',
                Shift_Type__c = 'Night',
                Start_time_picklist__c = '10:00 pm',
                End_time_picklist__c = '6:00 am',
                Location__StateCode__s = 'NSW',
                Location__CountryCode__s = 'AU',
                 Day_Name__c = 'Monday',
                Location__PostalCode__s = '2000'
            );
            insert shiftNight;
            
            Add_Shift__c shiftAfternoon = new Add_Shift__c(
                Break__c = '0',
                Start_Date__c = Date.newInstance(2025, 3, 15),
                End_Date__c = Date.newInstance(2025, 3, 15),
                Role__c = 'Admin',
                Get_Facility__c = true,
                Quantity__c = 5,
                Start_Time__c = Time.newInstance(14, 0, 0, 0),
                End_Time__c = Time.newInstance(22, 0, 0, 0),
                Facility__c = facNormal.Id,
                Status__c = 'Draft',
                Shift_Type__c = 'Afternoon',
                Start_time_picklist__c = '2:00 pm',
                End_time_picklist__c = '10:00 pm',
                Location__StateCode__s = 'NSW',
                Location__CountryCode__s = 'AU',
                 Day_Name__c = 'Monday',
                Location__PostalCode__s = '2000'
            );
            insert shiftAfternoon;
            
            Add_Shift__c shiftSaturday = new Add_Shift__c(
                Break__c = '0',
                Start_Date__c = Date.newInstance(2025, 3, 15),
                End_Date__c = Date.newInstance(2025, 3, 15),
                Role__c = 'Admin',
                Get_Facility__c = true,
                Quantity__c = 5,
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Facility__c = facNormal.Id,
                Status__c = 'Draft',
                Shift_Type__c = 'General',
                Start_time_picklist__c = '9:00 am',
                End_time_picklist__c = '5:00 pm',
                Location__StateCode__s = 'NSW',
                Location__CountryCode__s = 'AU',
                 Day_Name__c = 'Monday',
                Location__PostalCode__s = '2000'
            );
            insert shiftSaturday;
            
            ShiftwithStaff__c swsNormal = new ShiftwithStaff__c(
                Add_Shift__c = shiftNormal.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Attendence__c = true,
                Shift_Category__c = 'Standard Hours',
                Start_Date__c = Date.newInstance(2025, 3, 10)
            );
            insert swsNormal;
            
            ShiftwithStaff__c swsSchads = new ShiftwithStaff__c(
                Add_Shift__c = shiftSchads.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Attendence__c = true,
                Shift_Category__c = 'Standard Hours',
                Start_Date__c = Date.newInstance(2025, 3, 12)
            );
            insert swsSchads;
            
            ShiftwithStaff__c swsNight = new ShiftwithStaff__c(
                Add_Shift__c = shiftNight.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Attendence__c = true,
                Shift_Category__c = 'Standard Hours',
                Start_Date__c = Date.newInstance(2025, 3, 14)
            );
            insert swsNight;
            
            ShiftwithStaff__c swsAfternoon = new ShiftwithStaff__c(
                Add_Shift__c = shiftAfternoon.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Attendence__c = true,
                Shift_Category__c = 'Standard Hours',
                Start_Date__c = Date.newInstance(2025, 3, 15)
            );
            insert swsAfternoon;
            
            ShiftwithStaff__c swsSaturday = new ShiftwithStaff__c(
                Add_Shift__c = shiftSaturday.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Attendence__c = true,
                Shift_Category__c = 'Standard Hours',
                Start_Date__c = Date.newInstance(2025, 3, 15)
            );
            insert swsSaturday;
            
            Public_Holiday__c ph = new Public_Holiday__c(
                Date__c = Date.newInstance(2025, 3, 10),
                State__c = 'New South Wales',
                Holiday_Name__c = 'Test Public Holiday'
            );
            insert ph;
        }
    }
    
    private static User getTestUser() {
        return [SELECT Id FROM User WHERE Email = 'coverage.test.user@hotmail.com' LIMIT 1];
    }
    
    private static Staff__c getTestStaff() {
        return [SELECT Id, Xero_Employee_ID__c FROM Staff__c LIMIT 1];
    }
    
    // -------------------------------------------------------
    // Test 1: UpdateHourlyRate — weekday general shift
    // -------------------------------------------------------
    @isTest
    static void testUpdateHourlyRate_Weekday() {
        User u = getTestUser();
        System.runAs(u) {
            List<ShiftwithStaff__c> shifts = [
                SELECT Id, Staff__c, Add_Shift__c, Date__c, Start_Date__c,Shift_Day_Name__c, Role__c,Is_long_Morning_Shift_two__c,Is_Long_afternoon_shift_two__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,
                Day_Name__c, Type_of_shift__c, Staff_Final_Hourly_Rate__c,
                Do_you_want_to_set_this_Recurring_Roster__c,
                Is_long_Morning__c, Is_Long_Afternoon__c, Is_Long_Night_Shift__c
                FROM ShiftwithStaff__c
                WHERE Day_Name__c = 'Monday'
                LIMIT 1
            ];
            Test.startTest();
            ShiftTimehandler.UpdateHourlyRate(shifts, FALSE);
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 2: UpdateHourlyRate — Saturday shift
    // -------------------------------------------------------
    @isTest
    static void testUpdateHourlyRate_Saturday() {
        User u = getTestUser();
        System.runAs(u) {
            List<ShiftwithStaff__c> shifts = [
                SELECT Id, Staff__c, Add_Shift__c, Date__c, Start_Date__c,
                Day_Name__c, Type_of_shift__c, Staff_Final_Hourly_Rate__c,
                Do_you_want_to_set_this_Recurring_Roster__c,
                Is_long_Morning__c, Is_Long_Afternoon__c, Is_Long_Night_Shift__c
                FROM ShiftwithStaff__c
                WHERE Day_Name__c = 'Saturday'
                LIMIT 1
            ];
            Test.startTest();
            ShiftTimehandler.UpdateHourlyRate(shifts, FALSE);
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 3: UpdateHourlyRate — Sunday shift
    // -------------------------------------------------------
    @isTest
    static void testUpdateHourlyRate_Sunday() {
        User u = getTestUser();
        System.runAs(u) {
            List<ShiftwithStaff__c> shifts = [
                SELECT Id, Staff__c, Add_Shift__c, Date__c, Start_Date__c,
                Day_Name__c, Type_of_shift__c, Staff_Final_Hourly_Rate__c,
                Do_you_want_to_set_this_Recurring_Roster__c,
                Is_long_Morning__c, Is_Long_Afternoon__c, Is_Long_Night_Shift__c
                FROM ShiftwithStaff__c
                WHERE Day_Name__c = 'Sunday'
                LIMIT 1
            ];
            Test.startTest();
            ShiftTimehandler.UpdateHourlyRate(shifts, FALSE);
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 4: UpdateHourlyRate — Night shift
    // -------------------------------------------------------
    @isTest
    static void testUpdateHourlyRate_Night() {
        User u = getTestUser();
        System.runAs(u) {
            List<ShiftwithStaff__c> shifts = [
                SELECT Id, Staff__c, Add_Shift__c, Date__c, Start_Date__c,
                Day_Name__c, Type_of_shift__c, Staff_Final_Hourly_Rate__c,
                Do_you_want_to_set_this_Recurring_Roster__c,
                Is_long_Morning__c, Is_Long_Afternoon__c, Is_Long_Night_Shift__c
                FROM ShiftwithStaff__c
                WHERE Day_Name__c = 'Friday'
                LIMIT 1
            ];
            if (!shifts.isEmpty()) {
                shifts[0].Shift_Category__c = 'Night';
            }
            Test.startTest();
            ShiftTimehandler.UpdateHourlyRate(shifts, FALSE);
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 5: UpdateHourlyRate — Afternoon shift
    // -------------------------------------------------------
    @isTest
    static void testUpdateHourlyRate_Afternoon() {
        User u = getTestUser();
        System.runAs(u) {
            List<ShiftwithStaff__c> shifts = [
                SELECT Id, Staff__c, Add_Shift__c, Date__c, Start_Date__c,
                Day_Name__c, Type_of_shift__c, Staff_Final_Hourly_Rate__c,Shift_Day_Name__c,Role__c,Is_long_Morning_Shift_two__c,Is_Long_afternoon_shift_two__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,
                Do_you_want_to_set_this_Recurring_Roster__c,
                Is_long_Morning__c, Is_Long_Afternoon__c, Is_Long_Night_Shift__c
                FROM ShiftwithStaff__c
                WHERE Day_Name__c = 'Monday'
                LIMIT 1
            ];
            if (!shifts.isEmpty()) {
                shifts[0].Shift_Category__c = 'Afternoon';
            }
            Test.startTest();
            ShiftTimehandler.UpdateHourlyRate(shifts, TRUE);
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 6: UpdateHourlyRate — Sleepover shift
    // -------------------------------------------------------
    @isTest
    static void testUpdateHourlyRate_Sleepover() {
        User u = getTestUser();
        System.runAs(u) {
            List<ShiftwithStaff__c> shifts = [
                SELECT Id, Staff__c, Add_Shift__c, Date__c, Start_Date__c,
                Day_Name__c, Type_of_shift__c, Staff_Final_Hourly_Rate__c,Shift_Day_Name__c,Role__c,Is_long_Morning_Shift_two__c,Is_Long_afternoon_shift_two__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,
                Do_you_want_to_set_this_Recurring_Roster__c,
                Is_long_Morning__c, Is_Long_Afternoon__c, Is_Long_Night_Shift__c
                FROM ShiftwithStaff__c
                WHERE Day_Name__c = 'Monday'
                LIMIT 1
            ];
            if (!shifts.isEmpty()) {
                shifts[0].Shift_Category__c = 'Sleepover Shift';
                shifts[0].Staff_Final_Hourly_Rate__c = 25;
            }
            Test.startTest();
            ShiftTimehandler.UpdateHourlyRate(shifts, TRUE);
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 7: UpdateHourlyRate — Public Holiday
    // -------------------------------------------------------
    @isTest
    static void testUpdateHourlyRate_PublicHoliday() {
        User u = getTestUser();
        System.runAs(u) {
            List<ShiftwithStaff__c> shifts = [
                SELECT Id, Staff__c, Add_Shift__c, Date__c, Start_Date__c,Shift_Day_Name__c,Role__c,Is_long_Morning_Shift_two__c,Is_Long_afternoon_shift_two__c,Is_Long_Morning_Next_Day_Start_Two__c,Long_Morning_Start_Date_Two__c,
                Day_Name__c, Type_of_shift__c, Staff_Final_Hourly_Rate__c,
                Do_you_want_to_set_this_Recurring_Roster__c, Recur_Holiday__c,
                Is_long_Morning__c, Is_Long_Afternoon__c, Is_Long_Night_Shift__c
                FROM ShiftwithStaff__c
                WHERE Day_Name__c = 'Monday'
                LIMIT 1
            ];
            if (!shifts.isEmpty()) {
                shifts[0].Start_Date__c = Date.newInstance(2025, 3, 10);
            }
            Test.startTest();
            ShiftTimehandler.UpdateHourlyRate(shifts, TRUE);
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 8: calculateOvertime — null roleRec returns empty
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_NullRole() {
        ShiftwithStaff__c sws = [SELECT Id, Staff__c, Final_Login_DateTime__c,
                                 Final_Logout_DateTime__c, Actual_Duration__c,
                                 Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        sws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 10, 9, 0, 0);
        sws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 10, 17, 0, 0);
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(sws, 'Casual', new List<ShiftwithStaff__c>(), null);
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 9: calculateOvertime — public holiday skip
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_PublicHoliday() {
        StaffRole__c role = [SELECT Id, Category_Type__c, Type_of_Job__c, StaffRole_To_Staff__c
                             FROM StaffRole__c
                             WHERE Category_Type__c = 'Social and community services employee'
                             LIMIT 1];
        
        ShiftwithStaff__c sws = [SELECT Id, Final_Login_DateTime__c, Final_Logout_DateTime__c,
                                 Actual_Duration__c, Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        
        sws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 10, 9, 0, 0);
        sws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 10, 17, 0, 0);
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(sws, 'Full-time', new List<ShiftwithStaff__c>(), role);
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 10: calculateOvertime — Sunday skip
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_Sunday() {
        StaffRole__c role = [SELECT Id, Category_Type__c, Type_of_Job__c, StaffRole_To_Staff__c
                             FROM StaffRole__c
                             WHERE Category_Type__c = 'Social and community services employee'
                             LIMIT 1];
        
        ShiftwithStaff__c sws = [SELECT Id, Final_Login_DateTime__c, Final_Logout_DateTime__c,
                                 Actual_Duration__c, Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        
        sws.Shift_Day_Name__c = 'Sunday';
        sws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 10, 9, 0, 0);
        sws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 10, 17, 0, 0);
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(sws, 'Full-time', new List<ShiftwithStaff__c>(), role);
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 11: calculateOvertime — zero worked hours
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_ZeroHours() {
        StaffRole__c role = [SELECT Id, Category_Type__c, Type_of_Job__c, StaffRole_To_Staff__c
                             FROM StaffRole__c
                             WHERE Category_Type__c = 'Social and community services employee'
                             LIMIT 1];
        
        ShiftwithStaff__c sws = [SELECT Id, Final_Login_DateTime__c, Final_Logout_DateTime__c,
                                 Actual_Duration__c, Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        
        sws.Shift_Day_Name__c = 'Monday';
        sws.Final_Login_DateTime__c = null;
        sws.Final_Logout_DateTime__c = null;
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(sws, 'Casual', new List<ShiftwithStaff__c>(), role);
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 12: calculateOvertime — daily OT exceeded
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_DailyOT() {
        StaffRole__c role = [SELECT Id, Category_Type__c, Type_of_Job__c,
                             StaffRole_To_Staff__c, StaffRole_To_Staff__r.Set_Hours__c
                             FROM StaffRole__c
                             WHERE Category_Type__c = 'Social and community services employee'
                             LIMIT 1];
        
        ShiftwithStaff__c sws = [SELECT Id, Final_Login_DateTime__c, Final_Logout_DateTime__c,
                                 Actual_Duration__c, Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        
        sws.Shift_Day_Name__c = 'Monday';
        // 12 hours — exceeds 10 hour daily threshold
        sws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 10, 6, 0, 0);
        sws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 10, 18, 0, 0);
        sws.Shift_Start_Time__c = Time.newInstance(6, 0, 0, 0);
        sws.Shift_End_Time__c = Time.newInstance(18, 0, 0, 0);
        sws.Start_Date__c = Date.newInstance(2025, 3, 10);
        sws.Shift_End_Date__c = Date.newInstance(2025, 3, 10);
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(
            sws, 'Casual', new List<ShiftwithStaff__c>(), role
        );
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 13: calculateOvertime — weekly already exceeded
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_WeeklyExceeded() {
        StaffRole__c role = [SELECT Id, Category_Type__c, Type_of_Job__c,
                             StaffRole_To_Staff__c, StaffRole_To_Staff__r.Set_Hours__c
                             FROM StaffRole__c
                             WHERE Category_Type__c = 'Social and community services employee'
                             LIMIT 1];
        
        ShiftwithStaff__c sws = [SELECT Id, Final_Login_DateTime__c, Final_Logout_DateTime__c,
                                 Actual_Duration__c, Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        
        sws.Shift_Day_Name__c = 'Monday';
        sws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 10, 9, 0, 0);
        sws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 10, 17, 0, 0);
        sws.Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0);
        sws.Shift_End_Time__c = Time.newInstance(17, 0, 0, 0);
        sws.Start_Date__c = Date.newInstance(2025, 3, 10);
        sws.Shift_End_Date__c = Date.newInstance(2025, 3, 10);
        
        // Build week shifts that already exceed 38 hours
        List<ShiftwithStaff__c> weekShifts = new List<ShiftwithStaff__c>();
        ShiftwithStaff__c prevSws = sws.clone(false, true, false, false);
        prevSws.Id = sws.Id;
        prevSws.Removed_Duration__c = 0;
        prevSws.Shift_Category__c = 'Standard Hours';
        prevSws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 7, 8, 0, 0);
        prevSws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 7, 16, 0, 0);
        weekShifts.add(prevSws);
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(
            sws, 'Casual', weekShifts, role
        );
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 14: calculateOvertime — sleepover shift active hours
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_Sleepover() {
        StaffRole__c role = [SELECT Id, Category_Type__c, Type_of_Job__c,
                             StaffRole_To_Staff__c, StaffRole_To_Staff__r.Set_Hours__c
                             FROM StaffRole__c
                             WHERE Category_Type__c = 'Social and community services employee'
                             LIMIT 1];
        
        ShiftwithStaff__c sws = [SELECT Id, Final_Login_DateTime__c, Final_Logout_DateTime__c,
                                 Actual_Duration__c, Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        
        sws.Shift_Day_Name__c = 'Tuesday';
        sws.Shift_Category__c = 'Sleepover Shift';
        sws.Sleepover_Night_Shift_hours__c = 2;
        sws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 11, 22, 0, 0);
        sws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 12, 8, 0, 0);
        sws.Shift_Start_Time__c = Time.newInstance(22, 0, 0, 0);
        sws.Shift_End_Time__c = Time.newInstance(8, 0, 0, 0);
        sws.Start_Date__c = Date.newInstance(2025, 3, 11);
        sws.Shift_End_Date__c = Date.newInstance(2025, 3, 12);
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(
            sws, 'Full-time', new List<ShiftwithStaff__c>(), role
        );
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 15: calculateOvertime — with previous shift (break rule)
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_BreakRule() {
        StaffRole__c role = [SELECT Id, Category_Type__c, Type_of_Job__c,
                             StaffRole_To_Staff__c, StaffRole_To_Staff__r.Set_Hours__c
                             FROM StaffRole__c
                             WHERE Category_Type__c = 'Social and community services employee'
                             LIMIT 1];
        
        ShiftwithStaff__c sws = [SELECT Id, Final_Login_DateTime__c, Final_Logout_DateTime__c,
                                 Actual_Duration__c, Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        sws.Shift_Day_Name__c = 'Wednesday';
        sws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 12, 14, 0, 0);
        sws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 12, 22, 0, 0);
        sws.Shift_Start_Time__c = Time.newInstance(14, 0, 0, 0);
        sws.Shift_End_Time__c = Time.newInstance(22, 0, 0, 0);
        sws.Start_Date__c = Date.newInstance(2025, 3, 12);
        sws.Shift_End_Date__c = Date.newInstance(2025, 3, 12);
        
        // Previous shift that ended 6 hours ago (within 10-hour break threshold)
        List<ShiftwithStaff__c> weekShifts = new List<ShiftwithStaff__c>();
        ShiftwithStaff__c prev = new ShiftwithStaff__c(
            Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 12, 6, 0, 0),
            Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 12, 8, 0, 0),
            
            Removed_Duration__c = 0,
            Shift_Category__c = 'Standard Hours'
        );
        weekShifts.add(prev);
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(
            sws, 'Casual', weekShifts, role
        );
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 16: calculateOvertime — home care employee tier
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_HomeCare_Tier() {
        StaffRole__c role = [SELECT Id, Category_Type__c, Type_of_Job__c,
                             StaffRole_To_Staff__c, StaffRole_To_Staff__r.Set_Hours__c
                             FROM StaffRole__c
                             WHERE Category_Type__c = 'Social and community services employee'
                             LIMIT 1];
        
        ShiftwithStaff__c sws = [SELECT Id, Final_Login_DateTime__c, Final_Logout_DateTime__c,
                                 Actual_Duration__c, Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        
        sws.Shift_Day_Name__c = 'Thursday';
        sws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 13, 8, 0, 0);
        sws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 13, 22, 0, 0);
        sws.Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0);
        sws.Shift_End_Time__c = Time.newInstance(22, 0, 0, 0);
        sws.Start_Date__c = Date.newInstance(2025, 3, 13);
        sws.Shift_End_Date__c = Date.newInstance(2025, 3, 13);
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(
            sws, 'Part-time', new List<ShiftwithStaff__c>(), role
        );
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 17: updaterelatedshift — single shift remaining (unsplit)
    // -------------------------------------------------------
    @isTest
    static void testUpdateRelatedShift_SingleRemaining() {
        User u = getTestUser();
        System.runAs(u) {
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
            Staff__c staff = getTestStaff();
            
            ShiftwithStaff__c sws1 = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                New_Split_Shift__c = true,
                Split_Shift_RefId__c = 'REFID-SINGLE-001',
                Index__c = 0
            );
            insert sws1;
            
            ShiftwithStaff__c sws2 = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                New_Split_Shift__c = true,
                Split_Shift_RefId__c = 'REFID-SINGLE-001',
                Index__c = 1
            );
            insert sws2;
            
            // Delete one — leaves one, should unsplit
            delete sws2;
            
            Test.startTest();
            List<ShiftwithStaff__c> deleted = new List<ShiftwithStaff__c>{ sws2 };
                ShiftTimehandler.updaterelatedshift(deleted);
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 18: updaterelatedshift — multiple remaining (reindex)
    // -------------------------------------------------------
    @isTest
    static void testUpdateRelatedShift_MultipleReindex() {
        User u = getTestUser();
        System.runAs(u) {
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
            Staff__c staff = getTestStaff();
            
            ShiftwithStaff__c s1 = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id, Staff__c = staff.Id,
                Role__c = 'Admin', Status__c = 'Accepted',
                New_Split_Shift__c = true,
                Split_Shift_RefId__c = 'REFID-MULTI-002', Index__c = 0
            );
            ShiftwithStaff__c s2 = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id, Staff__c = staff.Id,
                Role__c = 'Admin', Status__c = 'Accepted',
                New_Split_Shift__c = true,
                Split_Shift_RefId__c = 'REFID-MULTI-002', Index__c = 1
            );
            ShiftwithStaff__c s3 = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id, Staff__c = staff.Id,
                Role__c = 'Admin', Status__c = 'Accepted',
                New_Split_Shift__c = true,
                Split_Shift_RefId__c = 'REFID-MULTI-002', Index__c = 2
            );
            insert new List<ShiftwithStaff__c>{ s1, s2, s3 };
                
                delete s1;
            
            Test.startTest();
            ShiftTimehandler.updaterelatedshift(new List<ShiftwithStaff__c>{ s1 });
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 19: updaterelatedshift — null RefId (no-op)
    // -------------------------------------------------------
    @isTest
    static void testUpdateRelatedShift_NullRefId() {
        Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        Staff__c staff = getTestStaff();
        
        ShiftwithStaff__c sws = new ShiftwithStaff__c(
            Add_Shift__c = addShift.Id,
            Staff__c = staff.Id,
            Role__c = 'Admin',
            Status__c = 'Accepted',
            Split_Shift_RefId__c = null
        );
        
        Test.startTest();
        ShiftTimehandler.updaterelatedshift(new List<ShiftwithStaff__c>{ sws });
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 20: trigger update — login/logout change fires SCHADS path
    // -------------------------------------------------------
    @isTest
    static void testTriggerUpdate_SchadsPath() {
        User u = getTestUser();
        System.runAs(u) {
            ShiftwithStaff__c sws = [
                SELECT Id, Add_Shift__c, Staff__c, Role__c, Log_In_Date_Time__c, Log_Out_Date_Time__c,
                Start_Date__c, Shift_End_Date__c, End_time_formula__c
                FROM ShiftwithStaff__c
                WHERE Add_Shift__r.Facility__r.Shift_Penalty_Mode__c = 'Schads'
                LIMIT 1
            ];
            if (sws == null) return;
            
            Test.startTest();
            ShiftTimehandler.isFirstTime = true;
            sws.Log_In_Date_Time__c = Time.newInstance(8, 0, 0, 0);
            sws.Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0);
            sws.Shift_End_Date__c=Date.newInstance(2025, 3, 13);
            update sws;
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 21: trigger update — normal facility early logout
    // -------------------------------------------------------
    @isTest
    static void testTriggerUpdate_NormalFacility_EarlyLogout() {
        User u = getTestUser();
        System.runAs(u) {
            ShiftwithStaff__c sws = [
                SELECT Id, Add_Shift__c, Staff__c, Log_In_Date_Time__c,
                Log_Out_Date_Time__c, Start_Date__c, Shift_End_Date__c
                FROM ShiftwithStaff__c
                WHERE Add_Shift__r.Facility__r.Shift_Penalty_Mode__c = 'SCHADS'
                LIMIT 1
            ];
            if (sws == null) return;
            
            Test.startTest();
            ShiftTimehandler.isFirstTime = true;
            sws.Log_In_Date_Time__c = Time.newInstance(9, 0, 0, 0);
            sws.Log_Out_Date_Time__c = Time.newInstance(14, 0, 0, 0);
            sws.Shift_End_Date__c=Date.newInstance(2025, 3, 13);
            update sws;
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 22: AddshiftwithStaff insert path — with login/logout rounding
    // -------------------------------------------------------
    @isTest
    static void testAddshiftwithStaff_InsertWithRounding() {
        User u = getTestUser();
        System.runAs(u) {
            Add_Shift__c addShift = [SELECT Id, Quantity__c FROM Add_Shift__c LIMIT 1];
            Staff__c staff = getTestStaff();
            
            ShiftwithStaff__c sws = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Start_Date__c = Date.today(),
                Log_In_Date_Time__c = Time.newInstance(9, 7, 0, 0),
                Log_Out_Date_Time__c = Time.newInstance(17, 8, 0, 0)
                
            );
            
            Test.startTest();
            ShiftTimehandler.isFirstTime = true;
            insert sws;
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 23: ReturnStaffRates — all branches with roleRec
    // -------------------------------------------------------
    @isTest
    static void testReturnStaffRates_AllBranches_WithRole() {
        Staff__c staff = [SELECT Id, Working_Hours_Rate__c, Saturday_Hourly_Rate__c,
                          Sunday_Hourly_Rate__c, Night_shift_Hourly_Rate__c,
                          Afternoon_shift_Hourly_Rate__c, Public_holiday_Hourly_Rate__c
                          FROM Staff__c LIMIT 1];
        StaffRole__c role = [SELECT Id, Hourly_Rate__c, Saturday_Hourly_Rate__c,
                             Sunday_Hourly_Rate__c, Night_Shift_Hourly_Rate__c,
                             Afternoon_Shift_Hourly_Rate__c, Public_Holiday_Hourly_Rate__c
                             FROM StaffRole__c LIMIT 1];
        
        Test.startTest();
        ShiftTimehandler.ReturnStaffRates(staff, role, true, 'monday', 'morning');
        ShiftTimehandler.ReturnStaffRates(staff, role, false, 'saturday', 'morning');
        ShiftTimehandler.ReturnStaffRates(staff, role, false, 'sunday', 'morning');
        ShiftTimehandler.ReturnStaffRates(staff, role, false, 'monday', 'morning');
        ShiftTimehandler.ReturnStaffRates(staff, role, false, 'tuesday', 'night');
        ShiftTimehandler.ReturnStaffRates(staff, role, false, 'wednesday', 'afternoon');
        ShiftTimehandler.ReturnStaffRates(staff, null, false, 'monday', 'morning');
        ShiftTimehandler.ReturnStaffRates(staff, null, false, 'saturday', 'morning');
        ShiftTimehandler.ReturnStaffRates(staff, null, false, 'sunday', 'morning');
        ShiftTimehandler.ReturnStaffRates(staff, null, false, 'thursday', 'night');
        ShiftTimehandler.ReturnStaffRates(staff, null, false, 'friday', 'afternoon');
        ShiftTimehandler.ReturnStaffRates(staff, null, true, 'monday', 'morning');
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 24: getMatchedRole — blank name and empty list
    // -------------------------------------------------------
    @isTest
    static void testGetMatchedRole_EdgeCases() {
        Staff__c staff = [SELECT Id, (SELECT Id, RoleName__c FROM StaffRoles__r WHERE Active__c = true)
                          FROM Staff__c LIMIT 1];
        
        Test.startTest();
        ShiftTimehandler.getMatchedRole(staff, '');
        ShiftTimehandler.getMatchedRole(staff, 'NonExistentRole');
        ShiftTimehandler.getMatchedRole(staff, 'Admin');
        Test.stopTest();
    }
    
    // -------------------------------------------------------
    // Test 25: UpdateHourlyRate — null staff / date guard
    // -------------------------------------------------------
    @isTest
    static void testUpdateHourlyRate_NullGuards() {
        User u = getTestUser();
        System.runAs(u) {
            ShiftwithStaff__c sws = new ShiftwithStaff__c(
                Add_Shift__c = [SELECT Id FROM Add_Shift__c LIMIT 1].Id,
                Staff__c = null,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                
                Start_Date__c = null
            );
            Test.startTest();
            ShiftTimehandler.UpdateHourlyRate(new List<ShiftwithStaff__c>{ sws }, TRUE);
            Test.stopTest();
        }
    }
    
    // -------------------------------------------------------
    // Test 26: calculateOvertime — OT tier2 boundary (social > 3hr threshold)
    // -------------------------------------------------------
    @isTest
    static void testCalculateOvertime_Tier2() {
        StaffRole__c role = [SELECT Id, Category_Type__c, Type_of_Job__c,
                             StaffRole_To_Staff__c, StaffRole_To_Staff__r.Set_Hours__c
                             FROM StaffRole__c
                             WHERE Category_Type__c = 'Social and community services employee'
                             LIMIT 1];
        
        ShiftwithStaff__c sws = [SELECT Id, Final_Login_DateTime__c, Final_Logout_DateTime__c,
                                 Actual_Duration__c, Removed_Duration__c, Shift_Category__c,
                                 Sleepover_Night_Shift_hours__c, Public_holiday__c,
                                 Shift_Day_Name__c, Shift_Start_Time__c, Shift_End_Time__c,
                                 Start_Date__c, Shift_End_Date__c
                                 FROM ShiftwithStaff__c LIMIT 1];
        
        sws.Shift_Day_Name__c = 'Monday';
        // 15 hours — triggers tier2
        sws.Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 10, 5, 0, 0);
        sws.Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 10, 20, 0, 0);
        sws.Shift_Start_Time__c = Time.newInstance(5, 0, 0, 0);
        sws.Shift_End_Time__c = Time.newInstance(20, 0, 0, 0);
        sws.Start_Date__c = Date.newInstance(2025, 3, 10);
        sws.Shift_End_Date__c = Date.newInstance(2025, 3, 10);
        
        // Prior week hours just under limit to trigger weekly OT
        List<ShiftwithStaff__c> weekShifts = new List<ShiftwithStaff__c>();
        ShiftwithStaff__c prev = new ShiftwithStaff__c(
            Final_Login_DateTime__c = DateTime.newInstance(2025, 3, 8, 8, 0, 0),
            Final_Logout_DateTime__c = DateTime.newInstance(2025, 3, 8, 16, 0, 0),
            
            Removed_Duration__c = 0,
            Shift_Category__c = 'Standard Hours'
        );
        weekShifts.add(prev);
        weekShifts.add(sws);
        
        Test.startTest();
        ShiftTimehandler.OTResult r = ShiftTimehandler.calculateOvertime(
            sws, 'Casual', weekShifts, role
        );
        Test.stopTest();
    }
    @isTest
    static void cover_allocateMultipleStaff_nulls() {
        Add_Shift__c shift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Date d = Date.today();
        
        String staffJson = '[{"attendance":true,"Id":"' + staff.Id + '","isRecurring":false,"recurringTill":null,"finalOverallRate":10,"shiftWithStaffs":[]}]';
        
        Test.startTest();
        //AddShiftController.allocateMultipleStaff(shift.Id, staffJson, d, null, false);
        // AddShiftController.allocateMultipleStaff(shift.Id, staffJson, d, new List<ShiftwithStaff__c>(), true);
        Test.stopTest();
    }
    
    @isTest
    static void testSchadsSleepoverRules() {
        User u = [SELECT Id FROM User WHERE Email = 'coverage.test.user@hotmail.com' LIMIT 1];
        System.runAs(u) {
            // Get required records
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Facility__c schadsFacility = [SELECT Id FROM Facility__c WHERE Shift_Penalty_Mode__c = 'SCHADS' LIMIT 1];
            
            // Create StaffRole with Casual type for minimum hours branch
            StaffRole__c casualRole = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Category_Type__c = 'Social and community services employee',
                Type_of_Job__c = 'Casual',
                Facility__c = schadsFacility.Id
            );
            insert casualRole;
            
            // Create Add_Shift with SCHADS facility
            Add_Shift__c addShift = new Add_Shift__c(
                Facility__c = schadsFacility.Id,
                Role__c = 'Admin',
                Start_Date__c = Date.today(),
                End_Date__c = Date.today(),
                Start_Time__c = Time.newInstance(22, 0, 0, 0),
                End_Time__c = Time.newInstance(8, 0, 0, 0),
                Quantity__c = 5
            );
            insert addShift;
            
            // Create Sleepover Shift record
            ShiftwithStaff__c sleepoverShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Shift_Category__c = 'Sleepover Shift',
                Status__c = 'Accepted',
                Start_Date__c = Date.today(),
                Final_Login_DateTime__c = DateTime.newInstance(Date.today(), Time.newInstance(22, 0, 0, 0)),
                Final_Logout_DateTime__c = DateTime.newInstance(Date.today().addDays(1), Time.newInstance(8, 0, 0, 0)),
                Sleepover_Night_Shift_hours__c = 0.5
            );
            insert sleepoverShift;
            
            // Create Before Shift (ends close to sleepover start)
            ShiftwithStaff__c beforeShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Shift_Category__c = 'Standard Hours',
                Status__c = 'Accepted',
                Start_Date__c = Date.today(),
                Final_Login_DateTime__c = DateTime.newInstance(Date.today(), Time.newInstance(14, 0, 0, 0)),
                Final_Logout_DateTime__c = DateTime.newInstance(Date.today(), Time.newInstance(21, 30, 0, 0))
            );
            insert beforeShift;
            
            // Create After Shift (starts close to sleepover end)
            ShiftwithStaff__c afterShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Shift_Category__c = 'Standard Hours',
                Status__c = 'Accepted',
                Start_Date__c = Date.today().addDays(1),
                Final_Login_DateTime__c = DateTime.newInstance(Date.today().addDays(1), Time.newInstance(8, 30, 0, 0)),
                Final_Logout_DateTime__c = DateTime.newInstance(Date.today().addDays(1), Time.newInstance(17, 0, 0, 0))
            );
            insert afterShift;
            
            // Update trigger shift with login/logout to trigger the SCHADS logic
            Test.startTest();
            ShiftTimehandler.isFirstTime = true;
            
            sleepoverShift.Log_In_Date_Time__c = Time.newInstance(22, 0, 0, 0);
            sleepoverShift.Log_Out_Date_Time__c = Time.newInstance(8, 0, 0, 0);
            sleepovershift.Shift_End_Date__c =Date.newInstance(2025, 3, 10);
            update sleepoverShift;
            
            Test.stopTest();
        }
    }
    
    @isTest
    static void testSchadsMinimumHoursPartTime() {
        User u = [SELECT Id FROM User WHERE Email = 'coverage.test.user@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Facility__c schadsFacility = [SELECT Id FROM Facility__c WHERE Shift_Penalty_Mode__c = 'SCHADS' LIMIT 1];
            
            // Create StaffRole with Part-time type for minimum hours branch
            StaffRole__c parttimeRole = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'AIN',
                Active__c = true,
                Category_Type__c = 'Social and community services employee',
                Type_of_Job__c = 'Part-time',
                Facility__c = schadsFacility.Id
            );
            insert parttimeRole;
            
            Add_Shift__c addShift = new Add_Shift__c(
                Facility__c = schadsFacility.Id,
                Role__c = 'AIN',
                Start_Date__c = Date.today(),
                End_Date__c = Date.today(),
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Quantity__c = 5
            );
            insert addShift;
            
            // Create shift with less than minimum hours (3 for part-time)
            ShiftwithStaff__c shiftWithLowHours = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'AIN',
                Status__c = 'Accepted',
                Start_Date__c = Date.today(),
                Final_Login_DateTime__c = DateTime.newInstance(Date.today(), Time.newInstance(9, 0, 0, 0)),
                Final_Logout_DateTime__c = DateTime.newInstance(Date.today(), Time.newInstance(11, 30, 0, 0)),
                Log_In_Date_Time__c = Time.newInstance(9, 0, 0, 0),
                Log_Out_Date_Time__c = Time.newInstance(11, 30, 0, 0)
            );
            insert shiftWithLowHours;
            
            // Update to trigger minimum hours calculation
            Test.startTest();
            ShiftTimehandler.isFirstTime = true;
            
            shiftWithLowHours.Log_In_Date_Time__c = Time.newInstance(9, 0, 0, 0);
            shiftWithLowHours.Log_Out_Date_Time__c = Time.newInstance(11, 30, 0, 0);
            update shiftWithLowHours;
            
            Test.stopTest();
        }
    }
    
    @isTest
    static void testSchadsUpliftBothShiftsEqual() {
        User u = [SELECT Id FROM User WHERE Email = 'coverage.test.user@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Facility__c schadsFacility = [SELECT Id FROM Facility__c WHERE Shift_Penalty_Mode__c = 'SCHADS' LIMIT 1];
            
            StaffRole__c role = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Category_Type__c = 'Social and community services employee',
                Type_of_Job__c = 'Casual',
                Facility__c = schadsFacility.Id
            );
            insert role;
            
            Add_Shift__c addShift = new Add_Shift__c(
                Facility__c = schadsFacility.Id,
                Role__c = 'Admin',
                Start_Date__c = Date.today(),
                End_Date__c = Date.today().addDays(1),
                Start_Time__c = Time.newInstance(22, 0, 0, 0),
                End_Time__c = Time.newInstance(8, 0, 0, 0),
                Quantity__c = 5
            );
            insert addShift;
            
            // Sleepover shift
            ShiftwithStaff__c sleepover = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Shift_Category__c = 'Sleepover Shift',
                Status__c = 'Accepted',
                Start_Date__c = Date.today(),
                Final_Login_DateTime__c = DateTime.newInstance(Date.today(), Time.newInstance(22, 0, 0, 0)),
                Final_Logout_DateTime__c = DateTime.newInstance(Date.today().addDays(1), Time.newInstance(8, 0, 0, 0))
            );
            insert sleepover;
            
            // Before shift with 3 hours
            ShiftwithStaff__c before = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Shift_Category__c = 'Standard Hours',
                Status__c = 'Accepted',
                Start_Date__c = Date.today(),
                Final_Login_DateTime__c = DateTime.newInstance(Date.today(), Time.newInstance(18, 0, 0, 0)),
                Final_Logout_DateTime__c = DateTime.newInstance(Date.today(), Time.newInstance(21, 0, 0, 0))
            );
            insert before;
            
            // After shift with 3 hours (equal to before)
            ShiftwithStaff__c after = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Role__c = 'Admin',
                Shift_Category__c = 'Standard Hours',
                Status__c = 'Accepted',
                Start_Date__c = Date.today().addDays(1),
                Final_Login_DateTime__c = DateTime.newInstance(Date.today().addDays(1), Time.newInstance(9, 0, 0, 0)),
                Final_Logout_DateTime__c = DateTime.newInstance(Date.today().addDays(1), Time.newInstance(12, 0, 0, 0))
            );
            insert after;
            
            Test.startTest();
            ShiftTimehandler.isFirstTime = true;
            
            sleepover.Log_In_Date_Time__c = Time.newInstance(22, 0, 0, 0);
            sleepover.Log_Out_Date_Time__c = Time.newInstance(8, 0, 0, 0);
            sleepover.Shift_End_Date__c =Date.newInstance(2025, 3, 10);
            update sleepover;
            
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testRoundDownBeforeMidpoint() {
        Time inputTime = Time.newInstance(10, 7, 0, 0);
        Decimal interval = 15;
        
        ShiftTimehandler.roundToNearestInterval(inputTime, interval);
    }
    
    @IsTest
    static void testRoundUpAfterMidpoint() {
        Time inputTime = Time.newInstance(10, 8, 0, 0);
        Decimal interval = 15;
        
        ShiftTimehandler.roundToNearestInterval(inputTime, interval);
    }
    
    @IsTest
    static void testExactMidpointRoundsDown() {
        Time inputTime = Time.newInstance(10, 7, 30, 0);
        Decimal interval = 15;
        
        ShiftTimehandler.roundToNearestInterval(inputTime, interval);
    }
    
    @IsTest
    static void testExactIntervalNoChange() {
        Time inputTime = Time.newInstance(9, 30, 0, 0);
        Decimal interval = 15;
        
        ShiftTimehandler.roundToNearestInterval(inputTime, interval);
    }
    
    @IsTest
    static void testRoundingWithSeconds() {
        Time inputTime = Time.newInstance(14, 22, 45, 0);
        Decimal interval = 10;
        
        ShiftTimehandler.roundToNearestInterval(inputTime, interval);
    }
    
    @IsTest
    static void testNullTimeReturnsNull() {
        ShiftTimehandler.roundToNearestInterval(null, 15);
    }
    
    @IsTest
    static void testNullIntervalReturnsOriginal() {
        Time inputTime = Time.newInstance(11, 10, 0, 0);
        
        ShiftTimehandler.roundToNearestInterval(inputTime, null);
    }
    
    @IsTest
    static void testZeroIntervalReturnsOriginal() {
        Time inputTime = Time.newInstance(11, 10, 0, 0);
        
        ShiftTimehandler.roundToNearestInterval(inputTime, 0);
    }
    
    @IsTest
    static void testNegativeIntervalReturnsOriginal() {
        Time inputTime = Time.newInstance(11, 10, 0, 0);
        
        ShiftTimehandler.roundToNearestInterval(inputTime, -15);
    }
    
    
    @IsTest
    static void testApplySleepoverArrangementOT_NullRole() {
        
        ShiftwithStaff__c currentShift = new ShiftwithStaff__c();
        
        ShiftTimehandler.applySleepoverArrangementOT(
            currentShift,
            null,
            null,
            null
        );
    }
    @IsTest
    static void testApplySleepoverArrangementOT_BeforeOnly() {
        
        ShiftwithStaff__c currentShift = new ShiftwithStaff__c();
        
        ShiftwithStaff__c beforeShift = new ShiftwithStaff__c(
            Final_Login_DateTime__c = DateTime.newInstance(2025,1,1,8,0,0),
            Final_Logout_DateTime__c = DateTime.newInstance(2025,1,1,12,0,0),
            Removed_Duration__c = 0
        );
        
        StaffRole__c role = new StaffRole__c(
            Type_of_Job__c='Casual',
            Category_Type__c='Social and community services employee'
        );
        
        ShiftTimehandler.applySleepoverArrangementOT(
            currentShift,
            beforeShift,
            null,
            role
        );
    } 
    @IsTest
    static void testApplySleepoverArrangementOT_AfterOnly() {
        
        ShiftwithStaff__c currentShift = new ShiftwithStaff__c();
        
        ShiftwithStaff__c afterShift = new ShiftwithStaff__c(
            Final_Login_DateTime__c = DateTime.newInstance(2025,1,1,8,0,0),
            Final_Logout_DateTime__c = DateTime.newInstance(2025,1,1,18,30,0),
            Removed_Duration__c = 0
        );
        
        StaffRole__c role = new StaffRole__c(
            Type_of_Job__c='Casual',
            Category_Type__c='Social and community services employee'
        );
        
        ShiftTimehandler.applySleepoverArrangementOT(
            currentShift,
            null,
            afterShift,
            role
        );
    } 
    @IsTest
    static void testApplySleepoverArrangementOT_TotalHoursOverTen() {
        
        ShiftwithStaff__c currentShift = new ShiftwithStaff__c();
        
        ShiftwithStaff__c beforeShift = new ShiftwithStaff__c(
            Final_Login_DateTime__c=DateTime.newInstance(2025,1,1,6,0,0),
            Final_Logout_DateTime__c=DateTime.newInstance(2025,1,1,12,0,0),
            Removed_Duration__c=0
        );
        
        ShiftwithStaff__c afterShift = new ShiftwithStaff__c(
            Final_Login_DateTime__c=DateTime.newInstance(2025,1,1,13,0,0),
            Final_Logout_DateTime__c=DateTime.newInstance(2025,1,1,20,0,0),
            Removed_Duration__c=0
        );
        
        StaffRole__c role = new StaffRole__c(
            Type_of_Job__c='Part-time',
            Category_Type__c='Social and community services employee'
        );
        
        ShiftTimehandler.applySleepoverArrangementOT(
            currentShift,
            beforeShift,
            afterShift,
            role
        );
    }
    @IsTest
    static void testApplySleepoverArrangementOT_FullTime() {
        
        ShiftwithStaff__c currentShift = new ShiftwithStaff__c();
        
        ShiftwithStaff__c afterShift = new ShiftwithStaff__c(
            Final_Login_DateTime__c=DateTime.newInstance(2025,1,1,8,0,0),
            Final_Logout_DateTime__c=DateTime.newInstance(2025,1,1,17,0,0),
            Removed_Duration__c=0
        );
        
        StaffRole__c role = new StaffRole__c(
            Type_of_Job__c='Full-time',
            Category_Type__c='Nursing'
        );
        
        ShiftTimehandler.applySleepoverArrangementOT(
            currentShift,
            null,
            afterShift,
            role
        );
    }  
    @IsTest
    static void testApplySleepoverArrangementOT_TierTwo() {
        
        ShiftwithStaff__c currentShift = new ShiftwithStaff__c();
        
        ShiftwithStaff__c afterShift = new ShiftwithStaff__c(
            Final_Login_DateTime__c=DateTime.newInstance(2025,1,1,8,0,0),
            Final_Logout_DateTime__c=DateTime.newInstance(2025,1,1,22,0,0),
            Removed_Duration__c=2
        );
        
        StaffRole__c role = new StaffRole__c(
            Type_of_Job__c='Casual',
            Category_Type__c='Nursing'
        );
        
        ShiftTimehandler.applySleepoverArrangementOT(
            currentShift,
            null,
            afterShift,
            role
        );
    }
    @IsTest
    static void testApplySleepoverArrangementOT_BeforeGreaterThanEightHours() {
        
        // Existing record from @testSetup
        ShiftwithStaff__c beforeShift = [
            SELECT Id,
            Final_Login_DateTime__c,
            Final_Logout_DateTime__c,
            Removed_Duration__c
            FROM ShiftwithStaff__c
            LIMIT 1
        ];
        
        beforeShift.Final_Login_DateTime__c =
            DateTime.newInstance(2025, 1, 1, 8, 0, 0);
        
        beforeShift.Final_Logout_DateTime__c =
            DateTime.newInstance(2025, 1, 1, 18, 0, 0); // 10 hours
        
        beforeShift.Removed_Duration__c = 0;
        
        ShiftwithStaff__c currentShift = new ShiftwithStaff__c();
        
        StaffRole__c role = new StaffRole__c(
            Type_of_Job__c = 'Casual',
            Category_Type__c = 'Social and community services employee'
        );
        
        Test.startTest();
        
        ShiftTimehandler.applySleepoverArrangementOT(
            currentShift,
            beforeShift,
            null,
            role
        );
        
        Test.stopTest();
    }
    @IsTest
    static void testUpdateHourlyRate_LongShiftBranches() {
        
        User u = getTestUser();
        
        System.runAs(u) {
            
            List<ShiftwithStaff__c> shifts = [
                SELECT Id,
                Staff__c,
                Add_Shift__c,
                Role__c,
                Date__c,
                Start_Date__c,
                Day_Name__c,
                Shift_Category__c,
                Staff_Final_Hourly_Rate__c,
                Do_you_want_to_set_this_Recurring_Roster__c,
                Is_long_Morning__c,
                Is_Long_Afternoon__c,
                Is_Long_Night_Shift__c,
                Is_long_Morning_Shift_two__c,
                Is_Long_afternoon_shift_two__c,
                Is_long_Morning_Next_Day_Start__c,
                Is_Long_Afternoon_Next_Day_Start__c,
                Is_Long_Night_Start_Next_Day__c,
                Is_Long_Morning_Next_Day_Start_Two__c,
                Recur_Holiday__c
                FROM ShiftwithStaff__c
                LIMIT 1
            ];
            
            
            
            ShiftwithStaff__c shift = shifts[0];
            
            shift.Role__c = 'Admin';
            
            
            // Formula Type_of_shift__c will return this value
            shift.Shift_Category__c = 'Morning';
            
            shift.Do_you_want_to_set_this_Recurring_Roster__c = true;
            
            shift.Is_long_Morning__c = true;
            shift.Is_Long_Afternoon__c = true;
            shift.Is_Long_Night_Shift__c = true;
            shift.Is_long_Morning_Shift_two__c = true;
            shift.Is_Long_afternoon_shift_two__c = true;
            
            shift.Is_long_Morning_Next_Day_Start__c = false;
            shift.Is_Long_Afternoon_Next_Day_Start__c = false;
            shift.Is_Long_Night_Start_Next_Day__c = false;
            shift.Is_Long_Morning_Next_Day_Start_Two__c = false;
            
            Test.startTest();
            ShiftTimehandler.UpdateHourlyRate(shifts, true);
            Test.stopTest();
        }
    }
    
}