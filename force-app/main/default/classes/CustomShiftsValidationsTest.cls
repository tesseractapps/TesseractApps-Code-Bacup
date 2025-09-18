@isTest
public class CustomShiftsValidationsTest {
    
    @testSetup
    static void setupData() {
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

        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c='3673232323';
            fac.Phone__c = '123123123';
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
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Module_Names__c = 'Admin';
            staff.Public_holiday_Hourly_Rate__c = 50;
            insert staff; 
        }

        // Public Holiday for validation
        insert new Public_Holiday__c(
            Date__c = Date.today(),
            State__c = 'New South Wales',
            Holiday_Name__c = 'Test Holiday'
        );
    }

    static String buildSegmentJson(String startTime, String endTime) {
        List<Map<String, Object>> segments = new List<Map<String, Object>>();
        segments.add(new Map<String, Object>{
            'rowShiftType' => 'Normal',
            'startTime' => startTime,
            'endTime' => endTime,
            'startAmPm' => 'AM',
            'endAmPm' => 'PM',
            'index' => 0,
            'rateLabel' => 'Normal',
            'id' => 'seg1',
            'startTimeselectedHour' => '09',
            'startTimeselectedMinute' => '00',
            'startTimeselectedAmPm' => 'AM',
            'startTimdisplayTime' => startTime,
            'endTimeselectedHour' => '05',
            'endTimeselectedMinute' => '00',
            'endTimeselectedAmPm' => 'PM',
            'endTimeDdisplayTime' => endTime
        });
        return JSON.serialize(segments);
    }

    @isTest
    static void testValidSegment() {
        Staff__c staff = [SELECT Id,Public_holiday_Hourly_Rate__c,Working_Hours_Rate__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,
                          Afternoon_shift_Hourly_Rate__c, Night_shift_Hourly_Rate__c, Sleepover_Allowance__c FROM Staff__c LIMIT 1];
        User u1= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        Date today = Date.today();
        String segmentsJson = '[{"id":"1753374713763","startTime":"10:00:00Z","endTime":"17:00:00Z","hourlyRate":"39.24","rateLabel":"Rate","rowShiftType":"Morning","startAmPm":"10:00 AM","startTimeselectedHour":"10","startTimeselectedMinute":"00","startTimeselectedAmPm":true,"startTimdisplayTime":"10:00 AM","endTimeselectedHour":"05","endTimeselectedMinute":"00","endTimeselectedAmPm":false,"endTimeDdisplayTime":"05:00 PM","endAmPm":"5:00 PM"},{"id":"1753374741648","startTime":"17:00:00Z","endTime":"22:00:00Z","hourlyRate":"44.15","rowShiftType":"Afternoon","rateLabel":"Rate","startAmPm":"5:00 PM","startTimeselectedHour":"05","startTimeselectedMinute":"00","startTimeselectedAmPm":false,"startTimdisplayTime":"05:00 PM","endTimeselectedHour":"10","endTimeselectedMinute":"00","endTimeselectedAmPm":false,"endTimeDdisplayTime":"10:00 PM","endAmPm":"10:00 PM"},{"id":"1753374756513","startTime":"22:00:00Z","endTime":"02:00:00Z","hourlyRate":"45.13","rowShiftType":"Night","rateLabel":"Rate","startAmPm":"10:00 PM","startTimeselectedHour":"10","startTimeselectedMinute":"00","startTimeselectedAmPm":false,"startTimdisplayTime":"10:00 PM","endTimeselectedHour":"02","endTimeselectedMinute":"00","endTimeselectedAmPm":true,"endTimeDdisplayTime":"02:00 AM","endAmPm":"2:00 AM"},{"id":"1753374783224","startTime":"02:00:00Z","endTime":"06:00:00Z","hourlyRate":"39.24","rowShiftType":"Morning","rateLabel":"Rate","startAmPm":"2:00 AM","startTimeselectedHour":"02","startTimeselectedMinute":"00","startTimeselectedAmPm":true,"startTimdisplayTime":"02:00 AM","endTimeselectedHour":"06","endTimeselectedMinute":"00","endTimeselectedAmPm":true,"endTimeDdisplayTime":"06:00 AM","endAmPm":"6:00 AM"}]';

        Test.startTest();
        System.runAs(u1){
            Decimal rateHoliday = CustomShiftsValidations.calculateHourlyRate(staff, 'Morning', 'Monday', true);
            Decimal rateUnknown = CustomShiftsValidations.calculateHourlyRate(staff, 'Other', 'Wednesday', false);
            Decimal rateSleep = CustomShiftsValidations.calculateHourlyRate(staff, 'Sleepover Shift', 'Wednesday', false);
            Decimal rateNight = CustomShiftsValidations.calculateHourlyRate(staff, 'Night', 'Wednesday', false);
            Decimal rateAfternoon = CustomShiftsValidations.calculateHourlyRate(staff, 'Afternoon', 'Wednesday', false);
            Decimal rateMorning = CustomShiftsValidations.calculateHourlyRate(staff, 'Morning', 'Wednesday', false);
            Decimal rateSunday = CustomShiftsValidations.calculateHourlyRate(staff, 'Afternoon', 'Sunday', false);
            Decimal rateSaturday = CustomShiftsValidations.calculateHourlyRate(staff, 'General', 'Saturday', false);
            CustomShiftsValidations.ValidationResult result = CustomShiftsValidations.validateSegments(
                today, '09:00',
                today, '17:00',
                segmentsJson,
                staff.Id
            );
        }
        Test.stopTest();
    }

    @isTest
    static void testInvalidJson() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        User u1= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        Test.startTest();
        System.runAs(u1){ 
            CustomShiftsValidations.ValidationResult result = CustomShiftsValidations.validateSegments(
                Date.today(), '09:00',
                Date.today(), '17:00',
                '',
                staff.Id
            );
        }
        Test.stopTest();
    }

    @isTest
    static void testFirstSegmentStartMismatch() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        User u1= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        Date today = Date.today();

        String segmentsJson = '[{"id":"1753374713763","startTime":"10:00:00Z","endTime":"17:00:00Z","hourlyRate":"39.24","rateLabel":"Rate","rowShiftType":"Morning","startAmPm":"10:00 AM","startTimeselectedHour":"10","startTimeselectedMinute":"00","startTimeselectedAmPm":true,"startTimdisplayTime":"10:00 AM","endTimeselectedHour":"05","endTimeselectedMinute":"00","endTimeselectedAmPm":false,"endTimeDdisplayTime":"05:00 PM","endAmPm":"5:00 PM"},{"id":"1753374741648","startTime":"17:00:00Z","endTime":"22:00:00Z","hourlyRate":"44.15","rowShiftType":"Afternoon","rateLabel":"Rate","startAmPm":"5:00 PM","startTimeselectedHour":"05","startTimeselectedMinute":"00","startTimeselectedAmPm":false,"startTimdisplayTime":"05:00 PM","endTimeselectedHour":"10","endTimeselectedMinute":"00","endTimeselectedAmPm":false,"endTimeDdisplayTime":"10:00 PM","endAmPm":"10:00 PM"},{"id":"1753374756513","startTime":"22:00:00Z","endTime":"02:00:00Z","hourlyRate":"45.13","rowShiftType":"Night","rateLabel":"Rate","startAmPm":"10:00 PM","startTimeselectedHour":"10","startTimeselectedMinute":"00","startTimeselectedAmPm":false,"startTimdisplayTime":"10:00 PM","endTimeselectedHour":"02","endTimeselectedMinute":"00","endTimeselectedAmPm":true,"endTimeDdisplayTime":"02:00 AM","endAmPm":"2:00 AM"},{"id":"1753374783224","startTime":"02:00:00Z","endTime":"06:00:00Z","hourlyRate":"39.24","rowShiftType":"Morning","rateLabel":"Rate","startAmPm":"2:00 AM","startTimeselectedHour":"02","startTimeselectedMinute":"00","startTimeselectedAmPm":true,"startTimdisplayTime":"02:00 AM","endTimeselectedHour":"06","endTimeselectedMinute":"00","endTimeselectedAmPm":true,"endTimeDdisplayTime":"06:00 AM","endAmPm":"6:00 AM"}]';

        Test.startTest();
        System.runAs(u1){ 
            CustomShiftsValidations.ValidationResult result = CustomShiftsValidations.validateSegments(
                today, '09:00',
                today, '17:00',
                segmentsJson,
                staff.Id
            );
        }
        Test.stopTest();
    }

    @isTest
    static void testFinalSegmentMismatch() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        User u1= [SELECT Id from User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        Date today = Date.today();

        // End time is 16:00 instead of 17:00
        String enrichedSegmentsJson = '[{"endTimeDdisplayTime":"05:00 PM","endTimeselectedAmPm":false,"endTimeselectedMinute":"00","endTimeselectedHour":"05","startTimdisplayTime":"10:00 AM","startTimeselectedAmPm":true,"startTimeselectedMinute":"00","startTimeselectedHour":"10","calculatedRate":39.24,"holidayName":null,"isHoliday":false,"index":null,"hourlyRate":"39.24","endTime":"17:00:00Z","startTime":"10:00:00Z","endAmPm":"5:00 PM","startAmPm":"10:00 AM","rateLabel":"Rate","id":"1753374713763","duration":7,"endDay":"Tuesday","startDay":"Tuesday","isNextDayStart":false,"endDateOnly":"2025-07-22","startDateOnly":"2025-07-22","enddate":"2025-07-22T17:00:00.000+1000","startdate":"2025-07-22T10:00:00.000+1000","rowShiftType":"Morning"},{"endTimeDdisplayTime":"10:00 PM","endTimeselectedAmPm":false,"endTimeselectedMinute":"00","endTimeselectedHour":"10","startTimdisplayTime":"05:00 PM","startTimeselectedAmPm":false,"startTimeselectedMinute":"00","startTimeselectedHour":"05","calculatedRate":44.15,"holidayName":null,"isHoliday":false,"index":null,"hourlyRate":"44.15","endTime":"22:00:00Z","startTime":"17:00:00Z","endAmPm":"10:00 PM","startAmPm":"5:00 PM","rateLabel":"Rate","id":"1753374741648","duration":5,"endDay":"Tuesday","startDay":"Tuesday","isNextDayStart":false,"endDateOnly":"2025-07-22","startDateOnly":"2025-07-22","enddate":"2025-07-22T22:00:00.000+1000","startdate":"2025-07-22T17:00:00.000+1000","rowShiftType":"Afternoon"},{"endTimeDdisplayTime":"06:00 AM","endTimeselectedAmPm":true,"endTimeselectedMinute":"00","endTimeselectedHour":"06","startTimdisplayTime":"10:00 PM","startTimeselectedAmPm":false,"startTimeselectedMinute":"00","startTimeselectedHour":"10","calculatedRate":45.13,"holidayName":null,"isHoliday":false,"index":null,"hourlyRate":"45.13","endTime":"06:00:00Z","startTime":"22:00:00Z","endAmPm":"6:00 AM","startAmPm":"10:00 PM","rateLabel":"Rate","id":"1753376054239","duration":8,"endDay":"Wednesday","startDay":"Tuesday","isNextDayStart":false,"endDateOnly":"2025-07-23","startDateOnly":"2025-07-22","enddate":"2025-07-23T06:00:00.000+1000","startdate":"2025-07-22T22:00:00.000+1000","rowShiftType":"Night"}]';

        Test.startTest();
        System.runAs(u1){ 
            CustomShiftsValidations.ValidationResult result = CustomShiftsValidations.validateSegments(
                today, '09:00',
                today, '17:00',
                enrichedSegmentsJson,
                staff.Id
            );
        }
        Test.stopTest();
    }
    
    @isTest
    static void testSegmentGap() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        User u1= [SELECT Id FROM User where email='manualtesting.20294637@hotmail.com' LIMIT 1];
        Date today = Date.today();
        String segmentsJson = '[{"id":"1","startTime":"10:00:00Z","endTime":"11:00:00Z","rowShiftType":"Morning"},' +
                              '{"id":"2","startTime":"12:00:00Z","endTime":"14:00:00Z","rowShiftType":"Morning"}]';
    
        Test.startTest();
        System.runAs(u1){
            CustomShiftsValidations.ValidationResult result = CustomShiftsValidations.validateSegments(
                today, '10:00',
                today, '14:00',
                segmentsJson,
                staff.Id
            );
            System.assertEquals(false, result.isValid, 'Gap between segments should be invalid');
            System.assert(result.errorMessage.contains('gap'), 'Error should mention gap');
        }
        Test.stopTest();
    }


}