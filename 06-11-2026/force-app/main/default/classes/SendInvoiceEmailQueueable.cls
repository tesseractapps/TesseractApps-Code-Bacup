/*
public class SendInvoiceEmailQueueable implements Queueable, Database.AllowsCallouts {

    private List<Id> invoiceIds;

    public SendInvoiceEmailQueueable(List<Id> invoiceIds) {
        this.invoiceIds = invoiceIds;
    }

    public void execute(QueueableContext context) {

        System.debug('🚀 Queueable Started');

        // ───────────────── FETCH INVOICES ─────────────────
        List<Accounting_Invoices_Expenses__c> invoices = [
            SELECT Id, Name, Amazon_URL__c, Participant__c,
                   Company__r.Organization__r.Email__c,SIL_PDF_Url__c,
                   Company__r.Organization__r.Name
            FROM Accounting_Invoices_Expenses__c
            WHERE Id IN :invoiceIds
        ];

        System.debug('📦 Invoices fetched: ' + invoices.size());

        // ───────────────── COLLECT PARTICIPANTS ─────────────────
        Set<Id> participantIds = new Set<Id>();

        for (Accounting_Invoices_Expenses__c inv : invoices) {
            if (inv.Participant__c != null) {
                participantIds.add(inv.Participant__c);
                
            }
        }

        // ───────────────── FETCH CLIENTS ─────────────────
        Map<Id, Client__c> clientMap = new Map<Id, Client__c>(
            [SELECT Id, Name__c, Email__c FROM Client__c WHERE Id IN :participantIds]
        );

        System.debug('👤 Clients fetched: ' + clientMap.size());

        // ───────────────── FETCH ORG WIDE EMAIL ─────────────────
        OrgWideEmailAddress owe;

        List<OrgWideEmailAddress> oweList = [
            SELECT Id 
            FROM OrgWideEmailAddress 
           
            LIMIT 1
        ];

        if (!oweList.isEmpty()) {
            owe = oweList[0];
        }

        System.debug('🏢 OrgWideEmail loaded: ' + (owe != null));

        // ───────────────── STEP 1: DOWNLOAD PDFs ─────────────────
        Map<Id, Blob> pdfMap = new Map<Id, Blob>();

        for (Accounting_Invoices_Expenses__c inv : invoices) {

            if (String.isBlank(inv.SIL_PDF_Url__c)) {
                System.debug('⚠️ No URL for invoice: ' + inv.Id);
                continue;
            }

            try {
                HttpRequest req = new HttpRequest();
                req.setEndpoint(inv.SIL_PDF_Url__c);
                req.setMethod('GET');
                req.setTimeout(60000);

                HttpResponse res = new Http().send(req);

                if (res.getStatusCode() == 200) {
                    pdfMap.put(inv.Id, res.getBodyAsBlob());
                } else {
                    System.debug('❌ PDF failed: ' + inv.Id + ' Status: ' + res.getStatusCode());
                }

            } catch (Exception e) {
                System.debug('❌ Callout error: ' + inv.Id + ' → ' + e.getMessage());
            }
        }

        System.debug('📄 PDF downloaded count: ' + pdfMap.size());

        // ───────────────── STEP 2: BUILD EMAILS ─────────────────
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (Accounting_Invoices_Expenses__c inv : invoices) {

            System.debug('➡️ Processing Invoice: ' + inv.Id);

            Client__c client = clientMap.get(inv.Participant__c);

            if (client == null) {
                System.debug('❌ Skipped: No client');
                continue;
            }

            if (String.isBlank(client.Email__c)) {
                System.debug('❌ Skipped: No client email');
                continue;
            }

            // ── Get Email Content ──
            Map<String, String> emailData =
                RosterInvoicesHandler.getEmailBodyServiceInvoice(inv.Id);

            if (emailData == null) {
                System.debug('❌ Skipped: Email data null');
                continue;
            }

            String subject = emailData.get('subject');
            String body = emailData.get('body');

            if (String.isBlank(subject) || String.isBlank(body)) {
                System.debug('❌ Skipped: Subject/Body empty');
                continue;
            }

            // ── Fix Name Placeholder ──
            if (body.contains('Dear <b></b>')) {
                body = body.replace('Dear <b></b>', 'Dear <b>' + client.Name__c + '</b>');
            }

            // ── Create Email ──
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();

            email.setToAddresses(new List<String>{ client.Email__c });
            email.setSubject(subject);
            email.setHtmlBody(body);

            // ── Set Org Wide Email (SAFE) ──
            if (owe != null) {
                email.setOrgWideEmailAddressId(owe.Id);
            } else {
                System.debug('⚠️ OrgWideEmail not found, sending with default');
            }

            // ── Attach PDF (Optional) ──
            Blob pdfBlob = pdfMap.get(inv.Id);

            if (pdfBlob != null) {
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(inv.Name + '.pdf');
                attachment.setBody(pdfBlob);
                attachment.setContentType('application/pdf');

                email.setFileAttachments(new List<Messaging.EmailFileAttachment>{ attachment });

                System.debug('✅ PDF attached');
            } else {
                System.debug('⚠️ Sending WITHOUT PDF');
            }

            emails.add(email);
        }

        System.debug('📧 Final Email Count: ' + emails.size());

        // ───────────────── STEP 3: SEND EMAILS ─────────────────
        if (!emails.isEmpty()) {

            Messaging.SendEmailResult[] results = Messaging.sendEmail(emails);

            for (Integer i = 0; i < results.size(); i++) {
                if (results[i].isSuccess()) {
                    System.debug('✅ Email sent for index ' + i);
                } else {
                    System.debug('❌ Email failed: ' + results[i].getErrors()[0].getMessage());
                }
            }

        } else {
            System.debug('❌ No emails to send');
        }

        System.debug('🏁 Queueable Finished');
    }
}
*/
public class SendInvoiceEmailQueueable implements Queueable, Database.AllowsCallouts {

