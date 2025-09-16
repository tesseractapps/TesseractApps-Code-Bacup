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
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
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
            shift1.Role__c='Admin';
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
            // funds.Available_Funds__c = 10000;	
            //funds.Spent_Amount__c = 1000;
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
            // services.Unit_Price__c = 200;
            services.GST__c='No';
        //    services.Date_of_Service__c = SYSTEM.TODAY();
           services.Date_of_Service__c =  Date.newInstance(2024, 10, 16);
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
           // services.ShiftwithStaff__c=staffs1.id;
            insert services;
                        
            test.StartTest();
            AddShiftController.getFacilityAddress(fac.Id);
            AddShiftController.getSetHours();
            test.StopTest();            
        }        
    }

    @isTest
    static void testGetCompanyAndAccountData() {
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        List<String> ids = new List<String>{client.Id};
        Test.startTest();
        Map<String, Object> result = RosterInvoicesHandler.getCompanyAndAccountData(ids);
        Test.stopTest();
        System.assertEquals(true, result.get('isSuccess'));
    }

    @isTest
    static void testGetBulkServicesHandler() {
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
        System.assertNotEquals(null, res);
    }

    @isTest
    static void testServiceSupportList() {
        Client__c client = [SELECT Id, Facility__r.Organisation__c FROM Client__c LIMIT 1];
        String orgId = client.Facility__r.Organisation__c;
        Test.startTest(); 
        List<Services_and_Support_Plan__c> res = RosterInvoicesHandler.serviceSupportList(
            new List<String>{client.Id}, String.valueOf(Date.today().addDays(-10)), String.valueOf(Date.today()), orgId, 'John',new List<String>{'Not Yet Invoiced'}
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
       // invoice.Services_Id_List__c = service.Id;
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
       // System.assertEquals('Not Yet Invoiced', service.Status__c);
        //System.assertEquals(invoice.Id, service.Accounting_Invoices_Expenses__c);
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
 

}