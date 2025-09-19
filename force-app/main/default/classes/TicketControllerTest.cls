@isTest
public class TicketControllerTest {
    
    @testSetup
    static void setupData() {
        // Create Organisation record
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
        org.General_Shift_End_time__c='6:30 am';
        org.General_Shift_Start_Time__c='8:30 am';
        org.Afternoon_Shift_End_Time__c='3:30 pm';
        org.Afternoon_Shift_Start_Time__c='4:00 pm';
        org.Custom_Shift_Start_Time__c='6:30 am';
        org.Custom_Shift_End_Time__c='8:30 am';
        org.Night_Shift_End_Time__c='6:30 pm';
        org.Night_Shift_Start_Time__c='8:30 pm';
        org.User_Type__c='NDIS Org Admin';
        org.Support_Email__c = 'saran.kumar@tesseractapps.com';
        insert org;
        
        // Create a User to assign the ticket to (Required if Assigned_To__c expects User)
        User u = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'testuser@example.com',
            Username = 'testuser@example.com.test10',
            Alias = 'tuser',
            ProfileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id,
            TimeZoneSidKey = 'America/New_York',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
        insert u;
        
        // Store values in a Custom Setting or Custom Metadata if required for reference
        System.runAs(u){   
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
            
            Child_Staff__c cs = new Child_Staff__c();
            cs.Expiry_Date__c =date.newInstance(2028, 01, 05); 
            cs.Staff__c=staff.id;
            cs.Comments__c='test ';
            insert cs;         
        }
    }
    
