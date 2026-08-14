public without sharing class LeaveController {
    // test class for this controller is available in serviceandsupporthandlertest
    @AuraEnabled
    public static List<Leave__c> getLeaves(Id recordId, string OrgId) {
        System.debug('recordid' +recordId);
        // return [SELECT Id, Type_of_Leave__c, From__c, To__c, Reason__c,Status__c,Leave_Document__c,Duration__c,Comments__c,Annual_Used__c,Approved_by__c,Leave_Duration__c,paid__c,unpaid__c FROM Leave__c where 	Staff__c  =: recordId AND Staff__r.Facility__r.Organisation__c  =: orgId];       
        return [SELECT Id, Leave_UID__c, Type_of_Leave__c, From__c, To__c, Reason__c,Status__c,Leave_Document__c,Duration__c,Comments__c,Annual_Used__c,Approved_by__c,Leave_Duration__c,paid__c,unpaid__c FROM Leave__c where 	Staff__c  =: recordId AND Staff__r.Facility__r.Organisation__c  =: orgId];       
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Leave__c> getLeavesByOrg(string orgId, Date startDate, Date endDate){
       System.debug('orgid' +orgId);
        System.debug('startdate' +startDate);
        System.debug('enddate' +endDate);
      try {  
    //   List<Leave__c> leaves =[SELECT Id,Type_of_Leave__c,Staff__c,From__c, To__c, Reason__c,Status__c,Leave_Document__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Staff__r.Facility__c,
      List<Leave__c> leaves =[SELECT Id,Leave_UID__c,Type_of_Leave__c,Staff__c,From__c, To__c, Reason__c,Status__c,Leave_Document__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Staff__r.Facility__c,
                Duration__c,Approved_by__c,Comments__c,Duration_Type__c FROM Leave__c
                where 	Staff__r.Facility__r.Organisation__c  =: orgId  AND From__c >= :startDate 
          AND To__c <= :endDate];
          system.debug('leaves'+leaves);
          return leaves;
         }catch (Exception e) {
            System.debug('An error occurred while fetching leaves by organization: ' + e.getMessage());
            throw new AuraHandledException('An error occurred while fetching leaves by organization. Please try again later.');
        } 
    }
   @AuraEnabled(cacheable=true)
    public static List<Public_Holiday__c> getHolidayCount(Date startDate, Date endDate, String state) {
        System.debug(' Start Date>> '+startDate);
        System.debug(' end  Date>> '+endDate);
        System.debug(' state >> '+state);
        //Date currentDate;
        
        // Query to fetch public holidays based on date range and state
        List<Public_Holiday__c> publicHolidays = [
            SELECT Date__c, Holiday_Name__c, State__c
            FROM Public_Holiday__c
            WHERE Date__c >= :startDate
            AND Date__c <= :endDate
           AND State__c INCLUDES (:state) // Include holidays with no specific state
        ];
       /* List<Public_Holiday__c> weekendHolidays = new List<Public_Holiday__c>();
        for(Public_Holiday__c holiday: publicHolidays){
            if (holiday.Date__c != null) {
              Integer dayOfWeek = holiday.Date__c.toStartOfWeek().daysBetween(holiday.Date__c) + 1;
              if (dayOfWeek == 6 || dayOfWeek == 7) { // 6 = Saturday, 7 = Sunday
                weekendHolidays.add(holiday);
              }  
            }
            System.debug('weekendHolidays'+ weekendHolidays.size());
        } */                                                                  
        return publicHolidays;
    }
    
    @AuraEnabled(cacheable=true)
   /* public static List<Public_Holiday__c> getHolidayList(String state) {
        return [SELECT Id, Holiday_Name__c, Date__c FROM Public_Holiday__c WHERE State__c INCLUDES (:state) ORDER BY Date__c ASC];
    }*/
    
    public static List<Public_Holiday__c> getHolidayList(String state, String financialYear) {
    // Determine start and end dates based on financialYear
    Date startDate;
    Date endDate;

    if (financialYear != null && financialYear.contains('-')) {
        String[] years = financialYear.split('-');
        Integer startYear = Integer.valueOf(years[0]);
        Integer endYear = Integer.valueOf(years[1]);

        startDate = Date.newInstance(startYear, 7, 1); // July 1st of the start year
        System.debug('start date >> '+startDate);
        endDate = Date.newInstance(endYear, 6, 30);   // June 30th of the end year
    } else {
        throw new AuraHandledException('Invalid financial year format');
    }

    // Fetch holidays based on state and financial year date range
    return [
        SELECT Id, Holiday_Name__c, Date__c
        FROM Public_Holiday__c
        WHERE State__c INCLUDES (:state)
        AND Date__c >= :startDate
        AND Date__c <= :endDate
        ORDER BY Date__c ASC
    ];
}
     @AuraEnabled
    public static List<Public_Holiday__c> holidayListbyOrg(string datePicker, string state){
         Date startDate = Date.valueOf(datePicker) -30 ;
         Date endDate = Date.valueOf(datePicker)+30;
        System.debug('date'+datePicker);
        System.debug('state'+state);
        List<Public_Holiday__c> holidayList=LeaveController.getHolidayCount(startDate, endDate, AddShiftHandler.getStateFullForm(state));
        return holidayList;
    }
    
	@AuraEnabled
    public static List<Leave__c> getApprovedLeaves(String datePicker, String staffId) {
        Date startDate = Date.valueOf(datePicker).addDays(-30);
        Date endDate = Date.valueOf(datePicker).addDays(30);
    
        System.debug('📅 Fetching leaves from ' + startDate + ' to ' + endDate);
        System.debug('👤 For staff: ' + staffId);
    
        return [
            SELECT Id, From__c,To__c, Type_of_Leave__c, Status__c
            FROM Leave__c
            WHERE Status__c = 'Approved'
            AND Staff__c = :staffId
            AND (
            	(From__c <= :endDate AND To__c >= :startDate)
        	)
        ];
    }
    
    
     @AuraEnabled
    public static void updateLeaveStatus(Id leaveId, String statusValue, String cancelComments) {

        if (leaveId == null || String.isBlank(statusValue)) {
            throw new AuraHandledException('Invalid input parameters.');
        }

        Leave__c leaveRec = [
             SELECT Id, Staff__c, From__c,To__c, Type_of_Leave__c, Status__c,Cancelled_Comments__c
            FROM Leave__c
            WHERE Id = :leaveId
            LIMIT 1
        ];

        leaveRec.Status__c = statusValue;
        leaveRec.Cancelled_Comments__c = cancelComments;
        
        update leaveRec;

        // manendra added Auto clear notifications when leave becomes non-actionable
if (
    statusValue == 'Cancelled' ||
    statusValue == 'Withdraw' ||
    statusValue == 'Rejected'
) {

    List<Notifications__c> notificationsToUpdate = [

        SELECT Id,
               Is_Read__c,
               Staff__c,
               Record_Id__c

        FROM Notifications__c

        WHERE Record_Id__c = :String.valueOf(leaveId)
        AND Module__c = 'Leave Management'
        AND Is_Read__c = false
    ];

    if (!notificationsToUpdate.isEmpty()) {

        for (Notifications__c ntf : notificationsToUpdate) {

            ntf.Is_Read__c = true;
        }

        update notificationsToUpdate;

        // Publish realtime event to remove badge instantly
        List<Notification_Event__e> events =
            new List<Notification_Event__e>();

        for (Notifications__c ntf : notificationsToUpdate) {

            events.add(

                new Notification_Event__e(

                    Staff_Id__c =
                        String.valueOf(ntf.Staff__c),

                    Record_Id__c =
                        ntf.Record_Id__c,

                    Module__c =
                        'Leave Management',

                    Type__c =
                        'READ'
                )
            );
        }

        EventBus.publish(events);
    }
}//end
 
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Leave__c>  getLeavesByUserRole(string orgId, Date startDate, Date endDate) {
    
        /* =========================================================
           1️⃣ Get Logged-in User
           ========================================================= */
        User currentUser = [
            SELECT Id, Email, UserRole.Name,User_Type__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
    
        /* =========================================================
           2️⃣ Identify ORG ADMIN
           ========================================================= */
        Boolean isOrgAdmin = false;
         if (currentUser.User_Type__c != null) {
            isOrgAdmin =
                currentUser.User_Type__c == 'NDIS Org Admin' || currentUser.User_Type__c == 'HR Admin' || currentUser.User_Type__c == 'ICT Admin';
                
        }
    
        /* =========================================================
           3️⃣ Get Logged-in Staff (via Email)
           ========================================================= */
        List<Staff__c> loggedStaffList = [
            SELECT Id
            FROM Staff__c
            WHERE Email_Address__c = :currentUser.Email
            LIMIT 1
        ];
    
        
    
        Id loggedInStaffId = loggedStaffList[0].Id;
    
        /* =========================================================
           4️⃣ SINGLE STATIC QUERY (NO DUPLICATION)
           ========================================================= */
        // List<Leave__c> leaves =[SELECT Id,Type_of_Leave__c,Staff__c,From__c,Staff__r.Manager__c, To__c, Reason__c,Status__c,Leave_Document__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Staff__r.Facility__c,
        List<Leave__c> leaves =[SELECT Id,Leave_UID__c,Type_of_Leave__c,Staff__c,From__c,Staff__r.Manager__c, To__c, Reason__c,Status__c,Leave_Document__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Staff__r.Facility__c,
                    Duration__c,Approved_by__c,Comments__c,Duration_Type__c,Leave_Duration__c FROM Leave__c
                    where 	Staff__r.Facility__r.Organisation__c  =: orgId  AND leave_applied_date__c >= :startDate 
              AND leave_applied_date__c <= :endDate ORDER BY CreatedDate DESC];
    
        /* =========================================================
           5️⃣ APPLY MANAGER FILTER ONLY IF NOT ORG ADMIN
           ========================================================= */
        if (isOrgAdmin) {
            return leaves;
        }else{
            List<Leave__c> managedleaves = new List<Leave__c>();
        for (Leave__c s : leaves) {
            if (s.Staff__r.Manager__c == loggedInStaffId) {
                managedleaves.add(s);
            }
        }
    
        return managedleaves;
        }
         
    
        
    }

//     @AuraEnabled
// public static Leave__c getLeaveById(Id leaveId) {
//     return [
//         SELECT Id, From__c
//         FROM Leave__c
//         WHERE Id = :leaveId
//         LIMIT 1
//     ];
// }        

    @AuraEnabled
    public static List<Leave__c> getLeaveById(String recordId, String leaveId) {
        String targetId = String.isNotBlank(recordId) ? recordId : leaveId;
        Id validId;
        try { validId = (Id) targetId; } catch (Exception e) { validId = null; }
        return [
            SELECT Id, Leave_UID__c, Type_of_Leave__c, From__c, To__c, Reason__c, Status__c, Leave_Document__c, Duration__c, Comments__c, Annual_Used__c, Approved_by__c, Leave_Duration__c, paid__c, unpaid__c, Staff__c, Duration_Type__c, Staff__r.Manager__c, Staff__r.Display_Nickname__c
            FROM Leave__c
            WHERE (Id = :validId OR Leave_UID__c = :targetId)
            LIMIT 1
        ];
    }     
 


    @AuraEnabled
    public static void sendLeaveNotification(Id leaveId) {
        try {
            User currentUser = [SELECT Id, Email FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1 ];

            List<Staff__c> loggedStaffList = [
                SELECT Id,Name, Manager__c FROM Staff__c  WHERE Email_Address__c =:currentUser.Email LIMIT 1];

            if (loggedStaffList.isEmpty()) {
                return;
            }
            Staff__c loggedInStaff =
                loggedStaffList[0];

                // Leave__c leaveRec = [SELECT Id,Staff__r.Name,From__c,To__c FROM Leave__c WHERE Id = :leaveId LIMIT 1 ];
                Leave__c leaveRec = [
                    SELECT Id,
                        Staff__c,
                        Staff__r.Name,
                        Staff__r.NameToDisplay__c,
                        Staff__r.Facility__c,
                        Staff__r.Facility__r.Name,
                        From__c,
                        To__c
                    FROM Leave__c
                    WHERE Id = :leaveId
                    LIMIT 1
                ];

            String fromDate = '';
            String toDate = '';

            if (leaveRec.From__c != null) {
                DateTime fromDt = DateTime.newInstance(
                    leaveRec.From__c,
                    Time.newInstance(0, 0, 0, 0)
                );
                fromDate = fromDt.format('dd/MM/yyyy');
            }

            if (leaveRec.To__c != null) {
                DateTime toDt = DateTime.newInstance(
                    leaveRec.To__c,
                    Time.newInstance(0, 0, 0, 0)
                );
                toDate = toDt.format('dd/MM/yyyy');
            }
            Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>(
                [
                    SELECT Id,
                        (
                            SELECT Id,
                                Facility__c,
                                Facility__r.Name,
                                Active__c
                            FROM Staff_Facilities__r
                            WHERE Active__c = true
                        )
                    FROM Staff__c
                    WHERE Id = :leaveRec.Staff__c
                ]
            );
            Staff__c staffRec = staffMap.get(leaveRec.Staff__c);
            String activeFacilityName = '';
            Id activeFacilityId = null;
            if (staffRec != null &&
                staffRec.Staff_Facilities__r != null &&
                !staffRec.Staff_Facilities__r.isEmpty()) {
                Staff_Facility__c sf = staffRec.Staff_Facilities__r[0];
                activeFacilityId = sf.Facility__c;
                activeFacilityName = sf.Facility__r.Name;
            }
            Set<Id> targetStaffIds =
                new Set<Id>();
          /*   targetStaffIds.add(
                loggedInStaff.Id
            ); */

            if (!String.isBlank(
                loggedInStaff.Manager__c
            )) {
                targetStaffIds.add(
                    loggedInStaff.Manager__c
                );
            }

            System.debug(
                'TARGET STAFF IDS => ' +
                targetStaffIds
            );

            List<Notifications__c>
                notifications =
                    new List<Notifications__c>();

            List<Notification_Event__e>
                events =
                    new List<Notification_Event__e>();

            for (Id staffId : targetStaffIds) {


                Notifications__c notification =
                    new Notifications__c();

                notification.Staff__c =
                    staffId;

                notification.Title__c =
                    'Leave Submitted';

                //notification.Message__c = leaveRec.Staff__r.NameToDisplay__c + ' requested for leave from ' + String.valueOf(leaveRec.From__c) + ' to ' + String.valueOf(leaveRec.To__c);
                notification.Message__c = leaveRec.Staff__r.NameToDisplay__c +
                    ' requested for leave from ' +
                    fromDate +
                    ' to ' +
                    toDate;
                notification.Module__c =
                    'Leave Management';

                notification.Type__c =
                    'Info';

                notification.Record_Id__c =
                    leaveRec.Id;
                // notification.Facility__c =  leaveRec.Staff__r.Facility__c;
                notification.Facility__c = activeFacilityId;
                notification.Is_Read__c =   false;

                notifications.add(
                    notification
                );


                Notification_Event__e eventObj =

                    new Notification_Event__e(

                        Staff_Id__c =
                            String.valueOf(
                                staffId
                            ),

                        Title__c =
                            'Leave Submitted',

                   // Message__c = leaveRec.Staff__r.NameToDisplay__c + ' requested for leave from ' + String.valueOf(leaveRec.From__c) + ' to ' + String.valueOf(leaveRec.To__c),
                      Message__c = leaveRec.Staff__r.NameToDisplay__c +  ' requested for leave from ' +  fromDate +  ' to ' + toDate,
                        Module__c =
                            'Leave Management',

                        Type__c =
                            'Info',

                        Record_Id__c =
                            String.valueOf(
                                leaveRec.Id
                            ),
                            // Facility_Name__c = leaveRec.Staff__r.Facility__r.Name
                            Facility_Name__c = activeFacilityName
                    );

                events.add(eventObj);
            }

            if (!notifications.isEmpty()) {

                insert notifications;
            }


            if (!events.isEmpty()) {

                List<Database.SaveResult>
                    publishResults =

                        EventBus.publish(
                            events
                        );

                for (
                    Integer i = 0;
                    i < publishResults.size();
                    i++
                ) {

                    Database.SaveResult sr =
                        publishResults[i];

                    if (sr.isSuccess()) {

                        System.debug(
                            'Platform Event Published => ' +
                            i
                        );

                    } else {

                        for (
                            Database.Error err :
                            sr.getErrors()
                        ) {

                            System.debug(
                                'Platform Event Failed => ' +
                                err.getMessage()
                            );
                        }
                    }
                }
            }

        } catch (Exception e) {

            throw new AuraHandledException(

                'Notification Error: ' +

                e.getMessage()
            );
        }
    }

    

    public class DailyLeaveWrapper {
        @AuraEnabled public Date leaveDate;
        @AuraEnabled public Decimal unavailablePercentage;
        @AuraEnabled public Integer approvedLeaveCount;
        @AuraEnabled public Integer totalUnavailable;
        @AuraEnabled public List<String> staffNames = new List<String>();
    }

    @AuraEnabled
    public static List<DailyLeaveWrapper> validateLeaveThreshold(Date fromDate, Date toDate, Id facilityId) {

        System.debug('=== validateLeaveThreshold START ===');
        System.debug('From Date: ' + fromDate);
        System.debug('To Date: ' + toDate);
        System.debug('Facility Id: ' + facilityId);


        List<DailyLeaveWrapper> response = new List<DailyLeaveWrapper>();
        Decimal threshold = 30;

        // Total Active Staff in Facility
        Integer totalStaff = [ SELECT COUNT() FROM Staff__c WHERE Status__c = true AND Id IN (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c = :facilityId)];
        System.debug('Total Active Staff: ' + totalStaff);
        if (totalStaff == 0) {
             System.debug('No active staff found. Returning empty response.');
            return response;
        }

        for (Date currentDate = fromDate; currentDate <= toDate; currentDate = currentDate.addDays(1)) {

              System.debug('----------------------------------------');
              System.debug('Checking Date: ' + currentDate);

            List<Leave__c> approvedLeaves = [ SELECT Id, Staff__c, Staff__r.Display_Nickname__c, From__c, To__c FROM Leave__c WHERE Status__c = 'Approved' AND From__c <= :currentDate 
            AND To__c >= :currentDate AND Staff__c IN (SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__c = :facilityId)
            ];

            Integer approvedCount = approvedLeaves.size();

            // Include current leave request
            Integer totalUnavailable = approvedCount + 1;

            Decimal percentage =((Decimal)totalUnavailable / totalStaff) * 100;

            if (percentage >= threshold) {

                DailyLeaveWrapper wrapper = new DailyLeaveWrapper();
                wrapper.leaveDate = currentDate;
                wrapper.approvedLeaveCount = approvedCount;
                wrapper.totalUnavailable = totalUnavailable;
                wrapper.unavailablePercentage = percentage.setScale(2);

                for (Leave__c leaveRec : approvedLeaves) {
                    wrapper.staffNames.add(leaveRec.Staff__r.Display_Nickname__c);
                }

                response.add(wrapper);
                System.debug('Wrapper Added for Date: ' + currentDate);
            }
        }

        System.debug('========================================');
        System.debug('Total Days Returned: ' + response.size());
        System.debug('Response: ' + JSON.serializePretty(response));
        System.debug('=== validateLeaveThreshold END ===');

        return response;
    }

}