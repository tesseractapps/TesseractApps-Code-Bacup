@isTest
public class HRTrainingTest {
    @testsetup Static void testData(){ 
        Organisation__c org = OrgDetailsTest.createOrganization();        
    
        Account acc = new Account ();
        acc.name='Portal Account';
        insert acc;
        
        contact cc = new contact();      
        cc.FirstName='Test ';
        cc.LastName='monday223';
        cc.Email='manualtesting.404452@hotmail.com';
        cc.AccountId=acc.id;
        insert cc;
        
         Id profileId = [Select Id,Name From Profile Where Name LIKE '%Channel Account User1%'].Id;
       
   
         User user = new User(Alias = 'praveen', Email= 'manualtesting.404452@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test monday404452', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = profileId, TimeZoneSidKey='America/New_York', UserName='manualtesting.404452@hotmail.com',Organization_Name__c ='Pinnacle IT'
                            ,ContactId=cc.id);
         insert user;
        
         System.runAs (user) {
             
             Facility__c fac = new Facility__c();
             fac.Name='test facilty';
             fac.Address__City__s='Crace';
             fac.Address__Street__s = '8 Keewong Street';
             fac.Address__StateCode__s='ACT';
             fac.Address__PostalCode__s='2911';
             fac.Email__c= 'testfacility@gmail.com';
             fac.Status__c=true;
             fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12345678987';
            fac.Phone__c = '12323432';
             insert fac;
            
             Staff__c staff = new Staff__c();
             staff.Name= 'Test Staff';
             staff.Last_Name__c='Test';
             staff.Contact_Number__c='56789908743';
             staff.Email_Address__c='manualtesting.404452@hotmail.com';
             staff.Facility__c=fac.Id;
             staff.Address__Street__s='8 Keewong Street';
             staff.Address__City__s = 'Crace';
             staff.Address__StateCode__s='ACT';
             staff.Address__PostalCode__s='2911';
             staff.Emergency_Phone_Number__c='45678766675';
             staff.Primary_Contact_Name__c='Praveen';
             staff.Primary_Contact_Number__c='9908458298';
             staff.Make_Primary_as_Approver__c=true;
             staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
             staff.Secondary_Contact_Name__c='maheswari';
             staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
             staff.Make_Secondary_as_Approver__c=false;
             staff.Secondary_Contact_Number__c='99084582958';
             staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
             staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
             staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
             staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
             staff.Residency_Type__c = 'Australian';
             staff.Expiry_Date__c = date.newInstance(2025,02, 19);
             staff.Type__c = 'Visa Status';
             staff.Working_Hours_Rate__c=50;
             insert staff; 
             
             Training__c tra = new Training__c();             
             tra.description__c	= 'Test Description';
             tra.Name = 'LWC';
             tra.Organization_Name__c = 'Age Grace Innovation Pvt Ltd.,';
             insert tra;
             
             Assignment__c assign = new Assignment__c();
             assign.Module_Name__c = tra.Id;
             assign.Staff__c = staff.Id;
             assign.Organization_Name__c = 'Age Grace Innovation Pvt Ltd.,';
			 insert assign;
             
             Award__c awa = new Award__c();
             awa.Issued_by__c = 'Prashanth R';
             awa.Date__c =  date.newInstance(2024, 09, 04);
             insert awa;
         }
    }
    
    @isTest
    public static void getModuleTest(){
        Training__c training = [select id ,Organization_Name__c,Start_Date__c from Training__c LIMIT 1];
        String orgName = training.Organization_Name__c;
        String orgId = training.Id;
        Organisation__c org = [SELECT Id,Name from Organisation__c ];
        String currentOrgId =org.ID;
        Assignment__c assigns = [SELECT Id,Organization_Name__c,Module_Name__c,Staff__c FROM Assignment__c];
        String orgNames = assigns.Organization_Name__c;
        String moduleId = assigns.Module_Name__c;
        List<Staff__c> staffs = [SELECT Id FROM Staff__c];
        Staff__c staf = [SELECT ID,Name from Staff__c];
        String staffId =staf.ID;
        Id stafId = staf.Id;
        Award__c aws = [SELECT Id from Award__c];
        List<String> staffIds = new List<String>();
        for(Staff__c sid:staffs){
            staffIds.add(sid.Id);
        }
        test.startTest();
            HRTraining.getTrainings(orgId);
            //HRTraining.getAssignments(orgId);        
            //HRTraining.insertAssignRecords(moduleId, staffIds, orgNames);
            AwardController.getAwards(aws.Id,orgId);
            AwardController.getAwardsByOrg(orgId);
        	//HRTraining.getStaffAssignments(orgId);
        	HRTraining.getStaffAssignmentsbyId(staffId);
        	HRTraining.getAssignmentsById(stafId);
        	HRTraining.createTraining('Test Training', date.newInstance(2024, 01, 05), date.newInstance(2025, 01, 05), 'Test Description', 'Disability Awareness', currentOrgId);
        test.stopTest();
    }
    @isTest
    static void testUpsertTrainings() {
        
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];
        
