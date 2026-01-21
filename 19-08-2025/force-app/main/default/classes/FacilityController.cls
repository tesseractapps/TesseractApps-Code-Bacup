/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @Test Class        : FacilityControllerTest
* @last modified on  : 07-14-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class FacilityController {
    @AuraEnabled
    public static List<Facility__c> fetchFacilitiesByOrgId(String recordId){
        if(recordId=='' || recordId ==null){
            User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
            List<Organisation__c> orgNames = [Select id, Name,ABN__c,ACN__c,NDIS_Provider__c,Contact_No__c,Email__c,Address__c from Organisation__c where name=:objUser.Organization_Name__c]; // Can include multiple fields, 
            if(orgNames.size()>0)
                recordId = orgNames[0].Id;
        }
        
        return [SELECT id,Name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Organisation__r.name,Picture__c,
                Manager_Name__c,Address__Street__s,
                Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,Use_Org_ABN__c,ABN__c
                FROM Facility__c where  Organisation__c  =: recordId order by name asc];
    }
    
    @AuraEnabled
    public static List<Facility__c> fetchFacilitiesByOrgIdCommunity(String recordId, String firstname){
         if(recordId=='' || recordId ==null){
            User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
            List<Organisation__c> orgNames = [Select id, Name,ABN__c,ACN__c,NDIS_Provider__c,Contact_No__c,Email__c,Address__c from Organisation__c where name=:objUser.Organization_Name__c]; // Can include multiple fields, 
            if(orgNames.size()>0)
                recordId = orgNames[0].Id;
        } 
        list<Facility__c> facilityList = new list<Facility__c>();
        System.debug('firstname '+firstname);        
        System.debug('recordId '+recordId);
        String trucatedStr = recordId.substring(0,15);
        String[] filters = new String[0];
        if(firstname !=NULL){
            string fname='%'+firstname+'%';
            filters.add('Name Like : fname');
        }       
        filters.add('Organisation__c = : trucatedStr');
        
        String query='SELECT id,Name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Picture__c,Organisation__r.name,Manager_Name__c,Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s,facility_status__c,Use_Org_ABN__c,ABN__c,BMS_Identifier__c,Software_Id__c,Agent_Name__c,Tax_Agency__c,Agent_Number__c,Afternoon_Shift_Color__c,Custom_Shift_Color__c,General_Shift_Color__c,Morning_Shift_Color__c,Night_Shift_Color__c,Sleepover_Shift_Color__c,Cost_per_Km_Fuel__c,';
               query+= 'Cost_per_Km_Electric__c,General_Shift_Start_Time__c,General_Shift_End_Time__c,Morning_Shift_Start_Time__c,Morning_Shift_End_Time__c,Afternoon_Shift_Start_Time__c,Afternoon_Shift_End_Time__c,Night_Shift_Start_Time__c,Night_Shift_End_Time__c,Custom_Shift_Start_Time__c,Custom_Shift_End_Time__c,Sleepover_Shift_Strat_Time__c,Sleepover_Shift_End_Time__c FROM Facility__c';
        if(filters.size() > 0) {
            query += ' WHERE ' + String.join(filters, ' AND ');
        } 
        system.debug('query>>>>'+query);           
        facilityList=Database.query(query);
        
        return facilityList;   
        
        //return [SELECT id,Name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Organisation__r.name,Manager_Name__c,Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s FROM Facility__c where  Organisation__c  =: recordId order by name asc];
    }
    
    
    @AuraEnabled
    public static void statusFacility(String IdValue,String status){
        Facility__c fact=new Facility__c(Id=IdValue);
        fact.Status__c=Boolean.valueOf(status);
        Update fact;
    }
    
    @AuraEnabled
    public static Facility__c getfacilityById(String facId) {
        if (String.isBlank(facId)) {
            throw new AuraHandledException('Invalid recordId');
        }
        system.debug('record id ==> ' + facId); 
        return [SELECT Id, Manager_Name__c ,Classification_Order__c,Classification_Value__c, Employment_Type_Order__c,Employment_Type_Value__c,Fatigue_Management_Order__c,Fatigue_Management_Value__c, Preferred_Staff_Order__c,General_Shift_Start_Time__c,General_Shift_End_Time__c,Morning_Shift_Start_Time__c,Morning_Shift_End_Time__c,Afternoon_Shift_Start_Time__c,Afternoon_Shift_End_Time__c,Night_Shift_Start_Time__c,Night_Shift_End_Time__c,Custom_Shift_Start_Time__c,Custom_Shift_End_Time__c,Sleepover_Shift_Strat_Time__c,Sleepover_Shift_End_Time__c, 
                                     General_Shift_Color__c,Afternoon_Shift_Color__c,Custom_Shift_Color__c,Morning_Shift_Color__c,Night_Shift_Color__c,Sleepover_Shift_Color__c, Preferred_Staff_Value__c, Risk_Index_Order__c, Risk_Index_Value__c,Radius_Order__c,Radius_Value__c FROM Facility__c WHERE Id =:facId];
    }

   /* @AuraEnabled
    public static Facility__c fetchFacility(String recordId){
        System.debug('facility id'+recordId);
        return [SELECT id,Name,Email__c,AddressData__c,Phone__c,Status__c,Services__c,Organisation__r.name,
                Manager_Name__c,Address__Street__s,
                Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s
                FROM Facility__c where  Id  =: recordId limit 1 ];
    } */
    
}