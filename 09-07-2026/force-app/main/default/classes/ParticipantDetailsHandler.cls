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
                staff__r.name,staff__r.Last_Name__c,staff__r.picture__c,staff__r.Display_Nickname__c,ShiftwithStaff__r.Shift_Start_DateTime__c,
ShiftwithStaff__r.Shift_Start_End_Time__c,
                (SELECT Id, Description__c,Care_Notes__c, CreatedDate, staff__r.name,staff__r.Last_Name__c,staff__r.picture__c,
                       CreatedBy.Name,staff__r.Display_Nickname__c,
                       Reason__c
                       
                FROM Client_Journels__r     // this is the child relationship name of Parent_Journal__c
                ORDER BY CreatedDate DESC),
                //manendra added for AWS attachments 
           (
               SELECT Id,
                      Name,
                      File_Name__c,
                      File_URL__c,
                      File_Type__c,
                      AWS_Key__c,
                      Aws_Json__c
               FROM Journal_Attachments__r
           ) from Client_Journel__c where Client__c=:recordId AND (is_Locked__c = true OR is_Locked__c = false)
    AND Original_Client_Journel__c = null   Order by createdDate desc ]; //Original_Client_Journel__c = null this is added is the where condition to display old records by prashanth
    }

/*     @AuraEnabled
    public static string saveDesc(String recordId,String jounelId,String description, String jNoteType, String correctionReason,string shiftId){
       String UserEmail = UserInfo.getUserEmail(); 
        Staff__c staffData=[SELECT id,Name,role__c,Facility__c FROM Staff__c 
                                WHERE Email_Address__c =:UserEmail LIMIT 1];
        List<Client_Journel__c> duplicateCareNotes = [SELECT Id,Care_Notes__c,Client__c FROM Client_Journel__c WHERE Client__c=:recordId AND Care_Notes__c = :jNoteType AND CreatedBy.Email =:UserEmail AND createdDate=TODAY];
        System.debug('duplicateCareNotes '+ duplicateCareNotes); 

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
    } */

 

    @AuraEnabled
    public static JournalResponse saveDesc(String recordId,String jounelId,String description, String jNoteType, String correctionReason,string shiftId){
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
                JournalResponse response = new JournalResponse();
                response.message = 'Created Successfully!';
                response.journalId = clientJournelRec.Id;

                return response;
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
               
            JournalResponse response = new JournalResponse();
            response.message = 'Correction Created Successfully!';
            response.journalId = correction.Id;
            return response;
        }
        }catch(exception e){
           
            JournalResponse response = new JournalResponse();
            response.message = e.getMessage();
            response.journalId = null;

            return response;
        }    
               
    }
    
    @AuraEnabled
    public static string communityPage(){
        String communityPrefix = Network.getNetworkId(); 
        String communityUrl =Network.getLoginUrl(communityPrefix);
        return communityUrl;
    }
// manendra aded for aws upload
    public class JournalResponse {
    @AuraEnabled public String message;
    @AuraEnabled public Id journalId;
}

@AuraEnabled
public static void saveJournalAttachments(
    Id journalId,
    String uploadedFilesJson
) {
    System.debug('==============================');
System.debug('SAVE ATTACHMENTS CALLED');
System.debug('Journal Id = ' + journalId);
System.debug('Payload = ' + uploadedFilesJson);
System.debug('==============================');

    List<Object> uploadedFiles =
        (List<Object>) JSON.deserializeUntyped(uploadedFilesJson);

    List<Journal_Attachments__c> attachments =
        new List<Journal_Attachments__c>();

    for(Object obj : uploadedFiles){

        Map<String,Object> fileData =
            (Map<String,Object>) obj;

        String fileUrl =
            (String) fileData.get('url');

        String awsKey =
            (String) fileData.get('key');

        String fileName = '';

        if(!String.isBlank(awsKey)){
            List<String> parts = awsKey.split('/');
            fileName = parts[parts.size()-1];
        }

        String fileType = '';

        if(fileName.contains('.')){
            fileType =
                fileName.substringAfterLast('.');
        }

        Journal_Attachments__c attachment =
            new Journal_Attachments__c();

        attachment.Client_Journel__c = journalId;
        attachment.File_Name__c = fileName;
        attachment.File_URL__c = fileUrl;
        attachment.AWS_Key__c = awsKey;
        attachment.File_Type__c = fileType;
        attachment.Aws_Json__c =
            JSON.serialize(fileData);

        attachments.add(attachment);
    }

    if(!attachments.isEmpty()){
        System.debug('Attachments Count = ' + attachments.size());
        insert attachments;
    }
}
@AuraEnabled
public static Map<Id, List<Journal_Attachments__c>> getCorrectionAttachments(
    List<Id> correctionIds
) {

    Map<Id, List<Journal_Attachments__c>> resultMap =
        new Map<Id, List<Journal_Attachments__c>>();

    if(correctionIds == null || correctionIds.isEmpty()){
        return resultMap;
    }

    for(Journal_Attachments__c att :
        [
            SELECT Id,
                   Client_Journel__c,
                   File_Name__c,
                   File_URL__c,
                   File_Type__c,
                   AWS_Key__c,
                   Aws_Json__c
            FROM Journal_Attachments__c
            WHERE Client_Journel__c IN :correctionIds
        ]
    ){

        if(!resultMap.containsKey(att.Client_Journel__c)){
            resultMap.put(
                att.Client_Journel__c,
                new List<Journal_Attachments__c>()
            );
        }

        resultMap.get(att.Client_Journel__c).add(att);
    }

    return resultMap;
}

//end
}