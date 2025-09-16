/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-22-2023
 * @last modified by  : Raja Sekhar Reddy
**/
@isTest
public class FacilityControllerTest {
    public static List<Facility__c> createFacility(String orgName){
        List<Facility__c> facilityList =  new List<Facility__c>();
        for(Integer i=0;i<=6;i++){
        Facility__c facility = new Facility__c();
        facility.Organisation__c = orgName;
        facility.Name='Pinnacle IT';
        facility.Phone__c='0433123456';
        facility.Services__c='Disability Care';
        facility.Manager_Name__c='Test Manager'+i;
        facility.Email__c='test@gmail.com';
        facility.Unit_Number__c='1234321';
        facility.Address__Street__s='101';
        facility.Address__City__s='Himas Waterhen';
        facility.Address__PostalCode__s='2060';
        facility.Address__CountryCode__s='AU';
        facility.Address__StateCode__s='NSW';
        facility.Status__c = true;
            facilityList.add(facility);
        }        
        try{
        	insert facilityList;
        }catch(DMLException e){
           system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        
        
        return facilityList;
    }
    static testMethod void facilityTest() {
        Test.startTest();
        String recordId;
        
        Organisation__c org = OrgDetailsTest.createOrganization();
        string OrgID=org.id;
        List<Facility__c> facility = createFacility(OrgID);
        String facName = facility[0].Name;
        FacilityController.fetchFacilitiesByOrgId(facility[0].Organisation__c);
        FacilityController.fetchFacilitiesByOrgIdCommunity(facility[0].Organisation__c,facName);
        FacilityController.statusFacility(facility[0].Id, 'false');
        FacilityController.getfacilityById(facility[0].Id);
        // FacilityController.getfacilityById('');
        //FacilityController.fetchFacility(facility[0].Id);
        //FacilityController.updateFacility(facility[0].Id,'name','false','1111111111','manger','Test Care','email@gmail.com','101','Himas Waterhen','province','AU','2060');
        recordId=null;
        FacilityController.fetchFacilitiesByOrgId(recordId);
        Test.stopTest();
    }

}