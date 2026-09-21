//public class IncicidentExistingRecordBatch {

//}
public class IncicidentExistingRecordBatch implements Database.Batchable<SObject>, Database.AllowsCallouts {

    private Boolean dryRun;

    public IncicidentExistingRecordBatch(Boolean dryRun) {
        this.dryRun = dryRun;
    }

    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Response_JSON__c, Participant__c, Severity__c, Org_Id__c
            FROM Incident_Register_Response__c
            WHERE (Participant__c = null OR Severity__c = null)
            //AND Response_JSON__c != null
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Incident_Register_Response__c> scope) {

        List<Incident_Register_Response__c> toUpdate = new List<Incident_Register_Response__c>();
        Map<Id, Id> pendingParticipantIds = new Map<Id, Id>();

        for (Incident_Register_Response__c rec : scope) {

            try {
                if (String.isBlank(rec.Response_JSON__c)) {
                    System.debug('Skipping ' + rec.Id + ' — Response_JSON__c is blank.');
                    continue;
                }
                Object metaParsed = JSON.deserializeUntyped(rec.Response_JSON__c);

                if (!(metaParsed instanceof Map<String, Object>)) {
                    System.debug('Skipping ' + rec.Id + ' — Response_JSON__c is not an object with a url.');
                    continue;
                }

                Map<String, Object> meta = (Map<String, Object>) metaParsed;
                String fileUrl = String.valueOf(meta.get('url'));

                if (String.isBlank(fileUrl) || fileUrl == 'null') {
                    System.debug('No url found for record: ' + rec.Id);
                    continue;
                }

                HttpRequest req = new HttpRequest();
                req.setEndpoint(fileUrl);
                req.setMethod('GET');
                req.setTimeout(20000);

                HttpResponse res = new Http().send(req);

                if (res.getStatusCode() != 200) {
                    System.debug('Callout failed for record ' + rec.Id + ' status: ' + res.getStatusCode());
                    continue;
                }

                List<Object> tableRows = (List<Object>) JSON.deserializeUntyped(res.getBody());

                String participantId = null;
                String severity = null;

                for (Object rowObj : tableRows) {
                    Map<String, Object> row = (Map<String, Object>) rowObj;
                    List<Object> cells = (List<Object>) row.get('cells');
                    if (cells == null) continue;

                    for (Object cellObj : cells) {
                        Map<String, Object> cell = (Map<String, Object>) cellObj;
                        Object fieldObj = cell.get('field');
                        if (fieldObj == null) continue;

                        Map<String, Object> field = (Map<String, Object>) fieldObj;
                        String label = String.valueOf(field.get('label') == null ? '' : field.get('label')).trim();

                        if (label.equalsIgnoreCase('Participant') && participantId == null) {
                            Object val = field.get('value');
                            if (val != null && String.isNotBlank(String.valueOf(val))) {
                                participantId = String.valueOf(val);
                            }
                        }

                        if (label.equalsIgnoreCase('Priority') && severity == null) {
                            Object val = field.get('value');
                            if (val != null && String.isNotBlank(String.valueOf(val))) {
                                severity = String.valueOf(val);
                            }
                        }
                    }
                }

                System.debug('Record ' + rec.Id + ' (Org: ' + rec.Org_Id__c + ') -> participantId: ' + participantId + ' | severity: ' + severity);

                Id participantIdSafe = null;
                if (String.isNotBlank(participantId) && (participantId.length() == 15 || participantId.length() == 18)) {
                    try {
                        participantIdSafe = (Id) participantId;
                    } catch (Exception e) {
                        System.debug('Invalid Id format on record ' + rec.Id + ': ' + participantId);
                    }
                }

                Incident_Register_Response__c updateRec = new Incident_Register_Response__c(Id = rec.Id);
                Boolean needsUpdate = false;
				
                if (rec.Severity__c == null && severity != null) {
                    updateRec.Severity__c = severity;
                    needsUpdate = true;
                }
                if (rec.Participant__c == null && participantIdSafe != null) {
                    pendingParticipantIds.put(rec.Id, participantIdSafe);
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    toUpdate.add(updateRec);
                }

            } catch (Exception e) {
                System.debug('Error processing record ' + rec.Id + ': ' + e.getMessage());
            }
        }
        
		if (!pendingParticipantIds.isEmpty()) {
            Set<Id> validParticipantIds = new Set<Id>();
            for (Client__c p : [SELECT Id FROM Client__c WHERE Id IN :pendingParticipantIds.values()]) {
                validParticipantIds.add(p.Id);
            }
        
            Map<Id, Incident_Register_Response__c> updateMap = new Map<Id, Incident_Register_Response__c>();
            for (Incident_Register_Response__c u : toUpdate) {
                updateMap.put(u.Id, u);
            }
        
            for (Id recId : pendingParticipantIds.keySet()) {
                Id pId = pendingParticipantIds.get(recId);
                if (validParticipantIds.contains(pId)) {
                    if (updateMap.containsKey(recId)) {
                        updateMap.get(recId).Participant__c = pId;
                    } else {
                        Incident_Register_Response__c u = new Incident_Register_Response__c(Id = recId, Participant__c = pId);
                        toUpdate.add(u);
                        updateMap.put(recId, u);
                    }
                } else {
                    System.debug('SKIPPED — Participant Id does not exist: ' + pId + ' for record ' + recId);
                }
            }
        }
        System.debug('Batch chunk: staged ' + toUpdate.size() + ' of ' + scope.size() + ' records');

        if (toUpdate.isEmpty()) {
            return;
        }

        if (dryRun) {
            for (Incident_Register_Response__c r : toUpdate) {
                System.debug('DRY RUN would update -> Id: ' + r.Id + ' | Participant__c: ' + r.Participant__c + ' | Severity__c: ' + r.Severity__c);
            }
            return;
        }

        Database.SaveResult[] results = Database.update(toUpdate, false);
        for (Integer i = 0; i < results.size(); i++) {
            if (!results[i].isSuccess()) {
                System.debug('Failed to update ' + toUpdate[i].Id + ': ' + results[i].getErrors());
            } else {
                System.debug('Updated ' + toUpdate[i].Id + ' | Participant__c: ' + toUpdate[i].Participant__c + ' | Severity__c: ' + toUpdate[i].Severity__c);
            }
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('Backfill batch complete. Dry run: ' + dryRun);

        Integer remaining = [
            SELECT COUNT()
            FROM Incident_Register_Response__c
            WHERE (Participant__c = null OR Severity__c = null)
            //AND Response_JSON__c != null
        ];
        System.debug('Records still missing Participant__c or Severity__c: ' + remaining);
    }
}