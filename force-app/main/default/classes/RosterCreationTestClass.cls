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
            
            // Create mock Staff record if it doesn't already exist for testing
            Staff__c staffList = [SELECT Id, Expiry_Date__c, Name__c, Last_Name__c, Role__c 
                                  FROM Staff__c 
                                  WHERE Email_Address__c = 'manualtesting.1139562@hotmail.com' 
                                  LIMIT 1];
            
            // Get a sample Facility
            Facility__c facility = [SELECT Id FROM Facility__c where name='Ashfield Consultants4567' LIMIT 1 ];
              List<ShiftwithStaff__c> shiftStaff = [select id,Attendence__c from ShiftwithStaff__c LIMIT 1];
        
          
            
            
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
                '"LongShiftTimeSlots":"{\\"Morning\\":{\\"id\\":1746724048236,\\"startTime\\":\\"10:00:00Z\\",\\"endTime\\":\\"13:00:00Z\\",\\"hourlyRate\\":\\"50.34\\",\\"rowShiftType\\":\\"Morning\\",\\"startDateTime\\":\\"2025-05-06T04:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-06T07:30:00.000Z\\",\\"duration\\":3},' +
                '\\"Afternoon\\":{\\"id\\":1746724071041,\\"startTime\\":\\"13:00:00Z\\",\\"endTime\\":\\"20:00:00Z\\",\\"hourlyRate\\":\\"56.63\\",\\"rowShiftType\\":\\"Afternoon\\",\\"startDateTime\\":\\"2025-05-06T07:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"duration\\":7},' +
                '\\"Night\\":{\\"id\\":1746724083201,\\"startTime\\":\\"20:00:00Z\\",\\"endTime\\":\\"06:00:00Z\\",\\"hourlyRate\\":\\"57.89\\",\\"rowShiftType\\":\\"Night\\",\\"startDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-07T00:30:00.000Z\\",\\"duration\\":10}}"}]';
            
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
                '"LongShiftTimeSlots":"{\\"Morning\\":{\\"id\\":1746724048236,\\"startTime\\":\\"10:00:00Z\\",\\"endTime\\":\\"13:00:00Z\\",\\"hourlyRate\\":\\"50.34\\",\\"rowShiftType\\":\\"Morning\\",\\"startDateTime\\":\\"2025-05-06T04:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-06T07:30:00.000Z\\",\\"duration\\":3},' +
                '\\"Afternoon\\":{\\"id\\":1746724071041,\\"startTime\\":\\"13:00:00Z\\",\\"endTime\\":\\"20:00:00Z\\",\\"hourlyRate\\":\\"56.63\\",\\"rowShiftType\\":\\"Afternoon\\",\\"startDateTime\\":\\"2025-05-06T07:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"duration\\":7},' +
                '\\"Night\\":{\\"id\\":1746724083201,\\"startTime\\":\\"20:00:00Z\\",\\"endTime\\":\\"06:00:00Z\\",\\"hourlyRate\\":\\"57.89\\",\\"rowShiftType\\":\\"Night\\",\\"startDateTime\\":\\"2025-05-06T14:30:00.000Z\\",\\"endDateTime\\":\\"2025-05-07T00:30:00.000Z\\",\\"duration\\":10}}"}]';
            
            String jsonDataCheckList = '[{"id":1738948871561,"index":1,"description":"check bp","mandatory":true},' +
                '{"id":1738948888321,"index":2,"description":"take him walk","mandatory":true}]';
                  List<Date> weekDaysDates = new List<Date>{Date.newInstance(2021,12, 22), Date.newInstance(2021,12, 23), Date.newInstance(2021,12, 23)};
                     List<String> stringIds = new List<String>();
                    for(ShiftwithStaff__c shifts :shiftStaff){
                        stringIds.add(shifts.Id);
                    }
                    
            
          
                
                System.runAs(testUser) {
                    Map<String, Object> response = RosterCreation.createAddShift(jsonData, true, 'Weekly', 2, '2021-12-30', '2021-08-22', new List<String>{'Monday'}, 1, jsonDataService, jsonDataCheckList, FALSE, false,weekDaysDates);
                  Map<String, Object> response1 = RosterCreation.createAddShift(jsonData12, TRUE, 'Weekly', 2, '2021-12-22', '2021-09-22', new List<String>{'Monday'}, 1, jsonDataService12, jsonDataCheckList, FALSE, true,weekDaysDates);
                   Map<String, Object> response12 = RosterCreation.createAddShift(jsonData, false, 'Weekly', 2, '2021-11-22', '2021-11-16', new List<String>{'Monday'}, 1, jsonDataService12, jsonDataCheckList, FALSE, FALSE,weekDaysDates);
                   Map<String, Object> responses3 = RosterCreation.createAddShift(jsonData12, FALSE, 'Weekly', 2, '2021-11-22', '2021-11-16',new List<String>{'Monday'}, 1, jsonDataService12, jsonDataCheckList, TRUE, TRUE,weekDaysDates);
                  //  
                   AddShiftController.updateAllocations(stringIds);  
                 
                }
            
            Test.stopTest();
        }
    }
    

         
        
}