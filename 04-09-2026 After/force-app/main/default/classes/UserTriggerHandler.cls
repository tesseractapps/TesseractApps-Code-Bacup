public class UserTriggerHandler {
   public static void assignPermissionSets(Set<Id> userIds) {

        List<User> users = [
            SELECT Id,
                   Profile.Name
            FROM User
            WHERE Id IN :userIds
        ];

        // Permission Set Names required
        Set<String> permissionSetNames = new Set<String>{
            'Wyzed_API_Access',
            'Wyzed_API_Access_Portal_User'
        };

        Map<String, Id> permissionSetMap = new Map<String, Id>();

        for (PermissionSet ps : [
            SELECT Id, Name
            FROM PermissionSet
            WHERE Name IN :permissionSetNames
        ]) {
            permissionSetMap.put(ps.Name, ps.Id);
        }

        // Existing assignments
        Map<Id, Set<Id>> existingAssignments = new Map<Id, Set<Id>>();

        for (PermissionSetAssignment psa : [
            SELECT AssigneeId, PermissionSetId
            FROM PermissionSetAssignment
            WHERE AssigneeId IN :userIds
        ]) {

            if (!existingAssignments.containsKey(psa.AssigneeId)) {
                existingAssignments.put(psa.AssigneeId, new Set<Id>());
            }

            existingAssignments.get(psa.AssigneeId).add(psa.PermissionSetId);
        }

        List<PermissionSetAssignment> assignmentsToInsert = new List<PermissionSetAssignment>();

        for (User u : users) {

            String permissionSetName;

            if (u.Profile.Name == 'System Administrator') {
                permissionSetName = 'Wyzed_API_Access';
            } else {
                permissionSetName = 'Wyzed_API_Access_Portal_User';
            }

            Id permissionSetId = permissionSetMap.get(permissionSetName);

            if (permissionSetId == null) {
                continue;
            }

            if (!existingAssignments.containsKey(u.Id)) {
                existingAssignments.put(u.Id, new Set<Id>());
            }

            if (!existingAssignments.get(u.Id).contains(permissionSetId)) {

                assignmentsToInsert.add(
                    new PermissionSetAssignment(
                        AssigneeId = u.Id,
                        PermissionSetId = permissionSetId
                    )
                );
            }
        }

        if (!assignmentsToInsert.isEmpty()) {
            insert assignmentsToInsert;
        }
    }
}