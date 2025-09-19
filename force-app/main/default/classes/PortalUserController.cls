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
        Integer hourlyRate = Integer.valueOf(hourlyRateString);
        String startDateString = (String) userDetails.get('startDate');
        Date startDate = Date.valueOf(startDateString);
        String taxFileNumberString = (String) userDetails.get('taxFileNumber');
        Integer taxFileNumber = Integer.valueOf(taxFileNumberString);
        Id currentUserId = (Id) userDetails.get('currentuserId');
        String selectedTaxFree = (String) userDetails.get('selectedTaxFree');
        String street = (String) userDetails.get('street');
        String city = (String) userDetails.get('City');
        String state = (String) userDetails.get('State');
        String country = (String) userDetails.get('Country');
        String postalCode = (String) userDetails.get('PostalCode');
        String selectedGender = (String) userDetails.get('selectedGender');
        
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
                User_Type__c = userType
            );
            insert newStaff;
            system.debug('newStaff====>' + newStaff);
            
            result.put('StaffId', newStaff.Id);
            result.put('userRole', newStaff.User_Role__c);
            result.put('userType', newStaff.User_Type__c);
            result.put('StaffStatus', newStaff.Status__c);
            
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

    try {
        // Fetch user organization information
        User userOrgName = [SELECT Id, Organization_Name__c, TimeZoneSidKey, LocaleSidKey, EmailEncodingKey, LanguageLocaleKey 
                            FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];

        Organisation__c organisationList = [SELECT Id, Name, Type_of_User__c 
                                            FROM Organisation__c 
                                            WHERE Name = :userOrgName.Organization_Name__c LIMIT 1];

        // Fetch Portal Account
        Account portalAccount = [SELECT Id, Name FROM Account WHERE Name = 'Portal Account' LIMIT 1];
        system.debug('portalAccount==>'+portalAccount);
        
        List<Contact> newContacts = new List<Contact>();
        List<Staff__c> newStaff = new List<Staff__c>();

        for (Map<String, String> record : records) {
            try {
                // Check if Contact already exists
                List<Contact> existingContacts = [SELECT Id, Email FROM Contact WHERE Email = :record.get('EmailAddress')];

                if (!existingContacts.isEmpty()) {
                    // If duplicate email found, add to failed records and continue
                    record.put('ErrorMessage', 'Duplicate email found: ' + record.get('EmailAddress'));
                    failedRecords.add(record);
                    continue;
                }

                // Create new Contact
                Contact newContact = new Contact();
                newContact.FirstName = record.get('FirstName');
                newContact.LastName = record.get('LastName');
                newContact.Email = record.get('EmailAddress');
                newContact.AccountId = portalAccount.Id;
                newContact.MailingStreet = record.get('AddressStreet');
                newContact.MailingCity = record.get('AddressCity');
                newContact.MailingState = record.get('AddressState');
                newContact.MailingPostalCode = record.get('AddressPostCode');
                newContact.MailingCountry = record.get('AddressCountry');
                newContact.Portal_User_Created__c = true;

                insert newContact;
                newContacts.add(newContact);

                // Fetch Facility
                Facility__c facility = [SELECT Id FROM Facility__c WHERE Name = :record.get('Facility') LIMIT 1];

                if (facility != null) {
                    // Assign role
                    String roledata = '';
                    if (record.get('Role') == 'Org Admin') {
                        roledata = 'Portal Account Partner Executive';
                    } else if (record.get('Role') == 'Roster Admin') {
                        roledata = 'Portal account partner Manager';
                    } else if (record.get('Role') == 'Staff') {
                        roledata = 'Portal account partner User';
                    }

                    // Create Staff
                    Staff__c newStaffRecord = new Staff__c();
                    newStaffRecord.Name = newContact.FirstName;
                    newStaffRecord.Last_Name__c = newContact.LastName;
                    newStaffRecord.Gender__c = record.get('Gender');
                    newStaffRecord.Email_Address__c = newContact.Email;

                    Boolean status = false;
                    String recordStatus = record.get('Status');
                    if (recordStatus == 'Active' || recordStatus == 'true' || recordStatus == 'Yes') {
                        status = true;
                    }

                    newStaffRecord.Status__c = status;
                    newStaffRecord.Contact_Number__c = record.get('PhoneNumber');
                    newStaffRecord.User_Role__c = roledata;
                    newStaffRecord.User_Type__c = record.get('UserType');
                    newStaffRecord.Facility__c = facility.Id;
                    newStaffRecord.Working_Hours_Rate__c = Decimal.valueOf(record.get('HourlyRate'));
                    newStaffRecord.TFN_number__c = record.get('TaxFileNumber');
                    newStaffRecord.Tax_free_threshold__c = record.get('TaxFreeThreshold');
                    newStaffRecord.Emp_Start_Date__c = Date.valueOf(record.get('StartDate'));
                    newStaffRecord.Address__Street__s = record.get('AddressStreet');
                    newStaffRecord.Address__City__s = record.get('AddressCity');
                    newStaffRecord.Address__StateCode__s = record.get('AddressState');
                    newStaffRecord.Address__PostalCode__s = '3066';
                    newStaffRecord.Address__CountryCode__s = 'AU';
                    newStaffRecord.Date_Of_Birth__c = Date.valueOf(record.get('DateofBirth'));
                    newStaffRecord.TimeZoneSidKey__c = userOrgName.TimeZoneSidKey;
                    newStaffRecord.LocaleSidKey__c = userOrgName.LocaleSidKey;
                    newStaffRecord.EmailEncodingKey__c = userOrgName.EmailEncodingKey;
                    newStaffRecord.LanguageLocaleKey__c = userOrgName.LanguageLocaleKey;

                    insert newStaffRecord;
                    newStaff.add(newStaffRecord);
                }

                // Add to success records
                successRecords.add(record);

            } catch (Exception e) {
                // Add error details to failedRecords
                record.put('ErrorMessage', e.getMessage());
                failedRecords.add(record);
            }
        }

        response.put('successRecords', successRecords);
        response.put('failedRecords', failedRecords);
        
    } catch (Exception ex) {
        system.debug(ex.getMessage());
        throw new AuraHandledException('Error while processing records: ' + ex.getMessage());
    }

    return response;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getUserTypeValues(string selectedroleValue, Id userId) {
        
        system.debug('selectedroleValue=====>'+selectedroleValue);
        
        User userRecord = [SELECT Id, Organization_Name__c FROM User WHERE Id = :userId LIMIT 1];
        
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
            List<String> allowedValues = new List<String>{ 'NDIS Org Admin', 'ICT Admin' };
                List<String> filteredValues = new List<String>();
            
            for (String value : multiPicklistValues) {
                if (allowedValues.contains(value)) {
                    filteredValues.add(value);
                }
            }
            multiPicklistValues = filteredValues; 
            
        } else if (selectedroleValue == 'Portal account partner manager') {
            List<String> allowedValues = new List<String>{ 'Roster Manager', 'Payroll Admin', 'HR Admin','NDIS Participants','Payroll Accountant for Multiple','Accountant for Organisation','ICT Admin'};
                List<String> filteredValues = new List<String>();
            
            
            for (String value : multiPicklistValues) {
                if (allowedValues.contains(value)) {
                    filteredValues.add(value);
                }
            }
            multiPicklistValues = filteredValues; 
            
        } else if (selectedroleValue == 'Portal account partner User') {
            List<String> allowedValues = new List<String>{ 'ICT Staff', 'NDIS Staff' };
                List<String> filteredValues = new List<String>();
            
            for (String value : multiPicklistValues) {
                if (allowedValues.contains(value)) {
                    filteredValues.add(value);
                }
            }
            multiPicklistValues = filteredValues; 
        }
        
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
}