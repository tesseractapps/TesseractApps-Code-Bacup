@isTest
public class ClientSearchControllerTest {
    @testsetup
    public static void testData(){
      
        Organisation__c org = OrgDetailsTest.createOrganization();
         Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.218616@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test nagendra218616', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.218616@hotmail.com',Organization_Name__c ='Pinnacle IT');
        insert user;
        System.runAs(user) { 
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Email__c= 'testfacility@gmail.com';
            fac.Organisation__c= org.Id;
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='1235645433';
            fac.Phone__c = '12323213';
            insert fac;
            
          Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.218616@hotmail.com';
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
            insert staff; 
            
            Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s='8 Keewong Street';
            cli.Address__City__s = 'Crace';
            cli.Address__StateCode__s='ACT';
            cli.Address__PostalCode__s='2911';
            cli.Contact_Number__c='4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c='Jason';
            cli.Primay_Contact_Last_Name__c='Smith';
            cli.Relationship__c='Parent';
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
           // cli.Staff__c=staff.id;
            //cli.Organization_Name__c='Ace Info Systems';
            insert cli;
                
            Attachment__c attach = new  Attachment__c();
            attach.Added_By__c=cli.Id;
            attach.Name='test attachment';
            attach.Date__c=Date.newInstance(2023, 11, 07);
            attach.Type__c='Certificate';
            attach.Type_of_Document__c='GP Cerificate';
            attach.User__c=user.id;
            attach.Comments__c='Test Comments';
            attach.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
            attach.Size__c='0.12 MB';
            insert attach;
            
            Client_Journel__c journel=new Client_Journel__c();
            journel.Client__c=cli.Id;
            journel.Notes_Type__c = 'Care Notes	';
            journel.Description__c = 'Test Care Notes Description';
            insert journel;
        }
        
       
    }
    
    @isTest
    public static void statusClientTest(){
        User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) {
         Client__c cli = [SELECT Id from Client__c];
        //string id=org.id;
        test.startTest();
        ClientSearchController.statusClient(cli.id, 'true');
        test.stopTest();
        }
       
    }
    
    @isTest
    public static void fetchFacilitiessTest(){ 
        Organisation__c org = OrgDetailsTest.createOrganization();
       User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) {
            Client__c cli = [SELECT Id,Name from Client__c limit 1];        
            Organisation__c orgs = [select Id,Name from Organisation__c  limit 1];
            Boolean flag = true;
            test.startTest();
            ClientSearchController.fetchFacilitiess(cli.Name,flag);
            ClientDataController.fetchFacilitiess(orgs.id,'Test1','Test');
            ClientDataController.statusClient(cli.Id, 'false');
            test.stopTest();    
        }
            
    }   
    
    @isTest
    public static void fetchFacilitiessTests(){  
       
       User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        string susername = '';
        System.runAs(userName) {
             List<Client__c> cliList = [SELECT Id,Name from Client__c LIMIT 1]; 
            // string name= NULL;
            test.startTest();
            	ClientSearchController.fetchFacilitiess('',false);        
            test.stopTest();
        }        
    } 
    
    Static testMethod void partcipantDetailsTestMethod(){
        Test.startTest();
       User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) {
            Client__c cc= [select id from Client__c where Facility__r.Name='Ashfield Consultants' limit 1];
            string recordId= cc.Id;
             RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.params.put('recordId', recordId);
            req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/FetchPartcipant/';
            RestContext.request = req;
            RestContext.response = res;
        
            mobileAppPartcipantDetailsRest.fecthParticipantList(); 
            
            RestRequest req1 = new RestRequest();
            req1.requestURI = '/services/apexrest/IssueRegisterParticipant';
            req1.httpMethod = 'GET';
            RestContext.request = req1;

        // Test: Call the method
        List<MobileIssueRegisterParticipant.ParticipantWrapper> result = MobileIssueRegisterParticipant.getParticipantList();
        }
        
        Test.stopTest();
    }
     Static testMethod void partcipantGetRESTTestMethod(){
        Test.startTest();
       User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) {     
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.params.put('cname', 'Test');
            req.params.put('isActive', 'false');
            req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/ParticipantDetails/';
            RestContext.request = req;
            RestContext.response = res;
        
           List<Client__c> clientList= mobileAppParticipantRESTHandler.getClients(); 
        }
        
        Test.stopTest();
    }
    
    Static testMethod void participantUpdateMethod(){
        Test.startTest();
       User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) { 
            Client__c cc= [select id from Client__c where Facility__r.Name='Ashfield Consultants' limit 1];
            string recordId= cc.Id;
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.params.put('IdValue',recordId);
            req.params.put('status', 'false');
            req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/ParticipantDetails/';
            RestContext.request = req;
            RestContext.response = res;
        
         	string clientList= mobileAppParticipantRESTHandler.updateClientStatus(recordId,'false'); 
        }
        
        Test.stopTest();
    }
    Static testMethod void participantPicklistAndUpdate(){
        Test.startTest();
        
       User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) { 
             Client__c cc= [select id from Client__c where Facility__r.Name='Ashfield Consultants' limit 1];
            
             Attachment__c attch= [select id from   Attachment__c where Added_By__c=:cc.id limit 1];
            string recordId= cc.Id;
             String requestBody = '{"recordID":"'+ recordId+'"}';
            // Simulate a POST request
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestBody = Blob.valueOf(requestBody);
           req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/AttachmentPicklistTypes/';
            req.httpMethod = 'POST';
            RestContext.request = req;
            RestContext.response = res;
           
     
       String deleteAttachment= mobileAppPicklistDeatils.deleteRepositoryPost();
        
        Test.stopTest();
    	}
    }
    
      Static testMethod void participantPicklist(){
        Test.startTest();
        
       User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) { 
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/AttachmentPicklistTypes/';
            RestContext.request = req;
            RestContext.response = res;
            req.httpMethod = 'get';	
       		list<String> picklistValues= mobileAppPicklistDeatils.getPicklistValues();
        
        Test.stopTest();
    	}
    }
    
    Static testMethod void participantJournalCreateAndGet(){
        Test.startTest();
        
       User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) { 
            Client__c cc= [select id from Client__c where Facility__r.Name='Ashfield Consultants' limit 1];
            string recordId= cc.Id;
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.params.put('ParticipantId',recordId);
            req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/ParticipantJournel/';
            RestContext.request = req;
            RestContext.response = res;
       		List<Client_Journel__c> clientJournal= mobileAppParticipantJournal.fecthParticipantList();
            
            string insertClientJournal=mobileAppParticipantJournal.createClientJournel(recordId,'', 'description', 'Care Notes');
        
        Test.stopTest();
    	}
    }
    
     Static testMethod void participantUserAndCreate(){
        Test.startTest();
       User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) { 
           
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/ParticipantUserList/';
            RestContext.request = req;
            RestContext.response = res;
       		List<User> clientJournal= mobileAppParticipantUser.getuserList();
            
        
        Test.stopTest();
    	}
    }
    
     Static testMethod void testInsertNewAttachment() {
        // Fetch client and user data for the test
         User userName= [SELECT Id from User where email='manualtesting.218616@hotmail.com' LIMIT 1];
        System.runAs(userName) { 
         Client__c cc= [select id from Client__c where Facility__r.Name='Ashfield Consultants' limit 1];
          string recordId= cc.Id;
        // Prepare the JSON body for the POST request (inserting a new attachment)
        String requestBody = '{"clientId": "' + recordId + '", "name": "New Attachment", "typeOfDocument": "Document", "userId": "' + userName.Id + '", "comments": "Test comments", "DocDate": "2024-09-18", "fileSize": "1024", "fileName": "testfile.pdf", "base64": "dGVzdGZpbGVjb250ZW50"}';

        // Simulate a POST request
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestBody = Blob.valueOf(requestBody);
        req.requestURI = '/services/apexrest/ParticipantUserList/';
        req.httpMethod = 'POST';
        RestContext.request = req;
        RestContext.response = res;

        
        Test.startTest();
        String result = mobileAppParticipantUser.insertAttachment();
        Test.stopTest();

    }
    }
}