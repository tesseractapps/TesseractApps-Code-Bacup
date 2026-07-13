/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-18-2023
* @last modified by  : Raja Sekhar Reddy
**/
public without sharing class ParticipantDetailsHandler {
    @AuraEnabled
    public static list<Client_Journel__c> listOfClientjounel(String recordId){
        return [select id,CreatedDate__c,LastModifiedDate,Description__c,createdDate,CreatedBy.Name,CreatedBy.SmallPhotoUrl,Care_Notes__c,
                staff__r.name,staff__r.Last_Name__c,staff__r.picture__c,(SELECT Id, Description__c,Care_Notes__c, CreatedDate,
                       CreatedBy.Name,
                       Reason__c
                FROM Client_Journels__r     // this is the child relationship name of Parent_Journal__c
                ORDER BY CreatedDate DESC) from Client_Journel__c where Client__c=:recordId AND (is_Locked__c = true OR is_Locked__c = false)
    AND Original_Client_Journel__c = null   Order by createdDate desc ]; //Original_Client_Journel__c = null this is added is the where condition to display old records by prashanth
    }

    @AuraEnabled
    public static string saveDesc(String recordId,String jounelId,String description, String jNoteType, String correctionReason,string shiftId){
       String UserEmail = UserInfo.getUserEmail(); 
        Staff__c staffData=[SELECT id,Name,role__c,Facility__c FROM Staff__c 
                                WHERE Email_Address__c =:UserEmail LIMIT 1];
        List<Client_Journel__c> duplicateCareNotes = [SELECT Id,Care_Notes__c,Client__c FROM Client_Journel__c WHERE Client__c=:recordId AND Care_Notes__c = :jNoteType AND CreatedBy.Email =:UserEmail AND createdDate=TODAY];
        System.debug('duplicateCareNotes '+ duplicateCareNotes); 
           /* if ((jounelId==null || jounelId=='') && !duplicateCareNotes.isEmpty()) {
            	return 'duplicate';
            }*/
            try{
            if(String.isBlank(jounelId)){
                 System.debug('jounelId if condition '+ jounelId);
                Client_Journel__c clientJournelRec = new Client_Journel__c();
                clientJournelRec.Client__c=recordId;
                clientJournelRec.Description__c=description;
                clientJournelRec.Care_Notes__c=jNoteType;
                clientJournelRec.Staff__c=staffData.id;
                clientJournelRec.is_Locked__c = true;
                 clientJournelRec.ShiftwithStaff__c=shiftId;

                 insert clientJournelRec; 
                return 'Created Successfully! '; 
            }
                // Case 2: Correction Flow (Existing Record)
            else {
            // Fetch original record
            Client_Journel__c original = [
                SELECT Id, Client__c, Description__c, Care_Notes__c, Staff__c
                FROM Client_Journel__c
                WHERE Id = :jounelId
                LIMIT 1
            ];
                System.debug('jounelId else condition '+ jounelId);

            // Create a new correction record
            Client_Journel__c correction = new Client_Journel__c();
            correction.Client__c = original.Client__c;
            correction.Care_Notes__c = original.Care_Notes__c;
            correction.Description__c = description; // corrected description
            correction.Staff__c = staffData.Id;
            correction.Original_Client_Journel__c = original.Id; // self lookup
            correction.Reason__c = correctionReason;
            correction.is_Locked__c = false;

            insert correction;
                Id currentUserId = UserInfo.getUserId();
                user orgRecord = [SELECT Id, Name, Email, User_Type__c, Organisation__c FROM User WHERE Id = :currentUserId LIMIT 1];
                list<Staff__c> facilityStaff=[SELECT id,Email_Address__c,Name,role__c,Facility__c FROM Staff__c where Facility__c=:staffData.Facility__c ];
                list<string> staffEmails=new list<string>();
                for(Staff__c  ss :facilityStaff){
                   staffEmails.add(ss.Email_Address__c) ;
                }
                
                List<User> orgUsers = [
                    SELECT Id, Name, Email, User_Type__c, Organisation__c
                    FROM User
                    WHERE User_Type__c IN ('NDIS Org Admin', 'Facility Admin', 'Roster Manager')
                    AND Organisation__c = :orgRecord.Organisation__c AND Email IN :staffEmails
                ];
                
                System.debug('users'+orgUsers);
                // 🔔 Create notification records for each user
            List<My_Notification__c> notifications = new List<My_Notification__c>();

            for (User u : orgUsers) {
                My_Notification__c notif = new My_Notification__c();
                notif.Subject__c = 'Correction Created in Client Journal';
                notif.Description__c = 'A correction was made by ' + staffData.Name + 
                    ' for Client Journal: ' + correction.Care_Notes__c + 
                    '. Reason: ' + correction.Reason__c;
                notif.User__c = u.Id;
                notif.Participant_Id__c = recordId;
                notifications.add(notif);
            }

            if (!notifications.isEmpty()) {
                insert notifications;
            }
               
            return 'Correction Created Successfully!';
        }
        }catch(exception e){
            return e.getMessage();
        }    
               
    }
    
    @AuraEnabled
    public static string communityPage(){
        String communityPrefix = Network.getNetworkId(); 
        String communityUrl =Network.getLoginUrl(communityPrefix);
        return communityUrl;
    }
}