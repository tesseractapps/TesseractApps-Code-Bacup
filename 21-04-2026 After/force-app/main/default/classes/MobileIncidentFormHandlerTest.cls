@IsTest
public class MobileIncidentFormHandlerTest {

    // =====================================================
    // BASE DATA
    // =====================================================

    @testSetup
    static void setup() {

        TestDataFactory.createBaseData();

        Organisation__c org =
            [SELECT Id, Name FROM Organisation__c LIMIT 1];

     insert new Incident_Form__c(
    Name__c = 'Default Incident',
    Form_Type__c = 'Incident Register',
    Org_Id__c = org.Id,
    Status__c = 'Published',
    DefaultIncident__c = true
);
        
    }

    // =====================================================
    // AWS PUT MOCK
    // =====================================================

  /*  class AwsPutMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse r = new HttpResponse();
            r.setStatusCode(200);
            r.setBody('OK');
            return r;
        }
    }*/

    // =====================================================
    // GET — ADMIN FLOW
    // =====================================================

    @IsTest
    static void testGet_AdminFlow() {

        Organisation__c org =
            [SELECT Id, Name FROM Organisation__c LIMIT 1];

        Profile p =
            [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        User adminUser =
            new User(
                Alias = 'adm1',
                Email = 'admin1@test.com',
                Username =
                    'admin1@test.com.' +
                    System.currentTimeMillis(),
                LastName = 'Admin',
                TimeZoneSidKey = 'Australia/Sydney',
                LocaleSidKey = 'en_AU',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = p.Id,
                User_Type__c = 'NDIS Org Admin',
                Organization_Name__c = org.Name
            );
        insert adminUser;

        System.runAs(adminUser) {

            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();

            req.requestUri =
                '/services/apexrest/IncidentForms';
            req.httpMethod = 'GET';

            RestContext.request = req;
            RestContext.response = res;

            Test.startTest();
            MobileIncidentFormHandler.handleGet();
            Test.stopTest();

        }
    }

    // =====================================================
    // GET — STAFF FLOW
    // =====================================================

    @IsTest
    static void testGet_StaffFlow() {

        Organisation__c org =
            [SELECT Id, Name FROM Organisation__c LIMIT 1];

        Incident_Form__c form =
            [SELECT Id FROM Incident_Form__c LIMIT 1];

        Profile p =
            [SELECT Id FROM Profile WHERE Name LIKE '%Standard%' LIMIT 1];

        // 🔥 dynamic NON-admin user type
        String staffType;

        for (Schema.PicklistEntry pe :
            User.User_Type__c.getDescribe().getPicklistValues()) {

            if (pe.getValue() != 'NDIS Org Admin'
                && pe.getValue() != 'Roster Manager') {

                staffType = pe.getValue();
                break;
            }
        }

        if (staffType == null) {
            staffType =
                User.User_Type__c.getDescribe()
                    .getPicklistValues()[0]
                    .getValue();
        }

        User staffUser =
            new User(
                Alias = 'stf1',
                Email = 'staff1@test.com',
                Username =
                    'staff1@test.com.' +
                    System.currentTimeMillis(),
                LastName = 'Staff',
                TimeZoneSidKey = 'Australia/Sydney',
                LocaleSidKey = 'en_AU',
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                ProfileId = p.Id,
                User_Type__c = staffType,
                Organization_Name__c = org.Name
            );
        insert staffUser;

        // 🔥 reuse staff from factory
        Staff__c staff =
            [SELECT Id FROM Staff__c LIMIT 1];

        staff.User__c = staffUser.Id;
        staff.Accessible_Forms__c = form.Id;
        update staff;

        System.runAs(staffUser) {

            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();

            req.requestUri =
                '/services/apexrest/IncidentForms';
            req.httpMethod = 'GET';

            RestContext.request = req;
            RestContext.response = res;

            Test.startTest();
            MobileIncidentFormHandler.handleGet();
            Test.stopTest();

        }
    }
    @IsTest
static void testGet_SingleForm() {

    Incident_Form__c form =
        [SELECT Id FROM Incident_Form__c LIMIT 1];

    RestRequest req = new RestRequest();
    RestResponse res = new RestResponse();

    req.requestUri =
        '/services/apexrest/IncidentForms/' + form.Id;
    req.httpMethod = 'GET';

    RestContext.request = req;
    RestContext.response = res;

    Test.startTest();
    MobileIncidentFormHandler.handleGet();
    Test.stopTest();
}

/*class AwsMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse r = new HttpResponse();
        r.setStatusCode(200);
        r.setBody('OK');
        return r;
    }
}*/
  @IsTest
static void testSubmitIncidentResponse() {

    Test.setMock(HttpCalloutMock.class, new AwsMock());

    Incident_Form__c form =
        [SELECT Id FROM Incident_Form__c LIMIT 1];

    Map<String,Object> body =
        new Map<String,Object>{
            'formId' => form.Id,
            'status' => 'Submitted',
            'json'   => '{"test":"value"}'
        };

    RestRequest req = new RestRequest();
    RestResponse res = new RestResponse();

    req.httpMethod = 'POST';
    req.requestUri =
        '/services/apexrest/IncidentForms';
    req.requestBody =
        Blob.valueOf(JSON.serialize(body));

    RestContext.request = req;
    RestContext.response = res;

    Test.startTest();
    MobileIncidentFormHandler.submitIncidentResponse();
    Test.stopTest();
}  
@IsTest
static void testDeleteIncidentResponse() {

    Test.setMock(HttpCalloutMock.class, new AwsMock());

    Incident_Form__c form =
        [SELECT Id FROM Incident_Form__c LIMIT 1];

    String validStatus;

    for (Schema.PicklistEntry pe :
         Incident_Register_Response__c.Status__c
             .getDescribe()
             .getPicklistValues()) {

        validStatus = pe.getValue();
        break;
    }

    Incident_Register_Response__c rec =
        new Incident_Register_Response__c(
            Incident_Form__c = form.Id,
            Status__c = validStatus,
            Response_JSON__c =
                '{"bucket":"docimgupld","key":"deleteKey"}'
        );
    insert rec;

    RestRequest req = new RestRequest();
    RestResponse res = new RestResponse();

    req.httpMethod = 'DELETE';
    req.requestUri =
        '/services/apexrest/IncidentForms/' + rec.Id;

    RestContext.request = req;
    RestContext.response = res;

    Test.startTest();
    MobileIncidentFormHandler.deleteIncidentResponse();
    Test.stopTest();
}
@IsTest
static void testGet_ResponsesBranch() {

    Incident_Form__c form =
        [SELECT Id FROM Incident_Form__c LIMIT 1];

    // 🔥 Dynamically fetch valid Status__c value
    String validStatus;

    for (Schema.PicklistEntry pe :
        Incident_Register_Response__c.Status__c
            .getDescribe()
            .getPicklistValues()) {

        validStatus = pe.getValue();
        break;
    }

    Incident_Register_Response__c resp =
        new Incident_Register_Response__c(
            Incident_Form__c = form.Id,
            Status__c = validStatus,
            Response_JSON__c =
                '{"bucket":"docimgupld","key":"test"}'
        );
    insert resp;

    RestRequest req = new RestRequest();
    RestResponse res = new RestResponse();

    req.requestUri =
        '/services/apexrest/IncidentForms/responses';
    req.httpMethod = 'GET';

    RestContext.request = req;
    RestContext.response = res;

    Test.startTest();
    MobileIncidentFormHandler.handleGet();
    Test.stopTest();
}
    @IsTest
static void testUpdateIncidentResponse_Coverage() {

    Test.setMock(HttpCalloutMock.class, new AwsMock());

    // Get existing form
    Incident_Form__c form =
        [SELECT Id FROM Incident_Form__c LIMIT 1];

    // Get valid status dynamically
    String validStatus;
    for (Schema.PicklistEntry pe :
        Incident_Register_Response__c.Status__c
            .getDescribe()
            .getPicklistValues()) {

        validStatus = pe.getValue();
        break;
    }

    // Insert response with valid AWS JSON
    Incident_Register_Response__c rec =
        new Incident_Register_Response__c(
            Incident_Form__c = form.Id,
            Status__c = validStatus,
            Response_JSON__c =
                '{"bucket":"docimgupld","key":"testkey"}'
        );
    insert rec;

    // Prepare PUT body
    Map<String,Object> body =
        new Map<String,Object>{
            'status' => validStatus,
            'json'   => '{"updated":"yes"}'
        };

    RestRequest req = new RestRequest();
    RestResponse res = new RestResponse();

    req.httpMethod = 'PUT';
    req.requestUri =
        '/services/apexrest/IncidentForms/' + rec.Id;
    req.requestBody =
        Blob.valueOf(JSON.serialize(body));

    RestContext.request = req;
    RestContext.response = res;

    Test.startTest();
    MobileIncidentFormHandler.updateIncidentResponse();
    Test.stopTest();
}
    class AwsMock implements HttpCalloutMock {

    public HTTPResponse respond(HTTPRequest req) {

        HttpResponse res = new HttpResponse();

        // 🔹 Mock presign URL call
        if (req.getMethod() == 'GET' || req.getMethod() == 'POST') {

            res.setStatusCode(200);
            res.setBody(
                '{"uploadUrl":"https://dummy-upload.com","key":"testkey"}'
            );
            return res;
        }

        // 🔹 Mock S3 PUT upload
        if (req.getMethod() == 'PUT') {

            res.setStatusCode(200);
            res.setBody('OK');
            return res;
        }

        res.setStatusCode(200);
        res.setBody('OK');
        return res;
    }
}
}