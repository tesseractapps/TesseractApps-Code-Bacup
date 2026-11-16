trigger OfferTemplateTrigger on Offer_Template__c (after update) {

Set<Id> organisationIds = new Set<Id>();

for (Offer_Template__c rec : Trigger.new) {

    if (String.isNotBlank(rec.Orgnisation_Id__c)) {

        try {
            organisationIds.add((Id)rec.Orgnisation_Id__c);
        } catch (Exception e) {
            System.debug(
                'Invalid Organisation Id: ' +
                rec.Orgnisation_Id__c
            );
        }
    }
}

Map<Id, Organisation__c> organisationMap =
    new Map<Id, Organisation__c>();

if (!organisationIds.isEmpty()) {

    organisationMap = new Map<Id, Organisation__c>([
        SELECT Id,
               Name,
               Email__c
        FROM Organisation__c
        WHERE Id IN :organisationIds
    ]);
}

for (Offer_Template__c newRec : Trigger.new) {

    Offer_Template__c oldRec =
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

    String createdDate =
        newRec.CreatedDate != null
        ? newRec.CreatedDate.format('dd/MM/yyyy')
        : 'N/A';

    String recipientsList =
        String.isNotBlank(newRec.All_Recipients__c)
        ? newRec.All_Recipients__c.replace('\n', '<br/>')
        : 'N/A';

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
            newRec.Orgnisation_Id__c
        )
    ) {

        try {

            Id orgId =
                (Id)newRec.Orgnisation_Id__c;

            Organisation__c orgObj =
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

    String tSignLogoUrl =
        'https://datainfo.s3.ap-southeast-2.amazonaws.com/te-sign.png';

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
        newRec.Current_Recipient__c +
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
                new OfferEmailQueueable(
                    senderEmailAddress,
                    email,
                    'Status Update: Offer Letter Document',
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