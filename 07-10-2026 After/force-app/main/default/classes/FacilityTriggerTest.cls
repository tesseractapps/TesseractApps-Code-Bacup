@isTest
public class FacilityTriggerTest {

    @isTest
    static void testFacilityTriggerFlow() {

        Test.startTest();

        TestDataFactory.createBaseData();

        Facility__c existingFac = [
            SELECT Id, Name, Organisation__c
            FROM Facility__c
            LIMIT 1
        ];

        Facility__c f1 = new Facility__c();
        f1.Name = 'New Facility';
        f1.Organisation__c = existingFac.Organisation__c;
        f1.Address__City__s = 'Crace';
        f1.Address__Street__s = '8 Keewong Street';
        f1.Address__StateCode__s = 'ACT';
        f1.Address__PostalCode__s = '2911';
        f1.Address__CountryCode__s = 'AU';
        f1.Email__c = 'new1@gmail.com';
        f1.Status__c = true;
        f1.ABN__c = '34567898765';
        f1.Phone__c = '1234567890';
        f1.Type_of_Service__c = 'Ndis';
        insert f1;

        Facility__c duplicateFac = new Facility__c();
        duplicateFac.Name = f1.Name;
        duplicateFac.Organisation__c = f1.Organisation__c;
        duplicateFac.Address__City__s = 'Crace';
        duplicateFac.Address__Street__s = '8 Keewong Street';
        duplicateFac.Address__StateCode__s = 'ACT';
        duplicateFac.Address__PostalCode__s = '2911';
        duplicateFac.Address__CountryCode__s = 'AU';
        duplicateFac.Email__c = 'dup@gmail.com';
        duplicateFac.Status__c = true;
        duplicateFac.ABN__c = '12345678987';
        duplicateFac.Phone__c = '1234567891';
        duplicateFac.Type_of_Service__c = 'Ndis';

        try {
            insert duplicateFac;
        } catch (Exception e) {}

        f1.ABN__c = '99999999999';
        f1.Email__c = 'update@gmail.com';
        update f1;

        Test.stopTest();
    }
}