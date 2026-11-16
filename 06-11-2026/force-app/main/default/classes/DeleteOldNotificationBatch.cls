global class DeleteOldNotificationBatch implements Database.Batchable<SObject> {

    global Database.QueryLocator start(Database.BatchableContext BC) {

        DateTime cutoffDate = System.now().addMonths(-1);

        return Database.getQueryLocator([
            SELECT Id
            FROM My_Notification__c
            WHERE CreatedDate < :cutoffDate
        ]);
    }

    global void execute(
        Database.BatchableContext BC,
        List<My_Notification__c> scope
    ) {
        Database.delete(scope, false);
    }

    global void finish(Database.BatchableContext BC) {
        // Optional
    }
}