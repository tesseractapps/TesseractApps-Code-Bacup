@RestResource(urlMapping='/IssueRegisterStaffRoleApi/')
global  class MobileIssueRegisterStaffRole {
      @HttpGet
    global static Map<String, List<String>> getStaffRoleApi(){
         String UserEmail = UserInfo.getUserEmail(); 
        list<staff__c> stafflist =StaffController.getStaffByEmail(UserEmail);
         List<String> userRole = new List<String>();
        if (!staffList.isEmpty() && staffList[0].Role__c != null) {
            userRole = staffList[0].Role__c.split(';');
        }
      
        Map<String, List<String>> mapOfUserRole = new Map<String, List<String>>();
        List<String> issueRegisterStatus = new List<String>{'Open', 'In-Progress', 'Resolved'};
        
        if (!userRole.isEmpty()) {
            mapOfUserRole.put((userRole.isEmpty() ? 'No Roles Found' : userRole[0]), issueRegisterStatus);
        }
           System.debug('Map of User Role to Status: ' + mapOfUserRole);
        return mapOfUserRole;
        
    }

}