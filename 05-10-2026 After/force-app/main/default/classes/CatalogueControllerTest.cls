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
            fac.Type_of_Service__c='NDIS';
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
            NSC.Organization__c=org.Id;
            NSC.Facility__c=fac.Id;
            NSC.Type_of_Industry__c='NDIS';
          
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
            
            Participant_Facility__c pf = new Participant_Facility__c();
            pf.Participant__c=cli.Id;
            pf.Facility__c=fac.Id;
            pf.Active__c=true;
            insert pf;
            
            Service_Catalogue__c sc = new Service_Catalogue__c();
            sc.Financial_Year__c='2026-27';
            sc.Type_of_Industry__c='NDIS';
            sc.Active__c=true;
            sc.NDIS_Support_Catalogue__c=NSC.Id;
            sc.Facility__c=fac.Id;
            sc.Organization__c=org.Id;
            insert sc;
            
            Service_Catalogue_Facilty__c scf = new Service_Catalogue_Facilty__c();
            scf.Service_Catalogue__c=sc.Id;
            scf.Facility__c=fac.Id;
            scf.Active__c=true;
            insert scf;
            
            //Services_and_Support_Plan__c ssp = new Services_and_Support_Plan__c();
            //ssp.Service_Type__c=NSC.Id;
            //ssp.Date_of_Service__c=2026-07-02;
            //ssp.Date_of_Service__c = Date.today().addDays(5);
            //insert ssp;
            
            Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 03, 16);        
            shift.Direction__c=dire.Id;
            //shift.Role__c='Admin';
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift.End_Time__c=Time.newInstance( 05, 00, 00, 00);
            shift.Facility__c=fac.Id;
            shift.Status__c='Draft';
            shift.Start_time_picklist__c='3:30 am';
            shift.End_time_picklist__c='5:00 am';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            insert shift; 
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
            staffs.Start_Date__c = shift.Start_Date__c;

            staffs.Shift_Start_Time__c =
                shift.Start_Time__c;
            
            staffs.Shift_End_Date__c =
                shift.End_Date__c;
            // staffs.End_Time__c=system.now();
            insert staffs; 
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Service_Type__c = NSC.Id;
            services.Qty__c=5;
            // services.Unit_Price__c = 200;
            services.GST__c='No';
           // services.Date_of_Service__c = system.today();//Date.newInstance(2024, 10, 16);
            services.Date_of_Service__c = Date.today().addDays(5);
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffs.id;
            insert services;
            
            
        }
    }
    
    @isTest
    static void testsaveCatalogue() {
        Map<String, Object> formData = new Map<String, Object>();
        formData.put('Name', 'Test Catalogue From LWC');
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        Participant_Facility__c pf = [SELECT Id FROM Participant_Facility__c LIMIT 1];
        ClientFundTrackerJN__c cfj= [SELECT Id FROM ClientFundTrackerJN__c LIMIT 1];
        Services_and_Support_Plan__c services= [SELECT Id FROM Services_and_Support_Plan__c LIMIT 1];
        ShiftwithStaff__c staffs= [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Add_Shift__c shift= [SELECT Id FROM Add_Shift__c LIMIT 1];

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
		String Year1 = '2025';
        String Month1 = '10';
        String Day1 = '15';
        String approvedDate = Year1 + '-' + Month1 + '-' + Day1;

        Test.startTest();
        	CatalogueController.saveCatalogue(formDataJson);  //fac.Id, 
        	CatalogueController.processBulkSelectedRecords(fac.Id, selectedRecordsJson);
        	CatalogueController.getfacilityselectedCatalogue(fac.Id);
        	CatalogueController.getServiceCataloguesByClient(cli.Id,approvedDate);
        	Map<String, Boolean> result =CatalogueController.handleUncheckOrgWise(ndis1.Id);
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
     	NDIS_Support_Catalogue__c ndis = [Select Id from NDIS_Support_Catalogue__c LIMIT 1];
        Id ndisId = ndis.Id;
        Id facilityId = facList.isEmpty() ? null : facList[0].Id;
        Id recordId   = ndisList.isEmpty() ? null : ndisList[0].Id;
    
        Test.startTest();
      //  CatalogueController.handleUncheck(ndisId);//facilityId, recordId
        Test.stopTest();
    }
        @isTest
    static void test_processBulkSelectedRecordsUncheck() {
    
        List<Facility__c> facList = [SELECT Id FROM Facility__c LIMIT 1];
        List<NDIS_Support_Catalogue__c> ndisList = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 2];
        NDIS_Support_Catalogue__c ndis = [Select Id from NDIS_Support_Catalogue__c LIMIT 1];
        Id ndisId = ndis.Id;
    
        Id facilityId = facList.isEmpty() ? null : facList[0].Id;
    
        List<Id> recordIds = new List<Id>();
        for (NDIS_Support_Catalogue__c rec : ndisList) {
            recordIds.add(rec.Id);
        }
    
        Test.startTest();
       // CatalogueController.processBulkSelectedRecordsUncheck(ndisId); //facilityId, recordIds
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
    
    @isTest
    static void testProcessBulkUncheckOrgWise() {
        User u = [
            SELECT Id
            FROM User
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];

    
        List<NDIS_Support_Catalogue__c> catalogues = [SELECT Id FROM NDIS_Support_Catalogue__c];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Service_Catalogue__c sc = [SELECT Id FROM Service_Catalogue__c LIMIT 1];
        Service_Catalogue_Facilty__c scf = [SELECT Id FROM Service_Catalogue_Facilty__c LIMIT 1];
        Services_and_Support_Plan__c services= [SELECT Id FROM Services_and_Support_Plan__c LIMIT 1];
        ShiftwithStaff__c staffs= [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Add_Shift__c shift= [SELECT Id FROM Add_Shift__c LIMIT 1];
    
        List<Id> ids = new List<Id>();
        for (NDIS_Support_Catalogue__c c : catalogues) {
            ids.add(c.Id);
        }
        
        Map<String,Object> request = new Map<String,Object>();

        request.put('financialYear','2026-27');
        request.put('industry','NDIS');
        request.put('serviceType','Test');
    
        List<Object> items = new List<Object>();
    
        items.add(new Map<String,Object>{
            'catalogueId' => catalogues[0].Id,
            'isSelected' => true,
            'facilityIds' => new List<Id>{ fac.Id }
        });
    
        request.put('items', items);
        
        List<Object> request1 = new List<Object>();

        request1.add(new Map<String,Object>{
            'serviceCatalogueId' => sc.Id,
            'facilityIds' => new List<Id>{ fac.Id }
        });
        List<Id> serviceCatalogueIds = new List<Id>();

        for(Service_Catalogue__c sc1 :
            [SELECT Id FROM Service_Catalogue__c]){
                serviceCatalogueIds.add(sc1.Id);
            }
        
         List<Id> facilityIds = new List<Id>();

        for(Facility__c fac1 : [
            SELECT Id
            FROM Facility__c
        ]){
            facilityIds.add(fac1.Id);
        }

    	System.runAs(u) {
            Test.startTest();
            Map<Id, Map<String, Boolean>> result =CatalogueController.processBulkUncheckOrgWise(ids);
            Map<String, Object> result1 = CatalogueController.getServiceLineItem('2026-07-15');
            Map<String,Object> result2 =CatalogueController.getNewServiceTypeLineItem('2026-27','NDIS');
            Map<String,Object> result3 =CatalogueController.saveServiceCatalogues(JSON.serialize(request));
            Map<String,Object> result4 =CatalogueController.getServiceCatalogues();
            CatalogueController.saveServiceCatalogueFacilities(JSON.serialize(request1));
            Map<String,Boolean> result5 =CatalogueController.handleFacilityUncheck(fac.Id,serviceCatalogueIds);
            Map<Id,Map<String,Boolean>> result6 = CatalogueController.processBulkFacilityUncheck(facilityIds,serviceCatalogueIds);
            
            Test.stopTest();
        }
    
    }
    
    // =============================================
// TEST saveCatalogue - with null/empty inputs
// =============================================
@isTest
static void test_saveCatalogue_nullInputs() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        // Test with empty JSON
        CatalogueController.saveCatalogue('');
        
        // Test with null
        CatalogueController.saveCatalogue(null);
        
        Test.stopTest();
    }
}

