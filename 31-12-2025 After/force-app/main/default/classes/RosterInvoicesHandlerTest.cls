@isTest
private class RosterInvoicesHandlerTest {
    @testsetup 
    Static void testData(){
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
        org.Bank__c = '123456789';
        org.Accounting_Services__c = 'Tesseract System';
        insert org;
        
        Organisation__c orgXero = new Organisation__c();
        orgXero.Name = 'Xero Org';
        orgXero.ABN__c='11234567111';
        orgXero.ACN__c='878787222';
        orgXero.Contact_No__c='61328997222';
        orgXero.RCTI__c='RCTI2';
        orgXero.Email__c='xero@test.com';
        orgXero.Bank__c='Xero Bank';
        orgXero.BSB__c='BSB Test23';
        orgXero.Account_Name__c='Test  Xero Account1';
        orgXero.Account_Number__c='11111111122';
        orgXero.Description__c='test Desc';
        orgXero.Address_Latest__Street__s='101';
        orgXero.Address_Latest__City__s='Himas Waterhen';
        orgXero.Address_Latest__PostalCode__s='2060';
        orgXero.Address_Latest__CountryCode__s='AU';
        orgXero.Address_Latest__StateCode__s='NSW';
        orgXero.NDIS_Provider__c='12341234555';
        orgXero.BMSI_Identifier__c ='TEST BMSI1';
        orgXero.SoftwareId__c = 'jhdfn183281';
        orgXero.Branch_code__c = 'BS12311';
        orgXero.Contact_Name__c = 'Test Contact1';
        orgXero.User_Type__c = 'NDIS Org Admin';
        orgXero.Bank__c = '123456722';
        orgXero.Accounting_Services__c = 'Xero';
        
        insert orgXero;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        User xeroUser = new User(Alias = 'praveen1', Email= 'manualtesting.202946371@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne2094631', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.202946371@hotmail.com',Organization_Name__c ='Xero Org');
        insert xeroUser;
        
        System.runAs(user){   
            // Create Company
            Company__c comp = new Company__c(
                Company_Name__c = 'Test Facility',
                ABN__c = '123456789',
                Email__c = 'testfacility@example.com'
            );
            insert comp;
            
            // Create Account List
            Account_List__c acctList = new Account_List__c(Company__c = comp.Id);
            insert acctList;
    
            // Create Ledger Category
            Accounting_Category__c cat = new Accounting_Category__c(Name = 'Income', Account_List__c = acctList.Id);
            insert cat;
    
            // Create Ledger Item
            Accounting_Ledger_Items__c ledger = new Accounting_Ledger_Items__c(
                Name = 'Test Ledger',
                Account_Number__c = '4-1110',
                Category__c = cat.Id
            );
            insert ledger;           
            
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
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
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
            
             // Create Invoice
            Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(
                Is_Service_Invoice__c = true,
                Participant__c = cli.Id,
                Invoice_Date__c = Date.today(),
                Company__c = comp.Id,
                Status__c = 'Draft'
            );
            insert invoice;
            
            Xero_or_Myob_Invoice__c xeroInvoice = new Xero_or_Myob_Invoice__c(
               // Is_Service_Invoice__c = true,
                Participant__c = cli.Id,
                Invoice_Date__c = Date.today(),
               // Company__c = comp.Id,
                Status__c = 'Issued'
            );
            insert xeroInvoice;
            
            NDIS_Support_Catalogue__c NSC = new NDIS_Support_Catalogue__c();
            NSC.Name = 'Assistance Animals';
            NSC.ACT__c = 100;
            NSC.NSW__c =100;
            NSC.NT__c = 100;
            NSC.QLD__c = 100;
            NSC.SA__c = 100;
            NSC.TAS__c = 100;
            NSC.VIC__c = 100;
            NSC.WA__c = 100;
            insert NSC;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20294637@hotmail.com';
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
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            insert staff;
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift1.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 12, 16); 
            shift1.End_Date__c=Date.newInstance(2024, 10, 24);
           // shift1.Role__c='Admin';
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift1.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift1.Facility__c=fac.Id;
            shift1.Status__c='Draft';
            shift1.Start_time_picklist__c='6:30 pm';
            shift1.End_time_picklist__c='10:00 pm';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='Night';
            shift1.Start_Time_Text__c = '6:30 pm';
            shift1.End_Time_Text__c = '10:00 pm';
            insert shift1;
            
            Add_Shift_Checklist__c  asch1 = new Add_Shift_Checklist__c();
            asch1.Description__c=' teststs ';
            asch1.Mandatory__c = true;
            asch1.Add_Shift__c=shift1.Id;
            insert asch1;
            
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift1.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c=staff.Id;
            staffs1.Role__c='Admin';
            staffs1.Status__c='Accepted';
            insert staffs1;
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Service_Type__c = NSC.Id;
            services.Qty__c=5;
            services.GST__c='No';
        //    services.Date_of_Service__c = SYSTEM.TODAY();
           services.Date_of_Service__c =  Date.newInstance(2024, 10, 16);
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Status__c='Invoice Generated';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            insert services;
            
            Company__c testCompany = new Company__c();
            testCompany.Company_Name__c = 'Test Company';
            testCompany.Facility__c = fac.Id;
        	insert testCompany;
            
            Accounting_Invoices_Expenses__c inv = new Accounting_Invoices_Expenses__c(
                Company__c = testCompany.Id,
                Entity_Type__c = 'Invoice',
                Is_Payroll_Sales__c = true,
                Status__c = 'Approved'
            );
            insert inv;
            
            Entity_Profile__c entity = new Entity_Profile__c(
                Name = 'Test Entity',
                First_Name__c = 'John',
                Last_Name__c = 'Doe',
                Company__c = testCompany.Id,
                Card_Type__c = 'Customer'
                // Add required fields if Entity_Profile__c has them
            );
            insert entity;
            
             Xero_Entity__c xeroEntity = new Xero_Entity__c(
                //Name = 'Test Entity',
                First_Name__c = 'John',
                Last_Name__c = 'Doe',
               // Company__c = testCompany.Id,
                Card_Type__c = 'Customer'
                // Add required fields if Entity_Profile__c has them
            );
            insert xeroEntity;
            
            // Create Journal Entry
            Accounting_Journal_Entry__c je = new Accounting_Journal_Entry__c(
                Accounting_Invoices_Expenses__c = inv.Id,
                Entity_Profile__c = entity.Id
            );
            insert je;
                        
            test.StartTest();
            //AddShiftController.getFacilityAddress(fac.Id);
            //AddShiftController.getSetHours();
            RosterInvoicesHandler.updateQty(services.Id, 10);
            Boolean cancelInvoiceById = RosterInvoicesHandler.cancelInvoiceById(inv.Id);
            List<Funds_Tracker__c> fetchEntityfromFundtracker = RosterInvoicesHandler.fetchEntityfromFundtracker(funds.Id); 
             
            test.StopTest();            
        } 
       /* System.runAs(xeroUser){ 
            Accounting_Invoices_Expenses__c invoice = [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1];
            Boolean cancelInvoiceById1 = RosterInvoicesHandler.cancelInvoiceById(invoice.Id);
        }*/
    }

