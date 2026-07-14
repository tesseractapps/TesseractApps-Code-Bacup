/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-12-2023
* @last modified by  : Raja Sekhar Reddy
**/
public without sharing class TaskHandler {
   /*  @AuraEnabled
    public static List<Task> taskDetails(){
        User objUser = [ SELECT Phone,Name, Id FROM User WHERE Id = : UserInfo.getUserId() ];
        List<Task> taskList=[select id,Subject,status,WhatId,ActivityDate,Owner.name,Completed__c,InProgressValue__c,NewValue__c,CreatedBy.SmallPhotoUrl,CreatedBy.Name from task where Owner.name = : objUser.Name ORDER BY CreatedDate DESC];
        return taskList;
    } */

@AuraEnabled
public static List<Map<String,Object>> taskDetails() {

    User objUser = [ SELECT Phone,Name, Id FROM User WHERE Id = : UserInfo.getUserId() ];

    List<Task> taskList = [select id,Subject,status,WhatId,ActivityDate,Owner.name,Completed__c,InProgressValue__c,NewValue__c,CreatedBy.SmallPhotoUrl,CreatedBy.Name from task where Owner.name = : objUser.Name ORDER BY CreatedDate DESC];

    Set<Id> userIds = new Set<Id>();

    for(Task t : taskList){
        userIds.add(t.CreatedById);
    }

    // Get Users
    Map<Id, User> userMap = new Map<Id, User>(
        [SELECT Id, Name, Email, SmallPhotoUrl
         FROM User
         WHERE Id IN :userIds]
    );

    // Get Staff by Email
    Set<String> emails = new Set<String>();

    for(User u : userMap.values()){
        if(u.Email != null){
            emails.add(u.Email);
        }
    }

    Map<String, Staff__c> staffMap = new Map<String, Staff__c>();

    for(Staff__c st : [
       SELECT Id, Display_Nickname__c,Email_Address__c,picture__c FROM Staff__c
        WHERE Email_Address__c IN :emails
    ]){
        staffMap.put(st.Email_Address__c, st);
    }

    List<Map<String,Object>> result = new List<Map<String,Object>>();

    for(Task t : taskList){

        User u = userMap.get(t.CreatedById);
        Staff__c st = u != null ? staffMap.get(u.Email) : null;

        Map<String,Object> row = new Map<String,Object>();

        row.put('Id', t.Id);
        row.put('Subject', t.Subject);
        row.put('Status', t.Status);
        row.put('WhatId', t.WhatId);
        row.put('ActivityDate', t.ActivityDate);
        row.put('OwnerName', t.Owner.Name);
        row.put('Completed__c', t.Completed__c);
        row.put('InProgressValue__c', t.InProgressValue__c);
        row.put('NewValue__c', t.NewValue__c);
        row.put('CreatedById', t.CreatedById);

        row.put('staffName', st != null ? st.Display_Nickname__c : '');
        row.put('profileImage', st != null ? st.picture__c : '');

        result.add(row);
    }

    return result;
}
    
}