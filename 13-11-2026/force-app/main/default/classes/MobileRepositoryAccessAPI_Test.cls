@IsTest
private class MobileRepositoryAccessAPI_Test {

    @IsTest
    static void testGetConsentRequired() {

        // 🔥 Reuse base data
        TestDataFactory.createBaseData();

        User u = [
            SELECT Id 
            FROM User 
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        // Create repository + attachment
        Repository__c repo = new Repository__c(
            Name = 'Repo Test',
            Document_Type__c = 'Policy'
        );
        insert repo;

        Repository_Attachment__c att = new Repository_Attachment__c(
            Repository__c = repo.Id,
            File_Name__c = 'file.pdf'
        );
        insert att;

        // Create security privilege
        Security_Privilege__c sp = new Security_Privilege__c(
            User__c = u.Id,
            Repository__c = repo.Id,
            Repository_Attachment__c = att.Id,
            View__c = true,
            Consent_Required__c = true
        );
        insert sp;

        System.runAs(u){

            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();

            req.requestURI = '/services/apexrest/repositoryAccess/';
            req.httpMethod = 'GET';
            req.addParameter('repositoryId', repo.Id);
            req.addParameter('repositoryAttachmentId', att.Id);

            RestContext.request = req;
            RestContext.response = res;

            Test.startTest();
            MobileRepositoryAccessAPI.getUsersWithPermissions();
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetNoConsent() {

        TestDataFactory.createBaseData();

        User u = [
            SELECT Id 
            FROM User 
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        Repository__c repo = new Repository__c(
            Name = 'Repo2',
            Document_Type__c = 'Policy'
        );
        insert repo;

        System.runAs(u){

            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();

            req.requestURI = '/services/apexrest/repositoryAccess/';
            req.httpMethod = 'GET';
            req.addParameter('repositoryId', repo.Id);
            req.addParameter('repositoryAttachmentId', 'a00000000000000AAA');

            RestContext.request = req;
            RestContext.response = res;

            Test.startTest();
            MobileRepositoryAccessAPI.getUsersWithPermissions();
            Test.stopTest();
        }
    }

    @IsTest
    static void testPostConsentSuccess() {

        TestDataFactory.createBaseData();

        User u = [
            SELECT Id 
            FROM User 
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        Repository__c repo = new Repository__c(
            Name = 'Repo3',
            Document_Type__c = 'Policy'
        );
        insert repo;

        Repository_Attachment__c att = new Repository_Attachment__c(
            Repository__c = repo.Id,
            File_Name__c = 'file.pdf'
        );
        insert att;

        System.runAs(u){

            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();

            Map<String,Object> body = new Map<String,Object>{
                'repositoryId' => repo.Id,
                'attachmentId' => att.Id
            };

            req.httpMethod = 'POST';
            req.requestURI = '/services/apexrest/repositoryAccess/';
            req.requestBody = Blob.valueOf(JSON.serialize(body));

            RestContext.request = req;
            RestContext.response = res;

            Test.startTest();
            MobileRepositoryAccessAPI.handleConsentActions();
            Test.stopTest();
        }
    }

    @IsTest
    static void testPostMissingFields() {

        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();

        Map<String,Object> body = new Map<String,Object>{
            'repositoryId' => null
        };

        req.httpMethod = 'POST';
        req.requestURI = '/services/apexrest/repositoryAccess/';
        req.requestBody = Blob.valueOf(JSON.serialize(body));

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileRepositoryAccessAPI.handleConsentActions();
        Test.stopTest();
    }
}