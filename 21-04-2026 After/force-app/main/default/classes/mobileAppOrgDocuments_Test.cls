@IsTest
private class mobileAppOrgDocuments_Test {

    @IsTest
    static void testRepository_HR_Admin_Access() {

        TestDataFactory.createBaseData();

        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        // Update user to HR Admin
        u.User_Type__c = 'HR Admin';
        update u;

        Organisation__c org = [
            SELECT Id FROM Organisation__c LIMIT 1
        ];

        // Create Repository
        Repository__c repo = new Repository__c(
            Name = 'Policy Repo',
            Organization__c = org.Id,
            Document_Type__c = 'Policies',
            Size__c = '10MB'
        );
        insert repo;

        // Create Attachment
        Repository_Attachment__c att = new Repository_Attachment__c(
            Repository__c = repo.Id,
            File_Name__c = 'file1.pdf',
            Awsurl__c = 'url',
            Size__c = '1MB'
        );
        insert att;

        // Create Security Privilege
        Security_Privilege__c sec = new Security_Privilege__c(
            User__c = u.Id,
            Repository__c = repo.Id,
            View__c = true,
            Edit__c = true,
            Delete__c = false
        );
        insert sec;

        System.runAs(u){

            RestRequest req = new RestRequest();
            req.requestUri = '/services/apexrest/repositoryDocuments';
            req.httpMethod = 'GET';

            RestContext.request = req;
            RestContext.response = new RestResponse();

            Test.startTest();
            mobileAppOrgDocuments.getRepositoryDocuments();
            Test.stopTest();
        }
    }


    @IsTest
    static void testRepository_NDIS_Org_Admin() {

        TestDataFactory.createBaseData();

        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        u.User_Type__c = 'NDIS Org Admin';
        update u;

        Organisation__c org = [
            SELECT Id FROM Organisation__c LIMIT 1
        ];

        Repository__c repo = new Repository__c(
            Name = 'Forms Repo',
            Organization__c = org.Id,
            Document_Type__c = 'Forms',
            Size__c = '20MB'
        );
        insert repo;

        Repository_Attachment__c att = new Repository_Attachment__c(
            Repository__c = repo.Id,
            File_Name__c = 'file2.pdf',
            Awsurl__c = 'url',
            Size__c = '2MB'
        );
        insert att;

        System.runAs(u){

            RestRequest req = new RestRequest();
            req.requestUri = '/services/apexrest/repositoryDocuments';
            req.httpMethod = 'GET';

            RestContext.request = req;
            RestContext.response = new RestResponse();

            Test.startTest();
            mobileAppOrgDocuments.getRepositoryDocuments();
            Test.stopTest();
        }
    }

@IsTest
static void testRepository_NoAccessUser() {

    TestDataFactory.createBaseData();

    User u = [
        SELECT Id, User_Type__c
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    // Dynamically fetch a valid picklist value 
    // that is NOT one of the privileged ones
    Schema.DescribeFieldResult fieldDesc =
        User.User_Type__c.getDescribe();

    for(Schema.PicklistEntry pe : fieldDesc.getPicklistValues()){

        String val = pe.getValue();

        if(val != 'HR Admin' &&
           val != 'Roster Manager' &&
           val != 'NDIS Staff' &&
           val != 'Facility Admin' &&
           val != 'NDIS Org Admin'){

            u.User_Type__c = val;
            break;
        }
    }

    update u;

    System.runAs(u){

        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/repositoryDocuments';
        req.httpMethod = 'GET';

        RestContext.request = req;
        RestContext.response = new RestResponse();

        Test.startTest();
        mobileAppOrgDocuments.getRepositoryDocuments();
        Test.stopTest();
    }
}
}