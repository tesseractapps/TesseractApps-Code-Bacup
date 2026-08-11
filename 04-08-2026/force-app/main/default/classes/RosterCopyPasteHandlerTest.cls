@IsTest
public class RosterCopyPasteHandlerTest {

    @TestSetup
    static void setupData() {
        TestDataFactory.createBaseData();
    }

    private static User getRunningUser() {
        return [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }

    @IsTest
    static void testPasteSelectedRosters() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            ShiftwithStaff__c shift = [SELECT Id, Add_Shift__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c FROM ShiftwithStaff__c LIMIT 1];
            Services_and_Support_Plan__c service = [SELECT Id, ShiftwithStaff__c FROM Services_and_Support_Plan__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                new List<Id>{ service.Id },
                String.valueOf(Date.today().addDays(7)),
                true,
                true,
                true
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testPasteSelectedRosters_EmptyShiftIds() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                null,
                null,
                String.valueOf(Date.today().addDays(7)),
                true,
                true,
                true
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testPasteSelectedRosters_NoCopyChecklist() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            ShiftwithStaff__c shift = [SELECT Id, Add_Shift__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c FROM ShiftwithStaff__c LIMIT 1];
            Services_and_Support_Plan__c service = [SELECT Id, ShiftwithStaff__c FROM Services_and_Support_Plan__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                new List<Id>{ service.Id },
                String.valueOf(Date.today().addDays(7)),
                false,
                true,
                true
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testPasteSelectedRosters_NoCopyParticipant() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            ShiftwithStaff__c shift = [SELECT Id, Add_Shift__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                null,
                String.valueOf(Date.today().addDays(7)),
                true,
                false,
                true
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testPasteSelectedRosters_NoCopyShiftNotes() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            ShiftwithStaff__c shift = [SELECT Id, Add_Shift__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c FROM ShiftwithStaff__c LIMIT 1];
            Services_and_Support_Plan__c service = [SELECT Id, ShiftwithStaff__c FROM Services_and_Support_Plan__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                new List<Id>{ service.Id },
                String.valueOf(Date.today().addDays(7)),
                true,
                true,
                false
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testPasteSelectedRosters_EmptyServices() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            ShiftwithStaff__c shift = [SELECT Id, Add_Shift__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.pasteSelectedRosters(
                new List<Id>{ shift.Id },
                new List<Id>(),
                String.valueOf(Date.today().addDays(7)),
                true,
                true,
                true
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetMappedDate() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            RosterCopyPasteHandler.getMappedDate(
                Date.today(),
                Date.today().toStartOfWeek(),
                Date.today().addDays(7).toStartOfWeek()
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetMappedDate_WithNull() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            RosterCopyPasteHandler.getMappedDate(
                null,
                Date.today().toStartOfWeek(),
                Date.today().addDays(7).toStartOfWeek()
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetShiftIdsByTemplate() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            ShiftwithStaff__c shift = [SELECT Id, Add_Shift__c, Add_Shift__r.Facility__c, Date__c FROM ShiftwithStaff__c LIMIT 1];
            shift.Template_Id__c = 'TEMP1,TEMP2';
            update shift;
            
            Facility__c facility = [SELECT Id FROM Facility__c WHERE Id = :shift.Add_Shift__r.Facility__c LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.getShiftIdsByTemplate(
                'TEMP1',
                new List<String>{ facility.Id },
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getShiftIdsByTemplate(
                'TEMP3',
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
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetServiceIdsByTemplate() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            ShiftwithStaff__c shift = [SELECT Id, Date__c FROM ShiftwithStaff__c LIMIT 1];
            Services_and_Support_Plan__c service = [SELECT Id, ShiftwithStaff__c FROM Services_and_Support_Plan__c LIMIT 1];
            
            service.Template_Id__c = 'TEMP1,TEMP2';
            update service;
            
            Test.startTest();
            RosterCopyPasteHandler.getServiceIdsByTemplate(
                'TEMP1',
                new List<Id>{ shift.Id },
                String.valueOf(Date.today().addDays(-30))
            );
            RosterCopyPasteHandler.getServiceIdsByTemplate(
                'TEMP3',
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
            Test.stopTest();
        }
    }

    @IsTest
    static void testUnAssignParticipantShifts() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Get a shift and make it accepted so it can be unassigned
            ShiftwithStaff__c shift = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, 
                                       Status__c, Attendence__c, Staff__r.Email_Address__c, Staff__r.Display_Nickname__c,
                                       Staff__r.Organization_Full_Name__c, Staff__r.Facility__r.Organisation__c,
                                       Add_Shift__r.Shift_Type__c, Shift_Start_End_Time__c, Shift_Address__Street__s,
                                       Shift_Address__City__s, Shift_Address__StateCode__s, Shift_Address__CountryCode__s,
                                       Shift_Address__PostalCode__s
                                       FROM ShiftwithStaff__c LIMIT 1];
            
            shift.Status__c = 'Accepted';
            shift.Attendence__c = true;
            update shift;
            
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
            Test.stopTest();
        }
    }

    @IsTest
    static void testReAssignStaffToShifts() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // First create an unassigned shift
            Add_Shift__c addShift = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1];
            Staff__c tempStaff = [SELECT Id FROM Staff__c LIMIT 1];
            
            ShiftwithStaff__c unassignedShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = tempStaff.Id,
                Role__c = 'Admin',
                Status__c = 'Unassigned',
                Attendence__c = false,
                Un_Assigned_Shift__c = true,
                Start_Date__c = addShift.Start_Date__c,
                Shift_End_Date__c = addShift.End_Date__c != null ? addShift.End_Date__c : addShift.Start_Date__c,
                Shift_Start_Time__c = addShift.Start_Time__c,
                Shift_End_Time__c = addShift.End_Time__c,
                 Shift_Day_Name__c = 'Monday',
                Shift_Category__c = 'General'
            );
            insert unassignedShift;
            
            // Get a different staff to assign to
            Staff__c newStaff = [SELECT Id FROM Staff__c WHERE Email_Address__c='manualtesting.20294637@hotmail.com' LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.reAssignStaffToShifts(
                new List<Id>{ unassignedShift.Id },
                newStaff.Id
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testReAssignStaffToShifts_EmptyShiftIds() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            
            Test.startTest();
            try {
                RosterCopyPasteHandler.reAssignStaffToShifts(
                    null,
                    staff.Id
                );
            } catch (Exception e) {
                // Expected exception
            }
            try {
                RosterCopyPasteHandler.reAssignStaffToShifts(
                    new List<Id>(),
                    staff.Id
                );
            } catch (Exception e) {
                // Expected exception
            }
            Test.stopTest();
        }
    }

    @IsTest
    static void testReAssignStaffToShifts_NullStaffId() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            try {
                RosterCopyPasteHandler.reAssignStaffToShifts(
                    new List<Id>{ shift.Id },
                    null
                );
            } catch (Exception e) {
                // Expected exception
            }
            Test.stopTest();
        }
    }

    @IsTest
    static void testSendReAssignmentEmails() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Staff__c newStaff = [SELECT Id, Email_Address__c, Display_Nickname__c FROM Staff__c LIMIT 1];
            ShiftwithStaff__c shift = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, 
                                       Shift_Start_End_Time__c, Shift_Address__Street__s, Shift_Address__City__s, 
                                       Shift_Address__StateCode__s, Shift_Address__CountryCode__s, Shift_Address__PostalCode__s,
                                       Staff__r.Email_Address__c, Staff__r.Display_Nickname__c, Status__c 
                                       FROM ShiftwithStaff__c LIMIT 1];
            
            shift.Shift_Address__Street__s = '8 Keewong Street';
            shift.Shift_Address__City__s = 'Crace';
            shift.Shift_Address__StateCode__s = 'ACT';
            shift.Shift_Address__CountryCode__s = 'AU';
            shift.Shift_Address__PostalCode__s = '2911';
            shift.Status__c = 'Accepted';
            update shift;
            
            ShiftwithStaff__c updatedShift = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, 
                                                Shift_Start_End_Time__c, Shift_Address__Street__s, Shift_Address__City__s, 
                                                Shift_Address__StateCode__s, Shift_Address__CountryCode__s, Shift_Address__PostalCode__s,
                                                Staff__r.Email_Address__c, Staff__r.Display_Nickname__c, Status__c 
                                                FROM ShiftwithStaff__c WHERE Id = :shift.Id LIMIT 1];
            
            Map<Id, String> oldStaffEmailMap = new Map<Id, String>();
            oldStaffEmailMap.put(shift.Id, 'oldstaff@test.com');
            
            Map<Id, String> oldStaffNameMap = new Map<Id, String>();
            oldStaffNameMap.put(shift.Id, 'Old Staff');
            
            Test.startTest();
            RosterCopyPasteHandler.sendReAssignmentEmails(
                new List<ShiftwithStaff__c>{ updatedShift },
                oldStaffEmailMap,
                oldStaffNameMap,
                newStaff,
                'Ashfield Consultants'
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testValidateSetHours() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Staff__c staff = [SELECT Id, Set_Hours__c, Restrict_Set_Hours__c FROM Staff__c LIMIT 1];
            ShiftwithStaff__c shift = [SELECT Id, Start_Date__c, Shift_End_Date__c, Duration__c, Type_of_shift__c, 
                                       Shift_Start_Time__c, Shift_End_Time__c FROM ShiftwithStaff__c LIMIT 1];
            
            staff.Restrict_Set_Hours__c = true;
            staff.Set_Hours__c = 40;
            update staff;
            
            Test.startTest();
            RosterCopyPasteHandler.validateSetHours(
                shift,
                staff.Id,
                shift.Id
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testValidateSetHours_Weekend() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Date saturday = Date.today().toStartOfWeek().addDays(5);
            ShiftwithStaff__c shift = [SELECT Id, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, Duration__c, Type_of_shift__c FROM ShiftwithStaff__c LIMIT 1];
            shift.Start_Date__c = saturday;
            shift.Shift_End_Date__c = saturday;
            update shift;
            
            Test.startTest();
            RosterCopyPasteHandler.validateSetHours(
                shift,
                staff.Id,
                shift.Id
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testValidateSetHours_Sleepover() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            ShiftwithStaff__c shift = [SELECT Id, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, Duration__c, Type_of_shift__c FROM ShiftwithStaff__c LIMIT 1];
            shift.Shift_Day_Name__c = 'Sleepover Shift';
            update shift;
            
            Test.startTest();
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
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Get two shifts with different staff
            List<ShiftwithStaff__c> shiftList = [
                SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c,
                       Staff__r.Display_Nickname__c, Start_time_Formula__c, End_time_formula__c,
                       Status__c, Shift_Rejected__c, Attendence__c
                FROM ShiftwithStaff__c 
                WHERE Status__c NOT IN ('Unassigned','Cancelled') 
                AND Shift_Rejected__c != true
                AND Staff__c != null
                LIMIT 2
            ];
            
            // If less than 2 shifts, create a second one
            if (shiftList.size() < 2) {
                Staff__c staff1 = [SELECT Id FROM Staff__c LIMIT 1];
                Staff__c staff2 = [SELECT Id FROM Staff__c WHERE Id != :staff1.Id LIMIT 1];
                Add_Shift__c addShift = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1];
                
                ShiftwithStaff__c newShift = new ShiftwithStaff__c(
                    Add_Shift__c = addShift.Id,
                    Staff__c = staff2.Id,
                    Role__c = 'Admin',
                    Status__c = 'Accepted',
                    Attendence__c = true,
                    Start_Date__c = addShift.Start_Date__c.addDays(1),
                    Shift_End_Date__c = addShift.End_Date__c != null ? addShift.End_Date__c.addDays(1) : addShift.Start_Date__c.addDays(1),
                    Shift_Start_Time__c = addShift.Start_Time__c,
                    Shift_End_Time__c = addShift.End_Time__c
                );
                insert newShift;
                
                shiftList.add(newShift);
            }
            
            if (!shiftList.isEmpty()) {
                ShiftwithStaff__c shift = shiftList[0];
                Staff__c newStaff = [SELECT Id FROM Staff__c WHERE Email_Address__c='manualtesting.20294637@hotmail.com' LIMIT 1];
                
                Test.startTest();
                RosterCopyPasteHandler.validateSwapOverlap(
                    shift,
                    newStaff.Id,
                    shift.Id
                );
                Test.stopTest();
            }
        }
    }

    @IsTest
    static void testSendShiftSwapNotifications() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            ShiftwithStaff__c shift = [SELECT Id, Staff__c, Staff__r.Email_Address__c, Staff__r.Display_Nickname__c, 
                                       Start_Date__c, Shift_Start_End_Time__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c,
                                       Shift_Address__Street__s, Shift_Address__City__s, Shift_Address__StateCode__s, 
                                       Shift_Address__CountryCode__s, Shift_Address__PostalCode__s FROM ShiftwithStaff__c LIMIT 1];
            
            shift.Shift_Address__Street__s = '8 Keewong Street';
            shift.Shift_Address__City__s = 'Crace';
            shift.Shift_Address__StateCode__s = 'ACT';
            shift.Shift_Address__CountryCode__s = 'AU';
            shift.Shift_Address__PostalCode__s = '2911';
            update shift;
            
            ShiftwithStaff__c updatedShift = [SELECT Id, Staff__c, Staff__r.Email_Address__c, Staff__r.Display_Nickname__c, 
                                               Start_Date__c, Shift_Start_End_Time__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c,
                                               Shift_Address__Street__s, Shift_Address__City__s, Shift_Address__StateCode__s, 
                                               Shift_Address__CountryCode__s, Shift_Address__PostalCode__s FROM ShiftwithStaff__c WHERE Id = :shift.Id LIMIT 1];
            
            Test.startTest();
            RosterCopyPasteHandler.sendShiftSwapNotifications(
                new List<ShiftwithStaff__c>{ updatedShift }
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testSwapShiftStaff() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Get two shifts with different staff
            List<ShiftwithStaff__c> shiftList = [
                SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c, Shift_Start_Time__c, Shift_End_Time__c, 
                       Status__c, Attendence__c, Duration__c, Type_of_shift__c, Shift_Day_Name__c, Day_Name__c,
                       Staff__r.Set_Hours__c, Staff__r.Restrict_Set_Hours__c, Do_you_want_to_set_this_Recurring_Roster__c,
                       Add_Shift__c, Staff__r.Display_Nickname__c, Staff__r.Email_Address__c, Shift_Start_End_Time__c,
                       Shift_Address__Street__s, Shift_Address__City__s, Shift_Address__StateCode__s, 
                       Shift_Address__CountryCode__s, Shift_Address__PostalCode__s,
                       Public_holiday__c, Recur_Holiday__c,
                       Is_long_Morning__c, Is_long_Morning_Next_Day_Start__c, Long_Morning_Start_Date_One__c, Long_Morning_Hourly_Rate__c,
                       Is_Long_Afternoon__c, Is_Long_Afternoon_Next_Day_Start__c, Long_Afternoon_Start_Date_One__c, Long_Afternoon_Hourly_Rate__c,
                       Is_Long_Night_Shift__c, Is_Long_Night_Start_Next_Day__c, Long_Night_Start_Date__c, Long_Night_Hourly_Rate__c,
                       Is_long_Morning_Shift_two__c, Is_Long_Morning_Next_Day_Start_Two__c, Long_Morning_Start_Date_Two__c, Long_Morning_Rate_Two__c,
                       Is_Long_afternoon_shift_two__c, Long_Afternoon_Start_Date_Two__c, Long_Afternoon_Rate_Two__c,
                       (SELECT Id, Service_Users__c FROM Services_and_Support_Plans__r)
                FROM ShiftwithStaff__c 
                WHERE Status__c = 'Accepted' AND Attendence__c = true
                LIMIT 2
            ];
            
            if (shiftList.size() < 2) {
                Staff__c staff1 = [SELECT Id FROM Staff__c LIMIT 1];
                Staff__c staff2 = [SELECT Id FROM Staff__c WHERE Id != :staff1.Id LIMIT 1];
                Add_Shift__c addShift1 = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1];
                Add_Shift__c addShift2 = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1 OFFSET 1];
                
                ShiftwithStaff__c shift1 = new ShiftwithStaff__c(
                    Add_Shift__c = addShift1.Id,
                    Staff__c = staff1.Id,
                    Role__c = 'Admin',
                    Status__c = 'Accepted',
                    Attendence__c = true,
                    Start_Date__c = addShift1.Start_Date__c,
                    Shift_End_Date__c = addShift1.End_Date__c != null ? addShift1.End_Date__c : addShift1.Start_Date__c,
                    Shift_Start_Time__c = addShift1.Start_Time__c,
                    Shift_End_Time__c = addShift1.End_Time__c,
                    Shift_Day_Name__c = 'Monday',
                Shift_Category__c = 'General'
                );
                insert shift1;
                
                ShiftwithStaff__c shift2 = new ShiftwithStaff__c(
                    Add_Shift__c = addShift2.Id,
                    Staff__c = staff2.Id,
                    Role__c = 'Admin',
                    Status__c = 'Accepted',
                    Attendence__c = true,
                    Start_Date__c = addShift2.Start_Date__c,
                    Shift_End_Date__c = addShift2.End_Date__c != null ? addShift2.End_Date__c : addShift2.Start_Date__c,
                    Shift_Start_Time__c = addShift2.Start_Time__c,
                    Shift_End_Time__c = addShift2.End_Time__c,
                    Shift_Day_Name__c = 'Monday',
                Shift_Category__c = 'General'
                );
                insert shift2;
                
                shiftList = new List<ShiftwithStaff__c>{ shift1, shift2 };
            }
            
            Test.startTest();
            RosterCopyPasteHandler.swapShiftStaff(
                shiftList[0].Id,
                shiftList[1].Id
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testSwapShiftStaff_SameShift() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
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

    @IsTest
    static void testSwapShiftStaff_InvalidIds() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            RosterCopyPasteHandler.swapShiftStaff(
                null,
                null
            );
            Test.stopTest();
        }
    }

