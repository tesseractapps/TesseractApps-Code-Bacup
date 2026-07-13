@IsTest
public class RosterMonthlyHandlerTest {

    @IsTest
    static void testGetStaffMonthlyData_WithData() {

        TestDataFactory.createBaseData();

        Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];

        Date startDate = Date.today().addMonths(-1);
        Date endDate = Date.today().addMonths(1);

        Test.startTest();

        List<RosterMonthlyHandler.ShiftWrapper> result =
            RosterMonthlyHandler.getStaffMonthlyData(
                staff.Id,
                startDate,
                endDate,
                staff.Facility__c
            );

        Test.stopTest();
    }

    @IsTest
    static void testGetStaffMonthlyData_NoData() {

        TestDataFactory.createBaseData();

        Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];

        Date startDate = Date.newInstance(2035, 1, 1);
        Date endDate = Date.newInstance(2035, 1, 31);

        Test.startTest();

        List<RosterMonthlyHandler.ShiftWrapper> result =
            RosterMonthlyHandler.getStaffMonthlyData(
                staff.Id,
                startDate,
                endDate,
                staff.Facility__c
            );

        Test.stopTest();
    }

    @IsTest
    static void testGetStaffMonthlyData_DifferentStaff() {

        TestDataFactory.createBaseData();

        Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];

        Date startDate = Date.today().addDays(-10);
        Date endDate = Date.today().addDays(10);

        Test.startTest();

        List<RosterMonthlyHandler.ShiftWrapper> result =
            RosterMonthlyHandler.getStaffMonthlyData(
                staff.Id,
                startDate,
                endDate,
                staff.Facility__c
            );

        Test.stopTest();
    }
@IsTest
static void testGetStaffMonthlyData_FullCoverage() {

    TestDataFactory.createBaseData();

    Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];
    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
    Client__c cli = [SELECT Id, Display_Nickname__c FROM Client__c LIMIT 1];

    Shift_Type__c st = new Shift_Type__c(
        Name = 'Night',
        Facility__c = fac.Id,
        Colour__c = '#111111'
    );
    insert st;

    Add_Shift__c shift1 = new Add_Shift__c();
    shift1.Break__c = '30';
    shift1.Do_you_want_to_set_this_a_recurring_shif__c = true;
    shift1.Start_Date__c = Date.today().addDays(-2);
    shift1.End_Date__c = Date.today().addDays(2);
    shift1.Role__c = 'Admin';
    shift1.Get_Facility__c = true;
    shift1.Quantity__c = 5;
    shift1.Start_Time__c = Time.newInstance(18, 30, 00, 00);
    shift1.End_Time__c = Time.newInstance(22, 00, 00, 00);
    shift1.Facility__c = fac.Id;
    shift1.Status__c = 'Draft';
    shift1.Start_time_picklist__c = '6:30 pm';
    shift1.End_time_picklist__c = '10:00 pm';
    shift1.Location__StateCode__s = 'ACT';
    shift1.Location__CountryCode__s = 'AU';
    shift1.Location__PostalCode__s = '2911';
    shift1.Shift_Type__c = 'Night';
    shift1.Shift_Name__c = 'Night';
    shift1.Start_Time_Text__c = '6:30 pm';
    shift1.End_Time_Text__c = '10:00 pm';
    shift1.Split_Shifts__c = true;
    shift1.Group_Shifts__c = true;
    insert shift1;

    ShiftwithStaff__c shiftWithSP = new ShiftwithStaff__c(
        Staff__c = staff.Id,
        Add_Shift__c = shift1.Id,
       // Date__c = Date.today(),
        Status__c = 'Draft',
        Attendence__c = false,
        Un_Assigned_Shift__c = false,
        Role__c = 'Admin',
        Shift_Name__c = 'Night',
        New_Split_Shift__c = true,
        Broken_Shift__c = false,
        Do_you_want_to_set_this_Recurring_Roster__c = true
    );
    insert shiftWithSP;

        Services_and_Support_Plan__c sp = [
        SELECT Id, Client__c 
        FROM Services_and_Support_Plan__c 
        LIMIT 1
    ];
    
    sp.ShiftwithStaff__c = shiftWithSP.Id;
    update sp;

    ShiftwithStaff__c shiftNoSP = new ShiftwithStaff__c(
        Staff__c = staff.Id,
        Add_Shift__c = shift1.Id,
       // Date__c = Date.today(),
        Status__c = 'Draft',
        Attendence__c = false,
        Un_Assigned_Shift__c = false,
        Role__c = 'Support Worker',
        Shift_Name__c = 'Evening',
        New_Split_Shift__c = false,
        Broken_Shift__c = true,
        Do_you_want_to_set_this_Recurring_Roster__c = false
    );
    insert shiftNoSP;

    Test.startTest();

    List<RosterMonthlyHandler.ShiftWrapper> result =
        RosterMonthlyHandler.getStaffMonthlyData(
            staff.Id,
            Date.today().addDays(-5),
            Date.today().addDays(5),
            fac.Id
        );

    Test.stopTest();
}
}