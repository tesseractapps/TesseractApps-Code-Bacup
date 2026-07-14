@IsTest
public class RosterCopyPasteHandlerTest {

    @TestSetup
    static void setupData() {

        TestDataFactory.createBaseData();
    }

    @IsTest
    static void testPasteSelectedRosters() {
           User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {


        Staff__c staff =
            [SELECT Id FROM Staff__c LIMIT 1];

        Facility__c fac =
            [SELECT Id FROM Facility__c LIMIT 1];

        Client__c cli =
            [SELECT Id FROM Client__c LIMIT 1];

        Funds_Tracker__c funds =
            [SELECT Id FROM Funds_Tracker__c LIMIT 1];

        NDIS_Support_Catalogue__c nsc =
            [SELECT Id, Name
             FROM NDIS_Support_Catalogue__c
             LIMIT 1];

        Add_Shift__c addShift =
            new Add_Shift__c(
                Facility__c = fac.Id,
                Start_Date__c = Date.today(),
                End_Date__c = Date.today(),
                Start_Time__c = Time.newInstance(9,0,0,0),
                End_Time__c = Time.newInstance(17,0,0,0),
                Quantity__c = 1
            );

        insert addShift;

        ShiftwithStaff__c shift =
            new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Start_Date__c = addShift.Start_Date__c,
                Shift_End_Date__c = addShift.Start_Date__c,
                Shift_Start_Time__c = addShift.Start_Time__c,
                Role__c = 'Admin',
                Status__c = 'Accepted',
                Attendence__c = true,
                Log_In_Date_Time__c =
                    Time.newInstance(9,0,0,0),
                Log_Out_Date_Time__c =
                    Time.newInstance(17,0,0,0)
            );

        insert shift;

        Services_and_Support_Plan__c svc =
            new Services_and_Support_Plan__c(
                Service_Type__c = nsc.Id,
                Service_Users__c = staff.Id,
                Funds_Tracker__c = funds.Id,
                Qty__c = 5,
                GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = cli.Id,
                Services__c = nsc.Name,
                State__c = 'ACT',
                Start_Time__c = '3:30 am',
                End_Time__c = '5:30 am',
                ShiftwithStaff__c = shift.Id
            );

        insert svc;

        Test.startTest();

        RosterCopyPasteHandler.pasteSelectedRosters(
            new List<Id>{ shift.Id },
            new List<Id>{ svc.Id },
            String.valueOf(Date.today().addDays(7)),
            true,
            true,
            true
        );

        Test.stopTest();
    }
    }

    @IsTest
    static void testGetMappedDate() {

        Test.startTest();

        RosterCopyPasteHandler.getMappedDate(
            Date.today(),
            Date.today(),
            Date.today().addDays(7)
        );

        Test.stopTest();
    }

    @IsTest
    static void testGetShiftIdsByTemplate() {

        Staff__c staff =
            [SELECT Id FROM Staff__c LIMIT 1];

        Facility__c fac =
            [SELECT Id FROM Facility__c LIMIT 1];

        Add_Shift__c addShift =
            new Add_Shift__c(
                Facility__c = fac.Id,
                Start_Date__c = Date.today(),
                End_Date__c = Date.today(),
                Start_Time__c = Time.newInstance(8,0,0,0),
                End_Time__c = Time.newInstance(12,0,0,0),
                Quantity__c = 1
            );

        insert addShift;

        ShiftwithStaff__c shift =
            new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Start_Date__c = addShift.Start_Date__c,
                Shift_End_Date__c = addShift.Start_Date__c,
                Shift_Start_Time__c = addShift.Start_Time__c,
                Shift_End_Time__c = addShift.End_Time__c,
                Template_Id__c = 'TEMP1,TEMP2',
                Role__c = 'Admin',
                Status__c = 'Draft',
                Attendence__c = true,
                Log_In_Date_Time__c =
                    Time.newInstance(8,0,0,0),
                Log_Out_Date_Time__c =
                    Time.newInstance(12,0,0,0)
            );

        insert shift;

        Test.startTest();

        RosterCopyPasteHandler.getShiftIdsByTemplate(
            'TEMP1',
            new List<String>{ fac.Id },
            String.valueOf(Date.today())
        );

        Test.stopTest();
    }

    @IsTest
    static void testGetServiceIdsByTemplate() {
           User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {


        Staff__c staff =
            [SELECT Id FROM Staff__c LIMIT 1];

        Facility__c fac =
            [SELECT Id FROM Facility__c LIMIT 1];

        Client__c cli =
            [SELECT Id FROM Client__c LIMIT 1];

        Funds_Tracker__c funds =
            [SELECT Id FROM Funds_Tracker__c LIMIT 1];

        NDIS_Support_Catalogue__c nsc =
            [SELECT Id, Name
             FROM NDIS_Support_Catalogue__c
             LIMIT 1];

        Add_Shift__c addShift =
            new Add_Shift__c(
                Facility__c = fac.Id,
                Start_Date__c = Date.today(),
                End_Date__c = Date.today(),
                Start_Time__c = Time.newInstance(8,0,0,0),
                End_Time__c = Time.newInstance(12,0,0,0),
                Quantity__c = 1
            );

        insert addShift;

        ShiftwithStaff__c shift =
            new ShiftwithStaff__c(
                Add_Shift__c = addShift.Id,
                Staff__c = staff.Id,
                Start_Date__c = addShift.Start_Date__c,
                Shift_End_Date__c = addShift.Start_Date__c,
                Shift_Start_Time__c = addShift.Start_Time__c,
                Shift_End_Time__c = addShift.End_Time__c,
                Role__c = 'Admin',
                Status__c = 'Draft',
                Attendence__c = true,
                Log_In_Date_Time__c =
                    Time.newInstance(8,0,0,0),
                Log_Out_Date_Time__c =
                    Time.newInstance(12,0,0,0)
            );

        insert shift;

        Services_and_Support_Plan__c svc =
            new Services_and_Support_Plan__c(
                Service_Type__c = nsc.Id,
                Service_Users__c = staff.Id,
                Funds_Tracker__c = funds.Id,
                Qty__c = 5,
                GST__c = 'No',
                Date_of_Service__c = Date.today(),
                Client__c = cli.Id,
                Services__c = nsc.Name,
                State__c = 'ACT',
                Start_Time__c = '3:30 am',
                End_Time__c = '5:30 am',
                ShiftwithStaff__c = shift.Id,
                Template_Id__c = 'TEMP1,TEMP2'
            );

        insert svc;

        Test.startTest();

        RosterCopyPasteHandler.getServiceIdsByTemplate(
            'TEMP1',
            new List<Id>{ shift.Id },
            String.valueOf(Date.today())
        );

        Test.stopTest();
    }
    }

  /*  @IsTest
    static void testUnAssignParticipantShifts() {

        ShiftwithStaff__c shift =
            [SELECT Id
             FROM ShiftwithStaff__c
             LIMIT 1];

        Test.startTest();

       

        Test.stopTest();
    } */

