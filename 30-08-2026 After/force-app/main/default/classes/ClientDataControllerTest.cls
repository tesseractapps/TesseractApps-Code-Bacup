/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-26-2023
 * @last modified by  : Raja Sekhar Reddy
**/
@isTest
public class ClientDataControllerTest {
    public static List<Client__c> createClient(){
        Organisation__c org = OrgDetailsTest.createOrganization();
        List<Facility__c> facility = FacilityControllerTest.createFacility(org.Name);
        List<Client__c> clientList = New List<Client__c>();
        for(Integer i=0;i<=6;i++){
        Client__c client = new Client__c();
        client.First_Name__c='Test'+i;
        client.Last_Name__c='Test';
        client.Gendar__c='Male';
        client.Date_Of_Birth__c=System.today();
        client.Status__c=true;
        client.Contact_Number__c='1234567898';
        client.Facility__c=facility[0].id;
        client.Address__Street__s='101';
        client.Address__City__s='Himas Waterhen';
        client.Address__PostalCode__s='2060';
        client.Address__CountryCode__s='AU';
        client.Address__StateCode__s='NSW';
        client.Primay_Contact_First_Name__c='pfname';
        client.Primay_Contact_Last_Name__c='plname';
        client.Secondary_Contact_First_Name__c='sfname';
        client.Secondary_Contact_Last_Name__c='slname';
        clientList.add(client);
        }        
        try{
            insert clientList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        return clientList;
    }
    static testMethod void clientTest() {
        Test.startTest();
        
        List<Client__c> clientListTest = createClient();
        String facilityId = clientListTest[0].Facility__c;
        Facility__c facility =[select id,name,Organisation__c from Facility__c where Id=:facilityId];
        System.debug('orgId '+facility.Organisation__c);
        ClientDataController.fetchFacilitiess(facility.Organisation__c,'Test1','Test');
        ClientDataController.statusClient(clientListTest[0].Id, 'false');
        
        
        Test.stopTest();
    }
    

    
}