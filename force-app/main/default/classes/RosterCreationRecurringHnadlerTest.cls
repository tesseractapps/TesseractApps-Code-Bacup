@isTest
public class RosterCreationRecurringHnadlerTest {
    @testsetup Static void testData(){
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants12';
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
                             EmailEncodingKey='UTF-8', LastName='StaffOne612233142', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.612233142@hotmail.com',Organization_Name__c ='Ashfield Consultants12');
        insert user;
        
        System.runAs(user){   
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
            
            List<Staff__c> staffList = new List<Staff__c>();
            
            Integer numRecords = 10; // Change this to the number of records you want to insert
            Integer baseRate = 50;
            Integer finalRate = 150;
            Integer saturdayRate = 120;
            Integer sundayRate = 130;
            Integer publicHolidayRate = 170;
            
            for (Integer i = 0; i <= numRecords; i++) {
                Staff__c staff = new Staff__c();
                
                staff.Last_Name__c = 'Test staff ' + i;
                staff.Name = 'praveen' + i;
                staff.Name__c = 'abcd' + i;
                staff.Contact_Number__c = '5678990874' + i;
                staff.Email_Address__c = 'manualtesting.612233142' + i + '@hotmail.com';
                staff.Facility__c = fac.Id;
                staff.Address__Street__s = '8 Keewong Street';
                staff.Address__City__s = 'Crace';
                staff.Address__StateCode__s = 'ACT';
                staff.Address__PostalCode__s = '2911';
                staff.Emergency_Phone_Number__c = '4567876667' + i;
                staff.Primary_Contact_Name__c = 'Praveen';
                staff.Primary_Contact_Number__c = '990845829' + i;
                staff.Make_Primary_as_Approver__c = true;
                staff.Primary_Contact_Email__c = 'praveenshesham.sp+' + i + '@gmail.com';
                staff.Secondary_Contact_Name__c = 'Maheswari';
                staff.Secondary_Contact_Email__c = 'maheswari.adabala+' + i + '@gmail.com';
                staff.Make_Secondary_as_Approver__c = false;
                staff.Secondary_Contact_Number__c = '9908458295' + i;
                staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
                staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
                staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
                staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
                staff.Role__c = 'Admin';
                staff.Residency_Type__c = 'Australian';
                staff.Expiry_Date__c = date.newInstance(2025, 02, 19);
                staff.Type__c = 'Visa Status';
                staff.Status__c=true;
                
                // Increment rates dynamically
                staff.Working_Hours_Rate__c = baseRate + i;
                staff.Final_Overall_Rate__c = finalRate + i;
                staff.Saturday_Hourly_Rate__c = saturdayRate + i;
                staff.Sunday_Hourly_Rate__c = sundayRate + i;
                staff.Public_holiday_Hourly_Rate__c = publicHolidayRate + i;
                
                staffList.add(staff);
            }
            
            // Bulk insert to optimize performance
            if (!staffList.isEmpty()) {
                insert staffList;
            }

          
        }  
         /* Public_Holiday__c holiday1 = new Public_Holiday__c(
            //Name = 'Australia Day',
            Date__c = Date.today().addDays(5), // Assume this is a recurrence date
            State__c = 'New South Wales',
            Holiday_Name__c = 'Australia Day'
        );

        Public_Holiday__c holiday2 = new Public_Holiday__c(
            //Name = 'Labour Day',
            Date__c = Date.today().addDays(10),
            State__c = 'Victoria',
            Holiday_Name__c = 'Labour Day'
        );

        Public_Holiday__c holiday3 = new Public_Holiday__c(
           // Holiday_Name__c = 'Christmas Day',
            Date__c = Date.today().addDays(5),
            State__c = 'Tasmania',
            Holiday_Name__c = 'Christmas Day'
        );

        Public_Holiday__c holiday4 = new Public_Holiday__c(
            //Name = 'Public Holiday',
            Date__c = Date.today().addDays(5),
            State__c = 'New South Wales',
            Holiday_Name__c = 'Public Holiday'
        );

        insert new List<Public_Holiday__c>{ holiday1, holiday2, holiday3, holiday4 };*/
    }
    
    @isTest
    static void testDailyRecurrence() {
        Test.startTest();
        String typeOfRecur = 'Daily';
        Integer recurEvery = 2;
        String shiftDate = '2024-02-01';
        String endDate = '2024-02-10';
        
        Map<String, Object> result = RosterCreationRecurringHnadler.getNumberOfRecurrences(typeOfRecur, recurEvery, endDate, shiftDate, null, null);
        Test.stopTest();

        // Assert success and the correct number of occurrences
        System.assertEquals(true, result.get('isSuccess'), 'Expected success');
        System.assertEquals(5, result.get('NumberOfOccurrences'), 'Expected 5 daily occurrences');
    }

