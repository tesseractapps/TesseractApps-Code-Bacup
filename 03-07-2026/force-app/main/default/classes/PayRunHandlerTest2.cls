@isTest
public class PayRunHandlerTest2 { 
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
        org.Contact_Name__c='Test1';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.5103356@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne51036', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.5103356@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c='12345678912';
            fac.Phone__c = '12323432';
            insert fac;
            
            Payroll_Setting__c pay = new Payroll_Setting__c();
            pay.Frequency__c = 'Weekly';
            pay.Group_Name__c = 'Age Grace Jan';
            pay.Facility__c = fac.Id;
            pay.Period_Start_Date__c = date.newInstance(2023, 03, 02);
            pay.Period_End_Date__c = date.newInstance(2023, 03, 10);
            pay.Next_Pay_Date__c = date.newInstance(2023, 03, 13);
            pay.Status__c = null;
            insert pay;
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test';
            staff1.Name = 'Staff1';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.5103356@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';            
            staff1.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Employment_type__c = 'Weekly';
            staff1.Management_Fee__c = 2;
            staff1.Residency_Type__c = 'Australian';
            staff1.Type__c = 'Visa Status';
            staff1.Expiry_Date__c = date.newInstance(2001, 02, 04);
            staff1.Working_Hours_Rate__c=40;
            staff1.Pre_Tax_One_Description__c='test one';
            staff1.Pre_Tax_One_Value__c=20;
            staff1.Pre_Tax_Two_Description__c='test two';
            staff1.Pre_Tax_Two_Value__c=20;
            staff1.Pre_Tax_Three_Description__c='test three';
            staff1.Pre_Tax_Three_Value__c=20;
            staff1.Pre_Tax_Four_Description__c='test four';
            staff1.Pre_Tax_Four_Value__c=20;
            staff1.Pre_Tax_Five_Description__c='test five';
            staff1.Pre_Tax_Five_Value__c=20;
            staff1.Pre_Tax_Calculator__c=20;
            staff1.Post_Tax_Decription__c='test post';
            staff1.Post_Tax__c=20;
            insert staff1; 
            
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Working_Hours__c=40;
            staffpayRecord.Payroll_Setting__c = pay.Id;
            staffpayRecord.Staff__c = staff1.Id;
            insert staffpayRecord;
            
            Allocation__c alocRec=new Allocation__c();
            alocRec.End_Date__c=date.newInstance(2023, 03, 10);
            alocRec.Start_Date__c=date.newInstance(2023, 03, 02);
            alocRec.Start_time__c='4:30 pm';
            alocRec.Start_Date_Time__c=Time.newInstance(16, 30, 00, 00);
            alocRec.End_time__c='6:30 pm';
            alocRec.End_Date_Time__c=Time.newInstance(18, 30, 00, 00);
            alocRec.Working_Hours__c=2;
            alocRec.Staff__c=staff1.id;
            alocRec.Working_Hours__c=2;
            alocRec.Sunday_hours__c=2;
            alocRec.Saturday_Hours__c=2;
            alocRec.Public_Holiday_Hours__c=3;
            alocRec.Status__c='Approved';
            insert alocRec; 
            
            Allocation__c alocRec1=new Allocation__c();
            alocRec1.End_Date__c=date.newInstance(2023, 03, 10);
            alocRec1.Start_Date__c=date.newInstance(2023, 03, 02);
            alocRec1.Start_time__c='4:30 pm';
            alocRec1.Start_Date_Time__c=Time.newInstance(16, 30, 00, 00);
            alocRec1.End_time__c='6:30 pm';
            alocRec1.End_Date_Time__c=Time.newInstance(18, 30, 00, 00);
            alocRec1.Working_Hours__c=2;
            alocRec1.Staff__c=staff1.id;
            alocRec1.Working_Hours__c=2;
            alocRec1.Sunday_hours__c=2;
            alocRec1.Saturday_Hours__c=2;
            alocRec1.Public_Holiday_Hours__c=3;
            alocRec1.Status__c='Approved';
            insert alocRec1;
            
            Allocation__c a = new Allocation__c();
            a.Start_Date__c = Date.newInstance(2023, 3, 5);
            a.End_Date__c   = Date.newInstance(2023, 3, 6);
            a.Staff__c      = staff1.Id;
            
            a.Shift_Cancelled__c = true;
            a.Shift_Cancel_Payment__c = 150;
            
           // a.Sleep_Over_Allocation__c = true;
            a.Sleepover_Night_shift_hours__c = 2;
            a.Sleepover_Night_Shift_hourly_rate__c = 50;
            a.Sleepover_Shift_Hours__c = 45.25;
            a.Penalty_Hours__c = 20.3;
            a.General_Hourly_pay_rate__c = 35.35;
            a.General_Working_Hours__c = 9.5;
            a.Morning_Working_Hours__c = 8.5;
            a.Long_Morning_Shift_Duartion__c = 15.5;
            a.Long_Afternoon_Shift_Duartion__c = 14.5;
            a.Long_Night_Shift_Duartion__c = 20.5;
            a.Long_Sleepover_Allowance__c = 15.5;
            a.Long_Afternoon_Duration_Two__c = 13.5;
            a.Long_Moring_Duration_Two__c = 22.5;
            a.Is_Custom_Shift__c = false;
            a.Sleep_Over_Allocation__c = true;
            a.Long_Morning_Shift_Duartion__c = 2;
            a.Long_Morning_Hourly_Rate__c = 40;
            
            a.Extended_Hours__c = 2;
            a.Extended_Hourly_Rate__c = 60;
            