@IsTest
static void testReAssignStaffToShifts() {

    List<Staff__c> staffs =
        [SELECT Id FROM Staff__c LIMIT 2];

    ShiftwithStaff__c shift =
        [SELECT Id
         FROM ShiftwithStaff__c
         LIMIT 1];

    shift.Start_Date__c =
        Date.today();

    shift.Shift_End_Date__c =
        Date.today();

    shift.Shift_Start_Time__c =
        Time.newInstance(9,0,0,0);

    shift.Shift_End_Time__c =
        Time.newInstance(17,0,0,0);

    update shift;

    Test.startTest();

    RosterCopyPasteHandler.reAssignStaffToShifts(
        new List<Id>{ shift.Id },
        staffs[0].Id
    );

    Test.stopTest();
}
    
    @IsTest
static void testSendReAssignmentEmails() {

    User oldUser =
        [SELECT Id, Email
         FROM User
         LIMIT 1];

    Staff__c newStaff =
        [SELECT Id,
                Email_Address__c,
                Display_Nickname__c
         FROM Staff__c
         LIMIT 1];

    Facility__c fac =
        [SELECT Id
         FROM Facility__c
         LIMIT 1];

    Add_Shift__c addShift =
        new Add_Shift__c(
            Facility__c = fac.Id,
            Start_Date__c = Date.today(),
            End_Date__c = Date.today(),
            Start_Time__c =
                Time.newInstance(9,0,0,0),
            End_Time__c =
                Time.newInstance(17,0,0,0),
            Quantity__c = 1
        );

    insert addShift;

    ShiftwithStaff__c shift =
        new ShiftwithStaff__c(
            Add_Shift__c = addShift.Id,
            Staff__c = newStaff.Id,
            Start_Date__c =
                addShift.Start_Date__c,
            Shift_End_Date__c =
                addShift.Start_Date__c,
            Shift_Start_Time__c =
                addShift.Start_Time__c,
            Shift_End_Time__c =
                addShift.End_Time__c,
            Role__c = 'Admin',
            Status__c = 'Accepted',
            Attendence__c = true,
            Log_In_Date_Time__c =
                Time.newInstance(9,0,0,0),
            Log_Out_Date_Time__c =
                Time.newInstance(17,0,0,0),

            Shift_Address__Street__s =
                'Street 1',

            Shift_Address__City__s =
                'Sydney',

            Shift_Address__StateCode__s =
                'NSW',

            Shift_Address__CountryCode__s =
                'AU',

            Shift_Address__PostalCode__s =
                '2000' 
        );

    insert shift;

    Map<Id, String> oldStaffEmailMap =
        new Map<Id, String>();

    oldStaffEmailMap.put(
        shift.Id,
        oldUser.Email
    );

    Map<Id, String> oldStaffNameMap =
        new Map<Id, String>();

    oldStaffNameMap.put(
        shift.Id,
        'Old Staff'
    );

    Test.startTest();

    RosterCopyPasteHandler.sendReAssignmentEmails(
        new List<ShiftwithStaff__c>{ shift },
        oldStaffEmailMap,
        oldStaffNameMap,
        newStaff,
        'Ashfield Consultants'
    );
     RosterCopyPasteHandler.unAssignParticipantShifts(
            new List<Id>{ shift.Id }
        );

    Test.stopTest();
}
}