    @isTest
    static void testWeeklyRecurrence() {
        Test.startTest();
        String typeOfRecur = 'Weekly';
        Integer recurEvery = 1;
        String shiftDate = '2024-02-01';
        String endDate = '2024-02-28';
        List<String> weeklyDays = new List<String>{'Monday', 'Friday'};
        
        Map<String, Object> result = RosterCreationRecurringHnadler.getNumberOfRecurrences(typeOfRecur, recurEvery, endDate, shiftDate, weeklyDays, null);
        Test.stopTest();

        // Assert success and validate occurrences
        System.assertEquals(true, result.get('isSuccess'), 'Expected success');
        List<Date> recurrenceDates = (List<Date>) result.get('RecurrenceDates');
        System.assertNotEquals(0, recurrenceDates.size(), 'Expected at least one weekly recurrence');
    }

    @isTest
    static void testMonthlyRecurrence() {
        User u1= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u1){
             Test.startTest();
        String typeOfRecur = 'Monthly';
        Integer recurEvery = 1;
        String shiftDate = '2024-01-01';
        String endDate = '2024-05-01';
        Integer monthlyDay = 15;
        
         Organisation__c orgs =[SELECT Id,Name, Address__c From Organisation__c LIMIT 1];
		Staff__c staffs = [SELECT Id,Name__c,Last_Name__c,Role__c,Facility_Name__c FROM Staff__c limit 1];
        String staffId = staffs.Id;
       // Public_Holiday__c holiday = [SELECT Id FROM Public_Holiday__c LIMIT 1];
        Map<String, Object> result = RosterCreationRecurringHnadler.getNumberOfRecurrences(typeOfRecur, recurEvery, endDate, shiftDate, null, monthlyDay);
        List<Object> rawList = (List<Object>) result.get('RecurrenceDates');
            List<Date> recurrenceDates1 = new List<Date>();
            for (Object obj : rawList) {
                recurrenceDates1.add((Date) obj);
            }
        //List<Date> recurrenceDates2 = (List<Date>) result.get('RecurrenceDates');
        //Set<Date> recurrenceDateSet = new Set<Date>(recurrenceDates1);
        Map<String, Object> result1 = RosterCreationRecurringHnadler.HolidaysPopup(recurrenceDates1, staffId);
        Test.stopTest();

        // Assert success and correct occurrences
        System.assertEquals(true, result.get('isSuccess'), 'Expected success');
        List<Date> recurrenceDates = (List<Date>) result.get('RecurrenceDates');
        System.assertEquals(4, recurrenceDates.size(), 'Expected 4 monthly occurrences');
        }
       
    }

    @isTest
    static void testInvalidParameters() {
        Test.startTest();

        // Test with missing type of recurrence
        Map<String, Object> result1 = RosterCreationRecurringHnadler.getNumberOfRecurrences('', 1, '2024-02-28', '2024-02-01', null, null);
        System.assertEquals(false, result1.get('isSuccess'), 'Expected failure due to empty typeOfRecur');
        System.assert(result1.get('failureMessage') != null, 'Expected a failure message');

        // Test with start date after end date
        Map<String, Object> result2 = RosterCreationRecurringHnadler.getNumberOfRecurrences('Daily', 1, '2024-01-01', '2024-02-01', null, null);
        System.assertEquals(false, result2.get('isSuccess'), 'Expected failure due to invalid date range');
        System.assert(result2.get('failureMessage') != null, 'Expected a failure message');

        // Test with null recurrence period
        Map<String, Object> result3 = RosterCreationRecurringHnadler.getNumberOfRecurrences('Daily', null, '2024-02-28', '2024-02-01', null, null);
        System.assertEquals(false, result3.get('isSuccess'), 'Expected failure due to null recurEvery');
        System.assert(result3.get('failureMessage') != null, 'Expected a failure message');

        Test.stopTest();
    }

    @isTest
    static void testEdgeCasesForMonthlyRecurrence() {
        Test.startTest();

        // Test when monthly day exceeds the number of days in the month
        Map<String, Object> result = RosterCreationRecurringHnadler.getNumberOfRecurrences('Monthly', 1, '2024-05-01', '2024-01-01', null, 31);
        List<Date> recurrenceDates = (List<Date>) result.get('RecurrenceDates');

        // Ensure the last day of each month is selected where necessary
        System.assertEquals(4, recurrenceDates.size(), 'Expected 4 monthly occurrences');
        System.assertEquals(Date.newInstance(2024, 2, 29), recurrenceDates[1], 'Expected February 29 for leap year');

        Test.stopTest();
    }
}