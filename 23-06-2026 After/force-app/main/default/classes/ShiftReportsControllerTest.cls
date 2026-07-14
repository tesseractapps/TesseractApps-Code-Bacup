@isTest
private class ShiftReportsControllerTest {

    @testSetup
    static void setupData() {

        // Call your existing factory setup here
        // Example:
        TestDataFactory.createBaseData();

        /*
            Factory should create:
            Organisation__c
            Facility__c
            Staff__c
            Client__c
            Add_Shift__c
            ShiftwithStaff__c
            Services_and_Support_Plan__c
            Dynamic_Form__c
            Exported_Template__c
        */
    }


    @isTest
    static void test_getShiftWithStaffData() {
         User u = getTestUser();

    System.runAs(u){

        Facility__c fac = [
            SELECT Id 
            FROM Facility__c 
            LIMIT 1
        ];

        Test.startTest();

        ShiftReportsController.getShiftWithStaffData(
            'All',
            'All',
            String.valueOf(Date.today().addDays(-10)),
            String.valueOf(Date.today().addDays(10)),
            'All',
            new List<Id>{fac.Id},
            'All'
        );


        ShiftReportsController.getShiftWithStaffData(
            'Admin',
            'All',
            String.valueOf(Date.today().addDays(-10)),
            String.valueOf(Date.today().addDays(10)),
            'Facility',
            new List<Id>{fac.Id},
            'Sign In Enabled'
        );


        ShiftReportsController.getShiftWithStaffData(
            'All',
            'Full Time',
            String.valueOf(Date.today().addDays(-10)),
            String.valueOf(Date.today().addDays(10)),
            'Participant',
            new List<Id>{fac.Id},
            'Sign Out Enabled'
        );


        ShiftReportsController.getShiftWithStaffData(
            'All',
            'All',
            String.valueOf(Date.today().addDays(-10)),
            String.valueOf(Date.today().addDays(10)),
            'Other',
            new List<Id>{fac.Id},
            'Late Sign In'
        );

    ShiftReportsController.getShiftWithStaffData(
            'All',
            'All',
            String.valueOf(Date.today().addDays(-10)),
            String.valueOf(Date.today().addDays(10)),
            'Other',
            new List<Id>{fac.Id},
            'Early Sign Out'
        );


        Test.stopTest();

    } // System.runAs close

} // method close

    @isTest
    static void test_getAddShiftById() {
         User u = getTestUser();

    System.runAs(u){

        ShiftwithStaff__c shift = [
            SELECT Id
            FROM ShiftwithStaff__c
            LIMIT 1
        ];

        Test.startTest();

        ShiftReportsController.getAddShiftById(
            shift.Id
        );

        Test.stopTest();
    }
    }


    @isTest
    static void test_getShiftWithCases() {
         User u = getTestUser();

    System.runAs(u){

        ShiftwithStaff__c shift = [
            SELECT Id, Staff__c
            FROM ShiftwithStaff__c
            LIMIT 1
        ];


        Case cs = new Case(
            Subject = 'Test Incident',
            Status = 'New',
            Assign_to__c = shift.Staff__c
        );

        insert cs;


        Test.startTest();

        ShiftReportsController.getShiftWithCases(
            shift.Id
        );

        Test.stopTest();
    }
    }


