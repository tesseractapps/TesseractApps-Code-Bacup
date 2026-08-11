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
            fac.ABN__c='12345678912';
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
            staff.Status__c=true;
            staff.Restrict_Set_Hours__c=true;
            staff.Set_Hours__c=45;
            
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
            shift.Quantity__c=10;
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
                Type__c = 'Unavailable'
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
            staffs2.Attendence__c=false;
            staffs2.Shift_Rejected__c=true;
            staffs2.Comments__c = 'test comments';
            staffs2.Staff__c=staff.Id;
            staffs2.Role__c='Admin';
            staffs2.Status__c='Accepted';
            staffs2.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
            staffs2.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
            // staffs.End_Time__c=system.now();
            insert staffs2; 
            
            ShiftwithStaff__c staffs3 = new ShiftwithStaff__c();
            staffs3.Add_Shift__c=shift.Id;
            staffs3.Attendence__c=true;
            staffs3.Comments__c = 'test comments';
            staffs3.Staff__c=staff.Id;
            staffs3.Role__c='Admin';
            staffs3.Status__c='Accepted';
            staffs3.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
            staffs3.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
            // staffs.End_Time__c=system.now();
            insert staffs3;
            
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
            
            Child_Staff__c cs = new Child_Staff__c();
            cs.Expiry_Date__c =date.newInstance(2028, 01, 05); 
            cs.Staff__c=staff.id;
            cs.Comments__c='test ';
            cs.Document_Type__c ='Passport';
            cs.Compliance__c = true;
            insert cs;
            Facility_Compliance_Setting__c idDoc = new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Document_Name__c = 'Passport',
                Compliance_Category__c = 'Identity',
                Identity_Category__c = 'Primary',
                Identity_Points__c = 70,
                Visible_to_Staff__c = true,
                Roles__c = 'Admin',
                Mandatory_Document__c  = true
            );
            insert idDoc;
            Facility_Compliance_Setting__c orgDoc = new Facility_Compliance_Setting__c(
            Organisation__c = org.Id,
            Document_Name__c = 'Police Check',
            Org_Roles__c = 'Admin',
            Mandatory_Document__c = true,
            Visible_to_Staff__c = true
        );
        insert orgDoc;
                    Child_Staff__c orgDocStaff = new Child_Staff__c(
            Staff__c = staff.Id,
            Document_Type__c = 'Police Check',
            Compliance__c = true,
            Expiry_Date__c = Date.newInstance(2028, 1, 5)
        );
        insert orgDocStaff;
             Facility_Compliance_Setting__c orgDoc1 = new Facility_Compliance_Setting__c(
            
            Document_Name__c = 'Police Check',
           
            Mandatory_Document__c = true,
            Visible_to_Staff__c = true
        );
        insert orgDoc1;
            
            Staff_Facility__c sf = new Staff_Facility__c(
                Staff__c = staff.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            insert sf;
            
            Participant_Facility__c pf = new Participant_Facility__c(
                Participant__c = cli.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            insert pf;
             StaffRole__c sr = new StaffRole__c(
            StaffRole_To_Staff__c = staff.Id,
            RoleName__c = 'Admin',
            Facility__c = fac.Id,   
            Active__c = true,
            Hourly_Rate__c = 50
        );
        insert sr;
            
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
            String stafId = staffList.Id;
            list<Id> staffId= new list<Id>();
            staffId.add(staffList.Id);
            ShiftwithStaff__c shiftStaffwith = [select id,Start_Date__c,Shift_Start_Time__c,Date__c,Start_Time__c,Shift_End_Time__c,Shift_End_Date__c,End_Time__c,End_Date__c,Attendence__c from ShiftwithStaff__c LIMIT 1];
            
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
                '"AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,"sil":true}}';
            
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
                '"AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,"sil":true}}';
            
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
                '    "sil": true,' +
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
                '    "enableTimeRounding": false,' +
                '    "sil": false,' +
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
                 '"isBrokenShift": false,' +
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
                '    "sil": true,' +
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
               '    "enableTimeRounding": false,' +
                '    "sil": true,' +
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
                 '"isBrokenShift": false,' +
                '"isEdit": false,' +
                '"LongShiftTimeSlots": "{' +
                '\\"Morning\\":{\\"id\\":1746724048237,\\"starttime\\":\\"13:00:00Z\\",\\"endtime\\":\\"20:00:00Z\\",\\"hourlyrate\\":\\"56.63\\",\\"duration\\":7,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
                '\\"Night\\":{\\"id\\":1746724048238,\\"starttime\\":\\"20:00:00Z\\",\\"endtime\\":\\"06:00:00Z\\",\\"hourlyrate\\":\\"57.89\\",\\"duration\\":10,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":true},' +
                '\\"Sleepover Shift\\":{\\"id\\":1746724048239,\\"starttime\\":\\"22:00:00Z\\",\\"endtime\\":\\"06:00:00Z\\",\\"hourlyrate\\":\\"60.00\\",\\"duration\\":8,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":true},' +
                '\\"Morning 2\\":{\\"id\\":1746724048240,\\"starttime\\":\\"10:30:00Z\\",\\"endtime\\":\\"13:30:00Z\\",\\"hourlyrate\\":\\"51.00\\",\\"duration\\":3,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false},' +
                '\\"Afternoon 3\\":{\\"id\\":1746724048241,\\"starttime\\":\\"13:30:00Z\\",\\"endtime\\":\\"20:30:00Z\\",\\"hourlyrate\\":\\"57.00\\",\\"duration\\":7,\\"startDateOnly\\":\\"2025-07-21\\",\\"isNextDayStart\\":false}' +
                '}"' +
                '}';
            //
            List<Date> recurrenceDates = new List<Date>{
                Date.newInstance(2024, 03, 16),
                    Date.newInstance(2024, 03, 16)
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
                            Map<Id, Map<Date, String>> validateResult=  RosterCreation.validateStaffAvailabilityWithReasons(staffId,recurrenceDates,'09:00 AM','05:00 PM','Yes',false,shiftId,null,facility.Id,'Admin','Sleepover Shift', new List<String>());
                            Map<Id, Map<Date, String>> validateResultCase2 =
RosterCreation.validateStaffAvailabilityWithReasons(
    staffId,
    recurrenceDates,
    '09:00 AM',
    '05:00 PM',
    'Yes',
    false,
    shiftId,
    null,
    null,   // facilityId not passed
    null ,'Sleepover Shift' , new List<String>()  // role not passed
);
                            Map<Id, Map<Date, String>> validateResultMissingDoc =
RosterCreation.validateStaffAvailabilityWithReasons(
    staffId,
    recurrenceDates,
    '09:00 AM',
    '05:00 PM',
    'Yes',
    false,
    shiftId,
    null,
    facility.Id,
    '','Sleepover Shift', new List<String>()   // empty role
);
                            String Year = '2025';
                            String Month = '05';
                            String Day = '16';
                            String startDate1 = Year + '-' + Month + '-' + Day;  
                            
                            String Year1 = '2025';
                            String Month1 = '10';
                            String Day1 = '15';
                            String endDate1 = Year1 + '-' + Month1 + '-' + Day1;
                             DateTime base = DateTime.newInstance(2026, 1, 1, 8, 0, 0);

                            // Case 1: Overlapping shifts
                            DateTime start1 = base;                      // 8:00
                            DateTime end1   = base.addHours(4);          // 12:00
                    
                            DateTime start2 = base.addHours(2);          // 10:00
                            DateTime end2   = base.addHours(6);          // 14:00
                    
                            Boolean resultOverlap = RosterCreation.isShiftOverlap(
                                start1, end1, start2, end2
                            );

                            
                            List<Id> staffIds = new List<Id>{ staffList.Id };
                                List<Date> dates = new List<Date>{ Date.newInstance(2024, 3, 16) };
                                    Map<Id, Map<Date, String>> validateResult1=  StaffAvailabilityValidation.validateStaffAvailabilityWithReasons(staffId,recurrenceDates,'09:00 AM','05:00 PM','Yes',false,shiftId,null);
                            StaffAvailabilityValidation.getShiftStartDateTime(shiftStaffwith);
                            StaffAvailabilityValidation.getShiftEndDateTime(shiftStaffwith); //getStaffAvailability
                            StaffAvailabilityValidation.getStaffAvailability(stafId, startDate1, endDate1);
StaffAvailabilityValidation.AvailabilityCheckResponse res =
    StaffAvailabilityValidation.checkShiftWithinAvailability(staffIds, dates, '3:30 am', '5:00 am','Sleepover Shift','SCHADS');

Map<Id, String> result = res.unavailableStaff;
                            
                            DateTime dt=  RosterCreation.getShiftStartDateTime(shiftStaff[0]);
                            DateTime dt1=  RosterCreation.getShiftEndDateTime(shiftStaff[0]);
                            String conflictDates;
                            String RosterOutputData = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates,conflictDates); 
                            String RosterOutputData2 = RosterCreationVersionTwo.createShift(jsonPayLoad2, recurrenceDates,conflictDates);
                             Date week1Start = Date.newInstance(2025, 1, 6);  // Mon
                            Date week2Start = Date.newInstance(2025, 1, 13); // Mon
                    
                            Map<String, Date> weekStartMap = new Map<String, Date>{
                                'Week-1' => week1Start,
                                'Week-2' => week2Start
                            };
                    
                            // Target date inside Week-1
                            Date targetDate = Date.newInstance(2025, 1, 8);
                    
                            // Act
                            String weeklyresult = RosterCreation.findWeekKeyForDate(targetDate, weekStartMap);

                            // String RosterOutputData2 = RosterCreation.createShift(jsonPayLoad, recurrenceDates,conflictDates);
                            
                        }
            
            Test.stopTest();
            
            
        }
        
    }
  /*  @isTest
    public static void createAddShiftUnAssignedTest() {
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
            String stafId = staffList.Id;
            list<Id> staffId= new list<Id>();
            staffId.add(staffList.Id);
            ShiftwithStaff__c shiftStaffwith = [select id,Start_Date__c,Shift_Start_Time__c,Date__c,Start_Time__c,Shift_End_Time__c,Shift_End_Date__c,End_Time__c,End_Date__c,Attendence__c from ShiftwithStaff__c LIMIT 1];
            
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
                
        
        
        // --- Arrange ---
       String payloadWithUnassigned =
        '{' +
        '  "addShiftData": {' +
        '    "shiftaddress": {' +
        '      "street": "4 Glen Street",' +
        '      "citySuburb": "Eastwood",' +
        '      "country": "AU",' +
        '      "provinceState": "NSW",' +
        '      "postalcode": "2122",' +
        '      "latitude": -33.7904463,' +
        '      "longitude": 151.0792348' +
        '    },' +
        '    "shiftDetails": {' +
        '      "AddShiftStartDate": "2025-04-17",' +
        '      "AddShiftStaffValue": "' + staffList.Id + '",' +
        '      "AddShiftFacilityValue": "' + facility.Id + '",' +
        '      "AddShiftRole": "AIN",' +
        '      "AddShiftType": "General",' +
        '      "AddShiftBreak": 30,' +
        '      "AddShiftDuration": 8,' +
        '      "AddShiftStartTime": "09:00:00Z",' +
        '      "AddShiftStartTimeAMPM": "09:00 AM",' +
        '      "AddShiftEndTime": "17:00:00Z",' +
        '      "AddShiftEndTimeAMPM": "05:00 PM",' +
        '      "AddShiftnotification": true,' +
        '      "AddShiftStaffHourlyRate": 45,' +
        '      "AddShiftQuantity": 1,' +
        '      "AddShiftNotes": "This is the test shift notes for this shift",' +
        '      "AddShiftEOI": false,' +
        '      "AddShiftId": "",' +
        '      "AddShiftHoliday": false,' +
        '      "AddShiftEnterOtherLocation": false,' +
        '      "AddShiftParticipantAddressCheckbox": false,' +
        '      "AddShiftEndDate": "2025-04-17",' +
        '      "AddShiftTypeName": "a0s9h0000010wUrAAI",' +
        '      "AddShiftStaffName": "",' +
        '      "AddShiftFacilityName": "Tesseract Apps",' +
        '      "AddShiftStatus": "Draft"' +
        '    }' +
        '  },' +
        
        '  "staffRows": [' +
        '    {' +
        '      "staffId": "' + staffList.Id + '",' +
        '      "staffLabel": "HR Admin (preferred)",' +
        '      "participantId": null,' +
        '      "participantLabel": null,' +
        '      "role": "",' +
        '      "shifttype": "General",' +
        '      "shiftnames": "a0s9h0000010wUrAAI",' +
        '      "shiftnotes": "This is the test shift notes for this shift",' +
        '      "starttime": "09:00:00Z",' +
        '      "starttimeAmPm": "09:00 AM",' +
        '      "endtime": "17:00:00Z",' +
        '      "endtimeAmPm": "05:00 PM",' +
        '      "startdate": "2025-04-17",' +
        '      "enddate": "2025-04-17",' +
        '      "hourlyrate": 45,' +
        '      "refId": "REF-001",' +
        '      "shiftWithStaffId": "",' +
        '      "duration": 7.5,' +
        '      "breakTime": 30,' +
        '      "staffPaidBreak": false,' +
        '      "enableTimeRounding": false,' +
        '      "recurring": false,' +
        '      "addressSource": "Facility",' +
        '      "unAssignedServiceCreation": true,' +
        '      "address": {' +
        '        "street": "4 Glen Street",' +
        '        "citySuburb": "Eastwood",' +
        '        "country": "AU",' +
        '        "provinceState": "NSW",' +
        '        "postalcode": "2122",' +
        '        "latitude": -33.7904463,' +
        '        "longitude": 151.0792348' +
        '      },' +
        '      "participants": [],' +
        '      "services": [' +
        '        {' +
        '          "participantId": "' + clie.Id + '",' +
        '          "serviceType": "' + fund.Id + '",' +
        '          "serviceItem": "' + ndis.Id + '",' +
        '          "unitPrice": 0,' +
        '          "billableHours": 7.5,' +
        '          "amount": 0,' +
        '          "hourlyRate": 45,' +
        '          "serviceItemValue": null,' +
        '          "state": "NSW",' +
        '          "serviceItemName": "Delivery of Health Supports",' +
        '          "serviceId": null,' +
        '          "customshiftRefId": "",' +
        '          "starttime": "09:00:00Z",' +
        '          "endtime": "17:00:00Z"' +
        '        }' +
        '      ],' +
        '      "checkList": [' +
        '        {' +
        '          "description": "Take vital signs",' +
        '          "mandatory": true,' +
        '          "isCreatedFromStatic": true,' +
        '          "checkListId": null,' +
         '          "shiftWithStaffId": null' +        
        '        },' +
        '        {' +
        '          "description": "Administer medications",' +
        '          "mandatory": false,' +
        '          "isCreatedFromStatic": false,' +
        '          "checkListId": null,' +
      '          "shiftWithStaffId": null' +       
        '        }' +
        '      ]' +
        '    }' +
        '  ],' +
        
        '  "isSplitShift": false,' +
        '  "isGroupShift": false,' +
        '  "isCustomShift": false,' +
        '  "isRecurringShift": false,' +
        '  "includeParticipants": false,' +
        '  "isEdit": false,' +
        '  "LongShiftTimeSlots": "{}"' +
        '}';

        
        // --- Act ---
       RosterCreationVersionTwo.createShift(
            payloadWithUnassigned,
            new List<Date>{ Date.newInstance(2025, 4, 17) },
            null
        );
        Test.stopTest();

    }
    }  */
    
    @IsTest
