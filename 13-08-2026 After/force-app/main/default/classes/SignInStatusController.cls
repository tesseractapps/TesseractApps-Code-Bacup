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
    public static List<SignInStaffWrapper> getSignInStaffDetails(String status, Id facilityId) {

        User userRecord = [
            SELECT Id, Email, Organization_Name__c, User_Type__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        List<ShiftwithStaff__c> shifts;

        if (userRecord.User_Type__c == 'NDIS Staff') {

            Staff__c currentStaff = [
                SELECT Id
                FROM Staff__c
                WHERE Email_Address__c = :userRecord.Email
                LIMIT 1
            ];

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
                AND Date__c = TODAY
                AND Add_Shift__r.Facility__c = :facilityId
                AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c
                AND Staff__c = :currentStaff.Id
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
                AND Date__c = TODAY
                AND Add_Shift__r.Facility__c = :facilityId
                AND Add_Shift__r.Facility__r.Organisation__r.Name = :userRecord.Organization_Name__c
            ];
        }

        List<SignInStaffWrapper> result = new List<SignInStaffWrapper>();

        for (ShiftwithStaff__c shift : shifts) {

            SignInStaffWrapper wrapper = new SignInStaffWrapper();

            wrapper.Id = shift.Staff__c;
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

}