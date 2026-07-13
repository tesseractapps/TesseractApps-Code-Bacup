/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @Test Class 		  : PayrollSettingSchedularTest
* @last modified on  : 06-16-2023
* @last modified by  : Raja Sekhar Reddy
**/
public class PayrollSettingSchedular {
    @future
    public static void schedulePaySetting(String newPayrollSettingId){
        
        Payroll_Setting__c payRollSettingList = [SELECT id,Name,Facility_Name__c,Frequency__c,Next_Pay_Date__c,Group_Name__c,
                                                 Period_End_Date__c,Period_Start_Date__c,Facility__r.Id,Organization__c,
                                                 Staff_List__c,status__c,StaffList__c,Period__c
                                                 FROM Payroll_Setting__c where Id=:newPayrollSettingId];
        Payroll_Setting__c payrollSettingRec = new Payroll_Setting__c();
  //changes made as per new requirment-sowmya
       // payrollSettingRec.Facility__c=payRollSettingList.Facility__r.id;
         payrollSettingRec.Organization__c=payRollSettingList.Organization__c;
        if(payRollSettingList.Frequency__c == 'Weekly'){
          //  payrollSettingRec.Period_Start_Date__c=payRollSettingList.Period_End_Date__c+1;
              payrollSettingRec.Period_Start_Date__c=payRollSettingList.Period_Start_Date__c+7;
              payrollSettingRec.Period_End_Date__c=payRollSettingList.Period_End_Date__c+7;
           // payrollSettingRec.Next_Pay_Date__c=payRollSettingList.Period_End_Date__c+9;
            payrollSettingRec.Next_Pay_Date__c=payRollSettingList.Next_Pay_Date__c+7;
        }
        else if(payRollSettingList.Frequency__c == 'Fortnightly'){
            payrollSettingRec.Period_Start_Date__c=payRollSettingList.Period_End_Date__c+1;
            payrollSettingRec.Period_End_Date__c=payRollSettingList.Period_End_Date__c+14;
            payrollSettingRec.Next_Pay_Date__c=payRollSettingList.Next_Pay_Date__c+14;
        }
        else{
            payrollSettingRec.Period_Start_Date__c=payRollSettingList.Period_End_Date__c+1;
            Date lastDayOfMonth = payRollSettingList.Period_End_Date__c+1;
            lastDayOfMonth = lastDayOfMonth.addDays(Date.daysInMonth(lastDayOfMonth.year(), lastDayOfMonth.month()) - 1);
            payrollSettingRec.Period_End_Date__c=lastDayOfMonth; 
           // payrollSettingRec.Next_Pay_Date__c=payRollSettingList.Period_End_Date__c+1;
          // payrollSettingRec.Next_Pay_Date__c=payRollSettingList.Next_Pay_Date__c+30;
          // new line added by praveen 
           payrollSettingRec.Next_Pay_Date__c=(payRollSettingList.Next_Pay_Date__c).addMonths(1);
            
        }
        payrollSettingRec.Frequency__c=payRollSettingList.Frequency__c;
        payrollSettingRec.Group_Name__c=payRollSettingList.Group_Name__c;
        payrollSettingRec.StaffList__c=payRollSettingList.StaffList__c;
        insert payrollSettingRec;
        
        List<Staff_Payroll_Setting__c> staffPayRollList =  new List<Staff_Payroll_Setting__c>();
        for(Staff_Payroll_Setting__c staffPayrollRec : [Select Id,Current_Salary_Wages_YTD__c,Pay_Date__c,Current_Tax_YTD__c,Current_Superannuation_YTD__c,Current_Post_Tax_YTD__c, Current_Taxble_Gross_Salary_YTD__c,Current_Net_Pay_Salary_YTD__c,Current_Pre_Tax_YTD__c,Staff__r.Id,Payroll_Setting__r.Id,Frequency__c,Pay_Event_Indicator__c,Current_Voluntary_Superannuation_YTD__c,Last_Broken_Amount__c,Current_Broken_YTD__c,Last_Broken_Allowance__c,Current_Broken_Allowance_YTD__c,Current_Cancel_YTD__c,Last_Cancel_Amount__c,
                                                        Current_Super_and_Voluntaryannuation_YTD__c,Current_General_Shift_Ytd__c,Current_Morning_Shift_Ytd__c,Current_Afternoon_Shift_Ytd__c,Current_Night_Shift_Ytd__c,Current_Sleepover_Shift_Ytd__c,Current_Saturday_Shift_Ytd__c,Current_Sunday_Shift_Ytd__c,Current_Extended_Shift_Ytd__c,Current_Holiday_Shift_Ytd__c,Last_Holiday_Shift_Amount__c,Last_Morning_Shift_Amount__c,Current_Paid_Leave_Ytd__c,Last_Paid_Leave_Amount__c,
                                                        Paid_leave_Amount__c,Annual_Paid_Leave_Amount__c,Current_Annual_Leave_Ytd__c,Last_Paid_Annual_Leave_Amount__c,Personal_Leave_Amount__c,Current_Personal_Leave_Ytd__c,Last_Paid_Personal_Leave_Amount__c,
                                                        Compassionate_Paid_Leave_Amount__c,Current_Compassionate_Leave_Ytd__c,Last_Paid_Compassionate_Paid__c,Toil_Paid_Leave_Amount__c,Last_Paid_Toil_Leave_Amount__c,Current_Toil_Leave_Ytd__c,
                                                        Rdo_Paid_Leave_Amount__c,Last_Paid_Rdo_Leave_Amount__c,Current_Rdo_Leave_Ytd__c,Bereavement_Paid_Leave_Amount__c,Current_Bereavement_Leave_Ytd__c,Last_Paid_Bereavement__c,
                                                        Birthday_Paid_Leave_Amount__c,Current_Birthday_Leave_Ytd__c,Last_Paid_Birthday__c,Wellness_Paid_Leave_Amount__c,Last_Paid_Wellness_Paid_Leave_Amount__c,Current_Wellness_Leave_Ytd__c,Current_Over_Time_Tier_One_YTD__c,Current_Over_Time_Tier_Two_YTD__c,
                                                        Volunteer_Paid_Leave_Amount__c,Last_Paid_Volunteer_Leave_Amount__c,Current_Volunteer_Leave_Ytd__c,Parental_Unpaid_Leave_Hours__c,Unpaid_Carers_Unpaid_Leave_Hours__c,Extended_Unpaid_Leave_Hours__c from Staff_Payroll_Setting__c where Payroll_Setting__r.Id =: newPayrollSettingId]){
            Staff_Payroll_Setting__c staffRec= new Staff_Payroll_Setting__c();
            staffRec.Staff__c=staffPayrollRec.Staff__r.Id;
            staffRec.Frequency__c = staffPayrollRec.Frequency__c;            
            
            //if(staffRec.Pay_Date__c.Month()==7 && staffRec.Pay_Date__c.Day() < 7){  //Nagendra Modified based on the requirment
            system.debug('payRollSettingList.Period_Start_Date__c.Month()'+payRollSettingList.Period_Start_Date__c.Month());
            system.debug('payRollSettingList.Period_Start_Date__c.Day()'+payRollSettingList.Period_Start_Date__c.Day());
           
            if(payrollSettingRec.Next_Pay_Date__c.month()>6 && payrollSettingRec.Next_Pay_Date__c.month()<9){
                 list<Staff_Payroll_Setting__History> staffPayPreviousRecList=[SELECT Id,NewValue,OldValue,ParentId,parent.Sunday_hours__c ,parent.Working_Hours__c,parent.Resource_Name__c,parent.Payroll_Setting__r.Status__c
 																		FROM Staff_Payroll_Setting__History where parent.Staff__c=:staffPayrollRec.Staff__r.Id and parent.Payroll_Setting__r.Status__c !=null AND Parent.Pay_Date__c >= :Date.newInstance(payrollSettingRec.Next_Pay_Date__c.year(), 7, 1) 
                                                                        and Parent.Pay_Date__c <=:Date.newInstance(payrollSettingRec.Next_Pay_Date__c.year(), 9, 1)   ORDER BY CreatedDate desc ];
             	 system.debug('size of previous history records '+staffPayPreviousRecList.size());
                if(staffPayPreviousRecList.size() ==0  ){
   
                    staffRec.Last_Salary_Wages_YTD__c = 0;
                    staffRec.Last_Tax_YTD__c = 0;
                    staffRec.Last_Superannuation_YTD__c = 0;
                    staffRec.Last_Pre_Tax_YTD__c = 0;
                    staffRec.Last_Post_Tax_YTD__c = 0;
                    // new line added by praveen
                    staffRec.Last_Taxable_Gross_Salary_YTD__c=0;
                    staffRec.Last_Net_Pay_Salary__c= 0;
                    staffRec.Last_Voluntary_Superannuation_YTD__c=0;
                    staffRec.Last_Super_and_Voluntaryannuation_YTD__c =0;
                    staffRec.Last_General_Shift_Amount__c =0;
                    staffRec.Last_Morning_Shift_Amount__c =0;
                    staffRec.Last_Afternoon_Shift_Amount__c =0;
                    staffRec.Last_Night_Shift_Amount__c =0;
                    staffRec.Last_Sleepover_Shift_Amount__c =0;
                    staffRec.Last_Saturday_Shift_Amount__c =0;
                    staffRec.Last_Sunday_Shift_Amount__c =0;
                    staffRec.Last_Extended_Shift_Amount__c =0;
                    staffRec.Last_Extended_Shift_Amount__c =0;
                    staffRec.Last_Holiday_Shift_Amount__c =0;
                    staffRec.Last_Paid_Leave_Amount__c =0;
                    staffRec.Last_Broken_Amount__c =0;
                    staffRec.Last_Broken_Allowance__c =0;
                    staffRec.Last_Cancel_Amount__c =0;
                    staffRec.Last_Paid_Annual_Leave_Amount__c =0;
                    staffRec.Last_Paid_Personal_Leave_Amount__c =0;
                    staffRec.Last_Over_Time_Tier_One__c =0;
                    staffRec.Last_Over_Time_Tier_Two__c =0;

                }else{
                     staffRec.Last_Salary_Wages_YTD__c = staffPayrollRec.Current_Salary_Wages_YTD__c;
                    staffRec.Last_Tax_YTD__c = staffPayrollRec.Current_Tax_YTD__c;
                    staffRec.Last_Superannuation_YTD__c = staffPayrollRec.Current_Superannuation_YTD__c;
                    staffRec.Last_Pre_Tax_YTD__c = staffPayrollRec.Current_Pre_Tax_YTD__c;
                    staffRec.Last_Post_Tax_YTD__c = staffPayrollRec.Current_Post_Tax_YTD__c;
                    // new line added by praveen
                    staffRec.Last_Taxable_Gross_Salary_YTD__c=staffPayrollRec.Current_Taxble_Gross_Salary_YTD__c;
                    staffRec.Last_Net_Pay_Salary__c=staffPayrollRec.Current_Net_Pay_Salary_YTD__c;
                    staffRec.Last_Voluntary_Superannuation_YTD__c=staffPayrollRec.Current_Voluntary_Superannuation_YTD__c;
                    staffRec.Last_Super_and_Voluntaryannuation_YTD__c=staffPayrollRec.Current_Super_and_Voluntaryannuation_YTD__c;
                    staffRec.Last_General_Shift_Amount__c =staffPayrollRec.Current_General_Shift_Ytd__c;
                    staffRec.Last_Morning_Shift_Amount__c =staffPayrollRec.Current_Morning_Shift_Ytd__c;
                    staffRec.Last_Afternoon_Shift_Amount__c =staffPayrollRec.Current_Afternoon_Shift_Ytd__c;
                    staffRec.Last_Night_Shift_Amount__c =staffPayrollRec.Current_Night_Shift_Ytd__c;
                    staffRec.Last_Sleepover_Shift_Amount__c =staffPayrollRec.Current_Sleepover_Shift_Ytd__c;
                    staffRec.Last_Saturday_Shift_Amount__c =staffPayrollRec.Current_Saturday_Shift_Ytd__c;
                    staffRec.Last_Sunday_Shift_Amount__c =staffPayrollRec.Current_Sunday_Shift_Ytd__c;
                    staffRec.Last_Extended_Shift_Amount__c =staffPayrollRec.Current_Extended_Shift_Ytd__c;
                    staffRec.Last_Holiday_Shift_Amount__c =staffPayrollRec.Current_Holiday_Shift_Ytd__c;
                    staffRec.Last_Morning_Shift_Amount__c =staffPayrollRec.Current_Morning_Shift_Ytd__c;
                    staffRec.Last_Broken_Amount__c =staffPayrollRec.Current_Broken_YTD__c;
                    staffRec.Last_Broken_Allowance__c =staffPayrollRec.Current_Broken_Allowance_YTD__c;
                    staffRec.Last_Cancel_Amount__c =staffPayrollRec.Current_Cancel_YTD__c;
                    staffRec.Last_Paid_Leave_Amount__c =staffPayrollRec.Current_Paid_Leave_Ytd__c;
                    staffRec.Last_Paid_Annual_Leave_Amount__c =staffPayrollRec.Current_Annual_Leave_Ytd__c;
                    staffRec.Last_Paid_Personal_Leave_Amount__c =staffPayrollRec.Current_Personal_Leave_Ytd__c;
                    staffRec.Last_Over_Time_Tier_One__c =staffPayrollRec.Current_Over_Time_Tier_One_YTD__c;
                    staffRec.Last_Over_Time_Tier_Two__c =staffPayrollRec.Current_Over_Time_Tier_Two_YTD__c;
                }
                
            }else{
                staffRec.Last_Salary_Wages_YTD__c = staffPayrollRec.Current_Salary_Wages_YTD__c;
                staffRec.Last_Tax_YTD__c = staffPayrollRec.Current_Tax_YTD__c;
                staffRec.Last_Superannuation_YTD__c = staffPayrollRec.Current_Superannuation_YTD__c;
                staffRec.Last_Pre_Tax_YTD__c = staffPayrollRec.Current_Pre_Tax_YTD__c;
                staffRec.Last_Post_Tax_YTD__c = staffPayrollRec.Current_Post_Tax_YTD__c;
                // new line added by praveen
                staffRec.Last_Taxable_Gross_Salary_YTD__c=staffPayrollRec.Current_Taxble_Gross_Salary_YTD__c;
                staffRec.Last_Net_Pay_Salary__c=staffPayrollRec.Current_Net_Pay_Salary_YTD__c;
                staffRec.Last_Voluntary_Superannuation_YTD__c=staffPayrollRec.Current_Voluntary_Superannuation_YTD__c;
                staffRec.Last_Super_and_Voluntaryannuation_YTD__c=staffPayrollRec.Current_Super_and_Voluntaryannuation_YTD__c;
                staffRec.Last_General_Shift_Amount__c =staffPayrollRec.Current_General_Shift_Ytd__c;
                staffRec.Last_Morning_Shift_Amount__c =staffPayrollRec.Current_Morning_Shift_Ytd__c;
                staffRec.Last_Afternoon_Shift_Amount__c =staffPayrollRec.Current_Afternoon_Shift_Ytd__c;
                staffRec.Last_Night_Shift_Amount__c =staffPayrollRec.Current_Night_Shift_Ytd__c;
                staffRec.Last_Sleepover_Shift_Amount__c =staffPayrollRec.Current_Sleepover_Shift_Ytd__c;
                staffRec.Last_Saturday_Shift_Amount__c =staffPayrollRec.Current_Saturday_Shift_Ytd__c;
                staffRec.Last_Sunday_Shift_Amount__c =staffPayrollRec.Current_Sunday_Shift_Ytd__c;
                staffRec.Last_Extended_Shift_Amount__c =staffPayrollRec.Current_Extended_Shift_Ytd__c;
                staffRec.Last_Holiday_Shift_Amount__c =staffPayrollRec.Current_Holiday_Shift_Ytd__c;
                staffRec.Last_Broken_Amount__c =staffPayrollRec.Current_Broken_YTD__c;
                staffRec.Last_Broken_Allowance__c =staffPayrollRec.Current_Broken_Allowance_YTD__c;
                staffRec.Last_Cancel_Amount__c =staffPayrollRec.Current_Cancel_YTD__c;
                staffRec.Last_Paid_Leave_Amount__c =staffPayrollRec.Current_Paid_Leave_Ytd__c;
                staffRec.Last_Paid_Annual_Leave_Amount__c =staffPayrollRec.Current_Annual_Leave_Ytd__c;
                staffRec.Last_Paid_Personal_Leave_Amount__c =staffPayrollRec.Current_Personal_Leave_Ytd__c;
                staffRec.Last_Over_Time_Tier_One__c =staffPayrollRec.Current_Over_Time_Tier_One_YTD__c;
                staffRec.Last_Over_Time_Tier_Two__c =staffPayrollRec.Current_Over_Time_Tier_Two_YTD__c;
            }
           
             	
            
            system.debug('payeevent indicator==> '+staffPayrollRec.Pay_Event_Indicator__c);
           /* if(staffPayrollRec.Pay_Event_Indicator__c ==false){
                 staffRec.Last_Salary_Wages_YTD__c = staffPayrollRec.Current_Salary_Wages_YTD__c;
                staffRec.Last_Tax_YTD__c = staffPayrollRec.Current_Tax_YTD__c;
                staffRec.Last_Superannuation_YTD__c = staffPayrollRec.Current_Superannuation_YTD__c;
                staffRec.Last_Pre_Tax_YTD__c = staffPayrollRec.Current_Pre_Tax_YTD__c;
                staffRec.Last_Post_Tax_YTD__c = staffPayrollRec.Current_Post_Tax_YTD__c;
                // new line added by praveen
                staffRec.Last_Taxable_Gross_Salary_YTD__c=staffPayrollRec.Current_Taxble_Gross_Salary_YTD__c;
                staffRec.Last_Net_Pay_Salary__c=staffPayrollRec.Current_Net_Pay_Salary_YTD__c;
               // staffRec.Last_Reimbursements_YTD__c=staffPayrollRec.Current_Reimbursements_YTD__c;   
            }else{
                staffRec.Last_Salary_Wages_YTD__c = 0;
                staffRec.Last_Tax_YTD__c = 0;
                staffRec.Last_Superannuation_YTD__c = 0;
                staffRec.Last_Pre_Tax_YTD__c = 0;
                staffRec.Last_Post_Tax_YTD__c = 0;
                // new line added by praveen
                staffRec.Last_Taxable_Gross_Salary_YTD__c=0;
                staffRec.Last_Net_Pay_Salary__c= 0;
            } */
            system.debug('next paydate before insert'+payrollSettingRec.Next_Pay_Date__c);
           	staffRec.Pay_Date__c= payrollSettingRec.Next_Pay_Date__c; // new line added by praveen
            staffRec.Payroll_Setting__c=payrollSettingRec.Id;
            staffPayRollList.add(staffRec);
        }
        if(staffPayRollList.size()>0)
            insert staffPayRollList;
    }
    
