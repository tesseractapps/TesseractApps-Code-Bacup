@IsTest
public class SupportParticipantControllerTest {

    @TestSetup
    static void setupData() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id, Name
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
            Last_Name__c = 'Doe',
            Status__c = 'Active',
            Organization__c = org.Id,
            SupportClient_To_Staff__c = staff.Id,
            Email__c = 'john@test.com',
            Phone__c = '9999999999'
        );
        insert participant;

        Support_Provider__c provider = new Support_Provider__c(
            Name = 'Provider Test',
            Status__c = 'Active'
        );
        insert provider;

        NDIS_Support_Catalogue__c ndis = new NDIS_Support_Catalogue__c(
            Name = 'Support Coordination',
            Support_Item_Name__c = 'Support Item',
            Support_Item_Number__c = '1001',
            Start_Date__c = Date.newInstance(Date.today().year(),7,1)
        );
        insert ndis;

        Support_CatalogueGroup__c grp = new Support_CatalogueGroup__c(
            Name = 'Support Coordination',
            SupportCatalogueGroup_To_SupportClient__c = participant.Id,
            Organization_To_Support_CatalogueGroup__c = org.Id,
            BudgetAllocation__c = 1000,
            AmountSpent__c = 100,
            State__c = 'ACT'
        );
        insert grp;

        Support_Catalogue__c item = new Support_Catalogue__c(
            CatalogueGroup_To_SupportCatalogue__c = grp.Id,
            SupportCatalogue_To_NDISSupportCatalogue__c = ndis.Id,
            State__c = 'ACT',
            Amount__c = 50,
            IsActive__c = true,
            SupportCatlogue_To_SupportProvider__c = provider.Id
        );
        insert item;

        Support_CoordinatorCatalogueGroup__c cgrp =
            new Support_CoordinatorCatalogueGroup__c(
                Name = 'Support Coordination',
                Support_Client__c = participant.Id,
                Organization__c = org.Id,
                BudgetAllocation__c = 1000,
                AmountSpent__c = 100,
                State__c = 'ACT'
            );
        insert cgrp;

        Support_CoordinatorCatalogue__c citem =
            new Support_CoordinatorCatalogue__c(
                Support_CoordinatorCatalogueGroup__c = cgrp.Id,
                Support_Item_Name__c = 'Coordinator Item',
                Support_Item_Number__c = '2001',
                Amount__c = 25,
                State__c = 'ACT',
                IsActive__c = true
            );
        insert citem;

        Support_Notes__c note = new Support_Notes__c(
            SupportClient_To_Notes__c = participant.Id,
            Entry_Date__c = Date.today(),
            Notes_Type__c = 'Case Note',
            Activity_Details__c = 'Testing',
            Created_From__c = 'Task',
            Organization__c = org.Id
        );
        insert note;

        Support_Entry__c entry = new Support_Entry__c(
            SupportEntry_To_SupportClient__c = participant.Id,
            SupportEntry_To_SupportProvider__c = provider.Id,
            ServiceDate__c = Date.today(),
            Hours__c = 2,
            Amount__c = 25,
            Total_Amount__c = 50,
            ClaimStatus__c = 'Pending',
            DataSource__c = 'Manual'
        );
        insert entry;
    }

    @IsTest
    static void testMethods() {

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

            Support_Provider__c provider = [
                SELECT Id
                FROM Support_Provider__c
                LIMIT 1
            ];

            NDIS_Support_Catalogue__c ndis = [
                SELECT Id, Name
                FROM NDIS_Support_Catalogue__c
                LIMIT 1
            ];

            Support_CatalogueGroup__c grp = [
                SELECT Id, Name
                FROM Support_CatalogueGroup__c
                LIMIT 1
            ];

            Support_Catalogue__c item = [
                SELECT Id
                FROM Support_Catalogue__c
                LIMIT 1
            ];

            Support_CoordinatorCatalogueGroup__c cgrp = [
                SELECT Id
                FROM Support_CoordinatorCatalogueGroup__c
                LIMIT 1
            ];

            Support_CoordinatorCatalogue__c citem = [
                SELECT Id
                FROM Support_CoordinatorCatalogue__c
                LIMIT 1
            ];

            Support_Notes__c note = [
                SELECT Id
                FROM Support_Notes__c
                LIMIT 1
            ];

            Test.startTest();

            SupportParticipantController.getAllParticipants();

            //SupportParticipantController.getParticipantsPaged1(5,1);

            SupportParticipantController.getParticipantsPaged(
                5,
                1,
                'John',
                'pinned'
            );

            SupportParticipantController.updateParticipantPin(
                participant.Id,
                true
            );

            SupportParticipantController.getTasksByDateRange(
                Date.today().addDays(-5),
                Date.today().addDays(5)
            );

            SupportParticipantController.updateTaskDate(
                note.Id,
                Date.today()
            );

            String formJson =
            '{' +
                '"participant":"' + participant.Id + '",' +
                '"isBillable":true,' +
                '"date":"' + String.valueOf(Date.today()) + '",' +
                '"noteType":"Case",' +
                '"contactMethod":"Phone",' +
                '"activity1":"Activity",' +
                '"durationHours":"1",' +
                '"durationMinutes":"30",' +
                '"serviceType":"' + cgrp.Id + '",' +
                '"serviceItem":"' + citem.Id + '",' +
                '"editableRate":"20"' +
            '}';

            String fundingJson =
            '{' +
                '"totalBudget":"1000",' +
                '"currentSpending":"100"' +
            '}';

            SupportParticipantController.saveTimeEntry(
                formJson,
                fundingJson
            );

            SupportParticipantController.fetchParticipantNDISCatalogue(
                ndis.Name,
                Date.today()
            );

            SupportParticipantController.fetchParticipantCatalogues(
                participant.Id,
                grp.Name,
                'ACT'
            );

            List<SupportParticipantController.ParticipantCatalogueInput> lst =
                new List<SupportParticipantController.ParticipantCatalogueInput>();

            SupportParticipantController.ParticipantCatalogueInput inp =
                new SupportParticipantController.ParticipantCatalogueInput();

            inp.catalogueId = ndis.Id;
            inp.budgetAllocation = 1000;
            inp.amountSpent = 100;
            inp.state = 'ACT';
            inp.amount = 50;
            inp.providerId = provider.Id;

            lst.add(inp);

            SupportParticipantController.saveParticipantCatalogues(
                participant.Id,
                lst,
                true
            );

            SupportParticipantController.fetchParticipantServiceGroups(
                participant.Id
            );

            SupportParticipantController.fetchServiceTypes();

            SupportParticipantController.getSupportEntriesPaged(
                5,
                1
            );

            SupportParticipantController.saveSupportEntry(
                null,
                participant.Id,
                provider.Id,
                'Support Coordination',
                'Support Item',
                '1001',
                Date.today(),
                2,
                20,
                'Pending',
                'Manual',
                'Notes'
            );

            SupportParticipantController.fetchParticipantsForEntry();

            SupportParticipantController.fetchServiceTypesByParticipant(
                participant.Id
            );

            SupportParticipantController.fetchSupportItemsForEntry(
                participant.Id,
                grp.Name
            );

            SupportParticipantController.fetchSupportItemsForNotes(
                participant.Id
            );

            SupportParticipantController.getParticipantsPagedforNotes(
                5,
                1,
                'pinned'
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testSaveParticipants() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Support_Provider__c provider = [
                SELECT Id
                FROM Support_Provider__c
                LIMIT 1
            ];

            String payload =
            '{' +
                '"firstName":"Test",' +
                '"lastName":"Participant",' +
                '"phone":"9999999999",' +
                '"email":"test@test.com",' +
                '"status":"Active",' +
                '"selectedServiceTypes":["Support Coordination"],' +
                '"serviceGroups":[' +
                    '{' +
                        '"serviceType":"Support Coordination",' +
                        '"state":"ACT",' +
                        '"budgetAllocation":"1000",' +
                        '"amountSpent":"100",' +
                        '"budgetSpentToDate":"50",' +
                        '"supportItems":[' +
                            '{' +
                                '"supportItemName":"Item",' +
                                '"supportItemNumber":"1001",' +
                                '"state":"ACT",' +
                                '"amount":"20",' +
                                '"isActive":true,' +
                                '"providerIds":["' + provider.Id + '"]' +
                            '}' +
                        ']' +
                    '}' +
                '],' +
                '"coordinatorServiceGroups":[]' +
            '}';

            Test.startTest();

            SupportParticipantController.saveParticipants(payload);

            Test.stopTest();
        }
    }

    @IsTest
    static void testExceptionMethods() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Test.startTest();

            try {
                SupportParticipantController.saveTimeEntry(null, null);
            } catch (Exception e) {}

            try {
                SupportParticipantController.saveSupportEntry(
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
                );
            } catch (Exception e) {}

            try {
                SupportParticipantController.saveParticipantCatalogues(
                    null,
                    null,
                    false
                );
            } catch (Exception e) {}

            Test.stopTest();
        }
    }
    @IsTest
	static void testCreateUpdatepdateParticipantContacts() {

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

        String createJson =
        '[' +
            '{' +
                '"contactType":"Primary",' +
                '"firstName":"John",' +
                '"lastName":"Smith",' +
                '"contactNumber":"9999999999",' +
                '"email":"john@test.com",' +
                '"notify":true,' +
                '"uploadedFiles":[' +
                    '{' +
                        '"originalName":"test.pdf",' +
                        '"url":"https://test.com/file.pdf",' +
                        '"key":"abc123",' +
                        '"size":"1024"' +
                    '}' +
                ']' +
            '}' +
        ']';

        Test.startTest();

        // CREATE CONTACT
        List<Id> contactIds =
            SupportParticipantController.createUpdatepdateParticipantContacts(
                participant.Id,
                createJson
            );

        // UPDATE CONTACT
        String updateJson =
        '[' +
            '{' +
                '"id":"' + contactIds[0] + '",' +
                '"contactType":"Secondary",' +
                '"firstName":"Updated",' +
                '"lastName":"Contact",' +
                '"contactNumber":"8888888888",' +
                '"email":"updated@test.com",' +
                '"notify":false,' +
                '"uploadedFiles":[' +
                    '{' +
                        '"attachmentId":"existingAttachment"' +
                    '},' +
                    '{' +
                        '"originalName":"newfile.pdf",' +
                        '"url":"https://test.com/newfile.pdf",' +
                        '"key":"xyz456",' +
                        '"size":"2048"' +
                    '}' +
                ']' +
            '}' +
        ']';

        SupportParticipantController.createUpdatepdateParticipantContacts(
            participant.Id,
            updateJson
        );

        Test.stopTest();
    }
}
    
  @IsTest
