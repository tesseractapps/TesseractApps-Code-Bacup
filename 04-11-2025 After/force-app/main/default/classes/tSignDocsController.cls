public without sharing class tSignDocsController {
   @AuraEnabled
public static List<Map<String, Object>> getDocumentRecords(String orgId) {
    List<Map<String, Object>> documentRecords = new List<Map<String, Object>>();

    // Role can be null (e.g., some community users). Guard it.
    String roleName;
    Id roleId = UserInfo.getUserRoleId();
    if (roleId != null) {
        // single query (no loop)
        roleName = [SELECT Name FROM UserRole WHERE Id = :roleId LIMIT 1].Name;
    }

    // Fetch Offer_Template__c once
    List<Offer_Template__c> offerTemplates;
    if (roleName == 'Portal Account Partner Executive') {
        offerTemplates = [
            SELECT Id, File_Name__c, All_Recipients__c, Current_Recipient_Status__c,
                   Current_Recipient__c, CreatedDate
            FROM Offer_Template__c
            WHERE Type__c = 'Default' AND Orgnisation_Id__c = :orgId
            ORDER BY CreatedDate DESC
        ];
    } else {
        offerTemplates = [
            SELECT Id, File_Name__c, All_Recipients__c, Current_Recipient_Status__c,
                   Current_Recipient__c, CreatedDate
            FROM Offer_Template__c
            WHERE Type__c = 'Default' AND Orgnisation_Id__c = :orgId
                  AND CreatedById = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
        ];
    }

    // Build a set of parent Ids
    Set<Id> templateIds = new Set<Id>();
    for (Offer_Template__c t : offerTemplates) templateIds.add(t.Id);

    // Get the latest Child_Signatures__c per template in ONE query
    Map<Id, Child_Signatures__c> latestChildSignatures = new Map<Id, Child_Signatures__c>();
    if (!templateIds.isEmpty()) {
        // Order by parent then CreatedDate DESC, take first seen per parent
        List<Child_Signatures__c> sigs = [
            SELECT Id, Offer_Template__c, Signature_URL__c, CreatedDate
            FROM Child_Signatures__c
            WHERE Offer_Template__c IN :templateIds
            ORDER BY Offer_Template__c, CreatedDate DESC
        ];
        for (Child_Signatures__c s : sigs) {
            Id pid = s.Offer_Template__c;
            if (!latestChildSignatures.containsKey(pid)) {
                latestChildSignatures.put(pid, s); // first hit is the latest
            }
        }
    }

    // Build response
    for (Offer_Template__c template : offerTemplates) {
        Map<String, Object> record = new Map<String, Object>();
        record.put('Id', template.Id);
        record.put('FileName', template.File_Name__c);
        record.put('AllRecipients', template.All_Recipients__c);
        record.put('Current_Recipient', template.Current_Recipient__c);
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
        Offer_Template__c record = [
            SELECT Id, Comments__c 
            FROM Offer_Template__c 
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
        Offer_Template__c record = [SELECT Comments__c FROM Offer_Template__c WHERE Id = :recordId];
        return String.isNotBlank(record.Comments__c) ? record.Comments__c : '[]';
    }
    @AuraEnabled(cacheable=true)
    public static List<Participant_Template__c> getTemplates(Id orgId) {
        if (orgId == null) {
            throw new AuraHandledException('Organization ID is required.');
        }
    
        // Fetch current user's User_Type__c
        User currentUser = [SELECT Id, User_Type__c FROM User WHERE Id = :UserInfo.getUserId()];
        Boolean isAdmin = currentUser.User_Type__c == 'NDIS Org Admin';
    
        String query = 'SELECT Id, Document_Name__c, Document_Type__c, AWS_Document__c,Aws_Json__c ' +
                       'FROM Participant_Template__c ';
    
        if (isAdmin) {
            query += 'WHERE Organization__c = :orgId ';
        } else {
            query += 'WHERE Organization__c = :orgId AND CreatedById = \'' + currentUser.Id + '\' ';
        }
    
        query += 'ORDER BY CreatedDate DESC';
    
        return Database.query(query);
    }


    @AuraEnabled(cacheable=true)
    public static List<Participant_Template__c> getTemplatesCT(Id orgId) {    
        if (orgId == null) {    
            throw new AuraHandledException('Organization ID is required.');    
        }     
        // Get current user's info    
        User currentUser = [SELECT Id, User_Type__c FROM User WHERE Id = :UserInfo.getUserId()];    
        Boolean isAdmin = currentUser.User_Type__c == 'NDIS Org Admin';     
        // Start building dynamic SOQL safely    
        String query = 'SELECT Id, Document_Name__c, Document_Type__c, AWS_Document__c ' +    
                       'FROM Participant_Template__c ' +    
                       'WHERE Document_Type__c = \'Created Template\' ' +    
                       'AND Organization__c = \'' + String.escapeSingleQuotes(orgId) + '\'';
     
        if (!isAdmin) {    
            query += ' AND CreatedById = \'' + String.escapeSingleQuotes(UserInfo.getUserId()) + '\'';    
        }     
        query += ' ORDER BY CreatedDate DESC';     
        // Execute query and return results    
        return Database.query(query);    
    }

 


@AuraEnabled
public static Id createTemplate(String name, String type, Id orgId) {
    Participant_Template__c template = new Participant_Template__c(
        Document_Name__c = name,
        Document_Type__c = type,
        Organization__c = orgId
    );
    insert template;
    return template.Id;
}

   
@AuraEnabled
public static void updateTemplate(Id templateId, String name, String type, String awsUrl, String Awsjson) {
    Participant_Template__c pt = [
        SELECT Id, Document_Name__c, Document_Type__c, AWS_Document__c 
        FROM Participant_Template__c 
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
public static void deleteTemplate(Id templateId) {
    delete [SELECT Id FROM Participant_Template__c WHERE Id = :templateId LIMIT 1];
}


}