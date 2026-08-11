@IsTest
public class StaffNotesControllerTest {

    @IsTest
    static void testUpsertNote_InsertAndUpdate() {

        TestDataFactory.createBaseData();

        Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];

        Test.startTest();

        Id noteId = StaffNotesController.upsertNote(
            null,
            'Test Title',
            'Test Description',
            staff.Id,
            staff.Facility__c
        );

        StaffNotesController.upsertNote(
            noteId,
            'Updated Title',
            'Updated Description',
            staff.Id,
            staff.Facility__c
        );

        Test.stopTest();
    }

    @IsTest
    static void testGetNotes() {

        TestDataFactory.createBaseData();

        Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];

        Id noteId = StaffNotesController.upsertNote(
            null,
            'Test Title',
            'Test Description',
            staff.Id,
            staff.Facility__c
        );

        Test.startTest();

        List<CMS_Contact_Notes__c> notes = StaffNotesController.getNotes(
            staff.Id,
            staff.Facility__c
        );

        Test.stopTest();
    }

    @IsTest
    static void testAttachNoteFiles() {

        TestDataFactory.createBaseData();

        Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];

        Id noteId = StaffNotesController.upsertNote(
            null,
            'File Note',
            'File Description',
            staff.Id,
            staff.Facility__c
        );

        String jsonData = JSON.serialize(new List<StaffNotesController.FileWrapper>{
            new StaffNotesController.FileWrapper()
        });

        List<StaffNotesController.FileWrapper> wrappers =
            (List<StaffNotesController.FileWrapper>) JSON.deserialize(jsonData, List<StaffNotesController.FileWrapper>.class);

        wrappers[0].url = 'https://test.com/file';
        wrappers[0].originalName = 'test.pdf';
        wrappers[0].size = '123';
        wrappers[0].key = 'abc123';

        String finalJson = JSON.serialize(wrappers);

        Test.startTest();

        StaffNotesController.attachNoteFiles(
            noteId,
            finalJson,
            null
        );

        Test.stopTest();
    }
}