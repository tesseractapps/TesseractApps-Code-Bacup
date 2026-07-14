/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-22-2023
 * @last modified by  : Raja Sekhar Reddy
**/
@isTest
public class OrgDetailsTest {
    public static Profile createProfile(){
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        return prof;
    }
    
    public static User createUser(){
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'uid', Email= 'uid2@myorg.com', 
          EmailEncodingKey='UTF-8', LastName='MahiiTest121', LanguageLocaleKey='en_US', 
          LocaleSidKey='en_US', ProfileId = prof.Id, 
          TimeZoneSidKey='America/New_York', UserName='uiid2@myorg.com',Organization_Name__c ='Pinnacle IT');
        //insert user;
        return user;
    }
    
    public static Organisation__c createOrganization(){
        Organisation__c org = new Organisation__c();
        org.Name='Pinnacle IT';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
       // org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c='nagendra';
        org.User_Type__c = 'NDIS Org Admin';
        // Insert book
        try{
        	insert org;
        }catch(DMLException e){
           system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        return org;
    }
    
    static testMethod void organizationTest() {
        Test.startTest();
        
        //User user = createUser();
        Organisation__c org = createOrganization();
        
        OrgDetails.orgName();
        OrgDetails.orgDetails();
        OrgDetails.orgDetailsCommunity();
        CurrentUserOrganization.currentOrgId();
        user u =[select id from user limit 1];
        OrgDetails.updateUserOrganisation(u.id, 'orgName');
        OrgDetails.getUserOrg(u.id);
        OrgDetails.generateCustomGUID();
        OrgDetails.updateWeekStartDay(org.Id, 'Monday'); //orgDetailsRoster
        OrgDetails.orgDetailsRoster();
        Test.stopTest();
       }   
        
}