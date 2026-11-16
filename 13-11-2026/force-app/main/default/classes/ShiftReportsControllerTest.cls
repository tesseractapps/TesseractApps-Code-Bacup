@isTest
private class ShiftReportsControllerTest {

    // Helper method to get test user
    private static User getTestUser() {
        return [
            SELECT Id, Email, User_Type__c, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
    }

    @testSetup
    static void setupData() {
        TestDataFactory.createBaseData();
    }

    @isTest
    static void test_getShiftWithStaffData_sorting() {
        User u = getTestUser();
        
        System.runAs(u) {
            Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
            Date today = Date.today();
            
            Test.startTest();
            
            // Test all sort fields with all 9 parameters
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'All',
                'date',
                'asc'
            );
            
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'All',
                'shiftType',
                'desc'
            );
            
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'All',
                'name',
                'asc'
            );
            
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'All',
                'scheduledTime',
                'desc'
            );
            
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'All',
                'participants',
                'asc'
            );
            
            Test.stopTest();
        }
    }

    @isTest
    static void test_getAddShiftById_full() {
        User u = getTestUser();
        
        System.runAs(u) {
            ShiftwithStaff__c shift = [SELECT Id, Add_Shift__c FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            Map<String, Object> result = ShiftReportsController.getAddShiftById(shift.Id);
            Test.stopTest();
        }
    }

    @isTest
    static void test_getShiftWithCases() {
        User u = getTestUser();
        
        System.runAs(u) {
            ShiftwithStaff__c shift = [SELECT Id, Staff__c FROM ShiftwithStaff__c LIMIT 1];
            
            Test.startTest();
            Map<String, Object> result = ShiftReportsController.getShiftWithCases(shift.Id);
            Test.stopTest();
        }
    }

    @isTest
    static void test_getCasesByStaff() {
        User u = getTestUser();
        
        System.runAs(u) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Date today = Date.today();
            
            Test.startTest();
            List<Case> result = ShiftReportsController.getCasesByStaff(staff.Id, today);
            Test.stopTest();
        }
    }

    @isTest
    static void test_getjournalsByStaff() {
        User u = getTestUser();
        
        System.runAs(u) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Client__c client = [SELECT Id FROM Client__c LIMIT 1];
            Date today = Date.today();
            
            Test.startTest();
            List<Client_Journel__c> result = ShiftReportsController.getjournalsByStaff(staff.Id, today, client.Id);
            Test.stopTest();
        }
    }

    @isTest
    static void test_getformsByStaff() {
        User u = getTestUser();
        
        System.runAs(u) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
            Client__c client = [SELECT Id FROM Client__c LIMIT 1];
            Date today = Date.today();
            
            Test.startTest();
            List<Map<String, String>> result = ShiftReportsController.getformsByStaff(staff.Id, today, client.Id);
            Test.stopTest();
        }
    }

    @isTest
    static void test_templateMethods() {
        User u = getTestUser();
        
        System.runAs(u) {
            Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            
            // Create template
            Exported_Template__c temp = ShiftReportsController.createTemplate(
                'Test Template',
                fac.Id,
                '{"data":"test"}',
                null
            );
            
            // Update template
            ShiftReportsController.createTemplate(
                'Test Template',
                fac.Id,
                '{"data":"updated"}',
                temp.Id
            );
            
            // Get templates
            List<Exported_Template__c> templates = ShiftReportsController.getTemplatesByFacility(fac.Id);
            
            // Delete template
            ShiftReportsController.deleteTemplate(temp.Id);
            
            Test.stopTest();
        }
    }

    @isTest
    static void test_getAllExportData() {
        User u = getTestUser();
        
        System.runAs(u) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
            
            Test.startTest();
            
            Map<String, Object> result = ShiftReportsController.getAllExportData(
                'All', 'All',
                String.valueOf(Date.today().addDays(-20)),
                String.valueOf(Date.today().addDays(20)),
                'All',
                new List<Id>{fac.Id},
                new List<String>{shift.Id}
            );
            
            // Test with empty shift IDs
            Map<String, Object> result2 = ShiftReportsController.getAllExportData(
                'All', 'All',
                String.valueOf(Date.today().addDays(-20)),
                String.valueOf(Date.today().addDays(20)),
                'All',
                new List<Id>{fac.Id},
                new List<String>()
            );
            
            Test.stopTest();
        }
    }

    @isTest
    static void test_constructor_allParams() {
        User u = getTestUser();
        
        System.runAs(u) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            PageReference pageRef = new PageReference('/apex/test');
            Test.setCurrentPage(pageRef);
            
            ApexPages.currentPage().getParameters().put('shiftIds', shift.Id);
            ApexPages.currentPage().getParameters().put('orgName', 'Ashfield Consultants');
            ApexPages.currentPage().getParameters().put('startDate', String.valueOf(Date.today().addDays(-5)));
            ApexPages.currentPage().getParameters().put('endDate', String.valueOf(Date.today().addDays(5)));
            
            ApexPages.currentPage().getParameters().put('sections', 
                '{"shiftInformation":true,' +
                '"incidentRegister":true,' +
                '"forms":true,' +
                '"participantJournal":true,' +
                '"activityLogs":true,' +
                '"servicesDelivered":true,' +
                '"reimbursements":true,' +
                '"shiftNotes":true,' +
                '"Checklist":true,' +
                '"Signature":true}'
            );
            
            Test.startTest();
            ShiftReportsController ctrl = new ShiftReportsController();
            Test.stopTest();
        }
    }

    @isTest
    static void test_constructor_withoutSections() {
        User u = getTestUser();
        
        System.runAs(u) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            PageReference pageRef = new PageReference('/apex/test');
            Test.setCurrentPage(pageRef);
            
            ApexPages.currentPage().getParameters().put('shiftIds', shift.Id);
            ApexPages.currentPage().getParameters().put('orgName', 'Ashfield Consultants');
            ApexPages.currentPage().getParameters().put('startDate', String.valueOf(Date.today().addDays(-5)));
            ApexPages.currentPage().getParameters().put('endDate', String.valueOf(Date.today().addDays(5)));
            
            Test.startTest();
            ShiftReportsController ctrl = new ShiftReportsController();
            Test.stopTest();
        }
    }

    @isTest
    static void test_constructor_noPageRef() {
        User u = getTestUser();
        
        System.runAs(u) {
            Test.startTest();
            ShiftReportsController ctrl = new ShiftReportsController();
            Test.stopTest();
        }
    }

    @isTest
    static void test_cleanHtml() {
        String input = '<p>Test <b>HTML</b> content</p>';
        String result = ShiftReportsController.cleanHtml(input);
        String nullResult = ShiftReportsController.cleanHtml(null);
    }

    @isTest
    static void test_ShiftParticipantComparator() {
        User u = getTestUser();
        
        System.runAs(u) {
            List<ShiftwithStaff__c> shifts = [SELECT Id FROM ShiftwithStaff__c LIMIT 2];
            
            Test.startTest();
            
            ShiftReportsController.ShiftParticipantComparator comp1 = 
                new ShiftReportsController.ShiftParticipantComparator('asc');
            ShiftReportsController.ShiftParticipantComparator comp2 = 
                new ShiftReportsController.ShiftParticipantComparator('desc');
            
            if (shifts.size() >= 2) {
                Integer result1 = comp1.compare(shifts[0], shifts[1]);
                Integer result2 = comp2.compare(shifts[0], shifts[1]);
            }
            
            Test.stopTest();
        }
    }

    @isTest
    static void test_getShiftWithStaffData_allBranches() {
        User u = getTestUser();
        
        System.runAs(u) {
            Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
            Date today = Date.today();
            
            Test.startTest();
            
            // Test Late Sign In
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'Late Sign In',
                'date',
                'asc'
            );
            
            // Test Early Sign Out
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'Early Sign Out',
                'date',
                'asc'
            );
            
            // Test with specific role
            ShiftReportsController.getShiftWithStaffData(
                'Admin', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'All',
                'date',
                'asc'
            );
            
            // Test with specific employment type
            ShiftReportsController.getShiftWithStaffData(
                'All', 'Full Time',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'All',
                'date',
                'asc'
            );
            
            // Test with location filters
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'Facility',
                new List<Id>{fac.Id},
                'All',
                'date',
                'asc'
            );
            
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'Participant',
                new List<Id>{fac.Id},
                'All',
                'date',
                'asc'
            );
            
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'Other',
                new List<Id>{fac.Id},
                'All',
                'date',
                'asc'
            );
            
            // Test with Sign In/Out Enabled
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'Sign In Enabled',
                'date',
                'asc'
            );
            
            ShiftReportsController.getShiftWithStaffData(
                'All', 'All',
                String.valueOf(today.addDays(-10)),
                String.valueOf(today.addDays(10)),
                'All',
                new List<Id>{fac.Id},
                'Sign Out Enabled',
                'date',
                'asc'
            );
            
            Test.stopTest();
        }
    }
}