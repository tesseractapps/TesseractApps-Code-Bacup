public with sharing class UserController {
    @AuraEnabled(cacheable=true)
    public static String getCurrentUserName() {        
        // Fetch the Name of the current logged-in user
        return [SELECT Name FROM User WHERE Id = :UserInfo.getUserId()].Name;
       
    }
}