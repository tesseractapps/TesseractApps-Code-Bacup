public with sharing class HRTraining { 
    @AuraEnabled
    public static List<Training__c> getModules(String CurrentOrgId) {
        system.debug('CurrentOrgId' + CurrentOrgId);
        return [SELECT Id,name,FORMAT(start_date__c),FORMAT(end_date__c),description__c,Attachments__c,Courses__c FROM Training__c where Organization__c=:CurrentOrgId  order by LastModifiedDate desc];
    }
    @AuraEnabled
    public static List<Assignment__c> getAssignments(String CurrentOrgId) {
        system.debug('orgID ' + CurrentOrgId);
        List<Assignment__c> assignList= new List<Assignment__c>();
         String UserEmail = UserInfo.getUserEmail();
        string rolename = [select id,name from userrole where id=:UserInfo.getUserRoleId()].name;
        String query='SELECT Id,Module_Name__r.Name,Module_Name__r.Attachments__c,Staff__r.Name,Staff__r.Display_Nickname__c,Staff__r.Last_Name__c,Staff__r.Email_Address__c,Module_Name__r.description__c,Due_Date__c,Status__c,Completed_Date__c,Module_Name__r.Courses__c FROM Assignment__c where staff__r.facility__r.Organisation__c=:CurrentOrgId '; //where Organization_Name__c=:OrganizationName
         /*if( rolename == 'Portal Account Partner User'){
             system.debug('rolename '+rolename);
                     query += ' AND Staff__r.Email_Address__c =:UserEmail';    
         }*/ 
    
        query += ' Order by Due_Date__c desc';
        system.debug('query' + query);
     	 assignList =Database.query(query);
        system.debug(assignList);
        return assignList;
       
    }
    @AuraEnabled
    public static List<Assignment__c> getStaffAssignments(String CurrentOrgId) {
        system.debug('orgID ' + CurrentOrgId);
        List<Assignment__c> assignList= new List<Assignment__c>();
         String UserEmail = UserInfo.getUserEmail();
         String query='SELECT Id,Module_Name__r.Name,Module_Name__r.Courses__c,Module_Name__r.Attachments__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Staff__r.Email_Address__c,Module_Name__r.description__c,Due_Date__c,Status__c,Completed_Date__c FROM Assignment__c where staff__r.facility__r.Organisation__c=:CurrentOrgId AND Staff__r.Email_Address__c =:UserEmail Order by Due_Date__c desc '; //where Organization_Name__c=:OrganizationName
         system.debug('query' + query);
     	 assignList =Database.query(query);
        system.debug(assignList);
        return assignList;
       
    }
     @AuraEnabled
    public static List<Assignment__c> getStaffAssignmentsbyId(String staffId) {
        system.debug('staffId ' + staffId);
        List<Assignment__c> assignList= new List<Assignment__c>();
         String UserEmail = UserInfo.getUserEmail();
         String query='SELECT Id,Module_Name__r.Name,Module_Name__r.Attachments__c,Module_Name__r.Courses__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Email_Address__c,Module_Name__r.description__c,Due_Date__c,Status__c,Completed_Date__c FROM Assignment__c where staff__c=:staffId Order by Due_Date__c desc '; //where Organization_Name__c=:OrganizationName
         system.debug('query' + query);
     	 assignList =Database.query(query);
        system.debug(assignList);
        return assignList;
       
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Assignment__c> getAssignmentsById(Id recordId) {
        return [SELECT Id,Module_Name__r.Name,Module_Name__r.Attachments__c,Staff__r.Name,Staff__r.Last_Name__c,Staff__r.Display_Nickname__c,Staff__r.Email_Address__c,Module_Name__r.description__c,Due_Date__c,Status__c FROM Assignment__c where Staff__c  =: recordId Order by Due_Date__c desc];
 
       
    }

    @AuraEnabled
    public static void insertAssignRecords(String moduleID, List<String> selectedStaff, String OrganizationName) {
        List<Assignment__c> assignlist =new List<Assignment__c>();
        system.debug(OrganizationName);
        
        for(string sid:selectedStaff)
        {
            Assignment__c assignrec=new Assignment__c();
            assignrec.Staff__c=sid;
            assignrec.Module_Name__c=moduleID;
            assignrec.Status__c='Pending';
            assignrec.Organization_Name__c=OrganizationName;
            assignlist.add(assignrec);
        }
        system.debug('assig list'+assignlist);
       // Database.insert(assignlist,false);
       insert assignlist;
            
    }
     @AuraEnabled
    public static Id createTraining(String name, Date startDate, Date endDate, String description, String courses, String CurrentOrgId ) {
        system.debug('name'+name);
        system.debug('startDate'+startDate);
        system.debug('endDate'+endDate);
        system.debug('description'+description);
        system.debug('courses'+courses);
        Training__c training = new Training__c(
            Name = name,
            start_date__c = startDate,
            end_date__c = endDate,
            description__c = description,
            Courses__c = courses,
            Organization__c = CurrentOrgId
        );
        
        insert training;
        return training.Id;
    }
}