    @future
    public static void createPayRunSettingDelete(String newPayrollSettingId){
        
        Payroll_Setting__c payRollSettingList = [SELECT id,Name,Facility_Name__c,Frequency__c,Next_Pay_Date__c,Group_Name__c,
                                                 Period_End_Date__c,Period_Start_Date__c,Facility__r.Id,
                                                 Staff_List__c,status__c,StaffList__c,Period__c
                                                 FROM Payroll_Setting__c where Id=:newPayrollSettingId];
        Payroll_Setting__c payrollSettingRec = new Payroll_Setting__c();
        payrollSettingRec.Facility__c=payRollSettingList.Facility__r.id;
        
        System.debug('weekly '+payRollSettingList.Frequency__c);
        payrollSettingRec.Period_Start_Date__c=payRollSettingList.Period_Start_Date__c;
        payrollSettingRec.Period_End_Date__c=payRollSettingList.Period_End_Date__c;
        payrollSettingRec.Next_Pay_Date__c=payRollSettingList.Next_Pay_Date__c;
        payrollSettingRec.Frequency__c=payRollSettingList.Frequency__c;
        payrollSettingRec.Group_Name__c=payRollSettingList.Group_Name__c;
        insert payrollSettingRec;
        
        List<Staff_Payroll_Setting__c> staffPayRollList =  new List<Staff_Payroll_Setting__c>();
        for(Staff_Payroll_Setting__c staffPayrollRec : [Select Id,Last_Post_Tax_YTD__c,Last_Pre_Tax_YTD__c,Last_Superannuation_YTD__c,Last_Salary_Wages_YTD__c,Last_Tax_YTD__c,Current_Pre_Tax_YTD__c,Current_Post_Tax_YTD__c,Current_Salary_Wages_YTD__c,Current_Tax_YTD__c,Current_Superannuation_YTD__c,Staff__r.Id,Payroll_Setting__r.Id,Frequency__c from Staff_Payroll_Setting__c where Payroll_Setting__r.Id =: newPayrollSettingId]){
            Staff_Payroll_Setting__c staffRec= new Staff_Payroll_Setting__c();
            staffRec.Staff__c=staffPayrollRec.Staff__r.Id;
            staffRec.Frequency__c = staffPayrollRec.Frequency__c;
            
            if(payRollSettingList.Period_Start_Date__c.Month()==7 && payRollSettingList.Period_Start_Date__c.Day()==1){
                staffRec.Last_Salary_Wages_YTD__c = 0;
                staffRec.Last_Tax_YTD__c = 0;
                staffRec.Last_Superannuation_YTD__c = 0;
                staffRec.Last_Pre_Tax_YTD__c = 0;
                staffRec.Last_Post_Tax_YTD__c = 0;
            }else{
                staffRec.Last_Salary_Wages_YTD__c = staffPayrollRec.Last_Salary_Wages_YTD__c;
                staffRec.Last_Tax_YTD__c = staffPayrollRec.Last_Tax_YTD__c;
                staffRec.Last_Superannuation_YTD__c = staffPayrollRec.Last_Superannuation_YTD__c;
                staffRec.Last_Pre_Tax_YTD__c = staffPayrollRec.Last_Pre_Tax_YTD__c;
                staffRec.Last_Post_Tax_YTD__c = staffPayrollRec.Last_Post_Tax_YTD__c;
            }
            
            staffRec.Payroll_Setting__c=payrollSettingRec.Id;
            staffPayRollList.add(staffRec);
        }
        if(staffPayRollList.size()>0){
            insert staffPayRollList;
            //Delete staffPayRollList;
        }
    }
     @AuraEnabled
    public static list <Staff_Payroll_Setting__History> getPayHistrory(string Paymentdate,string groupName){
       date paydate=date.valueOf(Paymentdate);
       list <Staff_Payroll_Setting__History> historyList=[SELECT Id,NewValue,OldValue,ParentId,parent.Sunday_hours__c ,parent.Working_Hours__c,parent.Resource_Name__c,parent.Payroll_Setting__r.Status__c,Parent.Pay_Date__c,Parent.Staff__c,Parent.Current_Salary_Wages_YTD__c,Parent.Current_Tax_YTD__c,Parent.Current_Superannuation_YTD__c,Parent.Current_Pre_Tax_YTD__c,Parent.Current_Post_Tax_YTD__c,Parent.Current_Taxble_Gross_Salary_YTD__c,Parent.Current_Net_Pay_Salary_YTD__c,
 															parent.Last_Pre_Tax_YTD__c,parent.Last_Post_Tax_YTD__c,parent.Last_Tax_YTD__c,parent.Last_Superannuation_YTD__c,parent.Last_Taxable_Gross_Salary_YTD__c,parent.Last_Net_Pay_Salary__c,parent.Last_Salary_Wages_YTD__c,
                                                          parent.Last_Voluntary_Superannuation_YTD__c ,parent.Last_Super_and_Voluntaryannuation_YTD__c,parent.Current_Voluntary_Superannuation_YTD__c,parent.Current_Super_and_Voluntaryannuation_YTD__c FROM Staff_Payroll_Setting__History where parent.Payroll_Setting__r.Group_Name__c =: groupName  AND Parent.Pay_Date__c >=: Date.newInstance(paydate.year(), 6, 1) 
                                                            and Parent.Pay_Date__c <=:Date.newInstance(paydate.year()+1, 7, 30) ORDER BY CreatedDate desc];
        
       return historyList ;
    }
}