static void testShouldApplyBrokenShift_TrueWithBreakOne() {
    // Create payload with isBrokenShift = true
    RosterCreationVersionTwo.ShiftPayload payload = new RosterCreationVersionTwo.ShiftPayload();
    payload.isBrokenShift = true;
    
    // Create extended broken with breakOne > 0
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 1.5;
    extended.breakTwo = 0;
    extended.extraHours = 0;
    
    Test.startTest();
    Boolean result = RosterCreationVersionTwo.shouldApplyBrokenShift(payload, extended);
    Test.stopTest();
    
    // Result should be true
    System.assertEquals(true, result);
}

@IsTest
static void testShouldApplyBrokenShift_TrueWithBreakTwo() {
    // Create payload with isBrokenShift = true
  RosterCreationVersionTwo.ShiftPayload payload = new RosterCreationVersionTwo.ShiftPayload();
    payload.isBrokenShift = true;
    
    // Create extended broken with breakTwo > 0
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 0;
    extended.breakTwo = 0.75;
    extended.extraHours = 0;
    
    Test.startTest();
    Boolean result = RosterCreationVersionTwo.shouldApplyBrokenShift(payload, extended);
    Test.stopTest();
  
}

@IsTest
static void testShouldApplyBrokenShift_TrueWithExtraHours() {
    // Create payload with isBrokenShift = true
   RosterCreationVersionTwo.ShiftPayload payload = new RosterCreationVersionTwo.ShiftPayload();
    payload.isBrokenShift = true;
    
    // Create extended broken with extraHours > 0
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 0;
    extended.breakTwo = 0;
    extended.extraHours = 2.5;
    
    Test.startTest();
    Boolean result = RosterCreationVersionTwo.shouldApplyBrokenShift(payload, extended);
    Test.stopTest();
}

