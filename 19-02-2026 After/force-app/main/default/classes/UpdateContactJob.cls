public class UpdateContactJob implements Queueable {
    private List<Id> contactIds;

    public UpdateContactJob(List<Id> contactIdsToUpdate) {
        this.contactIds = contactIdsToUpdate;
    }

    public void execute(QueueableContext context) {
        List<Contact> contactsToUpdate = [SELECT Id, Portal_User_Created__c FROM Contact WHERE Id IN :contactIds];

        for (Contact c : contactsToUpdate) {
            c.Portal_User_Created__c = false;
        }

        if (!contactsToUpdate.isEmpty()) {
            update contactsToUpdate;
        }
    }
}