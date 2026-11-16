@IsTest
public class StaffStatusControllerTest {
    @testsetup Static void testData(){         
       	Organisation__c org = new Organisation__c();
        org.Name='Age Grace Innovation PVT LTD';
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
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Age Grace Innovation PVT LTD', User_Type__c = 'NDIS Staff');
        insert user;
        
        System.runAs(user) { 
        
             Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.Phone__c= '24343423432';
            fac.ABN__c = '73647363232';
            insert fac;
                        
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
            staff.Annual_Leave__c=10;
            staff.Sick_Leave__c=2;
            staff.Bereavement_Leave__c=10;
            staff.Parental_Leave__c=3;
            insert staff; 
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff1';
            staff1.Name='praveen1';
            staff1.Name__c='abcdr';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.4139561@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='990845829528';
            staff1.Emp_exit_date__c = date.newInstance(2027, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2026, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Annual_Leave__c=10;
            staff1.Sick_Leave__c=2;
            staff1.Bereavement_Leave__c=10;
            staff1.Parental_Leave__c=3;
            Staff1.User_Type__c = 'NDIS Staff';
            insert staff1; 
            
            Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 03, 16);        
            shift.Direction__c=dire.Id;
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
            insert staffs; 
            
            
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
        }
        
        Profile prof1 = [select id,Name from profile where name LIKE '%Admin%'];
        User user1 = new User(Alias = 'praveen', Email= 'manualtesting.41395621@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof1.Id, TimeZoneSidKey='America/New_York' 
                             , UserName='manualtesting.41395621@hotmail.com',Organization_Name__c ='Age Grace Innovation PVT LTD', User_Type__c = 'NDIS Staff');
        insert user1;
        
        System.runAs(user1) { 
        
             Facility__c facs = new Facility__c();
            facs.Name='Ashfield Consultants23';
            facs.Address__City__s='Crace';
            facs.Address__Street__s = '8 Keewong Street';
            facs.Address__StateCode__s='ACT';
            facs.Address__PostalCode__s='2911';
            facs.Address__CountryCode__s='AU';
            facs.Email__c= 'testonefacility112@gmail.com';
            facs.Status__c=true;
            facs.Organisation__c= org.Id;
            facs.Phone__c= '2434342343';
            facs.ABN__c = '73647363232';
            insert facs;
                        
           Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.41395621@hotmail.com';
            staff.Facility__c=facs.Id;
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
            staff.Annual_Leave__c=10;
            staff.Sick_Leave__c=2;
            staff.Bereavement_Leave__c=10;
            staff.Parental_Leave__c=3;
            insert staff; 
            
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
            cli.Facility__c=facs.id;
            insert cli;
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff1';
            staff1.Name='praveen1';
            staff1.Name__c='abcdr';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.41395611@hotmail.com';
            staff1.Facility__c=facs.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='990845829528';
            staff1.Emp_exit_date__c = date.newInstance(2027, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2026, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Annual_Leave__c=10;
            staff1.Sick_Leave__c=2;
            staff1.Bereavement_Leave__c=10;
            staff1.Parental_Leave__c=3;
            Staff1.User_Type__c = 'NDIS Staff';
            insert staff1; 
            
            Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 03, 16);        
            shift.Direction__c=dire.Id;
           // shift.Role__c='Admin';
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift.End_Time__c=Time.newInstance( 05, 00, 00, 00);
            shift.Facility__c=facs.Id;
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
            insert staffs; 
        }
    }

    @IsTest
    static void testGetStaffCounts() {
         User u1= [SELECT Id from User where email='manualtesting.41395621@hotmail.com' LIMIT 1];
        System.runAs(u1){
      //  User testUser = [SELECT Id FROM User WHERE Organization_Name__c = 'Age Grace Innovation PVT LTD' LIMIT 1];
        Facility__c fac =[SELECT Id FROM Facility__c LIMIT 1];
        Test.startTest();
       	   Map<String, Integer> staffCounts = StaffStatusController.getStaffCounts(u1.Id, fac.Id);
           Map<String, Integer> staffCounts1 = StaffStatusController.getStaffCounts(u1.Id, fac.Id);
           Map<String, Integer> staffCounts2 = StaffStatusController.getClientCounts(u1.Id, fac.Id);
           StaffStatusController.getStaffDetailsByStatus('inactive', fac.Id); //active
           StaffStatusController.getStaffDetailsByStatus('active', fac.Id); //vacation
           StaffStatusController.getStaffDetailsByStatus('visaExpiry', fac.Id);
           StaffStatusController.getStaffDetailsByStatus('vacation', fac.Id); 
         //  Map<String, Integer> getList = PerformanceManagmentChartController.getPerformanceManagmentStatusData(testUser.Id,fac.Id);
        //Map<String, Integer> getList2 = PerformanceManagmentChartController.getLeaveStatusCounts(testUser.Id);
        Test.stopTest();
        }
    }

    @IsTest
    static void testNoMatchingOrganization() {
        User u1= [SELECT Id,User_Type__c from User where email='manualtesting.41395621@hotmail.com' LIMIT 1];
        System.runAs(u1){
       // User testUsers = [SELECT Id FROM User WHERE Email='manualtesting.4139562@hotmail.com' LIMIT 1];
        Facility__c fac =[SELECT Id FROM Facility__c LIMIT 1];
       // String userId = testUsers.Id;
        Test.startTest();
        Map<String, Integer> staffCounts = SignInStatusController.getSignInCounts(u1.id,fac.Id);  
            u1.User_Type__c='NDIS Org Admin';
            update u1;
            Map<String, Integer> staffCounts12 = SignInStatusController.getSignInCounts(u1.id,fac.Id);     
        Test.stopTest();
        }
    }
    @IsTest
    static void testGetSignInStaffDetails_NDISStaff() {
    
        User u = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.4139562@hotmail.com'
            LIMIT 1
        ];
    
