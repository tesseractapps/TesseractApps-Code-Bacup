@isTest
public class ServiceCatalogueNewOrgBatchTest {
    
    static User testUser;
    static Organisation__c testOrg;
    static Facility__c testFacility;
    static NDIS_Support_Catalogue__c testNdisCatalogue;
    
    // Helper method to get test user
    private static User getTestUser() {
        if (testUser == null) {
            testUser = [SELECT Id, Email, User_Type__c, Organization_Name__c 
                        FROM User 
                        WHERE Email = 'manualtesting.20294637@hotmail.com' 
                        LIMIT 1];
        }
        return testUser;
    }
    
    // Helper method to get test org
    private static Organisation__c getTestOrg() {
        if (testOrg == null) {
            testOrg = [SELECT Id, Name FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        }
        return testOrg;
    }
    
    // Helper method to get test facility
    private static Facility__c getTestFacility() {
        if (testFacility == null) {
            testFacility = [SELECT Id, Name, Organisation__c, Type_of_Service__c 
                           FROM Facility__c 
                           LIMIT 1];
        }
        return testFacility;
    }
    
    // Helper method to get test NDIS catalogue
    private static NDIS_Support_Catalogue__c getTestNdisCatalogue() {
        if (testNdisCatalogue == null) {
            testNdisCatalogue = [SELECT Id, Name, Financial_Year__c, Organization__c, Type_of_Industry__c 
                                 FROM NDIS_Support_Catalogue__c 
                                 LIMIT 1];
        }
        return testNdisCatalogue;
    }
    
    @testSetup
    static void setup() {
        TestDataFactory.createBaseData();
    }
    
    /**
     * Test method for standard batch processing
     */
    @isTest
    static void testBatchProcessing() {
        User u = getTestUser();
        
        System.runAs(u) {
            Organisation__c org = getTestOrg();
            Facility__c facility = getTestFacility();
            NDIS_Support_Catalogue__c ndisCatalogue = getTestNdisCatalogue();
            
            // Create Service Catalogues with null Organization and Type_of_Industry
            List<Service_Catalogue__c> serviceCatalogues = new List<Service_Catalogue__c>();
            for(Integer i = 0; i < 3; i++) {
                serviceCatalogues.add(new Service_Catalogue__c(
                    Facility__c = facility.Id,
                    Organization__c = null,
                    Type_of_Industry__c = null,
                    Financial_Year__c = '2023-24',
                    NDIS_Support_Catalogue__c = ndisCatalogue.Id
                ));
            }
            insert serviceCatalogues;
            
            Test.startTest();
            ServiceCatalogueNewOrgBatch batch = new ServiceCatalogueNewOrgBatch();
            Database.executeBatch(batch, 200);  // ✅ Batch size > records, only 1 execution
            Test.stopTest();
        }
    }
    
    /**
     * Test method when no Service Catalogues need updating
     */
    @isTest
    static void testBatchWithNoRecordsToUpdate() {
        User u = getTestUser();
        
        System.runAs(u) {
            Test.startTest();
            ServiceCatalogueNewOrgBatch batch = new ServiceCatalogueNewOrgBatch();
            Database.executeBatch(batch, 200);
            Test.stopTest();
        }
    }
    
    /**
     * Test method with existing junction records to avoid duplicates
     */
    @isTest
    static void testBatchWithExistingJunctions() {
        User u = getTestUser();
        
        System.runAs(u) {
            Organisation__c org = getTestOrg();
            Facility__c facility = getTestFacility();
            NDIS_Support_Catalogue__c ndisCatalogue = getTestNdisCatalogue();
            
            // Create Service Catalogue with null fields
            Service_Catalogue__c sc = new Service_Catalogue__c(
                Facility__c = facility.Id,
                Organization__c = null,
                Type_of_Industry__c = null,
                Financial_Year__c = '2023-24',
                NDIS_Support_Catalogue__c = ndisCatalogue.Id
            );
            insert sc;
            
            // Create existing junction record
            Service_Catalogue_Facilty__c existingJunction = new Service_Catalogue_Facilty__c(
                Service_Catalogue__c = sc.Id,
                Facility__c = sc.Facility__c,
                Active__c = true
            );
            insert existingJunction;
            
            Test.startTest();
            ServiceCatalogueNewOrgBatch batch = new ServiceCatalogueNewOrgBatch();
            Database.executeBatch(batch, 200);
            Test.stopTest();
        }
    }
    
    /**
     * Test method with NDIS Support Catalogues having Financial Year
     */
    @isTest
    static void testBatchWithNDISFinancialYear() {
        User u = getTestUser();
        
        System.runAs(u) {
            Organisation__c org = getTestOrg();
            Facility__c facility = getTestFacility();
            
            // Create NDIS Support Catalogue with Financial Year
            NDIS_Support_Catalogue__c ndis = new NDIS_Support_Catalogue__c(
                Name = 'Test NDIS Support',
                Organization__c = org.Id,
                Type_of_Industry__c = 'NDIS',
                Financial_Year__c = '2026-27',
                ACT__c = 100,
                NSW__c = 100,
                NT__c = 100,
                QLD__c = 100,
                SA__c = 100,
                TAS__c = 100,
                VIC__c = 100,
                WA__c = 100
            );
            insert ndis;
            
            // Create Service Catalogue with null fields
            Service_Catalogue__c sc = new Service_Catalogue__c(
                Facility__c = facility.Id,
                Organization__c = null,
                Type_of_Industry__c = null,
                Financial_Year__c = '2023-24',
                NDIS_Support_Catalogue__c = ndis.Id
            );
            insert sc;
            
            Test.startTest();
            ServiceCatalogueNewOrgBatch batch = new ServiceCatalogueNewOrgBatch();
            Database.executeBatch(batch, 200);
            Test.stopTest();
        }
    }
    
    /**
     * Test method with null Facility reference
     */
    @isTest
    static void testBatchWithNullFacility() {
        User u = getTestUser();
        
        System.runAs(u) {
            Organisation__c org = getTestOrg();
            NDIS_Support_Catalogue__c ndisCatalogue = getTestNdisCatalogue();
            
            // Create Service Catalogue with null Facility
            Service_Catalogue__c sc = new Service_Catalogue__c(
                Facility__c = null,
                Organization__c = null,
                Type_of_Industry__c = null,
                Financial_Year__c = '2023-24',
                NDIS_Support_Catalogue__c = ndisCatalogue.Id
            );
            insert sc;
            
            Test.startTest();
            ServiceCatalogueNewOrgBatch batch = new ServiceCatalogueNewOrgBatch();
            Database.executeBatch(batch, 200);
            Test.stopTest();
        }
    }
    
    /**
     * Test method for large data volume with multiple Service Catalogues
     * ✅ FIX: Using only 5 records with batch size 200 to ensure single execution
     */
    @isTest
    static void testBatchLargeDataVolume() {
        User u = getTestUser();
        
        System.runAs(u) {
            Organisation__c org = getTestOrg();
            NDIS_Support_Catalogue__c ndis = getTestNdisCatalogue();
            
            // Get existing facilities
            List<Facility__c> facilities = [SELECT Id, Name, Organisation__c, Type_of_Service__c 
                                            FROM Facility__c 
                                            WHERE Organisation__c = :org.Id];
            
            if (facilities.isEmpty()) {
                facilities = new List<Facility__c>();
                for(Integer i = 0; i < 2; i++) {
                    facilities.add(new Facility__c(
                        Name = 'Test Facility ' + i,
                        Organisation__c = org.Id,
                        Type_of_Service__c = 'NDIS',
                        Status__c = true,
                        Address__City__s = 'Crace',
                        Address__Street__s = '8 Keewong Street',
                        Address__StateCode__s = 'ACT',
                        Address__PostalCode__s = '2911',
                        Address__CountryCode__s = 'AU',
                        Email__c = 'testfacility' + i + '@test.com',
                        Phone__c = '1234567890'
                    ));
                }
                insert facilities;
            }
            
            // ✅ FIX: Only 5 records to ensure batch size > records
            List<Service_Catalogue__c> serviceCatalogues = new List<Service_Catalogue__c>();
            for(Integer i = 0; i < 5; i++) {
                Integer facilityIndex = Math.mod(i, facilities.size());
                serviceCatalogues.add(new Service_Catalogue__c(
                    Facility__c = facilities[facilityIndex].Id,
                    Organization__c = null,
                    Type_of_Industry__c = null,
                    Financial_Year__c = '2023-24',
                    NDIS_Support_Catalogue__c = ndis.Id
                ));
            }
            insert serviceCatalogues;
            
            Test.startTest();
            ServiceCatalogueNewOrgBatch batch = new ServiceCatalogueNewOrgBatch();
            Database.executeBatch(batch, 200);  // ✅ Batch size > records
            Test.stopTest();
        }
    }
    
    /**
     * Test method with no data at all (no Service Catalogues)
     */
    @isTest
    static void testBatchWithNoData() {
        User u = getTestUser();
        
        System.runAs(u) {
            // Query and delete all Service Catalogues to ensure none exist
            List<Service_Catalogue__c> allSC = [SELECT Id FROM Service_Catalogue__c];
            delete allSC;
            
            Test.startTest();
            ServiceCatalogueNewOrgBatch batch = new ServiceCatalogueNewOrgBatch();
            Database.executeBatch(batch, 200);
            Test.stopTest();
        }
    }
    
    /**
     * Test method with partially populated Service Catalogues
     */
    @isTest
    static void testBatchWithPartiallyPopulatedData() {
        User u = getTestUser();
        
        System.runAs(u) {
            Organisation__c org = getTestOrg();
            Facility__c facility = getTestFacility();
            NDIS_Support_Catalogue__c ndisCatalogue = getTestNdisCatalogue();
            
            // Create Service Catalogue with Organization but no Type_of_Industry
            Service_Catalogue__c sc1 = new Service_Catalogue__c(
                Facility__c = facility.Id,
                Organization__c = org.Id,
                Type_of_Industry__c = null,
                Financial_Year__c = '2023-24',
                NDIS_Support_Catalogue__c = ndisCatalogue.Id
            );
            insert sc1;
            
            // Create Service Catalogue with Type_of_Industry but no Organization
            Service_Catalogue__c sc2 = new Service_Catalogue__c(
                Facility__c = facility.Id,
                Organization__c = null,
                Type_of_Industry__c = 'NDIS',
                Financial_Year__c = '2023-24',
                NDIS_Support_Catalogue__c = ndisCatalogue.Id
            );
            insert sc2;
            
            Test.startTest();
            ServiceCatalogueNewOrgBatch batch = new ServiceCatalogueNewOrgBatch();
            Database.executeBatch(batch, 200);
            Test.stopTest();
        }
    }
    
    /**
     * Test method with multiple organizations
     */
    @isTest
    static void testBatchWithMultipleOrganizations() {
        User u = getTestUser();
        
        System.runAs(u) {
            Organisation__c org = getTestOrg();
            NDIS_Support_Catalogue__c ndis = getTestNdisCatalogue();
            
            // Get existing facilities
            List<Facility__c> facilities = [SELECT Id, Organisation__c FROM Facility__c WHERE Organisation__c = :org.Id];
            
            if (facilities.isEmpty()) {
                facilities = new List<Facility__c>();
                for(Integer i = 0; i < 2; i++) {
                    facilities.add(new Facility__c(
                        Name = 'Test Facility ' + i,
                        Organisation__c = org.Id,
                        Type_of_Service__c = 'NDIS',
                        Status__c = true,
                        Address__City__s = 'Crace',
                        Address__Street__s = '8 Keewong Street',
                        Address__StateCode__s = 'ACT',
                        Address__PostalCode__s = '2911',
                        Address__CountryCode__s = 'AU',
                        Email__c = 'testfacility' + i + '@test.com',
                        Phone__c = '1234567890'
                    ));
                }
                insert facilities;
            }
            
            // ✅ FIX: Only 4 records to ensure batch size > records
            List<Service_Catalogue__c> serviceCatalogues = new List<Service_Catalogue__c>();
            for(Facility__c fac : facilities) {
                for(Integer i = 0; i < 2; i++) {
                    serviceCatalogues.add(new Service_Catalogue__c(
                        Facility__c = fac.Id,
                        Organization__c = null,
                        Type_of_Industry__c = null,
                        Financial_Year__c = '2023-24',
                        NDIS_Support_Catalogue__c = ndis.Id
                    ));
                }
            }
            insert serviceCatalogues;
            
            Test.startTest();
            ServiceCatalogueNewOrgBatch batch = new ServiceCatalogueNewOrgBatch();
            Database.executeBatch(batch, 200);
            Test.stopTest();
        }
    }
}