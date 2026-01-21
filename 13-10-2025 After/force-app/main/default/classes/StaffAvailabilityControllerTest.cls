@isTest
public class StaffAvailabilityControllerTest {
    
    static Id testStaffId;
    
    @testSetup
    static void setupData() {
        Organisation__c org = new Organisation__c(
            Name = 'Ashfield Consultants',
            ABN__c = '11234567891',
            ACN__c = '878787878',
            Contact_No__c = '6132899740',
            RCTI__c = 'RCTI1',
            Email__c = 'dsfdsfsd@gmail.com',
            Bank__c = 'Bank Test',
            BSB__c = 'BSB Test',
            Account_Name__c = 'Test Account',
            Account_Number__c = '1111111111',
            Description__c = 'test Desc',
            Address_Latest__Street__s = '101',
            Address_Latest__City__s = 'Himas Waterhen',
            Address_Latest__PostalCode__s = '2060',
            Address_Latest__CountryCode__s = 'AU',
            Address_Latest__StateCode__s = 'NSW',
            NDIS_Provider__c = '12341234565',
            BMSI_Identifier__c = 'TEST BMSI',
            SoftwareId__c = 'jhdfn18328',
            Branch_code__c = 'BS123',
            Contact_Name__c = 'Test Contact',
            User_Type__c = 'NDIS Org Admin'
        );
        insert org;
        
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen',
            Email = 'testuser@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Test',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser_' + DateTime.now().getTime() + '@example.com',
            Organization_Name__c = org.Name
        );
        insert user;
        
        System.runAs(user) {
            Facility__c fac = new Facility__c(
                Name = 'Ashfield Consultants',
                Address__City__s = 'Crace',
                Address__Street__s = '8 Keewong Street',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                Email__c = 'testonefacility@gmail.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '12234567',
                Phone__c = '12323432'
            );
            insert fac;
            
            Staff__c staff = new Staff__c(
                Last_Name__c = 'Test staff',
                Name = 'praveen1',
                Name__c = 'abcd',
                Contact_Number__c = '56789908743',
                Email_Address__c = 'testuser@example.com',
                Facility__c = fac.Id,
                Address__Street__s = '8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Emergency_Phone_Number__c = '45678766675',
                Primary_Contact_Name__c = 'Praveen',
                Primary_Contact_Number__c = '9908458298',
                Make_Primary_as_Approver__c = true,
                Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com',
                Secondary_Contact_Name__c = 'maheswari',
                Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com',
                Make_Secondary_as_Approver__c = false,
                Secondary_Contact_Number__c = '99084582958',
                Emp_exit_date__c = Date.newInstance(2028, 01, 05),
                Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
                Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04),
                Date_Of_Birth__c = Date.newInstance(2001, 02, 04),
                Role__c = 'Admin',
                Residency_Type__c = 'Australian',
                Expiry_Date__c = Date.newInstance(2025, 02, 19),
                Type__c = 'Visa Status',
                Working_Hours_Rate__c = 50,
                Final_Overall_Rate__c = 150,
                Saturday_Hourly_Rate__c = 130,
                Sunday_Hourly_Rate__c = 50
            );
            insert staff;
            
            Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant';
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
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
            // cli.Staff__c=staff.id;
            //cli.Organization_Name__c='Ace Info Systems';
            insert cli;
            
            testStaffId = staff.Id;
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
            //  funds.Available_Funds__c = 10000;	
            //  funds.Spent_Amount__c = 1000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
            Participant_Staff_Association__c assoc1 = new Participant_Staff_Association__c(
                Staff__c = staff.Id,
                Participant__c = cli.Id,
                Role__c = 'Support Worker'
            );
            insert assoc1;
            
            NDIS_Support_Catalogue__c catalogue = new NDIS_Support_Catalogue__c(
                Name = 'Support 1',
                Support_Item_Name__c = 'Support Item A',
                Support_Category_Number__c = 01,
                Support_Item_Number__c = '0101',
                Available_fund__c = 1000,
                NSW__c = 10
            );
            insert catalogue;
            
