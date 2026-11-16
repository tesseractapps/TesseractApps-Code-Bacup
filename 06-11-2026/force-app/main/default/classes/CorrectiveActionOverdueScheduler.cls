public class CorrectiveActionOverdueScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        Database.executeBatch(new CorrectiveActionOverdueBatch(), 50);
        
        //System.schedule('Corrective Action Overdue Reminder Daily', '0 0 6 * * ?', new CorrectiveActionOverdueScheduler());
    }
}