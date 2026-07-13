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
         String query = 'SELECT Id, Name, ShiftwithStaff__c, Others__c, Comments__c, ShiftwithStaff__r.Staff__r.NameToDisplay__c,Mileage_Amount__c,ShiftwithStaff__r.Add_Shift__r.Facility__c,ShiftwithStaff__r.Staff__r.picture__c,Odo_Meter_Start__c,Odo_Meter_End__c,' +
            'Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c, Amount__c, Mileage_Others__c,Cost_per_KM__c,Total_Amount__c, Fuel_Electric_Price__c,Travel_End_Time_Formula__c,Travel_Start_Time_Formula__c,Multiple_Expenses__c,' +
            'Approval_user__c, Approver_Comments__c, ShiftDate__c, Shift_Login_time_formula__c, Shift_log_out_time_formula__c,lastmodifieddate,Approved_Date__c, Type_of_Vehicle__c,Activity_Transport_Vehicle__c,Transport_Method__c,Transport_Type__c,Submitted_Date__c ' +
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
        
        String query = 'SELECT Id, Name,Submitted_Date__c, ShiftwithStaff__c, Others__c, Comments__c, ShiftwithStaff__r.Staff__r.NameToDisplay__c, Mileage_Amount__c, ShiftwithStaff__r.Add_Shift__r.Facility__c, ShiftwithStaff__r.Staff__r.picture__c,Travel_End_Time_Formula__c,Travel_Start_Time_Formula__c, ' +
            'Amazon_file_URL__c, Shift_Login_Time__c, Shift_Logout_Time__c, Approval_Status__c, Amount__c, Mileage_Others__c, Cost_per_KM__c, Total_Amount__c, Fuel_Electric_Price__c,Transport_Type__c,Transport_Method__c,Travel_Start_Time__c,Travel_End_Time__c,Multiple_Expenses__c, ' +
            'Approval_user__c,Activity_Transport_Vehicle__c,Approver_Comments__c, ShiftDate__c, Shift_Login_time_formula__c,Odo_Meter_Start__c,Odo_Meter_End__c, Shift_log_out_time_formula__c, lastmodifieddate, Approved_Date__c, Type_of_Vehicle__c,ShiftwithStaff__r.Id ' +
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
     @AuraEnabled
    public static String getClientNameByShiftWithStaff(Id shiftWithStaffId) {

        if (shiftWithStaffId == null) {
            return null;
        }

        List<ShiftwithStaff__c> shiftList = [
            SELECT Id,
                   (
                       SELECT Client__c, Client__r.Name
                       FROM Services_and_Support_Plans__r
                       ORDER BY CreatedDate ASC
                       LIMIT 1
                   )
            FROM ShiftwithStaff__c
            WHERE Id = :shiftWithStaffId
            LIMIT 1
        ];

        if (shiftList.isEmpty()) {
            return null;
        }

        ShiftwithStaff__c shift = shiftList[0];

        if (shift.Services_and_Support_Plans__r == null ||
            shift.Services_and_Support_Plans__r.isEmpty()) {
            return null;
        }

        return shift.Services_and_Support_Plans__r[0].Client__r.Name;
    }

    @AuraEnabled
    public static List<ClientFundTrackerJN__c> getClientServiceItems(String clientId) {
       
        List<ClientFundTrackerJN__c> finalList = new List<ClientFundTrackerJN__c>();

      /*   if (String.isBlank(shiftStaffId)) {
            return finalList;
        }

        // 1️⃣ Get Client Id
        Services_and_Support_Plan__c service = [
            SELECT Client__c
            FROM Services_and_Support_Plan__c
            WHERE ShiftwithStaff__c = :shiftStaffId
            AND Un_Assigned_Service__c = false
            LIMIT 1
        ];

          System.debug('📌 Services Query Result: ' + service);

        if (service == null || service.Client__c == null) {
            return finalList;
        }

        Id clientId = service.Client__c;
       */    System.debug('✅ Client Id: ' + clientId);

        // 2️⃣ Get Junction + Catalogue
        List<ClientFundTrackerJN__c> records = [
            SELECT 
                Id,
                Participant__c,
                State__c,
                Amount__c,
                Service_Type__c,
                NDIS_Support_Catalogue__c,
                NDIS_Support_Catalogue__r.Support_Item_Name__c,
                NDIS_Support_Catalogue__r.Support_Item_Number__c,

                // ALL STATES
                NDIS_Support_Catalogue__r.ACT__c,
                NDIS_Support_Catalogue__r.NSW__c,
                NDIS_Support_Catalogue__r.QLD__c,
                NDIS_Support_Catalogue__r.VIC__c,
                NDIS_Support_Catalogue__r.WA__c,
                NDIS_Support_Catalogue__r.SA__c,
                NDIS_Support_Catalogue__r.TAS__c,
                NDIS_Support_Catalogue__r.NT__c,

                // OPTIONAL REGION
                NDIS_Support_Catalogue__r.Remote__c,
                NDIS_Support_Catalogue__r.Very_Remote__c

            FROM ClientFundTrackerJN__c
            WHERE Participant__c = :clientId
        ];

         System.debug('📌 Fund Records Before Fallback: ' + records);

        // 3️⃣ Apply fallback
        for (ClientFundTrackerJN__c rec : records) {

             System.debug('➡️ Processing Record Id: ' + rec.Id);
             System.debug('   State: ' + rec.State__c);
            System.debug('   Existing Amount: ' + rec.Amount__c);

            if (rec.Amount__c == null && rec.State__c != null && rec.NDIS_Support_Catalogue__r != null) {

                rec.Amount__c = getRateByState(rec.NDIS_Support_Catalogue__r, rec.State__c);
            }
        } 

        return records;
    }

    // 🔥 Centralized state logic
    private static Decimal getRateByState(NDIS_Support_Catalogue__c cat, String state) {

        if (state == 'ACT') return cat.ACT__c;
        if (state == 'NSW') return cat.NSW__c;
        if (state == 'QLD') return cat.QLD__c;
        if (state == 'VIC') return cat.VIC__c;
        if (state == 'WA') return cat.WA__c;
        if (state == 'SA') return cat.SA__c;
        if (state == 'TAS') return cat.TAS__c;
        if (state == 'NT') return cat.NT__c;

        // Optional regional override
        if (state == 'REMOTE') return cat.Remote__c;
        if (state == 'VERY_REMOTE') return cat.Very_Remote__c;

        return null;
    }

