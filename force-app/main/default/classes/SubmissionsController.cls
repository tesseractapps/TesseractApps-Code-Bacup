public class SubmissionsController {
      @AuraEnabled
    public static List<Reimbursement__c> PendingReimbursements(string startDate){
        String UserEmail = UserInfo.getUserEmail();       
        system.debug('startDate'+startDate);
         Date sDate = Date.valueOf(startDate);
        List<Reimbursement__c> reimbursements = [SELECT Id,name,  ShiftwithStaff__c, Others__c, Comments__c, 
                                             Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c,Amount__c,Mileage_Others__c,
                                             Approval_user__c, Approver_Comments__c,ShiftDate__c,Shift_Login_time_formula__c,Shift_log_out_time_formula__c
                                                 FROM Reimbursement__c where
                                             ShiftwithStaff__r.staff__r.Email_Address__c=:UserEmail and 
                                             ShiftwithStaff__r.Add_Shift__r.Start_Date__c =:sDate and Approval_Status__c='Rejected' ]; //Mileage__c
        return reimbursements;
    }  
    
    @AuraEnabled(cacheable = true)
    public static List<Reimbursement__c> getAllReimbursements(string startDate){
      /*  Date sDate = Date.valueOf(startDate);
        User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
         String UserEmail = UserInfo.getUserEmail();
        string rolename = [select id,name from userrole where id=:UserInfo.getUserRoleId()].name;
        
    	String orgName = [SELECT Id,Name FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Name;
        List<Reimbursement__c> reimbursementsList = [SELECT Id,Name,ShiftwithStaff__c, Others__c, Comments__c,ShiftwithStaff__r.Staff__r.NameToDisplay__c, 
                                             Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c,Amount__c,Mileage_Others__c,
                                             Approval_user__c, Approver_Comments__c,ShiftDate__c,Shift_Login_time_formula__c,Shift_log_out_time_formula__c
                                                 FROM Reimbursement__c where Organisation_name__c=:orgName and 
                                             ShiftwithStaff__r.Add_Shift__r.Start_Date__c =:sDate order by lastmodifieddate desc]; //Mileage__c
        return reimbursementsList;*/
        
        Date sDate = Date.valueOf(startDate);
        User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String roleName = [SELECT Name FROM UserRole WHERE Id = :UserInfo.getUserRoleId()].Name;
        String orgName = [SELECT Name FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Name;
        String UserEmail = UserInfo.getUserEmail();
        
        // Define the base query
        String query = 'SELECT Id, Name, ShiftwithStaff__c, Others__c, Comments__c, ShiftwithStaff__r.Staff__r.NameToDisplay__c,Mileage_Amount__c, ' +
            'Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c, Amount__c, Mileage_Others__c,Cost_per_KM__c,Total_Amount__c, ' +
            'Approval_user__c, Approver_Comments__c, ShiftDate__c, Shift_Login_time_formula__c, Shift_log_out_time_formula__c,lastmodifieddate,Approved_Date__c ' +
            'FROM Reimbursement__c WHERE Organisation_Name__c = :orgName ' +
            'AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c = :sDate ';
        	if (roleName == 'Portal Account Partner User') {
          
            query += 'AND ShiftwithStaff__r.Staff__r.Email_Address__c = :UserEmail ';
        	} 
        
        	query += ' ORDER BY LastModifiedDate DESC';
        
        // Execute the dynamic query
        List<Reimbursement__c> reimbursementsList = Database.query(query);
        system.debug(' reimburesemenst '+reimbursementsList);
        return reimbursementsList;
        
    }
     @AuraEnabled(cacheable = true)
    public static list<Reimbursement__c> getShiftReimbursements(String shiftId){
        List<Reimbursement__c> reimbursementsList = [SELECT Id,Name,ShiftwithStaff__c, Others__c, Comments__c,ShiftwithStaff__r.Staff__r.NameToDisplay__c,Mileage_Amount__c,
                                             Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c,Amount__c,Mileage_Others__c,Cost_per_KM__c,Total_Amount__c,
                                             Approval_user__c, Approver_Comments__c,ShiftDate__c,Shift_Login_time_formula__c,Shift_log_out_time_formula__c,lastmodifieddate,Approved_Date__c
                                                 FROM Reimbursement__c where 
                                             ShiftwithStaff__c=:shiftId order by lastmodifieddate desc];
        return reimbursementsList;
        
    }
    

}