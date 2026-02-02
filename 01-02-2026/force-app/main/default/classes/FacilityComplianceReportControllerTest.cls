@IsTest
private class FacilityComplianceReportControllerTest {
    
    @TestSetup
    static void setupData() {
              Organisation__c org = new Organisation__c(
            Name = 'Ashfield Consultants',
            ABN__c = '11234567891',
            ACN__c = '878787878',
            Contact_No__c = '6132899740',
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
            User_Type__c = 'NDIS Org Admin'
        );
        insert org;
        
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen',
            Email = 'testuser1@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Test',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser_' + DateTime.now().getTime() + '@example.com',
            Organization_Name__c = org.Name
        );
        insert user;
        
        System.runAs(user) {
            Facility__c fac = new Facility__c(
                Name = 'Ashfield Consultants',
                Address__City__s = 'Crace',
                Address__Street__s = '8 Keewong Street',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                Email__c = 'testonefacility@gmail.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '12234567',
                Phone__c = '12323432'
            );
            insert fac;
            
            Staff__c staff = new Staff__c(
                Last_Name__c = 'Test staff',
                Name = 'praveen1',
                Name__c = 'abcd',
                Contact_Number__c = '56789908743',
                Email_Address__c = 'testuser1@example.com',
                Facility__c = fac.Id,
                Address__Street__s = '8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Emergency_Phone_Number__c = '45678766675',
                Primary_Contact_Name__c = 'Praveen',
                Primary_Contact_Number__c = '9908458298',
                Make_Primary_as_Approver__c = true,
                Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com',
                Secondary_Contact_Name__c = 'maheswari',
                Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com',
                Make_Secondary_as_Approver__c = false,
                Secondary_Contact_Number__c = '99084582958',
                Emp_exit_date__c = Date.newInstance(2028, 01, 05),
                Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
                Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04),
                Date_Of_Birth__c = Date.newInstance(2001, 02, 04),
                Role__c = 'Admin',
                Residency_Type__c = 'Australian',
                Expiry_Date__c = Date.newInstance(2025, 02, 19),
                Type__c = 'Visa Status',
                Working_Hours_Rate__c = 50,
                Final_Overall_Rate__c = 150,
                Saturday_Hourly_Rate__c = 130,
                Sunday_Hourly_Rate__c = 50
            );
            insert staff;
            
            // Staff Role
            StaffRole__c role = new StaffRole__c(
               // Staff__c = staff.Id,
                RoleName__c = 'Admin',
                Active__c = true
            );
            insert role;
    
            // Identity Document (Primary)
            Facility_Compliance_Setting__c idDoc = new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Document_Name__c = 'Passport',
                Compliance_Category__c = 'Identity',
                Identity_Category__c = 'Primary',
                Identity_Points__c = 70,
                Visible_to_Staff__c = true,
                Roles__c = 'Admin'
            );
            insert idDoc;

            // Other Document
            Facility_Compliance_Setting__c otherDoc = new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Document_Name__c = 'Police Check',
                Compliance_Category__c = 'Documents',
                Visible_to_Staff__c = true
            );
            insert otherDoc;
    
            // Training Document
            Facility_Compliance_Setting__c trainingDoc = new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Document_Name__c = 'Manual Handling',
                Compliance_Category__c = 'Trainings',
                Visible_to_Staff__c = true
            );
            insert trainingDoc;
        }
    }

    @IsTest
    static void testGetFacilityComplianceSuccess() {

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        Test.startTest();
        FacilityComplianceReportController.FacilityComplianceWrapper result =
            FacilityComplianceReportController.getFacilityCompliance(fac.Id);
        Test.stopTest();

        // Validate wrapper
        System.assertNotEquals(null, result, 'Wrapper should not be null');
       // Staff__c staff = result.staff[0];        
    }

    @IsTest
    static void testFacilityWithNoData() {       
        Organisation__c org = [SELECT ID from Organisation__c LIMIT 1];		
        Facility__c Facility  = [SELECT Id FROM Facility__c];

        Test.startTest();
        FacilityComplianceReportController.FacilityComplianceWrapper result = FacilityComplianceReportController.getFacilityCompliance(Facility.Id);
        Test.stopTest();
    }
}