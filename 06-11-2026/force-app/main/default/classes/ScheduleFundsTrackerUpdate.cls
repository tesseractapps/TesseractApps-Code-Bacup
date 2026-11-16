public class ScheduleFundsTrackerUpdate implements Schedulable {
    public void execute(SchedulableContext sc) {
       UpdateFundsTrackerBatch batch = new UpdateFundsTrackerBatch();
        Database.executeBatch(batch, 200); 
        
       /* UpdateFundsTrackersBatch batch = new UpdateFundsTrackersBatch();
        Database.executeBatch(batch, 200); */
    }
}