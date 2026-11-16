@IsTest
public class EmailSenderNotificationTest {

    @IsTest
    static void testSendSingleEmail_Success() {
               
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
      
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user){   

        // Prepare test input
        String[] toAddresses = new String[] { 'test@example.com' };
        String subject = 'Test Subject';
        String body = '<p>This is a test email body</p>';

        Test.startTest();
        EmailSenderNotification.SendEmailResult result = EmailSenderNotification.sendSingleEmail(toAddresses, subject, body);
        Test.stopTest();
        }

    }

    @IsTest
    static void testSendSingleEmail_ExceptionHandling() {
       
        String[] toAddresses = null;
        String subject = 'Test Subject';
        String body = '<p>This is a test email body</p>';

        Test.startTest();
        EmailSenderNotification.SendEmailResult result = EmailSenderNotification.sendSingleEmail(toAddresses, subject, body);
        Test.stopTest();

      
    }
}