@isTest
public class DashboardBuilderControllerTest {
    
    @TestSetup
    static void setupTestData() {
        RosterCopyPasteHandlerTestData.createTestData();
        
        User testUser = [
            SELECT Id, Email, Organization_Name__c, User_Type__c 
            FROM User 
            WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1
        ];
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Staff__c staff = [
            SELECT Id, Email_Address__c, Facility__c 
            FROM Staff__c 
            WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1
        ];
        Client__c client = [
            SELECT Id, Facility__c, Organization_Name__c 
            FROM Client__c 
            WHERE First_Name__c = 'Test' AND Last_Name__c = 'Participant2948' LIMIT 1
        ];
        
        // Update existing shifts
        List<ShiftwithStaff__c> shiftList = [
            SELECT Id, Staff__c, Date__c, Status__c, Attendence__c, Shift_Rejected__c 
            FROM ShiftwithStaff__c 
            WHERE Staff__c != null 
            LIMIT 5
        ];
        for (Integer i = 0; i < shiftList.size(); i++) {
            ShiftwithStaff__c shift = shiftList[i];
            if (i == 0) { shift.Status__c = 'Completed'; shift.Attendence__c = true; }
            else if (i == 1) { shift.Status__c = 'InProgress'; shift.Attendence__c = true; }
            else if (i == 2) { shift.Status__c = 'Accepted'; shift.Attendence__c = true; }
            else if (i == 3) { shift.Status__c = 'Rejected'; shift.Attendence__c = false; shift.Shift_Rejected__c = true; }
            else { shift.Status__c = 'Unassigned'; shift.Attendence__c = false; }
        }
        update shiftList;
        
        // Staff_Facility
        List<Staff_Facility__c> staffFacilities = [
            SELECT Id FROM Staff_Facility__c WHERE Staff__c = :staff.Id LIMIT 1
        ];
        if (staffFacilities.isEmpty()) {
            insert new Staff_Facility__c(Staff__c = staff.Id, Facility__c = fac.Id, Active__c = true);
        } else {
            staffFacilities[0].Active__c = true;
            update staffFacilities;
        }
        
        // Participant_Facility
        List<Participant_Facility__c> pfs = [
            SELECT Id FROM Participant_Facility__c WHERE Participant__c = :client.Id LIMIT 1
        ];
        if (pfs.isEmpty()) {
            insert new Participant_Facility__c(Participant__c = client.Id, Facility__c = fac.Id, Active__c = true);
        } else {
            pfs[0].Active__c = true;
            update pfs;
        }
        
        // Child_Staff__c (visa expiry)
        Child_Staff__c childDoc = new Child_Staff__c();
        childDoc.Staff__c = staff.Id;
        childDoc.Document_Type__c = 'Visa Status';
        childDoc.Expiry_Date__c = Date.today().addDays(-1);
        childDoc.Compliance__c = true;
        childDoc.Status__c = 'Approved';
        childDoc.Is_Archived__c = false;
        insert childDoc;
        
        // Leave__c
        List<Leave__c> leaveList = new List<Leave__c>();
        
        Leave__c leave1 = new Leave__c();
        leave1.Staff__c = staff.Id;
        leave1.Status__c = 'Requested';
        leave1.From__c = Date.today();
        leave1.To__c = Date.today().addDays(2);
        leaveList.add(leave1);
        
        Leave__c leave2 = new Leave__c();
        leave2.Staff__c = staff.Id;
        leave2.Status__c = 'Approved';
        leave2.From__c = Date.today();
        leave2.To__c = Date.today().addDays(2);
        leaveList.add(leave2);
        
        Leave__c leave3 = new Leave__c();
        leave3.Staff__c = staff.Id;
        leave3.Status__c = 'Rejected';
        leave3.From__c = Date.today();
        leave3.To__c = Date.today().addDays(2);
        leaveList.add(leave3);
        
        insert leaveList;
        
        // Incident_Register_Response__c — created as testUser so CreatedById == testUser.Id
        List<Incident_Register_Response__c> incidentList = new List<Incident_Register_Response__c>();
        
        Incident_Register_Response__c inc1 = new Incident_Register_Response__c();
        inc1.Status__c = 'Open';
        inc1.Facility__c = fac.Id;
        incidentList.add(inc1);
        
        Incident_Register_Response__c inc2 = new Incident_Register_Response__c();
        inc2.Status__c = 'In-Progress';
        inc2.Facility__c = fac.Id;
        incidentList.add(inc2);
        
        Incident_Register_Response__c inc3 = new Incident_Register_Response__c();
        inc3.Status__c = 'Resolved';
        inc3.Facility__c = fac.Id;
        incidentList.add(inc3);
        
        System.runAs(testUser) {
            insert incidentList;
        }
        
        // Payroll_Setting__c
        Date currentMonth = Date.today().toStartOfMonth();
        List<Payroll_Setting__c> payrollList = new List<Payroll_Setting__c>();
        
        Payroll_Setting__c pay1 = new Payroll_Setting__c();
        pay1.Frequency__c = 'Weekly';
        pay1.Group_Name__c = 'Ashfield Consultants Jan';
        pay1.Facility__c = fac.Id;
        pay1.Period_Start_Date__c = currentMonth;
        pay1.Period_End_Date__c = currentMonth.addDays(6);
        pay1.Next_Pay_Date__c = currentMonth.addDays(7);
        pay1.Status__c = 'Finalised';
        payrollList.add(pay1);
        
        Payroll_Setting__c pay2 = new Payroll_Setting__c();
        pay2.Frequency__c = 'Weekly';
        pay2.Group_Name__c = 'Ashfield Consultants Feb';
        pay2.Facility__c = fac.Id;
        pay2.Period_Start_Date__c = currentMonth.addMonths(1);
        pay2.Period_End_Date__c = currentMonth.addMonths(1).addDays(6);
        pay2.Next_Pay_Date__c = currentMonth.addMonths(1).addDays(7);
        pay2.Status__c = 'Submitted';
        payrollList.add(pay2);
        
        Payroll_Setting__c pay3 = new Payroll_Setting__c();
        pay3.Frequency__c = 'Weekly';
        pay3.Group_Name__c = 'Ashfield Consultants Mar';
        pay3.Facility__c = fac.Id;
        pay3.Period_Start_Date__c = currentMonth.addMonths(2);
        pay3.Period_End_Date__c = currentMonth.addMonths(2).addDays(6);
        pay3.Next_Pay_Date__c = currentMonth.addMonths(2).addDays(7);
        pay3.Status__c = 'STP Filed';
        payrollList.add(pay3);
        
        insert payrollList;
        
        // Invoice_Parent__c
        List<Invoice_Parent__c> invoiceList = new List<Invoice_Parent__c>();
        
        Invoice_Parent__c inv1 = new Invoice_Parent__c();
        inv1.Status__c = 'Draft';
        inv1.Organization__c = org.Id;
        invoiceList.add(inv1);
        
        Invoice_Parent__c inv2 = new Invoice_Parent__c();
        inv2.Status__c = 'Issued';
        inv2.Organization__c = org.Id;
        invoiceList.add(inv2);
        
        Invoice_Parent__c inv3 = new Invoice_Parent__c();
        inv3.Status__c = 'Received';
        inv3.Organization__c = org.Id;
        invoiceList.add(inv3);
        
        insert invoiceList;
        
        // Allocation__c
        Date today = Date.today();
        Date startOfWeek = today.toStartOfWeek();
        
        List<Allocation__c> allocList = new List<Allocation__c>();
        for (Integer i = 0; i < 7; i++) {
            Allocation__c aloc = new Allocation__c();
            aloc.Start_Date__c = startOfWeek.addDays(i);
            aloc.End_Date__c = startOfWeek.addDays(i);
            aloc.Start_time__c = '9:00 AM';
            aloc.End_time__c = '5:00 PM';
            aloc.Start_Date_Time__c = Time.newInstance(9, 0, 0, 0);
            aloc.End_Date_Time__c = Time.newInstance(17, 0, 0, 0);
            aloc.Working_Hours__c = 8;
            aloc.Staff__c = staff.Id;
            if (i == 0) aloc.Status__c = 'Draft';
            else if (i == 1) aloc.Status__c = 'Submitted';
            else if (i == 2) aloc.Status__c = 'Approved';
            else if (i == 3) aloc.Status__c = 'Rejected';
            else aloc.Status__c = 'Draft';
            allocList.add(aloc);
        }
        insert allocList;
    }
    
