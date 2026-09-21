trigger JobApplicationTrigger on Job_Application__c (After insert,After update) {
    if(trigger.isAfter && trigger.isUpdate){
     Set<Id> ids= New Set<Id>();
        for(Job_Application__c stf:trigger.new){
            Job_Application__c oldStaff = trigger.oldMap.get(stf.Id);
             if(stf.Application_status__c!=oldStaff.Application_status__c && stf.Application_status__c=='Interview successful' ){
               	 String name=stf.First_Name__c+' '+stf.Last_Name__c;	
                 EmailServiceForStaff.sendingEmail('raja94reddy@gmail.com',stf.Email_Address__c,stf.Application_status__c,name);
            }
         }
    }
}