// =============================================
// TEST saveCatalogue - with clone true
// =============================================
@isTest
static void test_saveCatalogue_withClone() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        Map<String, Object> formData = new Map<String, Object>();
        formData.put('serviceType', 'Test Service');
        formData.put('supportItemName', 'Support Item');
        formData.put('supportItemNumber', '12345');
        formData.put('industryType', 'NDIS');
        formData.put('ACT', 100);
        formData.put('NSW', 100);
        formData.put('NT', 100);
        formData.put('QLD', 100);
        formData.put('SA', 100);
        formData.put('TAS', 100);
        formData.put('VIC', 100);
        formData.put('WA', 100);
        formData.put('isClone', true);
        formData.put('facilityIds', new List<Id>{fac.Id});
        
        String formDataJson = JSON.serialize(formData);
        CatalogueController.saveCatalogue(formDataJson);
        
        Test.stopTest();
    }
}

// =============================================
// TEST saveCatalogue - with update existing
// =============================================
@isTest
static void test_saveCatalogue_updateExisting() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        Map<String, Object> formData = new Map<String, Object>();
        formData.put('Id', ndis.Id);
        formData.put('serviceType', 'Updated Service');
        formData.put('supportItemName', 'Updated Support Item');
        formData.put('supportItemNumber', '54321');
        formData.put('industryType', 'NDIS');
        formData.put('ACT', 200);
        formData.put('NSW', 200);
        formData.put('NT', 200);
        formData.put('QLD', 200);
        formData.put('SA', 200);
        formData.put('TAS', 200);
        formData.put('VIC', 200);
        formData.put('WA', 200);
        formData.put('isClone', false);
        
        String formDataJson = JSON.serialize(formData);
        CatalogueController.saveCatalogue(formDataJson);
        
        Test.stopTest();
    }
}

