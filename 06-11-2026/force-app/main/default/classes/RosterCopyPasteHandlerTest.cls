@IsTest
public class RosterCopyPasteHandlerTest {
    
    @TestSetup
    static void setupData() {
        RosterCopyPasteHandlerTestData.createTestData();
    }
    
    private static User getTestUser() {
        return [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    // =============================================
    // PASTE METHOD - POSITIVE SCENARIOS
    // =============================================
    @IsTest
    static void testPasteSelectedRosters() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                null,
                String.valueOf(Date.today().addDays(7)),
                true,
                true,
                true,
                new List<Id>(),
                new List<Id>()
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testPasteSelectedRosters_EmptyShiftIds() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                null,
                null,
                String.valueOf(Date.today().addDays(7)),
                true,
                true,
                true,
                new List<Id>(),
                new List<Id>()
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testPasteSelectedRosters_WithSkippedShifts() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                null,
                String.valueOf(Date.today().addDays(7)),
                true,
                true,
                true,
                new List<Id>{ shift.Id },
                new List<Id>()
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testPasteSelectedRosters_WithDestinationDelete() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                null,
                String.valueOf(Date.today().addDays(7)),
                true,
                true,
                true,
                new List<Id>(),
                new List<Id>{ shift.Id }
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testPasteSelectedRosters_NoCopyChecklist() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                null,
                String.valueOf(Date.today().addDays(7)),
                false,
                true,
                true,
                new List<Id>(),
                new List<Id>()
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testPasteSelectedRosters_NoCopyParticipant() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                null,
                String.valueOf(Date.today().addDays(7)),
                true,
                false,
                true,
                new List<Id>(),
                new List<Id>()
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testPasteSelectedRosters_NoCopyShiftNotes() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                null,
                String.valueOf(Date.today().addDays(7)),
                true,
                true,
                false,
                new List<Id>(),
                new List<Id>()
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // GET MAPPED DATE - POSITIVE & NEGATIVE
    // =============================================
    @IsTest
    static void testGetMappedDate() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Test.startTest();
            RosterCopyPasteHandler.getMappedDate(
                Date.today(),
                Date.today().toStartOfWeek(),
                Date.today().addDays(7).toStartOfWeek()
            );
            RosterCopyPasteHandler.getMappedDate(
                null,
                Date.today().toStartOfWeek(),
                Date.today().addDays(7).toStartOfWeek()
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // GET SHIFT IDS BY TEMPLATE - POSITIVE & NEGATIVE
    // =============================================
    @IsTest
    static void testGetShiftIdsByTemplate() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.getShiftIdsByTemplate(
                'TEMP1',
                new List<String>{ facility.Id },
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getShiftIdsByTemplate(
                '',
                new List<String>{ facility.Id },
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getShiftIdsByTemplate(
                'TEMP1',
                null,
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getShiftIdsByTemplate(
                'TEMP1',
                new List<String>(),
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getShiftIdsByTemplate(
                'TEMP3',
                new List<String>{ facility.Id },
                String.valueOf(Date.today().addDays(-30))
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // GET SERVICE IDS BY TEMPLATE - POSITIVE & NEGATIVE
    // =============================================
    @IsTest
    static void testGetServiceIdsByTemplate() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.getServiceIdsByTemplate(
                'TEMP1',
                new List<Id>{ shift.Id },
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getServiceIdsByTemplate(
                '',
                new List<Id>{ shift.Id },
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getServiceIdsByTemplate(
                'TEMP1',
                null,
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getServiceIdsByTemplate(
                'TEMP1',
                new List<Id>(),
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getServiceIdsByTemplate(
                'TEMP3',
                new List<Id>{ shift.Id },
                String.valueOf(Date.today().addDays(-30))
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // UNASSIGN - POSITIVE & NEGATIVE
    // =============================================
    @IsTest
    static void testUnAssignParticipantShifts() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id, Staff__c, Staff__r.Email_Address__c, Staff__r.Display_Nickname__c,
                                       Staff__r.Organization_Full_Name__c, Staff__r.Facility__r.Organisation__c,
                                       Add_Shift__r.Shift_Type__c, Shift_Start_End_Time__c,
                                       Shift_Address__Street__s, Shift_Address__City__s, 
                                       Shift_Address__StateCode__s, Shift_Address__CountryCode__s,
                                       Shift_Address__PostalCode__s, Start_Date__c,
                                       (SELECT Id, Status__c, Service_Users__c, Un_Assigned_Service__c,
                                        Client__r.Email__c, Client__r.Display_Nickname__c
                                        FROM Services_and_Support_Plans__r)
                                      FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.unAssignParticipantShifts(
                new List<Id>{ shift.Id }
            );
            RosterCopyPasteHandler.unAssignParticipantShifts(
                null
            );
            RosterCopyPasteHandler.unAssignParticipantShifts(
                new List<Id>()
            );
            RosterCopyPasteHandler.unAssignParticipantShifts(
                new List<Id>{ 'a0B000000000001' }
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // REASSIGN - POSITIVE & NEGATIVE
    // =============================================
    @IsTest
    static void testReAssignStaffToShifts() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, 
                                       Shift_End_Time__c, Staff__r.Organization_Full_Name__c,
                                       Shift_Address__Street__s, Shift_Address__City__s, 
                                       Shift_Address__StateCode__s, Shift_Address__CountryCode__s,
                                       Shift_Address__PostalCode__s, Shift_Start_End_Time__c, Status__c, 
                                       Attendence__c, Un_Assigned_Shift__c, Day_Name__c, Type_of_shift__c,
                                       Role__c, Add_Shift__c, Do_you_want_to_set_this_Recurring_Roster__c,
                                       Staff_Final_Hourly_Rate__c, Is_long_Morning__c, Is_Long_Afternoon__c,
                                       Is_Long_Night_Shift__c, Is_long_Morning_Shift_two__c,
                                       Is_Long_afternoon_shift_two__c, Is_long_Morning_Next_Day_Start__c,
                                       Is_Long_Afternoon_Next_Day_Start__c, Is_Long_Night_Start_Next_Day__c,
                                       Is_Long_Morning_Next_Day_Start_Two__c, Long_Morning_Start_Date_One__c,
                                       Long_Afternoon_Start_Date_One__c, Long_Night_Start_Date__c,
                                       Long_Morning_Start_Date_Two__c, Long_Afternoon_Start_Date_Two__c,
                                       Long_Morning_Hourly_Rate__c, Long_Afternoon_Hourly_Rate__c,
                                       Long_Night_Hourly_Rate__c, Long_Morning_Rate_Two__c,
                                       Long_Afternoon_Rate_Two__c, Shift_Day_Name__c,
                                       (SELECT Id, Service_Users__c FROM Services_and_Support_Plans__r)
                                      FROM ShiftwithStaff__c LIMIT 1];
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            
            Test.startTest();
            try {
                RosterCopyPasteHandler.reAssignStaffToShifts(
                    new List<Id>{ shift.Id },
                    staff.Id
                );
            } catch (Exception e) {}
            
            try {
                RosterCopyPasteHandler.reAssignStaffToShifts(
                    new List<Id>{ shift.Id },
                    shift.Staff__c
                );
            } catch (Exception e) {}
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testReAssignStaffToShifts_EmptyShiftIds() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            
            Test.startTest();
            try {
                RosterCopyPasteHandler.reAssignStaffToShifts(
                    null,
                    staff.Id
                );
            } catch (Exception e) {}
            try {
                RosterCopyPasteHandler.reAssignStaffToShifts(
                    new List<Id>(),
                    staff.Id
                );
            } catch (Exception e) {}
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testReAssignStaffToShifts_NullStaffId() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            try {
                RosterCopyPasteHandler.reAssignStaffToShifts(
                    new List<Id>{ shift.Id },
                    null
                );
            } catch (Exception e) {}
            Test.stopTest();
        }
    }
    
    // =============================================
    // VALIDATE METHODS - POSITIVE & NEGATIVE
    // =============================================
    @IsTest
    static void testValidateSetHours() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Staff__c staff = [SELECT Id, Set_Hours__c, Restrict_Set_Hours__c FROM Staff__c LIMIT 1];
            ShiftwithStaff__c shift = [SELECT Id, Start_Date__c, Shift_End_Date__c, Duration__c, Type_of_shift__c, 
                                       Shift_Start_Time__c, Shift_End_Time__c FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.validateSetHours(
                shift,
                staff.Id,
                shift.Id
            );
            
            staff.Restrict_Set_Hours__c = true;
            staff.Set_Hours__c = 40;
            update staff;
            RosterCopyPasteHandler.validateSetHours(
                shift,
                staff.Id,
                shift.Id
            );
            
            shift.Start_Date__c = Date.today().toStartOfWeek().addDays(5);
            shift.Shift_End_Date__c = Date.today().toStartOfWeek().addDays(5);
            RosterCopyPasteHandler.validateSetHours(
                shift,
                staff.Id,
                shift.Id
            );
            
            shift.Shift_Category__c = 'Sleepover Shift';
            RosterCopyPasteHandler.validateSetHours(
                shift,
                staff.Id,
                shift.Id
            );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testValidateSwapOverlap() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c,
                                       Staff__r.Display_Nickname__c, Start_time_Formula__c, End_time_formula__c,
                                       Status__c, Shift_Rejected__c, Attendence__c FROM ShiftwithStaff__c LIMIT 1];
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.validateSwapOverlap(
                shift,
                staff.Id,
                shift.Id
            );
            
            ShiftwithStaff__c shift2 = [SELECT Id, Staff__c FROM ShiftwithStaff__c WHERE Id != :shift.Id LIMIT 1];
            RosterCopyPasteHandler.validateSwapOverlap(
                shift,
                shift2.Staff__c,
                shift2.Id
            );
            
            shift.Shift_End_Date__c = null;
            RosterCopyPasteHandler.validateSwapOverlap(
                shift,
                staff.Id,
                shift.Id
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // SWAP SHIFT - POSITIVE SCENARIOS
    // =============================================
    
    // Test 1: Successful swap with 2 valid shifts
    // Test 1: Successful swap with 2 valid shifts
    @IsTest
    static void testSwapShiftStaff_Success() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            // Get 2 shifts with different staff
            List<ShiftwithStaff__c> shiftList = [
                SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, 
                       Shift_Start_Time__c, Shift_End_Time__c, Status__c, 
                       Attendence__c, Duration__c, Type_of_shift__c,
                       Shift_Day_Name__c, Day_Name__c,
                       Staff__r.Set_Hours__c, Staff__r.Restrict_Set_Hours__c,
                       Do_you_want_to_set_this_Recurring_Roster__c,
                       Add_Shift__c, Staff__r.Display_Nickname__c,
                       Staff__r.Email_Address__c, Shift_Start_End_Time__c,
                       Shift_Address__Street__s, Shift_Address__City__s,
                       Shift_Address__StateCode__s, Shift_Address__CountryCode__s,
                       Shift_Address__PostalCode__s, Public_holiday__c,
                       Recur_Holiday__c, Is_long_Morning__c,
                       Is_long_Morning_Next_Day_Start__c,
                       Long_Morning_Start_Date_One__c,
                       Long_Morning_Hourly_Rate__c,
                       Is_Long_Afternoon__c,
                       Is_Long_Afternoon_Next_Day_Start__c,
                       Long_Afternoon_Start_Date_One__c,
                       Long_Afternoon_Hourly_Rate__c,
                       Is_Long_Night_Shift__c,
                       Is_Long_Night_Start_Next_Day__c,
                       Long_Night_Start_Date__c,
                       Long_Night_Hourly_Rate__c,
                       Is_long_Morning_Shift_two__c,
                       Is_Long_Morning_Next_Day_Start_Two__c,
                       Long_Morning_Start_Date_Two__c,
                       Long_Morning_Rate_Two__c,
                       Is_Long_afternoon_shift_two__c,
                       Long_Afternoon_Start_Date_Two__c,
                       Long_Afternoon_Rate_Two__c,
                       (SELECT Id, Service_Users__c FROM Services_and_Support_Plans__r)
                FROM ShiftwithStaff__c 
                WHERE Status__c = 'Accepted' 
                AND Attendence__c = true
                AND Staff__c != null
                LIMIT 2
            ];
            
            // If less than 2 shifts, create additional shifts with different staff
            if (shiftList.size() < 2) {
                List<Staff__c> staffList = [SELECT Id FROM Staff__c LIMIT 2];
                if (staffList.size() < 2) {
                    // Get facility reference
                    Facility__c facility = [SELECT Id, Address__City__s, Address__Street__s, Address__StateCode__s, 
                                            Address__PostalCode__s, Address__CountryCode__s FROM Facility__c LIMIT 1];
                    
                    // Create another staff if needed
                    Staff__c newStaff = new Staff__c(
                        Last_Name__c = 'Test Staff 2',
                        Name = 'Test Staff 2',
                        Name__c = 'TS2',
                        Email_Address__c = 'test.staff2.' + System.currentTimeMillis() + '@test.com',
                        Contact_Number__c = '1234567890',
                        Facility__c = facility.Id,
                        Address__City__s = facility.Address__City__s,
                        Address__Street__s = facility.Address__Street__s,
                        Address__StateCode__s = facility.Address__StateCode__s,
                        Address__PostalCode__s = facility.Address__PostalCode__s,
                        Address__CountryCode__s = facility.Address__CountryCode__s,
                        role__c = 'Admin',
                        Status__c = true,
                        Restrict_Set_Hours__c = false,
                        Set_Hours__c = 40,
                        Working_Hours_Rate__c = 50,
                        Final_Overall_Rate__c = 150,
                        Saturday_Hourly_Rate__c = 130,
                        Sunday_Hourly_Rate__c = 50,
                        Residency_Type__c = 'Australian',
                        Type__c = 'Visa Status',
                        Expiry_Date__c = Date.newInstance(2025, 12, 31),
                        Date_Of_Birth__c = Date.newInstance(1990, 01, 01)
                    );
                    insert newStaff;
                    staffList.add(newStaff);
                }
                
                Add_Shift__c addShift = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1];
                
                // Create shift 1
                ShiftwithStaff__c shift1 = new ShiftwithStaff__c(
                    Add_Shift__c = addShift.Id,
                    Staff__c = staffList[0].Id,
                    Role__c = 'Admin',
                    Status__c = 'Accepted',
                    Attendence__c = true,
                    Start_Date__c = Date.today(),
                    Shift_End_Date__c = Date.today(),
                    Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
                    Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
                    Shift_Day_Name__c = 'Monday',
                    Shift_Category__c = 'General'
                );
                insert shift1;
                
                // Create shift 2
                ShiftwithStaff__c shift2 = new ShiftwithStaff__c(
                    Add_Shift__c = addShift.Id,
                    Staff__c = staffList[1].Id,
                    Role__c = 'Admin',
                    Status__c = 'Accepted',
                    Attendence__c = true,
                    Start_Date__c = Date.today().addDays(1),
                    Shift_End_Date__c = Date.today().addDays(1),
                    Shift_Start_Time__c = Time.newInstance(10, 0, 0, 0),
                    Shift_End_Time__c = Time.newInstance(18, 0, 0, 0),
                    Shift_Day_Name__c = 'Tuesday',
                    Shift_Category__c = 'General'
                );
                insert shift2;
                
                shiftList = new List<ShiftwithStaff__c>{ shift1, shift2 };
            }
            
            if (shiftList.size() >= 2) {
                Test.startTest();
                String result = RosterCopyPasteHandler.swapShiftStaff(
                    shiftList[0].Id,
                    shiftList[1].Id
                );
                System.debug('Swap Result: ' + result);
                Test.stopTest();
            }
        }
    }
    
    // Test 2: Overlap validation failure
    @IsTest
    static void testSwapShiftStaff_OverlapFailure() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            // Get a shift with a staff member
            ShiftwithStaff__c shift1 = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, 
                                        Shift_Start_Time__c, Shift_End_Time__c, Status__c, 
                                        Attendence__c, Duration__c, Type_of_shift__c,
                                        Shift_Day_Name__c, Day_Name__c,
                                        Staff__r.Set_Hours__c, Staff__r.Restrict_Set_Hours__c,
                                        Add_Shift__c, Shift_Address__Street__s, Shift_Address__City__s,
                                        Shift_Address__StateCode__s, Shift_Address__CountryCode__s,
                                        Shift_Address__PostalCode__s
                                       FROM ShiftwithStaff__c 
                                       WHERE  Attendence__c = true
                                       LIMIT 1];
            
            // Create an overlapping shift for the same staff on the same day
            ShiftwithStaff__c overlappingShift = new ShiftwithStaff__c(
                Add_Shift__c = shift1.Add_Shift__c,
                Staff__c = shift1.Staff__c,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Attendence__c = true,
                Start_Date__c = shift1.Start_Date__c,
                Shift_End_Date__c = shift1.Shift_End_Date__c,
                Shift_Start_Time__c = Time.newInstance(12, 0, 0, 0),
                Shift_End_Time__c = Time.newInstance(20, 0, 0, 0),
                Shift_Day_Name__c = shift1.Shift_Day_Name__c,
                Shift_Category__c = 'General'
            );
            insert overlappingShift;
            
            // Get another shift with different staff
            ShiftwithStaff__c shift2 = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, 
                                        Shift_Start_Time__c, Shift_End_Time__c, Status__c, 
                                        Attendence__c, Duration__c, Type_of_shift__c,
                                        Shift_Day_Name__c, Day_Name__c,
                                        Staff__r.Set_Hours__c, Staff__r.Restrict_Set_Hours__c,
                                        Add_Shift__c, Shift_Address__Street__s, Shift_Address__City__s,
                                        Shift_Address__StateCode__s, Shift_Address__CountryCode__s,
                                        Shift_Address__PostalCode__s
                                       FROM ShiftwithStaff__c 
                                       WHERE Id != :shift1.Id 
                                       AND Id != :overlappingShift.Id
                          
                                       AND Attendence__c = true
                                       LIMIT 1];
            
            if (shift2 != null) {
                Test.startTest();
                String result = RosterCopyPasteHandler.swapShiftStaff(
                    shift1.Id,
                    shift2.Id
                );
                // This should return an overlap error message
                System.debug('Swap Result with Overlap: ' + result);
                Test.stopTest();
            }
        }
    }
    
    // Test 3: Set hours validation failure
    @IsTest
    static void testSwapShiftStaff_SetHoursFailure() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            // Get a staff with restrict set hours enabled
            Staff__c staff = [SELECT Id, Set_Hours__c, Restrict_Set_Hours__c FROM Staff__c LIMIT 1];
            staff.Restrict_Set_Hours__c = true;
            staff.Set_Hours__c = 10;
            update staff;
            
            // Get 2 shifts for this staff
            List<ShiftwithStaff__c> shiftList = [
                SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, 
                       Shift_Start_Time__c, Shift_End_Time__c, Status__c, 
                       Attendence__c, Duration__c, Type_of_shift__c,
                       Shift_Day_Name__c, Day_Name__c,
                       Staff__r.Set_Hours__c, Staff__r.Restrict_Set_Hours__c,
                       Add_Shift__c, Shift_Address__Street__s, Shift_Address__City__s,
                       Shift_Address__StateCode__s, Shift_Address__CountryCode__s,
                       Shift_Address__PostalCode__s
                FROM ShiftwithStaff__c 
                WHERE Staff__c = :staff.Id
                AND Status__c = 'Accepted' 
                AND Attendence__c = true
                LIMIT 2
            ];
            
            // If less than 2 shifts, create another one
            if (shiftList.size() < 2) {
                Add_Shift__c addShift = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1];
                ShiftwithStaff__c newShift = new ShiftwithStaff__c(
                    Add_Shift__c = addShift.Id,
                    Staff__c = staff.Id,
                    Role__c = 'Admin',
                    Status__c = 'Accepted',
                    Attendence__c = true,
                    Start_Date__c = Date.today().addDays(2),
                    Shift_End_Date__c = Date.today().addDays(2),
                    Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
                    Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
                    Shift_Day_Name__c = 'Wednesday',
                    Shift_Category__c = 'General'
                );
                insert newShift;
                shiftList.add(newShift);
            }
            
            // Get another staff to swap with
            Staff__c otherStaff = [SELECT Id FROM Staff__c   LIMIT 1];
            
            if (shiftList.size() >= 1 && otherStaff != null) {
                // Create a shift for other staff
                Add_Shift__c addShift = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1];
                ShiftwithStaff__c otherShift = new ShiftwithStaff__c(
                    Add_Shift__c = addShift.Id,
                    Staff__c = otherStaff.Id,
                    Role__c = 'Admin',
                    Status__c = 'Accepted',
                    Attendence__c = true,
                    Start_Date__c = Date.today().addDays(3),
                    Shift_End_Date__c = Date.today().addDays(3),
                    Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
                    Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
                    Shift_Day_Name__c = 'Thursday',
                    Shift_Category__c = 'General'
                );
                insert otherShift;
                
                Test.startTest();
                String result = RosterCopyPasteHandler.swapShiftStaff(
                    shiftList[0].Id,
                    otherShift.Id
                );
                // This should return a set hours error message
                System.debug('Swap Result with Set Hours: ' + result);
                Test.stopTest();
            }
        }
    }
    
    // Test 4: Same shift
    @IsTest
    static void testSwapShiftStaff_SameShift() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, 
                                       Status__c, Attendence__c, Duration__c, Type_of_shift__c, Shift_Day_Name__c, Day_Name__c,
                                       Staff__r.Set_Hours__c, Staff__r.Restrict_Set_Hours__c, Do_you_want_to_set_this_Recurring_Roster__c,
                                       Add_Shift__c, Staff__r.Display_Nickname__c, Staff__r.Email_Address__c, Shift_Start_End_Time__c,
                                       Shift_Address__Street__s, Shift_Address__City__s, Shift_Address__StateCode__s, 
                                       Shift_Address__CountryCode__s, Shift_Address__PostalCode__s,
                                       (SELECT Id, Service_Users__c FROM Services_and_Support_Plans__r)
                                       FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.swapShiftStaff(
                shift.Id,
                shift.Id
            );
            Test.stopTest();
        }
    }
    
    // Test 5: Invalid IDs
    @IsTest
    static void testSwapShiftStaff_InvalidIds() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Test.startTest();
            RosterCopyPasteHandler.swapShiftStaff(
                null,
                null
            );
            RosterCopyPasteHandler.swapShiftStaff(
                'a0B000000000001',
                'a0B000000000002'
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // SEND REASSIGNMENT EMAILS - POSITIVE & NEGATIVE
    // =============================================
    @IsTest
    static void testSendReAssignmentEmails() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id, Staff__c, Start_Date__c, Shift_Start_End_Time__c,
                                       Shift_Address__Street__s, Shift_Address__City__s,
                                       Shift_Address__StateCode__s, Shift_Address__CountryCode__s,
                                       Shift_Address__PostalCode__s,
                                       Staff__r.Email_Address__c, Staff__r.Display_Nickname__c
                                      FROM ShiftwithStaff__c LIMIT 1];
            
            Staff__c newStaff = [SELECT Id, Email_Address__c, Display_Nickname__c FROM Staff__c LIMIT 1];
            
            Map<Id, String> oldStaffEmailMap = new Map<Id, String>();
            oldStaffEmailMap.put(shift.Id, 'oldstaff@test.com');
            
            Map<Id, String> oldStaffNameMap = new Map<Id, String>();
            oldStaffNameMap.put(shift.Id, 'Old Staff');
            
            Test.startTest();
            RosterCopyPasteHandler.sendReAssignmentEmails(
                new List<ShiftwithStaff__c>{ shift },
                oldStaffEmailMap,
                oldStaffNameMap,
                newStaff,
                'Ashfield Consultants'
            );
            
            RosterCopyPasteHandler.sendReAssignmentEmails(
                new List<ShiftwithStaff__c>(),
                oldStaffEmailMap,
                oldStaffNameMap,
                newStaff,
                'Ashfield Consultants'
            );
            
            RosterCopyPasteHandler.sendReAssignmentEmails(
                new List<ShiftwithStaff__c>{ shift },
                oldStaffEmailMap,
                oldStaffNameMap,
                null,
                'Ashfield Consultants'
            );
            Test.stopTest();
        }
    }
    
    // =============================================
    // SEND SHIFT SWAP NOTIFICATIONS - POSITIVE & NEGATIVE
    // =============================================
    @IsTest
    static void testSendShiftSwapNotifications() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            ShiftwithStaff__c shift = [SELECT Id, Staff__c, Start_Date__c, Shift_Start_End_Time__c,
                                       Shift_Address__Street__s, Shift_Address__City__s,
                                       Shift_Address__StateCode__s, Shift_Address__CountryCode__s,
                                       Shift_Address__PostalCode__s,
                                       Staff__r.Email_Address__c, Staff__r.Display_Nickname__c
                                      FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.sendShiftSwapNotifications(
                new List<ShiftwithStaff__c>{ shift }
            );
            RosterCopyPasteHandler.sendShiftSwapNotifications(
                new List<ShiftwithStaff__c>()
            );
            RosterCopyPasteHandler.sendShiftSwapNotifications(
                null
            );
            Test.stopTest();
        }
    }
}