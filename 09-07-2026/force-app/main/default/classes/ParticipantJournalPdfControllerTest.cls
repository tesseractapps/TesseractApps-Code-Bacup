@IsTest
public class ParticipantJournalPdfControllerTest {
    @testSetup
    static void setupData() {
        
        TestDataFactory.createBaseData();
        
        User u = [
            SELECT Id
            FROM User
            WHERE Email='manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
        
        System.runAs(u){
            
            Client__c participant = [
                SELECT Id
                FROM Client__c
                LIMIT 1
            ];
            
            Staff__c staff = [
                SELECT Id
                FROM Staff__c
                LIMIT 1
            ];
            
            ShiftWithStaff__c shift = [
                SELECT Id
                FROM ShiftWithStaff__c
                LIMIT 1
            ];
            
            // Parent Journal
            Client_Journel__c parentJournal = new Client_Journel__c(
                Client__c = participant.Id,
                Care_Notes__c = 'Care Notes',
                Description__c = '<p>Parent Description</p><img src="abc.png"/>',
                Staff__c = staff.Id,
                ShiftWithStaff__c = shift.Id,
                Is_Locked__c = true
            );
            insert parentJournal;
            
            // Correction
            Client_Journel__c correction = new Client_Journel__c(
                Client__c = participant.Id,
                Care_Notes__c = 'Care Notes',
                Description__c = '<p>Correction Description</p>',
                Staff__c = staff.Id,
                ShiftWithStaff__c = shift.Id,
                Original_Client_Journel__c = parentJournal.Id,
                Reason__c = 'Updated'
            );
            insert correction;
            
            // Parent Attachment
            insert new Journal_Attachments__c(
                Client_Journel__c = parentJournal.Id,
                File_Name__c = 'Parent.pdf',
                File_Type__c = 'PDF',
                File_URL__c = 'https://test.com/parent.pdf',
                AWS_Key__c = 'participantjournal/Parent.pdf',
                Aws_Json__c='{"fileId":"1","key":"participantjournal/Parent.pdf","modulePath":"participantjournal","originalName":"Parent.pdf","type":"PDF","url":"https://test.com/parent.pdf"}'
            );
            
            // Correction Attachment
            insert new Journal_Attachments__c(
                Client_Journel__c = correction.Id,
                File_Name__c = 'Correction.pdf',
                File_Type__c = 'PDF',
                File_URL__c = 'https://test.com/correction.pdf',
                AWS_Key__c = 'participantjournal/Correction.pdf',
                Aws_Json__c='{"fileId":"2","key":"participantjournal/Correction.pdf","modulePath":"participantjournal","originalName":"Correction.pdf","type":"PDF","url":"https://test.com/correction.pdf"}'
            );
        }
    }
    
    private static void createTaskRecord() {
        
        User u = [
            SELECT Id
            FROM User
            WHERE Email='manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
        
        System.runAs(u){
            
            Client__c participant = [
                SELECT Id
                FROM Client__c
                LIMIT 1
            ];
            
            Map<String,Object> taskMap = new Map<String,Object>();
            
            taskMap.put('Title','PDF Task');
            taskMap.put('TaskDate',String.valueOf(Date.today()));
            taskMap.put('TaskTime','10:30');
            taskMap.put('comments','Task Description');
            taskMap.put('status','Open');
            taskMap.put('priority','High');
            
            taskMap.put('participantId',participant.Id);
            
            taskMap.put('notifyImmediately',true);
            taskMap.put('notifyBeforeTask',true);
            taskMap.put('hoursBeforeTask',2);
            
            taskMap.put('notificationTiming','2 Hours Before');
            taskMap.put('customHours',Decimal.valueOf(2));
            
            taskMap.put('assigntostaff',true);
            taskMap.put('linktoshift',false);
            
            taskMap.put('facilityIds',new List<Object>());
            taskMap.put('roles',new List<Object>());
            
            List<Object> files = new List<Object>();
            
            Map<String,Object> file = new Map<String,Object>();
            
            file.put('url','https://test.com/demo.pdf');
            file.put('key','participantjournal/demo.pdf');
            file.put('originalName','demo.pdf');
            
            files.add(file);
            
            taskMap.put('files',files);
            
            TaskCreateHandler.createTask(taskMap);
        }
    }
    @isTest
    static void testConstructor_All() {
        
        createTaskRecord();
        
        User u = [
            SELECT Id
            FROM User
            WHERE Email='manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
        
        System.runAs(u){
            
            Client__c participant = [
                SELECT Id
                FROM Client__c
                LIMIT 1
            ];
            
            Test.setCurrentPage(Page.ParticipantJournalPdf);
            
            ApexPages.currentPage().getParameters().put(
                'participantId',
                participant.Id
            );
            
            ApexPages.currentPage().getParameters().put(
                'type',
                'All'
            );
            
            Test.startTest();
            
            new ParticipantJournalPdfController();
            
            Test.stopTest();
        }
    }
    
    @isTest
    static void testConstructor_Task() {
        
        createTaskRecord();
        
        User u = [
            SELECT Id
            FROM User
            WHERE Email='manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
        
        System.runAs(u){
            
            Client__c participant = [
                SELECT Id
                FROM Client__c
                LIMIT 1
            ];
            
            Test.setCurrentPage(Page.ParticipantJournalPdf);
            
            ApexPages.currentPage().getParameters().put(
                'participantId',
                participant.Id
            );
            
            ApexPages.currentPage().getParameters().put(
                'type',
                'Task'
            );
            
            Test.startTest();
            
            new ParticipantJournalPdfController();
            
            Test.stopTest();
        }
    }
    
    @isTest
    static void testConstructor_CareNotes() {
        
        User u = [
            SELECT Id
            FROM User
            WHERE Email='manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
        
        System.runAs(u){
            
            Client__c participant = [
                SELECT Id
                FROM Client__c
                LIMIT 1
            ];
            
            Test.setCurrentPage(Page.ParticipantJournalPdf);
            
            ApexPages.currentPage().getParameters().put(
                'participantId',
                participant.Id
            );
            
            ApexPages.currentPage().getParameters().put(
                'type',
                'Care Notes'
            );
            
            Test.startTest();
            
            new ParticipantJournalPdfController();
            
            Test.stopTest();
        }
    }
    
    @isTest
    static void testConstructor_NoParticipant() {
        
        User u = [
            SELECT Id
            FROM User
            WHERE Email='manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
        
        System.runAs(u){
            
            Test.setCurrentPage(Page.ParticipantJournalPdf);
            
            Test.startTest();
            
            new ParticipantJournalPdfController();
            
            Test.stopTest();
        }
    }
    
    @isTest
    static void testRemoveImages() {
        
        Test.startTest();
        
        ParticipantJournalPdfController.removeImages(
            '<p>Hello</p><img src="abc.png"/>'
        );
        
        ParticipantJournalPdfController.removeImages(
            '<img src="1"/><img src="2"/>'
        );
        
        ParticipantJournalPdfController.removeImages('');
        
        ParticipantJournalPdfController.removeImages(null);
        
        Test.stopTest();
    }
    
    @isTest
    static void testActivitySorter() {
        
        ParticipantJournalPdfController.ActivitySorter sorter =
            new ParticipantJournalPdfController.ActivitySorter();
        
        ParticipantJournalPdfController.ActivityWrapper a =
            new ParticipantJournalPdfController.ActivityWrapper();
        
        ParticipantJournalPdfController.ActivityWrapper b =
            new ParticipantJournalPdfController.ActivityWrapper();
        
        a.createdDate = System.now();
        
        b.createdDate = System.now().addMinutes(-5);
        
        Test.startTest();
        
        sorter.compare(a,b);
        
        sorter.compare(b,a);
        
        b.createdDate = a.createdDate;
        
        sorter.compare(a,b);
        
        Test.stopTest();
    }
    
}