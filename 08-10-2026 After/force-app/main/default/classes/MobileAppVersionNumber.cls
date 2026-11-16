@RestResource(urlMapping='/versionNumber/*')
global with sharing class MobileAppVersionNumber {
    
    @HttpGet
    global static void getversionNumber(){
        
        List<Mobile_App_Version__mdt> versionRecords = [
            SELECT Mobile_Type__c, Version_Number__c
            FROM Mobile_App_Version__mdt
        ];
        
        Map<String, Decimal> versionMap = new Map<String, Decimal>();
        for (Mobile_App_Version__mdt record : versionRecords) {
            versionMap.put(record.Mobile_Type__c, record.Version_Number__c);
        }
        
        // Serialize to JSON
        String jsonResponse = JSON.serialize(versionMap);
        
        // Send response
        RestResponse response = RestContext.response;
        response.addHeader('Content-Type', 'application/json');
        response.responseBody = Blob.valueOf(jsonResponse);
        response.statusCode = 200;
    }
}