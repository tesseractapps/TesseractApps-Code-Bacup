@isTest
public class TesseractInvoiceHandlerTest {
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
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.41269@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne41269', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.41269@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.41269@hotmail.com';
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
            
            Tesseract_Invoice__c invoice = new Tesseract_Invoice__c();
            invoice.Organisation_Name__c='Ace Info Systems Pty Ltd';
            //invoice.Tax_Invoice__c='inovice';
            invoice.Date_Issued__c=System.today();
            invoice.Start_Date__c = date.newInstance(2025, 02, 12);
            invoice.End_Date__c = date.newInstance(2025, 02, 16);
            invoice.Staff__c = staff.Id;
            invoice.Include_GST__c = 'No';
            invoice.Status__c = 'Issued';
            invoice.File_Reference__c = 'Test Maheswari';
            insert invoice;            
        }
        
        User u2= [SELECT Id from User where email='manualtesting.41269@hotmail.com' LIMIT 1];
        System.runAs(u2){
            test.startTest();        
            Organisation__c orgs = [SELECT ID,Name from Organisation__c LIMIT 1];
            string OrgId=orgs.id;
            String orgName = orgs.Name;
            Staff__c stafs = [Select Id,Email_Address__c from Staff__c WHERE Email_Address__c ='manualtesting.41269@hotmail.com' LIMIT 1];        
            String staffId = stafs.Id;
            //String emailKey = stafs.Email_Address__c;
            Facility__c fac = [SELECT Id,Email_Keywords__c,Key_Words__c FROM Facility__c];
            String facEMail = fac.Email_Keywords__c;
            Tesseract_Invoice__c inv1 = [SELECT Id, Organisation_Name__c,Status__c,File_Reference__c From Tesseract_Invoice__c LIMIT 1];
            String invoiceTo = inv1.Organisation_Name__c;
            String invoiceStatus = inv1.Status__c;
           // String fileref = inv1.File_Reference__c;
        
            String dateIssued = '2024-02-16';
            String dueDate = '2024-02-16';
            string startDate = '2024-02-12';
            string endDate = '2024-02-18';
            String taxInvoice ='invoice';
            string includeGst = 'No';
            String listOfsearchStringSecond='[{"description": "description" ,"rate":"40","quantity":"10","unitPrice":"10"}]';
            TesseractInvoiceHandler.insertInvoice(listOfsearchStringSecond, dateIssued, includeGst, invoiceTo, dueDate, invoiceStatus, 'Mahi', 'Inv-002');
            
            Tesseract_Invoice__c invParent = [SELECT Id from Tesseract_Invoice__c LIMIT 1];
            String invParentId = invParent.Id;
            TesseractInvoiceHandler.listofInvoices(invParentId);
            TesseractInvoiceHandler.listofInvoicesParent(startDate,endDate);
        
            String base64 ='"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="';
            TesseractInvoiceHandler.sendEmail(base64, 'testonefacility@gmail.com', orgName, 'fileName');
            TesseractInvoiceHandler.getInvoiceParentHistory(invParentId);
            TesseractInvoiceHandler.getSearchKeys();
            TesseractInvoiceHandler.updateInvoice(invParentId, 'Received', 'Email');
            TesseractInvoiceHandler.updateInvoice(invParentId, 'Issued', 'Status');
            TesseractInvoiceHandler.updateInvoice(invParentId, 'Received', 'Status');
            TesseractInvoiceHandler.saveSearchKey('manualtesting.41251@hotmail.com');
         	test.stopTest();  
        }
    }

}