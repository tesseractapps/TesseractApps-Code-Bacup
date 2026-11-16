public without sharing class tSignContactController {

    public class ContactPage {
        @AuraEnabled public List<TSign_Contact__c> records;
        @AuraEnabled public Integer totalRecords;
    }

    public class AddressInput {
        @AuraEnabled public String street { get; set; }
        @AuraEnabled public String city { get; set; }
        @AuraEnabled public String stateCode { get; set; }
        @AuraEnabled public String countryCode { get; set; }
        @AuraEnabled public String postalCode { get; set; }
    }

    // ---------- ACCOUNT TYPE (Individual / Business / Organisation) ----------
    // NOTE: assumes object TSign_Organisation__c with picklist Account_Type__c.
    // Rename to match your org.
    @AuraEnabled(cacheable=true)
    public static String getAccountType() {
        try {
            String orgId = [
                SELECT TSign_Org_Id__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ].TSign_Org_Id__c;

            if (String.isBlank(orgId)) {
                return null;
            }

            List<TSign_Organisation__c> orgs = [
                SELECT Account_Type__c
                FROM TSign_Organisation__c
                WHERE Id = :orgId
                LIMIT 1
            ];

            return orgs.isEmpty() ? null : orgs[0].Account_Type__c;

        } catch (Exception e) {
            logError(e);
            throw auraError(e.getMessage());
        }
    }

    public static Boolean isIndividual() {
        return 'Individual'.equalsIgnoreCase(getAccountType());
    }

    // ---------- LIST + SEARCH + PAGINATION ----------
    // Non-individual: filtered by facility.
    // Individual: no facility; shows contacts created by the current user.
    @AuraEnabled
    public static ContactPage getContacts(
        String searchKey,
        Integer pageSize,
        Integer pageNumber,
        Boolean archived,
        String facilityId
    ) {
        try {
            ContactPage result = new ContactPage();
            Boolean indiv = isIndividual();

            // No facility selected (non-individual) -> nothing to show
            if (!indiv && String.isBlank(facilityId)) {
                result.records = new List<TSign_Contact__c>();
                result.totalRecords = 0;
                return result;
            }

            Boolean isArch = (archived == true);
            Integer size = (pageSize == null || pageSize < 1)
                ? 12 : Math.min(pageSize, 100);
            Integer pg = (pageNumber == null || pageNumber < 1)
                ? 1 : pageNumber;
            Integer off = (pg - 1) * size;
            String key = String.isBlank(searchKey)
                ? null : '%' + searchKey.trim() + '%';

            Map<String, Object> binds = new Map<String, Object>{
                'isArch' => isArch,
                'key' => key,
                'lim' => size,
                'off' => off
            };

            String whereClause =
                ' FROM TSign_Contact__c WHERE Is_Archived__c = :isArch';

            if (indiv) {
                binds.put('userId', UserInfo.getUserId());
                whereClause += ' AND CreatedById = :userId';
            } else {
                binds.put('facilityId', facilityId);
                whereClause += ' AND TSign_Facility__c = :facilityId';
            }

            if (key != null) {
                whereClause +=
                    ' AND (First_Name__c LIKE :key' +
                    ' OR Last_Name__c LIKE :key' +
                    ' OR Email__c LIKE :key' +
                    ' OR Contact_Number__c LIKE :key' +
                    ' OR Address_Data__c LIKE :key)';
            }

            result.totalRecords = Database.countQueryWithBinds(
                'SELECT COUNT()' + whereClause,
                binds,
                AccessLevel.USER_MODE
            );

            String soql =
                'SELECT Id, Name, First_Name__c, Last_Name__c,' +
                ' Email__c, Contact_Number__c, Contact_Type__c, Picture__c,' +
                ' TSign_Facility__c, Address_Data__c,' +
                ' Address__Street__s, Address__City__s,' +
                ' Address__StateCode__s, Address__CountryCode__s,' +
                ' Address__PostalCode__s, Is_Archived__c' +
                whereClause +
                ' ORDER BY CreatedDate DESC LIMIT :lim OFFSET :off';

            result.records =
                (List<TSign_Contact__c>) Database.queryWithBinds(
                    soql,
                    binds,
                    AccessLevel.USER_MODE
                );

            return result;

        } catch (AuraHandledException ae) {
            throw ae;
        } catch (Exception e) {
            logError(e);
            throw auraError(e.getMessage());
        }
    }

    // ---------- CREATE / EDIT / CLONE ----------
    @AuraEnabled
    public static Id saveContact(
        TSign_Contact__c contactRecord,
        AddressInput address
    ) {
        try {
            if (contactRecord == null) {
                throw auraError('No contact data received.');
            }

            Boolean indiv = isIndividual();

                if (String.isBlank(contactRecord.TSign_Facility__c)) {
                    contactRecord.TSign_Facility__c = getDefaultFacilityId();
                } else {
                // Facility required + must be active
                if (String.isBlank(contactRecord.TSign_Facility__c)) {
                    throw auraError('Please select a facility.');
                }

                Integer activeFacilityCount = [
                    SELECT COUNT()
                    FROM TSign_Facility__c
                    WHERE Id = :contactRecord.TSign_Facility__c
                      AND Active__c = true
                    WITH USER_MODE
                ];

                if (activeFacilityCount == 0) {
                    throw auraError('Selected facility is not active.');
                }
            }

            // Address
            if (address != null) {
                contactRecord.Address__Street__s = address.street;
                contactRecord.Address__City__s = address.city;
                contactRecord.Address__StateCode__s = address.stateCode;
                contactRecord.Address__CountryCode__s = address.countryCode;
                contactRecord.Address__PostalCode__s = address.postalCode;
            }

            contactRecord.Name = buildContactName(contactRecord.First_Name__c, contactRecord.Last_Name__c);
            String orgId = getCurrentUserOrganisation();
            contactRecord.TSign_Organisation__c=orgId;
            // Duplicate email check across ALL organisations (entire object).
            if (String.isNotBlank(contactRecord.Email__c)) {
                String email = contactRecord.Email__c.trim();
                contactRecord.Email__c = email;

                List<TSign_Contact__c> dupes = [
                    SELECT Id
                    FROM TSign_Contact__c
                    WHERE Email__c = :email
                      AND Id != :contactRecord.Id
                    LIMIT 1
                ];

                if (!dupes.isEmpty()) {
                    // Generic message so one org can't learn about another org's contacts
                    throw auraError('A contact with this email already exists.');
                }
            }

            if (contactRecord.Id == null) {
                insert as user contactRecord;
            } else {
                // Make sure record exists and is visible to user
                List<TSign_Contact__c> existing = [
                    SELECT Id
                    FROM TSign_Contact__c
                    WHERE Id = :contactRecord.Id
                    WITH USER_MODE
                    LIMIT 1
                ];

                if (existing.isEmpty()) {
                    throw auraError('Contact not found.');
                }

                update as user contactRecord;
            }

            return contactRecord.Id;

        } catch (AuraHandledException ae) {
            throw ae;
        } catch (Exception e) {
            logError(e);
            throw auraError(e.getMessage());
        }
    }

    public static Id getDefaultFacilityId() {
        String orgId = getCurrentUserOrganisation();
        if (String.isBlank(orgId)) {
            return null;
        }
        List<TSign_Facility__c> facs = [
            SELECT Id
            FROM TSign_Facility__c
            WHERE TSign_Organisation__c = :orgId
            AND Active__c = true
            ORDER BY CreatedDate ASC
            LIMIT 1
        ];
        return facs.isEmpty() ? null : facs[0].Id;
    }

    public static String buildContactName(String firstName, String lastName) {
        String fullName = (String.isNotBlank(firstName) ? firstName.trim() : '')
            + ' '
            + (String.isNotBlank(lastName) ? lastName.trim() : '');
        fullName = fullName.trim();
        return fullName.length() > 80 ? fullName.substring(0, 80) : fullName;
    }

    // ---------- ARCHIVE / UNARCHIVE ----------
    @AuraEnabled
    public static void setArchived(Id contactId, Boolean archived) {
        try {
            List<TSign_Contact__c> contacts = [
                SELECT Id, Is_Archived__c
                FROM TSign_Contact__c
                WHERE Id = :contactId
                WITH USER_MODE
                LIMIT 1
            ];

            if (contacts.isEmpty()) {
                throw auraError('Contact not found.');
            }

            contacts[0].Is_Archived__c = (archived == true);
            update as user contacts[0];

        } catch (AuraHandledException ae) {
            throw ae;
        } catch (Exception e) {
            logError(e);
            throw auraError(e.getMessage());
        }
    }

    // ---------- HELPERS ----------
    // AuraHandledException needs setMessage, else client sees "Script-thrown exception"
    public static AuraHandledException auraError(String message) {
        AuraHandledException ex = new AuraHandledException(message);
        ex.setMessage(message);
        return ex;
    }

    public static void logError(Exception e) {
        System.debug(LoggingLevel.ERROR, 'ERROR MESSAGE: ' + e.getMessage());
        System.debug(LoggingLevel.ERROR, 'ERROR TYPE: ' + e.getTypeName());
        System.debug(LoggingLevel.ERROR, 'ERROR LINE: ' + e.getLineNumber());
        System.debug(LoggingLevel.ERROR, 'STACK TRACE: ' + e.getStackTraceString());
    }

    // ---------- CURRENT USER ORGANISATION ----------
    @AuraEnabled
    public static String getCurrentUserOrganisation() {
        try {
            Id currentUserId = UserInfo.getUserId();

            User currentUser = [
                SELECT Id, TSign_Org_Id__c
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];

            return currentUser.TSign_Org_Id__c;

        } catch (Exception e) {
            throw e;
        }
    }
}