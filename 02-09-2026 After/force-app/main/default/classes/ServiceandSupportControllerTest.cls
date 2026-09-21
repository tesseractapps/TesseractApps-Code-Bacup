@IsTest
public class ServiceandSupportControllerTest {

    // =========================================================
    // TEST DATA
    // =========================================================
    @TestSetup
    static void setupData() {

        // Create all standard test data
        TestDataFactory.createBaseData();

        // Controller requires Accounting_Services__c
        Organisation__c org = [
            SELECT Id,
                   Name,
                   Accounting_Services__c
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        org.Accounting_Services__c = 'Tesseract System';
        update org;
    }


    // =========================================================
    // INSERT - NORMAL SERVICE
    // =========================================================
    @IsTest
    static void testUpdateAvailableFunds_Insert() {

        User testUser = [
            SELECT Id,
                   Organization_Name__c
            FROM User
            WHERE UserName = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Services_and_Support_Plan__c service = [
                SELECT Id,
                       Funds_Tracker__c,
                       Service_Type__c,
                       Service_Users__c,
                       Client__c,
                       Amount__c,
                       Qty__c,
                       Edited_Unit_Price__c,
                       Date_of_Service__c,
                       GST__c,
                       SIL_Service__c,
                       Services__c,
                       State__c,
                       Available_Fund__c,
                       Participant_Name__c
                FROM Services_and_Support_Plan__c
                LIMIT 1
            ];

            Test.startTest();

            ServiceandSupportController.updateAvailableFunds(
                new List<Services_and_Support_Plan__c>{
                    service
                },
                null
            );

            Test.stopTest();
        }
    }


    // =========================================================
    // INSERT - RUNNING BALANCE
    //
    // Same real service is intentionally supplied twice.
    // Amount__c is already populated because the record came
    // from SOQL after being inserted by TestDataFactory.
    //
    // First record -> creates runningAvailableAmountMap entry
    // Second record -> executes the ELSE branch
    // =========================================================
    @IsTest
    static void testUpdateAvailableFunds_InsertRunningBalance() {

        User testUser = [
            SELECT Id,
                   Organization_Name__c
            FROM User
            WHERE UserName = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Services_and_Support_Plan__c service = [
                SELECT Id,
                       Funds_Tracker__c,
                       Service_Type__c,
                       Service_Users__c,
                       Client__c,
                       Amount__c,
                       Qty__c,
                       Edited_Unit_Price__c,
                       Date_of_Service__c,
                       GST__c,
                       SIL_Service__c,
                       Services__c,
                       State__c,
                       Available_Fund__c,
                       Participant_Name__c
                FROM Services_and_Support_Plan__c
                LIMIT 1
            ];

            // Use the SAME queried record twice.
            // This avoids Amount__c being null.
            List<Services_and_Support_Plan__c> services =
                new List<Services_and_Support_Plan__c>{
                    service,
                    service
                };

            Test.startTest();

            ServiceandSupportController.updateAvailableFunds(
                services,
                null
            );

            Test.stopTest();
        }
    }


    // =========================================================
    // INSERT - SIL SERVICE
    //
    // SIL exits before Amount__c is accessed.
    // =========================================================
    @IsTest
    static void testUpdateAvailableFunds_InsertSIL() {

        User testUser = [
            SELECT Id,
                   Organization_Name__c
            FROM User
            WHERE UserName = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Services_and_Support_Plan__c service = [
                SELECT Id,
                       Funds_Tracker__c,
                       Service_Type__c,
                       Service_Users__c,
                       Client__c,
                       Qty__c,
                       Date_of_Service__c,
                       GST__c,
                       Services__c,
                       State__c
                FROM Services_and_Support_Plan__c
                LIMIT 1
            ];

            service.SIL_Service__c = true;

            Test.startTest();

            ServiceandSupportController.updateAvailableFunds(
                new List<Services_and_Support_Plan__c>{
                    service
                },
                null
            );

            Test.stopTest();
        }
    }


    // =========================================================
    // UPDATE - QUANTITY CHANGED
    // =========================================================
    @IsTest
    static void testUpdateAvailableFunds_UpdateQty() {

        User testUser = [
            SELECT Id,
                   Organization_Name__c
            FROM User
            WHERE UserName = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Services_and_Support_Plan__c service = [
                SELECT Id,
                       Funds_Tracker__c,
                       Service_Type__c,
                       Service_Users__c,
                       Client__c,
                       Amount__c,
                       Qty__c,
                       Edited_Unit_Price__c,
                       Date_of_Service__c,
                       GST__c,
                       SIL_Service__c,
                       Services__c,
                       State__c,
                       Available_Fund__c,
                       Participant_Name__c
                FROM Services_and_Support_Plan__c
                LIMIT 1
            ];

            Services_and_Support_Plan__c oldService =
                service.clone(true, true, true, true);

            // Change writable source field.
            service.Qty__c = service.Qty__c + 1;

            Map<Id, Services_and_Support_Plan__c> oldMap =
                new Map<Id, Services_and_Support_Plan__c>{
                    service.Id => oldService
                };

            Test.startTest();

            ServiceandSupportController.updateAvailableFunds(
                new List<Services_and_Support_Plan__c>{
                    service
                },
                oldMap
            );

            Test.stopTest();
        }
    }


    // =========================================================
    // UPDATE - SERVICE TYPE CHANGED
    // =========================================================
@IsTest
static void testUpdateAvailableFunds_UpdateServiceType() {

    User testUser = [
        SELECT Id,
               Organization_Name__c
        FROM User
        WHERE UserName = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Services_and_Support_Plan__c service = [
            SELECT Id,
                   Funds_Tracker__c,
                   Service_Type__c,
                   Service_Users__c,
                   Client__c,
                   Amount__c,
                   Qty__c,
                   Edited_Unit_Price__c,
                   Date_of_Service__c,
                   GST__c,
                   SIL_Service__c,
                   Services__c,
                   State__c,
                   Available_Fund__c,
                   Participant_Name__c
            FROM Services_and_Support_Plan__c
            LIMIT 1
        ];

        NDIS_Support_Catalogue__c secondCatalogue =
            new NDIS_Support_Catalogue__c();

        secondCatalogue.Name = 'Test Second Catalogue';
        secondCatalogue.ACT__c = 100;
        secondCatalogue.NSW__c = 100;
        secondCatalogue.NT__c = 100;
        secondCatalogue.QLD__c = 100;
        secondCatalogue.SA__c = 100;
        secondCatalogue.TAS__c = 100;
        secondCatalogue.VIC__c = 100;
        secondCatalogue.WA__c = 100;

        insert secondCatalogue;

        Services_and_Support_Plan__c oldService =
            service.clone(true, true, true, true);

        service.Service_Type__c = secondCatalogue.Id;

        Map<Id, Services_and_Support_Plan__c> oldMap =
            new Map<Id, Services_and_Support_Plan__c>{
                service.Id => oldService
            };

        Test.startTest();

        ServiceandSupportController.updateAvailableFunds(
            new List<Services_and_Support_Plan__c>{
                service
            },
            oldMap
        );

        Test.stopTest();
    }
}


    // =========================================================
    // UPDATE - NO RELEVANT CHANGE
    // =========================================================
    @IsTest
    static void testUpdateAvailableFunds_NoChange() {

        User testUser = [
            SELECT Id,
                   Organization_Name__c
            FROM User
            WHERE UserName = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Services_and_Support_Plan__c service = [
                SELECT Id,
                       Funds_Tracker__c,
                       Service_Type__c,
                       Service_Users__c,
                       Client__c,
                       Amount__c,
                       Qty__c,
                       Edited_Unit_Price__c,
                       Date_of_Service__c,
                       GST__c,
                       SIL_Service__c,
                       Services__c,
                       State__c,
                       Available_Fund__c,
                       Participant_Name__c
                FROM Services_and_Support_Plan__c
                LIMIT 1
            ];

            Services_and_Support_Plan__c oldService =
                service.clone(true, true, true, true);

            Map<Id, Services_and_Support_Plan__c> oldMap =
                new Map<Id, Services_and_Support_Plan__c>{
                    service.Id => oldService
                };

            Test.startTest();

            ServiceandSupportController.updateAvailableFunds(
                new List<Services_and_Support_Plan__c>{
                    service
                },
                oldMap
            );

            Test.stopTest();
        }
    }


    // =========================================================
    // UPDATE - EDITED UNIT PRICE CHANGED
    // =========================================================
    @IsTest
    static void testUpdateAvailableFunds_UpdateUnitPrice() {

        User testUser = [
            SELECT Id,
                   Organization_Name__c
            FROM User
            WHERE UserName = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Services_and_Support_Plan__c service = [
                SELECT Id,
                       Funds_Tracker__c,
                       Service_Type__c,
                       Service_Users__c,
                       Client__c,
                       Amount__c,
                       Qty__c,
                       Edited_Unit_Price__c,
                       Date_of_Service__c,
                       GST__c,
                       SIL_Service__c,
                       Services__c,
                       State__c,
                       Available_Fund__c,
                       Participant_Name__c
                FROM Services_and_Support_Plan__c
                LIMIT 1
            ];

            Services_and_Support_Plan__c oldService =
                service.clone(true, true, true, true);

            if (service.Edited_Unit_Price__c == null) {
                service.Edited_Unit_Price__c = 100;
            } else {
                service.Edited_Unit_Price__c =
                    service.Edited_Unit_Price__c + 1;
            }

            Map<Id, Services_and_Support_Plan__c> oldMap =
                new Map<Id, Services_and_Support_Plan__c>{
                    service.Id => oldService
                };

            Test.startTest();

            ServiceandSupportController.updateAvailableFunds(
                new List<Services_and_Support_Plan__c>{
                    service
                },
                oldMap
            );

            Test.stopTest();
        }
    }


    // =========================================================
    // DELETE - NORMAL SERVICE
    // =========================================================
    @IsTest
    static void testUpdateAvailableFundsOnDelete() {

        User testUser = [
            SELECT Id,
                   Organization_Name__c
            FROM User
            WHERE UserName = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Services_and_Support_Plan__c service = [
                SELECT Id,
                       Funds_Tracker__c,
                       Amount__c,
                       SIL_Service__c
                FROM Services_and_Support_Plan__c
                LIMIT 1
            ];

            Test.startTest();

            ServiceandSupportController.updateAvailableFundsOnDelete(
                new List<Services_and_Support_Plan__c>{
                    service
                }
            );

            Test.stopTest();
        }
    }


    // =========================================================
    // DELETE - SIL SERVICE
    // =========================================================
    @IsTest
    static void testUpdateAvailableFundsOnDeleteSIL() {

        User testUser = [
            SELECT Id,
                   Organization_Name__c
            FROM User
            WHERE UserName = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Services_and_Support_Plan__c service = [
                SELECT Id,
                       Funds_Tracker__c,
                       Amount__c,
                       SIL_Service__c
                FROM Services_and_Support_Plan__c
                LIMIT 1
            ];

            service.SIL_Service__c = true;

            Test.startTest();

            ServiceandSupportController.updateAvailableFundsOnDelete(
                new List<Services_and_Support_Plan__c>{
                    service
                }
            );

            Test.stopTest();
        }
    }
}