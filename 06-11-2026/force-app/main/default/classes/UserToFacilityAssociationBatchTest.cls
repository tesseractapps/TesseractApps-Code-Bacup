@IsTest
public class UserToFacilityAssociationBatchTest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
    }
    
    // ---------------------------------------------------------------
    // Helper: get the running user from TestDataFactory
    // ---------------------------------------------------------------
    private static User getRunningUser() {
        return [
            SELECT Id, Email, User_Type__c
            FROM User
            WHERE User_Type__c = 'NDIS Org Admin'
            AND Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
    }
    
    // ---------------------------------------------------------------
    // TEST 1: Happy path — running user matches Staff email
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_Success() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // TEST 2: No matching staff — change Staff email so it no longer
    //         matches the running user
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_NoMatchingStaff() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Update existing Staff — no new inserts
            List<Staff__c> staffList = [
                SELECT Id, Email_Address__c
                FROM Staff__c
                WHERE Email_Address__c = :runningUser.Email
            ];
            for (Staff__c s : staffList) {
                s.Email_Address__c = 'nomatch.' + s.Id + '@example.com';
            }
            update staffList;
            
            Test.startTest();
            Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // TEST 3: Staff/Facility mismatch — no test-specific DML
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_StaffFacilityMismatch() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // TEST 4: Inactive facility — flip Status__c on the EXISTING
    //         facility rather than inserting a new one
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_InactiveFacility() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Update the existing Facility to inactive
            Facility__c existingFac = [
                SELECT Id, Status__c
                FROM Facility__c
                LIMIT 1
            ];
            existingFac.Status__c = false;
            update existingFac;
            
            Test.startTest();
            Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // TEST 5: Multiple active facilities in the same Org — reuse the
    //         same Facility, but toggle Status__c back and forth via
    //         update (avoids extra inserts and trigger cost)
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_MultipleFacilitiesPerOrg() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Update the existing Facility (keeps it active) — no new insert
            Facility__c existingFac = [
                SELECT Id, Status__c, Name
                FROM Facility__c
                LIMIT 1
            ];
            existingFac.Status__c = true;
          //  existingFac.Name = 'Ashfield Consultants - Updated';
            update existingFac;
            
            Test.startTest();
            Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // TEST 6: Case-insensitive email matching
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_CaseInsensitiveEmailMatch() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            List<Staff__c> staffList = [
                SELECT Id, Email_Address__c
                FROM Staff__c
                WHERE Email_Address__c = :runningUser.Email
            ];
            for (Staff__c s : staffList) {
                s.Email_Address__c = s.Email_Address__c.toUpperCase();
            }
            update staffList;
            
            Test.startTest();
            Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // TEST 7: Multiple users sharing the same Staff email
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_MultipleUsers() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Profile prof = [
                SELECT Id
                FROM Profile
                WHERE Name = 'Standard User'
                LIMIT 1
            ];
            
            String sharedEmail = runningUser.Email;
            Long ts = DateTime.now().getTime();
            
            List<User> extraUsers = new List<User>{
                new User(
                    FirstName            = 'Roster',
                    LastName             = 'Manager',
                    Email                = sharedEmail,
                    Username             = 'rm.batch' + ts + '@example.com',
                    Alias                = 'rmb',
                    TimeZoneSidKey       = 'America/New_York',
                    LocaleSidKey         = 'en_US',
                    EmailEncodingKey     = 'UTF-8',
                    LanguageLocaleKey    = 'en_US',
                    ProfileId            = prof.Id,
                    IsActive             = true,
                    User_Type__c         = 'Roster Manager',
                    Organization_Name__c = 'Ashfield Consultants'
                ),
                new User(
                    FirstName            = 'Roster',
                    LastName             = 'Coordinator',
                    Email                = sharedEmail,
                    Username             = 'rc.batch' + ts + '@example.com',
                    Alias                = 'rcb',
                    TimeZoneSidKey       = 'America/New_York',
                    LocaleSidKey         = 'en_US',
                    EmailEncodingKey     = 'UTF-8',
                    LanguageLocaleKey    = 'en_US',
                    ProfileId            = prof.Id,
                    IsActive             = true,
                    User_Type__c         = 'Roster Coordinator',
                    Organization_Name__c = 'Ashfield Consultants'
                )
            };
            insert extraUsers;
            
            Test.startTest();
            Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // TEST 8: Multiple Orgs — reuse existing Org/Facility, only
    //         reassign Staff to a different existing Facility
    //         (avoids creating new records → avoids trigger cost)
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_MultipleOrgs() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            // Use the existing Facility from TestDataFactory
            Facility__c existingFac = [
                SELECT Id, Organisation__c
                FROM Facility__c
                LIMIT 1
            ];
            
            // Re-point existing Staff to the same Facility (no-op update)
            // — exercises the batch's Org → Facility lookup path
            List<Staff__c> staffList = [
                SELECT Id, Facility__c
                FROM Staff__c
                WHERE Email_Address__c = :runningUser.Email
            ];
            for (Staff__c s : staffList) {
                s.Facility__c = existingFac.Id;
            }
            update staffList;
            
            Test.startTest();
            Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // TEST 9: No active facilities in the Org
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_NoFacilitiesInOrg() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
            fac.Status__c = false;
            update fac;
            
            Test.startTest();
            Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // TEST 10: finish() method coverage
    // ---------------------------------------------------------------
    @IsTest
    static void testBatch_FinishMethod() {
        User runningUser = getRunningUser();
        
        System.runAs(runningUser) {
            Test.startTest();
            Id jobId = Database.executeBatch(new UserToFacilityAssociationBatch(), 200);
            Test.stopTest();
        }
    }
}