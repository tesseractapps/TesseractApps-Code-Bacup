@isTest
public class issueRegisterSearchTest {
    @testSetup Static void createtestData(){
        
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
        insert org;
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.96948@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test nagendra96948', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.96948@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        System.runAs(user) { 
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
            fac.ABN__c='1235645433';
            fac.Phone__c = '12323213';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.96948@hotmail.com';
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
            cli.Facility__c=fac.Id;
            insert cli;
            
            System.debug('facility Id>>'+fac.Id);       
       		System.debug('facility name >>'+fac.Name);       
            System.debug('Organisation ID>>'+org.Id);
            System.debug('Organisation name>>'+org.Name); 
             System.debug('user name>>'+user.Organization_Name__c); 
            
           Case cases = new Case();
            cases.Status='New';
            cases.Origin='Web';
            cases.Priority = 'High';
            cases.Client__c = cli.Id;
            cases.Facility__c = fac.Id;
            cases.Type_of_Issue__c = 'Own Org';
            cases.Organization__c = org.Id;
            cases.First_Name__c = 'Testing';
            cases.Last_Name__c = 'Automation';
            cases.Email__c = 'testingautomation@gmail.com';
            cases.Phone_Number__c = '98787667868';
            cases.Role__c = 'AIN';
            cases.Allegation__c = 'Participant';
            cases.Reported_to_the_Police__c = 'Yes';
            cases.Police_Comments__c = 'Test Description';
            cases.Description = 'Description';
            cases.Description1__c = 'Descripton 1';
            cases.Description2__c = 'Description2';
            cases.Description3__c = 'Description3';
            cases.Regarding_the_Issue__c = 'No';
            cases.Revelant_Issue_Type__c = 'Unreasonable use of force';
            Cases.Date_And_Time_Alleged__c = Datetime.newInstance(2024, 6, 28, 14, 30, 0);
            cases.Date_and_Time_Incident__c = Datetime.newInstance(2024, 6, 29, 13, 30, 0);
            insert cases; 
        }
        
    }
    @isTest
    public static void TestfetchFiles(){      
        String jsonInput = '[{"test","testone","testtwo","testthree"}]';
        String result = '["name","fName","cName","submittedBy","priority"]';
        String typeofIssue ='Own Org';
        
        user u =[select id from user where email='manualtesting.96948@hotmail.com' limit 1];
        System.runAs(u) {
            Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name='Ashfield Consultants' LIMIT 1];
            string organisationID=org.id;
            issueRegisterSearch.searchIssues(result,typeofIssue);
            issueRegisterSearch.getIssues(typeofIssue, organisationID);
            issueRegisterSearch.getLeads();
            
            issueRegisterSearch.getUserDetails();
            issueRegisterSearch.getUserLicense();
            staff__c stff=[select id from staff__C limit 1];
                    
        Facility__c fac = [SELECT Id FROM Facility__c WHERE Name='Ashfield Consultants' LIMIT 1];
        Client__c client = [SELECT Id FROM Client__c WHERE First_Name__c='Test' AND Last_Name__c='Participant' LIMIT 1];
         // Build signature JSON
        Map<String, Object> signatureMap = new Map<String, Object>();
        signatureMap.put('signature', '<p>prashanth</p>');
        signatureMap.put('name', 'Reviewer Name');
        signatureMap.put('designation', 'Org Admin');
        signatureMap.put('mostReleventOthers', 'Other notes');
        String jsonSignature = JSON.serialize(signatureMap);

        Test.startTest();
         Case newCase =issueRegisterSearch.saveCaseRecord(organisationID, 'Alice', 'Alice1','Johnson',client.Id, fac.Id, 'AIN','alice.johnson@example.com','1122334455', 'Open',
                                      'Low','Participant','Unreasonable use of force',Date.today(), '10:00 AM', Date.today().addDays(-1), '10:00 AM', 'New Description',
                                      'Yes', 'Yes', 'Police comments','Actions taken', 'Additional info', 'Future actions',
                                      client.Id, 'Test subcontactor','test participant','test facility',stff.id,stff.id,jsonSignature);
            
    
          Case c = [SELECT Id FROM Case LIMIT 1];
 			Case newCase2 =issueRegisterSearch.updateCaseRecord(c.id,organisationID, 'Alice', 'Alice1','Johnson',client.Id, fac.Id, 'AIN','alice.johnson@example.com','1122334455', 'Open',
                                      'Low','Participant','Unreasonable use of force',Date.today(), '10:00 AM', Date.today().addDays(-1), '10:00 AM', 'New Description',
                                      'Yes', 'Yes', 'Police comments','Actions taken', 'Additional info', 'Future actions',
                                      client.Id, 'Test subcontactor','test participant','test facility',stff.id,stff.id,jsonSignature);
            
              // Mocking the RestRequest for @HttpPost method
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/IssueRegisterAPI';
        req.httpMethod = 'POST';
            
             // Create a mock JSON string to simulate case data input
        MobileIssueregisterRest.CaseRecordWrapper caseData = new MobileIssueregisterRest.CaseRecordWrapper();
        caseData.ReporterfirstName = 'Alice';
        caseData.ReporterlastName = 'Alice1';
        caseData.IncidentDescription = 'Test incident description';
        caseData.fileName = null;
        caseData.base64 = null;
       	caseData.IncidentOthers = 'Alice';
        caseData.ReporterParticipantId = client.Id;
        caseData.ReporterfacilityId = fac.Id;
        caseData.ReporterRole = 'AIN';
        caseData.ReporterEmail = 'alice.johnson@example.com';
         caseData.ReporterPhone = '1245386';
        caseData.ReporterStatus = 'open';
        caseData.IncidentPriorityValue = 'Low';
        caseData.IncidentInvolvedByValue = 'Participant';
        caseData.IncidentRelaventTypeValue = 'Unreasonable use of force';
       	caseData.incidentDate = Date.today() ;
        caseData.incidentTime =  '10:00 AM';
        caseData.allegedDate =  Date.today().addDays(-1);
        caseData.allegedTime = '10:00 AM';
         caseData.IncidentDescription = 'Alice';
        caseData.ActionReportToPolice = 'Yes';
        caseData.ActionRegardingtheIssue = 'Yes';
        caseData.ActionPoliceComments = 'testfile.txt';
        caseData.ActionDescription1 = 'VGhpcyBpcyBhIHRlc3QgZmlsZSBjb250ZW50';
       	caseData.ActionDescription2 = 'Alice';
        caseData.ActionDescription3 = 'Alice1';
        caseData.IncidentRepresentativeValue = 'Test incident description';
        caseData.IncidentSubContractorValue = 'testfile.txt';
        caseData.IncidentParticipantId = client.Id; 
        caseData.IncidentSelectedFacilityId = fac.Id;
        caseData.IncidentSelectedStaffId = stff.id;
        caseData.ReporterAssignTo = stff.id;
        caseData.IncidentmostReleventothers = 'testfile.txt';
        
        req.requestBody = Blob.valueOf(JSON.serialize(caseData));
        RestContext.request = req;

        String response = MobileIssueregisterRest.saveCaseRecordViaApi();
        caseData.recordId = c.id;
            
        req.requestBody = Blob.valueOf(JSON.serialize(caseData));
        RestContext.request = req;
        String response1 = MobileIssueregisterRest.saveCaseRecordViaApi();
        
        issueRegisterSearch.getEmployeeData(fac.Id);  
            issueRegisterSearch.getCaseHistoryLog(c.Id);
            issueRegisterSearch.getIssuesbyId(c.Id);
        Test.stopTest();

        }     
    }
    
    @IsTest
    static void testGetIssueList() {
        Test.startTest();        
        // Mocking the RestRequest and RestContext for HttpGet method       
         user u =[select id from user where email='manualtesting.96948@hotmail.com' limit 1];
        System.runAs(u) {
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/IssueRegisterAPI';
            req.httpMethod = 'GET';
            RestContext.request = req;
            
            List<Case> result = MobileIssueregisterRest.getIssueList();
            
            Case c = [SELECT Id FROM Case LIMIT 1];
            RestRequest req2 = new RestRequest();
            RestResponse res2 = new RestResponse();
            req2.requestUri = '/services/apexrest/issueRegisterEditApi/';
            req2.addParameter('recordID', c.id);
            RestContext.request = req2;
            MobileIssueregisterRest.CaseRecordWrapper currentIssue=MobileIssueRegisterEditApi.getIssueByid();
        }
     
        Test.stopTest();
    }
    
   
}