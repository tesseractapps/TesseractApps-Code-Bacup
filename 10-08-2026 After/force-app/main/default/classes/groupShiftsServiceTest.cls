@IsTest
public class groupShiftsServiceTest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
    }
    
    private static User getRunningUser() {
        return [SELECT Id FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_Success() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Get Add_Shift with Group_Shifts__c = true
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            // Get one ShiftwithStaff as current
            ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c WHERE Add_Shift__c = :addShift.Id LIMIT 1];
            string financialyear='2026-07-02';
            Test.startTest();
            List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                    addShift.Id,
                    currentShift.Id,financialyear
                );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_EmptyShiftList() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Get Add_Shift with NO ShiftwithStaff records
            // Create a new Add_Shift without any ShiftwithStaff
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            
            Add_Shift__c newAddShift = new Add_Shift__c(
                Start_Date__c = Date.newInstance(2025, 07, 01),
                End_Date__c = Date.newInstance(2025, 07, 05),
                Start_Time__c = Time.newInstance(09, 00, 00, 00),
                End_Time__c = Time.newInstance(17, 00, 00, 00),
                Facility__c = facility.Id,
                Role__c = 'Admin',
                Status__c = 'Draft',
                Shift_Type__c = 'General',
                Quantity__c = 1,
                Get_Facility__c = true,
                Group_Shifts__c = true
            );
            insert newAddShift;
            
            ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
             string financialyear='2026-07-02';
            Test.startTest();
            List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                    newAddShift.Id,
                    shiftWithStaff.Id,
                    financialyear
                );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_WithServices() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
             string financialyear='2026-07-02';
            // Get current shift that has services
            ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c 
                                              WHERE Add_Shift__c = :addShift.Id 
                                              AND Id IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                              LIMIT 1];
            
            Test.startTest();
            List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                    addShift.Id,
                    currentShift.Id,
                     financialyear
                );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_MultipleShifts() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            // Get current shift (will exclude this)
            ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c 
                                              WHERE Add_Shift__c = :addShift.Id 
                                              LIMIT 1];
             string financialyear='2026-07-02';
            Test.startTest();
            List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                    addShift.Id,
                    currentShift.Id,
                     financialyear
                );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_WithFundsAndCatalogue() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            // Get current shift with services
            ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c 
                                              WHERE Add_Shift__c = :addShift.Id 
                                              AND Id IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                              LIMIT 1];
             string financialyear='2026-07-02';
            Test.startTest();
            List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                    addShift.Id,
                    currentShift.Id,
                     financialyear
                );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_NoServices() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Get Add_Shift with Group_Shifts__c = true
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            // Get a ShiftwithStaff that has NO services
            List<ShiftwithStaff__c> shiftList = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id 
                                                  AND Id NOT IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                                  LIMIT 2];
             string financialyear='2026-07-02';
            if (shiftList.size() >= 2) {
                Test.startTest();
                List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                    groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                        addShift.Id,
                        shiftList[0].Id,
                         financialyear
                    );
                Test.stopTest();
            }
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_NullParameters() {
        User runningUser = getRunningUser();
         string financialyear='2026-07-02';
        System.runAs(runningUser) {
            Test.startTest();
            List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                    null,
                    null,
                    financialyear
                );
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_WithMultipleFundsPerClient() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            // Create additional funds and services for testing multiple funds
            Client__c client = [SELECT Id FROM Client__c LIMIT 1];
            NDIS_Support_Catalogue__c catalogue = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            
            // Create second fund
            Funds_Tracker__c fund2 = new Funds_Tracker__c(
                Client__c = client.Id,
                Registration_Group__c = 'Household Tasks',
                Amount_approved__c = 5000,
                Plan_Type__c = 'Plan Managed',
                Approved_Date__c = Date.newInstance(2025, 01, 01),
                Status__c = 'Active'
            );
            insert fund2;
            
            // Get a shift without services
            List<ShiftwithStaff__c> shiftList = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id 
                                                  AND Id NOT IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                                  LIMIT 1];
            
            if (!shiftList.isEmpty()) {
                // Create service with second fund
                Services_and_Support_Plan__c service2 = new Services_and_Support_Plan__c(
                    ShiftwithStaff__c = shiftList[0].Id,
                    Client__c = client.Id,
                    Funds_Tracker__c = fund2.Id,
                    Service_Type__c = catalogue.Id,
                    Qty__c = 3,
                  Date_of_Service__c = system.today(),
                    Start_Time__c = '3:30 am',
                    End_Time__c = '5:30 am',
                                      GST__c = 'No',
                    Services__c = 'Household Tasks',
                    State__c = 'ACT'
                );
                insert service2;
                
                // Get current shift (one with services)
                ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id 
                                                  AND Id IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                                  LIMIT 1];
                 string financialyear='2026-07-02';
                Test.startTest();
                List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                    groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                        addShift.Id,
                        currentShift.Id,
                         financialyear
                    );
                Test.stopTest();
            }
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_WithExistingServices() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            // Get a shift with services
            List<ShiftwithStaff__c> shiftList = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id 
                                                  AND Id IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                                  LIMIT 2];
             string financialyear='2026-07-02';
            if (shiftList.size() >= 2) {
                Test.startTest();
                List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                    groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                        addShift.Id,
                        shiftList[0].Id,
                         financialyear
                    );
                Test.stopTest();
            }
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_CurrentShiftExcluded() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            // Get all shifts for this Add_Shift
            List<ShiftwithStaff__c> shiftList = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id];
             string financialyear='2026-07-02';
            if (shiftList.size() >= 2) {
                // Pass first shift as current, should get others
                Test.startTest();
                List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                    groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                        addShift.Id,
                        shiftList[0].Id,
                         financialyear
                    );
                Test.stopTest();
            }
        }
    }
}