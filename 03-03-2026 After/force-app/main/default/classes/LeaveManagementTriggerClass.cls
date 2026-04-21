public class LeaveManagementTriggerClass {
   public static void updateLeaves(List<Leave__c> approvedLeaves ,Map<ID,Leave__c> oldLeaves) {
       
       List<Staff__c> staffToUpdate = new List<Staff__c>();

        for (Leave__c leave : approvedLeaves) {
            // Check if the status has changed to 'Approved'
            if (leave.Status__c == 'Approved' && oldLeaves.get(leave.Id).Status__c != 'Approved') {
                Staff__c staff = [SELECT Id, Annual_Leave__c, Parental_Leave__c, Sick_Leave__c,Bereavement_Leave__c 
                                  FROM Staff__c WHERE Id = :leave.Staff__c LIMIT 1];

                // Subtract the leave duration from the appropriate leave balance
                if (leave.Type_of_Leave__c == 'Annual Leave') {
                    staff.Annual_Leave__c -= leave.Duration__c;
                    if (staff.Annual_Leave__c < 0) {
                        staff.Annual_Leave__c = 0;
                    }
                } else if (leave.Type_of_Leave__c == 'Parental Leave') {                    staff.Parental_Leave__c -= leave.Duration__c;                    if (staff.Parental_Leave__c < 0) {                        staff.Parental_Leave__c = 0;
                    }
                } else if (leave.Type_of_Leave__c == 'Sick leave') {
                    staff.Sick_Leave__c -= leave.Duration__c;
                    if (staff.Sick_Leave__c < 0) { 
                        staff.Sick_Leave__c = 0;
                    }
                }else if (leave.Type_of_Leave__c == 'Bereavement Leave') {
                    staff.Bereavement_Leave__c -= leave.Duration__c;
                    if (staff.Bereavement_Leave__c < 0) {
                        staff.Bereavement_Leave__c = 0;
                    }
                }

                staffToUpdate.add(staff);
            }
        }

        if (!staffToUpdate.isEmpty()) {
            update staffToUpdate;
        }

    }

    public static void preventDuplicateleaves(List<Leave__c> newLeaves) {
   
    Set<Id> conflictingLeaveIds = new Set<Id>();
    if (newLeaves.isEmpty()) return;
    Id staffId = newLeaves[0].Staff__c;

    try {
        for (Leave__c newLeave : newLeaves) {
            if (newLeave.Status__c == 'Requested' || newLeave.Status__c == 'Approved') {
                List<Leave__c> overlappingLeaves = [
                    SELECT Id
                    FROM Leave__c
                    WHERE 
                        Staff__c = :staffId AND
                        Status__c IN ('Requested', 'Approved') AND
                        (
                            (From__c <= :newLeave.To__c AND To__c >= :newLeave.From__c) 
                        ) AND
                        Id != :newLeave.Id
                ];
                if (!overlappingLeaves.isEmpty()) {                    conflictingLeaveIds.add(newLeave.Id);
                }
            }
        }
        if (!conflictingLeaveIds.isEmpty()) {
            for (Leave__c leave : newLeaves) {
                if (conflictingLeaveIds.contains(leave.Id)) {
                    leave.From__c.addError('leave request with overlapping dates');
                }
            }
        }
    } catch (Exception e) {
        System.debug('An error occurred leave trigger: ' + e.getMessage());
        // Optionally, you can rethrow the exception or handle it in another way
        throw new AuraHandledException('An unexpected error occurred while processing leave requests.'); 
    }
}
}