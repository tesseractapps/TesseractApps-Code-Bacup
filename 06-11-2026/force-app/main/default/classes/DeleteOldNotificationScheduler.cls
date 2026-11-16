global class DeleteOldNotificationScheduler implements Schedulable {

    global void execute(SchedulableContext SC) {
        Database.executeBatch(
            new DeleteOldNotificationBatch(),
            200
        );
    }
}