public without sharing class tSignDocsController {
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getDocumentRecords(String orgId) {
        List<Map<String, Object>> documentRecords = new List<Map<String, Object>>();
        string rolename = [select id,name from userrole where id=:UserInfo.getUserRoleId()].name;
        List<Offer_Template__c> offerTemplates;
        if( (rolename == 'Portal Account Partner Executive') ){
            offerTemplates = [
            SELECT Id, File_Name__c, All_Recipients__c, Current_Recipient_Status__c, CreatedDate
            FROM Offer_Template__c
            WHERE Type__c = 'Default' AND Orgnisation_Id__c = :orgId];
        }
        else{
            offerTemplates = [
            SELECT Id, File_Name__c, All_Recipients__c, Current_Recipient_Status__c, CreatedDate
            FROM Offer_Template__c
            WHERE Type__c = 'Default' AND Orgnisation_Id__c = :orgId AND CreatedById = :UserInfo.getUserId()
        ];
            
        }

        
        
        // Query latest Child_Signatures__c records grouped by Offer_Template__c
        Map<Id, Child_Signatures__c> latestChildSignatures = new Map<Id, Child_Signatures__c>();
        for (AggregateResult result : [
            SELECT Offer_Template__c, MAX(CreatedDate) maxDate
            FROM Child_Signatures__c
            GROUP BY Offer_Template__c
        ]) {
            Id templateId = (Id)result.get('Offer_Template__c');
            Datetime maxDate = (Datetime)result.get('maxDate');
            
            // Query the latest Child_Signatures__c record for each Offer_Template__c
            List<Child_Signatures__c> latestSignatures = [
                SELECT Id, Offer_Template__c, Signature_URL__c, CreatedDate
                FROM Child_Signatures__c
                WHERE Offer_Template__c = :templateId AND CreatedDate = :maxDate
                LIMIT 1
            ];
            
            if (!latestSignatures.isEmpty()) {
                latestChildSignatures.put(templateId, latestSignatures[0]);
            }
        }

        // Process Offer_Template__c records and combine data
        for (Offer_Template__c template : offerTemplates) {
            Map<String, Object> record = new Map<String, Object>();
            record.put('Id', template.Id);
            record.put('FileName', template.File_Name__c);
            record.put('FirstRecipient', template.All_Recipients__c != null 
                ? template.All_Recipients__c.split('\n')[0] 
                : null); // Extract the first recipient
            record.put('Status', template.Current_Recipient_Status__c);
            record.put('CreatedDate', template.CreatedDate);

            // Add Signature URL only if status is "Completed"
            if (template.Current_Recipient_Status__c == 'Completed' && latestChildSignatures.containsKey(template.Id)) {
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
public static List<Participant_Template__c> getTemplates() {
    return [
        SELECT Id, Document_Name__c, Document_Type__c, 	AWS_Document__c
        FROM Participant_Template__c
        ORDER BY CreatedDate DESC
    ];
}

@AuraEnabled
public static Id createTemplate(String name, String type) {
    Participant_Template__c template = new Participant_Template__c(
        Document_Name__c = name,
        Document_Type__c = type
    );
    insert template;
    return template.Id;
}
   
    @AuraEnabled
public static void updateTemplate(Id templateId, String name, String type) {
    Participant_Template__c pt = [SELECT Id, Document_Name__c, Document_Type__c FROM Participant_Template__c WHERE Id = :templateId LIMIT 1];
    pt.Document_Name__c = name;
    pt.Document_Type__c = type;
    update pt;
}

@AuraEnabled
public static void deleteTemplate(Id templateId) {
    delete [SELECT Id FROM Participant_Template__c WHERE Id = :templateId LIMIT 1];
}


}