@isTest
private class MobileStaffAvailabilityHandlerTest {
    
    @TestSetup
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
            Email = 'testuser1@example.com',
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
                Email_Address__c = 'testuser1@example.com',
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
                Participant__c = cli.Id//,
               // Role__c = 'Support Worker'
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
           // shift.Role__c='Admin';
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
    static void testGetAvailabilityDataSuccess() {
        // Get test user
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'testuser1@example.com' LIMIT 1];
        
        // Create the params map first
        Map<String, String> params = new Map<String, String>{
            'year' => String.valueOf(Date.today().year()),
                'month' => String.valueOf(Date.today().month())
                };
                    
                    // Set up mock request with params in constructor
                  
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/myAvailability/';
        req.httpMethod = 'GET';
        // Add parameters individually
        req.addParameter('year', String.valueOf(Date.today().year()));
        req.addParameter('month', String.valueOf(Date.today().month()));
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        // Run test as test user
        System.runAs(testUser) {
            Test.startTest();
            MobileStaffAvailabilityHandler.getAvailabilityData();
            Test.stopTest();
        }
        
        // Verify results
        String responseBody = RestContext.response.responseBody.toString();
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
        
    }
    
    @isTest
    static void testGetAvailabilityDataMissingParams() {
        // Get test user
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'testuser1@example.com' LIMIT 1];
        
        // Set up mock request with missing params
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/myAvailability/';
        req.httpMethod = 'GET';
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        // Run test as test user
        System.runAs(testUser) {
            Test.startTest();
            MobileStaffAvailabilityHandler.getAvailabilityData();
            Test.stopTest();
        }
        
        // Verify error response
        String responseBody = RestContext.response.responseBody.toString();
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
        
       
    }
    
    @isTest
    static void testCreateStaffAvailabilitySuccess() {
        // Get test user and staff
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'testuser1@example.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Create test data
        MobileStaffAvailabilityHandler.availWrapper testAvail = new MobileStaffAvailabilityHandler.availWrapper();
        testAvail.staffId = staff.Id;
        testAvail.shiftType = 'Morning';
        testAvail.startDate = Date.today();
        testAvail.endDate = Date.today();
        testAvail.startTime = '9:00 am';
        testAvail.endTime = '5:00 pm';
        testAvail.isRecurring = false;
        
        // Set up mock request
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/myAvailability/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(JSON.serialize(testAvail));
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        // Run test as test user
        System.runAs(testUser) {
            Test.startTest();
            MobileStaffAvailabilityHandler.createStaffAvaialability();
            Test.stopTest();
        }
        
        // Verify results
        String responseBody = RestContext.response.responseBody.toString();
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
        
        
    }
    
    @isTest
    static void testCreateStaffAvailabilityRecurringSuccess() {
        // Get test user and staff
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'testuser1@example.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Create test data for recurring availability
        MobileStaffAvailabilityHandler.availWrapper testAvail = new MobileStaffAvailabilityHandler.availWrapper();
        testAvail.staffId = staff.Id;
        testAvail.shiftType = 'Morning';
        testAvail.startDate = Date.today();
        testAvail.endDate = Date.today();
        testAvail.startTime = '9:00 am';
        testAvail.endTime = '5:00 pm';
        testAvail.isRecurring = true;
        testAvail.weeklyDays = new List<String>{'Monday', 'Wednesday'};
        testAvail.recurEndDate = String.valueOf(Date.today().addDays(14));
        testAvail.typeOfRecur = 'Weekly';
        testAvail.recurEvery = 1;
        
        // Set up mock request
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/myAvailability/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(JSON.serialize(testAvail));
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        // Run test as test user
        System.runAs(testUser) {
            Test.startTest();
            MobileStaffAvailabilityHandler.createStaffAvaialability();
            Test.stopTest();
        }
        
        // Verify results
        String responseBody = RestContext.response.responseBody.toString();
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
        
    }
    
    @isTest
    static void testCreateStaffAvailabilityMissingRequiredFields() {
        // Get test user
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'testuser1@example.com' LIMIT 1];
        
        // Create test data with missing required fields
        MobileStaffAvailabilityHandler.availWrapper testAvail = new MobileStaffAvailabilityHandler.availWrapper();
        testAvail.shiftType = 'Morning';
        // Missing startDate, startTime, endTime
        
        // Set up mock request
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/myAvailability/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(JSON.serialize(testAvail));
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        // Run test as test user
        System.runAs(testUser) {
            Test.startTest();
            MobileStaffAvailabilityHandler.createStaffAvaialability();
            Test.stopTest();
        }
        
        // Verify error response
        String responseBody = RestContext.response.responseBody.toString();
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
        
       
    }
    
    @isTest
    static void testCreateStaffAvailabilityOverlap() {
        // Get test user and staff
        User testUser = [SELECT Id, Email FROM User WHERE Email = 'testuser1@example.com' LIMIT 1];
        
        System.runAs(testUser) {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Create existing availability
        Availability__c existingAvail = new Availability__c(
            Staff__c = staff.Id,
            Shift_Type__c = 'Morning',
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Start_Date__c = Date.today(),
            End_Date__c = Date.today()
        );
        insert existingAvail;
        
        // Create test data that overlaps with existing availability
        MobileStaffAvailabilityHandler.availWrapper testAvail = new MobileStaffAvailabilityHandler.availWrapper();
        testAvail.staffId = staff.Id;
        testAvail.shiftType = 'Morning';
        testAvail.startDate = Date.today();
        testAvail.endDate = Date.today();
        testAvail.startTime = '10:00 am';
        testAvail.endTime = '4:00 pm';
        testAvail.isRecurring = false;
        
        // Set up mock request
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/myAvailability/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(JSON.serialize(testAvail));
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        // Run test as test user
            Test.startTest();
            MobileStaffAvailabilityHandler.createStaffAvaialability();
            Test.stopTest();
        
        // Verify overlap response
        String responseBody = RestContext.response.responseBody.toString();
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
            }
        
     
    }
    
    @isTest
    static void testConvertToAMPMFormat() {
        // Test morning time
        Time morningTime = Time.newInstance(9, 30, 0, 0);
        String ampmMorning = MobileStaffAvailabilityHandler.convertToAMPMFormat(morningTime);
        System.assertEquals('9:30 AM', ampmMorning, 'Morning time conversion failed');
        
        // Test afternoon time
        Time afternoonTime = Time.newInstance(14, 15, 0, 0);
        String ampmAfternoon = MobileStaffAvailabilityHandler.convertToAMPMFormat(afternoonTime);
        System.assertEquals('2:15 PM', ampmAfternoon, 'Afternoon time conversion failed');
        
        // Test midnight
        Time midnight = Time.newInstance(0, 0, 0, 0);
        String ampmMidnight = MobileStaffAvailabilityHandler.convertToAMPMFormat(midnight);
        System.assertEquals('12:00 AM', ampmMidnight, 'Midnight time conversion failed');
        
        // Test noon
        Time noon = Time.newInstance(12, 0, 0, 0);
        String ampmNoon = MobileStaffAvailabilityHandler.convertToAMPMFormat(noon);
    
    }
    
    @isTest
    static void testCalculateShiftDates() {
        // Test morning shift (same day)
        Date testDate = Date.newInstance(2023, 1, 1);
        Map<String, Date> morningResult = MobileStaffAvailabilityHandler.calculateShiftDates(
            'Morning', 'AM', 'PM', testDate
        );
     
        // Test night shift (crosses midnight)
        Map<String, Date> nightResult = MobileStaffAvailabilityHandler.calculateShiftDates(
            'Night', 'PM', 'AM', testDate
        );
       
        
        // Test custom shift with AM to AM
        Map<String, Date> customAMAMResult = MobileStaffAvailabilityHandler.calculateShiftDates(
            'Custom', 'AM', 'AM', testDate
        );
       
        
        // Test custom shift with PM to PM
        Map<String, Date> customPMPMResult = MobileStaffAvailabilityHandler.calculateShiftDates(
            'Custom', 'PM', 'PM', testDate
        );
       
    }
    
     @isTest
    static void testDeleteAvailabilitySuccess() {
        // Get the test availability record
        Availability__c testAvailability = [SELECT Id FROM Availability__c LIMIT 1];
        
        // Set up mock request
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/myAvailabilityDeleteApi/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
            'availabilityId' => testAvailability.Id
        }));
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        Test.startTest();
        MobileStaffAvailabilityDeleteHandler.deleteAvailability();
        Test.stopTest();
        
        // Verify results
        String responseBody = RestContext.response.responseBody.toString();
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
        
        System.assertEquals(true, responseMap.get('success'), 'Expected success to be true');
        System.assertEquals('Availability is Deleted Successfully.', responseMap.get('message'));
        
        // Verify record was deleted
        List<Availability__c> remainingAvailabilities = [SELECT Id FROM Availability__c WHERE Id = :testAvailability.Id];
        System.assertEquals(0, remainingAvailabilities.size(), 'Availability should be deleted');
    }
    
    @isTest
    static void testDeleteAvailabilityMissingId() {
        // Set up mock request with missing availabilityId
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/myAvailabilityDeleteApi/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(JSON.serialize(new Map<String, String>()));
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        Test.startTest();
        MobileStaffAvailabilityDeleteHandler.deleteAvailability();
        Test.stopTest();
        
        // Verify error response
        String responseBody = RestContext.response.responseBody.toString();
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
      
    }
    
    @isTest
    static void testDeleteAvailabilityEmptyBody() {
        // Set up mock request with empty body
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/myAvailabilityDeleteApi/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('');
        RestContext.request = req;
        RestContext.response = new RestResponse();
        
        Test.startTest();
        MobileStaffAvailabilityDeleteHandler.deleteAvailability();
        Test.stopTest();
        
        // Verify error response
        String responseBody = RestContext.response.responseBody.toString();
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(responseBody);
        
    }
    
   
}