public class RepositoryTriggerHandler {

    public static void afterUpdate(
        List<Repository__c> newList,
        Map<Id, Repository__c> oldMap
    ) {

        List<Staff_Document_View__c> viewsToInsert =
            new List<Staff_Document_View__c>();

        Id currentUserId = UserInfo.getUserId();
        
        User currentUser = [
            SELECT Id, Full_Name__c, FirstName, LastName
            FROM User
            WHERE Id = :currentUserId
            LIMIT 1
        ];

        for (Repository__c newRec : newList) {

            Repository__c oldRec = oldMap.get(newRec.Id);

            // Ensure this is a real edit (not system touch)
            if (oldRec == null) continue;
            
            system.debug('newRec.LastModifiedDate  >>>>'+ newRec.LastModifiedDate);
            system.debug('oldRec.LastModifiedDate  >>>>'+ oldRec.LastModifiedDate);

            // OPTIONAL: prevent logging when no meaningful change
            if (newRec.LastModifiedDate == oldRec.LastModifiedDate) { continue; }
            System.debug('Last Modified Date: ' + newRec.LastModifiedDate); Staff_Document_View__c viewLog = new Staff_Document_View__c();viewLog.Repository__c = newRec.Id;viewLog.User_Name__c = currentUser.Full_Name__c;viewLog.Action__c = 'File Edited';viewsToInsert.add(viewLog);
        }

        if (!viewsToInsert.isEmpty()) {insert viewsToInsert;
        }
    }
}