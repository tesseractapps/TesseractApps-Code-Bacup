@isTest
private class InvoiceServiceDateUpdateBatchTest {

    // ---------- Accounting (Tesseract System) ----------
    @isTest
    static void testAccountingInvoices() {

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
        org.Accounting_Services__c = 'Tesseract System'; 
        insert org;

        Company__c company = new Company__c(Organization__c = org.Id);
        insert company;

        Accounting_Invoices_Expenses__c inv = new Accounting_Invoices_Expenses__c(
            Company__c = company.Id,
            Invoice_Date__c = Date.today(),
            Status__c = 'Draft',
            Is_Service_Invoice__c = true
        );
        insert inv;

        List<Accounting_Journal_Entry__c> lines = new List<Accounting_Journal_Entry__c>{
            new Accounting_Journal_Entry__c(
                Accounting_Invoices_Expenses__c = inv.Id,
                Company__c = company.Id,
                Sl_no__c = 1,
                Unit_Price__c = 100,
                Quantity__c = 1,
                Tax__c = 0,
                Description__c = 'Assistance Animals for Test D on 29/1/2027 from 9:00 AM to 5:00 PM'
            ),
            new Accounting_Journal_Entry__c(
                Accounting_Invoices_Expenses__c = inv.Id,
                Company__c = company.Id,
                Sl_no__c = 2,
                Unit_Price__c = 100,
                Quantity__c = 1,
                Tax__c = 0,
                Description__c = 'Cancelled Shift – 3/2/2027 (9:00 AM – 5:00 PM)'
            ),
            // no date in description → skipped
            new Accounting_Journal_Entry__c(
                Accounting_Invoices_Expenses__c = inv.Id,
                Company__c = company.Id,
                Sl_no__c = 3,
                Unit_Price__c = 10,
                Quantity__c = 1,
                Tax__c = 0,
                Description__c = 'Reimbursement - Other Expense'
            ),
            // invalid date (31 Feb) → skipped
            new Accounting_Journal_Entry__c(
                Accounting_Invoices_Expenses__c = inv.Id,
                Company__c = company.Id,
                Sl_no__c = 4,
                Unit_Price__c = 10,
                Quantity__c = 1,
                Tax__c = 0,
                Description__c = 'Bad date on 31/2/2027 from 9:00 AM'
            )
        };
        insert lines;

        Test.startTest();
        Database.executeBatch(new InvoiceServiceDateUpdateBatch(), 200);   // one chunk in tests
        Test.stopTest();

        Map<Decimal, Accounting_Journal_Entry__c> bySlNo = new Map<Decimal, Accounting_Journal_Entry__c>();
        for (Accounting_Journal_Entry__c je : [
            SELECT Sl_no__c, Service_Date__c FROM Accounting_Journal_Entry__c WHERE Id IN :lines
        ]) {
            bySlNo.put(je.Sl_no__c, je);
        }
        

        Accounting_Invoices_Expenses__c savedInv = [
            SELECT Service_Start_Date__c, Service_End_Date__c
            FROM Accounting_Invoices_Expenses__c WHERE Id = :inv.Id
        ];
        
    }

    // ---------- Xero / MYOB ----------
    @isTest
    static void testXeroInvoices() {

        Organisation__c org = new Organisation__c();
        org.Name='Xero Org';
        org.ABN__c='11234567892';
        org.ACN__c='878787879';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd1@gmail.com';
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
        org.Accounting_Services__c = 'Xero'; 
        insert org;

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
            fac.Email_Keywords__c = 'testonefacility@gmail.com';
            fac.ABN__c ='12345678811';
            fac.Phone__c = '6726372123';
            insert fac;

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
            cli.Facility__c=fac.id;
            insert cli;

        Xero_or_Myob_Invoice__c inv = new Xero_or_Myob_Invoice__c(
            Invoice_Date__c = Date.today(),
            Status__c = 'Draft',
            Is_Service_Invoice__c = true,
            Participant__c = cli.Id
        );
        insert inv;

        List<Xero_Invoice_Entries__c> lines = new List<Xero_Invoice_Entries__c>{
            new Xero_Invoice_Entries__c(
                Xero_or_Myob_Invoice__c = inv.Id,
                Sl_no__c = 1,
                Unit_Price__c = 50,
                Quantity__c = 1,
                Description__c = 'Others for Deva care on 5/10/2026 from 9:00 AM to 6:00 PM'
            ),
            new Xero_Invoice_Entries__c(
                Xero_or_Myob_Invoice__c = inv.Id,
                Sl_no__c = 2,
                Unit_Price__c = 50,
                Quantity__c = 1,
                Description__c = 'Others for Deva care on 17/10/2026 from 9:00 AM to 6:00 PM'
            )
        };
        insert lines;

        Test.startTest();
        Database.executeBatch(new InvoiceServiceDateUpdateBatch(), 200);
        Test.stopTest();

        Xero_or_Myob_Invoice__c savedInv = [
            SELECT Service_Start_Date__c, Service_End_Date__c
            FROM Xero_or_Myob_Invoice__c WHERE Id = :inv.Id
        ];
        
    }

    // ---------- Organisation with no service invoices ----------
    @isTest
    static void testOrgWithoutInvoices() {
        //insert new Organisation__c(Name = 'Empty Org', Accounting_Services__c = 'Tesseract System');
        Organisation__c org = new Organisation__c();
        org.Name='Empty Org';
        org.ABN__c='11234567893';
        org.ACN__c='878787871';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd2@gmail.com';
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
        org.Accounting_Services__c = 'Tesseract System'; 
        insert org;

        Test.startTest();
        Database.executeBatch(new InvoiceServiceDateUpdateBatch(), 200);
        Test.stopTest();

        
    }
}