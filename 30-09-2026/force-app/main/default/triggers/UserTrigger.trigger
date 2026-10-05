trigger UserTrigger on User (after insert, after update) {

     if (Trigger.isAfter) {

        Set<Id> userIds = new Set<Id>();

        if (Trigger.isInsert) {
            for (User u : Trigger.new) {
                userIds.add(u.Id);
            }
        }

        if (Trigger.isUpdate) {
            for (User u : Trigger.new) {
                User oldUser = Trigger.oldMap.get(u.Id);

                // Only when user becomes active
                if (!oldUser.IsActive && u.IsActive) {
                    userIds.add(u.Id);
                }
            }
        }

        if (!userIds.isEmpty()) {
            UserTriggerHandler.assignPermissionSets(userIds);
        }
    }
}