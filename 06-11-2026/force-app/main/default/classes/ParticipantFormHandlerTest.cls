@isTest
public class ParticipantFormHandlerTest {
     @testsetup Static void testData(){
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
        insert cli;
     }
    @isTest
    public static void testClientRec(){
        Client__c cli=[select id from Client__c];
        ParticipantFormHandler.getParticipantForm(cli.id);
        ParticipantFormHandler.getSelectedColumName(cli.id);
    }

}