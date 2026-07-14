@isTest
public class BillingAgreementControllerTest {

    @testSetup
    static void setupData() {

        // 🔹 Create Organisation
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
        // 🔹 Create Company
        Company__c comp = new Company__c(
            Organization__c = org.Id
        );
        insert comp;

        // 🔹 Create User (important for getAllInvoices)
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1];

        User u = new User(
            Alias = 'testusr',
            Email = 'testuser@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Test',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'Asia/Kolkata',
            Username = 'testuser' + DateTime.now().getTime() + '@test.com',
            Organization_Name__c = 'Test Org'
        );
        insert u;

        System.runAs(u) {

            // 🔹 Create Invoice
            Accounting_Invoices_Expenses__c inv = new Accounting_Invoices_Expenses__c(
            
                Company__c = comp.Id,
                Total_Amount__c = 100,
                Status__c = 'Paid',
                Invoice_Date__c = Date.today(),
                Is_Payroll_Sales__c = true
            );
            insert inv;

            // 🔹 Create Journal Entry
            Accounting_Journal_Entry__c journal = new Accounting_Journal_Entry__c(
                Accounting_Invoices_Expenses__c = inv.Id,
                Description__c = 'Test Desc'
            );
            insert journal;
        }
    }

    // ============================
    // ✅ upsertAgreement - CREATE
    // ============================
    @isTest
    static void testUpsertAgreementCreate() {

        Test.startTest();
        Id agreementId = BillingAgreementController.upsertAgreement(null, 'Test Agreement', 'Desc');
        Test.stopTest();

   
    }

    // ============================
    // ✅ upsertAgreement - UPDATE
    // ============================
    @isTest
    static void testUpsertAgreementUpdate() {

        Billing_Agreement__c ag = new Billing_Agreement__c(Name = 'Old');
        insert ag;

        Test.startTest();
        Id updatedId = BillingAgreementController.upsertAgreement(ag.Id, 'Updated Name', 'Desc');
        Test.stopTest();

        Billing_Agreement__c updated = [SELECT Name FROM Billing_Agreement__c WHERE Id = :updatedId];
       
    }

    // ============================
    // ❌ upsertAgreement - ERROR
    // ============================
    @isTest
    static void testUpsertAgreementError() {

        try {
            BillingAgreementController.upsertAgreement(null, '', '');
          
        } catch (AuraHandledException e) {
          
        }
    }

    // ============================
    // ✅ getAgreements
    // ============================
    @isTest
    static void testGetAgreements() {

        Billing_Agreement__c ag = new Billing_Agreement__c(Name = 'Agreement1');
        insert ag;

        Test.startTest();
        List<Billing_Agreement__c> listAg = BillingAgreementController.getAgreements();
        Test.stopTest();

      
    }

    // ============================
    // ✅ deleteAgreement
    // ============================
    @isTest
    static void testDeleteAgreement() {

        Billing_Agreement__c ag = new Billing_Agreement__c(Name = 'ToDelete');
        insert ag;

        Test.startTest();
        BillingAgreementController.deleteAgreement(ag.Id);
        Test.stopTest();

        List<Billing_Agreement__c> check = [SELECT Id FROM Billing_Agreement__c WHERE Id = :ag.Id];
       
    }

    // ============================
    // ❌ deleteAgreement - ERROR
    // ============================
    @isTest
    static void testDeleteAgreementError() {

        try {
            BillingAgreementController.deleteAgreement(null);
        
        } catch (AuraHandledException e) {
            
        }
    }

    // ============================
    // ✅ attachAgreementFiles
    // ============================
    @isTest
    static void testAttachAgreementFiles() {

        Billing_Agreement__c ag = new Billing_Agreement__c(Name = 'Attach Test');
        insert ag;

        String jsonData = '[{"url":"https://test.com/file","originalName":"file1","size":"123","key":"abc"}]';

        Test.startTest();
        BillingAgreementController.attachAgreementFiles(ag.Id, jsonData, null);
        Test.stopTest();

        List<Billing_Agreement_Attachment__c> attachments =
            [SELECT Id FROM Billing_Agreement_Attachment__c WHERE Billing_Agreement_c__c = :ag.Id];

    }

    // ============================
    // ❌ attachAgreementFiles - ERROR
    // ============================
    @isTest
    static void testAttachAgreementFilesError() {

        try {
            BillingAgreementController.attachAgreementFiles(null, '', null);
           
        } catch (AuraHandledException e) {
          
        }
    }

    // ============================
    // ✅ getAllInvoicesForOrganisation
    // ============================
    @isTest
    static void testGetAllInvoicesForOrganisation() {

        User u = [SELECT Id FROM User WHERE Alias = 'testusr' LIMIT 1];

        System.runAs(u) {

            Test.startTest();
            List<Accounting_Invoices_Expenses__c> invoices =
                BillingAgreementController.getAllInvoicesForOrganisation();
            Test.stopTest();

           
        }
    }
}