    @isTest
    static void test_getCasesByStaff() {
         User u = getTestUser();

    System.runAs(u){

        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];


        Case cs = new Case(
            Subject = 'Case Test',
            Status = 'New',
            Staffid__c = staff.Id
        );

        insert cs;


        Test.startTest();

        ShiftReportsController.getCasesByStaff(
            staff.Id,
            Date.today()
        );

        Test.stopTest();
    }
    }


    @isTest
    static void test_getjournalsByStaff() {

 User u = getTestUser();

    System.runAs(u){
        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        Client__c client = [
            SELECT Id
            FROM Client__c
            LIMIT 1
        ];


        Client_Journel__c journal =
            new Client_Journel__c(
                Staff__c = staff.Id,
                Client__c = client.Id,
                Description__c = 'Test Notes',
                Care_Notes__c = 'Care Notes',
                is_Locked__c = true
            );

        insert journal;


        Test.startTest();


        ShiftReportsController.getjournalsByStaff(
            staff.Id,
            Date.today(),
            client.Id
        );


        Test.stopTest();
    }
    }



    @isTest
    static void test_getformsByStaff() {
         User u = getTestUser();

    System.runAs(u){


        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];


        Client__c client = [
            SELECT Id
            FROM Client__c
            LIMIT 1
        ];


        Dynamic_Form__c form =
            new Dynamic_Form__c(
                Name__c = 'Test Form',
                Form_Type__c = 'General'
            );

        insert form;


        ShiftwithStaff__c shift = [
            SELECT Id
            FROM ShiftwithStaff__c
            LIMIT 1
        ];


       // Create Fund Tracker
Funds_Tracker__c fund = new Funds_Tracker__c(
    Client__c = client.Id,
    Registration_Group__c = 'Personal Mobility Equipment',
    Amount_approved__c = 10000,
    Spent_Amt__c = 0,
    Plan_Type__c = 'Plan Managed',
    Approved_Date__c = Date.today()
);
insert fund;


// Create NDIS Catalogue
NDIS_Support_Catalogue__c ndis =
    new NDIS_Support_Catalogue__c(
        Name = 'Assistance Animals',
        ACT__c = 100,
        NSW__c = 100,
        NT__c = 100,
        QLD__c = 100,
        SA__c = 100,
        TAS__c = 100,
        VIC__c = 100,
        WA__c = 100
    );

insert ndis;


    // Create Service Support Plan
    Services_and_Support_Plan__c service =
        new Services_and_Support_Plan__c(
            ShiftwithStaff__c = shift.Id,
            Client__c = client.Id,
    
            Participant_Forms__c = form.Id,
    
            Funds_Tracker__c = fund.Id,
    
            Service_Type__c = ndis.Id,
            Services__c = ndis.Name,
    
            Qty__c = 1,
            GST__c = 'No',
    
            Date_of_Service__c = Date.today(),
    
            State__c = 'ACT',
    
            Start_Time__c = '9:00 am',
            End_Time__c   = '5:00 pm'
        );
    
    insert service;


        Test.startTest();


        ShiftReportsController.getformsByStaff(
            staff.Id,
            Date.today(),
            client.Id
        );


        Test.stopTest();
    }
    }



    @isTest
    static void test_templateMethods() {

 User u = getTestUser();

    System.runAs(u){
        Facility__c fac = [
            SELECT Id
            FROM Facility__c
            LIMIT 1
        ];


        Test.startTest();


        Exported_Template__c temp =
            ShiftReportsController.createTemplate(
                'Test Template',
                fac.Id,
                '{"data":"test"}',
                null
            );


        ShiftReportsController.createTemplate(
            'Test Template',
            fac.Id,
            '{"data":"updated"}',
            temp.Id
        );


        ShiftReportsController.getTemplatesByFacility(
            fac.Id
        );


        ShiftReportsController.deleteTemplate(
            temp.Id
        );


        Test.stopTest();
    }
    }



    @isTest
    static void test_getAllExportData() {
         User u = getTestUser();

    System.runAs(u){


        ShiftwithStaff__c shift = [
            SELECT Id
            FROM ShiftwithStaff__c
            LIMIT 1
        ];


        Facility__c fac = [
            SELECT Id
            FROM Facility__c
            LIMIT 1
        ];


        Test.startTest();


        ShiftReportsController.getAllExportData(
            'All',
            'All',
            String.valueOf(Date.today().addDays(-20)),
            String.valueOf(Date.today().addDays(20)),
            'All',
            new List<Id>{fac.Id},
            new List<String>{shift.Id}
        );


        Test.stopTest();
    }

    }
    private static User getTestUser(){
    return [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];
}
    @isTest
