public class TSignStaffResetFlagQueueable implements Queueable {

    private List<Id> staffIds;

    public TSignStaffResetFlagQueueable(List<Id> staffIds) {
        this.staffIds = staffIds;
    }

    public void execute(QueueableContext ctx) {
        if (staffIds == null || staffIds.isEmpty()) return;

        List<TSign_Staff__c> toReset = new List<TSign_Staff__c>();
        for (Id sid : staffIds) {
            toReset.add(new TSign_Staff__c(Id = sid, Update_User__c = false));
        }
        Database.update(toReset, false);
    }
}