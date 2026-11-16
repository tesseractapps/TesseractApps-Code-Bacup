@IsTest
public class MobileIncidentFormHandlerTest {

    // =====================================================
    // BASE DATA
    // =====================================================

   /* @testSetup
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
        
    }*/
    

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
     @TestSetup
    static void testData() {

        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants12';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = 'BSB Test';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        org.Week_Start_Day__c = 'Monday';
        insert org;

        Profile prof = [
            SELECT Id, Name
            FROM Profile
            WHERE Name LIKE '%Admin%'
            LIMIT 1
        ];

        User user = new User(
            Alias = 'praveen',
            Email = 'manualtesting.612233142@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StaffOne612233142',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.612233142@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants12'
        );
        insert user;

        System.runAs(user) {

            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Consultants';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testonefacility@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '12345678912';
            fac.Phone__c = '12323432';
            insert fac;
 Client__c cli = new Client__c();
            cli.First_Name__c='Test';
            cli.Last_Name__c='Client';
            cli.Gendar__c='Male';
            cli.Date_Of_Birth__c=Date.newInstance(1991,2,17);
            cli.Address__Street__s='Street';
            cli.Address__City__s='City';
            cli.Address__StateCode__s='ACT';
            cli.Address__PostalCode__s='2911';
            cli.Contact_Number__c='4331237651';
            cli.Drivers_Licence__c='123456789012';
            cli.Primay_Contact_First_Name__c='Jason';
            cli.Primay_Contact_Last_Name__c='Smith';
            cli.Relationship__c='Parent';
            cli.Email__c='client@test.com';
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
            cli.Status__c=true;
            cli.Medications__c='Test';
            cli.Allergies__c='Test';
            cli.Notes__c='Test';
            cli.Accessible_Forms__c='Test';
            cli.Unavailable_Date__c=Date.newInstance(2025,5,16);
            insert cli;
            List<Staff__c> staffList = new List<Staff__c>();

            for (Integer i = 0; i <= 10; i++) {

                Staff__c staff = new Staff__c();

                staff.Last_Name__c = 'Test staff ' + i;
                staff.Name = 'praveen' + i;
                staff.Name__c = 'abcd' + i;
                staff.Contact_Number__c = '5678990874' + i;
                staff.Email_Address__c =
                    'manualtesting.612233142' + i + '@hotmail.com';
                staff.Facility__c = fac.Id;

                staff.Address__Street__s = '8 Keewong Street';
                staff.Address__City__s = 'Crace';
                staff.Address__StateCode__s = 'ACT';
                staff.Address__PostalCode__s = '2911';

                staff.Emergency_Phone_Number__c = '4567876667' + i;
                staff.Primary_Contact_Name__c = 'Praveen';
                staff.Primary_Contact_Number__c = '990845829' + i;
                staff.Make_Primary_as_Approver__c = true;
                staff.Primary_Contact_Email__c =
                    'praveenshesham.sp+' + i + '@gmail.com';

                staff.Secondary_Contact_Name__c = 'Maheswari';
                staff.Secondary_Contact_Email__c =
                    'maheswari.adabala+' + i + '@gmail.com';
                staff.Make_Secondary_as_Approver__c = false;
                staff.Secondary_Contact_Number__c = '9908458295' + i;

                staff.Emp_exit_date__c = Date.newInstance(2028, 1, 5);
                staff.Emp_Start_Date__c = Date.newInstance(2023, 2, 1);
                staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4);
                staff.Date_Of_Birth__c = Date.newInstance(2001, 2, 4);

                staff.Role__c = 'Admin';
                staff.Residency_Type__c = 'Australian';
                staff.Expiry_Date__c = Date.newInstance(2025, 2, 19);
                staff.Type__c = 'Visa Status';
                staff.Status__c = true;

                staff.Restrict_Set_Hours__c = true;
                staff.Set_Hours__c = 45;

                staff.Working_Hours_Rate__c = 50 + i;
                staff.Final_Overall_Rate__c = 150 + i;
                staff.Saturday_Hourly_Rate__c = 120 + i;
                staff.Sunday_Hourly_Rate__c = 130 + i;
                staff.Public_holiday_Hourly_Rate__c = 170 + i;

                staffList.add(staff);
            }

            insert staffList;

            List<StaffRole__c> staffRoles = new List<StaffRole__c>();

            for (Staff__c staff : staffList) {

                StaffRole__c sr = new StaffRole__c();

                sr.StaffRole_To_Staff__c = staff.Id;
                sr.RoleName__c = 'Admin';
                sr.Active__c = true;
                sr.Hourly_Rate__c = 50;
                sr.Afternoon_shift_Hourly_Rate__c = 60;
                sr.Night_shift_Hourly_Rate__c = 70;
                sr.Saturday_Hourly_Rate__c = 80;
                sr.Sunday_Hourly_Rate__c = 90;
                sr.Public_holiday_Hourly_Rate__c = 100;
                sr.Sleepover_Allowance__c = 40;

                staffRoles.add(sr);
            }

            insert staffRoles;

            List<Staff_Facility__c> staffFacilities =
                new List<Staff_Facility__c>();

            for (Staff__c staff : staffList) {

                Staff_Facility__c sf = new Staff_Facility__c();

                sf.Staff__c = staff.Id;
                sf.Facility__c = fac.Id;
                sf.Active__c = true;

                staffFacilities.add(sf);
            }

            insert staffFacilities;


            /*
             * Existing shift test data
             */

            Add_Shift__c shift = new Add_Shift__c();

            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c = true;
            shift.Start_Date__c = Date.newInstance(2027, 4, 29);
            shift.End_Date__c = Date.newInstance(2027, 4, 29);
            shift.Get_Facility__c = true;
            shift.Quantity__c = 5;
            shift.Start_Time__c = Time.newInstance(3, 30, 0, 0);
            shift.End_Time__c = Time.newInstance(10, 0, 0, 0);
            shift.Facility__c = fac.Id;
            shift.Status__c = 'Draft';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c = 'Night';

            insert shift;


            ShiftwithStaff__c staffs = new ShiftwithStaff__c();

            staffs.Add_Shift__c = shift.Id;
            staffs.Attendence__c = true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c = staffList[0].Id;
            staffs.Start_Date__c = Date.newInstance(2027, 4, 29);
            staffs.Shift_End_Date__c = Date.newInstance(2027, 4, 29);
            staffs.Shift_Start_Time__c = Time.newInstance(3, 30, 0, 0);
            staffs.Shift_End_Time__c = Time.newInstance(3, 30, 0, 0);
            staffs.Role__c = 'Admin';
            staffs.Status__c = 'Accepted';

            staffs.Log_In_Date_Time__c = Time.newInstance(4, 30, 0, 0);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 0, 0, 0);

