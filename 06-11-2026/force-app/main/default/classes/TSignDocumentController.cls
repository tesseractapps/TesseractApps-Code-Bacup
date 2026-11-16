public without sharing class TSignDocumentController {
//    @AuraEnabled
// public static List<Map<String, Object>> getDocumentRecords(String orgId) {
//     List<Map<String, Object>> documentRecords = new List<Map<String, Object>>();

//     // Role can be null (e.g., some community users). Guard it.
//     String roleName;
//     Id roleId = UserInfo.getUserRoleId();
//     if (roleId != null) {
//         // single query (no loop)
//         roleName = [SELECT Name FROM UserRole WHERE Id = :roleId LIMIT 1].Name;
//     }

//     // Fetch TSign_Offer_Template__c once
//     List<TSign_Offer_Template__c> offerTemplates;
//     if (roleName == 'Portal Account Partner Executive') {
//         offerTemplates = [
//             SELECT Id, File_Name__c, All_Recipients__c, All_Recipient_Names__c, Current_Recipient_Status__c,
//                    Current_Recipient__c, CreatedDate
//             FROM TSign_Offer_Template__c
//             WHERE Type__c = 'Default' AND TSign_Organisation__c = :orgId
//             ORDER BY CreatedDate DESC
//         ];
//     } else {
//         offerTemplates = [
//             SELECT Id, File_Name__c, All_Recipients__c, All_Recipient_Names__c, Current_Recipient_Status__c,
//                    Current_Recipient__c, CreatedDate
//             FROM TSign_Offer_Template__c
//             WHERE Type__c = 'Default' AND TSign_Organisation__c = :orgId
//                   AND CreatedById = :UserInfo.getUserId()
//             ORDER BY CreatedDate DESC
//         ];
//     }

//     // Build a set of parent Ids
//     Set<Id> templateIds = new Set<Id>();
//     for (TSign_Offer_Template__c t : offerTemplates) templateIds.add(t.Id);

//     // Get the latest TSign_Child_Signature__c per template in ONE query
//     Map<Id, TSign_Child_Signature__c> latestChildSignatures = new Map<Id, TSign_Child_Signature__c>();
//     if (!templateIds.isEmpty()) {
//         // Order by parent then CreatedDate DESC, take first seen per parent
//         List<TSign_Child_Signature__c> sigs = [
//             SELECT Id, TSign_Offer_Template__c, Signature_URL__c, CreatedDate
//             FROM TSign_Child_Signature__c
//             WHERE TSign_Offer_Template__c IN :templateIds
//             ORDER BY TSign_Offer_Template__c, CreatedDate DESC
//         ];
//         for (TSign_Child_Signature__c s : sigs) {
//             Id pid = s.TSign_Offer_Template__c;
//             if (!latestChildSignatures.containsKey(pid)) {
//                 latestChildSignatures.put(pid, s); // first hit is the latest
//             }
//         }
//     }

//     // Build response
//     for (TSign_Offer_Template__c template : offerTemplates) {
//         Map<String, Object> record = new Map<String, Object>();
//         record.put('Id', template.Id);
//         record.put('FileName', template.File_Name__c);
//         record.put('AllRecipients', template.All_Recipients__c);
//         record.put('Current_Recipient', template.Current_Recipient__c);
//         // Display names (saved name, else email) from All_Recipient_Names__c
//         record.put('AllRecipientNames', buildRecipientListDisplay(template.All_Recipients__c, template.All_Recipient_Names__c));
//         record.put('CurrentRecipientName', getSavedRecipientName(template.All_Recipients__c, template.All_Recipient_Names__c, template.Current_Recipient__c));
//         record.put('Status', template.Current_Recipient_Status__c);
//         record.put('CreatedDate', template.CreatedDate);

//         // Only expose SignatureURL when status is Completed
//         if (template.Current_Recipient_Status__c == 'Completed'
//             && latestChildSignatures.containsKey(template.Id)) {
//             record.put('SignatureURL', latestChildSignatures.get(template.Id).Signature_URL__c);
//         } else {
//             record.put('SignatureURL', null);
//         }

//         documentRecords.add(record);
//     }

//     return documentRecords;
// }//manendra commented ths and added below code for facilityid 

   @AuraEnabled
    public static List<Map<String, Object>> getDocumentRecords(String orgId, String facilityId) {
        List<Map<String, Object>> documentRecords = new List<Map<String, Object>>();

        // No facility selected → no documents (records without TSign_Facility__c stay hidden)
        if (String.isBlank(facilityId)) {
            return documentRecords;
        }

        // Admins see all documents of the selected facility; others only their own
        Set<String> adminUserTypes = new Set<String>{ 'T Sign Org Admin'};
        User currentUser = [SELECT User_Type__c FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        Boolean isAdmin = adminUserTypes.contains(currentUser.User_Type__c);

        // Fetch TSign_Offer_Template__c once
        List<TSign_Offer_Template__c> offerTemplates;
        if (isAdmin) {
            offerTemplates = [
                SELECT Id, File_Name__c, All_Recipients__c, All_Recipient_Names__c, Current_Recipient_Status__c,
                    Current_Recipient__c, CreatedDate
                FROM TSign_Offer_Template__c
                WHERE Type__c = 'Default' AND TSign_Organisation__c = :orgId
                    AND TSign_Facility__c = :facilityId
                ORDER BY CreatedDate DESC
            ];
        } else {
            offerTemplates = [
                SELECT Id, File_Name__c, All_Recipients__c, All_Recipient_Names__c, Current_Recipient_Status__c,
                    Current_Recipient__c, CreatedDate
                FROM TSign_Offer_Template__c
                WHERE Type__c = 'Default' AND TSign_Organisation__c = :orgId
                    AND TSign_Facility__c = :facilityId
                    AND CreatedById = :UserInfo.getUserId()
                ORDER BY CreatedDate DESC
            ];
        }

        // Build a set of parent Ids
        Set<Id> templateIds = new Set<Id>();
        for (TSign_Offer_Template__c t : offerTemplates) templateIds.add(t.Id);

        // Get the latest TSign_Child_Signature__c per template in ONE query
        Map<Id, TSign_Child_Signature__c> latestChildSignatures = new Map<Id, TSign_Child_Signature__c>();
        if (!templateIds.isEmpty()) {
            // Order by parent then CreatedDate DESC, take first seen per parent
            List<TSign_Child_Signature__c> sigs = [
                SELECT Id, TSign_Offer_Template__c, Signature_URL__c, CreatedDate
                FROM TSign_Child_Signature__c
                WHERE TSign_Offer_Template__c IN :templateIds
                ORDER BY TSign_Offer_Template__c, CreatedDate DESC
            ];
            for (TSign_Child_Signature__c s : sigs) {
                Id pid = s.TSign_Offer_Template__c;
                if (!latestChildSignatures.containsKey(pid)) {
                    latestChildSignatures.put(pid, s); // first hit is the latest
                }
            }
        }

        // Build response
        for (TSign_Offer_Template__c template : offerTemplates) {
            Map<String, Object> record = new Map<String, Object>();
            record.put('Id', template.Id);
            record.put('FileName', template.File_Name__c);
            record.put('AllRecipients', template.All_Recipients__c);
            record.put('Current_Recipient', template.Current_Recipient__c);
            // Display names (saved name, else email) from All_Recipient_Names__c
            record.put('AllRecipientNames', buildRecipientListDisplay(template.All_Recipients__c, template.All_Recipient_Names__c));
            record.put('CurrentRecipientName', getSavedRecipientName(template.All_Recipients__c, template.All_Recipient_Names__c, template.Current_Recipient__c));
            record.put('Status', template.Current_Recipient_Status__c);
            record.put('CreatedDate', template.CreatedDate);

            // Only expose SignatureURL when status is Completed
            if (template.Current_Recipient_Status__c == 'Completed'
                && latestChildSignatures.containsKey(template.Id)) {
                record.put('SignatureURL', latestChildSignatures.get(template.Id).Signature_URL__c);
            } else {
                record.put('SignatureURL', null);
            }

            documentRecords.add(record);
        }

        return documentRecords;
    }


    @AuraEnabled(cacheable=true)
    public static String fetchPDF(String pdfUrl) {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint(pdfUrl);
            req.setMethod('GET');
    
            HttpResponse res = new Http().send(req);
            if (res.getStatusCode() == 200) {
                // Convert the response to Base64
                return EncodingUtil.base64Encode(res.getBodyAsBlob());
            } else {
                throw new AuraHandledException('Failed to fetch PDF. HTTP Status: ' + res.getStatusCode());
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching PDF: ' + e.getMessage());
        }
    }
        
    
        @AuraEnabled
    public static void updateComments(Id recordId, String newComment) {
        if (String.isBlank(recordId) || String.isBlank(newComment)) {
            throw new AuraHandledException('Record ID or comment is missing.');
        }
    
        // Fetch the record with existing comments
        TSign_Offer_Template__c record = [
            SELECT Id, Comments__c 
            FROM TSign_Offer_Template__c 
            WHERE Id = :recordId 
            LIMIT 1
        ];
    
        List<Object> commentsList = new List<Object>();
    
        // Parse existing comments if present
        if (!String.isBlank(record.Comments__c)) {
            try {
                // Deserialize and flatten the existing comments
                commentsList = flattenComments((List<Object>) JSON.deserializeUntyped(record.Comments__c));
            } catch (Exception e) {
                throw new AuraHandledException('Error parsing existing comments: ' + e.getMessage());
            }
        }
    
        // Deserialize the new comment and add it to the list
        Object newCommentObject = JSON.deserializeUntyped(newComment);
        commentsList.add(newCommentObject);
    
        // Serialize back to JSON and update the record
        record.Comments__c = JSON.serialize(commentsList);
    
        try {
            update record;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating record: ' + e.getMessage());
        }
    }
    
    // Helper method to flatten nested arrays in comments
    public static List<Object> flattenComments(List<Object> commentsList) {
        List<Object> flattenedList = new List<Object>();
        for (Object comment : commentsList) {
            if (comment instanceof List<Object>) {
                // Recursively flatten nested arrays
                flattenedList.addAll(flattenComments((List<Object>) comment));
            } else {
                flattenedList.add(comment);
            }
        }
        return flattenedList;
    }
     
    @AuraEnabled
    public static String getComments(Id recordId, String cacheBuster) {
        TSign_Offer_Template__c record = [SELECT Comments__c FROM TSign_Offer_Template__c WHERE Id = :recordId];
        return String.isNotBlank(record.Comments__c) ? record.Comments__c : '[]';
    }
    @AuraEnabled(cacheable=true)
    public static List<TSign_Participant_Template__c> getTemplates(Id orgId) {
        if (orgId == null) {
            throw new AuraHandledException('Organization ID is required.');
        }
    
        // Fetch current user's User_Type__c
        User currentUser = [SELECT Id, User_Type__c FROM User WHERE Id = :UserInfo.getUserId()];
        Boolean isAdmin = currentUser.User_Type__c == 'T Sign Org Admin';
    
        String query = 'SELECT Id, Document_Name__c, Document_Type__c, AWS_Document__c,Aws_Json__c ' +
                       'FROM TSign_Participant_Template__c ';
    
        if (isAdmin) {
            query += 'WHERE TSign_Organisation__c = :orgId ';
        } else {
            query += 'WHERE TSign_Organisation__c = :orgId AND CreatedById = \'' + currentUser.Id + '\' ';
        }
    
        query += 'ORDER BY CreatedDate DESC';
    
        return Database.query(query);
    }

     @AuraEnabled(cacheable=true)
    public static List<TSign_Template__c> getAllTemplates(Id orgId) {
        
        return [
            SELECT Id, Name, CreatedDate, LastModifiedDate,
                   File_Name__c, Amazon_Url__c, Placeholder_JSON__c, Organisation_Id__c,key__c,Status__c
            FROM TSign_Template__c WHERE Organisation_Id__c = :orgId
            ORDER BY CreatedDate DESC
        ];
    }

    


    @AuraEnabled(cacheable=true)
    public static List<TSign_Participant_Template__c> getTemplatesCT(Id orgId) {    
        if (orgId == null) {    
            throw new AuraHandledException('Organization ID is required.');    
        }     
        // Get current user's info    
        User currentUser = [SELECT Id, User_Type__c FROM User WHERE Id = :UserInfo.getUserId()];    
        Boolean isAdmin = currentUser.User_Type__c == 'T Sign Org Admin';     
        // Start building dynamic SOQL safely    
        String query = 'SELECT Id, Document_Name__c, Document_Type__c, AWS_Document__c ' +    
                       'FROM TSign_Participant_Template__c ' +    
                       'WHERE Document_Type__c = \'Created Template\' ' +    
                       'AND TSign_Organisation__c = \'' + String.escapeSingleQuotes(orgId) + '\'';
     
        if (!isAdmin) {    
            query += ' AND CreatedById = \'' + String.escapeSingleQuotes(UserInfo.getUserId()) + '\'';    
        }     
        query += ' ORDER BY CreatedDate DESC';     
        // Execute query and return results    
        return Database.query(query);    
    }

 


@AuraEnabled
public static Id createTemplate(String name, String type, Id orgId, String url, String awsjson) {
    TSign_Participant_Template__c template = new TSign_Participant_Template__c(
        Document_Name__c = name,
        Document_Type__c = type,
        TSign_Organisation__c = orgId,
        AWS_Document__c = url,
        Aws_Json__c = awsjson
    );
    insert template;
    return template.Id;
}

   
@AuraEnabled
public static void updateTemplate(Id templateId, String name, String type, String awsUrl, String Awsjson) {
    TSign_Participant_Template__c pt = [
        SELECT Id, Document_Name__c, Document_Type__c, AWS_Document__c 
        FROM TSign_Participant_Template__c 
        WHERE Id = :templateId 
        LIMIT 1
    ];

    pt.Document_Name__c = name;
    pt.Document_Type__c = type;

    if (String.isNotBlank(awsUrl)) {
        pt.AWS_Document__c = awsUrl;
    }
     if (String.isNotBlank(Awsjson)) {
        pt.Aws_Json__c = Awsjson;
    }

    update pt;
}

@AuraEnabled
public static void awsupdateTemplate(Id templateId, String url, String awsjson) {
    TSign_Participant_Template__c t = new TSign_Participant_Template__c(
        Id = templateId,
        AWS_Document__c = url,
        Aws_Json__c = awsjson
    );
    update t;
}





@AuraEnabled
public static List<Map<String, Object>> getQuoteDocumentRecords(String orgId) {
    List<Map<String, Object>> documentRecords = new List<Map<String, Object>>();

    if (String.isBlank(orgId)) {
        throw new AuraHandledException('Organization Id is required.');
    }

    String roleName;
    Id roleId = UserInfo.getUserRoleId();
    if (roleId != null) {
        roleName = [SELECT Name FROM UserRole WHERE Id = :roleId LIMIT 1].Name;
    }

    List<TSign_Offer_Template__c> offerTemplates;
    if (roleName == 'Portal Account Partner Executive'|| roleName == 'CEO' ||  roleName == 'Admin') {
        offerTemplates = [
            SELECT Id, File_Name__c, All_Recipients__c, Current_Recipient_Status__c,
                   Current_Recipient__c, CreatedDate
            FROM TSign_Offer_Template__c
            WHERE Type__c = 'Quote' AND TSign_Organisation__c = :orgId
            ORDER BY CreatedDate DESC
        ];
    } else {
        offerTemplates = [
            SELECT Id, File_Name__c, All_Recipients__c, Current_Recipient_Status__c,
                   Current_Recipient__c, CreatedDate
            FROM TSign_Offer_Template__c
            WHERE Type__c = 'Quote' AND TSign_Organisation__c = :orgId
              AND CreatedById = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
        ];
    }

    Set<Id> templateIds = new Set<Id>();
    for (TSign_Offer_Template__c t : offerTemplates) templateIds.add(t.Id);

    Map<Id, TSign_Child_Signature__c> latestChildSignatures = new Map<Id, TSign_Child_Signature__c>();
    if (!templateIds.isEmpty()) {
        List<TSign_Child_Signature__c> sigs = [
            SELECT Id, TSign_Offer_Template__c, Signature_URL__c, CreatedDate
            FROM TSign_Child_Signature__c
            WHERE TSign_Offer_Template__c IN :templateIds
            ORDER BY TSign_Offer_Template__c, CreatedDate DESC
        ];
        for (TSign_Child_Signature__c s : sigs) {
            if (!latestChildSignatures.containsKey(s.TSign_Offer_Template__c)) {
                latestChildSignatures.put(s.TSign_Offer_Template__c, s);
            }
        }
    }

    for (TSign_Offer_Template__c template : offerTemplates) {
        Map<String, Object> record = new Map<String, Object>();
        record.put('Id', template.Id);
        record.put('FileName', template.File_Name__c);
        record.put('AllRecipients', template.All_Recipients__c);
        record.put('Current_Recipient', template.Current_Recipient__c);
        record.put('Status', template.Current_Recipient_Status__c);
        record.put('CreatedDate', template.CreatedDate);

        if (template.Current_Recipient_Status__c == 'Completed'
            && latestChildSignatures.containsKey(template.Id)) {
            record.put('SignatureURL', latestChildSignatures.get(template.Id).Signature_URL__c);
        } else {
            record.put('SignatureURL', null);
        }

        documentRecords.add(record);
    }

    return documentRecords;
}


public class DashboardCounts {
    @AuraEnabled public Integer actionRequired { get; set; }
    @AuraEnabled public Integer waitingForOthers { get; set; }
    @AuraEnabled public Integer expiringSoon { get; set; }
    @AuraEnabled public Integer expiring24Hours { get; set; }
    @AuraEnabled public Integer completed { get; set; }

    public DashboardCounts() {
        actionRequired = 0;
        waitingForOthers = 0;
        expiringSoon = 0;
        expiring24Hours = 0;
        completed = 0;
    }
}


@AuraEnabled
public static DashboardCounts getDashboardCounts(String orgId) {

    DashboardCounts counts =
        new DashboardCounts();


    // =========================================================
    // VALIDATION
    // =========================================================

    if (String.isBlank(orgId)) {

        throw new AuraHandledException(
            'Organization Id is required.'
        );
    }


    // =========================================================
    // LOGGED-IN USER
    // =========================================================

    Id currentUserId =
        UserInfo.getUserId();


    User currentUser = [
        SELECT
            Id,
            Email,
            User_Type__c
        FROM User
        WHERE Id = :currentUserId
        LIMIT 1
    ];


    String loggedInUserEmail =
        currentUser.Email;


    if (String.isBlank(loggedInUserEmail)) {
        return counts;
    }


    loggedInUserEmail =
        loggedInUserEmail
            .trim()
            .toLowerCase();


    // =========================================================
    // FETCH ALL OFFER TEMPLATES
    //
    // IMPORTANT:
    //
    // Do NOT filter by CreatedById here.
    //
    // Expiring Soon must include:
    // - Current user's documents
    // - Other users' documents
    //
    // Individual counters apply their own conditions below.
    // =========================================================

    List<TSign_Offer_Template__c> offerTemplates = [

        SELECT
            Id,
            File_Name__c,
            All_Recipients__c,
            Current_Recipient__c,
            Current_Recipient_Status__c,
            CreatedById,
            CreatedDate,
            Expire__c

        FROM TSign_Offer_Template__c

        WHERE Type__c = 'Default'

        AND TSign_Organisation__c = :orgId

        ORDER BY CreatedDate DESC
    ];


    if (offerTemplates.isEmpty()) {
        return counts;
    }


    // =========================================================
    // OFFER TEMPLATE IDS
    // =========================================================

    Set<Id> offerTemplateIds =
        new Set<Id>();


    for (
        TSign_Offer_Template__c template :
        offerTemplates
    ) {

        offerTemplateIds.add(
            template.Id
        );
    }


    // =========================================================
    // LATEST CHILD SIGNATURE PER OFFER TEMPLATE
    //
    // TSign_Child_Signature__c represents each signing step.
    //
    // Example:
    //
    // Offer Template
    //     |
    //     +-- Child Signature 1
    //     +-- Child Signature 2
    //     +-- Child Signature 3  <-- latest
    //
    // The latest TSign_Child_Signature__c record is used for
    // Expiring Soon.
    // =========================================================

    Map<Id, TSign_Child_Signature__c>
        latestChildSignatureByTemplate =
            new Map<Id, TSign_Child_Signature__c>();


    List<TSign_Child_Signature__c> childSignatures = [

        SELECT
            Id,
            TSign_Offer_Template__c,
            Expire__c,
            CreatedDate,
            Recipient_Email__c,
            Status__c

        FROM TSign_Child_Signature__c

        WHERE TSign_Offer_Template__c IN :offerTemplateIds

        ORDER BY
            TSign_Offer_Template__c,
            CreatedDate DESC
    ];


    // =========================================================
    // STORE ONLY LATEST CHILD SIGNATURE
    // =========================================================

    for (
        TSign_Child_Signature__c child :
        childSignatures
    ) {

        if (
            child.TSign_Offer_Template__c != null
            &&
            !latestChildSignatureByTemplate.containsKey(
                child.TSign_Offer_Template__c
            )
        ) {

            latestChildSignatureByTemplate.put(
                child.TSign_Offer_Template__c,
                child
            );
        }
    }


    // =========================================================
    // DATE / TIME BOUNDARIES
    // =========================================================

    Datetime nowDateTime =
        System.now();


    Datetime twentyFourHoursFromNow =
        nowDateTime.addHours(24);


    Datetime sevenDaysFromNow =
        nowDateTime.addDays(7);


    // =========================================================
    // PROCESS DOCUMENTS
    // =========================================================

    for (
        TSign_Offer_Template__c template :
        offerTemplates
    ) {

        if (
            String.isBlank(
                template.All_Recipients__c
            )
        ) {
            continue;
        }

        TSign_Child_Signature__c latestChild =
            latestChildSignatureByTemplate.get(
                template.Id
            );

        TemplateStatusEvaluator eval = new TemplateStatusEvaluator(
            template,
            loggedInUserEmail,
            currentUserId,
            latestChild,
            nowDateTime,
            sevenDaysFromNow
        );

        if (eval.isActionRequired) {
            counts.actionRequired++;
        }

        if (eval.isWaitingForOthers) {
            counts.waitingForOthers++;
        }

        if (eval.isExpiringSoon) {
            counts.expiringSoon++;

            if (
                eval.resolvedExpireDate != null &&
                eval.resolvedExpireDate <= twentyFourHoursFromNow
            ) {
                counts.expiring24Hours++;
            }
        }

        if (eval.isCompleted) {
            counts.completed++;
        }
    }


    // =========================================================
    // DEBUG
    // =========================================================

    System.debug(
        '📊 DASHBOARD COUNTS'
    );

    System.debug(
        '➡️ Action Required: ' +
        counts.actionRequired
    );

    System.debug(
        '➡️ Waiting For Others: ' +
        counts.waitingForOthers
    );

    System.debug(
        '➡️ Expiring Soon: ' +
        counts.expiringSoon
    );

    System.debug(
        '➡️ Expiring Within 24 Hours: ' +
        counts.expiring24Hours
    );

    System.debug(
        '➡️ Completed: ' +
        counts.completed
    );


    return counts;
}
private static Boolean containsRecipientEmail(
    String allRecipients,
    String targetEmail
) {

    if (
        String.isBlank(allRecipients) ||
        String.isBlank(targetEmail)
    ) {
        return false;
    }

    String normalizedTarget =
        targetEmail.trim().toLowerCase();

    String normalizedRecipients =
        allRecipients
            .replace('\r\n', '\n')
            .replace('\r', '\n');

    List<String> recipients =
        normalizedRecipients.split('\n');


    for (String recipient : recipients) {

        if (
            !String.isBlank(recipient) &&
            recipient.trim().toLowerCase() ==
                normalizedTarget
        ) {
            return true;
        }
    }

    return false;
}
private static Boolean emailMatches(
    String email1,
    String email2
) {

    if (
        String.isBlank(email1) ||
        String.isBlank(email2)
    ) {
        return false;
    }

    return email1.trim().toLowerCase() ==
           email2.trim().toLowerCase();
}

private static String getLastRecipient(
    String allRecipients
) {

    if (String.isBlank(allRecipients)) {
        return null;
    }


    String normalizedRecipients =
        allRecipients
            .replace('\r\n', '\n')
            .replace('\r', '\n');


    List<String> recipients =
        normalizedRecipients.split('\n');


    /*
     * Remove empty values from the end.
     */
    for (
        Integer i = recipients.size() - 1;
        i >= 0;
        i--
    ) {

        if (!String.isBlank(recipients[i])) {

            return recipients[i].trim();
        }
    }


    return null;
}


public class DashboardRecord {

    @AuraEnabled
    public Id id { get; set; }

    @AuraEnabled
    public String fileName { get; set; }

    @AuraEnabled
    public String currentRecipient { get; set; }

    @AuraEnabled
    public String status { get; set; }

    @AuraEnabled
    public Datetime expireDate { get; set; }

    @AuraEnabled
    public String expiryType { get; set; }

    @AuraEnabled
    public Datetime createdDate { get; set; }

    @AuraEnabled
    public String recipientListDisplay { get; set; }

    // Raw recipient emails (All_Recipients__c), used by dashboard search
    @AuraEnabled
    public String recipientEmailsDisplay { get; set; }

    // Saved name of Current_Recipient__c (null when no name is saved)
    @AuraEnabled
    public String currentRecipientName { get; set; }

    @AuraEnabled
    public String createdByName { get; set; }

    @AuraEnabled
    public String createdByInitials { get; set; }

    @AuraEnabled
    public String documentUrl { get; set; }

    @AuraEnabled
    public String secureDocumentUrl { get; set; }

    @AuraEnabled
    public Boolean showDocumentUrl { get; set; }

    @AuraEnabled
    public String previousDocumentUrl { get; set; }

    @AuraEnabled
    public Boolean showViewAction { get; set; }

    @AuraEnabled
    public Boolean showDownloadAction { get; set; }

    @AuraEnabled
    public List<DashboardRecipientStatus> recipientStatuses { get; set; }
}

public class DashboardRecipientStatus {

    @AuraEnabled
    public String key { get; set; }

    @AuraEnabled
    public String label { get; set; }

    @AuraEnabled
    public String className { get; set; }
}

    // =====================================================
    // RESOLVE DOCUMENT SOURCE HELPER
    // =====================================================

    private static Map<String, Object> resolveDocumentSource(
        TSign_Offer_Template__c template,
        String targetRecipientEmail,
        List<TSign_Child_Signature__c> sigs,
        TSign_Child_Signature__c fallbackChild,
        Boolean isCompleted,
        String lastRecipientEmail,
        String cardType
    ) {
        String secureUrl = null;
        String previousUrl = null;
        String sourceType = null;
        Id sourceRecordId = null;
        String sourceRecipient = null;
        String sourceSignatureUrl = null;
        Datetime expireDate = null;

        if (isCompleted) {
            // COMPLETED LOGIC
            // Use the latest child signature's Signature_URL__c if available.
            if (sigs != null && !sigs.isEmpty()) {
                TSign_Child_Signature__c latestSigWithUrl = null;
                for (TSign_Child_Signature__c sig : sigs) {
                    if (String.isNotBlank(sig.Signature_URL__c)) {
                        latestSigWithUrl = sig;
                        break;
                    }
                }
                
                if (latestSigWithUrl != null) {
                    secureUrl = latestSigWithUrl.Email_Secure_Link__c;
                    previousUrl = latestSigWithUrl.Signature_URL__c;
                    sourceType = 'TSign_Child_Signature__c';
                    sourceRecordId = latestSigWithUrl.Id;
                    sourceRecipient = latestSigWithUrl.Recipient_Email__c;
                    sourceSignatureUrl = latestSigWithUrl.Signature_URL__c;
                    expireDate = latestSigWithUrl.Expire__c;
                } else {
                    // No child signature has a non-blank Signature_URL__c
                    Boolean isSingleRecipient = true;
                    if (String.isNotBlank(template.All_Recipients__c)) {
                        List<String> recs = template.All_Recipients__c.replace('\r\n', '\n').replace('\r', '\n').split('\n');
                        Integer count = 0;
                        for (String r : recs) {
                            if (String.isNotBlank(r)) {
                                count++;
                            }
                        }
                        isSingleRecipient = (count <= 1);
                    }
                    
                    if (!isSingleRecipient) {
                        // Multi-recipient: do NOT fallback to Amazon_Url__c. Set sourceType so global fallback is skipped.
                        sourceType = 'TSign_Child_Signature__c';
                        sourceRecordId = sigs[0].Id;
                        sourceRecipient = sigs[0].Recipient_Email__c;
                        expireDate = sigs[0].Expire__c;
                    }
                    // For single recipient, we leave sourceType as null so it falls back to TSign_Offer_Template__c (Amazon_Url__c)
                }
            }
        } else {
            // ACTIVE CARDS LOGIC
            // Source record is the one whose Email_Secure_Link__c is used.
            if (sigs != null && String.isNotBlank(targetRecipientEmail)) {
                String normTarget = targetRecipientEmail.trim().toLowerCase();
                for (TSign_Child_Signature__c sig : sigs) {
                    if (sig.Recipient_Email__c != null && sig.Recipient_Email__c.trim().toLowerCase() == normTarget) {
                        if (String.isNotBlank(sig.Email_Secure_Link__c)) {
                            secureUrl = sig.Email_Secure_Link__c;
                            previousUrl = sig.Signature_URL__c;
                            sourceType = 'TSign_Child_Signature__c';
                            sourceRecordId = sig.Id;
                            sourceRecipient = sig.Recipient_Email__c;
                            sourceSignatureUrl = sig.Signature_URL__c;
                            System.debug('RAW CHILD EXPIRE ==> ' + sig.Expire__c);
                            System.debug('ACTIVE CHILD EXPIRE BEFORE ASSIGNMENT ==> ' + expireDate);
                            expireDate = sig.Expire__c;
                            System.debug('ACTIVE CHILD EXPIRE AFTER ASSIGNMENT ==> ' + expireDate);
                        }
                        break;
                    }
                }
            }
            
            // EXPIRING SOON FALLBACK (if target had no secure link, resolve to fallbackChild regardless of secure link)
            if (String.isBlank(sourceType) && fallbackChild != null) {
                secureUrl = fallbackChild.Email_Secure_Link__c;
                previousUrl = fallbackChild.Signature_URL__c;
                sourceType = 'TSign_Child_Signature__c';
                sourceRecordId = fallbackChild.Id;
                sourceRecipient = fallbackChild.Recipient_Email__c;
                sourceSignatureUrl = fallbackChild.Signature_URL__c;
                System.debug('RAW CHILD EXPIRE (fallback) ==> ' + fallbackChild.Expire__c);
                System.debug('ACTIVE CHILD EXPIRE BEFORE ASSIGNMENT (fallback) ==> ' + expireDate);
                expireDate = fallbackChild.Expire__c;
                System.debug('ACTIVE CHILD EXPIRE AFTER ASSIGNMENT (fallback) ==> ' + expireDate);
            }
        }

        // GLOBAL FALLBACK TO OFFER_TEMPLATE__C
        if (String.isBlank(sourceType)) {
            secureUrl = template.Email_Secure_Link__c;
            previousUrl = template.Amazon_Url__c;
            sourceType = 'TSign_Offer_Template__c';
            sourceRecordId = template.Id;
            sourceRecipient = null;
            System.debug('RAW TEMPLATE EXPIRE (fallback) ==> ' + template.Expire__c);
            System.debug('ACTIVE TEMPLATE EXPIRE BEFORE ASSIGNMENT (fallback) ==> ' + expireDate);
            expireDate = template.Expire__c;
            System.debug('ACTIVE TEMPLATE EXPIRE AFTER ASSIGNMENT (fallback) ==> ' + expireDate);
        }

        System.debug('========== RESOLVED DOCUMENT SOURCE ==========');
        System.debug('Template ==> ' + template.Id);
        System.debug('Card Type ==> ' + cardType);
        System.debug('Source Type ==> ' + sourceType);
        System.debug('Source Record Id ==> ' + sourceRecordId);
        System.debug('Source Recipient ==> ' + sourceRecipient);
        System.debug('Source Email Secure Link ==> ' + secureUrl);
        System.debug('Source Amazon URL ==> ' + template.Amazon_Url__c);
        System.debug('Source Signature URL ==> ' + sourceSignatureUrl);
        System.debug('Final Secure URL ==> ' + secureUrl);
        System.debug('Final Document URL ==> ' + previousUrl);
        System.debug('Final Expire Date ==> ' + expireDate);
        
        return new Map<String, Object>{
            'secureUrl' => secureUrl,
            'previousUrl' => previousUrl,
            'expireDate' => expireDate,
            'sourceType' => sourceType,
            'sourceRecordId' => sourceRecordId
        };
    }

@AuraEnabled
public static List<DashboardRecord> getDashboardRecords(
    String orgId,
    String cardType
) {

    // =====================================================
    // VALIDATION
    // =====================================================

    if (String.isBlank(orgId)) {
        throw new AuraHandledException(
            'Organization Id is required.'
        );
    }

    if (String.isBlank(cardType)) {
        throw new AuraHandledException(
            'Dashboard card type is required.'
        );
    }


    // =====================================================
    // LOGGED-IN USER
    // =====================================================

    Id currentUserId = UserInfo.getUserId();

    User currentUser = [
        SELECT
            Id,
            Email
        FROM User
        WHERE Id = :currentUserId
        LIMIT 1
    ];

    String loggedInUserEmail =
        currentUser.Email;

    if (String.isBlank(loggedInUserEmail)) {
        return new List<DashboardRecord>();
    }

    loggedInUserEmail =
        loggedInUserEmail
            .trim()
            .toLowerCase();


    // =====================================================
    // FETCH OFFER TEMPLATES
    // =====================================================

    List<TSign_Offer_Template__c> offerTemplates;


    // =====================================================
    // ACTION REQUIRED
    //
    // User must:
    // 1. Exist in All_Recipients__c
    // 2. Be Current_Recipient__c
    // 3. Current status is Pending OR Blank/NULL
    //
    // CreatedBy is NOT restricted.
    // =====================================================

    if (cardType == 'actionRequired') {

        offerTemplates = [

            SELECT
                Id,
                File_Name__c,
                All_Recipients__c,
                All_Recipient_Names__c,
                Current_Recipient__c,
                Current_Recipient_Status__c,
                Amazon_Url__c,
                Email_Secure_Link__c,
                Expire__c,

                CreatedById,
                CreatedBy.Full_Name__c,
                CreatedDate

            FROM TSign_Offer_Template__c

            WHERE Type__c = 'Default'

            AND TSign_Organisation__c = :orgId

            ORDER BY CreatedDate DESC
        ];
    }


    // =====================================================
    // WAITING FOR OTHERS
    //
    // Created by logged-in user
    //
    // Current status:
    // Pending
    // OR NULL
    // OR Blank
    //
    // User email does NOT need to exist in All_Recipients__c.
    // =====================================================

    else if (cardType == 'waitingForOthers') {

        offerTemplates = [

            SELECT
                Id,
                File_Name__c,
                All_Recipients__c,
                All_Recipient_Names__c,
                Current_Recipient__c,
                Current_Recipient_Status__c,
                Amazon_Url__c,
                Email_Secure_Link__c,
                Expire__c,

                CreatedById,
                CreatedBy.Full_Name__c,
                CreatedDate

            FROM TSign_Offer_Template__c

            WHERE Type__c = 'Default'

            AND TSign_Organisation__c = :orgId

            AND CreatedById = :currentUserId

            ORDER BY CreatedDate DESC
        ];
    }


    // =====================================================
    // COMPLETED
    //
    // Only documents created by logged-in user.
    //
    // Current status MUST be Completed.
    //
    // Current_Recipient__c MUST be last recipient.
    // =====================================================

    else if (cardType == 'completed') {

        offerTemplates = [

            SELECT
                Id,
                File_Name__c,
                All_Recipients__c,
                All_Recipient_Names__c,
                Current_Recipient__c,
                Current_Recipient_Status__c,
                Amazon_Url__c,
                Email_Secure_Link__c,
                Expire__c,

                CreatedById,
                CreatedBy.Full_Name__c,
                CreatedDate

            FROM TSign_Offer_Template__c

            WHERE Type__c = 'Default'

            AND TSign_Organisation__c = :orgId

            AND CreatedById = :currentUserId

            AND Current_Recipient_Status__c = 'Completed'

            ORDER BY CreatedDate DESC
        ];
    }


    // =====================================================
    // EXPIRING SOON
    //
    // No CreatedBy restriction.
    //
    // Expiry comes from latest TSign_Child_Signature__c.
    // =====================================================

    else if (cardType == 'expiringSoon') {

        offerTemplates = [

            SELECT
                Id,
                File_Name__c,
                All_Recipients__c,
                All_Recipient_Names__c,
                Current_Recipient__c,
                Current_Recipient_Status__c,
                Amazon_Url__c,
                Email_Secure_Link__c,
                Expire__c,

                CreatedById,
                CreatedBy.Full_Name__c,
                CreatedDate

            FROM TSign_Offer_Template__c

            WHERE Type__c = 'Default'

            AND TSign_Organisation__c = :orgId

            ORDER BY CreatedDate DESC
        ];
    }


    // =====================================================
    // INVALID CARD
    // =====================================================

    else {

        throw new AuraHandledException(
            'Invalid dashboard card type: ' +
            cardType
        );
    }


    // =====================================================
    // NO RECORDS
    // =====================================================

    if (offerTemplates.isEmpty()) {
        return new List<DashboardRecord>();
    }


    // =====================================================
    // CHILD SIGNATURES
    // =====================================================

    Map<Id, List<TSign_Child_Signature__c>> childSigsByTemplate = new Map<Id, List<TSign_Child_Signature__c>>();
    Map<Id, TSign_Child_Signature__c> latestChildByTemplate = new Map<Id, TSign_Child_Signature__c>();

    Set<Id> templateIds = new Set<Id>();
    for (TSign_Offer_Template__c template : offerTemplates) {
        templateIds.add(template.Id);
    }

    if (!templateIds.isEmpty()) {
        List<TSign_Child_Signature__c> childRecords = [
            SELECT
                Id,
                TSign_Offer_Template__c,
                Expire__c,
                Recipient_Email__c,
                Status__c,
                CreatedDate,
                Email_Secure_Link__c,
                Signature_URL__c
            FROM TSign_Child_Signature__c
            WHERE TSign_Offer_Template__c IN :templateIds
            ORDER BY
                TSign_Offer_Template__c,
                CreatedDate DESC
        ];

        for (TSign_Child_Signature__c child : childRecords) {
            if (child.TSign_Offer_Template__c != null) {
                if (!childSigsByTemplate.containsKey(child.TSign_Offer_Template__c)) {
                    childSigsByTemplate.put(child.TSign_Offer_Template__c, new List<TSign_Child_Signature__c>());
                }
                childSigsByTemplate.get(child.TSign_Offer_Template__c).add(child);

                if (!latestChildByTemplate.containsKey(child.TSign_Offer_Template__c)) {
                    latestChildByTemplate.put(child.TSign_Offer_Template__c, child);
                }
            }
        }
    }


    // =====================================================
    // DATE / TIME
    // =====================================================

    Datetime nowDateTime =
        System.now();

    Datetime twentyFourHoursFromNow =
        nowDateTime.addHours(24);

    Datetime sevenDaysFromNow =
        nowDateTime.addDays(7);


    // =====================================================
    // RESULT
    // =====================================================

    List<DashboardRecord> results =
        new List<DashboardRecord>();


    // =====================================================
    // PROCESS RECORDS
    // =====================================================

    for (
        TSign_Offer_Template__c template :
        offerTemplates
    ) {

        // =====================================================
        // RECIPIENT VALIDATION
        //
        // Exclude records with NULL / blank / whitespace All_Recipients__c
        // =====================================================

        if (
            String.isBlank(
                template.All_Recipients__c
            )
        ) {
            continue;
        }


        String allRecipients =
            template.All_Recipients__c;


        String currentRecipient =
            template.Current_Recipient__c;


        String currentStatus =
            template.Current_Recipient_Status__c;


        // =================================================
        // ACTION REQUIRED
        //
        // User exists in recipient list
        // AND
        // Current recipient = logged-in user
        // AND
        // Status = Pending OR Blank/NULL
        // =================================================

        if (cardType == 'actionRequired') {

            Boolean userIsRecipient =
                containsRecipientEmail(
                    allRecipients,
                    loggedInUserEmail
                );


            Boolean isCurrentRecipient =
                emailMatches(
                    currentRecipient,
                    loggedInUserEmail
                );


            Boolean isPending =
                isPendingOrBlank(
                    currentStatus
                );


            if (
                userIsRecipient
                &&
                isCurrentRecipient
                &&
                isPending
            ) {

                Map<String, Object> resolvedSource = resolveDocumentSource(
                    template,
                    loggedInUserEmail, // For Action Required, the target is the loggedInUserEmail
                    childSigsByTemplate.get(template.Id),
                    null,
                    false,
                    null,
                    cardType
                );
                
                String secureUrl = (String) resolvedSource.get('secureUrl');
                String prevUrl = (String) resolvedSource.get('previousUrl');

                DashboardRecord r = buildDashboardRecord(
                    template,
                    null,
                    null
                );
                
                r.previousDocumentUrl = prevUrl;
                r.showViewAction = String.isNotBlank(prevUrl);
                r.showDownloadAction = String.isNotBlank(prevUrl);
                r.secureDocumentUrl = secureUrl;
                
                results.add(r);
            }
        }


        // =================================================
        // WAITING FOR OTHERS
        //
        // CreatedBy = logged-in user
        //
        // Current status = Pending OR Blank/NULL
        //
        // User does NOT need to exist in All_Recipients__c.
        // =================================================

        else if (
            cardType == 'waitingForOthers'
        ) {

            Boolean isPending =
                isPendingOrBlank(
                    currentStatus
                );


            if (isPending) {

                Map<String, Object> resolvedSource = resolveDocumentSource(
                    template,
                    currentRecipient, // For Waiting for Others, the target is the currentRecipient
                    childSigsByTemplate.get(template.Id),
                    null,
                    false,
                    null,
                    cardType
                );
                
                String secureUrl = (String) resolvedSource.get('secureUrl');
                String prevUrl = (String) resolvedSource.get('previousUrl');

                DashboardRecord r = buildDashboardRecord(
                    template,
                    null,
                    null
                );
                
                r.previousDocumentUrl = prevUrl;
                r.showViewAction = String.isNotBlank(prevUrl);
                r.showDownloadAction = String.isNotBlank(prevUrl);
                r.secureDocumentUrl = secureUrl;
                
                results.add(r);
            }
        }


        // =================================================
        // COMPLETED
        //
        // Created by logged-in user
        //
        // Status = Completed
        //
        // Current recipient = last recipient
        // =================================================

        else if (
            cardType == 'completed'
        ) {

            String lastRecipient =
                getLastRecipient(
                    allRecipients
                );


            Boolean isLastRecipient =
                !String.isBlank(
                    lastRecipient
                )
                &&
                emailMatches(
                    currentRecipient,
                    lastRecipient
                );


            if (isLastRecipient) {

                List<TSign_Child_Signature__c> sigs = childSigsByTemplate.get(template.Id);
                
                Map<String, Object> resolvedSource = resolveDocumentSource(
                    template,
                    null, 
                    sigs,
                    null,
                    true, // isCompleted
                    lastRecipient,
                    cardType
                );
                
                String prevUrl = (String) resolvedSource.get('previousUrl');

                DashboardRecord r = buildDashboardRecord(
                    template,
                    null,
                    null
                );
                
                r.previousDocumentUrl = prevUrl;
                r.showViewAction = String.isNotBlank(prevUrl);
                r.showDownloadAction = String.isNotBlank(prevUrl);
                
                results.add(r);
            }
        }


        // =================================================
        // EXPIRING SOON
        //
        // Uses latest Child Signature expiry.
        //
        // All organization records considered.
        // =================================================

        else if (
            cardType == 'expiringSoon'
        ) {

            TSign_Child_Signature__c latestChild =
                latestChildByTemplate.get(
                    template.Id
                );

            String currentExpiring = String.isNotBlank(currentRecipient) ? currentRecipient : (latestChild != null ? latestChild.Recipient_Email__c : null);
            
            Map<String, Object> resolvedSource = resolveDocumentSource(
                template,
                currentExpiring, // target for active card
                childSigsByTemplate.get(template.Id),
                latestChild, // fallback for Expiring Soon
                false,
                null,
                cardType
            );
            
            Datetime resolvedExpireDate = (Datetime) resolvedSource.get('expireDate');
            System.debug('RESOLVED EXPIRE ==> ' + resolvedExpireDate);
            
            if (
                isPendingOrBlank(template.Current_Recipient_Status__c)
                &&
                resolvedExpireDate != null
                &&
                resolvedExpireDate >= nowDateTime
                &&
                resolvedExpireDate <= sevenDaysFromNow
            ) {

                String expiryType =
                    resolvedExpireDate <=
                    twentyFourHoursFromNow
                    ? 'HIGH'
                    : 'MEDIUM';

                String secureUrl = (String) resolvedSource.get('secureUrl');
                String prevUrl = (String) resolvedSource.get('previousUrl');
                String sourceType = (String) resolvedSource.get('sourceType');
                Id sourceRecordId = (Id) resolvedSource.get('sourceRecordId');

                DashboardRecord r = buildDashboardRecord(
                    template,
                    resolvedExpireDate,
                    expiryType
                );
                System.debug('DASHBOARD RECORD EXPIRE ==> ' + r.expireDate);
                
                r.previousDocumentUrl = prevUrl;
                r.showViewAction = String.isNotBlank(prevUrl);
                r.showDownloadAction = String.isNotBlank(prevUrl);
                r.secureDocumentUrl = secureUrl;

                System.debug('===== EXPIRING SOON DEBUG START =====');
                System.debug('Template Id: ' + template.Id);
                System.debug('Document Name: ' + template.File_Name__c);
                System.debug('Current Recipient: ' + template.Current_Recipient__c);
                System.debug('Latest Child Id: ' + (latestChild != null ? String.valueOf(latestChild.Id) : 'null'));
                System.debug('Latest Child Recipient: ' + (latestChild != null ? latestChild.Recipient_Email__c : 'null'));
                System.debug('Latest Child Expire: ' + (latestChild != null ? String.valueOf(latestChild.Expire__c) : 'null'));
                System.debug('Offer Template Expire: ' + template.Expire__c);
                System.debug('Child Email Secure Link Present: ' + (latestChild != null && String.isNotBlank(latestChild.Email_Secure_Link__c)));
                System.debug('Child Signature URL Present: ' + (latestChild != null && String.isNotBlank(latestChild.Signature_URL__c)));
                System.debug('Resolved Source Type: ' + sourceType);
                System.debug('Resolved Source Id: ' + sourceRecordId);
                System.debug('Resolved Expire Date: ' + resolvedExpireDate);
                System.debug('Final Dashboard Expire Date: ' + r.expireDate);
                System.debug('FINAL EXPIRE RETURNED TO LWC ==> ' + r.expireDate);
                System.debug('===== EXPIRING SOON DEBUG END =====');
                
                results.add(r);
            }

        }
    }


    // =====================================================
    // RETURN
    // =====================================================

    return results;
}
private static DashboardRecord buildDashboardRecord(
    TSign_Offer_Template__c template,
    Datetime expireDate,
    String expiryType
) {

    DashboardRecord record =
        new DashboardRecord();


    // =====================================================
    // DOCUMENT
    // =====================================================

    record.id =
        template.Id;

    record.fileName =
        template.File_Name__c;

    record.currentRecipient =
        template.Current_Recipient__c;

    record.currentRecipientName =
        getSavedRecipientName(
            template.All_Recipients__c,
            template.All_Recipient_Names__c,
            template.Current_Recipient__c
        );


    // =====================================================
    // STATUS
    //
    // Current_Recipient_Status__c can be:
    // Pending
    // Completed
    // Rejected
    // NULL
    // Blank
    //
    // For dashboard purposes:
    // NULL / Blank = Pending
    // =====================================================

    if (
        String.isBlank(
            template.Current_Recipient_Status__c
        )
    ) {

        record.status =
            'Pending';

    } else {

        record.status =
            template.Current_Recipient_Status__c
                .trim();
    }


    // =====================================================
    // EXPIRY
    // =====================================================

    record.expireDate =
        expireDate;

    record.expiryType =
        expiryType;


    // =====================================================
    // DEBUG
    // =====================================================

    System.debug(
        '🔍 DASHBOARD DEBUG - Template Id: ' +
        template.Id
    );

    System.debug(
        '🔍 DASHBOARD DEBUG - CreatedById: ' +
        template.CreatedById
    );

    System.debug(
        '🔍 DASHBOARD DEBUG - CreatedBy Full_Name__c: ' +
        (
            template.CreatedBy != null
            ? template.CreatedBy.Full_Name__c
            : null
        )
    );

    System.debug(
        '🔍 DASHBOARD DEBUG - CreatedDate: ' +
        template.CreatedDate
    );

    System.debug(
        '🔍 DASHBOARD DEBUG - Original Status: ' +
        template.Current_Recipient_Status__c
    );

    System.debug(
        '🔍 DASHBOARD DEBUG - Dashboard Status: ' +
        record.status
    );


    // =====================================================
    // CREATED BY
    //
    // User.Full_Name__c
    // =====================================================

    if (
        template.CreatedById != null
        &&
        template.CreatedBy != null
        &&
        !String.isBlank(
            template.CreatedBy.Full_Name__c
        )
    ) {

        record.createdByName =
            template.CreatedBy.Full_Name__c;

    } else {

        record.createdByName =
            '-';
    }


    // =====================================================
    // CREATED DATE
    //
    // TSign_Offer_Template__c.CreatedDate
    // =====================================================

    record.createdDate =
        template.CreatedDate;


    System.debug(
        '🔍 DASHBOARD DEBUG - Wrapper createdByName: ' +
        record.createdByName
    );

    System.debug(
        '🔍 DASHBOARD DEBUG - Wrapper createdDate: ' +
        record.createdDate
    );


    // =====================================================
    // CREATED BY INITIALS
    //
    // Example:
    // John Smith -> JS
    // John -> JO
    // =====================================================

    record.createdByInitials =
        generateInitials(
            record.createdByName
        );


    // =====================================================
    // ALL RECIPIENTS
    //
    // Return ALL recipients (saved name, else email).
    //
    // Do NOT return Current_Recipient__c here.
    // =====================================================

    if (
        !String.isBlank(
            template.All_Recipients__c
        )
    ) {

        record.recipientListDisplay =
            buildRecipientListDisplay(
                template.All_Recipients__c,
                template.All_Recipient_Names__c
            );

        record.recipientEmailsDisplay =
            template.All_Recipients__c
                .replace('\r\n', '\n')
                .replace('\r', '\n');

    } else {

        record.recipientListDisplay =
            '-';
    }


    // =====================================================
    // FINAL DEBUG
    // =====================================================

    System.debug(
        '🔍 DASHBOARD DEBUG - Recipient List: ' +
        record.recipientListDisplay
    );

    System.debug(
        '🔍 DASHBOARD DEBUG - Final Status: ' +
        record.status
    );


    return record;
}

// =====================================================
// RECIPIENT NAMES
//
// All_Recipient_Names__c is line-aligned with All_Recipients__c.
// Returns the saved name for the email, or null when none is saved.
// =====================================================

private static String getSavedRecipientName(
    String allRecipients,
    String allNames,
    String email
) {

    if (
        String.isBlank(allRecipients) ||
        String.isBlank(allNames) ||
        String.isBlank(email)
    ) {
        return null;
    }

    List<String> emails =
        allRecipients.replace('\r\n', '\n').replace('\r', '\n').split('\n', -1);

    List<String> names =
        allNames.replace('\r\n', '\n').replace('\r', '\n').split('\n', -1);

    for (Integer i = 0; i < emails.size() && i < names.size(); i++) {
        if (
            emails[i].trim().equalsIgnoreCase(email.trim()) &&
            String.isNotBlank(names[i])
        ) {
            return names[i].trim();
        }
    }

    return null;
}

// Recipient list for display (newline-separated): saved name, else the email
private static String buildRecipientListDisplay(
    String allRecipients,
    String allNames
) {

    if (String.isBlank(allRecipients)) {
        return allRecipients;
    }

    List<String> displayList =
        new List<String>();

    for (
        String email :
        allRecipients.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    ) {
        String savedName =
            getSavedRecipientName(allRecipients, allNames, email);

        displayList.add(
            savedName != null ? savedName : email
        );
    }

    return String.join(displayList, '\n');
}

private static Boolean isPendingOrBlank(
    String status
) {

    // NULL = Pending
    if (status == null) {
        return true;
    }

    // Remove whitespace
    String normalizedStatus =
        status.trim();

    // Empty string = Pending
    if (String.isBlank(normalizedStatus)) {
        return true;
    }

    // Explicit Pending = Pending
    return normalizedStatus.equalsIgnoreCase(
        'Pending'
    );
}

private static String generateInitials(
    String fullName
) {

    if (
        String.isBlank(fullName)
        ||
        fullName == '-'
    ) {

        return '--';
    }


    List<String> parts =
        fullName
            .trim()
            .split('\\s+');


    if (parts.isEmpty()) {
        return '--';
    }


    // ================================================
    // SINGLE NAME
    // ================================================

    if (parts.size() == 1) {

        String name =
            parts[0];

        if (name.length() == 1) {

            return name
                .substring(0, 1)
                .toUpperCase();

        }

        return name
            .substring(0, 2)
            .toUpperCase();
    }


    // ================================================
    // FIRST + LAST NAME
    // ================================================

    String firstInitial =
        parts[0]
            .substring(0, 1);

    String lastInitial =
        parts[parts.size() - 1]
            .substring(0, 1);


    return (
        firstInitial +
        lastInitial
    ).toUpperCase();
}

    /* =========================================================
       RECENT ACTIVITY WRAPPER
    ========================================================= */
    public class RecentActivity {
        @AuraEnabled public Id id { get; set; }
        @AuraEnabled public String fileName { get; set; }
        @AuraEnabled public String category { get; set; }
        @AuraEnabled public String status { get; set; }
        @AuraEnabled public String description { get; set; }
        @AuraEnabled public Datetime activityDateTime { get; set; }
    }

    /* =========================================================
       TEMPLATE STATUS EVALUATOR HELPER
    ========================================================= */
    private class TemplateStatusEvaluator {
        public Boolean isActionRequired { get; set; }
        public Boolean isWaitingForOthers { get; set; }
        public Boolean isExpiringSoon { get; set; }
        public Boolean isCompleted { get; set; }
        public Datetime resolvedExpireDate { get; set; }

        public TemplateStatusEvaluator(
            TSign_Offer_Template__c template,
            String loggedInUserEmail,
            Id currentUserId,
            TSign_Child_Signature__c latestChild,
            Datetime nowDateTime,
            Datetime sevenDaysFromNow
        ) {
            String allRecipients = template.All_Recipients__c;
            String currentRecipient = template.Current_Recipient__c;
            String currentRecipientStatus = template.Current_Recipient_Status__c;

            Boolean userIsRecipient = containsRecipientEmail(allRecipients, loggedInUserEmail);
            Boolean isCurrentRecipient = emailMatches(currentRecipient, loggedInUserEmail);
            Boolean isPending = isPendingOrBlank(currentRecipientStatus);
            Boolean createdByCurrentUser = template.CreatedById == currentUserId;

            // 1. Action Required
            this.isActionRequired = userIsRecipient && isCurrentRecipient && isPending;

            // 2. Waiting for Others
            this.isWaitingForOthers = createdByCurrentUser && isPending;

            // 3. Expiring Soon
            this.resolvedExpireDate = (latestChild != null && latestChild.Expire__c != null) ? latestChild.Expire__c : template.Expire__c;
            this.isExpiringSoon = this.resolvedExpireDate != null
                && this.resolvedExpireDate >= nowDateTime
                && this.resolvedExpireDate <= sevenDaysFromNow
                && isPendingOrBlank(currentRecipientStatus);

            // 4. Completed
            String lastRecipient = getLastRecipient(allRecipients);
            Boolean isLastRecipient = !String.isBlank(lastRecipient) && emailMatches(currentRecipient, lastRecipient);
            Boolean isCompletedStatus = !String.isBlank(currentRecipientStatus) && currentRecipientStatus.trim().equalsIgnoreCase('Completed');
            this.isCompleted = createdByCurrentUser && isLastRecipient && isCompletedStatus;
        }
    }

    /* =========================================================
       GET RECENT ACTIVITIES
    ========================================================= */
    @AuraEnabled(cacheable=true)
    public static List<RecentActivity> getRecentActivities(Id orgId) {
        if (String.isBlank(orgId)) {
            throw new AuraHandledException('Organization Id is required.');
        }

        Id currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT Id, Email FROM User WHERE Id = :currentUserId LIMIT 1];
        String loggedInUserEmail = currentUser.Email;
        if (String.isBlank(loggedInUserEmail)) {
            return new List<RecentActivity>();
        }
        loggedInUserEmail = loggedInUserEmail.trim().toLowerCase();

        // Query all default templates.
        List<TSign_Offer_Template__c> offerTemplates = [
            SELECT Id, File_Name__c, All_Recipients__c, All_Recipient_Names__c, Current_Recipient__c, Current_Recipient_Status__c, CreatedById, CreatedDate, Expire__c
            FROM TSign_Offer_Template__c
            WHERE Type__c = 'Default' AND TSign_Organisation__c = :orgId
            ORDER BY CreatedDate DESC
        ];

        if (offerTemplates.isEmpty()) {
            return new List<RecentActivity>();
        }

        Set<Id> templateIds = new Set<Id>();
        for (TSign_Offer_Template__c t : offerTemplates) {
            templateIds.add(t.Id);
        }

        Map<Id, TSign_Child_Signature__c> latestChildSignatureByTemplate = new Map<Id, TSign_Child_Signature__c>();
        List<TSign_Child_Signature__c> childSignatures = [
            SELECT Id, TSign_Offer_Template__c, Expire__c, CreatedDate, Recipient_Email__c, Status__c
            FROM TSign_Child_Signature__c
            WHERE TSign_Offer_Template__c IN :templateIds
            ORDER BY TSign_Offer_Template__c, CreatedDate DESC
        ];

        for (TSign_Child_Signature__c child : childSignatures) {
            if (child.TSign_Offer_Template__c != null && !latestChildSignatureByTemplate.containsKey(child.TSign_Offer_Template__c)) {
                latestChildSignatureByTemplate.put(child.TSign_Offer_Template__c, child);
            }
        }

        Datetime nowDateTime = System.now();
        Datetime sevenDaysFromNow = nowDateTime.addDays(7);

        List<RecentActivity> recentActivitiesList = new List<RecentActivity>();

        Integer actionRequiredCount = 0;
        Integer waitingForOthersCount = 0;
        Integer expiringSoonCount = 0;
        Integer completedCount = 0;

        for (TSign_Offer_Template__c template : offerTemplates) {
            if (String.isBlank(template.All_Recipients__c)) {
                continue;
            }

            TSign_Child_Signature__c latestChild = latestChildSignatureByTemplate.get(template.Id);

            TemplateStatusEvaluator eval = new TemplateStatusEvaluator(
                template,
                loggedInUserEmail,
                currentUserId,
                latestChild,
                nowDateTime,
                sevenDaysFromNow
            );

            String category = null;
            String description = null;

            if (eval.isActionRequired) {
                category = 'Action Required';
                description = 'Your signature is required for this document.';
                actionRequiredCount++;
            } else if (eval.isWaitingForOthers) {
                category = 'Waiting for Others';
                String currentRecipient = template.Current_Recipient__c;
                if (String.isNotBlank(currentRecipient)) {
                    // Saved name, else the email
                    String currentRecipientName = getSavedRecipientName(template.All_Recipients__c, template.All_Recipient_Names__c, currentRecipient);
                    description = 'Waiting for ' + (currentRecipientName != null ? currentRecipientName : currentRecipient) + ' to sign the document.';
                } else {
                    description = 'Waiting for recipient to sign the document.';
                }
                waitingForOthersCount++;
            } else if (eval.isExpiringSoon) {
                category = 'Expiring Soon';
                Datetime expDate = latestChild != null ? latestChild.Expire__c : null;
                String formattedExp = expDate != null ? expDate.format('d MMM yyyy') : '';
                description = 'This document expires on ' + formattedExp + '.';
                expiringSoonCount++;
            } else if (eval.isCompleted) {
                category = 'Completed';
                description = 'All recipients have completed signing this document.';
                completedCount++;
            }

            if (category != null) {
                RecentActivity activity = new RecentActivity();
                activity.id = template.Id;
                activity.fileName = template.File_Name__c;
                activity.category = category;
                activity.status = String.isBlank(template.Current_Recipient_Status__c) ? 'Pending' : template.Current_Recipient_Status__c.trim();
                activity.description = description;
                activity.activityDateTime = template.CreatedDate;

                recentActivitiesList.add(activity);
            }
        }

        System.debug('Action Required Count ==> ' + actionRequiredCount);
        System.debug('Waiting For Others Count ==> ' + waitingForOthersCount);
        System.debug('Expiring Soon Count ==> ' + expiringSoonCount);
        System.debug('Completed Count ==> ' + completedCount);
        System.debug('Recent Activity Count ==> ' + recentActivitiesList.size());

        return recentActivitiesList;
    }

    /* =========================================================
       SEND SIGNATURE REMINDERS (EXPIRING SOON)

       Used by both the row bell icon (1 Id) and Remind All (all Ids).
       Recipient, secure link and expiry are resolved exactly as the
       Expiring Soon branch of getDashboardRecords resolves them.
       Status / Remaining Time match the dashboard table labels.

       All emails go in ONE EmailRelayQueueable (bulk mode);
       the relay side splits and dispatches them.
    ========================================================= */
    @AuraEnabled
    public static Integer sendSignatureReminders(List<Id> offerTemplateIds) {

        if (offerTemplateIds == null || offerTemplateIds.isEmpty()) {
            throw new AuraHandledException('No documents selected for reminder.');
        }

        // =========================================
        // GET ORGANIZATION EMAIL
        // =========================================

        User currentUser = [
            SELECT Id, Organization_Name__c,TSign_Org_Id__c 
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        TSign_Organisation__c orgObj = [
            SELECT Id, Email__c
            FROM TSign_Organisation__c
            WHERE Id = :currentUser.TSign_Org_Id__c 
            LIMIT 1
        ];

        String senderEmailAddress = orgObj.Email__c;

        System.debug('📧 Reminder Sender Email: ' + senderEmailAddress);

        // =========================================
        // OFFER TEMPLATES
        // =========================================

        List<TSign_Offer_Template__c> offerTemplates = [
            SELECT
                Id,
                File_Name__c,
                All_Recipients__c,
                All_Recipient_Names__c,
                Current_Recipient__c,
                Current_Recipient_Status__c,
                Amazon_Url__c,
                Email_Secure_Link__c,
                Expire__c,Sender_Name__c
            FROM TSign_Offer_Template__c
            WHERE Id IN :offerTemplateIds
        ];

        if (offerTemplates.isEmpty()) {
            return 0;
        }

        // =========================================
        // CHILD SIGNATURES (same query as getDashboardRecords)
        // =========================================

        Map<Id, List<TSign_Child_Signature__c>> childSigsByTemplate = new Map<Id, List<TSign_Child_Signature__c>>();
        Map<Id, TSign_Child_Signature__c> latestChildByTemplate = new Map<Id, TSign_Child_Signature__c>();

        for (TSign_Child_Signature__c child : [
            SELECT
                Id,
                TSign_Offer_Template__c,
                Expire__c,
                Recipient_Email__c,
                Status__c,
                CreatedDate,
                Email_Secure_Link__c,
                Signature_URL__c
            FROM TSign_Child_Signature__c
            WHERE TSign_Offer_Template__c IN :offerTemplateIds
            ORDER BY
                TSign_Offer_Template__c,
                CreatedDate DESC
        ]) {
            if (child.TSign_Offer_Template__c != null) {
                if (!childSigsByTemplate.containsKey(child.TSign_Offer_Template__c)) {
                    childSigsByTemplate.put(child.TSign_Offer_Template__c, new List<TSign_Child_Signature__c>());
                }
                childSigsByTemplate.get(child.TSign_Offer_Template__c).add(child);

                if (!latestChildByTemplate.containsKey(child.TSign_Offer_Template__c)) {
                    latestChildByTemplate.put(child.TSign_Offer_Template__c, child);
                }
            }
        }

        // =========================================
        // BULK EMAIL PAYLOAD
        // =========================================

        List<Object> bulkEmails = new List<Object>();

        Datetime nowDateTime = System.now();

        for (TSign_Offer_Template__c template : offerTemplates) {

            // Only pending documents get a reminder
            if (!isPendingOrBlank(template.Current_Recipient_Status__c)) {
                System.debug('⚠️ Skipped (not pending): ' + template.Id);
                continue;
            }

            TSign_Child_Signature__c latestChild = latestChildByTemplate.get(template.Id);

            String currentExpiring = String.isNotBlank(template.Current_Recipient__c)
                ? template.Current_Recipient__c
                : (latestChild != null ? latestChild.Recipient_Email__c : null);

            if (String.isBlank(currentExpiring)) {
                System.debug('⚠️ Skipped (no current recipient): ' + template.Id);
                continue;
            }

            String recipientEmail = currentExpiring.trim();

            Map<String, Object> resolvedSource = resolveDocumentSource(
                template,
                recipientEmail,
                childSigsByTemplate.get(template.Id),
                latestChild,
                false,
                null,
                'expiringSoon'
            );

            String secureUrl = (String) resolvedSource.get('secureUrl');
            Datetime expireDate = (Datetime) resolvedSource.get('expireDate');

            // Status + Remaining Time (same rules as templateCreator.js updateDashboardPagination)
            String statusLabel = 'Pending';
            String remainingTimeText = '-';

            if (expireDate != null) {

                Long diffMs = expireDate.getTime() - nowDateTime.getTime();

                if (diffMs > 0) {

                    Decimal diffHours = diffMs / 3600000.0;
                    Decimal diffDays = diffMs / 86400000.0;

                    if (diffHours < 24) {
                        statusLabel = 'Expires in 24 Hours';
                        Integer hours = Math.floor(diffHours).intValue();
                        remainingTimeText = hours == 1 ? '1 Hour' : String.valueOf(hours) + ' Hours';
                    } else {
                        statusLabel = 'Expiring Soon';
                        if (diffDays >= 7 && diffDays < 14) {
                            remainingTimeText = '1 Week';
                        } else if (diffDays >= 14 && diffDays < 21) {
                            remainingTimeText = '2 Weeks';
                        } else if (diffDays >= 21 && diffDays < 28) {
                            remainingTimeText = '3 Weeks';
                        } else {
                            Integer days = Math.floor(diffDays).intValue();
                            remainingTimeText = days == 1 ? '1 Day' : String.valueOf(days) + ' Days';
                        }
                    }

                } else {
                    statusLabel = 'Expired';
                    remainingTimeText = '0 Hours';
                }
            }

            // Recipient name (saved name, else derived from email)
            String recipientName = RecipientEmailSender.resolveRecipientName(
                template.All_Recipients__c,
                template.All_Recipient_Names__c,
                recipientEmail
            );

            String subject = 'Reminder: Action Required';

            String body =
                'Hello ' + recipientName + ',<br/><br/>' +
                'This is a reminder that your action is still pending for the following document.<br/><br/>' +
                '<b>Document:</b> ' + template.File_Name__c + '<br/>' +
                '<b>Status:</b> ' + statusLabel + '<br/>' +
                '<b>Remaining Time:</b> ' + remainingTimeText + '<br/><br/>' +
                'Please complete your assigned action using the secure signing link before the document expires.<br/><br/>' +
                '<div style="text-align:center;">' +
                    '<a href="' + secureUrl + '" style="background-color:#0070d2;color:white;padding:10px 20px;text-decoration:none;border-radius:8px;display:inline-block;">View &amp; Sign</a>' +
                '</div>' +
                '<br/><br/>' 
               ;

            Map<String, Object> emailPayload = new Map<String, Object>();

            // emailPayload.put('fromEmail', senderEmailAddress);
            emailPayload.put('fromEmail', 'info@tsignapp.com');
            emailPayload.put('fromName', String.isNotBlank(template.Sender_Name__c) ? template.Sender_Name__c : 'TSignApp');
            emailPayload.put('toEmail', new List<String>{ recipientEmail });
            emailPayload.put('subject', subject);
            emailPayload.put('body', body);

            bulkEmails.add(emailPayload);

            System.debug('✅ Reminder prepared for: ' + recipientEmail + ' | Template: ' + template.Id);
        }

        // =========================================
        // ENQUEUE ONE BULK JOB
        // =========================================

        if (!bulkEmails.isEmpty()) {

            System.debug('=== Total Reminder Emails Prepared: ' + bulkEmails.size());

            Id jobId = System.enqueueJob(
                new EmailRelayQueueable(bulkEmails)
            );

            System.debug('✅ Reminder Bulk Email Queueable Created: ' + jobId);
        }

        return bulkEmails.size();
    }
}