trigger RiskManagementTrigger on Risk_Management__c (after insert, after update) {
    Set<Id> participantIds = new Set<Id>();

    for (Risk_Management__c risk : Trigger.new) {
        // Always check for Participant__c not null
        if (risk.Participant__c != null) {
            if (Trigger.isInsert) {
                // Always include participant in insert
                participantIds.add(risk.Participant__c);
            } else if (Trigger.isUpdate) {
                // Safely access Trigger.oldMap only in update
                Risk_Management__c oldRisk = Trigger.oldMap.get(risk.Id);
                if (oldRisk != null && oldRisk.Risk_Index__c != risk.Risk_Index__c) {
                    participantIds.add(risk.Participant__c);
                }
            }
        }
    }

    // Call helper method
    if (!participantIds.isEmpty()) {
        RiskMatrixController.updateParticipantRiskIndex(new List<Id>(participantIds));
    }
}