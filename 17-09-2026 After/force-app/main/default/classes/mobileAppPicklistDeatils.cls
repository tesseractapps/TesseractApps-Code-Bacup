@RestResource(urlMapping='/AttachmentPicklistTypes/*')
global class mobileAppPicklistDeatils {
    
    @HttpGet
    global static List<String> getPicklistValues() {
        // Describe the field and get its picklist values
        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get('Attachment__c');
        Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
        Schema.DescribeFieldResult fieldResult = describeResult.fields.getMap().get('Type__c').getDescribe();
        
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
        List<String> picklistValues = new List<String>();
        
        // Add each picklist value to the list
        for (Schema.PicklistEntry entry : picklistEntries) {
            picklistValues.add(entry.getLabel());
        }
        system.debug('picklist values '+picklistValues);
        return picklistValues;
    }
  /*   @HttpPost 
    global static string deleteRepositoryPost(){
         RestRequest req = RestContext.request;
        string jsonString = req.requestBody.toString();
         Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(jsonString);
        string attachmentId=(String) data.get('recordID');
        string attachresult=ClientAttachmentHandler.deleteRepository(attachmentId);
        return attachresult;
    }*/
    
    @HttpPost 
global static String deleteRepositoryPost() {

    try {
 
        RestRequest req = RestContext.request;

        String jsonString = req.requestBody.toString();

        Map<String, Object> data =
            (Map<String, Object>)
            JSON.deserializeUntyped(jsonString);

        String attachmentId =
            (String) data.get('recordID');

        String attachresult =
            ClientAttachmentHandler.deleteRepository(
                attachmentId
            );

        return attachresult;

    } catch (Exception ex) {

        System.debug(
            'Delete Attachment Error => ' +
            ex.getMessage()
        );
    
        // ✅ No Access Error
        if (
            ex.getMessage() != null &&
            ex.getMessage().contains(
                'INSUFFICIENT_ACCESS_OR_READONLY'
            )
        ) {
    
            return 'You are not the owner of this attachment or do not have sufficient access to delete it.';
        }
    
        // ✅ Generic Error
        return ex.getMessage();
    }
}

}