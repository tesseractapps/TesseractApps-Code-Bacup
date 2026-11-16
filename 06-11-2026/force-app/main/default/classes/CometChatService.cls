public without sharing class CometChatService {
    
    @AuraEnabled
    public static Map<String, String> getCometChatCredentialsForCurrentUser() {

        User objUser = [
            SELECT Id,
                   Organization_Name__c,
                   CometChat_UID__c,
            	   Name,
                   Email,
                   Phone,
            	   UserRole.Name 
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        
        Staff__c staffRec;

        List<Staff__c> staffList = [
            SELECT Id, Picture__c, Email_Address__c
            FROM Staff__c
            WHERE Email_Address__c = :objUser.Email
            LIMIT 1
        ];
        
        if (!staffList.isEmpty()) {
            staffRec = staffList[0];
        }


        if (String.isBlank(objUser.Organization_Name__c)) {
            throw new AuraHandledException('No Organisation name found on current user.');
        }

        // Fetch Organisation record by Name
        Organisation__c org = [
            SELECT Id,
                   CometChat_App_ID__c,
                   CometChat_AuthKey__c,
                   CometChat_Region__c,
                   CometChat_Variant_ID__c,
            CometChat_REST_API_Key__c 
            FROM Organisation__c
            WHERE Name = :objUser.Organization_Name__c
            LIMIT 1
        ];

        // Build the response map with org + user info
        Map<String, String> creds = buildCredsMap(org);
        creds.put('userUID', objUser.CometChat_UID__c);
        creds.put('userId', objUser.Id);   
        creds.put('userName', objUser.Name);
        creds.put('userEmail', objUser.Email);
        creds.put('userPhone', objUser.Phone);
        
        String ccRole = 'default';

if (objUser.UserRole != null && String.isNotBlank(objUser.UserRole.Name)) {switch on objUser.UserRole.Name {when 'Portal Account Partner Executive' {
            ccRole = 'portal_account_partner_executive';
        }
        when 'Portal Account Partner User' {
            ccRole = 'portal_account_partner_user';
        }
        when 'Portal Account Partner Manager' {
            ccRole = 'portal_account_partner_manager';
        }
        when 'CEO' {
            ccRole = 'ceo';
        }
        when else {
            ccRole = 'default';
        }
    }
}

creds.put('userRole', ccRole);

// staff avatar (picture)
if (staffRec != null && String.isNotBlank(staffRec.Picture__c)) {creds.put('avatarUrl', staffRec.Picture__c);
} else {
    creds.put('avatarUrl', '');
}

        return creds;
    }
    
    private static Map<String, String> buildCredsMap(Organisation__c org) {
        if (org == null) {
            throw new AuraHandledException('Organisation not found.');
        }

        Map<String, String> creds = new Map<String, String>();
        creds.put('organisationId', String.valueOf(org.Id));
        creds.put('appID', org.CometChat_App_ID__c);
        creds.put('authKey', org.CometChat_AuthKey__c);
        creds.put('appRegion', org.CometChat_Region__c);
        creds.put('variantID', org.CometChat_Variant_ID__c);
        creds.put('restApiKey', org.CometChat_REST_API_Key__c);
        return creds;
    }
    
     @AuraEnabled
    public static void saveCometChatUID(Id userId, String userUID) {
        User u = [SELECT Id FROM User WHERE Id = :userId LIMIT 1];
        u.CometChat_UID__c = userUID;
        update u;
    }
    

}