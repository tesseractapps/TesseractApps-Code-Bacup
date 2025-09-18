@isTest
public class MobileAppTicketManagerHandlerTest {

        @testsetup 
    Static void testData(){
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
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
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
            insert staff; 
            
     
      
            
            
            
               
        }        
    }
   
    @isTest
    static void testCreateTicket_success() {
        User u = [SELECT Id, Email FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
  
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];

        System.runAs(u) {
          Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20294637@hotmail.com' LIMIT 1];              
            MobileAppTicketManagerHandler.TicketWrapper wrap = new MobileAppTicketManagerHandler.TicketWrapper();
            wrap.emailId = 'saran.kumar@tesseractapps.com';
            wrap.contactNumber = '1234567890';
            wrap.dateOfIssue = Date.today();
            wrap.managerName = 'Test Manager';
          //  wrap.organizationName = 'Ashfield Consultants';
          //  wrap.organizationId = org.Id;
            wrap.belongToId = u.Id;
            wrap.submittingTo = 'Internal'; // to skip history
            wrap.userName = 'Mobile User';
            wrap.category = 'Technical Issue';
            wrap.platform = 'Web';
            wrap.status = 'Open';
            wrap.module = 'Repository';
            wrap.priority = 'High';
            wrap.submittedBy = 'Self';
            wrap.assignedToId = u.Id; // skip email logic
            wrap.description = 'Mobile ticket test';
            wrap.subject = 'Test Subject';
          //  wrap.fileName = 'dummyFile.jpeg';
          //  wrap.base64 = EncodingUtil.base64Encode(Blob.valueOf('Sample content'));
           //  wrap.base64 = '"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="';


            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/ticketApi/';
            req.httpMethod = 'POST';
            req.requestBody = Blob.valueOf(JSON.serialize(wrap));
            RestContext.request = req;
            RestContext.response = res;

            Test.startTest();
            MobileAppTicketManagerHandler.createTicket();
            Test.stopTest();

            String response = res.responseBody != null ? res.responseBody.toString() : '';
            System.debug('CREATE RESPONSE: ' + response);

        }
    }

    @isTest
    static void testCreateTicket_emptyBody() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/ticketApi/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(''); // empty body
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileAppTicketManagerHandler.createTicket();
        Test.stopTest();

        String response = res.responseBody != null ? res.responseBody.toString() : '';
        System.debug('EMPTY BODY RESPONSE: ' + response);
        System.assert(response.contains('Request body cannot be empty'), 'Should show empty body error');
    }

    @isTest
    static void testGetTicketData_success() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        System.runAs(u) {
            Organisation__c org = [SELECT Id, Name FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
            org.Ticketing_Members__c = u.Id;
            update org;
            
            
            Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
            
            List<User> userList = new List<User>();
            List<Staff__c> staffList = new List<Staff__c>();
            List<Facility__c> facilities = new List<Facility__c>();
            
            // Create one facility for all staff
            Facility__c fac = new Facility__c(
                Name = 'Consultants125412',
                Address__City__s = 'Crace',
                Address__Street__s = '8 Keewong Street',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                Email__c = 'testonefacility14@gmail.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '1223456714222',
                Phone__c = '12323432'
            );
            insert fac;
            
            // Bulk create 3 users and staff
            for (Integer i = 1; i <= 3; i++) {
                String email = 'teststaff1245214521144' + i + '@testemail.com';
                
                // User record
                userList.add(new User(
                    Alias = 'user' + i,
                    Email = email,
                    EmailEncodingKey = 'UTF-8',
                    LastName = 'StaffUser' + i,
                    LanguageLocaleKey = 'en_US',
                    LocaleSidKey = 'en_US',
                    ProfileId = prof.Id,
                    TimeZoneSidKey = 'America/New_York',
                    User_Type__c = 'NDIS Org Admin',
                    UserName = email,
                    Organization_Name__c = org.Name
                ));
                
                // Matching Staff record
                staffList.add(new Staff__c(
                    Name = 'Staff ' + i,
                    Name__c = 'AutoName ' + i,
                    Last_Name__c = 'Lastname ' + i,
                    Email_Address__c = email,
                    Contact_Number__c = '987654321' + i,
                    Facility__c = fac.Id,
                    Address__Street__s = '8 Keewong Street',
                    Address__City__s = 'Crace',
                    Address__StateCode__s = 'ACT',
                    Address__PostalCode__s = '2911',
                    Emergency_Phone_Number__c = '45678766675',
                    Primary_Contact_Name__c = 'Contact ' + i,
                    Primary_Contact_Number__c = '99084582' + i,
                    Primary_Contact_Email__c = 'primary' + i + '@mail.com',
                    Make_Primary_as_Approver__c = true,
                    Secondary_Contact_Name__c = 'Secondary ' + i,
                    Secondary_Contact_Email__c = 'secondary' + i + '@mail.com',
                    Make_Secondary_as_Approver__c = false,
                    Secondary_Contact_Number__c = '9908458295' + i,
                    Emp_exit_date__c = Date.newInstance(2028, 1, 5),
                    Emp_Start_Date__c = Date.newInstance(2023, 2, 1),
                    Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4),
                    Date_Of_Birth__c = Date.newInstance(2000 + i, 2, 4),
                    Role__c = 'Admin',
                    Residency_Type__c = 'Australian',
                    Expiry_Date__c = Date.newInstance(2025, 2, 19),
                    Type__c = 'Visa Status',
                    Working_Hours_Rate__c = 50,
                    Final_Overall_Rate__c = 150,
                    Saturday_Hourly_Rate__c = 130,
                    Sunday_Hourly_Rate__c = 50
                ));
            }
            
            insert userList;
            insert staffList;
      
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/ticketApi/';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;

            Test.startTest();
            MobileAppTicketManagerHandler.getTicketData();
            Test.stopTest();

            String response = res.responseBody != null ? res.responseBody.toString() : '';
            System.debug('GET DATA RESPONSE: ' + response);

            System.assert(response.contains('"success":true'), 'Expected success=true in response.');
            System.assert(response.contains('userList'), 'Expected userList in response.');
            System.assert(response.contains('AssignToUsers'), 'Expected AssignToUsers in response.');
        }
    }
}