// =============================================
// TEST processBulkSelectedRecords - with empty list
// =============================================
@isTest
static void test_processBulkSelectedRecords_emptyList() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        // Test with empty JSON
        CatalogueController.processBulkSelectedRecords(fac.Id, '[]');
        
        // Test with null facility
        try {
            CatalogueController.processBulkSelectedRecords(null, '[{"Id":"' + fac.Id + '","isSelected":true}]');
        } catch (AuraHandledException e) {
            // Expected
        }
        
        Test.stopTest();
    }
}

// =============================================
// TEST getfacilityselectedCatalogue - with null
// =============================================
@isTest
static void test_getfacilityselectedCatalogue_null() {
    Test.startTest();
    List<Service_Catalogue__c> result = CatalogueController.getfacilityselectedCatalogue(null);
    Test.stopTest();
}

// =============================================
// TEST getServiceCataloguesByClient - with null/empty
// =============================================
@isTest
static void test_getServiceCataloguesByClient_null() {
    Client__c client = [SELECT Id FROM Client__c LIMIT 1];
    
    Test.startTest();
    
    // Test with null client
    Map<Id, List<Service_Catalogue__c>> result1 = CatalogueController.getServiceCataloguesByClient(null, '2026-07-15');
    
    // Test with blank date
    Map<Id, List<Service_Catalogue__c>> result2 = CatalogueController.getServiceCataloguesByClient(client.Id, '');
    
    Test.stopTest();
}

// =============================================
// TEST handleUncheckOrgWise - with null
// =============================================
@isTest
static void test_handleUncheckOrgWise_null() {
    Test.startTest();
    Map<String, Boolean> result = CatalogueController.handleUncheckOrgWise(null);
    Test.stopTest();
}

// =============================================
// TEST processBulkUncheckOrgWise - with null/empty
// =============================================
@isTest
static void test_processBulkUncheckOrgWise_null() {
    Test.startTest();
    
    // Test with null
    Map<Id, Map<String, Boolean>> result1 = CatalogueController.processBulkUncheckOrgWise(null);
    
    // Test with empty list
    Map<Id, Map<String, Boolean>> result2 = CatalogueController.processBulkUncheckOrgWise(new List<Id>());
    
    Test.stopTest();
}

// =============================================
// TEST getServiceLineItem - with different dates
// =============================================
@isTest
static void test_getServiceLineItem_differentDates() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        // Test with date in first half of year
        Map<String, Object> result1 = CatalogueController.getServiceLineItem('2026-01-15');
        
        // Test with date in second half of year
        Map<String, Object> result2 = CatalogueController.getServiceLineItem('2026-09-15');
        
        Test.stopTest();
    }
}

// =============================================
// TEST getNewServiceTypeLineItem - with different params
// =============================================
@isTest
static void test_getNewServiceTypeLineItem_variations() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        // Test with different financial years
        Map<String, Object> result1 = CatalogueController.getNewServiceTypeLineItem('2025-26', 'NDIS');
        Map<String, Object> result2 = CatalogueController.getNewServiceTypeLineItem('2026-27', 'NDIS');
        
        Test.stopTest();
    }
}

// =============================================
// TEST saveServiceCatalogues - with empty items
// =============================================
@isTest
static void test_saveServiceCatalogues_emptyItems() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        Map<String, Object> request = new Map<String, Object>();
        request.put('financialYear', '2026-27');
        request.put('industry', 'NDIS');
        request.put('serviceType', 'Test');
        request.put('items', new List<Object>());
        
        Map<String, Object> result = CatalogueController.saveServiceCatalogues(JSON.serialize(request));
        
        Test.stopTest();
    }
}

// =============================================
// TEST saveServiceCatalogues - with existing records
// =============================================
@isTest
static void test_saveServiceCatalogues_existingRecords() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        Map<String, Object> request = new Map<String, Object>();
        request.put('financialYear', '2026-27');
        request.put('industry', 'NDIS');
        request.put('serviceType', 'Test');
        
        List<Object> items = new List<Object>();
        items.add(new Map<String, Object>{
            'catalogueId' => ndis.Id,
            'isSelected' => true,
            'facilityIds' => new List<Id>{fac.Id}
        });
        request.put('items', items);
        
        Map<String, Object> result = CatalogueController.saveServiceCatalogues(JSON.serialize(request));
        
        Test.stopTest();
    }
}

