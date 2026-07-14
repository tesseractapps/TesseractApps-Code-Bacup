@isTest

public class ShiftComplianceControllerTest {
    
    @testsetup 
    Static void testData(){
        List<String> picklistRoles = new List<String>();
        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN'});
        }
        
        String role1 = picklistRoles[0];
        String role2 = picklistRoles.size() > 1 ? picklistRoles[1] : role1;
        
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
        org.Week_Start_Day__c='Monday';
        org.Roles__c = role1 + ';' + role2;
        insert org;
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637455@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c='12345678901';
            fac.Phone__c = '12323432';
           
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
            insert fac;
            insert new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Apply_to_specific_roles__c = true,
                Roles__c = 'Admin',
                Max_Hours_Per_Shift__c = 6,
                Max_Hours_Per_Week__c = 20,
                Max_Consecutive_Days__c = 2,
                Min_Hours_Between_Shifts__c = 12,
                Is_Active__c = true
            );
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20294637455@hotmail.com';
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
            staff.Status__c = true;
            
            insert staff; 
           
            StaffRole__c sr = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Facility__c = fac.Id,
                Hourly_Rate__c = 50
            );
            insert sr;
            insert new StaffRole__c(
            StaffRole_To_Staff__c = staff.Id,
            RoleName__c = 'AIN',
            Active__c = true,
            Facility__c = fac.Id,
            Hourly_Rate__c = 45
             );

            Child_Staff__c cs = new Child_Staff__c();
            cs.Expiry_Date__c =date.newInstance(2028, 01, 05); 
            cs.Staff__c=staff.id;
            cs.Comments__c='test ';
            insert cs;
            
            Training__c tra = new Training__c();             
            tra.description__c	= 'Test Description';
            tra.Name = 'LWC';
            tra.start_date__c=date.newInstance(2025, 02, 05);
            tra.end_date__c=date.newInstance(2025, 02, 20);
            tra.Organization_Name__c = 'Ashfield Consultants';
            insert tra;
            
            Assignment__c assign = new Assignment__c();
            assign.Module_Name__c = tra.Id;
            assign.Staff__c = staff.Id;
            assign.Completed_Date__c=date.newInstance(2025, 02, 14);
            assign.Organization_Name__c = 'Ashfield Consultants';
            insert assign;
            
            Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 10, 16);
            shift.End_Date__c=Date.newInstance(2024, 10, 24);
            shift.Direction__c=dire.Id;
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
            shift.Is_EOI__c = true;
            shift.EOI_staff__c = staff.Id;
            shift.Shift_Type__c='General';
            insert shift;

            Add_Shift_Checklist__c  asch = new Add_Shift_Checklist__c();
            asch.Description__c=' teststs ';
            asch.Mandatory__c = true;
            asch.Add_Shift__c=shift.Id;
            insert asch;
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
            insert staffs;

            Add_Shift__c shift1 = new Add_Shift__c();
            shift.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 12, 16); 
            shift.End_Date__c=Date.newInstance(2024, 10, 24);
            shift1.Role__c='Admin';
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift1.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift1.Facility__c=fac.Id;
            shift1.Status__c='Draft';
            shift1.Start_time_picklist__c='6:30 pm';
            shift1.End_time_picklist__c='10:00 pm';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='Night';
            shift1.Start_Time_Text__c = '6:30 pm';
            shift1.End_Time_Text__c = '10:00 pm';
            shift1.Split_Shifts__c = true;
            insert shift1;
            
            Add_Shift_Checklist__c  asch1 = new Add_Shift_Checklist__c();
            asch1.Description__c=' teststs ';
            asch1.Mandatory__c = true;
            asch1.Add_Shift__c=shift1.Id;
            insert asch1;
            
            Add_Shift__c shift2 = new Add_Shift__c();
            shift2.Break__c = '30';
            shift2.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift2.Start_Date__c =Date.newInstance(2024, 08, 20);        
            shift2.Role__c='Admin';
            shift2.Get_Facility__c=true;
            shift2.Quantity__c=5;
            shift2.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift2.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift2.Facility__c=fac.Id;
            shift2.Status__c='Draft';
            shift2.Start_time_picklist__c='6:30 pm';
            shift2.End_time_picklist__c='10:00 pm';
            shift2.Location__StateCode__s = 'ACT';
            shift2.Location__CountryCode__s = 'AU';
            shift2.Location__PostalCode__s = '2911';
            shift.Shift_Type__c='Custom';
            shift1.Split_Shifts__c = false;
            insert shift2;
            
            Add_Shift_Checklist__c  asch2 = new Add_Shift_Checklist__c();
            asch2.Description__c=' teststs ';
            asch2.Mandatory__c = true;
            asch2.Add_Shift__c=shift2.Id;
            insert asch2;
            
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift1.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c=staff.Id;
            staffs1.Role__c='Admin';
            staffs1.Status__c='Accepted';
            insert staffs1;
            
            Add_Shift__c shift3 = new Add_Shift__c();
            shift3.Break__c = '30';
            shift3.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift3.Start_Date__c =Date.newInstance(2024, 01, 01);        
            shift3.Role__c='Admin';
            shift3.Get_Facility__c=true;
            shift3.Quantity__c=5;
            shift3.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift3.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift3.Facility__c=fac.Id;
            shift3.Status__c='Draft';
            shift3.Start_time_picklist__c='6:30 pm';
            shift3.End_time_picklist__c='10:00 pm';
            shift3.Location__StateCode__s = 'ACT';
            shift3.Location__CountryCode__s = 'AU';
            shift3.Location__PostalCode__s = '2911';
            shift3.Shift_Type__c='Night';
            insert shift3;
            
            Add_Shift_Checklist__c  asch3 = new Add_Shift_Checklist__c();
            asch3.Description__c=' teststs ';
            asch3.Mandatory__c = true;
            asch3.Add_Shift__c=shift3.Id;
            insert asch3;
            
            
            Add_Shift__c shift4 = new Add_Shift__c();
            shift4.Break__c = '30';
            shift4.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift4.Start_Date__c =Date.newInstance(2025, 01, 01);        
            shift4.Role__c='Admin';
            shift4.Get_Facility__c=true;
            shift4.Quantity__c=5;
            shift4.Start_Time__c=Time.newInstance( 9, 30, 00, 00);
            shift4.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift4.Facility__c=fac.Id;
            shift4.Status__c='Draft';
            shift4.Start_time_picklist__c='6:30 pm';
            shift4.End_time_picklist__c='10:00 pm';
            shift4.Location__StateCode__s = 'ACT';
            shift4.Location__CountryCode__s = 'AU';
            shift4.Location__PostalCode__s = '2911';
            shift4.Shift_Type__c='Custom';
            insert shift4;
            
            ShiftwithStaff__c staffs4 = new ShiftwithStaff__c();
            staffs4.Add_Shift__c=shift4.Id;
            staffs4.Attendence__c=true;
            staffs4.Comments__c = 'test comments';
            staffs4.Staff__c=staff.Id;
            staffs4.Role__c='Admin';
            staffs4.Status__c='Accepted';
            staffs4.Long_Morning_Start_Time__c=Time.newInstance(9, 30, 00, 00);
            staffs4.Long_Morning_End_Time__c=Time.newInstance(13, 30, 00, 00);
            staffs.Long_Afternoon_Start_Time__c= Time.newInstance(13, 30, 00, 00);
            staffs.Long_Afternoon_End_Time__c=Time.newInstance(22, 00, 00, 00);
            insert staffs4;
            
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
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Service_Type__c = NSC.Id;
            services.Qty__c=5;
            services.GST__c='No';
            services.Date_of_Service__c = system.today();
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffs.id;
            insert services;
            
            
            
            Reimbursement__c rei = new Reimbursement__c();
            rei.Mileage__c='30';
            rei.ShiftwithStaff__c=staffs.Id; 
            rei.Approval_Status__c='Approved';
            insert rei;
            
            
            List<Add_Shift_Checklist__c> checklistRecords = new List<Add_Shift_Checklist__c>();
            for (Integer i = 0; i < 2; i++) {
                checklistRecords.add(new Add_Shift_Checklist__c(Completed__c = false,Add_Shift__c = shift1.Id));
            }
            insert checklistRecords;
            
            ShiftWithStaff_Activity__c staffActivity = new ShiftWithStaff_Activity__c();
            staffActivity.ShiftwithStaff__c = staffs1.Id;
            Insert staffActivity;
            
            String jsonData = '{"serviceTypeId":"' +funds.Id + 
                '","serviceGroupId":"' +NSC.Id + 
                '","participantId":"' +cli.Id + '"}';
            
            Add_Shift__c shift5 = new Add_Shift__c();
            shift5.Break__c = '30';
            shift5.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift5.Start_Date__c =Date.newInstance(2024, 02, 01);        
            shift5.Role__c='Admin';
            shift5.Get_Facility__c=true;
            shift5.Quantity__c=5; 
            shift5.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift5.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift5.Facility__c=fac.Id;
            shift5.Status__c='Draft';
            shift5.Start_time_picklist__c='6:30 pm';
            shift5.End_time_picklist__c='10:00 pm';
            shift5.Location__StateCode__s = 'ACT';
            shift5.Location__CountryCode__s = 'AU';
            shift5.Location__PostalCode__s = '2911';
            shift5.RefId__c='12535899999';
            shift5.Shift_Type__c='Night';
            shift5.Service_Details__c=jsonData;
            shift5.Duration__c = 9;
            insert shift5;
            
            ShiftwithStaff__c staffs5 = new ShiftwithStaff__c();
            staffs5.Add_Shift__c=shift5.Id;
            staffs5.Attendence__c=true;
            staffs5.Comments__c = 'test comments';
            staffs5.Staff__c=staff.Id;
            staffs5.Role__c='Admin';
            staffs5.Status__c='Accepted';
            staffs5.Long_Morning_Start_Time__c=Time.newInstance(9, 30, 00, 00);
            staffs5.Long_Morning_End_Time__c=Time.newInstance(13, 30, 00, 00);
            staffs5.Long_Afternoon_Start_Time__c= Time.newInstance(13, 30, 00, 00);
            staffs5.Long_Afternoon_End_Time__c=Time.newInstance(22, 00, 00, 00);
            
            insert staffs5;
            
            Shift_Type__c shiftType = new Shift_Type__c(
                Name = 'Morning',
                Facility__c = fac.Id,
                Start_Time__c = Time.newInstance(9, 0, 0, 0),
                End_Time__c   = Time.newInstance(17, 0, 0, 0),
                Shift_Type__c = 'Morning',
                Colour__c = '#222222'
            );
            insert shiftType;
            
            
            insert new Participant_Facility__c(
                Participant__c = cli.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            StaffDocsShare__c  staffDoc = new StaffDocsShare__c(
                Staff__c = staff.Id,
                Child_Staff__c = cs.Id
            );
            insert staffDoc;
            
            test.StartTest();
            Organisation__c orgs =[SELECT Id From Organisation__c LIMIT 1];
            String orgId = orgs.Id;
            Date startDate = Date.newInstance(2024, 10, 16);
            Date endDate = Date.newInstance(2024, 10, 24);
            list<string> shiftType66= new list<string>{'General'};
                String jsonData66 = '[{"day":"Mon","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"10-02-2025"},{"day":"Tue","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"11-02-2025"},{"day":"Wed","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"12-02-2025"},{"day":"Thu","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":0,"weekDays":"13-02-2025"},{"day":"Fri","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":1,"weekDays":"14-02-2025"},{"day":"Sat","isHoliday":false,"quantity":4,"todayLabel":"NotToday","unallocated":0,"weekDays":"15-02-2025"},{"day":"Sun","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"16-02-2025"}]';
            List<Facility__c> facList = [SELECT ID from Facility__c];
            Facility__c facs = [SELECT ID from Facility__c];
            list<string> StatusList= new list<string>();
            List<String> facString = new List<String>();
            for(Facility__c fac1:facList){
                facString.add(fac.ID);
            } 
            test.StopTest();            
        }     
    }
    
    
  @isTest
