@isTest
public class RosterCreationTestClass {
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.1139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday1139562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.1139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user) { 
        
             Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants4567';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            insert fac;
                        
           Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.1139562@hotmail.com';
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
            insert cli;
                 
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
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
           // funds.Available_Funds__c = 10000;	
            //funds.Spent_Amount__c = 1000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 03, 16);        
            //shift.Direction__c=dire.Id;
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
            insert shift; 
            
            Availability__c availability = new Availability__c(
                Staff__c = staff.Id,
                Shift_Type__c = 'Morning', // Replace with valid picklist value
                Start_Time__c =Time.newInstance( 03, 30, 00, 00),
                End_Time__c = Time.newInstance( 05, 00, 00, 00),
                Start_Date__c =Date.newInstance(2024, 03, 16),
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
            
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c=staff.Id;
            staffs1.Role__c='Admin';
            staffs1.Status__c='Accepted';
            staffs1.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
            staffs1.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
           // staffs.End_Time__c=system.now();
            insert staffs1; 
            
             ShiftwithStaff__c staffs2 = new ShiftwithStaff__c();
            staffs2.Add_Shift__c=shift.Id;
            staffs2.Attendence__c=true;
            staffs2.Comments__c = 'test comments';
            staffs2.Staff__c=staff.Id;
            staffs2.Role__c='Admin';
            staffs2.Status__c='Accepted';
            staffs2.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
            staffs2.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
           // staffs.End_Time__c=system.now();
            insert staffs2; 
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Service_Type__c = NSC.Id;
            services.Qty__c=5;
           // services.Unit_Price__c = 200;
            services.GST__c='No';
            services.Date_of_Service__c = system.today();//Date.newInstance(2024, 10, 16);
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffs1.id;
            insert services;
           
        }
     }
    @isTest
    public static void createAddShiftTest() {
        Test.startTest();
        
        
        // ✅ Insert Test Data (Prevents SOQL errors)
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        System.runAs(testUser) { 
            Client__c clie = [SELECT Id From Client__c LIMIT 1];
            NDIS_Support_Catalogue__c ndis = [SELECT Id From NDIS_Support_Catalogue__c LIMIT 1];
            Funds_Tracker__c fund = [SELECT ID From Funds_Tracker__c LIMIT 1];
             Services_and_Support_Plan__c service = [SELECT ID From Services_and_Support_Plan__c LIMIT 1];
            // Create mock Staff record if it doesn't already exist for testing
            Staff__c staffList = [SELECT Id, Expiry_Date__c, Name__c, Last_Name__c, Role__c 
                                  FROM Staff__c 
                                  WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' 
                                  LIMIT 1];
            list<Id> staffId= new list<Id>();
            staffId.add(staffList.Id);
            
            // Get a sample Facility
            Facility__c facility = [SELECT Id FROM Facility__c where name='Ashfield Consultants4567' LIMIT 1 ];
              List<ShiftwithStaff__c> shiftStaff = [select id,Start_Date__c,Shift_Start_Time__c,Date__c,Start_Time__c,Shift_End_Time__c,Shift_End_Date__c,End_Time__c
                                                    ,End_Date__c,Attendence__c from ShiftwithStaff__c LIMIT 1];
        	List<Funds_Tracker__c> fundsList = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
            List<Add_Shift__c> addList =[SELECT ID, Start_Date__c From Add_Shift__C limit 1];
            
            List<String> fundId = new List<String>();
            for(Funds_Tracker__c funds: fundsList){
                fundId.add(funds.Id);
            }
          
            
            
            // Setup test data
            String startDate = '2021-12-22';
            String endDate = '2021-12-22';
            List<String> weekDays = new List<String>{'Monday', 'Tuesday', 'Wednesday'};
                
                String jsonData = '{"shiftaddress":{"street":"8 Keewong Street","citySuburb":"Crace","country":"AU","provinceState":"ACT","postalcode":"2911"},' +
                '"shiftDetails":{"AddShiftId":null,"AddShiftStartDate":"2021-08-22","AddShiftStaffValue":"' + staffList.Id + '",' +
                '"AddShiftFacilityValue":"' + facility.Id + '","AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":"30",' +
                '"AddShiftDuration":7.5,"AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"9:00 AM","AddShiftEndTime":"17:00:00Z",' +
                '"AddShiftEndTimeAMPM":"5:00 PM","AddShiftStaffHourlyRate":25.41,"AddShiftQuantity":1,"AddShiftNotes":"","AddShiftEOI":false,' +
                '"AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false}}';
            
            String jsonDataService = '[{' +
    '"id":"1738919431399","index":0,"startTime":"09:00:00Z","endTime":"17:00:00Z","duration":7.5,"serviceStffaHourlyRate":26.23,"serviceDate":"2021-08-22",' +
    '"StaffId":"' + staffList.Id + '","shiftWithStaffId":null,"serviceNameValue":"Community Nursing Care","serviceStatusValue":"","state":"ACT","selectedNdisIdValue":null,' +
    '"SplitShift":true,"startTimeAMPM":"9:00 AM","endTimeAMPM":"5:00 PM","serviceSuppoertId":null,"participant":"' + clie.Id + '","serviceTypeId":null,"splitShiftColor":"border-left: 10px solid #008000",' +
    '"LongShiftTimeSlots":"{\\"Morning\\":{\\"id\\":1746724048236,\\"startTime\\":\\"10:00:00Z\\",\\"endTime\\":\\"13:00:00Z\\",\\"hourlyRate\\":\\"50.34\\",\\"rowShiftType\\":\\"Morning\\",\\"startDateTime\\":\\"2025-05-06T04:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-06T07:30:00.000Z\\",\\"duration\\":3,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
    '\\"Afternoon\\":{\\"id\\":1746724071041,\\"startTime\\":\\"13:00:00Z\\",\\"endTime\\":\\"20:00:00Z\\",\\"hourlyRate\\":\\"56.63\\",\\"rowShiftType\\":\\"Afternoon\\",\\"startDateTime\\":\\"2025-05-06T07:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"duration\\":7,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
    '\\"Night\\":{\\"id\\":1746724083201,\\"startTime\\":\\"20:00:00Z\\",\\"endTime\\":\\"06:00:00Z\\",\\"hourlyRate\\":\\"57.89\\",\\"rowShiftType\\":\\"Night\\",\\"startDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-07T00:30:00.000Z\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
    '\\"Morning 2\\":{\\"id\\":1746724083201,\\"startTime\\":\\"20:00:00Z\\",\\"endTime\\":\\"06:00:00Z\\",\\"hourlyRate\\":\\"57.89\\",\\"rowShiftType\\":\\"Night\\",\\"startDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-07T00:30:00.000Z\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
    '\\"Afternoon 2\\":{\\"id\\":1746724083201,\\"startTime\\":\\"20:00:00Z\\",\\"endTime\\":\\"06:00:00Z\\",\\"hourlyRate\\":\\"57.89\\",\\"rowShiftType\\":\\"Night\\",\\"startDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-07T00:30:00.000Z\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
    '\\"Sleepover Shift\\":{\\"id\\":1746724083201,\\"startTime\\":\\"20:00:00Z\\",\\"endTime\\":\\"06:00:00Z\\",\\"hourlyRate\\":\\"57.89\\",\\"rowShiftType\\":\\"Night\\",\\"startDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-07T00:30:00.000Z\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false}}"}]';
            
          String jsonData12 = '{"shiftaddress":{"street":"8 Keewong Street","citySuburb":"Crace","country":"AU","provinceState":"ACT","postalcode":"2911"},' +
                '"shiftDetails":{"AddShiftId":null,"AddShiftStartDate":"2021-09-22","AddShiftStaffValue":"' + staffList.Id + '",' +
                '"AddShiftFacilityValue":"' + facility.Id + '","AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":"30",' +
                '"AddShiftDuration":7.5,"AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"9:00 AM","AddShiftEndTime":"17:00:00Z",' +
                '"AddShiftEndTimeAMPM":"5:00 PM","AddShiftStaffHourlyRate":25.41,"AddShiftQuantity":1,"AddShiftNotes":"","AddShiftEOI":false,' +
                '"AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false}}';
            
                 String jsonDataService12 = '[{' +
    '"id":"1738919431399","index":0,"startTime":"09:00:00Z","endTime":"17:00:00Z","duration":7.5,"serviceStffaHourlyRate":26.23,"serviceDate":"2021-08-22",' +
    '"StaffId":"' + staffList.Id + '","shiftWithStaffId":null,"serviceNameValue":"Community Nursing Care","serviceStatusValue":"","state":"ACT","selectedNdisIdValue":null,' +
    '"SplitShift":true,"startTimeAMPM":"9:00 AM","endTimeAMPM":"5:00 PM","serviceSuppoertId":null,"participant":"' + clie.Id + '","serviceTypeId":null,"splitShiftColor":"border-left: 10px solid #008000",' +
    '"LongShiftTimeSlots":"{\\"Morning\\":{\\"id\\":1746724048236,\\"startTime\\":\\"10:00:00Z\\",\\"endTime\\":\\"13:00:00Z\\",\\"hourlyRate\\":\\"50.34\\",\\"rowShiftType\\":\\"Morning\\",\\"startDateTime\\":\\"2025-05-06T04:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-06T07:30:00.000Z\\",\\"duration\\":3,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
    '\\"Afternoon\\":{\\"id\\":1746724071041,\\"startTime\\":\\"13:00:00Z\\",\\"endTime\\":\\"20:00:00Z\\",\\"hourlyRate\\":\\"56.63\\",\\"rowShiftType\\":\\"Afternoon\\",\\"startDateTime\\":\\"2025-05-06T07:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"duration\\":7,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
    '\\"Night\\":{\\"id\\":1746724083201,\\"startTime\\":\\"20:00:00Z\\",\\"endTime\\":\\"06:00:00Z\\",\\"hourlyRate\\":\\"57.89\\",\\"rowShiftType\\":\\"Night\\",\\"startDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-07T00:30:00.000Z\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
    '\\"Morning 2\\":{\\"id\\":1746724083201,\\"startTime\\":\\"20:00:00Z\\",\\"endTime\\":\\"06:00:00Z\\",\\"hourlyRate\\":\\"57.89\\",\\"rowShiftType\\":\\"Night\\",\\"startDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-07T00:30:00.000Z\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
    '\\"Afternoon 2\\":{\\"id\\":1746724083201,\\"startTime\\":\\"20:00:00Z\\",\\"endTime\\":\\"06:00:00Z\\",\\"hourlyRate\\":\\"57.89\\",\\"rowShiftType\\":\\"Night\\",\\"startDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-07T00:30:00.000Z\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false}}"}]';
            
            String jsonDataCheckList = '[{"id":1738948871561,"index":1,"description":"check bp","mandatory":true},' +
                '{"id":1738948888321,"index":2,"description":"take him walk","mandatory":true}]';
                  List<Date> weekDaysDates = new List<Date>{Date.newInstance(2021,12, 22), Date.newInstance(2021,12, 23), Date.newInstance(2021,12, 23)};
                     List<String> stringIds = new List<String>();
                    for(ShiftwithStaff__c shifts :shiftStaff){
                        stringIds.add(shifts.Id);
                    }
             String jsonDataService3 = '[{' +
    '"id":"1738919431399","index":0,"startTime":"09:00:00Z","endTime":"17:00:00Z","duration":7.5,"serviceStffaHourlyRate":26.23,"serviceDate":"2021-08-22",' +
    '"StaffId":"' + staffList.Id + '","shiftWithStaffId":null,"serviceNameValue":"Community Nursing Care","serviceStatusValue":"","state":"ACT","selectedNdisIdValue":null,' +
    '"SplitShift":true,"startTimeAMPM":"9:00 AM","endTimeAMPM":"5:00 PM","serviceSuppoertId":null,"participant":"' + clie.Id + '","serviceTypeId":null,"splitShiftColor":"border-left: 10px solid #008000",' +
    '"LongShiftTimeSlots":"{\\"Morning\\":{\\"id\\":1746724048236,\\"startTime\\":\\"10:00:00Z\\",\\"endTime\\":\\"13:00:00Z\\",\\"hourlyRate\\":\\"50.34\\",\\"rowShiftType\\":\\"Morning\\",\\"startDateTime\\":\\"2025-05-06T04:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-06T07:30:00.000Z\\",\\"duration\\":3,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false}}}]';
                   
            String longShiftData = '{' +
                '"Morning":{' +
                '"endTimeDdisplayTime":"05:00 PM","endTimeselectedAmPm":false,"endTimeselectedMinute":"00","endTimeselectedHour":"05","startTimdisplayTime":"09:00 AM","startTimeselectedAmPm":true,"startTimeselectedMinute":"00","startTimeselectedHour":"09","calculatedRate":26.23,"holidayName":null,"isHoliday":false,"index":0,"rowOnchangeOccured":false,"hourlyRate":"26.23","endTime":"17:00:00Z","startTime":"09:00:00Z","endAmPm":null,"startAmPm":null,"rateLabel":"Rate","id":"17574377969500.6577435714055486","duration":8,"endDay":"Wednesday","startDay":"Wednesday","isNextDayStart":false,"endDateOnly":"2025-09-24","startDateOnly":"2025-09-24","enddate":"2025-09-24T17:00:00.000+1000","startdate":"2025-09-24T09:00:00.000+1000","rowShiftType":"Morning"},' +
                '"Afternoon":{' +
                '"endTimeDdisplayTime":"09:00 PM","endTimeselectedAmPm":false,"endTimeselectedMinute":"00","endTimeselectedHour":"09","startTimdisplayTime":"05:00 PM","startTimeselectedAmPm":false,"startTimeselectedMinute":"00","startTimeselectedHour":"05","calculatedRate":29.51,"holidayName":null,"isHoliday":false,"index":1,"rowOnchangeOccured":false,"hourlyRate":"29.51","endTime":"21:00:00Z","startTime":"17:00:00Z","endAmPm":null,"startAmPm":null,"rateLabel":"Rate","id":"17574377969500.9074003752743146","duration":4,"endDay":"Wednesday","startDay":"Wednesday","isNextDayStart":false,"endDateOnly":"2025-09-24","startDateOnly":"2025-09-24","enddate":"2025-09-24T21:00:00.000+1000","startdate":"2025-09-24T17:00:00.000+1000","rowShiftType":"Afternoon"},' +
                '"Night":{' +
                '"endTimeDdisplayTime":"02:00 AM","endTimeselectedAmPm":true,"endTimeselectedMinute":"00","endTimeselectedHour":"02","startTimdisplayTime":"09:00 PM","startTimeselectedAmPm":false,"startTimeselectedMinute":"00","startTimeselectedHour":"09","calculatedRate":30.16,"holidayName":null,"isHoliday":false,"index":2,"rowOnchangeOccured":false,"hourlyRate":"30.16","endTime":"02:00:00Z","startTime":"21:00:00Z","endAmPm":null,"startAmPm":null,"rateLabel":"Rate","id":"17574377969500.6870026513747836","duration":5,"endDay":"Thursday","startDay":"Wednesday","isNextDayStart":false,"endDateOnly":"2025-09-25","startDateOnly":"2025-09-24","enddate":"2025-09-25T02:00:00.000+1000","startdate":"2025-09-24T21:00:00.000+1000","rowShiftType":"Night"},' +
                '"Morning 2":{' +
                '"endTimeDdisplayTime":"05:00 AM","endTimeselectedAmPm":true,"endTimeselectedMinute":"00","endTimeselectedHour":"05","startTimdisplayTime":"02:00 AM","startTimeselectedAmPm":true,"startTimeselectedMinute":"00","startTimeselectedHour":"02","calculatedRate":26.23,"holidayName":null,"isHoliday":false,"index":3,"rowOnchangeOccured":false,"hourlyRate":"26.23","endTime":"05:00:00Z","startTime":"02:00:00Z","endAmPm":null,"startAmPm":null,"rateLabel":"Rate","id":"17574377969500.41424479224919597","duration":3,"endDay":"Thursday","startDay":"Thursday","isNextDayStart":true,"endDateOnly":"2025-09-25","startDateOnly":"2025-09-25","enddate":"2025-09-25T05:00:00.000+1000","startdate":"2025-09-25T02:00:00.000+1000","rowShiftType":"Morning"}' +
                '}';
             String longShiftData12 = '{' +
                '"Morning":{' +
                '"endTimeDdisplayTime":"05:00 PM","endTimeselectedAmPm":false,"endTimeselectedMinute":"00","endTimeselectedHour":"05","startTimdisplayTime":"09:00 AM","startTimeselectedAmPm":true,"startTimeselectedMinute":"00","startTimeselectedHour":"09","calculatedRate":26.23,"holidayName":null,"isHoliday":false,"index":0,"rowOnchangeOccured":false,"hourlyRate":"26.23","endTime":"17:00:00Z","startTime":"09:00:00Z","endAmPm":null,"startAmPm":null,"rateLabel":"Rate","id":"17574377969500.6577435714055486","duration":8,"endDay":"Wednesday","startDay":"Wednesday","isNextDayStart":false,"endDateOnly":"2025-09-24","startDateOnly":"2025-09-24","enddate":"2025-09-24T17:00:00.000+1000","startdate":"2025-09-24T09:00:00.000+1000","rowShiftType":"Morning"},' +
                '"Afternoon":{' +
                '"endTimeDdisplayTime":"09:00 PM","endTimeselectedAmPm":false,"endTimeselectedMinute":"00","endTimeselectedHour":"09","startTimdisplayTime":"05:00 PM","startTimeselectedAmPm":false,"startTimeselectedMinute":"00","startTimeselectedHour":"05","calculatedRate":29.51,"holidayName":null,"isHoliday":false,"index":1,"rowOnchangeOccured":false,"hourlyRate":"29.51","endTime":"21:00:00Z","startTime":"17:00:00Z","endAmPm":null,"startAmPm":null,"rateLabel":"Rate","id":"17574377969500.9074003752743146","duration":4,"endDay":"Wednesday","startDay":"Wednesday","isNextDayStart":false,"endDateOnly":"2025-09-24","startDateOnly":"2025-09-24","enddate":"2025-09-24T21:00:00.000+1000","startdate":"2025-09-24T17:00:00.000+1000","rowShiftType":"Afternoon"},' +
                '"Night":{' +
                '"endTimeDdisplayTime":"02:00 AM","endTimeselectedAmPm":true,"endTimeselectedMinute":"00","endTimeselectedHour":"02","startTimdisplayTime":"09:00 PM","startTimeselectedAmPm":false,"startTimeselectedMinute":"00","startTimeselectedHour":"09","calculatedRate":30.16,"holidayName":null,"isHoliday":false,"index":2,"rowOnchangeOccured":false,"hourlyRate":"30.16","endTime":"02:00:00Z","startTime":"21:00:00Z","endAmPm":null,"startAmPm":null,"rateLabel":"Rate","id":"17574377969500.6870026513747836","duration":5,"endDay":"Thursday","startDay":"Wednesday","isNextDayStart":false,"endDateOnly":"2025-09-25","startDateOnly":"2025-09-24","enddate":"2025-09-25T02:00:00.000+1000","startdate":"2025-09-24T21:00:00.000+1000","rowShiftType":"Night"}' +
                '}';

             String jsonPayLoad = '{' +
                '"addShiftData": {' +
                '  "shiftaddress": {' +
                '    "street": "4 Glen Street",' +
                '    "citySuburb": "Eastwood",' +
                '    "country": "Australia",' +
                '    "provinceState": "NSW",' +
                '    "postalcode": "2122",' +
                '    "latitude": -33.7904463,' +
                '    "longitude": 151.0792348' +
                '  },' +
                '  "shiftDetails": {' +
                '    "AddShiftStartDate": "2025-04-17",' +
                '    "AddShiftStaffValue": "' + staffList.Id + '",' +
                '    "AddShiftFacilityValue": "' + facility.Id + '",' +
                '    "AddShiftRole": "AIN",' +
                '    "AddShiftType": "General",' +
                '    "AddShiftBreak": 30,' +
                '    "AddShiftDuration": 8,' +
                '    "AddShiftStartTime": "09:00:00Z",' +
                '    "AddShiftStartTimeAMPM": "09:00 AM",' +
                '    "AddShiftEndTime": "17:00:00Z",' +
                '    "AddShiftEndTimeAMPM": "05:00 PM",' +
                '    "AddShiftnotification": true,' +
                '    "AddShiftStaffHourlyRate": 45,' +
                '    "AddShiftQuantity": 1,' +
                '    "AddShiftNotes": "This is the test shift notes for this shift",' +
                '    "AddShiftEOI": false,' +
                '    "AddShiftId": "",' +
                '    "AddShiftHoliday": false,' +
                '    "AddShiftEnterOtherLocation": false,' +
                '    "AddShiftParticipantAddressCheckbox": false,' +
                '    "AddShiftEndDate": "2025-04-17",' +
                '    "AddShiftTypeName": "a0s9h0000010wUrAAI",' +
                '    "AddShiftStaffName": "",' +
                '    "AddShiftFacilityName": "Tesseract Apps"' +
                '  }' +
                '},' +
                '"staffRows": [' +
                '  {' +
                '    "staffId": "' + staffList.Id + '",' +
                '    "staffLabel": "HR Admin (preferred)",' +
                '    "role": "",' +
                '    "shifttype": "General",' +
                '    "shiftnames": "a0s9h0000010wUrAAI",' +
                '    "starttime": "09:00:00Z",' +
                '    "starttimeAmPm": "09:00 AM",' +
                '    "endtime": "17:00:00Z",' +
                '    "endtimeAmPm": "05:00 PM",' +
                '    "startdate": "2025-04-17",' +
                '    "enddate": "2025-04-18",' +
                '    "recurring": false,' +
                '    "shiftnotes": "This is the test shift notes for this shift",' +
                '    "staffPaidBreak": false,' +
                '   "enableTimeRounding": false,' +
                '    "address": {' +
                '      "street": "4 Glen Street",' +
                '      "citySuburb": "Eastwood",' +
                '      "country": "Australia",' +
                '      "provinceState": "NSW",' +
                '      "postalcode": "2122",' +
                '      "latitude": -33.7904463,' +
                '      "longitude": 151.0792348' +
                '    },' +
                '    "shiftWithStaffId": "",' +
                '    "duration": 7.5,' +
                '    "breakTime": 30,' +
                '    "hourlyRate": 45,' +
                '    "refId": "",' +
                '    "addressSource": "Facility",' +
                '    "participants": [],' +
                '    "services": [' +
                '      {' +
                '        "participantName": "Deepak Korukonda",' +
                '        "participantId": "' + clie.Id + '",' +
                '        "serviceType": "' + fund.Id + '",' +
                '        "serviceTypeName": "Community Nursing Care",' +
                '        "serviceItem": "' + ndis.Id + '",' +
                '        "serviceItemName": "Delivery of Health Supports by an Enrolled Nurse - Weekday Daytime - $99.88",' +
                '        "unitPrice": 0,' +
                '        "billableHours": 7.5,' +
                '        "amount": 0.0,' +
                '        "hourlyRate": 45,' +
                '        "customshiftRefId": "",' +
                '        "starttime": "09:00:00Z",' +
                '        "endtime": "17:00:00Z"' +
                '      }' +
                '    ],' +
                '    "checkList": [' +
                '      {' +
                '        "description": "Take vital signs",' +
                '        "mandatory": true,' +
                '        "isCreatedFromStatic": true,' +
                '        "checkListId": null' +
                '      },' +
                '      {' +
                '        "description": "Administer medications",' +
                '        "mandatory": false,' +
                '        "isCreatedFromStatic": false,' +
                '        "checkListId": null' +
                '      }' +
                '    ]' +
                '  }' +
                '],' +
                '"isSplitShift": false,' +
                '"isGroupShift": false,' +
                '"isCustomShift": false,' +
                '"isRecurringShift": false,' +
                '"includeParticipants": false,' +
                '"isEdit": false,' +
                '"LongShiftTimeSlots": "{' +
                '\\"Afternoon\\":{\\"id\\":1746724048237,\\"starttime\\":\\"13:00:00Z\\",\\"endtime\\":\\"20:00:00Z\\",\\"hourlyrate\\":\\"56.63\\",\\"duration\\":7,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
                '\\"Night\\":{\\"id\\":1746724048238,\\"starttime\\":\\"20:00:00Z\\",\\"endtime\\":\\"06:00:00Z\\",\\"hourlyrate\\":\\"57.89\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":true},' +
                '\\"Sleepover Shift\\":{\\"id\\":1746724048239,\\"starttime\\":\\"22:00:00Z\\",\\"endtime\\":\\"06:00:00Z\\",\\"hourlyrate\\":\\"60.00\\",\\"duration\\":8,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":true},' +
                '\\"Morning 2\\":{\\"id\\":1746724048240,\\"starttime\\":\\"10:30:00Z\\",\\"endtime\\":\\"13:30:00Z\\",\\"hourlyrate\\":\\"51.00\\",\\"duration\\":3,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
                '\\"Afternoon 2\\":{\\"id\\":1746724048241,\\"starttime\\":\\"13:30:00Z\\",\\"endtime\\":\\"20:30:00Z\\",\\"hourlyrate\\":\\"57.00\\",\\"duration\\":7,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false}' +
                '}"' +
            '}';
            
            
           String jsonPayLoad2 = '{' +
                '"addShiftData": {' +
                '  "shiftaddress": {' +
                '    "street": "4 Glen Street",' +
                '    "citySuburb": "Eastwood",' +
                '    "country": "Australia",' +
                '    "provinceState": "NSW",' +
                '    "postalcode": "2122",' +
                '    "latitude": -33.7904463,' +
                '    "longitude": 151.0792348' +
                '  },' +
                '  "shiftDetails": {' +
                '    "AddShiftStartDate": "2025-04-17",' +
                '    "AddShiftStaffValue": "' + staffList.Id + '",' +
                '    "AddShiftFacilityValue": "' + facility.Id + '",' +
                '    "AddShiftRole": "AIN",' +
                '    "AddShiftType": "General",' +
                '    "AddShiftBreak": 30,' +
                '    "AddShiftDuration": 8,' +
                '    "AddShiftStartTime": "09:00:00Z",' +
                '    "AddShiftStartTimeAMPM": "09:00 AM",' +
                '    "AddShiftEndTime": "17:00:00Z",' +
                '    "AddShiftEndTimeAMPM": "05:00 PM",' +
                '    "AddShiftnotification": true,' +
                '    "AddShiftStaffHourlyRate": 45,' +
                '    "AddShiftQuantity": 1,' +
                '    "AddShiftNotes": "This is the test shift notes for this shift",' +
                '    "AddShiftEOI": false,' +
                '    "AddShiftId": "",' +
                '    "AddShiftHoliday": false,' +
                '    "AddShiftEnterOtherLocation": false,' +
                '    "AddShiftParticipantAddressCheckbox": false,' +
                '    "AddShiftEndDate": "2025-04-17",' +
                '    "AddShiftTypeName": "a0s9h0000010wUrAAI",' +
                '    "AddShiftStaffName": "",' +
                '    "AddShiftFacilityName": "Tesseract Apps"' +
                '  }' +
                '},' +
                '"staffRows": [' +
                '  {' +
                '    "staffId": "' + staffList.Id + '",' +
                '    "staffLabel": "HR Admin (preferred)",' +
                '    "role": "",' +
                '    "shifttype": "General",' +
                '    "shiftnames": "a0s9h0000010wUrAAI",' +
                '    "starttime": "09:00:00Z",' +
                '    "starttimeAmPm": "09:00 AM",' +
                '    "endtime": "17:00:00Z",' +
                '    "endtimeAmPm": "05:00 PM",' +
                '    "startdate": "2025-04-17",' +
                '    "enddate": "2025-04-18",' +
                '    "recurring": false,' +
                '    "shiftnotes": "This is the test shift notes for this shift",' +
                '    "staffPaidBreak": false,' +
                '   "enableTimeRounding": false,' +
                '    "address": {' +
                '      "street": "4 Glen Street",' +
                '      "citySuburb": "Eastwood",' +
                '      "country": "Australia",' +
                '      "provinceState": "NSW",' +
                '      "postalcode": "2122",' +
                '      "latitude": -33.7904463,' +
                '      "longitude": 151.0792348' +
                '    },' +
                '    "shiftWithStaffId": "",' +
                '    "duration": 7.5,' +
                '    "breakTime": 30,' +
                '    "hourlyRate": 45,' +
                '    "refId": "",' +
                '    "addressSource": "Facility",' +
                '    "participants": [],' +
                '    "services": [' +
                '      {' +
                '        "participantName": "Deepak Korukonda",' +
                '        "participantId": "' + clie.Id + '",' +
                '        "serviceType": "' + fund.Id + '",' +
                '        "serviceTypeName": "Community Nursing Care",' +
                '        "serviceItem": "' + ndis.Id + '",' +
                '        "serviceItemName": "Delivery of Health Supports by an Enrolled Nurse - Weekday Daytime - $99.88",' +
                '        "unitPrice": 0,' +
                '        "billableHours": 7.5,' +
                '        "amount": 0.0,' +
                '        "hourlyRate": 45,' +
                '        "customshiftRefId": "",' +
                '        "starttime": "09:00:00Z",' +
                '        "endtime": "17:00:00Z"' +
                '      }' +
                '    ],' +
                '    "checkList": [' +
                '      {' +
                '        "description": "Take vital signs",' +
                '        "mandatory": true,' +
                '        "isCreatedFromStatic": true,' +
                '        "checkListId": null' +
                '      },' +
                '      {' +
                '        "description": "Administer medications",' +
                '        "mandatory": false,' +
                '        "isCreatedFromStatic": false,' +
                '        "checkListId": null' +
                '      }' +
                '    ]' +
                '  }' +
                '],' +
                '"isSplitShift": false,' +
                '"isGroupShift": false,' +
                '"isCustomShift": false,' +
                '"isRecurringShift": false,' +
                '"includeParticipants": false,' +
                '"isEdit": false,' +
                '"LongShiftTimeSlots": "{' +
                '\\"Morning\\":{\\"id\\":1746724048237,\\"starttime\\":\\"13:00:00Z\\",\\"endtime\\":\\"20:00:00Z\\",\\"hourlyrate\\":\\"56.63\\",\\"duration\\":7,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
                '\\"Night\\":{\\"id\\":1746724048238,\\"starttime\\":\\"20:00:00Z\\",\\"endtime\\":\\"06:00:00Z\\",\\"hourlyrate\\":\\"57.89\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":true},' +
                '\\"Sleepover Shift\\":{\\"id\\":1746724048239,\\"starttime\\":\\"22:00:00Z\\",\\"endtime\\":\\"06:00:00Z\\",\\"hourlyrate\\":\\"60.00\\",\\"duration\\":8,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":true},' +
                '\\"Morning 2\\":{\\"id\\":1746724048240,\\"starttime\\":\\"10:30:00Z\\",\\"endtime\\":\\"13:30:00Z\\",\\"hourlyrate\\":\\"51.00\\",\\"duration\\":3,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
                '\\"Afternoon 3\\":{\\"id\\":1746724048241,\\"starttime\\":\\"13:30:00Z\\",\\"endtime\\":\\"20:30:00Z\\",\\"hourlyrate\\":\\"57.00\\",\\"duration\\":7,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false}' +
                '}"' +
            '}';
            
             List<Date> recurrenceDates = new List<Date>{
                Date.newInstance(2025, 10, 9),
                Date.newInstance(2025, 10, 10)
            };

                System.runAs(testUser) {
                   // Map<String, Object> response = RosterCreation.createAddShift(jsonData, true, 'Weekly', 2, '2021-12-30', '2021-08-22', new List<String>{'Monday'}, 1, jsonDataService, jsonDataCheckList, FALSE, false,weekDaysDates,TRUE,FALSE);
                 // Map<String, Object> response1 = RosterCreation.createAddShift(jsonData12, TRUE, 'Weekly', 2, '2021-12-22', '2021-09-22', new List<String>{'Monday'}, 1, jsonDataService12, jsonDataCheckList, FALSE, true,weekDaysDates,TRUE, FALSE);
                 //  Map<String, Object> response12 = RosterCreation.createAddShift(jsonData, false, 'Weekly', 2, '2021-11-22', '2021-11-16', new List<String>{'Monday'}, 1, jsonDataService12, jsonDataCheckList, FALSE, FALSE,weekDaysDates, FALSE, TRUE);
                 //  Map<String, Object> responses3 = RosterCreation.createAddShift(jsonData12, FALSE, 'Weekly', 2, '2021-11-22', '2021-11-16',new List<String>{'Monday'}, 1, jsonDataService12, jsonDataCheckList, TRUE, TRUE,weekDaysDates, FALSE,TRUE);
                 //  Map<String, Object> responses4 = RosterCreation.createAddShift(jsonData12, FALSE, 'Weekly', 2, '2021-11-22', '2021-11-16',new List<String>{'Monday'}, 1, jsonDataService3, jsonDataCheckList, TRUE, TRUE,weekDaysDates, TRUE, FALSE);
                   RosterCreation.getFundsData(fundId);
                  // AddShiftController.updateAllocations(stringIds);  
                   // RosterCreation.createUnassignedShift(shiftStaff[0].Id);
                   // RosterCreation.createUnassignedShift(string.valueof(shiftStaff[0].Id),string.valueof(staffList.Id),40,longShiftData,ndis.id);
                   // RosterCreation.createUnassignedShift(string.valueof(shiftStaff[0].Id),string.valueof(staffList.Id),40,longShiftData12,ndis.id);
                  List<Services_and_Support_Plan__c> SS=  RosterCreation.unAssignedList(string.valueof(shiftStaff[0].Id));
                    Id shiftId=shiftStaff[0].Id;
                  Map<Id, Map<Date, String>> validateResult=  RosterCreation.validateStaffAvailabilityWithReasons(staffId,recurrenceDates,'09:00 AM','05:00 PM','true',false,shiftId);
                    DateTime dt=  RosterCreation.getShiftStartDateTime(shiftStaff[0]);
                    DateTime dt1=  RosterCreation.getShiftEndDateTime(shiftStaff[0]);
                    String conflictDates;
                  String RosterOutputData = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates,conflictDates); 
                  String RosterOutputData2 = RosterCreationVersionTwo.createShift(jsonPayLoad2, recurrenceDates,conflictDates);
                }
            
            Test.stopTest();
        }
    }     
}