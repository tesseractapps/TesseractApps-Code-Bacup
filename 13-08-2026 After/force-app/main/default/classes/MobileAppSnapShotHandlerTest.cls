@isTest
private class MobileAppSnapShotHandlerTest {
    @testSetup
    static void testData() {
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
        
        Organisation__c org1 = new Organisation__c();
        org1.Name='Ashfield Consultants';
        org1.ABN__c='11234567891';
        org1.ACN__c='878787878';
        org1.Contact_No__c='6132899740';
        org1.RCTI__c='RCTI1';
        org1.Email__c='dsfdsfsd@gmail.com';
        org1.Bank__c='Bank Test';
        org1.BSB__c='BSB Test';
        org1.Account_Name__c='Test Account';
        org1.Account_Number__c='1111111111';
        org1.Description__c='test Desc';
        org1.Address_Latest__Street__s='101';
        org1.Address_Latest__City__s='Himas Waterhen';
        org1.Address_Latest__PostalCode__s='2060';
        org1.Address_Latest__CountryCode__s='AU';
        org1.Address_Latest__StateCode__s='NSW';
        org1.NDIS_Provider__c='12341234565';
        org1.BMSI_Identifier__c ='TEST BMSI';
        org1.SoftwareId__c = 'jhdfn18328';
        org1.Branch_code__c = 'BS123';
        org1.Contact_Name__c = 'Test Contact';
        org1.User_Type__c = 'NDIS Org Admin';
        insert org1;   
        List<Offer_Template__c> offerList = new List<Offer_Template__c>();
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user) { 
        	Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='34567898765';
            fac.Phone__c = '12323213';
            insert fac;
                        
           Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4139562@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Annual_Leave__c=10;
            staff.Sick_Leave__c=2;
            staff.Bereavement_Leave__c=10;
            staff.Parental_Leave__c=3;
            insert staff; 
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff1';
            staff1.Name='praveen1';
            staff1.Name__c='abcdr';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.4139561@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='990845829528';
            staff1.Emp_exit_date__c = date.newInstance(2027, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2026, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Annual_Leave__c=10;
            staff1.Sick_Leave__c=2;
            staff1.Bereavement_Leave__c=10;
            staff1.Parental_Leave__c=3;
            insert staff1; 
            
            Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant2948';
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
            cli.Email__c='manualtesting.4139559@hotmail.com';
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
            cli.Status__c=true;
            cli.Medications__c = 'Test Medication';
            cli.Allergies__c = 'Test Allergies';
            cli.Notes__c = 'Test Notes';
            cli.Accessible_Forms__c = 'Test Accessible Form';
            cli.Unavailable_Date__c = Date.newInstance(2025, 05, 16);
            insert cli;
            
            Client__c cli1 =  new Client__c();
            cli1.First_Name__c = 'Test Lucas';
            cli1.Last_Name__c = 'Participant2948';
            cli1.Gendar__c = 'Male';
            cli1.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli1.Address__Street__s='8 Keewong Street';
            cli1.Address__City__s = 'Crace';
            cli1.Address__StateCode__s='ACT';
            cli1.Address__PostalCode__s='2911';
            cli1.Contact_Number__c='4331237651';
            cli1.Drivers_Licence__c = '123456789012';
            cli1.Primay_Contact_First_Name__c='Jason';
            cli1.Primay_Contact_Last_Name__c='Smith';
            cli1.Relationship__c='Parent';
            cli1.Email__c='manualtesting.4139558@hotmail.com';
            cli1.Primary_Contact_Number__c='0433123123';
            cli1.Facility__c=fac.id;
            cli1.Status__c=true;
            cli1.Medications__c = 'Test Medication';
            cli1.Allergies__c = 'Test Allergies';
            cli1.Notes__c = 'Test Notes';
            cli1.Accessible_Forms__c = 'Test Accessible Form';
            cli1.Unavailable_Date__c = Date.newInstance(2025, 05, 16);
            insert cli1;
            
            RestRequest req = new RestRequest();
            req.requestUri = '/services/apexrest/ParticipantSnapShotAPI/';
            req.httpMethod = 'GET';
            req.params.put('participantID', cli.Id);
            RestContext.request = req;
            RestContext.response = new RestResponse();
    
            Test.startTest();
                MobileAppSnapShotHandler.getParticipantSnapShot(); 
            Test.stopTest();
    
            // Verify
            String responseBody = RestContext.response.responseBody.toString();
            System.debug('Response: ' + responseBody);
            System.assert(responseBody.contains('"success":true'));
            System.assert(responseBody.contains('SnapShotDetails'));
        }
    }


    @isTest
    static void testUpdateCheckListdata_emptyBody() {
        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/ParticipantSnapShotAPI/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('');
        RestContext.request = req;
        RestContext.response = new RestResponse();

        MobileAppSnapShotHandler.updateCheckListdata();

        String body = RestContext.response.responseBody.toString();
        System.assert(body.contains('cannot be empty'));
    }

    @isTest
    static void testUpdateCheckListdata_missingParticipantID() {
        MobileAppSnapShotHandler.StatusRequest status = new MobileAppSnapShotHandler.StatusRequest();
        status.notes = 'Missing participant ID test';
        status.isAvailable = false;

        String jsonBody = JSON.serialize(status);

        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/ParticipantSnapShotAPI/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(jsonBody);
        RestContext.request = req;
        RestContext.response = new RestResponse();

        MobileAppSnapShotHandler.updateCheckListdata();

        String body = RestContext.response.responseBody.toString();
        System.assert(body.contains('participantID is required'));
    }
    
    @isTest
static void testUpdateCheckListdata_success() {

    Client__c cli = [SELECT Id FROM Client__c LIMIT 1];

    MobileAppSnapShotHandler.StatusRequest status =
        new MobileAppSnapShotHandler.StatusRequest();

    status.participantID = cli.Id;
    status.isAvailable = true;
    status.isUnavailable = false;
    status.medications = 'Test Med';
    status.allergies = 'Test Allergy';
    status.notes = 'Test Notes';
    status.unavailableDate = Date.today();

    String jsonBody = JSON.serialize(status);

    RestRequest req = new RestRequest();
    req.requestUri = '/services/apexrest/ParticipantSnapShotAPI/';
    req.httpMethod = 'POST';
    req.requestBody = Blob.valueOf(jsonBody);

    RestContext.request = req;
    RestContext.response = new RestResponse();

    Test.startTest();
    MobileAppSnapShotHandler.updateCheckListdata();
    Test.stopTest();

    String body = RestContext.response.responseBody.toString();
 
}
}