/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-22-2023
 * @last modified by  : Raja Sekhar Reddy
**/
@isTest
public class HrHomeHandlerTest {
    public static List<Advertisement__c> createAdvertisements(String facilityId){
       
        List<Advertisement__c> adsList = new List<Advertisement__c>();
        for(Integer i=0;i<=3;i++){
            Advertisement__c adrecord =new Advertisement__c();
            adrecord.Facility_Name__c = facilityId;
            adrecord.Start_Date__c = system.today();
            adrecord.End_Date__c = System.today().addDays(30);
            adrecord.Job_description__c ='job description'+i;
            adrecord.Job_Title__c='job title';
            adrecord.Location__c='New South Wales';
            adrecord.Roles_and_Responsibilities__c = 'roles';
            //adrecord.User__c=userId;
            adrecord.Contract_type__c ='Full time';
            adsList.add(adrecord);
        }
         try{
            insert adsList;
        }catch(DMLException e){
            system.assertEquals(e.getMessage(), e.getMessage()); 
        }
        
        return adsList;
    }
    static testMethod void hrHanlderTest() {
        Test.startTest();
        Organisation__c org = OrgDetailsTest.createOrganization();
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
        System.debug(facilityList[0]);
        Organisation__c orgRec =[select id,name from Organisation__c where id=:facilityList[0].Organisation__c];
        List<Staff__c> staffRec = new List<Staff__c>();
        staffRec = StaffControllerTest.createStaff(facilityList[0].id);
        
        String facility = staffRec[0].Facility__c;
        List<Advertisement__c> adList = createAdvertisements(facility);
        String userId =adList[0].User__c;
        String sDate = String.valueOf(adList[0].Start_Date__c);
        String eDate = String.valueOf(adList[0].End_Date__c);
        HrHomeHandler.dummyData2();
        HrHomeHandler.dummyData();
        HrHomeHandler.createJobAds(adList[0].Job_Title__c,adList[0].Job_description__c,adList[0].Contract_type__c,facility,adList[0].Location__c,adList[0].Roles_and_Responsibilities__c,userId,sDate,eDate);
        HrHomeHandler.userDetials();
      //  HrHomeHandler.fetchFacilitiess();
       // HrHomeHandler.getEmployeeData();
       // HrHomeHandler.getJobAds();
        Test.stopTest();        
    }
@isTest
static void hrHanlderTest_fixed() {

    Organisation__c org = OrgDetailsTest.createOrganization();
    List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
    List<Staff__c> staffRec = StaffControllerTest.createStaff(facilityList[0].Id);

    Profile p = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1];

    User u = new User(
        Alias='tuser',
        Email='test@test.com',
        EmailEncodingKey='UTF-8',
        LastName='Test',
        LanguageLocaleKey='en_US',
        LocaleSidKey='en_US',
        ProfileId=p.Id,
        TimeZoneSidKey='Asia/Kolkata',
        UserName='testuser' + System.currentTimeMillis() + '@test.com',
        Organization_Name__c = org.Name
    );
    insert u;

    System.runAs(u) {
        Test.startTest();

        List<Advertisement__c> ads = createAdvertisements(facilityList[0].Id);
        HrHomeHandler.createJobAds(
            ads[0].Job_Title__c,
            ads[0].Job_description__c,
            ads[0].Contract_type__c,
            facilityList[0].Id,
            ads[0].Location__c,
            ads[0].Roles_and_Responsibilities__c,
            ads[0].User__c,
            String.valueOf(ads[0].Start_Date__c),
            String.valueOf(ads[0].End_Date__c)
        );

        HrHomeHandler.getEmployeeData();
        HrHomeHandler.getJobAds();
        HrHomeHandler.fetchFacilitiess();
        HrHomeHandler.fetchFacilitiessForRoster();
        HrHomeHandler.userDetials();
        HrHomeHandler.dummyData();
        HrHomeHandler.dummyData2();

        Test.stopTest();
    }
}



}