public class CurrentUserOrganization {
    public static String currentOrgId(){
        String orgId;
        User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        List<Organisation__c> orgNames = [Select id from Organisation__c where name=:objUser.Organization_Name__c]; // Can include multiple fields, 
        if(orgNames.size()>0){
            orgId=orgNames[0].Id;
        }
        return orgId;
    }
    
}