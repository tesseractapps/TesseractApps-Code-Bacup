@IsTest
public class FacilityTriggerHandlerTest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
    }
    
    @IsTest
    static void testCreateDefaultShifts() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            // Query existing facility from test data
            Facility__c existingFacility = [SELECT Id, Name, Cost_per_Km_Electric__c, Cost_per_Km_Fuel__c FROM Facility__c WHERE Status__c = TRUE LIMIT 1];
            
            List<Facility__c> facilities = new List<Facility__c>{ existingFacility };
            FacilityTriggerHandler.createDefaultShifts(facilities);
        }
    }
    
    @IsTest
    static void testCreateDefaultShiftsMultipleFacilities() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            // Query existing facilities from test data
            List<Facility__c> existingFacilities = [SELECT Id, Name, Cost_per_Km_Electric__c, Cost_per_Km_Fuel__c FROM Facility__c WHERE Status__c = TRUE LIMIT 3];
            
            FacilityTriggerHandler.createDefaultShifts(existingFacilities);
        }
    }
    
    @IsTest
    static void testCreateDefaultShiftsEmptyList() {
        List<Facility__c> facilities = new List<Facility__c>();
        FacilityTriggerHandler.createDefaultShifts(facilities);
    }
    
    @IsTest
    static void testCreateDefaultShiftsWithExistingShifts() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            // Query existing facility from test data
            Facility__c existingFacility = [SELECT Id, Name, Cost_per_Km_Electric__c, Cost_per_Km_Fuel__c FROM Facility__c WHERE Status__c = TRUE LIMIT 1];
            
            // Create a shift type for this facility
            Shift_Type__c shiftType = new Shift_Type__c(
                Name = 'General',
                Facility__c = existingFacility.Id,
                Shift_Type__c = 'General',
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Colour__c = '#AE016A'
            );
            insert shiftType;
            
            // Now call createDefaultShifts which should create additional shifts
            List<Facility__c> facilities = new List<Facility__c>{ existingFacility };
            FacilityTriggerHandler.createDefaultShifts(facilities);
        }
    }
    
    @IsTest
    static void testCreateDefaultShiftsWithNoCostPerKm() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            // Query existing facility from test data
            Facility__c existingFacility = [SELECT Id, Name, Cost_per_Km_Electric__c, Cost_per_Km_Fuel__c FROM Facility__c WHERE Status__c = TRUE  LIMIT 1];
            
            if (existingFacility != null) {
                List<Facility__c> facilities = new List<Facility__c>{ existingFacility };
                FacilityTriggerHandler.createDefaultShifts(facilities);
            }
        }
    }
}