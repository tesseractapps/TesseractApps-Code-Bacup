public class InvoiceController {
	// Get Invoice counts for different statuses
    @AuraEnabled(cacheable=true)
    public static Map<String, Integer> getInvoiceCounts(String userId) {
        Map<String, Integer> InvoiceCounts = new Map<String, Integer>();
        
        // Fetch the organization name associated with the user
        User userRecord = [SELECT Id, Name, Organization_Name__c FROM User WHERE Id = :userId LIMIT 1];
        
        // Ensure the Organization_Name__c field is not null
        if (String.isBlank(userRecord.Organization_Name__c)) {
            throw new AuraHandledException('The user does not have an organization name defined.');
        }

        // Query count for Draft Invoice
        Integer draftInvoiveCount = [SELECT COUNT() FROM Invoice_Parent__c WHERE Status__c = 'Draft' AND Organization__r.Name =:userRecord.Organization_Name__c];
        InvoiceCounts.put('draftInvoice', draftInvoiveCount);
        system.debug('draftInvoiveCount===>'+draftInvoiveCount);

        // Query count for Issued Invoice
        Integer issuedInvoiveCount = [SELECT COUNT() FROM Invoice_Parent__c WHERE Status__c = 'Issued'AND Organization__r.Name =:userRecord.Organization_Name__c];
        InvoiceCounts.put('issuedInvoice', issuedInvoiveCount);
        system.debug('issuedInvoiveCount===>'+issuedInvoiveCount);

        // Query count for Received Invoice
        Integer receivedInvoiveCount = [SELECT COUNT() FROM Invoice_Parent__c WHERE Status__c = 'Received'AND Organization__r.Name =:userRecord.Organization_Name__c];
        InvoiceCounts.put('receivedInvoice', receivedInvoiveCount);
        system.debug('receivedInvoiveCount===>'+receivedInvoiveCount);

        return InvoiceCounts;
    }
}