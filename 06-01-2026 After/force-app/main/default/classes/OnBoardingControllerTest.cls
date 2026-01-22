@isTest
public class OnBoardingControllerTest {

    // =========================================================================
    // TEST DATA
    // =========================================================================
    @testSetup 
    static void testData() {

        List<String> picklistRoles = new List<String>();
        // If you want dynamic roles from picklist, uncomment these lines:
        // for (Schema.PicklistEntry pe : Organisation__c.Roles__c.getDescribe().getPicklistValues()) {
        //     picklistRoles.add(pe.getValue());
        // }
        
        // Fallback roles if picklist is empty (sandbox / scratch org, etc.)
        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN'});
        }
        
        String role1 = picklistRoles[0];
        String role2 = picklistRoles.size() > 1 ? picklistRoles[1] : role1;
        
        // ---- Organisation ----
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
        org.Roles__c = role1 + ';' + role2;
        insert org;
        
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen',
            Email= 'manualtesting.20294637@hotmail.com', 
            EmailEncodingKey='UTF-8',
            LastName='StaffOne209463',
            LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey='America/New_York', 
            User_Type__c='NDIS Org Admin',
            UserName='manualtesting.20294637@hotmail.com',
            Organization_Name__c ='Ashfield Consultants'
        );
        insert user;
        
        System.runAs(user){   
            // ---- Facility ----
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
            fac.Type_of_Service__c='Ndis';
            insert fac;

            // ---- Base Onboarding + Portal Account (for other tests) ----
            Onboarding__c baseOb = new Onboarding__c(
                Email__c = 'baseonboard@test.com',
                User_Type__c = 'Roster Manager',
                Role__c = 'Portal Account Partner Manager',
                Facility__c = fac.Id,
                Organization__c = org.Id,
                Status__c = 'Request Sent'
            );
            insert baseOb;

            Account portalAccount = new Account(Name = 'Portal Account');
            insert portalAccount;

            // ---- Staff ----
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= user.Email;
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
            staff.Emp_exit_date__c = Date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = Date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = Date.newInstance(2001, 02, 04);
            staff.Role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = Date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            insert staff; 
            
            StaffRole__c sr = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Hourly_Rate__c = 50
            );
            insert sr;
            
            Child_Staff__c cs = new Child_Staff__c();
            cs.Expiry_Date__c = Date.newInstance(2028, 01, 05); 
            cs.Staff__c=staff.Id;
            cs.Comments__c='test ';
            insert cs;
            
            Training__c tra = new Training__c();             
            tra.description__c = 'Test Description';
            tra.Name = 'LWC';
            tra.start_date__c = Date.newInstance(2025, 02, 05);
            tra.end_date__c   = Date.newInstance(2025, 02, 20);
            tra.Organization_Name__c = 'Ashfield Consultants';
            insert tra;
            
            Assignment__c assign = new Assignment__c();
            assign.Module_Name__c = tra.Id;
            assign.Staff__c = staff.Id;
            assign.Completed_Date__c = Date.newInstance(2025, 02, 14);
            assign.Organization_Name__c = 'Ashfield Consultants';
            insert assign;
            
            Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c = Date.newInstance(2024, 10, 16);
            shift.End_Date__c   = Date.newInstance(2024, 10, 24);
            shift.Direction__c  = dire.Id;
            shift.Role__c       = 'Admin';
            shift.Get_Facility__c=true;
            shift.Quantity__c=5;
            shift.Start_Time__c=Time.newInstance(3, 30, 0, 0);
            shift.End_Time__c  =Time.newInstance(5, 0, 0, 0);
            shift.Facility__c=fac.Id;
            shift.Status__c='Draft';
            shift.Start_time_picklist__c='3:30 am';
            shift.End_time_picklist__c  ='5:00 am';
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
            staffs.Log_In_Date_Time__c = Time.newInstance(1, 30, 0, 0);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 0, 0, 0);
            insert staffs;
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift1.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 12, 16); 
            shift1.End_Date__c   =Date.newInstance(2024, 10, 24);
            shift1.Role__c='Admin';
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_Time__c=Time.newInstance(18, 30, 0, 0);
            shift1.End_Time__c  =Time.newInstance(22, 0, 0, 0);
            shift1.Facility__c=fac.Id;
            shift1.Status__c='Draft';
            shift1.Start_time_picklist__c='6:30 pm';
            shift1.End_time_picklist__c  ='10:00 pm';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='Night';
            shift1.Start_Time_Text__c = '6:30 pm';
            shift1.End_Time_Text__c   = '10:00 pm';
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
            shift2.Start_Date__c =Date.newInstance(2024, 8, 20);        
            shift2.Role__c='Admin';
            shift2.Get_Facility__c=true;
            shift2.Quantity__c=5;
            shift2.Start_Time__c=Time.newInstance(18, 30, 0, 0);
            shift2.End_Time__c  =Time.newInstance(22, 0, 0, 0);
            shift2.Facility__c=fac.Id;
            shift2.Status__c='Draft';
            shift2.Start_time_picklist__c='6:30 pm';
            shift2.End_time_picklist__c  ='10:00 pm';
            shift2.Location__StateCode__s = 'ACT';
            shift2.Location__CountryCode__s = 'AU';
            shift2.Location__PostalCode__s = '2911';
            shift2.Shift_Type__c='Custom';
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
            shift3.Start_Date__c =Date.newInstance(2024, 1, 1);        
            shift3.Role__c='Admin';
            shift3.Get_Facility__c=true;
            shift3.Quantity__c=5;
            shift3.Start_Time__c=Time.newInstance(18, 30, 0, 0);
            shift3.End_Time__c  =Time.newInstance(22, 0, 0, 0);
            shift3.Facility__c=fac.Id;
            shift3.Status__c='Draft';
            shift3.Start_time_picklist__c='6:30 pm';
            shift3.End_time_picklist__c  ='10:00 pm';
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
            shift4.Start_Date__c =Date.newInstance(2025, 1, 1);        
            shift4.Role__c='Admin';
            shift4.Get_Facility__c=true;
            shift4.Quantity__c=5;
            shift4.Start_Time__c=Time.newInstance(9, 30, 0, 0);
            shift4.End_Time__c  =Time.newInstance(22, 0, 0, 0);
            shift4.Facility__c=fac.Id;
            shift4.Status__c='Draft';
            shift4.Start_time_picklist__c='6:30 pm';
            shift4.End_time_picklist__c  ='10:00 pm';
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
            staffs4.Long_Morning_Start_Time__c=Time.newInstance(9, 30, 0, 0);
            staffs4.Long_Morning_End_Time__c=Time.newInstance(13, 30, 0, 0);
            staffs.Long_Afternoon_Start_Time__c=Time.newInstance(13, 30, 0, 0);
            staffs.Long_Afternoon_End_Time__c  =Time.newInstance(22, 0, 0, 0);
            insert staffs4;
            
            NDIS_Support_Catalogue__c NSC = new NDIS_Support_Catalogue__c();
            NSC.Name = 'Assistance Animals';
            NSC.ACT__c = 100;
            NSC.NSW__c =100;
            NSC.NT__c = 100;
            NSC.QLD__c = 100;
            NSC.SA__c  = 100;
            NSC.TAS__c = 100;
            NSC.VIC__c = 100;
            NSC.WA__c  = 100;
            insert NSC;
            
            Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c  = 'Participant2948';
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
            funds.Approved_Date__c = Date.newInstance(2024, 3, 16);
            insert funds;
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Qty__c=5;
            services.GST__c='No';
            services.Date_of_Service__c = System.today();
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c   = '5:30 am';
            services.ShiftwithStaff__c=staffs.Id;
            insert services;
            
            Reimbursement__c rei = new Reimbursement__c();
            rei.Mileage__c='30';
            rei.ShiftwithStaff__c=staffs.Id; 
            rei.Approval_Status__c='Approved';
            insert rei;
            
            List<Add_Shift_Checklist__c> checklistRecords = new List<Add_Shift_Checklist__c>();
            for (Integer i = 0; i < 2; i++) {
                checklistRecords.add(new Add_Shift_Checklist__c(
                    Completed__c = false,
                    Add_Shift__c = shift1.Id
                ));
            }
            insert checklistRecords;
            
            ShiftWithStaff_Activity__c staffActivity = new ShiftWithStaff_Activity__c();
            staffActivity.ShiftwithStaff__c = staffs1.Id;
            insert staffActivity;
            
            String jsonData = '{"serviceTypeId":"' + funds.Id + 
                              '","serviceGroupId":"' + NSC.Id + 
                              '","participantId":"' + cli.Id + '"}';
            
            Add_Shift__c shift5 = new Add_Shift__c();
            shift5.Break__c = '30';
            shift5.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift5.Start_Date__c =Date.newInstance(2024, 2, 1);        
            shift5.Role__c='Admin';
            shift5.Get_Facility__c=true;
            shift5.Quantity__c=5;
            shift5.Start_Time__c=Time.newInstance(18, 30, 0, 0);
            shift5.End_Time__c  =Time.newInstance(22, 0, 0, 0);
            shift5.Facility__c=fac.Id;
            shift5.Status__c='Draft';
            shift5.Start_time_picklist__c='6:30 pm';
            shift5.End_time_picklist__c  ='10:00 pm';
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
            staffs5.Long_Morning_Start_Time__c=Time.newInstance(9, 30, 0, 0);
            staffs5.Long_Morning_End_Time__c =Time.newInstance(13, 30, 0, 0);
            staffs5.Long_Afternoon_Start_Time__c=Time.newInstance(13, 30, 0, 0);
            staffs5.Long_Afternoon_End_Time__c  =Time.newInstance(22, 0, 0, 0);
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
        }
    }

    // =========================================================================
    // BASIC TESTS FOR OTHER ONBOARDING METHODS (optional but useful)
    // =========================================================================

    @isTest
    static void testCreateOnboardingRawAndEmail() {
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Organisation__c = :org.Id LIMIT 1];

        List<Map<String, Object>> rows = new List<Map<String, Object>>();
        rows.add(new Map<String, Object>{
            'email'    => 'newstaff@test.com',
            'userType' => 'Staff',
            'role'     => 'Portal Account Partner Manager'
        });

        Test.startTest();
        List<OnBoardingController.Result> results =
            OnBoardingController.createOnboardingRawAndEmail(
                rows,
                'https://example.com',
                fac.Id,
                org.Id
            );
        Test.stopTest();
    }

    @isTest
    static void testSendOnboardingEmails() {
        Onboarding__c ob = [SELECT Id FROM Onboarding__c LIMIT 1];

        Test.startTest();
        List<OnBoardingController.Result> res =
            OnBoardingController.sendOnboardingEmails(
                new List<Id>{ob.Id},
                'https://example.com/onboard'
            );
        Test.stopTest();
    }

    @isTest
    static void testSendOnboardingReminderEmails() {
        Onboarding__c ob = [SELECT Id FROM Onboarding__c LIMIT 1];

        Test.startTest();
        List<OnBoardingController.Result> res =
            OnBoardingController.sendOnboardingReminderEmails(
                new List<Id>{ob.Id},
                'https://example.com/onboard'
            );
        Test.stopTest();
    }

    @isTest
    static void testSaveOnboardingReceivedDataR() {
        Onboarding__c ob = [SELECT Id, Organization__c FROM Onboarding__c LIMIT 1];

        Test.startTest();
        OnBoardingController.SaveResultDTO res =
            OnBoardingController.saveOnboardingReceivedDataR(
                ob.Id,
                '{"data":"sample"}',
                true
            );
        Test.stopTest();
    }

    @isTest
    static void testApproveOnboarding() {
        Onboarding__c ob = [SELECT Id FROM Onboarding__c LIMIT 1];
        ob.Status__c = 'Data Received';
        update ob;

        // address object WITHOUT country to hit address-country injection helper
        String payload = '{"address":{"line1":"123 Main St","city":"Sydney"}}';

        Test.startTest();
        OnBoardingController.SaveResultDTO res =
            OnBoardingController.approveOnboarding(ob.Id, true, payload);
        Test.stopTest();
    }

    @isTest
    static void testGetOnboardingListAndCounts() {
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Organisation__c = :org.Id LIMIT 1];

        Test.startTest();
        List<OnBoardingController.RowDTO> listRes =
            OnBoardingController.getOnboardingList(10, fac.Id, org.Id);
        OnBoardingController.CountDTO dto =
            OnBoardingController.getOnboardingCounts(fac.Id, org.Id);
        Test.stopTest();
    }

    @isTest
    static void testIsLinkActive() {
        Onboarding__c ob = [SELECT Id FROM Onboarding__c LIMIT 1];
        ob.Link_Active__c = true;
        update ob;

        Test.startTest();
        Boolean active = OnBoardingController.isLinkActive(ob.Id);
        Test.stopTest();
    }

    @isTest
    static void testGetOrgLogoAndFacilityManager() {
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Organisation__c = :org.Id LIMIT 1];

        Test.startTest();
        String logo = OnBoardingController.getOrgLogoUrlById(org.Id);
        String mgr  = OnBoardingController.getFacilityManagerName(fac.Id);
        Test.stopTest();
    }

    @isTest
    static void testGetEmailNotSentAndByOrg() {
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Organisation__c = :org.Id LIMIT 1];

        Test.startTest();
        List<Onboarding__c> listOb =
            OnBoardingController.getEmailNotSent(org.Id, fac.Id, 10);
        OnBoardingController.getOnboardingListByOrg(200, org.Id);
        Test.stopTest();
    }

    @isTest
    static void testUtilityMethodsAndFirstDml() {
        Onboarding__c ob = [
            SELECT Id, Email_Sent_Last_Error__c, Role__c
            FROM Onboarding__c
            LIMIT 1
        ];
        Id onboardId = ob.Id;

        Test.startTest();
        OnBoardingController.getReceivedData(onboardId);
        OnBoardingController.eqIgnoreCase('Test1', 'Test2');  
        OnBoardingController.safeName('Maheswari', 'A');
        OnBoardingController.safeDecimal('Mahii');
        OnBoardingController.dateFromIso('iso');
        OnBoardingController.safeParseDDMMYYYY('10/05/2024');
        OnBoardingController.sVal(123);
        OnBoardingController.parseBooleanFlexible('true');
        
        Account a = new Account(Name = 'Test Account');
        Database.SaveResult sr = Database.insert(a, false);
        String errorMsg = OnBoardingController.firstDml(sr, 'Insert');
        
        List<Map<String, String>> records = new List<Map<String, String>>();
        Map<String, String> rec1 = new Map<String, String>{
            'EmailAddress' => 'test@example.com',
            'Name'         => 'John'
        };
        Map<String, String> rec2 = new Map<String, String>{
            'EmailAddress' => 'other@example.com',
            'Name'         => 'Jane'
        };
        records.add(rec1);
        records.add(rec2);

        Map<String, String> found =
            OnBoardingController.findSourceByEmail(records, 'test@example.com');
        Map<String, String> notFound =
            OnBoardingController.findSourceByEmail(records, 'missing@example.com');
        Test.stopTest();
    }

    // =========================================================================
    // KEY TEST: createAccountsContactsAndStaff – covers all the snippets you
    //           listed (maps from onboarding, active logic, special role, etc.)
    // =========================================================================