// =============================================
// TEST saveServiceCatalogues - with deactivation
// =============================================
@isTest
static void test_saveServiceCatalogues_deactivate() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    Service_Catalogue__c sc = [SELECT Id, NDIS_Support_Catalogue__c FROM Service_Catalogue__c LIMIT 1];
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        Map<String, Object> request = new Map<String, Object>();
        request.put('financialYear', '2026-27');
        request.put('industry', 'NDIS');
        request.put('serviceType', 'Test');
        
        List<Object> items = new List<Object>();
        items.add(new Map<String, Object>{
            'catalogueId' => sc.NDIS_Support_Catalogue__c,
            'isSelected' => false,
            'facilityIds' => new List<Id>{fac.Id}
        });
        request.put('items', items);
        
        Map<String, Object> result = CatalogueController.saveServiceCatalogues(JSON.serialize(request));
        
        Test.stopTest();
    }
}

// =============================================
// TEST getServiceCatalogues - with no data
// =============================================
@isTest
static void test_getServiceCatalogues_noData() {
    // Create a user with no associated data
    Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
    Organisation__c org = [SELECT Id, Name FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    
    User newUser = new User(
        Alias = 'nocat',
        Email = 'nocatalogue@test.com',
        EmailEncodingKey = 'UTF-8',
        LastName = 'NoCatalogue',
        LanguageLocaleKey = 'en_US',
        LocaleSidKey = 'en_US',
        ProfileId = prof.Id,
        TimeZoneSidKey = 'America/New_York',
        UserName = 'nocatalogue@test.com',
        Organization_Name__c = org.Name
    );
    insert newUser;
    
    System.runAs(newUser) {
        Test.startTest();
        Map<String, Object> result = CatalogueController.getServiceCatalogues();
        Test.stopTest();
    }
}

// =============================================
// TEST saveServiceCatalogueFacilities - with empty data
// =============================================
@isTest
static void test_saveServiceCatalogueFacilities_empty() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    
    System.runAs(u) {
        Test.startTest();
        
        // Test with empty JSON
        CatalogueController.saveServiceCatalogueFacilities('[]');
        
        // Test with null
        try {
            CatalogueController.saveServiceCatalogueFacilities(null);
        } catch (AuraHandledException e) {
            // Expected
        }
        
        Test.stopTest();
    }
}

// =============================================
// TEST handleFacilityUncheck - with null/empty
// =============================================
@isTest
static void test_handleFacilityUncheck_null() {
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    
    Test.startTest();
    
    // Test with null facility
    Map<String, Boolean> result1 = CatalogueController.handleFacilityUncheck(null, new List<Id>{fac.Id});
    
    // Test with null service catalogue ids
    Map<String, Boolean> result2 = CatalogueController.handleFacilityUncheck(fac.Id, null);
    
    // Test with empty service catalogue ids
    Map<String, Boolean> result3 = CatalogueController.handleFacilityUncheck(fac.Id, new List<Id>());
    
    Test.stopTest();
}

// =============================================
// TEST processBulkFacilityUncheck - with null/empty
// =============================================
@isTest
static void test_processBulkFacilityUncheck_null() {
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    List<Id> facilityIds = new List<Id>{fac.Id};
    
    Test.startTest();
    
    // Test with null facility ids
    Map<Id, Map<String, Boolean>> result1 = CatalogueController.processBulkFacilityUncheck(null, new List<Id>{fac.Id});
    
    // Test with empty facility ids
    Map<Id, Map<String, Boolean>> result2 = CatalogueController.processBulkFacilityUncheck(new List<Id>(), new List<Id>{fac.Id});
    
    // Test with null service catalogue ids
    Map<Id, Map<String, Boolean>> result3 = CatalogueController.processBulkFacilityUncheck(facilityIds, null);
    
    Test.stopTest();
}

// =============================================
// TEST processBulkFacilityUncheck - with data
// =============================================
@isTest
static void test_processBulkFacilityUncheck_withData() {
    User u = [SELECT Id FROM User WHERE Organization_Name__c = 'Ashfield Consultants' LIMIT 1];
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Service_Catalogue__c sc = [SELECT Id FROM Service_Catalogue__c LIMIT 1];
    List<Id> facilityIds = new List<Id>{fac.Id};
    List<Id> serviceCatalogueIds = new List<Id>{sc.Id};
    
    System.runAs(u) {
        Test.startTest();
        Map<Id, Map<String, Boolean>> result = CatalogueController.processBulkFacilityUncheck(facilityIds, serviceCatalogueIds);
        Test.stopTest();
    }
}

}