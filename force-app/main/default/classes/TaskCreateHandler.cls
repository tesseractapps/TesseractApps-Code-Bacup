/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-18-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class TaskCreateHandler {
    @AuraEnabled
    public static list<User> listOfUsers(String recordId){
         User u = [SELECT Id, Name,Organization_Name__c FROM User WHERE ID =:UserInfo.getUserId()];
        return [select id,name from User WHERE Organization_Name__c =:u.Organization_Name__c];
    }

    @AuraEnabled
    public static String getOrgName(){
        User u = [SELECT Id, Name,Organization_Name__c FROM User WHERE ID =:UserInfo.getUserId()];
        return u.Organization_Name__c;
    }

    @AuraEnabled
    public static Organisation__c getOrgLogo(){
        User u1 = [SELECT Id, Name,Organization_Name__c FROM User WHERE ID =:UserInfo.getUserId()];
        Organisation__c logo = [select id,Name,ABN__c,Contact_No__c from Organisation__c WHERE Name=:u1.Organization_Name__c];//Organization_Logo__c
		
        //Made by maheswari 17-04-2024 commented line no-26 to 33 and 35
        /* Matcher imgMatcher = Pattern.compile( '<p(.+?)>' ).matcher( logo.Organization_Logo__c );
        string decodedURL;
        // iterate each image tag found
        while ( imgMatcher.find() ) {
            String imageTag = imgMatcher.group(); String imageURL = imageTag.substringBetween( ' src="', '"' );
            decodedURL = imageURL.unescapeHtml4();
        }*/
        
		return logo;
        //return decodedURL; to get the contact number in organization
    }
    
    @AuraEnabled
    public static void createTaskRecord(String userId,String statusValue,String subjectValue,
                                        String priorityValue, String dueDateValue,String commentsValue){
                                            Task taskRec = new Task();
                                            taskRec.OwnerId=userId;
                                            taskRec.Status=statusValue;
                                            taskRec.Subject=subjectValue;
                                            taskRec.Priority=priorityValue;
                                            if(String.isNotBlank(dueDateValue)){
                                                taskRec.ActivityDate=Date.valueOf(dueDateValue);
                                            }
                                            taskRec.Description=commentsValue;
                                            insert taskRec;
                                        }
}