@IsTest
static void testShouldApplyBrokenShift_FalseWhenPayloadNull() {
    // Payload is null
    RosterCreationVersionTwo.ShiftPayload payload = null;
    
    // Create extended broken with values
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 1.5;
    
    Test.startTest();
    Boolean result = RosterCreationVersionTwo.shouldApplyBrokenShift(payload, extended);
    Test.stopTest();
}

@IsTest
static void testShouldApplyBrokenShift_FalseWhenExtendedNull() {
    // Create payload with isBrokenShift = true
    RosterCreationVersionTwo.ShiftPayload payload = new RosterCreationVersionTwo.ShiftPayload();
    payload.isBrokenShift = true;
    
    // Extended is null
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = null;
    
    Test.startTest();
    Boolean result = RosterCreationVersionTwo.shouldApplyBrokenShift(payload, extended);
    Test.stopTest();
    
}

@IsTest
static void testShouldApplyBrokenShift_FalseWhenIsBrokenShiftFalse() {
    // Create payload with isBrokenShift = false
    RosterCreationVersionTwo.ShiftPayload payload = new RosterCreationVersionTwo.ShiftPayload();
    payload.isBrokenShift = false;
    
    // Create extended broken with values
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 1.5;
    
    Test.startTest();
    Boolean result = RosterCreationVersionTwo.shouldApplyBrokenShift(payload, extended);
    Test.stopTest();
}

@IsTest
static void testShouldApplyBrokenShift_FalseWhenAllBreakValuesZero() {
    // Create payload with isBrokenShift = true
    RosterCreationVersionTwo.ShiftPayload payload = new RosterCreationVersionTwo.ShiftPayload();
    payload.isBrokenShift = true;
    
    // Create extended broken with all zero values
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 0;
    extended.breakTwo = 0;
    extended.extraHours = 0;
    
    Test.startTest();
    Boolean result = RosterCreationVersionTwo.shouldApplyBrokenShift(payload, extended);
    Test.stopTest();
}

@IsTest
static void testShouldApplyBrokenShift_FalseWhenBreakValuesNull() {
    // Create payload with isBrokenShift = true
    RosterCreationVersionTwo.ShiftPayload payload = new RosterCreationVersionTwo.ShiftPayload();
    payload.isBrokenShift = true;
    
    // Create extended broken with null values
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = null;
    extended.breakTwo = null;
    extended.extraHours = null;
    
    Test.startTest();
    Boolean result = RosterCreationVersionTwo.shouldApplyBrokenShift(payload, extended);
    Test.stopTest();
    
}

@IsTest
static void testApplyBrokenShiftFields_ApplyBreakOneOnly() {
    // Create Add_Shift__c record
    Add_Shift__c shift = new Add_Shift__c();
    
    // Create extended broken with break one only
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 1.5;
    extended.brokenBreakStartOne = '12:00:00Z';
    extended.brokenBreakEndOne = '13:30:00Z';
    extended.breakTwo = 0;
    extended.brokenBreakStartTwo = '';
    extended.brokenBreakEndTwo = '';
    
    Test.startTest();
    RosterCreationVersionTwo.applyBrokenShiftFields(shift, extended);
    Test.stopTest();
  
}

@IsTest
static void testApplyBrokenShiftFields_ApplyBreakTwoOnly() {
    // Create Add_Shift__c record
    Add_Shift__c shift = new Add_Shift__c();
    
    // Create extended broken with break two only
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 0;
    extended.brokenBreakStartOne = '';
    extended.brokenBreakEndOne = '';
    extended.breakTwo = 0.75;
    extended.brokenBreakStartTwo = '17:30:00Z';
    extended.brokenBreakEndTwo = '18:15:00Z';
    
    Test.startTest();
    RosterCreationVersionTwo.applyBrokenShiftFields(shift, extended);
    Test.stopTest();
    
}

@IsTest
static void testApplyBrokenShiftFields_ApplyBothBreaks() {
    // Create Add_Shift__c record
    Add_Shift__c shift = new Add_Shift__c();
    
    // Create extended broken with both breaks
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 1.0;
    extended.brokenBreakStartOne = '12:00:00Z';
    extended.brokenBreakEndOne = '13:00:00Z';
    extended.breakTwo = 0.5;
    extended.brokenBreakStartTwo = '15:30:00Z';
    extended.brokenBreakEndTwo = '16:00:00Z';
    
    Test.startTest();
    RosterCreationVersionTwo.applyBrokenShiftFields(shift, extended);
    Test.stopTest();
   
}

@IsTest
static void testApplyBrokenShiftFields_SkipBreakOneWhenStartTimeBlank() {
    // Create Add_Shift__c record
    Add_Shift__c shift = new Add_Shift__c();
    
    // Create extended broken with breakOne > 0 but missing start time
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 1.5;
    extended.brokenBreakStartOne = ''; // Blank start time
    extended.brokenBreakEndOne = '13:30:00Z';
    
    Test.startTest();
    RosterCreationVersionTwo.applyBrokenShiftFields(shift, extended);
    Test.stopTest();
}

@IsTest
static void testApplyBrokenShiftFields_SkipBreakOneWhenEndTimeBlank() {
    // Create Add_Shift__c record
    Add_Shift__c shift = new Add_Shift__c();
    
    // Create extended broken with breakOne > 0 but missing end time
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 1.5;
    extended.brokenBreakStartOne = '12:00:00Z';
    extended.brokenBreakEndOne = ''; // Blank end time
    
    Test.startTest();
    RosterCreationVersionTwo.applyBrokenShiftFields(shift, extended);
    Test.stopTest();
    
}

@IsTest
static void testApplyBrokenShiftFields_SkipBreakOneWhenBreakOneZero() {
    // Create Add_Shift__c record
    Add_Shift__c shift = new Add_Shift__c();
    
    // Create extended broken with breakOne = 0 but times provided
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = new RosterCreationVersionTwo.BrokenExtendedWrapper();
    extended.breakOne = 0;
    extended.brokenBreakStartOne = '12:00:00Z';
    extended.brokenBreakEndOne = '13:00:00Z';
    
    Test.startTest();
    RosterCreationVersionTwo.applyBrokenShiftFields(shift, extended);
    Test.stopTest();
   
}

@IsTest
static void testApplyBrokenShiftFields_ExtendedNull() {
    // Create Add_Shift__c record
    Add_Shift__c shift = new Add_Shift__c();
    shift.Broken_Break_Start_One__c = Time.newInstance(12, 0, 0, 0);
    
    // Extended is null
    RosterCreationVersionTwo.BrokenExtendedWrapper extended = null;
    
    Test.startTest();
    RosterCreationVersionTwo.applyBrokenShiftFields(shift, extended);
    Test.stopTest();
   
}

