public class DailyDocExpiryBatchScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        DailyDocExpiryTaskScheduler batch = new DailyDocExpiryTaskScheduler();
        Database.executeBatch(batch, 200); // You can change batch size as needed
    }

}