@IsTest
private class MobileAppTaskCreateHandlerTest {
	@testsetup 
    Static void testData(){
          List<String> picklistRoles = new List<String>();
       // for (Schema.PicklistEntry pe : Organisation__c.Roles__c.getDescribe().getPicklistValues()) {
         //   picklistRoles.add(pe.getValue());
       // }
        
        // If picklist is empty (sandbox fallback)
        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN'});
        }
        
        // Select first 2 valid roles safely
        String role1 = picklistRoles[0];
        String role2 = picklistRoles.size() > 1 ? picklistRoles[1] : role1;
        
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
          org.Roles__c = role1 + ';' + role2;
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user){   
            
            
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12345678912';
            fac.Phone__c = '12323432';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20294637@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Status__c = true;
            insert staff; 
        }
    }

    @IsTest
    static void testCreateTask() {

        Staff__c staffObj = [
            SELECT Id,
                   Account_Number__c,
                   Account_Name__c,
                   BSB__c
            FROM Staff__c
            LIMIT 1
        ];


        RestRequest request = new RestRequest();

        request.requestURI =
            '/services/apexrest/bankMobiletask';

        request.httpMethod = 'POST';

        request.requestBody = Blob.valueOf(
            JSON.serialize(
                new Map<String, Object>{
                    'AccountNumber' => '123456789',
                    'AccountName' => 'Test Account',
                    'BSB' => '062000',
                    'StaffId' => staffObj.Id,
                    'Subject' => 'Mobile Account Task',
                    'Description' =>
                        'Test task from mobile application'
                }
            )
        );


        RestResponse response = new RestResponse();

        RestContext.request = request;
        RestContext.response = response;


        Test.startTest();

        MobileAppTaskCreateHandler.TaskResponse result =
            MobileAppTaskCreateHandler.createTask();

        Test.stopTest();


        System.assertEquals(
            true,
            result.success
        );

        System.assertEquals(
            201,
            response.statusCode
        );

        System.assert(
            result.taskId != null
        );


        List<Task> taskList = [
            SELECT Id,
                   Subject,
                   Description,
                   Status,
                   Priority,
                   Account_Number__c,
                   Account_Name__c,
                   BSB__c,
                   WhatId,
                   OwnerId,
                   ActivityDate
            FROM Task
            WHERE WhatId = :staffObj.Id
        ];

        Task createdTask = taskList[0];
        
    }


    @IsTest
    static void testUpdateTask() {

        Staff__c staffObj = [
            SELECT Id,
                   Account_Number__c,
                   Account_Name__c,
                   BSB__c
            FROM Staff__c
            LIMIT 1
        ];


        Task testTask = new Task();

        testTask.Subject =
            'Mobile Account Task';

        testTask.Description =
            'Task created for update testing';

        testTask.Status =
            'New';

        testTask.Priority =
            'Normal';

        testTask.Account_Number__c =
            '111111111';

        testTask.Account_Name__c =
            'Old Account';

        testTask.BSB__c =
            '061000';

        testTask.WhatId =
            staffObj.Id;

        testTask.ActivityDate =
            System.Today() + 7;

        insert testTask;


        RestRequest request = new RestRequest();

        request.requestURI =
            '/services/apexrest/bankMobiletask';

        request.httpMethod = 'PATCH';

        request.requestBody = Blob.valueOf(
            JSON.serialize(
                new Map<String, Object>{
                    'AccountNumber' => '987654321',
                    'AccountName' => 'Updated Account',
                    'BSB' => '063000',
                    'StaffId' => staffObj.Id,
                    'taskId' => testTask.Id,
                    'approverComments' =>
                        'Bank details verified and approved'
                }
            )
        );


        RestResponse response = new RestResponse();

        RestContext.request = request;
        RestContext.response = response;


        Test.startTest();

        MobileAppTaskCreateHandler.TaskResponse result =
            MobileAppTaskCreateHandler.updateTask();

        Test.stopTest();

       Task updatedTask = [
            SELECT Id,
                   Status,
                   Account_Number__c,
                   Account_Name__c,
                   BSB__c,
                   WhatId,
                   Approver_Comments__c
            FROM Task
            WHERE Id = :testTask.Id
            LIMIT 1
        ];

        Staff__c updatedStaff = [SELECT Id, Account_Number__c, Account_Name__c, BSB__c FROM Staff__c WHERE Id = :staffObj.Id LIMIT 1];
    }
}