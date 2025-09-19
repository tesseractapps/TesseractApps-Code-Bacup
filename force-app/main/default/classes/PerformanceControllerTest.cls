@isTest
public class PerformanceControllerTest {
     @testsetup Static void testData(){
        Organisation__c org = new Organisation__c();
        org.Name='Age Grace Innovation PVT LTD';
        org.ABN__c='15603031803';
        org.ACN__c='123456789';
        org.Contact_No__c='7989067221';
        org.RCTI__c='007';
        org.Email__c='agegrace2@gmail.com';
        org.Bank__c='Bank1';
        org.BSB__c='BSB';
        org.Account_Name__c='Axis Bank';
        org.Account_Number__c='11111111110';
        org.Description__c='Test Description';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI125b8925-9a97-4178';
        org.SoftwareId__c = '0000521413';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
     
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.209465@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209465', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.209465@hotmail.com',Organization_Name__c ='Age Grace Innovation PVT LTD');
        insert user;
         
        System.runAs(user){
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            insert fac; 
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.209465@hotmail.com';
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
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            insert staff; 
            
            Performance__c performance = new Performance__c();
            performance.Staff__c = staff.Id;
            performance.Staff_Email__c = 'praveenshesham@tesseractapps.com';
            performance.Facility__c = 'Age grace innovations private limited';
            performance.Role__c = 'Admin';
            performance.Level__c = 'Roster Manager';
            performance.Review_Period_From__c = Date.newInstance(2025, 02, 06);
            performance.Review_Period_To__c =  Date.newInstance(2025, 02, 10); 
            performance.Reviewer__c = staff.Id;
            performance.Reviewer_Email__c = 'manimala.jeebu@tesseractapps.com';
            performance.Status__c = '';
            performance.Date_Of_Joining__c=  Date.newInstance(2024, 05, 24); 
            performance.Mid_Year_Reveiw_Required__c = true;
            performance.Mid_Year_Reveiw_Date__c=  Date.newInstance(2025, 01, 27); 
            performance.Goal_setting_meeting_conducted_with_Staf__c ='Yes';
            performance.Outcome_or_Weightage__c= 0 ;
            performance.Staff_Submission_Date__c=Date.newInstance(2025, 02, 09);
            insert performance;
            
            Goal__c goal = new Goal__c();
            goal.Library_Goal__c='';
            goal.Goal_Name__c ='goal name 1' ;
            goal.Private__c =true; 
            goal.Start_Date__c = Date.newInstance(2025, 02, 06);
            goal.End_Date__c =Date.newInstance(2025, 02, 10); 
            goal.Target_Completion_Date__c =Date.newInstance(2025, 02, 08); 
            goal.Priority__c ='Medium' ;
            goal.Actual_Weightage_of_the_Goal__c =100;
            goal.Related_Link__c = 'www.google.com';
            goal.Description__c = 'Test';
            goal.Success_Criteria__c = 'Test';
            goal.Conversation_Notes__c ='Test';
            goal.Performance__c=performance.Id;
            goal.Reviewer_Assigned_Weightage__c=100;
            goal.Reviewer_Comments__c='Test';
            goal.Staff_Assigned_Weightage__c=100;
            goal.Staff_Comments__c='Test';
            insert goal;
            
            Library_Goal__c libraryGoal = new Library_Goal__c(); 
            libraryGoal.Actual_Weightage_of_the_Goal__c=100;
            libraryGoal.Description__c='Test';
            libraryGoal.Level__c='HR Admin';
            libraryGoal.Name='Library Goal 1';
            libraryGoal.Role__c='Admin';
            insert libraryGoal;
            
          /*  test.StartTest();
            PerformanceController.fetchLibraryGoalDetails(libraryGoal.Id);
            PerformanceController.getUserData();
            PerformanceController.getUserDetails();
            PerformanceController.getReviewer(org.Id);
            PerformanceController.getPerformanceById(performance.Id); 
            test.StopTest();*/
        }      
     }
    
    @isTest
    public static void getStaffListTest(){
        
        Organisation__c orgIds =[SELECT Id from Organisation__c LIMIT 1];
        String orgId =orgIds.Id;
        Library_Goal__c libraryGoal = [SELECT ID ,  Level__c FROM Library_Goal__c LIMIT 1];
        Performance__c per = [SELECT Id From Performance__c LIMIT 1];
        String perfId = per.Id;
        Staff__c staff= [SELECT Id FROM Staff__c LIMIT 1];
        User u1= [SELECT Id ,User_Type__c from User where email='manualtesting.209465@hotmail.com' LIMIT 1];
        String level= u1.User_Type__c;
        System.runAs(u1){
            test.StartTest();
            PerformanceController.fetchLibraryGoalDetails(libraryGoal.Id);
            PerformanceController.getUserData();
            PerformanceController.getUserDetails();
            PerformanceController.getReviewer(orgId);
            PerformanceController.getPerformanceById(perfId); 
            PerformanceController.getGoalsByPerformanceId(perfId);
            PerformanceController.checkPerformanceRecordExist(staff.Id);
            PerformanceController.getStaffList('HR Admin',orgId);
            PerformanceController.getStaffList('',orgId);
            PerformanceController.getPerformanceRecords(orgId,'HR Admin');
            PerformanceController.getPerformanceRecords(orgId,'NDIS Staff');
            PerformanceController.getPerformanceRecords(orgId,'Roster Manager');
            PerformanceController.getPerformanceRecords(orgId,'');
            PerformanceController.getStaffReviewerDetails(staff.Id ,True );
            PerformanceController.getStaffReviewerDetails(staff.Id ,False );
            PerformanceController.getLibraryGoals('level','HR Admin'); 
            PerformanceController.getLibraryGoals('',''); 
            PerformanceController.updatePerformanceOutcome(perfId);
            test.StopTest();
        }
    }
    
    @isTest
    public static void updateGoalDataTest(){
        List<Goal__c> goals = [ SELECT Id,Staff_Comments__c, Staff_Assigned_Weightage__c, Reviewer_Comments__c, 
                       Reviewer_Assigned_Weightage__c,Performance__r.Status__c,Performance__r.Staff_Submission_Date__c FROM Goal__c];
     
        User u2= [SELECT Id from User where email='manualtesting.209465@hotmail.com' LIMIT 1];
       // String level= u2.User_Type__c;
           
        System.runAs(u2){
            test.StartTest();
            PerformanceController.updateGoalData(goals);
            PerformanceController.updatePerformanceStatus(goals); 
            test.StopTest();
        }
    }
   /* @isTest
    public static void  insertPerformanceGoalTest(){
         List<Map<String, Object>> goalDataList = new List<Map<String, Object>>();
         Map<String, Object> goalData1 =  
    }*/
   
}