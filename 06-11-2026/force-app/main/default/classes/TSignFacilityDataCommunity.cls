public with sharing class TSignFacilityDataCommunity {
   // Wrapper for pagination response
    public class FacilityWrapper {
        @AuraEnabled public List<TSign_Facility__c> facilities { get; set; }
        @AuraEnabled public Integer totalRecords { get; set; }
    }

    @AuraEnabled
    public static FacilityWrapper getFacilities(String searchKey, Integer pageSize, Integer pageNumber) {
        FacilityWrapper wrapper = new FacilityWrapper();
        
        // Get current user's Organisation
        User objUser = [SELECT Id, TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgId = objUser.TSign_Org_Id__c;
        
        if(String.isBlank(orgId)) {
            throw new AuraHandledException('No Organisation linked to the current user.');
        }

        // Pagination Math
        Integer offset = (pageNumber - 1) * pageSize;
        String searchString = '%' + String.escapeSingleQuotes(searchKey) + '%';

        // Total Count for Pagination
        wrapper.totalRecords = [SELECT COUNT() FROM TSign_Facility__c WHERE TSign_Organisation__c = :orgId AND Name LIKE :searchString];

        // Fetch Records (Assuming you have these fields. Adjust API names if necessary)
        // Note: To get Location and Contact Email, you might need relationship queries if they are lookups.
        String query = 'SELECT Id, Name, TSign_Organisation__c, CreatedDate, Email__c, Address__c,Phone__c ' +
                       'FROM TSign_Facility__c ' +
                       'WHERE TSign_Organisation__c = :orgId AND Name LIKE :searchString ' +
                       'ORDER BY CreatedDate DESC LIMIT :pageSize OFFSET :offset';
                       
        wrapper.facilities = Database.query(query);
        return wrapper;
    }

            
        @AuraEnabled
        public static void saveFacility(
            TSign_Facility__c facility,
            String orgId
        ) {
            try {
                if (facility == null || String.isBlank(facility.Name)) {
                    throw new AuraHandledException(
                        'Facility Name is required.'
                    );
                }

                // Get the organisation linked to the logged-in user.
                User currentUser = [
                    SELECT TSign_Org_Id__c
                    FROM User
                    WHERE Id = :UserInfo.getUserId()
                    LIMIT 1
                ];

                String userOrgId = currentUser.TSign_Org_Id__c;

                if (String.isBlank(userOrgId)) {
                    throw new AuraHandledException(
                        'No Organisation linked to the current user.'
                    );
                }

                if (facility.Id == null) {
                    // Create facility.
                    facility.TSign_Organisation__c = userOrgId;
                    facility.Active__c =true;
                    insert facility;

                } else {
                    // Verify the facility belongs to the user's organisation.
                    List<TSign_Facility__c> existingFacilities = [
                        SELECT Id, TSign_Organisation__c
                        FROM TSign_Facility__c
                        WHERE Id = :facility.Id
                        AND TSign_Organisation__c = :userOrgId
                        LIMIT 1
                    ];

                    if (existingFacilities.isEmpty()) {
                        throw new AuraHandledException(
                            'Facility not found or access denied.'
                        );
                    }

                    // Update facility, including address components.
                    facility.TSign_Organisation__c = userOrgId;
                    update facility;
                }

            } catch (AuraHandledException e) {
                throw e;

            } catch (DmlException e) {
                throw new AuraHandledException(
                    'Save Failed: ' + e.getDmlMessage(0)
                );

            } catch (Exception e) {
                throw new AuraHandledException(
                    'Error: ' + e.getMessage()
                );
            }
        }

    // Uncomment and use this if you haven't already
   /*  @AuraEnabled
    public static void deleteFacility(Id facilityId) {
        Integer staffCount = [SELECT COUNT() FROM TSign_Staff__c WHERE TSign_Facility__c = :facilityId];
        if (staffCount > 0) {
            throw new AuraHandledException('Cannot delete. There are ' + staffCount + ' staff members assigned to this facility.');
        }
        delete [SELECT Id FROM TSign_Facility__c WHERE Id = :facilityId LIMIT 1];
    } */
}