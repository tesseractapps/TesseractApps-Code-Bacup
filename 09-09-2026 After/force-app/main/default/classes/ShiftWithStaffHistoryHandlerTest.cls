@IsTest
public class ShiftWithStaffHistoryHandlerTest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
    }
    
    // =========================================
    // Tests for captureTimingHistory
    // =========================================
    
    @IsTest
    static void testCaptureTimingHistory_StartTimeChange() {
        // Get existing shift
        ShiftwithStaff__c shift = [SELECT Id, Shift_Start_Time__c, Shift_End_Time__c, Status__c, Time_Edit_Reason__c, Shift_Calculated_Duration__c 
                                   FROM ShiftwithStaff__c LIMIT 1];
        
        // Update start time
        shift.Shift_Start_Time__c = Time.newInstance(10, 0, 0, 0);
        shift.Status__c = 'InProgress';
        shift.Time_Edit_Reason__c = 'Test Start Time Change';
        
        Map<Id, ShiftwithStaff__c> oldMap = new Map<Id, ShiftwithStaff__c>();
        oldMap.put(shift.Id, shift.clone(true, true, true, true));
        
        // Set old values
        ShiftwithStaff__c oldShift = oldMap.get(shift.Id);
        oldShift.Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0);
        
        List<ShiftwithStaff__c> newList = new List<ShiftwithStaff__c>{shift};
        
        Test.startTest();
        ShiftWithStaffHistoryHandler.captureTimingHistory(newList, oldMap);
        Test.stopTest();
    }
    
    @IsTest
    static void testCaptureTimingHistory_EndTimeChange() {
        // Get existing shift
        ShiftwithStaff__c shift = [SELECT Id, Shift_Start_Time__c, Shift_End_Time__c, Status__c, Time_Edit_Reason__c, Shift_Calculated_Duration__c 
                                   FROM ShiftwithStaff__c LIMIT 1];
        
        // Update end time
        shift.Shift_End_Time__c = Time.newInstance(18, 0, 0, 0);
        shift.Status__c = 'Completed';
        shift.Time_Edit_Reason__c = 'Test End Time Change';
        
        Map<Id, ShiftwithStaff__c> oldMap = new Map<Id, ShiftwithStaff__c>();
        oldMap.put(shift.Id, shift.clone(true, true, true, true));
        
        // Set old values
        ShiftwithStaff__c oldShift = oldMap.get(shift.Id);
        oldShift.Shift_End_Time__c = Time.newInstance(17, 0, 0, 0);
        
        List<ShiftwithStaff__c> newList = new List<ShiftwithStaff__c>{shift};
        
        Test.startTest();
        ShiftWithStaffHistoryHandler.captureTimingHistory(newList, oldMap);
        Test.stopTest();
    }
    
    @IsTest
    static void testCaptureTimingHistory_BothStartAndEndTimeChange() {
        // Get existing shift
        ShiftwithStaff__c shift = [SELECT Id, Shift_Start_Time__c, Shift_End_Time__c, Status__c, Time_Edit_Reason__c, Shift_Calculated_Duration__c 
                                   FROM ShiftwithStaff__c LIMIT 1];
        
        // Update both start and end time
        shift.Shift_Start_Time__c = Time.newInstance(10, 0, 0, 0);
        shift.Shift_End_Time__c = Time.newInstance(19, 0, 0, 0);
        shift.Status__c = 'InProgress';
        shift.Time_Edit_Reason__c = 'Test Both Times Change';
        
        Map<Id, ShiftwithStaff__c> oldMap = new Map<Id, ShiftwithStaff__c>();
        oldMap.put(shift.Id, shift.clone(true, true, true, true));
        
        // Set old values
        ShiftwithStaff__c oldShift = oldMap.get(shift.Id);
        oldShift.Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0);
        oldShift.Shift_End_Time__c = Time.newInstance(17, 0, 0, 0);
        
        List<ShiftwithStaff__c> newList = new List<ShiftwithStaff__c>{shift};
        
        Test.startTest();
        ShiftWithStaffHistoryHandler.captureTimingHistory(newList, oldMap);
        Test.stopTest();
    }
    
    @IsTest
    static void testCaptureTimingHistory_NoTimeChange() {
        // Get existing shift
        ShiftwithStaff__c shift = [SELECT Id, Shift_Start_Time__c, Shift_End_Time__c, Status__c, Time_Edit_Reason__c, Shift_Calculated_Duration__c 
                                   FROM ShiftwithStaff__c LIMIT 1];
        
        // No time changes, only status update
        shift.Status__c = 'InProgress';
        shift.Time_Edit_Reason__c = 'Status Update Only';
        
        Map<Id, ShiftwithStaff__c> oldMap = new Map<Id, ShiftwithStaff__c>();
        oldMap.put(shift.Id, shift.clone(true, true, true, true));
        
        List<ShiftwithStaff__c> newList = new List<ShiftwithStaff__c>{shift};
        
        Test.startTest();
        ShiftWithStaffHistoryHandler.captureTimingHistory(newList, oldMap);
        Test.stopTest();
    }
    
    @IsTest
    static void testCaptureTimingHistory_InvalidStatus() {
        // Get existing shift
        ShiftwithStaff__c shift = [SELECT Id, Shift_Start_Time__c, Shift_End_Time__c, Status__c, Time_Edit_Reason__c, Shift_Calculated_Duration__c 
                                   FROM ShiftwithStaff__c LIMIT 1];
        
        // Update start time but status is not InProgress or Completed
        shift.Shift_Start_Time__c = Time.newInstance(10, 0, 0, 0);
        shift.Status__c = 'Draft';
        shift.Time_Edit_Reason__c = 'Test Invalid Status';
        
        Map<Id, ShiftwithStaff__c> oldMap = new Map<Id, ShiftwithStaff__c>();
        oldMap.put(shift.Id, shift.clone(true, true, true, true));
        
        // Set old values
        ShiftwithStaff__c oldShift = oldMap.get(shift.Id);
        oldShift.Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0);
        oldShift.Status__c = 'Draft';
        
        List<ShiftwithStaff__c> newList = new List<ShiftwithStaff__c>{shift};
        
        Test.startTest();
        ShiftWithStaffHistoryHandler.captureTimingHistory(newList, oldMap);
        Test.stopTest();
    }
    
    @IsTest
    static void testCaptureTimingHistory_EmptyList() {
        List<ShiftwithStaff__c> newList = new List<ShiftwithStaff__c>();
        Map<Id, ShiftwithStaff__c> oldMap = new Map<Id, ShiftwithStaff__c>();
        
        Test.startTest();
        ShiftWithStaffHistoryHandler.captureTimingHistory(newList, oldMap);
        Test.stopTest();
    }
    
    // =========================================
    // Tests for captureSupportItemHistory
    // =========================================
   
    @IsTest
    static void testCaptureSupportItemHistory_QuantityChange() {
        // Get service record with ShiftwithStaff__c
        Services_and_Support_Plan__c service = [SELECT Id, Service_Type__c, Qty__c, ShiftwithStaff__c 
                                               FROM Services_and_Support_Plan__c WHERE ShiftwithStaff__c != null LIMIT 1];
        
        if (service != null && service.ShiftwithStaff__c != null) {
            // Update shift status to Completed
            ShiftwithStaff__c shift = [SELECT Id, Status__c, Time_Edit_Reason__c FROM ShiftwithStaff__c WHERE Id = :service.ShiftwithStaff__c];
            shift.Status__c = 'Completed';
            shift.Time_Edit_Reason__c = 'Test Qty Change';
            
            Test.startTest();
            update shift;
            
            // Update quantity
            service.Qty__c = 10;
            
            Map<Id, Services_and_Support_Plan__c> oldMap = new Map<Id, Services_and_Support_Plan__c>();
            oldMap.put(service.Id, service.clone(true, true, true, true));
            
            // Set old values
            Services_and_Support_Plan__c oldService = oldMap.get(service.Id);
            oldService.Qty__c = 5;
            
            List<Services_and_Support_Plan__c> newList = new List<Services_and_Support_Plan__c>{service};
            
            ShiftWithStaffHistoryHandler.captureSupportItemHistory(newList, oldMap);
            Test.stopTest();
        }
    }
    
   
    @IsTest
    static void testCaptureSupportItemHistory_NoChanges() {
        // Get service record with ShiftwithStaff__c
        Services_and_Support_Plan__c service = [SELECT Id, Service_Type__c, Qty__c, ShiftwithStaff__c 
                                               FROM Services_and_Support_Plan__c WHERE ShiftwithStaff__c != null LIMIT 1];
        
        if (service != null && service.ShiftwithStaff__c != null) {
            // Update shift status to InProgress
            ShiftwithStaff__c shift = [SELECT Id, Status__c, Time_Edit_Reason__c FROM ShiftwithStaff__c WHERE Id = :service.ShiftwithStaff__c];
            shift.Status__c = 'InProgress';
            shift.Time_Edit_Reason__c = 'No Changes';
            
            Test.startTest();
            update shift;
            
            // No changes to service
            
            Map<Id, Services_and_Support_Plan__c> oldMap = new Map<Id, Services_and_Support_Plan__c>();
            oldMap.put(service.Id, service.clone(true, true, true, true));
            
            List<Services_and_Support_Plan__c> newList = new List<Services_and_Support_Plan__c>{service};
            
            ShiftWithStaffHistoryHandler.captureSupportItemHistory(newList, oldMap);
            Test.stopTest();
        }
    }
    
   
    @IsTest
    static void testCaptureSupportItemHistory_NullShiftId() {
        // Get service record with null ShiftwithStaff__c
        List<Services_and_Support_Plan__c> services = [SELECT Id, Service_Type__c, Qty__c, ShiftwithStaff__c 
                                                      FROM Services_and_Support_Plan__c WHERE ShiftwithStaff__c = null LIMIT 1];
        
        if (!services.isEmpty()) {
            Services_and_Support_Plan__c service = services[0];
            
            // Update service type
            NDIS_Support_Catalogue__c newServiceType = [SELECT Id FROM NDIS_Support_Catalogue__c WHERE Id != :service.Service_Type__c LIMIT 1];
            service.Service_Type__c = newServiceType.Id;
            
            Map<Id, Services_and_Support_Plan__c> oldMap = new Map<Id, Services_and_Support_Plan__c>();
            oldMap.put(service.Id, service.clone(true, true, true, true));
            
            // Set old values
            Services_and_Support_Plan__c oldService = oldMap.get(service.Id);
            NDIS_Support_Catalogue__c oldServiceType = [SELECT Id FROM NDIS_Support_Catalogue__c WHERE Id != :newServiceType.Id LIMIT 1];
            oldService.Service_Type__c = oldServiceType.Id;
            
            List<Services_and_Support_Plan__c> newList = new List<Services_and_Support_Plan__c>{service};
            
            Test.startTest();
            ShiftWithStaffHistoryHandler.captureSupportItemHistory(newList, oldMap);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testCaptureSupportItemHistory_EmptyList() {
        List<Services_and_Support_Plan__c> newList = new List<Services_and_Support_Plan__c>();
        Map<Id, Services_and_Support_Plan__c> oldMap = new Map<Id, Services_and_Support_Plan__c>();
        
        Test.startTest();
        ShiftWithStaffHistoryHandler.captureSupportItemHistory(newList, oldMap);
        Test.stopTest();
    }
    
    @IsTest
static void testCaptureBillableHoursHistory() {
    // Get a shift without services
    ShiftwithStaff__c shift = [SELECT Id, Shift_Calculated_Duration__c, Status__c, Time_Edit_Reason__c 
                               FROM ShiftwithStaff__c LIMIT 1];
    
    // Verify shift has no services
    List<Services_and_Support_Plan__c> services = [SELECT Id FROM Services_and_Support_Plan__c 
                                                   WHERE ShiftwithStaff__c = :shift.Id];
    
    if (services.isEmpty()) {
        // Update duration
        shift.Shift_Calculated_Duration__c = 8;
        shift.Status__c = 'InProgress';
        shift.Time_Edit_Reason__c = 'Test Billable Hours Change';
        
        Map<Id, ShiftwithStaff__c> oldMap = new Map<Id, ShiftwithStaff__c>();
        oldMap.put(shift.Id, shift.clone(true, true, true, true));
        oldMap.get(shift.Id).Shift_Calculated_Duration__c = 5;
        
        List<ShiftwithStaff__c> newList = new List<ShiftwithStaff__c>{shift};
        
        Test.startTest();
        ShiftWithStaffHistoryHandler.captureTimingHistory(newList, oldMap);
        Test.stopTest();
    }
}
}