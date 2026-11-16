@IsTest
public class LeaveAccrualFromShiftDurationBatchTest {
    
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
                Last_Name__c = 'Eligible Staff',
                Name = 'Eligible Staff',
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
                Sunday_Hourly_Rate__c = 50,
                Status__c = true,Type_of_Employe__c = 'Full Time Permanent',Personal_Leave_Accur__c = 0,Annual_Leave_Accrued__c = 0
            );
            insert staff;
            
            Staff__c staffs = new Staff__c(
                Last_Name__c = 'No Shift Staff',
                Name = 'No Shift Staff',
                Name__c = 'abcd',
                Contact_Number__c = '56789908743',
                Email_Address__c = 'testuser2@example.com',
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
                Status__c = true,
                Sunday_Hourly_Rate__c = 50,Type_of_Employe__c = 'Part Time Permanent',
                Annual_Leave_Accrued__c = 0,
                Personal_Leave_Accur__c = 0,
                Paid_Break__c = false
            );
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
            insert cli;
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
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
            shift.Start_Date__c = Date.today().addDays(-1);
            shift.End_Date__c= Date.today();
            shift.Role__c='Admin';
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift.End_Time__c=Time.newInstance( 05, 00, 00, 00);
            shift.Facility__c=fac.Id;
            shift.Status__c='Published';
            shift.Start_time_picklist__c='3:30 am';
            shift.End_time_picklist__c='5:00 am';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c='General';
            shift.RefId__c=availability.id;
            shift.Un_Assigned_Shift__c=true;
            insert shift;            
            
            ShiftwithStaff__c staffsshift = new ShiftwithStaff__c();
            staffsshift.Add_Shift__c = shift.Id;
            staffsshift.Attendence__c = true;
            staffsshift.Staff__c = staff.Id;
            staffsshift.Role__c = 'Admin';
            staffsshift.Status__c = 'Accepted';
            staffsshift.Start_Date__c = Date.today().addDays(-1);
            staffsshift.Shift_End_Date__c = Date.today().addDays(-1);
            staffsshift.Staff_Paid_Break__c = false;
            staffsshift.Final_Login_DateTime__c =
                DateTime.newInstance(
                    Date.today().addDays(-1),
                    Time.newInstance(1, 0, 0, 0)
                );
            
            staffsshift.Final_Logout_DateTime__c =
                DateTime.newInstance(
                    Date.today().addDays(-1),
                    Time.newInstance(9, 0, 0, 0)
                );
            
            staffsshift.Extended_Duration__c = 0;
           // staffsshift.Actual_Duration__c = 8;
            
            insert staffsshift;
            
            
            ShiftwithStaff__c staffsshift2 = new ShiftwithStaff__c();
            staffsshift2.Attendence__c = true;
            staffsshift2.Add_Shift__c = shift.Id;
            staffsshift2.Staff_Paid_Break__c = false;
            staffsshift2.Staff__c = staff.Id;
            staffsshift2.Role__c = 'Admin';
            staffsshift2.Status__c = 'Accepted';
            staffsshift2.Start_Date__c = Date.today().addDays(-1);
            staffsshift2.Shift_End_Date__c = Date.today().addDays(-1);
            staffsshift.Final_Login_DateTime__c =
                DateTime.newInstance(
                    Date.today().addDays(-1),
                    Time.newInstance(1, 0, 0, 0)
                );
            
            staffsshift.Final_Logout_DateTime__c =
                DateTime.newInstance(
                    Date.today().addDays(-1),
                    Time.newInstance(9, 0, 0, 0)
                );
            staffsshift2.Extended_Duration__c = 0;
            
            insert staffsshift2;
            
            
            
        }
    }
    
    @IsTest
    static void testLeaveAccrualBatch() {
        
        
        Staff__c accruedStaff = [
            SELECT Annual_Leave_Accrued__c, Personal_Leave_Accur__c
            FROM Staff__c
            WHERE Last_Name__c = 'Eligible Staff'
            LIMIT 1
        ];
        
        Staff__c noShiftStaff = [
            SELECT Annual_Leave_Accrued__c, Personal_Leave_Accur__c
            FROM Staff__c
            WHERE Last_Name__c = 'No Shift Staff'
            LIMIT 1
        ];
        
        Decimal expectedAnnual = 8 * 0.076923; // 0.615384, rounds to 0.62
        Decimal expectedPersonal = 8 * 0.038462; // 0.307696, rounds to 0.31
        Test.startTest();
        Database.executeBatch(new LeaveAccrualFromShiftDurationBatch(), 50);
        Test.stopTest();
        
        
        
    }
    
    
}