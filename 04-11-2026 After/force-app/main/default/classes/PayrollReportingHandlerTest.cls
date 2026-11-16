@isTest
public class PayrollReportingHandlerTest {
    @testsetup Static void testData(){
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
        org.Account_Number__c=1111111111;
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.301234@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne1234', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.301234@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            staff.Name = 'Staff1';
            staff.Last_Name__c='Test';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c='manualtesting.301234@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Employment_type__c = 'Weekly';
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
            staff.Type__c= 'Visa Status';
            staff.Working_Hours_Rate__c = 100;
            insert staff;
            
            Staff__c staff1 = new Staff__c();
            staff1.Name = 'Staff11';
            staff1.Last_Name__c='Test1';
            staff1.Contact_Number__c='567899087';
            staff1.Email_Address__c='manualtesting.30931@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Employment_type__c = 'Monthly';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='99084582958';
            staff1.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c= 'Visa Status';
            staff1.Working_Hours_Rate__c = 100;
            insert staff1;
            
            Expenses__c exp = new Expenses__c();        
            exp.Type_of_Expense__c = 'Rent';
            exp.Sub_type__c = 'Facility Rent';
            exp.Date__c = SYSTEM.TODAY();
            exp.Amount__c = 20000;
            exp.Comments__c = 'Test Comments';
            exp.Facility__c = fac.Id;
            insert exp;
            
            Invoice_Parent__c invParent = new Invoice_Parent__c();
            invParent.Tax_Invoice__c = 'INV-002';
            invParent.Date_Issued__c = System.today();       
            insert invParent;
            
            Payroll_Setting__c pay = new Payroll_Setting__c();
            pay.Frequency__c = 'Weekly';
            pay.Group_Name__c = 'Age Grace Jan';
            pay.Facility__c = fac.Id;
            pay.Period_Start_Date__c = date.newInstance(2023, 03, 02);
            pay.Period_End_Date__c = date.newInstance(2023, 03, 10);
            pay.Next_Pay_Date__c = date.newInstance(2023, 03, 13);
            pay.Status__c = null;
            insert pay;

            List<Staff_Payroll_Setting__c> payrollSettings = new List<Staff_Payroll_Setting__c>();  
            
            payrollSettings.add(new Staff_Payroll_Setting__c(           
                Working_Hours__c=40,
                Payroll_Setting__c = pay.Id,
                Staff__c = staff.Id,
                Pay_Date__c=date.newInstance(2023, 03, 10)
            ));
            
            payrollSettings.add(new Staff_Payroll_Setting__c(           
                Working_Hours__c=NULL,
                Payroll_Setting__c = pay.Id,
                Staff__c = staff1.Id,
                Pay_Date__c=date.newInstance(2023, 03, 10)
            ));        
            insert payrollSettings;  
        }
    }
    @isTest
    public static void TestfetchExpenses(){
        List<Expenses__c> expense = [SELECT ID, Facility__c FROM Expenses__c];
        string facility = 'Test Facility';
        PayrollReportingHandler.fetchExpenses(Date.today().addDays(-30), Date.today().addDays(-20),facility);
    }
    @isTest
    public static void TestfetchInvoices(){
        Invoice_Parent__c inv = [SELECT ID,Org_Name__c FROM Invoice_Parent__c LIMIT 1];
        String  orgName = inv.Org_Name__c;
        PayrollReportingHandler.fetchInvoices(Date.today().addDays(-30), Date.today().addDays(-20),orgName);
    }
    @isTest
    static void testFetchStaffPayrollSetting() {
        User u1= [SELECT Id from User where email='manualtesting.301234@hotmail.com' LIMIT 1];
        List<Payroll_Setting__c> payrollList = [SELECT Id from Payroll_Setting__c];
        List<Staff_Payroll_Setting__c> staffPayroll = [Select Id from Staff_Payroll_Setting__c];        
       	System.runAs(u1){            
           List<Facility__c> facilities = [SELECT Id, Name FROM Facility__c LIMIT 1];
          // Facility__c facility = facilities[0];
          
           List<Staff_Payroll_Setting__c> payrollRecords = new List<Staff_Payroll_Setting__c>();
           PayrollReportingHandler.PayrollWrapper payrollWrapper = new PayrollReportingHandler.PayrollWrapper(
               'mahi test',
               1000,        
               200,        
               5000,        
               10000,      
               8000,       
               7500,   
               12000,      
               2000     
           ); 
            
            Payroll_Setting__c ps=[select id,Period_Start_Date__c,Period_End_Date__c,Org_Name__c from Payroll_Setting__c limit 1];  
       		Staff_Payroll_Setting__c payrollRecord = new Staff_Payroll_Setting__c(
            Super_Annuation1__c = payrollWrapper.superAnnuation,
           // Gross_Salary__c = payrollWrapper.gross,
            Pre_tax_values__c = payrollWrapper.totalpreTax,
            Payroll_Setting__c=ps.id,
            Post_tax_values__c = payrollWrapper.totalpostTax);        
            payrollRecords.add(payrollRecord); 
            insert payrollRecords;
            System.debug('payrollRecords >>'+payrollRecords.size());
       
            List<Organisation__c> orgs = [SELECT Name FROM Organisation__c LIMIT 1];
            Organisation__c org = orgs[0];
            system.debug('facility list in test calss'+facilities);
            system.debug('orgnaisation list in test calss'+orgs);
            Test.startTest();
            List<PayrollReportingHandler.PayrollWrapper> payrollSettings1 = PayrollReportingHandler.fetchStaffPayrollSetting(Date.newInstance(2023, 03, 02), Date.newInstance(2023, 03, 10), org.Name, facilities[0].Id);
            Test.stopTest();
         }
    }
}