            staffs.Is_long_Morning__c = true;
            staffs.Long_Morning_Start_Time__c = Time.newInstance(4, 30, 0, 0);
            staffs.Long_Morning_End_Time__c = Time.newInstance(10, 0, 0, 0);
            staffs.Long_Morning_Index__c = 0;
            staffs.Long_Morning_Hourly_Rate__c = 10;
            staffs.Long_Morning_Shift_Duartion__c = 10;
            staffs.Is_long_Morning_Next_Day_Start__c = false;
            staffs.Long_Morning_Start_Date_One__c =
                Date.newInstance(2027, 4, 29);

            staffs.Is_Long_Afternoon__c = true;
            staffs.Long_Afternoon_Start_Time__c =
                Time.newInstance(4, 30, 0, 0);
            staffs.Long_Afternoon_End_Time__c =
                Time.newInstance(10, 0, 0, 0);
            staffs.Long_Afternoon_Index__c = 0;
            staffs.Long_Afternoon_Hourly_Rate__c = 10;
            staffs.Long_Afternoon_Shift_Duartion__c = 10;
            staffs.Is_Long_Afternoon_Next_Day_Start__c = false;
            staffs.Long_Afternoon_Start_Date_One__c =
                Date.newInstance(2027, 4, 29);

            staffs.Is_Long_Night_Shift__c = true;
            staffs.Long_Night_Start_Time__c =
                Time.newInstance(4, 30, 0, 0);
            staffs.Long_Night_End_Time__c =
                Time.newInstance(10, 0, 0, 0);
            staffs.Long_Night_Index__c = 0;
            staffs.Long_Night_Hourly_Rate__c = 10;
            staffs.Long_Night_Shift_Duartion__c = 10;
            staffs.Is_Long_Night_Start_Next_Day__c = false;
            staffs.Long_Night_Start_Date__c =
                Date.newInstance(2027, 4, 29);

            insert staffs;


            /*
             * INCIDENT TEST DATA
             */

            Incident_Register_Response__c response =
                new Incident_Register_Response__c();

