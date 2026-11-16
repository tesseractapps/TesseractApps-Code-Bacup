@isTest
public class EmployeeManagementHandlerTest {
    static testMethod void hrHanlderTest(){
        Test.startTest();
        Organisation__c org = OrgDetailsTest.createOrganization();
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
        List<Staff__c> staffList = StaffControllerTest.createStaff(facilityList[0].id);
        String facilityId = staffList[0].Facility__c;
        
        System.debug('facilityId '+facilityId);
		String listOfsearchString='[{"fname":"test","lname":"Lang","contact":"00011","dob":"01/06/1983","email":"aa@gmail.com","etype":"Fulltime","tfn":"tfn","acc":"acc","efname":"efname","elname":"elname","relation":"relation","econtact":"11111","eemail":"a@gmail.com","acname":"accc","acnumber":"11111","bsb":"bsb","sname":"sname","snumber":"11111","facname": ' +' "'+ facilityId + '" '+ ' ,"street":"101","city":"Himas Waterhen","state":"NSW","country":"AU","postalcode":"2060"}]';
        EmployeeManagementHandler.createEmployeeRecord(listOfsearchString);
        Test.stopTest();
    }


}