static void testShiftCompliance_CreateMode() {
      User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){

    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff  = [SELECT Id FROM Staff__c LIMIT 1];

    List<Id> staffIds = new List<Id>{ staff.Id };

    List<Date> inputDates = new List<Date>{
        Date.today(),
        Date.today().addDays(1),
Date.today().addDays(2)
    };

    Test.startTest();

    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        staffIds,
        inputDates,
        '9:30 AM',
        '10:00 PM',
        false,
        null,
        'Admin'
    );

    Test.stopTest();
  }
}

    @isTest
    static void testShiftCompliance_EditMode() {
            User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff  = [SELECT Id FROM Staff__c LIMIT 1];
        
        ShiftwithStaff__c existingShift = [
            SELECT Id
            FROM ShiftwithStaff__c
            WHERE Staff__c = :staff.Id
            LIMIT 1
        ];
        
        List<Date> inputDates = new List<Date>{
            Date.today().addDays(-1),
                Date.today()
                };
                    
                    Test.startTest();
        
        ShiftComplianceController.shiftComplianceValidations(
            fac.Id,
            new List<Id>{ staff.Id },
            inputDates,
            '6:30 PM',
            '5:30 AM',   
            true,       
            existingShift.Id,
            'Admin'
        );
        
        Test.stopTest();
    }
    }
    
    @isTest
    static void testShiftCompliance_InvalidInputs() {
            User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
        
        Test.startTest();
        
        ShiftComplianceController.shiftComplianceValidations(
            null,
            new List<Id>(),
            new List<Date>(),
            null,
            null,
            false,
            null,
            'Admin'
            
        );
        
        Test.stopTest();
    }
    }
    
    @isTest
    static void testHelperMethodsDirectly() {
            User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
        
        Test.startTest();
        
        ShiftComplianceController.rolesMatch(
            'Admin,AIN',
            new Set<String>{ 'Admin' }
        );
        
        ShiftComplianceController.parseTime('12:00 AM');
        ShiftComplianceController.parseTime('12:00 PM');
        ShiftComplianceController.parseTime('6:30 pm');
        
        Map<Id, Map<Date, List<String>>> warnings =
            new Map<Id, Map<Date, List<String>>>();
        
        ShiftComplianceController.addWarning(
            warnings,
            UserInfo.getUserId(),
            Date.today(),
            'Test Warning'
        );
        
        Test.stopTest();
    }
    }
