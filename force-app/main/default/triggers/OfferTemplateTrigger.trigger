trigger OfferTemplateTrigger on Offer_Template__c (after update) {
    List<Messaging.SingleEmailMessage> emailsToSend = new List<Messaging.SingleEmailMessage>();

    for (Offer_Template__c newRec : Trigger.new) {
        Offer_Template__c oldRec = Trigger.oldMap.get(newRec.Id);

        Boolean changed = newRec.Current_Recipient__c != oldRec.Current_Recipient__c ||
                          newRec.Current_Recipient_Status__c != oldRec.Current_Recipient_Status__c;

        if (changed && String.isNotBlank(newRec.Sender_Email__c)) {
            // Prepare recipient name
            String email = newRec.Sender_Email__c;
            String recipientName = email.substringBefore('@').replace('.', ' ');
            recipientName = recipientName.capitalize();

            String fileName = newRec.File_Name__c != null ? newRec.File_Name__c : 'N/A';

            // Format created date as dd/MM/yyyy
            String createdDate = (newRec.CreatedDate != null) 
                ? newRec.CreatedDate.format('dd/MM/yyyy') 
                : 'N/A';

            // Prepare all recipients list with line breaks
            String recipientsList = newRec.All_Recipients__c != null 
                ? newRec.All_Recipients__c.replace('\n', '<br/>') 
                : 'N/A';

            // Format status professionally
            String statusHtml = '';
            if (!String.isBlank(newRec.Current_Recipient_Status__c)) {
                if (newRec.Current_Recipient_Status__c.toLowerCase() == 'completed') {
                    statusHtml = '<span style="color:green;"><strong>Status:</strong> The document has been <u>successfully signed</u> by the recipient.</span>';
                } else {
                    statusHtml = '<strong>Status:</strong> ' + newRec.Current_Recipient_Status__c;
                }
            }

            String TsignlogoUrl = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/te-sign.png';

            String body = '<!DOCTYPE html>' +
            '<html>' +
            '<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">' +
            '<div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #ddd;">' +

                '<div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 30px;' +
                ' background-color: #ffffff; border-bottom: 1px solid #eee; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);">' +
                    '<h2 style="margin: 0; color: #003466;">Status Update Notification</h2>' +
                    '<img src="' + TsignlogoUrl + '" alt="TesseractApps" style="height: 40px;" />' +
                '</div>' +

                '<div style="padding: 30px; font-size: 14px; color: #333;">' +
                    '<p>Dear ' + recipientName + ',</p>' +
                    '<p>This is to notify you that the document you initiated has an update:</p>' +
                    '<ul>' +
                        '<li><strong>File Name:</strong> ' + fileName + '</li>' +
                        '<li><strong>Created Date:</strong> ' + createdDate + '</li>' +
                        '<li><strong>Current Recipient:</strong> ' + newRec.Current_Recipient__c + '</li>' +
                        '<li>' + statusHtml + '</li>' +
                    '</ul>' +
                    '<p><strong>All Recipients:</strong><br/>' + recipientsList + '</p>' +
                    '<p>Thank you,<br/>TesseractApps</p>' +
                '</div>' +
            '</div>' +
            '</body>' +
            '</html>';

            OrgWideEmailAddress orgWideEmail = [
                SELECT Id FROM OrgWideEmailAddress 
                WHERE Address = :System.Label.OrgWideEmailAddress 
                LIMIT 1
            ];

            Messaging.SingleEmailMessage emailMsg = new Messaging.SingleEmailMessage();
            emailMsg.setToAddresses(new String[] { email });
            emailMsg.setSubject('Status Update: Offer Letter Document');
            emailMsg.setHtmlBody(body);
            emailMsg.setOrgWideEmailAddressId(orgWideEmail.Id);
            emailsToSend.add(emailMsg);
        }
    }

    if (!emailsToSend.isEmpty()) {
        Messaging.sendEmail(emailsToSend);
    }
}