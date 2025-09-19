public without sharing class AWSPdfService {

// 🔹 Store PDF URL in Salesforce
@AuraEnabled(cacheable = false)
public static String storePdfRecord(String pdfUrl, Id parentRecordId, String recipientEmail) {
    try {
        String fileName = pdfUrl.substringAfterLast('/');
        Datetime expirationTime = System.now().addHours(24);

        Child_Signatures__c childRecord = new Child_Signatures__c();
        childRecord.Offer_Template__c = parentRecordId;
        childRecord.File_Name__c = fileName;
        childRecord.Signature_URL__c = pdfUrl;
        childRecord.Expire__c = expirationTime;
        childRecord.Link_Active__c = true;
        childRecord.Recipient_Email__c = recipientEmail; // ✅ Added Recipient Email

        insert childRecord;
        System.debug('✅ Child record created successfully: ' + childRecord.Id);

        return pdfUrl;
    } catch (Exception e) {
        throw new AuraHandledException('Error storing PDF record: ' + e.getMessage());
    }
}




    


}