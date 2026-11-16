@isTest
public class TaskCreateHandlerTest {
    @testsetup Static void testData(){ 
        //Organisation__c org = OrgDetailsTest.createOrganization();
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';      
        org.Organization_Logo__c='<p><img src="https://pinnacleit--tesseract.sandbox.file.force.com/servlet/rtaImage?eid=a011s00000DeET6&amp;feoid=00N2w00000bGgPS&amp;refid=0EM1s000000LeUS" alt="Tessearcet.jpg"></img></p>';
        insert org;
       
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'praveen.shesham28986@pinnacleitservices.com', 
                             EmailEncodingKey='UTF-8', LastName='praveenshesham6', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='praveen.shesham28986@pinnacleitservices.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
    }
      @isTest
    public static void getOrgNameTest(){  
       // Task ts1=[select id,description from Task limit 1 ];
        user u =[select id from user where email='praveen.shesham28986@pinnacleitservices.com' limit 1];
        string dateValue='2023-12-13';
        string recordId ='null';
        string statusValue='Open';
        string subjectValue='Send Letter';
        string priorityValue='High';
        string commentsValue='test description';
        System.runAs(u) {
        test.startTest();
        TaskCreateHandler.getOrgName();
        TaskCreateHandler.listOfUsers(recordId);
        TaskCreateHandler.getOrgLogo();
        TaskCreateHandler.createTaskRecord(u.id, statusValue, subjectValue, priorityValue, dateValue, commentsValue);
            test.stopTest(); 
        }     
        
    }
    
    /*@isTest
    Public static void testCreateTaskInsert() {
    
        User u = [
            SELECT Id
            FROM User
            WHERE Email = 'praveen.shesham28986@pinnacleitservices.com'
            LIMIT 1
        ];
    
        System.runAs(u) {
    
            Map<String, Object> taskMap = new Map<String, Object>();
    
            taskMap.put('Title', 'Task Title');
            taskMap.put('TaskDate', String.valueOf(Date.today()));
            taskMap.put('TaskTime', '10:30');
            taskMap.put('comments', 'Test Description');
            taskMap.put('status', 'Open');
            taskMap.put('priority', 'High');
    
            taskMap.put('notifyImmediately', true);
            taskMap.put('notifyBeforeTask', true);
            taskMap.put('hoursBeforeTask', 2);
    
            taskMap.put('notificationTiming', '2 Hours Before');
            taskMap.put('customHours', Decimal.valueOf(2));
    
            taskMap.put('assigntostaff', true);
            taskMap.put('linktoshift', false);
    
            taskMap.put('facilityIds',
                new List<Object>{'Facility1','Facility2'});
    
            taskMap.put('roles',
                new List<Object>{'Admin','Support Worker'});
    
            List<Object> files = new List<Object>();
    
            Map<String,Object> file = new Map<String,Object>();
            file.put('url','https://test.com/file.pdf');
            file.put('key','abc123');
            file.put('originalName','file.pdf');
    
            files.add(file);
    
            taskMap.put('files',files);
    
            Test.startTest();
    
            Id taskId = TaskCreateHandler.createTask(taskMap);
    
            Test.stopTest();
    
            TaskCreateHandler.getTasksById(taskId);
            TaskCreateHandler.getTaskAttachments(taskId);
        }
    }*/
    
    @isTest
public static void testCreateTaskInsert() {

    User u = [
        SELECT Id
        FROM User
        WHERE Email = 'praveen.shesham28986@pinnacleitservices.com'
        LIMIT 1
    ];

    System.runAs(u) {

        Client__c participant = new Client__c(
        First_Name__c = 'Test',
        Last_Name__c = 'Participant',
        Gendar__c = 'Male',
        Date_Of_Birth__c = Date.newInstance(1995, 1, 1),
        Contact_Number__c = '9876543210',
        Email__c = 'participant@test.com',
    
        Address__Street__s = '8 Keewong Street',
        Address__City__s = 'Crace',
        Address__StateCode__s = 'ACT',
        Address__PostalCode__s = '2911',
        Address__CountryCode__s = 'AU'
    );
    
    insert participant;

        Map<String, Object> taskMap = new Map<String, Object>();

        taskMap.put('Title', 'Task Title');
        taskMap.put('TaskDate', String.valueOf(Date.today()));
        taskMap.put('TaskTime', '10:30');
        taskMap.put('comments', 'Test Description');
        taskMap.put('status', 'Open');
        taskMap.put('priority', 'High');

        taskMap.put('participantId', participant.Id);

        taskMap.put('notifyImmediately', true);
        taskMap.put('notifyBeforeTask', true);
        taskMap.put('hoursBeforeTask', 2);

        taskMap.put('notificationTiming', '2 Hours Before');
        taskMap.put('customHours', Decimal.valueOf(2));

        taskMap.put('assigntostaff', true);
        taskMap.put('linktoshift', false);

        taskMap.put('facilityIds', new List<Object>{'Facility1','Facility2'});
        taskMap.put('roles', new List<Object>{'Admin','Support Worker'});

        List<Object> files = new List<Object>();

        Map<String,Object> file = new Map<String,Object>();
        file.put('url','https://test.com/file.pdf');
        file.put('key','abc123');
        file.put('originalName','file.pdf');

        files.add(file);

        taskMap.put('files', files);

        Test.startTest();

        Id taskId = TaskCreateHandler.createTask(taskMap);

        TaskCreateHandler.getTasksById(taskId);
        TaskCreateHandler.getTaskAttachments(taskId);
        TaskCreateHandler.getTasksByParticipant(participant.Id);

        Test.stopTest();
    }
}

}