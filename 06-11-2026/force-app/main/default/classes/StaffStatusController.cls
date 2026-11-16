public without sharing class StaffStatusController {
    //manendra added for BankTask
 
   @AuraEnabled
    public static Map<String, Object> getBankDetailsRequestData(Id taskId) {
        Map<String, Object> response = new Map<String, Object>();
        List<Task> tasks = [SELECT Id, Subject, Status, WhatId, Account_Name__c, Account_Number__c, BSB__c, Description FROM Task WHERE Id = :taskId LIMIT 1];
        if (tasks.isEmpty()) { throw new AuraHandledException('No Task found for Task Id: ' + taskId); }
        Task objTask = tasks[0];
        List<Staff__c> staffs = [SELECT Id, NameToDisplay__c, Account_Name__c, Account_Number__c, BSB__c,Xero_Employee_ID__c, (SELECT Id, RoleName__c, Active__c FROM StaffRoles__r WHERE Active__c = true ORDER BY RoleName__c) FROM Staff__c WHERE Id = :objTask.WhatId LIMIT 1];
        if (staffs.isEmpty()) { throw new AuraHandledException('No Staff found for WhatId: ' + objTask.WhatId); }
        Staff__c objStaff = staffs[0];
        List<String> roleNames = new List<String>();
        Set<String> uniqueRoles = new Set<String>();
        if (objStaff.StaffRoles__r != null) {
            for (StaffRole__c role : objStaff.StaffRoles__r) {
                if (String.isNotBlank(role.RoleName__c) && !uniqueRoles.contains(role.RoleName__c)) {
                    uniqueRoles.add(role.RoleName__c);
                    roleNames.add(role.RoleName__c);
                }
            }
        }
        response.put('task', objTask);
        response.put('staff', objStaff);
        response.put('staffRoles', roleNames);
        return response;
    }

    /* @AuraEnabled
    public static void updateBankDetailsRequest(Id taskId, String approverComments, String saveOption) {
        if (taskId == null) {
            throw new AuraHandledException('Task Id is required.');
        }

        // ============================================================
        // 1) Get the selected task and its shared reference
        // ============================================================
        List<Task> tasks = [
            SELECT Id, Status, WhatId,
                Account_Name__c, Account_Number__c, BSB__c,
                Bank_Request_Reference__c
            FROM Task
            WHERE Id = :taskId
            LIMIT 1
        ];

        if (tasks.isEmpty()) {
            throw new AuraHandledException('No Task found for Task Id: ' + taskId);
        }

        Task selectedTask = tasks[0];

        if (selectedTask.WhatId == null) {
            throw new AuraHandledException('Task does not have a Staff record.');
        }

        // ============================================================
        // 2) Fetch the Staff record with ALL fields required
        // ============================================================
        List<Staff__c> staffs = [
            SELECT Id, NameToDisplay__c, Name, Last_Name__c, Date_of_Birth__c,
                Email_Address__c, Contact_Number__c,
                address__Street__s, address__City__s,
                address__StateCode__s, Address__CountryCode__s, Address__PostalCode__s,
                Gender__c, Xero_Employee_ID__c,
                Job_Title__c,
                TFN_number__c,
                Residency_Status__c,
                Tax_Free_Threshold__c,
                Superannuation_Name__c,
                Superannuation_Number__c,
                Account_Name__c,
                BSB__c,
                Account_Number__c,
                (
                    SELECT Id, Type_of_Job__c, Primary__c
                    FROM StaffRoles__r
                    WHERE Primary__c = true
                    LIMIT 1
                )
            FROM Staff__c
            WHERE Id = :selectedTask.WhatId
            LIMIT 1
        ];

        if (staffs.isEmpty()) {
            throw new AuraHandledException('No Staff found for WhatId: ' + selectedTask.WhatId);
        }

        Staff__c objStaff = staffs[0];

        // 👇 FIXED: use objStaff, not staff
        String employmentBasis = 'FULLTIME';
        if (objStaff.StaffRoles__r != null && !objStaff.StaffRoles__r.isEmpty()) {
            StaffRole__c primaryRole = objStaff.StaffRoles__r[0];
            String typeOfJob = primaryRole.Type_of_Job__c;
            if (String.isNotBlank(typeOfJob)) {
                employmentBasis = mapEmploymentBasis(typeOfJob);
            }
        }

        Boolean taxFreeThreshold = true;
        if (String.isNotBlank(objStaff.Tax_Free_Threshold__c)) {
            String tft = objStaff.Tax_Free_Threshold__c.trim().toLowerCase();
            taxFreeThreshold = (tft == 'yes' || tft == 'true' || tft == '1');
        }

        // ============================================================
        // 3) Mark all related tasks as Completed
        // ============================================================
        List<Task> relatedTasks = [
            SELECT Id, Status, Approver_Comments__c
            FROM Task
            WHERE Bank_Request_Reference__c = :selectedTask.Bank_Request_Reference__c
        ];

        for (Task t : relatedTasks) {
            t.Status = 'Completed';
            t.Approver_Comments__c = approverComments;
        }

        if (!relatedTasks.isEmpty()) {
            update relatedTasks;
        }

        // ============================================================
        // 4) Apply bank details based on the selected save option
        // ============================================================
        if (saveOption == 'bothSystemAndXero') {

            objStaff.Account_Name__c   = selectedTask.Account_Name__c;
            objStaff.Account_Number__c = selectedTask.Account_Number__c;
            objStaff.BSB__c            = selectedTask.BSB__c;

            update objStaff;

            system.debug('objStaff.Xero_Employee_ID__c >>>>>>'+ objStaff.Xero_Employee_ID__c);

            try {
                if (String.isNotBlank(objStaff.Xero_Employee_ID__c)) {
                    String accessToken = XeroIntegrationController.getAccessTokenFromXero();
                    String tenantId    = XeroIntegrationController.getTenantId(accessToken);

                    XeroIntegrationController.updateXeroEmployee(
                        accessToken,
                        tenantId,
                        objStaff,
                        employmentBasis,
                        taxFreeThreshold
                    );

                    System.debug('✅ Bank details synced to Xero for Staff: ' + objStaff.Id);
                } else {
                    System.debug('ℹ️ Skipped Xero sync: Staff has no Xero_Employee_ID__c.');
                }
            } catch (Exception xeroEx) {
                System.debug('❌ Xero Sync Failed for Staff ' + objStaff.Id + ': ' + xeroEx.getMessage());
            }

        } else if (saveOption == 'onlyInSystem') {

            objStaff.Account_Name__c   = selectedTask.Account_Name__c;
            objStaff.Account_Number__c = selectedTask.Account_Number__c;
            objStaff.BSB__c            = selectedTask.BSB__c;

            update objStaff;

            System.debug('✅ Bank details updated only in the System for Staff: ' + objStaff.Id);
        }
    } */

    @AuraEnabled
    public static void updateBankDetailsRequest(Id taskId, String approverComments, String saveOption) {

        if (taskId == null) {
            throw new AuraHandledException('Task Id is required.');
        }

        // ============================================================
        // 1) Get the selected task and its shared reference
        // ============================================================
        List<Task> tasks = [
            SELECT Id, Status, WhatId,
                Account_Name__c, Account_Number__c, BSB__c,
                Bank_Request_Reference__c
            FROM Task
            WHERE Id = :taskId
            LIMIT 1
        ];

        if (tasks.isEmpty()) {
            throw new AuraHandledException('No Task found for Task Id: ' + taskId);
        }

        Task selectedTask = tasks[0];

        if (selectedTask.WhatId == null) {
            throw new AuraHandledException('Task does not have a Staff record.');
        }

        // ============================================================
        // 2) Fetch the Staff record with ALL fields required
        //    (including a clone-ready field set for the Xero payload)
        // ============================================================
        List<Staff__c> staffs = [
            SELECT Id, NameToDisplay__c, Name, Last_Name__c, Date_of_Birth__c,
                Email_Address__c, Contact_Number__c,
                address__Street__s, address__City__s,
                address__StateCode__s, Address__CountryCode__s, Address__PostalCode__s,
                Gender__c, Xero_Employee_ID__c,
                Job_Title__c,
                TFN_number__c,
                Residency_Status__c,
                Tax_Free_Threshold__c,
                Superannuation_Name__c,
                Superannuation_Number__c,
                Account_Name__c,
                BSB__c,
                Account_Number__c,
                (
                    SELECT Id, Type_of_Job__c, Primary__c
                    FROM StaffRoles__r
                    WHERE Primary__c = true
                    LIMIT 1
                )
            FROM Staff__c
            WHERE Id = :selectedTask.WhatId
            LIMIT 1
        ];

        if (staffs.isEmpty()) {
            throw new AuraHandledException('No Staff found for WhatId: ' + selectedTask.WhatId);
        }

        Staff__c objStaff = staffs[0];

        // -------- Derive employment basis --------
        String employmentBasis = 'FULLTIME';
        if (objStaff.StaffRoles__r != null && !objStaff.StaffRoles__r.isEmpty()) {
            String typeOfJob = objStaff.StaffRoles__r[0].Type_of_Job__c;
            if (String.isNotBlank(typeOfJob)) {
                employmentBasis = mapEmploymentBasis(typeOfJob);
            }
        }

        // -------- Derive tax-free threshold --------
        Boolean taxFreeThreshold = true;
        if (String.isNotBlank(objStaff.Tax_Free_Threshold__c)) {
            String tft = objStaff.Tax_Free_Threshold__c.trim().toLowerCase();
            taxFreeThreshold = (tft == 'yes' || tft == 'true' || tft == '1');
        }

        // ============================================================
        // 3) CALLOUT PHASE — must come BEFORE any DML
        //    If Xero fails, the exception bubbles up to the LWC and
        //    NOTHING is committed to the database (clean rollback).
        // ============================================================
        if (saveOption == 'bothSystemAndXero'
            && String.isNotBlank(objStaff.Xero_Employee_ID__c)) {

            // Build a "preview" clone of the staff sobject (in-memory only)
            // so Xero receives the new bank details without us saving them yet.
            Staff__c previewStaff = objStaff.clone(false, false, false, false);
            previewStaff.Id               = objStaff.Id;
            previewStaff.Account_Name__c  = selectedTask.Account_Name__c;
            previewStaff.Account_Number__c = selectedTask.Account_Number__c;
            previewStaff.BSB__c           = selectedTask.BSB__c;

            // Any exception from these three calls propagates to the LWC.
            String accessToken = XeroIntegrationController.getAccessTokenFromXero();
            String tenantId    = XeroIntegrationController.getTenantId(accessToken);

            XeroIntegrationController.updateXeroEmployee(accessToken, tenantId, previewStaff,employmentBasis, taxFreeThreshold );

            System.debug('✅ Xero callout succeeded for Staff: ' + objStaff.Id);
        }

        // ============================================================
        // 4) DML PHASE — only runs if ALL callouts succeeded above
        // ============================================================

        // ---- 4a) Apply bank details to Staff ----
        if (saveOption == 'bothSystemAndXero' || saveOption == 'onlyInSystem') {
            objStaff.Account_Name__c   = selectedTask.Account_Name__c;
            objStaff.Account_Number__c = selectedTask.Account_Number__c;
            objStaff.BSB__c            = selectedTask.BSB__c;
            update objStaff;
            System.debug('✅ Bank details updated for Staff: ' + objStaff.Id);
        }

        // ---- 4b) Mark all related tasks as Completed ----
        List<Task> relatedTasks = [
            SELECT Id, Status, Approver_Comments__c
            FROM Task
            WHERE Bank_Request_Reference__c = :selectedTask.Bank_Request_Reference__c
        ];

        for (Task t : relatedTasks) {
            t.Status = 'Completed';
            t.Approver_Comments__c = approverComments;
        }

        if (!relatedTasks.isEmpty()) {
            update relatedTasks;
            System.debug('✅ ' + relatedTasks.size() + ' related task(s) marked Completed.');
        }
    }

    public static String mapEmploymentBasis(String value) {
        if (String.isBlank(value)) return 'FULLTIME';
        
        String upperValue = value.toUpperCase();
        
        if (upperValue.contains('FULL') || upperValue.contains('FULL-TIME')) {
            return 'FULLTIME'; } else if (upperValue.contains('PART') || upperValue.contains('PART-TIME')) {return 'PARTTIME';} else if (upperValue.contains('CASUAL')) {return 'CASUAL';} else if (upperValue.contains('LABOUR') || upperValue.contains('HIRE')) { return 'LABOURHIRE';} else if (upperValue.contains('NON') || upperValue.contains('NON-EMPLOYEE')) { return 'NONEMPLOYEE';} else { return 'FULLTIME';}
    }

//end manendra added for BankTask
    @AuraEnabled
    public static Map<String, Integer> getStaffCounts(String userId, Id facilityId) {

        System.debug('userId=====> ' + userId);
        System.debug('facility=====> ' + facilityId);

        // Fetch the organization name associated with the user
        User userRecord = [
            SELECT Id, Name, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Map<String, Integer> staffCounts = new Map<String, Integer>();

        // Active Staff Count
        Integer activeCount = [
            SELECT COUNT()
            FROM Staff__c
            WHERE Status__c = true
            AND Organization_Full_Name__c = :userRecord.Organization_Name__c
            AND Id IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Facility__c = :facilityId
            )
        ];
        staffCounts.put('activeCount', activeCount);

        // Inactive Staff Count
        Integer inactiveCount = [
            SELECT COUNT()
            FROM Staff__c
            WHERE Status__c = false
            AND Organization_Full_Name__c = :userRecord.Organization_Name__c
            AND Id IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Facility__c = :facilityId
            )
        ];
        staffCounts.put('inactiveCount', inactiveCount);

        // Visa Expiry Staff Count
        Integer visaExpiryCount = [
            SELECT COUNT()
            FROM Staff__c
            WHERE Status__c = true
            AND Organization_Full_Name__c = :userRecord.Organization_Name__c
            AND Id IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Facility__c = :facilityId
            )
            AND Id IN (
                SELECT Staff__c
                FROM Child_Staff__c
                WHERE Expiry_Date__c < TODAY
            )
        ];
        staffCounts.put('visaExpiryCount', visaExpiryCount);

        // Staff on Vacation Count
        Integer vacationCount = [
            SELECT COUNT()
            FROM Staff__c
            WHERE Organization_Full_Name__c = :userRecord.Organization_Name__c
            AND Id IN (
                SELECT Staff__c
                FROM Staff_Facility__c
                WHERE Facility__c = :facilityId
            )
            AND Id IN (
                SELECT Staff__c
                FROM Leave__c
                WHERE Status__c = 'Approved'
                AND From__c <= TODAY
                AND To__c >= TODAY
            )
        ];
        staffCounts.put('vacationCount', vacationCount);

        return staffCounts;
    }
    
    @AuraEnabled
    public static Map<String, Integer> getClientCounts(String userId, Id facilityId) {
        
        System.debug('userId=====> ' + userId);
        System.debug('facilityId=====> ' + facilityId);
        User objUser = [ SELECT Phone, Id,Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
        System.Debug('Controller User ' + objUser.Organization_Name__c);
         String UserEmail = UserInfo.getUserEmail();
        Organisation__c orgD = [select Id,name from Organisation__c where name=:objUser.Organization_Name__c];
        String trucatedStr = string.valueof(orgD.Id).substring(0,15);
        system.debug('trucatedStr===>'+trucatedStr); 
        list<Client__c> listOfClients = new list<Client__c>();           
        
        Map<String, Integer> staffCounts = new Map<String, Integer>();

        // Query count for Active Clients
        Integer activeCount = [SELECT COUNT() 
                               FROM Client__c 
                               WHERE Status__c = true
                               AND Organization_Name__c = :trucatedStr
                               //AND Facility__c =:facilityId];
                               AND Id IN (
                                   SELECT Participant__c
                                   FROM Participant_Facility__c
                                   WHERE Facility__c = :facilityId
                                   AND Active__c = true
                               )];
        staffCounts.put('activeCount', activeCount);
        system.debug('activeCount===>'+activeCount);

        // Query count for Inactive Clients
        Integer inactiveCount = [SELECT COUNT() 
                                 FROM Client__c 
                                 WHERE Status__c = false
                                  //AND Facility__c =:facilityId
                                 AND Organization_Name__c = :trucatedStr
                                 AND Id IN (
                                    SELECT Participant__c
                                    FROM Participant_Facility__c
                                    WHERE Facility__c = :facilityId
                                    AND Active__c = true
                                )];
        staffCounts.put('inactiveCount', inactiveCount);
        system.debug('inactiveCount===>'+inactiveCount);

        return staffCounts;
    }

    public class StaffStatusWrapper {
        @AuraEnabled public Id id;
        @AuraEnabled public String name;
        @AuraEnabled public String email;
        @AuraEnabled public String contactNumber;
        @AuraEnabled public String roleNames;
        @AuraEnabled public List<Child_Staff__c> documents;
    }

    @AuraEnabled
    public static List<StaffStatusWrapper> getStaffDetailsByStatus(String status, Id facilityId) {

        User userRecord = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        List<Staff__c> staffList = new List<Staff__c>();

        if (status == 'active') {

            staffList = [
                SELECT Id,
                    NameToDisplay__c,
                    Email_Address__c,
                    Contact_Number__c,
                    (
                        SELECT RoleName__c
                        FROM StaffRoles__r
                    )
                FROM Staff__c
                WHERE Status__c = true
                AND Organization_Full_Name__c = :userRecord.Organization_Name__c
                AND Id IN (
                    SELECT Staff__c
                    FROM Staff_Facility__c
                    WHERE Facility__c = :facilityId
                )
                ORDER BY NameToDisplay__c ASC                
            ];

        }

        else if (status == 'inactive') {

            staffList = [
                SELECT Id,
                    NameToDisplay__c,
                    Email_Address__c,
                    Contact_Number__c,
                    (
                        SELECT RoleName__c
                        FROM StaffRoles__r
                    )
                FROM Staff__c
                WHERE Status__c = false
                AND Organization_Full_Name__c = :userRecord.Organization_Name__c
                AND Id IN (
                    SELECT Staff__c
                    FROM Staff_Facility__c
                    WHERE Facility__c = :facilityId
                )
            ];

        }

        else if (status == 'visaExpiry') {

            staffList = [
                SELECT Id,
                    NameToDisplay__c,
                    Email_Address__c,
                    Contact_Number__c,
                    (
                        SELECT RoleName__c
                        FROM StaffRoles__r
                    ),
                    (
                        SELECT Id,
                            File_Name__c,
                            Expiry_Date__c,
                            Document_Type__c
                        FROM Child_Staffs__r
                        WHERE Expiry_Date__c < TODAY
                    )
                FROM Staff__c
                WHERE Status__c = true
                AND Organization_Full_Name__c = :userRecord.Organization_Name__c
                AND Id IN (
                    SELECT Staff__c
                    FROM Staff_Facility__c
                    WHERE Facility__c = :facilityId
                )
                AND Id IN (
                    SELECT Staff__c
                    FROM Child_Staff__c
                    WHERE Expiry_Date__c < TODAY
                )
            ];

        }
        else if (status == 'vacation') {

            staffList = [
                SELECT Id,
                    NameToDisplay__c,
                    Email_Address__c,
                    Contact_Number__c,
                    (
                        SELECT RoleName__c
                        FROM StaffRoles__r
                    )
                FROM Staff__c
                WHERE Organization_Full_Name__c = :userRecord.Organization_Name__c
                AND Id IN (
                    SELECT Staff__c
                    FROM Staff_Facility__c
                    WHERE Facility__c = :facilityId
                )
                AND Id IN (
                    SELECT Staff__c
                    FROM Leave__c
                    WHERE Status__c = 'Approved'
                    AND From__c <= TODAY
                    AND To__c >= TODAY
                )
            ];

        }

        List<StaffStatusWrapper> result = new List<StaffStatusWrapper>();

        for (Staff__c staff : staffList) {

            StaffStatusWrapper wrapper = new StaffStatusWrapper();

            wrapper.id = staff.Id;
            wrapper.name = staff.NameToDisplay__c;
            wrapper.email = staff.Email_Address__c;
            wrapper.contactNumber = staff.Contact_Number__c;
            wrapper.documents = staff.Child_Staffs__r;

            List<String> roles = new List<String>();

            if (staff.StaffRoles__r != null) {
                for (StaffRole__c role : staff.StaffRoles__r) {
                    if (String.isNotBlank(role.RoleName__c)) {
                        roles.add(role.RoleName__c.trim());
                    }
                }
            }

            wrapper.roleNames = String.join(roles, ', ');

            result.add(wrapper);
        }
        return result;
    }
}