@isTest
static void testCreateAccountsContactsAndStaff_OnboardingRoleAndActiveVariants() {

    Organisation__c org = [
        SELECT Id, Name
        FROM Organisation__c
        WHERE Name = 'Ashfield Consultants'
        LIMIT 1
    ];
    Facility__c fac = [
        SELECT Id, Name
        FROM Facility__c
        WHERE Organisation__c = :org.Id
        LIMIT 1
    ];

    // --- Onboarding records to build onboardingRoleByEmail & latestOnbByEmail ---

    // 1) Has Role__c and employment.status in JSON
    //    Role__c uses valid picklist: "Portal account partner User"
    //    User_Type__c uses valid picklist: "NDIS Staff"
    Onboarding__c ob1 = new Onboarding__c(
        Email__c        = 'staff1@test.com',
        Role__c         = 'Portal account partner User',
        User_Type__c    = 'NDIS Staff',
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Reviewed',
        Recieved_Data__c = '{"employment":{"status":"Active"}}'
    );

    // 2) No Role__c (to trigger "Missing Role__c on Onboarding for ..." branch)
    //    User_Type__c uses valid picklist: "HR Admin"
    Onboarding__c ob2 = new Onboarding__c(
        Email__c        = 'norole@test.com',
        Role__c         = null,
        User_Type__c    = 'HR Admin',
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Reviewed'
    );

    // 3) Special case: Portal account partner Manager + NDIS Participant
    //    Role__c = "Portal account partner Manager" (valid picklist)
    //    User_Type__c = "NDIS Participant" (valid picklist)
    Onboarding__c ob3 = new Onboarding__c(
        Email__c        = 'special@test.com',
        Role__c         = 'Portal account partner Manager',
        User_Type__c    = 'NDIS Participant',
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Reviewed',
        Recieved_Data__c =
            '{"person":{"firstName":"Part","lastName":"Icipant","gender":"Male","dateOfBirth":"1990-01-01","email":"special@test.com"},' +
            '"primaryContact":{"firstName":"PCFirst","lastName":"PCLast","phone":"0400000000","email":"pc@test.com","relationship":"Parent"}}'
    );

    insert new List<Onboarding__c>{ ob1, ob2, ob3 };

    // --- Records going into createAccountsContactsAndStaff ---

    List<Map<String, String>> records = new List<Map<String,String>>();

    // A) staff1@test.com
    //    - roledata comes from ob1.Role__c ("Portal account partner User")
    //    - Active: from JSON employment.status = Active
    //    - UserAccountNeeded = true to hit emailNeedsUser == true branch
    //    - UserType uses valid picklist: "NDIS Staff"
    Map<String,String> recA = new Map<String,String>{
        'EmailAddress'      => 'staff1@test.com',
        'FirstName'         => 'Staff',
        'LastName'          => 'One',
        'Gender'            => 'Male',
        'PhoneNumber'       => '111111111',
        'UserType'          => 'NDIS Staff',
        'HourlyRate'        => '25.5',
        'StartDate'         => '10/10/2024',
        'DateofBirth'       => '10/10/1990',
        'Facility'          => fac.Name,
        'Status'            => 'Active',
        'UserAccountNeeded' => 'true'
    };
    records.add(recA);

    // B) norole@test.com
    //    - onboardingRoleByEmail.get(email) is null -> "Missing Role__c..." error
    Map<String,String> recB = new Map<String,String>{
        'EmailAddress' => 'norole@test.com',
        'FirstName'    => 'No',
        'LastName'     => 'Role',
        'Facility'     => fac.Name,
        'Status'       => 'Active'
    };
    records.add(recB);

    // C) special@test.com
    //    - roledata = "Portal account partner Manager"
    //    - UserType = "NDIS Participant"
    Map<String,String> recC = new Map<String,String>{
        'EmailAddress' => 'special@test.com',
        'FirstName'    => 'Special',
        'LastName'     => 'Case',
        'Gender'       => 'Female',
        'PhoneNumber'  => '222222222',
        'UserType'     => 'NDIS Participant',
        'Facility'     => fac.Name,
        'Status'       => 'Active'
    };
    records.add(recC);

    // D) Another record with explicit "Active" flag
    //    Role__c uses valid picklist; User_Type__c uses valid picklist
    Onboarding__c ob4 = new Onboarding__c(
        Email__c        = 'activeflag@test.com',
        Role__c         = 'Portal account partner User',
        User_Type__c    = 'NDIS Staff',
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Reviewed'
    );
    insert ob4;

    Map<String,String> recD = new Map<String,String>{
        'EmailAddress' => 'activeflag@test.com',
        'FirstName'    => 'Active',
        'LastName'     => 'Flag',
        'Gender'       => 'Male',
        'PhoneNumber'  => '333333333',
        'UserType'     => 'NDIS Staff',
        'Facility'     => fac.Name,
        'Active'       => 'true'
    };
    records.add(recD);

    Test.startTest();
    Map<String, Object> result =
        OnBoardingController.createAccountsContactsAndStaff(records);
    Test.stopTest();
}

    // =========================================================================
    // createAccountsContactsAndStaff – Empty input to hit simple response.put(...)
    // =========================================================================
    @isTest
    static void testCreateAccountsContactsAndStaff_EmptyInput() {
        List<Map<String, String>> records = new List<Map<String, String>>();

        Test.startTest();
        Map<String, Object> result =
            OnBoardingController.createAccountsContactsAndStaff(records);
        Test.stopTest();
        // This makes sure the final:
        // response.put('successRecords', successRecords);
        // response.put('failedRecords', failedRecords);
        // response.put('participantCreationAttemptedCount', 0);
        // response.put('participantCreationCreatedCount',   0);
        // response.put('participantCreationFailedCount',    0);
        // response.put('participantCreationResults',        participantResults);
        // return response;
        // is executed even when nothing was processed.
    }
    
