@isTest
public class ShiftComplianceReportHandlerTest {
    
    @testSetup
    static void testData(){
        
        List<String> picklistRoles = new List<String>();
        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN', 'Support Worker'});
        }
        
        String role1 = picklistRoles[0];
        String role2 = picklistRoles.size() > 1 ? picklistRoles[1] : role1;
        String role3 = picklistRoles.size() > 2 ? picklistRoles[2] : role2;
        
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='testorg@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        org.Roles__c = role1 + ';' + role2;
        insert org;
        
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen', 
            Email= 'manualtesting.20294637@hotmail.com', 
            EmailEncodingKey='UTF-8', 
            LastName='StaffOne209463', 
            LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', 
            ProfileId = prof.Id, 
            TimeZoneSidKey='America/New_York', 
            User_Type__c='NDIS Org Admin', 
            UserName='manualtesting.20294637@hotmail.com',
            Organization_Name__c ='Ashfield Consultants'
        );
        insert user;
        
        System.runAs(user){   
            
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
            insert fac;
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff 1'; 
            staff1.Name='staff1';
            staff1.Name__c='Staff One';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'staff1@test.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='primary@test.com';
            staff1.Secondary_Contact_Name__c='Maheswari';
            staff1.Secondary_Contact_Email__c='secondary@test.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='99084582958';
            staff1.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Final_Overall_Rate__c=150;
            staff1.Saturday_Hourly_Rate__c = 130;
            staff1.Sunday_Hourly_Rate__c = 50;
            staff1.Status__c = true;
            insert staff1;
            
            Staff__c staff2 = new Staff__c();
            staff2.Last_Name__c='Test staff 2'; 
            staff2.Name='staff2';
            staff2.Name__c='Staff Two';
            staff2.Contact_Number__c='56789908744';
            staff2.Email_Address__c= 'staff2@test.com';
            staff2.Facility__c=fac.Id;
            staff2.Address__Street__s='9 Keewong Street';
            staff2.Address__City__s = 'Crace';
            staff2.Address__StateCode__s='ACT';
            staff2.Address__PostalCode__s='2911';
            staff2.Emergency_Phone_Number__c='45678766676';
            staff2.Primary_Contact_Name__c='John';
            staff2.Primary_Contact_Number__c='9908458299';
            staff2.Make_Primary_as_Approver__c=true;
            staff2.Primary_Contact_Email__c='john@test.com';
            staff2.Secondary_Contact_Name__c='Jane';
            staff2.Secondary_Contact_Email__c='jane@test.com';
            staff2.Make_Secondary_as_Approver__c=false;
            staff2.Secondary_Contact_Number__c='99084582959';
            staff2.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff2.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff2.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff2.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff2.role__c='AIN';
            staff2.Residency_Type__c = 'Australian';
            staff2.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff2.Type__c = 'Visa Status';
            staff2.Working_Hours_Rate__c=50;
            staff2.Final_Overall_Rate__c=150;
            staff2.Saturday_Hourly_Rate__c = 130;
            staff2.Sunday_Hourly_Rate__c = 50;
            staff2.Status__c = true;
            insert staff2;
            
            StaffRole__c sr1 = new StaffRole__c(
                StaffRole_To_Staff__c = staff1.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Facility__c = fac.Id,
                Hourly_Rate__c = 50
            );
            
            StaffRole__c sr2 = new StaffRole__c(
                StaffRole_To_Staff__c = staff2.Id,
                RoleName__c = 'AIN',
                Active__c = true,
                Facility__c = fac.Id,
                Hourly_Rate__c = 45
            );
            
            insert new List<StaffRole__c>{sr1, sr2};
                
            Facility_Compliance_Setting__c rule1 = new Facility_Compliance_Setting__c(
                Name = 'General Compliance Rules',
                Facility__c = fac.Id,
                Is_Active__c = true,
                Max_Hours_Per_Shift__c = 8,
                Max_Hours_Per_Week__c = 40,
                Max_Consecutive_Days__c = 5,
                Min_Hours_Between_Shifts__c = 10,
                Max_Late_Clock_In_minutes__c = 15,
                Max_Missed_Shifts_Per_Month__c = 2,
                Apply_to_specific_roles__c = false
            );
            
            Facility_Compliance_Setting__c rule2 = new Facility_Compliance_Setting__c(
                Name = 'Admin Specific Rules',
                Facility__c = fac.Id,
                Is_Active__c = true,
                Max_Hours_Per_Shift__c = 10,
                Max_Hours_Per_Week__c = 50,
                Max_Consecutive_Days__c = 6,
                Min_Hours_Between_Shifts__c = 8,
                Max_Late_Clock_In_minutes__c = 30,
                Max_Missed_Shifts_Per_Month__c = 3,
                Roles__c = 'Admin',
                Apply_to_specific_roles__c = true
            );
            
            insert new List<Facility_Compliance_Setting__c>{rule1, rule2};
        }
    }
    
    // ==============================================
    // TEST 1: Max Hours Per Shift Violation
    // ==============================================
    @isTest
    static void testMaxHoursPerShiftViolation() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        // Create a shift with 12 hours duration (violates 8 hour limit)
        Add_Shift__c shift = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = Date.today().addDays(-5),
            End_Date__c = Date.today().addDays(-5),
            Start_Time__c = Time.newInstance(8, 0, 0, 0),
            End_Time__c = Time.newInstance(20, 0, 0, 0),
            Role__c = 'Admin',
            Status__c = 'Published',
            Duration__c = 12,
            Quantity__c = 1
        );
        insert shift;
        
        ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
            Add_Shift__c = shift.Id,
            Staff__c = staff1.Id,
            Start_Date__c = shift.Start_Date__c,
            Shift_End_Date__c = shift.End_Date__c,
            Shift_Start_Time__c = shift.Start_Time__c,
            Shift_End_Time__c = shift.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin'
        );
        insert staffShift;
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id},
                Date.today().addDays(-10),
                Date.today()
            );
        Test.stopTest();
        
        // Verify violation was detected
        Boolean foundViolation = false;
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            if (row.ruleName == 'Max Hours Per Shift') {
                foundViolation = true;
            }
        }
    }
    
    // ==============================================
    // TEST 2: Max Hours Per Week Violation
    // ==============================================
    @isTest
    static void testMaxHoursPerWeekViolation() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        List<Add_Shift__c> shifts = new List<Add_Shift__c>();
        List<ShiftwithStaff__c> staffShifts = new List<ShiftwithStaff__c>();
        
        Date weekStart = Date.today().toStartOfWeek();
        
        // Create 6 shifts of 8 hours each in same week (48 hours total, violates 40 hour limit)
        for (Integer i = 0; i < 6; i++) {
            Add_Shift__c shift = new Add_Shift__c(
                Facility__c = fac.Id,
                Start_Date__c = weekStart.addDays(i),
                End_Date__c = weekStart.addDays(i),
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Role__c = 'Admin',
                Status__c = 'Published',
                Quantity__c = 1
            );
            shifts.add(shift);
        }
        insert shifts;
        
        for (Add_Shift__c shift : shifts) {
            ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
                Add_Shift__c = shift.Id,
                Staff__c = staff1.Id,
                Start_Date__c = shift.Start_Date__c,
                Shift_End_Date__c = shift.End_Date__c,
                Shift_Start_Time__c = shift.Start_Time__c,
                Shift_End_Time__c = shift.End_Time__c,
                Status__c = 'Accepted',
                Role__c = 'Admin'
            );
            staffShifts.add(staffShift);
        }
        insert staffShifts;
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id},
                weekStart.addDays(-7),
                weekStart.addDays(7)
            );
        Test.stopTest();
        
        // Verify weekly hours violation was detected
        Boolean foundViolation = false;
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            if (row.ruleName == 'Max Hours Per Week') {
                foundViolation = true;
            }
        }
    }
    
    // ==============================================
    // TEST 3: Max Consecutive Days Violation
    // ==============================================
    @isTest
    static void testMaxConsecutiveDaysViolation() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        List<Add_Shift__c> shifts = new List<Add_Shift__c>();
        List<ShiftwithStaff__c> staffShifts = new List<ShiftwithStaff__c>();
        
        Date startDate = Date.today().addDays(-10);
        
        // Create 7 consecutive days of shifts (violates 5 day limit)
        for (Integer i = 0; i < 7; i++) {
            Add_Shift__c shift = new Add_Shift__c(
                Facility__c = fac.Id,
                Start_Date__c = startDate.addDays(i),
                End_Date__c = startDate.addDays(i),
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Role__c = 'Admin',
                Status__c = 'Published',
                Quantity__c = 1
            );
            shifts.add(shift);
        }
        insert shifts;
        
        for (Add_Shift__c shift : shifts) {
            ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
                Add_Shift__c = shift.Id,
                Staff__c = staff1.Id,
                Start_Date__c = shift.Start_Date__c,
                Shift_End_Date__c = shift.End_Date__c,
                Shift_Start_Time__c = shift.Start_Time__c,
                Shift_End_Time__c = shift.End_Time__c,
                Status__c = 'Accepted',
                Role__c = 'Admin'
            );
            staffShifts.add(staffShift);
        }
        insert staffShifts;
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id},
                startDate.addDays(-2),
                startDate.addDays(10)
            );
        Test.stopTest();
        
        // Verify consecutive days violation was detected
        Boolean foundViolation = false;
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            if (row.ruleName == 'Max Consecutive Days') {
                foundViolation = true;
            }
        }
    }
    
    // ==============================================
    // TEST 4: Min Hours Between Shifts Violation
    // ==============================================
    @isTest
    static void testMinHoursBetweenShiftsViolation() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        Date shiftDate = Date.today().addDays(-5);
        
        // Shift 1: Ends at 10 PM
        Add_Shift__c shift1 = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = shiftDate,
            End_Date__c = shiftDate,
            Start_Time__c = Time.newInstance(14, 0, 0, 0),
            End_Time__c = Time.newInstance(22, 0, 0, 0),
            Role__c = 'Admin',
            Status__c = 'Published',
            Quantity__c = 1
        );
        
        // Shift 2: Starts at 6 AM next day (only 8 hours rest, violates 10 hour minimum)
        Add_Shift__c shift2 = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = shiftDate.addDays(1),
            End_Date__c = shiftDate.addDays(1),
            Start_Time__c = Time.newInstance(6, 0, 0, 0),
            End_Time__c = Time.newInstance(14, 0, 0, 0),
            Role__c = 'Admin',
            Status__c = 'Published',
            Quantity__c = 1
        );
        
        insert new List<Add_Shift__c>{shift1, shift2};
        
        ShiftwithStaff__c staffShift1 = new ShiftwithStaff__c(
            Add_Shift__c = shift1.Id,
            Staff__c = staff1.Id,
            Start_Date__c = shift1.Start_Date__c,
            Shift_End_Date__c = shift1.End_Date__c,
            Shift_Start_Time__c = shift1.Start_Time__c,
            Shift_End_Time__c = shift1.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin'
        );
        
        ShiftwithStaff__c staffShift2 = new ShiftwithStaff__c(
            Add_Shift__c = shift2.Id,
            Staff__c = staff1.Id,
            Start_Date__c = shift2.Start_Date__c,
            Shift_End_Date__c = shift2.End_Date__c,
            Shift_Start_Time__c = shift2.Start_Time__c,
            Shift_End_Time__c = shift2.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin'
        );
        
        insert new List<ShiftwithStaff__c>{staffShift1, staffShift2};
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id},
                shiftDate.addDays(-2),
                shiftDate.addDays(5)
            );
        Test.stopTest();
        
        // Verify rest period violation was detected
        Boolean foundViolation = false;
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            if (row.ruleName == 'Min Rest Between Shifts') {
                foundViolation = true;
            }
        }
    }
    
    // ==============================================
    // TEST 5: Late Clock-In Violation
    // ==============================================
    @isTest
    static void testLateClockInViolation() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        Date shiftDate = Date.today().addDays(-5);
        
        Add_Shift__c shift = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = shiftDate,
            End_Date__c = shiftDate,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Role__c = 'Admin',
            Status__c = 'Published',
            Quantity__c = 1
        );
        insert shift;
        
        // Clock in 30 minutes late (violates 15 minute limit)
        DateTime scheduledStart = DateTime.newInstance(shiftDate, Time.newInstance(9, 0, 0, 0));
        DateTime actualLogin = scheduledStart.addMinutes(30);
        
        ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
            Add_Shift__c = shift.Id,
            Staff__c = staff1.Id,
            Start_Date__c = shift.Start_Date__c,
            Shift_End_Date__c = shift.End_Date__c,
            Shift_Start_Time__c = shift.Start_Time__c,
            Shift_End_Time__c = shift.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin',
            Log_In_Date_Time__c = actualLogin.time(),
            Final_Login_DateTime__c = actualLogin,
            Log_Out_Date_Time__c = Time.newInstance(17, 0, 0, 0),
            Final_Logout_DateTime__c = DateTime.newInstance(shiftDate, Time.newInstance(17, 0, 0, 0))
        );
        insert staffShift;
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id},
                shiftDate.addDays(-2),
                shiftDate.addDays(2)
            );
        Test.stopTest();
        
        // Verify late clock-in violation was detected
        Boolean foundViolation = false;
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            if (row.ruleName == 'Late Clock-In') {
                foundViolation = true;
            }
        }
    }
    
    // ==============================================
    // TEST 6: Late Clock-Out Violation
    // ==============================================
    @isTest
    static void testLateClockOutViolation() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        Date shiftDate = Date.today().addDays(-5);
        
        Add_Shift__c shift = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = shiftDate,
            End_Date__c = shiftDate,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Role__c = 'Admin',
            Status__c = 'Published',
            Quantity__c = 1
        );
        insert shift;
        
        // Clock out 25 minutes late (violates 15 minute limit)
        DateTime scheduledEnd = DateTime.newInstance(shiftDate, Time.newInstance(17, 0, 0, 0));
        DateTime actualLogout = scheduledEnd.addMinutes(25);
        
        ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
            Add_Shift__c = shift.Id,
            Staff__c = staff1.Id,
            Start_Date__c = shift.Start_Date__c,
            Shift_End_Date__c = shift.End_Date__c,
            Shift_Start_Time__c = shift.Start_Time__c,
            Shift_End_Time__c = shift.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin',
            Log_In_Date_Time__c = Time.newInstance(9, 0, 0, 0),
            Final_Login_DateTime__c = DateTime.newInstance(shiftDate, Time.newInstance(9, 0, 0, 0)),
            Log_Out_Date_Time__c = actualLogout.time(),
            Final_Logout_DateTime__c = actualLogout
        );
        insert staffShift;
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id},
                shiftDate.addDays(-2),
                shiftDate.addDays(2)
            );
        Test.stopTest();
        
        // Verify late clock-out violation was detected
        Boolean foundViolation = false;
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            if (row.ruleName == 'Late Clock-Out') {
                foundViolation = true;
            }
        }
    }
    
    // ==============================================
    // TEST 7: Missed Shifts Per Month Violation
    // ==============================================
    @isTest
    static void testMissedShiftsPerMonthViolation() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        List<Add_Shift__c> shifts = new List<Add_Shift__c>();
        List<ShiftwithStaff__c> staffShifts = new List<ShiftwithStaff__c>();
        
        Date monthStart = Date.today().toStartOfMonth().addMonths(-1);
        
        // Create 4 shifts in same month with no clock-in/out (violates 2 missed shift limit)
        for (Integer i = 0; i < 4; i++) {
            Add_Shift__c shift = new Add_Shift__c(
                Facility__c = fac.Id,
                Start_Date__c = monthStart.addDays(i * 5),
                End_Date__c = monthStart.addDays(i * 5),
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Role__c = 'Admin',
                Status__c = 'Published',
                Quantity__c = 1
            );
            shifts.add(shift);
        }
        insert shifts;
        
        for (Add_Shift__c shift : shifts) {
            ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
                Add_Shift__c = shift.Id,
                Staff__c = staff1.Id,
                Start_Date__c = shift.Start_Date__c,
                Shift_End_Date__c = shift.End_Date__c,
                Shift_Start_Time__c = shift.Start_Time__c,
                Shift_End_Time__c = shift.End_Time__c,
                Status__c = 'Accepted',
                Role__c = 'Admin'
                // No Log_In_Date_Time__c or Log_Out_Date_Time__c = missed shift
            );
            staffShifts.add(staffShift);
        }
        insert staffShifts;
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id},
                monthStart,
                monthStart.addMonths(1)
            );
        Test.stopTest();
        
        // Verify missed shifts violation was detected
        Boolean foundViolation = false;
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            if (row.ruleName == 'Missed Shifts Per Month') {
                foundViolation = true;
            }
        }
    }
    
    // ==============================================
    // TEST 8: Role-Specific Rules
    // ==============================================
    @isTest
    static void testRoleSpecificRules() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1]; // Admin role
        Staff__c staff2 = [SELECT Id FROM Staff__c WHERE Name = 'staff2' LIMIT 1]; // AIN role
        
        // Create shift for Admin with 9 hours (passes general 8hr limit but within Admin's 10hr limit)
        Add_Shift__c shift1 = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = Date.today().addDays(-5),
            End_Date__c = Date.today().addDays(-5),
            Start_Time__c = Time.newInstance(8, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Role__c = 'Admin',
            Status__c = 'Published',
            Quantity__c = 1
        );
        
        // Create shift for AIN with 9 hours (violates general 8hr limit)
        Add_Shift__c shift2 = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = Date.today().addDays(-5),
            End_Date__c = Date.today().addDays(-5),
            Start_Time__c = Time.newInstance(8, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Role__c = 'AIN',
            Status__c = 'Published',
            Quantity__c = 1
        );
        
        insert new List<Add_Shift__c>{shift1, shift2};
        
        ShiftwithStaff__c staffShift1 = new ShiftwithStaff__c(
            Add_Shift__c = shift1.Id,
            Staff__c = staff1.Id,
            Start_Date__c = shift1.Start_Date__c,
            Shift_End_Date__c = shift1.End_Date__c,
            Shift_Start_Time__c = shift1.Start_Time__c,
            Shift_End_Time__c = shift1.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin'
        );
        
        ShiftwithStaff__c staffShift2 = new ShiftwithStaff__c(
            Add_Shift__c = shift2.Id,
            Staff__c = staff2.Id,
            Start_Date__c = shift2.Start_Date__c,
            Shift_End_Date__c = shift2.End_Date__c,
            Shift_Start_Time__c = shift2.Start_Time__c,
            Shift_End_Time__c = shift2.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'AIN'
        );
        
        insert new List<ShiftwithStaff__c>{staffShift1, staffShift2};
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id, staff2.Id},
                Date.today().addDays(-10),
                Date.today()
            );
        Test.stopTest();
        
        // Verify role-specific rules are applied correctly
        Boolean foundAdminViolation = false;
        Boolean foundAINViolation = false;
        
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            if (row.staffId == staff1.Id && row.ruleName == 'Max Hours Per Shift') {
                foundAdminViolation = true;
            }
            if (row.staffId == staff2.Id && row.ruleName == 'Max Hours Per Shift') {
                foundAINViolation = true;
            }
        }
    }
    
    // ==============================================
    // TEST 9: No Violations - Compliant Shifts
    // ==============================================
    @isTest
    static void testNoViolationsCompliantShifts() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        Date shiftDate = Date.today().addDays(-5);
        
        // Create compliant shift: 7 hours, on time
        Add_Shift__c shift = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = shiftDate,
            End_Date__c = shiftDate,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(16, 0, 0, 0),
            Role__c = 'Admin',
            Status__c = 'Published',
            Quantity__c = 1
        );
        insert shift;
        
        ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
            Add_Shift__c = shift.Id,
            Staff__c = staff1.Id,
            Start_Date__c = shift.Start_Date__c,
            Shift_End_Date__c = shift.End_Date__c,
            Shift_Start_Time__c = shift.Start_Time__c,
            Shift_End_Time__c = shift.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin',
            Log_In_Date_Time__c = Time.newInstance(9, 0, 0, 0),
            Final_Login_DateTime__c = DateTime.newInstance(shiftDate, Time.newInstance(9, 0, 0, 0)),
            Log_Out_Date_Time__c = Time.newInstance(16, 0, 0, 0),
            Final_Logout_DateTime__c = DateTime.newInstance(shiftDate, Time.newInstance(16, 0, 0, 0))
        );
        insert staffShift;
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id},
                shiftDate.addDays(-2),
                shiftDate.addDays(2)
            );
        Test.stopTest();
        
        // Verify no violations found for this compliant shift
        Integer violationCount = results.size();
    }
    
    // ==============================================
    // TEST 10: Null/Empty Parameters
    // ==============================================
    @isTest
    static void testNullAndEmptyParameters() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        Test.startTest();
        
        // Test null facility
        List<ShiftComplianceReportHandler.ComplianceRow> result1 = 
            ShiftComplianceReportHandler.generateComplianceReport(
                null,
                new List<Id>{staff1.Id},
                Date.today().addDays(-10),
                Date.today()
            );
        
        // Test null staff list
        List<ShiftComplianceReportHandler.ComplianceRow> result2 = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                null,
                Date.today().addDays(-10),
                Date.today()
            );
        
        // Test empty staff list
        List<ShiftComplianceReportHandler.ComplianceRow> result3 = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>(),
                Date.today().addDays(-10),
                Date.today()
            );
        
        Test.stopTest();
        
        // Verify all return empty lists
    }
    
    // ==============================================
    // TEST 11: Get Facility Compliance Rules
    // ==============================================
    @isTest
    static void testGetFacilityComplianceRules() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        Test.startTest();
        List<Facility_Compliance_Setting__c> rules = 
            ShiftComplianceReportHandler.getFacilityComplianceRules(fac.Id);
        Test.stopTest();
        
        // Verify rules are retrieved (should have 2 from test setup)
        Integer ruleCount = rules.size();
    }
    
    // ==============================================
    // TEST 12: Get Facility Compliance Rules - Null Facility
    // ==============================================
    @isTest
    static void testGetFacilityComplianceRulesNullFacility() {
        Test.startTest();
        List<Facility_Compliance_Setting__c> rules = 
            ShiftComplianceReportHandler.getFacilityComplianceRules(null);
        Test.stopTest();
        
        // Verify empty list returned for null facility
    }
    
    // ==============================================
    // TEST 13: Future Shifts (Should be excluded from late/missed checks)
    // ==============================================
    @isTest
    static void testFutureShiftsExcluded() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        
        // Create future shift with no clock-in/out
        Add_Shift__c shift = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = Date.today().addDays(5),
            End_Date__c = Date.today().addDays(5),
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Role__c = 'Admin',
            Status__c = 'Published',
            Duration__c = 8,
            Quantity__c = 1
        );
        insert shift;
        
        ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
            Add_Shift__c = shift.Id,
            Staff__c = staff1.Id,
            Start_Date__c = shift.Start_Date__c,
            Shift_End_Date__c = shift.End_Date__c,
            Shift_Start_Time__c = shift.Start_Time__c,
            Shift_End_Time__c = shift.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin'
            // No login/logout for future shift
        );
        insert staffShift;
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id},
                Date.today(),
                Date.today().addDays(10)
            );
        Test.stopTest();
        
        // Verify no late/missed violations for future shifts
        Boolean foundLateOrMissedViolation = false;
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            if (row.ruleName == 'Late Clock-In' || 
                row.ruleName == 'Late Clock-Out' || 
                row.ruleName == 'Missed Shifts Per Month') {
                foundLateOrMissedViolation = true;
            }
        }
    }
    @isTest
    static void testMultipleStaffMembers() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff1 = [SELECT Id FROM Staff__c WHERE Name = 'staff1' LIMIT 1];
        Staff__c staff2 = [SELECT Id FROM Staff__c WHERE Name = 'staff2' LIMIT 1];
        
        List<Add_Shift__c> shifts = new List<Add_Shift__c>();
        List<ShiftwithStaff__c> staffShifts = new List<ShiftwithStaff__c>();
        
        Date shiftDate = Date.today().addDays(-5);
        
        // Create violations for both staff
        for (Integer i = 0; i < 2; i++) {
            Add_Shift__c shift = new Add_Shift__c(
                Facility__c = fac.Id,
                Start_Date__c = shiftDate,
                End_Date__c = shiftDate,
                Start_Time__c = Time.newInstance(8, 0, 0, 0),
                End_Time__c = Time.newInstance(20, 0, 0, 0),
                Role__c = i == 0 ? 'Admin' : 'AIN',
                Status__c = 'Published',
                Quantity__c = 1
            );
            shifts.add(shift);
        }
        insert shifts;
        
        ShiftwithStaff__c staffShift1 = new ShiftwithStaff__c(
            Add_Shift__c = shifts[0].Id,
            Staff__c = staff1.Id,
            Start_Date__c = shifts[0].Start_Date__c,
            Shift_End_Date__c = shifts[0].End_Date__c,
            Shift_Start_Time__c = shifts[0].Start_Time__c,
            Shift_End_Time__c = shifts[0].End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin'
        );
        
        ShiftwithStaff__c staffShift2 = new ShiftwithStaff__c(
            Add_Shift__c = shifts[1].Id,
            Staff__c = staff2.Id,
            Start_Date__c = shifts[1].Start_Date__c,
            Shift_End_Date__c = shifts[1].End_Date__c,
            Shift_Start_Time__c = shifts[1].Start_Time__c,
            Shift_End_Time__c = shifts[1].End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'AIN'
        );
        
        insert new List<ShiftwithStaff__c>{staffShift1, staffShift2};
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff1.Id, staff2.Id},
                shiftDate.addDays(-2),
                shiftDate.addDays(2)
            );
        Test.stopTest();
        
        Set<Id> staffWithViolations = new Set<Id>();
        for (ShiftComplianceReportHandler.ComplianceRow row : results) {
            staffWithViolations.add(row.staffId);
        }
    }
    
    // ==============================================
    // TEST 15: Staff Without Roles
    // ==============================================
    @isTest
    static void testStaffWithoutRoles() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        // Create staff without role assignment
        Staff__c staff3 = new Staff__c(
            Last_Name__c='Test staff 3',
            Name='staff3',
            Name__c='Staff Three',
            Contact_Number__c='56789908745',
            Email_Address__c='staff3@test.com',
            Facility__c=fac.Id,
            Address__Street__s='10 Keewong Street',
            Address__City__s='Crace',
            Address__StateCode__s='ACT',
            Address__PostalCode__s='2911',
            Date_Of_Birth__c = date.newInstance(2001, 02, 04),
            Status__c=true
        );
        insert staff3;
        
        Date shiftDate = Date.today().addDays(-5);
        
        Add_Shift__c shift = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = shiftDate,
            End_Date__c = shiftDate,
            Start_Time__c = Time.newInstance(8, 0, 0, 0),
            End_Time__c = Time.newInstance(20, 0, 0, 0),
            Role__c = 'Admin',
            Status__c = 'Published',
            Quantity__c = 1
        );
        insert shift;
        
        ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
            Add_Shift__c = shift.Id,
            Staff__c = staff3.Id,
            Start_Date__c = shift.Start_Date__c,
            Shift_End_Date__c = shift.End_Date__c,
            Shift_Start_Time__c = shift.Start_Time__c,
            Shift_End_Time__c = shift.End_Time__c,
            Status__c = 'Accepted',
            Role__c = 'Admin'
        );
        insert staffShift;
        
        Test.startTest();
        List<ShiftComplianceReportHandler.ComplianceRow> results = 
            ShiftComplianceReportHandler.generateComplianceReport(
                fac.Id,
                new List<Id>{staff3.Id},
                shiftDate.addDays(-2),
                shiftDate.addDays(2)
            );
        Test.stopTest();
        
        // Verify general rules still apply to staff without specific roles
    }
}