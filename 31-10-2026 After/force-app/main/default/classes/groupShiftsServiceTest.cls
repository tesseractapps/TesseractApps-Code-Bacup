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
            Test.startTest();
            
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c WHERE Add_Shift__c = :addShift.Id LIMIT 1];
            String financialyear = '2026-07-02';
            
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
    static void testGetOtherGroupShiftDetails_EmptyShiftList() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            
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
            String financialyear = '2026-07-02';
            
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
            Test.startTest();
            
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            String financialyear = '2026-07-02';
            
            ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c 
                                              WHERE Add_Shift__c = :addShift.Id 
                                              AND Id IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                              LIMIT 1];
            
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
            Test.startTest();
            
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c 
                                              WHERE Add_Shift__c = :addShift.Id 
                                              LIMIT 1];
            String financialyear = '2026-07-02';
            String shiftId = currentShift.Id;
            
            List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                    addShift.Id,
                    currentShift.Id,
                    financialyear
                );
            	groupShiftsServiceTypesAndItemsHandler.getGroupShiftParticipants(shiftId);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_WithFundsAndCatalogue() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c 
                                              WHERE Add_Shift__c = :addShift.Id 
                                              AND Id IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                              LIMIT 1];
            String financialyear = '2026-07-02';
            
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
            Test.startTest();
            
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            List<ShiftwithStaff__c> shiftList = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id 
                                                  AND Id NOT IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                                  LIMIT 2];
            String financialyear = '2026-07-02';
            
            if (shiftList.size() >= 2) {
                List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                    groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                        addShift.Id,
                        shiftList[0].Id,
                        financialyear
                    );
            }
            
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_NullParameters() {
        User runningUser = getRunningUser();
        String financialyear = '2026-07-02';
        
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
            Test.startTest();
            
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            Client__c client = [SELECT Id FROM Client__c LIMIT 1];
            NDIS_Support_Catalogue__c catalogue = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            
            Funds_Tracker__c fund2 = new Funds_Tracker__c(
                Client__c = client.Id,
                Registration_Group__c = 'Household Tasks',
                Amount_approved__c = 5000,
                Plan_Type__c = 'Plan Managed',
                Approved_Date__c = Date.newInstance(2025, 01, 01),
                Status__c = 'Active'
            );
            insert fund2;
            
            List<ShiftwithStaff__c> shiftList = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id 
                                                  AND Id NOT IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                                  LIMIT 1];
            
            if (!shiftList.isEmpty()) {
                Services_and_Support_Plan__c service2 = new Services_and_Support_Plan__c(
                    ShiftwithStaff__c = shiftList[0].Id,
                    Client__c = client.Id,
                    Funds_Tracker__c = fund2.Id,
                    Service_Type__c = catalogue.Id,
                    Qty__c = 3,
                    Date_of_Service__c = System.today(),
                    Start_Time__c = '3:30 am',
                    End_Time__c = '5:30 am',
                    GST__c = 'No',
                    Services__c = 'Household Tasks',
                    State__c = 'ACT'
                );
                insert service2;
                
                ShiftwithStaff__c currentShift = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id 
                                                  AND Id IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                                  LIMIT 1];
                String financialyear = '2026-07-02';
                
                List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                    groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                        addShift.Id,
                        currentShift.Id,
                        financialyear
                    );
            }
            
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_WithExistingServices() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            List<ShiftwithStaff__c> shiftList = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id 
                                                  AND Id IN (SELECT ShiftwithStaff__c FROM Services_and_Support_Plan__c)
                                                  LIMIT 2];
            String financialyear = '2026-07-02';
            
            if (shiftList.size() >= 2) {
                List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                    groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                        addShift.Id,
                        shiftList[0].Id,
                        financialyear
                    );
            }
            
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testGetOtherGroupShiftDetails_CurrentShiftExcluded() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            
            Add_Shift__c addShift = [SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1];
            
            List<ShiftwithStaff__c> shiftList = [SELECT Id FROM ShiftwithStaff__c 
                                                  WHERE Add_Shift__c = :addShift.Id];
            String financialyear = '2026-07-02';
            
            if (shiftList.size() >= 2) {
                List<groupShiftsServiceTypesAndItemsHandler.GroupShiftCompleteWrapper> result = 
                    groupShiftsServiceTypesAndItemsHandler.getOtherGroupShiftDetails(
                        addShift.Id,
                        shiftList[0].Id,
                        financialyear
                    );
            }
            
            Test.stopTest();
        }
    }
     @IsTest
    static void testGetGroupShiftParticipants_GroupShiftWithData() {
        User runningUser = getRunningUser();
        System.runAs(runningUser) {
            Test.startTest();

            Add_Shift__c addShift = [
                SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1
            ];
            ShiftwithStaff__c currentShift = [
                SELECT Id FROM ShiftwithStaff__c
                WHERE Add_Shift__c = :addShift.Id
                LIMIT 1
            ];

            groupShiftsServiceTypesAndItemsHandler.GroupShiftWrapper result =
                groupShiftsServiceTypesAndItemsHandler.getGroupShiftParticipants(
                    currentShift.Id
                );

            System.assertNotEquals(null, result, 'Wrapper should not be null');
            System.assertNotEquals(null, result.ratio, 'Ratio should not be null');
            System.assert(
                result.ratio.contains(':'),
                'Group shift ratio should be in format staff:participants'
            );

            Test.stopTest();
        }
    }

    /**
     * Covers the branch where Group_Shifts__c is false, so the ratio
     * stays at the default '1:1'.
     */
    @IsTest
    static void testGetGroupShiftParticipants_NonGroupShift() {
        User runningUser = getRunningUser();
        System.runAs(runningUser) {
            Test.startTest();

            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];

            Add_Shift__c nonGroupAddShift = new Add_Shift__c(
                Start_Date__c = Date.newInstance(2025, 08, 01),
                End_Date__c = Date.newInstance(2025, 08, 02),
                Start_Time__c = Time.newInstance(09, 00, 00, 00),
                End_Time__c = Time.newInstance(17, 00, 00, 00),
                Facility__c = facility.Id,
                Role__c = 'Admin',
                Status__c = 'Draft',
                Shift_Type__c = 'General',
                Quantity__c = 1,
                Get_Facility__c = true,
                Group_Shifts__c = false
            );
            insert nonGroupAddShift;

            ShiftwithStaff__c shiftWithStaff = new ShiftwithStaff__c(
                Add_Shift__c = nonGroupAddShift.Id
            );
            insert shiftWithStaff;

            groupShiftsServiceTypesAndItemsHandler.GroupShiftWrapper result =
                groupShiftsServiceTypesAndItemsHandler.getGroupShiftParticipants(
                    shiftWithStaff.Id
                );

            System.assertEquals('1:1', result.ratio, 'Non-group shift should default to 1:1');
            System.assertEquals('', result.participantNames, 'No participants expected');

            Test.stopTest();
        }
    }

    // ============================================================
    // NEW TESTS: getServiceRatiosByServiceIds
    // ============================================================

    /**
     * Covers the early-return branch when the input list is null.
     */
    @IsTest
    static void testGetServiceRatiosByServiceIds_NullInput() {
        User runningUser = getRunningUser();
        System.runAs(runningUser) {
            Test.startTest();

            List<groupShiftsServiceTypesAndItemsHandler.ServiceRatioWrapper> result =
                groupShiftsServiceTypesAndItemsHandler.getServiceRatiosByServiceIds(null);

            System.assertNotEquals(null, result, 'Should return empty list, not null');
            System.assertEquals(0, result.size(), 'Should be empty for null input');

            Test.stopTest();
        }
    }

    /**
     * Covers the early-return branch when the input list is empty.
     */
    @IsTest
    static void testGetServiceRatiosByServiceIds_EmptyInput() {
        User runningUser = getRunningUser();
        System.runAs(runningUser) {
            Test.startTest();

            List<groupShiftsServiceTypesAndItemsHandler.ServiceRatioWrapper> result =
                groupShiftsServiceTypesAndItemsHandler.getServiceRatiosByServiceIds(
                    new List<Id>()
                );

            System.assertEquals(0, result.size(), 'Should be empty for empty input');

            Test.stopTest();
        }
    }

    /**
     * Covers the branch where the list contains only nulls / blanks,
     * exercising the "uniqueServiceIds.isEmpty()" early return.
     */
    @IsTest
    static void testGetServiceRatiosByServiceIds_OnlyNullIds() {
        User runningUser = getRunningUser();
        System.runAs(runningUser) {
            Test.startTest();

            List<groupShiftsServiceTypesAndItemsHandler.ServiceRatioWrapper> result =
                groupShiftsServiceTypesAndItemsHandler.getServiceRatiosByServiceIds(
                    new List<Id>{ null, null }
                );

            System.assertEquals(0, result.size(), 'Should be empty when only nulls passed');

            Test.stopTest();
        }
    }

    /**
     * Covers the happy path for group shifts: services attached to a
     * group shift with staff and participants present should return
     * a "staff:participants" ratio rather than the default "1:1".
     */
    @IsTest
    static void testGetServiceRatiosByServiceIds_GroupShiftServices() {
        User runningUser = getRunningUser();
        System.runAs(runningUser) {
            Test.startTest();

            Add_Shift__c addShift = [
                SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1
            ];

            List<Services_and_Support_Plan__c> services = [
                SELECT Id
                FROM Services_and_Support_Plan__c
                WHERE ShiftwithStaff__c IN (
                    SELECT Id FROM ShiftwithStaff__c
                    WHERE Add_Shift__c = :addShift.Id
                )
                LIMIT 10
            ];

            System.assert(!services.isEmpty(), 'Test data must include services on group shift');

            List<Id> serviceIds = new List<Id>();
            for (Services_and_Support_Plan__c s : services) {
                serviceIds.add(s.Id);
            }

            List<groupShiftsServiceTypesAndItemsHandler.ServiceRatioWrapper> result =
                groupShiftsServiceTypesAndItemsHandler.getServiceRatiosByServiceIds(serviceIds);

            System.assertEquals(
                serviceIds.size(),
                result.size(),
                'Each service should produce one wrapper'
            );

            for (groupShiftsServiceTypesAndItemsHandler.ServiceRatioWrapper w : result) {
                System.assertNotEquals(null, w.serviceId, 'serviceId should be populated');
                System.assertNotEquals(null, w.ratio, 'ratio should be populated');
                System.assert(
                    w.ratio.contains(':'),
                    'Ratio should be in staff:participant format'
                );
            }

            Test.stopTest();
        }
    }

    /**
     * Covers the branch where a service is attached to a non-group
     * shift — the ratio must remain the default '1:1'.
     */
    @IsTest
    static void testGetServiceRatiosByServiceIds_NonGroupShiftService() {
        User runningUser = getRunningUser();
        System.runAs(runningUser) {
            Test.startTest();

            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Client__c client = [SELECT Id FROM Client__c LIMIT 1];
            NDIS_Support_Catalogue__c catalogue = [
                SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1
            ];

            Add_Shift__c nonGroupAddShift = new Add_Shift__c(
                Start_Date__c = Date.newInstance(2025, 09, 01),
                End_Date__c = Date.newInstance(2025, 09, 02),
                Start_Time__c = Time.newInstance(09, 00, 00, 00),
                End_Time__c = Time.newInstance(17, 00, 00, 00),
                Facility__c = facility.Id,
                Role__c = 'Admin',
                Status__c = 'Draft',
                Shift_Type__c = 'General',
                Quantity__c = 1,
                Get_Facility__c = true,
                Group_Shifts__c = false
            );
            insert nonGroupAddShift;

            ShiftwithStaff__c shiftWithStaff = new ShiftwithStaff__c(
                Add_Shift__c = nonGroupAddShift.Id
            );
            insert shiftWithStaff;

            Funds_Tracker__c fund = new Funds_Tracker__c(
                Client__c = client.Id,
                Registration_Group__c = 'Household Tasks',
                Amount_approved__c = 5000,
                Plan_Type__c = 'Plan Managed',
                Approved_Date__c = Date.newInstance(2025, 01, 01),
                Status__c = 'Active'
            );
            insert fund;

            Services_and_Support_Plan__c service = new Services_and_Support_Plan__c(
                ShiftwithStaff__c = shiftWithStaff.Id,
                Client__c = client.Id,
                Funds_Tracker__c = fund.Id,
                Service_Type__c = catalogue.Id,
                Qty__c = 1,
                Date_of_Service__c = System.today(),
                Start_Time__c = '9:00 am',
                End_Time__c = '10:00 am',
                GST__c = 'No',
                Services__c = 'Household Tasks',
                State__c = 'ACT'
            );
            insert service;

            List<groupShiftsServiceTypesAndItemsHandler.ServiceRatioWrapper> result =
                groupShiftsServiceTypesAndItemsHandler.getServiceRatiosByServiceIds(
                    new List<Id>{ service.Id }
                );

            System.assertEquals(1, result.size(), 'One wrapper expected');
            System.assertEquals('1:1', result[0].ratio, 'Non-group shift should default to 1:1');

            Test.stopTest();
        }
    }

    /**
     * Covers the scenario where a service has no ShiftwithStaff__c
     * attached (shiftIds empty) — should fall through and return
     * all services with the default '1:1' ratio.
     */
    @IsTest
    static void testGetServiceRatiosByServiceIds_ServiceWithoutShift() {
        User runningUser = getRunningUser();
        System.runAs(runningUser) {
            Test.startTest();

            Client__c client = [SELECT Id FROM Client__c LIMIT 1];
            NDIS_Support_Catalogue__c catalogue = [
                SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1
            ];

            Funds_Tracker__c fund = new Funds_Tracker__c(
                Client__c = client.Id,
                Registration_Group__c = 'Household Tasks',
                Amount_approved__c = 5000,
                Plan_Type__c = 'Plan Managed',
                Approved_Date__c = Date.newInstance(2025, 01, 01),
                Status__c = 'Active'
            );
            insert fund;

            Services_and_Support_Plan__c orphanService = new Services_and_Support_Plan__c(
                Client__c = client.Id,
                Funds_Tracker__c = fund.Id,
                Service_Type__c = catalogue.Id,
                Qty__c = 1,
                Date_of_Service__c = System.today(),
                Start_Time__c = '9:00 am',
                End_Time__c = '10:00 am',
                GST__c = 'No',
                Services__c = 'Household Tasks',
                State__c = 'ACT'
            );
            insert orphanService;

            List<groupShiftsServiceTypesAndItemsHandler.ServiceRatioWrapper> result =
                groupShiftsServiceTypesAndItemsHandler.getServiceRatiosByServiceIds(
                    new List<Id>{ orphanService.Id }
                );

            System.assertEquals(1, result.size(), 'One wrapper expected');
            System.assertEquals('1:1', result[0].ratio, 'Orphan service should default to 1:1');

            Test.stopTest();
        }
    }

    /**
     * Covers the loop that builds results for services in a mix of
     * group and non-group shifts, exercising both the ratio reassign
     * and the default branches in the same call.
     */
    @IsTest
    static void testGetServiceRatiosByServiceIds_MixedShiftTypes() {
        User runningUser = getRunningUser();
        System.runAs(runningUser) {
            Test.startTest();

            Set<Id> serviceIds = new Set<Id>();

            // Group-shift services
            Add_Shift__c groupAddShift = [
                SELECT Id FROM Add_Shift__c WHERE Group_Shifts__c = true LIMIT 1
            ];
            for (Services_and_Support_Plan__c s : [
                SELECT Id FROM Services_and_Support_Plan__c
                WHERE ShiftwithStaff__c IN (
                    SELECT Id FROM ShiftwithStaff__c
                    WHERE Add_Shift__c = :groupAddShift.Id
                )
                LIMIT 3
            ]) {
                serviceIds.add(s.Id);
            }

            // Non-group services attached to an existing shift
            for (Services_and_Support_Plan__c s : [
                SELECT Id FROM Services_and_Support_Plan__c
                WHERE ShiftwithStaff__c IN (
                    SELECT Id FROM ShiftwithStaff__c
                    WHERE Add_Shift__c != :groupAddShift.Id
                )
                LIMIT 3
            ]) {
                serviceIds.add(s.Id);
            }

            System.assert(!serviceIds.isEmpty(), 'Test data must include services');

            List<groupShiftsServiceTypesAndItemsHandler.ServiceRatioWrapper> result =
                groupShiftsServiceTypesAndItemsHandler.getServiceRatiosByServiceIds(
                    new List<Id>(serviceIds)
                );

            System.assertEquals(serviceIds.size(), result.size(), 'All services should be returned');

            Test.stopTest();
        }
    }

}