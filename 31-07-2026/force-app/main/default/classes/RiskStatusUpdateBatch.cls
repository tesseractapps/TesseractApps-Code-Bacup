public class RiskStatusUpdateBatch implements Database.Batchable<SObject> {

    public Database.QueryLocator start(Database.BatchableContext bc) {
        System.debug('*** Starting RiskStatusUpdateBatch - start method ***');
        return Database.getQueryLocator([
            SELECT Id 
            FROM Client__c 
            WHERE Id IN (
                SELECT Participant__c 
                FROM Risk_Management__c 
                WHERE Participant__c != null
            )
        ]);
    }

    public void execute(Database.BatchableContext bc, List<SObject> scope) {
        List<Id> participantIds = new List<Id>();
        for (SObject s : scope) {
            Id pid = (Id)s.get('Id');
            participantIds.add(pid);
        }

        System.debug('*** Executing batch for Participants: ' + participantIds);

        // Call the helper to update risk status
        RiskMatrixController.updateParticipantRiskIndex(participantIds);
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('*** Finished RiskStatusUpdateBatch ***');
    }
}