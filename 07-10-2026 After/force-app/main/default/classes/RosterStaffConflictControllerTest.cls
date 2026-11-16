@IsTest
public class RosterStaffConflictControllerTest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
    }
    
    @IsTest
    static void testCheckStaffConflicts_Success() {
        // Get running user
        User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Get test data
            Staff__c staff = [SELECT Id, Set_Hours__c, Restrict_Set_Hours__c, Facility__r.Organisation__c 
                              FROM Staff__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            // Prepare test parameters
            List<Id> staffIds = new List<Id>{staff.Id};
            String startDate = '2025-07-01';
            String endDate = '2025-07-01';
            String startTimeStr = '09:00:00';
            String endTimeStr = '17:00:00';
            Id facilityId = facility.Id;
            String shiftRole = 'Admin';
            String shiftType = 'General';
            Id currentShiftId = null;
            List<String> otherGroupShiftShiftIds = new List<String>();
            
            // Call the method
            Test.startTest();
            Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                RosterStaffConflictController.checkStaffConflicts(
                    staffIds, startDate, endDate, startTimeStr, endTimeStr,
                    facilityId, shiftRole, shiftType,
                    currentShiftId, otherGroupShiftShiftIds
                );
            Test.stopTest();
            
           
        }
    }
    
    @IsTest
    static void testCheckStaffConflicts_EmptyStaffIds() {
         User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Test with empty staff IDs
            List<Id> staffIds = new List<Id>();
            String startDate = '2025-07-01';
            String endDate = '2025-07-01';
            String startTimeStr = '09:00:00';
            String endTimeStr = '17:00:00';
            Id facilityId = null;
            String shiftRole = '';
            String shiftType = 'General';
            Id currentShiftId = null;
            List<String> otherGroupShiftShiftIds = new List<String>();
            
            Test.startTest();
            Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                RosterStaffConflictController.checkStaffConflicts(
                    staffIds, startDate, endDate, startTimeStr, endTimeStr,
                    facilityId, shiftRole, shiftType,
                    currentShiftId, otherGroupShiftShiftIds
                );
            Test.stopTest();
          
            
        }
    }
    
    @IsTest
    static void testCheckStaffConflicts_NullStaffIds() {
         User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Test with null staff IDs
            List<Id> staffIds = null;
            String startDate = '2025-07-01';
            String endDate = '2025-07-01';
            String startTimeStr = '09:00:00';
            String endTimeStr = '17:00:00';
            Id facilityId = null;
            String shiftRole = '';
            String shiftType = 'General';
            Id currentShiftId = null;
            List<String> otherGroupShiftShiftIds = new List<String>();
            
            Test.startTest();
            Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                RosterStaffConflictController.checkStaffConflicts(
                    staffIds, startDate, endDate, startTimeStr, endTimeStr,
                    facilityId, shiftRole, shiftType,
                    currentShiftId, otherGroupShiftShiftIds
                );
            Test.stopTest();
            
           
            
        }
    }
    
    @IsTest
    static void testCheckStaffConflicts_ShiftOverlap() {
        User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Get test data
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            
            // Get shift with staff that has valid dates
            List<ShiftwithStaff__c> shiftWithStaffList = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c,
                                                Shift_Start_Time__c, Shift_End_Time__c 
                                                FROM ShiftwithStaff__c 
                                                WHERE Staff__c = :staff.Id 
                                                AND Shift_End_Date__c != null 
                                                AND Shift_End_Time__c != null
                                                LIMIT 1];
            
            if (shiftWithStaffList.isEmpty()) {
                // Create a valid shift with staff
                Add_Shift__c addShift = [SELECT Id, Start_Date__c, End_Date__c, Start_Time__c, End_Time__c 
                                        FROM Add_Shift__c LIMIT 1];
                ShiftwithStaff__c newShift = new ShiftwithStaff__c(
                    Add_Shift__c = addShift.Id,
                    Staff__c = staff.Id,
                    Role__c = 'Admin',
                    Status__c = 'Accepted',
                    Attendence__c = true,
                    Start_Date__c = addShift.Start_Date__c,
                    Shift_Start_Time__c = addShift.Start_Time__c,
                    Shift_End_Date__c = addShift.End_Date__c != null ? addShift.End_Date__c : addShift.Start_Date__c,
                    Shift_End_Time__c = addShift.End_Time__c
                );
                insert newShift;
                
                // Prepare test parameters - create a shift that overlaps with existing
                List<Id> staffIds = new List<Id>{staff.Id};
                String startDate = '2025-07-01';
                String endDate = '2025-07-01';
                String startTimeStr = '09:00:00';
                String endTimeStr = '17:00:00';
                Id facilityId = null;
                String shiftRole = 'Admin';
                String shiftType = 'General';
                Id currentShiftId = null;
                List<String> otherGroupShiftShiftIds = new List<String>();
                
                Test.startTest();
                Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                    RosterStaffConflictController.checkStaffConflicts(
                        staffIds, startDate, endDate, startTimeStr, endTimeStr,
                        facilityId, shiftRole, shiftType,
                        currentShiftId, otherGroupShiftShiftIds
                    );
                Test.stopTest();
                
               
                
            } else {
                ShiftwithStaff__c shiftWithStaff = shiftWithStaffList[0];
                
                // Prepare test parameters - create a shift that overlaps with existing
                List<Id> staffIds = new List<Id>{staff.Id};
                String startDate = '2025-07-01';
                String endDate = '2025-07-01';
                String startTimeStr = '09:00:00';
                String endTimeStr = '17:00:00';
                Id facilityId = null;
                String shiftRole = 'Admin';
                String shiftType = 'General';
                Id currentShiftId = null;
                List<String> otherGroupShiftShiftIds = new List<String>();
                
                Test.startTest();
                Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                    RosterStaffConflictController.checkStaffConflicts(
                        staffIds, startDate, endDate, startTimeStr, endTimeStr,
                        facilityId, shiftRole, shiftType,
                        currentShiftId, otherGroupShiftShiftIds
                    );
                Test.stopTest();
                
                
            }
        }
    }
    
    @IsTest
    static void testCheckShiftOverlap_WithCurrentShiftId() {
        User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Get test data
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            
            // Get shift with staff that has valid dates
            List<ShiftwithStaff__c> shiftWithStaffList = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c,
                                                Shift_Start_Time__c, Shift_End_Time__c 
                                                FROM ShiftwithStaff__c 
                                                WHERE Staff__c = :staff.Id 
                                                AND Shift_End_Date__c != null 
                                                AND Shift_End_Time__c != null
                                                LIMIT 1];
            
            if (!shiftWithStaffList.isEmpty()) {
                ShiftwithStaff__c shiftWithStaff = shiftWithStaffList[0];
                Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
                
                // Prepare test parameters with current shift ID to ignore
                List<Id> staffIds = new List<Id>{staff.Id};
                String startDate = '2025-07-01';
                String endDate = '2025-07-01';
                String startTimeStr = '09:00:00';
                String endTimeStr = '17:00:00';
                Id facilityId = facility.Id;
                String shiftRole = 'Admin';
                String shiftType = 'General';
                Id currentShiftId = shiftWithStaff.Id;
                List<String> otherGroupShiftShiftIds = new List<String>();
                
                Test.startTest();
                Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                    RosterStaffConflictController.checkStaffConflicts(
                        staffIds, startDate, endDate, startTimeStr, endTimeStr,
                        facilityId, shiftRole, shiftType,
                        currentShiftId, otherGroupShiftShiftIds
                    );
                Test.stopTest();
                
                
            }
        }
    }
    
    @IsTest
    static void testCheckShiftOverlap_WithOtherGroupShiftIds() {
       User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Get test data
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            
            // Get shift with staff that has valid dates
            List<ShiftwithStaff__c> shiftWithStaffList = [SELECT Id, Staff__c, Start_Date__c, Shift_End_Date__c,
                                                Shift_Start_Time__c, Shift_End_Time__c 
                                                FROM ShiftwithStaff__c 
                                                WHERE Staff__c = :staff.Id 
                                                AND Shift_End_Date__c != null 
                                                AND Shift_End_Time__c != null
                                                LIMIT 1];
            
            if (!shiftWithStaffList.isEmpty()) {
                ShiftwithStaff__c shiftWithStaff = shiftWithStaffList[0];
                Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
                
                // Prepare test parameters with other group shift IDs to ignore
                List<Id> staffIds = new List<Id>{staff.Id};
                String startDate = '2025-07-01';
                String endDate = '2025-07-01';
                String startTimeStr = '09:00:00';
                String endTimeStr = '17:00:00';
                Id facilityId = facility.Id;
                String shiftRole = 'Admin';
                String shiftType = 'General';
                Id currentShiftId = null;
                List<String> otherGroupShiftShiftIds = new List<String>{String.valueOf(shiftWithStaff.Id)};
                
                Test.startTest();
                Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                    RosterStaffConflictController.checkStaffConflicts(
                        staffIds, startDate, endDate, startTimeStr, endTimeStr,
                        facilityId, shiftRole, shiftType,
                        currentShiftId, otherGroupShiftShiftIds
                    );
                Test.stopTest();
              
                
            }
        }
    }
    
    @IsTest
    static void testCheckStaffConflicts_SleepoverShift() {
         User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Get test data
            Staff__c staff = [SELECT Id, Set_Hours__c FROM Staff__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            // Update staff to have set hours
            staff.Set_Hours__c = 40;
            staff.Restrict_Set_Hours__c = true;
            update staff;
            
            // Prepare test parameters for sleepover shift
            List<Id> staffIds = new List<Id>{staff.Id};
            String startDate = '2025-07-01';
            String endDate = '2025-07-02';
            String startTimeStr = '22:00:00';
            String endTimeStr = '06:00:00';
            Id facilityId = facility.Id;
            String shiftRole = 'Admin';
            String shiftType = 'Sleepover Shift';
            Id currentShiftId = null;
            List<String> otherGroupShiftShiftIds = new List<String>();
            
            Test.startTest();
            Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                RosterStaffConflictController.checkStaffConflicts(
                    staffIds, startDate, endDate, startTimeStr, endTimeStr,
                    facilityId, shiftRole, shiftType,
                    currentShiftId, otherGroupShiftShiftIds
                );
            Test.stopTest();
           
            
        }
    }
    
    @IsTest
    static void testCheckStaffConflicts_WeekendShift() {
        User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        System.runAs(runningUser) {
            // Get test data
            Staff__c staff = [SELECT Id, Set_Hours__c FROM Staff__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            // Update staff to have set hours
            staff.Set_Hours__c = 40;
            staff.Restrict_Set_Hours__c = true;
            update staff;
            
            // Prepare test parameters for weekend (Saturday)
            List<Id> staffIds = new List<Id>{staff.Id};
            String startDate = '2025-07-05';
            String endDate = '2025-07-05';
            String startTimeStr = '09:00:00';
            String endTimeStr = '17:00:00';
            Id facilityId = facility.Id;
            String shiftRole = 'Admin';
            String shiftType = 'General';
            Id currentShiftId = null;
            List<String> otherGroupShiftShiftIds = new List<String>();
            
            Test.startTest();
            Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                RosterStaffConflictController.checkStaffConflicts(
                    staffIds, startDate, endDate, startTimeStr, endTimeStr,
                    facilityId, shiftRole, shiftType,
                    currentShiftId, otherGroupShiftShiftIds
                );
            Test.stopTest();
            
            
            
        }
    }
    
    @IsTest
    static void testCheckStaffConflicts_WithNoConflicts() {
         User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Get existing organization from test data factory
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            
            // Get existing facility from test data factory
            Facility__c existingFacility = [SELECT Id, Name FROM Facility__c LIMIT 1];
            
            // Get existing staff from test data factory
            Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];
            
            // Update staff to have no set hours restriction
            staff.Restrict_Set_Hours__c = false;
            staff.Set_Hours__c = 40;
            update staff;
            
            // Create a staff role for the existing facility if not exists
            List<StaffRole__c> existingRoles = [SELECT Id FROM StaffRole__c 
                                                WHERE StaffRole_To_Staff__c = :staff.Id 
                                                AND Facility__c = :existingFacility.Id 
                                                AND RoleName__c = 'Admin'];
            
            if (existingRoles.isEmpty()) {
                StaffRole__c staffRole = new StaffRole__c(
                    StaffRole_To_Staff__c = staff.Id,
                    Facility__c = existingFacility.Id,
                    RoleName__c = 'Admin',
                    Active__c = true,
                    Hourly_Rate__c = 50
                );
                insert staffRole;
            }
            
            // Ensure staff has valid documents (not expired)
            List<Child_Staff__c> existingDocs = [SELECT Id, Staff__c, Document_Type__c, Expiry_Date__c, Status__c 
                                                 FROM Child_Staff__c 
                                                 WHERE Staff__c = :staff.Id];
            
            if (existingDocs.isEmpty()) {
                Child_Staff__c doc = new Child_Staff__c(
                    Staff__c = staff.Id,
                    Document_Type__c = 'Valid Document',
                    Expiry_Date__c = date.newInstance(2030, 01, 05),
                    Status__c = 'Approved',
                    Compliance__c = true
                );
                insert doc;
            } else {
                for (Child_Staff__c doc : existingDocs) {
                    doc.Expiry_Date__c = date.newInstance(2030, 01, 05);
                    doc.Status__c = 'Approved';
                    doc.Compliance__c = true;
                }
                update existingDocs;
            }
            
            // Prepare test parameters with existing facility
            List<Id> staffIds = new List<Id>{staff.Id};
            String startDate = '2025-08-01';
            String endDate = '2025-08-01';
            String startTimeStr = '09:00:00';
            String endTimeStr = '17:00:00';
            Id facilityId = existingFacility.Id;
            String shiftRole = 'Admin';
            String shiftType = 'General';
            Id currentShiftId = null;
            List<String> otherGroupShiftShiftIds = new List<String>();
            
            Test.startTest();
            Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                RosterStaffConflictController.checkStaffConflicts(
                    staffIds, startDate, endDate, startTimeStr, endTimeStr,
                    facilityId, shiftRole, shiftType,
                    currentShiftId, otherGroupShiftShiftIds
                );
            Test.stopTest();
           
            
        }
    }
    
    @IsTest
    static void testStaffConflictWrapper() {
        // Test the wrapper class
        RosterStaffConflictController.StaffConflictWrapper wrapper = 
            new RosterStaffConflictController.StaffConflictWrapper();
        
      
        
        // Set staff ID
        wrapper.staffId = 'a03Bo00000a2QxzIAE';
       
        
        // Test conflicts list
        wrapper.conflicts = new List<RosterStaffConflictController.ConflictDetail>();
       
        
        // Add conflict
        RosterStaffConflictController.ConflictDetail detail = 
            new RosterStaffConflictController.ConflictDetail(
                'Test Type', 
                'Error', 
                'Test message'
            );
        wrapper.conflicts.add(detail);
      
        
    }
    
    @IsTest
    static void testConflictDetail() {
        // Test ConflictDetail constructor
        String type = 'Shift Overlap';
        String severity = 'Warning';
        String message = 'Shift overlaps with existing shift';
        
        RosterStaffConflictController.ConflictDetail detail = 
            new RosterStaffConflictController.ConflictDetail(type, severity, message);
        
       
        
    }
    
    @IsTest
    static void testCheckDocuments_MissingDocuments() {
         User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Get test data
            Staff__c staff = [SELECT Id, Facility__r.Organisation__c FROM Staff__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            
            // Create compliance settings requiring a document
            Facility_Compliance_Setting__c setting = new Facility_Compliance_Setting__c(
                Facility__c = facility.Id,
                Organisation__c = org.Id,
                Roles__c = 'Admin',
                Org_Roles__c = 'Admin',
                Document_Name__c = 'Required Test Document',
                Mandatory_Document__c = true,
                Visible_to_Staff__c = true,
                Org__c = true
            );
            insert setting;
            
            // Prepare test parameters
            List<Id> staffIds = new List<Id>{staff.Id};
            String startDate = '2025-07-01';
            String endDate = '2025-07-01';
            String startTimeStr = '09:00:00';
            String endTimeStr = '17:00:00';
            Id facilityId = facility.Id;
            String shiftRole = 'Admin';
            String shiftType = 'General';
            Id currentShiftId = null;
            List<String> otherGroupShiftShiftIds = new List<String>();
            
            Test.startTest();
            Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                RosterStaffConflictController.checkStaffConflicts(
                    staffIds, startDate, endDate, startTimeStr, endTimeStr,
                    facilityId, shiftRole, shiftType,
                    currentShiftId, otherGroupShiftShiftIds
                );
            Test.stopTest();
            

            
        }
    }
    
    @IsTest
    static void testCheckSetHours_ExceedingLimit() {
        User runningUser = [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND email='manualtesting.20294637@hotmail.com' LIMIT 1 ];
        
        System.runAs(runningUser) {
            // Get test data
            Staff__c staff = [SELECT Id, Set_Hours__c, Restrict_Set_Hours__c, Facility__r.Organisation__c 
                              FROM Staff__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            
            // Update staff with set hours limit
            staff.Set_Hours__c = 20;
            staff.Restrict_Set_Hours__c = true;
            update staff;
            
            // Prepare test parameters - shift that will exceed limit
            List<Id> staffIds = new List<Id>{staff.Id};
            String startDate = '2025-07-01';
            String endDate = '2025-07-01';
            String startTimeStr = '09:00:00';
            String endTimeStr = '22:00:00';
            Id facilityId = facility.Id;
            String shiftRole = 'Admin';
            String shiftType = 'General';
            Id currentShiftId = null;
            List<String> otherGroupShiftShiftIds = new List<String>();
            
            Test.startTest();
            Map<Id, RosterStaffConflictController.StaffConflictWrapper> result = 
                RosterStaffConflictController.checkStaffConflicts(
                    staffIds, startDate, endDate, startTimeStr, endTimeStr,
                    facilityId, shiftRole, shiftType,
                    currentShiftId, otherGroupShiftShiftIds
                );
            Test.stopTest();
          
        }
    }
}