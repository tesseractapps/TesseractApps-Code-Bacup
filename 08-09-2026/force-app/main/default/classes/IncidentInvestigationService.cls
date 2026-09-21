public with sharing class IncidentInvestigationService {

    public class ServiceException extends Exception {}

    /**
     * Enforce strict compliance checks before an incident/investigation can be resolved.
     */
    public static void validateResolution(List<Incident_Investigation__c> records) {
        Set<Id> invIds = new Set<Id>();
        for (Incident_Investigation__c inv : records) {
            if (inv.Status__c == 'Resolved') {
                invIds.add(inv.Id);
            }
        }
        if (invIds.isEmpty()) return;

        // Count open corrective actions
        // Map<Id, Integer> openActionsCountMap = new Map<Id, Integer>();
        // for (AggregateResult ar : [
        //     SELECT Incident_Investigation__c invId, COUNT(Id) cnt
        //     FROM Incident_Corrective_Action__c
        //     WHERE Incident_Investigation__c IN :invIds AND Status__c != 'Completed'
        //     WITH USER_MODE
        //     GROUP BY Incident_Investigation__c
        // ]) {
        //     openActionsCountMap.put((Id)ar.get('invId'), (Integer)ar.get('cnt'));
        // }

        // Check NDIS portal submission receipts
        Map<Id, Set<String>> submissionsMap = new Map<Id, Set<String>>();
        for (Incident_NDIS_Submission__c sub : [
            SELECT Incident_Investigation__c, Submission_Type__c
            FROM Incident_NDIS_Submission__c
            WHERE Incident_Investigation__c IN :invIds
           // WITH USER_MODE
        ]) {
            if (!submissionsMap.containsKey(sub.Incident_Investigation__c)) {
                submissionsMap.put(sub.Incident_Investigation__c, new Set<String>());
            }
            submissionsMap.get(sub.Incident_Investigation__c).add(sub.Submission_Type__c);
        }

        for (Incident_Investigation__c inv : records) {
            if (inv.Status__c == 'Resolved') {
                // 1. Block if any corrective actions are open
                // if (openActionsCountMap.containsKey(inv.Id) && openActionsCountMap.get(inv.Id) > 0) {
                //     inv.Status__c.addError('Cannot resolve incident. One or more Corrective Actions remain incomplete.');
                // }
                
                // 2. Block if NDIS report is Yes and submissions are missing
                if (inv.NDIS_Reportable__c == 'Yes') {
                    Set<String> subs = submissionsMap.get(inv.Id);
                    // if (subs == null || !subs.contains('Initial Notification')) {
                    //     inv.addError('Cannot resolve incident. NDIS Initial Notification must be completed and recorded.');
                    // }
                    // if (subs == null || !subs.contains('5-Day Report')) {
                    //     inv.addError('Cannot resolve incident. NDIS 5-Day Report must be completed and recorded.');
                    // }
                    List<String> missing = new List<String>();                          
                    if (subs == null || !subs.contains('Initial Notification')) {
                        missing.add('NDIS Initial Notification');                       
                    }
                    if (subs == null || !subs.contains('5-Day Report')) {
                        missing.add('NDIS 5-Day Report');                               
                    }
                    if (!missing.isEmpty()) {                                           
                        inv.addError('Cannot resolve incident. ' + String.join(missing, ' and ') + ' must be completed and recorded.'); 
                    }
                }

                // 3. Verify final note/acknowledgement comments exist
                if (String.isBlank(inv.Final_Notes__c)) {
                    inv.Final_Notes__c.addError('Final Notes are mandatory to resolve the incident.');
                }
            }
        }
    }

    /**
     * Initialize a new investigation from an Incident Register Response.
     */
    public static Incident_Investigation__c startInvestigation(Id responseId, Id investigatorId) {
        List<Incident_Register_Response__c> responses = IncidentSelector.selectResponsesByIds(new Set<Id>{responseId});
        if (responses.isEmpty()) {
            throw new ServiceException('Incident Response record not found.');
        }
        Incident_Register_Response__c response = responses[0];

        // Check if investigation already exists
        List<Incident_Investigation__c> existing = IncidentSelector.selectInvestigationsByResponseIds(new Set<Id>{responseId});
        if (!existing.isEmpty()) {
            return existing[0];
        }

        // Initialize new investigation
        Incident_Investigation__c inv = new Incident_Investigation__c();
        inv.Incident_Response__c = responseId;
        inv.Status__c = 'In Progress';
        inv.Assigned_Investigator__c = investigatorId;
        inv.Severity__c = response.Severity__c != null ? response.Severity__c : 'Medium';
        inv.NDIS_Reportable__c = response.NDIS_Reportable__c != null ? response.NDIS_Reportable__c : 'No';
        inv.NDIS_Overall_Status__c = 'Pending';
        inv.NDIS_Current_Stage__c = 'Initial Notification';

       // Database.insert(inv, true, AccessLevel.USER_MODE);
       insert inv;

        // Update response status
        response.Status__c = 'In-Progress';
        //Database.update(response, true, AccessLevel.USER_MODE);
        update response;

        return inv;
    }

    /**
     * Save case assessment updates.
     */
    public static void saveAssessment(Incident_Investigation__c updatedInv) {
        List<Incident_Investigation__c> currentList = IncidentSelector.selectInvestigationsByIds(new Set<Id>{updatedInv.Id});
        if (currentList.isEmpty()) {
            throw new ServiceException('Investigation record not found.');
        }
        Incident_Investigation__c current = currentList[0];

        // Perform updates
        current.Severity__c = updatedInv.Severity__c;
        current.Status__c = updatedInv.Status__c;
        current.Assigned_Investigator__c = updatedInv.Assigned_Investigator__c;
        current.NDIS_Reportable__c = updatedInv.NDIS_Reportable__c;
        current.Assessment_Notes__c = updatedInv.Assessment_Notes__c;
        current.Findings_Summary__c = updatedInv.Findings_Summary__c;
        current.Root_Cause__c = updatedInv.Root_Cause__c;
        current.Final_Notes__c = updatedInv.Final_Notes__c;

        //Database.update(current, true, AccessLevel.USER_MODE);
        update current;

        // Update values on parent Response as well
        Incident_Register_Response__c response = new Incident_Register_Response__c(Id = current.Incident_Response__c);
        response.Status__c = updatedInv.Status__c;
        response.Severity__c = updatedInv.Severity__c;
        response.NDIS_Reportable__c = updatedInv.NDIS_Reportable__c;
        //Database.update(response, true, AccessLevel.USER_MODE);
        update response;
    }

    /**
     * Add and record corrective actions.
     */
    public static Incident_Corrective_Action__c addCorrectiveAction(Incident_Corrective_Action__c action) {
        action.Status__c = 'Open';
        Database.insert(action, true, AccessLevel.USER_MODE);
        return action;
    }

    /**
     * Complete a corrective action.
     */
    public static void completeCorrectiveAction(Id actionId, String notes, String awsKey) {
        List<Incident_Corrective_Action__c> actions = [
            SELECT Id, Incident_Investigation__c, Action_Title__c, Status__c
            FROM Incident_Corrective_Action__c
            WHERE Id = :actionId
            //WITH USER_MODE
            LIMIT 1
        ];
        if (actions.isEmpty()) {
            throw new ServiceException('Action not found.');
        }
        Incident_Corrective_Action__c action = actions[0];
        action.Status__c = 'Completed';
        action.Completion_Date__c = System.today();
        action.Notes__c = notes;
        action.AWS_Evidence_Key__c = awsKey;

        //Database.update(action, true, AccessLevel.USER_MODE);
        update action;
    }

    /**
     * Record NDIS Commission portal submission.
     */
    public static Incident_NDIS_Submission__c recordNdisSubmission(Incident_NDIS_Submission__c sub) {
        //Database.insert(sub, true, AccessLevel.USER_MODE);
        insert sub;

        List<Incident_Investigation__c> invs = IncidentSelector.selectInvestigationsByIds(new Set<Id>{sub.Incident_Investigation__c});
        if (!invs.isEmpty()) {
            Incident_Investigation__c inv = invs[0];
            
            // Increment stage status
            if (sub.Submission_Type__c == 'Initial Notification') {
                inv.NDIS_Overall_Status__c = 'In Progress';
                inv.NDIS_Current_Stage__c = '5-Day Report';
            } else if (sub.Submission_Type__c == '5-Day Report') {
                inv.NDIS_Overall_Status__c = 'Completed';
                inv.NDIS_Current_Stage__c = 'Completed';
            }
            //Database.update(inv, true, AccessLevel.USER_MODE);
            update inv;
        }
        return sub;
    }

    /**
     * Declated Lookup Roll-Up Summary (Option B)
     * Recalculates Open_Actions__c on parent Incident_Register_Response__c records.
     */
    public static void rollupOpenCorrectiveActions(Set<Id> investigationIds) {
        if (investigationIds == null || investigationIds.isEmpty()) return;

        // Map Investigation to Response Id
        Map<Id, Id> invToResponseMap = new Map<Id, Id>();
        for (Incident_Investigation__c inv : [
            SELECT Id, Incident_Response__c 
            FROM Incident_Investigation__c 
            WHERE Id IN :investigationIds
            //WITH USER_MODE
        ]) {
            invToResponseMap.put(inv.Id, inv.Incident_Response__c);
        }

        // Initialize all response open action counts to 0
        Map<Id, Integer> responseCounts = new Map<Id, Integer>();
        for (Id respId : invToResponseMap.values()) {
            if (respId != null) {
                responseCounts.put(respId, 0);
            }
        }

        // Count open corrective actions grouped by investigation
        for (AggregateResult ar : [
            SELECT Incident_Investigation__c invId, COUNT(Id) cnt
            FROM Incident_Corrective_Action__c
            WHERE Incident_Investigation__c IN :investigationIds AND Status__c != 'Completed'
            //WITH USER_MODE
            GROUP BY Incident_Investigation__c
        ]) {
            Id invId = (Id)ar.get('invId');
            Integer count = (Integer)ar.get('cnt');
            Id respId = invToResponseMap.get(invId);
            if (respId != null) {
                responseCounts.put(respId, count);
            }
        }

        // Prepare updates
        List<Incident_Register_Response__c> responsesToUpdate = new List<Incident_Register_Response__c>();
        for (Id respId : responseCounts.keySet()) {
            responsesToUpdate.add(new Incident_Register_Response__c(
                Id = respId,
                Open_Actions__c = responseCounts.get(respId)
            ));
        }

        if (!responsesToUpdate.isEmpty()) {
           // Database.update(responsesToUpdate, true, AccessLevel.USER_MODE);
           update responsesToUpdate;
        }
    }
}