@isTest
static void testShiftCompliance_AllViolations() {
        User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){

    Add_Shift__c baseShift =
        [SELECT Id, Facility__c FROM Add_Shift__c LIMIT 1];

    Staff__c staff =
        [SELECT Id FROM Staff__c LIMIT 1];

    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = Date.today(),
        Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0),
        Shift_End_Time__c   = Time.newInstance(22, 0, 0, 0),
        Status__c = 'Accepted',
        Attendence__c = true
    );

    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = Date.today().addDays(1),
        Shift_Start_Time__c = Time.newInstance(8, 0, 0, 0),
        Shift_End_Time__c   = Time.newInstance(22, 0, 0, 0),
        Status__c = 'Accepted',
        Attendence__c = true
    );

    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = Date.today().addDays(2),
        Shift_Start_Time__c = Time.newInstance(5, 0, 0, 0),
        Shift_End_Time__c   = Time.newInstance(10, 0, 0, 0),
        Status__c = 'Accepted',
        Attendence__c = true
    );

    Test.startTest();
    ShiftComplianceController.shiftComplianceValidations(
        baseShift.Facility__c,         
        new List<Id>{ staff.Id },
        new List<Date>{
            Date.today(),
            Date.today().addDays(1),
            Date.today().addDays(2)
        },
        '9:30 AM',
        '10:00 PM',
        false,
        null,
         'Admin'
    );

    Test.stopTest();
}
}

 @isTest