            insert a;
            
            Leave__c sickLeave = new Leave__c(
                Staff__c = staff1.Id,
                Type_of_Leave__c = 'Sick Leave',
                Duration__c = 2,
                Status__c = 'Approved'
            );
            
            Leave__c annualLeave = new Leave__c(
                Staff__c = staff1.Id,
                Type_of_Leave__c = 'Annual Leave',
                Duration__c = 3,
                Status__c = 'Approved'
            );
            
            insert new List<Leave__c>{ sickLeave, annualLeave };
                }
    }
    
    @isTest
    public static void fetchPayrollStaffTest(){
        Payroll_Setting__c pays = [SELECT Id,Next_Pay_Date__c from Payroll_Setting__c LIMIT 1];
        Staff_Payroll_Setting__c staffList = [SELECT Id, Staff__r.Name, Staff__r.Last_Name__c, Payroll_Setting__r.Period_Start_Date__c, Payroll_Setting__r.Period_End_Date__c, Payroll_Setting__r.Next_Pay_Date__c, Total_Hours__c, Pre_Tax_Formula__c, Post_Tax_Formula__c, Gross_Salary_Display__c, Tax__c, Reimbursements__c, Super_Annuation_Final__c, Super_And_Voluntary_Supper_Annuation__c, Net_Pay__c, Amazon_URL__c FROM Staff_Payroll_Setting__c LIMIT 1];
        
        list<string> idList= new  list<string>();
        idList.add(staffList.id);
        
        String payrollId = pays.Id;
        test.startTest();
        PayRunHandler.fetchPayrollStaff();
        PayRunHandler.staffAllocationCalculation(payrollId);
        PayRunHandler.getFinalisedList(idList);
        
        User u2= [SELECT Id from User where email='manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u2){
            Staff__c staffs = [SELECT Id,Name__c,Last_Name__c,Role__c,Facility_Name__c FROM Staff__c limit 1];
            PayRunHandler.fetchPayrollStaff1('Age Grace Jan', 'Submitted');  
            MyProfileHandler.accpetedStaffPayroll('Ashfield Consultants',null,'2023-03-02' , '2023-03-10',false);
            PayRunHandler.getCustomMetaData('2023-07-01');
            payRunHandler.updatePayeventIndicator(idList);
            pays.Next_Pay_Date__c=date.newInstance(2023, 03, 14);
            update  pays; 
            
            RestRequest req = new RestRequest();
            req.requestUri = '/services/apexrest/MobileMyProfilePaySlipHandler';
            req.httpMethod = 'GET';
            req.params.put('staffId', staffs.Id);
            req.params.put('startDate', String.valueOf(Date.today().addDays(-30)));
            req.params.put('endDate', String.valueOf(Date.today()));
            req.params.put('pageNo', '1');
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Step 5: Call method
            
            MobileMyProfilePaySlipHandler.getPayrollRecords();
            MobileMyProfilePaySlipHandler.PayrollWrapper wrapper = new MobileMyProfilePaySlipHandler.PayrollWrapper(staffList);
            
            test.stopTest();
        }
    }
    @isTest
    public static void  payRollHandlerTest2(){
        Test.startTest();
        User u2= [SELECT Id from User where email='manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u2){
            Payroll_Setting__c pays = [SELECT Id,Next_Pay_Date__c from Payroll_Setting__c LIMIT 1];
            pays.Next_Pay_Date__c=System.today().addDays(3);
            update  pays;
            
            
            Test.stopTest();
        }
    }
    
    @isTest
    public static void  getFinaliseList(){
        Test.startTest();
        User u2= [SELECT Id from User where email='manualtesting.5103356@hotmail.com' LIMIT 1];
        System.runAs(u2){
            Staff_Payroll_Setting__c staffList=[select id from Staff_Payroll_Setting__c limit 1];
            Payroll_Setting__c pays = [SELECT Id,Next_Pay_Date__c from Payroll_Setting__c LIMIT 1];
            String changedpayDate ='2023-12-13';
            string paysId=pays.id;
            list<string>staffPayID=  new  list<string>();
            staffPayID.add(staffList.id);
            PayRunHandler.insertSTPFinalise(staffPayID,'Finalise','test data','test refe');
            PayRunHandler.saveSTPResponse(paysId,'Finalise','test data','test refe');
            PayrollPdfData.statusPayrollSetting(pays.Id);
            PayrollPdfData.updateSubmit(pays.Id, 'Submitted', changedpayDate);
            PayrollPdfData.updateSubmit(pays.Id, 'Delete', changedpayDate);
            PayrollPdfData.updateSubmit(pays.Id, '', changedpayDate);
            PayrollPdfData.payrollRun(staffList.Id);
            PayRunHandler.updateGovReportStatus(pays.Id, 'REF1', '');
            PayRunHandler.updateGovReportStatus(pays.Id, 'REF2', 'Submitted');
            Test.stopTest();
        }
    }

@isTest
static void test_activityLogs() {
    Staff_Payroll_Setting__c staffRec = [SELECT Id FROM Staff_Payroll_Setting__c LIMIT 1];
    Payroll_Setting__c pay = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
    
    Test.startTest();
    PayRunHandler.insertSTPFinalise(new List<String>{staffRec.Id}, 'Finalise', 'out', 'ref');
    PayRunHandler.getFinalisedActivityLog(staffRec.Id);
    PayRunHandler.saveSTPResponse(pay.Id, 'File STP', 'out', 'ref');
    PayRunHandler.getSTPActivityLog(pay.Id);
    Test.stopTest();
}

}