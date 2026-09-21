@isTest
public class SearchEmployeeHandlerTest {
    static testMethod void hrHanlderTest(){
        Test.startTest();
        StaffControllerTest.createStaff();
        String listOfsearchString='["Roger","Lang","00011","a4@gmail.com"]';
        SearchEmployeeHandler.getEmployee(listOfsearchString);
        Test.stopTest();
    }

}