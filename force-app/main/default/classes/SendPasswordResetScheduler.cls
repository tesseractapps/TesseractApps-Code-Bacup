global class SendPasswordResetScheduler implements Schedulable {
    global void execute(SchedulableContext SC) {
        SendPasswordResetBatch batchJob = new SendPasswordResetBatch();
        Database.executeBatch(batchJob, 100);
    }
}