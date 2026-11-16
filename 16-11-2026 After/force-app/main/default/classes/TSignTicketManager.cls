public without sharing class TSignTicketManager {

    // public static final String LOGO_URL     = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/tesseractappshearderlogo1.png';
    public static final String LOGO_URL =  'https://docimgupld.s3.ap-southeast-2.amazonaws.com/companylogo/tsign_logo_cropped.png';
    public static final String NEW_ICON     = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/newticket.png';
    public static final String SUPPORT_ICON = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/support.png';
    public static final String DONE_ICON    = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/1emailsent.png';

    public static final String LIST_FIELDS =
        'Id, Ticket_Name__c, Ticket_generated_number__c, Subject__c, ' +
        'Status__c, Assigned_To__c, Assigned_To__r.Name, Assigned_To__r.Email, Assigned_To__r.TSign_Org_Id__c, ' +
        'Submitted_By__c, User_Name__c, Email_ID__c, Contact_Number__c, ' +
        'Date_Of_Issue__c, Priority__c, Module__c, ' +
        'Category__c, Platform__c, Description__c, CreatedBy.Email, Belong_To__r.Email, ' +
        'Organization__c, Organization__r.Name, CreatedDate';

    // =====================================================
    // CREATE
    // =====================================================

    @AuraEnabled
    public static TSign_Ticket__c createTicket(Map<String, Object> ticket) {
        try {
            TSign_Ticket__c t = new TSign_Ticket__c();

            t.Ticket_generated_number__c = toDecimal(ticket.get('Ticket_generated_number__c'));
            t.Ticket_Name__c      = str(ticket, 'Ticket_Name__c');
            t.Email_ID__c         = str(ticket, 'Email_ID__c');
            t.Contact_Number__c   = str(ticket, 'Contact_Number__c');
            t.Organisation_Name__c = str(ticket, 'Organisation_Name__c');
            t.Organization__c     = toId(ticket.get('Organization__c'));
            t.Belong_To__c        = toId(ticket.get('Belong_To__c'));
            t.User_Name__c        = str(ticket, 'User_Name__c');
            t.Files_URL__c        = str(ticket, 'Files_URL__c');
            t.Category__c         = str(ticket, 'Category__c');
            t.Platform__c         = str(ticket, 'Platform__c');
            t.Module__c           = str(ticket, 'Module__c');
            t.Priority__c         = str(ticket, 'Priority__c');
            t.Status__c           = str(ticket, 'Status__c');
            t.Submitted_By__c     = str(ticket, 'Submitted_By__c');
            t.Description__c      = str(ticket, 'Description__c');
            t.Subject__c          = str(ticket, 'Subject__c');

            String dateString = str(ticket, 'Date_Of_Issue__c');
            if (String.isNotBlank(dateString)) {
                t.Date_Of_Issue__c = Date.valueOf(dateString);
            }

            insert t;
            return t;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to save ticket: ' + e.getMessage());
        }
    }

    // =====================================================
    // READ
    // =====================================================

    @AuraEnabled(cacheable=true)
    public static List<TSign_Organisation__c> getOrganisations() {
        return [SELECT Id, Name, Email__c FROM TSign_Organisation__c ORDER BY Name];
    }

    @AuraEnabled
    public static List<TSign_Ticket__c> getTickets(Id orgId, String orgName) {
        if (orgId == null) {
            return new List<TSign_Ticket__c>();
        }

        String itSupport = [SELECT IT_Support__c FROM User WHERE Id = :UserInfo.getUserId()].IT_Support__c;
        Boolean isItSupport = String.isNotBlank(itSupport) && itSupport.trim().equalsIgnoreCase('Yes');

        String soql = 'SELECT ' + LIST_FIELDS + ' FROM TSign_Ticket__c';
        if (!isItSupport) {
            soql += ' WHERE Organization__c = :orgId';
        }
        soql += ' ORDER BY CreatedDate DESC';

        return (List<TSign_Ticket__c>) Database.query(soql);
    }

    // Only ACTIVE attachments are returned. Soft-deleted ones (Active__c = false) stay in the database.
    @AuraEnabled
    public static TSign_Ticket__c getTicketDetailsById(Id ticketId) {
        return [
            SELECT Id, Ticket_Name__c, Ticket_generated_number__c, Subject__c,
                   Status__c, Assigned_To__c, Assigned_To__r.Name, Submitted_By__c,
                   User_Name__c, Email_ID__c, Contact_Number__c,
                   Date_Of_Issue__c, Priority__c, Module__c, Category__c, Platform__c,
                   Description__c, Conversations__c, Resolution__c, History_log__c, Attachment__c, Post_Attachment__c,
                   (SELECT Id, key__c, File_Name__c, TSign_Ticket__c, Awsjson__c, post_attachment__c, Active__c
                    FROM TSign_Ticket_Attachments__r
                    WHERE Active__c = true)
            FROM TSign_Ticket__c
            WHERE Id = :ticketId
        ];
    }

    // @AuraEnabled(cacheable=true)
    // public static List<User> getUsersByOrganisationName(String orgName) {
    //     return [
    //         SELECT Id, Name, Email, Profile.Name, Full_Name__c, Username, Organisation_Name__c
    //         FROM User
    //         WHERE IsActive = true
    //         AND Organisation_Name__c = :orgName
    //     ];
    // }

    @AuraEnabled(cacheable=true)
    public static String getOrgNameById(Id orgid) {
        try {
            return [SELECT Name FROM TSign_Organisation__c WHERE Id = :orgid LIMIT 1].Name;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to fetch Organisation name: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getStatusPicklistValues() {
        List<String> values = new List<String>();
        for (Schema.PicklistEntry entry : TSign_Ticket__c.Status__c.getDescribe().getPicklistValues()) {
            if (entry.isActive()) {
                values.add(entry.getLabel());
            }
        }
        return values;
    }

    // =====================================================
    // SUPPORT AGENTS
    // =====================================================

    // Assignable agents = active IT support users in the SAME organisation as the logged-in user
    @AuraEnabled(cacheable=true)
    public static List<UserStaffWrapper> getSupportAgents() {
        String currentOrgId = [
            SELECT TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1
        ].TSign_Org_Id__c;

        if (String.isBlank(currentOrgId)) {
            return new List<UserStaffWrapper>();
        }

        List<Id> ids = new List<Id>();
        for (User u : [
            SELECT Id
            FROM User
            WHERE IsActive = true
            AND IT_Support__c = 'Yes'
            AND TSign_Org_Id__c = :currentOrgId
            ORDER BY Name
        ]) {
            ids.add(u.Id);
        }
        return getUsersByIds(ids);
    }

    public class UserStaffWrapper {
        @AuraEnabled public Id userId;
        @AuraEnabled public String userName;
        @AuraEnabled public String staffName;
        @AuraEnabled public String email;
        @AuraEnabled public String userType;

        public UserStaffWrapper(Id userId, String userName, String staffName, String email, String userType) {
            this.userId = userId;
            this.userName = userName;
            this.staffName = staffName;
            this.email = email;
            this.userType = userType;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<UserStaffWrapper> getUsersByIds(List<Id> userIds) {
        List<User> users = [SELECT Id, Name, Email, User_Type__c FROM User WHERE Id IN :userIds];
        Map<String, TSign_Staff__c> staffByEmail = staffMapForUsers(users);

        List<UserStaffWrapper> result = new List<UserStaffWrapper>();
        for (User u : users) {
            String staffName = u.Name;
            if (String.isNotBlank(u.Email)) {
                TSign_Staff__c staff = staffByEmail.get(u.Email.toLowerCase());
                if (staff != null && String.isNotBlank(staff.Display_Nickname__c)) {
                    staffName = staff.Display_Nickname__c;
                }
            }
            result.add(new UserStaffWrapper(u.Id, u.Name, staffName, u.Email, u.User_Type__c));
        }
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static Map<Id, String> getStaffNamesByUserIds(List<Id> userIds) {
        Map<Id, String> result = new Map<Id, String>();
        if (userIds == null || userIds.isEmpty()) {
            return result;
        }

        List<User> users = [SELECT Id, Email FROM User WHERE Id IN :userIds];
        Map<String, TSign_Staff__c> staffByEmail = staffMapForUsers(users);

        for (User u : users) {
            if (String.isBlank(u.Email)) continue;
            TSign_Staff__c staff = staffByEmail.get(u.Email.toLowerCase());
            if (staff != null) {
                result.put(u.Id, staff.Display_Nickname__c);
            }
        }
        return result;
    }

    public static Map<String, TSign_Staff__c> staffMapForUsers(List<User> users) {
        Set<String> emails = new Set<String>();
        for (User u : users) {
            if (String.isNotBlank(u.Email)) {
                emails.add(u.Email.toLowerCase());
            }
        }
        Map<String, TSign_Staff__c> staffByEmail = new Map<String, TSign_Staff__c>();
        if (emails.isEmpty()) {
            return staffByEmail;
        }
        for (TSign_Staff__c staff : [
            SELECT Id, Email__c, Display_Nickname__c
            FROM TSign_Staff__c
            WHERE Email__c IN :emails
        ]) {
            if (String.isNotBlank(staff.Email__c)) {
                staffByEmail.put(staff.Email__c.toLowerCase(), staff);
            }
        }
        return staffByEmail;
    }

    // =====================================================
    // UPDATE
    // =====================================================

    @AuraEnabled
    public static void updateTicket(TSign_Ticket__c updatedTicket) {
        try {
            TSign_Ticket__c existing = new TSign_Ticket__c(
                Id = updatedTicket.Id,
                Assigned_To__c = updatedTicket.Assigned_To__c,
                Status__c = updatedTicket.Status__c
            );
            update existing;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to update ticket: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void appendConversationEntry(Id ticketId, String sender, String timestamp, String message) {
        try {
            TSign_Ticket__c ticket = [
                SELECT Id, Conversations__c FROM TSign_Ticket__c WHERE Id = :ticketId LIMIT 1
            ];

            List<Object> conversationList = new List<Object>();
            if (String.isNotBlank(ticket.Conversations__c)) {
                conversationList = (List<Object>) JSON.deserializeUntyped(ticket.Conversations__c);
            }

            conversationList.add(new Map<String, Object>{
                'sender'    => sender,
                'timestamp' => timestamp,
                'message'   => message
            });

            ticket.Conversations__c = JSON.serialize(conversationList);
            update ticket;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to append message: ' + e.getMessage());
        }
    }

    /**
     * Pass the PLAIN resolution text. Author and timestamp are added here.
     * Blank text clears the resolution.
     */
    @AuraEnabled
    public static void updateResolution(Id ticketId, String resolutionText) {
        TSign_Ticket__c ticket = new TSign_Ticket__c(Id = ticketId);

        if (String.isNotBlank(resolutionText)) {
            ticket.Resolution__c = JSON.serialize(new Map<String, String>{
                'text'      => resolutionText,
                'by'        => UserInfo.getName(),
                'timestamp' => System.now().formatGmt('yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
            });
        } else {
            ticket.Resolution__c = null;
        }
        update ticket;
    }

    // =====================================================
    // HISTORY  (JSON stored in TSign_Ticket__c.History_log__c)
    // =====================================================

    @AuraEnabled
    public static void appendHistoryEntry(Id ticketId, String actionType, String content) {
        if (ticketId == null || String.isBlank(actionType)) {
            throw new AuraHandledException('Missing required fields: ticketId or actionType.');
        }
        writeHistory(ticketId, new List<Map<String, String>>{
            new Map<String, String>{ 'actionType' => actionType, 'content' => content }
        });
    }

    @AuraEnabled
    public static void appendHistoryEntries(Id ticketId, List<Map<String, String>> changes) {
        if (ticketId == null || changes == null || changes.isEmpty()) {
            throw new AuraHandledException('Missing ticketId or changes.');
        }
        writeHistory(ticketId, changes);
    }

    public static void writeHistory(Id ticketId, List<Map<String, String>> entries) {
        try {
            // FOR UPDATE locks the row so two quick appends do not overwrite each other
            TSign_Ticket__c ticket = [
                SELECT Id, History_log__c FROM TSign_Ticket__c WHERE Id = :ticketId LIMIT 1 FOR UPDATE
            ];

            List<Object> logs = String.isNotBlank(ticket.History_log__c)
                ? (List<Object>) JSON.deserializeUntyped(ticket.History_log__c)
                : new List<Object>();

            String now = System.now().formatGmt('yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
            for (Map<String, String> e : entries) {
                logs.add(new Map<String, Object>{
                    'user'       => UserInfo.getName(),
                    'timestamp'  => now,
                    'actionType' => e.get('actionType'),
                    'content'    => e.get('content')
                });
            }

            ticket.History_log__c = JSON.serialize(logs);
            update ticket;
        } catch (Exception e) {
            throw new AuraHandledException('History update failed: ' + e.getMessage());
        }
    }

    // =====================================================
    // LOOKUPS FOR THE CREATE FORM
    // =====================================================

    // @AuraEnabled(cacheable=true)
    // public static String getManagerNameFromFacility(String facilityId) {
    //     if (String.isBlank(facilityId)) return null;
    //     List<TSign_Facility__c> rows = [SELECT Manager_Name__c FROM TSign_Facility__c WHERE Id = :facilityId LIMIT 1];
    //     return rows.isEmpty() ? null : rows[0].Manager_Name__c;
    // }

    @AuraEnabled(cacheable=true)
    public static String getContactNumberByEmail(String email) {
        List<TSign_Staff__c> rows = [
            SELECT Phone__c FROM TSign_Staff__c WHERE Email__c = :email LIMIT 1
        ];
        return rows.isEmpty() ? null : rows[0].Phone__c;
    }

    // @AuraEnabled(cacheable=true)
    // public static TSign_Staff__c getStaffByEmail(String email) {
    //     List<TSign_Staff__c> rows = [
    //         SELECT Id, TSign_Facility__c, TSign_Facility__r.Name
    //         FROM TSign_Staff__c
    //         WHERE Email__c = :email
    //         LIMIT 1
    //     ];
    //     return rows.isEmpty() ? null : rows[0];
    // }

    // =====================================================
    // ATTACHMENTS  (TSign_Ticket_Attachment__c)
    // Soft delete: records are never deleted, Active__c = false hides them.
    // =====================================================

    public class FileWrapper {
        public String url;
        public String originalName;
        public String size;
        public String key;
    }

    /**
     * Always inserts new ACTIVE records.
     * When attachmentid is passed (replace flow) the old record is NOT overwritten,
     * it is marked inactive so the history of files is kept.
     */
    @AuraEnabled
    public static void insertTicketAttachments(String ticketId, String Awsjson, Boolean postattachment, String attachmentid) {
        if (String.isBlank(ticketId) || String.isBlank(Awsjson)) {
            throw new AuraHandledException('Missing ticketId or Awsjson');
        }

        List<FileWrapper> fileList = (List<FileWrapper>) JSON.deserialize(Awsjson, List<FileWrapper>.class);
        List<TSign_Ticket_Attachment__c> toInsert = new List<TSign_Ticket_Attachment__c>();

        for (FileWrapper file : fileList) {
            TSign_Ticket_Attachment__c rec = new TSign_Ticket_Attachment__c();
            rec.TSign_Ticket__c    = ticketId;
            rec.post_attachment__c = (postattachment == true);
            rec.File_Name__c       = file.originalName;
            rec.key__c             = file.key;
            rec.Awsjson__c         = JSON.serialize(file);
            rec.Active__c          = true;
            toInsert.add(rec);
        }

        if (!toInsert.isEmpty()) {
            insert toInsert;
        }

        // Replace flow: keep the old record, just mark it inactive
        if (String.isNotBlank(attachmentid)) {
            update new TSign_Ticket_Attachment__c(Id = attachmentid, Active__c = false);
        }
    }

    /** Soft delete: marks the attachment inactive. The record and the S3 file stay. */
    @AuraEnabled
    public static void deactivateTicketAttachment(Id attachmentId) {
        if (attachmentId == null) {
            throw new AuraHandledException('Missing attachmentId');
        }
        try {
            update new TSign_Ticket_Attachment__c(Id = attachmentId, Active__c = false);
        } catch (Exception e) {
            throw new AuraHandledException('Failed to deactivate attachment: ' + e.getMessage());
        }
    }

    // =====================================================
    // EMAILS  (all tickets are external)
    // =====================================================

    /** New ticket: TO Tesseract support, CC the submitter. */
    @AuraEnabled
    public static void sendTicketNotificationEmails(Id ticketId) {
        TSign_Ticket__c t = loadTicketForEmail(ticketId);

        List<String> toEmails = new List<String>{ Label.Tesseract_Support };
        List<String> ccEmails = new List<String>();
        if (String.isNotBlank(t.Email_ID__c)) ccEmails.add(t.Email_ID__c);

        String html = buildEmailHtml(
            'New Ticket Created', NEW_ICON,
            'Dear Support Team,',
            'A new support ticket has been logged with the following details:',
            null,
            new List<List<String>>{
                row('Ticket ID', '#' + t.Ticket_Name__c),
                row('Submitted By', t.User_Name__c + ' (' + t.Email_ID__c + ')'),
                row('Date Created', fmt(t.Date_Of_Issue__c)),
                row('Subject', t.Subject__c)
            },
            new List<String>{
                'The submitter is included in this communication for awareness and to facilitate a smoother resolution process.',
                'Ensure they are kept informed of progress and contacted if further details are necessary.',
                'Please proceed with the necessary actions.'
            },
            orgNameOf(t)
        );

        queueEmail(toEmails, ccEmails, 'New Ticket Created – #' + t.Ticket_Name__c + ' – ' + t.Subject__c, html);
    }

    /** Assignment changed: TO assignee, CC submitter. */
    @AuraEnabled
    public static void sendAssignedTicketNotificationEmails(Id ticketId) {
        TSign_Ticket__c t = loadTicketForEmail(ticketId);
        if (t.Assigned_To__r == null || String.isBlank(t.Assigned_To__r.Email)) return;

        String html = buildEmailHtml(
            'New Support Ticket Assigned', SUPPORT_ICON,
            'Hi ' + t.Assigned_To__r.Name + ',',
            'A new support ticket has been submitted and assigned to you. Please review the details below:',
            null,
            new List<List<String>>{
                row('Ticket ID', '#' + t.Ticket_Name__c),
                row('Subject', t.Subject__c),
                row('Created On', fmt(t.Date_Of_Issue__c)),
                row('Priority', t.Priority__c),
                row('Module', t.Module__c),
                row('Description', descOf(t))
            },
            new List<String>{
                'Please review the ticket at your earliest convenience and proceed with the necessary fixes.',
                'If you are unable to address this ticket, please reassign it to a colleague or inform your team lead for further assistance.',
                'Let us know if you need any additional information or support!',
                'The submitter is included in this communication for awareness and to facilitate a smoother resolution process.'
            },
            orgNameOf(t)
        );

        queueEmail(
            new List<String>{ t.Assigned_To__r.Email },
            ccOf(t),
            'Ticket #' + t.Ticket_Name__c + ' – has been assigned to ' + t.Assigned_To__r.Name + ' – Action required!',
            html
        );
    }

    /** Status changed (no assignment change): TO assignee, CC submitter. */
    @AuraEnabled
    public static void sendAssignmentEmailOnStatusOnly(Id ticketId) {
        TSign_Ticket__c t = loadTicketForEmail(ticketId);
        if (t.Assigned_To__r == null || String.isBlank(t.Assigned_To__r.Email)) return;

        String html = buildEmailHtml(
            'Ticket Status Updated', SUPPORT_ICON,
            'Hi ' + t.Assigned_To__r.Name + ',',
            'The status of a ticket assigned to you has been updated. See the details below:',
            null,
            new List<List<String>>{
                row('Ticket ID', '#' + t.Ticket_Name__c),
                row('Subject', t.Subject__c),
                row('Updated Status', t.Status__c),
                row('Created On', fmt(t.Date_Of_Issue__c)),
                row('Priority', t.Priority__c),
                row('Module', t.Module__c),
                row('Description', descOf(t))
            },
            new List<String>{ 'Please check the updated ticket in the support portal for further action.' },
            orgNameOf(t)
        );

        queueEmail(
            new List<String>{ t.Assigned_To__r.Email },
            ccOf(t),
            'Ticket #' + t.Ticket_Name__c + ' – Update Notification',
            html
        );
    }

    /** Comment added: TO assignee, CC submitter. */
    @AuraEnabled
    public static void sendCommentOnlyEmailNotification(Id ticketId, String commentText) {
        TSign_Ticket__c t = loadTicketForEmail(ticketId);
        if (t.Assigned_To__r == null || String.isBlank(t.Assigned_To__r.Email)) return;

        String html = buildEmailHtml(
            'New Comment on Support Ticket', null,
            'Hi ' + t.Assigned_To__r.Name + ',',
            'A new comment has been added to Ticket #' + t.Ticket_Name__c + ':',
            commentText,
            new List<List<String>>{
                row('Ticket ID', '#' + t.Ticket_Name__c),
                row('Subject', t.Subject__c),
                row('Status', t.Status__c),
                row('Created On', fmt(t.Date_Of_Issue__c)),
                row('Priority', t.Priority__c),
                row('Module', t.Module__c)
            },
            new List<String>{ 'Please check the ticket in the support portal to respond to this comment.' },
            orgNameOf(t)
        );

        queueEmail(
            new List<String>{ t.Assigned_To__r.Email },
            ccOf(t),
            'Ticket #' + t.Ticket_Name__c + ' – New Comment Added',
            html
        );
    }

    /** Resolved: TO submitter, CC assignee. */
    @AuraEnabled
    public static void sendResolvedTicketEmail(Id ticketId) {
        TSign_Ticket__c t = loadTicketForEmail(ticketId);

        List<String> toEmails = new List<String>();
        if (String.isNotBlank(t.Email_ID__c)) toEmails.add(t.Email_ID__c);

        List<String> ccEmails = new List<String>();
        String resolvedBy = UserInfo.getName();
        if (t.Assigned_To__r != null) {
            resolvedBy = t.Assigned_To__r.Name;
            if (String.isNotBlank(t.Assigned_To__r.Email)) ccEmails.add(t.Assigned_To__r.Email);
        }

        String html = buildEmailHtml(
            'Ticket Resolved', DONE_ICON,
            'Dear ' + t.User_Name__c + ',',
            'This email is to notify you that the ticket ID #' + t.Ticket_Name__c +
                ' has been successfully resolved. You can review the details below:',
            null,
            new List<List<String>>{
                row('Ticket ID', '#' + t.Ticket_Name__c),
                row('Subject', t.Subject__c),
                row('Status', 'Resolved'),
                row('Resolved By', resolvedBy),
                row('Date of Resolution', fmt(Date.today())),
                row('Priority', t.Priority__c),
                row('Module', t.Module__c),
                row('Description', descOf(t))
            },
            new List<String>{
                'If you believe the issue persists or if you have any additional questions, please don’t hesitate to contact us.',
                'Thank you for reaching out to us and we appreciate your patience.'
            },
            orgNameOf(t)
        );

        queueEmail(toEmails, ccEmails, '✅ Ticket #' + t.Ticket_Name__c + ' has been resolved – Summary Inside', html);
    }

    // ---------- email helpers ----------

    public static TSign_Ticket__c loadTicketForEmail(Id ticketId) {
        return [
            SELECT Id, Ticket_Name__c, Subject__c, Status__c, Email_ID__c, User_Name__c, Description__c,
                   Priority__c, Module__c, Date_Of_Issue__c, Organization__r.Name,
                   Assigned_To__c, Assigned_To__r.Email, Assigned_To__r.Name
            FROM TSign_Ticket__c
            WHERE Id = :ticketId
            LIMIT 1
        ];
    }

    public static List<String> ccOf(TSign_Ticket__c t) {
        List<String> cc = new List<String>();
        if (String.isNotBlank(t.Email_ID__c)) cc.add(t.Email_ID__c);
        return cc;
    }

    public static String orgNameOf(TSign_Ticket__c t) {
        return (t.Organization__r != null && String.isNotBlank(t.Organization__r.Name))
            ? t.Organization__r.Name
            : 'T sign';
    }

    public static String descOf(TSign_Ticket__c t) {
        return String.isBlank(t.Description__c) ? 'No description provided.' : t.Description__c;
    }

    // public static String getSenderEmail() {
    //     User u = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
    //     List<TSign_Organization__c> orgs = [
    //         SELECT Email__c FROM TSign_Organization__c WHERE Name = :u.Organization_Name__c LIMIT 1
    //     ];
    //     return orgs.isEmpty() ? null : orgs[0].Email__c;
    // }

    public static void queueEmail(List<String> toEmails, List<String> ccEmails, String subject, String htmlBody) {
        if (toEmails == null || toEmails.isEmpty()) return;

        // OLD CODE: generic relay sends no fromName -> shows "Tesseract Apps <info@tesseractapps.com>"
        // Id jobId = System.enqueueJob(new EmailRelayQueueable(
        //     getSenderEmail(),
        //     toEmails,
        //     subject,
        //     htmlBody,
        //     new List<String>(), // attachments
        //     ccEmails,
        //     new List<String>()  // bcc
        // ));

        // NEW: send via TSign relay -> "TSignApp <info@tsignapp.com>"
        Id jobId = System.enqueueJob(new TSignTicketEmailQueueable(toEmails, ccEmails, subject, htmlBody));
        System.debug('✅ Email queued: ' + jobId + ' | ' + subject);
    }

    // NEW: queueable that sends through TSign_EmailRelayService (fromEmail info@tsignapp.com, fromName TSignApp)
    public class TSignTicketEmailQueueable implements Queueable, Database.AllowsCallouts {
        private List<String> toEmails;
        private List<String> ccEmails;
        private String subject;
        private String htmlBody;

        public TSignTicketEmailQueueable(List<String> toEmails, List<String> ccEmails, String subject, String htmlBody) {
            this.toEmails = toEmails;
            this.ccEmails = ccEmails;
            this.subject  = subject;
            this.htmlBody = htmlBody;
        }

        public void execute(QueueableContext qc) {
            try {
                Map<String, Object> response = TSign_EmailRelayService.sendEmail(
                    'info@tsignapp.com',
                    toEmails,
                    subject,
                    htmlBody,
                    new List<String>(), // attachments
                    ccEmails,
                    new List<String>(), // bcc
                    'T sign App'
                );
                System.debug('✅ TSign ticket email response: ' + JSON.serializePretty(response));
            } catch (Exception e) {
                System.debug('❌ TSign ticket email error: ' + e.getMessage() + ' | ' + e.getStackTraceString());
            }
        }
    }

    public static List<String> row(String label, String value) {
        return new List<String>{ label, value };
    }

    public static String buildEmailHtml(
        String title, String iconUrl, String greeting, String intro, String quote,
        List<List<String>> rows, List<String> notes, String orgName
    ) {
        String html =
            '<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#ffffff;">' +
            '<div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #ddd;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 30px;' +
            'background-color:#ffffff;border-bottom:1px solid #eee;box-shadow:0 2px 6px rgba(0,0,0,0.08);">' +
            '<h2 style="margin:0;color:#003466;">' + esc(title) + '</h2>' +
            '<img src="' + LOGO_URL + '" alt="T sign" style="height:40px;" /></div>' +
            '<div style="padding:30px;">' +
            '<div style="display:flex;"><div style="flex:1;">' +
            '<p style="font-size:15px;margin-bottom:16px;">' + esc(greeting) + '</p>' +
            '<p style="font-size:14px;">' + esc(intro) + '</p></div>';

        if (String.isNotBlank(iconUrl)) {
            html += '<div style="flex-shrink:0;margin-left:10px;">' +
                    '<img src="' + iconUrl + '" alt="Notification" style="height:60px;" /></div>';
        }
        html += '</div>';

        if (String.isNotBlank(quote)) {
            html += '<div style="margin:20px 0;padding:15px;border-left:4px solid #003466;background:#f9f9f9;">' +
                    '<p style="font-size:14px;margin:0;"><em>"' + escBr(quote) + '"</em></p></div>';
        }

        html += '<table style="width:100%;font-size:14px;margin-top:20px;">';
        for (List<String> r : rows) {
            html += '<tr><td style="padding:6px 0;font-weight:bold;width:160px;vertical-align:top;">' + esc(r[0]) +
                    '</td><td>: ' + escBr(r[1]) + '</td></tr>';
        }
        html += '</table>';

        for (String n : notes) {
            html += '<p style="margin-top:12px;font-size:14px;">' + esc(n) + '</p>';
        }

        html += '<p style="font-size:13px;color:#777;margin-top:20px;"><em>This is an automated message. Replies to this email will not be monitored.</em></p>' +
                '<p style="margin-top:25px;font-size:14px;">Thanks and regards,<br/><strong>' + esc(orgName) + ' Support Team</strong></p>' +
                '</div></div></body></html>';
        return html;
    }

    // =====================================================
    // SMALL UTILITIES
    // =====================================================

    public static String escapeHtml(String input) {
        if (String.isBlank(input)) return '';
        return input
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace('\'', '&#39;');
    }

    public static String esc(String input) {
        return escapeHtml(input);
    }

    public static String escBr(String input) {
        return escapeHtml(input).replace('\n', '<br/>');
    }

    public static String fmt(Date d) {
        if (d == null) return '';
        return String.valueOf(d.day()).leftPad(2, '0') + '/' +
               String.valueOf(d.month()).leftPad(2, '0') + '/' +
               d.year();
    }

    public static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : String.valueOf(v);
    }

    public static Id toId(Object v) {
        String s = v == null ? null : String.valueOf(v);
        return String.isBlank(s) ? null : Id.valueOf(s);
    }

    // Ticket number is ddmmyyyy + 4 digits (12 digits). Integer would overflow, so use Decimal.
    public static Decimal toDecimal(Object v) {
        if (v == null) return null;
        String s = String.valueOf(v);
        return String.isBlank(s) ? null : Decimal.valueOf(s);
    }

    // @AuraEnabled(cacheable=true)
    // public static List<User> getUsersByOrganizationName(Id orgId) {
    //     return [
    //         SELECT Id, Name, Email, Full_Name__c, Username, TSign_Org_Id__c
    //         FROM User
    //         WHERE IsActive = true
    //         AND TSign_Org_Id__c = :orgId
    //     ];
    // }

    public static String getSenderEmail() {
        User u = [SELECT TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        if (u.TSign_Org_Id__c == null) return null;
        List<TSign_Organisation__c> orgs = [
            SELECT Email__c FROM TSign_Organisation__c WHERE Id = :u.TSign_Org_Id__c LIMIT 1
        ];
        return orgs.isEmpty() ? null : orgs[0].Email__c;
    }

    public class OrgUserWrapper {
        @AuraEnabled public Id userId;
        @AuraEnabled public String name;
        @AuraEnabled public String email;
        @AuraEnabled public String phone;
    }

    @AuraEnabled(cacheable=false)
    public static List<OrgUserWrapper> getUsersByOrganizationName(Id orgId) {
        Id currentUserId = UserInfo.getUserId();

        List<User> users = [
            SELECT Id, Name, Email, Username, Phone, MobilePhone,
                ContactId, Contact.Email, Contact.Phone, Contact.MobilePhone
            FROM User
            WHERE IsActive = true
            AND TSign_Org_Id__c = :orgId
            AND Id != :currentUserId
            WITH SYSTEM_MODE
            ORDER BY Name
        ];

        // resolve email: User.Email -> Contact.Email -> Username (if email-shaped)
        Map<Id, String> emailByUser = new Map<Id, String>();
        Set<String> emails = new Set<String>();
        for (User u : users) {
            String em = u.Email;
            if (String.isBlank(em) && u.Contact != null) em = u.Contact.Email;
            if (String.isBlank(em) && String.isNotBlank(u.Username) && u.Username.contains('@')) em = u.Username;
            System.debug('>>> OBO user=' + u.Name + ' userEmail=' + u.Email +
                ' contactId=' + u.ContactId + ' contactEmail=' + (u.Contact != null ? u.Contact.Email : null) +
                ' username=' + u.Username + ' resolved=' + em);
            if (String.isNotBlank(em)) {
                emailByUser.put(u.Id, em);
                emails.add(em.toLowerCase());
            }
        }

        Map<String, TSign_Staff__c> staffByEmail = new Map<String, TSign_Staff__c>();
        if (!emails.isEmpty()) {
            for (TSign_Staff__c s : [
                SELECT Id, Email__c, Phone__c FROM TSign_Staff__c WHERE Email__c IN :emails
            ]) {
                if (String.isNotBlank(s.Email__c)) staffByEmail.put(s.Email__c.toLowerCase(), s);
            }
        }
        System.debug('>>> OBO staff found=' + staffByEmail.size());

        List<OrgUserWrapper> result = new List<OrgUserWrapper>();
        for (User u : users) {
            OrgUserWrapper w = new OrgUserWrapper();
            w.userId = u.Id;
            w.name   = u.Name;
            w.email  = emailByUser.get(u.Id);

            TSign_Staff__c s = w.email != null ? staffByEmail.get(w.email.toLowerCase()) : null;
            if (s != null && String.isNotBlank(s.Phone__c)) {
                w.phone = s.Phone__c;
            } else if (u.Contact != null && String.isNotBlank(u.Contact.Phone)) {
                w.phone = u.Contact.Phone;
            } else if (u.Contact != null && String.isNotBlank(u.Contact.MobilePhone)) {
                w.phone = u.Contact.MobilePhone;
            } else if (String.isNotBlank(u.Phone)) {
                w.phone = u.Phone;
            } else {
                w.phone = u.MobilePhone;
            }
            System.debug('>>> OBO result ' + w.name + ' email=' + w.email + ' phone=' + w.phone);
            result.add(w);
        }
        return result;
    }

}