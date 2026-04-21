@IsTest
public class MobileAppShiftsTypeByFacilityApiTest {

    @IsTest
    static void testGetShiftsTypeByFacility_Success() {
                Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
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
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
        
        Facility__c fac = new Facility__c();
		fac.Name='Ashfield Consultants';
		fac.Address__City__s='Crace';
		fac.Address__Street__s = '8 Keewong Street';
		fac.Address__StateCode__s='ACT';
		fac.Address__PostalCode__s='2911';
		fac.Address__CountryCode__s='AU';
		fac.Email__c= 'testonefacility@gmail.com';
		fac.Status__c=true;
		fac.Organisation__c= org.Id;
		fac.ABN__c='12234567';
		fac.Phone__c = '12323432';
		fac.ABN__c='12234567';
		fac.Phone__c = '12323432';
		fac.Type_of_Service__c='Ndis';
		insert fac;
        
        // Create Shift Type
        Shift_Type__c shift = new Shift_Type__c(
            Name = 'Test Shift',
            Facility__c = fac.Id,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c = Time.newInstance(17, 0, 0, 0),
            Shift_Type__c = 'General',
            Type_of_Shift__c = 'Default'
        );
        insert shift;
        
        Custom_Shift_Timings__c customShift = new Custom_Shift_Timings__c(
            Name = 'Custom Morning A',
            Shift_Type__c = 'Morning', // 👈 Important: Link to parent
            Start_Time__c = Time.newInstance(8, 0, 0, 0),
            End_Time__c = Time.newInstance(12, 0, 0, 0),
            Custom_Shift_Type__c = shift.Id,
            Index__c = 1
        );
        insert customShift;
        
		// Prepare REST Context
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/ShiftsTypeByFacility/';
        req.httpMethod = 'GET';
        req.params.put('facilityId', fac.Id);
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        MobileAppShiftsTypeByFacilityApi.getShiftsTypeByFacility();
        Test.stopTest();

        String jsonResponse = RestContext.response.responseBody.toString();
        System.debug('API Response: ' + jsonResponse);

        Map<String, Object> resultMap = (Map<String, Object>) JSON.deserializeUntyped(jsonResponse);
        System.assertEquals(true, resultMap.get('isSuccess'));
        System.assertEquals('Shift types fetched successfully', resultMap.get('message'));

        List<Object> shifts = (List<Object>) resultMap.get('shifts');
        System.assert(shifts.size() > 0, 'There should be at least one shift returned');
    }
    
     @IsTest
    static void testMissingFacilityId() {
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/ShiftsTypeByFacility/';
        req.httpMethod = 'GET';
        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        MobileAppShiftsTypeByFacilityApi.getShiftsTypeByFacility();
        Test.stopTest();

        String jsonResponse = RestContext.response.responseBody.toString();
        Map<String, Object> resultMap = (Map<String, Object>) JSON.deserializeUntyped(jsonResponse);

        System.assertEquals(false, resultMap.get('isSuccess'));
        System.assertEquals('Facility Id is required', resultMap.get('message'));
        System.assertEquals(400, RestContext.response.statusCode);
    }
}