@IsTest
public class PmsStaffTemplateControllerTest {
    
    @IsTest
    static void test_StaffAndManagerFlow() {
        
        // 🔹 Base Data
        TestDataFactory.createBaseData();
        
        // 🔹 Fetch Staff
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // 🔹 Create Review Cycle
        PMS_Review_Cycle__c reviewCycle = new PMS_Review_Cycle__c(
            Name = 'FY 2026'
        );
        insert reviewCycle;
        
        // 🔹 Create Role Template (Name is Auto Number → do not set)
        PMS_Role_Template__c roleTemplate = new PMS_Role_Template__c(
            Role_Title__c = 'Admin Role',
            Template_Description__c = 'Test Template',
            PMS_Review_Cycle__c = reviewCycle.Id
        );
        insert roleTemplate;
        
        // 🔹 Create KPI
        PMS_KPI__c kpi = new PMS_KPI__c(
            Name = 'KPI 1',
            PMS_Role_Template__c = roleTemplate.Id,
            KPI_Target__c = 100,
            KPI_Unit__c = 'Number',
            KPI_Weight__c = 20,
            KPI_Description__c = 'Test KPI'
        );
        insert kpi;
        
        // 🔹 Create OKR
        PMS_OKR__c okr = new PMS_OKR__c(
            Name = 'OKR 1',
            PMS_Role_Template__c = roleTemplate.Id,
            OKR_Objective__c = 'Objective 1',
            OKR_Weight__c = 30
        );
        insert okr;
        
        // 🔹 Create Competency
        PMS_Competency__c comp = new PMS_Competency__c(
            Name = 'Competency 1',
            PMS_Role_Template__c = roleTemplate.Id,
            Competency_Category__c = 'Technical',
            Competency_Weight__c = 50
        );
        insert comp;
        
        // 🔹 Assign Template to Staff
        PMS_Staff_Template__c staffTemplate = new PMS_Staff_Template__c(
            PMS_Role_Template__c = roleTemplate.Id,
            Staff__c = staff.Id,
            Effective_Date__c = Date.today(),
            Status__c = 'Submitted to Manager',
            Is_Reviewcycle_Created__c = true
        );
        insert staffTemplate;
        Test.startTest();
        PmsStaffTemplateController.getTemplatesByStaff(staff.Id);
        PmsStaffTemplateController.ReviewRequest request =
            new PmsStaffTemplateController.ReviewRequest();
        request.staffTemplateId = staffTemplate.Id;
        request.kpis = new List<PmsStaffTemplateController.ItemWrapper>();
        request.okrs = new List<PmsStaffTemplateController.ItemWrapper>();
        request.competencies = new List<PmsStaffTemplateController.ItemWrapper>();
        // 🔹 Valid Restricted Picklist Value
        String ratingValue = 'Meets Expectations';
        // KPI
        PmsStaffTemplateController.ItemWrapper kpiWrap =
            new PmsStaffTemplateController.ItemWrapper();
        kpiWrap.Id = kpi.Id;
        kpiWrap.staffRating = ratingValue;
        kpiWrap.staffComment = 'Good';
        request.kpis.add(kpiWrap);
        // OKR
        PmsStaffTemplateController.ItemWrapper okrWrap =
            new PmsStaffTemplateController.ItemWrapper();
        okrWrap.Id = okr.Id;
        okrWrap.staffRating = ratingValue;
        okrWrap.staffComment = 'Excellent';
        request.okrs.add(okrWrap);
        
        // Competency
        PmsStaffTemplateController.ItemWrapper compWrap =
            new PmsStaffTemplateController.ItemWrapper();
        compWrap.Id = comp.Id;
        compWrap.staffRating = ratingValue;
        compWrap.staffComment = 'Average';
        request.competencies.add(compWrap);
        String jsonRequest = JSON.serialize(request);
        PmsStaffTemplateController.saveOrSubmitStaffResponse(
            jsonRequest,
            false
        );
        PmsStaffTemplateController.saveOrSubmitStaffResponse(
            jsonRequest,
            true
        );
        PmsStaffTemplateController.getTemplatesByManager(staff.Id);
        
        Test.stopTest();
    }
    @IsTest
    static void test_Negative_And_Update_Branches() {
        
        TestDataFactory.createBaseData();
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        PMS_Review_Cycle__c cycle = new PMS_Review_Cycle__c(Name='Cycle');
        insert cycle;
        
        PMS_Role_Template__c template = new PMS_Role_Template__c(
            Role_Title__c='Role',
            PMS_Review_Cycle__c=cycle.Id
        );
        insert template;
        
        PMS_KPI__c kpi = new PMS_KPI__c(
            Name='KPI',
            PMS_Role_Template__c=template.Id
        );
        insert kpi;
        
        PMS_Staff_Template__c st = new PMS_Staff_Template__c(
            PMS_Role_Template__c=template.Id,
            Staff__c=staff.Id,
            Is_Reviewcycle_Created__c=true
        );
        insert st;
        
        Test.startTest();
        
        // 1️⃣ Cover null staffId branch
        try {
            PmsStaffTemplateController.getTemplatesByStaff(null);
        } catch (Exception e) {}
        
        // 2️⃣ Cover invalid request branch
        try {
            PmsStaffTemplateController.saveOrSubmitStaffResponse(null, false);
        } catch (Exception e) {}
        
        // 3️⃣ Cover mandatory validation branch
        PmsStaffTemplateController.ReviewRequest req =
            new PmsStaffTemplateController.ReviewRequest();
        req.staffTemplateId = st.Id;
        req.kpis = new List<PmsStaffTemplateController.ItemWrapper>();
        
        PmsStaffTemplateController.ItemWrapper item =
            new PmsStaffTemplateController.ItemWrapper();
        item.Id = kpi.Id;
        item.staffRating = null;      // Force validation
        item.staffComment = null;
        req.kpis.add(item);
        
        try {
            PmsStaffTemplateController.saveOrSubmitStaffResponse(
                JSON.serialize(req),
                true
            );
        } catch (Exception e) {}
        
        // 4️⃣ Cover update branch (existing record path)
        item.staffRating = 'Meets Expectations';
        item.staffComment = 'Updated';
        req.kpis.clear();
        req.kpis.add(item);
        
        String jsonReq = JSON.serialize(req);
        
        // First insert
        PmsStaffTemplateController.saveOrSubmitStaffResponse(jsonReq, false);
        
        // Second call → should go through existingKpis.containsKey path
        PmsStaffTemplateController.saveOrSubmitStaffResponse(jsonReq, false);
        
        Test.stopTest();
    }
@IsTest
static void test_ManagerMapBranchInStaffMethod() {

    TestDataFactory.createBaseData();

    // Get valid staff
    List<Staff__c> staffList = [SELECT Id FROM Staff__c LIMIT 2];

    Staff__c employee = staffList[0];
    Staff__c manager = staffList[0];

    if (staffList.size() > 1) {
        manager = staffList[1];
    }

    // Assign manager
    employee.Manager__c = manager.Id;
    update employee;

    // Create Review Cycle
    PMS_Review_Cycle__c cycle = new PMS_Review_Cycle__c(Name='Cycle');
    insert cycle;

    // Create Template
    PMS_Role_Template__c template = new PMS_Role_Template__c(
        Role_Title__c='Role',
        PMS_Review_Cycle__c=cycle.Id
    );
    insert template;

    // Create Staff Template
    PMS_Staff_Template__c st = new PMS_Staff_Template__c(
        PMS_Role_Template__c=template.Id,
        Staff__c=employee.Id,
        Is_Reviewcycle_Created__c=true
    );
    insert st;

    Test.startTest();

    // 🔥 This triggers managerIds population branch
    PmsStaffTemplateController.getTemplatesByStaff(employee.Id);

    Test.stopTest();
}
}