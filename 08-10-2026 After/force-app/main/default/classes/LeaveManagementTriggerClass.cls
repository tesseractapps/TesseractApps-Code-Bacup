public class LeaveManagementTriggerClass {
  /* public static void updateLeaves(List<Leave__c> approvedLeaves ,Map<ID,Leave__c> oldLeaves) {
       
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
                } else if (leave.Type_of_Leave__c == 'Parental Leave') {
                    staff.Parental_Leave__c -= leave.Duration__c;
                    if (staff.Parental_Leave__c < 0) {
                        staff.Parental_Leave__c = 0;
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
       
       for (Leave__c leave : approvedLeaves) {

    Leave__c oldLeave =
        oldLeaves.get(leave.Id);

    if (
        leave.Status__c !=
        oldLeave.Status__c
    ) {

        if (
            leave.Status__c == 'Approved' ||
            leave.Status__c == 'Rejected' ||
            leave.Status__c == 'Cancelled'
        ) {

            NotificationServices.sendLeaveStatusNotification(leave.Id);
        }
    }
}

    } */

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
                if (!overlappingLeaves.isEmpty()) {
                    conflictingLeaveIds.add(newLeave.Id);
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

public static void createstaffLeaveNotifications(List<Leave__c> leaves) {

    System.debug('========== STAFF LEAVE NOTIFICATION START ==========');
    System.debug('Number of leaves: ' + leaves.size());

    for (Leave__c leave : leaves) {

        System.debug('Processing Leave Id: ' + leave.Id);
        System.debug('Admin__c: ' + leave.Admin__c);
        System.debug('Staff__c: ' + leave.Staff__c);
        System.debug('CreatedBy__c: ' + leave.CreatedBy__c);
        System.debug('From__c: ' + leave.From__c);
        System.debug('To__c: ' + leave.To__c);

        if (leave.Admin__c == true && leave.Staff__c != null) {

            System.debug('✅ Admin is TRUE and Staff is NOT NULL');

            Staff__c staff = [
                SELECT Id, Email_Address__c
                FROM Staff__c
                WHERE Id = :leave.Staff__c
                LIMIT 1
            ];

            System.debug('Staff Id: ' + staff.Id);
            System.debug('Staff Email: ' + staff.Email_Address__c);

            List<User> userRecords = [
                SELECT Id, Email
                FROM User
                WHERE Email = :staff.Email_Address__c
                LIMIT 1
            ];

            if (userRecords.isEmpty()) {
                System.debug('❌ User not found for email: ' + staff.Email_Address__c);
                return;
            }

            User userRecord = userRecords[0];

            System.debug('✅ User Found');
            System.debug('User Id: ' + userRecord.Id);
            System.debug('User Email: ' + userRecord.Email);

            My_Notification__c notification = new My_Notification__c(
                User__c = userRecord.Id,
                Subject__c = 'Leave Request Created',
               Description__c = 'A request has been raised on your behalf by ' +
                 leave.CreatedBy__c +
                 ' for ' +
                 (leave.From__c != null ? String.valueOf(leave.From__c.day()).leftPad(2, '0') + '/' + String.valueOf(leave.From__c.month()).leftPad(2, '0') + '/' + String.valueOf(leave.From__c.year()) : '') +
                 ' to ' +
                 (leave.To__c != null ? String.valueOf(leave.To__c.day()).leftPad(2, '0') + '/' + String.valueOf(leave.To__c.month()).leftPad(2, '0') + '/' + String.valueOf(leave.To__c.year()) : '') +
                 '.'
            );

            System.debug('Notification User__c: ' + notification.User__c);
            System.debug('Notification Subject: ' + notification.Subject__c);
            System.debug('Notification Description: ' + notification.Description__c);

            insert notification;

            System.debug('✅ NOTIFICATION INSERTED: ' + notification.Id);

        } else {

            System.debug('❌ Condition NOT met');
            System.debug('Admin__c = ' + leave.Admin__c);
            System.debug('Staff__c = ' + leave.Staff__c);
        }
    }

    System.debug('========== STAFF LEAVE NOTIFICATION END ==========');
}

}

/* public class LeaveManagementTriggerClass {

    // =====================================================
    // UPDATE LEAVES
    // =====================================================

    public static void updateLeaves(
        List<Leave__c> approvedLeaves,
        Map<Id, Leave__c> oldLeaves
    ) {

        // =====================================================
        // 1. Collect Staff Ids
        // =====================================================

        Set<Id> staffIds = new Set<Id>();

        for (Leave__c leave : approvedLeaves) {

            Leave__c oldLeave =
                oldLeaves.get(leave.Id);

            // Only when status changed to Approved

            if (
                leave.Status__c == 'Approved' &&
                oldLeave.Status__c != 'Approved'
            ) {

                if (leave.Staff__c != null) {

                    staffIds.add(
                        leave.Staff__c
                    );
                }
            }
        }

        // =====================================================
        // 2. Query Staff Records Once
        // =====================================================

        Map<Id, Staff__c> staffMap =
            new Map<Id, Staff__c>();

        if (!staffIds.isEmpty()) {

            staffMap = new Map<Id, Staff__c>([

                SELECT Id,
                       Annual_Leave__c,
                       Parental_Leave__c,
                       Sick_Leave__c,
                       Bereavement_Leave__c

                FROM Staff__c

                WHERE Id IN :staffIds
            ]);
        }

        // =====================================================
        // 3. Update Leave Balances
        // =====================================================

        List<Staff__c> staffToUpdate =
            new List<Staff__c>();

        for (Leave__c leave : approvedLeaves) {

            Leave__c oldLeave =
                oldLeaves.get(leave.Id);

            // Only when Approved first time

            if (
                leave.Status__c == 'Approved' &&
                oldLeave.Status__c != 'Approved'
            ) {

                Staff__c staff =
                    staffMap.get(
                        leave.Staff__c
                    );

                if (staff == null) {
                    continue;
                }

                // =============================================
                // Annual Leave
                // =============================================

                if (
                    leave.Type_of_Leave__c ==
                    'Annual Leave'
                ) {

                    staff.Annual_Leave__c -=
                        leave.Duration__c;

                    if (
                        staff.Annual_Leave__c < 0
                    ) {

                        staff.Annual_Leave__c = 0;
                    }
                }

                // =============================================
                // Parental Leave
                // =============================================

                else if (
                    leave.Type_of_Leave__c ==
                    'Parental Leave'
                ) {

                    staff.Parental_Leave__c -=
                        leave.Duration__c;

                    if (
                        staff.Parental_Leave__c < 0
                    ) {

                        staff.Parental_Leave__c = 0;
                    }
                }

                // =============================================
                // Sick Leave
                // =============================================

                else if (
                    leave.Type_of_Leave__c ==
                    'Sick leave'
                ) {

                    staff.Sick_Leave__c -=
                        leave.Duration__c;

                    if (
                        staff.Sick_Leave__c < 0
                    ) {

                        staff.Sick_Leave__c = 0;
                    }
                }

                // =============================================
                // Bereavement Leave
                // =============================================

                else if (
                    leave.Type_of_Leave__c ==
                    'Bereavement Leave'
                ) {

                    staff.Bereavement_Leave__c -=
                        leave.Duration__c;

                    if (
                        staff.Bereavement_Leave__c < 0
                    ) {

                        staff.Bereavement_Leave__c = 0;
                    }
                }

                staffToUpdate.add(staff);
            }
        }

        // =====================================================
        // 4. Update Staff Records
        // =====================================================

        if (!staffToUpdate.isEmpty()) {

            update staffToUpdate;
        }

        // =====================================================
        // 5. Send Notifications
        // =====================================================

        for (Leave__c leave : approvedLeaves) {

            Leave__c oldLeave =
                oldLeaves.get(leave.Id);

            // Status Changed

            if (
                leave.Status__c !=
                oldLeave.Status__c
            ) {

                // Approved / Rejected / Cancelled

                if (
                    leave.Status__c == 'Approved' ||
                    leave.Status__c == 'Rejected' ||
                    leave.Status__c == 'Cancelled'
                ) {

                    try {

                        NotificationServices.sendLeaveStatusNotification( leave.Id);

                    } catch (Exception e) {

                        System.debug(
                            'Notification Error => ' +
                            e.getMessage()
                        );
                    }
                }
            }
        }
    }

    // =====================================================
    // PREVENT DUPLICATE LEAVES
    // =====================================================

    public static void preventDuplicateleaves(
        List<Leave__c> newLeaves
    ) {

        if (newLeaves.isEmpty()) {
            return;
        }

        Set<Id> staffIds =
            new Set<Id>();

        for (Leave__c leave : newLeaves) {

            if (leave.Staff__c != null) {

                staffIds.add(
                    leave.Staff__c
                );
            }
        }

        List<Leave__c> existingLeaves = [

            SELECT Id,
                   Staff__c,
                   From__c,
                   To__c,
                   Status__c

            FROM Leave__c

            WHERE Staff__c IN :staffIds
            AND Status__c IN (
                'Requested',
                'Approved'
            )
        ];

        for (Leave__c newLeave : newLeaves) {

            for (Leave__c existingLeave :
                existingLeaves
            ) {

                if (
                    existingLeave.Staff__c ==
                    newLeave.Staff__c &&

                    existingLeave.Id !=
                    newLeave.Id &&

                    newLeave.From__c <=
                    existingLeave.To__c &&

                    newLeave.To__c >=
                    existingLeave.From__c
                ) {

                    newLeave.From__c.addError(
                        'Leave request with overlapping dates already exists.'
                    );
                }
            }
        }
    }
} */