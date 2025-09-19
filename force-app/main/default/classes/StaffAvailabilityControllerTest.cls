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
            
            Availability__c availability = new Availability__c(
                Staff__c = staff.Id,
                Shift_Type__c = 'Morning', // Replace with valid picklist value
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c = Time.newInstance(17, 0, 0, 0),
                Start_Date__c = Date.today(),
                Role__c = 'Admin'
            );
            insert availability;
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
           // funds.Available_Funds__c = 10000;	
            //funds.Spent_Amount__c = 1000;
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
        Staff__c staffList = [Select Id From Staff__c LIMIT 1];
        Availability__c availabilityList = [Select Id From Availability__c LIMIT 1];
        Client__c clientList = [Select Id From Client__c LIMIT 1];
        Participant_Staff_Association__c PSAList = [Select Id From Participant_Staff_Association__c LIMIT 1];
        NDIS_Support_Catalogue__c NDISSupport = [Select Id From NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c FundTracker = [Select Id From Funds_Tracker__c LIMIT 1];
        String dateStr = '08/05/2025'; // Format: dd/MM/yyyy
        String inputDate = '08/05/2025';
        String timeStr = '9:15 AM';
            
        Test.startTest();
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
        List<Availability__c> getStaffAvailability = StaffAvailabilityController.getStaffAvailability(clientList.Id, String.valueOf(Date.today()));

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
            0
        );
        
        StaffAvailabilityController.saveStaffData(
            availabilityList.Id, '08/05/2025', 'Morning', true, 
            new List<String>{'Monday'}, '8:00 AM', '10:00 PM', staffList.Id, 
            String.valueOf(Date.today().addDays(60)), 'Weekly', 1, 0
        );
        
      /*  StaffAvailabilityController.saveStaffData(
            null, '08/05/2025', 'Morning', true, 
            new List<String>{'Monday'}, '8:00 AM', '10:00 PM', staffList.Id, 
            String.valueOf(Date.today().addDays(60)), 'Weekly', 1, 0
        );*/
        Test.stopTest();
        
              
    }
    
    @isTest
    static void testSaveStaffData_NonRecurring_NewRecord1() {
        User UserList = [Select Id, Email From User Where Email = 'testuser@example.com' LIMIT 1];
        Staff__c staffList = [Select Id From Staff__c LIMIT 1];
        Availability__c availabilityList = [Select Id From Availability__c LIMIT 1];
        Client__c clientList = [Select Id From Client__c LIMIT 1];
        Participant_Staff_Association__c PSAList = [Select Id From Participant_Staff_Association__c LIMIT 1];
        NDIS_Support_Catalogue__c NDISSupport = [Select Id From NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c FundTracker = [Select Id From Funds_Tracker__c LIMIT 1];
        String dateStr = '08/05/2025'; // Format: dd/MM/yyyy
        String inputDate = '08/05/2025';
        String timeStr = '9:15 AM';
        
        List<String> recurrenceDates = new List<String>{
            String.valueOf(Date.today()),
            String.valueOf(Date.today().addDays(3)),
            String.valueOf(Date.today().addDays(7))
        };
        
        Date endDate = Date.today().addDays(30);
        
        Map<String, Object> shiftData = new Map<String, Object>{
            'clientId' => clientList.Id,
            'shiftType' => 'Morning',
            'startTime' => '08:00 AM',
            'endTime' => '12:00 PM',
            'todayDate' => String.valueOf(Date.today()),
            'endDateShift' => String.valueOf(Date.today()),
            'serviceTypeId' => FundTracker.Id,
            'regionState' => 'NSW',
            'catalogId' => NDISSupport.Id,
            'recurringChecked' => true,
            'roleId' => 'Admin',
            'recurEvery' => '1',
            'selectedDays' => new List<Object>{ 'Monday', 'Wednesday' },
            'monthOfDay' => '15',
            'RecurrenceDates' => recurrenceDates,
            'endDate' =>  String.valueOf(endDate),
            'recurringType' => 'Daily',
            'recurEndDate' => String.valueOf(endDate),
            'roleRows' => new List<Object>{
                new Map<String, Object>{
                    'selectedStaff' => staffList.Id, // Replace with valid User or Contact Id if needed
                    'priority' => 'High',
                    'roleId' => 'Nurse'
                }
            }
        };
            
        Test.startTest();
        System.runAs(UserList) {
        	StaffAvailabilityController.saveShiftData(shiftData);
        }
        Test.stopTest();
    }
}