static void testMaxHoursPerShift_Violation() {
    User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '8:00 AM',
        '6:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testMaxConsecutiveDays_Violation() {
    User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Add_Shift__c baseShift = [SELECT Id, Facility__c FROM Add_Shift__c LIMIT 1];
    
    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = Date.today().addDays(-2),
        Shift_End_Date__c = Date.today().addDays(-2),
        Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
        Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
        Status__c = 'Accepted',
        Attendence__c = true
    );
    
    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = Date.today().addDays(-1),
        Shift_End_Date__c = Date.today().addDays(-1),
        Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
        Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
        Status__c = 'Accepted',
        Attendence__c = true
    );
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ 
            Date.today(),
            Date.today().addDays(1),
            Date.today().addDays(2)
        },
        '9:00 AM',
        '5:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testMaxHoursPerWeek_Violation() {
    User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Add_Shift__c baseShift = [SELECT Id, Facility__c FROM Add_Shift__c LIMIT 1];
    
    Date weekStart = Date.today().toStartOfWeek();
    
    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = weekStart,
        Shift_End_Date__c = weekStart,
        Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
        Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
        
        Status__c = 'Accepted',
        Attendence__c = true
    );
    
    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = weekStart.addDays(1),
        Shift_End_Date__c = weekStart.addDays(1),
        Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
        Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
        
        Status__c = 'Accepted',
        Attendence__c = true
    );
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ weekStart.addDays(2) },
        '9:00 AM',
        '5:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testMinHoursBetweenShifts_Violation() {
        User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Add_Shift__c baseShift = [SELECT Id, Facility__c FROM Add_Shift__c LIMIT 1];
    
    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = Date.today().addDays(-1),
        Shift_End_Date__c = Date.today().addDays(-1),
        Shift_Start_Time__c = Time.newInstance(14, 0, 0, 0),
        Shift_End_Time__c = Time.newInstance(22, 0, 0, 0),
        Status__c = 'Accepted',
        Attendence__c = true
    );
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '6:00 AM',
        '2:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testNightShift_EndTimeBeforeStartTime() {
        User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '10:00 PM',
        '6:00 AM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testRoleSpecificRule_NoMatch() {
        User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    
    insert new Facility_Compliance_Setting__c(
        Facility__c = fac.Id,
        Apply_to_specific_roles__c = true,
        Roles__c = 'Nurse',
        Max_Hours_Per_Shift__c = 4,
        Is_Active__c = true
    );
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '9:00 AM',
        '5:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testRoleSpecificRule_BlankRoles() {
    User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    
    insert new Facility_Compliance_Setting__c(
        Facility__c = fac.Id,
        Apply_to_specific_roles__c = true,
        Roles__c = '',
        Max_Hours_Per_Shift__c = 4,
        Is_Active__c = true
    );
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '9:00 AM',
        '5:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testStaffWithoutRoles() {
    User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    
    delete [SELECT Id FROM StaffRole__c WHERE StaffRole_To_Staff__c = :staff.Id];
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '9:00 AM',
        '5:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testMultiDayShift() {
    User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Add_Shift__c baseShift = [SELECT Id, Facility__c FROM Add_Shift__c LIMIT 1];
    
    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = Date.today().addDays(-5),
        Shift_End_Date__c = Date.today().addDays(-3),
        Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
        Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
        Status__c = 'Accepted',
        Attendence__c = true
    );
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '9:00 AM',
        '5:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testRolesMatchHelper_NullRoles() {
    User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1){
    Test.startTest();
    
    Boolean result1 = ShiftComplianceController.rolesMatch(
        null,
        new Set<String>{ 'Admin' }
    );
    
    Boolean result2 = ShiftComplianceController.rolesMatch(
        '',
        new Set<String>{ 'Admin' }
    );
    
    Test.stopTest();
}
}

