@RestResource(urlMapping='/myTicketsApi/*')
global class MobileAppMyTicketHandler {
   @HttpGet
    global static void getMyTickets(){
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();    
        try {
            
            MobileAppTicketManagerHandler.loggedInUserWrapper orgInfo=MobileAppTicketManagerHandler.getUserOrgDetails(); 
          	List<Ticket__c> tickets = [
                SELECT Id, Ticket_Name__c, Ticket_generated_number__c, Subject__c,
                Status__c, Assigned_To__c, Assigned_To__r.Name, Assigned_To__r.Email,Belong_To__c,
                Submitted_By__c, User_Name__c, Email_ID__c, Contact_Number__c,Files_URL__c,
                Manager_Name__c, Date_Of_Issue__c, Priority__c, Module__c,Submitting_To__c, 
                Category__c, Platform__c, Description__c, CreatedBy.Email, Belong_To__r.Email,History_Log__c, 
                 Organization__c,Organization__r.Name, CreatedDate
                FROM Ticket__c
                WHERE Organization__c = :orgInfo.org.Id  AND  Belong_To__r.Email =:orgInfo.u.Email
                ORDER BY CreatedDate DESC
            ];
            list<MobileAppTicketManagerHandler.TicketWrapper> tcWrapper = new  list<MobileAppTicketManagerHandler.TicketWrapper>();
            for(Ticket__c tc: tickets){
               MobileAppTicketManagerHandler.TicketWrapper myTickets= new MobileAppTicketManagerHandler.TicketWrapper ();
                myTickets.ticketName =tc.Ticket_Name__c;
                myTickets.ticketGeneratedNumber= Integer.valueof(tc.Ticket_generated_number__c);
                myTickets.emailId=tc.Email_ID__c;
                myTickets.contactNumber=tc.Contact_Number__c;
                myTickets.dateOfIssue=tc.Date_Of_Issue__c;
                myTickets.managerName=tc.Manager_Name__c;
                myTickets.organizationName=tc.Organization__r.Name;
                myTickets.organizationId=tc.Organization__c;
                myTickets.belongToId=tc.Belong_To__c;
                myTickets.submittingTo=tc.Submitting_To__c;
                myTickets.userName=tc.User_Name__c;
                myTickets.filesUrl=tc.Files_URL__c;
                myTickets.category=tc.Category__c;
                myTickets.platform=tc.Platform__c;
                myTickets.module=tc.Module__c;
                myTickets.priority=tc.Priority__c;
                myTickets.status=tc.Status__c;
                myTickets.submittedBy=tc.Submitted_By__c;
                myTickets.assignedToId=tc.Assigned_To__c;
                myTickets.description=tc.Description__c;
                myTickets.subject=tc.Subject__c;
                myTickets.history=tc.History_Log__c;
                myTickets.AssignToName=tc.Assigned_To__r.Name;
                tcWrapper.add(myTickets);
            }
            
                
            responseMap.put('myTickets', tcWrapper);
            responseMap.put('success', true);
            responseMap.put('message', 'Ticket Details feteched Successfully');
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error creating ticket: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }

}