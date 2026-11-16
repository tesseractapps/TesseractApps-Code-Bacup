//public class IncidentNDISOverdueReminderScheduler {

public class IncidentNDISOverdueReminderScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        Database.executeBatch(new IncidentNDISOverdueReminderBatch(), 50);
        
        //System.schedule('NDIS Overdue Reminder Daily', '0 0 1 * * ?', new IncidentNDISOverdueReminderScheduler());
    }
}