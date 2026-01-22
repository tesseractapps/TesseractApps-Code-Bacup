@IsTest
private class PayrollPdfDataTest {
    
    @TestSetup
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
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294444637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20294444637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20294444637@hotmail.com';
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
            
            List<Leave__c> leaves = new List<Leave__c>{
                new Leave__c(Staff__c = staff.Id, Type_of_Leave__c='Annual Leave', Duration__c=2, Status__c='Approved'),
                new Leave__c(Staff__c = staff.Id, Type_of_Leave__c='Sick Leave', Duration__c=1, Status__c='Approved')
            };
            insert leaves;
            
            Allocation__c alloc = new Allocation__c(
                Staff__c = staff.Id,
                Start_Date__c = Date.today().addDays(-7),
                End_Date__c = Date.today(),
                General_Hourly_pay_rate__c = 30,
                General_Working_Hours__c = 38,
                Saturday_Hourly_Rate__c = 35,
                Saturday_Hours__c = 5
            );
            insert alloc;
            
            Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Group_Name__c='group';
            payrollRecord.Frequency__c='Weekly';
            payrollRecord.Facility__c = fac.Id;
            payrollRecord.Status__c='Submitted';
            payrollRecord.Period_Start_Date__c = Date.newInstance(2021,08,01);
            payrollRecord.Period_End_Date__c =Date.newInstance(2021,08,01);
            payrollRecord.Next_Pay_Date__c= Date.newInstance(2021,08,01);
            insert payrollRecord;
            
            
            // Create Payroll Setting
            List<Staff_Payroll_Setting__c> staffPayrollList =  new List<Staff_Payroll_Setting__c>();
            for(Integer i=0;i<=3;i++){
                Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
                staffpayRecord.Working_Hours__c=40;
                staffpayRecord.Staff__c=staff.Id;
                staffpayRecord.Payroll_Setting__c = payrollRecord.Id;
                staffPayrollList.add(staffpayRecord);
            }
            
            insert staffPayrollList;
        }
    }
    
    @IsTest
    static void testStatusPayrollSetting() {
        // Step 1: Create test data
        Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
        payrollRecord.Group_Name__c='group';
        payrollRecord.Frequency__c='Weekly';
        payrollRecord.Status__c='';
        payrollRecord.Period_Start_Date__c = system.today().addDays(-7);
        payrollRecord.Period_End_Date__c = System.today();
        payrollRecord.Next_Pay_Date__c= System.today().addDays(2);
        insert payrollRecord;
        
        // Step 2: Call the method being tested
        Test.startTest();
        Payroll_Setting__c result = PayrollPdfData.statusPayrollSetting(payrollRecord.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testUpdateSubmit_Submitted() {
        // Fetch the test records
        Payroll_Setting__c paySetting = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
        Staff_Payroll_Setting__c staffPay = [SELECT Id, Payroll_Setting__c FROM Staff_Payroll_Setting__c LIMIT 1];

        // Test input values
        String newStatus = 'Submitted';
        String newPayDate = '2025-01-01';

        Test.startTest();
        List<String> updateSubmit = PayrollPdfData.updateSubmit(paySetting.Id, newStatus, newPayDate);
        List<PayrollPdfData.paySlipData> payrollRun = PayrollPdfData.payrollRun(staffPay.Id);
        Test.stopTest();

    }
    
}