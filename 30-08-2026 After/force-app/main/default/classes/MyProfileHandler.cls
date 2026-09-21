public with sharing class MyProfileHandler {
    @AuraEnabled
    public static List<Staff_Payroll_Setting__c> accpetedStaffPayroll(String orgName,String staffId,String startDate,String enddate,boolean isFinalised){      
      
        List<Staff_Payroll_Setting__c> listOfStaff = new List<Staff_Payroll_Setting__c>();
        String query = 'Select Id,Name,Staff__r.Name,Staff__r.Last_Name__c,Amazon_URL__c,Gross_Salary_Display__c,Total_Hours__c,Tax__c,Super_Annuation_Final__c,Staff__c,Payroll_Setting__r.Period_Start_Date__c,Payroll_Setting__r.Period_End_Date__c,Payroll_Setting__r.Next_Pay_Date__c,Net_Pay__c,Resource_Name__c,Start_Date__c,End_Date__c,Pay_Date__c,Last_Tax_YTD__c,Last_Superannuation_YTD__c,Last_Taxable_Gross_Salary_YTD__c,Last_Net_Pay_Salary__c,Last_Salary_Wages_YTD__c,Last_Pre_Tax_YTD__c,Last_Post_Tax_YTD__c,Payroll_Setting__r.Status__c,Pay_Event_Indicator__c,Finalised_Formula__c,Current_Tax_YTD__c,Current_Superannuation_YTD__c,Current_Taxble_Gross_Salary_YTD__c,Current_Net_Pay_Salary_YTD__c,Current_Pre_Tax_YTD__c,Current_Post_Tax_YTD__c,Current_Super_and_Voluntaryannuation_YTD__c from Staff_Payroll_Setting__c where Org_Name__c =:orgName';
         if (staffId != null && staffId != '') {
             query += ' AND Staff__c =:staffId';
         }
        if(startDate != null && enddate != null){
             Date sDate=Date.valueOf(startDate);
             Date eDate=Date.valueOf(endDate);
             query+=' AND Pay_Date__c >=:sDate and Pay_Date__c <=: eDate'; 	
        }
        /*if(isFinalised==true){
            string status='STP Filed';
            query+= ' AND Payroll_Setting__r.Status__c =:status '; 	
        } */
        	query+= ' order by Pay_Date__c asc ' ;
        system.debug(' query '+query);
        listOfStaff=Database.query(query);
        system.debug(' list '+listOfStaff);
        return listOfStaff;
    }
     
}