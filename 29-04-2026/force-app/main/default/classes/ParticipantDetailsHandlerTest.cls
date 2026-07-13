@isTest
public class ParticipantDetailsHandlerTest {   
    Static testMethod void TestClientData(){
        Client__c cli =  new Client__c();
        cli.First_Name__c = 'Test';
        cli.Last_Name__c = 'Participant';
        cli.Gendar__c = 'Male';
        cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
        cli.Address__Street__s='8 Keewong Street';
        cli.Address__City__s = 'Crace';
        cli.Address__StateCode__s='ACT';
        cli.Address__PostalCode__s='2911';
        cli.Contact_Number__c='4331237651';
        cli.Drivers_Licence__c = '123456789012';
        cli.Primay_Contact_First_Name__c='Jason';
        cli.Primay_Contact_Last_Name__c='Smith';
        cli.Relationship__c='Parent';
        cli.Primary_Contact_Number__c='0433123123';
        // clientList.add(cli);        
        insert cli;
        
        Client_Journel__c journel=new Client_Journel__c();
        journel.Client__c=cli.Id;
        journel.Notes_Type__c = 'Care Notes	';
        journel.Description__c = 'Test Care Notes Description';
        insert journel;
        
		string journel1 =NULL;      
        test.startTest();
        ParticipantDetailsHandler.listOfClientjounel(cli.Id);
        ParticipantDetailsHandler.saveDesc(cli.Id, journel.Id, journel.Description__c, journel.Notes_Type__c);
        ParticipantDetailsHandler.saveDesc(cli.Id, journel1,journel.Description__c, journel.Notes_Type__c);
        test.stopTest();
    }
    
    @isTest
    static void testCommunityPage() {
        String communityPrefix = Network.getNetworkId(); 
        //String communityUrl =Network.getLoginUrl(communityPrefix);
        Test.startTest();
        String communityUrl = ParticipantDetailsHandler.communityPage();
        Test.stopTest();        
    }
}