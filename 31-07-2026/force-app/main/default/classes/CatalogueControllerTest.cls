@isTest
public class CatalogueControllerTest {
    
    @testsetup Static void testData(){         
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
        system.debug(org.name);
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        System.runAs(user) { 
            
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Facility';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12345678765';
            fac.Phone__c = '123123123';
            insert fac;
            
            Account portalAccount = new Account(Name = 'Portal Account');
            insert portalAccount;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4139562@hotmail.com';
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
            staff.Module_Names__c = 'Admin';
            insert staff;
            
            Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c  = 'Participant2948';
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
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000; 
            funds.Spent_Amt__c = 0; 
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            funds.State__c='ACT__c';
            insert funds;
            
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
            
            Entity_Profile__c entityProfile = new Entity_Profile__c(Name = 'Test Entity');
        	insert entityProfile;
            
            Xero_Entity__c xero = new Xero_Entity__c(
                First_Name__c = 'Jane',
                Last_Name__c = 'Doe'
            );
            insert xero;
            
            ClientFundTrackerJN__c junction = new ClientFundTrackerJN__c(
                Participant__c = cli.Id,
                Funds_Tracker__c = funds.Id,
                State__c = 'ACT__c',
                NDIS_Support_Catalogue__c = NSC.Id,
                Amount__c = 100,
                Edited_Catelog_Name__c = 'Edited Name',
               // Shift_Type__c = 'Day',
                Entity_Profile__c = entityProfile.Id,
                Xero_Entity__c = xero.Id
            );
            insert junction; 
            
        }
    }
    
    @isTest
    static void testsaveCatalogue() {
        Map<String, Object> formData = new Map<String, Object>();
        formData.put('Name', 'Test Catalogue From LWC');
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];

        String formDataJson = JSON.serialize(formData);
        
        NDIS_Support_Catalogue__c ndis1 = new NDIS_Support_Catalogue__c(
            Name = 'NDIS 1'
        );
        NDIS_Support_Catalogue__c ndis2 = new NDIS_Support_Catalogue__c(
            Name = 'NDIS 2'
        );
        insert new List<NDIS_Support_Catalogue__c>{ ndis1, ndis2 };
            
        // ------------------------
        // Existing Service Catalogue (for update path)
        // ------------------------
        Service_Catalogue__c existingSC = new Service_Catalogue__c(
            Facility__c = fac.Id,
            NDIS_Support_Catalogue__c = ndis1.Id,
            Active__c = false
        );
        insert existingSC;

        // ------------------------
        // Build payload exactly as your Apex expects
        // ------------------------
        List<Map<String, Object>> payload = new List<Map<String, Object>>();

        // ➕ Insert case
        payload.add(new Map<String, Object>{
            'Id' => ndis2.Id,
            'serviceCatalogueId' => null,
            'isSelected' => true
        });

        // 🔁 Update case
        payload.add(new Map<String, Object>{
            'Id' => ndis1.Id,
            'serviceCatalogueId' => existingSC.Id,
            'isSelected' => true
        });

        String selectedRecordsJson = JSON.serialize(payload);


        Test.startTest();
        	CatalogueController.saveCatalogue(fac.Id, formDataJson);  
        	CatalogueController.processBulkSelectedRecords(fac.Id, selectedRecordsJson);
        	CatalogueController.getfacilityselectedCatalogue(fac.Id);
        	CatalogueController.getServiceCataloguesByClient(cli.Id);
        Test.stopTest();
    }
    
    @isTest
    static void test_removeServiceGroup() {
    
        List<Client__c> cliList = [SELECT Id FROM Client__c LIMIT 1];
        List<NDIS_Support_Catalogue__c> ndisList = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
    
        Id clientId = cliList.isEmpty() ? null : cliList[0].Id;
        Id serviceId = ndisList.isEmpty() ? null : ndisList[0].Id;
    
        Test.startTest();
        CatalogueController.removeServiceGroup(clientId, serviceId);
        Test.stopTest();
    }
    @isTest
    static void test_handleUncheck() {
    
        List<Facility__c> facList = [SELECT Id FROM Facility__c LIMIT 1];
        List<NDIS_Support_Catalogue__c> ndisList = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
    
        Id facilityId = facList.isEmpty() ? null : facList[0].Id;
        Id recordId   = ndisList.isEmpty() ? null : ndisList[0].Id;
    
        Test.startTest();
        CatalogueController.handleUncheck(facilityId, recordId);
        Test.stopTest();
    }
        @isTest
    static void test_processBulkSelectedRecordsUncheck() {
    
        List<Facility__c> facList = [SELECT Id FROM Facility__c LIMIT 1];
        List<NDIS_Support_Catalogue__c> ndisList = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 2];
    
        Id facilityId = facList.isEmpty() ? null : facList[0].Id;
    
        List<Id> recordIds = new List<Id>();
        for (NDIS_Support_Catalogue__c rec : ndisList) {
            recordIds.add(rec.Id);
        }
    
        Test.startTest();
        CatalogueController.processBulkSelectedRecordsUncheck(facilityId, recordIds); 
        Test.stopTest();
    }
    
    @isTest
    static void testGetCatalogueData_Tesseract() {

        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
      string financialyear='2026-07-02';
        Test.startTest();

        CatalogueDataHandler.CatalogueDataWrapper result =
            CatalogueDataHandler.getCatalogueData(
                fund.Id,
                client.Id,
                'Tesseract System',
                financialyear
            );

        Test.stopTest();

        System.assertNotEquals(null, result);
    }

    @isTest
    static void testGetCatalogueData_Xero() {

        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];

        Test.startTest();
		 string financialyear='2026-07-02';
        CatalogueDataHandler.CatalogueDataWrapper result =
            CatalogueDataHandler.getCatalogueData(
                fund.Id,
                client.Id,
                'Xero',
                financialyear
            );

        Test.stopTest();

        System.assertNotEquals(null, result);
        
    }

    @isTest
    static void testNoFundsTracker() {

        Client__c client = [SELECT Id FROM Client__c LIMIT 1];

        Test.startTest();
	    string financialyear='2026-07-02';
        CatalogueDataHandler.CatalogueDataWrapper result =
            CatalogueDataHandler.getCatalogueData(
                '001000000000000AAA',
                client.Id,
                'Tesseract System',
                financialyear
            );

        Test.stopTest();

        System.assertEquals(0, result.catalogueData.size());
        System.assertEquals('', result.statesCombined);
    }

}