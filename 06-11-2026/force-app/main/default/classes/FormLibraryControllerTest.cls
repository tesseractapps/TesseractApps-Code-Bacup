@isTest
public class FormLibraryControllerTest {

    @TestSetup
    static void setupData() {

        // -----------------------------------------
        // Organisations
        // -----------------------------------------

        List<Organisation__c> orgList =
            new List<Organisation__c>();

        orgList.add(
            new Organisation__c(
                Name = 'Ashfield Consultants',
                ABN__c = '11234567891',
                ACN__c = '878787878',
                RCTI__c = 'RCTI1',
                Email__c = 'dsfdsfsd@gmail.com',
                Bank__c = 'Bank Test',
                BSB__c = 'BSB Test',
                Account_Name__c = 'Test Account',
                Account_Number__c = '1111111111',
                Description__c = 'test Desc',
                Address_Latest__Street__s = '101',
                Address_Latest__City__s = 'Himas Waterhen',
                Address_Latest__PostalCode__s = '2060',
                Address_Latest__CountryCode__s = 'AU',
                Address_Latest__StateCode__s = 'NSW',
                NDIS_Provider__c = '12341234565',
                BMSI_Identifier__c = 'TEST BMSI',
                SoftwareId__c = 'jhdfn18328',
                Branch_code__c = 'BS123',
                Contact_Name__c = 'Test Contact',
                User_Type__c = 'NDIS Org Admin',
                Contact_No__c = '1231231231'
            )
        );

        orgList.add(
            new Organisation__c(
                Name = 'Client Org A',
                ABN__c = '22345678912',
                ACN__c = '979797979',
                RCTI__c = 'RCTI2',
                Email__c = 'clientorga@gmail.com',
                Bank__c = 'Bank Test 2',
                BSB__c = 'BSB Test 2',
                Account_Name__c = 'Client Org A Account',
                Account_Number__c = '2222222222',
                Description__c = 'Client organisation A',
                Address_Latest__Street__s = '202',
                Address_Latest__City__s = 'Sydney',
                Address_Latest__PostalCode__s = '2000',
                Address_Latest__CountryCode__s = 'AU',
                Address_Latest__StateCode__s = 'NSW',
                NDIS_Provider__c = '22341234565',
                BMSI_Identifier__c = 'TEST BMSI A',
                SoftwareId__c = 'clientorga001',
                Branch_code__c = 'BS124',
                Contact_Name__c = 'Client A Contact',
                User_Type__c = 'NDIS Org Admin',
                Contact_No__c = '1231231232'
            )
        );

        insert orgList;


        // -----------------------------------------
        // Library Master Form 1
        // -----------------------------------------

        Dynamic_Form__c masterForm =
            new Dynamic_Form__c(
                Name__c = 'Master Consent Form',
                Form_Type__c = 'Consent',
                Form_JSON__c = '{"fields":[]}',
                Audience__c = 'Participant',
                Version_Label__c = 'v1',
                Is_Library_Form__c = true,
                Library_Status__c = 'Published',
                Form_Origin__c = 'Library Master'
            );

        insert masterForm;


        // -----------------------------------------
        // Library Master Form 2
        // -----------------------------------------

        Dynamic_Form__c masterForm2 =
            new Dynamic_Form__c(
                Name__c = 'Master Staff Onboarding',
                Form_Type__c = 'Onboarding',
                Form_JSON__c = '{"fields":[]}',
                Audience__c = 'Staff',
                Version_Label__c = 'v1',
                Is_Library_Form__c = true,
                Library_Status__c = 'Published',
                Form_Origin__c = 'Library Master'
            );

        insert masterForm2;


        // -----------------------------------------
        // Draft Form
        // -----------------------------------------

        Dynamic_Form__c draftForm =
            new Dynamic_Form__c(
                Name__c = 'Draft Form',
                Form_Type__c = 'Consent',
                Form_JSON__c = '{"fields":[]}',
                Audience__c = 'Participant',
                Is_Library_Form__c = true,
                Library_Status__c = 'Draft'
            );

        insert draftForm;


        // -----------------------------------------
        // Form Assignments
        // -----------------------------------------

        List<Form_Assignment__c> assignments =
            new List<Form_Assignment__c>();

        assignments.add(
            new Form_Assignment__c(
                Dynamic_Form__c = masterForm.Id,
                Organisation__c = orgList[0].Id,
                Status__c = 'Active',
                Assigned_Date__c = System.now()
            )
        );

        assignments.add(
            new Form_Assignment__c(
                Dynamic_Form__c = masterForm2.Id,
                Organisation__c = orgList[0].Id,
                Status__c = 'Active',
                Assigned_Date__c = System.now()
            )
        );

        assignments.add(
            new Form_Assignment__c(
                Dynamic_Form__c = masterForm.Id,
                Organisation__c = orgList[1].Id,
                Status__c = 'Inactive',
                Assigned_Date__c = System.now()
            )
        );

        insert assignments;
    }


