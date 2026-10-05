@IsTest
public class PmsControllerTest {

    /* -----------------------------------
       Utility Method – Safe Picklist Fetch
    ------------------------------------*/
    private static String getPicklistValue(Schema.SObjectField fieldRef) {
        List<Schema.PicklistEntry> values = fieldRef.getDescribe().getPicklistValues();
        return values.isEmpty() ? null : values[0].getValue();
    }

    /* ============================================
       TEST 1 – Save Base Template + Fetch
    ============================================*/
    @IsTest
    static void testSaveBaseTemplateAndFetch() {

        TestDataFactory.createBaseData();

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        String validKpiCategory =
            getPicklistValue(PMS_Base_KPI__c.Category__c);

        String validUnit =
            getPicklistValue(PMS_Base_KPI__c.Unit__c);

        String validCompCategory =
            getPicklistValue(PMS_Base_Competency__c.Competency_Category__c);

        Map<String, Object> templateData = new Map<String, Object>{
            'facilityId' => fac.Id,
            'roleTitle' => 'Test Role',
            'description' => 'Template Desc',
            'selfReview' => true,
            'managerReview' => true,
            'goalsPermission' => true
        };

        List<Map<String, Object>> kpis = new List<Map<String, Object>>();
        kpis.add(new Map<String, Object>{
            'kpiName' => 'Quality',
            'category' => validKpiCategory,
            'target' => 100,
            'unit' => validUnit,
            'weight' => 40,
            'description' => 'Quality KPI'
        });

        List<Map<String, Object>> okrs = new List<Map<String, Object>>();
        okrs.add(new Map<String, Object>{
            'okrObjective' => 'Improve Output',
            'weight' => 50,
            'description' => 'OKR Desc',
            'keyTitle' => 'Delivery',
            'keyTarget' => 10,
            'keyUnit' => validUnit
        });

        List<Map<String, Object>> comps = new List<Map<String, Object>>();
        comps.add(new Map<String, Object>{
            'competencyName' => 'Leadership',
            'category' => validCompCategory,
            'weight' => 30,
            'description' => 'Leadership Skills',
            'behaviour' => 'Positive'
        });

        Test.startTest();
        Id templateId = PmsController.saveTemplate(
            templateData, kpis, okrs, comps
        );
        PmsController.getTemplatesByFacility(fac.Id);
        PmsController.getTemplatesById(templateId);
        Test.stopTest();
    }

    /* ============================================
       TEST 2 – Create Role Template + Apply
    ============================================*/
    @IsTest
    static void testCreateRoleTemplateFromBaseAndApply() {

        TestDataFactory.createBaseData();

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

        String validKpiCategory =
            getPicklistValue(PMS_Base_KPI__c.Category__c);

        String validUnit =
            getPicklistValue(PMS_Base_KPI__c.Unit__c);

        Map<String, Object> templateData = new Map<String, Object>{
            'facilityId' => fac.Id,
            'roleTitle' => 'Base Role',
            'description' => 'Base Template',
            'selfReview' => true,
            'managerReview' => false,
            'goalsPermission' => true
        };

        List<Map<String, Object>> kpis = new List<Map<String, Object>>();
        kpis.add(new Map<String, Object>{
            'kpiName' => 'Efficiency',
            'category' => validKpiCategory,
            'target' => 90,
            'unit' => validUnit,
            'weight' => 50,
            'description' => 'Efficiency KPI'
        });

        Test.startTest();

        Id baseTemplateId = PmsController.saveTemplate(
            templateData,
            kpis,
            new List<Map<String,Object>>(),
            new List<Map<String,Object>>()
        );

        Id roleTemplateId =
            PmsController.createRoleTemplateFromBase(baseTemplateId);

        PmsController.applyTemplateToStaff(
            roleTemplateId,
            new List<Id>{ staff.Id },
            Date.today(),
            'Admin'
        );

        PmsController.getRoleTemplatesByFacility(fac.Id);
        PmsController.getStaffsByTemplateId(roleTemplateId);

        Test.stopTest();
    }

    /* ============================================
       TEST 3 – Get Staffs By Org
    ============================================*/
    @IsTest
    static void testGetStaffsByOrg() {

        TestDataFactory.createBaseData();

        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];
        Facility__c fac =
            [SELECT Id FROM Facility__c LIMIT 1];

        Test.startTest();
        PmsController.getStaffsByOrg(
            org.Id,
            fac.Id,
            new List<String>{'Admin'}
        );
        PmsController.getAllStaffTemplates(fac.Id);
        
        Test.stopTest();
    }

