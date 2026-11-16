@isTest
public class StaffParollTriggerTestLatest {
    @testsetup Static void testData(){
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='12345678912';
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.60662@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne661', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.60662@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.Phone__c = '12323432';
            fac.ABN__c='12345678912';
            fac.Phone__c = '12323432';
            insert fac;
        
           Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.60662@hotmail.com';
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
            staff.Tax_free_threshold__c='With Tax free threshold';
            staff.TFN_number__c='142536896';
            
            //staff.ABN_Number__c='99084582980';
            staff.Working_Hours_Rate__c=50;
             insert staff;
            
            
            Payroll_Setting__c payrollRecord = new Payroll_Setting__c();
            payrollRecord.Group_Name__c='group one';
            payrollRecord.Frequency__c='Weekly';
            payrollRecord.Status__c='';
            payrollRecord.Facility__c =fac.Id;
            payrollRecord.Period_Start_Date__c = system.today().addDays(-7);
            payrollRecord.Period_End_Date__c = System.today();
            payrollRecord.Next_Pay_Date__c= System.today().addDays(2);
            insert payrollRecord;
            
            list<Staff__c> stffaList2 = [select id from Staff__c ];
            for(Integer i=0;i<=16;i++){
            Staff_Payroll_Setting__c staffpayRecord = new Staff_Payroll_Setting__c();
            staffpayRecord.Frequency__c='Weekly';
            staffpayRecord.Payroll_Setting__c = payrollRecord.Id;
            staffpayRecord.Staff__c =staff.Id ;
            staffpayRecord.Gross_Salary__c = 100;
            staffpayRecord.Working_Hours__c = 40;
            staffpayRecord.Management_Fee1__c =2;
            staffpayRecord.Super_Annuation1__c = 150;
            insert staffpayRecord;
            }
			
			Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff2';
            staff1.Name='praveen2';
            staff1.Name__c='abcd';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.60694@hotmail.com';
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
            staff1.Secondary_Contact_Number__c='99084582958';
            staff1.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Tax_free_threshold__c='Without Tax free threshold';
            staff1.TFN_number__c='142536896';
          //  staff1.ABN_Number__c='99084582980';
            staff1.Working_Hours_Rate__c=60;
            staff1.Voluntary_Contribution__c='Fixed';
            staff1.Voluntary_Contribution_Fixed__c=100;
            insert staff1;
			
			  Payroll_Setting__c payrollRecord1 = new Payroll_Setting__c();
            payrollRecord.Group_Name__c='group two';
            payrollRecord.Frequency__c='Weekly';
            payrollRecord.Status__c='';
            payrollRecord.Facility__c =fac.Id;
            payrollRecord.Period_Start_Date__c = system.today().addDays(-7);
            payrollRecord.Period_End_Date__c = System.today();
            payrollRecord.Next_Pay_Date__c= System.today().addDays(2);
            insert payrollRecord1;
			  
            Staff_Payroll_Setting__c staffpayRecord1 = new Staff_Payroll_Setting__c();
            staffpayRecord1.Frequency__c='Weekly';
            staffpayRecord1.Payroll_Setting__c = payrollRecord.Id;
            staffpayRecord1.Staff__c =staff1.Id ;           
            staffpayRecord1.Working_Hours__c = 40;
            staffpayRecord1.Management_Fee1__c =2;
            staffpayRecord1.Super_Annuation1__c = 150;
            staffpayRecord1.Voluntary_Contribution__c='Fixed';
            staffpayRecord1.Voluntary_Contribution_Fixed__c=100;
            insert staffpayRecord1;        
            
            system.debug(staffpayRecord1.Tax_free_threshold__c);
          
        }
    
    }
    
    @isTest
    public static void StaffPayrollTriggerTest(){ 	 
	    Staff__c s = [select id from Staff__c where Last_Name__c='Test staff'];
        Staff_Payroll_Setting__c stffPayRec=[select id,Working_Hours__c from  Staff_Payroll_Setting__c where staff__c=:s.Id limit 1];
        stffPayRec.Working_Hours__c=40;
        update stffPayRec;
        
        Payroll_Setting__c payrollSetting=[select id,Frequency__c from Payroll_Setting__c where Group_Name__c='group one' ];
        payrollSetting.Frequency__c='Fortnightly';
        update payrollSetting;
        
        Staff_Payroll_Setting__c stffPayRec1=[select id,Working_Hours__c,Frequency__c from  Staff_Payroll_Setting__c where staff__c=:s.Id limit 1];
        stffPayRec1.Working_Hours__c=30;
        stffPayRec1.Frequency__c='Fortnightly';
        update stffPayRec1;
        
        Staff__c staff=[Select id,Tax_free_threshold__c,Pre_Tax_Calculator__c from Staff__c where Email_Address__c='manualtesting.60662@hotmail.com' limit 1  ];
        staff.Pre_Tax_Calculator__c=400;
        staff.Working_Hours_Rate__c=40;
        update staff; 
        
        Staff_Payroll_Setting__c stffPayRec2=[select id,Working_Hours__c,Frequency__c  from  Staff_Payroll_Setting__c where staff__c=:s.Id limit 1];
        stffPayRec2.Working_Hours__c=180;
        stffPayRec2.Frequency__c='Monthly';
        update stffPayRec2;
        
       Staff__c staff12=[Select id,Tax_free_threshold__c,Pre_Tax_Calculator__c from Staff__c where Email_Address__c='manualtesting.60662@hotmail.com' limit 1  ];
        staff12.Pre_Tax_Calculator__c=400;
        staff12.Working_Hours_Rate__c=50;
        update staff12; 
        
        Staff_Payroll_Setting__c stffPayRec23=[select id,Working_Hours__c,Frequency__c  from  Staff_Payroll_Setting__c  where staff__c=:s.Id limit 1];
        stffPayRec23.Working_Hours__c=150;
        stffPayRec23.Frequency__c='Monthly';
        update stffPayRec23;
        
        delete stffPayRec2;
        
     
        
    }
	
	 @isTest
    public static void StaffPayrollTriggerwithoutTaxTest(){ 
           Staff__c s = [select id from Staff__c where Last_Name__c='Test staff2'];
        Staff_Payroll_Setting__c stffPayRec=[select id,Working_Hours__c from  Staff_Payroll_Setting__c where staff__c=:s.Id limit 1];
        stffPayRec.Working_Hours__c=40;
        update stffPayRec;
        
        Payroll_Setting__c payrollSetting=[select id,Frequency__c from Payroll_Setting__c where Group_Name__c='group one' ];
        payrollSetting.Frequency__c='Fortnightly';
        update payrollSetting;
        
        Staff_Payroll_Setting__c stffPayRec1=[select id,Working_Hours__c,Frequency__c from  Staff_Payroll_Setting__c where staff__c=:s.Id limit 1];
        stffPayRec1.Working_Hours__c=30;
        stffPayRec1.Frequency__c='Fortnightly';
        update stffPayRec1;
        
        Staff__c staff=[Select id,Tax_free_threshold__c,Pre_Tax_Calculator__c from Staff__c where Email_Address__c='manualtesting.60662@hotmail.com' limit 1  ];
        staff.Pre_Tax_Calculator__c=400;
        staff.Working_Hours_Rate__c=40;
        update staff; 
        
        Staff_Payroll_Setting__c stffPayRec2=[select id,Working_Hours__c,Frequency__c  from  Staff_Payroll_Setting__c where staff__c=:s.Id limit 1];
        stffPayRec2.Working_Hours__c=180;
        stffPayRec2.Frequency__c='Monthly';
        update stffPayRec2;
        
       Staff__c staff12=[Select id,Tax_free_threshold__c,Pre_Tax_Calculator__c from Staff__c where Email_Address__c='manualtesting.60662@hotmail.com' limit 1  ];
        staff12.Pre_Tax_Calculator__c=400;
        staff12.Working_Hours_Rate__c=50;
        update staff12; 
        
        Staff_Payroll_Setting__c stffPayRec23=[select id,Working_Hours__c,Frequency__c  from  Staff_Payroll_Setting__c  where staff__c=:s.Id limit 1];
        stffPayRec23.Working_Hours__c=150;
        stffPayRec23.Frequency__c='Monthly';
        update stffPayRec23;
        
        delete stffPayRec2;
        
        list<Staff_Payroll_Setting__c> stffPayRec4=[select id,Working_Hours__c,Frequency__c  from  Staff_Payroll_Setting__c];
        delete stffPayRec4;
        
	}
    
    	 @isTest
    public static void StaffPayrollTriggerABNTest(){ 
         User u1= [SELECT Id from User where email='manualtesting.60662@hotmail.com' LIMIT 1];
        System.runAs(u1){
           Staff__c s = [select id from Staff__c where Last_Name__c='Test staff2'];
        s.TFN_number__c='';
        s.ABN_Number__c='99084582980';
        update s;
        Staff_Payroll_Setting__c stffPayRec=[select id,Working_Hours__c from  Staff_Payroll_Setting__c where staff__c=:s.Id limit 1];
        stffPayRec.Working_Hours__c=40;
        update stffPayRec;
        SingleEmailAttachment.sendPayrollEmail(stffPayRec.Id);
        }
        
        /*
        Payroll_Setting__c payrollSetting=[select id,Frequency__c from Payroll_Setting__c where Group_Name__c='group one' ];
        payrollSetting.Frequency__c='Fortnightly';
        update payrollSetting;
        
        Staff_Payroll_Setting__c stffPayRec1=[select id,Working_Hours__c,Frequency__c from  Staff_Payroll_Setting__c where staff__c=:s.Id limit 1];
        stffPayRec1.Working_Hours__c=30;
        stffPayRec1.Frequency__c='Fortnightly';
        update stffPayRec1;*/
    }

}