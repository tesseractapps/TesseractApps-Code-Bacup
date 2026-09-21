@isTest
public class RosterTemplateControllerTest {
    
    @testSetup
    static void setupTestData() {
        Organisation__c org = new Organisation__c();
        org.Name='Age Grace Innovations';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='saieswar.k@tesseractapps.com';
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
        
        Profile p = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User u = new User(
            Alias='tuser',
            Email='saieswar.k123@tesseractapps.com',
            EmailEncodingKey='UTF-8',
            LastName='User',
            LanguageLocaleKey='en_US',
            LocaleSidKey='en_US',
            TimeZoneSidKey='Australia/Sydney',
            ProfileId=p.Id,
            UserName='testuser+' + System.currentTimeMillis() + '@test.com'
        );
        insert u;
        
        System.runAs(u) {
            Facility__c fac = new Facility__c();
            fac.Name='Age Grace Facility';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'saieswar.k@tesseractapps.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12345678912';
            fac.Phone__c = '12323432';
            insert fac;
            
            Staff__c staff = new Staff__c(
                Name = 'Test Staff',
                Facility__c=fac.Id,
                Last_Name__c='Test staff',
                Contact_Number__c='56789908743',
                Email_Address__c = 'saieswar.k123@tesseractapps.com', 
                Address__Street__s='8 Keewong Street',
                Address__City__s = 'Crace',
                Address__StateCode__s='ACT',
                Address__PostalCode__s='2911',
                Emergency_Phone_Number__c='45678766675',
                Primary_Contact_Name__c='Praveen',
                Primary_Contact_Number__c='9908458298',
                Make_Primary_as_Approver__c=true,
                Primary_Contact_Email__c='praveenshesham.sps@gmail.com',
                Secondary_Contact_Name__c='maheswari',
                Secondary_Contact_Email__c='maheswari.adabalap@gmail.com',
                Make_Secondary_as_Approver__c=false,
                Secondary_Contact_Number__c='99084582958',
                Emp_exit_date__c = date.newInstance(2028, 01, 05),
                Emp_Start_Date__c = date.newInstance(2023, 02, 01),
                Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04),
                Date_Of_Birth__c = date.newInstance(2001, 02, 04),
                role__c='Admin',
                Residency_Type__c = 'Australian',
                Expiry_Date__c = date.newInstance(2025,02, 19),
                Type__c = 'Visa Status',
                Working_Hours_Rate__c=50
                
            );
            insert staff;
            
            Add_Shift__c shift = new Add_Shift__c(
                Facility__c=fac.Id,
                Start_Date__c=Date.today().addDays(-7),
                End_Date__c=Date.today().addDays(-5),
                Quantity__c=1,
                Start_Time__c=Time.newInstance(9,0,0,0),
                End_Time__c=Time.newInstance(17,0,0,0),
                Status__c='Draft'
            );
            insert shift;
            
            ShiftWithStaff__c sws = new ShiftWithStaff__c(
                Add_Shift__c=shift.Id,
                Staff__c=staff.Id,
                Attendence__c=true,
                Status__c='Accepted',
                Start_Date__c=shift.Start_Date__c,
                Shift_End_Date__c=shift.End_Date__c,
                Shift_Start_Time__c=shift.Start_Time__c,
                Shift_End_Time__c=shift.End_Time__c
            );
            insert sws;
            ShiftWithStaff__c sws2 = new ShiftWithStaff__c(
                Add_Shift__c=shift.Id,
                Staff__c=staff.Id,
                Attendence__c=true,
                Status__c='Accepted',
                Start_Date__c=shift.Start_Date__c,
                Shift_End_Date__c=shift.End_Date__c,
                Shift_Start_Time__c=shift.Start_Time__c,
                Shift_End_Time__c=shift.End_Time__c
            );
            insert sws2;
            
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
            // funds.Available_Funds__c = 10000;	
            //funds.Spent_Amount__c = 1000;
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
            // services.Unit_Price__c = 200;
            services.GST__c='No';
            services.Date_of_Service__c = system.today();//Date.newInstance(2024, 10, 16);
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=sws.id;
            insert services;
            
        }
    }
