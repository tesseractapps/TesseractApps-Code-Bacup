/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @Test Class         : PayRunHandlerTest
* @last modified on  : 07-23-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class PayRunHandler {
    @AuraEnabled
    public static list<Payroll_Setting__c> fetchPayrollStaff(){ 
        
        User objUser = [ SELECT Phone,Organization_Name__c, Id FROM User WHERE Id = : UserInfo.getUserId() ];
        Organisation__c orgName = new Organisation__c();
        
        if(!Test.isRunningTest())
            orgName = [select id,name from Organisation__c where name=:objUser.Organization_Name__c];
        system.debug(orgName);
        list<Payroll_Setting__c> lstPayrollSetting = new list<Payroll_Setting__c>();
        return [SELECT id,Period__c,Status__c,Org_Name__c,Period_Start_Date__c,  Period_End_Date__c,Next_Pay_Date__c FROM Payroll_Setting__c where Org_Name__c=:orgName.name and Status__c='' and StaffList_Text__c !='0'];//and StaffList__c !='0'
    }
    
    @AuraEnabled
    public static List<Staff_Payroll_Setting__c> staffAllocationCalculation(String payrollId){
        system.debug('payrollId'+payrollId);
        Map<String,String> staffStaffPayrollSettingMap =new Map<String,String>(); 
        Date startDate; 
        Date endDate;
        List<Staff_Payroll_Setting__c> staffPayrollSetting = [select id,Payroll_Setting__r.Id,Payroll_Setting__r.Period_Start_Date__c,
                                                              Payroll_Setting__r.Period_End_Date__c,Payroll_Setting__r.Next_Pay_Date__c,
                                                              Payroll_Setting__r.Frequency__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Employment_type__c,
                                                              Staff__r.Contact_Number__c,Staff__r.Id,Earnings__c,Total_Hours__c,Tax__c,Super_Annuation_Final__c,Net_Pay__c
                                                              from Staff_Payroll_Setting__c where Payroll_Setting__r.Id=:payrollId]; 
            for(Staff_Payroll_Setting__c staffPayrollSettingRecord : staffPayrollSetting){
            staffStaffPayrollSettingMap.put(staffPayrollSettingRecord.Staff__r.Id,staffPayrollSettingRecord.Id);
            startDate=staffPayrollSettingRecord.Payroll_Setting__r.Period_Start_Date__c;
            endDate = staffPayrollSettingRecord.Payroll_Setting__r.Period_End_Date__c;
        }
        System.debug('staffStaffPayrollSettingMap>>'+staffStaffPayrollSettingMap); 
        //modified as per new payroll requirements--Sow
        List<Staff__c> staffList=[select id,Name,Last_Name__c,Facility__c,Working_Hours_Rate__c,Pre_Tax_Calculator__c,Post_Tax__c,Contact_Number__c,
                                  Employment_type__c,Management_Fee__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,Post_Tax_Decription__c,
                                  Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Voluntary_Contribution__c,
                                  Voluntary_Contribution_Fixed__c,Voluntary_Contribution_Percent__c,Fixed_Rate_or_Not__c,Superannuation_Inc_or_Exc__c,
                                  (select id,Start_Date__c,End_Date__c, Penalty_Hours__c,Staff_Final_Hourly_Rate__c,Afternoon_shift_Hourly_Rate__c,Afternoon_Shift_hours__c,Extended_Hours__c,Extended_Hourly_Rate__c,Sleepover_Night_shift_hours__c,Sleepover_Night_Shift_hourly_rate__c,Long_Morning_Hourly_Rate__c,Long_Morning_Shift_Duartion__c,Long_Afternoon_Hourly_Rate__c,Long_Afternoon_Shift_Duartion__c,
                                   Night_shift_Hourly_Rate__c,Night_Shift_Hours__c,Saturday_Hourly_Rate__c,Sunday_Hourly_Rate__c,General_Hourly_pay_rate__c,General_Working_Hours__c,Sleepover_Shift_Hours__c,Long_Night_Hourly_Rate__c,Long_Night_Shift_Duartion__c,Long_Sleepover_Allowance__c,Long_Sleepover_Duartion__c,Is_Custom_Shift__c,Long_Afternoon_Duration_Two__c,Long_Afternoon_Rate_Two__c,Long_Morning_Rate_Two__c,Long_Moring_Duration_Two__c,
                                   Working_Hours__c,Public_Holiday_Hours__c,Saturday_Hours__c,Sunday_Hours__c,Reimbursement__c,Sleep_Over_Allocation__c From Allocations__r 
                                   where Start_Date__c>=:startDate and (End_Date__c<=:endDate OR Start_Date__c<=:endDate) ) 
                                  From Staff__c where Id IN : staffStaffPayrollSettingMap.keySet()];
        
       List<Reimbursement__c> ReimbursementList=[select id,Approval_Status__c,Amount__c,Total_Amount__c,lastmodifieddate,ShiftwithStaff__r.Staff__c from Reimbursement__c where Approval_Status__c='Approved' and lastmodifieddate >=:startDate and lastmodifieddate<=:endDate  and ShiftwithStaff__r.Staff__c In: staffStaffPayrollSettingMap.keySet()];
        map<Id,decimal> staffReiMap= new  map<Id,decimal>();
        if(ReimbursementList.size()>0){
           for (Reimbursement__c rei : ReimbursementList) {
               Id staffId = rei.ShiftwithStaff__r.Staff__c; 
               // Only proceed if staffId is not null
               if (staffId != null) {
                   // Initialize with zero if staff record is not in the map
                   if (!staffReiMap.containsKey(staffId)) {
                       staffReiMap.put(staffId, 0);
                   }
                   // Add reimbursement amount to the total, handle null Amount__c
                   Decimal reiamount = staffReiMap.get(staffId);
                   reiamount += (rei.Total_Amount__c != null) ? rei.Total_Amount__c : 0;
                   staffReiMap.put(staffId, reiamount);
               }
           }  
        }
        for (Id staffId : staffStaffPayrollSettingMap.keySet()) {
            if (!staffReiMap.containsKey(staffId)) {
                // Set reimbursement amount to zero if no reimbursements found
                staffReiMap.put(staffId, 0);
            }
        }
         
        System.debug(staffList.size());
        List<Staff_Payroll_Setting__c> staffPayRollList =New List<Staff_Payroll_Setting__c>();
        for(Staff__c staffRecord : staffList){
            String staffPayrollSettingId = staffStaffPayrollSettingMap.get(staffRecord.Id);
            Decimal staffworkHours=0;
            Decimal staffPenaHours=0;
            Decimal staffpublicHolHours=0;
            Decimal staffsaturdayHours=0;
            Decimal staffsundayHours=0;
            // new line added by praveen for reimbursements
            Decimal reimburseAmount=0;
            // new line added by praveen for grossSalary
            Decimal gorssSalary=0;
			Decimal generalShiftHour=0;
            Decimal nightShiftHours=0;
            Decimal afternoonShiftHours=0;
            Decimal SleepOverhours=0;
            Decimal SleepOverNightShiftHours=0;
            Decimal ExtendedHours=0;
            Decimal customShifthours=0;
           	reimburseAmount=staffReiMap.get(staffRecord.Id);
                
                for(Allocation__c allocationRec : staffRecord.Allocations__r){
                       system.debug('Sunday_Hours__c ' +allocationRec.Sunday_Hours__c);
                    if(allocationRec.Working_Hours__c!=null)
                        staffworkHours=staffworkHours+allocationRec.Working_Hours__c;
                    if(allocationRec.Working_Hours__c!=null){  // line added by praveen
                        if(allocationRec.Sleep_Over_Allocation__c ==false &&  allocationRec.Is_Custom_Shift__c ==false){
                           
                           gorssSalary=gorssSalary+(allocationRec.Working_Hours__c *allocationRec.Staff_Final_Hourly_Rate__c); 
                             system.debug(' first if gorssSalary '+gorssSalary);
                        }else if(allocationRec.Sleep_Over_Allocation__c == true) {
                            gorssSalary = gorssSalary + (allocationRec.Staff_Final_Hourly_Rate__c != null ? allocationRec.Staff_Final_Hourly_Rate__c : 0);
                            gorssSalary = gorssSalary + (allocationRec.Sleepover_Night_shift_hours__c > 0 ? (allocationRec.Sleepover_Night_shift_hours__c * (allocationRec.Sleepover_Night_Shift_hourly_rate__c != null ? allocationRec.Sleepover_Night_Shift_hourly_rate__c : 0)) : 0); 
                            system.debug(' second if else gorssSalary '+gorssSalary);
                            
                        }else if(allocationRec.Is_Custom_Shift__c == true) {
                            system.debug(' third if else morning '+allocationRec.Long_Morning_Shift_Duartion__c);
                            system.debug(' third if else afternoon '+allocationRec.Long_Afternoon_Shift_Duartion__c);
                            system.debug(' third if else long night '+allocationRec.Long_Night_Shift_Duartion__c);
                            system.debug(' third if else Long_Sleepove '+allocationRec.Long_Sleepover_Duartion__c);
                            
                            // Add null checks for all fields in the calculation
                            Decimal morningHours = allocationRec.Long_Morning_Shift_Duartion__c != null ? allocationRec.Long_Morning_Shift_Duartion__c : 0;
                            Decimal morningRate = allocationRec.Long_Morning_Hourly_Rate__c != null ? allocationRec.Long_Morning_Hourly_Rate__c : 0;
                            
                            Decimal afternoonHours = allocationRec.Long_Afternoon_Shift_Duartion__c != null ? allocationRec.Long_Afternoon_Shift_Duartion__c : 0;
                            Decimal afternoonRate = allocationRec.Long_Afternoon_Hourly_Rate__c != null ? allocationRec.Long_Afternoon_Hourly_Rate__c : 0;
                            
                            Decimal nightHours = allocationRec.Long_Night_Shift_Duartion__c != null ? allocationRec.Long_Night_Shift_Duartion__c : 0;
                            Decimal nightRate = allocationRec.Long_Night_Hourly_Rate__c != null ? allocationRec.Long_Night_Hourly_Rate__c : 0;
                            
                            Decimal sleepoverAllowance = allocationRec.Long_Sleepover_Allowance__c != null ? allocationRec.Long_Sleepover_Allowance__c : 0;
                            
                            Decimal afternoonHoursTwo = allocationRec.Long_Afternoon_Duration_Two__c != null ? allocationRec.Long_Afternoon_Duration_Two__c : 0;
                            Decimal afternoonRateTwo = allocationRec.Long_Afternoon_Rate_Two__c != null ? allocationRec.Long_Afternoon_Rate_Two__c : 0;
                            
                            Decimal morningHoursTwo = allocationRec.Long_Moring_Duration_Two__c != null ? allocationRec.Long_Moring_Duration_Two__c : 0;
                            Decimal morningRateTwo = allocationRec.Long_Morning_Rate_Two__c != null ? allocationRec.Long_Morning_Rate_Two__c : 0;
                            
                            gorssSalary = gorssSalary + (morningRate * morningHours) + (afternoonRate * afternoonHours) +(nightRate * nightHours) + sleepoverAllowance +  (afternoonRateTwo * afternoonHoursTwo) +  (morningRateTwo * morningHoursTwo);
                            
                            system.debug(' third if else gorssSalary '+gorssSalary);
                        }
                      
                        
                    } 
                    if(allocationRec.Extended_Hours__c !=null){
                        gorssSalary=gorssSalary +(allocationRec.Extended_Hours__c>0?allocationRec.Extended_Hours__c *allocationRec.Extended_Hourly_Rate__c:0); 
                        staffworkHours=staffworkHours+( allocationRec.Extended_Hours__c >0 ?allocationRec.Extended_Hours__c:allocationRec.Extended_Hours__c); 
                    }
 						 
                      if(allocationRec.General_Working_Hours__c!=null)     // line added by praveen
                        generalShiftHour=generalShiftHour+allocationRec.General_Working_Hours__c;
                     if(allocationRec.Night_Shift_Hours__c!=null)     // line added by praveen
                        nightShiftHours=nightShiftHours+allocationRec.Night_Shift_Hours__c;
                    if(allocationRec.Afternoon_Shift_hours__c!=null)     // line added by praveen
                        afternoonShiftHours=afternoonShiftHours+allocationRec.Afternoon_Shift_hours__c;
                    if(allocationRec.Public_Holiday_Hours__c!=null)
                        staffpublicHolHours=staffpublicHolHours+allocationRec.Public_Holiday_Hours__c;
                    if(allocationRec.Penalty_Hours__c!=null)
                        staffPenaHours=staffPenaHours+allocationRec.Penalty_Hours__c;
                    if(allocationRec.Saturday_Hours__c!=null)
                        staffsaturdayHours=staffsaturdayHours+allocationRec.Saturday_Hours__c;
                    if(allocationRec.Sunday_Hours__c!=null)
                     staffsundayHours=staffsundayHours+allocationRec.Sunday_Hours__c;
              
                    if(allocationRec.Sleepover_Shift_Hours__c!=null)
                        SleepOverhours=SleepOverhours+allocationRec.Sleepover_Shift_Hours__c;
                     if(allocationRec.Sleepover_Night_shift_hours__c!=null)
                        SleepOverNightShiftHours=SleepOverNightShiftHours+allocationRec.Sleepover_Night_shift_hours__c;
                    if(allocationRec.Extended_Hours__c!=null)
                        ExtendedHours=ExtendedHours+allocationRec.Extended_Hours__c;
                    if(allocationRec.Is_Custom_Shift__c==true)
                     customShifthours =  customShifthours +(allocationRec.Long_Morning_Shift_Duartion__c >0 ? allocationRec.Long_Morning_Shift_Duartion__c :0)  +(allocationRec.Long_Afternoon_Shift_Duartion__c >0? allocationRec.Long_Afternoon_Shift_Duartion__c :0 ) +(allocationRec.Long_Night_Shift_Duartion__c >0 ?allocationRec.Long_Night_Shift_Duartion__c :0)   +( allocationRec.Long_Sleepover_Duartion__c >0 ? allocationRec.Long_Sleepover_Duartion__c :0) ;
                    //new line added by praveen for reimbursements
                   /* if(allocationRec.Reimbursement__c!=null)
                        reimburseAmount=reimburseAmount+allocationRec.Reimbursement__c;*/
                    
                }
           
            Staff_Payroll_Setting__c staffPayRollSettingRec = new Staff_Payroll_Setting__c(Id=staffPayrollSettingId);
            staffPayRollSettingRec.Working_Hours__c=staffworkHours;
            staffPayRollSettingRec.Penalty_Hours__c=staffPenaHours;
            staffPayRollSettingRec.Public_Holiday__c = staffpublicHolHours;
            staffPayRollSettingRec.Management_Fee1__c = staffRecord.Management_Fee__c;
            staffPayRollSettingRec.Saturday_hours__c=staffsaturdayHours;
            staffPayRollSettingRec.Sunday_hours__c=staffsundayHours;
             system.debug('staffsundayHours '+staffsundayHours);
            // new lines added by praveen for pre tax and reimbursements
             staffPayRollSettingRec.Reimbursements__c=reimburseAmount;
           	staffPayRollSettingRec.Gross_Salary__c=gorssSalary; // line added by praveen
            staffPayRollSettingRec.Pre_tax_values__c=staffRecord.Pre_Tax_Calculator__c;
            staffPayRollSettingRec.General_Shift_Hour__c=generalShiftHour;
             staffPayRollSettingRec.Night_Shift_Hours__c=nightShiftHours;
            staffPayRollSettingRec.Afternoon_shift_Hours__c=afternoonShiftHours;
            staffPayRollSettingRec.Sleepover_Hours__c=SleepOverhours;
            staffPayRollSettingRec.Extended_Duration__c=ExtendedHours;
            staffPayRollSettingRec.Sleepover_Night_Shift_hours__c=SleepOverNightShiftHours;
            staffPayRollSettingRec.Custom_Shift_Hours__c=customShifthours;
            
            
           // staffPayRollSettingRec.Schads_Awards__c=staffRecord.Fixed_Rate_or_Not__c;
            staffPayRollSettingRec.Superannuation_Inc_or_exc__c=staffRecord.Superannuation_Inc_or_Exc__c;
            
            
            if(staffRecord.Pre_Tax_One_Description__c != null){
                staffPayRollSettingRec.Pre_Tax_One_Description__c=staffRecord.Pre_Tax_One_Description__c;
                staffPayRollSettingRec.Pre_Tax_One_Value__c=staffRecord.Pre_Tax_One_Value__c;
            }
             if(staffRecord.Pre_Tax_Two_Description__c != null){
            staffPayRollSettingRec.Pre_Tax_Two_Description__c=staffRecord.Pre_Tax_Two_Description__c;
            staffPayRollSettingRec.Pre_Tax_Two_Value__c=staffRecord.Pre_Tax_Two_Value__c;
             }
             if(staffRecord.Pre_Tax_Three_Description__c != null){
             staffPayRollSettingRec.Pre_Tax_Three_Description__c=staffRecord.Pre_Tax_Three_Description__c;
            staffPayRollSettingRec.Pre_Tax_Three_Value__c=staffRecord.Pre_Tax_Three_Value__c;
             }
             if(staffRecord.Pre_Tax_Four_Description__c != null){
            staffPayRollSettingRec.Pre_Tax_Four_Description__c=staffRecord.Pre_Tax_Four_Description__c;
            staffPayRollSettingRec.Pre_Tax_Four_Value__c=staffRecord.Pre_Tax_Four_Value__c;
             }
             if(staffRecord.Pre_Tax_Five_Description__c != null){
            staffPayRollSettingRec.Pre_Tax_Five_Description__c=staffRecord.Pre_Tax_Five_Description__c;
            staffPayRollSettingRec.Pre_Tax_Five_Value__c=staffRecord.Pre_Tax_Five_Value__c;
             }
            if(staffRecord.Post_Tax_Decription__c != null){
            staffPayRollSettingRec.Post_Tax_Decription__c=staffRecord.Post_Tax_Decription__c;
            staffPayRollSettingRec.Post_tax_values__c=staffRecord.Post_Tax__c;
            }
            if(staffRecord.Voluntary_Contribution__c != null){
             staffPayRollSettingRec.Voluntary_Contribution__c=staffRecord.Voluntary_Contribution__c; 
             staffPayRollSettingRec.Voluntary_Contribution_Percent__c=staffRecord.Voluntary_Contribution_Percent__c;
             staffPayRollSettingRec.Voluntary_Contribution_Fixed__c=staffRecord.Voluntary_Contribution_Fixed__c; 
            }
            
            staffPayRollList.add(staffPayRollSettingRec);
        }
        if(staffPayRollList.size()>0){
            update staffPayRollList;
            Payroll_Setting__c paySetting = new Payroll_Setting__c(Id=payrollId);
            paySetting.Status__c='Draft';
            update paySetting;
        }

        return [select id,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Employment_type__c,Staff__r.Contact_Number__c,Pre_tax_values__c,Post_tax_values__c,Reimbursements__c,
                Earnings__c,Total_Hours__c,Tax__c,Net_Pay__c,Super_Annuation_Final__c,Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,
                Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,
                Voluntary_Contribution__c,Voluntary_Contribution_Percent__c,Voluntary_Contribution_Fixed__c,Payroll_Setting__r.Id 
                from Staff_Payroll_Setting__c 
                where Payroll_Setting__r.Id =: payrollId];

        
    }
    
    //update record with govreports refid and status
      @AuraEnabled
    public static void updateGovReportStatus(String payrollId,string refId,string status){
        Payroll_Setting__c updPayRoll = New Payroll_Setting__c();
        
        if(String.isBlank(status)){
            updPayRoll.GovReportsRefId__c=refId;
            updPayRoll.Id=payrollId;
          
        }else{
             updPayRoll.GovReports_Status__c =status;
             updPayRoll.Id=payrollId;
        }
        system.debug(updPayRoll);
         update updPayRoll;
    } 
    
      @AuraEnabled
   public static List<Payroll_Setting__c> fetchPayrollStaff1(String payrollGroupName, String Status) {
    User objUser = [SELECT Phone, Organization_Name__c, Id FROM User WHERE Id = :UserInfo.getUserId()];
    String orgName = [SELECT Id, Name FROM Organisation__c WHERE Name = :objUser.Organization_Name__c].Name;
    List<Payroll_Setting__c> lstPayrollSetting = new List<Payroll_Setting__c>();
    String query = 'SELECT Id, Period__c, Status__c, Org_Name__c, Group_Name__c, Next_Pay_Date__c, Facility_Name__c, Frequency__c, Period_Start_Date__c, Period_End_Date__c,Facility__c,Facility__r.Name,StaffList__c,(select id,Pay_Date__c from Staff_Payroll_Settings__r) FROM Payroll_Setting__c WHERE Org_Name__c = :orgName';

    if (payrollGroupName != null) {
        String payName = '%' + payrollGroupName + '%';
        query += ' AND Group_Name__c LIKE :payName';
    }
       system.debug('status '+Status);
    if (Status != null) {
        query += ' AND Status__c = :status';
    }
		query += ' Order by Next_Pay_Date__c desc';
    try {
        system.debug('query '+query);
        lstPayrollSetting = Database.query(query);
    } catch (Exception e) {
        System.debug('Error occurred: ' + e.getMessage());
    }
    System.debug('query result ' + lstPayrollSetting);
    return lstPayrollSetting;
	}
    
     @AuraEnabled
    public static List<Taxation__mdt> getCustomMetaData(string PayDate){
        try{
            system.debug('selected date '+PayDate);
            Integer startyear;
            Integer endyear;
            Integer inputYear  = Date.Valueof(PayDate).year();
            Integer currentFinancialYearStart;

            // Check if today is before or after the start of the financial year
            if (Date.Valueof(PayDate) < Date.newInstance(inputYear , 7, 1)) {
                currentFinancialYearStart = inputYear  - 1; // If input is before July 1st, the financial year started last year
            } else {
                currentFinancialYearStart = inputYear ; // If input is after June 30th, the financial year started this year
            }
            
            Date financialStartDate = Date.newInstance(currentFinancialYearStart, 7, 1); 
            Date financialEndDate = Date.newInstance(currentFinancialYearStart + 1, 6, 30); 
           	system.debug('financial year start date  '+financialStartDate + 'financial year end date '+financialEndDate);
       
            List<Taxation__mdt> settings = [SELECT A_Value__c, B_Value__c, Max_value__c ,Min_Value__c,Type_of_scale__c,Year_Value__c FROM Taxation__mdt 
                                                        where Start_Date__c =: financialStartDate  and  End_Date__c =: financialEndDate ]; 
            system.debug('custom metadta values '+settings);
            return settings  ;  
        }catch(exception e){
             throw new AuraHandledException(e.getMessage());
        }
        
    }

     @AuraEnabled
    public static List<Staff_Payroll_Setting__c> updatePayeventIndicator(list<string> idList){
        list<Staff_Payroll_Setting__c> staffPayList= new list <Staff_Payroll_Setting__c>();
        for(string staffPayId :idList){
            Staff_Payroll_Setting__c sps= new Staff_Payroll_Setting__c();
            sps.Id=staffPayId;
            sps.Pay_Event_Indicator__c=true;
            staffPayList.add(sps);   
        }
        try{
            if(staffPayList.size()>0){
                update staffPayList;
            }
          return  staffPayList ;
        }catch(exception e){
             throw new AuraHandledException(e.getMessage());
        }
        
    }
     @AuraEnabled
    public static List<Staff_Payroll_Setting__c> getFinalisedList(list<string> idList){ 
         list<Staff_Payroll_Setting__c> fetchPayrollStaff=[select id,Staff__r.Name,Amazon_URL__c,Gross_Salary__c,Gross_Salary_Display__c,Staff__r.Last_Name__c,Staff__r.Employment_type__c,Staff__r.Contact_Number__c,Earnings__c,Earnings_Display__c,Payroll_Setting__r.Group_Name__c,Staff_ABN_Number__c,
                Total_Hours__c,Tax__c,Super_Annuation1__c,Super_Annuation_Final__c,Net_Pay__c,Payroll_Setting__r.Id,staff__r.TFN_number__c,Staff__r.ABN_Number__c, Org_ABN__c,Staff__r.PayrollId__c,Staff__r.Name__c,Staff__r.Date_Of_Birth__c,Staff__r.Address__Street__s,
                Staff__r.Address__City__s, Staff__r.Address__PostalCode__s, Staff__r.Address__StateCode__s,Staff__r.Email_Address__c,Staff__r.Emp_Start_Date__c,Staff__r.Emp_exit_date__c,Staff__r.Type_of_Employment__c,
      			Staff__r.Exit__c,Payroll_Setting__r.Period_Start_Date__c,Payroll_Setting__r.Period_End_Date__c,Staff__r.Payee_ETP_Payment_Date__c,Payroll_Setting__r.Next_Pay_Date__c,Payroll_Setting__r.Status__c,Org_BMSId__c,org_Name__c,orgEmail__c,Org_Phone__c,OrgPostalCode__c,Staff__r.Facility__r.Organisation__r.SoftwareId__c,Pay_Date__c,staff__r.Facility__r.Organisation__r.Contact_Name__c,Staff__c,Last_Salary_Wages_YTD__c,Last_Tax_YTD__c,Current_Tax_YTD__c,staff__r.Facility__r.Organisation__r.Branch_code__c,Current_Taxble_Gross_Salary_YTD__c,
                 Pre_Tax_One_Description__c,Pre_Tax_One_Value__c,Pre_Tax_Two_Description__c,Pre_Tax_Two_Value__c,
                Pre_Tax_Three_Description__c,Pre_Tax_Three_Value__c,Pre_Tax_Four_Description__c,Pre_Tax_Four_Value__c,Pre_Tax_Five_Description__c,Pre_Tax_Five_Value__c,Pre_tax_values__c,Post_tax_values__c,Reimbursements__c,Staff__r.Facility__r.Organisation__r.Agent_Number__c,
                 Voluntary_Contribution__c,Voluntary_Contribution_Percent__c ,Voluntary_Contribution_Fixed__c,Current_Super_and_Voluntaryannuation_YTD__c   
                from Staff_Payroll_Setting__c where id in:idList];
        return fetchPayrollStaff;
    }
 
	@AuraEnabled
    public static void insertSTPFinalise(list<string> staffPayIDList,string typeOfsubmission,string output,string refID){
        list<Staff_Payroll_Activity__c> staffPayActivity= new list<Staff_Payroll_Activity__c>();
        system.debug('list of staff Id '+staffPayIDList);
        for(string sfID:staffPayIDList){
             Staff_Payroll_Activity__c spac= new Staff_Payroll_Activity__c();
                spac.Type_of_Submission__c=typeOfsubmission;
                spac.Finalise_Response__c=string.valueof(output);
                spac.Finalise_Ref_ID__c=refID;
                spac.Finalise_Date__c=system.today();
                spac.Staff_Payroll_Setting__c=sfID;
            	spac.Payer_Declaration_Date__c=system.today();
               staffPayActivity.add(spac); 
        }
        
        try{
            if(staffPayActivity.size()>0){
                system.debug('staffPayActivity' +staffPayActivity);
                insert staffPayActivity;
            }
        }catch(exception e){
             throw new AuraHandledException(e.getMessage());
        }
       
        
    }
    
    @AuraEnabled
    public static list<Staff_Payroll_Activity__c> getFinalisedActivityLog(string staffPayID){
        return [select id,Finalise_Response__c,Finalise_Ref_ID__c,Finalise_Date__c,Payer_Declaration_Date__c,Staff_Payroll_Setting__c,Type_of_Submission__c from Staff_Payroll_Activity__c
                where Staff_Payroll_Setting__c =:staffPayID and (Type_of_Submission__c='Finalise' or Type_of_Submission__c='Pull Request'  ) order by createddate desc];
    }
    @AuraEnabled
    public static void saveSTPResponse(string paySettingId,string typeOfsubmission,string output,string refID){
        
         Staff_Payroll_Activity__c spac= new Staff_Payroll_Activity__c();
        	spac.Type_of_Submission__c=typeOfsubmission;
        	spac.STP_Response__c=string.valueof(output);
        	spac.STP_Ref_ID__c=refID;
     		spac.STP_Date__c=system.today();
        	spac.Payroll_Setting__c=paySettingId;
        	spac.Payer_Declaration_Date__c=system.today();
             try{
                insert spac;
                 system.debug('activity '+spac);
        		}catch(exception e){
             throw new AuraHandledException(e.getMessage());
        
            }
    }
    
     @AuraEnabled
    public static list<Staff_Payroll_Activity__c> getSTPActivityLog(string paySetID){
        return [select id,Type_of_Submission__c,STP_Response__c,STP_Ref_ID__c,Payroll_Setting__c,Payer_Declaration_Date__c,STP_Date__c from Staff_Payroll_Activity__c
                where Payroll_Setting__c =:paySetID and (Type_of_Submission__c='File STP' or Type_of_Submission__c='Pull Request') order by createddate desc];
    }

}