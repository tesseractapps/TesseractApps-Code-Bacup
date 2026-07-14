@IsTest
public class SupportBillingControllerTest {

    @TestSetup
    static void setupData() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        Support_Client__c participant = new Support_Client__c(
            First_Name__c = 'John',
            Last_Name__c = 'Billing',
            Status__c = 'Active',
            Organization__c = org.Id,
            SupportClient_To_Staff__c = staff.Id,
            Support_Coordinator_Budget__c = 1000,
            Support_Coordinator_Spent_Budget__c = 100
        );
        insert participant;

        Support_CoordinatorCatalogueGroup__c grp =
            new Support_CoordinatorCatalogueGroup__c(
                Name = 'Support Coordination',
                Support_Client__c = participant.Id,
                Organization__c = org.Id,
                BudgetAllocation__c = 1000,
                AmountSpent__c = 100,
                State__c = 'ACT'
            );
        insert grp;

        Support_CoordinatorCatalogue__c item =
            new Support_CoordinatorCatalogue__c(
                Support_CoordinatorCatalogueGroup__c = grp.Id,
                Support_Item_Name__c = 'Support Item',
                Support_Item_Number__c = '1001',
                Amount__c = 50,
                State__c = 'ACT',
                IsActive__c = true
            );
        insert item;

        Support_Notes__c note = new Support_Notes__c(
            SupportClient_To_Notes__c = participant.Id,
            Entry_Date__c = Date.today(),
            Billable__c = true,
            Status__c = 'Pending',
            Duration_Hours__c = '2',
            Charge_Level__c = '25',
            Total_Cost__c = '50',
            Created_From__c = 'Case',
            Organization__c = org.Id,
            Support_CoordinatorCatalogueGroup__c = grp.Id,
            Support_CoordinatorCatalogue__c = item.Id
        );
        insert note;
    }

    @IsTest
    static void testGetBillingEntries() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Test.startTest();

           


            Test.stopTest();
        }
    }

    @IsTest
    static void testGenerateInvoices() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Support_Client__c participant = [
                SELECT Id
                FROM Support_Client__c
                LIMIT 1
            ];

            Support_Notes__c note = [
                SELECT Id
                FROM Support_Notes__c
                LIMIT 1
            ];

           String salesEntryJson =
               '{' +
               '"participantId":"' + participant.Id + '",' +
               '"entryDate":"' + String.valueOf(Date.today()) + '",' +
               '"status":"Generated",' +
               '"servicesList":"' + note.Id + '",' +
               '"totalAmount":"50"' +
               '}';
            String salesEntryListJson =
            '[' +
                '{' +
                    '"noteId":"' + note.Id + '",' +
                    '"amount":"50"' +
                '}' +
            ']';

            Test.startTest();

            SupportBillingController.generateInvoices(
                salesEntryJson,
                salesEntryListJson
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetDashboardMetrics() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Test.startTest();

           // SupportBillingController.getDashboardMetrics();

            Test.stopTest();
        }
    }

@IsTest
static void testUpdateQtyAndGetSupportInvoiceById() {

    User testUser = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Support_Notes__c note = [
            SELECT Id
            FROM Support_Notes__c
            LIMIT 1
        ];

        Support_Invoice__c invoice = new Support_Invoice__c(
        
            Status__c = 'Generated',
            Type__c = 'Service',
            DateGenerated__c = Date.today()
        );

        insert invoice;

        Test.startTest();

        // updateQty
        SupportBillingController.updateQty(
            note.Id,
            5
        );

        // getSupportInvoiceById
        SupportBillingController.getSupportInvoiceById(
            invoice.Id
        );
        SupportBillingController.cancelInvoiceById(invoice.Id);

        Test.stopTest();
    }
}
    
    @IsTest
static void testServiceSupportList() {

    User testUser = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        Support_Client__c participant = [
            SELECT Id
            FROM Support_Client__c
            LIMIT 1
        ];

        List<String> clientIds =
            new List<String>{
                participant.Id
            };

        Test.startTest();

        SupportBillingController.serviceSupportList(
            clientIds,
            String.valueOf(Date.today().addDays(-5)),
            String.valueOf(Date.today().addDays(5)),
            org.Id,
            1
        );

        SupportBillingController.serviceSupportList(
            null,
            null,
            null,
            org.Id,
            1
        );

        Test.stopTest();
    }
}
}