@isTest
static void testSaveTemplate() {

    Facility__c fac =
        [SELECT Id FROM Facility__c LIMIT 1];

    ShiftWithStaff__c sws =
        [SELECT Id, Template_Id__c
         FROM ShiftWithStaff__c
         LIMIT 1];

    sws.Template_Id__c = 'OLDTEMP';

    update sws;

    Test.startTest();

    RosterTemplateController.saveTemplate(
        'Test Template',
        'Weekly',
        Date.today(),
        Date.today().addDays(7),
        String.valueOf(fac.Id),
        String.valueOf(fac.Id),
        new List<String>{ String.valueOf(sws.Id) },
        new List<String>(),
        true
    );

    Test.stopTest();
}
    
    @isTest
    static void testGetTemplates() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        insert new Roster_Template__c(
            Name='Fetch Template',
            Facility__c=fac.Id,
            Active__c=true,
            Start_Date__c=Date.today(),
            End_Date__c=Date.today().addDays(5),
            Multi_faciltiy__c =fac.Id 
        );
        
        Test.startTest();
        RosterTemplateController.getTemplates(NEW LIST<STRING>{fac.Id});
        Test.stopTest();
    }
    
    @isTest
    static void testDeleteTemplate() {
        User UserList = [Select Id, Email From User Where Email = 'saieswar.k123@tesseractapps.com' LIMIT 1];
        System.runAs(UserList){
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        Roster_Template__c rt = new Roster_Template__c(
            Name='Delete Template',
            Facility__c=fac.Id,
            Active__c=true
        );
        insert rt;
        
        Test.startTest();
        RosterTemplateController.deleteRosterTemplate(rt.Id);
        Test.stopTest();
        }
    }
    
    @isTest
    static void testCreateRosterTemplates() {
         User UserList = [Select Id, Email From User Where Email = 'saieswar.k123@tesseractapps.com' LIMIT 1];
        System.runAs(UserList){
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        Roster_Template__c sourceTemplate = new Roster_Template__c(
            Name='Source Template',
            Facility__c=fac.Id,
            Active__c=true,
            Start_Date__c=Date.today().addDays(-7),
            End_Date__c=Date.today().addDays(-1)
        );
        insert sourceTemplate;
        
        List<Roster_Template__c> templates = new List<Roster_Template__c>{sourceTemplate};
            String jsonTemplate = JSON.serialize(templates);
        
        Test.startTest();
        RosterTemplateController.createRosterTemplates(
            jsonTemplate,
            String.valueOf(Date.today()),
            String.valueOf(Date.today().addDays(7)),
            new List<String>{fac.Id},
            true,
            true,
            true,
            new List<Id>(),
new List<Id>()
        );
        Test.stopTest();
        
        }
    }
    @isTest
    static void testIsOverlap_False() {
        
        DateTime s1 = DateTime.newInstance(2025, 1, 10, 9, 0, 0);
        DateTime e1 = DateTime.newInstance(2025, 1, 10, 11, 0, 0);
        DateTime s2 = DateTime.newInstance(2025, 1, 10, 12, 0, 0);
        DateTime e2 = DateTime.newInstance(2025, 1, 10, 18, 0, 0);
        Boolean result = RosterTemplateController.isOverlap(s1, e1, s2, e2);
    }
    @isTest
    static void testCreateRosterTemplates_DeleteEmptyAddShift() {
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        // Create source template
        Roster_Template__c srcTemplate = new Roster_Template__c(
            Name = 'Delete Empty Shift Template',
            Facility__c = fac.Id,
            Active__c = true,
            Start_Date__c = Date.today().addDays(-10),
            End_Date__c = Date.today().addDays(-8)
        );
        insert srcTemplate;
        
        // Create Add_Shift WITHOUT any ShiftWithStaff
        Add_Shift__c srcShift = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = srcTemplate.Start_Date__c,
            End_Date__c = srcTemplate.End_Date__c,
            Quantity__c = 1,
            Start_Time__c = Time.newInstance(9,0,0,0),
            End_Time__c = Time.newInstance(17,0,0,0),
            Status__c = 'Draft'
        );
        insert srcShift;
        
        // Prepare JSON input
        String jsonTemplate = JSON.serialize(
            new List<Roster_Template__c>{ srcTemplate }
        );
        
        Test.startTest();
        RosterTemplateController.createRosterTemplates(
            jsonTemplate,
            String.valueOf(Date.today()),
            String.valueOf(Date.today().addDays(2)),
            new List<String>{ fac.Id },
            false,
            false,
            false,
            new List<Id>(),
new List<Id>()
        );
        Test.stopTest();
        
        // ASSERT: cloned Add_Shift should be deleted
        Integer countShifts = [
            SELECT COUNT()
            FROM Add_Shift__c
            WHERE Facility__c = :fac.Id
            AND Start_Date__c >= :Date.today()
        ];
        
    }
    @isTest
    static void testIsWeekend() {
        RosterTemplateController.isWeekend(Date.newInstance(2025, 1, 11)); // Saturday
        RosterTemplateController.isWeekend(Date.newInstance(2025, 1, 13)); // Monday
    }
    
    
    @isTest
    static void testCreateRosterTemplates_ForceFullExecution() {
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Force weekly hours logic
        staff.Restrict_Set_Hours__c = true;
        staff.Set_Hours__c = 40;
        update staff;
        
        // Source template
        Roster_Template__c srcTemplate = new Roster_Template__c(
            Name = 'Force Full Execution',
            Facility__c = fac.Id,
            Active__c = true,
            Start_Date__c = Date.today().addDays(-20),
            End_Date__c = Date.today().addDays(-15)
        );
        insert srcTemplate;
        
        // Source Add Shift
        Add_Shift__c srcShift = new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = srcTemplate.Start_Date__c,
            End_Date__c = srcTemplate.End_Date__c,
            Quantity__c = 2,
            Start_Time__c = Time.newInstance(9,0,0,0),
            End_Time__c = Time.newInstance(17,0,0,0),
            Status__c = 'Draft'
        );
        insert srcShift;
        
        // Staff shift (NO Duration__c)
        ShiftWithStaff__c sws = new ShiftWithStaff__c(
            Add_Shift__c = srcShift.Id,
            Staff__c = staff.Id,
            Attendence__c = true,
            Status__c = 'Accepted',
            Start_Date__c = srcShift.Start_Date__c,
            Shift_End_Date__c = srcShift.End_Date__c,
            Shift_Start_Time__c = srcShift.Start_Time__c,
            Shift_End_Time__c = srcShift.End_Time__c
        );
        insert sws;
        
        Test.startTest();
        RosterTemplateController.createRosterTemplates(
            JSON.serialize(new List<Roster_Template__c>{srcTemplate}),
            String.valueOf(Date.today()),
            String.valueOf(Date.today().addDays(7)),
            new List<String>{fac.Id},
            false,
            false,
            false,
            new List<Id>(),
new List<Id>()
        );
        Test.stopTest();
    }
    @isTest
    static void testSaveTemplate_BlankName() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
