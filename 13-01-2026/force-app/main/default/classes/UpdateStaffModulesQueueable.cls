public class UpdateStaffModulesQueueable implements Queueable, Database.AllowsCallouts {

    private List<String> userEmails;

    public UpdateStaffModulesQueueable(List<String> userEmailToUpdate) {
        this.userEmails = userEmailToUpdate;
    }

    public void execute(QueueableContext context) {
        System.debug('🚀 Queueable execution started with emails: ' + userEmails);

        Map<String, String> emailToModuleMap = new Map<String, String>();

        Map<String, String> userTypeToModuleMap = new Map<String, String>{
            'NDIS Org Admin' => 'Admin; Human Resources; Incident Register; Payroll; Participants; Repository; Roster Manager; Sign In;My Profile;Accounting;Performance Management; Access Manager; T Sign; Forms',
            'HR Admin' => 'Human Resources; Performance Management; T Sign; Incident Register; Repository; Access Manager; My Profile',
            'Payroll Admin' => 'Payroll;Accounting;Incident Register;Repository',
            'Roster Manager' => 'Roster Manager; Human Resources; Sign In; Participants;Accounting; T Sign; Access Manager; Incident Register; Repository; Performance Management; My Profile; Payroll; Forms',
            'ICT Admin' => 'Admin; Payroll; Human Resources;  ICT Timesheets; T Sign; Incident Register; My Profile; Repository; Access Manager',
            'NDIS Staff' => 'Roster Manager;Participants;Sign In; Incident Register; Repository; Performance Management; My Profile',
            'ICT Staff' => 'My Profile; Repository;ICT Timesheets',
            'NDIS Participants' => 'Participants;Incident Register',
            'Payroll Accountant for Multiple' => 'Payroll',
            'Accountant for Organisation' => 'Payroll;Accounting'
        };

        // Query the users by email to get their type
        List<User> users = [
            SELECT Id, Email, User_Type__c 
            FROM User 
            WHERE Email IN :userEmails
        ];
        
        System.debug('👤 Retrieved Users: ' + users.size());

        for (User u : users) {
            system.debug('users==>'+u.User_Type__c);
            String modules = userTypeToModuleMap.get(u.User_Type__c);
            system.debug('modules==>'+modules);
            if (modules != null) {
                emailToModuleMap.put(u.Email, modules);
                System.debug('📧 ' + u.Email + ' | Type: ' + u.User_Type__c + ' => Modules: ' + modules);
            } else {
                System.debug('⚠️ No module mapping found for UserType: ' + u.User_Type__c + ' (Email: ' + u.Email + ')');
            }
        }

        if (emailToModuleMap.isEmpty()) {
            System.debug('❌ No matching UserTypes found. Exiting.');
            return;
        }

        List<Staff__c> staffToUpdate = [
            SELECT Id, Email_Address__c, Module_Names__c
            FROM Staff__c
            WHERE Email_Address__c IN :emailToModuleMap.keySet()
        ];
        System.debug('📄 Matching Staff records found: ' + staffToUpdate.size());

        for (Staff__c staff : staffToUpdate) {
            if (emailToModuleMap.containsKey(staff.Email_Address__c)) {
                String newModules = emailToModuleMap.get(staff.Email_Address__c);
                System.debug('🔄 Updating Staff: ' + staff.Email_Address__c + ' | New Modules: ' + newModules);
                staff.Module_Names__c = newModules;
                staff.User_Update__c = false;
            }
        }

        if (!staffToUpdate.isEmpty()) {
            try {
                update staffToUpdate;
                System.debug('✅ Successfully updated ' + staffToUpdate.size() + ' Staff records.');
            } catch (DmlException e) {
                System.debug('❌ Error updating Staff records: ' + e.getMessage());
            }
        } else {
            System.debug('ℹ️ No Staff records to update.');
        }

        System.debug('🏁 Queueable execution finished.');
    }
}