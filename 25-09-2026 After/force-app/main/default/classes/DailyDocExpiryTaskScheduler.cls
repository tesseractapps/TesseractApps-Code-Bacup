public class DailyDocExpiryTaskScheduler implements Database.Batchable<DailyDocExpiryTaskScheduler.RecordWrapper> {
    
    public class RecordWrapper {
        public Child_Staff__c staffRecord;
        public Client__c clientRecord;
        
        public RecordWrapper(Child_Staff__c s) {
            staffRecord = s;
        }
        
        public RecordWrapper(Client__c c) {
            clientRecord = c;
        }
    }
    
    public Iterable<RecordWrapper> start(Database.BatchableContext bc) {
        List<RecordWrapper> allRecords = new List<RecordWrapper>();
        Date tomorrow = Date.today().addDays(1);
        
        List<Child_Staff__c> staffRecords = [SELECT Id, Staff__c, Staff__r.CreatedById, Type__c, Expiry_Date__c, Comments__c FROM Child_Staff__c WHERE Expiry_Date__c = :tomorrow];
        for (Child_Staff__c s : staffRecords) {
            allRecords.add(new RecordWrapper(s));
        }
        
        List<Client__c> clients = [SELECT Id, Unavailable_Date__c, Current_Availability__c FROM Client__c WHERE Current_Availability__c = 'Unavailable' AND Unavailable_Date__c < :System.today()];
        for (Client__c c : clients) {
            allRecords.add(new RecordWrapper(c));
        }
        
        return allRecords;
    }
    
    public void execute(Database.BatchableContext bc, List<RecordWrapper> scope) {
        List<Task> tasksToInsert = new List<Task>();
        List<Client__c> clientsToUpdate = new List<Client__c>();
        
        for (RecordWrapper wrapper : scope) {
            if (wrapper.staffRecord != null) {
                Child_Staff__c staff = wrapper.staffRecord;
                tasksToInsert.add(new Task(
                    Subject = 'Staff Document Expiry',
                    WhatId = staff.Staff__c,
                    ActivityDate = staff.Expiry_Date__c,
                    Status = 'New',
                    Priority = 'High',
                    OwnerId = staff.Staff__r.CreatedById,
                    Description = 'Certification for staff is expiring tomorrow. Type: ' + staff.Type__c + '. Comments: ' + staff.Comments__c
                ));
            } else if (wrapper.clientRecord != null) {
                Client__c client = wrapper.clientRecord;
                client.Current_Availability__c = 'Available';
                client.Unavailable_Date__c = null;
                clientsToUpdate.add(client);
            }
        }
        
        if (!tasksToInsert.isEmpty()) insert tasksToInsert;
        if (!clientsToUpdate.isEmpty()) update clientsToUpdate;
    }
    
    public void finish(Database.BatchableContext bc) {
        // Optional finishing logic
    }
}