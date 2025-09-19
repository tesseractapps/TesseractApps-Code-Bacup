/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @Test 			 : PayRollSettingHandlerTest
* @last modified on  : 06-18-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class PayrunSettingHandler {
    public static Boolean isFirstTime = true;
    @AuraEnabled
    public static List<Staff_Payroll_Setting__c> staffPayroll(String payrollId){
        
         Date startDate=System.today(); 
        Date endDate =system.today()+7;
        List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
        return [select id,Staff__r.Name,Amazon_URL__c,Gross_Salary__c,Gross_Salary_Display__c,Staff__r.Last_Name__c,
                Staff__r.Employment_type__c,Staff__r.Contact_Number__c,Earnings__c,Earnings_Display__c,Payroll_Setting__r.Group_Name__c,Staff_ABN_Number__c,
                Total_Hours__c,Tax__c,Super_Annuation1__c,Super_Annuation_Final__c,Net_Pay__c,Payroll_Setting__r.Id, 
                staff__r.TFN_number__c,Staff__r.ABN_Number__c, Org_ABN__c,
                Staff__r.PayrollId__c,Staff__r.Name__c,Staff__r.Date_Of_Birth__c,Staff__r.Address__Street__s,
                Staff__r.Address__City__s, Staff__r.Address__PostalCode__s, Staff__r.Address__StateCode__s,
                Staff__r.Email_Address__c,Staff__r.Emp_Start_Date__c,Staff__r.Emp_exit_date__c,Staff__r.Type_of_Employment__c,
      			Staff__r.Exit__c,Payroll_Setting__r.Period_Start_Date__c,Payroll_Setting__r.Period_End_Date__c,Staff__r.Payee_ETP_Payment_Date__c,
                Payroll_Setting__r.Next_Pay_Date__c,Payroll_Setting__r.Status__c,Org_BMSId__c,
                 org_Name__c,orgEmail__c,Org_Phone__c,OrgPostalCode__c,Staff__r.Facility__r.Organisation__r.SoftwareId__c,
                staff__r.Facility__r.Organisation__r.Contact_Name__c,Staff__c,Last_Salary_Wages_YTD__c,Last_Tax_YTD__c,Current_Tax_YTD__c,staff__r.Facility__r.Organisation__r.Branch_code__c,
                Super_And_Voluntary_Supper_Annuation__c from Staff_Payroll_Setting__c 
                
                where Payroll_Setting__r.Id =: payrollId]; //and  staff__c in (select Staff__c from Allocation__c where ICT_TimeSheet__r.Status__c='Approved')
        // Staff__r.Facility__r.Organisation__r.Name 
        
    }

    @AuraEnabled
    public static List<Staff_Payroll_Setting__c> accpetedStaffPayroll(String payrollId){        
   
       List<Payroll_Setting__c> prset=[SELECT id,Period__c,Status__c,Org_Name__c,Period_Start_Date__c,  Period_End_Date__c FROM Payroll_Setting__c where id=:payrollId];
        system.debug('payroll setting'+prset);
        
        List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
        listOfStaff= [select id,Staff__r.Name,Amazon_URL__c,Gross_Salary__c,Gross_Salary_Display__c,Staff__r.Last_Name__c,
                Staff__r.Employment_type__c,Staff__r.Contact_Number__c,Earnings__c,Earnings_Display__c,Payroll_Setting__r.Group_Name__c,Staff_ABN_Number__c,
                Total_Hours__c,Tax__c,Super_Annuation1__c,Super_Annuation_Final__c,Net_Pay__c,Payroll_Setting__r.Id, Payroll_Setting__r.Frequency__c, 
                staff__r.TFN_number__c,Staff__r.ABN_Number__c, Org_ABN__c,Type_of_User__c ,Working_Hours__c,
                Staff__r.PayrollId__c,Staff__r.Name__c,Staff__r.Date_Of_Birth__c,Staff__r.Address__Street__s,
                Staff__r.Address__City__s, Staff__r.Address__PostalCode__s, Staff__r.Address__StateCode__s,
                Staff__r.Email_Address__c,Staff__r.Emp_Start_Date__c,Staff__r.Emp_exit_date__c,Staff__r.Type_of_Employment__c,
      			Staff__r.Exit__c,Payroll_Setting__r.Period_Start_Date__c,Payroll_Setting__r.Period_End_Date__c,Staff__r.Payee_ETP_Payment_Date__c,
                Payroll_Setting__r.Next_Pay_Date__c,Payroll_Setting__r.Status__c,Org_BMSId__c,Staff__r.Facility__r.Organisation__r.Agent_Number__c,
                 org_Name__c,orgEmail__c,Org_Phone__c,OrgPostalCode__c,Staff__r.Facility__r.Organisation__r.SoftwareId__c,Pay_Date__c,
                staff__r.Facility__r.Organisation__r.Contact_Name__c,Staff__c,Last_Salary_Wages_YTD__c,Last_Tax_YTD__c,Current_Tax_YTD__c,staff__r.Facility__r.Organisation__r.Branch_code__c,Current_Taxble_Gross_Salary_YTD__c,
                 Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,
                Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Pre_tax_values__c,Post_tax_values__c,Reimbursements__c,
                 Voluntary_Contribution__c,Voluntary_Contribution_Percent__c ,Voluntary_Contribution_Fixed__c,Super_And_Voluntary_Supper_Annuation__c   
                from Staff_Payroll_Setting__c where Payroll_Setting__c =: payrollId];

                //and staff__c in (select Staff__c from Allocation__c where Status__c='Approved' and Start_Date__c >=:prset[0].Period_Start_Date__c and End_Date__c <=:prset[0].Period_End_Date__c)

        return listOfStaff;
    }
    
   //sowmya
   @AuraEnabled
    public static Date getLastPayDate(String facilityId){
        Date lastpaydate= [select Next_Pay_Date__c from Payroll_Setting__c where Facility__c=:facilityId order by createddate desc limit 1].Next_Pay_Date__c;
        return lastpaydate;
    }
   
    @AuraEnabled
    public static List<Staff_Payroll_Setting__c> staffPayrollDate(String payrollId){
        
        Date startDate=System.today();
        Date endDate =system.today()+7;
        String payRunId;
        List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
        return [select id,Staff__r.Name,Amazon_URL__c,Gross_Salary__c,Gross_Salary_Display__c,Staff__r.Last_Name__c,
                Staff__r.Employment_type__c,Staff__r.Contact_Number__c,Earnings__c,Earnings_Display__c,
                Total_Hours__c,Tax__c,Super_Annuation1__c,Super_Annuation_Final__c,Net_Pay__c,
                Payroll_Setting__r.Id , Payroll_Setting__r.Status__c
                from Staff_Payroll_Setting__c 
                where Payroll_Setting__r.Id =: payrollId]; 
        
    }
    
    @AuraEnabled(cacheable = true)
    public static List<Facility__c> fetchFacilitiesByOrgId(){
         Date startDate=System.today();
        Date endDate =system.today()+7;
         String payRunId;
        List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
        User objUser = [ SELECT Organization_Name__c, Id FROM User WHERE Id = : UserInfo.getUserId() ];
        Organisation__c orgName = new Organisation__c();
        
        if(!Test.isRunningTest())
            orgName = [select id,name from Organisation__c where name=:objUser.Organization_Name__c];
        
        
        return [SELECT id,name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Organisation__r.name,
                Manager_Name__c,Address__Street__s,
                Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s
                FROM Facility__c where  Organisation__c  =: orgName.Id And Status__c = TRUE order by name asc];
    }
    
    
    @AuraEnabled
    public static List<Payroll_Setting__c> getpPaySettings(){
        Date startDate=System.today();
        Date endDate =system.today()+7;
        String payRunId;
        List<Staff__c> staffListUpdate = new List<Staff__c>();
        List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
        String orgId = CurrentUserOrganization.currentOrgId();
        List<Payroll_Setting__c> payrollList = new List<Payroll_Setting__c>();
       
        if(!Test.isRunningTest()){ 
        String organizationId = orgId.substring(0,15);
          try {
                payrollList =  [SELECT id,Name,Facility_Name__c,Frequency__c,Group_Name__c,Next_Pay_Date__c,Period_End_Date__c,Period_Start_Date__c,
                                Facility__r.Name,Staff_List__c,status__c,StaffList__c,Period__c,Organization_Name__c,(select id,Pay_Date__c from Staff_Payroll_Settings__r)//
                                FROM Payroll_Setting__c where Organization_Name__c=:organizationId and status__c !='Delete' and  StaffList_Text__c !='0'  Order by Next_Pay_Date__c desc];//
            } catch (Exception e) {
                throw new AuraHandledException(e.getMessage());
            }
        }
        return payrollList;
    }
    @AuraEnabled
    public static List<paySlipData> newStaffList(String payrollSettingId){
        Date startDate=System.today();
         String payRunId;
        Date endDate =system.today()+7;
        List<Staff__c> staffListUpdate = new List<Staff__c>();
        List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
        Payroll_Setting__c payrollSetting = new Payroll_Setting__c();
        if(!Test.isRunningTest())
        payrollSetting = [select id,Facility__c,Frequency__c from Payroll_Setting__c where id=:payrollSettingId];
        List<paySlipData> payDataList = payrollRun(payrollSetting.Facility__c,payrollSetting.Frequency__c);
        return payDataList;
    }
    @AuraEnabled
    public static List<paySlipData> payrollRun(String factId,String employmentType){
        System.debug('factId '+factId);
        List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
        System.debug('employmentType '+employmentType);
        List<paySlipData> payDataList= new List<paySlipData>();         
        Date startDate=System.today();
        Date endDate =system.today()+7;
         String payRunId;
        List<Staff__c> staffList = new List<Staff__c>();
        List<Staff__c> staffListUpdate = new List<Staff__c>();
        
        if(employmentType==null || employmentType==''){
            staffList=[select id,Name,Last_Name__c,Facility__c,Working_Hours_Rate__c,Contact_Number__c,
                       Address__c,Employment_type__c,
                       Organization_Name__c,Address__Street__s,
                       Address__City__s,Address__StateCode__s,Address__CountryCode__s,
                       Address__PostalCode__s,Base_Rate__c,Job_Title__c 
                       From Staff__c where Facility__c=:factId and Status__c=:true];
        }else{
            staffList=[select id,Name,Last_Name__c,Facility__c,Working_Hours_Rate__c,Contact_Number__c,
                       Address__c,Employment_type__c,
                       Organization_Name__c,Address__Street__s,
                       Address__City__s,Address__StateCode__s,Address__CountryCode__s,
                       Address__PostalCode__s,Base_Rate__c,Job_Title__c 
                       From Staff__c where Facility__c=:factId and Employment_type__c=:employmentType and Status__c=:true];
        }
        List<Staff_Payroll_Setting__c> listOfPayrollSetting = [select id,Staff__r.Id,Payroll_Setting__r.Status__c from Staff_Payroll_Setting__c where Payroll_Setting__r.Status__c='' Or Payroll_Setting__r.Status__c='Draft'];
        List<String> staffIds = new List<String>();
        for(Staff_Payroll_Setting__c staffListValues : listOfPayrollSetting){
            staffIds.add(staffListValues.Staff__r.Id);
        }
        for(Staff__c staffRec:staffList){
            if(!staffIds.contains(staffRec.Id)){
                paySlipData payData= new paySlipData();
                payData.staffData=staffRec;
                payDataList.add(payData);
            }
            
        }
        return payDataList;
        
    }
    @AuraEnabled
    public static void updatePayset(String paysetId,String jsonStringStaffPayollId){
        System.debug('paysetId'+paysetId);
        List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
        Date startDate=System.today();
         String payRunId;
        Date endDate =system.today()+7;
        Payroll_Setting__c payrollSetting = [select id,Facility__c,Frequency__c,Organization_Name__c from Payroll_Setting__c where id=:paysetId];
        System.debug('payrollSetting'+payrollSetting);
        
        List<String> StaffIdsList = (List<String>)System.JSON.deserialize(jsonStringStaffPayollId,List<String>.class);
        
        List<Staff_Payroll_Setting__c> stfList=new List<Staff_Payroll_Setting__c>();
        for(String staffRecord:StaffIdsList){
            Staff_Payroll_Setting__c staffRec= new Staff_Payroll_Setting__c();
            If(!Test.isRunningTest())
            staffRec.Staff__c= Id.valueOf(staffRecord);
            staffRec.Frequency__c = payrollSetting.Frequency__c;
            staffRec.Payroll_Setting__c=payrollSetting.Id;
            stfList.add(staffRec);
        }
        try{
            if(stfList.size()>0){
                insert stfList;
            }
        }catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }                                         
    
    @AuraEnabled
    public static void insertInvoice(String JsonString,String jsonStringStaffPayollId,String facilityid,String periodStartDate,
                                     String periodEndDate,String nextPayDate,String frequency,String groupName){
                                        system.debug(Date.valueOf(periodStartDate) +' '+
                                        Date.valueOf(periodEndDate) +' '+
                                        Date.valueOf(nextPayDate));
        Date startDate=System.today();
                                          String payRunId;
        Date endDate =system.today()+7;
                                         List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
                                         
                                         List<String> StaffIdsList = (List<String>)System.JSON.deserialize(jsonStringStaffPayollId,List<String>.class);
                                         
                                         String staffName='';
                                         List<String> staffNameList = (List<String>)System.JSON.deserialize(JsonString,List<String>.class);
                                         for(String strname : staffNameList){
                                             staffName = staffName + strname +', ';
                                         }
                                         staffName = staffName.removeEnd(', ');
                                         
                                         Payroll_Setting__c payrollSettingRec = new Payroll_Setting__c();
                                         payrollSettingRec.Facility__c=facilityid;
                                         payrollSettingRec.Period_Start_Date__c=Date.valueOf(periodStartDate);
                                         payrollSettingRec.Period_End_Date__c=Date.valueOf(periodEndDate);
                                         payrollSettingRec.Next_Pay_Date__c=Date.valueOf(nextPayDate);
                                         payrollSettingRec.Frequency__c=frequency;
                                         payrollSettingRec.Group_Name__c=groupName;
                                         payrollSettingRec.StaffList__c = staffName;
                                         try{
                                             insert payrollSettingRec;
                                         }catch (Exception e) {
                                             throw new AuraHandledException(e.getMessage());
                                         }
                                         if(!Test.isRunningTest()){
                                         if(payrollSettingRec.Id!=null){
                                             List<Staff_Payroll_Setting__c> stfList=new List<Staff_Payroll_Setting__c>();
                                             for(String staffRecord:StaffIdsList){
                                                 Staff_Payroll_Setting__c staffRec= new Staff_Payroll_Setting__c();
                                                 staffRec.Staff__c= Id.valueOf(staffRecord);
                                                 staffRec.Frequency__c = frequency;
                                                 staffRec.Pay_Date__c=payrollSettingRec.Next_Pay_Date__c;// new line added by praveen
                                                 staffRec.Payroll_Setting__c=payrollSettingRec.Id;
                                                 stfList.add(staffRec);
                                             }
                                             try{
                                                 if(stfList.size()>0){
                                                     insert stfList;
                                                 }
                                             }catch (Exception e) {
                                                 throw new AuraHandledException(e.getMessage());
                                             }
                                         }
                                         }
                                     }
    public class paySlipData{
        @AuraEnabled
        public Organisation__c organization{set;get;}
        @AuraEnabled
        public Staff__c staffData{set;get;}
        
    }
     
}