global class UserToFacilityAssociationBatch implements Database.Batchable<SObject> {

    global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Name, Email, User_Type__c
            FROM User
            WHERE IsActive = true
            AND User_Type__c IN ('Roster Manager', 'HR Admin', 'Support')
        ]);
    }

    global void execute(Database.BatchableContext bc, List<User> scope) {
        Set<String> userEmails = new Set<String>();
        for (User u : scope) {
            if (u.Email != null) {
                userEmails.add(u.Email.toLowerCase());
            }
        }
        system.debug('userEmails >>'+ userEmails);

        // Query Staff__c by matching emails
        Map<String, Staff__c> staffByEmail = new Map<String, Staff__c>();
        for (Staff__c staff : [
            SELECT Id, Name, Email_Address__c, Facility__c, Facility__r.Organisation__c
            FROM Staff__c
            WHERE Email_Address__c IN :userEmails
        ]) {
            if (staff.Email_Address__c != null)
                staffByEmail.put(staff.Email_Address__c.toLowerCase(), staff);
        }
        
        system.debug('staffByEmail >>'+ staffByEmail);

        // Extract Organisation Ids
        Set<Id> organisationIds = new Set<Id>();
        for (Staff__c staff : staffByEmail.values()) {
            if (staff.Facility__r != null && staff.Facility__r.Organisation__c != null) {
                organisationIds.add(staff.Facility__r.Organisation__c);
            }
        }
        
        system.debug('organisationIds >>'+ organisationIds);
        
        // Query all Facilities related to those Organisations
        Map<Id, List<Facility__c>> facilitiesByOrg = new Map<Id, List<Facility__c>>();
        for (Facility__c fac : [
            SELECT Id, Name, Organisation__c,Status__c
            FROM Facility__c
            WHERE Organisation__c IN :organisationIds
            AND Status__c = TRUE
        ]) {
            if (!facilitiesByOrg.containsKey(fac.Organisation__c)) {
                facilitiesByOrg.put(fac.Organisation__c, new List<Facility__c>());
            }
            facilitiesByOrg.get(fac.Organisation__c).add(fac);
        }
        
        system.debug('facilitiesByOrg >>'+ facilitiesByOrg);
        
        // Create Facility_Association__c records
        List<Facility_Association__c> recordsToInsert = new List<Facility_Association__c>();
        for (User u : scope) {
            Staff__c staff = staffByEmail.get(u.Email != null ? u.Email.toLowerCase() : null);
            if (staff != null && staff.Facility__r != null && staff.Facility__r.Organisation__c != null) {
                List<Facility__c> relatedFacilities = facilitiesByOrg.get(staff.Facility__r.Organisation__c);
                if (relatedFacilities != null) {
                    for (Facility__c f : relatedFacilities) {
                        Facility_Association__c assoc = new Facility_Association__c(
                            Staff__c = staff.Id,
                            Facility__c = f.Id,
                            User__c = u.Id,
                            User_Type__c = U.User_Type__c
                        );
                        recordsToInsert.add(assoc);
                    }
                }
            }
        }

        if (!recordsToInsert.isEmpty()) {
            insert recordsToInsert;
        }
    }

    global void finish(Database.BatchableContext bc) {
        System.debug('Finished creating Facility_Association__c records.');
    }
}