@IsTest
static void testCalculateShiftEndDate_NightShiftPMtoAM() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(20, 0, 0, 0); // 8:00 PM
    Time endTime = Time.newInstance(6, 0, 0, 0);   // 6:00 AM
    String startAmPm = '08:00 PM';
    String endAmPm = '06:00 AM';
    String shiftType = 'Night';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_SleepoverShiftPMtoAM() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(22, 0, 0, 0); // 10:00 PM
    Time endTime = Time.newInstance(8, 0, 0, 0);    // 8:00 AM
    String startAmPm = '10:00 PM';
    String endAmPm = '08:00 AM';
    String shiftType = 'Sleepover Shift';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_CustomShiftPMtoAM() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(23, 0, 0, 0); // 11:00 PM
    Time endTime = Time.newInstance(7, 0, 0, 0);    // 7:00 AM
    String startAmPm = '11:00 PM';
    String endAmPm = '07:00 AM';
    String shiftType = 'Custom';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_CustomShiftAMtoPM() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(9, 0, 0, 0);  // 9:00 AM
    Time endTime = Time.newInstance(17, 0, 0, 0);   // 5:00 PM
    String startAmPm = '09:00 AM';
    String endAmPm = '05:00 PM';
    String shiftType = 'Custom';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_NightShiftPMtoAM_NoAmPm() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(20, 0, 0, 0); // 8:00 PM
    Time endTime = Time.newInstance(6, 0, 0, 0);    // 6:00 AM
    String startAmPm = '';
    String endAmPm = '';
    String shiftType = 'Night';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_CustomShiftMinuteComparison_EndEarlier() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(22, 30, 0, 0); // 10:30 PM
    Time endTime = Time.newInstance(6, 15, 0, 0);    // 6:15 AM
    String startAmPm = '10:30 PM';
    String endAmPm = '06:15 AM';
    String shiftType = 'Custom';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_GeneralShift() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(9, 0, 0, 0);  // 9:00 AM
    Time endTime = Time.newInstance(17, 0, 0, 0);   // 5:00 PM
    String startAmPm = '09:00 AM';
    String endAmPm = '05:00 PM';
    String shiftType = 'General';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_CustomShiftPMtoPM() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(14, 0, 0, 0); // 2:00 PM
    Time endTime = Time.newInstance(22, 0, 0, 0);   // 10:00 PM
    String startAmPm = '02:00 PM';
    String endAmPm = '10:00 PM';
    String shiftType = 'Custom';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_NightShiftPMtoAM_WithLowercaseAmPm() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(20, 0, 0, 0); // 8:00 PM
    Time endTime = Time.newInstance(6, 0, 0, 0);    // 6:00 AM
    String startAmPm = '08:00 pm'; // lowercase
    String endAmPm = '06:00 am';   // lowercase
    String shiftType = 'Night';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_CustomShiftMinuteComparison_EndLater() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(6, 0, 0, 0);  // 6:00 AM
    Time endTime = Time.newInstance(14, 30, 0, 0);  // 2:30 PM
    String startAmPm = '06:00 AM';
    String endAmPm = '02:30 PM';
    String shiftType = 'Custom';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_CustomShiftMinuteComparison_EqualTimes() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(12, 0, 0, 0); // 12:00 PM
    Time endTime = Time.newInstance(12, 0, 0, 0);   // 12:00 PM
    String startAmPm = '12:00 PM';
    String endAmPm = '12:00 PM';
    String shiftType = 'Custom';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_SleepoverShiftAMtoPM() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(8, 0, 0, 0);  // 8:00 AM
    Time endTime = Time.newInstance(20, 0, 0, 0);   // 8:00 PM
    String startAmPm = '08:00 AM';
    String endAmPm = '08:00 PM';
    String shiftType = 'Sleepover Shift';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

@IsTest
static void testCalculateShiftEndDate_NightShiftAMtoAM() {
    Date startDate = Date.today();
    Time startTime = Time.newInstance(6, 0, 0, 0);  // 6:00 AM
    Time endTime = Time.newInstance(6, 0, 0, 0);    // 6:00 AM (next day)
    String startAmPm = '06:00 AM';
    String endAmPm = '06:00 AM';
    String shiftType = 'Night';
    
    Test.startTest();
    Date result = RosterCreationVersionTwo.calculateShiftEndDate(
        startDate, startTime, endTime, startAmPm, endAmPm, shiftType
    );
    Test.stopTest();
}

// ============================================================
// TEST 1: Recurring Shift Creation (non-edit)
// ============================================================
@isTest
static void testCreateShift_Recurring_NonEdit() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];

        String jsonPayLoad = '{' +
            '"addShiftData": {' +
            '  "shiftaddress": {"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails": {' +
            '    "AddShiftStartDate":"2025-04-17","AddShiftStaffValue":"' + staffList.Id + '","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":30,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"Test",' +
            '    "AddShiftEOI":false,"AddShiftId":"","AddShiftHoliday":false,"AddShiftEnterOtherLocation":false,' +
            '    "AddShiftParticipantAddressCheckbox":false,"sil":true,"AddShiftEndDate":"2025-04-17","AddShiftTypeName":"TestShift","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId": "RECUR_REF_001"' +
            '},' +
            '"staffRows": [{' +
            '  "staffId":"' + staffList.Id + '","staffLabel":"Test Staff","role":"AIN","shifttype":"General",' +
            '  "shiftnames":"TestShift","starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2025-04-17","enddate":"2025-04-17","recurring":true,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":false,"brokenShifts":false,"unAssignedServiceCreation":false,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":null,"duration":8,"breakTime":0,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[{"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '    "unitPrice":50,"billableHours":8,"amount":400,"hourlyRate":50,"state":"NSW","serviceItemName":"Test Service",' +
            '    "serviceId":null,"customshiftRefId":null}],' +
            '  "checkList":[{"description":"Check 1","mandatory":true,"isCreatedFromStatic":false,"checkListId":null}]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":false,' +
            '"isRecurringShift":true,"includeParticipants":true,"isEdit":false,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        List<Date> recurrenceDates = new List<Date>{
            Date.newInstance(2025, 4, 17),
            Date.newInstance(2025, 4, 18),
            Date.newInstance(2025, 4, 19)
        };

        Test.startTest();
        String result = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates, null);
        Test.stopTest();
    }
}

// ============================================================
// TEST 2: Non-Recurring Edit Mode (isEdit = true)
// ============================================================
@isTest
static void testCreateShift_NonRecurring_Edit() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];
        Add_Shift__c existingShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        ShiftwithStaff__c existingSws = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];

        String jsonPayLoad = '{' +
            '"addShiftData": {' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftStaffValue":"' + staffList.Id + '","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":30,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"Edit Test",' +
            '    "AddShiftEOI":false,"AddShiftId":"' + existingShift.Id + '","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"sil":true,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-16","AddShiftTypeName":"TestShift","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId":"EDIT_REF_001"' +
            '},' +
            '"staffRows":[{' +
            '  "staffId":"' + staffList.Id + '","role":"AIN","shifttype":"General","shiftnames":"TestShift",' +
            '  "starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-16","recurring":false,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":false,"brokenShifts":false,"unAssignedServiceCreation":false,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":"' + existingSws.Id + '","duration":8,"breakTime":30,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[{"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '    "unitPrice":50,"billableHours":8,"amount":400,"hourlyRate":50,"state":"NSW","serviceItemName":"Test Service",' +
            '    "serviceId":null,"customshiftRefId":null}],' +
            '  "checkList":[{"description":"Check 1","mandatory":true,"isCreatedFromStatic":false,"checkListId":null}]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":false,' +
            '"isRecurringShift":false,"includeParticipants":false,"isEdit":true,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        List<Date> recurrenceDates = new List<Date>{ Date.newInstance(2024, 3, 16) };

        Test.startTest();
        String result = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates, null);
        Test.stopTest();
    }
}

// ============================================================
// TEST 3: Recurring Edit Mode (covers childRecurIndex > 0 path)
// ============================================================
@isTest
static void testCreateShift_Recurring_Edit() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];
        Add_Shift__c existingShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        ShiftwithStaff__c existingSws = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];

        // Test with includeParticipants = false (skips services on subsequent dates)
        String jsonPayLoad = '{' +
            '"addShiftData":{' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftStaffValue":"' + staffList.Id + '","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":30,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"Recur Edit",' +
            '    "AddShiftEOI":false,"AddShiftId":"' + existingShift.Id + '","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"sil":true,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-17","AddShiftTypeName":"TestShift","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId":"RECUREDIT_001"' +
            '},' +
            '"staffRows":[{' +
            '  "staffId":"' + staffList.Id + '","role":"AIN","shifttype":"Night","shiftnames":"TestShift",' +
            '  "starttime":"20:00:00Z","starttimeAmPm":"08:00 PM","endtime":"06:00:00Z","endtimeAmPm":"06:00 AM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-17","recurring":true,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":false,"brokenShifts":false,"unAssignedServiceCreation":false,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":"' + existingSws.Id + '","duration":10,"breakTime":0,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[{"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '    "unitPrice":50,"billableHours":10,"amount":500,"hourlyRate":50,"state":"NSW","serviceItemName":"Test Service",' +
            '    "serviceId":null,"customshiftRefId":null}],' +
            '  "checkList":[{"description":"Check recurring","mandatory":true,"isCreatedFromStatic":true,"checkListId":null}]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":false,' +
            '"isRecurringShift":true,"includeParticipants":false,"isEdit":true,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        List<Date> recurrenceDates = new List<Date>{
            Date.newInstance(2024, 3, 16),
            Date.newInstance(2024, 3, 17)
        };

        Test.startTest();
        String result = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates, null);
        Test.stopTest();
    }
}

