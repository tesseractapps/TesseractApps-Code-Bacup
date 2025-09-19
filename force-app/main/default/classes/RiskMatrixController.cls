public with sharing class RiskMatrixController {
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getRiskMatrix() {
        Map<String, String> riskMatrixMap = new Map<String, String>();
        
        // Query the Risk Matrix Metadata
        List<Risk_Matrix__mdt> riskMatrixRecords = [SELECT Likelihood__c, Consequence__c, Risk_Rating__c FROM Risk_Matrix__mdt];
        
        for (Risk_Matrix__mdt record : riskMatrixRecords) {
            String key = record.Likelihood__c + '_' + record.Consequence__c;
            riskMatrixMap.put(key, record.Risk_Rating__c);
        }
        
        return riskMatrixMap;
    }
    
    @AuraEnabled
    public static List<Risk_Management__c> insertRiskRecords(String riskRecordsJson) {
        try {
            // Deserialize the JSON string into a List of RiskWrapper objects
            List<RiskWrapper> riskRecords = (List<RiskWrapper>) JSON.deserialize(riskRecordsJson, List<RiskWrapper>.class);
            List<Risk_Management__c> recordsToUpsert = new List<Risk_Management__c>();
            
            for (RiskWrapper risk : riskRecords) {
                recordsToUpsert.add(new Risk_Management__c(
                    Id = risk.Id,  // If present, it updates the record; otherwise, it inserts a new one
                    Area__c = risk.area,
                    Category__c = risk.category,
                    Impact_on_Whom__c = risk.impact,
                    Likelihood__c = risk.likelihood,
                    Consequences__c = risk.consequences,
                    Risk_Index__c = risk.riskRating,
                    Risk_Strategy__c = risk.strategy,
                    Person_Responsible__c = risk.responsiblePerson,
                    Date_Completed__c = risk.dateCompleted,
                    Participant__c = risk.clientId,
                    UniqueRefId__c =risk.uniqueId,
                     File_Name__c = risk.fileName,
                    Other_Text__c = risk.otherText
                ));
            }
            
            if (!recordsToUpsert.isEmpty()) {
                upsert recordsToUpsert;
                System.debug('Upserted Records: ' + recordsToUpsert);
                return recordsToUpsert;
            } else {
                // Ensure we always return a List<Risk_Management__c>
                return new List<Risk_Management__c>(); // Return an empty list if no records were upserted
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error upserting records: ' + e.getMessage());
        }
    }

    // Updated Wrapper Class
    public class RiskWrapper {
        @AuraEnabled public Id Id;  // Added Id field for updates
        @AuraEnabled public String area;
        @AuraEnabled public String category;
        @AuraEnabled public String impact;
        @AuraEnabled public String likelihood;
        @AuraEnabled public String consequences;
        @AuraEnabled public String riskRating;
        @AuraEnabled public String strategy;
        @AuraEnabled public String responsiblePerson;
        @AuraEnabled public Date dateCompleted;
        @AuraEnabled public Id clientId;
        @AuraEnabled public String uniqueId;
        @AuraEnabled public String fileName;
        @AuraEnabled public String otherText;
    }

    
    @AuraEnabled(cacheable=true)
    public static List<Risk_Management__c> getRiskRecords(String clientId) {
        System.debug('Client Id : '+clientId);
        return [SELECT Id,Participant__c, Area__c,Category__c,Risk_Index__c,Date_Completed__c,Person_Responsible__c,Risk_Strategy__c,Consequences__c,Likelihood__c,Impact_on_Whom__c,Amazon_URL__c,UniqueRefId__c,File_Name__c,Other_Text__c FROM Risk_Management__c where Participant__c =:clientId ORDER BY CreatedDate DESC];
    }
    
}