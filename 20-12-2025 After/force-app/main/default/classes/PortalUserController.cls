public with sharing class PortalUserController {
    
    @AuraEnabled
    public static Map<String, Object> createPortalUser(Map<String, Object> userDetails) {
        System.debug('userDetails====>' + userDetails);
        
        // Extract user details from the map
        String firstName = (String) userDetails.get('firstName');
        String lastName = (String) userDetails.get('lastName');
        String email = (String) userDetails.get('email');
        String role = (String) userDetails.get('role');
        String userType = (String) userDetails.get('userType');
        Boolean isActive = (Boolean) userDetails.get('isActive');
        String facility = (String) userDetails.get('facility');
        String dateOfBirthString = (String) userDetails.get('dateOfBirth');
        Date dateOfBirth = Date.valueOf(dateOfBirthString);
        String phoneNumberString = (String) userDetails.get('phoneNumber');
        String numericPhoneNumber = phoneNumberString.replaceAll('[^0-9]', '');
        String hourlyRateString = (String) userDetails.get('hourlyRate');
        Decimal hourlyRate;
        if (!String.isBlank(hourlyRateString)) {
            try {
                hourlyRate = Decimal.valueOf(hourlyRateString);
            } catch (Exception e) {
                System.debug('❌ Invalid hourlyRate value: ' + hourlyRateString);
            }
        } else {
            hourlyRate = null; // or your default logic
        }
        String startDateString = (String) userDetails.get('startDate');
        Date startDate = Date.valueOf(startDateString);
        String abnValueString = (String) userDetails.get('abn');
        String taxFileNumberString = (String) userDetails.get('taxFileNumber');
        Id currentUserId = (Id) userDetails.get('currentuserId');
        String selectedTaxFree = (String) userDetails.get('selectedTaxFree');
        String street = (String) userDetails.get('street');
        String city = (String) userDetails.get('City');
        String state = (String) userDetails.get('State');
        String country = (String) userDetails.get('Country');
        String postalCode = (String) userDetails.get('PostalCode');
        String selectedGender = (String) userDetails.get('selectedGender');
        String ManagementFee = (String) userDetails.get('managementFee');
        String EmploymentType= (String) userDetails.get('frequencyValue');
        //String Languages = (String) userDetails.get('selectedLanguagesString');
        /* String Languages = '';
        if (userDetails.containsKey('selectedLanguagesString') && userDetails.get('selectedLanguagesString') != null) {
            languages = (String) userDetails.get('selectedLanguagesString');
        }
        
        //String Nationality = (String) userDetails.get('nationalitiesValues');
        String Nationality = '';
        if (userDetails.containsKey('nationalitiesValues') && userDetails.get('nationalitiesValues') != null) {
            nationality = (String) userDetails.get('nationalitiesValues');
        } */

        
        // Retrieve the Organization Name from the current User
        List<User> userOrgName = [SELECT Id, Organization_Name__c, TimeZoneSidKey, LocaleSidKey, EmailEncodingKey, LanguageLocaleKey 
                                  FROM User WHERE Id = :currentUserId LIMIT 1];
        system.debug('userOrgName===>'+userOrgName);
        
        List<Organisation__c> organisationList = [SELECT Id, Name, Type_of_User__c FROM Organisation__c WHERE Name = :userOrgName[0].Organization_Name__c];
        system.debug('organisationList===>'+organisationList);
        
        List<Contact> contEmail = [SELECT Id, Email FROM Contact WHERE Email = :email LIMIT 1];
        system.debug('contEmail===>'+contEmail);
        
        List<Account> accId = [SELECT Id, Name From Account Where Name ='Portal Account'];
        
        // Return a map with relevant data for JavaScript
        Map<String, Object> result = new Map<String, Object>();
        
        Staff__c newStaff = null; // Declare the Staff record here to make it accessible after the block
        
        if (contEmail.isEmpty()) {
            system.debug(contEmail.isEmpty());
            
            // Create the Contact linked to the Account
            Contact contact = new Contact(
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                AccountId = accId[0].Id,
                MailingStreet = street,
                MailingCity  = city,
                MailingState = state,
                MailingPostalCode = postalCode,
                MailingCountry  = country,
                Portal_User_Created__c = true
            );
            insert contact;
            system.debug('contact===>'+contact.Id);
            
            
            // Create Staff record
            newStaff = new Staff__c(
                Name = firstName,
                Last_Name__c = lastName,
                Gender__c = selectedGender,
                Contact_Number__c = numericPhoneNumber,
                Date_Of_Birth__c = dateOfBirth,
                Email_Address__c = email,
                Facility__c = facility,
                Address__City__s = city,
                Address__StateCode__s = state,
                Address__Street__s = street,
                Address__PostalCode__s = postalCode,
                Address__CountryCode__s = 'AU',
                Working_Hours_Rate__c = hourlyRate,
                Emp_Start_Date__c = startDate,
                Type_of_User__c = organisationList[0].Type_of_User__c,
                Status__c = isActive,
                TimeZoneSidKey__c = userOrgName[0].TimeZoneSidKey,
                LocaleSidKey__c = userOrgName[0].LocaleSidKey,
                EmailEncodingKey__c = userOrgName[0].EmailEncodingKey,
                LanguageLocaleKey__c = userOrgName[0].LanguageLocaleKey,
                User_Role__c = role,
                User_Type__c = userType,
                Management_Fee__c = Decimal.valueOf(ManagementFee),
                //Languages__c = Languages,
                Employment_type__c = EmploymentType,
                //Nationality__c = Nationality,
                ABN_Number__c = abnValueString,
                TFN_number__c = taxFileNumberString
            );
            insert newStaff;
            system.debug('newStaff====>' + newStaff);
            
            result.put('StaffId', newStaff.Id);
            result.put('userRole', newStaff.User_Role__c);
            result.put('userType', newStaff.User_Type__c);
            result.put('StaffStatus', newStaff.Status__c);
            if (!Test.isRunningTest()) {
                CreateUsersBatch createUser = new CreateUsersBatch();
                Database.executeBatch(createUser, 1);
            }

            
        } else{
            throw new AuraHandledException('Duplicate Email');
        }
        return result;
    }

    @AuraEnabled
    public static Map<String, Object> createAccountsContactsAndStaff(List<Map<String, String>> records) {
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, String>> successRecords = new List<Map<String, String>>();
        List<Map<String, String>> failedRecords = new List<Map<String, String>>();

        if (records.isEmpty()) return response;

        // Collect unique emails and facility names
        Set<String> emailSet = new Set<String>();
        Set<String> facilityNames = new Set<String>();
        for (Map<String, String> rec : records) {
            emailSet.add(rec.get('EmailAddress'));
            if (rec.containsKey('Facility')) facilityNames.add(rec.get('Facility'));
        }

        // Query existing Contacts
        Map<String, Contact> existingContactsMap = new Map<String, Contact>();
        for (Contact c : [SELECT Id, Email FROM Contact WHERE Email IN :emailSet]) {
            existingContactsMap.put(c.Email.toLowerCase(), c);
        }

        // Get current user and portal account
        User currentUser = [SELECT Id, Organization_Name__c, TimeZoneSidKey, LocaleSidKey, EmailEncodingKey, LanguageLocaleKey 
                            FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];

        Organisation__c org = [SELECT Id,Type_of_User__c FROM Organisation__c WHERE Name = :currentUser.Organization_Name__c LIMIT 1];

        Account portalAccount = [SELECT Id, Name FROM Account WHERE Name = 'Portal Account' LIMIT 1];

        // Query Facilities
        Map<String, Facility__c> facilityMap = new Map<String, Facility__c>();
        for (Facility__c f : [SELECT Id, Name,Organisation__c FROM Facility__c WHERE Name IN :facilityNames AND Organisation__c =: org.Id]) {
            facilityMap.put(f.Name, f);
        }

        // Track contacts and staff
        List<Contact> contactsToInsert = new List<Contact>();
        Map<String, Integer> emailToIndexMap = new Map<String, Integer>();

        // First pass: validate and create Contact objects
        for (Integer i = 0; i < records.size(); i++) {
            Map<String, String> record = records[i];
            String email = record.get('EmailAddress');
            String facilityName = record.get('Facility');

            try {
                if (existingContactsMap.containsKey(email.toLowerCase())) {
                    record.put('ErrorMessage', 'Duplicate email found: ' + email);
                    failedRecords.add(record);
                    continue;
                }

                if (facilityName == null || !facilityMap.containsKey(facilityName)) {
                    record.put('ErrorMessage', 'Facility not available: ' + facilityName);
                    failedRecords.add(record);
                    continue;
                }

                Contact contact = new Contact();
                contact.FirstName = record.get('FirstName');
                contact.LastName = record.get('LastName');
                contact.Email = email;
                contact.AccountId = portalAccount.Id;
                contact.MailingStreet = record.get('AddressStreet');
                contact.MailingCity = record.get('AddressCity');
                contact.MailingState = record.get('AddressState');
                contact.MailingPostalCode = record.get('AddressPostCode');
                contact.MailingCountry = record.get('AddressCountry');
                contact.Portal_User_Created__c = true;

                contactsToInsert.add(contact);
                emailToIndexMap.put(email, i);

            } catch (Exception e) {
                record.put('ErrorMessage', 'Contact creation failed: ' + e.getMessage());
                failedRecords.add(record);
            }
        }

        // Insert Contacts in bulk
        if (!contactsToInsert.isEmpty()) {
            try {
                insert contactsToInsert;
            } catch (DmlException de) {
                // Handle contact insert failure
                for (Integer i = 0; i < contactsToInsert.size(); i++) {
                    Map<String, String> record = records[emailToIndexMap.get(contactsToInsert[i].Email)];
                    record.put('ErrorMessage', 'Contact insert failed: ' + de.getMessage());
                    failedRecords.add(record);
                }
                return response; // Abort as all contacts failed
            }
        }

        // Second pass: create Staff, delete Contacts if Staff fails
        List<Staff__c> staffToInsert = new List<Staff__c>();
        List<Contact> contactsToDelete = new List<Contact>();

        for (Contact insertedContact : contactsToInsert) {
            Map<String, String> record = records[emailToIndexMap.get(insertedContact.Email)];
            String facilityName = record.get('Facility');

            try {
                Facility__c facility = facilityMap.get(facilityName);
                if (facility == null) {
                    // Facility missing, mark failed and delete Contact
                    record.put('ErrorMessage', 'Facility not available: ' + facilityName);
                    contactsToDelete.add(insertedContact);
                    failedRecords.add(record);
                    continue;
                }

                Staff__c staff = new Staff__c();
                staff.Name = insertedContact.FirstName;
                staff.Last_Name__c = insertedContact.LastName;
                staff.Gender__c = record.get('Gender');
                staff.Email_Address__c = insertedContact.Email;
                staff.Status__c = (record.get('Status') == 'Active' || record.get('Status') == 'true' || record.get('Status') == 'Yes');
                staff.Contact_Number__c = record.get('PhoneNumber');

                // Map role
                switch on record.get('Role') {
                    when 'Org Admin' { staff.User_Role__c = 'Portal Account Partner Executive'; }
                    when 'Roster Admin' { staff.User_Role__c = 'Portal account partner Manager'; }
                    when 'Staff' { staff.User_Role__c = 'Portal account partner User'; }
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

                String abn = (String)record.get('AustralianBusinessNumber');
                String tfn = (String)record.get('TaxFileNumber');

                staff.User_Type__c = record.get('UserType');
                staff.Facility__c = facility.Id;
                staff.Working_Hours_Rate__c = parseDecimal(record.get('HourlyRate'));
                staff.Tax_free_threshold__c = record.get('TaxFreeThreshold');
                staff.Emp_Start_Date__c = parseDDMMYYYY(record.get('StartDate'));
                staff.Date_Of_Birth__c = parseDDMMYYYY(record.get('DateofBirth'));
                staff.Address__Street__s = record.get('AddressStreet');
                staff.Address__City__s = record.get('AddressCity');
                staff.Address__StateCode__s = stateCode;
                staff.Address__PostalCode__s = '3066';
                staff.Address__CountryCode__s = 'AU';
                staff.TimeZoneSidKey__c = currentUser.TimeZoneSidKey;
                staff.LocaleSidKey__c = currentUser.LocaleSidKey;
                staff.EmailEncodingKey__c = currentUser.EmailEncodingKey;
                staff.LanguageLocaleKey__c = currentUser.LanguageLocaleKey;
                staff.Employment_type__c = record.get('Frequency');
                staff.Management_Fee__c = parseDecimal(record.get('Management Fee'));
                staff.Type_of_User__c = org.Type_of_User__c;
                staff.ABN_Number__c = (abn != null && abn.trim() != '') ? abn : null;
                staff.TFN_number__c = (tfn != null && tfn.trim() != '') ? tfn : null;   

                staffToInsert.add(staff);

            } catch (Exception e) {
                record.put('ErrorMessage', 'Staff creation failed: ' + e.getMessage());
                contactsToDelete.add(insertedContact);
                failedRecords.add(record);
            }
        }

        // Insert Staff in bulk
        if (!staffToInsert.isEmpty()) {
            try {
                insert staffToInsert;
            } catch (DmlException de) {
                // On failure, delete corresponding Contacts
                for (Staff__c s : staffToInsert) {
                    Map<String, String> record = records[emailToIndexMap.get(s.Email_Address__c)];
                    record.put('ErrorMessage', 'Staff insert failed: ' + de.getMessage());
                    Contact c = contactsToInsert[emailToIndexMap.get(s.Email_Address__c)];
                    contactsToDelete.add(c);
                    failedRecords.add(record);
                }
            }
        }

        // Delete Contacts that failed Staff creation
        if (!Test.isRunningTest()) {
            if (!contactsToDelete.isEmpty()) {
                delete contactsToDelete;
            }
        }

        // Mark remaining records as success
        for (Map<String, String> record : records) {
            if (!record.containsKey('ErrorMessage')) {
                successRecords.add(record);
            }
        }

        response.put('successRecords', successRecords);
        response.put('failedRecords', failedRecords);
        if (!Test.isRunningTest() && !successRecords.isEmpty()) {
            try {
                CreateUsersBatch createUser = new CreateUsersBatch();
                Database.executeBatch(createUser, 1);
            } catch (Exception e) {
                System.debug('Batch execution failed: ' + e.getMessage());
                // Optionally, add an error to the response if batch fails
                response.put('batchError', e.getMessage());
            }
        }
        return response;
    }

    
    public static Date parseDDMMYYYY(String input) {
        List<String> parts = input.split('/');
        if (parts.size() != 3) return null;
        return Date.newInstance(
            Integer.valueOf(parts[2]), // year
            Integer.valueOf(parts[1]), // month
            Integer.valueOf(parts[0])  // day
        );
    }   
    
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
    
    @AuraEnabled(cacheable=true)
    public static List<String> getUserTypeValues(string selectedroleValue, Id userId) {
        
        system.debug('selectedroleValue=====>'+selectedroleValue);
        
        User userRecord = [SELECT Id, Organization_Name__c, User_Type__c FROM User WHERE Id = :userId LIMIT 1];
        
        List<String> multiPicklistValues = new List<String>();
        
        Organisation__c parentRecord = [
            SELECT Id, User_Type__c 
            FROM Organisation__c 
            WHERE Name = :userRecord.Organization_Name__c 
            LIMIT 1
        ];
        
        
        if (parentRecord != null && parentRecord.User_Type__c != null) {
            multiPicklistValues = parentRecord.User_Type__c.split(';');
        }
        system.debug('multiPicklistValues====>'+multiPicklistValues);
        
        
        if (selectedroleValue == 'Portal account partner executive') {
            List<String> allowedValues;

            // Check if the current user's User_Type__c is 'Facility Admin'
            if (userRecord.User_Type__c == 'Facility Admin') {
                allowedValues = new List<String>{ 'Facility Admin' };
            } else {
                allowedValues = new List<String>{ 'NDIS Org Admin', 'ICT Admin', 'Facility Admin' };
            }
                List<String> filteredValues = new List<String>();
            
            for (String value : multiPicklistValues) {
                system.debug('value====>'+value);
                if (allowedValues.contains(value)) {
                    filteredValues.add(value);
                }
            }
            multiPicklistValues = filteredValues; 
            
        } 
        else if (selectedroleValue == 'Portal account partner manager') {
            List<String> allowedValues = new List<String>{
                'Roster Manager', 'Payroll Admin', 'HR Admin', 'NDIS Participant',
                    'Payroll Accountant for Multiple', 'Accountant for Organisation', 'ICT Admin'
                    };
                        
                        Map<String, String> normalizedLabels = new Map<String, String>{
                            'ndis participants' => 'NDIS Participant',
                                'ndis participant' => 'NDIS Participant'
                                };
                                    
                                    List<String> filteredValues = new List<String>();
            
            for (String value : multiPicklistValues) {
                String cleanedValue = value.trim().toLowerCase();
                for (String allowed : allowedValues) {
                    if (allowed.trim().toLowerCase() == cleanedValue || normalizedLabels.containsKey(cleanedValue)) {
                        filteredValues.add(normalizedLabels.containsKey(cleanedValue) ? normalizedLabels.get(cleanedValue) : allowed);
                        break;
                    }
                }
            }
            
            multiPicklistValues = filteredValues;
        }    
        else if (selectedroleValue == 'Portal account partner User') {
            List<String> allowedValues = new List<String>{ 'ICT Staff', 'NDIS Staff' };
                List<String> filteredValues = new List<String>();
            
            for (String value : multiPicklistValues) {
                if (allowedValues.contains(value)) {
                    filteredValues.add(value);
                }
            }
            multiPicklistValues = filteredValues; 
        }
        system.debug('multiPicklistValues >>'+ multiPicklistValues);
        return multiPicklistValues;
    } 
    
    @AuraEnabled
    public static String createPortalUserStaff(String StaffId,String selectedRole, String selectedUserType) {
        try {
            
            system.debug('StaffId===>'+StaffId);            // Fetch the Staff record
            List<Staff__c> staffList = [SELECT Status__c, Id, Name, Last_Name__c, Address__Street__s, Address__City__s, 
                                        Address__PostalCode__s, Address__StateCode__s, Address__CountryCode__s, 
                                        Address__Latitude__s, Address__Longitude__s, Address__GeocodeAccuracy__s, 
                                        Email_Address__c 
                                        FROM Staff__c 
                                        WHERE Id = :StaffId 
                                        LIMIT 1];
            
            List<User> userOrgName = [SELECT Id, Organization_Name__c, TimeZoneSidKey, LocaleSidKey, EmailEncodingKey, LanguageLocaleKey 
                                      FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
            Staff__c STF = new Staff__c(id=StaffId);
            STF.TimeZoneSidKey__c = userOrgName[0].TimeZoneSidKey;
            STF.LocaleSidKey__c = userOrgName[0].LocaleSidKey;
            STF.EmailEncodingKey__c = userOrgName[0].EmailEncodingKey;
            STF.LanguageLocaleKey__c = userOrgName[0].LanguageLocaleKey;
            STF.User_Type__c = selectedUserType;
            STF.User_Role__c = selectedRole;
            update STF;
            Staff__c staff = staffList[0];
            
            // Fetch the Portal Account
            List<Account> accList = [SELECT Id, Name FROM Account WHERE Name = 'Portal Account' LIMIT 1];
            
            if (accList.isEmpty()) {
                return 'No Portal Account found.';
            }
            
            Account portalAccount = accList[0];
            
            // Validate Email
            if (String.isEmpty(staff.Email_Address__c)) {
                return 'Staff Email is missing, cannot create Contact.';
            }
            
            // Create Contact
            Contact contact = new Contact(
                FirstName = staff.Name, 
                LastName = staff.Last_Name__c,
                Email = staff.Email_Address__c,
                AccountId = portalAccount.Id,
                MailingStreet = staff.Address__Street__s,
                MailingCity = staff.Address__City__s,
                MailingState = staff.Address__StateCode__s,
                MailingPostalCode = staff.Address__PostalCode__s,
                MailingCountry = staff.Address__CountryCode__s,
                Portal_User_Created__c = true
            );
            
            insert contact;
            if (!Test.isRunningTest()) {
                CreateUsersBatch createUser = new CreateUsersBatch();
                Database.executeBatch(createUser, 1);
               }

            return 'Contact Created Successfully: ' + contact.Id;
            
            
        } catch (Exception e) {
            return 'Error inserting Contact: ' + e.getMessage();
        }
    }
    
    @AuraEnabled
    public static String createstafffromstaffDataCommunity(Id StaffId) {
        try {
            Staff__c staff = [SELECT Id, Name, Email_Address__c,User_Not_Created__c FROM Staff__c WHERE Id = :StaffId LIMIT 1];
            
            staff.User_Not_Created__c = true;
            
            update staff;
            return 'Staff Created Successfully';
            
        }
        catch (Exception e) {
            return 'Error while Creating Staff';
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static String getUserRole() {
        Id userId = UserInfo.getUserId();
        User u = [SELECT Id, User_Type__c FROM User WHERE Id = :userId LIMIT 1];
        return u.User_Type__c != null ? u.User_Type__c : 'No Role Assigned';
    }
    @AuraEnabled
    public static list<Facility_Association__c> getFacilityCurrentUser(){
        Id userId = UserInfo.getUserId();
        system.debug('userId '+userId);
        list<Facility_Association__c> facAssociation= new list<Facility_Association__c>();
        facAssociation=[select Id,Facility__c,Facility__r.Name,Staff__c,User__c,Facility__r.Facility_Preferred_Name_Formula__c,Facility__r.Type_of_Service__c,Facility__r.Participant_Preferred_Name_Formla__c from Facility_Association__c where User__c=:userId
                       and Active__c =true];
        system.debug('facAssociation  '+facAssociation);
        return facAssociation;        
        
    }
    @AuraEnabled
    public static list<Facility_Association__c> getFacilityUserWise(string UserId,string accessUserType){
        system.debug(' UserId '+UserId);
        system.debug(' accessUserType '+accessUserType);
        list<Facility_Association__c> facAssociation= new list<Facility_Association__c>();
        facAssociation=[select Id,Facility__c,Facility__r.Name,Staff__c,User__c from Facility_Association__c where User__c=:UserId AND User_Type__c=: accessUserType
                        and Active__c =true];
        system.debug('facAssociation  '+facAssociation);
        return facAssociation;        
        
    }
    @AuraEnabled
    public static void insertFacicilityAssociation(List<String> FacilityIdList,String UserId, List<String> updatedFacilityId,String userType) {
        List<Facility_Association__c> facToInsert = new List<Facility_Association__c>();
        List<Facility_Association__c> facToUpdateInactive = new List<Facility_Association__c>();
        
        Set<String> selectedSet = new Set<String>(FacilityIdList);
        Set<String> oldSet = new Set<String>(updatedFacilityId);
        
        Set<String> toDeactivate = new Set<String>(oldSet);
        toDeactivate.removeAll(selectedSet); // deselected
        
        Set<String> toInsert = new Set<String>(selectedSet);
        toInsert.removeAll(oldSet); // newly selected
        
        // 🔁 Reactivate if inactive records exist
        if (!toInsert.isEmpty()) {
            List<Facility_Association__c> existingInactive = [
                SELECT Id, Facility__c, Active__c
                FROM Facility_Association__c
                WHERE User__c = :UserId AND Facility__c IN :toInsert AND Active__c = false
            ];
            
            Set<String> reactivatedFacilityIds = new Set<String>();
            
            for (Facility_Association__c fa : existingInactive) {
                fa.Active__c = true;
                facToUpdateInactive.add(fa);
                reactivatedFacilityIds.add(fa.Facility__c); // So we don’t create duplicate
            }
            
            // Insert new records only for those not reactivated
            for (String fac : toInsert) {
                if (!reactivatedFacilityIds.contains(fac)) {
                    Facility_Association__c fsa = new Facility_Association__c();
                    fsa.Facility__c = fac;
                    fsa.User__c = UserId;
                    fsa.User_Type__c = userType;
                    fsa.Active__c = true;
                    facToInsert.add(fsa);
                }
            }
            
            if (!facToUpdateInactive.isEmpty()) {
                update facToUpdateInactive;
            }
            if (!facToInsert.isEmpty()) {
                insert facToInsert;
            }
        }
        
        // 🧯 Deactivate logic (as before)
        if (!toDeactivate.isEmpty()) {
            List<Facility_Association__c> toUpdate = [
                SELECT Id
                FROM Facility_Association__c
                WHERE User__c = :UserId AND Facility__c IN :toDeactivate AND Active__c = true
            ];
            
            for (Facility_Association__c fa : toUpdate) {
                fa.Active__c = false;
                facToUpdateInactive.add(fa);
            }
            
            if (!facToUpdateInactive.isEmpty()) {
                update facToUpdateInactive;
            }
        }
    }


    
    /*@AuraEnabled(cacheable=true)
    public static List<String> getUserTypeValues1(string selectedroleValue, Id userId) {
        
        system.debug('selectedroleValue=====>'+selectedroleValue);
        system.debug('UserId =====>'+userId);
        Staff__c staffRecord = [SELECT Id, Email_Address__c FROM Staff__c WHERE Id = :userId LIMIT 1];
        system.debug('staffRecord =====>'+staffRecord);
        User userRecord = [SELECT Id, Organization_Name__c, Email, User_Type__c,IsActive FROM User WHERE Email = :staffRecord.Email_Address__c LIMIT 1];
        system.debug('userRecord =====>'+userRecord);
        List<String> multiPicklistValues = new List<String>();
        system.debug('Organization_Name =====>'+userRecord.Organization_Name__c);
        Organisation__c parentRecord = [
            SELECT Id, User_Type__c 
            FROM Organisation__c 
            WHERE Name = :userRecord.Organization_Name__c 
            LIMIT 1
        ];
        
        
        if (parentRecord != null && parentRecord.User_Type__c != null) {
            multiPicklistValues = parentRecord.User_Type__c.split(';');
        }
        system.debug('multiPicklistValues====>'+multiPicklistValues);
        
        
        if (selectedroleValue == 'Portal account partner executive') {
            List<String> allowedValues;

            // Check if the current user's User_Type__c is 'Facility Admin'
            if (userRecord.User_Type__c == 'Facility Admin') {
                allowedValues = new List<String>{ 'Facility Admin' };
            } else {
                allowedValues = new List<String>{ 'NDIS Org Admin', 'ICT Admin', 'Facility Admin' };
            }
                List<String> filteredValues = new List<String>();
            
            for (String value : multiPicklistValues) {
                system.debug('value====>'+value);
                if (allowedValues.contains(value)) {
                    filteredValues.add(value);
                }
            }
            multiPicklistValues = filteredValues; 
            
        } 
        else if (selectedroleValue == 'Portal account partner manager') {
            List<String> allowedValues = new List<String>{
                'Roster Manager', 'Payroll Admin', 'HR Admin', 'NDIS Participant',
                    'Payroll Accountant for Multiple', 'Accountant for Organisation', 'ICT Admin'
                    };
                        
                        Map<String, String> normalizedLabels = new Map<String, String>{
                            'ndis participants' => 'NDIS Participant',
                                'ndis participant' => 'NDIS Participant'
                                };
                                    
                                    List<String> filteredValues = new List<String>();
            
            for (String value : multiPicklistValues) {
                String cleanedValue = value.trim().toLowerCase();
                for (String allowed : allowedValues) {
                    if (allowed.trim().toLowerCase() == cleanedValue || normalizedLabels.containsKey(cleanedValue)) {
                        filteredValues.add(normalizedLabels.containsKey(cleanedValue) ? normalizedLabels.get(cleanedValue) : allowed);
                        break;
                    }
                }
            }
            
            multiPicklistValues = filteredValues;
        } 
        else if (selectedroleValue == 'Portal account partner User') {
            List<String> allowedValues = new List<String>{ 'ICT Staff', 'NDIS Staff' };
                List<String> filteredValues = new List<String>();
            
            for (String value : multiPicklistValues) {
                if (allowedValues.contains(value)) {
                    filteredValues.add(value);
                }
            }
            multiPicklistValues = filteredValues; 
        }
        system.debug('multiPicklistValues >>'+ multiPicklistValues);
        return multiPicklistValues;
    } */


    @AuraEnabled(cacheable=true)
    public static List<String> getUserTypeValues1(String selectedroleValue, Id userId) {

        System.debug('selectedroleValue=====>' + selectedroleValue);
        System.debug('UserId =====>' + userId);

        // Fetch Staff record
        Staff__c staffRecord = [
            SELECT Id, Email_Address__c 
            FROM Staff__c 
            WHERE Id = :userId 
            LIMIT 1
        ];
        System.debug('staffRecord =====>' + staffRecord);

        User userRecord;
        if (staffRecord.Email_Address__c != null) {
            // Fetch users with the same email
            List<User> users = [
                SELECT Id, Organization_Name__c, Email, User_Type__c, IsActive 
                FROM User 
                WHERE Email = :staffRecord.Email_Address__c
            ];
            System.debug('Users returned =====>' + users);

            // If only one user is found → take it
            if (users.size() == 1) {
                userRecord = users[0];
            }
            // If more than one → take the active one
            else if (users.size() > 1) {
                for (User u : users) {
                    if (u.IsActive) {
                        userRecord = u;
                        break;
                    }
                }
            }

            if (userRecord == null) {
                System.debug('No active user found. Setting userRecord to null.');
            } else {
                System.debug('Selected userRecord =====>' + userRecord);
            }
        }

        List<String> multiPicklistValues = new List<String>();

        // Fetch Organisation and split User Type picklist values
        if (userRecord != null) {
            System.debug('Organization_Name =====>' + userRecord.Organization_Name__c);

            Organisation__c parentRecord = [
                SELECT Id, User_Type__c 
                FROM Organisation__c 
                WHERE Name = :userRecord.Organization_Name__c 
                LIMIT 1
            ];

            if (parentRecord != null && parentRecord.User_Type__c != null) {
                multiPicklistValues = parentRecord.User_Type__c.split(';');
            }
        }

        System.debug('multiPicklistValues before filtering====>' + multiPicklistValues);

        // Role-wise filtering logic
        if (selectedroleValue == 'Portal account partner executive') {
            List<String> allowedValues;

            // If current user is a Facility Admin → restrict options
            if (userRecord != null && userRecord.User_Type__c == 'Facility Admin') {
                allowedValues = new List<String>{ 'Facility Admin' };
            } else {
                allowedValues = new List<String>{ 'NDIS Org Admin', 'ICT Admin', 'Facility Admin' };
            }

            List<String> filteredValues = new List<String>();
            for (String value : multiPicklistValues) {
                if (allowedValues.contains(value)) {
                    filteredValues.add(value);
                }
            }
            multiPicklistValues = filteredValues;
        }
        else if (selectedroleValue == 'Portal account partner manager') {
            List<String> allowedValues = new List<String>{
                'Roster Manager', 'Payroll Admin', 'HR Admin', 'NDIS Participant',
                'Payroll Accountant for Multiple', 'Accountant for Organisation', 'ICT Admin'
            };

            Map<String, String> normalizedLabels = new Map<String, String>{
                'ndis participants' => 'NDIS Participant',
                'ndis participant' => 'NDIS Participant'
            };

            List<String> filteredValues = new List<String>();
            for (String value : multiPicklistValues) {
                String cleanedValue = value.trim().toLowerCase();
                for (String allowed : allowedValues) {
                    if (allowed.trim().toLowerCase() == cleanedValue || normalizedLabels.containsKey(cleanedValue)) {
                        filteredValues.add(normalizedLabels.containsKey(cleanedValue) ? normalizedLabels.get(cleanedValue) : allowed);
                        break;
                    }
                }
            }
            multiPicklistValues = filteredValues;
        }
        else if (selectedroleValue == 'Portal account partner User') {
            List<String> allowedValues = new List<String>{ 'ICT Staff', 'NDIS Staff' };
            List<String> filteredValues = new List<String>();
            for (String value : multiPicklistValues) {
                if (allowedValues.contains(value)) {
                    filteredValues.add(value);
                }
            }
            multiPicklistValues = filteredValues;
        }

        System.debug('Filtered multiPicklistValues >>' + multiPicklistValues);
        return multiPicklistValues;
    }
 
}