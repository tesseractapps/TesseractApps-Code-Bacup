@IsTest
private class StaffContactControllerTest {

    @IsTest
    static void testSaveStaffContacts_MainFlow() {

        TestDataFactory.createBaseData();

        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        // 🔥 Existing contact (to test delete)
        Staff_Contact__c existing = new Staff_Contact__c(
            Staff__c = staff.Id,
            First_Name__c = 'Old',
            Phone__c = '1234567890'
        );
        insert existing;

        // 🔥 JSON with:
        // - valid row
        // - empty row (skip)
        String jsonInput = JSON.serialize(new List<Object>{
            new Map<String, Object>{
                'firstName' => 'John',
                'lastName' => 'Doe',
                'contactNumber' => '9876543210',
                'relationship' => 'Friend',
                'email' => 'john@test.com',
                'contactType' => 'Emergency'
            },
            new Map<String, Object>{
                'firstName' => '',
                'contactNumber' => ''
            }
        });

        Test.startTest();
        List<Staff_Contact__c> result =
            StaffContactController.saveStaffContacts(staff.Id, jsonInput);
        Test.stopTest();
    }

    @IsTest
    static void testSaveStaffContacts_BlankInput() {

        Test.startTest();
        List<Staff_Contact__c> result =
            StaffContactController.saveStaffContacts(null, '');
        Test.stopTest();
    }
}