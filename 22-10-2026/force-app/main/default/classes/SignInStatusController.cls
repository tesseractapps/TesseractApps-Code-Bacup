public class SignInStatusController {    
    @AuraEnabled
    public static Map<String, Integer> getSignInCounts(String userId, Id facilityId) {
        String currentUserId = UserInfo.getUserId();        
        User userRecord = [SELECT Id, Name,Email,Organization_Name__c,User_Type__c FROM User WHERE Id = :currentUserId LIMIT 1];
        system.debug('userRecord.Organization_Name__c===>'+userRecord.Organization_Name__c);
        
        Staff__c StaffRecord = [Select Id, Email_Address__c From Staff__c Where Email_Address__c =:userRecord.Email LIMIT 1];
        
        Map<String, Integer> signInCounts = new Map<String, Integer>();

        try {
            if(userRecord.User_Type__c == 'NDIS Staff'){
            // Example: Count Sign-Ins based on userId
            Integer completedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Add_Shift__r.Facility__c =: facilityId AND Status__c = 'Completed' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY AND Staff__c =: StaffRecord.Id];
            Integer inProgressCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Add_Shift__r.Facility__c =: facilityId AND Status__c = 'InProgress' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY AND Staff__c =: StaffRecord.Id];
            Integer acceptedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Add_Shift__r.Facility__c =: facilityId AND Status__c = 'Accepted' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY AND Staff__c =: StaffRecord.Id];
            

            signInCounts.put('completedCount', completedCount);
            signInCounts.put('inprogressCount', inProgressCount);
            signInCounts.put('acceptedCount', acceptedCount);
            }  else {
            Integer completedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Add_Shift__r.Facility__c =: facilityId AND Status__c = 'Completed' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY];
            Integer inProgressCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Add_Shift__r.Facility__c =: facilityId AND Status__c = 'InProgress' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY];
            Integer acceptedCount = [SELECT COUNT() FROM ShiftwithStaff__c WHERE Add_Shift__r.Facility__c =: facilityId AND Status__c = 'Accepted' AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c And Date__c  = TODAY];
            

            signInCounts.put('completedCount', completedCount);
            signInCounts.put('inprogressCount', inProgressCount);
            signInCounts.put('acceptedCount', acceptedCount);
            }
            
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving sign-in counts: ' + e.getMessage());
            
            
                
        }
        
        return signInCounts;
    }

    @AuraEnabled
    public static List<SignInStaffWrapper> getSignInStaffDetails(String status, Id facilityId, String filterStartDate, String filterEndDate, String dateRange) {

        User userRecord = [
            SELECT Id, Email, Organization_Name__c, User_Type__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Date startD = parseDate(filterStartDate);
        Date endD = parseDate(filterEndDate);
        Date todayDate = Date.today();

        if (startD == null || endD == null) {
            if (String.isNotBlank(dateRange)) {
                if (dateRange == 'TODAY') {
                    startD = todayDate;
                    endD = todayDate;
                } else if (dateRange == 'YESTERDAY') {
                    startD = todayDate.addDays(-1);
                    endD = todayDate.addDays(-1);
                } else if (dateRange == 'LAST_7_DAYS') {
                    startD = todayDate.addDays(-6);
                    endD = todayDate;
                } else if (dateRange == 'LAST_30_DAYS') {
                    startD = todayDate.addDays(-29);
                    endD = todayDate;
                } else if (dateRange == 'THIS_MONTH') {
                    startD = todayDate.toStartOfMonth();
                    Integer daysInMonth = Date.daysInMonth(todayDate.year(), todayDate.month());
                    endD = Date.newInstance(todayDate.year(), todayDate.month(), daysInMonth);
                } else if (dateRange == 'LAST_MONTH') {
                    Date lastMonth = todayDate.addMonths(-1);
                    startD = lastMonth.toStartOfMonth();
                    Integer daysInMonth = Date.daysInMonth(lastMonth.year(), lastMonth.month());
                    endD = Date.newInstance(lastMonth.year(), lastMonth.month(), daysInMonth);
                } else if (dateRange == 'LAST_3_MONTHS') {
                    startD = todayDate.addMonths(-2).toStartOfMonth();
                    endD = todayDate;
                } else if (dateRange == 'LAST_6_MONTHS') {
                    startD = todayDate.addMonths(-5).toStartOfMonth();
                    endD = todayDate;
                } else if (dateRange == 'THIS_YEAR') {
                    startD = Date.newInstance(todayDate.year(), 1, 1);
                    endD = Date.newInstance(todayDate.year(), 12, 31);
                } else if (dateRange == 'CUSTOM') {
                    startD = parseDate(filterStartDate);
                    endD = parseDate(filterEndDate);
                }
            }
        }

        if (startD == null) {
            startD = todayDate;
        }
        if (endD == null) {
            endD = todayDate;
        }
        if (startD > endD) {
            Date temp = startD;
            startD = endD;
            endD = temp;
        }

        List<ShiftwithStaff__c> shifts;
        Boolean hasFacility = (facilityId != null);
        Boolean hasOrg = String.isNotBlank(userRecord.Organization_Name__c);
        String orgName = userRecord.Organization_Name__c;

        if (userRecord.User_Type__c == 'NDIS Staff') {

            List<Staff__c> staffList = [
                SELECT Id
                FROM Staff__c
                WHERE Email_Address__c = :userRecord.Email
                LIMIT 1
            ];

            if (!staffList.isEmpty()) {
                Id staffRecId = staffList[0].Id;
                if (hasFacility && hasOrg) {
                    shifts = [
                        SELECT
                            Id,
                            Staff__c,
                            Staff__r.NameToDisplay__c,
                            Shift_Category__c,
                            Shift_Start_End_Time__c,
                            End_time_Formula__c,
                            Login_Time_Formula__c,
                            Logout_Time_Formula__c
                        FROM ShiftwithStaff__c
                        WHERE Status__c = :status
                        AND Date__c >= :startD AND Date__c <= :endD
                        AND ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId))
                        AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName
                        AND Staff__c = :staffRecId
                        ORDER BY Date__c DESC, Shift_Start_End_Time__c ASC
                    ];
                } else if (hasFacility) {
                    shifts = [
                        SELECT
                            Id,
                            Staff__c,
                            Staff__r.NameToDisplay__c,
                            Shift_Category__c,
                            Shift_Start_End_Time__c,
                            End_time_Formula__c,
                            Login_Time_Formula__c,
                            Logout_Time_Formula__c
                        FROM ShiftwithStaff__c
                        WHERE Status__c = :status
                        AND Date__c >= :startD AND Date__c <= :endD
                        AND ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId))
                        AND Staff__c = :staffRecId
                        ORDER BY Date__c DESC, Shift_Start_End_Time__c ASC
                    ];
                } else if (hasOrg) {
                    shifts = [
                        SELECT
                            Id,
                            Staff__c,
                            Staff__r.NameToDisplay__c,
                            Shift_Category__c,
                            Shift_Start_End_Time__c,
                            End_time_Formula__c,
                            Login_Time_Formula__c,
                            Logout_Time_Formula__c
                        FROM ShiftwithStaff__c
                        WHERE Status__c = :status
                        AND Date__c >= :startD AND Date__c <= :endD
                        AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName
                        AND Staff__c = :staffRecId
                        ORDER BY Date__c DESC, Shift_Start_End_Time__c ASC
                    ];
                } else {
                    shifts = [
                        SELECT
                            Id,
                            Staff__c,
                            Staff__r.NameToDisplay__c,
                            Shift_Category__c,
                            Shift_Start_End_Time__c,
                            End_time_Formula__c,
                            Login_Time_Formula__c,
                            Logout_Time_Formula__c
                        FROM ShiftwithStaff__c
                        WHERE Status__c = :status
                        AND Date__c >= :startD AND Date__c <= :endD
                        AND Staff__c = :staffRecId
                        ORDER BY Date__c DESC, Shift_Start_End_Time__c ASC
                    ];
                }
            } else {
                shifts = new List<ShiftwithStaff__c>();
            }

        } else {
            if (hasFacility && hasOrg) {
                shifts = [
                    SELECT
                        Id,
                        Staff__c,
                        Staff__r.NameToDisplay__c,
                        Shift_Category__c,
                        Shift_Start_End_Time__c,
                        End_time_Formula__c,
                        Login_Time_Formula__c,
                        Logout_Time_Formula__c
                    FROM ShiftwithStaff__c
                    WHERE Status__c = :status
                    AND Date__c >= :startD AND Date__c <= :endD
                    AND ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId))
                    AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName
                    ORDER BY Date__c DESC, Shift_Start_End_Time__c ASC
                ];
            } else if (hasFacility) {
                shifts = [
                    SELECT
                        Id,
                        Staff__c,
                        Staff__r.NameToDisplay__c,
                        Shift_Category__c,
                        Shift_Start_End_Time__c,
                        End_time_Formula__c,
                        Login_Time_Formula__c,
                        Logout_Time_Formula__c
                    FROM ShiftwithStaff__c
                    WHERE Status__c = :status
                    AND Date__c >= :startD AND Date__c <= :endD
                    AND ((Shift_Facility__c != NULL AND Shift_Facility__c = :facilityId) OR (Shift_Facility__c = NULL AND Add_Shift__r.Facility__c = :facilityId))
                    ORDER BY Date__c DESC, Shift_Start_End_Time__c ASC
                ];
            } else if (hasOrg) {
                shifts = [
                    SELECT
                        Id,
                        Staff__c,
                        Staff__r.NameToDisplay__c,
                        Shift_Category__c,
                        Shift_Start_End_Time__c,
                        End_time_Formula__c,
                        Login_Time_Formula__c,
                        Logout_Time_Formula__c
                    FROM ShiftwithStaff__c
                    WHERE Status__c = :status
                    AND Date__c >= :startD AND Date__c <= :endD
                    AND Add_Shift__r.Facility__r.Organisation__r.Name = :orgName
                    ORDER BY Date__c DESC, Shift_Start_End_Time__c ASC
                ];
            } else {
                shifts = [
                    SELECT
                        Id,
                        Staff__c,
                        Staff__r.NameToDisplay__c,
                        Shift_Category__c,
                        Shift_Start_End_Time__c,
                        End_time_Formula__c,
                        Login_Time_Formula__c,
                        Logout_Time_Formula__c
                    FROM ShiftwithStaff__c
                    WHERE Status__c = :status
                    AND Date__c >= :startD AND Date__c <= :endD
                    ORDER BY Date__c DESC, Shift_Start_End_Time__c ASC
                ];
            }
        }

        List<SignInStaffWrapper> result = new List<SignInStaffWrapper>();

        for (ShiftwithStaff__c shift : shifts) {

            SignInStaffWrapper wrapper = new SignInStaffWrapper();

            wrapper.Id = shift.Id != null ? shift.Id : shift.Staff__c;
            wrapper.name = shift.Staff__r.NameToDisplay__c;
            wrapper.shiftType = shift.Shift_Category__c;
            wrapper.startTime = shift.Shift_Start_End_Time__c;
            wrapper.endTime = buildShiftTime(shift.Login_Time_Formula__c, shift.Logout_Time_Formula__c);

            result.add(wrapper);
        }

        return result;
    }

    public static String buildShiftTime(String loginTime, String logoutTime) {
        Boolean loginValid = String.isNotBlank(loginTime) && loginTime != 'null';
        Boolean logoutValid = String.isNotBlank(logoutTime) && logoutTime != 'null';

        if (loginValid && logoutValid) {
            return loginTime + ' - ' + logoutTime;
        } else if (loginValid) {
            return loginTime;
        } else if (logoutValid) {
            return logoutTime;
        }
        return '';
    }

    public class SignInStaffWrapper {
        @AuraEnabled public Id Id;
        @AuraEnabled public String name;
        @AuraEnabled public String shiftType;
        @AuraEnabled public String startTime;
        @AuraEnabled public String endTime;
    }
    public static Date parseDate(String dateStr) {
        if (String.isBlank(dateStr)) {
            return null;
        }
        try {
            String clean = dateStr.trim();
            if (clean.startsWith('"') && clean.endsWith('"') && clean.length() > 1) {
                clean = clean.substring(1, clean.length() - 1);
            }
            if (clean.contains('T')) {
                clean = clean.substringBefore('T');
            } else if (clean.contains(' ')) {
                clean = clean.substringBefore(' ');
            }
            clean = clean.trim();
            
            // Format: YYYY-MM-DD
            if (Pattern.matches('\\d{4}-\\d{1,2}-\\d{1,2}', clean)) {
                List<String> parts = clean.split('-');
                return Date.newInstance(Integer.valueOf(parts[0]), Integer.valueOf(parts[1]), Integer.valueOf(parts[2]));
            }
            // Format: YYYY/MM/DD
            if (Pattern.matches('\\d{4}/\\d{1,2}/\\d{1,2}', clean)) {
                List<String> parts = clean.split('/');
                return Date.newInstance(Integer.valueOf(parts[0]), Integer.valueOf(parts[1]), Integer.valueOf(parts[2]));
            }
            // Format: DD/MM/YYYY
            if (Pattern.matches('\\d{1,2}/\\d{1,2}/\\d{4}', clean)) {
                List<String> parts = clean.split('/');
                return Date.newInstance(Integer.valueOf(parts[2]), Integer.valueOf(parts[1]), Integer.valueOf(parts[0]));
            }
            // Format: DD-MM-YYYY
            if (Pattern.matches('\\d{1,2}-\\d{1,2}-\\d{4}', clean)) {
                List<String> parts = clean.split('-');
                return Date.newInstance(Integer.valueOf(parts[2]), Integer.valueOf(parts[1]), Integer.valueOf(parts[0]));
            }
            
            return Date.valueOf(clean);
        } catch (Exception e) {
            System.debug('Failed to parse date string: ' + dateStr + ', error: ' + e.getMessage());
            return null;
        }
    }
    

}