            Availability__c availability = new Availability__c(
                Staff__c = staff.Id,
                Shift_Type__c = 'Morning', // Replace with valid picklist value
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Start_Date__c = Date.today(),
                Role__c = 'Admin',
                Address__Street__s='8 Keewong Street',
                Address__City__s='Crace',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Geo_Location__Latitude__s=-35.2005216,
                Geo_Location__Longitude__s=149.1096594,
                Address_Type__c='Participant',
                Participant__c=cli.Id,
                NDIS_Support_Catalogue__c=catalogue.Id,
                Funds_Tracker__c=funds.Id
            );
            insert availability;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c = Date.today();
            shift.End_Date__c= Date.today();
            shift.Role__c='Admin';
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
            shift.Shift_Type__c='General';
            shift.RefId__c=availability.id;
            shift.Un_Assigned_Shift__c=true;
            insert shift;
            
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=false;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            staffs.RefId__c=availability.id;
            staffs.Un_Assigned_Shift__c=true;
            
            // staffs.Long_Afternoon_Start_Time__c= Time.newInstance(01, 30, 00, 00);
            //  staffs.Long_Afternoon_End_Time__c=Time.newInstance(01, 30, 00, 00);
            insert staffs;
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = catalogue.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Service_Type__c = catalogue.Id;
            services.Qty__c=5;
            services.GST__c='No';
            //    services.Date_of_Service__c = SYSTEM.TODAY();
            services.Date_of_Service__c = Date.today();
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffs.Id;
            services.Un_Assigned_Service__c=true;
            insert services;
            
            
            ClientFundTrackerJN__c junction = new ClientFundTrackerJN__c(
                Participant__c = cli.Id,
                Funds_Tracker__c = funds.Id,
                NDIS_Support_Catalogue__c = catalogue.Id
            );
            insert junction;
        }
    }
    
    @isTest
    static void testSaveStaffData_NonRecurring_NewRecord() {
        User UserList = [Select Id, Email From User Where Email = 'testuser@example.com' LIMIT 1];
        System.runAs(UserList){
            Staff__c staffList = [Select Id From Staff__c LIMIT 1];
            list<facility__c> facList=[select  id from facility__c];
            list<string> fac=new list<string>();
            for(facility__c fa :facList){
                fac.add(fa.id);
            }
            
            Availability__c availabilityList = [Select Id From Availability__c LIMIT 1];
            Client__c clientList = [Select Id From Client__c LIMIT 1];
            Participant_Staff_Association__c PSAList = [Select Id From Participant_Staff_Association__c LIMIT 1];
            NDIS_Support_Catalogue__c NDISSupport = [Select Id From NDIS_Support_Catalogue__c LIMIT 1];
            Funds_Tracker__c FundTracker = [Select Id From Funds_Tracker__c LIMIT 1];
            String dateStr = '08/05/2025'; // Format: dd/MM/yyyy
            String inputDate = '08/05/2025';
            String timeStr = '9:15 AM';
            String clientId = clientList.Id;
            
            Test.startTest();
			//StaffAvailabilityController.getCatalogueData('Community Nursing Care',clientId);
            Staff__c getstaffId = StaffAvailabilityController.getstaffId(UserList.Id);
            Availability__c handleSelectedAvailability = StaffAvailabilityController.handleSelectedAvailability(availabilityList.Id);
            Date parseDate = StaffAvailabilityController.parseDate(dateStr);
            Date convertDate = StaffAvailabilityController.convertDate(inputDate);
            Time convertToTime = StaffAvailabilityController.convertToTime(timeStr);
            Time parseTime = StaffAvailabilityController.parseTime(timeStr);
            List<Map<String, String>> getServiceType = StaffAvailabilityController.getServiceType(clientList.Id);
            List<Availability__c> getServicesAndSupportPlansByDate = StaffAvailabilityController.getServicesAndSupportPlansByDate(UserList.Id, '2025-12-5');
            List<Map<String, String>> getStaffOptions = StaffAvailabilityController.getStaffOptions('Support Worker', clientList.Id);
            List<Availability__c> getParticipantAvailability = StaffAvailabilityController.getParticipantAvailability(clientList.Id, String.valueOf(Date.today()));
            // List<Availability__c> getStaffAvailability = StaffAvailabilityController.getStaffAvailability(clientList.Id, String.valueOf(Date.today()));
            List<Availability__c> getStaffAvailability = StaffAvailabilityController.getStaffAvailability(String.valueOf(Date.today()));
            StaffAvailabilityController.saveStaffData(
                null,
                '08/05/2025',
                'Morning',
                true,
                new List<String>(),
                '08:00 AM',
                '10:00 AM',
                staffList.Id,
                String.valueOf(Date.today()),
                'Daily',
                1,
                0,
                '01/05/2025',
                'shift1'
           
            );
            
            StaffAvailabilityController.saveStaffData(
                availabilityList.Id, '08/05/2025', 'Morning', true, 
                new List<String>{'Monday'}, '8:00 AM', '10:00 PM', staffList.Id, 
                String.valueOf(Date.today().addDays(60)), 'Weekly', 1, 0,'01/06/2025','shift2'
            );
            
            /*  StaffAvailabilityController.saveStaffData(
null, '08/05/2025', 'Morning', true, 
new List<String>{'Monday'}, '8:00 AM', '10:00 PM', staffList.Id, 
String.valueOf(Date.today().addDays(60)), 'Weekly', 1, 0
);*/
            RosterAutoScheduleTriggerHandler.updateUnAssignedShifts(string.valueof(Date.today()), string.valueof(Date.today()));
            String inputJson = '[{"id":"1","label":"Classification","isIcon":true,"direction":"arrowup","iconName":"utility:arrowup","directionLabel":"Low to High","index":1},{"id":"2","label":"Risk Index","isIcon":true,"direction":"arrowup","iconName":"utility:arrowup","directionLabel":"Low to High","index":2},{"id":"3","label":"Employment Type","isRadio":true,"value":"Permanent","index":3},{"id":"4","label":"Preferred Staff","isCheckbox":true,"value":false,"index":4},{"id":"5","label":"Fatigue Management","isCheckbox":true,"value":false,"index":5},{"id":"6","label":"Geo Location","isSlider":true,"value":50,"index":6}]';
            
            Date startDate = Date.today();
            Date endDate = Date.today().addDays(7);
            
           // RosterAutoScheduleHandler.assignShifts(String.valueOf(startDate), String.valueOf(endDate), inputJson,fac);
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            
              Date today = Date.today();
            req.requestURI = '/services/apexrest/myAvailability/';
            req.httpMethod = 'GET';
            req.addParameter('year', String.valueOf(today.year()));
            req.addParameter('month', String.valueOf(today.month()));
            
            RestContext.request = req;
            RestContext.response = res;
            
            // Step 5: Call method
            MobileStaffAvailabilityHandler.getAvailabilityData();
            
            Test.stopTest();
        }
    } 
    
    @isTest
    static void testGetCatalogueData() {
        // Fetch test data
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Funds_Tracker__c tracker = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        
        Test.startTest();
        CatalogueDataHandler.CatalogueDataWrapper result = CatalogueDataHandler.getCatalogueData(tracker.Id, client.Id);
        Test.stopTest();
        
        System.assertNotEquals(null, result);
        System.assert(result.catalogueData.size() > 0, 'Catalogue data should be returned');
        //System.assertNotEquals(null, result.statesCombined, 'State should be returned');
    }
    
    @isTest
    static void testSaveShiftData_Recurring() {
        User UserList = [Select Id, Email From User Where Email = 'testuser@example.com' LIMIT 1];
        System.runAs(UserList){
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Staff__c staff = [Select Id From Staff__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        NDIS_Support_Catalogue__c catalog = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        
        Map<String, Object> shiftData = new Map<String, Object>{
            'clientId' => client.Id,
                'shiftType' => 'General',
                'startTime' => '6:00 AM',
                'endTime' => '4:00 PM',
                'todayDate' => String.valueOf(Date.today()),
                'recurEndDate' => String.valueOf(Date.today().addDays(2)),
                'recurEvery' => '1',
                'recurringChecked' => true,
                'recurringType' => 'Daily',
                'selectedDays' => new List<Object>{},
                    'monthOfDay' => '',
                    'street' => '456 Test Rd',
                    'postalCode' => '2000',
                    'province' => 'NSW',
                    'country' => 'Australia',
                    'city' => 'Sydney',
                    'LocationLatitude' => -33.8688,
                    'LocationLongitude' => 151.2093,
                    'AdddressType' => 'Participant',
                    'serviceTypeId' => fund.Id,
                    'catalogId' => catalog.Id,
                    'roleId' => 'Support Worker',
                    'roleRows' => new List<Object>{
                        new Map<String, Object>{
                            'selectedStaff' => staff.Id,
                                'priority' => '1'
                                }
                    },
                        'staffList' => new List<Object>{}
        };
            
            Test.startTest();
       StaffAvailabilityController.saveShiftData(shiftData);
        Test.stopTest();
        
        List<Availability__c> recurringAvailabilities = [SELECT Id FROM Availability__c WHERE Participant__c = :client.Id];
        //System.assert(recurringAvailabilities.size() > 1, 'Multiple Availability records should be created for recurring shifts');
        }
    }
    
    @isTest
    static void testSaveShiftData_NonRecurring() {
        // Prepare test data
        Organisation__c org = OrgDetailsTest.createOrganization();
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        User user = new User(
            Alias = 'praveen',
            Email = 'manualtesting.218616@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Test nagendra218616',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.218616@hotmail.com',
            Organization_Name__c = 'Pinnacle IT'
        );
        insert user;
        
        System.runAs(user) {
            Facility__c fac = new Facility__c(
                Name = 'Ashfield Consultants',
                Address__City__s = 'Crace',
                Address__Street__s = '8 Keewong Street',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Email__c = 'testfacility@gmail.com',
                Organisation__c = org.Id,
                Status__c = true,
                ABN__c = '1235645433',
                Phone__c = '12323213'
            );
            insert fac;
            
            Staff__c staff = new Staff__c(
                Last_Name__c = 'Test',
                Name = 'praveen1',
                Name__c = 'abcd',
                Contact_Number__c = '56789908743',
                Email_Address__c = 'manualtesting.218616@hotmail.com',
                Facility__c = fac.Id,
                Address__Street__s = '8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Emergency_Phone_Number__c = '45678766675',
                Primary_Contact_Name__c = 'Praveen',
                Primary_Contact_Number__c = '9908458298',
                Make_Primary_as_Approver__c = true,
                Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com',
                Secondary_Contact_Name__c = 'maheswari',
                Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com',
                Make_Secondary_as_Approver__c = false,
                Secondary_Contact_Number__c = '99084582958',
                Emp_exit_date__c = Date.newInstance(2028, 01, 05),
                Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
                Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04),
                Date_Of_Birth__c = Date.newInstance(2001, 02, 04),
                role__c = 'Admin',
                Residency_Type__c = 'Australian',
                Expiry_Date__c = Date.newInstance(2025, 02, 19),
                Type__c = 'Visa Status',
                Working_Hours_Rate__c = 50
            );
            insert staff;
            
            
            Client__c cli = new Client__c(
                First_Name__c = 'Test',
                Last_Name__c = 'Participant',
                Gendar__c = 'Male',
                Date_Of_Birth__c = Date.newInstance(1991, 2, 17),
                Address__Street__s = '8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Contact_Number__c = '4331237651',
                Drivers_Licence__c = '123456789012',
                Primay_Contact_First_Name__c = 'Jason',
                Primay_Contact_Last_Name__c = 'Smith',
                Relationship__c = 'Parent',
                Primary_Contact_Number__c = '0433123123',
                Facility__c = fac.Id
            );
            insert cli;
            
            Attachment__c attach = new Attachment__c(
                Added_By__c = cli.Id,
                Name = 'test attachment',
                Date__c = Date.newInstance(2023, 11, 07),
                Type__c = 'Certificate',
                Type_of_Document__c = 'GP Cerificate',
                User__c = user.Id,
                Comments__c = 'Test Comments',
                Amazon_file_URL__c = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf',
                Size__c = '0.12 MB'
            );
            insert attach;
            
            Client_Journel__c journel = new Client_Journel__c(
                Client__c = cli.Id,
                Notes_Type__c = 'Care Notes',
                Description__c = 'Test Care Notes Description'
            );
            insert journel;
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
            //  funds.Available_Funds__c = 10000;	
            //  funds.Spent_Amount__c = 1000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
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
            
            Availability__c  availability = new Availability__c(
     
                Shift_Type__c = 'Morning', // Replace with valid picklist value
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Start_Date__c = Date.today(),
                Role__c = 'Admin',
                Address__Street__s='8 Keewong Street',
                Address__City__s='Crace',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Geo_Location__Latitude__s=-35.2005216,
                Geo_Location__Longitude__s=149.1096594,
                Address_Type__c='Participant',
                Participant__c=cli.Id,
                NDIS_Support_Catalogue__c=NSC.Id,
                Funds_Tracker__c=funds.Id
            );
            insert availability;
            
            // Construct the shiftData map
            Map<String, Object> shiftData = new Map<String, Object>{
                'clientId' => cli.Id,
                    'availabilityId' => availability.Id,
                    'shiftType' => 'General',
                    'startTime' => '8:00 AM',
                    'endTime' => '8:00 PM',
                    'todayDate' => String.valueOf(Date.today()),
                    'street' => '123 Test St',
                    'city' => 'Testville',
                    'province' => 'NSW',
                    'country' => 'Australia',
                    'postalCode' => '2000',
                    'AdddressType' => 'Participant',
                    'LocationLatitude' => 33.8688,
                    'LocationLongitude' => 151.2093,
                    'serviceTypeId' => funds.Id,
                    'regionState' => 'NSW',
                    'catalogId' => NSC.Id,
                    'roleId' => 'Support Worker',
                    'staffList' => new List<Object>{
                        new Map<String, Object>{
                            'Id' => staff.Id,
                                'priority' => 1
                                }
                    }
            };
           list<Availability__c> avaliList = new list<Availability__c>();
            avaliList.add(availability);
            Test.startTest();
           
            AvailabilityTrigger.handleDelete(avaliList);
           	StaffAvailabilityController.saveShiftData(shiftData);
            Test.stopTest();
        }
    }  
    
    @isTest
    static void testSaveShiftData_Recurring1() {
        // Prepare test data
        Organisation__c org = OrgDetailsTest.createOrganization();
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen',
            Email= 'manualtesting.218616@hotmail.com',
            EmailEncodingKey='UTF-8',
            LastName='Test User',
            LanguageLocaleKey='en_US',
            LocaleSidKey='en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey='America/New_York',
            UserName='testuser.recurring@example.com',
            Organization_Name__c ='Pinnacle IT'
        );
        insert user;
        
        System.runAs(user) {
            Facility__c fac = new Facility__c(
                Name='Ashfield Consultants',
                Address__City__s='Crace',
                Address__Street__s='8 Keewong Street',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Email__c= 'testfacility@gmail.com',
                Organisation__c= org.Id,
                Status__c=true,
                ABN__c='1235645433',
                Phone__c = '12323213'
            );
            insert fac;
            
            Staff__c staff = new Staff__c(
                Last_Name__c='Test',
                Name='praveen1',
                Name__c='abcd',
                Contact_Number__c='56789908743',
                Email_Address__c= 'manualtesting.218616@hotmail.com',
                Facility__c=fac.Id,
                Address__Street__s='8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Emergency_Phone_Number__c='45678766675',
                Primary_Contact_Name__c='Praveen',
                Primary_Contact_Number__c='9908458298',
                Make_Primary_as_Approver__c=true,
                Primary_Contact_Email__c='praveenshesham.sp@gmail.com',
                Secondary_Contact_Name__c='maheswari',
                Secondary_Contact_Email__c='maheswari.adabala@gmail.com',
                Make_Secondary_as_Approver__c=false,
                Secondary_Contact_Number__c='99084582958',
                Emp_exit_date__c = Date.newInstance(2028, 01, 05),
                Emp_Start_Date__c = Date.newInstance(2023, 02, 01),
                Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04),
                Date_Of_Birth__c = Date.newInstance(2001, 02, 04),
                role__c='Admin',
                Residency_Type__c = 'Australian',
                Expiry_Date__c = Date.newInstance(2025, 02, 19),
                Type__c = 'Visa Status',
                Working_Hours_Rate__c=50
            );
            insert staff;
            
            Client__c cli = new Client__c(
                First_Name__c = 'Test',
                Last_Name__c = 'Participant',
                Gendar__c = 'Male',
                Date_Of_Birth__c = Date.newInstance(1991, 2, 17),
                Address__Street__s = '8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Contact_Number__c = '4331237651',
                Drivers_Licence__c = '123456789012',
                Primay_Contact_First_Name__c = 'Jason',
                Primay_Contact_Last_Name__c = 'Smith',
                Relationship__c = 'Parent',
                Primary_Contact_Number__c = '0433123123',
                Facility__c = fac.Id
            );
            insert cli;
            
            Attachment__c attach = new Attachment__c(
                Added_By__c = cli.Id,
                Name = 'test attachment',
                Date__c = Date.newInstance(2023, 11, 07),
                Type__c = 'Certificate',
                Type_of_Document__c = 'GP Cerificate',
                User__c = user.Id,
                Comments__c = 'Test Comments',
                Amazon_file_URL__c = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf',
                Size__c = '0.12 MB'
            );
            insert attach;
            
            Client_Journel__c journel = new Client_Journel__c(
                Client__c = cli.Id,
                Notes_Type__c = 'Care Notes',
                Description__c = 'Test Care Notes Description'
            );
            insert journel;
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
            //  funds.Available_Funds__c = 10000;	
            //  funds.Spent_Amount__c = 1000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
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
            
            // Construct the shiftData map with recurring options
            Map<String, Object> shiftData = new Map<String, Object>{
                'clientId' => cli.Id,
                    'shiftType' => 'General',
                    'startTime' => '9:00 AM',
                    'endTime' => '7:00 PM',
                    'todayDate' => String.valueOf(Date.today()),
                    'street' => '123 Test St',
                    'city' => 'Testville',
                    'province' => 'NSW',
                    'country' => 'Australia',
                    'postalCode' => '2000',
                    'AdddressType' => 'Participant',
                    'LocationLatitude' => 33.8688,
                    'LocationLongitude' => 151.2093,
                    'serviceTypeId' => funds.Id,
                    'regionState' => 'NSW',
                    'catalogId' => NSC.Id,
                    'roleId' => 'Support Worker',
                    'isRecurring' => true,
                    'repeatEvery' => 1,
                    'frequency' => 'Weekly',
                    'recurringEndDate' => String.valueOf(Date.today().addDays(21)),  // End 3 weeks later
                    'daysOfWeek' => new List<String>{'Monday', 'Wednesday'}, // Repeat on Mon/Wed
                        'staffList' => new List<Object>{
                            new Map<String, Object>{
                                'Id' => staff.Id,
                                    'priority' => 1
                                    }
                        }
            };
                
            Test.startTest();
            StaffAvailabilityController.saveShiftData(shiftData);
            
              Date today = Date.today();
            Date recurEnd = today.addDays(7);
            String requestBodyJson = JSON.serialize(new Map<String, Object>{
                'availableId' => '',
                'startDate' => today.format(),
                'endDate' => today.format(),
                'startTime' => '09:00 AM',
                'endTime' => '05:00 PM',
                'shiftType' => 'Morning',
                'isRecurring' => true,
                'recurEndDate' => recurEnd.format(),
                'recurEvery' => 1,
                'typeOfRecur' => 'Weekly',
                'weeklyDays' => new List<String>{'Monday', 'Wednesday'},
                'monthlyDay' => null
            });

            // Step 4: Mock RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestUri = '/services/apexrest/myAvailability/';
            req.httpMethod = 'POST';
            req.requestBody = Blob.valueOf(requestBodyJson);
            RestResponse res = new RestResponse();

            RestContext.request = req;
            RestContext.response = res;

           
            Test.stopTest();
        }
    }
    
    @isTest
    static void testIsShiftOverlap_true() {
        // Setup overlapping time ranges
        DateTime recurStart = DateTime.newInstance(2025, 6, 2, 9, 0, 0);
        DateTime recurEnd = DateTime.newInstance(2025, 6, 2, 12, 0, 0);

        DateTime shiftStart = DateTime.newInstance(2025, 6, 2, 10, 0, 0);
        DateTime shiftEnd = DateTime.newInstance(2025, 6, 2, 13, 0, 0);

        Boolean result = StaffAvailabilityController.isShiftOverlap(recurStart, recurEnd, shiftStart, shiftEnd);
    }
    
     static void runNegativeTest(Map<String, Object> overrides, String expectedError) {
        User u = [SELECT Id, Email FROM User WHERE Email = 'testuser@example.com' LIMIT 1];
        System.runAs(u) {
           

            RestRequest req = new RestRequest();
            req.requestUri = '/services/apexrest/myAvailability/';
            req.httpMethod = 'POST';
            req.requestBody = Blob.valueOf(JSON.serialize(overrides));
            RestResponse res = new RestResponse();
            RestContext.request = req;
            RestContext.response = res;

            MobileStaffAvailabilityHandler.createstaffAvaialability();

            String response = RestContext.response.responseBody.toString();
           
        }
    }

    @isTest static void testEmptyBody() {
         User u = [SELECT Id, Email FROM User WHERE Email = 'testuser@example.com' LIMIT 1];
        System.runAs(u) {
   
            RestContext.request = new RestRequest();
            RestContext.request.requestBody = Blob.valueOf('');
            RestContext.response = new RestResponse();
            MobileStaffAvailabilityHandler.createstaffAvaialability();
          //  System.assert(RestContext.response.responseBody.toString().contains('Request body cannot be empty'));
        }
    }

    @isTest static void testMissingStartDate() {
        runNegativeTest(new Map<String, Object>{ 'startDate' => null }, 'Start Date is required');
    }

    @isTest static void testMissingStartTime() {
        runNegativeTest(new Map<String, Object>{ 'startTime' => null }, 'Start Time is required');
    }

    @isTest static void testMissingEndTime() {
        runNegativeTest(new Map<String, Object>{ 'endTime' => '' }, 'End Time is required');
    }

    @isTest static void testMissingShiftType() {
        runNegativeTest(new Map<String, Object>{ 'shiftType' => '' }, 'Shift Type is required');
    }

    @isTest static void testRecurMissingEndDate() {
        runNegativeTest(new Map<String, Object>{
            'isRecurring' => true,
            'recurEndDate' => null
        }, 'Recur End Date is required for recurring availability');
    }

    @isTest static void testRecurEndBeforeStart() {
        runNegativeTest(new Map<String, Object>{
            'isRecurring' => true,
            'recurEndDate' => Date.today().addDays(-1).format()
        }, 'Recur End Date must be after Start Date');
    }

    @isTest static void testRecurInvalidRecurEvery() {
        runNegativeTest(new Map<String, Object>{
            'isRecurring' => true,
            'recurEndDate' => Date.today().addDays(5).format(),
            'recurEvery' => 0
        }, 'recurEvery must be greater than 0 for recurring availability');
    }

    @isTest static void testRecurMissingTypeOfRecur() {
        runNegativeTest(new Map<String, Object>{
            'isRecurring' => true,
            'recurEndDate' => Date.today().addDays(5).format(),
            'recurEvery' => 1,
            'typeOfRecur' => null
        }, 'Type Of Recur is required');
    }

    @isTest static void testRecurWeeklyMissingDays() {
        runNegativeTest(new Map<String, Object>{
            'isRecurring' => true,
            'recurEndDate' => Date.today().addDays(5).format(),
            'recurEvery' => 1,
            'typeOfRecur' => 'Weekly',
            'weeklyDays' => null
        }, 'weeklyDays are required for Weekly recurrence');
    }

    @isTest static void testRecurMonthlyMissingDay() {
        runNegativeTest(new Map<String, Object>{
            'isRecurring' => true,
            'recurEndDate' => Date.today().addDays(5).format(),
            'recurEvery' => 1,
            'typeOfRecur' => 'Monthly',
            'monthlyDay' => null
        }, 'monthlyDay is required for Monthly recurrence');
    }
    
    
     @isTest
    static void testCalculateShiftDatesLogic() {
        Date baseDate = Date.newInstance(2025, 7, 31);

        // Case 1: Night shift PM → AM => End date next day
        Map<String, Date> result1 = MobileStaffAvailabilityHandler.calculateShiftDates('Night', 'PM', 'AM', baseDate);
        
        // Case 2: Night shift AM → AM => Both dates next day
        Map<String, Date> result2 = MobileStaffAvailabilityHandler.calculateShiftDates('Night', 'AM', 'AM', baseDate);
       

        // Case 3: Custom shift AM → AM => End date next day
        Map<String, Date> result3 = MobileStaffAvailabilityHandler.calculateShiftDates('Custom', 'AM', 'AM', baseDate);
        
        // Case 4: Custom shift with endTime = PM => End date next day
        Map<String, Date> result4 = MobileStaffAvailabilityHandler.calculateShiftDates('Custom', 'AM', 'PM', baseDate);
       
        // Case 5: Shift that does not meet any condition (e.g. Morning AM → PM)
        Map<String, Date> result5 = MobileStaffAvailabilityHandler.calculateShiftDates('Morning', 'AM', 'PM', baseDate);
     
    }
    
      @isTest
    static void testParseTime1_validCases() {
        // 1. Normal AM case
        Time t1 = StaffAvailabilityController.parseTime1('9:15 AM');

        // 2. Normal PM case
        Time t2 = StaffAvailabilityController.parseTime1('2:30 PM');

        // 3. 12 AM → 00:00
        Time t3 = StaffAvailabilityController.parseTime1('12:00 AM');
        // 4. 12 PM → 12:00
        Time t4 = StaffAvailabilityController.parseTime1('12:00 PM');

        // 5. Only hour input
        Time t5 = StaffAvailabilityController.parseTime1('8 PM');

        // 6. Mixed case input
        Time t6 = StaffAvailabilityController.parseTime1(' 10:05 Am ');        
    }
     @isTest
    static void testProcessSingleShift_NormalCase() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Availability__c avail = [SELECT Id FROM Availability__c LIMIT 1];
        ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        String Year = '2025';
        String Month = '05';
        String Day = '16';
        String startDate = Year + '/' + Month + '/' + Day;  
        
       /* String Year1 = '2025';
        String Month1 = '10';
        String Day1 = '15';
        String endDate = Year1 + '/' + Month1 + '/' + Day1;  */

        Test.startTest();
        String resultJson = StaffAvailabilityController.processSingleShift(avail.Id,startDate,'09:00 AM','05:00 PM',staff.Id,shift.Id);
        Test.stopTest();

        System.debug('✅ Result JSON: ' + resultJson);
        System.assert(resultJson.contains('"result"'), 'Result should contain "result" field');
    }
    @isTest
    static void testNormalDuration() {
        Date testDate = Date.today();
        Time startTime = Time.newInstance(9, 0, 0, 0);   // 9:00 AM
        Time endTime   = Time.newInstance(17, 0, 0, 0);  // 5:00 PM

        Decimal duration = StaffAvailabilityController.calculateDuration(testDate, startTime, endTime);

        System.assertEquals(8, duration, 'Duration between 9 AM and 5 PM should be 8 hours');
    }
    
    @isTest
    static void testGetCatalogueData1() {
        // Get required records from setup
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Funds_Tracker__c funds = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        String fundsId = funds.Id;
        // Make sure we have matching ClientFundTrackerJN__c records
        List<ClientFundTrackerJN__c> junctions = [
            SELECT Id FROM ClientFundTrackerJN__c 
            WHERE Participant__c = :client.Id AND Funds_Tracker__c = :funds.Id
        ];
        System.assert(!junctions.isEmpty(), 'Expected at least one matching junction record');
        
        Test.startTest();
        StaffAvailabilityController.getCatalogueData(fundsId, client.Id);
        Test.stopTest();
    }

}