/* @AuraEnabled
public static void updateInvoiceAndReimbursementBulk(
    Id reimbursementId,
    List<Map<String, Object>> payloadList,
    String status,
    String comments
) {

    List<SObject> recordsToUpdate = new List<SObject>();

    // ================================
    // 🔁 LOOP SERVICES
    // ================================
    for (Map<String, Object> payload : payloadList) {

        Id servicePlanId = (Id) payload.get('servicePlanId');

        if (servicePlanId != null) {

            Services_and_Support_Plan__c serviceRec =
                new Services_and_Support_Plan__c(
                    Id = servicePlanId,
                    Reimbrusment_Support_item__c = (String) payload.get('transportserviceName'),
                    Reimbrusment_line_item__c = (String) payload.get('transportItemNumber'),
                    Reimbrusment_Quantity__c = (Decimal) payload.get('transportQty'),
                    Reimbrusment_Rate__c = (Decimal) payload.get('transportRate'),
                    Reimbrusment_Amount__c = (Decimal) payload.get('transportAmount')
                );

            recordsToUpdate.add(serviceRec);
        }
    }

    // ================================
    // 💳 UPDATE REIMBURSEMENT (ONCE)
    // ================================
    if (reimbursementId != null) {
        recordsToUpdate.add(new Reimbursement__c(
            Id = reimbursementId,
            Approval_Status__c = status,
            Approver_Comments__c = comments
        ));
    }

    // ================================
    // 🔥 SINGLE DML (BEST PRACTICE)
    // ================================
    if (!recordsToUpdate.isEmpty()) {
        update recordsToUpdate;
    }
} */

@AuraEnabled
public static void updateInvoiceAndReimbursementBulk(
    Id reimbursementId,
    List<Map<String, Object>> payloadList,
    String status,
    String comments
) {

    // ================================
    // 📦 CHILD RECORDS (MULTIPLE)
    // ================================
    List<Participant_Reimbrusement__c> childRecords = new List<Participant_Reimbrusement__c>();

    for (Map<String, Object> payload : payloadList) {

        Id servicePlanId = (Id) payload.get('servicePlanId');

        if (servicePlanId != null) {

            Participant_Reimbrusement__c rec = new Participant_Reimbrusement__c();

            // 🔗 Lookup
            rec.Services_and_Support_Plan__c = servicePlanId;
            // 💰 Fields
            rec.Reimbrusment_Support_item__c = (String) payload.get('transportserviceName');
            rec.Reimbrusment_line_item__c   = (String) payload.get('transportItemNumber');
            rec.Reimbrusment_Quantity__c    = (Decimal) payload.get('transportQty');
            rec.Reimbrusment_Rate__c        = (Decimal) payload.get('transportRate');
            rec.Reimbrusement_Amount__c     = (Decimal) payload.get('transportAmount');
            rec.Reimbrusement_Id__c = reimbursementId;
            childRecords.add(rec);
        }
    }

   

    // ================================
    // 🚀 INSERT NEW CHILD RECORDS
    // ================================
    if (!childRecords.isEmpty()) {
        insert childRecords;
    }

    // ================================
    // 💳 UPDATE MAIN REIMBURSEMENT
    // ================================
    if (reimbursementId != null) {
        update new Reimbursement__c(
            Id = reimbursementId,
            Approval_Status__c = status,
            Approver_Comments__c = comments
        );
    }
}

@AuraEnabled
public static List<Participant_Reimbrusement__c> getChildRows(List<Id> serviceIds, String reimbursementId) {

if (String.isNotBlank(reimbursementId)) {
    return [
        SELECT Id,

              
               Services_and_Support_Plan__r.Support_Item_Name__c,
               Services_and_Support_Plan__r.Client__r.Name,
               Reimbrusment_Support_item__c,
               Reimbrusment_line_item__c,
               Reimbrusment_Quantity__c,
               Reimbrusment_Rate__c,
               Reimbrusement_Amount__c

        FROM Participant_Reimbrusement__c
        WHERE Services_and_Support_Plan__c IN :serviceIds AND Reimbrusement_Id__c = :reimbursementId
    ];
}else{
    return [
        SELECT Id,

              
               Services_and_Support_Plan__r.Support_Item_Name__c,
               Services_and_Support_Plan__r.Client__r.Name,
               Reimbrusment_Support_item__c,
               Reimbrusment_line_item__c,
               Reimbrusment_Quantity__c,
               Reimbrusment_Rate__c,
               Reimbrusement_Amount__c

        FROM Participant_Reimbrusement__c
        WHERE Services_and_Support_Plan__c IN :serviceIds
        ];

}
}
    
}