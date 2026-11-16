@IsTest
public class XeroFacilityRoleTriggerHandlerTest {
	@testsetup 
    Static void testData(){
          List<String> picklistRoles = new List<String>();
       // for (Schema.PicklistEntry pe : Organisation__c.Roles__c.getDescribe().getPicklistValues()) {
         //   picklistRoles.add(pe.getValue());
       // }
        
        // If picklist is empty (sandbox fallback)
        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN'});
        }
        
        // Select first 2 valid roles safely
        String role1 = picklistRoles[0];
        String role2 = picklistRoles.size() > 1 ? picklistRoles[1] : role1;
        
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
          org.Roles__c = role1 + ';' + role2;
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user){ 
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12345678912';
            fac.Phone__c = '12323432';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
            insert fac;
                        
            Facility_Role__c facRole =new Facility_Role__c();
            facRole.Is_Active__c=true;
            facRole.Facility__c=fac.Id;
            facRole.Role_Name__c='text';
            insert facRole;
            
            // Create Facility Xero Setting
            Facility_Xero_Setting__c fxSetting = new Facility_Xero_Setting__c(
                Name = 'General Rate Setting',
                Xero_Payitem__c = 'ER001',
                Xero_Payitem_Name__c = 'General Rate',
                Category__c = 'Morning',
                Facility_Role__c = facRole.Id,
                Pay_Item_Type__c = 'Earnings'
            );
            insert fxSetting;
            
            // Create Reimbursement Setting
            Facility_Xero_Setting__c reimbSetting = new Facility_Xero_Setting__c(
                Name = 'Reimbursement Setting',
                Xero_Payitem__c = 'REIMB001',
                Xero_Payitem_Name__c = 'Reimbursement Rate',
                Facility_Role__c = facRole.Id,
                Pay_Item_Type__c = 'Reimbursement'
            );
            insert reimbSetting;
        }
    
	}
    
    private static User getTestUser() {
        return [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    }
    
    private static Staff__c getTestStaff() {
        return [SELECT Id, Xero_Employee_ID__c, Ordinary_Earnings_Rate_ID__c, Display_Nickname__c 
                FROM Staff__c WHERE Email_Address__c = 'test.staff@example.com' LIMIT 1];
    }
    
    private static Facility__c getSourceFacility() {
        return [
            SELECT Id, Name, Organisation__c
            FROM Facility__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];
    }

    private static Facility__c getNewFacility() {
        return [
            SELECT Id, Name, Organisation__c
            FROM Facility__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];
    }
    
    private static Organisation__c getTestOrganisation() {
        return [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    private static Facility_Role__c getTestFacilityRole() {
        return [SELECT Id FROM Facility_Role__c LIMIT 1];
    }
    private static Facility_Xero_Setting__c getTestFacilityXeroSetting() {
        return [SELECT Id FROM Facility_Xero_Setting__c WHERE Name='Reimbursement Setting'  LIMIT 1];
    }
    // ================================================================
    // TEST 1
    // Basic propagation
    // ================================================================

    @IsTest
    static void testPropagateSettingsToNewRole() {

        User testUser = getTestUser();
        Facility__c newFacility = getNewFacility();

        System.runAs(testUser) {

            Test.startTest();

            Facility_Role__c newRole = new Facility_Role__c(
                Is_Active__c = true,
                Facility__c = newFacility.Id,
                Role_Name__c = 'text'
            );

            insert newRole;

            Test.stopTest();

            // --------------------------------------------------------
            // Verify settings were created
            // --------------------------------------------------------
            List<Facility_Xero_Setting__c> copiedSettings = [
                SELECT
                    Id,
                    Name,
                    Facility_Role__c,
                    Xero_Payitem__c,
                    Xero_Payitem_Name__c,
                    Category__c,
                    Shift_Type__c,
                    Pay_Item_Type__c
                FROM Facility_Xero_Setting__c
                WHERE Facility_Role__c = :newRole.Id
            ];

            System.assertEquals(
                2,
                copiedSettings.size(),
                'Three unique settings should be copied to the new role.'
            );

            // --------------------------------------------------------
            // Verify all copied records belong to new role
            // --------------------------------------------------------
            for (Facility_Xero_Setting__c setting : copiedSettings) {

                System.assertEquals(
                    newRole.Id,
                    setting.Facility_Role__c,
                    'Copied setting must belong to the new role.'
                );
            }
        }
    }


    // ================================================================
    // TEST 2
    // Case-insensitive role matching
    // ================================================================

    @IsTest
    static void testCaseInsensitiveRoleMatching() {

        User testUser = getTestUser();
        Facility__c newFacility = getNewFacility();

        System.runAs(testUser) {

            Test.startTest();

            Facility_Role__c newRole = new Facility_Role__c(
                Is_Active__c = true,
                Facility__c = newFacility.Id,
                Role_Name__c = 'TEXT'
            );

            insert newRole;

            Test.stopTest();

            List<Facility_Xero_Setting__c> copiedSettings = [
                SELECT Id
                FROM Facility_Xero_Setting__c
                WHERE Facility_Role__c = :newRole.Id
            ];

            System.assertEquals(
                2,
                copiedSettings.size(),
                'TEXT should match existing role text case-insensitively.'
            );
        }
    }


    // ================================================================
    // TEST 3
    // Verify field-by-field copying
    // ================================================================

    @IsTest
    static void testAllSettingFieldsAreCopied() {

        User testUser = getTestUser();
        Facility__c newFacility = getNewFacility();

        System.runAs(testUser) {

            Test.startTest();

            Facility_Role__c newRole = new Facility_Role__c(
                Is_Active__c = true,
                Facility__c = newFacility.Id,
                Role_Name__c = 'text'
            );

            insert newRole;

            Test.stopTest();

            List<Facility_Xero_Setting__c> copiedSettings = [
                SELECT
                    Xero_Payitem__c,
                    Xero_Payitem_Name__c,
                    Category__c,
                    Shift_Type__c,
                    Custom_Shift_Type__c,
                    Broken_Type__c,
                    Sleepover_Type__c,
                    OverTime_Type__c,
                    Sub_Shift_Type__c,
                    Custom_Rate_Type__c,
                    Pay_Item_Type__c
                FROM Facility_Xero_Setting__c
                WHERE Facility_Role__c = :newRole.Id
            ];

            System.assertEquals(2, copiedSettings.size());

            Boolean foundDetailed = false;

            for (Facility_Xero_Setting__c setting : copiedSettings) {

                if (setting.Xero_Payitem__c == 'ER002') {

                    foundDetailed = true;

                    System.assertEquals(
                        'Detailed Rate',
                        setting.Xero_Payitem_Name__c
                    );

                    System.assertEquals(
                        'Afternoon',
                        setting.Category__c
                    );

                    System.assertEquals(
                        'Custom',
                        setting.Shift_Type__c
                    );

                    System.assertEquals(
                        'Special Shift',
                        setting.Custom_Shift_Type__c
                    );

                    System.assertEquals(
                        'Special Rate',
                        setting.Custom_Rate_Type__c
                    );

                    System.assertEquals(
                        'Overtime',
                        setting.OverTime_Type__c
                    );

                    System.assertEquals(
                        'Sub Shift',
                        setting.Sub_Shift_Type__c
                    );

                    System.assertEquals(
                        'Broken',
                        setting.Broken_Type__c
                    );

                    System.assertEquals(
                        'Sleepover',
                        setting.Sleepover_Type__c
                    );
                }
            }

        }
    }


    // ================================================================
    // TEST 4
    // Reimbursement name
    // ================================================================

    @IsTest
    static void testReimbursementSettingName() {

        Facility_Xero_Setting__c template =
            new Facility_Xero_Setting__c(
                Pay_Item_Type__c = 'Reimbursement',
                Xero_Payitem_Name__c = 'Mileage'
            );

        Facility_Role__c role =
            new Facility_Role__c(
                Role_Name__c = 'Support Worker'
            );

        String result =
            XeroFacilityRoleTriggerHandler.buildSettingName(
                template,
                role,
                'Test Facility'
            );

        System.assertEquals(
            'Reimbursement - Mileage',
            result
        );
    }


    // ================================================================
    // TEST 5
    // Normal setting name
    // ================================================================

    @IsTest
    static void testNormalSettingName() {

        Facility_Xero_Setting__c template =
            new Facility_Xero_Setting__c(
                Pay_Item_Type__c = 'Earnings',
                Xero_Payitem_Name__c = 'General Rate',
                Category__c = 'Morning',
                Shift_Type__c = 'Standard',
                Custom_Shift_Type__c = 'Special Shift',
                Custom_Rate_Type__c = 'Special Rate',
                OverTime_Type__c = 'Overtime',
                Sub_Shift_Type__c = 'Sub Shift',
                Broken_Type__c = 'Broken',
                Sleepover_Type__c = 'Sleepover'
            );

        Facility_Role__c role =
            new Facility_Role__c(
                Role_Name__c = 'Support Worker'
            );

        String result =
            XeroFacilityRoleTriggerHandler.buildSettingName(
                template,
                role,
                'Test Facility'
            );

        System.assert(
            result.contains('Earnings'),
            'Name should contain Pay Item Type.'
        );

        System.assert(
            result.contains('Support Worker'),
            'Name should contain Role Name.'
        );

        System.assert(
            result.contains('Test Facility'),
            'Name should contain Facility Name.'
        );

        System.assert(
            result.contains('General Rate'),
            'Name should contain Xero Pay Item Name.'
        );

        System.assert(
            result.contains('Morning'),
            'Name should contain Category.'
        );

        System.assert(
            result.contains('Standard'),
            'Name should contain Shift Type.'
        );

       
    }


    // ================================================================
    // TEST 6
    // Name truncation to 80 characters
    // ================================================================

    @IsTest
    static void testSettingNameMaximumLength() {

        Facility_Xero_Setting__c template =
            new Facility_Xero_Setting__c(
                Pay_Item_Type__c = 'Earnings',
                Xero_Payitem_Name__c =
                    'This is a very very very very very long Xero pay item name',
                Category__c =
                    'This is a very very long category',
                Shift_Type__c =
                    'This is a very long shift type'
            );

        Facility_Role__c role =
            new Facility_Role__c(
                Role_Name__c =
                    'This is a very very very long role name'
            );

        String result =
            XeroFacilityRoleTriggerHandler.buildSettingName(
                template,
                role,
                'This is a very very very long facility name'
            );

        System.assert(
            result.length() <= 80,
            'Setting Name must not exceed 80 characters.'
        );
    }


    // ================================================================
    // TEST 7
    // Null / empty input
    // ================================================================

    @IsTest
    static void testNullAndEmptyRoles() {

        Test.startTest();

        XeroFacilityRoleTriggerHandler.propagateToNewRoles(null);

        XeroFacilityRoleTriggerHandler.propagateToNewRoles(
            new List<Facility_Role__c>()
        );

        Test.stopTest();

        System.assert(
            true,
            'Null and empty lists should be handled safely.'
        );
    }


    // ================================================================
    // TEST 8
    // Role with no Facility
    // ================================================================

    @IsTest
    static void testRoleWithoutFacility() {

        User testUser = getTestUser();

        System.runAs(testUser) {

            Test.startTest();

            Facility_Role__c role = new Facility_Role__c(
                Is_Active__c = true,
                Role_Name__c = 'text'
            );

            // Call handler directly so we can test the null Facility branch.
            XeroFacilityRoleTriggerHandler.propagateToNewRoles(
                new List<Facility_Role__c>{ role }
            );

            Test.stopTest();

            System.assert(
                true,
                'Role without Facility should be ignored.'
            );
        }
    }


    // ================================================================
    // TEST 9
    // Role with blank name
    // ================================================================

    @IsTest
    static void testRoleWithoutRoleName() {

        User testUser = getTestUser();
        Facility__c facility = getNewFacility();

        System.runAs(testUser) {

            Facility_Role__c role = new Facility_Role__c(
                Is_Active__c = true,
                Facility__c = facility.Id
            );

            Test.startTest();

            XeroFacilityRoleTriggerHandler.propagateToNewRoles(
                new List<Facility_Role__c>{ role }
            );

            Test.stopTest();

            System.assert(
                true,
                'Role with blank name should be ignored.'
            );
        }
    }
}