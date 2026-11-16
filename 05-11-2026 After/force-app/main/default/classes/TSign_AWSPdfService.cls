public without sharing class TSign_AWSPdfService {

// Error codes read by offerTemplateList.js (storePdfInSalesforce)
public static final String LINK_EXPIRED_MESSAGE = 'TSIGN_LINK_EXPIRED: This signing link has expired.';
public static final String LINK_INACTIVE_MESSAGE = 'TSIGN_LINK_INACTIVE: This document has already been submitted.';
public static final String LINK_INVALID_MESSAGE = 'TSIGN_LINK_INVALID: This signing link is not valid.';

// 🔹 Store PDF URL in Salesforce
// linkToken: the ?t= token from the signing link.
//   - present -> strict check (token must belong to the current recipient),
//                next recipient computed on the server, link deactivated here
//   - blank   -> legacy ?data= link (still in inboxes), previous behaviour.
//                Remove this branch once legacy links have expired (14 days).
@AuraEnabled(cacheable = false)
public static String storePdfRecord(String pdfUrl, Id parentRecordId, String recipientEmail, String fingerprint, String linkToken) {

    Map<String, Object> link = null;
    String nextRecipientEmail = recipientEmail;

    // Server-side checks before saving (kept outside the try
    // so the error code reaches the LWC unchanged)
    if (String.isNotBlank(linkToken)) {
        // Token links: token must belong to this envelope and to the current recipient,
        // not expired, still active. Next recipient comes from the server's list.
        TSign_Offer_Template__c template = validateSignerByToken(parentRecordId, linkToken);
        link = TSignTemplateController.resolveSignerLink(linkToken);
        nextRecipientEmail = getNextRecipient(template);
    } else {
        // Legacy ?data= links (remove after the changeover)
        validateCurrentSignerLink(parentRecordId);
    }

    try {
        String fileName = pdfUrl.substringAfterLast('/');
        Datetime expirationTime = System.now().addDays(14);

        TSign_Child_Signature__c childRecord = new TSign_Child_Signature__c();
        childRecord.TSign_Offer_Template__c = parentRecordId;
        childRecord.File_Name__c = fileName;
        childRecord.Signature_URL__c = pdfUrl;
        childRecord.Expire__c = expirationTime;
        childRecord.Link_Active__c = true;
        childRecord.Recipient_Email__c = nextRecipientEmail;
        childRecord.Fingerprint__c  = fingerprint;

        // Fires RecipientEmailHanldler -> next signer's email + Link_Token__c
        insert childRecord;
        System.debug('✅ Child record created successfully: ' + childRecord.Id);

        // Deactivate the current signer's link AFTER the insert.
        // - Same transaction: if this or the insert fails, everything rolls back
        //   and the signer's link stays usable for a retry.
        // - After, not before: updating Offer_Template__c first can set
        //   TriggerUtility.bypassTrigger (via its triggers) and make the
        //   child-insert trigger skip the next signer's email and token.
        if (link != null) {
            deactivateSignerLink(link);
        }

        return pdfUrl;
    } catch (Exception e) {
        String errorMessage =
            'Error storing PDF record: ' + e.getMessage() +
            ' | Type: ' + e.getTypeName() +
            ' | Stack: ' + e.getStackTraceString();
    
        AuraHandledException handledException =
            new AuraHandledException(errorMessage);
    
        handledException.setMessage(errorMessage);
        throw handledException;
    }
}

// 🔹 Token check: the link must exist, belong to this envelope, belong to the
// current recipient, not be expired and still be active.
// Returns the TSign_Offer_Template__c (with recipients) for getNextRecipient.
private static TSign_Offer_Template__c validateSignerByToken(Id parentRecordId, String linkToken) {
    Map<String, Object> link = TSignTemplateController.resolveSignerLink(linkToken);

    if (link.get('found') != true || parentRecordId == null) {
        System.debug('⛔ Save blocked, unknown link token');
        throw new AuraHandledException(LINK_INVALID_MESSAGE);
    }

    if ((Id) link.get('recordId') != parentRecordId) {
        System.debug('⛔ Save blocked, token belongs to another envelope');
        throw new AuraHandledException(LINK_INVALID_MESSAGE);
    }

    List<TSign_Offer_Template__c> templates = [
        SELECT Id, Current_Recipient__c, All_Recipients__c
        FROM TSign_Offer_Template__c
        WHERE Id = :parentRecordId
        LIMIT 1
    ];

    String linkEmail = (String) link.get('email');
    if (templates.isEmpty()
        || String.isBlank(templates[0].Current_Recipient__c)
        || String.isBlank(linkEmail)
        || !linkEmail.trim().equalsIgnoreCase(templates[0].Current_Recipient__c.trim())) {
        System.debug('⛔ Save blocked, token is not the current recipient\'s link');
        throw new AuraHandledException(LINK_INVALID_MESSAGE);
    }

    if (link.get('isExpired') == true) {
        System.debug('⛔ Save blocked, link expired');
        throw new AuraHandledException(LINK_EXPIRED_MESSAGE);
    }

    if (link.get('isActive') != true) {
        System.debug('⛔ Save blocked, link inactive');
        throw new AuraHandledException(LINK_INACTIVE_MESSAGE);
    }

    return templates[0];
}

// 🔹 Next recipient from the server's recipient list (not from the browser).
// Returns null for the last recipient (same as before: the trigger then marks Completed).
private static String getNextRecipient(TSign_Offer_Template__c template) {
    if (String.isBlank(template.All_Recipients__c)) {
        return null;
    }

    List<String> recipients = new List<String>();
    for (String recipient : template.All_Recipients__c.split('\n')) {
        if (String.isNotBlank(recipient)) {
            recipients.add(recipient.trim());
        }
    }

    String current = template.Current_Recipient__c.trim();
    for (Integer i = 0; i < recipients.size(); i++) {
        if (recipients[i].equalsIgnoreCase(current)) {
            return (i + 1 < recipients.size()) ? recipients[i + 1] : null;
        }
    }
    return null;
}

// 🔹 Deactivates the record the token belongs to:
// recipient 1 -> Offer_Template__c, recipients 2+ -> Child_Signatures__c
private static void deactivateSignerLink(Map<String, Object> link) {
    Id childSignatureId = (Id) link.get('childSignatureId');

    if (childSignatureId != null) {
        update new TSign_Child_Signature__c(Id = childSignatureId, Link_Active__c = false);
    } else {
        update new TSign_Offer_Template__c(Id = (Id) link.get('recordId'), Link_Active__c = false);
    }
}

// 🔹 LEGACY (?data= links): blocks the save when the current signer's link is
// expired or already used. Remove together with the blank-token branch above.
private static void validateCurrentSignerLink(Id parentRecordId) {
    if (parentRecordId == null) {
        return;
    }

    List<TSign_Offer_Template__c> templates = [
        SELECT Id, Current_Recipient__c
        FROM TSign_Offer_Template__c
        WHERE Id = :parentRecordId
        LIMIT 1
    ];

    if (templates.isEmpty() || String.isBlank(templates[0].Current_Recipient__c)) {
        return;
    }

    Map<String, Object> linkStatus = TSignTemplateController.getSignerLinkStatus(
        parentRecordId,
        templates[0].Current_Recipient__c
    );

    if (linkStatus.get('found') != true) {
        return;
    }

    if (linkStatus.get('isExpired') == true) {
        System.debug('⛔ Save blocked, link expired for: ' + templates[0].Current_Recipient__c);
        throw new AuraHandledException(LINK_EXPIRED_MESSAGE);
    }

    if (linkStatus.get('isActive') != true) {
        System.debug('⛔ Save blocked, link inactive for: ' + templates[0].Current_Recipient__c);
        throw new AuraHandledException(LINK_INACTIVE_MESSAGE);
    }
}
}