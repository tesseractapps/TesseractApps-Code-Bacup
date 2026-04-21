public class UpdateStaffErrorJob implements Queueable {

    private Map<Id, String> staffErrors;

    public UpdateStaffErrorJob(Map<Id, String> staffErrors) {
        this.staffErrors = staffErrors;
    }

    public void execute(QueueableContext context) {

        List<Staff__c> staffToUpdate = new List<Staff__c>();

        for (Id staffId : staffErrors.keySet()) {
            staffToUpdate.add(new Staff__c(
                Id = staffId,
                Portal_User_Error__c = staffErrors.get(staffId)
            ));
        }

        if (!staffToUpdate.isEmpty()) {
            update staffToUpdate;
        }
    }
}