trigger TSign_offertemplatetrigger on 	TSign_Offer_Template__c (after update) {

Set<Id> organisationIds = new Set<Id>();

for (TSign_Offer_Template__c rec : Trigger.new) {

    if (String.isNotBlank(rec.TSign_Organisation__c)) {

        try {
            organisationIds.add((Id)rec.TSign_Organisation__c);
        } catch (Exception e) {
            System.debug(
                'Invalid Organisation Id: ' +
                rec.TSign_Organisation__c
            );
        }
    }
}

Map<Id, TSign_Organisation__c> organisationMap =
    new Map<Id, TSign_Organisation__c>();

if (!organisationIds.isEmpty()) {

    organisationMap = new Map<Id, TSign_Organisation__c>([
        SELECT Id,
               Name,
               Email__c
        FROM TSign_Organisation__c
        WHERE Id IN :organisationIds
    ]);
}

// Sender (document creator) time zones: "Created Date" must use the sender's
// clock, not the running user's (Guest user = GMT after a recipient signs)
Set<Id> creatorIds = new Set<Id>();

for (TSign_Offer_Template__c rec : Trigger.new) {
    if (rec.CreatedById != null) {
        creatorIds.add(rec.CreatedById);
    }
}

Map<Id, User> creatorMap = new Map<Id, User>();

if (!creatorIds.isEmpty()) {

    creatorMap = new Map<Id, User>([
        SELECT Id,
               TimeZoneSidKey
        FROM User
        WHERE Id IN :creatorIds
    ]);
}

for (TSign_Offer_Template__c newRec : Trigger.new) {

    TSign_Offer_Template__c oldRec =
        Trigger.oldMap.get(newRec.Id);

    Boolean changed =
        newRec.Current_Recipient__c != oldRec.Current_Recipient__c ||
        newRec.Current_Recipient_Status__c != oldRec.Current_Recipient_Status__c;

    if (!changed ||
        String.isBlank(newRec.Sender_Email__c)) {

        continue;
    }

    String email =
        newRec.Sender_Email__c;

    String recipientName =
        email.substringBefore('@')
             .replace('.', ' ')
             .capitalize();

    String fileName =
        String.isNotBlank(newRec.File_Name__c)
        ? newRec.File_Name__c
        : 'N/A';

    // Format in the sender's time zone; fall back to the old behaviour if unknown
    User creator =
        creatorMap.get(newRec.CreatedById);

    String createdDate =
        newRec.CreatedDate != null
        ? (creator != null && String.isNotBlank(creator.TimeZoneSidKey)
            ? newRec.CreatedDate.format('dd/MM/yyyy', creator.TimeZoneSidKey)
            : newRec.CreatedDate.format('dd/MM/yyyy'))
        : 'N/A';

    // Recipient names: All_Recipient_Names__c is line-aligned with All_Recipients__c.
    // Show the saved name; fall back to the email when no name is saved.
    Map<String, String> nameByEmail =
        new Map<String, String>();

    List<String> recipientEmails =
        String.isNotBlank(newRec.All_Recipients__c)
        ? newRec.All_Recipients__c.split('\n', -1)
        : new List<String>();

    List<String> recipientNames =
        String.isNotBlank(newRec.All_Recipient_Names__c)
        ? newRec.All_Recipient_Names__c.split('\n', -1)
        : new List<String>();

    for (Integer i = 0; i < recipientEmails.size() && i < recipientNames.size(); i++) {
        if (String.isNotBlank(recipientEmails[i]) && String.isNotBlank(recipientNames[i])) {
            nameByEmail.put(
                recipientEmails[i].trim().toLowerCase(),
                recipientNames[i].trim()
            );
        }
    }

    List<String> recipientDisplayList =
        new List<String>();

    for (String recipientEmail : recipientEmails) {
        String key = recipientEmail.trim().toLowerCase();
        recipientDisplayList.add(
            nameByEmail.containsKey(key)
            ? nameByEmail.get(key)
            : recipientEmail
        );
    }

    String recipientsList =
        String.isNotBlank(newRec.All_Recipients__c)
        ? String.join(recipientDisplayList, '<br/>')
        : 'N/A';

    String currentRecipientDisplay =
        String.isNotBlank(newRec.Current_Recipient__c) &&
        nameByEmail.containsKey(newRec.Current_Recipient__c.trim().toLowerCase())
        ? nameByEmail.get(newRec.Current_Recipient__c.trim().toLowerCase())
        : newRec.Current_Recipient__c;

    String statusHtml = '';

    if (!String.isBlank(
        newRec.Current_Recipient_Status__c
    )) {

        if (
            newRec.Current_Recipient_Status__c
                .toLowerCase() == 'completed'
        ) {

            statusHtml =
                '<span style="color:green;">' +
                '<strong>Status:</strong> ' +
                'The document has been ' +
                '<u>successfully signed</u> ' +
                'by the recipient.' +
                '</span>';

        } else {

            statusHtml =
                '<strong>Status:</strong> ' +
                newRec.Current_Recipient_Status__c;
        }
    }

    String organisationName =
        'TesseractApps';

    String senderEmailAddress =
        'noreply@tesseractapps.com';

    if (
        String.isNotBlank(
            newRec.TSign_Organisation__c
        )
    ) {

        try {

            Id orgId =
                (Id)newRec.TSign_Organisation__c;

            TSign_Organisation__c orgObj =
                organisationMap.get(orgId);

            if (
                orgObj != null &&
                String.isNotBlank(orgObj.Name)
            ) {

                organisationName =
                    orgObj.Name;
            }

            if (
                orgObj != null &&
                String.isNotBlank(
                    orgObj.Email__c
                )
            ) {

                senderEmailAddress =
                    orgObj.Email__c;
            }

        } catch (Exception e) {

            System.debug(
                'Organisation lookup failed: ' +
                e.getMessage()
            );
        }
    }
       // ---- OLD CODE (commented out) ----
    // Logo was loaded from S3; now uses the tsignapp_logo static resource.
     String tSignLogoUrl =    'https://docimgupld.s3.ap-southeast-2.amazonaws.com/companylogo/tsign_logo_cropped.png';
    // ---- END OLD CODE ----

    // // ---- NEW CODE ---- 
    // String tSignLogoUrl =
    //     URL.getOrgDomainUrl().toExternalForm() +
    //     '/resource/tsignapp_logo';
    // // ---- END NEW CODE ----

    String body =
        '<!DOCTYPE html>' +
        '<html>' +
        '<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#ffffff;">' +

        '<div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #ddd;">' +

        '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 30px;background-color:#ffffff;border-bottom:1px solid #eee;">' +

        '<h2 style="margin:0;color:#003466;">Status Update Notification</h2>' +

        '<img src="' + tSignLogoUrl + '" style="height:40px;" />' +

        '</div>' +

        '<div style="padding:30px;font-size:14px;color:#333;">' +

        '<p>Dear ' + recipientName + ',</p>' +

        '<p>This is to notify you that the document you initiated has an update:</p>' +

        '<ul>' +

        '<li><strong>File Name:</strong> ' +
        fileName +
        '</li>' +

        '<li><strong>Created Date:</strong> ' +
        createdDate +
        '</li>' +

        '<li><strong>Current Recipient:</strong> ' +
        currentRecipientDisplay +
        '</li>' +

        '<li>' +
        statusHtml +
        '</li>' +

        '</ul>' +

        '<p><strong>All Recipients:</strong><br/>' +
        recipientsList +
        '</p>' +

        '<p>Thank you,<br/>' +
        organisationName +
        '</p>' +

        '</div>' +
        '</div>' +
        '</body>' +
        '</html>';

    try {

        System.debug(
            '========== EMAIL RELAY =========='
        );

        System.debug(
            'Organisation => ' +
            organisationName
        );

        System.debug(
            'From Email => ' +
            senderEmailAddress
        );

        System.debug(
            'To Email => ' +
            email
        );

      System.enqueueJob(
                new   TSign_OfferEmailQueueable(
                    senderEmailAddress,
                    email,
                    'Document Status Update',
                    body
                )
            );

  

    } catch (Exception e) {

        System.debug(
            'EMAIL RELAY ERROR => ' +
            e.getMessage()
        );

        System.debug(
            e.getStackTraceString()
        );
    }
}
}