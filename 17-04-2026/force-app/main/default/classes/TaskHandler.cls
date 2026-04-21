/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-12-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class TaskHandler {
    @AuraEnabled
    public static List<Task> taskDetails(){
        User objUser = [ SELECT Phone,Name, Id FROM User WHERE Id = : UserInfo.getUserId() ];
        List<Task> taskList=[select id,Subject,status,WhatId,ActivityDate,Owner.name,Completed__c,InProgressValue__c,NewValue__c,CreatedBy.SmallPhotoUrl from task where Owner.name = : objUser.Name ORDER BY CreatedDate DESC];
        return taskList;
    }
    
}