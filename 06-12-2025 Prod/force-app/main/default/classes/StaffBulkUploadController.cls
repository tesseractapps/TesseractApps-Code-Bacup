public class StaffBulkUploadController {
    @AuraEnabled 
    public static Map<String, Object> createStaff(List<Map<String, String>> records) {
        System.debug('⚙️ Incoming records: ' + records);
        
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successRecords = new List<Map<String, String>>();
        List<Map<String, String>> failedRecords = new List<Map<String, String>>();
        
        try {
            // 🧭 Current User and Org
            User currentUser = [
                SELECT Id, Organization_Name__c 
                FROM User 
                WHERE Id = :UserInfo.getUserId() 
                LIMIT 1
            ];

            Organisation__c org = [
                SELECT Id, Type_of_User__c
                FROM Organisation__c 
                WHERE Name = :currentUser.Organization_Name__c 
                LIMIT 1
            ];

            Account portalAccount = [
                SELECT Id, Name 
                FROM Account 
                WHERE Name = 'Portal Account' 
                LIMIT 1
            ];

            // 🧭 Pre-fetch all Facilities to avoid SOQL inside loop
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

            // 🧩 Lists to insert
            List<Staff__c> staffToInsert = new List<Staff__c>();
            List<Map<String, String>> pendingRecords = new List<Map<String, String>>(); // Track records to insert
            // 🧮 Process each record
            for (Integer i = 0; i < records.size(); i++) {
                Map<String, String> record = records[i];
                try {
                    Staff__c staff = new Staff__c();                    

                    // ✅ Facility validation
                    String facilityName = record.get('Facility');
                    if (String.isBlank(facilityName)) {record.put('ErrorMessage', 'Facility is required but was not provided.');failedRecords.add(record);continue;
                    }

                    Id facilityId = facilityNameToId.get(facilityName);
                    if (facilityId == null) {record.put('ErrorMessage', 'Facility "' + facilityName + '" was not found in the system.');failedRecords.add(record);continue;
                    }
                    String inputState = record.get('AddressState');
                    String stateCode;
                    if (inputState != null) {
                        inputState = inputState.toLowerCase();
                    }

                    if (String.isNotBlank(inputState)) {
                            if (inputState.contains('new south wales') || inputState.contains('nsw')) {
                                stateCode = 'NSW';
                            } else if (inputState.contains('victoria') || inputState.contains('vic')) {
                                stateCode = 'VIC';
                            } else if (inputState.contains('queensland') || inputState.contains('qld')) {
                                stateCode = 'QLD';
                            } else if (inputState.contains('western') || inputState.contains('wa')) {
                                stateCode = 'WA';
                            } else if (inputState.contains('south australia') || inputState.contains('sa')) {
                                stateCode = 'SA';
                            } else if (inputState.contains('tasmania') || inputState.contains('tas')) {
                                stateCode = 'TAS';
                            } else if (inputState.contains('australian capital') || inputState.contains('act')) {
                                stateCode = 'ACT';
                            } else if (inputState.contains('northern') || inputState.contains('nt')) {
                                stateCode = 'NT';
                            } else {
                                stateCode = inputState; // fallback to raw input if no match
                            }
                        // System.debug('inputState111 >>'+ inputState);
                        }

                    Boolean status = record.get('Status') == 'Active' || record.get('Status') == 'true' || record.get('Status') == 'Yes';

                    staff.Type_of_User__c = org.Type_of_User__c;
                    staff.Name = record.get('FirstName');
                    staff.Last_Name__c = record.get('LastName');
                    staff.Gender__c = record.get('Gender');
                    staff.Email_Address__c = record.get('EmailAddress');
                    staff.Status__c = status;
                    staff.Contact_Number__c = record.get('PhoneNumber');
                    staff.Facility__c = facilityId;
                    staff.Working_Hours_Rate__c = parseDecimal(record.get('HourlyRate'));
                    staff.TFN_number__c = record.get('TaxFileNumber');
                    staff.Tax_free_threshold__c = record.get('TaxFreeThreshold');
                    staff.Emp_Start_Date__c = parseDDMMYYYY(record.get('StartDate'));
                    staff.Date_Of_Birth__c = parseDDMMYYYY(record.get('DateofBirth'));
                    staff.Address__Street__s = record.get('AddressStreet');
                    staff.Address__City__s = record.get('AddressCity');
                    staff.Address__StateCode__s = stateCode;
                    staff.Address__PostalCode__s = record.get('AdressPostCode');
                    staff.Address__CountryCode__s = 'AU';
                    staff.Nationality__c = record.get('Nationality');
                    staff.Languages__c = record.get('Languages');
                    staff.Employment_type__c = record.get('Frequency');
                    staff.Management_Fee__c = parseDecimal(record.get('ManagementFee'));

                    staffToInsert.add(staff);
                    pendingRecords.add(record); // Track this record for insertion

                } catch (Exception e) {
                    record.put('ErrorMessage', e.getMessage());
                    failedRecords.add(record);
                }
            }

            // 🗃️ Insert staff
            if (!staffToInsert.isEmpty()) {
                try {
                    insert staffToInsert;
                    // ✅ Insert successful — mark them as success
                    for (Map<String, String> rec : pendingRecords) {
                        successRecords.add(rec);
                    }
                    System.debug('✅ Inserted staff: ' + staffToInsert.size());
                } catch (DmlException dmle) {
                    System.debug('⚠️ DML Exception: ' + dmle.getMessage());
                    // Each failed record is marked with the same error (bulk DML fail)
                    for (Map<String, String> rec : pendingRecords) {
                        rec.put('ErrorMessage', dmle.getMessage());
                        failedRecords.add(rec);
                    }
                }
            }

            // 🧾 Final response
            response.put('successRecords', successRecords);
            response.put('failedRecords', failedRecords);
        } 
        catch (Exception e) {
            System.debug('🔥 Outer Exception: ' + e.getMessage());
            response.put('error', e.getMessage());
        }

        // ✅ Must always return a Map
        return response;
    }

    // 🧩 Parse date from dd/MM/yyyy
    public static Date parseDDMMYYYY(String input) {
        if (String.isBlank(input)) return null;
        try {
            List<String> parts = input.split('/');
            if (parts.size() == 3) {Integer day = Integer.valueOf(parts[0]);Integer month = Integer.valueOf(parts[1]);Integer year = Integer.valueOf(parts[2]);return Date.newInstance(year, month, day);
            }
        } catch (Exception e) {
            System.debug('⚠️ Invalid date format: ' + input);
        }
        return null;
    }

    // 🧩 Safe decimal parsing
    private static Decimal parseDecimal(String val) {
        if (String.isBlank(val)) return null;
        try {
            val = val.replace(',', '');
            return Decimal.valueOf(val);
        } catch (Exception e) {
            System.debug('⚠️ Invalid decimal: ' + val);
            return null;
        }
    }
}