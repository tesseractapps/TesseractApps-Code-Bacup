@isTest
public class InvoiceHandlerTest {   
    static testMethod void invoiceTest() {
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4212253@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne42253', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4212253@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.Email_Keywords__c = 'testonefacility@gmail.com';
            fac.ABN__c ='1234567881';
            fac.Phone__c = '6726372123';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4212253@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Type__c= 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            insert staff; 
            
            Invoice_Parent__c invoice = new Invoice_Parent__c();
            invoice.Organization__c=org.Id;
            invoice.Tax_Invoice__c='inovice';
            invoice.Date_Issued__c=System.today();
            invoice.Start_Date__c = date.newInstance(2025, 02, 12);
            invoice.End_Date__c = date.newInstance(2025, 02, 16);
            invoice.Staff__c = staff.Id;
            invoice.Include_GST__c = 'No';
            insert invoice;  
            
            RFQ__c rfq = new RFQ__c();
            rfq.Organization__c=org.Id;
            rfq.Date_Issued__c=System.today();
            rfq.Include_GST__c = 'No';
            rfq.Email_Sent__c=false;
            insert rfq;  
        }
        
        // User userData =[select id,name from user where id=:userinfo.getUserId()];  
        
        User u2= [SELECT Id from User where email='manualtesting.4212253@hotmail.com' LIMIT 1];
        System.runAs(u2){
            test.startTest();
            
            
            
            Organisation__c orgs = [SELECT ID,Name from Organisation__c LIMIT 1];
            string OrgId=orgs.id;
            String orgName = orgs.Name;
            Staff__c stafs = [Select Id,Email_Address__c from Staff__c WHERE Email_Address__c ='manualtesting.4212253@hotmail.com' LIMIT 1];        
            String staffId = stafs.Id;
            //String emailKey = stafs.Email_Address__c;
            Facility__c fac = [SELECT Id,Email_Keywords__c,Key_Words__c FROM Facility__c];
            String facEMail = fac.Email_Keywords__c;
            InvoiceHandler.organizationDetails();
            
            String dateIssued = '2024-02-16';
            String dueDate = '2024-02-16';
            string startDate = '2024-02-12';
            string endDate = '2024-02-18';
            String taxInvoice ='invoice';
            string includeGst = 'No';
            String listOfsearchStringSecond='[{"description": "description" ,"rate":"40","quantity":"10","unitPrice":"10"}]';
            InvoiceHandler.insertInvoice(listOfsearchStringSecond,orgs.Id,dateIssued,taxInvoice,includeGst,startDate,endDate,staffId,'Ace Info',dueDate,'Issued','Praveen','Inv-300');
            Invoice_Parent__c invParent = [SELECT Id from Invoice_Parent__c LIMIT 1];
            String invParentId = invParent.Id;
            InvoiceHandler.listofInvoices(invParentId);
            InvoiceHandler.listofInvoicesParent(startDate,endDate,staffId);
            
            String base64 ='"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="';
            // InvoiceHandler.saveFile(base64Data, OrgId);
            InvoiceHandler.sendEmail(base64, 'testonefacility@gmail.com', orgName, 'fileName');
            InvoiceHandler.getInvoiceParentHistory(invParentId);
            InvoiceHandler.getSearchKeys();
            InvoiceHandler.updateInvoice(invParentId, 'Received', 'Email');
            InvoiceHandler.updateInvoice(invParentId, 'Issued', 'Status');
            InvoiceHandler.updateInvoice(invParentId, 'Received', 'Status');
            InvoiceHandler.saveSearchKey('manualtesting.41251@hotmail.com');
            //InvoiceHandler.saveSearchKey('testonefacility@gmail.com');
            //
            RFQ__c rfqParent = [SELECT Id from RFQ__c LIMIT 1];
            String rfqParentId = rfqParent.Id;
            RFQHandler.insertRFQ(listOfsearchStringSecond, OrgId, dateIssued, includeGst, 'test', dueDate, 'fileref', 'rfqName', 'Draft');
            RFQHandler.getAllRFQData(dateIssued, dateIssued, orgId);
            RFQHandler.sendEmail(base64, 'testonefacility@gmail.com', orgName, 'fileName');
            RFQHandler.getRFQHistory(rfqParentId);
            test.stopTest();  
        }
    }
    
    
    @isTest
    static void testFormatDateDDMMYYYY() {
        // Test a regular date
        Date testDate = Date.newInstance(2024, 6, 5); // 5th June 2024
        String expectedOutput = '05/06/2024';
        String actualOutput = InvoiceHandler.formatDateDDMMYYYY(testDate);
        
        // Test double-digit day and month
        Date testDate2 = Date.newInstance(2024, 11, 15); // 15th November 2024
        String expectedOutput2 = '15/11/2024';
        String actualOutput2 = InvoiceHandler.formatDateDDMMYYYY(testDate2);
    }
    
    @isTest
    static void testGetAccountingInvoiceById() {
        
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4212253@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne42253', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4212253@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.Email_Keywords__c = 'testonefacility@gmail.com';
            fac.ABN__c ='1234567881';
            fac.Phone__c = '6726372123';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4212253@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Type__c= 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            insert staff; 
            
            // Create related Company
            Company__c company = new Company__c(
                Company_Name__c = 'Test Company',
                ABN__c = '123456789',
                //Address__c = '123 Test St',
                Phone_Number__c = '1234567890'
            );
            insert company;
            
            // Create related Participant
            Contact participant = new Contact(
                FirstName = 'John',
                LastName = 'Doe'
            );
            insert participant;
            
            // Create Staff User
            User staffUser= [SELECT Id from User where email='manualtesting.4212253@hotmail.com' LIMIT 1];
            
            // Create the Invoice
            Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
                //Name = 'INV-001',
                Company__c = company.Id,
                Status__c = 'Draft',
                GST__c = 10,
                Total_Amount__c = 110,
                Sub_Total__c = 100,
                //Participant__c = participant.Id,
                Invoice_Date__c = Date.today(),
                Start_Date__c = Date.today().addDays(-7),
                End_Date__c = Date.today(),
                Issued_Date__c = Date.today(),
                staff__c = staff.Id
            );
            insert invoice;
            Entity_Profile__c customerProfile = new Entity_Profile__c(
                First_Name__c = 'John',
                Last_Name__c = 'Smith',
                Card_Type__c = 'Customer',
                Company__c = company.Id
            );
            Entity_Profile__c supplierProfile = new Entity_Profile__c(
                First_Name__c = 'John',
                Last_Name__c = 'Smith',
                Card_Type__c = 'Supplier',
                Company__c = company.Id
            );
            insert new List<Entity_Profile__c>{ customerProfile, supplierProfile };
                
                // Create related Journal Entry
                Accounting_Journal_Entry__c updatedExpense = new Accounting_Journal_Entry__c(
                    Company__c = company.Id,
                    Accounting_Invoices_Expenses__c = invoice.Id,
                    Description__c = 'Updated Expense',
                    Invoice_Date__c = Date.today(),
                    Entry_Type__c = 'Purchases',
                    Tax_Inclusive__c = true,
                    Post_Date__c = Date.today(),
                    Total_Amount__c = 1000,
                    Tax__c = 100,
                    Tax_Amount__c = 100,
                    Amount__c = 900
                    
                );
            insert updatedExpense;
            Test.setMock(HttpCalloutMock.class, new InvoiceCalloutMock());
            // Call method
            Test.startTest();
            List<Accounting_Invoices_Expenses__c> result = InvoiceHandler.getAccountingInvoiceById(invoice.Id);
            InvoiceHandler.sendEmailforInvoice(updatedExpense.Id,'client@example.com','cc@example.com','https://example.com/test.pdf',Date.today().addDays(-10),Date.today());
            List<Accounting_Invoices_Expenses__c> getAccountingInvoiceInEdit = InvoiceHandler.getAccountingInvoiceInEdit(invoice.Id);
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetAccountingInvoiceByIdWithNullId() {
        
        // Call with null
        Test.startTest();
        List<Accounting_Invoices_Expenses__c> result = InvoiceHandler.getAccountingInvoiceById(null);
        Test.stopTest();
    }
    
    @isTest
    static void testGetAccountingInvoiceById1() {
        
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4212253@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne42253', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4212253@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.Email_Keywords__c = 'testonefacility@gmail.com';
            fac.ABN__c ='1234567881';
            fac.Phone__c = '6726372123';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4212253@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Type__c= 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            insert staff; 
            
            // Create related Company
            Company__c company = new Company__c(
                Company_Name__c = 'Test Company',
                ABN__c = '123456789',
                //Address__c = '123 Test St',
                Phone_Number__c = '1234567890'
            );
            insert company;
            
            // Create related Participant
            Contact participant = new Contact(
                FirstName = 'John',
                LastName = 'Doe'
            );
            insert participant;
            
            // Create Staff User
            User staffUser= [SELECT Id from User where email='manualtesting.4212253@hotmail.com' LIMIT 1];
            
            // Create the Invoice
            Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
                //Name = 'INV-001',
                Company__c = company.Id,
                Status__c = 'Draft',
                GST__c = 10,
                Total_Amount__c = 110,
                Sub_Total__c = 100,
                //Participant__c = participant.Id,
                Invoice_Date__c = Date.today(),
                Start_Date__c = Date.today().addDays(-7),
                End_Date__c = Date.today(),
                Issued_Date__c = Date.today(),
                Due_Date__c = Date.today(),
                staff__c = staff.Id
            );
            insert invoice;
            Entity_Profile__c customerProfile = new Entity_Profile__c(
                First_Name__c = 'John',
                Last_Name__c = 'Smith',
                Card_Type__c = 'Customer',
                Company__c = company.Id
            );
            Entity_Profile__c supplierProfile = new Entity_Profile__c(
                First_Name__c = 'John',
                Last_Name__c = 'Smith',
                Card_Type__c = 'Supplier',
                Company__c = company.Id
            );
            insert new List<Entity_Profile__c>{ customerProfile, supplierProfile };
                
                // Create related Journal Entry
                Accounting_Journal_Entry__c updatedExpense = new Accounting_Journal_Entry__c(
                    Company__c = company.Id,
                    Description__c = 'Updated Expense',
                    Invoice_Date__c = Date.today(),
                    Entry_Type__c = 'Purchases',
                    Tax_Inclusive__c = true,
                    Post_Date__c = Date.today(),
                    Total_Amount__c = 1000,
                    Tax__c = 100,
                    Tax_Amount__c = 100,
                    Amount__c = 900,
                    Accounting_Invoices_Expenses__c = invoice.Id,
                    Entity_Profile__c =customerProfile.Id
                    
                );
            insert updatedExpense;
            Test.setMock(HttpCalloutMock.class, new InvoiceCalloutMock());
            // Call method
            Test.startTest();
            List<Accounting_Invoices_Expenses__c> result = InvoiceHandler.getAccountingInvoiceById(invoice.Id);
            InvoiceHandler.sendEmailforInvoiceforSales(
                invoice.Id,
                'client@example.com',
                'cc@example.com',
                'https://example.com',
                Date.today()
            );
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetAccountingInvoiceById2() {
        
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4212253@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne42253', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4212253@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.Email_Keywords__c = 'testonefacility@gmail.com';
            fac.ABN__c ='1234567881';
            fac.Phone__c = '6726372123';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4212253@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Type__c= 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            insert staff; 
            
            // Create related Company
            Company__c company = new Company__c(
                Company_Name__c = 'Test Company',
                ABN__c = '123456789',
                //Address__c = '123 Test St',
                Phone_Number__c = '1234567890'
            );
            insert company;
            
            // Create related Participant
            Contact participant = new Contact(
                FirstName = 'John',
                LastName = 'Doe'
            );
            insert participant;
            
            // Create Staff User
            User staffUser= [SELECT Id from User where email='manualtesting.4212253@hotmail.com' LIMIT 1];
            
            // Create the Invoice
            Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
                //Name = 'INV-001',
                Company__c = company.Id,
                Status__c = 'Draft',
                GST__c = 10,
                Total_Amount__c = 110,
                Sub_Total__c = 100,
                //Participant__c = participant.Id,
                Invoice_Date__c = Date.today(),
                Start_Date__c = Date.today().addDays(-7),
                End_Date__c = Date.today(),
                Issued_Date__c = Date.today(),
                staff__c = staff.Id,
                Amazon_URL__c = 'https://example.com/fake.pdf',
                Due_Date__c = Date.today()
            );
            insert invoice;
            Entity_Profile__c customerProfile = new Entity_Profile__c(
                First_Name__c = 'John',
                Last_Name__c = 'Smith',
                Card_Type__c = 'Customer',
                Company__c = company.Id
            );
            Entity_Profile__c supplierProfile = new Entity_Profile__c(
                First_Name__c = 'John',
                Last_Name__c = 'Smith',
                Card_Type__c = 'Supplier',
                Company__c = company.Id
            );
            insert new List<Entity_Profile__c>{ customerProfile, supplierProfile };
                
                // Create related Journal Entry
                Accounting_Journal_Entry__c updatedExpense = new Accounting_Journal_Entry__c(
                    Company__c = company.Id,
                    Description__c = 'Updated Expense',
                    Invoice_Date__c = Date.today(),
                    Entry_Type__c = 'Sales',
                    Tax_Inclusive__c = true,
                    Post_Date__c = Date.today(),
                    Total_Amount__c = 1000,
                    Tax__c = 100,
                    Tax_Amount__c = 100,
                    Amount__c = 900,
                    Accounting_Invoices_Expenses__c = invoice.Id,
                    Entity_Profile__c =customerProfile.Id
                );
            insert updatedExpense;
            Test.setMock(HttpCalloutMock.class, new InvoiceCalloutMock());
            // Call method
            Test.startTest();
            List<Accounting_Invoices_Expenses__c> result = InvoiceHandler.getAccountingInvoiceById(invoice.Id);
            InvoiceHandler.sendEmailforInvoiceforPurchases(
                invoice.Id,
                'client@example.com',
                'cc@example.com');
            Test.stopTest();
        }
    }
    
    
}