    @isTest
    static void testGetCompanyAndAccountData() {
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Facility__c fac = [SELECT ID FroM Facility__c LIMIT 1];
        Id facId = fac.Id;
        List<String> ids = new List<String>{client.Id};
        Test.startTest();
        Map<String, Object> result = RosterInvoicesHandler.getCompanyAndAccountData(ids);
        RosterInvoicesHandler.getShiftsTypeByFacility(facId);
        RosterInvoicesHandler.fetchEntity(facId);
        Test.stopTest();
        System.assertEquals(true, result.get('isSuccess'));
    }

    @isTest
    static void testGetBulkServicesHandler() {
        User u4= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
    
        System.runAs(u4) {
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
          Organisation__c orgs =[SELECT Id From Organisation__c LIMIT 1];
          List<Add_Shift__c> addList =[SELECT ID, Start_Date__c From Add_Shift__C limit 1];
            String orgId = orgs.Id;
        	String name='';
        Test.startTest();
        List<Accounting_Invoices_Expenses__c> res = RosterInvoicesHandler.getBulkServicesHandler(
            new List<String>{client.Id}, String.valueOf(Date.today().addDays(-5)), String.valueOf(Date.today()),orgId,name
        ); 
        RosterInvoicesHandler.getAddShiftData(addList[0].Id);
        Test.stopTest();
        }
       // System.assertNotEquals(null, res);
    }