static void test_getAllExportData_fullBranches(){

    User u = getTestUser();

    System.runAs(u){

        // Data already created from TestDataFactory.createBaseData()

        ShiftwithStaff__c shift = [
            SELECT Id,
                   Staff__c,
                   Add_Shift__c,
                   Date__c
            FROM ShiftwithStaff__c
            WHERE Staff__c != null
            LIMIT 1
        ];


        Facility__c fac = [
            SELECT Id
            FROM Facility__c
            LIMIT 1
        ];


        // Get existing service created by factory
        List<Services_and_Support_Plan__c> services = [
            SELECT Id,
                   ShiftwithStaff__c,
                   Client__c
            FROM Services_and_Support_Plan__c
            LIMIT 1
        ];


        // Attach factory service to current shift
        if(!services.isEmpty()){

            services[0].ShiftwithStaff__c = shift.Id;
            update services[0];

        }


        Test.startTest();


        Map<String,Object> result =
            ShiftReportsController.getAllExportData(
                'All',
                'All',
                String.valueOf(Date.today().addDays(-30)),
                String.valueOf(Date.today().addDays(30)),
                'All',
                new List<Id>{fac.Id},
                new List<String>{shift.Id}
            );


        Test.stopTest();

    }
}
    @isTest
static void test_constructor_fullCoverage(){

    User u = getTestUser();

    System.runAs(u){

        ShiftwithStaff__c shift =
        [
            SELECT Id
            FROM ShiftwithStaff__c
            LIMIT 1
        ];


        PageReference pageRef = new PageReference('/apex/test');
        Test.setCurrentPage(pageRef);


        ApexPages.currentPage()
            .getParameters()
            .put(
                'shiftIds',
                shift.Id
            );


        ApexPages.currentPage()
            .getParameters()
            .put(
                'sections',
                '{"shiftInformation":true,'+
                '"incidentRegister":true,'+
                '"forms":true,'+
                '"participantJournal":true,'+
                '"activityLogs":true,'+
                '"servicesDelivered":true,'+
                '"reimbursements":true,'+
                '"shiftNotes":true,'+
                '"Checklist":true,'+
                '"Signature":true}'
            );


        Test.startTest();


        ShiftReportsController ctrl =
            new ShiftReportsController();


        Test.stopTest();

    }
}
    
    @isTest
static void test_getAllExportData_remainingBranches(){

    User u = getTestUser();

    System.runAs(u){

        ShiftwithStaff__c shift = [
            SELECT Id,
                   Staff__c,
                   Add_Shift__c
            FROM ShiftwithStaff__c
            WHERE Staff__c != null
            LIMIT 1
        ];


        Client__c client = [
            SELECT Id
            FROM Client__c
            LIMIT 1
        ];


        // ---------------------------------------
        // Cover Participant_Forms__c split logic
        // ---------------------------------------

        Dynamic_Form__c form = [
            SELECT Id
            FROM Dynamic_Form__c
            LIMIT 1
        ];


        Services_and_Support_Plan__c service = [
            SELECT Id,
                   ShiftwithStaff__c,
                   Participant_Forms__c,
                   Client__c
            FROM Services_and_Support_Plan__c
            LIMIT 1
        ];


        service.ShiftwithStaff__c = shift.Id;
        service.Client__c = client.Id;

        // IMPORTANT: your code expects comma separated Id string
        service.Participant_Forms__c = String.valueOf(form.Id);

        update service;



        // ---------------------------------------
        // Cover CASE incident loop
        // ---------------------------------------

        Case c = new Case(
            Subject = 'Test Incident',
            Status = 'New',
            Priority = 'Medium',
            Staffid__c = shift.Staff__c
        );

        insert c;



        // ---------------------------------------
        // Cover Incident Register loop
        // Use existing required fields from factory
        // ---------------------------------------

        Incident_Register_Response__c irr =
            new Incident_Register_Response__c();

        irr.Name__c = 'Test Incident Register';
        irr.Status__c = 'Open';
        irr.Incident_Assigned_Staff__c = shift.Staff__c;

        insert irr;



        // ---------------------------------------
        // Cover journal loop
        // ---------------------------------------

        Client_Journel__c journal =
            new Client_Journel__c(
                Client__c = client.Id,
                Staff__c = shift.Staff__c,
                Description__c = 'Testing',
                Care_Notes__c = 'Care Notes',
                is_Locked__c = true
            );

        insert journal;



        Test.startTest();


        ShiftReportsController.getAllExportData(
            'All',
            'All',
            String.valueOf(Date.today().addDays(-30)),
            String.valueOf(Date.today().addDays(30)),
            'All',
            new List<Id>(),
            new List<String>{
                shift.Id
            }
        );


        Test.stopTest();

    }
}

}