    // =============================================
    // HELPERS (re-query records since statics don't persist)
    // =============================================
    static User getTestUser() {
        return [
            SELECT Id, Email, Organization_Name__c, User_Type__c 
            FROM User 
            WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1
        ];
    }
    
    static Staff__c getTestStaff() {
        return [
            SELECT Id, Dashboard_Layout__c 
            FROM Staff__c 
            WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1
        ];
    }
    
    static Facility__c getTestFacility() {
        return [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    
    // =============================================
    // getLayout
    // =============================================
    @isTest
    static void testGetLayout() {
        User testUser = getTestUser();
        Staff__c staff = getTestStaff();
        
        staff.Dashboard_Layout__c = '{"widgets":["signin","shift"]}';
        update staff;
        
        System.runAs(testUser) {
            Test.startTest();
            String result = DashboardBuilderController.getLayout(staff.Id);
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetLayout_NullStaffId() {
        Test.startTest();
        String result = DashboardBuilderController.getLayout(null);
        Test.stopTest();
    }
    
    // =============================================
    // saveLayout
    // =============================================
    @isTest
    static void testSaveLayout() {
        User testUser = getTestUser();
        Staff__c staff = getTestStaff();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.saveLayout(staff.Id, '{"widgets":["signin","shift","leave"]}');
            Test.stopTest();
        }
    }
    
    @isTest
    static void testSaveLayout_NullStaffId() {
        Test.startTest();
        try {
            DashboardBuilderController.saveLayout(null, '{"widgets":[]}');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    // =============================================
    // getNormalizedData - signin
    // =============================================
    @isTest
    static void testGetNormalizedData_SignIn_Admin() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData(
                    'signin', fac.Id, String.valueOf(Date.today()), String.valueOf(Date.today()), 'CUSTOM'
                );
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetNormalizedData_SignIn_Staff() {
        User testUser = getTestUser();
        testUser.User_Type__c = 'NDIS Staff';
        update testUser;
        
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData(
                    'signin', fac.Id, String.valueOf(Date.today()), String.valueOf(Date.today()), null
                );
            Test.stopTest();
        }
    }
    
    @isTest static void testGetNormalizedData_SignIn_Today() { runSigninWithRange('TODAY'); }
    @isTest static void testGetNormalizedData_SignIn_Yesterday() { runSigninWithRange('YESTERDAY'); }
    @isTest static void testGetNormalizedData_SignIn_Last7Days() { runSigninWithRange('LAST_7_DAYS'); }
    @isTest static void testGetNormalizedData_SignIn_Last30Days() { runSigninWithRange('LAST_30_DAYS'); }
    @isTest static void testGetNormalizedData_SignIn_ThisMonth() { runSigninWithRange('THIS_MONTH'); }
    @isTest static void testGetNormalizedData_SignIn_LastMonth() { runSigninWithRange('LAST_MONTH'); }
    @isTest static void testGetNormalizedData_SignIn_Last3Months() { runSigninWithRange('LAST_3_MONTHS'); }
    @isTest static void testGetNormalizedData_SignIn_Last6Months() { runSigninWithRange('LAST_6_MONTHS'); }
    @isTest static void testGetNormalizedData_SignIn_ThisYear() { runSigninWithRange('THIS_YEAR'); }
    
    private static void runSigninWithRange(String range) {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('signin', fac.Id, null, null, range);
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetNormalizedData_SignIn_NullFacility() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData(
                    'signin', null, String.valueOf(Date.today()), String.valueOf(Date.today()), null
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - staff-status
    // =============================================
    @isTest
    static void testGetNormalizedData_StaffStatus() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData(
                    'staff-status', fac.Id, 
                    String.valueOf(Date.today()), String.valueOf(Date.today()), 'TODAY'
                );
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - participant
    // =============================================
    @isTest
    static void testGetNormalizedData_Participant() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('participant', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - incident
    // =============================================
    @isTest
    static void testGetNormalizedData_Incident_Admin() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('incident', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetNormalizedData_Incident_Staff() {
        User testUser = getTestUser();
        testUser.User_Type__c = 'NDIS Staff';
        update testUser;
        
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('incident', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - leave
    // =============================================
    @isTest
    static void testGetNormalizedData_Leave_Admin() {
        User testUser = getTestUser();
        testUser.User_Type__c = 'HR Admin';
        update testUser;
        
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('leave', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetNormalizedData_Leave_Staff() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('leave', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - performance
    // =============================================
    @isTest
    static void testGetNormalizedData_Performance_Admin() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('performance', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    @isTest
    static void testGetNormalizedData_Performance_Staff() {
        User testUser = getTestUser();
        testUser.User_Type__c = 'NDIS Staff';
        update testUser;
        
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('performance', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - rejectedshifts
    // =============================================
    @isTest
    static void testGetNormalizedData_RejectedShifts() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('rejectedshifts', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - shift
    // =============================================
    @isTest
    static void testGetNormalizedData_Shift() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('shift', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - payroll
    // =============================================
    @isTest
    static void testGetNormalizedData_Payroll() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('payroll', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - icttimesheet
    // =============================================
    @isTest
    static void testGetNormalizedData_IctTimesheet() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('icttimesheet', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - fund
    // =============================================
    @isTest
    static void testGetNormalizedData_Fund() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('fund', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - invoice
    // =============================================
    @isTest
    static void testGetNormalizedData_Invoice() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('invoice', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // getNormalizedData - invalid widget
    // =============================================
    @isTest
    static void testGetNormalizedData_InvalidWidget() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('invalid-widget', fac.Id, null, null, null);
            Test.stopTest();
        }
    }
    
    // =============================================
    // parseDate
    // =============================================
    @isTest
    static void testParseDate_ValidFormats() {
        Test.startTest();
        DashboardBuilderController.parseDate('2024-10-16');
        DashboardBuilderController.parseDate('2024/10/16');
        DashboardBuilderController.parseDate('16/10/2024');
        DashboardBuilderController.parseDate('16-10-2024');
        DashboardBuilderController.parseDate('2024-10-16T00:00:00');
        DashboardBuilderController.parseDate('2024-10-16 00:00:00');
        DashboardBuilderController.parseDate('"2024-10-16"');
        Test.stopTest();
    }
    
    @isTest
    static void testParseDate_NullAndBlank() {
        Test.startTest();
        DashboardBuilderController.parseDate(null);
        DashboardBuilderController.parseDate('');
        DashboardBuilderController.parseDate('   ');
        Test.stopTest();
    }
    
    @isTest
    static void testParseDate_InvalidFormat() {
        Test.startTest();
        DashboardBuilderController.parseDate('invalid-date');
        Test.stopTest();
    }
    
    // =============================================
    // Wrapper classes
    // =============================================
    @isTest
    static void testWrapperClasses() {
        Test.startTest();
        
        DashboardBuilderController.NormalizedDataset dataset = 
            new DashboardBuilderController.NormalizedDataset();
        dataset.labels.add('Test');
        dataset.values.add(10);
        
        DashboardBuilderController.SeriesData series = 
            new DashboardBuilderController.SeriesData('Series1', new List<Decimal>{1, 2, 3});
        dataset.series.add(series);
        dataset.metadata.put('totalCount', 10);
        
        Test.stopTest();
    }
}