@isTest
static void testParseTime_EdgeCases() {
        User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
    Test.startTest();
    
    Time time1 = ShiftComplianceController.parseTime('1:00 AM');
    Time time2 = ShiftComplianceController.parseTime('1:00 PM');
    Time time3 = ShiftComplianceController.parseTime('11:30 AM');
    Time time4 = ShiftComplianceController.parseTime('11:30 PM');
    
    Test.stopTest();
}
}

@isTest
static void testNightShiftWithPreviousShift() {
        User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Add_Shift__c baseShift = [SELECT Id, Facility__c FROM Add_Shift__c LIMIT 1];
    
    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = Date.today().addDays(-1),
        Shift_End_Date__c = Date.today().addDays(-1),
        Shift_Start_Time__c = Time.newInstance(22, 0, 0, 0),
        Shift_End_Time__c = Time.newInstance(2, 0, 0, 0),
        Status__c = 'Accepted',
        Attendence__c = true
    );
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '10:00 AM',
        '6:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testMultipleInputDates() {
        User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    
    List<Date> dates = new List<Date>();
    for (Integer i = 0; i < 5; i++) {
        dates.add(Date.today().addDays(i));
    }
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        dates,
        '9:00 AM',
        '5:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testNonRoleSpecificRule() {
        User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    
    insert new Facility_Compliance_Setting__c(
        Facility__c = fac.Id,
        Apply_to_specific_roles__c = false,
        Max_Hours_Per_Shift__c = 4,
        Is_Active__c = true
    );
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '9:00 AM',
        '2:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testWeeklyHoursWithNullDuration() {
        User u1= [SELECT Id from User where email='manualtesting.20294637455@hotmail.com' LIMIT 1];
        System.runAs(u1){
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    Add_Shift__c baseShift = [SELECT Id, Facility__c FROM Add_Shift__c LIMIT 1];
    
    insert new ShiftwithStaff__c(
        Add_Shift__c = baseShift.Id,
        Staff__c = staff.Id,
        Start_Date__c = Date.today().toStartOfWeek(),
        Shift_End_Date__c = Date.today().toStartOfWeek(),
        Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
        Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
        Status__c = 'Accepted',
        Attendence__c = true
    );
    
    Test.startTest();
    
    ShiftComplianceController.shiftComplianceValidations(
        fac.Id,
        new List<Id>{ staff.Id },
        new List<Date>{ Date.today() },
        '9:00 AM',
        '5:00 PM',
        false,
        null,
         'Admin'
    );
    
    Test.stopTest();
}
}