    @isTest
    static void testCreateTicketSuccess() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE Email = 'testuser@example.com' LIMIT 1];
        
        Map<String, Object> ticketMap = new Map<String, Object>{
            'Ticket_generated_number__c' => 1001,
                'Ticket_Name__c' => 'Sample Ticket',
                'Email_ID__c' => 'test@example.com',
                'Contact_Number__c' => '1234567890',
                'Date_Of_Issue__c' => String.valueOf(Date.today()),
                'Manager_Name__c' => 'Test Manager',
                'Organization_Name__c' => org.Id,
                'Organization__c' => org.Id,
                'Belong_To__c' => u.Id,
                'Submitting_To__c' => 'External',
                'User_Name__c' => 'testuser',
                'Files_URL__c' => 'http://example.com/file.pdf',
                'Category__c' => 'Technical Issue',
                'Platform__c' => 'Web',
                'Module__c' => 'Admin',
                'Priority__c' => 'High',
                'Status__c' => 'Open',
                'Submitted_By__c' => 'Self',
                'Assigned_To__c' => u.Id,
                'Description__c' => 'This is a test ticket.',
                'Subject__c' => 'Login issue'
                };
                    
                    Test.startTest();
        Ticket__c createdTicket = TicketManager.createTicket(ticketMap);        
        Test.stopTest();
    }
    
    @isTest
    static void testCreateTicketInvalidDate() {
        Map<String, Object> ticketData = new Map<String, Object>{
            'Ticket_generated_number__c' => 1002,
                'Date_Of_Issue__c' => 'invalid-date' // This should cause exception
                };
                    
                    Test.startTest();
        try {
            TicketManager.createTicket(ticketData);
            // System.assert(false, 'Exception should have been thrown for invalid date');
        } catch (AuraHandledException e) {
            // System.assert(e.getMessage().contains('Failed to save ticket'), 'Expected custom exception message');
        }
        Test.stopTest();
    }
    
    @isTest
    static void testGetOrganisations() {
        Test.startTest();
        List<Organisation__c> orgs = TicketManager.getOrganisations();
        Test.stopTest();
        
        // System.assert(!orgs.isEmpty(), 'Organisations should be returned');
        //System.assertEquals('Test Org', orgs[0].Name);
    }
    
    @isTest
    static void testGetTickets_TesseractApps() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE Email = 'testuser@example.com' LIMIT 1];
        Test.startTest();
        List<Ticket__c> getTickets = TicketManager.getTickets(org.Id, 'Tesseract Apps');
        List<User> getUsersByOrganizationName = TicketManager.getUsersByOrganizationName('Ashfield Consultants');
        List<User> getUsersByIds = TicketManager.getUsersByIds(new List<Id>{ u.Id });
        List<String> getTicketingMembers = TicketManager.getTicketingMembers(org.Id);
        String orgName = TicketManager.getOrgNameById(org.Id);
        Test.stopTest();
    }
    
    @isTest
    static void testGetTicketDetailsById() {
        
        User u = [SELECT Id,Name FROM User WHERE Email = 'testuser@example.com' LIMIT 1];
        Organisation__c org = [SELECT Id,Name FROM Organisation__c LIMIT 1];
        
        List<Map<String, Object>> existingConversations = new List<Map<String, Object>>();
        Facility__c fac = [SELECT ID,Manager_Name__c from Facility__c LIMIT 1];
        
        Staff__c staff = [SELECT ID,Contact_Number__c,Email_Address__c from Staff__c LIMIT 1];
        
        existingConversations.add(new Map<String, Object>{
            'sender' => 'User B',
                'timestamp' => '2025-05-04T10:00:00Z',
                'message' => 'Previous message'
                });
        
        // Create a Ticket__c record
        Ticket__c ticket = new Ticket__c(
            Ticket_Name__c = 'Test Ticket',
            Ticket_generated_number__c = 1001,
            Subject__c = 'Sample Subject',
            Status__c = 'Open',
            Assigned_To__c = u.Id,
            Submitted_By__c = 'Self',
            User_Name__c = 'JohnD',
            Email_ID__c = 'saran.kumar@tesseractapps.com',
            Contact_Number__c = '1234567890',
            Manager_Name__c = 'Jane Manager',
            Date_Of_Issue__c = Date.today(),
            Organization_Name__c = org.Name,
            Priority__c = 'High',
            Module__c = 'Admin',
            Category__c = 'Technical Issue',
            Platform__c = 'Web',
            Description__c = 'Sample description',
            Conversations__c = JSON.serialize(existingConversations),
            Resolution__c = 'Pending',
            History_log__c = 'None',
            Attachment__c = 'url1',
            Post_Attachment__c = 'url2'
        );
        insert ticket;
        
        Ticket__c updatedTicket = new Ticket__c(
            Id = ticket.Id,
            Assigned_To__c = u.Id,
            Status__c = 'In Progress'
        );
        
        String resolution = 'Issue resolved after troubleshooting.';
        List<Object> logs = new List<Object>();    
        Map<String, Object> entry = new Map<String, Object>{
            'user' => u.Name,
                'timestamp' => System.now().format('MMM dd, yyyy hh:mm a'),
                'actionType' => 'Test',
                'content' => 'Content'
                };
                    
                    logs.add(entry);
        ticket.History_Log__c = JSON.serialize(logs);
        ticket.Post_Attachment__c = '';
        update ticket;
        
               
        Test.startTest();
        Ticket__c getTicketDetailsById = TicketManager.getTicketDetailsById(ticket.Id);
        TicketManager.updateTicket(updatedTicket);
        TicketManager.appendConversationEntry(ticket.Id, 'User A', '2025-05-05T12:00:00Z', 'Follow-up message');
        TicketManager.updateResolution(ticket.Id, resolution);
        List<String> getStatusPicklistValues = TicketManager.getStatusPicklistValues();
        TicketManager.appendHistoryEntry(ticket.Id, 'Test', 'Content');
        String getHistoryLog = TicketManager.getHistoryLog(ticket.Id);
        TicketManager.deletePostAttachmentFromTicket(ticket.Id);
        TicketManager.sendTicketNotificationEmails(ticket.Id);
        TicketManager.sendAssignedTicketNotificationEmails(ticket.Id);
        TicketManager.sendAssignedTicketNotificationEmailsWithEmail(ticket.Id, 'saran.kumar@tesseractapps.com');
        TicketManager.sendResolvedTicketEmail(ticket.Id);
        //TicketManager.getStaffByEmail('saran.kumar@tesseractapps.com');
      //  TicketManager.getContactNumberByEmail('saran.kumar@tesseractapps.com');
		TicketManager.sendAssignmentEmailOnStatusOnly(ticket.Id);
        TicketManager.getContactNumberByEmail(staff.Email_Address__c);
        TicketManager.getStaffByEmail(staff.Email_Address__c);
        TicketManager.getManagerNameFromFacility(fac.Id);
        TicketManager.escapeHtml('Ticket Manager Testing');
        Test.stopTest();
        
    }
    
}