    // =====================================================
    // TEST 1
    // checkCanAssignPermission
    // =====================================================

    @isTest
    static void testCheckCanAssignPermission() {

        Test.startTest();

        Boolean result =
            FormLibraryController.checkCanAssignPermission();

        Test.stopTest();

        System.assertNotEquals(
            null,
            result
        );
    }


    // =====================================================
    // TEST 2
    // getAvailableOrganisations
    // =====================================================

    @isTest
    static void testGetAvailableOrganisations() {

        Test.startTest();

        List<Organisation__c> result =
            FormLibraryController.getAvailableOrganisations();

        Test.stopTest();

        System.assertEquals(
            2,
            result.size()
        );

        System.assertEquals(
            'Ashfield Consultants',
            result[0].Name
        );

        System.assertEquals(
            'Client Org A',
            result[1].Name
        );
    }


    // =====================================================
    // TEST 3
    // getLibraryForms - Audience = Participant
    // =====================================================

    @isTest
    static void testGetLibraryFormsParticipant() {

        Organisation__c orgRecord =
            [
                SELECT Id
                FROM Organisation__c
                WHERE Name = 'Ashfield Consultants'
                LIMIT 1
            ];

        Test.startTest();

        List<Dynamic_Form__c> result =
            FormLibraryController.getLibraryForms(
                orgRecord.Id,
                'Participant',
                null
            );

        Test.stopTest();

        System.assertEquals(
            1,
            result.size()
        );

        System.assertEquals(
            'Master Consent Form',
            result[0].Name__c
        );
    }


    // =====================================================
    // TEST 4
    // getLibraryForms - Audience = All
    // =====================================================

    @isTest
    static void testGetLibraryFormsAllAudience() {

        Organisation__c orgRecord =
            [
                SELECT Id
                FROM Organisation__c
                WHERE Name = 'Ashfield Consultants'
                LIMIT 1
            ];

        Test.startTest();

        List<Dynamic_Form__c> result =
            FormLibraryController.getLibraryForms(
                orgRecord.Id,
                'All',
                null
            );

        Test.stopTest();

        System.assertEquals(
            2,
            result.size()
        );
    }


    // =====================================================
    // TEST 5
    // getLibraryForms - Search Key
    // =====================================================

    @isTest
    static void testGetLibraryFormsSearch() {

        Organisation__c orgRecord =
            [
                SELECT Id
                FROM Organisation__c
                WHERE Name = 'Ashfield Consultants'
                LIMIT 1
            ];

        Test.startTest();

        List<Dynamic_Form__c> result =
            FormLibraryController.getLibraryForms(
                orgRecord.Id,
                'All',
                'Consent'
            );

        Test.stopTest();

        System.assertEquals(
            1,
            result.size()
        );

        System.assertEquals(
            'Master Consent Form',
            result[0].Name__c
        );
    }


    // =====================================================
    // TEST 6
    // getLibraryForms - Null Organisation
    // =====================================================

    @isTest
    static void testGetLibraryFormsNullOrganisation() {

        Test.startTest();

        List<Dynamic_Form__c> result =
            FormLibraryController.getLibraryForms(
                null,
                'All',
                null
            );

        Test.stopTest();

        System.assertEquals(
            0,
            result.size()
        );
    }


    // =====================================================
    // TEST 7
    // getFormAssignments
    // =====================================================

    @isTest
    static void testGetFormAssignments() {

        Dynamic_Form__c masterForm =
            [
                SELECT Id
                FROM Dynamic_Form__c
                WHERE Name__c = 'Master Consent Form'
                LIMIT 1
            ];

        Test.startTest();

        List<Form_Assignment__c> result =
            FormLibraryController.getFormAssignments(
                masterForm.Id
            );

        Test.stopTest();

        System.assertEquals(
            1,
            result.size()
        );

        System.assertEquals(
            'Active',
            result[0].Status__c
        );
    }


    // =====================================================
    // TEST 8
    // getFormAssignments - Null
    // =====================================================

    @isTest
    static void testGetFormAssignmentsNull() {

        Test.startTest();

        List<Form_Assignment__c> result =
            FormLibraryController.getFormAssignments(
                null
            );

        Test.stopTest();

        System.assertEquals(
            0,
            result.size()
        );
    }


