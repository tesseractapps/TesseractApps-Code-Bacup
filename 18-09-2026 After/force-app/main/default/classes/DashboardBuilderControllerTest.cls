@isTest
public class DashboardBuilderControllerTest {
    
    @TestSetup
    static void setupTestData() {
        // Call the existing factory
        RosterCopyPasteHandlerTestData.createTestData();
        
        // =============================================
        // ADDITIONAL DATA NEEDED FOR DASHBOARD WIDGETS
        // =============================================
        
        // Get test user
        User testUser = [SELECT Id, Email, Organization_Name__c, User_Type__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        Staff__c staff = [SELECT Id, Organization_Full_Name__c, Email_Address__c, Facility__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        Client__c client = [SELECT Id, Facility__c, Organization_Name__c FROM Client__c WHERE First_Name__c = 'Test' AND Last_Name__c = 'Participant2948' LIMIT 1];
        
        // Update Staff with Organization_Full_Name__c
        //  staff.Organization_Full_Name__c = 'Ashfield Consultants';
        update staff;
        
        // Create ShiftwithStaff records with various statuses (for 'signin', 'shift', 'rejectedshifts')
        List<ShiftwithStaff__c> shiftList = [
            SELECT Id, Staff__c, Date__c, Status__c, Attendence__c, Shift_Rejected__c 
            FROM ShiftwithStaff__c 
            WHERE Staff__c != null 
            LIMIT 5
        ];
        
        // Update existing shifts to have statuses
        for (Integer i = 0; i < shiftList.size(); i++) {
            ShiftwithStaff__c shift = shiftList[i];
            if (i == 0) { shift.Status__c = 'Completed'; shift.Attendence__c = true; }
            else if (i == 1) { shift.Status__c = 'InProgress'; shift.Attendence__c = true; }
            else if (i == 2) { shift.Status__c = 'Accepted'; shift.Attendence__c = true; }
            else if (i == 3) { shift.Status__c = 'Rejected'; shift.Attendence__c = false; shift.Shift_Rejected__c = true; }
            else { shift.Status__c = 'Unassigned'; shift.Attendence__c = false; }
        }
        update shiftList;
        
        // Create Staff_Facility records
        List<Staff_Facility__c> staffFacilities = [
            SELECT Id, Staff__c, Facility__c, Active__c FROM Staff_Facility__c WHERE Staff__c = :staff.Id LIMIT 1
        ];
        if (staffFacilities.isEmpty()) {
            Staff_Facility__c sf = new Staff_Facility__c(Staff__c = staff.Id, Facility__c = fac.Id, Active__c = true);
            insert sf;
        }
        
        // Create Participant_Facility records
        List<Participant_Facility__c> participantFacilities = [
            SELECT Id, Participant__c, Facility__c, Active__c FROM Participant_Facility__c WHERE Participant__c = :client.Id LIMIT 1
        ];
        if (participantFacilities.isEmpty()) {
            Participant_Facility__c pf = new Participant_Facility__c(Participant__c = client.Id, Facility__c = fac.Id, Active__c = true);
            insert pf;
        }
        
        // Create Child_Staff__c (for 'staff-status' widget - visa expiry)
        Child_Staff__c childDoc = new Child_Staff__c();
        childDoc.Staff__c = staff.Id;
        childDoc.Document_Type__c = 'Visa Status';
        childDoc.Expiry_Date__c = Date.today().addDays(-1); // Expired
        childDoc.Compliance__c = true;
        childDoc.Status__c = 'Approved';
        childDoc.Is_Archived__c = false;
        insert childDoc;
        
        // Create Leave__c records (for 'leave' widget)
        List<Leave__c> leaveList = new List<Leave__c>();
        
        Leave__c leave1 = new Leave__c();
        leave1.Staff__c = staff.Id;
        leave1.Status__c = 'Requested';
        leave1.From__c = Date.today();
        leave1.To__c = Date.today().addDays(2);
        //  leave1.Leave_Applied_Date__c = Date.today();
        leaveList.add(leave1);
        
        Leave__c leave2 = new Leave__c();
        leave2.Staff__c = staff.Id;
        leave2.Status__c = 'Approved';
        leave2.From__c = Date.today();
        leave2.To__c = Date.today().addDays(2);
        //   leave2.Leave_Applied_Date__c = Date.today();
        leaveList.add(leave2);
        
        Leave__c leave3 = new Leave__c();
        leave3.Staff__c = staff.Id;
        leave3.Status__c = 'Rejected';
        leave3.From__c = Date.today();
        leave3.To__c = Date.today().addDays(2);
        // leave3.Leave_Applied_Date__c = Date.today();
        leaveList.add(leave3);
        
        insert leaveList;
        
      
        // Create Incident_Register_Response__c records (for 'incident' widget)
        List<Incident_Register_Response__c> incidentList = new List<Incident_Register_Response__c>();
        
        Incident_Register_Response__c inc1 = new Incident_Register_Response__c();
        inc1.Status__c = 'Open';
        inc1.Facility__c = fac.Id;
        //  inc1.CreatedById = testUser.Id;
        incidentList.add(inc1);
        
        Incident_Register_Response__c inc2 = new Incident_Register_Response__c();
        inc2.Status__c = 'In-Progress';
        inc2.Facility__c = fac.Id;
        //inc2.CreatedById = testUser.Id;
        incidentList.add(inc2);
        
        Incident_Register_Response__c inc3 = new Incident_Register_Response__c();
        inc3.Status__c = 'Resolved';
        inc3.Facility__c = fac.Id;
        //inc3.CreatedById = testUser.Id;
        incidentList.add(inc3);
        
        insert incidentList;
        
        // Create Payroll_Setting__c records (for 'payroll' widget)
        List<Payroll_Setting__c> payrollList = new List<Payroll_Setting__c>();
        
        Date currentMonth = Date.today().toStartOfMonth();
        
        // Create Payroll_Setting__c records (for 'payroll' widget)
        //List<Payroll_Setting__c> payrollList = new List<Payroll_Setting__c>();
        
       // Date currentMonth = Date.today().toStartOfMonth();
        
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
        // Create Invoice_Parent__c records (for 'invoice' widget)
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
        
        // Create Allocation__c records (for 'icttimesheet' widget)
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
    // HELPER METHODS
    // =============================================
    static User getTestUser() {
        return [SELECT Id, Email, Organization_Name__c, User_Type__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    static Staff__c getTestStaff() {
        return [SELECT Id, Organization_Full_Name__c, Dashboard_Layout__c FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    }
    
    static Facility__c getTestFacility() {
        return [SELECT Id FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    
    static Organisation__c getTestOrg() {
        return [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    
    static Client__c getTestClient() {
        return [SELECT Id, Facility__c, Organization_Name__c FROM Client__c WHERE First_Name__c = 'Test' AND Last_Name__c = 'Participant2948' LIMIT 1];
    }
    
    // =============================================
    // TEST 1: getLayout - Returns Layout
    // =============================================
    @isTest
    static void testGetLayout() {
        User testUser = getTestUser();
        Staff__c staff = getTestStaff();
        
        // Set a layout first
        staff.Dashboard_Layout__c = '{"widgets":["signin","shift"]}';
        update staff;
        
        System.runAs(testUser) {
            Test.startTest();
            String result = DashboardBuilderController.getLayout(staff.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 2: getLayout - Null StaffId
    // =============================================
    @isTest
    static void testGetLayout_NullStaffId() {
        Test.startTest();
        String result = DashboardBuilderController.getLayout(null);
        Test.stopTest();
    }
    
    // =============================================
    // TEST 3: getLayout - Invalid StaffId
    // =============================================
   
    
    // =============================================
    // TEST 4: saveLayout - Saves Layout
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
    
    // =============================================
    // TEST 5: saveLayout - Null StaffId
    // =============================================
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
    // TEST 6: saveLayout - Invalid StaffId
    // =============================================
    @isTest
    static void testSaveLayout_InvalidStaffId() {
        Test.startTest();
        try {
            DashboardBuilderController.saveLayout('invalid-id', '{"widgets":[]}');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 7: getNormalizedData - Widget 'signin' (Admin)
    // =============================================
    @isTest
    static void testGetNormalizedData_SignIn_Admin() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('signin', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 8: getNormalizedData - Widget 'signin' (NDIS Staff)
    // =============================================
    @isTest
    static void testGetNormalizedData_SignIn_Staff() {
        User testUser = getTestUser();
        testUser.User_Type__c = 'NDIS Staff';
        update testUser;
        
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('signin', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 9: getNormalizedData - Widget 'staff-status'
    // =============================================
    @isTest
    static void testGetNormalizedData_StaffStatus() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('staff-status', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 10: getNormalizedData - Widget 'participant'
    // =============================================
    @isTest
    static void testGetNormalizedData_Participant() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('participant', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 11: getNormalizedData - Widget 'incident' (Admin)
    // =============================================
    @isTest
    static void testGetNormalizedData_Incident_Admin() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('incident', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 12: getNormalizedData - Widget 'incident' (Staff)
    // =============================================
    @isTest
    static void testGetNormalizedData_Incident_Staff() {
        User testUser = getTestUser();
        testUser.User_Type__c = 'NDIS Staff';
        update testUser;
        
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('incident', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 13: getNormalizedData - Widget 'leave' (Admin)
    // =============================================
    @isTest
    static void testGetNormalizedData_Leave_Admin() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('leave', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 14: getNormalizedData - Widget 'leave' (Staff)
    // =============================================
    @isTest
    static void testGetNormalizedData_Leave_Staff() {
        User testUser = getTestUser();
        testUser.User_Type__c = 'HR Admin';
        update testUser;
        
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('leave', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 15: getNormalizedData - Widget 'performance' (Admin)
    // =============================================
    @isTest
    static void testGetNormalizedData_Performance_Admin() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('performance', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 16: getNormalizedData - Widget 'performance' (Staff)
    // =============================================
    @isTest
    static void testGetNormalizedData_Performance_Staff() {
        User testUser = getTestUser();
        testUser.User_Type__c = 'NDIS Staff';
        update testUser;
        
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('performance', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 17: getNormalizedData - Widget 'rejectedshifts'
    // =============================================
    @isTest
    static void testGetNormalizedData_RejectedShifts() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('rejectedshifts', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 18: getNormalizedData - Widget 'shift'
    // =============================================
    @isTest
    static void testGetNormalizedData_Shift() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('shift', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 19: getNormalizedData - Widget 'payroll'
    // =============================================
    @isTest
    static void testGetNormalizedData_Payroll() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('payroll', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 20: getNormalizedData - Widget 'icttimesheet'
    // =============================================
    @isTest
    static void testGetNormalizedData_IctTimesheet() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('icttimesheet', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 21: getNormalizedData - Widget 'fund'
    // =============================================
    @isTest
    static void testGetNormalizedData_Fund() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('fund', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 22: getNormalizedData - Widget 'invoice'
    // =============================================
    @isTest
    static void testGetNormalizedData_Invoice() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('invoice', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 23: getNormalizedData - Invalid Widget Type
    // =============================================
    @isTest
    static void testGetNormalizedData_InvalidWidget() {
        User testUser = getTestUser();
        Facility__c fac = getTestFacility();
        
        System.runAs(testUser) {
            Test.startTest();
            DashboardBuilderController.NormalizedDataset result = 
                DashboardBuilderController.getNormalizedData('invalid-widget', fac.Id);
            Test.stopTest();
        }
    }
    
    // =============================================
    // TEST 24: Test Wrapper Classes
    // =============================================
    @isTest
    static void testWrapperClasses() {
        Test.startTest();
        
        DashboardBuilderController.NormalizedDataset dataset = new DashboardBuilderController.NormalizedDataset();
        dataset.labels.add('Test');
        dataset.values.add(10);
        
        DashboardBuilderController.SeriesData series = new DashboardBuilderController.SeriesData('Series1', new List<Decimal>{1,2,3});
        dataset.series.add(series);
        
        dataset.metadata.put('totalCount', 10);
        
        Test.stopTest();
    }
}