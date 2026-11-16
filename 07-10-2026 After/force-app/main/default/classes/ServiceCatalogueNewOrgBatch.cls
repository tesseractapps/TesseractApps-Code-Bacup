/**
* Batch class to update Service Catalogue records with Organization and Type of Industry 
* information from related Facilities. Also creates junction records.
*/
global class ServiceCatalogueNewOrgBatch implements Database.Batchable<sObject>, Database.Stateful {
    
    private Integer totalServiceCatalogues = 0;
    private Integer totalUpdated = 0;
    private Integer totalJunctionRecordsCreated = 0;
    private Integer totalErrors = 0;
    
    /**
     * Start method - Query ALL Service Catalogues that need updating
     */
    global Database.QueryLocator start(Database.BatchableContext bc) {
        System.debug('=== BATCH START ===');
        
        // ✅ Query Service Catalogues that need Organization and Type_of_Industry populated
        String query = 'SELECT Id, Facility__c, Facility__r.Organisation__c, Facility__r.Type_of_Service__c, ' +
                       'Organization__c, Type_of_Industry__c, Financial_Year__c, ' +
                       'NDIS_Support_Catalogue__c, NDIS_Support_Catalogue__r.Financial_Year__c ' +
                       'FROM Service_Catalogue__c ' +
                       'WHERE (Organization__c = null OR Type_of_Industry__c = null) ' +
                       'AND Facility__c != null';
        
        System.debug('Query: ' + query);
        
        // Count total records for tracking
        List<Service_Catalogue__c> countQuery = Database.query(query);
        totalServiceCatalogues = countQuery.size();
        System.debug('Total Service Catalogues to process: ' + totalServiceCatalogues);
        
        return Database.getQueryLocator(query);
    }
    
    /**
     * Execute method - Process each batch of Service Catalogues
     */
    global void execute(Database.BatchableContext bc, List<Service_Catalogue__c> scope) {
        System.debug('=== BATCH EXECUTE - Processing ' + scope.size() + ' Service Catalogues ===');
        
        // Step 1: Collect Facility IDs from scope
        Set<Id> facilityIds = new Set<Id>();
        for(Service_Catalogue__c sc : scope) {
            if(sc.Facility__c != null) {
                facilityIds.add(sc.Facility__c);
            }
        }
        
        // Step 2: Query Facilities for these IDs
        Map<Id, Facility__c> facilityMap = new Map<Id, Facility__c>();
        if(!facilityIds.isEmpty()) {
            for(Facility__c fac : [
                SELECT Id, Organisation__c, Type_of_Service__c
                FROM Facility__c
                WHERE Id IN :facilityIds
            ]) {
                facilityMap.put(fac.Id, fac);
            }
        }
        
        // Step 3: Prepare records for update
        List<Service_Catalogue__c> toUpdate = new List<Service_Catalogue__c>();
        List<Service_Catalogue_Facilty__c> toInsert = new List<Service_Catalogue_Facilty__c>();
        Set<String> existingJunctions = new Set<String>();
        
        // Get existing junction records for this batch
        Set<Id> serviceCatalogueIds = new Map<Id, Service_Catalogue__c>(scope).keySet();
        if(!serviceCatalogueIds.isEmpty()) {
            for(Service_Catalogue_Facilty__c jr : [
                SELECT Service_Catalogue__c, Facility__c
                FROM Service_Catalogue_Facilty__c
              //  WHERE Service_Catalogue__c IN :serviceCatalogueIds
            ]) {
                existingJunctions.add(jr.Service_Catalogue__c + '-' + jr.Facility__c);
            }
        }
        
        // Step 4: Process each Service Catalogue
        for(Service_Catalogue__c sc : scope) {
            Boolean needsUpdate = false;
            
            // Get associated Facility
            Facility__c facility = facilityMap.get(sc.Facility__c);
            if(facility == null) {
                System.debug('⚠️ Facility not found for Service Catalogue: ' + sc.Id);
                continue;
            }
            
            // Update Organization
            if(sc.Organization__c != facility.Organisation__c) {
                sc.Organization__c = facility.Organisation__c;
                needsUpdate = true;
            }
            
            // Update Type of Industry
            if(sc.Type_of_Industry__c != facility.Type_of_Service__c) {
                sc.Type_of_Industry__c = facility.Type_of_Service__c;
                needsUpdate = true;
            }
            
            // Update Financial Year from NDIS
            if(sc.NDIS_Support_Catalogue__r != null && 
               sc.NDIS_Support_Catalogue__r.Financial_Year__c != null &&
               sc.Financial_Year__c != sc.NDIS_Support_Catalogue__r.Financial_Year__c) {
                sc.Financial_Year__c = sc.NDIS_Support_Catalogue__r.Financial_Year__c;
                needsUpdate = true;
            }
            
            if(needsUpdate) {
                toUpdate.add(sc);
            }
            
            // Create Junction Record if doesn't exist
            String key = sc.Id + '-' + sc.Facility__c;
            if(!existingJunctions.contains(key)) {
                toInsert.add(new Service_Catalogue_Facilty__c(
                    Service_Catalogue__c = sc.Id,
                    Facility__c = sc.Facility__c,
                    Active__c = true
                ));
            }
        }
        
        // Step 5: Perform DML Operations with partial success
        if(!toUpdate.isEmpty()) {
            try {
                List<Database.SaveResult> results = Database.update(toUpdate, false);
                Integer successCount = 0;
                for(Database.SaveResult result : results) {
                    if(result.isSuccess()) {
                        successCount++;
                    } else {
                        totalErrors++;
                        for(Database.Error err : result.getErrors()) {
                            System.debug('Error: ' + err.getMessage());
                        }
                    }
                }
                totalUpdated += successCount;
                System.debug('✅ Updated: ' + successCount + ' Service Catalogues');
            } catch(Exception e) {
                System.debug('❌ Error updating Service Catalogues: ' + e.getMessage());
                totalErrors += toUpdate.size();
            }
        }
        
        if(!toInsert.isEmpty()) {
            try {
                List<Database.SaveResult> results = Database.insert(toInsert, false);
                Integer successCount = 0;
                for(Database.SaveResult result : results) {
                    if(result.isSuccess()) {
                        successCount++;
                    } else {
                        totalErrors++;
                        for(Database.Error err : result.getErrors()) {
                            System.debug('Error: ' + err.getMessage());
                        }
                    }
                }
                totalJunctionRecordsCreated += successCount;
                System.debug('✅ Inserted: ' + successCount + ' Junction Records');
            } catch(Exception e) {
                System.debug('❌ Error inserting Junction Records: ' + e.getMessage());
                totalErrors += toInsert.size();
            }
        }
        
        System.debug('=== BATCH EXECUTE COMPLETED ===');
        System.debug('Updated: ' + toUpdate.size() + ', Inserted: ' + toInsert.size());
    }
    
    /**
     * Finish method - Called after all batches are processed
     */
    global void finish(Database.BatchableContext bc) {
        System.debug('=== BATCH FINISH ===');
        System.debug('--- Summary Statistics ---');
        System.debug('Total Service Catalogues Processed: ' + totalServiceCatalogues);
        System.debug('Total Updated: ' + totalUpdated);
        System.debug('Total Junction Records Created: ' + totalJunctionRecordsCreated);
        System.debug('Total Errors: ' + totalErrors);
        System.debug('--- End of Summary ---');
        
        // Send email notification
        sendCompletionEmail();
        
        System.debug('=== BATCH COMPLETED ===');
    }
    
    private void sendCompletionEmail() {
        try {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { UserInfo.getUserEmail() });
            mail.setSubject('Service Catalogue Batch Job Completed');
            
            String body = 'Batch Job Summary:\n\n' +
                          'Total Service Catalogues Processed: ' + totalServiceCatalogues + '\n' +
                          'Total Updated: ' + totalUpdated + '\n' +
                          'Total Junction Records Created: ' + totalJunctionRecordsCreated + '\n' +
                          'Total Errors: ' + totalErrors + '\n\n' +
                          'Batch execution completed.';
            
            mail.setPlainTextBody(body);
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
        } catch(Exception e) {
            System.debug('Error sending email: ' + e.getMessage());
        }
    }
}