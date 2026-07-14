/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * Test Class         : OrgDetailsTest  
 * @last modified on  : 07-13-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class OrgDetails {
 
    @AuraEnabled(cacheable=true)
    public static List<sObject> orgName(){
        try {
            List<sObject> orgNames = new List<sObject>();
            orgNames = [Select id, Name from Organisation__c];
            return orgNames;
        } catch (Exception e) {return null;}
    }
     @AuraEnabled
    public static Organisation__c orgDetails(){
        try {
            Organisation__c orgNames= new Organisation__c();
            User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
            orgNames = [Select id, Name,ABN__c,ACN__c,NDIS_Provider__c,Contact_No__c,Email__c,Organization_Logo__c,Additional_Tax_Areas_Applicable_to_your__c,Accounting_Services__c,
            Address_Latest__Street__s,Address_Latest__City__s,Address_Latest__StateCode__s,	Ticketing_Members__c, Support_Email__c,Bank__c,Account_Number__c,Account_Name__c,BSB__c,Week_Start_Day__c,
            Address_Latest__PostalCode__s,Address_Latest__CountryCode__s,Type_of_User__c,Shift_Rejection_Hours__c,Provider_Travel_Daily_Kms_Limit__c,Provider_Travel_Max_Kms__c,Provider_Travel_Max_Minutes__c,Activity_Transport_Max_Kms__c,Participant_Preferred_Name_Formula__c,Facility_Preferred_Name_Formula__c, Premium_Client__c
            from Organisation__c where name=:objUser.Organization_Name__c]; // Can include multiple fields, 
            return orgNames;
        } catch (Exception e) {return null;}
    }
    
    @AuraEnabled(cacheable=true)
    public static Organisation__c orgDetailsCommunity(){
        try {
            Organisation__c orgNames= new Organisation__c();
            User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
            orgNames = [Select id, Name,ABN__c,ACN__c,NDIS_Provider__c,Contact_No__c,Email__c,Additional_Tax_Areas_Applicable_to_your__c,BMSI_Identifier__c,Accounting_Services__c,
                        Agent_Name__c,Tax_Agency__c,Agent_Number__c,SoftwareId__c,General_Shift_Start_Time__c,General_Shift_End_time__c,Morning_Shift_Start_Time__c,Morning_Shift_End_Time__c,
           Afternoon_Shift_Start_Time__c,Afternoon_Shift_End_Time__c,Night_Shift_Start_Time__c,Night_Shift_End_Time__c,Custom_Shift_Start_Time__c,Custom_Shift_End_Time__c,Sleepover_Start__c,Sleepover_Shift_End_Time__c, Address_Latest__Street__s,Address_Latest__City__s,Address_Latest__StateCode__s,
            Address_Latest__PostalCode__s,Address_Latest__CountryCode__s,Logo__c,Cost_per_KM__c,Cost_per_Km_Electric__c,Mileage_Amount__c,Xero_MYOB_Sync_Status__c,
            Generalshiftcolor__c,Morningshiftcolor__c,Afternoonshiftcolor__c,Nightshiftcolor__c,customshiftcolor__c,Type_of_User__c,Sleepover_Shift_Color__c,Week_Start_Day__c 
            from Organisation__c where name=:objUser.Organization_Name__c]; // Can include multiple fields, 
            return orgNames;
        } catch (Exception e) {return null;}
    }

     @AuraEnabled
    public static Organisation__c orgDetailsRoster(){
        try {
            Organisation__c orgNames= new Organisation__c();
            User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
            orgNames = [Select id, Name,ABN__c,ACN__c,NDIS_Provider__c,Contact_No__c,Email__c,Additional_Tax_Areas_Applicable_to_your__c,BMSI_Identifier__c,Accounting_Services__c,
                        Agent_Name__c,Tax_Agency__c,Agent_Number__c,SoftwareId__c,General_Shift_Start_Time__c,General_Shift_End_time__c,Morning_Shift_Start_Time__c,Morning_Shift_End_Time__c,
           Afternoon_Shift_Start_Time__c,Afternoon_Shift_End_Time__c,Night_Shift_Start_Time__c,Night_Shift_End_Time__c,Custom_Shift_Start_Time__c,Custom_Shift_End_Time__c,Sleepover_Start__c,Sleepover_Shift_End_Time__c, Address_Latest__Street__s,Address_Latest__City__s,Address_Latest__StateCode__s,
            Address_Latest__PostalCode__s,Address_Latest__CountryCode__s,Logo__c,Cost_per_KM__c,Cost_per_Km_Electric__c,Mileage_Amount__c,
            Generalshiftcolor__c,Morningshiftcolor__c,Afternoonshiftcolor__c,Nightshiftcolor__c,customshiftcolor__c,Type_of_User__c,Sleepover_Shift_Color__c,Week_Start_Day__c 
            from Organisation__c where name=:objUser.Organization_Name__c]; // Can include multiple fields, 
            return orgNames;
        } catch (Exception e) {return null;}
    }
  
    @AuraEnabled
    public static User updateUserOrganisation(Id userId, String orgName) {
        // Query the user record to update
        User userRecord = [SELECT Id, Organization_Name__c FROM User WHERE Id = :userId LIMIT 1];        
        // Update the organization name
        userRecord.Organization_Name__c = orgName;
        // Perform DML to update the record
        update userRecord;  
        return userRecord;

	}
    
    @AuraEnabled(cacheable=true)
    public static String getUserOrg(Id userId) {
        // Fetch the user's current organization
        User user = [SELECT Organization_Name__c FROM User WHERE Id = :userId LIMIT 1];
        return user.Organization_Name__c;
    }
      @AuraEnabled
     public static String generateCustomGUID() {
        String uuid = String.valueOf(UUID.randomUUID());
        
        // Extract the first 8 characters, then the next 4, then the next 4 to match the format
        String formattedGuid = uuid.substring(0, 8) + '-' + 
                               uuid.substring(9, 13) + '-' + 
                               uuid.substring(14, 18);
        
        return formattedGuid;
    }

    @AuraEnabled
    public static void updateWeekStartDay(Id orgId, String weekStartDay) {

        Organisation__c org = new Organisation__c(
            Id = orgId,
            Week_Start_Day__c = weekStartDay
        );

        update org;
    }

       @AuraEnabled
    public static void RejectedShiftSettings(Id orgId, Decimal rejectShiftHours) {

        Organisation__c org = new Organisation__c(
            Id = orgId,
            Shift_Rejection_Hours__c = rejectShiftHours
        );

        update org;
    }
    
}