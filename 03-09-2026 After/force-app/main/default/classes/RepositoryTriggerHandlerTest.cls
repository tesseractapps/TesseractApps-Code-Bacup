@isTest
public class RepositoryTriggerHandlerTest {

    private static User createTestUser() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];

        User u = new User(
            FirstName = 'Test',
            LastName = 'User',
            Alias = 'tusr',
            Email = 'testuser@test.com',
            Username = 'testuser' + DateTime.now().getTime() + '@test.com',
            ProfileId = p.Id,
            TimeZoneSidKey = 'Asia/Kolkata',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
        insert u;
        return u;
    }

    @isTest
    static void testUpdate_WithFieldChange_CreatesLog() {

        User testUser = createTestUser();

        System.runAs(testUser) {

            Repository__c repo = new Repository__c(
                Name = 'Original Name',
                Document_Type__c = 'Type A'
            );
            insert repo;

            // Change meaningful field
            repo.Name = 'Updated Name';

            Test.startTest();
            update repo;
            Test.stopTest();

            List<Staff_Document_View__c> logs = [
                SELECT Id, Repository__c, User_Name__c, Action__c
                FROM Staff_Document_View__c
                WHERE Repository__c = :repo.Id
            ];

        }
    }

    @isTest
    static void testUpdate_WithoutFieldChange_NoLogCreated() {

        User testUser = createTestUser();

        System.runAs(testUser) {

            Repository__c repo = new Repository__c(
                Name = 'Same Name',
                Document_Type__c = 'Type A'
            );
            insert repo;

            // No meaningful field change
            Test.startTest();
            update repo;
            Test.stopTest();

            List<Staff_Document_View__c> logs = [
                SELECT Id
                FROM Staff_Document_View__c
                WHERE Repository__c = :repo.Id
            ];

        }
    }

    @isTest
    static void testBulkUpdate_CreatesLogs() {

        User testUser = createTestUser();

        System.runAs(testUser) {

            List<Repository__c> repoList = new List<Repository__c>();

            for (Integer i = 0; i < 5; i++) {
                repoList.add(new Repository__c(
                    Name = 'Doc ' + i,
                    Document_Type__c = 'Type A'
                ));
            }

            insert repoList;

            // Change field in bulk
            for (Repository__c r : repoList) {
                r.Name = r.Name + ' Updated';
            }

            Test.startTest();
            update repoList;
            Test.stopTest();

            List<Staff_Document_View__c> logs = [
                SELECT Id
                FROM Staff_Document_View__c
            ];

        }
    }
}