    private List<Id> invoiceIds;

    public SendInvoiceEmailQueueable(List<Id> invoiceIds) {
        this.invoiceIds = invoiceIds;
    }

    public void execute(QueueableContext context) {

        System.debug('🚀 Queueable Started');

        // ───────────────── FETCH INVOICES WITH ALL REQUIRED DATA ─────────────────
        List<Accounting_Invoices_Expenses__c> invoices = [
            SELECT Id, Name, Invoice_No__c, Invoice_Date__c, Total_Amount__c,
                   Participant__c,
                   Company__r.Organization__r.Name,
                   Company__r.Organization__r.Email__c,
                   Company__r.Organization__r.Bank__c,
                   Company__r.Organization__r.Account_Name__c,
                   Company__r.Organization__r.BSB__c,
                   Company__r.Organization__r.Account_Number__c,
                   SIL_PDF_Url__c
            FROM Accounting_Invoices_Expenses__c
            WHERE Id IN :invoiceIds
        ];

        System.debug('📦 Invoices fetched: ' + invoices.size());

        // ───────────────── FETCH CLIENTS ─────────────────
        Set<Id> participantIds = new Set<Id>();
        for (Accounting_Invoices_Expenses__c inv : invoices) {
            if (inv.Participant__c != null) {
                participantIds.add(inv.Participant__c);
            }
        }

        Map<Id, Client__c> clientMap = new Map<Id, Client__c>([
            SELECT Id, Name__c, Email__c,Facility__c,Facility__r.Organisation__c,Facility__r.Organisation__r.Name 
            FROM Client__c
            WHERE Id IN :participantIds
        ]);

        System.debug('👤 Clients fetched: ' + clientMap.size());

        // ───────────────── ORG WIDE EMAIL ─────────────────
      /*  OrgWideEmailAddress owe;
        List<OrgWideEmailAddress> oweList = [SELECT Id FROM OrgWideEmailAddress LIMIT 1];
        if (!oweList.isEmpty()) {
            owe = oweList[0];
        }*/

        // ───────────────── DOWNLOAD PDFs ─────────────────
        Map<Id, Blob> pdfMap = new Map<Id, Blob>();

        for (Accounting_Invoices_Expenses__c inv : invoices) {

            if (String.isBlank(inv.SIL_PDF_Url__c)) {
                System.debug('⚠️ No PDF URL for invoice: ' + inv.Id);
                continue;
            }

            try {
                HttpRequest req = new HttpRequest();
                req.setEndpoint(inv.SIL_PDF_Url__c);
                req.setMethod('GET');
                req.setTimeout(60000);

                HttpResponse res = new Http().send(req);

                if (res.getStatusCode() == 200) {
                    pdfMap.put(inv.Id, res.getBodyAsBlob());
                    System.debug('✅ PDF downloaded: ' + inv.Id);
                } else {
                    System.debug('❌ PDF failed: ' + inv.Id + ' Status: ' + res.getStatusCode());
                }

            } catch (Exception e) {
                System.debug('❌ PDF Callout error: ' + inv.Id + ' → ' + e.getMessage());
            }
        }

        // ───────────────── BUILD EMAILS ─────────────────
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (Accounting_Invoices_Expenses__c inv : invoices) {

            System.debug('➡️ Processing Invoice: ' + inv.Id);

            Client__c client = clientMap.get(inv.Participant__c);

            if (client == null) {
                System.debug('❌ Skipped: Client not found');
                continue;
            }

            if (String.isBlank(client.Email__c)) {
                System.debug('❌ Skipped: No client email → ' + client.Name__c);
                continue;
            }

            // ───────────── BUILD EMAIL CONTENT (INLINE) ─────────────
            String orgName       = inv.Company__r.Organization__r.Name;
            String bankName      = inv.Company__r.Organization__r.Bank__c;
            String accountName   = inv.Company__r.Organization__r.Account_Name__c;
            String bsb           = inv.Company__r.Organization__r.BSB__c;
            String accNumber     = inv.Company__r.Organization__r.Account_Number__c;

            String invoiceName   = inv.Invoice_No__c != null ? inv.Invoice_No__c : inv.Name;
            Date invoiceDate     = inv.Invoice_Date__c;
            Decimal amount       = inv.Total_Amount__c != null ? inv.Total_Amount__c : 0;

            String formattedDate = invoiceDate != null ? invoiceDate.format() : '';

            String subject = 'Invoice ' + invoiceName + ' generated on ' + formattedDate;

            String body =
                'Dear <b>' + client.Name__c + '</b>,<br/><br/>' +
                'Please find attached the invoice <b>' + invoiceName + '</b> generated on <b>' + formattedDate +
                '</b>, issued by <b>' + orgName + '</b>.<br/><br/>' +

                '<b>Invoice Summary:</b><br/>' +
                '<b>Invoice Number:</b> ' + invoiceName + '<br/>' +
                '<b>Date Issued:</b> ' + formattedDate + '<br/>' +
                '<b>Total Amount:</b> $' + String.valueOf(amount.setScale(2)) + '<br/><br/>' +

                '<b>Bank Details:</b><br/>' +
                '<b>Bank Name:</b> ' + bankName + '<br/>' +
                '<b>Account Name:</b> ' + accountName + '<br/>' +
                '<b>BSB:</b> ' + bsb + '<br/>' +
                '<b>Account Number:</b> ' + accNumber + '<br/><br/>' +

                'Kindly process the payment.';

            // ───────────── CREATE EMAIL ─────────────
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();

            email.setToAddresses(new List<String>{ client.Email__c });
            email.setSubject(subject);
            email.setHtmlBody(body);
            email.setSenderDisplayName(client.Facility__r.Organisation__r.Name);

            /*if (owe != null) {
                email.setOrgWideEmailAddressId(owe.Id);
            }*/

            // ───────────── ATTACH PDF ─────────────
            if (pdfMap.containsKey(inv.Id)) {
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(invoiceName + '.pdf');
                attachment.setBody(pdfMap.get(inv.Id));
                attachment.setContentType('application/pdf');

                email.setFileAttachments(new List<Messaging.EmailFileAttachment>{ attachment });
                System.debug('📎 Attachment added');
            } else {
                System.debug('⚠️ No attachment for invoice: ' + inv.Id);
            }

            emails.add(email);
        }

        System.debug('📧 Emails to send: ' + emails.size());

        // ───────────────── SEND EMAILS ─────────────────
        if (!emails.isEmpty()) {

            Messaging.SendEmailResult[] results = Messaging.sendEmail(emails);

            for (Integer i = 0; i < results.size(); i++) {
                if (results[i].isSuccess()) {
                    System.debug('✅ Email sent index: ' + i);
                } else {
                    System.debug('❌ Email failed: ' + results[i].getErrors()[0].getMessage());
                }
            }

        } else {
            System.debug('❌ No emails to send');
        }

        System.debug('🏁 Queueable Finished');
    }
}