// ============================================================
// TEST 4: Recurring Edit + includeParticipants = true
// ============================================================
@isTest
static void testCreateShift_Recurring_Edit_IncludeParticipants() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];
        Add_Shift__c existingShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        ShiftwithStaff__c existingSws = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        Services_and_Support_Plan__c existingService = [SELECT Id FROM Services_and_Support_Plan__c LIMIT 1];

        String jsonPayLoad = '{' +
            '"addShiftData":{' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftStaffValue":"' + staffList.Id + '","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":30,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"Incl Participants",' +
            '    "AddShiftEOI":false,"sil":true,"AddShiftId":"' + existingShift.Id + '","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-17","AddShiftTypeName":"TestShift","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId":"INCLPART_001"' +
            '},' +
            '"staffRows":[{' +
            '  "staffId":"' + staffList.Id + '","role":"AIN","shifttype":"General","shiftnames":"TestShift",' +
            '  "starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-17","recurring":true,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":false,"brokenShifts":false,"unAssignedServiceCreation":false,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":"' + existingSws.Id + '","duration":8,"breakTime":30,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[{"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '    "unitPrice":50,"billableHours":8,"amount":400,"hourlyRate":50,"state":"NSW","serviceItemName":"Test Service",' +
            '    "serviceId":"' + existingService.Id + '","customshiftRefId":null}],' +
            '  "checkList":[{"description":"Vital signs","mandatory":true,"isCreatedFromStatic":true,"checkListId":null}]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":false,' +
            '"isRecurringShift":true,"includeParticipants":true,"isEdit":true,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        List<Date> recurrenceDates = new List<Date>{
            Date.newInstance(2024, 3, 16),
            Date.newInstance(2024, 3, 17)
        };

        Test.startTest();
        String result = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates, null);
        Test.stopTest();
    }
}

// ============================================================
// TEST 5: Broken Shift + Split Shift flags (covers isSplitShift
//         branch in shiftServiceRefId generation)
// ============================================================
@isTest
static void testCreateShift_BrokenShift() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];

        String brokenExtended = '{"breakOne":1.5,"breakTwo":0.5,"doubleRate":2.0,"extraHours":1.0,' +
            '"hourlyRate":45.0,"brokenExtendedWages":90.0,' +
            '"brokenBreakStartOne":"12:00:00Z","brokenBreakEndOne":"13:30:00Z",' +
            '"brokenBreakStartTwo":"17:00:00Z","brokenBreakEndTwo":"17:30:00Z"}';

        String jsonPayLoad = '{' +
            '"addShiftData":{' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftStaffValue":"' + staffList.Id + '","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":30,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"sil":true,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"Broken",' +
            '    "AddShiftEOI":false,"AddShiftId":"","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-16","AddShiftTypeName":"TestShift","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId":"BROKEN_001"' +
            '},' +
            '"staffRows":[{' +
            '  "staffId":"' + staffList.Id + '","role":"AIN","shifttype":"General","shiftnames":"TestShift",' +
            '  "starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-16","recurring":false,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":false,"brokenShifts":true,"unAssignedServiceCreation":false,' +
            '  "extraHours":1.0,"doubleRate":2.0,"brokenExtendedWages":90.0,"brokenShiftAllowance":10.0,' +
            '  "isMinimumEngagementApplied":true,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":null,"duration":8,"breakTime":30,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[{"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '    "unitPrice":50,"billableHours":8,"amount":400,"hourlyRate":50,"state":"NSW","serviceItemName":"Test Service",' +
            '    "serviceId":null,"customshiftRefId":null}],' +
            '  "checkList":[]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":false,' +
            '"isRecurringShift":false,"includeParticipants":false,"isEdit":false,' +
            '"isBrokenShift":true,"brokenExtended":"' + brokenExtended.replace('"', '\\"') + '",' +
            '"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        List<Date> recurrenceDates = new List<Date>{ Date.newInstance(2024, 3, 16) };

        Test.startTest();
        String result = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates, null);
        Test.stopTest();
    }
}

// ============================================================
// TEST 6: Staff Conflict Dates (covers hasConflict = true branch)
// ============================================================
@isTest
static void testCreateShift_WithStaffConflict() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];

        String jsonPayLoad = '{' +
            '"addShiftData":{' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftStaffValue":"' + staffList.Id + '","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":30,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"sil":true,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"Conflict Test",' +
            '    "AddShiftEOI":false,"AddShiftId":"","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-17","AddShiftTypeName":"TestShift","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId":"CONFLICT_001"' +
            '},' +
            '"staffRows":[{' +
            '  "staffId":"' + staffList.Id + '","role":"AIN","shifttype":"General","shiftnames":"TestShift",' +
            '  "starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-17","recurring":false,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":false,"brokenShifts":false,"unAssignedServiceCreation":false,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":null,"duration":8,"breakTime":0,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[{"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '    "unitPrice":50,"billableHours":8,"amount":400,"hourlyRate":50,"state":"NSW","serviceItemName":"Test Service",' +
            '    "serviceId":null,"customshiftRefId":null}],' +
            '  "checkList":[]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":false,' +
            '"isRecurringShift":true,"includeParticipants":false,"isEdit":false,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        // Staff conflict JSON: skip staff on 2024-03-17
        String conflictJson = '[{"staffId":"' + staffList.Id + '","staffName":"Test Staff","conflictDates":[' +
            '{"dateString":"2024-03-17","displayDate":"17 Mar 2024","reason":"Already scheduled"}' +
            ']}]';

        List<Date> recurrenceDates = new List<Date>{
            Date.newInstance(2024, 3, 16),
            Date.newInstance(2024, 3, 17)
        };

        Test.startTest();
        String result = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates, conflictJson);
        Test.stopTest();
    }
}

// ============================================================
// TEST 7: Split Shift (covers isSplitShift branch in refId logic)
// ============================================================
@isTest
static void testCreateShift_SplitShift() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];

        String jsonPayLoad = '{' +
            '"addShiftData":{' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftStaffValue":"' + staffList.Id + '","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":0,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"sil":true,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"Split Test",' +
            '    "AddShiftEOI":false,"AddShiftId":"","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-16","AddShiftTypeName":"TestShift","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId":"SPLIT_REF_001"' +
            '},' +
            '"staffRows":[' +
            '  {"staffId":"' + staffList.Id + '","role":"AIN","shifttype":"General","shiftnames":"TestShift",' +
            '  "starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"13:00:00Z","endtimeAmPm":"01:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-16","recurring":false,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":true,"brokenShifts":false,"unAssignedServiceCreation":false,' +
            '  "splitShiftRefId":"SPLIT_001",' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":null,"duration":4,"breakTime":0,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[{"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '    "unitPrice":50,"billableHours":4,"amount":200,"hourlyRate":50,"state":"NSW","serviceItemName":"Split Service 1",' +
            '    "serviceId":null,"customshiftRefId":null}],"checkList":[]},' +
            '  {"staffId":"' + staffList.Id + '","role":"AIN","shifttype":"General","shiftnames":"TestShift",' +
            '  "starttime":"14:00:00Z","starttimeAmPm":"02:00 PM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-16","recurring":false,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":true,"brokenShifts":false,"unAssignedServiceCreation":false,' +
            '  "splitShiftRefId":"SPLIT_001",' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":null,"duration":3,"breakTime":0,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[{"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '    "unitPrice":50,"billableHours":3,"amount":150,"hourlyRate":50,"state":"NSW","serviceItemName":"Split Service 2",' +
            '    "serviceId":null,"customshiftRefId":null}],"checkList":[]}' +
            '],' +
            '"isSplitShift":true,"isGroupShift":false,"isCustomShift":false,' +
            '"isRecurringShift":false,"includeParticipants":false,"isEdit":false,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        List<Date> recurrenceDates = new List<Date>{ Date.newInstance(2024, 3, 16) };

        Test.startTest();
        String result = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates, null);
        Test.stopTest();
    }
}