Test.startTest();

RosterTemplateController.saveTemplate(
    'Test Template',
    'Weekly',
    Date.today(),
    Date.today().addDays(7),
    String.valueOf(fac.Id),
    String.valueOf(fac.Id),
    new List<String>(),
    new List<String>(),
    false
);

Test.stopTest();
    }
    @isTest
    static void testCreateRosterTemplates_ExpiredDocumentSkip() {
        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        insert new Child_Staff__c(
            Staff__c = staff.Id,
            Status__c = 'Rejected',
            Compliance__c = true,
            Expiry_Date__c = Date.today().addDays(-1)
        );
        
        Roster_Template__c tpl = new Roster_Template__c(
            Name='Expired Doc Template',
            Facility__c=fac.Id,
            Active__c=true,
            Start_Date__c=Date.today().addDays(-7),
            End_Date__c=Date.today().addDays(-5)
        );
        insert tpl;
        
        Test.startTest();
        RosterTemplateController.createRosterTemplates(
            JSON.serialize(new List<Roster_Template__c>{tpl}),
            String.valueOf(Date.today()),
            String.valueOf(Date.today().addDays(2)),
            new List<String>{fac.Id},
            false,
            false,
            false,
            new List<Id>(),
new List<Id>()
        );
        Test.stopTest();
    }   

    @isTest
static void testCreateRosterTemplates_ExistingShiftOverlap() {
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    List<Facility__c> facList = [SELECT ID FROM Facility__c];
    List<Id> facIds = new List<Id>();
    for(Facility__c ad:facList) {
        facIds.add(ad.Id);
    }
       

    Add_Shift__c existingShift = new Add_Shift__c(
        Facility__c = fac.Id,
        Start_Date__c = Date.today(),
        End_Date__c = Date.today(),
        Quantity__c = 1,
        Start_Time__c = Time.newInstance(9,0,0,0),
        End_Time__c = Time.newInstance(17,0,0,0),
        Status__c = 'Draft'
    );
    insert existingShift;

    insert new ShiftWithStaff__c(
        Add_Shift__c = existingShift.Id,
        Staff__c = staff.Id,
        Attendence__c = true,
        Status__c = 'Accepted',
        Start_Date__c = Date.today(),
        Shift_End_Date__c = Date.today(),
        Shift_Start_Time__c = Time.newInstance(9,0,0,0),
        Shift_End_Time__c = Time.newInstance(17,0,0,0)
    );

    Roster_Template__c tpl = new Roster_Template__c(
        Name='Overlap Template',
        Facility__c=fac.Id,
        Active__c=true,
        Start_Date__c=Date.today().addDays(-5),
        End_Date__c=Date.today().addDays(-3)
    );
    insert tpl;

    Test.startTest();
    RosterTemplateController.createRosterTemplates(
        JSON.serialize(new List<Roster_Template__c>{tpl}),
        String.valueOf(Date.today()),
        String.valueOf(Date.today().addDays(2)),
        new List<String>{fac.Id},
        false,
        false,
        false,
        new List<Id>(),
new List<Id>()
    ); 
    RosterTemplateController.getStaffWithApprovedLeaves(String.valueOf(Date.today()),String.valueOf(Date.today().addDays(2)), facIds);
    Test.stopTest();
}

