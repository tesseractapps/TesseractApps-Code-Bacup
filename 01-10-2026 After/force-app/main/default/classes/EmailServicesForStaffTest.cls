@isTest
private class EmailServicesForStaffTest 
{
    @isTest
    static void testEmailUtility()
    {
        Test.StartTest();
        EmailServiceForStaff.sendingEmail('test@test.com','test@test.com','Unit Test X', 'Unit Test');
        
        Test.stopTest();
    }
}