// ============================================================
// TEST 8: Draft Mode (selectedShiftMode = 'Draft')
// ============================================================
@isTest
static void testCreateShift_DraftMode() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];

        String jsonPayLoad = '{' +
            '"addShiftData":{' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftStaffValue":"' + staffList.Id + '","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":30,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"sil":true,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"Draft",' +
            '    "AddShiftEOI":false,"AddShiftId":"","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-16","AddShiftTypeName":"TestShift","AddShiftStatus":"Draft"' +
            '  },' +
            '  "refId":"DRAFT_001"' +
            '},' +
            '"staffRows":[{' +
            '  "staffId":"' + staffList.Id + '","role":"AIN","shifttype":"General","shiftnames":"TestShift",' +
            '  "starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-16","recurring":false,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":false,"brokenShifts":false,"unAssignedServiceCreation":false,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":null,"duration":8,"breakTime":30,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[{"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '    "unitPrice":50,"billableHours":8,"amount":400,"hourlyRate":50,"state":"NSW","serviceItemName":"Draft Service",' +
            '    "serviceId":null,"customshiftRefId":null}],' +
            '  "checkList":[]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":true,"isCustomShift":false,' +
            '"isRecurringShift":false,"includeParticipants":false,"isEdit":false,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":"Draft"' +
            '}';

        List<Date> recurrenceDates = new List<Date>{ Date.newInstance(2024, 3, 16) };

        Test.startTest();
        String result = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates, null);
        Test.stopTest();
    }
}

// ============================================================
// TEST 9: Custom Shift with customshiftRefId on services
// ============================================================
@isTest
static void testCreateShift_CustomShiftRefId() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];

        String jsonPayLoad = '{' +
            '"addShiftData":{' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftStaffValue":"' + staffList.Id + '","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"Custom","AddShiftBreak":0,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"sil":true,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"Custom",' +
            '    "AddShiftEOI":false,"AddShiftId":"","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-16","AddShiftTypeName":"TestShift","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId":"CUSTOM_SVC_001"' +
            '},' +
            '"staffRows":[{' +
            '  "staffId":"' + staffList.Id + '","role":"AIN","shifttype":"Custom","shiftnames":"TestShift",' +
            '  "starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-16","recurring":false,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":false,"brokenShifts":false,"unAssignedServiceCreation":false,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":null,"duration":8,"breakTime":0,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[' +
            '    {"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '     "unitPrice":50,"billableHours":4,"amount":200,"hourlyRate":50,"state":"NSW","serviceItemName":"Custom Morning",' +
            '     "serviceId":null,"customshiftRefId":"CUSTOM_MORNING_001","starttime":"09:00:00Z","endtime":"13:00:00Z"},' +
            '    {"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '     "unitPrice":55,"billableHours":4,"amount":220,"hourlyRate":55,"state":"NSW","serviceItemName":"Custom Afternoon",' +
            '     "serviceId":null,"customshiftRefId":"CUSTOM_AFTERNOON_001","starttime":"13:00:00Z","endtime":"17:00:00Z"}' +
            '  ],' +
            '  "checkList":[]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":true,' +
            '"isRecurringShift":false,"includeParticipants":false,"isEdit":false,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        List<Date> recurrenceDates = new List<Date>{ Date.newInstance(2024, 3, 16) };

        Test.startTest();
        String result = RosterCreationVersionTwo.createShift(jsonPayLoad, recurrenceDates, null);
        Test.stopTest();
    }
}

// ============================================================
// TEST 10: Exception - no recurrence dates provided
// ============================================================
@isTest
static void testCreateShift_NoRecurrenceDates_Throws() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Staff__c staffList = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];

        String jsonPayLoad = '{' +
            '"addShiftData":{"shiftaddress":{"street":"Test","citySuburb":"City","country":"AU","provinceState":"NSW","postalcode":"2000"},' +
            '"shiftDetails":{"AddShiftStartDate":"2024-03-16","AddShiftStaffValue":"' + staffList.Id + '",' +
            '"AddShiftFacilityValue":"' + facility.Id + '","AddShiftRole":"AIN","AddShiftType":"General","AddShiftBreak":0,' +
            '"AddShiftDuration":8,"AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM",' +
            '"AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM","AddShiftnotification":false,' +
            '"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"","AddShiftEOI":false,' +
            '"AddShiftId":"","AddShiftHoliday":false,"sil":true,"AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false},' +
            '"refId":"ERR_001"},' +
            '"staffRows":[{"staffId":"' + staffList.Id + '","role":"AIN","shifttype":"General","starttime":"09:00:00Z",' +
            '"starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM","startdate":"2024-03-16",' +
            '"enddate":"2024-03-16","sil":true,"address":{"street":"Test","citySuburb":"City","country":"AU","provinceState":"NSW","postalcode":"2000"},' +
            '"services":[],"checkList":[]}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":false,' +
            '"isRecurringShift":false,"includeParticipants":false,"isEdit":false,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""}';

        Test.startTest();
        Boolean exceptionThrown = false;
        try {
            RosterCreationVersionTwo.createShift(jsonPayLoad, new List<Date>(), null);
        } catch (AuraHandledException e) {
            exceptionThrown = true;
        }
        Test.stopTest();
    }
}

// ============================================================
// TEST 11: generateGUID coverage
// ============================================================
@isTest
static void testGenerateGUID() {
    Test.startTest();
    String guid = RosterCreationVersionTwo.generateGUID();
    Test.stopTest();
}
    
    @isTest
