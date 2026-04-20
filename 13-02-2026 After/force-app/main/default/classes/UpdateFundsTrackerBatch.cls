public class UpdateFundsTrackerBatch implements Database.Batchable<SObject>, Database.Stateful {

    public Database.QueryLocator start(Database.BatchableContext bc) {

        Date today = Date.today();
        Integer fyYear = today.year();

        // Australia FY starts on July 1
        if (today.month() < 7) {
            fyYear -= 1;   // If before July → FY started last year
        }

        // Current FY Start (Example: 01-07-2025)
        Date currentFYStart = Date.newInstance(fyYear, 7, 1);

        System.debug('Current FY Start (New Date): ' + currentFYStart);

        // Fetch ALL records from ANY old FY
        return Database.getQueryLocator([
            SELECT Id, Approved_Date__c, Status__c
            FROM Funds_Tracker__c
            WHERE Status__c = 'Active'
            AND Approved_Date__c < :currentFYStart
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Funds_Tracker__c> scope) {

        Date today = Date.today();
        Integer fyYear = today.year();

        if (today.month() < 7) {
            fyYear -= 1;
        }

        // New Approved Date = Start of current FY
        Date newApprovedDate = Date.newInstance(fyYear, 7, 1);

        List<Funds_Tracker__c> updates = new List<Funds_Tracker__c>();

        for (Funds_Tracker__c ft : scope) {
            ft.Approved_Date__c = newApprovedDate;
            updates.add(ft);
        }

        if (!updates.isEmpty()) {
            update updates;
        }
    }

    public void finish(Database.BatchableContext bc) {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new String[] { UserInfo.getUserEmail() });
        mail.setSubject('Funds Tracker FY Update Completed');
        mail.setPlainTextBody('All previous FY records successfully updated to the current FY.');
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }
}