global class StaffBatchScheduler implements Schedulable {
    global void execute(SchedulableContext sc) {
        Database.executeBatch(new StaffBatchUpdate(), 200);
    }
}