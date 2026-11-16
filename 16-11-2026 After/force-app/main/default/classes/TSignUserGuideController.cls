/**
 * T-Sign User Guide: the "Set up before you send" checklist on the guide home (c-t-sign-user-guide).
 *
 * Each item is true once the person's account has that thing set up. Only yes/no answers leave this
 * class, so it runs without sharing to count records across the organisation (same as the other
 * T-Sign controllers).
 */
public without sharing class TSignUserGuideController {

    public class SetupProgress {
        @AuraEnabled public Boolean signature = false; // the person has saved a signature
        @AuraEnabled public Boolean users = false;     // the organisation has a second user or facility
        @AuraEnabled public Boolean contacts = false;  // at least one contact that is not archived
        @AuraEnabled public Boolean templates = false; // at least one template that is not archived
        @AuraEnabled public Boolean folders = false;   // at least one attachment in Folders that is not archived
    }

    @AuraEnabled
    public static SetupProgress getSetupProgress() {
        SetupProgress progress = new SetupProgress();
        try {
            TSign_Staff__c staff = findCurrentStaff();
            Id orgId = staff != null ? staff.TSign_Organisation__c : null;
            if (orgId == null) {
                orgId = currentUserOrgId();
            }

            if (staff != null) {
                progress.signature = [SELECT COUNT() FROM TSign_Signature__c WHERE TSign_Staff__c = :staff.Id LIMIT 1] > 0;
            }

            if (orgId != null) {
                // a facility is created automatically at sign-up, and the account owner is the first user
                progress.users =
                    [SELECT COUNT() FROM TSign_Staff__c WHERE TSign_Organisation__c = :orgId LIMIT 2] > 1 ||
                    [SELECT COUNT() FROM TSign_Facility__c WHERE TSign_Organisation__c = :orgId LIMIT 2] > 1;

                progress.contacts =
                    [SELECT COUNT() FROM TSign_Contact__c WHERE TSign_Organisation__c = :orgId AND Is_Archived__c = false LIMIT 1] > 0;

                // Organisation_Id__c is a text field: match the 18- and 15-character forms of the id
                String orgId18 = String.valueOf(orgId);
                Set<String> orgIdForms = new Set<String>{ orgId18, orgId18.left(15) };
                progress.templates =
                    [SELECT COUNT() FROM TSign_Template__c WHERE Organisation_Id__c IN :orgIdForms AND Status__c != 'Archive' LIMIT 1] > 0;

                progress.folders =
                    [SELECT COUNT() FROM TSign_Document__c WHERE TSign_Organisation__c = :orgId AND Is_Archived__c = false LIMIT 1] > 0;
            }
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'TSignUserGuideController.getSetupProgress: ' + e.getMessage());
            throw new AuraHandledException('The setup checklist could not be loaded.');
        }
        return progress;
    }

    // Same lookup as TSignGuidedTourController: linked user first, then the login email.
    private static TSign_Staff__c findCurrentStaff() {
        List<TSign_Staff__c> byUser = [
            SELECT Id, TSign_Organisation__c
            FROM TSign_Staff__c
            WHERE User__c = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
        if (!byUser.isEmpty()) {
            return byUser[0];
        }

        String email = UserInfo.getUserEmail();
        if (String.isBlank(email)) {
            return null;
        }
        List<TSign_Staff__c> byEmail = [
            SELECT Id, TSign_Organisation__c
            FROM TSign_Staff__c
            WHERE Email__c = :email
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
        return byEmail.isEmpty() ? null : byEmail[0];
    }

    // Fallback when there is no staff record: the organisation id stored on the user.
    private static Id currentUserOrgId() {
        List<User> users = [SELECT TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        if (users.isEmpty() || String.isBlank(users[0].TSign_Org_Id__c)) {
            return null;
        }
        try {
            return Id.valueOf(users[0].TSign_Org_Id__c);
        } catch (Exception e) {
            return null;
        }
    }
}