@isTest
public class RoasterManagementHandlerTest {
	/*@isTest
    public static  void  createUserRole(){
         UserRole role = new UserRole();
         role.name ='Portal Account Partner Executive';
         insert role ;
         
    } */
  
	@testsetup Static void testData(){ 
        Organisation__c org = OrgDetailsTest.createOrganization();
        
    
        Account acc = new Account ();
        acc.name='Portal Account';
        insert acc;
        
        contact cc = new contact();      
        cc.FirstName='Test ';
        cc.LastName='monday223';
        cc.Email='manualtesting.40329@hotmail.com';
        cc.AccountId=acc.id;
        insert cc;
        
         Id profileId = [Select Id,Name From Profile Where Name LIKE '%Channel Account User1%'].Id;
       
   
         User user = new User(Alias = 'praveen', Email= 'manualtesting.4012239@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test monday239', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = profileId, TimeZoneSidKey='America/New_York', UserName='manualtesting.4012239@hotmail.com',Organization_Name__c ='Pinnacle IT'
                            ,ContactId=cc.id);
         insert user;
        
       /* UserRole role = [SELECT Id FROM UserRole WHERE Name = 'Portal Account Partner Executive' LIMIT 1];
        user.UserRoleId = role.Id;
                update user;  */
        
         System.runAs (user) {
            Facility__c fac = new Facility__c();
            fac.Name='test facilty';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Email__c= 'testfacility@gmail.com';
            fac.Status__c=true;
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Name= 'Test Staff';
            staff.Last_Name__c='Test';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c='manualtesting.4012239@hotmail.com';
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
            
           /* Allocation__c alocRec=new Allocation__c();
            alocRec.End_Date__c=date.newInstance(2024, 01, 15);
            alocRec.Start_Date__c=date.newInstance(2024, 01, 16);
            alocRec.Start_time__c='5:30 pm';
            alocRec.Start_Date_Time__c=Time.newInstance(17, 30, 00, 00);
            alocRec.End_time__c='7:30 pm';
            alocRec.End_Date_Time__c=Time.newInstance(19, 30, 00, 00);
            alocRec.Working_Hours__c=2;
            alocRec.Staff__c=staff.id;
            alocRec.Status__c='Draft';
            insert alocRec;  */
             
            Allocation__c alocRec = new Allocation__c();
            alocRec.Start_Date__c = Date.newInstance(2024, 01, 15); // Start Date
            alocRec.End_Date__c = Date.newInstance(2024, 01, 15);   // Same Date as Start Date
            alocRec.Start_time__c = '5:30 pm';                      // Start Time
            alocRec.Start_Date_Time__c = Time.newInstance(17, 30, 00, 00); // 5:30 PM
            alocRec.End_time__c = '7:30 pm';                        // End Time
            alocRec.End_Date_Time__c = Time.newInstance(19, 30, 00, 00);   // 7:30 PM
            alocRec.Working_Hours__c = 2;                           // Working Hours
            alocRec.Staff__c = staff.Id;                            // Staff Reference
            alocRec.Status__c = 'Draft';                            // Status
			insert alocRec; // Insert the record

            
            Allocation__c alocRec1=new Allocation__c();
            alocRec1.End_Date__c=date.newInstance(2024, 01, 16);
            alocRec1.Start_Date__c=date.newInstance(2024, 01, 16);
            alocRec1.Start_time__c='5:30 pm';
            alocRec1.Start_Date_Time__c=Time.newInstance(17, 30, 00, 00);
            alocRec1.End_time__c='7:30 pm';
            alocRec1.End_Date_Time__c=Time.newInstance(19, 30, 00, 00);
            alocRec1.Working_Hours__c=2;
            alocRec1.Staff__c=staff.id;
            alocRec1.Status__c='Draft';
            insert alocRec1;
            
            string dateValue='2023-12-13';
            string whours='2.5';
            string starttime='06:00:00Z';
            string endTime='09:00:00Z';
            string breaktime='30';
            string startTimeString='6:00 am';
            string endTimeString='9:00 am';
            String staffId = staff.Id;
            string status='Approved';
            string updatedEndtime='09:30:00Z';
            string Updatetime='9:30 am';
            string updateHours='3';
            boolean isupdate =true;
            String allocationId=alocRec.id;
        
            //Facility__c fac1 = [SELECT Id From Facility__c LIMIT 1];
            //Staff__c staff = [Select Id from Staff__c LIMIT 1]
            Test.startTest();
                List<Allocation__c> result = RoasterManagementHandler.getStaffAlocationData(fac.Id);
                List<Staff__c> result1 = RoasterManagementHandler.getStaffAllocation(staff.Id);
                RoasterManagementHandler.createAllocation(dateValue, staffId,whours,starttime,endtime,breakTime,status,startTimeString,endTimeString,isupdate,allocationId);
                boolean isupdate2=false;
                RoasterManagementHandler.createAllocation(dateValue, staffId,whours,starttime,endtime,breakTime,status,startTimeString,endTimeString,isupdate2,allocationId);
            
            Test.stopTest();
        }
    }
    
    @isTest
    public static void testgetStaffAlocationData(){ 
        //Allocation__c allocs = [SELECT Id From Allocation__c];
      
        User u= [SELECT Id from User where email='manualtesting.4012239@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Test.startTest();
             string dateValue='2023-12-13';
            string facName='test facilty';
        	RoasterManagementHandler.getAlocationData(dateValue,facName);
        	Test.stopTest();
        }
        
    }
      @isTest
    public static void createTimeSheet(){ 
        List<Allocation__c> allocationList = [SELECT Id,Staff__c From Allocation__c];        
        List<String> ids = new List<String>();
        Staff__c sta1 = [select id,Name from Staff__c LIMIT 1];
        String staffId = sta1.Id;
        Allocation__c allo = [SELECT Id,Staff__c from Allocation__c LIMIT 1];
        String stafId = allo.Id;
        for(Allocation__c alloc:allocationList){
            ids.add(alloc.id);
        }
        String duration ='4';
        date startdate=date.newInstance(2024, 01, 03);
        date enddate=date.newInstance(2024, 01, 03);
        
        date WeekStartDate=date.newInstance(2024, 01, 03);
        date WeekendDate=date.newInstance(2024, 01, 03);

		date selectedDate=date.newInstance(2024, 01, 03); 
        
        String Year = '2024';
        String Month = '10';
        String Day = '16';
        String start_date = Year + '-' + Month + '-' + Day;  
        
        String Year1 = '2024';
        String Month1 = '10';
        String Day1 = '16';
        String end_date = Year1 + '-' + Month1 + '-' + Day1; 
        User u= [SELECT Id from User where email='manualtesting.4012239@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Test.startTest();
            RoasterManagementHandler.createTimeSheet(startdate, enddate,ids,duration,staffId);
            RoasterManagementHandler.getRosterAllocationInvoiceData(stafId, start_date, end_date);
            RoasterManagementHandler.getIctList(stafId,start_date, end_date);
            RoasterManagementHandler.clonePreviousDayAllocation(selectedDate, stafId);
            RoasterManagementHandler.updateTimeSheets(WeekStartDate, WeekendDate, staffId);
            Test.stopTest();
        }
    }
   
}