static void testSaveSupportNote() {

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

        // UPDATE BUDGET VALUES
        Support_Client__c participantUpdate =
            new Support_Client__c(
                Id = participant.Id,
                Support_Coordinator_Budget__c = 1000,
                Support_Coordinator_Spent_Budget__c = 100
            );

        update participantUpdate;

        Support_CoordinatorCatalogueGroup__c cgrp = [
            SELECT Id
            FROM Support_CoordinatorCatalogueGroup__c
            LIMIT 1
        ];

        Support_CoordinatorCatalogue__c citem = [
            SELECT Id
            FROM Support_CoordinatorCatalogue__c
            LIMIT 1
        ];

        Map<String,Object> noteData =
            new Map<String,Object>();

        noteData.put(
            'participant',
            participant.Id
        );
        SupportParticipantController.getParticipantDetails(participant.Id);
         SupportParticipantController.getParticipantDetails(participant.Id);
         SupportParticipantController.fetchCoordinatorServiceTypes();
        SupportParticipantController.getServiceTypesByParticipant(participant.Id);

        noteData.put(
            'billable',
            true
        );

        noteData.put(
            'duration',
            '1'
        );

        noteData.put(
            'durationMinutes',
            '30'
        );

        noteData.put(
            'entryCost',
            '50'
        );

        noteData.put(
            'date',
            String.valueOf(Date.today())
        );

        noteData.put(
            'title',
            'Task'
        );

        noteData.put(
            'description',
            'Testing support note'
        );

        noteData.put(
            'startTime',
            '10:30'
        );

        noteData.put(
            'chargeLevel',
            '25'
        );

        noteData.put(
            'ServiceType',
            cgrp.Id
        );

        noteData.put(
            'ServiceItem',
            citem.Id
        );

        Test.startTest();

        SupportParticipantController.saveSupportNote(
            noteData
        );

        Test.stopTest();
    }

}
}