@RestResource(urlMapping='/ticketApi/*')
global without sharing class MobileAppTicketManagerHandler {
    @HttpPost
    global static void createTicket() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            // Read the request body as a JSON string
            RestRequest req = RestContext.request;
            String requestBody = req.requestBody.toString();
            
            if (String.isBlank(requestBody)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request body cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            loggedInUserWrapper orgInfo=getUserOrgDetails(); 
            
            // Deserialize the JSON into TicketWrapper instead of StatusRequest
            TicketWrapper ticket = (TicketWrapper)JSON.deserialize(requestBody, TicketWrapper.class);
            
            Ticket__c newTicket = new Ticket__c();
            Map<String, Object> ticketNum =generateTicketInfo();
            newTicket.Ticket_Name__c = string.valueof(ticketNum.get('name'));
            newTicket.Ticket_generated_number__c =(Decimal) ticketNum.get('number');
            newTicket.Email_ID__c = ticket.emailId;
            newTicket.Contact_Number__c = ticket.contactNumber;
           	newTicket.Date_Of_Issue__c = ticket.dateOfIssue;
            newTicket.Manager_Name__c = ticket.managerName;
            newTicket.Organization_Name__c = orgInfo.org.Name;
            newTicket.Organization__c =orgInfo.org.Id;
            newTicket.Belong_To__c = ticket.belongToId;
            newTicket.Submitting_To__c = ticket.submittingTo;
            newTicket.User_Name__c = ticket.submittedBy=='Self' ?orgInfo.u.FirstName +' '+orgInfo.u.LastName:ticket.userName;
            newTicket.Category__c = ticket.category;
            newTicket.Platform__c = ticket.platform;
            newTicket.Module__c = ticket.module;
            newTicket.Priority__c = ticket.priority;
            newTicket.Status__c = 'Open';
            newTicket.Submitted_By__c = ticket.submittedBy  ;
            newTicket.Assigned_To__c = ticket.assignedToId;
            newTicket.Description__c = ticket.description;
            newTicket.Subject__c = ticket.subject;
            
            insert newTicket;
            SYSTEM.DEBUG('newTicket '+newTicket);
            if (newTicket.id != null && ticket.fileName != null) {
                try {
                    String fileName = ticket.fileName.trim().replaceAll('\\s+', '_');
                    system.debug('filename '+fileName);
                    AWSS3FileUploadController.uploadFile(ticket.base64, fileName,String.valueOf(newTicket.id),'Attachment');
                } catch (Exception e) {
                    responseMap.put('success', false);
                    responseMap.put('message',  e.getMessage());
                    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                    return;
                }
            }
             if (newTicket.id !=null) {
                try {
                 
                    TicketManager.sendTicketNotificationEmails(newTicket.id);
                    if(newTicket.Assigned_To__c != null){
                        TicketManager.sendAssignedTicketNotificationEmailsWithEmail(newTicket.id,ticket.emailId);
                    }
                } catch (Exception e) {
                    responseMap.put('success', false);
                    responseMap.put('message',  e.getMessage());
                    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                    return;
                }
            }
             if (newTicket.id != null && newTicket.Submitting_To__c =='Internal' ) {
                try {
                 	String  content='Ticket assigned to '+ newTicket.User_Name__c+' on creation.';
                    TicketManager.appendHistoryEntry(newTicket.id,'Assignment Added',content);
                   
                } catch (Exception e) {
                    responseMap.put('success', false);
                    responseMap.put('message',  e.getMessage());
                    res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                    return;
                }
            }
                
            // Prepare success response
            responseMap.put('success', true);
            responseMap.put('message', 'Ticket created successfully');
            responseMap.put('ticketId', newTicket.Id);
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error creating ticket: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    
   @HttpGet
    global static void getTicketData(){
         RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();    
        try {
           
            loggedInUserWrapper orgInfo=getUserOrgDetails(); 
            list<User> userList= [SELECT Id, FirstName, LastName, Email, IsActive, Organization_Name__c ,UserRole.Name
                                  FROM User where Organization_Name__c =:orgInfo.org.Name and IsActive=true and Email !=:orgInfo.u.Email];
            set<string> emailList= new set<string>();
            map<String,string> userManagerName= new map<String,string>();
             map<String,string> userContactName= new map<String,string>();
            for(User u:userList){
                emailList.add(u.Email);
            }
            list<staff__c> staffList= [select Id,Contact_Number__c,Facility__r.Name,Facility__r.Manager_Name__c,Email_Address__c from staff__c where Email_Address__c In:emailList];
             for(staff__c ss:staffList){
                userManagerName.put(ss.Email_Address__c,ss.Facility__r.Manager_Name__c);
                 userContactName.put(ss.Email_Address__c,ss.Contact_Number__c);
            }
             list<userListWrapper> allUserList= new list<userListWrapper>();
             for(User u:userList){
               userListWrapper uWrap =new userListWrapper();
                 uWrap.userId=u.Id;
                  uWrap.firstName=u.FirstName;
                  uWrap.lastName=u.LastName;
                  uWrap.isActive=u.IsActive;
                  uWrap.orgName=u.Organization_Name__c;
                  uWrap.userRoleName=u.UserRole.Name;
                  uWrap.managerName=userManagerName.get(u.Email);
                  uWrap.contactNumber=userContactName.get(u.Email);
                  uWrap.email=u.Email;
                 allUserList.add(uWrap);
            }
            
            list<User> AssignToUsers=[select Id,FirstName, LastName, Email from user where IsActive=true and Id IN:orgInfo.ticketingMembers];
            List<String> allowedModules = new List<String>{'Dashboard', 'Roster Management', 'Participants', 'Incident Register', 'My Profile', 'Repository', 'Sign In', 'ChaT', 'Other'};

             responseMap.put('AssignToUsers', AssignToUsers);
             responseMap.put('userList', allUserList);
            responseMap.put('staffModuleList', allowedModules);
             responseMap.put('success', true);
            responseMap.put('message', 'Org and user details fetched successfully');
          //  responseMap.put('ticketId', newTicket.Id);
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error creating ticket: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
        
    }
    
    
    public static Map<String, Object> generateTicketInfo() {
        DateTime now = DateTime.now();
        
        // Manually pad day and month with leading zero if needed
        String day = (now.day() < 10 ? '0' : '') + String.valueOf(now.day());
        String month = (now.month() < 10 ? '0' : '') + String.valueOf(now.month());
        String year = String.valueOf(now.year());
        
        String dateStr = day + month + year; // ddmmyyyy format
        
        // Generate 4-digit random number
        Integer randomSequence = Math.mod(Math.abs(Crypto.getRandomInteger()), 9000) + 1000;
        String randomSequenceStr = String.valueOf(randomSequence);
        
        String ticketName = 'TKT-' + dateStr + '-' + randomSequenceStr;
        Long ticketNumber = Long.valueOf(dateStr + randomSequenceStr);
        
        return new Map<String, Object>{
            'name' => ticketName,
                'number' => ticketNumber
                };
   }
    
       public class loggedInUserWrapper {
        public User u;
        public Organisation__c org;
		public List<String> ticketingMembers; // new field to hold the array
    
        public loggedInUserWrapper(User u, Organisation__c org,List<String> ticketingMembers) {
            this.u = u;
            this.org = org;
            this.ticketingMembers=ticketingMembers;
        }
    
    }
 public  static loggedInUserWrapper getUserOrgDetails() {
        User objUser = [ SELECT Id,FirstName, LastName,Organization_Name__c, Email
            FROM User  WHERE Id = :UserInfo.getUserId()];

        Organisation__c orgDetails = [
            SELECT Id,Name,Ticketing_Members__c FROM Organisation__c 
            WHERE Name = :objUser.Organization_Name__c 
            LIMIT 1
        ];
     List<String> ticketingMembers = new List<String>();
     if (orgDetails.Ticketing_Members__c != null) {
         ticketingMembers = orgDetails.Ticketing_Members__c.split('\n');
     }
     
     return new loggedInUserWrapper(objUser, orgDetails, ticketingMembers);
 } 
  
    
    public class TicketWrapper {
    public Integer ticketGeneratedNumber;
    public String ticketName;
    public String emailId;
    public String contactNumber;
    public Date dateOfIssue;
    public String managerName;
    public String organizationName;
    public Id organizationId;
    public Id belongToId;
    public String submittingTo;
    public String userName;
    public String filesUrl;
    public String category;
    public String platform;
    public String module;
    public String priority;
    public String status;
    public String submittedBy;
    public Id assignedToId;
    public String description;
    public String subject;
    public string fileName;
    public String base64;
    public string history;
    public string AssignToName;
}
    public class userListWrapper{
        public string userId;
        public string firstName;
        public string lastName;
        public boolean isActive;
        public string orgName ;
        public string userRoleName; 
        public string managerName;
        public string contactNumber;
       public string email;
        
    }    
}