@isTest
public class LeaveAccrualTodayBatchTest {
    
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
            
            Staff__c staffWithShift = new Staff__c(
                Last_Name__c = 'Eligible Staff',
                Name = 'Eligible Staff',
                Name__c = 'abcd',
                Contact_Number__c = '56789908743',
                Email_Address__c = 'testuser1@example.com',
                Facility__c = fac.Id,
                
                /* REQUIRED ADDRESS */
                Address__Street__s = '8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                
                /* REQUIRED DOB */
                Date_Of_Birth__c = Date.newInstance(2001, 2, 4),
                
                /* OTHER REQUIRED FIELDS */
                Emergency_Phone_Number__c = '45678766675',
                Primary_Contact_Name__c = 'Praveen',
                Primary_Contact_Number__c = '9908458298',
                Make_Primary_as_Approver__c = true,
                Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com',
                
                Status__c = true,
                Type_of_Employe__c = 'Full Time Permanent',
                Annual_Leave_Accrued__c = 0,
                Personal_Leave_Accur__c = 0
            );
            insert staffWithShift;
            
            Staff__c staffNoShift = new Staff__c(
                Last_Name__c = 'No Shift Staff',
                Name = 'No Shift Staff',
                Name__c = 'abcd',
                Contact_Number__c = '56789908743',
                Email_Address__c = 'testuser2@example.com',
                Facility__c = fac.Id,
                
                Address__Street__s = '8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                
                Date_Of_Birth__c = Date.newInstance(2001, 2, 4),
                
                Status__c = true,
                Type_of_Employe__c = 'Part Time Permanent',
                Annual_Leave_Accrued__c = 0,
                Personal_Leave_Accur__c = 0
            );
            insert staffNoShift;
            
            Add_Shift__c shift = new Add_Shift__c(
                Quantity__c = 5,
                Start_Date__c = Date.today().addDays(-1),
                End_Date__c = Date.today(),
                Start_Time__c = Time.newInstance(1, 0, 0, 0),
                End_Time__c = Time.newInstance(9, 0, 0, 0),
                Facility__c = fac.Id,
                Status__c = 'Published'
            );
            insert shift;
            
            ShiftwithStaff__c staffShift = new ShiftwithStaff__c(
                Staff__c = staffWithShift.Id,
                Add_Shift__c = shift.Id,
                Final_Login_DateTime__c =
                DateTime.newInstance(Date.today().addDays(-1), Time.newInstance(1, 0, 0, 0)),
                Final_Logout_DateTime__c =
                DateTime.newInstance(Date.today().addDays(-1), Time.newInstance(9, 0, 0, 0))
                //Actual_Duration__c = 8
            );
            insert staffShift;
        }
    }
    
    @isTest
    static void testLeaveAccrualTodayBatch() {
        
        Test.startTest();
        Database.executeBatch(new LeaveAccrualTodayBatch(), 200);
        
        Test.stopTest();
        
        // No assertions as requested
    }
}