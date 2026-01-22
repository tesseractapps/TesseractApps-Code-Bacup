public class SubmissionsController {
    @AuraEnabled(cacheable = true)
    public static List<Reimbursement__c> PendingReimbursementsforMobile(string startDate){
        String UserEmail = UserInfo.getUserEmail();       
        system.debug('startDate'+startDate);
        Date sDate = Date.valueOf(startDate);
        List<Reimbursement__c> reimbursements = [SELECT Id,Name,  ShiftwithStaff__c, Others__c, Comments__c,ShiftwithStaff__r.Staff__r.NameToDisplay__c,ShiftwithStaff__r.Date__c,Type_of_Vehicle__c, 
                                                 Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c,Amount__c,Mileage_Others__c,ShiftwithStaff__r.Staff__r.picture__c,
                                                 Approval_user__c, Approver_Comments__c,ShiftDate__c,Shift_Login_time_formula__c,Shift_log_out_time_formula__c,ShiftwithStaff__r.CreatedById
                                                 FROM Reimbursement__c where
                                                 ShiftwithStaff__r.staff__r.Email_Address__c=:UserEmail and 
                                                 ShiftwithStaff__r.Add_Shift__r.Start_Date__c =:sDate and Approval_Status__c='Rejected' ]; //Mileage__c
        return reimbursements;
    }
    
    @AuraEnabled
    public static List<Reimbursement__c> PendingReimbursements(String sdate, String edate, String status ) {
        String userEmail = UserInfo.getUserEmail();
        System.debug('sdate >> ' + sdate + ', edate >> ' + edate);
        
        Date startDate = Date.valueOf(sdate);
        Date endDate   = Date.valueOf(edate);
        
        /* List<Reimbursement__c> reimbursements = [
SELECT Id, Name, ShiftwithStaff__c, Others__c, Comments__c,Type_of_Vehicle__c,Mileage_Amount__c,Total_Amount__c,Submitted_Date__c,
ShiftwithStaff__r.Staff__r.NameToDisplay__c,
ShiftwithStaff__r.Date__c,
Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c,
Approval_Status__c, Amount__c, Mileage_Others__c,
ShiftwithStaff__r.Staff__r.picture__c,
Approval_user__c, Approver_Comments__c,
ShiftDate__c, Shift_Login_time_formula__c, Shift_log_out_time_formula__c,
ShiftwithStaff__r.CreatedById
FROM Reimbursement__c
WHERE ShiftwithStaff__r.Staff__r.Email_Address__c = :userEmail
AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c >= :startDate
AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c <= :endDate
];

return reimbursements;*/
        
        String query = 'SELECT Id, Name, ShiftwithStaff__c, Others__c, Comments__c, Type_of_Vehicle__c, Mileage_Amount__c, ' +
            'Total_Amount__c, Submitted_Date__c, ' +
            'ShiftwithStaff__r.Staff__r.NameToDisplay__c, ShiftwithStaff__r.Date__c, Amazon_file_URL__c, ' +
            'Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c, Amount__c, Mileage_Others__c, ' +
            'ShiftwithStaff__r.Staff__r.picture__c, Approval_user__c, Approver_Comments__c, ShiftDate__c, ' +
            'Shift_Login_time_formula__c, Shift_log_out_time_formula__c, ShiftwithStaff__r.CreatedById ' +
            'FROM Reimbursement__c ' +
            'WHERE ShiftwithStaff__r.Staff__r.Email_Address__c = :userEmail ' +
            'AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c >= :startDate ' +
            'AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c <= :endDate ';
        
        // Add status condition if provided and not "All"
        if (!String.isBlank(status) && status != 'All') {
            System.debug('status in PendingReimbursements in if '+status );
            query += 'AND Approval_Status__c = :status ';
        } else if (status == 'All'){
            query += 'AND (Approval_Status__c = \'Pending\' OR Approval_Status__c = \'Approved\' OR Approval_Status__c = \'Rejected\') ';
        }
        System.debug('status in PendingReimbursements outside if '+status );
        // Optional sort
        query += 'ORDER BY LastModifiedDate DESC';
        
        System.debug('Dynamic Reimbursement Query: ' + query);
        
        return Database.query(query);
    }
    
    
    @AuraEnabled(cacheable = true)
    public static List<Reimbursement__c> getAllReimbursementsforMobile(string startDate){        
        Date sDate = Date.valueOf(startDate);
        User objUser = [SELECT Id, Organization_Name__c,User_Type__c FROM User WHERE Id = :UserInfo.getUserId()];
        String roleName = '';
        try {
            UserRole userRole = [SELECT Name FROM UserRole WHERE Id = :UserInfo.getUserRoleId()];
            roleName = userRole.Name;
        } catch (Exception e) {
            // Handle the case where UserRoleId is null or role doesn't exist
            roleName = 'Portal Account Partner User';
        }
        String orgName = [SELECT Name FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Name;
        String UserEmail = UserInfo.getUserEmail();
        String userType = objUser.User_Type__c;
        String userId = UserInfo.getUserId();
        Set<Id> facilityIdSet = new Set<Id>();
        if (userType != 'NDIS Org Admin' && roleName != 'Portal Account Partner User') {
            list<Facility_Association__c>  facAssociation =PortalUserController.getFacilityUserWise(UserId,userType);
            for (Facility_Association__c fa : facAssociation) {
                if (fa.Facility__c != null) {
                    facilityIdSet.add(fa.Facility__c);
                }
            }
        }
        
        // Define the base query
        String query = 'SELECT Id, Name, ShiftwithStaff__c, Others__c, Comments__c, ShiftwithStaff__r.Staff__r.NameToDisplay__c,Mileage_Amount__c,ShiftwithStaff__r.Add_Shift__r.Facility__c,ShiftwithStaff__r.Staff__r.picture__c,' +
            'Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c, Amount__c, Mileage_Others__c,Cost_per_KM__c,Total_Amount__c, Fuel_Electric_Price__c, ' +
            'Approval_user__c, Approver_Comments__c, ShiftDate__c, Shift_Login_time_formula__c, Shift_log_out_time_formula__c,lastmodifieddate,Approved_Date__c, Type_of_Vehicle__c ' +
            'FROM Reimbursement__c WHERE Organisation_Name__c = :orgName ' +
            'AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c = :sDate ';
        if (roleName == 'Portal Account Partner User') {
            
            query += 'AND ShiftwithStaff__r.Staff__r.Email_Address__c = :UserEmail ';
        }else if (userType != 'NDIS Org Admin') {
            if (!facilityIdSet.isEmpty()) {
                query += 'AND ShiftwithStaff__r.Add_Shift__r.Facility__c IN :facilityIdSet ';
            } else {
                // No facilities → return empty
                return new List<Reimbursement__c>();
            }
        }
        
        query += ' ORDER BY LastModifiedDate DESC';
        
        // Execute the dynamic query
        List<Reimbursement__c> reimbursementsList = Database.query(query);
        system.debug(' reimburesemenst '+reimbursementsList);
        return reimbursementsList;   
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Reimbursement__c> getAllReimbursements(String startDate, String endDate, String status) {
        Date sDate = Date.valueOf(startDate);
        Date eDate = String.isBlank(endDate) ? sDate : Date.valueOf(endDate);
        
        User objUser = [SELECT Id, Organization_Name__c, User_Type__c FROM User WHERE Id = :UserInfo.getUserId()];
        String roleName = '';
        try {
            UserRole userRole = [SELECT Name FROM UserRole WHERE Id = :UserInfo.getUserRoleId()];
            roleName = userRole.Name;
        } catch (Exception e) {
            // Handle the case where UserRoleId is null or role doesn't exist
            roleName = 'Portal Account Partner User';
        }
        String orgName = [SELECT Name FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Name;
        String userEmail = UserInfo.getUserEmail();
        String userType = objUser.User_Type__c;
        String userId = UserInfo.getUserId();
        
        Set<Id> facilityIdSet = new Set<Id>();
        if (userType != 'NDIS Org Admin' && roleName != 'Portal Account Partner User') {
            List<Facility_Association__c> facAssociation = PortalUserController.getFacilityUserWise(userId, userType);
            for (Facility_Association__c fa : facAssociation) {
                if (fa.Facility__c != null) facilityIdSet.add(fa.Facility__c);
            }
        }
        
        String query = 'SELECT Id, Name, ShiftwithStaff__c, Others__c, Comments__c, ShiftwithStaff__r.Staff__r.NameToDisplay__c, Mileage_Amount__c, ShiftwithStaff__r.Add_Shift__r.Facility__c, ShiftwithStaff__r.Staff__r.picture__c, ' +
            'Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c, Amount__c, Mileage_Others__c, Cost_per_KM__c, Total_Amount__c, Fuel_Electric_Price__c, ' +
            'Approval_user__c, Approver_Comments__c, ShiftDate__c, Shift_Login_time_formula__c, Shift_log_out_time_formula__c, lastmodifieddate, Approved_Date__c, Type_of_Vehicle__c ' +
            'FROM Reimbursement__c ' +
            'WHERE Organisation_Name__c = :orgName ' +
            'AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c >= :sDate ' +
            'AND ShiftwithStaff__r.Add_Shift__r.Start_Date__c <= :eDate ';
        
        if (roleName == 'Portal Account Partner User') {
            query += 'AND ShiftwithStaff__r.Staff__r.Email_Address__c = :userEmail ';
        } else if (userType != 'NDIS Org Admin') {
            if (!facilityIdSet.isEmpty()) {
                query += 'AND ShiftwithStaff__r.Add_Shift__r.Facility__c IN :facilityIdSet ';
            } else {
                return new List<Reimbursement__c>();
            }
        }
        
        if (!String.isBlank(status) && status != 'All') {
            System.debug('status in getAllReimbursements in if '+status );
            query += 'AND Approval_Status__c = :status ';
        } else if (status == 'All'){
            query += 'AND (Approval_Status__c = \'Pending\' OR Approval_Status__c = \'Approved\' OR Approval_Status__c = \'Rejected\') ';
        }
        System.debug('status in getAllReimbursements outside if '+status );
        query += 'ORDER BY LastModifiedDate DESC';
        
        return Database.query(query);
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
    
    
    @AuraEnabled 
    public static List<ShiftwithStaff__c> PendingShifts1(String sdate, String edate) {
        String userEmail = UserInfo.getUserEmail(); 
        System.debug('sdate >> ' + sdate + ', edate >> ' + edate);
        
        Date startDate = Date.valueOf(sdate);
        Date endDate   = Date.valueOf(edate);
        
        List<ShiftwithStaff__c> shiftStaff = [
            SELECT Id, Staff__r.Email_Address__c, Staff__r.Facility__r.Name,
            Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c,
            Add_Shift__r.End_Date__c, Enable_Sign_In__c, Enable_Sign_Out__c,
            Type_of_shift__c, Shift_Type__c, Shift_Locations__c,
            Add_Shift__r.shift_Start_End_Time__c, Add_Shift__r.Role__c,
            Add_Shift__r.Start_time_Formula__c, Add_Shift_Notes__c,
            Add_Shift__r.Facility__r.Name, Add_Shift__r.End_time_formula__c,
            Facility_Names__c, Date__c, Start_time_Formula__c,
            End_time_formula__c, Role_formula__c, Duration__c,
            Add_Shift_Duration_hh_mm__c, CreatedById,
            Log_Out_Date_Time__c, Log_In_Date_Time__c, SignIn_Notes__c,
            (SELECT Id FROM Reimbursements__r),
            (SELECT Id, Client__r.Name__c FROM Services_and_Support_Plans__r),
            Status__c, Sleepover_shift__c, Sleepover_Night_Shift_hours__c
            //(SELECT Id, Break_Start_Time__c, Break_End_Time__c  
            // FROM Break_Timings__r 
            // WHERE Break_Start_Time__c != null AND Break_End_Time__c = null 
            // ORDER BY CreatedDate DESC LIMIT 1)
            FROM ShiftwithStaff__c
            WHERE Staff__r.Email_Address__c = :userEmail
            AND Add_Shift__r.Start_Date__c >= :startDate
            AND Add_Shift__r.Start_Date__c <= :endDate
            AND Attendence__c = true
        ];
        return shiftStaff;
        
        /*  String query = 'SELECT Id, Staff__r.Email_Address__c, Staff__r.Facility__r.Name, ' +
'Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c, ' +
'Add_Shift__r.End_Date__c, Enable_Sign_In__c, Enable_Sign_Out__c, ' +
'Type_of_shift__c, Shift_Type__c, Shift_Locations__c, ' +
'Add_Shift__r.shift_Start_End_Time__c, Add_Shift__r.Role__c, ' +
'Add_Shift__r.Start_time_Formula__c, Add_Shift_Notes__c, ' +
'Add_Shift__r.Facility__r.Name, Add_Shift__r.End_time_formula__c, ' +
'Facility_Names__c, Date__c, Start_time_Formula__c, End_time_formula__c, ' +
'Role_formula__c, Duration__c, Add_Shift_Duration_hh_mm__c, CreatedById, ' +
'Log_Out_Date_Time__c, Log_In_Date_Time__c, SignIn_Notes__c, ' +
'(SELECT Id FROM Reimbursements__r), ' +
'(SELECT Id, Client__r.Name__c FROM Services_and_Support_Plans__r), ' +
'Status__c, Sleepover_shift__c, Sleepover_Night_Shift_hours__c ' +
'FROM ShiftwithStaff__c ' +
'WHERE Staff__r.Email_Address__c = :userEmail ' +
'AND Add_Shift__r.Start_Date__c >= :startDate ' +
'AND Add_Shift__r.Start_Date__c <= :endDate ' +
'AND Attendence__c = true ';

// Optional status filter
if (!String.isBlank(status) && status != 'All') {
query += 'AND Status__c = :status ';
}

// Optional sorting
query += 'ORDER BY Add_Shift__r.Start_Date__c DESC';

System.debug('Final dynamic query >> ' + query);

return Database.query(query);*/
    }
    
}