        List<Map<String, Object>> modules =
            new List<Map<String, Object>>();
        
        Map<String, Object> rec =
            new Map<String, Object>();
        
        rec.put('wyzedCourseId', 'COURSE-100');
        rec.put('module_name', 'LWC Training');
        rec.put('description', 'Test Desc');
        rec.put('startDate', '2026-01-01');
        rec.put('endDate', '2026-12-31');
        rec.put('courseOwnerId', 'OWNER-1');
        
        modules.add(rec);
        
        String jsonBody = JSON.serialize(modules);
        
        Test.startTest();
        
        HRTraining.upsertTrainings(
            jsonBody,
            org.Id
        );
        
        Test.stopTest();
    }
    @isTest
    static void testUpsertFacilityCompliance() {
        
        TestDataFactory.createBaseData();
        
        Facility__c fac = [
            SELECT Id
            FROM Facility__c
            LIMIT 1
        ];
        
        Training__c tr = new Training__c(
            Name = 'Compliance Training'
        );
        
        insert tr;
        
        List<Map<String, Object>> reqList =
            new List<Map<String, Object>>();
        
        Map<String, Object> req =
            new Map<String, Object>();
        
        req.put('facilityId', fac.Id);
        req.put('trainingId', tr.Id);
        
        req.put('roles', 'Admin');
        req.put('name', 'Document Test');
        
        req.put('category', 'Professional Development');
        req.put('validFor', '12 Months');
        
        req.put('mandatory', true);
        req.put('visibleToStaff', true);
        req.put('renewalRequired', true);
        
        req.put('notes', 'test');
        
        reqList.add(req);
        
        String requestJson =
            JSON.serialize(reqList);
        
        Test.startTest();
        
        HRTraining.upsertFacilityCompliance(
            requestJson
        );
        
        Test.stopTest();
    }
    @isTest
static void testGetTrainings() {

    Organisation__c org = [
        SELECT Id
        FROM Organisation__c
        LIMIT 1
    ];

    Facility__c fac = [
        SELECT Id
        FROM Facility__c
        LIMIT 1
    ];
 

    Training__c tr = new Training__c();

    tr.Name = 'Wyzed Training';
    tr.Module_Name__c = 'LWC Module';

    tr.Organization__c = org.Id;

    tr.Is_Wyzed_Course__c = true;

    tr.Course_Owner_Id__c = 'OWNER-1';

    tr.Wyzed_Course_ID__c = 'COURSE-1';

    tr.Training_Category__c = 'Professional Development';

    tr.Visible_to_Staff__c = true;

    tr.Renewal_Date_Required__c = true;

    tr.Mandatory_Document__c = true;

    tr.Valid_For__c = '12 Months';

    tr.Notes__c = 'Test Notes';

    insert tr;

    Facility_Compliance_Setting__c fc =
        new Facility_Compliance_Setting__c();

    fc.Facility__c = fac.Id;

    fc.Training__c = tr.Id;

    fc.Roles__c = 'Admin;AIN';

    fc.Document_Name__c = 'Doc';

    fc.Compliance_Category__c = 'Trainings';

    fc.Training_Category__c = '	Professional Development';

    insert fc;

    Test.startTest();

    HRTraining.TrainingResponseWrapper res =
        HRTraining.getTrainings(org.Id);

    Test.stopTest();
}
@IsTest
static void testGetTrainingById_UsingId() {

    Training__c training = [
        SELECT Id,
               Name,
               Training_UID__c
        FROM Training__c
        LIMIT 1
    ];

    Test.startTest();

    List<Training__c> result =
        HRTraining.getTrainingById(
            String.valueOf(training.Id)
        );

    Test.stopTest();
}
}