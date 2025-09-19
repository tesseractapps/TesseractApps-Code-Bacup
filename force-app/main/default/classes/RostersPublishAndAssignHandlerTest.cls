@isTest
public class RostersPublishAndAssignHandlerTest {
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.612233142@hotmail.com', 
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
            
             Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2027, 04, 29);  
            shift.End_Date__c =Date.newInstance(2027, 04, 29);  
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
            insert shift;
            
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staffList[0].Id;
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
           // staffs.End_Time__c=system.now();
            insert staffs;
            
            
            
        }        
    }
    
    @isTest
    public static void createAddShiftTest() {
        // Setup user for running the test
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.612233142@hotmail.com' LIMIT 1];
        Staff__c staff = [SELECT Id From Staff__c LIMIT 1];
      
        
        System.runAs(use) {   
            // Get a sample Facility
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
           
            
            
            String jsonData = '{"shiftaddress":{"street":"8 Keewong Street","citySuburb":"Crace","country":"AU","provinceState":"ACT","postalcode":"2911"},' +
                '"shiftDetails":{"AddShiftId":null,"AddShiftStartDate":"2027-04-30","AddShiftStaffValue":"null",' +
                '"AddShiftFacilityValue":"' + facility.Id + '","AddShiftRole":"Admin","AddShiftType":"General","AddShiftBreak":"30",' +
                '"AddShiftDuration":7.5,"AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"9:00 AM","AddShiftEndTime":"17:00:00Z",' +
                '"AddShiftEndTimeAMPM":"5:00 PM","AddShiftStaffHourlyRate":25.41,"AddShiftQuantity":2,"AddShiftNotes":"","AddShiftEOI":false,' +
                '"AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false}}';
            String jsonData1 = '{"shiftaddress":{"street":"8 Keewong Street","citySuburb":"Crace","country":"AU","provinceState":"ACT","postalcode":"2911"},' +
                '"shiftDetails":{"AddShiftId":null,"AddShiftStartDate":"2027-04-30","AddShiftStaffValue":"null",' +
                '"AddShiftFacilityValue":"' + facility.Id + '","AddShiftRole":"Admin","AddShiftType":"Afternoon","AddShiftBreak":"30",' +
                '"AddShiftDuration":7.5,"AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"9:00 AM","AddShiftEndTime":"17:00:00Z",' +
                '"AddShiftEndTimeAMPM":"5:00 PM","AddShiftStaffHourlyRate":25.41,"AddShiftQuantity":2,"AddShiftNotes":"","AddShiftEOI":false,' +
                '"AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false}}';
            String Year = '2024';
            String Month = '10';
            String Day = '16';
            String start_date = Year + '-' + Month + '-' + Day; 
            
            String Year1 = '2024';
            String Month1 = '10';
            String Day1 = '16';
            String end_date = Year1 + '-' + Month1 + '-' + Day1; 
            
            Test.startTest();
            
            Map<String, Object> responses5 = RostersPublishAndAssignHandler.rosterPublish(jsonData,start_date,end_date); 
            Map<String, Object> responses6 = RostersPublishAndAssignHandler.rosterPublish(jsonData1,start_date,end_date);
          //  List<ShiftwithStaff__c> listShift = RostersPublishAndAssignHandler.getMultipleShiftsdata('2027-04-30', staff.Id);
            boolean fatigueInfo= RosterCreation.getFatigueData(staff.id, '6:30 am', '2027-04-30');
           // RostersPublishAndAssignHandler.updateUnAssignedShifts(start_date, end_date);
          //  RostersPublishAndAssignHandler.finalPublishShifts(start_date, end_date);
            Test.stopTest();
        }
        
    }
}