    @IsTest
    static void testReAssignStaffToShifts_WithOverlap() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Create an unassigned shift
            Add_Shift__c addShift = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c FROM Add_Shift__c LIMIT 1];
            Staff__c tempStaff = [SELECT Id FROM Staff__c LIMIT 1];
            
            ShiftwithStaff__c unassignedShift = new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = tempStaff.Id,
                Role__c = 'Admin',
                Status__c = 'Unassigned',
                Attendence__c = false,
                Un_Assigned_Shift__c = true,
                Start_Date__c = addShift.Start_Date__c,
                Shift_End_Date__c = addShift.End_Date__c != null ? addShift.End_Date__c : addShift.Start_Date__c,
                Shift_Start_Time__c = addShift.Start_Time__c,
                Shift_End_Time__c = addShift.End_Time__c,
                Shift_Day_Name__c = 'Monday',
                Shift_Category__c = 'General'
            );
            insert unassignedShift;
            
            // Get a staff with an existing shift to create overlap
            List<ShiftwithStaff__c> existingShift = [SELECT Id, Staff__c FROM ShiftwithStaff__c WHERE Staff__c != null LIMIT 1];
            
            if (!existingShift.isEmpty()) {
                Test.startTest();
                RosterCopyPasteHandler.reAssignStaffToShifts(
                    new List<Id>{ unassignedShift.Id },
                    existingShift[0].Staff__c
                );
                Test.stopTest();
            }
        }
    }
}