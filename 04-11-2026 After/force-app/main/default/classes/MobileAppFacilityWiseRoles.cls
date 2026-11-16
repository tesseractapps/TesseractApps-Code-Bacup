@RestResource(urlMapping='/facilityWiseRoles/*')
global class MobileAppFacilityWiseRoles {
   @HttpGet
global static void getRolesByFacility() {
    RestResponse res = RestContext.response;
    Map<String, Object> responseMap = new Map<String, Object>();

    try {
        RestRequest req = RestContext.request;
        String facilityId = req.params.get('facilityId');

        if (String.isBlank(facilityId)) {
            responseMap.put('isSuccess', false);
            responseMap.put('message', 'Facility Id is required');
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            return;
        }

        // Fetch Roles for the facility
        List<Facility_Role__c> roleList = [
            SELECT Id, Name, Role_Name__c, Is_Active__c, Facility__c
            FROM Facility_Role__c
            WHERE Facility__c = :facilityId 
            AND Is_Active__c = true
            ORDER BY Role_Name__c ASC
        ];

        // Extract role names into array
        List<String> rolesArray = new List<String>();
        for (Facility_Role__c role : roleList) {
            rolesArray.add(role.Role_Name__c);
        }

        // Success Response
        responseMap.put('isSuccess', true);
        responseMap.put('message', 'Roles fetched successfully');
        responseMap.put('roles', rolesArray);
        res.statusCode = 200;

    } catch (Exception e) {
        responseMap.put('isSuccess', false);
        responseMap.put('message', 'Error fetching roles');
        responseMap.put('error', e.getMessage());
        res.statusCode = 500;
    }

    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
}
}