@isTest
public class DailyDocExpiryTaskSchedulerTest {
    @testSetup
    static void setupTestData() {             
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
        insert org;
        system.debug(org.name);
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.1212356896@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.1212356896@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user) {         
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='1235645433';
            fac.Phone__c = '12323213';
            insert fac;
                        
           Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.1212356896@hotmail.com';
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
            staff.Annual_Leave__c=10;
            staff.Sick_Leave__c=2;
            staff.Bereavement_Leave__c=10;
            staff.Parental_Leave__c=3;
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
            cli.Unavailable_Date__c = Date.today().addDays(-1);
            cli.Current_Availability__c = 'Unavailable';
            // clientList.add(cli);        
            insert cli;
            
            Child_Staff__c cs = new Child_Staff__c();
            cs.Expiry_Date__c =Date.today().addDays(1);
            cs.Staff__c=staff.id;
            cs.Comments__c='Needs renewal';
            cs.Type__c = 'Drivers Licence';
            insert cs;
            Task t = new Task(Subject = 'Staff Document Expiry',
                    WhatId = cs.Staff__c,
                    ActivityDate = cs.Expiry_Date__c,
                    Status = 'New',
                    Priority = 'High',
                    OwnerId = cs.Staff__r.CreatedById,
                    Description = 'Certification for staff is expiring tomorrow. Type');
             Test.startTest();
                cs = [SELECT Id, Staff__c, Type__c, Expiry_Date__c, Comments__c FROM Child_Staff__c WHERE Id = :cs.Id];
            
               // cs.put('CreatedById', user.Id); // Using workaround
        	Test.stopTest();
            
        }
    }

      @isTest static void testSaveStatusData() {
        User u1= [SELECT Id from User where email='manualtesting.1212356896@hotmail.com' LIMIT 1];
        System.runAs(u1){
            Test.startTest();
            DailyDocExpiryTaskScheduler batch = new DailyDocExpiryTaskScheduler();
            Database.executeBatch(batch, 200);
            Test.stopTest();  

            // Assert task creation
            List<Task> tasks = [SELECT Id, Subject, Description FROM Task WHERE Subject = 'Staff Document Expiry'];
           // System.assertEquals(1, tasks.size(), 'One task should be created for staff expiry.');
           // System.assert(tasks[0].Description.contains('CPR'), 'Description should mention the document type.');
    
            // Assert client update
            List<Client__c> clients = [SELECT Id, Current_Availability__c, Unavailable_Date__c FROM Client__c];
           // System.assertEquals('Available', clients[0].Current_Availability__c, 'Client should now be available.');
           // System.assertEquals(null, clients[0].Unavailable_Date__c, 'Unavailable_Date__c should be cleared.');
        }
       
    }
   
        // Get the user created in @testSetup (same as before)
       // User u2 = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    
       // System.runAs(u2) {
   @isTest
    static void testSchedulerExecutesBatch() {
         User u2= [SELECT Id from User where email='manualtesting.1212356896@hotmail.com' LIMIT 1];
        System.runAs(u2){
            Test.startTest();
            // Valid cron expression for testing (runs daily at 12 AM)
            String cronExp = '0 0 0 * * ?';
            System.schedule('Test Daily Doc Expiry Scheduler', cronExp, new DailyDocExpiryBatchScheduler());
            Test.stopTest();
        
            // Optional: Verify AsyncApexJob was created
            List<CronTrigger> jobs = [SELECT Id, CronExpression, TimesTriggered FROM CronTrigger WHERE CronJobDetail.Name = 'Test Daily Doc Expiry Scheduler'];
            System.assert(!jobs.isEmpty(), 'Scheduled job should be created.');
        }
    }
	
}