@IsTest
static void testSaveFullReviewCycleAndFetch() {

    TestDataFactory.createBaseData();

    Facility__c fac =
        [SELECT Id, Name FROM Facility__c LIMIT 1];
     Staff__c staff =
        [SELECT Id, Name FROM Staff__c LIMIT 1];
     
    String validCycleType =
        getPicklistValue(PMS_Review_Cycle__c.Cycle_Type__c);
    
     Map<String,Object> hrData = new Map<String,Object>{
            'performanceRating' => 'High - Top Performer',
            'potentialRating' => 'Medium - Growing Potential',
            'flightRiskLevel' => '	Low - Stable and Engaged',
            'readinessLevel' => 'Ready In (1 Year)',
            'adjustRating' => 80,
            'justification' => 'Good performance',
            'salaryAdjustment' => 500,
            'bonusAdjustment' => 200,
            'approvePromotion' => true,
            'hrNotes' => 'Approved',
            'managerRequest' => 'Please review again'
        };
        PMS_Review_Cycle__c cycle = new PMS_Review_Cycle__c(
            Name='Test Cycle',
            Facility__c = fac.Id,
            Facility_Name__c = fac.Name,
            Cycle_Type__c = 'Annual Review',
            Cycle_Start_Date__c = Date.today(),
            Cycle_End_Date__c = Date.today().addMonths(3)
        );
        insert cycle;
        PMS_Role_Template__c roleTemplate = new PMS_Role_Template__c(
            //Name='Role Template',
            Role_Title__c='Nurse',
            Facility__c = fac.Id,
            PMS_Review_Cycle__c = cycle.Id
        );
        insert roleTemplate;
	 PMS_Staff_Template__c staffTemplate = new PMS_Staff_Template__c(
        Staff__c = staff.Id,
        PMS_Role_Template__c = roleTemplate.Id,
        Status__c = 'Submitted to Manager'
    );
    insert staffTemplate;

    Test.startTest();

    /* STEP 1 — Create Base Template */
    Map<String, Object> baseTemplateData = new Map<String, Object>{
        'facilityId' => fac.Id,
        'roleTitle' => 'Review Role',
        'description' => 'Review Template',
        'selfReview' => true,
        'managerReview' => true,
        'goalsPermission' => true
    };

    Id baseTemplateId = PmsController.saveTemplate(
        baseTemplateData,
        new List<Map<String,Object>>(),
        new List<Map<String,Object>>(),
        new List<Map<String,Object>>()
    );

    /* STEP 2 — Convert Base → Role Template */
    Id roleTemplateId =
        PmsController.createRoleTemplateFromBase(baseTemplateId);

    /* STEP 3 — Pass Role Template Id (NOT Base) */
    Map<String, Object> reviewData = new Map<String, Object>{
        'cycleName' => 'FY 2026',
        'cycleType' => validCycleType,
        'facilityId' => fac.Id,
        'facilityName' => fac.Name,
        'cycleStartDate' => String.valueOf(Date.today()),
        'cycleEndDate' => String.valueOf(Date.today().addMonths(6)),
        'cycleLockDate' => String.valueOf(Date.today().addMonths(7)),
        'cycleDescription' => 'Annual Review',

        'selfStartDate' => String.valueOf(Date.today()),
        'selfEndDate' => String.valueOf(Date.today().addMonths(1)),
        'selfLockDate' => String.valueOf(Date.today().addMonths(2)),

        'managerStartDate' => String.valueOf(Date.today()),
        'managerEndDate' => String.valueOf(Date.today().addMonths(3)),
        'managerLockDate' => String.valueOf(Date.today().addMonths(4)),

        'hrStartDate' => String.valueOf(Date.today()),
        'hrEndDate' => String.valueOf(Date.today().addMonths(5)),
        'hrLockDate' => String.valueOf(Date.today().addMonths(6)),

        'staffCount' => 1,
        'selectedTemplateIds' => new List<Id>{ roleTemplateId }  // 🔥 FIXED
    };
	 String financialYear = '2024-2025';
    PmsController.saveFullReviewCycle(reviewData);
    PmsController.getReviewCycles(fac.Id,financialYear);
    //PmsController.getReviewCycleInEdit(rev.Id);
    PMS_Review_Cycle__c createdCycle = [SELECT Id FROM PMS_Review_Cycle__c WHERE Facility__c = :fac.Id LIMIT 1];

	PmsController.getReviewCycleInEdit(createdCycle.Id);
    PmsController.saveHrResponseData(hrData, staffTemplate.Id);
    PmsController.ReassignToManager(staffTemplate.Id);
    Map<String,Object> templateDetails =
            PmsController.getStaffTemplateDetailsById(staffTemplate.Id);
    Test.stopTest();
}
    
@IsTest
static void testGetHrCoachingSessions_NoAssert() {

    // 🔹 Create full base data (Org, Facility, Staff etc.)
    TestDataFactory.createBaseData();

    Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

    // 🔹 Get existing staff from factory
    List<Staff__c> staffs = [SELECT Id, Manager__c FROM Staff__c LIMIT 2];

    Staff__c staff = staffs[0];
    Staff__c manager;

    // 🔹 Ensure manager exists
    if (staffs.size() > 1) {
        manager = staffs[1];
    } else {
        manager = staff; // fallback (still avoids null pointer)
    }

    // 🔹 Update staff to link manager (important for coverage)
    staff.Manager__c = manager.Id;
    update staff;

    // 🔹 Create Coaching Session
    PMS_Coaching_session__c session = new PMS_Coaching_session__c(
        Facility__c = fac.Id,
        Coaching_Title__c = 'Test Session',
        isScheduledCoaching__c = true
    );
    insert session;

    // 🔹 Create Child Record
    PMS_Staff_Coaching__c child = new PMS_Staff_Coaching__c(
        Staff__c = staff.Id,
        PMS_Coaching_session__c = session.Id
    );
    insert child;

    // 🔹 Create Role (important for roleMap coverage)
    StaffRole__c role = new StaffRole__c(
        StaffRole_To_Staff__c = staff.Id,
        RoleName__c = 'Test Role',
        Active__c = true,
        Primary__c = true
    );
    insert role;

    // 🔹 Execute
    Test.startTest();
    PmsController.getHrCoachingSessions(fac.Id);
    Test.stopTest();
}
}