    @isTest
    static void testServiceSupportList() {
        Client__c client = [SELECT Id, Facility__r.Organisation__c FROM Client__c LIMIT 1];
        String orgId = client.Facility__r.Organisation__c;
        Test.startTest(); 
        List<Services_and_Support_Plan__c> res = RosterInvoicesHandler.serviceSupportList(
            new List<String>{client.Id}, String.valueOf(Date.today().addDays(-10)), String.valueOf(Date.today()), orgId, 'John',new List<String>{'Not Yet Invoiced'},'Xero',344
        );
        Test.stopTest();
        System.assertNotEquals(null, res);
    }

   @isTest
    static void testUpdateChildServices() {
        Organisation__c orgs =[SELECT Id,Name From Organisation__c LIMIT 1];
        Services_and_Support_Plan__c service = [SELECT Id,Service_Users__c FROM Services_and_Support_Plan__c WHERE Service_Users__r.Organization_Full_Name__c=:orgs.Name LIMIT 1];
        Accounting_Invoices_Expenses__c invoice = [SELECT Id,Is_Service_Invoice__c,Services_Id_List__c FROM Accounting_Invoices_Expenses__c where Is_Service_Invoice__c = true LIMIT 1];

        invoice.Amazon_URL__c = 'https://example.com/file.pdf';
        update invoice;

        Map<Id, Accounting_Invoices_Expenses__c> oldMap = new Map<Id, Accounting_Invoices_Expenses__c>{
            invoice.Id => new Accounting_Invoices_Expenses__c(
                Id = invoice.Id,
                Amazon_URL__c = null,
                Is_Service_Invoice__c = true,
                Services_Id_List__c = service.Id
            )
        };

        RosterInvoicesHandler.updateChildServices(new List<Accounting_Invoices_Expenses__c>{invoice}, oldMap);
       // RosterInvoicesHandler.updateQty(service.Id,10);

        service = [SELECT Status__c, Accounting_Invoices_Expenses__c FROM Services_and_Support_Plan__c WHERE Id = :service.Id];       
    }
    
    @isTest
    static void testDeleteInvoiceDeletesChildEntries() {
        // Create a parent invoice record
        Accounting_Invoices_Expenses__c invoice = new Accounting_Invoices_Expenses__c(Invoice_No__c = '1234');
        insert invoice;

        // Create related child journal entry
        Accounting_Journal_Entry__c journalEntry = new Accounting_Journal_Entry__c(
            Amount__c = 12345,
            Total_Amount__c = 100,
            Accounting_Invoices_Expenses__c = invoice.Id
        );
        insert journalEntry;

        // Verify child entry exists
       // System.assertEquals(1, [SELECT COUNT() FROM Accounting_Journal_Entry__c WHERE Accounting_Invoices_Expenses__c = :invoice.Id]);

        // Delete the parent invoice (should trigger deletion of child)
        delete invoice;

        // Verify child entry is deleted
        List<Accounting_Journal_Entry__c> remainingEntries = [
            SELECT Id FROM Accounting_Journal_Entry__c 
            WHERE Accounting_Invoices_Expenses__c = :invoice.Id
        ];
    }
 	@isTest
    static void testGetReimbursementsByShiftStaffIds() {
        List<ShiftwithStaff__c> shiftStaffList = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];

