public class StaffToUserBatchScheduler implements Schedulable {
    public void execute(SchedulableContext SC) {
        // Execute the batch job
        StaffToUserBatch batch = new StaffToUserBatch();
        Database.executeBatch(batch, 1); // Batch size: 200
    }
}