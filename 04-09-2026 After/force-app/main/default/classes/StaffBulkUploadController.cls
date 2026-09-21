public class StaffBulkUploadController {

    /* @AuraEnabled 
    public static Map<String, Object> createStaff(List<Map<String, String>> records) {

        System.debug('⚙️ Incoming records: ' + records);

        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successRecords = new List<Map<String, String>>();
        List<Map<String, String>> failedRecords = new List<Map<String, String>>();

        try {

            // 🧭 Current user and Org
            User currentUser = [
                SELECT Id, Organization_Name__c 
                FROM User 
                WHERE Id = :UserInfo.getUserId() LIMIT 1
            ];

            Organisation__c org = [
                SELECT Id, Type_of_User__c 
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c LIMIT 1
            ];

            // 🧭 Fetch all Facilities first
            Set<String> facilityNames = new Set<String>();

            for (Map<String, String> rec : records) {
                if (rec.containsKey('Facility') && String.isNotBlank(rec.get('Facility'))) {
                    facilityNames.add(rec.get('Facility'));
                }
            }

            Map<String, Id> facilityNameToId = new Map<String, Id>();

            for (Facility__c f : [
                SELECT Id, Name FROM Facility__c WHERE Name IN :facilityNames
            ]) {
                facilityNameToId.put(f.Name, f.Id);
            }

            // 🧩 PROCESS EACH RECORD INDIVIDUALLY — NO BULK INSERT
            for (Map<String, String> record : records) {
                try {

                    // Validate Facility
                    String facilityName = record.get('Facility');

                    if (String.isBlank(facilityName)) {
                        record.put('ErrorMessage', 'Facility is required but was not provided.');
                        failedRecords.add(record);
                        continue;
                    }

                    Id facilityId = facilityNameToId.get(facilityName);

                    if (facilityId == null) {
                        record.put('ErrorMessage', 'Facility "' + facilityName + '" was not found.');
                        failedRecords.add(record);
                        continue;
                    }

                    // State Code processing
                    String inputState = record.get('AddressState');
                    String stateCode;

                    if (inputState != null) {
                        inputState = inputState.toLowerCase();

                        if (inputState.contains('new south wales') || inputState.contains('nsw')) stateCode = 'NSW';
                        else if (inputState.contains('victoria') || inputState.contains('vic')) stateCode = 'VIC';
                        else if (inputState.contains('queensland') || inputState.contains('qld')) stateCode = 'QLD';
                        else if (inputState.contains('western') || inputState.contains('wa')) stateCode = 'WA';
                        else if (inputState.contains('south australia') || inputState.contains('sa')) stateCode = 'SA';
                        else if (inputState.contains('tasmania') || inputState.contains('tas')) stateCode = 'TAS';
                        else if (inputState.contains('capital') || inputState.contains('act')) stateCode = 'ACT';
                        else if (inputState.contains('northern') || inputState.contains('nt')) stateCode = 'NT';
                        else stateCode = inputState;
                    }

                    // Convert status to boolean
                    Boolean status =
                        record.get('Status') == 'Active' ||
                        record.get('Status') == 'true' ||
                        record.get('Status') == 'Yes';

                    // Create staff record
                    Staff__c staff = new Staff__c();

                    staff.Type_of_User__c       = org.Type_of_User__c;
                    staff.Name                  = record.get('FirstName');
                    staff.Last_Name__c          = record.get('LastName');
                    staff.Gender__c             = record.get('Gender');
                    staff.Email_Address__c      = record.get('EmailAddress');
                    staff.Status__c             = status;
                    staff.Contact_Number__c     = record.get('PhoneNumber');
                    staff.Facility__c           = facilityId;
                    staff.Working_Hours_Rate__c = parseDecimal(record.get('HourlyRate'));
                    staff.TFN_number__c         = record.get('TaxFileNumber');
                    staff.Tax_free_threshold__c = record.get('TaxFreeThreshold');
                    staff.Emp_Start_Date__c     = parseDDMMYYYY(record.get('StartDate'));
                    staff.Date_Of_Birth__c      = parseDDMMYYYY(record.get('DateofBirth'));
                    staff.Address__Street__s    = record.get('AddressStreet');
                    staff.Address__City__s      = record.get('AddressCity');
                    staff.Address__StateCode__s = stateCode;
                    staff.Address__PostalCode__s = record.get('AdressPostCode');
                    staff.Address__CountryCode__s = 'AU';
                    staff.Nationality__c        = record.get('Nationality');
                    staff.Languages__c          = record.get('Languages');
                    staff.Employment_type__c    = record.get('Frequency');
                    staff.Management_Fee__c     = parseDecimal(record.get('ManagementFee'));
                    staff.ABN_Number__c         = record.get('AustralianBusinessNumber');

                    // 🚀 Insert THIS RECORD ONLY
                    insert staff;

                    // Success response
                    successRecords.add(new Map<String, String>{
                        'EmailAddress' => record.get('EmailAddress'),
                        'Status'       => 'Success',
                        'StaffId'      => staff.Id
                    });

                } catch (Exception e) {

                    // Failure response for THIS record
                    record.put('ErrorMessage', e.getMessage());
                    record.put('Status', 'Failed');
                    failedRecords.add(record);
                }
            }

            // Final response
            response.put('successRecords', successRecords);
            response.put('failedRecords', failedRecords);

        } catch (Exception e) {
            response.put('error', e.getMessage());
        }

        return response;
    } */

    @AuraEnabled 
    public static Map<String, Object> createStaff(List<Map<String, String>> records) {
        
        System.debug('⚙️ Incoming records: ' + records);
        
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successRecords = new List<Map<String, String>>();
        List<Map<String, String>> failedRecords = new List<Map<String, String>>();
        
        // Maps for tracking relationships
        Map<String, Map<String, String>> emailToRecordMap = new Map<String, Map<String, String>>();
        Map<String, String> emailToFacilityNameMap = new Map<String, String>();
        Map<String, Staff__c> emailToStaffMap = new Map<String, Staff__c>();
        Map<String, Id> emailToStaffIdMap = new Map<String, Id>();
        
        try {
            // 🧭 Current user and Org
            User currentUser = [
                SELECT Id, Organization_Name__c 
                FROM User 
                WHERE Id = :UserInfo.getUserId() LIMIT 1
            ];
            
            Organisation__c org = [
                SELECT Id, Type_of_User__c 
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c LIMIT 1
            ];
            
            // 🧭 Collect all facility names from records
            Set<String> facilityNames = new Set<String>();
            
            for (Map<String, String> rec : records) {
                String email = rec.get('EmailAddress');
                String facilityName = rec.get('Facility');
                
                emailToRecordMap.put(email, rec);
                
                if (String.isNotBlank(facilityName)) {
                    facilityNames.add(facilityName);
                    emailToFacilityNameMap.put(email, facilityName);
                }
            }
            
            // 🧭 Fetch all Facilities in bulk
            Map<String, Id> facilityNameToId = new Map<String, Id>();
            
            if (!facilityNames.isEmpty()) {
                for (Facility__c f : [
                    SELECT Id, Name FROM Facility__c WHERE Name IN :facilityNames
                ]) {
                    facilityNameToId.put(f.Name, f.Id);
                }
            }
            
            // 🧩 Prepare Staff records for bulk insert
            List<Staff__c> staffToInsert = new List<Staff__c>();
            
            for (String email : emailToRecordMap.keySet()) {
                Map<String, String> record = emailToRecordMap.get(email);
                
                try {
                    // Validate Facility
                    String facilityName = emailToFacilityNameMap.get(email);
                    
                    if (String.isBlank(facilityName)) {record.put('ErrorMessage', 'Facility is required but was not provided.');failedRecords.add(record); continue;
                    }
                    
                    Id facilityId = facilityNameToId.get(facilityName);
                    
                    if (facilityId == null) {record.put('ErrorMessage', 'Facility "' + facilityName + '" was not found.');failedRecords.add(record);continue;
                    }
                    
                    // State Code processing
                    String inputState = record.get('AddressState');
                    String stateCode;
                    
                    if (inputState != null) {
                        inputState = inputState.toLowerCase();
                        
                        if (inputState.contains('new south wales') || inputState.contains('nsw')) stateCode = 'NSW';else if (inputState.contains('victoria') || inputState.contains('vic')) stateCode = 'VIC';else if (inputState.contains('queensland') || inputState.contains('qld')) stateCode = 'QLD';else if (inputState.contains('western') || inputState.contains('wa')) stateCode = 'WA';else if (inputState.contains('south australia') || inputState.contains('sa')) stateCode = 'SA';else if (inputState.contains('tasmania') || inputState.contains('tas')) stateCode = 'TAS';else if (inputState.contains('capital') || inputState.contains('act')) stateCode = 'ACT';else if (inputState.contains('northern') || inputState.contains('nt')) stateCode = 'NT';else stateCode = inputState;
                    }
                    
                    // Convert status to boolean
                    Boolean status =
                        record.get('Status') == 'Active' || record.get('Status') == 'true' || record.get('Status') == 'Yes';
                    
                    // Create staff record
                    Staff__c staff = new Staff__c();
                    
                    staff.Type_of_User__c       = org.Type_of_User__c;
                    staff.Name                  = record.get('FirstName');
                    staff.Last_Name__c          = record.get('LastName');
                    staff.Gender__c             = record.get('Gender');
                    staff.Email_Address__c      = email;
                    staff.Status__c             = status;
                    staff.Contact_Number__c     = record.get('PhoneNumber');
                    staff.Facility__c           = facilityId;
                    staff.Working_Hours_Rate__c = parseDecimal(record.get('HourlyRate'));
                    staff.TFN_number__c         = record.get('TaxFileNumber');
                    staff.Tax_free_threshold__c = record.get('TaxFreeThreshold');
                    staff.Emp_Start_Date__c     = parseDDMMYYYY(record.get('StartDate'));
                    staff.Date_Of_Birth__c      = parseDDMMYYYY(record.get('DateofBirth'));
                    staff.Address__Street__s    = record.get('AddressStreet');
                    staff.Address__City__s      = record.get('AddressCity');
                    staff.Address__StateCode__s = stateCode;
                    staff.Address__PostalCode__s = record.get('AdressPostCode'); // Fixed typo
                    staff.Address__CountryCode__s = 'AU';
                    staff.Nationality__c        = record.get('Nationality');
                    staff.Languages__c          = record.get('Languages');
                    staff.Employment_type__c    = record.get('Frequency');
                    staff.Management_Fee__c     = parseDecimal(record.get('ManagementFee'));
                    staff.ABN_Number__c         = record.get('AustralianBusinessNumber');
                    
                    staffToInsert.add(staff);
                    emailToStaffMap.put(email, staff);} catch (Exception e) {record.put('ErrorMessage', 'Record preparation failed: ' + e.getMessage());record.put('Status', 'Failed');
                    failedRecords.add(record);
                }
            }
            
            // 🚀 Bulk insert Staff records
            if (!staffToInsert.isEmpty()) {
                Database.SaveResult[] srList = Database.insert(staffToInsert, false);
                
                // Process insertion results
                for (Integer i = 0; i < srList.size(); i++) {
                    Database.SaveResult sr = srList[i];
                    Staff__c staff = staffToInsert[i];
                    String email = staff.Email_Address__c;
                    Map<String, String> record = emailToRecordMap.get(email);
                    
                    if (sr.isSuccess()) {emailToStaffIdMap.put(email, sr.getId());
                    } else {
                        // Failure
                        String errorMsg = 'Staff insert failed: ';
                        for (Database.Error err : sr.getErrors()) {
                            errorMsg += err.getMessage() + ' ';
                        }
                        record.put('ErrorMessage', errorMsg.trim());
                        record.put('Status', 'Failed');
                        failedRecords.add(record);
                        
                        // Remove from maps since it failed
                        emailToStaffMap.remove(email);
                    }
                }
            }
            
            // ✅ Bulk create Staff_Facility__c junction records
            List<Staff_Facility__c> staffFacilitiesToInsert = new List<Staff_Facility__c>();
            
            for (String email : emailToStaffMap.keySet()) {Id staffId = emailToStaffIdMap.get(email);Staff__c staff = emailToStaffMap.get(email);
                
                if (staffId != null && staff.Facility__c != null) {
                    staffFacilitiesToInsert.add(new Staff_Facility__c(
                        Staff__c    = staffId,
                        Facility__c = staff.Facility__c,
                        Active__c   = true
                    ));
                }
            }
            
            // Bulk insert Staff_Facility records
            Map<Id, Staff_Facility__c> insertedStaffFacilities = new Map<Id, Staff_Facility__c>();
            
            if (!staffFacilitiesToInsert.isEmpty()) { Database.SaveResult[] sfResults = Database.insert(staffFacilitiesToInsert, false);
                
                // Track which Staff-Facility links succeeded
                for (Integer i = 0; i < sfResults.size(); i++) {
                    Database.SaveResult sr = sfResults[i];
                    Staff_Facility__c sf = staffFacilitiesToInsert[i];
                    
                    if (sr.isSuccess()) {
                        insertedStaffFacilities.put(sf.Staff__c, sf);
                    }
                }
            }
            
            // 🧹 Clean up: Delete Staff records where Staff_Facility creation failed
            Set<Id> staffIdsToDelete = new Set<Id>();
            
            for (String email : emailToStaffIdMap.keySet()) {Id staffId = emailToStaffIdMap.get(email);if (!insertedStaffFacilities.containsKey(staffId)) {staffIdsToDelete.add(staffId);
                    
                    Map<String, String> record = emailToRecordMap.get(email);
                    record.put('ErrorMessage', 'Staff-Facility link creation failed.');
                    record.put('Status', 'Failed');
                    failedRecords.add(record);
                    
                    // Remove from success tracking
                    emailToStaffIdMap.remove(email);
                }
            }
            
            // Delete orphaned Staff records
            if (!staffIdsToDelete.isEmpty()) { List<Staff__c> staffToDelete = [SELECT Id FROM Staff__c WHERE Id IN :staffIdsToDelete]; if (!staffToDelete.isEmpty()) {Database.delete(staffToDelete, false);
                }
            }
            
            // 🎯 Prepare success records
            for (String email : emailToStaffIdMap.keySet()) {Id staffId = emailToStaffIdMap.get(email);
                
                if (insertedStaffFacilities.containsKey(staffId)) {
                    successRecords.add(new Map<String, String>{
                        'EmailAddress'    => email,
                        'Status'          => 'Success',
                        'StaffId'         => staffId,
                        'StaffFacilityId' => insertedStaffFacilities.get(staffId).Id
                    });
                }
            }
            
            // Final response
            response.put('successRecords', successRecords);
            response.put('failedRecords', failedRecords);
            
        } catch (Exception e) {
            // Catch any unexpected exceptions
            response.put('error', 'Unexpected error: ' + e.getMessage() + ' at line ' + e.getLineNumber());
            System.debug('❌ Unexpected error: ' + e.getStackTraceString());
        }
        
        return response;
    }

    // Convert dd/MM/yyyy → Date
    public static Date parseDDMMYYYY(String input) {
        if (String.isBlank(input)) return null;
        try {
            List<String> p = input.split('/');
            return Date.newInstance(Integer.valueOf(p[2]), Integer.valueOf(p[1]), Integer.valueOf(p[0]));
        } catch (Exception e) {
            return null;
        }
    }

    private static Decimal parseDecimal(String val) {
        if (String.isBlank(val)) return null;
        try {
            val = val.replace(',', '');
            return Decimal.valueOf(val);
        } catch (Exception e) {
            return null;
        }
    }
}