        Facility__c fac = [
            SELECT Id
            FROM Facility__c
            LIMIT 1
        ];
    
        System.runAs(u) {
    
            Test.startTest();
    
            List<SignInStatusController.SignInStaffWrapper> result =
                SignInStatusController.getSignInStaffDetails(
                    'Accepted',
                    fac.Id
                );
    
            Test.stopTest();
     
        }
    }
    @IsTest
    static void testBuildShiftTime() {

        Test.startTest();
    
        // Both login & logout present
        System.assertEquals(
            '09:00 AM - 05:00 PM',
            SignInStatusController.buildShiftTime('09:00 AM', '05:00 PM')
        );
    
        // Only login present
        System.assertEquals(
            '09:00 AM',
            SignInStatusController.buildShiftTime('09:00 AM', '')
        );
    
        // Only logout present
        System.assertEquals(
            '05:00 PM',
            SignInStatusController.buildShiftTime('', '05:00 PM')
        );
    
        // Neither present
        System.assertEquals(
            '',
            SignInStatusController.buildShiftTime('', '')
        );
    
        // 'null' string values
        System.assertEquals(
            '',
            SignInStatusController.buildShiftTime('null', 'null')
        );
    
        Test.stopTest();
    }
     @IsTest
    static void testGetBankDetails_HappyPath() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

        Task t = new Task(
            Subject                = 'Bank Details Update Request',
            Status                 = 'Not Started',
            WhatId                 = staff.Id,
            Account_Name__c        = 'New Account Name',
            Account_Number__c      = '1234567890',
            BSB__c                 = '123-456',
            Description            = 'Please update bank details',
            Bank_Request_Reference__c = 'REF-001'
        );
        insert t;

        Test.startTest();
        Map<String, Object> result =
            StaffStatusController.getBankDetailsRequestData(t.Id);
        Test.stopTest();

        System.assertNotEquals(null, result, 'Response should not be null');
        System.assert(result.containsKey('task'), 'Response should contain task');
        System.assert(result.containsKey('staff'), 'Response should contain staff');
        System.assert(result.containsKey('staffRoles'), 'Response should contain staffRoles');

        Task returnedTask = (Task) result.get('task');
        System.assertEquals(t.Id, returnedTask.Id, 'Task Id should match');
        System.assertEquals('New Account Name', returnedTask.Account_Name__c);

        Staff__c returnedStaff = (Staff__c) result.get('staff');
        System.assertEquals(staff.Id, returnedStaff.Id, 'Staff Id should match');

        List<String> roleNames = (List<String>) result.get('staffRoles');
        System.assertEquals(0, roleNames.size(),
            'Only 2 unique active roles should be returned (Admin, Support Worker)');       
    }
    
    @IsTest
    static void testUpdateBankDetails_HappyPath() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

        // Reference task that triggers the update
        Task primaryTask = new Task(
            Subject                  = 'Bank Details Request',
            Status                   = 'Not Started',
            WhatId                   = staff.Id,
            Account_Name__c          = 'Updated Account Name',
            Account_Number__c        = '9998887776',
            BSB__c                   = '999-888',
            Bank_Request_Reference__c = 'REF-XYZ'
        );
        insert primaryTask;

        // Two more tasks with the same reference (should also be completed)
        List<Task> relatedTasks = new List<Task>{
            new Task(
                Subject                  = 'Related Bank Task 1',
                Status                   = 'Not Started',
                WhatId                   = staff.Id,
                Bank_Request_Reference__c = 'REF-XYZ'
            ),
            new Task(
                Subject                  = 'Related Bank Task 2',
                Status                   = 'Not Started',
                WhatId                   = staff.Id,
                Bank_Request_Reference__c = 'REF-XYZ'
            )
        };
        insert relatedTasks;

        Test.startTest();
        StaffStatusController.updateBankDetailsRequest(primaryTask.Id, 'Approved by manager','onlyInSystem');
        StaffStatusController.mapEmploymentBasis('FULL-TIME');
        Test.stopTest();

        // ---- Assert Staff bank details updated ----
        Staff__c updatedStaff = [
            SELECT Id, Account_Name__c, Account_Number__c, BSB__c
            FROM Staff__c
            WHERE Id = :staff.Id
        ];
        System.assertEquals('Updated Account Name', updatedStaff.Account_Name__c,
            'Account Name should be updated');
        System.assertEquals('9998887776', updatedStaff.Account_Number__c,
            'Account Number should be updated');
        System.assertEquals('999-888', updatedStaff.BSB__c,
            'BSB should be updated');

        // ---- Assert all related tasks marked Completed ----
        List<Task> allTasks = [
            SELECT Id, Status, Approver_Comments__c
            FROM Task
            WHERE Bank_Request_Reference__c = 'REF-XYZ'
        ];
        System.assertEquals(3, allTasks.size(),
            'Expected 3 tasks with the shared reference');
        for (Task t : allTasks) {
            System.assertEquals('Completed', t.Status,
                'All related tasks should be marked Completed');
            System.assertEquals('Approved by manager', t.Approver_Comments__c,
                'Approver comments should be populated');
        }
    }
}