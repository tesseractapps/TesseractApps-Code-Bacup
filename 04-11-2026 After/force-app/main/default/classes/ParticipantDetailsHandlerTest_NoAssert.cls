@isTest
private class ParticipantDetailsHandlerTest_NoAssert {

    // ============================================================
    // SHARED SETUP
    // ============================================================
    @testSetup
    static void setup() {

        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        User usr = new User(
            Alias = 'tusr',
            Email = 'ptestuser@mail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Testing',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'ptestuser@mail.com'
        );
        insert usr;

        System.runAs(usr) {

            Organisation__c org = new Organisation__c();
            org.Name = 'Ashfield Consultants';
            org.ABN__c = '12345678987';
            org.ACN__c = '878787878';
            org.Contact_No__c = '6132899740';
            org.RCTI__c = 'RCTI1';
            org.Email__c = 'dsfdsfsd@gmail.com';
            org.Bank__c = 'Bank Test';
            org.BSB__c = 'BSB Test';
            org.Account_Name__c = 'Test Account';
            org.Account_Number__c = '1111111111';
            org.Description__c = 'test Desc';
            org.Address_Latest__Street__s = '101';
            org.Address_Latest__City__s = 'Himas Waterhen';
            org.Address_Latest__PostalCode__s = '2060';
            org.Address_Latest__CountryCode__s = 'AU';
            org.Address_Latest__StateCode__s = 'NSW';
            org.NDIS_Provider__c = '12341234565';
            org.BMSI_Identifier__c = 'TEST BMSI';
            org.SoftwareId__c = 'jhdfn18328';
            org.Branch_code__c = 'BS123';
            org.Contact_Name__c = 'Test Contact';
            org.User_Type__c = 'NDIS Org Admin';
            insert org;

            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Consultants';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testonefacility@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '12345678987';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c = 'Ndis';
            insert fac;

            Staff__c staff = new Staff__c();
            staff.Last_Name__c = 'Test staff';
            staff.Name = 'praveen1';
            staff.Name__c = 'abcd';
            staff.Contact_Number__c = '56789908743';
            staff.Email_Address__c = 'ptestuser@mail.com';
            staff.Facility__c = fac.Id;
            staff.Address__Street__s = '8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s = 'ACT';
            staff.Address__PostalCode__s = '2911';
            staff.Emergency_Phone_Number__c = '45678766675';
            staff.Primary_Contact_Name__c = 'Praveen';
            staff.Primary_Contact_Number__c = '9908458298';
            staff.Make_Primary_as_Approver__c = true;
            staff.Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c = 'maheswari';
            staff.Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c = false;
            staff.Secondary_Contact_Number__c = '99084582958';
            staff.Emp_exit_date__c = Date.newInstance(2028, 1, 5);
            staff.Emp_Start_Date__c = Date.newInstance(2023, 2, 1);
            staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4);
            staff.Date_Of_Birth__c = Date.newInstance(2001, 2, 4);
            staff.role__c = 'Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = Date.newInstance(2025, 2, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c = 50;
            staff.Final_Overall_Rate__c = 150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Status__c = true;
            insert staff;

            Direction__c dire = new Direction__c(Name = 'Direction');
            insert dire;

            Add_Shift__c shift = new Add_Shift__c();
            shift.Start_Date__c = Date.today();
            shift.End_Date__c = Date.today();
            shift.Direction__c = dire.Id;
            shift.Role__c = 'Admin';
            shift.Get_Facility__c = true;
            shift.Quantity__c = 1;
            shift.Start_Time__c = Time.newInstance(9, 0, 0, 0);
            shift.End_Time__c = Time.newInstance(17, 0, 0, 0);
            shift.Facility__c = fac.Id;
            shift.Status__c = 'Draft';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c = 'General';
            insert shift;

            Client__c cli = new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant2948';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s = '8 Keewong Street';
            cli.Address__City__s = 'Crace';
            cli.Address__StateCode__s = 'ACT';
            cli.Address__PostalCode__s = '2911';
            cli.Contact_Number__c = '4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c = 'Jason';
            cli.Primay_Contact_Last_Name__c = 'Smith';
            cli.Relationship__c = 'Parent';
            cli.Email__c = 'manualtesting.4139559@hotmail.com';
            cli.Primary_Contact_Number__c = '0433123123';
            insert cli;

            // ---- parent journal ----
            Client_Journel__c parentJournal = new Client_Journel__c();
            parentJournal.Client__c = cli.Id;
            parentJournal.Notes_Type__c = 'Care Notes';
            parentJournal.Description__c = 'Parent Journal Description';
            parentJournal.is_Locked__c = true;
            insert parentJournal;

            // ---- child correction (Original_Client_Journel__c = parent) ----
            Client_Journel__c childCorrection = new Client_Journel__c();
            childCorrection.Client__c = cli.Id;
            childCorrection.Notes_Type__c = 'Care Notes';
            childCorrection.Description__c = 'Child Correction Description';
            childCorrection.Original_Client_Journel__c = parentJournal.Id;
            childCorrection.is_Locked__c = false;
            insert childCorrection;

            // ---- attachments linked to both journals ----
            Journal_Attachments__c jattaParent = new Journal_Attachments__c();
            jattaParent.Name = 'Parent Attachment';
            jattaParent.File_Name__c = 'parent.pdf';
            jattaParent.File_URL__c = 'https://test.com/parent.pdf';
            jattaParent.File_Type__c = 'pdf';
            jattaParent.AWS_Key__c = 'journal/parent.pdf';
            jattaParent.Client_Journel__c = parentJournal.Id;
            insert jattaParent;

            Journal_Attachments__c jattaChild = new Journal_Attachments__c();
            jattaChild.Name = 'Child Attachment';
            jattaChild.File_Name__c = 'child.pdf';
            jattaChild.File_URL__c = 'https://test.com/child.pdf';
            jattaChild.File_Type__c = 'pdf';
            jattaChild.AWS_Key__c = 'journal/child.pdf';
            jattaChild.Client_Journel__c = childCorrection.Id;
            insert jattaChild;

            New_Support_Plan__c plan = new New_Support_Plan__c();
            plan.Client__c = cli.Id;
            insert plan;

            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c = 'Assistance Animals';
            funds.Amount_approved__c = 11000;
            funds.Spent_Amt__c = 0;
            funds.Client__c = cli.Id;
            funds.Plan_Type__c = 'Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 3, 16);
            insert funds;

            NDIS_Support_Catalogue__c NSC = new NDIS_Support_Catalogue__c();
            NSC.Name = 'Assistance Animals';
            NSC.ACT__c = 100;
            NSC.NSW__c = 100;
            NSC.NT__c = 100;
            NSC.QLD__c = 100;
            NSC.SA__c = 100;
            NSC.TAS__c = 100;
            NSC.VIC__c = 100;
            NSC.WA__c = 100;
            insert NSC;

            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c = shift.Id;
            staffs1.Attendence__c = true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c = staff.Id;
            staffs1.Role__c = 'Admin';
            staffs1.Status__c = 'Accepted';
            staffs1.Log_In_Date_Time__c = Time.newInstance(3, 30, 0, 0);
            staffs1.Log_Out_Date_Time__c = Time.newInstance(5, 0, 0, 0);
            staffs1.Start_Date__c = shift.Start_Date__c;
            staffs1.Shift_Start_Time__c = shift.Start_Time__c;
            staffs1.Shift_End_Date__c = shift.End_Date__c;
            insert staffs1;

            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c = staff.Id;
            services.Funds_Tracker__c = funds.Id;
            services.Qty__c = 5;
            services.GST__c = 'No';
            services.Date_of_Service__c = Date.today();
            services.Client__c = cli.Id;
            services.Services__c = 'Assistance Animals';
            services.State__c = 'ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c = staffs1.Id;
            insert services;

            // ---- shift activity so getShiftActivitiesByClient inner query returns rows ----
            ShiftWithStaff_Activity__c activity = new ShiftWithStaff_Activity__c();
            activity.Notes__c = 'Activity note test';
            activity.ShiftwithStaff__c = staffs1.Id;
            insert activity;
        }
    }

    // ============================================================
    // HELPER
    // ============================================================
    private static User getSetupUser() {
        return [SELECT Id FROM User WHERE Email = 'ptestuser@mail.com' LIMIT 1];
    }

    // ============================================================
    // TEST 1 : listOfClientjounel — happy path (returns parent only)
    // ============================================================
    @isTest
    static void test_listOfClientjounel_NoAssert() {
        User u = getSetupUser();
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.listOfClientjounel(cli.Id);
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 2 : listOfClientjounel — unknown Id
    // ============================================================
    @isTest
    static void test_listOfClientjounel_NoRecords_NoAssert() {
        User u = getSetupUser();
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.listOfClientjounel('001000000000001AAA');
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 3 : listOfClientJournalByParticipantsAndShift — happy path
    // ============================================================
    @isTest
    static void test_listOfClientJournalByParticipantsAndShift_NoAssert() {
        User u = getSetupUser();
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        ShiftwithStaff__c sws = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.listOfClientJournalByParticipantsAndShift(
                new List<Id>{ cli.Id }, sws.Id
            );
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 4 : listOfClientJournalByParticipantsAndShift — empty ids
    // ============================================================
    @isTest
    static void test_listOfClientJournalByParticipantsAndShift_EmptyIds_NoAssert() {
        User u = getSetupUser();
        ShiftwithStaff__c sws = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.listOfClientJournalByParticipantsAndShift(
                new List<Id>(), sws.Id
            );
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 5 : saveDesc — create branch
    // ============================================================
    @isTest
    static void test_saveDesc_Create_NoAssert() {
        User u = getSetupUser();
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        Add_Shift__c shift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.saveDesc(
                cli.Id,
                '',
                'New description',
                'Care Notes',
                '',
                shift.Id
            );
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 6 : saveDesc — correction branch (notification loop exercised)
    // ============================================================
    @isTest
    static void test_saveDesc_Correction_NoAssert() {
        User u = getSetupUser();
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        Client_Journel__c journal = [
            SELECT Id, Description__c, Notes_Type__c
            FROM Client_Journel__c
            WHERE Original_Client_Journel__c = null
            LIMIT 1
        ];
        Add_Shift__c shift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.saveDesc(
                cli.Id,
                journal.Id,
                'Corrected description',
                journal.Notes_Type__c,
                'Correction reason test',
                shift.Id
            );
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 7 : saveDesc — exception branch (bad jounelId)
    // ============================================================
    @isTest
    static void test_saveDesc_Exception_NoAssert() {
        User u = getSetupUser();
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        Add_Shift__c shift = [SELECT Id FROM Add_Shift__c LIMIT 1];
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.saveDesc(
                cli.Id,
                'a01000000000001AAA',
                'desc',
                'Care Notes',
                'reason',
                shift.Id
            );
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 8 : communityPage
    // ============================================================
    @isTest
    static void test_communityPage_NoAssert() {
        Test.startTest();
        ParticipantDetailsHandler.communityPage();
        Test.stopTest();
    }

    // ============================================================
    // TEST 9 : saveJournalAttachments — key with extension (has '.')
    // ============================================================
    @isTest
    static void test_saveJournalAttachments_Valid_NoAssert() {
        User u = getSetupUser();
        Client_Journel__c journal = [SELECT Id FROM Client_Journel__c LIMIT 1];
        String json = '[{"url":"https://test.com/file.pdf","key":"journal/file.pdf"}]';
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.saveJournalAttachments(journal.Id, json);
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 10 : saveJournalAttachments — empty payload (insert skipped)
    // ============================================================
    @isTest
    static void test_saveJournalAttachments_Empty_NoAssert() {
        User u = getSetupUser();
        Client_Journel__c journal = [SELECT Id FROM Client_Journel__c LIMIT 1];
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.saveJournalAttachments(journal.Id, '[]');
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 11 : saveJournalAttachments — key without slash AND without '.'
    // Covers: parts.size()==1 branch, fileName.contains('.') == false branch
    // ============================================================
    @isTest
    static void test_saveJournalAttachments_NoSlashKey_NoAssert() {
        User u = getSetupUser();
        Client_Journel__c journal = [SELECT Id FROM Client_Journel__c LIMIT 1];
        String json = '[{"url":"https://test.com/x","key":"plainfile"}]';
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.saveJournalAttachments(journal.Id, json);
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 12 : saveJournalAttachments — blank key (fileName = '')
    // ============================================================
    @isTest
    static void test_saveJournalAttachments_BlankKey_NoAssert() {
        User u = getSetupUser();
        Client_Journel__c journal = [SELECT Id FROM Client_Journel__c LIMIT 1];
        String json = '[{"url":"https://test.com/x","key":""}]';
        System.runAs(u) {
            Test.startTest();
            ParticipantDetailsHandler.saveJournalAttachments(journal.Id, json);
            Test.stopTest();
        }
    }

    // ============================================================
    // TEST 13 : getCorrectionAttachments — valid ids (returns non-empty map)
    // ============================================================
    @isTest
    static void test_getCorrectionAttachments_Valid_NoAssert() {
        Client_Journel__c childJournal = [
            SELECT Id
            FROM Client_Journel__c
            WHERE Original_Client_Journel__c != null
            LIMIT 1
        ];
        Test.startTest();
        ParticipantDetailsHandler.getCorrectionAttachments(
            new List<Id>{ childJournal.Id }
        );
        Test.stopTest();
    }

    // ============================================================
    // TEST 14 : getCorrectionAttachments — null input
    // ============================================================
    @isTest
    static void test_getCorrectionAttachments_Null_NoAssert() {
        Test.startTest();
        ParticipantDetailsHandler.getCorrectionAttachments(null);
        Test.stopTest();
    }

    // ============================================================
    // TEST 15 : getCorrectionAttachments — empty list
    // ============================================================
    @isTest
    static void test_getCorrectionAttachments_Empty_NoAssert() {
        Test.startTest();
        ParticipantDetailsHandler.getCorrectionAttachments(new List<Id>());
        Test.stopTest();
    }

    // ============================================================
    // TEST 16 : getShiftActivitiesByClient — happy path with activities
    // + staff nickname map populated
    // ============================================================
    @isTest
    static void test_getShiftActivitiesByClient_Valid_NoAssert() {
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        Test.startTest();
        ParticipantDetailsHandler.getShiftActivitiesByClient(cli.Id);
        Test.stopTest();
    }

    // ============================================================
    // TEST 17 : getShiftActivitiesByClient — null client
    // ============================================================
    @isTest
    static void test_getShiftActivitiesByClient_Null_NoAssert() {
        Test.startTest();
        ParticipantDetailsHandler.getShiftActivitiesByClient(null);
        Test.stopTest();
    }
}