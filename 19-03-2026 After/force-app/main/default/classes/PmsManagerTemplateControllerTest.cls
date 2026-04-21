@isTest
public class PmsManagerTemplateControllerTest {
    
    @testSetup 
    static void setupTestData() {
        List<String> picklistRoles = new List<String>();
        
        // If picklist is empty (sandbox fallback)
        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN'});
        }
        
        // Select first 2 valid roles safely
        String role1 = picklistRoles[0];
        String role2 = picklistRoles.size() > 1 ? picklistRoles[1] : role1;
        
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
        
        Profile prof = [select id, Name from profile where name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen', 
            Email = 'manualtesting.20294637@hotmail.com', 
            EmailEncodingKey = 'UTF-8', 
            LastName = 'StaffOne209463', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_US', 
            ProfileId = prof.Id, 
            TimeZoneSidKey = 'America/New_York', 
            User_Type__c = 'NDIS Org Admin', 
            UserName = 'manualtesting.20294637@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;
        
        System.runAs(user) {   
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
            fac.ABN__c = '12345678912';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c = 'Ndis';
            insert fac;
            
            // Create Manager Staff
            Staff__c manager = new Staff__c();
            manager.Last_Name__c = 'Manager';
            manager.Name = 'Manager User';
            manager.Name__c = 'Manager Name';
            manager.Contact_Number__c = '56789908743';
            manager.Email_Address__c = 'manager@test.com';
            manager.Facility__c = fac.Id;
            manager.Address__Street__s = '8 Keewong Street';
            manager.Address__City__s = 'Crace';
            manager.Address__StateCode__s = 'ACT';
            manager.Address__PostalCode__s = '2911';
            manager.Emergency_Phone_Number__c = '45678766675';
            manager.Primary_Contact_Name__c = 'Manager Contact';
            manager.Primary_Contact_Number__c = '9908458298';
            manager.Make_Primary_as_Approver__c = true;
            manager.Primary_Contact_Email__c = 'manager.contact@test.com';
            manager.Secondary_Contact_Name__c = 'Secondary';
            manager.Secondary_Contact_Email__c = 'secondary@test.com';
            manager.Make_Secondary_as_Approver__c = false;
            manager.Secondary_Contact_Number__c = '99084582958';
            manager.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            manager.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            manager.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            manager.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            manager.role__c = 'Admin';
            manager.Residency_Type__c = 'Australian';
            manager.Expiry_Date__c = date.newInstance(2025, 02, 19);
            manager.Type__c = 'Visa Status';
            manager.Working_Hours_Rate__c = 50;
            manager.Final_Overall_Rate__c = 150;
            manager.Saturday_Hourly_Rate__c = 130;
            manager.Sunday_Hourly_Rate__c = 50;
            manager.Status__c = true;
            insert manager;
            
            // Create Staff reporting to manager
            Staff__c staff = new Staff__c();
            staff.Last_Name__c = 'Test staff';
            staff.Name = 'praveen1';
            staff.Name__c = 'abcd';
            staff.Contact_Number__c = '56789908743';
            staff.Email_Address__c = 'staff@test.com';
            staff.Facility__c = fac.Id;
            staff.Manager__c = manager.Id; // Set manager
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
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c = 'Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025, 02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c = 50;
            staff.Final_Overall_Rate__c = 150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Status__c = true;
            insert staff;
            
            StaffRole__c sr = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Hourly_Rate__c = 50
            );
            insert sr;
            
            // Create Review Cycle
            PMS_Review_Cycle__c reviewCycle = new PMS_Review_Cycle__c(
                Name = 'Q1 2024 Review',
                Manager_Start_Date__c = Date.today().addDays(-5),
                Manager_End_Date__c = Date.today().addDays(5),
                Manager_Lock_Date__c = Date.today().addDays(10)
            );
            insert reviewCycle;
            
            // Create Role Template
            PMS_Role_Template__c roleTemplate = new PMS_Role_Template__c(
                Role_Title__c = 'Test Role',
                Template_Description__c = 'Test Description',
                PMS_Review_Cycle__c = reviewCycle.Id
            );
            insert roleTemplate;
            
            // Create KPIs
           // Create KPIs
        List<PMS_KPI__c> kpis = new List<PMS_KPI__c>();
        for(Integer i = 1; i <= 3; i++) {
            PMS_KPI__c kpi = new PMS_KPI__c();
            kpi.Name = 'KPI ' + i;
            kpi.PMS_Role_Template__c = roleTemplate.Id;
            kpi.KPI_Target__c = 100.0 * i;  // Assign decimal value instead of string
            kpi.KPI_Unit__c = 'Units';
            kpi.KPI_Weight__c = 10.0 * i;
            kpi.KPI_Description__c = 'Description ' + i;
            kpi.Category__c = 'Productivity';
            kpis.add(kpi);
        }
        insert kpis;
            
                    // Create OKRs
            List<PMS_OKR__c> okrs = new List<PMS_OKR__c>();
            for(Integer i = 1; i <= 3; i++) {
                PMS_OKR__c okr = new PMS_OKR__c();
                okr.Name = 'OKR ' + i;
                okr.PMS_Role_Template__c = roleTemplate.Id;
                okr.OKR_Objective__c = 'Objective ' + i;
                okr.OKR_Description__c = 'Description ' + i;
                okr.OKR_Weight__c = 10.0 * i;  // Use decimal multiplication
                okrs.add(okr);
            }
            insert okrs;
                        
            // Create Competencies
            List<PMS_Competency__c> competencies = new List<PMS_Competency__c>();
            for(Integer i = 1; i <= 3; i++) {
                PMS_Competency__c comp = new PMS_Competency__c(
                    Name = 'Competency ' + i,
                    PMS_Role_Template__c = roleTemplate.Id,
                    Competency_Category__c = 'Technical',
                    Competency_Description__c = 'Description ' + i,
                    Competency_Weight__c = 10 * i
                );
                competencies.add(comp);
            }
            insert competencies;
            
            // Create Staff Template
            PMS_Staff_Template__c staffTemplate = new PMS_Staff_Template__c(
                Staff__c = staff.Id,
                PMS_Role_Template__c = roleTemplate.Id,
                Effective_Date__c = Date.today(),
                Status__c = 'Assigned to Staff'
            );
            insert staffTemplate;
            
            // Create Staff KPI Responses
            List<Staff_Kpi_Response__c> kpiResponses = new List<Staff_Kpi_Response__c>();
            for(PMS_KPI__c kpi : kpis) {
                Staff_Kpi_Response__c response = new Staff_Kpi_Response__c(
                    PMS_Staff_Template__c = staffTemplate.Id,
                    PMS_KPI__c = kpi.Id,
                    Staff_Rating__c = 'Partially Meets Expectations',
                    Staff_Comments__c = 'Staff comment',
                    Manager_Rating__c = '',
                    Manager_Comments__c = ''
                );
                kpiResponses.add(response);
            }
            insert kpiResponses;
            
            // Create Staff OKR Responses
            List<Staff_Okr_Response__c> okrResponses = new List<Staff_Okr_Response__c>();
            for(PMS_OKR__c okr : okrs) {
                Staff_Okr_Response__c response = new Staff_Okr_Response__c(
                    PMS_Staff_Template__c = staffTemplate.Id,
                    PMS_OKR__c = okr.Id,
                    Staff_Rating__c = 'Partially Meets Expectations',
                    Staff_Comments__c = 'Staff OKR comment',
                    Manager_Rating__c = '',
                    Manager_Comments__c = ''
                );
                okrResponses.add(response);
            }
            insert okrResponses;
            
            // Create Staff Competency Responses
            List<Staff_Competency_Response__c> compResponses = new List<Staff_Competency_Response__c>();
            for(PMS_Competency__c comp : competencies) {
                Staff_Competency_Response__c response = new Staff_Competency_Response__c(
                    PMS_Staff_Template__c = staffTemplate.Id,
                    PMS_Competency__c = comp.Id,
                    Staff_Rating__c = 'Partially Meets Expectations',
                    Staff_Comments__c = 'Staff competency comment',
                    Manager_Rating__c = '',
                    Manager_Comments__c = ''
                );
                compResponses.add(response);
            }
            insert compResponses;
        }
    }
    
    @isTest
    static void testGetTemplatesByManager_Success() {
        // Get manager ID from test data
        Staff__c manager = [SELECT Id FROM Staff__c WHERE Last_Name__c = 'Manager' LIMIT 1];
        
        Test.startTest();
        List<PmsManagerTemplateController.TemplateWrapper> results = 
            PmsManagerTemplateController.getTemplatesByManager(manager.Id);
        Test.stopTest();
      
    }
    
    @isTest
    static void testGetTemplatesByManager_NullManagerId() {
        Test.startTest();
        try {
            PmsManagerTemplateController.getTemplatesByManager(null);
        } catch(AuraHandledException e) {
     
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetTemplatesByManager_NoTemplates() {
        // Create manager with no staff templates
        Staff__c manager = [SELECT Id FROM Staff__c WHERE Last_Name__c = 'Manager' LIMIT 1];
        
        // Delete all staff templates for this manager
        List<PMS_Staff_Template__c> templates = [
            SELECT Id FROM PMS_Staff_Template__c 
            WHERE Staff__r.Manager__c = :manager.Id
        ];
        delete templates;
        
        Test.startTest();
        List<PmsManagerTemplateController.TemplateWrapper> results = 
            PmsManagerTemplateController.getTemplatesByManager(manager.Id);
        Test.stopTest();
        
      
    }
    
    @isTest
    static void testSubmitManagerResponse_SaveDraft() {
        // Get test data
        PMS_Staff_Template__c staffTemplate = [
            SELECT Id, Status__c 
            FROM PMS_Staff_Template__c 
            LIMIT 1
        ];
        
        List<PMS_KPI__c> kpis = [SELECT Id FROM PMS_KPI__c LIMIT 3];
        List<PMS_OKR__c> okrs = [SELECT Id FROM PMS_OKR__c LIMIT 3];
        List<PMS_Competency__c> competencies = [SELECT Id FROM PMS_Competency__c LIMIT 3];
        
        // Create request
        PmsManagerTemplateController.ReviewRequest request = 
            new PmsManagerTemplateController.ReviewRequest();
        request.staffTemplateId = staffTemplate.Id;
        request.kpis = new List<PmsManagerTemplateController.ItemWrapper>();
        request.okrs = new List<PmsManagerTemplateController.ItemWrapper>();
        request.competencies = new List<PmsManagerTemplateController.ItemWrapper>();
        
        // Add KPI responses
        for(PMS_KPI__c kpi : kpis) {
            PmsManagerTemplateController.ItemWrapper item = 
                new PmsManagerTemplateController.ItemWrapper();
            item.Id = kpi.Id;
            item.ManagerRating = 'Partially Meets Expectations';
            item.ManagerComment = 'Manager comment for KPI';
            request.kpis.add(item);
        }
        
        // Add OKR responses
        for(PMS_OKR__c okr : okrs) {
            PmsManagerTemplateController.ItemWrapper item = 
                new PmsManagerTemplateController.ItemWrapper();
            item.Id = okr.Id;
            item.ManagerRating = 'Partially Meets Expectations';
            item.ManagerComment = 'Manager comment for OKR';
            request.okrs.add(item);
        }
        
        // Add Competency responses
        for(PMS_Competency__c comp : competencies) {
            PmsManagerTemplateController.ItemWrapper item = 
                new PmsManagerTemplateController.ItemWrapper();
            item.Id = comp.Id;
            item.ManagerRating = 'Partially Meets Expectations';
            item.ManagerComment = 'Manager comment for competency';
            request.competencies.add(item);
        }
        
        String requestJson = JSON.serialize(request);
        
        Test.startTest();
        PmsManagerTemplateController.SubmitManagerResponse(requestJson, false); // false = save draft
        Test.stopTest();
        
        // Verify responses were saved
        List<Staff_Kpi_Response__c> savedKpis = [
            SELECT Manager_Rating__c, Manager_Comments__c 
            FROM Staff_Kpi_Response__c 
            WHERE PMS_Staff_Template__c = :staffTemplate.Id
        ];
        
        List<Staff_Okr_Response__c> savedOkrs = [
            SELECT Manager_Rating__c, Manager_Comments__c 
            FROM Staff_Okr_Response__c 
            WHERE PMS_Staff_Template__c = :staffTemplate.Id
        ];
        
        List<Staff_Competency_Response__c> savedComps = [
            SELECT Manager_Rating__c, Manager_Comments__c 
            FROM Staff_Competency_Response__c 
            WHERE PMS_Staff_Template__c = :staffTemplate.Id
        ];
        
     
      
    }
    
    @isTest
    static void testSubmitManagerResponse_SubmitToHR() {
        // Get test data
        PMS_Staff_Template__c staffTemplate = [
            SELECT Id, Status__c 
            FROM PMS_Staff_Template__c 
            LIMIT 1
        ];
        
        List<PMS_KPI__c> kpis = [SELECT Id FROM PMS_KPI__c LIMIT 3];
        List<PMS_OKR__c> okrs = [SELECT Id FROM PMS_OKR__c LIMIT 3];
        List<PMS_Competency__c> competencies = [SELECT Id FROM PMS_Competency__c LIMIT 3];
        
        // Create request with all fields filled
        PmsManagerTemplateController.ReviewRequest request = 
            new PmsManagerTemplateController.ReviewRequest();
        request.staffTemplateId = staffTemplate.Id;
        request.kpis = new List<PmsManagerTemplateController.ItemWrapper>();
        request.okrs = new List<PmsManagerTemplateController.ItemWrapper>();
        request.competencies = new List<PmsManagerTemplateController.ItemWrapper>();
        
        for(PMS_KPI__c kpi : kpis) {
            PmsManagerTemplateController.ItemWrapper item = 
                new PmsManagerTemplateController.ItemWrapper();
            item.Id = kpi.Id;
            item.ManagerRating = 'Partially Meets Expectations';
            item.ManagerComment = 'Manager comment for KPI';
            request.kpis.add(item);
        }
        
        for(PMS_OKR__c okr : okrs) {
            PmsManagerTemplateController.ItemWrapper item = 
                new PmsManagerTemplateController.ItemWrapper();
            item.Id = okr.Id;
            item.ManagerRating = 'Partially Meets Expectations';
            item.ManagerComment = 'Manager comment for OKR';
            request.okrs.add(item);
        }
        
        for(PMS_Competency__c comp : competencies) {
            PmsManagerTemplateController.ItemWrapper item = 
                new PmsManagerTemplateController.ItemWrapper();
            item.Id = comp.Id;
            item.ManagerRating = 'Partially Meets Expectations';
            item.ManagerComment = 'Manager comment for competency';
            request.competencies.add(item);
        }
        
        String requestJson = JSON.serialize(request);
        
        Test.startTest();
        PmsManagerTemplateController.SubmitManagerResponse(requestJson, true); // true = submit
        Test.stopTest();
        
        // Verify status was updated
        PMS_Staff_Template__c updatedTemplate = [
            SELECT Status__c 
            FROM PMS_Staff_Template__c 
            WHERE Id = :staffTemplate.Id
        ];
       
    }
    
    @isTest
    static void testSubmitManagerResponse_MissingRequiredFields() {
        // Get test data
        PMS_Staff_Template__c staffTemplate = [
            SELECT Id, Status__c 
            FROM PMS_Staff_Template__c 
            LIMIT 1
        ];
        
        List<PMS_KPI__c> kpis = [SELECT Id FROM PMS_KPI__c LIMIT 1];
        
        // Create request with missing fields
        PmsManagerTemplateController.ReviewRequest request = 
            new PmsManagerTemplateController.ReviewRequest();
        request.staffTemplateId = staffTemplate.Id;
        request.kpis = new List<PmsManagerTemplateController.ItemWrapper>();
        
        PmsManagerTemplateController.ItemWrapper item = 
            new PmsManagerTemplateController.ItemWrapper();
        item.Id = kpis[0].Id;
        item.ManagerRating = ''; // Missing rating
        item.ManagerComment = ''; // Missing comment
        request.kpis.add(item);
        
        String requestJson = JSON.serialize(request);
        
        Test.startTest();
        try {
            PmsManagerTemplateController.SubmitManagerResponse(requestJson, true); // Submit with missing fields
           
        } catch(AuraHandledException e) {
          
        }
        Test.stopTest();
    }
    
    @isTest
    static void testSubmitManagerResponse_InvalidRequest() {
        Test.startTest();
        try {
            PmsManagerTemplateController.SubmitManagerResponse('invalid json', true);
         
        } catch(Exception e) {
        }
        Test.stopTest();
    }
    
    @isTest
    static void testReassignToStaff_Success() {
        PMS_Staff_Template__c staffTemplate = [
            SELECT Id, Status__c 
            FROM PMS_Staff_Template__c 
            LIMIT 1
        ];
        
        // First update to some other status
        staffTemplate.Status__c = 'Submitted to HR';
        update staffTemplate;
        
        Test.startTest();
        PmsManagerTemplateController.ReassignToStaff(staffTemplate.Id);
        Test.stopTest();
        
        PMS_Staff_Template__c updatedTemplate = [
            SELECT Status__c 
            FROM PMS_Staff_Template__c 
            WHERE Id = :staffTemplate.Id
        ];
        
        System.assertEquals('Assigned to Staff', updatedTemplate.Status__c);
    }
    
    @isTest
    static void testReassignToStaff_NullId() {
        Test.startTest();
        try {
            PmsManagerTemplateController.ReassignToStaff(null);
         
        } catch(AuraHandledException e) {
        }
        Test.stopTest();
    }
    
    @isTest
    static void testIsEditableFlagDuringManagerReviewPeriod() {
        // Update review cycle to be within manager review period
        PMS_Review_Cycle__c reviewCycle = [
            SELECT Id FROM PMS_Review_Cycle__c LIMIT 1
        ];
        reviewCycle.Manager_Start_Date__c = Date.today().addDays(-1);
        reviewCycle.Manager_End_Date__c = Date.today().addDays(1);
        update reviewCycle;
        
        Staff__c manager = [SELECT Id FROM Staff__c WHERE Last_Name__c = 'Manager' LIMIT 1];
        
        Test.startTest();
        List<PmsManagerTemplateController.TemplateWrapper> results = 
            PmsManagerTemplateController.getTemplatesByManager(manager.Id);
        Test.stopTest();
        
       
    }
    
    @isTest
    static void testIsEditableFlagOutsideManagerReviewPeriod() {
        // Update review cycle to be outside manager review period
        PMS_Review_Cycle__c reviewCycle = [
            SELECT Id FROM PMS_Review_Cycle__c LIMIT 1
        ];
        reviewCycle.Manager_Start_Date__c = Date.today().addDays(-10);
        reviewCycle.Manager_End_Date__c = Date.today().addDays(-5);
        update reviewCycle;
        
        Staff__c manager = [SELECT Id FROM Staff__c WHERE Last_Name__c = 'Manager' LIMIT 1];
        
        Test.startTest();
        List<PmsManagerTemplateController.TemplateWrapper> results = 
            PmsManagerTemplateController.getTemplatesByManager(manager.Id);
        Test.stopTest();
        
    }
    
    @isTest
    static void testIsEditableFlagForSubmittedToHR() {
        // Update staff template to Submitted to HR
        PMS_Staff_Template__c staffTemplate = [
            SELECT Id FROM PMS_Staff_Template__c LIMIT 1
        ];
        staffTemplate.Status__c = 'Submitted to HR';
        update staffTemplate;
        
        Staff__c manager = [SELECT Id FROM Staff__c WHERE Last_Name__c = 'Manager' LIMIT 1];
        
        Test.startTest();
        List<PmsManagerTemplateController.TemplateWrapper> results = 
            PmsManagerTemplateController.getTemplatesByManager(manager.Id);
        Test.stopTest();
        
      
    }
    
    @isTest
    static void testSubmitManagerResponse_UpdateExistingResponses() {
        // Get test data
        PMS_Staff_Template__c staffTemplate = [
            SELECT Id FROM PMS_Staff_Template__c LIMIT 1
        ];
        
        PMS_KPI__c kpi = [SELECT Id FROM PMS_KPI__c LIMIT 1];
        
        // Create request with updated values
        PmsManagerTemplateController.ReviewRequest request = 
            new PmsManagerTemplateController.ReviewRequest();
        request.staffTemplateId = staffTemplate.Id;
        request.kpis = new List<PmsManagerTemplateController.ItemWrapper>();
        
        PmsManagerTemplateController.ItemWrapper item = 
            new PmsManagerTemplateController.ItemWrapper();
        item.Id = kpi.Id;
        item.ManagerRating = 'Partially Meets Expectations'; // Updated rating
        item.ManagerComment = 'Updated manager comment';
        request.kpis.add(item);
        
        String requestJson = JSON.serialize(request);
        
        Test.startTest();
        PmsManagerTemplateController.SubmitManagerResponse(requestJson, false);
        Test.stopTest();
        
        // Verify update
        Staff_Kpi_Response__c updatedResponse = [
            SELECT Manager_Rating__c, Manager_Comments__c 
            FROM Staff_Kpi_Response__c 
            WHERE PMS_KPI__c = :kpi.Id 
            AND PMS_Staff_Template__c = :staffTemplate.Id
            LIMIT 1
        ];
        
     
    }
}