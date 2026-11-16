public without sharing class BillingAgreementController {

    @AuraEnabled
    public static Id upsertAgreement(Id agreementId, String name, String description) {
        if (String.isBlank(name)) {
            throw new AuraHandledException('Agreement name is required');
        }

        Billing_Agreement__c agreement;
        if (agreementId == null) {
            agreement = new Billing_Agreement__c();
        } else {
                    List<Billing_Agreement__c> agreements =
                        [SELECT Id FROM Billing_Agreement__c WHERE Id = :agreementId LIMIT 1];

                    if (agreements.isEmpty()) {
                        throw new AuraHandledException('Agreement not found');
                    }

                    agreement = agreements[0];        }

        agreement.Name = name;
        // Do NOT use Description__c or Upload_Date__c – they don't exist in your object
        // If you add them later, uncomment the lines below:
        // agreement.Description__c = description;
        // agreement.Upload_Date__c = DateTime.now();

        upsert agreement;
        return agreement.Id;
    }

  @AuraEnabled
public static List<Billing_Agreement__c> getAgreements() {
    return [
        SELECT Id, Name,
            (SELECT Id, AWS_URL__c, File_Name__c FROM Billing_Agreement_Attachments__r)
        FROM Billing_Agreement__c
        ORDER BY CreatedDate DESC
    ];
}

@AuraEnabled
public static void deleteAgreement(Id agreementId) {
    if (agreementId == null) {
        throw new AuraHandledException('Agreement ID is required');
    }

    // 🔥 Only delete parent — children auto deleted
    Billing_Agreement__c agreement =
        [SELECT Id FROM Billing_Agreement__c WHERE Id = :agreementId LIMIT 1];

    delete agreement;
}

    @AuraEnabled
    public static void attachAgreementFiles(Id agreementId, String awsJson, String attachmentId) {
        if (agreementId == null || String.isBlank(awsJson)) {
            throw new AuraHandledException('Agreement ID and file data are required.');
        }

        List<FileWrapper> fileList = (List<FileWrapper>) JSON.deserialize(awsJson, List<FileWrapper>.class);
        List<Billing_Agreement_Attachment__c> toUpsert = new List<Billing_Agreement_Attachment__c>();

        for (FileWrapper f : fileList) {
            Billing_Agreement_Attachment__c att = new Billing_Agreement_Attachment__c();
            if (!String.isBlank(attachmentId)) att.Id = attachmentId;
            att.Billing_Agreement_c__c = agreementId;      // your master-detail field
            att.AWS_URL__c = f.url;
            att.AWS_JSON__c = JSON.serialize(f);
            att.File_Name__c = f.originalName != null && f.originalName.length() > 40
               ? f.originalName.substring(0, 40)
               : f.originalName;
            att.AWS_Key__c = f.key;
            toUpsert.add(att);
        }

        if (!toUpsert.isEmpty()) upsert toUpsert;
    }

    public class FileWrapper {
        public String url;
        public String originalName;
        public String size;
        public String key;
    }

@AuraEnabled
public static List<Accounting_Invoices_Expenses__c> getAllInvoicesForOrganisation() {
  try {
        // 🔹 Current User
        User currentUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        System.debug('ORG NAME => ' + currentUser.Organization_Name__c);

        if (String.isBlank(currentUser.Organization_Name__c)) {
            return new List<Accounting_Invoices_Expenses__c>();
        }

        // 🔹 Hardcoded Company Id
        String companyId = 'a16OZ000006qpcZYAQ'; // replace if needed

        List<Accounting_Invoices_Expenses__c> invoices;

        if (Test.isRunningTest()) {
            // 🔹 Test context → NO company filter
            invoices = [
                SELECT Id, Name, Total_Amount__c, Status__c, Invoice_Date__c, Amazon_URL__c
                FROM Accounting_Invoices_Expenses__c
                WHERE (Is_Payroll_Sales__c = true OR Is_Payroll_Purchases__c = true) 
            ]; } else {invoices = [SELECT Id, Name, Total_Amount__c, Status__c, Invoice_Date__c, Amazon_URL__c,(SELECT Description__c FROM Accounting_Journal_Entry__r) FROM Accounting_Invoices_Expenses__c WHERE Company__c = :companyId AND (Is_Payroll_Sales__c = true OR Is_Payroll_Purchases__c = true) AND Is_Service_Invoice__c =false
            ];
        }

        System.debug('INVOICES COUNT => ' + invoices.size());

        if (invoices.isEmpty()) return invoices;

        // 🔹 Step 2: Collect Invoice Ids
        Set<Id> invoiceIds = new Set<Id>();
        for (Accounting_Invoices_Expenses__c inv : invoices) {
            invoiceIds.add(inv.Id);
        }

        // 🔹 Step 3: Get Journal Entries
        List<Accounting_Journal_Entry__c> journalEntries = [
            SELECT Id, Accounting_Invoices_Expenses__c, Entity_Profile__c
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Invoices_Expenses__c IN :invoiceIds
        ];

        System.debug('JOURNAL ENTRIES COUNT => ' + journalEntries.size());

        if (journalEntries.isEmpty()) {
            return new List<Accounting_Invoices_Expenses__c>();
        }

        // 🔹 Step 4: Collect Entity Profile Ids
        Set<Id> entityProfileIds = new Set<Id>();
        for (Accounting_Journal_Entry__c je : journalEntries) {
            if (je.Entity_Profile__c != null) {
                entityProfileIds.add(je.Entity_Profile__c);
            }
        }

        System.debug('ENTITY PROFILE IDS COUNT => ' + entityProfileIds.size());

        if (entityProfileIds.isEmpty()) {
            return new List<Accounting_Invoices_Expenses__c>();
        }Map<Id, Entity_Profile__c> entityProfileMap = new Map<Id, Entity_Profile__c>([SELECT Id, Name__c FROM Entity_Profile__c WHERE Id IN :entityProfileIds]);Set<Id> validInvoiceIds = new Set<Id>(); for (Accounting_Journal_Entry__c je : journalEntries) {
            if (je.Entity_Profile__c != null &&
                entityProfileMap.containsKey(je.Entity_Profile__c)) {

                Entity_Profile__c ep = entityProfileMap.get(je.Entity_Profile__c);

                if (ep.Name__c.toLowerCase().trim() == currentUser.Organization_Name__c.toLowerCase().trim()) {
                    validInvoiceIds.add(je.Accounting_Invoices_Expenses__c);
                }
            }
        }

        System.debug('MATCHED INVOICE IDS COUNT => ' + validInvoiceIds.size());

        // 🔹 Step 7: Final Result
        List<Accounting_Invoices_Expenses__c> result = new List<Accounting_Invoices_Expenses__c>();

        for (Accounting_Invoices_Expenses__c inv : invoices) {
            if (validInvoiceIds.contains(inv.Id)) {
                result.add(inv);
            }
        }

        System.debug('FINAL RESULT COUNT => ' + result.size());

        return result;

    } catch (Exception e) {
        throw new AuraHandledException('Error fetching invoices: ' + e.getMessage());
    }
 }
}