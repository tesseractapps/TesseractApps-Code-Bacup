public with sharing class LeaveAccrualScheduler
    implements Schedulable {

    public void execute(SchedulableContext sc) {
        Database.executeBatch(
            new LeaveAccrualFromShiftDurationBatch(),
            200
        );
    }
}