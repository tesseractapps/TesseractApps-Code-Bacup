@isTest
public class TaskHandlerTest {

    public static Task createTask(){

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
        insert org;

        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];

        User user = new User(
            Alias = 'praveen',
            Email= 'manualtesting.2094633@hotmail.com',
            EmailEncodingKey='UTF-8',
            LastName='StaffOne2094633',
            LanguageLocaleKey='en_US',
            LocaleSidKey='en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey='America/New_York',
            UserName='manualtesting.2094633@hotmail.com',
            Organization_Name__c ='Ashfield Consultants'
        );
        insert user;

        // ==========================
        // NEW CHANGE START
        // ==========================
            Facility__c fac = new Facility__c(
            Name='Test Facility',
            Address__City__s='Crace',
            Address__Street__s='8 Keewong Street',
            Address__StateCode__s='ACT',
            Address__PostalCode__s='2911',
            Address__CountryCode__s='AU',
            Email__c='testfacility@gmail.com',
            Status__c=true,
            Organisation__c=org.Id,
            ABN__c='12345678901',
            Phone__c='12323432',
            Type_of_Service__c='Ndis'
        );
        insert fac;

            Staff__c st = new Staff__c();
            st.Last_Name__c='Test staff';
            st.Name='praveen1';
            st.Name__c='abcd';
            st.Contact_Number__c='56789908743';
            st.Email_Address__c=user.Email; // IMPORTANT
            st.Facility__c=fac.Id;
            st.Address__Street__s='8 Keewong Street';
            st.Address__City__s='Crace';
            st.Address__StateCode__s='ACT';
            st.Address__PostalCode__s='2911';
            st.Address__CountryCode__s='AU';
            st.Emergency_Phone_Number__c='45678766675';
            st.Primary_Contact_Name__c='Praveen';
            st.Primary_Contact_Number__c='9908458298';
            st.Make_Primary_as_Approver__c=true;
            st.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            st.Secondary_Contact_Name__c='maheswari';
            st.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            st.Make_Secondary_as_Approver__c=false;
            st.Secondary_Contact_Number__c='99084582958';
            st.Emp_exit_date__c = Date.newInstance(2028,1,5);
            st.Emp_Start_Date__c = Date.newInstance(2023,2,1);
            st.Payee_ETP_Payment_Date__c = Date.newInstance(2025,2,4);
            st.Date_Of_Birth__c = Date.newInstance(2001,2,4);
            st.Role__c='Admin';
            st.Residency_Type__c='Australian';
            st.Expiry_Date__c = Date.newInstance(2025,2,19);
            st.Type__c='Visa Status';
            st.Working_Hours_Rate__c=50;
            st.Final_Overall_Rate__c=150;
            st.Saturday_Hourly_Rate__c=130;
            st.Sunday_Hourly_Rate__c=50;
            st.Status__c=true;
            
            insert st;
        // ==========================
        // NEW CHANGE END
        // ==========================

        User testUser = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];

        Task testTask1 = new Task(
            OwnerId = testUser.Id,
            Subject = 'Approval Request',
            Status = 'New',
            ActivityDate = Date.today()
        );

        Task testTask2 = new Task(
            OwnerId = testUser.Id,
            Subject = 'Leave Request',
            Status = 'In Progress',
            ActivityDate = Date.today().addDays(5)
        );

        Task testTask3 = new Task(
            OwnerId = testUser.Id,
            Subject = 'Incident Register',
            Status = 'Completed',
            ActivityDate = Date.today().addDays(10)
        );

        Task testTask4 = new Task(
            OwnerId = testUser.Id,
            Subject = 'Random Task',
            Status = 'New',
            ActivityDate = Date.today().addDays(15)
        );

        insert new List<Task>{ testTask1, testTask2, testTask3, testTask4 };

        Task taskRec = new Task();
        taskRec.OwnerId=user.id;
        taskRec.Status='New';
        taskRec.Subject='Call';
        taskRec.Priority='High';
        taskRec.ActivityDate=System.today();
        taskRec.Description='commentsValue';
        insert taskRec;

        return taskRec;
    }


    static testMethod void taskHandlerTest() {

    // Create User and Task data first
    createTask();

    User u4 = [
        SELECT Id, Name, Email, IsActive
        FROM User
        WHERE Email = 'manualtesting.2094633@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u4) {

        Test.startTest();

        String sDate = String.valueOf(System.today());

        TaskCreateHandler.listOfUsers(u4.Id);

        TaskCreateHandler.createTaskRecord(
            u4.Id,
            'New',
            'Call',
            'High',
            sDate,
            'commentsValue'
        );

        List<Map<String,Object>> result = TaskHandler.taskDetails();

        Test.stopTest();
    }
}

    @isTest
static void testGetTaskDetails_Success() {

    // Create all required test data
    createTask();

    User u4 = [
        SELECT Id, Name, Email, IsActive
        FROM User
        WHERE Email = 'manualtesting.2094633@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u4) {

        Test.startTest();

        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();

        req.requestURI = '/services/apexrest/FetchTask/';
        req.httpMethod = 'GET';

        RestContext.request = req;
        RestContext.response = res;

        mobileAppTaskHandler.getTaskDetails();

        Test.stopTest();

        System.assertEquals(200, res.statusCode);

        String responseBody = res.responseBody != null
            ? res.responseBody.toString()
            : '';

        System.assertNotEquals(null, responseBody);
    }
}
}