            response.Name__c = 'Test Incident';
            response.Status__c = 'Open';
            response.Severity__c = 'High';
            response.NDIS_Reportable__c = 'No';
            response.Next_Due__c = Date.today().addDays(5);
            response.Client_Id__c = null;
            response.Incident_Assigned_Staff__c = staffList[0].Id;
            response.History_Log__c = null;

            insert response;


            Incident_Investigation__c investigation =
                new Incident_Investigation__c();

            investigation.Incident_Response__c = response.Id;
            investigation.NDIS_Reportable__c = 'No';
            investigation.Assessment_Notes__c = 'Initial assessment';
            investigation.Findings_Summary__c = 'Initial findings';
            investigation.Status__c = 'In Progress';
            investigation.Assigned_Investigator__c = staffList[0].Id;
            investigation.Severity__c = 'High';
            investigation.Acknowledged__c = false;

            insert investigation;


            Incident_Corrective_Action__c action =
                new Incident_Corrective_Action__c();

            action.Incident_Investigation__c = investigation.Id;
            action.Action_Title__c = 'Test Corrective Action';
            action.Description__c = 'Test corrective action description';
            action.Assigned_Owner__c = staffList[0].Id;
            action.Due_Date__c = Date.today().addDays(7);
            action.Status__c = 'Open';

            insert action;


            Incident_Evidence__c evidence =
                new Incident_Evidence__c();

            evidence.Incident_Investigation__c = investigation.Id;
            evidence.Incident_Corrective_Action__c = action.Id;
            evidence.Attachment_Name__c = 'Test Attachment';
            evidence.File_Name__c = 'test.pdf';
            evidence.Type__c = 'PDF';
            evidence.Evidence_Type__c = 'Incident Evidence';
            evidence.Uploaded_By__c = staffList[0].Id;
            evidence.AWS_File_Key__c = 'test/key';
            evidence.AWS_File_URL__c =
                'https://example.com/test.pdf';

            insert evidence;


            Incident_NDIS_Submission__c submission =
                new Incident_NDIS_Submission__c();

            submission.Incident_Investigation__c = investigation.Id;
            submission.Submission_Type__c = 'Initial Notification';
            submission.Submitted_By__c = staffList[0].Id;
            submission.Submission_Date__c = Date.today();
            submission.Submission_Time__c =
                Time.newInstance(10, 30, 0, 0);
            submission.Reference_Number__c = 'TEST-001';
            submission.Summary_Notes__c = 'Test submission';

            insert submission;
        }
        
        Incident_Form__c form = new Incident_Form__c();
       
            form.Name__c = 'Default Incident';
            form.Form_Type__c = 'Incident Register';
            form.Org_Id__c = org.Id;
            form.Status__c = 'Published';
            form.DefaultIncident__c = true;
       
            insert form;
    }

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

    Incident_Form__c form = [SELECT Id ,Org_Id__c FROM Incident_Form__c LIMIT 1];
     Staff__c staff = [
        SELECT Id
        FROM Staff__c
        LIMIT 1
    ];

    Facility__c facility = [
        SELECT Id
        FROM Facility__c
        WHERE Organisation__c = :form.Org_Id__c
        LIMIT 1
    ];

    Client__c participant = [
        SELECT Id
        FROM Client__c
        LIMIT 1
    ];

   /* Map<String,Object> body =
        new Map<String,Object>{
            'formId' => form.Id,
            'status' => 'Submitted',
            'json'   => '{"test":"value"}'
        };*/
    List<Object> rows = new List<Object>{
        new Map<String,Object>{
            'cells' => new List<Object>{
                new Map<String,Object>{
                    'field' => new Map<String,Object>{
                        'label' => 'Participant',
                        'value' => String.valueOf(participant.Id)
                    }
                },
                new Map<String,Object>{
                    'field' => new Map<String,Object>{
                        'label' => 'Priority',
                        'value' => 'High'
                    }
                }
            }
        }
    };

    Map<String,Object> body = new Map<String,Object>{
        'formId'          => form.Id,
        'status'          => 'Submitted',
        'json'            => JSON.serialize(rows),
        'orgId'           => form.Org_Id__c,
        'assignedStaffId' => String.valueOf(staff.Id),
        'formType'        => 'Incident',
        'name'            => 'Test Incident',
        'facilityId'      => String.valueOf(facility.Id),
        'participantName' => 'Test Participant',
        'assignedToName'  => 'Test Staff',
        'priority'        => 'High'
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