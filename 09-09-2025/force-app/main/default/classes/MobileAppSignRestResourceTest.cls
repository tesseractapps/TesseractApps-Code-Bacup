@istest
private class MobileAppSignRestResourceTest {
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
        org.General_Shift_End_time__c='6:30 am';
        org.General_Shift_Start_Time__c='8:30 am';
        org.Afternoon_Shift_End_Time__c='3:30 pm';
        org.Afternoon_Shift_Start_Time__c='4:00 pm';
        org.Custom_Shift_Start_Time__c='6:30 am';
        org.Custom_Shift_End_Time__c='8:30 am';
        org.Night_Shift_End_Time__c='6:30 pm';
         org.Night_Shift_Start_Time__c='8:30 pm';
         org.User_Type__c='NDIS Org Admin';
        insert org;
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.21962238@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test nagendra208628', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.21962238@hotmail.com',Organization_Name__c ='Ashfield Consultants',User_Type__c='NDIS Org Admin');
        insert user;
        System.runAs(user) { 
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Email__c= 'testfacility@gmail.com';
            fac.Organisation__c= org.Id;
            fac.Status__c=true;
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            insert fac;
            
          Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.21962238@hotmail.com';
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
            
            Add_Shift__c shift= new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2023, 12, 13);        
            shift.Role__c='Admin';
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_time_picklist__c='4:30 pm';
            shift.End_time_picklist__c='6:30 pm';
            shift.Date__c = date.newInstance(2023, 12, 13);
            shift.Start_Time__c= Time.newInstance(16, 30, 00, 00);
            shift.End_Time__c= Time.newInstance(18, 30, 30, 00);
            shift.Facility__c=fac.Id;
            shift.Status__c='Draft';
            shift.Location__Street__s='8 Keewong Street';
            shift.Location__City__s = 'Crace';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c='General';
            insert shift;
            
            ShiftwithStaff__c shiftWithStaff= new ShiftwithStaff__c();
            shiftWithStaff.Staff__c=staff.id;
            shiftWithStaff.Add_Shift__c=shift.id;
            shiftWithStaff.Attendence__c=True;
           // shiftWithStaff.Enable_Sign_In__c=false;
            insert shiftWithStaff; 
            
          Advertisement__c adrecord =new Advertisement__c();
            adrecord.Facility_Name__c = fac.id;
            adrecord.Start_Date__c = system.today();
            adrecord.End_Date__c = System.today().addDays(30);
            adrecord.Job_description__c ='job description';
            adrecord.Job_Title__c='job title';
            adrecord.Location__c='New South Wales';
            adrecord.Roles_and_Responsibilities__c = 'roles';
            //adrecord.User__c=userId;
            adrecord.Contract_type__c ='Full time';
            insert adrecord;
            
           /* Allocation__c alocRec=new Allocation__c();
            alocRec.End_Date__c=date.newInstance(2023, 12, 13);
            alocRec.Start_Date__c=date.newInstance(2023, 12, 13);
            alocRec.Working_Hours__c=2;
            alocRec.Staff__c=staff.id;
            insert alocRec;  */
        }
    }
    @isTest static void shiftListMethod() { 
        string datevalue='2023-12-13';
        RestRequest request = new RestRequest();
        request.requestUri ='https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/ShiftwithStaff__c/'+datevalue;
        request.httpMethod = 'GET';
        RestContext.request = request;
        list<ShiftwithStaff__c> shiftList=MobileAppSignRestResource.doGet();
        List<ShiftwithStaff__c> allocatedShift= mobileAppMyAllocatedShifts.doGet();
      
        
    }
    @isTest static void signInSignOutMethod(){ 
        ShiftwithStaff__c shiftList= [select id from ShiftwithStaff__c limit 1];
        string dateValue='2023-12-13';
        string loginTime='16:15';
        string logouttime='18:15';
        string feedBack='this is a test classs';
        string signature='<html><body><p>Sample signature </p></body></html>';
        string role='Doctor';
        string shiftNotes='test notes';
        string result= MobileAppSignRestResource.doPost(loginTime, shiftList.id, logOutTime,feedBack,signature,role,shiftNotes,'4:30','','');
        string result2=MobileAppSignRestResource.doPost('', shiftList.id, logOutTime,feedBack,signature,role,shiftNotes,'4:30','','');
        string result3=MobileAppSignRestResource.doPost('', shiftList.id,'',feedBack,signature,role,shiftNotes,'4:30','','');
       
       // string result3=MobileAppSignRestResource.doPatch(logOutTime,shiftList.id); 
    }
    @isTest static void MobileAdminStaffChanges() { 
          User u4= [SELECT Id from User where email='manualtesting.21962238@hotmail.com' LIMIT 1];
        System.runAs(u4){
             Add_Shift__c adsShift = [SELECT Id,Date__C,Quantity__c,Allocated__c,Un_Allocated__c,Start_Date__c,Name,
                                     End_Date__c,Start_Time__c,End_Time__c,Facility_Name__c,Break__c,Break_Time__c,Shift_Start_End_Time__c,Location__Street__s 
                                     from Add_Shift__c limit 1];
            system.debug('shift list '+adsShift);
            string shiftId=adsShift.id;
            RestRequest request = new RestRequest();
            request.requestUri ='https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/staffChanges'+shiftId;
            request.addParameter('shiftid', shiftId);
                // Assign the request and response objects
            RestContext.request = request;
            request.httpMethod = 'GET';
            RestContext.request = request;
            List<Staff__c> staffList=MobileAdminStaffChanges.doGet();
            
            ShiftwithStaff__c shiftList= [select id from ShiftwithStaff__c limit 1];
			Staff__c staffID=[select id from staff__c limit 1];
            RestRequest postRequest = new RestRequest();
            postRequest.httpMethod = 'POST';  // Set method to POST
           	postRequest.requestBody = Blob.valueOf('[{"shiftwithstaffid":"' + shiftList.Id + '","updstfid":"' + staffID.Id + '"}]');
            RestContext.request = postRequest;
            
            // Call the doPost() method
            String res = MobileAdminStaffChanges.doPost();
            
            RestRequest enableSignInRequest = new RestRequest();
            enableSignInRequest.requestUri = '/services/apexrest/EnableSignInApi/' + shiftList.Id;
            enableSignInRequest.httpMethod = 'GET';
            enableSignInRequest.params.put('shiftId', shiftList.Id);
            
            RestResponse enableSignInResponse = new RestResponse();
            
            RestContext.request = enableSignInRequest;
            RestContext.response = enableSignInResponse;
            
            // Call the GET method to test EnableSignIn API
            MobileAppSignEnableRest.enableSignInButton();   
           
        }
        
    }
    @isTest 
    static void testEnableSignIn_MissingShiftId() {
          User u4= [SELECT Id from User where email='manualtesting.21962238@hotmail.com' LIMIT 1];
        System.runAs(u4){ 
             RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/EnableSignInApi/';
        req.httpMethod = 'GET';
        req.addParameter('shiftId', ''); 
        RestContext.request = req;
        RestContext.response = new RestResponse();

        MobileAppSignEnableRest.enableSignInButton();
        }
    }
    
     @isTest
    static void mobileRoasterAdminTestOne() {
        // Set the current user context
        User testUser = [SELECT Id from User where email='manualtesting.21962238@hotmail.com' LIMIT 1];
        System.runAs(testUser) {
            // Set up the request parameters
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/roasterAdminDetails';

            // Assign the request and response objects
            RestContext.request = req;
            RestContext.response = res;

            // Call the method
            Map<String, Map<String, List<String>>> result = MobileRoasterAdmin.doGet();

        }
    }
     @isTest
    static void testEnableSignIn_InvalidShiftId() {
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/EnableSignInApi/';
        req.httpMethod = 'GET';
        req.addParameter('shiftId', 'a1Dxxxxxxxxxxxx'); 
        RestContext.request = req;
        RestContext.response = new RestResponse();

        MobileAppSignEnableRest.enableSignInButton();

        String response = RestContext.response.responseBody.toString();
    }
    
     @isTest
    static void testEnableSignIn_ExceptionHandling() {
        // Create a dummy ShiftwithStaff__c record, but simulate error in task insert
       User testUser = [SELECT Id from User where email='manualtesting.21962238@hotmail.com' LIMIT 1];
        System.runAs(testUser) {
         ShiftwithStaff__c shiftList= [select id from ShiftwithStaff__c limit 1];

        Test.startTest();
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/EnableSignInApi/';
        req.httpMethod = 'GET';
        req.addParameter('shiftId',  shiftList.Id); 
        RestContext.request = req;
        RestContext.response = new RestResponse();

        // Injecting fault: inserting duplicate task in advance to cause an insert error
        Task t = new Task(
            Subject = 'Enable Sign in for Shift',
            Status = 'New',
            Priority = 'Normal',
            OwnerId = testUser.Id,
            WhatId = shiftList.Id,
            ActivityDate = system.today()
        );
        insert t;

        // Use Limits to simulate exception if needed (or mock failure if you use mocks)
        MobileAppSignEnableRest.enableSignInButton();
        Test.stopTest();
        }
       }
    
     @isTest
    static void mobileRoasterAdminTestTwo() {
        // Set the current user context
        User testUser = [SELECT Id from User where email='manualtesting.21962238@hotmail.com' LIMIT 1];
        System.runAs(testUser) {
            MobileRoasterAdmin.responseWrapper wrapper = new MobileRoasterAdmin.responseWrapper();
            wrapper.Quantity = 10;
            wrapper.Role = 'Admin';
            wrapper.StartDate =date.newInstance(2024, 07, 24);
            wrapper.Starttime = '08:00 am';
            wrapper.Endtime = '04:00 pm';
            wrapper.Notify = true;
            wrapper.eoi = false;
            wrapper.facID = [SELECT Id FROM Facility__c LIMIT 1].Id;
            wrapper.Street = '8 Keewong Street';
            wrapper.City = 'Crace';
            wrapper.State = 'ACT';
            wrapper.PostalCode = '2911';
            wrapper.isOtherLoc=false;
            wrapper.ShiftType='General';

            // Serialize the wrapper object to JSON
            String jsonString = JSON.serialize(new List<MobileRoasterAdmin.responseWrapper> { wrapper });

            // Set up the request parameters
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/roasterAdminDetails';
            req.httpMethod = 'POST';
            req.requestBody = Blob.valueOf(jsonString);

            // Assign the request and response objects
            RestContext.request = req;
            RestContext.response = res;

            // Call the method
            String response = MobileRoasterAdmin.doPost();

        }
    }
    
     @isTest
    static void MobileRoasterAdminShiftStaffTestOne() {
        // Set the current user context
        User testUser = [SELECT Id from User where email='manualtesting.21962238@hotmail.com' LIMIT 1];
        System.runAs(testUser) {
            // Set up the request parameters
            String staff = 'Test praveen1';
            List<String> statusList = new List<String>{'Accepted'};
            String role = 'Admin';
            String startDate = string.valueof(Date.newInstance(2023, 12, 13));
            String facility = [SELECT Name FROM Facility__c LIMIT 1].Name;

            // Call the method
            List<Add_Shift__c> result = MobileRoasterAdminShiftStaff.doPost(staff, statusList, role, startDate, facility);

        }
    }
    
     @isTest
    static void MobileRoasterAdminShiftStaffTestTwo() {
        // Set the current user context
        User testUser = [SELECT Id from User where email='manualtesting.21962238@hotmail.com' LIMIT 1];
        System.runAs(testUser) {
            // Set up the request parameters
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/roasterAdminShiftStaffDetails';
            req.addParameter('Role', 'Admin');
            req.addParameter('strtdt', '2024-07-24');
            req.addParameter('strttim', '08:00');
            req.addParameter('endtim', '16:00');
            req.addParameter('isEoi', 'false');
            req.addParameter('shiftid', [SELECT Id FROM Add_Shift__c LIMIT 1].Id);

            // Assign the request and response objects
            RestContext.request = req;
            RestContext.response = res;

            // Call the method
        // List<MobileRoasterAdminShiftStaff.StaffWrapper> result = MobileRoasterAdminShiftStaff.doGet();

        }
    }
    
     @isTest
    static void mobileRosterCreation() {
        // Set the current user context
        User testUser = [SELECT Id from User where email='manualtesting.21962238@hotmail.com' LIMIT 1];
        System.runAs(testUser) {
            // Set up the request parameters
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/rosterCreation';

            // Assign the request and response objects
            RestContext.request = req;
            RestContext.response = res;

            // Call the method
           
            user u =[select id from user limit 1];
            facility__c tes= [select id from facility__c limit 1];
              HrHomeHandler.fetchFacilitiess();
             Map<String, List<String>> result = MobileAppRoasterCreation.getRosterTimings();
             HrHomeHandler.userDetials();
            HrHomeHandler.getEmployeeData();
             HrHomeHandler.getJobAds();
            HrHomeHandler.createJobAds('job title','job description','Full time',string.valueof(tes.id),'New South Wales','roles',string.valueof(u.id), String.valueOf(System.today()),String.valueOf(System.today().addDays(30)));
            
             RestRequest req1 = new RestRequest();
            RestResponse res1 = new RestResponse();
            req1.requestURI = '/services/apexrest/IssueRegisterFacility';
			list<MobileIssueRegisterFacility.facilityWrapper> facilityResponse=MobileIssueRegisterFacility.getfacilityList();
            
            RestRequest req2 = new RestRequest();
            RestResponse res2 = new RestResponse();
            req2.requestURI = '/services/apexrest/IssueRegisterStaffList';
			list<MobileIssueRegisterStaff.staffWrapper>staffResponse=MobileIssueRegisterStaff.getfacilityList();
            
            RestRequest req3 = new RestRequest();
            RestResponse res3 = new RestResponse();
            req3.requestURI = '/services/apexrest/IssueRegisterStaffRoleApi';
			Map<String, List<String>> staffRole=MobileIssueRegisterStaffRole.getStaffRoleApi();
            
            RestRequest req4 = new RestRequest();
            RestResponse res4 = new RestResponse();
            req4.requestURI = '/services/apexrest/getLoggedinStaffDetails';
            MobileMyProfileApi.Staffwrapper currentStaff=MobileMyProfileApi.getStaffbyEmailId();
            
            RestRequest req5 = new RestRequest();
            req5.requestUri = '/services/apexrest/fetchAllUsers/';
            req5.httpMethod = 'GET';
            
            RestResponse res5 = new RestResponse();
            RestContext.request = req5;
            RestContext.response = res5;
            
           
            
            // Call the method
            Test.startTest();
            MobileAppAllUserList.getAllUsers();
           string result1= FirebaseUserInt.getAllUsers();
            Test.stopTest();
            
        }
    }
    
     @isTest
    static void mobileRosterCreationGetTimings() { 
		  Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4458855@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test nagendra4458855', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4458855@hotmail.com',Organization_Name__c ='Ashfield Consultants',User_Type__c='NDIS Staff');
        insert user;
  			System.runAs(user) { 
                 facility__c tes= [select id from facility__c limit 1];
                  Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4458855@hotmail.com';
            staff.Facility__c=tes.Id;
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
            
					 RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/rosterCreation';

            // Assign the request and response objects
            RestContext.request = req;
            RestContext.response = res;           
    
             Map<String, List<String>> result = MobileAppRoasterCreation.getRosterTimings();
            }
	}
    
}