    // =====================================================
    // TEST 9
    // saveFormAssignments
    //
    // Covers:
    // - Existing Active assignment stays Active
    // - Existing Inactive assignment becomes Active
    // - New assignment gets inserted
    // - Master form updated
    // =====================================================

    @isTest
    static void testSaveFormAssignments() {

        Dynamic_Form__c masterForm =
            [
                SELECT Id,
                       Is_Library_Form__c,
                       Library_Status__c,
                       Form_Origin__c
                FROM Dynamic_Form__c
                WHERE Name__c = 'Master Consent Form'
                LIMIT 1
            ];


        List<Organisation__c> organisations =
            [
                SELECT Id,
                       Name
                FROM Organisation__c
                ORDER BY Name ASC
            ];


        List<Id> organisationIds =
            new List<Id>();


        for (
            Organisation__c orgRecord :
            organisations
        ) {
            organisationIds.add(
                orgRecord.Id
            );
        }


        Test.startTest();

        FormLibraryController.saveFormAssignments(
            masterForm.Id,
            organisationIds
        );

        Test.stopTest();


        Dynamic_Form__c updatedForm =
            [
                SELECT Id,
                       Is_Library_Form__c,
                       Library_Status__c,
                       Form_Origin__c
                FROM Dynamic_Form__c
                WHERE Id = :masterForm.Id
                LIMIT 1
            ];


        System.assertEquals(
            true,
            updatedForm.Is_Library_Form__c
        );

        System.assertEquals(
            'Published',
            updatedForm.Library_Status__c
        );

        System.assertEquals(
            'Library Master',
            updatedForm.Form_Origin__c
        );


        List<Form_Assignment__c> assignments =
            [
                SELECT Id,
                       Organisation__c,
                       Status__c
                FROM Form_Assignment__c
                WHERE Dynamic_Form__c = :masterForm.Id
            ];


        System.assertEquals(
            2,
            assignments.size()
        );


        for (
            Form_Assignment__c assignment :
            assignments
        ) {
            System.assertEquals(
                'Active',
                assignment.Status__c
            );
        }
    }


    // =====================================================
    // TEST 10
    // saveFormAssignments - Deactivate Existing
    // =====================================================

    @isTest
    static void testSaveFormAssignmentsDeactivate() {

        Dynamic_Form__c masterForm =
            [
                SELECT Id
                FROM Dynamic_Form__c
                WHERE Name__c = 'Master Consent Form'
                LIMIT 1
            ];


        Test.startTest();

        FormLibraryController.saveFormAssignments(
            masterForm.Id,
            new List<Id>()
        );

        Test.stopTest();


        List<Form_Assignment__c> assignments =
            [
                SELECT Id,
                       Status__c
                FROM Form_Assignment__c
                WHERE Dynamic_Form__c = :masterForm.Id
            ];


        System.assertEquals(
            2,
            assignments.size()
        );


        for (
            Form_Assignment__c assignment :
            assignments
        ) {
            System.assertEquals(
                'Inactive',
                assignment.Status__c
            );
        }
    }


    // =====================================================
    // TEST 11
    // saveFormAssignments - Null Form
    // =====================================================

    @isTest
    static void testSaveFormAssignmentsNullForm() {

        Boolean exceptionThrown =
            false;

        try {

            Test.startTest();

            FormLibraryController.saveFormAssignments(
                null,
                new List<Id>()
            );

            Test.stopTest();

        } catch (Exception e) {

            exceptionThrown = true;
        }


        System.assertEquals(
            true,
            exceptionThrown
        );
    }


    // =====================================================
    // TEST 12
    // saveFormAssignments - Organisation Form Origin
    //
    // Covers:
    // if Form_Origin__c == 'Organisation Form'
    // =====================================================

    @isTest
    static void testSaveFormAssignmentsOrganisationOrigin() {

        Dynamic_Form__c organisationForm =
            new Dynamic_Form__c(
                Name__c = 'Organisation Test Form',
                Form_Type__c = 'Consent',
                Form_JSON__c = '{"fields":[]}',
                Audience__c = 'Participant',
                Version_Label__c = 'v1',
                Is_Library_Form__c = false,
                Library_Status__c = 'Draft',
                Form_Origin__c = 'Organisation Form'
            );

        insert organisationForm;


        Organisation__c orgRecord =
            [
                SELECT Id
                FROM Organisation__c
                WHERE Name = 'Ashfield Consultants'
                LIMIT 1
            ];


        Test.startTest();

        FormLibraryController.saveFormAssignments(
            organisationForm.Id,
            new List<Id>{
                orgRecord.Id
            }
        );

        Test.stopTest();


        Dynamic_Form__c updatedForm =
            [
                SELECT Id,
                       Is_Library_Form__c,
                       Library_Status__c,
                       Form_Origin__c
                FROM Dynamic_Form__c
                WHERE Id = :organisationForm.Id
                LIMIT 1
            ];


        System.assertEquals(
            true,
            updatedForm.Is_Library_Form__c
        );

        System.assertEquals(
            'Published',
            updatedForm.Library_Status__c
        );

        System.assertEquals(
            'Library Master',
            updatedForm.Form_Origin__c
        );
    }


