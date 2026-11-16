@IsTest
private class mobileAppSignInForms_Test {

    /* -----------------------------------------------------------
       Utility Method → Get First Valid Picklist Value
    ------------------------------------------------------------*/
    private static String getPicklistValue(String fieldName) {

        Schema.DescribeFieldResult fieldResult =
            Dynamic_Form__c.SObjectType.getDescribe()
            .fields.getMap().get(fieldName).getDescribe();

        List<Schema.PicklistEntry> values = fieldResult.getPicklistValues();

        return values.isEmpty() ? null : values[0].getValue();
    }

    /* -----------------------------------------------------------
       Utility Method → Create Test Dynamic Forms
    ------------------------------------------------------------*/
    private static List<Dynamic_Form__c> createTestForms(Integer count) {

        List<Dynamic_Form__c> formList = new List<Dynamic_Form__c>();

        String statusValue   = getPicklistValue('Status__c');
        String audienceValue = getPicklistValue('Audience__c');
        String formTypeValue = getPicklistValue('Form_Type__c');

        for(Integer i = 0; i < count; i++) {

            Dynamic_Form__c form = new Dynamic_Form__c();
            //form.Name = 'Test Form ' + i;
            form.Status__c = statusValue;
            form.Audience__c = audienceValue;
            form.Form_Type__c = formTypeValue;
            form.Form_JSON__c = '{"sample":"json"}';

            formList.add(form);
        }

        insert formList;
        return formList;
    }

    /* -----------------------------------------------------------
       Test → Success Scenario
    ------------------------------------------------------------*/
    @IsTest
    static void testGetTaskDetails_Success() {

        List<Dynamic_Form__c> forms = createTestForms(2);

        String idParam = forms[0].Id + ',' + forms[1].Id;

        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/signInForms';
        req.httpMethod = 'GET';
        req.addParameter('formIdList', idParam);

        RestResponse res = new RestResponse();

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        mobileAppSignInForms.getTaskDetails();
        Test.stopTest();
    }

    /* -----------------------------------------------------------
       Test → Missing Parameter
    ------------------------------------------------------------*/
    @IsTest
    static void testGetTaskDetails_MissingParam() {

        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/signInForms';
        req.httpMethod = 'GET';

        RestResponse res = new RestResponse();

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        mobileAppSignInForms.getTaskDetails();
        Test.stopTest();
    }

    /* -----------------------------------------------------------
       Test → Invalid ID
    ------------------------------------------------------------*/
    @IsTest
    static void testGetTaskDetails_InvalidId() {

        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/signInForms';
        req.httpMethod = 'GET';
        req.addParameter('formIdList', 'a000000000000000AAA');

        RestResponse res = new RestResponse();

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        mobileAppSignInForms.getTaskDetails();
        Test.stopTest();
    }
}