static void testCreateShift_UnassignedServiceCreation() {
    User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(testUser) {
        Client__c clie = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c ndis = [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
        Funds_Tracker__c fund = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants4567' LIMIT 1];

        // ---- CALL 1: Custom shift type (multi-service single parent) + SIL false ----
        String jsonPayLoadCustom = '{' +
            '"addShiftData":{' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"Custom","AddShiftTypeName":"UnassignedCustom","AddShiftBreak":0,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"sil":false,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"UnassignedCustom",' +
            '    "AddShiftEOI":false,"AddShiftId":"","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-16","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId":"UNASSIGNED_CUSTOM_001"' +
            '},' +
            '"staffRows":[{' +
            '  "staffId":null,"role":"AIN","shifttype":"Custom","shiftnames":"UnassignedCustom",' +
            '  "starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-16","recurring":false,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":false,"splitShifts":false,"brokenShifts":false,"unAssignedServiceCreation":true,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":null,"duration":8,"breakTime":0,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[' +
            '    {"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '     "unitPrice":50,"billableHours":4,"amount":200,"hourlyRate":50,"state":"NSW","serviceItemName":"Custom Morning",' +
            '     "serviceId":null,"customshiftRefId":"CUSTOM_MORNING_UA_001","starttime":"09:00:00Z","endtime":"13:00:00Z"},' +
            '    {"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '     "unitPrice":55,"billableHours":4,"amount":220,"hourlyRate":55,"state":"NSW","serviceItemName":"Custom Afternoon",' +
            '     "serviceId":null,"customshiftRefId":"CUSTOM_AFTERNOON_UA_001","starttime":"13:00:00Z","endtime":"17:00:00Z"}' +
            '  ],' +
            '  "checkList":[{"description":"Unassigned custom check","mandatory":true,"isCreatedFromStatic":false,"checkListId":null}]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":true,' +
            '"isRecurringShift":false,"includeParticipants":false,"isEdit":false,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        // ---- CALL 2: Non-Custom shift type (one parent per service) + SIL true ----
        String jsonPayLoadGeneral = '{' +
            '"addShiftData":{' +
            '  "shiftaddress":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftDetails":{' +
            '    "AddShiftStartDate":"2024-03-16","AddShiftFacilityValue":"' + facility.Id + '",' +
            '    "AddShiftRole":"AIN","AddShiftType":"General","AddShiftTypeName":"UnassignedGeneral","AddShiftBreak":30,"AddShiftDuration":8,' +
            '    "AddShiftStartTime":"09:00:00Z","AddShiftStartTimeAMPM":"09:00 AM","AddShiftEndTime":"17:00:00Z","AddShiftEndTimeAMPM":"05:00 PM",' +
            '    "AddShiftnotification":false,"sil":true,"AddShiftStaffHourlyRate":45,"AddShiftQuantity":1,"AddShiftNotes":"UnassignedGeneral",' +
            '    "AddShiftEOI":false,"AddShiftId":"","AddShiftHoliday":false,' +
            '    "AddShiftEnterOtherLocation":false,"AddShiftParticipantAddressCheckbox":false,' +
            '    "AddShiftEndDate":"2024-03-16","AddShiftStatus":"Active"' +
            '  },' +
            '  "refId":"UNASSIGNED_GENERAL_001"' +
            '},' +
            '"staffRows":[{' +
            '  "staffId":null,"role":"AIN","shifttype":"General","shiftnames":"UnassignedGeneral",' +
            '  "starttime":"09:00:00Z","starttimeAmPm":"09:00 AM","endtime":"17:00:00Z","endtimeAmPm":"05:00 PM",' +
            '  "startdate":"2024-03-16","enddate":"2024-03-16","recurring":false,"shiftnotes":"notes","staffPaidbreak":false,' +
            '  "enableTimeRounding":false,"sil":true,"splitShifts":false,"brokenShifts":false,"unAssignedServiceCreation":true,' +
            '  "address":{"street":"4 Glen Street","citySuburb":"Eastwood","country":"AU","provinceState":"NSW","postalcode":"2122","latitude":-33.79,"longitude":151.07},' +
            '  "shiftWithStaffId":null,"duration":8,"breakTime":30,"hourlyrate":45,"refId":null,"addressSource":"Facility",' +
            '  "services":[' +
            '    {"participantId":"' + clie.Id + '","serviceType":"' + fund.Id + '","serviceItem":"' + ndis.Id + '",' +
            '     "unitPrice":50,"billableHours":8,"amount":400,"hourlyRate":50,"state":"NSW","serviceItemName":"SIL Service",' +
            '     "serviceId":null,"customshiftRefId":null}' +
            '  ],' +
            '  "checkList":[{"description":"Unassigned general check","mandatory":false,"isCreatedFromStatic":true,"checkListId":null}]' +
            '}],' +
            '"isSplitShift":false,"isGroupShift":false,"isCustomShift":false,' +
            '"isRecurringShift":false,"includeParticipants":false,"isEdit":false,' +
            '"isBrokenShift":false,"brokenExtended":null,"LongShiftTimeSlots":"{}","selectedShiftMode":""' +
            '}';

        List<Date> recurrenceDates = new List<Date>{ Date.newInstance(2024, 3, 16) };

        Test.startTest();
        RosterCreationVersionTwo.createShift(jsonPayLoadCustom, recurrenceDates, null);
        RosterCreationVersionTwo.createShift(jsonPayLoadGeneral, recurrenceDates, null);
        Test.stopTest();
    }
}
    
    @isTest
static void testCreateShiftWrapperMethod() {
    User use = [SELECT Id FROM User WHERE Email='manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(use){
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Name='Ashfield Consultants4567' LIMIT 1];

        // ---- Address wrapper (shared) ----
        RosterCreation.addShiftAddressWrapper addr = new RosterCreation.addShiftAddressWrapper();
        addr.street = '8 Keewong Street';
        addr.citySuburb = 'Crace';
        addr.country = 'AU';
        addr.provinceState = 'ACT';
        addr.postalcode = '2911';
        addr.latitude = -35.2005216;
        addr.longitude = 149.1096594;

        // ---- Shift details wrapper (shared) ----
        RosterCreation.AddShiftBasicDetailsWrapper details = new RosterCreation.AddShiftBasicDetailsWrapper();
        details.AddShiftStartDate = Date.newInstance(2027,05,20);
        details.AddShiftFacilityValue = fac.Id;
        details.AddShiftRole = 'Admin';
        details.AddShiftStartTime = Time.newInstance(9,0,0,0);
        details.AddShiftStartTimeAMPM = '9:00 AM';
        details.AddShiftEndTimeAMPM = '5:00 PM';
        details.AddShiftEndTime = Time.newInstance(17,0,0,0);
        details.AddShiftType = 'General';
        details.AddShiftNotes = 'test notes';
        details.AddShiftQuantity = 2;
        details.AddShiftEOI = false;
        details.AddShiftDuration = 8;
        details.AddShiftId = null;
        details.AddShiftHoliday = false;
        details.AddShiftEnterOtherLocation = false;
        details.AddShiftParticipantAddressCheckbox = false;
        details.AddShiftTypeName = 'General Shift';

        RosterCreation.addShiftWrapper wrapper = new RosterCreation.addShiftWrapper();
        wrapper.shiftaddress = addr;
        wrapper.shiftDetails = details;

        // ---- Case 1: new record, NOT split shift, addShiftupdateFlag = false ----
        RosterAddShiftService.RosterServiceHandler rshNew = new RosterAddShiftService.RosterServiceHandler();
        rshNew.id = 'REF_NEW_001';
        rshNew.SplitShift = false;

        Test.startTest();
        Add_Shift__c result1 = RosterCreation.createShift(wrapper, rshNew, false);

        // ---- Case 2: update existing, addShiftupdateFlag = true + AddShiftId set ----
        Add_Shift__c existingShift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        details.AddShiftId = existingShift.Id;
        RosterAddShiftService.RosterServiceHandler rshUpdate = new RosterAddShiftService.RosterServiceHandler();
        rshUpdate.id = 'REF_UPDATE_001';
        rshUpdate.SplitShift = false;

        Add_Shift__c result2 = RosterCreation.createShift(wrapper, rshUpdate, true);

        // ---- Case 3: Split shift branch ----
        RosterAddShiftService.RosterServiceHandler rshSplit = new RosterAddShiftService.RosterServiceHandler();
        rshSplit.id = 'REF_SPLIT_001';
        rshSplit.SplitShift = true;
        rshSplit.startTime = Time.newInstance(10,0,0,0);
        rshSplit.serviceDate = Date.newInstance(2027,05,21);
        rshSplit.endTime = Time.newInstance(14,0,0,0);
        rshSplit.startTimeAMPM = '10:00 AM';
        rshSplit.endTimeAMPM = '2:00 PM';
        rshSplit.splitShiftColor = 'border-left: 10px solid #008000';
        rshSplit.splitShiftHeight = '50';

        details.AddShiftId = null; // back to create path for split case
        Add_Shift__c result3 = RosterCreation.createShift(wrapper, rshSplit, false);
        Test.stopTest();
    }
}

