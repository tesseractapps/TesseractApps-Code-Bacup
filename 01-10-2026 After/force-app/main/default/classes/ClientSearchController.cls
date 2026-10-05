/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-18-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class ClientSearchController {
    @AuraEnabled(cacheable=false)
    public static List<Client__c> fetchFacilitiess(String cname, Boolean isTrue) {    
        User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        System.Debug('Controller User ' + objUser.Organization_Name__c);
        String UserEmail = UserInfo.getUserEmail();
        list<Client__c> listOfClients = new list<Client__c>();
           
        // ============================================================
        // GET LOGIN STAFF
        // ============================================================
    
        Staff__c loginStaff;
    
        if (isTrue == true) {    
            loginStaff = [SELECT Id FROM Staff__c WHERE Email_Address__c = :UserEmail LIMIT 1];    
            System.debug('Login Staff Id >>> ' + loginStaff.Id);
        }
    
    
        // ============================================================
        // PREFERRED PARTICIPANTS
        // ============================================================
        //
        // Example:
        //
        // Staff 1
        //    |
        //    +-- P1
        //    +-- P2
        //    +-- P3
        //
        // preferredParticipantIds =
        // P1, P2, P3
        //
        // ============================================================
    
        Set<Id> preferredParticipantIds = new Set<Id>();
    
    
        if (isTrue == true) {
            List<Participant_Staff_Association__c> participantAssociationList = [
                    SELECT Id,Staff__c,Staff__r.Name,Participant__c,Participant__r.Name, Active__c FROM Participant_Staff_Association__c WHERE Staff__c = :loginStaff.Id AND Active__c = true];
    
            System.debug('Preferred participant association list >>> ' + participantAssociationList);
    
            for (Participant_Staff_Association__c psa : participantAssociationList) { 
                if (psa.Participant__c != null) {
                    preferredParticipantIds.add(psa.Participant__c);
                }
            }
            System.debug('Preferred Participant Ids >>> ' +preferredParticipantIds);
        }
    
    
        // ============================================================
        // TEMPORARY NON-PREFERRED PARTICIPANTS
        // ============================================================
        //
        // Example:
        //
        // Preferred:
        // P1, P2, P3
        //
        // Today's shift:
        // P1, P4, P5
        //
        // P1 = preferred -> SKIP
        // P4 = non-preferred -> ADD
        // P5 = non-preferred -> ADD
        //
        // ============================================================
    
        Set<Id> temporaryParticipantIds = new Set<Id>();
    
        if (isTrue == true &&loginStaff != null) {
    
            // --------------------------------------------------------
            // Date range
            // --------------------------------------------------------
            //
            // Today = 29 Sep
            //
            // Query:
            // 27 Sep
            // 28 Sep
            // 29 Sep
            //
            // --------------------------------------------------------
    
            Date todayDate = Date.today();
    
            Date twoDaysBack = todayDate.addDays(-2);
    
            // --------------------------------------------------------
            // Query shifts
            // --------------------------------------------------------
    
            List<ShiftwithStaff__c> eligibleShifts = [ SELECT Id, Staff__c, Date__c, Status__c FROM ShiftwithStaff__c
                    								   WHERE Staff__c = :loginStaff.Id AND Date__c != null AND Date__c >= :twoDaysBack AND Date__c <= :todayDate 
                                                       AND Status__c IN ('Accepted','InProgress','Completed') AND Attendence__c = true AND Un_Assigned_Shift__c = false AND  Shift_Rejected__c =false];
    
            System.debug('Eligible shifts >>> ' +eligibleShifts);
    
            // --------------------------------------------------------
            // Check 48-hour window
            // --------------------------------------------------------
    
            Set<Id> eligibleShiftIds = new Set<Id>();
    
            Datetime currentDateTime = System.now();
    
            for (ShiftwithStaff__c shift : eligibleShifts) {
    
                /*
                 * Access starts at 12:01 AM
                 * on the shift Date__c.
                 */
    
                Datetime accessStart = Datetime.newInstance(shift.Date__c, Time.newInstance(0,1,0,0));
    
                /*
                 * Access expires after 48 hours.
                 */
    
                Datetime accessEnd = accessStart.addHours(48);
    
                System.debug('Shift Id >>> ' + shift.Id);
                System.debug('Shift Date >>> ' +shift.Date__c);
                System.debug('Access Start >>> ' +accessStart);
                System.debug('Access End >>> ' + accessEnd);
    
                if (currentDateTime >= accessStart && currentDateTime < accessEnd) {
                    eligibleShiftIds.add(shift.Id);
                }
            }
    
            System.debug('Eligible Shift Ids >>> ' + eligibleShiftIds);
    
            // --------------------------------------------------------
            // Get service participants
            // --------------------------------------------------------
    
            if (!eligibleShiftIds.isEmpty()) {
                List<Services_and_Support_Plan__c> serviceList = [SELECT Id,Client__c,ShiftwithStaff__c FROM Services_and_Support_Plan__c WHERE ShiftwithStaff__c IN :eligibleShiftIds AND Client__c != null];
    
                System.debug('Service records >>> ' +serviceList);
    
    
                // ----------------------------------------------------
                // Add ONLY non-preferred participants
                // ----------------------------------------------------
    
                for (Services_and_Support_Plan__c service : serviceList) {
                    if (service.Client__c == null) {
                        continue;
                    }
    
                    /*
                     * If participant is already preferred,
                     * do NOT add them to temporary list.
                     *
                     * Example:
                     *
                     * P1 = preferred
                     * P4 = non-preferred
                     * P5 = non-preferred
                     *
                     * P1 -> SKIP
                     * P4 -> ADD
                     * P5 -> ADD
                     */
    
                    if (preferredParticipantIds.contains(service.Client__c)) {
                        System.debug('Preferred participant skipped >>> ' +service.Client__c);
                        continue;
                    }
                    temporaryParticipantIds.add(service.Client__c);
                }
            }
        }
    
        System.debug('Temporary non-preferred Participant Ids >>> ' + temporaryParticipantIds);
    
        // ============================================================
        // FINAL PARTICIPANT LIST
        // ============================================================
        //
        // Preferred:
        // P1, P2, P3
        //
        // Temporary:
        // P4, P5
        //
        // Final:
        // P1, P2, P3, P4, P5
        //
        // ============================================================
    
        Set<Id> accessibleParticipantIds = new Set<Id>();
    
        if (isTrue == true) {
            accessibleParticipantIds.addAll(preferredParticipantIds);
            accessibleParticipantIds.addAll(temporaryParticipantIds);
            System.debug('Final accessible participant IDs >>> ' + accessibleParticipantIds);
        }
    
    
        // ============================================================
        // BUILD CLIENT QUERY
        // ============================================================
    
        String query =
            'SELECT Id, Participant_UID__c, ' +
            'Facility__r.Name, ' +
            'Facility__r.Type_of_Service__c, ' +
            'Facility__r.Status__c, ' +
            'Facility__r.Organisation__c, ' +
            'Email__c, ' +
            'Prefer_Nickname__c, ' +
            'Display_Nickname__c, ' +
            'ParticipantType__c, ' +
            'Unavailable_Start_Date__c, ' +
            'Unavailable_Date__c, ' +
            'Company__c, ' +
            'Primary_Name__c, ' +
            'Secondary_Name__c, ' +
            'Name__c, ' +
            'AddressData__c, ' +
            'Address1__c, ' +
            'Address2__c, ' +
            'Picture__c, ' +
            'Organization_Name__c, ' +
            'First_Name__c, ' +
            'Last_Name__c, ' +
            'Facility__c, ' +
            'Facility_Name__c, ' +
            'Status__c, ' +
            'Status_A__c, ' +
            'Contact_Number__c, ' +
            'Address__Street__s, ' +
            'Address__City__s, ' +
            'Address__StateCode__s, ' +
            'Address__CountryCode__s, ' +
            'Address__PostalCode__s, ' +
            'Participant_Status__c, ' +
            'Risk_Status__c, ' +
    
    
            // --------------------------------------------------------
            // Risk Management
            // --------------------------------------------------------
    
            '(SELECT ' +
                'Id, ' +
                'Risk_Index__c, ' +
                'Name, ' +
                'Participant__c ' +
            'FROM Risk_Managements__r), ' +
    
    
            // --------------------------------------------------------
            // Participant Facilities
            // --------------------------------------------------------
    
            '(SELECT ' +
                'Id, ' +
                'Facility__c, ' +
                'Facility__r.Name, ' +
                'Active__c, ' +
                'Participant__c ' +
            'FROM Participant_Facilities__r ' +
            'WHERE Active__c = true), ' +
    
    
            // --------------------------------------------------------
            // Guardian Contacts
            // --------------------------------------------------------
    
            '(SELECT ' +
                'Id, ' +
                'Name, ' +
                'First_Name__c, ' +
                'Last_Name__c, ' +
                'Email__c, ' +
                'Contact_Number__c, ' +
                'Contact_Type__c, ' +
                'Notify__c ' +
            'FROM Participant_Contacts__r ' +
            'WHERE Contact_Type__c = \'Guardian\') ' +
            'FROM Client__c';
    
    
        // ============================================================
        // NAME / ORGANISATION FILTER
        // ============================================================
    
        System.debug('Participant firstname >>> ' +cname);
        System.debug('isActive flag >>> ' + isTrue);
    
        if (!String.isBlank(cname)) {
            cname = '%' + cname + '%';
            
            query += ' WHERE Name LIKE :cname';
        } else {
            if (!Test.isRunningTest()) {
                Organisation__c orgD = [SELECT Id, Name FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
                String truncatedStr = String.valueOf(orgD.Id).substring(0, 15);
                
                query += ' WHERE Organization_Name__c = :truncatedStr';
            }
        }
    
        // ============================================================
        // STATUS + STAFF PARTICIPANT FILTER
        // ============================================================
    
        if (isTrue == true) {
            /*
             * Existing Status filter
             */
    
            query +=' AND Status__c = :isTrue';
    
            /*
             * Preferred + temporary participants
             */
    
            if (!accessibleParticipantIds.isEmpty()) {
                query +=' AND Id IN :accessibleParticipantIds';
            } else {
                /*
                 * No preferred participants and no valid temporary
                 * participants.
                 *
                 * Return no records.
                 */
                query +=' AND Id = null';
            }
        }
    
    
        // ============================================================
        // EXECUTE QUERY
        // ============================================================
    
        System.debug('Final Client query >>> ' + query);
        listOfClients = Database.query(query);
        System.debug('Client list >>> ' +listOfClients);
        System.debug('Client list size >>> ' + listOfClients.size());
    
        return listOfClients;
    }
    
    @AuraEnabled
    public static string statusClient(String IdValue,String status){
        Client__c fact=new Client__c(Id=IdValue);
        system.debug('Status>>'+Boolean.valueOf(status));
        fact.Status__c=Boolean.valueOf(status);
        if(Boolean.valueOf(status) ==  true){
            fact.Status_A__c= 'Active';            
            system.debug('Status>>'+Boolean.valueOf(status));
            system.debug('status active>>>'+fact.Status_A__c);
        } else{
            fact.Status_A__c= 'In Active';
            system.debug('Status>>'+Boolean.valueOf(status));
            system.debug('status Inactive>>>'+fact.Status_A__c);
        }
        
        Update fact;
        return 'Partcipant Status is Updated';
    }
    
    @AuraEnabled(cacheable=true)
    public static ClientPaginationWrapper fetchParticipantWithPagination(String searchText, List<Id> facilityIds, Boolean isTrue, Integer pageSize, Integer pageNumber, Integer refreshKey, Boolean isActive, String sortField, String sortDirection) {    
        System.debug('facilityIds >>> ' + facilityIds);   
        String userEmail = UserInfo.getUserEmail();    
        List<String> filters = new List<String>();    
    
        // ============================================================
        // 1. SEARCH FILTER
        // ============================================================
    
        if (String.isNotBlank(searchText)) {
            String searchLike = '%' + searchText + '%';
    
            filters.add(
                '(' +
                    ' Display_Nickname__c LIKE :searchLike ' +
                    ' OR Contact_Number__c LIKE :searchLike ' +
                    ' OR ParticipantType__c LIKE :searchLike' +
                ')'
            );
    
    
            // Facility name search
            List<Participant_Facility__c> matchedFacilities = [
                SELECT Participant__c
                FROM Participant_Facility__c
                WHERE Active__c = true
                AND Facility__r.Name LIKE :searchLike
            ];
    
    
            Set<Id> facilityMatchedIds = new Set<Id>();
    
            for (Participant_Facility__c pf : matchedFacilities) {
                if (pf.Participant__c != null) {
                    facilityMatchedIds.add(pf.Participant__c);
                }
            }
    
    
            if (!facilityMatchedIds.isEmpty()) {
                filters.add('(Id IN :facilityMatchedIds)');
            }
        }
    
    
        // ============================================================
        // 2. ACTIVE / INACTIVE FILTER
        // ============================================================
    
        if (isActive != null) {
            filters.add('Status__c = :isActive');
        }
    
    
        // ============================================================
        // 3. CURRENT USER
        // ============================================================
    
        User loggedInUser = [SELECT Id, Email, User_Type__c FROM User
                            WHERE Id = :UserInfo.getUserId() LIMIT 1];
    
    
        // ============================================================
        // 4. PARTICIPANT ID SETS
        // ============================================================
    
        Set<Id> preferredParticipantIds = new Set<Id>();
    
        Set<Id> temporaryParticipantIds = new Set<Id>();
    
    
        // ============================================================
        // 5. NDIS STAFF
        // ============================================================
    
        if (loggedInUser.User_Type__c == 'NDIS Staff') {
    
    
            // ========================================================
            // 5A. GET LOGGED-IN STAFF
            // ========================================================
    
            Staff__c loginStaff = [SELECT Id FROM Staff__c
                WHERE Email_Address__c = :userEmail LIMIT 1];
    
    
            // ========================================================
            // 5B. FIRST QUERY:
            // GET PREFERRED PARTICIPANTS      
            //
            // Example:
            //
            // Staff 1
            //    |
            //    +-- P1
            //    +-- P2
            //    +-- P3
            //
            // preferredParticipantIds = {P1, P2, P3}
            //
            // ========================================================
    
            List<Participant_Staff_Association__c> participantAssociationList = [
                    SELECT Id, Participant__c, Staff__c, Active__c
                    FROM Participant_Staff_Association__c
                    WHERE Staff__c = :loginStaff.Id
                    AND Active__c = true
                ];
    
    
            for (Participant_Staff_Association__c psa :participantAssociationList) {
                if (psa.Participant__c != null) {
                    preferredParticipantIds.add(psa.Participant__c);
                }
            }
    
    
            // ========================================================
            // 5C. SHIFT DATE RANGE
            // ========================================================
            //
            // Today
            // Today - 1
            // Today - 2
            //
            // Example:
            // Today = 29 Sep
            //
            // Query:
            // 27 Sep
            // 28 Sep
            // 29 Sep
            //
            // ========================================================
    
            Date todayDate = Date.today();
    
            Date twoDaysBack = todayDate.addDays(-2);
    
    
     
            // 5D. QUERY STAFF SHIFTS
            List<ShiftwithStaff__c> eligibleShifts = [SELECT Id, Staff__c, Date__c, Status__c
                FROM ShiftwithStaff__c
                WHERE Staff__c = :loginStaff.Id
                AND Date__c >= :twoDaysBack
                AND Date__c <= :todayDate 
                AND Status__c IN ('Accepted','InProgress','Completed') AND Attendence__c = true AND Un_Assigned_Shift__c = false AND  Shift_Rejected__c =false
            ];
    
    
            // ========================================================
            // 5E. FIND SHIFTS THAT ARE CURRENTLY WITHIN 48 HOURS
            // ========================================================
    
            Set<Id> eligibleShiftIds = new Set<Id>();
    
            Datetime currentDateTime = System.now();
    
    
            for (ShiftwithStaff__c shift :eligibleShifts) {
                // Access starts at 12:01 AM on shift date
                Datetime accessStart = Datetime.newInstance(shift.Date__c, Time.newInstance(0,1,0,0));
    
                // Access expires after 48 hours
                Datetime accessEnd =accessStart.addHours(48);
    
                // Check whether current time is inside window  
                if (currentDateTime >= accessStart && currentDateTime < accessEnd) {
                    eligibleShiftIds.add(shift.Id);
                }
            }
    
    
            // ========================================================
            // 5F. GET PARTICIPANTS FROM SERVICES
            // ========================================================
            //
            // Example shift:
            //
            // Staff 1
            //    |
            //    +-- P1
            //    +-- P4
            //    +-- P5
            //
            // ========================================================
    
            if (!eligibleShiftIds.isEmpty()) {
    
    
                List<Services_and_Support_Plan__c> serviceList = [SELECT Id,Client__c,
                            ShiftwithStaff__c FROM Services_and_Support_Plan__c
                            WHERE ShiftwithStaff__c IN :eligibleShiftIds AND Client__c != null];
    
    
                // ====================================================
                // 5G. ADD ONLY NON-PREFERRED PARTICIPANTS
                // ====================================================
    
                for (Services_and_Support_Plan__c service : serviceList) {
                    if (service.Client__c == null) {
                        continue;
                    }
    
    
                    // ------------------------------------------------
                    // IMPORTANT:
                    //
                    // If participant is already preferred,
                    // DO NOT add to temporary list.
                    //
                    // Example:
                    //
                    // P1 = preferred
                    // P4 = non-preferred
                    // P5 = non-preferred
                    //
                    // Result:
                    //
                    // P1 -> SKIP
                    // P4 -> ADD
                    // P5 -> ADD
                    // ------------------------------------------------
    
                    if (
                        preferredParticipantIds.contains(
                            service.Client__c
                        )
                    ) {
    
                        continue;
                    }
    
    
                    // ------------------------------------------------
                    // Participant is non-preferred.
                    // Give temporary access.
                    // ------------------------------------------------
    
                    temporaryParticipantIds.add(
                        service.Client__c
                    );
                }
            }
    
    
            // ========================================================
            // 5H. FINAL ACCESSIBLE PARTICIPANTS
            // ========================================================
            //
            // Preferred:
            // P1, P2, P3
            //
            // Temporary:
            // P4, P5
            //
            // Final:
            // P1, P2, P3, P4, P5
            //
            // ========================================================
    
            Set<Id> accessibleParticipantIds = new Set<Id>();
    
    
            accessibleParticipantIds.addAll(preferredParticipantIds);
    
    
            accessibleParticipantIds.addAll(temporaryParticipantIds);
    
    
            // ========================================================
            // 5I. APPLY ACCESS FILTER
            // ========================================================
    
            if (!accessibleParticipantIds.isEmpty()) {
                filters.add('Id IN :accessibleParticipantIds');
            } else {
                filters.add('Id = null');
            }
        }
    
    
        // ============================================================
        // 6. NDIS PARTICIPANT USER
        // ============================================================
    
        if (loggedInUser.User_Type__c == 'NDIS Participants') {
    
            Set<Id> allowedParticipantIds = new Set<Id>();
    
    
            // --------------------------------------------------------
            // Participant email
            // --------------------------------------------------------
    
            for (Client__c c : [SELECT Id 
                 FROM Client__c WHERE Email__c = :loggedInUser.Email
            ]) {
                    allowedParticipantIds.add(c.Id);
            }
    
    
            // --------------------------------------------------------
            // Guardian email
            // --------------------------------------------------------
    
            for (
                Participant_Contact__c pc : [
                    SELECT Participant__c
                    FROM Participant_Contact__c
                    WHERE Email__c = :loggedInUser.Email
                    AND Contact_Type__c = 'Guardian'
                ]) {
                if (pc.Participant__c != null) {
                    allowedParticipantIds.add(pc.Participant__c);
                }
            }
    
            system.debug('allowedParticipantIds >>>>>>>>'+ allowedParticipantIds);
            if (!allowedParticipantIds.isEmpty()) {
                filters.add('Id IN :allowedParticipantIds');
    
            } else {
                filters.add('Id = null');
            }
        }
    
        ClientPaginationWrapper result = new ClientPaginationWrapper();
    
        String baseQuery;
    
        if (loggedInUser.User_Type__c != 'NDIS Participants') {
    
            /*
             * NDIS Staff
             *
             * Facility filter is still applied.
             *
             * Temporary participants are also allowed because they
             * have already been added to accessibleParticipantIds.
             */
    
            baseQuery =
                ' FROM Client__c WHERE Id IN (' +
                    'SELECT Participant__c ' +
                    'FROM Participant_Facility__c ' +
                    'WHERE Active__c = true ' +
                    'AND Facility__c != null ' +
                    'AND Facility__c IN :facilityIds' +
                ')';
    
        } else {
            baseQuery =
                ' FROM Client__c WHERE Id IN (' +
                    'SELECT Participant__c ' +
                    'FROM Participant_Facility__c ' +
                    'WHERE Active__c = true' +
                ')';
        }
    
    
        // ============================================================
        // 9. APPLY FILTERS
        // ============================================================
    
        if (!filters.isEmpty()) {
            baseQuery += ' AND ' + String.join( filters, ' AND ');
        }
    
    
        // ============================================================
        // 10. COUNT
        // ============================================================
    
        String countQuery = 'SELECT COUNT() ' + baseQuery;
    
        result.totalRecords = Database.countQuery(countQuery);
    
        // ============================================================
        // 11. PAGINATION
        // ============================================================
    
        Integer offsetVal = (pageNumber - 1) * pageSize;
    
    
        // ============================================================
        // 12. SORTING
        // ============================================================
    
        Map<String, String> sortFieldMap = new Map<String, String>{
                'fullName' => 'Display_Nickname__c',
                'Contact_Number__c' => 'Contact_Number__c',
                'Address__Street__s' => 'Address__Street__s',
                'activeFaciltyDisplay' => 'Facility__r.Name',
                'Participant_Status__c' => 'Participant_Status__c'
        };
    
    
        String orderByField = sortFieldMap.containsKey(sortField)
                ? sortFieldMap.get(sortField)
                : 'Display_Nickname__c';
    
        String orderDirection = sortDirection == 'desc' ? 'DESC' : 'ASC';
    
    
        // ============================================================
        // 13. MAIN QUERY
        // ============================================================
    
        String query =
            'SELECT ' +
            'Id, ' +
            'Participant_UID__c, ' +
            'Facility__r.Name, ' +
            'Facility__r.Type_of_Service__c, ' +
            'Facility__r.Status__c, ' +
            'Facility__r.Organisation__c, ' +
    
            'Email__c, ' +
            'Prefer_Nickname__c, ' +
            'Display_Nickname__c, ' +
            'ParticipantType__c, ' +
    
            'Company__c, ' +
            'Primary_Name__c, ' +
            'Secondary_Name__c, ' +
            'Name__c, ' +
    
            'AddressData__c, ' +
            'Address1__c, ' +
            'Address2__c, ' +
            'Picture__c, ' +
    
            'Organization_Name__c, ' +
            'First_Name__c, ' +
            'Last_Name__c, ' +
    
            'Facility__c, ' +
            'Facility_Name__c, ' +
            'Status__c, ' +
            'Status_A__c, ' +
    
            'Contact_Number__c, ' +
    
            'Address__Street__s, ' +
            'Address__City__s, ' +
            'Address__StateCode__s, ' +
            'Address__CountryCode__s, ' +
            'Address__PostalCode__s, ' +
    
            'Participant_Status__c, ' +
            'Risk_Status__c, ' +
    
    
            // --------------------------------------------------------
            // Risk Management
            // --------------------------------------------------------
    
            '(SELECT ' +
                'Id, ' +
                'Risk_Index__c, ' +
                'Name, ' +
                'Participant__c ' +
            'FROM Risk_Managements__r), ' +
    
    
            // --------------------------------------------------------
            // Participant Facilities
            // --------------------------------------------------------
    
            '(SELECT ' +
                'Id, ' +
                'Facility__c, ' +
                'Facility__r.Name, ' +
                'Active__c, ' +
                'Participant__c ' +
            'FROM Participant_Facilities__r ' +
            'WHERE Active__c = true), ' +
    
    
            // --------------------------------------------------------
            // Guardian Contacts
            // --------------------------------------------------------
    
            '(SELECT ' +
                'Id, ' +
                'Name, ' +
                'First_Name__c, ' +
                'Last_Name__c, ' +
                'Email__c, ' +
                'Contact_Number__c, ' +
                'Contact_Type__c, ' +
                'Notify__c ' +
            'FROM Participant_Contacts__r ' +
            'WHERE Contact_Type__c = \'Guardian\'), ' +
    
    
            // --------------------------------------------------------
            // Participant Staff Association
            // --------------------------------------------------------
            //
            // This is included under Client__c so the association
            // information is available with the participant.
            //
            // Replace Participant_Staff_Associations__r if the actual
            // child relationship name is different.
            // --------------------------------------------------------
    
            '(SELECT ' +
                'Id, ' +
                'Staff__c, ' +
                'Participant__c, ' +
                'Active__c ' +
            'FROM Participant_Staff_Associations__r ' +
            'WHERE Active__c = true) ' +
    
    
            baseQuery +
            ' ORDER BY ' + orderByField + ' ' + orderDirection +
            ' LIMIT :pageSize ' +
            ' OFFSET :offsetVal';
    
    
        // ============================================================
        // 14. EXECUTE
        // ============================================================
    
        result.records = Database.query(query);
    
        return result;
    }

        // apex method to fetch participant records from salesforce database 
   /* @AuraEnabled(cacheable = false)
    public static list<Client__c> fetchFacilitiess(string cname, Boolean isTrue){ 
         User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        System.Debug('Controller User ' + objUser.Organization_Name__c);
         String UserEmail = UserInfo.getUserEmail();
        list<Client__c> listOfClients = new list<Client__c>();
        String query =
                'SELECT Id,Participant_UID__c, ' +
                'Facility__r.Name, Facility__r.Type_of_Service__c, Facility__r.Status__c, ' +
                'Facility__r.Organisation__c, ' +
                'Email__c, Prefer_Nickname__c, Display_Nickname__c, ParticipantType__c,Unavailable_Start_Date__c,Unavailable_Date__c, ' +
                'Company__c, Primary_Name__c, Secondary_Name__c, Name__c, ' +
                'AddressData__c, Address1__c, Address2__c, Picture__c, ' +
                'Organization_Name__c, First_Name__c, Last_Name__c, ' +
                'Facility__c, Facility_Name__c, Status__c, Status_A__c, ' +
                'Contact_Number__c, ' +
                'Address__Street__s, Address__City__s, Address__StateCode__s, ' +
                'Address__CountryCode__s, Address__PostalCode__s, ' +
                'Participant_Status__c, Risk_Status__c, ' +

                '(SELECT Id, Risk_Index__c, Name, Participant__c FROM Risk_Managements__r), ' +

                '(SELECT Id, Facility__c, Facility__r.Name, Active__c, Participant__c ' +
                ' FROM Participant_Facilities__r WHERE Active__c = true), ' +

                '(SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, ' +
                ' Contact_Number__c, Contact_Type__c, Notify__c ' +
                ' FROM Participant_Contacts__r Where Contact_Type__c = \'Guardian\') ' +

                'FROM Client__c';
           
        System.debug('Participant firstname '+cname);   
         System.debug('isActive flag '+isTrue); 
        if (!string.isBlank(cname)) {
             cname = '%' + cname + '%';
             query += ' WHERE Name LIKE :cname';
        } else {
            if(!Test.isRunningTest()){
            Organisation__c orgD = [select Id,name from Organisation__c where name=:objUser.Organization_Name__c];                    
            
                String trucatedStr = string.valueof(orgD.Id).substring(0,15);
                query += ' where Organization_Name__c  =: trucatedStr';               
            }
        }
        if (isTrue == true) {
            Staff__c loginStaff=[select Id from Staff__c where Email_Address__c=: UserEmail];
            system.debug('login staff '+loginStaff.Id );
            list<Participant_Staff_Association__c>  participantAssociationList= [select id ,Staff__c ,Staff__r.Name ,Participant__c,participant__r.name, Active__c from Participant_Staff_Association__c where Staff__c=:loginStaff.Id AND Active__c = true];
            system.debug('particinat list '+participantAssociationList);
            list<Id> participantId= new list<id>();
            
            if(participantAssociationList.size()>0){
                for(Participant_Staff_Association__c ps:participantAssociationList){
                    participantId.add(ps.Participant__c);
                    
                } 
            }
            system.debug('participantId '+participantId);
           query += ' AND Status__c =:isTrue AND Id in:participantId ';
        }        
         
       // system.debug(' query '+query);
         system.debug(' size '+listOfClients.size());
        listOfClients=Database.query(query);
        system.debug(' list '+listOfClients);
         system.debug(' size '+listOfClients.size());
        return listOfClients;        
    }  */
    
   /* @AuraEnabled(cacheable=true)
    public static ClientPaginationWrapper fetchParticipantWithPagination( String searchText, List<Id> facilityIds, Boolean isTrue, Integer pageSize, Integer pageNumber, Integer refreshKey, Boolean isActive,String sortField,
    String sortDirection){ 
    system.debug('facilityIds >>>>>>>>>>>>>>>' + facilityIds);
    String userEmail = UserInfo.getUserEmail();

    List<String> filters = new List<String>();

    if (String.isNotBlank(searchText)) {
        String searchLike = '%' + searchText + '%';

        filters.add(
            '(' +
                ' Display_Nickname__c LIKE :searchLike ' +
                'OR Contact_Number__c LIKE :searchLike ' +
                'OR ParticipantType__c LIKE :searchLike' +
            ')'
        );

        // 🔥 Facility name search separately (adds IDs)
        List<Participant_Facility__c> matchedFacilities = [
            SELECT Participant__c
            FROM Participant_Facility__c
            WHERE Active__c = true
            AND Facility__r.Name LIKE :searchLike
        ];

        Set<Id> facilityMatchedIds = new Set<Id>();

        for (Participant_Facility__c pf : matchedFacilities) {
            if (pf.Participant__c != null) {
                facilityMatchedIds.add(pf.Participant__c);
            }
        }

        if (!facilityMatchedIds.isEmpty()) {
            filters.add('(Id IN :facilityMatchedIds)');
        }
    }
    if (isActive != null) {
       filters.add('Status__c = :isActive');
     }

    // 🏢 Facility filter (multi-select)
   /*  if (facilityIds != null && !facilityIds.isEmpty()) {
        filters.add(
            'Id IN (SELECT Participant__c FROM Participant_Facility__c ' +
            'WHERE Active__c = true AND Facility__c IN :facilityIds)'
        );
    } 

    User loggedInUser = [
            SELECT Id, Email, User_Type__c 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
        ];

    // 🔒 Existing logic (UNCHANGED)
    if (loggedInUser.User_Type__c == 'NDIS Staff') {
        system.debug('isTrue >>>>>>>>>>>>>>>' + isTrue);

        Staff__c loginStaff = [
            SELECT Id FROM Staff__c 
            WHERE Email_Address__c = :userEmail 
            LIMIT 1
        ];

        system.debug('isTrue >>>>>>>>>>>>>>>' + loginStaff.Id);

        List<Participant_Staff_Association__c> participantAssociationList = [
            SELECT Participant__c 
            FROM Participant_Staff_Association__c 
            WHERE Staff__c = :loginStaff.Id 
            AND Active__c = true
        ];

        

        List<Id> participantId = new List<Id>();

        for (Participant_Staff_Association__c ps : participantAssociationList) {
            system.debug('isTrue >>>>>>>>>>>>>>>' + ps);
            participantId.add(ps.Participant__c);
        }

        system.debug('isTrue >>>>>>>>>>>>>>>' + participantId);

        //filters.add('Status__c = :isTrue');

        if (!participantId.isEmpty()) {
            filters.add('Id IN :participantId');
        } else {
            filters.add('Id = null'); // no access
        }
    }
            

        if (loggedInUser.User_Type__c == 'NDIS Participants') {

            Set<Id> allowedParticipantIds = new Set<Id>();

            // 🔹 1. Match Client Email
            for (Client__c c : [
                SELECT Id 
                FROM Client__c 
                WHERE Email__c = :loggedInUser.Email
            ]) {
                allowedParticipantIds.add(c.Id);
            }

            // 🔹 2. Match Guardian Contact Email
            for (Participant_Contact__c pc : [
                SELECT Participant__c 
                FROM Participant_Contact__c 
                WHERE Email__c = :loggedInUser.Email
                AND Contact_Type__c = 'Guardian'
            ]) {
                if (pc.Participant__c != null) {
                    allowedParticipantIds.add(pc.Participant__c);
                }
            }

            system.debug('allowedParticipantIds >>>>>>>>'+ allowedParticipantIds);
            // 🔒 Apply restriction
            if (!allowedParticipantIds.isEmpty()) {
                filters.add('Id IN :allowedParticipantIds');
            } else {
                filters.add('Id = null'); // no access
            }
        }

       ClientPaginationWrapper result = new ClientPaginationWrapper();

        // 🔥 BASE QUERY (DEFAULT FACILITY FILTER APPLIED)
        String baseQuery;

        if(loggedInUser.User_Type__c != 'NDIS Participants'){
            baseQuery =
                ' FROM Client__c WHERE Id IN (' +
                'SELECT Participant__c FROM Participant_Facility__c ' +
                'WHERE Active__c = true AND Facility__c != null AND Facility__c IN :facilityIds ' +
                ')';
        } else {
            baseQuery =
                ' FROM Client__c WHERE Id IN (' +
                'SELECT Participant__c FROM Participant_Facility__c ' +
                'WHERE Active__c = true ' +
                ')';
        }

        // Append other filters
        if (!filters.isEmpty()) {
            baseQuery += ' AND ' + String.join(filters, ' AND ');
        }

        system.debug('baseQuery >>>>>>>'+ baseQuery);
        // 🔹 COUNT QUERY
        String countQuery = 'SELECT COUNT() ' + baseQuery;
        result.totalRecords = Database.countQuery(countQuery);


        // 🔹 OFFSET calculation
        Integer offsetVal = (pageNumber - 1) * pageSize;
        //manendra added for sorting the data in table
        Map<String, String> sortFieldMap = new Map<String, String>{
            'fullName' => 'Display_Nickname__c',
            'Contact_Number__c' => 'Contact_Number__c',
            'Address__Street__s' => 'Address__Street__s',
            'activeFaciltyDisplay' => 'Facility__r.Name',
            'Participant_Status__c' => 'Participant_Status__c'
        };

        String orderByField = sortFieldMap.containsKey(sortField)
            ? sortFieldMap.get(sortField)
            : 'Display_Nickname__c';

        String orderDirection = sortDirection == 'desc' ? 'DESC' : 'ASC';

            // 🔹 MAIN DATA QUERY
        String query =
            'SELECT Id,Participant_UID__c, ' +
            'Facility__r.Name, Facility__r.Type_of_Service__c, Facility__r.Status__c, ' +
            'Facility__r.Organisation__c, ' +
            'Email__c, Prefer_Nickname__c, Display_Nickname__c, ParticipantType__c, ' +
            'Company__c, Primary_Name__c, Secondary_Name__c, Name__c, ' +
            'AddressData__c, Address1__c, Address2__c, Picture__c, ' +
            'Organization_Name__c, First_Name__c, Last_Name__c, ' +
            'Facility__c, Facility_Name__c, Status__c, Status_A__c, ' +
            'Contact_Number__c, ' +
            'Address__Street__s, Address__City__s, Address__StateCode__s, ' +
            'Address__CountryCode__s, Address__PostalCode__s, ' +
            'Participant_Status__c, Risk_Status__c, ' +

            '(SELECT Id, Risk_Index__c, Name, Participant__c FROM Risk_Managements__r), ' +

            '(SELECT Id, Facility__c, Facility__r.Name, Active__c, Participant__c ' +
            ' FROM Participant_Facilities__r WHERE Active__c = true), ' +

            '(SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, ' +
            ' Contact_Number__c, Contact_Type__c, Notify__c ' +
            ' FROM Participant_Contacts__r WHERE Contact_Type__c = \'Guardian\') ' +

         /*    baseQuery +
            ' ORDER BY Display_Nickname__c ASC ' +
            ' LIMIT :pageSize OFFSET :offsetVal'; 
                baseQuery +
            ' ORDER BY ' + orderByField + ' ' + orderDirection +
            ' LIMIT :pageSize OFFSET :offsetVal';

        // 🔹 EXECUTE
        result.records = Database.query(query);

        return result;
} */
    public class ClientPaginationWrapper {
        @AuraEnabled public List<Client__c> records;
        @AuraEnabled public Integer totalRecords;
    }

}