@isTest
static void testShiftRoleFilter_BlankRuleRoles() {
    User u1 = [SELECT Id FROM User WHERE email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1) {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        insert new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Apply_to_specific_roles__c = false,
            Roles__c = '',
            Max_Hours_Per_Shift__c = 4,
            Is_Active__c = true
        );
        
        Test.startTest();
        
        ShiftComplianceController.shiftComplianceValidations(
            fac.Id,
            new List<Id>{ staff.Id },
            new List<Date>{ Date.today() },
            '9:00 AM',
            '5:00 PM',
            false,
            null,
            'Admin'
        );
        
        Test.stopTest();
    }
}

@isTest
static void testApplyToSpecificRoles_StaffRoleMismatch() {
    User u1 = [SELECT Id FROM User WHERE email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1) {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        insert new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Apply_to_specific_roles__c = true,
            Roles__c = 'Nurse,Doctor',
            Max_Hours_Per_Shift__c = 4,
            Is_Active__c = true
        );
        
        Test.startTest();
        
        ShiftComplianceController.shiftComplianceValidations(
            fac.Id,
            new List<Id>{ staff.Id },
            new List<Date>{ Date.today() },
            '9:00 AM',
            '5:00 PM',
            false,
            null,
            'Admin'
        );
        
        Test.stopTest();
    }
}

@isTest
static void testMaxConsecutiveDays_ExceedsBeforeInputDates() {
    User u1 = [SELECT Id FROM User WHERE email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1) {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Add_Shift__c baseShift = [SELECT Id, Facility__c FROM Add_Shift__c LIMIT 1];
        
        insert new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Apply_to_specific_roles__c = false,
            Max_Consecutive_Days__c = 1,
            Is_Active__c = true
        );
        
        insert new ShiftwithStaff__c(
            Add_Shift__c = baseShift.Id,
            Staff__c = staff.Id,
            Start_Date__c = Date.today().addDays(-2),
            Shift_End_Date__c = Date.today().addDays(-2),
            Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
            Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
            Status__c = 'Accepted',
            Attendence__c = true
        );
        
        insert new ShiftwithStaff__c(
            Add_Shift__c = baseShift.Id,
            Staff__c = staff.Id,
            Start_Date__c = Date.today().addDays(-1),
            Shift_End_Date__c = Date.today().addDays(-1),
            Shift_Start_Time__c = Time.newInstance(9, 0, 0, 0),
            Shift_End_Time__c = Time.newInstance(17, 0, 0, 0),
            Status__c = 'Accepted',
            Attendence__c = true
        );
        
        Test.startTest();
        
        ShiftComplianceController.shiftComplianceValidations(
            fac.Id,
            new List<Id>{ staff.Id },
            new List<Date>{ 
                Date.today(),
                Date.today().addDays(1)
            },
            '9:00 AM',
            '5:00 PM',
            false,
            null,
            'Admin'
        );
        
        Test.stopTest();
    }
}

@isTest
static void testMinHoursBetweenShifts_NightShiftPrevious() {
    User u1 = [SELECT Id FROM User WHERE email='manualtesting.20294637455@hotmail.com' LIMIT 1];
    System.runAs(u1) {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Add_Shift__c baseShift = [SELECT Id, Facility__c FROM Add_Shift__c LIMIT 1];
        
        insert new ShiftwithStaff__c(
            Add_Shift__c = baseShift.Id,
            Staff__c = staff.Id,
            Start_Date__c = Date.today().addDays(-1),
            Shift_End_Date__c = Date.today(),
            Shift_Start_Time__c = Time.newInstance(23, 0, 0, 0),
            Shift_End_Time__c = Time.newInstance(6, 0, 0, 0),
            Status__c = 'Accepted',
            Attendence__c = true
        );
        
        Test.startTest();
        
        ShiftComplianceController.shiftComplianceValidations(
            fac.Id,
            new List<Id>{ staff.Id },
            new List<Date>{ Date.today() },
            '10:00 AM',
            '6:00 PM',
            false,
            null,
            'Admin'
        );
        
        Test.stopTest();
    }
}
   
}