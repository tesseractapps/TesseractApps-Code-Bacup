public with sharing class IncidentInvestigationController {

    public class DashboardWrapper {
        @AuraEnabled public List<Incident_Register_Response__c> records { get; set; }
        @AuraEnabled public List<KpiCard> kpis { get; set; }
        @AuraEnabled public Map<String, String> clientNames { get; set; }
    }

    public class KpiCard {
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public Integer count { get; set; }
        @AuraEnabled public String filterType { get; set; }
        @AuraEnabled public String cardClass { get; set; }

        public KpiCard(String label, Integer count, String filterType, String cardClass) {
            this.label = label;
            this.count = count;
            this.filterType = filterType;
            this.cardClass = cardClass;
        }
    }

    public class InvestigationWrapper {
        @AuraEnabled public Incident_Investigation__c investigation { get; set; }
        @AuraEnabled public List<Incident_Corrective_Action__c> correctiveActions { get; set; }
        @AuraEnabled public List<Incident_NDIS_Submission__c> ndisSubmissions { get; set; }
    }

    /**
     * Fetch Dashboard Details & KPI metrics for Screen 1.
     */
    @AuraEnabled(cacheable=true)
    public static DashboardWrapper getDashboardData(String activeFilter) {
        DashboardWrapper result = new DashboardWrapper();
        
        // Base Query
        String queryStr = 'SELECT Id, Incident_UID__c, Name__c, Form_Type__c, Status__c, Client_Id__c, ' +
                          'Incident_Assigned_Staff__c, Incident_Assigned_Staff__r.NameToDisplay__c, Severity__c, ' +
                          'NDIS_Reportable__c, Next_Action__c, Next_Due__c, Open_Actions__c, CreatedDate ' +
                          'FROM Incident_Register_Response__c ';
        
        List<String> conditions = new List<String>();

        // KPI Counts
        Integer openCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Status__c = 'Open' WITH USER_MODE];
        Integer reportableCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE NDIS_Reportable__c = 'Yes' WITH USER_MODE];
        Integer progressCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Status__c = 'In Progress' WITH USER_MODE];
        Integer resolvedCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Status__c = 'Resolved' WITH USER_MODE];
        Integer overdueCount = [SELECT COUNT() FROM Incident_Register_Response__c WHERE Next_Due__c < :System.today() AND Status__c != 'Resolved' WITH USER_MODE];

        if (activeFilter == 'Open') {
            conditions.add('Status__c = \'Open\'');
        } else if (activeFilter == 'Reportable') {
            conditions.add('NDIS_Reportable__c = \'Yes\'');
        } else if (activeFilter == 'In Progress') {
            conditions.add('Status__c = \'In Progress\'');
        } else if (activeFilter == 'Resolved') {
            conditions.add('Status__c = \'Resolved\'');
        } else if (activeFilter == 'Overdue') {
            conditions.add('Next_Due__c < TODAY AND Status__c != \'Resolved\'');
        }

        if (!conditions.isEmpty()) {
            queryStr += ' WHERE ' + String.join(conditions, ' AND ');
        }
        queryStr += ' ORDER BY CreatedDate DESC LIMIT 1000';

        result.records = Database.query(queryStr, AccessLevel.USER_MODE);

        result.kpis = new List<KpiCard>{
            new KpiCard('Open', openCount, 'Open', 'kpi-card kpi-open'),
            new KpiCard('Reportable', reportableCount, 'Reportable', 'kpi-card kpi-reportable'),
            new KpiCard('Overdue', overdueCount, 'Overdue', 'kpi-card kpi-overdue'),
            new KpiCard('In Progress', progressCount, 'In Progress', 'kpi-card kpi-progress'),
            new KpiCard('Resolved', resolvedCount, 'Resolved', 'kpi-card kpi-resolved')
        };

        // Map Client names (since Client_Id__c is a Text field)
        Set<String> clientIds = new Set<String>();
        for (Incident_Register_Response__c rec : result.records) {
            if (rec.Client_Id__c != null) {
                clientIds.add(rec.Client_Id__c);
            }
        }
        Map<String, String> clientMap = new Map<String, String>();
        if (!clientIds.isEmpty()) {
            for (Client__c c : [SELECT Id, Name FROM Client__c WHERE Id IN :clientIds WITH USER_MODE]) {
                clientMap.put(String.valueOf(c.Id), c.Name);
            }
        }
        result.clientNames = clientMap;

        return result;
    }

    @AuraEnabled(cacheable=true)
    public static InvestigationWrapper getInvestigationData(Id responseId) {
        InvestigationWrapper result = new InvestigationWrapper();

        List<Incident_Investigation__c> invs = IncidentSelector.selectInvestigationsByResponseIds(new Set<Id>{responseId});
        if (invs.isEmpty()) {
            result.investigation = null;
            result.correctiveActions = new List<Incident_Corrective_Action__c>();
            result.ndisSubmissions = new List<Incident_NDIS_Submission__c>();
        } else {
            Incident_Investigation__c inv = invs[0];
            result.investigation = inv;
            result.correctiveActions = IncidentSelector.selectCorrectiveActionsByInvestigation(inv.Id);
            result.ndisSubmissions = IncidentSelector.selectNdisSubmissionsByInvestigation(inv.Id);
        }

        return result;
    }

    /**
     * Clicking "Start Assessment" on Screen 2.
     */
    @AuraEnabled
    public static Incident_Investigation__c startAssessment(Id responseId, Id investigatorId) {
        try {
            return IncidentInvestigationService.startInvestigation(responseId, investigatorId);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Save/Save Changes click in Screen 3.
     */
    @AuraEnabled
    public static void saveInvestigationAssessment(Incident_Investigation__c inv) {
        try {
            IncidentInvestigationService.saveAssessment(inv);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Add action in Screen 3 workspace.
     */
    // @AuraEnabled
    // public static Incident_Corrective_Action__c saveCorrectiveAction(Incident_Corrective_Action__c action) {
    //     try {
    //         return IncidentInvestigationService.addCorrectiveAction(action);
    //     } catch(Exception e) {
    //         throw new AuraHandledException(e.getMessage());
    //     }
    // }

    /**
     * Complete corrective action.
     */
    @AuraEnabled
    public static void completeAction(Id actionId, String notes, String awsKey) {
        try {
            IncidentInvestigationService.completeCorrectiveAction(actionId, notes, awsKey);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Record submission popup in Screen 4.
     */
    // @AuraEnabled
    // public static Incident_NDIS_Submission__c saveNdisSubmission(Incident_NDIS_Submission__c sub) {
    //     try {
    //         return IncidentInvestigationService.recordNdisSubmission(sub);
    //     } catch(Exception e) {
    //         throw new AuraHandledException(e.getMessage());
    //     }
    // }

    public class ActionRegisterWrapper {
        @AuraEnabled public List<Incident_Corrective_Action__c> records { get; set; }
        @AuraEnabled public Map<String, Integer> kpiCounts { get; set; }
    }

    // @AuraEnabled(cacheable=true)
    // public static ActionRegisterWrapper getActionRegisterData(String activeFilter) {
    //     ActionRegisterWrapper result = new ActionRegisterWrapper();
        
    //     Date today = System.today();
        
    //     Integer openCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Status__c = 'Open' WITH USER_MODE];
    //     Integer progressCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Status__c = 'In Progress' WITH USER_MODE];
    //     Integer completedCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Status__c = 'Completed' WITH USER_MODE];
    //     Integer overdueCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Due_Date__c < :today AND Status__c != 'Completed' WITH USER_MODE];
    //     Integer weekCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Due_Date__c = THIS_WEEK AND Status__c != 'Completed' WITH USER_MODE];
        
    //     result.kpiCounts = new Map<String, Integer>{
    //         'Open' => openCount,
    //         'In Progress' => progressCount,
    //         'Completed' => completedCount,
    //         'Overdue' => overdueCount,
    //         'Due This Week' => weekCount
    //     };
        
    //     String queryStr = 'SELECT Id, Incident_Investigation__c, Incident_Investigation__r.Incident_Response__c, ' +
    //                       'Incident_Investigation__r.Incident_Response__r.Name, ' +
    //                       'Action_Title__c, Assigned_Owner__c, Assigned_Owner__r.Name, ' +
    //                       'Due_Date__c, Status__c, Completion_Date__c, Notes__c, AWS_Evidence_Key__c, LastModifiedDate ' +
    //                       'FROM Incident_Corrective_Action__c';
                           
    //     List<String> conditions = new List<String>();
    //     if (activeFilter == 'Open') {
    //         conditions.add('Status__c = \'Open\'');
    //     } else if (activeFilter == 'In Progress') {
    //         conditions.add('Status__c = \'In Progress\'');
    //     } else if (activeFilter == 'Completed') {
    //         conditions.add('Status__c = \'Completed\'');
    //     } else if (activeFilter == 'Overdue') {
    //         conditions.add('Due_Date__c < TODAY AND Status__c != \'Completed\'');
    //     } else if (activeFilter == 'Due This Week') {
    //         conditions.add('Due_Date__c = THIS_WEEK AND Status__c != \'Completed\'');
    //     }
        
    //     if (!conditions.isEmpty()) {
    //         queryStr += ' WHERE ' + String.join(conditions, ' AND ');
    //     }
    //     queryStr += ' ORDER BY Due_Date__c ASC LIMIT 1000';
        
    //     result.records = Database.query(queryStr, AccessLevel.USER_MODE);
    //     return result;
    // }

    @AuraEnabled
    public static void updateCorrectiveAction(Id actionId, String status, String notes, String description, List<Object> attachments) {    //   ,String awsKey
        try {
            List<Incident_Corrective_Action__c> actions = [
                SELECT Id, Incident_Investigation__c, Status__c, Completion_Date__c, Notes__c, AWS_Evidence_Key__c,Description__c,Action_Title__c
                FROM Incident_Corrective_Action__c
                WHERE Id = :actionId
                //WITH USER_MODE
                LIMIT 1
            ];
            if (actions.isEmpty()) {
                throw new AuraHandledException('Action record not found.');
            }
            Incident_Corrective_Action__c act = actions[0];
            String previousStatus = act.Status__c;
            Boolean isNewlyCompleted = (status == 'Completed' && previousStatus != 'Completed');
        
            act.Status__c = status;
            act.Notes__c = notes;
            //act.AWS_Evidence_Key__c = awsKey;
            act.Description__c = description;
            if (isNewlyCompleted) {
                act.Completion_Date__c = System.today();
            }
            
           // Database.update(act, true, AccessLevel.USER_MODE);
           update act;

           List<Incident_Evidence__c> evidenceRecords =  new List<Incident_Evidence__c>();

           if (attachments != null && !attachments.isEmpty()) {
                for (Object attachmentObj : attachments) {

                   // Map<String, Object> attachmentData = (Map<String, Object>) attachmentObj;
                   Map<String, Object> attachmentData =
                            (Map<String, Object>) JSON.deserializeUntyped(
                                JSON.serialize(attachmentObj)
                            );

                    if (attachmentData == null) {
                        continue;
                    }

                    Incident_Evidence__c evidence = new Incident_Evidence__c();

                    String evidenceId = (String) attachmentData.get('Id');
                    if (!String.isBlank(evidenceId)) {
                        evidence.Id = evidenceId;
                    } else {
                        evidence.Incident_Investigation__c = act.Incident_Investigation__c;
                        evidence.Incident_Corrective_Action__c= actionId;
                    }

                    evidence.Attachment_Name__c = (String) attachmentData.get('Attachment_Name__c');
                    evidence.File_Name__c = (String) attachmentData.get('File_Name__c');
                    evidence.Type__c = (String) attachmentData.get('Type__c');
                    String uploadedById = (String) attachmentData.get( 'Uploaded_By__c');

                    if (!String.isBlank(uploadedById)) {
                        evidence.Uploaded_By__c =(Id) uploadedById;
                    }
                    evidence.AWS_File_Key__c = (String) attachmentData.get('AWS_File_Key__c');
                    evidence.AWS_File_URL__c =(String) attachmentData.get( 'AWS_File_URL__c');
                    evidence.Evidence_Type__c =(String) attachmentData.get('Evidence_Type__c');

                    evidenceRecords.add(evidence);
                }
            }

            if (!evidenceRecords.isEmpty()) {
                upsert evidenceRecords;
            }
            if ( act.Incident_Investigation__c != null ) {

                Id responseIdForLog = getResponseIdFromInvestigation( act.Incident_Investigation__c );
                String logContent ='Corrective Action updated';

                if (!evidenceRecords.isEmpty()) {
                    List<String> names = new List<String>();

                    for ( Incident_Evidence__c ev : evidenceRecords ) {

                        if (String.isNotBlank( ev.Attachment_Name__c)){
                             names.add(ev.Attachment_Name__c);
                        }
                    }

                    if (!names.isEmpty()) {

                        logContent += ' — Attachments: ' + String.join(names, ', ');
                    }
                }

            appendHistoryLog(
                responseIdForLog,
                'Corrective Action Updated',
                logContent
            );
            if (isNewlyCompleted) {

                appendHistoryLog(
                    responseIdForLog,
                    'Corrective Action Completed',
                    '"' + act.Action_Title__c + '" was marked as Completed on ' + act.Completion_Date__c.format() + '.'
                );

                notifyInvestigatorOfCompletedAction(act.Incident_Investigation__c, act.Action_Title__c, responseIdForLog);
            }
        }

        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    @AuraEnabled
    public static Incident_Register_Response__c getIncidentResponseForAssessment(
        Id responseId
    ) {
        if (responseId == null) {
            // throw new AuraHandledException(
            //     'Incident Response Id is required.'
            // );

        }

        List<Incident_Register_Response__c> records = [
            SELECT
                Id,
                Name,
                Name__c,
                //Incident_UID__c,
                Form_Type__c,
                Response_JSON__c,

                CreatedDate,
                CreatedById,
                CreatedBy.Name,
                CreatedBy.Full_Name__c,

                LastModifiedDate,
                LastModifiedById,
                LastModifiedBy.Name,
                LastModifiedBy.Full_Name__c,

                Client_Id__c,
                Org_Id__c,

                Participant__c,
                Participant__r.Name__c,
                Participant__r.Picture__c,

                Facility__c,
                Facility__r.Name,

                Assigned_Staff__c,
                Incident_Assigned_Staff__c,
                Incident_Assigned_Staff__r.Name,
                Incident_Assigned_Staff__r.NameToDisplay__c,
                Incident_Assigned_Staff__r.Picture__c,

                Status__c,
                Severity__c,
                NDIS_Reportable__c,

                Incident_Form__c,
                History_Log__c

            FROM Incident_Register_Response__c
            WHERE Id = :responseId
            LIMIT 1
        ];

        if (records.isEmpty()) {
            // throw new AuraHandledException(
            //     'Incident response record was not found.'
            // );
        }

        return records[0];
    }

    // @AuraEnabled
    // public static Id saveInvestigation(Map<String, Object> investigationData) {
    //     if (investigationData == null || investigationData.get('Id') == null) {
    //         throw new AuraHandledException('Investigation Id is required to update the assessment.');
    //     }

    //     String statusValue = (String) investigationData.get('Status__c');
    //     Boolean isResolved = statusValue == 'Resolved';

    //     Incident_Investigation__c investigation = new Incident_Investigation__c(
    //         Id = (Id) investigationData.get('Id')
    //     );

    //     investigation.NDIS_Reportable__c = (String) investigationData.get('NDIS_Reportable__c');
    //     investigation.Assessment_Notes__c = (String) investigationData.get('Assessment_Notes__c');
    //     investigation.Findings_Summary__c = (String) investigationData.get('Findings_Summary__c');
    //     investigation.Status__c = statusValue;
    //     investigation.Assigned_Investigator__c = (String) investigationData.get('Assigned_Investigator__c');
    //     investigation.Severity__c = (String) investigationData.get('Severity__c');

    //     // Final Notes / Acknowledgement are only meaningful — and only required — when resolving
    //     investigation.Final_Notes__c = isResolved ? (String) investigationData.get('Final_Notes__c') : '';
    //     investigation.Acknowledged__c = isResolved ? (Boolean) investigationData.get('acknowledged') : false;

    //     try {
    //         update investigation;
    //     } catch (Exception e) {
    //         System.debug('Error updating Incident Investigation: ' + e.getMessage());
    //         throw new AuraHandledException('Unable to save the incident investigation. Please try again.');
    //     }

    //     return investigation.Id;
    // }
     @AuraEnabled
    public static Id saveInvestigation(Map<String, Object> investigationData) {
        if (investigationData == null || investigationData.get('Id') == null) {
            throw new AuraHandledException('Investigation Id is required to update the assessment.');
        }
        Id investigationId = (Id) investigationData.get('Id');

        List<Incident_Investigation__c> existingList = [
            SELECT Id, Incident_Response__c, NDIS_Reportable__c, Assessment_Notes__c,
                Findings_Summary__c, Acknowledged__c,Final_Notes__c,Assigned_Investigator__c,Incident_Response__r.NDIS_Reportable__c
            FROM Incident_Investigation__c
            WHERE Id = :investigationId
            LIMIT 1
        ];
        if (existingList.isEmpty()) {
            throw new AuraHandledException('Investigation record not found.');
        }
        Incident_Investigation__c existing = existingList[0];

        String statusValue = (String) investigationData.get('Status__c');
        Boolean isResolved = statusValue == 'Resolved';

        Incident_Investigation__c investigation = new Incident_Investigation__c(
            Id = investigationId
        );

        investigation.NDIS_Reportable__c = (String) investigationData.get('NDIS_Reportable__c');
        investigation.Assessment_Notes__c = (String) investigationData.get('Assessment_Notes__c');
        investigation.Findings_Summary__c = (String) investigationData.get('Findings_Summary__c');
        investigation.Status__c = statusValue;
        investigation.Assigned_Investigator__c = (String) investigationData.get('Assigned_Investigator__c');
        investigation.Severity__c = (String) investigationData.get('Severity__c');

        // Final Notes / Acknowledgement are only meaningful — and only required — when resolving
        investigation.Final_Notes__c = isResolved ? (String) investigationData.get('Final_Notes__c') : '';
        investigation.Acknowledged__c = isResolved ? (Boolean) investigationData.get('acknowledged') : false;

        try {
            update investigation;
        } catch (DmlException e) {
            //String errorMsg = e.getDmlMessage(0);
            List<String> msgs = new List<String>();          
            for (Integer i = 0; i < e.getNumDml(); i++) {     
                msgs.add(e.getDmlMessage(i));                 
            }
            String errorMsg = String.join(msgs, ' '); 
            AuraHandledException ahe = new AuraHandledException(errorMsg);
            ahe.setMessage(errorMsg);
            throw ahe;
            
        } catch (Exception e) {
            System.debug('Error updating Incident Investigation: ' + e.getMessage());
            throw new AuraHandledException('Unable to save the incident investigation. Please try again.');
        }
       String responseCurrentVal = existing.Incident_Response__r != null
        ? existing.Incident_Response__r.NDIS_Reportable__c
        : null;

        if (existing.Incident_Response__c != null
            && String.isNotBlank(investigation.NDIS_Reportable__c)
            && investigation.NDIS_Reportable__c != responseCurrentVal) {

            try {
                update new Incident_Register_Response__c(
                    Id = existing.Incident_Response__c,
                    NDIS_Reportable__c = investigation.NDIS_Reportable__c
                );
                System.debug('✅ Synced NDIS_Reportable__c to Response: ' + existing.Incident_Response__c);
            } catch (Exception e) {
                System.debug('⚠️ Failed to sync NDIS_Reportable__c to Response: ' + e.getMessage());
            }
        }
        List<String> changes = new List<String>();
        if (String.isNotBlank(existing.NDIS_Reportable__c) && existing.NDIS_Reportable__c != investigation.NDIS_Reportable__c) {
            changes.add('NDIS Reportable: \'' + safe(existing.NDIS_Reportable__c) + '\' → \'' + safe(investigation.NDIS_Reportable__c) + '\'');
        }
        if ( String.isNotBlank(existing.Assessment_Notes__c) && existing.Assessment_Notes__c != investigation.Assessment_Notes__c) {
            changes.add('Assessment Notes updated');
        }
        if ( String.isNotBlank(existing.Findings_Summary__c) && existing.Findings_Summary__c != investigation.Findings_Summary__c) {
            changes.add('Findings updated');
        }
        if (String.isNotBlank(existing.Final_Notes__c) && existing.Final_Notes__c != investigation.Final_Notes__c) {
            changes.add('Final Notes updated');
        }
        if (isResolved && existing.Acknowledged__c != investigation.Acknowledged__c) {
            changes.add('Incident acknowledged and resolved');
        }

        if (!changes.isEmpty()) {
            appendHistoryLog(existing.Incident_Response__c, 'Investigation Updated', String.join(changes, '; '));
        }
        if (String.isNotBlank(investigation.Assigned_Investigator__c)
            && existing.Assigned_Investigator__c != investigation.Assigned_Investigator__c) {
                createAssignmentNotification(existing.Incident_Response__c, investigation.Assigned_Investigator__c);
        }

        return investigation.Id;
    }
    // @AuraEnabled
    // public static List<Id> saveIncidentEvidence(List<Object> attachments) {
    //     if (attachments == null || attachments.isEmpty()) {
    //         throw new AuraHandledException('Attachment data is required.');
    //     }

    //     List<Incident_Evidence__c> evidenceRecords = new List<Incident_Evidence__c>();

    //     for (Object attachmentObj : attachments) {
    //          if (attachmentObj == null) {
    //             continue;
    //         }
    //         Map<String, Object> attachmentData =
    //                 (Map<String, Object>) JSON.deserializeUntyped(
    //                     JSON.serialize(attachmentObj)
    //                 );


    //         if (attachmentData == null) {
    //             continue;
    //         }

    //         Incident_Evidence__c evidence = new Incident_Evidence__c();
    //         String evidenceId = (String) attachmentData.get('Id');

    //         if (String.isNotBlank(evidenceId)) {
    //             evidence.Id = evidenceId;
    //         } else {
    //             Id investigationId = (Id) attachmentData.get('Incident_Investigation__c');
    //             if (investigationId == null) {
    //                 throw new AuraHandledException('Incident Investigation is required to save an attachment.');
    //             }
    //             evidence.Incident_Investigation__c = investigationId;
    //         }

    //         evidence.Attachment_Name__c = (String) attachmentData.get('Attachment_Name__c');
    //         evidence.File_Name__c = (String) attachmentData.get('File_Name__c');
    //         evidence.Type__c = (String) attachmentData.get('Type__c');
    //         evidence.Evidence_Type__c = (String) attachmentData.get('Evidence_Type__c');

    //         String uploadedById = (String) attachmentData.get('Uploaded_By__c');
    //         if (String.isNotBlank(uploadedById)) {
    //             evidence.Uploaded_By__c = (Id) uploadedById;
    //         }

    //         evidence.AWS_File_Key__c = (String) attachmentData.get('AWS_File_Key__c');
    //         evidence.AWS_File_URL__c = (String) attachmentData.get('AWS_File_URL__c');

    //         evidenceRecords.add(evidence);
    //     }

    //     try {
    //         upsert evidenceRecords;
    //     } catch (Exception e) {
    //         throw new AuraHandledException('Unable to save the attachments. Please try again.');
    //     }

    //     return new List<Id>(new Map<Id, Incident_Evidence__c>(evidenceRecords).keySet());
    // }
     @AuraEnabled
    public static List<Incident_Evidence__c> saveIncidentEvidence(List<Object> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            throw new AuraHandledException('Attachment data is required.');
        }

        List<Incident_Evidence__c> evidenceRecords = new List<Incident_Evidence__c>();
        List<String> newAttachmentNames = new List<String>();
        Id investigationIdForLog;

        for (Object attachmentObj : attachments) {
             if (attachmentObj == null) {
                continue;
            }
            Map<String, Object> attachmentData =
                    (Map<String, Object>) JSON.deserializeUntyped(
                        JSON.serialize(attachmentObj)
                    );


            if (attachmentData == null) {
                continue;
            }

            Incident_Evidence__c evidence = new Incident_Evidence__c();
            String evidenceId = (String) attachmentData.get('Id');

            if (String.isNotBlank(evidenceId)) {
                evidence.Id = evidenceId;
            } else {
                Id investigationId = (Id) attachmentData.get('Incident_Investigation__c');
                if (investigationId == null) {
                    throw new AuraHandledException('Incident Investigation is required to save an attachment.');
                }
                evidence.Incident_Investigation__c = investigationId;
                investigationIdForLog = investigationId;
                newAttachmentNames.add((String) attachmentData.get('Attachment_Name__c'));
            }

            evidence.Attachment_Name__c = (String) attachmentData.get('Attachment_Name__c');
            evidence.File_Name__c = (String) attachmentData.get('File_Name__c');
            evidence.Type__c = (String) attachmentData.get('Type__c');
            evidence.Evidence_Type__c = (String) attachmentData.get('Evidence_Type__c');

            String uploadedById = (String) attachmentData.get('Uploaded_By__c');
            if (String.isNotBlank(uploadedById)) {
                evidence.Uploaded_By__c = (Id) uploadedById;
            }

            evidence.AWS_File_Key__c = (String) attachmentData.get('AWS_File_Key__c');
            evidence.AWS_File_URL__c = (String) attachmentData.get('AWS_File_URL__c');

            evidenceRecords.add(evidence);
        }

        try {
            upsert evidenceRecords;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to save the attachments. Please try again.');
        }

        if (!newAttachmentNames.isEmpty() && investigationIdForLog != null) {
            Id responseId = getResponseIdFromInvestigation(investigationIdForLog);
            appendHistoryLog(
                responseId,
                'Attachments Added',
                String.join(newAttachmentNames, ', ')
            );
        }
        //return new List<Id>(new Map<Id, Incident_Evidence__c>(evidenceRecords).keySet());
         return evidenceRecords;
    }
    // @AuraEnabled
    // public static Id saveCorrectiveAction(Map<String, Object> actionData) {
    //     if (actionData == null) {
    //         throw new AuraHandledException('Action data is required.');
    //     }

    //     Incident_Corrective_Action__c action = new Incident_Corrective_Action__c();
    //     String actionId = (String) actionData.get('Id');

    //     if (String.isNotBlank(actionId)) {
    //         action.Id = actionId;
    //     } else {
    //         Id investigationId = (Id) actionData.get('Incident_Investigation__c');
    //         if (investigationId == null) {
    //             throw new AuraHandledException('Incident Investigation is required to save a Corrective Action.');
    //         }
    //         action.Incident_Investigation__c = investigationId;
    //     }

    //     action.Action_Title__c = (String) actionData.get('Action_Title__c');
    //     action.Description__c = (String) actionData.get('Description__c');
    //     action.Assigned_Owner__c = (String) actionData.get('Assigned_Owner__c');

    //     String dueDateValue = (String) actionData.get('Due_Date__c');
    //     if (String.isNotBlank(dueDateValue)) {
    //         action.Due_Date__c = Date.valueOf(dueDateValue);
    //     }

    //     action.Status__c = (String) actionData.get('Status__c');

    //     try {
    //         upsert action;
    //     } catch (Exception e) {
    //         throw new AuraHandledException('Unable to save the corrective action. Please try again.');
    //     }

    //     return action.Id;
    // }
     @AuraEnabled
    public static Id saveCorrectiveAction(Map<String, Object> actionData) {
        if (actionData == null) {
            throw new AuraHandledException('Action data is required.');
        }

        Incident_Corrective_Action__c action = new Incident_Corrective_Action__c();
        String actionId = (String) actionData.get('Id');
        Boolean isNew = String.isBlank(actionId);
        String previousOwnerId;
        Id investigationId;
        
        // if (String.isNotBlank(actionId)) {
        //     action.Id = actionId;
        // } else {
        //     Id investigationId = (Id) actionData.get('Incident_Investigation__c');
        //     if (investigationId == null) {
        //         throw new AuraHandledException('Incident Investigation is required to save a Corrective Action.');
        //     }
        //     action.Incident_Investigation__c = investigationId;
        // }
        if (!isNew) {
            action.Id = actionId;
            List<Incident_Corrective_Action__c> existing = [
                SELECT Id, Incident_Investigation__c, Assigned_Owner__c,Due_Date__c,Action_Title__c
                FROM Incident_Corrective_Action__c
                WHERE Id = :actionId
                LIMIT 1
            ];
            if (!existing.isEmpty()) {
                investigationId = existing[0].Incident_Investigation__c;
                previousOwnerId = existing[0].Assigned_Owner__c;
            }
        } else {
            investigationId = (Id) actionData.get('Incident_Investigation__c');
            if (investigationId == null) {
                throw new AuraHandledException('Incident Investigation is required to save a Corrective Action.');
            }
            action.Incident_Investigation__c = investigationId;
        }

        action.Action_Title__c = (String) actionData.get('Action_Title__c');
        action.Description__c = (String) actionData.get('Description__c');
        action.Assigned_Owner__c = (String) actionData.get('Assigned_Owner__c');

        String dueDateValue = (String) actionData.get('Due_Date__c');
        if (String.isNotBlank(dueDateValue)) {
            action.Due_Date__c = Date.valueOf(dueDateValue);
        }

        action.Status__c = (String) actionData.get('Status__c');

        try {
            upsert action;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to save the corrective action. Please try again.');
        }
        Id responseId = getResponseIdFromInvestigation(investigationId);
        appendHistoryLog(
            responseId,
            isNew ? 'Corrective Action Created' : 'Corrective Action Updated',
            action.Action_Title__c
        );

        if (String.isNotBlank(action.Assigned_Owner__c)
            && (isNew || previousOwnerId != action.Assigned_Owner__c)) {
                createCorrectiveActionNotification(responseId, action.Assigned_Owner__c, action.Action_Title__c, action.Due_Date__c);
        }
        return action.Id;
    }

    @AuraEnabled
    public static Map<String, Object> getInvestigationForAssessment(String responseId) {
        Map<String, Object> result = new Map<String, Object>();

        if (String.isBlank(responseId)) {
            return result;
        }

        List<Incident_Investigation__c> investigations = [
            SELECT Id,
                Incident_Response__c,
                NDIS_Reportable__c,
                Assessment_Notes__c,
                Findings_Summary__c,
                Final_Notes__c,
                Status__c,
                Assigned_Investigator__c,
                Severity__c,
                LastModifiedDate,
                LastModifiedBy.Name,
                NDIS_Overall_Status__c,
                NDIS_Current_Stage__c
            FROM Incident_Investigation__c
            WHERE Incident_Response__c = :responseId
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        if (investigations.isEmpty()) {
            return result;
        }

        Incident_Investigation__c investigation = investigations[0];

        List<Incident_Corrective_Action__c> correctiveActions = [
            SELECT Id,
                Incident_Investigation__c,
                Action_Title__c,
                Assigned_Owner__c,
                Assigned_Owner__r.Name,
                Due_Date__c,Description__c,
                Status__c
            FROM Incident_Corrective_Action__c
            WHERE Incident_Investigation__c = :investigation.Id
            ORDER BY CreatedDate ASC
        ];
        List<Incident_NDIS_Submission__c> ndisSubmissions = [
            SELECT Id,
                Incident_Investigation__c,
                Submission_Type__c,
                Submitted_By__c,
                Submitted_By__r.Name,
                Submitted_By__r.NameToDisplay__c,
                Submission_Date__c,
                Submission_Time__c,
                Reference_Number__c,
                Summary_Notes__c
            FROM Incident_NDIS_Submission__c
            WHERE Incident_Investigation__c = :investigation.Id
            ORDER BY CreatedDate ASC
        ];
        List<Incident_Evidence__c> evidenceRecords = [
            SELECT Id,
                Incident_Investigation__c,
                Attachment_Name__c,
                File_Name__c,
                Type__c,
                Uploaded_By__c,
                Uploaded_By__r.Name,
                Uploaded_By__r.NameToDisplay__c,
                Evidence_Type__c,
               // Submitted_On__c,
                AWS_File_Key__c,
                AWS_File_URL__c,
                CreatedDate
                //Size__c
            FROM Incident_Evidence__c
            WHERE Incident_Investigation__c = :investigation.Id
            ORDER BY CreatedDate ASC
        ];


        result.put('investigation', investigation);
        result.put('correctiveActions', correctiveActions);
        result.put('ndisSubmissions', ndisSubmissions);
        result.put('evidence', evidenceRecords);

        return result;
    }

    @AuraEnabled
    public static ActionRegisterWrapper getActionRegisterData(String activeFilter, Id orgId, Id facilityId) {
        ActionRegisterWrapper result = new ActionRegisterWrapper();
        try {
            User u = [
                // SELECT Id, Email, Profile.Name, User_Type__c
                SELECT Id, Email, User_Type__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];
            Boolean isOrgAdmin =
                u.User_Type__c == 'NDIS Org Admin' ||
                u.User_Type__c == 'Roster Manager';

            Id staffId;
            Id currentUserId = u.Id;

            if (!isOrgAdmin && u.Email != null) {

                List<Staff__c> staffList = [
                    SELECT Id, Email_Address__c
                    FROM Staff__c
                    WHERE Email_Address__c = :u.Email
                    LIMIT 1
                ];

                if (!staffList.isEmpty()) {
                    staffId = staffList[0].Id;
                }
            }
            List<String> visibilityConditions = new List<String>();
            if (orgId != null) {
                visibilityConditions.add(
                    'Incident_Investigation__r.Incident_Response__r.Org_Id__c = :orgId'
                );
            }
            if (facilityId != null) {
                visibilityConditions.add(
                    'Incident_Investigation__r.Incident_Response__r.Facility__c = :facilityId'
                );
            }
            if (!isOrgAdmin) {
                if (staffId != null) {
                    visibilityConditions.add(
                        '(' +
                            'CreatedById = :currentUserId ' +
                            'OR Assigned_Owner__c = :staffId' +
                        ')'
                    );

                } else {

                    visibilityConditions.add(
                        'CreatedById = :currentUserId'
                    );
                }
            }
            String baseWhere = '';
            if (!visibilityConditions.isEmpty()) {
                baseWhere = String.join(visibilityConditions, ' AND ') + ' AND ';
            }
            
            Date today = System.today();
      
            // Integer openCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Status__c = 'Open' WITH USER_MODE];
            // Integer progressCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Status__c = 'In Progress' WITH USER_MODE];
            // Integer completedCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Status__c = 'Completed' WITH USER_MODE];
            // Integer overdueCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Due_Date__c < :today AND Status__c != 'Completed' WITH USER_MODE];
            // Integer weekCount = [SELECT COUNT() FROM Incident_Corrective_Action__c WHERE Due_Date__c = THIS_WEEK AND Status__c != 'Completed' WITH USER_MODE];
            Integer openCount = Database.countQuery(
                'SELECT COUNT() FROM Incident_Corrective_Action__c WHERE ' +
                baseWhere +
                'Status__c = \'Open\''
            );

            Integer progressCount = Database.countQuery(
                'SELECT COUNT() FROM Incident_Corrective_Action__c WHERE ' +
                baseWhere +
                'Status__c = \'In Progress\''
            );

            Integer completedCount = Database.countQuery(
                'SELECT COUNT() FROM Incident_Corrective_Action__c WHERE ' +
                baseWhere +
                'Status__c = \'Completed\''
            );

            Integer overdueCount = Database.countQuery(
                'SELECT COUNT() FROM Incident_Corrective_Action__c WHERE ' +
                baseWhere +
                'Due_Date__c < :today AND Status__c != \'Completed\''
            );

            Integer weekCount = Database.countQuery(
                'SELECT COUNT() FROM Incident_Corrective_Action__c WHERE ' +
                baseWhere +
                'Due_Date__c = THIS_WEEK AND Status__c != \'Completed\''
            );

        
            result.kpiCounts = new Map<String, Integer>{
                'Open' => openCount,
                'InProgress' => progressCount,
                'Completed' => completedCount,
                'Overdue' => overdueCount,
                'DueThisWeek' => weekCount
            };
        
            String queryStr = 'SELECT Id, Incident_Investigation__c, Incident_Investigation__r.Incident_Response__c,Description__c, ' +
                          'Incident_Investigation__r.Incident_Response__r.Name, ' +
                          'Action_Title__c, Assigned_Owner__c, Assigned_Owner__r.Name,Assigned_Owner__r.NameToDisplay__c,Assigned_Owner__r.Picture__c, ' +
                          'Due_Date__c, Status__c, Completion_Date__c, Notes__c, AWS_Evidence_Key__c, LastModifiedDate ' +
                          'FROM Incident_Corrective_Action__c';
                           
            List<String> conditions = new List<String>(visibilityConditions);
            if (activeFilter == 'Open') {
                conditions.add('Status__c = \'Open\'');
            } else if (activeFilter == 'In Progress') {
                conditions.add('Status__c = \'In Progress\'');
            } else if (activeFilter == 'Completed') {
                conditions.add('Status__c = \'Completed\'');
            } else if (activeFilter == 'Overdue') {
                conditions.add('Due_Date__c < TODAY AND Status__c != \'Completed\'');
            } else if (activeFilter == 'Due This Week') {
                conditions.add('Due_Date__c = THIS_WEEK AND Status__c != \'Completed\'');
            }
        
            if (!conditions.isEmpty()) {
                queryStr += ' WHERE ' + String.join(conditions, ' AND ');
            }
            queryStr += ' ORDER BY Due_Date__c ASC LIMIT 1000';
            
            // result.records = Database.query(queryStr, AccessLevel.USER_MODE);
            result.records = Database.query(queryStr);
            return result;
        } catch (Exception e) {
            throw new AuraHandledException(
                'Error retrieving action register data: ' + e.getMessage()
            );
        }
    }
    // @AuraEnabled
    // public static void saveNdisSubmission(Map<String, Object> submission) {
    //     try {
    //         Id investigationId        = (Id) submission.get('investigationId');
    //         String submissionType     = (String) submission.get('submissionType');
    //         Id submittedById          = (Id) submission.get('submittedById');
    //         String submissionDateStr  = (String) submission.get('submissionDate');
    //         String submissionTimeStr     = (String) submission.get('submissionTime');
    //         String referenceNumber    = (String) submission.get('referenceNumber');
    //         String summaryNotes       = (String) submission.get('summaryNotes');

    //         Date submissionDate = String.isNotBlank(submissionDateStr)
    //             ? Date.valueOf(submissionDateStr)
    //             : null;
    //         Time submissionTime = parseTimeString(submissionTimeStr);
    //         String ndisReportable = (String) submission.get('ndisReportable');

    //         System.debug(' NDIS Reportable received from LWC: ' + ndisReportable);
            
    //         if (investigationId == null) {
    //             throw new AuraHandledException(
    //                 'Incident Investigation is required to save an NDIS submission.'
    //             );
    //         }

    //         Incident_NDIS_Submission__c sub = new Incident_NDIS_Submission__c(
    //             Incident_Investigation__c = investigationId,
    //             Submission_Type__c        = submissionType,
    //             Submitted_By__c           = submittedById,
    //             Submission_Date__c        = submissionDate,
    //             Submission_Time__c        = submissionTime,
    //             Reference_Number__c       = referenceNumber,
    //             Summary_Notes__c          = summaryNotes
    //         );

    //         // Direct user action — USER_MODE genuinely enforces the running
    //         // user's create/FLS access on this insert
    //         Database.insert(sub, true, AccessLevel.USER_MODE);

    //         List<Incident_Evidence__c> evidenceRecords =  new List<Incident_Evidence__c>();

    //        List<Object> attachmentDataList = null;

    //         Object rawAttachments = submission.get('attachments');

    //         if (rawAttachments != null) {
    //             attachmentDataList = (List<Object>) JSON.deserializeUntyped(
    //                 JSON.serialize(rawAttachments)
    //             );
    //         }
    //         if (attachmentDataList != null) {
    //             for (Object attachmentObj : attachmentDataList) {

    //                // Map<String, Object> attachmentData = (Map<String, Object>) attachmentObj;
    //                Map<String, Object> attachmentData =
    //                         (Map<String, Object>) JSON.deserializeUntyped(
    //                             JSON.serialize(attachmentObj)
    //                         );

    //                 if (attachmentData == null) {
    //                     continue;
    //                 }

    //                 Incident_Evidence__c evidence = new Incident_Evidence__c();

    //                 String evidenceId = (String) attachmentData.get('Id');
    //                 if (!String.isBlank(evidenceId)) {
    //                     evidence.Id = evidenceId;
    //                 } else {
    //                     evidence.Incident_Investigation__c = investigationId;
    //                 }

    //                 evidence.Attachment_Name__c = (String) attachmentData.get('Attachment_Name__c');
    //                 evidence.File_Name__c = (String) attachmentData.get('File_Name__c');
    //                 evidence.Type__c = (String) attachmentData.get('Type__c');
    //                 String uploadedById = (String) attachmentData.get( 'Uploaded_By__c');

    //                 if (!String.isBlank(uploadedById)) {
    //                     evidence.Uploaded_By__c =(Id) uploadedById;
    //                 }
    //                 evidence.AWS_File_Key__c = (String) attachmentData.get('AWS_File_Key__c');
    //                 evidence.AWS_File_URL__c =(String) attachmentData.get( 'AWS_File_URL__c');
    //                 evidence.Evidence_Type__c =(String) attachmentData.get('Evidence_Type__c');

    //                 evidenceRecords.add(evidence);
    //             }
    //         }

    //         if (!evidenceRecords.isEmpty()) {
    //             upsert evidenceRecords;
    //         }

    //         List<Incident_Investigation__c> invs =
    //             IncidentSelector.selectInvestigationsByIds(new Set<Id>{ investigationId });

    //         if (!invs.isEmpty()) {
    //         //     Incident_Investigation__c inv = invs[0];

    //         //     if (submissionType == 'Initial Notification') {
    //         //         inv.NDIS_Overall_Status__c = 'In Progress';
    //         //         inv.NDIS_Current_Stage__c  = '5-Day Report';
    //         //     } else if (submissionType == '5-Day Report') {
    //         //         inv.NDIS_Overall_Status__c = 'Completed';
    //         //         inv.NDIS_Current_Stage__c  = 'Completed';
    //         //     }

    //         //    // Database.update(inv, true, AccessLevel.SYSTEM_MODE);
    //         //    update inv;
    //         // Incident_Investigation__c inv = new Incident_Investigation__c(
    //         //     Id = investigationId
    //         // );
    //          Incident_Investigation__c existingInv = invs[0];
    //          Incident_Investigation__c inv =
    //                 new Incident_Investigation__c(
    //                     Id = investigationId
    //                 );

    //         //Boolean updateInvestigation = false;
    //         if (
    //             ndisReportable == 'Yes' &&
    //             inv.NDIS_Reportable__c != 'Yes'
    //         ) {

    //             inv.NDIS_Reportable__c = 'Yes';

    //             //updateInvestigation = true;

    //             System.debug(
    //                 '✅ NDIS_Reportable__c changed to YES.'
    //             );

    //         } else {

    //             System.debug(
    //                 'ℹ️ NDIS_Reportable__c NOT changed. ' +
    //                 'LWC value = ' + ndisReportable +
    //                 ', DB value = ' + inv.NDIS_Reportable__c
    //             );
    //         }

    //        if (submissionType == 'Initial Notification') {

    //             inv.NDIS_Overall_Status__c = 'In Progress';
    //             inv.NDIS_Current_Stage__c = '5-Day Report';

    //         } else if (submissionType == '5-Day Report') {

    //             inv.NDIS_Overall_Status__c = 'Completed';
    //             inv.NDIS_Current_Stage__c = 'Completed';
    //         }


    //         update inv;
    //         //Database.SaveResult updateResult = Database.update(inv, false);
    //         System.debug(
    //             '✅ Investigation updated successfully: ' +
    //             investigationId
    //         );

    //         }

    //     } catch (Exception e) {
    //         throw new AuraHandledException(e.getMessage());
    //     }
    // }
     @AuraEnabled
    public static void saveNdisSubmission(Map<String, Object> submission) {
        try {
            Id investigationId        = (Id) submission.get('investigationId');
            String submissionType     = (String) submission.get('submissionType');
            Id submittedById          = (Id) submission.get('submittedById');
            String submissionDateStr  = (String) submission.get('submissionDate');
            String submissionTimeStr     = (String) submission.get('submissionTime');
            String referenceNumber    = (String) submission.get('referenceNumber');
            String summaryNotes       = (String) submission.get('summaryNotes');

            Date submissionDate = String.isNotBlank(submissionDateStr)
                ? Date.valueOf(submissionDateStr)
                : null;
            Time submissionTime = parseTimeString(submissionTimeStr);
            String ndisReportable = (String) submission.get('ndisReportable');

            System.debug(' NDIS Reportable received from LWC: ' + ndisReportable);
            
            if (investigationId == null) {
                throw new AuraHandledException(
                    'Incident Investigation is required to save an NDIS submission.'
                );
            }

            Incident_NDIS_Submission__c sub = new Incident_NDIS_Submission__c(
                Incident_Investigation__c = investigationId,
                Submission_Type__c        = submissionType,
                Submitted_By__c           = submittedById,
                Submission_Date__c        = submissionDate,
                Submission_Time__c        = submissionTime,
                Reference_Number__c       = referenceNumber,
                Summary_Notes__c          = summaryNotes
            );

            // Direct user action — USER_MODE genuinely enforces the running
            // user's create/FLS access on this insert
            Database.insert(sub, true, AccessLevel.USER_MODE);

            List<Incident_Evidence__c> evidenceRecords =  new List<Incident_Evidence__c>();

           List<Object> attachmentDataList = null;

            Object rawAttachments = submission.get('attachments');

            if (rawAttachments != null) {
                attachmentDataList = (List<Object>) JSON.deserializeUntyped(
                    JSON.serialize(rawAttachments)
                );
            }
            if (attachmentDataList != null) {
                for (Object attachmentObj : attachmentDataList) {

                   // Map<String, Object> attachmentData = (Map<String, Object>) attachmentObj;
                   Map<String, Object> attachmentData =
                            (Map<String, Object>) JSON.deserializeUntyped(
                                JSON.serialize(attachmentObj)
                            );

                    if (attachmentData == null) {
                        continue;
                    }

                    Incident_Evidence__c evidence = new Incident_Evidence__c();

                    String evidenceId = (String) attachmentData.get('Id');
                    if (!String.isBlank(evidenceId)) {
                        evidence.Id = evidenceId;
                    } else {
                        evidence.Incident_Investigation__c = investigationId;
                    }

                    evidence.Attachment_Name__c = (String) attachmentData.get('Attachment_Name__c');
                    evidence.File_Name__c = (String) attachmentData.get('File_Name__c');
                    evidence.Type__c = (String) attachmentData.get('Type__c');
                    String uploadedById = (String) attachmentData.get( 'Uploaded_By__c');

                    if (!String.isBlank(uploadedById)) {
                        evidence.Uploaded_By__c =(Id) uploadedById;
                    }
                    evidence.AWS_File_Key__c = (String) attachmentData.get('AWS_File_Key__c');
                    evidence.AWS_File_URL__c =(String) attachmentData.get( 'AWS_File_URL__c');
                    evidence.Evidence_Type__c =(String) attachmentData.get('Evidence_Type__c');

                    evidenceRecords.add(evidence);
                }
            }

            if (!evidenceRecords.isEmpty()) {
                upsert evidenceRecords;
            }

            List<Incident_Investigation__c> invs =
                IncidentSelector.selectInvestigationsByIds(new Set<Id>{ investigationId });

            if (!invs.isEmpty()) {
                //     Incident_Investigation__c inv = invs[0];

                //     if (submissionType == 'Initial Notification') {
                //         inv.NDIS_Overall_Status__c = 'In Progress';
                //         inv.NDIS_Current_Stage__c  = '5-Day Report';
                //     } else if (submissionType == '5-Day Report') {
                //         inv.NDIS_Overall_Status__c = 'Completed';
                //         inv.NDIS_Current_Stage__c  = 'Completed';
                //     }

                //    // Database.update(inv, true, AccessLevel.SYSTEM_MODE);
                //    update inv;
                // Incident_Investigation__c inv = new Incident_Investigation__c(
                //     Id = investigationId
                // );
                Incident_Investigation__c existingInv = invs[0];
                Incident_Investigation__c inv =
                        new Incident_Investigation__c(
                            Id = investigationId
                        );

                //Boolean updateInvestigation = false;
                if (
                    ndisReportable == 'Yes' &&
                    inv.NDIS_Reportable__c != 'Yes'
                ) {

                    inv.NDIS_Reportable__c = 'Yes';

                    //updateInvestigation = true;

                    System.debug(
                        '✅ NDIS_Reportable__c changed to YES.'
                    );

                } else {

                    System.debug(
                        'ℹ️ NDIS_Reportable__c NOT changed. ' +
                        'LWC value = ' + ndisReportable +
                        ', DB value = ' + inv.NDIS_Reportable__c
                    );
                }

            if (submissionType == 'Initial Notification') {

                    inv.NDIS_Overall_Status__c = 'In Progress';
                    inv.NDIS_Current_Stage__c = '5-Day Report';

                } else if (submissionType == '5-Day Report') {

                    inv.NDIS_Overall_Status__c = 'Completed';
                    inv.NDIS_Current_Stage__c = 'Completed';
                }


                update inv;
                //Database.SaveResult updateResult = Database.update(inv, false);
                System.debug(
                    '✅ Investigation updated successfully: ' +
                    investigationId
                );

            }
            Id responseIdForLog = getResponseIdFromInvestigation(investigationId);

            String logContent = submissionType;
            if (!evidenceRecords.isEmpty()) {
                List<String> names = new List<String>();
                for (Incident_Evidence__c ev : evidenceRecords) {
                    names.add(ev.Attachment_Name__c);
                }
                logContent += ' — Attachments: ' + String.join(names, ', ');
            }

            appendHistoryLog(responseIdForLog, 'NDIS Submission Recorded', logContent);

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    private static Time parseTimeString(String rawTime) {
        if (String.isBlank(rawTime)) {
            return null;
        }

        String cleaned = rawTime.replace('Z', '');
        Integer dotIndex = cleaned.indexOf('.');
        if (dotIndex > -1) {
            cleaned = cleaned.substring(0, dotIndex);
        }

        List<String> parts = cleaned.split(':');
        if (parts.size() < 2) {
            throw new AuraHandledException('Invalid submission time format: ' + rawTime);
        }

        try {
            Integer hour   = Integer.valueOf(parts[0]);
            Integer minute = Integer.valueOf(parts[1]);
            Integer second = parts.size() > 2 ? Integer.valueOf(parts[2]) : 0;
            return Time.newInstance(hour, minute, second, 0);
        } catch (Exception e) {
            throw new AuraHandledException('Invalid submission time format: ' + rawTime);
        }
    }
   @AuraEnabled
    public static Map<String, String> getLoggedInStaffDetails() {
        Map<String, String> result = new Map<String, String>();

        User u = [
            SELECT Email
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        if (String.isBlank(u.Email)) {
            return result;
        }

        List<Staff__c> staffList = [
            SELECT Id, NameToDisplay__c, Name
            FROM Staff__c
            WHERE Email_Address__c = :u.Email
            LIMIT 1
        ];

        if (!staffList.isEmpty()) {
            Staff__c staff = staffList[0];

            result.put('staffId', staff.Id);
            result.put(
                'staffName',
                String.isNotBlank(staff.NameToDisplay__c)
                    ? staff.NameToDisplay__c
                    : staff.Name
            );
        }

        return result;
    }
    // @AuraEnabled
    // public static void deleteIncidentEvidence(Id evidenceId) {
    //     if (evidenceId == null) {
    //         throw new AuraHandledException('Attachment Id is required.');
    //     }

    //     List<Incident_Evidence__c> records = [
    //         SELECT Id, Evidence_Type__c
    //         FROM Incident_Evidence__c
    //         WHERE Id = :evidenceId
    //         AND Evidence_Type__c = 'Incident Evidence'
    //         //WITH USER_MODE
    //         LIMIT 1
    //     ];

    //     if (records.isEmpty()) {
    //         throw new AuraHandledException('Attachment record not found.');
    //     }

    //     Incident_Evidence__c evidence = records[0];
       
    //     try {
    //        // Database.delete(evidence, true, AccessLevel.USER_MODE);
    //        delete evidence;
    //     } catch (Exception e) {
    //         throw new AuraHandledException('Unable to delete the attachment. Please try again.');
    //     }
    // }
    @AuraEnabled
    public static void deleteIncidentEvidence(Id evidenceId, string evidenceType) {
        if (evidenceId == null) {
            throw new AuraHandledException('Attachment Id is required.');
        }

        List<Incident_Evidence__c> records = [
            SELECT Id, Evidence_Type__c,Incident_Investigation__c, Attachment_Name__c
            FROM Incident_Evidence__c
            WHERE Id = :evidenceId
            // AND Evidence_Type__c = 'Incident Evidence'
             AND Evidence_Type__c = :evidenceType
            //WITH USER_MODE
            LIMIT 1
        ];

        if (records.isEmpty()) {
            throw new AuraHandledException('Attachment record not found.');
        }

        Incident_Evidence__c evidence = records[0];
        Id responseId = getResponseIdFromInvestigation(evidence.Incident_Investigation__c);
       
        try {
           // Database.delete(evidence, true, AccessLevel.USER_MODE);
           delete evidence;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to delete the attachment. Please try again.');
        }
        appendHistoryLog(responseId, 'Attachment Deleted', evidence.Attachment_Name__c);
    }

    @AuraEnabled
    public static List<Incident_Evidence__c> getCorrectiveActionAttachments(
        Id actionId
    ) {
        try {

            if (actionId == null) {
                return new List<Incident_Evidence__c>();
            }

            return [
                SELECT Id,
                    Incident_Investigation__c,
                    Incident_Corrective_Action__c,
                    Attachment_Name__c,
                    File_Name__c,
                    Type__c,
                    Uploaded_By__c,
                    Uploaded_By__r.Name,
                    Uploaded_By__r.NameToDisplay__c,
                    AWS_File_Key__c,
                    AWS_File_URL__c,
                    Evidence_Type__c,
                    CreatedDate
                FROM Incident_Evidence__c
                WHERE Incident_Corrective_Action__c = :actionId
                ORDER BY CreatedDate DESC
                //WITH USER_MODE
            ];

        } catch (Exception e) {

            System.debug(
                LoggingLevel.ERROR,
                'Error getting corrective action attachments: ' +
                e.getMessage()
            );

            throw new AuraHandledException(
                e.getMessage()
            );
        }
    }

    public static void appendHistoryLog(Id responseId, String actionLabel, String contentStr) {
        if (responseId == null || String.isBlank(contentStr)) {
            return;
        }

        List<Incident_Register_Response__c> resps = [
            SELECT Id, History_Log__c
            FROM Incident_Register_Response__c
            WHERE Id = :responseId
            LIMIT 1
        ];
        if (resps.isEmpty()) {
            return;
        }
        Incident_Register_Response__c resp = resps[0];
        
        List<Object> historyList = new List<Object>();
        if (String.isNotBlank(resp.History_Log__c)) {
            try {
                historyList = (List<Object>) JSON.deserializeUntyped(resp.History_Log__c);
            } catch (Exception e) {
                historyList = new List<Object>();
            }
        }

        // Skip if this is an exact repeat of the most recent entry —
        // guards against a double-submitted click producing two identical rows.
        if (!historyList.isEmpty()) {
            Map<String, Object> lastEntry = (Map<String, Object>) historyList[historyList.size() - 1];
            if (lastEntry.get('action') == actionLabel && lastEntry.get('content') == contentStr) {
                return;
            }
        }

       // String timestamp = Datetime.now().format('MMM dd yyyy').toUpperCase() + ' ' + Datetime.now().format('hh:mm a').toLowerCase();
        String timestamp = Datetime.now().format('dd MMM yyyy') + ' ' + Datetime.now().format('hh:mm a');
        String userName = UserInfo.getName();

        if (actionLabel != 'Incident Created' && !hasEntryWithAction(historyList, 'Investigation Started')) {
            Map<String, Object> startedEntry = new Map<String, Object>{
                'timestamp' => timestamp,
                'user' => userName,
                'action' => 'Investigation Started',
                'content' => 'Investigation record initialized'
            };
            historyList.add(startedEntry);
        }

        Map<String, Object> entry = new Map<String, Object>{
            'timestamp' => timestamp,
            'user' => UserInfo.getName(),
            'action' => actionLabel,
            'content' => contentStr
        };

        // List<Object> historyList = new List<Object>();
        // if (String.isNotBlank(resp.History_Log__c)) {
        //     try {
        //         historyList = (List<Object>) JSON.deserializeUntyped(resp.History_Log__c);
        //     } catch (Exception e) {
        //         // start fresh if the stored JSON is somehow invalid
        //     }
        // }
        historyList.add(entry);
        resp.History_Log__c = JSON.serialize(historyList);

        update resp;
    }

    /** Resolves the parent Incident_Register_Response__c Id from an Investigation Id. */
    public static Id getResponseIdFromInvestigation(Id investigationId) {
        if (investigationId == null) {
            return null;
        }
        List<Incident_Investigation__c> invs = [
            SELECT Id, Incident_Response__c
            FROM Incident_Investigation__c
            WHERE Id = :investigationId
            LIMIT 1
        ];
        return invs.isEmpty() ? null : invs[0].Incident_Response__c;
    }

    public static String safe(String v) {
        return String.isBlank(v) ? 'None' : v;
    }
    public static Boolean hasEntryWithAction(List<Object> historyList, String actionLabel) {
        for (Object o : historyList) {
            Map<String, Object> entry = (Map<String, Object>) o;
            if (entry.get('action') == actionLabel) {
                return true;
            }
        }
        return false;
    }
    // public static void createAssignmentNotification(Id responseId, String assignedStaffId) {

    //     System.debug(' createAssignmentNotification: ' );
    //     System.debug(' assignedStaffId : ' +assignedStaffId);
    //      System.debug(' responseId : ' +responseId);
    //     try {

    //         Set<Id> notifyStaffIds = new Set<Id>();
    //         if (String.isNotBlank(assignedStaffId)) {
    //             Set<String> userEmails = new Set<String>();
    //             for (User u : [
    //                 SELECT Id, Email
    //                 FROM User
    //                 WHERE Id = :assignedStaffId
    //             ]) {
    //                 if (String.isNotBlank(u.Email)) {
    //                     userEmails.add(u.Email.trim().toLowerCase());
    //                 }
    //             }

    //             if (!userEmails.isEmpty()) {
    //                 for (Staff__c s : [
    //                     SELECT Id, Email_Address__c
    //                     FROM Staff__c
    //                     WHERE Email_Address__c IN :userEmails
    //                 ]) {
    //                     notifyStaffIds.add(s.Id);
    //                 }
    //             }
    //         }
    //         // Remove nulls safety
    //         notifyStaffIds.remove(null);

    //         // No recipients
    //         if (notifyStaffIds.isEmpty()) {
    //             return;
    //         }

    //         System.debug(' Final notifyStaffIds for assignment: ' +notifyStaffIds );

    //         List<Incident_Register_Response__c> responses = [
    //             SELECT Id, Name, Facility__c
    //             FROM Incident_Register_Response__c
    //             WHERE Id = :responseId
    //             LIMIT 1
    //         ];
    //         if (responses.isEmpty()) {
    //             return;
    //         }
    //         Incident_Register_Response__c response = responses[0];

    //         List<Notifications__c> notificationsToInsert = new List<Notifications__c>();

    //         for (Id staffId : notifyStaffIds) {
    //             Notifications__c notification = new Notifications__c();
    //             notification.Title__c = 'Incident Assigned';
    //             notification.Staff__c = staffId;
    //             notification.Record_Id__c = response.Id;
    //             notification.Type__c = 'Incident';
    //             notification.Is_Read__c = false;
    //             notification.Message__c = 'Incident ' + response.Name + ' has been assigned to you for investigation.';
    //             notification.Module__c = 'Incident Register';
    //             notification.Facility__c = response.Facility__c;
    //             notificationsToInsert.add(notification);
    //         }

    //         if (!notificationsToInsert.isEmpty()) {

    //             System.debug(
    //                 '🔥 Notifications to insert count: ' +
    //                 notificationsToInsert.size()
    //             );

    //             System.debug(
    //                 '🔥 Notifications data: ' +
    //                 notificationsToInsert
    //             );

    //             insert notificationsToInsert;

    //             String facilityName = '';
    //             if (response.Facility__c != null) {
    //                 facilityName = [
    //                     SELECT Name
    //                     FROM Facility__c
    //                     WHERE Id = :response.Facility__c
    //                     LIMIT 1
    //                 ].Name;
    //             }

    //             System.debug(
    //                 '✅ Assignment notifications created: ' +
    //                 notificationsToInsert.size()
    //             );

    //             List<Notification_Event__e> events = new List<Notification_Event__e>();

    //             for (Notifications__c ntf : notificationsToInsert) {

    //                 Notification_Event__e evt = new Notification_Event__e(
    //                     Staff_Id__c = String.valueOf(ntf.Staff__c),
    //                     Record_Id__c = ntf.Record_Id__c,
    //                     Module__c = ntf.Module__c,
    //                     Type__c = ntf.Type__c,
    //                     Title__c = ntf.Title__c,
    //                     Message__c = ntf.Message__c,
    //                     Facility_Name__c = facilityName
    //                 );

    //                 events.add(evt);
    //             }

    //             if (!events.isEmpty()) {

    //                 EventBus.publish(events);

    //                 System.debug(
    //                     '🚀 Assignment platform events published: ' +
    //                     events.size()
    //                 );
    //             }
    //         }

    //     } catch (Exception e) {

    //         System.debug(
    //             '❌ createAssignmentNotification Error: ' +
    //             e.getMessage()
    //         );
    //     }
    // }

    public static void createAssignmentNotification(Id responseId, String assignedStaffId) {

        System.debug(' createAssignmentNotification: ');
        System.debug(' assignedStaffId : ' + assignedStaffId);
        System.debug(' responseId : ' + responseId);

        try {

            Set<Id> notifyStaffIds = new Set<Id>();

            // >>> FIXED - assignedStaffId is already a Staff__c Id (confirmed via debug: 'a03B' prefix), no User/email lookup needed
            if (String.isNotBlank(assignedStaffId)) {
                notifyStaffIds.add((Id) assignedStaffId);
            }

            // Remove nulls safety
            notifyStaffIds.remove(null);

            System.debug(' Final notifyStaffIds for assignment: ' + notifyStaffIds);

            // No recipients
            if (notifyStaffIds.isEmpty()) {
                System.debug(' No recipients found — exiting.');
                return;
            }

            List<Incident_Register_Response__c> responses = [
                SELECT Id, Name, Facility__c
                FROM Incident_Register_Response__c
                WHERE Id = :responseId
                LIMIT 1
            ];
            if (responses.isEmpty()) {
                System.debug(' No matching Incident_Register_Response__c found — exiting.');
                return;
            }
            Incident_Register_Response__c response = responses[0];
            Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>([
                SELECT Id, Email_Address__c
                FROM Staff__c
                WHERE Id IN :notifyStaffIds
            ]);

            Set<String> staffEmails = new Set<String>();
            for (Staff__c s : staffMap.values()) {
                if (!String.isBlank(s.Email_Address__c)) {
                    staffEmails.add(s.Email_Address__c.trim().toLowerCase());
                }
            }

            Map<String, Id> emailToUserIdMap = new Map<String, Id>();
            for (User u : [
                SELECT Id, Email
                FROM User
                WHERE Email IN :staffEmails
                AND IsActive = true
            ]) {
                emailToUserIdMap.put(u.Email.trim().toLowerCase(), u.Id);
            }

            System.debug('🗺️ Final emailToUserIdMap: ' + emailToUserIdMap);

            List<Notifications__c> notificationsToInsert = new List<Notifications__c>();
            List<My_Notification__c> myNotificationsToInsert = new List<My_Notification__c>();

            for (Id staffId : notifyStaffIds) {
                Notifications__c notification = new Notifications__c();
                notification.Title__c = 'Incident Assigned';
                notification.Staff__c = staffId;
                notification.Record_Id__c = response.Id;
                notification.Type__c = 'Incident';
                notification.Is_Read__c = false;
                notification.Message__c = 'Incident ' + response.Name + ' has been assigned to you for investigation.';
                notification.Module__c = 'Incident Register';
                notification.Facility__c = response.Facility__c;
                notificationsToInsert.add(notification);

                Staff__c st = staffMap.get(staffId);
                Id userId = (st != null && !String.isBlank(st.Email_Address__c))
                    ? emailToUserIdMap.get(st.Email_Address__c.trim().toLowerCase())
                    : null;

                if (userId != null) {
                    myNotificationsToInsert.add(new My_Notification__c(
                        User__c = userId,
                        Subject__c = 'Incident Assigned',
                        Description__c = 'Incident ' + response.Name + ' has been assigned to you for investigation.'
                    ));
                } else {
                    System.debug('⚠️ No active User found for Staff__c ' + staffId + ' — skipping My_Notification__c.');
                }
            }

            if (!notificationsToInsert.isEmpty()) {

                System.debug('🔥 Notifications to insert count: ' + notificationsToInsert.size());
                System.debug('🔥 Notifications data: ' + notificationsToInsert);

                insert notificationsToInsert;

                if (!myNotificationsToInsert.isEmpty()) {
                    insert myNotificationsToInsert;
                    System.debug('✅ My_Notification__c records created: ' + myNotificationsToInsert.size());
                }

                String facilityName = '';
                if (response.Facility__c != null) {
                    facilityName = [
                        SELECT Name
                        FROM Facility__c
                        WHERE Id = :response.Facility__c
                        LIMIT 1
                    ].Name;
                }

                System.debug('✅ Assignment notifications created: ' + notificationsToInsert.size());

                List<Notification_Event__e> events = new List<Notification_Event__e>();

                for (Notifications__c ntf : notificationsToInsert) {

                    Notification_Event__e evt = new Notification_Event__e(
                        Staff_Id__c = String.valueOf(ntf.Staff__c),
                        Record_Id__c = ntf.Record_Id__c,
                        Module__c = ntf.Module__c,
                        Type__c = ntf.Type__c,
                        Title__c = ntf.Title__c,
                        Message__c = ntf.Message__c,
                        Facility_Name__c = facilityName
                    );

                    events.add(evt);
                }

                if (!events.isEmpty()) {
                    EventBus.publish(events);
                    System.debug('🚀 Assignment platform events published: ' + events.size());
                }
            }

        } catch (Exception e) {
            System.debug('❌ createAssignmentNotification Error: ' + e.getMessage());
        }
    }
    public static void createCorrectiveActionNotification(Id responseId, String assignedOwnerId, String actionTitle, Date dueDate) {

        System.debug(' createCorrectiveActionNotification: ');
        System.debug(' assignedOwnerId : ' + assignedOwnerId);
        System.debug(' responseId : ' + responseId);

        try {

            Set<Id> notifyStaffIds = new Set<Id>();

            // assignedOwnerId is a Staff__c Id (same as Assigned_Investigator__c), no User/email lookup needed
            if (String.isNotBlank(assignedOwnerId)) {
                notifyStaffIds.add((Id) assignedOwnerId);
            }

            notifyStaffIds.remove(null);

            System.debug(' Final notifyStaffIds for corrective action: ' + notifyStaffIds);

            if (notifyStaffIds.isEmpty()) {
                System.debug(' No recipients found — exiting.');
                return;
            }

            List<Incident_Register_Response__c> responses = [
                SELECT Id, Name, Facility__c
                FROM Incident_Register_Response__c
                WHERE Id = :responseId
                LIMIT 1
            ];
            if (responses.isEmpty()) {
                System.debug(' No matching Incident_Register_Response__c found — exiting.');
                return;
            }
            Incident_Register_Response__c response = responses[0];
            String dueDateStr = dueDate != null
                    ? dueDate.format()
                    : '';

            Boolean isOverdue = dueDate != null && dueDate < System.today();

            String message;
            if (String.isBlank(dueDateStr)) {
                message = '"' + actionTitle + '" has been assigned to you.';
            } else if (isOverdue) {
                message = '"' + actionTitle + '" has been assigned to you and was due on ' + dueDateStr + ' (overdue).';
            } else {
                message = '"' + actionTitle + '" has been assigned to you and is due on ' + dueDateStr + '.';
            }

            Map<Id, Staff__c> staffMap = new Map<Id, Staff__c>([
                SELECT Id, Email_Address__c
                FROM Staff__c
                WHERE Id IN :notifyStaffIds
            ]);

            Set<String> staffEmails = new Set<String>();
            for (Staff__c s : staffMap.values()) {
                if (!String.isBlank(s.Email_Address__c)) {
                    staffEmails.add(s.Email_Address__c.trim().toLowerCase());
                }
            }

            Map<String, Id> emailToUserIdMap = new Map<String, Id>();
            for (User u : [
                SELECT Id, Email
                FROM User
                WHERE Email IN :staffEmails
                AND IsActive = true
            ]) {
                emailToUserIdMap.put(u.Email.trim().toLowerCase(), u.Id);
            }

            System.debug('🗺️ Final emailToUserIdMap: ' + emailToUserIdMap);

            List<Notifications__c> notificationsToInsert = new List<Notifications__c>();
            List<My_Notification__c> myNotificationsToInsert = new List<My_Notification__c>();

            for (Id staffId : notifyStaffIds) {
                Notifications__c notification = new Notifications__c();
                notification.Title__c = 'Corrective Action Assigned';
                notification.Staff__c = staffId;
                notification.Record_Id__c = response.Id;
                notification.Type__c = 'Incident';
                notification.Is_Read__c = false;
                notification.Message__c = message;
                notification.Module__c = 'Incident Register';
                notification.Facility__c = response.Facility__c;
                notificationsToInsert.add(notification);

                Staff__c st = staffMap.get(staffId);
                Id userId = (st != null && !String.isBlank(st.Email_Address__c))
                    ? emailToUserIdMap.get(st.Email_Address__c.trim().toLowerCase())
                    : null;

                if (userId != null) {
                    myNotificationsToInsert.add(new My_Notification__c(
                        User__c = userId,
                        Subject__c = 'Corrective Action Assigned',
                        Description__c = message
                    ));
                } else {
                    System.debug('⚠️ No active User found for Staff__c ' + staffId + ' — skipping My_Notification__c.');
                }
            }

            if (!notificationsToInsert.isEmpty()) {

                System.debug('🔥 Notifications to insert count: ' + notificationsToInsert.size());
                System.debug('🔥 Notifications data: ' + notificationsToInsert);

                insert notificationsToInsert;

                if (!myNotificationsToInsert.isEmpty()) {
                    insert myNotificationsToInsert;
                    System.debug('✅ My_Notification__c records created: ' + myNotificationsToInsert.size());
                }

                String facilityName = '';
                if (response.Facility__c != null) {
                    facilityName = [
                        SELECT Name
                        FROM Facility__c
                        WHERE Id = :response.Facility__c
                        LIMIT 1
                    ].Name;
                }

                System.debug('✅ Corrective action notifications created: ' + notificationsToInsert.size());

                List<Notification_Event__e> events = new List<Notification_Event__e>();

                for (Notifications__c ntf : notificationsToInsert) {

                    Notification_Event__e evt = new Notification_Event__e(
                        Staff_Id__c = String.valueOf(ntf.Staff__c),
                        Record_Id__c = ntf.Record_Id__c,
                        Module__c = ntf.Module__c,
                        Type__c = ntf.Type__c,
                        Title__c = ntf.Title__c,
                        Message__c = ntf.Message__c,
                        Facility_Name__c = facilityName
                    );

                    events.add(evt);
                }

                if (!events.isEmpty()) {
                    EventBus.publish(events);
                    System.debug('🚀 Corrective action platform events published: ' + events.size());
                }
            }

        } catch (Exception e) {
            System.debug('❌ createCorrectiveActionNotification Error: ' + e.getMessage());
        }
    }
    private static void notifyInvestigatorOfCompletedAction(Id investigationId, String actionTitle, Id responseId) {

    System.debug('notifyInvestigatorOfCompletedAction: ' + investigationId);

    List<Incident_Investigation__c> investigations = [
        SELECT Id, Assigned_Investigator__c
        FROM Incident_Investigation__c
        WHERE Id = :investigationId
        LIMIT 1
    ];

    if (investigations.isEmpty() || String.isBlank(investigations[0].Assigned_Investigator__c)) {
        System.debug('⚠️ No assigned investigator for investigation ' + investigationId + ' — skipping completion notification.');
        return;
    }

    Id staffId = (Id) investigations[0].Assigned_Investigator__c;

    List<Incident_Register_Response__c> responses = [
        SELECT Id, Name, Facility__c
        FROM Incident_Register_Response__c
        WHERE Id = :responseId
        LIMIT 1
    ];

    if (responses.isEmpty()) {
        System.debug('⚠️ No matching Incident_Register_Response__c found for ' + responseId + ' — skipping completion notification.');
        return;
    }

    Incident_Register_Response__c response = responses[0];
    String message = '"' + actionTitle + '" has been marked as Completed.';

    List<Staff__c> staffList = [
        SELECT Id, Email_Address__c
        FROM Staff__c
        WHERE Id = :staffId
        LIMIT 1
    ];

    Notifications__c notification = new Notifications__c();
    notification.Title__c = 'Corrective Action Completed';
    notification.Staff__c = staffId;
    notification.Record_Id__c = response.Id;
    notification.Type__c = 'Incident';
    notification.Is_Read__c = false;
    notification.Message__c = message;
    notification.Module__c = 'Incident Register';
    notification.Facility__c = response.Facility__c;

    insert notification;
    System.debug('✅ Notifications__c created for completion: ' + notification.Id);

    if (!staffList.isEmpty() && !String.isBlank(staffList[0].Email_Address__c)) {
        List<User> users = [
            SELECT Id
            FROM User
            WHERE Email = :staffList[0].Email_Address__c
            AND IsActive = true
            LIMIT 1
        ];

        if (!users.isEmpty()) {
            insert new My_Notification__c(
                User__c = users[0].Id,
                Subject__c = 'Corrective Action Completed',
                Description__c = message
            );
            System.debug('✅ My_Notification__c created for completion.');
        } else {
            System.debug('⚠️ No active User found for Staff__c ' + staffId + ' — skipping My_Notification__c.');
        }
    } else {
        System.debug('⚠️ No email on Staff__c ' + staffId + ' — skipping My_Notification__c.');
    }

    String facilityName = '';
    if (response.Facility__c != null) {
        facilityName = [
            SELECT Name
            FROM Facility__c
            WHERE Id = :response.Facility__c
            LIMIT 1
        ].Name;
    }

    EventBus.publish(new Notification_Event__e(
        Staff_Id__c = String.valueOf(staffId),
        Record_Id__c = response.Id,
        Module__c = 'Incident Register',
        Type__c = 'Incident',
        Title__c = 'Corrective Action Completed',
        Message__c = message,
        Facility_Name__c = facilityName
    ));
    System.debug('🚀 Completion platform event published.');
}


}