@isTest
static void testGetRosterCopyPreview() {

    ShiftWithStaff__c sws = [
        SELECT Id
        FROM ShiftWithStaff__c
        LIMIT 1
    ];

    Services_and_Support_Plan__c svc = [
        SELECT Id
        FROM Services_and_Support_Plan__c
        LIMIT 1
    ];

    svc.ShiftwithStaff__c = sws.Id;

    update svc;

    Test.startTest();

    RosterTemplateController.getRosterCopyPreview(
        new List<Id>{ sws.Id }
    );

    Test.stopTest();
}
    
    
 @isTest
static void testSaveTemplate_DuplicateTemplate() {

    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

    insert new Roster_Template__c(
        Name = 'Duplicate Template',
        Facility__c = fac.Id,
        Active__c = true
    );

    Test.startTest();

    RosterTemplateController.saveTemplate(
        'Duplicate Template',
        'Weekly',
        Date.today(),
        Date.today().addDays(5),
        fac.Id,
        fac.Id,
        new List<String>(),
        new List<String>(),
        false
    );

    Test.stopTest();
}

@isTest
static void testSaveTemplate_ServiceUpdateBranch() {

    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

    ShiftWithStaff__c sws =
        [SELECT Id FROM ShiftWithStaff__c LIMIT 1];

    Services_and_Support_Plan__c svc =
        [SELECT Id, Template_Id__c
         FROM Services_and_Support_Plan__c
         LIMIT 1];

    svc.Template_Id__c = 'OLDID';
    update svc;

    Test.startTest();

    RosterTemplateController.saveTemplate(
        'Service Branch Template',
        'Weekly',
        Date.today(),
        Date.today().addDays(7),
        fac.Id,
        fac.Id,
        new List<String>{sws.Id},
        new List<String>{svc.Id},
        true
    );

    Test.stopTest();
}


@isTest
static void testCreateRosterTemplates_ApprovedLeaveBranch() {

    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

    insert new Leave__c(
        Staff__c = staff.Id,
        Status__c = 'Approved',
        From__c = Date.today(),
        To__c = Date.today().addDays(2)
    );

    Roster_Template__c tpl = new Roster_Template__c(
        Name='Leave Template',
        Facility__c=fac.Id,
        Active__c=true,
        Start_Date__c=Date.today().addDays(-7),
        End_Date__c=Date.today().addDays(-5)
    );
    insert tpl;

    Test.startTest();

    RosterTemplateController.createRosterTemplates(
        JSON.serialize(new List<Roster_Template__c>{tpl}),
        String.valueOf(Date.today()),
        String.valueOf(Date.today().addDays(2)),
        new List<String>{fac.Id},
        false,
        false,
        false,
        new List<Id>(),
        new List<Id>()
    );

    Test.stopTest();
}

@isTest
static void testCreateRosterTemplates_ChecklistBranch() {
       User UserList = [Select Id, Email From User Where Email = 'saieswar.k123@tesseractapps.com' LIMIT 1];
        System.runAs(UserList){

    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

    ShiftWithStaff__c sws =
        [SELECT Id FROM ShiftWithStaff__c LIMIT 1];

    insert new Add_Shift_Checklist__c(
        ShiftWithStaff__c = sws.Id,
        Description__c = 'Checklist',
        Mandatory__c = true
    );

    Roster_Template__c tpl = new Roster_Template__c(
        Name='Checklist Template',
        Facility__c=fac.Id,
        Active__c=true,
        Start_Date__c=Date.today().addDays(-7),
        End_Date__c=Date.today().addDays(-5)
    );
    insert tpl;

    Test.startTest();

    RosterTemplateController.createRosterTemplates(
        JSON.serialize(new List<Roster_Template__c>{tpl}),
        String.valueOf(Date.today()),
        String.valueOf(Date.today().addDays(7)),
        new List<String>{fac.Id},
        true,
        true,
        true,
        new List<Id>(),
        new List<Id>()
    );

    Test.stopTest();
        }
}

@isTest
static void testIsOverlap_True() {

    Boolean result =
        RosterTemplateController.isOverlap(
            DateTime.newInstance(2025,1,1,9,0,0),
            DateTime.newInstance(2025,1,1,12,0,0),
            DateTime.newInstance(2025,1,1,10,0,0),
            DateTime.newInstance(2025,1,1,11,0,0)
        );
}   
}