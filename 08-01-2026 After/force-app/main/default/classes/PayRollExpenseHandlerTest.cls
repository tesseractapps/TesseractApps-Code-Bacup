@isTest
public class PayRollExpenseHandlerTest {
    public static List<Expenses__c> createAdvertisements(){
       
        List<Expenses__c> expensesList = new List<Expenses__c>();
        for(Integer i=0;i<=3;i++){
           Expenses__c expenses = new Expenses__c();
            expenses.Comments__c='expenses'+i;
            expenses.Amount__c=10;
            expenses.Date__c=system.today();
            //expenses.Facility__c=facility[0].Id;
            expenses.Sub_type__c='PPE';
            expenses.Type_of_Expense__c='Rent';
            expensesList.add(expenses);
        }
         try{
            insert expensesList; 
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        
        return expensesList;
    }
    static testMethod void expensesTest() {
        Test.startTest();        
       
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
        insert org;
        
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.40359@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne40359', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.40359@hotmail.com',
                             Organization_Name__c ='Ashfield Consultants',Facility_Name__c='Ashfield Consultants');
        insert user;
        system.debug( 'usrer in test calss'+user);
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
        fac.Key_Words__c = 'Test Description';
        insert fac;
        
        
        
        Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.40359@hotmail.com';
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
            insert staff;
       
        String facid = fac.id;
      System.runAs(user){   
           list<Expenses__c> createExpenseList= PayRollExpenseHandlerTest.createAdvertisements();
            list<Expenses__c> expenseList=[select id,Facility__c from Expenses__c ];
            for(Expenses__c exp:expenseList){
                exp.Facility__c=facid;
            }
            update expenseList;
            String keyWords = 'Words';
            List<Facility__c> facRecords = [SELECT Id, Key_Words__c FROM Facility__c LIMIT 1]; 
             
            system.debug('expenseList'+expenseList);
            date startdate=date.newInstance(2024, 01, 03);
            date enddate=date.newInstance(2024, 01, 03);
            PayRollExpenseHandler.getExpensesData(facid,startdate,enddate);
            PayRollExpenseHandler.getExpensesData(null,startdate,enddate);
             String sDate ='2024-03-04';
            PayRollExpenseHandler.createExpensesAds('Rent', 'PPE',sDate, 'comments',  '10', facid, 'Yes');
            PayRollExpenseHandler.deleteRepository(expenseList[0].id);
            PayRollExpenseHandler.getSearchKeys();
            String base64Data = '\"Date,Description,Amount\\r\\n2024-03-04,Expense 1,100.50\\r\\n2024-03-04,Expense 2,200\\r\\n2024-03-04,Expense 3,300.50\\r\\n2024-03-04,Expense 4,400.50\\r\\n\"';
            List<Expenses__c> saveList= PayRollExpenseHandler.saveFile(facid, base64Data);
            
            String expenseJson = '[{"DateOfIssue":"2023-06-30","Amount":"-254.4","Description":"PAYMENT TO SECURE PARKING P PISEPLBKP","Id":"row-4","IncludeGST":true},{"DateOfIssue":"2023-06-30","Amount":"24496.16","Description":"PAYMENT FROM MASS IT CONSULTING PTY LTD","Id":"row-5","IncludeGST":true},{"DateOfIssue":"2023-06-30","Amount":"24496.16","Description":"PAYMENT FROM MASS IT CONSULTING PTY LTD","Id":"row-5","IncludeGST":true}]';
            PayRollExpenseHandler.insertExpenses(expenseJson);
          	PayRollExpenseHandler.insertInvoices(expenseJson);
          	PayRollExpenseHandler.saveSearchKey('Anz');
          
           Test.stopTest();
        
    }
   }
    
}