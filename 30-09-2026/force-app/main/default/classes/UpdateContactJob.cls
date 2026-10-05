/* public class UpdateContactJob implements Queueable {
    private List<Id> contactIds;

    public UpdateContactJob(List<Id> contactIdsToUpdate) {
        this.contactIds = contactIdsToUpdate;
    }

    public void execute(QueueableContext context) {
        List<Contact> contactsToUpdate = [SELECT Id,Email, Portal_User_Created__c FROM Contact WHERE Id IN :contactIds];



        for (Contact c : contactsToUpdate) {
            c.Portal_User_Created__c = false;
        }

        if (!contactsToUpdate.isEmpty()) {
            update contactsToUpdate;
        }
    }
} */

public class UpdateContactJob implements Queueable {

    private List<Id> contactIds;

    public UpdateContactJob(List<Id> contactIdsToUpdate) {
        this.contactIds = contactIdsToUpdate;
    }

    public void execute(QueueableContext context) {

        // -------------------------
        // Step 1: Get Contacts
        // -------------------------
        List<Contact> contactsToUpdate = [
            SELECT Id, Email, Portal_User_Created__c
            FROM Contact
            WHERE Id IN :contactIds
        ];

        // -------------------------
        // Step 2: Collect Emails
        // -------------------------
        Set<String> emails = new Set<String>();
        for (Contact c : contactsToUpdate) {
            if (c.Email != null) {
                emails.add(c.Email);
            }
        }

        // -------------------------
        // Step 3: Get Users by Email
        // -------------------------
        Map<String, List<User>> emailToUsersMap = new Map<String, List<User>>();
        for (User u : [
            SELECT Id, Email,User_Type__c
            FROM User
            WHERE Email IN :emails
        ]) {
            if (!emailToUsersMap.containsKey(u.Email)) {
                emailToUsersMap.put(u.Email, new List<User>());
            }
            emailToUsersMap.get(u.Email).add(u);
        }

        // -------------------------
        // Step 4: Get Staff with Staff_Facility__c
        // -------------------------
        List<Staff__c> staffList = [
            SELECT Id, Name, Email_Address__c, User__c,
                   (SELECT Id, Facility__c, Active__c FROM Staff_Facilities__r)
            FROM Staff__c
            WHERE Email_Address__c IN :emails
        ];

        List<Staff__c> staffToUpdate = new List<Staff__c>();
        List<Facility_Association__c> facAssociationToInsert = new List<Facility_Association__c>();

        // -------------------------
        // Step 5: Process Staff and Staff_Facility
        // -------------------------
        for (Staff__c s : staffList) {

            // Assign User to Staff__c if not already assigned
            if (s.Email_Address__c != null && emailToUsersMap.containsKey(s.Email_Address__c)) {
                User staffUser = emailToUsersMap.get(s.Email_Address__c)[0]; // take first user

                // Process Staff_Facilities
                if (s.Staff_Facilities__r != null && !s.Staff_Facilities__r.isEmpty()) {

                    for (Staff_Facility__c sf : s.Staff_Facilities__r) {

                        // Create Facility_Association__c if Active and Facility is set
                        if (sf.Active__c == true && sf.Facility__c != null) {
                            Facility_Association__c fa = new Facility_Association__c();
                            fa.Facility__c = sf.Facility__c;
                            fa.User__c = staffUser.Id;
                            fa.Active__c = true;
                            fa.User_Type__c=staffUser.User_Type__c;

                            facAssociationToInsert.add(fa);
                        }
                    }
                }
            }
        }

        // -------------------------
        // Step 6: Update Staff
        // -------------------------
        if (!staffToUpdate.isEmpty()) {
            update staffToUpdate;
        }

        // -------------------------
        // Step 7: Insert Facility_Association
        // -------------------------
        if (!facAssociationToInsert.isEmpty()) {
            insert facAssociationToInsert;
        }

        // -------------------------
        // Step 8: Update Contacts
        // -------------------------
        for (Contact c : contactsToUpdate) {
            c.Portal_User_Created__c = false;
        }

        if (!contactsToUpdate.isEmpty()) {
            update contactsToUpdate;
        }
    }
}