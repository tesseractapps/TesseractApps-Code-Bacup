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
    
    @isTest
static void test_loadStaffManagerDetails() {

    TestDataFactory.createBaseData();

    List<Staff__c> staffList = [SELECT Id FROM Staff__c LIMIT 2];

    Staff__c emp = staffList[0];
    Staff__c mgr = staffList.size() > 1 ? staffList[1] : staffList[0];

    // Assign manager
    emp.Manager__c = mgr.Id;
    update emp;

    Test.startTest();

    // Manager present
    PmsStaffTemplateController.loadStaffManagerDetails(emp.Id);

    // Manager null branch
    emp.Manager__c = null;
    update emp;

    PmsStaffTemplateController.loadStaffManagerDetails(emp.Id);

    Test.stopTest();
}
    @isTest
static void test_saveGoal_fullFlow() {

    TestDataFactory.createBaseData();

    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

    Map<String,Object> goalData = new Map<String,Object>{
        'goalType' => 'Performance KPI',
        'goalTitle' => 'Test Goal',
        'description' => 'Desc',
        'priority' => 'High',
        'staffId' => String.valueOf(staff.Id),
        'startDate' => String.valueOf(Date.today()),
        'endDate' => String.valueOf(Date.today().addDays(10)),
        'measurementType' => 'Number',
        'checkInFrequency' => 'Weekly',
        'successIndicators' => 'Success',
        'managerComments' => 'Good',
        'goalStatus' => 'Active'
    };

    List<Map<String,Object>> milestones = new List<Map<String,Object>>{
        new Map<String,Object>{
            'milestoneTitle' => 'M1',
            'description' => 'Desc1',
            'dueDate' => String.valueOf(Date.today()),
            'status' => 'In Progress'
        }
    };

    Test.startTest();

    // 🔹 Insert Goal
    Id goalId = PmsStaffTemplateController.saveGoal(goalData, milestones);

    // 🔹 Update Goal (existing path)
    goalData.put('goalId', goalId);

    // Update milestone (existing + delete flow)
    List<PMS_Goal_Milestone__c> existing = [
        SELECT Id FROM PMS_Goal_Milestone__c WHERE PMS_Goal__c = :goalId
    ];

    List<Map<String,Object>> updatedMilestones = new List<Map<String,Object>>{
        new Map<String,Object>{
            'id' => existing[0].Id,
            'milestoneTitle' => 'Updated',
            'description' => 'Updated Desc',
            'dueDate' => null,
            'status' => 'In Progress'
        }
    };

    PmsStaffTemplateController.saveGoal(goalData, updatedMilestones);

    Test.stopTest();
}
    @isTest
static void test_getGoalsByStaff() {

    TestDataFactory.createBaseData();

    List<Staff__c> staffList = [SELECT Id FROM Staff__c LIMIT 2];

    Staff__c emp = staffList[0];
    Staff__c mgr = staffList.size() > 1 ? staffList[1] : staffList[0];

    emp.Manager__c = mgr.Id;
    update emp;

    PMS_Goal__c goal = new PMS_Goal__c(
        Goal_Title__c = 'Goal',
        Goal_Status__c = 'Active',
        Staff__c = emp.Id
    );
    insert goal;

    Test.startTest();

    // With manager
    PmsStaffTemplateController.getGoalsByStaff(emp.Id);

    // Without manager
    emp.Manager__c = null;
    update emp;

    PmsStaffTemplateController.getGoalsByStaff(emp.Id);

    Test.stopTest();
}
    @isTest
static void test_getGoalById() {

    TestDataFactory.createBaseData();

    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

    PMS_Goal__c goal = new PMS_Goal__c(
        Goal_Title__c = 'Goal',
        Goal_Status__c = 'Active',
        Staff__c = staff.Id
    );
    insert goal;

    PMS_Goal_Milestone__c m = new PMS_Goal_Milestone__c(
        PMS_Goal__c = goal.Id,
        Milestone_Title__c = 'M1'
    );
    insert m;

    Test.startTest();

    PmsStaffTemplateController.getGoalById(goal.Id);

    Test.stopTest();
}
    @isTest
static void test_getCoachingByStaff() {

    TestDataFactory.createBaseData();

    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

    // Create Coaching Session
    PMS_Coaching_session__c session = new PMS_Coaching_session__c(
        Coaching_Title__c = 'Session',
        isScheduledCoaching__c = true
    );
    insert session;

    // Create Staff Coaching (child)
    PMS_Staff_Coaching__c child = new PMS_Staff_Coaching__c(
        PMS_Coaching_Session__c = session.Id,
        Staff__c = staff.Id,
        Is_Staff_Acknowledged__c = true
    );
    insert child;

    // Create Role (for roleMap)
    StaffRole__c role = new StaffRole__c(
        StaffRole_To_Staff__c = staff.Id,
        RoleName__c = 'Admin',
        Active__c = true,
        Primary__c = true
    );
    insert role;

    Test.startTest();

    PmsStaffTemplateController.getCoachingByStaff(String.valueOf(staff.Id));

    Test.stopTest();
}
}