@isTest
static void testCreateAccountsContactsAndStaff_StaffContactClientFlow() {
    Organisation__c org = [
        SELECT Id, Name
        FROM Organisation__c
        WHERE Name = 'Ashfield Consultants'
        LIMIT 1
    ];
    Facility__c fac = [
        SELECT Id, Name
        FROM Facility__c
        WHERE Organisation__c = :org.Id
        LIMIT 1
    ];

    // Ensure a Portal Account exists
    Account portalAccount = new Account(Name = 'Portal Account');
    insert portalAccount;

    // ----------------------------------------------------------------
    // 1. Onboarding records that drive role + active + participant logic
    // ----------------------------------------------------------------

    // A) Normal staff onboarding
    //    Role__c = "Portal account partner User"
    //    User_Type__c = "NDIS Staff"
    Onboarding__c obStaff = new Onboarding__c(
        Email__c        = 'staffbulk1@test.com',
        Role__c         = 'Portal account partner User',
        User_Type__c    = 'NDIS Staff',
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Reviewed',
        Recieved_Data__c = '{"employment":{"status":"Active"}}'
    );

    // B) Special case:
    //    Role__c = "Portal account partner Manager"
    //    User_Type__c = "NDIS Participant"
    Onboarding__c obSpecial = new Onboarding__c(
        Email__c        = 'specialbulk@test.com',
        Role__c         = 'Portal account partner Manager',
        User_Type__c    = 'NDIS Participant',
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Reviewed',
        Recieved_Data__c =
            '{"person":{"firstName":"Part","lastName":"Icipant","gender":"Male","dateOfBirth":"1990-01-01","email":"specialbulk@test.com"},' +
            '"primaryContact":{"firstName":"PCFirst","lastName":"PCLast","phone":"0400000000","email":"pc@example.com","relationship":"Parent"}}'
    );

    insert new List<Onboarding__c>{ obStaff, obSpecial };

    // ----------------------------------------------------------------
    // 2. Incoming records (like PortalUserController bulk upload)
    // ----------------------------------------------------------------
    List<Map<String, String>> records = new List<Map<String, String>>();

    // Row 1: normal staff (Status = Reviewed, EmploymentStatus = Active)
    Map<String, String> recStaff = new Map<String, String>{
        'EmailAddress'      => 'staffbulk1@test.com',
        'FirstName'         => 'Staff',
        'LastName'          => 'BulkOne',
        'Status'            => 'Reviewed',
        'Facility'          => fac.Name,
        'UserAccountNeeded' => 'true',
        'EmploymentStatus'  => 'Active',
        'Gender'            => 'Male',
        'PhoneNumber'       => '0400000001',
        'UserType'          => 'NDIS Staff',
        'HourlyRate'        => '25.5',
        'StartDate'         => '01/01/2025',
        'DateofBirth'       => '01/01/1990',
        'AddressStreet'     => '7 Glen Street',
        'AddressCity'       => 'Eastwood',
        'AddressState'      => 'NSW',
        'AddressPostCode'   => '2122',
        'AddressCountry'    => 'AU',
        'TaxFileNumber'     => '123456789',
        'TaxFreeThreshold'  => 'With Tax Free Threshold'
    };
    records.add(recStaff);

    // Row 2: special Portal account partner Manager + NDIS Participant
    Map<String, String> recSpecial = new Map<String, String>{
        'EmailAddress'    => 'specialbulk@test.com',
        'FirstName'       => 'Special',
        'LastName'        => 'Bulk',
        'Status'          => 'Reviewed',
        'Facility'        => fac.Name,
        'UserType'        => 'NDIS Participant',
        'Gender'          => 'Female',
        'PhoneNumber'     => '0400000002',
        'AddressStreet'   => '123 King St',
        'AddressCity'     => 'Sydney',
        'AddressState'    => 'NSW',
        'AddressPostCode' => '2000',
        'AddressCountry'  => 'AU'
    };
    records.add(recSpecial);

    // Row 3: bad email → forces Contact insert failure branch
    Map<String, String> recBad = new Map<String, String>{
        'EmailAddress'      => 'bad-ack',  // invalid for Contact.Email
        'FirstName'         => 'Bad',
        'LastName'          => 'Email',
        'Status'            => 'Reviewed',
        'Facility'          => fac.Name,
        'UserAccountNeeded' => 'false'
    };
    records.add(recBad);

    // ----------------------------------------------------------------
    // 3. Call method under test
    // ----------------------------------------------------------------
    Test.startTest();
    Map<String, Object> result =
        OnBoardingController.createAccountsContactsAndStaff(records);
    Test.stopTest();

    // No System.assert* calls, as requested.
}
@isTest
static void testCreateAccountsContactsAndStaff_ClientCreationFromOnboardingJson() {
    // Re-use org & facility created in @testSetup
    Organisation__c org = [
        SELECT Id, Name
        FROM Organisation__c
        WHERE Name = 'Ashfield Consultants'
        LIMIT 1
    ];
    Facility__c fac = [
        SELECT Id, Name
        FROM Facility__c
        WHERE Organisation__c = :org.Id
        LIMIT 1
    ];

    // Unique email so we don't clash with any other tests
    String uniqueSuffix = String.valueOf(System.currentTimeMillis());
    String specialEmail = 'client' + uniqueSuffix + '@test.com';

    // Onboarding record that SHOULD trigger client creation:
    //   roleLc == 'portal account partner manager'
    //   utLc   == 'ndis participant'
    Onboarding__c ob = new Onboarding__c(
        Email__c        = specialEmail,
        Role__c         = 'Portal account partner Manager',  // valid picklist
        User_Type__c    = 'NDIS Participant',                // valid picklist
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Reviewed',
        Recieved_Data__c =
            '{"person":{"firstName":"JsonFirst","lastName":"JsonLast","gender":"Male","dateOfBirth":"1990-01-01","email":"' + specialEmail + '"},' +
            '"primaryContact":{"firstName":"PCFirst","lastName":"PCLast","phone":"0400000000","email":"pc-json@test.com","relationship":"Parent"}}'
    );
    insert ob;

    // Input record that will:
    //  - pass Status = Reviewed
    //  - resolve Facility by Name
    //  - use same email so latestOnbByEmail / onboardingRoleByEmail pick this onboarding
    //  - have UserType = 'NDIS Participant' to keep utLc == 'ndis participant'
    List<Map<String, String>> records = new List<Map<String, String>>();
    records.add(new Map<String, String>{
        'EmailAddress'      => specialEmail,
        'FirstName'         => 'RecFirst',
        'LastName'          => 'RecLast',
        'Status'            => 'Reviewed',
        'Facility'          => fac.Name,
        'UserAccountNeeded' => 'true',
        'Gender'            => 'Male',
        'PhoneNumber'       => '0400000123',
        'UserType'          => 'NDIS Participant',
        'HourlyRate'        => '',              // let code default hourly/start for special combo if needed
        'StartDate'         => '',              // same
        'DateofBirth'       => '01/01/1990',
        'AddressStreet'     => '123 Client St',
        'AddressCity'       => 'Sydney',
        'AddressState'      => 'NSW',
        'AddressPostCode'   => '2000',
        'AddressCountry'    => 'AU',
        'TaxFileNumber'     => '123456789',
        'TaxFreeThreshold'  => 'With Tax Free Threshold'
    });

    Test.startTest();
    Map<String, Object> result =
        OnBoardingController.createAccountsContactsAndStaff(records);
    Test.stopTest();

    // This will exercise:
    //  - shouldCreateClient == true
    //  - JSON parse of person / primaryContact
    //  - Client__c creation + address copy from Staff__c
    //  - Database.insert(clientsToInsert, false) success branch
    //  - participantStatusByEmail 'Attempted' -> 'Created'
    //  - participantResults.add(...) for the Created path
}
@isTest
static void testGetOnboardingCounts_StatusTimelineCoverage() {
    Organisation__c org = [
        SELECT Id, Name
        FROM Organisation__c
        WHERE Name = 'Ashfield Consultants'
        LIMIT 1
    ];
    Facility__c fac = [
        SELECT Id, Name
        FROM Facility__c
        WHERE Organisation__c = :org.Id
        LIMIT 1
    ];

    // One record per status we want to hit: "Data Received", "Reviewed", "Created"
    Onboarding__c obReceived = new Onboarding__c(
        Email__c        = 'status_received@test.com',
        User_Type__c    = 'Roster Manager',
        Role__c         = 'Portal account partner Manager',
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Data Received'
    );

    Onboarding__c obReviewed = new Onboarding__c(
        Email__c        = 'status_reviewed@test.com',
        User_Type__c    = 'Roster Manager',
        Role__c         = 'Portal account partner Manager',
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Reviewed'
    );

    Onboarding__c obCreated = new Onboarding__c(
        Email__c        = 'status_created@test.com',
        User_Type__c    = 'Roster Manager',
        Role__c         = 'Portal account partner Manager',
        Facility__c     = fac.Id,
        Organization__c = org.Id,
        Status__c       = 'Created'
    );

    insert new List<Onboarding__c>{ obReceived, obReviewed, obCreated };

    Test.startTest();
    // This will walk through the status records and execute:
    //  out.received, out.reviewed, out.created = ...
    OnBoardingController.CountDTO dto =
        OnBoardingController.getOnboardingCounts(fac.Id, org.Id);
    Test.stopTest();
}
@isTest
static void testGetExistingEmails_AllSources() {
    // Grab one of each from setup data
    User u = [
        SELECT Id, Email
        FROM User
        WHERE Email LIKE 'manualtesting.2029%' 
        LIMIT 1
    ];

    Staff__c staff = [
        SELECT Id, Email_Address__c
        FROM Staff__c
        WHERE Email_Address__c = :u.Email
        LIMIT 1
    ];

    Client__c cli = [
        SELECT Id, Email__c
        FROM Client__c
        WHERE Email__c != null
        LIMIT 1
    ];

    Onboarding__c ob = [
        SELECT Id, Email__c
        FROM Onboarding__c
        WHERE Email__c != null
        LIMIT 1
    ];

    // Build an email list with:
    //  - user/staff same email (so Staff__c overwrites "User")
    //  - client email
    //  - onboarding email
    //  - some null/blank variants to hit trimming/skip logic
    List<String> emails = new List<String>{
        u.Email,                       // User + Staff__c
        cli.Email__c,                  // Client__c
        ob.Email__c,                   // Onboarding__c
        null,
        '   ',                         // blank after trim
        u.Email.toUpperCase()          // tests toLowerCase key logic
    };

    Test.startTest();
    Map<String, String> res = OnBoardingController.getExistingEmails(emails);
    Test.stopTest();

}


}