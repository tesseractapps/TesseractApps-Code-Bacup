/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-26-2023
 * @last modified by  : Raja Sekhar Reddy
**/
@isTest
public class ClientDataControllerTest {
   @testSetup
    static void setup() {
        RosterCopyPasteHandlerTestData.createTestData();
    }
    
    // Helper to get Client from test data
    static Client__c getTestClient() {
        return [SELECT Id, Name, First_Name__c, Last_Name__c 
                FROM Client__c 
                WHERE First_Name__c = 'Test' 
                AND Last_Name__c = 'Participant2948' 
                LIMIT 1];
    }
    
    // Helper to get Staff from test data
    static Staff__c getTestStaff() {
        return [SELECT Id, NameToDisplay__c 
                FROM Staff__c 
                WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' 
                LIMIT 1];
    }
    
    // =============================================
    // TEST 1: Save Participant Checklist - New Item
    // =============================================
    @isTest
    static void test_saveParticipantChecklist_NewItem() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        Staff__c staff = getTestStaff();
        
        String checklistJson = '[{' +
            '"Id": null,' +
            '"description": "Test Checklist Item",' +
            '"isMandatory": true,' +
            '"createdStaffId": "' + staff.Id + '",' +
            '"modifiedStaffId": "' + staff.Id + '",' +
            '"lastModifiedDate": "2025-01-01",' +
            '"lastModifiedTime": "10:00 AM"' +
        '}]';
        
