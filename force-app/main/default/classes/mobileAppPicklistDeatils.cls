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
     @HttpPost 
    global static string deleteRepositoryPost(){
         RestRequest req = RestContext.request;
        string jsonString = req.requestBody.toString();
         Map<String, Object> data = (Map<String, Object>) JSON.deserializeUntyped(jsonString);
        string attachmentId=(String) data.get('recordID');
        string attachresult=ClientAttachmentHandler.deleteRepository(attachmentId);
        return attachresult;
    }

}