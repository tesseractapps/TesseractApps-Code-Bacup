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
        // 🔹 Get current user
        User currentUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        if (String.isBlank(currentUser.Organization_Name__c)) {
            return new List<Accounting_Invoices_Expenses__c>();
        }

        // 🔹 Get Organisation using Name (fallback approach)
        List<Organisation__c> orgList = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        if (orgList.isEmpty()) {
            return new List<Accounting_Invoices_Expenses__c>();
        }

        Id orgId = orgList[0].Id;

        // 🔹 Get companies under organisation
        List<Company__c> companies = [
            SELECT Id
            FROM Company__c
            WHERE Organization__c = :orgId
        ];

        if (companies.isEmpty()) {
            return new List<Accounting_Invoices_Expenses__c>();
        }

        // 🔹 Collect company IDs
        Set<Id> companyIds = new Set<Id>();
        for (Company__c c : companies) {
            companyIds.add(c.Id);
        }

        // 🔹 Fetch invoices
        return [
            SELECT Id, Name, Total_Amount__c, Status__c, Invoice_Date__c, Amazon_URL__c,
            (SELECT Description__c FROM Accounting_Journal_Entry__r)
            FROM Accounting_Invoices_Expenses__c
            WHERE Company__c IN :companyIds and (Is_Payroll_Sales__c = true OR Is_Payroll_Purchases__c = true )
            ORDER BY Invoice_Date__c DESC
        ];

    } catch (Exception e) {
        throw new AuraHandledException('Error fetching invoices: ' + e.getMessage());
    }
}


}