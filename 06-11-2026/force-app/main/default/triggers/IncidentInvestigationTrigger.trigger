trigger IncidentInvestigationTrigger on Incident_Investigation__c (before insert, before update) {
    if (Trigger.isBefore && (Trigger.isInsert || Trigger.isUpdate)) {
        IncidentInvestigationService.validateResolution(Trigger.new);
    }
}