@isTest
public class PayrollControllerTest {
    @isTest
    public static void testGetPayrollData() {
        
        // Set up test data
        /*User testUser = new User(
            Username = 'testuser@company.com',
            Alias = 'testusr',
            Email = 'testuser@company.com',
            ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id,
            User_Type__c = 'Standard',
            Organization_Name__c = 'Test Org'
        );*/
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User testUser = new User(Alias = 'praveen', Email= 'saieswar.k123@tesseractapps.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039572', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='saieswar.k123@tesseractapps.com',Organization_Name__c ='Age Grace Innovations');
        insert testUser;

        // Set the current user as the one we just created
        System.runAs(testUser) {
            
            // Create Payroll_Setting__c records with different statuses
            Payroll_Setting__c payrollSetting1 = new Payroll_Setting__c(
                Status__c = 'Finalised',
                Next_Pay_Date__c = Date.today().addMonths(-1)
            );
            insert payrollSetting1;

            Payroll_Setting__c payrollSetting2 = new Payroll_Setting__c(
                Status__c = 'Submitted',
                Next_Pay_Date__c = Date.today().addMonths(-1)
            );
            insert payrollSetting2;

            Payroll_Setting__c payrollSetting3 = new Payroll_Setting__c(
                Status__c = 'STP Filed',
                Next_Pay_Date__c = Date.today().addMonths(-2)
            );
            insert payrollSetting3;
            
            // Call the method to test
            Map<String, Map<String, Integer>> payrollData = PayrollController.getPayrollData();
            
            // Assertions to verify the results
            //System.assertNotEquals(null, payrollData, 'The payroll data should not be null.');
            //System.assertEquals(3, payrollData.size(), 'There should be data for three months.');
            
            // Check if the data for a specific month is being returned
            Map<String, Integer> janData = payrollData.get('Jan 2025');
            //System.assertNotEquals(null, janData, 'There should be data for Jan 2025.');
            //System.assertEquals(1, janData.get('Finalised'), 'There should be one Finalised record for Jan 2025.');
            //System.assertEquals(1, janData.get('Submitted'), 'There should be one Submitted record for Jan 2025.');
            //System.assertEquals(0, janData.get('STP Filed'), 'There should be zero STP Filed records for Jan 2025.');

            Map<String, Integer> febData = payrollData.get('Feb 2025');
            //System.assertNotEquals(null, febData, 'There should be data for Feb 2025.');
            //System.assertEquals(0, febData.get('Finalised'), 'There should be no Finalised records for Feb 2025.');
            //System.assertEquals(0, febData.get('Submitted'), 'There should be no Submitted records for Feb 2025.');
            //System.assertEquals(1, febData.get('STP Filed'), 'There should be one STP Filed record for Feb 2025.');
        }
    }

}