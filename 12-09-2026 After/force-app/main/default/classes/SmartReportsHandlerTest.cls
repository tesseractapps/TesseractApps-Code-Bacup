@IsTest
public class SmartReportsHandlerTest {

    @IsTest
    static void test_AllMethods_MainFlow() {

        TestDataFactory.createBaseData();

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
            Organisation__c org = [SELECT Id, Name FROM Organisation__c LIMIT 1];
            
            Favorite_Report__c fav = new Favorite_Report__c(
                Name = 'Test Favorite Report'
            );
            insert fav;

            List<Id> facilityIds = new List<Id>{ facility.Id };
            List<Id> staffIds = new List<Id>{ staff.Id };

            Test.startTest();

            SmartReportsHandler.getRolesByFacilities(facilityIds);
            SmartReportsHandler.getRolesByFacilities(new List<Id>());
            SmartReportsHandler.getRolesByFacilities(null);

            SmartReportsHandler.getStaffByFacilityAndRoles(
                facility.Id,
                new List<String>{'Admin'},
                'Full-time'
            );

            SmartReportsHandler.getStaffByFacilityAndRoles(
                facility.Id,
                new List<String>{'Admin'},
                'Full-time and part-time'
            );

            SmartReportsHandler.getStaffByFacilityAndRoles(
                facility.Id,
                null,
                'All'
            );

            SmartReportsHandler.getShiftWithSmartStaffData(
                new List<String>{'Admin'},
                'Full-time',
                String.valueOf(Date.today().addDays(-7)),
                String.valueOf(Date.today()),
                'Facility',
                facilityIds,
                staffIds
            );

            SmartReportsHandler.getShiftWithSmartStaffData(
                new List<String>{'All'},
                'All',
                String.valueOf(Date.today().addDays(-7)),
                String.valueOf(Date.today()),
                'Participant',
                facilityIds,
                null
            );

            Exported_Template__c tpl =
                SmartReportsHandler.createTemplate(
                    'Test Template',
                    facility.Id,
                    '{"key":"value"}',
                    null,
                    'Shift'
                );

            SmartReportsHandler.getTemplatesByFacility(facility.Id, 'Shift');

            SmartReportsHandler.createTemplate(
                'Test Template',
                facility.Id,
                '{"updated":"value"}',
                tpl.Id,
                'Shift'
            );

            SmartReportsHandler.getRejectedShiftsForSmartReports(
                String.valueOf(Date.today().addDays(-30)),
                String.valueOf(Date.today()),
                org.Id,
                facilityIds,
                staffIds,
                new List<String>{'All'}
            );

            SmartReportsHandler.getAllReimbursements(
                String.valueOf(Date.today().addDays(-30)),
                String.valueOf(Date.today()),
                'All',
                facilityIds
            );

            SmartReportsHandler.getAllReimbursements(
                String.valueOf(Date.today().addDays(-30)),
                String.valueOf(Date.today()),
                'Approved',
                facilityIds
            );

            SmartReportsHandler.fetchStaffs(
                facilityIds,
                'Active',
                'Full-time',
                staffIds,
                new List<String>{'Admin'}
            );

            SmartReportsHandler.fetchStaffs(
                facilityIds,
                'All',
                'All',
                null,
                null
            );

            SmartReportsHandler.fetchFacilitiess(
                facilityIds,
                'Active'
            );

            SmartReportsHandler.fetchFacilitiess(
                facilityIds,
                'All'
            );

            SmartReportsHandler.getStaffUtilizationData(
                facility.Id,
                new List<String>{'Admin'},
                'Full-time',
                String.valueOf(Date.today().addDays(-7)),
                String.valueOf(Date.today())
            );

            SmartReportsHandler.createFavorite(
                facility.Id,
                'Shift',
                'key1',
                '{"a":1}'
            );

            List<Report_Export_Log__c> favs = SmartReportsHandler.getFavoriteReports(facility.Id);

            SmartReportsHandler.deleteFavorite(fav.Id);

          SmartReportsHandler.createShiftReportLog(
    String.valueOf(Date.today().addDays(-7)),
    String.valueOf(Date.today()),
    facility.Id,
    'PDF',
    'Shift',
    'Last 7 Days',
    '{"key":"value"}',
    'FILTER_1'
);

SmartReportsHandler.getReportExportLogs(facility.Id);
SmartReportsHandler.getAllReportExportLogs(facility.Id);

            SmartReportsHandler.getReportExportLogs(facility.Id);
            SmartReportsHandler.getAllReportExportLogs(facility.Id);

            SmartReportsHandler.processStaffSelection(staff.Id);
            SmartReportsHandler.processStaffSelection(null);

            SmartReportsHandler.sendFacilityToApex(facilityIds);
            SmartReportsHandler.sendFacilityToApex(null);

            Test.stopTest();
        }
    }
    
    @IsTest
	static void test_AdditionalCoverageBranches() {

    TestDataFactory.createBaseData();

    User testUser = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        Organisation__c org = [SELECT Id, Name FROM Organisation__c LIMIT 1];

        List<Id> facilityIds = new List<Id>{ facility.Id };
        List<Id> staffIds = new List<Id>{ staff.Id };

        Test.startTest();

        try {
            SmartReportsHandler.createTemplate(
                'Duplicate Template',
                facility.Id,
                '{}',
                null,
                'Shift'
            );

            SmartReportsHandler.createTemplate(
                'Duplicate Template',
                facility.Id,
                '{}',
                null,
                'Shift'
            );
        } catch (Exception e) {}

        SmartReportsHandler.getStaffByFacilityAndRoles(
            facility.Id,
            new List<String>{'Admin'},
            'Part-time'
        );

        SmartReportsHandler.getStaffByFacilityAndRoles(
            facility.Id,
            new List<String>(),
            'Full-time and part-time'
        );

        SmartReportsHandler.fetchStaffs(
            facilityIds,
            'Inactive',
            'Part-time',
            staffIds,
            new List<String>{'Admin'}
        );

        SmartReportsHandler.fetchFacilitiess(
            facilityIds,
            'Inactive'
        );

        SmartReportsHandler.getShiftWithSmartStaffData(
            new List<String>{'Admin'},
            'Part-time',
            String.valueOf(Date.today().addDays(-14)),
            String.valueOf(Date.today()),
            'Other',
            facilityIds,
            staffIds
        );

        SmartReportsHandler.getRejectedShiftsForSmartReports(
            '',
            '',
            org.Id,
            facilityIds,
            staffIds,
            new List<String>{'All'}
        );

        SmartReportsHandler.getAllReimbursements(
            String.valueOf(Date.today()),
            String.valueOf(Date.today()),
            'Rejected',
            facilityIds
        );

        SmartReportsHandler.getStaffUtilizationData(
            'All',
            new List<String>{'All'},
            'All',
            String.valueOf(Date.today().addDays(-14)),
            String.valueOf(Date.today())
        );

        Test.stopTest();
    }
}
    
    @isTest
    static void testSendReportEmailSuccess() {

        // Create sample base64 data
        Blob fileBlob = Blob.valueOf('Sample Report Content');
        String base64Data = EncodingUtil.base64Encode(fileBlob);

        Test.startTest();

        SmartReportsHandler.sendReportEmail(
            base64Data,
            'TestReport',
            'test@example.com',
            'cc@example.com',
            'Test Subject',
            '<h1>Test Email Body</h1>',
            'PDF'
        );

        Test.stopTest();

    }

    @isTest
    static void testSendReportEmailEmptyAttachment() {

        Test.startTest();

        try {

            SmartReportsHandler.sendReportEmail(
                '',
                'TestReport',
                'test@example.com',
                null,
                'Test Subject',
                'Test Body',
                'PDF'
            );


        } catch (AuraHandledException ex) {


        }

        Test.stopTest();
    }

    @isTest
    static void testUpdateShiftReportLogSuccess() {

        // Create required test record
        Report_Export_Log__c log = new Report_Export_Log__c(
            Report_Type__c = 'Shift Report',
            Export_Type__c = 'PDF',
            Favourite__c = false
        );
        insert log;

        Test.startTest();

        Id updatedId = SmartReportsHandler.updateShiftReportLog(log.Id, true);

        Test.stopTest();

        // Fetch updated record
        Report_Export_Log__c updatedLog = [
            SELECT Id, Favourite__c
            FROM Report_Export_Log__c
            WHERE Id = :log.Id
        ];


    }

    @isTest
    static void testUpdateShiftReportLogNullId() {

        Test.startTest();

        try {

            SmartReportsHandler.updateShiftReportLog(null, true);


        } catch (AuraHandledException ex) {

        }

        Test.stopTest();
    }

}