        Test.startTest();
        List<Reimbursement__c> results = RosterInvoicesHandler.getReimbursementsByShiftStaffIds(
            new List<Id>{shiftStaffList[0].Id}
        );
        Test.stopTest();
    }    
    @isTest
    static void testFormatDateDDMMYYYY() {
        // Example input: 9th October 2025
        Date testDate = Date.newInstance(2025, 10, 9); 
        
        // Expected output: "09/10/2025"
        String expectedFormattedDate = '09/10/2025';
        
        // Call the method
        String actualFormattedDate = RosterInvoicesHandler.formatDateDDMMYYYY(testDate);
        Date anotherDate = Date.newInstance(2025, 12, 15);
        String anotherExpected = '15/12/2025';
        String anotherActual = RosterInvoicesHandler.formatDateDDMMYYYY(anotherDate);
    }
     public class MockHttpResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/pdf');
            res.setBodyAsBlob(Blob.valueOf('PDF content here'));  // dummy PDF content
            res.setStatusCode(200);
            return res;
        }
    }
    
   @isTest
    static void testGetEmailBodyServiceInvoice() {
         User u4= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
    
        System.runAs(u4) {
            Accounting_Invoices_Expenses__c inv = [SELECT Id FROM Accounting_Invoices_Expenses__c LIMIT 1];
            Accounting_Journal_Entry__c entry = [SELECT Id FROM Accounting_Journal_Entry__c LIMIT 1];
             Entity_Profile__c entrity = [SELECT Id FROM Entity_Profile__c LIMIT 1];
            
			Test.startTest();
            Map<String, String> result = RosterInvoicesHandler.getEmailBodyServiceInvoice(inv.Id);  
           String invoice= RosterInvoicesHandler.getentityEmailForXeroInvoices(inv.Id);
           List<Xero_or_Myob_Invoice__c> xero= RosterInvoicesHandler.getAccountingInvoiceByIdXero(inv.Id);
            Test.StopTest();
        }
    }

    @isTest
    static void testSendEmailforServiceInvoice() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];

        System.runAs(u) {
            Accounting_Invoices_Expenses__c inv = [SELECT Id, Email_Count__c FROM Accounting_Invoices_Expenses__c LIMIT 1];

           Map<String, String> bodyMap = RosterInvoicesHandler.getEmailBodyServiceInvoice(inv.Id);
            String subj = bodyMap.get('subject');
            String body = bodyMap.get('body 1234567890');

            String toAddr = 'to@example.com';
            String ccAddr = 'cc@example.com';
            String url = 'https://dummyurl.com';

            Test.startTest();
            Decimal count = RosterInvoicesHandler.sendEmailforServiceInvoice(inv.Id, toAddr, ccAddr, url, subj, body);
            Test.stopTest();

            inv = [SELECT Email_Count__c FROM Accounting_Invoices_Expenses__c WHERE Id = :inv.Id];
        }
    } 
   @isTest
    static void testCreateUpdateXeroInvoice() {
       // Company__c company = [SELECT Id FROM Company__c LIMIT 1];
        String salesEntryJson = JSON.serialize(new Map<String, Object>{
            'InvoiceDate' => String.valueOf(Date.today()),
                'InvoiceNo' => 'INV-999',
                'Status' => 'Draft',
                //'company' => company.Id, // ✅ Corrected
                //'PostDate' => String.valueOf(Date.today()),
                //'IncludeGST' => 'Yes',
                'participantID' => null,
                'ServicesList' => null,
                'taxInclusive' => true,
                'entityName' => 'Test Entity'
                //'comments' => 'Test comment'
                });
        
        String amountEntryJson = JSON.serialize(new Map<String, Object>{
            'subTotal' => 100,
                'taxAmount' => 10,
                'totalAmount' => 110
                });
        
        List<Map<String, Object>> items = new List<Map<String, Object>>{
            new Map<String, Object>{
                'tax' => '10%',
                    'Amount__c' => 100,
                    'Quantity__c' => 1,
                    'Description__c' => 'Test Item',
                    'sno' => 1
                   // 'accountItemId' => null
                    }
        };
            String salesEntryListJson = JSON.serialize(items);
        
        Test.startTest();
        RosterInvoicesHandler.createUpdateXeroInvoice(
            salesEntryJson, salesEntryListJson, amountEntryJson, true
        );
       // System.assertNotEquals(null, result);
        Test.stopTest();
    }
     @isTest
    static void testCancelInvoiceByIdForXero() {
       
        User u3 = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.202946371@hotmail.com' AND Organization_Name__c ='Xero Org' LIMIT 1];
        Organisation__c orgs =[SELECT Id,Accounting_Services__c,  Name From Organisation__c  WHERE Name = 'Xero Org' LIMIT 1];
        System.runAs(u3) {
            Xero_or_Myob_Invoice__c inv = [SELECT Id, Email_Count__c  FROM Xero_or_Myob_Invoice__c LIMIT 1];
            Xero_Entity__c entity = [SELECT Id FROM Xero_Entity__c LIMIT 1];

            Test.startTest();
            Boolean cancelInvoiceById1 = RosterInvoicesHandler.cancelInvoiceById(inv.Id);
           // Map<String, String> result1 = RosterInvoicesHandler.getEmailBodyServiceInvoice(inv.Id);
            Test.stopTest();

         
        }
    } 
    
}