/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-17-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class SearchEmployeeHandler {
    @AuraEnabled
    public static List<staff__c> getEmployee(String listOfsearchString){
        System.debug('listOfsearchString '+listOfsearchString);
        String orgId = CurrentUserOrganization.currentOrgId();
        String organizationId = orgId.substring(0,15);
        List<staff__c> listOfIssues = new List<staff__c>();
        List<String> obj=(List<String>)JSON.deserialize(listOfsearchString,List<String>.class);
        system.debug('Data'+obj);
        String[] filters = new String[0];
            if(obj.size()>0){
                if(obj[0]!=''){
                    string fname=obj[0]+'%';
                    filters.add('Name__c Like : fname');
                }
                if(obj[1]!=''){
                    string lName=obj[1]+'%';
                    system.debug('fName>>>'+lName);
                    filters.add('Last_Name__c Like : lname');
                }
                if(obj[2]!=''){
                    string phone=obj[2]+'%';
                    filters.add('Contact_Number__c Like : phone');
                }
                if(obj[3]!=''){
                    string email=obj[3]+'%';
                    filters.add('Email_Address__c Like : email');
                }
                
            }
           filters.add('Organization_Name__c  =: organizationId');
            String query='SELECT Id, Name__c,Last_Name__c, LastViewedDate,Contact_Number__c,Email_Address__c,Emergency_Phone_Number__c FROM staff__c ';
            if(filters.size() > 0) {
                query += ' WHERE ' + String.join(filters, ' AND ');
              }
              system.debug('query>>>>'+query);
            if(obj.size()>0){
            listOfIssues = Database.query(query);
            }
        else{
            listOfIssues = Database.query(query);
            }
            system.debug('listOfIssues>>>>'+listOfIssues.size());
        return listOfIssues;
    }

}