    // =====================================================
    // TEST 13
    // cloneLibraryForms
    // =====================================================

    @isTest
    static void testCloneLibraryForms() {

        Dynamic_Form__c masterForm =
            [
                SELECT Id,
                       Name__c,
                       Form_JSON__c,
                       Form_Type__c,
                       Audience__c
                FROM Dynamic_Form__c
                WHERE Name__c = 'Master Consent Form'
                LIMIT 1
            ];


        Organisation__c targetOrg =
            [
                SELECT Id
                FROM Organisation__c
                WHERE Name = 'Ashfield Consultants'
                LIMIT 1
            ];


        Test.startTest();

        List<Id> clonedIds =
            FormLibraryController.cloneLibraryForms(
                new List<Id>{
                    masterForm.Id
                },
                targetOrg.Id
            );

        Test.stopTest();


        System.assertEquals(
            1,
            clonedIds.size()
        );


        Dynamic_Form__c clonedForm =
            [
                SELECT Id,
                       Name__c,
                       Form_JSON__c,
                       Form_Type__c,
                       Audience__c,
                       Org_Id__c,
                       Form_Group_Id__c,
                       Version_Label__c,
                       Is_Assigned__c,
                       Is_Library_Form__c,
                       Form_Origin__c,
                       Source_Form__c
                FROM Dynamic_Form__c
                WHERE Id = :clonedIds[0]
                LIMIT 1
            ];


        System.assertEquals(
            masterForm.Name__c,
            clonedForm.Name__c
        );

        System.assertEquals(
            masterForm.Form_JSON__c,
            clonedForm.Form_JSON__c
        );

        System.assertEquals(
            masterForm.Form_Type__c,
            clonedForm.Form_Type__c
        );

        System.assertEquals(
            masterForm.Audience__c,
            clonedForm.Audience__c
        );

        System.assertEquals(
            String.valueOf(targetOrg.Id),
            clonedForm.Org_Id__c
        );

        System.assertEquals(
            'v1',
            clonedForm.Version_Label__c
        );

        System.assertEquals(
            false,
            clonedForm.Is_Assigned__c
        );

        System.assertEquals(
            false,
            clonedForm.Is_Library_Form__c
        );

        System.assertEquals(
            'Library Clone',
            clonedForm.Form_Origin__c
        );

        System.assertEquals(
            masterForm.Id,
            clonedForm.Source_Form__c
        );

        System.assertNotEquals(
            null,
            clonedForm.Form_Group_Id__c
        );
    }


    // =====================================================
    // TEST 14
    // cloneLibraryForms - Invalid Input
    // =====================================================

    @isTest
    static void testCloneLibraryFormsInvalidInput() {

        Boolean exceptionThrown =
            false;

        try {

            Test.startTest();

            FormLibraryController.cloneLibraryForms(
                new List<Id>(),
                null
            );

            Test.stopTest();

        } catch (Exception e) {

            exceptionThrown = true;
        }


        System.assertEquals(
            true,
            exceptionThrown
        );
    }


    // =====================================================
    // TEST 15
    // cloneLibraryForms - No Active Assignment
    // =====================================================

    @isTest
    static void testCloneLibraryFormsNoAssignment() {

        Dynamic_Form__c masterForm =
            [
                SELECT Id
                FROM Dynamic_Form__c
                WHERE Name__c = 'Master Staff Onboarding'
                LIMIT 1
            ];


        Organisation__c targetOrg =
            [
                SELECT Id
                FROM Organisation__c
                WHERE Name = 'Client Org A'
                LIMIT 1
            ];


        Boolean exceptionThrown =
            false;


        try {

            Test.startTest();

            FormLibraryController.cloneLibraryForms(
                new List<Id>{
                    masterForm.Id
                },
                targetOrg.Id
            );

            Test.stopTest();

        } catch (Exception e) {

            exceptionThrown = true;
        }


        System.assertEquals(
            true,
            exceptionThrown
        );
    }
}