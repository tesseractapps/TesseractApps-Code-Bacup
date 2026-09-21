public without sharing class TicketManager {
    
    @AuraEnabled
    public static Ticket__c createTicket(Map<String, Object> ticket) {
        try {
            Ticket__c newTicket = new Ticket__c();
            
            newTicket.Ticket_generated_number__c = ((Decimal) ticket.get('Ticket_generated_number__c')).intValue();
            
            newTicket.Ticket_Name__c = (String) ticket.get('Ticket_Name__c');
            
            newTicket.Email_ID__c = (String) ticket.get('Email_ID__c');
            newTicket.Contact_Number__c = (String) ticket.get('Contact_Number__c');
            
            String dateString = (String) ticket.get('Date_Of_Issue__c');
            if (String.isNotBlank(dateString)) {
                newTicket.Date_Of_Issue__c = Date.valueOf(dateString);
            }
            
            newTicket.Manager_Name__c = (String) ticket.get('Manager_Name__c');
            newTicket.Organization_Name__c = (String) ticket.get('Organization_Name__c');
            newTicket.Organization__c = (Id) ticket.get('Organization__c');
            newTicket.Belong_To__c = (Id) ticket.get('Belong_To__c');
            newTicket.Submitting_To__c = (String) ticket.get('Submitting_To__c');
            newTicket.User_Name__c = (String) ticket.get('User_Name__c');
            newTicket.Files_URL__c = (String) ticket.get('Files_URL__c');
            newTicket.Category__c = (String) ticket.get('Category__c');
            newTicket.Platform__c = (String) ticket.get('Platform__c');
            newTicket.Module__c = (String) ticket.get('Module__c');
            newTicket.Priority__c = (String) ticket.get('Priority__c');
            newTicket.Status__c = (String) ticket.get('Status__c');
            newTicket.Submitted_By__c = (String) ticket.get('Submitted_By__c');
            newTicket.Assigned_To__c = (Id) ticket.get('Assigned_To__c');
            newTicket.Description__c = (String) ticket.get('Description__c');
            newTicket.Subject__c = (String) ticket.get('Subject__c');
            
            insert newTicket;
            return newTicket;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to save ticket: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Organisation__c> getOrganisations() {
        return [SELECT Id, Name, Email__c FROM Organisation__c ORDER BY Name];
    }
    
    public class TicketWrapper implements Comparable {
    public Ticket__c ticket;
    public TicketWrapper(Ticket__c t) {
        this.ticket = t;
    }
    
    public Integer compareTo(Object o) {
        TicketWrapper other = (TicketWrapper) o;
        // DESCENDING: latest first
        if (this.ticket.CreatedDate > other.ticket.CreatedDate) {
    return -1; // for descending order
} else if (this.ticket.CreatedDate < other.ticket.CreatedDate) {
    return 1;
}
return 0;

    }
}

    
    @AuraEnabled(cacheable=true)
    public static List<Ticket__c> getTickets(Id orgId, String orgName) {
        if (String.isBlank(orgName) || orgId == null) {
            throw new AuraHandledException('Organization name and ID are required.');
        }
        String itSupport = [SELECT IT_Support__c FROM User WHERE Id = :UserInfo.getUserId()].IT_Support__c;
        List<Ticket__c> tickets = new List<Ticket__c>();
        
        if (itSupport == 'Yes') {
            List<Ticket__c> internalTickets = [
                SELECT Id, Ticket_Name__c, Ticket_generated_number__c, Subject__c,
                Status__c, Assigned_To__c, Assigned_To__r.Name, Assigned_To__r.Email,
                Submitted_By__c, User_Name__c, Email_ID__c, Contact_Number__c,
                Manager_Name__c, Date_Of_Issue__c, Priority__c, Module__c, 
                Category__c, Platform__c, Description__c, CreatedBy.Email, Belong_To__r.Email,
                Submitting_To__c, Organization__c,Organization__r.Name, CreatedDate
                FROM Ticket__c
                WHERE Submitting_To__c = 'Internal' AND Organization__c = :orgId
                ORDER BY CreatedDate DESC
            ];
            
            List<Ticket__c> externalTickets = [
                SELECT Id, Ticket_Name__c, Ticket_generated_number__c, Subject__c,
                Status__c, Assigned_To__c, Assigned_To__r.Name, Assigned_To__r.Email,
                Submitted_By__c, User_Name__c, Email_ID__c, Contact_Number__c,
                Manager_Name__c, Date_Of_Issue__c, Priority__c, Module__c, 
                Category__c, Platform__c, Description__c, CreatedBy.Email, Belong_To__r.Email,
                Submitting_To__c, Organization__c,Organization__r.Name, CreatedDate
                FROM Ticket__c
                WHERE Submitting_To__c = 'External'
                ORDER BY CreatedDate DESC
            ];
            
            List<TicketWrapper> wrappers = new List<TicketWrapper>();
                for (Ticket__c t : internalTickets) {
                    wrappers.add(new TicketWrapper(t));
                }
                for (Ticket__c t : externalTickets) {
                    wrappers.add(new TicketWrapper(t));
                }
                wrappers.sort(); // sort using compareTo()
                
                // unwrap back to Ticket__c list
                tickets.clear();
                for (TicketWrapper w : wrappers) {
                    tickets.add(w.ticket);
                }

        } else {
            tickets = [
                SELECT Id, Ticket_Name__c, Ticket_generated_number__c, Subject__c,
                Status__c, Assigned_To__c, Assigned_To__r.Name, Assigned_To__r.Email,
                Submitted_By__c, User_Name__c, Email_ID__c, Contact_Number__c,
                Manager_Name__c, Date_Of_Issue__c, Priority__c, Module__c, 
                Category__c, Platform__c, Description__c, CreatedBy.Email, Belong_To__r.Email,
                Submitting_To__c, Organization__c,Organization__r.Name, CreatedDate
                FROM Ticket__c
                WHERE Organization__c = :orgId
                ORDER BY CreatedDate DESC
            ];
        }
        
        return tickets;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<User> getUsersByOrganizationName(String orgName) {
        return [
            SELECT Id, Name, Email, Profile.Name,Full_Name__c, Username, Organization_Name__c
            FROM User
            WHERE IsActive = true
            AND Organization_Name__c = :orgName
        ];
    }
    
    @AuraEnabled
    public static void saveOrganisationSettings(Id orgId, String supportEmail, List<String> selectedUsers) {
        Organisation__c org = [SELECT Id, Support_Email__c, Ticketing_Members__c FROM Organisation__c WHERE Id = :orgId LIMIT 1];
        
        org.Support_Email__c = supportEmail;
        
        // Join users with newline
        if (selectedUsers != null && !selectedUsers.isEmpty()) {
            org.Ticketing_Members__c = String.join(selectedUsers, '\n');
        } else {
            org.Ticketing_Members__c = null;
        }
        
        update org;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<User> getUsersByIds(List<Id> userIds) {
        return [SELECT Id, Name, Full_Name__c, Email, User_Type__c FROM User WHERE Id IN :userIds];
    }
    @AuraEnabled(cacheable=true)
    public static String getOrgNameById(Id orgid) {
        try {
            Organisation__c org = [SELECT Name FROM Organisation__c WHERE Id = :orgid LIMIT 1];
            return org.Name;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch Organisation name: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static Ticket__c getTicketDetailsById(Id ticketId) {
        return [
            SELECT Id, Ticket_Name__c, Ticket_generated_number__c, Subject__c, 
            Status__c, Assigned_To__c, Assigned_To__r.Name, Submitted_By__c, 
            User_Name__c, Email_ID__c, Contact_Number__c, Manager_Name__c, 
            Date_Of_Issue__c, Priority__c, Module__c, Category__c, Platform__c, 
            Description__c, Conversations__c, Resolution__c, History_log__c, Attachment__c, Post_Attachment__c,(SELECT key__c, File_Name__c, Ticket__c, Awsjson__c, post_attachment__c, Id FROM Multiple_Attachments__r)
            FROM Ticket__c
            WHERE Id = :ticketId
        ];
    }
    
    
    @AuraEnabled(cacheable=true)
    public static List<String> getTicketingMembers(Id orgId) {
        Organisation__c org = [SELECT Ticketing_Members__c FROM Organisation__c WHERE Id = :orgId LIMIT 1];
        if (String.isNotBlank(org.Ticketing_Members__c)) {
            // Split by either ; or newline
            List<String> rawIds = org.Ticketing_Members__c.split('[;\n]');
            List<String> cleanedIds = new List<String>();
            
            for (String id : rawIds) {
                if (!String.isBlank(id)) {
                    cleanedIds.add(id.trim());
                }
            }
            return cleanedIds;
        }
        return new List<String>();
    }
    
    
    @AuraEnabled
    public static void updateTicket(Ticket__c updatedTicket) {
        try {
            Ticket__c existing = [SELECT Id, Assigned_To__c, Status__c FROM Ticket__c WHERE Id = :updatedTicket.Id LIMIT 1];
            existing.Assigned_To__c = updatedTicket.Assigned_To__c;
            existing.Status__c = updatedTicket.Status__c;
            update existing;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update ticket: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void appendConversationEntry(Id ticketId, String sender, String timestamp, String message) {
        try {
            Ticket__c ticket = [
                SELECT Id, Conversations__c
                FROM Ticket__c
                WHERE Id = :ticketId
                LIMIT 1
            ];
            
            List<Object> conversationList = new List<Object>();
            
            if (String.isNotBlank(ticket.Conversations__c)) {
                conversationList = (List<Object>) JSON.deserializeUntyped(ticket.Conversations__c);
            }
            
            Map<String, Object> newEntry = new Map<String, Object>{
                'sender' => sender,
                    'timestamp' => timestamp,
                    'message' => message
                    };
                        
                        conversationList.add(newEntry);
            
            ticket.Conversations__c = JSON.serialize(conversationList);
            update ticket;
            
        } catch (Exception e) {
            throw new AuraHandledException('Failed to append message: ' + e.getMessage());
        }
    }
    
    
    @AuraEnabled
    public static void updateResolution(Id ticketId, String resolutionText) {
        Ticket__c ticket = [SELECT Id FROM Ticket__c WHERE Id = :ticketId];
        
        if (String.isNotBlank(resolutionText)) {
            Map<String, String> resolutionData = new Map<String, String>();
            resolutionData.put('text', resolutionText);
            resolutionData.put('by', UserInfo.getName());
            resolutionData.put('timestamp', System.now().format('yyyy-MM-dd hh:mm a'));
            
            ticket.Resolution__c = JSON.serialize(resolutionData);
        } else {
            ticket.Resolution__c = null;
        }
        
        update ticket;
    }   
    
    @AuraEnabled(cacheable=true)
    public static List<String> getStatusPicklistValues() {
        List<String> values = new List<String>();
        
        Schema.DescribeFieldResult fieldResult = Ticket__c.Status__c.getDescribe();
        List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();
        
        for (Schema.PicklistEntry entry : picklistValues) {
            if (entry.isActive()) {
                values.add(entry.getLabel());
            }
        }
        return values;
    }
    
    @AuraEnabled
    public static void appendHistoryEntry(Id ticketId, String actionType, String content) {
        if (String.isBlank(String.valueOf(ticketId)) || String.isBlank(actionType)) {
            throw new AuraHandledException('Missing required fields: ticketId or actionType.');
        }
        
        try {
            Ticket__c ticket = [
                SELECT Id, History_Log__c 
                FROM Ticket__c 
                WHERE Id = :ticketId 
                LIMIT 1
            ];
            
            List<Object> logs;
            if (String.isNotBlank(ticket.History_Log__c)) {
                logs = (List<Object>)JSON.deserializeUntyped(ticket.History_Log__c);
            } else {
                logs = new List<Object>();
            }
            
            User currentUser = [
                SELECT Name 
                FROM User 
                WHERE Id = :UserInfo.getUserId() 
                LIMIT 1
            ];
            
            Map<String, Object> entry = new Map<String, Object>{
                'user' => currentUser.Name,
                    'timestamp' => System.now().format('MMM dd, yyyy hh:mm a'),
                    'actionType' => actionType,
                    'content' => content
                    };
                        
                        logs.add(entry);
            ticket.History_Log__c = JSON.serialize(logs);
            update ticket;
            
        } catch (Exception e) {
            System.debug('❌ Failed to append history: ' + e.getMessage());
            throw new AuraHandledException('History update failed: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
public static void appendHistoryEntries(Id ticketId, List<Map<String, String>> changes) {
    if (ticketId == null || changes == null || changes.isEmpty()) {
        throw new AuraHandledException('Missing ticketId or changes.');
    }

    try {
        Ticket__c ticket = [
            SELECT Id, History_Log__c
            FROM Ticket__c
            WHERE Id = :ticketId
            LIMIT 1
        ];

        List<Object> logs;
        if (String.isNotBlank(ticket.History_Log__c)) {
            logs = (List<Object>) JSON.deserializeUntyped(ticket.History_Log__c);
        } else {
            logs = new List<Object>();
        }

        User currentUser = [
            SELECT Name
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        for (Map<String, String> change : changes) {
            Map<String, Object> entry = new Map<String, Object>{
                'user' => currentUser.Name,
                'timestamp' => System.now().format('MMM dd, yyyy hh:mm a'),
                'actionType' => change.get('actionType'),
                'content' => change.get('content')
            };
            logs.add(entry);
        }

        ticket.History_Log__c = JSON.serialize(logs);
        update ticket;

    } catch (Exception e) {
        System.debug('❌ Failed to append history: ' + e.getMessage());
        throw new AuraHandledException('History update failed: ' + e.getMessage());
    }
}

    
    
    @AuraEnabled(cacheable=true)
    public static String getHistoryLog(Id ticketId) {
        Ticket__c ticket = [SELECT History_Log__c FROM Ticket__c WHERE Id = :ticketId LIMIT 1];
        return ticket.History_Log__c;
    }
    
    @AuraEnabled
    public static void deletePostAttachmentFromTicket(Id ticketId) {
        Ticket__c ticket = [SELECT Id, Post_Attachment__c FROM Ticket__c WHERE Id = :ticketId LIMIT 1];
        ticket.Post_Attachment__c = '';
        update ticket;
    }
    
    //Email Service
    
    
    @AuraEnabled
    public static void sendTicketNotificationEmails(Id ticketId) {
        Ticket__c ticket = [
            SELECT Id, Ticket_Name__c, Ticket_generated_number__c, Subject__c, Description__c,Submitting_To__c,
            Submitted_By__c, User_Name__c, Email_ID__c, Date_Of_Issue__c,
            Priority__c, Module__c, Organization_Name__c
            FROM Ticket__c
            WHERE Id = :ticketId
            LIMIT 1
        ];
        
        Organisation__c org = [
            SELECT Name, Support_Email__c
            FROM Organisation__c
            WHERE Name = :ticket.Organization_Name__c
            LIMIT 1
        ];
        
        String orgWideEmail = 'Tesseract_Form';
        
        Date issueDate = ticket.Date_Of_Issue__c;
        String day = issueDate.day() < 10 ? '0' + issueDate.day() : String.valueOf(issueDate.day());
        String month = issueDate.month() < 10 ? '0' + issueDate.month() : String.valueOf(issueDate.month());
        String year = String.valueOf(issueDate.year());
        String formattedDate = day + '/' + month + '/' + year;


        
        // ✉️ Combined email with Submitter in CC
        // Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        // email.setOrgWideEmailAddressId(getOrgWideEmailId(orgWideEmail));

        // if (ticket.Submitting_To__c == 'External') {
        //     email.setToAddresses(new String[] { Label.Tesseract_Support });
        // } else {
        //     email.setToAddresses(new String[] { org.Support_Email__c });
        // }

        // email.setSenderDisplayName(ticket.Organization_Name__c);
        // email.setCcAddresses(new String[] { ticket.Email_ID__c });
        // email.setSubject('New Ticket Created – #' + ticket.Ticket_Name__c + ' – ' + ticket.Subject__c);

        // =========================================
        // GET SENDER EMAIL
        // =========================================

        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c senderOrg = [
            SELECT Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress =
            senderOrg.Email__c;

        // =========================================
        // TO EMAILS
        // =========================================

        List<String> toEmails =
            new List<String>();

        if (ticket.Submitting_To__c == 'External') {

            toEmails.add(
                Label.Tesseract_Support
            );

        } else if (
            String.isNotBlank(
                org.Support_Email__c
            )
        ) {

            toEmails.add(
                org.Support_Email__c
            );
        }

        // =========================================
        // CC EMAILS
        // =========================================

        List<String> ccEmails =
            new List<String>();

        if (
            String.isNotBlank(
                ticket.Email_ID__c
            )
        ) {

            ccEmails.add(
                ticket.Email_ID__c
            );
        }

        String emailSubject =
            'New Ticket Created – #' +
            ticket.Ticket_Name__c +
            ' – ' +
            ticket.Subject__c;

        String logoUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/tesseractappshearderlogo1.png';
        String envelopeUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/newticket.png';
        
        String htmlBody = '<!DOCTYPE html>' +
            '<html>' +
            '<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">' +
            
            '<div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #ddd;">' +
            
            // Header with bottom-only shadow
            '<div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; ' +
            'background-color: #ffffff; border-bottom: 1px solid #eee; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);">' +
            '<h2 style="margin: 0; color: #003466;">New Ticket Created</h2>' +
            '<img src="' + logoUrl + '" alt="TesseractApps" style="height: 40px;" />' +
            '</div>' +
            
            // Body content
            '<div style="padding: 30px;">' +
            
            // Floating envelope image to right
            '<div style="display: flex;">' +
            '<div style="flex: 1;">' +
            '<p style="font-size: 15px;">Dear Support Team,</p>' +
            '<p style="font-size: 14px;">A new support ticket has been logged with the following details:</p>' +
            '</div>' +
            '<div style="flex-shrink: 0; margin-left: 10px;">' +
            '<img src="' + envelopeUrl + '" alt="Notification" style="height: 60px;" />' +
            '</div>' +
            '</div>' +
            
            // Ticket details table
            '<table style="width: 100%; font-size: 14px; margin-top: 20px;">' +
            '<tr><td style="padding: 6px 0; font-weight: bold; width: 160px;">Ticket ID</td><td>: #' + ticket.Ticket_Name__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Submitted By</td><td>: ' + ticket.User_Name__c + ' (<a href="mailto:' + ticket.Email_ID__c + '">' + ticket.Email_ID__c + '</a>)</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Date Created</td><td>: ' + formattedDate + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Subject</td><td>: ' + ticket.Subject__c + '</td></tr>' +
            '</table>' +
            
            '<p style="margin-top: 15px; font-size: 14px;">The submitter is included in this communication for awareness and to facilitate a smoother resolution process.</p>' +
            '<p style="font-size: 14px;">Ensure they are kept informed of progress and contacted if further details are necessary.</p>' +
            
            '<p style="font-size: 14px; margin-top: 20px;">Please proceed with the necessary actions.</p>' +
            
            '<p style="font-size: 13px; color: #777; margin-top: 20px;"><em>This is an automated message. Replies to this email will not be monitored.</em></p>' +
            
            '<p style="margin-top: 25px; font-size: 14px;">Thanks and regards,<br/><strong>' + org.Name + ' Support Team</strong></p>' +
            '</div>' +
            
            '</div>' +
            '</body>' +
            '</html>';
        
        
        
        // email.setHtmlBody(htmlBody);
        
        // Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });
        if (!toEmails.isEmpty()) {

            Id jobId =
                System.enqueueJob(

                    new EmailRelayQueueable(
                        senderEmailAddress,
                        toEmails,
                        emailSubject,
                        htmlBody,
                        new List<String>(), // attachments
                        ccEmails,
                        new List<String>()  // bcc
                    )
                );

            System.debug(
                '✅ Ticket Email Queue Created: ' +
                jobId
            );
        }
    }
    
    @AuraEnabled
    public static void sendAssignedTicketNotificationEmails(Id ticketId) {
        Ticket__c ticket = [
            SELECT Id, Ticket_Name__c, Subject__c, Status__c, Email_ID__c, User_Name__c, Description__c,
            Priority__c, Module__c, Date_Of_Issue__c, Assigned_To__r.Email, Assigned_To__r.Name,
            Organization_Name__c
            FROM Ticket__c
            WHERE Id = :ticketId
        ];
        
        Organisation__c org = [
            SELECT Name, Support_Email__c
            FROM Organisation__c
            WHERE Name = :ticket.Organization_Name__c
            LIMIT 1
        ];
        
        Date issueDate = ticket.Date_Of_Issue__c;
        String formattedDate = 
            (issueDate.day() < 10 ? '0' + issueDate.day() : String.valueOf(issueDate.day())) + '/' +
            (issueDate.month() < 10 ? '0' + issueDate.month() : String.valueOf(issueDate.month())) + '/' +
            String.valueOf(issueDate.year());

        // String orgWideEmailDisplayName = 'Tesseract_Form';
        // Id orgWideEmailId = getOrgWideEmailId(orgWideEmailDisplayName);
        
        // // ✅ Email to Assigned Agent, CC Submitter
        // Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        // // email.setOrgWideEmailAddressId(orgWideEmailId);
        // email.setSenderDisplayName(ticket.Organization_Name__c);
        // email.setToAddresses(new String[] { ticket.Assigned_To__r.Email });
        // email.setCcAddresses(new String[] { ticket.Email_ID__c });
        // email.setSubject('Ticket #' + ticket.Ticket_Name__c + ' – has been assigned to ' + ticket.Assigned_To__r.Name + ' – Action required!');

        // =========================================
        // GET SENDER EMAIL
        // =========================================

        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c senderOrg = [
            SELECT Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress =
            senderOrg.Email__c;

        // =========================================
        // TO EMAILS
        // =========================================

        List<String> toEmails =
            new List<String>();

        if (
            String.isNotBlank(
                ticket.Assigned_To__r.Email
            )
        ) {

            toEmails.add(
                ticket.Assigned_To__r.Email
            );
        }

        // =========================================
        // CC EMAILS
        // =========================================

        List<String> ccEmails =
            new List<String>();

        if (
            String.isNotBlank(
                ticket.Email_ID__c
            )
        ) {

            ccEmails.add(
                ticket.Email_ID__c
            );
        }

        String emailSubject =
            'Ticket #' +
            ticket.Ticket_Name__c +
            ' – has been assigned to ' +
            ticket.Assigned_To__r.Name +
            ' – Action required!';
        
        String logoUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/tesseractappshearderlogo1.png';
        String envelopeUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/support.png';
        String htmlBody = '<!DOCTYPE html>' +
            '<html>' +
            '<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">' +
            
            '<div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #ddd;">' +
            
            // ✅ Header with ONLY bottom shadow and no container shadow
            '<div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; ' +
            'background-color: #ffffff; border-bottom: 1px solid #eee; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);">' +
            '<h2 style="margin: 0; color: #003466;">New Support Ticket Assigned</h2>' +
            '<img src="' + logoUrl + '" alt="TesseractApps" style="height: 40px;" />' +
            '</div>' +
            
            // ✅ Body content with floated envelope image
            '<div style="padding: 30px;">' +
            '<div style="display: flex;">' +
            '<div style="flex: 1;">' +
            '<p style="font-size: 15px; margin-bottom: 16px;">Hi ' + ticket.Assigned_To__r.Name + ',</p>' +
            '<p style="font-size: 14px;">A new support ticket has been submitted and assigned to you. Please review the details below:</p>' +
            '</div>' +
            '<div style="flex-shrink: 0; margin-left: 10px;">' +
            '<img src="' + envelopeUrl + '" alt="Notification" style="height: 60px;" />' +
            '</div>' +
            '</div>' +
            
            // Ticket Info Table
            '<table style="width: 100%; font-size: 14px; margin-top: 20px;">' +
            '<tr><td style="padding: 6px 0; font-weight: bold; width: 160px;">Ticket ID</td><td>: #' + ticket.Ticket_Name__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Subject</td><td>: ' + ticket.Subject__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Created On</td><td>: ' + formattedDate + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Priority</td><td>: ' + ticket.Priority__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Module</td><td>: ' + ticket.Module__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Description</td><td>: ' + (String.isBlank(ticket.Description__c) ? 'No description provided.' : ticket.Description__c) + '</td></tr>' +
            '</table>' +
            
            '<p style="margin-top: 20px; font-size: 14px;">Please review the ticket at your earliest convenience and proceed with the necessary fixes.</p>' +
            '<p style="font-size: 14px;">If you are unable to address this ticket, please reassign it to a colleague or inform your team lead for further assistance. </p>' +
            '<p style="font-size: 14px;">Let us know if you need any additional information or support!</p>' +
            '<p style="font-size: 14px;">The submitter is included in this communication for awareness and to facilitate a smoother resolution process.</p>' +
            
            '<p style="font-size: 13px; color: #777; margin-top: 20px;"><em>Please note that this is an automated message and replies to this email will not be monitored.</em></p>' +
            
            '<p style="margin-top: 25px; font-size: 14px;">Thanks and regards,<br/><strong>' + org.Name + ' Support Team</strong></p>' +
            '</div>' +
            
            '</div>' +
            '</body>' +
            '</html>';
        
        
        // email.setHtmlBody(htmlBody);
        // Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });

        if (!toEmails.isEmpty()) {

            Id jobId =
                System.enqueueJob(

                    new EmailRelayQueueable(
                        senderEmailAddress,
                        toEmails,
                        emailSubject,
                        htmlBody,
                        new List<String>(), // attachments
                        ccEmails,
                        new List<String>()  // bcc
                    )
                );

            System.debug(
                '✅ Assigned Ticket Email Queue Created: ' +
                jobId
            );
        }
    }
    
    @AuraEnabled
    public static void sendAssignedTicketNotificationEmailsWithEmail(Id ticketId, String assigneeEmail) {
        if (String.isBlank(assigneeEmail)) {
            throw new AuraHandledException('Assigned user email is required.');
        }
        
        Ticket__c ticket = [
            SELECT Id, Ticket_Name__c, Subject__c, Status__c, Email_ID__c, User_Name__c, Description__c,
            Priority__c, Module__c, Date_Of_Issue__c, Assigned_To__r.Name,
            Organization_Name__c
            FROM Ticket__c
            WHERE Id = :ticketId
        ];
        
        Organisation__c org = [
            SELECT Name, Support_Email__c
            FROM Organisation__c
            WHERE Name = :ticket.Organization_Name__c
            LIMIT 1
        ];
        
        Date issueDate = ticket.Date_Of_Issue__c;
        String formattedDate = 
            (issueDate.day() < 10 ? '0' + issueDate.day() : String.valueOf(issueDate.day())) + '/' +
            (issueDate.month() < 10 ? '0' + issueDate.month() : String.valueOf(issueDate.month())) + '/' +
            String.valueOf(issueDate.year());
        
        // String orgWideEmailDisplayName = 'Tesseract_Form';
        // Id orgWideEmailId = getOrgWideEmailId(orgWideEmailDisplayName);
        
        // Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        // // email.setOrgWideEmailAddressId(orgWideEmailId);
        // email.setSenderDisplayName(ticket.Organization_Name__c);
        // email.setToAddresses(new String[] { assigneeEmail });
        // email.setCcAddresses(new String[] { ticket.Email_ID__c });
        // email.setSubject('Ticket #' + ticket.Ticket_Name__c + ' – has been assigned – Action required!');

        // =========================================
        // GET SENDER EMAIL
        // =========================================

        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c senderOrg = [
            SELECT Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress =
            senderOrg.Email__c;

        // =========================================
        // TO EMAILS
        // =========================================

        List<String> toEmails =
            new List<String>();

        toEmails.add(
            assigneeEmail
        );

        // =========================================
        // CC EMAILS
        // =========================================

        List<String> ccEmails =
            new List<String>();

        if (
            String.isNotBlank(
                ticket.Email_ID__c
            )
        ) {

            ccEmails.add(
                ticket.Email_ID__c
            );
        }

        String emailSubject =
            'Ticket #' +
            ticket.Ticket_Name__c +
            ' – has been assigned – Action required!';
        
        String logoUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/tesseractappshearderlogo1.png';
        String envelopeUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/support.png';
        
        String htmlBody = '<!DOCTYPE html>' +
            '<html>' +
            '<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">' +
            '<div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #ddd;">' +
            '<div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; ' +
            'background-color: #ffffff; border-bottom: 1px solid #eee; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);">' +
            '<h2 style="margin: 0; color: #003466;">New Support Ticket Assigned</h2>' +
            '<img src="' + logoUrl + '" alt="TesseractApps" style="height: 40px;" />' +
            '</div>' +
            '<div style="padding: 30px;">' +
            '<div style="display: flex;">' +
            '<div style="flex: 1;">' +
            '<p style="font-size: 15px; margin-bottom: 16px;">Hi,</p>' +
            '<p style="font-size: 14px;">A new support ticket has been submitted and assigned to you. Please review the details below:</p>' +
            '</div>' +
            '<div style="flex-shrink: 0; margin-left: 10px;">' +
            '<img src="' + envelopeUrl + '" alt="Notification" style="height: 60px;" />' +
            '</div>' +
            '</div>' +
            '<table style="width: 100%; font-size: 14px; margin-top: 20px;">' +
            '<tr><td style="padding: 6px 0; font-weight: bold; width: 160px;">Ticket ID</td><td>: #' + ticket.Ticket_Name__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Subject</td><td>: ' + ticket.Subject__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Created On</td><td>: ' + formattedDate + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Priority</td><td>: ' + ticket.Priority__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Module</td><td>: ' + ticket.Module__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Description</td><td>: ' + (String.isBlank(ticket.Description__c) ? 'No description provided.' : ticket.Description__c) + '</td></tr>' +
            '</table>' +
            '<p style="margin-top: 20px; font-size: 14px;">Please review the ticket and proceed with the necessary actions.</p>' +
            '<p style="margin-top: 25px; font-size: 14px;">Thanks and regards,<br/><strong>' + org.Name + ' Support Team</strong></p>' +
            '</div>' +
            '</div>' +
            '</body>' +
            '</html>';
        
        // email.setHtmlBody(htmlBody);
        // Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });

        if (!toEmails.isEmpty()) {

            Id jobId =
                System.enqueueJob(

                    new EmailRelayQueueable(
                        senderEmailAddress,
                        toEmails,
                        emailSubject,
                        htmlBody,
                        new List<String>(), // attachments
                        ccEmails,
                        new List<String>()  // bcc
                    )
                );

            System.debug(
                '✅ Assigned Ticket Email Queue Created: ' +
                jobId
            );
        }
    }
    
    @AuraEnabled
    public static void sendAssignmentEmailOnStatusOnly(Id ticketId) {
        Ticket__c ticket = [
            SELECT Id, Ticket_Name__c, Subject__c, Status__c, Email_ID__c, User_Name__c, Description__c,
                Priority__c, Module__c, Date_Of_Issue__c, Assigned_To__r.Email, Assigned_To__r.Name,
                Organization_Name__c
            FROM Ticket__c
            WHERE Id = :ticketId
        ];

        if (ticket.Assigned_To__r == null || String.isBlank(ticket.Assigned_To__r.Email)) {
            System.debug('⚠️ No assigned user found for ticket ID: ' + ticketId);
            return;
        }

        Organisation__c org = [
            SELECT Name, Support_Email__c
            FROM Organisation__c
            WHERE Name = :ticket.Organization_Name__c
            LIMIT 1
        ];

        Date issueDate = ticket.Date_Of_Issue__c;
        String formattedDate =
            (issueDate.day() < 10 ? '0' + issueDate.day() : String.valueOf(issueDate.day())) + '/' +
            (issueDate.month() < 10 ? '0' + issueDate.month() : String.valueOf(issueDate.month())) + '/' +
            String.valueOf(issueDate.year());

        // String orgWideEmailDisplayName = 'Tesseract_Form';
        // Id orgWideEmailId = getOrgWideEmailId(orgWideEmailDisplayName);

        // Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        // // email.setOrgWideEmailAddressId(orgWideEmailId);
        // email.setSenderDisplayName(ticket.Organization_Name__c);
        // email.setToAddresses(new String[] { ticket.Assigned_To__r.Email });
        // email.setCcAddresses(new String[] { ticket.Email_ID__c });
        // email.setSubject('Ticket #' + ticket.Ticket_Name__c + ' – Update Notification');

        // =========================================
        // GET SENDER EMAIL
        // =========================================

        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c senderOrg = [
            SELECT Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress =
            senderOrg.Email__c;

        // =========================================
        // TO EMAILS
        // =========================================

        List<String> toEmails =
            new List<String>{
                ticket.Assigned_To__r.Email
            };

        // =========================================
        // CC EMAILS
        // =========================================

        List<String> ccEmails =
            new List<String>();

        if (String.isNotBlank(ticket.Email_ID__c)) {
            ccEmails.add(ticket.Email_ID__c);
        }

        String emailSubject =
            'Ticket #' +
            ticket.Ticket_Name__c +
            ' – Update Notification';

        String logoUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/tesseractappshearderlogo1.png';
        String envelopeUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/support.png';

        String htmlBody = '<!DOCTYPE html>' +
            '<html><body style="margin:0; padding:0; font-family:Arial,sans-serif; background-color:#ffffff;">' +
            '<div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:8px; border:1px solid #ddd;">' +
            
            '<div style="display:flex; justify-content:space-between; align-items:center; padding:20px 30px; ' +
            'background-color:#ffffff; border-bottom:1px solid #eee; box-shadow:0 2px 6px rgba(0,0,0,0.08);">' +
            '<h2 style="margin:0; color:#003466;">Ticket Status Updated</h2>' +
            '<img src="' + logoUrl + '" alt="TesseractApps" style="height:40px;" /></div>' +

            '<div style="padding:30px;">' +
            '<div style="display:flex;">' +
            '<div style="flex:1;">' +
            '<p style="font-size:15px; margin-bottom:16px;">Hi ' + ticket.Assigned_To__r.Name + ',</p>' +
            '<p style="font-size:14px;">The status of a ticket assigned to you has been updated. See the details below:</p>' +
            '</div>' +
            '<div style="flex-shrink:0; margin-left:10px;">' +
            '<img src="' + envelopeUrl + '" alt="Notification" style="height:60px;" />' +
            '</div></div>' +

            '<table style="width:100%; font-size:14px; margin-top:20px;">' +
            '<tr><td style="padding:6px 0; font-weight:bold; width:160px;">Ticket ID</td><td>: #' + ticket.Ticket_Name__c + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Subject</td><td>: ' + ticket.Subject__c + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Updated Status</td><td>: ' + ticket.Status__c + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Created On</td><td>: ' + formattedDate + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Priority</td><td>: ' + ticket.Priority__c + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Module</td><td>: ' + ticket.Module__c + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Description</td><td>: ' + (String.isBlank(ticket.Description__c) ? 'No description provided.' : ticket.Description__c) + '</td></tr>' +
            '</table>' +

            '<p style="margin-top:20px; font-size:14px;">Please check the updated ticket in the support portal for further action.</p>' +
            '<p style="font-size:13px; color:#777; margin-top:20px;"><em>This is an automated message. Replies are not monitored.</em></p>' +
            '<p style="margin-top:25px; font-size:14px;">Thanks and regards,<br/><strong>' + org.Name + ' Support Team</strong></p>' +
            '</div></div></body></html>';

        // email.setHtmlBody(htmlBody);

        // Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });

        if (!toEmails.isEmpty()) {

            Id jobId =
                System.enqueueJob(

                    new EmailRelayQueueable(
                        senderEmailAddress,
                        toEmails,
                        emailSubject,
                        htmlBody,
                        new List<String>(), // attachments
                        ccEmails,
                        new List<String>()  // bcc
                    )
                );

            System.debug(
                '✅ Ticket Status Update Email Queue Created: ' +
                jobId
            );
        }
    }

    @AuraEnabled
    public static void sendCommentOnlyEmailNotification(Id ticketId, String commentText) {
        Ticket__c ticket = [
            SELECT Id, Ticket_Name__c, Subject__c, Status__c, Email_ID__c, User_Name__c, Description__c,
                Priority__c, Module__c, Date_Of_Issue__c, Assigned_To__r.Email, Assigned_To__r.Name,
                Organization_Name__c
            FROM Ticket__c
            WHERE Id = :ticketId
        ];

        if (ticket.Assigned_To__r == null || String.isBlank(ticket.Assigned_To__r.Email)) {
            System.debug('⚠️ No assigned user found for ticket ID: ' + ticketId);
            return;
        }

        Organisation__c org = [
            SELECT Name, Support_Email__c
            FROM Organisation__c
            WHERE Name = :ticket.Organization_Name__c
            LIMIT 1
        ];

        Date issueDate = ticket.Date_Of_Issue__c;
        String formattedDate =
            (issueDate.day() < 10 ? '0' + issueDate.day() : String.valueOf(issueDate.day())) + '/' +
            (issueDate.month() < 10 ? '0' + issueDate.month() : String.valueOf(issueDate.month())) + '/' +
            String.valueOf(issueDate.year());

        // String orgWideEmailDisplayName = 'Tesseract_Form';
        // Id orgWideEmailId = getOrgWideEmailId(orgWideEmailDisplayName);

        // Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        // // email.setOrgWideEmailAddressId(orgWideEmailId);
        // email.setSenderDisplayName(ticket.Organization_Name__c);
        // email.setToAddresses(new String[] { ticket.Assigned_To__r.Email });
        // email.setCcAddresses(new String[] { ticket.Email_ID__c });
        // email.setSubject('Ticket #' + ticket.Ticket_Name__c + ' – New Comment Added');

        // =========================================
        // GET SENDER EMAIL
        // =========================================

        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c senderOrg = [
            SELECT Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress =
            senderOrg.Email__c;

        // =========================================
        // TO EMAILS
        // =========================================

        List<String> toEmails =
            new List<String>{
                ticket.Assigned_To__r.Email
            };

        // =========================================
        // CC EMAILS
        // =========================================

        List<String> ccEmails =
            new List<String>();

        if (String.isNotBlank(ticket.Email_ID__c)) {
            ccEmails.add(ticket.Email_ID__c);
        }

        String emailSubject =
            'Ticket #' +
            ticket.Ticket_Name__c +
            ' – New Comment Added';

        String logoUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/tesseractappshearderlogo1.png';
        String commentIconUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/comment-icon.png';

        // ✅ Include commentText in the email body
        String htmlBody = '<!DOCTYPE html>' +
            '<html><body style="margin:0; padding:0; font-family:Arial,sans-serif; background-color:#ffffff;">' +
            '<div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:8px; border:1px solid #ddd;">' +

            '<div style="display:flex; justify-content:space-between; align-items:center; padding:20px 30px; ' +
            'background-color:#ffffff; border-bottom:1px solid #eee; box-shadow:0 2px 6px rgba(0,0,0,0.08);">' +
            '<h2 style="margin:0; color:#003466;">New Comment on Support Ticket</h2>' +
            '<img src="' + logoUrl + '" alt="TesseractApps" style="height:40px;" /></div>' +

            '<div style="padding:30px;">' +
            '<p style="font-size:15px;">Hi ' + ticket.Assigned_To__r.Name + ',</p>' +
            '<p style="font-size:14px;">A new comment has been added to Ticket #' + ticket.Ticket_Name__c + ':</p>' +

            '<div style="margin:20px 0; padding:15px; border-left:4px solid #003466; background:#f9f9f9;">' +
            '<p style="font-size:14px; margin:0;"><em>"' + escapeHtml(commentText) + '"</em></p>' +
            '</div>' +

            '<table style="width:100%; font-size:14px; margin-top:20px;">' +
            '<tr><td style="padding:6px 0; font-weight:bold; width:160px;">Ticket ID</td><td>: #' + ticket.Ticket_Name__c + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Subject</td><td>: ' + ticket.Subject__c + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Status</td><td>: ' + ticket.Status__c + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Created On</td><td>: ' + formattedDate + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Priority</td><td>: ' + ticket.Priority__c + '</td></tr>' +
            '<tr><td style="padding:6px 0; font-weight:bold;">Module</td><td>: ' + ticket.Module__c + '</td></tr>' +
            '</table>' +

            '<p style="margin-top:20px; font-size:14px;">Please check the ticket in the support portal to respond to this comment.</p>' +
            '<p style="font-size:13px; color:#777; margin-top:20px;"><em>This is an automated message. Replies are not monitored.</em></p>' +
            '<p style="margin-top:25px; font-size:14px;">Thanks and regards,<br/><strong>' + org.Name + ' Support Team</strong></p>' +
            '</div></div></body></html>';

        // email.setHtmlBody(htmlBody);
        // Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });

        if (!toEmails.isEmpty()) {

            Id jobId =
                System.enqueueJob(

                    new EmailRelayQueueable(
                        senderEmailAddress,
                        toEmails,
                        emailSubject,
                        htmlBody,
                        new List<String>(), // attachments
                        ccEmails,
                        new List<String>()  // bcc
                    )
                );

            System.debug(
                '✅ Comment Notification Email Queue Created: ' +
                jobId
            );
        }
    }

    public static String escapeHtml(String input) {
        if (String.isBlank(input)) return '';
        return input
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace('\'', '&#39;');
    }
    
    @AuraEnabled
    public static void sendResolvedTicketEmail(Id ticketId) {
        Ticket__c ticket = [
            SELECT Id, Ticket_Name__c, Subject__c, Status__c, Email_ID__c, User_Name__c, Description__c,
            Priority__c, Module__c, Date_Of_Issue__c, Assigned_To__r.Email, Assigned_To__r.Name,
            Organization_Name__c
            FROM Ticket__c
            WHERE Id = :ticketId
        ];
        
        Organisation__c org = [
            SELECT Name, Support_Email__c
            FROM Organisation__c
            WHERE Name = :ticket.Organization_Name__c
            LIMIT 1
        ];
        
        Date today = Date.today();
        String dayStr = today.day() < 10 ? '0' + today.day() : String.valueOf(today.day());
        String monthStr = today.month() < 10 ? '0' + today.month() : String.valueOf(today.month());
        String yearStr = String.valueOf(today.year());
        String formattedDate = dayStr + '/' + monthStr + '/' + yearStr;


        
        // String orgWideEmailDisplayName = 'Tesseract_Form';
        // Id orgWideEmailId = getOrgWideEmailId(orgWideEmailDisplayName);
        
        // Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        // // email.setOrgWideEmailAddressId(orgWideEmailId);
        // email.setSenderDisplayName(ticket.Organization_Name__c);
        // email.setToAddresses(new String[] { ticket.Email_ID__c }); // Sent to Submitter
        // email.setCcAddresses(new String[] { ticket.Assigned_To__r.Email }); // CC the Assignee
        // email.setSubject('✅ Ticket #' + ticket.Ticket_Name__c + ' has been resolved – Summary Inside');

        // =========================================
        // GET SENDER EMAIL
        // =========================================

        User currentUser = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Organisation__c senderOrg = [
            SELECT Email__c
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        String senderEmailAddress =
            senderOrg.Email__c;

        // =========================================
        // TO EMAILS
        // =========================================

        List<String> toEmails =
            new List<String>();

        if (String.isNotBlank(ticket.Email_ID__c)) {
            toEmails.add(ticket.Email_ID__c);
        }

        // =========================================
        // CC EMAILS
        // =========================================

        List<String> ccEmails =
            new List<String>();

        if (
            ticket.Assigned_To__r != null &&
            String.isNotBlank(ticket.Assigned_To__r.Email)
        ) {
            ccEmails.add(ticket.Assigned_To__r.Email);
        }

        String emailSubject =
            '✅ Ticket #' +
            ticket.Ticket_Name__c +
            ' has been resolved – Summary Inside';
        
        String logoUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/tesseractappshearderlogo1.png';
        String envelopeUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/1emailsent.png';
        
        String htmlBody = '<!DOCTYPE html>' +
            '<html>' +
            '<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">' +
            
            '<div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #ddd;">' +
            
            // ✅ Header with bottom shadow
            '<div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; ' +
            'background-color: #ffffff; border-bottom: 1px solid #eee; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);">' +
            '<h2 style="margin: 0; color: #003466;">Ticket Resolved</h2>' +
            '<img src="' + logoUrl + '" alt="TesseractApps" style="height: 40px;" />' +
            '</div>' +
            
            // ✅ Body with envelope
            '<div style="padding: 30px;">' +
            '<div style="display: flex;">' +
            '<div style="flex: 1;">' +
            '<p style="font-size: 15px; margin-bottom: 16px;">Dear ' + ticket.User_Name__c + ',</p>' +
            '<p style="font-size: 14px;">This email is to notify you that the ticket ID <strong>#' + ticket.Ticket_Name__c + '</strong> has been successfully resolved. You can review the details below:</p>' +
            '</div>' +
            '<div style="flex-shrink: 0; margin-left: 10px;">' +
            '<img src="' + envelopeUrl + '" alt="Resolved Icon" style="height: 60px;" />' +
            '</div>' +
            '</div>' +
            
            // Ticket details table
            '<table style="width: 100%; font-size: 14px; margin-top: 20px;">' +
            '<tr><td style="padding: 6px 0; font-weight: bold; width: 160px;">Ticket ID</td><td>: #' + ticket.Ticket_Name__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Subject</td><td>: ' + ticket.Subject__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Status</td><td>: Resolved</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Resolved By</td><td>: ' + ticket.Assigned_To__r.Name + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Date of Resolution</td><td>: ' + formattedDate  + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Priority</td><td>: ' + ticket.Priority__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Module</td><td>: ' + ticket.Module__c + '</td></tr>' +
            '<tr><td style="padding: 6px 0; font-weight: bold;">Description</td><td>: ' + (String.isBlank(ticket.Description__c) ? 'No description provided.' : ticket.Description__c) + '</td></tr>' +
            '</table>' +
            
            '<p style="margin-top: 20px; font-size: 14px;">If you believe the issue persists or if you have any additional questions, please don’t hesitate to contact us.</p>' +
            '<p style="font-size: 14px;">Thank you for reaching out to us and we appreciate your patience.</p>' +
            
            '<p style="font-size: 13px; color: #777; margin-top: 20px;"><em>Please note that this is an automated message and replies to this email will not be monitored.</em></p>' +
            
            '<p style="margin-top: 25px; font-size: 14px;">Thanks and regards,<br/><strong>' + org.Name + ' Support Team</strong></p>' +
            '</div>' +
            
            '</div>' +
            '</body>' +
            '</html>';
        
        
        // email.setHtmlBody(htmlBody);
        // Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });

        if (!toEmails.isEmpty()) {

            Id jobId =
                System.enqueueJob(

                    new EmailRelayQueueable(
                        senderEmailAddress,
                        toEmails,
                        emailSubject,
                        htmlBody,
                        new List<String>(), // attachments
                        ccEmails,
                        new List<String>()  // bcc
                    )
                );

            System.debug(
                '✅ Resolved Ticket Email Queue Created: ' +
                jobId
            );
        }
    }
    
    private static Id getOrgWideEmailId(String displayName) {
        for (OrgWideEmailAddress owe : [SELECT Id, Address, DisplayName FROM OrgWideEmailAddress]) {
            if (owe.DisplayName == displayName) {
                return owe.Id;
            }
        }
        return null;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getManagerNameFromFacility(String facilityId) {
        if (String.isBlank(facilityId)) return null;
        
        Facility__c facility = [
            SELECT 	Manager_Name__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
        ];
        return facility.Manager_Name__c;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getContactNumberByEmail(String email) {
        try {
            Staff__c staff = [
                SELECT Contact_Number__c
                FROM Staff__c
                WHERE Email_Address__c = :email
                LIMIT 1
            ];
            return staff.Contact_Number__c;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching contact number: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Staff__c getStaffByEmail(String email) {
        List<Staff__c> staffList = [
            SELECT Id, Facility__c, Facility__r.Name 
            FROM Staff__c 
            WHERE 	Email_Address__c = :email 
            LIMIT 1
        ];
        return staffList.isEmpty() ? null : staffList[0];
    }
    
     @AuraEnabled
    public static void insertTicketAttachments(String ticketId, String Awsjson, Boolean postattachment, String attachmentid) {
        if (String.isBlank(ticketId) || String.isBlank(Awsjson)) {
            throw new AuraHandledException('Missing repositoryId or Awsjson');
        }
    
        List<FileWrapper> fileList = (List<FileWrapper>) JSON.deserialize(Awsjson, List<FileWrapper>.class);
        List<Multiple_Attachments__c> recordsToUpsert = new List<Multiple_Attachments__c>();
    
        for (FileWrapper file : fileList) {
            Multiple_Attachments__c rec = new Multiple_Attachments__c();
             if (!String.isBlank(attachmentid)) {
                    rec.Id = attachmentid;
              }
            rec.Ticket__c = ticketId;
            rec.post_attachment__c = postattachment;
            rec.File_Name__c = file.originalName;
           // rec.Amazon_file_URL__c = file.url;
            rec.key__c = file.key;
            rec.Awsjson__c = JSON.serialize(file);
            recordsToUpsert.add(rec);
        }
    
        if (!recordsToUpsert.isEmpty()) {
            upsert recordsToUpsert;
        }
    }
    
    public class fileWrapper {
        public String url;
        public String originalName;
        public String size;
         public String key; 
        
    }

    
    
    
}