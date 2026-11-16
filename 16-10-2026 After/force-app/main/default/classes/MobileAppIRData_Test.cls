@isTest
private class MobileAppIRData_Test {

    @testSetup
    static void setupData() {

        Boolean oldBypass = TriggerUtility.bypassTrigger;
        TriggerUtility.bypassTrigger = true;

        try{
            Organisation__c org = new Organisation__c(
                Name='Ashfield Consultants',
                ABN__c='11234567891',
                ACN__c='878787878',
                Contact_No__c='6132899740',
                RCTI__c='RCTI1',
                Email__c='org@test.com',
                Bank__c='Bank Test',
                BSB__c='BSB Test',
                Account_Name__c='Test Account',
                Account_Number__c='1111111111',
                Description__c='test Desc',
                Address_Latest__Street__s='101',
                Address_Latest__City__s='City',
                Address_Latest__PostalCode__s='2060',
                Address_Latest__CountryCode__s='AU',
                Address_Latest__StateCode__s='NSW',
                NDIS_Provider__c='12341234565',
                BMSI_Identifier__c ='TEST BMSI',
                SoftwareId__c = 'jhdfn18328',
                Branch_code__c = 'BS123',
                Contact_Name__c = 'Test Contact',
                User_Type__c = 'NDIS Org Admin'
            );
            insert org;

            Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
            String unique = String.valueOf(System.currentTimeMillis());

            User restUser = new User(
                Alias='restu',
                Email='rest'+unique+'@test.com',
                EmailEncodingKey='UTF-8',
                LastName='REST',
                LanguageLocaleKey='en_US',
                LocaleSidKey='en_US',
                ProfileId=prof.Id,
                TimeZoneSidKey='America/New_York',
                UserName='rest'+unique+'@test.com',
                Organization_Name__c='Ashfield Consultants'
            );
            insert restUser;

            System.runAs(restUser){

                Facility__c fac = new Facility__c(
                    Name='Ashfield Consultants',
                    Address__City__s='Crace',
                    Address__Street__s='8 Keewong Street',
                    Address__StateCode__s='ACT',
                    Address__PostalCode__s='2911',
                    Address__CountryCode__s='AU',
                    Email__c='fac@test.com',
                    Status__c=true,
                    Organisation__c=org.Id,
                    ABN__c='12345678901',
                    Phone__c='12323213'
                );
                insert fac;

                Staff__c staff = new Staff__c(
                    Name='staff1',
                    Last_Name__c='Test staff',
                    Name__c='abcd',
                    Contact_Number__c='56789908743',
                    Email_Address__c=restUser.Email,
                    Facility__c=fac.Id,
                    Status__c=true,
                    Address__Street__s='Street',
                    Address__City__s='City',
                    Address__StateCode__s='ACT',
                    Address__PostalCode__s='2911',
                    Emergency_Phone_Number__c='45678766675',
                    Primary_Contact_Name__c='Praveen',
                    Primary_Contact_Number__c='9908458298',
                    Make_Primary_as_Approver__c=true,
                    Primary_Contact_Email__c='a@test.com',
                    Secondary_Contact_Name__c='b',
                    Secondary_Contact_Email__c='b@test.com',
                    Make_Secondary_as_Approver__c=false,
                    Secondary_Contact_Number__c='99084582958',
                    Emp_exit_date__c=date.newInstance(2028,1,5),
                    Emp_Start_Date__c=date.newInstance(2023,2,1),
                    Payee_ETP_Payment_Date__c=date.newInstance(2025,2,4),
                    Date_Of_Birth__c=date.newInstance(2001,2,4),
                    role__c='Admin',
                    Residency_Type__c='Australian',
                    Expiry_Date__c=date.newInstance(2025,2,19),
                    Type__c='Visa Status',
                    Working_Hours_Rate__c=50,
                    Annual_Leave__c=10,
                    Sick_Leave__c=2,
                    Bereavement_Leave__c=10,
                    Parental_Leave__c=3
                );
                insert staff;

                Client__c cli = new Client__c(
                    First_Name__c='Test',
                    Last_Name__c='Participant2948',
                    Gendar__c='Male',
                    Date_Of_Birth__c=Date.newInstance(1991,2,17),
                    Address__Street__s='8 Keewong Street',
                    Address__City__s='Crace',
                    Address__StateCode__s='ACT',
                    Address__PostalCode__s='2911',
                    Contact_Number__c='4331237651',
                    Drivers_Licence__c='123456789012',
                    Primay_Contact_First_Name__c='Jason',
                    Primay_Contact_Last_Name__c='Smith',
                    Relationship__c='Parent',
                    Email__c='participant@test.com',
                    Primary_Contact_Number__c='0433123123',
                    Facility__c=fac.Id,
                    Status__c=true,
                    Medications__c='Test Medication',
                    Allergies__c='Test Allergies',
                    Notes__c='Test Notes'
                );
                insert cli;

                insert new Staff_Facility__c(Staff__c=staff.Id, Facility__c=fac.Id, Active__c=true);
                insert new Participant_Facility__c(Participant__c=cli.Id, Facility__c=fac.Id, Active__c=true);
            }

        } finally {
            TriggerUtility.bypassTrigger = oldBypass;
        }
    }

    static User getRestUser(){
        return [SELECT Id FROM User WHERE Organization_Name__c='Ashfield Consultants' LIMIT 1];
    }

    static MobileAppIRData.IRResponse callAPI(String typeParam,String facilityId){
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/MobileAppIRData';
        req.httpMethod = 'GET';
        req.addParameter('type', typeParam);
        if(facilityId!=null) req.addParameter('facilityId', facilityId);
        RestContext.request = req;
        RestContext.response = new RestResponse();
        return MobileAppIRData.getIRData();
    }

    @isTest static void testFacilities(){
        System.runAs(getRestUser()){
            Test.startTest();
            callAPI('facility',null);
            Test.stopTest();
        }
    }

    @isTest static void testStaff(){
        System.runAs(getRestUser()){
            Id facId = [SELECT Id FROM Facility__c WHERE Name='Ashfield Consultants' LIMIT 1].Id;
            Test.startTest();
            callAPI('staff',facId);
            Test.stopTest();
        }
    }

    @isTest static void testParticipants(){
        System.runAs(getRestUser()){
            Id facId = [SELECT Id FROM Facility__c WHERE Name='Ashfield Consultants' LIMIT 1].Id;
            Test.startTest();
            callAPI('participant',facId);
            Test.stopTest();
        }
    }

    @isTest static void testLoggedInStaff(){
        System.runAs(getRestUser()){
            Test.startTest();
            callAPI('loggedInStaff',null);
            Test.stopTest();
        }
    }

    @isTest static void testInvalidFacilityId(){
        System.runAs(getRestUser()){
            Test.startTest();
            callAPI('staff','12345');
            Test.stopTest();
        }
    }

    @isTest static void testInvalidType(){
        System.runAs(getRestUser()){
            Test.startTest();
            callAPI('wrongType',null);
            Test.stopTest();
        }
    }
}