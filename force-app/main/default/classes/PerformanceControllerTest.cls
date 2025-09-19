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
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.209465@hotmail.com',User_Type__c = 'NDIS Staff',
                             Organization_Name__c ='Age Grace Innovation PVT LTD');
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
            fac.Phone__c= '24343423432';
            fac.ABN__c = '736473632324';
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
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff1';
            staff1.Name='praveen1';
            staff1.Name__c='abcdr';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.4139561@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='990845829528';
            staff1.Emp_exit_date__c = date.newInstance(2027, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2026, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Annual_Leave__c=10;
            staff1.Sick_Leave__c=2;
            staff1.Bereavement_Leave__c=10;
            staff1.Parental_Leave__c=3;
            insert staff1; 
            
             Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant2948';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s='8 Keewong Street';
            cli.Address__City__s = 'Crace';
            cli.Address__StateCode__s='ACT';
            cli.Address__PostalCode__s='2911';
            cli.Contact_Number__c='4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c='Jason';
            cli.Primay_Contact_Last_Name__c='Smith';
            cli.Relationship__c='Parent';
            cli.Email__c='manualtesting.4139559@hotmail.com';
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
            cli.Status__c=true;
            cli.Medications__c = 'Test Medication';
            cli.Allergies__c = 'Test Allergies';
            cli.Notes__c = 'Test Notes';
            cli.Unavailable_Date__c = Date.newInstance(2025, 05, 16);
            // clientList.add(cli);        
            insert cli;
            
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
            performance.Status__c = 'Need Reviewer Acceptance';
            performance.Date_Of_Joining__c=  Date.newInstance(2024, 05, 24); 
            performance.Mid_Year_Reveiw_Required__c = true;
            performance.Mid_Year_Reveiw_Date__c=  Date.newInstance(2025, 01, 27); 
            performance.Goal_setting_meeting_conducted_with_Staf__c ='Yes';
            performance.Outcome_or_Weightage__c= 0 ;
            performance.Staff_Submission_Date__c=Date.newInstance(2025, 02, 09);
            insert performance;
            
            Performance__c performances = new Performance__c();
            performances.Staff__c = staff1.Id;
            performances.Staff_Email__c = 'praveenshesham@tesseractapps.com';
            performances.Facility__c = 'Age grace innovations private limited';
            performances.Role__c = 'Admin';
            performances.Level__c = 'Roster Manager';
            performances.Review_Period_From__c = Date.newInstance(2025, 02, 06);
            performances.Review_Period_To__c =  Date.newInstance(2025, 02, 10); 
            performances.Reviewer__c = staff.Id;
            performances.Reviewer_Email__c = 'manimala.jeebu1@tesseractapps.com';
           // performances.Status__c = '';
             performances.Status__c = 'Completed';
            performances.Date_Of_Joining__c=  Date.newInstance(2024, 05, 24); 
            performances.Mid_Year_Reveiw_Required__c = true;
            performances.Mid_Year_Reveiw_Date__c=  Date.newInstance(2025, 01, 27); 
            performances.Goal_setting_meeting_conducted_with_Staf__c ='Yes';
            performances.Outcome_or_Weightage__c= 0 ;
            performances.Staff_Submission_Date__c=Date.newInstance(2025, 02, 09);
            insert performances;
            
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
            
            Date today = Date.today();
            insert new List<Leave__c>{
                new Leave__c(Approved_by__c = 'Maheswari',
            Comments__c = 'Test Comments',
            Duration__c = 40,
            Staff__c = staff.Id,
            Type_of_Leave__c = 'Annual Leave',
            Status__c = 'Requested',
            From__c=Date.newInstance(2024, 03, 16),
            To__c=Date.newInstance(2024, 03, 17)),
                new Leave__c(Approved_by__c = 'Maheswari',
            Comments__c = 'Test Comments',
            Duration__c = 40,
            Staff__c = staff.Id,
            Type_of_Leave__c = 'Annual Leave',
            Status__c = 'Requested',
            From__c=Date.newInstance(2024, 03, 16),
            To__c=Date.newInstance(2024, 03, 17)),
                new Leave__c(Approved_by__c = 'Maheswari',
            Comments__c = 'Test Comments',
            Duration__c = 40,
            Staff__c = staff.Id,
            Type_of_Leave__c = 'Annual Leave',
            Status__c = 'Approved',
            From__c=Date.newInstance(2024, 03, 16),
            To__c=Date.newInstance(2024, 03, 17))
            }; 
           /* Leave__c leave = new leave__c();
            leave.Approved_by__c = 'Maheswari';
            leave.Comments__c = 'Test Comments';
            leave.Duration__c = 40;
            leave.Staff__c = staff.Id;
            leave.Type_of_Leave__c = 'Annual Leave';
            leave.Status__c = 'Requested';
            leave.From__c=Date.newInstance(2024, 03, 16);
            leave.To__c=Date.newInstance(2024, 03, 17);
            insert leave;  */
            
            Library_Goal__c libraryGoal = new Library_Goal__c(); 
            libraryGoal.Actual_Weightage_of_the_Goal__c=100;
            libraryGoal.Description__c='Test';
            libraryGoal.Level__c='HR Admin';
            libraryGoal.Name='Library Goal 1';
            libraryGoal.Role__c='Admin';
            insert libraryGoal;
            Test.startTest();
            Map<String, Integer> result = PerformanceManagmentChartController.getPerformanceManagmentStatusData(user.Id, fac.Id);
           // System.assertEquals(1, result.get('needReviewerAcceptance'));
        	//System.assertEquals(1, result.get('completed'));
            Map<String, Integer> res = PerformanceManagmentChartController.getLeaveStatusCounts(user.Id, fac.Id);
            PerformanceManagmentChartController.getParticipantOptions(user.Id);
            List<Client__c> clie = PerformanceManagmentChartController.getFundData(cli.Id);
            Test.stopTest();                      
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
            PerformanceController.getLibraryGoals(orgIds.Id,'level','HR Admin'); 
            PerformanceController.getLibraryGoals('','',''); 
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
      @isTest
    static void testParticipantOptionConstructor() {
        // Sample input
        String testId = '001XXXXXXXXXXXX';
        String testName = 'John Doe';

        // Create instance
        PerformanceManagmentChartController.ParticipantOption option = new PerformanceManagmentChartController.ParticipantOption(testId, testName);

        // Assert values
        System.assertEquals(testId, option.value, 'The value should match the input id');
        System.assertEquals(testName, option.label, 'The label should match the input name');
    }
   
}