@isTest
public class CompletionCertificateServiceTest {
    
    @TestSetup
    static void setupTestData() {
        // =============================================
        // CREATE ORGANISATION
        // =============================================
        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = 'BSB Test';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        org.Week_Start_Day__c = 'Monday';
        org.Roles__c = 'Admin;AIN';
       // org.Address__c = 'Sydney, NSW, Australia';
        insert org;
        
        // =============================================
        // CREATE USER
        // =============================================
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        User user = new User(
            Alias = 'testuser',
            Email = 'testuser98765544@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'TestUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser98765544@example.com',
            User_Type__c = 'NDIS Org Admin',
            Organization_Name__c = 'Ashfield Consultants'
          
        );
        insert user;
        
        // =============================================
        // CREATE FACILITY
        // =============================================
        System.runAs(user) {
            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Consultants';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testonefacility@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '12345678901';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c = 'Ndis';
            insert fac;
            
            // =============================================
            // CREATE STAFF
            // =============================================
            Staff__c staff = new Staff__c();
            staff.Last_Name__c = 'Test staff';
            staff.Name = 'praveen1';
            staff.Name__c = 'abcd';
            staff.Contact_Number__c = '56789908743';
            staff.Email_Address__c = user.Email;
            staff.Facility__c = fac.Id;
            staff.Address__Street__s = '8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s = 'ACT';
            staff.Address__PostalCode__s = '2911';
            staff.Emergency_Phone_Number__c = '45678766675';
            staff.Primary_Contact_Name__c = 'Praveen';
            staff.Primary_Contact_Number__c = '9908458298';
            staff.Make_Primary_as_Approver__c = true;
            staff.Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c = 'maheswari';
            staff.Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c = false;
            staff.Secondary_Contact_Number__c = '99084582958';
            staff.Emp_exit_date__c = Date.newInstance(2028, 1, 5);
            staff.Emp_Start_Date__c = Date.newInstance(2023, 2, 1);
            staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4);
            staff.Date_Of_Birth__c = Date.newInstance(2001, 2, 4);
            staff.role__c = 'Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = Date.newInstance(2025, 2, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c = 50;
            staff.Final_Overall_Rate__c = 150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Status__c = true;
            staff.Restrict_Set_Hours__c = false;
            staff.Set_Hours__c = 40;
            insert staff;
            
            // =============================================
            // CREATE OFFER TEMPLATE DOCUMENT TYPE
            // =============================================
            OfferTemplateDocumentType__c docType = new OfferTemplateDocumentType__c();
            docType.Document_Type_Name__c = 'Agreement';
            insert docType;
            
            // =============================================
            // CREATE OFFER TEMPLATE
            // =============================================
            Offer_Template__c offer = new Offer_Template__c();
            offer.File_Name__c = 'Offer Document.pdf';
            offer.All_Recipients__c = 'signer1@example.com\nsigner2@example.com';
            offer.Current_Recipient__c = 'signer2@example.com';
            offer.Current_Recipient_Status__c = 'Pending';
            offer.Sender_Email__c = user.Email;
            offer.OfferTemplateDocumentType__c = docType.Id;
            offer.Orgnisation_Id__c = org.Id;
            offer.Type__c = 'Default';
            offer.Comments__c = 'Test Offer';
            insert offer;
            
            // =============================================
            // CREATE CHILD SIGNATURES
            // =============================================
            Child_Signatures__c sig1 = new Child_Signatures__c();
            sig1.Offer_Template__c = offer.Id;
            sig1.Recipient_Email__c = 'signer1@example.com';
            sig1.Status__c = 'Pending';
            sig1.Fingerprint__c = '{"sessionGuid":"abc-123","timestamp":"2024-01-01","ipAddress":"192.168.1.1","userAgent":"Chrome","platform":"Windows"}';
            sig1.Signature_URL__c = 'https://example.com/signature1.pdf';
            insert sig1;
            
            Child_Signatures__c sig2 = new Child_Signatures__c();
            sig2.Offer_Template__c = offer.Id;
            sig2.Recipient_Email__c = 'signer2@example.com';
            sig2.Status__c = 'Pending';
            sig2.Fingerprint__c = null;
            sig2.Signature_URL__c = null;
            insert sig2;
            
            // =============================================
            // CREATE CLIENT (for potential use)
            // =============================================
              Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant2948';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s='8 Keewong Street';
            cli.Address__City__s = 'Crace';
            cli.Address__StateCode__s='ACT';
            cli.Address__PostalCode__s='2911';
            cli.Contact_Number__c='4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c='Jason';
            cli.Primay_Contact_Last_Name__c='Smith';
            cli.Relationship__c='Parent';
            cli.Email__c='manualtesting.4139559@hotmail.com';
            cli.Primary_Contact_Number__c='0433123123';
            insert cli;
            
        }
    }
    
    // =============================================
    // HELPER METHODS (QUERY ONLY)
    // =============================================
    static User getTestUser() {
        return [SELECT Id, Email, Full_Name__c, Organization_Name__c FROM User WHERE Email = 'testuser98765544@example.com' LIMIT 1];
    }
    
    static Organisation__c getTestOrg() {
        return [SELECT Id, Name, Address__c FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    
   static Offer_Template__c getTestOffer() {
    return [SELECT Id, Name, File_Name__c, All_Recipients__c, Current_Recipient__c, 
                   Current_Recipient_Status__c, Sender_Email__c,OfferTemplateDocumentType__c, 
                   CreatedById, CreatedDate, LastModifiedDate,Certificate_ID__c, 
                   CreatedBy.Name, CreatedBy.Full_Name__c, CreatedBy.Organization_Name__c
            FROM Offer_Template__c LIMIT 1];
}
    
    static List<Child_Signatures__c> getTestChildSigs() {
        return [SELECT Id, Name, Recipient_Email__c, Status__c, Fingerprint__c, 
                       Signature_URL__c, CreatedDate, LastModifiedDate
                FROM Child_Signatures__c 
                WHERE Offer_Template__c = :getTestOffer().Id
                ORDER BY CreatedDate ASC];
    }
    
    static OfferTemplateDocumentType__c getTestDocType() {
        return [SELECT Id, Document_Type_Name__c FROM OfferTemplateDocumentType__c LIMIT 1];
    }
    
    // =============================================
    // TEST 1: buildCertificateData - Happy Path (All Signed)
    // =============================================
    @isTest
    static void testBuildCertificateData_HappyPath() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        Offer_Template__c offer = getTestOffer();
        List<Child_Signatures__c> childSigs = getTestChildSigs();
        
        // Mark all as signed
        for (Child_Signatures__c sig : childSigs) {
            sig.Status__c = 'Pending';
        }
        update childSigs;
        
        Test.startTest();
        System.runAs(u) {
            CompletionCertificateService.CertificateData result = 
                CompletionCertificateService.buildCertificateData(
                    offer, childSigs, org, '', '', 3, 'Completed'
                );
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 2: buildCertificateData - Pending Status
    // =============================================
    @isTest
    static void testBuildCertificateData_PendingStatus() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        Offer_Template__c offer = getTestOffer();
        List<Child_Signatures__c> childSigs = getTestChildSigs();
        
        Test.startTest();
        System.runAs(u) {
            CompletionCertificateService.CertificateData result = 
                CompletionCertificateService.buildCertificateData(
                    offer, childSigs, org, '', '', 2, 'In Progress'
                );
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 3: buildCertificateData - Current Signer Mock
    // =============================================
    @isTest
    static void testBuildCertificateData_CurrentSigner() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        Offer_Template__c offer = getTestOffer();
        List<Child_Signatures__c> childSigs = getTestChildSigs();
        
        Test.startTest();
        System.runAs(u) {
            // Pass current signer email to mock
            CompletionCertificateService.CertificateData result = 
                CompletionCertificateService.buildCertificateData(
                    offer, childSigs, org, 'signer2@example.com', '{"sessionGuid":"mock-123"}', 2, 'In Progress'
                );
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 4: buildCertificateData - Certificate ID Generation
    // =============================================
    @isTest
    static void testBuildCertificateData_CertIdGeneration() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        Offer_Template__c offer = getTestOffer();
        List<Child_Signatures__c> childSigs = getTestChildSigs();
        
        // Clear Certificate_ID__c to force generation
        offer.Certificate_ID__c = null;
        update offer;
        
        Test.startTest();
        System.runAs(u) {
            CompletionCertificateService.CertificateData result = 
                CompletionCertificateService.buildCertificateData(
                    offer, childSigs, org, '', '', 3, 'Completed'
                );
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 5: buildCertificateData - Null Offer Template
    // =============================================
    @isTest
    static void testBuildCertificateData_NullOffer() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        List<Child_Signatures__c> childSigs = getTestChildSigs();
        
        Test.startTest();
        System.runAs(u) {
            try {
                CompletionCertificateService.buildCertificateData(
                    null, childSigs, org, '', '', 1, 'Pending'
                );
            } catch (IllegalArgumentException e) {
                System.debug('Expected error: ' + e.getMessage());
            }
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 6: buildCertificateData - Empty Recipients
    // =============================================
    @isTest
    static void testBuildCertificateData_EmptyRecipients() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        Offer_Template__c offer = getTestOffer();
        
        // Clear recipients
        offer.All_Recipients__c = '';
        update offer;
        
        List<Child_Signatures__c> childSigs = getTestChildSigs();
        
        Test.startTest();
        System.runAs(u) {
            CompletionCertificateService.CertificateData result = 
                CompletionCertificateService.buildCertificateData(
                    offer, childSigs, org, '', '', 1, 'Pending'
                );
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 7: parseFingerprint
    // =============================================
    @isTest
    static void testParseFingerprint() {
        Test.startTest();
        
        // Valid JSON
        CompletionCertificateService.FingerprintInfo info1 = 
            CompletionCertificateService.parseFingerprint('{"sessionGuid":"abc","timestamp":"123","ipAddress":"192.168.1.1","userAgent":"Chrome","platform":"Windows"}');
        
        // Null
        CompletionCertificateService.FingerprintInfo info2 = 
            CompletionCertificateService.parseFingerprint(null);
        
        // Empty string
        CompletionCertificateService.FingerprintInfo info3 = 
            CompletionCertificateService.parseFingerprint('');
        
        // Invalid JSON
        CompletionCertificateService.FingerprintInfo info4 = 
            CompletionCertificateService.parseFingerprint('invalid-json');
        
        Test.stopTest();
    }
    
    // =============================================
    // TEST 8: formatDateTimeWithOffset
    // =============================================
    @isTest
    static void testFormatDateTimeWithOffset() {
        Test.startTest();
        
        // Valid Datetime
        String result1 = CompletionCertificateService.formatDateTimeWithOffset(Datetime.now());
        
        // Null
        String result2 = CompletionCertificateService.formatDateTimeWithOffset(null);
        
        Test.stopTest();
    }
    
    // =============================================
    // TEST 9: getDeviceBrowser
    // =============================================
    @isTest
    static void testGetDeviceBrowser() {
        Test.startTest();
        
        // Windows + Chrome
        String result1 = CompletionCertificateService.getDeviceBrowser('Windows', 'Mozilla/5.0 Chrome/91.0');
        
        // Mac + Safari
        String result2 = CompletionCertificateService.getDeviceBrowser(null, 'Macintosh Safari/14.0');
        
        // iOS
        String result3 = CompletionCertificateService.getDeviceBrowser(null, 'iPhone Safari/14.0');
        
        // Android
        String result4 = CompletionCertificateService.getDeviceBrowser(null, 'Android Chrome/91.0');
        
        // Unknown
        String result5 = CompletionCertificateService.getDeviceBrowser(null, null);
        
        Test.stopTest();
    }
    
    // =============================================
    // TEST 10: generateGUID
    // =============================================
    @isTest
    static void testGenerateGUID() {
        Test.startTest();
        String guid = CompletionCertificateService.generateGUID();
        Test.stopTest();
    }
    
    // =============================================
    // TEST 11: generateShortId
    // =============================================
    @isTest
    static void testGenerateShortId() {
        Test.startTest();
        String shortId = CompletionCertificateService.generateShortId();
        Test.stopTest();
    }
    
    // =============================================
    // TEST 12: persistCertificateId (Future Method)
    // =============================================
    @isTest
    static void testPersistCertificateId() {
        User u = getTestUser();
        Offer_Template__c offer = getTestOffer();
        
        Test.startTest();
        System.runAs(u) {
            CompletionCertificateService.persistCertificateId(offer.Id, 'TESTCERT123');
        }
        Test.stopTest();
    }
}