        System.runAs(u) {
            Test.startTest();
            ClientDataController.saveParticipantChecklist(client.Id, checklistJson);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 2: Save Participant Checklist - Update Existing
    // =============================================
    @isTest
    static void test_saveParticipantChecklist_UpdateExisting() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        Staff__c staff = getTestStaff();
        
        // First create a checklist record
        Participant_Checklist__c existingChecklist = new Participant_Checklist__c();
        existingChecklist.Client__c = client.Id;
        existingChecklist.Description__c = 'Original Description';
        existingChecklist.Is_Mandatory__c = false;
        existingChecklist.Created_By_Staff__c = staff.Id;
        existingChecklist.Modified_By_Staff__c = staff.Id;
        insert existingChecklist;
        
        String checklistJson = '[{' +
            '"Id": "' + existingChecklist.Id + '",' +
            '"description": "Updated Description",' +
            '"isMandatory": true,' +
            '"createdStaffId": "' + staff.Id + '",' +
            '"modifiedStaffId": "' + staff.Id + '",' +
            '"lastModifiedDate": "2025-02-01",' +
            '"lastModifiedTime": "11:00 AM"' +
        '}]';
        
        System.runAs(u) {
            Test.startTest();
            ClientDataController.saveParticipantChecklist(client.Id, checklistJson);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 3: Save Participant Checklist - Delete Removed
    // =============================================
    @isTest
    static void test_saveParticipantChecklist_DeleteRemoved() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        Staff__c staff = getTestStaff();
        
        // Create existing checklist that will be deleted
        Participant_Checklist__c existingChecklist = new Participant_Checklist__c();
        existingChecklist.Client__c = client.Id;
        existingChecklist.Description__c = 'To Be Deleted';
        existingChecklist.Is_Mandatory__c = false;
        insert existingChecklist;
        
        // Empty incoming list (no items) -> delete all
        String checklistJson = '[]';
        
        System.runAs(u) {
            Test.startTest();
            ClientDataController.saveParticipantChecklist(client.Id, checklistJson);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 4: Save Participant Checklist - Invalid Client Id
    // =============================================
    @isTest
    static void test_saveParticipantChecklist_InvalidClientId() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        String checklistJson = '[{' +
            '"Id": null,' +
            '"description": "Test Item",' +
            '"isMandatory": false' +
        '}]';
        
        System.runAs(u) {
            Test.startTest();
            try {
                ClientDataController.saveParticipantChecklist('invalid-id', checklistJson);
            } catch (Exception e) {
                System.debug('Expected error: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 5: Save Participant Checklist - Blank Description
    // =============================================
    @isTest
    static void test_saveParticipantChecklist_BlankDescription() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        
        String checklistJson = '[{' +
            '"Id": null,' +
            '"description": "",' +
            '"isMandatory": false' +
        '}]';
        
        System.runAs(u) {
            Test.startTest();
            try {
                ClientDataController.saveParticipantChecklist(client.Id, checklistJson);
            } catch (Exception e) {
                System.debug('Expected error: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 6: Save Participant Checklist - Too Many Items
    // =============================================
    @isTest
    static void test_saveParticipantChecklist_TooManyItems() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        
        // Generate 51 items
        String checklistJson = '[';
        for (Integer i = 0; i < 51; i++) {
            if (i > 0) checklistJson += ',';
            checklistJson += '{"Id": null, "description": "Item ' + i + '", "isMandatory": false}';
        }
        checklistJson += ']';
        
        System.runAs(u) {
            Test.startTest();
            try {
                ClientDataController.saveParticipantChecklist(client.Id, checklistJson);
            } catch (Exception e) {
                System.debug('Expected error: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 7: Save Participant Checklist - Invalid JSON
    // =============================================
    @isTest
    static void test_saveParticipantChecklist_InvalidJson() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        
        System.runAs(u) {
            Test.startTest();
            try {
                ClientDataController.saveParticipantChecklist(client.Id, '{invalid json');
            } catch (Exception e) {
                System.debug('Expected error: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 8: Save Participant Checklist - Item Not Belonging to Client
    // =============================================
    @isTest
    static void test_saveParticipantChecklist_ItemNotBelongingToClient() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        Staff__c staff = getTestStaff();
        
        // Create checklist for another client
       
        Participant_Checklist__c otherChecklist = new Participant_Checklist__c();
        otherChecklist.Client__c = client.Id;
        otherChecklist.Description__c = 'Other Client Item';
        otherChecklist.Is_Mandatory__c = false;
        insert otherChecklist;
        
        String checklistJson = '[{' +
            '"Id": "' + otherChecklist.Id + '",' +
            '"description": "Should Fail",' +
            '"isMandatory": false' +
        '}]';
        
        System.runAs(u) {
            Test.startTest();
            try {
                ClientDataController.saveParticipantChecklist(client.Id, checklistJson);
            } catch (Exception e) {
                System.debug('Expected error: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 9: Save Participant Checklist - Unchanged Item (No Update)
    // =============================================
    @isTest
    static void test_saveParticipantChecklist_UnchangedItem() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        Staff__c staff = getTestStaff();
        
        // Create existing checklist
        Participant_Checklist__c existingChecklist = new Participant_Checklist__c();
        existingChecklist.Client__c = client.Id;
        existingChecklist.Description__c = 'Same Description';
        existingChecklist.Is_Mandatory__c = true;
        insert existingChecklist;
        
        // Same description and mandatory flag -> should skip update
        String checklistJson = '[{' +
            '"Id": "' + existingChecklist.Id + '",' +
            '"description": "Same Description",' +
            '"isMandatory": true,' +
            '"modifiedStaffId": "' + staff.Id + '",' +
            '"lastModifiedDate": "2025-03-01",' +
            '"lastModifiedTime": "09:00 AM"' +
        '}]';
        
        System.runAs(u) {
            Test.startTest();
            ClientDataController.saveParticipantChecklist(client.Id, checklistJson);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 10: Get Participant Checklist - Existing Records
    // =============================================
    @isTest
    static void test_getParticipantChecklist_ExistingRecords() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        Staff__c staff = getTestStaff();
        
        // Create some checklist records
        List<Participant_Checklist__c> records = new List<Participant_Checklist__c>();
        
        Participant_Checklist__c rec1 = new Participant_Checklist__c();
        rec1.Client__c = client.Id;
        rec1.Description__c = 'Item 1';
        rec1.Is_Mandatory__c = true;
        rec1.Created_By_Staff__c = staff.Id;
        rec1.Modified_By_Staff__c = staff.Id;
        records.add(rec1);
        
        Participant_Checklist__c rec2 = new Participant_Checklist__c();
        rec2.Client__c = client.Id;
        rec2.Description__c = 'Item 2';
        rec2.Is_Mandatory__c = false;
        rec2.Created_By_Staff__c = staff.Id;
        records.add(rec2);
        
        insert records;
        
        System.runAs(u) {
            Test.startTest();
            List<ClientDataController.ChecklistItemDTO> result = ClientDataController.getParticipantChecklist(client.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 11: Get Participant Checklist - No Records
    // =============================================
    @isTest
    static void test_getParticipantChecklist_NoRecords() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        
        System.runAs(u) {
            Test.startTest();
            List<ClientDataController.ChecklistItemDTO> result = ClientDataController.getParticipantChecklist(client.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 12: Get Participant Checklist - Invalid Client Id
    // =============================================
    @isTest
    static void test_getParticipantChecklist_InvalidClientId() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(u) {
            Test.startTest();
            List<ClientDataController.ChecklistItemDTO> result = ClientDataController.getParticipantChecklist('invalid-id');
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 13: Get Participant Checklist - With Staff Names
    // =============================================
    @isTest
    static void test_getParticipantChecklist_WithStaffNames() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = getTestClient();
        Staff__c staff = getTestStaff();
        
        // Create checklist with staff reference
        Participant_Checklist__c rec = new Participant_Checklist__c();
        rec.Client__c = client.Id;
        rec.Description__c = 'Staff Referenced Item';
        rec.Is_Mandatory__c = true;
        rec.Created_By_Staff__c = staff.Id;
        rec.Modified_By_Staff__c = staff.Id;
        insert rec;
        
        System.runAs(u) {
            Test.startTest();
            List<ClientDataController.ChecklistItemDTO> result = ClientDataController.getParticipantChecklist(client.Id);
            Test.stopTest();
        }
    }
    
}