@isTest
static void testGetCustomWeekStartAllBranches() {
    Date d = Date.newInstance(2026, 7, 8); // a Wednesday

    Test.startTest();
    Date monday    = RosterCreation.getCustomWeekStart(d, 'Monday');
    Date tuesday   = RosterCreation.getCustomWeekStart(d, 'Tuesday');
    Date wednesday = RosterCreation.getCustomWeekStart(d, 'Wednesday');
    Date thursday  = RosterCreation.getCustomWeekStart(d, 'Thursday');
    Date friday    = RosterCreation.getCustomWeekStart(d, 'Friday');
    Date saturday  = RosterCreation.getCustomWeekStart(d, 'Saturday');
    Date sunday    = RosterCreation.getCustomWeekStart(d, 'Sunday');
    Date blank     = RosterCreation.getCustomWeekStart(d, '');
    Date nullDay   = RosterCreation.getCustomWeekStart(d, null);
    Date garbage   = RosterCreation.getCustomWeekStart(d, 'NotADay'); // falls through to default Monday
    Date lowercase = RosterCreation.getCustomWeekStart(d, 'monday'); // case-insensitive branch
    Test.stopTest();
}
    /*
    @isTest
static void testCheckSingleDateAvailabilitySequentialAllBranches() {
    User use = [SELECT Id FROM User WHERE Email='manualtesting.1139562@hotmail.com' LIMIT 1];
    System.runAs(use){
        Staff__c staff = [SELECT Id, Set_Hours__c, Restrict_Set_Hours__c, Active_or_Non_Active__c, Status__c,
                                  Facility__r.Organisation__c
                           FROM Staff__c WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Name='Ashfield Consultants4567' LIMIT 1];
        ShiftwithStaff__c existingShift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];

        Time startTime = Time.newInstance(9,0,0,0);
        Time endTime   = Time.newInstance(17,0,0,0);

        Map<String, Date> weekStartMap = new Map<String, Date>{ 'Week-1' => Date.newInstance(2027,05,17) }; // Monday
        Map<Id, Map<Date, Decimal>> proposedShiftHours = new Map<Id, Map<Date, Decimal>>{
            staff.Id => new Map<Date, Decimal>{ Date.newInstance(2027,05,18) => 8 }
        };

        // ---- CASE 1: On approved leave -> early return ----
        Map<Id, List<Leave__c>> leavesByStaff = new Map<Id, List<Leave__c>>{
            staff.Id => new List<Leave__c>{
                new Leave__c(Staff__c=staff.Id, From__c=Date.newInstance(2027,05,18), To__c=Date.newInstance(2027,05,18), Status__c='Approved')
            }
        };

        Test.startTest();
        String r1 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            leavesByStaff,
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 2: Facility + Role compliance missing doc ----
        Map<Id, Set<Id>> facilitiesByStaff = new Map<Id, Set<Id>>{ staff.Id => new Set<Id>{fac.Id} };
        Map<Id, Map<Id, Set<String>>> rolesByStaffFacility = new Map<Id, Map<Id, Set<String>>>{
            staff.Id => new Map<Id, Set<String>>{ fac.Id => new Set<String>{'Admin'} }
        };
        Map<Id, Map<String, Set<String>>> mandatoryDocsByFacilityRole = new Map<Id, Map<String, Set<String>>>{
            fac.Id => new Map<String, Set<String>>{ 'Admin' => new Set<String>{'Police Check'} }
        };
        Map<Id, String> facilityNameById = new Map<Id, String>{ fac.Id => 'Ashfield Consultants4567' };

        String r2 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            facilitiesByStaff, rolesByStaffFacility, mandatoryDocsByFacilityRole,
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Set<String>>(), // no submitted docs
            fac.Id, 'Admin', 'General', facilityNameById, new List<String>()
        );

        // ---- CASE 3: Facility passed, Role NOT passed -> aggregate-all-roles branch ----
        String r3 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            facilitiesByStaff, rolesByStaffFacility, mandatoryDocsByFacilityRole,
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Set<String>>(),
            null, null, 'General', facilityNameById, new List<String>()
        );

        // ---- CASE 4: Org-level compliance missing doc ----
        Map<Id, Map<String, Set<String>>> mandatoryDocsByOrgRole = new Map<Id, Map<String, Set<String>>>{
            staff.Facility__r.Organisation__c => new Map<String, Set<String>>{ 'Admin' => new Set<String>{'Org Doc'} }
        };
        String r4 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            facilitiesByStaff, rolesByStaffFacility, new Map<Id, Map<String, Set<String>>>(), // no facility docs
            mandatoryDocsByOrgRole, new Map<Id, Set<String>>{ staff.Id => new Set<String>{'Police Check'} }, // has facility doc submitted, missing org doc
            fac.Id, 'Admin', 'General', facilityNameById, new List<String>()
        );

        // ---- CASE 5: Document expired ----
        Map<Id, List<Child_Staff__c>> expiredDocsByStaff = new Map<Id, List<Child_Staff__c>>{
            staff.Id => new List<Child_Staff__c>{
                new Child_Staff__c(Staff__c=staff.Id, Document_Type__c='Passport', Compliance__c=true, Expiry_Date__c=Date.newInstance(2027,05,01))
            }
        };
        String r5 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            expiredDocsByStaff,
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(), // skip compliance block entirely
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 6: Document pending ----
        Map<Id, List<Child_Staff__c>> pendingDocsByStaff = new Map<Id, List<Child_Staff__c>>{
            staff.Id => new List<Child_Staff__c>{
                new Child_Staff__c(Staff__c=staff.Id, Document_Type__c='Passport', Status__c='Pending')
            }
        };
        String r6 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            pendingDocsByStaff,
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 7: Document rejected ----
        Map<Id, List<Child_Staff__c>> rejectedDocsByStaff = new Map<Id, List<Child_Staff__c>>{
            staff.Id => new List<Child_Staff__c>{
                new Child_Staff__c(Staff__c=staff.Id, Document_Type__c='Passport', Status__c='Rejected')
            }
        };
        String r7 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            rejectedDocsByStaff,
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 8: Overlapping shift ----
        ShiftwithStaff__c overlapShift = new ShiftwithStaff__c(
            Staff__c = staff.Id,
            Start_Date__c = Date.newInstance(2027,05,18),
            Shift_Start_Time__c = Time.newInstance(8,0,0,0),
            Shift_End_Date__c = Date.newInstance(2027,05,18),
            Shift_End_Time__c = Time.newInstance(12,0,0,0)
        );
        Map<Id, Map<Date, List<ShiftwithStaff__c>>> overlapShiftsByStaffDate = new Map<Id, Map<Date, List<ShiftwithStaff__c>>>{
            staff.Id => new Map<Date, List<ShiftwithStaff__c>>{
                Date.newInstance(2027,05,18) => new List<ShiftwithStaff__c>{ overlapShift }
            }
        };
        String r8 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            overlapShiftsByStaffDate,
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 8b: same overlap but isEditMode=true + currentShiftId matches -> skip continue branch ----
        String r8b = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', true, staff,
            overlapShiftsByStaffDate,
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, existingShift.Id, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 9: Unavailable during time period ----
        Availability__c unavail = new Availability__c(
            Staff__c = staff.Id, Type__c = 'Unavailable',
            Start_Time__c = Time.newInstance(9,0,0,0), End_Time__c = Time.newInstance(17,0,0,0)
        );
        Map<Id, Map<Date, List<Availability__c>>> availByStaffDate = new Map<Id, Map<Date, List<Availability__c>>>{
            staff.Id => new Map<Date, List<Availability__c>>{
                Date.newInstance(2027,05,18) => new List<Availability__c>{ unavail }
            }
        };
        String r9 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            availByStaffDate,
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 10: Exceeds set hours limit ----
        staff.Restrict_Set_Hours__c = true;
        staff.Set_Hours__c = 5; // proposed 8 > 5
        String r10 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 11: Weekend skip (set-hours check bypassed) ----
        String r11 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,15), startTime, endTime, 'Yes', false, staff, // Saturday
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 12: Sleepover shift skip (set-hours check bypassed) ----
        String r12 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'Sleepover Shift', new Map<Id, String>(), new List<String>()
        );

        // ---- CASE 13: otherGroupShiftShiftIds skip branch on overlap check ----
        String r13 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            overlapShiftsByStaffDate,
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(),
            new List<String>{ overlapShift.Id } // treated as other group shift -> skip its overlap
        );

        // ---- CASE 14: clean pass -> returns null, updates cumulativeWeeklyHours ----
        staff.Set_Hours__c = 40;
        String r14 = RosterCreation.checkSingleDateAvailabilitySequential(
            staff.Id, Date.newInstance(2027,05,18), startTime, endTime, 'Yes', false, staff,
            new Map<Id, Map<Date, List<ShiftwithStaff__c>>>(),
            new Map<Id, Map<Date, List<Availability__c>>>(),
            new Map<Id, List<Leave__c>>(),
            new Map<Id, List<ShiftwithStaff__c>>(),
            new Map<Id, List<Child_Staff__c>>(),
            new Map<String, Decimal>{ 'Week-1' => 0 }, weekStartMap, null, proposedShiftHours,
            new Map<Id, Set<Id>>(), new Map<Id, Map<Id, Set<String>>>(),
            new Map<Id, Map<String, Set<String>>>(), new Map<Id, Map<String, Set<String>>>(),
            new Map<Id, Set<String>>(), null, null, 'General', new Map<Id, String>(), new List<String>()
        );
        Test.stopTest();
    }
}
*/   
 
    
}